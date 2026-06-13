"use client";

import type { AdminAnalyticsDailyCount, AdminAnalyticsEngagement } from "@studyhouse/shared";

import { DashboardListCard } from "@/components/admin/workspace/admin-dashboard-widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function DailyBars({
  title,
  series,
}: {
  title: string;
  series: AdminAnalyticsDailyCount[];
}): React.ReactElement {
  const max = Math.max(1, ...series.map((s) => s.count));

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4">
      <h3 className="text-sm font-bold text-heading">{title}</h3>
      {series.every((s) => s.count === 0) ? (
        <p className="mt-3 text-sm text-muted-foreground">لا نشاط في هذه الفترة.</p>
      ) : (
        <div className="mt-4 flex items-end gap-0.5 overflow-x-auto pb-1">
          {series.map((point) => (
            <div
              key={point.date}
              className="flex min-w-[10px] flex-1 flex-col items-center gap-1"
              title={`${point.date}: ${point.count}`}
            >
              <div
                className={cn(
                  "w-full min-h-[4px] rounded-t bg-primary/70 transition-all",
                )}
                style={{
                  height: `${Math.max(4, (point.count / max) * 72)}px`,
                }}
              />
              <span className="sr-only">{point.date}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        آخر {series.length} يوم — مرّر للتفاصيل اليومية في تلميح العمود.
      </p>
    </div>
  );
}

export function AdminAnalyticsEngagementPanel({
  data,
}: {
  data: AdminAnalyticsEngagement;
}): React.ReactElement {
  return (
    <section className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-lg font-bold text-heading">التفاعل والتقدّم</h2>
        <p className="text-sm text-muted-foreground">
          مشاهدات الدروس، الإكمال، والنشاط اليومي.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              سجلات التقدّم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {data.totalLessonProgressRecords}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              دروس مكتملة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {data.completedLessonsCount}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              متوسط المشاهدة (ث)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {data.averageWatchedSeconds}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardListCard
          title="أكثر الدروس إكمالاً"
          items={data.topCompletedLessons.map((l) => ({
            primary: l.lessonTitle,
            secondary: l.courseTitle,
            meta: `${l.completionCount} إكمال`,
          }))}
        />
        <DashboardListCard
          title="أكثر الكورسات تقدّماً"
          items={data.topCoursesByProgress.map((c) => ({
            primary: c.title,
            meta: `${c.progressEvents} حدث تقدّم · ${c.completedLessons} درس مكتمل`,
          }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DailyBars title="التسجيلات يومياً" series={data.enrollmentsByDay} />
        <DailyBars title="المراجعات يومياً" series={data.reviewsByDay} />
        <DailyBars title="طلبات الدفع يومياً" series={data.paymentRequestsByDay} />
      </div>
    </section>
  );
}
