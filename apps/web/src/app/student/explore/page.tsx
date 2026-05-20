import type { Metadata } from "next";

import {
  CoursesCatalog,
  type CoursesCatalogSearchParams,
} from "@/components/courses/courses-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استكشف الكورسات",
};

export default function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<CoursesCatalogSearchParams>;
}): React.ReactElement {
  return (
    <CoursesCatalog
      basePath="/student/explore"
      searchParams={searchParams}
      title="استكشف الكورسات"
      description="استكشف الكورسات المنشورة واختر ما يناسبك."
    />
  );
}
