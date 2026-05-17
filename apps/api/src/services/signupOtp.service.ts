import { SignupOtpPurpose, UserRole, UserStatus } from "@prisma/client";
import type { SignupBody } from "@studyhouse/shared";
import { signupPublicUserSchema } from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import {
  generateOtpCode,
  hashOtpCode,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  verifyOtpCode,
} from "../lib/otpCode.js";
import { hashPassword } from "../lib/password.js";
import { loadPlatformSettings } from "../lib/platformSettings.js";
import { prisma } from "../lib/prisma.js";
import { sendSignupOtpEmail } from "./email.service.js";

export async function assertSignupAllowed(): Promise<void> {
  const settings = await loadPlatformSettings();
  if (!settings.allowStudentSignup) {
    throw new AppError(
      "SIGNUP_DISABLED",
      "التسجيل الذاتي للطلاب غير متاح حاليًا.",
      403,
    );
  }
}

export async function assertEmailAvailable(emailNorm: string): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: emailNorm },
  });
  if (existing) {
    throw new AppError(
      "DUPLICATE_EMAIL",
      "البريد الإلكتروني مستخدم مسبقًا.",
      409,
    );
  }
}

async function supersedeOpenChallenges(emailNorm: string): Promise<void> {
  await prisma.signupOtpChallenge.updateMany({
    where: {
      email: emailNorm,
      purpose: SignupOtpPurpose.SIGNUP,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });
}

export async function createSignupOtpChallenge(
  body: SignupBody,
): Promise<{
  challengeId: string;
  expiresAt: Date;
  resendAvailableAt: Date;
}> {
  await assertSignupAllowed();
  const emailNorm = body.email.trim().toLowerCase();
  await assertEmailAvailable(emailNorm);

  await supersedeOpenChallenges(emailNorm);

  const passwordHash = await hashPassword(body.password);
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  const challenge = await prisma.signupOtpChallenge.create({
    data: {
      email: emailNorm,
      fullName: body.fullName.trim(),
      passwordHash,
      codeHash,
      purpose: SignupOtpPurpose.SIGNUP,
      expiresAt,
      lastSentAt: now,
    },
  });

  await sendSignupOtpEmail({
    to: emailNorm,
    fullName: body.fullName.trim(),
    code,
  });

  return {
    challengeId: challenge.id,
    expiresAt,
    resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS),
  };
}

export async function loadOpenChallenge(challengeId: string) {
  const challenge = await prisma.signupOtpChallenge.findUnique({
    where: { id: challengeId },
  });
  if (!challenge || challenge.consumedAt) {
    throw new AppError(
      "CHALLENGE_NOT_FOUND",
      "طلب التحقق غير صالح أو منتهٍ. أعد التسجيل من البداية.",
      404,
    );
  }
  if (challenge.purpose !== SignupOtpPurpose.SIGNUP) {
    throw new AppError(
      "CHALLENGE_NOT_FOUND",
      "طلب التحقق غير صالح.",
      404,
    );
  }
  return challenge;
}

export async function resendSignupOtp(challengeId: string): Promise<{
  expiresAt: Date;
  resendAvailableAt: Date;
}> {
  await assertSignupAllowed();
  const challenge = await loadOpenChallenge(challengeId);

  const existingUser = await prisma.user.findUnique({
    where: { email: challenge.email },
  });
  if (existingUser) {
    throw new AppError(
      "DUPLICATE_EMAIL",
      "البريد الإلكتروني مستخدم مسبقًا.",
      409,
    );
  }

  const now = new Date();
  const cooldownEnds = new Date(
    challenge.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS,
  );
  if (now < cooldownEnds) {
    const waitSec = Math.ceil((cooldownEnds.getTime() - now.getTime()) / 1000);
    throw new AppError(
      "RESEND_COOLDOWN",
      `انتظر ${waitSec} ثانية قبل إعادة الإرسال.`,
      429,
      { resendAvailableAt: cooldownEnds.toISOString() },
    );
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  const updated = await prisma.signupOtpChallenge.update({
    where: { id: challenge.id },
    data: {
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
  });

  await sendSignupOtpEmail({
    to: challenge.email,
    fullName: challenge.fullName,
    code,
  });

  return {
    expiresAt: updated.expiresAt,
    resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS),
  };
}

export async function verifySignupOtpAndCreateUser(
  challengeId: string,
  code: string,
): Promise<{
  user: ReturnType<typeof signupPublicUserSchema.parse>;
  emailVerifiedAt: Date;
}> {
  await assertSignupAllowed();
  const challenge = await loadOpenChallenge(challengeId);

  const existingUser = await prisma.user.findUnique({
    where: { email: challenge.email },
  });
  if (existingUser) {
    await prisma.signupOtpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });
    throw new AppError(
      "DUPLICATE_EMAIL",
      "البريد الإلكتروني مستخدم مسبقًا.",
      409,
    );
  }

  const now = new Date();
  if (now > challenge.expiresAt) {
    throw new AppError(
      "OTP_EXPIRED",
      "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.",
      400,
    );
  }

  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    throw new AppError(
      "OTP_ATTEMPTS_EXCEEDED",
      "تجاوزت عدد المحاولات. اطلب رمزًا جديدًا.",
      429,
    );
  }

  const valid = verifyOtpCode(code, challenge.codeHash);
  if (!valid) {
    const attempts = challenge.attempts + 1;
    await prisma.signupOtpChallenge.update({
      where: { id: challenge.id },
      data: { attempts },
    });
    const remaining = OTP_MAX_ATTEMPTS - attempts;
    if (remaining <= 0) {
      throw new AppError(
        "OTP_ATTEMPTS_EXCEEDED",
        "تجاوزت عدد المحاولات. اطلب رمزًا جديدًا.",
        429,
      );
    }
    throw new AppError(
      "OTP_INVALID",
      `رمز التحقق غير صحيح. متبقٍ ${remaining} محاولة.`,
      400,
    );
  }

  const emailVerifiedAt = new Date();

  const user = await prisma.$transaction(async (tx) => {
    await tx.signupOtpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: emailVerifiedAt },
    });

    return tx.user.create({
      data: {
        fullName: challenge.fullName,
        email: challenge.email,
        passwordHash: challenge.passwordHash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        emailVerifiedAt,
      },
    });
  });

  const safeUser = signupPublicUserSchema.parse({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
  });

  return { user: safeUser, emailVerifiedAt };
}
