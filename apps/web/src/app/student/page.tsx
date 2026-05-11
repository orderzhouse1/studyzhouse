import type { Metadata } from "next";

import { StudentDashboard } from "@/components/student/student-dashboard";

export const metadata: Metadata = {
  title: "لوحة التعلّم",
};

export default function StudentHomePage(): React.ReactElement {
  return <StudentDashboard />;
}
