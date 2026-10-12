---
name: portable-browser-qa
description: Verify a web page or browser flow by observing the actual page, DOM/accessibility state, console errors, and failed network requests. Use for UI changes or reports that a page is broken.
license: Project-local
compatibility: Agent Skills-compatible clients with an authorized browser or Playwright runner
metadata:
  pack: universal-ai-skills
  version: "0.1.0"
  mode: local-wrapper
  reuse: browser-automation
---

# Browser verification

Use the available `browser-automation` skill or authorized browser tool rather
than inferring behavior from source alone.

1. Identify the exact local URL and start command without printing secrets.
2. Observe the page after each navigation or action; references expire after
   navigation.
3. Check title/content, accessible controls, expected state changes, console
   errors, failed requests, and relevant HTTP status codes.
4. Use a screenshot only when text/DOM evidence cannot answer the question.
5. Never request or record passwords, tokens, cookies, or one-time codes, and
   never use browser tools to control the OmniRush.ai application itself.

Report what was actually observed, including authentication or environment
blockers. A dispatch receipt is not proof that the page reached the goal.
