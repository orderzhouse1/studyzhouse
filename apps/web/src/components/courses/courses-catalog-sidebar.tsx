import { CatalogFiltersPanel } from "@/components/courses/catalog-filter-link";
import type { CatalogFilters } from "@/components/courses/courses-catalog-filter-utils";

export type { CatalogFilters } from "@/components/courses/courses-catalog-filter-utils";
export { buildCoursesHref } from "@/components/courses/courses-catalog-filter-utils";

export function CoursesCatalogSidebar({
  basePath = "/courses",
  categories,
  filters,
}: {
  basePath?: string;
  categories: { name: string; slug: string }[];
  filters: CatalogFilters;
}): React.ReactElement {
  return (
    <CatalogFiltersPanel
      basePath={basePath}
      categories={categories}
      filters={filters}
    />
  );
}
