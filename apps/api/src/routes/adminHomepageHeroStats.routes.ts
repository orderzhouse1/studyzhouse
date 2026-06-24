import { Router } from "express";

import * as adminHomepageHeroStatsController from "../controllers/adminHomepageHeroStats.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateBody } from "../validators/validate.js";
import { homepageHeroStatsPatchBodySchema } from "@studyhouse/shared";

export const adminHomepageHeroStatsRouter = Router();

adminHomepageHeroStatsRouter.get(
  "/",
  asyncHandler(adminHomepageHeroStatsController.getAdminHomepageHeroStats),
);

adminHomepageHeroStatsRouter.patch(
  "/",
  validateBody(homepageHeroStatsPatchBodySchema),
  asyncHandler(adminHomepageHeroStatsController.patchAdminHomepageHeroStats),
);
