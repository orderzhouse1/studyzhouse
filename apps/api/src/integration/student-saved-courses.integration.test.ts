import { randomBytes } from "node:crypto";

import {
  CourseStatus,
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

describeIntegration("Student saved courses API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `sav${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-saved-${runId}@studyhouse-integration.test`,
    admin: `admin-saved-${runId}@studyhouse-integration.test`,
  };
  const password = "StudentSavedTest123!";

  let studentId: string;
  let adminId: string;
  let publishedCourseId: string;
  let draftCourseId: string;

  async function loginAgent(email: string) {
    const agent = request.agent(app);
    const res = await agent
      .post(`${base}/auth/login`)
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
        fullName: "Saved Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    const admin = await prisma.user.create({
      data: {
        email: emails.admin,
        fullName: "Saved Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;
    adminId = admin.id;

    const published = await prisma.course.create({
      data: {
        title: `Pub ${runId}`,
        slug: `pub-${runId}`,
        description: "desc",
        status: CourseStatus.PUBLISHED,
        pricingType: PricingType.FREE,
        createdById: adminId,
        publishedAt: new Date(),
      },
    });
    const draft = await prisma.course.create({
      data: {
        title: `Draft ${runId}`,
        slug: `draft-${runId}`,
        description: "desc",
        status: CourseStatus.DRAFT,
        pricingType: PricingType.FREE,
        createdById: adminId,
      },
    });
    publishedCourseId = published.id;
    draftCourseId = draft.id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.studentSavedCourse.deleteMany({
      where: { studentId },
    });
    await prisma.enrollment.deleteMany({ where: { studentId } });
    await prisma.course.deleteMany({
      where: { id: { in: [publishedCourseId, draftCourseId] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [emails.student, emails.admin] } },
    });
    await prisma.$disconnect();
  });

  it("rejects unauthenticated save", async () => {
    const res = await request(app).post(
      `${base}/student/courses/${publishedCourseId}/save`,
    );
    expect(res.status).toBe(401);
  });

  it("rejects admin from student saved endpoint", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/student/saved-courses`);
    expect(res.status).toBe(403);
  });

  it("saves a published course", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.post(
      `${base}/student/courses/${publishedCourseId}/save`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.saved).toBe(true);
  });

  it("duplicate save is safe", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.post(
      `${base}/student/courses/${publishedCourseId}/save`,
    );
    expect(res.status).toBe(200);
  });

  it("lists saved courses", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/saved-courses`);
    expect(res.status).toBe(200);
    expect(
      res.body.data.items.some(
        (i: { courseId: string }) => i.courseId === publishedCourseId,
      ),
    ).toBe(true);
  });

  it("does not create enrollment when saving", async () => {
    const enroll = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: publishedCourseId,
        },
      },
    });
    expect(enroll).toBeNull();
  });

  it("cannot save unpublished course", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.post(
      `${base}/student/courses/${draftCourseId}/save`,
    );
    expect(res.status).toBe(404);
  });

  it("removes saved course", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.delete(
      `${base}/student/courses/${publishedCourseId}/save`,
    );
    expect(res.status).toBe(200);
    const list = await agent.get(`${base}/student/saved-courses`);
    expect(
      list.body.data.items.some(
        (i: { courseId: string }) => i.courseId === publishedCourseId,
      ),
    ).toBe(false);
  });

  it("unsave when not saved is safe", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.delete(
      `${base}/student/courses/${publishedCourseId}/save`,
    );
    expect(res.status).toBe(200);
  });
});
