import { z } from "zod";

import { paginationQuerySchema } from "./pagination";

export const notificationTypeSchema = z.enum([
  "PAYMENT_APPROVED",
  "PAYMENT_REJECTED",
  "COURSE_ENROLLED",
  "COURSE_REVOKED",
  "ACTIVATION_CODE_REDEEMED",
  "SYSTEM",
]);

export const notificationItemSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  actionUrl: z.string().nullable(),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const studentNotificationsQuerySchema = paginationQuerySchema;

export const notificationIdParamsSchema = z.object({
  notificationId: z.string().min(1),
});

export const studentNotificationsListResponseSchema = z.object({
  items: z.array(notificationItemSchema),
  unreadCount: z.number().int().min(0),
});

export const studentNotificationsUnreadCountSchema = z.object({
  unreadCount: z.number().int().min(0),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationItem = z.infer<typeof notificationItemSchema>;
