"use client";

import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { StudentPaymentsSkeleton } from "@/components/student/student-page-skeletons";
import { cn } from "@/lib/utils";
import {
  StudentApiError,
  invalidateStudentDataCache,
  studentFetchJson,
  studentFetchJsonCached,
} from "@/lib/student-client-api";

type PublicCourseItem = {
  id: string;
  title: string;
  slug: string;
  pricingType: "FREE" | "PAID";
  priceAmount: string | null;
  currency: string;
};

type PaymentRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  paidAmount: string;
  currency: string;
  paymentReference: string | null;
  course: { id: string; title: string; slug: string; pricingType: string };
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

const STATUS_AR: Record<PaymentRow["status"], string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

function statusBadgeVariant(
  s: PaymentRow["status"],
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "PENDING") return "warning";
  if (s === "APPROVED") return "success";
  return "muted";
}

export function StudentPaymentsPanel(): React.ReactElement {
  const searchParams = useSearchParams();
  const presetCourseId = searchParams.get("courseId");

  const [courses, setCourses] = useState<PublicCourseItem[]>([]);
  const [requests, setRequests] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [initialReady, setInitialReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successPlain, setSuccessPlain] = useState<string | null>(null);

  const [courseId, setCourseId] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [note, setNote] = useState("");

  const paidCourses = useMemo(
    () => courses.filter((c) => c.pricingType === "PAID"),
    [courses],
  );

  const selectedCourse = useMemo(
    () => paidCourses.find((c) => c.id === courseId),
    [paidCourses, courseId],
  );

  const loadRequests = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await studentFetchJsonCached<{
        success: true;
        data: { items: PaymentRow[] };
      }>("/student/payment-requests");
      setRequests(json.data.items);
    } catch (e) {
      setError(
        e instanceof StudentApiError ? e.message : "تعذّر تحميل الطلبات.",
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const bootstrap = useCallback(async (): Promise<void> => {
    setLoading(true);
    setCoursesLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      studentFetchJsonCached<{
        success: true;
        data: { items: PublicCourseItem[] };
      }>("/courses?page=1&pageSize=100"),
      studentFetchJsonCached<{
        success: true;
        data: { items: PaymentRow[] };
      }>("/student/payment-requests"),
    ]);
    const [cRes, rRes] = results;
    if (cRes.status === "fulfilled") {
      setCourses(cRes.value.data.items);
    } else {
      setCourses([]);
    }
    if (rRes.status === "fulfilled") {
      setRequests(rRes.value.data.items);
      setError(null);
    } else {
      setRequests([]);
      const err = rRes.reason;
      setError(
        err instanceof StudentApiError
          ? err.message
          : "تعذّر تحميل الطلبات.",
      );
    }
    setLoading(false);
    setCoursesLoading(false);
    setInitialReady(true);
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (presetCourseId && paidCourses.some((c) => c.id === presetCourseId)) {
      setCourseId(presetCourseId);
    }
  }, [presetCourseId, paidCourses]);

  useEffect(() => {
    if (selectedCourse?.priceAmount) {
      setPaidAmount(selectedCourse.priceAmount);
    }
  }, [selectedCourse]);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(null);
    setSuccessPlain(null);
    if (!courseId) {
      setFormError("اختر الكورس.");
      return;
    }
    setSubmitting(true);
    try {
      await studentFetchJson<{ success: true }>("/student/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          paidAmount,
          paymentReference,
          payerName: payerName.trim() || undefined,
          payerPhone: payerPhone.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });
      setSuccessPlain("تم إرسال طلبك بنجاح — سنراجع الدفع قريبًا.");
      setPaymentReference("");
      setNote("");
      invalidateStudentDataCache();
      await loadRequests();
    } catch (err) {
      setFormError(
        err instanceof StudentApiError
          ? err.message
          : "تعذّر إرسال الطلب.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const approved = requests.filter((r) => r.status === "APPROVED");
  const rejected = requests.filter((r) => r.status === "REJECTED");

  if (!initialReady) {
    return <StudentPaymentsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="المدفوعات اليدوية"
        title="مدفوعاتي عبر CliQ"
        description="أرسل رقم عملية CliQ بعد الدفع الخارجي ليقوم الفريق بمراجعة طلبك وتفعيل الكورس."
      />

      <Card className="rounded-2xl border border-cyan-200/80 bg-cyan-50/90 shadow-none ring-1 ring-cyan-200/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-cyan-950">
            <Wallet className="h-5 w-5 shrink-0 text-cyan-700" aria-hidden />
            كيف يعمل؟
          </CardTitle>
          <CardDescription className="text-cyan-900/85">
            ادفع عبر CliQ ثم أدخل رقم العملية هنا ليتم مراجعة طلبك. لا يتم قبول
            الدفع تلقائيًا — مراجعة يدوية من الإدارة.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="rounded-3xl border-border shadow-card ring-1 ring-border/60">
        <CardHeader>
          <CardTitle className="text-lg">طلب تفعيل جديد</CardTitle>
          <CardDescription>
            الكورسات المدفوعة فقط. المبلغ المعروض هو سعر الكورس؛ عدّل الحقل إذا
            دفعت قيمة مختلفة بوضوح من جهازك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="course">الكورس</Label>
                <select
                  id="course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={coursesLoading || paidCourses.length === 0}
                  className={cn(
                    "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    (!courseId || coursesLoading) && "text-muted-foreground",
                  )}
                >
                  <option value="">
                    {coursesLoading ? "جاري تحميل الكورسات…" : "اختر كورسًا مدفوعًا"}
                  </option>
                  {paidCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                      {c.priceAmount
                        ? ` — ${c.priceAmount} ${c.currency}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidAmount">المبلغ المدفوع</Label>
                <Input
                  id="paidAmount"
                  className="rounded-xl"
                  dir="ltr"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ref">رقم العملية / المرجع</Label>
                <Input
                  id="ref"
                  className="rounded-xl"
                  dir="ltr"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="مرجع CliQ"
                  required
                  minLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payerName">اسم المُحوِّل (اختياري)</Label>
                <Input
                  id="payerName"
                  className="rounded-xl"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payerPhone">هاتف المُحوِّل (اختياري)</Label>
                <Input
                  id="payerPhone"
                  className="rounded-xl"
                  dir="ltr"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="note">ملاحظة (اختياري)</Label>
                <Textarea
                  id="note"
                  className="min-h-[72px] rounded-xl"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="أي تفاصيل تساعد الفريق على التحقق…"
                />
              </div>
            </div>
            {formError ? (
              <p className="text-sm text-red-700">{formError}</p>
            ) : null}
            {successPlain ? (
              <p className="text-sm font-medium text-emerald-800">
                {successPlain}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={submitting || paidCourses.length === 0}
              className="rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="ms-2 h-4 w-4 animate-spin" aria-hidden />
                  جاري الإرسال…
                </>
              ) : (
                "إرسال طلب المراجعة"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">طلباتك السابقة</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : requests.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-border bg-card/60 py-10 text-center">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                لا توجد طلبات بعد. أنشئ طلبًا من النموذج أعلاه بعد الدفع عبر CliQ.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {pending.length > 0 ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-950">
                  قيد المراجعة
                </h3>
                <div className="grid gap-3">
                  {pending.map((r) => (
                    <RequestCard key={r.id} row={r} />
                  ))}
                </div>
              </section>
            ) : null}
            {approved.length > 0 ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-emerald-950">
                  مقبولة
                </h3>
                <div className="grid gap-3">
                  {approved.map((r) => (
                    <RequestCard key={r.id} row={r} />
                  ))}
                </div>
              </section>
            ) : null}
            {rejected.length > 0 ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  مرفوضة
                </h3>
                <div className="grid gap-3">
                  {rejected.map((r) => (
                    <RequestCard key={r.id} row={r} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ row }: { row: PaymentRow }): React.ReactElement {
  return (
    <Card className="rounded-2xl border-border shadow-sm ring-1 ring-border/50">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{row.course.title}</p>
            <Badge variant={statusBadgeVariant(row.status)}>
              {STATUS_AR[row.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground" dir="ltr">
            مرجع: {row.paymentReference ?? "—"} ·{" "}
            {row.paidAmount} {row.currency}
          </p>
          {row.status === "REJECTED" && row.rejectionReason ? (
            <p className="text-xs text-red-800">
              سبب الرفض: {row.rejectionReason}
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            أُنشئ {new Date(row.createdAt).toLocaleString("ar-JO")}
            {row.reviewedAt
              ? ` · رُاجع ${new Date(row.reviewedAt).toLocaleString("ar-JO")}`
              : ""}
          </p>
        </div>
        {row.status === "APPROVED" ? (
          <Button
            asChild
            size="sm"
            className="shrink-0 rounded-xl bg-primary text-primary-foreground"
          >
            <Link href={`/learn/${row.course.slug}`}>
              ابدأ التعلّم
              <ArrowLeft className="ms-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
