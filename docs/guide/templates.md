# Templates

`DynamicFormTemplate` is the rendering layer of the library.

The core package owns form logic. Your template owns markup, layout, and styling.

## Why Templates Exist

Instead of hard-coding one UI framework into the library, the runtime exposes slots for different structural cases:

- default field wrapper
- input rendering
- grouped fields
- array fields
- choice fields
- attributes

That keeps the metadata and validation engine reusable across projects.

## Typical Flow

1. define a metadata configuration with `defineMetadata()`
2. create a `DynamicFormTemplate` implementation
3. pass that template into `DynamicForm`

## Example Template Responsibilities

A template typically decides:

- how labels are shown
- where add/remove buttons appear
- how validation errors are rendered
- how grouped and nested content is laid out
- how specific input types map to actual HTML or component-library inputs

The example template in this repository is here:

- [packages/core/src/examples/TestFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/core/src/examples/TestFormTemplate.vue)

## Example Snippet

```vue
<DynamicFormTemplate :metadata-configuration="metadata">
  <template #default="{ fieldMetadata, fieldContext: { errorMessage, label } }">
    <label :for="fieldMetadata.path">{{ label }}</label>
    <slot />
    <span v-if="errorMessage.value">{{ errorMessage.value }}</span>
  </template>

  <template #default-input="{ fieldMetadata, fieldContext: { value, handleChange } }">
    <input :id="fieldMetadata.path" :value="value.value" @input="handleChange" />
  </template>
</DynamicFormTemplate>
```

## Interactive Example

<BasicFormExample name="groups" title="Template Demo With Groups" description="The repository example template rendering required groups, optional groups, and grouped arrays." />
