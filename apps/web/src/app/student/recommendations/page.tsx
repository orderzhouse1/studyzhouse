import type { Metadata } from "next";

import { StudentRecommendationsSection } from "@/components/student/student-recommendations-section";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "مقترح لك",
};

export default function StudentRecommendationsPage(): React.ReactElement {
  return (
    <div className={cn("mx-auto max-w-[min(100%,100rem)] py-10 md:py-12", STUDENT_CONTENT_PAD)}>
      <StudentRecommendationsSection variant="page" limit={12} showViewAll={false} />
    </div>
  );
}
