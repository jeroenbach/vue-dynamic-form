# How It Works

The library takes a metadata tree and turns it into a live `vee-validate` form.

## Metadata Shapes

Each node in the metadata tree can behave as one of the following:

- input field
- parent/group with `children`
- repeatable field with `maxOccurs > 1`
- choice field with `choice`
- field with `attributes`

`DynamicForm` normalizes this tree and computes defaults such as:

- `name`
- `path`
- `type`
- `minOccurs`
- `maxOccurs`

## Path Resolution

Paths drive both rendering and validation registration.

Examples:

- `person.firstName`
- `person.contacts[0].email`
- `invoice.lines[2].price`

If you do not explicitly set a `path`, it is derived from the parent path plus the current field name.

## Groups

A node with `children` becomes a parent/group. Groups can be:

- required
- optional
- repeatable

Optional groups temporarily relax child requirements until the user starts filling values in that group.

## Arrays

When `maxOccurs > 1`, a node becomes repeatable. The array implementation is responsible for:

- add/remove controls
- occurrence tracking
- minimum and maximum occurrence enforcement
- nested content inside each array occurrence

## Choices

When a node contains `choice`, only one branch should be active at a time. The choice engine:

- tracks which branch has values
- disables sibling branches once one branch becomes active
- supports nested choices
- supports choice branches that are groups
- supports choice branches that are arrays

This is the part of the library that behaves most like XSD choice semantics.

## Interactive Example

<BasicFormExample name="choices" title="Choice Behaviors" description="Simple choices, grouped choices, and array-based choices rendered from metadata." />

## Validation Integration

The engine does not replace `vee-validate`; it layers metadata-driven rules on top of it.

- XSD-inspired rules are registered with `defineRule`
- custom validations can still be provided through metadata
- messages can come from settings or `configure({ generateMessage })`

Continue with [Validation](/guide/validation) for the rule model.
