"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  Menu,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LearnCourseSkeleton } from "@/components/student/student-page-skeletons";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { Button } from "@/components/ui/button";
import {
  StudentApiError,
  invalidateStudentDataCache,
  studentFetchJson,
  studentFetchJsonCached,
} from "@/lib/student-client-api";
import { cn } from "@/lib/utils";

type LearnPayload = {
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    thumbnailUrl: string | null;
    level: string;
    estimatedDurationMinutes: number | null;
    category: null | { id: string; name: string; slug: string };
    pricingType: "FREE" | "PAID";
    progressPercent: number;
  };
  sections: Array<{
    id: string;
    title: string;
    sortOrder: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      youtubeVideoId: string | null;
      progress: {
        isCompleted: boolean;
        watchedSeconds: number;
        completedAt: string | null;
        lastAccessedAt: string | null;
      };
    }>;
  }>;
  navigation: {
    currentLessonId: string;
    previousLessonId: string | null;
    nextLessonId: string | null;
  };
  currentLesson: {
    id: string;
    title: string;
    description: string | null;
    youtubeVideoId: string | null;
    durationSeconds: number | null;
    isPreview: boolean;
    sectionTitle: string | null;
    progress: {
      isCompleted: boolean;
      watchedSeconds: number;
      completedAt: string | null;
      lastAccessedAt: string | null;
    };
  };
  stats: {
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
  };
};

type LearnResponse = { success: true; data: LearnPayload };

function lessonIndex(d: LearnPayload): { current: number; total: number } {
  const flat = d.sections.flatMap((s) => s.lessons);
  const idx = flat.findIndex((l) => l.id === d.navigation.currentLessonId);
  return { current: idx >= 0 ? idx + 1 : 1, total: flat.length };
}

