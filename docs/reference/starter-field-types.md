# Starter Field Types

The `type` values the starter catalogue understands, and the exact value each one stores in the form model. `text` is the default when `type` is omitted.

Structural shapes are not types: plain groups (`children`), repeatable fields and sections (`maxOccurs > 1`), choices (`choice`), and wizards are core engine features that work with every type on this page. See [FieldMetadata](/reference/field-metadata).

## Overview

| Type                                                    | Control                                   | Model value            |
| ------------------------------------------------------- | ----------------------------------------- | ---------------------- |
| [`text`](#text-and-the-other-text-mode-types) (default) | text input                                | `string`               |
| [`select`](#select)                                     | select dropdown                           | `string`               |
| [`checkbox`](#checkbox)                                 | toggle switch                             | `boolean \| undefined` |
| [`password`](#password)                                 | password input with show/hide toggle      | `string`               |
| [`textarea`](#textarea)                                 | auto-growing multi-line input             | `string`               |
| [`radio`](#radio)                                       | radio button group                        | `string`               |
| [`number`](#number)                                     | native number input                       | `string`               |
| [`email`](#text-and-the-other-text-mode-types)          | native email input                        | `string`               |
| [`tel`](#text-and-the-other-text-mode-types)            | native telephone input                    | `string`               |
| [`url`](#text-and-the-other-text-mode-types)            | native URL input                          | `string`               |
| [`date`](#date-time-and-datetime-local)                 | native date picker                        | `string`               |
| [`time`](#date-time-and-datetime-local)                 | native time picker                        | `string`               |
| [`datetime-local`](#date-time-and-datetime-local)       | native date-and-time picker               | `string`               |
| [`file`](#file)                                         | single-file upload                        | `File \| undefined`    |
| [`heading`](#heading)                                   | section card around its `children`        | no own value           |
| [`grid`](#grid)                                         | bare CSS-grid `div` around its `children` | no own value           |
| [`wizardSummaryPage`](#wizardsummarypage)               | review page inside a wizard               | no own value           |

## `text` and the other text-mode types

`text`, `email`, `tel`, and `url` all render the same text input; the non-`text` types forward their name as the native `type` attribute, which buys the matching mobile keyboard and basic browser affordances. The model is always a `string`.

All of them read the shared root properties `placeholder`, `suffix`, `description`, and `helpText`; see [Starter Field Properties](/reference/starter-field-properties).

## `select`

A select dropdown driven by the root `options` property:

```ts
const plan = {
  name: 'plan',
  type: 'select',
  fieldOptions: { label: 'Plan' },
  options: [
    { key: 'starter', value: 'Starter' },
    { key: 'pro', value: 'Pro' },
  ],
};
```

The model stores the chosen option's `key`. `placeholder` renders as a disabled first option.

## `radio`

A radio button group driven by the same root `options` property `select` reads. It is a sibling of `select` (one flat value), not the structural `choice` concept (mutually exclusive branches with their own fields).

## `checkbox`

A toggle switch storing `boolean | undefined`. By default an off toggle stores `false`; set the grouped property `checkbox: { falseAsUndefined: true }` to store `undefined` instead, which keeps an untouched optional toggle out of the submitted values.

## `password`

A password input with a show/hide visibility toggle. The grouped `password` property adds an optional strength bar and translates the toggle's accessible names; see [`password`](/reference/starter-field-properties#password).

## `textarea`

A multi-line text input that grows with its content between a minimum height and a vertical resize handle.

## `number`

A native number input whose model stays a `string`, never a JS number, matching every other text-mode type and avoiding the native `valueAsNumber` coercion.

The grouped `number` property (`min`, `max`, `step`) forwards native spinner and stepping hints. These are affordance only, they enforce nothing on submit: pair them with a `restriction` (`minInclusive`, `maxInclusive`, `totalDigits`, `fractionDigits`) for actual validation.

```ts
const duration = {
  name: 'duration',
  type: 'number',
  suffix: 'min',
  number: { min: 0, max: 240, step: 5 },
  restriction: { minInclusive: 0, maxInclusive: 240 },
};
```

## `date`, `time`, and `datetime-local`

Native pickers. The value is the browser's own string (`2026-01-31`, `14:30`, `2026-01-31T14:30`), stored unparsed.

## `file`

A single-file upload rendered as a styled trigger, a filename display, and a clear button. The model is `File | undefined`: it holds the browser's own `File` object once a user picks one, and `undefined` when empty. There is no multi-select, drag-and-drop, or preview.

- `xsd_required` treats a held `File` as present and `undefined` as absent, so a required attachment validates with no extra wiring.
- The displayed filename and clear button always reflect the field's current value, including after `resetForm`, `resetField`, or a programmatic `setFieldValue`; the component never remembers a value of its own.
- The grouped `file` property sets the native `accept` filter and the clear button's accessible name; see [`file`](/reference/starter-field-properties#file).

## `heading`

A section card around its `children`: a card with a title, optional `description`, and a grid body. Combined with `maxOccurs > 1` it becomes a repeatable section, and with `choice` it becomes a choice section; the chrome adapts automatically.

## `grid`

A bare layout container: its `children` render in a plain CSS-grid `div` with no card chrome. Configure the column count with the `columns` property:

```ts
const availability = {
  name: 'availability',
  type: 'grid',
  columns: 4,
  children: [
    { name: 'monday', type: 'checkbox', fieldOptions: { label: 'Mon' } },
    { name: 'tuesday', type: 'checkbox', fieldOptions: { label: 'Tue' } },
    { name: 'notes', fieldOptions: { label: 'Notes' }, colSpan: 'full' },
  ],
};
```

See [Layout properties](/reference/starter-field-properties#layout-properties) for `columns`, `colSpan`, and `colStart`.

## `wizardSummaryPage`

The review page inside a wizard, driven by the grouped `wizardSummary` property: one card per entry in `wizardSummary.groups` (rendered through the standalone `ReviewGroup` component, with an edit link back to the matching step), plus an optional confirmation block. See [`wizardSummary`](/reference/starter-field-properties#wizardsummary).

## Related

- [Starter Field Properties](/reference/starter-field-properties): every property these types read
- [StarterFormTemplate](/reference/starter-form-template): overriding how a type renders
- [extendMetadata](/reference/starter-extend-metadata): adding types of your own
