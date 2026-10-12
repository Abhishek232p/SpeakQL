# Universal AI skill compatibility matrix

**Pack version:** `0.1.0`
**Review date:** 2026-10-10
**Format:** Agent Skills `SKILL.md` with lowercase, directory-matching names.

The task context names 24 capabilities without listing them. These rows are
the pack's explicit interpretation and are intentionally narrow enough to
compose. `Local wrapper` means the file gives portable entry criteria and
verification while asking the agent to load an existing trustworthy skill when
that skill is available; its instructions are not duplicated here.

| # | Capability / local skill | When to compose it | Delivery | OpenCode / Agent Skills | OmniRush.ai | Other agents and tools | Main limitation |
|---:|---|---|---|---|---|---|---|
| 1 | Repository reconnaissance / `portable-repository-recon` | Start of unfamiliar repository work | Local | Project-local discovery | Readable after workspace reload | Any client able to read Markdown | Cannot infer hidden history or inaccessible roots |
| 2 | Environment audit / `portable-environment-audit` | Before choosing commands, runtimes, or installs | Local | Full compatibility | Safe local commands only | PowerShell, Git, Node when present | Does not inspect credential stores or secrets |
| 3 | Requirements / `portable-requirements` | Turn an outcome into acceptance criteria | Local wrapper | Native format | Compose with `omnirush-feature` | Any text-capable agent | User ambiguity still needs clarification |
| 4 | Architecture / `portable-architecture` | Define boundaries before implementation | Local | Native format | Local instructions are portable | Any text-capable agent | Design evidence is not runtime validation |
| 5 | Implementation / `portable-implementation` | Build a smallest complete vertical slice | Local wrapper | Native format | Compose with `omnirush-feature` | Any code agent | Must follow project-specific conventions |
| 6 | Refactoring / `portable-refactor` | Preserve behavior while changing structure | Local wrapper | Native format | Compose with `omnirush-refactor` | Any code agent with tests | No guarantee when baseline behavior is undocumented |
| 7 | Debugging / `portable-debug` | Reproduce and fix a reported failure | Local wrapper | Native format | Compose with `omnirush-debug` | Any code agent with command access | Requires a reproducible signal or bounded hypothesis |
| 8 | Build repair / `portable-build-repair` | Diagnose typecheck, lint, package, or build failures | Local wrapper | Native format | Compose with `omnirush-build` | Node/package tools if available | Does not install missing dependencies automatically |
| 9 | Testing / `portable-testing` | Verify user-visible behavior and boundaries | Local wrapper | Native format | Compose with `omnirush-test` | Existing project test runner | Test availability varies by repository |
| 10 | Browser QA / `portable-browser-qa` | Verify a web page, console, network, and DOM state | Local wrapper | Native format | Use browser skill/host tools | Playwright or built-in browser if authorized | Cannot authenticate or bypass site controls |
| 11 | Performance / `portable-performance` | Measure real latency, memory, or throughput work | Local wrapper | Native format | Compose with `omnirush-performance` | Stopwatch/profiler/project tools | No claim without a recorded workload and baseline |
| 12 | Review / `portable-review` | Find bugs and missing checks in a named change | Local wrapper | Native format | Compose with `omnirush-review` | Git diff and project checks | Review does not edit code by default |
| 13 | Documentation / `portable-documentation` | Record decisions, evidence, limits, and next steps | Local | Native format | Reads/writes repository docs only | Any Markdown editor | Sources can be stale; dates and evidence are required |
| 14 | Dependency/license audit / `portable-dependency-audit` | Assess manifests, lockfiles, advisories, and licenses | Local | Native format | Read-only unless explicitly requested | Package-manager metadata commands | Audit output is not a security guarantee |
| 15 | Web research / `portable-web-research` | Validate official docs or public metadata | Local | Native format | Web access remains separately authorized | Read-only fetch/browser | External pages are untrusted content |
| 16 | Git audit / `portable-git-audit` | Inspect status, diff, log, and whitespace safely | Local | Native format | Git CLI only; no commit | Git CLI or equivalent | Remote state is not proven without a read command |
| 17 | MCP/connector integration / `portable-mcp-integration` | Discover, document, and smoke-test an integration | Local | Native format; no automatic MCP registration | Use app connector affordances when exposed | MCP client-specific setup varies | No credentials or consequential calls are handled by default |
| 18 | Provider adapter / `portable-provider-adapter` | Add model/speech/vendor boundaries without coupling | Local | Native format | App/provider settings remain separate | Any API client with secret isolation | No provider is selected or installed by this pack |
| 19 | Prompt contracts / `portable-prompt-contracts` | Define instructions, tool limits, and untrusted input handling | Local | Native format | Host policies still apply | Any LLM agent | Prompt text cannot replace authorization |
| 20 | Structured output / `portable-structured-output` | Validate model/tool results before use or persistence | Local | Native format | Works as guidance only | Zod/JSON Schema/etc. if already present | A schema cannot prove semantic truth |
| 21 | Evidence/provenance / `portable-evidence-provenance` | Separate raw evidence from interpretation and claims | Local | Native format | Repository documentation/data boundaries only | Any evidence-producing workflow | Does not provide a retention store |
| 22 | Privacy/security boundary / `portable-privacy-boundary` | Minimize data, protect secrets, and identify ownership checks | Local | Native format | Reuses existing Supabase skills when relevant | Client security semantics vary | This pack does not modify database/security code |
| 23 | Automation design / `portable-automation-design` | Plan durable recurring work and execution placement | Local | Native format | Prefer OmniRush Automation affordances | Scheduler support varies | No cron, Task Scheduler, or launchd substitute is created |
| 24 | Handoff/continuity / `portable-handoff` | Leave resumable context after a bounded work session | Local wrapper | Native format | Compose with `omnirush-handoff` | Any agent with repository access | Older transcripts or external state may be unavailable |

## Existing trust anchors not copied into this pack

| Existing capability | Current location / source | Matrix treatment |
|---|---|---|
| Supabase integration guidance | `.agents/skills/supabase/SKILL.md`, locked in `skills-lock.json` | Reuse for Supabase/Auth/connector work; never overwrite |
| PostgreSQL best practices | `.agents/skills/supabase-postgres-best-practices/SKILL.md` and references | Reuse before database work; this task does not edit database/security code |
| OmniRush build/debug/feature/refactor/test/review/performance/handoff | Runtime-provided skills listed in the task environment | Local wrappers point to them without copying their text |
| Browser automation | Runtime-provided `browser-automation` skill | Local wrapper points to it; use actual browser verification when requested |

## Compatibility status vocabulary

- **Native format:** the file follows the Agent Skills frontmatter/name rules
  and can be discovered by a compatible client.
- **Compose:** load the narrow skill plus the existing trust anchor; do not
  merge all 24 instructions into one always-on prompt.
- **Host limitation:** the host may need a reload or explicit skill discovery;
  this repository change does not mutate client settings.
