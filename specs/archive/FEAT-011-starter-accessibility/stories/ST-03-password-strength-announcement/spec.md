---
id: ST-03
type: story
feature: FEAT-011
status: done
approved_by: Jeroen
pr: ""
---

# Story: Password strength announced to screen readers on blur

## Decided without Jeroen (research)

Settled from research during `/spec:discuss`, not reviewed by Jeroen. Override any of these freely.

- Adversarial review finding 1 → the `.sft-sr-only` live region must render unconditionally (outside the `v-if="password"` block), starting empty, so screen readers reliably announce later updates
- Adversarial review finding 2 / empty-tier edge case → on blur with an empty password, the live region's text becomes the empty string (nothing is announced), matching the component's own existing precedent of showing nothing for an empty password

## Functional
### User story
As a screen-reader user typing a password, I want to be told how strong it is once I finish typing, without the announcement interrupting me on every keystroke, so that I get useful feedback without being talked over while I type.

### Acceptance criteria
1. **Visual strength bar is decorative.**
   Given `PasswordStrengthBar.vue`,
   When rendered,
   Then the visual bar carries `aria-hidden="true"` and its appearance is unchanged from today.

2. **A sibling live region mirrors the tier text.**
   Given the same component,
   When rendered,
   Then a `.sft-sr-only` element with `aria-live="polite"` exists as a sibling of the visual bar, containing `"Password strength: {label}"` where `{label}` matches the tier label already computed today (e.g. "Good").

3. **Announcement fires on blur, not per keystroke.**
   Given the `announce` prop defaulting to `'blur'`,
   When the user types in the password field and then blurs it,
   Then the live region's text updates only once, on blur, reflecting the tier at that moment; typing alone (without blur) does not update the live region's text.

4. **`StarterFormTemplate` wires the input's blur to the bar.**
   Given `PasswordInput.vue` is rendered through `StarterFormTemplate`,
   When the underlying `<input>` fires `@blur`,
   Then the signal reaches `PasswordStrengthBar` so it updates its live region (the bar itself cannot observe the input's blur).

5. **No change to the visible strength bar's appearance or thresholds.**
   Given the same password input sequence as before this story,
   When the bar is inspected visually,
   Then its colors, segments, and tier boundaries are pixel-identical to today's shipped behavior.

### Edge cases
- Clearing the password field entirely and blurring: the live region announces whatever tier an empty password computes to today (no special-cased text).
- Blurring without having typed anything (field untouched): no new announcement beyond what the existing component already computes for that state.
- **DECIDED (research)**: because the live region is persistent (see the Architecture reference note), the clear-then-blur case is well defined: on blur with an empty value, the region's text becomes the empty string (`''`), so nothing is announced, rather than the awkward "Password strength: " with a blank tail. This mirrors `PasswordStrengthBar.vue`'s own existing precedent for an empty password: the `empty` tier's label is already `''` and the whole visual bar is already suppressed entirely (`v-if="password"`), so "say nothing" is the established behavior for this state, not a new phrase to invent. Source: `PasswordStrengthBar.vue`'s existing `strength`/`config` computed properties (the `empty` tier branch).

### Out of scope
- Any debounce-while-typing behavior: explicitly decided against (Open question 5).
- The reveal-button tab-stop fix: ST-01.
- Focus-ring styling on the password field: ST-02.

## Design reference
Implements the feature's [Per-section design notes for `#password-field`](../../spec.md#per-section-design-notes-maps-to-the-spec-s-required-coverage) exactly: "The strength bar becomes decorative (`aria-hidden`) and the tier is mirrored into an `aria-live="polite"` region ... announced on blur per Open question 5's decision." Prototype anchor: [`#password-field`](../../prototype.html#password-field) (the live-region blue bar marking what a screen reader announces). No delta left open.

## Architecture reference
Implements the feature architecture's Slicing seam 3 and Data flow 3:

- **`PasswordStrengthBar.vue`** — adds `aria-hidden="true"` to the visual bar and renders a sibling `.sft-sr-only` live region mirroring the tier, `aria-live="polite"`. Gains an `announce` prop defaulting to `'blur'` (`DECIDED (Jeroen, Open question 5)`).

  **DECIDED (research)**: the `.sft-sr-only` live region must be rendered **unconditionally** (outside the existing `v-if="password"` `<Transition>` that wraps `.sft-strength`), starting empty, and only its text content is updated on blur. Screen readers only announce changes in a live region that was already registered before the change; a region created at the same moment as its content (which is what placing it inside `v-if="password"` would do, since today the whole `.sft-strength` block is `v-if="password"`) is not reliably announced. This is a technical correctness requirement with no competing tradeoff, not a design choice. Source: MDN ARIA Live regions, "The most reliable way to ensure that live regions are registered is to include them in the initial markup." This also makes AC2's "sibling of the visual bar" literal (sibling, not child of the `v-if` block) and makes the empty/clear edge case deterministic (see the Edge cases' `DECIDED (research)` entry above for what that text becomes).
