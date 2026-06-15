import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { cn } from "@/lib/utils";

const CARD_THEMES = [
  "from-[hsl(222_47%_14%)] to-[hsl(222_47%_22%)] text-white",
  "from-[hsl(24_95%_88%)] to-[hsl(24_90%_78%)] text-[hsl(222_47%_14%)]",
  "from-[hsl(192_60%_88%)] to-[hsl(192_55%_78%)] text-[hsl(222_47%_14%)]",
  "from-[hsl(222_35%_88%)] to-[hsl(222_30%_78%)] text-[hsl(222_47%_14%)]",
] as const;

function lessonLabel(count: number): string {
  if (count === 1) return "درس واحد";
  if (count === 2) return "درسان";
  if (count <= 10) return `${count} دروس`;
  return `${count} درسًا`;
}

function FeaturedCarouselCard({
  course,
  themeIndex,
}: {
  course: CourseCardCourse;
  themeIndex: number;
}): React.ReactElement {
  const theme = CARD_THEMES[themeIndex % CARD_THEMES.length];
  const isDarkCard = themeIndex % CARD_THEMES.length === 0;

  return (
    <article
      className={cn(
        "home-mobile-snap-card relative flex min-h-[11.5rem] w-[min(82vw,18.5rem)] shrink-0 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-gradient-to-br p-4 shadow-[0_14px_36px_-14px_hsl(222_47%_10%_/_0.28)]",
        theme,
      )}
    >
      <div className="relative z-10 flex flex-1 flex-col gap-1 pe-16">
        <p className="text-[0.6875rem] font-semibold opacity-80">
          {course.category?.name ?? "كورس مميز"}
        </p>
        <h3 className="line-clamp-2 text-base font-bold leading-snug">
          {course.title}
        </h3>
        <p className="mt-auto text-xs font-medium opacity-75">
          {lessonLabel(course.lessonCount)}
        </p>
        <div
          className={cn(
            "mt-2 h-1.5 overflow-hidden rounded-full",
            isDarkCard ? "bg-white/15" : "bg-black/10",
          )}
        >
          <div
            className={cn(
              "h-full w-1/3 rounded-full",
              isDarkCard ? "bg-white/45" : "bg-[hsl(222_47%_14%)]/35",
            )}
          />
        </div>
      </div>

      <div className="relative z-10 mt-3">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-brand transition active:scale-95"
        >
          لنبدأ!
        </Link>
      </div>

      <div
        className="pointer-events-none absolute -bottom-2 -end-2 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/25"
        aria-hidden
      >
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover shadow-md"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <BookOpen className="h-10 w-10 opacity-40" />
        )}
      </div>
    </article>
  );
}

export function HomeMobileFeaturedCarousel({
  courses,
}: {
  courses: CourseCardCourse[];
}): React.ReactElement | null {
  if (courses.length === 0) return null;

  return (
    <section id="featured" aria-labelledby="mobile-featured-heading" className="scroll-mt-24">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="mobile-featured-heading" className="text-base font-bold text-heading">
          كورسات مميزة
        </h2>
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
        >
          عرض الكل
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="home-mobile-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {courses.map((course, index) => (
          <FeaturedCarouselCard
            key={course.id}
            course={course}
            themeIndex={index}
          />
        ))}
      </div>
    </section>
  );
}
