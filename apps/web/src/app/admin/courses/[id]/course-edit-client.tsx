"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CourseEditorForm } from "@/components/admin/course-editor-form";
import { Button } from "@/components/ui/button";
import { adminFetchJson } from "@/lib/courses-client-api";

type AdminCoursePayload = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  pricingType: "FREE" | "PAID";
  priceAmount: string | null;
  currency: string;
  level:
    | "BEGINNER"
    | "INTERMEDIATE"
    | "ADVANCED"
    | "ALL_LEVELS";
  estimatedDurationMinutes: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: null | { id: string; name: string; slug: string };
};

export function CourseEditClient({
  courseId,
  refetchKey = 0,
}: {
  courseId: string;
  /** Increment after publish/archive so الحالة في النموذج تبقى متزامنة */
  refetchKey?: number;
}): React.ReactElement {
  const [course, setCourse] = useState<AdminCoursePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setCourse(null);
    async function load(): Promise<void> {
      try {
        const json = await adminFetchJson<{
          success: true;
          data: { course: AdminCoursePayload };
        }>(`/admin/courses/${courseId}`);
        if (!cancelled) {
          setCourse(json.data.course);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "تعذّر تحميل الكورس.");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [courseId, refetchKey]);

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-8 text-sm text-destructive">
        <p>{error}</p>
        <Button asChild variant="outline" className="mt-4 rounded-xl">
          <Link href="/admin/courses">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-10 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        جارٍ تحميل بيانات الكورس…
      </div>
    );
  }

  return (
    <CourseEditorForm mode="edit" courseId={courseId} initial={course} />
  );
}
