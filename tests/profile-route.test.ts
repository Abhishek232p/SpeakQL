import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthProvider } from "@/src/server/auth/types";
import type { ProfileRepository } from "@/src/server/profiles/repository";

// These are isolated route tests: authentication, DB creation, and the repository
// are mocked. Only the route, identity guard, and profile validation/service run.
const mocks = vi.hoisted(() => {
  const provider = { getIdentity: vi.fn<AuthProvider["getIdentity"]>() };
  const repository = {
    getProfile: vi.fn<ProfileRepository["getProfile"]>(),
    upsertProfile: vi.fn<ProfileRepository["upsertProfile"]>(),
  };
  const database = { kind: "mock-database" };
  return {
    provider,
    repository,
    database,
    createAuthProvider: vi.fn(() => provider),
    getDb: vi.fn(() => database),
    createRepository: vi.fn(() => repository),
  };
});

vi.mock("@/src/server/auth/supabase", () => ({ createSupabaseAuthProvider: mocks.createAuthProvider }));
vi.mock("@/src/server/db/client", () => ({ getDb: mocks.getDb }));
vi.mock("@/src/server/profiles/postgres-repository", () => ({ createPostgresProfileRepository: mocks.createRepository }));

import { GET, PUT } from "@/app/api/profile/route";

const origin = "https://app.example.test";
const identity = { issuer: "https://auth.example.test", subject: "authenticated-subject" };
const input = { displayName: "Alice", locale: "en-US", timezone: "UTC" };
const profile = { userId: "00000000-0000-4000-8000-000000000001", ...input };

function putRequest(options: {
  body?: string;
  contentType?: string | null;
  origin?: string | null;
  headers?: Record<string, string>;
} = {}) {
  const headers = new Headers(options.headers);
  const contentType = options.contentType === undefined ? "application/json" : options.contentType;
  const requestOrigin = options.origin === undefined ? origin : options.origin;
  if (contentType !== null) headers.set("content-type", contentType);
  if (requestOrigin !== null) headers.set("origin", requestOrigin);
  return new Request(`${origin}/api/profile`, {
    method: "PUT",
    headers,
    // A byte body avoids Request automatically supplying text/plain when the
    // missing Content-Type case is under test.
    body: new TextEncoder().encode(options.body ?? JSON.stringify(input)),
  });
}

function expectNoDatabaseAccess() {
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.createRepository).not.toHaveBeenCalled();
  expect(mocks.repository.getProfile).not.toHaveBeenCalled();
  expect(mocks.repository.upsertProfile).not.toHaveBeenCalled();
}

async function expectError(response: Response, status: number, error: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("content-type")).toContain("application/json");
  expect(await response.json()).toEqual({ error });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createAuthProvider.mockReturnValue(mocks.provider);
  mocks.provider.getIdentity.mockResolvedValue(identity);
  mocks.getDb.mockReturnValue(mocks.database);
  mocks.createRepository.mockReturnValue(mocks.repository);
  mocks.repository.getProfile.mockResolvedValue(profile);
  mocks.repository.upsertProfile.mockResolvedValue(profile);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/profile (isolated route)", () => {
  it("reads the authenticated identity's profile with no-store", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(profile);
    expect(mocks.getDb).toHaveBeenCalledOnce();
    expect(mocks.createRepository).toHaveBeenCalledWith(mocks.database);
    expect(mocks.repository.getProfile).toHaveBeenCalledExactlyOnceWith(identity);
    expect(mocks.repository.upsertProfile).not.toHaveBeenCalled();
  });

  it("returns an empty no-store 404 when the profile is absent", async () => {
    mocks.repository.getProfile.mockResolvedValueOnce(null);

    const response = await GET();

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("");
  });
});

describe.each(["GET", "PUT"] as const)("%s /api/profile shared protections (mocked boundaries)", (method) => {
  const invoke = () => method === "GET" ? GET() : PUT(putRequest());

  it("denies an absent identity before any database access", async () => {
    mocks.provider.getIdentity.mockResolvedValueOnce(null);

    await expectError(await invoke(), 401, "unauthenticated");
    expectNoDatabaseAccess();
  });

  it.each(["auth construction", "auth lookup", "database", "repository construction", "repository operation"] as const)(
    "returns a generic no-store error for a failure in %s",
    async (boundary) => {
      const failure = new Error("DATABASE_URL: private diagnostic details");
      const fail = () => { throw failure; };
      if (boundary === "auth construction") mocks.createAuthProvider.mockImplementationOnce(fail);
      if (boundary === "auth lookup") mocks.provider.getIdentity.mockRejectedValueOnce(failure);
      if (boundary === "database") mocks.getDb.mockImplementationOnce(fail);
      if (boundary === "repository construction") mocks.createRepository.mockImplementationOnce(fail);
      if (boundary === "repository operation") {
        mocks.repository.getProfile.mockRejectedValueOnce(failure);
        mocks.repository.upsertProfile.mockRejectedValueOnce(failure);
      }

      await expectError(await invoke(), 500, "internal_error");
      if (boundary.startsWith("auth")) expectNoDatabaseAccess();
    },
  );

  it("returns a generic error for a non-Error rejection", async () => {
    mocks.provider.getIdentity.mockRejectedValueOnce({ internal: "private diagnostic details" });

    await expectError(await invoke(), 500, "internal_error");
    expectNoDatabaseAccess();
  });
});

