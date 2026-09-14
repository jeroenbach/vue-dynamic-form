---
id: ST-01
type: story
feature: FEAT-001
status: done
created: 2026-09-10
approved_by: Jeroen
pr: ""
---

# Story: Engine - maxOccurs:1 explicit choice selection (foundation)

## Functional
### User story
As a template author building a `DynamicFormTemplate`-based template, I want to explicitly mark a branch of a `maxOccurs: 1` choice as selected before any of its fields hold a value, so that I can build a "pick first, then fill in" UX without reaching into engine internals or faking a hidden field.

### Acceptance criteria

1. **Auto mode is unchanged (regression baseline).**
   Given a choice field with `explicitChoiceSelection` absent or `false`,
   When the form renders,
   Then every branch renders exactly as today (all `DynamicFormItem` children present, siblings disable once one holds a value via the existing `overrideChildMaxOccurrences`), and no new primitive is required to reproduce current behaviour. Covered by existing `DynamicFormItemChoice` tests staying green plus a new explicit assertion that the render path is byte-identical when the flag is absent.

2. **Explicit mode, nothing selected, renders no branch.**
   Given `explicitChoiceSelection: true` on a `maxOccurs: 1` choice and no prior selection,
   When the form renders,
   Then no branch's `DynamicFormItem` is mounted and `activeChoiceOccurrences` is `[]`.

3. **`addChoiceOccurrence(branchKey)` selects a branch immediately.**
   Given the choice above,
   When the template calls `addChoiceOccurrence('selfServe')`,
   Then the `selfServe` branch's `DynamicFormItem` mounts with no value required, and `activeChoiceOccurrences` becomes `[{ branchKey: 'selfServe', index: 0 }]`.

4. **Switching branches clears the deselected branch and mounts the new one.**
   Given `selfServe` is selected and has field data,
   When `addChoiceOccurrence('guidedRollout')` is called,
   Then `selfServe`'s data is cleared via `setFieldValue(branchPath, undefined, false)` (the `branchPath` resolved through `overridePath`, consistent with decision 6), the `selfServe` `DynamicFormItem` unmounts, `guidedRollout` mounts, and `childValues['selfServe']` resets to `occurrences: 0, valuesCount: 0`.

5. **`removeChoiceOccurrence(branchKey)` deselects.**
   Given `selfServe` is selected,
   When `removeChoiceOccurrence('selfServe')` is called (index omitted, per API item 2: ignored in `maxOccurs: 1`),
   Then the branch unmounts and `activeChoiceOccurrences` returns to `[]`.

6. **`xsd_choiceMinOccurs` clears on selection alone (parity, DECIDED finding 2).**
   Given a required (`minOccurs: 1`) explicit choice with nothing selected (error showing),
   When a branch is selected via `addChoiceOccurrence`, even with no field inside it filled in,
   Then `xsd_choiceMinOccurs` no longer reports an error (`effectiveValuesCount = max(childValuesDerivedCount, explicitlySelected ? 1 : 0)`), and the branch's own required fields (if any) drive their own validation independently. Covered by a `*.validation.test.ts`.

