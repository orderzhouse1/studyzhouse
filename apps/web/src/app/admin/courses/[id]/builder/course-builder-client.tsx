"use client";

import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  GraduationCap,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

import type {
  Readiness,
  StructureCourse,
  StructureLesson,
  StructureSection,
} from "./course-builder-types";
import { YoutubePlaylistImportDrawer } from "./youtube-playlist-import";

export type {
  Readiness,
  StructureCourse,
  StructureLesson,
  StructureSection,
} from "./course-builder-types";

type StructureResponse = {
  success: true;
  data: { course: StructureCourse };
};

function builderPanelKey(
  panel:
    | { kind: "section"; mode: "create" }
    | { kind: "section"; mode: "edit"; section: StructureSection }
    | { kind: "lesson"; sectionId: string; mode: "create" }
    | {
        kind: "lesson";
        sectionId: string;
        mode: "edit";
        lesson: StructureLesson;
      },
): string {
  if (panel.kind === "section") {
    return panel.mode === "edit"
      ? `sec-edit-${panel.section.id}`
      : "sec-create";
  }
  return panel.mode === "edit"
    ? `les-edit-${panel.lesson.id}`
    : `les-create-${panel.sectionId}`;
}

const STATUS_LABEL: Record<StructureCourse["status"], string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

