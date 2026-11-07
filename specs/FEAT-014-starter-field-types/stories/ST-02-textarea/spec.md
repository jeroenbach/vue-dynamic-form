---
id: ST-02
type: story
feature: FEAT-014
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Textarea field type

## Functional
### User story
As a metadata author building a form with `@bach.software/vue-dynamic-form-starter`, I want a built-in `textarea` field type with full chrome, so that users can enter multi-line text (a bio, a cover letter, comments) without me hand-building a custom type via `extendMetadata`.

### Acceptance criteria

1. **`textarea` compiles and renders with no `extendMetadata` step.**
   Given a metadata node `{ name: 'bio', type: 'textarea', fieldOptions: { label: 'Bio' } }` typed against `starterMetadata`,
   When the project is type-checked and the form renders,
   Then it compiles with no wrapper, and the field renders through a new `textarea-input` slot into a native `<textarea class="sft-textarea">`.

2. **`Textarea.vue` is controlled exactly like `TextInput`.**
   Given `Textarea.vue` mounted with a `value` prop and a field context,
   When the user types,
   Then it emits via `@input="handleChange(($event.target as HTMLTextAreaElement).value)"` and `@blur="handleBlur"`, and its displayed value always reflects `fieldContext.value.value` (no local copy).

3. **`sft-textarea` matches `.sft-input`'s state tokens with three intentional differences.**
   Given the compiled stylesheet,
   When `.sft-textarea`'s resting, focus, `is-invalid`, and disabled rules are inspected,
   Then each reads the same border, radius, `--sft-input-bg`, and `--sft-text` tokens `.sft-input` reads (through FEAT-013's `--sft-radius-*`/`--sft-font-*` custom properties if they exist in `packages/starter/src/style.scss` at implementation time, or today's literal values with a flagged follow-up if they don't yet, per the feature's Constraints & assumptions), and differs only in: no fixed `height` (uses `min-height: 104px`), `resize: vertical` (removed when `disabled`), and `line-height: 1.5`. It also mirrors `.sft-input`'s mobile-first font-size rule (`inherit` below 768px, the tokenized/literal size from 768px up).

4. **`#textarea-input` slot is wired and overridable.**
   Given `StarterFormTemplate.vue`,
   When inspected,
   Then `'textarea-input'` is added to `handledSlotNames`, and a new `<template #textarea-input="s">` block wraps `<slot name="textarea-input" v-bind="s">` whose default content is `Textarea.vue`, wired to `s.fieldContext`/`s.fieldMetadata`/`s.disabled`/`s.settings` the same way `#select-input` is today; a consumer-supplied `#textarea-input` slot fully replaces it.

5. **`showValidState` opt-in joins the textarea.**
   Given `settings.showValidState` is `true` and a touched, valid `textarea` field,
   When rendered,
   Then it carries `data-field-state="valid"` and an `is-valid` class, using the same `inputFieldState` helper `text`/`select`/`password` already use.

6. **No new `rows`/sizing property.**
   Given `StarterFieldProperties`,
   When inspected,
   Then no `textarea` group property is added; height is controlled only by the CSS `min-height`/`resize: vertical` in AC3, and `placeholder` plus the shared root chrome props are reused unchanged.

7. **Stays internal.**
   Given `packages/starter/src/index.ts`,
   When inspected,
   Then `Textarea.vue` is not exported, matching every other leaf-control component (`TextInput`, `SelectInput`, `CheckboxField`, `PasswordInput`).

8. **Documentation reflects the new type.**
   Given `docs/guide/starter-template.md`'s field-types table and `packages/starter/README.md`'s "Supported slots" table,
   When this story ships,
   Then the guide gains a `textarea` row and the README's "Input, one per control" row gains `textarea-input`.

### Edge cases
- Empty/pristine state renders the same `FormField` chrome (label, description, required/optional tag) as every other leaf field.
- A disabled `textarea` loses its resize handle and becomes `not-allowed`, matching the feature's states policy.
- Long text wraps and scrolls inside the fixed `min-height` box without breaking the surrounding `FormField` layout.
- `showValidState` is off by default and shows no green state unless the consumer opts in, matching `text`/`select`/`password`.

### Out of scope
- `radio`, `file`, the type-only HTML5 batch: ST-01, ST-03, ST-04.
- The `docs/examples/extending-starter.md` collision fix: ST-05 (depends on this story, see below).
- Any `DynamicFormTemplate`/`DynamicFormItem`/engine change.

