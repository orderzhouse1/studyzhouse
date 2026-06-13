import type { Request, Response } from "express";

import { studentRecommendationsQuerySchema } from "@studyhouse/shared";
import { studentRecommendationDismissParamsSchema } from "@studyhouse/shared";

import { AppError } from "../lib/AppError.js";
import {
  dismissRecommendationForStudent,
  listRecommendationsForStudent,
} from "../services/studentRecommendations.service.js";

function requireStudentId(req: Request): string {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  return auth.userId;
}

export async function listStudentRecommendations(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const query = studentRecommendationsQuerySchema.parse(
    req.validatedQuery ?? req.query,
  );

  const items = await listRecommendationsForStudent(studentId, query.limit);

  res.status(200).json({
    success: true,
    data: { items },
  });
}

export async function dismissStudentRecommendation(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = requireStudentId(req);
  const { courseId } = studentRecommendationDismissParamsSchema.parse(
    req.params,
  );

  const result = await dismissRecommendationForStudent(studentId, courseId);

  res.status(200).json({
    success: true,
    data: result,
  });
}
