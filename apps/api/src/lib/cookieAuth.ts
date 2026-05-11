import type { CookieOptions } from "express";

import { loadEnv } from "../config/env.js";

/**
 * خيارات كوكي JWT للمصادقة.
 * - secure: true في الإنتاج فقط — يتطلّب HTTPS على CLIENT_ORIGIN.
 * - sameSite: lax — يقلّل بعض هجمات CSRF بين المواقع؛ الطلبات POST من مواقع أخرى لا ترسل الكوكي عادة.
 * للإنتاج على نطاق فرعي مختلف قد تحتاج ضبط domain على مستوى reverse proxy أو متغير منفصل لاحقًا.
 */
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
