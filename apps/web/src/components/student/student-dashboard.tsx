"use client";

import {
  ArrowLeft,
  BookOpen,
  Compass,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { StudentDashboardSkeleton } from "@/components/student/student-page-skeletons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  StudentApiError,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

type DashboardResponse = {
  success: true;
  data: {
    enrolledCoursesCount: number;
    completedLessonsCount: number;
    inProgressCoursesCount: number;
    overallProgressPercent: number;
    continueLearning: null | {
      courseTitle: string;
      courseSlug: string;
      courseCoverUrl: string | null;
      lessonId: string;
      lessonTitle: string;
    };
  };
};

export function StudentDashboard(): React.ReactElement {
  const [dash, setDash] = useState<DashboardResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const dashJson = await studentFetchJsonCached<DashboardResponse>(
        "/student/dashboard",
      );
      setDash(dashJson.data);
    } catch (e) {
      setError(
        e instanceof StudentApiError
          ? e.message
          : "تعذّر تحميل لوحة التعلّم.",
      );
      setDash(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !dash) {
    return <StudentDashboardSkeleton />;
  }

  if (error && !dash) {
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

  const d = dash!;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-secondary/25 px-5 py-6 shadow-card ring-1 ring-primary/15 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-primary">مرحبًا بك</p>
            <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
              أهلًا بك في رحلتك
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              تابع دروسك بهدوء، خطوة بخطوة — تقدّمك محفوظ ومرئي هنا.
            </p>
          </div>
          <Sparkles
            className="hidden h-12 w-12 text-primary/80 md:block"
            aria-hidden
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-secondary/80 shadow-sm ring-1 ring-border/60">
          <CardHeader className="pb-2">
            <CardDescription>كورسات مسجّل بها</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {d.enrolledCoursesCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-secondary/80 shadow-sm ring-1 ring-border/60">
          <CardHeader className="pb-2">
            <CardDescription>دروس مكتملة</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {d.completedLessonsCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-secondary/80 shadow-sm ring-1 ring-border/60">
          <CardHeader className="pb-2">
            <CardDescription>كورسات قيد التقدّم</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {d.inProgressCoursesCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-secondary/80 bg-secondary/20 shadow-sm ring-1 ring-secondary/70">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden />
              التقدّم الإجمالي
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums text-primary">
              {d.overallProgressPercent}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-3xl border-primary/25 bg-card shadow-card ring-1 ring-primary/15">
        <CardHeader className="border-b border-border bg-gradient-to-l from-card to-secondary/30 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden />
            تابع التعلّم
          </CardTitle>
          <CardDescription>
            آخر درس تفاعلت معه — يمكنك المتابعة مباشرة.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {d.continueLearning ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {d.continueLearning.courseTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {d.continueLearning.lessonTitle}
                </p>
              </div>
              <Button
                asChild
                className="rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-brand hover:bg-primary-hover"
              >
                <Link
                  href={`/learn/${d.continueLearning.courseSlug}?lessonId=${d.continueLearning.lessonId}`}
                >
                  متابعة الدرس
                  <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              لم نجد بعد نقطة آخر تقدّم مرصودة. ابدأ من{" "}
              <Link
                href="/student/my-courses"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                كورساتك
              </Link>{" "}
              أو من{" "}
              <Link
                href="/student/explore"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                الاستكشاف
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border-border shadow-sm ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
              كورساتي
            </CardTitle>
            <CardDescription>كل ما سجّلت به في مكان واحد.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/student/my-courses">عرض الكورسات</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border shadow-sm ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-5 w-5 text-primary" aria-hidden />
              استكشف الكورسات
            </CardTitle>
            <CardDescription>اكتشف كورسات جديدة منشورة على المنصة.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/student/explore">الذهاب للاستكشاف</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
