import { Router } from "express";

import * as studentActivationRedeemController from "../controllers/studentActivationRedeem.controller.js";
import * as studentController from "../controllers/student.controller.js";
import * as studentPaymentRequestController from "../controllers/studentPaymentRequest.controller.js";
import * as studentProfileController from "../controllers/studentProfile.controller.js";
import * as studentNotificationsController from "../controllers/studentNotifications.controller.js";
import * as studentPurchasesController from "../controllers/studentPurchases.controller.js";
import * as studentSavedCoursesController from "../controllers/studentSavedCourses.controller.js";
import * as lessonNoteController from "../controllers/lessonNote.controller.js";
import * as courseReviewController from "../controllers/courseReview.controller.js";
import * as studentRecommendationsController from "../controllers/studentRecommendations.controller.js";
import * as studentWebPushController from "../controllers/studentWebPush.controller.js";
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
  lessonNoteCreateBodySchema,
  lessonNoteIdParamsSchema,
  lessonNotePatchBodySchema,
  lessonProgressBodySchema,
  courseReviewCreateBodySchema,
  courseReviewIdParamsSchema,
  courseReviewPatchBodySchema,
  courseSlugParamsSchema,
  studentActivationRedeemBodySchema,
  studentCourseSlugParamsSchema,
  studentLearnQuerySchema,
  studentPaymentRequestCreateBodySchema,
  studentOnboardingCompleteBodySchema,
  studentOnboardingSkipBodySchema,
  studentProfilePatchBodySchema,
  studentNotificationsQuerySchema,
  notificationIdParamsSchema,
  studentSavedCourseParamsSchema,
  studentRecommendationsQuerySchema,
  studentRecommendationDismissParamsSchema,
  webPushSubscribeBodySchema,
  webPushUnsubscribeBodySchema,
} from "@studyhouse/shared";

export const studentRouter = Router();

studentRouter.get(
  "/profile",
  asyncHandler(studentProfileController.getStudentProfile),
);

studentRouter.patch(
  "/profile",
  validateBody(studentProfilePatchBodySchema),
  asyncHandler(studentProfileController.patchStudentProfile),
);

studentRouter.post(
  "/onboarding/complete",
  validateBody(studentOnboardingCompleteBodySchema),
  asyncHandler(studentProfileController.completeStudentOnboardingHandler),
);

studentRouter.post(
  "/onboarding/skip",
  validateBody(studentOnboardingSkipBodySchema),
  asyncHandler(studentProfileController.skipStudentOnboardingHandler),
);

studentRouter.get(
  "/purchases",
  asyncHandler(studentPurchasesController.listStudentPurchases),
);

studentRouter.get(
  "/notifications",
  validateQuery(studentNotificationsQuerySchema),
  asyncHandler(studentNotificationsController.listStudentNotifications),
);

studentRouter.get(
  "/notifications/unread-count",
  asyncHandler(
    studentNotificationsController.getStudentNotificationsUnreadCount,
  ),
);

studentRouter.post(
  "/notifications/read-all",
  validateBody(emptyBodySchema),
  asyncHandler(
    studentNotificationsController.markAllStudentNotificationsRead,
  ),
);

studentRouter.post(
  "/notifications/:notificationId/read",
  validateParams(notificationIdParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(studentNotificationsController.markStudentNotificationRead),
);

studentRouter.get(
  "/saved-courses",
  asyncHandler(studentSavedCoursesController.listStudentSavedCourses),
);

studentRouter.get(
  "/saved-courses/ids",
  asyncHandler(studentSavedCoursesController.listStudentSavedCourseIds),
);

studentRouter.post(
  "/courses/:courseId/save",
  validateParams(studentSavedCourseParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(studentSavedCoursesController.saveStudentCourse),
);

studentRouter.delete(
  "/courses/:courseId/save",
  validateParams(studentSavedCourseParamsSchema),
  asyncHandler(studentSavedCoursesController.unsaveStudentCourse),
);

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

studentRouter.get(
  "/lessons/:lessonId/notes",
  validateParams(lessonIdParamsSchema),
  asyncHandler(lessonNoteController.listLessonNotesStudent),
);

studentRouter.post(
  "/lessons/:lessonId/notes",
  validateParams(lessonIdParamsSchema),
  validateBody(lessonNoteCreateBodySchema),
  asyncHandler(lessonNoteController.createLessonNoteStudent),
);

studentRouter.patch(
  "/lesson-notes/:noteId",
  validateParams(lessonNoteIdParamsSchema),
  validateBody(lessonNotePatchBodySchema),
  asyncHandler(lessonNoteController.patchLessonNoteStudent),
);

studentRouter.delete(
  "/lesson-notes/:noteId",
  validateParams(lessonNoteIdParamsSchema),
  asyncHandler(lessonNoteController.deleteLessonNoteStudent),
);

studentRouter.get(
  "/courses/:slug/my-review",
  validateParams(courseSlugParamsSchema),
  asyncHandler(courseReviewController.getStudentMyCourseReview),
);

studentRouter.post(
  "/courses/:slug/reviews",
  validateParams(courseSlugParamsSchema),
  validateBody(courseReviewCreateBodySchema),
  asyncHandler(courseReviewController.createStudentCourseReviewHandler),
);

studentRouter.patch(
  "/course-reviews/:reviewId",
  validateParams(courseReviewIdParamsSchema),
  validateBody(courseReviewPatchBodySchema),
  asyncHandler(courseReviewController.patchStudentCourseReviewHandler),
);

studentRouter.delete(
  "/course-reviews/:reviewId",
  validateParams(courseReviewIdParamsSchema),
  asyncHandler(courseReviewController.deleteStudentCourseReviewHandler),
);

studentRouter.get(
  "/recommendations",
  validateQuery(studentRecommendationsQuerySchema),
  asyncHandler(studentRecommendationsController.listStudentRecommendations),
);

studentRouter.post(
  "/recommendations/:courseId/dismiss",
  validateParams(studentRecommendationDismissParamsSchema),
  validateBody(emptyBodySchema),
  asyncHandler(studentRecommendationsController.dismissStudentRecommendation),
);

studentRouter.get(
  "/web-push/public-key",
  asyncHandler(studentWebPushController.getStudentWebPushPublicKey),
);

studentRouter.post(
  "/web-push/subscribe",
  validateBody(webPushSubscribeBodySchema),
  asyncHandler(studentWebPushController.subscribeStudentWebPush),
);

studentRouter.delete(
  "/web-push/unsubscribe",
  validateBody(webPushUnsubscribeBodySchema),
  asyncHandler(studentWebPushController.unsubscribeStudentWebPush),
);
