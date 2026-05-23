import { Router } from "express";

import * as adminActivationCodeController from "../controllers/adminActivationCode.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  activationCodeIdParamsSchema,
  adminActivationCodeCreateBodySchema,
  adminActivationCodeUpdateBodySchema,
  adminActivationCodesQuerySchema,
  emptyBodySchema,
} from "@studyhouse/shared";

export const adminActivationCodesRouter = Router();

adminActivationCodesRouter.get(
  "/",
  validateQuery(adminActivationCodesQuerySchema),
  asyncHandler(adminActivationCodeController.listActivationCodesAdmin),
);

adminActivationCodesRouter.post(
  "/",
  validateBody(adminActivationCodeCreateBodySchema),
  asyncHandler(adminActivationCodeController.createActivationCodesAdmin),
);

adminActivationCodesRouter.post(
  "/:codeId/disable",
  validateParams(activationCodeIdParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(adminActivationCodeController.disableActivationCodeAdmin),
);

adminActivationCodesRouter.delete(
  "/:codeId",
  validateParams(activationCodeIdParamsSchema),
  asyncHandler(adminActivationCodeController.deleteActivationCodeAdmin),
);

adminActivationCodesRouter.get(
  "/:codeId",
  validateParams(activationCodeIdParamsSchema),
  asyncHandler(adminActivationCodeController.getActivationCodeAdmin),
);

adminActivationCodesRouter.patch(
  "/:codeId",
  validateParams(activationCodeIdParamsSchema),
  validateBody(adminActivationCodeUpdateBodySchema),
  asyncHandler(adminActivationCodeController.patchActivationCodeAdmin),
);
