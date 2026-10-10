# Phase 2 Integration Readiness

**Investigation date:** 2026-10-10 (Asia/Calcutta)
**Status:** Phase 2 remains `IN_PROGRESS`.

## Environment availability

Local inspection found:

- Node.js `v24.13.0` and npm `11.6.2` available.
- `psql` unavailable.
- Docker unavailable.
- No PostgreSQL Windows service detected.
- No authenticated database connector exposed by OmniRush.
- No Supabase project URL, anon key, service key, or test session configured.
- No production credentials were requested, read, or logged.
- Supabase CLI discovery returned unavailable; no link or login command was attempted.
- Supabase project URL reachability was checked without credentials: `/auth/v1/health` and `/rest/v1/` returned HTTP 401, confirming the host responds but not proving authentication or database access.

## Free test environment evaluation

### Supabase Free

Official Supabase pricing/platform documentation retrieved 2026-10-10 states that the Free plan provides:

- $0/month.
- 500 MB PostgreSQL database size.
- Two active projects.
- 50,000 monthly active users.
- Free Nano compute.
- Auth, Postgres, Storage, Realtime, and Edge Functions available within quotas.

Relevant limitation: Free projects may be paused after one week of inactivity. Free projects do not provide downloadable database backups, so the project must be disposable and must not contain production data.

**Decision:** Supabase Free is suitable for the requested disposable Phase 2 integration test, but it is not available in this workspace and must be created by the user outside this session. It would satisfy both the PostgreSQL and Supabase Auth prerequisites if configured.

### Neon Free

Official Neon plan documentation retrieved 2026-10-10 states that the Free plan provides PostgreSQL with 1 GB per project, 100 CU-hours per project, scale-to-zero, and free projects/branches within stated limits.

**Decision:** Neon Free is a viable PostgreSQL-only alternative for migration and persistence testing, but it does not supply the selected Supabase Auth integration. It would require a separate Supabase test project or a separately authorized identity provider, so Supabase Free is the lower-complexity unblock for this Phase 2 design.

### Local PostgreSQL

The official PostgreSQL Windows installer is available, but installing software changes the machine and was not authorized. No install was attempted. If the user installs PostgreSQL locally, a disposable database and non-production role can be used without any paid service.

## Integration tests actually executed

### Executed and passing

```text
npm run lint
npm run typecheck
npm test
npm run build
npx drizzle-kit check
git diff --check
npm audit --omit=dev
```

Current result after the audit and migration metadata fixes: 5 test files, 13 tests passed; lint, typecheck, build, Drizzle config validation, Git whitespace validation, and production dependency audit passed.

### Not executable in this environment

```text
npm run db:migrate
```

This requires `DATABASE_URL` pointing to a disposable PostgreSQL instance. It was not retried because no local or authenticated database target is available.

The migration was regenerated with `npx drizzle-kit generate --name identity-foundation` so `drizzle/migrations/meta/_journal.json` and `0000_snapshot.json` now register `drizzle/migrations/0000_identity-foundation.sql` for the established Drizzle workflow. This is a local metadata change only; no remote database was contacted.

Real Supabase-session tests were not run because no Supabase project or test session exists.

## Security findings

1. The application derives identity from a server-side Supabase session and rejects missing identity with HTTP 401.
2. The application does not trust a client-supplied user ID.
3. The direct Drizzle `pg` connection is a server-side database connection. If it uses a privileged Supabase/Postgres role, PostgreSQL RLS will not automatically protect these route queries. Application authorization and RLS are not interchangeable.
4. The current internal `users.id` is different from Supabase `auth.users.id`; if RLS is later used directly on these tables, the schema needs a documented mapping policy or a stable external subject column policy. The current `auth_issuer`/`auth_subject` unique mapping is the application source of truth.
5. Supabase's official RLS guidance requires enabling RLS, revoking default grants, granting only required operations, writing per-operation policies, indexing policy columns, and running pgTAP policy tests. These steps remain unverified.
6. Audit classification was corrected so first profile creation records `profile.created` and subsequent updates record `profile.updated`.
7. Audit rows are still not database-trigger-protected or append-only at the database role level. This remains a hardening follow-up.

## Dependency findings

- `npm audit --omit=dev`: 0 vulnerabilities.
- Full `npm audit`: 9 development-tree vulnerabilities, involving transitive `braces` and `esbuild` paths.
- `npm audit fix --force` was not run because npm proposes breaking downgrades of Next ESLint and Drizzle Kit.

