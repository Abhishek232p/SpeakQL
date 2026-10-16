# SpeakQL — ASD-STE100-Inspired Context-Loop Engineering Specification

**Status:** Product engineering specification / implementation contract  
**Product:** SpeakQL  
**Version:** 1.0  
**Date:** 2026-10-16  
**Relationship to ASD-STE100:** This document borrows the principles of controlled language, clear instructions, consistent terminology, and explicit verification. It is **not** an official ASD-STE100 standard or a claim of compliance.

## 1. Product intent

SpeakQL exists to make learning and real-world skill development feel accessible, comfortable, clear, and efficient. It should help a learner understand what to do next, practise without fear, receive useful feedback, remember corrections, and build evidence of growing capability.

The product must support learning goals across languages, communication contexts, and professional domains. It must not promise instant mastery or guarantee that a learner becomes qualified for a regulated profession. Progress must be earned through observable evidence, not inferred from time spent or a motivational score.

**Product promise:** Make the next useful learning action obvious, easy to start, safe to repeat, and connected to a real-world goal.

## 2. Design principles

1. **Reduce friction, not substance.** Make navigation and instructions easy. Do not remove the practice needed to build durable skill.
2. **One primary action at a time.** Each screen should make the next step clear, while keeping help, settings, and exit controls available.
3. **Plain language first.** Use short sentences, familiar words, consistent labels, and one instruction per step where possible.
4. **Learner control.** Let users pause, repeat, slow down, change input mode, review feedback, and request an explanation.
5. **No shame.** A mistake is evidence for the next practice action, not a moral judgement. Avoid punitive copy and manipulative streak pressure.
6. **Multimodal access.** Support manual typing, speaking, listening, reading, and writing where the device and lesson support them. Provide equivalent alternatives when a mode is unavailable.
7. **Mastery requires evidence.** A click, long answer, speech transcript, session duration, or XP award is not proof of competence.
8. **Personalise transparently.** Explain why a lesson is recommended and let the learner correct inaccurate assumptions.
9. **Privacy by design.** Explain microphone use, provide controls, minimise retained audio, and give users access to their learning records and deletion controls consistent with policy.
10. **Professional humility.** Professional scenarios are practice and readiness support. They are not legal, clinical, licensing, or certification decisions.

## 3. The learning loop

Every learning interaction must follow this cycle:

**Goal → Learner context → Competency graph → Next-best action → Learn → Practise → Observe evidence → Evaluate → Explain → Save mistake/strength → Update mastery estimate → Recommend next action → Repeat.**

### Required loop state

- Goal and target outcome
- Native language, target language, and locale when relevant
- Current proficiency and confidence in the self-report
- Accessibility preferences and available input modes
- Competency and prerequisite IDs
- Current exercise and its success criteria
- Learner response and evidence modality
- Evaluation result, confidence, rubric version, and explanation
- Repeated mistake links, if any
- Mastery estimate and its evidence history
- Next recommended action and rationale
- Retry, pause, resume, and help state

Do not store only a single opaque progress percentage. Preserve the underlying evidence that explains progress.

## 4. Universal learning experience

SpeakQL must provide a consistent experience across these modes:

### A. Manual typing
- Show one clear prompt and the required response format.
- Keep the response editable until submission.
- Preserve the response if a network request fails.
- Distinguish a rejected response from an unavailable evaluator.
- Give specific feedback: what worked, what needs correction, and one example of a better response.
- Allow retry without losing the original attempt.

### B. Speaking and listening
- Ask for microphone permission only when needed.
- Show the active language/locale before recording.
- Show recording, processing, transcript, and error states.
- Allow the learner to stop, replay where supported, edit a transcript when appropriate, or switch to typing.
- Do not infer pronunciation accuracy from a transcript alone.
- Keep speech-to-text, pronunciation assessment, fluency assessment, and semantic evaluation as separate signals.
- If speech recognition is unsupported or fails, offer a clear alternative without blocking the learner's overall progress.

### C. Writing and script practice
- Provide visual examples, guided practice, recall, and independent attempts in a gradual sequence.
- A drawing/whiteboard image must not count as correct handwriting unless a supported recognition process evaluates it with adequate confidence.
- If handwriting recognition is unavailable, label the board as a practice surface and ask for a typed answer or transparent self-check.
- For scripts such as Hiragana, Katakana, or Devanagari, teach small, ordered sets before combining them into words and sentences.

