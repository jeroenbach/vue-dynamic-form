# DynamicFormTemplate

`DynamicFormTemplate` is the rendering bridge between your field definitions and the HTML you write. It resolves which slot to use for each field and passes the field's data into that slot.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `metadataConfiguration` | `MetadataConfiguration` | Yes | The value returned by `defineMetadata()`. Gives TypeScript the slot and prop types. |

## Slots Overview

### Named Per Field Type

For every type name `T` you declared in `defineMetadata()`, two slots are available:

| Slot | Role |
|------|------|
| `#T` | Outer wrapper for the field (label, slot, error). If absent, `#default` is used. |
| `#T-input` | The raw input control inside the wrapper. If absent, `#default-input` is used. |

Example: if you declared `text`, `select`, and `checkbox`, you get `#text`, `#text-input`, `#select`, `#select-input`, `#checkbox`, `#checkbox-input` — plus the built-ins below.

### Built-in Slots

| Slot | When rendered |
|------|---------------|
| `#default` | Any field whose `type` has no named slot |
| `#default-input` | The input part of any field whose `type` has no `{type}-input` slot |
| `#array` | Outer container for every array field (`maxOccurs > 1`) |
| `#choice` | Outer container for every choice field (field has `choice` property) |

## Slot Props — Regular Slots

`#default`, `#default-input`, and all named `#T` / `#T-input` slots receive:

### `fieldMetadata`

Type: `FieldMetadata` (with your extended properties)

The complete metadata object for this field as it was defined — including every property you set plus your extended properties. In `computedProps` this is the already-computed version, so mutations made in `computedProps` are visible here.

```vue
<template #select-input="{ fieldMetadata }">
  <!-- fieldMetadata.options typed from your ExtendedFieldProperties -->
  <option v-for="opt in fieldMetadata.options" :key="opt.key">{{ opt.value }}</option>
</template>
```

### `fieldContext`

Type: `FieldContext<T>` — the vee-validate field context extended with `hasValue`.

| Property | Type | Description |
|----------|------|-------------|
| `value` | `Ref<T>` | Current value of the field. Read it to display; write it to set. |
| `handleChange` | `(e: Event \| unknown) => void` | Call on `@input` or `@change` to update the value |
| `handleBlur` | `(e?: Event) => void` | Call on `@blur` |
| `errors` | `Ref<string[]>` | All active validation errors |
| `errorMessage` | `Ref<string \| undefined>` | First active error, or `undefined` |
| `label` | `string \| undefined` | The resolved label string (from `fieldOptions.label`) |
| `hasValue` | `ComputedRef<boolean>` | `true` when this field or any of its descendants has a value |
| `validate()` | `() => Promise<...>` | Programmatically trigger validation |
| `resetField()` | `(opts?) => void` | Reset value and validation state |
| `setErrors()` | `(errors: string[]) => void` | Set errors programmatically |

::: tip
`hasValue` is lazily evaluated. It only computes when accessed, so safe to use on deep field trees.
:::

### `required`

Type: `boolean`

`true` when `minOccurs >= 1` and the field is not disabled. Use it to conditionally show a required indicator.

```vue
<label>{{ label }}<span v-if="required"> *</span></label>
```

### `disabled`

Type: `boolean`

`true` when `maxOccurs === 0`. Indicates that the field (and its children) has been programmatically disabled. Typically via `computedProps` setting `field.maxOccurs = 0`.

### `index`

Type: `number`

The zero-based position of this occurrence when the field is part of an array. `0` for non-array fields.

### `canAddItems`

Type: `boolean`

`true` when the array can accept another occurrence (current count is below `maxOccurs`). Useful for showing or hiding an "Add" button.

### `canRemoveItems`

Type: `boolean`

`true` when the current occurrence can be removed (current count is above `minOccurs`, or the item has a value that can be cleared). Useful for showing or hiding a "Remove" button.

### `addItem()`

Type: `() => void`

Appends a new occurrence to the array. Only meaningful when `canAddItems` is `true`.

### `removeItem()`

Type: `() => void`

Removes the current occurrence from the array. Only meaningful when `canRemoveItems` is `true`.

### `slotProps`

Type: `object | undefined`

