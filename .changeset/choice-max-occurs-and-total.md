---
"@bach.software/vue-dynamic-form": minor
---

Add `xsd_choiceMaxOccurs` and `maxOccursTotal`, two new globally-registered validation rules that fail when a choice field (`DynamicFormItemChoice`) already holds more occurrences than its declared `maxOccurs`, or a branch already holds more raw items than its own opt-in `maxOccursTotal` cap, for example when `initialValues`, an API response, or an import loads data over the limit. Previously both over-limit states only had their "Add" affordance disabled; the state itself never surfaced as a validation error.

`xsd_choiceMaxOccurs` mirrors `xsd_choiceMinOccurs` exactly in wiring and timing, comparing `usedChoiceOccurrences` (choice-occurrence units, not raw item count) against `maxOccurs`. The choice's `combinedValidation` was restructured from an early-return into a list so both the min and max rules can coexist if `minOccurs > maxOccurs` is ever declared; under well-formed metadata the two remain mutually exclusive.

`maxOccursTotal` (deliberately not `xsd_`-prefixed, since it has no XSD equivalent) is a choice-level aggregate: it fires when any branch's raw occurrence count exceeds that branch's own opt-in `maxOccursTotal` cap. It is pushed last into the same validation list, so a co-occurring choice-occurrence failure wins the displayed message. It reports the first offending branch's cap in declaration order and never names the offending branch.

Adds optional `messages.choiceMaxOccurs` and `messages.maxOccursTotal` keys to `DynamicFormSettings` (placeholders `{field}`, `{0}` or `{max}`), resolved through the existing `settings.messages` → vee-validate `generateMessage` → rule default priority chain.

Additive and inert until a choice is loaded over its declared `maxOccurs`, or a branch over its declared `maxOccursTotal`; existing forms are unaffected.
