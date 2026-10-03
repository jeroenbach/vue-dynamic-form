---
id: FEAT-004
type: feature
status: in-progress
approved_by: Jeroen
epic: ""
---

<!-- epic: optional. Set to the parent EPIC-XXX id when this feature belongs to an
     epic; leave "" for a standalone feature. Features are never nested under the
     epic folder, they only reference it here (flat model). -->


# Feature: Element Plus form template as a real drop-in replacement

## Decided without Jeroen (research)

Settled from research during discussion, not reviewed by Jeroen. Override any of these freely.

- AR-1 → generic forward of non-enumerated consumer slots to the inner `DynamicFormTemplate` (required to deliver decisions 3 and 5)
- AR-2 → `build.lib.cssFileName: 'style'` plus `build.cssCodeSplit: false` (the current `true` bypasses `cssFileName`), and a `"./style.css"` `exports` entry, so the documented import resolves
- AR-3 → bind `ElUpload` via `v-model:file-list` + `on-change`; audit all 16 controls' real v-model contracts and per-control `>=2.0.0` availability during the port
- AR-4 → slice 1 adds `jsdom` + `@vue/test-utils` (`catalog:test`) to the package `devDependencies`
- AR-5 → `attributes` is reserved alongside `input`; a consumer field type may be named neither

## Problem & goal

**Problem.** `packages/element-plus` already exists and exports `ElementPlusDynamicForm`, a wrapper around `DynamicFormTemplate` with built-in Element Plus rendering for a set of field types (text, select, checkbox, radio, date, time, datetime, switch, number, rate, slider, color, cascader, transfer, upload, heading, divider). It falls short of being a genuine drop-in replacement for `DynamicFormTemplate` in three concrete ways, confirmed by reading the source:

- **Only two of its slots are overridable.** `default` and `default-input` follow a "forward to a named slot with the built-in markup as fallback content" pattern (`<slot name="default" v-bind="slotProps"><ElFormItem>...</ElFormItem></slot>`). Every other slot (`text-input`, `select-input`, `checkbox-input`, `heading`, `divider`, etc.) is hard-coded with no override path at all. A consumer who wants Element Plus's date picker but their own checkbox rendering cannot do that today.
- **No support for the structural shapes the engine has grown since this package was written.** There is no `-choice`, `-choice-array`, `-choice-array-item`, `-wizard`, or `-wizard-page` rendering at all (confirmed: none of these slot names appear in `ElementPlusDynamicForm.vue`). A consumer using explicit choice selection (FEAT-001), repeatable-choice ordering (FEAT-002), or the wizard shape (FEAT-003) with this template falls through to bare `default`/`default-array-item` rendering with none of Element Plus's chrome.
- **Styling depends on Tailwind utility classes with no Tailwind build step in the package** (`class="flex items-center gap-2"`, `class="my-4"`, `class="text-lg font-semibold mb-2"` in `ElementPlusDynamicForm.vue`; also `class="flex flex-col gap-2"` and Tailwind spacing/typography classes throughout the Storybook playground that consumes it). These classes render unstyled in any consumer app that does not happen to already run Tailwind, which this package cannot assume.
- **No extension mechanism.** A consumer who wants to add their own field type (e.g. a `rich-text` type) alongside the built-in Element Plus types has no way to do so without hand-copying the whole `defineMetadata` call and every slot.

**Goal.** `packages/element-plus` exports an `ElementPlusFormTemplate` component (named to mirror `DynamicFormTemplate`) that is a genuine drop-in replacement: same `metadataConfiguration` prop contract, full slot-family parity with `DynamicFormTemplate` (structural, input, array, choice, wizard), every slot overridable per type with the built-in Element Plus rendering as that slot's default content, real portable CSS with no Tailwind dependency, and a way for a consumer to layer their own field types and extended properties on top of the package's built-in metadata configuration without losing the built-in ones' typing.

**Who this is for.**
- **Library consumers** who already use Element Plus in their app and want a working, styled starting template instead of hand-building every slot of `DynamicFormTemplate` from scratch.
- **Template authors** extending the built-in template: overriding one control, adding a new field type, or reusing the structural chrome (arrays, choices, wizard) while swapping only the inputs.
- **Docs/Storybook readers** evaluating whether this library fits an Element Plus-based app.

## Scope

### In scope

- Rename the exported component to `ElementPlusFormTemplate`, wrapping `DynamicFormTemplate` the same way `ElementPlusDynamicForm` does today.
- An exported metadata configuration (working name `elementPlusMetadata`, per the idea) built with `defineMetadata`, covering the current built-in field-type catalogue and their extended properties (`label`, `placeholder`, `options`, `disabled`, `readonly`, `size`, etc., as already present in `ElementPlusDynamicForm.vue`).
- An extension mechanism (working name `extendMetadata`, per the idea) that lets a consumer merge their own additional field types and extended properties with `elementPlusMetadata`, producing one typed `MetadataConfiguration` to pass to `ElementPlusFormTemplate`, without hand-redeclaring the built-in types. Exact generic shape and name are for the architect to design against `defineMetadata`'s existing pattern (see Open questions).
- Slot-family parity with `DynamicFormTemplate`, applied consistently across the whole template (today only two slots follow this pattern):
  - Structural: `default`, `default-array`, `default-array-item`, `default-choice`, `default-choice-array`, `default-choice-array-item`, `default-wizard`, `default-wizard-page`.
  - Per built-in type, wherever the combination makes sense: `<type>`, `<type>-input`, `<type>-array`, `<type>-array-item`, `<type>-choice`, `<type>-choice-array`, `<type>-choice-array-item`.
- Every slot overridable per `DynamicFormTemplate`'s own priority-fallback contract (dedicated per-type slot → the relevant `default-*` slot), with the built-in Element Plus markup as that slot's default content, so a consumer overrides only what they want to change and keeps the rest.
- Built-in Element Plus rendering for the choice shapes (`-choice`, `-choice-array`, `-choice-array-item`), entirely absent today.
- Built-in Element Plus rendering for the wizard shapes (`-wizard`, `-wizard-page`), entirely absent today, likely built on `ElSteps`/`ElStep`, following the `v-show`-never-`v-if` contract FEAT-003 established for page visibility.
- Real, portable CSS: replace every Tailwind utility class in the package with plain CSS (scoped component styles and/or a shipped stylesheet), so the template renders correctly in a consumer app with no Tailwind build step.
- Keep `element-plus`, `vee-validate`, `vue`, and `@bach.software/vue-dynamic-form` as required (non-optional) peer dependencies, so Element Plus's own styling and behavior are guaranteed available. This is already true in the current `package.json`; this feature preserves it, not introduces it.
- Update the Storybook playground (`playgrounds/storybook/stories/ElementPlusForm.*`, `playgrounds/storybook/components/ElementPlusDynamicFormImplementation.vue`) to the new component name, replace its Tailwind classes, and demonstrate at least one overridden slot and one extended field type so the extension mechanism has a working, visible example. (Also fixes the existing `#default="{ field, required }"` override in `ElementPlusDynamicFormImplementation.vue`, which destructures a `field` prop that does not exist on the slot; the correct name is `fieldMetadata`.)
- Replace the placeholder test in `packages/element-plus/src/ElementPlusDynamicForm.test.ts` (currently `expect(true).toBe(true)`) with real coverage of the new component, the metadata export, and the extension mechanism.
- Update `specs/components.md`'s entry for this package (currently listed under "Non-published surfaces").