## Design reference
Implements the feature's [Design (feature level)](../../spec.md#design-feature-level) "Textarea" paragraph and prototype anchor [`#textarea`](../../prototype.html#textarea). No delta open: the prototype's resting/focus/invalid/disabled states are the target as drawn. The architect may implement `sft-textarea` as its own rule block (as the prototype does) or by extending the `.sft-input` selector group with a height override; either is acceptable as long as the four states match the text input one-for-one (feature Design section).

## Architecture reference
Implements the feature architecture's Slicing seam 2 and the "Textarea" component bullet in full:

- **`Textarea.vue` (new, internal, slot `textarea-input`).** Native `<textarea class="sft-textarea">`. Props mirror `TextInput`: `id`, `dataTestid`, `value`, `disabled`, `errorMessage`, `placeholder`, plus the same `is-invalid`/`is-valid` class wiring.
- **`packages/starter/src/style.scss` (modified).** Add the `sft-textarea` rule(s) per AC3, using FEAT-013's `--sft-radius-*`/`--sft-font-*` tokens if present in the tree at implementation time; if FEAT-013 has not shipped yet, hardcode to match today's `.sft-input` values and leave a flagged follow-up note so FEAT-013's retrofit picks up this call site (per the feature's Constraints & assumptions).
- **`packages/starter/src/metadata.ts` (modified).** Add `textarea: string` to `StarterValueTypes`. No `StarterFieldProperties` change (AC6).
- **`packages/starter/src/StarterFormTemplate.vue` (modified).** Add `'textarea-input'` to `handledSlotNames`; add a `<template #textarea-input="s">` block modeled verbatim on the existing `#select-input` block, wiring `:id="s.fieldMetadata.path"`, `:dataTestid`, `:value="s.fieldContext.value.value"`, `:disabled="s.fieldMetadata.disabled || s.disabled"`, `:errorMessage`, `:placeholder`, the `data-field-state`/`is-valid` pair, `@input` calling `handleChange` with the raw textarea value, `@blur="handleBlur"`.
- **Public API surface touched:** one new `StarterValueTypes` key, one new internal component, one new named slot (`textarea-input`, additive). No export.
- **Dependencies on other stories:** none. ST-05 depends on this story shipping first (it needs `textarea` to exist built-in before the docs collision fix makes sense).
- **Changeset:** not carried here. Added once in ST-04, with a sub-bullet for this capability.
- **Documentation:** this story owns `docs/guide/starter-template.md`'s new `textarea` row and `packages/starter/README.md`'s "Supported slots" table addition of `textarea-input` (AC8). `specs/components.md`'s starter entry gains `Textarea.vue`/`textarea-input`/`sft-textarea` to its internal-chrome and slot-family lists (developer's job at implementation time, on top of ST-01's relabeling fix).

## QA plan

This slice adds one new presentational component (`Textarea.vue`), one new `StarterFormTemplate.vue` slot block, one new `StarterValueTypes` catalogue entry, and new `.sft-textarea` CSS. No `computedProps`, no validation rule change, no change to `DynamicFormItem` itself; the field still registers through the engine's normal `useField` wiring the same way every other leaf type does, so the render-count guard below is the standard per-type regression check already applied to `text`/`select`/`checkbox`/`password`, not a new reactivity concern this story introduces.

