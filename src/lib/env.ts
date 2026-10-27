import { z } from "zod";

const logLevelSchema = z.enum(["silent", "error", "warn", "info", "debug"]);

/**
 * Environment variables consumed by the server foundation.
 *
 * Unknown variables are intentionally stripped so that process.env can be
 * validated without copying secrets into the returned application config.
 */
export const envSchema = z
  .object({
    LOG_LEVEL: logLevelSchema.default("info"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
    PARTNER_NOTIFICATION_EMAIL: z.string().email().optional(),
  })
  .strip();

export type AppEnv = z.infer<typeof envSchema>;
export type EnvParseResult = ReturnType<typeof envSchema.safeParse>;

export class EnvValidationError extends Error {
  public readonly issues: z.ZodError["issues"];

  public constructor(error: z.ZodError) {
    super("Application environment is invalid.");
    this.name = "EnvValidationError";
    this.issues = error.issues;
  }
}

/** Parse an environment-like object without throwing. */
export function parseEnv(source: Record<string, string | undefined> = process.env): EnvParseResult {
  return envSchema.safeParse(source);
}

/** Validate an environment-like object and return only known, typed values. */
export function validateEnv(source: unknown = process.env): AppEnv {
  const result = parseEnv(source as Record<string, string | undefined>);

  if (!result.success) {
    throw new EnvValidationError(result.error);
  }

  return result.data;
}

/** Resolve the current process environment for server-side callers. */
export function getEnv(): AppEnv {
  return validateEnv();
}
