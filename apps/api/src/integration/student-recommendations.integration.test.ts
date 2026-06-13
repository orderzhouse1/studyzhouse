import { randomBytes } from "node:crypto";

import {
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  PricingType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import argon2 from "argon2";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";

import { API_VERSION, apiBasePath } from "@studyhouse/shared";
import { applyIntegrationProcessEnv } from "../test/integrationEnv.js";

const hasTestDb = Boolean(
  process.env.TEST_DATABASE_URL &&
    process.env.TEST_DATABASE_URL.length > 0,
);

const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration("Student recommendations API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `rec${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-rec-${runId}@studyhouse-integration.test`,
    admin: `admin-rec-${runId}@studyhouse-integration.test`,
  };
  const password = "StudentRecTest123!";

  let studentId: string;
  let adminId: string;
  let enrolledCourseId: string;
  let dismissedCourseId: string;
  let interestCourseId: string;
  let categoryId: string;

  async function loginAgent(email: string) {
    const agent = request.agent(app);
    const res = await agent
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email, password });
    expect(res.status).toBe(200);
    return agent;
  }

  beforeAll(async () => {
    applyIntegrationProcessEnv();
    const { resetEnvCache } = await import("../config/env.js");
    resetEnvCache();
    const { createApp } = await import("../app.js");
    const { prisma: p } = await import("../lib/prisma.js");
    prisma = p;
    app = createApp();
    base = apiBasePath(API_VERSION);

    const hash = await argon2.hash(password);
    const student = await prisma.user.create({
      data: {
        email: emails.student,
        fullName: "Rec Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    const admin = await prisma.user.create({
      data: {
        email: emails.admin,
        fullName: "Rec Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;
    adminId = admin.id;

    await prisma.studentProfile.create({
      data: {
        userId: studentId,
        interests: ["programming"],
        onboardingCompletedAt: new Date(),
      },
    });

    const category = await prisma.category.create({
      data: {
        name: `برمجة ${runId}`,
        slug: `programming-${runId}`,
      },
    });
    categoryId = category.id;

    const enrolled = await prisma.course.create({
      data: {
        title: `Enrolled Java ${runId}`,
        slug: `enrolled-${runId}`,
        description: "كورس مسجل",
        status: CourseStatus.PUBLISHED,
        pricingType: PricingType.FREE,
        createdById: adminId,
        categoryId,
        publishedAt: new Date(),
      },
    });
    enrolledCourseId = enrolled.id;

    const dismissed = await prisma.course.create({
      data: {
        title: `Dismissed Python ${runId}`,
        slug: `dismissed-${runId}`,
        description: "كورس مخفي",
        status: CourseStatus.PUBLISHED,
        pricingType: PricingType.FREE,
        createdById: adminId,
        categoryId,
        publishedAt: new Date(),
      },
    });
    dismissedCourseId = dismissed.id;

    const interestMatch = await prisma.course.create({
      data: {
        title: `برمجة ويب متقدمة ${runId}`,
        slug: `interest-${runId}`,
        description: "كورس برمجة مناسب للاهتمامات",
        status: CourseStatus.PUBLISHED,
        pricingType: PricingType.FREE,
        createdById: adminId,
        categoryId,
        publishedAt: new Date(),
      },
    });
    interestCourseId = interestMatch.id;

    await prisma.enrollment.create({
      data: {
        studentId,
        courseId: enrolledCourseId,
        source: EnrollmentSource.FREE,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    await prisma.courseRecommendationDismissal.create({
      data: { studentId, courseId: dismissedCourseId },
    });
  }, 120_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.courseRecommendationDismissal.deleteMany({
      where: { studentId },
    });
    await prisma.enrollment.deleteMany({ where: { studentId } });
    await prisma.studentProfile.deleteMany({ where: { userId: studentId } });
    await prisma.course.deleteMany({
      where: {
        slug: {
          in: [
            `enrolled-${runId}`,
            `dismissed-${runId}`,
            `interest-${runId}`,
          ],
        },
      },
    });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({
      where: { email: { in: [emails.student, emails.admin] } },
    });
    await prisma.$disconnect();
  }, 120_000);

  it("rejects unauthenticated recommendations", async () => {
    const res = await request(app).get(`${base}/student/recommendations`);
    expect(res.status).toBe(401);
  });

  it("rejects admin from student recommendations", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/student/recommendations`);
    expect(res.status).toBe(403);
  });

  it("excludes enrolled and dismissed courses", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent
      .get(`${base}/student/recommendations?limit=20`)
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(200);
    const ids = (res.body.data.items as { course: { id: string } }[]).map(
      (i) => i.course.id,
    );
    expect(ids).not.toContain(enrolledCourseId);
    expect(ids).not.toContain(dismissedCourseId);
  });

  it("surfaces interest-matched courses with reason", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/recommendations?limit=20`);
    expect(res.status).toBe(200);
    const match = (
      res.body.data.items as Array<{
        course: { id: string };
        reason: string;
      }>
    ).find((i) => i.course.id === interestCourseId);
    expect(match).toBeTruthy();
    expect(match?.reason).toBe("INTEREST");
  });

  it("dismiss is idempotent and hides course from list", async () => {
    const agent = await loginAgent(emails.student);

    const first = await agent
      .post(`${base}/student/recommendations/${interestCourseId}/dismiss`)
      .set("Origin", "http://localhost:3000")
      .send({});
    expect(first.status).toBe(200);
    expect(first.body.data.dismissed).toBe(true);
    expect(first.body.data.alreadyDismissed).toBe(false);

    const second = await agent
      .post(`${base}/student/recommendations/${interestCourseId}/dismiss`)
      .send({});
    expect(second.status).toBe(200);
    expect(second.body.data.alreadyDismissed).toBe(true);

    const list = await agent.get(`${base}/student/recommendations?limit=20`);
    const ids = (list.body.data.items as { course: { id: string } }[]).map(
      (i) => i.course.id,
    );
    expect(ids).not.toContain(interestCourseId);

    const rows = await prisma.courseRecommendationDismissal.findMany({
      where: { studentId, courseId: interestCourseId },
    });
    expect(rows).toHaveLength(1);
  });
});
