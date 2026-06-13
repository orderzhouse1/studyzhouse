import type {
  AdminCourseReviewItem,
  PublicCourseReviewItem,
  StudentCourseReviewItem,
} from "@studyhouse/shared";

import {
  StudentApiError,
  studentFetchJson,
} from "@/lib/student-client-api";
import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";

type PublicReviewsResponse = {
  success: true;
  data: {
    items: PublicCourseReviewItem[];
    ratingSummary: { averageRating: number | null; reviewCount: number };
  };
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

type MyReviewResponse = {
  success: true;
  data: { review: StudentCourseReviewItem | null };
};

type ReviewResponse = { success: true; data: StudentCourseReviewItem };

export async function fetchPublicCourseReviews(
  slug: string,
  page = 1,
): Promise<PublicReviewsResponse["data"] & { meta: PublicReviewsResponse["meta"] }> {
  const json = await fetch(
    `/api/v1/courses/${encodeURIComponent(slug)}/reviews?page=${page}&pageSize=10`,
    { credentials: "include", headers: { Accept: "application/json" } },
  ).then(async (res) => {
    const body = (await res.json()) as PublicReviewsResponse & {
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(body.error?.message ?? "تعذّر تحميل المراجعات.");
    }
    return body;
  });
  return { ...json.data, meta: json.meta };
}

export async function fetchMyCourseReview(
  slug: string,
): Promise<StudentCourseReviewItem | null> {
  const json = await studentFetchJson<MyReviewResponse>(
    `/student/courses/${encodeURIComponent(slug)}/my-review`,
  );
  return json.data.review;
}

export async function submitCourseReview(
  slug: string,
  body: { rating: number; title?: string; comment?: string },
): Promise<StudentCourseReviewItem> {
  const json = await studentFetchJson<ReviewResponse>(
    `/student/courses/${encodeURIComponent(slug)}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return json.data;
}

export async function updateCourseReview(
  reviewId: string,
  body: { rating?: number; title?: string | null; comment?: string | null },
): Promise<StudentCourseReviewItem> {
  const json = await studentFetchJson<ReviewResponse>(
    `/student/course-reviews/${encodeURIComponent(reviewId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return json.data;
}

export async function deleteCourseReview(reviewId: string): Promise<void> {
  await studentFetchJson<{ success: true }>(
    `/student/course-reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE" },
  );
}

type AdminListResponse = {
  success: true;
  data: { items: AdminCourseReviewItem[] };
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export async function fetchAdminReviews(query: string): Promise<AdminListResponse> {
  return adminFetchJson<AdminListResponse>(`/admin/reviews?${query}`);
}

export async function patchAdminReviewStatus(
  reviewId: string,
  status: "PENDING" | "PUBLISHED" | "HIDDEN",
): Promise<void> {
  await adminFetchJson<{ success: true }>(
    `/admin/reviews/${encodeURIComponent(reviewId)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
}

export async function deleteAdminReview(reviewId: string): Promise<void> {
  await adminFetchJson<{ success: true }>(
    `/admin/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE" },
  );
}

export { StudentApiError, AdminApiError };
