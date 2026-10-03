---
id: ST-02
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Overridable slots with the slot-forwarding contract

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- Slot spelling → exact dispatcher names (`date-input`, `richText-input`), feature examples corrected
- Template attribute casing → camelCase, honouring the project rule, via a hyphenation-rule override scoped to `packages/element-plus/**/*.vue` (same precedent as `docs/`)
- Slot-name filter → a function called from the template render path, not a `computed` over `useSlots()`

## Functional
### User story
As a library consumer, I want to override a single Element Plus control (or the field wrapper) and keep the built-in Element Plus rendering for everything else, including for field types I added myself, so that I do not have to rebuild the whole template to change one control.

As a consumer who wants zero configuration, I want `<DynamicForm :template="ElementPlusFormTemplate" />` to render fully styled fields with no wrapper component, so that the simplest usage just works.

### Acceptance criteria

Each criterion is verifiable by a Vitest component test (mounting `ElementPlusFormTemplate`, alone and inside `DynamicForm`) unless marked manual.

**Bare (zero-config) usage**

1. **Bare template renders every field through Element Plus chrome.**
   Given `<DynamicForm :metadata="m" :template="ElementPlusFormTemplate" />` with a `text` leaf carrying `label` and required validation,
   When it renders,
   Then the field is wrapped in an `ElFormItem` showing the label and required marker, contains an `ElInput`, and the engine's field render is reached through the reserved `input` slot fallback to the unnamed `default` slot (no wrapper component is involved).

2. **Attributes render.**
   Given a complex-type field with `attributes` rendered through bare usage,
   When it renders,
   Then the attribute sub-items appear via the reserved `attributes` slot (`<slot name="attributes" />`).

