import type { Metadata } from "next";

import {
  CoursesCatalog,
  type CoursesCatalogSearchParams,
} from "@/components/courses/courses-catalog";
import { StudentInterestCourses } from "@/components/student/student-interest-courses";
import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";

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
    <div>
      <div className={STUDENT_CONTENT_PAD}>
        <StudentInterestCourses />
      </div>
      <CoursesCatalog
        basePath="/student/explore"
        searchParams={searchParams}
        title="استكشف الكورسات"
        description="استكشف الكورسات المنشورة واختر ما يناسبك."
      />
    </div>
  );
}
