# Define Metadata

`defineMetadata()` is the place where you design your form system.

Before building any forms, decide which field types your application needs and which extra properties should be available on every metadata field. That gives you type-safe metadata and type-safe slots in your template.

## Why Start Here

The library does not impose a UI kit or a fixed list of field types. You decide that yourself.

Typical decisions made here:

- which input types exist: `text`, `select`, `checkbox`, `date`, `heading`, and so on
- which of those produce values and of what type
- which extra metadata properties should be available in templates: `options`, `disabled`, `description`, `fullWidth`

## Basic Example

<<< @/.vitepress/theme/components/BasicFormTemplate.vue#basic-form-template{2-3,10-14} [BasicFormTemplate.vue]

In that example:

- `text` stores a `string`
- `default` is automatically available and also stores a `string`
- no extra custom field properties are defined yet

## Full Example

```ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';

const metadataConfiguration = defineMetadata<
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

This gives you two things immediately:

- autocomplete and type checking when creating metadata objects
- typed slot props inside `DynamicFormTemplate`

## Value Types

The first generic describes the value type for each custom field type.

- use `string` for normal text-like controls
- use `boolean` for checkboxes or toggles
- use `number` for numeric inputs when your component writes numbers
- use `never` for structural fields that do not store a direct value, such as headings

The library always includes a built-in `default` field type that maps to `string`.

## Extended Field Properties

The second generic adds your own properties to every field metadata object.

This is where you add template-specific information such as:

- `options` for select-like inputs
- `disabled` for fields that can be turned on or off dynamically
- `description` for helper text
- `fullWidth` or layout hints used only by your template

Those properties become available on `fieldMetadata` in your slots.

## How This Connects To Slots

Each field type you define can be rendered by matching slots in `DynamicFormTemplate`.

If you define a field type called `select`, you can provide:

- `#select` for the field wrapper
- `#select-input` for the actual input control

If you do not provide them, the template falls back to:

- `#default`
- `#default-input`

This is the core authoring model of the library: define field types once, then let metadata choose which slot path to use.

## Built-In Structural Cases

Besides your own field types, the runtime also has a few built-in structural rendering modes:

- `default`: fallback slot for any field type without a dedicated slot
- `children`: not a separate slot name; a field with `children` is still usually rendered through `default`, but as a grouped field
- `choice`: rendered through the `#choice` slot
- `array`: rendered through the `#array` slot

So in practice:

- your field type decides the input and wrapper identity
- `children`, `choice`, and `maxOccurs > 1` decide the structural behavior

## Reserved Names

Do not define custom field types with these names:

- `input`
- `children`
- `choice`
- `array`

Those names are reserved by the library.

## Suggested Tutorial Build-Up

When teaching `defineMetadata()`, introduce it in this sequence:

1. start with one field type such as `text`
2. add one structural type such as `heading`
3. add one custom property such as `description`
4. add `options` and a `select` field
5. add `disabled` and show how `computedProps` can update it later

That progression keeps the reader focused on one concept at a time while still building toward a realistic template contract.

## Next

Continue with [Templates](/guide/templates) to turn the metadata configuration into actual HTML.
