import { describe, expect, it } from "vitest";

import {
  configurationFailureResponse,
  healthResponseSchema,
  healthyResponse,
} from "@/src/lib/health";

describe("health response schema", () => {
  it("accepts the deterministic healthy response", () => {
    expect(healthResponseSchema.parse(healthyResponse)).toEqual({
      service: "speakql",
      status: "ok",
       version: "0.1.0",
    });
  });

  it("accepts the typed configuration-failure response", () => {
    expect(healthResponseSchema.parse(configurationFailureResponse)).toEqual({
      error: "configuration_error",
      service: "speakql",
      status: "error",
       version: "0.1.0",
    });
  });

  it("rejects malformed or extended responses", () => {
    expect(() =>
      healthResponseSchema.parse({ service: "speakql", status: "ok", version: "wrong" }),
    ).toThrow();
    expect(() => healthResponseSchema.parse({ ...healthyResponse, requestId: "random" })).toThrow();
  });
});
