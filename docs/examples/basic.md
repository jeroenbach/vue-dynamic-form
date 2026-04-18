# Basic Form

This example shows the smallest useful metadata-driven form in the repository setup.

## What It Demonstrates

- a normal text field
- generated field paths
- validation message rendering
- form state coming from `useDynamicForm()`

## Example

<BasicFormExample name="default" />

## How This Setup Works

This example is split into three small pieces:

1. `BasicFormExample.vue` defines the metadata and reads form state with `useDynamicForm()`.
2. `BasicForm.vue` mounts `DynamicForm` and passes in the template plus validation messages.
3. `BasicFormTemplate.vue` defines how a field is rendered by mapping the library slots to local UI components.

The metadata in the example only contains labels. The library fills in defaults such as field names and paths, so the two items render as simple text inputs. The template provides the wrapper, input, and error rendering, while `useDynamicForm()` exposes the live values and meta state shown below the form.

## Template Source


<<< @/.vitepress/theme/components/BasicFormTemplate.vue#basic-form-template{2-3,10-14,18-23,26-32} [BasicFormTemplate.vue]

`BasicFormTemplate.vue` is the rendering layer. It defines the metadata contract with `defineMetadata()`, then uses `DynamicFormTemplate` slots to wrap each field in `FormField`, render a `TextInput`, and show the current validation message.

## Form Source

<<< @/.vitepress/theme/components/BasicForm.vue#basic-form{2-4,11-15,35-39} [BasicForm.vue]

`BasicForm.vue` is the thin bridge between metadata and the template. It receives the metadata array, passes it to `DynamicForm`, and provides a small `settings` object so the validation messages are readable in the demo.

## Related Source

- [docs/.vitepress/theme/components/BasicFormExample.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/BasicFormExample.vue)
- [docs/.vitepress/theme/components/BasicFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/BasicFormTemplate.vue)
- [docs/.vitepress/theme/components/BasicForm.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/BasicForm.vue)
