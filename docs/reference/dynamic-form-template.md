# DynamicFormTemplate

`DynamicFormTemplate` is the rendering bridge between your field definitions and the HTML you write. It resolves which slot to use for each field and passes the field's data into that slot.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `metadataConfiguration` | `MetadataConfiguration` | Yes | The value returned by `defineMetadata()`. Gives TypeScript the slot and prop types. |

## Slots Overview

For every type name `T` you declared in `defineMetadata()`, nine slots are available — each with a specific rendering role:

| Slot | Role |
|------|------|
| `#T` | Outer wrapper (label, input, error) |
| `#T-input` | The raw input control inside the wrapper |
| `#T-array` | Outer container when this field is a repeatable array |
| `#T-array-item` | Each individual item rendered inside an array |
| `#T-choice` | Outer container when this field is a single (`maxOccurs: 1`) choice |
| `#T-choice-array` | Outer container when this field is a repeatable (`maxOccurs > 1`) choice |
| `#T-choice-array-item` | Each individual occurrence of a repeatable explicit choice |
| `#T-wizard` | Outer container (chrome, navigation) when this field is a `wizard` |
| `#T-wizard-page` | Visibility/nav wrapper around each of a wizard's pages |

All slots are optional. When a slot is missing, the library walks a fallback chain until it finds one you've defined:

```
#text                   ──► #default
#text-input             ──► #default-input             ──► #default
#text-array             ──► #default-array             ──► #default
#text-array-item        ──► #default-array-item        ──► #default
#text-choice            ──► #default-choice            ──► #default
#text-choice-array      ──► #default-choice-array      ──► #text-choice ──► #default-choice ──► #default
#text-choice-array-item ──► #default-choice-array-item ──► #text-array-item ──► #default-array-item ──► #default
#text-wizard            ──► #default-wizard
#text-wizard-page       ──► #default-wizard-page        ──► #default
```

The two `-choice-array` families degrade into a related family before reaching `#default`. A repeatable choice is still a choice (both families receive the same slot props), so without any `-choice-array` slot it renders through your `-choice` slots. A repeatable-choice occurrence behaves like an array item (its slot props are a superset of the array-item props), so without any `-choice-array-item` slot it renders through your `-array-item` slots. Define the dedicated slots only when repeatable choices need their own layout.

This means you can define just `#default` and `#default-input` to handle every field type, then progressively opt into more specific slots as needed.

## Slot Props — Regular Slots

`#default`, `#default-input`, `#default-array-item`, `#default-choice-array-item`, and all named `#T`, `#T-input`, `#T-array-item`, `#T-choice-array-item` slots receive:

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

`true` when the array can accept another occurrence (current count is below `maxOccurs`). Useful for showing or hiding an "Add" button. In a repeatable-choice occurrence slot it reflects `canAddChoiceOccurrence` for that occurrence's branch (the shared choice budget).

### `canRemoveItems`

Type: `boolean`

`true` when the current occurrence can be removed (current count is above `minOccurs`, or the item has a value that can be cleared). Useful for showing or hiding a "Remove" button.

### `addItem()`

Type: `() => void`

Appends a new occurrence to the array. Only meaningful when `canAddItems` is `true`. In a repeatable-choice occurrence slot it appends another occurrence of that occurrence's own branch.

### `removeItem()`

Type: `() => void`

Removes the current occurrence from the array. Only meaningful when `canRemoveItems` is `true`. In a repeatable-choice occurrence slot it removes that occurrence from its branch.

### `branchKey`

Type: `string`

Only on the `#T-choice-array-item` / `#default-choice-array-item` slots: the `name` of the choice branch this occurrence belongs to. Useful for a "kind" badge when occurrences of different branches render in one list.

### `slotProps`

Type: `SlotProperties | undefined`

