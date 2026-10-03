# @bach.software/vue-dynamic-form-element-plus

An [Element Plus](https://element-plus.org) form template for [`@bach.software/vue-dynamic-form`](https://github.com/jeroenbach/vue-dynamic-form). Hand it to `DynamicForm` and every field, array, choice, and wizard in your metadata renders with Element Plus controls, with no template to write and no CSS framework to install.

It is a drop-in counterpart of the core `DynamicFormTemplate`: the same slot names, the same priority fallback, and every slot overridable with the Element Plus markup as its default content. Override the one control you care about and keep the rest.

## Install

The package is not published yet. The name and peer set below are final; confirm the version or tag at publish time.

```sh
pnpm add @bach.software/vue-dynamic-form-element-plus @bach.software/vue-dynamic-form element-plus vee-validate vue
```

### Peer dependencies

All four are required, none is optional:

| Package                           | Range                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@bach.software/vue-dynamic-form` | `>=0.1.0` (to be raised to the first core version with wizard and explicit choice support before the first release) |
| `element-plus`                    | `>=2.0.0`                                                                                                           |
| `vee-validate`                    | `>=4.12`                                                                                                            |
| `vue`                             | `>=3.5.18`                                                                                                          |

The package is developed and tested against Element Plus 2.14.2. Every control binding it uses exists from 2.0.0, with one exception: the `readonly` property of the `number` type needs Element Plus 2.2.16 or newer. On older versions the number field stays editable.

Element Plus 2.14 logs `label act as value is about to be deprecated in version 3.0.0` for the `radio` type. The template keeps `ElRadio :label` on purpose, because the `value` prop only exists from Element Plus 2.6.

## Stylesheets

Import two stylesheets once, for example in your app entry or next to the form:

```ts
import 'element-plus/dist/index.css';
import '@bach.software/vue-dynamic-form-element-plus/style.css';
```

The first is Element Plus's own. The second holds the small amount of layout CSS of this package (field spacing, headings, switch rows). It is plain CSS and needs no Tailwind or other framework in your app.

## Bare usage

Pass the template to `DynamicForm`. No wrapper is needed, and this gives you the full Element Plus rendering for every field type and every structural shape:

```vue
<DynamicForm :metadata="metadata" :template="ElementPlusFormTemplate" />
```

A complete example:

```vue
<script lang="ts" setup>
import type { DefineComponent } from 'vue';
import { DynamicForm, useDynamicForm } from '@bach.software/vue-dynamic-form';
import { ElementPlusFormTemplate } from '@bach.software/vue-dynamic-form-element-plus';
import { ElButton } from 'element-plus';
import 'element-plus/dist/index.css';
import '@bach.software/vue-dynamic-form-element-plus/style.css';

// `ElementPlusFormTemplate` is a generic component, which `vue-tsc` does not accept for the `template` prop as is.
const template = ElementPlusFormTemplate as unknown as DefineComponent<object, object, any>;

const metadata = [
  { name: 'firstName', label: 'First name', placeholder: 'Enter your first name' },
  { name: 'age', type: 'number', label: 'Age', min: 18, max: 120 },
  { name: 'theme', type: 'select', label: 'Theme', options: [{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }] },
  { name: 'newsletter', type: 'switch', label: 'Subscribe to the newsletter', minOccurs: 0 },
];

const { handleSubmit } = useDynamicForm();
const onSubmit = handleSubmit(values => console.log(values));
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <DynamicForm :metadata="metadata" :template="template" />
    <ElButton type="primary" nativeType="submit">
      Submit
    </ElButton>
  </form>
</template>
```

### Built-in field types

Set `type` on a field to pick the control. A field without a `type` is a text input.

| `type`                     | Control                                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`                     | `ElInput`                                                                                                                                      |
| `select`                   | `ElSelect`                                                                                                                                     |
| `checkbox`                 | `ElCheckbox`                                                                                                                                   |
| `radio`                    | `ElRadioGroup`                                                                                                                                 |
| `date`, `time`, `datetime` | `ElDatePicker`, `ElTimePicker`, `ElDatePicker` (stored as a string, `valueFormat` defaults to `YYYY-MM-DD`, `HH:mm:ss`, `YYYY-MM-DD HH:mm:ss`) |
| `switch`                   | `ElSwitch`                                                                                                                                     |
| `number`                   | `ElInputNumber`                                                                                                                                |
| `rate`                     | `ElRate`                                                                                                                                       |
| `slider`                   | `ElSlider`                                                                                                                                     |
| `color`                    | `ElColorPicker`                                                                                                                                |
| `cascader`                 | `ElCascader`                                                                                                                                   |
| `transfer`                 | `ElTransfer` (stores the selected keys; the `targetKeys` property is not read)                                                                 |
| `upload`                   | `ElUpload`                                                                                                                                     |
| `heading`, `divider`       | a section heading and an `ElDivider` (no value)                                                                                                |

The extended field properties are typed by `ElementPlusFieldProperties`. Properties shared by several controls sit directly on the field (`label`, `placeholder`, `options`, `multiple`, `clearable`, `filterable`, `disabled`, `readonly`, `size`, `min`, `max`, `step`, `format`, `valueFormat`). Properties that belong to a single control sit in a group named after the field type, so they never collide with the field's own `type`:

```ts
const fields = [
  { name: 'birthDate', type: 'date', date: { type: 'month' } },
  { name: 'satisfaction', type: 'slider', min: 0, max: 100, slider: { showStops: true } },
];
```

| Group      | Properties                                                   |
| ---------- | ------------------------------------------------------------ |
| `number`   | `precision`                                                  |
| `date`     | `type` (the `ElDatePicker` mode), `showTime`                 |
| `slider`   | `showStops`, `range`                                         |
| `color`    | `showAlpha`, `colorFormat`                                   |
| `cascader` | `props`                                                      |
| `transfer` | `data` (`targetKeys` is typed but not read)                  |
| `upload`   | `action`, `accept`, `listType`, `autoUpload`, `showFileList` |

Repeatable fields (`maxOccurs > 1`) render as cards with Add and Remove buttons, choices render as sections with branch buttons, and `wizard: true` renders an `ElSteps` indicator with Previous, Next, and Submit buttons. The button text is English and not configurable in this version.

The wizard Submit button submits the surrounding native `<form>`; without one it does nothing, so wrap the form as in the example above.

## Overriding a control

Overriding needs a thin wrapper component, because Vue slots are the only way to hand your markup to the `:template`. The wrapper always starts with the same two forward lines, which hand the engine's field and attribute render to the built-in Element Plus chrome. Then add a slot for each thing you want to change:

```vue
<script lang="ts" setup>
import { ElementPlusFormTemplate } from '@bach.software/vue-dynamic-form-element-plus';
</script>

<template>
  <ElementPlusFormTemplate>
    <!-- Hand the engine's field and attribute render to the built-in Element Plus chrome. -->
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
    </template>

    <!-- Overrides the built-in date picker with a native date input. -->
    <template #date-input="{ fieldContext, fieldMetadata, disabled }">
      <input
        type="date"
        :value="fieldContext.value.value"
        :placeholder="fieldMetadata.placeholder"
        :disabled="disabled || fieldMetadata.disabled"
        @input="fieldContext.handleChange(($event.target as HTMLInputElement).value)"
      >
    </template>
  </ElementPlusFormTemplate>
</template>
```

Use the wrapper as the template: `<DynamicForm :metadata="metadata" :template="MyFormTemplate" />`.

Slot names are matched as exact strings, so write them the way the dispatcher spells them: `#date-input`, never `#dateInput`.

`input` and `attributes` are reserved slot names. They carry the engine's render, which is why the wrapper forwards them, and they are not override points.

When you override the chrome shared by most fields (`#default`), render the engine's field inside your override with `<slot v-bind="s" />`, otherwise the input disappears:

```vue
<template>
  <ElementPlusFormTemplate>
    <!-- The two forward lines from above go here. -->
    <template #default="{ fieldMetadata, required, fieldContext, ...s }">
      <ElFormItem
        :label="fieldMetadata.label"
        :required="required"
        :error="fieldContext.errorMessage.value"
      >
        <slot v-bind="s" />
      </ElFormItem>
    </template>
  </ElementPlusFormTemplate>
</template>
```

### Supported slots

| Family                 | Slots                                                                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structural             | `default`, `default-input`, `default-array`, `default-array-item`, `default-choice`, `default-choice-array`, `default-choice-array-item`, `default-wizard`, `default-wizard-page`                                                            |
| Input, one per control | `text-input`, `select-input`, `checkbox-input`, `radio-input`, `date-input`, `time-input`, `datetime-input`, `switch-input`, `number-input`, `rate-input`, `slider-input`, `color-input`, `cascader-input`, `transfer-input`, `upload-input` |
| Field wrapper          | `checkbox`, `switch`, `heading`, `divider`                                                                                                                                                                                                   |
| Array, per type        | `<type>-array`, `<type>-array-item` (for example `text-array-item`)                                                                                                                                                                          |
| Choice, per type       | `<type>-choice`, `<type>-choice-array`, `<type>-choice-array-item`                                                                                                                                                                           |
| Wizard, per type       | `<type>-wizard`, `<type>-wizard-page`                                                                                                                                                                                                        |

Slots are chosen with the priority fallback of the core `DynamicFormTemplate`: the dedicated per-type slot first, then the matching `default-*` slot, then `default`. For example a `date` field renders `date-input`, else `default-input`, else `default`; an item of a repeated `text` field renders `text-array-item`, else `default-array-item`, else `default`. Overriding `default-input` replaces every control at once. Overriding a slot replaces only that slot; everything else keeps its Element Plus rendering.

A `-choice-array` or `-choice-array-item` slot is a repeatable choice, a `-choice` slot is a single choice. A consumer overriding `default-wizard-page` must keep the `v-show` gate on `isCurrent` and never switch to `v-if`, which would drop the page's fields from validation when the user navigates away.

Any other slot you supply, for example one for a field type you added, is passed on to the dispatcher unchanged.

## Adding a field type or a property

`extendMetadata` layers your own field types and extended properties on top of the built-in ones. It only carries types: nothing is merged at runtime.

```vue
<script lang="ts" setup>
import { ElementPlusFormTemplate, extendMetadata } from '@bach.software/vue-dynamic-form-element-plus';

// One extra field type on top of the built-in Element Plus catalogue, with its own `rows` property.
const extendedMetadata = extendMetadata<{ richText: string }, { rows?: number }>();
</script>

<template>
  <ElementPlusFormTemplate :metadataConfiguration="extendedMetadata">
    <template #input="s">
      <slot v-bind="s" />
    </template>
    <template #attributes="s">
      <slot name="attributes" v-bind="s" />
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
  </ElementPlusFormTemplate>
</template>
```

Then use `{ name: 'notes', type: 'richText', rows: 6 }` in your metadata. The generics are `extendMetadata<ValueTypes, FieldProperties, SlotProperties, SettingsProperties>()`; all four are optional. Type the metadata array with `GetMetadataType<typeof extendedMetadata>` if you want your own types checked.

Caveats:

- **Your declaration wins on a collision.** Redeclaring a built-in type (for example `text`) or a built-in property (for example `label`) replaces it instead of merging with it. Supply the matching slot as well, because the built-in fallback markup still assumes the built-in property shape and is not type-checked against your replacement.
- **`input` and `attributes` are reserved.** A field type named `input` or `attributes` is not supported, because the names collide with the reserved slots above.

## Exports

| Export                                                                                    | Kind                                                        |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `ElementPlusFormTemplate`                                                                 | component                                                   |
| `elementPlusMetadata`                                                                     | the built-in catalogue, the default `metadataConfiguration` |
| `extendMetadata`                                                                          | function (type carrier)                                     |
| `ElementPlusValueTypes`, `ElementPlusFieldProperties`                                     | types of the built-in catalogue                             |
| `FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, `MetadataConfiguration` | types re-exported from the core package                     |
| `@bach.software/vue-dynamic-form-element-plus/style.css`                                  | the stylesheet                                              |
