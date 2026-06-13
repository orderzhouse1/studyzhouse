import { Router } from "express";

import * as adminNotificationController from "../controllers/adminNotification.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateBody } from "../validators/validate.js";
import { adminSendNotificationBodySchema } from "@studyhouse/shared";

export const adminNotificationsRouter = Router();

adminNotificationsRouter.post(
  "/send",
  validateBody(adminSendNotificationBodySchema),
  asyncHandler(adminNotificationController.sendAdminNotificationHandler),
);
