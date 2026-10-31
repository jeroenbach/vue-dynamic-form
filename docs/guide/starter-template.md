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
| `password`           | password input with a show/hide toggle and an optional strength bar (`showStrengthBar`) |
| `heading`            | section card around its `children`                                                      |
| `wizardSummaryPage`  | review page inside a wizard, driven by `wizardSummary`                                  |

**Structural shapes** are all covered: plain groups (`children`), repeatable fields and sections (`maxOccurs > 1`), single and repeatable choices (`choice`), and multi-step wizards with a stepper, per-step validation, and a review page.

**Field properties** beyond the core ones include `description`, `helpText`, `placeholder`, `options`, `fullWidth`, `disabled`, `hide`, and a set of text overrides for every built-in label (`arrayAddButtonText`, `nextButtonText`, `stepText`, and so on), which also makes the template translatable. See [`StarterFieldProperties`](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/metadata.ts) for the full list.

**Settings**: pass `settings: { showRequiredOrOptional: 'optional' }` (or `'required'`) to `DynamicForm` to tag field labels, and `optionalText` to translate the tag.

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
