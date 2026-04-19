# Getting Started

## Install

```bash
pnpm add @bach.software/vue-dynamic-form vee-validate @vee-validate/rules vue
```

## The Minimum Setup

You need three things:

1. metadata
2. a `DynamicFormTemplate`
3. a `useDynamicForm()` instance to handle submission and form state

```vue
<script setup lang="ts">
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import MyFormTemplate from './MyFormTemplate.vue';

const { handleSubmit } = useDynamicForm();

const metadata = [
  {
    name: 'person',
    type: 'heading',
    fieldOptions: { label: 'Person' },
    children: [
      { name: 'firstName', type: 'text', fieldOptions: { label: 'First name' } },
      { name: 'lastName', type: 'text', fieldOptions: { label: 'Last name' } },
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

## Strongly Typed Metadata

Use `defineMetadata()` when you want a typed contract for field values and template-specific field extensions.

```ts
import { defineMetadata } from '@bach.software/vue-dynamic-form';

const metadataConfiguration = defineMetadata<
  {
    text: string
    checkbox: boolean
    heading: never
  },
  {
    label?: string
    description?: string
    options?: { key: string, value: string }[]
  }
>();
```

## A Real Example

<BasicFormExample name="default" title="Quick Start Demo" description="The same example component used in the repository tests and examples." />

## Continue

- Step 1: [Define Your Field Types](/guide/define-metadata)
- Step 2: [Build a Template](/guide/building-templates)
- Step 3: [Wire Up a Form](/guide/your-first-form)
- Step 4: [Dynamic Fields](/guide/dynamic-fields)
- Step 5: [Advanced Fields](/guide/advanced-fields)
- Browse interactive [Examples](/examples/)
- Read the [Reference](/reference/)
