# Step 2: Build a Template

A template is a Vue SFC that wraps `DynamicFormTemplate`. It owns all the HTML — the layout, the component library, the labels, the error rendering. The library only calls your slots at the right moment.

## The Minimal Template

This is the smallest working template. It handles every field with a label + input + error pattern:

```vue
<script setup lang="ts">
import { defineMetadata, DynamicFormTemplate } from '@bach.software/vue-dynamic-form';

const metadata = defineMetadata<{
  text: string
}>();
</script>

<template>
  <DynamicFormTemplate :metadata-configuration="metadata">
    <!-- Outer wrapper: rendered for every field -->
    <template #default="{ fieldMetadata, fieldContext: { errorMessage, label }, required }">
      <label :for="fieldMetadata.path">
        {{ label }}<span v-if="required"> *</span>
      </label>
      <slot />
      <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
    </template>

    <!-- Input control fallback: rendered for every field without its own input slot -->
    <template #default-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur } }">
      <input
        :id="fieldMetadata.path"
        :value="value.value"
        @input="handleChange"
        @blur="handleBlur"
      >
    </template>
  </DynamicFormTemplate>
</template>
```

Two slots are enough to render any form:

- `#default` — the outer wrapper (label, slot, error)
- `#default-input` — the actual input control

The `<slot />` inside `#default` is where the library injects the input (for leaf fields) or the child fields (for groups).

## How Slot Resolution Works

The library appends a suffix to the field type to determine which slot to call (`select` → `#select-input` for the input control, `#select` for the wrapper), then walks a fallback chain until it finds one you've defined: the dedicated per-type slot first, then the matching `default-*` slot, then `default`. You only need to define slots for the cases that need special handling; everything else falls through automatically.

The complete fallback table for all seven slot families (wrapper, input, array, array item, choice, repeatable choice, choice occurrence) is in [Slots Overview](/reference/dynamic-form-template#slots-overview) in the reference.

## Adding a Specific Input Control

Add a `#select-input` slot to render a proper `<select>` element instead of the default text input:

```vue-html
<DynamicFormTemplate>
  <template #select-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur }, disabled }">
    <select
      :id="fieldMetadata.path"
      :value="value.value"
      :disabled="disabled"
      @change="handleChange"
      @blur="handleBlur"
    >
      <option value="">
        — Select —
      </option>
      <option
        v-for="opt in fieldMetadata.options"
        :key="opt.key"
        :value="opt.key"
      >
        {{ opt.value }}
      </option>
    </select>
  </template>
</DynamicFormTemplate>
```

## Adding a Specific Field Wrapper

A `heading` field might render a section title rather than a label + input. Give it its own slot:

```vue-html
<DynamicFormTemplate>
  <template #heading="{ fieldContext: { label }, fieldMetadata }">
    <h2>{{ label }}</h2>
    <p v-if="fieldMetadata.description" class="description">
      {{ fieldMetadata.description }}
    </p>
    <slot />
  </template>
</DynamicFormTemplate>
```

The `<slot />` at the bottom renders the children of this heading group.

## Array and Choice Container Slots

Array and choice containers have their own fallback slots. Both receive a limited `fieldContext` (only `errors`, `errorMessage`, and `label`).

**`#default-array`** — fallback outer container for any repeating field, renders once and wraps all occurrences:

```vue-html
<DynamicFormTemplate>
  <template #default-array="{ fieldContext: { label, errorMessage }, required, canAddItems, addItem }">
    <h3>{{ label }}<span v-if="required"> *</span></h3>
    <slot />
    <button v-if="canAddItems" type="button" @click="addItem">
      + Add
    </button>
    <span v-if="errorMessage.value">{{ errorMessage.value }}</span>
  </template>
</DynamicFormTemplate>
```

Use a type-specific slot (e.g. `#text-array`) to override just that type's container without affecting others.

**`#default-choice`** — fallback outer container for any single (`maxOccurs: 1`) choice field, renders once and wraps all branches (a repeatable choice renders through `#default-choice-array` when defined, with each explicit occurrence going through `#default-choice-array-item`; without those slots it falls back here and to the `-array-item` slots respectively):

```vue-html
<DynamicFormTemplate>
  <template #default-choice="{ fieldContext: { label, errorMessage }, required }">
    <h3>{{ label }}<span v-if="required"> *</span></h3>
    <slot />
    <span v-if="errorMessage.value">{{ errorMessage.value }}</span>
  </template>
</DynamicFormTemplate>
```

Each branch inside a choice goes through the normal slot resolution (`{type}` → `default`) with the `disabled` prop reflecting whether that branch is locked by a sibling choice.

**`#default-array-item`** — fallback for each individual occurrence inside an array. Receives the full slot props including `index`, `canRemoveItems`, and `removeItem`.

## Accessing Settings in Templates

Every slot receives a `settings` prop containing the form's `DynamicFormSettings` object, including any extended properties declared in your metadata. Destructure it to drive display logic (required/optional indicators, theme flags, mode toggles) without threading values through individual field metadata:

```vue-html
<DynamicFormTemplate>
  <template #default="{ fieldMetadata, fieldContext: { label, errorMessage }, required, settings: { showRequiredOrOptional } }">
    <label :for="fieldMetadata.path">
      {{ label }}
      <span v-if="showRequiredOrOptional === 'required' && required" class="text-red-500"> *</span>
      <span v-if="showRequiredOrOptional === 'optional' && !required" class="text-gray-400"> Optional</span>
    </label>
    <slot />
    <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
  </template>
</DynamicFormTemplate>
```

Declaring your own settings properties is the fourth generic of `defineMetadata`; see [`ExtendedSettingsProperties`](/reference/define-metadata#extendedsettingsproperties).

## Going Further

- **Every slot prop** (`fieldMetadata`, `fieldContext`, `required`, `disabled`, `index`, the add/remove primitives, `settings`, `slotProps`) is documented with its exact type in [DynamicFormTemplate](/reference/dynamic-form-template#slot-props-regular-slots).
- **Passing data from an outer slot to inner slots** (binding values on `<slot />`, reading them via `slotProps`) is covered in [Passing Data to Child Slots](/reference/dynamic-form-template#passing-data-to-child-slots).

---

Continue to [Step 3: Wire Up a Form](/guide/your-first-form).
