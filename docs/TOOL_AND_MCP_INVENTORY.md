# SpeakQL Tool and MCP Inventory

**Audit date:** 2026-10-10 (Asia/Calcutta)
**Status:** Phase 2 re-audit; no external MCP server, PostgreSQL service, or Supabase project was verified or connected.

## Available capabilities

| Capability | Available operations | Authentication | Intended use | Limitations / verification |
|---|---|---|---|---|
| Workspace filesystem | Read, glob/search, patch files | Authorized root is `C:\Users\abhis\omnirush.ai` | Inspect and modify the local project | Verified against the workspace manifest; no separate SpeakQL repository is present. |
| PowerShell execution | Run local commands in the workspace | Local runtime | Version checks, package checks, tests, git inspection | Commands are serialized and subject to runtime approval. Verified with `Get-Location`, `git status`, and directory listing. |
| Git CLI | Status, diff, log, whitespace checks | No repository identity needed for reads | Branch/history/status and later version control | Git repository is initialized on `main`; no commit or remote was attempted. |
| Supabase CLI | Checked with `Get-Command supabase` | N/A | Project linking and Supabase local/test workflows | CLI is not installed; no link or remote command was attempted. |
| OmniRush app context | Inspect UI, sessions, settings and registered affordances | Built-in | Discover app-level integrations and state | Does not prove a SpeakQL service integration. |
| Local extensions | `extension.actions` discovery; Google Workspace and image-generation actions are registered | Extension-specific connection/auth | Optional product-ops research or artifacts | Registration was verified; no extension action was invoked and authentication remains unverified. |
| Built-in browser | Open and inspect external web pages | Per-site session | Documentation and research when needed | Not used for the local baseline. External sites are not authenticated project integrations. |
| Documentation retrieval | OmniRush product docs search/read | Built-in | Product how-to questions | Not a substitute for external service access or project validation. |
| Spreadsheet/PDF tools | Workbook inspection/write and PDF rendering | Workspace access | Artifact workflows | Not relevant to the current baseline. |

| Official web documentation | `webfetch` retrieved current Next.js, Vitest, Playwright, and Zod pages | Public web access | Version compatibility and setup research | Read-only; no repository or service authentication. |
| PostgreSQL CLI/service | `Get-Command psql`, `Get-Command docker`, and Windows service inspection | N/A | Live migration and persistence checks | Not available in this environment; live migration criterion is blocked. |
| Supabase Auth | Official documentation retrieved; no project action performed | Project URL/key unavailable | Production authentication | Integration boundary implemented; authentication remains unconfigured and unverified. |
| Supabase project endpoint | Read-only HTTP checks to the supplied project URL | No API key supplied | Confirm project host reachability | `/auth/v1/health` and `/rest/v1/` returned HTTP 401; this confirms the endpoint responds, not that credentials or database access work. |
| Supabase Free plan research | Official pricing, compute, production, and RLS documentation retrieved | Public web access | Evaluate a no-cost disposable test environment | Plan is suitable but no project was provisioned; inactivity pause and no downloadable Free backups are limitations. |
| Neon Free plan research | Official plan documentation retrieved | Public web access | Evaluate PostgreSQL-only alternative | Free PostgreSQL is suitable, but it does not satisfy the selected Supabase Auth requirement; no project was provisioned. |
| Drizzle ORM | npm package installed; schema and migration artifact created | Local package registry | PostgreSQL schema, queries, migrations | Local code/type/build checks pass; no live database execution. |
| Browser QA runner | Loaded local production server and inspected accessibility tree, console, and failed requests | Local server only | Runtime rendering verification | Verified landing page at `http://localhost:3000`; no automated Playwright test file was added in Phase 1. |
| Open-source repository research | GitHub public API and canonical raw READMEs | Public web access | License, maintenance, source, and compatibility review | Audited 13 candidates without cloning or incorporating code. Evidence is in `docs/OPEN_SOURCE_RESOURCE_AUDIT.md`. |

## MCP / connector status

No GitHub, Notion, Figma, Context7, database, deployment, monitoring, or SpeakQL-specific MCP connector was exposed by the inspected OmniRush context. The only discovered extension actions were for Google Workspace, OpenAI image generation, and workspace uploads. Their availability is recorded as **registered, connection status not verified**.

## Required alternatives

- Repository work: local filesystem and Git CLI; repository is now initialized.
- Current framework documentation: official web documentation, only when a framework is selected.
- Database/deployment: local development services and documented provider adapters; no paid resource or external deployment will be created without explicit authorization.

## Evidence

- `omnirush_context` revision 142: built-in app affordances and extension inventory.
- `extension.actions`: registered extension operations.
- `npm install`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
- Browser QA runner against the local production server: HTTP 200, expected accessible content, zero console errors, zero failed requests.
- `npm run db:migrate` was attempted; it could not complete because no PostgreSQL service is available. No destructive database command was run.
- `supabase` CLI discovery returned unavailable; no login token was requested or used.
- `C:\Users\abhis\omnirush.ai\.opencode\omnirush.json`: authorized root and workspace metadata.
- Workspace listing: only `opencode.jsonc` and `.opencode/` existed before this Phase 0 documentation.
