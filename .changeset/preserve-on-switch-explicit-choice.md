---
"@bach.software/vue-dynamic-form": minor
---

Add preserve-on-switch for `maxOccurs: 1` explicit choice selection (see `explicitChoiceSelection`): a new opt-in `FieldMetadata` flag, `preserveOnSwitch`, deep-clones a branch's current values into an ephemeral, instance-local stash before it is cleared on switch-away, and restores them via `setFieldValue` on switch-back, with fresh touched/validation state on the restored fields. The stash is never written to form `values`. Defaulted off: existing choices, and `explicitChoiceSelection` choices that do not opt in, keep the existing clear-on-switch behaviour unchanged.
