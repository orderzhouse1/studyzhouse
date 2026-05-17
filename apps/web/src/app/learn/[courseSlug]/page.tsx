import type { Metadata } from "next";
import { Suspense } from "react";

import { LearnCourseClient } from "./learn-course-client";

type Props = {
  params: Promise<{ courseSlug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  return {
    title: `تعلّم — ${courseSlug}`,
  };
}

function LearnFallback(): React.ReactElement {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-muted-foreground sm:px-6 md:px-10">
      جاري التحميل…
    </div>
  );
}

export default async function LearnCoursePage({
  params,
}: Props): Promise<React.ReactElement> {
  const { courseSlug } = await params;
  return (
    <Suspense fallback={<LearnFallback />}>
      <LearnCourseClient courseSlug={courseSlug} />
    </Suspense>
  );
}
