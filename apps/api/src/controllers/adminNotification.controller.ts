import type { Request, Response } from "express";

import type { AdminSendNotificationBody } from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import { sendAdminNotification } from "../services/adminNotification.service.js";

function requireAdminId(req: Request): string {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  return auth.userId;
}

export async function sendAdminNotificationHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const adminId = requireAdminId(req);
  const body = req.body as AdminSendNotificationBody;

  const result = await sendAdminNotification(adminId, body, req);

  res.status(200).json({
    success: true,
    data: result,
  });
}
