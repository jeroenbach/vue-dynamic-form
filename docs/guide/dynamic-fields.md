# Step 4: Dynamic Fields

`computedProps` makes fields react to form state without re-rendering the entire component tree. Each function runs inside a `computed()` in the component that owns the field, so reactivity is surgical and efficient.

## Basic Syntax

```ts
{
  name: 'discount',
  type: 'text',
  fieldOptions: { label: 'Discount code' },
  computedProps: [
    (field, value) => {
      // field  — mutable copy of this field's metadata
      // value  — Ref<T> pointing to this field's current value
    }
  ]
}
```

Write to `field` to change properties. Read from `value` to subscribe to the field's own value. Both trigger the computed to re-run whenever their reactive dependencies change.

## Showing and Hiding a Field

Setting `minOccurs` or `maxOccurs` to `0` disables the field. Combine that with a reactive read of another field:

```ts
import { useFieldValue } from '@bach.software/vue-dynamic-form';

{
  name: 'vatNumber',
  type: 'text',
  fieldOptions: { label: 'VAT number' },
  computedProps: [
    (field) => {
      const accountType = useFieldValue('accountType');
      // Show only when account type is 'business'
      field.minOccurs = accountType.value === 'business' ? 1 : 0;
      field.maxOccurs = accountType.value === 'business' ? 1 : 0;
    }
  ]
}
```

Setting `maxOccurs: 0` disables the field and all of its children in one go.

## Changing Select Options Dynamically

```ts
{
  name: 'city',
  type: 'select',
  fieldOptions: { label: 'City' },
  computedProps: [
    (field) => {
      const country = useFieldValue('country');
      field.options = country.value === 'nl'
        ? [{ key: 'ams', value: 'Amsterdam' }, { key: 'rtd', value: 'Rotterdam' }]
        : [{ key: 'ber', value: 'Berlin' }];
    }
  ]
}
```

Because `country.value` is read inside the function, the computed re-runs every time the country field changes.

## Reacting to the Field's Own Value

Use the `value` parameter to subscribe to this field's own current value:

```ts
{
  name: 'agreedToTerms',
  type: 'checkbox',
  fieldOptions: { label: 'I agree to the terms' },
  computedProps: [
    (field, value) => {
      // Changes description depending on checked state
      field.description = value.value
        ? 'Thank you for agreeing.'
        : 'You must agree before continuing.';
    }
  ]
}
```

If you never read `value.value`, changes to this field will not re-trigger the function.

## Reacting to Child Value Changes

By default, `computedProps` does not re-run when a child field changes. Enable tracking of child changes with `computeOnChildValueChange`:

```ts
{
  name: 'shippingAddress',
  computeOnChildValueChange: true,
  children: [
    { name: 'country', type: 'select', ... },
    { name: 'city',    type: 'select', ... },
  ],
  computedProps: [
    (field) => {
      const address = useFieldValue('shippingAddress');
      field.description = address.value?.country
        ? `Delivering to ${address.value.country}`
        : 'Enter your address above';
    }
  ]
}
```

## Multiple Functions in computedProps

You can split concerns across multiple functions. They run in order, each receiving the already-mutated `field` from the previous step:

```ts
computedProps: [
  (field) => {
    // Step 1: set visibility
    const role = useFieldValue('role');
    field.maxOccurs = role.value === 'admin' ? 1 : 0;
  },
  (field) => {
    // Step 2: set description (only meaningful if visible)
    field.description = 'Only admins can edit this field.';
  }
]
```

## What You Can and Cannot Change

**Writable in computedProps:**

- All extended properties (`options`, `disabled`, `description`, `fullWidth`, …)
- `minOccurs` — changes whether the field is required
- `type` — changes the rendered slot
- `restriction` — changes validation rules

**Read-only in computedProps (cannot be mutated):**

| Property | Reason |
|----------|---------|
| `name`, `path` | Always present and consistent — use for reference only |
| `children`, `choice`, `attributes` | Structural; changing them mid-render is not supported |
| `fieldOptions` | vee-validate doesn't react to these changes |
| `maxOccurs` | Changing array length mid-render is not supported |
| `computedProps` | Cannot be changed recursively |

## Dynamic Labels

Since `fieldOptions.label` is read-only in `computedProps`, pass a `Ref` from the start:

```ts
const labelRef = ref('Quantity');

{
  name: 'qty',
  type: 'text',
  fieldOptions: { label: labelRef },
}

// Update it at any time:
labelRef.value = 'Number of licences';
```

## Guarding Against Infinite Loops

`computedProps` must be idempotent: the same input must always produce the same output. If a function writes a value that causes the computed to re-run and write again, the library detects the loop and throws:

```
[DynamicFormItem] Possible infinite loop detected in computedProps for field "..."
```

This is almost always caused by writing to `value` (the field's own form value) inside `computedProps`. Mutate `field` properties — not the form value — in these functions.

---

Continue to [Step 5: Advanced Fields](/guide/advanced-fields) to learn about groups, arrays, and choices.
