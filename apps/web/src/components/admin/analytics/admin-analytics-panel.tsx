"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { AdminAnalyticsCoursesTable } from "@/components/admin/analytics/admin-analytics-courses-table";
import { AdminAnalyticsEngagementPanel } from "@/components/admin/analytics/admin-analytics-engagement-panel";
import { AdminAnalyticsOverviewPanel } from "@/components/admin/analytics/admin-analytics-overview";
import { AdminAnalyticsStudentsPanel } from "@/components/admin/analytics/admin-analytics-students-panel";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  AdminApiError,
  fetchAdminAnalyticsCourses,
  fetchAdminAnalyticsEngagement,
  fetchAdminAnalyticsOverview,
  fetchAdminAnalyticsStudents,
} from "@/lib/admin-analytics-api";
import type {
  AdminAnalyticsCourses,
  AdminAnalyticsEngagement,
  AdminAnalyticsOverview,
  AdminAnalyticsStudents,
} from "@studyhouse/shared";

export function AdminAnalyticsPanel(): React.ReactElement {
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [courses, setCourses] = useState<AdminAnalyticsCourses | null>(null);
  const [students, setStudents] = useState<AdminAnalyticsStudents | null>(null);
  const [engagement, setEngagement] = useState<AdminAnalyticsEngagement | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [o, c, s, e] = await Promise.all([
        fetchAdminAnalyticsOverview(),
        fetchAdminAnalyticsCourses(),
        fetchAdminAnalyticsStudents(),
        fetchAdminAnalyticsEngagement(30),
      ]);
      setOverview(o);
      setCourses(c);
      setStudents(s);
      setEngagement(e);
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "تعذّر تحميل التحليلات.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !overview || !courses || !students || !engagement) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-red-800">{error ?? "تعذّر التحميل."}</p>
        <Button type="button" variant="outline" onClick={() => void load()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-14" dir="rtl">
      <PageHeader
        eyebrow="المنصّة"
        title="التحليلات"
        description="مؤشرات حقيقية من قاعدة البيانات — بدون خدمات خارجية."
      />
      <AdminAnalyticsOverviewPanel data={overview} />
      <AdminAnalyticsCoursesTable
        topByEnrollments={courses.topByEnrollments}
        topByRating={courses.topByRating}
        highestCompletion={courses.highestCompletion}
        lowestCompletion={courses.lowestCompletion}
      />
      <AdminAnalyticsStudentsPanel data={students} />
      <AdminAnalyticsEngagementPanel data={engagement} />
    </div>
  );
}
