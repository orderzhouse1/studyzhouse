export type CatalogFilters = {
  search?: string;
  categorySlug?: string;
  pricingType?: "FREE" | "PAID";
  sort?: string;
  /** معاينة لوحة الإدارة — خطوط أصغر داخل الكروت */
  adminPreview?: boolean;
};

export function buildCoursesHref(
  basePath: string,
  base: CatalogFilters,
  patch: {
    categorySlug?: string | null;
    pricingType?: "FREE" | "PAID" | null;
  } = {},
): string {
  const categorySlug =
    patch.categorySlug !== undefined
      ? (patch.categorySlug ?? undefined)
      : base.categorySlug;
  const pricingType =
    patch.pricingType !== undefined
      ? (patch.pricingType ?? undefined)
      : base.pricingType;

  const qs = new URLSearchParams();
  if (base.search?.trim()) qs.set("search", base.search.trim());
  if (categorySlug?.trim()) qs.set("categorySlug", categorySlug.trim());
  if (pricingType) qs.set("pricingType", pricingType);
  if (base.sort && base.sort !== "newest") qs.set("sort", base.sort);
  if (base.adminPreview) qs.set("adminPreview", "1");
  const q = qs.toString();
  return q ? `${basePath}?${q}` : basePath;
}
