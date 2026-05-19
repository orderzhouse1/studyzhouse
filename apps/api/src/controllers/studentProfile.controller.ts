import type { Request, Response } from "express";

import { AppError } from "../lib/AppError.js";
import {
  completeStudentOnboarding,
  getStudentProfilePageForUser,
  patchStudentProfileForUser,
  skipStudentOnboarding,
} from "../services/studentProfile.service.js";
import type {
  StudentOnboardingCompleteBody,
  StudentProfilePatchBody,
} from "@studyhouse/shared";

export async function getStudentProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  try {
    const data = await getStudentProfilePageForUser(userId);
    res.status(200).json({ success: true, data });
  } catch {
    throw new AppError("NOT_FOUND", "الحساب غير موجود.", 404);
  }
}

export async function patchStudentProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const body = req.body as StudentProfilePatchBody;
  const data = await patchStudentProfileForUser(userId, body);
  res.status(200).json({ success: true, data });
}

export async function completeStudentOnboardingHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const body = req.body as StudentOnboardingCompleteBody;
  const data = await completeStudentOnboarding(userId, body);
  res.status(200).json({ success: true, data });
}

export async function skipStudentOnboardingHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const data = await skipStudentOnboarding(userId);
  res.status(200).json({ success: true, data });
}
