"use client";

import { Check, Copy, KeyRound, Loader2, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type CourseOpt = {
  id: string;
  title: string;
  slug: string;
  status: string;
  pricingType: string;
};

type CoursesResponse = {
  success: true;
  data: { items: CourseOpt[] };
};

type CreateResponse = {
  success: true;
  data: {
    course: { id: string; title: string; slug: string; pricingType: string };
    codes: Array<{ id: string; code: string }>;
  };
};

export function AdminActivationCodeComposer({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}): React.ReactElement {
  const formId = useId();
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [courseId, setCourseId] = useState("");
  const [usageLimit, setUsageLimit] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [count, setCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateResponse["data"] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const loadCourses = useCallback(async (): Promise<void> => {
    try {
      const json = await adminFetchJson<CoursesResponse>(
        `/admin/courses?page=1&pageSize=100&status=PUBLISHED`,
      );
      setCourses(json.data.items);
    } catch {
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setFieldError(null);
    try {
      const body: Record<string, unknown> = {
        courseId,
        usageLimit: Number(usageLimit),
        count: Number(count),
      };
      if (note.trim()) body.note = note.trim();
      if (expiresAt.trim()) {
        body.expiresAt = new Date(expiresAt).toISOString();
      }
      const json = await adminFetchJson<CreateResponse>(
        `/admin/activation-codes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      setCreated(json.data);
      onSaved();
    } catch (err) {
      setCreated(null);
      setFieldError(
        err instanceof AdminApiError ? err.message : "تعذّر إنشاء الكود.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(text: string, idx: number): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      window.alert("تعذّر النسخ — انسخ يدويًا.");
    }
  }

  function resetForAnother(): void {
    setCreated(null);
    setCourseId("");
    setUsageLimit("1");
    setExpiresAt("");
    setNote("");
    setCount("1");
    setFieldError(null);
    setCopiedIdx(null);
  }

  if (created) {
    return (
      <section
        id="admin-activation-code-composer"
        className="overflow-hidden rounded-lg border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-card shadow-sm"
        aria-labelledby={`${formId}-success-heading`}
      >
        <div className="border-b border-emerald-200/60 bg-card/90 px-3 py-2">
          <h2
            id={`${formId}-success-heading`}
            className="flex items-center gap-1 text-xs font-bold text-emerald-950"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
            تم إنشاء {created.codes.length} كود
          </h2>
          <p className="mt-0.5 text-[0.625rem] text-emerald-900/80">
            {created.course.title} — انسخ الأكواد الآن؛ لن تُعرض مجددًا بالكامل.
          </p>
        </div>
        <div className="space-y-2.5 px-3 py-3">
          <ul className="space-y-1.5">
            {created.codes.map((c, i) => (
              <li
                key={c.id}
                className="flex flex-col gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <code
                  className="break-all font-mono text-[0.6875rem] text-heading"
                  dir="ltr"
                >
                  {c.code}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[0.6875rem]"
                  onClick={() => void copyCode(c.code, i)}
                >
                  {copiedIdx === i ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  نسخ
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-4 text-xs shadow-brand"
              onClick={resetForAnother}
            >
              إضافة كود آخر
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-4 text-xs"
              onClick={onCancel}
            >
              إخفاء اللوحة
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="admin-activation-code-composer"
      className="overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-b from-primary/[0.04] to-card shadow-sm"
      aria-labelledby={`${formId}-heading`}
    >
      <div className="flex flex-wrap items-start justify-between gap-1.5 border-b border-border/50 bg-card/90 px-3 py-2">
        <div>
          <h2
            id={`${formId}-heading`}
            className="flex items-center gap-1 text-xs font-bold text-heading"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            إنشاء كود تفعيل
          </h2>
          <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
            يُطبَّق على كورس منشور. يمكن توليد حتى ٥٠ كودًا دفعة واحدة.
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

      <form
        className="space-y-3 px-3 py-3"
        onSubmit={(e) => void onSubmit(e)}
      >
        {fieldError ? (
          <div className="rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-1.5 text-[0.6875rem] text-destructive">
            {fieldError}
          </div>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor={`${formId}-course`} className="text-[0.625rem]">
            الكورس *
          </Label>
          <select
            id={`${formId}-course`}
            required
            className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-[0.6875rem]"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">اختر كورسًا منشورًا…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.pricingType === "PAID" ? "مدفوع" : "مجاني"})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`${formId}-limit`} className="text-[0.625rem]">
              حد الاستخدام *
            </Label>
            <Input
              id={`${formId}-limit`}
              type="number"
              min={1}
              required
              className="h-8 rounded-md px-2.5 text-[0.6875rem]"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${formId}-count`} className="text-[0.625rem]">
              عدد الأكواد *
            </Label>
            <Input
              id={`${formId}-count`}
              type="number"
              min={1}
              max={50}
              required
              className="h-8 rounded-md px-2.5 text-[0.6875rem]"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${formId}-exp`} className="text-[0.625rem]">
            ينتهي (اختياري)
          </Label>
          <Input
            id={`${formId}-exp`}
            type="datetime-local"
            className="h-8 rounded-md px-2.5 text-[0.6875rem]"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${formId}-note`} className="text-[0.625rem]">
            ملاحظة داخلية (اختياري)
          </Label>
          <Input
            id={`${formId}-note`}
            className="h-8 rounded-md px-2.5 text-[0.6875rem]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={busy || !courseId}
          className="h-8 w-full gap-1 rounded-full text-xs shadow-brand sm:w-auto"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
          )}
          توليد الكود
        </Button>
      </form>
    </section>
  );
}