### D. Reading and comprehension
- Progress from recognition to words, phrases, sentences, short passages, and authentic contextual material.
- Let learners reveal hints progressively.
- Separate understanding the meaning from recognising the written form and from producing the form.

### E. Conversation and roleplay
- Provide a clear persona, goal, context, and expected interaction length.
- Adapt the roleplay to the learner's demonstrated level.
- Give the learner a chance to try again after feedback.
- Assess contextual appropriateness, clarity, language accuracy, and professional register separately where relevant.
- Do not present generated roleplay as authoritative professional advice.

## 5. Adaptive curriculum contract

The curriculum must be generated from structured inputs, not free-text keyword matching alone.

### Minimum onboarding fields
- Learning goal / desired real-world outcome
- Native or preferred explanation language
- Target language, when relevant
- Starting level selection: `Fresher`, `Intermediate`, or `Advanced`
- Current proficiency (self-reported, diagnostic only)
- Professional or everyday context
- Target environment/country/culture when relevant
- Preferred practice modes: type, speak, listen, read, write
- Session duration and accessibility preferences

### Starting-level behavior
- **Fresher:** begin with the first foundational sequence and verify each prerequisite.
- **Intermediate:** begin with an intermediate-appropriate placement task; identify and assign missing prerequisites based on evidence.
- **Advanced:** begin with advanced diagnostic tasks; focus on demonstrated gaps rather than repeating mastered material.
- The selected level is an initial preference, not proof of mastery. A diagnostic must validate the starting point. If diagnostic/branching support is not implemented for a language, disclose that limitation and do not pretend the learner has been automatically placed.

### Curriculum hierarchy
1. Orientation and diagnostic baseline
2. Foundational recognition and comprehension
3. Guided production
4. Independent production
5. Short contextual tasks
6. Conversation or domain simulation
7. Mixed-context transfer
8. Retention review
9. Performance checkpoint

These stages are a template, not a universal rigid sequence. The competency graph must determine prerequisites. A learner may test out of a prerequisite only after a valid diagnostic assessment produces sufficient evidence; a self-selected level cannot bypass mastery gates.

### Language-specific foundation example
For Japanese, the path may include sound awareness, Hiragana recognition, guided character production, recall, simple syllables/words, Katakana, common vocabulary, sentence patterns, listening, speaking, polite forms, Keigo, and professional simulations. Exact order must be reviewed by qualified language specialists and validated with learners.

### Professional domain example
A goal such as “communicate effectively with a Japanese law-firm team” should distinguish language ability, professional register, legal terminology, interaction skills, and domain knowledge. Use qualified sources and experts. SpeakQL must not imply that language practice alone qualifies someone to practise law.

## 6. Mastery and progression rules

1. Only a valid, persisted evaluation with an allowed status can update mastery.
2. A missing response, unknown status, timeout, evaluator error, or network failure must not produce mastery.
3. A `needs_work` result keeps dependent lessons locked.
4. A prerequisite unlocks only when the latest valid evaluation satisfies the defined mastery policy.
5. High-risk or foundational competencies may require repeated evidence across different contexts.
6. The server must enforce prerequisite rules. Hiding a button in the UI is not a security or progression boundary.
7. Direct requests for locked exercise IDs must be rejected server-side.
8. Retakes must not inflate progress, XP, or mastery merely through repeated submissions.
9. Mastery thresholds, rubric versions, evaluator confidence, and overrides must be auditable.
10. If the evaluator is unavailable, save the attempt as pending/unverified and let the learner retry or continue only with independent, non-dependent activities that the policy explicitly allows.

### Evaluation result states
- `mastered`: the configured rubric is satisfied with sufficient evidence.
- `needs_work`: the response was evaluated but one or more required criteria were not satisfied.
- `pending`: evidence exists but evaluation is not complete.
- `unverified`: evaluation failed or evidence is insufficient.
- `not_attempted`: no valid attempt exists.

Never silently map `pending`, `unverified`, unknown, or missing values to `mastered`.

## 7. Feedback and mistake memory

Each evaluated attempt should produce, where supported:
- One specific strength
- The most important correction
- A short explanation in the learner's preferred language
- A corrected example
- An optional hint
- A retry action
- A link to the competency and rubric criterion
- A confidence indicator when evaluation uncertainty matters

