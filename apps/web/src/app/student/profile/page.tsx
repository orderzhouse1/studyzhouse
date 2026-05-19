import type { Metadata } from "next";

import { StudentProfilePanel } from "@/components/student/student-profile-panel";

export const metadata: Metadata = {
  title: "الملف الشخصي",
};

export default function StudentProfilePage(): React.ReactElement {
  return <StudentProfilePanel />;
}
