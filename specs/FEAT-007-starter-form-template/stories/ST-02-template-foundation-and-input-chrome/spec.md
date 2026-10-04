---
id: ST-02
type: story
feature: FEAT-007
status: done
approved_by: Jeroen
pr: ""
---

# Story: Template foundation, metadata catalogue, and input/field chrome

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen individually. Override any of these freely.

- Blocker 1 → `extendMetadata` Omit-and-merges all four generics (value types, field properties, slot properties, settings properties), not just the first two; the approved feature's own Public API table already names all four for this merge

## Functional

### User story

As a library consumer installing `@bach.software/vue-dynamic-form-starter`, I want `StarterFormTemplate` to render plain input fields (text, select, checkbox/switch, password) fully styled with no Tailwind build step, so I can start using the package for simple forms immediately.

As a template author, I want to type my forms and slots against `starterMetadata`, and to layer my own field types on top with `extendMetadata`, so I don't have to hand-redeclare the built-in catalogue.

As a template author wanting a custom icon, I want the `#icon` slot I supply on my wrapper component to replace every glyph the template renders, including the password show/hide toggle, so one override covers the whole template.

### Acceptance criteria

1. **`StarterFormTemplate` wraps `DynamicFormTemplate` with the documented generic prop.** Given `StarterFormTemplate` mounted with no `metadataConfiguration` prop, when it renders, then it uses `starterMetadata` by default, and the component is generic over `TMetadataConfiguration extends MetadataConfiguration = typeof starterMetadata`.
2. **`starterMetadata` carries the catalogue lifted verbatim from `AdvancedFormTemplate.vue`.** Given `starterMetadata`, when a type-level test inspects `GetMetadataType<typeof starterMetadata>`, then `StarterValueTypes` (`wizardSummaryPage: never; heading: never; text: string; select: string; checkbox: boolean | undefined; password: string`) and `StarterFieldProperties` (the full list in the feature's Public API table, with `iconName: StarterIconName` not `AppIconName`) match exactly, and `StarterSlotProperties`/`StarterSettingsProperties` match the feature's Public API table.
3. **`extendMetadata` merges consumer types with the built-in catalogue, consumer wins, across all four generics.** Given `extendMetadata<{ richText: string }, { toolbar?: boolean }, { mySlot?: unknown }, { mySetting?: unknown }>()`, when a type-level test inspects the result, then all built-in value types, field properties, slot properties (`gotoStep`), and settings properties (`showRequiredOrOptional`) are unchanged except where shadowed, `richText`/`toolbar`/`mySlot`/`mySetting` are added, and a shadowed built-in key resolves to exactly the consumer's shape (not an intersection). The merge shape is `Omit<Starter*, keyof Extra*> & Extra*` applied independently to each of the four generics.

   > **DECIDED (research) - resolves blocker 1.** `extendMetadata` Omit-and-merges **all four** generics, not just value types and field properties. `packages/element-plus`'s `extendMetadata` passes `ExtraSlotProperties`/`ExtraSettingsProperties` straight through without merging, which is only correct because its built-in `ElementPlusSlotProperties`/`ElementPlusSettingsProperties` generics are empty (`{}`). Starter's are **not** empty (`StarterSlotProperties = { gotoStep?: ... }`, `StarterSettingsProperties = { showRequiredOrOptional?: ... }`, confirmed in `AdvancedFormTemplate.vue`'s `defineMetadata` call). A verbatim mirror of element-plus's code would drop `gotoStep` and `showRequiredOrOptional` from the typed result of every `extendMetadata` call. This is not a new design call: the feature's own Public API table already lists all four generics for `extendMetadata` with "Omit-and-merge shape ... consumer wins on collision," which only coheres if all four are actually merged; "same shape as element-plus" in that same table describes the general Omit-and-merge technique, not a literal instruction to leave non-empty generics unmerged. Resolving the ambiguity this way fulfills the already-approved Public API row rather than contradicting it.
4. **`metadataConfiguration` accepts an `extendMetadata` result.** Given `StarterFormTemplate` mounted with an `extendMetadata` result as `metadataConfiguration`, when it renders, then `vue-tsc` accepts it and the extended properties are typed on the `#default-input` slot scope.
5. **Text, select, and heading render through the ported chrome.** Given `StarterFormTemplate` mounted with a `text` field, a `select` field, and a `heading` field, when rendered, then `TextInput`/`SelectInput`/`FormField` produce the `sft-field`, `sft-input`/`sft-select`, `sft-field-label`, `sft-field-desc`, `sft-tag-optional`/`sft-tag-required`, and `sft-error` classes exactly as the Component/pattern mapping table lists, with no Tailwind class present.
6. **Checkbox renders as the `ToggleSwitch` via the `checkbox`/`checkbox-input` slots.** Given a `checkbox` field, when rendered, then the `checkbox-input` slot (confirmed wired in `AdvancedFormTemplate.vue`, corrected should-fix 5) produces `sft-switch`/`sft-switch-track`/`sft-switch-thumb` with the `is-on` modifier reflecting the bound value, and toggling it calls the field's change handler.
7. **Password field shows the strength bar and the show/hide toggle routed through `StarterIcon`.** Given a `password` field with `showStrengthBar: true`, when rendered, then `PasswordStrengthBar` renders `sft-strength`/`-track`/`-seg`/`-label` with the correct tier modifier for the current value, and the show/hide button renders a `StarterIcon` with `name="eye"` or `name="eyeOff"` (Lucide glyphs, per the Jeroen-decided change in Decision B), not an inline Heroicons SVG.
8. **The optional/required tag and error message follow the one states policy.** Given fields with and without validation errors, and required vs optional fields, when rendered, then `OptionalRequiredTag` reflects `settings.showRequiredOrOptional` and `ErrorMessage` renders `sft-error` only when a validation message is present (no green/valid styling, matching the feature's states policy).
9. **The `#icon` slot, supplied on a wrapper around `StarterFormTemplate`, replaces every glyph in this slice's chrome.** Given a wrapper component that renders `<StarterFormTemplate><template #icon="{ name, size, strokeWidth }">...custom...</template></StarterFormTemplate>` passed as `DynamicForm`'s `:template`, when a password field's show/hide icon renders, then the custom render output appears instead of the Lucide default, proving `StarterFormTemplate` provides `$slots.icon` under the internal key from ST-01 and `StarterIcon` picks it up end to end.
10. **The `#icon` slot is unreachable through the bare `:template="StarterFormTemplate"` usage.** Given `<DynamicForm :template="StarterFormTemplate">` with a `#icon` slot supplied directly (no wrapper), when a password field renders, then the Lucide default still renders (the slot never reaches the per-node template instance), confirming the documented wrapper-only reachability (research-decided clarification).
11. **Convenience type re-exports.** Given the package entry, when a consumer imports `FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, `MetadataConfiguration`, then all four resolve as type re-exports from `@bach.software/vue-dynamic-form`.
12. **No Tailwind classes, no `<style scoped>`, classes exist in the shipped stylesheet.** Given all `.vue` files ported in this story (`StarterFormTemplate`, `FormField`, `TextInput`, `SelectInput`, `CheckboxField`, `ToggleSwitch`, `PasswordInput`, `PasswordStrengthBar`, `OptionalRequiredTag`, `ErrorMessage`, `AppButton`), when scanned, then none contains a Tailwind utility class or a `<style scoped>` block, and every `sft-`/`is-*` class referenced exists in ST-01's stylesheet.
13. **`specs/components.md` entry is extended.** Given the entry ST-01 created, when this story lands, then it additionally lists `StarterFormTemplate`, `starterMetadata`, `extendMetadata`, `StarterValueTypes`, `StarterFieldProperties`.
14. **Code hygiene.** Given all new/changed files, when reviewed, then no spec/process references, no em dashes, camelCase Vue identifiers, and `pnpm run ci:lint`, `ci:typecheck`, `ci:test` pass for `packages/starter`.

### Edge cases

- `extendMetadata()` with no generics is equivalent to `starterMetadata` at the type level (no runtime merge), across all four generics (**DECIDED (research), see blocker 1**: this holds because `extendMetadata` Omit-and-merges `StarterSlotProperties`/`StarterSettingsProperties` too, not just value types and field properties). The type-level equivalence test must compare all four generics.
- A password field with `showStrengthBar` omitted or `false`: no strength bar renders, no error.
- An `iconName` value outside the registry on a field that doesn't yet render icons in this slice (choice cards come later): not applicable here, no assertion needed.

### Out of scope

- Arrays, groups, choices, wizard, review, success chrome: later stories.
- Dogfooding, Storybook, package README, publish flip.

## Design reference

[`../../prototype.html#buttons`](../../prototype.html#buttons), [`#text-field`](../../prototype.html#text-field), [`#select-field`](../../prototype.html#select-field), [`#switch-field`](../../prototype.html#switch-field), [`#password-field`](../../prototype.html#password-field). The password section's Lucide eye icon (not the prototype's original Heroicons path, per the Jeroen-decided change in Decision B) is the one deliberate delta the developer must apply when porting; the prototype's HTML for that one glyph is a reference for layout only, not the exact SVG.

## Architecture reference

Implements the foundation half of slicing seam 2 ("Port the chrome + `StarterFormTemplate`"), sub-split by structural shape as the architecture invites: this story covers the **inputs/fields** shape. Builds: `StarterFormTemplate.vue` (the single exported template, `defineMetadata` call lifted from `AdvancedFormTemplate.vue`), `starterMetadata`/`extendMetadata` (Component/pattern mapping and Public API sections), the icon provide side of ADR 3 (producer; ST-01 built the consumer), and the ported chrome: `FormField`, `TextInput`, `SelectInput`, `CheckboxField`, `ToggleSwitch`, `PasswordInput`, `PasswordStrengthBar`, `OptionalRequiredTag`, `ErrorMessage`, `AppButton`. Wires the slot families confirmed in the research-decided correction to should-fix 5: `default`, `default-input`, `heading`, `checkbox`, `checkbox-input`, `select-input`, `password-input`.

Files: `packages/starter/src/StarterFormTemplate.vue`, `src/metadata.ts` (`starterMetadata`/`extendMetadata`/types), `src/FormField.vue`, `src/TextInput.vue`, `src/SelectInput.vue`, `src/CheckboxField.vue`, `src/ToggleSwitch.vue`, `src/PasswordInput.vue`, `src/PasswordStrengthBar.vue`, `src/OptionalRequiredTag.vue`, `src/ErrorMessage.vue`, `src/AppButton.vue`, `src/index.ts`, tests, `specs/components.md`.

Depends on ST-01 (stylesheet, `StarterIcon`, the icon-override key). ST-03, ST-04, ST-05 all depend on this story for the template shell, the metadata catalogue, and the icon-provide wiring. No changeset: no `packages/core/src/` change; package stays private.

## QA plan

Mirrors `packages/element-plus/src/__tests__` conventions (`mountInForm`/`createConsumerWrapper`/`renderCount` fixtures, `metadata.golden.ts` type-equality helpers, the `sourceScan` helper ST-01 already ported to `packages/starter`). All new tests live in `packages/starter/src/__tests__/`. No `TZ`-sensitive behaviour in this slice; `Europe/Amsterdam` only matters because `ci:test:coverage` sets it globally.

### Fixtures and test utilities

- New: `fixtures/metadata.ts` - `textMetadata`, `selectMetadata`, `headingMetadata`, `checkboxMetadata`, `passwordMetadata` field trees for `starterMetadata`, modeled on element-plus's `fixtures/metadata.ts`.
- New: `fixtures/mountInForm.ts` - adapted from element-plus's, mounts `StarterFormTemplate` (bare or wrapped) inside `DynamicForm`/`useDynamicForm`, returns `wrapper`, `values()`, `validate()`.
- New: `fixtures/createConsumerWrapper.ts` - adapted from element-plus's render-function wrapper; extended with an `icon` override slot so AC9/AC10 can supply `#icon` on the wrapper without hand-writing a `defineComponent` per test.
- New: `fixtures/renderCount.ts` - direct copy, reads the `data-testid="<path>-analytics-render-count"` element.
- New: `metadata.golden.ts` - golden `StarterValueTypes`/`StarterFieldProperties` type fixtures plus the `KeyByKeyEquality`/`AllTrue` helpers, copied from element-plus's.
- Reused from ST-01: `StarterIcon`, `src/icons.ts` (registry + the internal icon-override `Symbol`), `helpers/sourceScan.ts`. This story must not duplicate or re-declare any of them.
- No `packages/core/src/examples/` fixture needed: field-tree fixtures are small and local, matching the element-plus precedent.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 `StarterFormTemplate` wraps `DynamicFormTemplate`, generic default `starterMetadata` | Mount with no `metadataConfiguration` prop, assert a `text` field renders through the default catalogue; a type-level test asserts the component's default generic argument resolves to `typeof starterMetadata` | `StarterFormTemplate.bare.logic.test.ts` |
| 2 `starterMetadata` matches the catalogue exactly | Golden-type equality tests for `StarterValueTypes`/`StarterFieldProperties`/`StarterSlotProperties`/`StarterSettingsProperties` against `metadata.golden.ts`, including the `iconName: StarterIconName` (not `AppIconName`) check | `metadata.test.ts` |
| 3 `extendMetadata` merges, consumer wins, across all four generics | Mirrors element-plus's `extendMetadata` describe block for value types and field properties (adding a type/property, redefining a built-in key, no-generics equivalence, runtime empty-stub checks), plus a starter-specific assertion (**DECIDED (research), see blocker 1**) that a consumer `extendMetadata<{...}, {...}, { mySlot?: X }, { mySetting?: Y }>()` result still carries the built-in `gotoStep` slot prop and `showRequiredOrOptional` setting alongside the consumer additions, since element-plus's own describe block cannot cover this (its built-in slot/settings generics are empty). | `metadata.test.ts` |
| 4 `metadataConfiguration` accepts an `extendMetadata` result, extended props typed on `#default-input` | Mount `StarterFormTemplate` with an `extendMetadata<{...}>()` result as `metadataConfiguration` and a field using the extended property, assert it renders and the value reaches the slot; `expectTypeOf` on the `#default-input` scope type. `vue-tsc` acceptance is a manual/CI check (see Untestable criteria) | `StarterFormTemplate.overrides.logic.test.ts` |
| 5 Text/select/heading render through ported chrome, exact classes, no Tailwind | Mount text/select/heading fields, assert `sft-field`, `sft-input`/`sft-select`, `sft-field-label`, `sft-field-desc`, `sft-tag-optional`/`sft-tag-required`, `sft-error` appear exactly per the Component/pattern mapping table | `StarterFormTemplate.test.ts` |
| 5 (no Tailwind, all ported files) | Source scan of all 11 `.vue` files this story ships for Tailwind utility-class patterns, reusing ST-01's `utilityPatterns` regex set | `noTailwind.test.ts` |
| 6 Checkbox via `checkbox`/`checkbox-input` renders `ToggleSwitch`, `sft-switch*`, `is-on`, toggle calls change handler | Mount a `checkbox` field, assert `sft-switch`/`sft-switch-track`/`sft-switch-thumb`, `is-on` present only when checked, click toggles and fires `handleChange` with the new value (including `falseAsUndefined`) | `StarterFormTemplate.checkbox.logic.test.ts` |
| 7 Password: strength bar tiers + show/hide via `StarterIcon` eye/eyeOff | Mount a `password` field with `showStrengthBar: true`, type values producing each tier, assert `sft-strength`/`-track`/`-seg`/`-label` and the tier modifier class; click the toggle button, assert `StarterIcon` receives `name="eye"` then `name="eyeOff"` (via `findComponent(StarterIcon)`, not SVG path inspection) | `StarterFormTemplate.password.logic.test.ts` |
| 8 `OptionalRequiredTag` + `ErrorMessage` follow the states policy | Matrix of required/optional x with/without error, assert `sft-tag-required`/`sft-tag-optional` per `settings.showRequiredOrOptional`, `sft-error` present only with a vee-validate error message, and no valid/success class ever appears on a filled, error-free field | `StarterFormTemplate.validation.test.ts` |
| 9 `#icon` slot on a wrapper replaces every glyph (password toggle) | Mount via `createConsumerWrapper({ icon: ... })` wrapping `StarterFormTemplate`, assert the custom render output appears in place of the Lucide `Eye`/`EyeOff` on the password toggle | `StarterFormTemplate.icon.logic.test.ts` |
| 10 `#icon` unreachable through bare `:template` usage | Mount `DynamicForm` with `:template="StarterFormTemplate"` and an `#icon` slot supplied directly on `DynamicForm` (no wrapper), assert the Lucide default still renders on the password toggle | `StarterFormTemplate.icon.logic.test.ts` |
| 11 Convenience type re-exports | Mirrors element-plus's `index.test.ts`: `expectTypeOf` equality of `FieldMetadata`/`GetMetadataType`/`GetDynamicFormSettingsType`/`MetadataConfiguration` re-exports against the core originals, plus an exact `Object.keys(api)` snapshot | `index.test.ts` |
| 12 No Tailwind / no `<style scoped>` / classes exist in ST-01's stylesheet | `noTailwind.test.ts` (above); `<style scoped>` scan across the 11 ported files; a new reverse-direction check that every `sft-`/`is-*` class literal referenced in these files' templates exists as a selector in ST-01's `src/style.css` (catches a typo'd class the component uses that the stylesheet never defines, the opposite direction from ST-01's own prototype-parity test) | `noScopedStyle.test.ts`, `classUsage.test.ts` |
| 13 `specs/components.md` entry extended | Manual verification: reviewer confirms the existing ST-01 row/section now also lists `StarterFormTemplate`, `starterMetadata`, `extendMetadata`, `StarterValueTypes`, `StarterFieldProperties` | Manual |
| 14 Code hygiene | Reuses element-plus/ST-01's `sourceHygiene.test.ts` pattern, scope extended to every file this story adds | `sourceHygiene.test.ts` |

### Edge cases to tests

- `extendMetadata()` with no generics equivalent to `starterMetadata` at the type level: covered in `metadata.test.ts` (mirrors element-plus's "is equivalent to the built-in catalogue without generics").
- Password field with `showStrengthBar` omitted or `false`: assert no `sft-strength` block renders and no error is thrown, in `StarterFormTemplate.password.logic.test.ts`.
- `iconName` outside the registry on a field that doesn't render icons yet: explicitly no test, per the story's own framing (choice cards land in ST-04).

### States from the feature's states policy applicable to this slice

For every input chrome component (`TextInput`, `SelectInput`, `ToggleSwitch`, `PasswordInput`):
- **pristine**: no error, resting border, no `sft-error` rendered.
- **invalid**: a vee-validate error present, `sft-error` renders the message, the input's error-border modifier class is present.
- **disabled**: `fieldMetadata.disabled` or the slot's `disabled` forwards to the control's `disabled` attribute and the field wrapper's dimmed-opacity class; asserted in `StarterFormTemplate.disabled.logic.test.ts` (ported from element-plus's file of the same name).
- **focus**: a pure `:focus`/`:focus-visible` CSS pseudo-class effect with no component-side class toggling; not meaningfully assertable in jsdom beyond "the rule exists in the stylesheet", which ST-01's stylesheet tests already cover. No new component test; flagged as a manual/visual check below.
- **valid (deliberately no success state)**: a filled, error-free field must never carry a green/valid class; asserted as a negative check in `StarterFormTemplate.validation.test.ts`.
- **password strength tiers**: `empty`, `weak`, `fair`, `good`, `strong`, each asserted against `PasswordStrengthBar`'s tier modifier class and segment count in `StarterFormTemplate.password.logic.test.ts`.

### Reactivity / analytics

This slice wires `DynamicFormItem`-rendered fields for the first time in this package (text, select, checkbox, password), so render-count coverage is required, not optional. `StarterFormTemplate.analytics.test.ts` mirrors element-plus's `ElementPlusFormTemplate.analytics.test.ts` shape: mount a two-field form (`settings: { analytics: true }`), assert each field renders exactly once after mount, then type into one field and assert the sibling field's render count does not change (no cross-field re-render regression) for each of text/select/checkbox/password. The checkbox's `falseAsUndefined` branch and the password's internal `showPassword` ref are local component state, not `computedProps`, so they get logic-test coverage (above) rather than analytics coverage; analytics coverage is reserved for the engine-driven re-render surface.

### Coverage

`packages/starter` is a new package (own baseline per ST-01); `pnpm -r ci:test:coverage` must still pass workspace-wide. Every ported `.vue` file in this story gets direct coverage through the AC-to-test map above, with one deliberate gap called out: `AppButton`'s `danger` remove-button path is only reachable through `FormField`'s `canRemoveItems` prop, which nothing in this story's scope sets to `true` (array wiring is ST-03). To avoid leaving `AppButton`'s variant classes uncovered until ST-03 lands, this story adds a standalone `AppButton.test.ts` that mounts all five variants (`default`, `primary`, `danger`, `danger-light`, `ghost`) directly and asserts the matching `sft-btn-*` class and disabled/label/slot behaviour, independent of `FormField`'s wiring.

### Regression risk

- ST-01's `StarterIcon` and `src/style.css` are consumed, not modified; ST-01's own suite (`pnpm --filter ./packages/starter run ci:test`) stays the regression guard for those. This story's tests import `StarterIcon` directly rather than re-implementing icon rendering, so a future ST-01 change surfaces here as a real failure, not a silent divergence.
- `packages/element-plus` is untouched by this story; its own suite is unaffected and is not re-run as part of this story's gate.
- `StarterFormTemplate.logic.test.ts` asserts the exact wired slot family (`default`, `default-input`, `heading`, `checkbox`, `checkbox-input`, `select-input`, `password-input`) against the Architecture reference's list, so a missing or misnamed slot is caught here rather than surfacing downstream in ST-03/ST-04/ST-05 as "my array/choice/wizard chrome silently doesn't render."
- Core engine behaviour (`DynamicFormItem`, validation wiring, `computedProps`) is untouched; `packages/core`'s own suite remains its regression guard. This story's `.analytics.test.ts` only proves the template layer doesn't introduce extra renders, it does not re-test the engine's own render-count guarantees.

### Untestable criteria and rewrite proposals

- **AC1 and AC4's `vue-tsc` acceptance clauses** ("the component is generic over `TMetadataConfiguration`", "`vue-tsc` accepts it") are type-level claims a unit test can only partially prove (via `expectTypeOf`); full `vue-tsc` acceptance is a compiler run, not a test-suite assertion. Propose narrowing both to "a type-level test (`expectTypeOf`) proves the generic default and the extended-property typing, and the CI run for this story's PR shows `ci:typecheck` green for `packages/starter`" so the compiler-level half maps to a reviewable CI artifact rather than an unwritten test, mirroring ST-01's AC5 treatment.
- **AC13** (`specs/components.md` entry) is a documentation-content check; kept as a manual checklist item, no code-level test asserts prose content.
- **The "focus" state** in AC8's states policy has no component-side behaviour to assert (it is CSS-only); narrowed to a manual/visual check (see below) rather than invented as a fake unit test.
- All other criteria are testable as written; no rewrite needed.

### Manual verification checklist

1. Run `pnpm --filter ./packages/starter run ci:typecheck` and confirm it is green, covering the `vue-tsc`-acceptance half of AC1 and AC4.
2. Open `specs/components.md`, confirm the ST-01 row/section now additionally lists `StarterFormTemplate`, `starterMetadata`, `extendMetadata`, `StarterValueTypes`, `StarterFieldProperties` (AC13).
3. Visually inspect the text/select/password input focus ring (3px sky, 3px rose when invalid) in a throwaway local mount, both light and dark, since jsdom cannot meaningfully assert `:focus-visible` rendering (AC8's focus state).
4. Visually compare the password strength bar's five tiers and the eye/eyeOff toggle glyph against `prototype.html#password-field` (noting the deliberate Lucide-eye delta from the prototype's original Heroicons path) in both color modes.

## Adversarial review

Story-mode (lite) review: blockers only. Claims checked against `packages/element-plus/src/metadata.ts` and `index.ts` (the `extendMetadata` precedent and the four core type re-exports, both confirmed present and matching AC3/AC11), `docs/.vitepress/theme/components/AdvancedFormTemplate.vue` (the lifted `defineMetadata` generics, confirmed), the feature spec's DECIDED entries (document-root theme scope, `checkbox-input` slot wiring, wrapper-only `#icon` reachability, Lucide password toggle), and ST-01's shipped class/variable/icon-registry contract (consumed, not duplicated, no drift). AC-to-test coverage is otherwise complete and the ST-01 dependency is consumed correctly.

1. **[blocker] Resolved (research): `extendMetadata` Omit-and-merges all four generics, see AC3.** `extendMetadata` cannot be a verbatim mirror of element-plus's code: it would silently drop the built-in `gotoStep` slot prop and `showRequiredOrOptional` setting. AC3 and the no-generics edge case both say starter's `extendMetadata` mirrors `packages/element-plus`'s. But element-plus's `extendMetadata` (confirmed in `packages/element-plus/src/metadata.ts`) Omit-and-merges only the value-types and field-properties generics; it passes `ExtraSlotProperties`/`ExtraSettingsProperties` straight through unmerged. That is correct **only** because element-plus's built-in slot/settings generics are empty (`defineMetadata<..., {}, {}>()`). Starter's are not: `AdvancedFormTemplate.vue`'s `defineMetadata` call carries `{ gotoStep?: ... }` and `{ showRequiredOrOptional?: ... }` as its third and fourth generics (confirmed). A verbatim mirror therefore produces, for every `extendMetadata` call, a result whose slot properties are exactly the consumer's (empty if none given) with `gotoStep` dropped, and whose settings are exactly the consumer's with `showRequiredOrOptional` dropped. Two concrete consequences: (a) the AC2-edge-case claim "`extendMetadata()` with no generics is equivalent to `starterMetadata` at the type level" is false as implemented, and (b) any consumer who extends the catalogue loses wizard-slot and settings typing. QA row 3 as written ("passing slot/settings properties through") only checks that consumer additions appear, never that the built-ins survive, so no test would catch the regression except the equivalence edge case, which the "mirror element-plus" instruction directly contradicts. Resolved by research in AC3, the edge case, and QA row 3: `extendMetadata` Omit-and-merges all four generics (`Omit<StarterSlotProperties, keyof ExtraSlotProperties> & ExtraSlotProperties` and the same for settings), which matches the feature Public API table's own "Omit-and-merge shape ... consumer wins on collision" wording for all four listed generics; "same shape as element-plus" in that table describes the general technique, not a literal instruction to leave non-empty generics unmerged, so this fulfills rather than contradicts the already-approved Public API row. No product call was needed.

## Implementation notes

Built `StarterFormTemplate.vue`, `metadata.ts` (`starterMetadata`/`extendMetadata`/`StarterValueTypes`/`StarterFieldProperties`/`StarterSlotProperties`/`StarterSettingsProperties`), and the ten chrome components (`FormField`, `TextInput`, `SelectInput`, `CheckboxField`, `ToggleSwitch`, `PasswordInput`, `PasswordStrengthBar`, `OptionalRequiredTag`, `ErrorMessage`, `AppButton`), each ported from `docs/.vitepress/theme/components/` with Tailwind swapped for the `sft-`/`is-*` classes ST-01 already shipped, verified class-by-class against `prototype.html`'s `#buttons`/`#text-field`/`#select-field`/`#switch-field`/`#password-field` sections. `StarterFormTemplate` mirrors `ElementPlusFormTemplate`'s override-forwarding architecture (each wired slot is `<slot :name="..." v-bind="s"><built-in fallback /></slot>`, with an `input` escape hatch inside the chrome slots so a wrapper can replace just the control), captures its own `#icon` slot and provides it under ST-01's internal key, and exports the public surface from `src/index.ts`.

Deviations, recorded here per CLAUDE.md:

1. **`#default`'s override check is gated behind an `input` slot, not checked directly against the slot name `default`.** The engine's `DynamicFormItem` always gives every per-node template instance an actual unnamed (`default`) slot carrying its own content (the recursed children or the nested `-input` dispatch); checking `slots.default` directly to decide whether a consumer overrode the chrome would therefore always be true, even in bare usage, and the built-in `FormField` chrome would never render. `ElementPlusFormTemplate` already solves this the same way (gate on `slots.input`, only ever set by a wrapper); `#heading` and `#checkbox` have no such collision since the engine never uses those names itself, so they check their own slot name directly. Not a deviation from any written criterion, just the mechanism `chromeSlotName` needed to implement the override model the Functional overview and AC4/AC9 require.
2. **`ToggleSwitch` is a `role="switch"` element with click/keyboard handlers, not a native `<input type="checkbox">` wrapped by a label.** The source's version drove its visual state through Tailwind's `peer-checked:` pseudo-class, which the `is-on` Vue-bound modifier class replaces (per the Design's own "state is expressed with `is-*` modifier classes ... never by toggling between two unrelated class strings" rule). The stylesheet's selectors are already `.sft-switch.is-on ...` (Vue-driven), not `:checked`-driven, so a hidden native checkbox would need a new, undocumented visually-hidden-input class the stylesheet doesn't ship. The `role="switch"`/`aria-checked`/`tabindex` combination matches `prototype.html#switch-field`'s own markup exactly (no `<input>` inside `.sft-switch` there either) and preserves the native `change`/`blur` event contract (`handleChange`/`handleBlur`), including `falseAsUndefined`.
3. **`TextInput` and `SelectInput` now declare `dataTestid` as an explicit prop bound to a literal `:data-testid`, instead of leaving it to `$attrs` forwarding.** The ported source relied on `v-bind="$attrs"` to carry `dataTestid` onto the native element; verified empirically that Vue sets this as the literal camelCase attribute name (`datatestid`, no hyphen) rather than `data-testid`, because `dataTestid` is not a DOM-recognized property Vue special-cases. This is a latent bug in the docs source that would make every `[data-testid="<path>-input"]` selector this story's (and any future consumer's) tests rely on silently fail to match. `PasswordInput`, `ToggleSwitch`, `CheckboxField`, `FormField`, `ErrorMessage`, and `AppButton` already declared `dataTestid` as an explicit prop bound to a literal `:data-testid`, so only these two needed the fix.
4. **Password's `showStrengthBar` gate changed from `!== false` (shows unless explicitly disabled) to the metadata property's own truthiness (shows only when explicitly `true`).** The story's own edge case ("`showStrengthBar` omitted or `false`: no strength bar renders") requires omitted and `false` to behave identically, which only holds with a direct truthiness check; the ported source's `!== false` check would show the bar by default when omitted, contradicting the edge case. The story's text, not the source, wins here since it is this story's own approved acceptance surface.
5. **`#heading`'s fallback chrome is `FormField`, not a dedicated card component.** This slice's component list does not include `GroupField`/`SectionCard` (ST-03's job); the `heading` metadata type's fixture used in tests (`headingMetadata`) is a parent node with children, so its only job in this slice is to prove the recursive `default`/`heading` dispatch renders label, description, error, and nested children. Reusing `FormField` (producing exactly the `sft-field`/`sft-field-label`/`sft-field-desc`/`sft-error` classes AC5 lists) is a deliberate interim choice, not a new component; ST-03's own text ("the recursive `default`/`heading` dispatch already wired in ST-02") treats this file's `#default`/`#heading` blocks as the ones later stories extend, not replace wholesale.
6. **`PasswordStrengthBar`'s `empty`-tier branch (`strength` computed returning `'empty'`, and the `labelClass`/`segmentClass` empty-tier case) is unreachable and left uncovered.** The component's own `<div v-if="password">` wrapper means the computed `strength`/`config`/`labelClass` are only ever evaluated when `password` is already truthy, so the internal `if (!val) return 'empty'` check (and the two downstream empty-tier ternary branches) can never execute through the component's own render path. This is inherited structure from the ported source (`docs/.vitepress/theme/components/PasswordStrengthBar.vue` has the identical shape), not a regression; flagged rather than silently left, per the Coverage section's own pattern of calling out `AppButton`'s remove-button gap explicitly.
7. **`FormField`'s `canRemoveItems`/remove-button branch stays uncovered in this story**, exactly as the QA plan's Coverage section anticipates: it is only reachable through array wiring (ST-03), and `AppButton.test.ts` independently covers every variant class `AppButton` itself can render.
8. **`specs/components.md`'s row is extended, not duplicated**, adding `StarterFormTemplate`/`starterMetadata`/`extendMetadata`/`StarterValueTypes`/`StarterFieldProperties` to the export list and appending prose about the wired slot family, the override model, the two visible deltas from the ported source (`ToggleSwitch`'s markup, `PasswordInput`'s Lucide eye/eyeOff), and the `data-testid` fix, on top of ST-01's existing icon/stylesheet prose.

No deviation here affects the approved feature design or architecture; all are either the mechanism needed to satisfy an already-written criterion, a correction of a latent bug in the ported source, or a documented, deliberately out-of-scope gap the story's own text already anticipates.

9. **Fix for the qa-verifier's Finding 1 (password input/blur wiring untested).** Added two tests to `StarterFormTemplate.password.logic.test.ts`: one types into the rendered password input via `setValue` (first a weak value, then a strong one) and asserts both the bound form value and the live strength-tier class update, exercising `onInput` end to end; one isolates `handleBlur` by setting `validateOnValueUpdate: false` / `validateOnBlur: true` on a required empty password field and asserts `sft-error` only appears after the input is blurred. `PasswordInput.vue` now reaches 100% statement/branch/function/line coverage; the two previously-disclosed gaps (`FormField`'s remove-button branch, `PasswordStrengthBar`'s empty-tier branch) are unchanged and remain the only real gaps in the package.

## Verification report

### Pipeline checks

- `pnpm run ci:test` (`pnpm -r ci:test`): all 3 workspace packages pass. `packages/core` 686 tests, `packages/element-plus` 480 tests, `packages/starter` 268 tests across 29 files. Confirmed independently (not just trusting the developer's numbers): same counts reproduced.
- `pnpm run ci:lint`: clean for all 3 packages (confirmed independently).
- `pnpm run ci:typecheck`: clean for all 3 packages (confirmed independently).
- `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`): `packages/starter` reports 98.99% statements / 95.74% branch / 72.72% functions / 98.99% lines, matching the developer's reported numbers exactly. Inspecting `coverage-final.json`'s per-function hit counts directly (not just the summary percentages) surfaced a **third, undisclosed gap** beyond the two the developer documented: see Finding 1 below. `packages/core` and `packages/element-plus` coverage is unchanged, so no workspace-level drop.
- `docs/` untouched by this story; `pnpm docs:build` not required.
- No visual/UI screenshot required: headless component change in a private, not-yet-dogfooded package, consistent with ST-01's same reasoning.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1 `StarterFormTemplate` wraps `DynamicFormTemplate`, generic default `starterMetadata` | Pass | `StarterFormTemplate.bare.logic.test.ts`; `ci:typecheck` green. |
| 2 `starterMetadata` matches the catalogue exactly | Pass | `metadata.test.ts`, including the `iconName: StarterIconName` check. |
| 3 `extendMetadata` merges, consumer wins, across all four generics | Pass | `metadata.test.ts`'s `extendMetadata` describe block; `src/metadata.ts` inspected directly, `Omit<Starter*, keyof Extra*> & Extra*` applied to all four generics; the `gotoStep`/`showRequiredOrOptional` survival assertions and the all-four-generics no-generics-equivalence test both pass. |
| 4 `metadataConfiguration` accepts an `extendMetadata` result, extended props typed on `#default-input` | Pass | `StarterFormTemplate.overrides.logic.test.ts`; `ci:typecheck` green. |
| 5 Text/select/heading render through ported chrome, exact classes, no Tailwind | Pass | `StarterFormTemplate.test.ts`; `noTailwind.test.ts`. |
| 6 Checkbox via `checkbox`/`checkbox-input` renders `ToggleSwitch`, `sft-switch*`, `is-on`, toggle calls change handler | Pass | `StarterFormTemplate.checkbox.logic.test.ts`; value propagation to the form is actually asserted (`values().subscribe`). |
| 7 Password: strength bar tiers + show/hide via `StarterIcon` eye/eyeOff | Fail | `StarterFormTemplate.password.logic.test.ts` proves the tier classes and the eye/eyeOff icon swap, but does so via `initialValues` and a toggle click, never by typing into the field. The `password-input` slot's `@input="s.fieldContext.handleChange"` / `@blur="s.fieldContext.handleBlur"` wiring in `StarterFormTemplate.vue` is never exercised by any test in the suite. See Finding 1. |
| 8 `OptionalRequiredTag` + `ErrorMessage` follow the states policy | Pass | `StarterFormTemplate.validation.test.ts` (text and checkbox cases). |
| 9 `#icon` slot on a wrapper replaces every glyph (password toggle) | Pass | `StarterFormTemplate.icon.logic.test.ts`. |
| 10 `#icon` unreachable through bare `:template` usage | Pass | `StarterFormTemplate.icon.logic.test.ts`. |
| 11 Convenience type re-exports | Pass | `index.test.ts`; `src/index.ts` exports exactly the ADR 4 list, no extra surface. |
| 12 No Tailwind / no `<style scoped>` / classes exist in ST-01's stylesheet | Pass | `noTailwind.test.ts`, `noScopedStyle.test.ts`, `classUsage.test.ts`. |
| 13 `specs/components.md` entry extended | Pass | `specs/components.md`'s `packages/starter/` row extended additively, lists the five new exports plus accurate prose on the slot family, override model, and the three deviations. |
| 14 Code hygiene | Pass | `sourceHygiene.test.ts`; `ci:lint`/`ci:typecheck`/`ci:test` all green. |

Edge cases: `extendMetadata()` no-generics equivalence and `showStrengthBar` omitted/false both pass. `iconName` outside the registry correctly out of scope per the story's own framing.

### Finding 1 (blocker): the password field's input/blur wiring is untested, and the gap is undisclosed

`PasswordInput.vue` is the only ported input control that declares its own explicit `emit('input', ...)` / `emit('blur', ...)` handlers (`TextInput`/`SelectInput` rely on plain `$attrs` forwarding instead, so they have no equivalent standalone functions to miss). `StarterFormTemplate.vue`'s `password-input` slot wires those emits straight to `s.fieldContext.handleChange` / `s.fieldContext.handleBlur`, the actual integration point between the password control and vee-validate.

Checking `coverage-final.json`'s `fnMap`/`f` counts directly (not just the rolled-up percentage) shows `PasswordInput.vue`'s `onInput` and `onBlur` handlers at 0 hits across the entire suite (function coverage 33.33%, i.e. only the toggle's `onClick` is covered). Grepping every test file in `packages/starter` for a `setValue`/`trigger('input')`/`trigger('blur')` against a password field turns up none: `StarterFormTemplate.password.logic.test.ts` seeds each tier via `initialValues` rather than typing, and `PasswordInput.test.ts` only asserts `data-testid` wiring. `StarterFormTemplate.validation.test.ts` and `.analytics.test.ts` exercise typing/blur only on text/checkbox fields, never password.

This means nothing in the suite proves that typing into a rendered password field, or blurring it, actually updates the bound form value or triggers vee-validate's touched/validation flow, the most basic behavior AC7 and the states policy depend on. It also directly contradicts QA plan row 7's own test design ("type values producing each tier"), which the implemented test does not do. The Implementation notes and Verification report both state "every other new file is 100% across all four metrics except the two documented gaps" (`FormField`'s remove button, `PasswordStrengthBar`'s empty tier); that claim is inaccurate; this third gap exists, is real (not structurally unreachable like the other two), and was not disclosed.

**Required fix:** add a test that types into the password input (e.g. `wrapper.find('input.sft-input').setValue(...)`) and asserts both that the bound value updates (`values().password`) and that the strength tier reacts live to the typed value, plus a blur assertion consistent with the sibling field types' coverage. Re-run `pnpm -r ci:test:coverage` afterward and confirm `PasswordInput.vue` reaches 100% function coverage (or document a new, narrower, genuinely-unreachable gap if one remains).

### Process compliance (otherwise clean)

- `specs/components.md`: updated additively, accurate. No changeset: confirmed `git diff --stat packages/core/src` is empty, `packages/starter` stays `private: true`. Library API surface matches ADR 4 exactly (`src/index.ts` inspected directly). No new undocumented exports, camelCase throughout, slot-only override channel used.
- The recorded deviations (chrome-slot-name gating on `input`, `ToggleSwitch`'s `role="switch"` markup, the `dataTestid`/`data-testid` fix on `TextInput`/`SelectInput`, `showStrengthBar`'s truthiness change, `#heading`'s `FormField` fallback, the two disclosed coverage gaps) were each checked against the story/architecture text and are reasonable, well-justified, and don't narrow scope or silently override a feature-level decision.

### Manual verification still outstanding (Jeroen), once Finding 1 is fixed

1. Visually compare the text/select/password input focus ring and the password strength bar's five tiers and eye/eyeOff toggle against `prototype.html#password-field` etc. in both color modes (jsdom cannot assert `:focus-visible`).
2. Confirm `specs/components.md`'s extended row reads well in context.

### Overall verdict: fail

One blocker (Finding 1): the password field's core input/blur-to-form wiring is completely untested, and the coverage gap behind it was not disclosed alongside the two gaps that were. Everything else, including the extendMetadata four-generic merge (AC3), the Lucide eye/eyeOff icon routing (AC7's icon half), and the `#icon` wrapper-only reachability (AC9/AC10), passes with solid evidence. Sending back to `implementing` for the developer to add the missing test (and fix the behavior if the test exposes a real bug) before re-verification.

## Verification report (attempt 2)

### Pipeline checks

- `pnpm run ci:lint`: clean across `packages/core`, `packages/starter`, `packages/element-plus`.
- `pnpm run ci:typecheck`: clean across all three packages.
- `pnpm run ci:test` (`pnpm -r ci:test`): `packages/core` 686 tests (27 files), `packages/starter` 270 tests (29 files, up from 268 across the same 29 files, the two new password tests), `packages/element-plus` 480 tests (32 files). All pass.
- `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`): `packages/starter` now reports 98.99% statements / 95.95% branch / 90.9% functions / 98.99% lines, up from the prior attempt's 98.99 / 95.74 / 72.72 / 98.99. No metric dropped anywhere in the workspace; `packages/core` and `packages/element-plus` are untouched by this story and their coverage is unchanged.
- Verified the fix directly against the raw `coverage/coverage-final.json`, not just the summary table: `PasswordInput.vue`'s `fnMap`/`f` now show all three functions hit (`onInput` 2 hits, `onBlur` 1 hit, `onClick` 1 hit), and the file's row is 100/100/100/100. The two previously-disclosed gaps are unchanged and confirmed still real: `FormField.vue`'s single function (the `canRemoveItems` remove-button click handler) is still 0 hits (only reachable through ST-03's array wiring, out of this story's scope), and `PasswordStrengthBar.vue`'s `segmentClass` function is hit (28 times) but its branch coverage still shows the structurally-unreachable empty-tier branch (lines 12-14, 50), exactly as Deviation 6 describes.
- Read `StarterFormTemplate.password.logic.test.ts` directly: the new "typing into the field updates the bound value and the strength tier reacts live" test calls `input.setValue('abc')` then `setValue('Abcdefg1!')` and asserts both `values().password` and the live `.sft-strength-label.is-*` class; the new "blurring an empty required field triggers validation" test sets `validateOnValueUpdate: false` / `validateOnBlur: true`, triggers `blur` on the rendered input, and asserts `.sft-error` only appears afterward. Both exercise the actual `password-input` slot wiring (`@input`/`@blur` to `fieldContext.handleChange`/`handleBlur`), not a substitute.
- `docs/` untouched by this story; `pnpm docs:build` not required. No visual/UI screenshot required (headless, private, not-yet-dogfooded package).

### Acceptance criteria (full re-check)

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1 | Pass | `StarterFormTemplate.bare.logic.test.ts`; `ci:typecheck` green. |
| 2 | Pass | `metadata.test.ts`. |
| 3 | Pass | `metadata.test.ts`'s `extendMetadata` describe block; `src/metadata.ts` Omit-and-merge confirmed across all four generics. |
| 4 | Pass | `StarterFormTemplate.overrides.logic.test.ts`; `ci:typecheck` green. |
| 5 | Pass | `StarterFormTemplate.test.ts`; `noTailwind.test.ts`. |
| 6 | Pass | `StarterFormTemplate.checkbox.logic.test.ts`. |
| 7 | Pass (was fail) | `StarterFormTemplate.password.logic.test.ts` now covers tier rendering, the eye/eyeOff `StarterIcon` swap, and (new) live typing via `setValue` plus a blur-triggered validation error, closing Finding 1. `PasswordInput.vue` confirmed 100% function coverage via `coverage-final.json`. |
| 8 | Pass | `StarterFormTemplate.validation.test.ts`. |
| 9 | Pass | `StarterFormTemplate.icon.logic.test.ts`. |
| 10 | Pass | `StarterFormTemplate.icon.logic.test.ts`. |
| 11 | Pass | `index.test.ts`; `src/index.ts` exports exactly the ADR 4 list. |
| 12 | Pass | `noTailwind.test.ts`, `noScopedStyle.test.ts`, `classUsage.test.ts`. |
| 13 | Pass | `specs/components.md`'s `packages/starter/` row carries the five new exports and accurate prose. |
| 14 | Pass | `sourceHygiene.test.ts`; no spec/process references or em dashes found in the new test file or `PasswordInput.vue`; `ci:lint`/`ci:typecheck`/`ci:test` all green. |

Edge cases: `extendMetadata()` no-generics equivalence and `showStrengthBar` omitted/false both still pass. `iconName` outside the registry correctly out of scope.

### Prototype comparison

No change from the prior attempt's review; the fix is test-only plus the implementation-notes entry, no rendering or markup changed. The `#password-field` tier/icon rendering still matches `prototype.html` per the prior attempt's manual-check list (still outstanding for Jeroen, unchanged below).

### Process compliance

- `specs/components.md`: unchanged from the prior attempt's accurate state, still additive, still matches ADR 4's export list.
- No changeset needed: `packages/core/src/` untouched, `packages/starter` stays `private: true`.
- Deviation 9 (new, in Implementation notes) is a faithful, narrowly-scoped record of the fix: adds exactly the two tests it describes, correctly states `PasswordInput.vue` now reaches 100% across all four metrics (confirmed independently above), and correctly states the other two disclosed gaps are unchanged. No new undocumented deviation, no scope narrowing, no silent override of any feature-level decision.

### Manual verification still outstanding (Jeroen)

1. Visually compare the text/select/password input focus ring and the password strength bar's five tiers and eye/eyeOff toggle against `prototype.html#password-field` etc. in both color modes (jsdom cannot assert `:focus-visible`).
2. Confirm `specs/components.md`'s extended row reads well in context.

### Overall verdict: pass

Finding 1 is closed: the password field's input/blur-to-form wiring is now tested end to end, and `PasswordInput.vue` reaches 100% statement/branch/function/line coverage, confirmed against the raw `coverage-final.json` function hit counts, not just the summary. Every acceptance criterion passes with evidence, the full pipeline (`ci:lint`, `ci:typecheck`, `ci:test`) is clean, and workspace coverage did not drop anywhere, with `packages/starter`'s own function coverage rising from 72.72% to 90.9%. The two remaining coverage gaps (`FormField`'s remove-button branch, `PasswordStrengthBar`'s empty-tier branch) are the same ones already disclosed and justified as out-of-scope/structurally-unreachable in the prior attempt; nothing new or undisclosed was found on this full re-pass. Status set to `done`. This story was depended on by ST-03, ST-04, ST-05, ST-06, and ST-07, none of which are reported done yet, so FEAT-007 stays `in-progress`, not ready to move to `done`.

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field once it exists.