Mistake records should include competency, error type, context, frequency, recency, correction, evidence references, and review status. Avoid labelling the person as bad or incapable. The system should say “This pattern appeared again” rather than “You always make this mistake.”

Use spaced review only where it helps retention. Do not turn every interaction into a notification or use anxiety, shame, streak loss, or artificial scarcity to force engagement.

## 8. Psychology and philosophy: evidence-led, humane application

Use learning-science principles as hypotheses to test, not as tricks to manipulate people.

- **Retrieval practice:** ask the learner to recall before showing the answer when appropriate.
- **Spacing:** revisit important material after delays rather than relying only on massed repetition.
- **Worked examples and fading:** demonstrate a correct example, then remove support gradually.
- **Desirable difficulty:** challenge the learner enough to learn, but not so much that instructions become confusing or inaccessible.
- **Feedback timing:** give timely, actionable feedback and allow reflection.
- **Cognitive load:** break complex tasks into manageable steps; avoid excessive simultaneous instructions.
- **Interleaving and transfer:** mix skills and contexts after foundations are stable.
- **Self-efficacy:** show concrete evidence of improvement and attainable next steps without exaggerating progress.
- **Autonomy:** let learners choose goals, modes, pace, and whether to repeat.
- **Metacognition:** ask short reflection questions when useful, such as “What was hardest?” or “What will you try differently?”
- **Accessibility:** respect disability, device constraints, literacy, bandwidth, language, and fatigue.
- **Cultural humility:** do not stereotype learners or treat one culture's communication style as universally superior.

A/B tests must measure learning outcomes, retention, task success, accessibility, and learner trust—not only time in app, clicks, or daily active use. Stop experiments that increase engagement while harming learning, wellbeing, or trust.

## 9. ASD-STE100-inspired writing rules for product copy

- Use one term for one concept.
- Use active voice and direct instructions.
- Keep instructions short and in the order the learner must perform them.
- Explain technical terms before use.
- Avoid idioms, slang, sarcasm, and ambiguous encouragement.
- State what happened and what the learner can do next.
- Separate confirmed results from estimates and suggestions.
- Do not say “correct” if the system only checked whether a field was non-empty.
- Do not say “fluent,” “expert,” “job-ready,” or “certified” without a defined and validated basis.
- Keep error messages actionable and non-blaming.

**Example**
- Avoid: “Amazing! You're basically fluent. Smash continue!”
- Prefer: “Your answer met the criteria for this exercise. You can continue to the next activity.”
- Avoid: “Something went wrong.”
- Prefer: “We could not evaluate this answer because the connection failed. Your response is saved. Try again when you are online.”

## 10. Accessibility and failure-state matrix

Every major interaction must handle:
- Keyboard-only navigation
- Screen readers and meaningful labels
- Focus order and visible focus
- Text resizing and responsive layout
- Reduced motion preferences
- Colour contrast and non-colour status indicators
- Slow or interrupted network
- Session expiry
- Microphone denied or unavailable
- Unsupported speech recognition
- Empty, malformed, or very long answers
- Duplicate submission
- Evaluator timeout, invalid JSON, low confidence, or provider outage
- Save/retry/resume
- Mobile viewport and desktop viewport
- Learner pause and exit without losing work

A fallback mode must preserve the learning objective as much as possible. If speaking is unavailable, typing may preserve semantic practice, but the system must not claim to have assessed pronunciation.

## 11. Data, privacy, and security

- Collect only data needed for the learning function.
- Explain when audio is processed and whether it is stored.
- Prefer retaining transcripts/evaluation summaries over raw audio when possible and consistent with user consent and product needs.
- Apply authentication and ownership checks to goals, exercises, attempts, evaluations, and learning records.
- Enforce access to each record on the server.
- Validate user input and AI output with schemas.
- Treat retrieved web content and learner-provided material as untrusted input.
- Do not let model-generated text bypass access controls or mastery rules.
- Record audit events for evaluation versions, mastery updates, and administrative overrides.
- Provide clear retention, export, and deletion policies.
- Never expose secrets or personal data in logs.

## 12. System architecture boundaries

