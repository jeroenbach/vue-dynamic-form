---
id: ST-01
type: story
feature: FEAT-011
status: done
approved_by: Jeroen
pr: ""
---

# Story: Label, description, and error association across all controls

## Functional
### User story
As a screen-reader user filling in a form built on the starter template, I want every input's label, help text, and validation error programmatically associated with the control, and a validation error announced as it appears, so that I hear the full context for a field, not just a bare input, and I am told immediately when something I entered is invalid.

### Acceptance criteria
1. **Error message carries an id and announces itself.**
   Given `ErrorMessage.vue` rendering a non-empty error,
   When it mounts or its text changes,
   Then the element has `role="alert"` and, when an `id` prop is supplied, renders that `id` on the element; when no `id` is supplied it renders exactly as today (no `id` attribute).

2. **Description and error ids are deterministic and only emitted when present.**
   Given `FormField.vue` wrapping a field with `fieldMetadata.path`,
   When the field has a description and/or an active error,
   Then the description `<p>` gets `id="${inputId}-desc"` only when a description exists, and `ErrorMessage` gets `id="${inputId}-error"` only when an error exists; no dangling id is rendered for a part that is not present.

3. **`aria-describedby` chains description then error, omitting absent parts.**
   Given `StarterFormTemplate.vue` composing the attribute for `text`, `select`, and `password` input slots,
   When it builds `aria-describedby` for a field at `path`,
   Then the value is `"<path>-desc <path>-error"` when both exist, `"<path>-desc"` or `"<path>-error"` when only one exists, and the attribute is omitted entirely when neither exists; the string reaches the native control through the existing `$attrs` passthrough.

   PROPOSED (adversarial review, finding 2): the `#default-input` slot renders `TextInput` in **two** branches, the `sft-input-suffix-row` variant (when `fieldMetadata.suffix` is set, e.g. currency/percentage number fields) and the plain `v-else` variant. Both must receive the composed `aria-describedby`, or a suffixed field silently loses the association. The AC4 test matrix should include one suffixed field so the suffix branch is exercised, not only the plain branch.

4. **`aria-invalid` and `aria-describedby` reach `TextInput`, `SelectInput`, and `PasswordInput`.**
   Given a field rendered via each of the three input slots with an active validation error,
   When the DOM is inspected,
   Then the native `<input>`/`<select>` carries `aria-invalid="true"` (already wired, verified unchanged) and `aria-describedby` including the `-error` token from AC3.

