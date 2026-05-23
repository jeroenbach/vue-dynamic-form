# DynamicForm

`DynamicForm` is the component you add to a `<form>` element. It reads the metadata array, builds a field tree, and renders each field through your template.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `template` | `Component` | Yes | Your `DynamicFormTemplate` SFC |
| `metadata` | `FieldMetadata \| FieldMetadata[]` | Yes | One field definition or an array of field definitions |
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

`useDynamicForm()` is an optional typed wrapper around vee-validate's `useForm()`. You can use `useForm()` directly if you prefer — `useDynamicForm()` just adds two extra helpers on top:

```ts
const {
  handleSubmit,
  values,
  errors,
  meta,
  setValues,
  resetForm,
  setErrors,
  useFieldValue,    // typed path-aware field value accessor
  validateSection,  // validates only the fields under a given path
} = useDynamicForm<MyFormValues>();
```

`useFieldValue(path)` is a typed helper for reading a specific field value reactively. It is particularly useful inside `computedProps`:

```ts
const country = useFieldValue('address.country');
```

`validateSection(path)` validates only the vee-validate fields registered under the given path prefix, returning the same `FormValidationResult` shape as `validate()`. See [useValidatePartialForm](/reference/use-validate-partial-form) for the full API and a wizard example.

### Options

`useDynamicForm()` accepts an optional `FormOptions` object forwarded directly to vee-validate's `useForm()`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialValues` | `PartialDeep<TValues> \| null` | `undefined` | Pre-populate form fields on mount |
| `initialErrors` | `Record<path, string \| undefined>` | `undefined` | Set initial validation errors by field path |
| `initialTouched` | `Record<path, boolean>` | `undefined` | Set initial touched state by field path |
| `validateOnMount` | `boolean` | `false` | Run validation immediately when the form mounts |
| `keepValuesOnUnmount` | `boolean \| Ref<boolean>` | `false` | Preserve form values when the component unmounts |
| `name` | `string` | `undefined` | Named form — used to scope nested forms |

```ts
const form = useDynamicForm<MyFormValues>({
  initialValues: { email: 'prefilled@example.com' },
  validateOnMount: true,
});
```

## Typed Settings

When your metadata declares extended settings properties, use `GetDynamicFormSettingsType` to derive the fully typed settings object:

```ts
import type { GetDynamicFormSettingsType } from '@bach.software/vue-dynamic-form';
import { metadata } from './MyFormTemplate.vue';

type FormSettings = GetDynamicFormSettingsType<typeof metadata>;

const settings: FormSettings = {
  showRequiredOrOptional: 'optional', // typed from ExtendedSettingsProperties
  validateOnBlur: true,               // always available from DynamicFormSettings
};
```

The settings object is injected into every template slot as the `settings` prop, so templates can react to it without threading values through field metadata. See [`defineMetadata` — ExtendedSettingsProperties](/reference/define-metadata#extendedsettingsproperties) for how to declare extended settings.

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

Defaults to `false` to stay consistent with vee-validate's out-of-the-box behavior.

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

Type: `boolean` | Default: `true`

When `true`, a field that already has an error validates live on every value change, regardless of the other timing settings. Gives immediate feedback when fixing a known error.

```ts
{ validateWhenInError: true }
```

### Message Overrides

#### `messages`

Override the default error text for the validation rules from [`FieldMetadata.restriction`](/reference/field-metadata#restriction) and occurrence constraints (`minOccurs`, `choice`). Each entry accepts a **string template** or a **function**.

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
| `choiceMinOccurs` | Choice has fewer filled branches than `minOccurs` [^1] | `'Select at least {min} option in {field}'` |
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

[^1]: Choice fields don't exist as entries in vee-validate's value tree, so the `xsd_choiceMinOccurs` rule itself always returns `false`. `DynamicFormTemplate` detects when no branch is filled and surfaces the message directly — the message setting still controls the text shown.

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
