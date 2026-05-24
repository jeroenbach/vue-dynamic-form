# Basic Form

A minimal form showing the core concepts: metadata definition, field path generation, and form state via `useDynamicForm()`.

## What It Demonstrates

- Defining a heading group with child text fields
- Automatic field path generation from field names
- Validation message rendering
- Reading live form values and meta state

## Example

<FormExampleBasic />

## Metadata

The form is driven by a small metadata array. Two text fields nested under a heading section:

<<< @/.vitepress/theme/components/FormExampleBasic.vue#metadata{ts} [FormExampleBasic.vue]

## Related Source

- [FormExampleBasic.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleBasic.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
- [AdvancedForm.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedForm.vue)
