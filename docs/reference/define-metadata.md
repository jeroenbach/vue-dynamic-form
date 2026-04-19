# defineMetadata()

Creates a typed metadata configuration that connects field type names to TypeScript value types and to the slots in your `DynamicFormTemplate`.

## Signature

```ts
function defineMetadata<
  FieldValueTypes extends Record<string, any>,
  ExtendedFieldProperties extends object = object,
>(): MetadataConfiguration
```

## Generic Parameters

### `FieldValueTypes`

A type map where each key is a field type name and each value is the type that field produces in the form values object.

```ts
defineMetadata<{
  text: string        // produces a string
  number: number      // produces a number
  checkbox: boolean   // produces a boolean
  heading: never      // display-only, produces no value
}>()
```

Use `never` for field types that hold no form value (headings, separators, info panels).

### `ExtendedFieldProperties`

Optional. Extra properties merged into every `FieldMetadata` object. These flow through to slot props as `fieldMetadata.*` and are available in `computedProps`.

```ts
defineMetadata<
  { text: string; select: string },
  {
    description?: string
    placeholder?: string
    options?: { key: string; value: string }[]
    disabled?: boolean
    fullWidth?: boolean
  }
>()
```

## Return Value

The returned object is a `MetadataConfiguration`. It carries no runtime data — its sole purpose is to give TypeScript the type information needed for:

- named template slot autocompletion (`#text`, `#select-input`, …)
- typed `fieldMetadata` in slot props
- typed `FieldMetadata[]` arrays when writing form definitions

Pass it to `DynamicFormTemplate` via `:metadata-configuration`.

## Built-in Types

These slot names are always available regardless of what you declare in `FieldValueTypes`:

| Name | Slot role |
|------|-----------|
| `default` | Fallback wrapper for any field without a named slot |
| `default-input` | Fallback input control for any field without a named `{type}-input` slot |
| `array` | Outer container for repeatable fields (`maxOccurs > 1`) |
| `choice` | Outer container for choice fields (field has `choice` property) |

You do not need to declare `default`, `array`, or `choice` in `FieldValueTypes`.

## Reserved Names

These keys cannot appear in `FieldValueTypes`:

| Reserved | Reason |
|----------|--------|
| `input` | Internal slot identifier |
| `children` | Used for group/parent fields |
| `choice` | Used for choice/branch fields |
| `array` | Used for repeatable fields |

## GetMetadataType

Use the `GetMetadataType` helper to derive the fully typed `FieldMetadata` alias for use in form definitions:

```ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';

export const metadata = defineMetadata<
  { text: string; select: string },
  { options?: { key: string; value: string }[] }
>();

export type Metadata = GetMetadataType<typeof metadata>;
// Metadata is FieldMetadata<'text' | 'select' | 'default', { options?: ... }>
```

Import `Metadata` wherever you write field arrays. TypeScript will enforce that `type` is one of your declared names and that extended properties like `options` are correctly typed.

## Full Example

```ts
// AdvancedFormTemplate.vue
import { defineMetadata } from '@bach.software/vue-dynamic-form';
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';

export const metadata = defineMetadata<
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

export type Metadata = GetMetadataType<typeof metadata>;
```

```ts
// MyPage.vue
import type { Metadata } from './AdvancedFormTemplate.vue';

const fields: Metadata[] = [
  {
    name: 'country',
    type: 'select',              // ✓ only 'text' | 'select' | 'checkbox' | 'heading' accepted
    fieldOptions: { label: 'Country' },
    options: [                   // ✓ typed from ExtendedFieldProperties
      { key: 'nl', value: 'Netherlands' },
      { key: 'de', value: 'Germany' },
    ],
  },
];
```
