import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { EditCourseShell } from "./edit-course-shell";

export const metadata: Metadata = {
  title: "تعديل كورس",
};

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-12 md:px-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold text-primary">تعديل كورس</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          تحكّم كامل بالحقول — مع هوية بصرية هادئة
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          بعد الحفظ يمكنك النشر أو الأرشفة من الشريط العلوي — يُحدَّث النموذج تلقائيًا.
        </p>
        <Button
          asChild
          className="mt-2 w-fit rounded-xl bg-orange-500 text-white hover:bg-orange-600"
        >
          <Link href={`/admin/courses/${id}/builder`}>بناء محتوى الكورس</Link>
        </Button>
      </header>

      <EditCourseShell courseId={id} />
    </div>
  );
}
