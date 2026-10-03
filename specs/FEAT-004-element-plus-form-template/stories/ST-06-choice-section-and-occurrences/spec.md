---
id: ST-06
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Choices render as Element Plus sections, single and repeatable

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- AC 6 and 8 → one-based occurrence numbers (`globalIndex + 1`); badge shows the branch label, else `branchKey`
- AC 9 → add controls follow `canAddChoiceOccurrence`, not `used === max`
- AC 11 and 12 → overrides reach repeatable choices via `-choice-array` / `-choice-array-item` slots, matching the core dispatch order
- AC 13 → this story owns inverting the array story's occurrence-card test

## Assumed without Jeroen (no clear winner)

Ties broken by policy during story prep, not decided on the merits. Each names its alternative inline.

- Button text → plain English strings, no labels mechanism (reversible: additive follow-up)


## Functional
### User story
As an end user filling in a form with a choice (pick one of several branches), I want a styled section that lets me select a branch, add more occurrences when the choice is repeatable, and remove them, so that the choice works in the Element Plus template without any extra template code.

As a template author, I want `default-choice`, `default-choice-array`, and `default-choice-array-item` (and their per-type variants) to be overridable with built-in Element Plus fallbacks, so that I can change only the choice chrome.

### Acceptance criteria

Each criterion is verifiable by a Vitest component test (mounting inside `DynamicForm` with `choice` metadata in automatic and explicit selection modes) unless marked manual.

**Single choice (`default-choice`)**

1. **A single choice shows branch selection.**
   Given a choice with branches `a`, `b`, `c` (`maxOccurs: 1` explicit selection mode), no branch active,
   When it renders,
   Then a section shows one add/select control per branch (the branch list is read from `fieldMetadata.choice`; for each entry the section uses `canAddChoiceOccurrence(branchKey)` to enable or disable it) and no branch content yet.

2. **Selecting a branch activates it.**
   Given the same choice,
   When the test clicks the control for branch `b`,
   Then `addChoiceOccurrence('b')` runs, `activeChoiceOccurrences` contains `{ branchKey: 'b', index: 0 }`, and branch `b`'s content renders inside the section via the `input` slot fallback chain.

3. **Switching and deselecting.**
   Given branch `b` is active,
   When the test clicks the section's remove control for `b`,
   Then `removeChoiceOccurrence('b')` runs and the section returns to the unselected state; selecting branch `a` afterwards activates `a`.

4. **Disabled branches and disabled choice.**
   Given a choice whose `canAddChoiceOccurrence(branchKey)` is false for a branch (shared budget exhausted or choice disabled),
   When it renders,
   Then that branch's control is disabled and clicking it has no effect.

**Repeatable choice (`default-choice-array`, `default-choice-array-item`)**

5. **`default-choice-array` renders the repeatable section.**
   Given a choice with `maxOccurs: 3`,
   When it renders,
   Then the section shows a per-branch add control and a counter built from `usedChoiceOccurrences` and the choice's `maxOccurs` ("N of max" style, text is not asserted beyond the numbers), and the occurrences render inside via the `input` slot fallback chain.

6. **Occurrence card per occurrence.**
   Given two occurrences added (branches `a` then `b`),
   When they render,
   Then `default-choice-array-item` renders one card per occurrence, showing a kind badge (the branch's `label` from the occurrence's `fieldMetadata` when present, else `branchKey`), the occurrence's one-based position (`globalIndex + 1`), and a remove control calling `removeItem`.

7. **Insertion order is shown only when present.**
   Given an occurrence added this session (`insertionOrder` defined) and one loaded from initial values (`insertionOrder` undefined),
   When both render,
   Then the added-order indicator appears only on the first; the second renders without it and without error.

8. **Numbering renumbers live.**
   Given three occurrences,
   When the middle one is removed,
   Then the remaining cards' displayed one-based numbers (`globalIndex + 1`) update to 1 and 2 with no stale numbers.

   DECIDED (research): numbers are one-based (`globalIndex + 1`) and the badge shows label-else-`branchKey`.
   Why: the criterion needs a single assertable value; the story's own edge case already defines branch display as label else name, and `ChoiceArrayItemAttributes` exposes only `branchKey` while the occurrence's `fieldMetadata` carries the branch `label`. A display choice with no API effect, matching the existing edge case.
   Sources: `packages/core/src/components/DynamicFormItemChoice.vue` (`globalIndex` is the v-for index, `field-metadata` is the branch node), this story's edge cases

9. **Limits are honoured.**
   Given a repeatable choice whose shared budget is exhausted for a branch (`canAddChoiceOccurrence(branchKey)` false),
   When it renders,
   Then that branch's add control is disabled; a branch with its own `maxOccurs > 1` whose batch is not yet full stays addable even when the counter reads its maximum.

   DECIDED (research): add controls follow `canAddChoiceOccurrence(branchKey)`, never `usedChoiceOccurrences === maxOccurs`. The counter is display only.
   Why: `canAddChoiceOccurrence` compares the branch's raw count against `occurrences[index].overrideChildMaxOccurrences`, which already folds in the branch's own `maxOccurs` batch size and `maxOccursTotal`, while `usedChoiceOccurrences` counts in choice-slot units. A child's `maxOccurs` is per iteration, not a per-branch cap, so `used === max` would disable a branch the XSD math still allows. Test with a choice `maxOccurs: 2` fixture (a `maxOccurs: 1` choice renders single and always returns true).
   Sources: `packages/core/src/components/DynamicFormItemChoice.vue` (`canAddChoiceOccurrence`, `usedChoiceOccurrences`)

**Modes, overrides, and fallbacks**

