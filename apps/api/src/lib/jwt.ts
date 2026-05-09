import * as jose from "jose";

import { loadEnv } from "../config/env.js";
import type { UserRole } from "@prisma/client";

export async function signAccessToken(input: {
  userId: string;
  role: UserRole;
}): Promise<string> {
  const env = loadEnv();
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  return new jose.SignJWT({ role: input.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyAccessToken(
  token: string,
): Promise<{ userId: string; role: UserRole }> {
  const env = loadEnv();
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const { payload } = await jose.jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  const role = payload.role as UserRole | undefined;
  if (!userId || !role) {
    throw new Error("INVALID_TOKEN");
  }
  return { userId, role };
}
