import { jwtVerify } from "jose";

/** Mirrors apps/api/src/lib/jwt.ts — HS256 access token with `sub` (user id) and `role`. */
const KNOWN_ROLES = new Set(["STUDENT", "ADMIN", "SUPER_ADMIN"]);

export function getJwtAccessSecretBytes(): Uint8Array | null {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s || s.length < 32) return null;
  return new TextEncoder().encode(s);
}

/**
 * Verifies the HttpOnly access cookie JWT (same signing as Express).
 * Used only for fast route gating in middleware — APIs still enforce requireAuth + DB.
 */
export async function verifyAccessTokenFromCookie(
  cookieValue: string | undefined,
): Promise<{ role: string } | null> {
  const secret = getJwtAccessSecretBytes();
  if (!secret || !cookieValue) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, secret, {
      algorithms: ["HS256"],
    });
    const role = payload.role;
    if (typeof role !== "string" || !KNOWN_ROLES.has(role)) return null;
    return { role };
  } catch {
    return null;
  }
}
