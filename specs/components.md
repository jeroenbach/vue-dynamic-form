# Component & API inventory

Living inventory of the library's public surface. The spec-workflow agents consult this before proposing anything new; the developer updates it whenever a change touches the public surface (a new export, prop, slot, setting, or validation rule, or a behavioral change to one). Keep entries to one or two lines; the source and `CLAUDE.md`'s Architecture section carry the detail.

Everything listed as exported comes from `packages/core/src/index.ts` and ships in `@bach.software/vue-dynamic-form`. Changing any of it needs a changeset (see CLAUDE.md).

## Components (exported)

| Component | Role |
| --- | --- |
| `DynamicForm` | The runtime engine. Accepts `metadata` + a `template` component, normalises paths and defaults (`correctMetadataAndSetDefaults`), provides settings via provide/inject, renders the `DynamicFormItem` tree. |
| `DynamicFormItem` | The core recursive item. Registers with vee-validate (`useField`), evaluates `computedProps`, detects its shape (array / choice / parent / input) and delegates or renders into the template. The most complex file in the codebase. |
| `DynamicFormItemArray` | Renders repeatable nodes (`maxOccurs > 1`), one sub-tree per occurrence. |
| `DynamicFormItemChoice` | Renders mutually exclusive branches (`choice` non-empty). |
| `DynamicFormTemplate` | The rendering bridge for user templates. Dispatches to named slots with priority fallback (per-type slot → `default-input`/`default-array`/`default-array-item`/`default-choice` → `default`). Slot props typed via `defineMetadata`. |

## Composables & core (exported)

| Export | Role |
| --- | --- |
| `defineMetadata` | Pure type-level configuration carrier (`<FieldValueTypes, ExtendedFieldProperties, SlotProperties, ExtendedSettingsProperties>`); runtime values are empty stubs. |
| `useDynamicForm` | Wraps vee-validate's `useForm()`; adds `useFieldValue(path)` (typed path accessor) and `validateSection(sectionPath)` (wizard-step validation). |
| `useValidatePartialForm` | Partial-form validation. Quirk: when called in the same component as `useDynamicForm` it reads the form context from the instance's own `provides` instead of `inject`. |

## Types (exported)

`DynamicFormItemProps`, `DynamicFormSettings`, `FieldMetadata`, `GetDynamicFormSettingsType`, `GetMetadataType`, `MetadataConfiguration`, `RequireOnly`, `ValidationMessage`.

## Utils (exported)

`checkTreeHasValue`, `mapEachMetadataItem`, `removeNullValues`, `setInPath`.

Internal-only utils (not exported, free to change): `camelize`, `createValidation`, `getFieldLabel`, `hashField`, `isNullOrUndefined`, `normalizePath`, `overridePath`, `resolveMessage`, `splitValidationFunctions`.

## Validation rules (globally registered, `packages/core/src/core/validation.ts`)

`xsd_required`, `xsd_minOccurs`, `xsd_choiceMinOccurs`, `xsd_minLength`, `xsd_maxLength`, `xsd_length`, `xsd_pattern`, `xsd_minInclusive`, `xsd_maxInclusive`, `xsd_minExclusive`, `xsd_maxExclusive`, `xsd_enumeration`, `xsd_whiteSpace`, `xsd_fractionDigits`, `xsd_totalDigits`.

Message resolution priority: `settings.messages` → vee-validate `generateMessage` → rule default. Positional (`{0}`) and named (`{min}`, `{field}`) placeholders supported.

## Non-published surfaces

| Surface | Where | Notes |
| --- | --- | --- |
| `ElementPlusDynamicForm` | `packages/element-plus/` (private package) | Element Plus template implementation. |
| Example template | `packages/core/src/examples/` (`TestForm`, `TestFormTemplate`, `IconButton`) | Reference template used by tests and Storybook. |
| Storybook playground | `playgrounds/storybook/` | Template development playground, not published. |
| Docs site | `docs/` | VitePress, published to vue-dynamic-form.bach.software. |
