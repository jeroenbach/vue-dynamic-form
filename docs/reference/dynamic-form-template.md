# DynamicFormTemplate

`DynamicFormTemplate` is the rendering bridge between your field definitions and the HTML you write. It resolves which slot to use for each field and passes the field's data into that slot.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `metadataConfiguration` | `MetadataConfiguration` | Yes | The value returned by `defineMetadata()`. Gives TypeScript the slot and prop types. |

## Slots Overview

For every type name `T` you declared in `defineMetadata()`, five slots are available — each with a specific rendering role:

| Slot | Role |
|------|------|
| `#T` | Outer wrapper (label, input, error) |
| `#T-input` | The raw input control inside the wrapper |
| `#T-array` | Outer container when this field is a repeatable array |
| `#T-array-item` | Each individual item rendered inside an array |
| `#T-choice` | Outer container when this field is a choice |

All slots are optional. When a slot is missing, the library walks a two-level fallback chain until it finds one you've defined:

```
#text              ──► #default
#text-input        ──► #default-input        ──► #default
#text-array        ──► #default-array        ──► #default
#text-array-item   ──► #default-array-item   ──► #default
#text-choice       ──► #default-choice       ──► #default
```

This means you can define just `#default` and `#default-input` to handle every field type, then progressively opt into more specific slots as needed.

## Slot Props — Regular Slots

`#default`, `#default-input`, `#default-array-item`, and all named `#T`, `#T-input`, `#T-array-item` slots receive:

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
| `handleChange` | `(e: Event \| unknown, shouldValidate?: boolean) => void` | Call on `@input` or `@change` to update the value |
| `handleBlur` | `(e?: Event, shouldValidate?: boolean) => void` | Call on `@blur` |
| `errors` | `Ref<string[]>` | All active validation errors |
| `errorMessage` | `Ref<string \| undefined>` | First active error, or `undefined` |
| `label` | `MaybeRefOrGetter<string \| undefined>` | The label (from `fieldOptions.label`). Unwrap with `toValue(label)` if needed. |
| `hasValue` | `ComputedRef<boolean>` | `true` when this field or any of its descendants has a value |
| `validate()` | `(opts?) => Promise<ValidationResult>` | Programmatically trigger validation |
| `resetField()` | `(state?) => void` | Reset value and validation state |
| `setErrors()` | `(errors: string \| string[]) => void` | Set errors programmatically |

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

The zero-based position of this field within its parent collection:

- **Array field** — the occurrence index within the repeatable array
- **Non-array field** — the position of this field within its parent's `children`, `choice`, or `attributes`

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

Type: `SlotProperties | undefined`

Extra data passed down from the parent slot via `<slot :my-prop="value" />`. Access it as `slotProps?.myProp`. The type is `SlotProperties` when declared as the third generic of `defineMetadata()`, otherwise `object | undefined`. See [Passing Data to Child Slots](#passing-data-to-child-slots) below.

## Slot Props — Array and Choice Container Slots

`#default-array`, `#default-choice`, and all named `#T-array`, `#T-choice` slots receive the same props as regular slots **except** that `fieldContext` is reduced to:

| Property | Type | Description |
|----------|------|-------------|
| `value` | `ComputedRef<T[]>` | The current array/choice values (all occurrences) |
| `errors` | `Ref<string[]>` | Active validation errors on the container |
| `errorMessage` | `Ref<string \| undefined>` | First active error |
| `label` | `MaybeRefOrGetter<string \| undefined>` | Resolved label (from `fieldOptions.label`) |

All other props (`required`, `disabled`, `canAddItems`, `canRemoveItems`, `addItem`, `removeItem`, `slotProps`) are the same.

::: tip
`#T-array-item` and `#default-array-item` are **not** container slots — they render each individual occurrence inside an array, so they receive the full `fieldContext` including `value`, `handleChange`, `errors`, etc.
:::

## The `<slot />` Inside Your Slot Templates

Inside `#default` (or any named wrapper slot), rendering `<slot />` tells the library to insert the field's content:

- For a **leaf field**: inserts the `#{type}-input` (or `#default-input`) slot.
- For a **parent/group field**: inserts all child components.
- For an **array outer slot** (`#T-array` / `#default-array`): inserts all current array occurrences, each rendered through `#T-array-item` (or `#default-array-item`).
- For a **choice outer slot** (`#T-choice` / `#default-choice`): inserts all choice branches.

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

    <!-- Array outer container (fallback for all array types) -->
    <template #default-array="{ fieldContext: { label, errorMessage }, required, canAddItems, addItem }">
      <section>
        <h3>{{ label }}<span v-if="required"> *</span></h3>
        <slot />
        <button type="button" v-if="canAddItems" @click="addItem">+ Add</button>
        <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
      </section>
    </template>

    <!-- Choice outer container (fallback for all choice types) -->
    <template #default-choice="{ fieldContext: { label, errorMessage }, required }">
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
