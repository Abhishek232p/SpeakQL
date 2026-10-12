---
name: portable-evidence-provenance
description: Capture provenance for facts, model outputs, evaluations, and decisions by separating source evidence from interpretation. Use when an AI workflow produces advice, scores, summaries, or records that must be explainable.
license: Project-local
compatibility: Agent Skills-compatible clients with a documented record or artifact boundary
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
---

# Evidence and provenance

For every material claim, preserve as appropriate:

- source or input reference, retrieval/creation time, context and jurisdiction;
- transformation, prompt/instruction version, model/provider, and schema
  version;
- quality checks, uncertainty, reviewer state, and correction history; and
- retention, access, and deletion expectations.

Keep raw user evidence, normalized facts, model interpretation, and final
action as distinct records or sections. Never turn an unverified model score
into a certification, diagnosis, employment guarantee, or authoritative fact.

If provenance is missing, label the result as incomplete and do not invent a
source or confidence value.
