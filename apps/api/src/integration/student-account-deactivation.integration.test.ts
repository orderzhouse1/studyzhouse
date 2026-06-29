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

describeIntegration("Student account deactivation (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `sad${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const email = `student-deactivate-${runId}@studyhouse-integration.test`;
  const adminEmail = `admin-deactivate-${runId}@studyhouse-integration.test`;
  const password = "StudentDeactivateTest123!";

  let studentId: string;

  async function loginAgent(targetEmail: string) {
    const agent = request.agent(app);
    const res = await agent
      .post(`${base}/auth/login`)
      .send({ email: targetEmail, password });
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
    const student = await prisma.user.create({
      data: {
        email,
        fullName: "Deactivate Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;

    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: "Deactivate Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    const users = await prisma.user.findMany({
      where: { email: { in: [email, adminEmail] } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length) {
      await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it("student can soft-deactivate own account and loses API access", async () => {
    const { agent } = await loginAgent(email);
    const res = await agent
      .post(`${base}/student/account/deactivate`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Account deactivated successfully");

    const user = await prisma.user.findUnique({ where: { id: studentId } });
    expect(user?.status).toBe(UserStatus.DELETED);

    const profileRes = await agent.get(`${base}/student/profile`);
    expect(profileRes.status).toBe(401);
  });

  it("rejects login after deactivation", async () => {
    const res = await request(app)
      .post(`${base}/auth/login`)
      .send({ email, password });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("ACCOUNT_DELETED");
  });

  it("admin can restore deactivated student", async () => {
    const { agent } = await loginAgent(adminEmail);
    const patchRes = await agent
      .patch(`${base}/admin/students/${studentId}`)
      .send({ status: "ACTIVE" });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.student.status).toBe("ACTIVE");

    const loginRes = await request(app)
      .post(`${base}/auth/login`)
      .send({ email, password });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.status).toBe("ACTIVE");
  });
});
