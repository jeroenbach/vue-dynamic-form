---
"@bach.software/vue-dynamic-form": minor
---

Split the choice template slots by occurrence count: a single choice (`maxOccurs: 1`) keeps rendering through `*-choice` / `default-choice`, while a repeatable choice (`maxOccurs > 1`) now renders through the new `*-choice-array` / `default-choice-array` slots (same `ChoiceAttributes` slot props). Breaking for templates that render repeatable choices: move that handling from your `-choice` slot into a `-choice-array` slot; a `maxOccurs`-based branch inside one slot is no longer needed.
