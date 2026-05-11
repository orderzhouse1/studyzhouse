"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type OverviewResponse = {
  success: true;
  data: {
    metrics: {
      totalStudents: number;
      totalAdmins: number;
      totalCourses: number;
      publishedCourses: number;
      draftCourses: number;
      activeEnrollments: number;
      activationRedemptionsCount: number;
      pendingPaymentRequests: number;
      approvedPaymentRequests: number;
      rejectedPaymentRequests: number;
    };
    recentAuditLogs: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string | null;
      metadata: unknown;
      createdAt: string;
      actor: null | { id: string; fullName: string; email: string };
    }>;
    recentPaymentRequests: Array<{
      id: string;
      status: string;
      paidAmount: string;
      currency: string;
      paymentReference: string | null;
      createdAt: string;
      student: { fullName: string; email: string };
      course: { title: string; slug: string };
    }>;
    recentStudents: Array<{
      id: string;
      fullName: string;
      email: string;
      status: string;
      createdAt: string;
    }>;
  };
};

const PAY_STATUS_AR: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "orange" | "cyan" | "violet";
}): React.ReactElement {
  const ring =
    accent === "cyan"
      ? "ring-cyan-200/70 border-cyan-200/80 bg-gradient-to-bl from-cyan-50/90 to-card"
      : accent === "violet"
        ? "ring-purple-200/60 border-purple-200/70 bg-gradient-to-bl from-purple-50/80 to-card"
        : "ring-primary/20 border-primary/25 bg-gradient-to-bl from-primary/10 to-card";
  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm ring-1 ${ring}`}
    >
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-heading">{value}</p>
    </div>
  );
}

export function SuperAdminOverviewPanel(): React.ReactElement {
  const [data, setData] = useState<OverviewResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<OverviewResponse>(
        "/super-admin/overview",
      );
      setData(json.data);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر التحميل.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">جاري تحميل النظرة العامة…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-6 text-sm text-red-900">
        {error ?? "خطأ غير معروف."}
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="الحوكمة"
        title="نظرة عامة على المنصة"
        description="مؤشرات حية، آخر العمليات، وطلبات الدفع — بهوية واضحة دون رمادية مملة."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="الطلاب" value={m.totalStudents} accent="orange" />
        <MiniStat label="أدمنز المحتوى" value={m.totalAdmins} accent="violet" />
        <MiniStat label="الكورسات" value={m.totalCourses} accent="cyan" />
        <MiniStat label="منشورة" value={m.publishedCourses} accent="orange" />
        <MiniStat label="مسودات" value={m.draftCourses} />
        <MiniStat label="تسجيلات نشطة" value={m.activeEnrollments} accent="cyan" />
        <MiniStat
          label="استرداد أكواد"
          value={m.activationRedemptionsCount}
        />
        <MiniStat
          label="طلبات دفع معلّقة"
          value={m.pendingPaymentRequests}
          accent="violet"
        />
        <MiniStat label="دفعات مقبولة" value={m.approvedPaymentRequests} />
        <MiniStat label="دفعات مرفوضة" value={m.rejectedPaymentRequests} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-border shadow-card ring-1 ring-border/60 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">آخر سجل عمليات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[380px] overflow-y-auto">
            {data.recentAuditLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا سجلات بعد.</p>
            ) : (
              data.recentAuditLogs.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-xs"
                >
                  <p className="font-semibold text-foreground">{a.action}</p>
                  <p className="text-muted-foreground">
                    {a.actor?.fullName ?? "نظام"} ·{" "}
                    <span dir="ltr" className="font-mono">
                      {a.entityType}
                      {a.entityId ? `:${a.entityId.slice(0, 8)}…` : ""}
                    </span>
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString("ar-JO")}
                  </p>
                </div>
              ))
            )}
            <Link
              href="/super-admin/audit-logs"
              className="inline-block text-xs font-semibold text-primary hover:underline"
            >
              كل السجلات ←
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-card ring-1 ring-border/60 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">طلبات دفع حديثة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[380px] overflow-y-auto">
            {data.recentPaymentRequests.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا طلبات.</p>
            ) : (
              data.recentPaymentRequests.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-cyan-200/60 bg-cyan-50/50 px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {PAY_STATUS_AR[p.status] ?? p.status}
                    </Badge>
                    <span className="font-medium">{p.course.title}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {p.student.fullName} ·{" "}
                    <span dir="ltr">{p.paidAmount} {p.currency}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString("ar-JO")}
                  </p>
                </div>
              ))
            )}
            <Link
              href="/admin/payment-requests"
              className="inline-block text-xs font-semibold text-primary hover:underline"
            >
              إدارة الطلبات (لوحة الأدمن) ←
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border shadow-card ring-1 ring-border/60 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">طلاب جدد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[380px] overflow-y-auto">
            {data.recentStudents.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا طلاب بعد.</p>
            ) : (
              data.recentStudents.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-border/70 bg-card px-3 py-2 text-xs"
                >
                  <p className="font-semibold">{s.fullName}</p>
                  <p dir="ltr" className="text-muted-foreground">
                    {s.email}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(s.createdAt).toLocaleString("ar-JO")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
