# Evaluation boundary

## Current configuration

No AI provider is configured or authorized in this workspace. The existing
environment schema contains database and Supabase identity settings only; it
does not contain a provider URL, model, or provider secret. The application
therefore makes no evaluation network calls.

`src/server/evaluation/contracts.ts` defines the application-owned request and
result contract. `src/server/evaluation/boundary.ts` is the replaceable
adapter boundary and enforces:

- strict structured output validation with `speakql.evaluation.v1`;
- bounded input/output characters and estimated tokens;
- a 1.5 second default timeout with abort signalling;
- output token and cost limits;
- provider errors, timeouts, invalid output, and limit breaches falling back
  without exposing provider diagnostics.

An adapter can be injected behind `EvaluationProvider` later. It must translate
its vendor response into the application contract before persistence. No SDK,
credential, endpoint, or remote provider is selected by this implementation.

## Fallback and stored learning loop

With no provider, the boundary returns a deterministic **non-AI** evaluation.
The fallback uses three explainable baseline criteria: a context signal from
the scenario/expected structure, a sentence or line boundary, and at least
eight words. It is a practice baseline, not a claim of mastery or certification.

The existing `practice_evaluations` table is sufficient for this slice, so no
migration was added. The validated score, criteria, mistake memory, next
action, source label, and fallback reason are serialized into the existing
`feedback` text column. Dashboard analytics read those stored rows to derive:

- measured evaluation counts;
- latest-result mastery estimate per exercise;
- deterministic next exercise;
- latest needs-work mistake memory and its next action.

The dashboard labels fallback evaluations as `Deterministic fallback · non-AI`

## Limitations

- The fallback is intentionally lexical and cannot assess semantic correctness,
  pronunciation, or domain safety.
- No live provider integration, cost accounting against a vendor, or remote
  call was performed because no provider was configured.
- Source metadata is stored in the existing feedback text because adding a
  separate source/criteria schema would require a migration that is not needed
  for this capability.
- Mastery remains an estimate derived from latest stored scores; it is not a
  certification, readiness guarantee, or human review.
