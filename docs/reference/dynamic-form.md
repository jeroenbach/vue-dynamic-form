# DynamicForm

`DynamicForm` is the component you add to a `<form>` element. It reads the metadata array, builds a field tree, and renders each field through your template.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `template` | `Component` | Yes | Your `DynamicFormTemplate` SFC |
| `metadata` | `FieldMetadata[]` | Yes | Array of field definitions |
| `settings` | `DynamicFormSettings` | No | Validation behavior and message overrides |

## Basic Usage

```vue
<template>
  <form @submit.prevent="onSubmit">
    <DynamicForm
      :template="MyFormTemplate"
      :metadata="fields"
      :settings="settings"
    />
    <button type="submit">Submit</button>
  </form>
</template>
```

## useDynamicForm()

`useDynamicForm()` must be called in the same component (or a parent) as the `<form>` element. It is a typed wrapper around vee-validate's `useForm()`.

```ts
const {
  handleSubmit,
  values,
  errors,
  meta,
  setValues,
  resetForm,
  setErrors,
  useFieldValue,   // typed path-aware field value accessor
} = useDynamicForm<MyFormValues>();
```

`useFieldValue(path)` is a typed helper for reading a specific field value reactively. It is particularly useful inside `computedProps`:

```ts
const country = useDynamicForm().useFieldValue('address.country');
```

## Settings Reference

Pass a `DynamicFormSettings` object via `:settings` to control when validation runs and what messages are shown.

### Validation Timing

#### `validateOnValueUpdate`

Type: `boolean` | Default: `true`

When `true`, validation runs every time a field value changes. Set to `false` to validate only on submit.

```ts
{ validateOnValueUpdate: false }
```

#### `validateOnValueUpdateAfterSubmit`

Type: `boolean` | Default: `false`

When `true`, live validation activates only after the user's first submit attempt. Before that first submit, validation is deferred. This is a common UX pattern — don't show errors until the user tries to submit.

```ts
{ validateOnValueUpdateAfterSubmit: true }
```

::: tip Recommended combination
`validateOnValueUpdate: false` + `validateOnValueUpdateAfterSubmit: true` gives the cleanest UX: no errors on first fill-in, live feedback after the first submit.
:::

#### `validateOnBlur`

Type: `boolean` | Default: `false`

When `true`, validation runs when the user leaves a field (blur event). Works alongside `validateOnValueUpdate`.

```ts
{ validateOnBlur: true }
```

#### `validateWhenInError`

Type: `boolean` | Default: `false`

When `true`, a field that already has an error validates live on every value change, regardless of the other timing settings. Gives immediate feedback when fixing a known error.

```ts
{ validateWhenInError: true }
```

### Message Overrides

#### `messages`

Override the default text for any of the built-in validation rules. Each entry accepts a **string template** or a **function**.

**String templates** support these placeholders:

| Placeholder | Available in |
|-------------|-------------|
| `{field}` | All rules — the field's label |
| `{0}`, `{1}`, … | All rules — rule params by position |
| `{min}` | `minOccurs`, `choiceMinOccurs`, `minInclusive`, `minExclusive` |
| `{max}` | `maxInclusive`, `maxExclusive` |
| `{length}` | `minLength`, `maxLength`, `length` |
| `{pattern}` | `pattern` |
| `{mode}` | `whiteSpace` |
| `{digits}` | `fractionDigits`, `totalDigits` |

**Function form** receives vee-validate's `ValidationMessageContext`:

```ts
messages: {
  required: (ctx) => `${ctx.field} cannot be empty`,
}
```

#### Available Message Keys

| Key | Default trigger | Example message |
|-----|----------------|-----------------|
| `required` | Field has no value and `minOccurs >= 1` | `'{field} is required'` |
| `minOccurs` | Array has fewer items than `minOccurs` | `'At least {min} items required'` |
| `choiceMinOccurs` | Choice has fewer filled branches than `minOccurs` | `'Select at least {min} option in {field}'` |
| `minLength` | Value shorter than `restriction.minLength` | `'{field} must be at least {length} characters'` |
| `maxLength` | Value longer than `restriction.maxLength` | `'{field} may be at most {length} characters'` |
| `length` | Value length does not equal `restriction.length` | `'{field} must be exactly {length} characters'` |
| `pattern` | Value doesn't match `restriction.pattern` | `'{field} does not match the expected format'` |
| `minInclusive` | Value below `restriction.minInclusive` | `'{field} must be at least {min}'` |
| `maxInclusive` | Value above `restriction.maxInclusive` | `'{field} must be at most {max}'` |
| `minExclusive` | Value at or below `restriction.minExclusive` | `'{field} must be greater than {min}'` |
| `maxExclusive` | Value at or above `restriction.maxExclusive` | `'{field} must be less than {max}'` |
| `enumeration` | Value not in `restriction.enumeration` | `'{field} must be one of the allowed values'` |
| `whiteSpace` | Value violates `restriction.whiteSpace` mode | `'{field} contains invalid whitespace'` |
| `fractionDigits` | Value has more decimal places than `restriction.fractionDigits` | `'{field} may have at most {digits} decimal places'` |
| `totalDigits` | Value has more significant digits than `restriction.totalDigits` | `'{field} may have at most {digits} digits'` |

### `complexTypeValueProperty`

Type: `string` | Default: `'value'`

When a field has `attributes` or `isComplexType: true`, the form value is stored as an object: `{ value: '...' }`. This setting changes the property name from `value` to something else:

```ts
{ complexTypeValueProperty: 'text' }
// Field value becomes: { text: 'the actual value', ...attributes }
```

### `analytics`

Type: `boolean` | Default: `false`

When `true`, enables hidden DOM elements that expose render counters for each field. Used for testing that reactivity optimisations are working correctly. Not intended for production.

## Full Settings Example

```ts
import type { DynamicFormSettings } from '@bach.software/vue-dynamic-form';

const settings: DynamicFormSettings = {
  // Validate live only after first submit, then re-validate on blur and error
  validateOnValueUpdate: false,
  validateOnValueUpdateAfterSubmit: true,
  validateOnBlur: true,
  validateWhenInError: true,

  messages: {
    required:          '{field} is required',
    minOccurs:         'Add at least {min} item(s) to {field}',
    choiceMinOccurs:   'Choose at least {min} option(s) for {field}',
    minLength:         '{field} must be at least {length} characters',
    maxLength:         '{field} may not exceed {length} characters',
    length:            '{field} must be exactly {length} characters',
    pattern:           '{field} format is invalid',
    minInclusive:      '{field} must be {min} or more',
    maxInclusive:      '{field} must be {max} or less',
    minExclusive:      '{field} must be greater than {min}',
    maxExclusive:      '{field} must be less than {max}',
    enumeration:       '{field} must be one of the allowed values',
    whiteSpace:        '{field} contains invalid whitespace',
    fractionDigits:    '{field} may have at most {digits} decimal place(s)',
    totalDigits:       '{field} may have at most {digits} significant digit(s)',
  },
};
```
