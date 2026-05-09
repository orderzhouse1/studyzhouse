import type { CookieOptions } from "express";

import { loadEnv } from "../config/env.js";

export function authCookieOptions(maxAgeMs: number): CookieOptions {
  const env = loadEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}
