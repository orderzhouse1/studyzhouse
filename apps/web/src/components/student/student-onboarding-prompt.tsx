"use client";

import { ArrowLeft, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { skipStudentOnboarding } from "@/lib/student-profile-api";
import { cn } from "@/lib/utils";

export function StudentOnboardingPrompt({
  className,
  onDismiss,
}: {
  className?: string;
  onDismiss?: () => void;
}): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) return <></>;

  async function handleLater(): Promise<void> {
    setBusy(true);
    try {
      await skipStudentOnboarding();
      setHidden(true);
      onDismiss?.();
    } catch {
      setHidden(true);
      onDismiss?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-card to-card p-4 shadow-sm ring-1 ring-primary/15 sm:p-5",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => void handleLater()}
        disabled={busy}
        className="absolute start-3 top-3 rounded-lg p-1 text-muted-foreground transition hover:bg-muted/60"
        aria-label="إخفاء"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:pe-8">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            ملفك التعليمي
          </p>
          <h2 className="mt-1 text-base font-bold text-heading sm:text-lg">
            أكمل ملفك التعليمي لتحصل على اقتراحات تناسبك
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            خلّينا نعرفك أكثر حتى نقترح لك كورسات تناسب هدفك — دقيقتان فقط.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="h-9 rounded-full px-4 text-xs shadow-brand"
            onClick={() => router.push("/student/onboarding")}
          >
            أكمل الآن
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-full px-4 text-xs"
            disabled={busy}
            onClick={() => void handleLater()}
          >
            لاحقًا
          </Button>
        </div>
      </div>
    </div>
  );
}
