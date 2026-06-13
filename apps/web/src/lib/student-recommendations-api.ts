import type { StudentRecommendationItem } from "@studyhouse/shared";

import {
  StudentApiError,
  studentFetchJson,
} from "@/lib/student-client-api";

type RecommendationsResponse = {
  success: true;
  data: { items: StudentRecommendationItem[] };
};

type DismissResponse = {
  success: true;
  data: { dismissed: true; alreadyDismissed: boolean };
};

export async function fetchStudentRecommendations(
  limit = 8,
): Promise<StudentRecommendationItem[]> {
  const json = await studentFetchJson<RecommendationsResponse>(
    `/student/recommendations?limit=${limit}`,
  );
  return json.data.items;
}

export async function dismissStudentRecommendation(
  courseId: string,
): Promise<DismissResponse["data"]> {
  const json = await studentFetchJson<DismissResponse>(
    `/student/recommendations/${encodeURIComponent(courseId)}/dismiss`,
    { method: "POST" },
  );
  return json.data;
}

export { StudentApiError };
