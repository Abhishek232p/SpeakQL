---
name: portable-documentation
description: Write or update concise project documentation from verified evidence, including decisions, classifications, commands, licensing, risks, and blockers. Use when a workflow or audit needs to remain resumable.
license: Project-local
compatibility: Agent Skills-compatible clients with repository documentation access
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Evidence-first documentation

Document the result someone else can verify.

- State scope, date, environment, and the exact files or resources inspected.
- Use clear classifications such as `PROVEN`, `PROBABLE`, `UNKNOWN`,
  `ADOPT`, `REUSE`, `REFERENCE`, `SKIP`, and `REJECT`.
- Include exact commands and outcomes, not generic claims that a check passed.
- Record licensing and maintenance evidence separately from fit or popularity.
- Keep risks, limitations, and next actions visible; do not turn a blocker into
  a recommendation that sounds complete.

Do not include credential values, private session data, or speculative facts.
Prefer a focused table and a short narrative over a copied external document.
