# SpeakQL production-readiness assessment

Review basis: current working tree and read-only remote catalog inspection. No commit, deployment, or remote migration was performed.

## Release gates

| Gate | Status | Evidence / blocker |
|---|---|---|
| Critical learner flow | PARTIAL | Goal → competencies → exercises → persisted evaluation → analytics/recommendation is implemented locally; genuine authenticated persistence is not live-tested. |
| Authentication | PARTIAL | Server uses Supabase SSR `auth.getUser()`, proxy refresh and browser logout helper; signup, email confirmation, recovery, refresh and logout need a real disposable account test. |
| Authorization/RLS | BLOCKED | Policies and restricted runtime design are present; two-user disposable integration harness is not armed or executed. |
| Migration safety | BLOCKED | Five historical hashes exist remotely; 0004 timestamp differs from local journal and 0005 FORCE-RLS is unapplied. No migrate command is authorized in this run. |
| AI evaluation | PARTIAL | Provider-neutral contract validates structured output, timeout, input/output/cost limits and safe deterministic fallback. No provider is configured, so no live AI claim is made. |
| Mistake memory/mastery | PARTIAL | Stored evaluation metadata feeds mistake memory and an explicitly labelled progress estimate. This is not a validated educational mastery model. |
| Responsive/accessibility | PARTIAL | Production browser smoke and semantic UI checks pass; device-size and assistive-technology audits remain. |
| Operations | BLOCKED | Backup/restore evidence, retention/deletion workflow, monitoring/alerting, rate limits, load budgets and deployment rollback are not verified. |
| Skill activation | PARTIAL | 24 local skills are hash-verified and installer is idempotent; activation/representative tasks in each external agent are not verified. |

## Safe next steps requiring owner decisions

1. Provision or identify a disposable PostgreSQL target with separate admin, Alice and Bob LOGIN URLs. Set the four `SPEAKQL_SECURITY_TEST_*` variables privately and explicitly arm the harness.
2. Review the exact `0005_force_learning_rls.sql` and decide whether to apply it. It is intentionally not applied here.
3. Reconcile 0004's already-recorded remote timestamp without rewriting migration history. Do not run `drizzle-kit migrate` until the migration tool's handling of the local/remote timestamp mismatch is reviewed.
4. Inventory Data API, Edge Function, background-job and service-role consumers before revoking `anon`, `authenticated` or `service_role` privileges.
5. Provide a disposable Supabase Auth account or an authorized browser handoff for real signup/login/session/logout testing.
6. Select and authorize an AI provider, model, budget, retention policy and data-processing terms before enabling a provider adapter.

## Operational work still required

- Account recovery and verified deletion request flow.
- Explicit retention schedule for responses, evaluation metadata and audit records.
- Backup ownership, restore drill and recovery point/objectives.
- Structured server logging with request IDs, redaction and alert thresholds.
- Per-user/IP rate limits for authentication and evaluation writes.
- Load and latency budgets for dashboard and evaluation submission.
- Deployment health checks, rollback procedure and migration rollback policy.
- AI provider health, usage accounting, cost alerts and prompt/output redaction review.
