import type { CourseCardCourse } from "@/components/courses/course-card";
import type { PopularCategoryColumn } from "@/components/marketing/popular-by-category";
import { SiteHeader } from "@/components/layout/site-header";
import { HomeMobileCategoryChips } from "@/components/marketing/mobile/home-mobile-category-chips";
import { HomeMobileFaq } from "@/components/marketing/mobile/home-mobile-faq";
import { HomeMobileFeaturedCarousel } from "@/components/marketing/mobile/home-mobile-featured-carousel";
import { HomeMobileFooter } from "@/components/marketing/mobile/home-mobile-footer";
import { HomeMobileHero } from "@/components/marketing/mobile/home-mobile-hero";
import { HomeMobileLatestList } from "@/components/marketing/mobile/home-mobile-latest-list";
import {
  HomeMobilePopularSection,
  HomeMobileQuickCta,
} from "@/components/marketing/mobile/home-mobile-popular-section";

export type HomePageMobileProps = {
  featured: CourseCardCourse[];
  categories: { name: string; slug: string }[];
  popularColumns: PopularCategoryColumn[];
  showFeaturedLink: boolean;
};

/**
 * الصفحة الرئيسية — نسخة الجوال فقط (أقل من md).
 * تصميم تطبيقي منفصل عن سطح المكتب: بطاقات وتمرير أفقي.
 */
export function HomePageMobile({
  featured,
  categories,
  popularColumns,
  showFeaturedLink,
}: HomePageMobileProps): React.ReactElement {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[hsl(215_22%_97%)] md:hidden">
      <SiteHeader showFeaturedLink={showFeaturedLink} />

      <HomeMobileHero />

      <main className="flex flex-col gap-6 px-4 pt-2">
        {featured.length > 0 ? (
          <HomeMobileFeaturedCarousel courses={featured} />
        ) : null}

        <HomeMobileQuickCta />

        {categories.length > 0 ? (
          <HomeMobileCategoryChips categories={categories} />
        ) : null}

        {popularColumns.length > 0 ? (
          <HomeMobilePopularSection columns={popularColumns} />
        ) : null}

        {featured.length > 0 ? (
          <HomeMobileLatestList courses={featured} />
        ) : null}

        <HomeMobileFaq />
      </main>

      <HomeMobileFooter
        showFeaturedLink={showFeaturedLink}
        showFaqLink
      />
    </div>
  );
}
