import Link from "next/link";

import { cn } from "@/lib/utils";

export type CatalogFilters = {
  search?: string;
  categorySlug?: string;
  pricingType?: "FREE" | "PAID";
  sort?: string;
};

function buildCoursesHref(
  base: CatalogFilters,
  patch: {
    categorySlug?: string | null;
    pricingType?: "FREE" | "PAID" | null;
  } = {},
): string {
  const categorySlug =
    patch.categorySlug !== undefined ? patch.categorySlug ?? undefined : base.categorySlug;
  const pricingType =
    patch.pricingType !== undefined ? patch.pricingType ?? undefined : base.pricingType;

  const qs = new URLSearchParams();
  if (base.search?.trim()) qs.set("search", base.search.trim());
  if (categorySlug?.trim()) qs.set("categorySlug", categorySlug.trim());
  if (pricingType) qs.set("pricingType", pricingType);
  if (base.sort && base.sort !== "newest") qs.set("sort", base.sort);
  const q = qs.toString();
  return q ? `/courses?${q}` : "/courses";
}

function FilterCheckbox({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm transition-colors",
        active ? "font-semibold text-heading" : "text-muted-foreground hover:text-heading",
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card",
        )}
        aria-hidden
      >
        {active ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-heading">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function CoursesCatalogSidebar({
  categories,
  filters,
}: {
  categories: { name: string; slug: string }[];
  filters: CatalogFilters;
}): React.ReactElement {
  const activeSlug = filters.categorySlug ?? "";
  const activePricing = filters.pricingType ?? "";

  return (
    <aside
      className="shrink-0 rounded-2xl border border-border/70 bg-muted/35 p-5 lg:w-[15.5rem] xl:w-[17rem]"
      aria-label="تصفية الكورسات"
    >
      <div className="space-y-7">
        {categories.length > 0 ? (
          <FilterSection title="التصنيفات">
            <FilterCheckbox
              href={buildCoursesHref(filters, { categorySlug: null })}
              active={activeSlug === ""}
              label="جميع التصنيفات"
            />
            {categories.map((c) => (
              <FilterCheckbox
                key={c.slug}
                href={buildCoursesHref(filters, { categorySlug: c.slug })}
                active={activeSlug === c.slug}
                label={c.name}
              />
            ))}
          </FilterSection>
        ) : null}

        <FilterSection title="اللغة">
          <FilterCheckbox href={buildCoursesHref(filters, {})} active label="العربية" />
        </FilterSection>

        <FilterSection title="السعر">
          <FilterCheckbox
            href={buildCoursesHref(filters, { pricingType: null })}
            active={activePricing === ""}
            label="الكل"
          />
          <FilterCheckbox
            href={buildCoursesHref(filters, { pricingType: "FREE" })}
            active={activePricing === "FREE"}
            label="مجاني"
          />
          <FilterCheckbox
            href={buildCoursesHref(filters, { pricingType: "PAID" })}
            active={activePricing === "PAID"}
            label="مدفوع"
          />
        </FilterSection>
      </div>
    </aside>
  );
}
