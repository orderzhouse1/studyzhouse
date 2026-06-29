import type { Request, Response } from "express";

import { deactivateStudentAccount } from "../services/studentAccount.service.js";

export async function deactivateStudentAccountHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "يجب تسجيل الدخول." },
    });
    return;
  }

  await deactivateStudentAccount(userId, req);

  res.status(200).json({
    success: true,
    data: { message: "Account deactivated successfully" },
  });
}
