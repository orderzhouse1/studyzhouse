import type { Metadata } from "next";

import {
  CoursesCatalog,
  type CoursesCatalogSearchParams,
} from "@/components/courses/courses-catalog";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استكشف الكورسات",
};

export default function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<CoursesCatalogSearchParams>;
}): React.ReactElement {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <SiteHeader coursesActive />
      <main>
        <CoursesCatalog basePath="/courses" searchParams={searchParams} />
      </main>
      <SiteFooter />
    </div>
  );
}
