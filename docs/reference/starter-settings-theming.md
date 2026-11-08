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

Colour, corner radius, and typography are all `--sft-*` custom properties declared on `:root`. Override them in your own CSS to retheme the whole template without touching a single `sft-` rule. Dark mode follows a `.dark` class on `<html>` (the convention VitePress uses); declare your dark values under `:root.dark`:

```css
:root {
  --sft-accent: #7c3aed;
  --sft-accent-hover: #6d28d9;
  --sft-focus-border: #8b5cf6;
  --sft-focus-ring: #ddd6fe;
  --sft-radius-xl: 4px;
  --sft-font-size-md: 15px;
}

:root.dark {
  --sft-accent: #a78bfa;
  --sft-accent-hover: #c4b5fd;
}
```

When a change goes beyond what the variables expose, restyle the element directly: write a plain rule against its `sft-` class in your own stylesheet. Every shipped selector is a single low-specificity class, so your rule wins simply by loading after the starter stylesheet. You never need `!important` or extra-specific selectors.

### The complete `--sft-*` contract

Every custom property the stylesheet declares on `:root` is listed below, with its purpose and default value. This is the complete list: nothing else is themeable, and the names are stable (renamed or removed only in a major release), so a theme built on this table keeps working across minor and patch updates.

| Variable                     | Purpose                                                                                                             | Default                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `--sft-accent`               | Primary accent colour (switch-on track, active step dot, primary button background)                                 | `#0084d1`                                                           |
| `--sft-accent-hover`         | Primary button hover background                                                                                     | `#0069a8`                                                           |
| `--sft-card-bg`              | Card and panel background (section cards, repeater, choice cards, default buttons, icon-catalogue tiles)            | `#ffffff`                                                           |
| `--sft-card-border`          | Card and panel border (section cards, group divider, switch field, repeater, choice cards, review rows, icon tiles) | `#e2e8f0`                                                           |
| `--sft-card-shadow`          | Default card drop shadow (section cards, selected choice card)                                                      | `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)` |
| `--sft-choice`               | Selected-choice accent (border, radio dot border, radio dot fill)                                                   | `#4f39f6`                                                           |
| `--sft-choice-border-hover`  | Choice card hover border                                                                                            | `#a3b3ff`                                                           |
| `--sft-choice-grad-bottom`   | Bottom stop of the selected choice card's background gradient                                                       | `#ffffff`                                                           |
| `--sft-choice-grad-top`      | Top stop of the selected choice card's background gradient                                                          | `#eef2ff`                                                           |
| `--sft-choice-ring`          | Choice card focus ring                                                                                              | `#a3b3ff`                                                           |
| `--sft-confirm-bg`           | Wizard confirmation banner background                                                                               | `#ecfdf5`                                                           |
| `--sft-confirm-border`       | Wizard confirmation banner border                                                                                   | `#a4f4cf`                                                           |
| `--sft-confirm-text`         | Wizard confirmation banner text                                                                                     | `#004f3b`                                                           |
| `--sft-danger-border`        | Invalid-state border (input, switch field, error step dot background)                                               | `#fb2c36`                                                           |
| `--sft-danger-focus-border`  | Invalid input's focus border                                                                                        | `#fb2c36`                                                           |
| `--sft-danger-ring`          | Invalid-state focus ring (input, error step dot ring)                                                               | `#ffc9c9`                                                           |
| `--sft-danger-soft-bg`       | Soft danger banner background (wizard step-errors alert)                                                            | `#fef2f2`                                                           |
| `--sft-danger-soft-border`   | Soft danger banner border                                                                                           | `#ffc9c9`                                                           |
| `--sft-danger-soft-hover-bg` | Soft danger button hover background                                                                                 | `#ffe2e2`                                                           |
| `--sft-danger-soft-text`     | Soft danger banner text                                                                                             | `#c10007`                                                           |
| `--sft-danger-text`          | Error message text                                                                                                  | `#e7000b`                                                           |
| `--sft-focus-border`         | Default input focus border                                                                                          | `#00a6f4`                                                           |
| `--sft-focus-ring`           | Default input focus ring                                                                                            | `#b8e6fe`                                                           |
| `--sft-focus-visible`        | Keyboard `:focus-visible` ring (inputs, selects, every button, the toggle switch, the stepper, the wizard page)     | `#0084d1`                                                           |
| `--sft-focus-visible-choice` | Keyboard `:focus-visible` ring for choice cards only, kept separate from the primary accent family                  | `#4f39f6`                                                           |
| `--sft-font-mono`            | Monospace font stack for code snippets (submission reference, icon-catalogue names)                                 | `ui-monospace, SFMono-Regular, Menlo, monospace`                    |
| `--sft-font-size-2xl`        | Wizard page title size                                                                                              | `24px`                                                              |
| `--sft-font-size-lg`         | Section title size                                                                                                  | `18px`                                                              |
| `--sft-font-size-md`         | Default body and control text size                                                                                  | `14px`                                                              |
| `--sft-font-size-sm`         | Small text size (pills, tags, captions, helper and hint text)                                                       | `12px`                                                              |
| `--sft-font-size-xl`         | Success screen title size                                                                                           | `20px`                                                              |
| `--sft-font-size-xs`         | Icon-catalogue caption size                                                                                         | `11px`                                                              |
| `--sft-font-weight-medium`   | Medium text weight (switch field label, strength label, buttons, confirm emphasis)                                  | `500`                                                               |
| `--sft-font-weight-semibold` | Semibold text weight (headings, titles, pills, badges)                                                              | `600`                                                               |
| `--sft-heading`              | Heading text colour (section title, wizard title, success title)                                                    | `#0f172b`                                                           |
| `--sft-input-bg`             | Text/select input background                                                                                        | `#ffffff`                                                           |
| `--sft-input-border`         | Text/select input resting border                                                                                    | `#e5e7eb`                                                           |
| `--sft-input-disabled-bg`    | Disabled input background                                                                                           | `#f8fafc`                                                           |
| `--sft-input-disabled-text`  | Disabled input text                                                                                                 | `#62748e`                                                           |
| `--sft-muted-bg`             | Muted panel background (dependent placeholder, switch field, empty state, choice group, review header, timeline)    | `#f8fafc`                                                           |
| `--sft-muted-border`         | Dashed muted panel border (dependent placeholder, empty state, choice group)                                        | `#cad5e2`                                                           |
| `--sft-pill-bg`              | Pill/badge background                                                                                               | `#eef2ff`                                                           |
| `--sft-pill-text`            | Pill/badge text, choice-card icon colour                                                                            | `#432dd7`                                                           |
| `--sft-placeholder`          | Input placeholder text                                                                                              | `#90a1b9`                                                           |
| `--sft-radius-lg`            | Corner radius: icon-catalogue demo tile                                                                             | `10px`                                                              |
| `--sft-radius-md`            | Corner radius: input, textarea, radio option, dependent placeholder, choice group, wizard alert, JSON panel         | `8px`                                                               |
| `--sft-radius-pill`          | Corner radius: fully rounded (pills, badges, radio dots, switch track/thumb, step dots)                             | `9999px`                                                            |
| `--sft-radius-sm`            | Corner radius: buttons, the file field's clear button                                                               | `6px`                                                               |
| `--sft-radius-xl`            | Corner radius: section, switch field, repeater, empty state, choice card, review group, confirm banner, timeline    | `12px`                                                              |
| `--sft-radius-xs`            | Corner radius: the wizard page container's programmatic focus outline                                               | `4px`                                                               |
| `--sft-success`              | Valid-state border (opt-in via `showValidState`)                                                                    | `#00bc7d`                                                           |
| `--sft-success-badge-bg`     | Submission success badge background                                                                                 | `#d0fae5`                                                           |
| `--sft-success-badge-text`   | Submission success badge icon colour                                                                                | `#009966`                                                           |
| `--sft-text`                 | Primary body text colour                                                                                            | `#0f172b`                                                           |
| `--sft-text-muted`           | Muted secondary text colour                                                                                         | `#45556c`                                                           |
| `--sft-text-strong`          | Emphasized text colour (labels, titles, review values)                                                              | `#1d293d`                                                           |
| `--sft-text-subtle`          | Subtle tertiary text colour (descriptions, hints, captions)                                                         | `#62748e`                                                           |
| `--sft-track`                | Password-strength meter track background                                                                            | `#e2e8f0`                                                           |

