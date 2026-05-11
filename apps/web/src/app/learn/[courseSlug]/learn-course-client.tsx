"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Menu,
  PanelRightClose,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LearnCourseSkeleton } from "@/components/student/student-page-skeletons";
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

  if (loading && !data) {
    return <LearnCourseSkeleton />;
  }

  if (error && !data) {
    return (
      <Card className="mx-auto max-w-lg rounded-3xl border-red-200 bg-red-50/90">
        <CardHeader>
          <CardTitle className="text-red-950">تعذّر الفتح</CardTitle>
          <CardDescription className="text-red-900/90">{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()}>
            إعادة المحاولة
          </Button>
          <Button asChild variant="ghost">
            <Link href="/student/my-courses">كورساتي</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const d = data!;

  const vid = d.currentLesson.youtubeVideoId;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card/90 px-4 py-4 shadow-sm ring-1 ring-border/60 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="min-w-0 space-y-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-1 h-auto px-0 text-muted-foreground hover:text-foreground"
          >
            <Link href="/student/my-courses">← العودة لكورساتي</Link>
          </Button>
          <h1 className="text-balance text-xl font-bold md:text-2xl">
            {d.course.title}
          </h1>
          {d.course.shortDescription ? (
            <p className="text-sm text-muted-foreground">
              {d.course.shortDescription}
            </p>
          ) : null}
        </div>
        <div className="w-full max-w-xs shrink-0 space-y-1 md:text-end">
          <div className="flex justify-between text-xs text-muted-foreground md:justify-end md:gap-4">
            <span>تقدّم الكورس</span>
            <span className="tabular-nums font-semibold text-primary">
              {d.stats.progressPercent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${d.stats.progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground md:text-end">
            {d.stats.completedLessons} / {d.stats.totalLessons} درسًا مكتملًا
          </p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <Button
            type="button"
            variant="outline"
            className="mb-3 w-full justify-between rounded-xl lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <Menu className="h-4 w-4" aria-hidden />
              قائمة الدروس
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition",
                sidebarOpen ? "rotate-180" : "",
              )}
            />
          </Button>
          <aside
            className={cn(
              "rounded-3xl border border-border bg-card shadow-sm ring-1 ring-border/60",
              sidebarOpen ? "block" : "hidden lg:block",
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">محتوى الكورس</p>
              <PanelRightClose className="hidden h-4 w-4 text-muted-foreground lg:block" />
            </div>
            <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto p-3">
              {d.sections.map((sec) => (
                <div key={sec.id}>
                  <p className="mb-2 px-1 text-xs font-bold text-primary">
                    {sec.title}
                  </p>
                  <ul className="space-y-1">
                    {sec.lessons.map((les) => {
                      const active = les.id === d.navigation.currentLessonId;
                      const done = les.progress.isCompleted;
                      return (
                        <li key={les.id}>
                          <button
                            type="button"
                            onClick={() => goLesson(les.id)}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-start text-sm transition",
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "hover:bg-muted/70",
                            )}
                          >
                            {done ? (
                              <CheckCircle2
                                className={cn(
                                  "mt-0.5 h-4 w-4 shrink-0",
                                  active ? "text-primary-foreground" : "text-emerald-600",
                                )}
                              />
                            ) : (
                              <span
                                className={cn(
                                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                                  active ? "bg-primary-foreground/80" : "bg-muted-foreground/40",
                                )}
                              />
                            )}
                            <span className="line-clamp-2 leading-snug">
                              {les.title}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden rounded-3xl border-border shadow-card ring-1 ring-border/60">
            <div className="border-b border-border bg-gradient-to-l from-card to-secondary/25 px-4 py-3 md:px-6">
              <p className="text-xs font-medium text-primary">
                {d.currentLesson.sectionTitle ?? "الدرس"}
              </p>
              <CardTitle className="mt-1 text-lg md:text-xl">
                {d.currentLesson.title}
              </CardTitle>
            </div>
            <CardContent className="space-y-4 p-4 md:p-6">
              {vid ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-inner ring-1 ring-border">
                  <div className="aspect-video w-full">
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
                <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-4 text-center">
                  <p className="text-sm font-medium text-foreground">
                    لا يوجد فيديو مرتبط بهذا الدرس بعد.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    يمكنك الإكمال إن كان الدرس نصيًا أو معتمدًا على نشاط آخر لاحقًا.
                  </p>
                </div>
              )}

              {d.currentLesson.description ? (
                <div className="rounded-2xl border border-cyan-100/90 bg-cyan-50/60 px-4 py-3 text-sm leading-relaxed text-cyan-950 ring-1 ring-cyan-100/70">
                  {d.currentLesson.description}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  type="button"
                  disabled={busy || d.currentLesson.progress.isCompleted}
                  className="rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600"
                  onClick={() => void markComplete()}
                >
                  {d.currentLesson.progress.isCompleted ? (
                    "مكتمل ✓"
                  ) : busy ? (
                    <>
                      <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                      جاري الحفظ…
                    </>
                  ) : (
                    "تسجيل إكمال الدرس"
                  )}
                </Button>
                <div className="flex flex-1 flex-wrap gap-2 sm:justify-end">
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
                    <ArrowRight className="ms-1 h-4 w-4" aria-hidden />
                    السابق
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
                    التالي
                    <ArrowLeft className="me-1 h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
