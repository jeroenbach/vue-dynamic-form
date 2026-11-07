---
id: ST-04
type: story
feature: FEAT-011
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Focus management utility, wizard step-change focus, and focus-first-invalid

## Decided without Jeroen (research)

Settled from research during adversarial review, not reviewed by Jeroen. Override any of these freely.

- AR-1 → AC4's failed-final-submit focus is the consumer's `onInvalidSubmit` calling `focusFirstInvalid` (same as AC5), not code inside `FormWizard.vue`; the feature's Data flow 6 carries the same imprecision and is flagged for Jeroen to correct at the feature level
- AR-2 → `Stepper.vue` gets one additive index-derived `id` on its step-label span (the `aria-labelledby` target); it is not "no structural change"

## Functional
### User story
As a keyboard or screen-reader user moving through a wizard, I want focus to land on the new step when I advance, and to be taken straight to the first invalid field when a step or final submit fails validation, so that I always know where I am and what needs fixing, without hunting for it. As a consumer building a plain (non-wizard) form with this template, I want a small helper I can call from my own invalid-submit handler so my form gets the same "focus the first invalid field" behavior.

### Acceptance criteria
1. **Shared util exposes three focusing primitives.**
   Given a new internal `focus.ts` module,
   When used,
   Then it exports `focusWithTemporaryTabindex(el)` (adds `tabindex="-1"`, focuses, removes the attribute on the element's next blur), `firstFocusableWithin(container)`, and `firstInvalidWithin(container)`, each operating on a provided DOM element with no global state.

2. **Step change moves focus to the new page container, named for the step.**
   Given `FormWizard.vue` with a template ref on `<main>` and a `watch(() => props.currentStepIndex)`,
   When `currentStepIndex` changes after the initial mount (the watch skips its first run),
   Then, after `nextTick`, the newly current `[data-page="<index>"]` element receives focus via `focusWithTemporaryTabindex`, carries an accessible name (`aria-labelledby`) pointing at the stepper's current-step label, and mount itself never steals focus.

3. **A failed forward-navigation validates and refocuses within the current page.**
   Given `FormWizard`'s `next()` calling `validateSection(current page)`,
   When validation fails,
   Then `currentStepIndex` does not change and focus moves to the first invalid field within the current `[data-page]` via `firstInvalidWithin`, not to the new-page container logic in AC2.

4. **A failed final submit also focuses the first invalid field.**
   Given the wizard's last step and a failed submit,
   When the failure is detected,
   Then focus moves to the first invalid field within the wizard via the same `firstInvalidWithin` helper.

   > **PROPOSED (adversarial review)**: reword to attribute the mechanism to the consumer, not to `FormWizard.vue`. "Given the wizard's last step and a consumer wiring `focusFirstInvalid` into their own `onInvalidSubmit` handler (as `docs/examples/wizard.md` demonstrates), when the submit fails, then focus moves to the first invalid field within the wizard." Verified in `packages/starter/src/FormWizard.vue`: the last-step button is a bare `type="submit"` with no `@click` (lines 99-108) and the component renders no `<form>`, so the final submit bubbles to the consumer-owned `<form>`. The wizard's final submit is consumer-owned exactly like a non-wizard form's; there is no `FormWizard`-internal event to hook. The Architecture reference's "on a failed final submit (AC4)" attribution to `FormWizard.vue` is corrected to the `focusFirstInvalid` consumer pattern (the same mechanism as AC5).
   > `DECIDED (research)`: adopt the consumer-pattern wording above. Why: the code proves the final submit cannot be intercepted in-template, and the feature's Open question 7 (DECIDED Jeroen) already provides the `focusFirstInvalid` export as the mechanism for consumer-owned submit, so this aligns the wizard final-submit path with an already-decided mechanism rather than introducing new code. The behaviour is testable either way (see AC4's row in the test map). The feature's Data flow 6 ("the template controls this directly: ... and a failed final submit") carries the same imprecision and should be corrected at the feature level; flagged for Jeroen.
   > Sources: packages/starter/src/FormWizard.vue lines 70-108; FEAT-011 Open question 7, Data flow 6.

