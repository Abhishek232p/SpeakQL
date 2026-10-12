---
name: portable-debug
description: Reproduce a reported failure, isolate its cause, make a focused fix, and check for regression. Use for errors, broken behavior, failed tests, or unexpected runtime results.
license: Project-local
compatibility: Agent Skills-compatible clients with safe command and log access
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-debug
---

# Reproducible debugging

Compose with `omnirush-debug` when available.

1. Record the exact symptom, command, input, environment, and expected result.
2. Reproduce once with the smallest safe case; inspect relevant logs without
   dumping secrets or unrelated private data.
3. Form a bounded hypothesis and use a discriminating check instead of random
   edits or repeated retries.
4. Fix the narrow cause, preserve the public contract, and test the original
   failure plus the nearest boundary case.
5. If a service, credential, or unavailable dependency blocks reproduction,
   report that blocker rather than inventing a successful result.

After two failed approaches, reassess the evidence and change the approach.
