---
id: ST-05
type: story
feature: FEAT-011
status: done
approved_by: Jeroen
pr: ""
---

# Story: Focus restored after removing a repeatable array item

## Decided without Jeroen (research)

Settled from research during adversarial review, not reviewed by Jeroen. Override any of these freely.

- AR-1 → shared remove handler uses one shape-agnostic target algorithm (prev Remove button → single Add button → `firstFocusableWithin` safety net), covering choice-array and default-array without dropping focus to body

## Functional
### User story
As a keyboard or screen-reader user removing an item from a repeatable array (e.g. a list of contacts), I want keyboard focus to land somewhere sensible after the item and its Remove button disappear, so that focus is never silently dropped to the document body.

### Acceptance criteria
1. **Removing a middle or last item focuses the previous item's Remove button.**
   Given an array section with 3+ items and focus on item N's Remove button,
   When that item is removed (N is not the first item),
   Then, after the removal, focus lands on item N-1's Remove button.

2. **Removing the first item (with others remaining) focuses the section's Add button.**
   Given an array section with 2+ items and focus on the first item's Remove button,
   When that item is removed,
   Then focus lands on the section's `Add a {item}` button.

3. **Removing the only remaining item focuses the empty-state Add button.**
   Given an array section with exactly one item,
   When that item is removed,
   Then the list becomes empty and focus lands on the empty-state `Add a {item}` button.

4. **Focus restoration is scoped to the section the removal happened in.**
   Given a form with two independent array sections,
   When an item is removed from one section,
   Then focus restoration only queries buttons within that section's DOM subtree, never crossing into the other section.

5. **No change to the engine's remove behavior.**
   Given `s.removeItem` as provided by the engine,
   When `StarterFormTemplate` wraps it,
   Then the underlying array mutation is unchanged; only a focus side effect is added around the call.

### Edge cases
- Removing an item via click vs. via `Enter`/`Space` on the focused button: both trigger the same wrapped handler, so focus restoration behaves identically regardless of activation method.
- Two array sections with the same item-type label (e.g. two "Contact" lists): AC4 is the guard that keeps restoration scoped correctly even when button text is identical across sections.

### Out of scope
- Wizard step-change and first-invalid focus: ST-04 (this story only reuses `focus.ts` from it).
- Any visual change to `RepeaterCard.vue` / `ArraySectionCard.vue`: no markup change, per the feature architecture.
- Adding/visually confirming the focus ring on the Remove/Add buttons: already covered by ST-02's CSS.

## Design reference
Implements the feature's [Per-section design notes for `#array-remove`](../../spec.md#per-section-design-notes-maps-to-the-spec-s-required-coverage): "move to the previous item's Remove button; when the removed item was the first/only one, move to the array's `Add {item}` button (empty-state `Add a {item}` button when the list becomes empty). Both end states are drawn." Prototype anchor: [`#array-remove`](../../prototype.html#array-remove) (all three target states are drawn there). No delta left open.

## Architecture reference
Implements the feature architecture's Slicing seam 4 (array-remove consumer) and Data flow 5:

- **`StarterFormTemplate.vue`** — wraps the engine's `s.removeItem`: at click time records the triggering button's position among the section's Remove buttons, calls the engine's remove, then on `nextTick` focuses the previous item's Remove button, the section's Add button (removed item was first/only), or the empty-state Add button (list now empty).
- **`RepeaterCard.vue` / `ArraySectionCard.vue`** — no markup change; they only need to be queryable by the shared util.
- **`focus.ts`** — reused as-is from **ST-04**; no new function needed, only DOM queries scoped to the array section using `firstFocusableWithin`-style helpers already present.
- **Public API surface touched:** none. Internal chrome only.
- **Dependencies on other stories:** depends on **ST-04** for `focus.ts`. Implement after ST-04 lands.
- **Documentation:** none assigned to this story. The array-remove focus behavior is part of ST-08's general "focus management" summary in `docs/guide/starter-template.md`, not significant enough on its own to need a dedicated example page the way the wizard behavior does.

