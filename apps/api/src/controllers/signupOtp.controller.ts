import type { Request, Response } from "express";

import { AppError } from "../lib/AppError.js";
import { writeAuditLog } from "../services/audit.service.js";
import * as signupOtpService from "../services/signupOtp.service.js";
import type {
  SignupBody,
  SignupOtpResendBody,
  SignupOtpVerifyBody,
} from "@studyhouse/shared";

export async function requestSignupOtp(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as SignupBody;
  const result = await signupOtpService.createSignupOtpChallenge(body);

  await writeAuditLog({
    actorId: null,
    action: "SIGNUP_OTP_REQUESTED",
    entityType: "SignupOtpChallenge",
    entityId: result.challengeId,
    metadata: { email: body.email.trim().toLowerCase() },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt.toISOString(),
      resendAvailableAt: result.resendAvailableAt.toISOString(),
      message: "أُرسل رمز التحقق إلى بريدك الإلكتروني.",
    },
  });
}

export async function verifySignupOtp(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as SignupOtpVerifyBody;

  let result: Awaited<
    ReturnType<typeof signupOtpService.verifySignupOtpAndCreateUser>
  >;
  try {
    result = await signupOtpService.verifySignupOtpAndCreateUser(
      body.challengeId,
      body.code.trim(),
    );
  } catch (err) {
    if (err instanceof AppError && err.code === "OTP_INVALID") {
      await writeAuditLog({
        actorId: null,
        action: "SIGNUP_OTP_VERIFY_FAILED",
        entityType: "SignupOtpChallenge",
        entityId: body.challengeId,
        metadata: { reason: "invalid_code" },
        req,
      });
    }
    throw err;
  }

  await writeAuditLog({
    actorId: null,
    action: "SIGNUP_OTP_VERIFIED",
    entityType: "SignupOtpChallenge",
    entityId: body.challengeId,
    req,
  });

  await writeAuditLog({
    actorId: null,
    action: "STUDENT_SIGNUP_CREATED",
    entityType: "User",
    entityId: result.user.id,
    metadata: {
      email: result.user.email,
      status: result.user.status,
      emailVerified: true,
    },
    req,
  });

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      message:
        "تم تأكيد بريدك وإنشاء حسابك بنجاح. يمكنك تسجيل الدخول الآن.",
    },
  });
}

export async function resendSignupOtp(
  req: Request,
  res: Response,
): Promise<void> {
  const body = req.body as SignupOtpResendBody;
  const result = await signupOtpService.resendSignupOtp(body.challengeId);

  await writeAuditLog({
    actorId: null,
    action: "SIGNUP_OTP_REQUESTED",
    entityType: "SignupOtpChallenge",
    entityId: body.challengeId,
    metadata: { resend: true },
    req,
  });

  res.status(200).json({
    success: true,
    data: {
      expiresAt: result.expiresAt.toISOString(),
      resendAvailableAt: result.resendAvailableAt.toISOString(),
      message: "أُعيد إرسال رمز التحقق.",
    },
  });
}
