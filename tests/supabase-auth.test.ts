import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CookieMethodsServer } from "@supabase/ssr";

const mocks = vi.hoisted(() => ({
  getEnv: vi.fn(),
  cookies: vi.fn(),
  getAll: vi.fn(),
  set: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/src/lib/env", () => ({ getEnv: mocks.getEnv }));

import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";

const url = "https://auth.example.test";
const verifiedUser = { id: "verified-subject" };
const updatedCookies = [{ name: "session", value: "test-session", options: { path: "/", sameSite: "lax" as const } }];

function cookieMethods() {
  const options = mocks.createServerClient.mock.calls[0][2] as { cookies: CookieMethodsServer };
  return options.cookies;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getEnv.mockReturnValue({ NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key" });
  mocks.cookies.mockResolvedValue({ getAll: mocks.getAll, set: mocks.set });
  mocks.getAll.mockReturnValue([{ name: "session", value: "test-request-cookie" }]);
  mocks.getUser.mockResolvedValue({ data: { user: verifiedUser }, error: null });
  mocks.createServerClient.mockReturnValue({ auth: { getUser: mocks.getUser, getSession: mocks.getSession } });
});

describe("Supabase server identity", () => {
  it("derives identity from a server-validated user, never from getSession", async () => {
    expect(await createSupabaseAuthProvider().getIdentity()).toEqual({ issuer: url, subject: verifiedUser.id });
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(cookieMethods().getAll()).toEqual(mocks.getAll());
  });

  it.each([{}, { NEXT_PUBLIC_SUPABASE_URL: url }, { NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key" }])(
    "does not build a client without complete public configuration (%#)",
    async (env) => {
      mocks.getEnv.mockReturnValue(env);
      expect(await createSupabaseAuthProvider().getIdentity()).toBeNull();
      expect(mocks.createServerClient).not.toHaveBeenCalled();
    },
  );

  it("denies identity when the user is missing", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect(await createSupabaseAuthProvider().getIdentity()).toBeNull();
  });

  it("never accepts a user alongside a validation error", async () => {
    mocks.getUser.mockResolvedValueOnce({ data: { user: verifiedUser }, error: new Error("private auth diagnostic") });
    await expect(createSupabaseAuthProvider().getIdentity()).rejects.toThrow("Unable to verify your session.");
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it.each(["construction", "lookup"])("fails closed with a safe error on %s exceptions", async (boundary) => {
    const error = new Error("private auth diagnostic");
    if (boundary === "construction") mocks.createServerClient.mockImplementationOnce(() => { throw error; });
    else mocks.getUser.mockRejectedValueOnce(error);

    const result = createSupabaseAuthProvider().getIdentity();
    await expect(result).rejects.toThrow("Unable to verify your session.");
    await expect(result).rejects.not.toHaveProperty("cause");
  });

  it("creates an isolated client for each identity lookup", async () => {
    const provider = createSupabaseAuthProvider();
    await provider.getIdentity();
    mocks.getUser.mockResolvedValueOnce({ data: { user: { id: "second-subject" } }, error: null });
    expect(await provider.getIdentity()).toEqual({ issuer: url, subject: "second-subject" });
    expect(mocks.createServerClient).toHaveBeenCalledTimes(2);
    expect(mocks.cookies).toHaveBeenCalledTimes(2);
  });
});

describe("Supabase refresh cookie handling", () => {
  beforeEach(() => {
    mocks.getUser.mockImplementation(async () => {
      await cookieMethods().setAll?.(updatedCookies, {});
      return { data: { user: verifiedUser }, error: null };
    });
  });

  it("persists refresh cookies in writable Server Action and Route Handler contexts", async () => {
    expect(await createSupabaseAuthProvider().getIdentity()).toEqual({ issuer: url, subject: verifiedUser.id });
    expect(mocks.set).toHaveBeenCalledExactlyOnceWith("session", "test-session", updatedCookies[0].options);
  });

  it("tolerates only Next's read-only Server Component cookie error", async () => {
    mocks.set.mockImplementation(() => {
      throw new Error("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options");
    });

    expect(await createSupabaseAuthProvider().getIdentity()).toEqual({ issuer: url, subject: verifiedUser.id });
    expect(mocks.getUser).toHaveBeenCalledOnce();
  });

  it("does not hide an unexpected cookie storage failure", async () => {
    mocks.set.mockImplementation(() => { throw new Error("private cookie diagnostic"); });
    await expect(createSupabaseAuthProvider().getIdentity()).rejects.toThrow("Unable to verify your session.");
  });

  it("does not apply the read-only-cookie exception to a failed security check", async () => {
    mocks.getUser.mockRejectedValueOnce(new Error("Cookies can only be modified in a Server Action or Route Handler."));
    await expect(createSupabaseAuthProvider().getIdentity()).rejects.toThrow("Unable to verify your session.");
  });
});