- **`StarterFormTemplate.vue`** — passes the `announce="blur"` signal and wires the password input's `@blur` to trigger the bar's announcement, since the bar cannot see the input's blur itself.
- **Public API surface touched:** one new optional prop (`announce`) on `PasswordStrengthBar`, default preserves today's absence of any announcement side effect beyond what this story adds. No `packages/core/src/` change.
- **Dependencies on other stories:** depends on **ST-02** for the `.sft-sr-only` utility class; implement after ST-02 lands.
- **Documentation:** none assigned to this story directly. Covered by ST-08's summary of what the template announces, as part of the overall Accessibility section.

## QA plan

Reused fixtures: `mountInForm` (`packages/starter/src/__tests__/fixtures/mountInForm.ts`) and `passwordMetadata` (`packages/starter/src/__tests__/fixtures/metadata.ts`), both already used by `StarterFormTemplate.password.logic.test.ts`. New fixture: none needed; `passwordMetadata`'s `password: { showStrengthBar: true }` is sufficient, optionally spread with `initialValues: { password: '...' }` for the mount-time tier.

The precise mechanism `StarterFormTemplate` uses to carry the input's blur signal into `PasswordStrengthBar` (new prop, exposed method via template ref, etc.) is an implementation detail not fixed by the spec text. The plan below tests the observable contract (AC1, AC2, AC5 at the component level; AC3+AC4 together at the integration level, since the bar cannot see blur on its own and the two ACs describe one observable behavior) rather than a specific wiring shape, so it holds regardless of which mechanism is chosen.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Visual bar is decorative (`aria-hidden="true"`), appearance unchanged | New `describe('decorative bar')` asserting `.sft-strength` carries `aria-hidden="true"`; existing tier/segment/color assertions in `StarterFormTemplate.password.logic.test.ts` (lines 23-42) stay green unmodified as the appearance regression guard | `PasswordStrengthBar.test.ts` (new) |
| 2 Sibling `.sft-sr-only[aria-live="polite"]` region exists, text is `"Password strength: {label}"` matching the computed tier | Mount with each non-empty tier (`weak`/`fair`/`good`/`strong`), assert a `.sft-sr-only` sibling of `.sft-strength` has `aria-live="polite"` and text `Password strength: ${label}`, label matching the same tier map `StarterFormTemplate.password.logic.test.ts` already exercises | `PasswordStrengthBar.test.ts` (new) |
| 3 Announcement fires on blur only, not per keystroke (`announce` prop defaults to `'blur'`) | Mount through `StarterFormTemplate` (`mountInForm`), `setValue` on the password input through several tiers without blurring: assert the live region's text does not change from its mount-time value; then `trigger('blur')`: assert it updates once to the tier at that moment | `StarterFormTemplate.password.logic.test.ts` (extended) |
| 4 `StarterFormTemplate` wires the input's blur to the bar | Same test as AC3 (inseparable in practice): the assertion that blur (not typing) is what moves the live region text IS the proof the wiring reaches the bar, since `PasswordStrengthBar` has no DOM access to the real `<input>` | `StarterFormTemplate.password.logic.test.ts` (extended) |
| 5 No change to the bar's appearance/thresholds | No new test; guarded by the existing unmodified tier/segment/color assertions in `StarterFormTemplate.password.logic.test.ts` (lines 23-42), which must keep passing byte-for-byte against the same fixture inputs | `StarterFormTemplate.password.logic.test.ts` (existing, unmodified) |

