"use client";

import type { AdminAnalyticsCourseRow } from "@studyhouse/shared";

import { cn } from "@/lib/utils";

function CoursesTable({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: AdminAnalyticsCourseRow[];
  empty: string;
}): React.ReactElement {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-heading">{title}</h3>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">الكورس</th>
                <th className="px-4 py-3 text-start font-medium">التسجيلات</th>
                <th className="px-4 py-3 text-start font-medium">المراجعات</th>
                <th className="px-4 py-3 text-start font-medium">التقييم</th>
                <th className="px-4 py-3 text-start font-medium">إكمال</th>
                <th className="px-4 py-3 text-start font-medium">أكملوا</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.courseId}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-heading">
                    {row.title}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{row.enrollmentCount}</td>
                  <td className="px-4 py-3 tabular-nums">{row.reviewCount}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.averageRating != null
                      ? row.averageRating.toFixed(1)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.averageCompletionPercent}%
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.completedStudentsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminAnalyticsCoursesTable({
  topByEnrollments,
  topByRating,
  highestCompletion,
  lowestCompletion,
}: {
  topByEnrollments: AdminAnalyticsCourseRow[];
  topByRating: AdminAnalyticsCourseRow[];
  highestCompletion: AdminAnalyticsCourseRow[];
  lowestCompletion: AdminAnalyticsCourseRow[];
}): React.ReactElement {
  return (
    <section className="space-y-8" dir="rtl">
      <div>
        <h2 className="text-lg font-bold text-heading">تحليلات الكورسات</h2>
        <p className="text-sm text-muted-foreground">
          ترتيب حسب التسجيلات، التقييمات، ومتوسط التقدّم.
        </p>
      </div>
      <CoursesTable
        title="الأكثر تسجيلاً"
        rows={topByEnrollments}
        empty="لا توجد تسجيلات بعد."
      />
      <CoursesTable
        title="الأعلى تقييماً"
        rows={topByRating}
        empty="لا توجد مراجعات منشورة بعد."
      />
      <CoursesTable
        title="أعلى متوسط إكمال"
        rows={highestCompletion}
        empty="لا توجد بيانات تقدّم كافية."
      />
      <CoursesTable
        title="أقل متوسط إكمال"
        rows={lowestCompletion}
        empty="لا توجد بيانات تقدّم كافية."
      />
    </section>
  );
}
