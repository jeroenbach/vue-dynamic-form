---
id: ST-01
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Rename, metadata catalogue, and extension mechanism foundation

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- Type count → parity with the current catalogue (17 types), "16" in the feature prose is a miscount
- CI build ordering → add a build step to the `test` job, mirroring the `typecheck` job
- Slot scope for the added type → criteria 10 and 12 assert it at the metadata level and on the slots that exist here; the `richText-input` slot assertion moves to the slot-forwarding story


## Functional
### User story
As a library consumer of `@bach.software/vue-dynamic-form-element-plus`, I want to import `ElementPlusFormTemplate`, `elementPlusMetadata`, and `extendMetadata` and get one typed metadata configuration covering the 16 built-in Element Plus field types plus my own additional types, so that I can type my forms and template slots without hand-redeclaring the built-in catalogue.

As a maintainer, I want the package to have a working component test setup (jsdom plus Vue Test Utils) and real tests instead of the placeholder, so that every later slice lands with coverage.

### Acceptance criteria

Each criterion is verifiable by a Vitest test, a type-level test (`expectTypeOf`/`vue-tsc`), or a manual step.

**Rename**

1. **The component is exported under its new name and the old name is gone.**
   Given the package entry `packages/element-plus/src/index.ts`,
   When a test imports from it,
   Then `ElementPlusFormTemplate` is exported, `ElementPlusDynamicForm` is not exported (no alias, hard rename), and the source file is `ElementPlusFormTemplate.vue` (renamed, history preserved via `git mv`).

2. **Behaviour of the current template is preserved by the rename.**
   Given `ElementPlusFormTemplate` mounted with the same metadata the old component handled (a `text` and a `select` field),
   When it renders,
   Then the `text-input` and `select-input` slots still render `ElInput` and `ElSelect` bound to the field value (regression: the port does not change rendering in this story; slot-forwarding, binding audit, and CSS follow in later stories).

3. **Existing consumers in this repo keep compiling.**
   Given `playgrounds/storybook/components/ElementPlusDynamicFormImplementation.vue`,
   When the rename lands,
   Then its import and tag use `ElementPlusFormTemplate` (minimal edit only, no other playground changes; the full playground polish is a later story) and the Storybook project still typechecks/builds for the Element Plus story.

**Metadata catalogue**

4. **`elementPlusMetadata` carries the built-in catalogue.**
   Given `elementPlusMetadata`,
   When a type-level test inspects `GetMetadataType<typeof elementPlusMetadata>` and the slot-prop typing,
   Then every value type of today's inline `defineMetadata` call (`text`, `select`, `checkbox`, `radio`, `date`, `time`, `datetime`, `switch`, `number`, `rate`, `slider`, `color`, `cascader`, `transfer`, `upload`, `heading`, `divider`) resolves with its exact current value type, and the extended property bag (`label`, `placeholder`, `options`, `disabled`, `readonly`, `size`, `min`, `max`, `step`, `precision`, `format`, `valueFormat`, etc.) is unchanged. Parity with the current keys is the requirement (see Open points for the count).

5. **`ElementPlusValueTypes` and `ElementPlusFieldProperties` are exported types.**
   Given the package entry,
   When a consumer writes `import type { ElementPlusValueTypes, ElementPlusFieldProperties }`,
   Then both resolve, and `elementPlusMetadata` is `defineMetadata<ElementPlusValueTypes, ElementPlusFieldProperties, {}, {}>()` (no duplicated inline type bodies).

6. **Convenience type re-exports.**
   Given the package entry,
   When a consumer imports `FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, `MetadataConfiguration`,
   Then all four resolve as type re-exports from `@bach.software/vue-dynamic-form`.

**extendMetadata**

7. **Adding a new type and property.**
   Given `extendMetadata<{ richText: string }, { toolbar?: boolean }>()`,
   When a type-level test inspects the result,
   Then the value types contain all built-in types unchanged plus `richText: string`, and the field properties contain all built-in properties plus `toolbar?: boolean`.

8. **Consumer wins on collision (value types and properties).**
   Given `extendMetadata<{ text: { doc: string } }, { label?: number }>()`,
   When a type-level test inspects the result,
   Then `text` resolves to exactly `{ doc: string }` (not `string & { doc: string }`) and `label` resolves to `number | undefined` (not intersected with `string`), and every other built-in key is unchanged.

9. **Slot and settings properties pass through.**
   Given `extendMetadata<object, object, { tip: string }, { locale: string }>()`,
   When a type-level test inspects the result,
   Then the slot properties contain `tip: string` and the settings properties contain `locale: string`.

10. **The result is usable as the template's configuration.**
    Given an `extendMetadata` result `myMetadata`,
    When passed as `ElementPlusFormTemplate`'s `metadataConfiguration` prop and to `GetMetadataType`/`GetDynamicFormSettingsType`,
    Then `vue-tsc` accepts it, the extended properties and settings are typed in the slots that exist in this story (`#default-input` and the built-in `*-input` slots), and the added type is typed at the metadata level via `GetMetadataType`. The slot-scope assertion for the added type's own slot belongs to the slot-forwarding story.

11. **Type-only at runtime.**
    Given `extendMetadata()` called at runtime,
    When a test inspects the returned object,
    Then it equals what `defineMetadata()` returns (empty stubs) and no merge logic runs; dispatch is unaffected.

**Template prop**

12. **`metadataConfiguration` is optional and defaults to the built-in catalogue.**
    Given `ElementPlusFormTemplate` mounted without the prop, and again with an `extendMetadata` result,
    When each renders,
    Then both mount without error, the no-prop mount uses `elementPlusMetadata`, and the component is generic `TMetadataConfiguration extends MetadataConfiguration = typeof elementPlusMetadata` (verified by a type-level test: the no-prop fixture exposes the built-in properties and rejects `toolbar` with `@ts-expect-error`, and a mounted extended config exposes the extended properties, for example `toolbar`, on the `#default-input` slot scope).

**Test and build tooling**

13. **Component tests can run.**
    Given `packages/element-plus/package.json` and `vite.config.ts`,
    When the story lands,
    Then `jsdom` and `@vue/test-utils` (both `catalog:test`) are in `devDependencies`, the Vitest config uses the `jsdom` environment (plus any setup file needed, including `enableAutoUnmount(afterEach)` like core), and `pnpm --filter ./packages/element-plus run ci:test` passes with real tests once core is built. The CI `test` job in `.github/workflows/quality-assurance.yml` builds the workspace (`pnpm run build`) before running tests, like the `typecheck` job, and `pnpm-lock.yaml` includes the new devDependencies.

14. **The placeholder test is replaced.**
    Given `packages/element-plus/src/ElementPlusDynamicForm.test.ts`,
    When the story lands,
    Then that file is removed/renamed and no test of the form `expect(true).toBe(true)` remains; new tests cover the component mount, `elementPlusMetadata` (runtime shape plus type-level), and `extendMetadata` (criteria 7 to 11).

**Inventory and hygiene**

15. **`specs/components.md` reflects the renamed and new exports.**
    Given the `specs/components.md` entry for this package (currently the `ElementPlusDynamicForm` row under "Non-published surfaces"),
    When the story lands,
    Then the row is updated to `ElementPlusFormTemplate` and lists `elementPlusMetadata`, `extendMetadata`, `ElementPlusValueTypes`, `ElementPlusFieldProperties`, still marked private/non-published (the move out of that section is a later story).

