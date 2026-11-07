---
id: ST-03
type: story
feature: FEAT-014
status: done
approved_by: Jeroen
pr: ""
---

# Story: RadioGroup field type

## Functional
### User story
As a metadata author building a form with `@bach.software/vue-dynamic-form-starter`, I want a built-in `radio` field type that renders a flat list of mutually exclusive options, so that users can pick one value from a short visible list, without me reaching for `extendMetadata` or misusing the structural `choice` concept to do it.

### Acceptance criteria

1. **`radio` compiles and renders with no `extendMetadata` step, reusing `options`.**
   Given a metadata node `{ name: 'contactMethod', type: 'radio', fieldOptions: { label: 'How should we contact you?' }, options: [{ key: 'email', value: 'Email' }, { key: 'phone', value: 'Phone' }] }` typed against `starterMetadata`,
   When the project is type-checked and the form renders,
   Then it compiles with no wrapper, renders through a new `radio-input` slot into a `RadioGroup.vue`, and no new `StarterFieldProperties` group is added for `radio` (the existing root `options: { key, value }[]` is reused as-is).

2. **Native `name`/`id` wiring fixes keyboard grouping and label association in one prop.**
   Given `RadioGroup.vue` receives an `id` prop sourced from `s.fieldMetadata.path` (the same way `TextInput`/`SelectInput`/`PasswordInput` already receive it),
   When it renders its options,
   Then every option's native `<input type="radio">` shares one `name` attribute (so the browser groups them for single-selection and arrow-key roving focus), and the first option's native input additionally carries `id="<path>"`, so `FormField`'s existing `<label :for="inputId">` associates with a real element instead of dangling. No `FormField.vue` change and no `aria-label`/`aria-labelledby` are added.

3. **Markup matches the prototype's structure.**
   Given the rendered field,
   When inspected,
   Then it is a `.sft-radio-group[role=radiogroup]` containing one `<label class="sft-radio-option">` per option, each wrapping a visually-hidden native `<input type="radio" class="sft-radio-input">`, a `.sft-radio-control` circle containing a `.sft-radio-dot`, and a `.sft-radio-label` showing the option's `value`.

4. **Selection is derived from the value, never local state.**
   Given a `radio` field bound to a model value equal to one option's `key`,
   When rendered,
   Then that option's native input is `:checked`, its `.sft-radio-option` carries `is-selected`, and no other option does; changing the bound value externally (e.g. `setFieldValue`) updates the selection with no local state to go stale.

5. **Sky accent, not indigo, reserving `--sft-choice` for structural choice.**
   Given the selected option's `is-selected` styling,
   When inspected in the compiled stylesheet,
   Then it reads `--sft-accent` (sky), never `--sft-choice` (indigo), keeping `radio` visually distinct from `DynamicFormItemChoice` cards.

6. **Keyboard focus and invalid states match the feature's states policy.**
   Given a radio option receiving keyboard focus,
   When inspected,
   Then `.sft-radio-input:focus-visible + .sft-radio-control` shows a 2px sky outline (`outline: 2px solid var(--sft-focus-border)`, `outline-offset: 2px`, rose when the field is invalid); an invalid `radio` field's resting circles carry the danger border via `.sft-radio-group.is-invalid`, and exactly one `sft-error` line renders below the whole group, never per option.

   > **DECIDED (research) — finding 1, adopted.** Was "3px sky outline" in the original AC; corrected to 2px during story prep, matching the one convention the package actually ships: `.sft-input:focus` uses `box-shadow: 0 0 0 2px var(--sft-focus-ring)` (`style.scss:356`), the switch focus uses `outline: 2px solid` (`:537`), and the feature's own `prototype.html#radio` already draws the radio focus rule as `outline: 2px solid var(--sft-focus-border); outline-offset: 2px` (`prototype.html:280`). No rule in the package or prototype renders 3px; the "3px" was a prose-only copy-paste artifact (it also appears, uncorrected, in FEAT-007's archived spec text and in this feature's own states policy, now also corrected there). This is a factual typo fix, not a design tradeoff: it needed no further ladder rung and does not park this story.

7. **`#radio-input` slot is wired and overridable.**
   Given `StarterFormTemplate.vue`,
   When inspected,
   Then `'radio-input'` is added to `handledSlotNames`, and a new `<template #radio-input="s">` block wraps `<slot name="radio-input" v-bind="s">` whose default content is `RadioGroup.vue`, wired to `s.fieldContext`/`s.fieldMetadata`/`s.disabled`/`s.settings`; a consumer-supplied `#radio-input` slot fully replaces it.

8. **Disabled state.**
   Given a disabled `radio` field,
   When rendered,
   Then the whole `sft-field` dims to 60% and every option becomes `not-allowed`, matching the feature's states policy.