New fixture: add `textareaMetadata` to `packages/starter/src/__tests__/fixtures/metadata.ts`, modeled on `passwordMetadata`/`selectMetadata` (`{ name: 'bio', type: 'textarea', fieldOptions: { label: 'Bio' } }`). Reused helpers: `mountInForm` (fixtures/mountInForm.ts), `renderCount` (fixtures/renderCount.ts), `createConsumerWrapper` (fixtures/createConsumerWrapper.ts) for the slot-override test, and `compiledStylesheet` (helpers/compiledStylesheet.ts) plus a locally defined `blockOf`/`variableIn` pair (same small regex helpers already duplicated per-file in `themeScope.test.ts`) for the CSS assertions. No new fixture infrastructure needed beyond the one metadata object.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1. Compiles and renders with no `extendMetadata`, through `textarea-input` into `<textarea class="sft-textarea">` | A type-level assertion that `{ name: 'bio', type: 'textarea', fieldOptions: { label: 'Bio' } }` type-checks as `GetMetadataType<typeof starterMetadata>` with no wrapper (mirrors the existing `Field` literal pattern in `metadata.test.ts`), plus a render assertion mounting `textareaMetadata` through `mountInForm` and finding `textarea.sft-textarea` | `metadata.test.ts` (type check); new `StarterFormTemplate.textarea.logic.test.ts` (render) |
| 2. `Textarea.vue` controlled exactly like `TextInput`: `@input`/`@blur` wiring, value always reflects `fieldContext.value.value`, no local copy | Component-level: mount `Textarea.vue` directly, assert the rendered `<textarea>`'s value tracks the `value` prop with no internal ref (changing the prop alone, with no event fired, changes the DOM value), and that typing emits `input`/`blur` with the raw string. Wired-in-form level: set `initialValues`, assert the textarea's displayed value equals the model, type into it, assert the model updates, and assert a `resetForm`/external `setFieldValue` call (reuse the pattern already proven for `TextInput`/`PasswordInput`) is reflected without any extra wiring, proving there is no parallel local state to go stale | new `Textarea.test.ts` (component); new `StarterFormTemplate.textarea.logic.test.ts` (wired) |
| 3. `sft-textarea` matches `.sft-input`'s resting/focus/invalid/disabled tokens, differs only in no fixed height (`min-height: 104px`), `resize: vertical` (dropped when disabled), `line-height: 1.5`, and mirrors the mobile-first font-size rule | Static CSS assertions over `compiledStylesheet`: extract `.sft-textarea`'s and `.sft-input`'s declaration blocks (resting, `:focus`, `:disabled`, `.is-invalid`, `.is-invalid:focus`) with a local `blockOf` helper and assert `border`/`border-color`/`background`/`color`/`box-shadow`/`outline` declarations are *value-equal* between the two selectors (compared against whatever `.sft-input` itself currently reads, token or literal, so the test stays correct whether FEAT-013's `--sft-radius-*`/`--sft-font-*` tokens have landed yet or not, per the feature's Constraints & assumptions); then assert the three differences explicitly: `.sft-textarea` has no `height` declaration and `min-height: 104px`, `resize: vertical` in the resting block and `resize: none` (or absent) in `:disabled`, `line-height: 1.5`; and assert the `font-size: inherit` / `@media (min-width: 768px) { font-size: <value> }` pair matches `.sft-input`'s pair value-for-value | new `Textarea.style.test.ts` |
| 4. `#textarea-input` slot wired, added to `handledSlotNames`, overridable | Render assertion that a plain `textarea`-typed field renders `textarea.sft-textarea` wrapped in `.sft-field` chrome with no override supplied; a second test using `createConsumerWrapper({ overrides: { 'textarea-input': ... } })` (mirrors the existing "replaces only the overridden control and keeps the chrome around it" test in `StarterFormTemplate.overrides.logic.test.ts`) asserting the custom markup renders, `textarea.sft-textarea` is gone, and `.sft-field` chrome stays | `StarterFormTemplate.textarea.logic.test.ts` |
| 5. `showValidState` opt-in joins `textarea`, using the shared `inputFieldState` helper | Extend `StarterFormTemplate.validState.logic.test.ts` with a `textarea` case: off by default (no `data-field-state`, no `is-valid`), pristine when on, invalid after a failed blur-validate, valid (`data-field-state="valid"` + `is-valid` class) after a touched valid value, using `textareaMetadata` alongside the file's existing `textMetadata` cases | `StarterFormTemplate.validState.logic.test.ts` (modified) |
| 6. No new `rows`/sizing property added to `StarterFieldProperties`; `placeholder` and shared chrome props reused unchanged | Negative type-level assertion: `'textarea' extends keyof StarterFieldProperties ? true : false` resolves to `false` (no `textarea` group exists), plus a render assertion that `:placeholder` reaches the native `<textarea placeholder>` attribute exactly like `TextInput`'s does today | `metadata.test.ts` (negative type check); `StarterFormTemplate.textarea.logic.test.ts` (placeholder) |
| 7. `Textarea.vue` stays internal, matching every other leaf control | Add `'Textarea'` to the pinned `internalChrome` array in `publicApiSurface.test.ts`; the existing exact-match `valueExports`/`Object.keys(api)` assertions in `publicApiSurface.test.ts` and `index.test.ts` already fail if anyone adds an export, so no further change needed there | `publicApiSurface.test.ts` (modified) |
| 8. Docs: guide table gains a `textarea` row, README "Supported slots" table gains `textarea-input` | README half: add a literal-string assertion in `readme.test.ts` that the document contains `textarea-input` (mirrors the file's existing literal-sentence checks). Guide half: no automated test exists in this repo for `docs/guide/*.md` prose content (`docs/`'s own vitest setup is scoped to pure, framework-free `.ts` theme modules, never markdown, and is excluded from `pnpm -r ci:test:coverage`); this half is manual-only, see checklist | `readme.test.ts` (modified, README half only); manual (guide half) |

