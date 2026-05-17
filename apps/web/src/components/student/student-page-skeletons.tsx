"use client";

import type { HTMLAttributes, ReactElement } from "react";

import { cn } from "@/lib/utils";

const CONTENT_PAD = "px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20";

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

export function StudentDashboardSkeleton(): ReactElement {
  return (
    <div className="pb-16">
      <Pulse className="h-36 w-full rounded-none sm:h-40" />
      <div className={cn("mx-auto max-w-[min(100%,100rem)] space-y-10 py-10", CONTENT_PAD)}>
        <div className="space-y-4">
          <Pulse className="h-7 w-40" />
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <Pulse key={i} className="h-[5.5rem] w-[16.75rem] shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Pulse className="h-7 w-48" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Pulse key={i} className="h-10 w-28 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Pulse key={i} className="aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StudentMyCoursesSkeleton(): ReactElement {
  return (
    <div className="pb-16">
      <Pulse className="h-36 w-full rounded-none sm:h-40" />
      <div
        className={cn(
          "mx-auto max-w-[min(100%,100rem)] space-y-10 py-10",
          CONTENT_PAD,
        )}
      >
        <div className="space-y-4">
          <Pulse className="h-7 w-40" />
          <Pulse className="h-4 w-64 max-w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((i) => (
              <Pulse key={i} className="h-[5.5rem] rounded-xl" />
            ))}
          </div>
        </div>
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
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <Pulse key={i} className="h-80 rounded-3xl" />
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
              <Pulse key={i} className="aspect-[4/5] rounded-2xl" />
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
