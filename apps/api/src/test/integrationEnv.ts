/** True when Vitest should run integration suites (not skip them). */
export function hasIntegrationTestDatabase(): boolean {
  return Boolean(
    process.env.TEST_DATABASE_URL &&
      process.env.TEST_DATABASE_URL.length > 0,
  );
}

/**
 * Ping Postgres with retries — use in globalSetup and suite `beforeAll`.
 * Throws if the database stays unreachable (fail fast instead of silent skip).
 */
export async function ensureIntegrationDatabaseReady(
  prisma: { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> },
  options?: { attempts?: number; delayMs?: number },
): Promise<void> {
  const attempts = options?.attempts ?? 5;
  const delayMs = options?.delayMs ?? 1500;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  const detail =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `Integration test database unreachable after ${attempts} attempts: ${detail}`,
  );
}

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
  process.env.SIGNUP_OTP_TEST_FIXED = "123456";
  process.env.GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID ?? "integration-test-google-client-id";
  process.env.GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_CLIENT_SECRET ?? "integration-test-google-client-secret";
  process.env.GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:3000/api/v1/auth/google/callback";
}