### Edge cases to tests
- Clearing the password field then blurring: extend the AC3 test with a final `setValue('')` + blur step, asserting the live region's text becomes the empty string (`''`), matching `PasswordStrengthBar`'s existing `empty` branch (label `''`, no visible bar) and the research decision recorded under Edge cases above.
- Blurring an untouched field (never typed in): mount with no `initialValues` and trigger blur immediately; assert the live region shows the same thing the component already computes for an empty password, matching the edge case's "no new announcement beyond what the existing component already computes for that state."

### Mount-time initial render (not in the AC text, added for completeness)
With `initialValues: { password: 'Abcdefg1!' }` and no blur yet, assert the live region's text already matches the `strong` tier at mount. The ACs only describe the blur-driven update path; they do not state whether the region is empty or pre-populated before the first blur. Without this, a sighted user sees the correct bar on load while a screen-reader user hears nothing until they blur once, which looks like a real gap rather than an untested corner. Flagging as a test to write, not a spec rewrite: implementation should make the live region reflect the current tier at mount, and this test pins that behavior.

### States from the feature's states policy applicable to this slice
Only the strength-bar tiers apply (`empty`, `weak`, `fair`, `good`, `strong`); these are the component's own states, not the feature's shared states policy (focus-indicator/error/valid/loading states do not apply to this decorative, non-interactive component). All five are already covered by the unmodified tier tests plus the new live-region text assertions above.

### Reactivity / analytics
This slice does not touch `DynamicFormItem`, `computedProps`, or validation wiring: `PasswordStrengthBar` is a presentational child with no `useField`/`computed` chain of its own beyond the existing tier `computed()`, and `StarterFormTemplate`'s change is slot wiring, not engine reactivity. No `*.analytics.test.ts` file is needed. The reactivity risk that does exist, re-render on every keystroke even though the announced text should not change, is covered by the AC3 test asserting the live region's text (not render count) stays constant while typing; a render-count assertion would require an `analytics` data-testid this internal component does not have.

### Coverage
New branches: `PasswordStrengthBar`'s `announce` prop default and its blur-vs-keystroke update logic, and `StarterFormTemplate`'s blur-wiring code path. Both are exercised by the component-level (`PasswordStrengthBar.test.ts`) and integration-level (`StarterFormTemplate.password.logic.test.ts`) tests above; no code is knowingly left uncovered. `pnpm -r ci:test:coverage` baseline should not drop.

### Time sensitivity
None. No date/time-dependent behavior in this story.

### Regression risk
- `PasswordInput.vue` and `StarterFormTemplate.vue`'s `password-input` slot are touched; guarded by the existing `StarterFormTemplate.password.logic.test.ts` suite (toggle, tier reactivity, blur-triggers-validation tests) and `PasswordInput.test.ts`, both of which must stay green unmodified.
- ST-01 (same `PasswordInput`/`password-input` slot, for `aria-describedby` and the reveal-button tab-stop fix) and ST-02 (`.sft-sr-only` utility this story depends on) are the stories most likely to collide here; this story should implement after both, per its own dependency note.
- ST-07's axe harness will later add a per-component assertion on `PasswordStrengthBar`'s `aria-hidden`/live-region idref validity; nothing from this story needs to pre-empt that.

