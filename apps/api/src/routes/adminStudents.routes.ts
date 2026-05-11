import { Router } from "express";

import * as adminStudentController from "../controllers/adminStudent.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  adminEnrollmentCreateBodySchema,
  adminStudentCreateBodySchema,
  adminStudentEnrollmentParamsSchema,
  adminStudentIdParamsSchema,
  adminStudentUpdateBodySchema,
  adminStudentsQuerySchema,
} from "@studyhouse/shared";

export const adminStudentsRouter = Router();

adminStudentsRouter.get(
  "/",
  validateQuery(adminStudentsQuerySchema),
  asyncHandler(adminStudentController.listStudentsAdmin),
);

adminStudentsRouter.post(
  "/",
  validateBody(adminStudentCreateBodySchema),
  asyncHandler(adminStudentController.createStudentAdmin),
);

adminStudentsRouter.post(
  "/:studentId/enrollments",
  validateParams(adminStudentIdParamsSchema),
  validateBody(adminEnrollmentCreateBodySchema),
  asyncHandler(adminStudentController.enrollStudentAdmin),
);

adminStudentsRouter.delete(
  "/:studentId/enrollments/:enrollmentId",
  validateParams(adminStudentEnrollmentParamsSchema),
  asyncHandler(adminStudentController.revokeStudentEnrollmentAdmin),
);

adminStudentsRouter.get(
  "/:studentId",
  validateParams(adminStudentIdParamsSchema),
  asyncHandler(adminStudentController.getStudentAdmin),
);

adminStudentsRouter.patch(
  "/:studentId",
  validateParams(adminStudentIdParamsSchema),
  validateBody(adminStudentUpdateBodySchema),
  asyncHandler(adminStudentController.patchStudentAdmin),
);
