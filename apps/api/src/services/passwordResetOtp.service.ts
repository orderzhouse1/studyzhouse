import { UserStatus } from "@prisma/client";
import type {
  ForgotPasswordResendOtpBody,
  ForgotPasswordVerifyOtpBody,
} from "@studyhouse/shared";
import { PASSWORD_RESET_GENERIC_MESSAGE } from "@studyhouse/shared";

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
import { prisma } from "../lib/prisma.js";
import { sendPasswordResetOtpEmail } from "./email.service.js";

export { PASSWORD_RESET_GENERIC_MESSAGE };

/**
 * SUSPENDED / DELETED: no email sent; generic response only (login stays blocked for SUSPENDED).
 * ACTIVE (all roles): email OTP proves ownership; password can be set/changed.
 */
function isEligibleForPasswordReset(status: UserStatus): boolean {
  return status === UserStatus.ACTIVE;
}

async function supersedeOpenChallenges(emailNorm: string): Promise<void> {
  await prisma.passwordResetOtpChallenge.updateMany({
    where: { email: emailNorm, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}

export async function requestPasswordResetOtp(email: string): Promise<{
  emailSent: boolean;
  challengeId?: string;
  expiresAt?: Date;
  resendAvailableAt?: Date;
}> {
  const emailNorm = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: emailNorm } });

  if (!user || !isEligibleForPasswordReset(user.status)) {
    return { emailSent: false };
  }

  await supersedeOpenChallenges(emailNorm);

  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  const challenge = await prisma.passwordResetOtpChallenge.create({
    data: {
      email: emailNorm,
      userId: user.id,
      codeHash,
      expiresAt,
      lastSentAt: now,
    },
  });

  await sendPasswordResetOtpEmail({
    to: emailNorm,
    fullName: user.fullName,
    code,
  });

  return {
    emailSent: true,
    challengeId: challenge.id,
    expiresAt,
    resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS),
  };
}

async function loadOpenResetChallenge(
  challengeId: string,
  emailNorm: string,
) {
  const challenge = await prisma.passwordResetOtpChallenge.findUnique({
    where: { id: challengeId },
    include: { user: true },
  });
  if (!challenge || challenge.consumedAt) {
    throw new AppError(
      "CHALLENGE_NOT_FOUND",
      "طلب إعادة التعيين غير صالح أو منتهٍ.",
      404,
    );
  }
  if (challenge.email !== emailNorm) {
    throw new AppError(
      "CHALLENGE_NOT_FOUND",
      "طلب إعادة التعيين غير صالح.",
      404,
    );
  }
  if (!isEligibleForPasswordReset(challenge.user.status)) {
    throw new AppError(
      "CHALLENGE_NOT_FOUND",
      "طلب إعادة التعيين غير صالح.",
      404,
    );
  }
  return challenge;
}

export async function resendPasswordResetOtp(
  body: ForgotPasswordResendOtpBody,
): Promise<{
  expiresAt: Date;
  resendAvailableAt: Date;
}> {
  const emailNorm = body.email.trim().toLowerCase();
  const challenge = await loadOpenResetChallenge(body.challengeId, emailNorm);

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

  const updated = await prisma.passwordResetOtpChallenge.update({
    where: { id: challenge.id },
    data: {
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
  });

  await sendPasswordResetOtpEmail({
    to: emailNorm,
    fullName: challenge.user.fullName,
    code,
  });

  return {
    expiresAt: updated.expiresAt,
    resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS),
  };
}

async function loadOpenResetChallengeById(challengeId: string) {
  const challenge = await prisma.passwordResetOtpChallenge.findUnique({
    where: { id: challengeId },
    include: { user: true },
  });
  if (!challenge || challenge.consumedAt) {
    throw new AppError(
      "CHALLENGE_NOT_FOUND",
      "طلب إعادة التعيين غير صالح أو منتهٍ.",
      404,
    );
  }
  if (!isEligibleForPasswordReset(challenge.user.status)) {
    throw new AppError(
      "CHALLENGE_NOT_FOUND",
      "طلب إعادة التعيين غير صالح.",
      404,
    );
  }
  return challenge;
}

export async function verifyPasswordResetOtp(
  body: ForgotPasswordVerifyOtpBody,
): Promise<{ userId: string }> {
  const challenge = await loadOpenResetChallengeById(body.challengeId);

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

  const valid = verifyOtpCode(body.code, challenge.codeHash);
  if (!valid) {
    const attempts = challenge.attempts + 1;
    await prisma.passwordResetOtpChallenge.update({
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

  const passwordHash = await hashPassword(body.newPassword);
  const consumedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetOtpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt },
    });
    await tx.passwordResetOtpChallenge.updateMany({
      where: {
        email: challenge.email,
        consumedAt: null,
        id: { not: challenge.id },
      },
      data: { consumedAt },
    });
    await tx.user.update({
      where: { id: challenge.userId },
      data: { passwordHash },
    });
  });

  return { userId: challenge.userId };
}
