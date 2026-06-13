import { Router } from "express";

import * as courseController from "../controllers/course.controller.js";
import * as courseReviewController from "../controllers/courseReview.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateParams, validateQuery } from "../validators/validate.js";
import {
  courseSlugParamsSchema,
  publicCourseReviewsQuerySchema,
  publicCoursesQuerySchema,
} from "@studyhouse/shared";

export const coursesPublicRouter = Router();

coursesPublicRouter.get(
  "/",
  validateQuery(publicCoursesQuerySchema),
  asyncHandler(courseController.listCoursesPublic),
);

coursesPublicRouter.get(
  "/:slug/reviews",
  validateParams(courseSlugParamsSchema),
  validateQuery(publicCourseReviewsQuerySchema),
  asyncHandler(courseReviewController.listPublicCourseReviews),
);

coursesPublicRouter.get(
  "/:slug",
  validateParams(courseSlugParamsSchema),
  asyncHandler(courseController.getCourseBySlugPublic),
);
