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

## Accessibility

Every control the starter template renders meets WCAG 2.2 AA for keyboard and screen-reader use, out of the box, with no setting to turn it off. This is a correctness guarantee, not an opt-in feature:

- **Label, description, and error are all programmatically associated** with their control. A screen reader announces the full context (label, help text, validation error) for every field type: text in all its HTML5 modes, textarea, select, radio group, file upload, checkbox, toggle switch, and password. Grouped controls get the right shape too: the radio group is named as a `radiogroup` by the field label, and the file upload's hidden native input is named by the field label rather than its visible "Choose file" trigger text.
- **Errors and password-strength changes are announced.** A validation error appearing after a blur or a failed submit is read out immediately. Typing a password announces its strength tier once, on blur, rather than interrupting every keystroke.
- **Every control is keyboard-operable.** This includes the password field's show/hide reveal toggle (a normal tab stop, not skipped), the file upload (the hidden native input is a normal tab stop with a visible ring on its trigger, and clearing a chosen file hands focus back to the input instead of dropping it), and the choice-card group, which follows the ARIA APG radio pattern: one Tab stop into the group, then arrow keys move the selection between cards, skipping any disabled card. The radio field gets the same pattern natively from the browser.
- **Focus moves for you.** On wizard step navigation and on a validation failure (a blocked step or a failed submit), focus moves to where the user needs to act next instead of being left stranded. See [Focus Management](/examples/wizard#focus-management) in the wizard example for the full step-change sequence; that page covers the wizard-specific mechanics this section only summarizes.

For a plain, non-wizard form, wire the exported `focusFirstInvalid(containerEl)` helper into your own `onInvalidSubmit` callback so a failed submit still takes the user to the first invalid field:

```ts
import { focusFirstInvalid } from '@bach.software/vue-dynamic-form-starter';
import { useDynamicForm } from '@bach.software/vue-dynamic-form';
import { ref } from 'vue';

const formRoot = ref<HTMLElement>();
const { handleSubmit } = useDynamicForm();

const onSubmit = handleSubmit(
  (values) => { /* ... */ },
  () => focusFirstInvalid(formRoot.value),
);
```

```vue-html
<form ref="formRoot" novalidate @submit.prevent="onSubmit">
```

`focusFirstInvalid` is a no-op when there is nothing invalid inside the container, so it is safe to call unconditionally from the invalid-submit callback.

## Make it yours

Three layers of customisation, each documented in the reference:

1. **Retheme with CSS variables.** Every colour is a `--sft-*` custom property; override a handful in your own CSS and the whole template follows:

   ```css
   :root {
     --sft-accent: #7c3aed;
     --sft-accent-hover: #6d28d9;
   }
   ```

   Two tokens drive the keyboard `:focus-visible` ring and exist purely for that purpose: `--sft-focus-visible` (inputs, selects, every button including the password reveal toggle, the toggle switch, and the stepper) and `--sft-focus-visible-choice` (choice cards only, kept separate so it can use a different accent colour from the rest of the form). See [Theming with CSS variables](/reference/starter-settings-theming#theming-with-css-variables).

2. **Override parts of the template.** A thin wrapper component around `StarterFormTemplate` replaces exactly the slots you name (one control, one piece of chrome, or every icon) and keeps the default rendering for everything else. See [The wrapper pattern](/reference/starter-form-template#the-wrapper-pattern).

3. **Add your own field types.** `extendMetadata` layers project-specific field types and properties on top of the catalogue, fully type-checked. The [Extending The Starter Template](/guide/extending-starter) chapter at the end of this guide walks through it with a live demo; the API is documented in [extendMetadata()](/reference/starter-extend-metadata).

## Related

- [Starter Template reference](/reference/starter-form-template): the complete API of the package
- [Extending The Starter Template](/guide/extending-starter): adding project-specific field types with a live demo, at the end of this guide
- [Build a Template](/guide/building-templates): writing a template from scratch instead
- [Wizard](/examples/wizard#focus-management): the full focus-management sequence for wizard navigation
