---
id: ST-02
type: story
feature: FEAT-010
status: done
approved_by: Jeroen
pr: ""
---

# Story: GAP 1, presenceValue for a childless explicit-choice branch

## Functional
### User story
As a template author building an `explicitChoiceSelection: true` choice with a childless branch (an "Express checkout" or "PayPal" option with nothing to fill in), I want to give that branch a `presenceValue` marker, so that selecting it writes a real value the branch's own required check can pass, and the selection persists into submitted values and reads back as selected on reload, with no hidden marker field of my own.

### Acceptance criteria

1. Given a childless branch of an `explicitChoiceSelection: true`, `maxOccurs: 1` choice declares `presenceValue` (e.g. `true`), When `addChoiceOccurrence(branchKey)` selects that branch and the branch currently holds no value, Then the engine writes `presenceValue` into the branch's own value via `formContext.setFieldValue(branchPath, presenceValue, false)`, and the branch's own `xsd_required` check now passes.
2. Given the branch is selected as in AC1, When the form is submitted, Then submission succeeds and the submitted values include `presenceValue` at the branch's path.
3. Given a branch already holds a value (a restored `preserveOnSwitch` stash, or previously loaded data), When `addChoiceOccurrence` selects it, Then the engine does not overwrite that existing value with `presenceValue`.
4. Given metadata/values are loaded with the branch's path already set to a `presenceValue`-shaped marker of any kind (including `{}`, `[]`, or a primitive), When the form mounts, Then `activeChoiceOccurrences` reads that branch as selected because its value is not `undefined`, bypassing `checkTreeHasValue` for that one case (per the feature's DECIDED option b).
5. Given a presence-marked childless branch read on reload as in AC4, When `effectiveValuesCount` is computed for the explicit single (`maxOccurs: 1`) choice, Then it is `Math.max(valuesCount, activeChoiceOccurrences.length)`, so the reloaded selection also counts toward `xsd_choiceMinOccurs` and does not fail "required" after reload.
6. Given a branch declares both `presenceValue` and `children`, When the component mounts in development mode (`import.meta.env.DEV`), Then a one-time console warning fires naming the branch (mirroring the existing `preserveOrder` scalar-branch warning pattern), and `presenceValue` is not written for that branch.
7. Given a branch of a repeatable (`maxOccurs > 1`) explicit choice declares `presenceValue`, When `addChoiceOccurrence` is called on it, Then `presenceValue` is a no-op: the pushed occurrence already represents presence, exactly as before this story.
8. Given a `presenceValue` of any JSON-serializable shape, When `hashField` computes the field's hash, Then `presenceValue` is included in the hashed `mutableProps` as a constant (it is not added to `hashField`'s exclusion list) and never perturbs the hash across runs.

