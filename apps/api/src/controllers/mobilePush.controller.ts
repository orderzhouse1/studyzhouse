import type { Request, Response } from "express";

import type { MobilePushTokenRegisterBody } from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import { sendMobilePushTestToUser } from "../services/mobilePushDelivery.service.js";
import {
  deactivateMobilePushToken,
  upsertMobilePushToken,
} from "../services/mobilePushToken.service.js";

function requireUserId(req: Request): string {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  return auth.userId;
}

export async function registerMobilePushToken(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const body = req.body as MobilePushTokenRegisterBody;
  const { tokenId } = await upsertMobilePushToken(userId, body);

  res.status(200).json({
    success: true,
    data: { registered: true, tokenId },
  });
}

export async function deleteMobilePushToken(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const token = decodeURIComponent(String(req.params.token ?? ""));
  if (!token) {
    throw new AppError("VALIDATION_ERROR", "رمز الجهاز مطلوب.", 400);
  }

  const deleted = await deactivateMobilePushToken(userId, token);

  res.status(200).json({
    success: true,
    data: { deleted },
  });
}

export async function sendMobilePushTest(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  const result = await sendMobilePushTestToUser(userId);

  res.status(200).json({
    success: true,
    data: result,
  });
}
