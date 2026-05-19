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

describeIntegration("Student purchases API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `pur${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-purchases-${runId}@studyhouse-integration.test`,
    admin: `admin-purchases-${runId}@studyhouse-integration.test`,
  };
  const password = "StudentPurchasesTest123!";

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
          fullName: "Purchases Student",
          passwordHash: hash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
        {
          email: emails.admin,
          fullName: "Purchases Admin",
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
      await prisma.paymentRequest.deleteMany({
        where: { studentId: { in: ids } },
      });
      await prisma.enrollment.deleteMany({
        where: { studentId: { in: ids } },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it("returns empty purchases list for new student", async () => {
    const { agent } = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/purchases`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
  });

  it("rejects unauthenticated purchases access", async () => {
    const res = await request(app).get(`${base}/student/purchases`);
    expect(res.status).toBe(401);
  });

  it("rejects admin on student purchases endpoint", async () => {
    const { agent } = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/student/purchases`);
    expect(res.status).toBe(403);
  });

  it("does not expose sensitive fields in purchase items", async () => {
    const { agent } = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/purchases`);
    expect(res.status).toBe(200);
    const json = JSON.stringify(res.body);
    expect(json).not.toContain("passwordHash");
    expect(json).not.toContain("codeHash");
    expect(json).not.toContain("proofImageUrl");
  });
});
