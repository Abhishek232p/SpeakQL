---
name: portable-requirements
description: Turn an outcome request into bounded acceptance criteria, assumptions, and failure states. Use before implementation when the requested behavior or scope needs a precise contract.
license: Project-local
compatibility: Agent Skills-compatible clients
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-feature
---

# Requirements contract

Compose this entry point with the existing `omnirush-feature` skill when it is
available; do not reproduce that skill's instructions.

1. Restate the user-visible outcome in one sentence.
2. Define observable happy-path acceptance criteria and the relevant empty,
   invalid, permission, timeout, and unavailable-service states.
3. Separate agreed requirements from suggestions and unresolved choices.
4. Name the affected boundary and explicitly exclude unrelated code or data.
5. Choose the smallest check that can prove each criterion.

Ask a focused clarification only when two plausible interpretations would
change the implementation materially. Otherwise proceed with a documented
assumption and keep it visible in the final evidence.
