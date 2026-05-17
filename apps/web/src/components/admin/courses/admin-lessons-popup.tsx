"use client";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  Video,
  X,
  Youtube,
} from "lucide-react";
import { useEffect } from "react";

import { LessonResourcesDropzone } from "@/components/admin/courses/lesson-resources-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type DraftLesson = {
  clientId: string;
  /** معرّف الدرس على الخادم عند التعديل */
  serverLessonId?: string;
  youtubeVideoId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  resourceLinks: string;
  isPreview: boolean;
};

export function AdminLessonsPopup({
  open,
  onClose,
  formId,
  lessons,
  lessonsCountLabel,
  playlistTitle,
  playlistUrl,
  onPlaylistUrlChange,
  fetchingPlaylist,
  busy,
  onFetchPlaylist,
  manualVideoUrl,
  onManualVideoUrlChange,
  onAddManualLesson,
  sectionTitle,
  onSectionTitleChange,
  expandedLessonId,
  onToggleExpanded,
  dragIndex,
  onDragStart,
  onDrop,
  onDragEnd,
  onUpdateLesson,
  onRemoveLesson,
}: {
  open: boolean;
  onClose: () => void;
  formId: string;
  lessons: DraftLesson[];
  lessonsCountLabel: string;
  playlistTitle: string | null;
  playlistUrl: string;
  onPlaylistUrlChange: (value: string) => void;
  fetchingPlaylist: boolean;
  busy: boolean;
  onFetchPlaylist: () => void;
  manualVideoUrl: string;
  onManualVideoUrlChange: (value: string) => void;
  onAddManualLesson: () => void;
  sectionTitle: string;
  onSectionTitleChange: (value: string) => void;
  expandedLessonId: string | null;
  onToggleExpanded: (clientId: string) => void;
  dragIndex: number | null;
  onDragStart: (index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onUpdateLesson: (clientId: string, patch: Partial<DraftLesson>) => void;
  onRemoveLesson: (clientId: string) => void;
}): React.ReactElement | null {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-heading/50 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-lessons-title`}
        className="relative flex max-h-[min(720px,92vh)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/50 bg-card px-4 py-3">
          <div>
            <h3
              id={`${formId}-lessons-title`}
              className="text-sm font-bold text-heading"
            >
              إدارة دروس الكورس
            </h3>
            <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
              {lessonsCountLabel}
              {playlistTitle ? ` · من: ${playlistTitle}` : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor={`${formId}-pl`} className="text-[0.625rem]">
                رابط قائمة تشغيل YouTube
              </Label>
              <Input
                id={`${formId}-pl`}
                dir="ltr"
                className="h-8 rounded-md py-1 px-2.5 text-left text-[0.6875rem]"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={playlistUrl}
                onChange={(e) => onPlaylistUrlChange(e.target.value)}
                disabled={fetchingPlaylist || busy}
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[0.6875rem] shadow-brand"
              disabled={fetchingPlaylist || busy || playlistUrl.trim().length < 8}
              onClick={onFetchPlaylist}
            >
              {fetchingPlaylist ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Youtube className="h-3.5 w-3.5" />
              )}
              جلب الدروس
            </Button>
          </div>

          <div className="flex flex-col gap-2 border-t border-dashed border-border/60 pt-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor={`${formId}-manual`} className="text-[0.625rem]">
                إضافة فيديو واحد (رابط يوتيوب)
              </Label>
              <Input
                id={`${formId}-manual`}
                dir="ltr"
                className="h-8 rounded-md py-1 px-2.5 text-left text-[0.6875rem]"
                placeholder="https://youtu.be/..."
                value={manualVideoUrl}
                onChange={(e) => onManualVideoUrlChange(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[0.6875rem]"
              onClick={onAddManualLesson}
            >
              <Plus className="h-3.5 w-3.5" />
              إضافة
            </Button>
          </div>

          {lessons.length > 0 ? (
            <>
              <div className="space-y-1">
                <Label htmlFor={`${formId}-sec`} className="text-[0.625rem]">
                  عنوان قسم الدروس
                </Label>
                <Input
                  id={`${formId}-sec`}
                  className="h-8 rounded-md py-1 px-2.5 text-[0.6875rem]"
                  value={sectionTitle}
                  onChange={(e) => onSectionTitleChange(e.target.value)}
                />
              </div>

              <ul className="max-h-[min(340px,45vh)] space-y-1.5 overflow-y-auto rounded-lg border border-border/50 bg-muted/10 p-1.5">
                {lessons.map((lesson, index) => {
                  const expanded = expandedLessonId === lesson.clientId;
                  return (
                    <li
                      key={lesson.clientId}
                      draggable
                      onDragStart={() => onDragStart(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDrop(index)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        "rounded-lg border bg-card shadow-sm transition",
                        expanded
                          ? "border-2 border-heading ring-2 ring-heading/15 shadow-md"
                          : "border-border/50",
                        dragIndex === index &&
                          "opacity-60 ring-2 ring-primary/30",
                      )}
                    >
                      <div className="flex items-center gap-1.5 p-1.5">
                        <button
                          type="button"
                          className="cursor-grab touch-none rounded p-0.5 text-muted-foreground active:cursor-grabbing"
                          aria-label="سحب لإعادة الترتيب"
                          tabIndex={-1}
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                        {lesson.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={lesson.thumbnailUrl}
                            alt=""
                            className="h-8 w-14 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-14 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Video className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-heading">
                            {index + 1}. {lesson.title}
                          </p>
                          <p className="text-[0.625rem] text-muted-foreground">
                            {lesson.isPreview ? "معاينة مجانية" : "درس عادي"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            className="rounded p-1 text-muted-foreground hover:bg-muted"
                            onClick={() => onToggleExpanded(lesson.clientId)}
                            aria-expanded={expanded}
                          >
                            {expanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                            onClick={() => onRemoveLesson(lesson.clientId)}
                            aria-label="حذف الدرس"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {expanded ? (
                        <div className="space-y-1.5 border-t border-border/40 px-2 pb-2 pt-1.5">
                          <div className="space-y-1">
                            <Label className="text-[0.625rem]">عنوان الدرس</Label>
                            <Input
                              className="h-7 rounded-md text-[0.6875rem]"
                              value={lesson.title}
                              onChange={(e) =>
                                onUpdateLesson(lesson.clientId, {
                                  title: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[0.625rem]">الوصف</Label>
                            <Textarea
                              className="min-h-[52px] rounded-md px-2.5 py-1.5 text-[0.6875rem]"
                              value={lesson.description}
                              onChange={(e) =>
                                onUpdateLesson(lesson.clientId, {
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[0.625rem]">
                              ملفات أو صور الدرس
                            </Label>
                            <LessonResourcesDropzone
                              value={lesson.resourceLinks}
                              onChange={(resourceLinks) =>
                                onUpdateLesson(lesson.clientId, {
                                  resourceLinks,
                                })
                              }
                              disabled={busy || fetchingPlaylist}
                            />
                          </div>
                          <label className="flex items-center gap-1.5 text-[0.6875rem]">
                            <input
                              type="checkbox"
                              checked={lesson.isPreview}
                              onChange={(e) =>
                                onUpdateLesson(lesson.clientId, {
                                  isPreview: e.target.checked,
                                })
                              }
                              className="rounded border-border"
                            />
                            درس معاينة مجانية
                          </label>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <p className="text-[0.625rem] text-muted-foreground">
                اسحب ⋮⋮ لإعادة الترتيب. انقر السهم لتعديل التفاصيل.
              </p>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-2.5 py-6 text-center text-[0.6875rem] text-muted-foreground">
              الصق رابط قائمة التشغيل واضغط «جلب الدروس»، أو أضف فيديوهات يدويًا.
            </p>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border/50 bg-card/95 px-4 py-3">
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-full px-4 text-xs shadow-brand"
            onClick={onClose}
          >
            تم ({lessons.length} درس)
          </Button>
        </div>
      </div>
    </div>
  );
}
