---
name: portable-privacy-boundary
description: Identify secrets, personal data, ownership checks, retention limits, and authorization boundaries before an AI or connector workflow handles user data. Use for privacy or security review without changing database/security code.
license: Project-local
compatibility: Agent Skills-compatible clients with read-only repository inspection
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
  reuse: supabase; supabase-postgres-best-practices
---

# Privacy and trust boundary

- Inventory what data enters the browser, model, connector, log, cache, and
  persistence layer. Minimize fields and retention before adding a new path.
- Keep secrets server-side; never print tokens, passwords, cookies, private
  keys, or full sensitive payloads in diagnostics.
- Require server-side identity and ownership checks for user-scoped reads and
  writes. Do not trust client-supplied user IDs or model assertions.
- For Supabase/Postgres work, load the existing `supabase` and
  `supabase-postgres-best-practices` skills and follow their current docs.

This portable entry point is an audit guide only. It does not edit migrations,
RLS, auth, database schema, security policy, or credential configuration.
