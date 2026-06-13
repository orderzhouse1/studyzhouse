"use client";

import type { AdminAnalyticsStudents } from "@studyhouse/shared";

import { DashboardListCard } from "@/components/admin/workspace/admin-dashboard-widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(iso: string | null): string {
  if (!iso) return "بدون نشاط";
  return new Date(iso).toLocaleDateString("ar-JO");
}

export function AdminAnalyticsStudentsPanel({
  data,
}: {
  data: AdminAnalyticsStudents;
}): React.ReactElement {
  return (
    <section className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-lg font-bold text-heading">تحليلات الطلاب</h2>
        <p className="text-sm text-muted-foreground">
          نمو الطلاب، النشاط، والتقدّم — الطلاب فقط (بدون الأدمن).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              جدد (7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{data.newStudents7d}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              جدد (30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{data.newStudents30d}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              نشطون (7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{data.activeStudents7d}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              غير نشطين (7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{data.inactiveStudents7d}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              غير نشطين (14 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{data.inactiveStudents14d}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardListCard
          title="الأكثر تقدّماً"
          emptyLabel="لا يوجد طلاب مسجّلون بعد."
          items={data.topProgressStudents.map((s) => ({
            primary: s.fullName,
            secondary: s.email,
            meta: `${s.averageProgressPercent}% متوسط تقدّم · ${s.enrolledCoursesCount} كورس · آخر نشاط: ${formatDate(s.lastActivityAt)}`,
          }))}
        />
        <DashboardListCard
          title="تسجيل بدون نشاط حديث"
          emptyLabel="لا يوجد طلاب راكدون حالياً."
          items={data.staleEnrollmentStudents.map((s) => ({
            primary: s.fullName,
            secondary: s.email,
            meta: `${s.enrolledCoursesCount} كورس · آخر نشاط: ${formatDate(s.lastActivityAt)}`,
          }))}
        />
      </div>

      <div>
        <h3 className="mb-3 text-base font-bold text-heading">
          توزيع حسب الدولة
        </h3>
        {data.countryDistribution.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            لا توجد بيانات دولة في ملفات الطلاب بعد.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">الدولة</th>
                  <th className="px-4 py-3 text-start font-medium">العدد</th>
                </tr>
              </thead>
              <tbody>
                {data.countryDistribution.map((row) => (
                  <tr
                    key={row.country}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3">{row.country}</td>
                    <td className="px-4 py-3 tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
