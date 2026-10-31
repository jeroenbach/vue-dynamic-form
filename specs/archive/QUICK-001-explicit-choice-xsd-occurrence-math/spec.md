---
id: QUICK-001
type: quick
status: done
approved_by: Jeroen
pr: ""
---

# Quick: explicit-choice occurrence math follows XSD, per-branch total cap becomes an opt-in extension

## Problem

The explicit-selection repeatable choice mode (`explicitChoiceSelection: true` with `maxOccurs > 1`, shipped in FEAT-001 ST-02) does not follow XSD occurrence semantics, and following battle-tested XSD is the library's unique selling point (Jeroen).

In XSD, a branch's `maxOccurs` inside `<xs:choice>` is a per-choice-iteration multiplier: each repetition of the choice picks one branch, and the picked element may repeat up to its own `maxOccurs` within that single repetition. So a choice with `maxOccurs: 5` containing a branch with `maxOccurs: 2` allows up to 10 items of that branch in total, with every group of up to 2 items consuming one choice slot (`ceil(items / branchMax)` slots). There is no per-branch total cap in XSD.

The library's auto mode (no `explicitChoiceSelection`) already implements exactly this: the `occurrences` computed in `DynamicFormItemChoice.vue` (lines 173-253) converts raw item counts with `Math.ceil(child.occurrences / child.maxOccurrences)` and derives each branch's headroom as `choiceMax * branchMax` minus what siblings consume.

The explicit repeatable mode instead reinterpreted the numbers: the choice's `maxOccurs` became a cap on total raw items across all branches (each add consumes one full slot regardless of the branch's `maxOccurs`), and the branch's `maxOccurs` became an independent total cap on that branch. Mechanically: the `childValues` sync watch (`DynamicFormItemChoice.vue:364-377`) feeds `updateChildValue(branchValues, index, 1)` with a batch size of 1, and `canAddChoiceOccurrence` (lines 572-596) adds a direct `branchCount >= branchOwnMax` hard-cap check that the shared-budget math cannot express.

How it happened (traceable, no explicit decision to diverge was ever made): the FEAT-001 feature spec (line 69) introduced "disabled once that branch's own `maxOccurs`, or the choice's shared budget, is exhausted" and mislabeled it "consistent with the existing `occurrences` computation"; the design prototype's `#multi-limits` state and ST-02's AC2 pinned that reading with concrete numbers; the ST-02 developer then correctly discovered the existing math cannot produce a per-branch cap (ST-02 spec, implementation finding 2) and resolved the contradiction in favour of the approved AC by introducing the batch-size-1 workaround, instead of escalating the XSD conflict.

Two consequences today:

1. The same metadata means different things depending on `explicitChoiceSelection`. Auto mode: branch `maxOccurs: 2` under choice `maxOccurs: 5` allows 10 items. Explicit mode: it allows 2.
2. `xsd_choiceMinOccurs` counts in the wrong units in explicit mode: `effectiveValuesCount` (lines 304-313) uses `activeChoiceOccurrences.length`, which is raw items, so 2 items of a `maxOccurs: 2` branch count as 2 choice occurrences when XSD-wise they are 1.

XSD's requirement that same-iteration items be consecutive in the document is explicitly not a concern here (Jeroen): values are stored in per-branch arrays and will be grouped together on any future XSD serialization; interleaved display order (FEAT-002) is purely a UI matter.

The per-branch total cap the current behaviour accidentally provides ("max 3 of each kind") is genuinely useful UX and genuinely inexpressible in a plain XSD choice, so it must survive, but as an explicitly named, opt-in, documented non-XSD extension property, not as a reinterpretation of `maxOccurs`.

## Proposed change

**Touches `packages/core/src/`, so a changeset is required at implementation time.** Recommended bump: **minor** (restores the documented XSD contract of a mode that shipped days ago, plus an additive metadata property and an additive slot prop). The conservative alternative is major, since it changes observable behaviour of a published mode; Jeroen decides at approval.

