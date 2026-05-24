# Arrays & Groups

Repeatable sections controlled by `minOccurs` / `maxOccurs`, with per-item titling and an empty-state message.

## What It Demonstrates

- `minOccurs` / `maxOccurs` to control how many times a section can repeat
- `autoAddMinOccurs: false` for opt-in (empty by default) arrays
- `arrayItemName`, `arrayItemNamePlural` for friendly add/remove labels
- `arrayItemFieldForTitle` to use a child field value as the item title
- `arrayNoItemsMessage` for an empty-state prompt

## Example

<FormExampleArrayFields />

## Array Field Options

The array behaviour is configured directly on the heading field:

<<< @/.vitepress/theme/components/FormExampleArrayFields.vue#array-field-options{ts} [FormExampleArrayFields.vue]

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleArrayFields.vue#metadata{ts} [FormExampleArrayFields.vue]

## Related Source

- [FormExampleArrayFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleArrayFields.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
