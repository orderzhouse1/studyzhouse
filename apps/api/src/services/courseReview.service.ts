import type {
  CourseReviewCreateBody,
  CourseReviewPatchBody,
} from "@studyhouse/shared";
import {
  CourseReviewStatus,
  CourseStatus,
  EnrollmentStatus,
  type Prisma,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import {
  assertStudentEnrollmentForPublishedCourse,
} from "./studentLearning.service.js";

function mapPublicReview(row: {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  student: { fullName: string };
}) {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    student: { fullName: row.student.fullName },
  };
}

function mapStudentReview(row: {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: CourseReviewStatus;
  createdAt: Date;
  updatedAt: Date;
  student: { fullName: string };
}) {
  return {
    ...mapPublicReview(row),
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getCourseRatingSummary(courseId: string): Promise<{
  averageRating: number | null;
  reviewCount: number;
}> {
  const agg = await prisma.courseReview.aggregate({
    where: { courseId, status: CourseReviewStatus.PUBLISHED },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const count = agg._count._all;
  if (count === 0) {
    return { averageRating: null, reviewCount: 0 };
  }

  return {
    averageRating: agg._avg.rating
      ? Math.round(agg._avg.rating * 10) / 10
      : null,
    reviewCount: count,
  };
}

export async function getCourseRatingSummaries(
  courseIds: string[],
): Promise<Map<string, { averageRating: number | null; reviewCount: number }>> {
  if (courseIds.length === 0) return new Map();

  const rows = await prisma.courseReview.groupBy({
    by: ["courseId"],
    where: {
      courseId: { in: courseIds },
      status: CourseReviewStatus.PUBLISHED,
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const map = new Map<
    string,
    { averageRating: number | null; reviewCount: number }
  >();

  for (const row of rows) {
    map.set(row.courseId, {
      averageRating: row._avg.rating
        ? Math.round(row._avg.rating * 10) / 10
        : null,
      reviewCount: row._count._all,
    });
  }

  return map;
}

export async function listPublishedReviewsForCourseSlug(
  slug: string,
  page: number,
  pageSize: number,
): Promise<{
  items: ReturnType<typeof mapPublicReview>[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  ratingSummary: { averageRating: number | null; reviewCount: number };
}> {
  const course = await prisma.course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
    select: { id: true },
  });

  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }

  const where = {
    courseId: course.id,
    status: CourseReviewStatus.PUBLISHED,
  };

  const skip = (page - 1) * pageSize;
  const [total, rows, ratingSummary] = await Promise.all([
    prisma.courseReview.count({ where }),
    prisma.courseReview.findMany({
      where,
      include: {
        student: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    getCourseRatingSummary(course.id),
  ]);

  return {
    items: rows.map(mapPublicReview),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    ratingSummary,
  };
}

async function getPublishedCourseBySlug(slug: string): Promise<{ id: string }> {
  const course = await prisma.course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
    select: { id: true },
  });
  if (!course) {
    throw new AppError("NOT_FOUND", "الكورس غير موجود.", 404);
  }
  return course;
}

export async function getStudentReviewForCourse(
  studentId: string,
  slug: string,
): Promise<ReturnType<typeof mapStudentReview> | null> {
  const course = await getPublishedCourseBySlug(slug);

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });
  if (!enrollment) {
    throw new AppError(
      "FORBIDDEN",
      "يجب أن تكون مسجّلاً في الكورس لعرض تقييمك.",
      403,
    );
  }

  const row = await prisma.courseReview.findUnique({
    where: {
      studentId_courseId: { studentId, courseId: course.id },
    },
    include: { student: { select: { fullName: true } } },
  });

  return row ? mapStudentReview(row) : null;
}

export async function createStudentCourseReview(
  studentId: string,
  slug: string,
  body: CourseReviewCreateBody,
): Promise<ReturnType<typeof mapStudentReview>> {
  const course = await getPublishedCourseBySlug(slug);
  await assertStudentEnrollmentForPublishedCourse(studentId, course.id);

  const existing = await prisma.courseReview.findUnique({
    where: {
      studentId_courseId: { studentId, courseId: course.id },
    },
  });
  if (existing) {
    throw new AppError(
      "CONFLICT",
      "لديك تقييم لهذا الكورس بالفعل. يمكنك تعديله.",
      409,
    );
  }

  const created = await prisma.courseReview.create({
    data: {
      courseId: course.id,
      studentId,
      rating: body.rating,
      title: body.title?.trim() || null,
      comment: body.comment?.trim() || null,
      status: CourseReviewStatus.PENDING,
    },
    include: { student: { select: { fullName: true } } },
  });

  return mapStudentReview(created);
}

export async function patchStudentCourseReview(
  studentId: string,
  reviewId: string,
  body: CourseReviewPatchBody,
): Promise<ReturnType<typeof mapStudentReview>> {
  const existing = await prisma.courseReview.findFirst({
    where: { id: reviewId, studentId },
    include: { student: { select: { fullName: true } } },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "التقييم غير موجود.", 404);
  }

  const updated = await prisma.courseReview.update({
    where: { id: existing.id },
    data: {
      rating: body.rating,
      title:
        body.title === undefined ? undefined : body.title?.trim() || null,
      comment:
        body.comment === undefined ? undefined : body.comment?.trim() || null,
      status: CourseReviewStatus.PENDING,
    },
    include: { student: { select: { fullName: true } } },
  });

  return mapStudentReview(updated);
}

export async function deleteStudentCourseReview(
  studentId: string,
  reviewId: string,
): Promise<void> {
  const existing = await prisma.courseReview.findFirst({
    where: { id: reviewId, studentId },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "التقييم غير موجود.", 404);
  }
  await prisma.courseReview.delete({ where: { id: existing.id } });
}

export async function listAdminReviews(query: {
  page: number;
  pageSize: number;
  status?: CourseReviewStatus;
  courseId?: string;
  search?: string;
}): Promise<{
  items: Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    status: CourseReviewStatus;
    createdAt: string;
    updatedAt: string;
    course: { id: string; title: string; slug: string };
    student: { id: string; fullName: string; email: string };
  }>;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const where: Prisma.CourseReviewWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.courseId) where.courseId = query.courseId;
  if (query.search?.trim()) {
    const s = query.search.trim();
    where.OR = [
      { title: { contains: s, mode: "insensitive" } },
      { comment: { contains: s, mode: "insensitive" } },
      { student: { fullName: { contains: s, mode: "insensitive" } } },
      { student: { email: { contains: s, mode: "insensitive" } } },
      { course: { title: { contains: s, mode: "insensitive" } } },
    ];
  }

  const skip = (query.page - 1) * query.pageSize;
  const [total, rows] = await Promise.all([
    prisma.courseReview.count({ where }),
    prisma.courseReview.findMany({
      where,
      include: {
        course: { select: { id: true, title: true, slug: true } },
        student: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      course: r.course,
      student: r.student,
    })),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function patchAdminReviewStatus(
  reviewId: string,
  status: CourseReviewStatus,
): Promise<{
  id: string;
  status: CourseReviewStatus;
  courseId: string;
}> {
  const existing = await prisma.courseReview.findUnique({
    where: { id: reviewId },
    select: { id: true, status: true, courseId: true },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "التقييم غير موجود.", 404);
  }

  const updated = await prisma.courseReview.update({
    where: { id: reviewId },
    data: { status },
    select: { id: true, status: true, courseId: true },
  });

  return updated;
}

export async function deleteAdminReview(reviewId: string): Promise<{
  id: string;
  courseId: string;
}> {
  const existing = await prisma.courseReview.findUnique({
    where: { id: reviewId },
    select: { id: true, courseId: true },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "التقييم غير موجود.", 404);
  }
  await prisma.courseReview.delete({ where: { id: reviewId } });
  return existing;
}

export async function getReviewForAudit(reviewId: string) {
  return prisma.courseReview.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      status: true,
      courseId: true,
      studentId: true,
    },
  });
}
