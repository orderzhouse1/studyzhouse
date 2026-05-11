"use client";

import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StudentCourseGridSkeleton } from "@/components/student/student-page-skeletons";
import {
  StudentApiError,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

type MyCoursesResponse = {
  success: true;
  data: {
    items: Array<{
      enrollmentId: string;
      progressPercent: number;
      completedLessons: number;
      totalLessons: number;
      lastAccessedLesson: null | { id: string; title: string };
      course: {
        id: string;
        title: string;
        slug: string;
        thumbnailUrl: string | null;
        category: null | { id: string; name: string; slug: string };
        pricingType: "FREE" | "PAID";
        level: string;
        estimatedDurationMinutes: number | null;
      };
    }>;
  };
};

export function MyCoursesPanel(): React.ReactElement {
  const [items, setItems] = useState<MyCoursesResponse["data"]["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await studentFetchJsonCached<MyCoursesResponse>(
        "/student/my-courses",
      );
      setItems(json.data.items);
    } catch (e) {
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر تحميل كورساتك.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && items.length === 0 && !error) {
    return <StudentCourseGridSkeleton cards={4} />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-6 text-center text-sm text-red-900">
        {error}
        <div className="mt-4">
          <Button type="button" variant="outline" onClick={() => void load()}>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="rounded-3xl border-dashed border-primary/30 bg-card/80 py-12 text-center shadow-sm ring-1 ring-primary/15">
        <CardContent className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <BookOpen className="h-7 w-7" aria-hidden />
          </div>
          <CardTitle className="text-xl">لا كورسات بعد</CardTitle>
          <CardDescription className="mx-auto max-w-md text-base leading-relaxed">
            لم تسجّل في أي كورس حتى الآن. استكشف الكتالوج العام عندما يكون
            التسجيل متاحًا في المراحل القادمة.
          </CardDescription>
          <Button asChild className="rounded-xl">
            <Link href="/student/explore">استكشف الكورسات</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">كورساتي</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          تقدّمك محفوظ لكل كورس مسجّل به.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((row) => (
          <Card
            key={row.enrollmentId}
            className="overflow-hidden rounded-3xl border-border shadow-card ring-1 ring-border/60"
          >
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-secondary/50 to-muted">
              {row.course.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote URLs from CMS
                <img
                  src={row.course.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 opacity-40" aria-hidden />
                </div>
              )}
            </div>
            <CardHeader className="space-y-1 pb-2">
              <p className="text-xs font-medium text-primary">
                {row.course.category?.name ?? "بدون تصنيف"}
              </p>
              <CardTitle className="text-lg leading-snug">
                {row.course.title}
              </CardTitle>
              <CardDescription>
                {row.completedLessons} / {row.totalLessons} درسًا مكتملًا
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>التقدّم</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {row.progressPercent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${row.progressPercent}%` }}
                  />
                </div>
              </div>
              {row.lastAccessedLesson ? (
                <p className="text-xs text-muted-foreground">
                  آخر نشاط: {row.lastAccessedLesson.title}
                </p>
              ) : null}
              <Button
                asChild
                className="w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                <Link
                  href={
                    row.lastAccessedLesson
                      ? `/learn/${row.course.slug}?lessonId=${row.lastAccessedLesson.id}`
                      : `/learn/${row.course.slug}`
                  }
                >
                  متابعة التعلّم
                  <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
