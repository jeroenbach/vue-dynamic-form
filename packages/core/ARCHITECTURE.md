# Architecture

Internal overview of how the core package works. Intended for contributors, not library users.

## Core Building Blocks

### `DynamicForm`

The runtime entry point. It:

- accepts a metadata array and a template component
- normalises the metadata tree (fills in `minOccurs`, `maxOccurs`, `type`, `name`, `path` defaults)
- provides settings to all nested form items via provide/inject

### `DynamicFormTemplate`

The rendering contract between the engine and the UI layer. Exposes named slots for each structural shape so the template author can map them to their own components without touching the library internals.

### Metadata Tree

Each node in the metadata array represents one of these shapes:

| Shape                   | Key property            |
| ----------------------- | ----------------------- |
| Input field             | `type` (maps to a slot) |
| Group / parent          | `children`              |
| Choice                  | `choice`                |
| Array / repeatable      | `maxOccurs > 1`         |
| Attribute-bearing field | `attributes`            |

The engine walks the tree recursively and decides per node which `DynamicFormItem*` component to mount.

## How Dynamic Rendering Works

### Paths

Every field gets a normalised path. If not provided, the library derives it from the parent path and field name:

- `person.firstName`
- `person.contacts[0].email`
- `invoice.lines[2].price`

Paths are used for rendered `id` attributes and for `vee-validate` field registration.

### Groups

A node with `children` is treated as a group/parent. The group itself may be optional or repeatable. Child validation constraints are tightened or relaxed depending on the group's optional/active state.

### Arrays (`DynamicFormItemArray`)

A field becomes repeatable when `maxOccurs > 1`. The array component:

- manages placeholders and add/remove interactions
- tracks occurrences independently from validation state
- applies `minOccurs` / `maxOccurs`
- supports nested groups and nested arrays inside each occurrence

### Choices (`DynamicFormItemChoice`)

A node with `choice` is treated as a mutually exclusive branch selector. The choice engine:

- tracks which branch currently has values
- disables sibling branches when one becomes active
- supports nested choices and array-based branches
- calculates per-branch `minOccurs` / `maxOccurs` overrides dynamically

### `computedProps`

Each metadata item can carry a `computedProps` array — functions that run reactively inside the engine's render cycle. They receive the field descriptor and the current value ref, and can mutate the descriptor freely (`field.disabled`, `field.options`, `field.minOccurs`, `field.hide`, …). The engine re-runs them whenever their reactive dependencies change.

## Validation Model

The library builds on `vee-validate` rather than replacing it.

### Built-in Rules

XSD-inspired rules registered globally when the library initialises:

`xsd_required`, `xsd_minOccurs`, `xsd_choiceMinOccurs`, `xsd_minLength`, `xsd_maxLength`, `xsd_length`, `xsd_pattern`, `xsd_minInclusive`, `xsd_maxInclusive`, `xsd_minExclusive`, `xsd_maxExclusive`, `xsd_enumeration`, `xsd_whiteSpace`, `xsd_fractionDigits`, `xsd_totalDigits`

### Message Resolution

Messages are resolved in priority order:

1. `settings.messages` passed to `DynamicForm`
2. `vee-validate` `configure({ generateMessage })`
3. Rule default output

Supports positional placeholders (`{0}`, `{1}`) and semantic placeholders (`{min}`, `{max}`, `{length}`, `{digits}`, `{field}`).

### Custom Validation

A field's `validation` property accepts a single function, an array of functions, a pipe-separated string expression, or an object expression. Multi-rule expressions are split internally so multiple errors can be collected independently.

## Template Strategy

1. `defineMetadata()` creates a typed metadata configuration — field value types, extended field properties, slot properties, and extended settings.
2. `DynamicFormTemplate` reads that configuration and narrows the TypeScript types of each slot's props accordingly.
3. The template author writes one slot per field type and one slot per structural shape; the engine calls the right slot for each node.

This keeps a clean separation:

- the core package owns **behaviour**
- the template owns **layout and styling**
- the app owns **business-specific metadata**
