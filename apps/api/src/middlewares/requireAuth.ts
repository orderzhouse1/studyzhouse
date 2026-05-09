import type { NextFunction, Request, Response } from "express";

import { UserStatus } from "@prisma/client";

import { AppError } from "../lib/AppError.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { AUTH_ACCESS_COOKIE_NAME } from "@studyhouse/shared";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[AUTH_ACCESS_COOKIE_NAME];
    if (!token) {
      next(new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401));
      return;
    }

    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      next(new AppError("UNAUTHORIZED", "الحساب غير متاح.", 401));
      return;
    }

    // Always trust DB role/status over JWT claims (token may be stale).
    req.auth = { userId: user.id, role: user.role };
    next();
  } catch {
    next(new AppError("UNAUTHORIZED", "جلسة غير صالحة أو منتهية.", 401));
  }
}
