import type { Request } from "express";
import { UserRole } from "@prisma/client";

import { AppError } from "./AppError.js";

export function assertCanManageCourse(
  req: Request,
  course: { createdById: string },
): void {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  if (auth.role === UserRole.SUPER_ADMIN) {
    return;
  }
  if (auth.role === UserRole.ADMIN && auth.userId === course.createdById) {
    return;
  }
  throw new AppError("FORBIDDEN", "لا يمكنك إدارة هذا الكورس.", 403);
}
