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
      <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-red-50/90 p-6 text-sm text-red-900">
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
    );
  }

  const d = data!;
  const vid = d.currentLesson.youtubeVideoId;
  const completed = d.currentLesson.progress.isCompleted;

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-auto px-0 text-muted-foreground hover:text-heading"
        >
          <Link href="/student/my-courses">← العودة لكورساتي</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl lg:hidden"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <Menu className="h-4 w-4" aria-hidden />
          قائمة الدروس
          <ChevronDown
            className={cn(
              "h-4 w-4 transition",
              sidebarOpen ? "rotate-180" : "",
            )}
          />
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,300px)_1fr] lg:items-start lg:gap-5">
        <aside
          className={cn(
            "rounded-3xl border border-border/80 bg-card shadow-card ring-1 ring-border/50",
            sidebarOpen ? "block" : "hidden lg:block",
          )}
        >
          <div className="border-b border-border/80 px-4 py-4">
            <h2 className="text-sm font-bold text-heading">محتوى الكورس</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              اختر درسًا لمتابعة التقدّم. الدروس المكتملة تظهر بعلامة صح.
            </p>
          </div>
          <div className="max-h-[min(72vh,560px)] space-y-5 overflow-y-auto p-3">
            {d.sections.map((sec) => (
              <div key={sec.id}>
                <p className="mb-2 px-2 text-xs font-bold text-heading">
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
                            "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-sm transition",
                            active
                              ? "border-sky-200/90 bg-secondary/70 shadow-sm ring-1 ring-sky-100"
                              : "border-transparent hover:border-border/60 hover:bg-muted/50",
                          )}
                        >
                          {done ? (
                            <CheckCircle2
                              className="h-4 w-4 shrink-0 text-emerald-600"
                              aria-hidden
                            />
                          ) : (
                            <Circle
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
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
                            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
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

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-card px-4 py-3 shadow-sm ring-1 ring-border/50 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              className="rounded-xl shadow-brand sm:order-3"
              disabled={!d.navigation.nextLessonId}
              onClick={() =>
                d.navigation.nextLessonId &&
                goLesson(d.navigation.nextLessonId)
              }
            >
              التالي
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Button>
            <p className="text-center text-xs text-muted-foreground sm:order-2">
              تنقّل سريع بين الدروس
            </p>
            {d.navigation.previousLessonId ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl sm:order-1"
                onClick={() => goLesson(d.navigation.previousLessonId!)}
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
                السابق
              </Button>
            ) : (
              <span className="text-center text-xs text-muted-foreground sm:order-1 sm:text-end">
                لا يوجد درس سابق
              </span>
            )}
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-card ring-1 ring-border/50 md:p-6">
            <p className="text-xs text-muted-foreground">
              الدرس {position.current} من {position.total}
              {d.currentLesson.sectionTitle
                ? ` · ${d.currentLesson.sectionTitle}`
                : ""}
              {" · الكورس: "}
              <span className="font-medium text-heading">{d.course.title}</span>
            </p>
            <h1 className="mt-2 text-balance text-xl font-bold text-heading md:text-2xl">
              {d.currentLesson.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              شاهد الفيديو ثم سجّل إكمال الدرس عند الانتهاء. يمكنك العودة لأي
              درس من القائمة الجانبية.
            </p>
            <div className="mt-5 flex flex-col gap-2 border-t border-border/80 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!d.navigation.previousLessonId}
                onClick={() =>
                  d.navigation.previousLessonId &&
                  goLesson(d.navigation.previousLessonId)
                }
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
                الدرس السابق
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={!d.navigation.nextLessonId}
                onClick={() =>
                  d.navigation.nextLessonId &&
                  goLesson(d.navigation.nextLessonId)
                }
              >
                الدرس التالي
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-card ring-1 ring-border/50">
            {vid ? (
              <div className="aspect-video w-full bg-heading">
                <iframe
                  title={d.currentLesson.title}
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${vid}?rel=0`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-muted/40 px-4 text-center">
                <PlayCircle className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">
                  لا يوجد فيديو مرتبط بهذا الدرس بعد.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/50 p-5 ring-1 ring-emerald-100/80">
              <h3 className="text-sm font-bold text-heading">
                حالة إنجاز الدرس
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {completed
                  ? "أكملت هذا الدرس. يمكنك الانتقال للدرس التالي."
                  : "بعد مشاهدة المحتوى، سجّل إكمال الدرس لتحديث تقدّمك."}
              </p>
              <p className="mt-3 text-xs font-medium text-emerald-800">
                {d.stats.progressPercent}% — {d.stats.completedLessons}/
                {d.stats.totalLessons} درسًا مكتملًا
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full rounded-xl border-emerald-300/80 bg-card hover:bg-emerald-50"
                disabled={busy || completed}
                onClick={() => void markComplete()}
              >
                {completed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    الدرس مكتمل
                  </>
                ) : busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جارٍ الحفظ…
                  </>
                ) : (
                  "تمييز الدرس كمكتمل"
                )}
              </Button>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm ring-1 ring-border/50">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-heading">عن هذا الدرس</h3>
                {vid ? (
                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                    فيديو
                  </span>
                ) : null}
              </div>
              {d.currentLesson.description ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {d.currentLesson.description}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  لا يوجد وصف إضافي لهذا الدرس.
                </p>
              )}
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-heading">
                  الملفات
                </p>
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-3 py-6 text-center text-xs text-muted-foreground">
                  لا توجد ملفات مرفقة لهذا الدرس.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm ring-1 ring-border/50 md:col-span-2">
              <h3 className="text-sm font-bold text-heading">نظرة الكورس</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {d.course.shortDescription ??
                  d.course.description?.slice(0, 280) ??
                  "استمر في التعلّم خطوة بخطوة."}
                {d.course.description &&
                d.course.description.length > 280 &&
                !d.course.shortDescription
                  ? "…"
                  : null}
              </p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>تقدّمك في الكورس</span>
                  <span className="font-semibold tabular-nums text-primary">
                    {d.stats.progressPercent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${d.stats.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
