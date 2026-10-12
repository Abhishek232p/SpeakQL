# SpeakQL Architecture

**Status:** Phase 2 identity/persistence boundary implemented; live provider and PostgreSQL verification remain blocked by unavailable credentials/services.

## Goal

Create a modular system that helps a learner move from a professional or communication goal through competency practice, realistic text simulation, evidence-backed evaluation, persistent mistakes, and a next-best action. Language, domain knowledge, communication, contextual judgment, and practical performance are separate competencies connected by explicit dependencies.

## Initial deployment shape

Start as a modular monolith with one web/API application and one relational database. Add worker processes only when background work (curriculum generation, transcription, or evaluation) has a demonstrated durability or latency requirement. Do not introduce microservices, vector search, LiveKit, or Temporal by default.

### Proposed modules

- `identity`: registration/authentication adapter, authorization, profiles, audit events.
- `goals`: goal, target role, environment, constraints, and revisions.
- `competencies`: competency records, dependencies, graph validation, mastery state.
- `curriculum`: versioned curriculum nodes and learning objectives.
- `sessions`: teaching and simulation sessions, turns, completion state.
- `evaluation`: rubric versions, evidence references, model interpretation, uncertainty.
- `memory`: mistakes, corrections, retention checks, coach memory, next action.
- `providers`: provider-neutral AI and speech interfaces with usage/cost records.
- `operations`: health checks, structured logs, correlation IDs, and audit trails.

Phase 1 implemented the `operations` foundation. Phase 2 adds the identity boundary, Drizzle schema/migration artifacts, profile contract/service, PostgreSQL repository, and audit-event insert path. The current learning slice adds goal-owned exercises, a provider-neutral evaluation boundary with an explicit non-AI fallback, and analytics derived from stored evaluations; richer curriculum, sessions, and external provider adapters remain deferred.

## Technology recommendation

The current workspace does not contain an application stack, so this is a proposal rather than an installed choice.

- Web/API: Next.js 16.4.0 App Router with React 19.3.0 and TypeScript 5.9.3. Route handlers provide the initial API boundary.
- System of record: PostgreSQL with versioned Drizzle SQL migrations.
- Database access: Drizzle ORM 0.45.4 with `pg` 8.23.1. No second ORM is used.
- Identity: Supabase Auth via `@supabase/ssr` 0.12.7. Routes reject unauthenticated requests when Supabase configuration/session is unavailable.
- Validation: Zod 4.6.0 for environment and response schemas; strict TypeScript is enabled.
- Testing: Vitest 5.0.3 for deterministic checks, ESLint for static analysis, and Playwright Test 1.59.1 reserved for browser regression tests.
- AI: provider-neutral adapter; model output validated before persistence.
- Retrieval: relational data first; pgvector only after a measured retrieval need.
- Voice: a verified streaming provider only after text simulation passes end-to-end.
- Jobs: a simple database-backed or runtime queue initially; durable workflow tooling later if required.

## Trust boundaries

1. Browser/mobile client is untrusted and never receives provider secrets.
2. API enforces authenticated ownership and authorization on every user-scoped read/write.
3. Provider adapters receive only the minimum context needed for a request.
4. Raw evidence is stored separately from model-generated interpretation and mastery estimates.
5. Administrative and audit operations are isolated from learner-facing operations.
6. A client-supplied user ID is never treated as an authenticated identity.

## Domain and data principles

- Every user-scoped record has an ownership path that can be authorized.
- Competency dependencies are directed and cycle-checked.
- Evidence stores source references, timestamps, context, and quality.
- Evaluations include rubric/version, confidence, supporting evidence, and an explicit non-certification disclaimer where relevant.
- Mastery is an estimate with algorithm/version metadata, not objective truth.
- External knowledge includes provenance, jurisdiction/context, retrieval date, and review status.

## First vertical slice

The first implementation should be deterministic and text-first:

`create goal -> resolve seeded competencies -> create session -> persist turns -> complete -> produce structured evaluation fixture -> record mistake/evidence -> compute next action`.

An external LLM is not required for this first slice. The current slice uses a deterministic non-AI fallback and stores its source/criteria in the existing evaluation feedback column. If an external provider is introduced later, its adapter must support timeouts, schema validation, redacted logging, usage recording, and controlled fallback.

## Phase 1 runtime behavior

- `/` renders a responsive, accessible product-direction landing page.
- `/api/health` returns a public, secret-free liveness response with `cache-control: no-store`.
- Invalid `NODE_ENV` produces a safe HTTP 503 configuration error without exposing the invalid value.
- No PostgreSQL connection is attempted in Phase 1; database readiness is intentionally separate from liveness.

## Phase 2 runtime behavior

- `/api/profile` requires a verified server-side Supabase identity and returns HTTP 401 without one.
- `PUT /api/profile` validates a strict profile DTO and never accepts `userId` from the request body.
- The PostgreSQL repository maps `(auth_issuer, auth_subject)` to an internal UUID, upserts the profile, and inserts an audit event in one transaction.
- The current route returns a controlled database-unavailable response when `DATABASE_URL` is absent. The in-memory repository is test-only and is not wired into production routes.
- Audit rows are protected from ordinary profile writes by application boundaries; database-level append-only enforcement remains a future hardening item.

## Rejected or deferred choices

- **Mobile app:** deferred until the responsive web learning loop proves demand.
- **Microservices:** deferred; no scale or team boundary evidence exists.
- **Vector database:** deferred; relational competency/evidence queries come first.
- **Voice provider:** deferred until text-session persistence and evaluation are verified.
- **Managed backend/Supabase:** not selected because no requirements, credentials, or cost authorization were provided.

## Security baseline

Use server-side secrets, least-privilege database access, parameterized queries/ORM, input limits, rate limiting, structured audit events, data retention controls for audio/transcripts, and prompt-injection defenses for tool-using AI. No regulated-profession readiness result may be presented as a license, certification, or employment guarantee.
