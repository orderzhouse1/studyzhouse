import type { RequestHandler } from "express";

/**
 * Express 4 does not catch rejections from `async` route handlers. This wrapper
 * forwards failed promises to `next(err)` so `AppError` reaches `errorHandler`.
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}