Extra data passed down from the parent slot via `<slot :my-prop="value" />`. Access it as `slotProps?.myProp`. The type is `SlotProperties` when declared as the third generic of `defineMetadata()`, otherwise `object | undefined`. See [Passing Data to Child Slots](#passing-data-to-child-slots) below.

## Slot Props — Array and Choice Container Slots

`#default-array`, `#default-choice`, `#default-choice-array`, and all named `#T-array`, `#T-choice`, `#T-choice-array` slots receive the same props as regular slots **except** that `fieldContext` is reduced to:

| Property | Type | Description |
|----------|------|-------------|
| `value` | `ComputedRef<T[]>` | The current array/choice values (all occurrences) |
| `errors` | `Ref<string[]>` | Active validation errors on the container |
| `errorMessage` | `Ref<string \| undefined>` | First active error |
| `label` | `MaybeRefOrGetter<string \| undefined>` | Resolved label (from `fieldOptions.label`) |

All other props (`required`, `disabled`, `canAddItems`, `canRemoveItems`, `addItem`, `removeItem`, `slotProps`) are the same.

### Choice-Only Props

The choice container slots (`#T-choice`, `#default-choice`, `#T-choice-array`, `#default-choice-array`) additionally receive the explicit-selection primitives. They are mainly relevant when the choice sets `explicitChoiceSelection: true` (see [Select first, then fill in](/examples/choices#select-first-then-fill-in)):

| Property | Type | Description |
|----------|------|-------------|
| `addChoiceOccurrence` | `(branchKey: string) => void` | Marks a branch active (`maxOccurs: 1`) or adds one occurrence of it (`maxOccurs > 1`). No-op when `canAddChoiceOccurrence(branchKey)` is `false`. |
| `removeChoiceOccurrence` | `(branchKey: string, index?: number) => void` | Removes an occurrence. `index` is required for a repeatable choice; for `maxOccurs: 1` it is ignored and the active branch is deselected. |
| `canAddChoiceOccurrence` | `(branchKey: string) => boolean` | `false` when the branch's own budget or the choice's shared occurrence budget is exhausted, or the choice is disabled. |
| `activeChoiceOccurrences` | `{ branchKey: string, index: number }[]` | Every currently active occurrence, grouped by branch declaration order, then by index within the branch. |
| `usedChoiceOccurrences` | `number` | Choice slots currently consumed, in choice-occurrence units (a repeatable branch's items are batched by its own `maxOccurs`), the same unit `xsd_choiceMinOccurs` counts in. |

::: tip
`#T-array-item` / `#default-array-item` and `#T-choice-array-item` / `#default-choice-array-item` are **not** container slots — they render each individual occurrence, so they receive the full `fieldContext` including `value`, `handleChange`, `errors`, etc. The choice-array-item slots additionally receive `branchKey`, the choice branch the occurrence belongs to, and their `addItem` / `canAddItems` / `removeItem` operate on that branch's occurrences.
:::

## Wizard Container and Page Slots

A `wizard: true` field (see [`wizard`](/reference/field-metadata#wizard)) renders through two dedicated slot families instead of the regular ones above.

### `#T-wizard` / `#default-wizard` — the container

Receives everything above **except** `fieldContext` is reduced to `LimitedFieldContext` (like the array/choice container slots), plus the navigation bundle:

| Property | Type | Description |
|----------|------|-------------|
| `pages` | `FieldMetadata[]` | The engine's resolved page list — the corrected page metadata nodes, in page order. Build your stepper from this, never from `fieldMetadata.children`, so it can never desync from what is actually rendered. |
| `pageCount` | `number` | `pages.length` |
| `currentStepIndex` | `number` | The zero-based index of the currently visible page |
| `isFirst` | `boolean` | `true` on the first page |
| `isLast` | `boolean` | `true` on the last page — use this to switch your "Next" control to a "Submit" control |
| `isValidating` | `boolean` | `true` while a `next()` or a validating `gotoStep()` call is in flight |
| `next()` | `() => Promise<void>` | Validates the current page (`validateSection`) and advances only on success |
| `prev()` | `() => void` | Moves back one page unconditionally, no validation |
| `gotoStep(index, options?)` | `(index: number, options?: WizardGotoStepOptions) => Promise<void> \| void` | Jumps to `index` (clamped to a valid page). Backward-only unless `allowForwardJump` is set (config or `options`); validates first when `validateOnJump` is set (config or `options`) |

`<slot />` inside this container renders every page's `#T-wizard-page` wrapper.

### `#T-wizard-page` / `#default-wizard-page` — one page's visibility wrapper

One shape-agnostic wrapper per page, rendered for **every** page (not only the current one) so pages stay mounted and their values survive navigation. Receives:

| Property | Type | Description |
|----------|------|-------------|
| `isCurrent` | `boolean` | `true` when this page is the one currently visible |
| `pageIndex` | `number` | This page's index |
| `currentStepIndex`, `isFirst`, `isLast`, `next`, `prev`, `gotoStep` | same as the container | Lets a page build its own controls (e.g. a summary page's "edit" links via `gotoStep`) |

`<slot />` inside this wrapper renders the page's own content through **its own shape** — a parent page's children directly, an array page through `-array`, a choice page through `-choice` — exactly as if it were not inside a wizard at all. There is no `-wizard-page-array` / `-wizard-page-choice` combinatorial family.

::: warning Gate visibility with `v-show`, never `v-if`
```vue
<!-- Correct: page stays mounted, values and validation state survive navigation -->
<template #default-wizard-page="{ isCurrent }">
  <div v-show="isCurrent"><slot /></div>
</template>

<!-- Wrong: unmounts the page on navigation, clearing its values and deregistering its fields -->
<template #default-wizard-page="{ isCurrent }">
  <div v-if="isCurrent"><slot /></div>
</template>
```
A `v-if` here unmounts the page's `DynamicFormItem` subtree when it stops being current. That clears the page's values (unless `keepValuesOnUnmount` is set) **and** deregisters its fields from vee-validate, so a later "Submit" would send that page's data unvalidated even if the value happened to survive. `v-if` is acceptable only for a genuinely field-less page — a static summary or review step with nothing to lose.
:::

```vue
<template #default-wizard="{ pages, currentStepIndex, isFirst, isLast, isValidating, next, prev, gotoStep }">
  <nav>
    <button v-for="(page, i) in pages" :key="page.path" :disabled="i > currentStepIndex" @click="gotoStep(i)">
      {{ page.name }}
    </button>
  </nav>
  <slot />
  <footer>
    <button type="button" :disabled="isFirst" @click="prev">Back</button>
    <button v-if="!isLast" type="button" :disabled="isValidating" @click="next">Next</button>
    <button v-else type="submit">Submit</button>
  </footer>
</template>

<template #default-wizard-page="{ isCurrent }">
  <div v-show="isCurrent"><slot /></div>
</template>
```

## The `<slot />` Inside Your Slot Templates

Inside `#default` (or any named wrapper slot), rendering `<slot />` tells the library to insert the field's content:

- For a **leaf field**: inserts the `#{type}-input` (or `#default-input`) slot.
- For a **parent/group field**: inserts all child components.
- For an **array outer slot** (`#T-array` / `#default-array`): inserts all current array occurrences, each rendered through `#T-array-item` (or `#default-array-item`).
- For a **choice outer slot** (`#T-choice` / `#default-choice`, or `#T-choice-array` / `#default-choice-array` when the choice is repeatable): inserts the choice branches — for a repeatable explicit choice, its active occurrences, each rendered through `#T-choice-array-item` (or `#default-choice-array-item`).

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