5. **`focusFirstInvalid` is exported for non-wizard forms.**
   Given `index.ts`,
   When a consumer imports `focusFirstInvalid(containerEl)`,
   Then calling it with a container element containing one or more invalid fields moves focus to the first one, backed by `firstInvalidWithin`; calling it with no invalid fields inside the container is a no-op (no error, no focus change).

6. **Stepper step buttons remain correctly labeled and reachable.**
   Given `Stepper.vue`,
   When a step change occurs,
   Then the step title used by AC2's `aria-labelledby` is the same text the stepper already displays for the current step (no new duplicate label text introduced).

### Edge cases
- Rapid repeated step changes (double-click Continue): only the latest `currentStepIndex` value's target receives focus; no stale focus call from an earlier `watch` trigger lands after a newer one.
- A step with zero fields (unlikely but possible): `firstInvalidWithin`/`firstFocusableWithin` finding nothing is a no-op, not an error.
- `focusFirstInvalid` called with a `containerEl` that is `null`/not yet mounted: no-op, no throw.

### Out of scope
- Focus after an array item is removed: ST-05 (reuses this story's `focus.ts`).
- Choice-card roving tabindex: ST-06.
- The double-announcement interaction between `role="alert"` and `aria-describedby` landing on the same focused field (adversarial review finding 6) is a documented trade-off, not a defect to fix here; note it in implementation notes if observed.
- Any visual change: this story is script-only (the container's focus ring comes from ST-02's CSS, already in place by the time this story implements).

## Design reference
Implements the feature's [Per-section design notes for `#wizard-step`](../../spec.md#per-section-design-notes-maps-to-the-spec-s-required-coverage): "the target is the `[data-page]` container itself (`tabindex="-1"`), given an accessible name tied to the stepper's current-step label." Prototype anchor: [`#wizard-step`](../../prototype.html#wizard-step). The prototype's page-heading target drawing is superseded per the feature's own note; this story implements the container-focus option, not the heading option.

## Architecture reference
Implements the feature architecture's Slicing seam 4 (shared util + wizard consumers), Data flow 4 and 6, ADR 1, ADR 2, and Open questions 2, 3, and 7's decisions:

- **`focus.ts`** (new internal util module) — `focusWithTemporaryTabindex`, `firstFocusableWithin`, `firstInvalidWithin`.
- **`FormWizard.vue`** — template ref on `<main>`, `watch(() => props.currentStepIndex)` skipping the first run, focuses the `[data-page]` container on success (AC2) or the first invalid field within the current page on a failed `next()` (AC3, Open question 3's decision), and on a failed final submit (AC4).
- **`Stepper.vue`** — no structural change; this story reads the step label it already tracks for the `aria-labelledby` target (AC6), per Data flow 4's "accessible name tied to the stepper's current-step label."

  > **PROPOSED (adversarial review)**: correct "no structural change" to "one additive change". `Stepper.vue` renders `<span class="sft-step-label">{{ step.title }}</span>` with no `id` (line 67), so `aria-labelledby` has nothing to point at. Each step-label span needs a deterministic, index-derived `id` (e.g. `${dataTestid}-step-label-${i}`) so the `[data-page]` container can reference the current step's label id. This is a minimal, additive, non-breaking markup change. `Stepper.test.ts`'s existing text/class/aria-label assertions guard that adding the `id` changes nothing else.
  > `DECIDED (research)`: add the index-derived `id` to the step-label span. Why: the approved feature Data flow 4 explicitly chose `aria-labelledby` "pointing at the step title the stepper already tracks", which is unsatisfiable without an `id` on that element; `aria-label` with the raw string would avoid the id but contradicts the feature's explicit `aria-labelledby` choice (ladder rung 1: follow the approved design). Smallest change that honours it.
  > Sources: packages/starter/src/Stepper.vue line 67; FEAT-011 Data flow 4.
- **`index.ts`** — new export `focusFirstInvalid(containerEl)`, backed by `firstInvalidWithin` (Open question 7's decision, option (a)).
- **Public API surface touched:** one new named export, `focusFirstInvalid`. This is the only new export in the whole feature. No `packages/core/src/` change.
- **ADR reference:** ADR 1 (watch `currentStepIndex`, not mount/unmount lifecycle, because pages never unmount per the engine's `v-show` contract) and ADR 2 (temporary `tabindex="-1"` added at focus time, removed on blur, rather than permanent markup) both apply directly to this story's `FormWizard` and `focus.ts` work.
- **Dependencies on other stories:** none structurally; independent of ST-01/02/03. ST-05 depends on this story's `focus.ts` module.
- **Documentation:** this story ships `docs/examples/wizard.md`'s update (step-change focus and first-invalid-on-step-failure are exactly the behavior that example demonstrates), assigned here rather than bundled into ST-08's general accessibility write-up, since the rule is "the story that ships the behavior the page describes." The non-wizard `focusFirstInvalid` usage example lives in ST-08's `docs/guide/starter-template.md` update instead, since that is general-purpose consumer guidance, not wizard-specific.

## QA plan

Verified against the live tree: no `focus.ts` or any focus-management test file exists today anywhere in `packages/starter`. `FormWizard.vue` renders no `[data-page]` elements itself (those come from `StarterFormTemplate`'s `default-wizard-page` slot, rendered into `FormWizard`'s `<main><slot /></main>`), so `[data-page]` is only reachable through `FormWizard`'s own template ref, not a prop. `mountWizardForm` (`wizard.test-helpers.ts`) already mounts with `attachTo: document.body`, which is required for `document.activeElement` assertions to work under jsdom; every behavioural test below reuses it rather than a bare `mount()`. `StarterFormTemplate.wizard.analytics.test.ts` already proves page-switch render counts are stable across navigation and a blocked step; this story extends that file rather than re-deriving the baseline.

`FormWizard.vue` renders no `<form>`: the real `<form>` and its `handleSubmit`/`onInvalidSubmit` are consumer code (confirmed: `StarterFormTemplate.vue` has no `<form>`/`@submit`; `mountWizardForm`'s `Host` component owns it). AC4 ("A failed final submit also focuses the first invalid field... via the same `firstInvalidWithin` helper") is attributed to `FormWizard.vue` in the Architecture reference, but given this package boundary there is no FormWizard-internal event to hook: a submit only fails inside the consumer's own `handleSubmit(onValid, onInvalid)`. The only mechanism available is the same one AC5 already exports for non-wizard forms: the consumer's `onInvalid` callback calls `focusFirstInvalid(containerEl)`. **Rewrite proposal for AC4**: reword to "the wizard's own failed-final-submit handling is the documented `focusFirstInvalid` wiring pattern from AC5, applied to the wizard's root element in `docs/examples/wizard.md`, not new code inside `FormWizard.vue`." This is routed to adversarial-review as a should-fix below rather than silently assumed; it is fully testable either way (see AC4's row), so it does not block writing or running the tests.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 `focus.ts` exports `focusWithTemporaryTabindex`, `firstFocusableWithin`, `firstInvalidWithin`, each stateless | New file: `focusWithTemporaryTabindex(el)` adds `tabindex="-1"`, moves `document.activeElement` to `el`, and removes the attribute after `el`'s next `blur`; `firstFocusableWithin(container)` returns the first focusable descendant (button/input/select/textarea/`a[href]`/non-`-1` `[tabindex]`), skipping `disabled` ones; `firstInvalidWithin(container)` returns the first `[aria-invalid="true"]` descendant. Two independently constructed containers in the same test prove no shared/global state leaks between calls | `packages/starter/src/__tests__/focus.logic.test.ts` (new) |
| 2 Step change focuses the new `[data-page]` container, named via `aria-labelledby`, mount never steals focus | New file, mounting `FormWizard` alone (slot content = two bare `data-page` divs with one input each, `attachTo: document.body`): on mount, `document.activeElement` is unaffected (still `document.body`); after `wrapper.setProps({ currentStepIndex: 1 })` and `await nextTick()`, the page-1 `div[data-page="1"]` is `document.activeElement`, carries `tabindex="-1"`, and its `aria-labelledby` resolves (via `getElementById`) to an element whose text equals the step-1 title. A second, integration-level test via `mountWizardForm` + `wizardMetadata({ pages: 3 })` repeats the focus/`aria-labelledby` assertion against the real rendered tree after `click(nextButton(wrapper))`, confirming the isolated unit matches the composed one | `packages/starter/src/__tests__/FormWizard.logic.test.ts` (new); `StarterFormTemplate.wizard.logic.test.ts` (extend) |
| 3 Failed `next()` keeps `currentStepIndex` and focuses the first invalid field in the current page, not the AC2 container | Extend `StarterFormTemplate.wizard.logic.test.ts`'s existing "step errors" describe block: `wizardMetadata({ pages: 2, requiredPages: [0] })`, `attachTo: document.body`, click Next; assert `stepButton(wrapper, 0)` still shows `is-error` (unchanged existing assertion) and additionally assert `document.activeElement` is the page-0 field's `<input>` (`[aria-invalid="true"]`), not `[data-page="0"]` itself | `StarterFormTemplate.wizard.logic.test.ts` (extend) |
| 4 Failed final submit focuses the first invalid field, via the same `firstInvalidWithin` helper | Extend `mountWizardForm`'s `Host` (or a local variant) to wire `handleSubmit(onValid, ({ errors }) => focusFirstInvalid(wrapper.element))` as the form's `@submit` handler, matching the pattern AC5/the docs example will ship. Mount a one-page wizard with a required, untouched field, click Submit, assert `document.activeElement` is that field's input. This is the test that stands regardless of how the AC4/FormWizard wording finding above is resolved | `StarterFormTemplate.wizard.logic.test.ts` (extend) |
| 5 `index.ts` exports `focusFirstInvalid(containerEl)`; focuses the first invalid field; no-op with none | New file: mount a plain (non-wizard) `StarterFormTemplate` with one invalid and one valid field, call `focusFirstInvalid(wrapper.element)`, assert focus landed on the invalid field; call it again on a container with zero invalid fields, assert `document.activeElement` is unchanged and nothing throws. Plus: extend `index.test.ts`'s and `publicApiSurface.test.ts`'s exhaustive export-name arrays to include `focusFirstInvalid` (both currently list exactly nine names and will fail red the moment the export is added until updated, by design) | `packages/starter/src/__tests__/focusFirstInvalid.logic.test.ts` (new); `index.test.ts`; `publicApiSurface.test.ts` |
| 6 Stepper step label text used by AC2's `aria-labelledby` matches the stepper's own displayed text | Covered by AC2's integration-level assertion above (`aria-labelledby` target's `textContent` equals the title shown in `stepButton(wrapper, i).find('.sft-step-label').text()`). No standalone `Stepper.test.ts` change needed since `Stepper.vue`'s own rendering is unchanged; only confirm no duplicate label text node is introduced anywhere in the page container (assert exactly one element in the whole wrapper has that text, or that the `aria-labelledby` id resolves inside `.sft-stepper`, not to a new copy) | `StarterFormTemplate.wizard.logic.test.ts` (extend) |

### Edge cases to tests
- Rapid repeated step changes (double-click Continue): in `FormWizard.logic.test.ts`, call `wrapper.setProps({ currentStepIndex: 1 })` then immediately `wrapper.setProps({ currentStepIndex: 2 })` before `await nextTick()` resolves the first; assert only `[data-page="2"]` ends up focused and `[data-page="1"]` never received `tabindex="-1"` or focus.
- A step with zero fields: `focus.logic.test.ts` asserts `firstFocusableWithin`/`firstInvalidWithin` return `undefined` (not throw) for an empty container; `FormWizard.logic.test.ts` asserts a step change into an empty `[data-page]` still focuses the container itself without error (AC2's container-focus target has no fields to find, which is fine since the target is the container, not a field).
- `focusFirstInvalid(null)`: `focusFirstInvalid.logic.test.ts` asserts no throw and no focus change.

### States from the feature's states policy applicable to this slice
- **Error (new semantics for this slice: it is also a focus target).** AC3, AC4, AC5's "with invalid fields" case all exercise the first-invalid-field target; the field's own `aria-invalid`/`role="alert"` rendering is ST-01's concern, this story only asserts `firstInvalidWithin` finds and focuses it.
- **Valid / pristine.** AC2's success path (step change with no validation failure) and AC5's "no invalid fields, no-op" case.
- **Loading.** Not applicable: no loading state in this slice's surface (`isValidating` already exists and is untouched; the focus move happens after validation settles, not during).
- **Empty.** The zero-field step edge case above is this slice's empty state.
- **Disabled.** Not applicable: focus targets here are the page container and already-focusable invalid fields, neither of which has a disabled variant relevant to this slice.

### Reactivity / analytics
This slice does not add a `computedProps` function or change `combinedValidation`/`useField` wiring; `FormWizard`'s new `watch(() => props.currentStepIndex)` is a DOM-only side effect (adds/removes an attribute, calls `.focus()`) and does not write back into any reactive source `DynamicFormItem` reads, so it introduces no new re-render surface. No new `*.analytics.test.ts` file is needed. As insurance against a regression where the watch accidentally does feed back into render identity, extend the existing `StarterFormTemplate.wizard.analytics.test.ts` with one more assertion: after a step change, the *new* current page's own field render count is unchanged from before the switch (it was never hidden/shown before, this is its first render as current, so assert it equals 1, matching today's pre-story baseline), proving the focus call itself causes no extra `DynamicFormItem` render.

### Coverage
Every branch in `focus.ts` (tabindex add/remove, found/not-found in each helper, null-container guards) is exercised by `focus.logic.test.ts`. `FormWizard.vue`'s new watch and its skip-first-run guard are exercised by `FormWizard.logic.test.ts`'s mount-then-change and rapid-double-change cases. `index.ts`'s new `focusFirstInvalid` wrapper is exercised by `focusFirstInvalid.logic.test.ts`. `pnpm -r ci:test:coverage` for `packages/starter` is expected to stay at or above baseline; nothing is knowingly left uncovered. One line worth flagging ahead of implementation: the blur-listener cleanup inside `focusWithTemporaryTabindex` may leave an uncovered branch if the focused element is unmounted before its blur fires (e.g. a step navigated away mid-focus); if coverage flags it, add a test that mounts away before blur.

### Time sensitivity
None. No date/time-dependent behaviour in this slice; all tests run identically regardless of `TZ`.

### Regression risk
- `FormWizard.vue` is used by every wizard consumer, the Storybook playground, and `docs/examples/wizard.md`. Existing `FormWizard.test.ts` (rendering/structure) and the full `StarterFormTemplate.wizard*.test.ts` suite (chrome, page registration, step errors, render counts) must stay green unmodified in substance; this story only adds assertions and one new watch, it does not change any class, visibility, or button-disabled logic those suites already assert.
- `Stepper.vue` is unmodified in markup terms beyond whatever minimal `id` the `aria-labelledby` target needs (see the note on the Architecture reference's "no structural change" wording below); `Stepper.test.ts`'s existing text/class/aria-label assertions are the guard that adding an `id` attribute does not change anything else.
- `index.ts`'s and `publicApiSurface.test.ts`'s exhaustive export-name lists are hard-coded to the current nine names; both must be updated in the same change or `pnpm ci` fails immediately, which is the intended regression guard for "no accidental extra export."
- ST-05 depends on `focus.ts`'s exact exported signatures; this story should not need to change them once ST-05 starts, but any later signature change here is a cross-story regression risk worth flagging to the scrum-master, not actionable now.
- `firstInvalidWithin` relies on `aria-invalid="true"`, already present today on `TextInput`/`SelectInput`/`PasswordInput` (confirmed in the feature's Constraints) regardless of ST-01's status, so this story's own wizard tests (which use plain `text` fields via `wizardMetadata`) are unaffected by ST-01's sequencing. A consumer wizard built from checkbox/toggle fields only gets correct first-invalid targeting once ST-01 lands too; note as a known sequencing caveat, not a defect here.
- No `packages/core` file is touched, so the engine's and `packages/element-plus`'s own suites are unaffected by construction.

### Untestable criteria and rewrite proposals
- AC4, as worded, attributes "failed final submit" focus handling to `FormWizard.vue`, but `FormWizard.vue` has no visibility into the consumer-owned `<form>`'s submit event (see the note above the test table). It is testable (the test table's AC4 row proves the behavior works end to end via the `focusFirstInvalid`-in-`onInvalid` pattern), but the acceptance criterion's implied mechanism is inconsistent with the architecture's own stated package boundary. **Proposed rewrite**: "Given the wizard's last step and a consumer wiring `focusFirstInvalid` into their own `onInvalidSubmit` handler (as `docs/examples/wizard.md` demonstrates), when the submit fails, then focus moves to the first invalid field within the wizard." Routed to adversarial-review as a should-fix; not a blocker for this QA plan since the behavior is tested regardless of which wording wins.
- The Architecture reference states "`Stepper.vue` — no structural change", but AC6 requires `aria-labelledby` to point at the stepper's existing current-step label text without introducing a duplicate copy of it, which in practice needs an `id` on that label element (a small, additive, non-breaking change, but still a markup change). Flagging as a nit for adversarial-review to reconcile the wording; it does not change what is tested (the AC2/AC6 integration test asserts the resolved `aria-labelledby` target's text, not how the id got there).

### Manual verification checklist
1. With a screen reader (VoiceOver spot check is sufficient), step through a multi-page wizard via Continue and confirm the step name is announced before the first field, with no stray second announcement of the page's first field's label overriding it.
2. Trigger a blocked `next()` (leave a required field empty, click Continue) and confirm the screen reader announces the invalid field directly, without first announcing the page container.
3. Submit a wizard's last step with an error present (per the docs example's wiring) and confirm focus and announcement land on the first invalid field, not on the disabled submit button or nowhere.
4. Double-click Continue rapidly on a fast machine and confirm focus settles on the final destination step, not a flicker through an intermediate one (hard to assert visually, but confirm no console error/warning appears).
5. Confirm `docs/examples/wizard.md`'s updated snippet runs as shown (copy it into the Storybook playground or a scratch page) before merging, since its `onInvalidSubmit` wiring is also this story's only demonstration of AC4's mechanism.

## Adversarial review

STORY mode (lite): blockers only, plus the two items the QA planner flagged for verification. Checked against the shipped `packages/starter/src/FormWizard.vue` and `Stepper.vue`, the approved feature (Data flow 4 and 6, Open question 7, the FormWizard/Stepper component plan entries), and the story's own ACs and QA plan.

Verdict: **no blockers.** All six ACs are testable and mapped in the QA plan's test table; dependencies are explicit (independent of ST-01/02/03; ST-05 depends on this story's `focus.ts`); the `aria-invalid` precondition for AC3/AC4 is already satisfied by the shipped inputs regardless of ST-01. Two consistency findings against the approved feature, both resolved by research and routed as `PROPOSED (adversarial review)` edits above.

1. **(should-fix) AC4 attributes "focus first invalid on failed final submit" to `FormWizard.vue`, which cannot detect it.** `FormWizard.vue` renders no `<form>`; its last-step button is a bare `type="submit"` (no `@click`, lines 99-108) that bubbles to the consumer-owned `<form>`. There is no in-template event to hook, so AC4's implied mechanism is inconsistent with the actual package boundary and would mislead the developer into adding unworkable code. Resolution: the consumer's `onInvalidSubmit` calls `focusFirstInvalid` (the AC5 export), demonstrated in `docs/examples/wizard.md`. Routed as a PROPOSED rewrite of AC4; recorded `DECIDED (research)`. The feature's Data flow 6 ("the template controls this directly: ... and a failed final submit") carries the same imprecision; it is a feature-level defect, not a story defect, and is flagged for Jeroen to correct in that section. The story is fully implementable and testable with the PROPOSED wording, which aligns with the already-decided Open question 7 mechanism.

2. **(nit) "`Stepper.vue` — no structural change" is inconsistent with AC2/AC6.** The step-label span has no `id` (line 67), so `aria-labelledby` has nothing to reference. An additive, index-derived `id` on the span is required; it is a minimal non-breaking change, not "no structural change". Routed as a PROPOSED correction of the Architecture reference; recorded `DECIDED (research)`. The feature's Data flow 4 already demands `aria-labelledby`, so the id is implied by the approved design; only the story's "no structural change" wording needed fixing.
