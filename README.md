# Vue Dynamic Form

[![npm](https://img.shields.io/npm/v/@bach.software/vue-dynamic-form)](https://www.npmjs.com/package/@bach.software/vue-dynamic-form)

A schema-driven form library for Vue 3. Describe your form as metadata and let the library handle paths, array repetition, mutually exclusive branches, and XSD-inspired validation — while your own template controls every pixel of the UI.

## Why

Most form libraries couple logic to markup. Vue Dynamic Form separates the two:

- **Metadata** defines structure — fields, groups, arrays, choices, validation rules, and runtime `computedProps`.
- **Your template** decides how each field type looks, using whatever component library or design system you already have.
- **`DynamicForm`** connects them at runtime and manages state via `vee-validate`.

This makes it practical for forms that come from configuration or a backend schema, forms that repeat sections dynamically, and UIs that need to render the same logical form in more than one visual style.

## Packages

| Package | Description | Published |
|---|---|---|
| `packages/core` | The library — `DynamicForm`, `defineMetadata`, `useDynamicForm`, validation rules | ✅ [`@bach.software/vue-dynamic-form`](https://www.npmjs.com/package/@bach.software/vue-dynamic-form) |
| `docs/` | VitePress documentation site with interactive demos | ✅ [vue-dynamic-form.bach.software](https://vue-dynamic-form.bach.software) |
| `playgrounds/storybook` | Component playground for template development | ❌ local only |

## Quick Start

```bash
npm install @bach.software/vue-dynamic-form vee-validate @vee-validate/rules vue
```

Define a metadata contract once with `defineMetadata`, then pass a metadata array and your own template to `DynamicForm`:

```vue
<script setup lang="ts">
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import MyFormTemplate from './MyFormTemplate.vue';

const { handleSubmit } = useDynamicForm();

const metadata = [{
  name: 'person',
  type: 'heading',
  children: [
    { name: 'firstName', type: 'text', fieldOptions: { label: 'First name' } },
    { name: 'lastName', type: 'text', fieldOptions: { label: 'Last name' } },
  ],
}];
</script>

<template>
  <form @submit.prevent="handleSubmit(values => console.log(values))">
    <DynamicForm :metadata :template="MyFormTemplate" />
  </form>
</template>
```

`MyFormTemplate` is a Vue component you write once using `DynamicFormTemplate` slots. The [Building Templates](https://vue-dynamic-form.bach.software/guide/building-templates) guide walks through the full setup.

## Documentation

Full manual, API reference, and runnable examples at **[vue-dynamic-form.bach.software](https://vue-dynamic-form.bach.software)**.

Key sections:

- [Getting started](https://vue-dynamic-form.bach.software/guide/getting-started) — install, first form, first template
- [How it works](https://vue-dynamic-form.bach.software/guide/how-it-works) — metadata model, paths, arrays, choices
- [Building templates](https://vue-dynamic-form.bach.software/guide/building-templates) — slot contract, `defineMetadata`, extending settings
- [Validation](https://vue-dynamic-form.bach.software/guide/validation) — built-in XSD rules, custom validators, message overrides
- [Examples](https://vue-dynamic-form.bach.software/examples/) — live demos with annotated source

The core package has its own detailed README at [`packages/core/README.md`](packages/core/README.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development setup, the dev workflow, testing, and the release process.
