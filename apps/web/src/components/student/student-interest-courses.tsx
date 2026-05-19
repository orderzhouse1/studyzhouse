"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CatalogCourseCard } from "@/components/courses/catalog-course-card";
import type { CourseCardCourse } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { fetchStudentProfile } from "@/lib/student-profile-api";
import { studentFetchJsonCached } from "@/lib/student-client-api";
import { cn } from "@/lib/utils";
import {
  STUDENT_INTEREST_MATCH_HINTS,
  STUDENT_INTEREST_OPTIONS,
} from "@studyhouse/shared";
import type { StudentInterestId } from "@studyhouse/shared";

type CoursesResponse = {
  success: true;
  data: { items: CourseCardCourse[] };
};

function courseMatchesInterests(
  course: CourseCardCourse,
  interestIds: StudentInterestId[],
): boolean {
  const hay = `${course.title} ${course.category?.name ?? ""} ${course.category?.slug ?? ""}`;
  for (const id of interestIds) {
    const patterns = STUDENT_INTEREST_MATCH_HINTS[id];
    if (patterns?.some((re) => re.test(hay))) return true;
  }
  return false;
}

export function StudentInterestCourses({
  className,
}: {
  className?: string;
}): React.ReactElement | null {
  const [interests, setInterests] = useState<StudentInterestId[]>([]);
  const [courses, setCourses] = useState<CourseCardCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [profile, catalog] = await Promise.all([
        fetchStudentProfile(),
        studentFetchJsonCached<CoursesResponse>("/courses?page=1&pageSize=48"),
      ]);
      setInterests(profile.interests);
      setCourses(catalog.data.items);
    } catch {
      setInterests([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const matched = useMemo(() => {
    if (interests.length === 0) return [];
    return courses
      .filter((c) => courseMatchesInterests(c, interests))
      .slice(0, 4);
  }, [courses, interests]);

  const interestLabels = useMemo(
    () =>
      interests
        .map(
          (id) =>
            STUDENT_INTEREST_OPTIONS.find((o) => o.id === id)?.labelAr ?? id,
        )
        .slice(0, 3)
        .join("، "),
    [interests],
  );

  if (loading || interests.length === 0) return null;

  return (
    <section
      className={cn(
        "mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-card p-4 ring-1 ring-primary/10 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            مقترحة حسب اهتماماتك
          </p>
          {interestLabels ? (
            <p className="mt-1 text-sm text-muted-foreground">
              قريبة من: {interestLabels}
            </p>
          ) : null}
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 shrink-0 rounded-full px-3 text-xs"
        >
          <Link href="/student/onboarding?from=explore">
            تحديث الاهتمامات
          </Link>
        </Button>
      </div>

      {matched.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          لم نجد كورسات مطابقة بعد — جرّب استكشاف التصنيفات أو أكمل ملفك لاحقًا.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {matched.map((course) => (
            <CatalogCourseCard
              key={course.id}
              course={course}
              detailBasePath="/student/courses"
            />
          ))}
        </div>
      )}

      <div className="mt-4 text-center sm:hidden">
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/student/explore">
            عرض كل الكورسات
            <ArrowLeft className="ms-1 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
