---
name: portable-architecture
description: Define a small provider-neutral architecture and data flow before implementation. Use when a feature crosses modules, tools, AI providers, persistence, or trust boundaries.
license: Project-local
compatibility: Agent Skills-compatible clients
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Architecture boundary

Describe the real flow from input to result before adding abstractions.

- Identify callers, entry points, owned state, external dependencies, and the
  smallest public interface.
- Mark trusted, untrusted, secret-bearing, and user-owned data boundaries.
- Keep provider-specific code behind a replaceable adapter and validate model
  output before it crosses the application boundary.
- Prefer the existing stack and one vertical slice over speculative services,
  queues, vector stores, or framework additions.
- Record rejected alternatives, operational prerequisites, and the checks that
  will prove the design works.

Do not edit database or security code as a side effect of an architecture
sketch. Hand those changes to the specialized project workflow.
