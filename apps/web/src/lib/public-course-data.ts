import { cache } from "react";

import type { PublicCourseDetail } from "@/components/courses/course-public-detail";
import { PUBLIC_PAGES_REVALIDATE } from "@/lib/public-pages-cache";
import { fetchPublicApiMaybe } from "@/lib/server-api";

/** @deprecated استخدم PUBLIC_PAGES_REVALIDATE */
export const PUBLIC_COURSE_REVALIDATE = PUBLIC_PAGES_REVALIDATE;

type CourseDetailJson = {
  success: true;
  data: { course: PublicCourseDetail };
};

/**
 * كورس منشور واحد — مُخزَّن مؤقتًا ومُشارَك بين Metadata والصفحة (طلب واحد).
 * 404 من API → null (notFound).
 */
export const getPublicCourseBySlug = cache(
  async (slug: string): Promise<PublicCourseDetail | null> => {
    const raw = await fetchPublicApiMaybe(
      `/api/v1/courses/${encodeURIComponent(slug)}`,
      { revalidate: PUBLIC_PAGES_REVALIDATE },
    );
    const json = raw as CourseDetailJson | null;
    if (!json?.success) return null;
    return json.data.course;
  },
);