> **PROPOSED (adversarial review) - the mode is not published, so the major-vs-minor dilemma does not exist (finding 1).** Verified against the tree: the current npm version is `0.5.0` (`packages/core/package.json`), whose CHANGELOG entry is only the utility-helper exports; the entire explicit-choice feature is still in pending changesets (`.changeset/curly-onions-explicit-choice.md`, `tame-carrots-repeatable-choice.md`, `preserve-on-switch-explicit-choice.md`, `preserve-on-switch-proxy-clone.md`) alongside FEAT-002's `choice-array-slot-family.md`, none consumed by `changeset version`. No published consumer relies on the per-branch-cap behaviour, so this is not a breaking change to anyone. Preferred handling: **amend the pending `tame-carrots-repeatable-choice.md` changeset** so the eventual `0.6.0` CHANGELOG describes the final XSD behaviour and `maxOccursTotal` from the start, instead of shipping a per-branch cap and a same-release correction. Adding a separate `minor` changeset is acceptable but noisier. Either way the bump is **minor** (net-new since `0.5.0`); drop the "changes observable behaviour of a published mode" and "major is the conservative alternative" framing.

### 1. Explicit repeatable mode reuses the auto-mode batching math

- The `childValues` sync watch (`DynamicFormItemChoice.vue:364-377`) passes the branch's own `maxOccurs` as the batch size, exactly like the auto-mode template branch already does (`updateChildValue($event, index, child.maxOccurs)`, line 761): `updateChildValue(branchValues, index, branch.maxOccurs)`.
- `canAddChoiceOccurrence` (lines 572-596) drops the `branchCount >= branchOwnMax` hard-cap check. The remaining shared-budget check reads `occurrences.value[index].overrideChildMaxOccurrences`, which under the real batch size already equals the branch's XSD headroom in raw-item units (`choiceMax * branchMax` minus siblings' consumption converted to this branch's units). Result for the docs example (choice 5, branches 3): up to 15 CRM exports when the other branch is empty, and 3 CRM exports consume `ceil(3/3) = 1` of the 5 slots.

### 2. Validation counts in choice-occurrence units

`effectiveValuesCount` (lines 304-313), repeatable fold: replace `activeChoiceOccurrences.length` (raw items) with the structural choice-unit count, `sum over branches of ceil(branchFieldArrays[i].fields.length / branch.maxOccurs)`. This keeps FEAT-001's DECIDED parity behaviour (adding an empty occurrence immediately counts toward `xsd_choiceMinOccurs`; the occurrence's own required fields enforce content) but in XSD-correct units: a `minOccurs: 2` choice is not satisfied by 2 items of a single `maxOccurs: 2` branch, because that is 1 choice occurrence.

### 3. Templates get the consumed-slot count as a slot prop

`ChoiceAttributes` (`DynamicFormTemplate.vue`, lines 113-124) gains `usedChoiceOccurrences: number` (name open to review), the number of choice slots currently consumed in choice-occurrence units (the same structural count as change 2). Without it, every template showing "N of `maxOccurs`" (the docs legend currently renders `activeChoiceOccurrences.length` of `maxOccurs`) silently over-counts once items and slots diverge, and would have to re-derive the ceil math itself.

