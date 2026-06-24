"use client";

import type { HomepageHeroStatPublicItem } from "@studyhouse/shared";
import { useCallback, useEffect, useState } from "react";

import { HomeHeroStatsStrip } from "@/components/marketing/home-hero-stats-strip";
import {
  HERO_STATS_REFRESH_EVENT,
  fetchHomepageHeroStatsLive,
} from "@/lib/homepage-hero-stats-client";
import { cn } from "@/lib/utils";

export type HomeHeroStatsLiveProps = {
  initialStats: HomepageHeroStatPublicItem[];
  className?: string;
};

/**
 * يعرض إحصائيات الهيرو ويحدّثها من API مباشرة (بدون انتظار إعادة توليد ISR).
 */
export function HomeHeroStatsLive({
  initialStats,
  className,
}: HomeHeroStatsLiveProps): React.ReactElement | null {
  const [stats, setStats] = useState(initialStats);

  const refresh = useCallback(async (): Promise<void> => {
    const items = await fetchHomepageHeroStatsLive();
    if (items.length > 0) {
      setStats(items);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = (): void => {
      void refresh();
    };
    window.addEventListener(HERO_STATS_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(HERO_STATS_REFRESH_EVENT, onRefresh);
  }, [refresh]);

  return <HomeHeroStatsStrip stats={stats} className={cn(className)} />;
}