A few of these (`--sft-radius-md`, `--sft-radius-xl`, `--sft-radius-pill`) are reused across several unrelated pieces of chrome that happen to share the same shape today; overriding one of them changes all of its listed call sites together, not just one. The table shows each colour's light-mode default; a handful are re-declared under `:root.dark` with a dark value (for example `--sft-focus-visible` brightens to `#38bdf8` on the near-black card).

## Breakpoint widths

The grid tiers of the [layout properties](/reference/starter-field-properties#layout-properties) switch at fixed widths: `md` from `768px` and `lg` from `1024px`. The widths are compiled into the stylesheet's `@media` blocks, and CSS custom properties cannot drive media queries, so there is no `--sft-*` variable for them. Using different widths means overriding the shipped rules at your own widths.

The rules that switch at `768px` are the built-in two-column grids plus the `md`-tier utility classes. All of them are plain low-specificity selectors, so your copies win by loading after the starter stylesheet. For example, to switch to multi-column layout at `640px` instead of `768px`:

```css
@media (min-width: 640px) {
  /* built-in two-column grids: sections and groups, choice groups, choice cards */
  .sft-grid { grid-template-columns: 1fr 1fr; }
  .sft-choice-group-body { grid-template-columns: 1fr 1fr; }
  .sft-choice-grid.cols-2 { grid-template-columns: 1fr 1fr; }
  .sft-choice-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }

  /* md-tier utility classes; repeat each pattern for the values your form uses (1 to 6) */
  .sft-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sft-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .sft-span-full { grid-column: 1 / -1; }
  .sft-span-2 { grid-column: span 2 / span 2; }
  .sft-col-start-2 { grid-column-start: 2; }
}
```

Between `640px` and `768px` only your rules apply. From `768px` up the shipped rules apply as well, but they set the same values, so nothing changes. The `lg` tier moves the same way with the `-lg-` classes (`.sft-cols-lg-2`, `.sft-span-lg-full`, ...).

Moving a tier **up** (say `md` at `900px`) needs one extra step, because the shipped `768px` rules would still create columns between `768px` and `900px`. First reset those classes back to one column at `768px`, then declare the real values at your width; both blocks win over the shipped ones by coming later:

```css
@media (min-width: 768px) {
  .sft-grid, .sft-choice-group-body, .sft-cols-2, .sft-cols-3 { grid-template-columns: 1fr; }
  .sft-span-2 { grid-column: auto; }
  .sft-col-start-2 { grid-column-start: auto; }
}

@media (min-width: 900px) {
  .sft-grid { grid-template-columns: 1fr 1fr; }
  .sft-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  /* ...the rest of the 640px example, at 900px */
}
```

A few cosmetic rules share these widths and can be overridden the same way if you want them to follow: the group header switches from stacked to one row at `768px`, inputs pin their desktop font size (`--sft-font-size-md`) at `768px`, and the wizard hides step labels and the helper text below `640px`.

## Related

- [Starter Field Properties](/reference/starter-field-properties): per-field layout and text properties
- [DynamicForm settings](/reference/dynamic-form#settings-reference): the core settings these extend
