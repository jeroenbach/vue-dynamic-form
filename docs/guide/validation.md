# Validation

The library extends `vee-validate` with metadata-driven rules and message resolution.

## Using `restriction`

The `restriction` property on a field definition is the primary way to add validation. The library translates each key into a registered vee-validate rule automatically:

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

## Built-in Rules

Each `restriction` key maps to an XSD-inspired vee-validate rule registered by the library:

| Restriction | Rule |
|-------------|------|
| *(required field)* | `xsd_required` |
| *(array minOccurs)* | `xsd_minOccurs` |
| *(choice minOccurs)* | `xsd_choiceMinOccurs` |
| `minLength` | `xsd_minLength` |
| `maxLength` | `xsd_maxLength` |
| `length` | `xsd_length` |
| `pattern` | `xsd_pattern` |
| `minInclusive` | `xsd_minInclusive` |
| `maxInclusive` | `xsd_maxInclusive` |
| `minExclusive` | `xsd_minExclusive` |
| `maxExclusive` | `xsd_maxExclusive` |
| `enumeration` | `xsd_enumeration` |
| `whiteSpace` | `xsd_whiteSpace` |
| `fractionDigits` | `xsd_fractionDigits` |
| `totalDigits` | `xsd_totalDigits` |

These rules are attached automatically — you never reference them by name unless writing custom `validation` expressions.

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
