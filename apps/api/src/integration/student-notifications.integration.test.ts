import { randomBytes } from "node:crypto";

import {
  CourseStatus,
  NotificationType,
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
import { createNotification } from "../services/notification.service.js";

const hasTestDb = Boolean(
  process.env.TEST_DATABASE_URL &&
    process.env.TEST_DATABASE_URL.length > 0,
);

const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration("Student notifications API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `ntf${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-notif-${runId}@studyhouse-integration.test`,
    admin: `admin-notif-${runId}@studyhouse-integration.test`,
  };
  const password = "StudentNotifTest123!";

  let studentId: string;
  let adminId: string;

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
        fullName: "Notif Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    const admin = await prisma.user.create({
      data: {
        email: emails.admin,
        fullName: "Notif Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;
    adminId = admin.id;

    await createNotification({
      userId: studentId,
      type: NotificationType.SYSTEM,
      title: "إشعار تجريبي",
      body: "نص الإشعار",
      actionUrl: "/student",
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
      await prisma.notification.deleteMany({
        where: { userId: { in: ids } },
      });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.$disconnect();
  });

  it("lists own notifications for student", async () => {
    const agent = await loginAgent(emails.student);
    const res = await agent.get(`${base}/student/notifications`);
    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it("marks a notification as read", async () => {
    const agent = await loginAgent(emails.student);
    const list = await agent.get(`${base}/student/notifications`);
    const id = list.body.data.items[0].id as string;
    const res = await agent.post(`${base}/student/notifications/${id}/read`);
    expect(res.status).toBe(200);
    expect(res.body.data.notification.readAt).toBeTruthy();
  });

  it("marks all notifications as read", async () => {
    await createNotification({
      userId: studentId,
      type: NotificationType.SYSTEM,
      title: "آخر",
      body: "غير مقروء",
    });
    const agent = await loginAgent(emails.student);
    const res = await agent.post(`${base}/student/notifications/read-all`);
    expect(res.status).toBe(200);
    const list = await agent.get(`${base}/student/notifications`);
    expect(
      list.body.data.items.every(
        (n: { readAt: string | null }) => n.readAt != null,
      ),
    ).toBe(true);
  });

  it("rejects admin from student notifications endpoint", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/student/notifications`);
    expect(res.status).toBe(403);
  });

  it("creates notification when payment is approved", async () => {
    const category = await prisma.category.create({
      data: {
        name: `Cat ${runId}`,
        slug: `cat-${runId}`,
        description: "test",
      },
    });
    const course = await prisma.course.create({
      data: {
        title: `Course ${runId}`,
        slug: `course-${runId}`,
        description: "desc",
        status: CourseStatus.PUBLISHED,
        pricingType: PricingType.PAID,
        price: 10,
        currency: "JOD",
        categoryId: category.id,
        createdById: adminId,
        publishedAt: new Date(),
      },
    });
    const pr = await prisma.paymentRequest.create({
      data: {
        studentId,
        courseId: course.id,
        amount: 10,
        currency: "JOD",
        transactionReference: `ref-${runId}`,
        status: "PENDING",
      },
    });

    const adminAgent = await loginAgent(emails.admin);
    const approve = await adminAgent.post(
      `${base}/admin/payment-requests/${pr.id}/approve`,
    );
    expect(approve.status).toBe(200);

    const notifs = await prisma.notification.findMany({
      where: {
        userId: studentId,
        type: NotificationType.PAYMENT_APPROVED,
      },
    });
    expect(notifs.length).toBeGreaterThanOrEqual(1);

    await prisma.paymentRequest.deleteMany({ where: { id: pr.id } });
    await prisma.enrollment.deleteMany({
      where: { studentId, courseId: course.id },
    });
    await prisma.notification.deleteMany({
      where: { userId: studentId, type: NotificationType.PAYMENT_APPROVED },
    });
    await prisma.course.delete({ where: { id: course.id } });
    await prisma.category.delete({ where: { id: category.id } });
  });
});
