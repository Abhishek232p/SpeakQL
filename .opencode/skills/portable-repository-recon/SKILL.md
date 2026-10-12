---
name: portable-repository-recon
description: Inspect an unfamiliar repository safely before making changes. Use when work starts in a new workspace or when existing changes and conventions must be preserved.
license: Project-local
compatibility: Agent Skills-compatible clients with repository read access
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Repository reconnaissance

Use this as the first pass for repository work.

1. Confirm the working directory and authorized scope.
2. Read applicable `AGENTS.md`, `CLAUDE.md`, README, instruction, and tool
   configuration files before editing.
3. Inspect `git status`, the current diff, recent history, and only the
   manifests relevant to the request. Treat existing changes as user work.
4. Map entry points, tests, scripts, and skill/config roots with targeted
   searches instead of dumping secrets or large generated trees.
5. Record facts as `PROVEN`, `PROBABLE`, or `UNKNOWN`, and list blockers.

Do not reset, clean, checkout, commit, or overwrite unfamiliar work. Do not
read `.env` values, credential stores, or private browser data. End with a
short evidence table and the smallest safe next step.
