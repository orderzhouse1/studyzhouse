import type { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import type {
  NotificationItem,
  PaginationQuery,
} from "@studyhouse/shared";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

function mapNotification(row: {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    actionUrl: row.actionUrl,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotificationsForUser(
  userId: string,
  query: PaginationQuery,
): Promise<{
  items: NotificationItem[];
  unreadCount: number;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const page = query.page;
  const pageSize = query.pageSize;
  const skip = (page - 1) * pageSize;

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: rows.map(mapNotification),
    unreadCount,
    meta: { page, pageSize, total, totalPages },
  };
}

export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<NotificationItem | null> {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!existing) return null;

  const updated = existing.readAt
    ? existing
    : await prisma.notification.update({
        where: { id: existing.id },
        data: { readAt: new Date() },
      });

  return mapNotification(updated);
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}
