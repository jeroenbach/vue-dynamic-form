---
"@bach.software/vue-dynamic-form": minor
---

Improved defineMetadata() typing, reactive parent–child computedProps, partial form validation, auto-add first array item, and per-type array/choice slots.

## New features

- **`slotProperties` in `defineMetadata()`** — `slotProps` is no longer a separate Vue prop on the  
  template component; pass your slot properties as the third generic of `defineMetadata()` instead,
  where they are exposed through the `Attributes` slot as `slotProperties`. ⚠️ **Breaking for existing  
  template components**: remove the hand-crafted `Props` interface from your template component and  
  add it as a generic argument to `defineMetadata()`.
- **`childFields` in `computedProps`** — `computedProps` functions now receive a `childFields` ref  
  as their third argument, enabling parent fields to react to their children's computed state (e.g.  
  hiding a parent when all children are hidden)
- **`validatePartial()`** — new helper for validating a subset of form fields without triggering  
  full-form validation; names/typing of related helpers improved
- **Auto-add first array item** — array fields with `minOccurs > 0` now automatically insert the  
  first occurrence on mount; opt out per-field with `addFirstItem: false`
- **Per-type array/choice slots** — each field type can now define its own `{type}-array` and  
  `{type}-choice` slots in `DynamicFormTemplate`, allowing per-type customisation of array and choice  
  rendering without overriding the global slot
