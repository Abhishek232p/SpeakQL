# SpeakQL Baseline Audit

**Audit date:** 2026-10-09 (Asia/Calcutta)
**Classification:** findings are marked `[PROVEN]`, `[PROBABLE]`, or `[UNKNOWN]`.

## Repository determination

**[PROVEN] No accessible SpeakQL repository exists at the authorized workspace root.** The workspace is `C:\Users\abhis\omnirush.ai`, contains only `opencode.jsonc` and `.opencode/` before this audit, and `git status --short --branch` returns `fatal: not a git repository`.

The `.opencode/` directory is OmniRush runtime support, not an application repository. It contains a package manifest for `@opencode-ai/plugin` version `1.18.32`, its lockfile, runtime metadata, and installed dependencies.

## Inspected

- Workspace root directory and hidden entries.
- `opencode.jsonc`.
- `.opencode/package.json`.
- `.opencode/omnirush.json`.
- Registered OmniRush extension actions and app affordances.
- Git status and recent-log commands (both unavailable because no Git repository exists).
- Candidate project manifests and README/docs patterns (none found outside runtime support).

## Existing capabilities

| Capability | Status | Evidence |
|---|---|---|
| SpeakQL application | Not started | No app source or project manifest found. |
| Authentication and user data | Not started | No backend, schema, or identity integration found. |
| Goals, competencies, curriculum | Not started | No domain code or documentation found. |
| Coaching, simulation, evaluation | Not started | No application code found. |
| Voice, transcription, mastery | Not started | No integration or model code found. |
| Tests, lint, type checks, CI | Not started / not configured | No scripts, test directories, or CI configuration found. |
| OmniRush workspace access | Implemented by host | `.opencode/omnirush.json` authorizes the current workspace root. |

## Baseline checks and actual results

| Command / check | Result |
|---|---|
| `Get-Location` | `C:\Users\abhis\omnirush.ai` |
| `git status --short --branch` | Failed as expected: not a Git repository. |
| `git log --oneline -5` | Failed as expected: not a Git repository. |
| Root listing | Only `.opencode/` and `opencode.jsonc` before audit docs. |
| Project manifest search | No `package.json`, `pyproject.toml`, `Cargo.toml`, README, or docs for SpeakQL. |
| Test/lint/typecheck execution | Not applicable: no application scripts or source exist. |

## Missing capabilities

All SpeakQL product phases are missing. The highest-value next step is a small, testable foundation rather than attempting all phases at once.

## Security concerns

1. **[PROVEN]** There is no application security boundary yet: no authentication, authorization, tenant isolation, secret management, or audit implementation.
2. **[PROVEN]** There is no `.env` policy or ignore file for a future application repository. Secrets must be excluded before provider work begins.
3. **[PROBABLE]** Audio, transcripts, and model prompts will create sensitive-data retention and access-control requirements.
4. **[UNKNOWN]** No deployment, database, or external provider security posture can be assessed until selected.

## Architectural risks

1. Building the voice and AI layers before a persisted text learning loop would make behavior difficult to test and debug.
2. Treating model-generated evaluation as authoritative would create product and regulated-domain risk.
3. Introducing multiple services too early would add operational complexity without evidence of need.
4. Competency, evidence, interpretation, and mastery must remain distinct data concepts.
5. Provider-specific code could lock the product to one model or speech vendor unless adapters are defined early.

## Recommended implementation order

1. Phase 1: repository foundation and deterministic health/check path.
2. Phase 2: database, identity boundary, user profile, and audit events.
3. Phase 3: goal APIs and validation.
4. Phase 4: competency graph with cycle tests.
5. Phase 5: curriculum and a text-only learning loop.
6. Phase 6-7: provider-neutral coaching and text simulation.
7. Phase 9-10: evidence-backed evaluation, mistake memory, and replaceable mastery algorithm.
8. Phase 11-15: UI, voice, observability, security review, end-to-end validation, deployment readiness.

## Limitations and blockers

- No existing application repository was available to preserve or extend.
- No database, AI provider, speech provider, deployment target, or external connector was authorized or verified.
- Product decisions such as initial web-only scope, identity provider, and first target competency remain open; they do not block documenting the foundation.
