# Starter Settings & Theming

How to configure the starter template form-wide (the `settings` object) and how to restyle it (CSS variables, plain class overrides, and breakpoint widths).

## Settings

The starter adds three properties to the core `settings` object of `DynamicForm`. Type the object with `StarterDynamicFormSettings` to get these and the [core settings](/reference/dynamic-form#settings-reference) checked:

```vue
<script lang="ts" setup>
import type { StarterDynamicFormSettings } from '@bach.software/vue-dynamic-form-starter';

const settings: StarterDynamicFormSettings = {
  showRequiredOrOptional: 'optional',
  showValidState: true,
};
</script>

<template>
  <DynamicForm :metadata="metadata" :template="StarterFormTemplate" :settings="settings" />
</template>
```

### `showRequiredOrOptional`

Type: `'optional' | 'required'`

Tags field labels: `'optional'` tags every non-required field, `'required'` tags every required one.

### `optionalText`

Type: `string` | Default: `"Optional"`

The tag text next to a non-required field label when `showRequiredOrOptional` is `'optional'`.

### `showValidState`

Type: `boolean`

Marks a touched, valid input with a success border. Covers `text` (and the other text-mode types), `select`, `password`, and `textarea`. The inputs also carry a `data-field-state` attribute (`pristine`, `invalid`, or `valid`) you can target in CSS or tests.

## Theming with CSS variables

Every colour the stylesheet uses is a `--sft-*` custom property declared on `:root` and re-declared under `:root.dark` (dark mode follows a `.dark` class on `<html>`, the convention VitePress uses). Override the variables in your own CSS to retheme the whole template without touching a single `sft-` rule:

```css
:root {
  --sft-accent: #7c3aed;
  --sft-accent-hover: #6d28d9;
  --sft-focus-border: #8b5cf6;
  --sft-focus-ring: #ddd6fe;
}
```

The classes themselves are single, low-specificity selectors without `!important`, so a plain rule of your own also wins when you want to restyle one element.

| Group                  | Variables                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces               | `--sft-card-bg`, `--sft-card-border`, `--sft-card-shadow`, `--sft-muted-bg`, `--sft-muted-border`                                                                                                        |
| Text                   | `--sft-text`, `--sft-text-strong`, `--sft-text-muted`, `--sft-text-subtle`, `--sft-heading`, `--sft-placeholder`                                                                                         |
| Inputs                 | `--sft-input-bg`, `--sft-input-border`, `--sft-input-disabled-bg`, `--sft-input-disabled-text`                                                                                                           |
| Primary / focus accent | `--sft-accent`, `--sft-accent-hover`, `--sft-focus-border`, `--sft-focus-ring`                                                                                                                           |
| Choice accent          | `--sft-choice`, `--sft-choice-border-hover`, `--sft-choice-ring`, `--sft-choice-grad-top`, `--sft-choice-grad-bottom`                                                                                    |
| Accent pill            | `--sft-pill-bg`, `--sft-pill-text`                                                                                                                                                                       |
| Danger                 | `--sft-danger-border`, `--sft-danger-focus-border`, `--sft-danger-text`, `--sft-danger-ring`, `--sft-danger-soft-bg`, `--sft-danger-soft-border`, `--sft-danger-soft-text`, `--sft-danger-soft-hover-bg` |
| Status                 | `--sft-success`, `--sft-track`, `--sft-success-badge-bg`, `--sft-success-badge-text`                                                                                                                     |
| Confirmation block     | `--sft-confirm-bg`, `--sft-confirm-border`, `--sft-confirm-text`                                                                                                                                         |

## Breakpoint widths

The two layout tiers of the [layout properties](/reference/starter-field-properties#layout-properties) are fixed in the stylesheet: `md` from `768px` and `lg` from `1024px`. If your design system uses different widths, redeclare the utility-class media blocks from the end of the shipped stylesheet in your own CSS with your widths; every rule is a single-class selector, so yours win by coming later.

## Related

- [Starter Field Properties](/reference/starter-field-properties): per-field layout and text properties
- [DynamicForm settings](/reference/dynamic-form#settings-reference): the core settings these extend
