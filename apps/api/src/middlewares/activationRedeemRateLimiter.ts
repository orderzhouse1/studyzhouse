import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

export const activationRedeemRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator(req: Request): string {
    const auth = req.auth;
    if (auth?.userId) return `activation-redeem:user:${auth.userId}`;
    const xf = req.headers["x-forwarded-for"];
    const ip =
      typeof xf === "string" && xf.length > 0
        ? xf.split(",")[0]?.trim()
        : req.ip;
    return `activation-redeem:ip:${ip ?? "unknown"}`;
  },
  handler(_req: Request, res: Response): void {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT",
        message:
          "عدد محاولات التفعيل كبير جدًا. انتظر قليلًا ثم أعد المحاولة.",
      },
    });
  },
});
