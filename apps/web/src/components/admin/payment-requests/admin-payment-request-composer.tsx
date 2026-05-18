"use client";

import { Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

type DetailData = {
  id: string;
  status: PaymentStatus;
  paidAmount: string;
  currency: string;
  paymentReference: string | null;
  payerName: string | null;
  payerPhone: string | null;
  note: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedBy: null | { id: string; fullName: string; email: string };
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  course: {
    id: string;
    title: string;
    slug: string;
    pricingType: string;
    coursePrice: string | null;
    currency: string;
    status: string;
  };
  enrollment: null | {
    id: string;
    status: string;
    progressPercent: number;
  };
};

type DetailResponse = {
  success: true;
  data: DetailData;
};

const STATUS_AR: Record<PaymentStatus, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

function statusBadgeVariant(
  s: PaymentStatus,
): React.ComponentProps<typeof Badge>["variant"] {
  if (s === "PENDING") return "warning";
  if (s === "APPROVED") return "success";
  return "muted";
}

export function AdminPaymentRequestComposer({
  open,
  paymentRequestId,
  onCancel,
  onSaved,
}: {
  open: boolean;
  paymentRequestId: string;
  onCancel: () => void;
  onSaved: () => void;
}): React.ReactElement | null {
  const formId = useId();
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setFieldError(null);
    try {
      const json = await adminFetchJson<DetailResponse>(
        `/admin/payment-requests/${paymentRequestId}`,
      );
      setData(json.data);
    } catch (e) {
      setData(null);
      setFieldError(e instanceof Error ? e.message : "تعذّر تحميل الطلب.");
    } finally {
      setLoading(false);
    }
  }, [paymentRequestId]);

  useEffect(() => {
    if (!open || !paymentRequestId) return;
    setBanner(null);
    setRejectReason("");
    void load();
  }, [open, load, paymentRequestId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  async function approve(): Promise<void> {
    if (!data || data.status !== "PENDING") return;
    setBusy("approve");
    setBanner(null);
    setFieldError(null);
    try {
      await adminFetchJson<{ success: true }>(
        `/admin/payment-requests/${paymentRequestId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      setBanner("تم قبول الطلب وإنشاء التسجيل في الكورس.");
      await load();
      onSaved();
    } catch (e) {
      setFieldError(
        e instanceof AdminApiError ? e.message : "تعذّر قبول الطلب.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function reject(): Promise<void> {
    if (!data || data.status !== "PENDING") return;
    if (rejectReason.trim().length < 3) {
      setFieldError("اذكر سبب الرفض (3 أحرف على الأقل).");
      return;
    }
    setBusy("reject");
    setFieldError(null);
    try {
      await adminFetchJson(
        `/admin/payment-requests/${paymentRequestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rejectionReason: rejectReason.trim() }),
        },
      );
      setBanner("تم رفض الطلب.");
      setRejectReason("");
      await load();
      onSaved();
    } catch (e) {
      setFieldError(
        e instanceof AdminApiError ? e.message : "تعذّر رفض الطلب.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (!open) return null;

  const isPending = !loading && data?.status === "PENDING";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="absolute inset-0 bg-heading/50 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        id="admin-payment-request-composer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${formId}-heading`}
        className="relative flex max-h-[min(720px,92vh)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border/50 bg-card px-4 py-3">
          <div>
            <h3
              id={`${formId}-heading`}
              className="text-sm font-bold text-heading"
            >
              مراجعة طلب الدفع
            </h3>
            <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
              تحقّق من عملية CliQ خارج المنصة قبل القبول أو الرفض.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {fieldError ? (
            <div className="rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-1.5 text-[0.6875rem] text-destructive">
              {fieldError}
            </div>
          ) : null}

          {banner ? (
            <div className="rounded-md border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1.5 text-[0.6875rem] font-medium text-emerald-900">
              {banner}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={String(i)}
                  className="h-8 animate-pulse rounded-md bg-muted/40"
                />
              ))}
            </div>
          ) : null}

          {!loading && data ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={statusBadgeVariant(data.status)}
                  className="text-[0.625rem]"
                >
                  {STATUS_AR[data.status]}
                </Badge>
                <span className="text-[0.6875rem] font-semibold text-heading">
                  {data.course.title}
                </span>
                <span className="text-[0.625rem] text-muted-foreground">
                  · {data.student.fullName}
                </span>
              </div>

              <div className="grid gap-3 rounded-lg border border-border/50 bg-muted/20 p-3 text-[0.6875rem] sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-[0.625rem] text-muted-foreground">الطالب</p>
                  <p className="font-semibold text-heading">
                    {data.student.fullName}
                  </p>
                  <p dir="ltr" className="text-muted-foreground">
                    {data.student.email}
                  </p>
                  {data.student.phone ? (
                    <p dir="ltr" className="text-muted-foreground">
                      {data.student.phone}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-[0.625rem] text-muted-foreground">الكورس</p>
                  <p className="font-semibold text-heading">{data.course.title}</p>
                  <p className="text-muted-foreground">
                    سعر المنصة: {data.course.coursePrice ?? "—"}{" "}
                    {data.course.currency}
                  </p>
                </div>
                <div>
                  <p className="text-[0.625rem] text-muted-foreground">الدفع</p>
                  <p dir="ltr" className="font-semibold tabular-nums">
                    {data.paidAmount} {data.currency}
                  </p>
                  <p
                    dir="ltr"
                    className="font-mono text-[0.625rem] text-muted-foreground"
                  >
                    {data.paymentReference ?? "—"}
                  </p>
                  <p className="text-[0.5625rem] text-muted-foreground">
                    {new Date(data.createdAt).toLocaleString("ar-JO")}
                  </p>
                </div>
                {data.payerName ? (
                  <div>
                    <p className="text-[0.625rem] text-muted-foreground">
                      اسم المُحوِّل
                    </p>
                    <p>{data.payerName}</p>
                  </div>
                ) : null}
                {data.payerPhone ? (
                  <div>
                    <p className="text-[0.625rem] text-muted-foreground">
                      هاتف المُحوِّل
                    </p>
                    <p dir="ltr">{data.payerPhone}</p>
                  </div>
                ) : null}
                {data.note ? (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-[0.625rem] text-muted-foreground">
                      ملاحظة الطالب
                    </p>
                    <p className="rounded-lg border border-border/50 bg-card px-2.5 py-2 text-foreground">
                      {data.note}
                    </p>
                  </div>
                ) : null}
                {data.rejectionReason ? (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-[0.625rem] text-muted-foreground">
                      سبب الرفض
                    </p>
                    <p className="text-red-800">{data.rejectionReason}</p>
                  </div>
                ) : null}
                {data.reviewedBy ? (
                  <div className="sm:col-span-2 lg:col-span-3 text-[0.5625rem] text-muted-foreground">
                    رُاجع بواسطة {data.reviewedBy.fullName}
                    {data.reviewedAt
                      ? ` — ${new Date(data.reviewedAt).toLocaleString("ar-JO")}`
                      : ""}
                  </div>
                ) : null}
              </div>

              {data.status === "APPROVED" && data.enrollment ? (
                <div className="rounded-md border border-emerald-200/80 bg-emerald-50/50 px-2.5 py-2 text-[0.6875rem] text-emerald-950">
                  التسجيل: {data.enrollment.status} — التقدّم{" "}
                  {data.enrollment.progressPercent}%
                  <Button
                    asChild
                    size="sm"
                    className="ms-2 mt-1 h-7 rounded-full px-3 text-[0.625rem]"
                  >
                    <Link href={`/learn/${data.course.slug}`}>فتح التعلّم</Link>
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}

          {!loading && !data && !fieldError ? (
            <p className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-2.5 py-6 text-center text-[0.6875rem] text-muted-foreground">
              الطلب غير موجود.
            </p>
          ) : null}
        </div>

        {isPending ? (
          <div className="shrink-0 space-y-3 border-t border-border/50 bg-card px-4 py-3">
            <Button
              type="button"
              size="sm"
              className="h-8 w-full gap-1 rounded-full text-xs shadow-brand sm:w-auto"
              disabled={busy !== null}
              onClick={() => void approve()}
            >
              {busy === "approve" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Check className="h-3.5 w-3.5" aria-hidden />
              )}
              قبول وتفعيل التسجيل
            </Button>
            <div className="space-y-1.5 border-t border-dashed border-border/60 pt-3">
              <Label htmlFor={`${formId}-reject`} className="text-[0.625rem]">
                رفض الطلب
              </Label>
              <Textarea
                id={`${formId}-reject`}
                className="min-h-[72px] rounded-md border-border/70 bg-card px-2.5 py-1.5 text-[0.6875rem]"
                placeholder="اذكر سبب الرفض للطالب…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 rounded-full px-4 text-xs"
                disabled={busy !== null}
                onClick={() => void reject()}
              >
                {busy === "reject" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <X className="h-3.5 w-3.5" aria-hidden />
                )}
                رفض الطلب
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex shrink-0 justify-end gap-2 border-t border-border/50 bg-card px-4 py-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-4 text-xs"
              onClick={onCancel}
            >
              إغلاق
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
