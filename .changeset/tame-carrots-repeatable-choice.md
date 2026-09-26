---
"@bach.software/vue-dynamic-form": minor
---

Extend explicit choice selection (see `explicitChoiceSelection`) to `maxOccurs > 1` choices: `addChoiceOccurrence` pushes a real occurrence into a branch's own field array, `removeChoiceOccurrence(branchKey, index)` removes a specific occurrence, and `activeChoiceOccurrences` lists every active occurrence across branches (grouped by branch declaration order, then by index within branch). Occurrences render through new `*-choice-array-item` / `default-choice-array-item` template slots, which receive a `ChoiceArrayItemAttributes` (`ItemAttributes` plus `branchKey`), mirroring the existing `*-array-item` slot. A template without any `-choice-array-item` slot falls back to its `*-array-item` / `default-array-item` slots, and the occurrence's `addItem` / `canAddItems` are wired to the choice primitives (add another occurrence of the same branch, governed by the shared budget), so a generic array-item card renders occurrences correctly out of the box.

Occurrence math follows XSD semantics, matching the library's existing automatic-choice mode: a branch's own `maxOccurs` is the batch size for that branch inside the choice (every group of up to that many raw items consumes one shared choice slot), not an independent total. `canAddChoiceOccurrence` is governed by the shared choice-level budget at that batch size, and `usedChoiceOccurrences` (new slot prop on `ChoiceAttributes`) reports consumption in choice-occurrence units, the same unit `xsd_choiceMinOccurs` validates in.

For a per-kind ceiling with no XSD equivalent ("at most 3 of this kind" regardless of the shared budget), set the new opt-in `maxOccursTotal` on a branch: a hard cap on that branch's own raw item count across the whole choice, honoured in both explicit and automatic mode.

Additive and opt-in: existing choices are unaffected.
