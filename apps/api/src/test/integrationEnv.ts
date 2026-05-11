/**
 * Call from vitest `beforeAll` only, after `TEST_DATABASE_URL` is confirmed.
 * Wires `DATABASE_URL` to the dedicated test database — never the production URL.
 */
export function applyIntegrationProcessEnv(): void {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl || testUrl.length < 3) {
    return;
  }
  process.env.DATABASE_URL = testUrl;
  process.env.NODE_ENV = "test";
  process.env.CLIENT_ORIGIN = "http://localhost:3000";
  process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ??
    "0123456789012345678901234567890123456789";
  process.env.ACTIVATION_CODE_PEPPER =
    process.env.ACTIVATION_CODE_PEPPER ??
    "abcdef0123456789abcdef0123456789abcdef01";
}
