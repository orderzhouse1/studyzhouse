import { randomBytes } from "node:crypto";

import {
  AuditLogSeverity,
  UserRole,
  UserStatus,
} from "@prisma/client";
import argon2 from "argon2";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";

import { API_VERSION, apiBasePath } from "@studyhouse/shared";
import { applyIntegrationProcessEnv } from "../test/integrationEnv.js";
import { writeAuditLog } from "../services/audit.service.js";

const hasTestDb = Boolean(
  process.env.TEST_DATABASE_URL &&
    process.env.TEST_DATABASE_URL.length > 0,
);

const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration("Enhanced audit logs API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `al${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    admin: `admin-audit-${runId}@studyhouse-integration.test`,
    superAdmin: `super-audit-${runId}@studyhouse-integration.test`,
    student: `student-audit-${runId}@studyhouse-integration.test`,
  };
  const password = "AuditLogsTest123!";

  let adminId: string;
  let superAdminId: string;
  let seededLogId: string;

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
    const [admin, superAdmin, student] = await Promise.all([
      prisma.user.create({
        data: {
          email: emails.admin,
          fullName: "Audit Admin",
          passwordHash: hash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          email: emails.superAdmin,
          fullName: "Audit Super",
          passwordHash: hash,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      }),
      prisma.user.create({
        data: {
          email: emails.student,
          fullName: "Audit Student",
          passwordHash: hash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
      }),
    ]);
    adminId = admin.id;
    superAdminId = superAdmin.id;

    await writeAuditLog({
      actorId: adminId,
      action: "TEST_AUDIT_ENHANCED",
      entityType: "TestEntity",
      entityId: `entity-${runId}`,
      severity: AuditLogSeverity.WARNING,
      beforeJson: { status: "OLD" },
      afterJson: { status: "NEW" },
      metadata: { runId, password: "must-be-redacted" },
    });

    const seeded = await prisma.auditLog.findFirst({
      where: { action: "TEST_AUDIT_ENHANCED", actorId: adminId },
      orderBy: { createdAt: "desc" },
    });
    if (!seeded) {
      throw new Error("Failed to seed audit log");
    }
    seededLogId = seeded.id;
  }, 120_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorId: { in: [adminId, superAdminId] } },
          { action: "TEST_AUDIT_ENHANCED" },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [emails.admin, emails.superAdmin, emails.student],
        },
      },
    });
    await prisma.$disconnect();
  }, 120_000);

  it("rejects unauthenticated audit log list", async () => {
    const res = await request(app).get(`${base}/admin/audit-logs`);
    expect(res.status).toBe(401);
  });

  it("rejects student from admin audit logs", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.get(`${base}/admin/audit-logs`);
    expect(res.status).toBe(403);
  });

  it("allows admin to list audit logs with severity filter", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent
      .get(
        `${base}/admin/audit-logs?page=1&pageSize=20&action=TEST_AUDIT_ENHANCED&severity=WARNING`,
      )
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const ids = (res.body.data.items as { id: string }[]).map((i) => i.id);
    expect(ids).toContain(seededLogId);
    const row = (
      res.body.data.items as Array<{
        id: string;
        severity: string;
      }>
    ).find((i) => i.id === seededLogId);
    expect(row?.severity).toBe("WARNING");
  });

  it("allows admin to fetch audit log detail with before/after json", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent
      .get(`${base}/admin/audit-logs/${seededLogId}`)
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(200);
    expect(res.body.data.beforeJson).toEqual({ status: "OLD" });
    expect(res.body.data.afterJson).toEqual({ status: "NEW" });
  });

  it("sanitizes sensitive metadata in audit log detail", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent
      .get(`${base}/admin/audit-logs/${seededLogId}`)
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(200);
    expect(res.body.data.metadata?.password).toBe("[مخفي]");
    expect(res.body.data.metadata?.runId).toBe(runId);
  });

  it("allows super admin to list audit logs via super-admin route", async () => {
    const agent = await loginAgent(emails.superAdmin);
    const res = await agent
      .get(`${base}/super-admin/audit-logs?page=1&pageSize=10&action=TEST_AUDIT`)
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects admin from super-admin-only routes", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent
      .get(`${base}/super-admin/overview`)
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(403);
  });
});
