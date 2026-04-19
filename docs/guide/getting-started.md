# Getting Started

The easiest way to learn Vue Dynamic Form is to build it in this order:

1. define your field types with `defineMetadata()`
2. create a `DynamicFormTemplate` that renders those field types
3. mount `<DynamicForm>` inside a form created with `useDynamicForm()`
4. start adding metadata objects until the form grows into the shape you need

That order matters. The template is your UI contract, and the metadata is the content that flows through it.

## Install

```bash
pnpm add @bach.software/vue-dynamic-form vee-validate @vee-validate/rules vue
```

## The Three Pieces

Every form built with `packages/core` has the same three moving parts:

- `defineMetadata()` declares which field types your app supports and which extra properties each field may carry.
- `DynamicFormTemplate` maps those field types to actual HTML or components.
- `<DynamicForm>` reads a metadata tree and renders it through your template.

`useDynamicForm()` is the bridge to `vee-validate`. It gives you `handleSubmit`, `values`, `errors`, `meta`, and typed `useFieldValue()`.

## Mental Model

Think of the library as a rendering engine with a strict separation of concerns:

- metadata decides which fields exist, how they nest, and which rules apply
- the template decides what those fields look like
- the form instance decides submission, values, and validation lifecycle

Once those pieces are in place, most new forms are just new metadata.

## Minimal Setup

```vue
<script setup lang="ts">
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import MyFormTemplate from './MyFormTemplate.vue';

const { handleSubmit } = useDynamicForm();

const metadata = [
  {
    name: 'person',
    children: [
      { name: 'firstName', fieldOptions: { label: 'First name' } },
      { name: 'lastName', fieldOptions: { label: 'Last name' } },
    ],
  },
];
</script>

<template>
  <form @submit="handleSubmit(values => console.log(values))">
    <DynamicForm :metadata="metadata" :template="MyFormTemplate" />
  </form>
</template>
```

The library fills in defaults such as:

- `type: 'text'`
- `minOccurs: 1`
- `maxOccurs: 1`
- generated `name` and `path` values when needed

## Recommended Learning Path

If you are writing docs or teaching teammates, this is the order that builds understanding cleanly:

1. [Define Metadata](/guide/define-metadata): decide which field types and extra field properties your template supports.
2. [Templates](/guide/templates): render fields with `default`, `default-input`, custom field slots, and structural slots like `array` and `choice`.
3. [DynamicForm](/guide/dynamic-form): mount a real form and configure messages and runtime behavior through `settings`.
4. [How It Works](/guide/how-it-works): learn groups, arrays, choices, and `computedProps`.
5. [Metadata Reference](/guide/metadata-reference): use as the full lookup page for every field property.

This keeps the tutorial flow practical first, then moves into detail once the reader already has a working form in mind.

## Quick Start Demo

<BasicFormExample name="default" title="Quick Start Demo" description="A minimal typed template plus a small metadata array rendered through DynamicForm." />

## Continue

- Start with [Define Metadata](/guide/define-metadata)
- Then read [Templates](/guide/templates)
- Browse runnable [Examples](/examples/)
