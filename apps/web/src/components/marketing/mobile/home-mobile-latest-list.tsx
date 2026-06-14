import { BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { HomeMobileSectionTitle } from "@/components/marketing/mobile/home-mobile-section-title";

function LatestCourseRow({ course }: { course: CourseCardCourse }) {
  const categoryLabel = course.category?.name ?? "كورس تعليمي";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm transition active:scale-[0.99]"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[hsl(222_47%_14%)] via-primary/25 to-[hsl(265_40%_30%)]">
            <BookOpen className="h-5 w-5 text-white/70" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[0.6875rem] font-semibold text-primary">
          {categoryLabel}
        </p>
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-heading">
          {course.title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {course.pricingType === "FREE" ? "مجاني" : "كورس مدفوع"}
        </p>
      </div>

      <ChevronLeft
        className="h-5 w-5 shrink-0 text-muted-foreground/70"
        aria-hidden
      />
    </Link>
  );
}

export function HomeMobileLatestList({
  courses,
}: {
  courses: CourseCardCourse[];
}): React.ReactElement | null {
  const items = courses.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="mobile-latest-heading">
      <HomeMobileSectionTitle
        title="أحدث الكورسات"
        seeAllHref="/courses"
        className="mb-3"
      />

      <div className="flex flex-col gap-2.5">
        {items.map((course) => (
          <LatestCourseRow key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