10. **Explicit mode shows selection controls; automatic mode renders children only.**
    Given the same template mounted with an automatic-mode choice and an explicit-mode choice,
    When each renders and is interacted with,
    Then both render through the same fallbacks; the branch select/add/remove controls appear only when `fieldMetadata.explicitChoiceSelection` is set, the automatic-mode section renders the active children with no selection controls, and no interaction offered by the built-in section can clear a sibling branch's user-entered value in automatic mode.

    DECIDED (Jeroen): option 1. The section reads `fieldMetadata.explicitChoiceSelection` and renders branch select/add/remove controls only in explicit mode; in automatic mode it renders the children only. The feature's Data flow "Choice" bullet is amended accordingly (done), so this is no longer a gap.
    Resolved history, for context: the parked note read: OPEN (needs Jeroen): this criterion cannot be satisfied as written together with a non-destructive automatic mode. Case 3: a real gap in the approved feature, Data flow "Choice" bullet ("works for both automatic and explicit selection modes with no template branching").
    Verified in core: the engine binds the same `addChoiceOccurrence`/`removeChoiceOccurrence`/`canAddChoiceOccurrence` slot props in both modes, and in automatic mode `addChoiceOccurrence('b')` on a `maxOccurs: 1` choice iterates `activeChoiceOccurrences` (which includes value-driven branches) and calls `clearBranch` on the others, wiping entered data without feedback. No slot prop distinguishes the modes; only `fieldMetadata.explicitChoiceSelection` does. The docs template avoids this by showing its selector cards only when an opt-in `choiceShowChoiceSelect` metadata property is set.
    Options:
    1. Read `fieldMetadata.explicitChoiceSelection`: render branch select/add/remove controls only in explicit mode; in automatic mode render the children only. No new public surface and a local, reversible edit, but it needs the feature amended (Data flow Choice bullet and this criterion), because it is template branching on the mode. Recommended.
    2. Mirror the docs pattern with a new opt-in extended property on `ElementPlusFieldProperties` (for example `choiceShowChoiceSelect`). Consumer decides, no mode read, but it adds public API surface and leaves explicit mode with nothing to click unless the property is set.
    3. Stay mode-agnostic by disabling a branch's add control while another branch is active. Needs no mode read, but it removes click-to-switch in explicit mode and makes preserve-on-switch unreachable from the built-in section.
    Feature amendment needed: Data flow, "Choice" bullet.

11. **Overridable with built-in fallback.**
    Given a wrapper overriding only `#default-choice-array-item`,
    When a repeatable choice renders,
    Then the section uses the built-in chrome and each occurrence uses the consumer's markup; overriding only `#default-choice` changes single choices only and leaves repeatable choices on the built-in section.

12. **Per-type variants are forwarded.**
    Given a wrapper supplying `#text-choice` (single choices) and `#text-choice-array` / `#text-choice-array-item` (repeatable choices),
    When a choice whose field type is `text` renders,
    Then the consumer's markup renders for that shape (proving the generic forward covers the choice slots), a `#text-choice` override does not reach a repeatable choice, and other types still use the built-in section.

    DECIDED (research): consumer overrides reach repeatable choices through the `-choice-array` and `-choice-array-item` slot names (enumerated `default-*` or forwarded per-type), not through `-choice` or `-array-item`.
    Why: `typeWithFallback` returns the dedicated `default-choice-array` and `default-choice-array-item` tier before falling back to `<type>-choice` or `<type>-array-item`, and this template always defines both. That ordering is core's approved dispatch contract; the ST-02 forward passes per-type names such as `text-choice-array` straight through. Worth stating in the package README.
    Sources: `packages/core/src/components/DynamicFormTemplate.vue` (`typeWithFallback`)

13. **Dispatch precedence is respected.**
    Given a repeatable choice,
    When the dispatcher resolves the slot,
    Then the `-choice-array` family wins over the plain `-array` family (core behaviour), and with `default-choice-array` and `default-choice-array-item` defined by the template, a repeatable choice no longer renders through the array-section and array-item fallbacks from the array story.

    DECIDED (research): this story inverts or removes the array story's test that asserts repeatable-choice occurrences render through the array-item card.
    Why: once `default-choice-array-item` exists, `typeWithFallback` returns it before `<type>-array-item` / `default-array-item`, so that assertion becomes false by design and would turn `ci:test` red.
    Sources: `packages/core/src/components/DynamicFormTemplate.vue` (`-choice-array-item` branch)

14. **Plain CSS only.**
    Given the new markup,
    When reviewed,
    Then chrome uses Element Plus primitives (`ElCard`, `ElButton`, `ElTag` or equivalent for the kind badge, `ElDivider` for separators if needed) and scoped CSS added to the package stylesheet, with no Tailwind classes; the source-scan test from the CSS story stays green. The kind badge uses `ElTag` or plain scoped CSS, not `ElSpace`/`ElRow`/`ElCol`.

15. **Code hygiene.**
    Given all new source and test files,
    When reviewed,
    Then no comment or test name references specs or process artifacts (FEAT, ST, AC, ADR, finding numbers), there are no em dashes, and `ci:test`, `ci:lint`, `ci:typecheck` pass for `packages/element-plus`.

### Edge cases
- Choice with a single branch.
- A branch that is itself a group with children, an array, or a wizard: the nested shape renders through its own fallback inside the occurrence.
- Initially loaded values activate the matching branches without any click.
- Removing the only active occurrence of a required choice: validation (`xsd_choiceMinOccurs`) is the engine's; the section only shows the state.
- Branch display names come from the branch's `label` if present, else its `name`.

### Open points
- ASSUMED (story prep): built-in button text ("Add", "Remove", the counter) is plain English strings in this version, overridable by overriding the slot; no labels mechanism.
  Why: no clear winner. The feature spec defines no labels or i18n mechanism, the only precedent in this package is the hard-coded "Click to upload", and the core settings `messages` mechanism covers validation messages only.
  Tie broken on: smallest scope (no new setting, prop, or export).
  Alternative: a settings-driven labels mechanism. Adding it later is additive and non-breaking, so reversing costs a follow-up feature, not a breaking change.

### Out of scope
- Plain array and wizard chrome.
- Drag-to-reorder of occurrences.
- `packages/core` is untouched; the package stays `private: true`, so no changeset.

## Design reference
No prototype. Structure mirrors the docs site's choice section card and choice-array section card, rebuilt with Element Plus components. Visual details are the developer's call within Element Plus defaults.

