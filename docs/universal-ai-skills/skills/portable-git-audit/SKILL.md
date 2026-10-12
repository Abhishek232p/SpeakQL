---
name: portable-git-audit
description: Inspect repository status, diffs, history, remotes, and whitespace safely without changing Git state. Use before edits, handoff, review, or release planning.
license: Project-local
compatibility: Agent Skills-compatible clients with Git read access
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Read-only Git audit

Use `git status --short --branch`, targeted `git diff`, recent `git log`, and
`git diff --check` as appropriate. Inspect remotes or `git ls-remote` only when
the user asks for remote metadata and no credentials are required.

- Treat tracked and untracked existing files as user work.
- Scope diffs to the requested files and avoid generated, secret, or huge
  outputs.
- Never run reset, clean, checkout, restore, commit, amend, push, force-push,
  or hook-skipping commands in an audit.
- Report the branch, dirty paths, relevant history, whitespace result, and any
  inability to inspect remote state.

Git evidence describes repository state at one time; it does not prove that a
remote branch, CI run, or deployment matches the local tree.
