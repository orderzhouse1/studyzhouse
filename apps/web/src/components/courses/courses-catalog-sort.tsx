"use client";

import { useRouter } from "next/navigation";

import {
  buildCoursesHref,
  type CatalogFilters,
} from "@/components/courses/courses-catalog-filter-utils";

const SORT_OPTIONS = [
  { value: "newest", label: "الأحدث" },
  { value: "price_asc", label: "السعر: من الأقل للأعلى" },
  { value: "price_desc", label: "السعر: من الأعلى للأقل" },
  { value: "title_asc", label: "العنوان (أ–ي)" },
] as const;

function buildSortHref(
  basePath: string,
  filters: CatalogFilters,
  sort: string,
): string {
  return buildCoursesHref(basePath, {
    ...filters,
    sort: sort === "newest" ? undefined : sort,
  });
}

export function CoursesCatalogSort({
  basePath = "/courses",
  filters,
  total,
}: {
  basePath?: string;
  filters: CatalogFilters;
  total: number;
}): React.ReactElement {
  const router = useRouter();
  const current = filters.sort ?? "newest";

  return (
    <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-muted-foreground">
        إجمالي{" "}
        <span className="font-bold text-heading">{total}</span>{" "}
        {total === 1 ? "كورس" : "كورسات"}
      </p>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="shrink-0 font-medium">ترتيب حسب:</span>
        <select
          value={current}
          onChange={(e) => router.push(buildSortHref(basePath, filters, e.target.value))}
          className="h-9 min-w-[11rem] rounded-lg border border-border bg-card px-3 text-sm font-medium text-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label="ترتيب الكورسات"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
