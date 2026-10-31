---
id: ST-03
type: story
feature: FEAT-010
status: done
approved_by: Jeroen
pr: ""
---

# Story: GAP 3, a live aggregate meta.valid for group/choice/array shapes

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- AR-1 (blocker) → fill-then-clear regression re-scoped to a cross-field-`validation` container plus an array variant; a plain-required optional-children group staying `meta.valid: true` after a clear is intended `xsd_required` semantics (the feature's regression-test line is corrected to match; gate-drop unchanged)
- AR-2 → the array silent validate destructures the field-level `validate` from the component's existing `useField` call, not the zero-arg `useValidateField` wrapper

## Functional
### User story
As a consumer reading the form's own aggregate `meta.valid` off `useDynamicForm`/vee-validate's `useForm()`, I want it to be a trustworthy, live signal under the default `validateOnValueUpdate: true` timing for group, choice-anchor, and array shapes, so that I can drive a submit button or a completeness indicator without a prior full `validate()`/`handleSubmit()` call and without hand-rolling my own completeness check.

### Acceptance criteria

1. Given a required container (group or choice-anchor, `minOccurs >= 1`) whose own `fieldContext` was validated once at mount against an empty subtree, When a descendant's value changes (`childValueReactivity` increments) and `isValidationSuppressed()` is false, Then `fieldContext.validate({ mode: 'silent' })` runs and the container's own `meta.valid` refreshes, with no visible error written and no change to `meta.touched`/`meta.validated`.
2. Given a container whose own rules can actually fail on empty (a container with a custom cross-field `validation` reading nested values, or an array whose `xsd_minOccurs` counts members with value) filled in completely so its `meta.valid` is `true`, When its subtree is cleared back to empty, Then its `meta.valid` flips back to `false` without any submit call (regression test for the dropped `checkTreeHasValue`/`initialUpdate` gate). A plain-required group with only optional children is intentionally excluded: its own rule is `xsd_required`, which validates the container's object value by presence (`value !== null && value !== undefined && value !== ''`), and a cleared subtree leaves `{ child: undefined }` (vee-validate `setInPath`) or `{}` (unmount-driven `unsetPath` prune), both of which pass. Such a group staying `meta.valid: true` after a clear is intended rule semantics, pinned by a positive assertion in the QA plan so a future reader does not mistake it for a regression.

   DECIDED (research): finding 1's PROPOSED edit is adopted (the optional-children variant is dropped, an array variant is added, the intended-`true` behavior is pinned).
   Why: `xsd_required` is exactly `value !== null && value !== undefined && value !== ''` (`core/validation.ts` line 34), so any object passes; changing `xsd_required`'s semantics is explicitly out of scope at feature level. The feature's gate-drop decision is unchanged, since the gate would still skip the silent validate exactly when a cross-field `validation` needs it. The feature spec's regression-test line carries the matching correction.
   Sources: `packages/core/src/core/validation.ts` line 34, installed `vee-validate@4.15.1` dist (`setInPath`/`unsetPath`), the feature's out-of-scope list.
3. Given an array field (`DynamicFormItemArray`, whose stub `fieldContext` in `DynamicFormItem` cannot be used), When its existing `values` watcher fires on an occurrence add, remove, or value change, Then a silent `validate({ mode: 'silent' })` runs beside the existing gated visible `validate()`, keeping the array's own `meta.valid` live independent of `validateOnValueUpdate`.
4. Given a `resetForm`/`resetField`/`setFieldValue(..., false)` flush in progress (`isValidationSuppressed()` is `true`), When `childValueReactivity` increments during that flush, Then the new silent validate calls (both the container watcher and the array watcher) are skipped, matching the suppression guard already used at every other validate call site in these components.
5. Given every visible leaf field under a group/choice/array is actually valid, When the last fill-in happens under the default `validateOnValueUpdate: true` timing, Then the form-level `meta.valid` flips to `true` with no prior full `validate()`/`handleSubmit()` call, regardless of whether the previously-invalid field sat under a plain group, a choice, or an array.
6. Given `validateOnValueUpdate: false`, When a leaf field is filled in, Then that leaf's own `meta.valid` is not refreshed by this story's fix (the leaf hot path is explicitly out of scope), and the form-level aggregate therefore follows the consumer's own deferred validation timing rather than going live; this qualified claim is stated in the Functional overview, not treated as a defect.
7. [Investigation, standing permission to split] Given a nested explicit choice inside one branch of an outer choice, switching away from that branch, and then filling the other branch completely, When `validate()` is called, Then one of two outcomes is recorded: either (a) it resolves `{ valid: true }` and `handleSubmit`'s success callback fires, with the root cause named and fixed inside this story, or (b) the investigation names the surviving stale `pathState` and the fix is split into its own QUICK spec referencing this feature (per the feature's open question 6, Jeroen's standing permission), with this story's own scope note stating that split explicitly.

### Edge cases
- A container carrying only optional children plus a custom cross-field `validation` reading nested values: the silent revalidation on subtree change keeps its `meta.valid` accurate even though no `xsd_required` check is ever the thing that fails.
- `DynamicFormItemChoice`'s own choice-occurrence registration is already kept live by vee-validate itself, since its `combinedValidation` computed changes as `effectiveValuesCount`/`usedChoiceOccurrences` change and the rules watcher re-runs `validateValidStateOnly`. This story verifies that this already holds; it does not re-implement it.
- Mount-time silent validate from vee-validate itself is not duplicated or interfered with by the new watcher.

### Out of scope
- GAP 1 (ST-02) and GAP 2 (ST-01).
- The checkout example cleanup (ST-04).
- Extending the silent validate to the leaf branch of the value watcher (a possible additive follow-up later, explicitly deferred per the feature's DECIDED resolution of finding 4).
- Any rework of vee-validate's own `validate({ mode: 'silent' })` semantics.

## Design reference
None. Per the feature's Design section, GAP 3 is a pure validation-timing fix with no template-facing change.

## Architecture reference
Builds, from the feature architecture's "GAP 3 data flow (live meta.valid)" section (including the resolved blocker) and the matching ADR note ("GAP 3 keyed on childValueReactivity, not the value watcher"):

- `packages/core/src/components/DynamicFormItem.vue`: a new, non-input-only watcher:
  ```
  if (!isInput.value) {
    watch(childValueReactivity, () => {
      if (!isValidationSuppressed())
        fieldContext.validate?.({ mode: 'silent' });
    });
  }
  ```
  No `checkTreeHasValue`/`initialUpdate` gate (the originally drafted gate is dropped per the resolved blocker: it collapses to `checkTreeHasValue` for a container, which leaves `meta.valid` stuck `true` on a fill-then-clear transition, a correctness regression worse than the bug being fixed).
- `packages/core/src/components/DynamicFormItemArray.vue`: the existing `values` watcher (from `useFieldArrayExtended`, deeply reactive) gains a silent `validate({ mode: 'silent' })` beside its existing gated visible `validate()`, with the same `isValidationSuppressed()` guard. The silent call must **not** reuse the component's existing `validate` variable: that is `useValidateField(normalizedPath)`, which in vee-validate@4.15.1 returns a zero-argument `() => Promise<ValidationResult>`, so passing `{ mode: 'silent' }` is a TypeScript error and, if coerced, the option is dropped and a **visible** validation runs, surfacing array errors. Instead, destructure the field-level `validate` from the `useField(normalizedPath, combinedValidation, …)` call already present in this component (around line 135), which accepts `{ mode: 'silent' }`. The AC3 test asserts `errorMessage`/`errors` stay empty on the invalid transition (remove below `minOccurs`) too, not only on the valid fill, so a mode mix-up that surfaces an error is caught.

  DECIDED (research): finding 2's PROPOSED edit is adopted, using the `useField` destructure rather than `formContext.validateField(path, { mode: 'silent' })`.
  Why: `useValidateField`'s zero-argument signature is declared in the installed dist typings (`vee-validate.d.ts` line 1401), so the mix-up is real; the `useField` call already exists in the component, so destructuring its `validate` is the smallest change and matches how `DynamicFormItem` invokes its own `fieldContext.validate`.
  Sources: installed `vee-validate@4.15.1` dist typings line 1401, `DynamicFormItemArray.vue` lines 68 and 135.
- Regression test required (per the feature spec, as corrected by this story's finding 1): fill a container whose rules can actually fail on empty (a cross-field `validation` container, or an array cleared below `minOccurs`), clear it, and assert the form-level `meta.valid` returns to `false` without a submit.
- Stale-registration investigation, per the feature's "Stale-registration investigation (GAP 3, bundled per open question 6)" subsection: reproduce in `TestForm` (a nested explicit choice inside a branch, switch away, fill the other branch, call `validate()`, inspect `errorBag`/results/`pathStates` to name the surviving path). Look in order at: `DynamicFormItemChoice`'s `useField` anchoring, `DynamicFormItem.onBeforeUnmount`'s interaction with a choice-anchor/`DynamicFormItemChoice` teardown, and vee-validate's `pathStates` multiple-id aggregation / `pendingUnmount`/`keepValuesOnUnmount` flags. Do not prescribe the fix beyond that; if the root cause proves unrelated to silent validation or the fix balloons, split it into its own QUICK spec referencing FEAT-010, per Jeroen's standing permission (open question 6), and state the split plainly in this story's own notes.
- No new public API surface: no export shape change. Contributes the "`meta.valid` is now live" sub-bullet, with its prominent behavior-change note (open question 5 decision: a consumer relying on the stuck-false aggregate was relying on a bug), to the feature's single cohesive minor changeset; may be authored here or extend one started by another story.

No `specs/components.md` entry needed beyond noting the behavior change against `useDynamicForm`/`useForm`'s existing `meta.valid` entry, since no export's shape changes.

Dependencies: none, independent of ST-01 and ST-02. Sequencing note: ST-01 and ST-03 both edit `DynamicFormItem.vue`, but in different regions (ST-01's rules `watchEffect` vs. this story's new subtree watcher), so conflict risk is low; sequence them if implemented on the same branch.

## QA plan

### Harness and fixtures

All tests use the existing harness: `TestForm` (`packages/core/src/examples/TestForm.vue`) mounted with inline metadata, the same pattern already used throughout `DynamicFormItem.validation.test.ts`, `DynamicFormItemArray.validation.test.ts`, and `DynamicFormItemChoice.validation.test.ts`. No new example component under `packages/core/src/examples/` is needed: this story has no Storybook/template-facing surface, so inline metadata fixtures (a required group with optional children, a required group with a custom cross-field `validation`, a required array, a choice with a nested explicit choice) are enough, matching how every existing `*.validation.test.ts` builds its fixtures inline rather than via a shared example.

Existing helpers reused: `DynamicFormItem.test-helpers.ts` (`setupState`, `renderCount`, `constructValidationCount`, `valueChangedCount`, `notifyValueUpdateCount`), `DynamicFormItemArray.test-helpers.ts` (`setupState`, `arrayConstructValidationCount`). Both `setupState(wrapper, path)` return the component's internal `fieldContext`, so a test can `vi.spyOn(fieldContext, 'validate')` after mount to assert the new watcher actually calls `validate({ mode: 'silent' })`, not just that some outcome coincidentally matches (the same technique the existing array `minOccurs`-vs-`maxOccurs` ordering test already uses by reading `fieldContext.errors.value` directly).

New test utility needed: none beyond the spy-on-`fieldContext.validate` technique above. If the developer adds a dedicated analytics counter for the new watcher (mirroring `_analytics_notifyValueUpdateCount`'s style, e.g. a `_analytics_subtreeValidateCount`), prefer asserting against that counter instead of a spy, for consistency with the codebase's existing analytics-counter pattern; this is the implementer's call, not a QA requirement.

### Acceptance criteria to test mapping

| AC | Test | File |
| --- | --- | --- |
| 1. Container's own `meta.valid` refreshes via silent validate on subtree change, no visible error, no touched/validated change | `DynamicFormItem.logic.test.ts`: mount a required group (`minOccurs: 1`) with only optional children; fill a child; assert `fieldContext.validate` was called with `{ mode: 'silent' }` (spy), the group's own `meta.valid` flips `true`, no error message renders for the group, and `meta.touched`/`meta.validated` on the group are unchanged from their pre-fill values | `packages/core/src/components/__tests__/DynamicFormItem.logic.test.ts` |
| 2. Fill-then-clear regression: container whose rules fail on empty, filled then cleared, returns form-level `meta.valid` to `false` without a submit | `DynamicFormItem.validation.test.ts`: two variants, (a) a container with a custom cross-field `validation` reading nested sibling values, (b) an array cleared back below `minOccurs` (which `xsd_minOccurs` correctly fails); fill until form-level `meta.valid` is `true`, clear the subtree back to empty, assert form-level `meta.valid` is `false`, with no `[data-testid="submit"]` click anywhere in the test. Plus one positive assertion that a touched-then-emptied plain-required group with only optional children reports `meta.valid: true` (intended `xsd_required` semantics, pinned so a future reader does not mistake it for a regression; see finding 1) | `packages/core/src/components/__tests__/DynamicFormItem.validation.test.ts` |
| 3. Array's own `meta.valid` stays live via silent validate on add/remove/value change, independent of `validateOnValueUpdate` | `DynamicFormItemArray.logic.test.ts`: mount a required array (`minOccurs: 1`) with `validateOnValueUpdate: false`; add an occurrence and fill it, assert the array's own `meta.valid` (via `arraySetupState(wrapper, path).fieldContext.meta.value.valid`) flips `true` with no visible array error; remove it again and assert `meta.valid` flips back `false` **and the array's `errors`/`errorMessage` are still empty on that invalid transition** (per finding 2, to catch a silent-vs-visible mode mix-up). Repeat the add/remove/value-change triad explicitly since the AC names all three triggers | `packages/core/src/components/__tests__/DynamicFormItemArray.logic.test.ts` |
| 4. Suppression guard: both new silent-validate sites skip while `isValidationSuppressed()` is true | `DynamicFormItem.logic.test.ts` and `DynamicFormItemArray.logic.test.ts`: spy on `fieldContext.validate`, trigger a `resetField`/`resetForm` and a `setFieldValue(path, value, false)` write that changes a descendant value during the suppression window, assert the spy was not called with `{ mode: 'silent' }` during that window, then assert a subsequent real value change does call it | `DynamicFormItem.logic.test.ts`, `DynamicFormItemArray.logic.test.ts` |
| 5. Form-level `meta.valid` flips `true` on the last fill-in under default timing, for group, choice, and array shapes alike | `DynamicFormItem.formApi.test.ts`: parametrized (`it.each`) over three fixtures, a plain group, an explicit-choice anchor, and an array, each with exactly one remaining invalid leaf; fill it and assert the form-level `meta.valid` (from `useDynamicForm`) flips `true` with no prior `validate()`/`handleSubmit()` call | `packages/core/src/components/__tests__/DynamicFormItem.formApi.test.ts` |
| 6. Under `validateOnValueUpdate: false`, a filled leaf's own `meta.valid` is not refreshed by this story's fix, so the aggregate follows deferred timing | `DynamicFormItem.validation.test.ts`: mount a single required leaf with `validateOnValueUpdate: false`, fill it, assert the leaf's own `meta.valid` (and the form-level aggregate) stays `false` until submit. This pins the qualified claim as current, intended behaviour rather than a regression | `packages/core/src/components/__tests__/DynamicFormItem.validation.test.ts` |
| 7. Stale-registration investigation (outcome-conditional) | See dedicated subsection below | `DynamicFormItem.logic.test.ts` (reproduction), outcome-dependent |
| Edge case: container with only optional children plus a cross-field `validation` | Folded into AC2's variant (b) above | `DynamicFormItem.validation.test.ts` |
| Edge case: `DynamicFormItemChoice`'s own choice-occurrence registration already stays live | `DynamicFormItemChoice.validation.test.ts`: add one regression test confirming a choice-anchor's own `meta.valid` already refreshes as `effectiveValuesCount`/`usedChoiceOccurrences` change, with no change needed in `DynamicFormItemChoice.vue` for this story. Verifies, does not re-implement | `packages/core/src/components/__tests__/DynamicFormItemChoice.validation.test.ts` |
| Edge case: mount-time silent validate from vee-validate itself is not duplicated | `DynamicFormItem.analytics.test.ts`: assert the spy/counter for the new watcher's silent validate is `0` immediately after mount (before any `childValueReactivity` increment beyond the one vee-validate itself already accounts for) | `packages/core/src/components/__tests__/DynamicFormItem.analytics.test.ts` |

### Reactivity / analytics

GAP 3 adds a watcher directly on `childValueReactivity` inside `DynamicFormItem.vue` and extends the existing `values` watcher in `DynamicFormItemArray.vue`, both validation-wiring changes per the task's render-count trigger condition. Required `*.analytics.test.ts` additions to `DynamicFormItem.analytics.test.ts`:

- A container's own `renderCount` does not increase when the new watcher's silent validate runs on a descendant fill (silent mode writes only `meta.valid`, which the container's own template does not read, so no re-render is expected; pin this explicitly since a future change wiring `meta.valid` into the template would silently break it).
- `constructValidationCount` for the same container is unaffected by the new watcher (GAP 3 and GAP 2's counter are orthogonal; a regression that accidentally ties them together must fail here).
- A rapid sequence of fills/clears under the container watcher does not trip `assertNoComputeLoop`'s infinite-loop guard (mirrors the existing "does not mistake a fast burst of separate value updates for a loop" test, run once with the new watcher active).

`DynamicFormItemArray.analytics.test.ts` gets one addition: the array's own `arrayConstructValidationCount` is unaffected by the new silent validate call (same orthogonality check as above, array side).

### States policy coverage

This story has no template-facing/visual surface (confirmed in the Design reference), so there is no new rendered state to add to a states-policy checklist. The relevant states already exercised by the mapping above: valid, invalid (empty required container/array), and the transition between them (fill-then-clear). No loading or error-display state is introduced; silent validate explicitly never surfaces an error.

### Stale-registration investigation (AC 7) test-plan shape

Reproduction test, required regardless of outcome: `DynamicFormItem.logic.test.ts`, "a nested explicit choice inside a branch, switched away from, does not leave a stale registration that blocks handleSubmit on an otherwise-valid form." Fixture: an outer `explicitChoiceSelection: true` choice with two branches, one of which contains its own nested `explicitChoiceSelection: true` choice (mirrors the structure already used in `DynamicFormItemChoice.validation.test.ts`'s nested-choice fixtures, e.g. around its `maxOccursTotal`-nested-in-array-item tests). Steps: select the branch with the nested choice, select one of its inner options, switch the outer choice to the other branch, fill that branch completely, call `validate()`, then `handleSubmit()`.

Two outcomes, per the feature's standing permission:
- **(a) Fixed here.** The test asserts `validate()` resolves `{ valid: true }` and the `handleSubmit` success callback fires. This becomes a permanent regression test in `DynamicFormItem.logic.test.ts`, named after the observable symptom (not the internal mechanism), e.g. "switching away from a branch with a nested choice does not block a subsequent valid submit."
- **(b) Split to a QUICK spec.** The reproduction test still ships in this story, but as a test that documents the current (bugged) behaviour is out of scope for this story's fix: either skipped with a comment pointing at the QUICK spec, or asserting the current symptom directly (`validate()` resolves `{ valid: false, errors: {} }`) so the QUICK spec's own QA plan inherits a ready-made failing-to-passing test. This story's own notes must state the split explicitly, per the architecture's instruction.

Since the outcome is unknown before implementation, this QA plan cannot commit to which shape the merged test takes; the developer and the QA verifier resolve which of the two applies once the investigation concludes, and the adversarial review of this story must confirm the chosen shape matches whichever outcome actually happened.

### Coverage impact

New lines: the `DynamicFormItem.vue` non-input watcher (`if (!isInput.value) { watch(childValueReactivity, ...) }`) and the `DynamicFormItemArray.vue` silent-validate addition to the existing `values` watcher. Both branches (suppressed vs not) are covered by the AC1/AC3 and AC4 tests above, so no new uncovered branch is introduced. The investigation's own code change, if any, is covered by the AC7 reproduction test under whichever outcome lands. No code in this story's scope is knowingly left uncovered. `pnpm -r ci:test:coverage` must be re-run after implementation to confirm no drop against baseline; if the stale-registration fix is small and lands here, its branches need the same AC7 coverage as above.

### Time sensitivity

None of this story's behaviour is date/time-dependent. No `TZ=Europe/Amsterdam`-specific test cases are needed; the existing CI script setting is sufficient as-is.

### Regression risk

- `DynamicFormItem.vue`'s value watcher region (lines ~392-417): existing `DynamicFormItem.analytics.test.ts` render-count, `valueChangedCount`, and `notifyValueUpdateCount` assertions pin today's behaviour for leaf fields and must stay unchanged, since GAP 3 only adds a new, separate watcher for non-input fields; it must not touch the existing leaf-branch gating.
- `DynamicFormItemArray.vue`'s `values` watcher: the full `validation trigger settings` describe block in `DynamicFormItemArray.validation.test.ts` (validateOnBlur, validateOnValueUpdate, validateWhenInError, validateOnValueUpdateAfterSubmit) guards the existing gated visible `validate()`; the new silent validate must run beside it without changing when the visible, error-surfacing validate fires.
- `DynamicFormItemChoice.vue`'s own live validity: `DynamicFormItemChoice.validation.test.ts`'s existing `combinedValidation`/`effectiveValuesCount` tests guard this; the edge-case test above only adds a check, it changes no choice code.
- ST-01 (GAP 2) also edits `DynamicFormItem.vue`, in the rules `watchEffect` region rather than this story's new subtree watcher. Low conflict risk per the feature's own sequencing note, but if both land on the same branch, re-run `DynamicFormItem.analytics.test.ts` in full after merging, since both stories touch analytics counters in the same file.
- The checkout example (`docs/.vitepress/theme/components/CheckoutFormExample.vue`) is out of scope for this story (ST-04) and has no automated test today; this story's fix is a prerequisite for ST-04's `meta.valid`-based collapse but this story itself does not touch that file.

### Manual verification checklist

No template-facing or visual change in this story, so no Playwright screenshot is required. One manual spot-check before ST-04 begins: in Storybook or the existing checkout example (pre-cleanup), fill a required group/choice/array shape completely, confirm a `meta.valid`-driven indicator (if wired ad hoc for the check) goes live without a submit click, then clear it back to empty and confirm the indicator goes false again. This is a sanity check for the eventual ST-04 wiring, not a substitute for the automated tests above.

### Untestable criteria / rewrite proposals

All seven acceptance criteria and the three edge cases are testable as written using the mapping above. No rewrite is proposed. AC7 is inherently outcome-conditional by the feature's own design (standing permission to split), not a defect in the criterion's wording; the test-plan shape above accommodates both outcomes rather than treating it as untestable.

## Adversarial review
Lite (story level). Grounded in `DynamicFormItem.vue`, `DynamicFormItemArray.vue`, `core/useIsValidationSuppressed.ts`, `core/validation.ts`, and the installed `vee-validate@4.15.1` dist source.

1. **[BLOCKER] AC2 variant (a) is unsatisfiable, and the feature's finding-1 rationale is wrong for a plain-required group.** AC1/AC2's fill-then-clear transition rests on the premise (feature adversarial finding 1) that a required group with only optional children has its own `xsd_required` fail once its subtree is cleared. It does not. A container's own required rule is `createValidation('xsd_required', …)` (DynamicFormItem.vue lines 329-330), and `xsd_required` is `value !== null && value !== undefined && value !== ''` (validation.ts line 34), i.e. presence of the object, not emptiness. When a mounted child's value is cleared, vee-validate's `setInPath` leaves the group value as `{ child: undefined }` (vee-validate.mjs lines 376-396); an unmount-driven prune via `unsetPath` collapses it only to `{}` (lines 428-440). `xsd_required` passes for any object including `{}`, so the group's `meta.valid` stays `true` after clearing, whether or not the silent validate runs. Dropping the gate (correctly, for a different reason) does not deliver AC2 variant (a): running the silent validate still evaluates `xsd_required` as valid. The real fill-then-clear regression must use a container with a custom cross-field `validation` reading nested values (AC2 variant (b)) or an array (`xsd_minOccurs` counts members with value), both of which genuinely fail on empty. Routed as PROPOSED edits in AC2 and the QA AC2 row: drop variant (a), keep variant (b), add an array variant, and optionally pin that a touched-then-emptied optional-children group is intentionally `meta.valid: true`. This also means the feature's finding-1 scenario should be re-examined, since its stated mechanism ("xsd_required now fails against the empty subtree") is factually incorrect.

   RESOLVED, DECIDED (research): the PROPOSED edits are adopted in AC2, the QA AC2 row, and the Architecture reference's regression-test line. The finding's factual claims were verified against `core/validation.ts` line 34 and the installed `vee-validate@4.15.1` dist. The contradicted feature entry was itself `DECIDED (research)` (not a Jeroen decision), and the feature's gate-drop decision stands for the cross-field-`validation` case this story still delivers, so this is a research correction, not an overturned approval; the feature spec's finding 1 and GAP 3 regression-test line now carry the matching correction note. Changing `xsd_required` semantics stays out of scope per the feature.

2. **[SHOULD-FIX] The array silent validate cannot reuse the component's existing `validate`.** `DynamicFormItemArray`'s `validate` is `useValidateField(normalizedPath)`, which in vee-validate@4.15.1 returns a zero-argument `() => Promise<ValidationResult>` (dist `vee-validate.d.ts` line 1401; implementation at vee-validate.mjs line 3655 calls `form.validateField(toValue(path))` with no opts). Passing `{ mode: 'silent' }` is a type error, and if coerced the option is dropped, running a **visible** validation that surfaces array errors (`form.validateField(path, undefined)` sets `state.validated = true` and runs the full validate, vee-validate.mjs lines 2812-2823). The AC3 "no visible array error" assertion only guards the valid fill (which has no error regardless of mode), so a mode mix-up would slip through. Routed as PROPOSED edits in the Architecture reference (destructure the field-level `validate` from `useField`, which accepts `{ mode }`, or call `formContext.validateField(path, { mode: 'silent' })`) and the QA AC3 row (assert `errors`/`errorMessage` stay empty on the invalid remove transition too).

   RESOLVED, DECIDED (research): adopted in the Architecture reference, picking the `useField` destructure (the call already exists in the component at line 135, so it is the smallest change and matches `DynamicFormItem`'s own `fieldContext.validate` pattern). The zero-arg `useValidateField` signature was verified in the installed dist typings (line 1401). The QA AC3 row already carries the invalid-transition assertion.

Dependencies are explicit and consistent with the feature (none; independent of ST-01/ST-02, with the `DynamicFormItem.vue` sequencing note). The DECIDED gate-drop, the suppression guard (AC4), open-question-5 minor bump, and open-question-6 split permission (AC7) all match the approved feature architecture.

## Implementation notes

Found `packages/core/src/components/DynamicFormItem.vue` already carrying ST-01's equality-guarded rules `watchEffect` and `packages/core/src/components/DynamicFormItemChoice.vue` already carrying ST-02's `presenceValue` support on the working tree; built on top of both without touching their regions.

**Engine changes**
- `DynamicFormItem.vue`: added the non-input subtree watcher exactly as specced (`watch(childValueReactivity, …)`, guarded by `isValidationSuppressed()`, no `initialUpdate`/`checkTreeHasValue` gate), plus a plain-variable analytics counter `_analytics_subtreeValidateCount` (incremented only when the silent validate actually runs), mirroring the existing counter style. Exposed via a new `subtreeValidateCount` test helper.
- `DynamicFormItemArray.vue`: the existing `values` watcher gained a silent `validate({ mode: 'silent' })` beside the gated visible `validate()`, both behind the same `isValidationSuppressed()` check. Deviation from the drafted destructuring shape: rather than destructuring the field-level `validate` out once at setup (`validate: validateOwnField`), the whole `useField(...)` return object is kept as a binding (`arrayField`) and `arrayField.validate(...)` is called live. Reason: a test spying on the destructured copy (`vi.spyOn(arrayFieldReturnObject, 'validate')`) cannot intercept calls already bound to the original destructured reference; reading `.validate` off the live object each call is the same pattern `DynamicFormItem.vue` already uses for its own `fieldContext.validate?.(...)`, so this aligns the two call sites rather than diverging. `arrayField` also exposes `.meta` for the new `arrayMetaValid` test helper.

**Stale-registration investigation (AC7), outcome (b)** — split to `specs/QUICK-004-stale-choice-anchor-registration/spec.md` (status `draft`, not yet reviewed or approved). Root cause confirmed by dumping vee-validate's own `pathStates` through the reproduction: a field that hosts a nested `choice` registers two independent `useField` calls at the identical path (its own, from `DynamicFormItem`, plus `DynamicFormItemChoice`'s), and vee-validate's own `onBeforeUnmount` cleanup only ever lets the *last*-registered one at a shared path unregister cleanly; the first one's unmount handler bails out and leaves a permanent ghost pathState behind with its last-known validity frozen. This is a structural registration defect unrelated to silent validation (confirmed it reproduces identically with or without this story's watcher) and risky to fix inline, since the redundant registration is also the channel that validates a choice-hosting field's own `restriction`/`validation`, so simply removing it is not safe without further design. The reproduction test ships here, pinned to the current (bugged) symptom: `DynamicFormItem.logic.test.ts`, describe block `stale registration across a choice-anchor unmount`.
- A second, mounted-only manifestation of the identical root cause turned up while writing AC5's test (see below) and is folded into the same QUICK spec rather than opened separately.

**AC6 correction.** The acceptance criterion's premise ("under `validateOnValueUpdate: false` a leaf's own `meta.valid` is not refreshed") does not hold against the installed `vee-validate@4.15.1` source: `DynamicFormItem.vue` hardcodes vee-validate's own `validateOnValueUpdate` option to `false` on every `useField` call and always forwards `shouldValidate` as falsy from its `handleChange` override, but vee-validate's own `setValue` never skips validating outright when `shouldValidate` is falsy — it runs `validateValidStateOnly()` instead. So a leaf's own `meta.valid` (and the form aggregate) was already live on every value change before this story, independent of `validateOnValueUpdate`; only the *visible* error is what that setting actually defers. The decision to add no leaf-level watcher stands, for that reason rather than "out of scope and stays stale". Corrected the feature spec's adversarial finding 4, Functional overview, and "Decided without Jeroen" rollup to match (flagged amendment, not a reversal: no leaf-hot-path change was or is being made). `DynamicFormItem.validation.test.ts`'s pinned test now asserts the true behavior (meta.valid and the aggregate go live immediately, with the visible error still deferred).

**AC5 test-fixture finding (folded into QUICK-004).** The first attempt at the explicit-choice-anchor fixture for the parametrized AC5 test (a single `presenceValue`-declaring childless branch, selected, with nothing else in the form) never reached `meta.valid: true`: the presence write uses `shouldValidate: false`, which suppresses this story's new watcher for the one tick the write lands in, and with no other field in the form to trigger a later real change, nothing ever revalidates the choice-hosting field's own stuck registration afterward. This is the identical double-registration root cause as AC7's investigation, just triggered without any unmount; documented in `QUICK-004`'s Problem section as a second manifestation. The AC5 test itself uses a plain (non-explicit) two-option choice instead, which exercises the same "choice anchor" shape through an ordinary typed value change with no suppression involved.

**Tests added**, per the QA plan: `DynamicFormItem.logic.test.ts` (AC1, AC4, AC7 reproduction), `DynamicFormItem.validation.test.ts` (AC2 cross-field-container + array variants + the optional-children positive pin, AC6), `DynamicFormItem.formApi.test.ts` (AC5, parametrized over group/choice/array), `DynamicFormItem.analytics.test.ts` (render-count, construct-validation-count orthogonality, loop-guard burst, mount-time no-duplicate), `DynamicFormItemArray.logic.test.ts` (AC3 add/remove/value-change triad, AC4 suppression), `DynamicFormItemArray.analytics.test.ts` (construct-validation-count orthogonality), `DynamicFormItemChoice.validation.test.ts` (edge case: a choice's own live validity already held, no `DynamicFormItemChoice.vue` change needed).

**Changeset**: extended the existing `.changeset/computed-props-rule-rebuild.md` (started by ST-01/ST-02) with the live-`meta.valid` sub-bullet and its prominent behavior note, per the feature's "Changeset / bump" section.

**specs/components.md**: extended the `useDynamicForm` row with the live-`meta.valid` behavior note (no export shape change).

**Verification**: `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck`, and `pnpm -r ci:test:coverage` all pass; 945 core tests green (up from the pre-story count), coverage 98.49% statements / 92.58% branch, no new uncovered branch in the touched files. No UI/template-facing change, so no screenshots per the story's own Design reference note.

**Final-audit fixes**:
- Removed the em dash introduced on this branch in the new subtree-watcher comment in `DynamicFormItem.vue` and in the `arrayField` binding comment in `DynamicFormItemArray.vue`.
- Closed test gap 4 (GAP 2 x GAP 3 intersection): added a test in `DynamicFormItem.validation.test.ts`'s `live form-level meta.valid for group/array shapes` block, a group whose `computedProps` swaps `thisField.validation` between two stable cross-field closures, asserting the form-level `meta.valid` stays correct both when the active rule is swapped (exercising the guarded rule rebuild) and when a child is filled under the currently active rule (exercising the subtree watcher), combined.
- Closed test gap 3 (the mounted-only manifestation of the double-registration root cause, folded into QUICK-004): pinned a companion test beside the existing `stale registration across a choice-anchor unmount` reproduction in `DynamicFormItem.logic.test.ts`, asserting that selecting a presence-marked branch in a form with no other field never flips the form-level `meta.valid` to `true`. Flip its assertion once QUICK-004 ships.

## Verification report

### Pipeline
- `pnpm run ci:test`: 945/945 core tests pass (36 files), element-plus 1/1 pass.
- `pnpm run ci:lint`: clean.
- `pnpm run ci:typecheck`: clean.
- `pnpm -r ci:test:coverage`: core 98.49% stmts / 92.59% branch / 98.33% funcs / 98.49% lines, matching the implementation notes' claim. The only uncovered branches in the two touched files (`DynamicFormItemArray.vue` lines 222-225, 244-245) are pre-existing (the below-minOccurs clear-instead-of-remove path and the attribute-clear workaround), not introduced by this story's silent-validate addition, which is itself exercised by the AC3/AC4 tests. No drop against the pre-story baseline.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. Container silent validate on subtree change, no visible error, no touched/validated change | Pass | `DynamicFormItem.vue` lines 469-477 (`watch(childValueReactivity, ...)`, guarded, no gate); `DynamicFormItem.logic.test.ts` "refreshes via a silent validate on a descendant fill, surfacing no error and leaving touched/validated unchanged" |
| 2. Fill-then-clear regression (cross-field container + array variants), optional-children positive pin | Pass | `DynamicFormItem.validation.test.ts` lines 1280-1353, three tests matching the three described scenarios exactly; the `xsd_required`-passes-any-object reasoning verified directly against `core/validation.ts` line 34 |
| 3. Array silent validate on add/remove/value-change triad, independent of `validateOnValueUpdate` | Pass | `DynamicFormItemArray.vue` lines 135-187 (`arrayField` kept as a live binding, `arrayField.validate({ mode: 'silent' })` beside the gated visible `validate()`); `DynamicFormItemArray.logic.test.ts` "flips true on a value fill and back false on a remove, add, and value change, without ever surfacing an error" |
| 4. Suppression guard on both new sites | Pass | `DynamicFormItem.logic.test.ts` and `DynamicFormItemArray.logic.test.ts` suppression-guard tests, both green |
| 5. Form-level `meta.valid` flips true on last fill-in for group/choice/array | Pass | `DynamicFormItem.formApi.test.ts` `it.each` over the three shapes, line 704 onward |
| 6. `validateOnValueUpdate: false` qualifier, corrected | Pass | `DynamicFormItem.validation.test.ts` "a filled leaf's own meta.valid, and the form-level aggregate, go live immediately regardless of validateOnValueUpdate"; correction verified directly against installed vee-validate's `setValue`/`validateValidStateOnly` |
| 7. Stale-registration investigation, outcome-conditional | Pass (outcome b) | `DynamicFormItem.logic.test.ts` "stale registration across a choice-anchor unmount" pins the current bugged symptom (`isSubmitted` absent, no visible error); split documented below |
| Edge: choice anchor already live | Pass | `DynamicFormItemChoice.validation.test.ts` describe block `own validity already stays live as occurrence counts change` (line 2058), new, no `DynamicFormItemChoice.vue` change |
| Edge: no duplicate mount-time silent validate | Pass | `DynamicFormItem.analytics.test.ts` "does not run immediately after mount, beyond vee-validate's own mount-time check" |

### AC7 split (point 1)
`specs/QUICK-004-stale-choice-anchor-registration/spec.md` exists, status `draft`, and its Problem section opens "Split out of FEAT-010's GAP 3 story (ST-03)" and references the feature by id. ST-03's own Implementation notes state the split explicitly ("split to `specs/QUICK-004-...`... status `draft`, not yet reviewed or approved") with the root cause and why it was not fixed inline. The reproduction test (`DynamicFormItem.logic.test.ts`, `stale registration across a choice-anchor unmount`) pins the current bugged behavior per QA-plan outcome (b): asserts `isSubmitted` absent and no visible error after a valid-looking submit, matching "asserting the current symptom directly" rather than `{ valid: true }`. Compliant.

### AC6 correction (point 2)
Jeroen's original decision (qualify the claim to the default `validateOnValueUpdate: true` timing; no leaf watcher) still stands verbatim in the feature spec. The new entry is explicitly headed "Correction (DECIDED (research), from ST-03's implementation)", states the premise was factually wrong, gives the vee-validate mechanism (`setValue`/`validateValidStateOnly` always runs even when `shouldValidate` is falsy), and says plainly "the decision to add no leaf-level watcher is still correct... The Functional overview's qualifier is corrected to match" rather than silently rewriting Jeroen's resolved entry. Same pattern in the feature's "Decided without Jeroen" rollup (AR-4 correction line) and in the Functional overview's own qualifier sentence. No leaf-level watcher was added (confirmed by the `DynamicFormItem.vue` diff: the only new watcher is the non-input one). The factual claim was independently re-verified here against the installed vee-validate source description already cited; compliant, not a silent override.

### ST-04 impact (point 3)
ST-04's own spec (AC3/AC4, Architecture reference's Dependencies note) already states the conditional explicitly: AC3 applies once the stale-registration fix lands (inside ST-03 or via a merged QUICK spec), AC4 governs if it hasn't. ST-03's Implementation notes name the split and QUICK-004's draft status but do not themselves add a cross-reference sentence pointing at ST-04's AC4 path now being the live one. Minor gap: a one-line note in ST-03 confirming "ST-04's AC3 now waits on QUICK-004" would have made the connection explicit in the story that caused it, rather than relying on the reader to already know ST-04's pre-written conditional. Not blocking, since ST-04 (still `approved`, not implemented) already encodes the correct behavior on its own.

### Process compliance
- Changeset `.changeset/computed-props-rule-rebuild.md` extended with the `meta.valid` live-aggregate bullet and its prominent behavior-change note, matching the feature's minor bump decision. Business-purpose-first wording, no em dashes, matches CLAUDE.md's changeset convention.
- `specs/components.md`'s `useDynamicForm` row extended with the live-`meta.valid` behavior note and the AC6-correction detail (leaf was already live). No export shape changed, so no new row needed.
- `arrayField` live-binding deviation from the drafted destructuring shape is documented in Implementation notes with a correct rationale (a spy on a destructured copy cannot intercept calls through the original reference) and mirrored in a code comment; the code matches the documented deviation exactly.
- Test names follow repo convention (`*.logic.test.ts`, `*.validation.test.ts`, `*.formApi.test.ts`, `*.analytics.test.ts`); no spec/story/AC references found in any touched code comment or test name (checked `DynamicFormItem.vue`, `DynamicFormItemArray.vue`, and the touched test files).
- No new public API surface; `fieldContext.validate?.(...)` and `arrayField.validate(...)` are internal.
- Minor style note (non-blocking): the new code comments in `DynamicFormItem.vue` (line 464) and `DynamicFormItemArray.vue` (lines 113, 136-137, 146, 195, 223) use em dashes, which CLAUDE.md's Writing Style section prohibits in "any text you write." This matches a pervasive pre-existing pattern across the rest of both files (not introduced by this story, and not enforced by ESLint), so it is flagged as a should-fix nit rather than a blocker.

### Verdict: pass with notes
All seven acceptance criteria and both named edge cases pass with direct evidence. Pipeline, coverage, the AC7 split, the AC6 correction, and process compliance all check out. Two non-blocking notes: (1) the em-dash style nit above, (2) ST-03's own notes could more explicitly spell out the now-live ST-04/AC4 consequence, though ST-04's spec already covers it correctly. Status set to `done`.
