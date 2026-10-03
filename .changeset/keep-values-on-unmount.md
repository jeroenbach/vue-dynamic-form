---
"@bach.software/vue-dynamic-form": minor
---

Fix `keepValuesOnUnmount` (and the per-field `fieldOptions.keepValueOnUnmount`) so it actually works: unmounting a field no longer unconditionally clears its value, which previously overwrote whatever vee-validate had decided to keep. Attribute fields (a field's `attributes` entries) still always clear on unmount, since they are conditionally mounted based on whether their parent has a value. Adds an optional `partOfAttributeField` prop to the publicly exported `DynamicFormItemProps`, used internally to mark those attribute fields.
