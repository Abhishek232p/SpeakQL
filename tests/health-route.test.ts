import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "../app/api/health/route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a deterministic, schema-valid healthy response", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LOG_LEVEL", "silent");

    const first = GET();
    const second = GET();
    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(firstBody).toEqual(secondBody);
     expect(firstBody).toEqual({ service: "speakql", status: "ok", version: "0.1.0" });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("returns a safe 503 response when configuration validation fails", async () => {
    vi.stubEnv("NODE_ENV", "staging");
    vi.stubEnv("LOG_LEVEL", "silent");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: "configuration_error",
      service: "speakql",
      status: "error",
       version: "0.1.0",
    });
    expect(JSON.stringify(body)).not.toContain("staging");
    expect(errorSpy).toHaveBeenCalledOnce();
    expect(errorSpy.mock.calls[0]?.[0]).toContain('"event":"health.configuration_invalid"');
  });
});
