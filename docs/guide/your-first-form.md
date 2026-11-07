# Step 3: Wire Up a Form

With a metadata definition and a template, you can now assemble a working form.

```vue
<!-- MyPage.vue -->
<script setup lang="ts">
import type { Metadata } from './MyFormTemplate';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import MyFormTemplate from './MyFormTemplate.vue';

const { handleSubmit, values } = useDynamicForm();

const onSubmit = handleSubmit((formValues) => {
  console.log('Submitted:', formValues);
});

const fields: Metadata[] = [
  { name: 'firstName', type: 'text', fieldOptions: { label: 'First name' } },
  { name: 'lastName', type: 'text', fieldOptions: { label: 'Last name' } },
];
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <DynamicForm :template="MyFormTemplate" :metadata="fields" />
  </form>

  <pre>{{ JSON.stringify(values, null, 2) }}</pre>
</template>
```

`DynamicForm` takes three props:

| Prop       | Description                                                 |
| ---------- | ----------------------------------------------------------- |
| `template` | Your `DynamicFormTemplate` SFC                              |
| `metadata` | The array of field definitions                              |
| `settings` | Optional configuration for validation behavior and messages |

You can use all standard vee-validate utilities (`setValues`, `resetForm`, `setErrors`, etc.) alongside `useDynamicForm()`.

`useDynamicForm()` also returns two extras beyond the standard vee-validate API:

| Extra                   | Description                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `useFieldValue(path)`   | Typed wrapper around vee-validate's `useFieldValue` — returns a `Ref` for the given field path   |
| `validateSection(path)` | Validates only the fields whose path starts with the given prefix; useful for multi-step wizards |

## The Properties You'll Use Every Day

A handful of `FieldMetadata` properties cover most forms. One annotated definition shows them all:

```ts
const fields: Metadata[] = [
  {
    // `name` is the key in the values object; parent names build the path
    name: 'contact',
    fieldOptions: { label: 'Contact' },
    // `children` turns a field into a group: values.contact.email, values.contact.phone
    children: [
      {
        name: 'email',
        // `type` picks the template slot that renders this field
        type: 'text',
        // `label` flows into fieldContext.label and error messages; pass a Ref for a dynamic label
        fieldOptions: { label: 'Email' },
        // `restriction` adds built-in validation without custom rules
        restriction: { maxLength: 100, pattern: '^.+@.+$' },
      },
      {
        name: 'phoneNumbers',
        type: 'text',
        fieldOptions: { label: 'Phone number' },
        // `minOccurs: 0` makes a field optional (default is 1: required)
        minOccurs: 0,
        // `maxOccurs > 1` turns the field into an add/remove array: values.contact.phoneNumbers[0], ...
        maxOccurs: 3,
      },
    ],
  },
];
```

Every property (including `choice`, `attributes`, `computedProps`, and the path overrides) is documented in [FieldMetadata](/reference/field-metadata); the `restriction` keys are covered in the [Validation guide](/guide/validation).

## The Settings Object

Pass a `DynamicFormSettings` object to control validation timing and message text:

```ts
const settings: DynamicFormSettings = {
  // Switch to live validation only after the first submit attempt (default: false)
  validateOnValueUpdateAfterSubmit: true,

  // Override the built-in error messages
  messages: {
    required: '{field} is required',
    minLength: '{field} must be at least {length} characters',
  },
};
```

All timing flags, every `messages` key, and how to extend the settings object with your own properties are documented in [DynamicForm](/reference/dynamic-form#settings-reference).

---

Continue to [Step 4: Reactive Fields](/guide/reactive-fields) to make fields react to user input.
