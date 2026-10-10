# Phase 2 database security

**Local implementation; PostgreSQL integration is unverified.** No database connection or migration application was performed for this change.

## Credentials and roles

- `MIGRATION_DATABASE_URL` is used exclusively by the Drizzle CLI. It must identify a migration administrator that can own/alter the application tables, create the restricted role, and revoke existing grants. Configuration loads only `.env.local`, preserves explicit process values, and fails if this variable is missing. There is no fallback to `DATABASE_URL` or localhost. The exact same string in both variables is rejected; URI syntax is not proof of a target or of distinct roles.
- `DATABASE_URL` is used exclusively by the application. It must identify a separate, dedicated PostgreSQL `LOGIN` role (for example `speakql_app`) with membership only in `speakql_runtime`. Provision login credentials privately; the migration contains no password and creates no login. Keep migration credentials out of the deployed application environment.
- `0001_runtime-security.sql` creates `speakql_runtime` as `NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION`. It owns no objects. An existing role with this name causes migration failure rather than being silently adopted. Review cluster-wide role state before any approved application.
- An administrator must separately provision the runtime login with no ownership, elevated role attributes, additional role memberships, or direct application-table grants; grant it `speakql_runtime` membership with permission to `SET ROLE`, without an admin option. The login needs database `CONNECT`. Neither login nor group may have `CREATE` on the database or `public` schema, including through `PUBLIC`. A broad existing `PUBLIC` schema grant must be reviewed and corrected by an administrator; this migration does not change database-wide/schema-wide defaults.

The transaction wrapper checks role flags, membership, ownership dependencies, schema/database creation rights, and all three tables' enabled/forced RLS before each operation. It then uses `SET LOCAL ROLE speakql_runtime`. Missing role or unsafe configuration denies the operation before application data is accessed. Catalog access and `SET ROLE` support must be verified with the actual login/pooler. Changing environment credentials requires replacing/restarting the application's pool.

## Grants and RLS

Drizzle's `src/server/db/schema.ts` is the source of truth for tables and policies. The new migration and `0001_snapshot.json` are journaled after the untouched initial migration. The security migration additionally manages role attributes, grants, and `FORCE ROW LEVEL SECURITY`, which Drizzle's schema API does not model; retain those SQL clauses in future migration reviews.

| Table | Runtime privileges | RLS boundary |
|---|---|---|
| `users` | SELECT, INSERT | Exact verified issuer + subject |
| `user_profiles` | SELECT, INSERT; UPDATE only display name, locale, timezone, updated timestamp | Internal UUID maps to that same issuer + subject; both USING and WITH CHECK on updates |
| `audit_events` | INSERT only | Actor maps to that identity; profile resource ID equals actor UUID; action is profile.created/profile.updated |

There is no runtime DELETE/TRUNCATE, user identity UPDATE, or audit SELECT/UPDATE/DELETE grant. INSERT remains table-level because Drizzle includes default-valued columns in INSERT statements. PUBLIC table and column grants and direct grants to existing `anon`, `authenticated`, and `service_role` API roles are revoked on these three tables. Existing application policies make the migration fail for review rather than risk permissive OR-composition. Unknown inherited privileges, privileged functions, and other remote objects still require inspection. No `rls_auto_enable` function or event trigger is changed.

Both profile reads and writes run inside a Drizzle transaction at READ COMMITTED. The server sets `speakql.auth_issuer` and `speakql.auth_subject` using parameterized `pg_catalog.set_config(..., true)`, along with transaction-local role/search-path/RLS settings. Commit/rollback clears local context before pool reuse. Missing or empty context matches no identity. A direct `pg` connection does not convey a Supabase JWT; policies never rely on `auth.uid()`.

The wrapper accepts only identities produced by the server's verified authentication boundary. Custom settings are assertions by the trusted application: anyone with the runtime credential can assert another issuer/subject in SQL. This protects against accidental unscoped application queries and forbidden operations, not compromise of the trusted server or credential. Keep the credential server-side, inspect accessible SECURITY DEFINER routines and inherited/default grants, and continue to enforce authentication before calling the repository. Role checks are configuration guards, not a complete database privilege audit.

Writers acquire a transaction advisory lock derived from an unambiguous issuer/subject tuple **before** identity insertion or profile existence checks. At READ COMMITTED, a waiting writer sees the preceding committed profile and records an update. Hash collisions only serialize unrelated users. All profile writers must follow this protocol. The profile mutation and audit insert share the transaction; either both commit or both roll back. The runtime can insert valid-looking audit entries and privileged administrators can alter audit data: this is not a tamper-proof ledger or trigger-enforced classification.

## Evidence and remaining integration checks

Local tests cover configuration separation/failure, actual Drizzle-generated parameterized SQL and transaction ordering through a mocked driver, role-check rejection, rollback dispatch after failures, pooled transaction release, read/write context, and create/update classification with a simulated concurrent lock. Migration tests compare schema policies with snapshots and review the SQL/grant contract. **These tests do not execute SQL, evaluate PostgreSQL RLS/ACLs, or prove real concurrency or rollback.**

Local verification for this change:

- `npm test -- tests/database-config.test.ts tests/database-client.test.ts tests/postgres-repository.test.ts tests/migration.test.ts` — 4 files, 39 tests passed.
- `npm run typecheck -- --incremental false` — passed.
- Scoped ESLint on the changed TypeScript source/config/tests — passed.
- `drizzle-kit check --dialect=postgresql --out=./drizzle/migrations` using the installed local binary — passed without loading environment files or connecting to a database.

The first test/typecheck run found a malformed table-driven fixture; it was fixed and both checks rerun successfully. The migration/snapshot were generated locally from the Drizzle schema with explicit CLI schema/dialect/output arguments; generation did not load credentials or connect to a target.

Before separately authorizing migration on the designated target, inspect its migration history, owners, roles/memberships/default ACLs, policies, functions, and existing event triggers. In particular, inspect `rls_auto_enable` rather than disabling or replacing it blindly. The security migration deliberately fails on conflicting role/policy state.

Still unverified: migration execution/SQL compatibility on the target; runtime login and pooler behavior; genuine Supabase sessions; missing/empty/spoofed-context and cross-user SQL isolation; forbidden audit UPDATE/DELETE/TRUNCATE and identity/profile ownership changes; context reset after success and rollback on reused physical connections; profile/audit atomic rollback; and real concurrent same-identity first saves producing exactly one create followed by updates. Run those checks with a non-owner runtime login in a separately authorized disposable test database. Phase 2 remains IN_PROGRESS until that evidence exists.
