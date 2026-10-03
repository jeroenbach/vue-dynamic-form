---
id: ST-05
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Repeatable fields render as Element Plus array sections

## Assumed without Jeroen (no clear winner)

Ties broken by policy during story prep, not decided on the merits. Each names its alternative inline.

- Button text → plain English strings, no labels mechanism (reversible: additive follow-up)


## Functional
### User story
As an end user filling in a form with a repeatable field (`maxOccurs > 1`), I want a styled section with one card per entry and clear add and remove buttons that respect the minimum and maximum, so that I can manage a list of entries without a bare unstyled form.

As a template author, I want `default-array` and `default-array-item` (and the per-type variants) to be overridable with the built-in rendering as fallback, so that I can restyle only the list chrome.

### Acceptance criteria

Each criterion is verifiable by a Vitest component test (mounting inside `DynamicForm` with `maxOccurs > 1` metadata) unless marked manual.

1. **`default-array` renders a section with the array's items.**
   Given a `text` field with `maxOccurs: 3` and two initial values, rendered through `ElementPlusFormTemplate`,
   When it renders,
   Then a section is shown (label as the section title via the field's `label`), the items are rendered inside it via the `input` slot fallback chain (`<slot name="input"><slot /></slot>`), and the section is an Element Plus container (`ElCard` or equivalent EP primitive).

2. **`default-array-item` renders one card per item with a remove button.**
   Given the same field,
   When it renders,
   Then each item appears in its own `ElCard` (or EP primitive) containing the input, and a remove `ElButton` calling `removeItem`.

3. **Add button respects `canAddItems`.**
   Given an array at `maxOccurs` items,
   When it renders,
   Then the add button is disabled (or absent) and clicking it does not add an item; below `maxOccurs` the add button is enabled and clicking it calls `addItem`, increasing the item count by one.

   PROPOSED (adversarial review): pin the "(or absent)" ambiguity here, in AC4 and in AC9. A test cannot assert against two alternative behaviours. Resolution: add and remove buttons are always rendered and carry the native `disabled` attribute when the action is unavailable (never conditionally removed from the DOM). This is the QA plan's finding 2; all mapped tests already assume it.

4. **Remove button respects `canRemoveItems`.**
   Given an array at `minOccurs` items,
   When it renders,
   Then the remove buttons are disabled (or absent) and do not remove; above `minOccurs` clicking removes exactly the clicked item (value of other items preserved).

   PROPOSED (adversarial review): as written this is verified false against the engine. `DynamicFormItem._canRemoveItems` returns `true` for any array item that holds a value even at `minOccurs`, and `_removeItem` then clears that item's value rather than removing the card (`DynamicFormItem.vue` lines 279-285, 195-205). Rewrite: "Given an array at `minOccurs`, an empty item's remove button is disabled; an item with a value keeps an enabled remove button whose click clears that item's value and keeps the card count; above `minOccurs`, clicking remove deletes exactly the clicked item and preserves the other items' values." This matches the QA plan's finding 1 and the tests already mapped to it.

5. **Both slots are overridable, with the built-in fallback.**
   Given a wrapper overriding only `#default-array-item`,
   When an array renders,
   Then the section chrome is the built-in one and each item uses the consumer's markup; and given a wrapper overriding only `#default-array`, the section uses the consumer's markup and items still render via the consumer's `<slot v-bind="s" />`.

6. **Per-type variants win over the defaults and are forwarded.**
   Given a wrapper supplying `#text-array-item` (not enumerated by the template),
   When a `text` array renders,
   Then the consumer's markup renders for the items (proving the generic forward covers array slots) while a `number` array still uses the built-in item card.

7. **Repeatable-choice occurrences fall through to the array-item card.**
   Given a repeatable explicit choice and no `-choice-array-item` fallback yet defined (the choice story adds one),
   When an occurrence renders,
   Then the dispatcher resolves to the array-item family (core behaviour) and shows the card without error. This documents the interaction; the choice story later supplies a dedicated fallback.

8. **Array of groups.**
   Given an array whose item is a group with children (`children` non-empty, `maxOccurs > 1`),
   When it renders,
   Then each occurrence shows one card containing the group's children, and adding/removing occurrences works.

9. **Disabled arrays.**
   Given an array field with `disabled: true`,
   When it renders,
   Then add and remove controls are disabled.

   PROPOSED (adversarial review): AC9 as written covers only the extended `disabled: true` property and misses the other disabling source. Two distinct things disable an array: `maxOccurs: 0` (surfaced as the engine `disabled` slot prop, `DynamicFormItemArray.vue` line 86) and the extended `disabled: true` property (on `fieldMetadata.disabled`, combined as `field.disabled || disabled` in the existing input fallbacks). Rewrite: "Given an array disabled by either `maxOccurs: 0` or `disabled: true`, both the add button and every remove button are disabled, including the remove button of an item that holds a value (which the core engine reports as removable via `DynamicFormItem._canRemoveItems`). Both variants are tested." This matches the QA plan's finding 4. Note for the implementer: the extended `disabled: true` does not flow through the engine `disabled` slot prop at the item level (each item's `maxOccursOverride` is 1 for a non-`maxOccurs:0` array), so the template must read `fieldMetadata.disabled` itself to disable a valued item's remove button.

12. **PROPOSED (adversarial review): array-level error is shown on the section.**
    Given an array under its `minOccurs` (`autoAddMinOccurs: false` so it can stay below), when the host validates, the section shows the array's `fieldContext.errorMessage` (available via `LimitedFieldContext`, `DynamicFormTemplate.vue` line 102); it disappears once `minOccurs` is satisfied. Neither the feature nor this story currently specifies array error display; leaving it unspecified ships a form where a failing array shows no message.

