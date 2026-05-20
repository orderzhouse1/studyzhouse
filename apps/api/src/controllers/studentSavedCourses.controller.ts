import type { Request, Response } from "express";

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
  const items = await listSavedCoursesForStudent(studentId);
  res.status(200).json({ success: true, data: { items } });
}

export async function listStudentSavedCourseIds(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = req.auth!.userId;
  const courseIds = await listSavedCourseIdsForStudent(studentId);
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
