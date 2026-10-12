---
name: portable-build-repair
description: Diagnose and repair a failing build, typecheck, lint, package, or toolchain step using the repository's actual commands. Use when a check fails or a required tool is unavailable.
license: Project-local
compatibility: Agent Skills-compatible clients with local command execution
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-build
---

# Build and toolchain repair

Load `omnirush-build` when available.

- Read the relevant manifest, lockfile, scripts, and tool help before guessing
  a command or version.
- Reproduce the exact failing command and preserve its first useful error.
- Prefer a focused source/config fix over dependency churn. Never run forced
  upgrades or installs during diagnosis without explicit permission.
- Rerun the failed check and any directly affected check. Record unrelated
  pre-existing failures separately.

Do not claim a build is repaired when only a cache was cleared or a command was
skipped. If the tool is absent, document the supported install path without
installing it.