### Edge cases to tests
- Empty/pristine state gets the same `FormField` chrome as every other leaf field: covered by AC1/AC4's render assertion, which checks the surrounding `.sft-field`/label/description structure, not just the bare `<textarea>`.
- Disabled textarea loses its resize handle and becomes `not-allowed`: the behavioral half (native `disabled` attribute present, `.sft-field` carries `is-disabled`) is a new `textarea` case added to the existing `describe.each(sources)` block in `StarterFormTemplate.disabled.logic.test.ts` (mirrors the file's `text`/`select`/`checkbox`/`password` cases exactly); the CSS half (`resize: none` and `cursor: not-allowed` under `:disabled`) is covered by AC3's style test above.
- Long text wraps/scrolls inside the fixed `min-height` box without breaking the surrounding layout: not meaningfully assertable under jsdom (no real layout/box-model engine). Manual-only, see checklist.
- `showValidState` off by default, no green state unless opted in: covered by AC5's extended `validState.logic.test.ts` case (the "off by default" branch).

### States from the feature's states policy applicable to this slice
- **pristine** — resting textarea, no error row. Covered by AC1/AC4's render test and the `validState.logic.test.ts` pristine case.
- **invalid** — danger border plus one `sft-error` line below. Covered by the blur-validation test in `StarterFormTemplate.textarea.logic.test.ts` (mirrors `PasswordInput`'s equivalent "blurring an empty required field" test) and, for the border token itself, the `.is-invalid`/`.is-invalid:focus` comparison in `Textarea.style.test.ts`.
- **valid** — opt-in only, no default green state. Covered by AC5's `validState.logic.test.ts` case (both the off-by-default and the on-and-touched-and-valid branches).
- **focus** — 3px sky ring (invalid focus swaps to rose). Covered by `Textarea.style.test.ts`'s `:focus` and `.is-invalid:focus` block comparisons; jsdom does not need to actually focus the element for a static CSS-selector assertion.
- **disabled** — dims to 60%, `not-allowed`, resize handle dropped. Behavioral half in `StarterFormTemplate.disabled.logic.test.ts`; CSS half in `Textarea.style.test.ts`.
- **loading/empty** — not applicable per the feature's states policy (no per-field spinner; "empty" is just pristine). No separate test needed.

### Reactivity / analytics
This slice does not add or change any `computedProps`, so there is no new reactive-wiring risk beyond what every leaf type already carries. Add one entry, `['textarea', { type: 'textarea' }]`, to the existing `fieldTypes` table in `StarterFormTemplate.analytics.test.ts`, so the standing "renders once on mount and does not re-render a sibling field when typing" assertion runs against `textarea` too, the same guard already applied to `text`/`select`/`checkbox`/`password`.

### Coverage
New source surface: `Textarea.vue` (all branches: with/without `errorMessage`, `disabled`, `dataTestid`) and the new `#textarea-input` block in `StarterFormTemplate.vue`. Both are fully exercised by the tests mapped above (component-level prop variations in `Textarea.test.ts`, wired variations in `StarterFormTemplate.textarea.logic.test.ts`/`disabled.logic.test.ts`/`validState.logic.test.ts`). `style.scss`'s new rules are not instrumented by `pnpm -r ci:test:coverage` (CSS is not JS/TS source) but are covered by the static assertions in `Textarea.style.test.ts` instead. No suffix-row branch applies here (the architecture does not wire `suffix` into `#textarea-input`, matching AC6's "no new sizing property" scope), so nothing is knowingly left uncovered. Expect `packages/starter`'s statement/branch/function coverage to stay at or above baseline; no known gap.

### Time sensitivity
None. No date/time-dependent behavior in this slice.

### Regression risk
- `StarterFormTemplate.vue` gains one more `handledSlotNames` entry and one more `<template #textarea-input>` block in an already-large single file; rerun the full existing `StarterFormTemplate.*.test.ts`/`*.logic.test.ts` suite (passthrough, forwarding, grid, wizard, choice, etc.) to confirm the dispatch mechanism and every other slot are untouched.
- `metadata.ts` and its independent drift guard `metadata.golden.ts` must be updated together: add `textarea: string` to `GoldenValueTypes` in `metadata.golden.ts` alongside the real `StarterValueTypes` entry. If only one is updated, `metadata.test.ts`'s existing "keeps the exact value type of every built-in field type" assertion either fails loudly (real added, golden not) or silently fails to guard the new key (golden added, real not), so this pairing is called out explicitly rather than left implicit.
- ST-01 (the HTML5 text-mode slice) touches the same two files (`metadata.ts`, `StarterFormTemplate.vue`) in non-overlapping spots (type-only catalogue entries and `#default-input` bindings vs. this story's new `textarea` entry and `#textarea-input` block); both are independently mergeable per the feature architecture's slicing seams, but confirm after both land that neither edit collided with the other's block.
- `extendMetadata`'s "consumer declaration wins on collision" behavior is feature-level and already proven by the existing `richText` fixture tests in `StarterFormTemplate.overrides.logic.test.ts`; no new test needed, just confirm that suite still passes.
- `specs/components.md`'s starter entry update (developer's job per the architecture) has no automated regression guard; manual review only.

### Untestable criteria and rewrite proposals
All eight criteria are testable as written, with one caveat already absorbed into the test design rather than requiring a rewrite: AC3's FEAT-013-token-or-literal conditionality (per the feature's Constraints & assumptions) is handled by comparing `.sft-textarea` against `.sft-input`'s own declared values rather than against a hardcoded literal, so the same test passes whether FEAT-013's tokens exist at implementation time or not, with no change needed to the criterion text.

