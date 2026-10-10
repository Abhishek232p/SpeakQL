import { describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { createPostgresProfileRepository } from "@/src/server/profiles/postgres-repository";

// Real Drizzle SQL generation/transaction control with an in-process driver.
// This does not execute SQL, evaluate RLS, or prove PostgreSQL locking semantics.
type Query = { text: string; params: unknown[]; connection: number };
type Rows = unknown[][] | Record<string, unknown>[];
type Handler = (query: Query) => Rows | undefined | Promise<Rows | undefined>;

function fixture(handler: Handler = () => undefined) {
  const queries: Query[] = [];
  const release = vi.fn();
  let connectionId = 0;
  class MockPool {
    async connect() {
      const connection = connectionId++;
      return {
        async query(config: { text: string }, params: unknown[] = []) {
          const query = { text: config.text.replace(/\s+/g, " ").trim(), params, connection };
          queries.push(query);
          const rows = await handler(query) ?? (query.text.includes("pg_catalog.pg_roles login") ? [{ allowed: true }] : []);
          return { rows };
        },
        release: () => release(connection),
      };
    }
  }
  return { repository: createPostgresProfileRepository(drizzle(new MockPool() as unknown as Pool)), queries, release };
}

const identity = { issuer: "https://auth.example.test", subject: "verified-user" };
const input = { displayName: "Alice", locale: "en-US", timezone: "UTC" };
const userId = "00000000-0000-4000-8000-000000000001";
const isRoleCheck = (query: Query) => query.text.includes("pg_catalog.pg_roles login");
const isContext = (query: Query) => query.text.includes("set_config('speakql.auth_issuer'");
const isLock = (query: Query) => query.text.includes("pg_advisory_xact_lock");
const isUserRead = (query: Query) => query.text.startsWith('select "id" from "users"');
const isProfileRead = (query: Query) => query.text.startsWith('select "user_id" from "user_profiles"');
const isAudit = (query: Query) => query.text.startsWith('insert into "audit_events"');

describe("identity-scoped profile transactions (mock driver)", () => {
  it("sets a parameterized local context before a read and commits/releases the connection", async () => {
    const hostileLookingIdentity = { issuer: "issuer'); reset role; --", subject: "subject' OR TRUE --" };
    const f = fixture((query) => query.text.includes("inner join") ? [[userId, input.displayName, input.locale, input.timezone]] : undefined);

    await expect(f.repository.getProfile(hostileLookingIdentity)).resolves.toEqual({ userId, ...input });
    expect(f.queries[0].text).toBe("begin isolation level read committed");
    expect(f.queries[1].text).toContain("login.rolbypassrls");
    expect(f.queries[1].text).toContain("runtime.rolcanlogin");
    expect(f.queries[1].text).toContain("pg_catalog.pg_shdepend");
    expect(f.queries[1].text).toContain("c.relforcerowsecurity");
    expect(f.queries[2].text).toBe('set local role "speakql_runtime"');
    const context = f.queries[3];
    expect(context.params).toEqual([hostileLookingIdentity.issuer, hostileLookingIdentity.subject]);
    expect(context.text).toContain("set_config('speakql.auth_issuer', $1, true)");
    expect(context.text).toContain("set_config('speakql.auth_subject', $2, true)");
    expect(context.text).toContain("set_config('row_security', 'on', true)");
    expect(context.text).not.toContain(hostileLookingIdentity.issuer);
    expect(context.text).not.toContain(hostileLookingIdentity.subject);
    expect(f.queries[4].params).toEqual([hostileLookingIdentity.issuer, hostileLookingIdentity.subject, 1]);
    expect(f.queries.at(-1)?.text).toBe("commit");
    expect(f.release).toHaveBeenCalledExactlyOnceWith(0);
  });

  it("returns null for a missing profile and supplies fresh context on the next transaction", async () => {
    const f = fixture();
    await expect(f.repository.getProfile(identity)).resolves.toBeNull();
    const other = { issuer: identity.issuer, subject: "other-user" };
    await expect(f.repository.getProfile(other)).resolves.toBeNull();
    expect(f.queries.filter(isContext).map((query) => query.params)).toEqual([
      [identity.issuer, identity.subject], [other.issuer, other.subject],
    ]);
    expect(f.queries.filter((query) => query.text === "commit")).toHaveLength(2);
    expect(f.release).toHaveBeenCalledTimes(2);
  });

  it.each([[], [{ allowed: false }], [{ allowed: "true" }]].map((rows) => ({ rows })))("fails closed for missing/unsafe role evidence: $rows", async ({ rows }) => {
    const f = fixture((query) => isRoleCheck(query) ? rows : undefined);
    await expect(f.repository.getProfile(identity)).rejects.toThrow("runtime role or RLS configuration is unsafe");
    expect(f.queries).toHaveLength(3);
    expect(f.queries.at(-1)?.text).toBe("rollback");
    expect(f.queries.some(isContext)).toBe(false);
    expect(f.release).toHaveBeenCalledOnce();
  });

  it.each([
    { issuer: "", subject: "valid" }, { issuer: "valid", subject: " " },
    { issuer: "valid\0", subject: "valid" }, { issuer: "valid", subject: "bad\0" },
  ])("rejects an empty/invalid trusted identity before any transaction: %j", async (invalid) => {
    const f = fixture();
    await expect(f.repository.getProfile(invalid)).rejects.toThrow("verified issuer and subject");
    await expect(f.repository.upsertProfile(invalid, input)).rejects.toThrow("verified issuer and subject");
    expect(f.queries).toEqual([]);
  });

  it("rolls back a context failure before any application data access", async () => {
    const f = fixture((query) => {
      if (isContext(query)) throw new Error("mock context rejection");
      return undefined;
    });
    await expect(f.repository.upsertProfile(identity, input)).rejects.toThrow();
    expect(f.queries.some((query) => query.text.startsWith("insert") || isLock(query))).toBe(false);
    expect(f.queries.at(-1)?.text).toBe("rollback");
    expect(f.release).toHaveBeenCalledOnce();
  });

  it.each([false, true])("classifies a profile with existing=%s under a transaction-scoped identity lock", async (exists) => {
    const f = fixture((query) => isUserRead(query) ? [[userId]] : isProfileRead(query) ? (exists ? [[userId]] : []) : undefined);
    await expect(f.repository.upsertProfile(identity, input)).resolves.toEqual({ userId, ...input });
    const lockIndex = f.queries.findIndex(isLock);
    expect(lockIndex).toBeGreaterThan(f.queries.findIndex(isContext));
    expect(lockIndex).toBeLessThan(f.queries.findIndex((query) => query.text.startsWith('insert into "users"')));
    expect(f.queries[lockIndex].params).toEqual([JSON.stringify(["speakql.profile", identity.issuer, identity.subject])]);
    expect(f.queries[lockIndex].text).toContain("hashtextextended($1, 0)");
    const audit = f.queries.find(isAudit)!;
    expect(audit.params).toEqual([userId, exists ? "profile.updated" : "profile.created", "user_profile", userId, "{}"]);
    expect(f.queries.at(-1)?.text).toBe("commit");
  });

  it("uses both issuer and subject in an unambiguous lock key", async () => {
    const f = fixture((query) => isUserRead(query) ? [[userId]] : undefined);
    await f.repository.upsertProfile({ issuer: "a:b", subject: "c" }, input);
    await f.repository.upsertProfile({ issuer: "a", subject: "b:c" }, input);
    const keys = f.queries.filter(isLock).map((query) => query.params[0]);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("rolls back and releases if the identity mapping is unavailable", async () => {
    const f = fixture();
    await expect(f.repository.upsertProfile(identity, input)).rejects.toThrow("Identity mapping could not be created");
    expect(f.queries.some(isProfileRead)).toBe(false);
    expect(f.queries.some(isAudit)).toBe(false);
    expect(f.queries.at(-1)?.text).toBe("rollback");
    expect(f.release).toHaveBeenCalledOnce();
  });

  it("rolls back the profile transaction if its audit insert fails", async () => {
    const f = fixture((query) => {
      if (isUserRead(query)) return [[userId]];
      if (isAudit(query)) throw new Error("mock audit rejection");
    });
    await expect(f.repository.upsertProfile(identity, input)).rejects.toThrow();
    expect(f.queries.some((query) => query.text.startsWith('insert into "user_profiles"'))).toBe(true);
    expect(f.queries.at(-1)?.text).toBe("rollback");
    expect(f.queries.some((query) => query.text === "commit")).toBe(false);
    expect(f.release).toHaveBeenCalledOnce();
  });

  it("classifies concurrent first saves as create then update with a simulated transaction lock", async () => {
    let profileExists = false;
    let lockTail = Promise.resolve();
    const unlock = new Map<number, () => void>();
    const auditActions: unknown[] = [];
    const f = fixture(async (query) => {
      if (isLock(query)) {
        const previous = lockTail;
        lockTail = new Promise<void>((resolve) => unlock.set(query.connection, resolve));
        await previous;
      }
      if (isUserRead(query)) return [[userId]];
      if (isProfileRead(query)) return profileExists ? [[userId]] : [];
      if (isAudit(query)) auditActions.push(query.params[1]);
      if (query.text === "commit") {
        profileExists = true;
        unlock.get(query.connection)?.();
      }
    });
    await Promise.all([f.repository.upsertProfile(identity, input), f.repository.upsertProfile(identity, input)]);
    expect(auditActions).toEqual(["profile.created", "profile.updated"]);
    expect(f.queries.filter(isLock).map((query) => query.params)).toEqual([
      [JSON.stringify(["speakql.profile", identity.issuer, identity.subject])],
      [JSON.stringify(["speakql.profile", identity.issuer, identity.subject])],
    ]);
    expect(f.release).toHaveBeenCalledTimes(2);
  });
});
