import { ArrowLeft, Bookmark, Star } from "lucide-react";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { catalogCtaButtonClassName } from "@/lib/catalog-cta-button";
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
  detailBasePath = "/courses",
  compact = false,
  saved,
  saveLoading,
  onToggleSave,
}: {
  course: CourseCardCourse;
  className?: string;
  /** مسار صفحة تفاصيل الكورس، مثلاً `/student/courses` للطالب */
  detailBasePath?: string;
  /** خطوط أصغر — معاينة لوحة الإدارة فقط */
  compact?: boolean;
  saved?: boolean;
  saveLoading?: boolean;
  onToggleSave?: () => void;
}): React.ReactElement {
  const detailHref = `${detailBasePath}/${course.slug}`;
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
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[hsl(222_47%_14%)] via-primary/25 to-[hsl(265_40%_28%)]"
            aria-hidden
          />
        )}
        {onToggleSave ? (
          <button
            type="button"
            disabled={saveLoading}
            className={cn(
              "absolute inline-flex items-center justify-center rounded-full bg-white/95 text-primary shadow-sm transition-colors hover:bg-white hover:text-primary/90 disabled:opacity-60",
              compact ? "end-2 top-2 h-7 w-7" : "end-2.5 top-2.5 h-8 w-8",
            )}
            aria-label={
              saved
                ? `إزالة ${course.title} من المحفوظات`
                : `حفظ ${course.title}`
            }
            aria-pressed={saved}
            onClick={(e) => {
              e.preventDefault();
              onToggleSave();
            }}
          >
            <Bookmark
              className={cn(
                compact ? "h-3.5 w-3.5" : "h-4 w-4",
                saved && "fill-current",
              )}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col",
          compact ? "gap-2 p-2.5" : "gap-3 p-4 sm:p-[1.125rem]",
        )}
      >
        <div className="flex items-center justify-between gap-1.5">
          <span
            className={cn(
              "inline-flex max-w-[70%] truncate rounded-full bg-muted/80 font-medium text-muted-foreground",
              compact
                ? "px-1.5 py-0.5 text-[0.625rem]"
                : "px-2.5 py-1 text-[0.6875rem]",
            )}
          >
            {categoryLabel}
          </span>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 font-semibold text-heading",
              compact ? "text-[0.625rem]" : "text-xs",
            )}
          >
            <Star
              className={cn(
                "fill-amber-400 text-amber-400",
                compact ? "h-3 w-3" : "h-3.5 w-3.5",
              )}
              aria-hidden
            />
            {rating}
          </span>
        </div>

        <div className={cn(compact ? "space-y-0.5" : "space-y-1")}>
          <h3
            className={cn(
              "line-clamp-2 font-bold leading-snug text-[hsl(222_47%_12%)]",
              compact ? "text-[0.6875rem]" : "text-sm sm:text-[0.9375rem]",
            )}
          >
            <Link
              href={detailHref}
              className="transition-colors hover:text-primary"
            >
              {course.title}
            </Link>
          </h3>
          <p
            className={cn(
              "text-muted-foreground",
              compact ? "text-[0.625rem]" : "text-xs",
            )}
          >
            بواسطة {APP_NAME_AR}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-1.5 pt-0.5">
          <Button
            asChild
            className={cn(
              "shrink-0 font-semibold",
              compact
                ? "h-7 px-2 text-[0.625rem]"
                : "h-9 px-3.5 text-xs sm:px-4 sm:text-sm",
              catalogCtaButtonClassName,
            )}
          >
            <Link href={detailHref} className={cn(compact ? "gap-1" : "gap-1.5")}>
              عرض الكورس
              <ArrowLeft
                className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")}
                aria-hidden
              />
            </Link>
          </Button>
          <span
            className={cn(
              "font-bold tabular-nums text-primary",
              compact ? "text-[0.6875rem]" : "text-sm sm:text-base",
            )}
          >
            {formatPrice(course)}
          </span>
        </div>
      </div>
    </article>
  );
}