AC8's guide-table half has no automated coverage path in this repo (docs `.md` prose is untested by convention, see the AC-to-test table), which is a gap in the project's tooling, not in this criterion's wording; flagged here for visibility, not as a rewrite request.

### Manual verification checklist
1. Mount a `textarea` field in the Storybook playground or a docs example page in both light and dark mode; visually confirm resting, focus, invalid, and disabled states match the feature's prototype (`#textarea` anchor) one-for-one, per the "Before Every Push" screenshot step.
2. Type several paragraphs of long text into the control and confirm it wraps and scrolls inside the `min-height` box without pushing or breaking the surrounding `FormField`/grid layout.
3. Tab to the field with the keyboard and confirm the focus ring is visible in both color modes.
4. Verify `docs/guide/starter-template.md`'s field-types table gained the `textarea` row (AC8's guide half, no automated check exists for this).

## Adversarial review
Lite (story-level): blockers only. Verified against the real `StarterFormTemplate.vue` (`#select-input`/`#default-input`/`inputFieldState`), `packages/starter/src/style.scss` (`.sft-input`), the existing `packages/starter/src/__tests__` fixtures/helpers the QA plan reuses, and FEAT-014's `prototype.html`.

Holds up (stated so it is not re-litigated): all eight ACs are testable and mapped, and every helper/fixture the QA plan reuses exists (`fixtures/metadata.ts`, `mountInForm.ts`, `renderCount.ts`, `createConsumerWrapper.ts`, `helpers/compiledStylesheet.ts`, the `blockOf`/`variableIn` regex pattern in `themeScope.test.ts`); `inputFieldState` is the shared helper `text`/`select`/`password` already use (`StarterFormTemplate.vue:71`), so AC5's parity claim is real; `.sft-input` does carry the mobile-first font-size rule AC3 mirrors (`font-size: inherit` + `@media (min-width: 768px) { font-size: 14px }`, `style.scss:343,349-351`); extending `showValidState` to `textarea` (AC5) is not a silent override of the feature's "no green state for new controls" policy, it is the explicit architecture decision at `../../spec.md:210`; the `metadata.golden.ts` pairing and the ST-01 shared-file overlap are both correctly flagged as regression risks; dependencies are correctly stated as none. No blockers.

1. **"3px sky ring" focus prose is actually 2px. (nit)** The states section (focus bullet) and the feature design say the textarea focus is a "3px sky ring". The shipped `.sft-input:focus` uses `box-shadow: 0 0 0 2px var(--sft-focus-ring)` (`style.scss:353-356`) and FEAT-014's own prototype draws the textarea focus at `0 0 0 2px` too (`prototype.html:245-246`, despite its note saying "3px"). AC3's testable assertion is value-equal against `.sft-input`, so the test self-corrects to 2px and nothing functional is at risk; the "3px" is a prose carry-over from the prototype note. No rewrite needed; flagged so the manual focus-ring check (checklist item 3) is not graded against a wrong number.

2. **"modeled verbatim on the existing `#select-input` block" overstates the match. (nit)** The architecture reference (Architecture reference bullet 4 and the `#textarea-input` wiring note) says the block is modeled verbatim on `#select-input`, but `#select-input` uses `@change="s.fieldContext.handleChange"` with no raw-value extraction (`StarterFormTemplate.vue:489`), whereas the textarea must use `@input="handleChange(($event.target as HTMLTextAreaElement).value)"` (the `#default-input`/`TextInput` pattern, `StarterFormTemplate.vue:471`). AC2 states the correct `@input`/raw-value wiring unambiguously, so the deliverable is clear; the "verbatim on select-input" phrase describes only the slot-wrapper structure (wrap `<slot>`, default content is the component), not the event wiring. No rewrite needed; noted so a developer does not copy select's `@change`/no-extraction wiring by mistake.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
