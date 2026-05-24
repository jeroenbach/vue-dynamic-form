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

To react to a *different* field's value, call `useFieldValue` in `<script setup>` and close over the resulting `Ref` — do not call it inside the `computedProps` function itself, as `inject()` is not available inside a `computed()` callback.

## Disabling or Hiding a Field

`maxOccurs` is not writable in `computedProps`, so you cannot disable a field that way dynamically. Instead, declare a `disabled` (or `hidden`) property in your extended metadata and handle it in your template:

```ts
// MyFormTemplate.ts
export const metadata = defineMetadata<
  { text: string },
  { disabled?: boolean; hidden?: boolean }
>();
```

Then set it reactively in `computedProps`:

```vue
<script setup lang="ts">
import { useFieldValue } from 'vee-validate';

const accountType = useFieldValue('accountType');

const fields: Metadata[] = [
  {
    name: 'vatNumber',
    type: 'text',
    fieldOptions: { label: 'VAT number' },
    computedProps: [
      (field) => {
        if (accountType.value !== 'business') field.disabled = true;
      }
    ]
  }
]
</script>
```

And in your template, use the extended property to conditionally disable or hide the input:

```vue
<template #text-input="{ fieldMetadata, fieldContext: { value, handleChange } }">
  <input :disabled="fieldMetadata.disabled" :value="value.value" @change="handleChange" />
</template>
```

## Changing Select Options Dynamically

```vue
<script setup lang="ts">
import { useFieldValue } from 'vee-validate';

const country = useFieldValue('country');

const fields: Metadata[] = [
  {
    name: 'city',
    type: 'select',
    fieldOptions: { label: 'City' },
    computedProps: [
      (field) => {
        field.options = country.value === 'nl'
          ? [{ key: 'ams', value: 'Amsterdam' }, { key: 'rtd', value: 'Rotterdam' }]
          : [{ key: 'ber', value: 'Berlin' }];
      }
    ]
  }
]
</script>
```

Because `country.value` is read inside the function, the computed re-runs every time the country field changes.

## Loading Options from an External Source

When options come from an API, keep the loaded data outside the form — in a prop or a reactive store — and emit a request event when a value changes that should trigger a new load.

The form component emits `loadOptions` and receives the results back as a prop:

```vue
<!-- MyFormContext.vue -->
<script setup lang="ts">
import { reactive } from 'vue';
import MyForm from './MyForm.vue';

const optionStore = reactive({
  industry: [] as { key: string; value: string }[],
  teamSize: [] as { key: string; value: string }[],
});

function loadOptions(name: 'industry' | 'teamSize', params?: { industry?: string }) {
  if (name === 'industry') {
    // fetch from API and populate
    optionStore.industry = [
      { key: 'saas', value: 'SaaS' },
      { key: 'retail', value: 'Retail' },
    ];
  }
  if (name === 'teamSize') {
    // use params to fetch options filtered by the selected industry
    optionStore.teamSize = params?.industry === 'saas'
      ? [{ key: 'small', value: '1–50' }, { key: 'large', value: '51–500' }]
      : [{ key: 'small', value: '1–20' }, { key: 'large', value: '21–200' }];
  }
}
</script>

<template>
  <MyForm :option-store="optionStore" @load-options="loadOptions" />
</template>
```

Inside the form component, emit the load request when a value changes and read the options directly from the prop in `computedProps`:

```vue
<!-- MyForm.vue -->
<script setup lang="ts">
import type { Metadata } from './MyFormTemplate';

const props = defineProps<{
  optionStore: { industry: { key: string; value: string }[]; teamSize: { key: string; value: string }[] }
}>();

const emit = defineEmits<{
  loadOptions: [name: 'industry' | 'teamSize', params?: { industry?: string }]
}>();

// Request initial options on mount
onMounted(() => emit('loadOptions', 'industry'));

const fields: Metadata[] = [
  {
    name: 'industry',
    type: 'select',
    fieldOptions: { label: 'Industry' },
    computedProps: [
      (field, value) => {
        field.options = props.optionStore.industry;
        // when industry changes, request teamSize options filtered by the new value
        emit('loadOptions', 'teamSize', { industry: value.value as string });
      }
    ],
  },
  {
    name: 'teamSize',
    type: 'select',
    fieldOptions: { label: 'Team size' },
    computedProps: [
      (field) => {
        field.options = props.optionStore.teamSize;
      }
    ],
  },
]
</script>
```

