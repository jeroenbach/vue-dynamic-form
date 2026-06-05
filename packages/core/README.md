# @bach.software/vue-dynamic-form

[![npm](https://img.shields.io/npm/v/@bach.software/vue-dynamic-form)](https://www.npmjs.com/package/@bach.software/vue-dynamic-form)

**Complex forms, without the complexity.**

An opinionated extension on top of `vee-validate` — it handles the structure, arrays, choices, and validation wiring, while you keep full control over the HTML.

## Install

```bash
npm install @bach.software/vue-dynamic-form vee-validate @vee-validate/rules vue
```

## How It Works

A dynamic form has three parts that you assemble once and reuse across every form in your app:

Steps 1 and 2 are done **once per app** (or once per design system). Step 3 is repeated for each form you build.

1. **Define your field types** — a `defineMetadata()` call that declares which types exist and what properties they support
2. **Build a template** — a `DynamicFormTemplate` component that maps each type to your own UI components
3. **Wire up a form page** — pass a metadata array and your template to `DynamicForm`

### 1. Define your field types

```ts
// MyFormTemplate.ts
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import { defineMetadata } from '@bach.software/vue-dynamic-form';

export const metadata = defineMetadata<
  {
    text: string
    checkbox: boolean
    heading: never // display-only, no form value
  },
  {
    label?: string
    description?: string
  }
>();

export type Metadata = GetMetadataType<typeof metadata>;
```

### 2. Build a template

Map each field type to your own components. The library provides the structure — you own every element of the HTML:

```vue
<!-- MyFormTemplate.vue -->
<script lang="ts" setup>
import { DynamicFormTemplate } from '@bach.software/vue-dynamic-form';
import { metadata } from './MyFormTemplate';
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <template #heading="{ fieldContext: { label } }">
      <h3>{{ label }}</h3>
      <slot />
    </template>

    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, required }">
      <label :for="fieldMetadata.path">{{ label }}<span v-if="required"> *</span></label>
      <slot />
      <span v-if="errorMessage.value">{{ errorMessage.value }}</span>
    </template>

    <template #text-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur } }">
      <input :id="fieldMetadata.path" :value="value.value" @input="handleChange" @blur="handleBlur">
    </template>

    <template #checkbox-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur } }">
      <input :id="fieldMetadata.path" type="checkbox" :checked="value.value" @change="handleChange" @blur="handleBlur">
    </template>
  </DynamicFormTemplate>
</template>
```

### 3. Wire up a form page

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
  <form @submit.prevent="handleSubmit(values => console.log(values))">
    <DynamicForm :metadata="fields" :template="MyFormTemplate" />
  </form>
</template>
```

## Key Features

### Fields that adapt automatically

Instead of writing watchers and side effects, describe what each field looks like given the current state. The library re-evaluates on every relevant change:

```ts
const fields: Metadata[] = [
  { name: 'accountType', type: 'select', /* ... */ },
  {
    name: 'vatNumber',
    type: 'text',
    fieldOptions: { label: 'VAT Number' },
    computedProps: [
      (field) => { field.disabled = accountType.value !== 'business'; }
    ]
  }
];
```

No watchers, no event handlers. Change `accountType` and the field responds instantly. Works for visibility, options, validation rules, labels — anything on the field.

### Repeatable sections

Control repetition with `minOccurs` and `maxOccurs`. The library manages array indexing, add/remove, and validates each occurrence independently:

```ts
const fields: Metadata[] = [
  {
    name: 'contacts',
    type: 'heading',
    minOccurs: 1,
    maxOccurs: 5,
    arrayItemName: 'contact',
    children: [
      { name: 'name', type: 'text', fieldOptions: { label: 'Name' } },
      { name: 'email', type: 'text', fieldOptions: { label: 'Email' } },
    ],
  },
];
```

### Mutually exclusive choices

Branches that disable their siblings the moment one becomes active. Nested validation only applies to the active branch:

```ts
const fields: Metadata[] = [
  {
    name: 'payment',
    type: 'heading',
    choice: [
      {
        name: 'card',
        fieldOptions: { label: 'Credit card' },
        children: [
          { name: 'number', type: 'text', fieldOptions: { label: 'Card number' } },
        ],
      },
      {
        name: 'transfer',
        fieldOptions: { label: 'Bank transfer' },
        children: [
          { name: 'iban', type: 'text', fieldOptions: { label: 'IBAN' } },
        ],
      },
    ],
  },
];
```

### XSD-inspired validation rules

Built-in rules derived from the XSD specification, with human-readable message overrides:

```ts
const fields: Metadata[] = [
  {
    name: 'username',
    type: 'text',
    restriction: {
      minLength: 3,
      maxLength: 30,
      pattern: '^[a-z0-9_]+$',
    },
  },
];
```

Pass `settings.messages` to `DynamicForm` to customise any message globally.

## Documentation

Full manual, API reference, and interactive demos at **[vue-dynamic-form.bach.software](https://vue-dynamic-form.bach.software)**.

- [Getting started](https://vue-dynamic-form.bach.software/guide/getting-started)
- [How it works](https://vue-dynamic-form.bach.software/guide/how-it-works)
- [Building templates](https://vue-dynamic-form.bach.software/guide/building-templates)
- [Dynamic fields](https://vue-dynamic-form.bach.software/guide/dynamic-fields)
- [Validation](https://vue-dynamic-form.bach.software/guide/validation)
- [Examples](https://vue-dynamic-form.bach.software/examples/)
- [Reference](https://vue-dynamic-form.bach.software/reference/)
