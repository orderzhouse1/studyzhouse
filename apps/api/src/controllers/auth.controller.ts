import type { Request, Response } from "express";
import { UserStatus } from "@prisma/client";

import { authCookieOptions } from "../lib/cookieAuth.js";
import { signAccessToken } from "../lib/jwt.js";
import { verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { parseDurationToMs } from "../lib/ttl.js";
import { writeAuditLog } from "../services/audit.service.js";
import type { LoginBody } from "@studyhouse/shared";
import { AUTH_ACCESS_COOKIE_NAME, authUserSchema } from "@studyhouse/shared";

import { loadEnv } from "../config/env.js";

function mapPublicUser(user: {
  id: string;
  fullName: string;
  email: string;
  role: import("@prisma/client").UserRole;
  avatarUrl: string | null;
  status: UserStatus;
}) {
  return authUserSchema.parse({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    status: user.status,
  });
}

/**
 * @deprecated Use POST /auth/signup/request-otp then /auth/signup/verify-otp.
 * Kept so old clients get a clear migration error instead of creating users without OTP.
 */
export async function signup(_req: Request, res: Response): Promise<void> {
  res.status(410).json({
    success: false,
    error: {
      code: "SIGNUP_REQUIRES_OTP",
      message:
        "التسجيل يتطلب تأكيد البريد عبر رمز OTP. استخدم /auth/signup/request-otp ثم /auth/signup/verify-otp.",
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginBody;
  const env = loadEnv();

  const user = await prisma.user.findUnique({
    where: { email: body.email },
  });

  const genericMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

  if (!user) {
    await writeAuditLog({
      action: "AUTH_LOGIN_FAILURE",
      entityType: "User",
      metadata: { reason: "unknown_email" },
      req,
    });
    res.status(401).json({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: genericMessage },
    });
    return;
  }

  const ok = await verifyPassword(body.password, user.passwordHash);
  if (!ok) {
    await writeAuditLog({
      actorId: user.id,
      action: "AUTH_LOGIN_FAILURE",
      entityType: "User",
      entityId: user.id,
      metadata: { reason: "bad_password" },
      req,
    });
    res.status(401).json({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: genericMessage },
    });
    return;
  }

  if (user.status !== UserStatus.ACTIVE) {
    await writeAuditLog({
      actorId: user.id,
      action: "AUTH_LOGIN_FAILURE",
      entityType: "User",
      entityId: user.id,
      metadata: { reason: "inactive_user", status: user.status },
      req,
    });
    res.status(403).json({
      success: false,
      error: {
        code: "ACCOUNT_NOT_ACTIVE",
        message: "هذا الحساب غير مفعّل أو موقوف.",
      },
    });
    return;
  }

  const token = await signAccessToken({ userId: user.id, role: user.role });
  const maxAge = parseDurationToMs(env.JWT_EXPIRES_IN);

  res.cookie(AUTH_ACCESS_COOKIE_NAME, token, authCookieOptions(maxAge));

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "AUTH_LOGIN_SUCCESS",
    entityType: "User",
    entityId: user.id,
    req,
  });

  res.status(200).json({
    success: true,
    data: { user: mapPublicUser(user) },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  const env = loadEnv();
  res.clearCookie(AUTH_ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({ success: true, data: { ok: true } });
}

export async function me(req: Request, res: Response): Promise<void> {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "يجب تسجيل الدخول." },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "الحساب غير متاح." },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { user: mapPublicUser(user) },
  });
}
