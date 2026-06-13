"use client";

import type { AdminAnalyticsOverview } from "@studyhouse/shared";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}): React.ReactElement {
  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums text-heading">{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AdminAnalyticsOverviewPanel({
  data,
}: {
  data: AdminAnalyticsOverview;
}): React.ReactElement {
  return (
    <section className="space-y-4" dir="rtl">
      <div>
        <h2 className="text-lg font-bold text-heading">نظرة عامة</h2>
        <p className="text-sm text-muted-foreground">
          مؤشرات المنصّة الرئيسية — محدّثة من قاعدة البيانات مباشرة.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي الطلاب" value={data.totalStudents} />
        <StatCard label="طلاب جدد (7 أيام)" value={data.newStudents7d} />
        <StatCard label="طلاب جدد (30 يوم)" value={data.newStudents30d} />
        <StatCard label="نشطون (7 أيام)" value={data.activeStudents7d} hint="آخر مشاهدة درس" />
        <StatCard label="نشطون (30 يوم)" value={data.activeStudents30d} />
        <StatCard label="كورسات منشورة" value={data.totalPublishedCourses} />
        <StatCard label="إجمالي التسجيلات" value={data.totalEnrollments} />
        <StatCard
          label="متوسط إكمال الكورسات"
          value={`${data.averageCourseCompletionPercent}%`}
        />
        <StatCard label="دفع — معلّق" value={data.pendingPaymentRequests} />
        <StatCard label="دفع — مقبول" value={data.approvedPaymentRequests} />
        <StatCard label="دفع — مرفوض" value={data.rejectedPaymentRequests} />
        <StatCard label="مراجعات جديدة (7 أيام)" value={data.newReviews7d} />
        <StatCard label="مراجعات معلّقة" value={data.pendingReviews} />
        <StatCard
          label="أكواد مستخدمة (7 أيام)"
          value={data.activationCodesUsed7d}
        />
      </div>
    </section>
  );
}
