import type { Metadata } from "next";
import { Suspense } from "react";

import { StudentDashboard } from "@/components/student/student-dashboard";
import { StudentDashboardSkeleton } from "@/components/student/student-page-skeletons";

export const metadata: Metadata = {
  title: "لوحة التعلّم",
};

export default function StudentHomePage(): React.ReactElement {
  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentDashboard />
    </Suspense>
  );
}
