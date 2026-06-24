import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";

import type { HomepageHeroStatsPatchBody } from "@studyhouse/shared";

import {
  HOMEPAGE_HERO_STATS_KEY,
  loadHomepageHeroStatsConfig,
} from "../lib/homepageHeroStatsConfig.js";
import { prisma } from "../lib/prisma.js";
import { resolveHomepageHeroStatsAdmin } from "../services/homepageHeroMetrics.service.js";
import { writeAuditLog } from "../services/audit.service.js";

export async function getAdminHomepageHeroStats(
  _req: Request,
  res: Response,
): Promise<void> {
  const config = await loadHomepageHeroStatsConfig();
  const items = await resolveHomepageHeroStatsAdmin(config);
  res.status(200).json({ success: true, data: { items } });
}

export async function patchAdminHomepageHeroStats(
  req: Request,
  res: Response,
): Promise<void> {
  const actorId = req.auth!.userId;
  const body = req.body as HomepageHeroStatsPatchBody;
  const before = await loadHomepageHeroStatsConfig();

  const nextItems = [...body.items].sort((a, b) => a.sortOrder - b.sortOrder);

  await prisma.appSetting.upsert({
    where: { key: HOMEPAGE_HERO_STATS_KEY },
    create: {
      key: HOMEPAGE_HERO_STATS_KEY,
      valueJson: { items: nextItems } as Prisma.InputJsonValue,
    },
    update: {
      valueJson: { items: nextItems } as Prisma.InputJsonValue,
    },
  });

  await writeAuditLog({
    actorId,
    action: "HOMEPAGE_HERO_STATS_UPDATED",
    entityType: "AppSetting",
    entityId: HOMEPAGE_HERO_STATS_KEY,
    metadata: { itemCount: nextItems.length },
    beforeJson: { items: before },
    afterJson: { items: nextItems },
    req,
  });

  const items = await resolveHomepageHeroStatsAdmin(nextItems);
  res.status(200).json({ success: true, data: { items } });
}
