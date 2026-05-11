"use client";

import type { HTMLAttributes, ReactElement } from "react";

import { cn } from "@/lib/utils";

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
    <div className="space-y-8">
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/12 via-card to-secondary/25 px-5 py-6 shadow-card ring-1 ring-primary/15 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Pulse className="h-3 w-24" />
            <Pulse className="h-9 max-w-md w-full" />
            <Pulse className="h-4 max-w-xl w-full" />
            <Pulse className="h-4 max-w-lg w-full" />
          </div>
          <Pulse className="hidden h-12 w-12 shrink-0 rounded-2xl md:block" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border-secondary/80 bg-card p-6 shadow-sm ring-1 ring-border/60"
          >
            <Pulse className="mb-3 h-3 w-28" />
            <Pulse className="h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border-primary/25 bg-card shadow-card ring-1 ring-primary/15">
        <div className="border-b border-border bg-gradient-to-l from-card to-secondary/30 px-6 py-4">
          <Pulse className="h-5 w-40" />
          <Pulse className="mt-2 h-4 w-64" />
        </div>
        <div className="space-y-3 p-6">
          <Pulse className="h-4 w-full max-w-md" />
          <Pulse className="h-10 w-36 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-3xl border-border bg-card p-6 shadow-sm ring-1 ring-border/50"
          >
            <Pulse className="h-5 w-32" />
            <Pulse className="mt-2 h-4 w-full max-w-xs" />
            <Pulse className="mt-6 h-10 w-36 rounded-xl" />
          </div>
        ))}
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
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-3xl border-border shadow-card ring-1 ring-border/60"
          >
            <Pulse className="aspect-[16/9] w-full rounded-none" />
            <div className="space-y-2 p-5 pt-4">
              <Pulse className="h-3 w-20" />
              <Pulse className="h-5 w-full" />
              <Pulse className="h-4 w-28" />
              <Pulse className="mt-3 h-10 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExploreCoursesSkeleton(): ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <Pulse className="h-8 w-56" />
        <Pulse className="mt-2 h-4 w-full max-w-xl" />
      </div>
      <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/40 p-4 ring-1 ring-cyan-200/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-start gap-3">
            <Pulse className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-3 w-full max-w-sm" />
            </div>
          </div>
          <Pulse className="h-10 w-28 shrink-0 rounded-xl" />
        </div>
      </div>
      <StudentCourseGridSkeleton cards={6} />
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
      <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/40 p-6 ring-1 ring-cyan-200/60">
        <Pulse className="h-5 w-40" />
        <Pulse className="mt-2 h-4 w-full max-w-xl" />
      </div>
      <div className="rounded-3xl border-border bg-card p-6 shadow-card ring-1 ring-border/60">
        <Pulse className="h-6 w-48" />
        <Pulse className="mt-2 h-4 w-full max-w-lg" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Pulse className="h-4 w-16" />
            <Pulse className="h-10 w-full rounded-xl" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Pulse className="h-4 w-24" />
              <Pulse className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2">
            <Pulse className="h-4 w-20" />
            <Pulse className="h-[72px] w-full rounded-xl" />
          </div>
        </div>
        <Pulse className="mt-6 h-10 w-44 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Pulse className="h-7 w-40" />
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border-border bg-card p-4 shadow-sm ring-1 ring-border/50"
            >
              <Pulse className="h-5 w-48" />
              <Pulse className="mt-2 h-3 w-full max-w-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LearnCourseSkeleton(): ReactElement {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card/90 px-4 py-4 shadow-sm ring-1 ring-border/60 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="min-w-0 flex-1 space-y-3">
          <Pulse className="h-4 w-36" />
          <Pulse className="h-8 w-full max-w-md" />
          <Pulse className="h-4 w-full max-w-lg" />
        </div>
        <div className="w-full max-w-xs shrink-0 space-y-2 md:text-end">
          <Pulse className="h-3 w-full" />
          <Pulse className="h-2 w-full rounded-full" />
          <Pulse className="h-3 w-32 ms-auto" />
        </div>
      </div>
      <div className="lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start lg:gap-6">
        <div className="mb-4 lg:mb-0">
          <Pulse className="mb-3 h-10 w-full rounded-xl lg:hidden" />
          <div className="rounded-3xl border border-border bg-card shadow-sm ring-1 ring-border/60">
            <Pulse className="h-12 w-full rounded-none rounded-t-3xl" />
            <div className="space-y-4 p-3">
              {[0, 1].map((sec) => (
                <div key={sec} className="space-y-2">
                  <Pulse className="h-3 w-24 px-1" />
                  {[0, 1, 2].map((les) => (
                    <Pulse key={les} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-3xl border-border shadow-card ring-1 ring-border/60">
            <div className="border-b border-border bg-gradient-to-l from-card to-secondary/25 px-4 py-3 md:px-6">
              <Pulse className="h-3 w-20" />
              <Pulse className="mt-2 h-7 w-full max-w-lg" />
            </div>
            <div className="space-y-4 p-4 md:p-6">
              <Pulse className="aspect-video w-full rounded-2xl" />
              <Pulse className="h-24 w-full rounded-2xl" />
              <div className="flex flex-wrap gap-3">
                <Pulse className="h-10 w-44 rounded-xl" />
                <Pulse className="h-10 w-24 rounded-xl" />
                <Pulse className="h-10 w-24 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
