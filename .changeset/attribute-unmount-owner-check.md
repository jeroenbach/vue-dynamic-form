---
"@bach.software/vue-dynamic-form": minor
---

Refine attribute-field unmount behaviour: an attribute (a field's `attributes` entries) now only clears unconditionally on unmount when its owning field's own value is gone. When the owning field still has a value (for example a `v-if`-hidden subtree, or a whole-form unmount) the attribute follows the same `keepValuesOnUnmount` / `fieldOptions.keepValueOnUnmount` rules as any other field, instead of always clearing. Adds an optional `attributeOwnerHasValue` prop to the publicly exported `DynamicFormItemProps`, used internally alongside `partOfAttributeField` to check the owner's current value at unmount time.
