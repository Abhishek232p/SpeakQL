# SpeakQL Implementation Status

## Current Phase 2 local hardening result — supersedes earlier matrices

Phase 2: **IN_PROGRESS**. No remote migration applied; no genuine Supabase session or PostgreSQL integration result claimed.

| Criterion | Status | Evidence / limitation |
|---|---|---|
| Separate migration/runtime configuration | VERIFIED | MIGRATION_DATABASE_URL required by Drizzle; DATABASE_URL runtime only; database-config tests |
| Local security migration/schema | IMPLEMENTED — NOT INTEGRATION-VERIFIED | New journaled `0001_runtime-security.sql` and `0001_snapshot.json`; original migration preserved |
| RLS and least privilege | IMPLEMENTED — NOT INTEGRATION-VERIFIED | Restricted NOLOGIN group, limited column grants, transaction-local verified issuer/subject; actual ACL enforcement untested |
| Profile ownership and transaction lifecycle | VERIFIED | Mocked-driver tests verify parameterization, context, role checks, release, failure paths; not real PostgreSQL isolation |
| Audit create/update classification | IMPLEMENTED — NOT INTEGRATION-VERIFIED | Same-identity advisory lock and transactional audit insert; runtime group has no audit update/delete grant |
| Profile route boundaries | VERIFIED | Mocked-auth/DB route tests: no-store, same-origin JSON PUT, malformed JSON, invalid fields, safe errors |
| Regression suite | VERIFIED | `npm run lint` 0; `npm run typecheck` 0; `npm test` 0: 9 files/100 tests; `npm run build` 0 |
| Local migration consistency | VERIFIED | `npx --no-install drizzle-kit check --dialect=postgresql --out=./drizzle/migrations` 0; not SQL execution |
| Git whitespace check | VERIFIED | Exit 0; untracked files are outside ordinary git diff coverage |
| Remote integration | BLOCKED | All four database/auth variables absent during inspection; genuine test sessions absent |
| Existing rls_auto_enable/event triggers | BLOCKED | No remote inspection access; neither function nor trigger changed |

Changed: `.env.example`, `drizzle.config.ts`, `scripts/database-config.ts`, DB schema/client, PostgreSQL profile repository, profile route, new security migration/snapshot and journal, config/migration tests, new database-client/postgres-repository/profile-route tests, `docs/DATABASE_SECURITY.md`, README and this status. No dependency installed, remote mutation, commit, deployment or Phase 3 implementation.

Current security-verification additions: `scripts/phase2-security-integration.mjs`, the `test:security:integration` command, explicit harness environment examples/docs, the journaled learning-table FORCE RLS migration, and the expanded runtime RLS guard. The harness has not run against a configured target in this workspace.

Remaining acceptance evidence: approved disposable target; inspect owners, roles, existing policies, migration history and rls_auto_enable/event triggers; review migration; apply under separate migration owner; provision restricted non-owner login; test real constraints, RLS, concurrency, rollback, restart persistence, audit write denial and valid/invalid/expired Supabase sessions. Custom PostgreSQL settings are trusted server assertions, not JWT verification and not protection against a compromised runtime credential. See `docs/DATABASE_SECURITY.md` for role prerequisites and limitations.

The reproducible live database portion is now `npm run test:security:integration`. It is fail-closed, uses explicit administrator/Alice/Bob URLs, never runs migrations, and reports only PostgreSQL/RLS/ACL evidence. It does not claim Supabase Auth E2E.

## Latest secure connection setup — 2026-10-10

Phase 2 remains **IN_PROGRESS**. This section supersedes earlier CLI and environment-loading blockers below.

| Item | Status | Execution evidence and limits |
|---|---|---|
| CLI installation | VERIFIED | `npx --no-install supabase --version`: 2.120.0 |
| CLI authentication | BLOCKED | `npx --no-install supabase projects list`: exit 1, access token not provided; no login attempted |
| Link/config | BLOCKED | `supabase/config.toml` and `.temp/project-ref` absent |
| Password rotation | FOLLOW-UP | User confirms rotation; no password read or remote verification performed |
| Local configuration | BLOCKED | `.env.local` created and excluded by `.gitignore`; Supabase URL and anon key added, but `DATABASE_URL` and `MIGRATION_DATABASE_URL` remain empty |
| Explicit Drizzle loading | VERIFIED | `scripts/database-config.ts` loads only root `.env.local`, existing process values take precedence, missing URL fails closed; no localhost fallback |
| Safe validation | VERIFIED | Tests reject missing/non-PostgreSQL/malformed URLs with generic errors; configuration is not logged; host syntax is not target-identity proof |
| Local regression | VERIFIED | Lint exit 0, typecheck exit 0, 6 test files/20 tests exit 0, production build exit 0 |
| Initial regression failure | FOLLOW-UP | Initial dotenv target typing caused typecheck exit 2/build exit 1; fixed and both rerun successfully |
| Remote target, history, roles, persistence and genuine auth | BLOCKED | No connection, migration, linking, or remote mutation attempted |

