# StarterFormTemplate

`StarterFormTemplate` is the ready-made template component of `@bach.software/vue-dynamic-form-starter`. Hand it to `DynamicForm` and every shape in your metadata (fields, groups, arrays, choices, wizards, review steps) renders with a finished look.

```vue
<script lang="ts" setup>
import { DynamicForm } from '@bach.software/vue-dynamic-form';
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
import '@bach.software/vue-dynamic-form-starter/style.css';
</script>

<template>
  <DynamicForm :metadata="metadata" :template="StarterFormTemplate" />
</template>
```

For a guided introduction see [The Starter Template](/guide/starter-template) guide.

## Props

### `metadataConfiguration`

Type: `MetadataConfiguration` | Default: `starterMetadata`

The type-level catalogue the template's slot scopes are typed against. Leave it unset to use the built-in catalogue. Pass the result of [`extendMetadata`](/reference/starter-extend-metadata) to add your own field types and properties.

## Stylesheet

The package ships one stylesheet, imported once (for example in your app entry):

```ts
import '@bach.software/vue-dynamic-form-starter/style.css';
```

It is plain CSS with semantic `sft-` prefixed class names. Dark mode follows a `.dark` class on `<html>`. See [Settings & Theming](/reference/starter-settings-theming) for the CSS variables it exposes.

## The wrapper pattern

