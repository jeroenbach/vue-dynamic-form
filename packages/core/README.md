# @bach.software/vue-dynamic-form

`@bach.software/vue-dynamic-form` is a schema-driven form library for Vue that extends `vee-validate` with a metadata model for fields, groups, arrays, choices, templates, and XSD-inspired validation rules.

For the manual site and runnable demos, start with [../../docs/index.md](../../docs/index.md).

## What The Library Solves

The library lets you describe a form as metadata instead of hard-coding the full form tree in templates. The metadata is then rendered by `DynamicForm` and your chosen `DynamicFormTemplate`.

This is useful when:

- form structure comes from configuration or backend metadata
- repeated sections and optional groups need to be created dynamically
- mutually exclusive input branches should be enforced consistently
- the same logical form must be rendered with different UI templates

## Core Building Blocks

### `DynamicForm`

`DynamicForm` is the runtime entry point. It:

- accepts metadata and a template component
- normalizes the metadata tree
- fills in defaults like `minOccurs`, `maxOccurs`, `type`, `name`, and `path`
- provides settings to all nested form items

### `DynamicFormTemplate`

`DynamicFormTemplate` is the rendering contract between the core engine and your UI layer. Instead of coupling the library to a specific design system, the library exposes slots for:

- simple inputs
- grouped fields
- array fields
- choice fields
- attributes

That means the form logic stays in the library, while the visual implementation stays in your app or component library.

### Metadata Tree

Each metadata item can represent one of a few structural shapes:

- input field: a single value
- parent/group: `children`
- choice: `choice`
- array/repeatable field: `maxOccurs > 1`
- attribute-bearing field: `attributes`

The engine walks the tree recursively and decides per node whether it should render:

- as a direct input
- as a repeatable array
- as a mutually exclusive choice
- as a group containing nested children

## How Dynamic Rendering Works

At runtime the library derives behavior from metadata.

### Paths

Every field gets a normalized path. If you do not provide one, the library derives it from parent path plus field name.

Examples:

- `person.firstName`
- `person.contacts[0].email`
- `invoice.lines[2].price`

These paths are used both for rendered `id`s and for `vee-validate` field registration.

### Groups

A metadata item with `children` is treated as a parent/group. The group itself may be optional or repeatable, and its children inherit constraints when needed.

### Arrays

A field becomes repeatable when `maxOccurs > 1`, unless runtime overrides force different behavior. The array implementation:

- manages placeholders and add/remove behavior
- tracks occurrences independently from validation state
- applies `minOccurs` and `maxOccurs`
- allows nested groups and nested arrays inside each occurrence

### Choices

A metadata item with `choice` is treated as a mutually exclusive branch selector. The choice engine:

- tracks which branch currently has values
- disables sibling branches when one branch becomes active
- supports nested choices
- supports array-based branches
- calculates per-branch `minOccurs` and `maxOccurs` overrides dynamically

This is the part that gives you XSD-like `<choice>` behavior in a Vue form.

## Validation Model

The library builds on `vee-validate` rather than replacing it.

### Built-in Rules

The core package defines XSD-inspired rules such as:

- `xsd_required`
- `xsd_minOccurs`
- `xsd_choiceMinOccurs`
- `xsd_minLength`
- `xsd_maxLength`
- `xsd_length`
- `xsd_pattern`
- `xsd_minInclusive`
- `xsd_maxInclusive`
- `xsd_minExclusive`
- `xsd_maxExclusive`
- `xsd_enumeration`
- `xsd_whiteSpace`
- `xsd_fractionDigits`
- `xsd_totalDigits`

### Message Resolution

Validation messages can come from:

1. `settings.messages`
2. `vee-validate` `configure({ generateMessage })`
3. default rule output

The message resolver supports both positional placeholders like `{0}` and semantic placeholders like `{min}`, `{length}`, `{digits}`, and `{field}`.

### Custom Validation

Metadata can also include custom `vee-validate` validation expressions:

- a single function
- an array of functions
- a pipe-separated string
- an object expression

The library splits multi-rule expressions into separate validation functions so multiple errors can be collected consistently.

## Template Strategy

The recommended workflow is:

1. Use `defineMetadata()` to strongly type your form field types and custom metadata extensions.
2. Create one `DynamicFormTemplate` implementation for your design system.
3. Pass metadata plus template into `DynamicForm`.

This separation is important:

- the core package owns behavior
- your template owns layout and styling
- your app owns business-specific metadata

## Example

```ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';

const metadata = defineMetadata<
  {
    text: string
    checkbox: boolean
    heading: never
  },
  {
    label?: string
    description?: string
  }
>();
```

```vue
<script setup lang="ts">
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import MyFormTemplate from './MyFormTemplate.vue';

const { handleSubmit } = useDynamicForm();

const formMetadata = [{
  name: 'person',
  type: 'heading',
  children: [
    { name: 'firstName', type: 'text', fieldOptions: { label: 'First name' } },
    { name: 'lastName', type: 'text', fieldOptions: { label: 'Last name' } },
  ],
}];
</script>

<template>
  <form @submit="handleSubmit(values => console.log(values))">
    <DynamicForm :metadata="formMetadata" :template="MyFormTemplate" />
  </form>
</template>
```

## Recommended Reading Order

- Overview and demos: [../../docs/index.md](../../docs/index.md)
- Getting started: [../../docs/guide/getting-started.md](../../docs/guide/getting-started.md)
- How the model works: [../../docs/guide/how-it-works.md](../../docs/guide/how-it-works.md)
- Templates: [../../docs/guide/templates.md](../../docs/guide/templates.md)
- Validation: [../../docs/guide/validation.md](../../docs/guide/validation.md)
- Interactive examples: [../../docs/examples/index.md](../../docs/examples/index.md)
