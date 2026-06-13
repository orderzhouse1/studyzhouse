import { Router } from "express";

import * as adminAnalyticsController from "../controllers/adminAnalytics.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateQuery } from "../validators/validate.js";
import { adminAnalyticsDateRangeQuerySchema } from "@studyhouse/shared";

export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.get(
  "/overview",
  asyncHandler(adminAnalyticsController.getAdminAnalyticsOverviewHandler),
);

adminAnalyticsRouter.get(
  "/courses",
  asyncHandler(adminAnalyticsController.getAdminAnalyticsCoursesHandler),
);

adminAnalyticsRouter.get(
  "/students",
  asyncHandler(adminAnalyticsController.getAdminAnalyticsStudentsHandler),
);

adminAnalyticsRouter.get(
  "/engagement",
  validateQuery(adminAnalyticsDateRangeQuerySchema),
  asyncHandler(adminAnalyticsController.getAdminAnalyticsEngagementHandler),
);
