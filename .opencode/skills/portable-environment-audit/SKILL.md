---
name: portable-environment-audit
description: Audit available runtimes, CLIs, versions, help output, and service reachability without exposing credentials or changing the machine. Use before installs, builds, integrations, or troubleshooting.
license: Project-local
compatibility: Agent Skills-compatible clients with safe local command access
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Environment audit

Build an evidence-based capability inventory before choosing a tool.

- Use safe version, `--help`, `status`, `where`/`Get-Command`, and read-only
  metadata commands. Prefer project-local binaries with `--no-install` when
  the project supports that convention.
- Check the actual shell, OS, runtime, package manager, test runner, browser,
  Git, and connector availability. Record absent tools as blockers.
- Never print environment variables, tokens, `.env` files, saved sessions, or
  credential-store contents. A `401` or unauthenticated response proves only
  reachability, not access.
- Do not install, upgrade, link, login, migrate, or mutate a service during an
  audit unless the user explicitly authorizes that operation.

Report exact commands and exit results, then separate what is available from
what is merely documented or assumed.
