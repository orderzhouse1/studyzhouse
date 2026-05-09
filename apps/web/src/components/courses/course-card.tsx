import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CourseCardCourse = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  pricingType: "FREE" | "PAID";
  priceAmount: string | null;
  currency: string;
  estimatedDurationMinutes: number | null;
  category: null | { id: string; name: string; slug: string };
  lessonCount: number;
};

export function CourseCard({
  course,
  className,
}: {
  course: CourseCardCourse;
  className?: string;
}): React.ReactElement {
  const priceLabel =
    course.pricingType === "FREE"
      ? "مجاني"
      : `${course.priceAmount ?? "—"} ${course.currency}`;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_18px_55px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(15,23,42,0.10)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-card to-accent/25" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-4 pt-16">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="backdrop-blur">
              {priceLabel}
            </Badge>
            {course.category ? (
              <Badge
                variant="outline"
                className="border-white/40 bg-white/70 text-foreground backdrop-blur"
              >
                {course.category.name}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2 p-6">
        <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
          {course.title}
        </h3>
        {course.shortDescription ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {course.shortDescription}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">بدون وصف قصير بعد.</p>
        )}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span>{course.lessonCount} درسًا</span>
          {course.estimatedDurationMinutes ? (
            <span>≈ {course.estimatedDurationMinutes} دقيقة</span>
          ) : (
            <span>مدة غير محددة</span>
          )}
        </div>
      </div>
    </Link>
  );
}