### Out of scope (explicit)

- No changes to `packages/core`'s `DynamicFormTemplate`, `defineMetadata`, or the engine's slot-dispatch logic. This feature builds entirely on the existing contract described in `CLAUDE.md`'s Architecture section; it does not modify it.
- No docs site pages are assumed by default. The published site (vue-dynamic-form.bach.software) currently has zero Element Plus content of any kind (confirmed by fetching the live site); whether this feature adds a docs guide/example page is an open question below, not assumed in scope.
- No theming system beyond Element Plus's own default theme plus this package's own layout CSS: no dark-mode work, no CSS custom-property theming API, unless separately scoped later.
- No migration tooling or codemod for existing consumers of `ElementPlusDynamicForm`. The package is `private: true` today with no published version, so there is no external consumer to migrate; the only current consumers are this repo's own test file and Storybook story, both updated as part of this feature.
- No change to `docs/.vitepress/theme/components/AdvancedFormTemplate.vue` or any other docs-site template. It is a separate, hand-rolled Tailwind template that happens to demonstrate `DynamicFormTemplate` usage for the docs site's own onboarding example; this feature neither touches nor replaces it.
- No new built-in field types beyond parity with the current catalogue (text, select, checkbox, radio, date, time, datetime, switch, number, rate, slider, color, cascader, transfer, upload, heading, divider), unless Jeroen adds one via the open question below.

## Functional overview

- A consumer imports `ElementPlusFormTemplate` and `elementPlusMetadata` from `@bach.software/vue-dynamic-form-element-plus`, passes `elementPlusMetadata` (or an extended configuration) to `DynamicForm`'s metadata typing the same way `AdvancedFormTemplate.vue` passes its own `defineMetadata()` result, and gets a fully styled Element Plus form with zero further template work, for every structural shape the engine supports (plain fields, arrays, choices in both automatic and explicit selection mode, wizards).
- A consumer who wants to change one control (say, use their own date-range component instead of `ElDatePicker`) overrides only the `date-input` slot; every other slot keeps rendering through the built-in Element Plus markup, matching the override contract `DynamicFormTemplate` itself already offers to a hand-written template.
- A consumer who wants an additional field type not in the built-in catalogue calls the extension mechanism with their own `defineMetadata`-shaped types, gets back one typed configuration that has both the built-in types (fully typed, unchanged) and their new type, and supplies a slot for the new type the same way they would for any other type in a hand-written template.
- A consumer building a multi-step form with `wizard: true` gets a working, styled step UI (indicator, next/prev navigation reflecting `wizardConfig`, per-page visibility) with no additional template code, mirroring what `AdvancedFormTemplate.vue`'s hand-built `FormWizard.vue` demonstrates for the docs site's own template.
- The rendered result requires no Tailwind (or any other CSS framework) in the consuming app; installing `element-plus` (required, as a peer dependency) and this package is sufficient for the template to render correctly.

## Design (feature level)

Skipped per Jeroen. A standalone HTML prototype adds nothing here: the template composes Element Plus components exactly as they appear in the official Element Plus documentation (element-plus.org), which serves as the visual reference for every control. Layout chrome (arrays, choices, wizard) follows the structural patterns the existing templates already establish. Status moved directly from design to architecture.

## Architecture (feature level)

### Summary of the shape

`packages/element-plus` becomes a real template package layered entirely on the existing core contract. Nothing in `packages/core` changes: `DynamicFormTemplate`, `DynamicFormItem`, `DynamicFormItemChoice/Array/Wizard`, `defineMetadata`, and the slot-dispatch/`v-show` contract are all consumed as-is (confirmed against `DynamicFormItem.vue` and `DynamicFormTemplate.vue`). The package ships three public exports plus internal building blocks:

- `ElementPlusFormTemplate` — a Vue component wrapping `DynamicFormTemplate`, defining every slot in the parity families with Element Plus markup as each slot's fallback content, and re-exposing each of those slots for override. Replaces `ElementPlusDynamicForm` (hard rename, no alias, decision 2).
- `elementPlusMetadata` — a `defineMetadata()` result covering the 16-type catalogue and its extended properties (decision 5), the default `metadataConfiguration` for `ElementPlusFormTemplate`.
- `extendMetadata` — a type-carrier function that merges a consumer's additional value types, extended properties, slot properties, and settings on top of `elementPlusMetadata`, consumer-wins on conflicts (decision 3).

### Component & composable plan (against `specs/components.md`)

Reused from core, unchanged (no modification, no new core surface):

- `DynamicForm`, `DynamicFormItem`, `DynamicFormItemArray`, `DynamicFormItemChoice`, `DynamicFormItemWizard` — the engine renders `ElementPlusFormTemplate` (or a consumer wrapper around it) exactly as it renders any template. The choice families (`ChoiceAttributes`, `ChoiceArrayItemAttributes`, `ChoiceOccurrence`) and wizard families (`WizardAttributes`, `WizardPageAttributes`) are consumed through their existing slot typing.
- `DynamicFormTemplate` — used verbatim as the dispatch bridge inside `ElementPlusFormTemplate`. All slot-name/priority-fallback behaviour (including the `-choice-array` before `-array` ordering and the `-wizard`/`-wizard-page` families) comes from it; the package adds no dispatch logic of its own.
- `defineMetadata` — `elementPlusMetadata` is a direct call; `extendMetadata` delegates to it.

New, in `packages/element-plus/src/`:

| New surface | Why nothing in `specs/components.md` fits |
| --- | --- |
| `ElementPlusFormTemplate.vue` (exported) | The core `DynamicFormTemplate` is contract-only (unstyled dispatcher). No existing component supplies Element Plus rendering with per-slot overridable fallback; this is the whole point of the package. Replaces the private `ElementPlusDynamicForm`. |
| `elementPlusMetadata` (exported const) | `defineMetadata` is the generic carrier; there is no pre-built EP catalogue anywhere. |
| `extendMetadata` (exported function) | `defineMetadata` cannot pre-seed the EP generics; a consumer would otherwise hand-redeclare all 16 types. This is a thin, EP-specific specialisation of `defineMetadata`, so it lives here, not in core. |
| `ElementPlusValueTypes` / `ElementPlusFieldProperties` (exported types) | The concrete generic arguments behind `elementPlusMetadata`, exported so `extendMetadata` and consumers can reference/compose them. |
| Internal presentational sub-components (e.g. an array-section card, a choice-section card, a wizard shell), not exported | Optional decomposition of `ElementPlusFormTemplate`'s built-in markup for readability/testability; kept internal so they are free to change. The scrum-master may fold these into the single SFC if simpler. |