## Architecture reference
Implements seam 2 (choice half): `default-choice`, `default-choice-array`, `default-choice-array-item` fallbacks in `ElementPlusFormTemplate.vue` (optionally internal presentational sub-components). Slot scope: `ChoiceAttributes` (`activeChoiceOccurrences`, `addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `usedChoiceOccurrences`) for the section; `ChoiceArrayItemAttributes` (`branchKey`, `globalIndex`, `insertionOrder`, `removeItem`) for an occurrence.

Depends on ST-02 (forwarding contract), ST-04 (stylesheet build and export), and ST-05 (occurrence cards reuse the array item card conventions and the dispatch-interaction in ST-05's criterion 7 is resolved here). Independent of ST-07.

## QA plan

### Scope and approach
All behaviour is exercised by mounting `DynamicForm` with `ElementPlusFormTemplate` (bare) or a thin consumer wrapper (for override criteria), the same way the engine drives it in a real app. Nothing reaches into `setupState`; state is read through rendered output and the public slot-prop contract. The engine's own choice semantics (occurrence budget, clearing, ordering) are already covered by `packages/core` tests and are not re-tested here; this story only proves that the Element Plus chrome wires the slot props correctly.

### Test files (all under `packages/element-plus/src/__tests__/`)
| File | Holds |
| --- | --- |
| `ElementPlusFormTemplate.choice.test.ts` | Structure and slot wiring: what renders for each state, override and forward behaviour (AC 1, 5, 6, 7 display, 11, 12, 13) |
| `ElementPlusFormTemplate.choice.logic.test.ts` | Interaction behaviour: select, switch, deselect, add, remove, renumber, limits, disabled, both modes, initial values (AC 2, 3, 4, 8, 9, 10, edge cases) |
| `ElementPlusFormTemplate.choice.validation.test.ts` | Validation state shown by the section (required choice error appears and clears) |
| `ElementPlusFormTemplate.choice.analytics.test.ts` | Render-count guard for unaffected occurrences |
| `choice.test-helpers.ts` (not a test file) | Metadata fixtures, mount helper, selector readers (see below) |
| Extend the source-scan test created for the CSS story | Tailwind, `ElSpace`/`ElRow`/`ElCol`, em dash, and process-reference scans (AC 14, 15) |

### Fixtures and utilities
- Reuse, do not duplicate: the mount helper and wrapper-template helper introduced by the slot-forwarding story (bare mount, wrapper with `#input`/`#attributes` forwards plus injectable override slots), and `enableDisplayOrder` semantics from core's choice helpers (the patch-by-path idea; re-implement the 10-line version locally, because core's `__tests__` helpers are not an importable surface).
- New in `choice.test-helpers.ts`, mirroring core's `DynamicFormItemChoice.test-helpers.ts` readers but driven by the testid contract below: `addButton(wrapper, choicePath, branch)`, `removeButton(...)`, `isBranchAddEnabled(...)`, `counterNumbers(wrapper, choicePath)` (returns `{ used, max }` parsed from the counter text), `occurrenceCards(wrapper, choicePath)`, `kindBadge(wrapper, occurrencePath)`, `occurrenceNumber(wrapper, occurrencePath)`, `insertionOrderIndicator(wrapper, occurrencePath)`.
- Metadata fixtures (plain objects, `explicitChoiceSelection` set per fixture): `explicitSingle` (branches `a`, `b`, `c`, text leaves with labels), `explicitRepeatable` (`maxOccurs: 3`, same branches), `explicitRepeatableBatched` (choice `maxOccurs: 2`, branch `a` with `maxOccurs: 2`, branch `b` plain), `autoSingle`, `autoRepeatable`, `singleBranchExplicit`, `groupBranch` (branch with `children`), `arrayBranch` (branch with `maxOccurs: 2`), `disabledChoice` (`maxOccurs: 0` via the choice itself), `requiredExplicit` (`minOccurs: 1`).
- Initial values go through the form's `initialValues` (the same route core's choice tests use).
- Prerequisite: `@bach.software/vue-dynamic-form` must resolve in the package's vitest run (the `workspace:*` dev dependency reads the built core). This is established by the foundation story's tooling; if core must be built first, `ci:test` ordering is the foundation story's concern, called out here so a red run is not misread as a choice defect.

### Test-hook contract (needs to be stated in the story, see finding 4)
Follow the `data-testid` naming core's own choice harness already uses, so helpers and assertions stay portable. `ElButton`/`ElTag` forward `data-testid` to their root element.
- `<choicePath>.<branch>-add-choice-button`, `<choicePath>.<branch>-remove-choice-button` (single choice: rendered for the active branch only)
- `<choicePath>-choice-counter` (text contains used and max numbers), `<choicePath>-error-message`
- Occurrence card root `<occurrencePath>-choice-occurrence`; inside it `<occurrencePath>-kind-badge`, `<occurrencePath>-global-index` (the displayed, one-based number), `<occurrencePath>-insertion-order` (only when `insertionOrder` is defined), `<occurrencePath>-remove-choice-button`
- Package-owned CSS class names are not asserted beyond what the CSS story already does.

### Acceptance criteria to test map
Test names below are plain behaviour sentences (no process references).

