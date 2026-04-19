# Templates

`DynamicFormTemplate` is the rendering contract between the library and your UI.

The core package decides which field is currently being rendered. Your template decides the markup, components, layout, buttons, labels, and styling.

## The Job Of A Template

A template usually answers these questions:

- how should a normal field wrapper look
- how should the actual input element be rendered
- how should grouped fields be laid out
- where should array add/remove buttons live
- how should choice fields be presented
- where should descriptions, helper text, and errors appear

## Minimal Template

<<< @/.vitepress/theme/components/BasicFormTemplate.vue#basic-form-template{2-3,10-14,18-23,26-32} [BasicFormTemplate.vue]

That example already shows the two most important slots:

- `#default`: the wrapper around a field
- `#default-input`: the actual input control

## Slot Naming Rules

For every field type you define with `defineMetadata()`, you can provide two slots:

- `#fieldType`
- `#fieldType-input`

For example, if you defined `select`:

- `#select` renders the field wrapper
- `#select-input` renders the control itself

If either slot is missing, the template falls back to:

- `#default`
- `#default-input`

## Structural Slots

The library also exposes structural slots for the special field shapes:

- `#array`
- `#choice`

Grouped fields are not a separate slot name. A grouped field still goes through `#default`, and your template can detect that by checking `fieldMetadata.children?.length`.

## A More Complete Example

<<< @/.vitepress/theme/components/AdvancedFormTemplate.vue#template-metadata-contract{2-3,16-27} [AdvancedFormTemplate.vue]

<<< @/.vitepress/theme/components/AdvancedFormTemplate.vue#structural-slots{2-67} [AdvancedFormTemplate.vue]

<<< @/.vitepress/theme/components/AdvancedFormTemplate.vue#input-slots{2-36} [AdvancedFormTemplate.vue]

This pattern works well:

- keep structural slots responsible for layout and field chrome
- keep `*-input` slots focused on the input component only

## Slot Props

Every field-rendering slot receives a slot props object. The most important properties are:

| Property | Available in | Meaning |
| --- | --- | --- |
| `type` | all slots | Current rendering mode, such as a field type, `array`, or `choice` |
| `fieldMetadata` | all slots | The metadata object for the current field, including your extended properties |
| `fieldContext` | all slots | Extended `vee-validate` field context for this item |
| `required` | all slots | Whether the field currently behaves as required |
| `disabled` | all slots | Whether the field is disabled by runtime logic |
| `index` | all slots | Current array index when applicable |
| `canAddItems` | structural and array/group situations | Whether another occurrence can be added |
| `canRemoveItems` | structural and array/group situations | Whether the current occurrence can be removed |
| `addItem()` | structural and array/group situations | Adds an occurrence |
| `removeItem()` | structural and array/group situations | Removes an occurrence |

## `fieldContext`

For normal field and input slots, `fieldContext` is the richest object. It extends the `vee-validate` field context and adds `hasValue`.

Commonly used properties:

- `value`
- `errors`
- `errorMessage`
- `label`
- `meta`
- `handleChange`
- `handleBlur`
- `hasValue`

For `array` and `choice` slots, the context is intentionally smaller. Those structures do not represent one direct input value, so their context exposes:

- `errors`
- `errorMessage`
- `label`

## Detecting Different Shapes

Within `#default`, you will commonly branch like this:

```vue
<template #default="{ fieldMetadata }">
  <GroupField v-if="fieldMetadata.children?.length">
    <slot />
  </GroupField>

  <FormField v-else>
    <slot />
  </FormField>
</template>
```

That lets one slot handle both:

- simple input fields
- grouped fields with `children`

## Passing Information Downward

You can pass your own values from a parent template layer to the fields rendered below it.

Example:

```vue
<template #array>
  <slot :hide-label="true" :level="2" />
</template>
```

Those values become available to the child template component through its `slotProps` prop. This is how you can communicate layout hints such as:

- hide labels in nested arrays
- track nesting level
- mark that a field is rendered under a choice branch

The repository example at [packages/core/src/examples/TestFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/core/src/examples/TestFormTemplate.vue) uses that pattern extensively.

## Recommended Teaching Order

Templates are easiest to explain in this order:

1. `#default-input`
2. `#default`
3. one custom field like `#select-input`
4. grouped fields inside `#default`
5. `#array`
6. `#choice`
7. custom values passed down through `<slot />`

That sequence mirrors how a developer actually builds the template.

## Interactive Example

<BasicFormExample name="groups" title="Template Demo With Groups" description="A reusable template handling normal inputs, grouped fields, and array/group combinations." />

## Next

Continue with [DynamicForm](/guide/dynamic-form) to see how the template, metadata, and settings come together in a real form.
