import type { Metadata } from "next";

import { CourseBuilderClient } from "./course-builder-client";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "منشئ المحتوى",
};

export default async function CourseBuilderPage({
  params,
}: Props): Promise<React.ReactElement> {
  const { id } = await params;
  return <CourseBuilderClient courseId={id} />;
}
