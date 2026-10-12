import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEnv: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("@/src/lib/env", () => ({ getEnv: mocks.getEnv }));

import { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/src/server/auth/supabase-proxy";

const url = "https://app.example.test/dashboard";
const publicConfig = {
  NEXT_PUBLIC_SUPABASE_URL: "https://auth.example.test",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key",
};

function request() {
  return new NextRequest(url, { headers: { cookie: "session=old-session" } });
}

function installClaimsResult(result: unknown, refresh = false) {
  mocks.createServerClient.mockImplementationOnce((_url: string, _key: string, options: { cookies: { getAll: () => unknown; setAll: (...args: unknown[]) => void } }) => ({
    auth: {
      getClaims: vi.fn().mockImplementation(async () => {
        expect(options.cookies.getAll()).toEqual([{ name: "session", value: "old-session" }]);
        if (refresh) {
          options.cookies.setAll(
            [{ name: "session", value: "new-session", options: { path: "/", httpOnly: true } }],
            { "cache-control": "private, no-store" },
          );
        }
        return result;
      }),
    },
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getEnv.mockReturnValue(publicConfig);
});

describe("Supabase Next.js proxy", () => {
  it("writes refreshed cookies and cache headers onto the returned response", async () => {
    installClaimsResult({
      data: { claims: { sub: "verified-subject" } },
      error: null,
    }, true);

    const response = await updateSupabaseSession(request());

    expect(mocks.createServerClient).toHaveBeenCalledOnce();
    expect(response.cookies.get("session")?.value).toBe("new-session");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("allows an absent session to continue as unauthenticated", async () => {
    installClaimsResult({ data: null, error: { name: "AuthSessionMissingError" } });

    const response = await updateSupabaseSession(request());

    expect(response.status).toBe(200);
    expect(response.cookies.get("session")).toBeUndefined();
  });

  it("does not turn an invalid token into an authenticated request", async () => {
    installClaimsResult({ data: null, error: { name: "AuthInvalidJwtError", message: "private token diagnostic" } });

    await expect(updateSupabaseSession(request())).rejects.toThrow("Unable to verify your session.");
  });

  it("does not expose setup failures", async () => {
    mocks.createServerClient.mockImplementationOnce(() => { throw new Error("private configuration diagnostic"); });

    await expect(updateSupabaseSession(request())).rejects.toThrow("Unable to verify your session.");
  });
});