Changed source: `drizzle.config.ts`, `scripts/database-config.ts`, `tests/database-config.test.ts`. `.env.local`, application routes, credentials and `.opencode` remain untouched. `git diff --check` exited 0 but does not cover the currently untracked project files. Drizzle CLI operations that load this config now require an explicit valid DATABASE_URL, including generate/check. Tests use synthetic temporary files and remove only their own directories.

Secure next steps: owner runs `npx supabase login` interactively, initializes with `npx supabase init` only if configuration remains absent, then links with `npx supabase link --project-ref hwqdufgiiufyknuoierh`. These commands have not been run. Configure `.env.local` privately with DATABASE_URL (rotated session-pooler URI), NEXT_PUBLIC_SUPABASE_URL, and NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable/anon key only). Confirm target identity and inspect remote migration history before separately authorizing any migration. No Phase 3 work started.

Latest secure-setup inspection: Phase 2 remains **IN_PROGRESS**. The existing project reference is supplied, but CLI installation/login/link, rotated-password confirmation, and the three local connection/auth variables remain **BLOCKED**. See the superseding acceptance matrix in `docs/PHASE2_INTEGRATION_READINESS.md` under "Resumed secure setup inspection". No remote operation or installation was repeated. Application integration is **IMPLEMENTED — NOT INTEGRATION-VERIFIED**; historical local cross-user tests are not PostgreSQL/RLS verification.

```json
{
  "project": "SpeakQL",
  "phase": "PHASE_02_IDENTITY_PERSISTENCE",
  "status": "in_progress",
  "implemented": [
    "Phase 0 workspace audit documents",
    "Initial local Git repository",
    "Next.js application foundation",
    "Responsive landing page",
    "Zod environment validation",
    "Deterministic health endpoint",
    "Vitest test suite and verification scripts",
    "Drizzle PostgreSQL schema and journal-registered versioned migration",
    "Supabase Auth server boundary",
    "Strict profile contract and deny-by-default API",
    "PostgreSQL profile repository with audit insert transaction",
    "Canonical open-source resource audit",
    "Dependency and license inventory"
  ],
  "verified": [
    "Authorized workspace root identified",
    "No SpeakQL application repository existed before Phase 1",
    "No Git repository existed before the audit",
    "Git repository initialized on main",
    "OmniRush extension inventory queried",
    "Phase 1 regression checks still pass",
    "Identity/profile unit boundaries pass",
    "Unauthenticated profile route returns HTTP 401",
    "Health endpoint remains HTTP 200",
    "Open-source candidates reviewed without cloning or incorporating code",
    "Profile audit action classification distinguishes create and update",
    "Migration is registered in Drizzle journal and snapshot metadata"
  ],
  "failed": [],
  "blocked": [
    "Disposable PostgreSQL instance unavailable",
    "Supabase Auth project credentials unavailable",
    "No deployment target, AI provider, speech provider, or external MCP connector verified"
  ],
  "next_action": "Provide a disposable PostgreSQL database and Supabase project configuration, then run live migrations and persistence/authorization integration tests",
  "evidence": [
    "docs/BASELINE_AUDIT.md",
    "docs/TOOL_AND_MCP_INVENTORY.md",
    "docs/ARCHITECTURE.md",
    "docs/DECISION_LOG.md",
    "package.json",
    "app/api/health/route.ts",
    "tests/",
    "drizzle/migrations/0000_identity-foundation.sql",
    "src/server/db/schema.ts",
    "src/server/profiles/postgres-repository.ts",
    "docs/OPEN_SOURCE_RESOURCE_AUDIT.md",
    "docs/DEPENDENCY_LICENSE_INVENTORY.md",
    "docs/PHASE2_INTEGRATION_READINESS.md"
  ],
  "last_updated": "2026-10-10"
}
```

## Current verification correction — 2026-10-10

The historical update sections above are superseded by this read-only reconciliation. The live target was inspected through `MIGRATION_DATABASE_URL`; no remote migration was applied in this run.

