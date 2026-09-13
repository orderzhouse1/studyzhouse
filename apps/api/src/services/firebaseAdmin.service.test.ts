import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { resetEnvCache } from "../config/env.js";
import { applyIntegrationProcessEnv } from "../test/integrationEnv.js";
import {
  ensureFirebaseAdmin,
  isFirebaseAdminConfigured,
  resetFirebaseAdminCache,
} from "../services/firebaseAdmin.service.js";

describe("firebaseAdmin.service", () => {
  const originalJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const originalPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  beforeEach(() => {
    applyIntegrationProcessEnv();
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL =
        process.env.TEST_DATABASE_URL ??
        "postgresql://postgres:postgres@127.0.0.1:5432/studyhouse_test";
    }
    process.env.CLIENT_ORIGIN =
      process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET ??
      "0123456789012345678901234567890123456789";
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    resetEnvCache();
    resetFirebaseAdminCache();
  });

  afterEach(() => {
    if (originalJson === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON = originalJson;
    }
    if (originalPath === undefined) {
      delete process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    } else {
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH = originalPath;
    }
    resetEnvCache();
    resetFirebaseAdminCache();
  });

  it("reports not configured when env vars are missing", () => {
    expect(isFirebaseAdminConfigured()).toBe(false);
    expect(ensureFirebaseAdmin()).toBe(false);
  });

  it("fails gracefully on invalid JSON", () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = "{not-json";
    resetEnvCache();
    expect(isFirebaseAdminConfigured()).toBe(true);
    expect(ensureFirebaseAdmin()).toBe(false);
  });
});
