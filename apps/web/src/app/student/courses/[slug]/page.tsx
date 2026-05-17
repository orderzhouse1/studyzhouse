import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CoursePublicDetail,
  type PublicCourseDetail,
} from "@/components/courses/course-public-detail";
import { fetchPublicApiMaybe } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type CourseDetailJson = {
  success: true;
  data: { course: PublicCourseDetail };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const raw = await fetchPublicApiMaybe(
    `/api/v1/courses/${encodeURIComponent(slug)}`,
  );
  const json = raw as CourseDetailJson | null;

  if (!json?.success) {
    return { title: "كورس غير موجود" };
  }

  return {
    title: json.data.course.title,
    description: json.data.course.shortDescription ?? undefined,
  };
}

export default async function StudentCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const json = (await fetchPublicApiMaybe(
    `/api/v1/courses/${encodeURIComponent(slug)}`,
  )) as CourseDetailJson | null;

  if (!json?.success) {
    notFound();
  }

  return (
    <CoursePublicDetail
      course={json.data.course}
      variant="student"
      catalogBackHref="/student/explore"
      hideShellHeader
    />
  );
}
