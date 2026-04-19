# FieldMetadata

`FieldMetadata` is the type of each object in the array you pass to `DynamicForm`. Every property is optional unless noted.

Use `GetMetadataType` to get a fully typed alias for your specific template configuration. See [defineMetadata()](/reference/define-metadata#getmetadatatype).

## Core Identity

### `name`

Type: `string`

The key for this field in the form values object. Combined with parent names it builds the full dot-notated path.

```ts
{ name: 'email' }
// → values.email

// Inside a parent named 'contact':
// → values.contact.email
```

If `name` is omitted the field renders but produces no key in the form output.

### `type`

Type: `string` (constrained to your declared types + `'default'`)

Determines which slot in your `DynamicFormTemplate` handles this field. If no named slot matches, the library falls back to `#default` and `#default-input`.

```ts
{ name: 'country', type: 'select' }
```

### `path`

Type: `string`

Override the automatically derived path. Use when the form value structure doesn't match the template structure, for example when integrating with a fixed API shape.

```ts
{ name: 'phone', path: 'contact.primaryPhone' }
```

## Occurrence and Requirement

### `minOccurs`

Type: `number` | Default: `1`

Minimum number of times this field must be filled in.

| Value | Effect |
|-------|--------|
| `0` | Field is optional |
| `1` | Field is required (default) |
| `N > 1` | Array must have at least N filled occurrences |

```ts
{ name: 'nickname', minOccurs: 0 }      // optional
{ name: 'email',    minOccurs: 1 }      // required (default)
{ name: 'contacts', minOccurs: 2, maxOccurs: 5 }  // at least 2 required
```

For group fields, setting `minOccurs: 0` also suspends child validation until at least one child has a value.

### `maxOccurs`

Type: `number` | Default: `1`

Maximum number of times this field can be filled in.

| Value | Effect |
|-------|--------|
| `0` | Field is disabled (and so are all its children) |
| `1` | Field appears once (default) |
| `N > 1` | Field becomes a repeatable array |

```ts
{ name: 'phoneNumbers', maxOccurs: 3 }   // up to 3 entries
{ name: 'readOnly',     maxOccurs: 0 }   // disabled
```

## Validation

### `restriction`

Type: `object`

XSD-inspired data constraints. Each property generates a corresponding vee-validate rule automatically.

| Property | Type | Generates rule |
|----------|------|---------------|
| `minLength` | `number` | `xsd_minLength` |
| `maxLength` | `number` | `xsd_maxLength` |
| `length` | `number` | `xsd_length` (exact length) |
| `pattern` | `string` | `xsd_pattern` (regex) |
| `minInclusive` | `number` | `xsd_minInclusive` (value ≥ min) |
| `maxInclusive` | `number` | `xsd_maxInclusive` (value ≤ max) |
| `minExclusive` | `number` | `xsd_minExclusive` (value > min) |
| `maxExclusive` | `number` | `xsd_maxExclusive` (value < max) |
| `enumeration` | `unknown[]` | `xsd_enumeration` (value in list) |
| `whiteSpace` | `'preserve' \| 'replace' \| 'collapse'` | `xsd_whiteSpace` |
| `fractionDigits` | `number` | `xsd_fractionDigits` (max decimal places) |
| `totalDigits` | `number` | `xsd_totalDigits` (max significant digits) |

```ts
{
  name: 'postcode',
  type: 'text',
  restriction: {
    minLength: 4,
    maxLength: 10,
    pattern: '^[A-Z0-9 ]+$',
  },
}
```

### `validation`

Type: `RuleExpression<unknown>` (vee-validate rule expression)

Custom vee-validate validation rules applied in addition to `restriction`. Supports the pipe syntax:

```ts
{ validation: 'xsd_minLength:3|xsd_maxLength:50' }
```

Or a function:

```ts
{ validation: (value) => value !== 'forbidden' || 'This value is not allowed' }
```

### `fieldOptions`

Type: `Partial<FieldOptions>` (vee-validate)

Options passed directly to vee-validate's `useField()`.

| Property | Type | Description |
|----------|------|-------------|
| `label` | `string \| Ref<string>` | Display name used in error messages and slot props. Pass a `Ref` for a dynamic label. |
| `validateOnValueUpdate` | `boolean` | Overrides `settings.validateOnValueUpdate` for this specific field. |

```ts
{
  name: 'email',
  fieldOptions: {
    label: 'Email address',
    validateOnValueUpdate: false,   // override global setting for this field
  },
}
```

## Structure

### `children`

Type: `FieldMetadata[]`

Makes this field a parent/group. Its `name` becomes a path segment and its children are rendered inside it.

```ts
{
  name: 'address',
  fieldOptions: { label: 'Address' },
  children: [
    { name: 'street', type: 'text', fieldOptions: { label: 'Street' } },
    { name: 'city',   type: 'text', fieldOptions: { label: 'City' } },
  ],
}
```

When `minOccurs: 0` is set on the parent, all child requirements are suspended until at least one child has a value.

### `choice`

Type: `FieldMetadata[]`

Makes this field a choice container. Only one branch from the array should be filled in at a time. Once a branch receives a value, all siblings are disabled.

```ts
{
  name: 'contact',
  fieldOptions: { label: 'Preferred contact' },
  minOccurs: 1,
  choice: [
    { name: 'email', type: 'text', fieldOptions: { label: 'Email' } },
    { name: 'phone', type: 'text', fieldOptions: { label: 'Phone' } },
  ],
}
```

Combine `choice` with `maxOccurs > 1` to allow multiple independent choices (each picks its own branch).
Combine `choice` with group branches (using `children`) for complex branching forms.

### `attributes`

Type: `FieldMetadata[]`

Secondary metadata fields that appear alongside a field once it has a value. Inspired by XSD attributes: the parent field stores its primary value and the attributes are stored alongside it in a complex-type object.

```ts
{
  name: 'phone',
  type: 'text',
  fieldOptions: { label: 'Phone' },
  attributes: [
    { name: 'verified', type: 'checkbox', minOccurs: 0, fieldOptions: { label: 'Verified' } },
  ],
}
// → values.phone.value, values.phone.verified
```

When any `attributes` are defined, `isComplexType` is automatically set to `true`.

### `isComplexType`

Type: `boolean`

When `true`, the field value is stored under a sub-property (`value` by default) rather than directly. Automatically set when `attributes` are present.

```ts
{ name: 'phone', isComplexType: true }
// → values.phone.value = '...' instead of values.phone = '...'
```

The sub-property name can be changed via `DynamicFormSettings.complexTypeValueProperty`.

## Reactivity

### `computedProps`

Type: `((field: ComputedPropsType<FieldMetadata>, value: Ref<unknown>) => void)[]`

An array of functions that run inside a Vue `computed()` in the field's component. Use them to change field properties in response to other reactive values.

```ts
{
  name: 'city',
  type: 'select',
  computedProps: [
    (field) => {
      const country = useFieldValue('country');
      field.options = country.value === 'nl'
        ? [{ key: 'ams', value: 'Amsterdam' }]
        : [{ key: 'ber', value: 'Berlin' }];
    }
  ]
}
```

The `field` argument is a writable clone of the metadata. The `value` argument is a `Ref` to this field's current form value — read it to subscribe to changes.

**Read-only in `computedProps`:** `name`, `path`, `children`, `choice`, `attributes`, `fieldOptions`, `maxOccurs`, `computedProps`.

See the [Dynamic Fields guide](/guide/dynamic-fields) for full examples.

### `computeOnChildValueChange`

Type: `boolean` | Default: `false`

When `true`, `computedProps` re-runs whenever any child field's value changes. By default, only direct reactive reads inside `computedProps` trigger re-evaluation.

```ts
{
  name: 'address',
  computeOnChildValueChange: true,
  children: [...],
  computedProps: [
    (field) => {
      // re-runs when any child in 'address' changes
    }
  ]
}
```

## Read-only Runtime Properties

These properties are set by the library at render time and are available in `computedProps` and slot props as read-only references.

### `parent`

Type: `Readonly<FieldMetadata> | undefined`

A reference to the parent field's metadata. Read-only — mutations are not allowed.

```ts
computedProps: [
  (field) => {
    if (field.parent?.type === 'heading') {
      field.fullWidth = true;
    }
  }
]
```

## Extended Properties

Any key you declared in the second generic parameter of `defineMetadata()` is also available directly on the `FieldMetadata` object and in slot props:

```ts
// Declared: { options?: { key: string; value: string }[]; disabled?: boolean }

{
  name: 'country',
  type: 'select',
  options: [
    { key: 'nl', value: 'Netherlands' },
    { key: 'de', value: 'Germany' },
  ],
  disabled: false,
}
```

Access in your template:

```vue
<template #select-input="{ fieldMetadata }">
  <select :disabled="fieldMetadata.disabled">
    <option v-for="opt in fieldMetadata.options" ...>
  </select>
</template>
```

## Full Example

```ts
import type { Metadata } from './MyFormTemplate.vue';

const fields: Metadata[] = [
  {
    name: 'personalDetails',
    type: 'heading',
    fieldOptions: { label: 'Personal Details' },
    children: [
      {
        name: 'firstName',
        type: 'text',
        fieldOptions: { label: 'First name' },
        restriction: { minLength: 1, maxLength: 50 },
      },
      {
        name: 'lastName',
        type: 'text',
        fieldOptions: { label: 'Last name' },
        restriction: { minLength: 1, maxLength: 50 },
      },
      {
        name: 'country',
        type: 'select',
        fieldOptions: { label: 'Country' },
        options: [
          { key: 'nl', value: 'Netherlands' },
          { key: 'de', value: 'Germany' },
        ],
      },
      {
        name: 'city',
        type: 'select',
        fieldOptions: { label: 'City' },
        computedProps: [
          (field) => {
            const country = useFieldValue('personalDetails.country');
            field.options = country.value === 'nl'
              ? [{ key: 'ams', value: 'Amsterdam' }, { key: 'rtd', value: 'Rotterdam' }]
              : [{ key: 'ber', value: 'Berlin' }];
          }
        ],
      },
    ],
  },
  {
    name: 'contactMethod',
    fieldOptions: { label: 'How should we reach you?' },
    minOccurs: 1,
    choice: [
      { name: 'email', type: 'text', fieldOptions: { label: 'Email address' } },
      { name: 'phone', type: 'text', fieldOptions: { label: 'Phone number' } },
    ],
  },
  {
    name: 'pastExperiences',
    fieldOptions: { label: 'Past experience' },
    minOccurs: 0,
    maxOccurs: 5,
    children: [
      { name: 'company', type: 'text', fieldOptions: { label: 'Company' } },
      { name: 'role',    type: 'text', fieldOptions: { label: 'Role' } },
    ],
  },
];
```
