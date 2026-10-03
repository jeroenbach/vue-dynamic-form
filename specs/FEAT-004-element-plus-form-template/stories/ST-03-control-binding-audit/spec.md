---
id: ST-03
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Every built-in control binds to the form value correctly

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- AC1 → pickers bind a default `value-format` so stored values match the declared `string` types; `ElementPlusValueTypes` is not widened
- AC2 → upload removal is pinned: `on-remove` also updates the form value
- AC4 → `transfer` disabled state is applied per item in `data`, not as a component prop

## Assumed without Jeroen (no clear winner)

Ties broken by policy during story prep, not decided on the merits. Each names its alternative inline.

- AC1 → `datetime` default format is `YYYY-MM-DD HH:mm:ss`, not the ISO `T` form (reversible: local edit before first publish)


## Functional
### User story
As an end user filling in a form rendered by `ElementPlusFormTemplate`, I want every built-in control (including file upload, transfer, and cascader) to actually write its value into the form and show the stored value, so that what I enter is validated and submitted.

As a template author on an older supported Element Plus, I want each control to use only props and events that exist at the `>=2.0.0` peer floor, so that the template does not silently break for me.

### Acceptance criteria

Each criterion is verifiable by a Vitest component test that mounts the template inside `DynamicForm` (real vee-validate), drives the Element Plus control, and reads the form value (for example via `useFieldValue`/form values) unless marked manual.

**Per-control value round trip**

