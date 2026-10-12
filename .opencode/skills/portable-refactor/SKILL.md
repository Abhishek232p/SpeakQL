---
name: portable-refactor
description: Change existing code structure while preserving observable behavior and interfaces. Use for cleanup, module moves, or interface migrations that require caller and regression checks.
license: Project-local
compatibility: Agent Skills-compatible clients with source and test access
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-refactor
---

# Behavior-preserving refactor

Load `omnirush-refactor` when available and use this local contract to bound
the work.

- Capture the current callers, public behavior, invariants, and baseline checks
  before changing structure.
- Make one coherent transformation at a time and keep compatibility shims
  explicit if callers cannot move together.
- Search all call sites after an interface change; do not rely on a successful
  compile alone.
- Run focused behavior tests, type/lint checks, and the smallest relevant
  integration check. Compare the diff for accidental formatting or generated
  changes.

If the baseline behavior is unclear, classify the refactor as blocked or
separate it from a behavior change rather than silently redefining the API.
