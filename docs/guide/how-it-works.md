# How It Works

Once you have a template and a mounted `<DynamicForm>`, the interesting part is that you mainly keep writing metadata. This page explains how the runtime interprets that metadata.

## The Basic Field Model

A metadata node can represent one of these shapes:

- a normal input field
- a grouped field with `children`
- a repeatable field with `maxOccurs > 1`
- a mutually exclusive structure with `choice`
- a field with `attributes`

The same node can combine multiple behaviors. For example, a grouped field can also be repeatable.

## Paths

Every field ends up with a `path`, and that path is what connects rendering, value storage, and validation.

Examples:

- `person.firstName`
- `person.contacts[0].email`
- `invoice.lines[2].price`

If you do not set a path yourself, the library derives it from the parent path and the field name.

## The Properties Most Developers Start With

These are the first properties worth learning because they already produce a useful form:

- `name`: logical name of the field
- `type`: your template field type such as `text`, `select`, or `checkbox`
- `fieldOptions.label`: label exposed by `vee-validate` and typically used in the template
- `children`: creates a grouped structure
- `minOccurs`: controls whether a field is optional or required

The practical default behavior is:

- `type` defaults to `text`
- `minOccurs` defaults to `1`, so fields are required unless made optional
- `maxOccurs` defaults to `1`, so fields are not arrays unless you opt in

## Groups With `children`

A node with `children` becomes a grouped field.

Groups are useful for:

- visual sections
- nested data objects
- reusable grouped blocks that can also become arrays

Optional groups have an important behavior: if the group itself has `minOccurs: 0`, the runtime relaxes child requirements until the user starts filling something in that group.

That makes optional sections behave naturally without forcing users to complete hidden or untouched child fields.

## Arrays With `maxOccurs`

When `maxOccurs > 1`, the field becomes repeatable.

The runtime manages:

- how many items currently exist
- when an item can be added
- when an item can be removed
- when the field still counts as required

This works for:

- single input arrays
- grouped arrays
- arrays inside choices

## Choices With `choice`

Choice fields model mutually exclusive branches.

This is where the library differs most from a plain schema renderer. A choice field tracks which branch has values and adjusts sibling branches accordingly.

That allows one metadata structure to express cases like:

- email or phone
- self-serve launch or guided rollout
- one of several grouped sections
- one of several repeatable branches

## Dynamic Behavior With `computedProps`

`computedProps` is the main tool for live metadata changes.

It runs at the field component level, which means you can reactively update properties on `fieldMetadata` without re-rendering the whole form tree.

Typical uses:

- disable a field until another field has a value
- make a field required only in a certain scenario
- change a description or label dynamically
- load or swap select `options`

Example:

```ts
{
  name: 'trainingFormat',
  type: 'select',
  minOccurs: 0,
  computedProps: [(field) => {
    field.options = optionStore.trainingFormat;
    field.disabled = !needsTraining.value;
    field.minOccurs = needsTraining.value ? 1 : 0;
  }],
}
```

Use `computeOnChildValueChange: true` when a parent field needs to recompute based on changes inside its descendants.

## The Most Important Advanced Shapes

### Grouped fields

Use `children` when one node should contain a nested object.

Template concern:
Your `#default` slot should detect `fieldMetadata.children?.length` and render a group wrapper instead of a normal single-field wrapper.

### Array fields

Use `maxOccurs > 1` when one node can occur multiple times.

Template concern:
Decide whether add/remove buttons belong in `#array`, in `#default`, or both depending on whether the array items are simple inputs or grouped sections.

### Choice fields

Use `choice` when only one branch should be active at a time.

Template concern:
Choice fields usually need a clearer visual boundary than normal groups so the user understands the mutually exclusive relationship.

## Advanced Example

<ClientOnboardingPlannerExampleContext />

The client onboarding example is a good reference because it combines:

- grouped company details
- repeatable project contacts
- a choice-based launch approach
- computed select options and required states

## Next

Continue with [Validation](/guide/validation) for the rule model, then use [Metadata Reference](/guide/metadata-reference) as the full lookup page.
