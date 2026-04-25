# Step 4: Dynamic Fields

`computedProps` makes fields react to form state without re-rendering the entire component tree. Each function runs inside a `computed()` in the component that owns the field, so reactivity is surgical and efficient.

## Basic Syntax

```ts
{
  name: 'discount',
  type: 'text',
  fieldOptions: { label: 'Discount code' },
  computedProps: [
    (field, value, childFields) => {
      // field       — mutable copy of this field's metadata
      // value       — Ref<T> pointing to this field's current value
      // childFields — Ref<FieldMetadata[]> of direct children's latest computed fields
    }
  ]
}
```

Write to `field` to change properties. Read from `value` to subscribe to the field's own value. Read from `childFields` to subscribe to changes in children's computed state. All three trigger the computed to re-run whenever their reactive dependencies change.

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

## Reacting to Children's Computed Field State

The `childFields` parameter gives a parent field a reactive window into its direct children's latest computed metadata — their `hidden`, `disabled`, `type`, extended properties, and so on. Reading `childFields.value` inside a function subscribes the parent to any meaningful change in a child's computed state.

This is distinct from `computeOnChildValueChange`, which reacts to a child's **form value** changing. `childFields` reacts to changes in a child's **computed metadata**, such as a sibling becoming hidden or disabled through its own `computedProps`.

A common use case is hiding a group when every one of its children is already hidden:

```ts
{
  name: 'addressGroup',
  type: 'heading',
  computedProps: [
    (field, _value, childFields) => {
      if (childFields.value.length > 0 && childFields.value.every(c => c.hidden))
        field.hidden = true;
    }
  ],
  children: [
    {
      name: 'street',
      type: 'text',
      minOccurs: 0,
      computedProps: [(f, v) => { if (!v.value) f.hidden = true; }],
    },
    {
      name: 'city',
      type: 'text',
      minOccurs: 0,
      computedProps: [(f, v) => { if (!v.value) f.hidden = true; }],
    },
  ],
}
```

The parent re-computes only when a child's mutable properties actually change, keeping reactivity efficient.

### childFields in Array Fields

For array fields, `childFields.value` contains the computed fields of the rendered **occurrences** (`people[0]`, `people[1]`, …), not the child fields inside them. For changes to propagate from a grandchild all the way to the outer array field, each intermediate level must also read `childFields.value` so it re-emits when its own computed state changes.

Use `field.path` to distinguish the outer array field from its occurrences — they share the same `computedProps` definition:

```ts
{
  name: 'people',
  type: 'heading',
  maxOccurs: 3,
  computedProps: [
    // Runs for each occurrence: disable it when any of its children are disabled
    (f, _v, childFields) => {
      if (f.path !== 'people' && childFields.value.some(c => c.disabled))
        f.disabled = true;
    },
    // Runs for the outer array field: react to each occurrence's computed state
    (f, _v, childFields) => {
      if (f.path === 'people') {
        const disabledCount = childFields.value.filter(c => c.disabled).length;
        if (disabledCount)
          f.description = disabledCount > 0
            ? `${disabledCount} occurrence(s) are currently disabled`
            : undefined;
      }
    },
  ],
  children: [
    { name: 'firstName', type: 'text' },
    { name: 'lastName',  type: 'text' },
  ],
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
| `name`, `path`, `parent` | Always present and consistent — use for reference only |
| `children`, `choice`, `attributes` | Structural; changing them mid-render is not supported |
| `fieldOptions` | vee-validate doesn't react to these changes |
| `maxOccurs` | Changing array length mid-render is not supported |
| `computedProps` | Cannot be changed recursively |
| `isComplexType`, `computeOnChildValueChange` | Not read reactively after setup; changing them has no effect |

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
