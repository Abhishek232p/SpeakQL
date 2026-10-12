# SpeakQL

## Current Phase 2 security configuration

Phase 2 remains IN_PROGRESS. See `docs/DATABASE_SECURITY.md` and the latest section of `docs/IMPLEMENTATION_STATUS.md` for current evidence, superseding older setup notes below.

- `DATABASE_URL`: restricted application-runtime login only.
- `MIGRATION_DATABASE_URL`: separate migration-owner connection, loaded by Drizzle explicitly from `.env.local` or process environment. No runtime URL fallback.
- Supabase URL and publishable/anon key keep their existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` names.
- Do not run migrations before read-only target, policy, role and event-trigger review. Migration `0001_runtime-security` has not been applied remotely.
- Profile PUT requires `application/json` and an explicit same-origin `Origin` header; no-store responses and generic server errors are enforced.
- Local migration metadata check without credentials: `npx --no-install drizzle-kit check --dialect=postgresql --out=./drizzle/migrations`.

The local 100-test suite includes mocks, not evidence of live persistence/authentication or RLS enforcement.

SpeakQL is an adaptive professional learning and performance-intelligence system. It treats language, domain knowledge, communication, contextual judgment, and practical performance as connected but distinct competencies.

## Current status

Phase 1 foundation is implemented and verified. The workspace now contains a minimal Next.js application, a responsive landing page, environment validation, structured server logging, and a deterministic health endpoint. The learning product itself is not yet implemented.

## Prerequisites

- Node.js 24.x (Node.js 20.9+ is supported by the selected Next.js version; Vitest requires Node.js 22.12+).
- npm 11.x.

## Installation and configuration

```bash
npm install
copy .env.example .env.local
```

The current configuration accepts `NODE_ENV`, `LOG_LEVEL`, and optional Phase 2 database/auth settings. Unknown environment variables are not returned by the typed configuration object. Do not place credentials in client-visible variables.

## Phase 2 persistence and identity

Phase 2 uses Drizzle ORM with PostgreSQL and defines SQL migrations for `users`, `user_profiles`, and `audit_events`. Supabase Auth is the selected production identity-provider boundary. Its server boundary is implemented, but genuine Supabase signup/login/session behavior is not integration-verified here; until a verified session and database target exist, protected profile routes deny access rather than using a development bypass.

With a disposable PostgreSQL database configured in `DATABASE_URL`, apply migrations with:

```bash
npm run db:migrate
```

The profile API is `GET /api/profile` and `PUT /api/profile`. It derives identity from the server-side Supabase session and never accepts a client-supplied user ID. Live database migration and persistence tests remain blocked until PostgreSQL is available.

For a separately authorized disposable PostgreSQL target, the Phase 2 security harness is:

```bash
npm run test:security:integration
```

It requires three private connection URLs in `.env.local` (`SPEAKQL_SECURITY_TEST_ADMIN_DATABASE_URL`, `SPEAKQL_SECURITY_TEST_ALICE_DATABASE_URL`, and `SPEAKQL_SECURITY_TEST_BOB_DATABASE_URL`) plus `SPEAKQL_SECURITY_TEST_ALLOW_MUTATION=1`. The harness never applies migrations and proves database/RLS behavior only; it does not claim Supabase Auth signup, login, cookie, JWT, or session E2E.

## Development and verification commands

```bash
npm run dev                 # local development server at http://localhost:3000
npm run typecheck          # TypeScript validation
npm test                   # deterministic Vitest suite
npm run lint               # ESLint
npm run build              # production build
npm run start              # serve the production build
npm run health-check       # checks GET /api/health; server must be running
```

Health endpoint: `GET http://localhost:3000/api/health`

Healthy response:

```json
{"service":"speakql","status":"ok","version":"0.1.0"}
```

## First vertical slice

The next implementation target is a deterministic, text-first learning loop:

`create goal -> resolve competencies -> create session -> persist turns -> complete -> evaluate structured evidence -> record mistake -> compute next action`

## Documentation

- `docs/BASELINE_AUDIT.md`
- `docs/TOOL_AND_MCP_INVENTORY.md`
- `docs/ARCHITECTURE.md`
- `docs/EVALUATION_BOUNDARY.md`
- `docs/IMPLEMENTATION_STATUS.md`

No production deployment, external provider, paid resource, or regulated-profession certification claim is implied by this repository.
