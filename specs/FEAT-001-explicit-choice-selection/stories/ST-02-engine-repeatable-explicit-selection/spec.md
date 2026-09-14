---
id: ST-02
type: story
feature: FEAT-001
status: approved
created: 2026-09-10
approved_by: Jeroen
pr: ""
---

# Story: Engine - maxOccurs > 1 repeatable explicit choice selection

## Functional
### User story
As a template author building a `DynamicFormTemplate`-based template, I want to add and remove several occurrences of chosen branches in a `maxOccurs > 1` choice, respecting each branch's own budget and the shared choice budget, so that I can build an "add several, each one of several kinds" UX (per-branch add buttons or a single adds-on-select dropdown) without any engine workaround.

### Acceptance criteria

1. **Adding an occurrence pushes a real placeholder item into that branch's array.**
   Given a `maxOccurs > 1` explicit choice with branches `apiEndpoint` and `crmExport`,
   When `addChoiceOccurrence('apiEndpoint')` is called,
   Then one empty placeholder item is pushed into the `apiEndpoint` branch's field array via `useFieldArrayExtended(branchPath)` (mirroring `DynamicFormItemArray`'s own `_addItem`), and a `DynamicFormItem` for that occurrence mounts through the `*-choice-item` slot.

2. **`canAddChoiceOccurrence` respects both the branch's own `maxOccurs` and the shared choice budget.**
   Given `apiEndpoint` has its own `maxOccurs: 2` and the choice's shared `maxOccurs` budget still has room,
   When two occurrences of `apiEndpoint` already exist,
   Then `canAddChoiceOccurrence('apiEndpoint')` returns `false` while `canAddChoiceOccurrence('crmExport')` still returns `true`, reusing the existing `occurrences` pass-1/pass-2 budget math unchanged. Given instead the shared choice budget is exhausted (regardless of any individual branch's own room), `canAddChoiceOccurrence` returns `false` for every branch.

3. **`removeChoiceOccurrence(branchKey, index)` removes the specified occurrence.**
   Given two `apiEndpoint` occurrences exist,
   When `removeChoiceOccurrence('apiEndpoint', 0)` is called,
   Then that occurrence is removed from the `apiEndpoint` branch's array (via the array helper's `remove`), the remaining occurrence's index shifts down, and `canAddChoiceOccurrence` for any branch that had been blocked by the shared budget re-evaluates to `true` if room reopened.

4. **`activeChoiceOccurrences` is grouped by branch declaration order (DECIDED Q8).**
   Given occurrences were added in the order `crmExport`, `apiEndpoint`, `crmExport`,
   When `activeChoiceOccurrences` is read,
   Then it lists `apiEndpoint`'s occurrence(s) before `crmExport`'s (branch declaration order in `field.choice`), then by index within each branch, derived purely from the value tree with no separate ephemeral ordering list, per the DECIDED grouped-order verdict.

5. **`xsd_choiceMinOccurs` parity with the single-branch case (DECIDED finding 2).**
   Given a required (`minOccurs: 1`) explicit `maxOccurs > 1` choice with nothing added (error showing),
   When one empty occurrence is added via `addChoiceOccurrence`,
   Then `xsd_choiceMinOccurs` clears immediately (`effectiveValuesCount` also counts `activeChoiceOccurrences.length` in the repeatable case), and the occurrence's own required fields (if any) enforce their content independently. Covered by a `*.validation.test.ts` alongside ST-01's single-branch case, so both cardinalities are asserted together as the DECIDED resolution requires.

