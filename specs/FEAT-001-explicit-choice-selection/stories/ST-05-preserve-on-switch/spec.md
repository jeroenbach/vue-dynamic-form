---
id: ST-05
type: story
feature: FEAT-001
status: done
created: 2026-09-10
approved_by: Jeroen
pr: ""
---

# Story: Preserve-on-switch for explicit choice selection

## Functional
### User story
As a template author using explicit `maxOccurs: 1` choice selection, I want an opt-in way to keep a branch's previously entered data when the user switches away and back, so that accidental or exploratory switching does not force the user to re-enter data, without changing the default clear-on-switch behaviour for everyone else.

### Acceptance criteria

1. **Default behaviour is unchanged (opt-in, defaulted off).**
   Given the new preserve-on-switch flag is absent or `false`,
   When a user switches branches on an explicit `maxOccurs: 1` choice,
   Then the branch clears exactly as ST-01 implemented it (clear-on-switch stays the baseline, per DECIDED Q7).

2. **Enabling the flag stashes data outside `values` before clearing.**
   Given the flag is enabled on a `maxOccurs: 1` explicit choice, and branch `selfServe` currently holds field data,
   When `addChoiceOccurrence('guidedRollout')` is called,
   Then, before the branch clears, its current values (read via `useFormContext().values` at `branchPath`) are deep-cloned into an instance-local ephemeral stash (never written to form `values`, consistent with decision 4), and the branch is then cleared exactly as in the default path.

3. **Switching back restores the stash.**
   Given `selfServe` was stashed per AC 2,
   When `addChoiceOccurrence('selfServe')` is called again,
   Then the stashed values are restored via `setFieldValue(branchPath, stashed)`, and the branch's fields render with that previously entered data rather than empty.

4. **Restored data starts with fresh touched/validation state.**
   Given a restored branch from AC 3,
   When its fields first render again,
   Then their vee-validate touched/validation state is reset (they behave like freshly re-entered data, not as if they were always present), matching the accepted caveat in the feature architecture's preserve-on-switch subsection.

5. **The stash is pure ephemeral UI state.**
   Given preserve-on-switch is enabled and a stash exists,
   When the raw submitted `values` object is inspected (e.g. at `handleSubmit`),
   Then no stash data or stash-related key appears in it; only whichever branch is currently active contributes to `values`, consistent with decision 4 ("explicit selection state is pure UI state, never in form values") extended to the stash.

### Edge cases
- Switching away from a branch twice in a row without ever switching back (`selfServe -> guidedRollout -> apiEndpoint`): only the most recent stash per branch is kept (a fresh stash for `selfServe` on its next deselect overwrites any earlier one); no unbounded stash growth across many switches of the same branch.
- Preserve-on-switch enabled but the branch was never filled in before switching away (empty branch stashed): switching back restores an empty branch, which is behaviourally indistinguishable from a fresh empty selection.
- Preserve-on-switch inside a choice nested in an array occurrence (decision 6): the stash is per `DynamicFormItemChoice` instance, so it follows the same per-occurrence isolation ST-01 established; no cross-item leakage.

### Out of scope
- Any change to the `maxOccurs > 1` repeatable case; the feature architecture scopes preserve-on-switch to `maxOccurs: 1` only ("technically feasible and low cost for `maxOccurs: 1`"), so this story does not touch ST-02's per-branch array occurrences.
- Any UI in the docs example demonstrating this flag; the feature scope does not require the onboarding planner example to turn it on (ST-03 ships with the default clear-on-switch baseline). A docs mention is optional and, if added, belongs to ST-04.

