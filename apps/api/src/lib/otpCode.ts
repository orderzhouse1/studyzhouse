import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { loadEnv } from "../config/env.js";

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export function generateOtpCode(): string {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.SIGNUP_OTP_TEST_FIXED?.length === 6
  ) {
    return process.env.SIGNUP_OTP_TEST_FIXED;
  }
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtpCode(code: string): string {
  const env = loadEnv();
  return createHmac("sha256", env.JWT_ACCESS_SECRET)
    .update(code.trim())
    .digest("hex");
}

export function verifyOtpCode(code: string, codeHash: string): boolean {
  const computed = hashOtpCode(code);
  try {
    return timingSafeEqual(
      Buffer.from(computed, "utf8"),
      Buffer.from(codeHash, "utf8"),
    );
  } catch {
    return false;
  }
}
