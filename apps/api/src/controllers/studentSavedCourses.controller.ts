import type { Request, Response } from "express";
import { EnrollmentStatus } from "@prisma/client";

import { isMobileReaderClient } from "../lib/clientPlatform.js";
import { prisma } from "../lib/prisma.js";
import {
  listSavedCourseIdsForStudent,
  listSavedCoursesForStudent,
  saveCourseForStudent,
  unsaveCourseForStudent,
} from "../services/studentSavedCourse.service.js";

/** Mobile reader: only saved courses the student is enrolled in. */
async function filterSavedCoursesForMobileReader<
  T extends { courseId: string },
>(studentId: string, items: T[]): Promise<T[]> {
  if (items.length === 0) return items;
  const courseIds = items.map((item) => item.courseId);
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      courseId: { in: courseIds },
      status: EnrollmentStatus.ACTIVE,
    },
    select: { courseId: true },
  });
  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  return items.filter((item) => enrolledIds.has(item.courseId));
}

export async function listStudentSavedCourses(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  let items = await listSavedCoursesForStudent(studentId);
  if (isMobileReaderClient(req)) {
    items = await filterSavedCoursesForMobileReader(studentId, items);
  }
  res.status(200).json({ success: true, data: { items } });
}

export async function listStudentSavedCourseIds(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  let courseIds = await listSavedCourseIdsForStudent(studentId);
  if (isMobileReaderClient(req)) {
    const items = await listSavedCoursesForStudent(studentId);
    const filtered = await filterSavedCoursesForMobileReader(studentId, items);
    courseIds = filtered.map((item) => item.courseId);
  }
  res.status(200).json({ success: true, data: { courseIds } });
}

export async function saveStudentCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const { courseId } = req.validatedParams as { courseId: string };
  const out = await saveCourseForStudent(studentId, courseId);
  res.status(200).json({ success: true, data: out });
}

export async function unsaveStudentCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const { courseId } = req.validatedParams as { courseId: string };
  await unsaveCourseForStudent(studentId, courseId);
  res.status(200).json({ success: true, data: { saved: false } });
}
