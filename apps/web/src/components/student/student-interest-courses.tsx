"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { StudentCoursesCatalogGrid } from "@/components/student/student-courses-catalog-grid";
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

function InterestCoursesSkeleton({
  variant,
}: {
  variant: "card" | "dashboard";
}): React.ReactElement {
  const grid = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[16/10] animate-pulse rounded-2xl bg-muted/60"
        />
      ))}
    </div>
  );

  if (variant === "card") {
    return (
      <section className="mb-8 rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-5">
        <div className="mb-4 h-5 w-40 animate-pulse rounded-lg bg-muted" />
        {grid}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-lg bg-muted md:h-8" />
        <div className="h-4 w-64 animate-pulse rounded-lg bg-muted" />
      </div>
      {grid}
    </section>
  );
}

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
  variant = "card",
  showCtaWhenEmpty = false,
  from = "explore",
}: {
  className?: string;
  /** card = صندوق مميز (استكشف)، dashboard = قسم لوحة التعلّم */
  variant?: "card" | "dashboard";
  /** عرض دعوة لإضافة الاهتمامات عند غيابها (لوحة التعلّم) */
  showCtaWhenEmpty?: boolean;
  from?: "explore" | "dashboard";
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

  const onboardingHref = `/student/onboarding?from=${from}`;

  if (loading) {
    if (variant === "dashboard" || showCtaWhenEmpty) {
      return <InterestCoursesSkeleton variant={variant} />;
    }
    return null;
  }

  if (interests.length === 0) {
    if (!showCtaWhenEmpty) return null;
    return (
      <section className={cn("space-y-4", className)}>
        <div>
          <h2 className="text-xl font-bold text-heading md:text-2xl">
            كورسات حسب اهتماماتك
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            أخبرنا بمجالات اهتمامك لنقترح عليك كورسات مناسبة في لوحتك.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-8 text-center sm:px-6">
          <Sparkles
            className="mx-auto h-8 w-8 text-primary/70"
            aria-hidden
          />
          <p className="mt-3 text-sm text-muted-foreground">
            لم تُحدّد اهتماماتك بعد.
          </p>
          <Button asChild className="mt-4 rounded-xl">
            <Link href={onboardingHref}>إضافة اهتماماتي</Link>
          </Button>
        </div>
      </section>
    );
  }

  const headerCard = (
    <>
      <p className="flex items-center gap-1 text-xs font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {variant === "dashboard" ? "مخصّص لك" : "مقترحة حسب اهتماماتك"}
      </p>
      {interestLabels ? (
        <p
          className={cn(
            "text-muted-foreground",
            variant === "dashboard"
              ? "mt-1 text-sm"
              : "mt-1 text-sm",
          )}
        >
          {variant === "dashboard"
            ? `بناءً على: ${interestLabels}`
            : `قريبة من: ${interestLabels}`}
        </p>
      ) : null}
    </>
  );

  const actions = (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={cn(
        "shrink-0 rounded-full px-3 text-xs",
        variant === "dashboard" && "rounded-xl border-heading/15",
      )}
    >
      <Link href={onboardingHref}>تحديث الاهتمامات</Link>
    </Button>
  );

  const body =
    matched.length === 0 ? (
      <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        لم نجد كورسات مطابقة بعد — جرّب استكشاف التصنيفات أو حدّث اهتماماتك.
      </p>
    ) : (
      <StudentCoursesCatalogGrid
        items={matched}
        detailBasePath="/student/courses"
      />
    );

  const exploreMore =
    variant === "dashboard" ? (
      <div className="flex justify-end">
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-heading/15 text-heading hover:border-primary hover:text-primary"
        >
          <Link href="/student/explore">
            استكشف المزيد
            <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    ) : (
      <div className="mt-4 text-center sm:hidden">
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href="/student/explore">
            عرض كل الكورسات
            <ArrowLeft className="ms-1 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    );

  if (variant === "dashboard") {
    return (
      <section className={cn("space-y-5", className)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-heading md:text-2xl">
              كورسات حسب اهتماماتك
            </h2>
            {headerCard}
          </div>
          {actions}
        </div>
        {body}
        {matched.length > 0 ? exploreMore : null}
      </section>
    );
  }

  return (
    <section
      className={cn(
        "mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-card p-4 ring-1 ring-primary/10 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>{headerCard}</div>
        {actions}
      </div>
      {body}
      {exploreMore}
    </section>
  );
}