7. **`canAddChoiceOccurrence(branchKey)` reflects the disabled state.**
   Given the choice is disabled (`maxOccurs: 0` via metadata or override),
   When `canAddChoiceOccurrence(branchKey)` is called for any branch,
   Then it returns `false`. When the choice is enabled, it returns `true` for `maxOccurs: 1` (there is no per-branch budget to exhaust in the single case; budget-aware behaviour is slice 2's concern).

8. **Single-branch choice bypasses the `singleChild` fast path when explicit (DECIDED finding 5).**
   Given a choice with exactly one branch and `explicitChoiceSelection: true`,
   When the form renders with nothing selected,
   Then the `singleChild` shortcut is skipped: nothing renders until `addChoiceOccurrence` is called, at which point the sole branch mounts. With the flag absent, the existing `singleChild` fast path is unchanged (regression test).

9. **`explicitChoiceSelection` is static metadata, not computed (DECIDED finding 4).**
   Given a choice with `explicitChoiceSelection: true` in static metadata,
   When a `computedProps` function on that node attempts to set `explicitChoiceSelection` on `thisField`,
   Then the mutation has no effect on the render mode (the property is excluded from `ComputedPropsFieldType`, so it is not even assignable), preventing a mid-form flash/mount-unmount storm. Covered by a type-level check (the property does not typecheck as assignable inside `computedProps`) plus a runtime regression test using a mutation attempt via the raw metadata object.

10. **Clear-on-switch residue matches the accepted contract (ADR-3, DECIDED Jeroen 2026-09-10 option (a), reconfirmed by Jeroen during story prep).**
    Given a branch was selected, filled in, and then deselected by switching to another branch,
    When the raw `values` object is inspected,
    Then the deselected branch's key is still present with `undefined`-valued leaves (e.g. `launchApproach: { selfServe: undefined }`), occurrence counting and `xsd_choiceMinOccurs` are unaffected by that residue, and `removeNullValues(values)` (already exported) yields the clean shape with the key pruned. Covered by a test asserting the exact post-switch shape of `values`, not just its serialised JSON.

11. **Choice inside an array occurrence, `maxOccurs: 1` (decision 6).**
    Given an array of two items, each containing an independent `maxOccurs: 1` explicit choice (e.g. two contacts, each with a `method` choice),
    When `addChoiceOccurrence` is called on contact 0's choice and then on contact 1's choice with a different branch,
    Then each selection and each clear-on-switch resolves through `overridePath` against that item's own `pathOverride` (`projectContacts[0].method.*` vs `projectContacts[1].method.*`) and neither leaks into the other.

### Edge cases
- Loading saved data where a branch already has a value, with `explicitChoiceSelection: true` and `addChoiceOccurrence` never called: the branch still renders, because `activeChoiceOccurrences` merges the value-driven view (existing `childValues` logic) with the explicit view (decision 4, "loading saved data still reads as selected").
- Calling `addChoiceOccurrence` twice in a row with the same already-active `branchKey`: idempotent, no duplicate mount, no spurious clear-then-reselect of the same branch.
- Calling `addChoiceOccurrence`/`removeChoiceOccurrence`/`canAddChoiceOccurrence` with a `branchKey` that does not match any `field.choice[].name`: no-op, no throw.

### Out of scope
- `maxOccurs > 1` repeatable selection, `*-choice-item` slot, and the shared occurrence budget across branches (ST-02).
- Docs/template changes (ST-03, ST-04).
- Preserve-on-switch (ST-05); this story only implements clear-on-switch, the baseline.

## Design reference
Feature prototype (`../../prototype.html`): `#overview` (slot-prop legend), `#single-unselected`, `#single-selected`, `#single-selected-guided`, `#single-switch` (the clear-on-switch half only; the preserve-on-switch annotation on that same section is ST-05's delta), `#single-error`, and the `maxOccurs: 1` half of `#choice-in-array` (two contacts, each an independent `method` choice). The `multi-*` anchors and the repeatable half of `#choice-in-array` are ST-02's design reference, not this story's.

## Architecture reference
Builds, against the feature architecture's Public API impact and "Where state lives" sections:

- **`packages/core/src/components/DynamicFormItemChoice.vue` (modified, this story's core change).** Adds: `explicitlySelectedBranch = ref<string | null>(null)`; `addChoiceOccurrence` / `removeChoiceOccurrence` / `canAddChoiceOccurrence` / `activeChoiceOccurrences` for the `maxOccurs: 1` case only (the per-branch `useFieldArrayExtended` wiring for `maxOccurs > 1` is ST-02); `useFormContext()` for the clear-on-switch `setFieldValue(branchPath, undefined, false)`; the `effectiveValuesCount` fold into `valuesCount`/`combinedValidation`; bypassing the `singleChild` fast path when `explicitChoiceSelection` is true (finding 5); explicit-mode conditional rendering (render only the active branch, or nothing).
- **`packages/core/src/types/FieldMetadata.ts` (modified, additive).** New optional `explicitChoiceSelection?: boolean` on the base `FieldMetadata`; added to the `Omit` list in `ComputedPropsFieldType` alongside `maxOccurs`, `isComplexType`, `computeOnChildValueChange` (finding 4).
- **`packages/core/src/components/DynamicFormTemplate.vue` (modified, type-only + passthrough).** New `ChoiceOccurrence` and `ChoiceAttributes<TMetadataConfiguration> extends ArrayChoiceAttributes<TMetadataConfiguration>` interfaces per the feature architecture's Public API impact item 2, with all four primitives (`addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`); `-choice`/`default-choice` slot mappings point at `ChoiceAttributes`. The runtime passthrough is unchanged (`useAttrs()` + `camelize`, same mechanism `addItem`/`canAddItems` already use). The `*-choice-item`/`default-choice-item` slots (API item 3) are ST-02's addition, not this story's.
- **`packages/core/src/utils/removeNullValues.ts` — reused as-is,** referenced by AC 10's test; no change needed here (already exported).
- **Public API surface touched:** `FieldMetadata.explicitChoiceSelection` (new, additive) and the four `-choice` slot props (new, additive) on `ChoiceAttributes`. No export removed or renamed, no signature changes. Additive -> minor per the feature architecture's Changeset section.
- **Dependencies on other stories:** none; this is the foundation seam (seam 1) all later stories build on.
- **Changeset:** this story touches `packages/core/src/`, so it carries its own changeset entry (`minor`) for the `explicitChoiceSelection` flag and the four `-choice` slot props.
- **`specs/components.md`:** update the `DynamicFormItemChoice` row and the Types table entry for `FieldMetadata` once the flag and slot props ship.

## QA plan

### Test files touched

All tests live next to `packages/core/src/components/DynamicFormItemChoice.vue` in `packages/core/src/components/__tests__/`, following the existing per-component convention (one file per naming suffix, no extra qualifiers, matching `DynamicFormItemChoice.logic.test.ts` / `.validation.test.ts` already in the repo).

| File | Status | Purpose |
| --- | --- | --- |
| `DynamicFormItemChoice.logic.test.ts` | extend | New `describe('explicit selection — maxOccurs:1 (ST-01)')` block: AC1 (regression), AC2, AC3, AC4, AC5, AC7, AC8, AC9 (runtime + type-level), AC11, and the three edge cases. ~20 new `it`s. |
| `DynamicFormItemChoice.validation.test.ts` | extend | New `describe('explicit selection — xsd_choiceMinOccurs parity (AC6)')` block: required+unselected error, clears on selection alone before any field is filled, branch's own required fields still validate independently, single-branch degenerate case (AC8) still validates through the child. ~5 new `it`s. |
| `DynamicFormItemChoice.analytics.test.ts` | **new file** | Render-count / recompute-count assertions per the architecture's reactivity notes. ~7 `it`s (see Reactivity section below). |
| `DynamicFormItemChoice.test-helpers.ts` | **new file** | `findDynamicFormItemChoiceByPath`, `activeChoiceOccurrences(wrapper, path)`, `explicitlySelectedBranch(wrapper, path)`, `childValuesEntry(wrapper, path, branchKey)` — all reading `setupState()` the same way `DynamicFormItem.test-helpers.ts` already does for `DynamicFormItem`. Mirrors the existing helper, does not duplicate it. |
| `packages/core/src/examples/TestFormTemplate.vue` | extend (fixture) | `#default-choice` slot gains destructured `addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences` and renders one button per `fieldMetadata.choice` entry with `data-testid="${fieldMetadata.path}.${branchName}-add-choice-button"` / `-remove-choice-button"`, disabled when `!canAddChoiceOccurrence(branchName)`. This is required so tests drive the primitives through the actual public slot-prop contract (the same way `addItem`/`removeItem` are already tested through `#default-array`), not by reaching into internals. Purely additive to the slot signature; existing consumers of `#default-choice` (every other test in the suite) keep working unchanged. |

No changes needed to `packages/core/src/utils/removeNullValues.ts` or its existing test (`removeNullValues.test.ts`); AC10 imports and calls the existing export directly from the new logic-test block.

### Acceptance criteria → test mapping

1. **Auto mode unchanged.** Existing `DynamicFormItemChoice.logic.test.ts` / `.validation.test.ts` suites (all describe blocks already in the file) must stay green, unmodified, with `explicitChoiceSelection` absent from every existing fixture. New explicit test: mount the same "simple choice — two text inputs" metadata twice, once through today's code path and once with `explicitChoiceSelection: false` added, and assert `wrapper.html()` is identical. `DynamicFormItemChoice.logic.test.ts`.
2. Mount with `explicitChoiceSelection: true`, no `addChoiceOccurrence` call: assert zero `DynamicFormItem` children of the choice are mounted (`wrapper.findAllComponents({ name: 'DynamicFormItem' })` scoped under the choice returns none) and `activeChoiceOccurrences(wrapper, 'pick')` is `[]`. `DynamicFormItemChoice.logic.test.ts`.
3. Click the fixture's `pick.selfServe-add-choice-button`; assert the `selfServe` branch's input exists with no value, and `activeChoiceOccurrences(wrapper, 'pick')` equals `[{ branchKey: 'selfServe', index: 0 }]`. `DynamicFormItemChoice.logic.test.ts`.
4. Select `selfServe`, fill a field, then click `guidedRollout`'s add-choice button. Assert via `formValues(wrapper)` that `pick.selfServe` is present with `undefined` leaves (not the filled value), the `selfServe` input no longer exists in the DOM, the `guidedRollout` input exists, and `childValuesEntry(wrapper, 'pick', 'selfServe')` is `{ occurrences: 0, valuesCount: 0 }`. `DynamicFormItemChoice.logic.test.ts`.
5. Select a branch, click its remove-choice button: assert the branch's input is gone and `activeChoiceOccurrences` is `[]`. `DynamicFormItemChoice.logic.test.ts`.
6. Required explicit choice, submit with nothing selected → error visible (reuses the existing `${path}-error-message` pattern); call `addChoiceOccurrence` with no field filled in → error clears immediately (before `flushPromises` triggers any field input); the branch's own `minOccurs: 1` child, if present, still shows its own error independently. `DynamicFormItemChoice.validation.test.ts`.
7. `maxOccurs: 0` on the choice → `canAddChoiceOccurrence('anyBranch')` is `false` for every branch (assert via the fixture buttons being disabled, and directly via a captured reference if the template exposes it, e.g. through a `computedProps` capture like the existing `childFields` capture pattern). Enabled choice → `true`, asserted both before and after a branch is selected (switching must remain possible). `DynamicFormItemChoice.logic.test.ts`.
8. Single-branch choice with `explicitChoiceSelection: true`: nothing renders until `addChoiceOccurrence('only')` is called, then it mounts. Same metadata with the flag absent: existing "single child" describe block already asserts the fast path; add one assertion there confirming it still applies (regression). `DynamicFormItemChoice.logic.test.ts`.
9. Runtime: a raw metadata object with `explicitChoiceSelection: true` and a `computedProps` that sets `thisField.explicitChoiceSelection = false` (via an `as any` cast, since it will not typecheck) must not change the render mode: mount, assert the branch stays hidden until `addChoiceOccurrence`, exactly like AC2/AC3. Type-level: inside a `computedProps` callback with a correctly-typed `thisField` parameter (no cast), add a line `// @ts-expect-error explicitChoiceSelection is excluded from ComputedPropsFieldType` above `thisField.explicitChoiceSelection = true;`. This is checked by `vue-tsc` during `pnpm typecheck` / `pnpm ci`, which already gates every PR; no new type-testing library (e.g. `tsd`) is introduced since none exists in the repo today. `DynamicFormItemChoice.logic.test.ts`.
10. After the AC4 switch, read `formValues(wrapper).pick` and assert its exact shape (`{ selfServe: undefined, guidedRollout: { ... } }` or equivalent, not just `JSON.stringify` output), assert `activeChoiceOccurrences` and a resubmit of the required-choice validation are unaffected by the residual key, then call `removeNullValues(formValues(wrapper))` (imported directly) and assert `selfServe` is absent from the pruned result. `DynamicFormItemChoice.logic.test.ts`.
11. Two-item array (`projectContacts`, `maxOccurs: 2`), each item containing an independent `method` choice with `explicitChoiceSelection: true` (same metadata shape as the existing "multi-layer — group children each containing an inner choice field" fixture, reused). Call `addChoiceOccurrence` on contact 0's choice with `email`, then on contact 1's choice with `phone`. Assert `formValues(wrapper).projectContacts[0].method.email` exists and `[1].method.email` does not, and vice versa for `phone`; assert `activeChoiceOccurrences` differs per instance (found via `findDynamicFormItemChoiceByPath(wrapper, 'projectContacts[0].method')` vs `'projectContacts[1].method'`). `DynamicFormItemChoice.logic.test.ts`.

**Edge cases** (same file, same new describe block):
- Calling `addChoiceOccurrence('selfServe')` twice in a row: assert `activeChoiceOccurrences` unchanged between calls, the branch's `DynamicFormItem` render count (via the existing `renderCount()` analytics helper) does not increase, and no `setFieldValue(undefined)` clear fires (the branch's existing value, if any, is untouched).
- `addChoiceOccurrence('doesNotExist')` / `removeChoiceOccurrence('doesNotExist')` / `canAddChoiceOccurrence('doesNotExist')`: assert no throw, `activeChoiceOccurrences` unchanged, `canAddChoiceOccurrence` returns `false` for an unknown key.
- **ACCEPTED, DECIDED (research, 2026-09-10) — map the "loading saved data" edge case (finding 1).** Accepted on rung 1 of the post-approval ladder: the approved feature (decision 4, architecture "Where state lives") makes the guarantee binding, so the test is mandatory, not optional. Mount with `explicitChoiceSelection: true`, initial form values where `selfServe` already holds a value, and `addChoiceOccurrence` never called: assert the `selfServe` branch's `DynamicFormItem` is mounted anyway (the value-driven view merges into `activeChoiceOccurrences`, per feature decision 4 / architecture "Where state lives" line 217), and `activeChoiceOccurrences(wrapper, 'pick')` reports `selfServe` as active with `index: 0`. This pins the "loading saved data still reads as selected" guarantee the story lists as an edge case (functional edge cases, "Loading saved data...") but does not otherwise test. `DynamicFormItemChoice.logic.test.ts`.

### States policy (this slice)

Per the feature's states policy, applied to what ST-01 actually renders (no template/UX slice yet, ST-03 owns the dashed-prompt visual):

- **Empty / unselected**: AC2. Asserted as "no branch `DynamicFormItem` mounted", not the dashed-prompt visual (that markup is template-author code, out of scope until ST-03 consumes these primitives).
- **Selected / active**: AC3, AC11.
- **Disabled**: AC7 (`canAddChoiceOccurrence` false under `maxOccurs: 0`).
- **Loading**: explicitly N/A, per the feature's states policy ("selection is synchronous"); no test needed, noted here so its absence isn't mistaken for a gap.
- **Error**: AC6.
- **Field validation inside a branch (pristine / invalid / valid)**: inherited unchanged from existing per-field templates; not re-tested here, guarded by the existing `DynamicFormItem.validation.test.ts` suite which this story does not touch.

### Reactivity / `*.analytics.test.ts` plan

New `DynamicFormItemChoice.analytics.test.ts`, using `settings: { analytics: true }` (already the `TestForm` default) and the existing `renderCount()` helper (`data-testid="<path>-analytics-render-count"`) plus new `setupState`-based counters on the choice component itself:

1. Selecting a branch mounts its `DynamicFormItem` exactly once (`renderCount(wrapper, 'pick.selfServe') === 1`).
2. Switching branches: the deselected branch's render count does not increase again before it unmounts (no re-render-then-unmount), and the newly selected branch renders exactly once.
3. A sibling field outside the choice does not re-render when a branch is selected or switched (reuses the existing sibling-isolation pattern from `DynamicFormItem.analytics.test.ts`).
4. The choice's own `occurrences` computed (existing `_analytics_occurrencesCalculatedCount`, already present in the component) increases by exactly one per `addChoiceOccurrence`/`removeChoiceOccurrence` call, not a cascade of two or more, confirming the architecture's "keep the active-branch computation a single computed" requirement.
5. Idempotent re-selection of the same branch (edge case) causes zero additional renders and zero additional `occurrences` recomputes.

Note for the developer: if the implementation introduces a dedicated counter for the new active-branch computed (beyond the existing `_analytics_occurrencesCalculatedCount`), name it `_analytics_*` consistent with the component's existing convention so `DynamicFormItemChoice.test-helpers.ts` can read it via `setupState()` the same way `DynamicFormItem.test-helpers.ts` already does. If no new counter is added, test 4 above falls back to `_analytics_occurrencesCalculatedCount`, which already exists on the component today.

### Coverage

Every new branch in `DynamicFormItemChoice.vue` (the `explicitChoiceSelection` conditional render path, the `singleChild` bypass, the four exposed methods, the `effectiveValuesCount` fold, and the `setFieldValue(..., undefined)` clear-on-switch call) is exercised by the AC-mapped tests above; nothing in the modified files is knowingly left uncovered. The `ComputedPropsFieldType` `Omit` list change in `FieldMetadata.ts` is additive-only (one more excluded key) and has no runtime branch of its own to cover beyond the type-level check in AC9. The `DynamicFormTemplate.vue` `ChoiceAttributes` addition is type-only plus the existing `useAttrs()`/`camelize()` passthrough, already covered by every existing `addItem`/`canAddItems` test exercising that same mechanism; no new runtime code path is introduced there. Run `pnpm -r ci:test:coverage` after implementation and confirm no drop against the baseline; if it drops, the gap is almost certainly the `TestFormTemplate.vue` fixture edit (template code, typically excluded from coverage instrumentation the same way the rest of `examples/` already is) — verify the coverage config's include/exclude list before treating a drop there as a real regression.

### Time sensitivity

Not applicable. This story has no date/time-dependent logic; the full suite still runs under `TZ=Europe/Amsterdam` per the CI scripts, but no test in this plan asserts on wall-clock behaviour.

### Regression risk

- **`DynamicFormItemChoice.vue` auto-mode path** — must stay byte-for-byte identical (AC1). Guarded by the full pre-existing `DynamicFormItemChoice.logic.test.ts` and `.validation.test.ts` suites, which must remain green unmodified, plus the new explicit byte-identical assertion.
- **`DynamicFormItem.vue`** — unchanged per the architecture. Guarded by its own existing `.test.ts` / `.logic.test.ts` / `.validation.test.ts` / `.analytics.test.ts` suites, none of which this story touches.
- **`FieldMetadata.ts` / `ComputedPropsFieldType`** — the `Omit` list gains one entry. Regression risk: any existing test relying on `explicitChoiceSelection` being computable would break, but none exists yet since the property is new. Guarded by `pnpm typecheck` plus AC9's dedicated test.
- **`DynamicFormTemplate.vue`** — `ChoiceAttributes` is additive typing on top of the existing runtime passthrough. Guarded by every existing `addItem`/`removeItem`/`canAddItems` test across `DynamicFormItemArray.*` and `DynamicFormItemChoice.*`, which exercise the identical `useAttrs()`/`camelize()` mechanism.
- **`packages/core/src/examples/TestFormTemplate.vue`** — the single highest-risk touchpoint of this story's test work: it is the shared fixture behind nearly every test in `DynamicFormItem*`, `DynamicFormItemArray*`, `DynamicFormItemChoice*`, and `DynamicForm.test.ts`. The `#default-choice` slot edit must be strictly additive (new destructured props and new conditionally-rendered buttons only; no change to existing markup, classes, or `data-testid`s), so the entire existing suite stays green untouched. Run the full `DynamicFormItemChoice.*`, `DynamicFormItemArray.*`, and `DynamicFormItem.*` suites (not just the new tests) after this fixture edit, before relying on any new test passing as a positive signal.
- **Other stories of this feature**: ST-02 builds its per-branch `useFieldArrayExtended` wiring directly on top of ST-01's ephemeral-state model and the `ChoiceAttributes` type introduced here; ST-03/ST-04 (docs) consume the same four primitives through the real `ChoiceSectionCard.vue`, not the `TestFormTemplate.vue` fixture, so they are not blocked by fixture changes here but do depend on the primitives' exact signatures staying stable. ST-05 (preserve-on-switch) extends the exact clear-on-switch mechanism AC10 pins (`setFieldValue(branchPath, undefined, false)` and the resulting residue shape); if AC10's pinned shape changes later, ST-05's stash/restore contract must be revisited.

### Manual verification checklist

None required to validate the functional behaviour of this story: it is engine-only (no template/docs changes; those are ST-03/ST-04), and every acceptance criterion and edge case is exercised through the `TestForm`/`TestFormTemplate` component-test harness with `@vue/test-utils`, not a live browser page. One development-time sanity check (not part of the automated suite, not gating): temporarily remove the new `ComputedPropsFieldType` Omit entry once during implementation and confirm `pnpm typecheck` now fails on the AC9 `@ts-expect-error` line (i.e. the negative case actually fires), then restore it. This confirms the type-level check in AC9 is a real assertion and not silently accepted by TypeScript for an unrelated reason.

### Flags for reviewer

- AC9's type-level check technique (inline `@ts-expect-error`, checked via the existing `vue-tsc`/`pnpm typecheck` step) is a QA-plan proposal, not something the story spec prescribed; the repo has no `tsd`/`expectTypeOf`-style type-testing harness today, and introducing one felt disproportionate for a single assignability check. Flagging for adversarial review to confirm this is an acceptable substitute for a dedicated type-testing tool.
- No acceptance criterion required a rewrite; all eleven are testable as written given the codebase's existing precedent for reaching into component internals via `setupState()` for assertions (already used throughout `DynamicFormItemChoice.logic.test.ts` today, e.g. `normalizedPath`, `childFields`).

## Adversarial review

Ran in STORY (lite) mode on 2026-09-10, blockers-first, against the installed code (`DynamicFormItemChoice.vue`, `FieldMetadata.ts`, `DynamicFormItem.test-helpers.ts`, `packages/core/tsconfig.json`, `packages/core/package.json`). Checked every acceptance criterion for a test mapping, every DECIDED entry for a silent local override, and the dependency declaration. No blocker found; the story is consistent with the approved feature design and every binding DECIDED entry (findings 2, 4, 5, ADR-3 option (a), decision 6), and correctly defers `maxOccurs > 1`, parity, reactive-path, and the `*-choice-item` slot to ST-02.

**Ruling on the QA planner's flagged proposal (inline `@ts-expect-error` for AC9, checked by `vue-tsc` instead of a type-testing dependency): ACCEPTED.** Verified: `packages/core/tsconfig.json` includes `src/**/*`, and the ST-01 test files live under `src/components/__tests__/*.test.ts`, so `pnpm typecheck` / `pnpm ci` (`vue-tsc --noEmit`) genuinely type-checks them. `@ts-expect-error` is a two-way assertion under `vue-tsc`: an unused directive raises TS2578, so the line fails if `explicitChoiceSelection` ever becomes assignable again, and the manual-verification step (remove the `Omit` entry, confirm typecheck fails on that line) confirms the negative actually fires. Adding `tsd`/`expectTypeOf` for a single assignability check would be disproportionate and introduces a dependency the repo does not have. The technique is sound as written.

**Findings:**

1. **[should-fix] The "loading saved data" edge case is in ST-01 scope but unmapped in the QA plan.** The story lists three functional edge cases (Functional > Edge cases), but the test mapping's Edge-cases block maps only the idempotent double-add and the unknown-`branchKey` no-op. The "Loading saved data where a branch already has a value... the branch still renders" case is left untested, even though it pins feature decision 4's "loading saved data still reads as selected" guarantee (architecture "Where state lives", line 217: `activeChoiceOccurrences` merges the value-driven view with the explicit view). Without a test, a regression that makes explicit mode ignore preloaded values would ship silently. Suggested resolution: add the mapping. Routed as a PROPOSED edit in the QA plan's Edge-cases test-mapping block. RESOLVED: DECIDED (research, 2026-09-10), proposal accepted, mapping is mandatory (see QA plan).

2. **[nit] AC4 and AC10 describe the post-switch residue shape with different wording.** AC4's mapping says `pick.selfServe` is "present with `undefined` leaves"; AC10 gives the concrete `launchApproach: { selfServe: undefined }` (the branch key itself `undefined`, not an object of `undefined`-valued leaves). Since `setFieldValue(branchPath, undefined, false)` on the branch path sets the whole branch to `undefined`, AC10's concrete shape is the accurate one. Both ACs demand an exact-shape assertion, so this is only a wording ambiguity, but the developer should assert AC10's shape in both places rather than two subtly different shapes.

3. **[nit] The validation-file description "single-branch degenerate case (AC8) still validates through the child" reads against the AC8 bypass.** AC8 (DECIDED finding 5) has the single-branch explicit choice bypass the `singleChild` fast path, so pre-selection validation is at the choice level (`xsd_choiceMinOccurs`, since `combinedValidation` no longer early-returns for `singleChild` when explicit), not "through the child". The phrase is only accurate for the post-selection state. Clarify the wording so the test author asserts the choice-level required error before selection and the child's own validation after.

## Implementation notes

Implemented as specified: `explicitChoiceSelection` flag on `FieldMetadata` (excluded from `ComputedPropsFieldType`), `explicitlySelectedBranch` ref, the four primitives (`addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`), `effectiveValuesCount` fold into `xsd_choiceMinOccurs`, `singleChild` bypass, clear-on-switch via `useFormContext().setFieldValue(branchPath, undefined, false)`, and the `ChoiceAttributes`/`ChoiceOccurrence` types on `DynamicFormTemplate.vue`. All 11 acceptance criteria and every listed edge case are covered by tests.

Deviations from the story's file list, recorded here per CLAUDE.md (none affect the public API contract or the approved feature design):

1. **`DynamicFormItem.vue` needed a one-line change (not in the story's or feature's file list).** `computedField` now also restores `explicitChoiceSelection` to `field.value?.explicitChoiceSelection` after running `computedProps`, mirroring the existing `path` restoration right next to it. Reason: `DynamicFormItemChoice` receives `computedField` (already computedProps-processed) as its `fieldMetadata`, and `computedField` is evaluated once per render *before* `DynamicFormItemChoice`'s own setup runs. A component-local "capture once at setup" inside `DynamicFormItemChoice` alone only protects against a `computedProps` mutation appearing *after* the first render, not one present on the very first evaluation — which is exactly what AC9's runtime test (a `computedProps` unconditionally setting `explicitChoiceSelection` via an `as any` cast) exercises. Flagged as an amendment in the feature spec's architecture section (`DynamicFormItem.vue` bullet) since the feature spec called this file "unchanged"; the delegation contract and `pathOverride` forwarding (decision 6) that bullet is actually about are unaffected, and the full `DynamicFormItem.*` test suite stays green.
2. **`activeChoiceOccurrences`'s value-driven check uses `useFieldValue()` per branch instead of solely `childValues`.** The architecture describes `activeChoiceOccurrences` merging the value-driven view with the explicit view, and `childValues` is the existing value-driven mechanism, but it is only ever updated by a branch's own mounted `DynamicFormItem`. In explicit mode, only *active* branches are mounted, so a branch with pre-loaded data (the "loading saved data" edge case) could never self-report through `childValues` before it is ever considered active — a chicken-and-egg gap. Resolved by reading each branch's current value directly via vee-validate's public `useFieldValue(() => branchPath)` (a getter, so it keeps tracking the right path if `pathOverride` changes reactively per decision 6), independent of whether that branch is mounted. `childValues` is untouched and still drives the auto-mode occurrence/budget math.
3. **`effectiveValuesCount` and `addChoiceOccurrence` were each simplified by one branch to close an artificial coverage gap**, not a behaviour change: `effectiveValuesCount`'s two `!explicitChoiceSelection` / `maxOccurs > 1` cases returned the identical `valuesCount.value` fallback, so they were merged into one condition; `addChoiceOccurrence`'s redundant `branchIndexOf(branchKey) < 0` check was removed since `canAddChoiceOccurrence` (called immediately above it) already covers unknown branch keys.

`pnpm -r ci:test:coverage`: baseline (pre-story) "All files" was 96.30% stmts / 92.05% branch / 93.44% funcs / 96.30% lines. After this story: 96.58% / 92.10% / 94.36% / 96.58% — no metric dropped.

## Verification report

### Pipeline checks

Note: `pnpm ci` / `pnpm -r ci` is shadowed by pnpm 11.4.0's built-in `ci` command in this checkout (it reinstalls `node_modules` instead of running the repo's script); `pnpm -r run ci` and `pnpm -r run ci:test:coverage` were used instead, per the environment note for this task. `node_modules` and `packages/core/dist` were already present and were not reinstalled.

- `pnpm -r run ci` (test + lint + typecheck): **green**. `packages/core`: 460/460 tests passed across 21 files, lint clean, `vue-tsc --noEmit` clean. `packages/element-plus`: 1/1 test passed, lint clean, typecheck clean. Confirms the developer's reported 460 (up from the 432 baseline; +28 new tests: 20ish in `.logic.test.ts`, ~7 in the new `.validation.test.ts` block, 5 in the new `.analytics.test.ts` file, minus overlap with the QA plan's own estimate — the actual counts are 55 logic / 31 validation / 5 analytics tests in the touched files).
- `pnpm -r run ci:test:coverage`: **green, no drop**. Core "All files": 96.58% stmts / 92.10% branch / 94.36% funcs / 96.58% lines, exactly matching the developer's reported numbers and up from the stated baseline (96.30% / 92.05% / 93.44% / 96.30%). `DynamicFormItemChoice.vue` itself: 100% stmts/funcs/lines, 89.23% branch (uncovered lines are early-return guards, e.g. no-op branches for unknown keys already exercised by the edge-case tests — not a coverage gap of concern). `packages/element-plus` coverage unaffected (0% on its own untested component, pre-existing, unrelated to this story).
- `docs/` was not touched by this story, so `pnpm docs:build` was not required and was not run.
- Sanity-checked the AC9 type guard directly: temporarily removed the `explicitChoiceSelection` entry from the `ComputedPropsFieldType` `Omit` list, confirmed the change would flip the `@ts-expect-error` directive from suppressing a real error to being unused (which `vue-tsc` treats as TS2578, a hard type error), then restored the file to its original diff (`git diff --stat` confirms the restored file matches the pre-check diff exactly: 15 insertions) and re-ran `pnpm -r run ci` to confirm it is green again. This independently confirms the manual-verification step the QA plan describes is a real, firing assertion and not silently accepted.

