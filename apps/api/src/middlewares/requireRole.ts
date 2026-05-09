import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";

import { AppError } from "../lib/AppError.js";

export function requireRole(allowed: readonly UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const auth = req.auth;
    if (!auth) {
      next(new AppError("UNAUTHORIZED", "يجب تسجيل الدخول.", 401));
      return;
    }
    if (!allowed.includes(auth.role)) {
      next(new AppError("FORBIDDEN", "ليس لديك صلاحية لهذا المورد.", 403));
      return;
    }
    next();
  };
}
