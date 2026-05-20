import type { Metadata } from "next";

import { StudentNotificationsPanel } from "@/components/student/student-notifications-panel";

export const metadata: Metadata = {
  title: "الإشعارات",
};

export default function StudentNotificationsPage(): React.ReactElement {
  return <StudentNotificationsPanel />;
}
