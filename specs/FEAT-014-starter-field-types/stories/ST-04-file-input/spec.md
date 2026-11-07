---
id: ST-04
type: story
feature: FEAT-014
status: approved
approved_by: Jeroen
pr: ""
---

# Story: FileInput field type

## Functional
### User story
As a metadata author building a form with `@bach.software/vue-dynamic-form-starter`, I want a built-in `file` field type for single-file uploads (a resume, an attachment) with a styled trigger, a filename display, and a clear action, so that users can attach a document without me hand-building an uncontrolled file control myself.

### Acceptance criteria

1. **`file` compiles and renders with no `extendMetadata` step.**
   Given a metadata node `{ name: 'resume', type: 'file', fieldOptions: { label: 'Resume' }, file: { accept: '.pdf,.doc,.docx' } }` typed against `starterMetadata`,
   When the project is type-checked and the form renders,
   Then it compiles with no wrapper, and the field renders through a new `file-input` slot into a `FileInput.vue`; `StarterValueTypes` maps `file` to `File | undefined`.

2. **`StarterFieldProperties` gains the `file` group with the decided defaults.**
   Given `StarterFieldProperties`,
   When inspected,
   Then it declares `file?: { accept?: string, clearAriaLabel?: string }`, both optional; `accept` forwards verbatim to the native input's `accept` attribute when set, and `clearAriaLabel`'s default interpolates the current filename (e.g. `"Remove jeroen-bach-resume.pdf"`), not a static string, per `DECIDED (Jeroen)`.

3. **The native input is visually hidden and triggered by a styled label.**
   Given `FileInput.vue`,
   When rendered,
   Then the native `<input type="file" class="sft-file-native">` is visually hidden, and a `<label class="sft-btn sft-btn-default sft-file-trigger">` triggers it, reading "Choose file" when no file is held and "Change file" once one is.

4. **Displayed filename is derived from the model, never from local state.**
   Given a `file` field whose model value is a `File` (set by user selection, `resetForm`, `resetField`, or `setFieldValue`),
   When rendered,
   Then `.sft-file-name` shows `fieldContext.value.value?.name`; when the model is `undefined` it shows a muted `is-empty` "No file chosen" placeholder. No component-local `ref<File>` or filename copy exists anywhere in the component, per the ratified ADR-3.

5. **Clear button resets the model and the native input together.**
   Given a `file` field with a chosen file,
   When the `.sft-file-clear` button is clicked,
   Then `handleChange(undefined)` is called, and a `watch` on `fieldContext.value` reacts to the value dropping to `undefined` by imperatively setting the native input's own `value` to `""`, so the same file can be re-selected immediately after.

