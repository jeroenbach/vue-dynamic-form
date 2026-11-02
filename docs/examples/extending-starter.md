# Extending The Starter Template

The [starter template](/guide/starter-template) ships a complete set of controls, but every project has a few fields of its own. This example adds two project-specific field types on top of the starter catalogue: a multi-line `textarea` and a star `rating`. Everything else (the chrome, headings, validation display, all other field types) keeps the starter rendering.

## What It Demonstrates

- Declaring extra field types and field properties with `extendMetadata`
- Supplying the `<type>-input` slot for each new type through a wrapper component
- The new controls rendering inside the starter's built-in field chrome (label, description, error message)
- Full type safety: `rows`, `maxRating`, and the new `type` values are checked in your metadata

## Example

<FormExampleProjectFields />

## 1. Declare the field types

`extendMetadata` layers your own field types and properties on top of the built-in catalogue. It is purely a type carrier: nothing is merged at runtime. Keep it in a `.ts` file next to the template so pages can import the `Metadata` type without pulling in the component:

<<< @/.vitepress/theme/components/ProjectFormTemplate.ts#metadata-configuration{ts} [ProjectFormTemplate.ts]

## 2. Wrap the starter template

The wrapper passes the extended configuration via `metadataConfiguration` and adds one `<type>-input` slot per new field type. The `#input` and `#attributes` slots must always be forwarded: they hand the engine's field and attribute renders to the starter's built-in chrome.

Because the slots are named `textarea-input` and `rating-input`, the new controls render inside the same field chrome as every built-in control. The label, description, required tag, and error message all come for free:

<<< @/.vitepress/theme/components/ProjectFormTemplate.vue [ProjectFormTemplate.vue]

## 3. Use the new types in metadata

Pass the wrapper as the template and use the new types like any built-in one. TypeScript checks `rows` and `maxRating` because the `Metadata` type comes from the extended configuration:

<<< @/.vitepress/theme/components/FormExampleProjectFields.vue#metadata{ts} [FormExampleProjectFields.vue]

```vue
<DynamicForm :metadata="metadata" :template="ProjectFormTemplate" />
```

## Notes

- **Collisions replace, not merge.** Redeclaring a built-in type (for example `text`) or a built-in property (for example `description`) replaces the built-in declaration. Supply the matching slot as well in that case, because the built-in markup still assumes the built-in property shape.
- **`input` and `attributes` are reserved.** Field types with these names are not supported; they are the engine-carried slots the wrapper forwards.
- **Overriding built-ins works the same way.** A dedicated per-type slot such as `text-input` wins over `default-input`, so the same wrapper can also restyle one built-in control without touching the others.

## Related Source

- [ProjectFormTemplate.ts](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/ProjectFormTemplate.ts)
- [ProjectFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/ProjectFormTemplate.vue)
- [FormExampleProjectFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleProjectFields.vue)
- [StarterFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/StarterFormTemplate.vue)
