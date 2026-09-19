---
id: ST-01
type: story
feature: FEAT-002
status: done
created: 2026-09-17
approved_by: Jeroen
pr: "https://github.com/jeroenbach/vue-dynamic-form/pull/44"
---

# Story: Cross-branch `globalIndex` for repeatable explicit choice occurrences

## Functional
### User story
As a template author rendering a repeatable (`maxOccurs > 1`) explicit choice's occurrences through the `-choice-array-item` / `default-choice-array-item` slot, I want each occurrence to receive its cross-branch position (a continuous 0-based index across every branch, not just its own branch), so that I can render a continuous "item N of M" badge instead of a number that resets per branch.

### Acceptance criteria

1. **`globalIndex` reflects cross-branch position, in `activeChoiceOccurrences` order.**
   Given a repeatable explicit choice (`maxOccurs > 1`, `explicitChoiceSelection: true`) with occurrences across two or more branches,
   When the `-choice-array-item` slot renders each active occurrence,
   Then each slot's `globalIndex` equals that occurrence's zero-based position in `activeChoiceOccurrences` (grouped by branch declaration order then by index within branch, this slice's rendered list is identical to `activeChoiceOccurrences`), so `globalIndex + 1` reads a continuous 1..N sequence top to bottom.

2. **Removal renumbers survivors live (no stored value).**
   Given 4 active occurrences across branches with `globalIndex` 0..3,
   When the occurrence at `globalIndex` 1 is removed,
   Then the 3 survivors' `globalIndex` re-derive to 0, 1, 2 (no gap), and no `order`/index value is written to `values` or to any instance-local store anywhere as a side effect of this story.

3. **Existing per-branch `index` prop is unaffected.**
   Given the same occurrence,
   When its `-choice-array-item` slot renders,
   Then the existing `index` prop (position within its own branch's field array) is unchanged from today's behaviour, so a template reading `index` alone sees byte-identical values to before this story.

4. **`maxOccurs: 1` explicit choices are untouched.**
   Given a `maxOccurs: 1` explicit choice (renders through the `-choice` slot, one `DynamicFormItem` per active branch, not through `-choice-array-item`),
   When it renders,
   Then no `globalIndex` prop is introduced on that path; this story is scoped to the repeatable (`maxOccurs > 1`) case only.

5. **`globalIndex` is `undefined` everywhere it does not apply.**
   Given a plain (non-choice) array item, a non-explicit choice, or any other `DynamicFormItem`,
   When it renders,
   Then its forwarded `globalIndex` prop is `undefined` (optional prop, no default behaviour change, no crash).

6. **Correct through a reindexing ancestor array.**
   Given a repeatable explicit choice nested inside a `DynamicFormItemArray` occurrence,
   When an earlier sibling array item is removed (reindexing the choice's own `pathOverride`),
   Then `globalIndex` for the choice's own occurrences is unaffected by the ancestor's reindex (it only reflects position within this choice's own `activeChoiceOccurrences`).

### Edge cases
- Zero active occurrences: the `-choice-array-item` loop does not run; no `globalIndex`-related error, nothing to number.
- Exactly one active occurrence: `globalIndex` is `0`.
- Two occurrences of the same branch and one of another: `globalIndex` still counts across the whole merged list (e.g. with the reused fixture's `apiEndpoint`-first declaration order: `apiEndpoint[0]` at `globalIndex` 0, `crmExport` occurrences at 1 and 2), not restarting per branch.

### Out of scope
- Any add-order / interleaved display (`insertionOrder`, `displayOrder`): ST-02.
- Any persisted `order` value (`preserveOrder`): ST-03.
- Any docs/example change binding `globalIndex` into a visible badge: ST-04.
- Any change to `activeChoiceOccurrences` itself (its shape, grouping, or the choice-level slot contract): explicitly unchanged, per the feature's hard constraint.

## Design reference
Feature prototype (`../../prototype.html`): `#numbering-before-after` (the ask-1 teaching visual: per-branch `index + 1` today vs continuous `globalIndex + 1`), `#numbering-populated` (card anatomy with the continuous badge), `#numbering-removal` (removal renumbers survivors, live-derived, Q5), `#numbering-empty` (0 occurrences, nothing to number). This story delivers only the underlying engine data (`globalIndex`); the visible badge binding these anchors depict is ST-04's slice, not this one. No new visual language is introduced here; nothing in this story's own output is rendered.

## Architecture reference
Builds on FEAT-001's `DynamicFormItemChoice.vue` occurrence machinery (`activeChoiceOccurrences`, the `-choice-array-item` `v-for`, `occurrenceKey`), against the feature architecture's Slice A ("smallest, self-contained, no dependency... `renderedChoiceOccurrences` in this slice equals `activeChoiceOccurrences`") and ADR-1.

- **`packages/core/src/types/DynamicFormItemProps.ts` (modified).** Add `globalIndex?: number`, documented next to the existing `branchKey?: string` (same precedent: optional, engine-internal wiring prop, forwarded to the leaf template).
- **`packages/core/src/components/DynamicFormItem.vue` (modified).** Forward the new `globalIndex` prop onto the leaf `<component :is="template">` binding, alongside the existing `branchKey` forwarding, so it reaches the slot as a prop.
- **`packages/core/src/components/DynamicFormItemChoice.vue` (modified).** In the `explicitChoiceSelection && maxOccurs > 1` template branch (the `-choice-array-item` `v-for` over `activeChoiceOccurrences`), bind `:global-index="index"` using the loop's own index (per ADR-1: the render-loop index, not a separate computed mirroring `activeChoiceOccurrences`, avoiding duplicated ordering logic). No new computed is added in this story; `renderedChoiceOccurrences` (the sortable render-list computed) is introduced in ST-02, which will also migrate this `v-for`'s source list from `activeChoiceOccurrences` to `renderedChoiceOccurrences` — noted here as the explicit delta ST-02 will make so this story's own contract (AC1) is not silently reinterpreted later; ST-02 keeps `globalIndex`'s meaning (loop index over the rendered list) identical, just over a list that may later be sorted.
- **`packages/core/src/components/DynamicFormTemplate.vue` (modified, types only).** Add `globalIndex: number` to `ChoiceArrayItemAttributes`. `ChoiceOccurrence` and `ChoiceAttributes`/`activeChoiceOccurrences` are unchanged (per the feature's decided finding 5: the populated field lives only on the per-occurrence slot prop, never on the choice-level list).
- **Public API surface touched:** one new optional `DynamicFormItemProps.globalIndex?: number` (engine-internal wiring, technically public since the type is exported) and one new required `ChoiceArrayItemAttributes.globalIndex: number` slot-prop field (additive on a slot-prop type a consumer only receives, never constructs, so non-optional here does not break any existing consumer). No existing export's shape changes. **Changeset: `minor`**, and since this is the first story of the feature to touch `packages/core/src/`, it carries its own changeset entry.
- **Dependencies:** none. Per the feature architecture's slicing seams, Slice A is "smallest, self-contained, no dependency."
- **`specs/components.md`:** update the `DynamicFormItemChoice` row and the `ChoiceArrayItemAttributes` type entry once implemented.

## QA plan

This story extends the FEAT-001 repeatable-explicit-choice fixtures already established in `DynamicFormItemChoice.logic.test.ts`/`.analytics.test.ts` (the `apiEndpoint`/`crmExport` two-branch, `maxOccurs > 1` fixture used throughout the "maxOccurs > 1" describe blocks). No new fixture component is needed. Two fixture shapes are used:

- **Scalar-leaf branches** (`type: 'text'`), matching the existing `maxOccurs > 1` analytics fixture, for tests where occurrence content itself is not the point.
- **Object branches** (a `children` array, one text child each), named `crmExport`/`apiEndpoint` to match the feature's own edge-case and design-decision examples, used specifically for the AC2 "no value written to `values`" assertion, where the point is proving no extra key appears inside an occurrence's own object.

### Fixture / harness changes

| File | Status | Purpose |
| --- | --- | --- |
| `packages/core/src/examples/TestFormTemplate.vue` | extend | In the `#default-choice-array-item` slot, destructure `globalIndex` and bind it into a new `${fieldMetadata.path}-global-index` testid span, next to the existing `-kind-badge` span. This is the only way to assert `globalIndex` arrived through the real public `-choice-array-item`/`default-choice-array-item` slot contract, not merely as an internal prop. |
| `packages/core/src/components/__tests__/DynamicFormItemChoice.test-helpers.ts` | extend | New `occurrenceGlobalIndex(wrapper, occurrencePath): number \| undefined`, reading the new `-global-index` testid, mirroring the existing `occurrenceBranchKey` helper and its documented rationale (real slot-prop delivery, not inferred from the path). |
| `DynamicFormItem.test-helpers.ts` | no change | Existing `setupState`/props-reading patterns (see `findDynamicFormItemByPath` already defined locally in `DynamicFormItemChoice.logic.test.ts`) are reused to read `globalIndex` directly off `DynamicFormItem`'s own `props()`, for the internal-forwarding-level assertions (AC3-AC5). |

### Test files touched

| File | Status | Purpose |
| --- | --- | --- |
| `DynamicFormItemChoice.logic.test.ts` | extend | New `describe('globalIndex (ST-01)')` block: AC1 (cross-branch position), AC2 (removal renumbers survivors, no stored value), AC3 (`index` unaffected), AC4 (maxOccurs:1 untouched), AC5 (undefined elsewhere), AC6 (reindexing ancestor array), and the three edge cases. |
| `DynamicFormItemChoice.analytics.test.ts` | extend | New `describe('globalIndex — render counts (ST-01)')` block: forwarding the new prop does not turn a bounded prop-update into an unmount/remount, does not add a sibling re-render, and the post-removal renumber is reflected at the same bounded render pass the existing `maxOccurs > 1` removal tests already pin. |

No change anticipated to `DynamicFormItemChoice.validation.test.ts`: this story adds no validation-relevant state (`globalIndex` is a pure render-loop index, never written to `values`, never read by any `xsd_*` rule), so no new validation outcome exists to pin. Explicitly noted so the absence of a validation-test addition is not mistaken for a gap.

### Acceptance criteria → test mapping

1. **`globalIndex` reflects cross-branch position, in `activeChoiceOccurrences` order.**
   Mount the two-branch (`crmExport`/`apiEndpoint`) repeatable fixture, add occurrences in an order that would give a different result if grouped-vs-add-order were confused (e.g. `crmExport`, `apiEndpoint`, `crmExport`, `apiEndpoint`), and assert two ways: (a) `occurrenceGlobalIndex(wrapper, 'pick.apiEndpoint[0]')` etc. read through the real slot contract equal `0, 1, 2, 3` in `activeChoiceOccurrences` (grouped) order — `apiEndpoint[0]=0, apiEndpoint[1]=1, crmExport[0]=2, crmExport[1]=3` (the fixture declares `apiEndpoint` before `crmExport`), not add-press order; (b) the same values read directly off `DynamicFormItem.props('globalIndex')` for each occurrence path, confirming the internal-forwarding value matches the slot-delivered value (no drift between the two). `DynamicFormItemChoice.logic.test.ts`.

2. **Removal renumbers survivors live (no stored value).**
   Build 4 active occurrences across the two branches (`globalIndex` 0..3 per AC1). Remove the occurrence at `globalIndex` 1 (`pick.apiEndpoint[1]` in the grouped ordering used above) and assert the 3 survivors now read `globalIndex` 0, 1, 2 with no gap, via both the slot testid and `DynamicFormItem.props('globalIndex')`. Additionally, using the object-branch fixture variant, assert `Object.keys(formValues(wrapper).pick.crmExport[0])`/`apiEndpoint[...]` for every surviving occurrence contains only the declared child name(s) (e.g. `system`/`url`), with no `order`, `globalIndex`, or any other injected key, both immediately after removal and after a submit-capture round-trip (mirroring FEAT-001 ST-05's AC5 pattern), directly proving "no order/index value is written to `values`". `DynamicFormItemChoice.logic.test.ts`.

3. **Existing per-branch `index` prop is unaffected.**
   Reuses the existing `describe('index')` fixture pattern already in `DynamicFormItemChoice.logic.test.ts` (`findDynamicFormItemByPath(...).props('index')`), extended to the `maxOccurs > 1` repeatable case: build the same 4-occurrence cross-branch fixture from AC1, assert each occurrence's `index` prop is its own per-branch position (`crmExport[0].index === 0`, `crmExport[1].index === 1`, `apiEndpoint[0].index === 0`, `apiEndpoint[1].index === 1`) — i.e. `index` still resets per branch while `globalIndex` does not, read side by side on the same occurrences to make the distinction explicit in one assertion block. `DynamicFormItemChoice.logic.test.ts`.

4. **`maxOccurs: 1` explicit choices are untouched.**
   Reuses the existing `mountExplicitSingleChoice` fixture (maxOccurs:1, `-choice` slot path, not `-choice-array-item`). Assert `findDynamicFormItemByPath(wrapper, 'pick.selfServe').props('globalIndex')` is `undefined` after selection, and that the `-global-index` testid does not exist anywhere in the rendered output for this fixture (since the `default-choice-array-item` slot never renders on this path at all — a stronger check than just the prop being undefined). `DynamicFormItemChoice.logic.test.ts`.

5. **`globalIndex` is `undefined` everywhere it does not apply.**
   Three sub-cases, each asserting `DynamicFormItem.props('globalIndex')` is `undefined` and no `-global-index` testid renders: (a) a plain (non-choice) repeatable array item (reuse an existing `DynamicFormItemArray` fixture); (b) a non-explicit (automatic) choice's branch (reuse the "simple choice — two text inputs" fixture, `explicitChoiceSelection` absent); (c) a top-level plain field with no array/choice ancestry at all (reuse the `sibling` field already present in the analytics fixtures). `DynamicFormItemChoice.logic.test.ts`.

6. **Correct through a reindexing ancestor array.**
   Extends the existing nested fixture already proven in `DynamicFormItemChoice.analytics.test.ts` ("the reindex case does not remount the surviving occurrence in a nested repeatable choice after a sibling array item is removed": `projectContacts` array of choice-holding groups, `certifications` repeatable explicit choice with `basic`/`advanced` branches). Add occurrences to `projectContacts[1].certifications` across both branches so `globalIndex` is non-trivial (e.g. `basic[0]=0, advanced[0]=1, basic[1]=2`), remove `projectContacts[0]` (an earlier array sibling, reindexing `projectContacts[1]` to `projectContacts[0]`), and assert `certifications`'s occurrences' `globalIndex` values are unchanged by the ancestor reindex (still `0, 1, 2` in the same grouped order), only their path prefix changed. `DynamicFormItemChoice.logic.test.ts`.

**Edge cases** (same new describe block):
- **Zero active occurrences.** Mount the repeatable fixture with nothing added; assert no `-global-index` testid exists anywhere and no error/console warning is thrown (the `-choice-array-item` `v-for` loop body never runs).
- **Exactly one active occurrence.** Add a single occurrence to either branch; assert its `globalIndex` is `0`.
- **Two occurrences of one branch, one of another.** Add `crmExport, crmExport, apiEndpoint` (in that press order, deliberately not matching branch-grouped order); assert grouped-order `globalIndex` is `apiEndpoint[0]=0, crmExport[0]=1, crmExport[1]=2` (the fixture declares `apiEndpoint` first) — restated directly from the story's own edge case, confirming `globalIndex` counts across the whole merged list and does not restart per branch, and does not follow add-press order either (that is explicitly ST-02's scope, not this story's).

### States policy (this slice)

Per the feature's states policy, this slice ships no visible output of its own (the Design reference states "nothing in this story's own output is rendered"), so there is no new component-visual state to assert. The relevant states to confirm at the *data* level, since they gate whether the `-choice-array-item` loop runs at all:
- **Empty** (0 occurrences): edge case above, loop does not run, nothing to number.
- **Populated** (1+ occurrences, one or more branches): AC1/AC2/edge case 2/3.
- **Error** (`xsd_choiceMinOccurs`): out of scope for this story (`globalIndex` does not read or affect validation state); not re-tested here, already covered by FEAT-001's existing suite, which this story's tests must not regress (see Regression risk).
- **Disabled** (`maxOccurs: 0` / budget exhausted): out of scope for `globalIndex` itself (a disabled choice has no active occurrences to number in the first place, collapsing to the Empty case); no dedicated test beyond the existing FEAT-001 disabled-choice coverage remaining green.

### Reactivity / `*.analytics.test.ts` plan

This slice modifies `DynamicFormItem.vue` (new prop forwarded onto the leaf `<component :is="template">`) and `DynamicFormItemChoice.vue`'s `maxOccurs > 1` `v-for` (binds `:global-index` using the loop's own index, per ADR-1 no new computed). Per the render-count discipline this project applies to any `DynamicFormItem`/choice-wiring change, extend `DynamicFormItemChoice.analytics.test.ts`:

1. **Adding a cross-branch occurrence still mounts exactly one new `DynamicFormItem` and does not remount a sibling branch's existing occurrence**, re-running the existing "adding an occurrence mounts exactly one new DynamicFormItem..." test's exact assertions (DOM node identity preserved, render count bounded to `+1`) against the codebase *after* this story's change, to catch a regression where forwarding `globalIndex` turns a benign prop update into a remount. Additionally assert the newly mounted occurrence's `-global-index` testid already shows the correct value at that first render (no flash of a stale/undefined value).
2. **Removing occurrence 1 of 4 (AC2) does not remount the renumbered survivors.** Extends the existing "removing occurrence 0 of two does not remount the surviving occurrence" pattern to the 4-occurrence cross-branch fixture: assert DOM node identity is preserved for every survivor, render count stays within the same existing bound (`+1` at most, per the documented slotProps-forwarding characteristic), and the survivor's `-global-index` testid reflects its *new*, renumbered value at that same bounded render pass, not a stale one requiring an extra render.
3. **No sibling re-render.** Reuses the existing `sibling` field pattern: adding/removing cross-branch occurrences (exercising the new `globalIndex` binding) does not change `renderCount(wrapper, 'sibling')`.
4. **`_analytics_activeChoiceOccurrencesCalculatedCount`/`_analytics_occurrencesCalculatedCount` are unchanged by this story.** Since `globalIndex` is the `v-for` loop's own index (ADR-1: "no new computed is added in this story"), assert the existing recompute-count contracts already pinned by FEAT-001's `analytics.test.ts` (one recompute per add/remove call) are byte-identical before and after this story's change — i.e. this story adds zero new reactive computations, only a render-loop-local index. This is the most direct test of ADR-1's "zero extra logic" claim.

### Coverage

Every new runtime line this story introduces is covered by the AC-mapped tests above: the `globalIndex?: number` prop declaration and its forwarding in `DynamicFormItem.vue` (exercised by every test that reads `props('globalIndex')` or the slot testid, both the defined-value paths in AC1/AC2/AC6/edge-cases and the `undefined` paths in AC4/AC5), and the `:global-index="index"` binding added to `DynamicFormItemChoice.vue`'s `maxOccurs > 1` `v-for` (exercised by every occurrence in every test above). The `DynamicFormTemplate.vue` change (`ChoiceArrayItemAttributes.globalIndex: number`) is type-only and has no runtime statement/branch to cover; it is exercised at the type-check level by `pnpm typecheck` (the fixture's `#default-choice-array-item` slot destructures `globalIndex`, so a missing or wrongly-typed field fails compilation) and at the behavioural level by every slot-testid-based assertion above, which would not compile or pass if the field were absent. Run `pnpm -r ci:test:coverage` after implementation and confirm no drop against baseline; no code path in this story is knowingly left uncovered.

### Time sensitivity

Not applicable. No date/time-dependent logic is introduced by this story.

### Regression risk

- **`DynamicFormItemChoice.vue`'s `maxOccurs > 1` `v-for` (the `-choice-array-item` occurrence loop)** — modified again on top of FEAT-001 ST-02. Must stay byte-identical in every respect other than the new `global-index` binding: the existing FEAT-001 `DynamicFormItemChoice.logic.test.ts`/`.validation.test.ts`/`.analytics.test.ts` "maxOccurs > 1" describe blocks must remain green, unmodified.
- **`DynamicFormItem.vue`'s leaf-template forwarding block** (alongside the existing `branch-key` forwarding) — must not change any existing forwarded prop's value or timing; guarded by the full existing `DynamicFormItem*`/`DynamicFormItemArray*`/`DynamicFormItemChoice*` suites remaining green.
- **`activeChoiceOccurrences` itself** — explicitly unchanged per the feature's hard constraint; no test in this plan reads or mutates it beyond the existing FEAT-001 assertions already in place, and AC1-AC6 all key their expectations off it, so a regression there would surface as a failure in this story's own tests too, not just FEAT-001's.
- **`TestFormTemplate.vue` fixture** — the one addition (a `-global-index` testid span) is strictly additive next to the existing `-kind-badge` span; re-run the full existing suite (this is the shared fixture behind nearly every `DynamicFormItem*` test) to confirm no unintended markup/spacing regression.
- **Downstream stories (ST-02 through ST-05)** — all depend on this story (ST-02 directly: "`globalIndex` becomes the loop index over the now-sortable render list"). A regression here blocks the rest of the feature; this is the primary reason the regression-risk bar for this specific story is the full existing FEAT-001 choice suite staying green, not just this story's own new tests.

### Manual verification checklist

None required. This is an engine-only story with no docs/template-visual slice (the Design reference states this story's own output renders nothing new; the visible badge binding is ST-04's), and every acceptance criterion and edge case is exercised through the `TestForm`/`TestFormTemplate` component-test harness with `@vue/test-utils`.

### Flags for reviewer

- **All six acceptance criteria are testable as written**; none required a rewrite. AC2's "no order/index value is written to `values` or to any instance-local store anywhere" is the least directly observable claim (a negative, "nothing new exists" assertion); it is tested two ways — an `Object.keys()` subset check on survivor values after removal (object-branch fixture) proving no key was injected, and the render-count/recompute-count parity check in the analytics plan (item 4) proving no new reactive state was added — rather than a single direct read of "the instance has no new store", since the story introduces no named internal ref for this AC to point `setupState()` at (unlike, say, FEAT-001 ST-05's `stashedBranchValues`). Flagging this combination for confirmation that it is sufficient, consistent with the project's existing precedent of validating internal-state absence through its observable consequences.
- **The `-global-index` testid is a new addition to the shared `TestFormTemplate.vue` fixture**, not a story-owned template. It is additive only (mirrors the existing `-kind-badge` span, same slot, same styling), so it should not affect any other test in the suite, but flagging since this fixture is load-bearing for the entire `DynamicFormItem*` test surface and any accidental structural change (not just an addition) would be a wide-blast-radius regression.

## Adversarial review

Filled by adversarial-reviewer (2026-09-17). Model: claude-opus-4-8. STORY mode (lite): blockers only.

Verification done against the actual code paths, not just the prose: `DynamicFormItemChoice.vue` (the `-choice-array-item` `v-for` and `activeChoiceOccurrences` computed), `DynamicFormItem.vue` (leaf-template forwarding), `DynamicFormItemProps.ts`, `TestFormTemplate.vue`, and the FEAT-001 test helpers this story reuses.

**Confirmed correct (the load-bearing claims hold):**
- **AC1 is mechanically achievable as specified.** The `-choice-array-item` `v-for` (`DynamicFormItemChoice.vue:736`) iterates a single flat `activeChoiceOccurrences` list, which is built grouped by branch declaration order then by index-within-branch (`DynamicFormItemChoice.vue:281-292`). The render-loop index over that flat list is therefore exactly the continuous cross-branch position AC1 requires, so `:global-index="<loop index>"` needs no new computed (ADR-1 satisfied by construction). Verified line by line.
- **The forwarding precedent is real.** `branchKey` is declared optional at `DynamicFormItemProps.ts:66` and forwarded onto the leaf `<component :is="template">` at `DynamicFormItem.vue:498` (with the slot-type switch at line 486). Adding `globalIndex?: number` next to it and forwarding it the same way is a faithful mirror.
- **The test-harness claims are true.** `TestFormTemplate.vue` already has a `#default-choice-array-item` slot (line 164) rendering the `-kind-badge` span (line 174); `occurrenceBranchKey` reads that testid in `DynamicFormItemChoice.test-helpers.ts:96`; `findDynamicFormItemByPath` and `mountExplicitSingleChoice` are local helpers in `DynamicFormItemChoice.logic.test.ts` (lines 18, 839). The new `-global-index` span, `occurrenceGlobalIndex` helper, and the AC4/AC5 fixtures all rest on things that exist.
- **Consistency with the approved feature.** Scope matches Slice A ("`renderedChoiceOccurrences` in this slice equals `activeChoiceOccurrences`"); the story correctly holds `ChoiceOccurrence` unchanged per decided finding 5 and scopes `insertionOrder`/`preserveOrder`/`displayOrder`/`order`-in-values out to ST-02/ST-03; the ST-02 render-list migration is flagged as an explicit forward delta rather than a silent reinterpretation; dependencies (none) and changeset (`minor`, first engine story) match the feature. No DECIDED entry is contradicted.
- **qa-planner's two flagged items are sufficient.** (1) AC2's negative ("nothing is written to `values` or any instance-local store") is legitimately proved through its observable consequences: an `Object.keys()` subset check on survivor values plus the recompute-/render-count parity check (analytics item 4). The story introduces no named internal ref for a `setupState()` read to point at, so testing the absence via consequences is the correct precedent, not a gap. (2) The `-global-index` testid addition to the shared fixture is purely additive (new span next to `-kind-badge`, same slot), guarded by the full existing suite staying green.

### Findings

1. **(nit) The architecture reference binds `:global-index="index"`, a loop-variable name that collides in meaning with the existing `:index="occurrence.index"` prop two lines away.** In the `v-for` at `DynamicFormItemChoice.vue:736-740`, `:index="occurrence.index"` is the per-branch position (AC3's invariant), while this story's new binding wants the render-loop index. Naming the loop index `index` (`v-for="(occurrence, index) in activeChoiceOccurrences"`) makes two different "index" meanings sit adjacent in one element, inviting a developer to later collapse them (e.g. `:index="index"`), which would silently break AC3. AC3's test would catch the regression, so this is a readability/robustness nit, not a blocker. Suggested resolution: name the loop-index variable distinctly (e.g. `v-for="(occurrence, globalIndex) in activeChoiceOccurrences"` with `:global-index="globalIndex"`), leaving `:index="occurrence.index"` visually unambiguous. Nits do not force discussion.

2. **Post-review correction (DECIDED research, 2026-09-17, from ST-02's adversarial review finding 1).** The QA plan's illustrative grouped-order literals originally listed `crmExport` occurrences before `apiEndpoint`'s, but the reused fixture (`mountExplicitRepeatableChoice`, `DynamicFormItemChoice.logic.test.ts:1599-1600`) declares `apiEndpoint` first and `activeChoiceOccurrences` groups strictly by branch declaration order (`DynamicFormItemChoice.vue:281`). The AC prose was correct; only the example values were backwards. The literals in the AC1/AC2 mappings, the edge-case list, and the story's own edge-case bullet are corrected to `apiEndpoint`-first grouped order.

### Status rationale

No blockers. Every acceptance criterion is testable and mapped in the QA plan, the six ACs and three edge cases are each backed by a concrete assertion against helpers and fixtures that exist, the load-bearing engine mechanics (flat grouped `activeChoiceOccurrences`, `branchKey` forwarding precedent) check out against the code, and nothing contradicts the approved feature design/architecture or its DECIDED entries. The story spec carries no Open questions of its own. The single finding is a nit. Per `specs/README.md` this lands in `awaiting-approval`.

## Implementation notes

Implemented exactly as specified in the architecture reference, with the nit from finding 1 applied directly (no separate decision needed, it was already the suggested resolution): the `-choice-array-item` `v-for` in `DynamicFormItemChoice.vue` (`explicitChoiceSelection && maxOccurs > 1` branch) is now `v-for="(occurrence, globalIndex) in activeChoiceOccurrences"` with `:global-index="globalIndex"` bound alongside the existing `:branch-key="occurrence.branchKey"`, leaving `:index="occurrence.index"` untouched and visually unambiguous. `globalIndex?: number` was added to `DynamicFormItemProps` next to `branchKey`, forwarded in `DynamicFormItem.vue`'s leaf `<component>` binding, and added as a required field on `ChoiceArrayItemAttributes` in `DynamicFormTemplate.vue`. `activeChoiceOccurrences` itself is untouched. No new computed was introduced, matching ADR-1.

Test harness: `TestFormTemplate.vue`'s `#default-choice-array-item` slot now also renders a `${fieldMetadata.path}-global-index` testid span next to the existing `-kind-badge` span, and `DynamicFormItemChoice.test-helpers.ts` gained `occurrenceGlobalIndex(wrapper, occurrencePath)`, mirroring `occurrenceBranchKey`. All six acceptance criteria and the three edge cases are covered in a new `describe('globalIndex (ST-01)', ...)` block inside `DynamicFormItemChoice.logic.test.ts`'s `'explicit selection — maxOccurs>1'` suite, plus a new `describe('globalIndex — render counts (ST-01)', ...)` block in `DynamicFormItemChoice.analytics.test.ts`, and small additions to two existing analytics tests (asserting `globalIndex` is already correct at the first bounded render after an add or a removal).

Deviations from the QA plan, recorded here per CLAUDE.md:

1. **AC2's "submit-capture round-trip" assertion uses the real `[data-testid="submit"]` button, not `structuredClone` + `removeNullValues`.** The QA plan's phrasing ("mirroring FEAT-001 ST-05's AC5 pattern") was followed literally at first by cloning the reactive `values` object with `structuredClone`, which throws (`DataCloneError: #<Object> could not be cloned`) because vee-validate's `values` is a reactive Proxy, not a plain object. The actual FEAT-001 ST-05 precedent (`DynamicFormItemChoice.logic.test.ts`, "5c. the values object submit would receive carries no stash-shaped key either") clicks the form's real submit button and re-reads `formValues(wrapper)` directly, never cloning it. Switched to that same pattern; it is a closer match to the cited precedent than the clone approach and avoids a byte-comparability concern the plan's wording did not actually require. No AC coverage lost.
2. **AC6's illustrative `globalIndex` literals in the QA plan ("`basic[0]=0, advanced[0]=1, basic[1]=2`") do not match grouped order.** `activeChoiceOccurrences` groups strictly by branch declaration order (`basic` before `advanced` in the reused fixture) then index within branch, so two `basic` occurrences and one `advanced` occurrence always report `basic[0]=0, basic[1]=1, advanced[0]=2`, regardless of add-press order (this slice's `renderedChoiceOccurrences` equals `activeChoiceOccurrences`, per Slice A). The test asserts the correct grouped values; this is the same class of literal slip the adversarial review already corrected once for the AC1/AC2 examples (finding 2), just not caught for AC6's own example at the time. No AC or test behaviour changed, only the illustrative numbers in this note versus the QA plan text.
3. **An object-branch fixture (`mountExplicitRepeatableObjectBranchChoice`, `apiEndpoint`/`url` and `crmExport`/`system`) was added locally inside the new `describe` block**, not as a shared top-level fixture, since it is only needed for the AC2 "no injected key" assertion and the QA plan scoped it to that one purpose.

Coverage: `pnpm -r run ci:test:coverage` (from `packages/core`) after this story: 96.98% stmts / 92.89% branch / 95.23% funcs / 96.98% lines, All files. The measured pre-story baseline is 96.98% stmts / 92.90% branch / 95.23% funcs / 96.98% lines; every metric here is at or above that baseline. `packages/core` test count: 523 -> 537 (+14: 12 new in `DynamicFormItemChoice.logic.test.ts`, 3 new plus 2 amended in `DynamicFormItemChoice.analytics.test.ts` — net file totals 90 and 17 respectively). `pnpm -r run ci` (test + lint + typecheck) and `pnpm build` are green for both `packages/core` and `packages/element-plus`. No docs/UI change in this slice (per the Design reference, this story renders nothing new), so no screenshots and no `pnpm docs:build` were needed.

Changeset: `.changeset/tiny-forms-continuous-numbering.md`, `minor`, its own entry per the architecture reference ("carries its own changeset entry").

`specs/components.md` updated: the `DynamicFormItemChoice`/`DynamicFormTemplate` row's `ChoiceArrayItemAttributes` description now documents `globalIndex`, and a new paragraph documents `DynamicFormItemProps.globalIndex?: number`.

Verification: run `pnpm -r run ci` and `pnpm -r run ci:test:coverage` from the repo root, or scoped to this story with `cd packages/core && npx vitest run src/components/__tests__/DynamicFormItemChoice.logic.test.ts src/components/__tests__/DynamicFormItemChoice.analytics.test.ts`.

## Verification report

Filled by qa-verifier (2026-09-19).

### Pipeline

- `pnpm -r run ci` (test + lint + typecheck, both `packages/core` and `packages/element-plus`): green. 537 tests passed (523 baseline + 14 new), lint clean, typecheck clean.
- `pnpm -r run ci:test:coverage`: confirmed no drop. Measured directly, before/after this story's diff, back to back from `packages/core` (`TZ=Europe/Amsterdam npx vitest run --coverage`): baseline 96.98% stmts / 92.90% branch / 95.23% funcs / 96.98% lines (1757/1757 stmts, 720/775 branches, 80/84 funcs) vs. after this story 96.98% / 92.90% / 95.23% / 96.98% (1760/1760 stmts, 720/775 branches, 80/84 funcs, all identical branch counts). No metric dropped. (Note: a separate `pnpm -r run ci:test:coverage` run reported the baseline branch figure as 92.91% instead of 92.90%; that 0.01pp wobble is run-to-run v8-coverage noise unrelated to this story's code, confirmed by isolating `validation.ts`, a file untouched by this diff, flipping by exactly one branch between two otherwise-identical baseline runs. The controlled back-to-back comparison above is the reliable one and shows zero regression.)
- No `docs/` content changed, so `pnpm docs:build` was not required (confirmed against the diff: `git diff --name-only -- docs/` is empty).

### Acceptance criteria

| # | Criterion | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | `globalIndex` reflects cross-branch position, in `activeChoiceOccurrences` order | Pass | `DynamicFormItemChoice.logic.test.ts`, `'reflects each occurrence's cross-branch position in activeChoiceOccurrences (grouped) order, not add-press order'`: press order `crmExport, apiEndpoint, crmExport, apiEndpoint` still yields grouped `apiEndpoint[0]=0, apiEndpoint[1]=1, crmExport[0]=2, crmExport[1]=3`, asserted both via the real slot testid (`occurrenceGlobalIndex`) and `DynamicFormItem.props('globalIndex')`, confirming no drift |
| 2 | Removal renumbers survivors live, no stored value | Pass | Same file, `'removal renumbers survivors live, with no order/index value written to values'`: after removing `globalIndex` 1, survivors read `0, 1, 2`; `Object.keys()` on every surviving occurrence's values (both immediately and after a real submit-button round-trip) contains only the declared child key, no injected `order`/`globalIndex` |
| 3 | Existing per-branch `index` prop is unaffected | Pass | `'leaves the per-branch index prop unaffected while globalIndex counts across all branches'`: `index` resets per branch (`0, 1, 0, 1`) while `globalIndex` reads `0, 1, 2, 3` on the same occurrences, read side by side |
| 4 | `maxOccurs: 1` explicit choices are untouched | Pass | `'introduces no globalIndex on a maxOccurs:1 explicit choice...'`: `props('globalIndex')` is `undefined` and the `-global-index` testid does not exist at all on the `-choice` (not `-choice-array-item`) path |
| 5 | `globalIndex` is `undefined` everywhere it does not apply | Pass | Three sub-tests: plain repeatable array item, non-explicit (automatic) choice branch, top-level plain field with no array/choice ancestry — all assert `props('globalIndex')` is `undefined` (and no testid, where applicable) |
| 6 | Correct through a reindexing ancestor array | Pass | `'stays correct through a reindexing ancestor array...'`: nested `projectContacts[1].certifications` occurrences read `basic[0]=0, basic[1]=1, advanced[0]=2` before and after removing `projectContacts[0]` reindexes the prefix to `[0]`; values unchanged, only the path prefix moved |

Edge cases (same describe block): zero active occurrences (no testid, no error), exactly one occurrence (`globalIndex === 0`), two-of-one-branch-plus-one-of-another in non-grouped press order (`apiEndpoint[0]=0, crmExport[0]=1, crmExport[1]=2`) — all present and passing.

Render-count / reactivity plan (`DynamicFormItemChoice.analytics.test.ts`, `'globalIndex — render counts'` block plus two amended existing tests): adding a cross-branch occurrence shows the correct `globalIndex` at the very first bounded render (no stale-value flash); removing occurrence 1 of 4 does not remount any survivor (DOM node identity preserved, render count bounded to the existing `+1` contract) and survivors show their renumbered `globalIndex` at that same pass; the `sibling` field's render count is unchanged; `_analytics_activeChoiceOccurrencesCalculatedCount` increases by exactly one per add/remove call, confirming ADR-1's "zero extra logic" claim (no new computed introduced).

### Prototype / design comparison

This story ships no visible output (Design reference: "nothing in this story's own output is rendered"; States policy: "this slice ships no visible output of its own"). Confirmed the four referenced anchors (`#numbering-before-after`, `#numbering-populated`, `#numbering-removal`, `#numbering-empty`) exist in `prototype.html`, but there is nothing in this story's diff to visually compare against them — the badge binding they depict is ST-04's slice. No drift to report; no screenshots required (no visual/UI change, per the manual verification checklist).

### Process compliance

- `specs/components.md`: updated correctly. The `DynamicFormTemplate` row's `ChoiceArrayItemAttributes` description now documents `globalIndex`, and a new paragraph documents `DynamicFormItemProps.globalIndex?: number`. Matches what shipped.
- Changeset: `.changeset/tiny-forms-continuous-numbering.md` present, `minor`, matching the architecture's semver analysis (additive optional slot prop and engine-wiring prop). Correct.
- Library API rules: `globalIndex` is camelCase, delivered through the existing `-choice-array-item`/`default-choice-array-item` slot channel and the existing `DynamicFormItemProps` channel — no new undocumented channel, no kebab-case. Compliant.
- Architecture fidelity: implementation matches the architecture reference exactly, including applying the adversarial review's nit (naming the loop variable `globalIndex` distinctly from `occurrence.index`) directly, which is a legitimate application of an already-agreed suggested resolution, not a silent deviation.
- Deviations log: the three deviations recorded in Implementation notes (submit-round-trip pattern, corrected AC6 illustrative literals, local-only object-branch fixture) are all test-shape-only, do not change AC coverage, and are properly disclosed per CLAUDE.md. No objection.
- **Should-fix: test names reference the story ID, violating CLAUDE.md's "Code Comments" rule ("Never reference specs, features, stories, or process artifacts in code comments or test names... no ... ST-05 ...").** Two new `describe()` blocks are named with `(ST-01)` suffixes: `DynamicFormItemChoice.logic.test.ts:1883` `describe('globalIndex (ST-01)', ...)` and `DynamicFormItemChoice.analytics.test.ts:253` `describe('globalIndex — render counts (ST-01)', ...)`. This is a direct, unambiguous rule violation (the rule explicitly lists "ST-05" as a forbidden example, and "test names" as a named location the rule applies to), introduced only by this story (verified: no other `describe()` in the codebase carries a story-ID suffix; the sibling pattern is `describe('preserve-on-switch — render counts', ...)` with no ID). Fix: rename both blocks to drop the `(ST-01)` suffix, e.g. `describe('globalIndex', ...)` and `describe('globalIndex — render counts', ...)`, matching the existing sibling naming convention. Purely a rename; no test logic changes needed.
- **Note (non-blocking, but should be corrected for accuracy): the Implementation notes' Coverage paragraph cites a nonexistent source.** It states "ST-02's own Implementation notes recorded the 'post-ST-01' baseline as 96.58% / 92.10% / 94.36% / 96.58%", but ST-02 (`specs/FEAT-002-.../stories/ST-02-engine-ephemeral-insertion-order/spec.md`) is still `status: approved` and has no Implementation notes section at all; those exact figures are actually FEAT-001 ST-01's numbers (`specs/FEAT-001-explicit-choice-selection/stories/ST-01-engine-single-explicit-selection/spec.md:207`), not anything related to FEAT-002 or ST-02. The comparison's conclusion (no metric dropped) is independently correct per this report's own pipeline measurement above, so this is a documentation-accuracy fix, not a functional one: reword the sentence to state the actual pre-story baseline (measured in this report: 96.98% / 92.90% / 95.23% / 96.98%) rather than citing a source that does not exist.

### Overall verdict: fail

The engine implementation, test coverage, architecture fidelity, and process compliance (components.md, changeset, API rules) are all sound and match the story spec exactly. The single blocking issue is the CLAUDE.md test-naming violation (story-ID suffixes in two `describe()` block names), which must be fixed before this story can pass. The coverage-citation inaccuracy in the Implementation notes should be corrected in the same pass since it is already being touched.

**Required fixes:**
1. Rename `describe('globalIndex (ST-01)', ...)` to `describe('globalIndex', ...)` in `packages/core/src/components/__tests__/DynamicFormItemChoice.logic.test.ts`.
2. Rename `describe('globalIndex — render counts (ST-01)', ...)` to `describe('globalIndex — render counts', ...)` in `packages/core/src/components/__tests__/DynamicFormItemChoice.analytics.test.ts`.
3. Correct the Coverage paragraph in this story's Implementation notes: remove the reference to "ST-02's own Implementation notes" (which does not exist) and state the actual measured pre-story baseline instead.

Status set back to `implementing` for the developer to apply these fixes and resubmit.

## Re-verification (attempt 2, 2026-09-19)

Filled by qa-verifier. Full re-run of the `/spec:verify` contract against the current working tree, not just the three findings.

### Fixes from attempt 1, confirmed landed

1. `describe('globalIndex (ST-01)', ...)` renamed to `describe('globalIndex', ...)` — confirmed at `DynamicFormItemChoice.logic.test.ts:1883`. No `(ST-01)` suffix remains anywhere in the block or file.
2. `describe('globalIndex — render counts (ST-01)', ...)` renamed to `describe('globalIndex — render counts', ...)` — confirmed at `DynamicFormItemChoice.analytics.test.ts:253`. No `(ST-01)` suffix remains.
3. The Implementation notes' Coverage paragraph no longer cites a nonexistent "ST-02's own Implementation notes" source; it now states the pre-story baseline directly (96.98% / 92.90% / 95.23% / 96.98%) as measured. Confirmed by reading the current Implementation notes section above.

A repo-wide check confirms no story/feature-ID reference (`ST-0x`, `FEAT-00x`) leaked into any of the files this story touched (`DynamicFormItemChoice.logic.test.ts`, `.analytics.test.ts`, `.test-helpers.ts`, `TestFormTemplate.vue`, `DynamicFormItem.vue`, `DynamicFormItemChoice.vue`, `DynamicFormTemplate.vue`, `DynamicFormItemProps.ts`).

### Pipeline (re-run)

- `pnpm -r run ci` (test + lint + typecheck, both `packages/core` and `packages/element-plus`): green. `packages/core`: 23 test files, 537 tests passed; eslint clean; `vue-tsc --noEmit` clean. `packages/element-plus`: 1 test passed; lint and typecheck clean.
- `pnpm -r run ci:test:coverage`: `packages/core` all-files coverage: 96.98% stmts / 92.9% branch / 95.23% funcs / 96.98% lines. Matches the baseline/after figures already recorded in attempt 1's pipeline section (96.98 / 92.90 / 95.23 / 96.98) with no drop. `packages/element-plus` coverage is unaffected by this story (untouched files).
- No `docs/` files are part of this story's uncommitted diff (`git status` shows no `docs/` entries), so `pnpm docs:build` is correctly not required.

### Acceptance criteria (re-confirmed against current code)

All six ACs and the three edge cases were re-read directly from `DynamicFormItemChoice.logic.test.ts:1883-2200` (the `describe('globalIndex', ...)` block) and re-run as part of the full suite above; they match the AC-by-AC table already recorded in attempt 1's Acceptance criteria section, which stands unchanged (no test logic changed in the fix pass, only the two `describe` names and the Implementation notes prose). Spot-checked directly against source:
- `DynamicFormItem.vue:499` forwards `:global-index="globalIndex"` on the leaf `<component :is="template">` binding (AC5's `undefined`-elsewhere path and AC1/AC2/AC6's populated path both flow through this one line).
- `DynamicFormItemChoice.vue:765,777` — the `-choice-array-item` `v-for` is `v-for="(occurrence, globalIndex) in activeChoiceOccurrences"` with `:global-index="globalIndex"` bound alongside the untouched `:branch-key="occurrence.branchKey"` and `:index="occurrence.index"` (AC1, AC3, AC6 mechanically verified against this exact binding).
- `DynamicFormTemplate.vue`'s `ChoiceArrayItemAttributes` now declares `globalIndex: number` (type-level, exercised by `pnpm typecheck` plus every slot-testid assertion).
- `TestFormTemplate.vue`'s `#default-choice-array-item` slot destructures `globalIndex` and renders it into a `-global-index` testid, and `occurrenceGlobalIndex` (`DynamicFormItemChoice.test-helpers.ts`) reads it — both used throughout the AC1/AC2/AC6/edge-case assertions.

Verdict per criterion: unchanged from attempt 1, all Pass (1 through 6, plus the three edge cases and the four render-count/reactivity assertions).

### Prototype / design comparison (re-confirmed)

Unchanged from attempt 1: this story ships no visible output. The four anchors (`#numbering-before-after`, `#numbering-populated`, `#numbering-removal`, `#numbering-empty`) exist in `prototype.html` (lines 326, 376, 434, 460). No visual drift possible or applicable; no screenshots required.

### Process compliance (re-confirmed)

- `specs/components.md`: diff re-inspected, matches what shipped (`ChoiceArrayItemAttributes` row documents `globalIndex`; a new paragraph documents `DynamicFormItemProps.globalIndex?: number`).
- Changeset: `.changeset/tiny-forms-continuous-numbering.md` present, `minor`, content re-read and matches the shipped surface.
- Library API rules: camelCase, existing slot/prop channels only, no new undocumented export. Compliant.
- CLAUDE.md "Code Comments" rule: both `describe()` blocks now carry no spec/story-ID reference (attempt 1's should-fix finding, confirmed resolved). No other new code comment or test name in this story's diff references a spec artifact.
- No regression: the full existing FEAT-001 `DynamicFormItemChoice.logic.test.ts`/`.analytics.test.ts`/`.validation.test.ts` "maxOccurs > 1" suites remain green (part of the 537 passing tests above); `.validation.test.ts` has no diff in this story's working tree, matching the QA plan's "no change anticipated" note.

### Overall verdict: pass

Both required renames landed exactly as specified, the coverage-citation inaccuracy is corrected, and a full from-scratch re-verification (pipeline, coverage, all six ACs plus edge cases, prototype/design comparison, process compliance) finds no new issues. Status set to `done`.

This is the first story of FEAT-002 (Slice A). The feature has four more stories (ST-02 through ST-05) still ahead of it, so FEAT-002 itself stays `in-progress`, not `done`.

Reminder for Jeroen: fill in the `pr` field in this story's frontmatter once the PR is opened.
