import type { Request, Response } from "express";

import { isIosAppClient } from "../lib/clientPlatform.js";
import { isCourseVisibleOnIosCatalog } from "../lib/iosCourseAccess.js";
import { prisma } from "../lib/prisma.js";
import {
  listSavedCourseIdsForStudent,
  listSavedCoursesForStudent,
  saveCourseForStudent,
  unsaveCourseForStudent,
} from "../services/studentSavedCourse.service.js";

async function filterSavedCoursesForIosClient<T extends { courseId: string }>(
  items: T[],
): Promise<T[]> {
  if (items.length === 0) return items;
  const courses = await prisma.course.findMany({
    where: { id: { in: items.map((item) => item.courseId) } },
    select: {
      id: true,
      pricingType: true,
      iosPurchasable: true,
      appleProductId: true,
    },
  });
  const visibleIds = new Set(
    courses
      .filter((course) => isCourseVisibleOnIosCatalog(course))
      .map((course) => course.id),
  );
  return items.filter((item) => visibleIds.has(item.courseId));
}

export async function listStudentSavedCourses(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  let items = await listSavedCoursesForStudent(studentId);
  if (isIosAppClient(req)) {
    items = await filterSavedCoursesForIosClient(items);
  }
  res.status(200).json({ success: true, data: { items } });
}

export async function listStudentSavedCourseIds(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  let courseIds = await listSavedCourseIdsForStudent(studentId);
  if (isIosAppClient(req)) {
    const items = await listSavedCoursesForStudent(studentId);
    const filtered = await filterSavedCoursesForIosClient(items);
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