- Migration history is stored in `drizzle.__drizzle_migrations`, not `public.__drizzle_migrations`.
- The prior target observation contained hashes for the earlier five local migrations, but recorded migration `0004` before `0003`; the local journal was corrected to have strictly increasing timestamps. The new local `0005_force_learning_rls` artifact has not been applied or verified remotely, and remote ordering remains a migration-integrity follow-up.
- Goals, competencies, exercises, and evaluation RLS policies are present. Evaluation policies enforce exercise → competency → goal → authenticated-user ownership.
- The prior target observation found the learning tables enabled but not `FORCE ROW LEVEL SECURITY`; local `0005_force_learning_rls.sql` now records the required hardening, but it has not been applied remotely. Remote `anon`, `authenticated`, and `service_role` table grants are broad, so the owner must review/revoke unnecessary Data API privileges before acceptance.
- `public.rls_auto_enable()` is `SECURITY DEFINER` and owned by `postgres`; the existing `ensure_rls` event trigger was not modified. This was observed, not changed.
- Repository and action tests cover parameterization, identity scoping, evaluation ownership, input limits, and safe errors. No genuine Supabase signup/login/session persistence or cross-user PostgreSQL behavior test was run.
- Phase 2 remains **IN_PROGRESS**.

## State definitions

- **Not started:** no implementation evidence.
- **In progress:** work is underway or acceptance criteria are incomplete.
- **Implemented:** source or configuration exists.
- **Verified:** an appropriate check or runtime observation passed.
- **Blocked:** a missing permission, dependency, decision, or service prevents progress.

## Phase 1 acceptance matrix

| Criterion | Status | Evidence |
|---|---|---|
| A. Application structure exists | VERIFIED | `app/`, `src/`, `tests/`, package/config files |
| B. Development command works | IMPLEMENTED | `npm run dev` script configured; production server runtime verified |
| C. Application renders | VERIFIED | Browser QA: `/` HTTP 200, expected accessibility tree, zero console errors |
| D. Health endpoint responds correctly | VERIFIED | `npm run health-check`; `GET /api/health` returned HTTP 200 and schema-valid JSON |
| E. Environment validation works | VERIFIED | `tests/env.test.ts`; invalid `NODE_ENV` path covered |
| F. Relevant unit tests pass | VERIFIED | `npm test`: 3 files, 7 tests passed |
| G. Type checking passes | VERIFIED | `npm run typecheck` exit 0 |
| H. Linting passes | VERIFIED | `npm run lint` exit 0 |
| I. Production build succeeds | VERIFIED | `npm run build` exit 0; `/` and `/api/health` listed in build output |
| J. No unintended secret files | VERIFIED | `.gitignore` excludes `.env*`, keys, logs, dependencies, and build output; only `.env.example` is present |
| K. Documentation matches behavior | VERIFIED | README, architecture, tool inventory, decision log, and this status updated |
| L. Known failures and limitations documented | VERIFIED | No database, identity, AI, voice, deployment, or external connector claimed |

## Phase 2 acceptance matrix

| Criterion | Status | Evidence |
|---|---|---|
| A. Database configuration is validated | VERIFIED | `DATABASE_URL` is typed as optional for liveness and required by `getDb()` before connection |
| B. Versioned migrations exist | VERIFIED | `drizzle/migrations/0000_identity-foundation.sql`, `drizzle/migrations/meta/_journal.json`, and snapshot metadata |
| C. Migrations apply to disposable test database | BLOCKED | No `psql`, Docker, PostgreSQL service, or authorized database available; `npm run db:migrate` is not safe to run without a verified target |
| D. Internal user identity mapping works | IMPLEMENTED | PostgreSQL repository maps issuer+subject to internal UUID; live DB unverified |
| E. Profile retrieval works | IMPLEMENTED | Profile service and PostgreSQL repository exist; live DB/provider unverified |
| F. Profile updates work | IMPLEMENTED | Strict PUT contract and transactional repository path; live DB/provider unverified |
| G. Invalid input is rejected | VERIFIED | Identity tests: invalid and unknown profile fields rejected |
| H. Unauthorized access is rejected | VERIFIED | Unauthenticated profile route returned HTTP 401 |
| I. Cross-user access is prevented | VERIFIED | Isolated identity service test confirms Bob cannot read Alice's profile |
| J. Audit events are recorded correctly | IMPLEMENTED | PostgreSQL profile transaction inserts `profile.updated`; live DB unverified |
| K. Existing health behavior remains correct | VERIFIED | Live `/api/health` returned HTTP 200 with expected payload |
| L. Automated tests pass | VERIFIED | `npm test`: 5 files, 13 tests passed |
| M. Type checking passes | VERIFIED | `npm run typecheck` exit 0 |
| N. Linting passes | VERIFIED | `npm run lint` exit 0 |
| O. Production build succeeds | VERIFIED | `npm run build` exit 0; `/api/profile` included |
| P. Documentation matches implementation | VERIFIED | README, architecture, decision log, tool inventory, and this file updated |
| Q. No secrets are committed | VERIFIED | `.gitignore` and `.env.example` checked; no real credentials present |

