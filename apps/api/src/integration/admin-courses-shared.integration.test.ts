import { randomBytes } from "node:crypto";

import {
  CourseStatus,
  PricingType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import argon2 from "argon2";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";

import {
  API_VERSION,
  apiBasePath,
} from "@studyhouse/shared";
import { applyIntegrationProcessEnv } from "../test/integrationEnv.js";

const hasTestDb = Boolean(
  process.env.TEST_DATABASE_URL &&
    process.env.TEST_DATABASE_URL.length > 0,
);

const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration("Admin courses shared workspace (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `shared${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    adminA: `admin-a-${runId}@studyhouse-integration.test`,
    adminB: `admin-b-${runId}@studyhouse-integration.test`,
    student: `student-${runId}@studyhouse-integration.test`,
  };
  const passwords = {
    adminA: "AdminASharedTest12345!",
    adminB: "AdminBSharedTest12345!",
    student: "StudentSharedTest12345!",
  };

  let categoryId: string;
  let courseByAdminAId: string;
  let adminAUserId: string;

  beforeAll(async () => {
    applyIntegrationProcessEnv();
    const { resetEnvCache } = await import("../config/env.js");
    resetEnvCache();
    const { createApp } = await import("../app.js");
    const { prisma: p } = await import("../lib/prisma.js");
    prisma = p;
    app = createApp();
    base = apiBasePath(API_VERSION);

    const [hashA, hashB, hashS] = await Promise.all([
      argon2.hash(passwords.adminA),
      argon2.hash(passwords.adminB),
      argon2.hash(passwords.student),
    ]);

    await prisma.user.createMany({
      data: [
        {
          email: emails.adminA,
          fullName: "Admin A Shared",
          passwordHash: hashA,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          email: emails.adminB,
          fullName: "Admin B Shared",
          passwordHash: hashB,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          email: emails.student,
          fullName: "Student Shared",
          passwordHash: hashS,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
      ],
    });

    const adminA = await prisma.user.findUniqueOrThrow({
      where: { email: emails.adminA },
    });
    adminAUserId = adminA.id;
    await prisma.adminProfile.create({
      data: { userId: adminA.id, jobTitle: "A" },
    });
    const adminB = await prisma.user.findUniqueOrThrow({
      where: { email: emails.adminB },
    });
    await prisma.adminProfile.create({
      data: { userId: adminB.id, jobTitle: "B" },
    });

    const cat = await prisma.category.create({
      data: {
        name: `Shared Cat ${runId}`,
        slug: `shared-cat-${runId}`,
      },
    });
    categoryId = cat.id;
  }, 120_000);

  afterAll(async () => {
    try {
      await prisma.course.deleteMany({
        where: { slug: { startsWith: `shared-course-${runId}` } },
      });
      await prisma.category.deleteMany({
        where: { slug: { startsWith: `shared-cat-${runId}` } },
      });
      await prisma.adminProfile.deleteMany({
        where: {
          user: {
            email: { in: [emails.adminA, emails.adminB, emails.student] },
          },
        },
      });
      await prisma.user.deleteMany({
        where: {
          email: { in: [emails.adminA, emails.adminB, emails.student] },
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  }, 120_000);

  async function loginAgent(email: string, password: string) {
    const agent = request.agent(app);
    const res = await agent
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email, password });
    return { agent, res };
  }

  it("Admin A creates a course (createdById = Admin A)", async () => {
    const { agent, res: loginRes } = await loginAgent(
      emails.adminA,
      passwords.adminA,
    );
    expect(loginRes.status).toBe(200);

    const created = await agent
      .post(`${base}/admin/courses`)
      .set("Origin", "http://localhost:3000")
      .send({
        title: `Shared workspace course ${runId}`,
        description: "Course created by admin A for shared workspace test.",
        pricingType: "FREE",
        status: "DRAFT",
        categoryId,
      });
    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.course.createdById).toBe(adminAUserId);

    courseByAdminAId = created.body.data.course.id as string;
  });

  it("Admin B lists all platform courses including Admin A's course", async () => {
    const { agent, res: loginRes } = await loginAgent(
      emails.adminB,
      passwords.adminB,
    );
    expect(loginRes.status).toBe(200);

    const list = await agent
      .get(`${base}/admin/courses?page=1&pageSize=50&search=${encodeURIComponent(runId)}`)
      .set("Origin", "http://localhost:3000");
    expect(list.status).toBe(200);
    const ids = (list.body.data.items as { id: string }[]).map((c) => c.id);
    expect(ids).toContain(courseByAdminAId);
  });

  it("Admin B can open course detail", async () => {
    const { agent, res: loginRes } = await loginAgent(
      emails.adminB,
      passwords.adminB,
    );
    expect(loginRes.status).toBe(200);

    const detail = await agent
      .get(`${base}/admin/courses/${courseByAdminAId}`)
      .set("Origin", "http://localhost:3000");
    expect(detail.status).toBe(200);
    expect(detail.body.data.course.id).toBe(courseByAdminAId);
    expect(detail.body.data.course.createdById).toBe(adminAUserId);
  });

  it("Admin B can update the course", async () => {
    const { agent, res: loginRes } = await loginAgent(
      emails.adminB,
      passwords.adminB,
    );
    expect(loginRes.status).toBe(200);

    const patch = await agent
      .patch(`${base}/admin/courses/${courseByAdminAId}`)
      .set("Origin", "http://localhost:3000")
      .send({
        shortDescription: "Updated by admin B in shared workspace test.",
      });
    expect(patch.status).toBe(200);
    expect(patch.body.data.course.shortDescription).toContain("admin B");
  });

  it("Admin B can manage course structure (section + lesson)", async () => {
    const { agent, res: loginRes } = await loginAgent(
      emails.adminB,
      passwords.adminB,
    );
    expect(loginRes.status).toBe(200);

    const sectionRes = await agent
      .post(`${base}/admin/courses/${courseByAdminAId}/sections`)
      .set("Origin", "http://localhost:3000")
      .send({ title: "Section by B", order: 0 });
    expect(sectionRes.status).toBe(201);
    const sectionId = sectionRes.body.data.course.sections[0].id as string;

    const lessonRes = await agent
      .post(
        `${base}/admin/courses/${courseByAdminAId}/sections/${sectionId}/lessons`,
      )
      .set("Origin", "http://localhost:3000")
      .send({
        title: "Lesson by B",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        order: 0,
      });
    expect(lessonRes.status).toBe(201);

    const structure = await agent
      .get(`${base}/admin/courses/${courseByAdminAId}/structure`)
      .set("Origin", "http://localhost:3000");
    expect(structure.status).toBe(200);
    expect(structure.body.data.course.sections).toHaveLength(1);
    expect(structure.body.data.course.sections[0].lessons).toHaveLength(1);
  });

  it("Admin B can publish when readiness is met", async () => {
    const { agent, res: loginRes } = await loginAgent(
      emails.adminB,
      passwords.adminB,
    );
    expect(loginRes.status).toBe(200);

    const pub = await agent
      .post(`${base}/admin/courses/${courseByAdminAId}/publish`)
      .set("Origin", "http://localhost:3000");
    expect(pub.status).toBe(200);
    expect(pub.body.data.course.status).toBe("PUBLISHED");
  });

  it("SUPER_ADMIN can list and open the same course", async () => {
    const superEmail = `super-${runId}@studyhouse-integration.test`;
    const superPw = "SuperSharedTest12345!";
    await prisma.user.create({
      data: {
        email: superEmail,
        fullName: "Super Shared",
        passwordHash: await argon2.hash(superPw),
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    const { agent, res: loginRes } = await loginAgent(superEmail, superPw);
    expect(loginRes.status).toBe(200);

    const list = await agent
      .get(`${base}/admin/courses?page=1&pageSize=50&search=${encodeURIComponent(runId)}`)
      .set("Origin", "http://localhost:3000");
    expect(list.status).toBe(200);
    const ids = (list.body.data.items as { id: string }[]).map((c) => c.id);
    expect(ids).toContain(courseByAdminAId);

    await prisma.user.delete({ where: { email: superEmail } });
  });

  it("STUDENT cannot access admin courses list", async () => {
    const { agent, res: loginRes } = await loginAgent(
      emails.student,
      passwords.student,
    );
    expect(loginRes.status).toBe(200);
    const r = await agent
      .get(`${base}/admin/courses?page=1&pageSize=20`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(403);
  });

  it("unauthenticated admin courses list returns 401", async () => {
    const r = await request(app)
      .get(`${base}/admin/courses?page=1&pageSize=20`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(401);
  });
});
