import { Router } from "express";

import * as marketingPublicController from "../controllers/marketingPublic.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const marketingPublicRouter = Router();

marketingPublicRouter.get(
  "/homepage-hero-stats",
  asyncHandler(marketingPublicController.getHomepageHeroStatsPublic),
);

marketingPublicRouter.post(
  "/homepage-visit",
  asyncHandler(marketingPublicController.postHomepageVisit),
);
