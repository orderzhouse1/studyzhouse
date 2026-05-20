import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoursePublicDetail } from "@/components/courses/course-public-detail";
import { getPublicCourseBySlug } from "@/lib/public-course-data";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    return { title: "كورس غير موجود" };
  }

  return {
    title: course.title,
    description: course.shortDescription ?? undefined,
  };
}

export default async function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return (
    <CoursePublicDetail
      course={course}
      variant="student"
      catalogBackHref="/student/explore"
      hideShellHeader
    />
  );
}
