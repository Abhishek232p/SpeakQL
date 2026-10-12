---
name: portable-automation-design
description: Design durable recurring or on-demand automation with explicit schedule, timezone, placement, ownership, retries, and receipts. Use when someone wants repeated work or a background run.
license: Project-local
compatibility: Agent Skills-compatible clients with a documented automation surface
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local
  reuse: omnirush automation affordances
---

# Durable automation design

- Define the outcome, inputs, owner, schedule type, IANA timezone, execution
  placement, concurrency, retry/cancel behavior, and success receipt.
- Prefer the product's first-class Automation surface when one exists. For
  OmniRush.ai Desktop, use `automation.propose` for new recurring work and
  preserve its Desktop placement and signed-in runner requirement.
- Do not replace an Automation with cron, Task Scheduler, launchd/systemd, or
  a workspace script. Do not claim an offline desktop runner will execute.
- Distinguish deactivation of future runs from cancellation of an in-progress
  run, and inspect live run state before retrying an ambiguous action.

Document idempotency and safe failure behavior before proposing a schedule.
