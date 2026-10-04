# @bach.software/vue-dynamic-form-starter

A portable, Tailwind-free default form template for [`@bach.software/vue-dynamic-form`](https://github.com/jeroenbach/vue-dynamic-form). Hand it to `DynamicForm` and every field, group, array, choice, wizard, and review step in your metadata renders with a complete, good-looking skin, with no CSS framework to install and no template to write yourself.

This is an installable dependency, not a cloneable scaffold. "Starter" describes the result it gives you (a complete starting look for your form), not a project generator: you `pnpm add` it like any other package and keep it as a dependency, the same way you would `@bach.software/vue-dynamic-form-element-plus`. There is no CLI, no copied source, nothing to detach from.

It is a drop-in counterpart of the core `DynamicFormTemplate`: the same slot names, the same priority fallback, and every slot overridable with the starter markup as its default content.

## Install

The package is not published yet. The name and peer set below are final; confirm the version or tag at publish time.

```sh
pnpm add @bach.software/vue-dynamic-form-starter @bach.software/vue-dynamic-form vee-validate vue
```

No `element-plus` and no Tailwind. Icons come from [Lucide](https://lucide.dev) (`@lucide/vue`), bundled into this package so it works out of the box; a consumer never installs it directly.

## Stylesheet

Import the one shipped stylesheet once, for example in your app entry or next to the form:

```ts
import '@bach.software/vue-dynamic-form-starter/style.css';
```

It is plain CSS: semantic `sft-` prefixed class names, no Tailwind or other build-time framework required. Dark mode follows the same `.dark` class VitePress toggles on `<html>`; nothing extra to wire up.

## Bare usage

Pass the template to `DynamicForm`. No wrapper is needed, and this gives you the full starter rendering for every field type and every structural shape, including wizards:

```vue
<script lang="ts" setup>
import type { DefineComponent } from 'vue';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import '@bach.software/vue-dynamic-form-starter/style.css';

// `StarterFormTemplate` is a generic component, which `vue-tsc` does not accept for the `template` prop as is.
const template = StarterFormTemplate as unknown as DefineComponent<object, object, any>;

const metadata = [
  { name: 'firstName', fieldOptions: { label: 'First name' }, placeholder: 'Enter your first name' },
  { name: 'plan', type: 'select', fieldOptions: { label: 'Plan' }, options: [{ key: 'starter', value: 'Starter' }, { key: 'pro', value: 'Pro' }] },
  { name: 'newsletter', type: 'checkbox', fieldOptions: { label: 'Subscribe to the newsletter' }, minOccurs: 0 },
];

const { handleSubmit } = useDynamicForm();
const onSubmit = handleSubmit(values => console.log(values));
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <DynamicForm :metadata="metadata" :template="template" />
    <button type="submit">
      Submit
    </button>
  </form>
</template>
```

## Overriding a control

Overriding needs a thin wrapper component, because Vue slots are the only way to hand your markup to the `:template`. The wrapper always forwards the `input` slot, which hands the engine's render to the built-in chrome. Then add a slot for each thing you want to change:

```vue
<script lang="ts" setup>
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
</script>

<template>
  <StarterFormTemplate>
    <!-- Hands the engine's field render to the built-in chrome. -->
    <template #input="s">
      <slot v-bind="s" />
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

`input` is the one reserved slot name: it carries the engine's render, which is why the wrapper forwards it, and it is not an override point itself.

### Supported slots

| Family                 | Slots                                                                                                                                                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural             | `default`, `default-input`, `default-array`, `heading-array`, `heading-array-item`, `default-choice`, `heading-choice`, `heading-choice-array`, `default-choice-array-item`, `default-wizard`, `default-wizard-page`, `wizardSummaryPage` |
| Field wrapper          | `heading`, `checkbox`                                                                                                                                                                                                                     |
| Input, one per control | `select-input`, `checkbox-input`, `password-input`                                                                                                                                                                                        |

Slots are chosen with the priority fallback of the core `DynamicFormTemplate`: the dedicated per-type slot first, then the matching `default-*` slot, then `default`. Overriding `default-input` replaces every plain text-like control at once. Overriding a slot replaces only that slot; everything else keeps its default rendering.

A consumer overriding `default-wizard-page` must keep the `v-show` gate on `isCurrent` and never switch to `v-if`, which would drop the page's fields from validation when the user navigates away.

Any other slot you supply, for example one for a field type you added, is passed on to the dispatcher unchanged.

## Icons

Icons render through [Lucide](https://lucide.dev) by default: a bounded, tree-shaken registry of names (`chevronLeft`, `chevronRight`, `check`, `trash`, `plus`, `zap`, `users`, `grid`, `pencil`, `checkCircle`, `loader`, `refreshCw`, `eye`, `eyeOff`, plus a sample set for choice-card decoration such as `building2`, `rocket`, `calendar`, `briefcase`, `shield`, `sparkles`). Pre-select one for a choice option with the `iconName` field property, typed as `StarterIconName`.

To replace every glyph with your own icon component, supply the `#icon` scoped slot on a wrapper around `StarterFormTemplate`. Its slot props are exactly `{ name, size, strokeWidth }`:

```vue
<script lang="ts" setup>
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import { MyIcon } from './MyIcon.vue';
</script>

<template>
  <StarterFormTemplate>
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #icon="{ name, size, strokeWidth }">
      <MyIcon :name="name" :size="size" :stroke-width="strokeWidth" />
    </template>
  </StarterFormTemplate>
</template>
```

**`#icon` is only reachable through this wrapper pattern, never by passing it directly to `DynamicForm`.** `DynamicForm` forwards only the engine's own render to the template; it never forwards a consumer's own slots. Writing `<DynamicForm :template="StarterFormTemplate"><template #icon="...">` does nothing, because no `StarterFormTemplate` instance in the tree ever sees that slot. Wrap the template as shown above and pass the wrapper as `:template` instead.

`ReviewGroup` and `SubmissionSuccess`, when used standalone with no `StarterFormTemplate` ancestor, always render the Lucide default: there is no template above them to provide an override.

## Customization guidance

- **Retheme with CSS variables.** Every colour the stylesheet uses is a `--sft-*` custom property declared on `:root` (and re-declared under `:root.dark`). Override the variables in your own CSS to retheme the whole template without touching a single `sft-` rule.
- **Override by cascade.** Classes are single, low-specificity selectors with no `!important`. Import the stylesheet, then add your own rule with equal or higher specificity; no utility-class fight.
- **Override one control at a time.** Use the wrapper pattern above for a single field type, a single section, or the icon rendering, and let everything else keep its default look.
- **Add your own field types and properties.** `extendMetadata` layers your own field types and extended properties on top of the built-in catalogue, purely at the type level.

## Adding a field type or a property

```vue
<script lang="ts" setup>
import { extendMetadata, StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';

// One extra field type on top of the built-in catalogue, with its own `rows` property.
const extendedMetadata = extendMetadata<{ richText: string }, { rows?: number }>();
</script>

<template>
  <StarterFormTemplate :metadataConfiguration="extendedMetadata">
    <template #input="s">
      <slot v-bind="s" />
    </template>

    <!-- Renders the extended field type. -->
    <template #richText-input="{ fieldContext, fieldMetadata, disabled }">
      <textarea
        :rows="fieldMetadata.rows ?? 4"
        :value="fieldContext.value.value"
        :placeholder="fieldMetadata.placeholder"
        :disabled="disabled || fieldMetadata.disabled"
        @input="fieldContext.handleChange(($event.target as HTMLTextAreaElement).value)"
      />
    </template>
  </StarterFormTemplate>
</template>
```

Then use `{ name: 'notes', type: 'richText', rows: 6 }` in your metadata. The generics are `extendMetadata<ValueTypes, FieldProperties, SlotProperties, SettingsProperties>()`; all four are optional. Type the metadata array with `GetMetadataType<typeof extendedMetadata>` if you want your own types checked.

Caveats:

- **Your declaration wins on a collision.** Redeclaring a built-in type (for example `text`) or a built-in property (for example `description`) replaces it instead of merging with it. Supply the matching slot as well, because the built-in fallback markup still assumes the built-in property shape and is not type-checked against your replacement.
- **`input` is reserved.** A field type named `input` is not supported, because the name collides with the reserved slot above.

## Exports

| Export                                                                                    | Kind                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `StarterFormTemplate`                                                                     | component                                                                 |
| `starterMetadata`                                                                         | the built-in catalogue, the default `metadataConfiguration`               |
| `extendMetadata`                                                                          | function (type carrier)                                                   |
| `StarterValueTypes`, `StarterFieldProperties`                                             | types of the built-in catalogue                                           |
| `StarterIcon`                                                                             | component, the Lucide-backed icon primitive                               |
| `StarterIconName`, `starterIconNames`                                                     | the registry's name union and ordered list                                |
| `SubmissionSuccess`                                                                       | component, a standalone post-submit screen (with its `TimelineItem` type) |
| `ReviewGroup`                                                                             | component, a standalone wizard-review card (with its props type)          |
| `FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, `MetadataConfiguration` | types re-exported from the core package                                   |
| `@bach.software/vue-dynamic-form-starter/style.css`                                       | the stylesheet                                                            |