13. **PROPOSED (adversarial review): an item's own validation error is shown inside its card.**
    Because array items dispatch to `-array-item` and never to `default` (`DynamicFormItem.vue` line 529), they do not receive an `ElFormItem` for free, so an item's `fieldContext.errorMessage` (full `FieldContext`) is otherwise invisible. Given a per-item restriction (e.g. `minLength`), an invalid item shows its error inside its own card and valid siblings show none. Also specify whether the section title carries a required marker from `required` (`minOccurs >= 1`): PROPOSED show it, to match how the other field types render, so Jeroen can accept or reject just the marker. This matches the QA plan's finding 7. These proposals refine the feature's "feed errorMessage into ElFormItem where useful" note for the array shape (which the feature leaves unspecified); they do not contradict it, so no feature amendment is required.

10. **Plain CSS only.**
    Given the new markup,
    When reviewed,
    Then spacing between cards and the section header row are done with Element Plus primitives or scoped CSS added to the package stylesheet, with no Tailwind classes (the CSS story's source-scan test stays green).

11. **Code hygiene.**
    Given all new source and test files,
    When reviewed,
    Then no comment or test name references specs or process artifacts (FEAT, ST, AC, ADR, finding numbers), there are no em dashes, add/remove button labels are plain strings or come from a consumer-overridable mechanism (see Open points), and `ci:test`, `ci:lint`, `ci:typecheck` pass for `packages/element-plus`.

### Edge cases
- `minOccurs: 0` and an empty array: section shows only the add button (and the title). PROPOSED (adversarial review): state `autoAddMinOccurs: false` explicitly here. Without it the engine's `watchEffect` (`DynamicFormItemArray.vue` lines 174-184) re-adds a placeholder item whenever `length < 1`, so a truly empty array is unreachable and this edge case cannot be tested. QA plan finding 5.
- `maxOccurs: 'unbounded'` (if the engine supports it): add is never disabled by the limit. PROPOSED (adversarial review): drop this. `maxOccurs` is typed `number` (`FieldMetadata.ts:21`) and the engine has no `'unbounded'` handling anywhere in `packages/core/src`, so the case is untestable as written. Replace with "a very large finite `maxOccurs` (e.g. `1000`) never disables add." QA plan finding 6.
- Removing the last remaining item when `minOccurs` is 0 leaves an empty section, not a broken layout. PROPOSED (adversarial review): also requires `autoAddMinOccurs: false`, else the engine immediately re-adds a placeholder; state it. QA plan finding 5.
- Item index labels: each card may show its one-based position; if shown, it renumbers after a removal.

### Open points
- ASSUMED (story prep): built-in button text ("Add", "Remove") is plain English strings in this version, overridable by overriding the slot; no labels mechanism.
  Why: no clear winner. The feature spec defines no labels or i18n mechanism, the only precedent in this package is the hard-coded "Click to upload", and the core settings `messages` mechanism covers validation messages only.
  Tie broken on: smallest scope (no new setting, prop, or export).
  Alternative: a settings-driven labels mechanism. Adding it later is additive and non-breaking, so reversing costs a follow-up feature, not a breaking change.

### Out of scope
- Choice and wizard chrome.
- A drag-to-reorder affordance.
- Pagination or collapse of long arrays.
- `packages/core` is untouched; the package stays `private: true`, so no changeset.

## Design reference
No prototype. Structure follows the feature's "Choice / array" notes and the docs site's array section card pattern, rebuilt in Element Plus (`ElCard`, `ElButton`). Exact spacing and titles are the developer's call within Element Plus defaults.

## Architecture reference
Implements seam 2 (array half): `default-array` and `default-array-item` fallbacks in `ElementPlusFormTemplate.vue` (optionally as an internal, non-exported presentational sub-component), following the slot-forwarding contract. Slot scope: `ArrayChoiceAttributes` (`canAddItems`, `addItem`, `fieldContext`) for the section; `ItemAttributes` (`index`, `canRemoveItems`, `removeItem`) for an item.

Depends on ST-02 (forwarding contract) and ST-04 (stylesheet build and export). Independent of ST-07 (wizard). ST-06 (choice) builds on this story (occurrence cards reuse the array-item conventions).

## QA plan
Filled by qa-planner. Test plan mapped to the project's testing strategy: which behavior gets `*.test.ts`, `*.logic.test.ts`, `*.validation.test.ts`, or `*.analytics.test.ts` coverage, fixtures to use, regression risks, manual verification steps.

### Facts about the core engine that shape the plan

Read from `packages/core`, so the tests assert what the engine really hands the template, not what the acceptance criteria assume.

- Every array is rendered twice over: `DynamicFormItemArray` calls the template once with `type: "<type>-array"` (slot scope `canAddItems`, `addItem`, `fieldContext` with `value`/`errors`/`errorMessage`/`label`, `disabled`, `required`), and its default slot holds one `DynamicFormItem` per entry. Each entry calls the template with `type: "<type>-array-item"` (scope `index`, `canRemoveItems`, `removeItem`, `fieldContext`). Array items dispatch to `default-array-item`, never to `default`, so they do not get the `ElFormItem` (label, required marker, error text) for free.
- `DynamicFormItemArray._canRemoveItems` is `length > minOccurs && length > 1`, unless `autoAddMinOccurs === false` (then `length > 0`). `DynamicFormItem._canRemoveItems` then overrides it to `true` for any array item that has a value. `_removeItem` when removal is not allowed does not remove: it clears that item's value (`replace(..., null)`). So at `minOccurs` an item with a value still has an enabled remove button, and clicking it empties the item but keeps the card.
- `_addItem` has no `canAddItems` guard. The only thing that stops an add at `maxOccurs` is the template not offering a live button. The disabled add button is therefore load-bearing and must be tested as inert, not just as styled.
- `watchEffect` in `DynamicFormItemArray` auto-adds an empty item whenever `length < 1` or `length < minOccurs`, unless `autoAddMinOccurs === false`. A truly empty array only exists with `autoAddMinOccurs: false`.
- `disabled` in slot scope is `maxOccurs === 0`. The Element Plus `disabled` extended property lives on `fieldMetadata.disabled`; existing fallbacks combine both (`field.disabled || disabled`).
- `maxOccurs` is typed `number`. The engine has no `'unbounded'` handling anywhere in `packages/core/src`.
- The default `type` of a node without one is `'text'`, so an array of groups dispatches as `text-array` / `text-array-item`. Children of a group item render as ordinary single-occurrence `text` fields through `default`.
- The package SFC imports Element Plus components as types only; the Storybook preview installs the plugin globally. Mounted tests must install the Element Plus plugin (`global: { plugins: [ElementPlus] }`) or no `El*` tag resolves.

### Findings against the acceptance criteria (proposed rewrites, not silently accepted)

1. **AC4 contradicts core behavior (should-fix).** As written ("at `minOccurs` the remove buttons are disabled and do not remove") it is false for any item that holds a value. Proposed rewrite: "Given an array at `minOccurs`, an empty item's remove button is disabled; an item with a value keeps an enabled remove button whose click clears that item's value and keeps the card count; above `minOccurs`, clicking remove deletes exactly the clicked item and preserves the other items' values." The test plan below tests the rewritten form.
2. **"disabled (or absent)" in AC3, AC4, AC9 is not assertable (should-fix).** A test cannot be written against two behaviors. Proposed pin: add and remove buttons are always rendered and carry the native `disabled` attribute when the action is unavailable. All tests below assert that.
3. **AC1/AC2 "`ElCard` or equivalent EP primitive" (nit).** Pin `ElCard` for both the section and the item (the architecture names it). Tests use `findAllComponents(ElCard)` plus test ids to tell the section card from item cards (a section card containing N item cards gives N + 1 `ElCard`s).
4. **AC9 "`disabled: true`" is ambiguous (should-fix).** Two different things disable an array: `maxOccurs: 0` (engine `disabled` slot prop) and the extended `disabled: true` property. Proposed rewrite: both disable the add button and every remove button, including the remove button of an item that has a value (which core reports as removable). Both variants are tested.
5. **Empty-array edge cases need `autoAddMinOccurs: false` (should-fix).** Without it the engine re-adds an item immediately, so "`minOccurs: 0` and an empty array shows only the add button" and "removing the last item leaves an empty section" are unreachable. Proposed: state the flag in both edge cases. Tests use it.
6. **`maxOccurs: 'unbounded'` edge case is untestable as written.** The engine does not support it. Proposed: drop it, or replace with "a very large finite `maxOccurs` never disables add" (tested with `maxOccurs: 1000`). The plan tests the replacement and flags the original as untestable.
7. **Error state is unspecified (should-fix).** No criterion says where the array-level `minOccurs` error (`fieldContext.errorMessage` on the section) or an item's own validation error is shown. Because array items skip `default`, an item's error is otherwise invisible. Proposed new criteria: (12) the section shows the array's `errorMessage` when present; (13) an item card shows its `fieldContext.errorMessage`. Also unspecified: whether the section title shows a required marker from `required`. Proposed: show it, so the array matches the other fields. Tests in the validation file are written for these proposals and must be dropped or adjusted if Jeroen decides otherwise.
8. **Test hooks are a new markup surface (nit).** jsdom cannot distinguish buttons or cards semantically in a stable way. Proposed `data-testid` values, mirroring core's test template: section `<path>-array-section`, add button `<path>-add-button`, item card `<path>-array-item-<index>`, remove button `<path>-remove-button-<index>`. One test additionally locates the buttons by their visible text ("Add", "Remove") to cover the plain-English label assumption.
9. **AC7 has a built-in expiry date.** It documents behavior that the choice story replaces by adding `default-choice-array-item`. The test must live in a clearly named block, and the choice story must delete or rewrite it rather than leave a stale assertion.
10. **AC10 (spacing, header row) cannot be asserted in jsdom.** Scoped CSS does not compute layout there. Automated part: the stylesheet source-scan test from the CSS story covers all `.vue`/`.ts` files (confirm its glob includes any new sub-component file) plus a build check that `dist/style.css` contains the new class names. The visual part is manual (see checklist).
11. **AC11 is lint plus grep, not a unit test.** `ci:lint` covers style; the spec-reference and em dash sweep is a scripted check (see checklist).

### Test files and fixtures

All under `packages/element-plus/src/__tests__/` (next to the source), using `*.test.ts` conventions. Component tests mount through `DynamicForm` (mirrors how core tests mount through `TestForm`, and is what the acceptance criteria require).

| File | Covers |
| --- | --- |
| `ElementPlusFormTemplate.array.test.ts` | Rendering and structure: section, title, item cards, buttons, group items, empty and edge states. |
| `ElementPlusFormTemplate.array.logic.test.ts` | Add and remove behavior, limits, value preservation, disabled variants, large `maxOccurs`. |
| `ElementPlusFormTemplate.arraySlots.logic.test.ts` | Slot overrides and fallbacks through the consumer wrapper, per-type forward, repeatable-choice fallthrough. |
| `ElementPlusFormTemplate.array.validation.test.ts` | Section-level and item-level error display, required marker (written for findings 7). |
| `ElementPlusFormTemplate.array.analytics.test.ts` | Render-count isolation when adding, removing, and editing items. |

Fixtures:

- Reuse (from the foundation story): the jsdom environment, the `enableAutoUnmount(afterEach)` setup file, `ElementPlusFormTemplate`, `elementPlusMetadata`. Reuse, if it already exists by the time this story is implemented, the shared mount helper from the slot-forwarding story rather than creating a second one.
- New, shared (place in `packages/element-plus/src/tests/`, and add that folder to the coverage `exclude` in `vite.config.ts` so fixtures do not distort the baseline):
  - `ElementPlusTestForm.vue`: host component that calls `useDynamicForm({ initialValues })`, renders `<DynamicForm :metadata :template="ElementPlusFormTemplate" :settings>` and exposes `values` and a `validate()`/submit trigger (same pattern as core's `TestForm.vue`, with `analytics: true` in settings). Props: `metadata`, `initialValues`, `settings`.
  - `arrayTestHelpers.ts`: `addButton(wrapper, path)`, `removeButtons(wrapper, path)`, `itemCards(wrapper, path)`, `formValues(wrapper)`, `renderCount(wrapper, path)` (copied in spirit from core's `DynamicFormItem.test-helpers.ts`, which is not importable from this package).
  - Three tiny wrapper fixtures for the slot tests, as SFCs so `vue-tsc` checks the slot scope types of the overrides: `WrapperOverrideItemOnly.vue` (forwards `#input`/`#attributes`, overrides only `#default-array-item`), `WrapperOverrideSectionOnly.vue` (overrides only `#default-array`, renders `<slot v-bind="s" />` inside), `WrapperOverrideTextArrayItem.vue` (overrides only `#text-array-item`). Each renders `ElementPlusFormTemplate` with the documented two forward lines. The host needs a `template` prop so it can mount any of them.
- Mount options everywhere: `attachTo: document.body`, `global: { plugins: [ElementPlus] }`, `await flushPromises()` after mount and after every interaction.
- No date or time logic is touched, so `TZ=Europe/Amsterdam` adds no extra risk; the package `ci:test` scripts already set it and nothing here depends on it.

### Acceptance criteria to tests

Path `tags` below is shorthand for a `text` field with `maxOccurs: 3`, `label: 'Tags'`, and `initialValues: { tags: ['a', 'b'] }` unless stated.

| AC | Test (file, name) | Level |
| --- | --- | --- |
| 1 | array.test: "renders a section titled with the field label" (title text is `Tags`, section located by `tags-array-section`, it is an `ElCard`). array.test: "renders every item inside the section" (both item inputs are descendants of the section; count of `ElInput` is 2). array.test: "does not render the text 'undefined' in the title when the field has no label". Bare usage, no wrapper. | component |
| 2 | array.test: "renders each item in its own card with an input and a remove button" (two `tags-array-item-*` cards, each an `ElCard` containing one `ElInput` and one `ElButton` remove button; the input shows the initial value). array.logic.test: "remove button calls removeItem for that item only" (see AC4). | component |
| 3 | array.logic.test: "add button is enabled below maxOccurs and adds an empty item" (card count 2 to 3, existing values unchanged). "add button is disabled at maxOccurs" (mount with `maxOccurs: 2`; `disabled` attribute present). "clicking the disabled add button adds nothing" (VTU click, and a raw `dispatchEvent(new MouseEvent('click'))` to prove the component ignores forced clicks; count stays 2; `_addItem` has no guard so this is the only protection). "add button state follows the count" (fill to max disables it; one removal re-enables it). | component |
| 4 (rewritten, finding 1) | array.logic.test: "removes exactly the clicked item and keeps the other values" (`['a','b','c']`, `minOccurs: 1`, remove the middle one: cards 3 to 2, values `['a','c']` both in the DOM inputs and in form values). "remove button is disabled for an empty item at minOccurs" (`minOccurs: 2`, two empty items). "clicking remove on an item with a value at minOccurs clears its value and keeps the card" (`minOccurs: 2`, values `['a','b']`: click first remove: still two cards, values `['', 'b']`/`[null,'b']` per engine). "removing the first and the last item both work". | component |
| 5 | arraySlots.logic.test: "overriding only the item slot keeps the built-in section" (section card and add button present, item markup is the consumer's test id, consumer receives `index`, `canRemoveItems`, `removeItem`; calling the received `removeItem` removes that item). "overriding only the section slot keeps the built-in item cards" (consumer markup replaces section chrome; inside it `<slot v-bind="s" />` renders the item cards, which are still the built-in ones, and the consumer receives `canAddItems`/`addItem`). "overriding either array slot does not warn about duplicate or missing slots" (spy on `console.warn`/`console.error`; also guards the generic forward exclusion set, which must now include the two new names). | component |
| 6 | arraySlots.logic.test: "a per-type array item slot wins for that type only" (wrapper supplies `#text-array-item`; a `text` array uses it, a `number` array in the same form still renders the built-in item card with an `ElInputNumber`). Also "the per-type slot wins over the default item slot when both are supplied". | component |
| 7 | arraySlots.logic.test, block named "repeatable choice occurrences without a dedicated slot": "renders each occurrence as an array-item card and removes one" (explicit repeatable choice, metadata copied from the core choice test helpers: `explicitChoiceSelection: true`, `maxOccurs > 1`, two branches; add two occurrences through the choice's own slot fallback, assert each occurrence sits in an item card and its remove button removes that occurrence; assert no Vue warning and no thrown error). Expires when the choice story supplies `default-choice-array-item`. | component |
| 8 | array.test: "renders one card per group occurrence containing the group's children" (`contacts`, `maxOccurs: 3`, children `first` and `last`; two initial groups; each card contains both child inputs with the `ElFormItem` labels). array.logic.test: "adding and removing group occurrences works and keeps child values" (values stored at `contacts[i].first`). | component |
| 9 (rewritten, finding 4) | array.logic.test: "maxOccurs 0 disables add and every remove button" and "disabled: true disables add and every remove button, including an item that holds a value" (the second case is the important one: core reports that item as removable). Both assert the native `disabled` attribute and that clicks change nothing. | component |
| 10 | (a) Existing source-scan test from the CSS story runs green over the new markup and any new sub-component file (verify the glob, do not write a duplicate). (b) `pnpm --filter ./packages/element-plus run build` then grep `dist/style.css` for the new class names (checklist). (c) Visual spacing: manual. | scan + build + manual |
| 11 | `ci:lint`, `ci:typecheck`, `ci:test` for the package; grep sweep in the checklist. | lint + scripted |
| 12 (proposed) | array.validation.test: "shows the array-level error on the section" (`minOccurs: 2`, `autoAddMinOccurs: false`, one item, host validates: section contains the configured minOccurs message). "hides it once the array satisfies minOccurs". | component |
| 13 (proposed) | array.validation.test: "shows an item's validation error inside its own card and not in the siblings" (restriction such as `minLength` on the text item, invalid value in item 1, valid in item 2, host validates). "shows a required marker on the section title when minOccurs >= 1 and none when minOccurs is 0". | component |

Edge cases:

| Edge case | Test |
| --- | --- |
| `minOccurs: 0`, empty array | array.test: "shows only the title and the add button for an empty array" (`minOccurs: 0`, `autoAddMinOccurs: false`, no values: zero item cards, section present, add button present and enabled). |
| Very large `maxOccurs` | array.logic.test: "add is never disabled by the limit with a very large maxOccurs" (`maxOccurs: 1000`; replacement for the unsupported `'unbounded'`). |
| Remove the last remaining item at `minOccurs: 0` | array.logic.test: "removing the last item leaves an empty section" (`autoAddMinOccurs: false`: after the click there are zero item cards, the section and the add button are still rendered, and adding again works). |
| Item index labels | Only if the developer renders a one-based label: array.logic.test "item labels renumber after a removal" (delete the middle of three, labels read 1, 2). Skipped, not failed, when no label is rendered; the developer states which in Implementation notes. |
| Section without a label | Covered by the "undefined" test under AC1. |
| Plain-English labels (assumed mechanism) | array.test: "labels the buttons Add and Remove" (locate by text). Changing the assumption later means editing exactly this test. |

### Component states to assert (this slice)

- **Populated**: AC1, AC2, AC8.
- **Empty**: `minOccurs: 0` with `autoAddMinOccurs: false`, and after removing the last item.
- **At limits**: at `maxOccurs` (add disabled), at `minOccurs` (empty item remove disabled; valued item clears).
- **Disabled**: `maxOccurs: 0`, and extended `disabled: true`, each with and without values.
- **Validation/error**: array-level `minOccurs` error and item-level restriction error (proposed criteria 12 and 13), plus the required marker.
- **Loading**: not applicable, the array has no async behavior.
- **Readonly**: not applicable to array chrome, the extended `readonly` property only affects the inner controls (covered by the control binding story).
- **Dark mode**: out of scope for the feature.

### Reactivity (`ElementPlusFormTemplate.array.analytics.test.ts`)

This story does not change `DynamicFormItem`, `computedProps`, or validation wiring, but the new slot fallbacks read `canAddItems`/`canRemoveItems`/`fieldContext` and are re-invoked by the engine on every count change, so a careless binding (for example reading the whole `fieldContext.value` array in each item card) could re-render every item on every keystroke. Plan, using `settings: { analytics: true }` and `data-testid="<path>-analytics-render-count"`:

1. "typing in one item does not re-render its siblings": record `tags[1]` render count, type into item 0, assert the `tags[1]` count is unchanged.
2. "adding an item does not re-render existing items more than the same form does with a minimal template": mount the same metadata once with `ElementPlusFormTemplate` and once with a bare `DynamicFormTemplate` host that has the smallest possible `default-array`/`default-array-item` slots; assert the existing item's render-count delta on add is not larger with the Element Plus template. Comparing against a control avoids hard-coding a number that belongs to core.
3. Same comparison for remove.

The core baseline for these counts is not documented, which is why tests 2 and 3 are relative. If the control comparison proves flaky in practice, fall back to asserting the delta is at most a small documented constant and note it in Implementation notes.

### Coverage

- The package has effectively no coverage baseline today (placeholder test), so there is no regression risk in absolute terms; the real risk is the later stories inheriting an uncovered array branch. The plan covers every new branch of the array fallbacks: title present or absent, required marker present or absent, each disabled source, add and remove enabled and disabled, index label shown or not (if implemented), empty and populated.
- Knowingly not covered: visual CSS (jsdom), and the `ElementPlusFormTemplate`-only glue that the slot-forwarding story already covers. Anything else left uncovered is a defect to fix, not an accepted gap.
- Run `pnpm --filter ./packages/element-plus run ci:test:coverage` and record the percentages in Implementation notes; `pnpm -r ci:test:coverage` must stay at or above baseline for `packages/core` (untouched).

### Regression risk

- **Same SFC as other stories.** `ElementPlusFormTemplate.vue` is edited by the slot-forwarding, binding, CSS, choice, and wizard stories. Guards: the slot-forwarding story's tests (the exclusion-set test must now also expect `default-array` and `default-array-item` to be consumed by explicit templates, not forwarded), the binding story's per-control tests, the CSS story's source scan.
- **Behavior change for arrays.** Before this story arrays rendered through the generic `default` (an `ElFormItem` per item). After it they render through the new cards. Any earlier test that mounts an array and expects `ElFormItem` chrome per item must be updated in the same change; grep the package tests for `maxOccurs` before finishing.
- **Choice story.** Repeatable-choice occurrences fall through to these cards until the choice story lands (AC7 test). The choice story adds its own fallback and must remove the AC7 block. It also reuses the item-card conventions and the test ids defined here.
- **Wizard story.** Independent; pages that contain arrays will use these cards, so its tests may incidentally cover them.
- **Core.** Untouched. Existing core array tests (`DynamicFormItemArray.logic.test.ts`, `DynamicFormItemArray.validation.test.ts`, `DynamicFormTemplate.test.ts`) continue to guard the engine contract these tests rely on (`canRemoveItems`, clear-on-remove, choice fallthrough). If one of them changes, the facts section above needs a re-check.
- **Playground.** Storybook story and implementation component only change in the playground story; nothing to run here.

### Manual verification checklist

Automated tests cannot judge these. Do them in Storybook (the playground polish story adds the array example; until then use a temporary local story and do not commit it).

- [ ] A repeatable `text` field renders a titled section with one card per entry, the add button below or beside the title, and remove buttons on each card, with sensible spacing between cards (Element Plus defaults plus the package stylesheet only).
- [ ] The same view with only `element-plus/dist/index.css` imported (no package stylesheet) is still usable, if tighter.
- [ ] With the package stylesheet and no Tailwind in the consuming app, nothing relies on missing utility classes.
- [ ] Add up to `maxOccurs`: the add button visibly disables and the cursor and color match an Element Plus disabled button.
- [ ] Remove from the middle: remaining cards keep their values and order; removing down to the minimum behaves as tested (valued items clear, empty items lose the enabled remove button).
- [ ] An empty array (`minOccurs: 0`, `autoAddMinOccurs: false`) looks intentional, not broken.
- [ ] An array of groups: each card shows the group's children in a readable stack.
- [ ] Error state: submit with too few items and with an invalid item, check the messages are visible and attributed to the right card.
- [ ] Keyboard: tab order is item input, then remove, then next card, then add; Enter or Space on a focused add or remove button works.
- [ ] Run `pnpm --filter ./packages/element-plus run build`, then confirm `packages/element-plus/dist/style.css` contains the new array class names.
- [ ] Hygiene sweep over the changed files: search for `FEAT-`, `ST-0`, `AC[0-9]`, `ADR`, `finding`, and the em dash character; expect none in comments or test names.
- [ ] `pnpm --filter ./packages/element-plus run ci:test`, `ci:lint`, `ci:typecheck` are green, and `pnpm -r ci:test:coverage` has not dropped.

### Untestable or only partly testable criteria

- AC10 visual spacing and header layout: manual only (plus the automated class and stylesheet checks above).
- AC11 comment and test-name hygiene: lint covers style, the reference and em dash sweep is scripted and manual.
- The `'unbounded'` edge case: not supported by the engine, cannot be tested (replacement proposed in finding 6).
- AC3, AC4, AC9 as worded with "(or absent)": become testable only after the pin in finding 2.

## Adversarial review
Reviewer running as opus (story mode, lite). Engine facts verified against `packages/core/src/components/DynamicFormItem.vue`, `DynamicFormItemArray.vue`, `DynamicFormTemplate.vue`, and `packages/core/src/types/FieldMetadata.ts`. The QA plan's facts section is accurate; the gap is that the authoritative Acceptance criteria and Edge cases were left contradicting it. Each should-fix below is routed as a `PROPOSED (adversarial review)` edit in the relevant section.

1. **AC4 contradicts verified engine behaviour (should-fix, routed).** "At `minOccurs` the remove buttons are disabled and do not remove" is false: `DynamicFormItem._canRemoveItems` returns `true` for any array item that holds a value (lines 279-285), and `_removeItem` then clears the value instead of removing the card (lines 195-205). The QA plan already tests the corrected behaviour, but the AC itself, which is what Jeroen stamps, still states the false version. Routed rewrite in AC4.

2. **"disabled (or absent)" in AC3, AC4, AC9 is not assertable (should-fix, routed).** A test cannot target two alternative behaviours. Routed pin in AC3: buttons are always rendered and carry the native `disabled` attribute when unavailable.

3. **AC9 misses the `maxOccurs: 0` disabling source (should-fix, routed).** Two distinct things disable an array: `maxOccurs: 0` (engine `disabled` slot prop) and extended `disabled: true` (`fieldMetadata.disabled`). AC9 names only the second. Routed rewrite covers both, including the valued-item remove button the engine reports as removable, plus an implementer note that the extended flag does not reach the item-level engine `disabled` prop.

4. **Empty-array edge cases are unreachable without `autoAddMinOccurs: false` (should-fix, routed).** The array `watchEffect` (lines 174-184) re-adds a placeholder whenever `length < 1`, so "empty array" and "remove the last item" cannot occur as written. Routed into both edge cases.

5. **`maxOccurs: 'unbounded'` edge case is untestable (should-fix, routed).** `maxOccurs` is typed `number` (`FieldMetadata.ts:21`); no `'unbounded'` handling exists in `packages/core/src` (grep confirmed). Routed: drop it, replace with a large finite `maxOccurs`.

6. **Array and item error display is unspecified, and item errors are otherwise invisible (should-fix, routed).** Array items dispatch to `-array-item`, never `default` (line 529), so they get no `ElFormItem` chrome and a failing item shows no message unless the template renders one. The feature architecture specifies error surfacing only for leaf inputs and choice cards, leaving the array shape open. Routed as new AC12 (section-level error) and AC13 (item-level error plus a required-marker decision for the section title). These refine the feature for the array shape without contradicting it, so no feature amendment is needed.

7. **AC7 has a built-in expiry and is only partly exercisable in this story (nit).** Verified accurate: a repeatable-choice occurrence dispatches to `-choice-array-item`, which falls back through `default-choice-array-item` → `<type>-array-item` → `default-array-item` (`DynamicFormTemplate.vue` lines 308-315), so ST-05's `default-array-item` catches it. Two notes for the implementer, neither status-affecting: (a) in ST-05 the repeatable-choice section itself still resolves to `default` (no `default-choice-array`/`default-choice` slot exists yet), so the AC7 test should seed occurrences via `initialValues` rather than clicking an add affordance that ST-05 does not render; (b) the AC7 block must be deleted or rewritten by ST-06 when it adds `default-choice-array-item`, as the QA plan's finding 9 already flags.

Status: all findings are should-fixes routed as `PROPOSED (adversarial review)` edits with concrete rewrites, or a nit. No unresolved blocker; the story has no Open questions section and its ASSUMED button-text entry is settled by feature-level policy (feature spec Stories note). Per the mechanical rule, this lands in `awaiting-approval`.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

Built inline in `ElementPlusFormTemplate.vue` (no sub-component): `default-array` is an `ElCard` section (title, items via `<slot name="input"><slot /></slot>`, array error, Add button in the card footer so tab order is input, Remove, next card, Add), `default-array-item` is an `ElCard` with the item content, its error, and a Remove button. Both names are added to the generic-forward exclusion set. Scoped `epft-array-*` classes carry the layout; no Tailwind.

Pinned by the approved proposals: Add and Remove are always rendered and carry the native `disabled` attribute; handlers also guard, so a forced click on a disabled button is inert. Remove at `minOccurs` follows the engine (a valued item stays removable and clears). Disabled combines the engine `disabled` slot prop with `fieldMetadata.disabled`. Section title shows a required marker (`is-required`), the section shows `fieldContext.errorMessage`, each item shows its own.

Deviations and choices:
- A top-level `maxOccurs: 0` field is not an array (the engine only treats `maxOccurs > 1` as one), so the `maxOccurs: 0` disabled test places the array inside a group with `maxOccurs: 0`, which is the only way the engine `disabled` prop reaches an array.
- Attribute sub-items of an array item render after the item card (outside it), following the established rule that attribute items render after the overridable chrome so an override cannot drop them.
- No item index label is rendered, so the label renumbering test is skipped by design.
- The fixtures reuse the existing `mountInForm` and `createConsumerWrapper` instead of a new `ElementPlusTestForm.vue`; new fixtures are `fixtures/arrayHelpers.ts` and three SFC wrappers (`WrapperOverrideItemOnly`, `WrapperOverrideSectionOnly`, `WrapperOverrideTextArrayItem`).
- The stylesheet test gained cases for the new classes instead of a separate grep of `dist/style.css`.
- An existing forwarding test that expected the generic `ElFormItem` for a `date-array-item` now expects the array item card; the slot exclusion test lists the two new names.
- The repeatable-choice fallthrough test seeds occurrences from `initialValues` (no choice add affordance exists yet). It lives in a block named for the missing dedicated slot and must be removed or rewritten when the choice fallbacks land.
- Not done: Storybook/Playwright screenshots and the manual checklist (spacing, dark/plain stylesheet views, keyboard); left for verification. No feature spec change was needed.

Checks (all green): `pnpm run ci:test` (350 tests), `ci:lint`, `ci:typecheck` in `packages/element-plus`; `pnpm -r ci:test:coverage`: element-plus 100% statements/lines/functions, 98.43% branches; core unchanged (97.57 / 92.61 / 97.14). `specs/components.md` updated. No changeset (private package, core untouched).

## Verification report

Verdict: pass-with-notes.

### Pipeline results (re-run independently)
- `packages/element-plus`: `pnpm run ci:test` 24 files, 350 tests passed; `ci:lint` and `ci:typecheck` clean. Root `pnpm run ci:lint` and `ci:typecheck` (core and element-plus) clean.
- `pnpm -r ci:test:coverage`: core 686 tests, 97.57 / 92.61 / 97.14 / 97.57 (identical to the recorded baseline, core untouched); element-plus 350 tests, 100 statements / 98.43 branches / 100 functions / 100 lines.
- `docs/` unchanged, so `pnpm docs:build` not required.
- `pnpm run build` in `packages/element-plus` succeeds; `dist/style.css` contains `epft-array-error`, `epft-array-item-content`, `epft-array-item-row`, `epft-array-items`, `epft-array-title`.

### Acceptance criteria
| AC | Result | Evidence |
| --- | --- | --- |
| 1 | pass | array.test "renders a section titled with the field label", "renders every item inside the section", "does not render the text undefined..."; section is an `ElCard` (`tags-array-section`), items arrive via `<slot name="input"><slot /></slot>` in `ElementPlusFormTemplate.vue`. |
| 2 | pass | array.test "renders each item in its own card with an input and a remove button"; array.logic "removes exactly the clicked item...". |
| 3 | pass | array.logic "enables the add button below maxOccurs and adds an empty item", "disables the add button at maxOccurs", "adds nothing when the disabled add button is clicked, also when the click is forced", "follows the item count...". Buttons always rendered with native `disabled`. |
| 4 (rewritten) | pass | array.logic "removes exactly the clicked item and keeps the other values", "removes the first and the last item", "disables the remove button of an empty item at minOccurs", "clears an item with a value at minOccurs instead of removing its card". |
| 5 | pass | arraySlots.logic: item-only override keeps built-in section and receives `index`/`canRemoveItems`/`removeItem`; section-only override keeps built-in item cards and receives `canAddItems`/`addItem`; `expectNoWarnings` guards the block. |
| 6 | pass | arraySlots.logic "uses a per-type item slot for that type only" (number array keeps the `ElInputNumber` card), "prefers the per-type item slot over the default item slot". |
| 7 | pass | arraySlots.logic block "repeatable choice occurrences without a dedicated slot" (seeded from `initialValues`, occurrence in `.epft-array-item`, remove works). Expiry block, as planned. |
| 8 | pass | array.test group card test; array.logic "adds and removes group occurrences and keeps the child values". |
| 9 (rewritten) | pass | array.logic "disables add and every remove button when the array sits in a group that is switched off" (`maxOccurs: 0`) and "...when disabled is true, including an item that holds a value" (with forced clicks). |
| 10 | pass (visual part manual, see notes) | `noTailwind`, `layoutClasses`, `stylesheetBuild` tests green; scoped `epft-array-*` classes only, present in built `dist/style.css`. |
| 11 | pass | Grep sweep of `ElementPlusFormTemplate.vue`, array tests and array fixtures for `FEAT-`, `ST-0`, `AC[0-9]`, `ADR`, finding, QA plan and the em dash: no hits. Button labels are plain `Add`/`Remove` (assumed, honoured). Lint, typecheck, tests green. |
| 12 | pass | array.validation "shows the array error on the section when there are too few items", "hides the array error once the array has enough items". |
| 13 | pass | array.validation "shows an item error inside its own card and not in its siblings", required marker present at `minOccurs: 1` and absent at `0`. |

Edge cases: empty array (array.test), very large `maxOccurs` 1000 (array.logic), removing the last item at `minOccurs: 0` and adding again (array.logic) all covered. Item index labels are not rendered, so the renumbering test is skipped by design, stated in the notes. Render counts: array.analytics (3 tests) green.

### Mutation checks (tree restored byte-identical, sha unchanged)
- Dropping `fieldMetadata.disabled` from the locked check: caught (disabled: true test fails).
- Dropping the `is-required` class: caught (required marker test fails).
- Dropping the handler guards `canAddItems && !isArrayLocked` on add and `canRemoveItems && ...` on remove: NOT caught. These guards are redundant defence, because the native `disabled` attribute plus `ElButton`'s own disabled handling already make a forced click inert. Not a defect, behaviour is pinned by the forced-click tests either way.

### Process compliance
- `specs/components.md` updated (ElementPlusFormTemplate row describes array section, item card, buttons, test ids, choice fallthrough).
- No changeset needed: `git status` shows no change under `packages/core`; the package is `private`.
- Generic-forward exclusion set now lists `default-array` and `default-array-item`; the ASSUMED plain-English button text is followed; no silent deviation from the proposals. Developer's listed deviations (maxOccurs 0 inside a group, attributes after the card, reused fixtures) are documented and consistent with the engine.
- Test names and comments carry no process references; no em dashes.
- No feature prototype exists for this story.

### Notes
- The manual checklist (Storybook visual spacing, plain `element-plus/dist/index.css` view, keyboard order, dark mode) was not executed by developer or verifier. It is not asserted by jsdom; Jeroen should eyeball it in the playground story (ST-08 adds the array example).
- Cosmetic: a blank line is missing before `.epft-array-title` in the scoped style block.
- The repeatable-choice fallthrough test block must be removed or rewritten when the choice story adds its dedicated fallback.
- Link the PR in the frontmatter `pr` field. This is not the last open story of FEAT-004, so the feature stays in-progress.

Suggested commit message:

```
FEAT-004 ST-05: Render repeatable fields as Element Plus array sections

End users filling in a repeatable field now see a titled card with one card per entry and clear Add and Remove buttons that respect the minimum, maximum, and disabled state, instead of a bare unstyled list. Template authors can override only the section (default-array) or only the item (default-array-item), or per type, and keep the built-in rendering for the rest. The section shows the array's error and a required marker, each item its own error; the layout uses scoped epft-array classes in the package stylesheet with no CSS framework.

Co-Authored-By: Claude <noreply@anthropic.com>
```