1. **Each of the 15 input controls round-trips its value.**
   Given a form with one field of each of `text`, `select`, `checkbox`, `radio`, `date`, `time`, `datetime`, `switch`, `number`, `rate`, `slider`, `color`, `cascader`, `transfer`, `upload`,
   When a test sets an initial value in the form and then changes the control through its real Element Plus interaction (`setValue`, emitting the control's documented update event, or clicking),
   Then the control displays the initial value and the new value appears in the form values with the control's documented value type, for every control. (`heading` and `divider` carry no value and are excluded.)

   DECIDED (research): the `date`, `time`, and `datetime` `-input` fallbacks bind `value-format` to `field.valueFormat ?? <default>`, with defaults `YYYY-MM-DD`, `HH:mm:ss`, and `YYYY-MM-DD HH:mm:ss`, so the stored value is the declared `string`. `ElementPlusValueTypes` is not widened. A consumer who sets the existing `valueFormat` property still wins. The round-trip tests assert the string value without setting `valueFormat`; one test asserts that an explicit `valueFormat` overrides the default.
   Why: `ElDatePicker` and `ElTimePicker` emit a `Date` unless `value-format` is set (`valueFormat` is a declared prop in 2.14.2 and is already bound from the metadata property), while the approved catalogue declares these three types as `string` and ST-01 pins "exact current value types". Widening to `string | Date` would contradict that and push a `Date` into the form for every bare consumer; requiring every consumer to set `valueFormat` ships the type mismatch by default.
   Sources: element-plus.org/en-US/component/date-picker and time-picker (`value-format`), `node_modules` element-plus 2.14.2 `date-picker/src/props.d.ts` and `time-picker/src/common/props.d.ts`, ST-01 criterion 4
   ASSUMED (story prep): the `datetime` default is `YYYY-MM-DD HH:mm:ss` (space separated).
   Why: no clear winner. The XSD `dateTime` lexical form uses `T`, but no `xsd_*` rule validates a `datetime` string in this library, and Element Plus's own `datetime` examples and display format use the space form.
   Tie broken on: reversibility (the package is unpublished, so changing the default is a local edit plus test update).
   Alternative: `YYYY-MM-DDTHH:mm:ss`. Reversing after the first publish would change stored values for consumers relying on the default.

2. **Upload binds through file list and on-change.**
   Given an `upload` field (`ElUpload`),
   When the test emits the file-list/`on-change` interaction with a file list,
   Then the field value in the form equals the new file list, and the initial field value is shown as `file-list` on `ElUpload`. `ElUpload` no longer receives `modelValue`/`onUpdate:modelValue`.

   When a file is removed (through the remove control or the `on-remove` path), the field value updates to the list without that file.
   DECIDED (research): `ElUpload` is bound through both `on-change` and `on-remove`, each writing the resulting file list via `handleChange`.
   Why: `on-change` fires on select and upload status changes, never on removal, while `on-remove` does (both declared in `UploadHooks` in 2.14.2); binding only `on-change` leaves a removed file in the form value.
   Sources: element-plus 2.14.2 `upload/src/upload.d.ts`, element-plus.org/en-US/component/upload

3. **Transfer, cascader, and slider are checked against their real contracts.**
   Given `transfer` (selected keys), `cascader` (value as path array, single and `multiple`), and `slider` (number and `range` number pair),
   When each is driven with its documented update event,
   Then the stored value matches the documented shape (`TransferKey[]`, `CascaderValue`, `number | number[]`), and `transfer` is bound to its selected-keys contract (`v-model`), with `target-keys` no longer being a second competing source of truth. If the metadata property `targetKeys` becomes redundant, the developer keeps it in `ElementPlusFieldProperties` for parity but documents in Implementation notes how it is used (for example as the initial value fallback) or flags it as a deviation.

4. **Disabled state is honoured consistently.**
   Given a field with `disabled: true` in metadata and another whose slot-scope `disabled` is true (engine-driven),
   When both render,
   Then every input control that supports a disabled prop receives it. For `transfer`, which has no component-level `disabled` prop, every item passed to `ElTransfer` `data` carries `disabled: true`, the rendered item checkboxes are disabled, and no item can be moved.

   DECIDED (research): the `transfer` disabled state is applied per item in `data` (the `props.disabled` alias key), not as a component prop.
   Why: `ElTransfer` has no `disabled` prop in 2.14.2 (its only `disabled` is the per-item alias key in `TransferPropsAlias`), so binding `:disabled` on it falls through as a DOM attribute and disables nothing. The per-item key is the documented mechanism. The developer confirms the key exists at the `>=2.0.0` floor in the audit table.
   Sources: element-plus 2.14.2 `transfer/src/transfer.d.ts`, element-plus.org/en-US/component/transfer

**Peer floor audit**

5. **A per-control audit is recorded.**
   Given the ported controls,
   When the story is finished,
   Then Implementation notes contain a table with one row per control: the bound prop, the bound update event, the Element Plus version that introduced each (checked against the Element Plus docs/changelog for the `>=2.0.0` floor), and whether it is safe. Where a prop or event is newer than `2.0.0`, the developer either replaces it with a floor-safe equivalent (for example `ElRadio :label` for the option value, because the `value` prop only exists from 2.6) or records it as an open point for Jeroen rather than silently raising the floor.

6. **The package peer range is not changed silently.**
   Given `packages/element-plus/package.json`,
   When the story lands,
   Then the `element-plus` peer range still resolves to `>=2.0.0` (`catalog:framework`) unless Jeroen decided otherwise via an open point.

**Regressions**

7. **Text and select behaviour is unchanged.**
   Given the `text` and `select` round-trips,
   When compared with the current behaviour,
   Then placeholder, clearable, filterable, multiple, size, readonly, and options are still applied.

8. **Code hygiene.**
   Given all changed source and test files,
   When reviewed,
   Then no comment or test name references specs or process artifacts (FEAT, ST, AC, ADR, finding numbers), there are no em dashes, and `ci:test`, `ci:lint`, `ci:typecheck` pass for `packages/element-plus`.

### Edge cases
- `upload` with `autoUpload: false` and no `action`: selecting a file still updates the form value; no network call is made in tests.
- `number` with `undefined` initial value and `precision` set: the control renders empty and emits a number on change; the form value is `number | undefined`.
- `select` with `multiple: true` returns an array; with `multiple` unset returns the single option value.
- `checkbox` with an initial `undefined` value.
- `cascader` with `null` initial value.

### Out of scope
- New metadata properties or new field types beyond parity.
- Validation-message rendering in `ElFormItem` (`error`/`validate-status`) unless the developer finds it trivial and necessary to show the required marker; the required marker already shipped in the `default` fallback.
- CSS/Tailwind removal: next story. Structural families: later stories.
- `packages/core` is untouched; the package stays `private: true`, so no changeset.

## Design reference
No prototype. Each control follows the Element Plus documentation (element-plus.org) for its bound props and events.

## Architecture reference
Implements the "Do not port broken v-model bindings verbatim" part of the feature's Data flow section (the `ElUpload` fix, per-control v-model contract audit, and per-control `>=2.0.0` availability check). Changes are confined to the `<type>-input` fallbacks in `ElementPlusFormTemplate.vue` and their tests.

Depends on ST-02 (the `<type>-input` fallback slots must exist in their final slot-forwarding shape). Independent of the CSS, array, choice, and wizard stories.

## QA plan

### Criteria findings (read first)

Facts below were checked against the installed `element-plus@2.14.2` sources in `node_modules/.pnpm/`. The DECIDED/ASSUMED points of this story and the feature are not reopened.

1. **AC4 is wrong for `transfer` and cannot be tested as written.** `ElTransfer` has no component-level `disabled` prop in 2.14.2. The only `disabled` in its typings is the `props.disabled` alias, the name of the per-item key in `data`. Binding `:disabled` on it would fall through as a plain DOM attribute on the root `div` and disable nothing, so a test that only checks for the attribute or the vnode prop would pass while the user can still move items. Proposed rewrite of the transfer clause: "when `field.disabled || disabled` is true, every item passed to `ElTransfer` `data` has `disabled: true`, the rendered item checkboxes are disabled, and no item can be moved". The per-item `disabled` key exists in `TransferDataItem` from the 2.0.0 line (developer confirms in the audit table). The plan below tests this rewrite. Adopted into AC4 (see the DECIDED entry there).
2. **AC2 covers adding a file only.** `on-change` fires when a file is added or its status changes, not when one is removed (`on-remove` does). Binding only `on-change` leaves a removed file in the form value. Proposed extra clause for AC2: "removing a file from the list updates the form value". The plan includes this test.
3. **AC1 "documented value type" is ambiguous for the pickers.** `ElementPlusValueTypes` declares `date`, `time`, `datetime` as `string`, but `ElDatePicker`/`ElTimePicker` emit `Date` objects unless `valueFormat` is set. The plan asserts the string round trip with `valueFormat` set (the contract the type promises) and records the no-`valueFormat` behaviour in one characterization test. Decided: the template defaults `valueFormat` per type and the type is not widened (see AC1). The characterization test therefore asserts the default string round trip and that an explicit `valueFormat` overrides it, instead of documenting a `Date` value.
4. **AC5 and the "safe at `>=2.0.0`" column are not verifiable in CI.** Only 2.14.2 is installed, so CI can prove a bound prop or event exists today, not that it existed at 2.0.0. The plan automates the part that is automatable (bound names must be real declared props or events, and must stay inside a reviewed allowlist) and puts the version truth in a manual step (run the bindings suite once against an older Element Plus).
5. **AC8 is a review criterion.** Lint, typecheck, and test pass are automatic; the "no spec references, no em dashes" part is a manual grep step in the checklist.
6. **Story gap vs. the user story.** The user story promises that entered values are "validated", but no criterion asserts it. The plan adds a small validation test for `upload` and `transfer` (the two controls whose bindings were broken). No criterion change needed.

### Test files and conventions

All new tests live in `packages/element-plus/src/__tests__/`, using the conventions from `CLAUDE.md`. The old placeholder file is already replaced by the earlier stories; this story adds files and does not touch theirs.

| File | Kind | Covers |
| --- | --- | --- |
| `ElementPlusFormTemplate.bindings.logic.test.ts` | logic, table-driven | AC1, AC3, AC7, edge cases |
| `ElementPlusFormTemplate.upload.logic.test.ts` | logic | AC2 and upload edge cases, removal, value shape |
| `ElementPlusFormTemplate.disabled.logic.test.ts` | logic, table-driven | AC4 (with the transfer rewrite) |
| `ElementPlusFormTemplate.boundContract.logic.test.ts` | logic | AC5 (automatable half), AC6 |
| `ElementPlusFormTemplate.upload.validation.test.ts` | validation | required state for `upload` and `transfer` |
| `ElementPlusFormTemplate.bindings.analytics.test.ts` | analytics | no write loop for `upload` and `transfer` |

Test names describe behaviour ("writes the new file list into the form", "keeps a removed file out of the form value") and never mention specs, stories, ACs, or findings. Selectors use components (`findComponent(ElX)`), ids, or `data-testid`, never CSS class names, so the later CSS story cannot break these tests.

### Fixtures and helpers

Existing: core's `enableAutoUnmount(afterEach)` pattern (the package setup file from the foundation story must call it too), and the host pattern used in `packages/core/src/components/__tests__/DynamicFormItemWizard.logic.test.ts` (a `defineComponent` host that calls `useDynamicForm()` and renders `DynamicForm`). There is no element-plus fixture to reuse; `packages/core/src/examples/` is core-only and is not imported.

New, shared by the files above (developer's naming, suggested `src/__tests__/helpers/mountBoundForm.ts`; reuse one if the earlier stories already created it):

- `mountBoundForm({ metadata, initialValues, settings })`: host that calls `useDynamicForm({ initialValues })` and renders `DynamicForm` with `template: ElementPlusFormTemplate` (bare usage, no wrapper), mounted `attachTo: document.body` (poppers teleport). Returns `{ wrapper, values, errors, meta, findControl(Component) }`, where `values()` reads the live form values. Awaits `flushPromises()` after mount and after each interaction.
- `expectNoWarnings()`: spies `console.warn` and `console.error` per test and fails on any `[Vue warn]` or Element Plus error. This catches unknown props on declared components and bad value types.
- A `ResizeObserver` stub (and `matchMedia`, `scrollIntoView` only if a control needs them) in the package's `test-setup.ts`; `ElSelect`, `ElSlider`, `ElCascader`, and `ElTransfer` can need it under jsdom. No network stub is needed; `upload` tests spy on `XMLHttpRequest.prototype.open` and `fetch` to prove no request is made.

### AC to test mapping

**AC1, per-control round trip** (`bindings.logic`, one `describe.each` row per control; 15 rows: `text`, `select`, `checkbox`, `radio`, `date`, `time`, `datetime`, `switch`, `number`, `rate`, `slider`, `color`, `cascader`, `transfer`, `upload`). Each row: initial value via `initialValues`, assert the control shows it, drive one change, assert the form value and its type.

| Control | Initial shown (assert) | Interaction | Stored value asserted |
| --- | --- | --- | --- |
| `text` | `input` element value | `setValue` on the `input` (real DOM) | string |
| `select` | selected label text, `ElSelect` `modelValue` | emit `update:modelValue` on `ElSelect` | option value (string and number options) |
| `checkbox` | `ElCheckbox` checked | click the checkbox input (real DOM) | `true`/`false` |
| `radio` | checked `ElRadio` for the option | click another radio (real DOM) | option value, number options stay numbers |
| `date` | picker input shows formatted value | emit `update:modelValue` on `ElDatePicker` | string per `valueFormat` (`YYYY-MM-DD`) |
| `time` | picker input shows value | emit on `ElTimePicker` | string per `valueFormat` (`HH:mm:ss`) |
| `datetime` | picker input shows value | emit on `ElDatePicker` | string per `valueFormat` (`YYYY-MM-DD HH:mm:ss`) |
| `switch` | `ElSwitch` checked | click the switch (real DOM) | boolean |
| `number` | input shows value | click the increase button (real DOM) | number |
| `rate` | active star count | click a star (real DOM) | number |
| `slider` | `ElSlider` `modelValue` | emit `update:modelValue` | `number` (single) and `[n, m]` when `range` |
| `color` | `ElColorPicker` `modelValue` | emit on `ElColorPicker` | string |
| `cascader` | `ElCascader` `modelValue` | emit path array | `['a','b']`; with `props: { multiple: true }` `[['a','b'],['a','c']]` |
| `transfer` | right panel shows the keys | check a left item, click the move-right button (real DOM) | `TransferKey[]` |
| `upload` | see AC2 | see AC2 | see AC2 |

Real DOM interaction is used wherever jsdom supports it, because emitting an event from the test only proves the handler wiring and not what the control really emits. The emit-driven rows (popper-based controls) are a known weaker proof; their payload type is the control's documented one, and the manual step below exercises them in a browser.

Date/time rows always use string values with `valueFormat`, never `new Date()` and never `toISOString()`, so they hold under `TZ=Europe/Amsterdam` (see Time sensitivity). Date/time rows rely on the template default format; one extra test sets an explicit `valueFormat` and asserts it overrides the default (finding 3).

**AC2, upload** (`upload.logic`):
- Initial field value appears as `ElUpload` `fileList` (assert `findComponent(ElUpload).props('fileList')` and the rendered file name in the list).
- Driving the file input (set `files` on the hidden `input[type=file]` and dispatch `change`) or calling the `onChange` prop with `(file, fileList)` writes the full new list into the form value.
- `ElUpload`'s vnode props contain neither `modelValue` nor `onUpdate:modelValue`.
- Removal (finding 2): invoking the removal path (click the remove icon, or call the `onRemove` prop) updates the form value to the list without that file.
- A single interaction writes the form value once, not twice (spy via a `watch` on the field value); guards against binding both `on-change` and a `file-list` update handler.
- The stored item keeps `name` and `raw` (an instance of `File`): vee-validate clones values, and a clone that strips `raw` would make the form value useless for submit. If it does strip it, the developer records a deviation rather than weakening the test.
- Edge: `autoUpload: false`, no `action`: selecting a file updates the value and neither `XMLHttpRequest.prototype.open` nor `fetch` is called.

**AC3, transfer, cascader, slider** (`bindings.logic`):
- `transfer`: `ElTransfer` is bound through `modelValue` only. Assert its vnode props have no `targetKeys`/`target-keys`, and the rendered HTML has no stray `target-keys` attribute on the root (today's binding leaks it as a DOM attribute). Two sub-tests depending on the developer's documented choice for the `targetKeys` metadata property: (a) documented as an initial fallback: with no form value and `targetKeys: ['a']`, the right panel shows `a`, and once the form has a value it wins; (b) documented as unused: setting `targetKeys` changes nothing in the rendered output. Whichever is chosen, the test for the other is absent, and the Implementation notes entry is cross-checked by the reviewer.
- `cascader`: single and `multiple` value shapes from the AC1 table, plus `null` initial (edge case) renders empty without a warning.
- `slider`: single `number` and `range: true` pair; assert the pair round trips as an array.

**AC4, disabled** (`disabled.logic`, `describe.each` over controls x two sources):
- Sources: metadata `disabled: true`, and engine-driven (`maxOccurs: 0`, which makes the slot-scope `disabled` true; the developer confirms the field still renders). Also a control case with neither set, expecting not disabled.
- Controls asserted via `findComponent(X).props('disabled')`: `text`, `select`, `checkbox`, `radio` (the `ElRadioGroup`), `date`, `time`, `datetime`, `switch`, `number`, `rate`, `slider`, `color`, `cascader`, `upload` (and its inner `ElButton`).
- `transfer` (finding 1): per-item `disabled` on `data` and disabled rendered checkboxes; clicking an item does not check it, and the form value is unchanged. The transfer row must not assert a component `disabled` prop.

**AC5, audit recorded** (`boundContract.logic` plus review):
- A constant `boundContract` in the test file lists, per control, the bound props and events the audit table claims (for example `ElUpload: ['action','accept','listType','autoUpload','showFileList','disabled','fileList', 'onChange', 'onRemove']`). One test per control mounts the field and asserts every key in the control's `vnode.props` (camelized) is in that list, and that every listed key is a declared prop or emit of the pinned 2.14.2 component (`Component.props` / `Component.emits`). This fails on `model-value` for `ElUpload`, `target-keys` and `disabled` for `ElTransfer`, and on any future silently added prop.
- A `ElRadio` row asserts `label` is bound and `value` is not (the `value` prop only exists from 2.6).
- The audit table itself (one row per control, prop, event, introduced-in version, safe yes/no) is reviewed manually against `boundContract`: every row has a matching list and the reverse. The adversarial reviewer and qa-verifier check this; no markdown parsing in tests.

**AC6, peer range unchanged** (`boundContract.logic`): a test reads `packages/element-plus/package.json` and asserts `peerDependencies['element-plus'] === 'catalog:framework'`, and reads `pnpm-workspace.yaml` (plain text match, no YAML dependency) and asserts the `framework` catalog entry for `element-plus` is `'>=2.0.0'`. It uses `node:fs` and a path resolved from `import.meta.url`. A deliberate range change then fails the test, which forces the conversation with Jeroen.

**AC7, text and select unchanged** (`bindings.logic`): written first against the current bindings (characterization, green before any binding change) and kept green afterwards. `text`: `placeholder`, `clearable`, `size`, `readonly` reach `ElInput` (props and the rendered `input` element's `readonly` and `placeholder` attributes). `select`: `placeholder`, `clearable`, `filterable`, `multiple`, `size`, and one `ElOption` per `options` entry with the right `label` and `value`. Edge: `multiple: true` returns an array, `multiple` unset returns the single value.

**AC8, hygiene**: no unit test; see manual checklist. `pnpm run ci:test`, `ci:lint`, `ci:typecheck` in `packages/element-plus` must pass.

**Edge cases** (all in `bindings.logic`, one test each):
- `number`, initial `undefined`, `precision: 2`: input renders empty; increasing emits a `number`; stored value is `number | undefined`.
- `checkbox`, initial `undefined`: renders unchecked without a warning; click stores `true`.
- `cascader`, initial `null`: renders empty without a warning; choosing a path stores the array.
- `select` multiple versus single: covered under AC7.
- `upload` with `autoUpload: false` and no `action`: covered under AC2.

### States asserted

The feature skipped the design phase, so there is no states policy. The states asserted for this slice are: empty (initial `undefined` or `null`), populated (initial value), changed (after one interaction), disabled (both sources), and invalid (required, see below). Loading is not applicable: the upload tests never start a request, so no in-flight status is rendered.

### Validation and reactivity

- `upload.validation`: a field with `minOccurs: 1` for `upload` and for `transfer`, initial `undefined`. Assert the form is invalid with an error on that path before input, and valid with no error after a change writes a non-empty value. This proves the repaired binding reaches vee-validate, which is the stated user benefit. If an empty array already counts as "present" for the required rule, the test starts from `undefined` only and the developer notes the rule's behaviour.
- `bindings.analytics` with `settings: { analytics: true }`: for `upload` and `transfer`, read `data-testid="<path>-analytics-render-count"` after mount, perform one change, and assert the count grows by a small bounded amount (developer sets the exact bound from the first green run and commits that number) with no "maximum recursive updates" warning. Reason: feeding the stored list back into `ElUpload` `fileList` and `ElTransfer` `modelValue` is a classic write-loop shape. `DynamicFormItem` itself is not modified in this story, so no other render-count suite is added.

### Coverage

`pnpm -r ci:test:coverage` has no threshold configured for this package (`vite.config.ts`), and the package coverage was effectively nil with the placeholder test, so the baseline cannot drop. The plan exercises every `<type>-input` fallback for the 15 controls, so the changed template lines are covered. Knowingly uncovered: the `default-input` fallback and the `heading`/`divider`/`checkbox`/`switch` wrappers (they belong to the slot-forwarding story's tests), and the popper internals of Element Plus controls (not our code).

### Time sensitivity

`ci:test` and `ci:test:coverage` set `TZ=Europe/Amsterdam`. Date, time, and datetime rows use string values with `valueFormat`, so nothing depends on the machine zone; no fake timers are needed. One manual run under `TZ=UTC` and `TZ=America/Los_Angeles` confirms the rows really are zone independent.

### Regression risk

- Touched: only the `<type>-input` fallbacks in `ElementPlusFormTemplate.vue` and the package test files. `packages/core` is untouched, so core suites are unaffected.
- Story 2 (slot forwarding) edits the same slots; these tests mount through bare usage and read values via the form, so they survive a change in how fallbacks are wrapped. If the forwarding story changes the slot-scope destructuring shape, these bindings must be re-read by the developer.
- Story 4 (CSS) lands after this one in the same SFC; class-free selectors keep these tests stable.
- Story 8 (playground) renders `upload`, `transfer`, and `cascader`; the manual Storybook step below is the guard until then.
- Guarding existing tests: the foundation and forwarding stories' tests for mount, rename, and slot fallbacks; nothing else exercises these bindings today, which is why the characterization-first rule for text and select matters.
- Dependency: requires the foundation story's jsdom, `@vue/test-utils`, and setup file, and the forwarding story's bare-usage path. If bare usage is not yet available when this story is implemented, `mountBoundForm` falls back to a minimal wrapper that forwards `#input` and `#attributes` (still no mocks of Element Plus).

### Manual verification checklist

1. Storybook, Element Plus story: pick a file in `upload`, confirm the form value output shows it, remove it, confirm the value clears. Repeat for `transfer` (move items both directions) and `cascader` (single and multiple).
2. In a browser, exercise the emit-driven controls (`select`, `date`, `time`, `datetime`, `slider`, `color`) once to confirm the real emitted payload matches the stored type (covers the weaker emit-based proof in jsdom).
3. Floor check: in a scratch install (not committed), run the bindings and boundContract suites against `element-plus@2.0.x` and one mid-range release (for example 2.4.x) and record pass/fail per control in Implementation notes. The declared-prop assertion against the pinned version will need the allowlist to be the only source of truth; treat failures as audit rows to mark "unsafe", not as reasons to edit tests silently.
4. Audit table review: every control has a row; each row's prop and event is in `boundContract`; any "newer than 2.0.0" item is either replaced with a floor-safe equivalent or listed as an open point for Jeroen.
5. Hygiene grep over changed files: no em dashes, and no `FEAT`, `ST-`, `AC` followed by a digit, `ADR`, "finding", or "decision" in comments or test names.
6. `packages/element-plus/package.json` diff shows no change to the `element-plus` peer range.

## Adversarial review
Lite, story level. Reviewer running as opus. All three QA-flagged claims were re-verified against the installed `element-plus@2.14.2` type sources in `node_modules/.pnpm/`, not just reasoned about; all three hold. Findings below.

1. **BLOCKER (AC4, transfer disabled): the acceptance criterion is factually wrong and cannot be satisfied as written.** Verified in `node_modules/.pnpm/element-plus@2.14.2.../es/components/transfer/src/transfer.d.ts`: `TransferProps` has no component-level `disabled` prop (its members are `data`, `titles`, `buttonTexts`, `filterPlaceholder`, `filterMethod`, `leftDefaultChecked`, `rightDefaultChecked`, `renderContent`, `modelValue`, `format`, `filterable`, `props`, `targetOrder`, `validateEvent`). The only `disabled` is `TransferPropsAlias.disabled`, the name of the per-item key inside each `data` entry. So AC4's "`transfer` ... is included via its `disabled` prop" describes a binding that disables nothing; a test asserting the prop or attribute would pass green while items remain movable. Resolution: routed a PROPOSED rewrite into AC4 (per-item `disabled` on `data` + disabled checkboxes + no item moves). Source: element-plus 2.14.2 `transfer.d.ts`.
   DECIDED (research): adopted into AC4 (per-item `disabled` on `data`), a factual correction verified in the installed typings.

2. **BLOCKER (AC1, date/time/datetime type): "documented value type" is unsatisfiable without an unresolved design decision.** `ElDatePicker`/`ElTimePicker` emit a `Date` object unless `value-format` is set, but `ElementPlusValueTypes` declares `date`/`time`/`datetime` as `string`. Unless the `-input` fallback sets `value-format`, a bare consumer stores a `Date` in a field the public type promises is a `string`: a type lie shipped to consumers. AC1 does not say the fallback sets `value-format`, so it is ambiguous exactly where correctness lives. Resolution: routed a PROPOSED clause into AC1 (bind `value-format` to the documented formats so the stored value is the declared `string`; keep the characterization test for the no-`value-format` `Date` behaviour). The alternative, widening `ElementPlusValueTypes` to `string | Date`, is an ST-01 public-type change this story cannot make silently, so it is not taken here. Source: Element Plus Date/Time picker `value-format` semantics.
   DECIDED (research): the fallbacks bind a default `value-format` and the type is not widened (see AC1); the `datetime` separator is recorded there as `ASSUMED (story prep)`.

3. **SHOULD-FIX (AC2, upload removal): the criterion covers adding a file but not removing one, so the delivered binding would be incomplete.** Verified in `.../es/components/upload/src/upload.d.ts` (`UploadHooks`): `onChange` fires on select / upload-success / upload-fail; `onRemove` fires on removal. Binding only `on-change` leaves a removed file in the form value, contradicting the user story's "validated and submitted" promise. The QA plan already includes a removal test, but the AC does not pin it. Resolution: routed a PROPOSED removal clause into AC2. Source: element-plus 2.14.2 `upload.d.ts`.
   DECIDED (research): adopted into AC2 (`on-remove` also writes the list).

Checked and cleared (not findings): the `ElRadio :label`-for-value choice is correct on the `>=2.0.0` floor (the `value` prop was only added in element-plus 2.6.0, confirmed via the Radio changelog/docs); the 15-control list in AC1 is consistent with the feature's 17-type catalogue minus valueless `heading`/`divider`; the dependency on ST-02 is explicit; the transfer/cascader/slider value shapes in AC3 match the emitted types (`TransferKey[]`, `CascaderValue`, `number | number[]`). No silent override of the approved feature design/architecture was found: AC2's file-list + on-change binding and the per-control floor audit are exactly what the feature's Data flow DECIDED entries mandate.

## Implementation notes

Changes: `packages/element-plus/src/ElementPlusFormTemplate.vue` (fallback bindings), a comment on `targetKeys` in `metadata.ts`, URL object stubs in `src/tests/test-setup.ts`, `specs/components.md`. `packages/core` untouched, no changeset (private package), peer range unchanged (asserted by a test).

Fixes made:
- `date-input`, `time-input`, `datetime-input`: `valueFormat` is `field.valueFormat ?? <default>` (`YYYY-MM-DD`, `HH:mm:ss`, `YYYY-MM-DD HH:mm:ss`). The `date` slot uses the datetime default when its `type` property starts with `datetime`, so a `date` field configured as a datetime picker does not drop the time.
- `upload-input`: `modelValue` replaced by `fileList` plus `onChange` and `onRemove`, each writing the resulting list through `handleChange`. The stored items keep `raw` as a `File` (vee-validate cloning does not strip it), and one selection writes the form value once.
- `transfer-input`: `targetKeys` removed; bound only through `modelValue`. Every item in `data` gets `disabled: true` when the field is disabled (metadata or engine), because `ElTransfer` has no disabled prop.

Deviations and choices:
- `targetKeys` metadata property: kept in `ElementPlusFieldProperties` for parity but documented as not read by the template (option "documented as unused"). A fallback for the initial value was rejected because the right panel would then show keys that the form value does not hold.
- The radio `label` binding makes Element Plus 2.14 log "label act as value is about to be deprecated in version 3.0.0". `expectNoWarnings` filters exactly that message. The `label` binding stays because `value` only exists from 2.6.
- The bound-contract test compares the exact vnode prop keys of each Element Plus component to a list (`fixtures/boundContract.ts`) and checks every listed key is declared by the installed component. Stricter than the plan (equality, not subset), so an added or removed binding fails it.
- `bindings.analytics`: the render count delta for one upload selection and one transfer move is 0, so the committed bound is 0; the tests also assert the value was written, so the zero is not vacuous.
- `test-setup.ts` defines `URL.createObjectURL` and `URL.revokeObjectURL` stubs (jsdom lacks them; the upload list threw in `beforeUnmount` without). No `ResizeObserver` stub was needed.
- Transfer disabled tests assert per-item flags, disabled item checkboxes, and that nothing moves; they do not assert a component disabled prop.

### Peer floor audit (AC5)

Version truth was checked by installing `element-plus@2.0.0` and `2.4.4` in a scratch directory (not committed) and running the committed contract list against the real component `props`/`emits` of each; plus the Element Plus changelog. Result: every bound name exists at 2.0.0 except one.

| Control | Bound props | Bound event | Introduced | Safe at >=2.0.0 |
| --- | --- | --- | --- | --- |
| text `ElInput` | modelValue, placeholder, disabled, readonly, size, clearable | update:modelValue | 2.0.0 | yes |
| select `ElSelect` / `ElOption` | modelValue, placeholder, disabled, size, clearable, filterable, multiple / label, value | update:modelValue | 2.0.0 | yes |
| checkbox `ElCheckbox` | modelValue, disabled, size | update:modelValue | 2.0.0 | yes |
| radio `ElRadioGroup` / `ElRadio` | modelValue, disabled, size / label | update:modelValue | 2.0.0 (`value` on ElRadio only from 2.6, not used) | yes |
| date, datetime `ElDatePicker` | modelValue, type, placeholder, disabled, readonly, size, clearable, format, valueFormat | update:modelValue | 2.0.0 | yes |
| time `ElTimePicker` | modelValue, placeholder, disabled, readonly, size, clearable, format, valueFormat | update:modelValue | 2.0.0 | yes |
| switch `ElSwitch` | modelValue, disabled, size | update:modelValue | 2.0.0 (changelog mentions "add size" in 2.2.0, but the prop is declared at 2.0.0) | yes |
| number `ElInputNumber` | modelValue, placeholder, disabled, size, min, max, step, precision | update:modelValue | 2.0.0 | yes |
| number `ElInputNumber` | readonly | | 2.2.16 | NO, see open point |
| rate `ElRate` | modelValue, disabled, max | update:modelValue | 2.0.0 | yes |
| slider `ElSlider` | modelValue, disabled, min, max, step, showStops, range | update:modelValue | 2.0.0 | yes |
| color `ElColorPicker` | modelValue, disabled, size, showAlpha, colorFormat | update:modelValue | 2.0.0 | yes |
| cascader `ElCascader` | modelValue, options, props, placeholder, disabled, size, clearable, filterable | update:modelValue | 2.0.0 | yes |
| transfer `ElTransfer` | modelValue, data (per-item `disabled` key), filterable | update:modelValue | 2.0.0 (the item alias `disabled: 'disabled'` is in the 2.0.0 source) | yes |
| upload `ElUpload` / `ElButton` | fileList, action, accept, listType, autoUpload, showFileList, disabled, size | onChange, onRemove (props) | 2.0.0 | yes |

Floor check results (checklist step 3): declared-name check at `2.0.0`: only `ElInputNumber readonly` missing. At `2.4.4`: all present. The bindings and boundContract suites themselves were not re-run against the older install (the workspace pins 2.14.2); the declared-name check above is the equivalent for the contract suite. The behavioural round-trip suite was only run on 2.14.2.

Open point for Jeroen: `ElInputNumber` `readonly` does not exist before 2.2.16. There is no floor-safe equivalent. On 2.0.0 to 2.2.15 the binding falls through as a plain attribute on the root element and does nothing, so the field is editable. It is harmless, so it is kept; decide whether to accept this, raise the floor for it, or drop `readonly` for `number`.

Not done here: the browser checks of the manual checklist (Storybook upload/transfer/cascader, emit-driven pickers in a real browser, `TZ` runs were done with vitest under UTC and America/Los_Angeles: 267 passing in both).

Checks: `pnpm run ci:test` (267 tests), `ci:lint`, `ci:typecheck` pass for `packages/element-plus`; `ci:test:coverage` 100% statements, 97.95% branches, 100% functions and lines; `pnpm run build` for the package succeeds.

## Verification report

Verdict: **pass-with-notes**. All checks were re-run independently.

### Pipeline results (packages/element-plus)
- `pnpm run ci:test`: 14 files, 267 tests pass. Also 267 pass under `TZ=UTC` and `TZ=America/Los_Angeles`.
- `pnpm run ci:lint`: clean. `pnpm run ci:typecheck`: clean.
- `pnpm run ci:test:coverage`: 100% statements, 97.95% branches, 100% functions, 100% lines (template: 97.87% branches, line 81 uncovered). No threshold is configured and the baseline was effectively nil, so no drop.
- `packages/core`: `ci:test` 686 tests pass; `git status` shows no change under `packages/core` and no `.changeset` change, as required for a private package.
- `docs/` untouched, so `docs:build` not needed.
- Mutation checks on `ElementPlusFormTemplate.vue` (restored byte-identical, sha1 `97543c8f...` before and after): removing the date default `valueFormat` fails the default-format test; removing `onRemove` fails 3 tests (removal and contract); un-doing per-item transfer `disabled` fails both transfer disabled rows; re-adding `targetKeys` fails 3 tests; switching the radio to `value` fails 2 tests. The suite bites on the story's key behaviours.

### Criterion table
| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | 15 controls round trip | pass | `bindings.logic`: `text`, `select` (string and number), `checkbox`, `radio` (number stays number), `date`/`time`/`datetime` (string), `switch`, `number`, `rate`, `slider`, `color`, `cascader`, `transfer` each show the initial value and write the new one; `upload` in `upload.logic`. Default formats and explicit `valueFormat` override asserted; `date` with `type: datetime` uses the datetime default. Template lines 80-90, 195-250 match the DECIDED/ASSUMED entries. |
| 2 | Upload binds through file list, on-change, on-remove | pass | `upload.logic`: initial list shown as `fileList`; no `modelValue`/`onUpdate:modelValue` on vnode; selection writes the full list once (sync watch count 1); `raw` stays a `File`; removal via `onRemove` and via the delete icon updates the value; no `XMLHttpRequest.open`/`fetch` with `autoUpload: false`. |
| 3 | Transfer, cascader, slider contracts | pass | `bindings.logic`: transfer bound via `modelValue` only, no `targetKeys` attr or vnode prop, `targetKeys` metadata ignored (documented as unused, comment in `metadata.ts`, `components.md`); cascader single and `multiple`; slider number and range pair. |
| 4 | Disabled honoured | pass | `disabled.logic`: 14 controls x (metadata, engine `maxOccurs: 0`) via `props('disabled')`, plus upload `ElButton`, plus negative case; transfer per-item `disabled`, checkboxes disabled, nothing moves, no component prop asserted. |
| 5 | Audit table recorded | pass | Implementation notes table has one row per control. I checked it row by row against `fixtures/boundContract.ts` and the template: they match. `boundContract.logic` asserts exact bound keys and that each is declared by the pinned component. I also unpacked `element-plus@2.0.0`: `input-number` has no `readonly`, and `transfer` already uses the per-item `disabled` alias key, confirming the audit. The `ElInputNumber readonly` item is recorded as an open point, not silently accepted. |
| 6 | Peer range unchanged | pass | Test asserts `catalog:framework` and `'>=2.0.0'`; `git diff` of `package.json` only adds `@vue/test-utils` and `jsdom` dev dependencies. |
| 7 | Text and select unchanged | pass | `bindings.logic` "text and select props" plus multiple/single select tests. |
| 8 | Hygiene | pass | Greps over `packages/element-plus/src`: no em dashes; no FEAT/ST/AC/ADR/finding/decision/story references. Lint, typecheck, tests green. |

Edge cases: `number` empty with `precision` (pass), `checkbox` undefined (pass), `cascader` null (pass), `select` multiple vs single (pass), `upload` without action (pass). Extra: `upload.validation` (required invalid then valid for upload and transfer), `bindings.analytics` (no write loop).

### Prototype comparison
No prototype exists for the feature; not applicable. No visual change in this story.

### Compliance
- `specs/components.md` updated for the new behaviour (valueFormat defaults, upload binding, transfer binding). No new exports.
- No changeset needed (private package, `packages/core` untouched).
- No silent deviation from the DECIDED/ASSUMED entries. Documented choices: `targetKeys` documented as unused, radio `label` kept for the floor.

### Notes (non-blocking)
1. Open point for Jeroen remains: `ElInputNumber` `readonly` does not exist before 2.2.16 (verified against 2.0.0), so `number` stays editable on 2.0.0 to 2.2.15. Accept, raise the floor, or drop `readonly` for `number`.
2. The radio `label` deprecation message from Element Plus 2.14 still prints as stderr noise in test output (filtered only inside `expectNoWarnings`).
3. The date/time/datetime and several other round-trip rows drive the control by emitting `update:modelValue`, not a real browser pick. The default `valueFormat` is covered by a separate prop assertion. The browser manual checklist (Storybook upload/transfer/cascader, pickers, `TZ` runs under a browser) was not run; the older Element Plus run covered only declared names, not behaviour.
4. A few tests use Element Plus class selectors (`.el-select__wrapper`, `.el-transfer-panel`, `.el-upload-list__item`), against the plan's class-free guidance. These are Element Plus internal classes, so they are unaffected by the later CSS story.
5. The `bindings.analytics` bound is 0 (delta); the tests also assert the value was written, so it is not vacuous.

This is the story's verdict only. Jeroen should link the PR in the frontmatter. FEAT-004 still has later stories open, so the feature cannot move to `done`.
