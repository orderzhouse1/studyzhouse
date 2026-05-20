"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  buildCoursesHref,
  type CatalogFilters,
} from "@/components/courses/courses-catalog-filter-utils";
import { cn } from "@/lib/utils";

type CatalogFilterLinkProps = {
  href: string;
  active: boolean;
  label: string;
  pendingKey: string | null;
  onPending: (href: string | null) => void;
};

/**
 * خيار فلترة واحد (راديو بصريًا) — تنقّل عبر الرابط مع تمييز فوري أثناء الانتقال.
 */
export function CatalogFilterLink({
  href,
  active,
  label,
  pendingKey,
  onPending,
}: CatalogFilterLinkProps): React.ReactElement {
  const isPending = pendingKey === href;
  const showSelected = active || isPending;

  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      onClick={() => onPending(href)}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-sm transition-[background-color,border-color,color,opacity] duration-150",
        showSelected
          ? "border-primary/35 bg-primary/10 font-semibold text-heading shadow-sm"
          : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-card/90 hover:text-heading",
        isPending && !active && "ring-1 ring-primary/25",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          showSelected ? "border-primary" : "border-muted-foreground/35",
        )}
        aria-hidden
      >
        {showSelected ? (
          <span className="h-2 w-2 rounded-full bg-primary" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      {isPending ? (
        <span className="sr-only">جاري التحديث</span>
      ) : null}
    </Link>
  );
}

export function CatalogFiltersPanel({
  basePath,
  categories,
  filters,
}: {
  basePath: string;
  categories: { name: string; slug: string }[];
  filters: CatalogFilters;
}): React.ReactElement {
  const activeSlug = filters.categorySlug ?? "";
  const activePricing = filters.pricingType ?? "";
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [filters.categorySlug, filters.pricingType, filters.sort, filters.search]);

  const isUpdating = pendingHref !== null;

  return (
    <aside
      className="shrink-0 rounded-2xl border border-border/70 bg-muted/35 p-5 lg:w-[15.5rem] xl:w-[17rem]"
      aria-label="تصفية الكورسات"
    >
      {isUpdating ? (
        <p
          className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center text-xs font-medium text-primary"
          role="status"
          aria-live="polite"
        >
          جاري التحديث…
        </p>
      ) : null}

      <div className="space-y-7">
        {categories.length > 0 ? (
          <FilterSection title="التصنيفات" headingId="catalog-filter-categories">
            <CatalogFilterLink
              href={buildCoursesHref(basePath, filters, { categorySlug: null })}
              active={activeSlug === ""}
              label="جميع التصنيفات"
              pendingKey={pendingHref}
              onPending={setPendingHref}
            />
            {categories.map((c) => (
              <CatalogFilterLink
                key={c.slug}
                href={buildCoursesHref(basePath, filters, {
                  categorySlug: c.slug,
                })}
                active={activeSlug === c.slug}
                label={c.name}
                pendingKey={pendingHref}
                onPending={setPendingHref}
              />
            ))}
          </FilterSection>
        ) : null}

        <FilterSection title="السعر" headingId="catalog-filter-pricing">
          <CatalogFilterLink
            href={buildCoursesHref(basePath, filters, { pricingType: null })}
            active={activePricing === ""}
            label="الكل"
            pendingKey={pendingHref}
            onPending={setPendingHref}
          />
          <CatalogFilterLink
            href={buildCoursesHref(basePath, filters, { pricingType: "FREE" })}
            active={activePricing === "FREE"}
            label="مجاني"
            pendingKey={pendingHref}
            onPending={setPendingHref}
          />
          <CatalogFilterLink
            href={buildCoursesHref(basePath, filters, { pricingType: "PAID" })}
            active={activePricing === "PAID"}
            label="مدفوع"
            pendingKey={pendingHref}
            onPending={setPendingHref}
          />
        </FilterSection>
      </div>
    </aside>
  );
}

function FilterSection({
  title,
  headingId,
  children,
}: {
  title: string;
  headingId: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-2.5" role="group" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-sm font-bold text-heading">
        {title}
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}
