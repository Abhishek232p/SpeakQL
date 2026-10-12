# Universal AI skill pack

This directory is the reviewed, repository-local source pack for 24 small,
composable Agent Skills. The pack uses the portable `SKILL.md` format: a
lowercase directory name, YAML frontmatter with `name` and `description`, and
Markdown instructions. The current project-local installation target is
`.opencode/skills/` because OpenCode documents that path and also discovers
the Agent Skills-compatible `.agents/skills/` path.

## Scope note

The request names 24 capabilities but does not enumerate their names in the
available task context. The matrix in
`docs/universal-ai-skills/COMPATIBILITY_MATRIX.md` is therefore the explicit
capability contract for this pack. It favors repository work, verification,
AI integration boundaries, and continuity. Existing trustworthy skills are
referenced instead of copied.

## Pack contents

- `manifest.json` — reviewed allowlist, version, and install roots.
- `skills/` — canonical source for the 24 local skills. Each reviewed skill
  currently contains only its allowlisted `SKILL.md` and has a SHA-256 entry.
- `COMPATIBILITY_MATRIX.md` — capability-to-agent/tool compatibility and
  limitations.
- `RESOURCE_AUDIT.md` — read-only research evidence, classifications,
  licensing/maintenance notes, and skipped resources.
- `../../scripts/universal-ai-skills/Install-UniversalAiSkills.ps1` — local,
  collision-safe installer.
- `../../scripts/universal-ai-skills/Verify-UniversalAiSkills.ps1` — offline
  source/target/frontmatter verifier.

The installer copies only directories listed in `manifest.json`. It never
downloads packages, invokes a package manager, edits `opencode.jsonc`, edits
`.opencode/omnirush.json`, changes `.agents/skills`, or changes
`skills-lock.json`. Existing target directories are accepted only when their
contents are byte-for-byte identical; a different directory is a collision
and is left untouched.

## Install and verify

Run from the repository root in Windows PowerShell:

```powershell
& .\scripts\universal-ai-skills\Install-UniversalAiSkills.ps1 -DryRun
& .\scripts\universal-ai-skills\Install-UniversalAiSkills.ps1
& .\scripts\universal-ai-skills\Verify-UniversalAiSkills.ps1
```

The first command is the reviewable plan. The second performs only local
copies into `.opencode/skills/`. Re-running it is idempotent. The third checks
the manifest allowlist and SHA-256 review hashes, Agent Skills frontmatter,
exact source/target file hashes, and name collisions with the repository's
existing `.agents/skills` and `.claude/skills` directories.

For a non-mutating machine-readable check:

```powershell
& .\scripts\universal-ai-skills\Install-UniversalAiSkills.ps1 -DryRun -Json
& .\scripts\universal-ai-skills\Verify-UniversalAiSkills.ps1 -Json
```

No credentials, environment files, remote URLs, or external commands are
required by either script.

## Reuse policy

Several capabilities intentionally point at existing runtime or repository
skills such as `omnirush-feature`, `omnirush-debug`, `omnirush-build`,
`omnirush-test`, `omnirush-review`, `omnirush-refactor`,
`omnirush-performance`, and `omnirush-handoff`. The local files provide only
the portable entry point and the hand-off contract; they do not reproduce
those skills' text. The existing `.agents/skills/supabase` and
`.agents/skills/supabase-postgres-best-practices` remain the database-specific
trust anchors and are not replaced by this pack.

## Agent-specific integration limits

- **OpenCode:** project-local `.opencode/skills/<name>/SKILL.md` discovery is
  documented and is the verified target for this repository. A reload may be
  needed for a long-running session to refresh its skill list.
- **Claude-compatible and Agent Skills runtimes:** the file format is
  compatible, but this deliverable does not copy anything into global
  directories or `.claude/skills`; use the source pack or explicitly choose a
  reviewed target after inspection.
- **OmniRush.ai:** the host can use registered/built-in skills and local
  project files, but this task did not mutate host settings or claim that a
  fresh skill list was registered. Use the normal workspace reload/skill
  discovery path after installation.
- **Codex, Cursor, Copilot, and other clients:** support for `SKILL.md`,
  permission prompts, tools, and progressive loading varies. This pack does
  not add client-specific config, MCP URLs, plugins, or shell profiles.

## Safety boundary

The pack is instruction-only. It does not change application, database, or
security code; it does not create MCP connections; and it does not install
third-party tools. Skills that discuss privacy, connectors, or database work
require read-only inspection and hand off to the existing specialized skill
or an explicitly authorized project workflow before any consequential action.