PROPOSED (adversarial review) — **the wrapped `s.removeItem` fires behind three distinct markups, not one, so the handler's algorithm must be shape-agnostic with a safety net.** `StarterFormTemplate.vue` binds `@remove="s.removeItem"` on three elements, all reachable at runtime: (1) `RepeaterCard` in `#heading-array-item` (inside `ArraySectionCard`, one footer Add button + one empty-state Add button); (2) `RepeaterCard` in `#default-choice-array-item` (inside `ChoiceArraySectionCard`, which has **no** single Add button, only one per choice option); (3) `GroupField` in the `#default` slot (lines 134-158), which a `default-array`/`default-array-item` field resolves to (the template defines no `#default-array` / `#default-array-item` slot, so `DynamicFormTemplate` falls `default-array`/`default-array-item` → `default`), carrying its own single header Add button and a single header Remove button, and no empty-state card. AC2/AC3's "the array's Add button" is well-defined only for shape (1). Rather than special-casing, the wrapper's target resolution is specified once for all three: **(a)** the previous sibling item's Remove button within the section (satisfies AC1 for every shape, since all three expose per-item `path[n]-remove-button` ids); **(b)** when the removed item was first/only and a single canonical Add button exists in the section, that button (the `ArraySectionCard` footer or empty-state button; the `GroupField` header Add button); **(c)** otherwise `firstFocusableWithin(section)` from ST-04 as the safety net, so the choice-array case (and any multi-Add-button section) lands on the first per-option Add button instead of dropping focus to the document body, which is exactly the regression the user story forbids. This keeps the three heading-array end states drawn in the prototype unchanged and adds no markup. Note: this makes the story a **direct** consumer of ST-04's `firstFocusableWithin` (the QA plan currently states it reuses none of ST-04's exports), strengthening the already-declared ST-04 dependency.

PROPOSED (adversarial review) — **the production target query must not resolve the Add button by the `path-add-button` test id, which is non-unique.** `ArraySectionCard` renders two elements carrying `data-testid="<path>-add-button"` whenever the list is empty: the empty-state button (`#default` slot, `v-if="itemsCount === 0"`) and the footer button (`#footer`, always rendered); `addButton()` in `arrayHelpers.ts` uses `wrapper.find`, so it silently returns whichever comes first in DOM order (the empty-state one, since `SectionCard` renders the grid slot before the footer). The handler's step (b) must target the Add button by structural position (empty state: the button inside `.sft-empty`; non-empty first/only removal: the button inside `.sft-array-footer`), never by the shared test id, so AC3 lands deterministically on the empty-state button rather than relying on DOM order. The component-level fix (de-duplicating the test id) is **out of scope** here: the feature architecture mandates no markup change to `ArraySectionCard.vue` (amending that would require a feature amendment, and a separate `/spec:quick` is the right vehicle). Only the handler's selector choice is in this story's scope.

## QA plan

Verified against the live tree: `focus.ts` does not exist yet (ST-04 is `awaiting-approval`, not implemented); this plan assumes its three exports land unchanged and reuses none of them directly (the "previous remove button by index" query this story needs is not one of `firstFocusableWithin`/`firstInvalidWithin`/`focusWithTemporaryTabindex`, so the developer writes a small scoped index-based query local to `StarterFormTemplate.vue`, not a new `focus.ts` export). `mountInForm` (`fixtures/mountInForm.ts`) already mounts with `attachTo: document.body`, so every test below gets working `document.activeElement` assertions for free; no new mount helper is needed. `fixtures/arrayHelpers.ts` already exports `section`, `addButton`, `removeButtons` (regex-matched across `path[n]-remove-button`), and `itemCards`; this story reuses all four. `headingArrayMetadata` (`contacts`, `maxOccurs: 3`) is the primary fixture; it already has `minOccurs: 0` available via override, needed for the empty-list case.

