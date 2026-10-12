---
name: portable-implementation
description: Implement the smallest complete user flow while following repository conventions, preserving unrelated work, and proving the result with focused checks. Use after requirements are bounded.
license: Project-local
compatibility: Agent Skills-compatible clients with the project toolchain available
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-feature
---

# Smallest complete implementation

Compose with `omnirush-feature` when available. Keep this entry point focused
on execution and evidence.

1. Inspect the existing entry point, data flow, and nearby tests.
2. Implement one usable path from the real interface to the real result.
3. Reuse existing utilities and dependencies; do not add a package for a
   hypothetical future need.
4. Validate inputs and external results at the boundary, and keep secrets out
   of client code and logs.
5. Add a meaningful behavior check for the changed outcome, then run the
   narrow project checks and report exact commands.

Do not claim completion because a type, button, route, or adapter exists in
isolation. Preserve unrelated modifications and stop at the requested scope.
