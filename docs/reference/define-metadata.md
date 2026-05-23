# defineMetadata()

Creates a typed metadata configuration that connects field type names to TypeScript value types and to the slots in your `DynamicFormTemplate`.

## Signature

```ts
function defineMetadata<
  FieldValueTypes extends Record<string, any>,
  ExtendedFieldProperties extends object = object,
  SlotProperties extends object = object,
  ExtendedSettingsProperties extends object = object,
>(): MetadataConfiguration
```

## Generic Parameters

### `FieldValueTypes`

A type map where each key is a field type name and each value is the type of `fieldContext.value` inside that type's slot.

Each key generates a pair of slots: `#text` (wrapper) and `#text-input` (raw input), with `fieldContext.value` typed as the corresponding value. Use `never` for display-only types (headings, separators, info panels) — they get no `-input` slot and `fieldContext.value` is typed as `never`.

```ts
defineMetadata<{
  text: string        // fieldContext.value is Ref<string> in #text and #text-input
  number: number      // fieldContext.value is Ref<number> in #number and #number-input
  checkbox: boolean   // fieldContext.value is Ref<boolean> in #checkbox and #checkbox-input
  heading: never      // display-only — no -input slot, no value
}>()
```

::: tip
`FieldValueTypes` does not define the shape of the submitted form values. That type comes from the generic on `useDynamicForm<TValues>()`. `FieldValueTypes` only controls what TypeScript infers for `fieldContext.value` inside each template slot.
:::

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

### `SlotProperties`

Optional. Extra data that can be passed down from a parent slot to child slots via the `<slot />` element. When declared, `slotProps` in every slot is typed as `SlotProperties | undefined` instead of `object | undefined`.

```ts
defineMetadata<
  { text: string },
  {},
  { hideLabel?: boolean; depth?: number }
>()
// slotProps is now typed as { hideLabel?: boolean; depth?: number } | undefined
```

### `ExtendedSettingsProperties`

Optional. Extra properties merged into the `DynamicFormSettings` object passed to `DynamicForm`. These flow through to every template slot as `settings.*`, making them available for template-level display logic.

```ts
defineMetadata<
  { text: string; select: string },
  {},
  {},
  { showRequiredOrOptional?: 'optional' | 'required' }
>()
// settings.showRequiredOrOptional is now available in every slot
```

Slots can then destructure the setting directly:

```vue
<template #default="{ required, settings: { showRequiredOrOptional } }">
  <span v-if="showRequiredOrOptional === 'optional' && !required">Optional</span>
</template>
```

## Return Value

The returned object is a `MetadataConfiguration`. It carries no runtime data — its sole purpose is to give TypeScript the type information needed for:

- named template slot autocompletion (`#text`, `#select-input`, …)
- typed `fieldMetadata` in slot props
- typed `FieldMetadata[]` arrays when writing form definitions

Pass it to `DynamicFormTemplate` via `:metadata-configuration`.

## Built-in Type

`default` is always included as a field type — you never need to declare it in `FieldValueTypes`. Like every declared type, it generates five slots that act as the final fallback for any field whose `type` has no matching named slot:

| Slot | Fallback for |
|------|-------------|
| `#default` | Any `#T` slot that is not defined |
| `#default-input` | Any `#T-input` slot that is not defined |
| `#default-array` | Any `#T-array` slot that is not defined |
| `#default-array-item` | Any `#T-array-item` slot that is not defined |
| `#default-choice` | Any `#T-choice` slot that is not defined |

::: tip Naming advice
Avoid names ending in `-input`, `-array`, `-array-item`, or `-choice` — they are valid but will generate ambiguous slot names. For example, declaring `my-array` as a type produces `#my-array` (wrapper) and `#my-array-array` (array container), which is hard to distinguish from the generated slots.
:::

## GetDynamicFormSettingsType

Use the `GetDynamicFormSettingsType` helper to derive the fully typed `DynamicFormSettings` alias, including any extended properties declared in the fourth generic:

```ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';
import type { GetDynamicFormSettingsType } from '@bach.software/vue-dynamic-form';

export const metadata = defineMetadata<
  { text: string; select: string },
  {},
  {},
  { showRequiredOrOptional?: 'optional' | 'required' }
>();

export type DynamicFormSettings = GetDynamicFormSettingsType<typeof metadata>;
// DynamicFormSettings is DynamicFormSettings<{ showRequiredOrOptional?: 'optional' | 'required' }>
```

Import `DynamicFormSettings` wherever you pass settings to `DynamicForm`. TypeScript will enforce that extended properties like `showRequiredOrOptional` are correctly typed alongside the built-in settings properties.

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
// MyFormTemplate.vue
import { defineMetadata } from '@bach.software/vue-dynamic-form';
import type { GetDynamicFormSettingsType, GetMetadataType } from '@bach.software/vue-dynamic-form';

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
  },
  {
    hideLabel?: boolean
  },
  {
    showRequiredOrOptional?: 'optional' | 'required'
  }
>();

export type Metadata = GetMetadataType<typeof metadata>;
export type FormSettings = GetDynamicFormSettingsType<typeof metadata>;
```

```ts
// MyPage.vue
import type { FormSettings, Metadata } from './MyFormTemplate.vue';

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

const settings: FormSettings = {
  showRequiredOrOptional: 'optional',   // ✓ typed from ExtendedSettingsProperties
  validateOnBlur: true,                  // ✓ always available from DynamicFormSettings
};
```
