import type { NextFunction, Request, Response } from "express";

import { AppError } from "../lib/AppError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  const message =
    err instanceof Error ? err.message : "حدث خطأ غير متوقع على الخادم.";

  // Avoid leaking internals in production
  const safeMessage =
    process.env.NODE_ENV === "production"
      ? "حدث خطأ غير متوقع على الخادم."
      : message;

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: safeMessage,
    },
  });
}