### Acceptance criteria

| AC | Description | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Auto mode unchanged (regression baseline) | Pass | `DynamicFormItemChoice.logic.test.ts` "(AC1) renders byte-identical html whether explicitChoiceSelection is absent or explicitly false"; entire pre-existing `DynamicFormItemChoice.logic.test.ts`/`.validation.test.ts` suites (auto-mode describes 1-8) untouched and green. |
| 2 | Explicit mode, nothing selected, renders no branch | Pass | `DynamicFormItemChoice.logic.test.ts` "(AC2) renders no branch and activeChoiceOccurrences is empty when nothing is selected": asserts 0 mounted `DynamicFormItem` children and `activeChoiceOccurrences` `[]`. |
| 3 | `addChoiceOccurrence(branchKey)` selects a branch immediately | Pass | "(AC3) addChoiceOccurrence selects a branch immediately with no value required": branch input exists with empty value, `activeChoiceOccurrences` = `[{branchKey:'selfServe', index:0}]`. |
| 4 | Switching branches clears deselected branch, mounts new one | Pass | "(AC4) switching branches clears the deselected branch and mounts the new one": `formValues(wrapper).pick` equals `{selfServe: undefined, guidedRollout: undefined}`, DOM input gone/mounted, `childValuesEntry` reset to `{occurrences:0, valuesCount:0}`. Implementation: `clearBranch()` calls `formContext.setFieldValue(branchPath, undefined, false)` resolved via `overridePath`, matches architecture exactly. |
| 5 | `removeChoiceOccurrence(branchKey)` deselects | Pass | "(AC5) removeChoiceOccurrence deselects the active branch": branch unmounts, `activeChoiceOccurrences` back to `[]`. |
| 6 | `xsd_choiceMinOccurs` clears on selection alone (parity) | Pass | `DynamicFormItemChoice.validation.test.ts` "explicit selection — xsd_choiceMinOccurs parity (AC6)" block: error shown when nothing selected, clears the instant a branch is added with no field filled, reappears on switch-away, and the branch's own required field still validates independently (`pick.guidedRollout.contactEmail-error-message` shown while `pick-error-message` is not). `effectiveValuesCount = max(valuesCount, explicitlySelectedBranch ? 1 : 0)` in the source matches the architecture's formula. |
| 7 | `canAddChoiceOccurrence(branchKey)` reflects disabled state | Pass | "(AC7) canAddChoiceOccurrence is false for every branch when the choice is disabled" (maxOccurs:0) and the companion "...is true for an enabled choice, before and after a selection". |
| 8 | Single-branch choice bypasses `singleChild` fast path when explicit | Pass | "(AC8) single-branch choice bypasses the singleChild fast path when explicit": nothing renders pre-selection, mounts after `addChoiceOccurrence`; regression case confirms the fast path is unchanged when the flag is absent. Validation-side companion in `.validation.test.ts` "explicit selection — single-branch degenerate case (AC8)" asserts the choice-level required error pre-selection and the child's own error post-selection, resolving nit 3 from the story's own adversarial review. |
| 9 | `explicitChoiceSelection` is static metadata, not computed | Pass | Runtime test: a `computedProps` mutation via `as any` cast has no effect on render mode. Type-level: `// @ts-expect-error` line checked by `vue-tsc` during `pnpm typecheck`/`pnpm ci`, confirmed to genuinely fire (see pipeline section above, manual restore-and-recheck). `FieldMetadata.ts`'s `ComputedPropsFieldType` Omit list gained `explicitChoiceSelection`, and `DynamicFormItem.vue`'s `computedField` restores it post-`computedProps`, mirroring the existing `path` restore. |
| 10 | Clear-on-switch residue matches accepted contract (ADR-3 option a) | Pass | "(AC10) post-switch residue matches the accepted contract, and removeNullValues prunes it": exact shape assertion `values.pick` = `{selfServe: undefined, guidedRollout: 'world'}` (not just serialised JSON), residue does not trip `xsd_choiceMinOccurs` on submit, `removeNullValues(values).pick` = `{guidedRollout: 'world'}` with `selfServe` absent. Resolves nit 2 from the story's adversarial review (AC4/AC10 wording) by asserting the concrete shape in both AC4's and AC10's tests. |
| 11 | Choice inside an array occurrence, maxOccurs:1 | Pass | "(AC11) choice inside an array occurrence (maxOccurs:1)": two `projectContacts` items each with an independent `method` choice; contact 0 selects `email`, contact 1 selects `phone`; DOM and `activeChoiceOccurrences` assertions confirm no cross-contamination between `projectContacts[0].method` and `projectContacts[1].method`. `clearBranch`/`addChoiceOccurrence` resolve `branchPath` via `overridePath(branchChild.path, props.pathOverride)`, matching decision 6. |