- **Experience layer:** web/mobile interfaces, input-mode controls, accessibility, offline/error feedback.
- **Goal engine:** structured goals and onboarding context.
- **Curriculum engine:** competency graph, prerequisites, ordered learning activities.
- **Content/knowledge layer:** reviewed sources, provenance, versioning, and domain boundaries.
- **Coach orchestration:** selects a teaching/practice action and calls tools under explicit policy.
- **Input services:** typing, speech recognition, writing/whiteboard, reading/listening.
- **Evaluation services:** language, semantics, pronunciation, fluency, writing, and domain rubric signals kept distinct.
- **Evidence store:** immutable or auditable attempts, evaluation results, rubric versions, and provenance.
- **Mastery service:** updates state from valid evidence and enforces prerequisites.
- **Mistake memory:** stores patterns and generates review targets.
- **Next-best-action engine:** selects the next step and explains why.
- **Observability:** structured logs, traces, latency, cost, errors, and evaluation quality.
- **Admin/research:** content review, experiment controls, quality monitoring, and issue triage.

LLMs may assist with teaching and feedback. They must not own security, record ownership, or the final authority to unlock a protected prerequisite without server validation.

## 13. Core acceptance criteria

A release candidate is not accepted until automated tests and a live browser/device run verify the relevant flows.

### Onboarding
- User can set a goal and preferred explanation language.
- Target language and input preferences are persisted.
- Self-reported proficiency is diagnostic only.
- Ambiguous or unsupported choices receive a clear explanation.

### Lesson
- One clear instruction and success criterion are visible.
- Type, speak, write, read, and listen modes appear only when supported by that activity/device.
- The learner can pause, retry, switch to an alternative mode, and resume.
- Original attempts remain accessible according to retention policy.

### Evaluation
- Every result has a schema, source, rubric version, and appropriate status.
- Network/provider failures never create false mastery.
- Feedback references actual evaluation evidence.
- Pronunciation is not inferred from text alone.

### Progression
- Needs-work and unverified results do not unlock dependent lessons.
- Mastery unlocks only the correct next node.
- Direct API access to locked exercises is denied.
- Duplicate requests do not inflate mastery or rewards.

### Personalisation
- Recommendations use evidence and prerequisite rules.
- The interface explains why an activity is recommended.
- Learners can correct inaccurate context and control their pace.

### Quality
- Unit tests, integration tests, accessibility checks, and browser E2E tests pass.
- Real supported-language flows are manually verified.
- Performance and error telemetry are reviewed.
- No release is labelled production-ready without actual CI/deployment/runtime evidence.

## 14. Required engineering workflow: Context Loop

For every code change or feature:
1. **Observe:** inspect the actual repository, current branch, relevant files, tests, and runtime evidence.
2. **State:** define the user problem and desired outcome.
3. **Hypothesise:** identify the likely cause and weakest assumption.
4. **Specify:** write acceptance criteria and failure states before implementation.
5. **Design:** define UX, data contracts, state transitions, security boundaries, and observability.
6. **Implement:** make the smallest coherent change on a feature branch.
7. **Test:** add regression tests for success, failure, boundary, retry, and permission cases.
8. **Verify:** run typecheck, lint, unit/integration tests, build, and browser E2E where available.
9. **Inspect:** review diffs, logs, test output, data changes, and unintended side effects.
10. **Record:** update this specification/audit log with commit, evidence, known gaps, and rollback plan.
11. **Release gate:** do not merge or deploy if critical checks are missing or failing.
12. **Learn:** observe real outcomes with consent, assess effectiveness, and update the product from evidence.

Every status report must distinguish:
- **Written:** code or docs changed.
- **Tested:** named tests actually executed and their results.
- **Verified:** observed behavior matches the acceptance criteria.
- **Released:** merged/deployed with a deployment identifier.
- **Unknown:** not checked or evidence unavailable.

Do not report a test as passed merely because a test was written. Do not report a browser flow as verified when the browser could not reach the application.

## 15. Copy-paste master engineering prompt

You are the engineering and learning-science agent for **SpeakQL**. Treat this document as the product contract.

Your objective is to make learning easier to access, easier to understand, comfortable to practise, and more effective at building durable real-world capability. Support manual typing, speaking, listening, reading, and writing, including script practice, where each modality is genuinely implemented. Build one coherent learning system, not a set of disconnected feature demos.

Before editing:
1. Inspect the actual repository, branch, current implementation, relevant tests, API contracts, and audit notes.
2. Identify the smallest high-impact gap and the evidence for it.
3. Write acceptance criteria for normal, error, retry, accessibility, privacy, and security paths.
4. Check whether the change crosses frontend, backend, database, evaluation, or access-control boundaries.

