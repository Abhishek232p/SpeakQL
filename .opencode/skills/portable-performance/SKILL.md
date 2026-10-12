---
name: portable-performance
description: Measure and improve a reported latency, memory, throughput, or resource problem using a real workload and comparable evidence. Use when speed or resource usage is part of the request.
license: Project-local
compatibility: Agent Skills-compatible clients with a repeatable local workload
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: omnirush-performance
---

# Evidence-based performance work

Load `omnirush-performance` when available.

- Define the workload, input size, environment, warm-up, repetitions, and
  metric before changing code.
- Record a baseline using the same command and data shape that will be used to
  compare the result.
- Change one likely bottleneck at a time; preserve correctness and inspect
  memory/concurrency effects, not just the best latency.
- Re-run baseline and candidate under comparable conditions and report the
  measurements, variance, and tradeoffs.

Do not optimize from intuition alone or claim improvement from an unrepeatable
single run. Avoid production traffic and sensitive data in benchmarks.
