"use client";

import { Check, Copy, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
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

export function AdminActivationCodeNewForm(): React.ReactElement {
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [courseId, setCourseId] = useState("");
  const [usageLimit, setUsageLimit] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [count, setCount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
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
    } catch (err) {
      setCreated(null);
      setError(
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

  if (created) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader
          eyebrow="تم"
          title="تم إنشاء الكود"
          description={created.course.title}
          actions={
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/activation-codes">العودة للقائمة</Link>
            </Button>
          }
        />

        <Card className="overflow-hidden rounded-3xl border border-cyan-200/90 bg-gradient-to-br from-cyan-50/95 to-card shadow-card ring-1 ring-cyan-100">
          <CardHeader className="space-y-2 border-b border-cyan-100/80 bg-cyan-50/50">
            <CardTitle className="text-lg text-cyan-950">
              احفظ الأكواد الآن
            </CardTitle>
            <CardDescription className="text-cyan-900/90">
              سيظهر الكود مرة واحدة فقط — انسخه الآن ولن يُعرض مجددًا في لوحة
              الإدارة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <ul className="space-y-3">
              {created.codes.map((c, i) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/80 bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <code
                    className="break-all font-mono text-sm text-foreground"
                    dir="ltr"
                  >
                    {c.code}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-xl"
                    onClick={() => void copyCode(c.code, i)}
                  >
                    {copiedIdx === i ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    نسخ
                  </Button>
                </li>
              ))}
            </ul>
            <Button asChild className="w-full rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600">
              <Link href="/admin/activation-codes">تم، العودة للقائمة</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        eyebrow="إنشاء"
        title="كود تفعيل جديد"
        description="يُطبَّق على كورس منشور. يمكن توليد عدة أكواد دفعة واحدة (حتى ٥٠)."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/activation-codes">رجوع</Link>
          </Button>
        }
      />

      <Card className="rounded-3xl border-border shadow-card ring-1 ring-border/60">
        <CardHeader>
          <CardTitle className="text-lg">البيانات</CardTitle>
          <CardDescription>
            الكورس المدفوع أو المجاني — يظهر السعر كمرجع فقط.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="ac-course">الكورس</Label>
              <select
                id="ac-course"
                required
                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ac-limit">حد الاستخدام</Label>
                <Input
                  id="ac-limit"
                  type="number"
                  min={1}
                  required
                  className="rounded-2xl"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ac-count">عدد الأكواد</Label>
                <Input
                  id="ac-count"
                  type="number"
                  min={1}
                  max={50}
                  required
                  className="rounded-2xl"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ac-exp">ينتهي (اختياري)</Label>
              <Input
                id="ac-exp"
                type="datetime-local"
                className="rounded-2xl"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ac-note">ملاحظة داخلية (اختياري)</Label>
              <Input
                id="ac-note"
                className="rounded-2xl"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={busy || !courseId}
              className="w-full rounded-xl bg-orange-500 font-semibold text-white hover:bg-orange-600"
            >
              {busy ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              توليد الكود
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
