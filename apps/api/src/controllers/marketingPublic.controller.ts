import type { Request, Response } from "express";

import { loadHomepageHeroStatsConfig } from "../lib/homepageHeroStatsConfig.js";
import {
  incrementHomepageVisitCount,
  resolveHomepageHeroStatsPublic,
} from "../services/homepageHeroMetrics.service.js";

export async function getHomepageHeroStatsPublic(
  _req: Request,
  res: Response,
): Promise<void> {
  const config = await loadHomepageHeroStatsConfig();
  const items = await resolveHomepageHeroStatsPublic(config);
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({ success: true, data: { items } });
}

export async function postHomepageVisit(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    await incrementHomepageVisitCount();
  } catch {
    // لا نكسر الواجهة عند فشل العدّاد
  }
  res.status(204).send();
}
