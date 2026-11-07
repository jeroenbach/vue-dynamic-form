---
id: ST-01
type: story
feature: FEAT-014
status: done
approved_by: Jeroen
pr: ""
---

# Story: HTML5 text-mode field types and the `number` bounds property

## Functional
### User story
As a metadata author building a form with `@bach.software/vue-dynamic-form-starter`, I want to declare `number`, `email`, `tel`, `url`, `date`, `time`, and `datetime-local` field types directly in my metadata, with native numeric bounds (`min`/`max`/`step`) available on `number`, so that users get the right mobile keyboard and native browser affordance without me first going through `extendMetadata`.

### Acceptance criteria

1. **The seven types compile and render with no `extendMetadata` step.**
   Given a metadata node `{ name: 'age', type: 'number', fieldOptions: { label: 'Age' } }` (and the equivalent for `email`, `tel`, `url`, `date`, `time`, `datetime-local`) typed against the default `starterMetadata` catalogue,
   When the project is type-checked and the form renders,
   Then it compiles with no `extendMetadata` wrapper, and the field renders a native `<input>` whose `type` attribute matches the declared type, dispatched through the existing `default-input` slot (`TextInput`).

2. **`StarterValueTypes` gains the seven entries, all stored as `string`.**
   Given `packages/starter/src/metadata.ts`'s `StarterValueTypes` interface,
   When it is inspected,
   Then it declares `number: string`, `email: string`, `tel: string`, `url: string`, `date: string`, `time: string`, `'datetime-local': string` (the last key quoted for the hyphen), none mapped to a `number`/`Date` type.

3. **Model stays a string for every mode, including `number`.**
   Given a `number`-typed field whose native input fires an `input` event,
   When `#default-input`'s `@input` handler runs,
   Then it calls `handleChange` with the raw event string (`($event.target as HTMLInputElement).value`), never `valueAsNumber`/`valueAsDate`, so `typeof value === 'string'` after entry, matching today's `text`-type guard.

4. **`number` group property forwards native bounds on both `TextInput` branches.**
   Given `StarterFieldProperties` gains an optional `number?: { min?: number, max?: number, step?: number }` group, and a `number`-typed field with `number: { min: 0, max: 50, step: 5 }`,
   When `#default-input` renders either the `sft-input-suffix-row` branch or the plain branch,
   Then both bind `:min="s.fieldMetadata.number?.min"`, `:max="s.fieldMetadata.number?.max"`, `:step="s.fieldMetadata.number?.step"` onto `TextInput`, which forwards them to the native `<input>`'s `min`/`max`/`step` attributes via its existing `$attrs` passthrough, with no change to `TextInput.vue` itself.

5. **`number` bounds are harmless on every other type.**
   Given a non-`number` field (e.g. `text`, `email`),
   When it renders,
   Then `s.fieldMetadata.number` is `undefined`, so `:min`/`:max`/`:step` resolve to `undefined`, and Vue omits the attribute entirely (no stray `min="undefined"` in the DOM).

6. **Existing `xsd_*` validation rules keep validating the lexical value unchanged.**
   Given a `number`-typed field with a `restriction` using `xsd_minInclusive`/`xsd_maxInclusive`/`xsd_totalDigits`/`xsd_fractionDigits`, and an `email`/`url`-typed field with `xsd_pattern`,
   When an out-of-bounds or malformed value is entered,
   Then the existing rule fails exactly as it does today for a `text`-typed field carrying the same restriction; no `packages/core/src/core/validation.ts` change is needed or made.

7. **Guide and README documentation reflect the new types.**
   Given `docs/guide/starter-template.md`'s "What you get" field-types table,
   When this story ships,
   Then it gains one row each for `number`, `email`, `tel`, `url`, `date`, `time`, `datetime-local`; the `number` row states explicitly that the model stays a `string` (not a JS number), and that `number.min`/`max`/`step` are native-affordance hints only, not a substitute for `xsd_minInclusive`/`xsd_maxInclusive` validation.

### Edge cases
- `'datetime-local'` is a valid interface key (quoted for the hyphen) and produces the template-literal slot type `datetime-local-input`; that slot is never provided by the starter, so it falls to `default-input` like every other mode here. No slot is added for it.
- A consumer who already declared `number`/`email`/etc. via their own `extendMetadata` call before this story ships keeps compiling and rendering unchanged: `extendMetadata`'s `Omit<StarterValueTypes, keyof Extra> & Extra` means their declaration wins on collision, confirmed by the feature's adversarial review.
- A `number` field with `number.min`/`max` set but no matching `restriction`: the browser shows the spinner/stepping affordance, but nothing is enforced on submit. This is documented behavior (AC7), not a bug.
- `date`/`time`/`datetime-local` values are the browser's own ISO-ish strings; parsing into a `Date` is left to the consumer, exactly as `text` is today. No parsing helper is added by this story.

