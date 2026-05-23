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
  <form @submit.prevent="onSubmit">
    <DynamicForm :template="MyFormTemplate" :metadata="fields" />
  </form>

  <pre>{{ JSON.stringify(values, null, 2) }}</pre>
</template>
```

`DynamicForm` takes three props:

| Prop | Description |
|------|-------------|
| `template` | Your `DynamicFormTemplate` SFC |
| `metadata` | The array of field definitions |
| `settings` | Optional configuration for validation behavior and messages |

You can use all standard vee-validate utilities (`setValues`, `resetForm`, `setErrors`, etc.) alongside `useDynamicForm()`.

`useDynamicForm()` also returns two extras beyond the standard vee-validate API:

| Extra | Description |
|-------|-------------|
| `useFieldValue(path)` | Typed wrapper around vee-validate's `useFieldValue` — returns a `Ref` for the given field path |
| `validateSection(path)` | Validates only the fields whose path starts with the given prefix; useful for multi-step wizards |

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

### `restriction`

Adds built-in validation constraints to a field without writing custom rules:

```ts
{
  name: 'username',
  type: 'text',
  fieldOptions: { label: 'Username' },
  restriction: {
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$',
  },
}

{
  name: 'age',
  type: 'text',
  fieldOptions: { label: 'Age' },
  restriction: {
    minInclusive: 18,
    maxInclusive: 120,
  },
}

{
  name: 'price',
  type: 'text',
  fieldOptions: { label: 'Price' },
  restriction: {
    minExclusive: 0,
    fractionDigits: 2,
    totalDigits: 8,
  },
}

{
  name: 'status',
  type: 'text',
  fieldOptions: { label: 'Status' },
  restriction: {
    enumeration: ['active', 'inactive', 'pending'],
  },
}
```

| Restriction | What it validates |
|-------------|-------------------|
| `minLength` / `maxLength` | String length |
| `length` | Exact string length |
| `pattern` | Regex pattern |
| `minInclusive` / `maxInclusive` | Numeric range (inclusive) |
| `minExclusive` / `maxExclusive` | Numeric range (exclusive) |
| `enumeration` | Value must be one of the listed options |
| `fractionDigits` | Maximum number of decimal places |
| `totalDigits` | Maximum total significant digits |
| `whiteSpace` | `'preserve'`, `'replace'` (no tabs/newlines), or `'collapse'` (no leading/trailing/multiple spaces) |

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

  // Keep validating live once a field has an error (default: true)
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

### Extending Settings

You can add custom properties to the settings object by declaring `ExtendedSettingsProperties` in `defineMetadata`. This is useful for template-level display flags that every slot can read:

```ts
// MyFormTemplate.vue
const metadata = defineMetadata<
  { text: string },
  {},
  {},
  { showRequiredOrOptional?: 'optional' | 'required' }
>();
```

Every slot then receives the extended property via `settings`:

```vue
<template #default="{ required, settings: { showRequiredOrOptional } }">
  <span v-if="showRequiredOrOptional === 'optional' && !required">Optional</span>
</template>
```

Use `GetDynamicFormSettingsType` from your template file to get a typed settings alias for use in the form page:

```ts
import type { GetDynamicFormSettingsType } from '@bach.software/vue-dynamic-form';
import { metadata } from './MyFormTemplate.vue';

type FormSettings = GetDynamicFormSettingsType<typeof metadata>;
const settings: FormSettings = { showRequiredOrOptional: 'optional' };
```

---

Continue to [Step 4: Dynamic Fields](/guide/dynamic-fields) to make fields react to user input.
