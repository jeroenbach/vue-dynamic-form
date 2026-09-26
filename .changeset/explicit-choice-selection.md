---
"@bach.software/vue-dynamic-form": minor
---

Let a template show a selector first ("what kind of data do you want to enter?") and reveal a choice branch's fields only after the user picks it, instead of requiring at least one field to already hold a value before the branch counts as selected. This replaces the hidden-phantom-field workaround previously needed to fake a selection.

Add the opt-in `explicitChoiceSelection` field metadata flag, plus the slot props to drive it (`addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`, `usedChoiceOccurrences`). What you can now build:

- **Pick one, then fill in** (`maxOccurs: 1`): mark a branch selected before any of its fields hold a value, driven from the `-choice` slot.
- **Add several, each one of several kinds** (`maxOccurs > 1`): add and remove occurrences of chosen branches, rendered through new `*-choice-array` / `*-choice-array-item` slots. Both fall back to the existing `*-choice` / `*-array-item` slots when a template doesn't define them, so a generic array-item card renders occurrences out of the box.
- **Keep data across a switch** (opt-in `preserveOnSwitch`): when the user switches away from a `maxOccurs: 1` branch and back, restore what they had entered instead of clearing it. Values are stashed in an ephemeral, instance-local clone that is never written to form `values`.
- **Per-kind ceiling** (opt-in `maxOccursTotal`): cap a single branch's occurrence count independently of the shared choice budget, a "at most 3 of this kind" limit with no XSD equivalent.

Occurrence counting follows the same XSD-faithful rule the library already uses for automatic choice mode: a branch's own `maxOccurs` is the batch size within the shared choice budget (every group of up to that many raw items consumes one shared slot), not an independent total, and it is validated in the same choice-occurrence units as `xsd_choiceMinOccurs`.

Additive and opt-in throughout: existing choices with none of these flags set render exactly as before.
