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

import { API_VERSION, apiBasePath } from "@studyhouse/shared";
import { applyIntegrationProcessEnv } from "../test/integrationEnv.js";

const hasTestDb = Boolean(
  process.env.TEST_DATABASE_URL &&
    process.env.TEST_DATABASE_URL.length > 0,
);

const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration("Lesson notes API (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `ln${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-notes-${runId}@studyhouse-integration.test`,
    admin: `admin-notes-${runId}@studyhouse-integration.test`,
  };
  const password = "LessonNotesTest123!";

  let studentId: string;
  let adminId: string;
  let courseId: string;
  let lessonId: string;

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
        fullName: "Notes Student",
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    const admin = await prisma.user.create({
      data: {
        email: emails.admin,
        fullName: "Notes Admin",
        passwordHash: hash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    studentId = student.id;
    adminId = admin.id;

    const course = await prisma.course.create({
      data: {
        title: `Notes course ${runId}`,
        slug: `notes-course-${runId}`,
        description: "Integration test course for lesson notes.",
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
        title: "Lesson 1",
        status: LessonStatus.PUBLISHED,
        sortOrder: 0,
        youtubeVideoId: "dQw4w9WgXcQ",
      },
    });
    lessonId = lesson.id;

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
    await prisma.lessonNote.deleteMany({ where: { studentId } });
    await prisma.enrollment.deleteMany({ where: { studentId } });
    await prisma.lesson.deleteMany({ where: { courseId } });
    await prisma.course.deleteMany({ where: { id: courseId } });
    await prisma.user.deleteMany({
      where: { email: { in: [emails.student, emails.admin] } },
    });
    await prisma.$disconnect();
  }, 120_000);

  it("rejects unauthenticated note list", async () => {
    const res = await request(app).get(
      `${base}/student/lessons/${lessonId}/notes`,
    );
    expect(res.status).toBe(401);
  });

  it("rejects admin on student notes endpoint", async () => {
    const agent = await loginAgent(emails.admin);
    const res = await agent.get(`${base}/student/lessons/${lessonId}/notes`);
    expect(res.status).toBe(403);
  });

  it("creates, lists, patches, and deletes lesson notes", async () => {
    const agent = await loginAgent(emails.student);

    const created = await agent
      .post(`${base}/student/lessons/${lessonId}/notes`)
      .set("Origin", "http://localhost:3000")
      .send({ body: "ملاحظة عند الدقيقة 2", timestampSeconds: 120 });
    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.body).toBe("ملاحظة عند الدقيقة 2");
    expect(created.body.data.timestampSeconds).toBe(120);
    const noteId = created.body.data.id as string;

    const list = await agent.get(
      `${base}/student/lessons/${lessonId}/notes`,
    );
    expect(list.status).toBe(200);
    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.items[0].id).toBe(noteId);

    const patched = await agent
      .patch(`${base}/student/lesson-notes/${noteId}`)
      .set("Origin", "http://localhost:3000")
      .send({ body: "ملاحظة محدّثة" });
    expect(patched.status).toBe(200);
    expect(patched.body.data.body).toBe("ملاحظة محدّثة");

    const deleted = await agent
      .delete(`${base}/student/lesson-notes/${noteId}`)
      .set("Origin", "http://localhost:3000");
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.deleted).toBe(true);

    const empty = await agent.get(
      `${base}/student/lessons/${lessonId}/notes`,
    );
    expect(empty.status).toBe(200);
    expect(empty.body.data.items).toHaveLength(0);
  });

  it("writes audit logs for note create/update/delete", async () => {
    const agent = await loginAgent(emails.student);

    const created = await agent
      .post(`${base}/student/lessons/${lessonId}/notes`)
      .send({ body: "audit trail note" });
    expect(created.status).toBe(201);
    const noteId = created.body.data.id as string;

    await agent
      .patch(`${base}/student/lesson-notes/${noteId}`)
      .send({ body: "audit trail updated" });
    await agent.delete(`${base}/student/lesson-notes/${noteId}`);

    const logs = await prisma.auditLog.findMany({
      where: {
        actorId: studentId,
        entityType: "LessonNote",
        action: {
          in: [
            "LESSON_NOTE_CREATE",
            "LESSON_NOTE_UPDATE",
            "LESSON_NOTE_DELETE",
          ],
        },
      },
      orderBy: { createdAt: "asc" },
    });
    expect(logs.length).toBeGreaterThanOrEqual(3);
    expect(logs.some((l) => l.afterJson != null)).toBe(true);
    expect(logs.some((l) => l.beforeJson != null)).toBe(true);
  });
});
