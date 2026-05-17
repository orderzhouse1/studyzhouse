import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { authCookieOptions } from "../lib/cookieAuth.js";
import { signGoogleOAuthState, verifyGoogleOAuthState } from "../lib/oauthState.js";
import { signAccessToken } from "../lib/jwt.js";
import { parseDurationToMs } from "../lib/ttl.js";
import { writeAuditLog } from "../services/audit.service.js";
import {
  assertGoogleOAuthConfigured,
  buildGoogleAuthorizationUrl,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  resolveGoogleAuthUser,
} from "../services/googleOAuth.service.js";
import { AUTH_ACCESS_COOKIE_NAME } from "@studyhouse/shared";

import { loadEnv } from "../config/env.js";

function loginErrorRedirect(code: string, message: string): string {
  const env = loadEnv();
  const params = new URLSearchParams({
    error: code,
    message,
  });
  return `${env.CLIENT_ORIGIN}/login?${params.toString()}`;
}

export async function startGoogleAuth(req: Request, res: Response): Promise<void> {
  assertGoogleOAuthConfigured();

  const nextRaw =
    typeof req.query.next === "string" ? req.query.next : undefined;
  const state = await signGoogleOAuthState({ next: nextRaw });

  await writeAuditLog({
    actorId: null,
    action: "GOOGLE_AUTH_STARTED",
    entityType: "OAuth",
    metadata: { provider: "GOOGLE" },
    req,
  });

  const url = buildGoogleAuthorizationUrl(state);
  res.redirect(302, url);
}

export async function googleAuthCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const env = loadEnv();

  const oauthError =
    typeof req.query.error === "string" ? req.query.error : undefined;
  if (oauthError) {
    res.redirect(
      302,
      loginErrorRedirect(
        "GOOGLE_CANCELLED",
        "تم إلغاء تسجيل Google أو رفض الإذن.",
      ),
    );
    return;
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";

  if (!code || !state) {
    res.redirect(
      302,
      loginErrorRedirect(
        "GOOGLE_INVALID_CALLBACK",
        "استجابة Google غير صالحة.",
      ),
    );
    return;
  }

  try {
    let nextPath: string | undefined;
    try {
      const parsed = await verifyGoogleOAuthState(state);
      nextPath = parsed.next;
    } catch {
      res.redirect(
        302,
        loginErrorRedirect(
          "GOOGLE_INVALID_STATE",
          "انتهت صلاحية الجلسة. أعد المحاولة.",
        ),
      );
      return;
    }

    const accessToken = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserInfo(accessToken);
    const result = await resolveGoogleAuthUser(profile, nextPath);

    if (result.role !== UserRole.STUDENT) {
      throw new AppError(
        "GOOGLE_STAFF_NOT_ALLOWED",
        "تسجيل Google متاح للطلاب فقط.",
        403,
      );
    }

    const jwt = await signAccessToken({
      userId: result.userId,
      role: result.role,
    });
    const maxAge = parseDurationToMs(env.JWT_EXPIRES_IN);
    res.cookie(AUTH_ACCESS_COOKIE_NAME, jwt, authCookieOptions(maxAge));

    await writeAuditLog({
      actorId: result.userId,
      action: "AUTH_LOGIN_SUCCESS",
      entityType: "User",
      entityId: result.userId,
      metadata: { provider: "GOOGLE" },
      req,
    });

    if (result.isNewUser) {
      await writeAuditLog({
        actorId: result.userId,
        action: "STUDENT_SIGNUP_CREATED",
        entityType: "User",
        entityId: result.userId,
        metadata: {
          email: profile.email.trim().toLowerCase(),
          status: "ACTIVE",
          provider: "GOOGLE",
          emailVerified: profile.email_verified === true,
        },
        req,
      });
    }

    await writeAuditLog({
      actorId: result.userId,
      action: "GOOGLE_AUTH_SUCCESS",
      entityType: "User",
      entityId: result.userId,
      metadata: { isNewUser: result.isNewUser },
      req,
    });

    res.redirect(302, `${env.CLIENT_ORIGIN}${result.redirectPath}`);
  } catch (err) {
    const appErr =
      err instanceof AppError
        ? err
        : new AppError(
            "GOOGLE_AUTH_FAILED",
            "تعذّر إكمال تسجيل Google.",
            500,
          );
    res.redirect(
      302,
      loginErrorRedirect(appErr.code, appErr.message),
    );
  }
}