describe("PUT /api/profile (isolated route)", () => {
  it("normalizes input and writes only for the authenticated identity", async () => {
    const response = await PUT(putRequest({ body: JSON.stringify({ displayName: "  Alice  " }) }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(profile);
    expect(mocks.getDb).toHaveBeenCalledOnce();
    expect(mocks.createRepository).toHaveBeenCalledWith(mocks.database);
    expect(mocks.repository.upsertProfile).toHaveBeenCalledExactlyOnceWith(identity, input);
    expect(mocks.repository.getProfile).not.toHaveBeenCalled();
  });

  it.each(["application/json; charset=utf-8", "Application/JSON; Charset=UTF-8"])(
    "accepts the JSON media type %s",
    async (contentType) => {
      const response = await PUT(putRequest({ contentType }));

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(mocks.repository.upsertProfile).toHaveBeenCalledExactlyOnceWith(identity, input);
    },
  );

  it.each([null, "text/plain", "application/x-www-form-urlencoded", "multipart/form-data", "application/jsonp", "application/json, text/plain"])(
    "rejects unsupported Content-Type %s before body parsing and database access",
    async (contentType) => {
      const request = putRequest({ contentType });
      const parse = vi.spyOn(request, "json");

      await expectError(await PUT(request), 415, "unsupported_media_type");
      expect(parse).not.toHaveBeenCalled();
      expectNoDatabaseAccess();
    },
  );

  it.each([
    null,
    "null",
    "https://other.example.test",
    "http://app.example.test",
    "https://app.example.test:444",
    "not-an-origin",
    `${origin}/untrusted-path`,
    `${origin} https://other.example.test`,
  ])("rejects missing, malformed, or cross-origin Origin %s before parsing and DB access", async (requestOrigin) => {
    const request = putRequest({ origin: requestOrigin });
    const parse = vi.spyOn(request, "json");

    await expectError(await PUT(request), 403, "forbidden");
    expect(parse).not.toHaveBeenCalled();
    expectNoDatabaseAccess();
  });

  it("uses the request URL origin rather than trusting forwarded or Host headers", async () => {
    const request = putRequest({
      origin: "https://other.example.test",
      headers: {
        host: "other.example.test",
        "x-forwarded-host": "other.example.test",
        "x-forwarded-proto": "https",
        forwarded: "host=other.example.test;proto=https",
      },
    });

    await expectError(await PUT(request), 403, "forbidden");
    expectNoDatabaseAccess();
  });

  it("requires Origin even when fetch metadata claims same-origin", async () => {
    await expectError(await PUT(putRequest({ origin: null, headers: { "sec-fetch-site": "same-origin" } })), 403, "forbidden");
    expectNoDatabaseAccess();
  });

  it.each(["", "{", '{"displayName":', "not JSON"])("returns a safe 400 for malformed JSON %j before DB access", async (body) => {
    await expectError(await PUT(putRequest({ body })), 400, "invalid_json");
    expectNoDatabaseAccess();
  });

  it.each([
    null,
    [],
    {},
    { displayName: "   " },
    { displayName: 42 },
    { displayName: "A".repeat(81) },
    { ...input, locale: "english" },
    { ...input, timezone: "" },
    { ...input, userId: "client-selected-identity" },
  ].map((body) => ({ body })))("returns a safe 400 for invalid profile input $body before DB access", async ({ body }) => {
    // Invalid input must win even if creating the database would fail.
    mocks.getDb.mockImplementationOnce(() => { throw new Error("DATABASE_URL is not configured."); });

    await expectError(await PUT(putRequest({ body: JSON.stringify(body) })), 400, "invalid_profile");
    expectNoDatabaseAccess();
  });

  it("does not classify an invalid repository response as a client validation error", async () => {
    mocks.repository.upsertProfile.mockResolvedValueOnce({ ...profile, userId: "invalid-repository-id" });

    await expectError(await PUT(putRequest()), 500, "internal_error");
    expect(mocks.repository.upsertProfile).toHaveBeenCalledOnce();
  });

  it("does not expose an unexpected body-read failure", async () => {
    const request = putRequest();
    vi.spyOn(request, "json").mockRejectedValueOnce(new Error("private body-read diagnostic"));

    await expectError(await PUT(request), 500, "internal_error");
    expectNoDatabaseAccess();
  });
});