function statusBadgeVariant(
  s: StructureCourse["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "PUBLISHED") return "published";
  if (s === "ARCHIVED") return "archived";
  return "draft";
}

function CheckRow({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-card/90 px-3 py-2 shadow-sm ring-1 ring-secondary/80">
      {ok ? (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Check className="h-3.5 w-3.5" aria-hidden />
        </span>
      ) : (
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
          <Circle className="h-4 w-4" aria-hidden />
        </span>
      )}
      <span className="text-sm leading-snug text-foreground">{label}</span>
    </div>
  );
}

export function CourseBuilderClient({
  courseId,
}: {
  courseId: string;
}): React.ReactElement | null {
  const router = useRouter();
  const [course, setCourse] = useState<StructureCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishBlock, setPublishBlock] = useState<{
    message: string;
    missing: string[];
  } | null>(null);
  const [youtubeImportOpen, setYoutubeImportOpen] = useState(false);

  const [panel, setPanel] = useState<
    | null
    | { kind: "section"; mode: "create" }
    | { kind: "section"; mode: "edit"; section: StructureSection }
    | {
        kind: "lesson";
        sectionId: string;
        mode: "create";
      }
    | {
        kind: "lesson";
        sectionId: string;
        mode: "edit";
        lesson: StructureLesson;
      }
  >(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setPublishBlock(null);
    try {
      const json = await adminFetchJson<StructureResponse>(
        `/admin/courses/${courseId}/structure`,
      );
      setCourse(json.data.course);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر التحميل.");
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyStructure(json: StructureResponse): Promise<void> {
    setCourse(json.data.course);
  }

  async function handlePublish(): Promise<void> {
    if (course?.status !== "DRAFT") return;
    setPublishBlock(null);
    setBusy(true);
    try {
      await adminFetchJson(`/admin/courses/${courseId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      router.refresh();
      await load();
    } catch (e) {
      if (e instanceof AdminApiError) {
        const det = e.details as { missing?: string[] } | undefined;
        const missing = Array.isArray(det?.missing) ? det.missing : [];
        const fallback =
          e.code === "PUBLISH_READINESS" && missing.length === 0
            ? ["تحقق من قائمة الجاهزية ثم أعد المحاولة."]
            : [];
        setPublishBlock({
          message:
            e.message ||
            "لا يمكن نشر الكورس قبل اكتمال المحتوى — راجع الأسباب أدناه.",
          missing: missing.length > 0 ? missing : fallback,
        });
      } else {
        setPublishBlock({
          message:
            e instanceof Error ? e.message : "تعذّر تنفيذ النشر.",
          missing: [],
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitSection(
    title: string,
    description: string,
  ): Promise<void> {
    setBusy(true);
    try {
      if (panel?.kind === "section" && panel.mode === "create") {
        const json = await adminFetchJson<StructureResponse>(
          `/admin/courses/${courseId}/sections`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description: description.trim() || undefined,
            }),
          },
        );
        await applyStructure(json);
      } else if (
        panel?.kind === "section" &&
        panel.mode === "edit" &&
        panel.section
      ) {
        const json = await adminFetchJson<StructureResponse>(
          `/admin/courses/${courseId}/sections/${panel.section.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description: description.trim() || null,
            }),
          },
        );
        await applyStructure(json);
      }
      setPanel(null);
    } finally {
      setBusy(false);
    }
  }

  async function submitLesson(payload: {
    title: string;
    description: string;
    youtubeUrl: string;
    durationMinutes: string;
    isPreview: boolean;
  }): Promise<void> {
    setBusy(true);
    try {
      const dmRaw = payload.durationMinutes.trim();
      const dmNum =
        dmRaw === "" ? NaN : Number(dmRaw);
      const durationCreate =
        dmRaw !== "" && Number.isFinite(dmNum) ? dmNum : undefined;

      const bodyCreate = {
        title: payload.title.trim(),
        description: payload.description.trim() || undefined,
        youtubeUrl: payload.youtubeUrl.trim() || undefined,
        durationMinutes: durationCreate,
        isPreview: payload.isPreview,
      };

      if (panel?.kind === "lesson" && panel.mode === "create") {
        const json = await adminFetchJson<StructureResponse>(
          `/admin/courses/${courseId}/sections/${panel.sectionId}/lessons`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyCreate),
          },
        );
        await applyStructure(json);
      } else if (
        panel?.kind === "lesson" &&
        panel.mode === "edit" &&
        panel.lesson
      ) {
        const patchDuration =
          dmRaw === ""
            ? null
            : Number.isFinite(dmNum)
              ? dmNum
              : undefined;

        const json = await adminFetchJson<StructureResponse>(
          `/admin/courses/${courseId}/lessons/${panel.lesson.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: payload.title.trim(),
              description:
                payload.description.trim() === ""
                  ? null
                  : payload.description.trim(),
              youtubeUrl:
                payload.youtubeUrl.trim() === ""
                  ? null
                  : payload.youtubeUrl.trim(),
              durationMinutes: patchDuration,
              isPreview: payload.isPreview,
            }),
          },
        );
        await applyStructure(json);
      }
      setPanel(null);
    } finally {
      setBusy(false);
    }
  }

  async function deleteSection(section: StructureSection): Promise<void> {
    if (
      !window.confirm(
        `حذف القسم «${section.title}» وجميع دروسه؟ لا يمكن التراجع.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const json = await adminFetchJson<StructureResponse>(
        `/admin/courses/${courseId}/sections/${section.id}`,
        { method: "DELETE" },
      );
      await applyStructure(json);
      setPanel(null);
    } finally {
      setBusy(false);
    }
  }

  async function deleteLesson(lesson: StructureLesson): Promise<void> {
    if (!window.confirm(`حذف الدرس «${lesson.title}»؟`)) return;
    setBusy(true);
    try {
      const json = await adminFetchJson<StructureResponse>(
        `/admin/courses/${courseId}/lessons/${lesson.id}`,
        { method: "DELETE" },
      );
      await applyStructure(json);
      setPanel(null);
    } finally {
      setBusy(false);
    }
  }

  async function reorderSections(ids: string[]): Promise<void> {
    setBusy(true);
    try {
      const json = await adminFetchJson<StructureResponse>(
        `/admin/courses/${courseId}/sections/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedSectionIds: ids }),
        },
      );
      await applyStructure(json);
    } finally {
      setBusy(false);
    }
  }

  async function reorderLessons(sectionId: string, ids: string[]): Promise<void> {
    setBusy(true);
    try {
      const json = await adminFetchJson<StructureResponse>(
        `/admin/courses/${courseId}/lessons/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId, orderedLessonIds: ids }),
        },
      );
      await applyStructure(json);
    } finally {
      setBusy(false);
    }
  }

  function moveSection(index: number, dir: -1 | 1): void {
    if (!course) return;
    const next = index + dir;
    if (next < 0 || next >= course.sections.length) return;
    const ids = course.sections.map((s) => s.id);
    const t = ids[index];
    ids[index] = ids[next];
    ids[next] = t;
    void reorderSections(ids);
  }

  function moveLesson(
    sectionId: string,
    lessonIndex: number,
    dir: -1 | 1,
  ): void {
    if (!course) return;
    const sec = course.sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const next = lessonIndex + dir;
    if (next < 0 || next >= sec.lessons.length) return;
    const ids = sec.lessons.map((l) => l.id);
    const t = ids[lessonIndex];
    ids[lessonIndex] = ids[next];
    ids[next] = t;
    void reorderLessons(sectionId, ids);
  }

  if (loading && !course) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-secondary/40 via-background to-primary/5 px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-12 w-2/3 max-w-md animate-pulse rounded-2xl bg-card/80 shadow-sm ring-1 ring-secondary/80" />
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="h-72 animate-pulse rounded-3xl bg-secondary/50" />
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-3xl bg-card shadow-sm ring-1 ring-primary/15" />
              <div className="h-40 animate-pulse rounded-3xl bg-card shadow-sm ring-1 ring-primary/15" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-gradient-to-b from-secondary/30 to-background px-6">
        <p className="text-center text-sm text-red-700">{error}</p>
        <Button
          type="button"
          className="rounded-2xl bg-primary px-8 text-primary-foreground hover:bg-primary-hover"
          onClick={() => void load()}
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (!course) return null;

  const r = course.readiness;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/35 via-background to-primary/5">
      <header className="border-b border-secondary/80 bg-card/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/admin/courses"
                className="inline-flex items-center gap-1 font-medium text-primary hover:opacity-90"
              >
                <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
                العودة للكورسات
              </Link>
              <span className="text-border">|</span>
              <Link
                href={`/admin/courses/${courseId}`}
                className="font-medium text-accent-foreground hover:opacity-90"
              >
                تعديل البيانات
              </Link>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
                {course.title}
              </h1>
              <Badge variant={statusBadgeVariant(course.status)} className="px-3 py-1">
                {STATUS_LABEL[course.status]}
              </Badge>
            </div>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              منشئ المحتوى — رتّب الأقسام والدروس بروح تعليمية خفيفة
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              asChild
              variant="outline"
              className="rounded-2xl border-primary/25 bg-card text-primary hover:bg-primary/10"
            >
              <Link href={`/courses/${course.slug}`} target="_blank">
                معاينة عامة
              </Link>
            </Button>
            {course.status === "DRAFT" ? (
              <Button
                type="button"
                disabled={busy}
                className="rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary-hover"
                onClick={() => void handlePublish()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <GraduationCap className="h-4 w-4" aria-hidden />
                )}
                نشر الكورس
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {publishBlock ? (
        <div className="border-b border-amber-100/90 bg-amber-50/90 px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 rounded-2xl border border-amber-200/80 bg-card px-5 py-4 shadow-sm ring-1 ring-amber-100 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-bold text-amber-950">تعذّر إكمال النشر</p>
              <p className="font-semibold text-amber-950">{publishBlock.message}</p>
              {publishBlock.missing.length > 0 ? (
                <>
                  <p className="text-sm text-amber-900/90">
                    الأسباب من الخادم (لا يُعتدّ بالواجهة وحدها):
                  </p>
                  <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-amber-950/90">
                    {publishBlock.missing.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <p className="text-xs text-amber-900/80">
                راجع بطاقة «جاهزية النشر» بجانب الصفحة، ثم أعد المحاولة بعد إصلاح
                النقاط الناقصة.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl border-amber-300 text-amber-950 hover:bg-amber-100"
              onClick={() => setPublishBlock(null)}
            >
              إغلاق التنبيه
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[minmax(0,300px)_1fr] md:gap-8 md:px-8">
        <aside className="space-y-4 md:order-first">
          <Card className="overflow-hidden rounded-3xl border-secondary/80 bg-gradient-to-br from-secondary/50 to-card shadow-card ring-1 ring-secondary/80">
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-secondary-foreground" aria-hidden />
                جاهزية النشر
              </CardTitle>
              <CardDescription>
                أكمل العناصر لتفعيل زر النشر بثقة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <CheckRow ok={r.hasTitle} label="عنوان كافٍ للكورس" />
              <CheckRow ok={r.hasDescription} label="وصف كافٍ للكورس" />
              <CheckRow ok={r.hasCategory} label="تصنيف محدّد" />
              <CheckRow ok={r.hasSection} label="قسم واحد على الأقل" />
              <CheckRow ok={r.hasLesson} label="درس واحد على الأقل" />
              <CheckRow
                ok={r.allLessonsHaveVideos}
                label="كل الدروس مرتبطة بفيديو يوتيوب"
              />
              <div className="mt-4 rounded-2xl border border-accent/80 bg-accent px-4 py-3 text-sm text-accent-foreground">
                <p className="font-semibold">حالة النشر</p>
                <p className="mt-1 opacity-90">
                  {course.status === "PUBLISHED"
                    ? "الكورس ظاهر في الكتالوج العام."
                    : course.status === "ARCHIVED"
                      ? "الكورس مؤرشف ولن يظهر للطلاب الجدد."
                      : r.canPublish
                        ? "يمكنك النشر الآن من الشريط العلوي."
                        : "أكمل قائمة التحقق أعلاه ثم انشر."}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 space-y-6 md:order-last">
          <div className="rounded-3xl border border-secondary/70 bg-gradient-to-br from-secondary/45 via-card to-card p-4 shadow-sm ring-1 ring-secondary/60 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  الوضع السهل — استيراد من يوتيوب
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  أضف عدة دروس دفعة واحدة من رابط قائمة تشغيل (لا يغيّر طريقة الإضافة
                  اليدوية).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-xl border-primary/30 bg-card px-4 text-sm font-semibold text-primary shadow-sm hover:bg-primary/10"
                onClick={() => setYoutubeImportOpen(true)}
              >
                <Video className="ms-1 h-4 w-4" aria-hidden />
                استيراد من قائمة YouTube
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">هيكل الكورس</h2>
              <p className="text-sm text-muted-foreground">
                أقسام ودروس مرنة — حرّك الترتيب بالأسهم عند الحاجة.
              </p>
            </div>
            <Button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary-hover"
              onClick={() => setPanel({ kind: "section", mode: "create" })}
            >
              <Plus className="h-5 w-5" aria-hidden />
              إضافة قسم
            </Button>
          </div>

          {course.sections.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-primary/30 bg-card p-8 text-center shadow-card ring-1 ring-primary/15 md:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="h-8 w-8" aria-hidden />
              </div>
              <p className="mt-5 text-base font-semibold">
                ابدأ ببناء كورسك بإضافة أول قسم
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                سياحة الأفكار تبدأ من تقسيم واضح — أضف قسمًا ثم دروسًا مع روابط
                يوتيوب.
              </p>
              <Button
                type="button"
                className="mt-6 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary-hover"
                onClick={() => setPanel({ kind: "section", mode: "create" })}
              >
                إضافة أول قسم
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {course.sections.map((section, si) => (
                <Card
                  key={section.id}
                  className="overflow-hidden rounded-3xl border border-border bg-card shadow-card ring-1 ring-border/60"
                >
                  <CardHeader className="flex flex-col gap-3 border-b border-border bg-gradient-to-l from-card to-secondary/35 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <CardTitle className="text-lg">
                        {section.title}
                      </CardTitle>
                      {section.description ? (
                        <CardDescription className="max-w-2xl text-base leading-relaxed">
                          {section.description}
                        </CardDescription>
                      ) : null}
                      <p className="text-xs font-medium text-secondary-foreground">
                        {section.lessons.length} درسًا في هذا القسم
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex rounded-xl border border-border bg-card p-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
                          disabled={busy || si === 0}
                          onClick={() => moveSection(si, -1)}
                          aria-label="أعلى"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
                          disabled={busy || si === course.sections.length - 1}
                          onClick={() => moveSection(si, 1)}
                          aria-label="أسفل"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-accent/80 text-accent-foreground hover:bg-accent"
                        onClick={() =>
                          setPanel({
                            kind: "section",
                            mode: "edit",
                            section,
                          })
                        }
                      >
                        تعديل القسم
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() =>
                          setPanel({
                            kind: "lesson",
                            sectionId: section.id,
                            mode: "create",
                          })
                        }
                      >
                        <Plus className="me-1 h-4 w-4" aria-hidden />
                        درس
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => void deleteSection(section)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-4">
                    {section.lessons.length === 0 ? (
                      <p className="rounded-xl bg-secondary/70 px-4 py-4 text-center text-sm text-secondary-foreground ring-1 ring-secondary/80">
                        لا دروس بعد — أضف درسًا بهذا القسم.
                      </p>
                    ) : (
                      section.lessons.map((lesson, li) => (
                        <div
                          key={lesson.id}
                          className="flex flex-col gap-2.5 rounded-xl border border-border bg-muted/30 p-3.5 shadow-sm ring-1 ring-border/70 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="font-semibold">
                              {lesson.title}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {lesson.youtubeVideoId ? (
                                <Badge variant="video" className="rounded-full">
                                  <Video className="me-1 h-3 w-3" aria-hidden />
                                  يوتيوب
                                </Badge>
                              ) : (
                                <Badge variant="incomplete" className="rounded-full">
                                  بدون فيديو
                                </Badge>
                              )}
                              {lesson.isPreview ? (
                                <Badge variant="preview" className="rounded-full">
                                  معاينة مجانية
                                </Badge>
                              ) : null}
                              {lesson.durationSeconds != null ? (
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(lesson.durationSeconds / 60)} دقيقة
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex rounded-xl border border-border bg-card p-1">
                              <button
                                type="button"
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
                                disabled={busy || li === 0}
                                onClick={() =>
                                  moveLesson(section.id, li, -1)
                                }
                              >
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted/50 disabled:opacity-40"
                                disabled={
                                  busy || li === section.lessons.length - 1
                                }
                                onClick={() => moveLesson(section.id, li, 1)}
                              >
                                <ArrowDown className="h-4 w-4" />
                              </button>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() =>
                                setPanel({
                                  kind: "lesson",
                                  sectionId: section.id,
                                  mode: "edit",
                                  lesson,
                                })
                              }
                            >
                              تعديل
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => void deleteLesson(lesson)}
                            >
                              حذف
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {panel ? (
        <BuilderOverlay
          key={builderPanelKey(panel)}
          busy={busy}
          panel={panel}
          onClose={() => setPanel(null)}
          onSubmitSection={(title, desc) => void submitSection(title, desc)}
          onSubmitLesson={(p) => void submitLesson(p)}
        />
      ) : null}

      <YoutubePlaylistImportDrawer
        open={youtubeImportOpen}
        onClose={() => setYoutubeImportOpen(false)}
        courseId={courseId}
        sections={course.sections.map((s) => ({ id: s.id, title: s.title }))}
        onImported={(c) => {
          setCourse(c);
          router.refresh();
        }}
      />
    </div>
  );
}

function BuilderOverlay({
  panel,
  busy,
  onClose,
  onSubmitSection,
  onSubmitLesson,
}: {
  panel:
    | { kind: "section"; mode: "create" }
    | { kind: "section"; mode: "edit"; section: StructureSection }
    | { kind: "lesson"; sectionId: string; mode: "create" }
    | {
        kind: "lesson";
        sectionId: string;
        mode: "edit";
        lesson: StructureLesson;
      };
  busy: boolean;
  onClose: () => void;
  onSubmitSection: (title: string, description: string) => void;
  onSubmitLesson: (p: {
    title: string;
    description: string;
    youtubeUrl: string;
    durationMinutes: string;
    isPreview: boolean;
  }) => void;
}): React.ReactElement {
  const [title, setTitle] = useState(
    panel.kind === "section" && panel.mode === "edit"
      ? panel.section.title
      : "",
  );
  const [desc, setDesc] = useState(
    panel.kind === "section" && panel.mode === "edit"
      ? panel.section.description ?? ""
      : "",
  );

  const [ltitle, setLtitle] = useState(
    panel.kind === "lesson" && panel.mode === "edit"
      ? panel.lesson.title
      : "",
  );
  const [ldesc, setLdesc] = useState(
    panel.kind === "lesson" && panel.mode === "edit"
      ? panel.lesson.description ?? ""
      : "",
  );
  const [youtubeUrl, setYoutubeUrl] = useState(
    panel.kind === "lesson" && panel.mode === "edit"
      ? panel.lesson.youtubeUrl ?? ""
      : "",
  );
  const [durMin, setDurMin] = useState(
    panel.kind === "lesson" && panel.mode === "edit" && panel.lesson.durationSeconds
      ? String(Math.round(panel.lesson.durationSeconds / 60))
      : "",
  );
  const [preview, setPreview] = useState(
    panel.kind === "lesson" && panel.mode === "edit"
      ? panel.lesson.isPreview
      : false,
  );

  const vid =
    panel.kind === "lesson" && panel.mode === "edit"
      ? panel.lesson.youtubeVideoId
      : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-heading/40 backdrop-blur-[2px]">
      <div
        className="h-full w-full max-w-md overflow-y-auto border-s border-white/10 bg-card shadow-2xl"
        dir="rtl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <h3 className="text-lg font-bold">
            {panel.kind === "section"
              ? panel.mode === "create"
                ? "قسم جديد"
                : "تعديل القسم"
              : panel.mode === "create"
                ? "درس جديد"
                : "تعديل الدرس"}
          </h3>
          <button
            type="button"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-4 py-5">
          {panel.kind === "section" ? (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitSection(title, desc);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="sec-title">عنوان القسم</Label>
                <Input
                  id="sec-title"
                  className="rounded-2xl border-border"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sec-desc">وصف القسم</Label>
                <Textarea
                  id="sec-desc"
                  className="min-h-[120px] rounded-2xl border-border"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  "حفظ القسم"
                )}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitLesson({
                  title: ltitle,
                  description: ldesc,
                  youtubeUrl,
                  durationMinutes: durMin,
                  isPreview: preview,
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="l-title">عنوان الدرس</Label>
                <Input
                  id="l-title"
                  className="rounded-2xl"
                  value={ltitle}
                  onChange={(e) => setLtitle(e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-desc">وصف الدرس</Label>
                <Textarea
                  id="l-desc"
                  className="min-h-[100px] rounded-2xl"
                  value={ldesc}
                  onChange={(e) => setLdesc(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yt">رابط فيديو YouTube</Label>
                <Input
                  id="yt"
                  dir="ltr"
                  className="rounded-2xl text-left"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dur">مدة الدرس (بالدقائق)</Label>
                <Input
                  id="dur"
                  dir="ltr"
                  type="number"
                  min={0}
                  step={1}
                  className="rounded-2xl text-left"
                  value={durMin}
                  onChange={(e) => setDurMin(e.target.value)}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-accent/80 bg-accent/50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={preview}
                  onChange={(e) => setPreview(e.target.checked)}
                  className="h-4 w-4 rounded border-accent-foreground/30 text-accent-foreground"
                />
                <span className="text-sm font-medium text-accent-foreground">
                  درس مجاني للمعاينة
                </span>
              </label>

              {vid ? (
                <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-inner ring-1 ring-border">
                  <div className="aspect-video w-full">
                    <iframe
                      title="معاينة يوتيوب"
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${vid}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  "حفظ الدرس"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