## Design reference
Feature prototype (`../../prototype.html`): `#single-switch` documents preserve-on-switch as "noted as deferred with no UI" at prototype time; this story is that deferred behaviour becoming real, still with no dedicated prototype panel of its own (no new visual language: the visible outcome, a restored branch's fields showing prior data, looks identical to `#single-selected`/`#single-selected-guided` already drawn). No new anchor is needed.

## Architecture reference
Builds on ST-01, against the feature architecture's "Preserve-on-switch verdict" subsection (DECIDED Jeroen 2026-09-10, Q7):

- **`packages/core/src/components/DynamicFormItemChoice.vue` (modified, extends ST-01's clear-on-switch).** Adds `stashedBranchValues = ref<Record<string, unknown>>({})` (keyed by `branchKey`); before the existing clear in `addChoiceOccurrence`'s switch path, deep-clones the deselected branch's current values (read via `useFormContext().values` at `branchPath`) into the stash when the new flag is enabled; on selecting a branch that has a stash entry, restores it with `setFieldValue(branchPath, stashed)` instead of leaving the branch empty.

  > **ACCEPTED, DECIDED (research, 2026-09-10). PROPOSED (adversarial review) — restore must pass `shouldValidate: false` (finding 2).** `setFieldValue(field, value, shouldValidate?)` defaults `shouldValidate` to `true` when the third argument is omitted (verified: `vee-validate.d.ts:331`). The clear path deliberately passes `false` (`setFieldValue(branchPath, undefined, false)`, ST-01 AC4). If restore is written as `setFieldValue(branchPath, stashed)` (as the feature architecture's verdict text spells it, with no third arg), it requests validation on restore, which risks an error flashing on a restored-but-empty required field and works against AC4's pristine requirement and its companion "no error message renders immediately after restore" case. Proposed resolution: restore with `setFieldValue(branchPath, stashed, false)`, mirroring the clear path, so the freshly re-mounted branch starts pristine. This is a refinement of the architecture's optional third arg, not a contradiction of it, so no feature-spec amendment is needed; AC3's mapping should assert the pristine post-restore state accordingly.
- **New opt-in flag (public API, additive).** Per the feature architecture, either a `DynamicFormSettings` boolean or a `FieldMetadata` boolean, both safe-defaulted off; the architect's verdict text names both as options without picking one, so this story's implementation confirms the final placement against `DynamicFormSettings.ts` / `FieldMetadata.ts` conventions during implementation (a `FieldMetadata` boolean sitting next to `explicitChoiceSelection` keeps it discoverable per-choice; a `DynamicFormSettings` boolean would be global). If the choice made here contradicts anything already decided in the feature spec, it is flagged there first rather than silently resolved in this story, per the hard rule on story-level changes.

  > **ACCEPTED, DECIDED (research, 2026-09-10). PROPOSED (adversarial review) — pick the flag surface now (finding 1).** Leaving a published-library public-API surface for the developer to settle at implementation time is not appropriate for this repo; whichever surface ships is a permanent consumer-facing contract. Proposed pick: a per-choice `FieldMetadata` boolean (`preserveOnSwitch?: boolean`) sitting next to `explicitChoiceSelection`, not a `DynamicFormSettings` boolean. Rationale (rung 3, codebase pattern): preserve-on-switch is inherently per-choice behaviour that only applies to choices already carrying `explicitChoiceSelection: true`, so it belongs on the same node; the per-choice surface is strictly more expressive than a global one (a consumer can still set it on every choice for form-wide behaviour, or vary it per choice), and it is discoverable right beside the flag that gates it. Binding consequence if accepted: like `explicitChoiceSelection` (feature finding 4, ST-01 AC9), `preserveOnSwitch` must be added to the `ComputedPropsFieldType` `Omit` list in `FieldMetadata.ts` so a `computedProps` mutation cannot flip stash behaviour mid-form; the story currently does not mention this. Jeroen to confirm the surface and the `Omit` treatment; if he prefers the `DynamicFormSettings` surface instead, that is his call to make here rather than the developer's.
- **Public API surface touched:** one new optional boolean (additive, defaulted off) plus no change to any existing export's shape. Additive -> minor.
- **Dependencies:** ST-01 (the `explicitChoiceSelection` flag, `addChoiceOccurrence`, and the clear-on-switch mechanism this story augments). Does not block ST-02, ST-03, or ST-04; it is a pure add-on per the feature architecture's slicing seams ("does not block anything else").
- **Changeset:** this story touches `packages/core/src/`, so it carries its own changeset entry (`minor`) for the new opt-in flag.
- **`specs/components.md`:** update once implemented with the new flag, on whichever type it lands on.

## QA plan

This story extends the fixtures and mechanism ST-01 builds: the `pick` (`selfServe`/`guidedRollout`/`apiEndpoint`) `maxOccurs: 1` choice fixture for AC1-AC5 and the edge cases, and the `projectContacts` two-item array-of-choice fixture (ST-01 AC11) for the per-instance isolation edge case. No new fixture component is needed: `TestFormTemplate.vue`'s `#default-choice` slot already exposes `addChoiceOccurrence`/`removeChoiceOccurrence`/`canAddChoiceOccurrence`/`activeChoiceOccurrences` per ST-01's QA plan, and `TestForm`'s existing `settings` prop already threads arbitrary settings through generically, so whichever flag surface the developer lands on (see "Flag surface" below) needs no new fixture markup, only a new metadata property or a new settings key on the existing mount calls.

### Test files touched

| File | Status | Purpose |
| --- | --- | --- |
| `DynamicFormItemChoice.logic.test.ts` | extend | New `describe('preserve-on-switch (ST-05)')` block: AC1 (regression, flag absent and flag `false`), AC2 (stash-before-clear, verified jointly with AC3), AC3 (restore), AC5 (stash never in `values`), the three functional edge cases, plus one QA-plan addition (first-ever selection with no stash, see "Flags for reviewer"). |
| `DynamicFormItemChoice.validation.test.ts` | extend | New `describe('preserve-on-switch — touched/validation reset (AC4)')` block: AC4, plus the "restored-but-still-empty required field does not show an error on first render" companion case. |
| `DynamicFormItemChoice.analytics.test.ts` | extend | New `describe('preserve-on-switch — render counts (ST-05)')` block: restore-in-one-render, no extra `occurrences` recompute from stash capture, sibling isolation, and a flag-off baseline-unchanged check. |
| `DynamicFormItemChoice.test-helpers.ts` | extend | One new helper, `enablePreserveOnSwitch(metadata, branchOrChoicePath)` (or equivalent), that patches the fixture metadata/settings with whichever flag surface the developer lands on (see "Flag surface" below), so every test in this plan calls the helper instead of hardcoding a property name. Optionally, a best-effort `stashedBranchValues(wrapper, path)` reader via `setupState()`, only if the developer names the stash ref predictably; not required for any test to pass. |

No change anticipated to `TestFormTemplate.vue`, `DynamicFormItem.test-helpers.ts`, or `removeNullValues.ts`/its test.

### Flag surface (left open by the story, flagged for reviewer)

The story's architecture reference explicitly defers whether the flag is a `DynamicFormSettings` boolean or a `FieldMetadata` boolean to implementation. This QA plan does not pick one: every test below is written against the `enablePreserveOnSwitch(...)` fixture helper rather than a hardcoded property name, so the test *behaviour* is stable regardless of which surface the developer chooses. Once decided, only the helper's implementation needs updating, not the individual tests. If the developer's choice contradicts anything already decided elsewhere in the feature spec, that is amended there first per the hard rule on story-level overrides; a placement choice between the two options the architecture already named is not such a contradiction.

### Acceptance criteria → test mapping

1. **Default behaviour unchanged (opt-in, defaulted off).**
   - 1a. Flag absent: reuse the ST-01 AC4/AC10 fixture and flow (fill `selfServe`, switch to `guidedRollout`) and assert the exact same residue shape ST-01 pins (`pick.selfServe` present with `undefined` leaves). Then additionally switch back to `selfServe` (`addChoiceOccurrence('selfServe')`) and assert it renders **empty**, not restored, proving the absence of the flag also means "no restore," not just "clears as before."
   - 1b. Same flow with the flag explicitly set to `false` via `enablePreserveOnSwitch(metadata, { enabled: false })`: identical assertions, confirming `false` and absent behave identically (not two different code paths that happen to agree today).
   `DynamicFormItemChoice.logic.test.ts`.

2. **Enabling the flag stashes data before clearing.**
   Tested jointly with AC3, since the stash is not observable black-box in isolation: if the implementation captured the stash *after* the clear instead of before, AC3's restore assertion would fail (it would restore empty data instead of the original). As a direct companion check: immediately after the switch-away call (before ever switching back), assert `formValues(wrapper).pick.selfServe` is byte-identical to the flag-off residue shape from AC1, i.e. enabling the flag changes nothing about the clearing behaviour or its timing, only adds the stash side channel. `DynamicFormItemChoice.logic.test.ts`.

3. **Switching back restores the stash.**
   Enable the flag, select `selfServe`, fill its field(s) with a known value, switch to `guidedRollout` (assert cleared, per AC1's shape), switch back to `selfServe` via `addChoiceOccurrence('selfServe')`. Assert: the `selfServe` input's DOM value equals the original entry, `formValues(wrapper).pick.selfServe` equals the original filled shape, and `guidedRollout`'s `DynamicFormItem` has unmounted (the active-branch contract from ST-01 still holds: exactly one branch mounted). `DynamicFormItemChoice.logic.test.ts`.

4. **Restored data starts with fresh touched/validation state.**
   Fill a required field inside `selfServe` so it becomes touched and valid (or touched and invalid, then corrected), switch away, switch back. Assert `setupState(wrapper, 'pick.selfServe.<field>')`'s `fieldContext.meta.touched` and `.validated` are both `false` immediately after restore, matching a freshly mounted field, not the touched/validated state it had before switching away.
   Companion case: restore a stash where a required field inside the branch was left empty; assert no error message renders immediately after restore (pristine, not "always invalid"), the same as a freshly selected empty branch.
   `DynamicFormItemChoice.validation.test.ts`.

5. **The stash is pure ephemeral UI state, never in `values`.**
   - 5a. After stashing (switch-away, flag on): assert the keys of `formValues(wrapper).pick` and of `formValues(wrapper)` overall contain only the metadata-declared branch names, with no extra key (e.g. no `_stash`/`stashedBranchValues`-shaped key leaking in).
   - 5b. Same assertion immediately after restore (switch-back).
   - 5c. Trigger the `TestForm`'s submit handler (reusing the existing submit-capture pattern already used elsewhere in the suite) at both points above and assert the values object the submit callback receives carries no stash-shaped key either.
   `DynamicFormItemChoice.logic.test.ts`.

**Edge cases** (same new describe block in `DynamicFormItemChoice.logic.test.ts` unless noted):

- **Only the most recent stash per branch is kept; restore-then-edit-then-switch-again keeps the latest data.** Fill `selfServe = 'A'`, switch to `guidedRollout` (stash `selfServe: 'A'`), switch directly to `apiEndpoint` (`selfServe -> guidedRollout -> apiEndpoint`), switch back to `selfServe`: assert it restores `'A'` (untouched by the intermediate hop). Then: switch to `guidedRollout` again (stash `selfServe: 'A'` again, same value), switch back to `selfServe` (restore `'A'`), edit the value to `'B'`, switch to `guidedRollout` a third time (this stash write overwrites the earlier `'A'` with `'B'`), switch back to `selfServe`: assert it now restores `'B'`, not `'A'`. This proves both "only the latest stash is kept" and the task's explicit "restore-then-edit-then-switch-again keeps latest data" requirement in one flow.
- **Empty branch stashed.** Select `selfServe` without filling anything, switch away, switch back: assert it renders empty with no error/crash, and that its `formValues` shape is identical whether or not a stash exists (behaviourally indistinguishable from a fresh empty selection, per the story's own edge-case text).
- **First-ever selection, no stash exists (QA-plan addition, see "Flags for reviewer").** Select `apiEndpoint` fresh, having never been deselected before (so no stash entry exists for it at all): assert it mounts empty with no throw and no attempted restore. This exercises the "if a stash exists" conditional the architecture's verdict implies but that the story's ACs do not name directly.
- **Per-instance isolation inside an array (decision 6).** Reuse ST-01 AC11's `projectContacts` two-item fixture, each item's `method` choice with the flag enabled. Fill contact 0's `email` branch, switch it to `phone` (stash contact 0's email data). Independently fill contact 1's `phone` branch with a *different* value, switch it to `email` (stash contact 1's phone data). Switch contact 0 back to `email`: assert it restores contact 0's original value, not contact 1's. Switch contact 1 back to `phone`: assert it restores contact 1's original value, not contact 0's or contact 0's stash. Proves the stash lives per `DynamicFormItemChoice` instance with no cross-item leakage, consistent with how ST-01 already keys everything through `overridePath`/`pathOverride`. Array-item removal/reindex interaction with the stash is out of scope here (see Regression risk); no dedicated test added for it.

### States policy (this slice)

No new render state is introduced. This story only changes what data populates the already-covered "Selected / active" state (ST-01) when a branch is re-selected after being switched away; empty, disabled, loading, and error states are unaffected and already guarded by ST-01's suite. Explicitly noted so the absence of new states-policy tests here is not mistaken for a gap.

### Reactivity / `*.analytics.test.ts` plan

Extends `DynamicFormItemChoice.analytics.test.ts` with a new `describe('preserve-on-switch — render counts (ST-05)')`:

1. Restoring a branch (switch-back with an existing stash) mounts its `DynamicFormItem` exactly once, with the restored data already present at that first render, not an empty mount followed by a second render once the stash applies. Asserted via `renderCount(wrapper, 'pick.selfServe') === 1` read immediately after the switch-back call, with no intervening `flushPromises`-triggered increment. This pins the architecture's "the childValues reset and the setFieldValue happen in the same handler ... do not oscillate" requirement, extended to the stash restore path.
2. Switching away with the flag on (stash + clear) increases `_analytics_occurrencesCalculatedCount` by exactly one per switch, matching ST-01's existing single-recompute contract for plain clear-on-switch: stash capture must not add a second recompute.
3. A sibling field outside the choice does not re-render across a stash/restore cycle (reuses ST-01's existing sibling-isolation pattern).
4. Flag-off baseline: render counts for a plain switch-away/switch-back-to-empty cycle are unchanged from ST-01's existing analytics assertions, confirming this story adds no overhead when the flag is off.

### Coverage

Every new branch (stash-before-clear on switch, restore-on-select when a stash exists, the "no stash exists yet" no-op path, and per-instance stash storage inside an array item) is exercised by the AC-mapped tests and edge cases above. The flag-gating branch itself (whichever surface is chosen) is exercised identically by AC1 (off) versus AC2/AC3 (on), so coverage of that branch does not depend on which surface the developer picks. Run `pnpm -r ci:test:coverage` after implementation and confirm no drop against baseline; if the flag lands as a `DynamicFormSettings` boolean, double check the `dynamicFormSettingsKey` injection read is covered by both the on and off tests (it should be, since every test in this plan mounts through `TestForm`'s `settings` prop).

### Time sensitivity

Not applicable. No date/time-dependent logic is introduced by this story.

### Regression risk

- **`DynamicFormItemChoice.vue`'s `addChoiceOccurrence` switch path** — modified again on top of ST-01. Must stay byte-identical in output when the flag is off (AC1). Guarded by the full pre-existing ST-01 `DynamicFormItemChoice.logic.test.ts`/`.validation.test.ts`/`.analytics.test.ts` suites remaining green unmodified, plus this story's explicit AC1 regression tests.
- **ST-01's clear-on-switch residue contract (AC10 there)** — must be unaffected by the flag being on or off; re-asserted directly in AC2 above rather than assumed.
- **ST-02 (`maxOccurs > 1` repeatable selection)** — out of scope for this story. If ST-02 has already landed in the codebase by the time this story is implemented, add a light sanity check that the flag has no effect on a `maxOccurs > 1` choice (since that path does not use `explicitlySelectedBranch`/`branchPath` the same way); if ST-02 has not landed yet, this is naturally inert and no test is needed. Not treated as a required AC since the story explicitly scopes it out.
- **`TestFormTemplate.vue` fixture** — no change anticipated; if it turns out the chosen flag surface needs new fixture markup after all, treat any edit there with the same care ST-01's QA plan documented (strictly additive, full existing suite re-run) since it is still the shared fixture behind nearly every test in `DynamicFormItem*`/`DynamicFormItemArray*`/`DynamicFormItemChoice*`.
- **Other stories**: ST-03/ST-04 (docs) do not use this flag (explicitly out of scope for their example); unaffected. ST-02 shares `DynamicFormItemChoice.vue` and may land before or after this story; not a test concern beyond the sanity check above, but worth a merge-order note for the developer.

### Manual verification checklist

None required. This story is engine-only with no template/docs slice (explicitly out of scope), and every acceptance criterion and edge case is exercised through the `TestForm`/`TestFormTemplate` component-test harness with `@vue/test-utils`.

### Flags for reviewer

- **Flag surface left open.** The story's architecture reference defers the choice between a `DynamicFormSettings` boolean and a `FieldMetadata` boolean to implementation. This plan is written surface-agnostic via a to-be-added `enablePreserveOnSwitch(...)` fixture helper so no test needs rewriting once the developer decides; flagging to confirm this is an acceptable way to keep the plan stable, and that the developer updates only the helper, not the individual tests, once the surface is fixed.
- **AC2 is not independently observable black-box.** The plan validates "stash before clear" jointly with AC3 (a stash-after-clear bug would surface as a failed restore in AC3) plus a direct residue-shape check at the point of stashing. An optional internal-state read via `setupState()` is offered if the developer names the stash ref predictably, but nothing in this plan requires it. Flagging to confirm the indirect-plus-optional-direct combination is sufficient rather than mandating a guaranteed direct internal assertion.
- **One test added beyond the story's named ACs/edge cases:** "select a branch that was never previously deselected, so no stash exists yet, with the flag on." This exercises a real conditional branch implied by the architecture's "if a stash exists, restore it" wording but not named as its own AC or edge case in the story. Flagging as a QA-plan addition, not a reinterpretation of an existing AC.
- No acceptance criterion required a rewrite; all five are testable as written, consistent with ST-01's precedent for internal-state reads via `setupState()` and the existing `formValues`/`renderCount` helpers.

## Adversarial review

Ran in STORY (lite) mode on 2026-09-10, blockers-first, against the installed code (`DynamicFormItemChoice.vue`, `FieldMetadata.ts`, vee-validate `4.15.1` type declarations) and the binding feature decisions (Q7 ship-now opt-in defaulted off, decision 4 stash outside `values`, ADR-3 option (a) residue, preserve-on-switch verdict subsection). Every acceptance criterion has a QA-plan mapping and every AC is consistent with the approved feature design and architecture; the dependency on ST-01 is explicit and correct, and the story correctly scopes `maxOccurs > 1` out. No blocker found.

**Rulings on the QA planner's three flagged items:**

1. **Flag surface left open (`DynamicFormSettings` boolean vs `FieldMetadata` boolean).** Not accepted as an implementation-time coin flip. A public-API surface on a published library is a permanent contract and is Jeroen's call, not the developer's. Ruled via the PROPOSED edit in the Architecture reference: a per-choice `FieldMetadata` `preserveOnSwitch?: boolean` next to `explicitChoiceSelection` (rung 3, codebase consistency), plus the `ComputedPropsFieldType` `Omit` treatment the story omits. Recorded as finding 1.

2. **AC2 "stash before clear" verified only indirectly (jointly with AC3, plus an optional internal read).** ACCEPTED as sufficient. The stash-before-vs-after-clear distinction is fully observable through its consequence: a stash-after-clear bug restores empty data, which AC3's restore assertion catches deterministically. The optional `setupState()` read is a fine bonus but correctly not mandated. This is the same "internal state need not be asserted directly when its observable effect pins it" posture ST-01 established. No change required.

3. **One QA-plan test beyond the named ACs (first-ever selection, no stash yet, flag on).** ACCEPTED as good coverage, not scope creep. It exercises the real "if a stash exists" conditional the architecture's verdict wording implies (restore is guarded), which none of the five ACs names directly; leaving that no-op path untested would let a regression that throws on a missing stash entry ship silently. Keep it.

**Findings:**

1. **[should-fix] The public-API flag surface is left for the developer to settle at implementation time.** Both surfaces the feature architecture named are additive-minor, so neither contradicts the approved feature, but which one ships is a permanent consumer-facing contract that should not be decided silently during implementation. Additionally, if it lands as a `FieldMetadata` flag it must join the `ComputedPropsFieldType` `Omit` list for the exact reason `explicitChoiceSelection` does (feature finding 4 / ST-01 AC9: a `computedProps`-mutable flag flipping stash mode mid-form), which the story does not mention. Routed as a PROPOSED edit in the Architecture reference recommending the per-choice `FieldMetadata` `preserveOnSwitch?: boolean` surface plus the `Omit` treatment, for Jeroen to confirm or override.

2. **[should-fix] The restore call inherits vee-validate's default `shouldValidate: true`, which works against AC4.** The feature architecture spells restore as `setFieldValue(branchPath, stashed)` with no third argument; `setFieldValue`'s `shouldValidate` defaults to `true` (`vee-validate.d.ts:331`), so as written it validates on restore, risking an error flash on a restored-but-empty required field and contradicting AC4's pristine requirement and its "no error message renders immediately after restore" companion case. The clear path already passes `false` deliberately. Routed as a PROPOSED edit in the Architecture reference: restore with `setFieldValue(branchPath, stashed, false)`, and have AC3's mapping assert the pristine post-restore state.

3. **[nit] The new public flag ships without its own reference documentation.** ST-04 (docs) depends on ST-01/ST-02, not ST-05, and the story scopes docs out (an optional mention "belongs to ST-04"). That matches the feature's slicing (preserve-on-switch is seam 5, "does not block anything else"), so it is not a story-level override, but it does mean a new public `FieldMetadata`/settings flag can ship undocumented in `docs/reference/field-metadata.md`. Worth a note so Jeroen decides whether a one-line reference entry should be pulled into scope rather than left to a later docs pass.

No acceptance criterion required a rewrite; all five are testable as written and correctly mapped, and both should-fixes are routed as concrete PROPOSED edits rather than left as holes.

## Implementation notes

**Flag surface (resolves the story's own flagged finding 1).** Implemented as a per-choice `FieldMetadata` boolean, `preserveOnSwitch?: boolean`, declared next to `explicitChoiceSelection` in `packages/core/src/types/FieldMetadata.ts`, per the story's Architecture reference's accepted PROPOSED edit. Added to the `ComputedPropsFieldType` `Omit` list alongside `explicitChoiceSelection`, for the same reason (a `computedProps` mutation must not be able to flip stash/restore behaviour mid-form). No feature-spec amendment needed since this was already the architecture reference's own recommended resolution, not a new story-level override.

**Restore uses `shouldValidate: false` (resolves finding 2).** `restoreStashedBranch` calls `formContext.setFieldValue(branchPath, stashed, false)`, mirroring `clearBranch`'s existing `setFieldValue(branchPath, undefined, false)`. Matches the story's accepted PROPOSED refinement of the architecture's verdict text.

**Deviation: reused `branchValueRefs` instead of a new `useFormContext().values` path read.** `DynamicFormItemChoice` already maintains one `useFieldValue()` ref per branch (`branchValueRefs`, added in ST-01 for the value-driven "loading saved data still reads as selected" guarantee). `clearBranch`'s stash step reads `branchValueRefs[index].value` (deep-cloned via `structuredClone`) instead of writing a new path-parsing helper against `useFormContext().values`. Both reads resolve to the exact same underlying vee-validate value at `branchPath`; reusing the existing ref avoids a duplicate mechanism, per "reuse first."

**Deviation: stash-before-clear is scoped to the switch path inside `addChoiceOccurrence`, not `removeChoiceOccurrence`'s plain deselect.** The Architecture reference specifies the stash happens "before the existing clear in `addChoiceOccurrence`'s switch path"; none of the ACs or edge cases exercise stashing on a plain deselect (`removeChoiceOccurrence` with no other branch selected). Implemented narrowly as specified: `clearBranch(previousBranch, { stash: preserveOnSwitch })` is only called from `addChoiceOccurrence`'s switch branch; `removeChoiceOccurrence` calls `clearBranch(branchKey)` with no stash option, unchanged from ST-01.

**Test finding: vee-validate's own field-unregistration lifecycle removes a switched-away branch's key entirely (not just to `undefined`), independent of this feature.** While writing AC5's "no stash-shaped key" tests, an `Object.keys()` check revealed that a deselected branch's key can disappear from `values.pick` entirely (not merely become `undefined`), because vee-validate's `useField` unregisters with the form's default `keepValuesOnUnmount: false`, which schedules a debounced `unsetPathValue` on the path when the field's owning `DynamicFormItem` unmounts. This happens on every switch, flag on or off, and pre-dates ST-05 (it also affects ST-01's baseline, though the existing ST-01 tests use `toEqual`, which does not distinguish an `undefined`-valued key from an absent one, so it was never surfaced there). AC5's tests were written to assert "only declared branch names ever appear as keys, no stash-shaped extra key" (a subset check) rather than an exact key set, so they do not depend on this pre-existing, out-of-scope timing detail. Not fixed here: it is not part of this story's scope (ADR-3's residue contract) and does not affect any ST-05 acceptance criterion.

**AC4 test note: `meta.validated` legitimately becomes `true` immediately after restoring a non-empty branch.** `DynamicForm.vue` defaults `validateOnValueUpdate: true`, so any field that mounts (or changes) with a truthy value already present validates immediately — this is the same behaviour a freshly-typed value triggers, not something specific to restore. The AC4 test therefore asserts what is actually verifiable and meaningful: the restored field is a genuinely new vee-validate field registration (fresh field `id`, not the same instance touched before switching away), `meta.touched` resets to `false`, and there is no stale error carried over (`meta.valid` is `true`, no error message renders). The companion case (a restored-but-empty required field shows no error immediately after restore) is the concrete form of AC4's "no error flash" requirement and passes as specified.

**No docs/example changes.** Confirmed engine-only per the story's own scope: `docs/` and the onboarding example are untouched (ST-03 already ships with the default clear-on-switch baseline; a docs mention of `preserveOnSwitch` is optional and left to ST-04 per the story's Out of scope section).

**Files changed:**
- `packages/core/src/types/FieldMetadata.ts` — `preserveOnSwitch?: boolean`, `ComputedPropsFieldType` `Omit` entry.
- `packages/core/src/components/DynamicFormItemChoice.vue` — `preserveOnSwitch` static capture, `stashedBranchValues` ref, stash/restore wiring in `clearBranch`/`restoreStashedBranch`/`addChoiceOccurrence`.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.test-helpers.ts` — `enablePreserveOnSwitch(metadata, choicePath, enabled?)` and `stashedBranchValues(wrapper, path)` helpers.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.logic.test.ts`, `.validation.test.ts`, `.analytics.test.ts` — new `describe` blocks per the QA plan (AC1-AC5, edge cases, touched/validation reset, render-count contracts).
- `specs/components.md` — `DynamicFormItemChoice` entry and `FieldMetadata` types section updated.
- `.changeset/preserve-on-switch-explicit-choice.md` — `minor`, its own entry (consistent with ST-02's precedent of one changeset per story touching `packages/core/src/`).

**Verification commands:**
```
cd packages/core && TZ=Europe/Amsterdam npx vitest run src/components/__tests__/DynamicFormItemChoice.logic.test.ts src/components/__tests__/DynamicFormItemChoice.validation.test.ts src/components/__tests__/DynamicFormItemChoice.analytics.test.ts
pnpm -r run ci
pnpm -r run ci:test:coverage
```

Full `packages/core` suite: 504 tests passing (baseline 488 + 16 new). `packages/element-plus`: 1 test passing, unaffected. Lint clean, typecheck clean (root `pnpm -r run build` re-run first, since `packages/core/src` types changed, per the environment note). Coverage: 96.84% / 92.72% / 96.25% / 96.84% (stmts/branch/funcs/lines), no drop against the 96.82/92.52/96.2/96.82 baseline (all four metrics improved slightly).

## Verification report

### Pipeline checks
- `pnpm -r run build` (needed before typecheck since `packages/core/src` types changed): both `packages/core` and `packages/element-plus` build clean.
- `pnpm -r run ci` (test + lint + typecheck): 22 test files, **504/504 tests passing** in `packages/core` (baseline 488 + 16 new, matches the developer's claim exactly); `packages/element-plus` 1/1 passing. ESLint and `vue-tsc --noEmit` clean on both packages.
- `pnpm -r run ci:test:coverage`: `packages/core` **96.84% / 92.72% / 96.25% / 96.84%** (stmts/branch/funcs/lines), verified byte-identical to the developer's reported numbers. No drop against the pre-story baseline (96.82/92.52/96.2/96.82); all four metrics improved slightly. `packages/element-plus` coverage unaffected (0%/100%/100%/0%, pre-existing, untouched by this story).
- No `docs/` content changed by this story, so `pnpm docs:build` was not required and was not run.

### Acceptance criteria

| AC | Description | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Default behaviour unchanged (flag absent/`false`) | Pass | `DynamicFormItemChoice.logic.test.ts` `(AC1) default behaviour is unchanged` — `1a` (flag absent) and `1b` (flag explicitly `false`) both assert switch-away clears to the ST-01 residue shape and switch-back renders empty, not restored. Code path: `clearBranch(previousBranch, { stash: preserveOnSwitch })` where `preserveOnSwitch` is `false` when absent/`false`, so `stash` is never set and `restoreStashedBranch` no-ops (no stash key exists). Confirmed identical to ST-01's own AC4/AC10 assertions (`DynamicFormItemChoice.logic.test.ts:914`, `:1218`, unmodified). |
| 2 | Enabling the flag stashes data outside `values` before clearing | Pass | `(AC2/AC3) stashes before clearing, and switching back restores the stashed data` — asserts the residue immediately after switch-away is byte-identical to the AC1 shape (`pick.selfServe` undefined, DOM node gone), then AC3's restore proves the stash was captured pre-clear (a post-clear capture would restore empty). Code: `clearBranch` stashes via `structuredClone(branchValueRefs[index]?.value ?? undefined)` before calling `setFieldValue(branchPath, undefined, false)`. |
| 3 | Switching back restores the stash | Pass | Same test: after switching to `guidedRollout` and back to `selfServe`, the input's DOM value and `formValues(wrapper).pick.selfServe` both equal `'hello'`, `guidedRollout`'s input no longer exists, and `activeChoiceOccurrences` shows exactly `selfServe` active. |
| 4 | Restored data starts with fresh touched/validation state | Pass | `DynamicFormItemChoice.validation.test.ts` `preserve-on-switch — touched/validation reset (AC4)`: asserts the restored field has a new vee-validate field `id` (genuinely re-registered, not the same touched instance), `meta.touched` resets to `false`, `meta.valid` is `true`, and no error message renders. Companion case: an empty required field, once restored, shows no error message immediately. See "Flagged deviation 4" below for why `meta.validated` itself is not asserted true/false. |
| 5 | The stash is pure ephemeral UI state, never in `values` | Pass | `(AC5) the stash never appears in values` — 5a/5b assert `Object.keys(formValues(wrapper).pick)` only ever contains declared branch names at stash time and at restore time; 5c triggers the `TestForm` submit handler at both points and re-asserts the same on the submitted values. `stashedBranchValues` itself is a plain `ref` on the component instance, never passed to `setFieldValue`/`values` except via the deliberate `restoreStashedBranch` write of its *value*, not the stash structure itself. |

Edge cases (switching twice without returning, empty-branch stash, first-ever-selection no-stash, per-instance isolation inside `projectContacts`, and a `maxOccurs > 1` sanity check) are all present in `DynamicFormItemChoice.logic.test.ts` and pass.

### Prototype / feature-architecture comparison

This story is engine-only (confirmed: no `docs/` diff, no `index.ts` diff). Per the story's own Design reference, `#single-switch` documents preserve-on-switch as deferred with no dedicated UI, and the visible outcome of a restore is pixel-identical to the already-drawn `#single-selected`/`#single-selected-guided` states from ST-01 — there is no new visual state to compare against the prototype, no new VitePress color-mode surface, and no responsive-behaviour change. This matches the story's own "States policy" note that no new render state is introduced. Verified there is genuinely no drift: `git diff --stat` shows only `packages/core/src` (component + types) and its own test files changed, nothing in `docs/`.

### Process compliance

- `specs/components.md`: updated — the `DynamicFormItemChoice` row gains the `preserveOnSwitch` behaviour description, and the `FieldMetadata` section gains a paragraph for the new flag including its `ComputedPropsFieldType` exclusion. Accurate against the actual code.
- Changeset: present, `.changeset/preserve-on-switch-explicit-choice.md`, bump `minor`. Matches the architecture's additive-only classification (new optional `FieldMetadata` property, no export/signature change).
- Library API rules: one new optional `FieldMetadata` boolean (`preserveOnSwitch`), camelCase, placed next to `explicitChoiceSelection` per the story's own accepted resolution of its flagged finding 1; correctly added to the `ComputedPropsFieldType` `Omit` list (verified in the `FieldMetadata.ts` diff) so `computedProps` cannot flip it mid-form, mirroring `explicitChoiceSelection`'s own treatment. No new export from `index.ts`; no existing export's shape changed.
- Test naming: `*.logic.test.ts`, `*.validation.test.ts`, `*.analytics.test.ts` extended per repo convention, matching the QA plan's file list exactly.
- No undocumented spec deviations found; see below.

### The four flagged deviations, checked individually

1. **Reusing `branchValueRefs` instead of a new `useFormContext().values` path-reader.** Confirmed equivalent. `branchValueRefs[index]` is `useFieldValue(() => overridePath(child.path, props.pathOverride))` (vee-validate's own reactive path-aware value accessor), already used elsewhere in the same component (line 292, the value-driven `activeChoiceOccurrences` fold) to read the identical `branchPath` the architecture's stash text targets. Both resolve to the same underlying value in the form's `values` tree at `branchPath`; `useFieldValue` is vee-validate's supported way to read a path reactively and is not a private/unsupported API. This is a legitimate "reuse first" simplification, not a behavioural gap: it reads before the subsequent `setFieldValue(..., undefined, false)` call in the same function body, preserving the "stash before clear" ordering the architecture requires. No concern.
2. **Stash-before-clear scoped to `addChoiceOccurrence`'s switch path only, not `removeChoiceOccurrence`.** Confirmed as a faithful, literal reading of the architecture text, not an invented narrowing. The feature architecture's preserve-on-switch verdict and the story's own Architecture reference both say the stash happens "before the existing clear in `addChoiceOccurrence`'s switch path" verbatim. None of the story's five ACs or three edge cases exercise a plain deselect (`removeChoiceOccurrence` with no other branch subsequently selected) as a stash trigger; the story's own Out of scope section only excludes `maxOccurs > 1`, but the QA plan's edge-case list and AC-to-test mapping both confine themselves to the switch flow. Verified in code: `removeChoiceOccurrence` calls `clearBranch(branchKey)` with no `stash` option (unchanged from ST-01), while only `addChoiceOccurrence`'s switch branch passes `{ stash: preserveOnSwitch }`. Correct scope, not a silent narrowing.
3. **Pre-existing vee-validate `keepValuesOnUnmount: false` key-deletion quirk.** Confirmed as pre-existing and not introduced by this story. `useDynamicForm.ts` exposes `keepValuesOnUnmount` as an optional form-level setting (defaults to vee-validate's own default, `false`, when the consumer does not override it); `DynamicFormItem.vue`'s `useField` call does not override it per-field. This is form-wide lifecycle behaviour, not choice-specific or ST-05-specific. Checked ST-01's own pre-existing assertions at `DynamicFormItemChoice.logic.test.ts:914` and `:1218` (both unmodified by this story): they use `toEqual({ selfServe: undefined, guidedRollout: 'world' })`, and Vitest/Jest's `toEqual` treats an `undefined`-valued property as equivalent to an absent one, so these tests would not have caught (and did not catch) the key genuinely disappearing versus merely becoming `undefined`. This confirms the developer's claim: the quirk already affects ST-01's committed behaviour and was simply never surfaced there because `toEqual` masks the distinction. ST-05's own AC5 tests use `Object.keys()` subset checks (only declared branch names may appear; no stash-shaped key), which is true regardless of whether a switched-away key is present-as-`undefined` or fully absent, so the claimed independence holds under inspection, not just by assertion.
4. **AC4's `meta.validated` adjustment.** Confirmed as a legitimate, non-weakening adjustment. `DynamicForm.vue` does default `validateOnValueUpdate: true` at the form level (verified in the codebase), so any field mounting with a truthy value validates immediately — this is a genuine, correctly-identified library default, not a rationalization invented to dodge a failing assertion. The actual AC4 test still verifies everything AC4 requires: a fresh vee-validate field `id` (new registration, not the same touched instance), `meta.touched` reset to `false`, `meta.valid` true with no error message rendered for the filled-branch case, and the companion case directly proves "no error message renders immediately after restore" for an empty required field. This is the concrete, literal wording of AC4 ("their vee-validate touched/validation state is reset... matching the accepted caveat") satisfied without asserting a `meta.validated` value that the library's own documented default would make flaky/definitionally-true regardless of the restore mechanism. Not a defect being dodged: the "accepted caveat" is exactly what the feature architecture's preserve-on-switch verdict subsection already conceded ("vee-validate touched/validation state for the branch resets on restore... acceptable, it behaves like freshly re-entered data").

### Additional confirmations requested

- **Default behaviour byte-identical to ST-01's clear-on-switch (AC1):** confirmed above; AC1's own tests assert the identical residue and empty-render-on-switch-back that ST-01's suite already established, and the full pre-existing ST-01 `DynamicFormItemChoice.*` suites remain green, unmodified.
- **Stash never written to form `values` (decision 4, AC5):** confirmed; `stashedBranchValues` is a component-local `ref`, only ever read to feed `setFieldValue`'s *value* argument (the actual field data), never itself passed into `values` as a structure, and AC5's tests assert this both pre- and post-submit.
- **DECIDED Q7 (clear-on-switch remains baseline) respected:** confirmed; the flag defaults to `false`/absent and every AC1 test proves the baseline is unchanged when the flag is off.

### Overall verdict: **pass**

All five acceptance criteria are met with direct test evidence, all four flagged deviations hold up under independent verification (none are silent scope-narrowing or defect-dodging), process compliance is complete (changeset, `specs/components.md`, `Omit` list treatment, no new exports), and the full pipeline (build, test, lint, typecheck, coverage) is green with coverage improving slightly against baseline. Status set to `done`.

**This was the last story of FEAT-001.** All five stories (ST-01 through ST-05) are now `done`. The feature itself can move to `done`, but that status transition belongs to whoever owns the feature-level spec, not this story-level report.

Reminder for Jeroen: the `pr` field in this story's frontmatter is still `""` — please link the PR once opened.

```
FEAT-001 ST-05: add preserve-on-switch for maxOccurs:1 explicit choice selection

Add an opt-in FieldMetadata flag, preserveOnSwitch, that stashes a maxOccurs:1
explicit choice branch's values outside form values before clear-on-switch and
restores them on switch-back, so exploratory switching does not force
re-entry. Defaulted off so ST-01's clear-on-switch stays the baseline for
everyone who does not opt in.

- packages/core/src/types/FieldMetadata.ts: preserveOnSwitch?: boolean, added
  to the ComputedPropsFieldType Omit list alongside explicitChoiceSelection so
  computedProps cannot flip stash/restore behaviour mid-form.
- packages/core/src/components/DynamicFormItemChoice.vue: stashedBranchValues
  ref, stash-before-clear and restore-on-select wiring in clearBranch,
  restoreStashedBranch, and addChoiceOccurrence, restoring with
  shouldValidate: false so a restored empty required field does not flash an
  error.
- Test coverage across DynamicFormItemChoice.logic/.validation/.analytics.test.ts
  for all five acceptance criteria, the three edge cases, and render-count
  contracts, plus a new enablePreserveOnSwitch test helper.
- specs/components.md updated for the new flag; changeset added (minor).

This is the last story of FEAT-001 (explicit choice selection); all five
stories are now done.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pvp6HRuzqFTfwy1pnbf4gC
```
