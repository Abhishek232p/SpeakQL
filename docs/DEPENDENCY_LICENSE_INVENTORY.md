# SpeakQL Dependency and License Inventory

**Audit date:** 2026-10-10

This inventory covers direct runtime/development dependencies and the open-source candidates reviewed for future phases. It is not a complete transitive SBOM; generate one before release.

## Direct dependencies

| Package | Declared version | License | Scope | Status |
|---|---:|---|---|---|
| next | 16.4.0 | MIT | runtime | Installed |
| react / react-dom | 19.3.0 | MIT | runtime | Installed |
| zod | 4.6.0 | MIT | runtime | Installed |
| drizzle-orm | ^0.45.4 | Apache-2.0 | runtime | Installed |
| pg | ^8.23.1 | MIT | runtime | Installed |
| @supabase/ssr | ^0.12.7 | MIT | runtime | Installed |
| @supabase/supabase-js | ^2.117.3 | MIT | runtime | Installed |
| typescript | 5.9.3 | Apache-2.0 | development | Installed |
| drizzle-kit | ^0.31.11 | Apache-2.0 | development | Installed |
| dotenv | ^17.2.3 | BSD-2-Clause | development | Installed |
| vitest | 5.0.3 | MIT | development | Installed |
| @playwright/test | 1.59.1 | Apache-2.0 | development | Installed |
| eslint / eslint-config-next | 9.38.0 / 16.4.0 | MIT | development | Installed |

## Future candidates not installed

| Candidate | License | Decision |
|---|---|---|
| graphology | MIT | Reference now; reassess for competency graph reuse |
| CAHLR/pyBKT | MIT | Reference/adapt only after evidence model and Python boundary exist |
| langgraph | MIT | Reference now; adapt only for durable multi-step AI workflows |
| openai/whisper | MIT | Adapt behind a worker/provider boundary; review model/runtime cost |
| speechbrain | Apache-2.0 | Reference/adapt after pronunciation evaluation experiments |
| livekit/agents | Apache-2.0 plus model-specific licenses | Reference now; adapt in voice phase |
| Learning Locker | GPL-3.0 | Reject for embedding; reference xAPI ideas only |
| Open edX | AGPL-3.0 | Reference only; do not embed in the MVP |
| OpenTelemetry JS | Apache-2.0 | Reuse when observability boundaries exist |

See `docs/OPEN_SOURCE_RESOURCE_AUDIT.md` for repository URLs, maintenance evidence, compatibility analysis, and source/doc inspection notes. No candidate code has been copied.

## Dependency health evidence

- `npm audit --omit=dev`: **0 vulnerabilities** in production dependencies.
- Full `npm audit`: **9 development-tree vulnerabilities** (4 moderate, 5 high), involving `braces` through the Next ESLint dependency chain and `esbuild` through Drizzle Kit's deprecated `@esbuild-kit` chain.
- npm's suggested automatic remediation requires `npm audit fix --force`, which would downgrade `eslint-config-next` to 14.2.35 and `drizzle-kit` to 0.18.1. That is a breaking, unsafe remediation for this Next.js 16 project and was not run.
- This is a development-tooling risk, not a reported production-runtime vulnerability in the current audit. Reassess Drizzle Kit and Next ESLint dependency updates before CI/public release; keep the issue visible rather than hiding it with a forced downgrade.
