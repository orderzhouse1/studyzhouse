"use client";

import { Archive, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { adminFetchJson } from "@/lib/courses-client-api";

export function CourseActions({
  courseId,
  onDone,
}: {
  courseId: string;
  onDone?: () => void;
}): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "publish" | "archive">(null);

  async function publish(): Promise<void> {
    setBusy("publish");
    try {
      await adminFetchJson(`/admin/courses/${courseId}/publish`, {
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
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/15 p-5 md:flex-row md:items-center md:justify-between">
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
  );
}
