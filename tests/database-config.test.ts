import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadMigrationDatabaseUrl } from "../scripts/database-config";

const roots: string[] = [];
function root() {
  const path = mkdtempSync(join(tmpdir(), "speakql-config-"));
  roots.push(path);
  return path;
}
afterEach(() => { for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true }); });

describe("explicit Drizzle configuration", () => {
  it("fails closed with no URL and does not load .env", () => {
    const path = root();
    writeFileSync(join(path, ".env"), "MIGRATION_DATABASE_URL=postgresql://migrator@localhost/unintended");
    expect(() => loadMigrationDatabaseUrl(path, {})).toThrow("MIGRATION_DATABASE_URL is required");
  });
  it("loads .env.local without overwriting existing configuration", () => {
    const path = root();
    writeFileSync(join(path, ".env.local"), "MIGRATION_DATABASE_URL=postgresql://migrator@localhost/test_only");
    expect(loadMigrationDatabaseUrl(path, {})).toBe("postgresql://migrator@localhost/test_only");
    expect(loadMigrationDatabaseUrl(path, { MIGRATION_DATABASE_URL: "postgresql://migrator@localhost/explicit" })).toBe("postgresql://migrator@localhost/explicit");
  });
  it("never falls back to runtime credentials in the environment or local file", () => {
    const path = root();
    writeFileSync(join(path, ".env.local"), "DATABASE_URL=postgresql://runtime@localhost/test_only");
    expect(() => loadMigrationDatabaseUrl(path, {})).toThrow("MIGRATION_DATABASE_URL is required");
    expect(() => loadMigrationDatabaseUrl(root(), { DATABASE_URL: "postgresql://runtime@localhost/test_only" })).toThrow("MIGRATION_DATABASE_URL is required");
  });
  it("rejects accidentally sharing the exact runtime connection string", () => {
    const value = "postgresql://runtime@localhost/test_only";
    expect(() => loadMigrationDatabaseUrl(root(), { DATABASE_URL: value, MIGRATION_DATABASE_URL: value })).toThrow("separate database roles");
  });
  it("allows independently configured migration and runtime roles without mutating the environment", () => {
    const environment = { DATABASE_URL: "postgresql://runtime@localhost/test_only", MIGRATION_DATABASE_URL: "postgresql://migrator@localhost/test_only" };
    const before = { ...environment };
    expect(loadMigrationDatabaseUrl(root(), environment)).toBe(environment.MIGRATION_DATABASE_URL);
    expect(environment).toEqual(before);
  });
  it.each(["", "invalid", "https://example.com/db", "postgresql://migrator@localhost", "postgresql://localhost/db"])("rejects missing or malformed configuration: %s", (value) => {
    expect(() => loadMigrationDatabaseUrl(root(), { MIGRATION_DATABASE_URL: value })).toThrow();
  });
  it("does not disclose rejected input in errors", () => {
    try { loadMigrationDatabaseUrl(root(), { MIGRATION_DATABASE_URL: "https://user:synthetic-secret@example.com/db" }); }
    catch (error) { expect(String(error)).not.toContain("synthetic-secret"); return; }
    throw new Error("Expected invalid protocol rejection");
  });
});
