import { describe, expect, it } from "vitest";
import { parseEnv } from "@/src/lib/env";

describe("environment configuration", () => {
  it("applies safe defaults for local development", () => {
    const result = parseEnv({});
    expect(result.success && result.data.NODE_ENV).toBe("development");
  });

  it("rejects an invalid application version", () => {
    expect(parseEnv({ NODE_ENV: "staging" }).success).toBe(false);
  });
});
