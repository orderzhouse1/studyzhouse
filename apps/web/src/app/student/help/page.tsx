import type { Metadata } from "next";

import { StudentHelpPanel } from "@/components/student/student-help-panel";

export const metadata: Metadata = {
  title: "مركز التعليمات",
};

export default function StudentHelpPage(): React.ReactElement {
  return <StudentHelpPanel />;
}
