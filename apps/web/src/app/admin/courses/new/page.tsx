import type { Metadata } from "next";

import { CourseEditorForm } from "@/components/admin/course-editor-form";

export const metadata: Metadata = {
  title: "كورس جديد",
};

export default function NewCoursePage(): React.ReactElement {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 md:px-8">
      <header className="mb-10 space-y-3">
        <p className="text-xs font-semibold text-primary">إنشاء كورس</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          مسودة أنيقة وجاهزة للنشر لاحقًا
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          أضف المحتوى الأساسي الآن — بناء الدروس وتنسيقها سيأتي في مراحل لاحقة.
        </p>
      </header>

      <CourseEditorForm mode="create" />
    </div>
  );
}
