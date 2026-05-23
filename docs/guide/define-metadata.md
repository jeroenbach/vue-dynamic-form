# Step 1: Define Your Field Types

Before writing a single form, you declare a vocabulary: which field types exist and what extra properties they can carry. Everything else — templates, intellisense, slot resolution — follows from this single declaration.

## The Call

```ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';

const metadata = defineMetadata<
  {
    text: string      // text input, value is a string
    checkbox: boolean // checkbox, value is a boolean
    heading: never    // display-only, no value
  }
>();
```

The first generic parameter maps field type names to their value types — specifically what `fieldContext.value` holds inside that field's template slot. Use `never` for fields that render something but hold no form value (headings, separators, info panels).

The overall form values type is a separate concern: it comes from the `T` you pass to `useDynamicForm<T>()` (or vee-validate's `useForm<T>()`), not from here.

## Adding Extended Properties

The second generic parameter adds custom properties to every field's metadata. Use this for anything your template needs beyond the core properties — option lists, descriptions, layout hints:

```ts
const metadata = defineMetadata<
  {
    text: string
    select: string
    checkbox: boolean
    heading: never
  },
  {
    description?: string
    options?: { key: string; value: string }[]
    disabled?: boolean
    fullWidth?: boolean
  }
>();
```

These properties become part of `FieldMetadata` and show up in your template's slot props as `fieldMetadata.description`, `fieldMetadata.options`, and so on.

## Passing Data Between Template Slots (Slot Properties)

The third generic parameter declares properties you can forward from an outer slot down to inner slots by adding attributes on the `<slot />` element. This is useful for communicating context between nested template levels — for example, a nesting depth counter or a flag that indicates the field is inside a choice branch.

```ts
const metadata = defineMetadata<
  { text: string; heading: never },
  { description?: string },
  {
    level?: number          // nesting depth, incremented at each heading
    belowChoiceField?: boolean
  }
>();
```

In your template, bind the properties on `<slot />` and read them from `slotProps` in the child:

```vue
<template #heading="{ slotProps }">
  <div>
    <slot :level="(slotProps?.level ?? 0) + 1" />
  </div>
</template>

<template #default="{ slotProps }">
  <!-- slotProps.level is now available here -->
</template>
```

## How This Unlocks Intellisense

Pass the result to `DynamicFormTemplate` via `:metadata-configuration` and TypeScript takes over:

- the `#heading`, `#text`, `#select` slots are offered by autocomplete
- slot prop `fieldMetadata` includes your custom properties fully typed
- writing metadata anywhere that imports the type gives you completions for `type`, `options`, `disabled`, etc.

## Sharing the Type

Export the configuration and a derived `Metadata` type from the dedicated `.ts` file:

```ts
// MyFormTemplate.ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';

export const metadata = defineMetadata<
  { text: string; select: string; heading: never },
  { description?: string; options?: { key: string; value: string }[] }
>();

export type Metadata = GetMetadataType<typeof metadata>;
```

Then import `Metadata` wherever you write form fields:

```ts
// MyPage.vue
import type { Metadata } from './MyFormTemplate';

const fields: Metadata[] = [
  {
    name: 'country',
    type: 'select',
    fieldOptions: { label: 'Country' },
    options: [                      // ✓ autocomplete, typed
      { key: 'nl', value: 'Netherlands' },
      { key: 'de', value: 'Germany' },
    ],
  },
];
```

## The `default` Type

Any field type that has no dedicated slot in your template falls back to the `#default` slot automatically. This means you don't need a slot for every type — unknown types are caught by `#default` and rendered there. Because `default` is used internally as this fallback, it is reserved and should not be declared in your type map.

## Reserved Type Names

Avoid using these names as field type keys because they clash with the built-in fallback slot names that `DynamicFormTemplate` resolves to:

| Name | Internal use |
|------|-------------|
| `default` | Fallback slot for any field type |
| `default-input` | Fallback slot for input variants |
| `default-array` | Fallback slot for the outer array container |
| `default-array-item` | Fallback slot for each array occurrence |
| `default-choice` | Fallback slot for the outer choice container |

---

Continue to [Step 2: Build a Template](/guide/building-templates).
