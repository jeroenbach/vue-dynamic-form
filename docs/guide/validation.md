# Validation

The library extends `vee-validate` with metadata-driven rules and message resolution.

## Built-in Rules

The core package registers XSD-inspired rules such as:

- `xsd_required`
- `xsd_minOccurs`
- `xsd_choiceMinOccurs`
- `xsd_minLength`
- `xsd_maxLength`
- `xsd_length`
- `xsd_pattern`
- `xsd_minInclusive`
- `xsd_maxInclusive`
- `xsd_minExclusive`
- `xsd_maxExclusive`
- `xsd_enumeration`
- `xsd_whiteSpace`
- `xsd_fractionDigits`
- `xsd_totalDigits`

These rules are attached automatically based on metadata.

## Message Sources

Messages resolve in this order:

1. `settings.messages`
2. `vee-validate` `configure({ generateMessage })`
3. default rule output

The message resolver supports:

- positional placeholders like `{0}`
- named placeholders like `{min}`, `{length}`, `{digits}`
- context placeholders like `{field}`

## Custom Validation

You can still provide custom `vee-validate` validation expressions in metadata:

```ts
{
  name: 'text',
  type: 'text',
  validation: 'xsd_minLength:3|xsd_maxLength:10',
}
```

The library splits multi-rule expressions into separate validation functions so multiple errors can be collected consistently.

## Example Configuration

```ts
const settings = {
  messages: {
    required: '{field} is required',
    minOccurs: 'At least {min} items required',
    choiceMinOccurs: 'Select at least {min} value(s) in {field}',
    minLength: 'The minimum length of {field} is {length}',
  },
};
```

## Interactive Example

<BasicFormExample name="individual" title="Focused Validation Example" description="A compact scenario for trying built-in validation, attributes, and form state." />

## Related Pages

- [DynamicForm](/guide/dynamic-form) for the `settings.messages` API
- [Metadata Reference](/guide/metadata-reference) for `restriction`, `validation`, and `fieldOptions`