6. **`*-choice-item` / `default-choice-item` slot receives `ChoiceItemAttributes` (finding 6, API item 3).**
   Given a repeatable choice occurrence renders,
   When the template resolves its slot,
   Then it receives `ItemAttributes` plus `removeItem` (wired to `removeChoiceOccurrence(branchKey, index)`) and `branchKey` (the occurrence's branch name), with fallback priority `<type>-choice-item -> default-choice-item -> default`, mirroring the existing `-array-item` fallback chain.

7. **Choice-in-array, `maxOccurs > 1` reindex safety (DECIDED finding 3, binding requirement).**
   Given an array of at least three items, each containing a `maxOccurs > 1` explicit choice, with occurrences already added in the choice nested inside item index 2,
   When an earlier sibling array item (index 0 or 1) is removed, reindexing item 2 to a lower index,
   Then the surviving choice's per-branch `useFieldArrayExtended` (created over a `computed` per-branch path, never a setup-time string) continues to target the correct, reindexed path, and its `activeChoiceOccurrences` still map to the reindexed item's occurrences, not the stale pre-removal path. Covered by a dedicated test: add occurrences in a nested repeatable choice, remove an earlier sibling array item, assert the surviving choice's occurrences map to the reindexed `projectContacts[i]` path.

### Edge cases
- Removing the last occurrence of a branch that had exhausted the shared budget frees room for other branches' `canAddChoiceOccurrence` to become `true` again, reactively (no manual recompute needed).
- A branch's own `maxOccurs` is reached but the shared choice budget is not: only that branch's add affordance disables; siblings remain addable.
- The shared choice budget is exhausted: every branch's `canAddChoiceOccurrence` returns `false`, matching the `#multi-limits` prototype state.
- `removeChoiceOccurrence` called with an out-of-range `index` for the given `branchKey`: no-op, no throw.

### Out of scope
- The dropdown-adds widget UI (`#multi-dropdown`): it is template-author code built entirely on the same four primitives; no additional engine surface is needed to support it, so this story does not add anything dropdown-specific.
- Docs/template changes (ST-03, ST-04).
- Preserve-on-switch (ST-05): the feature architecture scopes preserve-on-switch to `maxOccurs: 1` only ("technically feasible and low cost for `maxOccurs: 1`"); it does not apply to the repeatable case, so this story carries no preserve-on-switch hooks.

## Design reference
Feature prototype (`../../prototype.html`): `#multi-empty`, `#multi-add-buttons`, `#multi-limits`, `#multi-dropdown` (primitives only; the dropdown widget itself is template-author code, nothing to build here), and the repeatable half of `#choice-in-array`. Note (finding 3): the prototype's `#choice-in-array` section only draws the `maxOccurs: 1` case; the `maxOccurs > 1`-choice-inside-array combination this story implements (AC 7) has no matching prototype panel. Treat AC 7 as a delta the feature-level design left open for this slice; no new visual language is introduced, it reuses the existing `RepeaterCard`-wrapping-`ChoiceSectionCard` composition the prototype already establishes for the `maxOccurs: 1` case.

## Architecture reference
Builds on ST-01's foundation, against the feature architecture's Public API impact items 2-3 and the decision-6 subsection (as amended by the DECIDED finding-3 safeguards):

- **`packages/core/src/components/DynamicFormItemChoice.vue` (modified, extends ST-01's work).** Adds per-branch `useFieldArrayExtended(branchPath)` where `branchPath` is a `computed(() => overridePath(branchChild.path, props.pathOverride))` (a reactive computed, never a setup-time string, per the DECIDED binding requirement on finding 3); push/remove wiring for `addChoiceOccurrence`/`removeChoiceOccurrence` in the `maxOccurs > 1` branch of the existing single-branch primitives from ST-01; `activeChoiceOccurrences` extended to merge occurrences across all branches in declaration order; `canAddChoiceOccurrence` extended to read the existing per-branch `occurrences` budget (`overrideChildMaxOccurrences`) rather than the ST-01 disabled-only check; `effectiveValuesCount` extended to also count `activeChoiceOccurrences.length` for the repeatable case (DECIDED finding 2).
- **`packages/core/src/components/DynamicFormTemplate.vue` (modified, type-only + passthrough).** New `ChoiceItemAttributes<TMetadataConfiguration> extends ItemAttributes<TMetadataConfiguration>` interface (with `branchKey: string`), per Public API impact item 3 (finding 6's resolved stub). New `*-choice-item` / `default-choice-item` entries added to `SlotsFromMetadata` and their fallback branch added to `typeWithFallback`, mirroring the existing `-array-item` handling.
- **`packages/core/src/core/useFieldArrayExtended.ts` — reused as-is,** called once per branch (branches are static from metadata), each over its own reactive computed path.
- **Public API surface touched:** the `*-choice-item`/`default-choice-item` slots (new, additive) and `ChoiceItemAttributes` (new, additive). No export removed or renamed. Additive -> minor.
- **Dependencies:** ST-01 (the `explicitChoiceSelection` flag, `ChoiceAttributes` type, `explicitlySelectedBranch`/single-branch primitives this story extends to the repeatable case). This story's `activeChoiceOccurrences` shape is only final because Q8 (grouped-by-branch ordering) is already DECIDED; no further product input needed.
- **Changeset:** this story touches `packages/core/src/`, so it carries its own changeset entry (`minor`) for the `*-choice-item`/`default-choice-item` slots and the repeatable-mode primitives.
- **`specs/components.md`:** update once implemented with the new choice-item slots.

## QA plan

This story builds directly on ST-01's test infrastructure. At the time this plan is written ST-01 is `awaiting-approval` (not yet implemented), so the `DynamicFormItemChoice.test-helpers.ts`, `DynamicFormItemChoice.analytics.test.ts`, and the `#default-choice` add/remove-button fixture markup it describes do not exist in the tree yet. This plan assumes ST-01 ships those exactly as its own QA plan describes (helpers: `activeChoiceOccurrences`, `explicitlySelectedBranch`, `childValuesEntry`, `findDynamicFormItemChoiceByPath`; fixture: per-branch `data-testid="${path}.${branchName}-add-choice-button"` / `-remove-choice-button"` in `#default-choice`) and extends them rather than re-describing them. If ST-01 lands with a different shape, this plan's file/helper references need a matching update before implementation, not a silent workaround.

### Test files touched

| File | Status | Purpose |
| --- | --- | --- |
| `DynamicFormItemChoice.logic.test.ts` | extend | New `describe('explicit selection — maxOccurs>1 (ST-02)')` block: AC1, AC2, AC3, AC4, AC6, AC7, and the four edge cases. ~22 new `it`s. |
| `DynamicFormItemChoice.validation.test.ts` | extend | Extends ST-01's `describe('explicit selection — xsd_choiceMinOccurs parity (AC6)')` block (note: that is ST-01's AC6, not this story's) with a nested `describe('maxOccurs > 1 (ST-02, AC5)')` placed immediately beside the `maxOccurs: 1` cases, so both cardinalities are visible side by side in one diff/review, per the DECIDED parity requirement. ~4 new `it`s. |
| `DynamicFormItemChoice.analytics.test.ts` | extend (file created by ST-01) | New `describe('maxOccurs > 1 (ST-02)')` block: ~6 `it`s (see Reactivity section below). |
| `DynamicFormItemChoice.test-helpers.ts` | extend (file created by ST-01) | Reuses ST-01's `activeChoiceOccurrences`, `findDynamicFormItemChoiceByPath`, `formValues`. Adds `occurrenceBranchKey(wrapper, occurrencePath)` — reads the `-kind-badge` testid's text, asserting the slot actually received `branchKey` as a prop rather than the test inferring it from the path. Adds `canAddChoiceOccurrence(wrapper, choicePath, branchKey)` — reads the fixture's add-choice button `disabled` attribute for that branch (same indirection ST-01 uses for AC7, not a `setupState()` reach-in, to exercise the real public contract). |
| `DynamicFormTemplate.test.ts` | **new file** | Direct unit tests of `DynamicFormTemplate.vue`'s slot-resolution (`typeWithFallback`) for the new `*-choice-item` / `default-choice-item` tier, mounting `DynamicFormTemplate` standalone (not through `TestForm`/`TestFormTemplate`) so each test controls exactly which slots are defined. Covers AC6's fallback-priority requirement (`<type>-choice-item -> default-choice-item -> default`) in isolation. See rationale below. |
| `packages/core/src/examples/TestFormTemplate.vue` | extend (fixture) | Adds a `#default-choice-item` slot: renders `data-testid="${fieldMetadata.path}-kind-badge"` with `{{ branchKey }}` as text (so tests can assert the slot prop directly, not just infer the branch from the path), a remove button `data-testid="${fieldMetadata.path}-remove-choice-button"` wired to `removeItem`, and forwards `<slot />` for the occurrence's own fields — mirroring the existing `#default` item wrapper's remove-button pattern. Purely additive; the `#default-choice` block ST-01 adds is reused unchanged (its per-branch add button already works for both cardinalities: clicking it N times produces N occurrences). |

**Rationale for the new `DynamicFormTemplate.test.ts` file.** No test file exercises `DynamicFormTemplate.vue`'s slot-resolution logic directly today; the `-array-item` fallback chain is only exercised indirectly, because `TestFormTemplate.vue` defines no `#default-array-item` or per-type `-array-item` slot, so every existing array-item test silently falls through to the bottom tier (`default`) only. That leaves the top two tiers of the fallback chain (`<type>-array-item`, `default-array-item`) with no coverage anywhere in the suite, a pre-existing gap this story does not own and is out of scope to backfill for arrays. For the new `*-choice-item` chain, relying on the same indirect pattern would leave two of its three tiers untested by this story too. Since `TestFormTemplate.vue` is flagged (by ST-01's own QA plan) as the suite's single highest-risk shared fixture, adding slot-priority permutations to it (a `text-choice-item` slot that only some tests should see) is not safe to do inside the shared fixture. Testing `DynamicFormTemplate.vue` standalone avoids that risk entirely and gives real coverage of all three tiers. Flagged below for adversarial review as a QA-plan proposal, same posture as ST-01's AC9 `@ts-expect-error` proposal.

### Acceptance criteria → test mapping

1. **Adding an occurrence pushes a real placeholder item into the branch's array.** Mount a `maxOccurs > 1` explicit choice with branches `apiEndpoint` (`maxOccurs: 2`) and `crmExport` (`maxOccurs: 2`), shared choice `maxOccurs: 3`. Click `pick.apiEndpoint-add-choice-button`; assert an input at `pick.apiEndpoint[0]` exists with no value, `formValues(wrapper).pick.apiEndpoint` is `[null]` (the same empty-placeholder shape `DynamicFormItemArray._addItem` produces, not `undefined`), and `activeChoiceOccurrences(wrapper, 'pick')` equals `[{ branchKey: 'apiEndpoint', index: 0 }]`. `DynamicFormItemChoice.logic.test.ts`.
2. **`canAddChoiceOccurrence` respects both budgets.** Using the same fixture: click `apiEndpoint`'s add button twice (now at its own `maxOccurs: 2` cap); assert `canAddChoiceOccurrence(wrapper, 'pick', 'apiEndpoint')` is `false` (button disabled) while `canAddChoiceOccurrence(wrapper, 'pick', 'crmExport')` is `true`. Separately, with shared choice `maxOccurs: 2` and both branches' own `maxOccurs` at 2+, add two `apiEndpoint` occurrences (exhausting the shared budget with room left in `apiEndpoint`'s own cap); assert both `apiEndpoint`'s and `crmExport`'s add buttons are disabled. `DynamicFormItemChoice.logic.test.ts`.
3. **`removeChoiceOccurrence(branchKey, index)` removes the specified occurrence.** Add two `apiEndpoint` occurrences, fill each with a distinct value, click occurrence 0's `pick.apiEndpoint[0]-remove-choice-button`; assert `formValues(wrapper).pick.apiEndpoint` has length 1 and holds the value that was in occurrence 1 (index shifted down, confirming the removal went through `useFieldArrayExtended`'s `remove`, which splices, not `undefined`-fills), and that a branch previously blocked only by the shared budget (from AC2's second case) has `canAddChoiceOccurrence` become `true` again after the removal, with no manual re-trigger needed (reactive). `DynamicFormItemChoice.logic.test.ts`.
4. **`activeChoiceOccurrences` is grouped by branch declaration order.** Add in the order `crmExport`, `apiEndpoint`, `crmExport` (metadata declares `apiEndpoint` before `crmExport`); assert `activeChoiceOccurrences(wrapper, 'pick')` equals `[{ branchKey: 'apiEndpoint', index: 0 }, { branchKey: 'crmExport', index: 0 }, { branchKey: 'crmExport', index: 1 }]` — branch declaration order first, then index within branch — not the interleaved insertion order the add calls used. Re-derive by re-reading `activeChoiceOccurrences` after remounting from the resulting `formValues` alone (no ephemeral ordering state persisted), confirming it comes purely from the value tree per the DECIDED Q8 verdict. `DynamicFormItemChoice.logic.test.ts`.
5. **`xsd_choiceMinOccurs` parity for `maxOccurs > 1`.** Required (`minOccurs: 1`) explicit `maxOccurs > 1` choice, submit with nothing added → `pick-error-message` present; call `addChoiceOccurrence('apiEndpoint')` with the occurrence left empty → error clears immediately, asserted before any field inside the occurrence is touched (matching ST-01's AC6 assertion style: check before `flushPromises` triggers any field input beyond the add itself). If the occurrence's branch has its own `minOccurs: 1` child, that child's own error still shows independently on submit. Positioned directly beside ST-01's `maxOccurs: 1` parity test in the same file for side-by-side review. `DynamicFormItemChoice.validation.test.ts`.
6. **`*-choice-item` / `default-choice-item` slot receives `ChoiceItemAttributes`.** Component-level: after adding an `apiEndpoint` occurrence, assert the `-kind-badge` testid at `pick.apiEndpoint[0]` reads `apiEndpoint` (proves `branchKey` arrived as a slot prop, not inferred) and the `-remove-choice-button` at that path, when clicked, calls through to `removeChoiceOccurrence('apiEndpoint', 0)` (assert via AC3's removal-shape check after the click). `DynamicFormItemChoice.logic.test.ts`. Fallback-priority (three tiers): standalone `DynamicFormTemplate.test.ts` mounts `DynamicFormTemplate` three times with `type: 'text-choice-item'` and (a) both a `text-choice-item` and a `default-choice-item` slot defined → asserts the `text-choice-item` slot rendered; (b) only `default-choice-item` defined → asserts that one rendered; (c) neither defined → asserts `default` rendered. `DynamicFormTemplate.test.ts`.

   > **PROPOSED (adversarial review) — the standalone mount must supply a truthy `fieldMetadata` attr, finding 1.** `DynamicFormTemplate.vue`'s outer render is gated by `v-if="attrs.fieldMetadata"` (`DynamicFormTemplate.vue:188`): with no `fieldMetadata` attr the component renders nothing, so all three fallback cases (a/b/c) would render empty and case (c)'s "`default` rendered" assertion would pass vacuously (or fail) rather than exercising `typeWithFallback`. Each of the three standalone mounts must pass a minimal truthy `fieldMetadata` attr (alongside `type: 'text-choice-item'`) so the outer gate opens and the slot-resolution path actually runs. State this in the `DynamicFormTemplate.test.ts` setup.
7. **Choice-in-array, `maxOccurs > 1` reindex safety.** Array `projectContacts` (`maxOccurs: 3`, three items present), each item containing an explicit `maxOccurs > 1` choice `certifications` with branches `basic`/`advanced`. Add two `certifications.basic` occurrences inside `projectContacts[2]`. Remove `projectContacts[0]` (via its own array remove button). Assert: the surviving choice, now at `projectContacts[1].certifications`, still reports `activeChoiceOccurrences` of `[{ branchKey: 'basic', index: 0 }, { branchKey: 'basic', index: 1 }]`; the two occurrence inputs are found at `projectContacts[1].certifications.basic[0]` / `[1]` (not the stale `projectContacts[2]...` path); `formValues(wrapper).projectContacts[1].certifications` holds the two occurrences' data intact; and a subsequent `addChoiceOccurrence('advanced')` call on the surviving instance writes to `projectContacts[1].certifications.advanced[0]`, not `projectContacts[2]...`, proving the per-branch `useFieldArrayExtended` path recomputed rather than staying bound to a stale string. `DynamicFormItemChoice.logic.test.ts`.

**Edge cases** (same file, same new describe block):
- Removing the last occurrence of a branch that had exhausted the shared budget: from AC2's shared-budget-exhausted state, remove one `apiEndpoint` occurrence; assert `canAddChoiceOccurrence` for `crmExport` (previously blocked only by the shared budget) becomes `true` without any explicit recompute call (reactive `computed`, asserted by reading the fixture button's `disabled` attribute after `flushPromises` alone).
- A branch's own `maxOccurs` reached but the shared budget is not: only that branch's add button disables; the sibling's stays enabled (this is AC2's first case; cross-referenced here as the edge-case list item the story spec itself calls out).
- The shared choice budget is exhausted: every branch's add button is disabled (AC2's second case; cross-referenced for the same reason).
- `removeChoiceOccurrence('apiEndpoint', 99)` (out-of-range index) with one real `apiEndpoint` occurrence present: assert no throw, `formValues(wrapper).pick.apiEndpoint` still has length 1 unchanged, `activeChoiceOccurrences` unchanged. Mirrors ST-01's unknown-`branchKey` no-op edge case but for an out-of-range index on a known branch.

### States policy (this slice)

Per the feature's states policy, applied to what this slice adds on top of ST-01 (no template/UX slice yet; ST-03 owns the dashed-prompt and count-tag visuals):

- **Empty / unselected**: `maxOccurs > 1` with zero occurrences across all branches — asserted as "no occurrence `DynamicFormItem` mounted" and `activeChoiceOccurrences` `[]`, not the dashed "No items added yet" visual (template-author code, out of scope until ST-03). Implicit baseline at the top of every AC1-7 test before the first `addChoiceOccurrence` call.
- **Selected / active**: AC1, AC3 (after add/remove), AC7 (post-reindex).
- **Disabled**: AC2 and its two edge cases — own-branch `maxOccurs` exhausted (only that branch's add disables) and shared budget exhausted (every branch's add disables), matching the `#multi-limits` prototype state.
- **Loading**: N/A, same as ST-01 (selection is synchronous); noted so its absence isn't mistaken for a gap.
- **Error**: AC5.
- **Field validation inside an occurrence (pristine / invalid / valid)**: inherited unchanged from existing per-field templates; not re-tested here beyond AC5's "the occurrence's own required fields enforce their content independently" check, guarded otherwise by the existing `DynamicFormItem.validation.test.ts` suite, which this story does not touch.

### Reactivity / `*.analytics.test.ts` plan

New `describe('maxOccurs > 1 (ST-02)')` block in `DynamicFormItemChoice.analytics.test.ts` (file created by ST-01), reusing `renderCount()` and the `_analytics_occurrencesCalculatedCount` counter already on the component:

1. Adding an occurrence mounts exactly one new `DynamicFormItem` (`renderCount(wrapper, 'pick.apiEndpoint[0]') === 1`) and does not bump the render count of any already-active occurrence in another branch.
2. Removing occurrence 0 of two `apiEndpoint` occurrences does not remount the surviving occurrence: its render count stays at whatever it was before the removal (the array helper's stable per-item key means index reflow is a prop update, not a new mount), confirming `DynamicFormItemChoice` keys its occurrence items the same stable way `DynamicFormItemArray` does.
3. `_analytics_occurrencesCalculatedCount` increases by exactly one per `addChoiceOccurrence`/`removeChoiceOccurrence` call in the repeatable path too (same single-`computed` requirement ST-01 pins for the single-branch path), not a cascade.
4. A sibling field outside the choice does not re-render when a repeatable occurrence is added or removed (reuses the existing sibling-isolation pattern).
5. AC7's reindex case, render-count angle: after removing `projectContacts[0]`, the surviving `projectContacts[1].certifications.basic[0]` occurrence's render count is low and bounded (at most one re-render from the path/index adjustment, not a full unmount-remount cycle and not an unbounded loop), guarding against the exact "per-branch helper captured as a setup-time string" regression class finding 3 describes: if the path were not reactive, this assertion would either fail outright (stale path, wrong element found) or blow up (repeated remounts from `initFields()` re-add fragility).

### Coverage

New code exercised by this story, all covered by the AC-mapped tests above: the per-branch `useFieldArrayExtended(branchPath)` wiring (`branchPath` as a `computed`, not a setup-time string — AC7 is the test that specifically exercises the reactive-path requirement, not just the push/remove happy path), `activeChoiceOccurrences`'s cross-branch merge in declaration order (AC4), `canAddChoiceOccurrence`'s extension to read the existing `occurrences`/`overrideChildMaxOccurrences` budget math (AC2 and its edge cases), the `effectiveValuesCount` repeatable-case fold (AC5), and the `*-choice-item`/`default-choice-item` slot dispatch branch added to `DynamicFormTemplate.vue`'s `typeWithFallback` and template (AC6, both the component-level and the standalone fallback-priority tests). `useFieldArrayExtended.ts` itself is reused as-is and already covered by `DynamicFormItemArray.*`'s existing suites; this story does not retest its internals, only the new call site. No known gap. Run `pnpm -r ci:test:coverage` after implementation; if it drops, check the new `DynamicFormTemplate.test.ts` file's own coverage contribution first (a new file mounting a component directly, rather than through `TestForm`, is a new pattern in this codebase, worth confirming it is picked up by the coverage config's include list) before treating any drop as a real regression.

### Time sensitivity

Not applicable. No date/time-dependent logic in this story; the full suite still runs under `TZ=Europe/Amsterdam` per the CI scripts.

### Regression risk

- **ST-01's `maxOccurs: 1` path** — must stay unaffected by this story's `maxOccurs > 1` additions inside the same component. Guarded by ST-01's full `logic`/`validation`/`analytics` suites remaining green, unmodified, run alongside this story's new tests.
- **`DynamicFormItemArray.vue` / `useFieldArrayExtended.ts`** — reused as-is per the architecture; this story only adds new call sites inside `DynamicFormItemChoice.vue`. Guarded by the existing `DynamicFormItemArray.logic.test.ts` / `.validation.test.ts` suites, which this story does not touch.
- **`DynamicFormTemplate.vue`** — gains a new slot-dispatch branch (`-choice-item`) in `typeWithFallback` and the template's `v-if`/`v-else-if` chain. Regression risk: a misplaced branch could shadow the existing `-array-item`, `-array`, or `-choice` dispatch. Guarded by the new `DynamicFormTemplate.test.ts` (all four dispatch families, not just the new one, to catch a shadowing regression) plus the full existing `DynamicFormItemArray.*` and `DynamicFormItemChoice.*` suites.
- **`packages/core/src/examples/TestFormTemplate.vue`** — same highest-risk-touchpoint status ST-01's QA plan already flags. This story's only edit is the new `#default-choice-item` slot block; strictly additive, no change to existing markup, classes, or `data-testid`s. Run the full `DynamicFormItemChoice.*`, `DynamicFormItemArray.*`, and `DynamicFormItem.*` suites after this edit, not just this story's new tests, before trusting any of them as a positive signal.
- **Nested array-inside-choice / choice-inside-array reindexing** — AC7 is the first test in the suite that exercises array-item removal reindexing a *nested repeatable choice's* per-branch paths; plain array reindexing (no choice involved) is already guarded by `DynamicFormItemArray.logic.test.ts`, but that suite has no choice-in-array case, so AC7 is net-new coverage, not a regression check against an existing test.
- **Other stories of this feature**: ST-03/ST-04 (docs) consume `activeChoiceOccurrences`'s grouped-order contract (AC4) and the `*-choice-item` slot contract (AC6) through the real `ChoiceSectionCard.vue`, not `TestFormTemplate.vue`; they are not blocked by this story's fixture edit but do depend on both contracts staying stable as tested here. ST-05 (preserve-on-switch) is `maxOccurs: 1`-only per its own scope and is unaffected by this story.

### Manual verification checklist

None required to validate functional behaviour: this story is engine-only (no template/docs changes; those are ST-03/ST-04), and every acceptance criterion and edge case is exercised through the `TestForm`/`TestFormTemplate` component-test harness or the standalone `DynamicFormTemplate` mount, not a live browser page.

One development-time sanity check (not part of the automated suite, not gating): temporarily replace the per-branch `useFieldArrayExtended` call's `computed(() => overridePath(...))` argument with a plain setup-time string once during implementation, and confirm AC7's reindex test now fails (wrong path found, or a throw from the stale-path array operation). This confirms the test actually catches the reactive-path regression class finding 3 describes, not just the happy path, then restore the computed. Mirrors ST-01's own dev sanity-check note for its AC9 type check.

### Flags for reviewer

- **New file `DynamicFormTemplate.test.ts`, mounting `DynamicFormTemplate` standalone rather than through `TestForm`/`TestFormTemplate`.** This is a new test pattern for this codebase (every other test in the `DynamicFormItemChoice.*`/`DynamicFormItemArray.*`/`DynamicFormItem.*` families mounts `TestForm`). Proposed because it is the only way to test all three tiers of the new `*-choice-item` fallback chain without adding slot-priority permutations to the shared `TestFormTemplate.vue` fixture (flagged by ST-01 as the highest-risk touchpoint in the suite). Flagging for adversarial review to confirm this is the right boundary, and that mounting `DynamicFormTemplate` directly with a `metadataConfiguration` prop plus raw attrs (since `useAttrs()` reads whatever isn't a declared prop) is a valid, type-safe way to drive it in a test.
- **Pre-existing gap noted, not fixed here**: the `-array-item` fallback chain (`<type>-array-item` / `default-array-item` / `default`) has no dedicated test anywhere in the suite today; every array-item test exercises the bottom (`default`) tier only, indirectly. This story does not backfill that for arrays (out of scope), but the new `DynamicFormTemplate.test.ts` file gives `*-choice-item` the coverage `*-array-item` still lacks. Worth a follow-up quick-lane story to backfill `-array-item` using the same standalone-mount pattern, not blocking this story.
- No acceptance criterion required a rewrite; all seven are testable as written, using the same precedent (reaching into `setupState()`, driving primitives through the real fixture slot props) ST-01's QA plan already established and this plan reuses.

## Adversarial review

Ran in STORY (lite) mode on 2026-09-10, blockers-first, against the installed code (`DynamicFormItemChoice.vue`, `DynamicFormItemArray.vue`, `DynamicFormTemplate.vue`) and every binding DECIDED entry the task named (Q8 grouped order, finding 2 parity, finding 3 reactive paths + reindex test, nit 6 `ChoiceItemAttributes`, finding 1). Checked every acceptance criterion for a test mapping, checked for silent overrides of the approved feature design/architecture, and checked the ST-01 dependency. No blocker found.

**Consistency with the approved feature (verified, so discussion does not re-litigate):**

- **DECIDED Q8 (grouped order):** AC4 and its mapping derive `activeChoiceOccurrences` purely from the value tree in branch-declaration-then-index order, no ephemeral ordering list. Matches the verdict.
- **DECIDED finding 2 (parity):** AC5 folds `activeChoiceOccurrences.length` into `effectiveValuesCount` for the repeatable case and pins it in a `*.validation.test.ts` beside ST-01's single-branch case. Matches.
- **DECIDED finding 3 (reactive paths + reindex test):** AC7 and the architecture reference mandate a `computed(() => overridePath(...))` per-branch path (never a setup-time string) and a dedicated sibling-removal reindex test. Matches, and the dev-time sanity check (swap the `computed` for a string, confirm AC7 fails) is a real guard for the regression class.
- **DECIDED finding 6 (`ChoiceItemAttributes`):** AC6 wires `ItemAttributes` + `removeItem` + `branchKey` through the `*-choice-item` -> `default-choice-item` -> `default` chain. Verified against `DynamicFormTemplate.vue`: `'text-choice-item'.endsWith('-choice')` is `false`, so a `-choice-item` type falls through the template's `else` branch (line 191) binding `ItemAttributes`, exactly as `-array-item` already does, which is correct for `ChoiceItemAttributes extends ItemAttributes`. The only runtime addition needed is a `.endsWith('-choice-item')` branch in `typeWithFallback` (lines 163-182), which the architecture reference already calls for. No template-dispatch `v-if` branch is required, so the plan is right not to add one.
- **DECIDED finding 1 (option (a), residue accepted; reconfirmed by Jeroen 2026-09-10):** ST-02 does not touch clear-on-switch. Its `removeChoiceOccurrence` goes through the field-array `remove` (splice), which genuinely deletes the array entry with no residue, so ST-02 is consistent with either contract and unaffected by the option (a) resolution. See finding 3 below for a cross-spec wording caveat that is not ST-02's to fix.
- **Dependency on ST-01** is explicit and honest: the plan states ST-01 is `awaiting-approval` (not yet implemented), names the exact helpers/fixtures it inherits (`activeChoiceOccurrences`, `explicitlySelectedBranch`, `childValuesEntry`, `findDynamicFormItemChoiceByPath`, the `#default-choice` add/remove fixture, the `.analytics`/`.test-helpers` files, `effectiveValuesCount`), and commits to realigning if ST-01 lands a different shape rather than working around it silently.

**Ruling on flagged item 1 (new standalone `DynamicFormTemplate.test.ts`, mounting the template directly rather than through `TestForm`): ACCEPTED.** Verified against the source: `DynamicFormTemplate.vue` uses only `defineProps`, `defineSlots`, `useAttrs`, `computed`, and `camelize` — it performs no `inject` and needs no form/provide context, so mounting it standalone with a `metadataConfiguration` prop plus raw attrs (read via `useAttrs()`) plus the slots under test is valid and type-safe, and is the only way to exercise all three tiers of the `*-choice-item` fallback without adding slot-priority permutations to the shared `TestFormTemplate.vue` fixture (correctly flagged as the suite's highest-risk touchpoint). One load-bearing caveat routed as finding 1 below.

**Ruling on flagged item 2 (pre-existing `-array-item` fallback chain has no dedicated coverage; deferred to a future quick-lane story): ACCEPTED as out of scope.** It is a genuine pre-existing gap not created by this story; deferring the array-item backfill is the right boundary, and the new `DynamicFormTemplate.test.ts` reduces the equivalent risk for the sibling `-choice-item` chain this story does own.

**Findings:**

1. **[should-fix] The standalone `DynamicFormTemplate` fallback test needs a truthy `fieldMetadata` attr or it asserts nothing.** The component's entire render is gated by `v-if="attrs.fieldMetadata"` (`DynamicFormTemplate.vue:188`); without that attr the three fallback mounts render empty and case (c) ("`default` rendered") passes vacuously instead of exercising `typeWithFallback`. Routed as a `PROPOSED (adversarial review)` edit on QA mapping item 6.

2. **[nit] Extend the `Attributes.type` union when adding the slot.** `Attributes.type` (`DynamicFormTemplate.vue:49`) enumerates `... | 'default-array-item' | 'default-choice'` but not `'default-choice-item'`. To stay type-consistent with the existing `-array-item` entry the developer should add `'default-choice-item'` there when wiring the new slot. Implementation detail; the "mirror `-array-item`" instruction already covers it.

3. **[nit, cross-spec, not ST-02's to fix] The feature spec's finding-1 DECIDED text reads option (a), while this task and ST-01 assert option (c).** `FEAT-001/spec.md` (clearing subsection and ADR-3, and the finding-1 entry) currently states "DECIDED ... option (a), accept the `undefined`-valued residue ... `removeNullValues` as the submit-time cleanup", and ADR-3 explicitly *rejects* the prune-helper alternative. ST-01 (AC10, its CORRECTION note) and this review task instead assert option (c) (true removal via a public-surface prune helper). ST-02 is unaffected either way (it uses array splice, no residue), so this does not gate ST-02, but Jeroen should reconcile the feature-spec/ST-01 wording so ST-01 is not built against an alternative the feature text currently records as rejected. Recorded here for visibility only; the fix belongs in `FEAT-001/spec.md` and ST-01, outside this story's editable section. RESOLVED (Jeroen, 2026-09-10): option (a) stands, reconfirmed during story prep; ST-01, ST-03, and ST-04 were realigned to option (a) and the transient option (c) wording (including ST-01's CORRECTION note) was removed.

No blocker; the single should-fix is routed as a `PROPOSED` edit; nits do not gate. Status set to `awaiting-approval`.

## Implementation notes
Filled by developer during implementation.

## Verification report
Filled by qa-verifier after implementation.
