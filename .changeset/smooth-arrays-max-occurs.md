---
"@bach.software/vue-dynamic-form": minor
---

Add `xsd_maxOccurs`, a new globally-registered validation rule that fails when an array field (`DynamicFormItemArray`) already holds more raw items than its declared `maxOccurs`, for example when `initialValues`, an API response, or an import loads data over the limit. Previously an over-limit array only had its "Add" affordance disabled; the state itself never surfaced as a validation error.

Mirrors `xsd_minOccurs` exactly in wiring and timing: pushed into the array's existing `combinedValidation` whenever the array is not disabled (`maxOccurs !== 0`), placed after the `xsd_minOccurs` push so a field failing both shows the min message first. Counts raw item count including empty placeholders, the same quantity the "Add" affordance's cap already governs, not filled values. The error surfaces on first interaction or on submit, never eagerly on mount, matching every other occurrence rule.

Adds an optional `messages.maxOccurs` key to `DynamicFormSettings` (placeholders `{field}`, `{0}` or `{max}`), resolved through the existing `settings.messages` → vee-validate `generateMessage` → rule default priority chain.

Additive and inert until an array is loaded over its declared `maxOccurs`; existing forms are unaffected.
