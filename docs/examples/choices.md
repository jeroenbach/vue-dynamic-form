# Choice Fields

Mutually exclusive branches. Selecting one branch disables the others and relaxes their child field validation until that branch becomes active.

## What It Demonstrates

- `choice` array on a heading to declare mutually exclusive branches
- Branch children are only validated once the branch is active
- Sibling branches are automatically disabled when one branch has a value
- Each branch can have its own `children` with independent fields

## Example

<FormExampleChoiceFields />

## Choice Structure

The `choice` property replaces `children` on the heading. Each entry becomes a selectable branch:

<<< @/.vitepress/theme/components/FormExampleChoiceFields.vue#choice-structure{ts} [FormExampleChoiceFields.vue]

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleChoiceFields.vue#metadata{ts} [FormExampleChoiceFields.vue]

## Related Source

- [FormExampleChoiceFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceFields.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
