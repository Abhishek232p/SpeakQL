# Universal AI skill resource and license audit

**Review date:** 2026-10-10
**Method:** read-only official web pages, existing repository files, and safe
version/help/status commands. No repository was cloned, no remote code was
installed, and no credential-bearing operation was performed.

## Classification vocabulary

- **ADOPT:** use the format or documented behavior directly.
- **REUSE:** rely on an existing local/runtime skill without copying it.
- **REFERENCE:** study a public specification or pattern only.
- **SKIP:** do not use now because it is unnecessary, unverified, or requires
  an unavailable host feature.
- **REJECT:** do not embed because license, maintenance, architecture, or
  supply-chain fit is unsuitable.

## Reviewed resources

| Resource | Read-only evidence | License / maintenance evidence | Classification and use |
|---|---|---|---|
| OpenCode Agent Skills documentation — `https://opencode.ai/docs/skills/` | Official documentation states project paths include `.opencode/skills/<name>/SKILL.md`, `.claude/skills`, and `.agents/skills`; it specifies frontmatter and name rules. Retrieved 2026-10-10. | Product documentation; no third-party code copied. | **ADOPT** the project-local `.opencode/skills` layout and validation rules. |
| Agent Skills specification — `https://agentskills.io/specification` | Specification requires `SKILL.md`, `name`, `description`, matching lowercase directory names, and optional compatibility/license metadata. Retrieved 2026-10-10. | Specification is a format reference, not an installed dependency. | **ADOPT** the portable frontmatter contract; local verifier implements only the needed checks. |
| Anthropic public skills — `https://github.com/anthropics/skills` | Public repository README describes self-contained skill folders and distinguishes open-source examples from source-available document skills. Read 2026-10-10. | README says many examples are Apache-2.0 while document skills are source-available; each folder needs its own review. | **REFERENCE** only; no files copied and no plugin installed. |
| Existing Supabase skills — `supabase/agent-skills` in `skills-lock.json` | The repository already contains `.agents/skills/supabase` and `.agents/skills/supabase-postgres-best-practices`; their local content and lock hashes were inspected. | `supabase-postgres-best-practices` declares MIT; the generic Supabase skill has no local license field, so its source terms remain the source of truth. | **REUSE** only; no refresh, clone, install, or overwrite. |
| OmniRush built-in skills | The task environment exposes `omnirush-build`, `omnirush-debug`, `omnirush-feature`, `omnirush-handoff`, `omnirush-performance`, `omnirush-refactor`, `omnirush-review`, `omnirush-test`, and `browser-automation`. | Runtime-provided; repository license/evidence is not available to this pack. | **REUSE** through explicit wrapper references; do not copy their text. |
| `skills-ref` validator | The Agent Skills specification recommends it, but it is not installed in this workspace. | No local executable/version was verified. | **SKIP** installation; the PowerShell verifier checks names, frontmatter, allowlist, and hashes without adding a dependency. |

## Existing open-source research carried forward

`docs/OPEN_SOURCE_RESOURCE_AUDIT.md` already records read-only metadata and
classifications for Supabase, Drizzle, Open edX, Graphology, pyBKT, LangGraph,
Whisper, SpeechBrain, LiveKit Agents, Learning Locker, Playwright, and
OpenTelemetry JS. That audit reports repository licenses, recent activity
signals, package/runtime fit, and no copied code. This pack does not change
those decisions:

- **Reuse/adapt later:** Drizzle and Playwright already used locally; Supabase
  is an application boundary; OpenTelemetry is deferred until an exporter and
  retention policy exist.
- **Reference first:** Open edX, Graphology, pyBKT, LangGraph, Whisper,
  SpeechBrain, and LiveKit because of platform/runtime or evidence gaps.
- **Reject for embedding:** Learning Locker (GPL-3.0 and a separate service)
  and Open edX for the MVP (AGPL-3.0 and oversized Python platform).
- **No new dependency:** this pack contains Markdown and PowerShell only.

## Local pack licensing and maintenance

The 24 skill files are original, project-local instruction text written for
this repository. No external skill body, package, model weight, dataset, or
code was copied. The manifest records that status rather than asserting a
third-party license. If the owner wants redistribution, choose and add an
explicit license for the pack before publishing it.

Maintenance evidence is intentionally modest: the pack has a version and
review date, the source allowlist contains per-skill SHA-256 review hashes,
and verification compares the installed files with the reviewed local source.
External documentation and runtime skills can change; recheck them before
relying on a provider, MCP server, or client-specific feature.

## Skipped resources and risks

| Skipped item | Reason | Follow-up |
|---|---|---|
| Unlisted third-party skill repositories or marketplace bundles | No concrete URL or license/version evidence was supplied in the task context; arbitrary downloads would violate the local-only boundary. | Review one named source at a time with read-only metadata and license evidence. |
| MCP servers and connector URLs | No authenticated connector was exposed for this workspace; installing or editing MCP config would change integration state. | Use existing app Library/Connect flows and inspect help/health first. |
| Package-manager installs and global skill installs | Not necessary for a Markdown/PowerShell pack and would change the machine or global config. | Use the included local installer only. |
| Credential stores, `.env.local`, tokens, and private browser sessions | Sensitive and outside the audit scope. | Ask the user to complete sign-in in the appropriate UI when a real integration is authorized. |
| Database/security implementation changes | Explicitly outside this task. | Reuse the existing Supabase skills and project security workflow in a separate authorized task. |

## Residual risks

1. A skill is guidance, not an authorization boundary. The host/client still
   controls tools, permissions, network access, and secret handling.
2. A valid frontmatter file can still contain poor or stale instructions;
   review substantive changes and rerun the verifier.
3. `.opencode/skills` is the verified OpenCode project path, but other agents
   may require an import, reload, or a different project-local directory.
4. The matrix is an explicit interpretation because the 24 names were not
   enumerated in the task context; align names with a supplied list before a
   wider rollout if one becomes available.
