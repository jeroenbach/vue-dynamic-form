# The Starter Template

Building your own template (the next chapters) gives you full control, but you don't have to start there. The starter template, `@bach.software/vue-dynamic-form-starter`, is a complete, ready-made template: hand it to `DynamicForm` and every field, group, array, choice, wizard, and review step in your metadata renders with a finished look. No CSS framework to install, no template to write yourself.

It is an installable dependency, not a scaffold you clone and detach from: you `pnpm add` it and keep it as a package. Everything stays overridable, so you can start with the full default rendering and replace exactly the parts your project needs. The [Extending The Starter Template](/examples/extending-starter) example shows that end to end.

## Install

```bash
pnpm add @bach.software/vue-dynamic-form-starter @bach.software/vue-dynamic-form vee-validate vue
```

Icons come from [Lucide](https://lucide.dev), bundled into the package, so there is nothing extra to install.

## Stylesheet

Import the one shipped stylesheet once, for example in your app entry:

```ts
import '@bach.software/vue-dynamic-form-starter/style.css';
```

It is plain CSS with semantic `sft-` prefixed class names. Dark mode follows a `.dark` class on `<html>` (the convention VitePress uses), with nothing extra to wire up.

## Basic usage

Pass the template straight to `DynamicForm`. No wrapper is needed for the default rendering:

```vue
<script lang="ts" setup>
import type { GetMetadataType } from '@bach.software/vue-dynamic-form';
import type { starterMetadata } from '@bach.software/vue-dynamic-form-starter';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import '@bach.software/vue-dynamic-form-starter/style.css';

type Metadata = GetMetadataType<typeof starterMetadata>;

const metadata: Metadata[] = [
  { name: 'firstName', fieldOptions: { label: 'First name' }, placeholder: 'Enter your first name' },
  { name: 'plan', type: 'select', fieldOptions: { label: 'Plan' }, options: [{ key: 'starter', value: 'Starter' }, { key: 'pro', value: 'Pro' }] },
  { name: 'newsletter', type: 'checkbox', fieldOptions: { label: 'Subscribe to the newsletter' }, minOccurs: 0 },
];

const { handleSubmit } = useDynamicForm();
const onSubmit = handleSubmit(values => console.log(values));
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <DynamicForm :metadata="metadata" :template="StarterFormTemplate" />
    <button type="submit">
      Submit
    </button>
  </form>
</template>
```

Every interactive example in this documentation renders through the starter template, so the [Examples](/examples/) section doubles as a tour of what it looks like.

## What you get

**Field types** (the `type` property of a metadata node):

| Type                 | Control                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `text` (the default) | text input                                                                              |
| `select`             | select dropdown driven by `options`                                                     |
| `checkbox`           | toggle switch                                                                           |
| `password`           | password input with a show/hide toggle and an optional strength bar (`password.showStrengthBar`) |
| `heading`            | section card around its `children`                                                      |
| `grid`               | bare CSS-grid `div` around its `children`, no card chrome; configured via `columns`     |
| `wizardSummaryPage`  | review page inside a wizard, driven by `wizardSummary.groups`                           |

**Structural shapes** are all covered: plain groups (`children`), repeatable fields and sections (`maxOccurs > 1`), single and repeatable choices (`choice`), and multi-step wizards with a stepper, per-step validation, and a review page.

**Field properties** shared by many field types live at the root of the metadata node: `description`, `helpText`, `placeholder`, `suffix`, `options`, `iconName`, `dependentOnMessage`, `columns`, `colSpan`, `colStart`, `disabled`, and `hide`. Everything that belongs to one piece of chrome is grouped under a single property: `array` (repeatable chrome and texts), `choicePicker` (the explicit-choice selection UI), `password`, `checkbox`, `wizardSummary` (the review page), and `wizardTexts` (every wizard label, which also makes the template translatable). See [`StarterFieldProperties`](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/metadata.ts) for the full list.

**Settings**: pass `settings: { showRequiredOrOptional: 'optional' }` (or `'required'`) to `DynamicForm` to tag field labels, and `optionalText` to translate the tag.

## Grid layout

Every container the template renders (section cards, groups, choice bodies, and the bare `grid` type) lays its children out in a CSS grid: one column on small screens, two columns from `768px` up. Three field properties control that layout:

- `columns` sets the number of equal columns of the field's **own children grid** (`1`-`6`).
- `colSpan` sets how many columns the field spans **inside its parent's grid** (`1`-`6`, or `'full'` for the whole row).
- `colStart` sets the column the field starts on inside its parent's grid, e.g. to leave the rest of the previous row empty.

```ts
const metadata = {
  name: 'availability',
  type: 'grid',
  columns: 4,
  children: [
    { name: 'monday', type: 'checkbox', fieldOptions: { label: 'Mon' } },
    { name: 'tuesday', type: 'checkbox', fieldOptions: { label: 'Tue' } },
    { name: 'wednesday', type: 'checkbox', fieldOptions: { label: 'Wed' } },
    { name: 'notes', fieldOptions: { label: 'Notes' }, colSpan: 'full' },
  ],
};
```

Each value maps to a prefixed utility class in the shipped stylesheet (`sft-cols-4`, `sft-span-full`, `sft-col-start-2`, ...), the same way Tailwind's `grid-cols-*` and `col-span-*` utilities work. No inline styles are involved, so your own CSS can always override the result. Gaps, alignment, and anything beyond columns and spans are design-system concerns: set them centrally in your own stylesheet on the grid containers (`.sft-grid`, `.sft-choice-group-body`, `.sft-grid-plain`).

### Responsive values

`columns`, `colSpan`, and `colStart` also accept one value per breakpoint tier instead of a bare value. Tiers are mobile-first: `base` applies from `0`, `md` from `768px`, `lg` from `1024px`, and each tier holds until a larger one overrides it.

```ts
columns: { base: 2, lg: 4 },
colSpan: { md: 2, lg: 3 },
```

A bare value applies from `md` up (one column below, so a span can never push a field off a narrow screen). Classes never inherit, so a parent's `columns` can not leak into a nested section or grid.

### Breakpoint widths

The two tier widths are fixed in the stylesheet (`768px` and `1024px`). If your design system uses different widths, redeclare the utility-class media blocks from the end of the shipped stylesheet in your own CSS with your widths; every rule is a single-class selector, so yours win by coming later.

## Theming with CSS variables

Every colour the stylesheet uses is a `--sft-*` custom property declared on `:root` (and re-declared under `:root.dark`). Override the variables in your own CSS to retheme the whole template without touching a single `sft-` rule:

```css
:root {
  --sft-accent: #7c3aed;
  --sft-accent-hover: #6d28d9;
  --sft-focus-border: #8b5cf6;
  --sft-focus-ring: #ddd6fe;
}
```

The classes themselves are single, low-specificity selectors without `!important`, so a plain rule of your own also wins when you want to restyle one element.

## Overriding parts of the template

Overriding needs a thin wrapper component, because Vue slots are the only way to hand your markup to the `:template`. The wrapper always forwards the `input` and `attributes` slots, which hand the engine's field and attribute renders to the built-in chrome, and then adds a slot for each thing you want to change:

```vue
<script lang="ts" setup>
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
</script>

<template>
  <StarterFormTemplate>
    <!-- Hands the engine's field and attribute renders to the built-in chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <!-- Overrides the built-in text control with your own. -->
    <template #default-input="{ fieldContext, fieldMetadata, disabled }">
      <input
        :value="fieldContext.value.value"
        :placeholder="fieldMetadata.placeholder"
        :disabled="disabled || fieldMetadata.disabled"
        @input="fieldContext.handleChange(($event.target as HTMLInputElement).value)"
      >
    </template>
  </StarterFormTemplate>
</template>
```

Use the wrapper as the template: `<DynamicForm :metadata="metadata" :template="MyFormTemplate" />`.

Slots follow the priority fallback of the core [`DynamicFormTemplate`](/reference/dynamic-form-template): the dedicated per-type slot first (for example `text-input`), then the matching `default-*` slot, then `default`. Overriding a slot replaces only that slot; everything else keeps its default rendering. `input` and `attributes` are reserved names: they carry the engine's field and attribute renders and are not override points themselves.

Two overridable slots deserve a warning:

- A consumer overriding `default-wizard-page` must keep the `v-show` gate on `isCurrent` and never switch to `v-if`, which would drop the page's fields from validation when the user navigates away.
- Redeclaring a built-in field type or property via `extendMetadata` replaces it instead of merging with it, so supply the matching slot as well.

## Icons

Glyphs render through a bounded, tree-shaken registry of Lucide icons. Pre-select one for a choice card with the `iconName` field property, typed as `StarterIconName`.

To replace every glyph with your own icon component, supply the `#icon` scoped slot on a wrapper around `StarterFormTemplate`:

```vue
<template>
  <StarterFormTemplate>
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>
    <template #icon="{ name, size, strokeWidth }">
      <MyIcon :name="name" :size="size" :strokeWidth="strokeWidth" />
    </template>
  </StarterFormTemplate>
</template>
```

`#icon` is only reachable through this wrapper pattern. `DynamicForm` forwards only the engine's own render to the template, never a consumer's slots, so passing `#icon` directly to `DynamicForm` does nothing.

## Adding your own field types

`extendMetadata` layers your own field types and field properties on top of the built-in catalogue, purely at the type level. Combined with the wrapper pattern above, you add a field type by declaring it and supplying its `<type>-input` slot.

The [Extending The Starter Template](/examples/extending-starter) example walks through this with a live demo.

## Related

- [Extending The Starter Template](/examples/extending-starter): a live example adding project-specific field types
- [Examples](/examples/): every demo renders through the starter template
- [Build a Template](/guide/building-templates): writing a template from scratch instead