### Public API impact

New exports from `@bach.software/vue-dynamic-form-element-plus` (`src/index.ts`):

- `ElementPlusFormTemplate` (component) — replaces `ElementPlusDynamicForm`. Props: `metadataConfiguration?: TMetadataConfiguration` (optional, defaults to `elementPlusMetadata` at the usage site via `metadataConfiguration ?? elementPlusMetadata`). Generic: `TMetadataConfiguration extends MetadataConfiguration = typeof elementPlusMetadata`. Slots: the full parity set (below).
- `elementPlusMetadata` (value) — `defineMetadata<ElementPlusValueTypes, ElementPlusFieldProperties, {}, {}>()`. `ElementPlusValueTypes` and `ElementPlusFieldProperties` are exactly the two generic bodies already present in `ElementPlusDynamicForm.vue` (the 16 value types and the property bag). Decided after the first implementation: the property bag keeps only properties shared by several controls at the root (`label`, `placeholder`, `options`, `multiple`, `clearable`, `filterable`, `disabled`, `readonly`, `size`, `min`, `max`, `step`, `format`, `valueFormat`), and every property that belongs to a single control moves into a group named after its field type (`number`, `date`, `slider`, `color`, `cascader`, `transfer`, `upload`). This resolves the clash between the field's own `type` and the date picker mode, which is now `date: { type }`.
- `extendMetadata` (function) — signature designed against `defineMetadata`'s four-generic pattern:

  ```ts
  export function extendMetadata<
    const ExtraValueTypes extends Record<string, any> = object,
    ExtraFieldProperties extends object = object,
    ExtraSlotProperties extends object = object,
    ExtraSettingsProperties extends object = object,
  >() {
    return defineMetadata<
      Omit<ElementPlusValueTypes, keyof ExtraValueTypes> & ExtraValueTypes,
      Omit<ElementPlusFieldProperties, keyof ExtraFieldProperties> & ExtraFieldProperties,
      ExtraSlotProperties,
      ExtraSettingsProperties
    >();
  }
  ```

  The `Omit<Built-in, keyof Extra> & Extra` merge makes the consumer's declaration win on any key collision (decision 3): a consumer redefining `text` or `label` replaces the built-in type/property rather than intersecting with it (`string & MyType` would collapse to an unusable type). Value types and extended properties both merge this way; slot and settings properties start empty on `elementPlusMetadata`, so they pass through unchanged. The result is one typed `MetadataConfiguration` usable directly with `GetMetadataType`/`GetDynamicFormSettingsType` and as `ElementPlusFormTemplate`'s `metadataConfiguration` prop. Like `defineMetadata`, it is purely type-level: `fieldTypes` is never read at runtime (dispatch keys off the live `type` attr in `DynamicFormTemplate`, confirmed in its `typeWithFallback`), so no runtime merge is required.

- Re-exports kept: `FieldMetadata`, `GetMetadataType` (already re-exported), plus adding `GetDynamicFormSettingsType`, `MetadataConfiguration` for consumer typing convenience.

Slot contract (parity with `DynamicFormTemplate`, decision-driven fallback content): `ElementPlusFormTemplate` defines, on its inner `DynamicFormTemplate`, one `<template #X>` per slot family below, each shaped `<slot name="X" v-bind="s"><!-- Element Plus fallback --></slot>` so the consumer overrides `X` and otherwise inherits the EP markup:

