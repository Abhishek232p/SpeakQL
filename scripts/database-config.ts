import { config } from "dotenv";
import { resolve } from "node:path";

/** Migration-only credentials; never fall back to the application's runtime role. */
export function loadMigrationDatabaseUrl(root: string = process.cwd(), environment: Record<string, string | undefined> = process.env): string {
  const loaded: Record<string, string> = {};
  for (const [key, value] of Object.entries(environment)) {
    if (value !== undefined) loaded[key] = value;
  }
  const result = config({ path: resolve(root, ".env.local"), processEnv: loaded, override: false, quiet: true });
  if (result.error && (result.error as NodeJS.ErrnoException).code !== "ENOENT") {
    throw new Error("Cannot read .env.local. Check local file permissions.");
  }
  const value = loaded.MIGRATION_DATABASE_URL;
  if (!value) throw new Error("MIGRATION_DATABASE_URL is required. Set it in .env.local or the process environment; DATABASE_URL is never used for migrations.");
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username || url.pathname.length < 2) throw new Error();
  } catch {
    // Never echo the URL, URL parsing errors, or credentials.
    throw new Error("MIGRATION_DATABASE_URL must be a valid PostgreSQL URI with an explicit user, host, and database name.");
  }
  if (value === loaded.DATABASE_URL) throw new Error("MIGRATION_DATABASE_URL and DATABASE_URL must use separate database roles.");
  return value;
}
