# DynamicForm

`<DynamicForm>` is the runtime component that turns your metadata tree into rendered fields.

It does three main things:

- normalizes metadata and fills in defaults
- chooses the right structural renderer for each field
- provides settings to all nested form items

## Basic Usage

<<< @/.vitepress/theme/components/BasicForm.vue#basic-form{2-4,11-15,33-39} [BasicForm.vue]

At minimum, pass:

- `metadata`
- `template`

Optionally, pass:

- `settings`

## Typical Form Setup

The library works best when your app owns the outer form shell:

```vue
<script setup lang="ts">
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import MyTemplate from './MyTemplate.vue';

const { handleSubmit, values, errors, meta } = useDynamicForm();
</script>

<template>
  <form @submit="handleSubmit(submitted => console.log(submitted))">
    <DynamicForm
      :template="MyTemplate"
      :metadata="metadata"
      :settings="settings"
    />
  </form>
</template>
```

This separation is intentional:

- your form component owns submission and page-level layout
- `DynamicForm` owns recursive field rendering

## Props

### `metadata`

Accepts either:

- a single field metadata object
- an array of field metadata objects

`DynamicForm` will normalize both into an array internally.

### `template`

A Vue component built with `DynamicFormTemplate`. This is the rendering layer used for every field in the tree.

### `settings`

Controls runtime behavior and built-in validation messages.

## Settings Reference

### `analytics?: boolean`

Enables hidden diagnostic output used by the internal test suite to measure reactivity and render behavior.

You normally do not need this in application code.

### `complexTypeValueProperty?: string`

Changes the property name used for complex type values.

By default, a complex type value looks like:

```ts
{ value: 'actual field value' }
```

If you set:

```ts
{ complexTypeValueProperty: 'myValue' }
```

the value will be read from:

```ts
{ myValue: 'actual field value' }
```

### `validateOnValueUpdate?: boolean`

When `true`, fields validate on value changes.

Default: `true`

### `validateOnValueUpdateAfterSubmit?: boolean`

When `true`, fields start validating on value changes only after the form has been submitted once.

Default: `false`

### `validateOnBlur?: boolean`

When `true`, fields validate on blur.

Default: `false`

### `validateWhenInError?: boolean`

When `true`, a field that already has an error keeps validating on further value changes.

Default: `false` in the type contract, but the component-level merged default currently behaves as enabled unless overridden.

### `messages`

Overrides built-in messages for metadata-driven rules.

Available keys:

- `required`
- `minOccurs`
- `choiceMinOccurs`
- `minLength`
- `maxLength`
- `length`
- `pattern`
- `minInclusive`
- `maxInclusive`
- `minExclusive`
- `maxExclusive`
- `enumeration`
- `whiteSpace`
- `fractionDigits`
- `totalDigits`

Each message accepts either:

- a string template such as `'{field} is required'`
- a function that receives the rule context and returns a string

Supported placeholders include:

- `{field}`
- `{value}`
- `{0}`, `{1}`, ...
- named values such as `{min}`, `{max}`, `{length}`, `{digits}`, `{pattern}`

## Default Metadata Behavior

Before rendering, `DynamicForm` fills in several defaults:

- `name`: generated as `field-${index}` when missing
- `path`: built from parent path and field name when missing
- `type`: defaults to `'text'`
- `minOccurs`: defaults to `1`
- `maxOccurs`: defaults to `1`
- `parent`: added internally so descendants can reference their parent metadata

That means you can keep metadata quite terse and only specify what is different from the defaults.

## Recommended Tutorial Order

Once a reader understands templates, introduce `<DynamicForm>` like this:

1. mount it inside a standard `<form>`
2. pass a template
3. pass a small metadata array
4. add `settings.messages`
5. show one submit handler and one live `values` preview

Only after that should you explain deeper behavior like arrays, choices, and computed metadata.

## Next

Continue with [How It Works](/guide/how-it-works) for the metadata model and the dynamic behavior of groups, arrays, choices, and `computedProps`.
