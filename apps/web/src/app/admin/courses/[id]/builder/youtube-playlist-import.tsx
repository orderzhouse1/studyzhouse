"use client";

import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

import type { StructureCourse } from "./course-builder-types";

type PreviewVideo = {
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  position: number;
};

type PreviewPayload = {
  playlistId: string;
  title: string | null;
  videos: PreviewVideo[];
};

type StructureResponse = {
  success: true;
  data: { course: StructureCourse };
};

type ImportResponse = {
  success: true;
  data: StructureResponse["data"] & {
    importSummary?: { imported: number; skippedDuplicates: number };
  };
};

type PreviewApiResponse = {
  success: true;
  data: PreviewPayload;
};

function firstZodFieldMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const fe = (details as { fieldErrors?: Record<string, string[]> })
    .fieldErrors;
  if (!fe) return null;
  for (const arr of Object.values(fe)) {
    if (Array.isArray(arr) && typeof arr[0] === "string" && arr[0]) {
      return arr[0];
    }
  }
  return null;
}

function friendlyApiMessage(e: unknown): string {
  if (e instanceof AdminApiError) {
    const z = firstZodFieldMessage(e.details);
    if (z) return z;
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return "حدث خطأ غير متوقع.";
}

export function YoutubePlaylistImportDrawer({
  open,
  onClose,
  courseId,
  sections,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  sections: { id: string; title: string }[];
  onImported: (course: StructureCourse) => void;
}): ReactElement | null {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [mode, setMode] = useState<
    "CREATE_NEW_SECTION" | "APPEND_TO_EXISTING_SECTION"
  >("CREATE_NEW_SECTION");
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionId, setSectionId] = useState(
    () => sections[0]?.id ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    skippedDuplicates: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPlaylistUrl("");
    setPreview(null);
    setMode("CREATE_NEW_SECTION");
    setSectionTitle("");
    setSectionId(sections[0]?.id ?? "");
    setBusy(false);
    setInlineError(null);
    setImportSummary(null);
  }, [open]);

  useEffect(() => {
    if (sections.length === 0 && mode === "APPEND_TO_EXISTING_SECTION") {
      setMode("CREATE_NEW_SECTION");
    }
  }, [sections.length, mode]);

  if (!open) return null;

  async function runPreview(): Promise<void> {
    setInlineError(null);
    setBusy(true);
    try {
      const json = await adminFetchJson<PreviewApiResponse>(
        `/admin/courses/${courseId}/youtube-playlist/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playlistUrl: playlistUrl.trim() }),
        },
      );
      setPreview(json.data);
      setStep(2);
    } catch (e) {
      setInlineError(friendlyApiMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function goToImportStep(): void {
    setInlineError(null);
    if (!preview || preview.videos.length === 0) {
      setInlineError("لا توجد فيديوهات للاستيراد في هذه القائمة.");
      return;
    }
    if (mode === "CREATE_NEW_SECTION") {
      const t = sectionTitle.trim();
      if (t.length < 2) {
        setInlineError("أدخل عنوانًا للقسم الجديد (حرفان على الأقل).");
        return;
      }
    } else if (!sectionId) {
      setInlineError("اختر القسم الذي تريد الإضافة إليه.");
      return;
    }
    setStep(3);
  }

  async function runImport(): Promise<void> {
    setInlineError(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        playlistUrl: playlistUrl.trim(),
        mode,
      };
      if (mode === "CREATE_NEW_SECTION") {
        body.sectionTitle = sectionTitle.trim();
      } else {
        body.sectionId = sectionId;
      }
      const json = await adminFetchJson<ImportResponse>(
        `/admin/courses/${courseId}/youtube-playlist/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      onImported(json.data.course);
      setImportSummary(
        json.data.importSummary ?? { imported: 0, skippedDuplicates: 0 },
      );
    } catch (e) {
      setInlineError(friendlyApiMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const listTitle =
    preview?.title?.trim() ||
    (preview ? `قائمة ${preview.playlistId}` : "");

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-heading/45 backdrop-blur-[2px]">
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-hidden border-s border-white/10 bg-card shadow-2xl"
        dir="rtl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <div>
            <h3 className="text-lg font-bold">استيراد من قائمة YouTube</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              الخطوة {step} من ٣
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {inlineError ? (
            <div className="mb-4 flex gap-2 rounded-2xl border border-red-200/90 bg-red-50/95 px-3 py-2.5 text-sm text-red-900 shadow-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="leading-snug">{inlineError}</span>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50/90 to-card px-4 py-3 text-sm leading-relaxed text-cyan-950 shadow-sm ring-1 ring-cyan-100/80">
                الصق رابط قائمة التشغيل العامة من YouTube (يجب أن يحتوي الرابط على{" "}
                <span dir="ltr" className="font-mono text-xs">
                  list=
                </span>
                ).
              </div>
              <div className="space-y-2">
                <Label htmlFor="yt-pl-url">رابط قائمة التشغيل</Label>
                <Input
                  id="yt-pl-url"
                  dir="ltr"
                  className="rounded-2xl border-border text-left text-sm"
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  disabled={busy}
                />
              </div>
              <Button
                type="button"
                disabled={busy || playlistUrl.trim().length < 8}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-brand hover:bg-primary-hover"
                onClick={() => void runPreview()}
              >
                {busy ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : null}
                معاينة القائمة
              </Button>
            </div>
          ) : null}

          {step === 2 && preview ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/80 bg-card px-4 py-3 shadow-sm ring-1 ring-border/70">
                <p className="text-xs font-medium text-muted-foreground">
                  عنوان القائمة
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug">{listTitle}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  المعرف:{" "}
                  <span dir="ltr" className="font-mono">
                    {preview.playlistId}
                  </span>
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {preview.videos.length === 0
                    ? "لا توجد فيديوهات صالحة في المعاينة."
                    : `${preview.videos.length} فيديو في المعاينة (بحد أقصى ١٠٠ لكل عملية).`}
                </p>
              </div>

              {preview.videos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                  القائمة فارغة أو لا تحتوي على فيديوهات يمكن عرضها. جرّب قائمة
                  عامة أو تحقق من الرابط.
                </div>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-border bg-background/60 p-2">
                  {preview.videos.map((v) => (
                    <div
                      key={`${v.youtubeVideoId}-${v.position}`}
                      className="flex gap-2 rounded-xl bg-card p-2 shadow-sm ring-1 ring-border/50"
                    >
                      {v.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnails
                        <img
                          src={v.thumbnailUrl}
                          alt=""
                          className="h-12 w-20 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="h-12 w-20 shrink-0 rounded-lg bg-muted"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-medium leading-snug">
                          {v.title}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          ترتيب {v.position}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-cyan-100/90 bg-cyan-50/50 px-4 py-3 ring-1 ring-cyan-100/70">
                <p className="text-sm font-semibold text-cyan-950">
                  خيارات الاستيراد
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className={`rounded-xl border px-3 py-2.5 text-start text-sm transition ${
                      mode === "CREATE_NEW_SECTION"
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                    onClick={() => setMode("CREATE_NEW_SECTION")}
                  >
                    إنشاء قسم جديد
                  </button>
                  <button
                    type="button"
                    disabled={sections.length === 0}
                    className={`rounded-xl border px-3 py-2.5 text-start text-sm transition disabled:opacity-45 ${
                      mode === "APPEND_TO_EXISTING_SECTION"
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                    onClick={() => setMode("APPEND_TO_EXISTING_SECTION")}
                  >
                    الإضافة إلى قسم موجود
                  </button>
                </div>

                {mode === "CREATE_NEW_SECTION" ? (
                  <div className="space-y-2 pt-1">
                    <Label htmlFor="new-sec-title">عنوان القسم الجديد</Label>
                    <Input
                      id="new-sec-title"
                      className="rounded-2xl border-border text-sm"
                      value={sectionTitle}
                      onChange={(e) => setSectionTitle(e.target.value)}
                      placeholder="مثال: الوحدة الأولى"
                    />
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <Label htmlFor="exist-sec">القسم</Label>
                    <select
                      id="exist-sec"
                      className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                    >
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setStep(1);
                    setInlineError(null);
                  }}
                >
                  رجوع
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
                  disabled={preview.videos.length === 0}
                  onClick={() => goToImportStep()}
                >
                  متابعة
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 && preview && preview.videos.length > 0 ? (
            <div className="space-y-5">
              {!importSummary ? (
                <>
                  <div className="rounded-2xl border border-white/80 bg-card px-4 py-3 shadow-sm ring-1 ring-border/70">
                    <p className="text-sm font-semibold">تأكيد الاستيراد</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>
                        • سيتم استيراد حتى {preview.videos.length} درسًا مع الحفاظ
                        على الترتيب.
                      </li>
                      <li>
                        • الفيديوهات المكررة في الكورس سيتم تخطّيها تلقائيًا.
                      </li>
                    </ul>
                  </div>
                  <Button
                    type="button"
                    disabled={busy}
                    className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-600"
                    onClick={() => void runImport()}
                  >
                    {busy ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : null}
                    بدء الاستيراد
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full rounded-xl text-sm"
                    disabled={busy}
                    onClick={() => {
                      setStep(2);
                      setInlineError(null);
                    }}
                  >
                    رجوع للخيارات
                  </Button>
                </>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-8 w-8" aria-hidden />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    تم الاستيراد بنجاح
                  </p>
                  <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 px-4 py-3 text-sm text-cyan-950 ring-1 ring-cyan-100">
                    {importSummary.imported === 0 ? (
                      <p>
                        لم يُضف أي درس جديد — جميع الفيديوهات موجودة مسبقًا في هذا
                        الكورس.
                      </p>
                    ) : (
                      <p>
                        أُضيف <strong>{importSummary.imported}</strong> درسًا جديدًا.
                      </p>
                    )}
                    {importSummary.skippedDuplicates > 0 ? (
                      <p className="mt-1">
                        تخطّي <strong>{importSummary.skippedDuplicates}</strong>{" "}
                        فيديو مكررًا في هذا الكورس.
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
                    onClick={onClose}
                  >
                    تم
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
