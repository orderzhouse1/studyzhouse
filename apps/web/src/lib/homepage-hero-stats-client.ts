import type { HomepageHeroStatPublicItem } from "@studyhouse/shared";

export const HERO_STATS_REFRESH_EVENT = "studyhouse:hero-stats-refresh";

type HeroStatsResponse = {
  success: true;
  data: { items: HomepageHeroStatPublicItem[] };
};

let inflight: Promise<HomepageHeroStatPublicItem[]> | null = null;

/** جلب حيّ للإحصائيات — يتجاوز كاش الصفحة (ISR). */
export async function fetchHomepageHeroStatsLive(): Promise<
  HomepageHeroStatPublicItem[]
> {
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch("/api/v1/marketing/homepage-hero-stats", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as HeroStatsResponse;
    return Array.isArray(json.data?.items) ? json.data.items : [];
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function requestHeroStatsRefresh(): void {
  window.dispatchEvent(new CustomEvent(HERO_STATS_REFRESH_EVENT));
}
