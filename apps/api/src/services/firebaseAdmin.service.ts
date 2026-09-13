import fs from "node:fs";
import path from "node:path";

import admin from "firebase-admin";

import { loadEnv } from "../config/env.js";

let initAttempted = false;
let messagingReady = false;

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function readServiceAccount(): ServiceAccountJson | null {
  const env = loadEnv();

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccountJson;
    } catch {
      console.warn(
        "[mobile-push] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON — FCM disabled.",
      );
      return null;
    }
  }

  if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolved = path.isAbsolute(env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH);
    try {
      const raw = fs.readFileSync(resolved, "utf8");
      return JSON.parse(raw) as ServiceAccountJson;
    } catch (err) {
      console.warn("[mobile-push] Could not read FIREBASE_SERVICE_ACCOUNT_PATH", {
        path: resolved,
        message: err instanceof Error ? err.message : "unknown",
      });
      return null;
    }
  }

  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  const env = loadEnv();
  return Boolean(
    env.FIREBASE_SERVICE_ACCOUNT_JSON || env.FIREBASE_SERVICE_ACCOUNT_PATH,
  );
}

/**
 * Initializes Firebase Admin once. Missing/invalid credentials do not throw —
 * callers must treat FCM as unavailable.
 */
export function ensureFirebaseAdmin(): boolean {
  if (messagingReady) return true;
  if (initAttempted) return false;
  initAttempted = true;

  if (!isFirebaseAdminConfigured()) {
    console.info(
      "[mobile-push] Firebase Admin not configured (set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH) — FCM disabled.",
    );
    return false;
  }

  const account = readServiceAccount();
  if (
    !account?.project_id ||
    !account.client_email ||
    !account.private_key
  ) {
    console.warn(
      "[mobile-push] Service account JSON missing project_id/client_email/private_key — FCM disabled.",
    );
    return false;
  }

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: account.project_id,
          clientEmail: account.client_email,
          privateKey: account.private_key.replace(/\\n/g, "\n"),
        }),
      });
    }
    messagingReady = true;
    return true;
  } catch (err) {
    console.warn("[mobile-push] Firebase Admin init failed — FCM disabled.", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}

export function getFirebaseMessaging(): admin.messaging.Messaging | null {
  if (!ensureFirebaseAdmin()) return null;
  return admin.messaging();
}

/** @internal tests */
export function resetFirebaseAdminCache(): void {
  initAttempted = false;
  messagingReady = false;
  for (const app of admin.apps.slice()) {
    void app?.delete();
  }
}
