import type { HomepageHeroStatConfigItem } from "@studyhouse/shared";

import { prisma } from "./prisma.js";

export const HOMEPAGE_HERO_STATS_KEY = "homepage_hero_stats";

export const DEFAULT_HOMEPAGE_HERO_STATS: HomepageHeroStatConfigItem[] = [
  {
    metricKey: "site_visits",
    label: "زيارات الموقع",
    visible: true,
    sortOrder: 0,
  },
  {
    metricKey: "registered_students",
    label: "الطلاب المسجلون",
    visible: true,
    sortOrder: 1,
  },
  {
    metricKey: "available_courses",
    label: "الكورسات المتاحة",
    visible: true,
    sortOrder: 2,
  },
];

function isConfigItem(v: unknown): v is HomepageHeroStatConfigItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    (o.metricKey === "site_visits" ||
      o.metricKey === "registered_students" ||
      o.metricKey === "available_courses") &&
    typeof o.label === "string" &&
    o.label.trim().length > 0 &&
    typeof o.visible === "boolean" &&
    typeof o.sortOrder === "number"
  );
}

export async function loadHomepageHeroStatsConfig(): Promise<
  HomepageHeroStatConfigItem[]
> {
  const row = await prisma.appSetting.findUnique({
    where: { key: HOMEPAGE_HERO_STATS_KEY },
  });
  if (!row?.valueJson || typeof row.valueJson !== "object") {
    return [...DEFAULT_HOMEPAGE_HERO_STATS];
  }
  const j = row.valueJson as Record<string, unknown>;
  if (!Array.isArray(j.items)) {
    return [...DEFAULT_HOMEPAGE_HERO_STATS];
  }
  const parsed = j.items.filter(isConfigItem);
  if (parsed.length === 0) {
    return [...DEFAULT_HOMEPAGE_HERO_STATS];
  }
  return parsed
    .map((item) => ({
      metricKey: item.metricKey,
      label: item.label.trim(),
      visible: item.visible,
      sortOrder: item.sortOrder,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
