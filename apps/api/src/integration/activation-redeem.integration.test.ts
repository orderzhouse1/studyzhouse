import { randomBytes } from "node:crypto";

import {
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  LessonStatus,
  PricingType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import argon2 from "argon2";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";
import type { Agent } from "supertest";

import { API_VERSION, apiBasePath } from "@studyhouse/shared";
import {
  applyIntegrationProcessEnv,
  ensureIntegrationDatabaseReady,
  hasIntegrationTestDatabase,
} from "../test/integrationEnv.js";

const describeIntegration = hasIntegrationTestDatabase() ? describe : describe.skip;

describeIntegration("Activation code redeem (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `acr${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    admin: `admin-redeem-${runId}@studyhouse-integration.test`,
    student1: `student1-redeem-${runId}@studyhouse-integration.test`,
    student2: `student2-redeem-${runId}@studyhouse-integration.test`,
  };
  const password = "ActivationRedeemTest123!";

  let adminId: string;
  let courseId: string;
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

  async function createCode(adminAgent: Agent, usageLimit: number) {
    const created = await adminAgent
      .post(`${base}/admin/activation-codes`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId,
        usageLimit,
        count: 1,
      });
    expect(created.status).toBe(201);
    return {
      id: created.body.data.codes[0].id as string,
      plain: created.body.data.codes[0].code as string,
    };
  }

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
    await prisma.user.createMany({
      data: [
        {
          email: emails.admin,
          fullName: "Redeem Admin",
          passwordHash: hash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          email: emails.student1,
          fullName: "Redeem Student 1",
          passwordHash: hash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
        {
          email: emails.student2,
          fullName: "Redeem Student 2",
          passwordHash: hash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
      ],
    });

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: emails.admin },
    });
    adminId = admin.id;
    await prisma.adminProfile.create({
      data: { userId: adminId, jobTitle: "Redeem test" },
    });

    const category = await prisma.category.create({
      data: {
        name: `Redeem cat ${runId}`,
        slug: `redeem-cat-${runId}`,
      },
    });
    categoryId = category.id;

    const course = await prisma.course.create({
      data: {
        title: `Redeem course ${runId}`,
        slug: `redeem-course-${runId}`,
        description: "Paid course for activation redeem stability tests.",
        status: CourseStatus.PUBLISHED,
        pricingType: PricingType.PAID,
        price: 25,
        currency: "JOD",
        categoryId,
        createdById: adminId,
        publishedAt: new Date(),
      },
    });
    courseId = course.id;

    const section = await prisma.courseSection.create({
      data: { courseId, title: "Section", sortOrder: 0 },
    });
    await prisma.lesson.create({
      data: {
        courseId,
        sectionId: section.id,
        title: "Lesson",
        youtubeVideoId: "dQw4w9WgXcQ",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sortOrder: 0,
        status: LessonStatus.PUBLISHED,
      },
    });
  }, 120_000);

  afterAll(async () => {
    if (!prisma) return;
    const testEmails = Object.values(emails);
    try {
      await prisma.codeRedemption.deleteMany({
        where: { student: { email: { in: testEmails } } },
      });
      await prisma.activationCode.deleteMany({ where: { courseId } });
      await prisma.enrollment.deleteMany({
        where: { courseId, student: { email: { in: testEmails } } },
      });
      await prisma.lesson.deleteMany({ where: { courseId } });
      await prisma.courseSection.deleteMany({ where: { courseId } });
      await prisma.course.deleteMany({ where: { id: courseId } });
      await prisma.category.deleteMany({ where: { id: categoryId } });
      await prisma.adminProfile.deleteMany({ where: { userId: adminId } });
      await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    } finally {
      await prisma.$disconnect();
    }
  }, 120_000);

  async function clearStudentRedeemState() {
    const studentEmails = [emails.student1, emails.student2];
    await prisma.codeRedemption.deleteMany({
      where: {
        courseId,
        student: { email: { in: studentEmails } },
      },
    });
    await prisma.enrollment.deleteMany({
      where: {
        courseId,
        student: { email: { in: studentEmails } },
      },
    });
  }

  it("redeems a valid code and creates ACTIVE enrollment", async () => {
    const adminAgent = await loginAgent(emails.admin);
    const { plain } = await createCode(adminAgent, 2);

    const studentAgent = await loginAgent(emails.student1);
    const redeem = await studentAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(redeem.status).toBe(200);
    expect(redeem.body.data.enrollment.status).toBe("ACTIVE");

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        student: { email: emails.student1 },
        courseId,
      },
    });
    expect(enrollment?.source).toBe(EnrollmentSource.ACTIVATION_CODE);
    expect(enrollment?.status).toBe(EnrollmentStatus.ACTIVE);
  });

  it("returns ALREADY_REDEEMED when the same student redeems twice", async () => {
    await clearStudentRedeemState();
    const adminAgent = await loginAgent(emails.admin);
    const { plain } = await createCode(adminAgent, 2);

    const studentAgent = await loginAgent(emails.student2);
    const first = await studentAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(first.status).toBe(200);

    const dup = await studentAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(dup.status).toBe(409);
    expect(dup.body?.error?.code).toBe("ALREADY_REDEEMED");
  });

  it("returns CODE_DEPLETED after a single-use code is consumed", async () => {
    await clearStudentRedeemState();
    const adminAgent = await loginAgent(emails.admin);
    const { plain } = await createCode(adminAgent, 1);

    const student1Agent = await loginAgent(emails.student1);
    const first = await student1Agent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(first.status).toBe(200);

    const student2Agent = await loginAgent(emails.student2);
    const second = await student2Agent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(second.status).toBe(400);
    expect(second.body?.error?.code).toBe("CODE_DEPLETED");
  });

  it("returns CODE_INACTIVE for a disabled code", async () => {
    const adminAgent = await loginAgent(emails.admin);
    const { id, plain } = await createCode(adminAgent, 5);

    await adminAgent
      .post(`${base}/admin/activation-codes/${id}/disable`)
      .set("Origin", "http://localhost:3000")
      .send({});

    const studentAgent = await loginAgent(emails.student2);
    const res = await studentAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe("CODE_INACTIVE");
  });

  it("returns INVALID_CODE for unknown code", async () => {
    const studentAgent = await loginAgent(emails.student1);
    const res = await studentAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: "ZZZZ-ZZZZ-ZZZZ" });
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe("INVALID_CODE");
  });
});

if (!hasIntegrationTestDatabase()) {
  describe("Integration tests skipped", () => {
    it("Set TEST_DATABASE_URL to a dedicated Postgres database before running pnpm test:api.", () => {
      expect(process.env.TEST_DATABASE_URL).toBeFalsy();
    });
  });
}
