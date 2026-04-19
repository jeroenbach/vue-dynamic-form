# Step 3: Wire Up a Form

With a metadata definition and a template, you can now assemble a working form. This step shows the standard pattern: a reusable form wrapper component plus the page that drives it.

## A Reusable Form Component

Create a component that owns the `<form>` element, error styling, and passes everything to `DynamicForm`:

```vue
<!-- MyForm.vue -->
<script setup lang="ts">
import type { DynamicFormSettings, FieldMetadata } from '@bach.software/vue-dynamic-form';
import { DynamicForm } from '@bach.software/vue-dynamic-form';
import MyFormTemplate from './MyFormTemplate.vue';

defineProps<{
  metadata: FieldMetadata[]
  settings?: DynamicFormSettings
}>();
</script>

<template>
  <form>
    <DynamicForm
      :template="MyFormTemplate"
      :metadata="metadata"
      :settings="settings"
    />
  </form>
</template>
```

`DynamicForm` takes three props:

| Prop | Description |
|------|-------------|
| `template` | Your `DynamicFormTemplate` SFC |
| `metadata` | The array of field definitions |
| `settings` | Optional configuration for validation behavior and messages |

## Handling Submission

`useDynamicForm()` is a thin wrapper around vee-validate's `useForm()`. Use it in the component that submits the form:

```vue
<!-- MyPage.vue -->
<script setup lang="ts">
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import type { Metadata } from './MyFormTemplate.vue';
import MyForm from './MyForm.vue';

const { handleSubmit, values, meta } = useDynamicForm();

const onSubmit = handleSubmit((formValues) => {
  console.log('Submitted:', formValues);
});

const fields: Metadata[] = [
  { name: 'firstName', type: 'text', fieldOptions: { label: 'First name' } },
  { name: 'lastName', type: 'text', fieldOptions: { label: 'Last name' } },
];
</script>

<template>
  <MyForm :metadata="fields" @submit.prevent="onSubmit" />

  <pre>{{ JSON.stringify(values, null, 2) }}</pre>
</template>
```

You can use all standard vee-validate utilities (`setValues`, `resetForm`, `setErrors`, etc.) alongside `useDynamicForm()`.

## Basic Field Properties

### `name`

Sets the key in the form values object. Together with parent names it builds a dot-notated path:

```ts
{ name: 'email', type: 'text', fieldOptions: { label: 'Email' } }
// → values.email
```

Nested under a parent:

```ts
{
  name: 'contact',
  children: [
    { name: 'email', type: 'text', fieldOptions: { label: 'Email' } },
    { name: 'phone', type: 'text', fieldOptions: { label: 'Phone' } },
  ]
}
// → values.contact.email, values.contact.phone
```

### `type`

Determines which slot in your template handles this field. Use any type you declared in `defineMetadata()`:

```ts
{ name: 'agree', type: 'checkbox', fieldOptions: { label: 'I agree to the terms' } }
```

### `fieldOptions.label`

Sets the display label. This value flows into the slot prop `fieldContext.label` and into vee-validate error messages as the field name.

```ts
{ name: 'dob', type: 'text', fieldOptions: { label: 'Date of birth' } }
```

For a label that changes at runtime, pass a `Ref`:

```ts
const labelRef = ref('Quantity');
{ name: 'qty', type: 'text', fieldOptions: { label: labelRef } }

// Later:
labelRef.value = 'Number of seats';
```

### `minOccurs`

Controls whether the field is required. The default is `1` (required). Set to `0` for optional:

```ts
{ name: 'middleName', type: 'text', minOccurs: 0, fieldOptions: { label: 'Middle name' } }
```

### `maxOccurs`

Controls how many times a field can repeat. The default is `1`. Set to a higher number to enable an add/remove array interface:

```ts
{
  name: 'phoneNumbers',
  type: 'text',
  fieldOptions: { label: 'Phone number' },
  minOccurs: 1,
  maxOccurs: 3,
}
// → values.phoneNumbers[0], values.phoneNumbers[1], ...
```

### `children`

Turns a field into a group that holds nested fields. The group's own `name` becomes the parent path segment:

```ts
{
  name: 'address',
  fieldOptions: { label: 'Address' },
  children: [
    { name: 'street', type: 'text', fieldOptions: { label: 'Street' } },
    { name: 'city',   type: 'text', fieldOptions: { label: 'City'   } },
  ],
}
```

## The Settings Object

Pass a `DynamicFormSettings` object to control validation timing and message text:

```ts
const settings: DynamicFormSettings = {
  // Validate every time the user types (default: true)
  validateOnValueUpdate: true,

  // Switch to live validation only after the first submit attempt (default: false)
  validateOnValueUpdateAfterSubmit: false,

  // Validate when the user leaves a field (default: false)
  validateOnBlur: false,

  // Keep validating live once a field has an error (default: false)
  validateWhenInError: true,

  // Override the built-in error messages
  messages: {
    required:  '{field} is required',
    minLength: '{field} must be at least {length} characters',
    maxLength: '{field} may be at most {length} characters',
    pattern:   '{field} does not match the expected format',
  },
};
```

All `messages` entries accept a string template (with `{field}`, `{length}`, `{min}`, etc.) or a function `(ctx) => string`. See [Validation](/guide/validation) for the full list.

## Live Example

<BasicFormExample name="default" title="Basic Form" description="A minimal form with a label, text input, and validation messages." />

---

Continue to [Step 4: Dynamic Fields](/guide/dynamic-fields) to make fields react to user input.
