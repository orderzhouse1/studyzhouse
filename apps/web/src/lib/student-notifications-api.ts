import type { NotificationItem } from "@studyhouse/shared";

import {
  studentFetchJson,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

type NotificationsResponse = {
  success: true;
  data: { items: NotificationItem[]; unreadCount: number };
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type UnreadCountResponse = {
  success: true;
  data: { unreadCount: number };
};

export async function fetchStudentNotifications(
  page = 1,
  pageSize = 30,
): Promise<{
  items: NotificationItem[];
  unreadCount: number;
  meta?: NotificationsResponse["meta"];
}> {
  const json = await studentFetchJsonCached<NotificationsResponse>(
    `/student/notifications?page=${page}&pageSize=${pageSize}`,
  );
  return {
    items: json.data.items,
    unreadCount: json.data.unreadCount,
    meta: json.meta,
  };
}

export async function fetchStudentNotificationsUnreadCount(): Promise<number> {
  const json = await studentFetchJsonCached<UnreadCountResponse>(
    "/student/notifications/unread-count",
  );
  return json.data.unreadCount;
}

export async function markStudentNotificationRead(
  notificationId: string,
): Promise<void> {
  await studentFetchJson(`/student/notifications/${notificationId}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

export async function markAllStudentNotificationsRead(): Promise<void> {
  await studentFetchJson("/student/notifications/read-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}
