import { Router } from "express";
import { mobilePushTokenRegisterBodySchema } from "@studyhouse/shared";

import * as mobilePushController from "../controllers/mobilePush.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateBody } from "../validators/validate.js";

export const mobilePushRouter = Router();

mobilePushRouter.post(
  "/push-tokens",
  validateBody(mobilePushTokenRegisterBodySchema),
  asyncHandler(mobilePushController.registerMobilePushToken),
);

mobilePushRouter.delete(
  "/push-tokens/:token",
  asyncHandler(mobilePushController.deleteMobilePushToken),
);

mobilePushRouter.post(
  "/push-test",
  asyncHandler(mobilePushController.sendMobilePushTest),
);