Implement:
- Structured onboarding with native/preferred language, target language, goal, context, proficiency diagnostic, practice modes, accessibility preferences, and session length.
- A prerequisite-aware competency graph and adaptive curriculum.
- Gradual foundations for script, sound, recognition, recall, words, sentences, reading, writing, listening, speaking, and contextual roleplay.
- Reliable typing, voice, writing, reading, and listening interactions with explicit fallback behavior.
- Evidence-based evaluation, explainable feedback, mistake memory, retention review, and next-best-action recommendations.
- Server-enforced mastery gates and auditable progress.
- Accessible, plain-language UX with no shame, coercive engagement mechanics, or unsupported claims.
- Human-reviewed sources and scope boundaries for professional-domain training.

Engineering rules:
- Do not use free-text keyword matching as the only source of structured learner context.
- Do not treat self-reported proficiency as verified mastery.
- Do not treat a transcript as pronunciation evidence.
- Do not treat a whiteboard image as correct handwriting without supported recognition.
- Do not award mastery on missing, failed, unknown, or low-confidence evaluation.
- Do not rely on UI-only locks; enforce access and progression server-side.
- Do not change production data, secrets, authentication policy, migrations, or deployment without an explicit scoped plan and necessary authorization.
- Do not invent successful tests, browser observations, or deployment status.
- Prefer minimal, reviewable changes with regression tests.
- Use current repository conventions and verify dependencies before adding tools.

Required workflow:
OBSERVE → SPECIFY → DESIGN → IMPLEMENT → TEST → VERIFY → AUDIT → DOCUMENT → RELEASE GATE → LEARN.

At the end, report:
1. Files changed and commit/branch.
2. User-visible behavior added or corrected.
3. Tests actually run with exact results.
4. Browser/device verification actually performed.
5. Security, privacy, accessibility, and progression checks.
6. Known gaps and risks.
7. Next smallest high-value action.
8. Whether the change is merely written, tested, verified, or released.

Do not claim complete end-to-end functionality until the critical learner journey has passed from onboarding through a persisted attempt, valid evaluation, mastery update, and server-enforced next-step selection.

## 16. First implementation backlog

### P0 — Integrity and access
- Verify server-side rejection of locked exercise IDs.
- Ensure all evaluation outcomes have explicit status and provenance.
- Test missing provider, malformed response, timeout, duplicate submission, and network failure.
- Ensure the UI never advances on unknown evaluation results.

### P1 — Structured learner context
- Persist native/preferred language and target-language locale.
- Replace cue-based locale guessing with structured language metadata.
- Make profession/context inputs affect the generated competency graph.
- Ensure starting-level self-report never bypasses evidence gates.

### P1 — Foundation learning
- Build a reviewed, ordered script/character sequence for the initial supported languages.
- Add recognition, guided practice, recall, and contextual use.
- Clearly separate whiteboard drawing from handwriting evaluation.
- Add lesson-level acceptance tests for every modality.

### P1 — Universal practice modes
- Verify manual typing and response persistence.
- Verify speech locale, permission, transcript, and fallback states.
- Add listening and reading evidence paths.
- Add writing support and transparent evaluation limits.

### P2 — Adaptive intelligence
- Add evidence-linked mistake memory.
- Add spaced review and cross-context transfer tasks.
- Explain every next-best-action recommendation.
- Validate learning outcomes with voluntary, privacy-aware user research.

### P2 — Quality and rollout
- Run full CI, build, unit/integration tests, and browser E2E.
- Verify desktop and mobile responsive behavior and accessibility.
- Review evaluation quality across supported languages and learner levels.
- Release gradually and monitor errors, learning outcomes, and user trust.

## 17. Definition of done

SpeakQL is end-to-end for a specified learning path only when a real test learner can:
1. Complete structured onboarding.
2. Receive a curriculum based on their selected goal and context.
3. Start the correct foundational activity.
4. Submit an attempt using a supported modality.
5. Receive a valid, evidence-linked evaluation or an explicit unverified status.
6. See a useful explanation and retry when needed.
7. Have the attempt and result persisted.
8. Remain blocked from dependent content until mastery criteria are met.
9. Unlock the correct next step after valid mastery.
10. See their mistake memory and next recommendation update.
11. Resume after refresh/session interruption without losing state.
12. Complete the journey in a tested browser/device environment.

**The goal is not maximum time spent in SpeakQL. The goal is durable learning, meaningful capability, learner agency, and trustworthy evidence of progress.**