export function LearnCourseClient({
  courseSlug,
}: {
  courseSlug: string;
}): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonFromUrl = searchParams.get("lessonId");

  const [data, setData] = useState<LearnPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const q =
        lessonFromUrl && lessonFromUrl.length > 0
          ? `?lessonId=${encodeURIComponent(lessonFromUrl)}`
          : "";
      const json = await studentFetchJsonCached<LearnResponse>(
        `/student/courses/${encodeURIComponent(courseSlug)}/learn${q}`,
      );
      setData(json.data);
    } catch (e) {
      setData(null);
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر فتح صفحة التعلّم.",
      );
    } finally {
      setLoading(false);
    }
  }, [courseSlug, lessonFromUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data?.currentLesson?.id) return;
    void studentFetchJson(`/student/lessons/${data.currentLesson.id}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => undefined);
  }, [data?.currentLesson?.id]);

  async function markComplete(): Promise<void> {
    if (!data?.currentLesson?.id) return;
    setBusy(true);
    try {
      await studentFetchJson(
        `/student/lessons/${data.currentLesson.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
      invalidateStudentDataCache();
      await load();
    } catch (e) {
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر تسجيل الإكمال.",
      );
    } finally {
      setBusy(false);
    }
  }

  function goLesson(id: string): void {
    router.replace(`/learn/${courseSlug}?lessonId=${encodeURIComponent(id)}`);
    setSidebarOpen(false);
  }

  const position = useMemo(
    () => (data ? lessonIndex(data) : { current: 1, total: 1 }),
    [data],
  );

  if (loading && !data) {
    return <LearnCourseSkeleton />;
  }

  if (error && !data) {
    return (
      <div
        className={cn(
          "mx-auto w-full max-w-[min(100%,100rem)] py-6",
          STUDENT_CONTENT_PAD,
        )}
      >
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50/90 p-6 text-sm text-red-900">
        <p className="font-semibold">تعذّر الفتح</p>
        <p className="mt-2">{error}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()}>
            إعادة المحاولة
          </Button>
          <Button asChild variant="ghost">
            <Link href="/student/my-courses">كورساتي</Link>
          </Button>
        </div>
      </div>
      </div>
    );
  }

  const d = data!;
  const vid = d.currentLesson.youtubeVideoId;
  const completed = d.currentLesson.progress.isCompleted;

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[min(100%,100rem)] space-y-3 pb-10 pt-4 sm:pt-5 md:pb-12",
        STUDENT_CONTENT_PAD,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 px-0 text-xs text-muted-foreground hover:text-heading"
        >
          <Link href="/student/my-courses">← العودة لكورساتي</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 rounded-lg px-2.5 text-xs lg:hidden"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <Menu className="h-3.5 w-3.5" aria-hidden />
          قائمة الدروس
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition",
              sidebarOpen ? "rotate-180" : "",
            )}
          />
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,260px)_1fr] lg:items-start lg:gap-4">
        <aside
          className={cn(
            "rounded-2xl border border-border/80 bg-card shadow-card ring-1 ring-border/50",
            sidebarOpen ? "block" : "hidden lg:block",
          )}
        >
          <div className="border-b border-border/80 px-3 py-2.5">
            <h2 className="text-xs font-bold text-heading">محتوى الكورس</h2>
            <p className="mt-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
              اختر درسًا لمتابعة التقدّم. الدروس المكتملة تظهر بعلامة صح.
            </p>
          </div>
          <div className="max-h-[min(68vh,480px)] space-y-3 overflow-y-auto p-2">
            {d.sections.map((sec) => (
              <div key={sec.id}>
                <p className="mb-1.5 px-1.5 text-[0.6875rem] font-bold text-heading">
                  {sec.title}
                </p>
                <ul className="space-y-1">
                  {sec.lessons.map((les) => {
                    const active = les.id === d.navigation.currentLessonId;
                    const done = les.progress.isCompleted;
                    const hasVideo = Boolean(les.youtubeVideoId);
                    return (
                      <li key={les.id}>
                        <button
                          type="button"
                          onClick={() => goLesson(les.id)}
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-start text-xs transition",
                            active
                              ? "border-sky-200/90 bg-secondary/70 shadow-sm ring-1 ring-sky-100"
                              : "border-transparent hover:border-border/60 hover:bg-muted/50",
                          )}
                        >
                          {done ? (
                            <CheckCircle2
                              className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                              aria-hidden
                            />
                          ) : (
                            <Circle
                              className={cn(
                                "h-3 w-3 shrink-0",
                                active
                                  ? "text-primary"
                                  : "text-muted-foreground/50",
                              )}
                              aria-hidden
                            />
                          )}
                          <span
                            className={cn(
                              "min-w-0 flex-1 line-clamp-2 leading-snug",
                              active
                                ? "font-semibold text-heading"
                                : "text-foreground/90",
                            )}
                          >
                            {les.title}
                          </span>
                          {hasVideo ? (
                            <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                              فيديو
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card ring-1 ring-border/50 md:p-5">
            <p className="text-[0.6875rem] text-muted-foreground">
              الدرس {position.current} من {position.total}
              {d.currentLesson.sectionTitle
                ? ` · ${d.currentLesson.sectionTitle}`
                : ""}
              {" · الكورس: "}
              <span className="font-medium text-heading">{d.course.title}</span>
            </p>
            <h1 className="mt-1.5 text-balance text-lg font-bold text-heading md:text-xl">
              {d.currentLesson.title}
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              شاهد الفيديو ثم سجّل إكمال الدرس عند الانتهاء. يمكنك العودة لأي
              درس من القائمة الجانبية.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-card ring-1 ring-border/50 sm:p-4">
            {vid ? (
              <div className="mx-auto w-full max-w-2xl">
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-heading">
                <iframe
                  title={d.currentLesson.title}
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${vid}?rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                </div>
              </div>
            ) : (
              <div className="mx-auto flex aspect-video w-full max-w-2xl flex-col items-center justify-center gap-2 rounded-lg bg-muted/40 px-4 text-center">
                <PlayCircle className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-xs font-medium text-foreground">
                  لا يوجد فيديو مرتبط بهذا الدرس بعد.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card px-3 py-2 shadow-sm ring-1 ring-border/50 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-lg px-3 text-xs shadow-brand sm:order-1"
              disabled={!d.navigation.nextLessonId}
              onClick={() =>
                d.navigation.nextLessonId &&
                goLesson(d.navigation.nextLessonId)
              }
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              التالي
            </Button>
            <p className="text-center text-[0.6875rem] text-muted-foreground sm:order-2">
              تنقّل سريع بين الدروس
            </p>
            {d.navigation.previousLessonId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg px-3 text-xs sm:order-3"
                onClick={() => goLesson(d.navigation.previousLessonId!)}
              >
                السابق
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              </Button>
            ) : (
              <span className="text-center text-[0.6875rem] text-muted-foreground sm:order-3 sm:text-end">
                لا يوجد درس سابق
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 ring-1 ring-emerald-100/80 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-heading">
                  حالة إنجاز الدرس
                </h3>
                <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
                  {completed
                    ? "أكملت هذا الدرس. يمكنك الانتقال للدرس التالي."
                    : "بعد مشاهدة المحتوى، سجّل إكمال الدرس لتحديث تقدّمك."}
                </p>
                <p className="mt-2 text-[0.6875rem] font-medium text-emerald-800">
                  {d.stats.progressPercent}% — {d.stats.completedLessons}/
                  {d.stats.totalLessons} درسًا مكتملًا
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-8 w-full shrink-0 rounded-lg border-emerald-300/80 bg-card text-xs hover:bg-emerald-50 sm:mt-0 sm:w-auto sm:min-w-[11rem]"
                disabled={busy || completed}
                onClick={() => void markComplete()}
              >
                {completed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    الدرس مكتمل
                  </>
                ) : busy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    جارٍ الحفظ…
                  </>
                ) : (
                  "تمييز الدرس كمكتمل"
                )}
              </Button>
            </div>

            <div className="w-full rounded-2xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-border/50">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-sm font-bold text-heading">عن هذا الدرس</h3>
                {vid ? (
                  <span className="rounded bg-secondary px-2 py-0.5 text-[0.625rem] font-semibold text-secondary-foreground">
                    فيديو
                  </span>
                ) : null}
              </div>
              {d.currentLesson.description ? (
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {d.currentLesson.description}
                </p>
              ) : (
                <p className="mt-2.5 text-sm text-muted-foreground">
                  لا يوجد وصف إضافي لهذا الدرس.
                </p>
              )}
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-semibold text-heading">
                  الملفات
                </p>
                <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-2.5 py-4 text-center text-xs text-muted-foreground">
                  لا توجد ملفات مرفقة لهذا الدرس.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-border/50">
              <h3 className="text-xs font-bold text-heading">نظرة الكورس</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {d.course.shortDescription ??
                  d.course.description?.slice(0, 280) ??
                  "استمر في التعلّم خطوة بخطوة."}
                {d.course.description &&
                d.course.description.length > 280 &&
                !d.course.shortDescription
                  ? "…"
                  : null}
              </p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[0.6875rem] text-muted-foreground">
                  <span>تقدّمك في الكورس</span>
                  <span className="font-semibold tabular-nums text-primary">
                    {d.stats.progressPercent}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${d.stats.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
