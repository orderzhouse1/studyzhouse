import { CoursesCatalogSkeleton } from "@/components/student/student-page-skeletons";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function CoursesLoading(): React.ReactElement {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <SiteHeader coursesActive />
      <main>
        <CoursesCatalogSkeleton />
      </main>
      <SiteFooter />
    </div>
  );
}
