# The Starter Template

Building your own template (the next chapters) gives you full control, but you don't have to start there. The starter template, `@bach.software/vue-dynamic-form-starter`, is a complete, ready-made template: hand it to `DynamicForm` and every field, group, array, choice, wizard, and review step in your metadata renders with a finished look. No CSS framework to install, no template to write yourself.

It is an installable dependency, not a scaffold you clone and detach from: you `pnpm add` it and keep it as a package. Everything stays overridable, so you can start with the full default rendering and replace exactly the parts your project needs.

This chapter gets you running; the complete API (every field type, property, slot, and CSS variable) lives in the [Starter Template reference](/reference/starter-form-template).

## Install

```bash
pnpm add @bach.software/vue-dynamic-form-starter @bach.software/vue-dynamic-form vee-validate vue
```

Import the one shipped stylesheet once, for example in your app entry:

```ts
import '@bach.software/vue-dynamic-form-starter/style.css';
```

It is plain CSS with semantic `sft-` prefixed class names; dark mode follows a `.dark` class on `<html>`. Icons are bundled, so there is nothing extra to install.

## Basic usage

Pass the template straight to `DynamicForm`. No wrapper is needed for the default rendering:

```vue
<script lang="ts" setup>
import type { StarterMetadata } from '@bach.software/vue-dynamic-form-starter';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import '@bach.software/vue-dynamic-form-starter/style.css';

const metadata: StarterMetadata[] = [
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

`StarterMetadata` types your metadata arrays against the built-in catalogue, and `StarterDynamicFormSettings` types the `settings` object the same way.

Every interactive example in this documentation renders through the starter template, so the [Examples](/examples/) section doubles as a tour of what it looks like.

## What you get

- **17 field types**: text inputs (`text`, `email`, `tel`, `url`, `number`), pickers (`select`, `radio`, `date`, `time`, `datetime-local`), richer controls (`checkbox`, `password`, `textarea`, `file`), and the layout types `heading`, `grid`, and `wizardSummaryPage`. The full catalogue, with the exact value each type stores, is in [Starter Field Types](/reference/starter-field-types).
- **Every structural shape**: plain groups (`children`), repeatable fields and sections (`maxOccurs > 1`), single and repeatable choices (`choice`), and multi-step wizards with a stepper, per-step validation, and a review page.
- **Field properties** for texts and chrome: `description`, `helpText`, `placeholder`, `suffix`, `options`, and more at the root of a node, plus grouped properties per piece of chrome (`array`, `choicePicker`, `password`, `number`, `file`, `wizardTexts`, ...). Every built-in text has a property, so the template is fully translatable. All of them are listed in [Starter Field Properties](/reference/starter-field-properties).
- **Grid layout**: every container lays its children out in a responsive CSS grid, controlled per field with `columns`, `colSpan`, and `colStart`:

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

  The spanning defaults, responsive per-breakpoint values, and the underlying utility classes are documented under [Layout properties](/reference/starter-field-properties#layout-properties).

- **Settings**: tag labels as required or optional, or mark valid fields with a success border. See [Starter Settings & Theming](/reference/starter-settings-theming).

## Make it yours

Three layers of customisation, each documented in the reference:

1. **Retheme with CSS variables.** Every colour is a `--sft-*` custom property; override a handful in your own CSS and the whole template follows:

   ```css
   :root {
     --sft-accent: #7c3aed;
     --sft-accent-hover: #6d28d9;
   }
   ```

   See [Theming with CSS variables](/reference/starter-settings-theming#theming-with-css-variables).

2. **Override parts of the template.** A thin wrapper component around `StarterFormTemplate` replaces exactly the slots you name (one control, one piece of chrome, or every icon) and keeps the default rendering for everything else. See [The wrapper pattern](/reference/starter-form-template#the-wrapper-pattern).

3. **Add your own field types.** `extendMetadata` layers project-specific field types and properties on top of the catalogue, fully type-checked. The [Extending The Starter Template](/guide/extending-starter) chapter at the end of this guide walks through it with a live demo; the API is documented in [extendMetadata()](/reference/starter-extend-metadata).

## Related

- [Starter Template reference](/reference/starter-form-template): the complete API of the package
- [Extending The Starter Template](/guide/extending-starter): adding project-specific field types with a live demo, at the end of this guide
- [Build a Template](/guide/building-templates): writing a template from scratch instead
