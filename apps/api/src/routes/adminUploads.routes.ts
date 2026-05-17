import { Router } from "express";

import {
  courseThumbnailUploadBodySchema,
  lessonResourceUploadBodySchema,
} from "@studyhouse/shared";

import * as adminUploadController from "../controllers/adminUpload.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { validateBody } from "../validators/validate.js";

export const adminUploadsRouter = Router();

adminUploadsRouter.post(
  "/course-thumbnail",
  validateBody(courseThumbnailUploadBodySchema),
  asyncHandler(adminUploadController.uploadCourseThumbnailAdmin),
);

adminUploadsRouter.post(
  "/lesson-resource",
  validateBody(lessonResourceUploadBodySchema),
  asyncHandler(adminUploadController.uploadLessonResourceAdmin),
);