16. **Code hygiene.**
    Given all new source and test files,
    When reviewed,
    Then no comment or test name references specs or process artifacts (FEAT, ST, AC, ADR, finding, decision numbers), there are no em dashes, and Vue identifiers use camelCase; `pnpm run ci:lint`, `ci:typecheck`, and `ci:test` pass for `packages/element-plus`.

### Edge cases
- `extendMetadata` called with no generics returns a configuration equivalent to `elementPlusMetadata` at the type level.
- An extension key that shadows a built-in key with a different shape compiles, since the consumer-wins pairing (supply the matching slot) is the consumer's responsibility and is documented later; no compile-time error is expected.
- Extension value types named `input` or `attributes` are reserved (see the feature's reserved-name caveat). Enforcing this at the type level is not required in this story; the caveat is documented in a later story. If the developer finds a cheap, non-breaking compile-time guard, note it in Implementation notes rather than adding it silently.

### Open points
- DECIDED (research): the requirement is parity with the current catalogue, which is 17 types (15 input controls plus `heading` and `divider`). The "16" in the feature prose is a miscount; nothing is dropped.
  Why: the feature's own Problem section lists 17 types and scopes parity with "what `ElementPlusDynamicForm.vue` already renders today", and decision 5 says parity with the current catalogue. The number was arithmetic, not a scoping decision.
  Sources: `packages/element-plus/src/ElementPlusDynamicForm.vue` (the inline `defineMetadata` value-type keys), the feature's Problem & goal and decision 5

- DECIDED (research): the CI `test` job gets a `pnpm run build` step before "Run Tests with Coverage", exactly like the `typecheck` job already has before `ci:typecheck`. The workflow file `.github/workflows/quality-assurance.yml` is added to this story's Files. `pnpm-lock.yaml` is committed with the two new devDependencies (CI uses `--frozen-lockfile`).
  Why: the new component tests import `@bach.software/vue-dynamic-form`, whose `exports` point at `packages/core/dist`, and the `test` job builds nothing, so the tests would pass locally and fail in CI. A source alias to core is not viable: both Vite configs use the same `@/` alias key, so aliasing the package to core's source makes core's own `@/` imports resolve into element-plus. Of the two build-first options, the workflow step matches the existing `typecheck` job pattern (rung 3), builds once per job, and keeps local test runs fast; the alternative of prepending a core build to each element-plus `ci:test` script rebuilds core on every invocation.
  Alternative: prepend `pnpm --filter @bach.software/vue-dynamic-form run build &&` to the element-plus `ci:test` and `ci:test:coverage` scripts. Reversing either is a local edit (one workflow step or two script prefixes).
  Sources: `.github/workflows/quality-assurance.yml` (`typecheck` job), `packages/element-plus/vite.config.ts` and `packages/core/vite.config.ts` (`@/` alias), `packages/core/package.json` (`exports`)
- DECIDED (research): criteria 10 and 12 are reworded as below so they are testable in this story. Criterion 10: the extended properties and settings are typed in the slots that exist here (`#default-input` and the built-in `*-input` slots), and the added type is typed at the metadata level via `GetMetadataType`; the per-type `richText-input` slot-scope assertion moves to the slot-forwarding story unless the slot typing already exposes it here, in which case it is added here. Criterion 12 keeps the generic-prop requirement (`TMetadataConfiguration extends MetadataConfiguration = typeof elementPlusMetadata`, proven by the no-prop fixture) and asserts extended properties (for example `toolbar`) on the `#default-input` slot scope instead of the added type's own slot.
  Why: per-type slot typing for types outside the built-ins depends on how the slots are declared, which is the slot-forwarding story's work, and that story depends on this one. The QA plan and the review proposed the same rewording; holding this story to a criterion only the next story can satisfy would fail verification for no benefit.
  Sources: `packages/core/src/components/DynamicFormTemplate.vue` (`defineSlots` keyed off `TMetadataConfiguration['fieldTypes']`), the slot-forwarding story's scope

### Out of scope
- Slot-forwarding contract (`input`/`attributes` reserved slots, generic forward): next story.
- Fixing control bindings (`ElUpload` etc.), removing Tailwind classes, building CSS: later stories.
- Any array, choice, or wizard rendering.
- Moving the package entry out of "Non-published surfaces", flipping `private`, and changesets. `packages/core` is untouched. The package stays `private: true`, so no changeset is needed.

## Design reference
No prototype (design skipped for this feature). Visual reference is the official Element Plus documentation; nothing visual changes in this story.

## Architecture reference
Implements seam 1 (foundation half) from the feature architecture: "Component & composable plan", "Public API impact" (`ElementPlusFormTemplate`, `elementPlusMetadata`, `extendMetadata`, `ElementPlusValueTypes`/`ElementPlusFieldProperties`, re-exports), ADR-2 (consumer-wins merge), ADR-3 (optional `metadataConfiguration` prop defaulting to `elementPlusMetadata`).

Files: `packages/element-plus/src/ElementPlusFormTemplate.vue` (renamed), a new module for `elementPlusMetadata`/`extendMetadata`/types (for example `src/metadata.ts`, developer's choice), `src/index.ts`, `package.json` (devDependencies only), `vite.config.ts` (test environment only), `.github/workflows/quality-assurance.yml` (build step in the `test` job), `pnpm-lock.yaml`, tests, `specs/components.md`, and the one-line playground import fix.

Uses `defineMetadata` and `DynamicFormTemplate` from core unchanged. Depends on no other story. All later stories depend on this one.

## QA plan

### Ground rules for this slice

- **Two kinds of test, two different gates.** Runtime assertions (`expect(...)`) are enforced by `pnpm --filter ./packages/element-plus run ci:test`. Compile-time assertions (`expectTypeOf`, `// @ts-expect-error`, typed fixture SFCs) are no-ops at runtime: `ci:test` stays green even when they are wrong. They are only enforced by `pnpm --filter ./packages/element-plus run ci:typecheck` (`vue-tsc --noEmit`). The package `tsconfig.json` includes `src/**/*` and `src/**/*.vue`, so test files and fixtures are type-checked; do not exclude `__tests__` from it. Every type-level criterion below therefore names `ci:typecheck` as its gate, and the verifier runs both commands.
- **Proof that a type test can fail.** For each type-level test file, the verifier does one mutation check during verification (see the manual checklist): break the type under test, confirm `ci:typecheck` goes red, revert.
- **No new test-file suffix.** Type-level tests live in `*.test.ts` files next to their runtime siblings. No `*.test-d.ts` and no Vitest `typecheck` mode are introduced (would be new tooling outside this story).
- **Location and naming.** The package source is flat, so tests go in `packages/element-plus/src/__tests__/`. Setup file `packages/element-plus/src/tests/test-setup.ts` (mirrors core): `enableAutoUnmount(afterEach)`, and registers the Element Plus plugin globally through `config.global.plugins` from `@vue/test-utils`. The latter is required, not optional: the SFC imports the `El*` components as types only, so the template resolves them from global registration, and without the plugin every control renders as an unresolved custom element plus a Vue warning. Exclude `src/tests/**` from coverage like core does. Shared mount helpers go in `src/__tests__/ElementPlusFormTemplate.test-helpers.ts` (core's `*.test-helpers.ts` convention).
- **Test names and comments** describe behaviour ("renders an ElInput bound to the field value"), never spec ids; camelCase for all Vue identifiers; no em dashes.

### Criterion-to-test map

| # | Criterion | Test (file, kind) | Gate |
| --- | --- | --- | --- |
| 1 | Rename, no alias | `index.test.ts` (runtime): `import * as api from '@/index'`; assert `api.ElementPlusFormTemplate` is defined and `Object.keys(api).sort()` equals exactly `['ElementPlusFormTemplate','elementPlusMetadata','extendMetadata']` (an alias or leftover `ElementPlusDynamicForm` fails the exact-set check). Same file, type level: `// @ts-expect-error` on `import type { ElementPlusDynamicForm } from '@/index'`. Source-file rename with preserved history: manual (M2). | `ci:test`, `ci:typecheck`, manual |
| 2 | Rendering preserved (`text`, `select`) | `ElementPlusFormTemplate.logic.test.ts` (runtime, component). Mount `ElementPlusFormTemplate` directly with the attrs the engine would pass (`type: 'text-input'`, a non-empty `fieldMetadata`, a `fieldContext` of `{ value: ref(...), handleChange: vi.fn() }`, `disabled`, `required`, `settings`, `slotProps`). `DynamicFormTemplate` renders nothing unless `fieldMetadata` is truthy, so the fixture must always supply it. Text: `ElInput` found, inner `<input>` value equals the field value, `setValue('x')` calls `handleChange('x')`, changing the ref updates the DOM after `nextTick`. Select: `ElSelect` `modelValue` prop equals the field value, `placeholder`/`multiple`/`clearable`/`filterable` pass through, emitting `update:modelValue` calls `handleChange`. Assert option rendering through `ElOption` only if the options are mounted with the popper closed; otherwise assert through the `ElSelect` props. States in section "Component states". | `ci:test` |
| 2 (breadth) | Rename did not drop a slot | `ElementPlusFormTemplate.logic.test.ts`: `it.each` over all 15 input controls (`text`, `select`, `checkbox`, `radio`, `date`, `time`, `datetime`, `switch`, `number`, `rate`, `slider`, `color`, `cascader`, `transfer`, `upload`), mount `<type>-input` and assert the expected Element Plus component is found and no Vue warning fired (spy on `console.warn`). Plus `heading` and `divider` mounted by their own type: heading renders its label text, divider finds `ElDivider`. The assertion is "renders this control", not "binds correctly", so it stays valid after the binding audit changes `upload`/`transfer`/`cascader`. If a control cannot mount in jsdom (for example a missing `ResizeObserver`), stub the browser API in `test-setup.ts` or stub that one control via `global.stubs`, and record it in Implementation notes. | `ci:test` |
| 2 (engine) | Works under the real engine | `ElementPlusFormTemplate.test.ts` (runtime, integration, one test). A host component calls core's `useDynamicForm()` and renders `DynamicForm` with `:template` set to a wrapper that forwards all its slots to `ElementPlusFormTemplate` (the shape the current playground uses: `h(ElementPlusFormTemplate, null, slots)`); metadata is one `text` and one `select` field. Assert an `ElInput` and `ElSelect` are rendered and that typing in the input lands in the form values. Bare `:template="ElementPlusFormTemplate"` is deliberately not asserted here: the reserved `input` slot that makes it render inputs lands in the next story. That story owns rewriting this wrapper. | `ci:test` |
| 3 | Playground import | Automated part: a verifier grep (M3) finds no `ElementPlusDynamicForm` identifier under `playgrounds/` other than the unchanged file name `ElementPlusDynamicFormImplementation.vue`, and `git diff --stat -- playgrounds` shows only that one file. Build/typecheck part is manual (M3) because the playground is outside the workspace and has no typecheck script. | manual |
| 4 | Catalogue parity | `metadata.test.ts` (type level). Golden types transcribed from `packages/element-plus/src/ElementPlusDynamicForm.vue` as it is at the start of the story (the developer copies them into the test before editing the component). (a) Key parity: `keyof ElementPlusValueTypes` equals exactly the 17 names, and `typeof elementPlusMetadata['fieldTypes'][number]` equals those 17 plus `'default'`. (b) Per key, one `expectTypeOf<typeof elementPlusMetadata['valueTypes'][K]>().toEqualTypeOf<golden>()` for all 17 (`heading` and `divider` are `never`; `radio`, `slider`, `cascader`, `color`, `number`, `switch` have unions that an accidental widening would change). (c) `ElementPlusFieldProperties` `toEqualTypeOf` a golden literal with all 29 current keys (`label` through `showFileList`), so a dropped, renamed, or retyped property fails. (d) `GetMetadataType<typeof elementPlusMetadata>` accepts a field literal using a representative subset (`label`, `options`, `size: 'large'`, `valueFormat`) and rejects a wrong one (`// @ts-expect-error` on `size: 'huge'`). Runtime twin in the same file: `elementPlusMetadata` equals `defineMetadata()` (all empty stubs). Also verify declaration emit (M4): an exported `defineMetadata` result can fail `vue-tsc --emitDeclarationOnly` with "cannot be named" errors, which `--noEmit` does not show. | `ci:typecheck`, `ci:test`, build (M4) |
| 5 | Exported types, no duplicated bodies | `index.test.ts` (type level): `import type { ElementPlusValueTypes, ElementPlusFieldProperties } from '@/index'`; `expectTypeOf(elementPlusMetadata).toEqualTypeOf<ReturnType<typeof defineMetadata<ElementPlusValueTypes, ElementPlusFieldProperties, {}, {}>>>()` (the `{}` needs an `eslint-disable` for the empty-object rule, or the equivalent instantiation with the exact same arguments the source uses). "No duplicated inline bodies" is a review check (M5): exactly one `defineMetadata<` call in `packages/element-plus/src`, taking the two named types. | `ci:typecheck`, review |
| 6 | Convenience re-exports | `index.test.ts` (type level): for each of `FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, `MetadataConfiguration`, `expectTypeOf<FromElementPlus<...>>().toEqualTypeOf<FromCore<...>>()` using one concrete instantiation (for example the `elementPlusMetadata` configuration). `export type` (not value re-export) is enforced by `isolatedModules` in `ci:typecheck`. | `ci:typecheck` |
| 7 | Add a type and a property | `metadata.test.ts` (type level), `const ext = extendMetadata<{ richText: string }, { toolbar?: boolean }>()`. `typeof ext['valueTypes']['richText']` is `string`; each of the 17 built-in keys still `toEqualTypeOf` the same golden as criterion 4 (loop over a shared golden map so the two criteria cannot drift); `fieldTypes[number]` is the 17 plus `'richText'` plus `'default'`; `typeof ext['extendedProperties']['toolbar']` is `boolean | undefined`; a spot check that `label` is still `string | undefined`. | `ci:typecheck` |
| 8 | Consumer wins | `metadata.test.ts` (type level), `extendMetadata<{ text: { doc: string } }, { label?: number }>()`. `valueTypes['text']` `toEqualTypeOf<{ doc: string }>()`; `// @ts-expect-error` on assigning the string `'abc'` to a `valueTypes['text']` variable (under a regression to plain intersection the type would be `string & { doc: string }`, which the exact-equality check above also rejects; the negative line documents the intent); `extendedProperties['label']` `toEqualTypeOf<number | undefined>()`; every other built-in key (16 value types, the 28 other properties) unchanged against the golden map. | `ci:typecheck` |
| 9 | Slot and settings pass-through | `metadata.test.ts` (type level), `extendMetadata<object, object, { tip: string }, { locale: string }>()`. `slotProperties` `toEqualTypeOf<{ tip: string }>()`, `extendedSettingsProperties` `toEqualTypeOf<{ locale: string }>()`. Also assert `elementPlusMetadata` itself has empty (`object`-equivalent) slot and settings properties, since the merge relies on it. | `ci:typecheck` |
| 10 | Usable as template configuration | Fixture `src/__tests__/fixtures/ExtendedMetadataUsage.vue` (type-checked by `vue-tsc` because `src/**/*.vue` is included) plus a mount in `ElementPlusFormTemplate.test.ts`. Fixture: `<ElementPlusFormTemplate :metadataConfiguration="myMetadata">` where `myMetadata = extendMetadata<{ richText: string }, { toolbar?: boolean }, { tip: string }, { locale: string }>()`. It also calls `GetMetadataType<typeof myMetadata>` and `GetDynamicFormSettingsType<typeof myMetadata>`. Inside the `#default-input="s"` slot, typed assertions through a tiny helper such as `expectType<boolean | undefined>(s.fieldMetadata.toolbar)`, `expectType<string>(s.settings.locale)` and `s.slotProps.tip`, each with a neighbouring `<!-- @ts-expect-error -->` negative (a wrong type for the same member). Also a negative fixture line: `<!-- @ts-expect-error -->` on `:metadataConfiguration="{}"`. See Open point "Slot scope for an added type" for the per-type `richText-input` scope. | `ci:typecheck`, `ci:test` (mount) |
| 11 | Type-only at runtime | `metadata.test.ts` (runtime): `expect(extendMetadata()).toEqual(defineMetadata())`; `expect(extendMetadata<{ a: string }>()).toEqual(defineMetadata())` (a runtime merge would populate `fieldTypes`); `fieldTypes` is `[]`; a fresh object per call (`not.toBe`). "Dispatch is unaffected": in `ElementPlusFormTemplate.test.ts`, mounting with an `extendMetadata()` configuration renders the same HTML as the no-prop mount for the same `text-input` attrs. | `ci:test` |
| 12 | Optional prop, defaults to catalogue | `ElementPlusFormTemplate.test.ts` (runtime): no-prop mount does not throw and `wrapper.findComponent(DynamicFormTemplate).props('metadataConfiguration')` is `toBe(elementPlusMetadata)` (reference equality, the only runtime-observable proof of the default); extended mount passes that exact `myMetadata` reference through (`toBe`). Type level: the fixture in criterion 10 has a second element with no `metadataConfiguration` prop, asserting `s.fieldMetadata` carries built-in properties (for example `placeholder`) and a `// @ts-expect-error` on the extended-only `toolbar`, which proves the generic default `typeof elementPlusMetadata`. Watch for the likely trap: a `metadataConfiguration ?? elementPlusMetadata` expression types as a union and blurs the slot scope; the typed fixture exists to catch that. | `ci:test`, `ci:typecheck` |
| 13 | Component tests can run | `ci:test` running at least one mounted-component test is itself the proof. Plus review (M6) of `package.json` (`jsdom` and `@vue/test-utils` as `catalog:test` in `devDependencies`), `vite.config.ts` (`environment: 'jsdom'`, `setupFiles`), and that `pnpm-lock.yaml` is updated (CI installs with `--frozen-lockfile`). The fresh-checkout check (M6) covers the dependency on the built core package (Open point). | `ci:test`, manual |
| 14 | Placeholder gone | Verifier greps (M7): `ElementPlusDynamicForm.test.ts` absent, no `expect(true)` in `packages/element-plus`. New files from this plan cover component mount, `elementPlusMetadata`, `extendMetadata`. | manual (grep) |
| 15 | Inventory | Manual (M8): the `specs/components.md` row reads `ElementPlusFormTemplate`, lists `elementPlusMetadata`, `extendMetadata`, `ElementPlusValueTypes`, `ElementPlusFieldProperties`, and stays under "Non-published surfaces". Not automatable without a doc-lint tool; one-line diff check. | manual |
| 16 | Hygiene | Scripted greps (M9) over `packages/element-plus/src` plus `ci:lint`, `ci:typecheck`, `ci:test`. | `ci:lint`, manual (grep) |

Edge cases from the story: `extendMetadata()` with no generics is covered in `metadata.test.ts` as mutual assignability with `elementPlusMetadata` for each of `valueTypes`, `extendedProperties`, `slotProperties`, `extendedSettingsProperties` (and per-key `toEqualTypeOf` against the golden map). Prefer the per-key form as the authoritative assertion, because `Omit<X, never> & object` may not satisfy a strict `toEqualTypeOf` against `X` even though it is structurally identical. A shadowing key with a different shape (`text`) compiles, covered by criterion 8 itself. Reserved names `input` and `attributes`: no test (explicitly not enforced here); if the developer finds a cheap guard, it gets its own type test in `metadata.test.ts` and an Implementation note.

### Fixtures and utilities

- **Existing, reused:** `enableAutoUnmount` test-setup pattern from `packages/core/src/tests/test-setup.ts`; `useDynamicForm` and `DynamicForm` from `@bach.software/vue-dynamic-form` for the one engine test; `flushPromises` and `mount` from `@vue/test-utils`. The example template in `packages/core/src/examples/` is not reused: it is a hand-written template with no Element Plus controls, so it cannot exercise this component.
- **New:** `src/tests/test-setup.ts` (auto-unmount, global Element Plus plugin, browser API stubs only if a control needs them); `src/__tests__/ElementPlusFormTemplate.test-helpers.ts` (builds the engine attrs object: `type`, `fieldMetadata`, `fieldContext` with a real `ref`, `disabled`, `required`, `settings`, `slotProps`; one `mountInput(type, overrides)` function); `src/__tests__/fixtures/ExtendedMetadataUsage.vue` (typed usage); a shared golden map of the 17 value types and 29 properties used by both criterion 4 and criteria 7/8.

### Component states (this slice)

The feature skipped its design phase and has no states policy, so the state set is derived from what the ported slots bind today. For `text-input` and `select-input`: value present; empty (`undefined` and `''`); disabled through `fieldMetadata.disabled`; disabled through the slot's `disabled` prop; `readonly` (text); `size` pass-through; `placeholder`; select `multiple`, `clearable`, `filterable`, and with zero options. Not in scope for this slice and therefore not asserted: loading, validation error, and required-marker states, because the `ElFormItem` wrapper keeps its current bindings and surfaces no `errorMessage` (error and validation states belong to the slot-forwarding and binding stories). No test may assert the absence of those either.

### Reactivity

Not applicable: this slice does not touch `DynamicFormItem`, `computedProps`, or validation wiring, and the template adds no reactive state, so no `*.analytics.test.ts` is planned and `packages/core` is untouched. The one reactivity-adjacent check is the ref-driven DOM update in the text test (criterion 2).

### Coverage

Baseline for `packages/element-plus` is effectively 0 percent statements (213 statements, 0 covered; the placeholder test imports nothing), so any real test raises it; `packages/core` coverage must be unchanged because `git diff -- packages/core` is empty. The new module with `elementPlusMetadata`/`extendMetadata` is fully covered by `metadata.test.ts`. Knowingly left uncovered in the SFC: the `default` and `default-input` wrapper bodies, and the `checkbox`/`switch` wrapper slots (only reachable through the bare path that the next story enables). The 15 `*-input` slots are covered by the `it.each` smoke, but only for mounting, not for value binding beyond `text` and `select`. Type-only files (`index.ts` re-exports) contribute nothing. Run `pnpm -r ci:test:coverage` under `TZ=Europe/Amsterdam` (the script sets it) and record the before/after numbers in the verification report.

### Time sensitivity

No date or time logic is under test here. `DatePicker`, `TimePicker` are mounted only in the smoke test with no value, so no timezone-dependent assertion exists. All commands run through the scripts that set `TZ=Europe/Amsterdam`.

### Regression risk

- **Touched:** the renamed component, `src/index.ts`, `package.json`, `vite.config.ts`, `pnpm-lock.yaml`, the playground wrapper (one import and one tag), `specs/components.md`. `packages/core` must show no diff.
- **Other stories:** every later story builds on this component, the test setup, and the metadata module, so the setup file, helpers, and golden map are shared infrastructure; later stories will extend the `it.each` smoke and the golden map rather than fork them. The slot-forwarding story will intentionally invalidate the wrapper shape used in the engine test; that is expected and must be recorded as a planned rewrite, not a regression. The binding audit will change `upload`/`transfer`/`cascader` bindings, which is why the smoke asserts mounting only.
- **Existing tests guarding this:** none in `packages/element-plus` (only the removed placeholder). Core's suite guards the engine side; run `pnpm --filter ./packages/core run ci:test` once as a no-regression check even though core is untouched.
- **Build:** the new generic SFC and exported `defineMetadata` results must survive `vue-tsc --emitDeclarationOnly` and `tsc-alias` (M4); `--noEmit` does not prove this.

### Manual verification checklist

- [ ] **M1 Commands green (run from the repo root, not just the package):** `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck` (these run all packages; `pnpm ci` is shadowed by the pnpm builtin), then `pnpm -r ci:test:coverage` and compare element-plus and core numbers with the baseline above.
- [ ] **M2 Rename history:** before the change is committed, `git status --short` shows `R  ...ElementPlusDynamicForm.vue -> ...ElementPlusFormTemplate.vue` (a rename, not delete plus add; Git only detects a rename above roughly 50 percent similarity, so keep content edits in the rename step small). After commit, `git log --follow --oneline -- packages/element-plus/src/ElementPlusFormTemplate.vue` lists the earlier history. `ElementPlusDynamicForm.test.ts` and the old `.vue` are gone.
- [ ] **M3 Playground:** `grep -rn "ElementPlusDynamicForm" playgrounds --include=*.vue --include=*.ts --exclude-dir=node_modules` returns only the unchanged file-name references; `git diff --stat -- playgrounds` shows exactly one file. The playground has no typecheck script, so after `pnpm --filter ./packages/element-plus build`, run `pnpm --prefix playgrounds/storybook build-storybook` (or `pnpm storybook` and open Forms/ElementPlusForm) and confirm the story loads with no new console error compared with the pre-change branch. The existing `field` versus `fieldMetadata` slot bug in that file is deliberately left alone here, so its current label behaviour must be identical to before the change, not fixed.
- [ ] **M4 Build and declarations:** `pnpm --filter ./packages/element-plus run build` succeeds, and `dist/src/index.d.ts` exports `ElementPlusFormTemplate`, `elementPlusMetadata`, `extendMetadata`, `ElementPlusValueTypes`, `ElementPlusFieldProperties`, and the four type re-exports. Note any declaration files emitted for tests or fixtures into `dist`; if they are, record it (not a blocker for this story, since excluding tests from the tsconfig would switch off the type-level tests).
- [ ] **M5 No duplicated type bodies:** exactly one `defineMetadata<` call in `packages/element-plus/src` (excluding tests), using the two named types.
- [ ] **M6 Fresh checkout:** with `packages/core/dist` deleted (or from a clean clone), `pnpm --filter ./packages/element-plus run ci:test` after `pnpm run build`, as the CI `test` job now does. `pnpm install --frozen-lockfile` succeeds with the committed lockfile. `package.json` shows `jsdom` and `@vue/test-utils` as `catalog:test` devDependencies and nothing else changed.
- [ ] **M7 Placeholder gone:** `grep -rn "expect(true)" packages/element-plus/src` is empty and `ls packages/element-plus/src/ElementPlusDynamicForm*` finds nothing.
- [ ] **M8 Inventory:** `git diff -- specs/components.md` shows only the one row replaced, still under "Non-published surfaces".
- [ ] **M9 Hygiene:** `grep -rnE "FEAT-|ST-0|AC[0-9]|ADR|finding|decision [0-9]" packages/element-plus/src` returns nothing; a grep for the em dash character (U+2014) over `packages/element-plus/src` returns nothing; no kebab-case component or prop names in new Vue code (slot names such as `text-input` are the dispatcher's exact strings and are allowed).
- [ ] **M10 Mutation checks (type-level tests can fail):** (1) in the merge, temporarily change `Omit<ElementPlusValueTypes, keyof ExtraValueTypes> & ExtraValueTypes` to a plain intersection and confirm `ci:typecheck` fails on the `text` assertion; (2) temporarily change one golden type (for example `rate: string`) and confirm failure; (3) temporarily make the default generic `MetadataConfiguration` and confirm the no-prop fixture assertion fails. Revert each.

### Findings and proposals on the criteria

- **Criteria 10 and 12 (slot scope for the added type) may be untestable as written in this story.** The component's slot typing comes from how it declares its slots. If it only forwards the existing structural and `*-input` slots, `#richText-input` is not a declared slot on `ElementPlusFormTemplate` until the slot-forwarding story, so a fixture using it would fail to compile. Proposal: in this story assert slot scope typing through the slots that do exist (`#default-input` and the built-in `*-input` slots: extended properties on `fieldMetadata`, `settings`, `slotProps`), plus `GetMetadataType` on the added type at the metadata level (criterion 7). If the developer types the slots from `TMetadataConfiguration` so that `richText-input` exists, add it to the fixture. Otherwise move the per-type slot scope assertion to the slot-forwarding story. See Open point.
- **Criterion 11 "dispatch is unaffected" is vague.** Proposal: replace with "mounting with an `extendMetadata()` configuration renders the same HTML as the no-prop mount for the same attrs" (planned above).
- **Criterion 3 "still typechecks/builds"** has no automated gate because the playground has no typecheck script and sits outside the workspace. Proposal: accept the manual step M3 as the gate for this story.
- **Criterion 13 cannot be fully verified by `ci:test` alone** (see Open point on the built core).

## Adversarial review
Filled by adversarial-reviewer (lite, story level). Findings and resolutions. (Reviewer running as opus.)

Verified against the repo (not just reasoned about): `.github/workflows/quality-assurance.yml`, both package `package.json`/`vite.config.ts`, `pnpm-workspace.yaml` catalog usage, core's `defineMetadata.ts`, `DynamicFormTemplate.vue` dispatch, and `DynamicFormItem.vue` slot passing. The type-level mechanics the QA plan leans on all check out: `defineMetadata` returns exactly `{ fieldTypes, extendedProperties, slotProperties, extendedSettingsProperties, valueTypes }` with `fieldTypes = Object.keys({}) = []` and every other field an empty stub, so criteria 4/5/9/11 reference real property names and the `toEqual(defineMetadata())` runtime twin holds; `valueTypes` auto-injects `default: string`, so the 17-vs-18 key split in criterion 4 is correct; the `Omit<Built-in, keyof Extra> & Extra` merge yields consumer-wins as criteria 7/8 assert; all four convenience re-export types exist in core's `index.ts`; the current inline `defineMetadata` carries exactly 17 value types and 29 property keys, matching criteria 4/7/8. The engine-integration test (criterion 2) is also sound: `DynamicFormItem` renders the template with `type` for the wrapper and nests the `${type}-input` render inside the engine's unnamed `default` slot, so `h(ElementPlusFormTemplate, null, slots)` forwards that `default` into the current component's `<slot name="default">` and the `#text-input`/`#select-input` slots produce `ElInput`/`ElSelect` without needing the ST-02 reserved `input` slot, exactly as the QA plan claims.

1. **BLOCKER (implementability, already tracked as Open point 1) — the new component tests cannot pass in CI as the pipeline stands.** Confirmed in the repo: `packages/element-plus/vite.config.ts` aliases only `@/` to `./src/` and declares no alias for `@bach.software/vue-dynamic-form`, whose `exports` point at `packages/core/dist`. The `test` job in `.github/workflows/quality-assurance.yml` runs `pnpm run ci:test:coverage` with no build step (only the `typecheck` job runs `pnpm run build`), and `pnpm -r ci:test:coverage` builds nothing (core's own `ci:test:coverage` is `vitest run --coverage`). So the first real element-plus test that imports the core package resolves a `dist` that does not exist in the `test` job and fails, even though it passes locally. This directly blocks acceptance criterion 13 ("`ci:test` passes") and manual step M6. I verified the source-alias escape hatch the Open point worries about is genuinely non-viable: both configs use the identical alias key `@/`, so aliasing the package to `packages/core/src` would make core's own `@/...` imports resolve against element-plus's `@/` (to `packages/element-plus/src`) and break. Suggested resolution: see the PROPOSED note appended to Open point 1. This stays a Jeroen decision because the cleanest fix edits a file outside the story's declared scope.
   DECIDED (research): resolved by adding a build step to the CI `test` job, mirroring the `typecheck` job (see Open points).

2. **SHOULD-FIX (already tracked as Open point 2) — criteria 10 and 12 promise a test this story may be unable to write.** Both criteria require the added type's slot scope (`#richText-input`) to be typed from the extended configuration, but per-type slot typing for types outside the built-ins depends on how `ElementPlusFormTemplate` declares its slots, which is ST-02's slot-forwarding work. `DynamicFormTemplate`'s slot map keys per-type slots off `TMetadataConfiguration['fieldTypes'][number]` (confirmed in its `defineSlots`), so IF `ElementPlusFormTemplate` is typed as generic over `TMetadataConfiguration` and re-declares its slots from it, `#richText-input` could type in ST-01; if it only re-exposes the enumerated built-in slots, it cannot until ST-02. As written the criteria are not reliably testable in this story. The QA plan already proposes the fallback (assert via `#default-input` and the built-in `*-input` slots plus `GetMetadataType` at the metadata level, and move the per-type `richText-input` assertion to ST-02 if the slots are not yet typed from the config). Suggested resolution: fold that fallback into the criteria wording so the verifier is not held to the literal "slot scope of the added type" in ST-01. See the PROPOSED note on Open point 2. Note the generic-prop half of criterion 12 (component generic `TMetadataConfiguration extends MetadataConfiguration = typeof elementPlusMetadata`, proven by the no-prop fixture asserting built-in properties and `@ts-expect-error` on `toolbar`) IS deliverable in ST-01 and should stay.
   DECIDED (research): resolved by rewording criteria 10 and 12 (see Open points).

3. **NIT — criterion 3 "still typechecks/builds" has no automated gate.** The playground sits outside the workspace and has no typecheck script, so "typechecks" cannot be asserted by a tool; the manual M3 `build-storybook` (which surfaces compile errors in the one touched file) is the honest proxy. The QA plan's own findings already reduce this to manual M3. No status impact; recorded so the verifier does not invent a nonexistent gate.

Consistency and dependency checks (lite mode): the story does not silently override the approved feature. Scoping slot forwarding, the binding audit, and CSS into later stories matches the scrum-master's documented four-way split of seam 1 (feature Stories section). The 17-vs-16 count is a parity reinterpretation that honors decision 5's substance ("parity with the current catalogue") and is already acknowledged in the feature's own Stories section, so it does not overturn a DECIDED (Jeroen) entry. The `pnpm-lock.yaml` regeneration for `--frozen-lockfile` is correctly captured by criterion 13 and M6, and `catalog:test` does contain both `jsdom` and `@vue/test-utils` (core already consumes them). Dependencies are explicit ("Depends on no other story; all later stories depend on this one").

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

No deviation affects the feature design or architecture, so the feature spec is untouched.

- **Rename without `git mv`.** The interactive session forbids staging, so the file was moved with a plain `mv` (old test file removed with `rm`). Content similarity with the old file is well above the rename threshold (18 lines added, 63 removed of 365), so `git` reports a rename once Jeroen stages it. M2 ("`R` in `git status --short`") can only be confirmed after staging.
- **Slot typing lives in `src/slots.ts` (new, type-only, not exported from the entry).** The component declares its slots with `defineSlots<ElementPlusFormTemplateSlots<TMetadataConfiguration>>()`, deriving each slot's scope from `DynamicFormTemplate` itself. Declaring the type inline made `vue-tsc --emitDeclarationOnly` inline a non-portable `import("node_modules/@bach.software/...")` path into the emitted declaration; the named alias keeps the declaration clean. Only the slots that actually forward in this story are declared: `default`, `default-input`, and `input`. The built-in `*-input` slots are not declared yet because the component still hard-codes them with no override path, so declaring them would promise an override that does not work. The type-level assertions therefore run through `#default-input` (criterion 10 and 12 allow this); the `*-input` slot declarations arrive with the slot-forwarding story.
- **The `default-input` and `default` scopes for an extended configuration are typed, the fallback markup is not.** The inner `DynamicFormTemplate` receives `(props.metadataConfiguration ?? elementPlusMetadata) as typeof elementPlusMetadata` so the existing built-in bindings keep their exact types; the generic only widens what consumers see. This avoids the union trap noted in the QA plan.
- **Template-side negative assertions use `<!-- @vue-expect-error -->`, not `@ts-expect-error`.** `vue-tsc` only honours the former inside templates. The fixture helpers take one concrete type each (`asString`, `asNumber`, ...) instead of a generic `expectType<T>()` because `<` and `|` inside a mustache trip the `vue/space-infix-ops` and `vue/no-deprecated-filter` lint rules.
- **`metadata.ts` has two `defineMetadata<` calls**, not one: the catalogue (taking the two named types) and the one inside `extendMetadata`, which is the architected merge. M5 is satisfied for the catalogue; `extendMetadata` necessarily calls it too.
- **`ElementPlusValueTypes` and `ElementPlusFieldProperties` are interfaces**, not type aliases (lint rule `ts/consistent-type-definitions`). The golden types in `__tests__/metadata.golden.ts` are independent interfaces, and the tests compare them structurally per key.
- **Golden comparison is per key through `KeyByKeyEquality`/`AllTrue`** (one assertion per catalogue) instead of 17 separate `expectTypeOf` lines, so criteria 4, 7, and 8 share one map and cannot drift.
- **Tests that needed a workaround:** the reference check on `props('metadataConfiguration')` compares through `toRaw` because `mount` wraps passed props in a reactive proxy; the default (module constant) needs no unwrapping. The HTML-equality test strips `tabindex="-1"` because Element Plus marks only the first mounted `ElInput` wrapper with it (unrelated to the configuration). All 15 controls mount in jsdom without stubs, so `test-setup.ts` has no browser API stubs.
- **Hyphenation lint.** New Vue code uses `:metadataConfiguration` (camelCase per project convention), which the repo's `vue/attribute-hyphenation` rule reports as 3 warnings (0 errors) in `ci:lint`. `eslint --fix` would rewrite them to kebab-case. Left as warnings; adding `packages/element-plus/**/*.vue` to the rule override in the root `eslint.config.js` is Jeroen's call (root config is outside this story's Files).
- **Declarations for tests and fixtures are emitted into `dist/src/__tests__`** by the package build (M4 note). Not a blocker; excluding them would switch off the type-level tests in `ci:typecheck`.
- **Edge case, reserved names (`input`, `attributes`):** no cheap compile-time guard found that does not break the `Record<string, any>` constraint, so none was added.
- **Pre-existing catalogue defect kept for parity:** `ElementPlusFieldProperties.type` (date picker kind) intersects with `FieldMetadata.type` (the field type), so a field literal with `type: 'select'` or `type: 'text'` and this property bag only accepts `'date' | 'datetime'`. Tests avoid `type` in field literals. Worth a follow-up story; not fixed here because the requirement is exact parity.
- **Files touched beyond the listed ones:** `src/slots.ts`, `src/tests/test-setup.ts`, and `src/__tests__/metadata.golden.ts` (shared golden map, per the QA plan's shared infrastructure).
- **Coverage (element-plus):** 0 of 213 statements before, now 100 percent statements/branches/functions/lines for `ElementPlusFormTemplate.vue`, `index.ts`, and `metadata.ts` (`slots.ts` is type-only, reported 0/0). `packages/core` is untouched: 97.57 / 92.61 / 97.14 statements/branches/functions, all 686 tests green.

## Verification report
Filled by qa-verifier after implementation. Verified independently; the developer's report was not trusted.

**Verdict: pass-with-notes.**

### Commands (run from the repo root; `pnpm ci` is shadowed by the builtin)

| Check | Result |
| --- | --- |
| `pnpm run ci:test` | Pass. core 27 files / 686 tests; element-plus 4 files / 58 tests. |
| `pnpm run ci:lint` | Pass: 0 errors, 3 `vue/attribute-hyphenation` warnings (see notes). |
| `pnpm run ci:typecheck` | Pass for core and element-plus (`vue-tsc --noEmit`, includes the type-level tests and the fixture). |
| `pnpm -r ci:test:coverage` | Pass. element-plus: 0 of 213 statements before, now 100 / 100 / 100 / 100 (statements, branches, functions, lines) for `ElementPlusFormTemplate.vue`, `index.ts`, `metadata.ts`; `slots.ts` is type-only (0/0). core: 97.57 statements / 92.59 branches / 97.14 functions; `git diff -- packages/core` is empty, so the 0.02 point branch difference against the developer's 92.61 is run-to-run noise, not a regression. |
| `pnpm --filter ./packages/element-plus run build` (M4) | Pass. `dist/src/index.d.ts` exports the component, `elementPlusMetadata`, `extendMetadata`, both types, and the four type re-exports; no `node_modules` paths in the emitted declarations; `ElementPlusFormTemplate.vue.d.ts` keeps the generic default `typeof elementPlusMetadata`. Test and fixture declarations are emitted into `dist/src/__tests__` (expected, noted by the developer). |
| `pnpm install --frozen-lockfile --lockfile-only` | "Already up to date", lockfile checksum unchanged. |
| Fresh checkout (M6) | With `packages/core/dist` moved away, element-plus `ci:test` fails; after `pnpm run build` (what the CI `test` job now does) it passes 58/58. The build-first dependency is real and the workflow step fixes it. |
| Storybook build (M3) | `storybook build` (output to a scratch dir) succeeds and emits `ElementPlusForm.stories`. Not opened in a browser, so the "no new console error" part of M3 is not verified. |
| `docs/` | Untouched, `docs:build` not needed. |

### Acceptance criteria

| # | Result | Evidence |
| --- | --- | --- |
| 1 | Pass (history part pending staging) | `index.test.ts` "exports the template, the metadata, and the extension function under their final names" asserts the exact key set `['ElementPlusFormTemplate','elementPlusMetadata','extendMetadata']`; the `// @ts-expect-error` on the `ElementPlusDynamicForm` import is honoured by `ci:typecheck`. File is `src/ElementPlusFormTemplate.vue`; old `.vue` and `.test.ts` are gone (`ls src`). The rename was done without `git mv` (see notes): numstat against the old file is +18/-63 of 365 lines, well above the detection threshold. |
| 2 | Pass | `ElementPlusFormTemplate.logic.test.ts`: text input (bound value, `handleChange`, ref-driven DOM update, empty `undefined`/`''`, placeholder/readonly/size/clearable, disabled via metadata and via slot prop) and select (modelValue, multiple/clearable/filterable/placeholder/size, `update:modelValue` to `handleChange`, zero options, both disabled paths); `it.each` over all 15 controls with a Vue-warn spy, heading and divider. Engine integration in `ElementPlusFormTemplate.test.ts` "under the engine": `ElInput` and `ElSelect` render and typing lands in `values.name`. Body diff against the old SFC shows only the script header and the `defineSlots`/prop lines changed, so rendering is preserved. |
| 3 | Pass | `git diff --stat -- playgrounds` is that one file, 3 lines (import, open tag, close tag). No `ElementPlusDynamicForm` identifier under `playgrounds/`, `docs/`, `packages/` except the unchanged `...Implementation` file name and the intentional negative test. Storybook builds. |
| 4 | Pass | `metadata.test.ts`: key parity (17 keys plus `'default'`), per-key golden equality via `KeyByKeyEquality`/`AllTrue`, `ElementPlusFieldProperties` `toEqualTypeOf` the 29-key golden, `GetMetadataType` accepts `size: 'large'` and rejects `size: 'huge'`; runtime twin `toEqual(defineMetadata())`. Mutation 2 below proves the golden check bites. |
| 5 | Pass | `index.test.ts` "builds the metadata from the two exported types" (`toEqualTypeOf<ReturnType<typeof defineMetadata<ElementPlusValueTypes, ElementPlusFieldProperties, {}, {}>>>`). One catalogue `defineMetadata<` call taking the two named types (`metadata.ts:58`); the second call (`metadata.ts:72`) is inside `extendMetadata`, which is the designed merge. |
| 6 | Pass | `index.test.ts` "re-exports the convenience types from the core package" (four `toEqualTypeOf` against core's types); `export type` enforced by the clean typecheck and the emitted `index.d.ts`. |
| 7 | Pass | `metadata.test.ts` "adding a type and a property": `richText: string`, `fieldTypes[number]` is built-ins plus `'richText'` plus `'default'`, `toolbar` is `boolean \| undefined`, all built-ins and properties unchanged. |
| 8 | Pass | `metadata.test.ts` "when the consumer redefines a built-in key": `text` is exactly `{ doc: string }` (plus `@ts-expect-error` on assigning `'abc'`), `label` is `number \| undefined`, every other key unchanged. Mutations 1 and 4 prove both the value-type and the property merge are guarded. |
| 9 | Pass | `metadata.test.ts` "passes slot and settings properties through" (`{ tip: string }`, `{ locale: string }`); "starts without slot or settings properties" asserts `{}` on `elementPlusMetadata`. |
| 10 | Pass (reworded scope) | Fixture `__tests__/fixtures/ExtendedMetadataUsage.vue`, type-checked by `vue-tsc`: `:metadataConfiguration="myMetadata"` accepted, `GetMetadataType`/`GetDynamicFormSettingsType` exported, `#default-input` scope asserts `toolbar`, `settings.locale`, `slotProps.tip` with `@vue-expect-error` negatives; `:metadataConfiguration="{}"` is rejected. The fixture is mounted in `ElementPlusFormTemplate.test.ts`. Only `default`, `default-input`, and `input` are declared slots, which the reworded criterion allows ("the slots that exist in this story"). |
| 11 | Pass | `metadata.test.ts` "at runtime" (`extendMetadata()` and `extendMetadata<{a:string}>()` both `toEqual(defineMetadata())`, `fieldTypes` `[]`, fresh object per call); `ElementPlusFormTemplate.test.ts` "renders the same output for an extended configuration as for the default" (strips only the Element Plus `tabindex="-1"` focus marker, which is unrelated to configuration). |
| 12 | Pass | "defaults to the built-in catalogue when the prop is omitted" (`props('metadataConfiguration')` `toBe(elementPlusMetadata)`), "hands a given configuration through" (`toBe(myMetadata)` via `toRaw`), and the second fixture element with no prop asserting `placeholder` and a `@vue-expect-error` on `toolbar`. Mutation 3 (default generic set to `MetadataConfiguration`) turns `ci:typecheck` red on exactly that line. |
| 13 | Pass | `package.json` has `@vue/test-utils` and `jsdom` as `catalog:test` devDependencies and nothing else changed; `vite.config.ts` sets `environment: 'jsdom'`, `setupFiles: ['./src/tests/test-setup.ts']` (`enableAutoUnmount(afterEach)` plus the Element Plus plugin) and excludes `src/tests/**` from coverage; lockfile has both entries for the element-plus importer and `--frozen-lockfile` is satisfied; `quality-assurance.yml` `test` job gains `Run Build` (`pnpm run build`) between install and tests, mirroring the `typecheck` job. |
| 14 | Pass | `ElementPlusDynamicForm.test.ts` absent; `grep "expect(true)"` over `packages/element-plus/src` is empty; new tests cover the mount, `elementPlusMetadata`, and `extendMetadata`. |
| 15 | Pass | `git diff -- specs/components.md` is the single row replaced, still under "Non-published surfaces", listing `ElementPlusFormTemplate`, `elementPlusMetadata`, `extendMetadata`, `ElementPlusValueTypes`, `ElementPlusFieldProperties`, package still private. |
| 16 | Pass | Greps over `packages/element-plus/src` for `FEAT-\|ST-0\|AC[0-9]\|ADR\|finding\|decision [0-9]\|QA plan` and for U+2014 return nothing; Vue identifiers are camelCase (`metadataConfiguration`; slot names such as `default-input` are the dispatcher's exact strings); `ci:lint`, `ci:typecheck`, `ci:test` pass. |

### Edge cases

- `extendMetadata()` without generics: covered by `metadata.test.ts` "is equivalent to the built-in catalogue without generics" (per-key equality plus mutual assignability for slot and settings properties). Pass.
- Shadowing key with a different shape compiles: covered by criterion 8 itself. Pass.
- Reserved names `input`/`attributes`: not enforced, developer reports no cheap non-breaking guard. Acceptable per the story (recorded in Implementation notes).

### Mutation checks (each reverted and confirmed byte-identical with `cmp`; final `ci:typecheck` is green)

1. Value-type merge changed to a plain intersection: `ci:typecheck` fails at `metadata.test.ts(94)` (`text` no longer `{ doc: string }`).
2. Golden `rate: number` changed to `string`: fails at four `KeyByKeyEquality` assertions (`metadata.test.ts` lines 23, 71, 106, 124).
3. Component generic default changed to `MetadataConfiguration`: fails in `ExtendedMetadataUsage.vue(40)` (`placeholder` missing on the no-prop scope).
4. Extra: property merge changed to a plain intersection: fails at `metadata.test.ts(102)` (`label` no longer `number \| undefined`).

### Prototype comparison

No prototype (design skipped for this feature); nothing visual changes in this story. No sibling stories exist yet to drift from.

### Compliance

- No `packages/core` change (empty `git diff`, no untracked files), package stays `private: true`, so no changeset is required. Correct.
- `specs/components.md` updated; CI workflow step added; lockfile updated; placeholder removed; hygiene greps clean.
- No silent deviations from the DECIDED entries: the CI build step, the 17-type parity, and the reworded criteria 10 and 12 were all followed. Deviations listed in Implementation notes were reviewed and none contradicts the approved feature design.

### Judgement on the developer's listed deviations

- **Only `default`, `default-input`, `input` declared in `slots.ts`: accepted.** The per-type `*-input` slots are hard-coded with no override path in this story, so declaring them would advertise an override that does not work. Confirmed with a throwaway probe (deleted): `<template #text-input>` on `ElementPlusFormTemplate` is now a vue-tsc error ("Property 'text-input' does not exist"), which is accurate until the slot-forwarding story declares them. Criterion 10's reworded text permits this. Not a regression: before this story those slots were not overridable either.
- **Rename without `git mv`: accepted with a process note.** Content similarity is high (+18/-63 of 365), so git will report a rename once both paths are staged together. Jeroen should stage the old and new paths in the same `git add` so the rename (and `git log --follow` history) is preserved. M2 cannot be confirmed until staging.
- **`type` property intersection defect kept for parity: follow-up, not a failure.** Verified as real: with `GetMetadataType<typeof elementPlusMetadata>`, `{ name: 'a', type: 'text' }` fails with "Type '"text"' is not assignable to type '"date" | "datetime" | undefined'". Cause: the date-picker kind `type` in `ElementPlusFieldProperties` intersects with core's field `type`. The story's criterion 4 explicitly requires the property bag "unchanged" and the tests pin it, so failing the story would contradict the approved criteria. But it makes the newly public `elementPlusMetadata` typing hostile for typed consumers, so it must be resolved (rename the property, for example to `pickerType`, or otherwise) before the publish flip. Recommend Jeroen records it as an open question on FEAT-004 and assigns it to ST-03 or a dedicated story; it is currently in no story. **Resolved after verification:** single-control properties now live in per-field-type groups, so the date picker mode is `date: { type }` and no longer collides with the field `type` (see FEAT-004 `elementPlusMetadata`).

### Notes for Jeroen

- `ci:lint` reports 3 `vue/attribute-hyphenation` warnings for `:metadataConfiguration` (`ElementPlusFormTemplate.vue:44`, `ExtendedMetadataUsage.vue:24` and `:47`). The old file used `:metadata-configuration`; camelCase follows the project rule, and `docs/` already disables the rule. Decide whether to extend the override in the root `eslint.config.js` to `packages/element-plus/**/*.vue` (outside this story's files); do not run `eslint --fix`, which would revert to kebab-case.
- The adversarial review section of this spec contains em dashes (written by another phase); the implementation code, tests, and comments contain none.
- PR link: please add the PR to the `pr:` frontmatter field. This is not the feature's last open story (ST-02 to ST-10 remain), so FEAT-004 stays `in-progress`.
