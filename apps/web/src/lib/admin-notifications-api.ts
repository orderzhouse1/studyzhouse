import type { AdminSendNotificationResponse } from "@studyhouse/shared";

import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type SendResponse = { success: true; data: AdminSendNotificationResponse };

export async function sendAdminNotification(body: {
  target: "ALL_STUDENTS" | "COURSE" | "STUDENT";
  courseId?: string;
  studentId?: string;
  title: string;
  body: string;
  actionUrl?: string;
  sendWebPush?: boolean;
}): Promise<AdminSendNotificationResponse> {
  const json = await adminFetchJson<SendResponse>("/admin/notifications/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json.data;
}

export { AdminApiError };
