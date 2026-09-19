---
"@bach.software/vue-dynamic-form": minor
---

Added `globalIndex` to the `*-choice-array-item` / `default-choice-array-item` slot props for a repeatable explicit choice (`maxOccurs > 1`). It reports each occurrence's zero-based position across every branch's active occurrences (not just its own branch), in the same grouped order `activeChoiceOccurrences` reports them, so a template can render a continuous "item N of M" badge. Renumbers live on removal; never stored in form values. `undefined` on any other field. Additive, no existing behaviour changes.
