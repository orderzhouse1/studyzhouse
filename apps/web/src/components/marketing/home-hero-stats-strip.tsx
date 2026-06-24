import type { HomepageHeroMetricKey, HomepageHeroStatPublicItem } from "@studyhouse/shared";
import { BookOpen, Globe2, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const arNumber = new Intl.NumberFormat("ar");

const METRIC_META: Record<
  HomepageHeroMetricKey,
  { icon: LucideIcon; hint: string }
> = {
  site_visits: {
    icon: Globe2,
    hint: "إجمالي الزيارات المسجّلة",
  },
  registered_students: {
    icon: Users,
    hint: "طلاب نشطون على المنصّة",
  },
  available_courses: {
    icon: BookOpen,
    hint: "كورسات منشورة للجميع",
  },
};

export type HomeHeroStatsStripProps = {
  stats: HomepageHeroStatPublicItem[];
  className?: string;
};

/**
 * شريط إحصائيات أفقي — فواصل عمودية فقط، بدون بطاقات منفصلة.
 */
export function HomeHeroStatsStrip({
  stats,
  className,
}: HomeHeroStatsStripProps): React.ReactElement | null {
  if (stats.length === 0) return null;

  return (
    <div
      className={cn(
        "w-full rounded-xl bg-white/[0.05] py-2.5 sm:py-3",
        className,
      )}
      role="list"
      aria-label="إحصائيات المنصّة"
    >
      <div className="flex w-full items-stretch">
        {stats.map((stat, index) => {
          const meta = METRIC_META[stat.metricKey];
          const Icon = meta.icon;

          return (
            <div
              key={stat.metricKey}
              role="listitem"
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-2 text-center sm:gap-1 sm:px-3",
                index > 0 && "border-inline-start border-white/15",
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="truncate text-[10px] font-medium leading-tight text-white/60 sm:text-[11px]">
                  {stat.label}
                </span>
                <Icon
                  className="h-3 w-3 shrink-0 text-primary/90 sm:h-3.5 sm:w-3.5"
                  aria-hidden
                />
              </div>
              <p className="text-lg font-bold tabular-nums leading-none text-white sm:text-2xl">
                {arNumber.format(stat.value)}
              </p>
              <p className="hidden max-w-[9rem] truncate text-[9px] leading-tight text-primary/85 sm:block sm:max-w-none sm:text-[10px]">
                {meta.hint}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
