# @bach.software/vue-dynamic-form

## 0.3.0

### Minor Changes

- cb5b411: Improved defineMetadata() typing, reactive parent–child computedProps, partial form validation, auto-add first array item, and per-type array/choice slots.

  ## New features
  - **`slotProperties` in `defineMetadata()`** — `slotProps` is no longer a separate Vue prop on the
    template component; pass your slot properties as the third generic of `defineMetadata()` instead,
    where they are exposed through the `Attributes` slot as `slotProperties`. ⚠️ **Breaking for existing
    template components**: remove the hand-crafted `Props` interface from your template component and
    add it as a generic argument to `defineMetadata()`.
  - **`childFields` in `computedProps`** — `computedProps` functions now receive a `childFields` ref
    as their third argument, enabling parent fields to react to their children's computed state (e.g.
    hiding a parent when all children are hidden)
  - **`validatePartial()`** — new helper for validating a subset of form fields without triggering
    full-form validation; names/typing of related helpers improved
  - **Auto-add first array item** — array fields with `minOccurs > 0` now automatically insert the
    first occurrence on mount; opt out per-field with `addFirstItem: false`
  - **Per-type array/choice slots** — each field type can now define its own `{type}-array` and
    `{type}-choice` slots in `DynamicFormTemplate`, allowing per-type customisation of array and choice
    rendering without overriding the global slot

## 0.2.0

### Minor Changes

- a0c2763: Complete rewrite of @bach.software/vue-dynamic-form since v0.1.3.

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

## 0.1.3

### Patch Changes

- ea8448d: Updated readme to prevent downloads

## 0.1.2

### Patch Changes

- 8612186: Setup the basic solution with Storybook
  - Setup correct typing
  - Add Storybook stories for all components
  - Added Tailwind CSS support to the playground
  - Added ci/cd pipeline

## 0.1.1

### Patch Changes

- 9ec4840: Initial release
