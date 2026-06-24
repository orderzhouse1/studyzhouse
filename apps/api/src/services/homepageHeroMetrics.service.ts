import {
  CourseStatus,
  UserRole,
  UserStatus,
  type Prisma,
} from "@prisma/client";

import type {
  HomepageHeroMetricKey,
  HomepageHeroStatConfigItem,
  HomepageHeroStatPublicItem,
} from "@studyhouse/shared";

import { prisma } from "../lib/prisma.js";

export const HOMEPAGE_VISIT_COUNTER_KEY = "homepage_visits";

const STUDENT_WHERE: Prisma.UserWhereInput = {
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

function bigintToSafeNumber(value: bigint): number {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return n;
}

export async function resolveHomepageHeroMetricValue(
  metricKey: HomepageHeroMetricKey,
): Promise<number> {
  switch (metricKey) {
    case "site_visits": {
      const row = await prisma.metricCounter.findUnique({
        where: { key: HOMEPAGE_VISIT_COUNTER_KEY },
      });
      return row ? bigintToSafeNumber(row.count) : 0;
    }
    case "registered_students":
      return prisma.user.count({ where: STUDENT_WHERE });
    case "available_courses":
      return prisma.course.count({
        where: { status: CourseStatus.PUBLISHED },
      });
    default:
      return 0;
  }
}

export async function resolveHomepageHeroStatsPublic(
  items: HomepageHeroStatConfigItem[],
): Promise<HomepageHeroStatPublicItem[]> {
  const visible = items
    .filter((item) => item.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const resolved = await Promise.all(
    visible.map(async (item) => {
      try {
        const value = await resolveHomepageHeroMetricValue(item.metricKey);
        return {
          metricKey: item.metricKey,
          label: item.label,
          value,
        };
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((item): item is HomepageHeroStatPublicItem => item !== null);
}

export async function resolveHomepageHeroStatsAdmin(
  items: HomepageHeroStatConfigItem[],
): Promise<
  Array<HomepageHeroStatConfigItem & { value: number }>
> {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  return Promise.all(
    sorted.map(async (item) => {
      try {
        const value = await resolveHomepageHeroMetricValue(item.metricKey);
        return { ...item, value };
      } catch {
        return { ...item, value: 0 };
      }
    }),
  );
}

/** زيادة آمنة لعداد زيارات الصفحة الرئيسية — صف واحد مجمّع. */
export async function incrementHomepageVisitCount(): Promise<void> {
  await prisma.metricCounter.upsert({
    where: { key: HOMEPAGE_VISIT_COUNTER_KEY },
    create: { key: HOMEPAGE_VISIT_COUNTER_KEY, count: 1 },
    update: { count: { increment: 1 } },
  });
}
