import type { Metadata } from "next";

import { StudentSettingsPanel } from "@/components/student/student-settings-panel";

export const metadata: Metadata = {
  title: "الإعدادات",
};

export default function StudentSettingsPage(): React.ReactElement {
  return <StudentSettingsPanel />;
}
