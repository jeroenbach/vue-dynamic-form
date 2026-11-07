# Step 1: Define Your Field Types

Before writing a single form, you declare a vocabulary: which field types exist and what extra properties they can carry. Everything else — templates, intellisense, slot resolution — follows from this single declaration.

## The Call

```ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';

const metadata = defineMetadata<
  {
    text: string // text input, value is a string
    checkbox: boolean // checkbox, value is a boolean
    heading: never // display-only, no value
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
    options?: { key: string, value: string }[]
    disabled?: boolean
    fullWidth?: boolean
  }
>();
```

These properties become part of `FieldMetadata` and show up in your template's slot props as `fieldMetadata.description`, `fieldMetadata.options`, and so on.

## The Other Two Generic Parameters

`defineMetadata` takes two more generic parameters you will reach for later:

- **Slot properties** (third parameter): values an outer slot can forward down to inner slots by binding them on `<slot />`, e.g. a nesting depth counter. See [Passing Data to Child Slots](/reference/dynamic-form-template#passing-data-to-child-slots).
- **Extended settings** (fourth parameter): extra properties on the form-wide `settings` object every slot receives, e.g. a display mode flag. See [`ExtendedSettingsProperties`](/reference/define-metadata#extendedsettingsproperties).

## How This Unlocks Intellisense

Pass the result to `DynamicFormTemplate` via `:metadata-configuration` and TypeScript takes over:

- the `#heading`, `#text`, `#select` slots are offered by autocomplete
- slot prop `fieldMetadata` includes your custom properties fully typed
- writing metadata anywhere that imports the type gives you completions for `type`, `options`, `disabled`, etc.

## Sharing the Type

Export the configuration and a derived `Metadata` type from the dedicated `.ts` file:

```ts
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
// MyFormTemplate.ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';

export const metadata = defineMetadata<
  { text: string, select: string, heading: never },
  { description?: string, options?: { key: string, value: string }[] }
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
    options: [ // ✓ autocomplete, typed
      { key: 'nl', value: 'Netherlands' },
      { key: 'de', value: 'Germany' },
    ],
  },
];
```

## The `default` Type

Any field type that has no dedicated slot in your template falls back to the `#default` slot automatically. This means you don't need a slot for every type — unknown types are caught by `#default` and rendered there. Because `default` is used internally as this fallback, it is reserved: never declare it (or any `default-*` name) in your type map. The full list of reserved names and the naming pitfalls to avoid are in [Built-in Type](/reference/define-metadata#built-in-type) in the reference.

---

Continue to [Step 2: Build a Template](/guide/building-templates).