Because `props.optionStore.teamSize` is read inside `computedProps`, Vue tracks it as a reactive dependency — when the parent updates the store after the API responds, the options update automatically without any extra wiring.

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

## Updating the Field's Own Value

You can also write to `value.value` to programmatically set the field's value. A common use case is normalising or transforming input — for example, trimming whitespace or uppercasing a code:

```ts
{
  name: 'couponCode',
  type: 'text',
  fieldOptions: { label: 'Coupon code' },
  computedProps: [
    (_field, value) => {
      if (typeof value.value === 'string')
        value.value = value.value.toUpperCase();
    }
  ]
}
```

Make sure the transform is idempotent — writing `value.value` triggers a re-run, so a non-idempotent write will cause an infinite loop. The library detects this and throws after a set number of synchronous re-runs.

## Reacting to Child Value Changes

By default, `computedProps` does not re-run when a child field changes. Enable tracking of child changes with `computeOnChildValueChange`:

```vue
<script setup lang="ts">
import { useFieldValue } from 'vee-validate';

const address = useFieldValue('shippingAddress');

const fields: Metadata[] = [
  {
    name: 'shippingAddress',
    computeOnChildValueChange: true,
    children: [
      { name: 'country', type: 'select', ... },
      { name: 'city',    type: 'select', ... },
    ],
    computedProps: [
      (field) => {
        field.description = address.value?.country
          ? `Delivering to ${address.value.country}`
          : 'Enter your address above';
      }
    ]
  }
]
</script>
```

## Reacting to Children's Computed Field State

The `childFields` parameter gives a parent field a reactive window into its direct children's latest computed metadata — their `hidden`, `disabled`, `type`, extended properties, and so on. Reading `childFields.value` inside a function subscribes the parent to any meaningful change in a child's computed state.

This is distinct from `computeOnChildValueChange`, which reacts to a child's **form value** changing. `childFields` reacts to changes in a child's **computed metadata**, such as a sibling becoming hidden or disabled through its own `computedProps`.

A common use case is hiding a group when every one of its children is hidden. Here the children are hidden based on an external `inEditMode` ref, and the parent collapses itself automatically when all of them are gone:

```vue
<script setup lang="ts">
const inEditMode = ref(false);

const fields: Metadata[] = [
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
        computedProps: [(f, v) => { if (!inEditMode.value && !v.value) f.hidden = true; }],
      },
      {
        name: 'city',
        type: 'text',
        minOccurs: 0,
        computedProps: [(f, v) => { if (!inEditMode.value && !v.value) f.hidden = true; }],
      },
    ],
  }
]
</script>
```

The parent re-computes only when a child's mutable properties actually change, keeping reactivity efficient.

## Multiple Functions in computedProps

You can split concerns across multiple functions. All of them always run, each receiving the already-mutated `field` from the previous one:

```vue
<script setup lang="ts">
const role = useFieldValue('role');

const fields: Metadata[] = [
  {
    name: 'adminNote',
    type: 'text',
    computedProps: [
      (field) => { if (role.value !== 'admin') field.hidden = true; },
      (field) => { field.description = 'Only visible to admins.'; },
    ]
  }
]
</script>
```

## What You Can and Cannot Change

**Writable in computedProps:**

- All extended properties you declared in `defineMetadata()` (e.g. `options`, `hidden`, `description`, `fullWidth`)
- `minOccurs` — changes whether the field is required
- `type` — changes the rendered slot
- `restriction` — changes the built-in validation constraints
- `validation` — changes the vee-validate validation rules
- `autoAddMinOccurs` — controls whether the array auto-fills empty items up to `minOccurs`

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

## Live Example
<FormExampleDynamicFieldsContext />

Full source:
[FormExampleDynamicFields.vue](https://github.com/jeroenbach/vue-dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleDynamicFields.vue) ·
[FormExampleDynamicFieldsContext.vue](https://github.com/jeroenbach/vue-dynamic-form/blob/main/docs/.vitepress/theme/context/FormExampleDynamicFieldsContext.vue)

---

Continue to [Step 5: Advanced Fields](/guide/advanced-fields) to learn about groups, arrays, and choices.
