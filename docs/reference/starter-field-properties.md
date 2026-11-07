# Starter Field Properties

The properties the starter catalogue adds to every metadata node, on top of the core [FieldMetadata](/reference/field-metadata) properties (`name`, `type`, `minOccurs`, `restriction`, `children`, `choice`, and so on). They are typed by `StarterFieldProperties`.

Properties shared by many field types live at the root of the node. Everything that belongs to one piece of chrome is grouped under a single property (`array`, `choicePicker`, `password`, `checkbox`, `number`, `file`, `wizardSummary`, `wizardTexts`), which also keeps the template translatable: every built-in text has a property here.

## Root properties

### `description`

Type: `string`

Longer text under the label of a field, group, section card, or choice. On a choice branch it is also the picker card text unless [`choicePicker.description`](#choicepicker) overrides it.

### `helpText`

Type: `string`

Short helper text for a field; a wizard page's `helpText` becomes the step description in the stepper.

### `placeholder`

Type: `string`

Native placeholder of text-mode inputs and the disabled first option of a `select`.

### `suffix`

Type: `string`

Short unit label shown right after the input, e.g. `"min"`.

### `options`

Type: `{ key: string, value: string }[]`

The option list of a `select` or `radio` field. The model stores the chosen `key`; the `value` is the visible text.

### `iconName`

Type: `StarterIconName`

Glyph shown on this branch's choice picker card. The valid names are listed in the [icon registry](/reference/starter-form-template#icon-registry).

### `dependentOnMessage`

Type: `string`

Message shown on a field that is disabled because it depends on another field's value.

### `disabled`

Type: `boolean`

Disables the field (and the chrome shows it as such). Combined with the engine's own `disabled` slot prop; either one disables.

### `hide`

Type: `boolean`

Hides the field's rendering with `v-show`. The field stays registered, so its value and validation keep working; use the core `maxOccurs: 0` to disable a field entirely.

## Layout properties

Every container the template renders (section cards, groups, choice bodies, and the bare `grid` type) lays its children out in a CSS grid: one column on small screens, two columns from `768px` up. Three properties control that layout:

### `columns`

Type: `Responsive<1 | 2 | 3 | 4 | 5 | 6>`

Number of equal columns of the field's own children grid.

### `colSpan`

Type: `Responsive<1 | 2 | 3 | 4 | 5 | 6 | 'full'>`

How many columns the field spans inside its parent's grid; `'full'` takes the whole row.

### `colStart`

Type: `Responsive<1 | 2 | 3 | 4 | 5 | 6>`

The column the field starts on inside its parent's grid, e.g. to leave the rest of the previous row empty.

### Defaults and spanning rules

By default only input fields flow per column. Everything else (section cards, groups, choice groups, repeater items, and headings without children) spans the full row, so structure never ends up squeezed next to a field; set an explicit `colSpan` to narrow one. The chrome components carry this default themselves (`sft-span-full` on their root), so it also applies when you use them directly in a slot override.

### Responsive values

Each layout property accepts one value per breakpoint tier instead of a bare value. Tiers are mobile-first: `base` applies from `0`, `md` from `768px`, `lg` from `1024px`, and each tier holds until a larger one overrides it.

```ts
const section = {
  name: 'availability',
  type: 'heading',
  columns: { base: 2, lg: 4 },
  colSpan: { md: 2, lg: 3 },
};
```

A bare value applies from `md` up (one column below, so a span can never push a field off a narrow screen). Classes never inherit, so a parent's `columns` cannot leak into a nested section or grid.

### Utility classes

Each value maps to a prefixed utility class in the shipped stylesheet (`sft-cols-4`, `sft-span-full`, `sft-col-start-2`; the `base` and `lg` tiers carry an infix: `sft-cols-base-2`, `sft-cols-lg-4`), the same way Tailwind's `grid-cols-*` and `col-span-*` utilities work. No inline styles are involved, so your own CSS can always override the result. Gaps, alignment, and anything beyond columns and spans are design-system concerns: set them centrally in your own stylesheet on the grid containers (`.sft-grid`, `.sft-choice-group-body`, `.sft-grid-plain`).

The two tier widths are fixed in the stylesheet; see [Breakpoint widths](/reference/starter-settings-theming#breakpoint-widths) for the override that changes them.

## Grouped properties

### `array`

Chrome and texts of a repeatable field or section. The item texts (`newItemTitle`, `removeButtonText`, `removeAriaLabel`) are also read by repeatable-choice items.

| Key                  | Purpose                                                                      | Default                               |
| -------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| `itemName`           | Singular item name used in generated texts                                   |                                       |
| `itemNamePlural`     | Plural item name used in generated texts                                     |                                       |
| `itemFieldForTitle`  | Name of the child field whose value titles each repeater card                |                                       |
| `noItemsMessage`     | Empty-state message of a repeatable section                                  |                                       |
| `noItemsTitle`       | Empty-state title of a repeatable section                                    | `"No {itemNamePlural} added yet"`     |
| `addButtonText`      | Label of the add buttons                                                     | `"Add {itemName}"` or `"Add another"` |
| `addFirstButtonText` | Label of the empty-state add button                                          | `"Add a {itemName}"`                  |
| `newItemTitle`       | Placeholder title of a repeater card without a title value                   | `"New {itemName}"`                    |
| `removeButtonText`   | Label of the remove buttons                                                  | `"Remove"`                            |
| `removeAriaLabel`    | Aria label of a repeater card's remove button; `{number}` is the item number | `"Remove item {number}"`              |

### `choicePicker`

The branch picker of an explicit choice: the click-to-select cards, or the per-branch add bar of a repeatable choice. Named `choicePicker` because the core engine already owns the `choice` property (the branches themselves).

`show`, `addButtonText`, `limitReachedText`, and `ariaLabel` configure the picker as a whole and belong on the parent choice field. `description` is different: it is set on a branch itself (like the item texts under `array`) and overrides that one branch's card text.

| Key                | Purpose                                                                                                                                                          | Default                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `show`             | Renders the picker; without it an explicit choice shows no selection UI of its own                                                                               |                                              |
| `addButtonText`    | Label of a branch's add button; `{option}` is the branch title                                                                                                   | `"Add {option}"`                             |
| `limitReachedText` | Helper text next to a disabled add button; `{option}` is the branch title                                                                                        | `"The limit for {option} has been reached."` |
| `ariaLabel`        | Aria label of the radiogroup when the field has no label                                                                                                         | `"Choose an option"`                         |
| `description`      | On a branch: overrides that branch's own picker-card description, e.g. a short pitch on the card versus the fuller explanation shown once the branch is selected | the branch's `description`                   |

### `password`

Extras of a `password` field.

| Key               | Purpose                                                         | Default                                  |
| ----------------- | --------------------------------------------------------------- | ---------------------------------------- |
| `showStrengthBar` | Shows a strength bar under the input                            |                                          |
| `strengthLabels`  | Labels of the strength tiers (`weak`, `fair`, `good`, `strong`) | `"Weak"`, `"Fair"`, `"Good"`, `"Strong"` |
| `showAriaLabel`   | Aria label of the visibility toggle while hidden                | `"Show password"`                        |
| `hideAriaLabel`   | Aria label of the visibility toggle while visible               | `"Hide password"`                        |

### `checkbox`

| Key                | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `falseAsUndefined` | Store `undefined` instead of `false` when the toggle is off |

### `number`

Native spinner and stepping hints of a `number` field, forwarded as plain `min`/`max`/`step` attributes. Affordance only: they enforce nothing on submit, so pair them with a matching `restriction` (`minInclusive`/`maxInclusive`) for real validation.

| Key    | Purpose                 |
| ------ | ----------------------- |
| `min`  | Native `min` attribute  |
| `max`  | Native `max` attribute  |
| `step` | Native `step` attribute |

### `file`

Extras of a `file` field.

| Key              | Purpose                                                               | Default           |
| ---------------- | --------------------------------------------------------------------- | ----------------- |
| `accept`         | Native accept filter forwarded to the input, e.g. `".pdf,.doc,.docx"` |                   |
| `clearAriaLabel` | Aria label of the clear button; `{name}` is the chosen filename       | `"Remove {name}"` |

### `wizardSummary`

The review page of a wizard (a `wizardSummaryPage` field).

| Key                 | Purpose                                                                                                                                         | Default              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `groups`            | One card per review group, rendered through the standalone `ReviewGroup` component; each card's edit link jumps to the step with the same index |                      |
| `confirmation`      | Confirmation text above the submit footer                                                                                                       |                      |
| `confirmationTitle` | Heading above `confirmation`                                                                                                                    | `"Ready to submit?"` |

### `wizardTexts`

Texts of the wizard chrome, set on the wizard field itself. Named `wizardTexts` because the core engine already owns the `wizard` property (the wizard marker and config). Setting all of them makes the wizard fully translatable.

| Key                | Purpose                                                                                    | Default                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `submitButtonText` | Label of the submit button on the last step                                                |                                                                                     |
| `nextButtonText`   | Label of the next button                                                                   | `"Continue"`                                                                        |
| `prevButtonText`   | Label of the back button                                                                   | `"Back"`                                                                            |
| `stepText`         | Progress line; `{current}` and `{total}` are the step numbers                              | `"Step {current} of {total}"`                                                       |
| `stepperAriaLabel` | Aria label of the step navigation                                                          | `"Progress"`                                                                        |
| `stepAriaLabel`    | Aria label of a single step button; `{number}` and `{title}` are the step number and title | `"Step {number}: {title}"`                                                          |
| `stepErrorsText`   | Message above the footer on the last step when any step has errors                         | `"Some steps still contain errors. Fix the steps marked in red before submitting."` |

## Related

- [Starter Field Types](/reference/starter-field-types): which types read which properties
- [Settings & Theming](/reference/starter-settings-theming): form-wide settings and CSS variables
- [FieldMetadata](/reference/field-metadata): the core properties every node also has
