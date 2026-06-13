import type { Request, Response } from "express";

import type { WebPushSubscribeBody, WebPushUnsubscribeBody } from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import { getWebPushPublicKeyResponse } from "../services/webPushConfig.service.js";
import {
  deactivateWebPushSubscription,
  upsertWebPushSubscription,
} from "../services/webPushSubscription.service.js";

function requireStudentId(req: Request): string {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  return auth.userId;
}

export async function getStudentWebPushPublicKey(
  req: Request,
  res: Response,
): Promise<void> {
  requireStudentId(req);
  const data = getWebPushPublicKeyResponse();
  res.status(200).json({ success: true, data });
}

export async function subscribeStudentWebPush(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireStudentId(req);
  const body = req.body as WebPushSubscribeBody;

  const { subscriptionId } = await upsertWebPushSubscription(userId, body, req);

  res.status(200).json({
    success: true,
    data: { subscribed: true, subscriptionId },
  });
}

export async function unsubscribeStudentWebPush(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireStudentId(req);
  const body = req.body as WebPushUnsubscribeBody;

  const ok = await deactivateWebPushSubscription(userId, body.endpoint);

  res.status(200).json({
    success: true,
    data: { unsubscribed: ok },
  });
}
