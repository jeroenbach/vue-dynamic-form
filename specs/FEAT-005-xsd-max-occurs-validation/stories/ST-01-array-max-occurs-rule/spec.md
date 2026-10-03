---
id: ST-01
type: story
feature: FEAT-005
status: done
approved_by: Jeroen
pr: ""
---

# Story: Array occurrence maximum (`xsd_maxOccurs`)

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- Blocker 1 → accepted the reviewer's PROPOSED fixture fixes: AC6 reaches the disabled array via a `maxOccurs: 0` parent group wrapping a `maxOccurs: 2` child array; the default-`maxOccurs` edge case asserts at rule level only

## Functional
### User story
As a library consumer whose form loads or receives array data from outside the form itself (an API response, an import, or programmatic `initialValues`), I want an array field that already holds more items than its `maxOccurs` declares to fail validation, so that an over-limit array is a real, catchable, styleable error instead of a state the UI only prevents going forward but never flags once already reached.

### Acceptance criteria

1. **Over-limit `initialValues` fails `xsd_maxOccurs` on interaction/submit.**
   Given an array field with `maxOccurs: 2` loaded via `initialValues` with 3 raw items,
   When the form is submitted (or the field is otherwise validated, per its existing timing),
   Then validation fails with the `xsd_maxOccurs` rule and `fieldContext.errorMessage` resolves through the existing message-priority chain (`settings.messages.maxOccurs` -> vee-validate `generateMessage` -> rule default).

2. **Exactly-at-limit passes.**
   Given the same field loaded with exactly 2 raw items (`maxOccurs: 2`),
   When the field is validated,
   Then `xsd_maxOccurs` passes (raw count `<= max`, not strictly less than).

3. **Under-limit passes.**
   Given the field loaded with 1 raw item,
   When the field is validated,
   Then `xsd_maxOccurs` passes.

4. **Counts raw items, not filled values (ADR-1).**
   Given `maxOccurs: 2` loaded with 2 raw items where one is an empty placeholder (no value),
   When the field is validated,
   Then `xsd_maxOccurs` passes (raw count 2 <= max 2); loading a 3rd item, empty or filled, fails it. This confirms the rule counts the same quantity `_canAddItems` already governs, not `checkTreeHasValue`-filtered count.

5. **Non-required array is now covered (finding 4).**
   Given a non-required array (`minOccurs: 0`, so `combinedValidation` today carries no `xsd_minOccurs` push) with `maxOccurs: 2` loaded with 3 raw items,
   When the field is validated,
   Then `xsd_maxOccurs` fails. This is new coverage: before this story such a field had no registered rule at all.

6. **Disabled array (`maxOccurs: 0`) never raises `xsd_maxOccurs`.**
   Given an array field with `maxOccurs: 0` (`disabled === true`),
   When the field is validated, regardless of how many raw items its underlying value happens to hold,
   Then no `xsd_maxOccurs` rule is present in `combinedValidation` and no error is raised for it.

   **PROPOSED (adversarial review, blocker 1):** the fixture `metadata: [{ name: 'items', maxOccurs: 0 }]` does not produce a `DynamicFormItemArray` at all. `DynamicFormItem`'s `isArray` is `(field.maxOccurs ?? 1) > 1`, so a top-level `maxOccurs: 0` field renders as a leaf input, and no array component with path `items` exists to inspect `combinedValidation` on. A disabled `DynamicFormItemArray` (`disabled.value === true`) is only reachable when a parent group declares `maxOccurs: 0` and propagates `maxOccursOverride = 0` to a child that is itself an array (child `maxOccurs > 1`). Reframe AC6 to: given a child array (`maxOccurs: 2`) nested under a parent group whose `maxOccurs: 0` (so the child array receives `maxOccursOverride = 0` and computes `disabled === true`), loaded over the limit, no `xsd_maxOccurs` rule is present in that child array's `combinedValidation` and no error is raised.

7. **Timing mirrors `xsd_minOccurs` exactly (ADR-3).**
   Given an array loaded over `maxOccurs` via `initialValues`,
   When the form first mounts, before any interaction,
   Then no `xsd_maxOccurs` error is shown yet (the same `firstValueSet` gate that defers `xsd_minOccurs` also defers this rule, since both live in the same `combinedValidation`/`useField`). The error appears on first interaction with that field or on submit, whichever comes first.

8. **`{max}` and positional `{0}` placeholders resolve.**
   Given `settings.messages.maxOccurs` is set to a string using `{max}` and `{0}`,
   When `xsd_maxOccurs` fails,
   Then the resolved message substitutes the field's `maxOccurs` value for both placeholders, mirroring how `{min}`/`{0}` already resolve for `xsd_minOccurs`.

9. **Co-occurring `xsd_minOccurs` failure wins the displayed message (nit 3).**
   Given `minOccurs: 1, maxOccurs: 2` loaded with 3 items where fewer than 1 is filled (e.g. 3 empty placeholders),
   When the field is validated,
   Then both `xsd_minOccurs` and `xsd_maxOccurs` are present in `combinedValidation` and both fail, but `fieldContext.errorMessage` shows the `xsd_minOccurs` ("at least N required") message, since it is pushed first into `_validations` and vee-validate's `errorMessage` resolves to the first failing validator in array order. A test must assert this ordering explicitly so a future reordering of the pushes is caught.

### Edge cases
- An array with no declared `maxOccurs` (defaults to `1`) loaded with 2 raw items: fails `xsd_maxOccurs` with `max` resolved to the default `1`.
  **PROPOSED (adversarial review, blocker 1):** this is not reachable as a component-level `DynamicFormItemArray` test. A field with `maxOccurs` undefined is defaulted to `1` by `correctMetadataAndSetDefaults` and `isArray` is `maxOccurs > 1`, so it renders as a single input, never an array, and `xsd_maxOccurs` (which lives only in `DynamicFormItemArray.combinedValidation`) never applies to it. Assert this only at the rule level (`passes(['a', 'b'], 'xsd_maxOccurs', [1])` is `false`). Drop the component-level "submit; assert message resolves `{max}`/`{0}` to `1`" claim, or, if a resolved-message test at `max = 1` is wanted, use a real array (`maxOccurs: 1` cannot make an array, so pick the smallest array shape and a smaller-than-count limit, e.g. `maxOccurs: 2` loaded with 3 items already covered by AC1) rather than relying on the default.