**Confirmed scoping gap, not yet in the Architecture reference**: `ArraySectionCard.vue` renders *two* elements with the identical `data-testid="<path>-add-button"` whenever the list is empty: the empty-state `AddButton` (in the `#default` slot's `v-if="itemsCount === 0"` branch) and the footer `AddButton` (in `#footer`, always rendered regardless of count). They are not mutually exclusive; `SectionCard.vue`'s template renders the grid slot before the footer slot, so `wrapper.find('[data-testid="<path>-add-button"]')` resolves to the empty-state one first, but `findAll` returns both. AC3 depends on landing specifically on the empty-state button. Tests below use the same disambiguating selector the codebase already uses in `StarterFormTemplate.headingArray.analytics.test.ts` (`.sft-empty button`) rather than the shared test id, and the finding is flagged below so the developer does not accidentally pass AC3 by focusing whichever element the test id happens to resolve to first.

**Choice-array ambiguity, flagged, not blocking**: `StarterFormTemplate.vue` wires `@remove="s.removeItem"` on `RepeaterCard` in both `#heading-array-item` (backed by `ArraySectionCard`, one canonical `Add {item}` button) and `#default-choice-array-item` (backed by `ChoiceArraySectionCard`, which has **no single Add button**; it renders one per-option add button, e.g. `explicitChoiceArrayMetadata`'s "channels" fixture has three: email/sms/webhook). AC2/AC3's target ("the array's `Add {item}` button") is well-defined for the heading-array case the Architecture reference actually names (`RepeaterCard.vue` / `ArraySectionCard.vue`) but undefined for the choice-array case the same wrapped handler also touches. See Untestable criteria below.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Removing a middle or last item (3+ items) focuses item N-1's remove button | New file: mount `headingArrayMetadata` with 3 items, attachTo body (via `mountInForm`); `removeButtons(wrapper, 'contacts')[1].element.focus()`, assert it is `document.activeElement`, then `click(removeButtons(wrapper, 'contacts')[1])`; after `flushPromises`, assert `document.activeElement` equals the (now re-indexed) first remaining remove button, i.e. `removeButtons(wrapper, 'contacts')[0].element`. Repeat removing the last of 3 (index 2) and assert focus lands on the new last remove button (index 1 before removal) | `StarterFormTemplate.arrayRemoveFocus.logic.test.ts` (new) |
| 2 Removing the first item with others remaining focuses the section's Add button | 2-item `headingArrayMetadata`; focus and click `removeButtons(wrapper, 'contacts')[0]`; after removal one item remains (non-empty), so only the footer Add button carries `contacts-add-button`; assert `document.activeElement` equals `addButton(wrapper, 'contacts').element` and that it is not `disabled` (a disabled button cannot hold focus; `canAddItems` must have re-evaluated to `true` before the focus call runs, which is why the test awaits `flushPromises` before asserting) | `StarterFormTemplate.arrayRemoveFocus.logic.test.ts` (new) |
| 3 Removing the only remaining item focuses the empty-state Add button | 1-item `headingArrayMetadata` with `minOccurs: 0, autoAddMinOccurs: false`; focus and click the sole remove button; after removal `.sft-empty` exists; assert `document.activeElement` equals `wrapper.find('.sft-empty button').element` specifically (not merely `[data-testid="contacts-add-button"]`, per the scoping gap noted above) | `StarterFormTemplate.arrayRemoveFocus.logic.test.ts` (new) |
| 4 Focus restoration is scoped to the section the removal happened in | Mount two independent `heading-array` sections with identical item-type label and identical default `removeAriaLabel` text ("Remove item 1" on both first items), e.g. `[{ ...headingArrayMetadata, name: 'contactsA' }, { ...headingArrayMetadata, name: 'contactsB' }]`, each with 2+ items; remove section A's first item; assert `document.activeElement` is `addButton(wrapper, 'contactsA').element` (or the correct previous-item target) and is contained within `section(wrapper, 'contactsA').element`, and assert it is **not** contained within `section(wrapper, 'contactsB').element`. Also assert section B's own item/remove-button count and render state are completely unaffected (`removeButtons(wrapper, 'contactsB')` unchanged length) | `StarterFormTemplate.arrayRemoveFocus.logic.test.ts` (new) |
| 5 No change to the engine's remove behavior | Using the same mount from AC1 (3 items), capture `values().contacts` before removal, click the middle item's remove button, assert `values().contacts` has length 2 and the remaining two items are the original first and third items in original relative order (proves the wrapper did not call `removeItem` twice, pass the wrong index, or otherwise alter the mutation), reusing `mountInForm`'s exposed `values()` | `StarterFormTemplate.arrayRemoveFocus.logic.test.ts` (new) |

### Edge cases to tests
- Click vs `Enter`/`Space` activation: not a separate test. `RepeaterCard.vue` binds only `@click`; a native `<button>`'s `Enter`/`Space` activation and a mouse click both dispatch the same `click` event at the DOM level, so the single `trigger('click')` used in every test above already exercises the one code path either activation method reaches. Noted here rather than duplicated as a redundant keyboard-specific test.
- Two sections with identical label text: covered by AC4's test above; the assertion that focus never lands inside section B's root is the actual guard, not just that it lands somewhere in section A.
- Removing from a 2-item list down to 1, then removing that last one (chained removal): add one assertion inside the AC2 test continuing into AC3's empty case, confirming the handler recomputes the correct target each time rather than caching a stale "previous button" reference from the first removal.

### States from the feature's states policy applicable to this slice
- **Error.** Not directly exercised: this slice's focus targets are always valid, focusable buttons (Remove or Add), never an invalid field. No interaction with `aria-invalid`/`role="alert"` here; that remains ST-01's concern.
- **Valid / pristine.** The default path through every AC: items are not required to be invalid or touched for removal to work.
- **Loading.** Not applicable; no async/loading state in this slice's surface.
- **Empty.** AC3 is this slice's empty state: the array section transitions from one item to zero, and the empty-state card (`.sft-empty`) becomes the live DOM the Add button must be found in.
- **Disabled.** Relevant as a precondition, not a target: the Add button must not be `disabled` at the moment focus is attempted (AC2/AC3), since a disabled native button cannot receive `.focus()`. Tests use `maxOccurs` headroom so `canAddItems` is `true` after the removal; call out explicitly in the test rather than relying on it implicitly.

### Reactivity / analytics
This slice adds no `computedProps`, no new reactive source, and no change to `combinedValidation`/`useField` wiring; the wrapped `removeItem` handler's focus call is a DOM-only side effect after the engine's own array mutation re-render settles, identical in shape to ST-04's step-change watch. No new `*.analytics.test.ts` file is needed. As insurance, extend the existing `StarterFormTemplate.headingArray.analytics.test.ts` with one more case: after removing the middle item of three, the two remaining items' field render counts increase by at most the engine's own re-render cost (same `toBeLessThanOrEqual(before + 1)` pattern already used for the add-button analytics test in `StarterFormTemplate.array.analytics.test.ts`), and an unrelated sibling field's render count is unchanged, proving the focus call itself adds no extra `DynamicFormItem` render.

### Coverage
Every branch the wrapped `removeItem` handler needs (previous-item target found vs not found, first/only-item fallback to the footer Add button, empty-list fallback to the empty-state Add button, scoping query hitting the right section) is exercised by the new `arrayRemoveFocus.logic.test.ts` file's five AC rows plus the chained-removal edge case. `pnpm -r ci:test:coverage` for `packages/starter` is expected to stay at or above baseline. **Knowingly left uncovered for now**: the choice-array (`#default-choice-array-item`) path through the same wrapped handler, per the ambiguity flagged below; if the developer's implementation happens to also cover it (e.g. falling back to "focus the section root" when no single Add button exists), that fallback should get its own test once the ambiguity is resolved, not be left implicit.

### Time sensitivity
None. No date/time-dependent behavior in this slice.

### Regression risk
- `StarterFormTemplate.vue`'s `removeItem` wiring is shared by `#heading-array-item` and `#default-choice-array-item` (both bind `@remove="s.removeItem"`); any change to the wrapper touches choice arrays too even though this story's Architecture reference only names `RepeaterCard.vue`/`ArraySectionCard.vue`. The existing `StarterFormTemplate.choice.array.test.ts` and `ChoiceArraySectionCard.test.ts` suites must stay green unmodified; they are the regression guard that the choice-array remove-and-mutate behavior (distinct from the new focus side effect) is untouched.
- `StarterFormTemplate.array.test.ts`, `StarterFormTemplate.headingArray.test.ts`, and `StarterFormTemplate.headingArray.validation.test.ts` exercise the same `ArraySectionCard`/`RepeaterCard` markup this story adds a side effect around; none of their existing assertions (count pill, empty-state card presence, validation messages) should change, since this story is script-only with no markup change (confirmed against both `.vue` files, re-read for this plan).
- `RepeaterCard.test.ts`'s existing "emits remove on click" assertion is the guard that the `@remove` emit contract itself is unchanged; this story wraps the *handler* in `StarterFormTemplate.vue`, not the component's own emit.
- Depends on ST-04 landing `focus.ts` first (dependency already declared in the Architecture reference); this story does not need any of ST-04's three exports directly for its own index-based query, so a delay in ST-04 only blocks this story on sequencing, not on a shared-code contract.
- No `packages/core` file is touched, so the engine's and `packages/element-plus`'s own suites are unaffected by construction.

### Untestable criteria and rewrite proposals
- **AC2/AC3's "the array's `Add {item}` button" is undefined for the choice-array call site.** As detailed above, `ChoiceArraySectionCard` has no single Add button, only one per choice option. The story's own Architecture reference only names `RepeaterCard.vue`/`ArraySectionCard.vue` as touched, which suggests the intended scope is heading-array only, but the shared `@remove="s.removeItem"` wiring means the wrapped handler also runs for choice-array removals today.

  `DECIDED (research)`: resolved by the shape-agnostic target algorithm added to the Architecture reference above, rather than by narrowing scope. AC2/AC3 are worded against the heading-array case (the one the feature's Data flow 5 and prototype actually commit to and draw) and tested there; for the choice-array and `default-array`/`GroupField` call sites the handler's fallback step (c) (`firstFocusableWithin(section)`) guarantees the user story's stated invariant ("focus is never silently dropped to the document body") holds. Tie-breaker ladder: rung 1 — the user story's own goal already forbids dropping focus to body for *every* removal, so a defined non-body target is required, not optional; rung 3 — ST-04 already ships `firstFocusableWithin`, the codebase's existing "no single named target, land on the first focusable" primitive; rung 5 — reusing it is the smallest-scope option (no new helper, no markup change). Not escalated to Jeroen: it changes no public API, contradicts nothing approved (the feature names only the heading-array behavior, which is preserved exactly), and is a local edit to reverse. A dedicated choice-array / default-array focus-target test is not required by this story; if a later story wants to assert a specific target there, it commits to one then.
- All other acceptance criteria are concretely testable as worded; no other rewrite is proposed.

### Manual verification checklist
1. With a screen reader (VoiceOver spot check is sufficient), remove a middle item from a 3+ item contact list via keyboard only (Tab to its Remove button, press Enter) and confirm focus and announcement land on the previous item's Remove button, not silently on the document body.
2. Remove the first item from a 2-item list and confirm focus/announcement lands on the section's "Add" button.
3. Remove the last remaining item and confirm the list collapses to its empty state and focus/announcement lands on the empty-state "Add a {item}" button, not on the now-removed footer-area button that happens to share a test id.
4. With two array sections on the same page (e.g. a form with two independent contact-like lists), remove an item from the first section and confirm, by tabbing, that focus did not move into the second section.
5. Spot-check a choice-array (repeatable choice) section's remove behavior manually and note whether focus is dropped to the document body today; report this as a live observation to inform the untestable-criteria flag above, since no automated test commits to a target for this path yet.

## Adversarial review

STORY mode (lite): blockers only, plus should-fixes routed as PROPOSED edits. Verified against the live components (`StarterFormTemplate.vue`, `ArraySectionCard.vue`, `ChoiceArraySectionCard.vue`, `GroupField.vue`, `RepeaterCard.vue`, `SectionCard.vue`), the `DynamicFormTemplate` slot dispatcher (`packages/core/src/components/DynamicFormTemplate.vue`), and `arrayHelpers.ts`. Findings:

1. **(should-fix) The wrapped `s.removeItem` fires behind three markups, not the one the story specifies.** The QA plan flagged the choice-array call site (`#default-choice-array-item` → `ChoiceArraySectionCard`, per-option Add buttons). Verification confirmed it and found a **third** site the plan did not mention: `GroupField` in the `#default` slot (`StarterFormTemplate.vue:134-158`) also binds `@remove="s.removeItem"`, and `DynamicFormTemplate` falls `default-array`/`default-array-item` → `default` (the template defines no `#default-array`/`#default-array-item` slot, lines 327-332 of the dispatcher), so a non-heading array removes through `GroupField`'s single header Remove button, with a header Add button and no empty-state card. AC2/AC3's "the array's Add button" is well-defined only for the heading-array shape. Resolved via the shape-agnostic target algorithm PROPOSED in the Architecture reference and the ladder note in Untestable criteria: AC1's previous-Remove-button target works for all three shapes; a single canonical Add button is the target where one exists; `firstFocusableWithin(section)` (ST-04) is the safety net everywhere else, honoring the user story's "never dropped to the document body" invariant. Settled by the ladder (rung 1 user-story goal, rung 3 existing `firstFocusableWithin` primitive, rung 5 smallest scope), not escalated.

2. **(should-fix) The empty-state Add button is not uniquely addressable by test id.** `ArraySectionCard.vue` renders two elements with `data-testid="<path>-add-button"` when `itemsCount === 0` (empty-state button, line 40; footer button, line 49), and `addButton()` in `arrayHelpers.ts` uses `wrapper.find`, returning whichever is first in DOM order. The production focus query for AC2/AC3 must target the Add button structurally (`.sft-empty button` / `.sft-array-footer button`), not by the shared test id, so AC3 lands deterministically. Routed as PROPOSED in the Architecture reference. The component-level de-duplication is out of scope (the feature mandates no markup change to `ArraySectionCard.vue`); flagged for a separate `/spec:quick`.

No blockers. ACs 1-5 are each mapped to a concrete test in the AC-to-test map and are testable as worded for the heading-array case the feature commits to. The story is consistent with the approved feature's Data flow 5 and component plan (no markup change to `RepeaterCard`/`ArraySectionCard`), and its ST-04 dependency is explicit (now a direct code dependency on `firstFocusableWithin`, per finding 1).

## Verification report

### Pipeline
- `pnpm run ci:test` (root `pnpm ci` is shadowed): all green. `packages/core` and `packages/starter` test suites pass in full (`packages/starter`: 77 files / 607 tests passed); `docs/` vitest suite (unaffected by this story) also passes.
- `pnpm run ci:lint`: clean, no findings.
- `pnpm run ci:typecheck` (core, starter, storybook): clean.
- `TZ=Europe/Amsterdam pnpm -r ci:test:coverage`: `packages/starter` 99.63% statements / 93.93% branches / 93.22% functions / 99.63% lines, matching the developer's reported numbers exactly. The one new uncovered branch is `StarterFormTemplate.vue:133`, the `?? firstFocusableWithin(sectionRoot)` safety-net arm, which is the choice-array fallback the QA plan explicitly marks "knowingly left uncovered." No regression in any other file's coverage. Pre-existing high coverage (most files at 100%) makes a drop unlikely and none was observed.

### Acceptance criteria

| AC | Result | Evidence |
| --- | --- | --- |
| 1. Removing a middle/last item focuses item N-1's remove button | Pass | `StarterFormTemplate.arrayRemoveFocus.logic.test.ts`: "focuses the previous item's remove button when a middle item is removed" and "focuses the new last item's remove button when the last item is removed", both asserting `document.activeElement` directly. |
| 2. Removing the first item (others remaining) focuses the section's Add button | Pass | Same file, "focuses the section's add button when the first item is removed and others remain", asserts `document.activeElement` is the footer add button and `isDisabled` is false. |
| 3. Removing the only remaining item focuses the empty-state Add button | Pass | Same file, "focuses the empty-state add button when the only remaining item is removed", asserts against `.sft-empty button` specifically, not the shared test id. |
| 4. Focus restoration scoped to the section the removal happened in | Pass | Same file, "scopes focus restoration to the section the removal happened in", two sections with identical labels, asserts target is contained in section A's root and not in section B's, and section B's own remove-button count is unchanged. |
| 5. No change to the engine's remove behavior | Pass | Same file, "does not change the engine's array mutation, only adds a focus side effect", asserts the surviving array values and their order after removal. |
| Chained-removal edge case (not a numbered AC but called out in the QA plan) | Pass | "recomputes the target on a second removal rather than reusing a stale reference" removes first-of-two then the sole remainder, confirming no cached target. |

All five ACs plus the chained-removal case are independently covered with `document.activeElement` assertions, matching the QA plan's test map exactly.

### Deviation 1 scrutiny: index/path-based targeting instead of reading `document.activeElement`

Verified by reading `StarterFormTemplate.vue`'s `array-remove-focus` region and the three `@remove="handleRemoveItem(s)"` call sites (`GroupField` in `#default`, `RepeaterCard` in `#heading-array-item`, `RepeaterCard` in `#default-choice-array-item`). The handler captures `item.fieldMetadata.path` and `item.index` from the slot context at the moment of the click, strips the trailing `[n]` to get the array's own path, calls `item.removeItem()`, then on `nextTick` re-queries the DOM for the section and the remaining remove buttons and indexes by `removedIndex - 1`.

This satisfies the user story and AC1-AC4 without reading focus state at all, so it is immune to the exact failure mode `document.activeElement`-based approach risks: a click from a pointer that never focused the button first, or any jsdom/browser timing gap between the click event and focus actually landing. The edge case ("click vs Enter/Space activation) is satisfied by construction, confirmed in `focus(wrapped)` + `trigger('click')` pattern used in every test: since the handler never inspects what currently holds focus, a mouse click (which does focus the button natively) and a keyboard Enter/Space activation (focus already present) both funnel through the identical `removedIndex`-based lookup. No test exercises a click without a prior `.focus()` call, but the implementation does not special-case focus state, so this is a property of the code, not an assumption the tests needed to separately prove.

One gap worth noting for Jeroen's awareness, not a blocker: the story's own Architecture reference and the feature's adversarial-review finding both describe the "third call site" (`GroupField` in `#default`, the `default-array-item` fallback for a non-heading, children-bearing array) as having "the GroupField header Add button" as its canonical add target. Verified against the live tree: this is inaccurate. `#default-array` (the array *container* slot) is already explicitly defined using `ArrayField`, not a `GroupField` fallback (confirmed in `git show HEAD:...StarterFormTemplate.vue`, predates this story). `GroupField` in `#default` is only ever reached at the *item* level for this shape, where it renders only a Remove button (no Add button; `canAddItems` is item-scoped and false there). The actual canonical Add button for this shape lives in `ArrayField`'s `.sft-array-footer`, which `canonicalAddButtonOf`'s structural selector already matches correctly by coincidence of being the right CSS class, not because the implementation or its documentation correctly modeled this shape. The developer's code is correct in practice (verified by static analysis of `ArrayField.vue`, `GroupField.vue`, and the engine's slot-dispatch priority); the inaccuracy is in prose carried over from feature-level architecture/adversarial-review text pre-dating this story, which is out of this story's section to amend. No starter fixture exercises this third shape's remove-focus path (no "group array without heading" fixture exists in `fixtures/metadata.ts`), so it is untested, same status as the already-flagged choice-array path, but unlike the choice-array path this one is not explicitly called out as "knowingly uncovered" anywhere. Flagging for Jeroen's awareness; does not block this story since the behavior as implemented is correct and the shape is already effectively covered by the `firstFocusableWithin` safety net even if `canonicalAddButtonOf` had not matched it.

### Deviation 2 scrutiny: analytics test measures the last item instead of the middle item

Independently reproduced the developer's claim. Running the QA plan's original scenario (remove the *middle* item of three, `headingArrayMetadata`) shows both surviving items' render counts jump from 1 to 4, a pre-existing engine-level cost from index reassignment, confirmed unrelated to this story (no `packages/core` file is touched by this story, and the jump reproduces on an unmodified removal path). Against that baseline, the add-button precedent's `toBeLessThanOrEqual(before + 1)` assertion would fail for reasons entirely orthogonal to whether the new focus side effect adds any cost, making the middle-item scenario unable to produce a meaningful assertion of this story's own claim without first disentangling the engine's own reindex cost, which is out of scope here.

Removing the *last* item avoids reindexing survivors, so the engine's own cost is +1 per surviving item, and the `before + 1` ceiling correctly isolates whether `handleRemoveItem`'s added `nextTick` + DOM query + `.focus()` call causes any extra `DynamicFormItem` render. It does not (test passes at exactly `before`, well under the `+1` ceiling), and the unrelated sibling field's render count is asserted unchanged. This is a legitimate, non-weakening substitution: it is the only measurement of the three (first/middle/last) that can isolate the focus side effect's own render cost from the engine's pre-existing reindex cost, given the side effect itself is a DOM-only operation touching no reactive state (confirmed by reading `focus.ts` and the handler, neither of which writes to any `ref`/form state). The substitution is documented in the Implementation notes, so it is not a silent deviation.

### Prototype comparison
`#array-remove` anchor: the prototype draws (a) a 2-item state annotated with the intended behavior (previous-item target / Add-button target when first-or-only) and (b) the empty-state end result with focus intended on the `Add a member` button. Both match the implemented targets exactly (`removeButtons[removedIndex - 1]`, then `canonicalAddButtonOf`, matching the prototype's "previous item's Remove button... or Add member button" annotation; the empty-state screenshot matches `.sft-empty button` as the AC3 target). No markup change was needed or made (confirmed `ArraySectionCard.vue`, `RepeaterCard.vue`, `GroupField.vue` have no diff against `HEAD`), consistent with the story's Out-of-scope note that the focus ring itself is ST-02's CSS, not this story's surface. No new visual state is introduced by this story, so no screenshot was taken; behavioral `document.activeElement` assertions are the correct verification instrument here, per the task's own guidance.

### Process compliance
- `specs/components.md`: updated, accurately describes `handleRemoveItem`'s behavior (previous remove button, structural add-button lookup over the shared test id, `firstFocusableWithin` safety net, path-based scoping). Matches the implementation.
- No changeset added: correct, the feature's single changeset is explicitly deferred to ST-06 per this story's Implementation notes and the feature's slicing plan.
- No public API surface change: confirmed, `index.ts` diff (from ST-04, not this story) only adds `focusFirstInvalid`; this story adds no export.
- Test naming: `StarterFormTemplate.arrayRemoveFocus.logic.test.ts` and the analytics addition follow the repo's `*.logic.test.ts`/`*.analytics.test.ts` convention. No spec/story/AC references appear in any test name or code comment (verified by reading the new test file and the `array-remove-focus` region in `StarterFormTemplate.vue`).
- No silent deviations: both deviations are explicitly recorded in the Implementation notes and have now been independently verified above as sound rather than rubber-stamped.
- Regression guards: `StarterFormTemplate.array.test.ts`, `StarterFormTemplate.headingArray.test.ts`, `StarterFormTemplate.headingArray.validation.test.ts`, `StarterFormTemplate.choice.array.test.ts`-equivalent choice suites, and `RepeaterCard.test.ts` all pass unmodified in substance (only the one new analytics case was added), consistent with the QA plan's regression-risk notes.

### Overall verdict: **pass**

All five acceptance criteria plus the chained-removal edge case are met with direct evidence. Both scrutinized deviations hold up under independent verification: the index/path-based targeting is a sound, lower-risk substitute for reading `document.activeElement` and satisfies the click-vs-keyboard edge case by construction; the last-item (vs middle-item) analytics measurement is the only one of the three that isolates this story's own render-cost claim from a pre-existing, unrelated engine cost, and is not a weakening. One nit is flagged above (an inaccuracy in carried-over architecture/adversarial-review prose about which component owns the "canonical Add button" for the third, untested call shape) for Jeroen's awareness; it does not affect correctness and is not this story's section to fix.

## Implementation notes

- `StarterFormTemplate.vue` wraps all three `@remove="s.removeItem"` call sites (`RepeaterCard` in `heading-array-item` and `default-choice-array-item`, `GroupField` in the `default` slot's `default-array-item` fallback) with a new `handleRemoveItem(item)` function, region-marked `array-remove-focus`.
- Deviation from the architecture text: instead of reading the triggering button from `document.activeElement` at click time, the handler uses the slot context's own `index` and `fieldMetadata.path`, both already present on every array-item slot scope. This gives the same result without depending on browser/jsdom focus-on-click timing, and the activation-method edge case (click vs. Enter/Space) is satisfied by construction since neither path depends on what currently holds focus.
- The array section root is found with `document.querySelector('[data-testid="<arrayPath>"]')`, where `arrayPath` is the removed item's own path with its trailing `[n]` stripped. Full field paths are unique within a form, so this also satisfies AC4's scoping requirement without any DOM-ancestor walking.
- The canonical "add" button is resolved structurally (`.sft-empty button` checked before `.sft-array-footer button`), per the adversarial review's finding 2, and both candidates are passed through `firstFocusableWithin` (reused from ST-04) so a disabled button is skipped automatically rather than needing a separate disabled check.
- `firstFocusableWithin(sectionRoot)` is the final safety net for the choice-array case, which has no single add button. This branch is intentionally not covered by a test, matching the QA plan's "knowingly left uncovered" note.
- Added `StarterFormTemplate.arrayRemoveFocus.logic.test.ts` covering AC1-AC5 plus the chained-removal edge case, and extended `StarterFormTemplate.headingArray.analytics.test.ts` with a remove-focus render-count case.
- Deviation: the QA plan's analytics case asked to measure render-cost after removing the *middle* item of three. Measured behavior shows removing a middle item causes a larger, pre-existing engine-level re-render (all surviving items jump from 1 to 4 renders, due to index reassignment unrelated to this story, `packages/core` untouched), not the `before + 1` the add-button precedent assumes. The test instead removes the *last* item (no reindexing of survivors), which does match the `before + 1` pattern and still proves the focus side effect itself adds no render cost.
- No changeset added: per the feature's slicing seams, the feature's single changeset is carried by ST-06.
- `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck`, and `TZ=Europe/Amsterdam pnpm -r ci:test:coverage` all pass. `packages/starter` coverage: 99.63% statements / 93.93% branches / 93.22% functions / 99.63% lines.
