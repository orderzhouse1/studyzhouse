import { BookOpen, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import type { PopularCategoryColumn } from "@/components/marketing/popular-by-category";
import { HomeMobileSectionTitle } from "@/components/marketing/mobile/home-mobile-section-title";
import { cn } from "@/lib/utils";
import { normalizeCourseThumbnailUrl } from "@studyhouse/shared";

import logoImage from "../../../../public/logo.png";

const CATEGORY_TONES = [
  "from-primary/12 to-primary/5 border-primary/20 text-primary",
  "from-[hsl(265_45%_55%_/_0.12)] to-[hsl(265_45%_55%_/_0.04)] border-[hsl(265_45%_55%_/_0.25)] text-[hsl(265_40%_40%)]",
  "from-[hsl(192_55%_42%_/_0.12)] to-[hsl(192_55%_42%_/_0.04)] border-[hsl(192_55%_42%_/_0.25)] text-[hsl(192_50%_32%)]",
] as const;

function ratingFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 97;
  return (4.5 + (h % 6) * 0.08).toFixed(1);
}

function lessonLabel(count: number): string {
  if (count === 1) return "درس واحد";
  if (count === 2) return "درسان";
  if (count <= 10) return `${count} دروس`;
  return `${count} درسًا`;
}

function PopularRankRow({
  course,
  rank,
}: {
  course: CourseCardCourse;
  rank: number;
}) {
  const thumbnailSrc = normalizeCourseThumbnailUrl(course.thumbnailUrl);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex items-center gap-3 py-2.5 transition active:opacity-80"
    >
      <span
        className="w-5 shrink-0 text-center text-sm font-black tabular-nums text-primary/35 transition group-hover:text-primary/55"
        aria-hidden
      >
        {String(rank).padStart(2, "0")}
      </span>

      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-border/80 ring-offset-2 ring-offset-card">
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[hsl(222_47%_18%)] to-primary/35">
            <BookOpen className="h-4 w-4 text-white/70" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-sm font-bold text-heading">
          {course.title}
        </h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-[0.625rem] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
            <Star className="h-2.5 w-2.5 fill-primary text-primary" aria-hidden />
            {ratingFromId(course.id)}
          </span>
          <span aria-hidden>·</span>
          <span>{lessonLabel(course.lessonCount)}</span>
        </p>
      </div>
    </Link>
  );
}

function CategoryPanel({
  column,
  toneIndex,
}: {
  column: PopularCategoryColumn;
  toneIndex: number;
}) {
  const { category, courses } = column;
  const tone = CATEGORY_TONES[toneIndex % CATEGORY_TONES.length];

  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_4px_18px_-10px_hsl(222_47%_10%_/_0.12)]">
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b bg-gradient-to-l px-3.5 py-2.5",
          tone,
        )}
      >
        <span className="text-xs font-bold">{category.name}</span>
        <Link
          href={`/courses?categorySlug=${encodeURIComponent(category.slug)}`}
          className="shrink-0 text-[0.625rem] font-semibold opacity-80"
        >
          عرض الكل
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className="divide-y divide-border/50 px-3.5">
          {courses.map((course, index) => (
            <PopularRankRow
              key={course.id}
              course={course}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        <p className="px-3.5 py-5 text-center text-xs text-muted-foreground">
          لا كورسات في هذا التصنيف بعد.
        </p>
      )}
    </article>
  );
}

export function HomeMobilePopularSection({
  columns,
}: {
  columns: PopularCategoryColumn[];
}): React.ReactElement | null {
  if (columns.length === 0) return null;

  return (
    <section className="space-y-3" aria-label="الأكثر شعبية حسب الفئة">
      <HomeMobileSectionTitle title="الأكثر شعبية" seeAllHref="/courses" />

      <div className="space-y-3">
        {columns.map((column, index) => (
          <CategoryPanel
            key={column.category.slug}
            column={column}
            toneIndex={index}
          />
        ))}
      </div>
    </section>
  );
}

/** بطاقة ترحيب سريعة — CTA للتسجيل */
export function HomeMobileQuickCta(): React.ReactElement {
  return (
    <Link
      href="/signup"
      className="flex items-center gap-3 overflow-hidden rounded-[1.25rem] bg-gradient-to-l from-primary to-[hsl(24_90%_48%)] px-3.5 py-3 text-primary-foreground shadow-brand transition active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
        <Image
          src={logoImage}
          alt=""
          className="h-7 w-7 object-contain"
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">انضم وابدأ التعلّم</p>
        <p className="text-[0.6875rem] text-white/85">حساب مجاني في دقائق</p>
      </div>
    </Link>
  );
}
