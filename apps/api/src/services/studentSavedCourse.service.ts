import {
  CourseStatus,
  EnrollmentStatus,
  type CourseLevel,
} from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { prisma } from "../lib/prisma.js";
import { decimalToString } from "../lib/courseMapper.js";
import type { StudentSavedCourseItem } from "@studyhouse/shared";

function learnUrl(slug: string): string {
  return `/learn/${slug}`;
}

function mapSavedRow(row: {
  id: string;
  courseId: string;
  createdAt: Date;
  course: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string | null;
    pricingType: "FREE" | "PAID";
    price: import("@prisma/client").Prisma.Decimal | null;
    currency: string;
    level: CourseLevel;
    category: { id: string; name: string; slug: string } | null;
  };
  enrollment: { status: EnrollmentStatus } | null;
}): StudentSavedCourseItem {
  const active =
    row.enrollment?.status === EnrollmentStatus.ACTIVE;
  return {
    id: row.id,
    courseId: row.courseId,
    savedAt: row.createdAt.toISOString(),
    course: {
      id: row.course.id,
      title: row.course.title,
      slug: row.course.slug,
      thumbnailUrl: row.course.coverImageUrl,
      pricingType: row.course.pricingType,
      priceAmount: decimalToString(row.course.price),
      currency: row.course.currency,
      level: row.course.level,
      category: row.course.category,
    },
    isEnrolled: Boolean(row.enrollment),
    canLearn: active,
    learnUrl: active ? learnUrl(row.course.slug) : null,
  };
}

export async function listSavedCoursesForStudent(
  studentId: string,
): Promise<StudentSavedCourseItem[]> {
  const rows = await prisma.studentSavedCourse.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      course: { include: { category: true } },
    },
  });

  const courseIds = rows.map((r) => r.courseId);
  const enrollments =
    courseIds.length === 0
      ? []
      : await prisma.enrollment.findMany({
          where: { studentId, courseId: { in: courseIds } },
          select: { courseId: true, status: true },
        });
  const enrollByCourse = new Map(
    enrollments.map((e) => [e.courseId, e]),
  );

  return rows.map((row) =>
    mapSavedRow({
      ...row,
      enrollment: enrollByCourse.get(row.courseId) ?? null,
    }),
  );
}

export async function listSavedCourseIdsForStudent(
  studentId: string,
): Promise<string[]> {
  const rows = await prisma.studentSavedCourse.findMany({
    where: { studentId },
    select: { courseId: true },
  });
  return rows.map((r) => r.courseId);
}

export async function saveCourseForStudent(
  studentId: string,
  courseId: string,
): Promise<{ saved: boolean }> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: CourseStatus.PUBLISHED },
    select: { id: true },
  });
  if (!course) {
    throw new AppError(
      "NOT_FOUND",
      "الكورس غير موجود أو غير منشور.",
      404,
    );
  }

  await prisma.studentSavedCourse.upsert({
    where: {
      studentId_courseId: { studentId, courseId: course.id },
    },
    create: { studentId, courseId: course.id },
    update: {},
  });

  return { saved: true };
}

export async function unsaveCourseForStudent(
  studentId: string,
  courseId: string,
): Promise<void> {
  await prisma.studentSavedCourse.deleteMany({
    where: { studentId, courseId },
  });
}
