---
"@bach.software/vue-dynamic-form": minor
---

Add `explicitChoiceSelection` field metadata flag and the `addChoiceOccurrence` / `removeChoiceOccurrence` / `canAddChoiceOccurrence` / `activeChoiceOccurrences` slot props on the `-choice` template slot, for `maxOccurs: 1` choices. This lets a template author explicitly mark a choice branch as selected before any of its fields hold a value, replacing the hidden-phantom-field workaround. Opt-in and additive: existing choices with the flag absent or `false` render exactly as before.
