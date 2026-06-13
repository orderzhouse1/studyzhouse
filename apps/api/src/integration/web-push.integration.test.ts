import { randomBytes } from "node:crypto";

import {
  NotificationType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import argon2 from "argon2";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Express } from "express";

import { API_VERSION, apiBasePath } from "@studyhouse/shared";
import { applyIntegrationProcessEnv } from "../test/integrationEnv.js";

const sendNotificationMock = vi.fn().mockResolvedValue(undefined);

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
  },
}));

const hasTestDb = Boolean(
  process.env.TEST_DATABASE_URL &&
    process.env.TEST_DATABASE_URL.length > 0,
);

const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration("Web Push API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `wp${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-wp-${runId}@studyhouse-integration.test`,
    admin: `admin-wp-${runId}@studyhouse-integration.test`,
  };
  const password = "WebPushTest123!";
  const endpoint = `https://push.example.com/send/${runId}`;

  let studentId: string;

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
    process.env.WEB_PUSH_PUBLIC_KEY =
      "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
    process.env.WEB_PUSH_PRIVATE_KEY =
      "UUxI4O8-FbRouAevSmBp6s18cNWmfLp8I-lk0azBrAo";
    process.env.WEB_PUSH_SUBJECT = "mailto:test@studyhouse-integration.test";

    const { resetEnvCache } = await import("../config/env.js");
    resetEnvCache();
    const { resetWebPushVapidCache } = await import(
      "../services/webPushConfig.service.js"
    );
    resetWebPushVapidCache();

    const { createApp } = await import("../app.js");
    const { prisma: p } = await import("../lib/prisma.js");
    prisma = p;
    app = createApp();
    base = apiBasePath(API_VERSION);

    const hash = await argon2.hash(password);
    const student = await prisma.user.create({
      data: {
        email: emails.student,
        fullName: "WP Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    await prisma.user.create({
      data: {
        email: emails.admin,
        fullName: "WP Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;
  }, 120_000);

  afterAll(async () => {
    if (!prisma) return;
    await prisma.webPushSubscription.deleteMany({ where: { userId: studentId } });
    await prisma.notification.deleteMany({
      where: { user: { email: { in: [emails.student, emails.admin] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [emails.student, emails.admin] } },
    });
    delete process.env.WEB_PUSH_PUBLIC_KEY;
    delete process.env.WEB_PUSH_PRIVATE_KEY;
    delete process.env.WEB_PUSH_SUBJECT;
    await prisma.$disconnect();
  }, 120_000);

  it("returns public key when configured", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/web-push/public-key`);
    expect(res.status).toBe(200);
    expect(res.body.data.configured).toBe(true);
    expect(res.body.data.publicKey).toBeTruthy();
  });

  it("subscribe saves subscription", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent
      .post(`${base}/student/web-push/subscribe`)
      .send({
        endpoint,
        keys: { p256dh: "key-p256dh-test", auth: "key-auth-test" },
      });
    expect(res.status).toBe(200);
    expect(res.body.data.subscribed).toBe(true);

    const row = await prisma.webPushSubscription.findUnique({
      where: { endpoint },
    });
    expect(row?.isActive).toBe(true);
    expect(row?.userId).toBe(studentId);
  });

  it("subscribe same endpoint updates idempotently", async () => {
    const agent = await loginAgent(emails.student);
    const first = await agent.post(`${base}/student/web-push/subscribe`).send({
      endpoint,
      keys: { p256dh: "updated-p256dh", auth: "updated-auth" },
    });
    expect(first.status).toBe(200);

    const rows = await prisma.webPushSubscription.findMany({
      where: { endpoint },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.p256dh).toBe("updated-p256dh");
  });

  it("unsubscribe deactivates subscription", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent
      .delete(`${base}/student/web-push/unsubscribe`)
      .send({ endpoint });
    expect(res.status).toBe(200);
    expect(res.body.data.unsubscribed).toBe(true);

    const row = await prisma.webPushSubscription.findUnique({
      where: { endpoint },
    });
    expect(row?.isActive).toBe(false);
  });

  it("rejects student from admin notification send", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.post(`${base}/admin/notifications/send`).send({
      target: "ALL_STUDENTS",
      title: "test",
      body: "test",
    });
    expect(res.status).toBe(403);
  });

  it("admin send creates internal notifications", async () => {
    await prisma.webPushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: studentId,
        endpoint,
        p256dh: "k",
        auth: "a",
        isActive: true,
      },
      update: { isActive: true },
    });

    sendNotificationMock.mockResolvedValue(undefined);

    const agent = await loginAgent(emails.admin);
    const res = await agent
      .post(`${base}/admin/notifications/send`)
      .send({
        target: "STUDENT",
        studentId,
        title: "إشعار إداري",
        body: "نص الإشعار",
        actionUrl: "/student/notifications",
        sendWebPush: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.data.totalTargeted).toBe(1);
    expect(res.body.data.notificationsCreated).toBe(1);

    const notif = await prisma.notification.findFirst({
      where: { userId: studentId, title: "إشعار إداري" },
    });
    expect(notif).toBeTruthy();
    expect(notif?.type).toBe(NotificationType.SYSTEM);
  });

  it("does not crash when web push env is missing", async () => {
    delete process.env.WEB_PUSH_PUBLIC_KEY;
    delete process.env.WEB_PUSH_PRIVATE_KEY;
    delete process.env.WEB_PUSH_SUBJECT;
    const { resetEnvCache } = await import("../config/env.js");
    resetEnvCache();
    const { resetWebPushVapidCache } = await import(
      "../services/webPushConfig.service.js"
    );
    resetWebPushVapidCache();

    const agent = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/web-push/public-key`);
    expect(res.status).toBe(200);
    expect(res.body.data.configured).toBe(false);
    expect(res.body.data.publicKey).toBeNull();

    const admin = await loginAgent(emails.admin);
    const send = await admin.post(`${base}/admin/notifications/send`).send({
      target: "STUDENT",
      studentId,
      title: "بدون push",
      body: "نص",
      sendWebPush: true,
    });
    expect(send.status).toBe(200);
    expect(send.body.data.webPushSent).toBe(0);
  });

  it("disables subscription on web-push 410 error", async () => {
    process.env.WEB_PUSH_PUBLIC_KEY =
      "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
    process.env.WEB_PUSH_PRIVATE_KEY =
      "UUxI4O8-FbRouAevSmBp6s18cNWmfLp8I-lk0azBrAo";
    process.env.WEB_PUSH_SUBJECT = "mailto:test@studyhouse-integration.test";
    const { resetEnvCache } = await import("../config/env.js");
    resetEnvCache();
    const { resetWebPushVapidCache } = await import(
      "../services/webPushConfig.service.js"
    );
    resetWebPushVapidCache();

    await prisma.webPushSubscription.updateMany({
      where: { userId: studentId },
      data: { isActive: false },
    });

    await prisma.webPushSubscription.upsert({
      where: { endpoint: `${endpoint}-410` },
      create: {
        userId: studentId,
        endpoint: `${endpoint}-410`,
        p256dh: "k",
        auth: "a",
        isActive: true,
      },
      update: { isActive: true },
    });

    sendNotificationMock.mockRejectedValue({ statusCode: 410 });

    const { sendWebPushToUser } = await import(
      "../services/webPushDelivery.service.js"
    );
    const stats = await sendWebPushToUser(studentId, {
      title: "t",
      body: "b",
    });
    expect(stats.inactiveSubscriptionsDisabled).toBeGreaterThanOrEqual(1);

    const row = await prisma.webPushSubscription.findUnique({
      where: { endpoint: `${endpoint}-410` },
    });
    expect(row?.isActive).toBe(false);
  });
});
