import type { Request, Response } from "express";

import type {
  AdminReviewStatusPatchBody,
  CourseReviewCreateBody,
  CourseReviewPatchBody,
} from "@studyhouse/shared";
import {
  adminReviewsQuerySchema,
  courseReviewIdParamsSchema,
  courseSlugParamsSchema,
  publicCourseReviewsQuerySchema,
} from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import { writeAuditLog } from "../services/audit.service.js";
import {
  createStudentCourseReview,
  deleteAdminReview,
  deleteStudentCourseReview,
  getReviewForAudit,
  getStudentReviewForCourse,
  listAdminReviews,
  listPublishedReviewsForCourseSlug,
  patchAdminReviewStatus,
  patchStudentCourseReview,
} from "../services/courseReview.service.js";

function requireStudentId(req: Request): string {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  return auth.userId;
}

function requireAdminId(req: Request): string {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  return auth.userId;
}

export async function listPublicCourseReviews(
  req: Request,
  res: Response,
): Promise<void> {
  const { slug } = courseSlugParamsSchema.parse(req.params);
  const query = publicCourseReviewsQuerySchema.parse(
    req.validatedQuery ?? req.query,
  );

  const result = await listPublishedReviewsForCourseSlug(
    slug,
    query.page,
    query.pageSize,
  );

  res.status(200).json({
    success: true,
    data: {
      items: result.items,
      ratingSummary: result.ratingSummary,
    },
    meta: result.meta,
  });
}

export async function getStudentMyCourseReview(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { slug } = courseSlugParamsSchema.parse(req.params);
  const review = await getStudentReviewForCourse(studentId, slug);

  res.status(200).json({
    success: true,
    data: { review },
  });
}

export async function createStudentCourseReviewHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { slug } = courseSlugParamsSchema.parse(req.params);
  const body = req.body as CourseReviewCreateBody;

  const created = await createStudentCourseReview(studentId, slug, body);

  await writeAuditLog({
    actorId: studentId,
    action: "COURSE_REVIEW_CREATE",
    entityType: "CourseReview",
    entityId: created.id,
    afterJson: {
      rating: created.rating,
      title: created.title,
      status: created.status,
    },
    req,
  });

  res.status(201).json({
    success: true,
    data: created,
  });
}

export async function patchStudentCourseReviewHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { reviewId } = courseReviewIdParamsSchema.parse(req.params);
  const body = req.body as CourseReviewPatchBody;

  const before = await getReviewForAudit(reviewId);
  const updated = await patchStudentCourseReview(studentId, reviewId, body);

  await writeAuditLog({
    actorId: studentId,
    action: "COURSE_REVIEW_UPDATE",
    entityType: "CourseReview",
    entityId: reviewId,
    beforeJson: before
      ? {
          rating: before.rating,
          title: before.title,
          status: before.status,
        }
      : null,
    afterJson: {
      rating: updated.rating,
      title: updated.title,
      status: updated.status,
    },
    req,
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function deleteStudentCourseReviewHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { reviewId } = courseReviewIdParamsSchema.parse(req.params);

  const before = await getReviewForAudit(reviewId);
  await deleteStudentCourseReview(studentId, reviewId);

  await writeAuditLog({
    actorId: studentId,
    action: "COURSE_REVIEW_DELETE",
    entityType: "CourseReview",
    entityId: reviewId,
    beforeJson: before ?? null,
    req,
  });

  res.status(200).json({
    success: true,
    data: { deleted: true },
  });
}

export async function listAdminReviewsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const query = adminReviewsQuerySchema.parse(
    req.validatedQuery ?? req.query,
  );
  const result = await listAdminReviews(query);

  res.status(200).json({
    success: true,
    data: { items: result.items },
    meta: result.meta,
  });
}

export async function patchAdminReviewStatusHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const adminId = requireAdminId(req);
  const { reviewId } = courseReviewIdParamsSchema.parse(req.params);
  const body = req.body as AdminReviewStatusPatchBody;

  const before = await getReviewForAudit(reviewId);
  const updated = await patchAdminReviewStatus(reviewId, body.status);

  await writeAuditLog({
    actorId: adminId,
    action: "COURSE_REVIEW_STATUS_CHANGE",
    entityType: "CourseReview",
    entityId: reviewId,
    severity: body.status === "PUBLISHED" ? "INFO" : "WARNING",
    beforeJson: before ? { status: before.status } : null,
    afterJson: { status: updated.status },
    req,
  });

  res.status(200).json({
    success: true,
    data: updated,
  });
}

export async function deleteAdminReviewHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const adminId = requireAdminId(req);
  const { reviewId } = courseReviewIdParamsSchema.parse(req.params);

  const before = await getReviewForAudit(reviewId);
  const deleted = await deleteAdminReview(reviewId);

  await writeAuditLog({
    actorId: adminId,
    action: "COURSE_REVIEW_DELETE",
    entityType: "CourseReview",
    entityId: reviewId,
    severity: "WARNING",
    beforeJson: before ?? null,
    metadata: { courseId: deleted.courseId },
    req,
  });

  res.status(200).json({
    success: true,
    data: { deleted: true },
  });
}
