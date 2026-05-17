import { BookOpen } from "lucide-react";
import Link from "next/link";

import type { CourseCardCourse } from "@/components/courses/course-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME_AR } from "@studyhouse/shared";

function courseTypeLabel(course: CourseCardCourse): string {
  if (course.category?.name) return course.category.name;
  return course.pricingType === "FREE" ? "كورس مجاني" : "كورس مدفوع";
}

function FeaturedStripCard({
  course,
  className,
}: {
  course: CourseCardCourse;
  className?: string;
}): React.ReactElement {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        "group flex min-w-0 w-full flex-col overflow-hidden rounded-2xl bg-card shadow-[0_8px_28px_-8px_hsl(222_47%_10%_/_0.35)] ring-1 ring-white/80 transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-muted/40 sm:aspect-[4/3]">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-[hsl(265_45%_94%)]"
            aria-hidden
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 text-start sm:gap-2 sm:p-3.5">
        <div className="flex items-center gap-1.5 text-[0.625rem] font-medium text-muted-foreground sm:text-[0.6875rem]">
          <BookOpen className="h-3 w-3 shrink-0 text-primary sm:h-3.5 sm:w-3.5" aria-hidden />
          <span className="truncate">{APP_NAME_AR}</span>
        </div>
        <h3 className="line-clamp-2 text-xs font-bold leading-snug text-heading sm:text-sm">
          {course.title}
        </h3>
        <p className="mt-auto text-[0.625rem] font-medium text-muted-foreground sm:text-[0.6875rem]">
          {courseTypeLabel(course)}
        </p>
      </div>
    </Link>
  );
}

/**
 * شريط مختارات الكتالوج — عرض كامل، أربع بطاقات ظاهرة دون تمرير أفقي.
 */
export function FeaturedCoursesBanner({
  courses,
}: {
  courses: CourseCardCourse[];
}): React.ReactElement {
  return (
    <section
      id="featured"
      className="relative w-screen max-w-[100vw] scroll-mt-24 [margin-inline:calc(50%-50vw)]"
      aria-labelledby="featured-banner-heading"
    >
      <div className="mx-auto w-full max-w-[min(100%,88rem)] px-4 sm:px-6 md:px-8">
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.75rem] border-[3px] border-primary/45 p-4 sm:rounded-[2rem] sm:p-6 lg:p-7",
            "bg-[linear-gradient(118deg,hsl(222_47%_10%)_0%,hsl(222_47%_17%)_38%,hsl(265_38%_24%)_72%,hsl(222_47%_14%)_100%)]",
            "shadow-[0_20px_50px_-24px_hsl(222_47%_10%_/_0.55)]",
          )}
        >
          <div
            className="pointer-events-none absolute -start-16 -top-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 end-0 h-48 w-48 rounded-full bg-[hsl(265_55%_40%_/_0.2)] blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
            {/* RTL: نص وزر يمين */}
            <div className="flex shrink-0 flex-col justify-center text-start lg:w-[15.5rem] xl:w-[17rem]">
              <p className="text-xs font-semibold tracking-wide text-primary sm:text-sm">
                مختارات من الكتالوج
              </p>
              <h2
                id="featured-banner-heading"
                className="mt-2 text-balance text-lg font-bold leading-tight text-white sm:text-xl xl:text-2xl"
              >
                كورسات جاهزة للاستكشاف
              </h2>
              <p className="mt-2 text-pretty text-xs leading-relaxed text-white/80 sm:text-sm">
                اختر كورسًا وابدأ التعلّم من حيث يناسبك.
              </p>
              <Button
                asChild
                className="mt-4 h-10 w-fit rounded-xl border-2 border-white/90 bg-white px-4 text-sm font-semibold text-[hsl(222_47%_12%)] shadow-sm hover:bg-white/95 hover:text-[hsl(222_47%_10%)] sm:mt-5 sm:h-11 sm:px-5"
              >
                <Link href="/courses">عرض الكل</Link>
              </Button>
            </div>

            {/* أربع بطاقات — شبكة ثابتة بدون سكرول */}
            <div
              className="grid min-w-0 flex-1 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-3.5 xl:gap-4"
              role="list"
            >
              {courses.map((course) => (
                <FeaturedStripCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