| AC | Test (file) | What it asserts |
| --- | --- | --- |
| 1 | `choice.test.ts`: "shows one add control per branch and no branch content before selection" | Explicit single, nothing active: three add buttons (labels from branch `label`, else `name`), no input rendered, no remove button, a container that is an `ElCard`/EP primitive |
| 1 | `choice.logic.test.ts`: "enables an add control only for branches that can still be added" | Enabled state of each add button equals the slot's `canAddChoiceOccurrence` result (compare against a disabled-branch fixture, not a reach-in) |
| 2 | `choice.logic.test.ts`: "selecting a branch renders that branch's field" | Click add on `b`: branch `b` input exists and was produced through the `input` fallback chain, `a` and `c` inputs do not, only `b` shows a remove control. Value typed into `b` lands in the form values under `pick.b` |
| 3 | `choice.logic.test.ts`: "removing the active branch returns to the unselected state and another branch can be selected" | Remove `b`: input gone, add controls back; then add `a`: `a` input renders; typed value of `b` is not resurrected |
| 3 | `choice.logic.test.ts`: "switching directly from one branch to another shows only the new branch" | Active `b`, click add on `a`: only `a` renders (engine clears `b`), no two branches at once |
| 4 | `choice.logic.test.ts`: "disables add controls for a disabled choice and ignores clicks" | `maxOccurs: 0` fixture: every add button has the `disabled` attribute, click leaves nothing rendered |
| 4 | `choice.logic.test.ts`: "disables add controls for a branch whose shared budget is exhausted" | Repeatable fixture at budget: disabled attribute present, click does not add a card |
| 5 | `choice.test.ts`: "repeatable choice shows per-branch add controls and a used-of-max counter" | Fixture `maxOccurs: 3`, zero occurrences: counter shows 0 and 3; after two adds shows 2 and 3 (numbers only, no wording asserted). Content renders via the `input` chain |
| 5 | `choice.logic.test.ts`: "counter counts in choice slots, not raw items" | `explicitRepeatableBatched`: add two items of batched branch `a`: counter used is 1 (not 2). Guards the unit the section must display |
| 6 | `choice.test.ts`: "renders one card per occurrence with kind badge, number, and remove control" | Add `a` then `b`: two cards in DOM order, badges read the branch label/name `a` then `b`, numbers 1 and 2, each card has a remove button |
| 6 | `choice.logic.test.ts`: "card remove control removes exactly that occurrence" | Three occurrences, remove the middle card: the other two keep their entered values and branches |
| 6 | `choice.test.ts`: "card uses the card primitive and the remove control is a button" | Card is an `ElCard`, remove is an `ElButton` (component presence) |
| 7 | `choice.test.ts`: "shows the added-order indicator only for occurrences added this session" | Initial values provide one occurrence (no indicator, no error), then add one via the button (indicator present with the expected order number) |
| 7 | `choice.test.ts`: "an occurrence loaded from initial values renders without an indicator or warnings" | Spy on `console.warn`/`console.error`, assert none |
| 8 | `choice.logic.test.ts`: "renumbers remaining occurrences after a removal" | Three occurrences (numbers 1, 2, 3), remove the middle: DOM shows exactly 1 and 2, no stale 3. Uses one-based display (see finding 3) |
| 8 | `choice.logic.test.ts`: "numbers follow the displayed order when occurrences are shown in the order they were added" | `displayOrder: 'added'`: add `b` then `a`: cards in DOM order `b`, `a` numbered 1, 2 |
| 9 | `choice.logic.test.ts`: "disables every add control once the shared budget is used up" | Plain-branch fixture, add until counter used equals max: all add buttons disabled, click adds nothing; remove one: all re-enable |
| 9 | `choice.logic.test.ts`: "a batched branch stays addable after the counter reaches its maximum until its own batch is full" | Characterises finding 2: the add control follows `canAddChoiceOccurrence`, not `used === max` |
| 10 | `choice.logic.test.ts`: "explicit and automatic choices both render through the same fallbacks" | Mount both fixtures with the same template: no throw, no Vue warn, section chrome present for each; see finding 1 for what automatic mode must show |
| 10 | `choice.logic.test.ts`: "automatic choice does not clear or hide a branch's entered value when the section is interacted with" | Spike test for finding 1: type into branch `a` in automatic mode, click any section control, assert value survives. Decides whether controls may exist in automatic mode |
| 11 | `choice.test.ts`: "overriding only the occurrence slot keeps the built-in section chrome" | Wrapper supplies `#default-choice-array-item`: built-in counter and add controls present, each occurrence shows the consumer markup |
| 11 | `choice.test.ts`: "overriding only the repeatable section slot keeps the built-in occurrence card" | Wrapper supplies `#default-choice-array`: consumer section markup, occurrences still render as built-in cards |
| 11 | `choice.test.ts`: "overriding only the single-choice slot leaves repeatable choices on the built-in section" | Documents that `default-choice` does not reach repeatable choices because the built-in repeatable slot always exists (finding 5); also the reverse |
| 12 | `choice.test.ts`: "a per-type single-choice slot replaces the built-in section for that type only" | Wrapper supplies `#text-choice`: consumer markup for the `text` single choice; a choice with another type (extended metadata fixture) still gets the built-in section |
| 12 | `choice.test.ts`: "per-type repeatable section and occurrence slots are forwarded" | `#text-choice-array` and `#text-choice-array-item`: consumer markup wins over the built-in defaults |
| 13 | `choice.test.ts`: "a repeatable choice no longer renders through the array section and array item fallbacks" | Bare mount: occurrences render as the choice occurrence card (kind badge present), none of the array section/item testids exist; with only the array fallbacks overridden by the consumer, their markup does not appear for a repeatable choice |
| 13 | Edit of the existing array-story test that asserts repeatable-choice occurrences use the array-item card | Invert or remove it in this story (finding 6), so `ci:test` does not go red on a now-intended change |
| 14 | source-scan test (extended): "uses no Tailwind utility classes in choice markup" | Generic pattern scan (see finding 7) over all `.vue`/`.ts` sources; fails on `flex-wrap`, `grid`, `gap-N`, `ms-N`, `ps-N`, `border-s-N`, `text-red-N` style tokens in `class` attributes |
| 14 | source-scan test: "does not use ElSpace, ElRow, or ElCol" | Grep imports/tags in `src/` |
| 14 | `choice.test.ts` (covered above) | Card is `ElCard`, buttons are `ElButton`, kind badge is `ElTag` or a package-owned class (either passes, both allowed by AC) |
| 15 | source-scan test: "contains no em dashes and no process references in source or test files" | Scans `src/` incl. tests; build the forbidden patterns dynamically so the scan file does not match itself |
| 15 | `pnpm --filter ./packages/element-plus run ci:test`, `ci:lint`, `ci:typecheck` | Run in the verification phase; all must be green |