> **PROPOSED (adversarial review) - the "docs legend" this change cites does not exist, and the example will not exercise the prop (finding 2).** Verified against the rendered docs path: a repeatable choice renders through `AdvancedFormTemplate.vue`'s `#heading-choice-array` slot into `ChoiceArraySectionCard.vue`, which renders **no** count legend at all (the slot does not even receive `activeChoiceOccurrences`). `ChoiceSectionCard.vue` is the `maxOccurs: 1` card and uses `activeChoiceOccurrences` only for selection state, not an "N of `maxOccurs`" count. So the "docs legend currently renders `activeChoiceOccurrences.length` of `maxOccurs`" rationale describes code that is not there, and the Affected-files entry names the wrong component (it lists `ChoiceSectionCard.vue`; the repeatable card is `ChoiceArraySectionCard.vue`, which is absent from the list). Compounding it: the proposed docs example (change 5) uses branch `maxOccurs: 1` + `maxOccursTotal: 3`, where each occurrence consumes exactly one slot, so `usedChoiceOccurrences` always equals `activeChoiceOccurrences.length` and the example never demonstrates the slot-vs-item divergence the prop exists to express. Proposed resolution: (a) rewrite this rationale to justify `usedChoiceOccurrences` as a proactive additive prop for consumers who want a slot-accurate count, since no shipped legend depends on it; (b) in Affected files, replace `ChoiceSectionCard.vue` with `ChoiceArraySectionCard.vue` for the repeatable count tag and, if a legend is wanted, add it to that card in change 5; (c) if demonstrating the divergence matters, give the example one branch with `maxOccurs > 1` and no `maxOccursTotal` so `usedChoiceOccurrences` visibly differs from the card count.

### 4. New opt-in non-XSD property: `maxOccursTotal`

`FieldMetadata` gains `maxOccursTotal?: number`, meaningful on a choice branch: a hard cap on the total number of occurrences of that branch across the whole choice, independent of the XSD batching math. This restores today's "max 3 of this kind" behaviour as an explicit opt-in. Semantics:

- Explicit mode: `canAddChoiceOccurrence` returns `false` once the branch's raw item count reaches `maxOccursTotal` (the check the current code applies to `maxOccurs`, moved to the new property).
- Auto mode: the pass-2 `overrideChildMaxOccurrences` result is clamped to `min(result, maxOccursTotal)`, so the branch's rendered array stops offering adds at the cap. Applying it in both modes keeps one property with one meaning.
- No interaction with slot counting: the cap limits adds, batching still runs on `maxOccurs`.
- If `maxOccursTotal` is smaller than `maxOccurs`, the effective per-iteration reach is simply limited by the cap; documented, not validated at runtime (consistent with the library not validating other metadata combinations).
- Excluded from `ComputedPropsFieldType` (`FieldMetadata.ts`, the omit list at lines 236-256) alongside `maxOccurs`, for the same reason: occurrence capacity must not flip mid-form via `computedProps`.
- JSDoc and docs must state plainly that this is a non-XSD extension (it has no `<xs:choice>` equivalent) so the XSD-fidelity contract stays legible.

### 5. Docs follow

- `docs/examples/choices.md`: rewrite the "Add several, each one of several kinds" section to describe the XSD batching semantics, and document `maxOccursTotal` as the non-XSD opt-in with its own short subsection.
- `FormExampleChoiceExplicitRepeatable.vue`: keep the current UX by adding `maxOccursTotal: 3` to both branches (branch `maxOccurs` returns to its XSD meaning; with `maxOccurs: 1` per branch and `maxOccursTotal: 3`, the example behaves exactly as today and demonstrates the new property), and update the description text. The legend count switches to `usedChoiceOccurrences`.
- Auto-mode docs are untouched (already correct).

### Sequencing note

FEAT-002 (repeatable-choice occurrence ordering) is in flight on branch `feature/override-choice-occurances-attempt-2` and touches the same component; it declares occurrence-budget math out of scope, so there is no semantic conflict, but this quick spec should be implemented after FEAT-002 merges (or rebased on top of it) to avoid churn in `DynamicFormItemChoice.vue` and the docs example. FEAT-002's spec examples that mention "3 of that kind or 5 in total" will need their wording refreshed as part of this change.

## Affected files