3. **Parents and headings keep their children.**
   Given a `heading` field with children, rendered bare,
   When it renders,
   Then the heading chrome shows and the children render inside it (the children reach the engine's default render through the `input` fallback chain, not a bare `<slot />` that a wrapper could starve).

**Override usage via the documented wrapper**

4. **Overriding one per-type input slot keeps everything else.**
   Given a consumer wrapper around `ElementPlusFormTemplate` that forwards `#input="s"` (`<slot v-bind="s" />`) and `#attributes="s"` (`<slot name="attributes" v-bind="s" />`) and overrides only `#date-input`,
   When a form with a `date` field and a `text` field renders,
   Then the `date` field shows the consumer's markup, the `text` field still renders the built-in `ElInput` inside `ElFormItem`, and the override receives the typed slot scope (`fieldMetadata`, `fieldContext`, `disabled`).

5. **Overriding the group wrapper does not lose the input.**
   Given a wrapper that overrides `#default="s"` and renders `<slot v-bind="s" />` inside it,
   When a field renders,
   Then the consumer's chrome appears and the field's input still renders inside it.

6. **Every structural and per-type slot has built-in fallback content.**
   Given the wrapper with no overrides,
   When each of these renders: `default`, `default-input`, and for each built-in type its `<type>-input` slot, plus the `<type>` wrapper slots for `checkbox`, `switch`, `heading`, `divider`,
   Then each renders its Element Plus fallback (asserted by component presence, e.g. `ElInput`, `ElSelect`, `ElCheckbox`, `ElSwitch`, `ElDivider`), and overriding any one of them replaces only that slot. (The array, choice, and wizard `default-*` slots are added in later stories.)

**Generic forward of non-enumerated consumer slots**

7. **A consumer-added field type renders through its own slot.**
   Given `extendMetadata<{ richText: string }>()` and a wrapper supplying `#richText-input` (and the `#input`/`#attributes` forwards),
   When a field of `type: 'richText'` renders,
   Then the consumer's `richText-input` markup renders (not the built-in `default-input` `ElInput`), with typed slot scope.

8. **A non-enumerated per-type structural slot is forwarded.**
   Given a wrapper supplying `#date-array-item` (a per-type slot that has no built-in fallback),
   When the dispatcher selects that slot name,
   Then the consumer's markup is rendered, proving the forward passes any non-enumerated slot name through to the inner `DynamicFormTemplate`.

9. **The forward excludes exactly the reserved and enumerated names.**
   Given `forwardedSlotNames` (a function that reads the current slot keys and is invoked from the template),
   When the consumer supplies `input`, `attributes`, `default`, `default-input`, `text-input`, `date-input`, plus `richText-input`,
   Then only `richText-input` is forwarded by the generic `v-for`; the others are consumed by the explicit templates (no duplicated `<template #X>`, no Vue duplicate-slot warning, no `default`-slot clash). The exclusion set is one named constant/computed, not scattered conditions.

10. **The forward is valid template syntax.**
    Given the source,
    When linted and compiled,
    Then filtering is done in a single named function (`forwardedSlotNames`) invoked from the template, so it re-reads the slot keys on every render, and not by a `v-if` on the `v-for` element, and `vue-tsc`/ESLint pass. It is not a `computed` over `useSlots()`, which would cache its first result and never forward a slot a consumer adds after mount. The exclusion set stays a single named constant.

**Reserved names**

11. **`input` and `attributes` are reserved and this is enforced in the code comment that states why.**
    Given the template source,
    When read,
    Then a short comment explains that `input` and `attributes` are reserved slot names on the template (without referencing specs or ADRs). A consumer field type named `input` or `attributes` is documented as unsupported in the package README in a later story; no runtime guard is required here.

**Naming and hygiene**

12. **camelCase in Vue, except slot names dictated by the core dispatcher.**
    Given the template source,
    When read,
    Then props and events in the SFC use camelCase (for example `:modelValue`, `@update:modelValue`), consistent with the project convention, and `ci:lint` stays clean because the root `eslint.config.js` turns off `vue/attribute-hyphenation` and `vue/v-on-event-hyphenation` for `packages/element-plus/**/*.vue`, extending the existing `docs/**/*.vue` override. Slot names must match the strings `DynamicFormTemplate` dispatches on exactly (`default-input`, `text-input`, `default-choice-array-item`, `<type>-array-item`, ...), because Vue does not normalise slot-name casing; a camelCase slot name such as `dateInput` would silently never match. The type segment keeps the casing of the metadata type key (`richText-input`).

   The behavioural half (slot spelling) is also pinned by a test: `#dateInput` never matches and `#date-input` does.

13. **Code hygiene.**
    Given all new source and test files,
    When reviewed,
    Then no comment or test name references specs or process artifacts (FEAT, ST, AC, ADR, finding, decision numbers), there are no em dashes, and `ci:test`, `ci:lint`, `ci:typecheck` pass for `packages/element-plus`.

### Edge cases
- Bare usage where `input` is absent and `default` is absent (template mounted standalone outside `DynamicForm`): renders without throwing and without a Vue warning about a missing slot.
- A consumer supplies only the `#input` forward but no `#attributes` forward: fields still render; attribute items simply do not render (documented limitation of the wrapper boilerplate).
- A consumer supplies a slot name equal to a built-in enumerated name (for example `#checkboxInput`): handled by the explicit EP template (override), never double-registered.
- Consumer overrides the built-in type `text` through `extendMetadata` and supplies `#text-input`: the override wins.

### Open points
- DECIDED (research): slots are spelled exactly as the dispatcher matches them: `date-input`, `richText-input`, `date-array-item`. The feature's wrapper example and forwarding prose were corrected to match.
  Why: `DynamicFormTemplate`'s `typeWithFallback` resolves `slots[type]` and `${type}-input` by exact string, and Vue does not camelize or hyphenate slot names, so `#dateInput` would never match `date-input`. A fact about the platform and the approved dispatcher, not a taste call.
  Sources: `packages/core/src/components/DynamicFormTemplate.vue` (`typeWithFallback`), the feature's own override prose ("overrides only the `date-input` slot")
- DECIDED (research): template attributes and events in `ElementPlusFormTemplate.vue` are camelCase. The root `eslint.config.js` override that already disables `vue/attribute-hyphenation` for `docs/**/*.vue` is extended to `packages/element-plus/**/*.vue` and also disables `vue/v-on-event-hyphenation`. The config change is in scope for this story.
  Why: CLAUDE.md states "Vue: always use camelCase, never kebab-case" and the docs override is the recorded precedent for resolving exactly this lint conflict in favour of camelCase. The conflict was also smaller than the review assumed: under the antfu config these rules are warnings, and `ci:lint` has no `--max-warnings`, so kebab-case was never enforced as an error. Trial on a scratch SFC with `:modelValue`, `@update:modelValue`, `@someEvent` showed 3 warnings before and a clean run with the scoped override (`vue/no-useless-v-bind` only flagged a string literal and was unrelated).
  Sources: `CLAUDE.md` (Code Style), `eslint.config.js` (docs override), local eslint trial
  Alternative: keep kebab-case in templates as core and the current SFC do and skip the config change. Reversing means deleting the added glob and rewriting this SFC's attributes, a local edit.
- DECIDED (research): `forwardedSlotNames` is a function invoked from the template, reading the current slot keys on every render, instead of a `computed` over `useSlots()`.
  Why: at the installed Vue 3.5.35, `useSlots()` returns the instance's plain `slots` object, which the computed does not track, so a computed caches its first result and a slot added after mount is never forwarded. A function called in the render path re-runs on each parent-driven render. The feature's architecture says "computed from `useSlots()`"; this refines that wording, and the public behaviour is unchanged.
  Sources: `@vue/runtime-core` 3.5.35 `useSlots`/`getContext` (returns `setupContext.slots`), vuejs.org/api/composition-api-setup (`useSlots`)

### Out of scope
- Fixing individual control bindings (`ElUpload` etc.): next story.
- Removing Tailwind classes and building CSS (the `heading`/`switch` Tailwind classes remain until the CSS story).
- Array, choice, wizard `default-*` slots: later stories.
- Eliminating the wrapper boilerplate engine-side: a possible separate core feature (see the feature's ADR-1 decision); `packages/core` is untouched.
- The package stays `private: true`; no changeset.

## Design reference
No prototype. Per-control visuals follow the Element Plus documentation. No deltas.

## Architecture reference
Implements seam 1 (slot-forwarding half) of the feature architecture: "The slot-forwarding contract (centrepiece)", including the generic forward of non-enumerated consumer slots and its exclusion list, ADR-1, and the "Slot contract" under "Public API impact".

Concretely in `ElementPlusFormTemplate.vue`: every enumerated `<template #X>` becomes `<slot name="X" v-bind="s"><!-- Element Plus fallback --></slot>`; the field render is read via `<slot name="input"><slot /></slot>`; the attribute render via `<slot name="attributes" />`; a `forwardedSlotNames` function (invoked from the template) plus a `v-for` dynamic-slot forward is added. The root `eslint.config.js` also gains `packages/element-plus/**/*.vue` in its hyphenation override (see the open points). Structural slots in this story: `default`, `default-input`. Per-type: all `<type>-input` slots and the `checkbox`, `switch`, `heading`, `divider` wrappers.

Depends on ST-01 (renamed component, metadata export, test tooling). Later stories (ST-03 to ST-07) build on the forwarding contract.

## QA plan

### Test infrastructure and fixtures

There is no existing element-plus fixture; core's `TestForm.vue`/`TestFormTemplate.vue` are Tailwind/plain-HTML templates and are not reused. Core's `DynamicFormTemplate.test.ts` (`mountTemplate(type, slots)` with `attrs: { type, fieldMetadata }`) is the pattern for the direct-mount tests. New helpers live in `packages/element-plus/src/__tests__/fixtures/` (helpers are not test files, no `.test.ts` suffix):

- `mountInForm.ts`: `mountInForm({ metadata, template, settings, initialValues })` mounts a small host component that calls core's `useDynamicForm()` and renders `<DynamicForm :metadata :template :settings />`, with `global.plugins: [ElementPlus]`, `attachTo: document.body`, then `flushPromises()`. Exposes the form `values` for binding assertions. The plugin registration matters: the current SFC only type-imports the `El*` components (`import type { ElInput, ... }`), so they resolve at runtime through global registration. The helper installs `ElementPlus` so both a global-registration and a value-import implementation pass; whichever the developer chooses is not constrained by the tests.
- `createConsumerWrapper.ts`: `createConsumerWrapper({ metadataConfiguration?, overrides?: Record<string, (s) => VNodeChild>, forwardInput = true, forwardAttributes = true })` returns a render-function component around `ElementPlusFormTemplate` that forwards `#input` (`slots.default?.(s)`) and `#attributes` (`slots.attributes?.(s)`) exactly as the documented boilerplate does, plus the given override slots. The two forward flags exist for the "forward missing" edge cases.
- `DocumentedWrapper.vue`: a literal SFC copy of the documented two-line boilerplate plus a `#date-input` override. It is the only place the boilerplate is tested as real template syntax (the render-function helper cannot catch template-compile problems in the `<slot name="input"><slot /></slot>` chain or in the dynamic-slot `v-for`).
- `renderCount(wrapper, path)`: reads `[data-testid="<path>-analytics-render-count"]` (same idea as core's `DynamicFormItem.test-helpers`, which is not importable across packages).
- Shared metadata fixtures, one per scenario: `textMetadata` (text leaf, `label`, required via the engine default `minOccurs: 1`), `dateAndTextMetadata`, `attributesMetadata` (`{ name: 'text', type: 'text', attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }] }`, same shape as core's attribute tests), `headingMetadata` (heading with two text children), `allTypesMetadata` (one field per built-in type, for the table-driven tests), `richTextMetadata` via `extendMetadata<{ richText: string }>()`.
- Setup: reuse ST-01's jsdom environment and `enableAutoUnmount(afterEach)` setup file. Prerequisite: `@bach.software/vue-dynamic-form` resolves to `packages/core/dist`, so core must be built before `ci:test` runs in this package (already the case locally; note for CI ordering).
- Stubbing: no Element Plus component is stubbed. Assertions use `findComponent(ElX)` (component identity) rather than CSS classes where possible; class assertions (`.el-form-item.is-required`, `.el-form-item__label`) only for what has no component handle (required marker, label text).
- Time: no date/time-dependent assertion. The `date`, `time`, `datetime` fields are mounted with no value, so `TZ=Europe/Amsterdam` has no effect; the CI script sets it anyway.

### Test files

All under `packages/element-plus/src/__tests__/`, describe names read `component ElementPlusFormTemplate - <area>`, no spec vocabulary in any name or comment.

| File | Covers |
| --- | --- |
| `ElementPlusFormTemplate.bare.logic.test.ts` | criteria 1, 2, 3, standalone edge case |
| `ElementPlusFormTemplate.overrides.logic.test.ts` | criteria 4, 5, 6, edge cases 2, 3, 4 |
| `ElementPlusFormTemplate.forwarding.logic.test.ts` | criteria 7, 8, 9, dynamic-slot edge |
| `ElementPlusFormTemplate.analytics.test.ts` | render-count parity of bare vs wrapped |
| (tooling gate, no test file) | criteria 10, 12, 13 via `ci:lint`/`ci:typecheck`/review |
| (manual) | criteria 11, 13 hygiene review, Storybook smoke check |

### Acceptance criteria to test mapping

**1. Bare template renders through Element Plus chrome** (`bare.logic.test.ts`, component)
- `mountInForm` with `template: ElementPlusFormTemplate` (no wrapper), `textMetadata` with `label: 'First name'`.
- Assert: one `ElFormItem` exists; its `.el-form-item__label` text is `First name`; it has class `is-required`; `formItem.findComponent(ElInput).exists()` (the input is inside the form item, proving the `input` -> `default` fallback reached the engine's field render); exactly one `ElInput` in total (no duplicate render from the two-level engine render).
- Binding: `setValue('abc')` on the input updates the host `values.text`, and a pre-filled `initialValues` shows in the input (guards that the fallback chain passes `fieldContext` through).
- Not required metadata (`minOccurs: 0`): no `is-required` class (guards against a hard-coded required marker).
- States from the design policy that apply to this slice: value/empty (above), required marker, disabled (`maxOccurs: 0` or `disabled: true` -> `ElInput` has `disabled` prop), validation error (see below). Loading/empty-list states do not exist for a leaf field and belong to ST-05 to ST-07.
- Error state: a required field left empty, then `validate()` via the host's form; assert `ElFormItem` still renders and the error text is reachable in the DOM if the template surfaces `errorMessage`. The story does not specify error display, so assert only that the field stays rendered and no exception is thrown; flagged below.

**2. Attributes render** (`bare.logic.test.ts`)
- `attributesMetadata` bare. Assert the attribute sub-item's `ElInput` exists (two `ElInput` total: value plus `lang`), that typing in the attribute input sets `values.text.lang`, and that typing in the main input still sets `values.text.value` (vee-validate bracket path regression guard for the new `input`/`attributes` routing).
- The story does not fix where the attributes sit relative to the main input, so the test asserts presence and binding, not DOM order.

**3. Parents and headings keep their children** (`bare.logic.test.ts`)
- `headingMetadata` bare. Assert `h3` with the heading label exists and both child `ElInput`s are descendants of the heading's container element (`h3.element.parentElement.contains(input.element)`), and each child has its own `ElFormItem`.
- Guard against the starved-wrapper failure mode: same assertion again through `createConsumerWrapper` with default forwards (children still appear when `input` is forwarded), and a third case where the wrapper forwards nothing (`forwardInput: false`): children are not required to render, but mounting must not throw. This pins the documented limitation without asserting it as a feature.

**4. Overriding one per-type input slot** (`overrides.logic.test.ts`)
- Wrapper with `overrides: { 'date-input': spy }` where `spy = vi.fn(s => h('div', { 'data-testid': 'custom-date' }, s.fieldMetadata.name))`, metadata `dateAndTextMetadata`.
- Assert: `[data-testid=custom-date]` exists; no `ElDatePicker` is rendered; the text field still has `ElFormItem` > `ElInput`; the date field is still inside an `ElFormItem` (override of `-input` keeps the wrapper chrome).
- Slot scope: `spy` was called with an object containing `fieldMetadata` (with `name: 'date'`), `fieldContext` (with `value` and `handleChange` functions; calling `handleChange('2024-01-02')` updates host `values.date`), and `disabled` (boolean).
- Type-level: a `.ts` type test next to the wrapper fixture (`expectTypeOf`) that the `#date-input` scope is `ItemAttributes`-shaped with `fieldContext.value` typed `string`, checked by `ci:typecheck`.

**5. Overriding the group wrapper keeps the input** (`overrides.logic.test.ts`)
- Wrapper with `overrides: { default: s => h('section', { 'data-testid': 'custom-chrome' }, slots.default(s)) }` (the override must call the wrapper's own default slot with the scope, as documented).
- Assert: `custom-chrome` exists; the field's `ElInput` is inside it; there is no `ElFormItem` for that field (the chrome is replaced, not stacked).
- Negative case: an override that does not render the slot content results in no `ElInput` for that field (documents that the consumer owns the forward; confirms the override really replaces the built-in).
- Also override `default` for a parent (`heading` without own wrapper override is not involved): the `default` override receives the scope for every non-`heading` field exactly once per field (spy call count equals number of field renders at that level, no double-invocation from the two-level engine render beyond the expected outer/inner pair; record the expected pair count from a first run and pin it).

**6. Every structural and per-type slot has fallback content** (`overrides.logic.test.ts`, table driven)
- Table `builtInTypes`: `text` -> `ElInput`, `select` -> `ElSelect`, `checkbox` -> `ElCheckbox`, `radio` -> `ElRadioGroup`, `date` -> `ElDatePicker`, `time` -> `ElTimePicker`, `datetime` -> `ElDatePicker` (prop `type === 'datetime'`), `switch` -> `ElSwitch`, `number` -> `ElInputNumber`, `rate` -> `ElRate`, `slider` -> `ElSlider`, `color` -> `ElColorPicker`, `cascader` -> `ElCascader`, `transfer` -> `ElTransfer`, `upload` -> `ElUpload`, `heading` -> heading chrome with label, `divider` -> `ElDivider`. That is all 17 current types; this story owns fallback presence only, correctness of each control's binding is the next story.
- `it.each(builtInTypes)` twice:
  1. No overrides: field renders the expected component, exactly once.
  2. Override only `<type>-input` (for `heading` and `divider`, override `<type>`): the custom markup renders, the built-in component for that type is absent, and a neighbouring field of a different type (fixed: a `text` field, or a `number` field when the type under test is `text`) still renders its built-in component.
- Wrapper-type slots `checkbox`, `switch`, `heading`, `divider`: separate `it.each` overriding `<type>` while leaving `<type>-input` alone: the consumer wrapper markup replaces the built-in wrapper and, when it renders the forwarded default slot, the built-in input component still appears inside it (proves the two tiers are independent). For `switch`, label text renders once, not twice, in the built-in case (wrapper label and `ElSwitch` do not both print it); same for `checkbox` (`ElCheckbox` slot text equals the label once).
- `default-input`: a field of a type with no dedicated `-input` slot (for example a consumer `richText` from `extendMetadata`, no `richText-input` supplied) renders the built-in `ElInput`; with `overrides: { 'default-input': spy }` the spy renders instead and receives the `richText` field scope.
- `default`: covered by criterion 5; a type with no dedicated wrapper (e.g. `number`) uses it in the no-override case (ElFormItem present).
- Equivalence guard: for `allTypesMetadata`, the DOM text and the set of rendered Element Plus component names are equal between bare usage and the no-override wrapper (ids such as `el-id-*` normalised before comparing). This catches a forward that silently changes rendering.
- Array, choice, and wizard `default-*` slots are out of scope and have no test here.

**7. Consumer-added field type renders through its own slot** (`forwarding.logic.test.ts`)
- `extendMetadata<{ richText: string }>()` result passed as `metadataConfiguration` of the wrapper; metadata `[{ name: 'body', type: 'richText' }]`; wrapper `overrides: { 'richText-input': spy }`.
- Assert: spy markup renders; no `ElInput` for that field; spy scope contains `fieldMetadata.type === 'richText'`, `fieldContext.value`/`handleChange` that round-trips into host `values.body`.
- Also the SFC route: `DocumentedWrapper.vue` variant with a `#richText-input` slot (real template syntax, not only render functions).
- Type-level: `expectTypeOf` that the scope's `fieldContext.value.value` is `string` for `richText`, verified through `vue-tsc` on the SFC fixture. Verified in `ci:typecheck`; not a runtime test.
- Without the `richText-input` slot (same metadata), the built-in `default-input` `ElInput` renders (the proof that the forward, not the fallback, produced the consumer markup).

**8. Non-enumerated per-type structural slot is forwarded** (`forwarding.logic.test.ts`, direct mount)
- Direct mount of `ElementPlusFormTemplate` (no engine, pattern from core's `DynamicFormTemplate.test.ts`) with `attrs: { type: 'date-array-item', fieldMetadata: { path: 'd', type: 'date', name: 'd' } }` and `slots: { 'date-array-item': spy }`. Assert the spy's markup renders and the spy received the attr-derived scope (`fieldMetadata.name === 'd'`).
- Control case: same mount without the slot renders the `default` fallback (not the consumer markup, and does not throw), proving the consumer markup comes from the forward.
- Kept as a direct mount on purpose: the engine only emits `-array-item` types for arrays, whose built-in rendering arrives in a later story; an engine-driven variant belongs to that story's plan.

**9. The forward excludes exactly the reserved and enumerated names** (`forwarding.logic.test.ts`)
- Wrapper supplying `input`, `attributes`, `default`, `default-input`, `text-input`, `date-input`, `richText-input`, each as a `vi.fn` slot. Mount through `mountInForm` with a `text`, `date`, and `richText` field plus an attribute case.
- Assert each spy is invoked the expected number of times and each field's markup appears exactly once (no duplicated `<template #X>` output): query by unique `data-testid` inside each spy's markup and assert `findAll(...).length === 1` per field.
- Assert no slot-related Vue warning: `vi.spyOn(console, 'warn')`, then assert no call whose message matches `/slot|duplicate|extraneous/i`. A blanket `not.toHaveBeenCalled()` is deliberately avoided because unrelated Element Plus deprecation warnings (for example the existing `ElRadio :label` usage) and the known `ElUpload` model-value attribute warning would make it fail for reasons owned by the next story.
- `input`/`attributes` not leaked: assert the inner `DynamicFormTemplate` never receives a slot named `input` or `attributes` (mount with a `global.stubs` replacement of `DynamicFormTemplate` that records `Object.keys($slots)`; the recorded set contains `richText-input` and never `input` or `attributes`). This is the one test that uses a stub; it directly tests the "exactly the reserved and enumerated names" clause, which cannot be observed from rendered output alone.
- Enumerated names are not forwarded twice: same recorder asserts every key appears once (object keys are unique by construction, so also assert the consumer's `default` spy output is used once and that the EP fallback `ElFormItem` is absent when `default` is overridden).
- "One named constant/computed": code review item, see the manual checklist (not testable without coupling to source text).

**10. Valid template syntax** (gate)
- Not a runtime test. Verified by: `DocumentedWrapper.vue` and `ElementPlusFormTemplate.vue` compile in every mount test (a `v-if` on the `v-for` element fails compile); `pnpm --filter ./packages/element-plus run ci:lint` and `ci:typecheck` pass. The manual checklist includes a one-line source check that no `v-if` shares an element with the forwarding `v-for`.

**11. Reserved names explained in a comment** (manual)
- Reading the SFC: a short comment states that `input` and `attributes` are reserved slot names, with no spec vocabulary. Untestable automatically without coupling to comment text; the missing runtime guard is explicitly accepted by the criterion. One behavioural pin is added instead: a metadata type literally named `input` mounts without throwing in bare usage (documents the unsupported-but-not-guarded state; assertion is "no exception", not a rendering claim). Include it only if it is stable; drop it if the developer finds it flaky, and record that in Implementation notes.

**12. camelCase except dispatcher slot names** (`overrides.logic.test.ts` plus lint)
- Behavioural pin for the slot-name half: a wrapper supplying `#dateInput` (camelCase, wrong) renders the built-in `ElDatePicker`, while `#date-input` renders the override. This guards against a future "tidy-up" that camelizes slot names, which Vue would not match. `richText-input` keeps its type casing (covered by criterion 7).
- The prop/event camelCase half is source style only; see finding 1 below about lint.

**13. Code hygiene** (gate + manual)
- Gate: the three `ci:*` scripts pass. Manual: a search over the new/changed files in `packages/element-plus/src/` for `FEAT|ST-|AC[0-9]|ADR|finding|decision` and for the em dash character returns nothing (see the checklist for the exact command).

### Edge cases mapping

| Edge case | Test |
| --- | --- |
| Template mounted standalone, no `input`, no `default` | `bare.logic.test.ts`: direct mount with `attrs` and no slots for a `text` type and an `x-input` type; no throw, no Vue warn matching `/slot/i`, renders the built-in fallbacks |
| `#input` forwarded, `#attributes` not | `overrides.logic.test.ts`: `forwardAttributes: false` with `attributesMetadata`; the main field renders, the `lang` attribute input does not |
| Slot name equal to a built-in enumerated name (`#checkbox-input`) | `overrides.logic.test.ts`: override of `checkbox-input` replaces the built-in checkbox, renders once, is invoked once (covered by the table in criterion 6, plus the explicit once-only assertion from criterion 9) |
| Consumer overrides built-in `text` via `extendMetadata` and supplies `#text-input` | `forwarding.logic.test.ts`: `extendMetadata<{ text: { doc: string } }>()` with a `text-input` override renders the override, not `ElInput` |
| Consumer slot supplied after mount (added dynamically) | `forwarding.logic.test.ts`: wrapper that toggles a `richText-input` slot via a ref after mount; assert the consumer markup appears (see finding 2). This passes because the exclusion filter is invoked from the render path; it would fail against a `computed` over `useSlots()`. |

### Reactivity and render counts

The slice touches neither `DynamicFormItem`, `computedProps`, nor validation wiring, and the template adds no reactive state, so no core render-count regression is possible from source changes. A single `ElementPlusFormTemplate.analytics.test.ts` is still planned because the new forward adds a slot layer between the engine and the controls and the feature promises "render-count behaviour is unchanged from any other template":

- Two text fields (`a`, `b`) with `settings: { analytics: true }`. Bare usage and wrapper usage (`createConsumerWrapper` with default forwards) each: after mount `renderCount(wrapper, 'a') === 1` and same for `b`; after `setValue` on `a`, `renderCount(wrapper, 'b')` is unchanged and `renderCount(wrapper, 'a')` does not exceed its post-mount value by more than the bare-usage delta (assert wrapped delta equals bare delta rather than pinning an absolute number, so the test states the contract "forwarding costs no extra DynamicFormItem renders").
- The analytics element is rendered by the engine, not by the template, so the fixture needs no template-side markup.

### Coverage

The plan targets every line of the new template code introduced by this story (the two fallbacks, the 17 per-type templates, `forwardedSlotNames` and the forward `v-for`). Element-plus coverage currently has no real baseline (the placeholder test covers nothing), so ST-01's run sets the baseline and this story must not lower it. Knowingly uncovered: the `default-*` array/choice/wizard slots (do not exist yet); branches inside each control's prop expressions that depend on optional metadata (`field.max || 5` for `rate`, `field.type || 'date'`), which the next story's binding audit covers; the `disabled` combination for every one of the 17 controls (only `text` and one wrapper-type control are asserted here).

### Regression risk

- Touched: only `packages/element-plus/src/ElementPlusFormTemplate.vue`. `packages/core` is untouched, so the core test suite cannot regress; it is not re-run for this story beyond the normal `pnpm run ci:test` at the repo root.
- ST-01 tests (render of `text` and `select`, `metadataConfiguration` default/extended mounts, `extendMetadata` types) are the guards for the rename and metadata layer; they must still pass after this story rewraps every template in `<slot name="X">`. If ST-01's tests mount `ElementPlusFormTemplate` directly and assert `ElInput` inside, they exercise the new fallback path.
- Later stories build on the forwarding contract: ST-03 (binding audit) relies on the per-type `-input` tests here as its mount fixtures; ST-04 (CSS) rewrites the same SFC, so these tests are its regression net (component identity assertions survive class/markup changes, which is why class-based assertions are avoided); ST-05 to ST-07 add `default-*` slots to the same exclusion set, so the criterion 9 recorder test must be extended by each of them when they add an enumerated name.
- Storybook playground: `playgrounds/storybook/components/ElementPlusDynamicFormImplementation.vue` forwards all `$slots` (including the engine's `default`) onto `ElementPlusFormTemplate` and overrides `#default="{ field, required }"`. After this story the forwarded engine `default` lands on the reserved-name scheme differently, so the story's rendering may change. The playground polish is a later story, but the smoke check below confirms it still mounts.

### Manual verification checklist

1. `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck` inside `packages/element-plus`, then `pnpm -r ci:test:coverage` at the root; compare element-plus coverage with ST-01's recorded baseline.
2. Source read of `ElementPlusFormTemplate.vue`: (a) a short comment explains that `input` and `attributes` are reserved; (b) the exclusion list is a single named constant or computed (`forwardedSlotNames`), not scattered conditions; (c) no `v-if` sits on the forwarding `v-for` element; (d) every enumerated template is `<slot name="X" v-bind="s">` with fallback content; (e) slot names use the dispatcher spelling (`date-input`, `default-input`).
3. Hygiene search over the changed files in `packages/element-plus/src/`: no matches for `FEAT|ST-0|AC[0-9]|ADR|finding|decision`, and none for the em dash character.
4. Storybook smoke: start `pnpm storybook`, open the Element Plus form story, confirm it still renders fields and logs no Vue warnings about duplicate or missing slots in the console. Visual parity is not judged here (CSS and playground polish are later stories).
5. Optional quick visual check of bare usage in Storybook or a scratch page with `element-plus/dist/index.css` imported: label, required asterisk, and input appear in an `ElFormItem`. Not a release gate for this story.

### Findings raised by the QA planner

These are proposals for the adversarial reviewer and Jeroen; none is silently assumed in the plan above.

1. **Criterion 12 versus criterion 13 conflict in lint.** The root `eslint.config.js` disables `vue/attribute-hyphenation` only for `docs/**/*.vue`; `packages/element-plus` is linted with the `@antfu/eslint-config` default, which (as in core, e.g. `:field-metadata`) enforces kebab-case attributes and events. Criterion 12 requires `:modelValue` and `@update:modelValue`. If the rule is active, `ci:lint` fails on the very style criterion 12 mandates, so criteria 12 and 13 cannot both pass. Proposal: first run `eslint` on the current SFC to confirm, then either extend the eslint override to `packages/element-plus/**/*.vue` (a root config change this story does not list) or relax criterion 12 to "consistent with whatever lint enforces". Needs a decision before implementation; the plan is otherwise unaffected.
2. **`forwardedSlotNames` as a plain `computed` over `useSlots()` goes stale.** `useSlots()` returns a non-reactive object, so a `computed(() => Object.keys(slots))` caches its first result: a slot that a consumer adds after mount (a `v-if` on a `<template #richText-input>` in the wrapper) would never be forwarded. Criteria 9 and 10 name a computed explicitly. Proposal: either compute the list in the render path (a function called from the template, which re-runs on each parent-driven render) while keeping the single named exclusion constant, or document the static-slot limitation. The dynamic-slot test in the edge case table is written for the first option; if the second is chosen, the test is replaced by one asserting the documented behaviour. Decision needed.
3. **Criterion 1's required-marker wording.** `ElFormItem` renders the required asterisk with CSS, not DOM text, so the test asserts `.is-required` on the form item and the `required` prop, not an asterisk glyph. No criterion change needed, noted so nobody expects a text assertion.
4. **Criterion 1 error state is unspecified.** The story does not say whether the built-in fallback surfaces validation messages (`ElFormItem :error`). The plan asserts only that the field keeps rendering on validation failure. If error display is intended in this story, a criterion should state it so a test can pin it; otherwise it belongs to a later story.
5. **Criterion 8 cannot be exercised through the engine yet.** Array rendering arrives in a later story, so the `date-array-item` test is a direct mount. This is sufficient for the forwarding claim but leaves the engine-driven path untested here; the array story's plan should include the integrated case.
6. **Criterion 6 ("each renders its Element Plus fallback") mixes presence and behaviour.** Interpreted as presence and independence of overrides only; binding correctness (for example `ElUpload`) is explicitly the next story, so assertions here never depend on a control's value round trip except for `text` and the override-scope cases.

## Adversarial review
Filled by adversarial-reviewer (lite, story level). Findings and resolutions. (Reviewer running as opus.)

1. **BLOCKER — criterion 12 (camelCase template attributes) is unsatisfiable together with criterion 13 (`ci:lint` passes), and implementing it as written would break currently-green lint.** Verified against the repo, not reasoned: the root `eslint.config.js` turns `vue/attribute-hyphenation` off only for `docs/**/*.vue`; `packages/element-plus` is linted with the `@antfu/eslint-config` default. `vue/attribute-hyphenation` defaults to `"always"`, which errors on camelCase attributes on components and requires the hyphenated form (verified against eslint.vuejs.org/rules/attribute-hyphenation). The existing `ElementPlusDynamicForm.vue` and core's `DynamicFormTemplate.vue` both write every component attribute in kebab-case (`:model-value`, `@update:model-value`, `:metadata-configuration`) and pass lint today, which proves the rule is live in `always` mode. Criterion 12 mandates `:modelValue` and `@update:modelValue`; those would fail `ci:lint`, so criteria 12 and 13 cannot both pass, and rewriting the ported `-input` templates to camelCase would introduce lint errors where none exist now. This also surfaces a genuine conflict between two of Jeroen's own instructions (the global "always camelCase in Vue" note and the project's active `vue/attribute-hyphenation: always` lint rule), which only he can resolve. See the PROPOSED note under criterion 12.

   RESOLVED: settled from research rather than by Jeroen (see the camelCase `DECIDED (research)` in Open points): the lint rules are only warnings, and the `docs/` override is the existing precedent, so the override is extended to `packages/element-plus/**/*.vue` and criteria 12 and 13 both hold.

2. **SHOULD-FIX — `forwardedSlotNames` as a plain `computed` over `useSlots()` cannot satisfy the post-mount edge case, and criterion 10's "in a computed" wording over-constrains the fix.** Verified: at the installed Vue (`>=3.5.18`), `useSlots()` returns a non-reactive object, so `computed(() => Object.keys(slots))` caches its first result and never re-runs when the reading touches no reactive dependency; `$slots` read during render, by contrast, re-evaluates on every parent-driven re-render (vuejs/core discussions #6096, #6726). Consequences: (a) the "Consumer slot supplied after mount" row in the edge-case table would fail against a literal `computed`; (b) criterion 10 says "filtering is done in a computed (`forwardedSlotNames`)", but the reactivity-correct shape is a function/getter invoked from the template, which is not a `computed`. The statically-supplied slots that criteria 7/8/9 exercise are present at first render, so those pass with a `computed`; only the dynamic case and the wording break. The feature architecture itself says `forwardedSlotNames` is "computed from `useSlots()`", so this refinement is propagated to the feature spec rather than silently overridden locally. See the PROPOSED notes under criterion 10 and the edge-case table.

   RESOLVED: criterion 10 and the edge-case row now specify a render-path function (see the slot-name filter `DECIDED (research)` in Open points). The feature's "computed from `useSlots()`" wording needs a small amendment to match.

3. **NIT — criterion 6 says "17 current types" in the mapping but the criterion body and feature prose elsewhere say "16".** The settled note in the feature Stories section already records the 17-type correction (15 controls plus `heading`/`divider`); the story is internally consistent on 17. No action needed; flagged only so a reader does not trip on the leftover "16" in the parent spec.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

- **Deviation affecting the feature design (propagated to the feature spec as a flagged amendment): the `default` chrome override is only honoured when an `input` slot is forwarded.** Written literally as `<slot name="default" v-bind="s"><ElFormItem>...</ElFormItem></slot>`, bare usage renders the engine's field render in place of the Element Plus chrome, because in bare usage the unnamed `default` slot IS the engine's render and the template cannot tell it apart from a consumer override. Verified: with the literal form, 5 of the bare-usage tests fail (no `ElFormItem`, no attribute items, heading children unwrapped). The template therefore picks the slot name through `chromeSlotName()` (`default` only when `slots.input` exists, otherwise a name that never matches, so the built-in chrome renders). The documented wrapper always forwards `#input`, so wrapped usage is unaffected. Limitation: a wrapper that overrides `#default` but does not forward `#input` has its override treated as the engine render.
- **Attribute items render outside the overridable chrome.** `<slot name="attributes" />` follows the `default`, `checkbox`, `switch`, and `heading` slots instead of sitting inside their fallback content, so overriding the group wrapper does not silently drop attribute fields. A consumer chrome therefore cannot position the attributes, and must not render `<slot name="attributes">` itself (it would render twice). The engine only emits the attribute items once the field has a value, which the attribute tests account for.
- **Slot typing.** `ElementPlusFormTemplateSlots` is now `TemplateSlots<T> & { input, attributes } & Record<string, (props: any) => any>`. The dispatcher's per-type slot keys are deferred mapped types inside the generic component, so `vue-tsc` could not resolve `<slot name="date-input">` or call `<slot />` without a scope; the loose record only affects the template-internal view. Consumer scopes stay strict for the known names: `DocumentedWrapper.vue` and `DocumentedRichTextWrapper.vue` assert `fieldContext.value.value` is `string` with `@vue-expect-error` negatives, and `ci:typecheck` passes. Side effect: a misspelled slot name such as `#dateInput` is no longer a type error (it never matches at runtime, which a test pins). `input` and `attributes` take `(props: any)` so the documented `<slot v-bind="s" />` forward type-checks.
- **Dynamic slot forward test.** The post-mount slot test builds one stable wrapper component (a wrapper recreated on every render would remount and hide the problem). Replacing `forwardedSlotNames()` with a `computed` makes it fail; verified by mutation and reverted.
- **Hyphenation lint.** `eslint.config.js` now applies the `docs/**/*.vue` override (`vue/attribute-hyphenation` off) to `packages/element-plus/**/*.vue` too and also turns off `vue/v-on-event-hyphenation` for both globs. The SFC is camelCase throughout; the 3 ST-01 hyphenation warnings are gone (`ci:lint` is clean).
- **`mountInForm` does not install Element Plus itself.** The package's test setup already registers the plugin globally; installing it again produced "Plugin has already been applied" warnings. The fixture still attaches to `document.body`.
- **`createConsumerWrapper` overrides take `(scope, wrapperSlots)`** so a `default` override can render the wrapper's own default slot as the documented wrapper does. `fixtures/metadata.ts` holds the shared metadata, `fixtures/renderCount.ts` the analytics reader, and `ElementPlusFormTemplate.test-helpers.ts` (`mountInput`) now also accepts function slots.
- **Reserved-name pin** (a field type named `input` mounts without throwing) is included and stable.
- **Equivalence guard** compares text and HTML of bare vs wrapped usage for all 17 types after normalising `el-id-*` and the Element Plus `tabindex="-1"` focus marker.
- **Radio deprecation noise.** Tests that mount a `radio` field print Element Plus's `ElRadio :label` deprecation message to stderr. It is not a failure and is owned by the binding story (the `label` prop is kept for the `>=2.0.0` floor).
- **Not done:** the Storybook smoke check was a successful `storybook build` only; the story was not opened in a browser, so the "no new console warning" part of that checklist item is unverified. The playground wrapper (`ElementPlusDynamicFormImplementation.vue`) forwards all `$slots` and has a stale `#default="{ field, required }"`; it still builds, its polish is the playground story.
- **Checks:** `pnpm run ci:test` (core 686, element-plus 134 tests), `ci:lint`, `ci:typecheck` pass. `pnpm -r ci:test:coverage`: element-plus 100 / 100 / 100 / 100 (statements, branches, functions, lines; ST-01 baseline was 100 percent statements and branches), core unchanged at 97.57 / 92.61 / 97.14. `pnpm run build` in the package succeeds with clean declarations. Hygiene greps over `packages/element-plus/src` and `eslint.config.js` find no process references and no em dashes. `packages/core` untouched, package still private, so no changeset; `specs/components.md` row updated.

## Verification report
Filled by qa-verifier after implementation. Verifier ran as Sonnet 5. Verdict: **pass-with-notes**.

### Pipeline results (re-run independently)
- `pnpm run ci:test` (root): core 27 files / 686 tests pass; element-plus 8 files / 134 tests pass. The `ElRadio :label` deprecation stderr noise is the known Element Plus message owned by the binding story, not a failure.
- `pnpm run ci:lint`: clean for core and element-plus. `pnpm run ci:typecheck`: clean for core and element-plus (includes the `@vue-expect-error` scope-type checks in `DocumentedWrapper.vue` and `DocumentedRichTextWrapper.vue`).
- `pnpm -r ci:test:coverage`: element-plus 100 / 100 / 100 / 100 (baseline from ST-01 was 100 statements and branches, not lowered). Core 97.57 / 92.6 / 97.14 (developer noted 92.61; core is untouched, so this is rounding, not a change).
- `docs/` untouched, so no `docs:build`. `node_modules` installed.

### Mutation checks (independent; SFC restored byte-identical, verified with `cmp` and `shasum`)
| Mutation | Result |
| --- | --- |
| Drop `input` from the exclusion set | caught (forwarding test) |
| Drop `attributes` from the exclusion set | caught (forwarding test) |
| Drop `default` from the exclusion set | caught (8 tests) |
| Drop `date-input` from the exclusion set | survives (equivalent mutant: the doubled template renders the same output, see notes) |
| Cache the slot names once instead of per render | caught (post-mount slot test) |
| Rename `#date-input` to `#dateInput` | caught (8 tests) |
| `chromeSlotName()` always returns `default` | caught (5 bare-usage and equivalence tests) |

### Acceptance criteria
| # | Result | Evidence |
| --- | --- | --- |
| 1 | pass | `bare.logic`: one `ElFormItem`, label `First name`, `is-required`, one `ElInput` inside it; two-way binding; optional field not required; disabled; field still renders after failed validation |
| 2 | pass | `bare.logic`: attribute items render (2 inputs), both bind (`value`, `lang`); wrapped variant in `overrides.logic` and `forwardAttributes: false` negative |
| 3 | pass | `bare.logic`: `h3` label, both child `ElInput`s inside the heading container, each with its own `ElFormItem`; wrapped with default forwards; `forwardInput: false` mounts without throwing |
| 4 | pass | `overrides.logic`: `custom-date` renders once inside an `ElFormItem`, no `ElDatePicker`, text field keeps `ElFormItem` > `ElInput`; scope has `fieldMetadata`, `fieldContext.handleChange` (round-trips to host values), `disabled` boolean; type pin in `DocumentedWrapper.vue` (`ci:typecheck`) |
| 5 | pass | `overrides.logic`: custom chrome contains the `ElInput`, no `ElFormItem`; negative case drops the input; attribute items survive a `default` override; per-field call count 1 |
| 6 | pass | `overrides.logic`: `it.each` over 15 control types (fallback once, `datetime` prop `type`, override replaces only that control with neighbour intact), heading and divider wrapper overrides, checkbox/switch wrappers independent of input slot, labels printed once, `default-input` fallback and override, `default` for `number`; bare vs wrapped equivalence for all 17 types |
| 7 | pass | `forwarding.logic`: `richText-input` markup renders once, no `ElInput`, `handleChange` reaches host `values.body`; template-syntax variant `DocumentedRichTextWrapper.vue`; without the slot the `ElInput` renders; typed scope via vue-tsc |
| 8 | pass | `forwarding.logic`: direct mount with `date-array-item` slot renders consumer markup with `fieldMetadata.name === 'd'`; control case falls back to `ElFormItem` |
| 9 | pass-with-note | recorder test proves `input` and `attributes` never reach the dispatcher and `richText-input` does; second test renders each field once with 7 spies, correct counts, and no slot/duplicate/extraneous warning. The "no enumerated name forwarded twice" half is not directly observable (see notes). Exclusion set is one named constant `unforwardedSlotNames` |
| 10 | pass | single named function `forwardedSlotNames()` called from the template; no `v-if` on the `v-for` element; lint, typecheck and every mount test compile it; the post-mount test fails when the function is replaced by a cached value (mutation above) |
| 11 | pass | SFC lines 44-46 state that `input` and `attributes` are reserved, no spec vocabulary; pin test mounts a field type named `input` without throwing |
| 12 | pass | SFC uses `:modelValue` and `@update:modelValue`; `eslint.config.js` extends the override to `packages/element-plus/**/*.vue` and adds `vue/v-on-event-hyphenation`; `ci:lint` clean; `#dateInput` pin test passes (override never called, `ElDatePicker` renders); `richText-input` keeps type casing |
| 13 | pass | grep for `FEAT\|ST-0\|AC[0-9]\|ADR\|finding\|decision` and for the em dash over `packages/element-plus/src` and `eslint.config.js`: no matches; test names follow `component ElementPlusFormTemplate - <area>` and the `*.logic.test.ts` / `*.analytics.test.ts` conventions; three `ci:*` scripts pass |

### Edge cases
- Standalone mount with no slots (`text` and a `custom-input` type): renders fallbacks, no slot warning (`bare.logic`). Pass.
- `#input` forwarded without `#attributes`: main field renders, attribute input absent (`overrides.logic`). Pass.
- `#checkbox-input` style built-in name: replaced once and invoked once (table in `overrides.logic`). Pass.
- Consumer overrides built-in `text` via `extendMetadata` plus `#text-input`: override wins (`forwarding.logic`). Pass.
- Slot supplied after mount: forwarded (`forwarding.logic`, stable wrapper component). Pass.

### Prototype comparison
No prototype for this feature; per-control visuals follow the Element Plus docs. No sibling-story visual drift to compare (ST-01 has no markup change). The Storybook smoke check was not re-run in a browser by the developer and was not run by the verifier either (CSS and playground polish belong to later stories).

### Process compliance
- `specs/components.md` row updated for the renamed and new public surface. Pass.
- `packages/core` has no changes in the working tree and the package stays `private: true`, so no changeset is required and none was added. Pass.
- No new undocumented exports (this story adds none). camelCase in the SFC. Slot names use the dispatcher spelling.
- Deviations (`chromeSlotName()` gating of the `default` chrome override, attribute items placed after the overridable chrome, loose slot record type) are recorded under Implementation notes and the first two are propagated to the feature spec as a flagged amendment. No silent deviation from the DECIDED entries: the kebab/camel lint override, the dispatcher slot spelling and the render-path `forwardedSlotNames()` are all implemented as decided.

### Notes (non-blocking)
1. The feature spec line on `forwardedSlotNames` still says "Filtering in a computed rather than a `v-if`" a few words after saying it is a function, not a computed. Small wording cleanup for the feature spec.
2. Criterion 9's "enumerated names are not forwarded twice" is only weakly testable: removing an enumerated name such as `date-input` from the exclusion set produces identical output (the later duplicate template renders the same slot), and the recorder test's unique-keys assertion is true by construction. The `input`, `attributes` and `default` exclusions are well guarded. Accepted as an equivalent mutant.
3. Documented limitation: a wrapper that overrides `#default` but forwards no `#input` has its override treated as the engine render. Matches the flagged amendment.
4. Storybook was not opened in a browser by anyone; the playground wrapper still has a stale `#default="{ field, required }"` (playground story).
5. The `forwardedSlotNames` function re-runs on each parent-driven render and builds a small array; negligible.

This was not the feature's last open story (ST-03 to ST-10 remain), so the feature stays `in-progress`. Reminder for Jeroen: link the PR in the `pr:` frontmatter.
