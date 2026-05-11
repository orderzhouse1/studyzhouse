"use client";

import { ArrowRight, Check, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type DetailResponse = {
  success: true;
  data: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
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
};

const STATUS_AR: Record<DetailResponse["data"]["status"], string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

export function AdminPaymentRequestDetailPanel({
  paymentRequestId,
}: {
  paymentRequestId: string;
}): React.ReactElement {
  const router = useRouter();
  const [data, setData] = useState<DetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<DetailResponse>(
        `/admin/payment-requests/${paymentRequestId}`,
      );
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر التحميل.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [paymentRequestId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(): Promise<void> {
    if (!data || data.status !== "PENDING") return;
    setBusy("approve");
    setBanner(null);
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
    } catch (e) {
      setBanner(
        e instanceof AdminApiError ? e.message : "تعذّر قبول الطلب.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function reject(): Promise<void> {
    if (!data || data.status !== "PENDING") return;
    if (rejectReason.trim().length < 3) {
      setBanner("اذكر سبب الرفض (3 أحرف على الأقل).");
      return;
    }
    setBusy("reject");
    setBanner(null);
    try {
      await adminFetchJson(`/admin/payment-requests/${paymentRequestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectReason.trim() }),
      });
      setBanner("تم رفض الطلب.");
      setRejectReason("");
      await load();
    } catch (e) {
      setBanner(
        e instanceof AdminApiError ? e.message : "تعذّر رفض الطلب.",
      );
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <PageHeader title="طلب غير موجود" description={error ?? ""} />
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/admin/payment-requests">العودة للقائمة</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="مراجعة طلب"
        title={data.course.title}
        description={`طلب من ${data.student.fullName}`}
        actions={
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => router.push("/admin/payment-requests")}
          >
            <ArrowRight className="me-2 h-4 w-4 rotate-180" aria-hidden />
            كل الطلبات
          </Button>
        }
      />

      {banner ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
          {banner}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl shadow-card ring-1 ring-border/60">
          <CardHeader>
            <CardTitle className="text-base">الطالب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">الاسم: </span>
              {data.student.fullName}
            </p>
            <p dir="ltr" className="text-start">
              <span className="text-muted-foreground">البريد: </span>
              {data.student.email}
            </p>
            {data.student.phone ? (
              <p dir="ltr">
                <span className="text-muted-foreground">الهاتف: </span>
                {data.student.phone}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-card ring-1 ring-border/60">
          <CardHeader>
            <CardTitle className="text-base">الكورس</CardTitle>
            <CardDescription>
              سعر المنصة: {data.course.coursePrice ?? "—"}{" "}
              {data.course.currency}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <Badge variant="paid" className="mb-2">
              {data.course.pricingType === "PAID" ? "مدفوع" : data.course.pricingType}
            </Badge>
            <p className="text-muted-foreground">{data.course.slug}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border border-border shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">تفاصيل الدفع</CardTitle>
          <Badge
            variant={
              data.status === "PENDING"
                ? "warning"
                : data.status === "APPROVED"
                  ? "success"
                  : "muted"
            }
          >
            {STATUS_AR[data.status]}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">المبلغ المُبلَغ عنه</p>
            <p dir="ltr" className="font-semibold">
              {data.paidAmount} {data.currency}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">مرجع CliQ</p>
            <p dir="ltr" className="font-mono text-xs">
              {data.paymentReference ?? "—"}
            </p>
          </div>
          {data.payerName ? (
            <div>
              <p className="text-muted-foreground">اسم المُحوِّل</p>
              <p>{data.payerName}</p>
            </div>
          ) : null}
          {data.payerPhone ? (
            <div>
              <p className="text-muted-foreground">هاتف المُحوِّل</p>
              <p dir="ltr">{data.payerPhone}</p>
            </div>
          ) : null}
          {data.note ? (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">ملاحظة الطالب</p>
              <p className="rounded-xl bg-muted/50 px-3 py-2">{data.note}</p>
            </div>
          ) : null}
          {data.rejectionReason ? (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">سبب الرفض</p>
              <p className="text-red-800">{data.rejectionReason}</p>
            </div>
          ) : null}
          {data.reviewedBy ? (
            <div className="sm:col-span-2 text-xs text-muted-foreground">
              رُاجع بواسطة {data.reviewedBy.fullName}
              {data.reviewedAt
                ? ` — ${new Date(data.reviewedAt).toLocaleString("ar-JO")}`
                : ""}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {data.status === "APPROVED" && data.enrollment ? (
        <Card className="rounded-3xl border border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="text-base text-emerald-950">
              التسجيل في الكورس
            </CardTitle>
            <CardDescription>
              حالة التسجيل: {data.enrollment.status} — التقدّم{" "}
              {data.enrollment.progressPercent}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-xl bg-primary">
              <Link href={`/learn/${data.course.slug}`}>فتح صفحة التعلّم</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {data.status === "PENDING" ? (
        <Card className="rounded-3xl border-amber-200 bg-amber-50/40 ring-1 ring-amber-200/60">
          <CardHeader>
            <CardTitle className="text-base">إجراء المراجعة</CardTitle>
            <CardDescription>
              تحقّق من عملية CliQ خارج المنصة قبل القبول. القبول لا يعتمد على
              المبلغ المُدخل تلقائيًا — قرارك اليدوي.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-xl bg-primary text-primary-foreground"
                disabled={busy !== null}
                onClick={() => void approve()}
              >
                {busy === "approve" ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Check className="me-2 h-4 w-4" aria-hidden />
                )}
                قبول وتفعيل التسجيل
              </Button>
            </div>
            <div className="space-y-2 border-t border-amber-200/80 pt-6">
              <Label htmlFor="rejectReason">رفض الطلب</Label>
              <Textarea
                id="rejectReason"
                className="min-h-[88px] rounded-xl"
                placeholder="اذكر سبب الرفض للطالب…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                disabled={busy !== null}
                onClick={() => void reject()}
              >
                {busy === "reject" ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <X className="me-2 h-4 w-4" aria-hidden />
                )}
                رفض الطلب
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
