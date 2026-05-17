"use client";

import { Loader2, Sparkles, Video, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import {
  AdminLessonsPopup,
  type DraftLesson,
} from "@/components/admin/courses/admin-lessons-popup";
import { CourseThumbnailDropzone } from "@/components/admin/courses/course-thumbnail-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";
import {
  courseCreateBodySchema,
  courseUpdateBodySchema,
  normalizeYoutubeWatchUrl,
  parseYoutubeVideoId,
  type CourseCreateBody,
  type CourseUpdateBody,
} from "@studyhouse/shared";

type CategoryOption = { id: string; name: string; slug: string };

type PreviewVideo = {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  position: number;
};

type CourseFormState = {
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  categoryId: string;
  pricingType: "FREE" | "PAID";
  priceAmount: string;
  currency: string;
  level: CourseCreateBody["level"];
  estimatedDurationMinutes: string;
};

const EMPTY_FORM: CourseFormState = {
  title: "",
  slug: "",
  description: "",
  thumbnailUrl: "",
  categoryId: "",
  pricingType: "FREE",
  priceAmount: "",
  currency: "JOD",
  level: "ALL_LEVELS",
  estimatedDurationMinutes: "",
};

function newClientId(): string {
  return crypto.randomUUID();
}

function reorderList<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  if (!moved) return items;
  next.splice(to, 0, moved);
  return next;
}

function previewToDraft(v: PreviewVideo): DraftLesson {
  return {
    clientId: newClientId(),
    youtubeVideoId: v.youtubeVideoId,
    title: v.title,
    description: v.description ?? "",
    thumbnailUrl: v.thumbnailUrl,
    resourceLinks: "",
    isPreview: false,
  };
}

function buildLessonDescription(lesson: DraftLesson): string | undefined {
  const base = lesson.description.trim();
  const links = lesson.resourceLinks
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (links.length === 0) return base || undefined;
  const block = links.map((l) => `• ${l}`).join("\n");
  const combined = base
    ? `${base}\n\n—\nمرفقات الدرس:\n${block}`
    : `مرفقات الدرس:\n${block}`;
  return combined.slice(0, 8000);
}

const DRAFT_TITLE_PLACEHOLDER = "مسودة كورس";
const DRAFT_DESCRIPTION_PLACEHOLDER =
  "مسودة كورس قيد الإعداد من لوحة الإدارة.";

function formToCreateBody(form: CourseFormState): CourseCreateBody {
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    description:
      form.description.trim().length >= 10
        ? form.description.trim()
        : DRAFT_DESCRIPTION_PLACEHOLDER,
    thumbnailUrl: form.thumbnailUrl.trim() || "",
    categoryId: form.categoryId ? form.categoryId : null,
    pricingType: form.pricingType,
    priceAmount:
      form.pricingType === "PAID" && form.priceAmount
        ? Number(form.priceAmount)
        : undefined,
    currency: form.currency.trim() || "JOD",
    level: form.level,
    estimatedDurationMinutes: form.estimatedDurationMinutes
      ? Number(form.estimatedDurationMinutes)
      : undefined,
    status: "DRAFT",
  };
}

/** مسودة خفيفة لمعاينة يوتيوب — لا تتطلب تعبئة العنوان مسبقًا */
function formToMinimalDraftBody(form: CourseFormState): CourseCreateBody {
  const title = form.title.trim();
  return {
    ...formToCreateBody(form),
    title: title.length >= 3 ? title : DRAFT_TITLE_PLACEHOLDER,
  };
}

type AdminCourseDto = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  pricingType: "FREE" | "PAID";
  priceAmount: string | null;
  currency: string;
  level: CourseCreateBody["level"];
  estimatedDurationMinutes: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category: null | { id: string; name: string; slug: string };
};

type StructureLessonRow = {
  id: string;
  title: string;
  description: string | null;
  youtubeVideoId: string | null;
  isPreview: boolean;
  order: number;
};

type StructureSectionRow = {
  id: string;
  title: string;
  order: number;
  lessons: StructureLessonRow[];
};

