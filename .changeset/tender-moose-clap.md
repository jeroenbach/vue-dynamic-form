---
"@bach.software/vue-dynamic-form": minor
---

Complete rewrite of @bach.software/vue-dynamic-form since v0.1.3.

## New features

- **vee-validate integration** — full form state, submission handling, and field registration via `useField`
  / `useForm`; exposed through `useDynamicForm()`
- **XSD-inspired validation** — built-in rules: `xsd_required`, `xsd_minLength`, `xsd_maxLength`,  
  `xsd_length`, `xsd_pattern`, `xsd_minInclusive`, `xsd_maxInclusive`, `xsd_minExclusive`, `xsd_maxExclusive`,
  `xsd_enumeration`, `xsd_whiteSpace`, `xsd_fractionDigits`, `xsd_totalDigits`
- **`computedProps`** — per-field reactive functions that run inside a `computed()` in the field component,
  allowing dynamic metadata changes (options, required state, visibility) without re-rendering the full tree;
  includes infinite-loop detection
- **Array fields** — repeatable fields driven by `minOccurs` / `maxOccurs`; add/remove controls with  
  occurrence tracking and min/max enforcement
- **Choice fields** — mutually exclusive branches; once one branch has a value the siblings are disabled;
  supports nested groups and array choices
- **Attribute fields** — secondary metadata fields rendered alongside a field once it has a value;  
  automatically promotes the field to a complex type
- **`DynamicFormSettings`** — configurable validation timing (`validateOnBlur`, `validateOnValueUpdate`,  
  `validateOnValueUpdateAfterSubmit`, `validateWhenInError`) and overridable error messages with  
  named/positional placeholders
- **`defineMetadata()`** — typed configuration factory; connects field type names and extended field  
  properties to `DynamicFormTemplate` slots with full TypeScript inference
- **`GetMetadataType`** helper — derives the correctly typed `FieldMetadata` alias from a metadata
  configuration
- Source maps included in the published build
