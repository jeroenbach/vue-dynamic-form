---
id: ST-02
type: story
feature: FEAT-005
status: done
approved_by: Jeroen
pr: ""
---

# Story: Choice occurrence maximum (`xsd_choiceMaxOccurs`) and the `maxOccursTotal` backstop

## Functional
### User story
As a library consumer whose form loads or receives choice data from outside the form itself (an API response, an import, or programmatic `initialValues`), I want a choice field that already holds more occurrences than its `maxOccurs` allows, or a branch that already holds more raw items than its own opt-in `maxOccursTotal` cap allows, to fail validation, so that both kinds of over-limit choice state become real, catchable, styleable errors instead of states the UI only prevents going forward but never flags once already reached.

### Acceptance criteria

1. **Over-limit choice-occurrence count fails `xsd_choiceMaxOccurs` (auto mode).**
   Given an auto-mode choice (`explicitChoiceSelection` absent/false) with `maxOccurs: 1` loaded via `initialValues` with two branches simultaneously holding values (the FEAT-001 review scenario),
   When the field is validated,
   Then `usedChoiceOccurrences === 2 > 1` and `xsd_choiceMaxOccurs` fails, with `fieldContext.errorMessage` resolving through the existing priority chain.

2. **Over-limit choice-occurrence count fails `xsd_choiceMaxOccurs` (explicit `maxOccurs: 1` mode).**
   Given an explicit-selection choice (`explicitChoiceSelection: true`) with `maxOccurs: 1` loaded with two branches already holding values (no `addChoiceOccurrence` call needed for this to be reachable, since loaded data merges into the value-driven view per FEAT-001),
   When the field is validated,
   Then `xsd_choiceMaxOccurs` fails identically to AC1, confirming no mode-specific branching is needed.

3. **Over-limit choice-occurrence count fails `xsd_choiceMaxOccurs` (explicit `maxOccurs > 1` mode, batched units).**
   Given an explicit-selection choice with `maxOccurs: 3` where one branch has its own `maxOccurs: 2` and is loaded with 5 raw items (`ceil(5/2) = 3` choice-occurrence units) while another branch independently holds 1 more unit,
   When the field is validated,
   Then `usedChoiceOccurrences > 3` and `xsd_choiceMaxOccurs` fails, confirming the rule compares in choice-occurrence units (via `usedChoiceOccurrences`), not raw item count, per ADR-2/QUICK-001.

4. **Exactly-at-limit and under-limit pass, in every mode above.**
   Given each of the three scenarios in AC1-3 loaded at exactly `usedChoiceOccurrences === maxOccurs`,
   When the field is validated,
   Then `xsd_choiceMaxOccurs` passes; loaded strictly under `maxOccurs` also passes.

