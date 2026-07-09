import type { Request } from "express";

/** Mobile client platform from `X-Client-Platform` (Flutter). */
export function getClientPlatform(req: Request): string | null {
  const raw = req.get("x-client-platform")?.trim().toLowerCase();
  return raw && raw.length > 0 ? raw : null;
}

export function isIosAppClient(req: Request): boolean {
  return getClientPlatform(req) === "ios";
}
