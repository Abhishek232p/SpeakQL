# SpeakQL Production Deployment Guide & Release Automation

This guide documents the architecture, configuration, security boundaries, migration workflows, and operational procedures for deploying **SpeakQL** to a production environment.

---

## 1. System Architecture & Requirements

SpeakQL is a natural-language learning and human communication platform built with:
- **Application Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Runtime Environment:** Node.js 22 LTS
- **Authentication:** Supabase SSR Auth (Cookie-based session persistence, PKCE, secure tokens)
- **Database:** PostgreSQL with Row-Level Security (RLS) via Drizzle ORM
- **Evaluation Engine:** Provider-agnostic natural language evaluation with input/output length validation, cost bounds, and deterministic linguistic fallbacks

---

## 2. Environment Variables & Secret Configuration

Production environments require explicit environment variables. **No secrets must ever be committed to source control.**

### Application Runtime Variables (Container / Server)

| Variable | Required | Description | Example / Allowed Values |
|---|---|---|---|
| `NODE_ENV` | **Yes** | Node environment mode | `production` |
| `PORT` | No | Server listen port (default: 3000) | `3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase Project API endpoint | `https://[project-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous public key | `eyJhbGciOi...` |
| `DATABASE_URL` | **Yes** | Unprivileged application database user (member of `speakql_runtime`) | `postgresql://speakql_app:[PASSWORD]@[HOST]:[PORT]/[DB]?sslmode=require` |
| `LOG_LEVEL` | No | Logging verbosity | `info`, `warn`, `error` |
| `NEXT_TELEMETRY_DISABLED` | No | Disables Next.js anonymous telemetry | `1` |

> **CRITICAL SECURITY NOTE ON `DATABASE_URL`:**
> The application runtime must connect using an unprivileged database user (`speakql_app`). It must **never** connect as `postgres`, `supabase_admin`, or the table owner. Row Level Security (RLS) is enforced at the database layer.

### Schema Migration Variables (Out-of-band CI/CD runner only)

| Variable | Required | Description | Example / Usage |
|---|---|---|---|
| `MIGRATION_DATABASE_URL` | Only for migrations | Dedicated schema administrator role (`speakql_migrator`). | `postgresql://speakql_migrator:[PASSWORD]@[HOST]:[PORT]/[DB]?sslmode=require` |

> **NEVER** pass `MIGRATION_DATABASE_URL` to the web application runtime container.

---

## 3. Supabase Authentication & Security Configuration

### 3.1 Redirect and Callback URLs
In the Supabase Dashboard (`Authentication -> URL Configuration`):
- **Site URL:** `https://your-production-domain.com`
- **Redirect URLs:**
  - `https://your-production-domain.com/dashboard`
  - `https://your-production-domain.com/login`
  - `https://your-production-domain.com/auth/callback`

### 3.2 Cookie and Session Security
- Supabase SSR manages authentication cookies with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes automatically.
- Next.js proxy middleware in `proxy.ts` / `src/server/auth/supabase-proxy.ts` refreshes session claims on incoming requests prior to server component rendering.
- State-changing API endpoints (such as `PUT /api/profile`) enforce strict `Origin` header matching against `request.url` to prevent cross-site request forgery.

---

## 4. Database Connection & Controlled Migration Procedure

### 4.1 Privilege Separation
SpeakQL enforces strict database privilege separation:
1. **`speakql_migrator` (DDL):** Owns table schemas and migration journals (`drizzle`). Used solely by Drizzle Kit during deployment pipelines.
2. **`speakql_runtime` / `speakql_app` (DML):** Possesses only `SELECT`, `INSERT`, and `UPDATE` on specific tables (`learning_goals`, `user_competencies`, `practice_exercises`, `exercise_evaluations`, `learner_profiles`). It cannot execute `DROP`, `ALTER`, or schema mutations.

### 4.2 Controlled Migration Execution
**Migrations must NEVER be run automatically on application container boot.** Migrations must be run out-of-band by a designated deployment job or database administrator.

To inspect and apply pending migrations safely:
```bash
# 1. Verify connection and dry-run/review migration SQL files
ls -l drizzle/

# 2. Apply migrations using the migration administrator connection string
MIGRATION_DATABASE_URL="postgresql://speakql_migrator:[PASSWORD]@[HOST]:5432/[DB]?sslmode=require" npm run db:migrate
```

### 4.3 Database Rollback Policy
- All schema changes must follow an **expand-and-contract** methodology:
  - Add new columns as nullable or with safe defaults before updating code.
  - Deprecate old columns only after all instances of the previous application version have ceased running.
- In the event of an emergency schema rollback, execute reviewed, explicit SQL reversion scripts rather than dropping tables.

