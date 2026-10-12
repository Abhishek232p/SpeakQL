---
name: portable-structured-output
description: Validate AI and tool results against a versioned structured contract before using or persisting them. Use when a workflow depends on JSON, schemas, function calls, or model-generated decisions.
license: Project-local
compatibility: Agent Skills-compatible clients with an existing schema validator or equivalent
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Structured result boundary

1. Define the smallest schema that expresses required fields, types, ranges,
   enum values, optionality, and a schema version.
2. Parse untrusted output as data; reject malformed, extra-sensitive, or
   semantically impossible results before side effects or persistence.
3. Use bounded repair/retry only when the provider contract allows it, and
   record the original failure without logging private content.
4. Keep raw evidence separate from normalized data and model interpretation.
5. Test valid, missing, wrong-type, out-of-range, injection-shaped, and
   provider-error fixtures.

A schema proves shape, not truth, authorization, provenance, or safety. A human
or domain review remains required for high-impact claims.
