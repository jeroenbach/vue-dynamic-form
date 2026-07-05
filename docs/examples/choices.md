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

## Explicit Activation

By default a branch becomes active once it contains a value. For selection-driven UIs (radio cards, tabs, toggles) you can activate branches explicitly instead. Every `*-choice` template slot receives:

- `activeChoices: string[]` — the names of the currently active branches
- `changeChoice(name)` — single-select: activates `name` and deactivates all other branches
- `activateChoice(name, active?)` — multi-select toggle; multiple branches can be active as long as the choice's `maxOccurs` budget allows it
- `canActivateChoice(name)` — whether the branch can be activated in addition to the current selection

An explicitly activated branch consumes one of the choice's occurrences (disabling siblings once `maxOccurs` is reached), satisfies the choice-level `minOccurs` validation, and switches on the required validation of its own children — even while it is still empty. Branch slots additionally receive `choiceActive`, which templates can use to show only the active branches.

Deactivating a branch removes its values from the form. Set `keepValuesOnDeactivate: true` on the choice field to cache them instead and restore them when the branch is activated again.

The selection can also be driven from the metadata via `activeChoices`: pass a plain array for an initial selection, or a `Ref` for a two-way binding. See the [advanced example](/examples/advanced#explicitly-activated-choice-branches) for a complete radio-card setup.

## Related Source

- [FormExampleChoiceFields.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleChoiceFields.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
