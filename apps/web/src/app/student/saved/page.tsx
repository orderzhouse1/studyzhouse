import type { Metadata } from "next";

import { StudentSavedPanel } from "@/components/student/student-saved-panel";

export const metadata: Metadata = {
  title: "المحفوظات",
};

export default function StudentSavedPage(): React.ReactElement {
  return <StudentSavedPanel />;
}
