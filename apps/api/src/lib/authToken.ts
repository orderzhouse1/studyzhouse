import type { Request } from "express";

import { AUTH_ACCESS_COOKIE_NAME } from "@studyhouse/shared";

const BEARER_PREFIX = /^Bearer\s+/i;

/**
 * Resolves JWT for authenticated routes.
 * 1. HttpOnly cookie (web) — preferred when present
 * 2. Authorization: Bearer (mobile/native)
 * Never reads query strings.
 */
export function extractAccessTokenFromRequest(req: Request): string | undefined {
  const cookieToken = req.cookies?.[AUTH_ACCESS_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string") {
    return undefined;
  }

  const trimmed = authHeader.trim();
  if (!BEARER_PREFIX.test(trimmed)) {
    return undefined;
  }

  const token = trimmed.replace(BEARER_PREFIX, "").trim();
  return token.length > 0 ? token : undefined;
}
