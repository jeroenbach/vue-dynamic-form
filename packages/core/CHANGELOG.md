# @bach.software/vue-dynamic-form

## 0.6.0

### Minor Changes

- a6998d5: Let a template control how the occurrences of a repeatable explicit choice ("add several, each one of several kinds") are numbered and ordered on screen, so the user sees one continuous list in the order they built it, rather than items that restart their numbering per kind and always sit grouped by kind.

  Everything here is opt-in and layers on top of FEAT-001's `explicitChoiceSelection`: the default numbering, order, and storage of a repeatable choice are unchanged, so existing consumers are unaffected. What you can now build:

  - **Continuous "item N of M" numbering across kinds**: the new `globalIndex` slot prop on `*-choice-array-item` / `default-choice-array-item` reports each occurrence's position across every branch (not just within its own kind), renumbering live on add and remove, so a badge can read 1, 2, 3, 4 regardless of which kinds were added.
  - **Show occurrences in the order they were added, this session** (opt-in `displayOrder: 'added'`): render occurrences interleaved by add-press order instead of grouped by kind. Backed by an ephemeral `insertionOrder` slot prop that lives only in memory, never in form values, and falls back to grouped order after a reload. Flipping the flag re-sorts in place without a remount.
  - **Persist that add-order into the saved data** (opt-in `preserveOrder`): write a 1-based `order` field into each occurrence's own values, kept contiguous 1..N as occurrences are added and removed, and normalized from loaded data at mount. Unlike `insertionOrder`, this survives a reload and saved data, at the cost of appearing in `values`. Requires every branch to have `children` (an object to hold the field); a scalar-leaf branch disables it for the whole choice with a development warning.

  Neither ordering flag changes `xsd_choiceMinOccurs` or occurrence-budget outcomes, and the storage model stays per-branch. Additive throughout: a choice that opts into none of these renders exactly as before.

- 6d893c4: Let a template show a selector first ("what kind of data do you want to enter?") and reveal a choice branch's fields only after the user picks it, instead of requiring at least one field to already hold a value before the branch counts as selected. This replaces the hidden-phantom-field workaround previously needed to fake a selection.

  Add the opt-in `explicitChoiceSelection` field metadata flag, plus the slot props to drive it (`addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`, `usedChoiceOccurrences`). What you can now build:

  - **Pick one, then fill in** (`maxOccurs: 1`): mark a branch selected before any of its fields hold a value, driven from the `-choice` slot.
  - **Add several, each one of several kinds** (`maxOccurs > 1`): add and remove occurrences of chosen branches, rendered through new `*-choice-array` / `*-choice-array-item` slots. Both fall back to the existing `*-choice` / `*-array-item` slots when a template doesn't define them, so a generic array-item card renders occurrences out of the box.
  - **Keep data across a switch** (opt-in `preserveOnSwitch`): when the user switches away from a `maxOccurs: 1` branch and back, restore what they had entered instead of clearing it. Values are stashed in an ephemeral, instance-local clone that is never written to form `values`.
  - **Per-kind ceiling** (opt-in `maxOccursTotal`): cap a single branch's occurrence count independently of the shared choice budget, a "at most 3 of this kind" limit with no XSD equivalent.

  Occurrence counting follows the same XSD-faithful rule the library already uses for automatic choice mode: a branch's own `maxOccurs` is the batch size within the shared choice budget (every group of up to that many raw items consumes one shared slot), not an independent total, and it is validated in the same choice-occurrence units as `xsd_choiceMinOccurs`.

  Additive and opt-in throughout: existing choices with none of these flags set render exactly as before.

## 0.5.0

### Minor Changes

- ad73109: Exported new utility helpers: `removeNullValues`, `checkTreeHasValue`, `mapEachMetadataItem`, and `setInPath`.

## 0.4.0

### Minor Changes

- aef251d: Extendable settings, now available in template slots

  - **`settings` in slots** — all template slots (`#default`, `#default-array`, `#default-choice`, `#group`, `#group-array`, etc.) now receive a `settings` prop, giving templates access to the active form settings without prop-drilling or `inject`.
  - **Extendable settings** — `defineMetadata()` accepts a new 4th generic `ExtendedSettingsProperties`, which is merged into the `DynamicFormSettings` type. This lets you add your own settings keys (e.g. `showOptionalInsteadOfRequired`) and have them fully typed end-to-end.
  - **`GetDynamicFormSettingsType` helper** — derives the correctly-typed `DynamicFormSettings` alias from a metadata configuration, analogous to `GetMetadataType`.

  **Breaking changes:**

  - The `#attributes` slot is now always rendered (visibility is controlled inside the slot). If your template relied on the slot being absent when the field had no attributes, move that guard inside your slot content.
  - `DynamicFormItemProps` no longer exposes `input`, `children`, `choice`, and `array` slot stubs — only `default` and `attributes` remain.
  - `ValidationRule` and related validation helpers are no longer re-exported from the package root.

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
