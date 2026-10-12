---
name: portable-review
description: Review a named change for bugs, broken behavior, security boundary regressions, and missing checks without editing it by default. Use before handoff or when a second-pass review is requested.
license: Project-local
compatibility: Agent Skills-compatible clients with Git diff and project checks
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-review
---

# Actionable change review

Compose with `omnirush-review` when available.

1. Read the request and acceptance criteria, then inspect the complete diff and
   relevant callers/configuration.
2. Prioritize concrete correctness, data exposure, ownership, error handling,
   compatibility, and missing regression checks.
3. Trace each finding to a file/line or reproducible command and explain the
   user-visible impact.
4. Distinguish blockers from suggestions and state what was not reviewable.

Do not praise or summarize instead of finding evidence. Do not silently edit
the change unless the user separately asks for implementation.
