"use client";

import type { HTMLAttributes, ReactElement, ReactNode } from "react";

import { STUDENT_CONTENT_PAD } from "@/components/student/student-dashboard-ui";
import { cn } from "@/lib/utils";

const CONTENT_PAD = STUDENT_CONTENT_PAD;

const HERO_GRADIENT =
  "bg-[linear-gradient(118deg,hsl(222_47%_10%)_0%,hsl(222_47%_17%)_38%,hsl(265_38%_24%)_72%,hsl(222_47%_14%)_100%)]";

function Pulse({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted", className)}
      {...props}
    />
  );
}

function PulseHero({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-white/15", className)}
      {...props}
    />
  );
}

function DashboardSectionSkeleton({
  titleWidth = "w-32",
  description = true,
  children,
}: {
  titleWidth?: string;
  description?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Pulse className={cn("h-7 md:h-8", titleWidth)} />
          {description ? <Pulse className="h-4 w-full max-w-md" /> : null}
        </div>
        <Pulse className="h-10 w-32 shrink-0 rounded-xl" />
      </div>
      {children}
    </section>
  );
}

function MyCourseCardSkeleton(): ReactElement {
  return (
    <div className="flex w-[min(100%,16.75rem)] shrink-0 gap-2.5 rounded-xl border border-border/50 bg-card p-2.5 shadow-sm ring-1 ring-border/30 sm:w-[16.75rem]">
      <Pulse className="h-[4.25rem] w-[4.25rem] shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
        <Pulse className="h-2.5 w-14 rounded-full" />
        <Pulse className="h-3.5 w-full max-w-[9rem]" />
        <Pulse className="h-3 w-full max-w-[7rem]" />
        <Pulse className="h-1 w-full rounded-full" />
        <Pulse className="h-2.5 w-20" />
      </div>
    </div>
  );
}

function CatalogCourseCardSkeleton(): ReactElement {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <Pulse className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-[1.125rem]">
        <div className="flex items-center justify-between gap-2">
          <Pulse className="h-5 w-20 rounded-full" />
          <Pulse className="h-4 w-10 rounded-md" />
        </div>
        <div className="space-y-2">
          <Pulse className="h-4 w-full" />
          <Pulse className="h-3 w-24" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Pulse className="h-5 w-16" />
          <Pulse className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </article>
  );
}

export function StudentDashboardSkeleton(): ReactElement {
  return (
    <div className="pb-16" aria-busy="true" aria-label="جاري تحميل لوحة التعلّم">
      <section
        className={cn(
          "relative overflow-hidden border-b-[3px] border-primary/45",
          HERO_GRADIENT,
          "shadow-[0_16px_40px_-22px_hsl(222_47%_10%_/_0.5)]",
        )}
      >
        <div
          className="pointer-events-none absolute -start-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 end-0 h-40 w-40 rounded-full bg-[hsl(265_55%_40%_/_0.15)] blur-3xl"
          aria-hidden
        />

        <div className={cn("relative py-5 sm:py-6 md:py-7", CONTENT_PAD)}>
          <PulseHero className="h-3 w-14 sm:h-3.5 sm:w-16" />
          <PulseHero className="mt-1.5 h-8 w-48 sm:h-9 sm:w-56" />
          <PulseHero className="mt-2 h-4 w-full max-w-md sm:h-[1.125rem]" />

          <div className="mt-4 flex flex-wrap gap-2 sm:gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex min-w-[6.75rem] items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2.5 py-2 sm:min-w-[7rem] sm:px-3"
              >
                <PulseHero className="h-3.5 w-3.5 shrink-0 rounded sm:h-4 sm:w-4" />
                <div className="flex-1 space-y-1.5">
                  <PulseHero className="h-2 w-10" />
                  <PulseHero className="h-4 w-8 sm:h-5 sm:w-10" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <PulseHero className="h-3 w-28" />
              <PulseHero className="h-4 w-40" />
              <PulseHero className="h-3.5 w-56 max-w-full" />
            </div>
            <PulseHero className="h-10 w-full shrink-0 rounded-xl sm:w-36" />
          </div>
        </div>
      </section>

      <div
        className={cn(
          "mx-auto max-w-[min(100%,100rem)] space-y-14 py-10 md:py-12",
          CONTENT_PAD,
        )}
      >
        <DashboardSectionSkeleton titleWidth="w-24" description>
          <div className="-mx-1 flex gap-3 overflow-hidden pb-2 pt-1">
            {[0, 1, 2].map((i) => (
              <MyCourseCardSkeleton key={i} />
            ))}
          </div>
        </DashboardSectionSkeleton>

        <section className="space-y-5">
          <div className="space-y-2">
            <Pulse className="h-7 w-44 md:h-8" />
            <Pulse className="h-4 w-56 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Pulse
                key={i}
                className="h-10 w-[5.5rem] rounded-full sm:w-28"
              />
            ))}
          </div>
        </section>

        <DashboardSectionSkeleton titleWidth="w-36">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <CatalogCourseCardSkeleton key={i} />
            ))}
          </div>
        </DashboardSectionSkeleton>
      </div>
    </div>
  );
}

