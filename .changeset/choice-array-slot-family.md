---
"@bach.software/vue-dynamic-form": minor
---

Split the choice template slots by occurrence count: a single choice (`maxOccurs: 1`) keeps rendering through `*-choice` / `default-choice`, while a repeatable choice (`maxOccurs > 1`) now renders through the new `*-choice-array` / `default-choice-array` slots (same `ChoiceAttributes` slot props). Backwards compatible: a template without any `-choice-array` slot falls back to its `*-choice` / `default-choice` slots for repeatable choices, exactly as before, so the new family is a pure opt-in specialization.
