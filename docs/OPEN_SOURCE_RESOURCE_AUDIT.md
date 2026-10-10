# SpeakQL Open-Source Resource Audit

**Audit date:** 2026-10-10 (Asia/Calcutta)
**Scope:** Phase 2 continuation and decisions that affect the first learning loop.
**Method:** Canonical GitHub repository metadata, repository README/source/docs, license metadata, current package metadata where relevant, and comparison with the existing SpeakQL source. No repository was cloned or incorporated.

## Decision vocabulary

- **REUSE:** adopt the project/package directly after version and security review.
- **ADAPT:** use a bounded component or service pattern behind a SpeakQL interface.
- **REFERENCE:** study concepts or data structures; implement SpeakQL-specific behavior.
- **REJECT:** do not adopt because of license, maintenance, architecture, or product fit.

## Candidate matrix

| Area | Canonical repository | License / maintenance evidence | Smallest useful component | SpeakQL comparison and risks | Recommendation |
|---|---|---|---|---|---|
| Auth and Postgres platform | [supabase/supabase](https://github.com/supabase/supabase) | Apache-2.0 from GitHub API; active repository, pushed 2026-10-09; TypeScript/Postgres platform; 111k stars, 1,139 open issues. | Server-side Auth session verification and Postgres/RLS concepts. | Already selected as the auth boundary in `src/server/auth/supabase.ts`, but no project credentials exist. Managed-service cost, vendor coupling, JWT/RLS configuration, and SSR cookie refresh must be tested before production. | **ADAPT** |
| PostgreSQL / migration | [drizzle-team/drizzle-orm](https://github.com/drizzle-team/drizzle-orm) | Apache-2.0 from GitHub API; active, pushed 2026-10-09; TypeScript; 35k stars, 2,120 open issues. README documents a thin typed SQL layer, `node-postgres`, and Drizzle Kit migrations. | Typed schema declarations, PostgreSQL driver, generated SQL migration workflow. | Already used by SpeakQL (`drizzle-orm` 0.45.4, `drizzle-kit` 0.31.11). It fits the modular monolith, but migrations still require a real PostgreSQL integration environment. | **REUSE** |
| Adaptive curriculum / LMS reference | [openedx/openedx-platform](https://github.com/openedx/openedx-platform) | AGPL-3.0 from GitHub API; active, pushed 2026-10-09; Python; 8.2k stars, 567 open issues. Large full LMS, not a focused library. | Course sequencing, learner-facing progression concepts, and extension boundaries. | Too large and Python/AGPL for embedding in this Next.js/TypeScript MVP. Its data model is course-centric; SpeakQL needs competency/evidence/context distinctions. | **REFERENCE** |
| Competency graph | [graphology/graphology](https://github.com/graphology/graphology) | MIT from GitHub API; active, pushed 2026-09-02; JavaScript; 1.7k stars, 89 open issues. README documents directed/mixed graphs, algorithms, and TypeScript declarations. | Directed graph object, traversal, cycle/path utilities. | Compatible with TypeScript, but SpeakQL's initial competency graph can be represented relationally and validated with a small explicit algorithm. Adding a graph dependency before graph requirements are proven adds API/serialization surface. | **REFERENCE**, reassess for **REUSE** in Phase 4 |
| Mastery estimation | [CAHLR/pyBKT](https://github.com/CAHLR/pyBKT) | MIT from GitHub API; active, pushed 2026-10-09; C++/Python package; 281 stars, 19 open issues. Description is Bayesian Knowledge Tracing and extensions. | BKT model implementation and experiment baseline. | Python/native dependency does not fit the current Next.js runtime. BKT assumptions may not capture context, difficulty, evidence quality, or professional performance without calibration. | **REFERENCE** first; **ADAPT** through a separate service only after evidence data exists |
| AI tutoring / simulations | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | MIT from GitHub API; active, pushed 2026-10-09; Python; 43k stars, 803 open issues. Repository is an agent/workflow framework with rapidly changing APIs. | Stateful graph orchestration and resumable workflow ideas. | The current product has no AI provider or simulation state to orchestrate. Introducing a Python agent runtime now would split the stack and increase prompt/tool security risk. | **REFERENCE** now; **ADAPT** only when a real multi-step workflow needs durable state |
| Speech transcription | [openai/whisper](https://github.com/openai/whisper) | MIT from GitHub API; active, pushed 2026-08-31; Python; 110k stars, 168 open issues. README documents local models, ffmpeg, Python/PyTorch requirements, model sizes, and variable language performance. | Batch transcription adapter and timestamped raw transcript evidence. | Strong license and adoption, but Python/PyTorch/ffmpeg and model memory make it unsuitable for the current web process. Transcription quality is not pronunciation scoring. | **ADAPT** later as a worker/provider adapter |
| Pronunciation / speech evaluation | [speechbrain/speechbrain](https://github.com/speechbrain/speechbrain) | Apache-2.0 from GitHub API; active, pushed 2026-08-27; Python/PyTorch; 11.8k stars, 194 open issues. Repository topics and source/docs cover ASR, speaker verification, enhancement, and speech processing. | Model-serving/evaluation building blocks, not a ready-made SpeakQL rubric. | Useful research toolkit but Python/PyTorch operational cost and model/data licensing must be reviewed per checkpoint. Pronunciation scores require validated evidence and should never be presented as objective certification. | **REFERENCE**, possibly **ADAPT** behind a speech service |
| Real-time voice simulation | [livekit/agents](https://github.com/livekit/agents) | Apache-2.0 framework from GitHub API; active, pushed 2026-10-09; Python; 14.7k stars, 951 open issues. README documents STT/LLM/TTS composition, WebRTC, testing, and required server/provider credentials. | Agent session/test patterns and WebRTC transport boundary. | Relevant for Phase 8, but it is Python-first and requires LiveKit/provider credentials. Cloud usage has cost; self-hosting has media operations. Do not add now. | **REFERENCE** now; **ADAPT** later |
| Learning evidence / event storage | [LearningLocker/learninglocker](https://github.com/LearningLocker/learninglocker) | GPL-3.0 from GitHub API; last pushed 2024-05-30; JavaScript; 585 stars, 78 open issues. Open-source LRS/xAPI focus, but maintenance is materially slower than the active candidates. | xAPI statement vocabulary and LRS design ideas. | GPL obligations and a separate Mongo/Node service conflict with the current Postgres evidence model. SpeakQL needs first-class evidence provenance and privacy controls rather than an external LRS in the MVP. | **REJECT** for embedding; **REFERENCE** xAPI concepts |
| Testing | [microsoft/playwright](https://github.com/microsoft/playwright) | Apache-2.0 from GitHub API; active, pushed 2026-10-09; TypeScript; 97k stars, 168 open issues. README/docs cover cross-browser tests and WebSocket/browser automation. | Browser smoke/e2e test runner. | Already installed as a dev dependency. It fits Next.js and Node 24, but browser binaries and test runtime add CI cost. | **REUSE** |
| Observability | [open-telemetry/opentelemetry-js](https://github.com/open-telemetry/opentelemetry-js) | Apache-2.0 from GitHub API; active, pushed 2026-10-09; TypeScript; 3.5k stars, 219 open issues. README documents traces/metrics/logs, Node 24 support, and package compatibility matrices. | Request/model-run spans and metrics with vendor-neutral exporters. | Compatible with the current Node 24/TypeScript stack. It should be added after request correlation and model-run boundaries exist; instrumentation without an exporter/retention policy creates noise and cost. | **REFERENCE** now; **REUSE** in Operations phase |

## Current dependency/license inventory

| Current direct dependency | Version in `package.json` | License evidence | Use | Audit outcome |
|---|---:|---|---|---|
| Next.js | 16.4.0 | npm metadata / Next.js repository | Web/API framework | Retain |
| React / React DOM | 19.3.0 | npm metadata / React repository | UI runtime | Retain |
| Zod | 4.6.0 | Zod site identifies MIT license | Runtime validation | Retain |
| Drizzle ORM | ^0.45.4 | GitHub API: Apache-2.0 | PostgreSQL schema/query layer | Retain; already implemented |
| Drizzle Kit | ^0.31.11 | npm/package metadata and Drizzle repository | Migration tooling | Retain; live DB verification blocked |
| `pg` | ^8.23.1 | npm metadata: MIT | PostgreSQL driver | Retain |
| Supabase SSR / JS | ^0.12.7 / ^2.117.3 | npm metadata: MIT | Auth boundary and client | Retain; provider unconfigured |
| Vitest | 5.0.3 | npm metadata: MIT | Unit/integration test runner | Retain |
| Playwright Test | 1.59.1 | GitHub API: Apache-2.0 | Browser testing | Retain |
| ESLint / Next config | 9.38.0 / 16.4.0 | npm metadata / ESLint MIT | Static checks | Retain |

No audited candidate was copied into the repository. No new product dependency was added by this audit.

## Maintenance and supply-chain cautions

- GitHub activity and issue counts are signals, not a security guarantee. Pin versions and review advisories before upgrades.
- Large frameworks with many open issues can still be healthy; evaluate release cadence and compatibility rather than issue count alone.
- Model weights, datasets, and code can have separate licenses. Whisper and SpeechBrain adoption requires checkpoint/model-card review.
- AGPL/GPL candidates require legal review before network deployment or embedding; Learning Locker and Open edX are not MVP dependencies.
- Python-native candidates would require a separate service boundary, deployment, cost, and data-transfer policy.

The current project dependency audit found 0 production vulnerabilities but 9 development-tree vulnerabilities. The vulnerable paths are transitive (`braces` through Next ESLint tooling and `esbuild` through Drizzle Kit's deprecated helper packages). npm's forced fix proposes breaking downgrades, so no automatic fix was applied; this remains a release-readiness follow-up.

## Highest-value decision

Do not add an adaptive-learning or voice dependency yet. The highest-value next step is to obtain a disposable PostgreSQL environment, run the existing Drizzle migration, and verify profile persistence, transactional audit behavior, and authorization against the real schema. That evidence is prerequisite to safely adding goals, competencies, or AI/speech services.

## Sources and retrieval date

GitHub repository metadata and canonical READMEs were retrieved on 2026-10-10 via the public GitHub API/raw repository URLs. Examples inspected include each repository's README and license metadata; no repository was cloned.
