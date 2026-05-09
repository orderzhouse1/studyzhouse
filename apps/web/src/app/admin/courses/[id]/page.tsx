import type { Metadata } from "next";

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
      </header>

      <EditCourseShell courseId={id} />
    </div>
  );
}