- `packages/core/src/components/DynamicFormItemChoice.vue`: sync-watch batch size (lines 364-377), `canAddChoiceOccurrence` (lines 572-596), `effectiveValuesCount` (lines 304-313), `maxOccursTotal` clamp in the `occurrences` pass 2 (lines 244-250), plumbing for `usedChoiceOccurrences`.
- `packages/core/src/components/DynamicFormTemplate.vue`: `ChoiceAttributes` gains `usedChoiceOccurrences` (lines 113-124); forwarded from `DynamicFormItemChoice`'s template binding.
- `packages/core/src/types/FieldMetadata.ts`: new `maxOccursTotal?: number` with non-XSD-extension JSDoc, added to the `ComputedPropsFieldType` omit list.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.logic.test.ts`: the AC2-derived "respects both budgets" block and related edge cases currently pin the per-branch-cap reading and must be rewritten; new batching and `maxOccursTotal` tests.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.validation.test.ts`: choice-unit counting for `xsd_choiceMinOccurs`.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.analytics.test.ts`: verify render-count pins still hold (no intended change).
- `docs/examples/choices.md`, `docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue`, and the repeatable-mode count tag in the docs template components (`ChoiceSectionCard.vue` / `AdvancedFormTemplate.vue`): prose, metadata, and legend count source.
- `specs/components.md`: update the `DynamicFormItemChoice`, `DynamicFormTemplate`, and `FieldMetadata` entries (implementation-time obligation).

## Test impact

- **Rewritten**: the explicit-mode budget tests that pin "branch's own `maxOccurs` is a total cap" (logic test AC2 block and its edge cases). Replacement assertions use concrete XSD arithmetic, e.g. choice `maxOccurs: 5` with branches `maxOccurs: 1` and `maxOccurs: 2`: 10 items of the second branch possible when alone; 8 of the second plus 1 of the first; adding 2 items of the second branch consumes 1 slot; add affordances disable exactly when `ceil`-consumption reaches 5.
- **New**: `maxOccursTotal` caps adds in explicit mode (only that branch's add disables, siblings unaffected); clamps the auto-mode array headroom; removing an item below the cap re-enables the add reactively.
- **New**: `xsd_choiceMinOccurs` counts in choice units in explicit mode (a `minOccurs: 2` choice with 2 items of one `maxOccurs: 2` branch is still invalid; adding an item of a second branch, or a third item of the first, satisfies it).
- **New**: `usedChoiceOccurrences` slot prop reports `ceil`-consumption, not raw item count.
- **Guard**: all auto-mode suites must pass unmodified; auto-mode behaviour is untouched except the `maxOccursTotal` clamp, which is inert when the property is absent.
- Coverage must not drop (`pnpm -r ci:test:coverage`).

## Adversarial review

Ran in QUICK (lite) mode against the current working tree (branch `feature/override-choice-occurances-attempt-2`, FEAT-002 in flight), the cited code paths (`DynamicFormItemChoice.vue`, `DynamicFormTemplate.vue`, `FieldMetadata.ts`), the docs (`docs/examples/choices.md`, `FormExampleChoiceExplicitRepeatable.vue`, `ChoiceSectionCard.vue`, `ChoiceArraySectionCard.vue`, `AdvancedFormTemplate.vue`), the released package version (`package.json`, `CHANGELOG.md`, `.changeset/*`), and FEAT-001 (`spec.md`, `stories/ST-02`). The three fixed decisions from Jeroen (XSD fidelity mandatory; same-iteration adjacency out of scope; per-branch cap survives as an opt-in non-XSD property) were treated as settled, not re-litigated.

**Verified correct (recorded so discussion does not re-open them):**

- **The XSD batching arithmetic is right.** Traced the `occurrences` pass-1/pass-2 formula with the proposed batch size = `branch.maxOccurs`: `overrideChildMaxOccurrences_i = branchMax_i * (choiceMax - othersChoiceOccurrences)`, in raw-item units. The Problem section's docs example (choice 5, branch 3: up to 15 alone; 3 items = `ceil(3/3) = 1` slot) and the Test-impact numbers (choice 5, branches 1 and 2: 10 of the second alone; 8-of-second-plus-1-of-first; adds disable exactly at 5 consumed slots) all check out.
- **The validation-unit change is unit-consistent.** After change 1, `valuesCount` becomes choice units (`sum ceil(filled_i / branchMax_i)`); change 2's structural count (`sum ceil(fields.length_i / branchMax_i)`) is also choice units and dominates `valuesCount`, so `effectiveValuesCount` for the repeatable case lands on the structural choice-unit count. The "`minOccurs: 2` not satisfied by 2 items of one `maxOccurs: 2` branch" claim (`ceil(2/2) = 1`) is correct.
- **No silent override of an approved decision.** FEAT-001 is `done`; the quick lane referencing it is the sanctioned pattern (`specs/README.md`). The per-branch-cap reading was an implicit reading traceable to a mislabeled feature-spec line and an ST-02 implementation workaround (not a `DECIDED (Jeroen)` entry), and Jeroen has explicitly sanctioned the XSD correction, so this is not overturning an approved call.
- **The docs example math is right.** Reproducing today's UX with branch `maxOccurs: 1` + `maxOccursTotal: 3` (each add = one slot, each branch capped at 3, choice `maxOccurs: 5` = 5 slots) matches the current `maxOccurs: 3` branch behaviour exactly; the spec correctly requires dropping branch `maxOccurs` to 1 for parity.

**Findings:**

1. **[should-fix] The semver framing rests on a false premise: the mode is unpublished.** The spec calls this a "published mode" that "shipped days ago" and frames major as the conservative alternative "since it changes observable behaviour of a published mode". Verified against `package.json` (`0.5.0`), `CHANGELOG.md` (0.5.0 is utility-helper exports only), and `.changeset/` (all FEAT-001 and FEAT-002 changesets still pending): the explicit-choice feature has never been released. No published consumer relies on the per-branch cap, so nothing breaks. Routed as a `PROPOSED (adversarial review)` edit on the bump paragraph: amend the pending `tame-carrots-repeatable-choice.md` changeset (preferred) or add a new one, bump stays **minor**, drop the major framing.

2. **[should-fix] Change 3's rationale cites a docs legend that does not exist, names the wrong component, and the example will not exercise the new prop.** The repeatable choice renders through `ChoiceArraySectionCard.vue` (via `#heading-choice-array`), which has no count legend and is not in the Affected-files list; the "N of `maxOccurs`" legend the change invokes to justify `usedChoiceOccurrences` is not present anywhere, and the proposed `maxOccurs: 1` + `maxOccursTotal: 3` example keeps `usedChoiceOccurrences` equal to the card count so it never demonstrates the divergence. Routed as a `PROPOSED (adversarial review)` edit on change 3: re-justify the prop as proactively additive, fix the Affected-files component name, and optionally add a real legend or a `maxOccurs > 1` branch to the example.

3. **[nit] Cited line numbers are consistently off by 7 against the current working tree.** `occurrences` (spec 173-253 / actual 180-260), `effectiveValuesCount` (304-313 / 311-320), `childValues` sync watch (364-377 / 371-384), `canAddChoiceOccurrence` (572-596 / 579-603), pass-2 clamp target (244-250 / 251-257), auto-mode `updateChildValue` (761 / 768). The region descriptions and function names are accurate, so a developer will still find the code, but the numbers were computed against a version seven lines shorter than the current tree. Refresh them or mark them approximate.

4. **[nit] The `maxOccursTotal` auto-mode clamp needs per-branch data threaded into pass 2.** Pass 2 iterates `_occurrences` entries, which currently carry `childMaxOccurrences` but neither `maxOccursTotal` nor a branch reference, so `min(result, maxOccursTotal)` requires adding the per-branch `maxOccursTotal` (or a branch/index lookup) into that structure. Implementation detail, not a design gap; noted so the developer expects it.

No blocker. Both should-fixes are routed as `PROPOSED (adversarial review)` edits; nits do not gate. There are no unresolved Open questions. Status set to `awaiting-approval`.

## Implementation notes

**Both PROPOSED (adversarial review) edits accepted as the operative text.** The changeset bump stays minor and amends the pending `tame-carrots-repeatable-choice.md` rather than adding a new one; change 3's rationale is rewritten as a proactively additive prop (no shipped legend depended on it), the Affected-files entry is corrected to `ChoiceArraySectionCard.vue`, and the docs example gives the `-choice-array` card a real count tag wired to `usedChoiceOccurrences` so the divergence between raw items and choice-occurrence units is demonstrable (see below).

**`canAddChoiceOccurrence` folds `maxOccursTotal` into the shared-budget check instead of adding a second direct comparison.** The occurrences computed's pass 2 now clamps `overrideChildMaxOccurrences` to `min(result, maxOccursTotal)` per branch before returning it; `canAddChoiceOccurrence` keeps its single `branchCount < remainingSharedBudget` check unchanged, since that value already reflects the cap once clamped. This reads as a deviation from the literal "returns false once the branch's raw item count reaches maxOccursTotal" wording, but is behaviourally identical (verified by test) and avoids a second, parallel per-branch check that pass 2 would otherwise need to stay in sync with.

**Line numbers in the Proposed change / Affected files sections were not refreshed.** Nit 3 flagged them as informational; left as-is since they do not gate and the function names remain the anchor a reader actually uses.

**Docs example demonstrates the units divergence, not only parity.** Per the PROPOSED edit on change 3's option (c): `ChoiceArraySectionCard.vue` gained a real count tag (`usedChoiceOccurrences` of `maxOccurs`) wired through `AdvancedFormTemplate.vue`'s `#heading-choice-array` slot, screenshotted at "3 of 5" after three CRM export adds, so `usedChoiceOccurrences` is now a genuinely observable, tested slot prop in the live docs example (not only in the illustrative code sample).

**Files changed:**
- `packages/core/src/components/DynamicFormItemChoice.vue` — sync-watch batch size, `canAddChoiceOccurrence`, `effectiveValuesCount`, new `usedChoiceOccurrences` computed, `maxOccursTotal` threaded through the `occurrences` pass 1/2, template binding for the new slot prop.
- `packages/core/src/components/DynamicFormTemplate.vue` — `ChoiceAttributes` gains `usedChoiceOccurrences: number`.
- `packages/core/src/types/FieldMetadata.ts` — `maxOccursTotal?: number`, added to the `ComputedPropsFieldType` omit list.
- `packages/core/src/examples/TestFormTemplate.vue` — exposes `usedChoiceOccurrences` as a `data-testid` span in the `-choice`/`-choice-array` fixtures.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.test-helpers.ts` — `usedChoiceOccurrences(wrapper, path)` helper reading the new slot prop through the real fixture contract.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.logic.test.ts` — rewrote the per-branch-cap block into an XSD-batching block with concrete arithmetic, added `maxOccursTotal` tests (explicit and auto mode, reactive re-enable), fixed the "frees room reactively" edge case's arithmetic.
- `packages/core/src/components/__tests__/DynamicFormItemChoice.validation.test.ts` — new choice-unit `xsd_choiceMinOccurs` tests.
- `docs/examples/choices.md` — rewrote the "Add several, each one of several kinds" section, updated the illustrative legend snippet to `usedChoiceOccurrences`, added the `maxOccursTotal` subsection, updated the slot-prop table.
- `docs/.vitepress/theme/components/FormExampleChoiceExplicitRepeatable.vue` — branches revert to `maxOccurs: 1` with `maxOccursTotal: 3`, description text updated.
- `docs/.vitepress/theme/components/ChoiceArraySectionCard.vue` — new `usedChoiceOccurrences`/`maxOccurs` props driving a count tag.
- `docs/.vitepress/theme/components/AdvancedFormTemplate.vue` — forwards `usedChoiceOccurrences`/`fieldMetadata.maxOccurs` to `ChoiceArraySectionCard`.
- `.changeset/tame-carrots-repeatable-choice.md` — amended to describe the final XSD-batching behaviour and `maxOccursTotal` from the start; bump stays minor.
- `specs/components.md` — updated `DynamicFormItemChoice`, `DynamicFormTemplate`, `FieldMetadata` entries.
