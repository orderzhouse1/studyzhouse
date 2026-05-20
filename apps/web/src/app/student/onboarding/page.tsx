import type { Metadata } from "next";
import { Suspense } from "react";

import { StudentOnboardingForm } from "@/components/student/student-onboarding-form";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "إكمال الملف التعليمي",
};

export default function StudentOnboardingPage(): React.ReactElement {
  return (
    <div className={cn(STUDENT_CONTENT_PAD, "pt-8 pb-16 sm:pt-10 md:pt-12")}>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted/50" />
          </div>
        }
      >
        <StudentOnboardingForm />
      </Suspense>
    </div>
  );
}
