---
name: portable-provider-adapter
description: Design provider-neutral AI or speech adapters with explicit schemas, timeouts, redaction, usage accounting, and controlled fallback. Use when integrating a model, transcription, speech, or vendor API.
license: Project-local
compatibility: Agent Skills-compatible clients with an authorized project runtime
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Provider-neutral AI boundary

- Define an application-owned request and response contract before selecting a
  vendor. Keep provider IDs, prompts, headers, and SDK types inside the
  adapter.
- Validate inputs and model/tool output, set bounded timeouts, classify retry
  cases, and make cancellation behavior explicit.
- Redact secrets and unnecessary personal data from logs; record provider,
  model, latency, usage, cost signal, and schema version only when policy
  permits.
- Treat generated evaluation, pronunciation, mastery, or readiness as an
  estimate with evidence and uncertainty, never as certification or truth.
- Keep a deterministic fixture path so core behavior can be tested without a
  live provider.

Do not add credentials, provider packages, or remote calls without explicit
authorization and a reviewed dependency decision.