### Manual verification checklist
1. With a screen reader (VoiceOver or NVDA), type into the password field and confirm nothing is announced while typing, then blur and confirm the tier is announced once, matching AC3.
2. Confirm the visual bar itself is skipped by the screen reader's reading order (i.e. `aria-hidden="true"` has the intended effect), not just present in markup.
3. Confirm in the accessibility tree (browser dev tools) that the `.sft-sr-only` region is present and has an accessible name/content even though it is visually offscreen.

### Untestable criteria and rewrite proposals
None. All five acceptance criteria map to a concrete automated test above; AC3 and AC4 are tested together because they describe one observable behavior split across two components, not because either is untestable alone.

## Adversarial review

STORY mode (blockers only). Verified against the shipped `PasswordStrengthBar.vue`, `PasswordInput.vue`, `StarterFormTemplate.vue` (`#password-input` slot), the existing `StarterFormTemplate.password.logic.test.ts`, and the approved feature design. Confirmed true: the feature spec does say "sibling `.sft-sr-only` live region" and "announce on blur" (so the story faithfully implements the approved design); `PasswordInput` already emits `blur`, so the wiring signal for AC4 exists today; ST-02 does deliver `.sft-sr-only`, so the stated dependency is correct; the cited appearance-guard lines 23-42 are the real tier `it.each` and do stay green when only `aria-hidden` is added; no `PasswordStrengthBar.test.ts` exists yet, so the new file is clean. ACs 1-5 are all testable and mapped; no silent override of the feature design; the ST-02 dependency is correctly stated.

1. **(should-fix) The live region must be persistent, or it will not announce.** The whole `.sft-strength` block is `v-if="password"` today. If the `.sft-sr-only` region is rendered inside that block it is created at the same moment as its content, and screen readers only announce changes to a region that was already registered beforehand (MDN ARIA Live regions: "The most reliable way to ensure that live regions are registered is to include them in the initial markup."). The AC2/AC3 text-content assertions pass in jsdom either way, so the automated suite would stay green while the real announcement, the entire point of the story, silently fails; only the manual checklist would catch it. Routed as a PROPOSED edit in the Architecture reference (render the region unconditionally, outside the `v-if` `<Transition>`, empty to start, update text on blur). This also makes AC2's "sibling of the visual bar" literal and resolves the empty/clear edge case deterministically. Not escalated to blocker because the story is still implementable and AC2's "sibling" wording already points toward the correct placement; the PROPOSED edit pins it.

   **DECIDED (research)**: adopted as worded. This is a factual MDN-sourced correctness requirement with no competing design tradeoff, so it clears the post-approval ladder's rung 2 without needing Jeroen. See the Architecture reference's `DECIDED (research)` entry.

