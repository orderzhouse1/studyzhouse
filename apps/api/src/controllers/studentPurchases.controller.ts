import type { Request, Response } from "express";

import { getStudentPurchasesForUser } from "../services/studentPurchases.service.js";

export async function listStudentPurchases(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.auth!.userId;
  const items = await getStudentPurchasesForUser(userId);
  res.status(200).json({ success: true, data: { items } });
}
