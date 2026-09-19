---
"@bach.software/vue-dynamic-form": minor
---

Extend explicit choice selection (see `explicitChoiceSelection`) to `maxOccurs > 1` choices: `addChoiceOccurrence` now pushes a real occurrence into a branch's own field array, `removeChoiceOccurrence(branchKey, index)` removes a specific occurrence, `canAddChoiceOccurrence` respects both a branch's own `maxOccurs` and the choice's shared occurrence budget, and `activeChoiceOccurrences` lists every active occurrence across branches (grouped by branch declaration order, then by index within branch). Occurrences render through new `*-choice-array-item` / `default-choice-array-item` template slots, which receive a `ChoiceArrayItemAttributes` (`ItemAttributes` plus `removeItem` and `branchKey`), mirroring the existing `*-array-item` slot. Additive and opt-in: existing choices are unaffected.
