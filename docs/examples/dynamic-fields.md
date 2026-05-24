# Dynamic Fields

Fields whose options are loaded from an external source and cascade changes to dependent fields via `computedProps`.

## What It Demonstrates

- `computedProps` assigning options from a reactive store into `field.options`
- Cascading selections: choosing an industry triggers a request for matching team size options
- Resetting a child value when its options change and the current value is no longer valid
- A context wrapper that simulates an external API call

## Example

<FormExampleDynamicFieldsContext />

## computedProps

Each `computedProps` callback runs reactively whenever its dependencies change. The industry select populates its options and triggers a load for team size; the team size select resets its value if the newly loaded options no longer include it:

<<< @/.vitepress/theme/components/FormExampleDynamicFields.vue#computed-props{ts} [FormExampleDynamicFields.vue]

## Option Loading

The context wrapper simulates an external API — replace `loadOptions` with a real fetch in production:

<<< @/.vitepress/theme/context/FormExampleDynamicFieldsContext.vue#load-options{ts} [FormExampleDynamicFieldsContext.vue]

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleDynamicFields.vue#metadata{ts} [FormExampleDynamicFields.vue]

## Related Source

- [FormExampleDynamicFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleDynamicFields.vue)
- [FormExampleDynamicFieldsContext.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/context/FormExampleDynamicFieldsContext.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
