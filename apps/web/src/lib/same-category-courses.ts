import type { CourseCardCourse } from "@/components/courses/course-card";
import { PUBLIC_PAGES_REVALIDATE } from "@/lib/public-pages-cache";
import { fetchPublicApiMaybe } from "@/lib/server-api";

type CoursesJson = {
  success: true;
  data: { items: CourseCardCourse[] };
};

export async function fetchSameCategoryCourses(course: {
  slug: string;
  category: null | { slug: string };
}): Promise<CourseCardCourse[]> {
  if (!course.category?.slug) return [];

  const json = (await fetchPublicApiMaybe(
    `/api/v1/courses?categorySlug=${encodeURIComponent(course.category.slug)}&page=1&pageSize=8`,
    { revalidate: PUBLIC_PAGES_REVALIDATE },
  )) as CoursesJson | null;

  if (!json?.success) return [];

  return json.data.items
    .filter((c) => c.slug !== course.slug)
    .slice(0, 4);
}
