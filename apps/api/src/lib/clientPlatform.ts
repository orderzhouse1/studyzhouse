import type { Request } from "express";

/** Mobile client platform from `X-Client-Platform` (Flutter). */
export function getClientPlatform(req: Request): string | null {
  const raw = req.get("x-client-platform")?.trim().toLowerCase();
  return raw && raw.length > 0 ? raw : null;
}

export function isIosAppClient(req: Request): boolean {
  return getClientPlatform(req) === "ios";
}

export function isAndroidAppClient(req: Request): boolean {
  return getClientPlatform(req) === "android";
}

/**
 * Flutter student app (iOS or Android) in Reader / Learning Companion mode.
 * Web clients do not send this header and keep full marketplace behavior.
 */
export function isMobileReaderClient(req: Request): boolean {
  const platform = getClientPlatform(req);
  return platform === "ios" || platform === "android";
}
