import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  Code2,
  Globe2,
  Laptop,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Sprout,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

function categoryChipIcon(slug: string, name: string): LucideIcon {
  const hay = `${slug} ${name}`.toLowerCase();
  if (/ذكاء|اصطناع|ai\b/.test(hay)) return Sparkles;
  if (/بيانات|data/.test(hay)) return BarChart3;
  if (/حاسوب|برمج|code|dev/.test(hay)) return Code2;
  if (/تقنية|معلومات|it\b|tech/.test(hay)) return Laptop;
  if (/أعمال|business|إدارة|مالية/.test(hay)) return Briefcase;
  if (/شخصي|تطوير|skills|مهارات/.test(hay)) return Sprout;
  if (/صح|طبي|health|رعاية/.test(hay)) return ShieldCheck;
  if (/لغة|lang|english|عربي/.test(hay)) return Globe2;
  return LayoutGrid;
}

export function HomeMobileCategoryChips({
  categories,
  activeSlug,
}: {
  categories: { name: string; slug: string }[];
  activeSlug?: string | null;
}): React.ReactElement | null {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="mobile-categories-heading">
      <h2
        id="mobile-categories-heading"
        className="mb-3 text-base font-bold text-heading"
      >
        التصنيفات
      </h2>

      <div className="home-mobile-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href="/courses"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95",
            !activeSlug
              ? "bg-primary text-primary-foreground shadow-brand"
              : "border border-border/90 bg-card text-heading",
          )}
        >
          <LayoutGrid className="h-4 w-4" aria-hidden />
          الكل
        </Link>

        {categories.map((category) => {
          const Icon = categoryChipIcon(category.slug, category.name);
          const active = activeSlug === category.slug;

          return (
            <Link
              key={category.slug}
              href={`/courses?categorySlug=${encodeURIComponent(category.slug)}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95",
                active
                  ? "bg-primary text-primary-foreground shadow-brand"
                  : "border border-border/90 bg-card text-heading",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {category.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
