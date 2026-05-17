import rateLimit from "express-rate-limit";

/** Production signup/OTP rate limits — documented and asserted in tests. */
export const SIGNUP_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  limit: 10,
} as const;

/** Skipped in Vitest/integration so OTP business rules are not masked by shared IP counters. */
export function isSignupRateLimitSkipped(): boolean {
  return process.env.NODE_ENV === "test";
}

export const signupRateLimiter = rateLimit({
  windowMs: SIGNUP_RATE_LIMIT.windowMs,
  limit: SIGNUP_RATE_LIMIT.limit,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isSignupRateLimitSkipped(),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "محاولات تسجيل كثيرة. حاول لاحقًا.",
      },
    });
  },
});
