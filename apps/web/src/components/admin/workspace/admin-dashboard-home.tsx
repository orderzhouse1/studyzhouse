"use client";

import {
  CreditCard,
  GraduationCap,
  KeyRound,
  Loader2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  DashboardChartPlaceholder,
  DashboardListCard,
  DashboardMiniTable,
  DashboardStatCard,
} from "@/components/admin/workspace/admin-dashboard-widgets";
import { Button } from "@/components/ui/button";
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
      createdAt: string;
      actor: null | { fullName: string };
    }>;
    recentPaymentRequests: Array<{
      id: string;
      status: string;
      createdAt: string;
      student: { fullName: string };
      course: { title: string };
    }>;
    recentStudents: Array<{
      id: string;
      fullName: string;
      email: string;
      createdAt: string;
    }>;
  };
};

const PAY_STATUS_AR: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

export function AdminDashboardHome({
  apiPath,
  quickLinks,
}: {
  apiPath: "/super-admin/overview" | null;
  quickLinks: { label: string; href: string }[];
}): React.ReactElement {
  const [data, setData] = useState<OverviewResponse["data"] | null>(null);
  const [loading, setLoading] = useState(Boolean(apiPath));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!apiPath) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const json = await adminFetchJson<OverviewResponse>(apiPath);
      setData(json.data);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "تعذّر تحميل الإحصائيات.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = data?.metrics;
  const display = {
    students: metrics?.totalStudents ?? 0,
    courses: metrics?.totalCourses ?? 0,
    published: metrics?.publishedCourses ?? 0,
    payments: metrics?.pendingPaymentRequests ?? 0,
    codes: metrics?.activationRedemptionsCount ?? 0,
    enrollments: metrics?.activeEnrollments ?? 0,
    admins: metrics?.totalAdmins ?? 0,
    drafts: metrics?.draftCourses ?? 0,
  };

  if (loading && apiPath) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">جاري تحميل لوحة الإدارة…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-heading sm:text-2xl">لوحة الإدارة</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            نظرة شاملة على المنصّة — الكورسات، المستخدمون، المدفوعات، والنشاط.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <Button key={link.href} asChild variant="outline" size="sm" className="rounded-xl">
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!apiPath ? (
        <p className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          الإحصائيات التفصيلية متاحة لمدير النظام الأعلى. استخدم الروابط السريعة لإدارة
          المحتوى والطلاب.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label="إجمالي المستخدمين"
          value={display.students}
          icon={Users}
          accent="violet"
        />
        <DashboardStatCard
          label="الكورسات"
          value={display.courses}
          icon={GraduationCap}
          accent="cyan"
        />
        <DashboardStatCard
          label="طلبات دفع معلّقة"
          value={display.payments}
          icon={CreditCard}
          accent="amber"
        />
        <DashboardStatCard
          label="تفعيلات الأكواد"
          value={display.codes}
          icon={KeyRound}
          accent="orange"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardChartPlaceholder
          title="توزيع المحتوى"
          subtitle="كورسات منشورة مقابل مسودات"
          variant="donut"
        />
        <DashboardChartPlaceholder
          title="نمو النشاط العام"
          subtitle="معاينة — سيتم ربطها بالبيانات لاحقًا"
          variant="line"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardMiniTable
          title="مؤشرات سريعة"
          rows={[
            { label: "كورسات منشورة", value: display.published, tone: "ok" },
            { label: "مسودات", value: display.drafts, tone: "warn" },
            { label: "تسجيلات نشطة", value: display.enrollments },
            { label: "مدراء النظام", value: display.admins },
            {
              label: "مدفوعات مقبولة",
              value: metrics?.approvedPaymentRequests ?? "—",
              tone: "ok",
            },
            {
              label: "مدفوعات مرفوضة",
              value: metrics?.rejectedPaymentRequests ?? "—",
              tone: "bad",
            },
          ]}
        />
        <DashboardMiniTable
          title="حالة طلبات الدفع"
          rows={[
            {
              label: "قيد المراجعة",
              value: metrics?.pendingPaymentRequests ?? display.payments,
              tone: "warn",
            },
            {
              label: "مقبولة",
              value: metrics?.approvedPaymentRequests ?? 0,
              tone: "ok",
            },
            {
              label: "مرفوضة",
              value: metrics?.rejectedPaymentRequests ?? 0,
              tone: "bad",
            },
          ]}
        />
        <DashboardListCard
          title="أحدث المستخدمين"
          items={(data?.recentStudents ?? []).slice(0, 4).map((s) => ({
            primary: s.fullName,
            secondary: s.email,
            meta: new Date(s.createdAt).toLocaleDateString("ar"),
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardListCard
          title="أحدث طلبات الدفع"
          items={(data?.recentPaymentRequests ?? []).slice(0, 5).map((r) => ({
            primary: r.course.title,
            secondary: r.student.fullName,
            meta: `${PAY_STATUS_AR[r.status] ?? r.status} · ${new Date(r.createdAt).toLocaleDateString("ar")}`,
          }))}
        />
        <DashboardListCard
          title="آخر العمليات"
          items={(data?.recentAuditLogs ?? []).slice(0, 5).map((log) => ({
            primary: log.action,
            secondary: log.actor?.fullName ?? "النظام",
            meta: new Date(log.createdAt).toLocaleString("ar"),
          }))}
          emptyLabel="لا توجد عمليات مسجّلة بعد"
        />
      </div>
    </div>
  );
}
