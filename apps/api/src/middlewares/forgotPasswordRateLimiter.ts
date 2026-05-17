import rateLimit from "express-rate-limit";

export const FORGOT_PASSWORD_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  limit: 10,
} as const;

export function isForgotPasswordRateLimitSkipped(): boolean {
  return process.env.NODE_ENV === "test";
}

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: FORGOT_PASSWORD_RATE_LIMIT.windowMs,
  limit: FORGOT_PASSWORD_RATE_LIMIT.limit,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isForgotPasswordRateLimitSkipped(),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "محاولات كثيرة. حاول لاحقًا.",
      },
    });
  },
});