function courseToForm(course: AdminCourseDto): CourseFormState {
  return {
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl ?? "",
    categoryId: course.category?.id ?? "",
    pricingType: course.pricingType,
    priceAmount: course.priceAmount ?? "",
    currency: course.currency,
    level: course.level,
    estimatedDurationMinutes:
      course.estimatedDurationMinutes != null
        ? String(course.estimatedDurationMinutes)
        : "",
  };
}

function structureLessonToDraft(lesson: StructureLessonRow): DraftLesson {
  const videoId = lesson.youtubeVideoId ?? "";
  return {
    clientId: lesson.id,
    serverLessonId: lesson.id,
    youtubeVideoId: videoId,
    title: lesson.title,
    description: lesson.description ?? "",
    thumbnailUrl: videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : null,
    resourceLinks: "",
    isPreview: lesson.isPreview,
  };
}

function lessonsFromStructure(sections: StructureSectionRow[]): {
  lessons: DraftLesson[];
  sectionId: string | null;
  sectionTitle: string;
} {
  if (sections.length === 0) {
    return { lessons: [], sectionId: null, sectionTitle: "المحتوى الرئيسي" };
  }
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  const primary = sorted[0]!;
  const lessons = sorted.flatMap((sec) =>
    [...sec.lessons]
      .sort((a, b) => a.order - b.order)
      .map(structureLessonToDraft),
  );
  return {
    lessons,
    sectionId: primary.id,
    sectionTitle: primary.title,
  };
}

function formToUpdateBody(form: CourseFormState): CourseUpdateBody {
  return {
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    description: form.description.trim(),
    thumbnailUrl: form.thumbnailUrl.trim() || "",
    categoryId: form.categoryId ? form.categoryId : null,
    pricingType: form.pricingType,
    priceAmount:
      form.pricingType === "PAID" && form.priceAmount
        ? Number(form.priceAmount)
        : null,
    currency: form.currency.trim() || "JOD",
    level: form.level,
    estimatedDurationMinutes: form.estimatedDurationMinutes
      ? Number(form.estimatedDurationMinutes)
      : null,
  };
}

function validateForEdit(form: CourseFormState): string[] {
  const missing: string[] = [];
  const title = form.title.trim();

  if (title.length < 3) {
    missing.push("يجب إدخال عنوان الكورس (ثلاثة أحرف على الأقل).");
  } else if (title === DRAFT_TITLE_PLACEHOLDER) {
    missing.push("غيّر عنوان الكورس عن المسودة الافتراضية.");
  }

  if (form.description.trim().length < 10) {
    missing.push("يجب إدخال وصف الكورس (عشرة أحرف على الأقل).");
  }

  if (!form.categoryId) {
    missing.push("يجب اختيار تصنيف للكورس.");
  }

  if (form.pricingType === "PAID") {
    const price = Number(form.priceAmount);
    if (!form.priceAmount.trim() || Number.isNaN(price) || price <= 0) {
      missing.push("المبلغ مطلوب للكورسات المدفوعة.");
    }
  }

  return missing;
}

function validateForPublish(
  form: CourseFormState,
  lessons: DraftLesson[],
  sectionTitle: string,
): string[] {
  const missing: string[] = [];
  const title = form.title.trim();

  if (title.length < 3) {
    missing.push("يجب إدخال عنوان الكورس (ثلاثة أحرف على الأقل).");
  } else if (title === DRAFT_TITLE_PLACEHOLDER) {
    missing.push("غيّر عنوان الكورس عن المسودة الافتراضية قبل النشر.");
  }

  if (form.description.trim().length < 10) {
    missing.push("يجب إدخال وصف الكورس (عشرة أحرف على الأقل).");
  }

  if (!form.categoryId) {
    missing.push("يجب اختيار تصنيف للكورس.");
  }

  if (lessons.length === 0) {
    missing.push("يجب إضافة درس واحد على الأقل.");
  }

  if (lessons.length > 0 && sectionTitle.trim().length < 2) {
    missing.push("عنوان قسم الدروس مطلوب (حرفان على الأقل).");
  }

  if (form.pricingType === "PAID") {
    const price = Number(form.priceAmount);
    if (!form.priceAmount.trim() || Number.isNaN(price) || price <= 0) {
      missing.push("المبلغ مطلوب للكورسات المدفوعة.");
    }
  }

  return missing;
}

