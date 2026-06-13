"use client";

import { Clock, Loader2, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createLessonNote,
  deleteLessonNote,
  fetchLessonNotes,
  updateLessonNote,
} from "@/lib/lesson-notes-api";
import { cn } from "@/lib/utils";
import type { LessonNoteItem } from "@studyhouse/shared";

function formatTimestamp(seconds: number | null): string {
  if (seconds == null) return "ملاحظة عامة";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LearnNotesPanel({
  lessonId,
  onSeek,
}: {
  lessonId: string;
  onSeek: (seconds: number) => void;
}): React.ReactElement {
  const [notes, setNotes] = useState<LessonNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [timestampInput, setTimestampInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchLessonNotes(lessonId);
      setNotes(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل الملاحظات.");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(): Promise<void> {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      let timestampSeconds: number | undefined;
      if (timestampInput.trim()) {
        const parts = timestampInput.trim().split(":");
        if (parts.length === 2) {
          timestampSeconds =
            Number(parts[0]) * 60 + Number(parts[1]);
        } else {
          timestampSeconds = Number(timestampInput.trim());
        }
        if (Number.isNaN(timestampSeconds) || timestampSeconds < 0) {
          setError("صيغة الوقت غير صالحة. استخدم mm:ss أو ثوانٍ.");
          setBusy(false);
          return;
        }
      }
      await createLessonNote(lessonId, {
        body: trimmed,
        timestampSeconds,
      });
      setBody("");
      setTimestampInput("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر حفظ الملاحظة.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(noteId: string): Promise<void> {
    const trimmed = editBody.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await updateLessonNote(noteId, { body: trimmed });
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر التحديث.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(noteId: string): Promise<void> {
    setBusy(true);
    try {
      await deleteLessonNote(noteId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر الحذف.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-card ring-1 ring-border/50">
      <div>
        <h2 className="text-base font-bold text-heading">ملاحظاتي</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          ملاحظاتك خاصة بك فقط. اضغط على وقت الملاحظة للانتقال في الفيديو.
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
        <textarea
          className="min-h-[80px] w-full resize-y rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
          placeholder="اكتب ملاحظتك…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={busy}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="max-w-[120px] rounded-lg font-mono text-xs"
            placeholder="mm:ss"
            dir="ltr"
            value={timestampInput}
            onChange={(e) => setTimestampInput(e.target.value)}
            disabled={busy}
          />
          <Button
            type="button"
            size="sm"
            className="rounded-lg"
            disabled={busy || !body.trim()}
            onClick={() => void handleCreate()}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              "إضافة ملاحظة"
            )}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        </div>
      ) : notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          لا توجد ملاحظات لهذا الدرس بعد.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-border/60 bg-background/80 p-3"
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    className="min-h-[60px] w-full rounded-lg border border-border/70 px-2 py-1.5 text-sm"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleUpdate(note.id)}
                      disabled={busy}
                    >
                      حفظ
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold text-primary",
                        note.timestampSeconds != null &&
                          "hover:underline",
                      )}
                      disabled={note.timestampSeconds == null}
                      onClick={() => {
                        if (note.timestampSeconds != null) {
                          onSeek(note.timestampSeconds);
                        }
                      }}
                    >
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      {formatTimestamp(note.timestampSeconds)}
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                        aria-label="تعديل"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditBody(note.body);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-red-700"
                        aria-label="حذف"
                        onClick={() => void handleDelete(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {note.body}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