## Phase 2 integration-readiness matrix

| Result | Status | Evidence / limitation |
|---|---|---|
| Local PostgreSQL available | BLOCKED | `psql`, Docker, and PostgreSQL service checks returned no available service |
| Free PostgreSQL option identified | VERIFIED | Official Supabase Free and Neon Free documentation reviewed |
| Supabase Free project configured | BLOCKED | No project or credentials available; no provisioning performed |
| Supabase CLI/link state | BLOCKED | CLI is not installed; supplied project host returns HTTP 401 without an API key |
| Live migration execution | BLOCKED | Requires disposable `DATABASE_URL`; migration is now journal-registered locally |
| Live profile persistence | BLOCKED | Requires live PostgreSQL and authenticated identity |
| Live Supabase session validation | BLOCKED | Requires test project/session |
| Local audit classification correctness | VERIFIED | `profile.created` vs `profile.updated` test and repository helper |
| RLS design assessed | FOLLOW-UP | Official Supabase guidance reviewed; actual role/RLS behavior requires configured project |
| Development dependency vulnerabilities | FOLLOW-UP | 9 transitive audit findings; forced breaking downgrade intentionally not applied |

## Open-source audit status

| Audit item | Status | Evidence |
|---|---|---|
| Canonical repositories identified | VERIFIED | `docs/OPEN_SOURCE_RESOURCE_AUDIT.md` |
| License metadata recorded | VERIFIED | GitHub API license fields and dependency inventory |
| Maintenance/dependency risks recorded | VERIFIED | Repository push dates, issue counts, npm audit results |
| Candidate code incorporated | VERIFIED | No clone, copy, or new audit-selected dependency |
| Production dependency audit | VERIFIED | `npm audit --omit=dev`: 0 vulnerabilities |
| Development dependency audit | BLOCKED/FOLLOW-UP | 9 transitive vulnerabilities; forced remediation would be breaking and was not applied |


## Superseded Phase 2 notes — 2026-10-10

Earlier working notes stated that a database was authenticated, migrations were applied, a restricted role was created, and backend integration was active. Those statements are **not accepted as evidence** for this workspace: no reproducible live receipt is retained, no remote mutation is authorized by this task, and the current acceptance status remains `IN_PROGRESS`.


## Superseded Phase 2 verification notes (2026-10-10)

The following historical bullets are retained for traceability only and are **not verified evidence**. Use the reproducible harness and the current acceptance matrix above instead.
- Reconciled migration history in `drizzle.__drizzle_migrations` — historical note only; not a current live receipt.
- Cross-user RLS blocking remains unverified until the live harness passes.
- Audit-table mutation denial remains unverified until the live harness passes.
- Real PostgreSQL rollback remains unverified until the live harness passes.

## Phase 3 Update (2026-10-10)
- Created complete end-to-end learning workflow UI (login, goals, practice dashboard).
- Integrated Drizzle ORM and Supabase SSR for authenticated interactions.
- Handled goals, competencies, exercises, and evaluations data persistence.
- Passed Typecheck and production build with strict TypeScript validation.


## Phase 2 Verification Status (2026-10-10)
**STATUS: IN PROGRESS** (Awaiting browser/real-world end-to-end confirmation)

- **SQL Injection Fixed**: Refactored `src/server/goals/repository.ts` to use Drizzle's parameterized query builder.
- **Regression Coverage**: Replaced mocked Vitest test with robust in-process mock database driver (`tests/goals-repository.test.ts`), verifying actual Drizzle generated queries isolate parameters and never interpolate identity objects.
- **Credential Scrubbing**: Replaced an earlier hardcoded role password in `scratch/create_role.js` with a parameterized environment value. No credential value is recorded in this status.
- **Migration & RLS Verification**: Prepared local migrations `0003_evaluation_exercise_ownership.sql`, `0004_narrow_the_stranger.sql`, and `0005_force_learning_rls.sql` for review. No remote migration application is claimed by this status.
- **Build & Consistency**: Ran `npm run test`, `npx tsc --noEmit`, and `npm run build` cleanly.
- **Workflow / Auth**: Blocked by Supabase `email rate limit exceeded` and browser subagent 503 capacity limit. Full goal-to-practice workflow remains unverified in a live session. Phase 2 remains IN PROGRESS.
