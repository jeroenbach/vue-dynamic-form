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
| *(array maxOccurs)* | `xsd_maxOccurs` |
| *(choice minOccurs)* | `xsd_choiceMinOccurs` |
| *(choice maxOccurs)* | `xsd_choiceMaxOccurs` |
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

### Array occurrence maximum (`xsd_maxOccurs`)

An array field fails `xsd_maxOccurs` once it holds more raw items than `maxOccurs` allows, counting empty placeholders the same way the "Add" affordance's own cap does. This only matters for data that arrives already over the limit (loaded `initialValues`, a prop set programmatically, an API response), since the "Add" affordance already stops a user from reaching that state through the UI.

XSD's `maxOccurs` has no `unbounded` representation in this library: `FieldMetadata.maxOccurs` is a plain `number` with a default of `1`, so an "unlimited" field needs a large finite number instead. That number is now a hard cap enforced by `xsd_maxOccurs`, not only a UI suggestion, so a large placeholder value used as a stand-in for "no limit" behaves as a real ceiling once data can exceed it.

### Choice occurrence maximum (`xsd_choiceMaxOccurs`)

A choice field fails `xsd_choiceMaxOccurs` once its `usedChoiceOccurrences` (the same choice-occurrence unit `xsd_choiceMinOccurs` and the "Add" affordance already use) exceeds the choice's own `maxOccurs`, in both automatic and explicit selection modes. As with the array rule, this only fires on data that arrives already over the limit.

### The `maxOccursTotal` backstop (non-XSD)

`maxOccursTotal` is also a registered validation rule, but it is a **non-XSD extension**: it carries no `xsd_` prefix and has no `<xs:choice>` equivalent. Plain `<xs:choice>` can bound how many times the choice repeats and how large one branch's own batch is, but it has no way to say "at most N of this branch across the whole choice"; that gap is exactly what `maxOccursTotal` fills for a choice branch that opts in. See [Capping a branch's total count](/examples/choices#capping-a-branch-s-total-count-maxoccurstotal) in the Choice Fields example for the full picture.

The rule fires when any branch's raw occurrence count exceeds that branch's own `maxOccursTotal`. Two things to keep in mind when reading its message:

- **It is a single choice-level aggregate, not a per-branch error.** `{field}` resolves to the choice's own anchor label, never the branch's, so the message cannot tell you which branch is over its cap. When several branches breach their own `maxOccursTotal` at once, `{max}`/`{0}` carry only the first offending branch's cap in declaration order, not every breached cap.
- **It can fire alongside the branch's own `xsd_maxOccurs`.** In automatic mode (and in a `maxOccurs: 1` choice whose branch is itself an array), an over-limit branch renders as a real array field whose own headroom is clamped to `maxOccursTotal`, so its inline `xsd_maxOccurs` error can appear at the branch's own slot at the same time as the choice-level `maxOccursTotal` error at the choice's anchor. This is expected, not a duplicate or conflicting signal: the inline error renders at the offending branch itself, while the aggregate confirms the choice-level cap.

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
    maxOccurs: 'At most {max} items allowed',
    choiceMinOccurs: 'Select at least {min} value(s) in {field}',
    choiceMaxOccurs: 'Select at most {max} value(s) in {field}',
    maxOccursTotal: 'At most {max} of this kind allowed',
    minLength: 'The minimum length of {field} is {length}',
  },
};
```

## Interactive Example
<FormExampleValidation />