6. **External model resets stay in sync with the native input.**
   Given a `file` field holding a `File`,
   When `resetForm`, `resetField`, or `setFieldValue(undefined)` is called externally (not through the component's own clear button),
   Then the displayed filename updates to the placeholder (AC4, since it reads the model directly) and the same `watch` from AC5 clears the native input's stale `value`, so no dangling browser-held file reference survives a programmatic reset.

7. **Keyboard focus is visible.**
   Given the native file input receives keyboard focus (e.g. via `Tab`),
   When inspected in both light and dark mode,
   Then `.sft-file-native:focus-visible` (or `:focus-within` on the trigger label) paints the same sky focus ring the textarea uses on its visible trigger, resolving the feature's adversarial-review finding 2 (no state is left undesigned).

8. **Invalid and disabled states match the feature's states policy.**
   Given an invalid `file` field,
   When rendered,
   Then the danger border lands on the trigger button (not the hidden native input), with exactly one `sft-error` line below the whole control; given a disabled `file` field, the whole `sft-field` dims to 60% and the trigger becomes inert (no click triggers the native picker).

9. **`xsd_required` already treats `File`/`undefined` correctly, with no `validation.ts` change.**
   Given a required `file` field (`minOccurs: 1` or an explicit `xsd_required` restriction) with no value,
   When validated,
   Then it fails required; once a `File` is set, it passes; no change to `packages/core/src/core/validation.ts` is made, confirmed by a test exercising the existing rule against both states.

10. **`#file-input` slot is wired and overridable.**
    Given `StarterFormTemplate.vue`,
    When inspected,
    Then `'file-input'` is added to `handledSlotNames`, and a new `<template #file-input="s">` block wraps `<slot name="file-input" v-bind="s">` whose default content is `FileInput.vue`, wired to `s.fieldContext`/`s.fieldMetadata`/`s.disabled`/`s.settings`; a consumer-supplied `#file-input` slot fully replaces it.

11. **Stays internal.**
    Given `packages/starter/src/index.ts`,
    When inspected,
    Then `FileInput.vue` is not exported.

12. **Documentation reflects the new type.**
    Given `docs/guide/starter-template.md`'s field-types table and `packages/starter/README.md`'s "Supported slots" table,
    When this story ships,
    Then the guide gains a `file` row noting the `file.accept`/`file.clearAriaLabel` properties and the single-file (`File | undefined`) value shape, and the README's "Input, one per control" row gains `file-input`.

13. **The feature's single changeset is added.**
    Given `.changeset/`,
    When this story completes,
    Then one `minor`-bump changeset exists for `@bach.software/vue-dynamic-form-starter`, written business-purpose-first (the starter now ships textarea, radio, file upload, and the common HTML5 input modes out of the box), with sub-bullets covering `textarea` (ST-02), `radio` (ST-03), the HTML5 text-mode batch and `number` bounds (ST-01), and `file` (this story), per the feature architecture's "one feature/one changeset" call.

### Edge cases
- Picking a second file without clearing first: the native `change` event fires again, the model updates to the new `File`, and the displayed name updates; no manual clear step is required.
- `file.accept` unset: the native input has no filter, any file type is selectable, matching today's unfiltered default.
- A `file` field with no description and no error renders identically to every other leaf field's pristine chrome (label, optional/required tag), beyond the trigger/name/clear row itself.

### Out of scope
- Multi-file selection, drag-and-drop, and preview thumbnails: deferred to a later, additive feature (`file.multiple`), per `DECIDED (Jeroen)` Open question 3.
- `textarea`, `radio`, the type-only HTML5 batch: ST-02, ST-03, ST-01.
- The `docs/examples/extending-starter.md` collision fix: ST-05.

## Design reference
Implements the feature's [Design (feature level)](../../spec.md#design-feature-level) "FileInput" paragraph and prototype anchor [`#file`](../../prototype.html#file), with two explicit deltas from the prototype's own copy, both already ratified in the feature spec rather than left open here:
1. The displayed filename is derived from the model (`fieldContext.value.value?.name`), not component-local state, per the ratified ADR-3, which supersedes the prototype's "component's own local state" wording.
2. A keyboard focus treatment is added (AC7) even though the prototype's `#file` section has no focus cell, per the `DECIDED (research)` resolution of adversarial-review finding 2.

## Architecture reference
Implements the feature architecture's Slicing seam 4, ADR-3, ADR-4, and the "FileInput" component bullet, data flow diagram, and `file` `StarterFieldProperties` group in full:

- **`FileInput.vue` (new, internal, slot `file-input`).** The one uncontrolled control. Markup per AC3; filename display per AC4; clear/reset wiring per AC5-6; focus styling per AC7. Owns the exact `handleChange`/`watch` wiring described in the feature's Data flow mermaid diagram.
- **`packages/starter/src/style.scss` (modified).** Add `sft-file`, `sft-file-native`, `sft-file-trigger`, `sft-file-name` (+ `is-empty`), `sft-file-clear` rules, reusing the existing `sft-btn`/`sft-btn-default` classes for the trigger, using FEAT-013's `--sft-radius-*`/`--sft-font-*` tokens if present in the tree at implementation time, or today's literal values with a flagged follow-up if they are not yet shipped (per the feature's Constraints & assumptions).
- **`packages/starter/src/metadata.ts` (modified).** Add `file: File | undefined` to `StarterValueTypes`; add the `file?: { accept?: string, clearAriaLabel?: string }` group to `StarterFieldProperties` per AC2.
- **`packages/starter/src/StarterFormTemplate.vue` (modified).** Add `'file-input'` to `handledSlotNames`; add a `<template #file-input="s">` block (the one bespoke-wiring block among the three new slots, per the feature architecture) rendering `FileInput.vue` wired to `s.fieldMetadata.path`/`file`, `s.fieldContext`, `s.disabled`.
- **Public API surface touched:** one new `StarterValueTypes` key (`File | undefined`), one new optional `StarterFieldProperties` group, one new internal component, one new named slot (`file-input`, additive). No export.
- **Dependencies on other stories:** none on other field-type stories; carries OQ3's decided value shape.
- **Changeset:** carried here, covering the whole feature (AC13), since this is the last of the four functional slices in implementation order.
- **Documentation:** this story owns `docs/guide/starter-template.md`'s new `file` row and `packages/starter/README.md`'s "Supported slots" table addition of `file-input` (AC12). `specs/components.md`'s starter entry gains `FileInput.vue`/`file-input`/the `sft-file-*` classes and the `file` group property to its internal-chrome and slot-family lists (developer's job at implementation time, on top of the corrections and additions ST-01-03 already made).

## QA plan

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 `file` compiles and renders with no `extendMetadata` step, into `file-input` → `FileInput.vue` | Mount `{ name: 'resume', type: 'file', fieldOptions: { label: 'Resume' }, file: { accept: '.pdf,.doc,.docx' } }` typed against `starterMetadata` (no `extendMetadata`); assert a `FileInput` component renders inside the field and `StarterValueTypes['file']` is `File \| undefined` at the type level | `StarterFormTemplate.file.test.ts` (render), `metadata.test.ts` (type, via the golden-file-driven equality tests once `metadata.golden.ts` is updated, see Fixtures below) |
| 2 `StarterFieldProperties.file` group with the decided defaults (`accept` forwarded verbatim; `clearAriaLabel` default interpolates the filename) | Type-level: `StarterFieldProperties['file']` shape via the golden equality tests. Runtime: mount with no `file.clearAriaLabel` and a chosen file named `jeroen-bach-resume.pdf`, assert the clear button's `aria-label` is `"Remove jeroen-bach-resume.pdf"`; mount with an explicit `file.clearAriaLabel` and assert it wins; mount with `file.accept` set and assert the native input's `accept` attribute equals it verbatim, and unset, assert the attribute is absent | `metadata.test.ts` (type), `FileInput.test.ts` / `FileInput.logic.test.ts` (runtime defaults) |
| 3 Native input visually hidden, styled `<label>` trigger, "Choose file"/"Change file" text | Mount `FileInput.vue` directly: assert `.sft-file-native` exists with `type="file"` and is visually hidden (the class carries the hiding rule, asserted against the compiled stylesheet, not a jsdom layout check); assert `.sft-file-trigger` is a `<label class="sft-btn sft-btn-default">`; assert its text is "Choose file" with no value and "Change file" once one is set | `FileInput.test.ts` |
| 4 Displayed filename derived from the model, never local state | Mount with `value` set to a `File`, assert `.sft-file-name` shows `file.name`; mount with `value` undefined, assert `.sft-file-name.is-empty` shows "No file chosen"; a source-level check (see Regression risk) that no `ref<File>`/local filename copy exists in `FileInput.vue`. PROPOSED (adversarial review): the "(see Regression risk)" pointer resolves to nothing (the Regression risk section lists no such grep/source check), so this clause currently maps to a test that does not exist. Resolve it the same way AC9 handles the `validation.ts` diff: state the "no local `ref<File>`" clause is a code-review/diff concern, not a standing test. The *behavioural* consequence (a stale filename surviving a reset) is already fully guarded by AC6's three reset-path tests, which would fail if a stale local copy existed, so no coverage is actually lost by dropping the phantom source check. | `FileInput.test.ts` |
| 5 Clear button calls `handleChange(undefined)` and the native input's own `value` resets so the same file is re-selectable | Mount with a file selected, click `.sft-file-clear`, assert the emitted change/`handleChange` call received `undefined` and that the native `<input>` element's own `.value` property is `""` afterwards (so a second `selectFile` with the identical filename fires `change` again and updates the model, proving it isn't blocked by the browser's own no-op-on-same-value guard) | `FileInput.logic.test.ts` |
| 6 External `resetForm`/`resetField`/`setFieldValue(undefined)` keep the displayed filename and the native input in sync | Full-stack test: select a file, then drive each of the three reset paths externally (not via the clear button) and assert after each one that `.sft-file-name` shows the placeholder again and the native input's `.value` is `""` | `StarterFormTemplate.file.logic.test.ts` |
| 7 Keyboard focus is visible on the trigger (WCAG 2.4.7) | (a) Compiled-stylesheet assertion: a `.sft-file-native:focus-visible + .sft-file-trigger` (or `:focus-within` on the trigger label) rule exists and references the same sky ring value/variable `.sft-textarea:focus` uses, plus a rose variant when invalid. PROPOSED (adversarial review): assert the file focus rule references the shared `--sft-focus-ring` token directly, not that its value equals what `.sft-textarea:focus` resolves to. As written this couples the test to ST-02's `.sft-textarea:focus` rule existing in the compiled stylesheet, which contradicts this story's "no dependencies on other field-type stories" claim: run ST-04 before ST-02 and the `.sft-textarea:focus` comparison target is simply absent and the assertion breaks for a reason unrelated to FileInput. Asserting the token keeps the parity guarantee (the feature's finding-2 fix is literally "the same sky ring the textarea uses", i.e. `--sft-focus-ring`) with no cross-story ordering coupling; (b) jsdom structural check: focus the native input element directly, assert `document.activesElement` is that input and the wrapping/adjacent trigger label element matches `:focus-within`, proving the selector's structural target is reachable. Pixel-level "same ring, both color modes" is manual (see checklist), the same limitation FEAT-011's focus-visible story already documented for jsdom | `StarterFormTemplate.file.test.ts` (stylesheet half), `FileInput.test.ts` (DOM structural half) |
| 8 Invalid state: danger border on the trigger (not the hidden native input), one `sft-error` line below the whole control. Disabled state: `sft-field` dims to 60%, trigger inert | Extend the existing `describe('component StarterFormTemplate - optional/required tag and error message states')` pattern (mirroring its checkbox case) with a `file` case: required+empty, validate, assert `.sft-file-trigger` (not `.sft-file-native`) carries the invalid class and exactly one `.sft-error` renders below the control. Extend the existing `describe.each(sources)` disabled-state suite (mirroring its password/checkbox cases) with a `file` case: assert `.sft-field` carries `is-disabled` and that clicking `.sft-file-trigger` while disabled does not fire a native `change`/does not call `handleChange` | `StarterFormTemplate.validation.test.ts` (extended), `StarterFormTemplate.disabled.logic.test.ts` (extended) |
| 9 `xsd_required` already treats `File`/`undefined` correctly, no `validation.ts` change | Full-stack test against the real registered rule (not a mock): required `file` field with no value, `validate()`, assert the required error shows; set a `File` value, `validate()` again, assert no error. A second assertion that `packages/core/src/core/validation.ts` is unmodified is a source-diff/review concern, not a test | `StarterFormTemplate.file.validation.test.ts` |
| 10 `#file-input` slot wired, overridable | Default-rendering assertion (`FileInput` renders when no override is supplied, wired to `fieldContext`/`fieldMetadata`/`disabled`/`settings`) plus an override test using `createConsumerWrapper({ overrides: { 'file-input': ... } })` asserting the consumer's markup fully replaces `FileInput`, mirroring the existing `richText-input` override test | `StarterFormTemplate.file.test.ts` (default), `StarterFormTemplate.file.logic.test.ts` (override, alongside `StarterFormTemplate.overrides.logic.test.ts`'s existing pattern) |
| 11 Stays internal (not exported) | Add `'FileInput'` to the `internalChrome` list in the existing "never exports an internal chrome component" test | `publicApiSurface.test.ts` (extended) |
| 12 Documentation reflects the new type | README half: extend `readme.test.ts` (or a sibling assertion) to confirm the "Supported slots" table/section contains `file-input`. Guide half (`docs/guide/starter-template.md`'s field-types table, the `file.accept`/`file.clearAriaLabel` note, the `File \| undefined` value shape note) is prose with no automated harness in this workspace (docs/ is excluded from `pnpm -r ci:test:coverage`, and its own minimal vitest setup only covers framework-free `.ts` modules); verified manually (see checklist) | `readme.test.ts` (extended, README half only) |
| 13 One `minor` changeset covering all four functional slices, business-purpose-first | No automated test: a changeset's prose is reviewed for content and framing, not asserted against a fixed string. Verified manually against `CLAUDE.md`'s changeset rule (see checklist) | Manual (checklist) |

### Edge cases to tests
- Picking a second file without clearing first: in `FileInput.logic.test.ts`, fire a `change` event with file A, then fire another `change` with file B with no clear step in between; assert the model and `.sft-file-name` update to file B with no error.
- `file.accept` unset: in `FileInput.test.ts`, mount with no `file` property at all and assert the native input has no `accept` attribute.
- Pristine chrome (no description, no error) renders identically to every other leaf field: not a bespoke test, it rides on `FormField.vue`'s existing generic chrome tests, since `FileInput` introduces no new `FormField` code path (same reasoning other field types rely on; none of them duplicate this check per type either).

### Fixtures and new test utilities needed
- **`fixtures/metadata.ts`**: add a `fileMetadata` fixture, `{ name: 'resume', type: 'file', fieldOptions: { label: 'Resume' }, file: { accept: '.pdf,.doc,.docx' } }`, matching the pattern of `passwordMetadata`/`checkboxMetadata`.
- **`metadata.golden.ts`**: mandatory update, not optional. Add `file: File | undefined` to `GoldenValueTypes` and the `file?: { accept?: string, clearAriaLabel?: string }` group to `GoldenFieldProperties`. Without this, `metadata.test.ts`'s existing `expectTypeOf<keyof StarterValueTypes>().toEqualTypeOf<BuiltInType>()` and the key-by-key equality tests fail to typecheck once `file` is added to `StarterValueTypes`/`StarterFieldProperties`; this is the project's existing mechanism for catching exactly this story's AC1/AC2 drift, not a new fixture to build.
- **A `selectFile(input, name, type?)` test helper** (new, e.g. `fixtures/fileHelpers.ts`): wraps the standard jsdom pattern for simulating a file pick (`Object.defineProperty(input.element, 'files', { value: [new File(['x'], name, { type })] })` then `input.trigger('change')`), reused across `FileInput.test.ts`, `FileInput.logic.test.ts`, and the `StarterFormTemplate.file.*` tests to avoid duplicating the boilerplate four times.
- **`mountInForm` extended, additively**: it currently exposes only `{ wrapper, values, validate }`. AC6 needs `setFieldValue`, `resetForm`, and `resetField` from the same underlying `useDynamicForm()` instance. Expose them alongside the existing three (same pattern core's `DynamicFormItem.formApi.test.ts` uses for its own host component); existing destructuring call sites are unaffected since this is purely additive.
- **`createConsumerWrapper`** (existing, unchanged): reused as-is for the AC10 override test.
- **`compiledStylesheet`** (existing, unchanged): reused for the AC3/AC7 stylesheet-level assertions.

### States from the feature's states policy applicable to this slice
- **Pristine/empty**: `.sft-file-name.is-empty` showing "No file chosen"; this is the resting state, not a separate empty-state card (the states policy explicitly says so for this control).
- **Filled**: a chosen `File`'s name shown, clear button present.
- **Invalid**: danger border on `.sft-file-trigger` (never the hidden native input), exactly one `.sft-error` line below the whole control.
- **Focus**: sky ring on the trigger, surfaced from the hidden native input via `:focus-visible`/`:focus-within`; rose when invalid.
- **Disabled**: `.sft-field` dims to 60%, trigger is inert (no native picker on click).
- **Valid/success**: deliberately absent, per the states policy; add an assertion (alongside the existing "never shows a success/valid class" test) that a filled, error-free `file` field's HTML never matches `/is-valid|is-success/`.
- **Loading**: not applicable, no per-field spinner for this control.

### Reactivity / analytics
`FileInput` is wired through `DynamicFormItem`'s `fieldContext` (value/handleChange/handleBlur) and introduces a `watch` that imperatively resets the native input's `value` when the model drops to `undefined`. That watch is a DOM-only side effect (it does not write to any reactive ref), so it should not itself cause an extra render, but this is exactly the kind of regression a consumer would otherwise catch by surprise, so it gets a render-count assertion rather than relying on code review alone:
- Add `['file', { type: 'file' }]` to the existing parametrized `fieldTypes` array in `StarterFormTemplate.analytics.test.ts`, giving `file` the same generic guarantee every other type already gets: renders once on mount, and a sibling text field's edits never re-render it.
- A dedicated `StarterFormTemplate.file.analytics.test.ts` asserting the `file` field's own render count increases by exactly one per external change (select a file: count goes from 1 to 2; clear it: count goes from 2 to 3), never by two, which would indicate the clear-triggered native-value watch is cascading into a second reactive update.

### Coverage
No code path in this story is knowingly left without a unit/component test. Explicitly left uncovered, by nature rather than by choice, with no statement/branch/function coverage impact because no app logic backs them:
- The actual OS file-picker dialog triggered by clicking the trigger label (browser-only behavior; tests confirm the label/native-input association and the structural `change`-event wiring instead, via the `selectFile` helper).
- The native `accept` attribute's real filtering behavior in the OS picker (forwarded verbatim with no app logic; tests confirm only that the attribute value matches `file.accept`).
- The exact pixel rendering of the focus ring and the 60% disabled dimming in both color modes (covered structurally, confirmed visually via the manual checklist).

Running `pnpm -r ci:test:coverage` after this story should show the baseline unchanged or improved; nothing here should cause it to drop.

### Time sensitivity
None. No date/time-dependent behavior anywhere in this story.

### Regression risk
- `StarterFormTemplate.vue`, `metadata.ts`, and `metadata.golden.ts` are touched independently by all four of ST-01/02/03/04; the existing full-template suites (`StarterFormTemplate.test.ts`, `.logic.test.ts`, `.validation.test.ts`, `.disabled.logic.test.ts`, `.analytics.test.ts`) and `metadata.test.ts`'s golden-file equality tests are the guard that this story's additions do not retype or drop another story's entries. Since all four stories edit `metadata.golden.ts` concurrently, whichever lands last should re-run `metadata.test.ts` after merging to confirm no accidental overwrite of a sibling story's golden entry.
- `packages/core/src/core/__tests__/validation.test.ts` (untouched by this story) remains the deepest guard that `xsd_required`'s semantics did not shift; AC9 explicitly forbids a `validation.ts` change, and this story's own validation test only proves the existing rule still behaves correctly against the new `File`/`undefined` shape, not that the rule itself is unchanged (that is a diff-review concern).
- `classUsage.test.ts`, `noScopedStyle.test.ts`, and `noTailwind.test.ts` automatically extend to `FileInput.vue` once it exists, guarding the new component against the same conventions every other starter component already follows, with no story-specific test needed.
- `publicApiSurface.test.ts` and `index.test.ts` guard against `FileInput` accidentally becoming a public export (AC11); update the former's `internalChrome` list as noted above or the guard silently stops covering this component.
- No `packages/core/src/` file changes in this story; core's own test suite (`DynamicFormItem`, `DynamicFormTemplate`, `validation.test.ts`) is unaffected and needs no re-verification beyond the existing CI run.
- `prototypeParity.test.ts` currently only checks the FEAT-007 prototype's class inventory against the shipped stylesheet; it has no equivalent check yet for FEAT-014's own `prototype.html`. Recommend this story add a small `describe` block (modeled on FEAT-011 ST-02's extension of the same test, or a new sibling test) that extracts the `#file` section's `sft-file-*` classes from FEAT-014's prototype and asserts each has a matching rule in the compiled stylesheet, so the new control gets the same prototype-parity guard every other shipped slice has.

### Untestable criteria and rewrite proposals
No acceptance criterion needs rewriting; all thirteen are testable as written once split into their automatable and manual halves:
- **AC7**'s "in both light and dark mode" visual confirmation of the focus ring is not jsdom-testable (no color-math or paint engine), the same limitation FEAT-011's focus-visible story already documented. The structural half (selector exists, references the right ring token, the DOM relationship resolves via `:focus-within`) is automated; the pixel-level color-mode confirmation is manual (checklist item 1).
- **AC12**'s guide-page half (`docs/guide/starter-template.md`) is prose with no automated harness in this workspace; the README half is a lightweight content guard, the guide half is manual (checklist item 2).
- **AC13** (the changeset) is a one-off content review, not something a standing test should assert against fixed prose; manual (checklist item 3), per `CLAUDE.md`'s existing release-process gate.

### Manual verification checklist
1. Screenshot the `file` field's focus state on the trigger in both light and dark mode (Playwright, per `CLAUDE.md`), confirming the sky ring (rose when invalid) visually matches the textarea's ring.
2. Review the rendered `docs/guide/starter-template.md` field-types table and `packages/starter/README.md`'s "Supported slots" table for the new `file` row/entry, confirming it documents `file.accept`, `file.clearAriaLabel`'s filename-interpolated default, and that the value shape is `File | undefined` (single file only).
3. Confirm the one changeset added under `.changeset/` is `minor` for `@bach.software/vue-dynamic-form-starter`, written business-purpose-first, with a sub-bullet covering `file` alongside the other three slices (AC13), per `CLAUDE.md`'s changeset-writing rule.
4. In a real browser, click the styled trigger label and confirm it actually opens the native OS file picker (the one piece of behavior no jsdom test reaches), then pick a file and confirm the filename appears and the clear button works.
5. Confirm `specs/components.md`'s starter entry gains `FileInput.vue`, the `file-input` slot, the `sft-file-*` classes, and the `file` group property, per the Architecture reference's developer-owned documentation note.

## Adversarial review
Lite, story level: blockers only, plus a few routed should-fixes. Checked each AC for testability and QA mapping, consistency with the approved FEAT-014 design/architecture, and the "no dependencies" claim. Factual spot-check: `xsd_required` is `value !== null && value !== undefined && value !== ''` in `packages/core/src/core/validation.ts:34`, so a `File` reads as present and `undefined` as absent, confirming AC9 is sound and testable with no `validation.ts` change. All 13 ACs appear in the AC-to-test map; edge cases, states, analytics and the manual halves (AC7 color-mode, AC12 guide, AC13 changeset) are correctly scoped.

1. **AC4's "no local `ref<File>`" verification cites a check that does not exist. (should-fix, routed PROPOSED)** The AC4 QA row defers the "no component-local state" clause to "a source-level check (see Regression risk)", but the Regression risk section defines no such grep/source test (it covers `classUsage`/`noScopedStyle`/`noTailwind`/`publicApiSurface`/`prototypeParity` only). So one-third of AC4 maps to a non-existent test. The behaviour it protects (a stale filename surviving `resetForm`/`resetField`/`setFieldValue`) is already fully covered by AC6's three reset-path tests, so no real coverage is lost. Resolution PROPOSED in the AC4 row: treat it as a code-review/diff concern exactly as AC9 treats the `validation.ts` diff, rather than citing a phantom test.

2. **AC7's focus-ring stylesheet test couples to ST-02's `.sft-textarea:focus`, contradicting "no dependencies". (should-fix, routed PROPOSED)** The AC7 QA row asserts the file focus rule "references the same sky ring value/variable `.sft-textarea:focus` uses". The story and the feature architecture both state ST-04 has no dependency on the other field-type stories and the four may ship in any order. But `.sft-textarea` only exists once ST-02 ships, so running ST-04's suite first makes the comparison target absent and the test fails for a reason unrelated to FileInput. The feature's finding-2 fix is "the same sky ring the textarea uses", i.e. the shared `--sft-focus-ring` token. Resolution PROPOSED in the AC7 row: assert the file rule references `--sft-focus-ring` directly, keeping the parity guarantee without cross-story ordering coupling.

3. **AC8's disabled-trigger assertion is weak in jsdom. (nit)** The QA asserts "clicking `.sft-file-trigger` while disabled does not fire a native `change`/does not call `handleChange`". Clicking a `<label>` never fires `change` in jsdom regardless of the disabled state, so the assertion can pass even if the control is not actually inert. Prefer asserting the native input carries `disabled` (and that the field carries `is-disabled`), which is what actually makes the trigger inert; the no-`change`-on-click check adds little on top. Not blocking.

Status: no Open questions at story level (the parent feature's six are all DECIDED), no blockers, and both should-fixes are routed as PROPOSED edits in the relevant QA rows. By the mechanical rule this lands at `awaiting-approval`.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
