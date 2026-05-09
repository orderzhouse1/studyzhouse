import { Router } from "express";

import * as courseController from "../controllers/course.controller.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  adminCoursesQuerySchema,
  courseCreateBodySchema,
  courseIdParamsSchema,
  courseUpdateBodySchema,
} from "@studyhouse/shared";

export const coursesAdminRouter = Router();

coursesAdminRouter.get(
  "/",
  validateQuery(adminCoursesQuerySchema),
  courseController.listCoursesAdmin,
);

coursesAdminRouter.post(
  "/",
  validateBody(courseCreateBodySchema),
  courseController.createCourseAdmin,
);

coursesAdminRouter.get(
  "/:id",
  validateParams(courseIdParamsSchema),
  courseController.getCourseAdmin,
);

coursesAdminRouter.patch(
  "/:id",
  validateParams(courseIdParamsSchema),
  validateBody(courseUpdateBodySchema),
  courseController.updateCourseAdmin,
);

coursesAdminRouter.post(
  "/:id/publish",
  validateParams(courseIdParamsSchema),
  courseController.publishCourseAdmin,
);

coursesAdminRouter.post(
  "/:id/archive",
  validateParams(courseIdParamsSchema),
  courseController.archiveCourseAdmin,
);
