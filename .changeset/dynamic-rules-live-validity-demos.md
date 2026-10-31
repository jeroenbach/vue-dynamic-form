---
"@bach.software/vue-dynamic-form": patch
---

Two new example test cases make the latest validation-engine capabilities easy to try out in the Storybook playground: `dynamicRulesTestCase` shows `computedProps` swapping a field's `restriction` (a per-country postal code pattern) and `validation` (a VAT rule that only applies to business orders) at runtime, and `liveValidityTestCase` shows the form-level `meta.valid` flipping live, with no submit, as a cross-field group rule is satisfied or broken.
