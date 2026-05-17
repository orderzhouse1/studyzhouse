import { ArrowLeft, Heart, Star } from "lucide-react";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME_AR } from "@studyhouse/shared";

function ratingFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 97;
  return (4.2 + (h % 8) * 0.1).toFixed(1);
}

function formatPrice(course: CourseCardCourse): string {
  if (course.pricingType === "FREE") return "مجاني";
  const amount = course.priceAmount ?? "—";
  return `${course.currency} ${amount}`;
}

export function CatalogCourseCard({
  course,
  className,
}: {
  course: CourseCardCourse;
  className?: string;
}): React.ReactElement {
  const rating = ratingFromId(course.id);
  const categoryLabel = course.category?.name ?? "كورس تعليمي";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_2px_12px_-4px_hsl(222_47%_10%_/_0.12)] transition-shadow hover:shadow-[0_8px_24px_-8px_hsl(222_47%_10%_/_0.18)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[hsl(222_47%_12%)]">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[hsl(222_47%_14%)] via-primary/25 to-[hsl(265_40%_28%)]"
            aria-hidden
          />
        )}
        <Link
          href={`/courses/${course.slug}`}
          className="absolute end-2.5 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-primary shadow-sm transition-colors hover:bg-white hover:text-primary/90"
          aria-label={`إضافة ${course.title} للمفضلة`}
        >
          <Heart className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-[1.125rem]">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex max-w-[70%] truncate rounded-full bg-muted/80 px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground">
            {categoryLabel}
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-heading">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {rating}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[hsl(222_47%_12%)] sm:text-[0.9375rem]">
            <Link
              href={`/courses/${course.slug}`}
              className="transition-colors hover:text-primary"
            >
              {course.title}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground">بواسطة {APP_NAME_AR}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Button
            asChild
            className="h-9 shrink-0 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-[3px_3px_0_0_hsl(222_47%_10%)] transition-transform hover:bg-[hsl(var(--primary-hover))] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_hsl(222_47%_10%)] sm:px-4 sm:text-sm"
          >
            <Link href={`/courses/${course.slug}`} className="gap-1.5">
              عرض الكورس
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
          <span
            className={cn(
              "text-sm font-bold tabular-nums sm:text-base",
              course.pricingType === "FREE"
                ? "text-primary"
                : "text-primary",
            )}
          >
            {formatPrice(course)}
          </span>
        </div>
      </div>
    </article>
  );
}
