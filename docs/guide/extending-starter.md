# Extending The Starter Template

The [starter template](/guide/starter-template) ships a complete set of controls, but every project has a few fields of its own. This chapter adds two project-specific field types on top of the starter catalogue: a slider `range` and a star `rating`. Everything else (the chrome, headings, validation display, all other field types) keeps the starter rendering.

Along the way you'll see:

- Declaring extra field types and field properties with `extendMetadata`
- Supplying the `<type>-input` slot for each new type through a wrapper component
- The new controls rendering inside the starter's built-in field chrome (label, description, error message)
- Full type safety: `min`, `max`, `step`, `maxRating`, and the new `type` values are checked in your metadata

## Live Example

<FormExampleProjectFields />

## 1. Declare the field types

`extendMetadata` layers your own field types and properties on top of the built-in catalogue. It is purely a type carrier: nothing is merged at runtime. Keep it in a `.ts` file next to the template so pages can import the `Metadata` type without pulling in the component:

<<< @/.vitepress/theme/components/ProjectFormTemplate.ts#metadata-configuration{ts} [ProjectFormTemplate.ts]

## 2. Wrap the starter template

The wrapper passes the extended configuration via `metadataConfiguration` and adds one `<type>-input` slot per new field type. The `#input` and `#attributes` slots must always be forwarded: they hand the engine's field and attribute renders to the starter's built-in chrome.

Because the slots are named `range-input` and `rating-input`, the new controls render inside the same field chrome as every built-in control. The label, description, required tag, and error message all come for free. The `range` slot also shows why a native slider needs a dedicated slot rather than falling back to the default text input: it pairs the `<input type="range">` with a visible value readout, so the user can see the number they are choosing:

<<< @/.vitepress/theme/components/ProjectFormTemplate.vue [ProjectFormTemplate.vue]

## 3. Use the new types in metadata

Pass the wrapper as the template and use the new types like any built-in one. TypeScript checks `min`, `max`, `step`, and `maxRating` because the `Metadata` type comes from the extended configuration:

<<< @/.vitepress/theme/components/FormExampleProjectFields.vue#metadata{ts} [FormExampleProjectFields.vue]

```vue-html
<DynamicForm :metadata="metadata" :template="ProjectFormTemplate" />
```

## Notes

The full contract (collision semantics, reserved names, and restyling built-in controls with the same wrapper) is documented in [extendMetadata()](/reference/starter-extend-metadata).

## Related Source

- [ProjectFormTemplate.ts](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/ProjectFormTemplate.ts)
- [ProjectFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/ProjectFormTemplate.vue)
- [FormExampleProjectFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleProjectFields.vue)
- [StarterFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/StarterFormTemplate.vue)
