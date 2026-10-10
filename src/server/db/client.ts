import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { getEnv } from "@/src/lib/env";
import type { AuthenticatedIdentity } from "@/src/server/auth/types";

let pool: Pool | undefined;

export function getDb() {
  const { DATABASE_URL } = getEnv();
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  try {
    const url = new URL(DATABASE_URL);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username || url.pathname.length < 2) throw new Error();
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL URI with an explicit user, host, and database name.");
  }
  pool ??= new Pool({ connectionString: DATABASE_URL, max: 5 });
  return drizzle(pool);
}

type Database = ReturnType<typeof getDb>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Only verified server identities belong here. Custom PostgreSQL settings are
 * assertions by this trusted server, not proof of a JWT or protection against a
 * compromised server/DB credential. Never expose this role directly to clients.
 */
export async function withIdentityTransaction<T>(
  db: Database,
  identity: AuthenticatedIdentity,
  operation: (tx: Transaction) => Promise<T>,
): Promise<T> {
  if (!identity.issuer?.trim() || !identity.subject?.trim() || identity.issuer.includes("\0") || identity.subject.includes("\0")) {
    throw new Error("A verified issuer and subject are required for database access.");
  }
  return db.transaction(async (tx) => {
    // Check every transaction: a pooled login must not own objects, bypass RLS,
    // create privileged roles/schemas, or reach any other role via membership.
    const result = await tx.execute<{ allowed: boolean }>(sql`
      select (
        current_user = session_user
        and login.rolcanlogin and not (login.rolsuper or login.rolbypassrls or login.rolcreatedb or login.rolcreaterole or login.rolreplication)
        and not (runtime.rolcanlogin or runtime.rolinherit or runtime.rolsuper or runtime.rolbypassrls or runtime.rolcreatedb or runtime.rolcreaterole or runtime.rolreplication)
        and pg_catalog.pg_has_role(login.oid, runtime.oid, 'MEMBER')
        and not exists (
          select 1 from pg_catalog.pg_auth_members
          where member = runtime.oid or (member = login.oid and (roleid <> runtime.oid or admin_option))
        )
        and not exists (
          select 1 from pg_catalog.pg_shdepend
          where refclassid = 'pg_catalog.pg_authid'::regclass
            and refobjid in (login.oid, runtime.oid) and deptype = 'o'
        )
        and not pg_catalog.has_schema_privilege(login.oid, 'public', 'CREATE')
        and not pg_catalog.has_schema_privilege(runtime.oid, 'public', 'CREATE')
        and not pg_catalog.has_database_privilege(login.oid, pg_catalog.current_database(), 'CREATE')
        and not pg_catalog.has_database_privilege(runtime.oid, pg_catalog.current_database(), 'CREATE')
        and (select count(*) = 3 from pg_catalog.pg_class c
          join pg_catalog.pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relname in ('users', 'user_profiles', 'audit_events')
            and c.relrowsecurity and c.relforcerowsecurity)
      ) as allowed
      from pg_catalog.pg_roles login, pg_catalog.pg_roles runtime
      where login.rolname = session_user and runtime.rolname = 'speakql_runtime'
    `);
    if (result.rows[0]?.allowed !== true) throw new Error("Database runtime role or RLS configuration is unsafe.");
    await tx.execute(sql`set local role "speakql_runtime"`);
    await tx.execute(sql`
      select pg_catalog.set_config('search_path', 'pg_catalog, public, pg_temp', true),
        pg_catalog.set_config('row_security', 'on', true),
        pg_catalog.set_config('speakql.auth_issuer', ${identity.issuer}, true),
        pg_catalog.set_config('speakql.auth_subject', ${identity.subject}, true)
    `);
    return operation(tx);
  }, { isolationLevel: "read committed" });
}

export async function closeDb(): Promise<void> {
  const current = pool;
  pool = undefined;
  if (current) await current.end();
}
