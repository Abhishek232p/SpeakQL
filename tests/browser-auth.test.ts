import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createBrowserClient: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({ createBrowserClient: mocks.createBrowserClient }));

import { createSupabaseBrowserClient, signOutBrowserSession } from "@/src/client/auth/supabase";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://auth.example.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-test-key";
  mocks.createBrowserClient.mockReturnValue({ auth: { signOut: mocks.signOut } });
  mocks.signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
});

describe("browser Supabase auth helper", () => {
  it("constructs a client only from the public configuration", () => {
    expect(createSupabaseBrowserClient()).toEqual({ auth: { signOut: mocks.signOut } });
    expect(mocks.createBrowserClient).toHaveBeenCalledExactlyOnceWith("https://auth.example.test", "public-test-key");
  });

  it("signs out the current browser session without exposing auth data", async () => {
    await expect(signOutBrowserSession()).resolves.toBe(true);
    expect(mocks.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "local" });
  });

  it("fails closed when configuration, provider response, or provider call is unavailable", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    await expect(signOutBrowserSession()).resolves.toBe(false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://auth.example.test";
    mocks.signOut.mockResolvedValueOnce({ error: new Error("private auth diagnostic") });
    await expect(signOutBrowserSession()).resolves.toBe(false);

    mocks.signOut.mockRejectedValueOnce(new Error("private auth diagnostic"));
    await expect(signOutBrowserSession()).resolves.toBe(false);
  });
});
