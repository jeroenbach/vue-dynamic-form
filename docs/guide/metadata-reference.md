# Metadata Reference

This page lists the field metadata properties supported by `packages/core`.

Use it as a lookup page after reading:

- [Define Metadata](/guide/define-metadata)
- [Templates](/guide/templates)
- [DynamicForm](/guide/dynamic-form)
- [How It Works](/guide/how-it-works)

## Core Identity

### `name?: string`

Logical field name. When omitted, the runtime generates a fallback name like `field-0`.

### `type?: ExtendedFieldTypes`

Your custom field type, such as `text`, `select`, `checkbox`, or `heading`.

Default: `'text'`

This value determines which slot names the template will try first.

### `path?: string`

Optional explicit value path.

If omitted, the path is derived from the parent path and the field name.

## Occurrence Control

### `minOccurs?: number`

Controls the minimum number of occurrences.

Common meanings:

- `0`: optional
- `1`: required
- `2+`: at least this many values/items must be present

Default: `1`

### `maxOccurs?: number`

Controls the maximum number of occurrences.

Common meanings:

- `1`: normal single field
- `2+`: array field
- `0`: disabled through runtime occurrence logic

Default: `1`

## Validation

### `restriction?`

Simple XSD-inspired restrictions.

Available keys:

- `minLength?: number`
- `maxLength?: number`
- `pattern?: string`
- `minInclusive?: number`
- `maxInclusive?: number`
- `minExclusive?: number`
- `maxExclusive?: number`
- `enumeration?: unknown[]`
- `length?: number`
- `whiteSpace?: 'preserve' | 'replace' | 'collapse'`
- `fractionDigits?: number`
- `totalDigits?: number`

These restrictions are automatically translated into built-in validation rules.

### `validation?: RuleExpression<unknown>`

Additional `vee-validate` rules.

Use this for custom rules or combinations not covered by `restriction`.

## Vee-Validate Options

### `fieldOptions?: Partial<FieldOptions<unknown>>`

Options forwarded to `vee-validate`'s `useField`.

The most commonly used property is:

- `label`

The label is especially important because it appears in:

- your slot props as `fieldContext.label`
- validation messages

## Structure

### `children?: FieldMetadata[]`

Turns the field into a grouped field with nested child fields.

Use this for nested objects and visual sections.

### `choice?: FieldMetadata[]`

Turns the field into a mutually exclusive choice structure.

Only one branch should be active at a time.

### `attributes?: FieldMetadata[]`

Adds attribute metadata to a field.

When attributes are present, the field automatically behaves as a complex type, meaning the value is stored as an object containing the actual value plus attribute values.

## Complex Types

### `isComplexType?: boolean`

Marks the field as a complex type even when it does not have `attributes`.

This is useful when the actual field value is stored inside a nested object property such as `{ value: '...' }`.

The property name defaults to `value` and can be changed with `settings.complexTypeValueProperty`.

## Runtime References

### `parent?: Readonly<FieldMetadata>`

Reference to the parent metadata field.

This is added internally by the runtime and is mainly useful for inspection. It should be treated as read-only.

## Dynamic Metadata

### `computedProps?: ((thisField, fieldValue) => void)[]`

Reactive metadata transforms executed in the field component.

Use them to change properties like:

- `disabled`
- `description`
- `minOccurs`
- custom properties like `options`

The function receives:

- `thisField`: a mutable clone of the current field metadata with some protected properties excluded
- `fieldValue`: a ref for the current field value

Good uses:

- make a field required based on another field
- load select options
- toggle helper text
- disable fields when a section is inactive

Important limitations:

- do not change `children`, `choice`, or `attributes` here
- do not change `fieldOptions` here
- do not change `maxOccurs` here

### `computeOnChildValueChange?: boolean`

Normally, `computedProps` on a parent field do not recompute when only a child value changes.

Set this to `true` when parent-level metadata depends on descendant values.

## Your Extended Properties

Every property you define in the second generic of `defineMetadata()` is also valid field metadata.

Examples:

- `options`
- `description`
- `disabled`
- `fullWidth`

These are not interpreted by the core runtime directly unless your `computedProps` or template use them. They exist so your template can stay strongly typed.

## Recommended Reading Order

For tutorial-style learning, explain properties in this order:

1. `name`
2. `type`
3. `fieldOptions.label`
4. `minOccurs`
5. `children`
6. `maxOccurs`
7. `choice`
8. `restriction`
9. `computedProps`
10. `attributes` and `isComplexType`

That sequence moves from "make one field appear" to "build advanced dynamic structures" without jumping too early into edge cases.
