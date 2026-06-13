import webpush from "web-push";

import { loadEnv } from "../config/env.js";

let vapidReady = false;

export function isWebPushConfigured(): boolean {
  const env = loadEnv();
  return Boolean(
    env.WEB_PUSH_PUBLIC_KEY &&
      env.WEB_PUSH_PRIVATE_KEY &&
      env.WEB_PUSH_SUBJECT,
  );
}

export function getWebPushPublicKeyResponse(): {
  configured: boolean;
  publicKey: string | null;
} {
  const env = loadEnv();
  const configured = isWebPushConfigured();
  return {
    configured,
    publicKey: configured ? (env.WEB_PUSH_PUBLIC_KEY ?? null) : null,
  };
}

export function ensureWebPushVapid(): boolean {
  if (!isWebPushConfigured()) return false;
  if (vapidReady) return true;

  const env = loadEnv();
  webpush.setVapidDetails(
    env.WEB_PUSH_SUBJECT!,
    env.WEB_PUSH_PUBLIC_KEY!,
    env.WEB_PUSH_PRIVATE_KEY!,
  );
  vapidReady = true;
  return true;
}

/** @internal tests */
export function resetWebPushVapidCache(): void {
  vapidReady = false;
}

export { webpush };
