import { randomBytes } from "node:crypto";

import { UserRole, UserStatus } from "@prisma/client";
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

describeIntegration("Student profile API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `sp${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-profile-${runId}@studyhouse-integration.test`,
    admin: `admin-profile-${runId}@studyhouse-integration.test`,
  };
  const password = "StudentProfileTest123!";

  async function loginAgent(email: string) {
    const agent = request.agent(app);
    const res = await agent
      .post(`${base}/auth/login`)
      .send({ email, password });
    expect(res.status).toBe(200);
    return { agent, res };
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
    await prisma.user.createMany({
      data: [
        {
          email: emails.student,
          fullName: "Profile Student",
          passwordHash: hash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
        {
          email: emails.admin,
          fullName: "Profile Admin",
          passwordHash: hash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    const users = await prisma.user.findMany({
      where: { email: { in: [emails.student, emails.admin] } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length) {
      await prisma.studentProfile.deleteMany({
        where: { userId: { in: ids } },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it("returns profile page for new student", async () => {
    const { agent } = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/profile`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.account.email).toBe(emails.student);
    expect(res.body.data.profile.needsOnboarding).toBe(true);
    expect(res.body.data.profile.interests).toEqual([]);
    expect(res.body.data.profile.learningGoals).toEqual([]);
    expect(res.body.data.profile.onboardingCompletedAt).toBeNull();
    expect(res.body.data.account).not.toHaveProperty("passwordHash");
  });

  it("rejects unauthenticated profile access", async () => {
    const res = await request(app).get(`${base}/student/profile`);
    expect(res.status).toBe(401);
  });

  it("rejects admin on student profile endpoint", async () => {
    const { agent } = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/student/profile`);
    expect(res.status).toBe(403);
  });

  it("updates profile and fullName without role/status fields", async () => {
    const { agent } = await loginAgent(emails.student);
    const res = await agent
      .patch(`${base}/student/profile`)
      .send({
        fullName: "اسم محدّث",
        currentLevel: "BEGINNER",
        interests: ["programming"],
        learningGoals: ["skill"],
        country: "الأردن",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.account.fullName).toBe("اسم محدّث");
    expect(res.body.data.profile.currentLevel).toBe("BEGINNER");
    expect(res.body.data.profile.interests).toContain("programming");
    expect(res.body.data.profile.country).toBe("الأردن");
    expect(res.body.data.account).not.toHaveProperty("passwordHash");
  });

  it("ignores role/status in patch body via schema strip — validation rejects unknown", async () => {
    const { agent } = await loginAgent(emails.student);
    const res = await agent
      .patch(`${base}/student/profile`)
      .send({ role: "ADMIN", status: "SUSPENDED" });
    expect(res.status).toBe(400);
  });

  it("completes onboarding and sets onboardingCompletedAt", async () => {
    const { agent } = await loginAgent(emails.student);
    const res = await agent
      .post(`${base}/student/onboarding/complete`)
      .send({
        currentLevel: "INTERMEDIATE",
        interests: ["programming", "university"],
        learningGoals: ["career", "university"],
        weeklyStudyTime: "HOURS_2_5",
      });
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingCompletedAt).toBeTruthy();
    expect(res.body.data.needsOnboarding).toBe(false);
    expect(res.body.data.onboardingSkippedAt).toBeNull();
  });

  it("skip sets onboardingSkippedAt for another student flow", async () => {
    const skipEmail = `skip-${runId}@studyhouse-integration.test`;
    const hash = await argon2.hash(password);
    await prisma.user.create({
      data: {
        email: skipEmail,
        fullName: "Skip Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    const { agent } = await loginAgent(skipEmail);
    const res = await agent.post(`${base}/student/onboarding/skip`).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.onboardingSkippedAt).toBeTruthy();
    expect(res.body.data.needsOnboarding).toBe(false);

    const user = await prisma.user.findUnique({ where: { email: skipEmail } });
    if (user) {
      await prisma.studentProfile.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it("student dashboard still works after profile updates", async () => {
    const { agent } = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/dashboard`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.enrolledCoursesCount).toBe("number");
  });
});