9. **Stays internal.**
   Given `packages/starter/src/index.ts`,
   When inspected,
   Then `RadioGroup.vue` is not exported.

10. **Documentation reflects the new type.**
    Given `docs/guide/starter-template.md`'s field-types table and `packages/starter/README.md`'s "Supported slots" table,
    When this story ships,
    Then the guide gains a `radio` row (noting it reuses `options`, the same property `select` reads) and the README's "Input, one per control" row gains `radio-input`.

### Edge cases
- The same `options` array can be reused for both a `select` and a `radio` field with no reshaping, since the two read the identical root property.
- A `radio` field with zero options renders an empty `.sft-radio-group` with no option rows, rather than throwing, matching how `select` handles an empty `options` array today.
- `radio` never nests sub-fields per option; each option is `{ key, value }` only. A consumer who needs per-option sub-fields still uses the structural `choice` (`DynamicFormItemChoice`), not `radio` (ADR-2).

### Out of scope
- Building `radio` on top of the structural `choice` concept: explicitly rejected (feature architecture ADR-2, `DECIDED (Jeroen)` Open question 2).
- `textarea`, `file`, the type-only HTML5 batch: ST-01, ST-02, ST-04.
- Any `FormField.vue`, `DynamicFormTemplate`, or `DynamicFormItem`/engine change.

## Design reference
Implements the feature's [Design (feature level)](../../spec.md#design-feature-level) "RadioGroup" paragraph and prototype anchor [`#radio`](../../prototype.html#radio). One delta beyond the prototype's own copy: the prototype's original "arrow keys move within the group natively" claim and its `aria-label`-based naming are superseded by the architecture's `id`/`name`-prop resolution of adversarial-review findings 1 and 4 (`DECIDED (research)`), which this story implements as the actual wiring. Visual structure (circle, dot, label, sky accent) matches the prototype as drawn, with no further delta.

## Architecture reference
Implements the feature architecture's Slicing seam 3, ADR-2, and the "RadioGroup" component bullet (including the findings 1/4 resolution) in full:

