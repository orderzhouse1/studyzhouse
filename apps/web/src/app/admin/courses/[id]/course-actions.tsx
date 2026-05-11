"use client";

import { Archive, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

export function CourseActions({
  courseId,
  onDone,
}: {
  courseId: string;
  onDone?: () => void;
}): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "publish" | "archive">(null);
  const [publishBlocked, setPublishBlocked] = useState<{
    message: string;
    missing: string[];
  } | null>(null);

  async function publish(): Promise<void> {
    setBusy("publish");
    setPublishBlocked(null);
    try {
      await adminFetchJson(`/admin/courses/${courseId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      router.refresh();
      onDone?.();
    } catch (e) {
      if (e instanceof AdminApiError) {
        const det = e.details as { missing?: string[] } | undefined;
        setPublishBlocked({
          message: e.message,
          missing: Array.isArray(det?.missing) ? det.missing : [],
        });
      } else if (e instanceof Error) {
        setPublishBlocked({
          message: e.message,
          missing: [],
        });
      }
    } finally {
      setBusy(null);
    }
  }

  async function archive(): Promise<void> {
    setBusy("archive");
    try {
      await adminFetchJson(`/admin/courses/${courseId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      router.refresh();
      onDone?.();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/15 p-5">
      {publishBlocked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="text-sm font-bold">تعذّر إكمال النشر</p>
          <p className="mt-1 font-semibold">{publishBlocked.message}</p>
          {publishBlocked.missing.length > 0 ? (
            <>
              <p className="mt-2 text-xs text-amber-900/85">
                الأسباب من الخادم:
              </p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                {publishBlocked.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </>
          ) : null}
          <button
            type="button"
            className="mt-2 text-xs font-medium text-amber-900 underline"
            onClick={() => setPublishBlocked(null)}
          >
            إخفاء
          </button>
        </div>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">إجراءات سريعة</p>
        <p className="text-xs text-muted-foreground">
          نشر الكورس للكتالوج العام أو أرشفته — بدون مغادرة الصفحة.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl"
          disabled={busy !== null}
          onClick={() => void publish()}
        >
          {busy === "publish" ? (
            <Rocket className="h-4 w-4 animate-pulse" aria-hidden />
          ) : (
            <Rocket className="h-4 w-4" aria-hidden />
          )}
          نشر
        </Button>
        <Button
          type="button"
          variant="outline"
          className="inline-flex items-center gap-2 rounded-xl"
          disabled={busy !== null}
          onClick={() => void archive()}
        >
          {busy === "archive" ? (
            <Archive className="h-4 w-4 animate-pulse" aria-hidden />
          ) : (
            <Archive className="h-4 w-4" aria-hidden />
          )}
          أرشفة
        </Button>
      </div>
      </div>
    </div>
  );
}
