import { ArrowLeft, BookOpen, Star } from "lucide-react";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { fetchPublicApi } from "@/lib/server-api";
import { APP_NAME_AR } from "@studyhouse/shared";

type CoursesJson = {
  success: true;
  data: { items: CourseCardCourse[] };
};

export type PopularCategoryColumn = {
  category: { name: string; slug: string };
  courses: CourseCardCourse[];
};

/** جلب كورسات منشورة لكل تصنيف — بدون كاش حتى تظهر البيانات فورًا بعد التحديث أو الـ seed. */
export async function loadPopularByCategoryColumns(
  topCategories: { name: string; slug: string }[],
): Promise<PopularCategoryColumn[]> {
  return Promise.all(
    topCategories.map(async (category) => {
      try {
        const json = (await fetchPublicApi(
          `/api/v1/courses?categorySlug=${encodeURIComponent(category.slug)}&page=1&pageSize=3`,
          { noStore: true },
        )) as CoursesJson;
        return { category, courses: json.data.items };
      } catch {
        return { category, courses: [] as CourseCardCourse[] };
      }
    }),
  );
}

function ratingFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 97;
  return (4.5 + (h % 6) * 0.08).toFixed(1);
}

function PopularCourseRow({ course }: { course: CourseCardCourse }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="flex gap-2.5 rounded-lg border border-border/60 bg-card p-2.5 text-start shadow-sm ring-1 ring-black/[0.02] transition-colors duration-150 hover:border-primary/15 hover:bg-muted/25"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted/50 sm:h-[3.75rem] sm:w-[3.75rem]">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-accent/20">
            <BookOpen className="h-5 w-5 text-primary/60" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1 text-[0.625rem] font-medium text-muted-foreground sm:text-[0.6875rem]">
          <BookOpen className="h-3 w-3 shrink-0 text-primary/70" aria-hidden />
          <span className="truncate">{APP_NAME_AR}</span>
        </div>
        <h3 className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug text-heading sm:text-sm">
          {course.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.625rem] text-muted-foreground sm:text-[0.6875rem]">
          <span>كورس تعليمي</span>
          <span className="inline-flex items-center gap-0.5 font-medium text-primary/90">
            <Star className="h-2.5 w-2.5 fill-primary/80 text-primary" aria-hidden />
            {ratingFromId(course.id)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PopularByCategorySection({
  columns,
}: {
  columns: PopularCategoryColumn[];
}): React.ReactElement | null {
  if (columns.length === 0) return null;

  return (
    <section
      className="space-y-3"
      aria-labelledby="popular-by-category-heading"
    >
      <h2
        id="popular-by-category-heading"
        className="text-start text-base font-bold text-heading sm:text-lg"
      >
        الأكثر شعبية حسب الفئة
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-4">
        {columns.map(({ category, courses }) => (
          <div
            key={category.slug}
            className="rounded-xl bg-slate-100/90 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] ring-1 ring-slate-200/80 sm:p-4"
          >
            <Link
              href={`/courses?categorySlug=${encodeURIComponent(category.slug)}`}
              className="mb-3 flex items-center justify-between gap-2 rounded-md px-0.5 py-0.5 transition-colors hover:text-primary/85"
            >
              <h3 className="text-start text-sm font-bold text-heading sm:text-base">
                شائع في {category.name}
              </h3>
              <ArrowLeft
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
            </Link>

            <div className="flex flex-col gap-2">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <PopularCourseRow key={course.id} course={course} />
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-border/80 bg-card/60 px-2.5 py-6 text-center text-xs text-muted-foreground sm:text-sm">
                  لا كورسات منشورة في هذا التصنيف بعد.
                  <Link
                    href="/courses"
                    className="mt-2 block font-medium text-primary hover:underline"
                  >
                    تصفّح الكتالوج
                  </Link>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
