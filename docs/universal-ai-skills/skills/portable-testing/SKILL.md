---
name: portable-testing
description: Add or run meaningful tests for user behavior, boundaries, and failure states using the project's existing test tools. Use after a feature, bug fix, integration change, or behavior-preserving refactor.
license: Project-local
compatibility: Agent Skills-compatible clients with the repository test runner available
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-test
---

# Meaningful verification

Compose with `omnirush-test` when available.

- Start from the acceptance criteria or reproduced failure, not implementation
  branches.
- Prefer a small user-visible or contract test and cover the relevant empty,
  invalid, unauthorized, timeout, and unavailable-dependency paths.
- Use deterministic fixtures and avoid real credentials, production data,
  remote mutation, or tests that only mirror private implementation details.
- Run the narrow check first, then the project's required lint/type/build/test
  commands when practical. Report skipped checks and why.

Coverage percentage alone is not proof. A passing test proves only the stated
fixture and boundary.