Edge cases beyond the AC list:
| Edge case | Test |
| --- | --- |
| Single-branch choice | `choice.logic.test.ts`: explicit fixture with one branch: still shows add then the branch; automatic single-branch (engine renders the child directly) mounts without error |
| Branch that is a group | `choice.logic.test.ts`: `groupBranch`: add renders the group's children inside the occurrence/section; repeatable version: add twice gives two cards each with the children |
| Branch that is an array | `choice.logic.test.ts`: `arrayBranch` inside a single choice renders through the array section from the array story, not a choice card |
| Branch that is a wizard | Deferred: the wizard fallbacks land in a later story. Covered by a manual check once both are merged (see checklist); a test here would assert against a fallback that does not exist yet |
| Initial values activate branches without a click | `choice.logic.test.ts`: single (`initialValues: { pick: { b: 'x' } }`) renders `b`, remove shown, no click; repeatable with two loaded occurrences renders two cards, counter reflects them |
| Removing the only active occurrence of a required choice | `choice.validation.test.ts` (below) |
| Branch display name | `choice.test.ts`: branch with `label` shows the label, branch without shows its `name` |

### Component states asserted (states policy for this slice)
- Empty: explicit single and repeatable with nothing selected (AC 1, 5), plus the empty repeatable after removing the last occurrence (layout not broken, add controls present).
- Populated: one and several occurrences, initial-value load.
- Disabled: whole choice disabled (AC 4), budget-exhausted branch (AC 4, 9).
- Error: `choice.validation.test.ts`: required explicit choice (`minOccurs: 1`), user triggers validation with no selection: the section shows the choice error message at `<path>-error-message`; after selecting a branch and re-validating the message is gone. Repeatable version: required, remove the last occurrence, error appears. Only presence/absence and non-empty text are asserted, not wording.
- Loading: not applicable (choice rendering has no async state); stated here so its absence is deliberate.
- Validation of nested fields: a required leaf inside the active branch shows the standard field error inside the section (proves nested content keeps its chrome).

### Reactivity
The slice adds no `computedProps`, `DynamicFormItem` change, or validation wiring, so no new reactivity logic. One cheap guard is still worth it because the section consumes slot props that the engine deliberately keeps referentially stable (memoized add/remove handlers): `choice.analytics.test.ts` mounts an explicit repeatable choice with `analytics: true`, adds a first occurrence, records the `<occurrencePath>-analytics-render-count` of that occurrence's item, adds a second occurrence, and asserts the first item's count did not change. Assert the delta (zero), never an absolute number. If that delta turns out to be vacuous because the count can only be driven by the engine, keep the test as a documented guard rather than deleting it.

### Coverage
- The package has no real tests today, so the baseline is effectively zero and cannot drop; the target for this story is that every new branch in the choice markup (each `v-if`, each disabled expression, the `insertionOrder` conditional, the label-or-name fallback) is reached by a test above. Run `pnpm --filter ./packages/element-plus run ci:test:coverage` and read the uncovered lines for the new SFC section before handing over.
- Knowingly left uncovered: nothing in the choice markup. The wizard-branch edge case is covered manually until the wizard story lands, and scoped CSS is not measured by v8 coverage.
- `pnpm -r ci:test:coverage` must stay green for `packages/core` (untouched).

### Time sensitivity
No date or time dependent behaviour. Tests still run through `ci:test` (`TZ=Europe/Amsterdam`), nothing to adapt.

### Regression risks and guarding tests
- Array section and item fallbacks (array story): repeatable-choice occurrences stop resolving to the array-item card. The array story's interaction test must change in this story (finding 6). Guard: the array story's other tests must stay green unchanged.
- Slot-forwarding contract (forwarding story): two new enumerated fallbacks (`default-choice`, `default-choice-array`, `default-choice-array-item`) extend the exclusion set of the generic forward. Guard: the existing "forward excludes exactly the enumerated names" test must be updated to include them, or it fails; run it.
- Bare `default` and `default-input` fallbacks: choice branch content renders through them; guard: the existing bare-usage tests.
- Stylesheet build (CSS story): new scoped styles join the same stylesheet; guard: the `dist/style.css` build check and the Tailwind scan.
- Wizard story: independent; a wizard nested in a choice branch is the only interaction (manual).
- Core: untouched; its tests run under `pnpm -r ci:test` as a whole-repo safety net.

### Manual verification checklist
1. Storybook (or a scratch page): explicit single choice: select, switch, deselect; sections look like Element Plus cards, buttons aligned, no overflow at narrow width.
2. Repeatable choice: add several occurrences across branches, remove from the middle, confirm renumbering and the counter read sensibly; confirm the added-order indicator is visually clear and absent for loaded occurrences.
3. Automatic mode choice: confirm the section looks sensible and offers nothing misleading (per the decision on finding 1).
4. Required choice with error: error text is visible and legible in the section.
5. Disabled choice: controls look disabled.
6. Wizard-branch edge case: once the wizard story is merged, put a wizard inside a choice branch and confirm the page navigation and choice selection do not interfere.
7. Open the built `dist/style.css` consumer (or Storybook) without Tailwind present and confirm the section spacing still looks right.
8. Check both Element Plus colour modes only if a dark mode exists in the playground; dark mode is out of scope for the feature, so skip otherwise.