### Out of scope
- Any new component or new named slot: this story is type-only, per the feature architecture's ADR-1.
- `textarea`, `radio`, `file`: ST-02, ST-03, ST-04.
- The `docs/examples/extending-starter.md` collision fix: ST-05.
- New CSS: this story adds no new `sft-` class and renders entirely through the existing `.sft-input`/`TextInput` chrome, so the feature's FEAT-013 token-sync constraint (Constraints & assumptions) does not apply to this story's work.

## Design reference
Implements the feature's [Design (feature level)](../../spec.md#design-feature-level) "HTML5 text-mode types" paragraph and prototype anchor [`#text-modes`](../../prototype.html#text-modes). The prototype section only confirms the native control renders inside the existing `FormField`/`.sft-input` chrome wrapper, with one shared invalid example, not a full state matrix per type (no new visual language). No design delta is open for this slice.

## Architecture reference
Implements the feature architecture's Slicing seam 1, ADR-1, and the `StarterValueTypes`/`StarterFieldProperties` `number` additions in full:

- **`packages/starter/src/metadata.ts` (modified).** Add `number`, `email`, `tel`, `url`, `date`, `time`, `'datetime-local'` to `StarterValueTypes`, all `string`. Add the optional `number?: { min?: number, max?: number, step?: number }` group to `StarterFieldProperties`, per the feature architecture's exact shape.
- **`packages/starter/src/StarterFormTemplate.vue` (modified).** The existing `#default-input` block (both the `sft-input-suffix-row` branch and the plain `v-else` branch, lines ~441-475 today) gains three new bindings each: `:min`, `:max`, `:step`, sourced from `s.fieldMetadata.number?.min/max/step`. No change to `handledSlotNames` (`default-input` is already handled). No new `<template #...>` block.
- **`packages/starter/src/TextInput.vue`.** No change: it already extends `InputHTMLAttributes` and forwards every attribute it does not declare as a prop through `v-bind="$attrs"` onto the DOM `<input>` (confirmed at `TextInput.vue:5,13,20`), so `min`/`max`/`step` reach the DOM with zero component change.
- **Public API surface touched:** seven new `StarterValueTypes` keys, one new optional `StarterFieldProperties` group (`number`). No export, slot, or engine change.
- **Dependencies on other stories:** none. This is the smallest, no-dependency slice.
- **Changeset:** not carried here. Per the feature architecture's "one feature/one changeset" call, the single minor-bump changeset covering the whole feature is written once in ST-04, with sub-bullets for each capability including this one.
- **Documentation:** this story owns `docs/guide/starter-template.md`'s new rows for `number`, `email`, `tel`, `url`, `date`, `time`, `datetime-local` (including the `number` model-stays-string and bounds-are-hints-only notes, AC7). `packages/starter/README.md`'s "Supported slots" table needs no change here (no new slot). This story also carries `specs/components.md`'s correction: the starter's entry currently sits under the "Non-published surfaces" heading labelled "(private package)", which is inaccurate (`packages/starter` has `publishConfig.access: public` and ships through the release pipeline). As the first story to touch this feature's surface, the developer relabels/moves that entry and folds in this story's own additions (the seven new types, the `number` group), so later stories (ST-02-04) add to the corrected entry rather than re-fixing the label.

## QA plan

### Fixtures and test utilities

- Reuse `packages/starter/src/__tests__/fixtures/mountInForm.ts` for every new test (the established mount-in-a-form harness).
- Extend `packages/starter/src/__tests__/fixtures/metadata.ts` with small, reusable fixtures for this slice: `numberMetadata` (`{ name: 'age', type: 'number', fieldOptions: { label: 'Age' } }`) and `emailMetadata` (`{ name: 'email', type: 'email', fieldOptions: { label: 'Email' } }`), following the existing `textMetadata`/`selectMetadata` pattern. The other five types (`tel`, `url`, `date`, `time`, `datetime-local`) are exercised inline via a parameterized `it.each` list; they do not need named fixtures since AC1 treats all seven identically.
- Extend `packages/starter/src/__tests__/metadata.golden.ts`'s `GoldenValueTypes` with the seven new entries, all `string`. This is the existing drift-detection fixture: once updated, `metadata.test.ts`'s existing `expectTypeOf` assertions (`keyof StarterValueTypes` vs `BuiltInType`, and the key-by-key equality checks) automatically fail if `StarterValueTypes` does not declare exactly these seven keys as `string`, with no new test logic needed. Also add the `number` group (`{ min?: number, max?: number, step?: number }`) to `GoldenFieldProperties`.
- No `packages/core/src/examples/` fixtures apply: this story is entirely within `packages/starter/src/`, and the core example template/testcases are not touched by a type-only starter addition.
- Extend the existing `fieldTypes` array in `packages/starter/src/__tests__/StarterFormTemplate.analytics.test.ts` with a `'number'` entry (the one new type that also carries a group property and new bindings), reusing the existing `renderCount` fixture. Note (adversarial review): `analytics.test.ts` holds only the render-count `it.each`; the existing number-coercion string-model guard is in `StarterFormTemplate.validState.logic.test.ts:72-81`, not here.

