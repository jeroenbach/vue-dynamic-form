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

The first generic parameter maps field type names to their value types. Use `never` for fields that render something but hold no form value (headings, separators, info panels).

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

## How This Unlocks Intellisense

Pass the result to `DynamicFormTemplate` via `:metadata-configuration` and TypeScript takes over:

- the `#heading`, `#text`, `#select` slots are offered by autocomplete
- slot prop `fieldMetadata` includes your custom properties fully typed
- writing metadata anywhere that imports the type gives you completions for `type`, `options`, `disabled`, etc.

## Sharing the Type

Export the configuration and a derived `Metadata` type from your template component:

```ts
// MyFormTemplate.vue
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
import type { Metadata } from './MyFormTemplate.vue';

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

`default` is always available and doesn't need to be declared. It is the fallback for any field whose `type` has no dedicated slot. You can still declare `default` in your type map if you want a specific value type for it; the library adds it automatically with a `string` value type if you don't.

## Reserved Type Names

These names cannot be used as keys in your field type map because they are used internally:

| Name | Internal use |
|------|-------------|
| `input` | Input slot identifier |
| `children` | Group/parent fields |
| `choice` | Choice/branch fields |
| `array` | Repeatable fields |

---

Continue to [Step 2: Build a Template](/guide/building-templates).
