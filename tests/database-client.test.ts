import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  end: vi.fn(async () => undefined),
  getEnv: vi.fn<() => { DATABASE_URL?: string }>(),
}));

vi.mock("@/src/lib/env", () => ({ getEnv: mocks.getEnv }));
vi.mock("pg", async (importOriginal) => {
  const original = await importOriginal<typeof import("pg")>();
  return { ...original, Pool: vi.fn(function () { return { end: mocks.end }; }) };
});

import { Pool } from "pg";
import { closeDb, getDb } from "@/src/server/db/client";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getEnv.mockReturnValue({});
});
afterEach(async () => {
  await closeDb();
  vi.unstubAllEnvs();
});

describe("runtime connection configuration (mocked pg, no database)", () => {
  it("fails before pool creation when only migration credentials exist", () => {
    vi.stubEnv("MIGRATION_DATABASE_URL", "postgresql://migration@localhost/synthetic");
    expect(() => getDb()).toThrow("DATABASE_URL is not configured");
    expect(Pool).not.toHaveBeenCalled();
  });

  it.each(["https://user:private-value@example.test/db", "postgresql://localhost/db", "postgresql://app@localhost", "not-a-url"])(
    "rejects non-explicit runtime PostgreSQL configuration %s without opening a pool",
    (DATABASE_URL) => {
      mocks.getEnv.mockReturnValue({ DATABASE_URL });
      expect(() => getDb()).toThrow("DATABASE_URL must be a PostgreSQL URI");
      try { getDb(); } catch (error) { expect(String(error)).not.toContain("private-value"); }
      expect(Pool).not.toHaveBeenCalled();
    },
  );

  it("uses only runtime credentials, reuses the bounded pool, and releases it on shutdown", async () => {
    const DATABASE_URL = "postgresql://app@localhost/synthetic";
    mocks.getEnv.mockReturnValue({ DATABASE_URL });
    vi.stubEnv("MIGRATION_DATABASE_URL", "postgresql://migration@localhost/synthetic");
    getDb();
    getDb();
    expect(Pool).toHaveBeenCalledExactlyOnceWith({ connectionString: DATABASE_URL, max: 5 });
    await closeDb();
    expect(mocks.end).toHaveBeenCalledOnce();
    getDb();
    expect(Pool).toHaveBeenCalledTimes(2);
  });
});