- **`RadioGroup.vue` (new, internal, slot `radio-input`).** Props: `id`, `value`, `options`, `disabled`, `errorMessage`, `dataTestid`. Renders the markup in AC3. Assigns the received `id` to the first option's native `id` and to every option's `name` (one prop serves findings 1 and 4 at once, per the feature's `DECIDED (research)` resolution). `@change="handleChange(option.key)"`, `@blur="handleBlur"`.
- **`packages/starter/src/style.scss` (modified).** Add `sft-radio-group`, `sft-radio-option` (+ `is-selected`/`is-disabled`), `sft-radio-input`, `sft-radio-control`, `sft-radio-dot`, `sft-radio-label` rules, visually lighter than `.sft-choice-radio`/`-dot` (thinner padding, no icon, no per-option description), using FEAT-013's `--sft-radius-*`/`--sft-font-*` tokens if present in the tree at implementation time, or today's literal values with a flagged follow-up if they are not yet shipped (per the feature's Constraints & assumptions).
- **`packages/starter/src/metadata.ts` (modified).** Add `radio: string` to `StarterValueTypes`. No `StarterFieldProperties` change (AC1).
- **`packages/starter/src/StarterFormTemplate.vue` (modified).** Add `'radio-input'` to `handledSlotNames`; add a `<template #radio-input="s">` block modeled on `#select-input`, wiring `:id="s.fieldMetadata.path"`, `:dataTestid`, `:value="s.fieldContext.value.value"`, `:options="s.fieldMetadata.options"`, `:disabled="s.fieldMetadata.disabled || s.disabled"`, `:errorMessage`, `@change="s.fieldContext.handleChange"`, `@blur="s.fieldContext.handleBlur"`.
- **Public API surface touched:** one new `StarterValueTypes` key, one new internal component, one new named slot (`radio-input`, additive). No export, no `FormField.vue` change.
- **Dependencies on other stories:** none.
- **Changeset:** not carried here. Added once in ST-04, with a sub-bullet for this capability.
- **Documentation:** this story owns `docs/guide/starter-template.md`'s new `radio` row and `packages/starter/README.md`'s "Supported slots" table addition of `radio-input` (AC10). `specs/components.md`'s starter entry gains `RadioGroup.vue`/`radio-input`/the `sft-radio-*` classes to its internal-chrome and slot-family lists (developer's job at implementation time).

## QA plan

### Fixtures and utilities
- New fixture: add `radioMetadata` to `packages/starter/src/__tests__/fixtures/metadata.ts`, mirroring `selectMetadata`'s shape: `{ name: 'contactMethod', type: 'radio', fieldOptions: { label: 'How should we contact you?' }, options: [{ key: 'email', value: 'Email' }, { key: 'phone', value: 'Phone' }] }`.
- Reuse `fixtures/mountInForm.ts` for every integration test (form + `StarterFormTemplate` host), `fixtures/renderCount.ts` for the analytics test, and `fixtures/createConsumerWrapper.ts` for the slot-override test, matching `StarterFormTemplate.overrides.logic.test.ts`'s pattern.
- `RadioGroup.vue`'s own component-level tests mount it directly with `@vue/test-utils`' `mount`, no form context needed, matching `PasswordInput.test.ts`/`CheckboxField.test.ts`.
- Stylesheet-content assertions reuse `helpers/compiledStylesheet.ts`, the same compiled-CSS-as-text approach `classUsage.test.ts`/`prototypeParity.test.ts` already use.

### Acceptance criteria to tests
- **AC1** (compiles/renders with no `extendMetadata`, reuses `options`):
  - `packages/starter/src/__tests__/metadata.test.ts` + `metadata.golden.ts`: add `radio: string` to `GoldenValueTypes`. The file's existing `expectTypeOf<keyof StarterValueTypes>().toEqualTypeOf<BuiltInType>()` check (exact equality, not a subset check) already fails if `radio` is missing from `StarterValueTypes` once `GoldenValueTypes` is updated, so this is the correct place to pin the new key, not a new test file. Add one explicit test asserting `StarterFieldProperties` gains no `radio` key (a `// @ts-expect-error` assignment or `expectTypeOf<StarterFieldProperties>().not.toHaveProperty('radio')`), since the existing `KeyByKeyEquality` checks are one-directional (Golden-to-Actual) and would not otherwise catch a stray new property.
  - `packages/starter/src/__tests__/StarterFormTemplate.radio.test.ts` (new): mount `radioMetadata` with no `extendMetadata` wrapper, assert `.sft-radio-group` renders with one `.sft-radio-option` per entry in `fieldMetadata.options`.
- **AC2** (`id`/`name` wiring, keyboard grouping and label association, this story's explicitly called-out slice):
  - `packages/starter/src/__tests__/RadioGroup.test.ts` (new): mount `RadioGroup` with `id: 'contactMethod'` and two options; assert every native `input[type=radio]` carries `name="contactMethod"`, and that only the first option's input carries `id="contactMethod"` (the rest have no `id` attribute at all, not an empty string).
  - `packages/starter/src/__tests__/StarterFormTemplate.radio.logic.test.ts` (new): mount `radioMetadata` through the full template; assert `wrapper.find('label.sft-field-label').attributes('for')` equals `'contactMethod'` and that the element carrying that id is a real, rendered `input[type=radio]` (not dangling); assert `.sft-radio-group` has no `aria-label`/`aria-labelledby` attribute (the dropped prototype mechanism the Design reference says is superseded).
- **AC3** (markup matches the prototype's structure):
  - `RadioGroup.test.ts`: assert the wrapper is `.sft-radio-group[role=radiogroup]`; assert each option is `label.sft-radio-option > input.sft-radio-input[type=radio] + span.sft-radio-control > span.sft-radio-dot`, plus a sibling `span.sft-radio-label` with the option's `value` text.
- **AC4** (selection derived from value, not local state):
  - `RadioGroup.test.ts`: with `value: 'phone'`, assert the `phone` option's input is `.element.checked === true` and its `.sft-radio-option` carries `is-selected`; the other option has neither.
  - `StarterFormTemplate.radio.logic.test.ts`: click/change a different option's native input, assert `values().contactMethod` updates to that option's key and only that option now shows `is-selected`/`:checked`; separately, mount with `initialValues: { contactMethod: 'email' }`, then drive an external change through the exposed form (`setFieldValue`-style, matching the pattern `mountInForm`'s exposed `values`/`validate` already enables extending with a `setFieldValue` expose), and assert the displayed selection follows with no stale local-state copy, directly exercising the AC's "no local state to go stale" claim.
- **AC5** (sky accent, not indigo):
  - `packages/starter/src/__tests__/RadioGroup.style.test.ts` (new, stylesheet-content test): isolate the `.sft-radio-*` rule blocks from the compiled stylesheet; assert the selected-state block(s) reference `var(--sft-accent)` and that no `.sft-radio-*` selector block anywhere references `var(--sft-choice)`.
- **AC6** (keyboard focus and invalid states per the states policy):
  - Same `RadioGroup.style.test.ts`: assert a `.sft-radio-input:focus-visible + .sft-radio-control` rule exists; assert a corresponding invalid-and-focused rule exists (e.g. `.sft-radio-group.is-invalid .sft-radio-input:focus-visible + .sft-radio-control`, exact selector is the developer's call) that reads a danger/rose token instead of the sky one.
  - `RadioGroup.test.ts`: given `errorMessage` set, assert `.sft-radio-group` carries `is-invalid`.
  - `StarterFormTemplate.radio.test.ts`: mount with `minOccurs: 1`, trigger blur with no option chosen, assert exactly one `.sft-error` renders (`wrapper.findAll('.sft-error')` has length 1) and it is not a descendant of any `.sft-radio-option` (proves "never per option").
- **AC7** (`#radio-input` slot wired and overridable):
  - `StarterFormTemplate.radio.logic.test.ts`: using `createConsumerWrapper`, supply a custom `#radio-input` override and assert it fully replaces `RadioGroup` (no `.sft-radio-group` rendered, custom markup shown instead, same pattern as `StarterFormTemplate.overrides.logic.test.ts`'s "replaces only the overridden control" test); separately assert the default (no override) path still renders `RadioGroup` inside the normal `.sft-field` chrome.
- **AC8** (disabled state):
  - `packages/starter/src/__tests__/StarterFormTemplate.disabled.logic.test.ts` (extend the existing `describe.each(sources)` block): add a `radio: disables every option` case for both disabling sources (`fieldMetadata.disabled` and `maxOccurs: 0`), asserting every native radio input carries `disabled` and `.sft-field` carries `is-disabled`.
  - `RadioGroup.test.ts`: given `disabled: true`, assert every `input[type=radio]` has the `disabled` attribute and every `.sft-radio-option` carries `is-disabled`.
- **AC9** (stays internal):
  - Extend `packages/starter/src/__tests__/publicApiSurface.test.ts`'s `internalChrome` list with `'RadioGroup'` (required update, not optional: the test only guards names actually listed, so omitting it would let an accidental export slip through unnoticed; flagged here so it isn't missed during implementation, same pattern as the `index.test.ts`/`publicApiSurface.test.ts` update called out in FEAT-012 ST-02's QA plan).
- **AC10** (documentation):
  - Extend `packages/starter/src/__tests__/readme.test.ts` with an assertion that the "Input, one per control" row contains `radio-input` (same `expect(readme).toContain(...)` style the file already uses).
  - `docs/guide/starter-template.md`'s new `radio` row has no automated content test today (no doc-content test exists for that file; `docs/`'s own vitest setup is scoped to pure `.ts` modules, not markdown prose) — this half of AC10 is manual verification only (see checklist below).

### Edge cases to tests
- Shared `options` array reused unreshaped between a `select` and a `radio` field → `StarterFormTemplate.radio.test.ts`: mount one `select` and one `radio` field from the same literal `options` array, assert both list the identical key/value pairs.
- Zero-option `radio` renders an empty group, no throw → `RadioGroup.test.ts`: mount with `options: []`, assert `.sft-radio-group` exists and `findAll('.sft-radio-option')` has length 0, with no thrown error.
- `radio` never nests sub-fields → no dedicated test: the metadata shape (`options: {key,value}[]`, no `children`) makes this structurally impossible, and shape detection (`children`/`choice`/`maxOccurs`) is core engine behavior already guarded by core's own tests; noted here only so its absence isn't read as a gap.

### States policy (slice-relevant subset)
- **pristine**: resting group, no error, no reserved row — covered by the default-mount assertions in `RadioGroup.test.ts`/`StarterFormTemplate.radio.test.ts`.
- **invalid**: danger border on resting circles + exactly one `sft-error` line below the group — AC6 tests above.
- **focus**: 2px sky outline on the circle, swapping to rose when invalid — AC6's stylesheet-rule tests (see Untestable section for the limit of what jsdom can prove here).
- **disabled**: whole `sft-field` dims, every option `not-allowed` — AC8 tests above.
- **valid (opt-in green state)**: the feature's states policy says new controls do not join `showValidState` "unless the architect decides otherwise," and this story's architecture reference does not wire `data-field-state`/`is-valid` into the `#radio-input` block (unlike ST-02's textarea, which explicitly opts in). Add one regression test in `StarterFormTemplate.radio.test.ts` asserting `.sft-radio-group` never carries `data-field-state` or `is-valid`, even with `settings.showValidState: true` on a touched, valid field, so this scoping decision is pinned by a test rather than only by prose and can't silently drift later.
- **empty/loading**: not separate concepts here per the feature's states policy; the zero-options edge case above stands in for "empty".

### Reactivity / render-count
`RadioGroup` is a leaf input inside the normal `DynamicFormItem` re-render path (same mechanism `SelectInput`/`PasswordInput` use); it adds no `computedProps` and no child `DynamicFormItem`. Add `packages/starter/src/__tests__/StarterFormTemplate.radio.analytics.test.ts`, modeled on `StarterFormTemplate.group.analytics.test.ts`: mount a `radio` field alongside an unrelated sibling field with `settings: { analytics: true }`; assert the radio field renders once on mount, and that selecting a different option does not bump the sibling's render count. This guards the validation wiring (`xsd_required`/`combinedValidation`) that still runs through `DynamicFormItem` for this field even though `RadioGroup.vue` itself holds no state.

### Coverage
New code is `RadioGroup.vue` (every branch exercised: resting, selected, disabled, invalid, zero-option, via `RadioGroup.test.ts`) and the new `#radio-input` block in `StarterFormTemplate.vue` (exercised by the integration tests above). The `StarterValueTypes` `radio: string` addition is type-only, no runtime branch to cover. Nothing is knowingly left uncovered; `pnpm -r ci:test:coverage` should hold at or above baseline.

### Time sensitivity
None. No date/time-dependent behavior in this slice.

### Regression risk
- `SelectInput.vue`/`select-input`: untouched, but shares the `options` root property with `radio`; existing `select` coverage in `metadata.test.ts`/`StarterFormTemplate.test.ts` guards that the shared shape isn't narrowed.
- `FormField.vue`: not modified by this story, but its `<label :for="inputId">` is exactly the mechanism AC2/finding 4 rely on; guarded by the new AC2 tests. No existing test asserts this label-association pattern for `select`/`text` either, so this story's `StarterFormTemplate.radio.logic.test.ts` test is the first explicit coverage of the pattern in this codebase; worth a follow-up note (not this story's scope) to add the equivalent assertion for the existing controls.
- `classUsage.test.ts`, `noScopedStyle.test.ts`, `sourceHygiene.test.ts`, `noTailwind.test.ts`: generic scans over every `.vue`/source file in `packages/starter/src/`, so `RadioGroup.vue` is automatically covered with no new test needed; listed so their continued pass isn't mistaken for "no coverage" of this story.
- `publicApiSurface.test.ts`: exact-list assertion; must be updated to add `'RadioGroup'` to the internal-chrome list (see AC9 above).
- `prototypeParity.test.ts`: scoped only to FEAT-007's prototype inventory, not FEAT-014's `prototype.html`. A drift between the shipped `.sft-radio-*` CSS and the FEAT-014 prototype's `#radio` anchor is not automatically caught by it. This is a pre-existing gap (not introduced by this story, and not fixed by ST-01/ST-02 either); flagged as a possible follow-up, not a blocker here.
- ST-02 (Textarea): no shared runtime code path, but both stories touch `StarterFormTemplate.vue` and `style.scss`; a clean merge of the two is `pnpm typecheck`/`pnpm lint`'s job, not a new test.

### Manual verification checklist
- In a real browser (Storybook), tab onto a radio group and press the arrow keys: confirm native roving selection moves between options, since jsdom does not implement this browser-native behavior (see Untestable section below).
- Visually confirm the 2px sky focus outline and its rose swap on an invalid group, in both light and dark mode, against `prototype.html#radio`.
- Visually confirm the sky accent (not indigo) on `is-selected` reads as visually distinct from a neighboring `DynamicFormItemChoice` card, in both color modes.
- Confirm `docs/guide/starter-template.md`'s new `radio` row renders correctly on the built VitePress preview, and `packages/starter/README.md`'s updated slots table renders correctly on GitHub's/npm's README view.

### Untestable / underspecified acceptance criteria
- AC2 bundles two different claims: the `name`-attribute wiring (testable, see AC2 tests above) and the resulting native arrow-key roving focus (a real browser behavior jsdom does not implement, so no automated test can simulate it; moved to the manual verification checklist). No rewrite is needed, the AC's two halves just land in different test tiers.
- AC6's "2px sky outline (rose when the field is invalid)" is verified at the CSS-rule-text level (the compiled stylesheet contains the right selector/token pairing), not by rendering real focus and reading computed pixel values, which jsdom cannot do. This is the same limit `classUsage.test.ts`/`prototypeParity.test.ts` already accept for this codebase's other focus-ring assertions. Not a rewrite, stated so the assertion's actual strength is clear.
- No other acceptance criterion is untestable as written.

### Open questions
- ~~AC6 specifies a 3px sky focus outline...~~ **DECIDED (research), resolved during story prep:** 2px, not 3px. Checked against `packages/starter/src/style.scss` (every actual focus rule in the package uses `2px`) and the feature's own `prototype.html#radio`/`#textarea` anchors (both 2px in CSS, "3px" only in prose captions). This is a factual correction, not a tradeoff: it needs no fact only Jeroen has, and it doesn't contradict any approved design decision, it corrects a typo that was already present in FEAT-007's archived spec and copied forward into this feature's states policy (now also corrected there). AC6 above and the rest of this story are updated to 2px throughout.

## Adversarial review
Lite, story level: blockers only, plus the focus-ring Open question the reviewer was asked to verify against the real code and prototype.

Checks that held up (stated so they are not re-litigated):
- Every acceptance criterion AC1-AC10 is mapped in the QA plan's "Acceptance criteria to tests" section. AC2's native arrow-key roving focus is correctly split off to the manual checklist (a real-browser behavior jsdom cannot simulate); the testable `name`/`id` half stays in `RadioGroup.test.ts`.
- Consistent with the approved feature: implements ADR-2 (radio is a rendering of `options`, not a `choice`), Slicing seam 3, and the findings 1/4 `id`/`name` resolution. The sky-accent-not-indigo call (AC5) matches the prototype (`.sft-radio-option.is-selected { border-color: var(--sft-accent); }`, prototype.html:267) and the feature design.
- Dependencies: none, matching the scrum-master's split and the architecture's "Dependencies on other stories: none".

1. **AC6's "3px" focus ring contradicts both the package convention and the feature's own prototype. (should-fix)** Verified directly against the code rather than the QA plan's word. The real shipped convention is a **2px** ring everywhere: `.sft-input:focus` / `.sft-select:focus` use `box-shadow: 0 0 0 2px var(--sft-focus-ring)` (`packages/starter/src/style.scss:356`), the invalid-focus variant uses `box-shadow: 0 0 0 2px var(--sft-danger-ring)` (`:370`), and the switch track focus uses `outline: 2px solid` (`:537`). The feature's shipped `prototype.html#radio` already draws the radio focus rule as `.sft-radio-input:focus-visible + .sft-radio-control { outline: 2px solid var(--sft-focus-border); outline-offset: 2px; }` (`prototype.html:280`) and its textarea `:focus` as a 2px box-shadow (`prototype.html:246`). No rule anywhere in the package or the prototype renders 3px. The "3px" originates only in prose: the feature's states-policy text and this story's AC6, and even the prototype's own textarea caption says "3px" (`prototype.html:374`) while shipping 2px CSS directly beneath it, which is the tell that "3px" is a copy-paste artifact, not a deliberate per-radio decision. Building AC6 to 3px would give the radio circle a focus ring 50% wider than every other control in the same form, a visible inconsistency.

   **DECIDED (research), adopted during story prep:** 2px, not 3px. This is a typo correction (evidence points one way, matches the existing codebase pattern, contradicts no approved design call), not a design tradeoff needing Jeroen, so it is settled rather than left as an Open question. AC6, the states policy subsection, the manual checklist, and the Untestable section above are all corrected to 2px; the parent feature spec's own states policy is corrected the same way.

2. **AC6's rose invalid-focus variant is undesigned at the feature level. (nit)** AC6 also requires the focus ring to swap to rose "when the field is invalid," but the prototype's `#radio` section has no invalid+focus cell and its radio CSS has no `.sft-radio-group.is-invalid ... :focus-visible` rule. The feature states-policy does state "invalid focus swaps to the rose ring" in general, so this is covered by policy, just never drawn for the radio. Not a blocker; the QA plan already leaves the exact selector "the developer's call."

3. **The QA plan's own claim that the tests "hold the developer to 3px" is not actually true. (nit)** The Open question asserts the mapped tests pin 3px, but AC6's mapped `RadioGroup.style.test.ts` only asserts the selector exists and reads the sky token, never the pixel width. So whatever number is chosen (2px or 3px), no automated test pins it, which weakens the Open question's stated reasoning. Worth noting so Jeroen does not assume a test will catch a wrong width.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

- `sft-radio-option`'s border-radius is hardcoded to `8px` with a TODO comment pointing at the FEAT-013 radius token, the same pattern ST-02's `sft-textarea` already uses: `packages/starter/src/style.scss` still has no `--sft-radius-*`/`--sft-font-*` tokens at implementation time, confirmed again before writing this story's CSS. No spec deviation, just confirming the documented fallback still applies.
- The invalid-focus outline swap (`.sft-radio-group.is-invalid .sft-radio-input:focus-visible + .sft-radio-control`) uses `var(--sft-danger-focus-border)`, not `--sft-danger-ring` (the token `.sft-input`'s invalid-focus box-shadow uses). The story's QA plan left the exact selector/token "the developer's call" (adversarial review finding 2, a nit). `--sft-danger-focus-border` was picked because it pairs with `--sft-focus-border` the same way the resting-vs-focus token pair already works for `.sft-input`, which reads cleaner on an `outline` property than reusing a box-shadow-flavoured ring token.
- `mountInForm`'s test fixture gained an exposed `setFieldValue`, extending the existing `values`/`validate` expose with no behavior change to prior callers, needed for the AC4 "no stale local-state copy" test that drives the model externally.
- Storybook: added a `radioExample`/`Radio` story (empty+required, pre-selected, disabled, with Submit surfacing the required error), screenshotted in both color modes, and manually verified native arrow-key roving focus end to end through to the submitted form value (`ArrowDown` from a focused option moved both the native `checked` state and the vee-validate model, confirmed via the story's live JSON preview).

## Verification report
Filled by qa-verifier after implementation.

### Pipeline
- `pnpm run ci:lint`: pass (core + starter).
- `pnpm run ci:typecheck`: pass (core + starter + storybook).
- `pnpm run ci:test`: pass, 581 starter tests (78 files), including all new radio test files; docs' own vitest suite also passes (unaffected).
- `pnpm -r ci:test:coverage`: pass. Starter: 99.69% stmts / 94.41% branch / 95.23% funcs / 99.69% lines. `RadioGroup.vue` itself: 100/100/100/100. Remaining uncovered lines across the package (`FormField.vue:54-57`, `StarterFormTemplate.vue:497-498,562-563`, `PasswordStrengthBar.vue`, `Stepper.vue`, etc.) are pre-existing and unrelated to the `number`-suffix/password blocks, not this story's code. Core package untouched by this story; its own coverage (98.47/92.93/98.37/98.47) is unaffected.

### Acceptance criteria

| AC | Description | Verdict | Evidence |
|---|---|---|---|
| 1 | Compiles/renders with no `extendMetadata`, reuses `options` | Pass | `radio: string` added to `StarterValueTypes` (`metadata.ts:17`), no new `StarterFieldProperties` group; `metadata.test.ts` "adds no StarterFieldProperties group for radio" (`expectTypeOf<'radio' extends keyof StarterFieldProperties ? true : false>().toEqualTypeOf<false>()`); `metadata.golden.ts` pins the key; `StarterFormTemplate.radio.test.ts` "compiles and renders with no extendMetadata step" |
| 2 | Native `id`/`name` fixes keyboard grouping and label association | Pass | `RadioGroup.vue`: `:name="id"` on every input, `:id="index === 0 ? id : undefined"` on the first only. `RadioGroup.test.ts` "shares one name across every option and gives only the first option a native id". `StarterFormTemplate.radio.logic.test.ts` confirms `label.sft-field-label[for=contactMethod]` resolves to a real rendered `input[type=radio]`, and no `aria-label`/`aria-labelledby` on `.sft-radio-group`. `FormField.vue` unmodified |
| 3 | Markup matches prototype structure | Pass | `RadioGroup.test.ts` "renders role=radiogroup with one label.sft-radio-option per option..." asserts `.sft-radio-group[role=radiogroup]` > `label.sft-radio-option` > `input.sft-radio-input[type=radio]` + `span.sft-radio-control > span.sft-radio-dot` + sibling `span.sft-radio-label` |
| 4 | Selection derived from value, never local state | Pass | `RadioGroup.vue` has no local ref; `:checked="value === option.key"`, `is-selected` class same condition. `RadioGroup.test.ts` "derives the checked option from the value prop..." (including a `setProps` re-render). `StarterFormTemplate.radio.logic.test.ts` "follows an externally driven value change with no stale local-state copy" drives `setFieldValue` (new `mountInForm` expose) and confirms the displayed selection follows |
| 5 | Sky accent, not indigo | Pass | `style.scss`: `.sft-radio-option.is-selected { border-color: var(--sft-accent); }`, `.sft-radio-dot { background: var(--sft-accent); }`; no `.sft-radio-*` block references `--sft-choice`. `RadioGroup.style.test.ts` asserts both |
| 6 | Keyboard focus and invalid states, 2px, rose when invalid | Pass | `style.scss:528-538`: `.sft-radio-input:focus-visible + .sft-radio-control { outline: 2px solid var(--sft-focus-border); outline-offset: 2px; }`; invalid variant swaps to `var(--sft-danger-focus-border)`; resting invalid circles use `var(--sft-danger-border)`. `RadioGroup.style.test.ts` covers all three rules. `StarterFormTemplate.radio.test.ts` "shows exactly one error line below the whole group, never per option" confirms the single, non-nested `sft-error` |
| 7 | `#radio-input` slot wired and overridable | Pass | `StarterFormTemplate.vue`: `'radio-input'` in `handledSlotNames`, `<template #radio-input="s">` wraps `RadioGroup` wired to `fieldContext`/`fieldMetadata`/`disabled`/`settings`-derived props. `StarterFormTemplate.radio.logic.test.ts` "replaces only the radio control when #radio-input is overridden" and the matching default-path test |
| 8 | Disabled state | Pass | `.sft-field.is-disabled { opacity: 0.6; }` (shared rule, same as every other control); `RadioGroup.vue` disables every native input and applies `is-disabled` per option. `RadioGroup.test.ts` + extended `StarterFormTemplate.disabled.logic.test.ts` "radio: disables every option" (both disabling sources) |
| 9 | Stays internal | Pass | No `RadioGroup` export in `index.ts`; `publicApiSurface.test.ts`'s `internalChrome` list includes `'RadioGroup'` |
| 10 | Documentation | Pass | `docs/guide/starter-template.md` gained a `radio` row noting the shared `options` property; `packages/starter/README.md`'s "Input, one per control" row gained `radio-input`; `readme.test.ts` asserts the latter. Manual VitePress/GitHub-render check: see Manual verification note below |

Edge cases: zero-option group (`RadioGroup.test.ts` + `StarterFormTemplate.radio.test.ts`), shared `options` array reused unreshaped between `select` and `radio` (`StarterFormTemplate.radio.test.ts`), no sub-fields possible by construction: all covered as planned.

### Findings 1 and 4 (native wiring), specifically checked
Read `RadioGroup.vue`: every option's `<input type="radio">` receives `:name="id"` (one shared value), and only `index === 0` receives `:id="id"`. This is exactly the one-prop, two-job wiring the architecture specified. `RadioGroup.test.ts`'s "shares one name across every option and gives only the first option a native id" test confirms both halves at the DOM level (`name` identical on every input, `id` present only on the first, `undefined` not an empty string on the rest). `StarterFormTemplate.radio.logic.test.ts` confirms the end-to-end path: `FormField`'s rendered `<label for="contactMethod">` resolves via `wrapper.find('#contactMethod')` to a real, rendered `input[type=radio]`, not a dangling reference, and no `aria-label`/`aria-labelledby` mechanism exists on `.sft-radio-group`. jsdom cannot execute real arrow-key roving focus (a user-agent behavior triggered purely by a shared `name` on grouped radio inputs with no extra JS), so that half is correctly left to the manual checklist; the Implementation notes record it was verified live in Storybook end to end into the submitted form value. Given the shared `name` is present and correct, and MDN documents shared `name` as the sole precondition for native roving/grouping, this is sufficient automated + manual coverage; no further live-browser check was needed beyond confirming the DOM wiring.

### Prototype comparison
Markup and classes (`sft-radio-group`, `sft-radio-option`, `sft-radio-input`, `sft-radio-control`, `sft-radio-dot`, `sft-radio-label`) match `prototype.html#radio` as drawn. Sky accent confirmed, not indigo. Focus ring corrected to 2px per the story's adopted research finding, matching the prototype's own CSS (not its stale "3px" prose) and the rest of the package's focus convention. Disabled dimming matches sibling controls' shared `.sft-field.is-disabled` rule. No Storybook screenshots were produced by this verification pass (none requested beyond what the developer already recorded); the developer's Implementation notes record a Storybook `radioExample` story screenshotted in both color modes and a live manual arrow-key check, which is accepted as the states-policy/dark-mode sign-off for this slice.

### Process compliance
- `specs/components.md`: starter entry updated with `RadioGroup`, `radio-input`, the `sft-radio-*` class list, and the id/name wiring description. Confirmed present.
- Library API rules: no new export added (`RadioGroup` stays internal); `radio: string` is the only new public-surface addition, camelCase, additive; no new consumer-facing channel introduced beyond the established `<type>-input` slot pattern.
- No `:style`/inline style bindings in `RadioGroup.vue` or the new `style.scss` rules.
- Sky accent (`--sft-accent`) used throughout, indigo (`--sft-choice`) never referenced in any `.sft-radio-*` block, confirmed by `RadioGroup.style.test.ts`.
- Changeset: correctly absent. The story explicitly defers the single feature changeset to ST-04; no `packages/core/src/` change in this story either.
- Deviations recorded in Implementation notes (hardcoded `8px` radius with a FEAT-013 TODO, `--sft-danger-focus-border` token choice, `mountInForm`'s new `setFieldValue` expose) are all within the story's or an explicitly-left-open design slack (adversarial review finding 2 left the exact invalid-focus selector/token "the developer's call"); none contradicts an approved feature decision, and none required a feature-spec amendment.
- Test naming follows repo convention (`*.test.ts`, `*.logic.test.ts`, `*.analytics.test.ts`, `*.style.test.ts`); no spec/story IDs referenced in test names or component comments.

### Overall verdict: pass

### For Jeroen
Please link the PR in this story's `pr:` frontmatter field. This is one of several FEAT-014 stories (ST-01, ST-02, ST-03, and possibly others) implemented together in one pass; check whether the sibling stories have also reached `done` before moving the parent feature to `done` (ST-04 and ST-05 still carry open work, including the feature's single changeset, so the feature itself is not yet ready to close).
