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

If `name` is omitted, the field gets an auto-generated key of `field-${index}` (based on its position in the parent collection) in the form output.

### `type`

Type: `string` (constrained to your declared types + `'default'`)

Determines which slot in your `DynamicFormTemplate` handles this field. If no named slot matches, the library falls back to `#default` and `#default-input`.

```ts
{ name: 'country', type: 'select' }
```

### `path`

Type: `string`

Override the automatically derived path. Useful when the form value structure doesn't match how the fields are visually grouped — for example, when fields are rendered inside a parent group but need their values stored at the root, or vice versa.

```ts
// Fields are grouped visually under 'address' but the API shape is flat
{
  name: 'address',
  children: [
    { name: 'street', type: 'text', path: 'street' },  // → values.street
    { name: 'city',   type: 'text', path: 'city' },    // → values.city
    // without path: would be values.address.street, values.address.city
  ],
}

// Field rendered at root level but value stored nested to match API shape
{ name: 'id', type: 'text', path: 'user.id' }
// → values.user.id  (not values.id)
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

For group fields (fields with `children`), setting `minOccurs: 0` makes the entire group optional: as long as none of the children have a value, all children are treated as optional regardless of their own `minOccurs`. Once any child receives a value, each child reverts to its own `minOccurs`. This lets users leave an entire section blank, but enforces required fields the moment they start filling it in.

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

### `autoAddMinOccurs`

Type: `boolean` | Default: `true`

When `true` (default), array fields automatically add empty placeholder items on first render until the count reaches `minOccurs`. Set to `false` to start with an empty array and let the user add items manually.

```ts
{ name: 'contacts', minOccurs: 2, maxOccurs: 5, autoAddMinOccurs: false }
// Array starts empty — user must click "Add" to begin
```

::: tip
Setting `autoAddMinOccurs: false` also enables the remove button down to 0 items, since the automatic floor no longer applies.
:::

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

Type: `((field: ComputedPropsFieldType<FieldMetadata>, value: Ref<unknown>, childFields: Ref<Readonly<FieldMetadata>[]>) => void)[]`

An array of functions that run inside a Vue `computed()` in the field's component. Use them to change field properties in response to other reactive values.

```ts
const country = useFieldValue('country');

const fields = [
  {
    name: 'city',
    type: 'select',
    computedProps: [
      (field, value, childFields) => {
        // field       — writable clone of this field's metadata
        // value       — Ref to this field's current form value
        // childFields — Ref<Readonly<FieldMetadata>[]> of direct children's latest computed fields
        field.options = country.value === 'nl'
          ? [{ key: 'ams', value: 'Amsterdam' }]
          : [{ key: 'ber', value: 'Berlin' }];
      }
    ],
  },
]
```

- **`field`** — writable clone of this field's metadata. Write here to change properties reactively.
- **`value`** — `Ref` to this field's current form value. Read it to subscribe to this field's own value changes.
- **`childFields`** — `Ref<Readonly<FieldMetadata>[]>` containing the latest computed field of each direct child. The entries are read-only — they reflect the already-computed state after all `computedProps` have run, so mutations here have no effect. Read it to subscribe to changes in children's computed state (e.g. a child becoming `hidden` or `disabled`). For array fields the entries are the computed fields of each rendered occurrence.

**Read-only in `computedProps`:** `name`, `path`, `parent`, `children`, `choice`, `attributes`, `fieldOptions`, `maxOccurs`, `computedProps`, `isComplexType`, `computeOnChildValueChange`.

See the [Dynamic Fields guide](/guide/dynamic-fields) for full examples.

### `computeOnChildValueChange`

Type: `boolean` | Default: `false`

When `true`, `computedProps` re-runs whenever any child field's **form value** changes. By default, only direct reactive reads inside `computedProps` trigger re-evaluation.

To react to changes in a child's **computed metadata** (e.g. becoming `hidden` or `disabled`) use the `childFields` parameter of `computedProps` instead — no flag needed.

```ts
{
  name: 'address',
  computeOnChildValueChange: true,
  children: [...],
  computedProps: [
    (field) => {
      // re-runs when any child in 'address' changes its form value
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

const country = useFieldValue('personalDetails.country');

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
