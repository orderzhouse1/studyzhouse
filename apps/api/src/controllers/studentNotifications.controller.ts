import type { Request, Response } from "express";

import { AppError } from "../lib/AppError.js";
import {
  getUnreadNotificationCount,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service.js";
import type { PaginationQuery } from "@studyhouse/shared";

export async function listStudentNotifications(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const query = req.validatedQuery as PaginationQuery;
  const out = await listNotificationsForUser(userId, query);
  res.status(200).json({
    success: true,
    data: { items: out.items, unreadCount: out.unreadCount },
    meta: out.meta,
  });
}

export async function getStudentNotificationsUnreadCount(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const unreadCount = await getUnreadNotificationCount(userId);
  res.status(200).json({
    success: true,
    data: { unreadCount },
  });
}

export async function markStudentNotificationRead(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const { notificationId } = req.validatedParams as {
    notificationId: string;
  };
  const item = await markNotificationRead(userId, notificationId);
  if (!item) {
    throw new AppError("NOT_FOUND", "الإشعار غير موجود.", 404);
  }
  res.status(200).json({ success: true, data: { notification: item } });
}

export async function markAllStudentNotificationsRead(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const count = await markAllNotificationsRead(userId);
  res.status(200).json({ success: true, data: { markedCount: count } });
}