Extra data passed down from the parent slot via `<slot :my-prop="value" />`. Access it as `slotProps?.myProp`. See [Passing Data to Child Slots](#passing-data-to-child-slots) below.

## Slot Props — `#array` and `#choice` Slots

These slots receive the same props as regular slots **except** that `fieldContext` is reduced to:

| Property | Type | Description |
|----------|------|-------------|
| `errors` | `Ref<string[]>` | Active validation errors on the container |
| `errorMessage` | `Ref<string \| undefined>` | First active error |
| `label` | `string \| undefined` | Resolved label |

All other props (`required`, `disabled`, `canAddItems`, `canRemoveItems`, `addItem`, `removeItem`, `slotProps`) are the same.

## The `<slot />` Inside Your Slot Templates

Inside `#default` (or any named wrapper slot), rendering `<slot />` tells the library to insert the field's content:

- For a **leaf field**: inserts the `#{type}-input` (or `#default-input`) slot.
- For a **parent/group field**: inserts all child `DynamicFormItem` components.
- For an **array outer slot** (`#array`): inserts all current array occurrences.
- For a **choice outer slot** (`#choice`): inserts all choice branches.

## Passing Data to Child Slots

Bind extra values to `<slot />` to make them available to all slots rendered below:

```vue
<!-- Parent's #default slot -->
<template #default="{ fieldMetadata }">
  <div :class="{ 'col-span-2': fieldMetadata.fullWidth }">
    <slot :hide-label="fieldMetadata.hideLabel" :depth="1" />
  </div>
</template>
```

Any field slot rendered inside this wrapper receives the extra values through `slotProps`:

```vue
<!-- Child field's slot -->
<template #default="{ fieldContext: { label }, slotProps }">
  <label v-if="!slotProps?.hideLabel">{{ label }}</label>
  <span>Depth: {{ slotProps?.depth }}</span>
  <slot />
</template>
```

::: warning
`slotProps` keys use camelCase even when bound with kebab-case on the `<slot />` element. `hide-label` becomes `slotProps.hideLabel`.
:::

## Full Template Example

```vue
<script setup lang="ts">
import { defineMetadata, DynamicFormTemplate } from '@bach.software/vue-dynamic-form';

const metadata = defineMetadata<
  { text: string; select: string; checkbox: boolean; heading: never },
  { description?: string; options?: { key: string; value: string }[]; disabled?: boolean }
>();
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">

    <!-- Section heading -->
    <template #heading="{ fieldContext: { label }, fieldMetadata }">
      <h2>{{ label }}</h2>
      <p v-if="fieldMetadata.description" class="hint">{{ fieldMetadata.description }}</p>
      <slot />
    </template>

    <!-- Array outer container -->
    <template #array="{ fieldContext: { label, errorMessage }, required, canAddItems, addItem }">
      <section>
        <h3>{{ label }}<span v-if="required"> *</span></h3>
        <slot />
        <button type="button" v-if="canAddItems" @click="addItem">+ Add</button>
        <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
      </section>
    </template>

    <!-- Choice outer container -->
    <template #choice="{ fieldContext: { label, errorMessage }, required }">
      <fieldset>
        <legend>{{ label }}<span v-if="required"> *</span></legend>
        <slot />
        <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
      </fieldset>
    </template>

    <!-- Default field wrapper -->
    <template #default="{ fieldMetadata, fieldContext: { label, errorMessage }, required, disabled, canRemoveItems, removeItem }">
      <div class="field" :class="{ 'is-disabled': disabled }">
        <label :for="fieldMetadata.path">{{ label }}<span v-if="required"> *</span></label>
        <slot />
        <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
        <button v-if="canRemoveItems" type="button" @click="removeItem">Remove</button>
      </div>
    </template>

    <!-- Select input -->
    <template #select-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur }, disabled }">
      <select
        :id="fieldMetadata.path"
        :value="value.value"
        :disabled="fieldMetadata.disabled || disabled"
        @change="handleChange"
        @blur="handleBlur"
      >
        <option value="">— Select —</option>
        <option v-for="opt in fieldMetadata.options" :key="opt.key" :value="opt.key">
          {{ opt.value }}
        </option>
      </select>
    </template>

    <!-- Checkbox input -->
    <template #checkbox-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur }, disabled }">
      <input
        type="checkbox"
        :id="fieldMetadata.path"
        :checked="value.value"
        :disabled="disabled"
        @change="handleChange(($event.target as HTMLInputElement).checked)"
        @blur="handleBlur"
      />
    </template>

    <!-- Default text input (fallback for all other types) -->
    <template #default-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur }, disabled }">
      <input
        :id="fieldMetadata.path"
        :value="value.value"
        :disabled="disabled"
        @input="handleChange"
        @blur="handleBlur"
      />
    </template>

  </DynamicFormTemplate>
</template>
```
