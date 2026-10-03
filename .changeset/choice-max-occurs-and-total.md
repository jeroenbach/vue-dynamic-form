---
"@bach.software/vue-dynamic-form": minor
---

Add `xsd_choiceMaxOccurs` and `vdf_maxOccursTotal`, two new globally-registered validation rules that fail when a choice field (`DynamicFormItemChoice`) already holds more occurrences than its declared `maxOccurs`, or a branch already holds more raw items than its own opt-in `maxOccursTotal` cap, for example when `initialValues`, an API response, or an import loads data over the limit. Previously both over-limit states only had their "Add" affordance disabled; the state itself never surfaced as a validation error.

- `xsd_choiceMaxOccurs` compares the choice's used occurrence units (not raw item count) against `maxOccurs`, in both automatic and explicit selection modes. When it fails together with the minimum rule, the minimum message wins the displayed error.
- `vdf_maxOccursTotal` is a non-XSD extension, carrying the library's `vdf_` prefix instead of `xsd_` (the prefix also keeps the shared global vee-validate rule registry free of collisions with consumer-defined rules). It fires when any branch's raw occurrence count exceeds that branch's own `maxOccursTotal`, reports the first offending branch's cap in declaration order, and never names the offending branch. A single-branch choice reports through the branch's own `xsd_maxOccurs` error instead.
- A branch's `maxOccursTotal` can only tighten its declared `maxOccurs`, never widen it, in every selection mode.
- Data loaded over a choice's shared occurrence budget no longer punishes innocent branches: every branch holding values stays editable and never shows a shifting budget-relative (or negative) cap error, so the choice-level error can always be resolved through the UI.

Adds optional `messages.choiceMaxOccurs` and `messages.maxOccursTotal` keys to `DynamicFormSettings` (placeholders `{field}`, `{0}` or `{max}`), resolved through the existing `settings.messages` → vee-validate `generateMessage` → rule default priority chain.

Additive and inert until a choice is loaded over its declared `maxOccurs`, or a branch over its declared `maxOccursTotal`; existing forms are unaffected.
