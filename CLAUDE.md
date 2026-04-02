# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands use `pnpm`. The repo is a monorepo managed with pnpm workspaces.

```bash
# Run everything (build + test + lint + typecheck)
pnpm -r ci

# Development — watches core/element-plus and runs Storybook
pnpm dev

# Build all packages
pnpm -r build

# Test all packages
pnpm -r test

# Test a single package
pnpm --filter '@bach.software/vue-dynamic-form' test

# Lint all packages
pnpm -r lint

# Typecheck all packages
pnpm -r typecheck
```

Tests use **Vitest** with **@vue/test-utils** and a **jsdom** environment. There is no watch mode script — use `vitest` directly if needed.

## Architecture

This is an XSD-inspired dynamic form engine built on Vue 3 + vee-validate. The monorepo has two publishable packages:

- **`packages/core`** (`@bach.software/vue-dynamic-form`) — the form engine; framework-agnostic (pure Vue 3)
- **`packages/element-plus`** (`@bach.software/vue-dynamic-form-element-plus`) — pre-built template using Element Plus UI components

### Component hierarchy

```
DynamicForm                      ← root; provides DynamicFormSettings via inject
  └─ DynamicFormItem             ← recursive; one per field; uses vee-validate useField
       ├─ DynamicFormItemArray   ← when maxOccurs > 1; manages add/remove via useFieldArrayExtended
       ├─ DynamicFormItemChoice  ← when field.choice is set; tracks which children have values
       └─ DynamicFormTemplate    ← generic slot dispatcher; routes to #{type}, #{type}-input, #array, #choice, #default
```

### How rendering works

`DynamicForm` pre-processes raw metadata: assigns names, builds dot-notation paths, sets defaults (`type='text'`, `minOccurs=1`, `maxOccurs=1`), and links `parent` back-references.

`DynamicFormItem` then creates a vee-validate field for each item and decides how to render:
- `choice` set → `DynamicFormItemChoice`
- `maxOccurs > 1` → `DynamicFormItemArray`
- has `children` → parent mode: renders `DynamicFormTemplate` with a `#children` slot
- otherwise → leaf mode: renders `DynamicFormTemplate` with an `#input` slot

`DynamicFormTemplate` is a generic component (`<TMetadataConfiguration>`) that receives `type`, `fieldMetadata`, `fieldContext`, `required`, `disabled`, etc. as **attributes** (not props — intentionally hidden from users). It converts kebab-case attrs to camelCase and routes to the right named slot. The slot types are:
- `#array` / `#choice` → `ArrayChoiceSlotProps` (with `LimitedFieldContext`)
- `#{type}`, `#{type}-input`, `#default`, `#default-input` → `SlotProps` (with full vee-validate `FieldContext`)

### Validation

All custom rules are registered with vee-validate's `defineRule` under `xsd_*` names (e.g. `xsd_required`, `xsd_minLength`). They map directly to XSD restriction concepts.

`createValidation(rule, param, customMessage)` wraps each rule into a vee-validate-compatible function that also applies custom message interpolation. Message placeholders: `{field}`, `{value}`, `{0}` (positional), or named params (`{min}`, `{max}`, `{length}`, etc.) defined in `ruleParamNames`.

Validation is assembled in `DynamicFormItem` from `fieldMetadata.restriction` + `fieldMetadata.validation`, combined into a single `combinedValidation` computed array.

### Key types

- **`FieldMetadata`** — the core field descriptor; supports `children` (nested), `choice` (XSD choice), `attributes` (complex type attributes), `computedProps` (reactive transforms), `restriction` (XSD rules), `validation` (raw vee-validate rules)
- **`MetadataConfiguration`** — output of `defineMetadata`; carries `fieldTypes`, `extendedProperties`, `valueTypes` as TypeScript generics
- **`DynamicFormSettings`** — injected globally; controls analytics and validation message overrides

### Complex types

When `isComplexType: true`, the field value is stored as `{ value: ..., attr1: ..., attr2: ... }`. The path for the main value uses a `['value']` segment internally, normalized to `value` for vee-validate.

### Vue conventions

- Always use camelCase (not kebab-case) in Vue templates and component APIs.