Edge cases (Functional > Edge cases): all three covered — idempotent double-`addChoiceOccurrence` (no duplicate mount, unchanged `activeChoiceOccurrences`), unknown-`branchKey` no-op for all three primitives (no throw), and the "loading saved data" case (branch with a pre-existing value renders and reports active even though `addChoiceOccurrence` was never called) — the last one was flagged as originally unmapped in the story's own adversarial review (finding 1) and is present here as its own `it` block, confirming the resolution was carried through. Two additional edge-case tests beyond the QA plan (`removeChoiceOccurrence` no-op on an inactive-but-existing branch; `addChoiceOccurrence` not crashing when the previously selected branch is removed from a replaced metadata array) were added by the developer; both are reasonable extra defensive coverage and not scope creep since they test the same four primitives.

### Prototype / design comparison

This story is engine-only (no template/slot consumer changes; ST-03 wires the real `ChoiceSectionCard.vue`), and its own QA plan correctly states no manual/visual verification is required, since every behaviour is exercised through the `TestForm`/`TestFormTemplate` harness rather than a live page. Compared the implemented behaviour against the story's design-reference anchors (`#single-unselected`, `#single-selected`, `#single-selected-guided`, `#single-switch`, `#single-error`, and the `maxOccurs:1` half of `#choice-in-array`) at the behavioural level (states policy), not pixel level:

- `#single-unselected`: prototype shows the dashed empty prompt with no branch fields and calls out `activeChoiceOccurrences` is empty — matches AC2 exactly (rendering the actual dashed markup is ST-03's job; the engine-level precondition is what this story owns and it is correct).
- `#single-selected`: prototype annotates "clicking a card calls `addChoiceOccurrence('selfServe')`... counts as active even with both fields empty" — matches AC3/AC6.
- `#single-switch`: prototype's before/after annotates that switching clears the previous branch's values via the engine (not `computedProps` fakery) — matches AC4/AC10's asserted behaviour and residue contract.
- `#single-error` and `#single-selected-guided`'s validation-state notes are respectively covered by AC6 (choice-level error) and the explicit statement that field-level validation states are inherited unchanged (not retested here, correctly deferred to the existing `DynamicFormItem.validation.test.ts` suite per the story's own States policy section).
- `#choice-in-array` (maxOccurs:1 half): matches AC11's two-contact, independent-`pathOverride` test.

No visual drift to flag against sibling stories, since no template/CSS surface changed in this story (the `TestFormTemplate.vue` fixture edit is test harness only, additive buttons with no styling, not user-facing).

### Process compliance

- `specs/components.md`: **updated**. `DynamicFormItemChoice` row describes the new explicit-selection behaviour and correctly notes `maxOccurs > 1` is not yet implemented; `DynamicFormTemplate` row documents the `ChoiceAttributes` slot props; a new paragraph documents `FieldMetadata.explicitChoiceSelection` and its exclusion from `ComputedPropsFieldType`; `ChoiceOccurrence`/`ChoiceAttributes` are noted as declared in `DynamicFormTemplate.vue`, not yet re-exported from `index.ts`. Matches the actual code changes.
- Changeset: **present**, `.changeset/curly-onions-explicit-choice.md`, bump type `minor`, matching the feature architecture's semver analysis (additive flag + additive slot props, no export removed/renamed, no signature changes).
- Library API rules: all new identifiers (`explicitChoiceSelection`, `addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`, `ChoiceOccurrence`, `ChoiceAttributes`, `branchKey`, `index`) are camelCase. No new export added to `index.ts` (verified: `index.ts` untouched), consistent with architecture item 5 ("Exports — unchanged"). The new slot props ride through the existing `useAttrs()` + `camelize()` passthrough mechanism, an established channel, not a new one.
- Test naming: `DynamicFormItemChoice.logic.test.ts` / `.validation.test.ts` (extended) and `.analytics.test.ts` (new) follow the repo's suffix convention; `DynamicFormItemChoice.test-helpers.ts` mirrors the existing `DynamicFormItem.test-helpers.ts` non-test helper convention.
- Regression risk: confirmed no other test file in `packages/core/src/components/__tests__/` was modified besides the two ST-01 files (`git diff --stat` on the tests directory shows only `DynamicFormItemChoice.logic.test.ts` and `DynamicFormItemChoice.validation.test.ts` as modified, plus the two new files) — the story's own flagged highest-risk touchpoint (`TestFormTemplate.vue`'s shared fixture) stayed additive-only and the full suite, including every `DynamicFormItem*`/`DynamicFormItemArray*` test that depends on that fixture, is green.
- Deviations: three deviations are recorded in this story's Implementation notes section (the `DynamicFormItem.vue` one-line `computedField` restore; `activeChoiceOccurrences` reading `useFieldValue()` per branch instead of solely `childValues`; two minor simplifications to close an artificial coverage gap). None of them are silent: the first is additionally flagged as an explicit, clearly-labelled "IMPLEMENTATION NOTE (ST-01, flagged amendment, not yet reviewed by Jeroen)" inline in the feature spec's architecture section (which had called `DynamicFormItem.vue` "unchanged"), correctly routing the amendment to Jeroen rather than silently overriding the approved feature design, per CLAUDE.md and hard rule 4. The other two are documented rationale for implementation-detail choices within the bounds of the approved architecture and do not change the public contract. Verified the reasoning for the first deviation is sound: `computedField` is built once per render before `DynamicFormItemChoice`'s own setup runs, so a component-local capture-once could not protect against a mutation present on the very first evaluation, which is exactly what AC9's runtime test exercises.
- No `Storybook`/`playgrounds/storybook` changes were made or needed; correct, this story is engine-only.

### Verdict: **pass**

All 11 acceptance criteria and every listed edge case are met with concrete, verifiable test evidence. The full pipeline (`pnpm -r run ci`) is green (460 core tests, clean lint, clean typecheck), coverage improved against baseline with no metric dropping (96.58%/92.10%/94.36%/96.58% vs. 96.30%/92.05%/93.44%/96.30%), `specs/components.md` and the changeset are both correctly updated, the library API rules are followed, and the one file-list deviation that touches the feature's stated architecture is properly flagged for Jeroen rather than silently applied. No visual/UI surface changed in this story, so no screenshots were required; the prototype comparison at the behavioural level for this story's anchors matches.
