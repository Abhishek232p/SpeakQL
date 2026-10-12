---
name: portable-handoff
description: Leave a resumable software-project handoff with the goal, changed files, actual checks, blockers, and one concrete next step. Use when pausing work or handing a task to another agent.
license: Project-local
compatibility: Agent Skills-compatible clients with repository documentation access
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-handoff
---

# Resumable handoff

Compose with `omnirush-handoff` when available and write to the project's
existing handoff location rather than inventing a second system.

Include:

- the user goal and current acceptance state;
- files changed and important pre-existing changes preserved;
- exact commands/checks actually run and their results;
- decisions, evidence, risks, blockers, and missing access; and
- the next concrete command or investigation step.

Do not claim tests, browser observations, integrations, credentials, or
remote state that were not actually verified. Keep secrets and private
transcripts out of the handoff.
