# Validation

The library extends `vee-validate` with metadata-driven rules and message resolution. This chapter shows the one thing you do day to day: constrain a field with `restriction`. The full rule catalogue and every edge case live in the [Validation Rules reference](/reference/validation-rules).

## Using `restriction`

Restrictions are inspired by [XSD](https://www.w3.org/TR/xmlschema-2/) (XML Schema), where they come built in as so-called facets: minLength, maxLength, pattern, fractionDigits, and so on. They proved to be a well-rounded set of declarative validations, so the library adopted them as-is. A nice bonus: when you generate a form from an XSD, its restrictions port over one-to-one.

The `restriction` property on a field definition is the primary way to add validation. The library translates each key into a registered vee-validate rule automatically:

```ts
const field = {
  name: 'username',
  type: 'text',
  fieldOptions: { label: 'Username' },
  restriction: {
    minLength: 3,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9_]+$',
  },
};
```

| Restriction                     | What it validates                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `minLength` / `maxLength`       | String length                                                                                       |
| `length`                        | Exact string length                                                                                 |
| `pattern`                       | Regex pattern                                                                                       |
| `minInclusive` / `maxInclusive` | Numeric range (inclusive)                                                                           |
| `minExclusive` / `maxExclusive` | Numeric range (exclusive)                                                                           |
| `enumeration`                   | Value must be one of the listed options                                                             |
| `fractionDigits`                | Maximum number of decimal places                                                                    |
| `totalDigits`                   | Maximum total significant digits                                                                    |
| `whiteSpace`                    | `'preserve'`, `'replace'` (no tabs/newlines), or `'collapse'` (no leading/trailing/multiple spaces) |

Requiredness and repetition are validated from the same properties that drive rendering: `minOccurs` makes a field required, `maxOccurs` caps an array, and a choice validates its branch count in choice-occurrence units. Each maps to a registered `xsd_*` rule (plus one `vdf_*` extension); the mapping and the per-rule edge cases are documented in the [Validation Rules reference](/reference/validation-rules).

## Custom Validation

You can still provide custom `vee-validate` validation expressions in metadata:

```ts
const field = {
  name: 'text',
  type: 'text',
  validation: 'xsd_minLength:3|xsd_maxLength:10',
};
```

The library splits multi-rule expressions into separate validation functions so multiple errors can be collected consistently.

## Customizing Messages

Messages resolve from `settings.messages` first, then vee-validate's `generateMessage`, then the rule's default. Templates support `{field}`, `{min}`, `{max}`, `{length}`, and positional placeholders:

```ts
const settings = {
  messages: {
    required: '{field} is required',
    minOccurs: 'At least {min} items required',
    maxOccurs: 'At most {max} items allowed',
    choiceMinOccurs: 'Select at least {min} value(s) in {field}',
    minLength: 'The minimum length of {field} is {length}',
  },
};
```

The full key list is in [Message Overrides](/reference/dynamic-form#message-overrides).

## Interactive Example

Every restriction below is declared in metadata, with no validation code:

<FormExampleValidationRestrictions />

For the other strategies (custom functions, async server-side checks, cross-field rules), each with its own live form, see the [Validation example](/examples/validation).
