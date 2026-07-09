import type { Request, Response } from "express";

import { isIosAppClient } from "../lib/clientPlatform.js";
import {
  listSavedCourseIdsForStudent,
  listSavedCoursesForStudent,
  saveCourseForStudent,
  unsaveCourseForStudent,
} from "../services/studentSavedCourse.service.js";

export async function listStudentSavedCourses(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  let items = await listSavedCoursesForStudent(studentId);
  if (isIosAppClient(req)) {
    items = items.filter((item) => item.course.pricingType === "FREE");
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
    const freeIds = new Set(
      items
        .filter((item) => item.course.pricingType === "FREE")
        .map((item) => item.courseId),
    );
    courseIds = courseIds.filter((id) => freeIds.has(id));
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
