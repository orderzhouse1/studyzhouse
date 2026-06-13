import { randomBytes } from "node:crypto";

import {
  CourseReviewStatus,
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  LessonStatus,
  PaymentRequestStatus,
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

describeIntegration("Admin analytics API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `an${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    admin: `admin-analytics-${runId}@studyhouse-integration.test`,
    student: `student-analytics-${runId}@studyhouse-integration.test`,
  };
  const password = "AdminAnalyticsTest123!";

  let adminId: string;
  let studentId: string;
  let courseId: string;

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
    const admin = await prisma.user.create({
      data: {
        email: emails.admin,
        fullName: "Analytics Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    const student = await prisma.user.create({
      data: {
        email: emails.student,
        fullName: "Analytics Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;
    studentId = student.id;

    await prisma.studentProfile.create({
      data: {
        userId: studentId,
        country: "الأردن",
        onboardingCompletedAt: new Date(),
      },
    });

    const course = await prisma.course.create({
      data: {
        title: `Analytics Course ${runId}`,
        slug: `analytics-course-${runId}`,
        description: "كورس لاختبار التحليلات",
        status: CourseStatus.PUBLISHED,
        pricingType: PricingType.FREE,
        createdById: adminId,
        publishedAt: new Date(),
      },
    });
    courseId = course.id;

    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title: "Lesson A",
        status: LessonStatus.PUBLISHED,
        sortOrder: 0,
      },
    });

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        source: EnrollmentSource.FREE,
        status: EnrollmentStatus.ACTIVE,
        progressPercent: 50,
      },
    });

    await prisma.lessonProgress.create({
      data: {
        enrollmentId: enrollment.id,
        studentId,
        courseId,
        lessonId: lesson.id,
        watchedSeconds: 120,
        isCompleted: true,
        completedAt: new Date(),
        lastWatchedAt: new Date(),
      },
    });

    await prisma.courseReview.create({
      data: {
        courseId,
        studentId,
        rating: 5,
        status: CourseReviewStatus.PUBLISHED,
        comment: "ممتاز",
      },
    });

    await prisma.paymentRequest.create({
      data: {
        studentId,
        courseId,
        amount: 10,
        currency: "JOD",
        status: PaymentRequestStatus.PENDING,
      },
    });
  }, 120_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.paymentRequest.deleteMany({ where: { studentId } });
    await prisma.courseReview.deleteMany({ where: { studentId } });
    await prisma.lessonProgress.deleteMany({ where: { studentId } });
    await prisma.enrollment.deleteMany({ where: { studentId } });
    await prisma.lesson.deleteMany({ where: { courseId } });
    await prisma.course.deleteMany({ where: { id: courseId } });
    await prisma.studentProfile.deleteMany({ where: { userId: studentId } });
    await prisma.user.deleteMany({
      where: { email: { in: [emails.admin, emails.student] } },
    });
    await prisma.$disconnect();
  }, 120_000);

  it("rejects unauthenticated analytics overview", async () => {
    const res = await request(app).get(`${base}/admin/analytics/overview`);
    expect(res.status).toBe(401);
  });

  it("rejects student from admin analytics", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.get(`${base}/admin/analytics/overview`);
    expect(res.status).toBe(403);
  });

  it("returns overview counts including seeded student and course", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent
      .get(`${base}/admin/analytics/overview`)
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalPublishedCourses).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalEnrollments).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pendingPaymentRequests).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pendingReviews).toBeGreaterThanOrEqual(0);
  });

  it("returns courses analytics with enrollments and reviews", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/admin/analytics/courses`);
    expect(res.status).toBe(200);
    const row = (
      res.body.data.allCourses as Array<{ courseId: string; enrollmentCount: number; reviewCount: number }>
    ).find((c) => c.courseId === courseId);
    expect(row).toBeTruthy();
    expect(row?.enrollmentCount).toBeGreaterThanOrEqual(1);
    expect(row?.reviewCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.topByEnrollments.length).toBeGreaterThan(0);
  });

  it("students analytics counts only student role data", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/admin/analytics/students`);
    expect(res.status).toBe(200);
    expect(res.body.data.newStudents7d).toBeGreaterThanOrEqual(1);
    expect(res.body.data.activeStudents7d).toBeGreaterThanOrEqual(1);
    const countries = res.body.data.countryDistribution as Array<{
      country: string;
      count: number;
    }>;
    expect(countries.some((c) => c.country === "الأردن")).toBe(true);
    const leaders = res.body.data.topProgressStudents as Array<{
      studentId: string;
    }>;
    expect(leaders.some((s) => s.studentId === studentId)).toBe(true);
    expect(leaders.every((s) => s.studentId !== adminId)).toBe(true);
  });

  it("engagement analytics returns grouped series safely", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/admin/analytics/engagement?days=30`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalLessonProgressRecords).toBeGreaterThanOrEqual(1);
    expect(res.body.data.completedLessonsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.enrollmentsByDay).toHaveLength(30);
    expect(res.body.data.reviewsByDay).toHaveLength(30);
    expect(res.body.data.paymentRequestsByDay).toHaveLength(30);
    const today = new Date().toISOString().slice(0, 10);
    const enrollToday = res.body.data.enrollmentsByDay.find(
      (d: { date: string; count: number }) => d.date === today,
    );
    expect(enrollToday?.count).toBeGreaterThanOrEqual(1);
  });
});