2. **(nit) Empty-tier announcement copy is undefined.** The `empty` tier's label is `''`, so a naive mirror produces "Password strength: " with a blank tail. Routed into the edge-cases list: pick either a fully empty region (nothing announced) or a defined phrase, and assert it, rather than "whichever the implementation does."

   **DECIDED (research)**: nothing is announced (region text goes to `''`). The existing codebase pattern already treats an empty password as "show nothing" (the `empty` tier's label is already `''` and the whole visual bar is `v-if`-suppressed), so mirroring that into the live region wins on rung 3 of the post-approval ladder; no new phrase needed. See the Edge cases entry above.

3. **(nit) Multiple password fields in one form could cross-wire the blur signal.** The `#password-input` slot renders once per password field. A shared/single blur signal between `PasswordInput` and `PasswordStrengthBar` would cross-wire two password fields; the chosen mechanism (template ref or per-field state) must be scoped per slot instance. Rare in practice; flag for implementation.

4. **(nit) AC5 "pixel-identical colors" is guarded only by class-based tests.** Lines 23-42 assert tier/segment/label classes, not computed colors, so they would not catch a colour change. Harmless here because ST-03 touches no CSS (colours live in ST-02), but the word "colors" in the AC1/AC5 guard description overstates what the cited test proves.

**Status set to `awaiting-approval`:** no Open question and no blocker remain; the single should-fix is routed as a PROPOSED edit, and the three nits do not force discussion.

## Implementation notes

- `PasswordStrengthBar.vue`: added `aria-hidden="true"` to the visual `.sft-strength` bar, and a sibling `<span class="sft-sr-only" aria-live="polite">` rendered unconditionally outside the `v-if`/`<Transition>`. Its text comes from a `ref` snapshot of the current tier label (not a `computed` tied directly to the password prop), so it only changes when the newly exposed `announce()` method runs; typing alone never touches it. Added an `announce` prop (`'blur'`, defaulting to `'blur'`) describing that timing, per the architecture.
- `StarterFormTemplate.vue`: the `#password-input` slot's `PasswordInput` `@blur` handler now also calls a new `announcePasswordStrength(path)` helper, which looks up the matching `PasswordStrengthBar` instance in a `Map` keyed by field path (populated via a function `:ref`) and calls its `announce()`. The `Map` (rather than a single shared ref) resolves adversarial finding 3: two password fields in the same form cannot cross-announce.
- Nit 2 (empty-tier copy) is implemented as decided: the live region's text is the empty string whenever the tier label is empty, both at mount and after `announce()`, never "Password strength: " with a blank tail.
- No changeset added. The feature's single changeset (`.changeset/starter-accessibility.md`, minor) already exists (added by ST-06) and its bullet "the password strength label announces changes without spamming every keystroke" already covers this story's capability; a second changeset would fragment one CHANGELOG entry into two. Matches the batching decision recorded across ST-01/ST-02/ST-04/ST-05/ST-07/ST-08.
- `specs/components.md` updated with the `announce` prop, the sibling live-region behavior, and the per-field `Map`-based blur wiring.
- Tests added: `PasswordStrengthBar.test.ts` (component-level, AC1/AC2/AC5 plus the announce()-vs-prop-change distinction) and extensions to `StarterFormTemplate.password.logic.test.ts` (AC3/AC4 together, the clear-then-blur and untouched-blur edge cases, the mount-time initial render, and a two-password-fields scoping test beyond the QA plan's minimum, covering adversarial nit 3). `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck`, and `pnpm -r ci:test:coverage` all pass; `packages/starter` coverage is 99.64% statements / 94.51% branches / 94.11% functions, no drop from before this story's new, fully-tested code. The one newly-introduced uncovered branch in `PasswordStrengthBar.vue` is the pre-existing `labelClass` ternary's falsy arm (`line 56`, unmodified by this story): it is genuinely unreachable through the component's own `v-if="password"` gate (an empty password never renders `.sft-strength` at all, so `labelClass` is never evaluated for the one tier where it would be falsy), the same as before this story.
- Deviation: the story's QA plan did not specify the exact wiring mechanism (noted as an implementation detail); implemented as a path-keyed `Map` of exposed-method refs rather than a single shared ref or a reactive prop, specifically to satisfy adversarial nit 3 without the spec mandating that shape.

## Verification report

### Pipeline
- `pnpm run ci:test` (all packages + docs): all green. `packages/starter` 79 files / 645 tests passed, including `PasswordStrengthBar.test.ts` (18 tests) and the extended `StarterFormTemplate.password.logic.test.ts`.
- `pnpm run ci:lint`: clean, no errors.
- `pnpm run ci:typecheck`: clean, no errors.
- `pnpm -r ci:test:coverage`: `packages/starter` 99.64% stmts / 94.51% branch / 94.11% funcs, matching the developer's reported numbers exactly, no drop. `packages/core` 98.47% stmts / 92.93% branch / 98.37% funcs, untouched by this story (no `packages/core/src/` change). The one newly-attributable-to-this-area uncovered branch (`PasswordStrengthBar.vue:56`, `labelClass`'s falsy arm) is pre-existing and genuinely unreachable (the `v-if="password"` gate means `labelClass` is never evaluated for the one tier where it would be falsy); verified it is unrelated to this story's diff.
- `docs/` not touched by this story; `pnpm docs:build` not required.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. Visual bar is decorative | Pass | `PasswordStrengthBar.vue` line 72: `.sft-strength` carries `aria-hidden="true"`. Test: `PasswordStrengthBar.test.ts > decorative bar > marks the visual bar aria-hidden`. Tier/segment/label classes unchanged, confirmed by the unmodified `it.each` in the same file and in `StarterFormTemplate.password.logic.test.ts`. |
| 2. Sibling live region mirrors tier text | Pass | `.sft-sr-only` rendered as a sibling (outside the `<Transition>`/`v-if`), `aria-live="polite"`, text `Password strength: {label}`. Tests: `PasswordStrengthBar.test.ts > live region` (sibling placement, `aria-live`, per-tier text at mount). |
| 3. Announcement fires on blur only | Pass | `announce` prop defaults to `'blur'`; `announcedLabel` is a `ref` snapshot updated only inside `announce()`, not a `computed` over the password prop. Tests: `PasswordStrengthBar.test.ts > does not update while the password prop changes...`; `StarterFormTemplate.password.logic.test.ts > only updates the live region text on blur, not while typing`. |
| 4. `StarterFormTemplate` wires input blur to the bar | Pass | `#password-input` slot's `@blur` handler calls `s.fieldContext.handleBlur()` then `announcePasswordStrength(s.fieldMetadata.path)`, which looks up the field's `PasswordStrengthBar` instance in a path-keyed `Map` and calls its exposed `announce()`. Tested together with AC3 (same tests) plus a dedicated two-field scoping test: `scopes the blur-triggered announcement to its own field when two password fields are rendered`. |
| 5. No visual/threshold change | Pass | Diff against `main` for `PasswordStrengthBar.vue` touches only the `announce` prop, the live region, and `aria-hidden`; the tier/segment/color classes and thresholds are untouched. The pre-existing tier `it.each` assertions in both test files stay green unmodified. |

Edge cases: clear-then-blur announces `''` (test: `announces an empty string after clearing the password and blurring`); untouched-field blur announces nothing (test: `blurring an untouched, empty field announces nothing`); mount-time pre-population matches the current tier before any blur (test: `mirrors the tier into the live region at mount, before any blur`). All pass.

### Prototype comparison
Compared against `specs/FEAT-011-starter-accessibility/prototype.html#password-field`: the prototype's `.sft-strength[aria-hidden="true"]` plus a sibling `.sft-sr-only[aria-live="polite"]` reading `"Password strength: Good"` is reproduced exactly by the shipped markup. No visual drift: segment/track/label markup and classes are byte-for-byte what shipped before this story.

### Process compliance
- `specs/components.md`: updated with the `announce` prop, the unconditional sibling live region and its empty-string-for-empty-tier behavior, and the per-field `Map`-based blur wiring in `StarterFormTemplate`. Accurate against the shipped code.
- Changeset: none added for this story specifically, and that is correct: the feature's single batched changeset (`.changeset/starter-accessibility.md`, minor) already has a bullet covering "the password strength label announces changes without spamming every keystroke," consistent with the project's one-changeset-per-capability convention and the batching decision recorded across this feature's other stories.
- Public API: `PasswordStrengthBar` stays internal (not exported from `packages/starter/src/index.ts`), matching the architecture's "no `packages/core/src/` change" note and its own "internal chrome" classification in `specs/components.md`. The new `announce` prop and exposed `announce()` method are the only surface addition, both internal-only.
- Test naming: `PasswordStrengthBar.test.ts` (general) and the extended `StarterFormTemplate.password.logic.test.ts` (`*.logic.test.ts`) both follow the repo's naming conventions.
- No silent overrides of feature-level decisions found. The one deviation (Map-based per-path wiring instead of a single shared ref) is disclosed in the Implementation notes and is an implementation-detail choice the QA plan explicitly left open, not a contradiction of the feature design.
- Documentation: correctly deferred to ST-08 (still `status: approved`, not yet implemented), per this story's own Architecture reference note.

### Overall verdict: Pass
