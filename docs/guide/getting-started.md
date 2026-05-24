# Getting Started

## Install

```bash
pnpm add @bach.software/vue-dynamic-form vee-validate @vee-validate/rules vue
```

## How It Works

A dynamic form has three parts that you assemble once and reuse across every form in your app:

1. **Field definitions** — a `defineMetadata()` call that declares which field types exist and what they look like
2. **A template** — a `DynamicFormTemplate` component that maps field types to your UI components
3. **A form page** — `DynamicForm` + `useDynamicForm()` (or vee-validate's `useForm()`) to render and submit

## Step 1: Define Your Fields

Keep the field type declaration in a `.ts` file next to your template. It is pure configuration — no rendering — so it can be imported by pages and tests without pulling in the Vue component:

```ts
// MyFormTemplate.ts
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import { defineMetadata } from '@bach.software/vue-dynamic-form';

export const metadata = defineMetadata<
  {
    text: string
    checkbox: boolean
    heading: never    // display-only, no form value
  },
  {
    label?: string
    description?: string
    options?: { key: string; value: string }[]
  }
>();

export type Metadata = GetMetadataType<typeof metadata>;
```

## Step 2: Build a Template

The template maps each field type to your UI. Import the metadata configuration and pass it to `DynamicFormTemplate` so TypeScript knows which slots to offer:

```vue
<!-- MyFormTemplate.vue -->
<script lang="ts" setup>
import { DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { metadata } from './MyFormTemplate';
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <!-- shared wrapper: label + field + error for all input types -->
    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, required }">
      <label :for="fieldMetadata.path">{{ label }} <span v-if="required">*</span></label>
      <slot />
      <span v-if="errorMessage.value">{{ errorMessage.value }}</span>
    </template>

    <template #heading="{ fieldContext: { label } }">
      <h3>{{ label }}</h3>
      <slot />
    </template>

    <template #text-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur } }">
      <input
        :id="fieldMetadata.path"
        :value="value.value"
        @input="handleChange"
        @blur="handleBlur"
      />
    </template>

    <template #checkbox-input="{ fieldMetadata, fieldContext: { value, handleChange } }">
      <input
        :id="fieldMetadata.path"
        type="checkbox"
        :checked="value.value"
        @change="handleChange"
      />
    </template>
  </DynamicFormTemplate>
</template>
```

## Step 3: Wire Up a Form

On the page, import `Metadata` from your `.ts` file for typed field definitions, then pass them to `DynamicForm`:

```vue
<!-- MyPage.vue -->
<script setup lang="ts">
import type { Metadata } from './MyFormTemplate';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import MyFormTemplate from './MyFormTemplate.vue';

const { handleSubmit } = useDynamicForm();

const fields: Metadata[] = [
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
    <DynamicForm :metadata="fields" :template="MyFormTemplate" />
  </form>
</template>
```

## A Simple Example

<FormExampleBasic />

## Continue

- Step 1: [Define Your Field Types](/guide/define-metadata)
- Step 2: [Build a Template](/guide/building-templates)
- Step 3: [Wire Up a Form](/guide/your-first-form)
- Step 4: [Dynamic Fields](/guide/dynamic-fields)
- Step 5: [Advanced Fields](/guide/advanced-fields)
- Browse interactive [Examples](/examples/)
- Read the [Reference](/reference/)
