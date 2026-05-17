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

describeIntegration("Critical API integration (TEST_DATABASE_URL)", () => {
  let app: Express;
  let prisma: import("@prisma/client").PrismaClient;
  let base: string;

  const runId = `t${Date.now().toString(36)}x${randomBytes(3).toString("hex")}`;
  const sup = {
    super: `super-${runId}@studyhouse-integration.test`,
    admin: `admin-${runId}@studyhouse-integration.test`,
    student: `student-${runId}@studyhouse-integration.test`,
    student2: `student2-${runId}@studyhouse-integration.test`,
    student3: `student3-${runId}@studyhouse-integration.test`,
  };
  const pw = {
    super: "SuperIntTest12345!",
    admin: "AdminIntTest12345!",
    student: "StudentIntTest12345!",
    student2: "Student2IntTest12345!",
    student3: "Student3IntTest12345!",
  };

  let categoryId: string;
  let emptyCourseId: string;
  let fullCourseId: string;
  let fullCourseSlug: string;
  let paidCourseId: string;
  let lessonId: string;
  let publishedLessonId: string;

  beforeAll(async () => {
    applyIntegrationProcessEnv();
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error("TEST_DATABASE_URL must be set for this suite.");
    }
    const { resetEnvCache } = await import("../config/env.js");
    resetEnvCache();
    const { createApp } = await import("../app.js");
    const { prisma: p } = await import("../lib/prisma.js");
    prisma = p;
    app = createApp();
    base = apiBasePath(API_VERSION);

    const h = (p: string) => argon2.hash(p);
    const [sh, ah, sth, s2h, s3h] = await Promise.all([
      h(pw.super),
      h(pw.admin),
      h(pw.student),
      h(pw.student2),
      h(pw.student3),
    ]);

    await prisma.user.createMany({
      data: [
        {
          email: sup.super,
          fullName: "Int Super",
          passwordHash: sh,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          email: sup.admin,
          fullName: "Int Admin",
          passwordHash: ah,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          email: sup.student,
          fullName: "Int Student",
          passwordHash: sth,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
        {
          email: sup.student2,
          fullName: "Int Student2",
          passwordHash: s2h,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
        {
          email: sup.student3,
          fullName: "Int Student3",
          passwordHash: s3h,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
      ],
    });

    const adminRow = await prisma.user.findUniqueOrThrow({
      where: { email: sup.admin },
    });
    await prisma.adminProfile.create({
      data: { userId: adminRow.id, jobTitle: "Int" },
    });

    const cat = await prisma.category.create({
      data: {
        name: `Cat ${runId}`,
        slug: `cat-${runId}`,
      },
    });
    categoryId = cat.id;

    const emptyCourse = await prisma.course.create({
      data: {
        title: "Empty course title",
        slug: `empty-${runId}`,
        description: "Empty course has no sections yet for integration test.",
        status: CourseStatus.DRAFT,
        pricingType: PricingType.FREE,
        categoryId,
        createdById: adminRow.id,
      },
    });
    emptyCourseId = emptyCourse.id;

    const fullCourse = await prisma.course.create({
      data: {
        title: "Full course title here",
        slug: `full-${runId}`,
        description: "Full course description long enough for publish rules.",
        status: CourseStatus.DRAFT,
        pricingType: PricingType.FREE,
        categoryId,
        createdById: adminRow.id,
      },
    });
    fullCourseId = fullCourse.id;
    fullCourseSlug = fullCourse.slug;

    const sec = await prisma.courseSection.create({
      data: {
        courseId: fullCourseId,
        title: "Section A",
        sortOrder: 0,
      },
    });
    const les = await prisma.lesson.create({
      data: {
        courseId: fullCourseId,
        sectionId: sec.id,
        title: "Lesson one",
        youtubeVideoId: "dQw4w9WgXcQ",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sortOrder: 0,
        status: LessonStatus.DRAFT,
      },
    });
    lessonId = les.id;

    const paidCourse = await prisma.course.create({
      data: {
        title: "Paid course title",
        slug: `paid-${runId}`,
        description: "Paid course description for payment and code tests.",
        status: CourseStatus.DRAFT,
        pricingType: PricingType.PAID,
        price: 25.0,
        currency: "JOD",
        categoryId,
        createdById: adminRow.id,
      },
    });
    paidCourseId = paidCourse.id;

    const psec = await prisma.courseSection.create({
      data: {
        courseId: paidCourseId,
        title: "Paid section",
        sortOrder: 0,
      },
    });
    const ples = await prisma.lesson.create({
      data: {
        courseId: paidCourseId,
        sectionId: psec.id,
        title: "Paid lesson",
        youtubeVideoId: "dQw4w9WgXcQ",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sortOrder: 0,
        status: LessonStatus.DRAFT,
      },
    });
    publishedLessonId = ples.id;
  }, 120_000);

  afterAll(async () => {
    if (!prisma) return;
    const emails = Object.values(sup);
    try {
      await prisma.codeRedemption.deleteMany({
        where: { student: { email: { in: emails } } },
      });
      await prisma.activationCode.deleteMany({
        where: { course: { title: { contains: "course" } } },
      });
      await prisma.activationCode.deleteMany({
        where: { courseId: { in: [emptyCourseId, fullCourseId, paidCourseId] } },
      });
      await prisma.paymentRequest.deleteMany({
        where: { student: { email: { in: emails } } },
      });
      await prisma.enrollment.deleteMany({
        where: { student: { email: { in: emails } } },
      });
      await prisma.lesson.deleteMany({
        where: { courseId: { in: [emptyCourseId, fullCourseId, paidCourseId] } },
      });
      await prisma.courseSection.deleteMany({
        where: { courseId: { in: [emptyCourseId, fullCourseId, paidCourseId] } },
      });
      await prisma.course.deleteMany({
        where: { id: { in: [emptyCourseId, fullCourseId, paidCourseId] } },
      });
      await prisma.category.deleteMany({ where: { id: categoryId } });
      await prisma.user.deleteMany({ where: { email: { in: emails } } });
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

  it("login succeeds and sets HttpOnly auth cookie", async () => {
    const { res } = await loginAgent(sup.admin, pw.admin);
    expect(res.status).toBe(200);
    const raw = res.headers["set-cookie"];
    expect(raw).toBeDefined();
    const joined = Array.isArray(raw) ? raw.join(";") : String(raw);
    expect(joined).toContain(AUTH_ACCESS_COOKIE_NAME);
    expect(joined.toLowerCase()).toContain("httponly");
  });

  it("login fails for wrong password", async () => {
    const res = await request(app)
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email: sup.admin, password: "WrongPassword999!!!" });
    expect(res.status).toBe(401);
    expect(res.body?.error?.code).toBe("INVALID_CREDENTIALS");
  });

  const signupEmail = `signup-${runId}@studyhouse-integration.test`;
  const signupPw = "SignupTest12345!";
  const signupOtpCode = "123456";
  const signupPayload = {
    fullName: "طالب تسجيل ذاتي",
    email: signupEmail,
    password: signupPw,
    confirmPassword: signupPw,
    acceptTerms: true,
  };

  async function requestSignupOtp(
    payload: Record<string, unknown> = signupPayload,
  ) {
    return request(app)
      .post(`${base}/auth/signup/request-otp`)
      .set("Origin", "http://localhost:3000")
      .send(payload);
  }

  it("legacy POST /auth/signup returns 410 SIGNUP_REQUIRES_OTP", async () => {
    const res = await request(app)
      .post(`${base}/auth/signup`)
      .set("Origin", "http://localhost:3000")
      .send(signupPayload);
    expect(res.status).toBe(410);
    expect(res.body?.error?.code).toBe("SIGNUP_REQUIRES_OTP");
  });

  it("request OTP validates signup fields and stores only codeHash", async () => {
    const res = await requestSignupOtp();
    expect(res.status).toBe(200);
    expect(res.body.data.challengeId).toBeTruthy();

    const challenge = await prisma.signupOtpChallenge.findUnique({
      where: { id: res.body.data.challengeId },
    });
    expect(challenge?.email).toBe(signupEmail);
    expect(challenge?.codeHash).not.toBe(signupOtpCode);
    expect(challenge?.codeHash.length).toBeGreaterThan(20);
    const row = await prisma.user.findUnique({ where: { email: signupEmail } });
    expect(row).toBeNull();
  });

  it("verify OTP creates STUDENT ACTIVE with emailVerifiedAt and no cookie", async () => {
    const req = await requestSignupOtp();
    const challengeId = req.body.data.challengeId as string;

    const verify = await request(app)
      .post(`${base}/auth/signup/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({ challengeId, code: signupOtpCode });
    expect(verify.status).toBe(201);
    expect(verify.body.data.user.role).toBe("STUDENT");
    expect(verify.body.data.user.status).toBe("ACTIVE");

    const raw = verify.headers["set-cookie"];
    const joined = raw
      ? Array.isArray(raw)
        ? raw.join(";")
        : String(raw)
      : "";
    expect(joined).not.toContain(AUTH_ACCESS_COOKIE_NAME);

    const row = await prisma.user.findUnique({ where: { email: signupEmail } });
    expect(row?.role).toBe(UserRole.STUDENT);
    expect(row?.status).toBe(UserStatus.ACTIVE);
    expect(row?.emailVerifiedAt).not.toBeNull();
    const enrollCount = await prisma.enrollment.count({
      where: { studentId: row!.id },
    });
    expect(enrollCount).toBe(0);
  });

  it("signed-up student can login immediately", async () => {
    const { res } = await loginAgent(signupEmail, signupPw);
    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe("ACTIVE");
  });

  it("wrong OTP is rejected", async () => {
    const email = `wrong-otp-${runId}@studyhouse-integration.test`;
    const req = await requestSignupOtp({
      ...signupPayload,
      email,
    });
    const challengeId = req.body.data.challengeId as string;
    const bad = await request(app)
      .post(`${base}/auth/signup/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({ challengeId, code: "000000" });
    expect(bad.status).toBe(400);
    expect(bad.body?.error?.code).toBe("OTP_INVALID");
  });

  it("too many OTP attempts are rejected", async () => {
    const email = `attempts-${runId}@studyhouse-integration.test`;
    const req = await requestSignupOtp({
      ...signupPayload,
      email,
    });
    const challengeId = req.body.data.challengeId as string;
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`${base}/auth/signup/verify-otp`)
        .set("Origin", "http://localhost:3000")
        .send({ challengeId, code: "000000" });
    }
    const blocked = await request(app)
      .post(`${base}/auth/signup/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({ challengeId, code: signupOtpCode });
    expect(blocked.status).toBe(429);
    expect(blocked.body?.error?.code).toBe("OTP_ATTEMPTS_EXCEEDED");
  });

  it("expired OTP is rejected", async () => {
    const email = `expired-${runId}@studyhouse-integration.test`;
    const req = await requestSignupOtp({
      ...signupPayload,
      email,
    });
    const challengeId = req.body.data.challengeId as string;
    await prisma.signupOtpChallenge.update({
      where: { id: challengeId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    const expired = await request(app)
      .post(`${base}/auth/signup/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({ challengeId, code: signupOtpCode });
    expect(expired.status).toBe(400);
    expect(expired.body?.error?.code).toBe("OTP_EXPIRED");
  });

  it("signup rejects duplicate email on request-otp", async () => {
    const res = await requestSignupOtp();
    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe("DUPLICATE_EMAIL");
  });

  it("signup rejects acceptTerms false", async () => {
    const res = await requestSignupOtp({
      ...signupPayload,
      email: `terms-${runId}@studyhouse-integration.test`,
      acceptTerms: false,
    });
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("signup rejects client-supplied role", async () => {
    const res = await request(app)
      .post(`${base}/auth/signup/request-otp`)
      .set("Origin", "http://localhost:3000")
      .send({
        ...signupPayload,
        email: `role-${runId}@studyhouse-integration.test`,
        role: "ADMIN",
      });
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("admin can suspend signed-up student and student cannot login", async () => {
    const { agent: adminAgent, res: adminLogin } = await loginAgent(
      sup.admin,
      pw.admin,
    );
    expect(adminLogin.status).toBe(200);

    const student = await prisma.user.findUnique({
      where: { email: signupEmail },
    });
    expect(student?.status).toBe(UserStatus.ACTIVE);

    const patch = await adminAgent
      .patch(`${base}/admin/students/${student!.id}`)
      .set("Origin", "http://localhost:3000")
      .send({ status: "SUSPENDED" });
    expect(patch.status).toBe(200);
    expect(patch.body.data.student.status).toBe("SUSPENDED");

    const blocked = await request(app)
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email: signupEmail, password: signupPw });
    expect(blocked.status).toBe(403);
    expect(blocked.body?.error?.code).toBe("ACCOUNT_NOT_ACTIVE");
  });

  it("admin can reactivate suspended student and student can login", async () => {
    const { agent: adminAgent, res: adminLogin } = await loginAgent(
      sup.admin,
      pw.admin,
    );
    expect(adminLogin.status).toBe(200);

    const student = await prisma.user.findUnique({
      where: { email: signupEmail },
    });

    const patch = await adminAgent
      .patch(`${base}/admin/students/${student!.id}`)
      .set("Origin", "http://localhost:3000")
      .send({ status: "ACTIVE" });
    expect(patch.status).toBe(200);
    expect(patch.body.data.student.status).toBe("ACTIVE");

    const { res: studentLogin } = await loginAgent(signupEmail, signupPw);
    expect(studentLogin.status).toBe(200);
    expect(studentLogin.body.data.user.status).toBe("ACTIVE");
  });

  it("GET /auth/google redirects to Google when configured", async () => {
    const res = await request(app)
      .get(`${base}/auth/google`)
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(302);
    expect(String(res.headers.location)).toContain("accounts.google.com");
  });

  it("google: new user becomes STUDENT ACTIVE with OAuth link", async () => {
    const { resolveGoogleAuthUser } =
      await import("../services/googleOAuth.service.js");
    const email = `google-new-${runId}@studyhouse-integration.test`;
    const result = await resolveGoogleAuthUser({
      sub: `g-sub-new-${runId}`,
      email,
      email_verified: true,
      name: "Google New",
    });
    expect(result.isNewUser).toBe(true);
    expect(result.redirectPath).toBe("/student");

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.role).toBe(UserRole.STUDENT);
    expect(user?.status).toBe(UserStatus.ACTIVE);
    expect(user?.emailVerifiedAt).not.toBeNull();

    const oauth = await prisma.oAuthAccount.findFirst({
      where: { userId: user!.id },
    });
    expect(oauth?.provider).toBe("GOOGLE");
    expect(oauth?.providerAccountId).toBe(`g-sub-new-${runId}`);

    const enrollCount = await prisma.enrollment.count({
      where: { studentId: user!.id },
    });
    expect(enrollCount).toBe(0);
  });

  it("google: blocks ADMIN email", async () => {
    const { resolveGoogleAuthUser } =
      await import("../services/googleOAuth.service.js");
    await expect(
      resolveGoogleAuthUser({
        sub: `g-sub-admin-${runId}`,
        email: sup.admin,
        email_verified: true,
      }),
    ).rejects.toMatchObject({ code: "GOOGLE_STAFF_NOT_ALLOWED" });
  });

  it("google: blocks SUSPENDED student", async () => {
    const email = `google-susp-${runId}@studyhouse-integration.test`;
    const hash = await argon2.hash("SuspendGoogle123!");
    await prisma.user.create({
      data: {
        fullName: "Suspended Google",
        email,
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.SUSPENDED,
      },
    });
    const { resolveGoogleAuthUser } =
      await import("../services/googleOAuth.service.js");
    await expect(
      resolveGoogleAuthUser({
        sub: `g-sub-susp-${runId}`,
        email,
        email_verified: true,
      }),
    ).rejects.toMatchObject({ code: "ACCOUNT_NOT_ACTIVE" });
  });

  it("GET /auth/me without cookie is 401", async () => {
    const res = await request(app)
      .get(`${base}/auth/me`)
      .set("Origin", "http://localhost:3000");
    expect(res.status).toBe(401);
  });

  it("GET /auth/me with valid session returns user", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.student, pw.student);
    expect(loginRes.status).toBe(200);
    const me = await agent
      .get(`${base}/auth/me`)
      .set("Origin", "http://localhost:3000");
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(sup.student);
    const body = JSON.stringify(me.body);
    expect(body).not.toMatch(/passwordHash/i);
  });

  it("logout clears session (subsequent /me is 401)", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.student, pw.student);
    expect(loginRes.status).toBe(200);
    const out = await agent
      .post(`${base}/auth/logout`)
      .set("Origin", "http://localhost:3000");
    expect(out.status).toBe(200);
    const me = await agent
      .get(`${base}/auth/me`)
      .set("Origin", "http://localhost:3000");
    expect(me.status).toBe(401);
  });

  it("STUDENT cannot access admin list", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.student, pw.student);
    expect(loginRes.status).toBe(200);
    const r = await agent
      .get(`${base}/admin/courses?page=1&pageSize=20`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(403);
  });

  it("ADMIN cannot access super-admin overview", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.admin, pw.admin);
    expect(loginRes.status).toBe(200);
    const r = await agent
      .get(`${base}/super-admin/overview`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(403);
  });

  it("SUPER_ADMIN can access super-admin overview", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.super, pw.super);
    expect(loginRes.status).toBe(200);
    const r = await agent
      .get(`${base}/super-admin/overview`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });

  it("unauthenticated admin route returns 401", async () => {
    const r = await request(app)
      .get(`${base}/admin/courses?page=1&pageSize=20`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(401);
  });

  it("suspended user loses access after status change", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.student3, pw.student3);
    expect(loginRes.status).toBe(200);
    const ok = await agent
      .get(`${base}/auth/me`)
      .set("Origin", "http://localhost:3000");
    expect(ok.status).toBe(200);

    await prisma.user.update({
      where: { email: sup.student3 },
      data: { status: UserStatus.SUSPENDED },
    });

    const denied = await agent
      .get(`${base}/auth/me`)
      .set("Origin", "http://localhost:3000");
    expect(denied.status).toBe(401);

    await prisma.user.update({
      where: { email: sup.student3 },
      data: { status: UserStatus.ACTIVE },
    });
  });

  it("cannot publish empty course", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.admin, pw.admin);
    expect(loginRes.status).toBe(200);
    const pub = await agent
      .post(`${base}/admin/courses/${emptyCourseId}/publish`)
      .set("Origin", "http://localhost:3000");
    expect(pub.status).toBe(400);
    expect(pub.body?.error?.code).toBe("PUBLISH_READINESS");
    expect(Array.isArray(pub.body?.error?.details?.missing)).toBe(true);
  });

  it("PATCH course to PUBLISHED cannot bypass readiness guard", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.admin, pw.admin);
    expect(loginRes.status).toBe(200);
    const patch = await agent
      .patch(`${base}/admin/courses/${emptyCourseId}`)
      .set("Origin", "http://localhost:3000")
      .send({ status: "PUBLISHED" });
    expect(patch.status).toBe(400);
    expect(patch.body?.error?.code).toBe("PUBLISH_READINESS");
  });

  it("successful publish when structure is complete", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.admin, pw.admin);
    expect(loginRes.status).toBe(200);
    const pub = await agent
      .post(`${base}/admin/courses/${fullCourseId}/publish`)
      .set("Origin", "http://localhost:3000");
    expect(pub.status).toBe(200);
    expect(pub.body.data.course.status).toBe("PUBLISHED");
  });

  it("student can access my-courses", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.student, pw.student);
    expect(loginRes.status).toBe(200);
    const r = await agent
      .get(`${base}/student/my-courses`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(200);
  });

  it("learn payload forbidden without ACTIVE enrollment", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.student, pw.student);
    expect(loginRes.status).toBe(200);
    const r = await agent
      .get(`${base}/student/courses/${fullCourseSlug}/learn`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(403);
  });

  it("learn works after enrollment and lesson published", async () => {
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { status: LessonStatus.PUBLISHED },
    });

    const st = await prisma.user.findUniqueOrThrow({
      where: { email: sup.student },
    });
    await prisma.enrollment.create({
      data: {
        studentId: st.id,
        courseId: fullCourseId,
        source: EnrollmentSource.FREE,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    const { agent, res: loginRes } = await loginAgent(sup.student, pw.student);
    expect(loginRes.status).toBe(200);
    const r = await agent
      .get(`${base}/student/courses/${fullCourseSlug}/learn`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
  });

  it("revoked enrollment blocks learn", async () => {
    await prisma.enrollment.updateMany({
      where: {
        student: { email: sup.student },
        courseId: fullCourseId,
      },
      data: { status: EnrollmentStatus.REVOKED },
    });

    const { agent, res: loginRes } = await loginAgent(sup.student, pw.student);
    expect(loginRes.status).toBe(200);
    const r = await agent
      .get(`${base}/student/courses/${fullCourseSlug}/learn`)
      .set("Origin", "http://localhost:3000");
    expect(r.status).toBe(403);

    await prisma.enrollment.deleteMany({
      where: {
        student: { email: sup.student },
        courseId: fullCourseId,
      },
    });
  });

  it("activation: admin creates code, plain returned once, list has no hash", async () => {
    await prisma.course.update({
      where: { id: paidCourseId },
      data: { status: CourseStatus.PUBLISHED },
    });
    await prisma.lesson.update({
      where: { id: publishedLessonId },
      data: { status: LessonStatus.PUBLISHED },
    });

    const { agent, res: loginRes } = await loginAgent(sup.admin, pw.admin);
    expect(loginRes.status).toBe(200);

    const created = await agent
      .post(`${base}/admin/activation-codes`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        usageLimit: 2,
        count: 1,
      });
    expect(created.status).toBe(201);
    expect(created.body.data.codes[0]?.code).toBeTruthy();
    const plain = created.body.data.codes[0].code as string;
    const createdJson = JSON.stringify(created.body);
    expect(createdJson).not.toMatch(/codeHash/i);

    const list = await agent
      .get(`${base}/admin/activation-codes?page=1&pageSize=20`)
      .set("Origin", "http://localhost:3000");
    expect(list.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toMatch(/codeHash/i);

    const row = await prisma.activationCode.findFirst({
      where: { courseId: paidCourseId },
      orderBy: { createdAt: "desc" },
    });
    expect(row?.codeHash).toBeTruthy();
    expect(row?.codeHash).not.toBe(plain);

    const { agent: sAgent, res: sLogin } = await loginAgent(
      sup.student2,
      pw.student2,
    );
    expect(sLogin.status).toBe(200);
    const redeem = await sAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(redeem.status).toBe(200);
    expect(redeem.body.data.enrollment.status).toBe("ACTIVE");

    const en = await prisma.enrollment.findFirst({
      where: {
        student: { email: sup.student2 },
        courseId: paidCourseId,
      },
    });
    expect(en?.source).toBe(EnrollmentSource.ACTIVATION_CODE);

    const dup = await sAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(dup.status).toBe(409);
    expect(dup.body?.error?.code).toBe("ALREADY_REDEEMED");

    const bad = await sAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: "ZZZZ-ZZZZ-ZZZZ" });
    expect(bad.status).toBe(400);

    const { agent: s3Agent, res: s3Login } = await loginAgent(
      sup.student3,
      pw.student3,
    );
    expect(s3Login.status).toBe(200);
    const third = await s3Agent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plain });
    expect(third.status).toBe(200);

    const singleUse = await agent
      .post(`${base}/admin/activation-codes`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        usageLimit: 1,
        count: 1,
      });
    expect(singleUse.status).toBe(201);
    const plainSingle = singleUse.body.data.codes[0].code as string;

    await prisma.enrollment.deleteMany({
      where: {
        courseId: paidCourseId,
        student: { email: { in: [sup.student, sup.student2] } },
      },
    });

    const { agent: su1 } = await loginAgent(sup.student, pw.student);
    const firstRedeem = await su1
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plainSingle });
    expect(firstRedeem.status).toBe(200);

    const { agent: su2 } = await loginAgent(sup.student2, pw.student2);
    const depletedOther = await su2
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: plainSingle });
    expect(depletedOther.status).toBe(400);
    expect(depletedOther.body?.error?.code).toBe("CODE_DEPLETED");

    const disCreate = await agent
      .post(`${base}/admin/activation-codes`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        usageLimit: 5,
        count: 1,
      });
    expect(disCreate.status).toBe(201);
    const disId = disCreate.body.data.codes[0].id as string;
    const disPlain = disCreate.body.data.codes[0].code as string;

    await agent
      .post(`${base}/admin/activation-codes/${disId}/disable`)
      .set("Origin", "http://localhost:3000")
      .send({});

    await prisma.enrollment.deleteMany({
      where: {
        courseId: paidCourseId,
        student: { email: sup.student3 },
      },
    });

    const { agent: disAgent } = await loginAgent(sup.student3, pw.student3);
    const disRes = await disAgent
      .post(`${base}/student/activation-codes/redeem`)
      .set("Origin", "http://localhost:3000")
      .send({ code: disPlain });
    expect(disRes.status).toBe(400);
    expect(disRes.body?.error?.code).toBe("CODE_INACTIVE");
  });

  it("CliQ payment flow: create, duplicate pending, enroll guard, approve, reject", async () => {
    const emails = Object.values(sup);
    await prisma.paymentRequest.deleteMany({
      where: {
        courseId: paidCourseId,
        student: { email: { in: emails } },
      },
    });
    await prisma.enrollment.deleteMany({
      where: {
        courseId: paidCourseId,
        student: { email: { in: emails } },
      },
    });

    const { agent: stAgent, res: stLogin } = await loginAgent(
      sup.student,
      pw.student,
    );
    expect(stLogin.status).toBe(200);

    const pr1 = await stAgent
      .post(`${base}/student/payment-requests`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        paidAmount: "25.00",
        paymentReference: "REF-INT-001",
      });
    expect(pr1.status).toBe(201);

    const dup = await stAgent
      .post(`${base}/student/payment-requests`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        paidAmount: "25.00",
        paymentReference: "REF-INT-002",
      });
    expect(dup.status).toBe(409);
    expect(dup.body?.error?.code).toBe("PENDING_EXISTS");

    await prisma.paymentRequest.deleteMany({
      where: {
        student: { email: sup.student },
        courseId: paidCourseId,
      },
    });

    const pr2 = await stAgent
      .post(`${base}/student/payment-requests`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        paidAmount: "25.00",
        paymentReference: "REF-INT-003",
      });
    expect(pr2.status).toBe(201);
    const paymentRequestId = pr2.body.data.id as string;

    await prisma.enrollment.create({
      data: {
        studentId: (
          await prisma.user.findUniqueOrThrow({ where: { email: sup.student2 } })
        ).id,
        courseId: paidCourseId,
        source: EnrollmentSource.CLIQ_PAYMENT,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    const stCookie = await loginAgent(sup.student2, pw.student2);
    const enrolledStudentTry = await stCookie.agent
      .post(`${base}/student/payment-requests`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        paidAmount: "25.00",
        paymentReference: "REF-ENROLLED",
      });
    expect(enrolledStudentTry.status).toBe(409);
    expect(enrolledStudentTry.body?.error?.code).toBe("ALREADY_ENROLLED");

    await prisma.enrollment.deleteMany({
      where: {
        student: { email: sup.student2 },
        courseId: paidCourseId,
      },
    });

    const { agent: adAgent, res: adLogin } = await loginAgent(sup.admin, pw.admin);
    expect(adLogin.status).toBe(200);
    const approve = await adAgent
      .post(`${base}/admin/payment-requests/${paymentRequestId}/approve`)
      .set("Origin", "http://localhost:3000")
      .send({});
    expect(approve.status).toBe(200);

    const en = await prisma.enrollment.findFirst({
      where: {
        student: { email: sup.student },
        courseId: paidCourseId,
      },
    });
    expect(en?.status).toBe(EnrollmentStatus.ACTIVE);
    expect(en?.source).toBe(EnrollmentSource.CLIQ_PAYMENT);

    const prAnother = await stAgent
      .post(`${base}/student/payment-requests`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        paidAmount: "25.00",
        paymentReference: "REF-SHOULD-FAIL",
      });
    expect(prAnother.status).toBe(409);
    expect(prAnother.body?.error?.code).toBe("ALREADY_ENROLLED");

    await prisma.paymentRequest.deleteMany({
      where: {
        student: { email: sup.student2 },
        courseId: paidCourseId,
      },
    });
    await prisma.enrollment.deleteMany({
      where: {
        student: { email: sup.student2 },
        courseId: paidCourseId,
      },
    });

    const { agent: s2ag } = await loginAgent(sup.student2, pw.student2);
    const createReject = await s2ag
      .post(`${base}/student/payment-requests`)
      .set("Origin", "http://localhost:3000")
      .send({
        courseId: paidCourseId,
        paidAmount: "25.00",
        paymentReference: "REF-REJECT-FLOW",
      });
    expect(createReject.status).toBe(201);
    const rejectId = createReject.body.data.id as string;

    const rej = await adAgent
      .post(`${base}/admin/payment-requests/${rejectId}/reject`)
      .set("Origin", "http://localhost:3000")
      .send({ rejectionReason: "Test rejection reason here" });
    expect(rej.status).toBe(200);
    expect(rej.body.data.status).toBe("REJECTED");

    const studentTriesApprove = await stAgent
      .post(`${base}/admin/payment-requests/${rejectId}/approve`)
      .set("Origin", "http://localhost:3000")
      .send({});
    expect(studentTriesApprove.status).toBe(403);
  });

  it("super-admin: list admins, create admin without passwordHash, role ADMIN only", async () => {
    const { agent, res: loginRes } = await loginAgent(sup.super, pw.super);
    expect(loginRes.status).toBe(200);

    const list = await agent
      .get(`${base}/super-admin/admins?page=1&pageSize=20`)
      .set("Origin", "http://localhost:3000");
    expect(list.status).toBe(200);
    expect(JSON.stringify(list.body)).not.toMatch(/passwordHash/i);

    const emailNew = `newadmin-${runId}@studyhouse-integration.test`;
    const created = await agent
      .post(`${base}/super-admin/admins`)
      .set("Origin", "http://localhost:3000")
      .send({
        fullName: "New Admin",
        email: emailNew,
        password: "NewAdminPass12345!",
      });
    expect(created.status).toBe(201);
    expect(created.body.data.generatedPassword).toBeNull();
    expect(JSON.stringify(created.body)).not.toMatch(/passwordHash/i);

    const row = await prisma.user.findUnique({ where: { email: emailNew } });
    expect(row?.role).toBe(UserRole.ADMIN);

    const { agent: agAd } = await loginAgent(sup.admin, pw.admin);
    const forbidden = await agAd
      .get(`${base}/super-admin/admins?page=1&pageSize=20`)
      .set("Origin", "http://localhost:3000");
    expect(forbidden.status).toBe(403);

    await prisma.user.delete({ where: { email: emailNew } });
  });

  const resetOtpCode = "123456";
  const resetGeneric =
    "إذا كان البريد مسجلًا لدينا، ستصلك رسالة تحتوي على رمز إعادة التعيين.";

  async function requestResetOtp(email: string) {
    return request(app)
      .post(`${base}/auth/forgot-password/request-otp`)
      .set("Origin", "http://localhost:3000")
      .send({ email });
  }

  it("password reset: unknown email returns generic success without challengeId", async () => {
    const res = await requestResetOtp(
      `unknown-${runId}@studyhouse-integration.test`,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe(resetGeneric);
    expect(res.body.data.challengeId).toBeUndefined();
  });

  it("password reset: existing user returns generic success and stores codeHash only", async () => {
    const res = await requestResetOtp(sup.student);
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe(resetGeneric);
    expect(res.body.data.challengeId).toBeTruthy();

    const challenge = await prisma.passwordResetOtpChallenge.findUnique({
      where: { id: res.body.data.challengeId },
    });
    expect(challenge?.codeHash).not.toBe(resetOtpCode);
    expect(challenge?.codeHash.length).toBeGreaterThan(20);
  });

  it("password reset: wrong OTP rejected", async () => {
    const res = await requestResetOtp(sup.student2);
    const challengeId = res.body.data.challengeId as string;
    const bad = await request(app)
      .post(`${base}/auth/forgot-password/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({
        challengeId,
        code: "000000",
        newPassword: "NewReset12345!",
        confirmPassword: "NewReset12345!",
      });
    expect(bad.status).toBe(400);
    expect(bad.body?.error?.code).toBe("OTP_INVALID");
  });

  it("password reset: too many attempts returns OTP_ATTEMPTS_EXCEEDED", async () => {
    const email = `reset-attempts-${runId}@studyhouse-integration.test`;
    const hash = await argon2.hash("ResetAttempts123!");
    await prisma.user.create({
      data: {
        fullName: "Reset Attempts",
        email,
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    const req = await requestResetOtp(email);
    const challengeId = req.body.data.challengeId as string;
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post(`${base}/auth/forgot-password/verify-otp`)
        .set("Origin", "http://localhost:3000")
        .send({
          challengeId,
          code: "000000",
          newPassword: "NewReset12345!",
          confirmPassword: "NewReset12345!",
        });
    }
    const blocked = await request(app)
      .post(`${base}/auth/forgot-password/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({
        challengeId,
        code: resetOtpCode,
        newPassword: "NewReset12345!",
        confirmPassword: "NewReset12345!",
      });
    expect(blocked.status).toBe(429);
    expect(blocked.body?.error?.code).toBe("OTP_ATTEMPTS_EXCEEDED");
  });

  it("password reset: expired OTP rejected", async () => {
    const email = `reset-expired-${runId}@studyhouse-integration.test`;
    const hash = await argon2.hash("ResetExpired123!");
    await prisma.user.create({
      data: {
        fullName: "Reset Expired",
        email,
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    const req = await requestResetOtp(email);
    const challengeId = req.body.data.challengeId as string;
    await prisma.passwordResetOtpChallenge.update({
      where: { id: challengeId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    const expired = await request(app)
      .post(`${base}/auth/forgot-password/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({
        challengeId,
        code: resetOtpCode,
        newPassword: "NewReset12345!",
        confirmPassword: "NewReset12345!",
      });
    expect(expired.status).toBe(400);
    expect(expired.body?.error?.code).toBe("OTP_EXPIRED");
  });

  it("password reset: valid OTP updates password, no cookie, login works", async () => {
    const email = `reset-ok-${runId}@studyhouse-integration.test`;
    const oldPw = "OldReset12345!";
    const newPw = "NewReset99999!";
    const hash = await argon2.hash(oldPw);
    await prisma.user.create({
      data: {
        fullName: "Reset OK",
        email,
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });

    const req = await requestResetOtp(email);
    const challengeId = req.body.data.challengeId as string;

    const verify = await request(app)
      .post(`${base}/auth/forgot-password/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({
        challengeId,
        code: resetOtpCode,
        newPassword: newPw,
        confirmPassword: newPw,
      });
    expect(verify.status).toBe(200);
    const raw = verify.headers["set-cookie"];
    const joined = raw
      ? Array.isArray(raw)
        ? raw.join(";")
        : String(raw)
      : "";
    expect(joined).not.toContain(AUTH_ACCESS_COOKIE_NAME);

    const oldLogin = await request(app)
      .post(`${base}/auth/login`)
      .set("Origin", "http://localhost:3000")
      .send({ email, password: oldPw });
    expect(oldLogin.status).toBe(401);

    const newLogin = await loginAgent(email, newPw);
    expect(newLogin.res.status).toBe(200);

    const consumed = await prisma.passwordResetOtpChallenge.findUnique({
      where: { id: challengeId },
    });
    expect(consumed?.consumedAt).not.toBeNull();
  });

  it("password reset: suspended user gets generic response without challengeId", async () => {
    const email = `reset-susp-${runId}@studyhouse-integration.test`;
    const hash = await argon2.hash("ResetSusp123!");
    await prisma.user.create({
      data: {
        fullName: "Reset Suspended",
        email,
        passwordHash: hash,
        role: UserRole.STUDENT,
        status: UserStatus.SUSPENDED,
      },
    });
    const res = await requestResetOtp(email);
    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe(resetGeneric);
    expect(res.body.data.challengeId).toBeUndefined();
  });

  it("password reset: validation rejects weak password", async () => {
    const res = await requestResetOtp(sup.student3);
    const challengeId = res.body.data.challengeId as string;
    const weak = await request(app)
      .post(`${base}/auth/forgot-password/verify-otp`)
      .set("Origin", "http://localhost:3000")
      .send({
        challengeId,
        code: resetOtpCode,
        newPassword: "short",
        confirmPassword: "short",
      });
    expect(weak.status).toBe(400);
    expect(weak.body?.error?.code).toBe("VALIDATION_ERROR");
  });

  it("generated password returned when omitted on super-admin create", async () => {
    const { agent } = await loginAgent(sup.super, pw.super);
    const emailGen = `genadmin-${runId}@studyhouse-integration.test`;
    const created = await agent
      .post(`${base}/super-admin/admins`)
      .set("Origin", "http://localhost:3000")
      .send({
        fullName: "Generated",
        email: emailGen,
      });
    expect(created.status).toBe(201);
    expect(typeof created.body.data.generatedPassword).toBe("string");
    expect(created.body.data.generatedPassword.length).toBeGreaterThan(8);
    await prisma.user.delete({ where: { email: emailGen } });
  });
});

if (!hasTestDb) {
  describe("Integration tests skipped", () => {
    it("Set TEST_DATABASE_URL to a dedicated Postgres database before running pnpm test:api.", () => {
      expect(process.env.TEST_DATABASE_URL).toBeFalsy();
    });
  });
}
