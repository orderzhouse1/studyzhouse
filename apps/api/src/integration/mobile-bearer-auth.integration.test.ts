import { randomBytes } from "node:crypto";

import { UserRole, UserStatus } from "@prisma/client";
import argon2 from "argon2";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";

import {
  API_VERSION,
  apiBasePath,
  AUTH_ACCESS_COOKIE_NAME,
} from "@studyhouse/shared";
import { applyIntegrationProcessEnv } from "../test/integrationEnv.js";

const hasTestDb = Boolean(
  process.env.TEST_DATABASE_URL &&
    process.env.TEST_DATABASE_URL.length > 0,
);

const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration("Mobile Bearer auth (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `bearer${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
  const emails = {
    student: `student-bearer-${runId}@studyhouse-integration.test`,
    admin: `admin-bearer-${runId}@studyhouse-integration.test`,
    suspended: `suspended-bearer-${runId}@studyhouse-integration.test`,
  };
  const password = "BearerAuthTest12345!";

  async function loginJson(email: string, passwordPlain: string) {
    return request(app)
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email, password: passwordPlain });
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
          fullName: "Bearer Student",
          passwordHash: hash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
        {
          email: emails.admin,
          fullName: "Bearer Admin",
          passwordHash: hash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          email: emails.suspended,
          fullName: "Bearer Suspended",
          passwordHash: hash,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.user.deleteMany({
      where: { email: { in: Object.values(emails) } },
    });
    await prisma.$disconnect();
  });

  it("login sets HttpOnly cookie and returns accessToken", async () => {
    const res = await loginJson(emails.student, password);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(emails.student);
    expect(typeof res.body.data.accessToken).toBe("string");
    expect(res.body.data.accessToken.length).toBeGreaterThan(20);

    const raw = res.headers["set-cookie"];
    const joined = Array.isArray(raw) ? raw.join(";") : String(raw ?? "");
    expect(joined).toContain(AUTH_ACCESS_COOKIE_NAME);
    expect(joined.toLowerCase()).toContain("httponly");

    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/passwordHash/i);
  });

  it("GET /auth/me works with cookie session", async () => {
    const agent = request.agent(app);
    await agent
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email: emails.student, password });

    const me = await agent
      .get(`${base}/auth/me`)
      .set("Origin", "http://localhost:3000");
    expect(me.status).toBe(200);
    expect(me.body.data.user.role).toBe("STUDENT");
  });

  it("GET /auth/me works with Authorization Bearer", async () => {
    const login = await loginJson(emails.student, password);
    const token = login.body.data.accessToken as string;

    const me = await request(app)
      .get(`${base}/auth/me`)
      .set("Authorization", `Bearer ${token}`)
      .set("Origin", "http://localhost:3000");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(emails.student);
  });

  it("student GET /student/dashboard works with Bearer", async () => {
    const login = await loginJson(emails.student, password);
    const token = login.body.data.accessToken as string;

    const dash = await request(app)
      .get(`${base}/student/dashboard`)
      .set("Authorization", `Bearer ${token}`)
      .set("Origin", "http://localhost:3000");
    expect(dash.status).toBe(200);
    expect(dash.body.success).toBe(true);
  });

  it("admin GET /admin/courses works with Bearer", async () => {
    const login = await loginJson(emails.admin, password);
    const token = login.body.data.accessToken as string;

    const list = await request(app)
      .get(`${base}/admin/courses?page=1&pageSize=5`)
      .set("Authorization", `Bearer ${token}`)
      .set("Origin", "http://localhost:3000");
    expect(list.status).toBe(200);
    expect(list.body.success).toBe(true);
  });

  it("student Bearer cannot access admin routes", async () => {
    const login = await loginJson(emails.student, password);
    const token = login.body.data.accessToken as string;

    const list = await request(app)
      .get(`${base}/admin/courses?page=1&pageSize=5`)
      .set("Authorization", `Bearer ${token}`)
      .set("Origin", "http://localhost:3000");
    expect(list.status).toBe(403);
  });

  it("invalid Bearer token returns 401", async () => {
    const me = await request(app)
      .get(`${base}/auth/me`)
      .set("Authorization", "Bearer not-a-valid-jwt")
      .set("Origin", "http://localhost:3000");
    expect(me.status).toBe(401);
  });

  it("suspended user is blocked on Bearer after DB status change", async () => {
    const login = await loginJson(emails.suspended, password);
    const token = login.body.data.accessToken as string;

    const ok = await request(app)
      .get(`${base}/auth/me`)
      .set("Authorization", `Bearer ${token}`);
    expect(ok.status).toBe(200);

    await prisma.user.update({
      where: { email: emails.suspended },
      data: { status: UserStatus.SUSPENDED },
    });

    const denied = await request(app)
      .get(`${base}/auth/me`)
      .set("Authorization", `Bearer ${token}`);
    expect(denied.status).toBe(401);
  });

  it("prefers cookie over Bearer when both are sent", async () => {
    const agent = request.agent(app);
    const login = await agent
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email: emails.student, password });
    expect(login.status).toBe(200);

    const me = await agent
      .get(`${base}/auth/me`)
      .set("Authorization", "Bearer invalid-token-should-be-ignored")
      .set("Origin", "http://localhost:3000");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(emails.student);
  });

  it("logout clears cookie; Bearer still works until expiry", async () => {
    const agent = request.agent(app);
    const login = await loginJson(emails.student, password);
    const token = login.body.data.accessToken as string;

    await agent
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email: emails.student, password });

    await agent
      .post(`${base}/auth/logout`)
      .set("Origin", "http://localhost:3000");

    const meCookie = await agent
      .get(`${base}/auth/me`)
      .set("Origin", "http://localhost:3000");
    expect(meCookie.status).toBe(401);

    const meBearer = await request(app)
      .get(`${base}/auth/me`)
      .set("Authorization", `Bearer ${token}`);
    expect(meBearer.status).toBe(200);
  });
});
