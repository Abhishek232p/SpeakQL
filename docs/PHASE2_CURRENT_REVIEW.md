# Phase 2 current review

Status: **IN_PROGRESS**. No remote migrations, history edits, deployments, or commits in this run.

## Read-only evidence

`node scripts/security-catalog-audit.mjs` exited 0. It uses an explicit read-only transaction, catalog queries, statement timeout and sanitized failures; no application records are read.

- History is in `drizzle.__drizzle_migrations`. The first five SQL file SHA-256 hashes match remote rows. Migration 0004 has local timestamp 1791630000001 versus remote 1791629309179. This is metadata divergence, not evidence that the evaluation policy is missing. Do not rewrite applied history. A future migrator may replay 0004 because its local timestamp was changed; reconcile that deliberately before any migrate command.
- Remote evaluation policies contain the exercise/competency/goal/user ownership joins. Other policy predicates inspected also bind issuer and subject.
- All seven tables belong to postgres and enable RLS. The four learning tables do not force RLS; proposed 0005 is absent remotely.
- speakql_app is a member of speakql_runtime without admin option. Effective runtime privileges deny DELETE/TRUNCATE and evaluation UPDATE; audit is insert-only. Profile UPDATE is column-granted, so a table-only privilege check is insufficient.
- anon/authenticated/service_role have SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on four learning tables. Policies target the runtime group, so grants alone do not establish row access for anon/authenticated. TRUNCATE is not mediated by RLS; direct SQL/RPC paths must be reviewed. No destructive probe was attempted.
- Public SECURITY DEFINER `rls_auto_enable()` returns event_trigger, has search_path=pg_catalog, and anon/authenticated lack EXECUTE. Its presence alone is not evidence of a callable privilege-escalation RPC.

This is not a full schema equivalence proof: column defaults, every constraint/index, all inherited roles, default ACLs, and external jobs still require exhaustive comparison.

## Proposed changes — do not execute

`drizzle/migrations/0005_force_learning_rls.sql` only forces RLS. FORCE does not restrict superusers/BYPASSRLS roles and is defense in depth, not a substitute for role checks.

**Operational warning:** the new local runtime guard requires FORCE on all seven tables. It will reject the presently inspected remote target until reviewed remediation occurs. Do not deploy this change independently of that decision.

Current application repositories use PostgreSQL/Drizzle, not Supabase Data API table operations. Supabase Auth does not itself require grants on these custom learning tables. No application service-role use was found in the inspected src code; external jobs/Edge Functions remain unknown. Therefore do not blanket-revoke service_role.

Candidate least-privilege SQL, only after owner confirms no client Data API usage:

```sql
BEGIN;
REVOKE ALL PRIVILEGES ON TABLE public.learning_goals, public.competencies,
  public.practice_exercises, public.practice_evaluations FROM anon, authenticated;
-- Separately inspect/revoke column-level ACLs and PUBLIC/default ACL paths.
-- service_role intentionally unchanged pending external-consumer inventory.
COMMIT;
```

Rollback plan: before approval, capture exact table and column ACLs including grant options, role memberships and FORCE flags. Use a transaction and ROLLBACK on failed checks. After commit, restore only that captured ACL baseline, never blanket GRANT ALL. FORCE rollback would be ALTER TABLE ... NO FORCE ROW LEVEL SECURITY for the four tables only; it must be coordinated with reverting the new guard and separately authorized. Do not modify migration records during rollback. No rollback SQL was executed.

## Live test prerequisites and acceptance

The reproducible harness is `npm run test:security:integration`. It requires explicitly armed disposable admin/Alice/Bob connections plus a short non-secret `SPEAKQL_SECURITY_TEST_DISPOSABLE_MARKER`; it rejects production-like database names and reads the local migration manifest before any mutation. It writes disposable fixtures; never point it silently at production. Its checks are not yet live-verified. The preflight now correctly checks profile column UPDATE privileges.

Outstanding acceptance: two-identity isolation (read/write/reparent), missing context denial, foreign evaluation rejection, transaction rollback/cleanup, connection context reset, genuine signup/email confirmation/login, refresh/restart persistence, protected dashboard access, goal/evaluation persistence and logout. Run the browser flow with two separate browser contexts and privately entered disposable credentials. Verify user B cannot retrieve IDs created by A and logout removes access after reload. Do not save passwords/tokens or private page captures in evidence. Browser availability alone is not authentication completion.

Skill-system installation is separate and does not satisfy these criteria.