export function AdminCourseComposer({
  editCourseId = null,
  onSaved,
  onCancel,
  onStartNew,
}: {
  /** عند التعيين تُفتح اللوحة في وضع التعديل */
  editCourseId?: string | null;
  onSaved: () => void;
  onCancel: () => void;
  /** بعد الحفظ — بدء كورس جديد (يُصفّر وضع التعديل في اللوحة الأم) */
  onStartNew?: () => void;
}): React.ReactElement {
  const isEditMode = Boolean(editCourseId);
  const formId = useId();
  const [form, setForm] = useState<CourseFormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [courseId, setCourseId] = useState<string | null>(editCourseId);
  const [existingSectionId, setExistingSectionId] = useState<string | null>(null);
  const [removedLessonIds, setRemovedLessonIds] = useState<string[]>([]);
  const [loadingCourse, setLoadingCourse] = useState(Boolean(editCourseId));
  const [lessonsOpen, setLessonsOpen] = useState(false);
  const [lessons, setLessons] = useState<DraftLesson[]>([]);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [sectionTitle, setSectionTitle] = useState("المحتوى الرئيسي");

  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistTitle, setPlaylistTitle] = useState<string | null>(null);
  const [fetchingPlaylist, setFetchingPlaylist] = useState(false);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [manualVideoUrl, setManualVideoUrl] = useState("");

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [publishMissing, setPublishMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);

  const patchForm = useCallback(
    (patch: Partial<CourseFormState>) => {
      setForm((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const json = await adminFetchJson<{
          success: true;
          data: { items: CategoryOption[] };
        }>(`/categories?page=1&pageSize=100`);
        if (!cancelled) setCategories(json.data.items);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editCourseId) {
      setLoadingCourse(false);
      return;
    }

    let cancelled = false;
    setLoadingCourse(true);
    setFieldError(null);
    setPublishMissing([]);
    setRemovedLessonIds([]);

    void (async () => {
      try {
        const [courseRes, structureRes] = await Promise.all([
          adminFetchJson<{ success: true; data: { course: AdminCourseDto } }>(
            `/admin/courses/${editCourseId}`,
          ),
          adminFetchJson<{
            success: true;
            data: { course: { sections: StructureSectionRow[] } };
          }>(`/admin/courses/${editCourseId}/structure`),
        ]);

        if (cancelled) return;

        const course = courseRes.data.course;
        setCourseId(course.id);
        setForm(courseToForm(course));

        const mapped = lessonsFromStructure(structureRes.data.course.sections);
        setLessons(mapped.lessons);
        setExistingSectionId(mapped.sectionId);
        setSectionTitle(mapped.sectionTitle);
      } catch (e) {
        if (!cancelled) {
          setFieldError(
            e instanceof Error ? e.message : "تعذّر تحميل بيانات الكورس.",
          );
        }
      } finally {
        if (!cancelled) setLoadingCourse(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editCourseId]);

  const lessonsCountLabel = useMemo(() => {
    if (lessons.length === 0) return "لا توجد دروس بعد";
    return `${lessons.length} درس`;
  }, [lessons.length]);

  async function persistCourseBody(body: CourseCreateBody): Promise<string> {
    const payload = {
      ...body,
      thumbnailUrl:
        body.thumbnailUrl && body.thumbnailUrl.length > 0 ? body.thumbnailUrl : "",
      categoryId: body.categoryId ?? null,
    };

    if (courseId) {
      await adminFetchJson(`/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return courseId;
    }

    const json = await adminFetchJson<{
      success: true;
      data: { course: { id: string } };
    }>(`/admin/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const id = json.data.course.id;
    setCourseId(id);
    return id;
  }

  /** يُنشئ مسودة على الخادم فقط لمعاينة يوتيوب — بلا اشتراط عنوان مكتمل */
  async function ensureCourseIdForLessons(): Promise<string> {
    if (courseId) return courseId;

    const parsed = courseCreateBodySchema.safeParse(
      formToMinimalDraftBody(form),
    );
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      throw new Error(first?.message ?? "تعذّر تجهيز مسودة مؤقتة.");
    }
    return persistCourseBody(parsed.data);
  }

  async function ensureCourseDraft(): Promise<string> {
    const parsed = courseCreateBodySchema.safeParse(formToCreateBody(form));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      throw new Error(first?.message ?? "تحقق من بيانات الكورس.");
    }
    return persistCourseBody(parsed.data);
  }

  async function fetchFromPlaylist(): Promise<void> {
    setFieldError(null);
    const url = playlistUrl.trim();
    if (url.length < 8) {
      setFieldError("أدخل رابط قائمة تشغيل يوتيوب صالحًا.");
      return;
    }

    setFetchingPlaylist(true);
    try {
      const id = await ensureCourseIdForLessons();
      const json = await adminFetchJson<{
        success: true;
        data: {
          playlistId: string;
          title: string | null;
          videos: PreviewVideo[];
        };
      }>(`/admin/courses/${id}/youtube-playlist/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistUrl: url }),
      });

      const { videos, title } = json.data;
      if (videos.length === 0) {
        setFieldError("القائمة فارغة أو لا تحتوي فيديوهات قابلة للاستيراد.");
        return;
      }

      setLessons(videos.map(previewToDraft));
      setPlaylistTitle(title);
      if (title?.trim() && !form.title.trim()) {
        patchForm({ title: title.trim() });
      }
      if (title?.trim()) {
        setSectionTitle(title.trim());
      }
      if (!form.thumbnailUrl && videos[0]?.thumbnailUrl) {
        patchForm({ thumbnailUrl: videos[0].thumbnailUrl });
      }
      setLessonsOpen(true);
    } catch (e) {
      setFieldError(
        e instanceof AdminApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "تعذّر جلب القائمة.",
      );
    } finally {
      setFetchingPlaylist(false);
    }
  }

  function addManualLesson(): void {
    setFieldError(null);
    const id = parseYoutubeVideoId(manualVideoUrl.trim());
    if (!id) {
      setFieldError("تعذّر التعرف على رابط الفيديو.");
      return;
    }
    if (lessons.some((l) => l.youtubeVideoId === id)) {
      setFieldError("هذا الفيديو مضاف مسبقًا في القائمة.");
      return;
    }
    setLessons((prev) => [
      ...prev,
      {
        clientId: newClientId(),
        youtubeVideoId: id,
        title: `درس ${prev.length + 1}`,
        description: "",
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        resourceLinks: "",
        isPreview: false,
      },
    ]);
    setManualVideoUrl("");
    setLessonsOpen(true);
  }

  function updateLesson(
    clientId: string,
    patch: Partial<DraftLesson>,
  ): void {
    setLessons((prev) =>
      prev.map((l) => (l.clientId === clientId ? { ...l, ...patch } : l)),
    );
  }

  function removeLesson(clientId: string): void {
    const target = lessons.find((l) => l.clientId === clientId);
    if (target?.serverLessonId) {
      setRemovedLessonIds((prev) =>
        prev.includes(target.serverLessonId!)
          ? prev
          : [...prev, target.serverLessonId!],
      );
    }
    setLessons((prev) => prev.filter((l) => l.clientId !== clientId));
    if (expandedLessonId === clientId) setExpandedLessonId(null);
  }

  async function handleSaveChanges(): Promise<void> {
    setFieldError(null);
    setPublishMissing([]);

    const missing = validateForEdit(form);
    if (missing.length > 0) {
      setFieldError("تعذّر الحفظ — أكمل الحقول التالية:");
      setPublishMissing(missing);
      return;
    }

    const id = courseId ?? editCourseId;
    if (!id) {
      setFieldError("معرّف الكورس غير متوفر.");
      return;
    }

    setBusy(true);
    try {
      const parsed = courseUpdateBodySchema.safeParse(formToUpdateBody(form));
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(first?.message ?? "بيانات الكورس غير صالحة.");
      }

      await adminFetchJson(`/admin/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          thumbnailUrl:
            parsed.data.thumbnailUrl && String(parsed.data.thumbnailUrl).length > 0
              ? parsed.data.thumbnailUrl
              : "",
          categoryId: parsed.data.categoryId ?? null,
        }),
      });

      for (const lessonId of removedLessonIds) {
        await adminFetchJson(`/admin/courses/${id}/lessons/${lessonId}`, {
          method: "DELETE",
        });
      }

      let sectionId = existingSectionId;

      if (sectionTitle.trim().length >= 2 && sectionId) {
        await adminFetchJson(`/admin/courses/${id}/sections/${sectionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: sectionTitle.trim() }),
        });
      }

      if (!sectionId && lessons.length > 0) {
        const secTitle = sectionTitle.trim();
        if (secTitle.length < 2) {
          throw new Error("عنوان قسم الدروس مطلوب (حرفان على الأقل).");
        }
        const sectionJson = await adminFetchJson<{
          success: true;
          data: { course: { sections: StructureSectionRow[] } };
        }>(`/admin/courses/${id}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: secTitle }),
        });
        sectionId =
          sectionJson.data.course.sections[
            sectionJson.data.course.sections.length - 1
          ]?.id ?? null;
        setExistingSectionId(sectionId);
      }

      const lessonIdsInOrder: string[] = [];

      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i]!;

        if (lesson.serverLessonId) {
          await adminFetchJson(
            `/admin/courses/${id}/lessons/${lesson.serverLessonId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: lesson.title.trim(),
                description: buildLessonDescription(lesson),
                youtubeUrl: normalizeYoutubeWatchUrl(lesson.youtubeVideoId),
                isPreview: lesson.isPreview,
              }),
            },
          );
          lessonIdsInOrder.push(lesson.serverLessonId);
          continue;
        }

        if (!sectionId) continue;

        const created = await adminFetchJson<{
          success: true;
          data: { course: { sections: StructureSectionRow[] } };
        }>(`/admin/courses/${id}/sections/${sectionId}/lessons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lesson.title.trim(),
            description: buildLessonDescription(lesson),
            youtubeUrl: normalizeYoutubeWatchUrl(lesson.youtubeVideoId),
            isPreview: lesson.isPreview,
            order: i,
          }),
        });

        const flat = created.data.course.sections.flatMap((s) => s.lessons);
        const match = flat.find(
          (l) => l.youtubeVideoId === lesson.youtubeVideoId,
        );
        if (match) lessonIdsInOrder.push(match.id);
      }

      if (sectionId && lessonIdsInOrder.length > 1) {
        await adminFetchJson(`/admin/courses/${id}/lessons/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionId,
            orderedLessonIds: lessonIdsInOrder,
          }),
        });
      }

      setRemovedLessonIds([]);
      setSavedCourseId(id);
      onSaved();
    } catch (e) {
      setFieldError(
        e instanceof AdminApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "تعذّر حفظ التعديلات.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(): Promise<void> {
    setFieldError(null);
    setPublishMissing([]);

    const missing = validateForPublish(form, lessons, sectionTitle);
    if (missing.length > 0) {
      setFieldError("لا يمكن نشر الكورس — أكمل الحقول التالية:");
      setPublishMissing(missing);
      return;
    }

    setBusy(true);
    try {
      const id = await ensureCourseDraft();

      if (lessons.length > 0) {
        const secTitle = sectionTitle.trim();
        if (secTitle.length < 2) {
          throw new Error("عنوان قسم الدروس مطلوب (حرفان على الأقل).");
        }

        const sectionJson = await adminFetchJson<{
          success: true;
          data: {
            course: {
              sections: Array<{ id: string; lessons: Array<{ id: string }> }>;
            };
          };
        }>(`/admin/courses/${id}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: secTitle }),
        });

        const sectionId =
          sectionJson.data.course.sections[
            sectionJson.data.course.sections.length - 1
          ]?.id;
        if (!sectionId) {
          throw new Error("تعذّر إنشاء قسم الدروس.");
        }

        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i]!;
          await adminFetchJson(
            `/admin/courses/${id}/sections/${sectionId}/lessons`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: lesson.title.trim(),
                description: buildLessonDescription(lesson),
                youtubeUrl: normalizeYoutubeWatchUrl(lesson.youtubeVideoId),
                isPreview: lesson.isPreview,
                order: i,
              }),
            },
          );
        }
      }

      await adminFetchJson(`/admin/courses/${id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      setSavedCourseId(id);
      onSaved();
    } catch (e) {
      if (e instanceof AdminApiError) {
        const det = e.details as { missing?: string[] } | undefined;
        const missing = Array.isArray(det?.missing) ? det.missing : [];
        if (e.code === "PUBLISH_READINESS") {
          setPublishMissing(
            missing.length > 0
              ? missing
              : ["تحقق من بيانات الكورس والدروس ثم أعد المحاولة."],
          );
        }
        setFieldError(
          e.message || "لا يمكن نشر الكورس قبل اكتمال المحتوى.",
        );
      } else {
        setFieldError(
          e instanceof Error ? e.message : "تعذّر نشر الكورس.",
        );
      }
    } finally {
      setBusy(false);
    }
  }

  if (savedCourseId) {
    return (
      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-3 text-center shadow-sm">
        <p className="text-xs font-bold text-emerald-900">
          {isEditMode ? "تم حفظ التعديلات بنجاح" : "تم نشر الكورس بنجاح"}
        </p>
        <p className="mt-0.5 text-[0.6875rem] text-emerald-800/90">
          {isEditMode
            ? "تم تحديث بيانات الكورس والدروس."
            : lessons.length > 0
              ? `الكورس منشور الآن في المنصة مع ${lessons.length} درسًا في قسم «${sectionTitle}».`
              : "الكورس منشور الآن ويظهر في الكتالوج."}
        </p>
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          <Button asChild size="sm" className="h-7 rounded-full px-3 text-[0.6875rem]">
            <Link href={`/admin/courses/${savedCourseId}`}>فتح صفحة الكورس</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 rounded-full px-3 text-[0.6875rem]"
            onClick={() => {
              setForm(EMPTY_FORM);
              setCourseId(null);
              setExistingSectionId(null);
              setRemovedLessonIds([]);
              setLessons([]);
              setPlaylistUrl("");
              setPlaylistTitle(null);
              setSectionTitle("المحتوى الرئيسي");
              setSavedCourseId(null);
              setLessonsOpen(false);
              onStartNew?.();
            }}
          >
            {isEditMode ? "العودة للقائمة" : "إضافة كورس آخر"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section
      id="admin-course-composer"
      className={cn(
        "overflow-hidden rounded-lg border bg-gradient-to-b from-primary/[0.04] to-card shadow-sm",
        isEditMode ? "border-heading/40 ring-1 ring-heading/10" : "border-primary/20",
      )}
      aria-labelledby={`${formId}-heading`}
    >
      <div className="flex flex-wrap items-start justify-between gap-1.5 border-b border-border/50 bg-card/90 px-3 py-2">
        <div>
          <h2
            id={`${formId}-heading`}
            className="flex items-center gap-1 text-xs font-bold text-heading"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            {isEditMode ? "تعديل الكورس" : "إضافة كورس جديد"}
          </h2>
          <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
            {isEditMode
              ? "عدّل بيانات الكورس والدروس ثم احفظ التعديلات."
              : "املأ بيانات الكورس، ثم استورد الدروس من يوتيوب أو أضفها يدويًا."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
          aria-label="إغلاق لوحة الإضافة"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-3 px-3 py-3">
        {loadingCourse ? (
          <div className="space-y-2 py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={String(i)}
                className="h-8 animate-pulse rounded-md bg-muted/40"
              />
            ))}
          </div>
        ) : null}

        {fieldError ? (
          <div className="rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-1.5 text-[0.6875rem] text-destructive">
            <p>{fieldError}</p>
            {publishMissing.length > 0 ? (
              <ul className="mt-1.5 list-disc space-y-0.5 pe-4">
                {publishMissing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {!loadingCourse ? (
          <>
        <AdminLessonsPopup
          open={lessonsOpen}
          onClose={() => setLessonsOpen(false)}
          formId={formId}
          lessons={lessons}
          lessonsCountLabel={lessonsCountLabel}
          playlistTitle={playlistTitle}
          playlistUrl={playlistUrl}
          onPlaylistUrlChange={setPlaylistUrl}
          fetchingPlaylist={fetchingPlaylist}
          busy={busy}
          onFetchPlaylist={() => void fetchFromPlaylist()}
          manualVideoUrl={manualVideoUrl}
          onManualVideoUrlChange={setManualVideoUrl}
          onAddManualLesson={addManualLesson}
          sectionTitle={sectionTitle}
          onSectionTitleChange={setSectionTitle}
          expandedLessonId={expandedLessonId}
          onToggleExpanded={(clientId) =>
            setExpandedLessonId((prev) =>
              prev === clientId ? null : clientId,
            )
          }
          dragIndex={dragIndex}
          onDragStart={setDragIndex}
          onDrop={(index) => {
            if (dragIndex === null) return;
            setLessons((prev) => reorderList(prev, dragIndex, index));
            setDragIndex(null);
          }}
          onDragEnd={() => setDragIndex(null)}
          onUpdateLesson={updateLesson}
          onRemoveLesson={removeLesson}
        />

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`${formId}-title`} className="text-[0.625rem]">
              عنوان الكورس *
            </Label>
            <Input
              id={`${formId}-title`}
              className="h-8 rounded-md py-1 px-2.5 text-[0.6875rem]"
              value={form.title}
              onChange={(e) => patchForm({ title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${formId}-cat`} className="text-[0.625rem]">
              التصنيف
            </Label>
            <select
              id={`${formId}-cat`}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-[0.6875rem]"
              disabled={loadingCats}
              value={form.categoryId}
              onChange={(e) => patchForm({ categoryId: e.target.value })}
            >
              <option value="">بدون تصنيف</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label htmlFor={`${formId}-desc`} className="text-[0.625rem]">
              الوصف *
            </Label>
            <Textarea
              id={`${formId}-desc`}
              className="min-h-[56px] rounded-md px-2.5 py-1.5 text-[0.6875rem]"
              value={form.description}
              onChange={(e) => patchForm({ description: e.target.value })}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-12 lg:items-start">
            <div className="space-y-1 sm:col-span-2 lg:col-span-5">
              <Label htmlFor={`${formId}-thumb`} className="text-[0.625rem]">
                صورة الغلاف
              </Label>
              <CourseThumbnailDropzone
                inputId={`${formId}-thumb`}
                value={form.thumbnailUrl}
                onChange={(url) => patchForm({ thumbnailUrl: url })}
                disabled={busy || fetchingPlaylist}
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor={`${formId}-pricing`} className="text-[0.625rem]">
                التسعير
              </Label>
              <select
                id={`${formId}-pricing`}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-[0.6875rem]"
                value={form.pricingType}
                onChange={(e) =>
                  patchForm({
                    pricingType: e.target.value as CourseFormState["pricingType"],
                  })
                }
              >
                <option value="FREE">مجاني</option>
                <option value="PAID">مدفوع</option>
              </select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label htmlFor={`${formId}-level`} className="text-[0.625rem]">
                المستوى
              </Label>
              <select
                id={`${formId}-level`}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-[0.6875rem]"
                value={form.level}
                onChange={(e) =>
                  patchForm({ level: e.target.value as CourseFormState["level"] })
                }
              >
                <option value="BEGINNER">مبتدئ</option>
                <option value="INTERMEDIATE">متوسط</option>
                <option value="ADVANCED">متقدم</option>
                <option value="ALL_LEVELS">جميع المستويات</option>
              </select>
            </div>
            {form.pricingType === "PAID" ? (
              <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                <Label htmlFor={`${formId}-price`} className="text-[0.625rem]">
                  السعر
                </Label>
                <Input
                  id={`${formId}-price`}
                  type="number"
                  dir="ltr"
                  className="h-8 rounded-md py-1 px-2.5 text-left text-[0.6875rem]"
                  value={form.priceAmount}
                  onChange={(e) => patchForm({ priceAmount: e.target.value })}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 rounded-full px-2.5 text-[0.6875rem]"
            onClick={() => setLessonsOpen(true)}
          >
            <Video className="h-3.5 w-3.5" />
            إضافة الدروس
            {lessons.length > 0 ? (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.625rem] font-bold text-primary">
                {lessons.length}
              </span>
            ) : null}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 gap-1 rounded-full px-3 text-[0.6875rem] shadow-brand"
            disabled={busy || loadingCourse}
            onClick={() =>
              void (isEditMode ? handleSaveChanges() : handlePublish())
            }
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            {isEditMode
              ? "حفظ التعديلات"
              : `نشر الكورس${lessons.length > 0 ? ` (${lessons.length} درس)` : ""}`}
          </Button>
        </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
