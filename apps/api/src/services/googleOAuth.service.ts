import { randomBytes } from "node:crypto";

import { OAuthProvider, UserRole, UserStatus } from "@prisma/client";

import { loadEnv } from "../config/env.js";
import { AppError } from "../lib/AppError.js";
import { hashPassword } from "../lib/password.js";
import { loadPlatformSettings } from "../lib/platformSettings.js";
import { prisma } from "../lib/prisma.js";
import { studentHomePath } from "../lib/safeRedirect.js";

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function assertGoogleOAuthConfigured(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const env = loadEnv();
  if (
    !env.GOOGLE_CLIENT_ID?.trim() ||
    !env.GOOGLE_CLIENT_SECRET?.trim() ||
    !env.GOOGLE_REDIRECT_URI?.trim()
  ) {
    throw new AppError(
      "GOOGLE_NOT_CONFIGURED",
      "تسجيل Google غير مفعّل. أضف GOOGLE_CLIENT_ID و GOOGLE_CLIENT_SECRET و GOOGLE_REDIRECT_URI في ملف البيئة.",
      503,
    );
  }
  return {
    clientId: env.GOOGLE_CLIENT_ID.trim(),
    clientSecret: env.GOOGLE_CLIENT_SECRET.trim(),
    redirectUri: env.GOOGLE_REDIRECT_URI.trim(),
  };
}

export function buildGoogleAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = assertGoogleOAuthConfigured();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<string> {
  const { clientId, clientSecret, redirectUri } = assertGoogleOAuthConfigured();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new AppError(
      "GOOGLE_TOKEN_EXCHANGE_FAILED",
      "تعذّر إكمال تسجيل Google.",
      502,
    );
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new AppError(
      "GOOGLE_TOKEN_EXCHANGE_FAILED",
      "تعذّر إكمال تسجيل Google.",
      502,
    );
  }
  return json.access_token;
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new AppError(
      "GOOGLE_PROFILE_FAILED",
      "تعذّر جلب بيانات Google.",
      502,
    );
  }
  const json = (await res.json()) as GoogleUserInfo;
  if (!json.sub || !json.email) {
    throw new AppError(
      "GOOGLE_PROFILE_FAILED",
      "بيانات Google غير مكتملة.",
      502,
    );
  }
  return json;
}

async function oauthOnlyPasswordHash(): Promise<string> {
  return hashPassword(`oauth-only:${randomBytes(32).toString("hex")}`);
}

function assertStudentMayLogin(user: {
  id: string;
  role: UserRole;
  status: UserStatus;
}): void {
  if (user.role !== UserRole.STUDENT) {
    throw new AppError(
      "GOOGLE_STAFF_NOT_ALLOWED",
      "تسجيل Google متاح للطلاب فقط.",
      403,
    );
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      "ACCOUNT_NOT_ACTIVE",
      "هذا الحساب غير مفعّل أو موقوف.",
      403,
    );
  }
}

export type GoogleAuthUserResult = {
  userId: string;
  role: UserRole;
  isNewUser: boolean;
  redirectPath: string;
};

export async function resolveGoogleAuthUser(
  profile: GoogleUserInfo,
  next?: string,
): Promise<GoogleAuthUserResult> {
  const emailNorm = profile.email.trim().toLowerCase();
  const providerAccountId = profile.sub;
  const emailVerifiedAt =
    profile.email_verified === true ? new Date() : null;

  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: OAuthProvider.GOOGLE,
        providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingOAuth) {
    assertStudentMayLogin(existingOAuth.user);
    await prisma.user.update({
      where: { id: existingOAuth.user.id },
      data: {
        lastLoginAt: new Date(),
        ...(emailVerifiedAt && !existingOAuth.user.emailVerifiedAt
          ? { emailVerifiedAt }
          : {}),
        ...(profile.picture && !existingOAuth.user.avatarUrl
          ? { avatarUrl: profile.picture }
          : {}),
      },
    });
    return {
      userId: existingOAuth.user.id,
      role: existingOAuth.user.role,
      isNewUser: false,
      redirectPath: studentHomePath(next),
    };
  }

  const byEmail = await prisma.user.findUnique({
    where: { email: emailNorm },
  });

  if (byEmail) {
    if (byEmail.role !== UserRole.STUDENT) {
      throw new AppError(
        "GOOGLE_STAFF_NOT_ALLOWED",
        "هذا البريد مرتبط بحساب إداري. استخدم تسجيل الدخول بالبريد وكلمة المرور.",
        403,
      );
    }
    assertStudentMayLogin(byEmail);

    await prisma.$transaction(async (tx) => {
      await tx.oAuthAccount.create({
        data: {
          userId: byEmail.id,
          provider: OAuthProvider.GOOGLE,
          providerAccountId,
          email: emailNorm,
        },
      });
      await tx.user.update({
        where: { id: byEmail.id },
        data: {
          lastLoginAt: new Date(),
          ...(emailVerifiedAt && !byEmail.emailVerifiedAt
            ? { emailVerifiedAt }
            : {}),
          ...(profile.picture && !byEmail.avatarUrl
            ? { avatarUrl: profile.picture }
            : {}),
        },
      });
    });

    return {
      userId: byEmail.id,
      role: byEmail.role,
      isNewUser: false,
      redirectPath: studentHomePath(next),
    };
  }

  const settings = await loadPlatformSettings();
  if (!settings.allowStudentSignup) {
    throw new AppError(
      "SIGNUP_DISABLED",
      "التسجيل الذاتي للطلاب غير متاح حاليًا.",
      403,
    );
  }

  const fullName =
    profile.name?.trim() || emailNorm.split("@")[0] || "طالب";
  const passwordHash = await oauthOnlyPasswordHash();

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        fullName,
        email: emailNorm,
        passwordHash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerifiedAt,
        avatarUrl: profile.picture ?? null,
        lastLoginAt: new Date(),
      },
    });
    await tx.oAuthAccount.create({
      data: {
        userId: created.id,
        provider: OAuthProvider.GOOGLE,
        providerAccountId,
        email: emailNorm,
      },
    });
    return created;
  });

  return {
    userId: user.id,
    role: user.role,
    isNewUser: true,
    redirectPath: studentHomePath(next),
  };
}
