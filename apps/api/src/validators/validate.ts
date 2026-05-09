import type { RequestHandler } from "express";
import type { z } from "zod";

import { AppError } from "../lib/AppError.js";

export function validateBody<Schema extends z.ZodTypeAny>(
  schema: Schema,
): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(
        new AppError(
          "VALIDATION_ERROR",
          "بيانات غير صالحة.",
          400,
          parsed.error.flatten(),
        ),
      );
      return;
    }
    req.body = parsed.data as z.infer<Schema>;
    next();
  };
}

export function validateQuery<Schema extends z.ZodTypeAny>(
  schema: Schema,
): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      next(
        new AppError(
          "VALIDATION_ERROR",
          "معايير غير صالحة.",
          400,
          parsed.error.flatten(),
        ),
      );
      return;
    }
    req.validatedQuery = parsed.data as z.infer<Schema>;
    next();
  };
}

export function validateParams<Schema extends z.ZodTypeAny>(
  schema: Schema,
): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      next(
        new AppError(
          "VALIDATION_ERROR",
          "مسار غير صالح.",
          400,
          parsed.error.flatten(),
        ),
      );
      return;
    }
    req.validatedParams = parsed.data as z.infer<Schema>;
    next();
  };
}
