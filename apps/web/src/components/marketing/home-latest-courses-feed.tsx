import { Calendar, User } from "lucide-react";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { cn } from "@/lib/utils";
import { APP_NAME_AR } from "@studyhouse/shared";

function formatPublishedDate(iso: string | null | undefined): string {
  if (!iso) return "منشور حديثًا";
  try {
    return new Intl.DateTimeFormat("ar", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "منشور حديثًا";
  }
}

function FeedCard({ course }: { course: CourseCardCourse }): React.ReactElement {
  const categoryLabel = course.category?.name ?? "كورس تعليمي";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_2px_14px_-6px_hsl(222_47%_10%_/_0.1)] transition-shadow hover:shadow-[0_10px_28px_-12px_hsl(222_47%_10%_/_0.16)]">
      <Link
        href={`/courses/${course.slug}`}
        className="relative block aspect-[16/11] overflow-hidden bg-[hsl(222_47%_12%)]"
      >
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[hsl(222_47%_14%)] via-primary/20 to-[hsl(265_40%_30%)]"
            aria-hidden
          />
        )}
        <span className="absolute start-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] truncate rounded-full bg-primary px-2.5 py-1 text-[0.6875rem] font-semibold text-primary-foreground shadow-sm">
          {categoryLabel}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-[1.125rem]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.6875rem] font-medium text-primary/90 sm:text-xs">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatPublishedDate(course.publishedAt)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">بواسطة {APP_NAME_AR}</span>
          </span>
        </div>

        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[hsl(222_47%_12%)] sm:text-[0.9375rem]">
          <Link
            href={`/courses/${course.slug}`}
            className="transition-colors hover:text-primary"
          >
            {course.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

/**
 * شبكة أحدث الكورسات — أسلوب «آخر الأخبار» فوق قسم الأسئلة الشائعة.
 */
export function HomeLatestCoursesFeed({
  courses,
}: {
  courses: CourseCardCourse[];
}): React.ReactElement | null {
  const items = courses.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section
      className={cn(
        "relative w-screen max-w-[100vw] scroll-mt-24 [margin-inline:calc(50%-50vw)]",
        "bg-gradient-to-b from-accent/50 via-secondary/25 to-background",
      )}
      aria-labelledby="latest-courses-feed-heading"
    >
      <div className="mx-auto w-full max-w-[min(100%,88rem)] px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary sm:text-sm">
            كورسات وتعلّم
          </span>
          <h2
            id="latest-courses-feed-heading"
            className="mt-3 text-balance text-2xl font-bold text-[hsl(222_47%_12%)] sm:text-3xl"
          >
            أحدث إضافات الكتالوج
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            لا تفوّت التحديثات — استكشف الكورسات المنشورة حديثًا وابدأ مسارك
            التعليمي اليوم.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {items.map((course) => (
            <FeedCard key={course.id} course={course} />
          ))}
        </div>

        <p className="mt-5 text-center">
          <Link
            href="/courses"
            className="text-sm font-semibold text-primary transition-colors hover:text-primary/90"
          >
            عرض كل الكورسات ←
          </Link>
        </p>
      </div>
    </section>
  );
}
