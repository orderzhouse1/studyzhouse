import type { PublicCourseDetail } from "@/components/courses/course-public-detail";
import { FeaturedCoursesBanner } from "@/components/marketing/featured-courses-banner";
import { fetchSameCategoryCourses } from "@/lib/same-category-courses";

export async function SameCategoryCoursesAsync({
  course,
  isStudent,
}: {
  course: Pick<PublicCourseDetail, "slug" | "category">;
  isStudent: boolean;
}): Promise<React.ReactElement | null> {
  const courses = await fetchSameCategoryCourses(course);
  if (courses.length === 0) return null;

  const categoryName = course.category?.name ?? "هذا التصنيف";
  const exploreHref = course.category
    ? `${isStudent ? "/student/explore" : "/courses"}?categorySlug=${encodeURIComponent(course.category.slug)}`
    : isStudent
      ? "/student/explore"
      : "/courses";

  return (
    <FeaturedCoursesBanner
      courses={courses}
      eyebrow={categoryName}
      title="كورسات من نفس الصنف"
      description={`استكشف كورسات أخرى في تصنيف «${categoryName}» ووسّع مسارك التعليمي.`}
      exploreHref={exploreHref}
      exploreLabel="عرض التصنيف"
      detailBasePath={isStudent ? "/student/courses" : "/courses"}
      sectionId="same-category"
      headingId="same-category-heading"
      fullBleed={false}
    />
  );
}