### Test-to-acceptance-criterion mapping

| AC | Behavior | Test file | Test |
| --- | --- | --- | --- |
| AC1 | Seven types compile with no `extendMetadata`, and each renders a native `<input>` whose `type` matches, through `default-input`/`TextInput` | `packages/starter/src/__tests__/StarterFormTemplate.textModes.test.ts` (new) | `it.each` over `['number','email','tel','url','date','time','datetime-local']`: mount `{ name, type, fieldOptions: { label } }` directly against `starterMetadata` (no `extendMetadata`), assert `wrapper.find('input.sft-input').attributes('type')` equals the literal type string and no other input/slot content is rendered |
| AC1 (compile check) | No `extendMetadata` wrapper needed, typed against `starterMetadata` | **PROPOSED (adversarial review):** the real compile-time guard is AC2's `metadata.test.ts` golden `keyof StarterValueTypes` equality, not the fixtures (`mountInForm` types `metadata` as `unknown` and the fixtures are untyped literals, so `pnpm typecheck` over them passes with or without the key). Either (a) treat AC2's golden drift test as the mapped guard for "the key exists", or (b) add one genuinely-typed compile fixture, e.g. `const numberField = { name: 'age', type: 'number', fieldOptions: { label: 'Age' } } satisfies GetMetadataType<typeof starterMetadata>`, which fails `vue-tsc --noEmit` if `number` is absent | manual: confirm `pnpm typecheck` passes, understanding the drift is actually caught by AC2's golden check (or the typed `satisfies` fixture if (b) is taken) |
| AC2 | `StarterValueTypes` gains the seven entries, all `string` | `packages/starter/src/__tests__/metadata.test.ts` (existing, extended indirectly via the golden fixture) | existing `expectTypeOf<keyof StarterValueTypes>().toEqualTypeOf<BuiltInType>()` and `KeyByKeyEquality<...GoldenValueTypes>` assertions, now driven by the updated `GoldenValueTypes` fixture; add one explicit test asserting `expectTypeOf<StarterValueTypes['datetime-local']>().toEqualTypeOf<string>()` to pin the quoted-key edge case by name |
| AC3 | Model stays a string for every one of the seven modes, including `number` | `packages/starter/src/__tests__/StarterFormTemplate.textModes.logic.test.ts` (new) | `it.each` over all seven types: `setValue('42')` (or a type-appropriate literal, e.g. an ISO date string for `date`), assert `typeof values()[name] === 'string'` and the exact stored value; **PROPOSED (adversarial review):** this extends (does not replace) the existing number-coercion guard, which lives in `StarterFormTemplate.validState.logic.test.ts:72-81` (not in `analytics.test.ts`, which holds only render-count assertions); leave that existing `number` guard in place, this story's `it.each` broadens the same assertion to all seven modes |
| AC4 | `number.min/max/step` forwarded on both `TextInput` branches | `packages/starter/src/__tests__/StarterFormTemplate.textModes.test.ts` | two tests: (a) plain branch, mount `{ ...numberMetadata, number: { min: 0, max: 50, step: 5 } }`, assert `input.attributes('min'|'max'|'step')` equal `'0'|'50'|'5'`; (b) suffix branch, same metadata plus `suffix: 'yrs'`, assert the same three attributes on the input inside `.sft-input-suffix-row` |
| AC5 | `number` bounds harmless on every other type (no `min="undefined"` in the DOM) | `packages/starter/src/__tests__/StarterFormTemplate.textModes.test.ts` | mount `textMetadata` and `emailMetadata` (no `number` property set), assert `input.attributes('min')`, `.attributes('max')`, `.attributes('step')` are all `undefined`, and `wrapper.html()` does not match `/\bmin="undefined"/` etc. |
| AC6 | Existing `xsd_*` rules keep validating the lexical value unchanged for `number` (`xsd_minInclusive`/`xsd_maxInclusive`/`xsd_totalDigits`/`xsd_fractionDigits`) and `email`/`url` (`xsd_pattern`) | `packages/starter/src/__tests__/StarterFormTemplate.textModes.validation.test.ts` (new) | mount a `number` field with `restriction: { minInclusive: 0, maxInclusive: 50 }`, set an out-of-range value, `validate()`, assert `.sft-error` appears; same for `totalDigits`/`fractionDigits`; mount an `email` field with `restriction: { pattern: '^[^@]+@[^@]+$' }`, set a malformed value, assert the same failure; each mirrors an equivalent existing assertion already proven for `text` (no new rule behavior, only a starter-wiring regression check, since the rule logic itself is already covered by `packages/core/src/core/__tests__/validation.test.ts`) |
| AC6 (edge case) | `number.min/max` alone, with no matching `restriction`, enforces nothing on submit | same file | mount `{ ...numberMetadata, number: { min: 0, max: 50 } }` with no `restriction`, set a value outside that range, `validate()`, assert no `.sft-error` (documents AC6's "hint only" behavior as a passing regression guard, not just prose) |
| AC7 | Guide gains the seven rows with the string-model and hints-only notes | manual (see Manual verification checklist) | no automated markdown-content test exists for `docs/guide/*` in this repo (`docs/`'s own vitest setup is scoped to pure `.ts` modules under `theme/components/`, not prose pages); verified by manual read-through |

### Edge cases mapped to tests

- `'datetime-local'` is a valid key and resolves to the unused slot type `datetime-local-input`, falling back to `default-input`: covered by the AC1 `it.each` (includes `'datetime-local'` in the list) plus an explicit assertion that no console warning/error is emitted on mount (`StarterFormTemplate.textModes.test.ts`).
- A consumer's pre-existing `extendMetadata` redefinition of one of these seven keys keeps compiling/winning: already generically proven by `metadata.test.ts`'s "when the consumer redefines a built-in key" block (tested against `text` today); add one more case redefining `number` (e.g. `extendMetadata<{ number: { raw: string } }>()`) to pin this exact story's new keys through the same mechanism, in `metadata.test.ts`.
- `number.min/max` with no `restriction`: covered above (AC6 edge case row).
- `date`/`time`/`datetime-local` values are left unparsed: no dedicated test needed beyond AC3's string-model check; there is no parsing code path in this story to exercise.

### States required for this slice

Per the feature's states policy and the Design reference's note that this slice shows "one shared invalid example, not a full state matrix per type" (no new component, no new CSS), the slice reuses the existing `TextInput`/`.sft-input` chrome unchanged. Required, on one representative new type (`email`, chosen because it has both a realistic native-affordance story and an `xsd_pattern` restriction to drive invalid state):

- **pristine**: no `.sft-error`, no danger border, on first mount (`StarterFormTemplate.textModes.test.ts`).
- **invalid**: `xsd_pattern` failure renders `.sft-error` and the danger border class, identically to how `text` already does it (`StarterFormTemplate.textModes.validation.test.ts`, reusing the existing invalid-state assertions' shape from `StarterFormTemplate.test.ts`).
- **disabled**: `fieldMetadata.disabled: true` on a new type still dims the field and disables the input, extending the existing `disabling` parameterization already used in `StarterFormTemplate.disabled.logic.test.ts` with one `email`-typed case, to confirm the disabled mechanism is genuinely type-agnostic and not quietly special-cased to the original four types.
- **valid**/**loading**/**focus**: not required here. No green success state is introduced or changed by this slice (unchanged `showValidState` opt-in, already covered generically); no loading concept applies to a leaf field; focus styling is inherited unchanged from `.sft-input` with no new CSS, so it needs no new assertion beyond what the existing `TextInput`/`.sft-input` tests already prove.

### Reactivity (render-count)

This slice does not add a `computedProps` function or touch `DynamicFormItem`/validation-wiring internals, but it does add three new reactive bindings (`:min`, `:max`, `:step`) to the `#default-input` block, which is on every leaf field's render path. Guard against a re-render regression: add a `'number'` entry (with a `number: { min: 0, max: 50, step: 1 }` extra) to the existing parameterized list in `packages/starter/src/__tests__/StarterFormTemplate.analytics.test.ts`, so the existing assertions (`renders once on mount`, `does not re-render a sibling field when typing`) run against the new bindings too and would catch an extra re-render introduced by the `?.` optional-chaining reads.

### Coverage

All new source lines are additive and fall into two shapes, both fully exercised above:

- `metadata.ts`: seven interface entries and one optional group property. Covered by AC2's type tests (compile-time; `vitest`'s type-checking plugin and `expectTypeOf` exercise these at test-run time) and AC1/AC4's runtime renders.
- `StarterFormTemplate.vue`: three new attribute bindings on each of the two `#default-input` branches (six bindings total), each with an optional-chaining read (`s.fieldMetadata.number?.min` etc.). AC4 exercises the defined-value branch of the optional chain on both template branches; AC5 exercises the `undefined` branch. No line or branch in the touched code is knowingly left uncovered.

No baseline drop in `pnpm -r ci:test:coverage` is expected; this plan does not knowingly leave any touched line/branch uncovered.

### Time sensitivity

No test in this slice constructs a `Date`, compares a timestamp, or depends on the system clock. `date`/`time`/`datetime-local` values are handled and asserted purely as opaque strings (per AC3 and the edge cases), so none of these tests have a `TZ=Europe/Amsterdam` dependency; they will behave identically under any timezone.

### Regression risk

- **Touched**: `packages/starter/src/metadata.ts` (`StarterValueTypes`, `StarterFieldProperties`), `packages/starter/src/StarterFormTemplate.vue`'s `#default-input` block (both branches). `TextInput.vue` is not modified.
- **Existing guards already in place**: `StarterFormTemplate.forwarding.logic.test.ts` (wrapped-vs-bare HTML parity, would catch an accidental change to every leaf field's markup, not just the new types), `StarterFormTemplate.analytics.test.ts`'s existing render-count assertions for `text`/`select`/`checkbox`/`password` (would catch a global re-render regression from the new bindings, since they share the same `#default-input` compiled block logic as every text-like field), `StarterFormTemplate.test.ts` and `StarterFormTemplate.validState.logic.test.ts` (chrome/label/error/valid-state wiring for `text`, which the new types share byte-for-byte).
- **Most at risk of a silent regression**: the `text` type itself and the `suffix` row, since both new bindings land in the same two `v-if`/`v-else` branches `text` already uses; AC4's suffix-branch test and the existing `StarterFormTemplate.analytics.test.ts` suffix tests together guard this.
- **Other FEAT-014 stories (ST-02/03/04)**: none depend on this story's code (per the architecture's "independent, minimal shared surface" slicing), so no cross-story regression risk; only the shared `metadata.golden.ts`/`metadata.test.ts` files are touched by more than one story, and each story's addition is additive to independent keys.

### Manual verification checklist

- Open the docs guide page (`docs/guide/starter-template.md`) after the developer's edit and read the new seven rows: confirm the `number` row states explicitly that the model stays a `string` and that `number.min`/`max`/`step` are native-affordance hints only, not a validation substitute (AC7).
- In a real browser (not jsdom, which does not render native pickers/spinners/keyboards), open Storybook or the docs dev server, set a field to each of the seven types, and eyeball: the `number` field shows spinner arrows and respects `min`/`max`/`step` as a native affordance; `date`/`time`/`datetime-local` open the native picker; `email`/`tel`/`url` show the expected mobile keyboard layout on a touch device or emulator. This is exploratory only (jsdom cannot assert any of it); no defect here blocks this story since the browser's own affordance is outside this codebase's control.
- No Playwright screenshot is required for this story: it adds no new CSS and no new visible component (confirmed by the story's own Out of scope note), so there is no visual diff for the "Before Every Push" screenshot step to catch.
- Confirm `pnpm typecheck` passes with the new fixtures in place (the concrete check for AC1's "compiles with no `extendMetadata` wrapper" claim).

### Untestable-as-written criteria

None. AC7 (documentation) has no automated markdown-content test harness in this repo's conventions (`docs/`'s vitest setup only covers pure `.ts` modules), so it is mapped to a manual verification step rather than a unit test; this is a tooling gap, not a defect in how AC7 is written, so no rewrite is proposed.

## Adversarial review
Lite (story level): blockers only, but two verified should-fixes are recorded. Both are routed as `PROPOSED (adversarial review)` edits in the QA plan, so neither forces discussion. No blockers, no unresolved Open questions.

Verified against the real code (`packages/starter/src/metadata.ts`, `TextInput.vue`, `StarterFormTemplate.vue:441-475`, `__tests__/metadata.golden.ts`, `__tests__/metadata.test.ts`, `__tests__/fixtures/metadata.ts`, `__tests__/fixtures/mountInForm.ts`, `__tests__/StarterFormTemplate.analytics.test.ts`, `__tests__/StarterFormTemplate.validState.logic.test.ts`, `__tests__/StarterFormTemplate.disabled.logic.test.ts`). Claims that held up, so they are not re-litigated: `TextInput`'s `type="text"` sits before `v-bind="$attrs"`, so the forwarded `:type` wins and AC1's `attributes('type')` read returns the literal mode string (including `datetime-local`, since it reads the attribute, not jsdom's reflected IDL type); `:min`/`:max`/`:step` fall into `$attrs` and reach the DOM with no `TextInput` change, and an `undefined` value omits the attribute (AC4/AC5 sound); `metadata.test.ts`'s `expectTypeOf<keyof StarterValueTypes>().toEqualTypeOf<keyof GoldenValueTypes>()` is a true bidirectional drift guard, so adding the seven keys to both `StarterValueTypes` and `GoldenValueTypes` is genuinely enforced (AC2 sound); `KeyByKeyEquality` only iterates `keyof Golden`, so the `number` group must be added to `GoldenFieldProperties` to be guarded, which the plan does; the story is consistent with the approved feature (slicing seam 1, ADR-1, the `number` group per feature finding 3) and has no cross-story dependency, matching the scrum-master's split.

1. **AC3's test-mapping misattributes the existing number-coercion guard. (should-fix)** The AC3 row and the Fixtures bullet say the new `StarterFormTemplate.textModes.logic.test.ts` "subsumes and keeps parity with the existing number-coercion-guard test already in `StarterFormTemplate.analytics.test.ts`". That file contains only the render-count `it.each`; it has no coercion guard. The actual guard (`type: 'number'`, `setValue('42')`, `expect(typeof values().age).toBe('string')`) lives in `StarterFormTemplate.validState.logic.test.ts:72-81`. As written, a developer reading this would look in the wrong file, and the "parity/subsumes" claim is false against the named file, risking the real guard being left orphaned or silently duplicated without the author realising the original still ships elsewhere. Routed as a PROPOSED edit in the AC3 row.

2. **AC1's "compile check" rests on a type guarantee the fixtures do not provide. (should-fix)** The AC1 (compile check) row claims `pnpm typecheck` over the added fixtures proves the keys exist, "since a metadata literal typed against the catalogue only type-checks if the key exists". It does not: `mountInForm`'s `metadata` param is typed `unknown`, and the existing fixtures (`textMetadata`, `selectMetadata`) are bare untyped object literals, so `type: 'number'` widens to `string` and `pnpm typecheck` passes whether or not `number` is in `StarterValueTypes`. The genuine compile-time drift guard for "the key exists" is AC2's `metadata.test.ts` golden `keyof` equality, not the fixtures. The guarantee is therefore still covered (by AC2), but AC1's stated mechanism is inaccurate and, taken alone, would not catch a missing key. Routed as a PROPOSED edit in the AC1 (compile check) row: either point at AC2 as the real guard, or add one genuinely-typed compile fixture (a `const ... satisfies` against `GetMetadataType<typeof starterMetadata>`) that fails to compile when a key is absent.

3. **`datetime-local` jsdom type reflection. (nit)** AC1's `it.each` asserts `attributes('type') === 'datetime-local'`. This reads the HTML attribute string (always the literal), not the element's reflected `type` IDL property (which jsdom may normalise), so the assertion is safe as written. Flagged only so a developer does not "defensively" switch to `element.type` and get a surprise; keep the `attributes('type')` read.

## Implementation notes

Built exactly as planned: seven `StarterValueTypes` entries (`number`, `email`, `tel`, `url`, `date`, `time`, `'datetime-local'`, all `string`), the `number?: { min?, max?, step? }` group on `StarterFieldProperties`, and six new attribute bindings (`:min`/`:max`/`:step` on both `#default-input` branches) in `StarterFormTemplate.vue`. No new component, no new slot, `TextInput.vue` untouched.

- Took the AC3 and AC1-compile-check PROPOSED edits from the adversarial review as written: the new `StarterFormTemplate.textModes.logic.test.ts` is additive to (not a replacement of) the existing number-coercion guard in `StarterFormTemplate.validState.logic.test.ts:72-81`, and AC1's "no `extendMetadata` step" compile guarantee is treated as resting on AC2's golden `keyof` drift test (`metadata.test.ts`), not on the untyped test fixtures.
- Ran `eslint --fix` on `metadata.ts` and `metadata.golden.ts` after adding `'datetime-local'`: the `style/quote-props` rule requires consistent quoting across all keys of an interface once one key needs quotes, so every existing key in `StarterValueTypes`/`GoldenValueTypes` is now quoted too. No semantic change.
- `specs/components.md`: split the single `## Non-published surfaces` table into a new `## Starter package (published separately)` section (the starter row, relabelled, with this story's additions folded in) and a `## Non-published surfaces` section keeping the three genuinely unpublished rows (example template, Storybook playground, docs site), per the story's architecture note on the mislabeling.
- Added a `TextModes` Storybook story (`playgrounds/storybook/stories/StarterForm.examples.ts`/`StarterForm.stories.ts`) covering all seven types, including the `number.min`/`max`/`step` affordance; screenshotted in light and dark mode (Storybook, `http://localhost:6006/iframe.html?id=forms-starterformtemplate--text-modes`), confirming native pickers/spinner render through the existing chrome with no new CSS, matching the Design reference's "no new visual language" call.
- No changeset added: per the story's own Architecture reference, the single feature-level changeset is written once in ST-04.
- `packages/starter/src/__tests__/prototypeParity.test.ts` fails on a clean checkout of `main` (`ENOENT` reading `specs/FEAT-007-starter-form-template/prototype.html`, a directory removed by the unrelated "Cleanup + new Specs" commit before this story started). Confirmed pre-existing and unrelated by stashing every change from this story (`git stash -u`) and re-running: the same failure occurs. Left untouched, out of scope for this story. Verified no coverage regression by running `vitest --coverage --exclude "**/prototypeParity.test.ts"` on both the pre-story baseline and this story's changes: statements/lines 99.68% on both, branches 94.19% before vs 94.28% after (improved, from the new optional-chaining branch tests), functions 94.87% on both.

## Verification report

### Pipeline checks

`pnpm run ci` is shadowed by pnpm's built-in `ci` verb on this repo (known issue, see project memory), so each step was run explicitly instead:

- `pnpm run ci:test` (both packages, excluding the pre-existing broken suite below): `packages/core` 973/973 tests pass; `packages/starter` 411/411 tests pass.
- `packages/starter/src/__tests__/prototypeParity.test.ts` fails with `ENOENT` reading `specs/FEAT-007-starter-form-template/prototype.html`. Confirmed pre-existing and unrelated to this story by `git stash -u` then re-running the same test directly against clean `main`: identical `ENOENT` failure. The archived FEAT-007 prototype directory was removed by the prior "Cleanup + new Specs" commit, before this story started. Does not block this story's verdict; flagging for Jeroen to fix or retire that test separately.
- `pnpm run ci:lint`: clean on both packages.
- `pnpm run ci:typecheck`: clean on both packages plus `playgrounds/storybook`.
- `pnpm docs:test`: 78/78 pass (docs content changed).
- `pnpm docs:build`: builds clean.
- `pnpm -r ci:test:coverage` (starter, excluding the pre-existing broken suite): statements 99.68%, branches 94.28%, functions 94.87%, lines 99.68%. Matches the developer's reported numbers exactly, including the branch-coverage improvement from 94.19% to 94.28% from the new optional-chaining branch tests. No drop against baseline. Core coverage unaffected (core untouched by this story).

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC1: seven types compile and render through `default-input`/`TextInput` with no `extendMetadata` | Pass | `StarterFormTemplate.textModes.test.ts`'s `it.each` over all seven types; asserts `attributes('type')` matches and exactly one input/textarea/select renders, no console warning |
| AC2: `StarterValueTypes` gains the seven entries, all `string` | Pass | `metadata.golden.ts` extended with the same seven keys; existing `expectTypeOf` drift guards in `metadata.test.ts` now cover them; new explicit test pins `datetime-local` as `string` |
| AC3: model stays a string for every mode, including `number` | Pass | `StarterFormTemplate.textModes.logic.test.ts`'s `it.each` over all seven types, type-appropriate values, asserts `typeof values().field === 'string'` and exact stored value |
| AC4: `number.min/max/step` forwarded on both `TextInput` branches | Pass | `StarterFormTemplate.textModes.test.ts`: plain-branch and suffix-row-branch tests both assert `min`/`max`/`step` attributes equal `'0'`/`'50'`/`'5'`; confirmed in the `StarterFormTemplate.vue` diff, both branches bind all three |
| AC5: `number` bounds harmless on every other type | Pass | same file: `text`/`email` fixtures assert `min`/`max`/`step` attributes are `undefined` and no `min="undefined"` etc. appears in the rendered HTML |
| AC6: existing `xsd_*` rules keep validating the lexical value unchanged | Pass | `StarterFormTemplate.textModes.validation.test.ts`: `minInclusive`/`maxInclusive`, `totalDigits`/`fractionDigits` on `number`, `pattern` on `email`/`url`, plus the "bounds alone enforce nothing" edge case; `packages/core/src/core/validation.ts` untouched (confirmed via diff) |
| AC7: guide documentation gains the seven rows with string-model and hints-only notes | Pass | `docs/guide/starter-template.md` diff: one row per type, plus the explicit "model stays a string... not a JS number" and "native-affordance hints only" paragraph |

### Prototype / states comparison

Per the story's own Design reference, this slice shows one shared invalid example, not a full state matrix: no new component, no new CSS, entirely the existing `TextInput`/`.sft-input` chrome. Verified against the feature's states policy on the representative type (`email`):

- pristine: `StarterFormTemplate.textModes.test.ts` renders a clean mount with no `.sft-error`.
- invalid: `StarterFormTemplate.textModes.validation.test.ts` drives `xsd_pattern` failure on `email`/`url`, `.sft-error` appears, identical mechanism to `text`.
- disabled: `StarterFormTemplate.disabled.logic.test.ts` gained an `email`-typed case confirming the disabling mechanism is type-agnostic.
- valid/loading/focus: correctly out of scope per the story (no new green state, no loading concept for a leaf field, focus inherited unchanged from `.sft-input`).

No visual drift from sibling stories: `TextInput.vue` is unmodified, and the new `:min`/`:max`/`:step` bindings resolve to `undefined` (omitted attribute) on every type this story doesn't touch, confirmed by AC5's regression test. Storybook `TextModes` story added and screenshotted by the developer in both color modes per the Implementation notes; not independently re-screenshotted here since the story's own manual verification checklist explicitly waives the Playwright step for this slice (no new CSS, no new visible component).

### Process compliance

- `specs/components.md`: starter entry relabeled from "Non-published surfaces"/"(private package)" to a new "Starter package (published separately)" section, with the seven new `StarterValueTypes` entries and the `number` group folded in. Matches the architecture's instruction that this story owns that correction.
- Documentation: `docs/guide/starter-template.md` updated per AC7. `packages/starter/README.md`'s "Supported slots" table correctly needed no change (no new slot added by this story).
- Changeset: none added, correctly so. The feature architecture's "one feature/one changeset" call explicitly defers the single changeset to ST-04; this is a documented, approved deviation from the general per-PR changeset rule, not a silent omission.
- Tests named per convention: `.test.ts`, `.logic.test.ts`, `.validation.test.ts` suffixes used correctly for compile/render, model-state, and validation-behavior tests respectively.
- Library API rules: no new exports from `index.ts`; the seven new keys and the `number` group are additions to the already-exported `StarterValueTypes`/`StarterFieldProperties` interfaces, documented in both `specs/components.md` and the guide. `'datetime-local'` stays a quoted interface key (required for the hyphen, matches the native `type` attribute 1:1 per the feature's OQ4 decision), not a Vue prop/slot name, so it does not conflict with the camelCase rule. `eslint --fix`'s resulting full requoting of both `StarterValueTypes` and `GoldenValueTypes` is a mechanical, no-semantic-change side effect, confirmed by the clean lint and typecheck runs.
- No undocumented spec deviations found. The two adversarial-review should-fixes (AC3 misattribution, AC1 compile-check mechanism) were already resolved as `PROPOSED (adversarial review)` edits directly in the QA plan text; the developer's Implementation notes confirm they followed those as written. No silent override of any feature-level decision.

### Verdict: pass

All seven acceptance criteria pass with direct evidence. Pipeline is green (test/lint/typecheck/docs build), coverage holds and slightly improves on branches, and the one failing suite (`prototypeParity.test.ts`) is confirmed pre-existing, unrelated, and does not block this story. Process compliance is clean: `specs/components.md` corrected and extended, docs updated, no changeset (by design, deferred to ST-04), no new exports, no undocumented deviation.

Status set to `done`. Reminder for Jeroen: fill in the `pr` field once the PR is opened. This is not the feature's last open story (ST-02 through ST-05 are still `approved`, not yet implemented), so FEAT-014 stays `in-progress`.

```
Add HTML5 text-mode field types to the starter template

Metadata authors can now declare number, email, tel, url, date, time, and
datetime-local fields directly against the default starterMetadata catalogue,
with no extendMetadata step, so forms get the right mobile keyboard and native
browser affordance out of the box.

- StarterValueTypes gains the seven new type keys, all stored as a string
  (the number type keeps the existing coercion guard: the model never
  becomes a JS number).
- StarterFieldProperties gains an optional number.min/max/step group,
  forwarded to the native input as spinner/stepping hints; real validation
  still goes through xsd_minInclusive/xsd_maxInclusive as before.
- Documents the new types and the number model-stays-a-string note in the
  starter template guide, and corrects specs/components.md to list the
  starter package under its own published-surface section.

Co-Authored-By: Claude <noreply@anthropic.com>
```