### Edge cases
- Deselecting a presence-marked branch still writes `undefined` via the existing `clearBranch`, unchanged and symmetric with this story's write.
- An empty-object or empty-array `presenceValue` is not `checkTreeHasValue`-truthy but still reads as selected per AC4; any marker shape is allowed (no dev-mode warning for shape, per the feature's DECIDED resolution of finding 3). The Storybook story and docs demonstrate a truthy marker as the idiomatic shape, but this story does not restrict or warn on other shapes.
- `removeNullValues` strips an empty-object/empty-array `presenceValue` back to `undefined` when a consumer calls that optional cleanup at submit time; this story documents the interaction in both `presenceValue`'s and `removeNullValues`' doc comments rather than preventing it (feature's residual-risks note).

### Out of scope
- GAP 2 (ST-01) and GAP 3 (ST-03).
- The checkout example cleanup (ST-04).
- Any change to `xsd_choiceMinOccurs`, `xsd_choiceMaxOccurs`, `vdf_maxOccursTotal`, `preserveOnSwitch`, `displayOrder`, or `preserveOrder` semantics beyond the `effectiveValuesCount` change in AC5.
- Any change to `xsd_required`'s own semantics for an ordinary leaf.
- A general-purpose "mark any leaf field as present" mechanism outside the `explicitChoiceSelection` branch context.
- A dev-mode warning restricting `presenceValue`'s shape (explicitly rejected, finding 3 resolution).

## Design reference
No new rendered shape of its own: reuses the existing `-choice`/`default-choice` slot and the existing `addChoiceOccurrence(branchKey)` call, per the feature's Design section. This story's own Storybook story (see Architecture reference) is the one net-new demonstration the feature calls for; it reuses the established `Choices.stories.ts` + `sampleDataStory` pattern (e.g. the existing `ExplicitChoice`/`PreserveOnSwitch` stories) and needs no prototype of its own.

## Architecture reference
Builds, from the feature architecture's "GAP 1 data flow (presenceValue)" section and the matching ADR notes ("GAP 1 marker write location," "GAP 1 read bypasses checkTreeHasValue (option b)," "GAP 1 effectiveValuesCount via activeChoiceOccurrences"):

- `packages/core/src/types/FieldMetadata.ts`: new optional `presenceValue?: unknown`, added to the `ComputedPropsFieldType` exclusion list (static branch metadata, not a `computedProps` channel). Doc comment states: no-op on a `maxOccurs > 1` branch (open question 1 decision); inert with a dev-mode warning on a branch with `children` (open question 3 decision); scoped to `explicitChoiceSelection`; must be JSON-serializable (finding 7b); documents the `removeNullValues` interaction (finding 3 resolution).
- `packages/core/src/components/DynamicFormItemChoice.vue` (around the `addChoiceOccurrence` `maxOccurs === 1` path, around line 654 onward): writes `presenceValue` through `formContext.setFieldValue(branchPath, presenceValue, false)`, immediately before `explicitlySelectedBranch.value = branchKey` in the same synchronous call, only when the branch is childless, declares `presenceValue`, and currently holds no value.
- `activeChoiceOccurrences`: for a childless branch declaring `presenceValue`, the selected check becomes `branchValue !== undefined` instead of `checkTreeHasValue(branchValue)`.
- `effectiveValuesCount`: for the explicit single (`maxOccurs === 1`) case, becomes `Math.max(valuesCount.value, activeChoiceOccurrences.value.length)`, feeding `xsd_choiceMinOccurs`.
- Dev-mode warning block (mirroring the existing `preserveOrder` scalar-branch warning): once per component lifetime in `import.meta.env.DEV`, warns when a branch declares both `presenceValue` and `children`.
- `hashField` needs no code change: `presenceValue` is already included (not on its exclusion list), hashed as a constant.
- `specs/components.md` gains an entry for `presenceValue`, per the file's own update rule.
- A new test case under `packages/core/src/examples/__tests__/TestFormTemplate.testcases.ts` (re-exported via `packages/core/src/examples/index.ts`), following the existing `explicitChoiceTestCase` pattern, demonstrating a childless branch with `presenceValue`, with matching sample data (selected-and-submits, and reload-reads-as-selected).
- A matching story in `playgrounds/storybook/stories/testCases/Choices.stories.ts` via `sampleDataStory`, so Jeroen can try `presenceValue` by hand (explicit feature requirement).
- Tests under `packages/core/src/components/__tests__/` (`DynamicFormItemChoice.logic.test.ts`, `.validation.test.ts`, as appropriate) covering AC1-AC8.

Changeset: contributes the "`presenceValue` for childless explicit-choice branches (new capability)" sub-bullet to the feature's single cohesive minor changeset; may be authored here or extend one started by another story.

Dependencies: none. Independent engine + type + Storybook slice.

## QA plan

### Fixtures and test utilities
- `packages/core/src/examples/TestForm.vue` (the internal vee-validate harness) via `mount(TestForm, { props: { metadata, initialValues, settings } })`, the pattern every existing choice test in `packages/core/src/components/__tests__/DynamicFormItemChoice.*.test.ts` already uses.
- `packages/core/src/components/__tests__/DynamicFormItem.test-helpers.ts`: `formValues(wrapper)` to read submitted/current form values.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.test-helpers.ts`: `setupState`, `activeChoiceOccurrences`, `findDynamicFormItemChoiceByPath`, `canAddChoiceOccurrence`, `combinedValidationCount`. No existing helper reads a branch's raw form value or `effectiveValuesCount` directly; the plan adds two small helpers here (`branchValue(wrapper, choicePath, branchKey)` reading `useFieldValue`'s ref off `setupState`'s `branchValueRefs`, and `effectiveValuesCount(wrapper, path)` reading the computed off `setupState`) rather than reaching into private state ad hoc per test.
- New test case + sample values in `packages/core/src/examples/__tests__/TestFormTemplate.testcases.ts` (`presenceValueTestCase` / `presenceValueSampleValues`), re-exported via `packages/core/src/examples/index.ts`, following the `explicitChoiceTestCase` shape: an `explicitChoiceSelection: true`, `maxOccurs: 1` choice with one childless branch declaring `presenceValue: true` (e.g. "Express checkout") and one normal object branch with children (e.g. "Email"), so the Storybook story can demonstrate both the childless presence branch and an ordinary branch side by side.
- New story in `playgrounds/storybook/stories/testCases/Choices.stories.ts` via `sampleDataStory(presenceValueTestCase, presenceValueSampleValues)`, mirroring the existing `ExplicitChoice`/`PreserveOnSwitch` entries, with a one-line JSDoc comment describing what to try by hand (select the express branch, submit, reload with sample data).
- `vi.spyOn(console, 'warn')` for AC6, mirroring the existing scalar-branch `preserveOrder` warning tests already in `DynamicFormItemChoice.logic.test.ts` (search `warn.mock.calls`).
- `packages/core/src/utils/__tests__/hashField.test.ts` is new (no existing dedicated test file for this utility); a pure unit test needing no `TestForm` mount.

### AC to test mapping
1. **AC1 (write on selection, childless, empty)**: `DynamicFormItemChoice.logic.test.ts`, new `describe('presenceValue')` block. Mount a `maxOccurs:1` explicit choice with a childless branch declaring `presenceValue: true`, call `addChoiceOccurrence('express')` via the add button, assert `branchValue(wrapper, ..., 'express') === true` and that the branch's own required error (`[id="...express"]`'s error slot, or `combinedValidationCount`/error text) is absent. Also assert with a non-boolean marker (`'express'`, `{ selected: true }`) to cover "any JSON-serializable shape" per the architecture note.
2. **AC2 (submit succeeds, value present in submission)**: same test file. Select the branch, submit the form (trigger the fixture's submit button, or call the exposed submit handler the existing choice tests already use), assert the `onSubmit`/`formValues(wrapper)` payload includes `presenceValue` at the branch path and that no validation error blocks the submit.
3. **AC3 (existing value not overwritten)**: two cases in the same block: (a) mount with `initialValues` already set at the branch path (a loaded value), call `addChoiceOccurrence` on that branch, assert the original value is unchanged; (b) combine with `preserveOnSwitch`: stash a filled branch, switch away and back, assert the restored stash value is not clobbered by `presenceValue` (the `branchValueRefs[index].value === undefined` guard must see the just-restored value, not a stale read).
4. **AC4 (reload reads as selected, any marker shape bypasses checkTreeHasValue)**: new cases mounting `TestForm` directly with `initialValues` at the branch path set to `true`, `{}`, `[]`, and `'express'` in turn (no `addChoiceOccurrence` call, simulating a cold reload), asserting `activeChoiceOccurrences(wrapper, path)` includes the branch each time. A control case with a branch that does NOT declare `presenceValue` and the same `{}`/`[]` value asserts it is NOT selected (confirms the bypass is scoped to presence-declaring branches only, not a general relaxation of `checkTreeHasValue`).
5. **AC5 (effectiveValuesCount via activeChoiceOccurrences on reload)**: `DynamicFormItemChoice.validation.test.ts`, new block. Mount with a reload-shaped `initialValues` (branch pre-set to the marker, no `addChoiceOccurrence` call, so `explicitlySelectedBranch` stays `null`), assert no `xsd_choiceMinOccurs` error appears (directly, via `combinedValidationCount`/the choice's own error slot, or indirectly via a successful submit with no errors). Add a same-session case (select via `addChoiceOccurrence`, no reload) asserting identical behaviour to confirm the `Math.max` change is a no-op for the already-covered path, matching the architecture's "identical to today" claim.
6. **AC6 (presenceValue + children: dev warning, inert)**: new case in the `logic` file mirroring the existing scalar-branch `preserveOrder` warning test shape. Mount with a branch declaring both `presenceValue` and `children`, call `addChoiceOccurrence` on it, assert: `console.warn` called exactly once naming the branch; the branch's own top-level value (`branchValue(...)`) is NOT set to the marker (still `undefined` or whatever the child inputs produced); selecting it a second time does not warn again (once per component lifetime, matching the existing pattern).
7. **AC7 (no-op on repeatable branch)**: new case covering a `maxOccurs > 1` explicit choice whose branch declares `presenceValue`. Call `addChoiceOccurrence(branchKey)`, assert the pushed occurrence is the existing no-op shape (`null`, or `{ order }` under `preserveOrder`) exactly as before this story, i.e. `presenceValue` is never written into the pushed item.
8. **AC8 (hashField includes presenceValue as a constant, never perturbs hash)**: new `packages/core/src/utils/__tests__/hashField.test.ts`. Assert `hashField({ ...base, presenceValue: true })` differs from `hashField(base)` (it IS included, confirming it is not silently excluded) and that calling `hashField` twice on the identical field object (or two structurally-identical field objects) yields identical hashes regardless of `presenceValue`'s shape (`true`, `{}`, `[]`, `'express'`), confirming it never perturbs the hash across runs because its value never changes between calls for a given field.

### Edge cases
- Deselect-after-select: `removeChoiceOccurrence`/`clearBranch` still writes `undefined` symmetric with the existing behaviour; add one assertion in the AC1 block's test (select, then deselect) confirming the branch value returns to `undefined`, not left at the marker.
- Empty-object/array marker and `removeNullValues`: no new test needed. `packages/core/src/utils/__tests__/removeNullValues.test.ts` already covers "empty object/array strips to undefined" generically; the story's job is the doc-comment note (developer phase), not a new test. Call this out explicitly so the adversarial reviewer does not expect a dedicated interaction test.
- No dev-mode warning for marker shape (explicitly rejected per the feature): add a negative assertion in the AC1/AC4 shape-coverage cases (`{}`/`[]`/primitive markers) that `console.warn` is NOT called, so a future "helpfully" added shape warning is caught as a regression.

### States to assert (component level)
GAP 1 has no new rendered shape (reuses the existing `-choice`/`default-choice` slot), so there is no new states-policy list to satisfy. The states that matter here, all already reachable through the existing choice fixture's template:
- Branch unselected (not rendered) → selected (rendered, no required error) via `presenceValue`.
- Selected-with-marker → deselected (value cleared) → re-selected (marker re-written, not left stale from the deselect).
- Reload-selected (value-driven only, no explicit click) reading identically to click-selected, for every marker shape.
- Dev-mode warning state: branch declaring both `presenceValue` and `children`, warned once, inert at runtime.
- Repeatable-branch no-op state: marker declared but never written.

### Reactivity / analytics
This slice writes a value through `formContext.setFieldValue` and reads `activeChoiceOccurrences`/`effectiveValuesCount`, both already-reactive computeds touched by every existing choice render-count test in `DynamicFormItemChoice.analytics.test.ts`. No new `computedProps` channel and no change to `DynamicFormItem`'s own rules `watchEffect` (that is ST-01's territory), so no new `*.analytics.test.ts` assertions are required by this story. One addition is still worth it for regression safety: extend `DynamicFormItemChoice.analytics.test.ts` with a case asserting that writing `presenceValue` on selection does not cause an extra mount/render of the selected branch's own `DynamicFormItem` beyond the existing "selecting a branch mounts its DynamicFormItem exactly once" baseline (reuse `mountExplicitChoiceWithSibling`-style fixture with a childless `presenceValue` branch substituted in), so a future implementation that writes the value via a second `setFieldValue` call or a watcher (instead of inline in `addChoiceOccurrence`) cannot silently add a render without a test catching it.

### Coverage
All eight ACs plus the three edge cases map to a concrete automated test above; no code path in the AC list is knowingly left uncovered. The one area the plan does NOT add dedicated coverage for is `specs/components.md`'s own update (a documentation file, not code) and the doc-comment wording on `FieldMetadata.presenceValue`/`removeNullValues` (prose, not logic). Both are developer-phase deliverables with no executable behaviour to test. Expect `pnpm -r ci:test:coverage` to stay at or above baseline: the new code paths (the `setFieldValue` write, the `activeChoiceOccurrences`/`effectiveValuesCount` branches, the dev-warning block) are each hit by the tests above, and `hashField` gets its first dedicated test file where previously it had none, which can only raise coverage on that file.

### Time sensitivity
No date/time-dependent behaviour in this slice; no `TZ=Europe/Amsterdam` consideration applies beyond the standard CI script setting.

### Regression risk
- `DynamicFormItemChoice.vue`'s `addChoiceOccurrence`, `activeChoiceOccurrences`, and `effectiveValuesCount` are touched directly. Every existing test in `DynamicFormItemChoice.logic.test.ts`, `.validation.test.ts`, `.analytics.test.ts`, and `.formApi.test.ts` exercises these same computeds for branches that do NOT declare `presenceValue`; those suites must stay green unchanged, since the new behaviour is gated behind `declaresPresence` and must be a strict no-op otherwise.
- `explicitChoiceTestCase`, `preserveOnSwitchTestCase`, and `choiceSelectionResetTestCase` in `TestFormTemplate.testcases.ts` do not declare `presenceValue` on any branch; their existing Storybook stories and any tests built on them are an implicit regression guard that ordinary childless-branch behaviour (still failing `xsd_required` today, by design, since this story does not change the no-`presenceValue` path) is untouched.
- ST-01 (GAP 2) and ST-03 (GAP 3) both land independently and both touch `DynamicFormItem.vue`; this story touches only `DynamicFormItemChoice.vue` and `FieldMetadata.ts`, so conflict risk with those two is low, but the full `pnpm ci` run after all three land (ahead of ST-04) is the real regression gate, not this story's suite in isolation.
- `hashField`'s existing callers in `DynamicFormItem.vue` (the `computedProps` loop-guard hash) are unchanged by this story; the new `hashField.test.ts` is additive and must not assume the exclusion list changes (it does not, per the architecture).

### Manual verification checklist (for Jeroen)
- Storybook: `playgrounds/storybook/stories/testCases/Choices.stories.ts`, the new `presenceValue` story. With "Load sample data" off: click the childless branch's add button, confirm it selects with no required error, submit, confirm the submitted/debug values show the marker at the branch path. With "Load sample data" on: confirm the branch reads as already selected on mount with no click.
- Deselect the branch after selecting it, confirm the value clears and the add button for the other branch re-enables.
- Open the browser console while exercising a branch that (for this manual check only) is temporarily given both `presenceValue` and `children` in the Storybook args/controls if feasible, or rely on the automated AC6 test alone if the story itself does not expose a children+presenceValue branch; confirm the one-time warning text names the branch.
- No separate color-mode or cross-browser check: this slice has no new visual surface beyond existing choice rendering.

### Untestable / vague criteria
None. All eight acceptance criteria and the three edge cases are concrete and mapped to a test above; no rewrite proposals are needed.

## Adversarial review

Lite (story-level), blockers only. Grounded in the installed code: `DynamicFormItemChoice.vue` (`addChoiceOccurrence` single-branch path at lines 654-669, `clearBranch`/`restoreStashedBranch` at 576-620, `activeChoiceOccurrences` at 306-332, `effectiveValuesCount` at 389-397, `usedChoiceOccurrences` at 368-384, the `import.meta.env.DEV` warning block at 878-906), `FieldMetadata.ts` (`ComputedPropsFieldType` Omit list at 345-358), `hashField.ts`, `checkTreeHasValue.ts`, `removeNullValues.ts`, and the test infrastructure the QA plan names (`DynamicFormItemChoice.test-helpers.ts` exports `setupState`/`activeChoiceOccurrences`/`findDynamicFormItemChoiceByPath`/`canAddChoiceOccurrence`/`combinedValidationCount`; the scalar-branch `preserveOrder` warning tests at `DynamicFormItemChoice.logic.test.ts:3105+`; `TestFormTemplate.testcases.ts` and its re-export via `examples/index.ts`; `Choices.stories.ts` `sampleDataStory` pattern; `hashField.test.ts` confirmed absent).

**No blockers found.** All eight ACs are testable and mapped to concrete automated tests in the QA plan; the story is consistent with the approved feature's GAP 1 data-flow section and ADR notes (marker write location, `value !== undefined` read bypass, `effectiveValuesCount` via `activeChoiceOccurrences`), and the DECIDED resolutions of open questions 1/2/3/8 and findings 3/7; dependencies are correctly stated as none (matches the feature's slicing seams). Verified specifically:
- The `effectiveValuesCount` change (`Math.max(valuesCount, activeChoiceOccurrences.length)`) is a strict no-op for non-presence branches: `usedChoiceOccurrences` (line 380-381) already sources the explicit single count from `activeChoiceOccurrences.length`, and for every non-presence case `activeChoiceOccurrences.length` reduces to today's `explicitlySelectedBranch ? 1 : 0` / `valuesCount`. Over-occurrence on a `maxOccurs:1` choice is still caught by `xsd_choiceMaxOccurs`. The story's "identical to today" claim holds.
- The write guard (`branchValueRefs[index].value === undefined`) sees the just-restored `preserveOnSwitch` stash because `restoreStashedBranch`'s `setFieldValue` mutates the reactive form state synchronously and `branchValueRefs` is a `useFieldValue` computed; AC3(b) correctly pins this with a test.
- `presenceValue` is genuinely absent from `hashField`'s own exclusion list (distinct from the `ComputedPropsFieldType` list), so AC8's "included as a constant" is accurate; `hashField.test.ts` does not yet exist, so the new file is additive and can only raise coverage.

Nits (do not block; recorded for the developer/QA phase):

1. **[NIT] AC1's "the branch's own required error is absent" is a weak assertion.** The write uses `shouldValidate: false`, so immediately after selection nothing has validated and "no error text" is trivially true without proving `xsd_required` passes. The load-bearing proof is the mount-time silent validate setting `meta.valid`, or the AC2 submit. Suggest the AC1 test assert the field's `meta.valid`/successful submit rather than only the absence of rendered error text, so a regression that makes the marker fail `xsd_required` is actually caught.

2. **[NIT] The feature's `declaresPresence` (`children.length === 0 && presenceValue !== undefined`) does not gate on `explicitChoiceSelection`, and `activeChoiceOccurrences` line 323 runs for both auto and explicit-single modes.** A childless branch that declares `presenceValue` on a non-explicit (auto) choice, a misconfiguration the doc comment scopes out, would therefore get the `value !== undefined` read bypass too. It is harmless in practice (the marker write only fires in the explicit `addChoiceOccurrence` path, so an auto branch never gets a marker; only a pre-loaded `{}`/`[]` value would read differently than before), and it stems from the approved feature architecture's `declaresPresence` definition, so it is not routed as a story-local edit (that would contradict the approved feature). Flagged only so the developer can optionally scope the bypass behind `explicitChoiceSelection` while implementing, matching the property's documented scope.

## Implementation notes

Implemented per the architecture, with AC1 strengthened per the adversarial review's nit 1: the test asserts `fieldContext.meta.valid === true` on the branch's own registration (not just the absence of rendered error text), which is the load-bearing proof that `xsd_required` actually passed against the marker.

Nit 2 (the `declaresPresence` read bypass not gating on `explicitChoiceSelection`) was left exactly as specced in the approved architecture; the review itself routed it as optional and not a story-local edit, since changing it would contradict the approved feature design.

Final-audit fixes:
- Removed the em dashes introduced on this branch in the new `describe`/section-comment names in `DynamicFormItemChoice.logic.test.ts` and `DynamicFormItemChoice.validation.test.ts` (colons used instead).
- Added the missing reset test gap: selecting a presence-marked branch and then resetting the form. Verified behavior differs from what was first assumed: the marker does NOT clear back to `undefined`. The branch's own `DynamicFormItem` only mounts once it becomes the active occurrence, which happens after `writePresenceValueIfApplicable` has already written the marker through `setFieldValue`; by the time `useField` registers, vee-validate's own `stageInitialValue(path, currentValue, true)` records that already-written marker as the field's reset baseline (the same mechanism that keeps a late-pushed array item's value from being wiped by a reset). A plain, non-presence branch typed into after mount has no such baseline and does reset to `undefined` (unchanged, covered by the existing deselect test). The new test pins the verified behavior rather than the originally assumed one; flagging this for awareness since it is a direct, if non-obvious, consequence of this story's write-before-mount design, not a new regression from this fix pass.

`DynamicFormItemChoice.vue`: `writePresenceValueIfApplicable(branchKey)` runs inside `addChoiceOccurrence`'s `maxOccurs === 1` path, after `restoreStashedBranch` and before `explicitlySelectedBranch.value = branchKey` is set, matching the feature's data-flow diagram. A childless branch with an existing value (restored stash or loaded data) is left untouched; a branch declaring both `presenceValue` and `children` is inert and warns once per branch per component lifetime via `warnPresenceValueWithChildrenOnce`, mirroring the existing `preserveOrder` scalar-branch warning pattern. `activeChoiceOccurrences` and `effectiveValuesCount` were updated exactly per the architecture's pseudocode.

Test helpers added to `DynamicFormItemChoice.test-helpers.ts`: `branchValue` and `effectiveValuesCount`, per the QA plan's named additions.

Deviation: Playwright screenshot verification of the new `PresenceValue` Storybook story could not be completed in this sandboxed session. The environment has no Chromium at the `/opt/pw-browsers/chromium` path CLAUDE.md describes, and the locally cached Playwright Chromium build (`~/Library/Caches/ms-playwright/chromium-1181`) fails to launch under this sandbox (`dlopen` cannot resolve the Chromium Framework path, even with `dangerouslyDisableSandbox`). The story itself was verified by building `packages/core` and confirming the new exports (`presenceValueTestCase`, `presenceValueSampleValues`) compile and resolve; Jeroen should run `pnpm storybook` and open "Forms/TestCases/Choices > PresenceValue" to confirm the visual/interactive behavior described in the manual verification checklist.

Verification: `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck`, and `pnpm -r ci:test:coverage` all pass; coverage on `DynamicFormItemChoice.vue` stayed at 100% statements, 89.75% branch, 100% functions (the uncovered branch lines are pre-existing `preserveOrder` warning paths, unrelated to this story). `pnpm build` (packages/core) succeeds with no type errors.

## Verification report

### Pipeline
- `pnpm run ci:test` (via `pnpm -r ci:test`): 36 test files, 927 tests passed in `packages/core`; 1 test passed in `packages/element-plus`. No failures.
- `pnpm run ci:lint`: clean, no errors.
- `pnpm run ci:typecheck`: clean, no errors.
- `pnpm -r ci:test:coverage` (TZ=Europe/Amsterdam): `DynamicFormItemChoice.vue` 100% statements, 89.75% branch, 100% functions, matching the Implementation notes' claim exactly. The uncovered branch lines (930, 935-936, 943) are confirmed pre-existing `preserveOrder` scalar-branch/order-collision warning paths, untouched by this story. `hashField.ts` is now at 100/100/100/100 (its first dedicated test file). Overall `packages/core` coverage: 98.48% stmts / 92.52% branch / 98.33% funcs. No drop attributable to this story; `docs/` was not touched so `pnpm docs:build` was not required.

### Acceptance criteria

| AC | Description | Verdict | Evidence |
|---|---|---|---|
| 1 | Write presenceValue on selection of empty childless branch, branch's own required passes | Pass | `DynamicFormItemChoice.vue`'s `writePresenceValueIfApplicable` writes via `setFieldValue(branchPath, branch.presenceValue, false)` before `explicitlySelectedBranch.value = branchKey`. `DynamicFormItemChoice.logic.test.ts` "writes the %s presenceValue marker..." (boolean/string/object marker) asserts `branchValue(...) === marker` and, per the adversarial nit, the load-bearing `fieldContext.meta.valid === true`. |
| 2 | Submit succeeds, submitted values include the marker | Pass | `logic.test.ts` "submitting with the branch selected succeeds..." asserts `meta.valid`, `isSubmitted`, and `formValues(wrapper).pick.express === true`. |
| 3 | Existing value (loaded or restored stash) not overwritten | Pass | `logic.test.ts` "selecting a branch that already holds a loaded value..." (initialValues case) and "...preserveOnSwitch stash is not clobbered..." (restore-then-reselect case) both assert the original/typed value survives, not the marker. |
| 4 | Any marker shape reads as selected on reload via value !== undefined | Pass | `logic.test.ts` `describe('reload...')`, `it.each` over boolean/`{}`/`[]`/string markers, asserts `activeChoiceOccurrences` includes the branch for each shape. A negative control case (same `{}` value, no `presenceValue` declared) asserts it reads as NOT selected, confirming the bypass is scoped to presence-declaring branches only. |
| 5 | effectiveValuesCount = max(valuesCount, activeChoiceOccurrences.length), reload counts toward xsd_choiceMinOccurs | Pass | Code matches architecture pseudocode exactly. `validation.test.ts` "a reloaded presence-marked branch...counts toward xsd_choiceMinOccurs and submits without error"; `logic.test.ts` "an empty-object marker...still counts toward effectiveValuesCount" asserts `effectiveValuesCount === 1`; a same-session no-op case and a nothing-selected negative case are both also covered. |
| 6 | presenceValue + children: dev warning once, inert | Pass | `warnPresenceValueWithChildrenOnce` mirrors the `preserveOrder` pattern (`import.meta.env.DEV`, `Set` per-branch guard). `logic.test.ts` "a branch declaring both presenceValue and children warns once..." asserts exactly one `console.warn` call naming the branch, the marker is never written, and reselecting does not warn again. |
| 7 | No-op on maxOccurs > 1 branch | Pass | `writePresenceValueIfApplicable` only runs from the `maxOccurs === 1` path in `addChoiceOccurrence`; `logic.test.ts` "is a no-op on a repeatable...branch" asserts the pushed occurrence is `[null]`, unchanged. |
| 8 | hashField includes presenceValue as a constant, never perturbs hash | Pass | New `hashField.test.ts`: confirms `presenceValue` is not on the exclusion list (hash differs when added), and hashing twice with any marker shape (boolean/string/empty object/empty array/non-empty object) yields identical hashes. |

Edge cases: deselect-after-select returns to `undefined` (covered in the AC1 `logic.test.ts` block); `removeNullValues`/empty-marker interaction is documented in both doc comments per the plan's explicit "no new test needed" call-out (existing `removeNullValues.test.ts` already covers the generic empty-object/array-to-undefined behavior); "no shape warning" is pinned by an explicit `warnSpy` not-called assertion in the AC1/AC4 shape-coverage cases.

### Prototype / visual comparison
No new rendered shape (feature's Design section: GAP 1 reuses the existing `-choice`/`default-choice` slot). The new `PresenceValue` Storybook story follows the established `sampleDataStory(testCase, sampleValues)` pattern identical in shape to the sibling `ExplicitChoice`/`PreserveOnSwitch` stories; no visual drift risk since no new slot or markup was introduced. No color-mode or responsive check applies (docs-site not touched).

### Process compliance
- `specs/components.md`: new `FieldMetadata.presenceValue` entry added, correctly describing the write/read/count/warning/hash/removeNullValues behavior.
- Changeset: `.changeset/computed-props-rule-rebuild.md` is the feature's single cohesive minor changeset; it already carries the `presenceValue` bullet (extended by this story per the architecture's "authored in whichever lands first" instruction), matching the required minor bump.
- Tests named per convention: new cases sit in the existing `.logic.test.ts`/`.validation.test.ts`/`.analytics.test.ts` files plus a new `hashField.test.ts`, no spec/story references in test names or comments (checked).
- Library API rules: `presenceValue?: unknown` is additive, camelCase, added to `ComputedPropsFieldType`'s exclusion list correctly (no `computedProps` channel invented); no new slot or required markup, matching the "established channels only" rule.
- No silent overrides of feature-level decisions found: nit 2 (declaresPresence not gated on `explicitChoiceSelection`) was deliberately left as specced per the adversarial review's own routing (not a story-local edit, since changing it would contradict the approved architecture) and is called out explicitly in the Implementation notes, not silently changed.
- Deviation (screenshot): the developer could not run Playwright/Chromium in this sandbox and documented why. Judged acceptable, not a fail: the feature's own Design section states GAP 1 has no new visual surface, the story's QA plan explicitly states "no new visual surface beyond existing choice rendering" and no color-mode/responsive check applies, and the one Storybook-visible requirement (Jeroen being able to try `presenceValue` by hand) is a manual checklist explicitly scoped "for Jeroen," not an automated or agent-verifiable step. The new story reuses the exact same rendering path as the already-shipped `ExplicitChoice`/`PreserveOnSwitch` stories, so there is no new visual language to regress-check. The build/export verification the developer did perform (package build succeeds, new exports resolve) is adequate substitute evidence given this constraint.

### Overall verdict: PASS

All eight acceptance criteria hold with concrete automated evidence against the installed code; pipeline (test/lint/typecheck) and coverage are clean with no drop; process compliance (components.md, changeset, test naming, API rules) is satisfied; the one documented deviation (no Playwright screenshot) is judged non-blocking given the feature's own "no new visual surface" framing and the explicitly Jeroen-scoped manual checklist.

Jeroen: please link the PR in this story's frontmatter (`pr:`) once opened. This was not the feature's last open story (ST-03 is still `approved`, not yet implemented; ST-04 depends on it), so FEAT-010 stays `in-progress`.
