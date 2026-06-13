import { Router } from "express";

import {
  deleteAdminReviewHandler,
  listAdminReviewsHandler,
  patchAdminReviewStatusHandler,
} from "../controllers/courseReview.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  adminReviewStatusPatchBodySchema,
  adminReviewsQuerySchema,
  courseReviewIdParamsSchema,
} from "@studyhouse/shared";

export const adminReviewsRouter = Router();

adminReviewsRouter.get(
  "/",
  validateQuery(adminReviewsQuerySchema),
  asyncHandler(listAdminReviewsHandler),
);

adminReviewsRouter.patch(
  "/:reviewId/status",
  validateParams(courseReviewIdParamsSchema),
  validateBody(adminReviewStatusPatchBodySchema),
  asyncHandler(patchAdminReviewStatusHandler),
);

adminReviewsRouter.delete(
  "/:reviewId",
  validateParams(courseReviewIdParamsSchema),
  asyncHandler(deleteAdminReviewHandler),
);
