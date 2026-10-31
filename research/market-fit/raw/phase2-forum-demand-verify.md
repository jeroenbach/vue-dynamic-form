# Phase 2 Forum Demand Leads — Verification Notes (2026-09-30)

## 1. open-formulieren/open-forms #2441 — "Repeating groups: no possibility to use logic for each item"

- URL: https://github.com/open-formulieren/open-forms/issues/2441
- Verdict: **live**
- State: OPEN (confirmed via GitHub API), opened 2022-12-07, assigned to sergei-maertens.
- Confirmed accurate: on 2026-09-09, magdalena-source asked (citing Den Haag's internal issue #902) whether a fix is planned. sergei-maertens replied same day: "There is currently no budget for anything related to repeating groups, so no, it's not planned. We've reached out repeatedly in the past months to various stakeholders, including DH, to say that we can now pick up long-standing issues in repeating groups, but that we require budget, and we had zero positive response to that."
- Also confirmed: joeribekker's 2023-02-24 comment "Initial assessment: Giving it prio high because it's reported often by clients," and the 2023-06-28 comment "Will be picked up under utrecht" (matches the "owner: utrecht" framing). Den Haag's want is documented in a 2023-03-09 comment referencing "DH Taiga 47 / 400," and again in the 2026-09-09 thread via "DH issue #902" — both Utrecht and Den Haag stakeholder involvement check out.
- One correction to the lead's framing: the thread shows repeated *internal* budget asks by the maintainer to stakeholders (not necessarily Jeroen/outside parties), all met with "zero positive response." This is useful context for outreach — the maintainer has already tried the direct-ask path and failed, so a cold pitch referencing the thread should lead with a concrete technical answer/demo rather than just "we heard you need budget."
- The lead's core facts (date, quote, stakeholders, open status) are all accurate as described.

## 2. vee-validate discussions #5056 — "Conditional validation with yup and useField"

- URL: https://github.com/logaretm/vee-validate/discussions/5056
- Verdict: **live**
- Confirmed via GraphQL: created 2025-06-20T14:30:36Z, `comments.totalCount: 0`. Zero replies, still unanswered as of 2026-09-30 (over 15 months open with no response).
- Content matches the lead's description: developer wants to conditionally require fields in one form section based on a status field in a different section, hitting yup `.when()` cross-reference limits once the schema is split per-`useField` component.
- No corrections needed. Good, low-cost, uncontested reply target.

## 3. formkit/formkit #1774 — schema field wrong family/DOM after unmount+remount with conditional siblings

- URL: https://github.com/formkit/formkit/issues/1774
- Verdict: **misdescribed** (minor but material correction below)
- Confirmed: filed 2026-09-29, closed same day (`closed_at: 2026-09-29T19:56:22Z`, `state_reason: "completed"`).
- Correction: the lead states the issue was "resolved and closed same day via FormKit's paid Enterprise support." I found **no evidence of this** — there is no mention of Enterprise support anywhere in the issue body or comments, and `state_reason: "completed"` on GitHub just means it was closed as resolved, not how. The comment thread instead shows the reporter (mbertolani) doing extensive further troubleshooting *after* filing: trying a `$formkit: "group"` wrapper (made it worse — whole group replaced by sibling's DOM), then avoiding unmount/remount entirely via `node.input()` (corruption still occurred, and turned out to be sticky/cache-persistent across resets, corrupting unrelated fields on subsequent calls). This reads as an escalating, still-messy bug investigation, not a same-day clean resolution — the "completed" state reason may just reflect it being superseded/merged/deduped rather than fixed. Do not cite this issue as resolved via paid support; that detail is unsupported by the public thread.
- The reproduction schema is a generic close/reopen with 8 fields (5 carrying `if`), not confirmed to be from "a production medical 'critical finding report' form" — I did not find that framing in the issue body; the schema field names are generic (`field_a` through `field_i`), no domain/industry context is stated. That specific claim in the lead is not supported by the source and should be dropped or re-verified.
- What is solid and usable as evidence: this is a real, fresh (2026-09-29), well-documented structural bug where FormKit's schema-array conditional siblings corrupt node identity/DOM on remount, with the reporter explicitly noting "repeater is built on per-item group nodes, I'd expect it to hit the same issue." That part supports the "recurring structural weakness in schema-array + conditional-siblings" narrative. I did not independently re-verify the four older FormKit issues (#583, #1044, #1144, #1650) cited in the lead — treat those as unverified until checked.
- Recommendation: usable as comparison-post evidence, but drop the "medical form" and "resolved via paid Enterprise support" claims, or replace with "closed same day as 'completed' with no public explanation of the fix, despite the reporter's own troubleshooting still showing the bug unresolved across three different workarounds."