- Structural: `default`, `default-input`, `default-array`, `default-array-item`, `default-choice`, `default-choice-array`, `default-choice-array-item`, `default-wizard`, `default-wizard-page`.
- Per built-in type where it renders a control: `<type>-input` for all 16 (mirrors today's `text-input`, `select-input`, ...); `<type>` wrappers only where the type needs bespoke chrome (`checkbox`, `switch`, `heading`, `divider`, matching today). The remaining per-type array/choice/wizard combinations are intentionally left to fall through the priority chain to the `default-*` family (that is exactly what the fallback chain in `DynamicFormTemplate` is for); the package does not enumerate all `16 x 7` combinations, it supplies the `default-*` structural slots plus per-type `-input` slots and lets dispatch fill the rest. A consumer adding a per-type structural slot (e.g. `date-array-item`) still can, because the override slot name is forwarded.

Backwards compatibility and changeset: the only consumers of `ElementPlusDynamicForm` today are this repo's own test file and Storybook story (package is `private: true`, never published; confirmed in `package.json`). Both are updated in-feature. There is no external consumer to break, so the hard rename carries no external breakage. Core peer floor: the package's peer range on `@bach.software/vue-dynamic-form` is set to the lowest core version that ships the wizard and explicit-choice slot props the template reads (derived when the publish story runs), so an older installable core cannot break it at runtime. Changeset: minor (decision 6), and only becomes a real CHANGELOG entry once the package flips to published at the end (decision 1); while `private: true`, `packages/element-plus` changes need no changeset per `CLAUDE.md`. Core is untouched, so no core changeset.

### The slot-forwarding contract (centrepiece)

The engine renders the template component once per field, passing it two slots (confirmed in `DynamicFormItem.vue`): the unnamed `default` slot carries the field's own render (the `-input` component for a leaf, or the recursive children for a parent), and the `attributes` slot carries attribute sub-items. The template dispatches on the `type` attr through `DynamicFormTemplate`.

`ElementPlusFormTemplate` is a middle layer: it consumes `DynamicFormTemplate`'s user-facing slots (to inject EP markup) and re-exposes them for override. The one hazard is that the engine's render slot and the parity override slot both want the name `default`. The resolution:

- The EP fallback markup reaches the engine's field render through a reserved slot read as `<slot name="input"><slot /></slot>` and the attribute render through `<slot name="attributes" />`.
- `<slot name="input"><slot /></slot>` means: use an `input` slot when the consumer wrapper forwarded one, otherwise fall back to the unnamed `default` slot. This is what makes **bare, zero-config usage** work: `<DynamicForm :template="ElementPlusFormTemplate" />` renders `ElementPlusFormTemplate` directly, the engine hands it `default` + `attributes` under those exact names, `input` is absent so the nested `<slot />` picks up the engine's `default`, and every field renders with full EP chrome and no wrapper. This is the "zero further template work" path in the Functional overview.
- **Override usage** requires a thin consumer wrapper (unavoidable: Vue slots are the only channel to inject overrides into a `:template`, same as `AdvancedFormTemplate.vue` wraps `DynamicFormTemplate`). The documented wrapper boilerplate is two forward lines plus overrides:

  ```vue
  <ElementPlusFormTemplate :metadataConfiguration="myMetadata">
    <!-- hand the engine's field + attribute render to the built-in Element Plus chrome -->
    <template #input="s"><slot v-bind="s" /></template>
    <template #attributes="s"><slot name="attributes" v-bind="s" /></template>

    <!-- override only what you want; everything else keeps its Element Plus default -->
    <template #date-input="s"> ...your control... </template>
  </ElementPlusFormTemplate>
  ```

  Inside the wrapper, `<slot v-bind="s" />` is the wrapper's own default slot, which is the engine's field render, forwarded to `ElementPlusFormTemplate`'s reserved `input` slot; `<slot name="attributes" />` likewise. A consumer who overrides the group wrapper (`#default`) still reaches the field render through their own `<slot v-bind="s" />` inside that override, so overriding chrome never loses the input.

FLAGGED AMENDMENT (from the ST-02 implementation, for Jeroen): in bare usage the unnamed `default` slot is the engine's field render, so `<slot name="default" v-bind="s"><ElFormItem>...</ElFormItem></slot>` would render that engine output instead of the Element Plus chrome. The template therefore treats `default` as a chrome override only when an `input` slot is forwarded (the documented wrapper always forwards it); without `input` the built-in chrome renders. Attribute items are rendered after the overridable chrome slots rather than inside their fallback content, so a `#default` override cannot drop them. The wrapper boilerplate and the reserved names are unchanged.

`input` and `attributes` are therefore reserved slot names on `ElementPlusFormTemplate`. Neither is a parity override name (`-input` slots are `text-input`, `default-input`, etc.; `attributes` has no override slot in `DynamicFormTemplate`), and neither is one of the 16 built-in types, so parity is preserved in full including the plain `default` slot. The documented reserved-name caveat: a consumer extension must not introduce a field type literally named `input` **or `attributes`**; both names are reserved on `ElementPlusFormTemplate` and either would collide with the engine-render forwards.

DECIDED (research): the caveat covers both reserved names (`input` and `attributes`), resolving finding 5.
Why: follows directly from ADR-1's own reserved list; a consumer type named `attributes` collides exactly like one named `input`.

**Generic forward of non-enumerated consumer slots (resolves finding 1, blocker).** The enumerated `<template #X>` set above only re-exposes the 16 built-in families, and `elementPlusMetadata.fieldTypes` is empty at runtime, so without a forward a consumer's new-type slot (`richText-input`, or any non-enumerated per-type structural slot like `date-array-item`) would be dropped and render through the built-in `default-input`/`default-*` fallback instead of the consumer's markup. `ElementPlusFormTemplate` therefore adds an explicit generic forward on its inner `DynamicFormTemplate` that passes through every consumer-supplied slot NOT in the reserved/enumerated set:

```vue
<!-- inside ElementPlusFormTemplate's inner <DynamicFormTemplate>, alongside the enumerated EP-fallback templates -->
<template v-for="name in forwardedSlotNames()" :key="name" #[name]="s">
  <slot :name="name" v-bind="s" />
</template>
```

where `forwardedSlotNames` is a function called from the template (not a `computed` over `useSlots()`, which is non-reactive and would go stale for slots added after mount) returning every supplied slot name except the excludes: `input`, `attributes`, and every name that already has an explicit EP-fallback `<template #X>` (the structural `default`/`default-*` family and the enumerated per-type slots). Filtering in a computed rather than a `v-if` on the `v-for` element keeps the template valid (Vue forbids `v-if` with `v-for` on one element) and means the forward never duplicates a template nor re-triggers the ADR-1 `default`-slot clash. This is what actually delivers decisions 3 and 5 (a consumer adds a type and supplies its slot) and is a prerequisite for slice 4's extended-field-type example; it lands in slice 1 with the forwarding contract. It refines, not contradicts, ADR-1: ADR-1 rejected forwarding the engine `default` render onto the `default` override slot, which this exclusion list preserves.

DECIDED (research): adopt the generic forward with the exclusion list above, resolving finding 1 (and naming the concrete excludes per finding 6).
Why: without it, `extendMetadata` cannot deliver decisions 3 and 5, which Jeroen already made; no alternative exists that keeps the enumerated EP fallbacks and the ADR-1 `default`-slot resolution intact. Confirmed against `DynamicFormTemplate.vue`'s `typeWithFallback` dispatch and `defineMetadata`'s empty runtime `fieldTypes`.
Sources: `packages/core/src/components/DynamicFormTemplate.vue`, `packages/core/src/core/defineMetadata.ts`, vuejs.org/guide/essentials/list (`v-if` with `v-for` restriction), vuejs.org dynamic slot names

```mermaid
sequenceDiagram
    participant Engine as DynamicFormItem (engine)
    participant Wrap as Consumer wrapper (the :template)
    participant EPFT as ElementPlusFormTemplate
    participant DFT as DynamicFormTemplate

    Note over Engine: renders template per field, passes<br/>#default (field render) + #attributes
    Engine->>Wrap: slot default = -input render / children<br/>slot attributes = attribute items
    Wrap->>EPFT: #input = (wrapper default), #attributes,<br/>+ consumer overrides (#date-input, #default, ...)
    EPFT->>DFT: :metadataConfiguration, all parity #slots<br/>each = <slot name="X"><EP fallback/></slot>
    DFT->>DFT: typeWithFallback(type) picks slot X
    DFT-->>EPFT: render slot X
    alt consumer overrode X
        EPFT-->>Wrap: consumer markup wins
    else no override
        EPFT->>EPFT: EP fallback markup;<br/>input via <slot name="input"><slot/></slot>
    end
```

### Data flow

- Settings: `DynamicForm` provides the `ComputedRef<DynamicFormSettings>` under `dynamicFormSettingsKey`; `DynamicFormItem` injects it and forwards it to the template as the `settings` slot prop. `ElementPlusFormTemplate` reads settings only through that slot prop (e.g. `settings` in slot scope). No new provide/inject is introduced by the package.
- vee-validate: leaf inputs bind `:model-value="fieldContext.value.value"` and `@update:model-value="fieldContext.handleChange"` on Element Plus controls, per each control's real v-model contract (not blindly copied from today's bindings, see below). `handleBlur`/`errorMessage` are available in slot scope for controls that surface validation state (fed into `ElFormItem`'s `error`/`validate-status` where useful). Path handling (dot/bracket notation, complex types) is entirely the engine's; the template never touches paths beyond reading `fieldMetadata.path` for keys/testids.

  **Do not port broken v-model bindings verbatim (resolves finding 3).** The current `upload-input` binds `:model-value`/`@update:model-value` on `ElUpload`, which has no `model-value` (it binds via `v-model:file-list` + `on-change`), so the upload field never reaches vee-validate. Slice 1's port binds `ElUpload` through `file-list` + `on-change` (into `handleChange`), and audits each of the 16 controls' real v-model contract (upload, transfer, cascader especially) against the Element Plus docs, checking each bound prop/event is available at the `>=2.0.0` peer floor (per-control floor check, finding 7) rather than trusting the existing bindings.

  DECIDED (research): fix the `ElUpload` binding during the port and audit every control's v-model contract plus its `>=2.0.0` availability, resolving findings 3 and 7.
  Why: confirmed in `packages/element-plus/src/ElementPlusDynamicForm.vue` (`:model-value`/`@update:model-value` on `ElUpload`) against the Element Plus upload docs, which document `v-model:file-list` + `on-change` and no `model-value`. Porting the defect verbatim contradicts the drop-in goal.
  Sources: element-plus.org/en-US/component/upload (API), `packages/element-plus/src/ElementPlusDynamicForm.vue` lines 331-346
- Wizard: the `default-wizard` fallback builds its indicator from the `pages` slot prop (never `fieldMetadata.children`) using `ElSteps :active="currentStepIndex"` + one `ElStep` per page (verified `StepsProps.active`/`StepProps.title`/`description` in element-plus 2.14.2; `ElSteps` has no per-step click event, so forward-jump is offered via `ElButton`/click handlers layered on the step, gated by `wizardConfig.allowForwardJump`, not by a native step event). Prev/next/submit use `ElButton`, wired to `prev`/`next`, with the submit button shown when `isLast`. The `default-wizard-page` fallback gates visibility with `v-show="isCurrent"` and never `v-if` (per the FEAT-003 contract in `WizardPageAttributes`; a `v-if` would deregister the page's fields from vee-validate on navigation). All pages stay mounted.
- Choice: `default-choice` (single) and `default-choice-array` (repeatable) fallbacks render an `ElCard`-based section reading `activeChoiceOccurrences`/`addChoiceOccurrence`/`canAddChoiceOccurrence`/`removeChoiceOccurrence`/`usedChoiceOccurrences` from slot scope; `default-choice-array-item` renders one occurrence card reading `branchKey`/`globalIndex`/`insertionOrder`/`removeItem`. This mirrors the docs `ChoiceSectionCard`/`ChoiceArraySectionCard` structure but in Element Plus, and works for both automatic and explicit selection modes (the engine drives which occurrences render). The one mode read the template makes: branch select/add/remove controls render only when `fieldMetadata.explicitChoiceSelection` is set, because in automatic mode those engine calls clear sibling branches (the engine binds the same slot props in both modes), which would wipe user-entered data; automatic mode renders the children only.

  DECIDED (Jeroen): the choice section reads `fieldMetadata.explicitChoiceSelection` and shows its selection controls only in explicit mode; automatic mode renders children only. The earlier "no template branching" wording is amended to allow exactly this mode read.
- Reactivity: the template is purely presentational; it introduces no `computedProps`, no `watchEffect`, and no extra reactive state beyond Element Plus components' own. It does not affect the `combinedValidation` watchEffect or `computedProps` loop guards. Render-count behaviour is unchanged from any other template.

### CSS strategy

- Remove every Tailwind utility class from the package (`flex items-center gap-2`, `my-4`, `text-lg font-semibold mb-2`, `flex flex-col gap-2`, and the Storybook consumer's Tailwind spacing/typography). No Tailwind build step exists or is added.
- Prefer Element Plus's own layout/presentation components for chrome so most styling arrives through the stylesheet the consumer already imports for Element Plus: `ElCard` (array/choice sections and occurrence cards), `ElDivider` (`divider` type and section separators), `ElSteps`/`ElStep` (wizard indicator), `ElFormItem` (per-field label/required/error), `ElButton` (add/remove/nav). All verified present in element-plus 2.14.2 and available across the `>=2.0.0` peer range. Deliberately avoid `ElSpace`/`ElRow`/`ElCol` to keep the peer floor safe and the CSS surface minimal.
- The small residue that Element Plus has no primitive for (a two-column responsive field grid, gap/spacing between stacked fields) is authored as plain, scoped `<style scoped>` in `ElementPlusFormTemplate` and any internal sub-components. With `build.cssCodeSplit: false` (the library-mode default; the package config currently overrides it to `true`) and `build.lib.cssFileName: 'style'`, this compiles to a single `dist/style.css`, which the consumer imports once alongside the Element Plus stylesheet:

  ```ts
  import 'element-plus/dist/index.css';
  import '@bach.software/vue-dynamic-form-element-plus/style.css';
  ```

  Requiring one template stylesheet import next to the mandatory Element Plus one is consistent with how Element Plus itself is consumed and is documented in the package README/usage. Element Plus stays a required (non-optional) peer dependency (already true in `package.json`), so its styling and behaviour are guaranteed available; this feature preserves that split, it does not change dependency shape.

  **Make `style.css` real and importable (resolves finding 2).** Three things are needed at the installed Vite `7.3.6`: (a) `build.lib.cssFileName` defaults to the `package.json` `name` when `build.lib.fileName` is a function (it is), so it must be pinned to `'style'`; (b) `cssFileName` is only consulted when `build.cssCodeSplit` is `false` (the library-mode default), but `vite.config.ts` currently sets `cssCodeSplit: true`, which makes the es build emit `index.css` and the umd build inject the CSS into the JS at runtime, so `cssCodeSplit` must be removed or set to `false`; and (c) `package.json`'s `exports` map only exposes `"."`, so a `"./style.css": "./dist/style.css"` entry is needed, and the consumer import is `@bach.software/vue-dynamic-form-element-plus/style.css` (the deep `dist/style.css` path is not an allowed import). Dropping `cssCodeSplit` also removes runtime style injection from the umd bundle, which is the intended behaviour for a package that ships one stylesheet. The implementer confirms a single `dist/style.css` is emitted, since the package ships no CSS today.

  DECIDED (research): set `cssCodeSplit: false`, pin `cssFileName: 'style'`, and export `"./style.css"`, resolving finding 2. This corrects the first version of this decision, which pinned `cssFileName` alone and missed that `cssCodeSplit: true` bypasses it.
  Why: verified in the installed Vite 7.3.6 source (`vite:css-post` in `dist/node/chunks/config.js`: the `cssCodeSplit` true branch names the asset after the entry chunk and never calls `getCssBundleName()`; `resolveLibCssFilename` is reached only on the false branch; lib builds default to `cssCodeSplit: !raw.lib`) and against the package source (`exports` map only exposes `"."`; `fileName` is a function). Factual, not a taste call.
  Sources: `packages/element-plus/package.json`, `packages/element-plus/vite.config.ts`, vite 7.3.6 `dist/node/chunks/config.js`, vite.dev/config/build-options (`build.lib`, `build.cssCodeSplit`), nodejs.org docs on package `exports` subpaths

### ADR notes

**ADR-1: Reserved `input`/`attributes` slots with `<slot name="input"><slot/></slot>` fallback, rather than renaming every override slot or breaking `default` parity.**
Context: the engine passes the field render as the template's unnamed `default` slot, which collides with the parity `default` override slot; bare zero-config usage and full-parity override usage both have to work. Decision: read the engine render through `<slot name="input"><slot /></slot>` (and `<slot name="attributes" />`), reserving `input`/`attributes`, so bare usage falls back to the engine's `default` while wrapped usage forwards `input`. Alternative considered: rename the group-wrapper override off `default` to dodge the clash. Rejected: it breaks the parity promise on the most-used slot and reads worse than reserving two clearly-internal names. Alternative considered: a blanket `v-for="(_, name) in $slots"` forward (today's Storybook approach). Rejected: it forwards the engine `default` onto the `default` override slot and erases the EP chrome, which is exactly why the current package renders unstyled.

DECIDED (Jeroen): keep the two-line wrapper boilerplate as designed in this feature. Eliminating it engine-side (moving the engine's content slots off `default` to a reserved name and letting `DynamicForm` forward consumer override slots into every template render, removing the need for a wrapper for all templates) is a candidate follow-up feature in `packages/core`, raised separately with its own design and deprecation story. ADR-1's `<slot name="input"><slot /></slot>` chain is forward-compatible with that future engine: `ElementPlusFormTemplate` would work unchanged with or without a wrapper.

**ADR-2: Consumer-wins merge (`Omit<Built-in, keyof Extra> & Extra`) in `extendMetadata`.**
Context: decision 3 allows overriding built-in types, not only adding. Decision: override semantics so the consumer's declaration replaces the built-in on collision. Alternative considered: plain intersection `Built-in & Extra`. Rejected: intersecting a redefined `text: string` with `text: MyType` yields `string & MyType`, an unusable type; overriding is the only shape that lets a consumer genuinely replace a type. The documented pairing (override the type, also supply the matching slot, since built-in fallback markup still assumes the built-in property shape) is decision 3's explicit expectation.

**ADR-3: `ElementPlusFormTemplate` takes `metadataConfiguration` as an optional prop defaulting to `elementPlusMetadata`.**
Context: bare usage needs the built-in catalogue with no wiring; extended usage needs the merged config for slot typing of new types. Decision: optional prop with a `?? elementPlusMetadata` fallback and a generic default of `typeof elementPlusMetadata`. Alternative considered: no prop, always `elementPlusMetadata`. Rejected: it makes `extendMetadata` unusable with the template (new types would be untyped in slot scope). The engine does not pass `metadataConfiguration` to templates, so bare rendering correctly hits the default; extended usage passes it through the consumer wrapper.

**ADR-4: Wizard indicator on `ElSteps`/`ElStep`, navigation and forward-jump on `ElButton`/click handlers.**
Context: FEAT-003 wizard slots supply `pages`, `currentStepIndex`, `wizardConfig`, `next`/`prev`/`gotoStep`. Decision: `ElSteps :active="currentStepIndex"` for the indicator, `ElButton` for prev/next/submit, forward-jump click handlers on steps gated by `wizardConfig.allowForwardJump`. Alternative considered: rely on a native `ElStep` click-to-jump. Rejected: `ElStep` exposes no per-step click event in 2.14.2 (verified), so jump affordances are layered explicitly, matching how the docs `Stepper` does it. `v-show`-never-`v-if` page gating is kept per the `WizardPageAttributes` contract.

**ADR-5: Lean on Element Plus components for chrome, minimal scoped CSS shipped as one stylesheet.**
Context: Tailwind must go; the package cannot assume a CSS framework in the consumer app. Decision: use EP layout/presentation components (whose styles ride the already-required EP stylesheet) and add only a small scoped stylesheet for the responsive field grid and spacing, imported once. Alternative considered: ship no CSS and inline flex/grid via style attributes. Rejected: harder to theme and read, and duplicates layout across every field; a single scoped stylesheet is idiomatic for a Vue component library.

### Natural slicing seams (input for the scrum-master)

These are largely independently deliverable; the metadata/type layer and the CSS de-Tailwinding gate the rest.

1. **Rename + metadata/extension foundation.** Introduce `ElementPlusFormTemplate` (rename of `ElementPlusDynamicForm`), `elementPlusMetadata`, `ElementPlusValueTypes`/`ElementPlusFieldProperties`, and `extendMetadata`; update `src/index.ts` exports. Fix the slot-forwarding contract (reserved `input`/`attributes`, `<slot name="input"><slot/></slot>`) and port the existing 16 `-input` slots plus the `default`/`default-input` structural slots to real fallback content and plain CSS. This unblocks everything and makes bare usage work. Also updates the Vitest config (add `jsdom` environment + setup) since the current package config has neither, adds `jsdom` and `@vue/test-utils` (both `catalog:test`) to the package `devDependencies` (absent today, required to mount and cover the component; resolves finding 4), and replaces the placeholder test with real coverage of the component, `elementPlusMetadata`, and `extendMetadata`. This slice also includes the generic forward of non-enumerated consumer slots (finding 1 resolution above).

   DECIDED (research): slice 1 adds `jsdom` + `@vue/test-utils` from the `test` catalog, resolving finding 4.
   Why: confirmed absent in `packages/element-plus/package.json` `devDependencies` and present in `pnpm-workspace.yaml`'s test catalog; mounting a Vue component in Vitest requires both. Pure tooling, invisible to consumers.
   Sources: `packages/element-plus/package.json`, `pnpm-workspace.yaml` catalog entries
2. **Structural array + choice families.** Add the `default-array`/`default-array-item` and `default-choice`/`default-choice-array`/`default-choice-array-item` fallbacks with EP `ElCard`-based chrome, reading the choice slot-prop set. Depends on slice 1's forwarding contract.
3. **Wizard family.** Add `default-wizard`/`default-wizard-page` on `ElSteps`/`ElButton` with the `v-show` gate. Independent of slice 2, depends on slice 1.
4. **Storybook + example polish.** Update `playgrounds/storybook/stories/ElementPlusForm.*` and `ElementPlusDynamicFormImplementation.vue` to the new name, de-Tailwind them, fix the `field` -> `fieldMetadata` slot-prop bug, and demonstrate at least one overridden slot and one extended field type (a working `extendMetadata` example). Depends on slices 1 to 3 for the surfaces it exercises. Screenshots per the Before-Every-Push workflow.
5. **`specs/components.md` update + publish flip.** Move the package entry out of "Non-published surfaces" and document the new exports; flip `private: false` and add the changeset only at the very end once Jeroen has seen it work (decision 1). Depends on all above.

Docs-site work is explicitly out of scope (decision 4).

## Adversarial review
Filled by adversarial-reviewer at feature level. Findings and resolutions. (Reviewer running as opus.)

1. **BLOCKER — the extension mechanism cannot route a new type's slot to the inner `DynamicFormTemplate`; the described slot-forwarding only covers the 16 built-in families.** ADR-1 and the centrepiece describe `ElementPlusFormTemplate` as defining one `<template #X>` per parity family on the inner `DynamicFormTemplate`, each `<slot name="X" v-bind="s"><EP fallback/></slot>`. That set is a fixed, hard-coded enumeration (it must be: `elementPlusMetadata.fieldTypes` is `Object.keys({})` = `[]` at runtime in `defineMetadata`, confirmed, so nothing can generate per-type templates dynamically). A consumer who uses `extendMetadata` to add a `richText` type and supplies `#richTextInput` hands that slot to `ElementPlusFormTemplate`, but there is no `<template #richText-input>` on the inner `DynamicFormTemplate` and no described path to forward it there, so the inner dispatch falls to `default-input` and renders the built-in `ElInput` instead of the consumer's control. The same gap defeats the line-131 claim that a consumer "adding a per-type structural slot (e.g. `date-array-item`) still can, because the override slot name is forwarded" — no such forward is specified. This is the headline extension capability (decisions 3 and 5) and the required deliverable of slice 4 ("demonstrate at least one extended field type"), so the architecture as written does not deliver it. Suggested resolution: the architecture must specify an explicit generic forward of consumer-supplied, non-enumerated slots from `ElementPlusFormTemplate` to the inner `DynamicFormTemplate` (a `<template v-for="(_, name) in $slots" #[name]="s"><slot :name="name" v-bind="s"/></template>` that EXCLUDES the reserved `input`/`attributes` names and the enumerated EP-fallback names, so it does not collide with those explicit `<template>`s or re-trigger the ADR-1 default-slot clash). Reconcile this with ADR-1's rejection of the blanket forward (that rejection is specifically about the engine `default` render, not consumer overrides of named slots).
   DECIDED (research): accepted; the generic forward with the named exclusion list is now part of the slot-forwarding contract (see "Generic forward of non-enumerated consumer slots"). Lands in slice 1.

2. **SHOULD-FIX — the documented stylesheet import `.../dist/style.css` will not resolve as written, on two counts.** (a) At the installed Vite `7.3.6`, `build.lib.cssFileName` defaults to the `name` in `package.json` when `build.lib.fileName` is a function (verified against the Vite build-options docs), and `vite.config.ts` sets `fileName: format => ...` (a function). The emitted CSS is therefore `dist/vue-dynamic-form-element-plus.css`, not `dist/style.css`. (b) `package.json`'s `exports` map only exposes `"."`; with an `exports` field present, the deep subpath `./dist/style.css` is not an allowed import at all. So the exact snippet in the CSS-strategy section fails both because the file has a different name and because the subpath is not exported. Suggested resolution: set `build.lib.cssFileName: 'style'` in `vite.config.ts` (pinning the name) AND add an `exports` entry (e.g. `"./style.css": "./dist/style.css"`), then document the exported path consumers actually use.
   DECIDED (research): accepted; the CSS strategy section now specifies `cssFileName: 'style'` plus the `"./style.css"` exports entry, both verified against the package source and Vite docs.

   DECIDED (research): the story-prep review of ST-04 found the `cssFileName` half incomplete (`cssCodeSplit: true` bypasses it, verified in the Vite 7.3.6 source); the CSS strategy section and the rollup above are corrected to include `cssCodeSplit: false`, and the import example now uses the exported `/style.css` subpath.

3. **SHOULD-FIX — porting the existing `upload-input` (and re-checking `transfer-input`) at "parity" ships a non-functional control, which contradicts the "renders correctly / genuine drop-in" goal.** The current `ElementPlusDynamicForm.vue` binds `:model-value` / `@update:model-value` on `ElUpload`, but `ElUpload` has no `model-value` (verified against the Element Plus upload docs: it binds via `v-model:file-list` + `on-change`), so those bindings are no-ops and the upload field never syncs to vee-validate. "Port the existing 16 `-input` slots" (slice 1) must not mean copying this binding verbatim. Suggested resolution: bind `ElUpload` through `file-list` + `on-change` (feeding `fieldContext.handleChange`), and audit each EP control's real v-model contract during the port rather than trusting the existing bindings. (Note: keeping `ElRadio :label` for the value is correct here, not a defect: the `value` prop only exists from EP 2.6 and the peer floor is `>=2.0.0`.)
   DECIDED (research): accepted; the Data flow section now mandates the `file-list` + `on-change` binding and a per-control v-model + peer-floor audit during the port (which also covers finding 7).

4. **SHOULD-FIX — the element-plus package's `devDependencies` lack the tooling slice 1 needs to write the real component tests.** Slice 1 says it "updates the Vitest config (add `jsdom` environment + setup)", but `packages/element-plus/package.json` `devDependencies` has neither `jsdom` nor `@vue/test-utils`, both of which are required to mount and cover `ElementPlusFormTemplate` (both are in the `test` catalog already). Suggested resolution: slice 1 adds `jsdom` and `@vue/test-utils` (`catalog:test`) to the package `devDependencies` alongside the vitest config change.
   DECIDED (research): accepted into slice 1; both are already in the workspace `test` catalog.

5. **SHOULD-FIX — the reserved-name caveat is incomplete: `attributes` is as reserved as `input`.** ADR-1 and the slot-forwarding section reserve both `input` and `attributes`, but the documented caveat only forbids a consumer field type literally named `input`. A consumer type named `attributes` collides the same way (its override slot name clashes with the reserved engine-attribute forward slot on `ElementPlusFormTemplate`). Suggested resolution: extend the caveat to forbid a consumer type named `attributes` as well.
   DECIDED (research): accepted; the reserved-name caveat now forbids consumer field types named `input` or `attributes`.

6. **NIT — ADR-1's sequence diagram and prose should name the concrete override-forwarding excludes.** Once finding 1 is resolved, the "consumer overrides" arrow in the Mermaid diagram and the reserved-name prose should state exactly which names the generic forward excludes (`input`, `attributes`, and the enumerated fallback names), so an implementer does not re-introduce the ADR-1 default-slot clash. No status impact.
   DECIDED (research): folded into the finding-1 resolution, which names the excludes (`input`, `attributes`, the enumerated fallback names).

7. **NIT — `element-plus >=2.0.0` peer floor is asserted safe but not enumerated per API.** The architecture claims every EP component used is "available across the `>=2.0.0` peer range" and deliberately avoids `ElSpace`/`ElRow`/`ElCol`. Spot checks hold (`ElSteps`/`ElStep`/`ElCard`/`ElDivider`/`ElFormItem` `error`+`validate-status`/`ElButton` all predate 2.0, verified for Steps and Form), but the claim rests on no per-API list. If any ported control ends up needing a prop introduced after 2.0.0 (the upload/transfer/cascader rework in finding 3 is the likeliest place), the floor claim silently breaks. Worth a quick per-control floor check during the port. No status impact.
   DECIDED (research): folded into the finding-3 resolution; the port audit checks each bound prop/event against the `>=2.0.0` floor per control.

## Constraints & assumptions

- `packages/element-plus` stays a private, unpublished workspace package throughout implementation; it flips to published only at the end, once the feature is proven working (decision 1 under Open questions).
- The dev dependency pins `element-plus` to `2.14.2` (`catalog:framework-pinned`) for reproducible tests, while the peer dependency range stays `>=2.0.0` (`catalog:framework`). This feature assumes that existing split is correct and does not revisit it.
- The built-in field-type catalogue stays at parity with what `ElementPlusDynamicForm.vue` already renders today (16 types); confirmed by Jeroen (decision 5 under Open questions).
- `CLAUDE.md` already documents that the docs directory disables `vue/attribute-hyphenation` and uses Tailwind; that is docs-only and does not extend to `packages/element-plus`, which this feature moves fully off Tailwind.

## Open questions

None open. All resolved with Jeroen:

1. **Publishing:** Yes, the package should be published, but only once the feature is finished and proven working. It stays `private: true` during implementation; flipping it and the first publish happen at the end (or as an immediate follow-up), once Jeroen has seen it work.
2. **Rename:** Hard rename to `ElementPlusFormTemplate`, no deprecated alias.
3. **Extension mechanism:** Overriding built-in types is allowed, not just adding new ones. The intended pairing is that a consumer who overrides a built-in type's declaration also overrides or supplies the matching slot(s), since the built-in slot markup keeps assuming the built-in property shape and slot fallback content is not type-checked against the consumer's override. The architect designs the merge so the consumer's declaration wins over `elementPlusMetadata`, and the pairing expectation is documented.
4. **Docs:** No docs-site page in this feature. Jeroen first wants to see it work; documentation is a follow-up.
5. **Type catalogue:** Parity with the current 16 built-in types is the scope. Extensions come later, after the mechanism described here works.
6. **Changeset:** Minor bump. The package was never published before, so nothing existing can break.

## Stories
Filled by scrum-master AFTER approval. Links to story folders with implementation order and dependency notes.

The five natural seams were split into ten stories. Seam 1 (large) became four stories (foundation, slot forwarding, binding audit, CSS), seam 2 became two (array, choice), and seam 5 became two (README plus inventory, publish flip). Every story stays in `packages/element-plus` (plus playground, specs, and, at the very end, the changeset); `packages/core` is untouched and the package stays `private: true` until ST-10, so no changeset is needed before then.

| Order | Story | Delivers | Depends on |
| --- | --- | --- | --- |
| 1 | [ST-01 Rename, metadata catalogue, and extension mechanism](stories/ST-01-rename-and-metadata-foundation/spec.md) | `ElementPlusFormTemplate` rename, `elementPlusMetadata`, `extendMetadata`, exported types, `jsdom` + `@vue/test-utils` test setup, real tests, `components.md` rename | none |
| 2 | [ST-02 Overridable slots with the slot-forwarding contract](stories/ST-02-slot-forwarding-contract/spec.md) | Reserved `input`/`attributes`, `<slot name="input"><slot /></slot>`, fallback content for `default`, `default-input`, all `<type>-input` and the `checkbox`/`switch`/`heading`/`divider` wrappers, generic forward of non-enumerated consumer slots | ST-01 |
| 3 | [ST-03 Every built-in control binds correctly](stories/ST-03-control-binding-audit/spec.md) | `ElUpload` file-list binding fix, per-control v-model contract audit, per-control `>=2.0.0` floor audit | ST-02 |
| 4 | [ST-04 Portable CSS and stylesheet export](stories/ST-04-portable-css-and-stylesheet-export/spec.md) | Tailwind removed, scoped CSS, `cssCodeSplit: false` + `cssFileName: 'style'`, `"./style.css"` exports entry, emitted and resolvable stylesheet | ST-02 (land after ST-03: same SFC) |
| 5 | [ST-05 Array section and item](stories/ST-05-array-section-and-item/spec.md) | `default-array`, `default-array-item` fallbacks | ST-02, ST-04 |
| 6 | [ST-06 Choice section and occurrences](stories/ST-06-choice-section-and-occurrences/spec.md) | `default-choice`, `default-choice-array`, `default-choice-array-item` fallbacks | ST-02, ST-04, ST-05 |
| 7 | [ST-07 Wizard steps and pages](stories/ST-07-wizard-steps-and-pages/spec.md) | `default-wizard`, `default-wizard-page` on `ElSteps`/`ElButton` with `v-show` gating | ST-02, ST-04 (independent of ST-05/ST-06) |
| 8 | [ST-08 Storybook playground examples](stories/ST-08-storybook-playground-examples/spec.md) | Playground on the new API, no Tailwind, `field` to `fieldMetadata` fix, one overridden slot, one extended type, array/choice/wizard examples, screenshots | ST-01 to ST-07 |
| 9 | [ST-09 Package README and inventory final pass](stories/ST-09-package-readme-and-inventory/spec.md) | README (imports, bare and wrapped usage, extension, reserved-name and pairing caveats), final `specs/components.md` | ST-01 to ST-08 |
| 10 | [ST-10 Publish flip](stories/ST-10-publish-flip/spec.md) | `private` flip, minor changeset, inventory entry moved out of "Non-published surfaces", clean-consumer check | ST-01 to ST-09, and Jeroen's explicit go-ahead after seeing it work |

Implementation order is 1, 2, 3, 4, then 5, 6, and 7 (5 before 6; 7 can go anywhere after 4), then 8, 9, 10.

Points raised during the split, settled during story prep (see the `DECIDED`/`ASSUMED` entries in the named stories):
- The "16 types" in this spec's prose is a miscount: the current catalogue is 17 types (15 input controls plus `heading` and `divider`). The requirement stays parity with the current catalogue; nothing is dropped (ST-01).
- The wrapper examples above now use the dispatcher's exact slot spelling (`#date-input`, `richText-input`): `DynamicFormTemplate` matches slot names as exact strings and Vue does not camelize them, so the earlier camelCase spelling would never have matched (ST-02).
- Built-in English button text for add/remove/previous/next/submit, with no labels mechanism in this version (ST-05, ST-06, ST-07).
- First published version is `0.2.0` via the minor changeset from decision 6; npm-side publishing configuration is checked when ST-10 is started, which needs Jeroen's go-ahead anyway (ST-10).