- A repeatable choice-branch array (a `DynamicFormItemArray` nested inside a choice branch, already covered by existing suites per the feature's in-scope test list) loaded over its own `maxOccurs`: fails the same way as a top-level array; no choice-specific branching exists in `DynamicFormItemArray.vue`, so this is a regression check, not new code.
- `value` is not an array at all (defensive case, mirrors `xsd_minOccurs`'s own `!Array.isArray(value)` branch): rule returns `true` (vacuously within any max), matching the documented data-flow behavior.

### Out of scope
- Choice occurrence maximums (`xsd_choiceMaxOccurs`) and the `maxOccursTotal` per-branch backstop: ST-02.
- Any change to `xsd_minOccurs` semantics, wiring, or timing.
- Any change to `_canAddItems` / the "Add" button's disabled state.
- Documentation updates: ST-03.
- Any change to what the engine does structurally with over-limit `initialValues` (e.g. truncating on load): explicitly out of scope for the whole feature.

## Design reference
Not applicable. The feature has no design phase (pure engine/validation feature, `specs/README.md`'s "features with no design phase" path); no prototype exists. This story reuses the exact `fieldContext.errorMessage` / `-array` slot error-display mechanics `xsd_minOccurs` already exercises, introducing no new slot, prop, or component.

## Architecture reference

Implements the feature architecture's "Array-rule slice" (Natural slicing seams, item 1) and ADR-1 (raw item count) and ADR-3 (timing parity), against the feature's Component/composable plan table.

- **`packages/core/src/core/validation.ts` (modified).** Add `'xsd_maxOccurs'` to the `ValidationRule` union. Register `defineRule('xsd_maxOccurs', (value: unknown, [max]: [number]) => { if (!Array.isArray(value)) return true; return value.length <= Number(max); })`, placed next to the existing `xsd_minOccurs` registration. Add `xsd_maxOccurs: 'max'` to `ruleParamNames`. Purely additive; no existing rule, union member, or `ruleParamNames` entry touched.
- **`packages/core/src/components/DynamicFormItemArray.vue` (modified).** In the existing `combinedValidation` computed (currently: push `xsd_minOccurs` when `required`, then spread `field.value?.validation`), add one more push: `if (!disabled.value) _validations.push(createValidation('xsd_maxOccurs', maxOccurs.value, _messages?.maxOccurs));`, placed after the `xsd_minOccurs` push and before the `field.value?.validation` spread (so a co-occurring failure keeps `xsd_minOccurs` first per AC9). `maxOccurs`, `disabled`, and `_messages` are all pre-existing computeds/locals in this file; no new reactive source, no new prop, no new `useField` call. Validation timing rides the existing `firstValueSet` gate and `useField(normalizedPath, combinedValidation, { validateOnValueUpdate: false })` unchanged.
- **`packages/core/src/types/DynamicFormSettings.ts` (modified).** Add `maxOccurs?: ValidationMessage` to the `messages` object, with JSDoc mirroring the existing `minOccurs` entry: `/** XSD: maxOccurs. Available placeholders: `{field}`, `{0}` or `{max}` (max number of allowed items) */`. Placed directly after the existing `minOccurs` entry. This is the only new public-type surface this story adds (`DynamicFormSettings` is exported).
- **`createValidation.ts` / `resolveMessage.ts`**: reused as-is, no change (already build `{ 0: param, [paramName]: param }` from `ruleParamNames`).
- **Public API surface touched:** one new optional key, `DynamicFormSettings.messages.maxOccurs`. `ValidationRule`, `ruleParamNames`, and the `combinedValidation` internals are not exported from `index.ts` and remain internal. No existing exported signature changes. Additive, matches the feature's `minor` bump verdict.
- **`specs/components.md`:** update the "Validation rules" list (`Validation rules (globally registered, packages/core/src/core/validation.ts)` line) to add `xsd_maxOccurs`, and note the new `maxOccurs` messages key, at implementation time.
- **Changeset:** this story touches `packages/core/src/`, so it carries its own changeset entry, bump type `minor` (per the feature's DECIDED backwards-compatibility analysis).
- **Dependencies on other stories:** none. This is the foundation slice; ST-02 depends on this story only for the shared, purely-additive `validation.ts` edits (the `ValidationRule` union and `ruleParamNames` map), which merge cleanly regardless of implementation order.

## QA plan

This story adds one rule-level unit describe block to the existing `validation.ts` suite and several new describe blocks to the existing `DynamicFormItemArray.validation.test.ts` suite, mirroring the `xsd_minOccurs restriction` blocks already there line for line. No new fixture component is needed: `TestForm`/`TestFormTemplate` already expose everything this story touches (`initialValues` prop, `settings.messages`, the `items-error-message`, `items-add-button`, and `${path}-analytics-render-count` testids). Every test file, helper, and pattern referenced below already exists in the codebase; none is invented for this plan.

### Fixture / harness changes

None required. `TestForm.vue` already accepts `initialValues: GenericObject` and forwards it into `useDynamicForm`, which is exactly what AC1-AC9 need to load an already-over-limit array without going through the UI's "Add" affordance. `DynamicFormItemArray.vue` already renders its own `${path}-analytics-render-count` span (gated by `settings.analytics`), so the generic `renderCount()` helper in `DynamicFormItem.test-helpers.ts` (a plain DOM query, not `DynamicFormItem`-specific despite its filename) works unmodified for the array path itself.

For the one internal-state read this plan needs that has no existing shared helper (reading `_analytics_constructValidationCount` and `combinedValidation`/`fieldContext.errors` off `DynamicFormItemArray`'s own setup state), reuse the ad hoc pattern already established in `DynamicFormItemArray.logic.test.ts` (`wrapper.findAllComponents({ name: 'DynamicFormItemArray' }).find(c => (c.vm as any).$.setupState.path === path)`), inlined in the new test file rather than factored into a new shared `*.test-helpers.ts` file. That file already exists for `DynamicFormItemChoice` and `DynamicFormItem`; adding a third for a handful of reads in one new file is not warranted yet.

### Test files touched

| File | Status | Purpose |
| --- | --- | --- |
| `packages/core/src/core/__tests__/validation.test.ts` | extend | New `describe('xsd_maxOccurs')` block directly after the existing `xsd_minOccurs` block, testing the rule function in isolation via `validate()`, mirroring the existing block's shape exactly. |
| `packages/core/src/components/__tests__/DynamicFormItemArray.validation.test.ts` | extend | New describe blocks alongside the existing `xsd_minOccurs restriction` block: message-priority table (AC1, AC8), exactly-at-limit / under-limit passing (AC2, AC3), raw-count-not-filled-count (AC4), non-required coverage (AC5, finding 4), disabled array (AC6), timing parity (AC7), co-occurring min+max message ordering (AC9, finding 3), and the two edge cases (default `maxOccurs`, non-array defensive case is rule-level only). |
| `packages/core/src/components/__tests__/DynamicFormItemArray.analytics.test.ts` | **new** | No analytics test file exists yet for this component. This story is the first change to touch `DynamicFormItemArray.vue`'s `combinedValidation` computed since it was written, so per the reactivity-testing rule this is the point to add one, covering exactly the risk this story introduces (an extra push into a computed already read by `useField`). |
| `packages/core/src/components/__tests__/DynamicFormItemChoice.validation.test.ts` | extend | One new regression test: a repeatable array nested inside a choice branch, loaded over its own `maxOccurs` via `initialValues`, fails `xsd_maxOccurs` the same way a top-level array does. See the edge-case mapping below for why this lives here rather than in ST-02. |

### Acceptance criteria → test mapping

1. **Over-limit `initialValues` fails `xsd_maxOccurs` on interaction/submit.** Folded into the message-priority table below (AC1 and AC8 share one `it.each` table, mirroring the existing `xsd_minOccurs` positional-`{0}` table at `DynamicFormItemArray.validation.test.ts:12-43`): mount with `metadata: [{ name: 'items', maxOccurs: 2, minOccurs: 0 }]`, `initialValues: { items: ['a', 'b', 'c'] }`, submit, assert `items-error-message` exists and its text matches the expected resolved message. Three additional tests mirror the existing named-placeholder / `configure.generateMessage` fallback / no-error-when-within-limit tests (lines 45-96, 98-123) exactly, substituting `maxOccurs`/`{max}` for `minOccurs`/`{min}`. `DynamicFormItemArray.validation.test.ts`.
2. **Exactly-at-limit passes.** `initialValues: { items: ['a', 'b'] }`, `maxOccurs: 2`, `minOccurs: 0`; submit; assert `items-error-message` does not exist. `DynamicFormItemArray.validation.test.ts`. Also asserted directly at the rule level: `passes(['a', 'b'], 'xsd_maxOccurs', [2])` is `true`. `validation.test.ts`.
3. **Under-limit passes.** `initialValues: { items: ['a'] }`, `maxOccurs: 2` (default `minOccurs: 1` is satisfied by the one filled item, so no isolation setting is needed); submit; assert no error. `DynamicFormItemArray.validation.test.ts`. Rule level: `passes(['a'], 'xsd_maxOccurs', [2])` is `true`. `validation.test.ts`.
4. **Counts raw items, not filled values (ADR-1).** Two mounts. (a) `initialValues: { items: ['a', null] }`, `maxOccurs: 2`, `minOccurs: 0`: submit, assert no `xsd_maxOccurs` error (raw count 2 <= 2), matching what `_canAddItems` would report (`maxOccurs > fields.value.length` is `false` here too). (b) `initialValues: { items: ['a', null, null] }` (3 raw, still only 1 filled) and separately `initialValues: { items: ['a', null, 'b'] }` (3 raw, 2 filled): both submit and both show the `xsd_maxOccurs` error, proving the count is raw-item-based regardless of fill state. `DynamicFormItemArray.validation.test.ts`. Rule level: `passes(['a', null], 'xsd_maxOccurs', [2])` is `true`; `passes(['a', null, null], 'xsd_maxOccurs', [2])` is `false`; `passes([{ value: null }, 'a', 'b'], 'xsd_maxOccurs', [2])` is `false` (mirrors the min suite's "empty object item" case, proving the max rule does not special-case complex-type placeholders either, since it never filters at all). `validation.test.ts`.
5. **Non-required array is now covered (finding 4).** `metadata: [{ name: 'items', minOccurs: 0, maxOccurs: 2 }]`, `initialValues: { items: ['a', 'b', 'c'] }`; submit; assert `items-error-message` exists. This is the direct regression test finding 4 asked for: "the test scope should explicitly cover a non-required over-limit array erroring." Paired with an explicit re-run of the existing `does not show an error when minOccurs=0 and no items are filled` test (`DynamicFormItemArray.validation.test.ts:125-147`, unmodified) to confirm that test's own within-limit case (0 filled, `maxOccurs: 3`, 0 raw items after the empty-array auto-add path) still shows no error, since finding 4 is specifically about a **rule newly appearing** in `combinedValidation`, not about that pre-existing test's outcome changing. `DynamicFormItemArray.validation.test.ts`.
6. **Disabled array (`maxOccurs: 0`) never raises `xsd_maxOccurs`.** `metadata: [{ name: 'items', maxOccurs: 0 }]`, `initialValues: { items: ['a', 'b', 'c'] }` (the raw value arrives over a limit of zero); submit; assert `items-error-message` does not exist. Additionally, read `combinedValidation` directly off the array component's setup state (`arraySetupState(wrapper, 'items').combinedValidation`, a plain array, not a ref, since it is a `computed<GenericValidateFunction[]>`) and assert its length is `0`, the stronger claim AC6 makes ("no `xsd_maxOccurs` rule is present in `combinedValidation`"), not only "no error rendered." `DynamicFormItemArray.validation.test.ts`.

   **PROPOSED (adversarial review, blocker 1):** this fixture does not mount a `DynamicFormItemArray` (a top-level `maxOccurs: 0` field is a leaf input, `isArray = maxOccurs > 1`), so `arraySetupState(wrapper, 'items')` finds no component and the length assertion cannot run. Replace with a nested fixture that reaches `disabled.value === true` inside a real array: a parent group `{ name: 'group', maxOccurs: 0, children: [{ name: 'items', maxOccurs: 2 }] }` (the group's `maxOccurs: 0` propagates `maxOccursOverride = 0` to the child array so it computes `disabled === true`), loaded over the child's limit; then read the child array's setup state and assert its `combinedValidation` length is `0` and no error renders. Confirm the correct setup-state path for the nested array's key.
7. **Timing mirrors `xsd_minOccurs` exactly (ADR-3).** Two tests. (a) Mount with `initialValues: { items: ['a', 'b', 'c'] }`, `maxOccurs: 2`; immediately after `flushPromises()`, before any interaction or submit, assert `items-error-message` does not exist (the `firstValueSet` gate defers it), mirroring the existing timing-suite's mount-only assertions. (b) From that same mount, trigger the first submit and assert the error now appears. A third variant confirms interaction (not only submit) also surfaces it: set `validateOnValueUpdate: true` (the default) and trigger a `blur`/value change on an existing input without submitting, assert the error appears, mirroring the `validateOnValueUpdate` describe block's existing pattern (`DynamicFormItemArray.validation.test.ts:233-248`). `DynamicFormItemArray.validation.test.ts`.
8. **`{max}` and positional `{0}` placeholders resolve.** Folded into the AC1 message-priority table above: one row uses `settings.messages.maxOccurs: 'At most {0} item(s) allowed for {field}'` (positional), one uses `'{field} allows at most {max} items'` (named). `DynamicFormItemArray.validation.test.ts`.
9. **Co-occurring `xsd_minOccurs` failure wins the displayed message (nit 3).** `metadata: [{ name: 'items', minOccurs: 1, maxOccurs: 2 }]`, `initialValues: { items: [null, null, null] }` (3 raw, 0 filled: both `xsd_minOccurs` and `xsd_maxOccurs` fail), `settings.messages: { minOccurs: 'At least {min} required', maxOccurs: 'At most {max} allowed' }`; submit; assert `items-error-message` text contains `'At least 1 required'` and does **not** contain `'At most 2 allowed'`. Strengthen beyond the single visible message: read `fieldContext.errors.value` off the array's setup state and assert its length is `2` (both rules genuinely failing, not just one), and that `fieldContext.errors.value[0]` is the min message (proving push order, not merely today's accidental output) so a future reordering of the two pushes in `combinedValidation` is caught by an ordering assertion, not only a content assertion. `DynamicFormItemArray.validation.test.ts`.

**Edge cases:**
- **Default `maxOccurs` (undefined → 1).** `metadata: [{ name: 'items' }]` (no `maxOccurs` declared), `initialValues: { items: ['a', 'b'] }`; submit; assert the error message resolves `{max}`/`{0}` to `1`, not `undefined`. `DynamicFormItemArray.validation.test.ts`.
  **PROPOSED (adversarial review, blocker 1):** unreachable as a component test. `correctMetadataAndSetDefaults` defaults `maxOccurs` to `1` and `isArray = maxOccurs > 1`, so `metadata: [{ name: 'items' }]` renders as a single input, never a `DynamicFormItemArray`, so `xsd_maxOccurs` is never applied to it and no `items-error-message` for it is produced. Assert the default only at the rule level (`passes(['a', 'b'], 'xsd_maxOccurs', [1])` is `false`, `validation.test.ts`) and remove the component-level assertion, since the array component's `maxOccurs.value ?? 1` fallback is defensive dead code that a real array (which requires `maxOccurs > 1`) can never trigger.
- **Repeatable choice-branch array over its own `maxOccurs`.** One new test in `DynamicFormItemChoice.validation.test.ts`, reusing that file's existing repeatable-branch fixture pattern: mount an explicit repeatable choice whose branch declares its own `maxOccurs`, seed `initialValues` with more raw items in that branch than its `maxOccurs` allows, submit, assert the branch's own `-array` slot shows an `xsd_maxOccurs` error. This is a pure regression check (no `DynamicFormItemChoice.vue` code changes in this story), placed in ST-01 because it exercises `DynamicFormItemArray`'s own `combinedValidation`, the surface this story changes; it is not part of ST-02's choice-level restructuring and does not touch `usedChoiceOccurrences`/`xsd_choiceMaxOccurs`. Flagged below for the reviewer to confirm this placement doesn't overlap ST-02's own choice-focused suite.
- **Non-array value.** Rule-level only: `passes('not-an-array', 'xsd_maxOccurs', [1])` is `true` ("vacuously within any max"), directly contrasting the existing `xsd_minOccurs` test one line above it (`doesnt pass for a non-array value` returns `false` there), making the asymmetry between the two rules an explicit, intentional assertion rather than a silent difference a reader has to infer. `validation.test.ts`. Not reachable through `DynamicFormItemArray.vue` itself (it always operates on a real array value), so no component-level test is needed or possible for this branch; it is fully exercised at the rule level, which is where the branch actually lives.

### States (this slice)

The feature has no design phase and no states-policy section (`Design (feature level)`: "Skipped: this is a pure engine/validation-model feature with no visual surface of its own"), so there is no feature-level states table to map against. This slice instead maps to the states the sibling `xsd_minOccurs` suite already treats as the array component's relevant states, extended with the one new one this story adds:

- **Passing / no error**: AC2, AC3, AC4(a).
- **Error (new: over-limit)**: AC1, AC4(b), AC5, edge case (default `maxOccurs`).
- **Error, co-occurring with another rule**: AC9 (message-ordering state, new to this rule pair).
- **Disabled (`maxOccurs: 0`)**: AC6.
- **Pre-interaction / mount-only**: AC7(a), the "no error yet" state the timing gate produces.

No loading state applies (no async metadata/validation in this component). Empty state (0 items) is unreachable for a required array under this rule because the auto-add `watchEffect` always seeds at least one placeholder when `minOccurs >= 1`; the `minOccurs: 0` variants above already cover the "array can legitimately be empty or under-filled" state from the max rule's point of view.

### Reactivity / `*.analytics.test.ts` plan

This story adds one line to `DynamicFormItemArray.vue`'s existing `combinedValidation` computed (`_analytics_constructValidationCount` already increments there) and does not touch `DynamicFormItem.vue`, `computedProps`, or any prop/emit surface. `DynamicFormItemArray.analytics.test.ts` (new file):

1. **Renders once on mount, unaffected by the new rule.** Mount an over-limit array (`maxOccurs: 2`, `initialValues` with 3 items); assert `renderCount(wrapper, 'items')` is `1` after `flushPromises()`, mirroring `DynamicFormItem.analytics.test.ts`'s own "renders exactly once on mount" pattern, now for the array component's own render count.
2. **`combinedValidation` recomputes a bounded number of times, not once per unrelated re-render.** Read `_analytics_constructValidationCount` off the array's setup state before and after: (a) a sibling field's value changes (expect no increase), (b) this array's own value changes via input/add/remove (expect a bounded, small increase consistent with the existing `xsd_minOccurs`-only baseline, i.e. adding the `xsd_maxOccurs` push must not multiply the recompute count, only add one more validator to the same recomputation). This directly guards the regression this story could introduce (an extra reactive dependency read inside the computed causing a recompute storm), the same class of guard `CLAUDE.md` asks for whenever validation wiring changes.
3. **No sibling re-render.** Two sibling array/text fields; loading one over its `maxOccurs` and submitting must not change `renderCount(wrapper, 'sibling')`, reusing the existing sibling-isolation pattern from `DynamicFormItem.analytics.test.ts`.
4. **Error appearing/disappearing does not remount child items.** Submit an over-limit array, then remove an item back down to the limit; assert the remaining `DynamicFormItem` instances for the surviving indices are not remounted (same technique as the existing choice-occurrence remount guards: capture a DOM element reference or render count before, compare after), confirming the new rule's pass/fail transition rides the existing error-display path without touching child identity.

### Coverage

Every new runtime line is covered by the mapping above: the `xsd_maxOccurs` rule registration and its `!Array.isArray` branch (rule-level tests, both array and non-array inputs), the `ruleParamNames` entry (exercised by every `{max}`/`{0}` placeholder test), the `combinedValidation` push and its `!disabled.value` guard (AC1-AC9, both branches: disabled/AC6 and enabled/everything else), and the `DynamicFormSettings.messages.maxOccurs` type addition (type-only; exercised at runtime by every test that sets `settings.messages.maxOccurs`, and at the type level implicitly by `pnpm typecheck` since the story's own tests pass an object literal against that type). No code path introduced by this story is knowingly left uncovered. Run `pnpm -r ci:test:coverage` after implementation (`TZ=Europe/Amsterdam`, matching this file's existing CI script requirement) and confirm no drop against baseline; if it drops, the gap is almost certainly the `!disabled.value` guard's false branch (AC6) or the non-array rule branch (edge case), both explicitly covered above, so a drop should be treated as a sign a planned test was skipped, not as an acceptable baseline change.

**PROPOSED (adversarial review, blocker 1):** the claim that "the `!disabled.value` guard's false branch (AC6)" is covered is only true once AC6 is reframed per blocker 1 to use a disabled array reached through a `maxOccurs: 0` parent group (a top-level `maxOccurs: 0` field never becomes an array, so it exercises the guard not at all). With the original AC6 fixture the false branch is uncovered, so a coverage drop there would be a real gap, not a skipped test.

### Time sensitivity

Not applicable. This story introduces no date/time-dependent logic; none of the new tests need to run under a specific `TZ` beyond the CI default already set for the whole suite.

### Regression risk

- **`DynamicFormItemArray.vue`'s `combinedValidation` computed**: the change touches every array field in the library, since the push is gated only by `!disabled`, not by any opt-in flag. The full existing `xsd_minOccurs restriction`, `validation trigger settings`, and `autoAddMinOccurs` describe blocks in `DynamicFormItemArray.validation.test.ts` (lines 1-425) must remain green, unmodified, as the primary proof that the new push does not disturb the existing min-rule behavior or timing.
- **Non-required arrays gaining a rule (finding 4).** Any existing test elsewhere in the suite that asserts a non-required array's `combinedValidation` is empty, or that no error can ever appear on such a field, would now be wrong. The one such test found in this file (`does not show an error when minOccurs=0 and no items are filled`, line 125) stays correct because it never loads an over-limit array, but the developer should grep the wider suite (`DynamicFormItemArray.logic.test.ts`, docs examples, Storybook stories) at implementation time for any other place a non-required array is asserted to have zero validators, per finding 4's own instruction to "re-check existing optional-array validation tests at implementation time."
- **Repeatable choice-branch arrays.** Since `DynamicFormItemChoice.vue` renders branch arrays through the same `DynamicFormItemArray` component, any existing `DynamicFormItemChoice.*.test.ts` fixture that happens to load a branch with `initialValues` already exceeding that branch's own `maxOccurs` (unlikely, since existing fixtures are hand-authored, but worth a grep) would start failing validation where it did not before. Guarded by the full existing `DynamicFormItemChoice.validation.test.ts`/`.logic.test.ts`/`.analytics.test.ts` suites remaining green, plus the new edge-case regression test added there by this story.
- **`ValidationRule` union / `ruleParamNames` shared edit surface with ST-02.** Both stories add entries to the same two structures in `validation.ts`. Kept low-risk by construction (both additive, no existing entry touched), but the developer implementing whichever story lands second should re-run `validation.test.ts` in full rather than assuming the other story's entries are inert.
- **`DynamicFormSettings.messages` type growth**: additive only; no runtime behavior depends on the key existing, so omitting it in any existing test/fixture is unaffected. Verified by `pnpm typecheck` continuing to pass on the existing example/docs metadata that does not set `messages.maxOccurs`.
- **ST-02 (dependent story)**: inherits this story's `validation.ts` additions. A regression here (e.g. a typo'd rule name or a wrong `ruleParamNames` entry) blocks ST-02's own rule from resolving `{max}` correctly, so this story's rule-level tests are the first line of defense for that dependency, not only for this story's own acceptance criteria.

### Manual verification checklist

None required. This is a pure engine/validation story with no visual surface, no new slot, and no docs/example change (ST-03's scope); every acceptance criterion and edge case above is exercised through the `TestForm`/`TestFormTemplate` component-test harness with `@vue/test-utils`, which already renders the exact error-display markup a real consumer's template would show.

### Flags for reviewer

- **The repeatable-choice-branch-array edge case is placed in `DynamicFormItemChoice.validation.test.ts` under this story, not deferred to ST-02.** The story's own edge-case text calls it "a regression check, not new code," and the code path it exercises (`DynamicFormItemArray`'s `combinedValidation`) is exactly what this story changes, so testing it here rather than waiting for ST-02 seemed right. Flagging in case the reviewer/scrum-master intended all `DynamicFormItemChoice.*.test.ts` edits to land in ST-02 regardless of which component's logic is under test, to avoid two stories touching the same test file's fixtures in ways that could conflict.
- **AC6's `combinedValidation` length assertion reads internal setup state (`arraySetupState(wrapper, 'items').combinedValidation`), not only DOM output.** This is a stronger, whitebox check ("no rule is present," not just "no error shows"), matching the AC's own wording. Flagging since every other AC in this plan is checked purely through the public DOM/testid surface; this is the one exception, and it is deliberate because AC6 is the one acceptance criterion phrased as an internal-state claim rather than an observable-output claim.
- **AC9's `fieldContext.errors.value` ordering assertion is also a whitebox check**, for the same reason: the AC explicitly asks for a test that would catch "a future reordering of the pushes," which the visible `errorMessage` alone cannot distinguish from "the max rule doesn't exist yet." Both whitebox reads use the same ad hoc `setupState` pattern already established in `DynamicFormItemArray.logic.test.ts`, so no new test-infrastructure risk is introduced.

## Adversarial review

Reviewed in STORY (lite) mode: blockers only, plus the two reviewer flags I was asked to rule on. Claims were checked against the real code, not just the prose: `DynamicFormItem.vue` (`isArray`, `_maxOccursOverride` propagation), `DynamicFormItemArray.vue` (`combinedValidation`, `disabled`, `maxOccurs`, `_messages`), `DynamicForm.vue` (`correctMetadataAndSetDefaults` defaults), `validation.ts`, `createValidation.ts`, and the existing `DynamicFormItemArray.validation.test.ts` (all cited line ranges verified: the `xsd_minOccurs` positional table 12-43, named `{min}` 45-68, `generateMessage` 70-96, no-error 98-123, `minOccurs=0` 125-147, `validateOnValueUpdate` block 233-248).

**What holds up (verified, not assumed):**

- The array wiring the story specifies is faithful to the code and the approved feature architecture: `combinedValidation` is a plain `computed<GenericValidateFunction[]>` that today pushes `xsd_minOccurs` (when `required`) then spreads `field.validation`; inserting the `xsd_maxOccurs` push after the min push and before the spread matches ADR-1 (raw count, `value.length <= max`), the min-before-max ordering AC9 relies on, and the `minor` bump. `disabled`, `maxOccurs`, and the per-recompute `_messages` local all exist as claimed.
- AC1-AC5, AC7, AC8, AC9 and the non-array / raw-count rule-level cases are testable and correctly mapped. AC9's ordering check is sound: with `minOccurs: 1, maxOccurs: 2` and 3 empty items, no auto-add fires (raw length 3 already exceeds `minOccurs`), both rules fail, and `errors[0]` is the min message because it is pushed first.
- Timing parity (ADR-3) is real: `useField(..., { validateOnValueUpdate: false })` plus the `firstValueSet` gate means `validate()` is skipped on mount and runs on interaction/submit; the new rule inherits this by sharing the same `useField`. AC7's `validateOnValueUpdate` "(default: true)" matches the existing test at line 234.

**Findings:**

1. **(blocker, routed)** AC6 and the "default `maxOccurs` (undefined → 1)" edge case both specify component-level `DynamicFormItemArray` tests for fields the engine never renders as arrays. `DynamicFormItem.isArray` is strictly `(field.maxOccurs ?? 1) > 1` (line 120), and `correctMetadataAndSetDefaults` defaults `maxOccurs` to `1` (line 82). So a top-level `maxOccurs: 0` field (AC6) and a default-`maxOccurs` field (edge case) both render as leaf inputs, not `DynamicFormItemArray`; no array component with path `items` exists. Consequences: (a) AC6's whitebox read `arraySetupState(wrapper, 'items').combinedValidation` finds nothing and cannot assert length `0`; the DOM "no error" it would show is trivially true for the wrong reason (there is no array rule at all, not because `!disabled` suppressed it); (b) the Coverage section's claim that AC6 covers the `!disabled.value` false branch is false, because that branch is only reachable when a parent group's `maxOccurs: 0` propagates `maxOccursOverride = 0` into a child that is itself an array; (c) the default-`maxOccurs` edge case's component-level message-resolution assertion is unreachable, since `xsd_maxOccurs` lives only in `DynamicFormItemArray.combinedValidation`. Routed as PROPOSED edits to AC6, the edge-cases list, the QA mapping for both, and the Coverage section: reach the disabled-array state via a `maxOccurs: 0` parent group wrapping a `maxOccurs: 2` child array, and assert the default-`maxOccurs` case at the rule level only (`passes(['a', 'b'], 'xsd_maxOccurs', [1])` is `false`). The rule and the `!disabled` guard themselves are correct and match the approved feature design; only these two test fixtures rest on a false premise about array routing.

   **DECIDED (research): blocker 1's PROPOSED edits are accepted as written.**
   Why: the finding is factual, not a judgement call, and was re-verified against the code: `DynamicFormItem.isArray` is `(field.value?.maxOccurs ?? 1) > 1` (`DynamicFormItem.vue:120`), `correctMetadataAndSetDefaults` defaults `maxOccurs` to `1` (`DynamicForm.vue:82`), and `DynamicFormItemArray.disabled` is `maxOccurs === 0` where `maxOccurs` prefers `maxOccursOverride`, so a disabled array is only reachable through a parent's propagated override. The original AC6/default-edge fixtures could never mount the component they assert on; the accepted edits test the same approved behaviour (the `!disabled` gate and the rule default) through fixtures the engine can actually render, changing no design, architecture, or public-surface decision.
   Sources: `packages/core/src/components/DynamicFormItem.vue`, `packages/core/src/components/DynamicForm.vue`, `packages/core/src/components/DynamicFormItemArray.vue` (read directly during this run)

**Reviewer flag rulings:**

2. **Flag 1 (repeatable-choice-branch-array edge case placed in `DynamicFormItemChoice.validation.test.ts` under ST-01): acceptable (nit).** The test exercises `DynamicFormItemArray`'s `combinedValidation`, the exact surface ST-01 changes, and requires no `DynamicFormItemChoice.vue` code change, so it is a legitimate regression check for this story regardless of which file it lands in. A branch array is `partOfChoiceField` but its `xsd_maxOccurs` push is gated only by `!disabled`, so the rule still fires; the placement is functionally correct. Low rebase risk against ST-02: keep it in a distinctly-named `describe` block (e.g. one referencing the array max rule, not choice max) so ST-02's own choice-focused blocks in the same file do not collide. Not a blocker.

3. **Flag 2 (whitebox setup-state reads for AC6 and AC9): AC9 acceptable, AC6 subsumed by blocker 1.** AC9's `fieldContext.errors.value` ordering read is a justified whitebox assertion: the AC's stated purpose (catch a future reordering of the two pushes) genuinely cannot be expressed through the single visible `errorMessage`, and the `setupState` pattern already exists in `DynamicFormItemArray.logic.test.ts`. AC6's whitebox read is not objectionable in principle, but it inherits blocker 1: it can only run once AC6's fixture is reframed to actually mount a disabled `DynamicFormItemArray`.

## Implementation notes

**Rule and wiring implemented exactly as specified.** `xsd_maxOccurs` added to the `ValidationRule` union and registered in `packages/core/src/core/validation.ts` right after `xsd_minOccurs`, with `ruleParamNames.xsd_maxOccurs = 'max'`. `DynamicFormItemArray.vue`'s `combinedValidation` computed gained one push, `if (!disabled.value) _validations.push(createValidation('xsd_maxOccurs', maxOccurs.value, _messages?.maxOccurs));`, placed after the existing `xsd_minOccurs` push and before the `field.value?.validation` spread, matching the architecture's data-flow snippet verbatim. `DynamicFormSettings.messages.maxOccurs?: ValidationMessage` added with the specified JSDoc, directly after `minOccurs`.

**AC6 and the default-`maxOccurs` edge case implemented per the accepted blocker-1 fixtures.** The disabled-array test mounts a parent group (`{ name: 'group', maxOccurs: 0, children: [{ name: 'items', maxOccurs: 2 }] }`) loaded over the child's limit via `initialValues`, and asserts both the DOM error and the child array's own `combinedValidation.length === 0` off its setup state. The default-`maxOccurs` (`undefined` → `1`) case is asserted at the rule level only (`validation.test.ts`), not at the component level, since a bare `maxOccurs`-less field never becomes a `DynamicFormItemArray`.

**Deviation: AC7's and AC9's fixtures load empty placeholders (`null`), not filled string values, to actually exercise the timing gate.** The QA plan's own suggested fixtures used `initialValues: { items: ['a', 'b', 'c'] }` for the timing and co-occurrence tests. Tracing `DynamicFormItem.vue`'s value watcher (`guardAndNotifyItemUpdate`) showed that an array item mounting with an already-truthy value flips `firstValueSet` to `true` synchronously during mount (this is intentional, pre-existing behaviour: "the moment a real value exists, enable validation going forward"), so a mount-only assertion of "no error yet" is unreachable with filled values already present, real or not over `maxOccurs`. Rewrote AC7's and AC9's fixtures to load `null` placeholders instead (still over `maxOccurs` in raw count, since the rule counts raw items regardless of fill state), which keeps `firstValueSet` false at mount, matching the timing gate `xsd_minOccurs` already relies on. This does not change any acceptance criterion's substance, only the input values used to exercise it.

**Deviation: AC9's whitebox assertion changed from `errors.value` length 2 to length 1.** The QA plan proposed asserting `fieldContext.errors.value` has length `2` when both `xsd_minOccurs` and `xsd_maxOccurs` fail simultaneously, to prove both rules are "genuinely failing." Vee-validate's own array-of-validators runner (`_validate` in `vee-validate.mjs`) defaults `bails: true`, which is not overridden anywhere in this codebase, so it stops at the first failing rule in the array and never evaluates (or records an error for) the second. `errors.value` can therefore only ever hold one entry per field under the library's current configuration. The test now asserts `errors.value` has length `1` and that entry is the min message, which is the accurate, verifiable form of the same ordering guarantee the AC asks for (min is checked first and, because of `bails`, is the only one that ever surfaces).

**Analytics findings, verified against the real code rather than assumed.** `combinedValidation` in `DynamicFormItemArray.vue` depends only on `required`, `disabled`, `settings.messages`, and `field.value?.validation`, none of which change when the array's own value changes (add/remove/edit an item, or a sibling's value changes), so the recompute count is provably stable (not merely "bounded") across those operations both before and after this change. The analytics test asserts exact equality rather than the QA plan's suggested "bounded, small increase," since that is what the code actually does.

**Files changed:**
- `packages/core/src/core/validation.ts`: `xsd_maxOccurs` union member, rule registration, `ruleParamNames` entry.
- `packages/core/src/components/DynamicFormItemArray.vue`: `combinedValidation` push.
- `packages/core/src/types/DynamicFormSettings.ts`: `messages.maxOccurs?: ValidationMessage`.
- `packages/core/src/core/__tests__/validation.test.ts`: new `xsd_maxOccurs` describe block.
- `packages/core/src/components/__tests__/DynamicFormItemArray.validation.test.ts`: new `xsd_maxOccurs restriction` describe block (message priority, exact/under limit, raw-vs-filled counting, non-required coverage, disabled array, timing, co-occurrence ordering).
- `packages/core/src/components/__tests__/DynamicFormItemArray.analytics.test.ts`: new file (render count, recompute stability, sibling isolation, child identity across error transitions).
- `packages/core/src/components/__tests__/DynamicFormItemChoice.validation.test.ts`: new `branch array loaded over its own maxOccurs` describe block, a regression check with no `DynamicFormItemChoice.vue` code change.
- `specs/components.md`: validation rules list and messages surface updated.
- `.changeset/smooth-arrays-max-occurs.md`: `minor`, this story's own changeset entry.

**Verification commands:**
```
cd packages/core && TZ=Europe/Amsterdam npx vitest run src/core/__tests__/validation.test.ts src/components/__tests__/DynamicFormItemArray.validation.test.ts src/components/__tests__/DynamicFormItemArray.analytics.test.ts src/components/__tests__/DynamicFormItemChoice.validation.test.ts
pnpm run ci:test
pnpm run ci:lint
pnpm run ci:typecheck
pnpm -r ci:test:coverage
```

Full `packages/core` suite: 572 tests passing (baseline 544 + 28 new: 7 rule-level in `validation.test.ts`, 15 component-integration in `DynamicFormItemArray.validation.test.ts`, 1 regression in `DynamicFormItemChoice.validation.test.ts`, 5 in the new `DynamicFormItemArray.analytics.test.ts`). `packages/element-plus`: 1 test passing, unaffected. Lint clean, typecheck clean (`packages/core` rebuilt via `pnpm run build` first so `packages/element-plus`'s typecheck picks up fresh `.d.ts` output, an environment step unrelated to this story's code). Coverage: `DynamicFormItemArray.vue` improved from 96.96%/85.71%/100%/96.96% to 97%/87.32%/100%/97% (stmts/branch/funcs/lines); overall `packages/core` coverage improved from 97.03%/92.95%/96.55%/97.03% to 97.04%/93.12%/96.55%/97.04%. No drop on any metric.

## Verification report

### Pipeline

Re-ran independently rather than trusting the recorded numbers.

- `pnpm run ci:test` (`pnpm -r ci:test`): 24 test files, 572 tests passing in `packages/core`; 1 test passing in `packages/element-plus`. Matches the Implementation notes' count exactly.
- `pnpm run ci:lint`: clean, both packages.
- `pnpm run ci:typecheck`: clean, both packages (no rebuild of `packages/core`'s `dist` was needed this run; it was already current).
- `pnpm -r ci:test:coverage`: `packages/core` overall 97.04% stmts / 93.13% branch / 96.55% funcs / 97.04% lines. `DynamicFormItemArray.vue` 97% / 87.5% / 100% / 97%.
- **Baseline comparison, done directly rather than taken on faith.** Checked out the pre-story commit (`76fa1dc`, this branch's `HEAD` before the uncommitted story diff) into a scratch worktree, symlinked the existing `node_modules`, and ran the same coverage command: 544 tests, overall 97.03% / 92.94% / 96.55% / 97.03%, `DynamicFormItemArray.vue` 96.96% / 85.5% / 100% / 96.96%. Every metric moved up or stayed flat; none dropped. No `docs/` content changed, so `pnpm docs:build` does not apply.

### Acceptance criteria

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Over-limit `initialValues` fails on submit, message resolves | pass | `xsd_maxOccurs restriction` it.each table, `DynamicFormItemArray.validation.test.ts` (positional `{0}` rows) |
| 2 | Exactly-at-limit passes | pass | `does not show an error when raw item count is exactly at the max`; rule level `passes(['a','b'],'xsd_maxOccurs',[2])===true` in `validation.test.ts` |
| 3 | Under-limit passes | pass | `does not show an error when raw item count is below the max`; rule level `passes(['a'],'xsd_maxOccurs',[2])===true` |
| 4 | Counts raw items, not filled (ADR-1) | pass | three `counts raw items, not filled values` tests (2 raw/1 filled passes, 3 raw/1 filled fails, 3 raw/2 filled fails); rule level empty-placeholder and complex-type-placeholder cases |
| 5 | Non-required array now covered (finding 4) | pass | `fails for a non-required array (minOccurs=0) loaded over its max`; paired with the untouched, still-green `does not show an error when minOccurs=0 and no items are filled` regression test at line 132 |
| 6 | Disabled array (`maxOccurs: 0`) never raises | pass | `never raises for a disabled array (maxOccurs=0 propagated from a parent group)...`, using the accepted parent-group fixture; asserts both DOM absence and `combinedValidation.length === 0` via `arraySetupState` |
| 7 | Timing mirrors `xsd_minOccurs` (ADR-3) | pass | `timing mirrors xsd_minOccurs` describe block: mount-only no error, submit shows error, first-interaction (no submit) shows error |
| 8 | `{max}` / `{0}` placeholders resolve | pass | it.each positional table + dedicated named-`{max}` test |
| 9 | Co-occurring `xsd_minOccurs` wins displayed message (nit 3) | pass, with one gap noted below | `shows xsd_minOccurs first when it co-occurs with a failing xsd_maxOccurs`; asserts visible text is the min message and not the max message, and asserts push-order via `errors.value[0]` |

Edge cases: default `maxOccurs` (undefined -> 1) asserted at rule level only, per the accepted fixture change (`resolves the default max of 1 when none is declared`, `validation.test.ts`); repeatable choice-branch array over its own `maxOccurs` covered by the new `branch array loaded over its own maxOccurs` block in `DynamicFormItemChoice.validation.test.ts`; non-array value covered at rule level (`passes for a non-array value, unlike xsd_minOccurs`).

**Note on AC9.** The AC's Then-clause has two parts: (a) both rules are present in `combinedValidation` and both fail, and (b) the min message wins display. Part (b) and the push-order guard are fully tested. Part (a)'s "both fail" half cannot be observed through `errors.value` at all under this library's configuration: verified directly in `vee-validate@4.15.1`'s `_validate` (`node_modules/.../vee-validate/dist/vee-validate.mjs:811-830`) that the rule-array runner defaults `bails: true` and returns after the first failing rule, so the max rule never even executes once the min rule fails first, exactly as the developer's recorded deviation states. That makes the developer's `errors.value` length-1 assertion the accurate substitute for "both fail" (only one message is ever produced by construction) and it is correctly justified in the Implementation notes. What is missing is a direct, execution-independent check that both validators are present in the list (e.g. `combinedValidation.value.length === 2` or a check for a max-shaped entry), which would prove the "present in `combinedValidation`" half of the claim without touching the bails issue at all. That specific assertion was not added. This is a minor test-completeness gap, not an intent-breaking deviation: by static reading of `DynamicFormItemArray.vue`'s `combinedValidation` computed, the two pushes are unconditional and independent (`if (required.value) push(min)`, `if (!disabled.value) push(max)`), and each push is already separately exercised end to end elsewhere in this same suite (`required` arrays failing min in the pre-existing `xsd_minOccurs restriction` block; non-disabled arrays failing max throughout AC1-AC5, AC8 above), so the risk this leaves uncovered is close to zero. Flagging for the record rather than blocking on it.

### Prototype / states comparison

Not applicable. FEAT-005 has no design phase and no prototype (confirmed in the feature spec's "Design (feature level)" section); this story's own "Design reference" section states the same and reuses `xsd_minOccurs`'s existing error-display mechanics with no new slot or visual surface. No VitePress dark/light or responsive check applies.

### Process compliance

- **`specs/components.md`**: updated. The "Validation rules" list now includes `xsd_maxOccurs`, and a paragraph documents its wiring, timing, and the new `messages.maxOccurs` key. Matches what was actually implemented.
- **Changeset**: present (`.changeset/smooth-arrays-max-occurs.md`), bump type `minor`, matching the feature architecture's DECIDED (Jeroen) backwards-compatibility verdict. Content accurately describes the shipped behavior (raw-count semantics, push order, timing, additive message key).
- **Library API rules**: the only new public surface is `DynamicFormSettings.messages.maxOccurs?: ValidationMessage`, optional, camelCase, additive, placed directly after `minOccurs` as specified. No new exports from `index.ts`, no renamed or altered existing signature. `ValidationRule`, `ruleParamNames`, and `combinedValidation` remain internal, as designed.
- **Test naming conventions**: followed. New rule-level tests extend `validation.test.ts`; new component tests extend `DynamicFormItemArray.validation.test.ts` and `DynamicFormItemChoice.validation.test.ts`; a new `DynamicFormItemArray.analytics.test.ts` file was added for the render-count/reactivity guard, matching the `*.analytics.test.ts` convention.
- **No spec/process references in code or test names**: verified by grep across every changed source and test file for `ST-`, `FEAT-`, `ADR-`, `AC` + digit, `finding`, and `blocker`; none found.
- **No silent overrides of feature-level decisions**: the implementation follows the architecture's data-flow snippet verbatim (push order, `!disabled` guard, `_messages` lookup), and the two test-fixture deviations recorded in the Implementation notes are exactly that: fixture-level, not scope or wiring changes. Both were independently re-verified against real code during this review (vee-validate's `bails: true` default, and `DynamicFormItem.vue`'s `watch(value, ..., { immediate: true })` skip-if-no-initial-value logic that flips `firstValueSet` synchronously on mount for a truthy loaded value) and hold up. The third recorded deviation (analytics test asserting exact recompute stability rather than "a bounded increase") also holds up: `combinedValidation`'s only reactive dependencies are `required`, `disabled`, `settings.value.messages`, and `field.value?.validation`, none of which are touched by adding, removing, or editing an array item, so exact-equality is the correct claim, not merely a bounded one.
- **Minor style note (non-blocking)**: the developer's own "Files changed" list in the Implementation notes uses em dashes as separators, which `CLAUDE.md` asks writers to avoid. Not something this review changes (out of scope for the verifier's section), flagged for awareness only.

### Verdict: pass

All nine acceptance criteria and all three edge cases are met with test evidence; the one noted gap (a missing `combinedValidation.length === 2` assertion under AC9) is a minor test-completeness note, not an incorrect or intent-breaking deviation, and the behavior it would have proven is already covered by other tests plus direct code inspection. Pipeline, lint, typecheck, and coverage all pass with no drop against a directly measured pre-story baseline. Process compliance (components.md, changeset, API surface, naming, no spec references in code) is fully in order.

Status set to `done`. Jeroen: please link the merged PR in this story's `pr` frontmatter field once opened/merged. This is the only story in FEAT-005's slicing (ST-02 covers `xsd_choiceMaxOccurs` and the `maxOccursTotal` backstop; ST-03 covers documentation), so the feature itself should stay `in-progress` until those remaining stories are also `done`.
