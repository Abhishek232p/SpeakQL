# SpeakQL Decision Log

## 2026-10-09 — Phase 1 foundation stack

**Status:** Accepted and implemented.

- **Next.js 16.4.0 + React 19.3.0 + TypeScript 5.9.3:** selected for the initial modular-monolith web/API foundation. Official Next.js installation guidance reports Node.js 20.9+ support; the workspace runs Node.js 24.13.0.
- **Next.js App Router and route handlers:** selected for the landing page and `/api/health`, keeping the first deployable surface small.
- **Zod 4.6.0:** selected for environment and response validation. Zod documentation describes TypeScript-first schemas and recommends strict TypeScript.
- **Vitest 5.0.3:** selected for deterministic unit/integration checks. Official guidance requires Node.js >=22.12.0; Node.js 24.13.0 satisfies it.
- **Playwright Test 1.59.1:** installed for future browser regression tests. The Phase 1 browser check used the available OmniRush browser-automation runner instead of adding a redundant test scaffold.
- **ESLint 9.38.0 + eslint-config-next 16.4.0:** selected for static checks. Next.js 16 guidance uses the ESLint CLI rather than `next lint`.
- **PostgreSQL:** remains the intended system of record, but no database package or running database is added in Phase 1. The deterministic foundation does not require external services.

## Rejected or deferred

- No AI provider, speech provider, managed database, deployment target, or paid service was connected.
- No Tailwind or UI dependency was added; the landing page uses scoped global CSS to keep the foundation dependency-light.
- No mobile client or microservice split was introduced.

## 2026-10-10 — Phase 2 identity and persistence boundary

**Status:** Implemented locally; live provider/database verification blocked.

- **Supabase Auth:** selected as the production identity boundary because its official documentation provides Next.js SSR support, server-side JWT validation, and a clear path to Postgres/RLS. No Supabase project credentials are available, so no production authentication claim is made.
- **Drizzle ORM 0.45.4 + node-postgres 8.23.1:** selected over Prisma for a small modular monolith because the SQL schema remains explicit, migrations are first-class, and the driver works directly with PostgreSQL. Prisma remains a valid alternative but would add generated-client and Prisma schema workflow overhead for this initial three-table boundary.
- **PostgreSQL:** remains the system of record. No local PostgreSQL service, `psql`, Docker, or database connector is available in the workspace, so migrations are present but not verified against a live database.
- **Authorization:** deny by default. Profile routes derive identity from a server-side Supabase session; there is no header-based development bypass and no client-supplied user-ID trust.
- **Testing:** pure service tests use an explicitly named in-memory repository to verify validation and ownership behavior. They do not claim to prove PostgreSQL persistence. A live database test suite is deferred until a disposable database is authorized.

## 2026-10-10 — Open-source resource audit

**Status:** Accepted for planning; no new dependency added.

The canonical-repository audit recommends retaining the current Drizzle/Supabase boundary, referencing graphology and pyBKT before adopting a graph/mastery dependency, and deferring LangGraph, Whisper, SpeechBrain, LiveKit, OpenTelemetry, Open edX, and Learning Locker until the corresponding product boundary exists. The immediate engineering priority remains live PostgreSQL verification, not adding a framework. License and maintenance evidence is recorded in `docs/OPEN_SOURCE_RESOURCE_AUDIT.md` and `docs/DEPENDENCY_LICENSE_INVENTORY.md`.

## 2026-10-10 — Supabase integration attempt

**Status:** Blocked safely.

The supplied project reference and URL were inspected. The Supabase CLI is not installed, `.env.local` is absent, and no local environment contains the required connection/auth variables. Credential-free HTTP checks returned `401` from the project Auth and REST endpoints, proving only endpoint reachability. The database password mentioned as exposed was not used; it must be rotated by the project owner before any future connection test. No login, linking, migration, or remote mutation was attempted.

## 2026-10-10 — Free integration environment

**Status:** Accepted for unblock planning; no service provisioned.

Official Supabase documentation confirms the Free plan is sufficient for a disposable Phase 2 test within its 500 MB, two-active-project, quota, and inactivity-pause limits. Neon Free is a valid PostgreSQL-only alternative but does not satisfy the selected Supabase Auth requirement. The minimum action is therefore a user-created disposable Supabase Free project configured locally; no credentials should be sent in chat.

## Evidence

- Next.js official installation documentation: `https://nextjs.org/docs/app/getting-started/installation` (retrieved 2026-10-09).
- Vitest official guide: `https://vitest.dev/guide/` (retrieved 2026-10-09).
- Playwright official installation documentation: `https://playwright.dev/docs/intro` (retrieved 2026-10-09).
- Zod official introduction: `https://zod.dev/` (retrieved 2026-10-09).
