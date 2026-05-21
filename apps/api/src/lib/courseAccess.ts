import type { Request } from "express";
import { UserRole } from "@prisma/client";

import { AppError } from "./AppError.js";

/**
 * كورسات المنصة — أي ADMIN أو SUPER_ADMIN يدير أي كورس.
 * createdById للتدقيق/البيانات الوصفية فقط، وليس حدّ صلاحية.
 */
export function assertCanManageCourse(
  req: Request,
  _course: { createdById: string },
): void {
  const auth = req.auth;
  if (!auth) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401);
  }
  if (auth.role === UserRole.SUPER_ADMIN || auth.role === UserRole.ADMIN) {
    return;
  }
  throw new AppError("FORBIDDEN", "لا يمكنك إدارة هذا الكورس.", 403);
}
