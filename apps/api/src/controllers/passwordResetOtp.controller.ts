import type { Request, Response } from "express";

import { AppError } from "../lib/AppError.js";
import { writeAuditLog } from "../services/audit.service.js";
import * as passwordResetOtpService from "../services/passwordResetOtp.service.js";
import type {
  ForgotPasswordRequestOtpBody,
  ForgotPasswordResendOtpBody,
  ForgotPasswordVerifyOtpBody,
} from "@studyhouse/shared";
import { PASSWORD_RESET_GENERIC_MESSAGE } from "@studyhouse/shared";

export async function requestPasswordResetOtp(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as ForgotPasswordRequestOtpBody;

  const result = await passwordResetOtpService.requestPasswordResetOtp(
    body.email,
  );

  if (result.emailSent && result.challengeId) {
    await writeAuditLog({
      actorId: null,
      action: "PASSWORD_RESET_OTP_REQUESTED",
      entityType: "PasswordResetOtpChallenge",
      entityId: result.challengeId,
      metadata: { email: body.email.trim().toLowerCase() },
      req,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      message: PASSWORD_RESET_GENERIC_MESSAGE,
      ...(result.emailSent && result.challengeId
        ? {
            challengeId: result.challengeId,
            expiresAt: result.expiresAt?.toISOString(),
            resendAvailableAt: result.resendAvailableAt?.toISOString(),
          }
        : {}),
    },
  });
}

export async function resendPasswordResetOtp(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as ForgotPasswordResendOtpBody;
  const result = await passwordResetOtpService.resendPasswordResetOtp(body);

  await writeAuditLog({
    actorId: null,
    action: "PASSWORD_RESET_OTP_REQUESTED",
    entityType: "PasswordResetOtpChallenge",
    entityId: body.challengeId,
    metadata: { resend: true },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      message: PASSWORD_RESET_GENERIC_MESSAGE,
      expiresAt: result.expiresAt.toISOString(),
      resendAvailableAt: result.resendAvailableAt.toISOString(),
    },
  });
}

export async function verifyPasswordResetOtp(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as ForgotPasswordVerifyOtpBody;

  let userId: string;
  try {
    const result = await passwordResetOtpService.verifyPasswordResetOtp(body);
    userId = result.userId;
  } catch (err) {
    if (err instanceof AppError && err.code === "OTP_INVALID") {
      await writeAuditLog({
        actorId: null,
        action: "PASSWORD_RESET_FAILED",
        entityType: "PasswordResetOtpChallenge",
        entityId: body.challengeId,
        metadata: { reason: "invalid_code" },
        req,
      });
    }
    throw err;
  }

  await writeAuditLog({
    actorId: userId,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "User",
    entityId: userId,
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      message: "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
    },
  });
}
