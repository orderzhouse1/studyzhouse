import { Router } from "express";

import * as adminPaymentRequestController from "../controllers/adminPaymentRequest.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  adminPaymentRequestRejectBodySchema,
  adminPaymentRequestsQuerySchema,
  emptyBodySchema,
  paymentRequestIdParamsSchema,
} from "@studyhouse/shared";

export const adminPaymentRequestsRouter = Router();

adminPaymentRequestsRouter.get(
  "/",
  validateQuery(adminPaymentRequestsQuerySchema),
  asyncHandler(adminPaymentRequestController.listPaymentRequestsAdmin),
);

adminPaymentRequestsRouter.post(
  "/:paymentRequestId/approve",
  validateParams(paymentRequestIdParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(adminPaymentRequestController.approvePaymentRequestAdmin),
);

adminPaymentRequestsRouter.post(
  "/:paymentRequestId/reject",
  validateParams(paymentRequestIdParamsSchema),
  validateBody(adminPaymentRequestRejectBodySchema),
  asyncHandler(adminPaymentRequestController.rejectPaymentRequestAdmin),
);

adminPaymentRequestsRouter.get(
  "/:paymentRequestId",
  validateParams(paymentRequestIdParamsSchema),
  asyncHandler(adminPaymentRequestController.getPaymentRequestAdmin),
);
