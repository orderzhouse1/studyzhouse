import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("12h"),
  /** سرّ لاشتقاق بصمة أكواد التفعيل (يفضّل مفتاحًا مستقلًا؛ يُستخدم JWT كاحتياط عند الغياب) */
  ACTIVATION_CODE_PEPPER: z.string().min(32).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/** Clears cached env (for tests when `process.env` is set after first `loadEnv`). */
export function resetEnvCache(): void {
  cached = null;
}

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
  }
  cached = parsed.data;
  return cached;
}