To override any part of the rendering you wrap `StarterFormTemplate` in a thin component of your own, because Vue slots are the only way to hand markup to the `:template`. The wrapper must always forward the `input` and `attributes` slots (they carry the engine's field and attribute renders to the built-in chrome), and then adds one slot per thing it changes:

```vue
<script lang="ts" setup>
import { StarterFormTemplate } from '@bach.software/vue-dynamic-form-starter';
</script>

<template>
  <StarterFormTemplate>
    <!-- Always forward these two: they hand the engine's renders to the built-in chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <!-- Your overrides go here, e.g. replacing the built-in text control: -->
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

Overriding a slot replaces only that slot; everything else keeps its default rendering.

## Slot resolution

Slots follow the priority fallback of the core [`DynamicFormTemplate`](/reference/dynamic-form-template): the dedicated per-type slot first (for example `text-input`), then the matching `default-*` slot, then `default`. A slot name the starter does not recognise (for example a per-type slot of your own such as `richText-input`) is passed through to the dispatcher, so it participates in the same resolution.

### Slots implemented by the starter

Each of these renders built-in chrome unless your wrapper overrides it. The slot props are the core dispatcher's slot props for that slot family; see [DynamicFormTemplate](/reference/dynamic-form-template) for the full prop tables.

| Slot                        | Built-in rendering                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `default`                   | Field chrome (label, description, error) around a single input, or group chrome around `children`                           |
| `heading`                   | Section card around `children`                                                                                              |
| `grid`                      | Bare CSS-grid `div` around `children`, no card chrome                                                                       |
| `checkbox`                  | Checkbox field chrome (label beside the toggle)                                                                             |
| `default-array`             | Repeatable field (inline add/remove)                                                                                        |
| `heading-array`             | Repeatable section card with empty state and add button                                                                     |
| `heading-array-item`        | One repeater card per item, with title and remove button                                                                    |
| `default-choice`            | Choice chrome for a non-heading choice                                                                                      |
| `heading-choice`            | Choice section card, including the picker cards when `choicePicker.show` is set                                             |
| `heading-choice-array`      | Repeatable choice section card with the per-branch add bar                                                                  |
| `default-choice-array-item` | One repeater card per active choice occurrence                                                                              |
| `default-input`             | Text-mode input (`text`, `number`, `email`, `tel`, `url`, `date`, `time`, `datetime-local`), including the `suffix` readout |
| `select-input`              | Select dropdown                                                                                                             |
| `textarea-input`            | Auto-growing textarea                                                                                                       |
| `radio-input`               | Radio button group                                                                                                          |
| `file-input`                | File picker with filename display and clear button                                                                          |
| `checkbox-input`            | Toggle switch                                                                                                               |
| `password-input`            | Password input with visibility toggle and optional strength bar                                                             |
| `default-wizard`            | Wizard shell: stepper, page container, back/next/submit footer                                                              |
| `default-wizard-page`       | Visibility wrapper for one wizard page                                                                                      |
| `wizardSummaryPage`         | Review page driven by `wizardSummary.groups`                                                                                |

::: warning Keep the `v-show` gate when overriding `default-wizard-page`
The built-in page wrapper hides inactive pages with `v-show`. An override must do the same and never switch to `v-if`: unmounting a page deregisters its fields from validation, so submit would send them unvalidated.
:::

### Reserved slot names

`input`, `attributes`, and `icon` are not override points:

- `input` and `attributes` carry the engine's field and attribute renders. A wrapper must forward them (see above); field types with these names are not supported.
- `icon` is the glyph override described below.

## The `#icon` slot

Every glyph renders through `StarterIcon`, backed by a bounded, tree-shaken registry of Lucide icons. Supplying the `#icon` scoped slot on a wrapper replaces every glyph at once:

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

The slot props are typed as `IconOverrideProps`:

| Prop          | Type                        | Purpose                                   |
| ------------- | --------------------------- | ----------------------------------------- |
| `name`        | `StarterIconName \| string` | Which glyph is being rendered             |
| `size`        | `number`                    | Pixel size the built-in glyph would use   |
| `strokeWidth` | `number`                    | Stroke width the built-in glyph would use |

`#icon` is only reachable through the wrapper pattern. `DynamicForm` forwards only the engine's own render to the template, never a consumer's slots, so passing `#icon` directly to `DynamicForm` does nothing.

### Icon registry

`StarterIconName` is the union of the registered names, and `starterIconNames` exports them as a runtime array:

`briefcase`, `building2`, `calendar`, `check`, `checkCircle`, `chevronDown`, `chevronLeft`, `chevronRight`, `chevronUp`, `eye`, `eyeOff`, `grid`, `loader`, `pencil`, `plus`, `refreshCw`, `rocket`, `shield`, `sparkles`, `trash`, `users`, `zap`

Use the `iconName` [field property](/reference/starter-field-properties#iconname) to show one of these on a choice picker card.

## Other exports

Standalone pieces the package exports for use outside (or next to) the template:

| Export                                                                         | Purpose                                                                                                               |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `StarterFormTemplate`                                                          | The template component itself                                                                                         |
| `starterMetadata` / `StarterMetadata`                                          | The built-in catalogue and the field type for your `metadata` arrays                                                  |
| `StarterDynamicFormSettings`                                                   | Type of the `settings` object, including the starter's own settings                                                   |
| `extendMetadata`                                                               | Layers your own field types and properties on the catalogue; see [extendMetadata](/reference/starter-extend-metadata) |
| `StarterIcon`, `starterIconNames`, `StarterIconName`                           | The glyph primitive and the registry names                                                                            |
| `ReviewGroup`, `ReviewGroupProps`                                              | One review card, as used by the wizard summary page                                                                   |
| `SubmissionSuccess`, `TimelineItem`                                            | A post-submit confirmation panel with an optional timeline                                                            |
| `AppButton`, `AppButtonProps`                                                  | The button primitive the chrome uses                                                                                  |
| `ChoiceArraySectionCard`, `ChoiceOption`                                       | The repeatable-choice section card, usable directly in slot overrides                                                 |
| `StarterFieldProperties`, `StarterValueTypes`, `Responsive`, `GridColumnCount` | The types behind the catalogue and the layout properties                                                              |

The core types `FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, and `MetadataConfiguration` are re-exported for convenience.

## Related

- [Starter Field Types](/reference/starter-field-types): every `type` the catalogue ships
- [Starter Field Properties](/reference/starter-field-properties): every property a metadata node can set
- [Settings & Theming](/reference/starter-settings-theming): settings, CSS variables, and breakpoints
- [extendMetadata](/reference/starter-extend-metadata): adding your own field types