## Minimum user action to unblock Phase 2

Create a disposable Supabase Free project, enable a test auth provider, and provide configuration through a local ignored `.env.local` file—not chat—with:

```text
DATABASE_URL=<disposable project connection string>
NEXT_PUBLIC_SUPABASE_URL=<test project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<test project anon/publishable key>
```

Then provide a test account/session through the browser or local environment. Do not use production data or a service-role key for ordinary application tests.

Once configured, the next run should:

1. Validate the URL without printing it.
2. Apply `npm run db:migrate`.
3. Inspect constraints and indexes.
4. Run real profile persistence, rollback, isolation, and audit tests.
5. Verify valid, missing, invalid, and expired Supabase sessions.
6. Add and run RLS/pgTAP tests if the database access model exposes tables through Supabase roles.
7. Clean test rows or destroy the disposable project.

No production readiness claim is made.

## Resumed secure setup inspection — 2026-10-10

This section supersedes the earlier suggestion to create a project: use the existing user-designated project `hwqdufgiiufyknuoierh`. No new project is needed or authorized.

Verified using command discovery, path-existence checks, Git ignore checks, and source reads:
- Neither global nor project-local Supabase CLI is available; Scoop is also absent. npm is available.
- `supabase/config.toml`, `supabase/.temp/project-ref`, and `.env.local` are absent.
- `.env.local` matches `.gitignore:3`. The three application configuration variables and `SUPABASE_ACCESS_TOKEN` are absent from the current process environment. OS credential-store authentication was not inspected; CLI authentication is unverified, not proven absent.
- The existing journal contains exactly the `0000_identity-foundation` entry; the SQL creates three intended tables, two foreign keys, two audit indexes and one unique identity index. No DROP, TRUNCATE, or data deletion statement appears. ON DELETE actions are referential rules, not immediate deletes. Existing remote objects and migration history remain unknown.
- `db:migrate` is exactly `drizzle-kit migrate`. `drizzle.config.ts` imports `dotenv/config`, which defaults to `.env`, not `.env.local`. It also falls back to localhost if DATABASE_URL is missing. Therefore do not run it until the intended target and explicit environment loading have been verified.

Supported installation: official Supabase CLI documentation supports project-local npm installation on Node 20+; this workspace previously verified Node 24.13.0. With installation permission, run `npm install --save-dev --save-exact supabase` in the workspace, then `npx supabase login` interactively. Do not put a token on the command line or in chat. No installation, initialization, login, linking, or migration was performed in this resumed inspection.

After password rotation, configure DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, and NEXT_PUBLIC_SUPABASE_ANON_KEY privately in `.env.local`. The public URL is `https://hwqdufgiiufyknuoierh.supabase.co`; the key must be publishable/anon, never service-role/secret. The database URL must use only the rotated password. Do not overwrite any configuration created since this inspection.

Once CLI login succeeds, initialize only if config remains absent (`npx supabase init`), then link using `npx supabase link --project-ref hwqdufgiiufyknuoierh`. Linking is not migration authorization or proof of the application's database target. A CLI management login is not a genuine application-user session.

| Acceptance item | Current status | Limitation |
|---|---|---|
| Supported installation method identified | VERIFIED | Official CLI getting-started documentation; no software installed |
| CLI installed | BLOCKED | Not found globally or locally |
| CLI authentication | BLOCKED | Cannot validate without CLI; no process token |
| Project link | BLOCKED | No local link/config |
| Migration SQL/journal review | VERIFIED | Local inspection only; no remote state checked |
| Profile/auth/persistence code | IMPLEMENTED — NOT INTEGRATION-VERIFIED | Prior unit checks do not prove remote integration |
| Local secure configuration | BLOCKED | All three required application variables missing |
| Password rotation confirmed | BLOCKED | Owner confirmation required before use |
| Remote migrations/auth/role/RLS tests | BLOCKED | No verified target or genuine test sessions |
| Drizzle environment loading | FOLLOW-UP | Explicitly load `.env.local` before approved migration; avoid localhost fallback |

Source: https://supabase.com/docs/guides/local-development/cli/getting-started (retrieved 2026-10-10). Phase 2 remains IN_PROGRESS. No regression run was repeated: this inspection changed documentation only and preserved prior generated migrations.
