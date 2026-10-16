# SpeakQL — Chrome End-to-End Audit & Context Loop

Date: 2026-10-16  
Target requested: `http://localhost:3000/dashboard`  
Repository: `Abhishek232p/SpeakQL`  
Audit mode: remote Chrome attempt + read-only source inspection  
Status: **LIVE BROWSER AUDIT BLOCKED; STATIC CODE REVIEW COMPLETED**  
No production data, account data, database, or deployment was changed.

## 1. Execution truth

A live browser session attempted to open `http://localhost:3000/dashboard`. It received Chrome's connection error page. The browser runs remotely and cannot reach the user's machine-local loopback interface.

Therefore this run did **not** render the actual dashboard or verify live UI, console errors, network requests, or responsive layout. Do not label those checks passed. The repo contains a Playwright script at `scripts/verify-full-browser-suite.mjs`, but its assertions and latest execution output were not independently run in this audit.

## 2. Static source findings

| ID | Severity | Finding | Evidence | Expected behavior / acceptance test |
|---|---|---|---|---|
| SQ-CTX-001 | P1 | Selected starting point is UI-only. `selectedPoint` is used to display a preview; goal submission sends only `description`. The server curriculum generator never receives a structured starting-point field. | `app/dashboard/onboarding-goal-form.tsx`; `app/dashboard/actions.ts:createLearningGoal`; `src/server/goals/repository.ts:createGoal` | Choose each starting point, submit in a test account, and prove the generated curriculum differs according to verified prerequisites. Prefer a server-owned structured onboarding contract rather than trusting UI state. |
| SQ-CTX-002 | P1 | **Patch applied on audit branch, not yet runtime-verified.** Speech recognition now derives a BCP-47 locale from the parsed exercise's language/context cues (Japanese, Hindi, Spanish, German, French, Mandarin, Italian, Portuguese; English fallback). A persisted onboarding locale is still the stronger final design. | `app/dashboard/speakql-lesson-modal.tsx` | Unit-test locale selection; verify the selected locale reaches browser speech recognition and test supported/unsupported browsers. |
| SQ-CTX-003 | P1 | Curriculum generation is based on keyword matching the free-text goal, not a structured combination of native language, target language, proficiency, profession, and learning evidence. | `src/server/goals/curriculum.ts:detectTargetLanguage` and `generateGoalCurriculum` | Generate a deterministic structured plan from explicit onboarding fields. Test ambiguous goals, edits, unsupported languages, and professional domain combinations. |
| SQ-CTX-004 | P1 | **Draft branch contains mastery-gated path logic, but main remains unchanged.** The lesson modal now removes the Skip action, prevents Continue after a failed/unknown evaluation, offers Try Again, and fails closed when the server returns no recognized score. | `src/server/goals/learning-path.ts`; `app/dashboard/speakql-lesson-modal.tsx`; draft PR #1 | Run tests for needs-work, missing evaluation, network error, retry, and mastered progression. Confirm server-side access also rejects locked exercise IDs. |
| SQ-CTX-005 | P1 | The generic professional track list does not include Law or Healthcare, despite these being intended professional pathways. | `app/dashboard/onboarding-goal-form.tsx:PROFESSIONAL_TRACKS` | Add Law and Healthcare only when each has a domain-specific curriculum, evidence-based rubrics, safe scope, and professional-domain simulation. Do not imply legal/clinical qualification or certification. |
| SQ-CTX-006 | P1 | The whiteboard exports a PNG, but its component text instructs the learner to transcribe notes into the response field for rubric evaluation. The drawing itself is not evaluated as handwriting/character correctness. | `src/client/components/digital-practice-whiteboard.tsx`, export action and instructional copy | Either implement handwriting/script recognition with confidence and feedback, or explicitly label the board as freehand notes and require typed/manual verification. Never count a drawn attempt as mastered without evidence. |
| SQ-CTX-007 | P2 | The curriculum is sparse for a “zero to professional” journey: language-specific examples show one foundation exercise and then jump to a professional scenario. | `src/server/goals/curriculum.ts`, Japanese and Hindi branches | Add ordered stages: sound/script recognition → guided stroke/character writing → recall → syllables/words → phrases → sentence construction → short reading → paragraphs → speaking → roleplay → profession simulations. Each stage needs measurable mastery criteria. |
| SQ-CTX-008 | P2 | The canvas resizing code sets canvas dimensions to CSS-pixel width/height; the comment promises Retina/High-DPI handling, but devicePixelRatio scaling is not visible in the sizing implementation. | `src/client/components/digital-practice-whiteboard.tsx:handleResize` | Render at DPR 1, 2, and 3; verify crisp strokes, correct pointer coordinates, no distortion, and preserved strokes after resize/orientation change. |
| SQ-CTX-009 | P2 | The curriculum and evaluation system need an explicit distinction between a valid fallback evaluation and provider-generated evaluation in learner-facing progress. The schema includes evaluation source metadata, but live provider behavior is not confirmed in this audit. | `src/server/evaluation/contracts.ts`, `src/server/evaluation/boundary.ts`, repository evaluation records | Display evaluation provenance clearly. Fallback heuristics must not claim native-level linguistic or handwriting judgment. Test no-provider, timeout, malformed output, and language-specific calibration paths. |
| SQ-CTX-010 | P2 | Documentation claims a 23-point live browser journey is verified, but this audit could not independently reproduce that result because localhost was inaccessible and the Playwright suite was not run here. | `docs/IMPLEMENTATION_STATUS.md`; `scripts/verify-full-browser-suite.mjs` | Attach a timestamped run artifact with commit SHA, base URL, viewport matrix, pass/fail per assertion, screenshots, console errors, and network failures. Keep historical claims separate from this run's status. |

