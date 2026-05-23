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

The library appends a suffix to the field type to determine which slot to call, then walks a fallback chain until it finds one you've defined:

| Situation | Slot tried first | Fallback |
|-----------|-----------------|----------|
| Outer wrapper | `{type}` (e.g. `select`) | `default` |
| Input control | `{type}-input` (e.g. `select-input`) | `default-input` → `default` |
| Array container | `{type}-array` (e.g. `text-array`) | `default-array` → `default` |
| Array item | `{type}-array-item` (e.g. `text-array-item`) | `default-array-item` → `default` |
| Choice container | `{type}-choice` (e.g. `select-choice`) | `default-choice` → `default` |

You only need to define slots for the cases that need special handling. Everything else falls through automatically.

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

## Array and Choice Container Slots

Array and choice containers have their own fallback slots. Both receive a limited `fieldContext` (only `errors`, `errorMessage`, and `label`).

**`#default-array`** — fallback outer container for any repeating field, renders once and wraps all occurrences:

```vue
<template #default-array="{ fieldContext: { label, errorMessage }, required, canAddItems, addItem }">
  <h3>{{ label }}<span v-if="required"> *</span></h3>
  <slot />
  <button type="button" v-if="canAddItems" @click="addItem">+ Add</button>
  <span v-if="errorMessage.value">{{ errorMessage.value }}</span>
</template>
```

Use a type-specific slot (e.g. `#text-array`) to override just that type's container without affecting others.

**`#default-choice`** — fallback outer container for any choice field, renders once and wraps all branches:

```vue
<template #default-choice="{ fieldContext: { label, errorMessage }, required }">
  <h3>{{ label }}<span v-if="required"> *</span></h3>
  <slot />
  <span v-if="errorMessage.value">{{ errorMessage.value }}</span>
</template>
```

Each branch inside a choice goes through the normal slot resolution (`{type}` → `default`) with the `disabled` prop reflecting whether that branch is locked by a sibling choice.

**`#default-array-item`** — fallback for each individual occurrence inside an array. Receives the full slot props including `index`, `canRemoveItems`, and `removeItem`.

## Full Slot Props Reference

All named slots receive:

| Prop | Type | Description |
|------|------|-------------|
| `fieldMetadata` | `FieldMetadata` | Full field config including extended properties |
| `fieldContext` | `FieldContext` | vee-validate context: `value`, `handleChange`, `handleBlur`, `errors`, `errorMessage`, `hasValue` |
| `required` | `boolean` | `true` when `minOccurs >= 1` and field is not disabled |
| `disabled` | `boolean` | `true` when `maxOccurs === 0` |
| `index` | `number` | Position within the parent (array, children, choice, or attributes), 0-based |
| `canAddItems` | `boolean` | `true` when the array can accept more occurrences |
| `canRemoveItems` | `boolean` | `true` when the current occurrence can be removed |
| `addItem()` | `() => void` | Appends a new array occurrence |
| `removeItem()` | `() => void` | Removes the current array occurrence |
| `settings` | `DynamicFormSettings` | The form settings object, including any extended properties declared in `defineMetadata` |
| `slotProps` | `SlotProperties \| undefined` | Values threaded down from a parent slot's `<slot />` binding |

The array and choice container slots (`#default-array`, `#default-choice`, and their type-specific variants) receive all the same props except that `fieldContext` only exposes `errors`, `errorMessage`, and `label`.

## Accessing Settings in Templates

Every slot receives a `settings` prop containing the form's `DynamicFormSettings` object. You can destructure it directly to access any setting — including extended properties declared in your metadata:

```vue
<template #default="{ fieldMetadata, fieldContext: { label, errorMessage }, required, settings: { showRequiredOrOptional } }">
  <label :for="fieldMetadata.path">
    {{ label }}
    <span v-if="showRequiredOrOptional === 'required' && required" class="text-red-500"> *</span>
    <span v-if="showRequiredOrOptional === 'optional' && !required" class="text-gray-400"> Optional</span>
  </label>
  <slot />
  <span v-if="errorMessage.value" class="error">{{ errorMessage.value }}</span>
</template>
```

This lets template display logic (like required/optional indicators, theme flags, or mode toggles) be driven by form settings without threading values through individual field metadata.

To declare extended settings properties, add the fourth generic to `defineMetadata`:

```ts
const metadata = defineMetadata<
  { text: string; select: string },
  {},   // ExtendedFieldProperties — per-field extras
  {},   // SlotProperties — values threaded through <slot />
  { showRequiredOrOptional?: 'optional' | 'required' }
>();
```

Then pass the setting when using the form:

```vue
<DynamicForm
  :template="MyFormTemplate"
  :metadata="fields"
  :settings="{ showRequiredOrOptional: 'optional' }"
/>
```

All slots — `#default`, `#default-input`, `#default-array`, `#default-choice`, and every type-specific slot — receive the same `settings` object.

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