### Findings and proposed rewrites
1. **Should-fix, AC 10: automatic mode is under-specified and the obvious implementation is destructive.** In automatic mode every branch always renders; `activeChoiceOccurrences` is value-driven only. The section receives the same `addChoiceOccurrence`/`removeChoiceOccurrence` slot props. For `maxOccurs: 1`, `addChoiceOccurrence` marks a branch "explicitly selected" and clears every other value-driven branch, yet nothing visibly changes in automatic mode, so a user pressing a section control loses entered data with no feedback. For `maxOccurs > 1` the effect is unclear (it pushes into the branch's field array, which in automatic mode is also owned by the branch's own array section). AC 10 also forbids the template from reading a mode flag, so it cannot hide the controls. Proposed rewrite: "In automatic mode the section shows the title, the error message, and every branch's content, and offers no add or remove controls; the template reads the mode from `fieldMetadata.explicitChoiceSelection`", or alternatively state that the section shows the controls and they must be non-destructive. Needs a decision. The spike test in the AC 10 row settles what the engine actually does before the decision is made.
2. **Should-fix, AC 9: false when a branch has its own `maxOccurs > 1`.** The counter is in choice-slot units (`ceil(items / branchMax)`), while `canAddChoiceOccurrence` compares raw branch item count against the remaining shared budget. Example: choice `maxOccurs: 1`, branch `a` with `maxOccurs: 2`, one item of `a`: `usedChoiceOccurrences` is 1 (equals max) yet `a` can still take a second item, so its add control stays enabled. Proposed rewrite: "Every branch's add control is disabled exactly when `canAddChoiceOccurrence(branchKey)` is false; for choices whose branches all have `maxOccurs: 1` this is when `usedChoiceOccurrences` equals the choice's `maxOccurs`." Planned tests cover both cases.
3. **Should-fix, AC 8 (and 6): "1 and 2 (or 0-based per the chosen display)" is not testable.** An assertion needs one value. Proposed rewrite: "cards show a one-based number (`globalIndex + 1`)", exposed at `<occurrencePath>-global-index`.
4. **Should-fix, AC 5 to 7: no stable selectors are defined** for the counter, kind badge, number, added-order indicator, or remove controls, and "indicator" and "badge" are not findable by role. Proposed: add the test-hook contract above to the Architecture reference (testids following core's existing choice harness naming).
5. **Should-fix, AC 11 and 12: dispatch means consumer overrides of the `-choice` family never reach repeatable choices once the built-in repeatable slots exist.** The dispatcher checks `default-choice-array` before falling back to `<type>-choice`/`default-choice`, and likewise `default-choice-array-item` before `<type>-array-item`. Because the template always defines the `default-choice-array*` fallbacks, a consumer's `#text-choice` or `#default-choice` only affects single choices, and `#text-array-item` never affects choice occurrences. AC 12 as written is only true for a single choice. Proposed rewrite: state AC 12 for a single choice, add a second sentence covering `#text-choice-array` and `#text-choice-array-item` for repeatable choices, and record the `default-choice`-does-not-reach-repeatable behaviour as a documented caveat for the README story. The second half of AC 11 ("overriding only `#default-choice` keeps built-in occurrence rendering for nested content") should be reworded the same way.
6. **Should-fix, AC 13: name the test that must change.** The array story's criterion 7 asserts that a repeatable-choice occurrence renders through the array-item card; that becomes false here. Add "and the array story's interaction test is inverted or removed in this story" to AC 13 so the change is deliberate and the suite stays green.
7. **Nit, AC 14: the CSS story's scan list** (`flex`, `items-center`, `gap-2`, `my-4`, `text-lg`, `font-semibold`, `mb-2`, `flex-col`) misses the classes most likely to be copied from the core example template's choice markup (`flex-wrap`, `grid`, `gap-6`, `ms-6`, `ps-2`, `border-s-2`, `text-red-500`). Proposed: extend the scan with a generic Tailwind-token pattern over `class` attributes so this story's markup is actually covered, and add the `ElSpace`/`ElRow`/`ElCol` import check the AC already promises.
8. **Nit, missing criterion: the edge case "removing the only active occurrence of a required choice ... the section only shows the state" has no acceptance criterion.** Proposed AC 16: "Given a required choice with no active branch after a validation attempt, the section shows the choice's error message, and the message clears once a branch is selected." Planned in `choice.validation.test.ts`.
9. **Nit, edge case "branch that is a wizard"** cannot be tested in this story because the wizard fallbacks do not exist yet; manual check after the wizard story lands (listed above).
10. **Nit, tooling dependency:** the tests need `@bach.software/vue-dynamic-form` to resolve in vitest (built core). Owned by the foundation story; flagged here so a missing build is not mistaken for a choice regression.

No criterion is fully untestable. AC 8 is untestable as written until finding 3 is applied, AC 10 is testable against its decided wording (controls gated on `explicitChoiceSelection`), AC 15's "when reviewed" parts are covered by the source-scan test plus lint, and the wizard-branch edge case is manual only.

## Adversarial review
Lite, story level. Blockers-focused. (Reviewer running as opus.) The QA planner's should-fix findings were all re-derived against core rather than taken on trust; the verdicts are below.

1. **BLOCKER, AC 10: automatic-mode choice controls cause silent end-user data loss, and the leading proposed fix contradicts the approved feature.** This escalates the QA plan's finding 1 from should-fix to blocker and confirms its mechanics against core. In automatic mode (`explicitChoiceSelection` false) the engine still renders through the `-choice`/`-choice-array` fallbacks and binds the same `addChoiceOccurrence`/`removeChoiceOccurrence`/`canAddChoiceOccurrence` slot props unconditionally (`DynamicFormItemChoice.vue` binds them on the template `component` regardless of mode; `slotType` keys only off `maxOccurs`, not the mode). If the Element Plus section renders add/remove controls, clicking "add b" on a `maxOccurs:1` automatic choice runs `addChoiceOccurrence('b')`, whose `maxOccurs <= 1` path iterates `activeChoiceOccurrences` (which includes any value-driven branch) and calls `clearBranch('a')`, wiping branch `a`'s already-entered value with no feedback. AC 10 forbids the template from reading a mode flag and the feature's Data flow requires "no template branching", so the QA plan's first proposed rewrite (template reads `fieldMetadata.explicitChoiceSelection`) contradicts the approved FEAT-004 and, per the story-cannot-silently-override-the-feature rule, cannot be adopted here without amending the feature first. Unresolved: needs Jeroen's decision between amending the feature (permit the mode read) or a mode-agnostic non-destructive rule derivable from slot props. Routed as a PROPOSED note under AC 10.

2. **Confirmed (should-fix, QA finding 5), AC 11 and 12: consumer `-choice` overrides never reach repeatable choices.** Verified against `DynamicFormTemplate.vue` `typeWithFallback`: a repeatable choice dispatches `type = '<t>-choice-array'`, and because the Element Plus template always defines `default-choice-array`, the `-choice-array` branch returns it before ever falling through to `<t>-choice`/`default-choice`; likewise `default-choice-array-item` is returned before `<t>-array-item`. So `#text-choice`/`#default-choice` affect single choices only, and `#text-array-item` never affects occurrences. The `-choice-array`/`-choice-array-item` per-type slots do reach repeatable choices via the ST-02 generic forward plus the exact-name match at the top of `typeWithFallback` (verified the forward excludes only reserved and enumerated names). The QA plan already routed the AC 11/12 rewrite as PROPOSED; verdict stands, no further action.

3. **Confirmed (should-fix, QA finding 2), AC 9: `canAddChoiceOccurrence` is not `used === max`.** Verified: `canAddChoiceOccurrence` compares raw `branchCount` against `occurrences[index].overrideChildMaxOccurrences` (which already folds in the branch's own `maxOccurs` batch size and `maxOccursTotal`), while `usedChoiceOccurrences` is in batched choice-slot units, so a branch with its own `maxOccurs > 1` can stay addable past `used === max`. The QA plan's rewrite tying the AC to `canAddChoiceOccurrence` is correct and routed. Note: the worked example in QA finding 2 ("choice `maxOccurs: 1`") is internally inconsistent (a `maxOccurs:1` choice renders single, not repeatable, and single-mode `canAddChoiceOccurrence` always returns true); the `explicitRepeatableBatched` fixture (choice `maxOccurs: 2`) is the correct vehicle. Nit, does not change the routed rewrite.

4. **Confirmed (should-fix, QA finding 6), AC 13: the ST-05 criterion-7 test must be inverted here.** Verified: once `default-choice-array-item` exists, `typeWithFallback` returns it for a `-choice-array-item` type before the `-array-item` fallback, so ST-05's assertion that occurrences render through the array-item card becomes false. AC 13 already names this; routed. Dependency note: ST-05 is still at `qa` and implementation order puts it before ST-06, so the test will exist to invert.

5. **Nit, AC 6: "kind badge derived from `branchKey`" vs the "label else name" display rule.** `ChoiceArrayItemAttributes` exposes `branchKey` (always the branch `name`), not a label. The edge case "branch display names come from `label` if present, else `name`" can only be honoured on an occurrence card by reading `fieldMetadata.label` (the occurrence's `fieldMetadata` is the branch node, which carries `label`). Clarify whether the kind badge shows `branchKey` (name) or the label-else-name display value, so the AC 6 test and the `kindBadge` reader assert the same thing. Non-blocking.

No new blocker beyond finding 1. Findings 2 to 4 are should-fixes already routed as PROPOSED by the QA planner and re-verified here; finding 5 is a nit.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

Built in `packages/element-plus/src/ElementPlusFormTemplate.vue`: `default-choice`, `default-choice-array`, `default-choice-array-item` fallbacks (all three added to the unforwarded slot names), scoped `epft-choice-*` styles, and `ElTag` added to the type-only component imports. `isArrayLocked` was renamed `isLocked` because the choice fallbacks share it. `specs/components.md` updated. No `packages/core` change, no changeset (private package), no docs change (no `docs:build`).

Tests: `ElementPlusFormTemplate.choice.test.ts`, `.choice.logic.test.ts`, `.choice.validation.test.ts`, `.choice.analytics.test.ts`, helpers in `choice.test-helpers.ts`. The forwarding test now includes the three choice names, the array-story choice-occurrence test in `ElementPlusFormTemplate.arraySlots.logic.test.ts` was inverted (occurrences now render as choice cards), and the Tailwind scan in `noTailwind.test.ts` got a wider utility pattern set.

Behaviour notes and deviations:
- Single choice: every branch button stays visible (active one highlighted) so click-to-switch works; the Remove button is rendered per active branch. The counter only exists on the repeatable section. Counter and the section error are shown in both modes; only the branch controls are gated on `explicitChoiceSelection`.
- Branch buttons: single choice shows the branch label (else name) as the button text; repeatable shows "Add <label>". Plain English strings per the assumed open point.
- Occurrence number and added-order values sit in their own testid spans, with "#" and "Added #" outside, so helpers parse only the number.
- QA plan row "required leaf inside the active branch shows the standard field error": the template's default `ElFormItem` does not surface leaf validation errors at all (no `error` binding exists in the field wrapper, an earlier-story gap), so that test asserts the field chrome and required marker inside the section instead. Not fixed here; out of this story's scope.
- Automatic-mode test: the engine blocks entering a second branch once one holds a value, so the test types into one branch and asserts the value survives with no section controls present, rather than typing into two branches.
- Automatic repeatable choices render each branch as an array section (the engine marks branch children as arrays); the structure test asserts those sections.
- Render-count guard compares the delta against a minimal template (as the array story does) because adding an occurrence legitimately re-renders existing ones by the engine's own cost.
- Manual checklist: items 1, 2, 5 checked via a Playwright screenshot of a scratch page (single, repeatable, disabled; screenshot at `/private/tmp/claude-502/-Users-jeroenbach-Source-dynamic-form-worktrees-dynamic-form-worktree-1/866df2bf-630d-4efb-acc6-b8084526b495/scratchpad/choice.png`), scratch files removed. Items 3, 4, 6, 7 not run (wizard fallbacks do not exist yet; Storybook examples belong to the playground story).

Checks (from `packages/element-plus`, plus `pnpm -r ci:test:coverage`): `pnpm run ci:test` 403 passed, `ci:lint` clean, `ci:typecheck` clean, `pnpm build` ok. Coverage for the package 99.8% statements, 97.9% branches, 100% functions, with every new choice branch reached; `packages/core` coverage run green and untouched. Verify with `cd packages/element-plus && pnpm run ci:test && pnpm run ci:lint && pnpm run ci:typecheck`.

## Verification report
Verdict: pass-with-notes.

### Pipeline results (re-run independently)
- `packages/element-plus`: `pnpm run ci:test` 28 files, 403 tests passed; `ci:lint` clean; `ci:typecheck` clean.
- `pnpm -r ci:test:coverage`: core 27 files / 686 tests passed, 97.57% statements, 92.61% branches, 97.14% functions (core untouched, no drop); element-plus 403 tests passed, 100% statements, 98.94% branches, 100% functions.
- `docs:build` not needed: `git status` shows no `docs/` change. `packages/core` untouched.

### Mutation checks (each reverted; file byte-identical to the original afterwards, verified with cmp)
- Remove the `explicitChoiceSelection` gate on single-choice controls: 2 tests fail (modes tests).
- `globalIndex + 1` to `globalIndex`: 3 tests fail (renumbering, added-order numbering, card structure).
- Badge `label ?? branchKey` to `branchKey`: 1 test fails.
- Insertion-order indicator forced on: 2 tests fail.
- Repeatable add `disabled` driven by `used >= max` instead of `canAddChoiceOccurrence`: batched-branch test fails (AC 9 guard is real).
- Drop `canAddChoiceOccurrence`/lock guards from the single-choice button: 2 disabled-choice tests fail.

### Acceptance criteria
| AC | Result | Evidence |
| --- | --- | --- |
| 1 | pass | choice.test "shows one add control per branch and no branch content before selection"; logic "enables an add control for every branch that can still be added" |
| 2 | pass | logic "renders the selected branch field and stores its value under the branch" (value lands at `pick.b`) |
| 3 | pass | logic "returns to the unselected state ... lets another branch be selected" and "shows only the new branch when switching directly" |
| 4 | pass | logic "disables every add control for a disabled choice and ignores clicks"; repeatable budget case in "disables every add control once the shared budget is used up" (disabled attribute, click adds nothing) |
| 5 | pass | choice.test "shows per-branch add controls and a used-of-max counter" (0/3, then 2/3, content through the input chain); logic "counts choice slots and not raw items" (1 of 2) |
| 6 | pass | choice.test "renders one card per occurrence with kind badge, number, and remove control"; "uses the card primitive ..." (ElCard, ElButton); logic "removes exactly the occurrence whose card was used" |
| 7 | pass | choice.test "shows the added-order indicator only for occurrences added this session" and "renders an occurrence loaded from initial values without an indicator"; both run under `expectNoWarnings` |
| 8 | pass | logic "renumbers the remaining occurrences after a removal" (1,2,3 then 1,2, no stale 3); "numbers occurrences in the order they were added ..." |
| 9 | pass | logic budget test (all disabled at used==max, re-enabled after removal); "keeps a batched branch addable after the counter reaches its maximum until its own batch is full" (mutation-verified) |
| 10 | pass | logic "offers selection controls only in explicit mode"; "keeps entered values in automatic mode" (section has zero buttons); choice.test "automatic mode structure". Matches the DECIDED option 1 and the amended feature Data flow bullet |
| 11 | pass | choice.test "overriding choice slots" (occurrence-only, section-only, single-only, repeatable-only) |
| 12 | pass | choice.test "per-type choice slots" (`text-choice` single only and not reaching repeatable; `text-choice-array` and `text-choice-array-item` forwarded; other type keeps built-in) |
| 13 | pass | choice.test "choice dispatch precedence" (no array section or item testids, consumer array overrides ignored); the array-story test in `ElementPlusFormTemplate.arraySlots.logic.test.ts` was inverted to assert choice cards; forwarding test includes the three new names |
| 14 | pass | markup uses ElCard, ElButton, ElTag with scoped `epft-choice-*` CSS; `noTailwind.test.ts` pattern scan (extended with flex-wrap, ms-, ps-, border-s-, text-red-) green; no ElSpace/ElRow/ElCol in the template |
| 15 | pass | `sourceHygiene.test.ts` (em dash and process-reference scans) green; my own grep of `packages/element-plus/src` for em dashes and process references found none; ci:test, ci:lint, ci:typecheck green |

Edge cases: single-branch choice, group branch (single and repeatable), array branch (renders via array section), loaded initial values (single and repeatable), required choice error appears and clears (`choice.validation.test.ts`), label-else-name branch display: all covered by named tests. Wizard-branch edge case is deferred by plan (wizard fallbacks do not exist yet).

### Prototype comparison
No prototype for this feature. Structure mirrors the array fallbacks (same ElCard, `epft-array-*` title and error classes), so the choice section is visually consistent with the sibling array story.

### Process compliance
- `specs/components.md` updated (Element Plus template row documents the choice sections, slot reach rules, and test ids).
- No changeset needed: `packages/core/src` unchanged and the package is private. Existing `.changeset/` entries belong to earlier features.
- Library API rules: no new exports, camelCase kept, only established channels. The three choice names were added to the unforwarded slot set, and the forwarding test was updated accordingly.
- DECIDED/ASSUMED entries honoured: one-based numbers and label-else-branchKey badge, add controls follow `canAddChoiceOccurrence`, `-choice-array`/`-choice-array-item` override reach, plain English button strings, mode read gated on `explicitChoiceSelection` (feature already amended).
- No silent deviations. Documented deviations in Implementation notes are acceptable.

### Notes (non-blocking)
- The planned test "required leaf inside the active branch shows the standard field error" was replaced by a chrome and required-marker assertion, because the default `ElFormItem` wrapper does not bind leaf errors (earlier-story gap). Worth a follow-up in the foundation or bindings area.
- Manual checklist items 3, 4, 6, 7 were not run (wizard fallbacks absent, Storybook belongs to the playground story). Items 1, 2, 5 were checked by the developer via screenshot; I did not re-take it.
- The git index holds some earlier-story files staged and others untracked; ST-06 files are untracked. Jeroen should stage them all when committing.
- Reminder: link the PR in the frontmatter `pr` field. This is not the last open story of FEAT-004 (ST-07 onward remain), so the feature stays in progress.