export function StudentMyCoursesSkeleton(): ReactElement {
  return (
    <div className="pb-16">
      <section
        className={cn(
          "relative overflow-hidden border-b-[3px] border-primary/45",
          HERO_GRADIENT,
        )}
      >
        <div className={cn("relative py-5 sm:py-6 md:py-7", CONTENT_PAD)}>
          <PulseHero className="h-3 w-14" />
          <PulseHero className="mt-1.5 h-8 w-40 sm:h-9" />
          <PulseHero className="mt-2 h-4 w-64 max-w-full" />
        </div>
      </section>
      <div
        className={cn(
          "mx-auto max-w-[min(100%,100rem)] space-y-10 py-10",
          CONTENT_PAD,
        )}
      >
        <DashboardSectionSkeleton titleWidth="w-28" description={false}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <MyCourseCardSkeleton key={i} />
            ))}
          </div>
        </DashboardSectionSkeleton>
      </div>
    </div>
  );
}

export function StudentCourseGridSkeleton({
  cards = 4,
}: {
  cards?: number;
}): ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <Pulse className="h-8 w-48" />
        <Pulse className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }, (_, i) => (
          <CatalogCourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function CoursesCatalogSkeleton(): ReactElement {
  return (
    <div className="mx-auto w-full max-w-[min(100%,88rem)] px-4 pb-16 pt-2 sm:px-6 md:px-8 md:pt-4">
      <div className="mb-8 space-y-2">
        <Pulse className="h-9 w-48" />
        <Pulse className="h-4 w-full max-w-md" />
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <Pulse className="h-80 w-full shrink-0 rounded-2xl lg:w-[17rem]" />
        <div className="@container min-w-0 flex-1 space-y-5">
          <Pulse className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 @min-[36rem]:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <CatalogCourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentPaymentsSkeleton(): ReactElement {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Pulse className="h-4 w-32" />
        <Pulse className="h-9 w-72 max-w-full" />
        <Pulse className="h-4 w-full max-w-2xl" />
      </div>
      <Pulse className="h-32 w-full rounded-2xl" />
      <Pulse className="h-64 w-full rounded-3xl" />
    </div>
  );
}

export function LearnCourseSkeleton(): ReactElement {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[min(100%,100rem)] space-y-3 pb-10 pt-4 sm:pt-5 md:pb-12",
        CONTENT_PAD,
      )}
    >
      <Pulse className="h-7 w-36" />
      <div className="lg:grid lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-4">
        <Pulse className="hidden h-80 rounded-2xl lg:block" />
        <div className="min-w-0 space-y-3">
          <Pulse className="h-11 w-full rounded-2xl" />
          <Pulse className="h-28 w-full rounded-2xl" />
          <Pulse className="mx-auto aspect-video w-full max-w-2xl rounded-lg" />
          <Pulse className="h-10 w-full rounded-2xl" />
          <div className="grid gap-3 md:grid-cols-2">
            <Pulse className="h-36 rounded-2xl" />
            <Pulse className="h-36 rounded-2xl" />
            <Pulse className="h-28 rounded-2xl md:col-span-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