5. **`ToggleSwitch` and `CheckboxField` gain the same `aria-invalid`/`aria-describedby` coverage.**
   Given `ToggleSwitch.vue`'s new optional `ariaInvalid?: boolean` and `ariaDescribedby?: string` props, both defaulting to `undefined`/off,
   When a toggle field has an active error,
   Then `StarterFormTemplate` passes `aria-invalid="true"` and the composed `aria-describedby` (AC3's convention) onto the `role="switch"` span, and when no error exists neither attribute is rendered differently than today.

   PROPOSED (adversarial review, finding 1): for the `aria-describedby` desc token (`${path}-desc`) to be a valid idref when a checkbox/toggle field has a description, `CheckboxField.vue` must stamp `id="${inputId}-desc"` on its (now-sibling) description `<p>`, exactly as `FormField` does in AC2. Without it, a toggle field that has a description composes `aria-describedby="${path}-desc ${path}-error"` pointing at a `<p>` that carries no id, i.e. a dangling idref (the `aria-valid-attr-value` violation ADR 3 exists to prevent, caught by ST-07's axe pass). This follows from the feature's Data flow 1 ("`FormField`/`CheckboxField` stamp those ids", plural: desc and error), so it is a settled gap-fill, not a new decision.

6. **Checkbox/toggle error and description are no longer children of the clickable `<label>`.**
   Given `CheckboxField.vue`'s invalid state,
   When rendered,
   Then the description `<p>` and `ErrorMessage` (with its `role="alert"`) are siblings of `<label>` inside `.sft-switch-field`, not descendants of it, so clicking the error text to read it does not toggle the control. PROPOSED (adversarial review, finding 1): the moved-out description `<p>` carries `id="${inputId}-desc"` and the `ErrorMessage` carries `id="${inputId}-error"`, so both are valid `aria-describedby` targets for the toggle (see AC5).

7. **Password reveal button is a normal tab stop.**
   Given `PasswordInput.vue`'s reveal button,
   When the page is tabbed through,
   Then the button is reachable by `Tab` (no `tabindex="-1"`), its `aria-label` still toggles between "Show password" and "Hide password", and `aria-describedby` reaches the underlying `<input>` through `$attrs` unchanged.

8. **No regression to today's visual output.**
   Given any of the modified components rendered without an error,
   When compared to pre-story output,
   Then no visible markup, class, or layout changes; this story is attribute/semantics-only (focus-ring styling is ST-02's slice).

### Edge cases
- A field with a description but no error: `aria-describedby` is `"<path>-desc"` only.
- A field whose error clears (fixed on re-entry): the `-error` id and its `aria-describedby` token disappear together, so no dangling idref is ever left (this is what axe's `aria-valid-attr-value` would flag; covered structurally here, asserted by axe in ST-07).
- `CheckboxField` with neither description nor error: label structure is otherwise unchanged from today.

### Out of scope
- Visual focus-ring styling and contrast corrections: ST-02.
- `PasswordStrengthBar`'s own live-region announcement: ST-03.
- Choice-card keyboard pattern: ST-06.
- axe-core assertions proving this wiring (role/name/idref validity): ST-07.

## Design reference
Implements the feature's [Design (feature level)](../../spec.md#design-feature-level) "Per-section design notes" for `#text-field`, `#select-field`, `#password-field`, and `#toggle-field`, and the invalid checkbox/toggle card redraw noted in the Architecture's `CheckboxField.vue` entry. See prototype anchors [`#text-field`](../../prototype.html#text-field), [`#select-field`](../../prototype.html#select-field), [`#password-field`](../../prototype.html#password-field), [`#toggle-field`](../../prototype.html#toggle-field). No visual delta left open by this slice: the prototype's error/description structure for the invalid toggle card is exactly the sibling layout AC6 implements. Focus-ring appearance on these same sections is drawn in the prototype but implemented by ST-02.

## Architecture reference
Implements the feature architecture's Slicing seam 1 and the matching parts of the Component/composable plan and Data flow 1-2:

- **`ErrorMessage.vue`** — optional `id` prop, `role="alert"`.
- **`FormField.vue`** — deterministic `${inputId}-desc` / `${inputId}-error` ids, conditionally emitted.
- **`CheckboxField.vue`** — `id` on its `ErrorMessage` (`${inputId}-error`); moves the description `<p>` and `ErrorMessage` out of `<label>` into siblings inside `.sft-switch-field` (feature adversarial review finding 3's fix). PROPOSED (adversarial review, finding 1): also stamp `id="${inputId}-desc"` on that description `<p>` so the toggle's `aria-describedby` desc token is a valid idref (feature Data flow 1).
- **`StarterFormTemplate.vue`** — composes the conditional `aria-describedby` string from `fieldMetadata.path` (Data flow 1, ADR 3) and binds it onto the `text`/`select`/`password`/toggle input slots.
- **`TextInput.vue`, `SelectInput.vue`** — no code change; `aria-describedby` already flows through the existing `$attrs` spread (verify with a test, don't re-implement).
- **`PasswordInput.vue`** — removes `tabindex="-1"` on the reveal button; `aria-describedby` via `$attrs`.
- **`ToggleSwitch.vue`** — new optional `ariaInvalid?: boolean`, `ariaDescribedby?: string` props, both default off.

**Public API surface touched:** two new optional props on `ToggleSwitch` (additive, default off); `ErrorMessage` gains an optional `id` prop (additive). No slot-contract change. No `packages/core/src/` change.

**Dependencies on other stories:** none. This is the foundation attribute-wiring slice; nothing in this feature depends on it structurally, but ST-07's axe assertions are most meaningful once it has landed.

**Changeset:** not carried here. Per CLAUDE.md's "one changeset per cohesive capability" guidance, the feature's single minor-bump changeset is added once the functional work is complete, in ST-06 (see that story's Architecture reference).

**Documentation:** none assigned to this story. The consumer-facing accessibility guarantees this story contributes to are documented collectively in ST-08, once all behavior-shipping stories have landed.

## QA plan

Verified against the live tree: no dedicated test file exists today for `FormField.vue`, `TextInput.vue`, `SelectInput.vue`, or `ToggleSwitch.vue` (only `CheckboxField.vue`, `ErrorMessage.vue`, and `PasswordInput.vue` have one). Three new files are needed; everything else extends an existing file. `TextInput`/`SelectInput` keep "no code change" per the Architecture reference, so their tests only prove the existing `$attrs` passthrough carries the new `aria-describedby` string, they do not re-implement anything.

This slice does not touch `DynamicFormItem`, `computedProps`, or vee-validate wiring: `aria-describedby`/`aria-invalid` are composed from `fieldMetadata.description` and `fieldContext.errorMessage`, both already-reactive slot props the template merely reads inside a template expression, no new `computed()` or watcher is added. No `*.analytics.test.ts` file is needed; flagging this as a deliberate absence, not an oversight.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 `ErrorMessage` carries `role="alert"`, renders `id` only when given | Extend the existing describe block: assert `role="alert"` on the rendered `<span>`; `it.each` over `[{ id: 'x-error' }, {}]` asserting `attributes('id')` equals the given id or is `undefined`; assert the no-`id` render has no `id` attribute at all (today's exact output) | `packages/starter/src/__tests__/ErrorMessage.test.ts` |
| 2 `FormField` emits `${inputId}-desc`/`${inputId}-error` only when the part is present | New file: mount with `inputId` + no description/error (neither id rendered), `inputId` + description only (`<p>` has `id="${inputId}-desc"`, no error id), `inputId` + error only (`ErrorMessage` has `id="${inputId}-error"`, no desc id), both present (both ids present, correctly suffixed) | `packages/starter/src/__tests__/FormField.test.ts` (new) |
| 3 `StarterFormTemplate` composes `aria-describedby` chaining desc then error, omitting absent parts, for `text`/`select`/`password` | New describe block, one `it.each` per input type over the four desc/error presence combinations, asserting the rendered native control's `aria-describedby` attribute is `"<path>-desc <path>-error"`, `"<path>-desc"`, `"<path>-error"`, or absent entirely (not `""`) | `packages/starter/src/__tests__/StarterFormTemplate.ariaWiring.logic.test.ts` (new) |
| 4 `aria-invalid`/`aria-describedby` reach the native `<input>`/`<select>` for text, select, password | Same new file: for each of the three input types, mount with an active error and assert the native element carries `aria-invalid="true"` (regression-guard: already wired, must stay true) and `aria-describedby` containing the `-error` token. Paired with two minimal new unit files proving `$attrs` passthrough in isolation (not re-implementing, just pinning the existing behaviour this story now depends on) | `StarterFormTemplate.ariaWiring.logic.test.ts`; `packages/starter/src/__tests__/TextInput.test.ts` (new); `packages/starter/src/__tests__/SelectInput.test.ts` (new) |
| 5 `ToggleSwitch` gains `ariaInvalid`/`ariaDescribedby`, default off/unchanged | New file: default render has neither attribute; passing `ariaInvalid: true` renders `aria-invalid="true"` on the `role="switch"` span; passing `ariaDescribedby` renders it verbatim. Plus a `StarterFormTemplate` assertion (same new logic file) that an errored checkbox field's switch gets both, composed the same way as AC3 | `packages/starter/src/__tests__/ToggleSwitch.test.ts` (new); `StarterFormTemplate.ariaWiring.logic.test.ts` |
| 6 Checkbox/toggle error and description are siblings of `<label>`, not descendants | Extend `CheckboxField.test.ts`: with an error and a description set, assert `ErrorMessage`'s rendered node and the description `<p>` are NOT found inside `wrapper.find('label')` but ARE found inside `.sft-switch-field`; click the rendered error text and assert no `click` event is emitted (today's label-click still emits once) | `packages/starter/src/__tests__/CheckboxField.test.ts` |
| 7 Password reveal button is a normal tab stop | Extend `PasswordInput.test.ts`: assert the toggle button's `tabindex` attribute is `undefined` (not `"-1"`); existing `aria-label` toggle assertion stays; add one assertion that an arbitrary `aria-describedby` passed as an attr lands on the `<input>` unchanged | `packages/starter/src/__tests__/PasswordInput.test.ts` |
| 8 No visual regression | Not a standalone automated test: structurally guarded by every test above asserting only new attributes/ids are added and no existing class, text, or DOM-node-removal assertion in the extended files changes. See Manual verification checklist for the visual proof | Manual (see checklist) |

### Edge cases to tests
- Description present, error absent → `aria-describedby="<path>-desc"` only: covered by the `it.each` combination matrix in AC3/4's test.
- Error clears on re-entry (fixed value) → the `-error` id and its `aria-describedby` token disappear together: add one assertion per input type in the new logic file that re-mounting/updating from an error state to a valid state removes both the `id` from `ErrorMessage`/`FormField`'s wrapper and the `-error` token from `aria-describedby`, so no dangling idref is ever left mid-session (not just at initial mount).
- `CheckboxField` with neither description nor error: extend the existing "renders the description when given" test with its negative counterpart, asserting no stray `id` or empty `<p>`/`ErrorMessage` node is rendered.

### States from the feature's states policy applicable to this slice
- **Error (new semantics).** The one state this slice changes: `role="alert"` + conditional `id` + the `aria-invalid`/`aria-describedby` wiring. Covered by AC1, 3, 4, 5, and the edge-case error-clears test above.
- **Valid / pristine.** Must render exactly as a pristine field does today beyond the added attributes: covered by the "neither part present" row of the AC3/4 matrix and the existing pristine-state tests in `StarterFormTemplate.validState.logic.test.ts`, which this story does not modify and which stay green as the regression guard.
- **Disabled.** Unaffected by this slice; existing disabled-field tests in `StarterFormTemplate.disabled.logic.test.ts` are the regression guard, re-run but not extended.
- **Loading / empty.** Not applicable: this slice has no loading or empty-state surface.

### Reactivity / analytics
No `*.analytics.test.ts` file. This slice reads `fieldMetadata.description` and `fieldContext.errorMessage.value`, both props already supplied reactively to `StarterFormTemplate`'s slots by the engine; composing an `aria-describedby` string from them in the template is a plain expression, not a new `computed()` or watcher, so it introduces no new re-render surface for `DynamicFormItem` to regress. The existing `StarterFormTemplate.analytics.test.ts` and `StarterFormTemplate.group.analytics.test.ts` files are untouched and serve as the regression guard that this slice adds no extra render.

### Coverage
Every new line (the `FormField` id composition, `ErrorMessage`'s `id` prop, `CheckboxField`'s moved markup, `StarterFormTemplate`'s `aria-describedby` composition helper, `ToggleSwitch`'s two new props, `PasswordInput`'s removed `tabindex`) is exercised by the table above; nothing is knowingly left uncovered. `pnpm -r ci:test:coverage` for `packages/starter` is expected to stay at or above baseline given three new test files add coverage rather than remove it.

### Time sensitivity
None. No date/time-dependent behaviour in this slice.

### Regression risk
- `CheckboxField.vue`'s markup move is the only structural change; its only consumers are `StarterFormTemplate.vue`'s `checkbox` slot and `StarterFormTemplate.checkbox.logic.test.ts` (unmodified by this story), both re-run as the guard that the field still renders/toggles correctly.
- `ToggleSwitch.vue` has exactly one consumer, `StarterFormTemplate.vue`'s `checkbox-input` slot; the two new props default to `undefined`/off, so `StarterFormTemplate.checkbox.logic.test.ts`'s existing assertions (no `aria-invalid`/`aria-describedby` today) continue to pass unchanged and prove the additive default.
- `PasswordInput.vue`'s `tabindex="-1"` removal is scoped to its own reveal button; `StarterFormTemplate.password.logic.test.ts` (unmodified) is the guard that show/hide toggling and strength-bar behaviour are unaffected.
- `publicApiSurface.test.ts` pins the internal-chrome component name list, not their prop shapes, so the new optional props/id prop need no update there; confirmed by reading the file.
- No `packages/core` file is touched, so `packages/core`'s and `packages/element-plus`'s own suites are unaffected by construction, not by inference.

### Untestable criteria and rewrite proposals
All eight acceptance criteria are testable as written; no rewrite needed. AC8 ("no regression to visual output") is not a standalone repeatable assertion the way AC1-7 are, since there is no persisted pre-story screenshot in the repo to diff against automatically, so it is split between the structural guard described in its table row and the one-time manual screenshot comparison below.

### Manual verification checklist
1. Before implementation, screenshot the text, select, password, toggle, and checkbox fields in the Storybook starter playground, both without an error and with one, in light and dark mode. After implementation, screenshot the same five fields in the same four states and confirm pixel-equivalent output except for the new attributes being present in the DOM inspector (not visible on screen, since this story is attribute-only; focus-ring styling is ST-02's slice).
2. Tab through a form containing a password field in the browser and confirm the reveal button is now reachable by `Tab` in natural order, and that pressing it still toggles the `aria-label` correctly.
3. With a screen reader (VoiceOver is sufficient for a spot check), focus a field with both a description and an active error and confirm the full chain (label, description, error) is announced, not just the bare input.

## Adversarial review

STORY-mode (lite) review: blockers only, plus should-fixes routed as `PROPOSED` edits. Verified against the shipped components (`CheckboxField.vue`, `ErrorMessage.vue`, `FormField.vue`, `ToggleSwitch.vue`, `StarterFormTemplate.vue`, `PasswordInput.vue`, `TextInput.vue`, `SelectInput.vue`), the test tree, and `index.ts`/`publicApiSurface.test.ts`.

Confirmed true: `tabindex="-1"` on the password reveal button; `aria-invalid` already on Text/Select/Password inputs; `role="switch"` + Space/Enter + disabled-aware `tabindex` on `ToggleSwitch` with no `aria-invalid`/`aria-describedby` today; `ErrorMessage` has no `id` prop today; `CheckboxField` renders description `<p>` and `ErrorMessage` inside the clickable `<label>`; `$attrs` passthrough on Text/Select/Password inputs will carry `aria-describedby`; `FormField`/`CheckboxField`/`#default-input`/`#checkbox-input` all key off `s.fieldMetadata.path`, so the wrapper ids and the template's `aria-describedby` share one `path` (ADR 3 holds). No test file exists today for `FormField`/`TextInput`/`SelectInput`/`ToggleSwitch`; `ErrorMessage`/`CheckboxField`/`PasswordInput` each have one. The QA plan's file inventory is accurate.

Verified factual check: `aria-invalid` and `aria-describedby` are ARIA 1.2 global states/properties, allowed on any element including `role="switch"`, so AC5 raises no `aria-allowed-attr` violation. Source: W3C WAI-ARIA 1.2, section 6.5 (Global States and Properties).

1. **(should-fix, resolved via PROPOSED)** The checkbox/toggle description `<p>` id is unspecified, so AC5's toggle `aria-describedby` would emit a dangling `${path}-desc` idref. AC5 reuses AC3's convention (`"${path}-desc ${path}-error"`), but AC2 (id assignment) is scoped to `FormField`, AC6 only moves the `<p>` out without giving it an id, and the Architecture reference's `CheckboxField` bullet mentioned only the `-error` id. A toggle field with a description then points `aria-describedby` at a `<p>` that has no id, the exact `aria-valid-attr-value` violation ADR 3 and ST-07's axe pass guard against. Resolution follows deterministically from the feature's Data flow 1 ("`FormField`/`CheckboxField` stamp those ids"), so it is a settled gap-fill, not a Jeroen decision. Routed into AC5, AC6, and the Architecture reference `CheckboxField` bullet. The QA map's AC6 row should add an assertion that the moved `<p>` carries `id="${path}-desc"`.

2. **(should-fix, resolved via PROPOSED)** The `#default-input` slot renders `TextInput` twice: the `sft-input-suffix-row` variant (fields with `fieldMetadata.suffix`, e.g. currency/percentage numbers) and the plain `v-else` variant. AC3/AC4 and the QA map speak of "the native control" generically; if only the plain branch is wired, a suffixed field silently loses `aria-describedby`. Routed into AC3 with a request to include a suffixed field in the AC4 matrix. Low-risk but easy to overlook, hence routed rather than left as prose.

3. **(nit)** The Architecture reference's "Public API surface touched" framing lists `ToggleSwitch`/`ErrorMessage` prop additions as public API. These are internal, non-exported chrome (`publicApiSurface.test.ts` asserts they are never exported), so strictly nothing consumer-observable changes; the additions are harmless and additive. No change required beyond noting that the only true public surface here is unchanged. Consistent with the feature's "no `packages/core/src/` change, no slot-contract change" claim.

No blocker found. Both should-fixes are concrete gap-fills derivable from the approved feature spec and are written in as `PROPOSED (adversarial review)` edits; neither forces discussion. No Open questions on this story. Dependencies ("none") verified: ST-01 needs no `.sft-sr-only`, no `focus.ts`, no CSS token, and ST-07's axe pass depends on it, not the reverse. Consistent with the approved feature's Data flow 1, ADR 3, and the `CheckboxField`/`FormField` component-plan entries.

## Implementation notes

- `CheckboxField.vue`'s label/description/error used to be the component's only flex item besides the switch (`.sft-switch-field` is `display: flex; justify-content: space-between`). Moving the description and error out of `<label>` as direct siblings would have added two more top-level flex items and broken the two-column layout. Fix: wrapped the label, description, and error in a new `.sft-switch-field-text` div, which is the single flex item on the text side; the switch stays the second. A matching `display: block` rule (documented, otherwise redundant with the div default) was added to `style.scss` so the class-usage hygiene test (`classUsage.test.ts`) passes. Verified pixel-equivalent against the shipped layout with a Storybook/Playwright screenshot in light and dark mode (invalid checkbox card).
- `ToggleSwitch.vue`'s new `ariaInvalid`/`ariaDescribedby` props needed an explicit `= undefined` default in the destructured `defineProps` pattern. Vue auto-defaults an optional prop typed `boolean` to `false` when no default is given (its documented Boolean-casting rule), which would have rendered `aria-invalid="false"` on every toggle, not the "no attribute at all" default the story calls for. Giving both props an explicit `undefined` default suppresses that casting and keeps today's render unchanged, confirmed by `ToggleSwitch.test.ts`.
- `aria-describedby` composition lives in a single `ariaDescribedby(path, hasDescription, hasError)` helper in `StarterFormTemplate.vue`, reused across the text (both the plain and `sft-input-suffix-row` branches), select, password, and checkbox-input slots, so the four call sites can never drift from each other or from `FormField`/`CheckboxField`'s own id stamping.
- Pre-existing, unrelated to this story: `packages/starter/src/__tests__/prototypeParity.test.ts` fails (`ENOENT`) because it reads `specs/FEAT-007-starter-form-template/prototype.html`, which no longer exists after the prior "Cleanup + new Specs" commit deleted the whole `FEAT-007` spec folder without updating this test. This blocks a clean `pnpm ci`/`pnpm -r ci:test:coverage` run regardless of this story's changes; every other test (418 of 419 in `packages/starter`, all of `packages/core`) passes, lint is clean, and `vue-tsc --noEmit` is clean across `packages/core`, `packages/starter`, and `playgrounds/storybook`. Needs Jeroen's call on whether to repoint or delete that test; out of scope for ST-01 to fix unilaterally.
- Coverage: `packages/starter` v8 coverage with the broken suite excluded is 99.68% statements / 94.17% branches / 95% functions, with every touched file at or near 100% (new lines in `FormField.vue`'s pre-existing, unrelated `canRemoveItems` branch are the only gap, untouched by this story and never wired `true` by `StarterFormTemplate` today).

## Verification report

### Pipeline results
- `pnpm run ci:test` (the `pnpm ci` alias at the repo root is shadowed by pnpm's built-in `ci` command, which does a clean reinstall instead of running the workspace `ci` script; `ci:test`/`ci:lint`/`ci:typecheck` are not shadowed and were run directly): `packages/core` 973/973 passed, `packages/starter` 528/528 passed (72 files, includes the now-fixed `prototypeParity.test.ts`, 110/110), `docs` 78/78 passed.
- `pnpm run ci:lint`: clean across `packages/core` and `packages/starter`.
- `pnpm run ci:typecheck`: clean across `packages/core`, `packages/starter`, and `playgrounds/storybook`.
- `pnpm run ci:test:coverage`: `packages/starter` 99.68% statements / 94.17% branch / 95% functions, matching the Implementation notes' own figures exactly. Every touched file (`ErrorMessage.vue`, `CheckboxField.vue`, `ToggleSwitch.vue`, `PasswordInput.vue`, `TextInput.vue`, `SelectInput.vue`) is at 100%. The two remaining gaps are pre-existing and unrelated: `FormField.vue` lines 54-57 (the `canRemoveItems` button branch, never wired `true` by `StarterFormTemplate`) and a handful of `showValidState`-ternary branches in `StarterFormTemplate.vue` untouched by this story. `packages/core` unaffected (98.47%/92.93%/98.37%, no file in this story's scope touches `packages/core`). No baseline regression; three new test files add coverage, none remove it. `docs/` unchanged, no `pnpm docs:build` needed.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. ErrorMessage id + role=alert | Pass | `ErrorMessage.vue` diff adds `:id` and `role="alert"`; `ErrorMessage.test.ts` asserts `role="alert"` and the `it.each([{ id: 'x-error' }, {}])` id-or-undefined case, plus the pre-existing no-id render stays unchanged. |
| 2. FormField deterministic desc/error ids, conditional | Pass | `FormField.vue` diff stamps `${inputId}-desc`/`${inputId}-error`; new `FormField.test.ts` covers all four presence combinations (neither/desc-only/error-only/both). |
| 3. aria-describedby composition, both TextInput branches | Pass | `StarterFormTemplate.vue`'s new `ariaDescribedby(path, hasDescription, hasError)` helper is bound on both the `sft-input-suffix-row` branch and the plain `v-else` branch (confirmed by reading both call sites in the diff); `StarterFormTemplate.ariaWiring.logic.test.ts`'s `it.each` matrix covers all four combinations for text/select/password plus a dedicated suffixed-field test (`wires the composed aria-describedby on the suffixed TextInput branch too`), closing the adversarial-review finding 2 gap. |
| 4. aria-invalid/aria-describedby reach the native control | Pass | Same logic test file asserts `aria-invalid="true"` and the `-error` token on the native `<input>`/`<select>` for all three input types; `TextInput.test.ts`/`SelectInput.test.ts` pin the `$attrs` passthrough in isolation. |
| 5. ToggleSwitch ariaInvalid/ariaDescribedby, default off | Pass | `ToggleSwitch.vue` diff adds both props with explicit `undefined` defaults (avoiding Vue's boolean-prop auto-cast to `false`); `ToggleSwitch.test.ts` (3 tests) plus `StarterFormTemplate.ariaWiring.logic.test.ts`'s checkbox-switch describe block (neither attribute by default; both composed the same way as AC3 when errored). The adversarial-review finding-1 gap-fill (desc `<p>` id on `CheckboxField`) is in place: diff shows `:id="inputId ? \`${inputId}-desc\` : undefined"` on the description `<p>`. |
| 6. Checkbox/toggle error+desc are siblings of `<label>` | Pass | `CheckboxField.vue` diff moves both into a new `.sft-switch-field-text` sibling div; `CheckboxField.test.ts` adds "siblings of the clickable label, not inside it", the id-stamping test, and "clicking the error text does not toggle the control" (click emits nothing). |
| 7. Password reveal button is a normal tab stop | Pass | `PasswordInput.vue` diff removes `tabindex="-1"`; `PasswordInput.test.ts` adds the tab-stop assertion, re-confirms the aria-label toggle, and adds an `aria-describedby`-passthrough assertion. |
| 8. No visual regression | Pass | Structurally guarded: every extended test file only adds new attribute/id assertions, none change existing class/text/removed-node assertions (confirmed by reading each diff). The one structural change (`CheckboxField`'s new `.sft-switch-field-text` wrapper) is `display: block`, which is how the `<label>` it replaces already rendered as a flex item (blockified by `.sft-switch-field`'s `display: flex`), so the layout is unchanged by construction; the Implementation notes record a Storybook/Playwright screenshot comparison in both color modes for the invalid checkbox card. I did not re-run that screenshot myself (attribute/markup-only story, no new CSS beyond the one documented `display: block` rule, and `classUsage.test.ts` confirms the class exists in the stylesheet), but the CSS reasoning above independently corroborates the claim. |

Edge cases: the error-clears-on-revalidation case (both the `-error` id and its `aria-describedby` token disappear together) is covered by `StarterFormTemplate.ariaWiring.logic.test.ts`'s "drops the -error token and id once the field becomes valid again". The neither-description-nor-error `CheckboxField` case is covered by its new "renders no description or error node when neither is given" test.

### Prototype comparison
The feature's `prototype.html` at `#toggle-field`'s "invalid" example still nests the description and error inside `<label>` (not yet redrawn as siblings), even though the story's own Design reference states the prototype already matches the sibling layout. This is a pre-existing inaccuracy in the approved feature-level spec text, not a deviation introduced by this story's implementation: the shipped `CheckboxField.vue` correctly implements the sibling structure AC6 requires, and the visual result is unaffected (see AC8). Noting it here for Jeroen's awareness; it does not block this story, since it is feature-level prose describing a prototype file that is itself not part of ST-01's diff.

### Process compliance
- `specs/components.md`: updated with the full ARIA-wiring surface (id stamping, `aria-describedby` composition, the `CheckboxField` sibling move, `ToggleSwitch`'s new props, `PasswordInput`'s tab-stop fix). Matches the shipped diff.
- Changeset: correctly deferred. This story only touches `packages/starter/src/`, which would normally require one, but the feature's Architecture reference explicitly carries the feature's single minor-bump changeset in ST-06 (per CLAUDE.md's "one changeset per cohesive capability" guidance); no `.changeset/*.md` file exists in the working tree, consistent with that deferral.
- Public API: `publicApiSurface.test.ts` passed unchanged (9 value exports, same list); no new export added. The two new `ToggleSwitch` props and `ErrorMessage`'s new `id` prop are additive, non-exported internal chrome, confirmed by the passing "never exports an internal chrome component" assertion.
- Library API rules: all new props are camelCase (`ariaInvalid`, `ariaDescribedby`, `id`); the `aria-*`/`role` attributes bound in templates are native HTML attribute names (not Vue props), consistent with the existing `aria-invalid` usage already in the codebase.
- No spec-reference leakage: no `ST-`/`FEAT-`/`AC`/`ADR` citations found in any touched source or test file (the one incidental match is the pre-existing, orchestrator-fixed file path in `prototypeParity.test.ts`, not a process-artifact citation).
- Documentation: none assigned to this story (deferred to ST-08); no `docs/` changes present, consistent.
- No undocumented deviations found; both adversarial-review PROPOSED gap-fills (finding 1's `CheckboxField` desc id, finding 2's suffixed-branch wiring) are implemented and tested as specified.

### Overall verdict: pass