### Confidence labels

- **Proven (source inspection):** selected starting point is not passed as a separate structured field; speech recognition uses Spanish-or-English selection; the main-branch learning path contains attempt-based unlocking; whiteboard copy describes manual transcription for evaluation.
- **Probable:** these defects will cause mismatches in a real learner journey, depending on the exact language/goal selected.
- **Unknown:** the current live Chrome appearance, actual console/network failures, current database behavior, and physical-device behavior. These were not verified in this run.

## 3. Changes written in the draft branch (not yet tested in a local runtime)

- `app/dashboard/speakql-lesson-modal.tsx`: added cue-based speech locale selection for Japanese, Hindi, Spanish, German, French, Mandarin, Italian, and Portuguese; removed the Skip control; prevents progression unless the evaluation score is `mastered`; missing/unknown score no longer gets heuristic mastery; failed answers offer Try Again and preserve the response.
- These are source changes only. Typecheck, unit tests, CI, and actual Chrome behavior have **not** been verified in this tool session. Treat the patch as awaiting validation, not release-ready.

## 4. Context loop — mandatory workflow for every audit/build cycle

Use one loop at a time. Never mark a stage “verified” without saved evidence.

1. **CONTEXT** — record the current commit SHA, target URL, environment, auth state, feature flags, target language, self-reported level, professional goal, and test-account identifier (never store secrets).
2. **HYPOTHESIS** — state one observable claim, e.g. “a beginner cannot open a paragraph-writing lesson before mastering the script checkpoint.”
3. **RENDER** — open the actual app in Chrome; capture desktop, tablet, and mobile screenshots; record route and viewport dimensions.
4. **INTERACT** — execute one learner path with test data: signup/login → onboarding → first lesson → write/draw → submit → evaluation → feedback → retry → unlock check → reload → persistence check.
5. **OBSERVE** — collect screenshot, DOM/accessibility evidence, console logs, failed requests, server response, database evidence where authorized, and exact steps to reproduce.
6. **CLASSIFY** — assign severity P0/P1/P2/P3, confidence Proven/Probable/Speculative/Unknown, affected route/component, user impact, and root-cause hypothesis.
7. **PATCH** — make the smallest scoped code change on a dedicated branch. Never modify production data or deploy as part of an audit loop.
8. **REGRESS** — add a test that fails before the fix and passes after it. Include unit/integration and browser coverage when relevant.
9. **RE-RENDER** — rerun the same browser steps at the same viewport and test state, then add a mobile/tablet regression check.
10. **RECORD** — update this report with commit SHA, test commands, actual outputs, screenshot artifact references, unresolved risks, and next owner action.

Loop exit criteria: the original defect is reproduced, fixed, regression-tested, and re-observed in Chrome. If the browser cannot reach the target, record **BLOCKED** and do not infer visual success from source code.

## 5. Required Chrome route matrix

- `/` — purpose, primary CTA, navigation, responsive overflow.
- `/signup` and `/login` — validation, auth errors, password visibility, keyboard behavior, session creation.
- `/dashboard` — first-run onboarding vs returning learner; no goal vs active goal.
- `/dashboard` learning path — first available node, locked nodes, mastered checkpoint, needs-work retry.
- Lesson modal — prompt, answer modes, evaluation loading/error, retry, next action, close/reopen behavior.
- Whiteboard — draw, undo, clear-confirmation, export, resize, touch/stylus, orientation change.
- Practice Studio / simulator — scenario, language, role, response, error recovery, route back.
- Logout and protected routes — session termination, refresh, direct navigation, two-user isolation.
- Offline / slow network — draft preservation, explicit save status, no false success.
- Viewports — 320×568, 375×667, 768×1024, 1280×800, 1440×900. Check horizontal overflow, visible controls, keyboard focus, touch targets, reduced motion.

## 6. End-to-end golden learner test

Test scenario: a learner selects German as their native language, Japanese as target language, “complete beginner”, and “law” as professional goal.

Expected path:
1. Save structured onboarding fields.
2. Generate the first verified Japanese script task, not a legal paragraph.
3. Show one character with a reference and stroke-order guidance.
4. Accept a drawing attempt and typed transcription as separate evidence.
5. Evaluate only what the system can reliably verify; explain uncertainty.
6. Persist the attempt and a specific correction.
7. On failure, keep the next checkpoint locked and offer targeted retry.
8. On mastery, unlock the next character/skill and record the rule that allowed it.
9. Advance only after script/recall/word/sentence/readiness prerequisites pass.
10. Unlock voice when its prerequisites are met; configure the Japanese locale, not English fallback.
11. Later introduce legal vocabulary, client roleplay, and professional simulations with domain-appropriate rubrics.
12. Reload and sign in on another device; the server-backed learning state must remain consistent.

## 7. Next actions, ordered

1. Make local Chrome available to the test runner or provide a reachable preview URL; then perform the real visual audit before making UI-specific claims.
2. Merge only after review/testing the draft mastery-gating PR; verify server-side authorization of lesson access.
3. Replace the selected-starting-point UI with a structured onboarding schema persisted on the server.
4. Persist target language and locale, then fix voice recognition language selection.
5. Add the script/handwriting foundation sequence and evidence model before adding more professional tracks.
6. Add Law/Healthcare tracks only after their curriculum and evaluation rubrics are reviewed.
7. Re-run the Playwright suite and publish an evidence artifact. Update any “verified” status only from the run output.

## 8. Audit safety

Read-only browser inspection by default. Use disposable test accounts for signup, goal creation, and evaluation. Do not use real patient/client data, do not expose credentials in logs, and do not deploy or migrate databases during the audit loop.
