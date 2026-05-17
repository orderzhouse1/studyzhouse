import * as jose from "jose";

import { loadEnv } from "../config/env.js";

const OAUTH_STATE_SUBJECT = "google-oauth-state";

export async function signGoogleOAuthState(input: {
  next?: string;
}): Promise<string> {
  const env = loadEnv();
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  return new jose.SignJWT({ next: input.next ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(OAUTH_STATE_SUBJECT)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);
}

export async function verifyGoogleOAuthState(
  state: string,
): Promise<{ next?: string }> {
  const env = loadEnv();
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const { payload } = await jose.jwtVerify(state, secret, {
    algorithms: ["HS256"],
    subject: OAUTH_STATE_SUBJECT,
  });
  const next =
    typeof payload.next === "string" && payload.next.length > 0
      ? payload.next
      : undefined;
  return { next };
}