---

## 5. Build, Startup, and Containerization

### 5.1 Local Production Commands
```bash
# Build the production bundle
npm run build

# Start the production server
npm start -- -p 3000
```

### 5.2 Multi-Stage Docker Build
The repository includes an optimized multi-stage `Dockerfile`:
```bash
# Build container image
docker build -t speakql:latest .

# Run container with required environment variables
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON_KEY]" \
  -e DATABASE_URL="postgresql://speakql_app:[PASSWORD]@[HOST]:5432/[DB]?sslmode=require" \
  --name speakql-app \
  speakql:latest
```

### 5.3 Health Check Endpoint
- **URL:** `GET /api/health`
- **Response:** `200 OK` with payload:
  ```json
  { "status": "ok", "service": "speakql" }
  ```
- **Security:** The health check endpoint confirms process responsiveness without leaking connection strings, database schemas, internal stack traces, or environment secrets.
- **Container integration:** The `Dockerfile` includes an automated healthcheck:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
  ```

---

## 6. Continuous Integration & Security Automation

GitHub Actions CI is configured in `.github/workflows/ci.yml` and triggers on pushes and pull requests to `main`:

1. **Lint & Typecheck:** Runs `npm run lint` (ESLint 9) and `npm run typecheck` (`tsc --noEmit`).
2. **Tests & Secret Scanning:** Runs `npm test` (Vitest), executing all 19 unit/integration test suites, including automated scanning for hardcoded keys, passwords, and sensitive tokens.
3. **Build Verification:** Executes `npm run build` using synthetic, non-sensitive CI environment variables to verify compilation integrity.

> **Pull Request Security:** No production secrets or live database connection strings are exposed to GitHub Actions runner environments on pull requests.

---

## 7. Repeatable Production Acceptance Testing

A dedicated automated acceptance test script is provided in `scripts/production-acceptance-test.mjs`.

### 7.1 Running Against Staging or Production
```bash
SPEAKQL_BASE_URL="https://your-production-app.com" node scripts/production-acceptance-test.mjs
```

### 7.2 Verified Gates
1. `health_endpoint`: Validates `/api/health` returns `200` and `{ status: "ok", service: "speakql" }`.
2. `landing_page_accessible`: Validates `/` is publicly accessible.
3. `login_page_accessible`: Validates `/login` serves the authentication interface.
4. `unauthenticated_dashboard_protected`: Confirms that accessing `/dashboard` without credentials redirects to `/login`.
5. `unauthenticated_api_protected`: Confirms `/api/profile` returns `401 {"error":"unauthenticated"}`.
6. `authenticated_flow` (optional): If `SPEAKQL_TEST_EMAIL` and `SPEAKQL_TEST_PASSWORD` are supplied, validates live authentication and token issuance.

---

## 8. AI Evaluation Architecture & Deterministic Fallback

SpeakQL evaluates learners' natural-language responses (clarity, tone, vocabulary, relevance, conciseness).

### Current Status: Deterministic Evaluation
- In the absence of an external AI provider API key, SpeakQL operates in **deterministic fallback mode**.
- The evaluation engine parses length, vocabulary usage, keyword alignments, structure, and clarity heuristically.
- **Full Transparency:** The user interface explicitly labels deterministic evaluations to prevent misleading learners or stakeholders.

### Enabling an External LLM Provider
To integrate a live LLM evaluation provider (e.g., Google Gemini or Anthropic Claude):
1. Implement the `EvaluationProvider` contract in `src/server/evaluation/contracts.ts`.
2. Configure provider credentials via secure server-side environment variables (e.g. `GEMINI_API_KEY`).
3. Enforce strict token, cost, and timeout limits (already guarded in `src/server/evaluation/boundary.ts`).
4. Ensure the deterministic evaluation remains active as a fallback if the external provider times out or experiences an outage.

---

## 9. Rollback Procedures

### 9.1 Application Rollback
If a defect is detected in a new release:
1. **Container/Kubernetes:** Revert the deployment image tag to the previous stable release SHA:
   ```bash
   # Example: Kubernetes
   kubectl set image deployment/speakql speakql=speakql:previous-stable-sha
   # Or via cloud provider rollback button (Vercel, AWS ECS, Fly.io)
   ```
2. Verify system restoration via `node scripts/production-acceptance-test.mjs`.

### 9.2 Infrastructure & Database Rollback
1. If migrations were applied, verify whether the schema changes were non-breaking (expand-and-contract).
2. If rollback of application code does not require schema changes, keep the expanded schema in place.
3. If an emergency schema rollback is required, run pre-tested down-migration scripts using `MIGRATION_DATABASE_URL`.
