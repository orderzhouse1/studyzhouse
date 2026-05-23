"use client";

import { Check, Copy, KeyRound, Loader2, Sparkles, Users, X } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

/** يطابق الحد الأقصى في API — يُعرض كـ «غير محدود» */
export const ACTIVATION_CODE_UNLIMITED_USES = 100_000;

type CodeMode = "shared" | "batch";

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

const USAGE_PRESETS: Array<{ value: string; label: string }> = [
  { value: "100", label: "١٠٠ طالب" },
  { value: "500", label: "٥٠٠ طالب" },
  { value: "1000", label: "١٬٠٠٠ طالب" },
  { value: "5000", label: "٥٬٠٠٠ طالب" },
  { value: "10000", label: "١٠٬٠٠٠ طالب" },
  {
    value: String(ACTIVATION_CODE_UNLIMITED_USES),
    label: "غير محدود (حتى التعطيل)",
  },
  { value: "custom", label: "عدد مخصّص…" },
];

function resolveUsageLimit(
  preset: string,
  customLimit: string,
): number | null {
  if (preset === "custom") {
    const n = Number(customLimit);
    if (!Number.isInteger(n) || n < 1 || n > ACTIVATION_CODE_UNLIMITED_USES) {
      return null;
    }
    return n;
  }
  const n = Number(preset);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

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
  const [mode, setMode] = useState<CodeMode>("shared");
  const [usagePreset, setUsagePreset] = useState("1000");
  const [customLimit, setCustomLimit] = useState("");
  const [batchCount, setBatchCount] = useState("10");
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

    const usageLimit =
      mode === "batch" ? 1 : resolveUsageLimit(usagePreset, customLimit);
    if (usageLimit === null) {
      setFieldError("أدخل عدد استخدامات صالحًا (من ١ إلى ١٠٠٬٠٠٠).");
      setBusy(false);
      return;
    }

    const count =
      mode === "batch"
        ? Number(batchCount)
        : 1;

    if (!Number.isInteger(count) || count < 1 || count > 50) {
      setFieldError("عدد الأكواد في الوضع الفردي يجب أن يكون بين ١ و٥٠.");
      setBusy(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        courseId,
        usageLimit,
        count,
      };
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
    setMode("shared");
    setUsagePreset("1000");
    setCustomLimit("");
    setBatchCount("10");
    setFieldError(null);
    setCopiedIdx(null);
  }

  if (created) {
    const isShared = created.codes.length === 1;
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
            {isShared
              ? "تم إنشاء كود مشترك"
              : `تم إنشاء ${created.codes.length} كود`}
          </h2>
          <p className="mt-0.5 text-[0.625rem] text-emerald-900/80">
            {created.course.title}
            {isShared
              ? " — انسخ الكود وأرسله لجميع الطلاب؛ كل طالب يستخدمه مرة واحدة حتى تُعطّله."
              : " — انسخ الأكواد الآن؛ لن تُعرض مجددًا بالكامل."}
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
          <p className="mt-0.5 max-w-md text-[0.625rem] leading-relaxed text-muted-foreground">
            الكود المشترك: كود واحد لكورس معيّن ترسله لآلاف الطلاب. كل طالب
            يفعّل مرة واحدة؛ يمكنك تعطيل الكود متى شئت من الجدول أدناه.
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

        <fieldset className="space-y-1.5">
          <legend className="text-[0.625rem] font-semibold text-heading">
            نوع الكود
          </legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("shared")}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-right text-[0.6875rem] transition",
                mode === "shared"
                  ? "border-primary/50 bg-primary/10 text-heading"
                  : "border-border/70 bg-card text-muted-foreground hover:bg-muted/30",
              )}
            >
              <span className="flex items-center gap-1 font-semibold">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                كود مشترك (موصى به)
              </span>
              <span className="mt-0.5 block text-[0.625rem] leading-snug opacity-90">
                كود واحد يرسل لكل الطلاب
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("batch")}
              className={cn(
                "rounded-lg border px-2.5 py-2 text-right text-[0.6875rem] transition",
                mode === "batch"
                  ? "border-primary/50 bg-primary/10 text-heading"
                  : "border-border/70 bg-card text-muted-foreground hover:bg-muted/30",
              )}
            >
              <span className="flex items-center gap-1 font-semibold">
                <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
                أكواد فردية (دفعة)
              </span>
              <span className="mt-0.5 block text-[0.625rem] leading-snug opacity-90">
                كل كود يُستخدم مرة واحدة فقط
              </span>
            </button>
          </div>
        </fieldset>

        {mode === "shared" ? (
          <div className="space-y-1">
            <Label htmlFor={`${formId}-preset`} className="text-[0.625rem]">
              كم طالب يمكنه استخدام هذا الكود؟ *
            </Label>
            <select
              id={`${formId}-preset`}
              className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-[0.6875rem]"
              value={usagePreset}
              onChange={(e) => setUsagePreset(e.target.value)}
            >
              {USAGE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {usagePreset === "custom" ? (
              <Input
                type="number"
                min={1}
                max={ACTIVATION_CODE_UNLIMITED_USES}
                required
                placeholder="مثال: 2500"
                className="mt-1.5 h-8 rounded-md px-2.5 text-[0.6875rem]"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
              />
            ) : null}
            <p className="text-[0.625rem] text-muted-foreground">
              يمكنك تعطيل الكود من القائمة في أي وقت قبل استنفاد العدد.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor={`${formId}-batch`} className="text-[0.625rem]">
              عدد الأكواد الفردية *
            </Label>
            <Input
              id={`${formId}-batch`}
              type="number"
              min={1}
              max={50}
              required
              className="h-8 rounded-md px-2.5 text-[0.6875rem]"
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
            />
            <p className="text-[0.625rem] text-muted-foreground">
              يُنشأ حتى ٥٠ كودًا؛ كل كود لطالب واحد فقط.
            </p>
          </div>
        )}

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
          {mode === "shared" ? "توليد كود مشترك" : "توليد الأكواد"}
        </Button>
      </form>
    </section>
  );
}