5. **`xsd_choiceMinOccurs` and `xsd_choiceMaxOccurs` are mutually exclusive (ADR-4).**
   Given `minOccurs <= maxOccurs` (the assumed, unenforced invariant, per finding 2 / ADR-4's caveat),
   When any choice is validated,
   Then at most one of `xsd_choiceMinOccurs` / `xsd_choiceMaxOccurs` is ever present in `combinedValidation`'s list, confirmed by a direct assertion on the list length in the over-limit and under-limit cases.

6. **`maxOccursTotal` backstop fires for a branch loaded past its own cap, explicit `maxOccurs > 1` (ADR-6, the mode with no other coverage).**
   Given an explicit-selection choice, a branch declaring `maxOccursTotal: 4` and its own `maxOccurs: 3` (so `xsd_choiceMaxOccurs`'s unit, `ceil(items/3)`, would not itself flag a raw overflow), loaded with 5 raw items for that branch,
   When the field is validated,
   Then the choice-level `maxOccursTotal` rule fires (`occurrences[i].childOccurrences === 5 > 4`), reporting `{max}` = 4, while `xsd_choiceMaxOccurs` does not (its own unit resolves to `ceil(5/3) = 2`, within the choice's `maxOccurs`), confirming the backstop is the only signal in this mode, exactly as the architecture's data-flow addendum claims.

7. **A branch at exactly `maxOccursTotal` passes; structural read (finding 10).**
   Given the branch above loaded with exactly 4 raw items,
   When the field is validated,
   Then `maxOccursTotal` passes. Adding a 5th item (add-then-fails) and then removing it back to 4 (remove-then-passes) confirms the guard reads the count structurally rather than caching a stale value.

8. **`maxOccursTotal` is inert for a branch that does not declare it.**
   Given a choice where no branch declares `maxOccursTotal`,
   When any branch is loaded with any number of raw items (bounded only by `xsd_choiceMaxOccurs`/the shared budget),
   Then the `maxOccursTotal` rule never appears in `combinedValidation` and never fails.

9. **`maxOccursTotal` reports the first offending branch's cap when several branches breach at once (DECIDED Jeroen, option (a), Open question 7).**
   Given two branches, A (`maxOccursTotal: 2`, loaded with 5) and B (`maxOccursTotal: 10`, loaded with 12), both declared in that order,
   When the field is validated,
   Then `maxOccursTotal` fails reporting `{max}` = 2 (branch A's cap, the first offender in declaration order), and the message names no branch (`{field}` resolves to the choice's own anchor label, not a branch name). This is the accepted, documented limitation, not a bug to fix in this story.

10. **Co-occurrence: `maxOccursTotal` pushed last, occurrence rule wins the displayed message (data-flow addendum, finding 9).**
    Given a choice with `minOccurs: 3` and a branch with `maxOccursTotal: 1` loaded with 2 items, where `effectiveValuesCount === 1 < 3` (choice-min violated) and the same branch's raw count `2 > 1` (`maxOccursTotal` violated),
    When the field is validated,
    Then both `xsd_choiceMinOccurs` and `maxOccursTotal` are present in `combinedValidation` and both fail, but `fieldContext.errorMessage` shows the `xsd_choiceMinOccurs` message, since `maxOccursTotal` is pushed last. A test must assert this ordering explicitly.

11. **Auto-mode double-error is benign, not suppressed (finding 8).**
    Given an auto-mode (or `maxOccurs: 1` explicit) choice where a branch renders as a real `DynamicFormItemArray` with `maxOccursOverride = Math.min(sharedBudget, maxOccursTotal)`, loaded over that clamped override,
    When the field is validated,
    Then both the branch's own `xsd_maxOccurs` (ST-01's rule, on the branch's own field) and the choice-level `maxOccursTotal` fire, rendering at their respective anchors (`-array` slot inline at the branch, `-choice`/`-choice-array` slot at the choice), and neither is suppressed.

12. **Timing mirrors the existing choice min-rule timing (ADR-3).**
    Given a choice loaded over `maxOccurs` (or over a branch's `maxOccursTotal`) via `initialValues`,
    When the form first mounts, before any interaction,
    Then no `xsd_choiceMaxOccurs` / `maxOccursTotal` error is shown yet; it appears on first interaction or submit, the same outcome `xsd_choiceMinOccurs` already produces (via vee-validate's `validateOnValueUpdate`/`validateOnMount` defaults, not the array's `firstValueSet` mechanism, per ADR-3's finding-6 clarification that the two components reach the same outcome by different gates).

13. **`{max}`/`{0}` placeholders resolve for both new rules.**
    Given `settings.messages.choiceMaxOccurs` and `settings.messages.maxOccursTotal` each set to a string using `{max}` and `{0}`,
    When each rule fails,
    Then the resolved messages substitute the relevant cap for both placeholders.

### Edge cases
- A choice with exactly one branch (`singleChild` fast path, auto mode): `combinedValidation` still early-returns before either new rule is considered, matching today's behavior; explicit mode's `singleChild` bypass (FEAT-001) still routes through the restructured list unaffected.
- A disabled choice (`maxOccurs: 0`): `combinedValidation` still early-returns `undefined` before either new rule is considered, matching today's `xsd_choiceMinOccurs` behavior.
- A repeatable choice nested inside an array item, loaded over its own `maxOccurs` or a branch's `maxOccursTotal`: fails the same way as a top-level choice; no array-specific branching exists in the choice's occurrence math.

### Out of scope
- Array occurrence maximums (`xsd_maxOccurs`): ST-01 (a dependency of this story's shared `validation.ts` edits only).
- Any change to `xsd_choiceMinOccurs` semantics, wiring, or timing.
- Any change to `canAddChoiceOccurrence` / the "Add" affordance's disabled state.
- Per-branch error anchoring or branch-naming in the `maxOccursTotal` message: rejected by ADR-6 and Open question 7's DECIDED (Jeroen) option (a); not reopened here.
- Documentation updates: ST-03.

## Design reference
Not applicable. Pure engine/validation feature with no design phase or prototype (per `specs/README.md`'s "features with no design phase" path). Reuses the existing `fieldContext.errorMessage` / `-choice` / `-choice-array` slot error-display mechanics `xsd_choiceMinOccurs` already exercises; no new slot, prop, or component.

## Architecture reference

Implements the feature architecture's "Choice-rule slice" (Natural slicing seams, item 2), which explicitly folds in the `maxOccursTotal` backstop rather than splitting it into a separate slice ("touches the exact same two files... splitting it out would guarantee a rebase conflict for no isolation benefit"). Implements ADR-2 (choice-occurrence units), ADR-4 (list-shape restructure), ADR-5 (`maxOccursTotal` naming), and ADR-6 (choice-level aggregate anchoring).

- **`packages/core/src/core/validation.ts` (modified).** Add `'xsd_choiceMaxOccurs'` and `'maxOccursTotal'` to the `ValidationRule` union (widen the union's doc comment to note it also carries one non-XSD occurrence extension, per ADR-5). Register `defineRule('xsd_choiceMaxOccurs', () => false)` next to the existing `xsd_choiceMinOccurs` stub (the choice has no inspectable value in the vee-validate tree; the real condition lives in the component's guard). Register `defineRule('maxOccursTotal', () => false)`, the same stub shape, for the same reason. Add `xsd_choiceMaxOccurs: 'max'` and `maxOccursTotal: 'max'` to `ruleParamNames`. Depends on ST-01 only in that both stories touch this same file's additive union/registration/`ruleParamNames` sections; either implementation order merges cleanly since neither touches the other's lines.
- **`packages/core/src/components/DynamicFormItemChoice.vue` (modified, this story's core change).** Restructure the existing `combinedValidation` computed from its current early-return shape (`if (effectiveValuesCount >= minOccurs) return; return [xsd_choiceMinOccurs]`) into a list-building shape per ADR-4:
  ```ts
  const combinedValidation = computed(() => {
    if (singleChild.value) return;
    if (disabled.value) return;

    const _messages = settings?.value?.messages;
    const _validations = [];

    // PROPOSED (adversarial review, finding 2): two independent `if`s, not `if/else if`,
    // matching the approved architecture data-flow snippet and ADR-4's stated intent (the list
    // shape must be able to hold both rules if the `minOccurs <= maxOccurs` invariant is ever
    // relaxed; `else if` re-encodes the mutual-exclusivity assumption into control flow, which
    // ADR-4 deliberately moved out of it).
    if (effectiveValuesCount.value < minOccurs.value)
      _validations.push(createValidation('xsd_choiceMinOccurs', minOccurs.value, _messages?.choiceMinOccurs));
    if (usedChoiceOccurrences.value > maxOccurs.value)
      _validations.push(createValidation('xsd_choiceMaxOccurs', maxOccurs.value, _messages?.choiceMaxOccurs));

    if (maxOccursTotalBreach.value !== undefined)
      _validations.push(createValidation('maxOccursTotal', maxOccursTotalBreach.value, _messages?.maxOccursTotal));

    return _validations.length ? _validations : undefined;
  });
  ```
  Add a new `maxOccursTotalBreach` computed per the architecture's data-flow section: scans `field.value?.choice ?? []`, for each branch reads `occurrences.value[i]?.childOccurrences ?? 0` (the raw per-branch item count, equal to `branchFieldArrays[i].fields.value.length`, the exact quantity `canAddChoiceOccurrence` already governs) against that branch's own `maxOccursTotal`, and returns the first (`i` ascending, declaration order) offending branch's cap, or `undefined`. `usedChoiceOccurrences` and `occurrences` are both pre-existing computeds in this file; no new reactive source, no new `useField` call, no new timing gate. `maxOccursTotal` is pushed last (AC10) so a co-occurring choice-occurrence rule wins `errorMessage`.
- **`packages/core/src/types/DynamicFormSettings.ts` (modified).** Add `choiceMaxOccurs?: ValidationMessage` (mirroring `choiceMinOccurs`'s JSDoc, placeholders `{field}`, `{0}`/`{max}`) and `maxOccursTotal?: ValidationMessage`, whose JSDoc must additionally state (per the accepted finding 7 resolution, Open question 7 DECIDED (Jeroen) option (a)) that this is a single choice-level aggregate that does not name the offending branch and, when several branches breach at once, reports only the first offending branch's cap in declaration order.
- **`createValidation.ts` / `resolveMessage.ts`**: reused as-is, no change.
- **Public API surface touched:** two new optional keys, `DynamicFormSettings.messages.choiceMaxOccurs` and `.maxOccursTotal`. `ValidationRule`, `ruleParamNames`, and the restructured `combinedValidation` internals remain internal, not exported from `index.ts`. No existing exported signature changes; `FieldMetadata.maxOccursTotal` already exists (FEAT-001) and is only read here, not altered. Additive, matches the feature's `minor` bump verdict (re-confirmed for the backstop specifically in the architecture's "CONFIRMED (architecture, re-architecture)" note).
- **`specs/components.md`:** update the "Validation rules" list to add `xsd_choiceMaxOccurs` and `maxOccursTotal`, and note the two new `messages` keys, at implementation time (this story owns adding `maxOccursTotal` to the list, per the feature's Natural slicing seams note).
- **Changeset:** this story touches `packages/core/src/`, so it carries its own changeset entry, bump type `minor`.
- **Dependencies on other stories:** depends on ST-01 only for the shared, purely-additive `validation.ts` edits (trivially rebaseable in either order). Otherwise independent of ST-01's array-component change.

## QA plan

This story extends the existing `DynamicFormItemChoice.validation.test.ts` and `DynamicFormItemChoice.analytics.test.ts` suites and adds one small describe block to `DynamicFormItemChoice.test-helpers.ts`. No new fixture component is needed: `TestForm`/`TestFormTemplate` already expose everything this story touches (`initialValues`, `settings.messages`, the `pick-error-message`, `pick.<branch>-add-choice-button`/`-remove-choice-button`, and `pick-used-choice-occurrences` testids, all already exercised by the existing `xsd_choiceMinOccurs` suite). Every pattern referenced below (message-priority `it.each` tables, `initialValues`-driven over-limit loads, `setupState` whitebox reads) already exists in this file or its ST-01 sibling; none is invented for this plan.

### Fixture / harness changes

None required for mounting or rendering. Two additions to the existing `DynamicFormItemChoice.test-helpers.ts` (which already centralizes whitebox reads for this component, unlike the array component ST-01 had to work around ad hoc):

```ts
/** Reads the number of rules currently present in `combinedValidation` for the choice at `path`. */
export function combinedValidationCount(wrapper, path): number

/** Reads the `maxOccursTotalBreach` computed (the offending branch's cap, or undefined) for the choice at `path`. */
export function maxOccursTotalBreach(wrapper, path): number | undefined
```

Both follow the exact `setupState(wrapper, path)?.<name>` pattern the file's existing `activeChoiceOccurrences`/`explicitlySelectedBranch` helpers already use; `combinedValidation` and `maxOccursTotalBreach` are both top-level `computed()`s in `<script setup>`, so they are unwrapped in `$.setupState` the same way. `combinedValidationCount` reads `.length ?? 0` since the computed returns `undefined` when the list is empty.

### Test files touched

| File | Status | Purpose |
| --- | --- | --- |
| `packages/core/src/components/__tests__/DynamicFormItemChoice.test-helpers.ts` | extend | Add `combinedValidationCount` and `maxOccursTotalBreach` (above). |
| `packages/core/src/components/__tests__/DynamicFormItemChoice.validation.test.ts` | extend | New describe blocks for `xsd_choiceMaxOccurs` (auto mode, explicit `maxOccurs:1`, explicit `maxOccurs>1`, message priority, mutual exclusivity) and `maxOccursTotal` (breach, at-cap, inert, first-offender, co-occurrence masking, auto-mode double-error, message priority), plus timing and edge-case blocks. |
| `packages/core/src/components/__tests__/DynamicFormItemChoice.analytics.test.ts` | extend | New describe block covering the `maxOccursTotalBreach` computed's reactive cost and the absence of any new render/recompute regression. |
| `packages/core/src/core/__tests__/validation.test.ts` | **not extended** (deliberate, see Coverage) | No new `describe` block for `xsd_choiceMaxOccurs`/`maxOccursTotal` at the rule level. Both are stubs (`() => false`, identical shape to the existing `xsd_choiceMinOccurs`, which itself has zero entries in this file today). A direct unit test would only assert `() => false` returns `false`, asserting nothing about the real logic, which lives entirely in the component guards already covered below. Matches existing precedent exactly; not an oversight. |

### Acceptance criteria → test mapping

1. **Auto-mode over-limit fails `xsd_choiceMaxOccurs`.** `metadata: [{ name: 'pick', choice: [{name:'opt1'},{name:'opt2'}] }]` (default `maxOccurs: 1`), `initialValues: { pick: { opt1: 'a', opt2: 'b' } }`. `usedChoiceOccurrences` = `valuesCount` = 2 > 1. Submit; assert `pick-error-message` exists and resolves through `settings.messages.choiceMaxOccurs` → `configure.generateMessage` → rule default (three variants, mirroring the existing `xsd_choiceMinOccurs — custom error messages` block at lines 86-147). `DynamicFormItemChoice.validation.test.ts`.
2. **Explicit `maxOccurs:1`, two branches loaded via `initialValues`.** `metadata: [{ name: 'pick', explicitChoiceSelection: true, choice: [{name:'selfServe'},{name:'guidedRollout'}] }]`, `initialValues: { pick: { selfServe: 'a', guidedRollout: 'b' } }`, no `addChoiceOccurrence` call. `activeChoiceOccurrences` picks up both branches value-driven, `usedChoiceOccurrences = activeChoiceOccurrences.value.length = 2 > 1`. Submit; assert the same `pick-error-message` outcome as AC1, confirming no mode branching. `DynamicFormItemChoice.validation.test.ts`.
3. **Explicit `maxOccurs>1`, batched units.** `metadata: [{ name: 'pick', explicitChoiceSelection: true, maxOccurs: 3, choice: [{name:'branchA', maxOccurs:2},{name:'branchB'}] }]`, `initialValues: { pick: { branchA: ['a','b','c','d','e'], branchB: ['x'] } }`. `usedChoiceOccurrences = ceil(5/2) + ceil(1/1) = 3 + 1 = 4 > 3`. Submit; assert `pick-error-message` fires. `DynamicFormItemChoice.validation.test.ts`.
4. **Exactly-at-limit and under-limit pass, all three modes.** Three `it.each`-style pairs (exactly `usedChoiceOccurrences === maxOccurs`, and strictly under), one per mode above (auto/explicit-1/explicit-N), reusing the same metadata shapes with adjusted item counts (e.g. AC3's shape with `branchA: ['a','b','c','d','e','f']` batched to exactly 3 units, no `branchB` load, `maxOccurs: 3`). Assert no `pick-error-message`. `DynamicFormItemChoice.validation.test.ts`.
   **PROPOSED (adversarial review, finding 1):** the *strictly-under* sub-case for the auto and explicit-`maxOccurs:1` modes must set `minOccurs: 0` (an optional choice). For `maxOccurs: 1`, "strictly under" is necessarily `usedChoiceOccurrences === 0`, which trips the default (`minOccurs: 1`) `xsd_choiceMinOccurs` rule and *does* render `pick-error-message`, so the flat "assert no `pick-error-message`" assertion fails there unless the choice is optional. The explicit `maxOccurs > 1` under-limit case (which can sit at `>= 1` occurrence while still under `maxOccurs`) is unaffected and may keep its default `minOccurs`.
5. **Mutual exclusivity, direct list-length assertion.** Two tests, both with no branch declaring `maxOccursTotal` (isolating the assertion to the two XSD rules): (a) AC1's over-limit scenario, assert `combinedValidationCount(wrapper, 'pick') === 1` and (via a distinct custom `choiceMaxOccurs` message) that the one present rule is the max rule, not the min rule; (b) the existing under-min scenario (no branch filled, default `minOccurs: 1`), assert `combinedValidationCount(wrapper, 'pick') === 1` and the one present rule is `xsd_choiceMinOccurs`. Never `2` in either case. `DynamicFormItemChoice.validation.test.ts`.
6. **`maxOccursTotal` fires, explicit `maxOccurs>1`, no other coverage.** `metadata: [{ name: 'pick', explicitChoiceSelection: true, maxOccurs: 3, choice: [{name:'branchA', maxOccurs:3, maxOccursTotal:4}] }]`, `initialValues: { pick: { branchA: ['a','b','c','d','e'] } }` (5 raw items). `usedChoiceOccurrences = ceil(5/3) = 2 <= 3` (no `xsd_choiceMaxOccurs`), `childOccurrences = 5 > 4` (`maxOccursTotal` fires, `{max}` = 4). Submit; assert `pick-error-message` shows the `maxOccursTotal` message and `combinedValidationCount(wrapper, 'pick') === 1`. `DynamicFormItemChoice.validation.test.ts`.
7. **At exactly `maxOccursTotal` passes; structural read (finding 10).** Same branch as AC6, `initialValues: { pick: { branchA: ['a','b','c','d'] } }` (4 raw items): submit, assert no error. Then `pick.branchA-add-choice-button` click (5th item, add-then-fails): assert error appears. Then `pick.branchA[4]-remove-choice-button` click (back to 4, remove-then-passes): assert error clears, proving the guard re-reads `occurrences` structurally rather than caching. Also assert `maxOccursTotalBreach(wrapper, 'pick')` transitions `undefined → 4 → undefined` across the three steps. `DynamicFormItemChoice.validation.test.ts`.
8. **`maxOccursTotal` inert when no branch declares it.** `metadata: [{ name: 'pick', explicitChoiceSelection: true, maxOccurs: 3, choice: [{name:'branchA', maxOccurs:3}] }]` (no `maxOccursTotal`), loaded up to and including the shared budget (9 raw items, `ceil(9/3)=3<=3`). Assert `combinedValidationCount(wrapper, 'pick')` never exceeds `1` (only the occurrence rule, if any) and `maxOccursTotalBreach(wrapper, 'pick')` is always `undefined`, regardless of raw count. `DynamicFormItemChoice.validation.test.ts`.
9. **First offending branch reported (Jeroen, option (a)).** `metadata: [{ name: 'pick', explicitChoiceSelection: true, maxOccurs: 20, minOccurs: 0, choice: [{name:'branchA', maxOccursTotal:2},{name:'branchB', maxOccursTotal:10}] }]`, `initialValues: { pick: { branchA: [1,2,3,4,5], branchB: [1,2,3,4,5,6,7,8,9,10,11,12] } }` (generous choice `maxOccurs`/`minOccurs: 0` keeps `xsd_choiceMinOccurs`/`xsd_choiceMaxOccurs` silent, isolating the assertion to `maxOccursTotal`). With `settings.messages.maxOccursTotal: '{field} allows at most {max} ({0})'`, assert the resolved message contains `2` (branch A's cap, declared first) and not `10`, and contains the choice's own label (`{field}`), and does not contain either branch's name string. `DynamicFormItemChoice.validation.test.ts`.
10. **Co-occurrence: occurrence rule wins, ordering asserted (finding 9).** `metadata: [{ name: 'pick', explicitChoiceSelection: true, minOccurs: 3, maxOccurs: 5, choice: [{name:'solo', maxOccurs:3, maxOccursTotal:1}] }]`, `initialValues: { pick: { solo: ['a','b'] } }`. `effectiveValuesCount = max(valuesCount, usedChoiceOccurrences) = max(1,1) = 1 < 3` (`xsd_choiceMinOccurs` fails) and `childOccurrences = 2 > 1` (`maxOccursTotal` fails). With distinct messages for both, assert `combinedValidationCount(wrapper,'pick') === 2`, `pick-error-message` shows the `choiceMinOccurs` message (not `maxOccursTotal`), and a whitebox read of `fieldContext.errors` (via `setupState`) has length `2` with the min message first and the `maxOccursTotal` message second, so a future reordering of the pushes is caught by an ordering assertion, not only a content assertion. `DynamicFormItemChoice.validation.test.ts`.
11. **Auto-mode double-error is benign (finding 8).** Depends on ST-01's `xsd_maxOccurs` already being wired into `DynamicFormItemArray.vue` (flagged below). `metadata: [{ name: 'pick', minOccurs: 0, choice: [{name:'branchA', maxOccurs:3, maxOccursTotal:2},{name:'branchB'}] }]` (auto mode, choice `maxOccurs: 1` default so the shared budget for `branchA` alone is `1*3=3`, clamped by `maxOccursTotal:2` to `overrideChildMaxOccurrences = 2`), `initialValues: { pick: { branchA: ['a','b','c'] } }` (3 raw items, over the clamped override of 2). Submit; assert **both** `pick.branchA-error-message` (the branch's own `xsd_maxOccurs`, ST-01) and `pick-error-message` (`maxOccursTotal`) exist simultaneously, neither suppressing the other. `DynamicFormItemChoice.validation.test.ts`.
12. **Timing mirrors `xsd_choiceMinOccurs` (ADR-3).** Two variants: (a) AC1's auto-mode scenario, assert no `pick-error-message` immediately after mount/`flushPromises()`, then assert it appears after the first submit; (b) AC6's `maxOccursTotal` scenario, same before/after-submit pair. `DynamicFormItemChoice.validation.test.ts`.
13. **`{max}`/`{0}` placeholders resolve for both new rules.** Two `it.each` tables mirroring the existing `xsd_choiceMinOccurs — custom error messages` table (lines 87-118): one for `choiceMaxOccurs` (AC1's scenario, `max: 1`), one for `maxOccursTotal` (AC6's scenario, `max: 4`), each with a positional-only and a named-placeholder row. `DynamicFormItemChoice.validation.test.ts`.

**Edge cases:**
- **`singleChild` fast path (auto mode) unaffected.** `metadata: [{ name: 'pick', choice: [{name:'only', maxOccurs:5}] }]`, `initialValues: { pick: { only: ['a','b','c','d','e','f'] } }` (6 raw items on a lone branch, a value that would breach almost any hypothetical choice-level cap). Assert `combinedValidation` is `undefined` via `setupState(wrapper,'pick')?.combinedValidation` (the whole computed short-circuits before either new rule is considered, per `if (singleChild.value) return;`), and no `pick-error-message` exists. Regression check, extends the existing `single child choice` block (lines 318-376).
- **Explicit mode's `singleChild` bypass still routes through the restructured list.** One new test: `explicitChoiceSelection: true`, a single-branch choice with `maxOccurs: 1` (choice-level) loaded via `initialValues` with the one branch itself holding an over-limit value is not reachable at the choice level for a single branch (there is no second branch to compete for budget), so instead this test confirms the *positive* claim: a single-branch **explicit** choice still evaluates `combinedValidation` (not bypassed, unlike auto mode), by asserting `xsd_choiceMinOccurs` still fires when nothing is selected, extending the existing `explicit selection — single-branch degenerate case` block (lines 861-889) with an explicit `combinedValidationCount(wrapper,'pick') === 1` assertion.
- **Disabled choice (`maxOccurs: 0`).** Extends the existing `disabled choice — maxOccurs=0` block (lines 194-221): add a branch declaring `maxOccursTotal: 1`, load it with 5 raw items via `initialValues`; assert `combinedValidationCount(wrapper,'pick') === 0` and no error, confirming the early return still short-circuits before `maxOccursTotalBreach` is even considered.
- **Repeatable choice nested inside an array item.** One new test nesting AC6's scenario inside a `projectContacts` array item (mirroring the existing nested-render pattern in `DynamicFormItemChoice.analytics.test.ts` lines 201-244), confirming path resolution/anchoring for `maxOccursTotal` works through a `pathOverride`, not only at the top level. `DynamicFormItemChoice.validation.test.ts`.

### States (this slice)

The feature has no design phase and no states-policy section (`Design (feature level)`: "Skipped... pure engine/validation-model feature with no visual surface of its own"), so there is no feature-level states table to map against, exactly as ST-01 records for its own slice. This slice maps to the states the existing `xsd_choiceMinOccurs` suite already treats as this component's relevant states, extended with the two this story adds:

- **Passing / no error** — AC4, AC7 (at-cap), AC8.
- **Error (new: over-limit occurrence count)** — AC1, AC2, AC3.
- **Error (new: per-branch total breach)** — AC6, AC9.
- **Error, co-occurring with another rule (message masked)** — AC10.
- **Error, co-occurring with an unrelated rule (both visible, different anchors)** — AC11.
- **Disabled (`maxOccurs: 0`)** — edge case.
- **Single-child bypass (no choice-level state at all)** — edge case.
- **Pre-interaction / mount-only** — AC12, the "no error yet" state the timing gate produces.

No loading state applies (no async metadata/validation in this component). Empty state (no branch selected/filled) is already the existing `xsd_choiceMinOccurs`-under-min state, unchanged by this story.

### Reactivity / `*.analytics.test.ts` plan

This story adds one new computed (`maxOccursTotalBreach`) and one new push into the existing `combinedValidation` computed; it reads `occurrences`, already a transitive dependency, so the architecture's explicit claim is "no new reactive source, no new render." New describe block in `DynamicFormItemChoice.analytics.test.ts`:

1. **`_analytics_occurrencesCalculatedCount` is unaffected by adding a `maxOccursTotal` cap.** Baseline/flag-on comparison, mirroring the existing `preserveOnSwitch` baseline-diff pattern (lines 288-322): mount AC6's scenario twice, once with `maxOccursTotal` declared and once without (otherwise identical), perform the same add-choice-occurrence sequence on both, and assert the increase in `_analytics_occurrencesCalculatedCount` is identical in both. Directly guards against the guard's `occurrences` read forcing an extra recompute.
2. **No sibling re-render.** A sibling text field alongside the AC6/AC9 scenarios; loading a branch over `maxOccursTotal` and submitting must not change `renderCount(wrapper, 'sibling')`, reusing the existing sibling-isolation pattern (lines 54-65).
3. **Add-then-remove (AC7) does not remount the surviving occurrence.** Load 4 items, add a 5th, remove it back to 4: assert the branch's occurrence `DynamicFormItem` instances for indices 0-3 are not remounted (same DOM-element-identity technique as the existing repeatable-branch remount guards, lines 148-168), confirming the error's appear/disappear transition rides the existing error-display path without touching child identity.
4. **Auto-mode double-error (AC11) does not double-count renders.** The branch's own `DynamicFormItemArray` and the choice's `maxOccursTotal` guard both fire from the same underlying value change; assert the branch's `renderCount` is bounded (not multiplied) compared to an equivalent load with no `maxOccursTotal` declared, using the same before/after bound technique ST-01's analytics plan uses for its own array-level guard.

### Coverage

Every new runtime line is covered by the mapping above:

- `validation.ts`: the `ValidationRule` union additions are type-only (no runtime metric); the `defineRule('xsd_choiceMaxOccurs', () => false)` and `defineRule('maxOccursTotal', () => false)` stub bodies are executed (statement coverage) the first time any test actually triggers validation of a choice carrying that rule (AC1-AC3 for the former, AC6-AC10 for the latter), even though no direct rule-level unit test exists (see the "not extended" row above); the two `ruleParamNames` entries are exercised by every AC13 placeholder test.
- `DynamicFormItemChoice.vue`'s restructured `combinedValidation`: both branches of `singleChild`/`disabled` early returns (edge cases), both branches of the min-vs-max `if/else if` (AC1-AC5), both branches of the `maxOccursTotalBreach.value !== undefined` push (AC6-AC10 taken, AC8 not taken), and both branches of the final `_validations.length ? ... : undefined` (AC4/AC8 empty, AC1/AC6/AC10 non-empty, AC10 length-2).
- The new `maxOccursTotalBreach` computed's loop: cap `undefined` → skip (AC8), cap defined and not breached → skip (AC7 at-cap), cap defined and breached, first offender → return (AC6, AC9's branch A), loop exhausts with no breach → return `undefined` (AC8). AC9 additionally exercises the "later offending branch is never reached" path (branch B's breach is real but never inspected because branch A's `return` fires first), the one condition genuinely unique to this story's list-shape decision.
- `DynamicFormSettings.messages.choiceMaxOccurs`/`maxOccursTotal`: type-only additions, exercised at runtime by every test above that sets one of these keys, and at the type level by `pnpm typecheck` continuing to pass.

Run `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`) after implementation and confirm no drop against baseline. If it drops, the most likely gap is the `maxOccursTotalBreach.value !== undefined` guard's false branch (AC8) or the loop's early-return-skips-later-offenders branch (AC9), both explicitly covered above, so a drop should be treated as a sign a planned test was skipped, not an acceptable baseline change.

### Time sensitivity

Not applicable. This story introduces no date/time-dependent logic; none of the new tests need to run under a specific `TZ` beyond the CI default already set for the whole suite.

### Regression risk

- **`DynamicFormItemChoice.vue`'s `combinedValidation` restructure** touches every choice field in the library (the `maxOccursTotal` push is opt-in per branch, but the list-shape change and the `xsd_choiceMaxOccurs` push are not). The full existing `xsd_choiceMinOccurs restriction`, `optional choice`, `disabled choice`, `multi-slot choice`, `single child choice`, `nested choices`, `multi-layer`, `explicit selection`, `explicit selection (units)`, `single-branch degenerate case`, and `preserve-on-switch` describe blocks (the whole existing file) must remain green, unmodified, as the primary proof the restructure does not disturb existing min-rule behavior, timing, or message resolution.
- **Message-ordering regression (AC10, mirrors ST-01's finding 3/nit 3 for arrays).** Any future reordering of the three pushes in `combinedValidation` would silently flip which message wins `errorMessage`. Guarded by AC10's explicit ordering assertion on `fieldContext.errors`, not only on the visible message.
- **Cross-story dependency: AC11 needs ST-01 merged.** Unlike the architecture's framing of the two stories' shared `validation.ts` edits as "purely additive, either order," AC11's specific test exercises `DynamicFormItemArray.vue`'s own `xsd_maxOccurs` rule (ST-01's change), not just the shared registration. If ST-01 has not landed when this story is implemented, AC11's test cannot pass yet; it should be written but may need to stay pending (or be implemented right after ST-01 merges) rather than blocking the rest of this story's suite. Flagged for the scrum-master/developer to sequence accordingly.
- **`ValidationRule` union / `ruleParamNames` shared edit surface with ST-01.** Both stories add entries to the same two structures. Additive by construction; the developer implementing whichever story lands second should re-run `validation.test.ts` in full to confirm the other story's entries are inert, same guidance ST-01's own plan gives.
- **`DynamicFormSettings.messages` type growth** — additive only; verified by `pnpm typecheck` continuing to pass on existing example/docs metadata that does not set `messages.choiceMaxOccurs`/`messages.maxOccursTotal`.
- **`specs/components.md`** must be updated to list `xsd_choiceMaxOccurs` and `maxOccursTotal` and the two new `messages` keys, per this story's own architecture-reference obligation; a stale `components.md` is a documentation regression, not a test regression, but worth a developer checklist item.

### Manual verification checklist

None required. This is a pure engine/validation story with no visual surface, no new slot, and no docs/example change (ST-03's scope); every acceptance criterion and edge case above is exercised through the `TestForm`/`TestFormTemplate` component-test harness with `@vue/test-utils`, which already renders the exact error-display markup a real consumer's template would show.

### Flags for reviewer

- **AC11's test has a real (not merely file-level) dependency on ST-01.** See Regression risk above. This is stronger than the architecture's "shared additive `validation.ts` edits, either order" framing, since AC11 exercises ST-01's actual rule logic, not just its registration. Flagging so the scrum-master can decide whether to sequence implementation (ST-01 first) or accept AC11 as a pending test until ST-01 lands.
- **AC5, AC8, and AC10's `combinedValidationCount`/`errors`-ordering assertions are whitebox checks**, reading internal setup state rather than only DOM output, for the same reason ST-01 flags its own AC6/AC9 equivalents: the acceptance criteria are themselves phrased as internal-state claims ("at most one... is ever present in `combinedValidation`'s list", "both are present... and both fail") that the visible `errorMessage` alone cannot distinguish from a rule not existing yet.
- **AC9 locks in the current first-offender-in-declaration-order behavior as correct**, per Jeroen's DECIDED option (a) on Open question 7. This test should only need to change if that product decision is revisited, not as a sign of a bug in the meantime.
- **No direct rule-level unit tests added for the two new stub rules in `validation.test.ts`**, matching the existing zero-test precedent for `xsd_choiceMinOccurs`. Statement coverage of both one-line stub bodies is still achieved transitively through the component tests that trigger real validation (see Coverage). Flagging as a deliberate, precedent-matching choice rather than an oversight, in case the reviewer expects rule-level symmetry with ST-01's `xsd_maxOccurs` (which does get direct unit tests there, because unlike these two stubs it has real, independently-testable logic).

## Adversarial review

Lite (STORY) mode: blockers only for the status decision. The story was checked against the real code in `DynamicFormItemChoice.vue` (the `combinedValidation`, `occurrences`, `usedChoiceOccurrences`, `effectiveValuesCount`, `activeChoiceOccurrences` computeds and `updateChildValue`), `validation.ts` (the `xsd_choiceMinOccurs` `() => false` stub precedent), `DynamicFormSettings.ts`, `DynamicFormItemChoice.test-helpers.ts`, `TestFormTemplate.vue` (all referenced testids), and the approved feature architecture (ADR-2..6, the data-flow addendum, Open question 7's DECIDED option (a), and second-pass findings 7-10).

**What holds up (verified against code, not just the prose):**

- All 13 acceptance criteria plus the four edge cases are mapped to concrete metadata/`initialValues` scenarios and named test files. The occurrence math in each mapping was recomputed against the real `occurrences`/`usedChoiceOccurrences`/`effectiveValuesCount` logic and checks out (AC3's `ceil(5/2)+ceil(1/1)=4>3`, AC6's `ceil(5/3)=2<=3` with `childOccurrences=5>4`, AC9's first-offender `{max}=2`, AC10's `[choiceMinOccurs, maxOccursTotal]` order).
- The "no direct rule-level unit tests for the two `() => false` stubs" decision matches the real precedent: `validation.test.ts` contains zero `choiceMinOccurs` references today, and `xsd_choiceMinOccurs` is itself a `() => false` stub. The precedent-matching call is sound.
- All testids the QA plan leans on (`-error-message`, `.<branch>-add-choice-button`, `-remove-choice-button`, `-used-choice-occurrences`, `-kind-badge`) exist in `TestFormTemplate.vue`; the whitebox helpers (`combinedValidationCount`, `maxOccursTotalBreach`) follow the existing `setupState(...)?.<name>` pattern, and both `combinedValidation` and the new `maxOccursTotalBreach` are top-level computeds that `$.setupState` unwraps.
- The cross-story dependency on ST-01 is explicit twice (shared additive `validation.ts` edits, and AC11's real dependency on ST-01's `xsd_maxOccurs` logic), correctly flagged for sequencing. No silent local override of the approved architecture: the restructure follows ADR-4, `maxOccursTotal` follows ADR-6/the data-flow addendum, and the first-offender behavior follows Open question 7's DECIDED option (a).

**Findings:**

1. **(should-fix, routed)** AC4's mapping asserts "no `pick-error-message`" for the *strictly-under* sub-case in all three modes, but for auto mode and explicit `maxOccurs: 1` a "strictly under `maxOccurs` (=1)" load is necessarily `usedChoiceOccurrences === 0`, and with the default `minOccurs: 1` that trips `xsd_choiceMinOccurs`, which *does* render `pick-error-message`. As written the assertion fails for those two modes' under-limit rows. It isolates `xsd_choiceMaxOccurs` passing from `xsd_choiceMinOccurs` masking only if the strictly-under rows use `minOccurs: 0`. Routed as a PROPOSED edit to QA mapping 4. Not a blocker (the fix is a one-line metadata change and AC4's at-limit rows are correct), but the mapping is wrong as written for 2 of 3 modes.

2. **(should-fix, routed)** The Architecture-reference `combinedValidation` snippet uses `if / else if` for the min/max guards, diverging from the approved feature architecture, whose data-flow snippet uses two independent `if`s and whose ADR-4 deliberately chose the list-building shape precisely so both rules can appear if the `minOccurs <= maxOccurs` invariant is ever relaxed. `else if` re-encodes the mutual-exclusivity assumption into control flow that ADR-4 moved out of it. Under well-formed metadata behavior is identical (the guards are provably mutually exclusive, per the feature's own review), so no acceptance criterion distinguishes them and this is not a blocker, but the story should implement the approved architecture's form rather than silently narrow it. Routed as a PROPOSED edit changing `else if` to `if` in the snippet.

3. **(nit)** AC9's mapping asserts the resolved `maxOccursTotal` message "contains the choice's own label (`{field}`)" but the AC9 fixture metadata does not set a `label`/`fieldOptions.label` on the `pick` choice. With no label, `{field}` resolves to the anchor field's fallback (name/path), so the assertion should either set an explicit choice label in the fixture and assert on that string, or assert only the negative (the message contains neither `branchA` nor `branchB`). A developer detail; the AC's product intent (option (a): names no branch) is unaffected.

Status set to `awaiting-approval`: no Open questions, no blockers, and both should-fixes are routed as `PROPOSED (adversarial review)` edits, so neither forces discussion (per `specs/README.md`'s mechanical status rule).

## Implementation notes

- Both `validation.ts` and `DynamicFormItemChoice.vue` follow the architecture as written: `xsd_choiceMaxOccurs` and `maxOccursTotal` registered as `() => false` stubs, `ruleParamNames` entries added, `combinedValidation` restructured into a list with two independent `if`s (not `else if`, per the accepted PROPOSED edit), and `maxOccursTotalBreach` pushed last.
- `maxOccursTotalBreach`'s loop reads `field.value!.choice!` and `branches[i].maxOccursTotal` / `occurrences.value[i].childOccurrences` without optional chaining (non-null assertions, matching this file's existing convention elsewhere, e.g. `usedChoiceOccurrences`'s `field.value!.choice![index].maxOccurs!`), rather than the data-flow snippet's `field.value?.choice ?? []` / `occurrences.value[i]?.childOccurrences ?? 0`. Both accesses are provably safe here (`DynamicFormItemChoice` only renders for a field with a real, non-empty `choice` array, and `occurrences` always seeds every branch index up front), and the optional-chaining form left two branches permanently uncovered (the "is nullish" side can never be exercised), which would have dropped branch coverage below baseline for no behavioral difference. Deviation recorded here since it changes the exact snippet shown in the architecture; no behavior change.
- AC9's fixture sets an explicit `fieldOptions.label` ('Pick Group') on the choice and asserts the message contains that label and neither branch name, per the accepted PROPOSED edit for finding 3.
- AC4's strictly-under fixtures for auto mode and explicit `maxOccurs: 1` use `minOccurs: 0`, per the accepted PROPOSED edit for finding 1.
- AC7's "structural read" test could not use an add-then-remove sequence through the `-add-choice-button` as the QA plan literally described: `canAddChoiceOccurrence`'s `branchCount < remainingSharedBudget` guard already disables "Add" once a branch reaches its `maxOccursTotal` cap (`4 < 4` is `false`), so clicking it at the cap is a no-op by design, the same structural enforcement the feature's own premise describes ("the add affordance already stops the UI at maxOccursTotal"). Split into two tests instead: one confirming the at-cap pass and the disabled "Add" button, and one loading a branch over the cap via `initialValues` and removing back down to the cap (removal has no budget guard), which still proves the guard reads `occurrences` structurally rather than caching a stale flag.
- AC10's whitebox assertion could not check `fieldContext.errors.value.length === 2` as the QA plan proposed: vee-validate's validator-array runner defaults `bails: true`, so only the first failing validator's message ever lands in `errors`, regardless of how many validators in the list fail. The test instead asserts `combinedValidationCount === 2` (both rules present in the underlying list) plus that the displayed message is the min-rule message and not the total-rule message, which is an equivalent proof of both presence and ordering given the bail behavior.
- The two analytics-suite add/remove scenarios (`maxOccursTotal backstop — render/recompute cost`) mount the branch below its cap (2 of a 4-cap) rather than at the cap, for the same "Add is disabled at the cap" reason above, so the add/remove cycle they exercise is actually reachable through the UI.

Verification: `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck` (after `pnpm --filter @bach.software/vue-dynamic-form build` to refresh `packages/core/dist` for `packages/element-plus`'s typecheck), and `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`) all pass; branch/statement/function coverage is at or above the pre-story baseline.

## Verification report

### Pipeline

- `pnpm run ci:test` (all packages): 24 test files, 601 tests passed in `packages/core` (up from 572 on the ST-01 baseline), 1 test passed in `packages/element-plus`.
- `pnpm run ci:lint`: clean, no errors in either package.
- `pnpm --filter @bach.software/vue-dynamic-form build`: succeeds, refreshes `dist` for `element-plus`'s typecheck.
- `pnpm run ci:typecheck`: clean, no errors in either package.
- `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`), compared against a baseline run of the same command on HEAD (the ST-01 commit, via a disposable `git worktree`, same lockfile so `node_modules` was reused): `packages/core` statements 97.04% → 97.07%, branches 93.12% → 93.20%, functions 96.55% → 96.55%, lines 97.04% → 97.07%. No drop on any metric; the new `maxOccursTotalBreach`/restructured `combinedValidation` code adds no uncovered lines (the file's only uncovered lines, `...14,531-534,630`, are pre-existing and untouched by this diff).

### Acceptance criteria

| AC | Description | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Auto-mode over-limit fails `xsd_choiceMaxOccurs` | pass | `xsd_choiceMaxOccurs > auto mode > fails when two branches hold values loaded via initialValues, over the default maxOccurs:1` |
| 2 | Explicit `maxOccurs:1` over-limit fails identically | pass | `xsd_choiceMaxOccurs > explicit selection — maxOccurs:1 > fails when two branches hold values loaded via initialValues, with no addChoiceOccurrence call` |
| 3 | Explicit `maxOccurs>1` batched-unit over-limit fails | pass | `xsd_choiceMaxOccurs > explicit selection — maxOccurs>1 (batched units) > fails when the batched choice-occurrence units exceed maxOccurs (5 branchA items + 1 branchB item = 4 units > 3)` |
| 4 | Exactly-at-limit and under-limit pass, all three modes | pass | The three `passes at exactly maxOccurs...and strictly under...` tests under each of the three `xsd_choiceMaxOccurs` mode describes; strictly-under rows use `minOccurs: 0` per the accepted finding-1 edit |
| 5 | `xsd_choiceMinOccurs`/`xsd_choiceMaxOccurs` mutually exclusive | pass | `mutual exclusivity with xsd_choiceMinOccurs > over-limit: only xsd_choiceMaxOccurs is present, never both` and `> under-min: only xsd_choiceMinOccurs is present, never both`, both asserting `combinedValidationCount(...) === 1` |
| 6 | `maxOccursTotal` fires, explicit `maxOccurs>1`, no other coverage | pass | `maxOccursTotal backstop > fires for a branch loaded past its own maxOccursTotal, explicit maxOccurs>1, where xsd_choiceMaxOccurs does not fire`, asserts message and `combinedValidationCount === 1` |
| 7 | At-cap passes; structural read | pass | `> passes at exactly maxOccursTotal (...)` (asserts disabled "Add" button) plus `> reads the count structurally: removing a breaching branch back down to the cap clears the error, no stale caching` (add-via-`initialValues`-then-remove); split into two tests per the recorded deviation, both intents (at-cap passes, structural not cached) verified |
| 8 | `maxOccursTotal` inert when undeclared | pass | `> never appears when no branch declares maxOccursTotal, regardless of raw count up to the shared budget` |
| 9 | First-offender cap reported, no branch named | pass | `> reports the first offending branch's cap in declaration order, naming no branch, when several branches breach at once`: asserts message contains `2` and the fixture's explicit choice label, and excludes `10`, `branchA`, `branchB` |
| 10 | Co-occurrence: occurrence rule wins displayed message | pass | `> is pushed last: a co-occurring xsd_choiceMinOccurs failure wins the displayed message, both remain present`: asserts `combinedValidationCount === 2` and the displayed message is the min message, not the total message (per the recorded `bails: true` deviation, equivalent proof to the QA plan's `errors.length`/ordering check) |
| 11 | Auto-mode double-error benign | pass | `> auto-mode double-error: both the branch's own xsd_maxOccurs and the choice-level maxOccursTotal fire, neither suppressing the other`: asserts both `pick.branchA-error-message` and `pick-error-message` render simultaneously |
| 12 | Timing mirrors min-rule (no eager error on mount) | pass | `timing mirrors xsd_choiceMinOccurs (no eager error on mount) > auto-mode over-limit...` and `> maxOccursTotal over-limit...`, both asserting no error pre-submit, error post-submit |
| 13 | `{max}`/`{0}` placeholders resolve for both rules | pass | `xsd_choiceMaxOccurs > custom error messages` (`it.each`, positional and named) plus its `generateMessage` fallback test, and `maxOccursTotal backstop > custom error messages` (`it.each`, positional and named) |

Edge cases: `singleChild` fast path still bypasses both new rules (`combinedValidation` is `undefined`), disabled choice (`maxOccurs:0`) stays inert for `maxOccursTotal` (`combinedValidationCount === 0`), and a repeatable choice nested inside an array item fires `maxOccursTotal` at the nested path (`projectContacts[0].certifications-error-message`) — all three present and passing.

Also directly verified in the test-run output: the FEAT-001 two-branch-load case (AC1, `usedChoiceOccurrences === 2 > 1`), the batching case (AC3/AC6, `ceil(5/2)+1=3+1=4>3` and separately `ceil(5/3)=2<=3` with `childOccurrences=5>4`), min/max mutual exclusivity (AC5), and all of ST-01's committed array tests (`DynamicFormItemArray.validation.test.ts`, `DynamicFormItemArray.analytics.test.ts`) pass unmodified (confirmed both files have zero diff against HEAD).

### Prototype comparison

Not applicable. This story has no design phase and no visual surface (confirmed against the feature's "Design (feature level): Skipped" and this story's own "Design reference: Not applicable"); it reuses the existing `fieldContext.errorMessage`/`-choice`/`-choice-array` slot mechanics `xsd_choiceMinOccurs` already exercises, with no new slot, prop, or component. No prototype anchors exist to compare against, and no visual drift is possible since no rendering path changed.

### Compliance findings

- `specs/components.md` updated: both new rule names (`xsd_choiceMaxOccurs`, `maxOccursTotal`) added to the "Validation rules" list, both new `messages` keys documented, matching the architecture's obligation for this story.
- Changeset present: `.changeset/choice-max-occurs-and-total.md`, bump type `minor`, matching the architecture's re-confirmed `minor` verdict.
- No new undocumented exports; the two new `ValidationRule`/`ruleParamNames` entries stay internal as designed, the only new public surface is the two optional `DynamicFormSettings.messages` keys, already documented.
- No spec/process references found in code comments or test names across the diff (`validation.ts`, `DynamicFormItemChoice.vue`, the three touched test files).
- No em dashes in prose sections of this story spec's own additions. However, the diff does introduce 9 em dashes in new code: one in a code comment (`DynamicFormItemChoice.analytics.test.ts`) and 8 in new `describe`/comment strings across the two `.vue`/`.ts` test files (e.g. `'maxOccursTotal backstop — render/recompute cost'`, `// XSD: choiceMaxOccurs — maximum number of...`). This repeats a pre-existing convention already pervasive in these files before this story (dozens of pre-existing em-dash-separated `describe` titles), and ST-01's own diff (the immediately preceding, already-merged story in this same feature) also introduced two, so it is not a new convention this story invented, but CLAUDE.md's writing-style rule is unconditional ("any text you write") and these are new lines this story wrote. Not a blocker (cosmetic only, zero functional impact, matches surrounding file style), but noted so a follow-up cleanup pass (across the whole file, not just this diff) can be considered; not re-litigating ST-01's own two instances here since that story is already merged.
- camelCase followed throughout (no kebab-case identifiers introduced).
- No silent overrides of feature-level decisions: the two accepted PROPOSED edits (two independent `if`s not `else if`; AC9's explicit label) are implemented exactly as accepted in the adversarial review section, and the non-null-assertion deviation is recorded with a sound safety argument (checked directly against `occurrences`' upfront seeding and the engine's choice-classification precondition) rather than silently diverging from the architecture snippet.

### Deviation judgments (developer's four recorded items)

1. **Non-null assertions in `maxOccursTotalBreach` instead of optional chaining.** Verified safe: `field.value` is the required `fieldMetadata` prop (never undefined in practice for a mounted item), `DynamicFormItemChoice` only renders when `choice` is non-empty per the engine's own shape classification, and the `occurrences` computed explicitly seeds `_occurrences[i]` for every branch index up front before any pass runs, so `occurrences.value[i]` is always defined for `i < branches.length`. The guard's behavior matches the architecture exactly: first offending branch in declaration order, raw `childOccurrences` count (not choice-occurrence units), `> cap` not `>= cap`, and inert (returns `undefined`) when no branch declares `maxOccursTotal`. Accepted.
2. **AC9 explicit label, no branch name in the message.** Accepted per the story's own recorded finding-3 edit; the test fixture sets `fieldOptions.label: 'Pick Group'` and asserts the message contains it while excluding both branch names. Matches the intent of AC9 and the DECIDED option (a) resolution.
3. **AC7 split into at-cap/disabled-button and load-over-cap/remove-back-down.** Judged correct: `canAddChoiceOccurrence`'s existing guard genuinely disables "Add" at the cap, so an add-then-remove sequence through that button is unreachable by construction; the two-test split still proves both AC7 claims (at-cap passes; the guard reads structurally, not a cached flag) via a reachable path (load-over-cap via `initialValues`, then remove).
4. **AC10 uses `combinedValidationCount === 2` plus displayed-message assertion instead of `errors.length === 2`.** Verified against real vee-validate behavior: `bails: true` is the library default and no `bails: false` configuration exists anywhere in this codebase, so `errors` would only ever contain the first failing validator's message regardless of how many rules are in the list; the substituted assertion (list length via the internal `combinedValidation` computed, plus the displayed message content) proves the same two claims the AC requires (both rules present, occurrence rule wins display) and is not a weaker check.

All four deviations are judged sound: none narrows what the acceptance criteria actually verify.

### Overall verdict: pass-with-notes

All 13 acceptance criteria and all three edge cases pass with direct evidence. Pipeline and coverage are clean. Process compliance holds except for the em-dash nit noted above, which is cosmetic, matches pre-existing file convention, and does not warrant blocking the story. Status set to `done`.

Jeroen: please link the PR in this story's `pr` frontmatter field once opened. This is the last story of FEAT-005 (ST-03, docs, is still open), so the feature itself is not yet ready to move to `done`.
