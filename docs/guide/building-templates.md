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
      />
    </template>

  </DynamicFormTemplate>
</template>
```

Two slots are enough to render any form:

- `#default` — the outer wrapper (label, slot, error)
- `#default-input` — the actual input control

The `<slot />` inside `#default` is where the library injects the input (for leaf fields) or the child fields (for groups).

## How Slot Resolution Works

When the library renders a field with `type: 'select'`, it looks for slots in this order:

**For the outer wrapper:**
1. Slot named `select` — if found, uses it
2. Falls back to `default`

**For the input inside the wrapper:**
1. Slot named `select-input` — if found, uses it
2. Falls back to `default-input`

You only define slots for field types that need special handling. Everything else falls through automatically.

## Adding a Specific Input Control

Add a `#select-input` slot to render a proper `<select>` element instead of the default text input:

```vue
<template #select-input="{ fieldMetadata, fieldContext: { value, handleChange, handleBlur }, disabled }">
  <select
    :id="fieldMetadata.path"
    :value="value.value"
    :disabled="disabled"
    @change="handleChange"
    @blur="handleBlur"
  >
    <option value="">— Select —</option>
    <option
      v-for="opt in fieldMetadata.options"
      :key="opt.key"
      :value="opt.key"
    >
      {{ opt.value }}
    </option>
  </select>
</template>
```

## Adding a Specific Field Wrapper

A `heading` field might render a section title rather than a label + input. Give it its own slot:

```vue
<template #heading="{ fieldContext: { label }, fieldMetadata }">
  <h2>{{ label }}</h2>
  <p v-if="fieldMetadata.description" class="description">
    {{ fieldMetadata.description }}
  </p>
  <slot />
</template>
```

The `<slot />` at the bottom renders the children of this heading group.

## The `#array` and `#choice` Slots

These two slots handle structural containers. They receive a limited `fieldContext` (only `errors`, `errorMessage`, and `label`).

**Array outer container** — renders once, contains all occurrences:

```vue
<template #array="{ fieldContext: { label, errorMessage }, required, canAddItems, addItem }">
  <div class="array-field">
    <h3>{{ label }}<span v-if="required"> *</span></h3>
    <slot />
    <button type="button" v-if="canAddItems" @click="addItem">+ Add</button>
    <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
  </div>
</template>
```

**Choice outer container** — renders once, contains all branches:

```vue
<template #choice="{ fieldContext: { label, errorMessage }, required, disabled }">
  <div class="choice-field" :class="{ 'is-disabled': disabled }">
    <h3>{{ label }}<span v-if="required"> *</span></h3>
    <slot />
    <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
  </div>
</template>
```

Each branch inside a choice goes through `#default` (or its own named slot) with the `disabled` prop reflecting whether that branch is locked by a sibling choice.

## Full Slot Props Reference

All named slots (except `#array` and `#choice`) receive:

| Prop | Type | Description |
|------|------|-------------|
| `fieldMetadata` | `FieldMetadata` | Full field config including extended properties |
| `fieldContext` | `FieldContext` | vee-validate context: `value`, `handleChange`, `handleBlur`, `errors`, `errorMessage`, `hasValue` |
| `required` | `boolean` | `true` when `minOccurs >= 1` and field is not disabled |
| `disabled` | `boolean` | `true` when `maxOccurs === 0` |
| `index` | `number` | Position in an array (0-based) |
| `canAddItems` | `boolean` | `true` when the array can accept more occurrences |
| `canRemoveItems` | `boolean` | `true` when the current occurrence can be removed |
| `addItem()` | `() => void` | Appends a new array occurrence |
| `removeItem()` | `() => void` | Removes the current array occurrence |

The `#array` and `#choice` slots receive all the same props except that `fieldContext` only exposes `errors`, `errorMessage`, and `label`.

## Passing Data to Child Slots

You can push extra values down through the field tree by binding them to `<slot />`:

```vue
<!-- In your #default slot -->
<template #default="{ fieldMetadata }">
  <div :class="{ 'col-span-2': fieldMetadata.fullWidth }">
    <slot :is-inside-group="true" />
  </div>
</template>
```

Any field rendered inside this wrapper receives `slotProps` containing `{ isInsideGroup: true }`:

```vue
<!-- A child field's slot sees it via slotProps -->
<template #default="{ slotProps }">
  <div v-if="!slotProps?.isInsideGroup">
    ...
  </div>
</template>
```

---

Continue to [Step 3: Wire Up a Form](/guide/your-first-form).
