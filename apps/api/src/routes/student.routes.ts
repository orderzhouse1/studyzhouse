import { Router } from "express";

import * as studentActivationRedeemController from "../controllers/studentActivationRedeem.controller.js";
import * as studentController from "../controllers/student.controller.js";
import * as studentPaymentRequestController from "../controllers/studentPaymentRequest.controller.js";
import { activationRedeemRateLimiter } from "../middlewares/activationRedeemRateLimiter.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../validators/validate.js";
import {
  emptyBodySchema,
  lessonIdParamsSchema,
  lessonProgressBodySchema,
  studentActivationRedeemBodySchema,
  studentCourseSlugParamsSchema,
  studentLearnQuerySchema,
  studentPaymentRequestCreateBodySchema,
} from "@studyhouse/shared";

export const studentRouter = Router();

studentRouter.post(
  "/activation-codes/redeem",
  activationRedeemRateLimiter,
  validateBody(studentActivationRedeemBodySchema),
  asyncHandler(studentActivationRedeemController.redeemActivationCodeStudent),
);

studentRouter.get(
  "/payment-info",
  asyncHandler(studentPaymentRequestController.getStudentPaymentInfo),
);

studentRouter.post(
  "/payment-requests",
  validateBody(studentPaymentRequestCreateBodySchema),
  asyncHandler(studentPaymentRequestController.createPaymentRequestStudent),
);

studentRouter.get(
  "/payment-requests",
  asyncHandler(studentPaymentRequestController.listPaymentRequestsStudent),
);

studentRouter.get(
  "/dashboard",
  asyncHandler(studentController.getStudentDashboard),
);

studentRouter.get(
  "/my-courses",
  asyncHandler(studentController.getStudentMyCourses),
);

studentRouter.get(
  "/courses/:courseSlug/access",
  validateParams(studentCourseSlugParamsSchema),
  asyncHandler(studentController.getStudentCourseAccess),
);

studentRouter.post(
  "/courses/:courseSlug/enroll",
  validateParams(studentCourseSlugParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(studentController.enrollStudentInFreeCourse),
);

studentRouter.get(
  "/courses/:courseSlug/learn",
  validateParams(studentCourseSlugParamsSchema),
  validateQuery(studentLearnQuerySchema),
  asyncHandler(studentController.getStudentCourseLearn),
);

studentRouter.post(
  "/lessons/:lessonId/progress",
  validateParams(lessonIdParamsSchema),
  validateBody(lessonProgressBodySchema),
  asyncHandler(studentController.postStudentLessonProgress),
);

studentRouter.post(
  "/lessons/:lessonId/complete",
  validateParams(lessonIdParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(studentController.postStudentLessonComplete),
);
