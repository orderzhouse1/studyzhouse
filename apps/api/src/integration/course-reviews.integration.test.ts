import { randomBytes } from "node:crypto";

import {
  CourseReviewStatus,
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

describeIntegration("Course reviews API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `cr${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-reviews-${runId}@studyhouse-integration.test`,
    admin: `admin-reviews-${runId}@studyhouse-integration.test`,
  };
  const password = "CourseReviewsTest123!";

  let studentId: string;
  let adminId: string;
  let courseId: string;
  const courseSlug = `reviews-course-${runId}`;

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
        fullName: "Review Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    const admin = await prisma.user.create({
      data: {
        email: emails.admin,
        fullName: "Review Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;
    adminId = admin.id;

    const course = await prisma.course.create({
      data: {
        title: `Reviews course ${runId}`,
        slug: courseSlug,
        description: "Integration test course for reviews.",
        status: CourseStatus.PUBLISHED,
        pricingType: PricingType.FREE,
        createdById: adminId,
        publishedAt: new Date(),
      },
    });
    courseId = course.id;

    await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        source: EnrollmentSource.FREE,
        status: EnrollmentStatus.ACTIVE,
      },
    });
  }, 120_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.auditLog.deleteMany({
      where: { actorId: { in: [studentId, adminId] } },
    });
    await prisma.courseReview.deleteMany({ where: { courseId } });
    await prisma.enrollment.deleteMany({ where: { studentId } });
    await prisma.course.deleteMany({ where: { id: courseId } });
    await prisma.user.deleteMany({
      where: { email: { in: [emails.student, emails.admin] } },
    });
    await prisma.$disconnect();
  }, 120_000);

  it("returns empty public reviews before admin approval", async () => {
    const studentAgent = await loginAgent(emails.student);

    const created = await studentAgent
      .post(`${base}/student/courses/${courseSlug}/reviews`)
      .set("Origin", "http://localhost:3000")
      .send({
        rating: 5,
        title: "ممتاز",
        comment: "كورس رائع للمبتدئين",
      });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("PENDING");
    const reviewId = created.body.data.id as string;

    const publicList = await request(app).get(
      `${base}/courses/${courseSlug}/reviews?page=1&pageSize=10`,
    );
    expect(publicList.status).toBe(200);
    expect(publicList.body.data.items).toHaveLength(0);
    expect(publicList.body.data.ratingSummary.reviewCount).toBe(0);

    const detail = await request(app).get(`${base}/courses/${courseSlug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.course.reviewCount ?? 0).toBe(0);

    const adminAgent = await loginAgent(emails.admin);
    const pending = await adminAgent
      .get(`${base}/admin/reviews?status=PENDING&page=1&pageSize=20`)
      .set("Origin", "http://localhost:3000");
    expect(pending.status).toBe(200);
    const pendingIds = (pending.body.data.items as { id: string }[]).map(
      (i) => i.id,
    );
    expect(pendingIds).toContain(reviewId);

    const published = await adminAgent
      .patch(`${base}/admin/reviews/${reviewId}/status`)
      .set("Origin", "http://localhost:3000")
      .send({ status: "PUBLISHED" });
    expect(published.status).toBe(200);
    expect(published.body.data.status).toBe("PUBLISHED");

    const publicAfter = await request(app).get(
      `${base}/courses/${courseSlug}/reviews?page=1&pageSize=10`,
    );
    expect(publicAfter.status).toBe(200);
    expect(publicAfter.body.data.items).toHaveLength(1);
    expect(publicAfter.body.data.items[0].rating).toBe(5);
    expect(publicAfter.body.data.ratingSummary.reviewCount).toBe(1);
    expect(publicAfter.body.data.ratingSummary.averageRating).toBe(5);

    const detailAfter = await request(app).get(
      `${base}/courses/${courseSlug}`,
    );
    expect(detailAfter.body.data.course.reviewCount).toBe(1);
    expect(detailAfter.body.data.course.averageRating).toBe(5);
  });

  it("student can read and update own review", async () => {
    const agent = await loginAgent(emails.student);
    const mine = await agent.get(
      `${base}/student/courses/${courseSlug}/my-review`,
    );
    expect(mine.status).toBe(200);
    expect(mine.body.data.review).not.toBeNull();
    const reviewId = mine.body.data.review.id as string;

    const updated = await agent
      .patch(`${base}/student/course-reviews/${reviewId}`)
      .set("Origin", "http://localhost:3000")
      .send({ rating: 4, comment: "تحديث بعد الإكمال" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.rating).toBe(4);
    expect(updated.body.data.status).toBe("PENDING");

    const row = await prisma.courseReview.findUniqueOrThrow({
      where: { id: reviewId },
    });
    expect(row.status).toBe(CourseReviewStatus.PENDING);
  });

  it("rejects duplicate review creation", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent
      .post(`${base}/student/courses/${courseSlug}/reviews`)
      .send({ rating: 3 });
    expect(res.status).toBe(409);
  });

  it("rejects student from admin reviews list", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.get(`${base}/admin/reviews`);
    expect(res.status).toBe(403);
  });
});
