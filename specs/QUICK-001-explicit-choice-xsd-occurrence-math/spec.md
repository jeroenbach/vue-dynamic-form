---
id: QUICK-001
type: quick
status: draft
created: 2026-09-17
approved_by: ""
pr: ""
---

# Quick: explicit-choice occurrence math follows XSD, per-branch total cap becomes an opt-in extension

## Problem

The explicit-selection repeatable choice mode (`explicitChoiceSelection: true` with `maxOccurs > 1`, shipped in FEAT-001 ST-02) does not follow XSD occurrence semantics, and following battle-tested XSD is the library's unique selling point (Jeroen, 2026-09-17).

In XSD, a branch's `maxOccurs` inside `<xs:choice>` is a per-choice-iteration multiplier: each repetition of the choice picks one branch, and the picked element may repeat up to its own `maxOccurs` within that single repetition. So a choice with `maxOccurs: 5` containing a branch with `maxOccurs: 2` allows up to 10 items of that branch in total, with every group of up to 2 items consuming one choice slot (`ceil(items / branchMax)` slots). There is no per-branch total cap in XSD.

The library's auto mode (no `explicitChoiceSelection`) already implements exactly this: the `occurrences` computed in `DynamicFormItemChoice.vue` (lines 173-253) converts raw item counts with `Math.ceil(child.occurrences / child.maxOccurrences)` and derives each branch's headroom as `choiceMax * branchMax` minus what siblings consume.

The explicit repeatable mode instead reinterpreted the numbers: the choice's `maxOccurs` became a cap on total raw items across all branches (each add consumes one full slot regardless of the branch's `maxOccurs`), and the branch's `maxOccurs` became an independent total cap on that branch. Mechanically: the `childValues` sync watch (`DynamicFormItemChoice.vue:364-377`) feeds `updateChildValue(branchValues, index, 1)` with a batch size of 1, and `canAddChoiceOccurrence` (lines 572-596) adds a direct `branchCount >= branchOwnMax` hard-cap check that the shared-budget math cannot express.

How it happened (traceable, no explicit decision to diverge was ever made): the FEAT-001 feature spec (line 69) introduced "disabled once that branch's own `maxOccurs`, or the choice's shared budget, is exhausted" and mislabeled it "consistent with the existing `occurrences` computation"; the design prototype's `#multi-limits` state and ST-02's AC2 pinned that reading with concrete numbers; the ST-02 developer then correctly discovered the existing math cannot produce a per-branch cap (ST-02 spec, implementation finding 2) and resolved the contradiction in favour of the approved AC by introducing the batch-size-1 workaround, instead of escalating the XSD conflict.

Two consequences today:

1. The same metadata means different things depending on `explicitChoiceSelection`. Auto mode: branch `maxOccurs: 2` under choice `maxOccurs: 5` allows 10 items. Explicit mode: it allows 2.
2. `xsd_choiceMinOccurs` counts in the wrong units in explicit mode: `effectiveValuesCount` (lines 304-313) uses `activeChoiceOccurrences.length`, which is raw items, so 2 items of a `maxOccurs: 2` branch count as 2 choice occurrences when XSD-wise they are 1.

XSD's requirement that same-iteration items be consecutive in the document is explicitly not a concern here (Jeroen, 2026-09-17): values are stored in per-branch arrays and will be grouped together on any future XSD serialization; interleaved display order (FEAT-002) is purely a UI matter.

The per-branch total cap the current behaviour accidentally provides ("max 3 of each kind") is genuinely useful UX and genuinely inexpressible in a plain XSD choice, so it must survive, but as an explicitly named, opt-in, documented non-XSD extension property, not as a reinterpretation of `maxOccurs`.

## Proposed change

**Touches `packages/core/src/`, so a changeset is required at implementation time.** Recommended bump: **minor** (restores the documented XSD contract of a mode that shipped days ago, plus an additive metadata property and an additive slot prop). The conservative alternative is major, since it changes observable behaviour of a published mode; Jeroen decides at approval.

### 1. Explicit repeatable mode reuses the auto-mode batching math

- The `childValues` sync watch (`DynamicFormItemChoice.vue:364-377`) passes the branch's own `maxOccurs` as the batch size, exactly like the auto-mode template branch already does (`updateChildValue($event, index, child.maxOccurs)`, line 761): `updateChildValue(branchValues, index, branch.maxOccurs)`.
- `canAddChoiceOccurrence` (lines 572-596) drops the `branchCount >= branchOwnMax` hard-cap check. The remaining shared-budget check reads `occurrences.value[index].overrideChildMaxOccurrences`, which under the real batch size already equals the branch's XSD headroom in raw-item units (`choiceMax * branchMax` minus siblings' consumption converted to this branch's units). Result for the docs example (choice 5, branches 3): up to 15 CRM exports when the other branch is empty, and 3 CRM exports consume `ceil(3/3) = 1` of the 5 slots.

### 2. Validation counts in choice-occurrence units

`effectiveValuesCount` (lines 304-313), repeatable fold: replace `activeChoiceOccurrences.length` (raw items) with the structural choice-unit count, `sum over branches of ceil(branchFieldArrays[i].fields.length / branch.maxOccurs)`. This keeps FEAT-001's DECIDED parity behaviour (adding an empty occurrence immediately counts toward `xsd_choiceMinOccurs`; the occurrence's own required fields enforce content) but in XSD-correct units: a `minOccurs: 2` choice is not satisfied by 2 items of a single `maxOccurs: 2` branch, because that is 1 choice occurrence.

### 3. Templates get the consumed-slot count as a slot prop

`ChoiceAttributes` (`DynamicFormTemplate.vue`, lines 113-124) gains `usedChoiceOccurrences: number` (name open to review), the number of choice slots currently consumed in choice-occurrence units (the same structural count as change 2). Without it, every template showing "N of `maxOccurs`" (the docs legend currently renders `activeChoiceOccurrences.length` of `maxOccurs`) silently over-counts once items and slots diverge, and would have to re-derive the ceil math itself.

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
