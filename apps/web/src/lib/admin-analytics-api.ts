import type {
  AdminAnalyticsCourses,
  AdminAnalyticsEngagement,
  AdminAnalyticsOverview,
  AdminAnalyticsStudents,
} from "@studyhouse/shared";

import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type OverviewResponse = { success: true; data: AdminAnalyticsOverview };
type CoursesResponse = { success: true; data: AdminAnalyticsCourses };
type StudentsResponse = { success: true; data: AdminAnalyticsStudents };
type EngagementResponse = { success: true; data: AdminAnalyticsEngagement };

export async function fetchAdminAnalyticsOverview(): Promise<AdminAnalyticsOverview> {
  const json = await adminFetchJson<OverviewResponse>(
    "/admin/analytics/overview",
  );
  return json.data;
}

export async function fetchAdminAnalyticsCourses(): Promise<AdminAnalyticsCourses> {
  const json = await adminFetchJson<CoursesResponse>(
    "/admin/analytics/courses",
  );
  return json.data;
}

export async function fetchAdminAnalyticsStudents(): Promise<AdminAnalyticsStudents> {
  const json = await adminFetchJson<StudentsResponse>(
    "/admin/analytics/students",
  );
  return json.data;
}

export async function fetchAdminAnalyticsEngagement(
  days = 30,
): Promise<AdminAnalyticsEngagement> {
  const json = await adminFetchJson<EngagementResponse>(
    `/admin/analytics/engagement?days=${days}`,
  );
  return json.data;
}

export { AdminApiError };
