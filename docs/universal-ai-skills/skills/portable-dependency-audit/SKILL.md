---
name: portable-dependency-audit
description: Inspect dependencies, lockfiles, licenses, advisories, and runtime compatibility without installing or upgrading packages. Use before adopting a library, validating a toolchain, or reviewing supply-chain risk.
license: Project-local
compatibility: Agent Skills-compatible clients with read-only package metadata commands
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Dependency and license audit

1. Read the project manifest and lockfile before checking package metadata.
2. Use safe local version/help/license/audit commands and official repository
   or registry metadata. Pin the exact version in evidence when relevant.
3. Distinguish direct, transitive, development-only, runtime, model, dataset,
   and service licenses. Check maintenance signals without treating stars or
   issue counts as a security guarantee.
4. Compare runtime, native, platform, data-transfer, and operational costs
   with the existing stack.
5. Recommend `REUSE`, `ADAPT`, `REFERENCE`, `SKIP`, or `REJECT`; do not install
   a candidate just to test it.

Keep forced remediation and breaking upgrades out of an audit unless directly
authorized and separately planned.
