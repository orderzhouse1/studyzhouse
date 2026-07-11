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
import {
  applyIntegrationProcessEnv,
  ensureIntegrationDatabaseReady,
} from "../test/integrationEnv.js";

const hasTestDb = Boolean(
  process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL.length > 0,
);

const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration("iOS learning companion access (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `ios${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const email = `student-ios-${runId}@studyhouse-integration.test`;
  const password = "StudentIosTest12345!";

  let studentToken: string;
  let categoryId: string;
  let paidCourseId: string;
  let paidCourseSlug: string;
  let freeCourseSlug: string;
  let adminId: string;

  beforeAll(async () => {
    applyIntegrationProcessEnv();
    const { resetEnvCache } = await import("../config/env.js");
    resetEnvCache();
    const { createApp } = await import("../app.js");
    const { prisma: p } = await import("../lib/prisma.js");
    prisma = p;
    await ensureIntegrationDatabaseReady(prisma);
    app = createApp();
    base = apiBasePath(API_VERSION);

    const hash = await argon2.hash(password);
    const admin = await prisma.user.create({
      data: {
        email: `admin-ios-${runId}@studyhouse-integration.test`,
        fullName: "iOS Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    adminId = admin.id;

    const student = await prisma.user.create({
      data: {
        email,
        fullName: "iOS Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });

    const category = await prisma.category.create({
      data: {
        name: `iOS Cat ${runId}`,
        slug: `ios-cat-${runId}`,
      },
    });
    categoryId = category.id;

    const freeCourse = await prisma.course.create({
      data: {
        title: `Free Course ${runId}`,
        slug: `free-course-${runId}`,
        description: "Free course for iOS catalog.",
        pricingType: PricingType.FREE,
        currency: "JOD",
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
        categoryId,
        createdById: adminId,
      },
    });
    freeCourseSlug = freeCourse.slug;

    const paidCourse = await prisma.course.create({
      data: {
        title: `Paid Course ${runId}`,
        slug: `paid-course-${runId}`,
        description: "Paid course enrolled elsewhere.",
        pricingType: PricingType.PAID,
        price: 9.99,
        currency: "JOD",
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
        categoryId,
        createdById: adminId,
      },
    });
    paidCourseId = paidCourse.id;
    paidCourseSlug = paidCourse.slug;

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: paidCourseId,
        status: EnrollmentStatus.ACTIVE,
        source: EnrollmentSource.MANUAL_ADMIN,
      },
    });

    const login = await request(app)
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email, password });
    studentToken = login.body.data.accessToken;
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.enrollment.deleteMany({
      where: { course: { slug: { contains: runId } } },
    });
    await prisma.course.deleteMany({
      where: { slug: { contains: runId } },
    });
    await prisma.category.deleteMany({
      where: { slug: { contains: runId } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: runId } },
    });
    await prisma.$disconnect();
  });

  it("iOS catalog lists free courses only", async () => {
    const res = await request(app)
      .get(`${base}/courses`)
      .query({ page: 1, pageSize: 50 })
      .set("Authorization", `Bearer ${studentToken}`)
      .set("X-Client-Platform", "ios");

    expect(res.status).toBe(200);
    const items = res.body.data.items as Array<{
      slug: string;
      pricingType: string;
    }>;
    expect(items.some((i) => i.slug === freeCourseSlug)).toBe(true);
    expect(items.some((i) => i.slug === paidCourseSlug)).toBe(false);
    expect(items.every((i) => i.pricingType === "FREE")).toBe(true);
  });

  it("iOS cannot load non-enrolled paid course detail", async () => {
    await prisma.enrollment.deleteMany({
      where: { courseId: paidCourseId, student: { email } },
    });

    const res = await request(app)
      .get(`${base}/courses/${paidCourseSlug}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .set("X-Client-Platform", "ios");

    expect(res.status).toBe(404);

    await prisma.enrollment.create({
      data: {
        studentId: (await prisma.user.findFirstOrThrow({ where: { email } })).id,
        courseId: paidCourseId,
        status: EnrollmentStatus.ACTIVE,
        source: EnrollmentSource.MANUAL_ADMIN,
      },
    });
  });

  it("iOS enrolled paid course detail and access succeed", async () => {
    const detail = await request(app)
      .get(`${base}/courses/${paidCourseSlug}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .set("X-Client-Platform", "ios");
    expect(detail.status).toBe(200);
    expect(detail.body.data.course.slug).toBe(paidCourseSlug);

    const access = await request(app)
      .get(`${base}/student/courses/${paidCourseSlug}/access`)
      .set("Authorization", `Bearer ${studentToken}`)
      .set("X-Client-Platform", "ios");
    expect(access.status).toBe(200);
    expect(access.body.data.isEnrolled).toBe(true);
  });

  it("iOS my-courses includes enrolled paid course", async () => {
    const res = await request(app)
      .get(`${base}/student/my-courses`)
      .set("Authorization", `Bearer ${studentToken}`)
      .set("X-Client-Platform", "ios");

    expect(res.status).toBe(200);
    const items = res.body.data.items as Array<{
      course: { slug: string };
    }>;
    expect(items.some((i) => i.course.slug === paidCourseSlug)).toBe(true);
  });

  it("Android still sees paid course in catalog", async () => {
    const res = await request(app)
      .get(`${base}/courses/${paidCourseSlug}`)
      .set("Authorization", `Bearer ${studentToken}`)
      .set("X-Client-Platform", "android");

    expect(res.status).toBe(200);
    expect(res.body.data.course.pricingType).toBe("PAID");
  });
});
