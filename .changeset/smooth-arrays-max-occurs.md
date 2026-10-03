---
"@bach.software/vue-dynamic-form": minor
---

Add `xsd_maxOccurs`, a new globally-registered validation rule that fails when an array field (`DynamicFormItemArray`) already holds more raw items than its declared `maxOccurs`, for example when `initialValues`, an API response, or an import loads data over the limit. Previously an over-limit array only had its "Add" affordance disabled; the state itself never surfaced as a validation error.

The rule counts raw items including empty placeholders, the same quantity the "Add" affordance's cap already governs, so the rule and the UI never disagree. A field failing both the minimum and the maximum shows the minimum message first. The error surfaces on first interaction or on submit, never eagerly on mount, matching every other occurrence rule. Metadata declaring `minOccurs` greater than `maxOccurs` stays silently tolerated, as before, instead of producing an error the form can never resolve.

Adds an optional `messages.maxOccurs` key to `DynamicFormSettings` (placeholders `{field}`, `{0}` or `{max}`), resolved through the existing `settings.messages` → vee-validate `generateMessage` → rule default priority chain.

Additive and inert until an array is loaded over its declared `maxOccurs`; existing forms are unaffected.
