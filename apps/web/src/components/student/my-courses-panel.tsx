"use client";

import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  MyCourseCard,
  MyCoursesSection,
  StudentDashboardHero,
  STUDENT_CONTENT_PAD,
} from "@/components/student/student-dashboard-ui";
import { StudentMyCoursesSkeleton } from "@/components/student/student-page-skeletons";
import { Button } from "@/components/ui/button";
import {
  StudentApiError,
  studentFetchJsonCached,
} from "@/lib/student-client-api";
import { cn } from "@/lib/utils";

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
      lessonId: string;
      lessonTitle: string;
    };
  };
};

type MyCoursesResponse = {
  success: true;
  data: {
    items: Array<{
      kind?: "enrolled" | "pending_payment";
      paymentRequestId?: string;
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
  const [dash, setDash] = useState<DashboardResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [mine, dashJson] = await Promise.all([
        studentFetchJsonCached<MyCoursesResponse>("/student/my-courses"),
        studentFetchJsonCached<DashboardResponse>("/student/dashboard").catch(
          () => null,
        ),
      ]);
      setItems(mine.data.items);
      setDash(dashJson?.data ?? null);
    } catch (e) {
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر تحميل كورساتك.",
      );
      setItems([]);
      setDash(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { enrolled, pending } = useMemo(() => {
    const enrolledItems = items.filter((i) => i.kind !== "pending_payment");
    const pendingItems = items.filter((i) => i.kind === "pending_payment");
    return { enrolled: enrolledItems, pending: pendingItems };
  }, [items]);

  if (loading && items.length === 0 && !error) {
    return <StudentMyCoursesSkeleton />;
  }

  if (error) {
    return (
      <div className={cn(STUDENT_CONTENT_PAD, "py-12")}>
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-6 text-center text-sm text-red-900">
          {error}
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={() => void load()}>
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const heroStats = [
    {
      label: "كورسات نشطة",
      value: enrolled.length,
      icon: GraduationCap,
    },
    {
      label: "قيد المراجعة",
      value: pending.length,
      icon: Clock,
    },
    {
      label: "دروس مكتملة",
      value: dash?.completedLessonsCount ?? "—",
      icon: BookOpen,
    },
    {
      label: "التقدّم الكلي",
      value: dash ? `${dash.overallProgressPercent}%` : "—",
      icon: Sparkles,
    },
  ];

  const continueBlock =
    dash?.continueLearning && enrolled.length > 0 ? (
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">تابع من حيث توقفت</p>
          <p className="mt-1 font-semibold">{dash.continueLearning.courseTitle}</p>
          <p className="text-sm text-white/70">
            {dash.continueLearning.lessonTitle}
          </p>
        </div>
        <Button
          asChild
          className="shrink-0 rounded-xl bg-primary shadow-brand hover:bg-[hsl(var(--primary-hover))]"
        >
          <Link
            href={`/learn/${dash.continueLearning.courseSlug}?lessonId=${dash.continueLearning.lessonId}`}
          >
            متابعة الدرس
            <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    ) : null;

  if (items.length === 0) {
    return (
      <div className="pb-16">
        <StudentDashboardHero
          eyebrow="مساحتك التعليمية"
          title="كورساتي"
          description="لم تسجّل في أي كورس بعد — استكشف الكتالوج وابدأ رحلتك."
          stats={[
            { label: "كورسات نشطة", value: 0, icon: GraduationCap },
            { label: "قيد المراجعة", value: 0, icon: Clock },
            { label: "دروس مكتملة", value: 0, icon: BookOpen },
            { label: "التقدّم الكلي", value: "0%", icon: TrendingUp },
          ]}
        />
        <div
          className={cn(
            "mx-auto max-w-[min(100%,100rem)] py-10 md:py-12",
            STUDENT_CONTENT_PAD,
          )}
        >
          <div className="rounded-2xl border border-dashed border-primary/30 bg-card/80 px-6 py-14 text-center shadow-sm ring-1 ring-primary/15">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <BookOpen className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-4 text-xl font-bold text-heading">لا كورسات بعد</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              استكشف الكتالوج واختر أول كورس — التقدّم يظهر هنا فور التسجيل.
            </p>
            <Button
              asChild
              className="mt-6 rounded-xl bg-primary shadow-brand hover:bg-[hsl(var(--primary-hover))]"
            >
              <Link href="/student/explore">
                استكشف الكورسات
                <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <StudentDashboardHero
        eyebrow="مساحتك التعليمية"
        title="كورساتي"
        description="كل تسجيلاتك النشطة وطلبات التفعيل في مكان واحد — تابع التعلّم بنقرة."
        stats={heroStats}
        action={continueBlock}
      />

      <div
        className={cn(
          "mx-auto max-w-[min(100%,100rem)] space-y-14 py-10 md:py-12",
          STUDENT_CONTENT_PAD,
        )}
      >
        {pending.length > 0 ? (
          <MyCoursesSection
            title="قيد المراجعة"
            description="طلبات CliQ بانتظار موافقة الإدارة — لا يمكن البدء بالتعلّم حتى القبول."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pending.map((row) => (
                <MyCourseCard
                  key={`pending-${row.paymentRequestId ?? row.course.id}`}
                  row={row}
                />
              ))}
            </div>
          </MyCoursesSection>
        ) : null}

        {enrolled.length > 0 ? (
          <MyCoursesSection
            title="متابعة التعلّم"
            description={
              dash
                ? `${dash.inProgressCoursesCount} كورسًا قيد التقدّم — تقدّمك الكلي ${dash.overallProgressPercent}%`
                : "وصول سريع لكل ما سجّلت به."
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {enrolled.map((row) => (
                <MyCourseCard key={row.enrollmentId} row={row} />
              ))}
            </div>
          </MyCoursesSection>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3 border-t border-border/60 pt-8">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-heading/15 text-heading hover:border-primary hover:text-primary"
          >
            <Link href="/student">
              العودة للوحة التعلّم
              <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-xl bg-primary shadow-brand hover:bg-[hsl(var(--primary-hover))]"
          >
            <Link href="/student/explore">
              استكشف كورسات جديدة
              <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
