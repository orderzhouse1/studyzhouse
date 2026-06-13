import type { Metadata } from "next";

import { AdminSendNotificationForm } from "@/components/admin/notifications/admin-send-notification-form";

export const metadata: Metadata = {
  title: "إرسال إشعار",
};

export default function AdminNotificationsPage(): React.ReactElement {
  return <AdminSendNotificationForm />;
}
