---
id: ST-07
type: story
feature: FEAT-011
status: done
approved_by: Jeroen
pr: ""
---

# Story: axe-core test harness, blocking in `pnpm ci`

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- AR-1 → the helper explicitly disables `color-contrast` in the axe run options; AC6 documents the explicit disable (axe-core does not auto-disable the rule under jsdom, it returns it as `incomplete`)

## Functional
### User story
As a maintainer of the starter template, I want an automated accessibility check that runs as part of the existing test suite and fails the build on a regression, so that a future change to the template's markup is caught by CI instead of relying on manual review.

### Acceptance criteria
1. **`axe-core` is a dev-only dependency of `packages/starter`.**
   Given `packages/starter/package.json`,
   When inspected,
   Then `axe-core@4.14.0` is listed under `devDependencies`, not `dependencies`, so it never reaches a consumer's bundle.

2. **A reusable matcher/helper wraps `axe-core.run(container)`.**
   Given a new small helper (in `src/tests/test-setup.ts` or a dedicated test-helper file),
   When a test calls it against a mounted container,
   Then it returns a result whose violations, if any, are asserted with a readable failure message (rule id + affected node), not a bare boolean.

3. **Per-component axe assertions exist for every modified component.**
   Given `TextInput`, `SelectInput`, `PasswordInput`, `ToggleSwitch`, `CheckboxField`, `ErrorMessage`, `ChoiceCard`/`ChoiceSectionCard`, `ArrayField`/`RepeaterCard`, `FormWizard`/`Stepper`, and `PasswordStrengthBar`,
   When each component's existing `*.test.ts` file runs,
   Then it includes at least one axe assertion against that component's mounted output, covering both a valid and an invalid/error render where applicable.

4. **A whole-template assertion exists.**
   Given a new or extended test that mounts `StarterFormTemplate` with representative metadata exercising text, select, password, toggle, checkbox, choice-card, and array fields together,
   When axe runs against the mounted DOM,
   Then it reports zero violations for the rule categories axe can evaluate under jsdom (roles, names, `aria-*` validity, idref integrity).

5. **A violation fails `pnpm ci`.**
   Given any of the assertions above,
   When a real axe violation is introduced (verified once during implementation by temporarily breaking one `aria-describedby` wiring),
   Then the relevant test fails and `pnpm ci` reports it as a failure, not a warning.

6. **`color-contrast` is explicitly disabled and documented as out of scope for this harness.**
   Given jsdom's lack of a layout engine,
   When the axe configuration is reviewed,
   Then the helper passes `{ rules: { 'color-contrast': { enabled: false } } }` to `axe.run`, and a comment records that `color-contrast` cannot be computed under jsdom and is disabled explicitly, with contrast verified instead by the manual/screenshot checklist from ST-02.

   DECIDED (research): adversarial review finding 1 applied as proposed. axe-core does not auto-disable `color-contrast` under jsdom: with no layout engine it returns the rule as `incomplete`, and standard tooling (`jest-axe`) disables it proactively to avoid that noise and the documented cases where it errors. The helper disables it explicitly in the run options, and this criterion now describes the explicit disable instead of an auto-disable that does not exist.
   Sources: github.com/dequelabs/axe-core/issues/3837, jest-axe's documented default of disabling `color-contrast`

### Edge cases
- A component with no error state reachable in isolation (e.g. `Stepper`) is asserted only in its valid render; its invalid/error coverage comes from the whole-template test instead.
- The whole-template test's representative metadata must include at least one field of every type this feature touched, so a regression in any one of them is caught by that single integration test even if a future change accidentally skips updating the per-component test.

### Out of scope
- Behavioral focus/keyboard tests (`document.activeElement` assertions, `trigger('keydown.*')`): these belong to the story that implements the behavior (ST-04, ST-05, ST-06), per adversarial review finding 2, not to this harness story. This story adds axe's static ARIA assertions only.
- Any markup or attribute change: this story only adds tests and a dev dependency.

## Design reference
Not applicable. This story has no visual surface; it is a test-infrastructure slice. See the feature's [axe-core test integration plan](../../spec.md#axe-core-test-integration-plan) for the full rationale (axe-core vs. `vitest-axe`, the jsdom `color-contrast` limitation, and the blocking decision).

## Architecture reference
Implements the feature architecture's Slicing seam 6, the full [axe-core test integration plan](../../spec.md#axe-core-test-integration-plan), ADR 5, and Open question 6's decisions (blocking; both per-component and whole-template coverage):

- **`packages/starter/package.json`** — adds `axe-core@4.14.0` as a devDependency.
- **`packages/starter/src/tests/test-setup.ts`** (or a new dedicated helper file) — the ~15-line `axe-core.run(container)` wrapper/matcher.
- **Existing `*.test.ts` files** for every component listed in AC3 — extended with axe assertions, reusing each file's existing mount setup.
- **A whole-template test** (new or extended) mounting `StarterFormTemplate` with representative metadata.
- **Public API surface touched:** none. Test-only change; no runtime code, no export, no `packages/core/src/` change.
- **Dependencies on other stories:** depends on **ST-01 through ST-06** landing the markup and behavior this harness asserts against. Natural last functional-adjacent slice, implemented after all six.
- **Changeset:** not carried here (dev-only dependency and tests have no consumer-facing runtime effect); the feature's changeset is carried by ST-06.
- **Documentation:** none assigned to this story. Test infrastructure is not consumer-facing documentation.

## QA plan

Verified against the live tree: `packages/starter/src/__tests__/` already has `ErrorMessage.test.ts`, `CheckboxField.test.ts`, `PasswordInput.test.ts`, `ChoiceCard.test.ts`, `ChoiceSectionCard.test.ts`, `ArrayField.test.ts`, `RepeaterCard.test.ts`, `FormWizard.test.ts`, and `Stepper.test.ts`. There is no `TextInput.test.ts`, `SelectInput.test.ts`, `ToggleSwitch.test.ts`, or `PasswordStrengthBar.test.ts` today; ST-01's QA plan already schedules the first three as new files, and ST-03 is expected to add the fourth. By the time this story is implemented (last, per dependency order), those four files should exist; if any does not, this story creates it rather than skip that component's coverage, since AC3 names it explicitly. `packageManifest.test.ts` already pins the exact `devDependencies` key set and asserts `dependencies` equals exactly `['@lucide/vue']`, so it is the natural regression guard for AC1 and needs one line added, not a new file. `mountInForm` (`fixtures/mountInForm.ts`) and the existing metadata fixtures (`fixtures/metadata.ts`, `fixtures/choiceMetadata.ts`, `fixtures/wizardMetadata.ts`) are reused for the whole-template test; one new fixture (representative combined metadata) is needed for AC4.

This story touches no `DynamicFormItem`, `computedProps`, or validation wiring itself (it only asserts against markup ST-01 through ST-06 already produce), so no `*.analytics.test.ts` file is added by this story. The existing analytics suites from earlier stories remain the reactivity regression guard.

### New helper

- `packages/starter/src/__tests__/helpers/axe.ts` (new): `expectNoAxeViolations(container: Element)` running `axe.run(container, { rules: { 'color-contrast': { enabled: false } } })` and, when `results.violations.length > 0`, throwing/failing with a message listing each violation's rule id, impact, and the affected node's `outerHTML`/selector (not a bare boolean). `color-contrast` is disabled explicitly because it cannot be computed under jsdom (no layout engine); left enabled it returns `incomplete` results and can error, so the explicit disable is the standard, deterministic approach (`jest-axe` does the same). Placed under the existing `helpers/` folder alongside `compiledStylesheet.ts`/`sourceScan.ts` rather than `src/tests/test-setup.ts`, since it is consumed by individual test files via an explicit call, not a global setup hook, and the project's `helpers/` folder already exists for exactly this kind of test-only utility.
- `packages/starter/src/__tests__/axeHelper.logic.test.ts` (new): unit-tests the helper itself, since its branching (pass vs. throw, message formatting) is new logic that needs direct coverage, not just incidental coverage through component tests. Cases: a clean container (e.g. one labelled `<button>`) resolves without throwing; a container with a deliberate violation (e.g. an `<input>` with no accessible name) throws/fails with a message containing the rule id (`button-name` or `label` equivalent) and a node reference.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 `axe-core@4.14.0` is a devDependency, never a dependency | Add `'axe-core'` to `expectedDevDependencyKeys`; the existing `dependencies` assertion (`toEqual(['@lucide/vue'])`) already fails if it is ever added there instead, so no new assertion is needed for the negative half | `packages/starter/src/__tests__/packageManifest.test.ts` |
| 2 Reusable helper wraps `axe-core.run(container)` with a readable failure message | Covered by the new helper's own unit tests above | `packages/starter/src/__tests__/axeHelper.logic.test.ts` |
| 3 Per-component axe assertions, valid and invalid/error render where applicable | One new `it` per component, mounted with complete/realistic props (not the minimal props some existing edge-case tests use, to avoid spurious unrelated violations), calling `expectNoAxeViolations(wrapper.element)`. See per-component breakdown below | Extends each component's existing `*.test.ts`; adds `TextInput.test.ts`, `SelectInput.test.ts`, `ToggleSwitch.test.ts`, `PasswordStrengthBar.test.ts` only if not already created by ST-01/ST-03 |
| 4 Whole-template assertion with representative metadata | New fixture combining a text field, select, password field (with strength bar), toggle, checkbox, explicit choice-card group, and a repeatable array, mounted once via `mountInForm`; one `it` runs axe against `wrapper.element`, a second `it` forces a required-field validation failure first (via `validate()`) and re-runs axe against the error-rendered DOM | `packages/starter/src/__tests__/StarterFormTemplate.axe.test.ts` (new); fixture in `fixtures/metadata.ts` or a new `fixtures/axeMetadata.ts` |
| 5 A real violation fails `pnpm ci` | Not a persisted automated test (a permanently broken `aria-describedby` wiring cannot stay in the repo). One-time manual verification during implementation: temporarily remove one `aria-describedby` wiring, run the affected test file and confirm it fails with a readable message, then run `pnpm ci` and confirm it reports a failure, not a warning; revert before committing. Recorded as a step in the implementation notes/PR description, not as a test file | Manual (see checklist) |
| 6 `color-contrast` explicitly disabled and documented as out of scope | Not an assertion (once the helper disables the rule in the run options, asserting its absence from `results.violations` would prove nothing). Satisfied by the explicit `{ rules: { 'color-contrast': { enabled: false } } }` in the helper plus a short code comment next to it and/or in the whole-template test file stating `color-contrast` cannot be computed under jsdom and is verified instead by the ST-02 manual/screenshot checklist. Verified by code review, not a test | Manual / code review (see checklist) |

### Per-component axe coverage (AC3 detail)

| Component | Valid render | Invalid/error render | Notes |
| --- | --- | --- | --- |
| `TextInput` | Labelled input via `FormField`/`StarterFormTemplate`, no error | `aria-invalid="true"` + `aria-describedby` pointing at a rendered error | Through `StarterFormTemplate.ariaWiring.logic.test.ts` (ST-01) or its own file; axe needs the labelling context, so prefer asserting at the `StarterFormTemplate`/`FormField`-wrapped level over the bare component |
| `SelectInput` | Same as `TextInput` | Same as `TextInput` | Same note |
| `PasswordInput` | Labelled, reveal button has `aria-label` | With error; reveal toggled to "Hide password" state once | |
| `ToggleSwitch` | Labelled `role="switch"`, no error | `ariaInvalid: true` + `ariaDescribedby` set | Mount the component directly; it already carries its own accessible name via the `label` prop |
| `CheckboxField` | Labelled, with description, no error | With description and error (both siblings of `<label>`, per ST-01) | Confirms ST-01's AC6 fix (error/description outside the clickable label) produces no idref/label-nesting violation |
| `ErrorMessage` | No message, no `role="alert"` span rendered (nothing to assert beyond "no violation") | Rendered with a message and `id` | Trivial but included per AC3's explicit listing |
| `ChoiceCard` / `ChoiceSectionCard` | Full group with title/description per card, one selected | A card group including a disabled card (roving-tabindex skip target, per ST-06) | Mount with real `title`s; the bare `mount(ChoiceCard)` edge-case tests in the file today are not extended, since they intentionally omit accessible content |
| `ArrayField` / `RepeaterCard` | Array with a label and at least one item, "Add" button | Empty state (no items, only the "Add" button) | Mount with a real `label`, not the bare `mount(ArrayField)` calls already in the file; empty state is the "edge case" from the feature design's states policy, not an error state, since `ArrayField`/`RepeaterCard` carry no validation UI of their own |
| `FormWizard` / `Stepper` | Default wizard render at step 1 | Asserted only in its valid render here, per the story's own edge case; invalid/error coverage (the step-errors banner, `role="alert"`) comes from `StarterFormTemplate.wizard.test.ts` using `wizardMetadata({ requiredPages: [0] })` and triggering a failed `next()`, which is itself a "whole template" render in the wizard context | Resolves the story's edge-case note about `Stepper` having no reachable error state in isolation |
| `PasswordStrengthBar` | Decorative bar (`aria-hidden`) + `.sft-sr-only` live region with tier text, mounted directly | No distinct "invalid" state for this component; not applicable | New file if ST-03 has not already created one |

### Edge cases to tests
- Representative metadata in AC4's whole-template test must include every type this feature touched (text, select, password, toggle, checkbox, choice-card, array) in one DOM, per the story's own edge-case note, so a regression in any one is caught even if a future change skips updating its per-component test.
- A component with no reachable error state in isolation (`Stepper`, `ArrayField`'s/`RepeaterCard`'s own chrome) is asserted valid-only at the component level; its invalid coverage comes from a whole-template-style render (the wizard test for `Stepper`, AC4's test for the array section).
- Disabled `ChoiceCard` inside a group: confirmed included in the `ChoiceSectionCard`/`ChoiceCard` axe assertion (not just the per-component `is-disabled` unit test already in the file), so a disabled option is never left as a roving-tabindex target.

### States from the feature's states policy applicable to this slice
- **Error (new semantics from ST-01).** Covered by every component's invalid-render axe assertion above (`aria-invalid`, `aria-describedby`, `role="alert"`) and the whole-template post-validation assertion.
- **Valid / pristine.** Covered by every component's valid-render axe assertion.
- **Disabled.** Covered for `ChoiceCard` (disabled card inside the group) per the edge case above; not otherwise a distinct accessibility state this story needs to separately assert beyond what ST-01/ST-06 already wire.
- **Loading / empty.** No loading state exists in this feature's surface (per the feature's states policy). Empty is covered for `ArrayField` (no items, only the Add button).

### Reactivity / analytics
No new `*.analytics.test.ts` file. This story adds no `computed()`, no `watch`, and no vee-validate wiring; it only asserts against markup and attributes ST-01 through ST-06 already produce. The existing analytics suites for those stories remain the regression guard for render-count behaviour; this story does not re-test reactivity.

### Coverage
New code introduced by this story is the helper (`helpers/axe.ts`) and its test file, both small and both covered 1:1 by `axeHelper.logic.test.ts`. The per-component and whole-template assertions add test lines, not source lines, so they can only raise `packages/starter`'s coverage, never lower it. `pnpm -r ci:test:coverage` is expected to stay at or above baseline. Nothing in this story is knowingly left uncovered.

### Time sensitivity
None. No date/time-dependent behaviour in this slice; the helper and its assertions are deterministic given a mounted DOM.

### Regression risk
- Adding axe assertions to existing `*.test.ts` files risks making those files flaky or slow if axe is run against large, unrelated DOM trees; scope each call to the specific mounted component/wrapper, not `document.body`, to keep failures attributable and runtime bounded.
- A false-positive axe violation unrelated to this feature (e.g. a pre-existing missing accessible name on a fixture that happens to omit `label`/`title` props) would block `pnpm ci` for reasons outside this feature's scope; mitigated by mounting with realistic/complete props for the specific `it` blocks that run axe, rather than retrofitting axe onto every existing minimal-prop edge-case test in each file.
- `packageManifest.test.ts`'s exact-list assertions (`expectedDevDependencyKeys`, the `dependencies` equality) are the regression guard that `axe-core` never leaks into `dependencies` or the published bundle; no other test in the suite currently guards dependency placement.
- This story depends on ST-01 through ST-06 having landed their markup; if any of those stories' acceptance criteria regress later, the per-component and whole-template axe assertions added here are the mechanism that catches it, which is the story's whole purpose.
- No `packages/core` or `packages/element-plus` file is touched, so their suites are unaffected by construction.

### Untestable criteria and rewrite proposals
AC5 and AC6 are not repeatable automated assertions as written, and this is inherent to what they ask for, not a flaw in the wording:
- **AC5** asks for a one-time proof that a real violation fails `pnpm ci`. By definition this cannot be a persisted test (the broken wiring must not stay in the repo). Proposal: keep the acceptance criterion as written, but treat it explicitly as an implementation-time manual step recorded in the PR description, not something the qa-verifier re-runs against the merged code. No rewrite needed, only this plan's explicit note above.
- **AC6** asks for a configuration line plus a documentation note. The explicit disable is visible in the helper's source (and exercised by every test that calls it); the note is satisfied with a code comment (near the helper or the whole-template test) verified by code review (adversarial-reviewer / final-reviewer), rather than inventing a brittle test that asserts a comment string exists. No rewrite needed.

All other acceptance criteria (1-4) map to concrete, repeatable automated tests in the table above.

### Manual verification checklist
1. During implementation only: temporarily break one `aria-describedby` wiring (e.g. have `StarterFormTemplate` omit the `-error` token), run the affected test(s) and confirm a readable failure (rule id + node), then run `pnpm ci` and confirm it reports a failure. Revert the break before committing. (AC5)
2. Confirm the helper disables `color-contrast` explicitly in its run options, that the out-of-scope comment is present and accurate at implementation time, and that ST-02's manual/screenshot checklist is the one actually exercised for contrast; no separate screenshot is owed by this story. (AC6)
3. Run `pnpm -r ci:test:coverage` after the new files are added and confirm `packages/starter`'s statement/branch/function coverage is at or above the pre-story baseline.

## Adversarial review

STORY mode (blockers only). Verified against the live tree and against axe-core's published behaviour.

Confirmed accurate: `axe-core@4.14.0` exists on npm, MPL-2.0, zero runtime dependencies (registry check); the `helpers/` folder exists with `sourceScan.ts`/`compiledStylesheet.ts`; the `fixtures/` folder has `mountInForm.ts`, `metadata.ts`, `choiceMetadata.ts`, `wizardMetadata.ts`; `PasswordStrengthBar.vue` and `src/tests/test-setup.ts` exist; `packageManifest.test.ts` exists. The dependency on ST-01 through ST-06 is stated correctly (feature Stories list says the same). The blocking decision (axe violations fail `pnpm ci`, not warn) is honoured by AC5. Scoping behavioural focus/keyboard tests out to ST-04/05/06 is consistent with the feature's finding 2 (those tests must exist, and belong to the stories that ship the behaviour).

1. **(should-fix) The "jsdom auto-disables `color-contrast`" claim is inaccurate; the helper should disable it explicitly.** AC6, the AC6 QA-map row, and the manual checklist all state that jsdom "auto-disables" `color-contrast`. axe-core does not do that: with no layout engine the rule comes back as `incomplete` (which `expectNoAxeViolations` ignores, so no false failure), and established tooling (`jest-axe`) disables it proactively precisely because leaving it enabled is unreliable and in some environments errors. If the implementer writes the AC6 comment as worded, it documents behaviour that is not real. Routed as `PROPOSED (adversarial review, finding 1)` into AC6 and the new-helper description: the helper passes `{ rules: { 'color-contrast': { enabled: false } } }` to `axe.run`, and AC6's note describes the explicit disable rather than an auto-disable. Functional impact is low (incomplete is not a violation), hence should-fix not blocker. Sources: [axe-core jsdom guidance](https://github.com/dequelabs/axe-core/issues/3837), jest-axe's documented default of disabling `color-contrast`.

   DECIDED (research): applied as proposed. The helper disables `color-contrast` explicitly via the run options; AC6, the QA map row, and the manual checklist now describe the explicit disable. The matching "auto-disables" wording in the feature spec's axe-core test integration plan is corrected too.

2. **(nit) AC5/AC6 manual routing is sound.** The qa-planner's "no rewrite needed, treat as one-time manual step" for AC5 and "code-review a comment" for AC6 is the right call: a permanently broken `aria-describedby` cannot live in the repo, and asserting a comment string is brittle. Worth noting that AC5's core guarantee (a violation fails the suite, not warns) is in fact persisted automatically by `axeHelper.logic.test.ts`'s deliberate-violation case; the manual step only adds the real-component end-to-end confirmation. No rewrite required.

3. **(nit) QA-plan "today" inventory is stale but self-correcting.** The QA plan says `TextInput.test.ts`, `SelectInput.test.ts`, and `ToggleSwitch.test.ts` do not exist "today"; they now do (ST-01 landed them). `PasswordStrengthBar.test.ts` is still absent, matching the note that ST-03 was expected to add it. The story's own rule ("if any does not, this story creates it") makes this harmless. No action needed.

## Implementation notes

All six prior stories had already landed by the time this one started, so the QA plan's "today" inventory held exactly as the adversarial review's nit predicted: `TextInput.test.ts`, `SelectInput.test.ts`, and `ToggleSwitch.test.ts` already existed; only `PasswordStrengthBar.test.ts` needed its axe coverage added to an existing file rather than a new one being created.

Built exactly as planned: `axe-core@4.14.0` as a `packages/starter` devDependency (also added to the `test` entry in the root `pnpm-workspace.yaml` catalog, alongside the other shared test tooling versions, rather than pinned as a bare version string in the package manifest; this follows the existing catalog convention even though the architecture only mentioned the bare devDependency), the `expectNoAxeViolations` helper in `src/__tests__/helpers/axe.ts`, its own `axeHelper.logic.test.ts`, per-component axe assertions in every file AC3 names, the whole-template test in `StarterFormTemplate.axe.test.ts` with a new `fixtures/axeMetadata.ts`, and one added case to `StarterFormTemplate.wizard.test.ts` for the step-errors banner.

Deviations:

- **Axe-core requires a container attached to `document.body`.** Every mount feeding `expectNoAxeViolations` passes `attachTo: document.body` (axe throws "No elements found for include in page Context" otherwise). `mountInForm`/`mountWizardForm` already did this; bare per-component mounts needed it added for their new accessibility assertions only, not for their pre-existing tests.
- **jsdom's missing canvas backend adds unrelated console noise.** Any axe run against a node with an icon (lucide SVGs, the strength bar, etc.) makes axe-core's `label-content-name-mismatch` check call `HTMLCanvasElement.prototype.getContext`, which jsdom logs as "not implemented" on every call even though axe already handles the resulting `null` context and the run completes correctly. Stubbed `getContext` to return `null` in `src/tests/test-setup.ts` (one of the two locations the architecture named for the axe wiring) so real failures stay visible in CI output instead of being buried in this noise.
- **The QA plan's suggested AC5 break does not actually produce an axe violation.** Dropping the `-error` token from `StarterFormTemplate`'s `aria-describedby` composition (the break the QA plan names) leaves an unreferenced `role="alert"` element in the DOM, which axe-core does not flag under its default ruleset; axe only checks that an `aria-describedby` value resolves, not that every alert is referenced. The verification instead temporarily removed the `:for` binding on `FormField`'s `<label>`, which axe does catch (`label`/`select-name`, critical impact) and which `pnpm run ci:test` reported as a failing step, not a warning. Reverted before committing. This is noted here because it means the markup this feature shipped is not fully provable by axe alone for the describedby-token case; `StarterFormTemplate.ariaWiring.logic.test.ts` (ST-01) remains the actual regression guard for that specific wiring, consistent with the feature architecture's own caveat that axe only covers the static ARIA layer.
- **`choiceMetadata.ts`'s `explicitChoiceMetadata` was not reused for the whole-template fixture.** It deliberately carries a broken icon name (`doesNotExist`) to exercise `StarterIcon`'s fail-soft path in other tests; reusing it here would have added an unrelated console warning to a fixture meant to be a clean, representative render. `fixtures/axeMetadata.ts` defines its own small two-branch explicit choice group instead.

No `packages/core/src/` change, so no changeset. No public API surface change, so no `specs/components.md` update.

Verification: `pnpm -r ci:test` (core 973/973, starter 671/671), `pnpm -r ci:lint`, `pnpm -r ci:typecheck`, and `pnpm --prefix playgrounds/storybook ci:typecheck` all pass. `pnpm -r ci:test:coverage` shows `packages/starter` at 99.64% statements / 94.52% branches / 94.11% functions, at or above baseline (new code is the ~25-line helper, itself covered 1:1 by its own test; everything else is added test lines). No docs changed, so `docs:build` was not run. No UI/markup changed, so no screenshots are owed.

## Verification report

### Pipeline
Ran directly per-package (root `pnpm ci` / `pnpm run ci` shadow into pnpm's built-in clean-install `ci` command via `-r`, per the known workspace quirk):
- `packages/core`: `ci:test` 973/973 passed, `ci:lint` clean, `ci:typecheck` clean.
- `packages/starter`: `ci:test` 671/671 passed (81 files), `ci:lint` clean, `ci:typecheck` clean.
- `playgrounds/storybook`: `ci:typecheck` clean.
- `packages/starter` `ci:test:coverage` (TZ=Europe/Amsterdam): 99.64% stmts / 94.52% branch / 94.11% funcs, matching the Implementation notes exactly. This story's own change is test-only (no production source lines), so it cannot drop coverage; did not re-run coverage against the pre-feature commit given the scope of this branch, but the additive-only nature of the diff makes a regression implausible.
- `docs/` content not touched by this story; `docs:build` correctly skipped.

### Acceptance criteria
| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. axe-core devDependency only | Pass | `packages/starter/package.json` lists `axe-core: catalog:test`; `pnpm-workspace.yaml` pins `axe-core: 4.14.0` under the `test` catalog; `packageManifest.test.ts` asserts the exact `devDependencies` key set (includes `axe-core`) and the exact `dependencies` list (`['@lucide/vue']` only) |
| 2. Reusable helper with readable failure message | Pass | `helpers/axe.ts` `expectNoAxeViolations`; throws `rule id: help (target nodes)` per violation; `axeHelper.logic.test.ts` covers pass, throw-with-rule-id, throw-with-node-reference |
| 3. Per-component axe assertions, valid + invalid where applicable | Pass | Verified every file named in AC3 contains `expectNoAxeViolations` calls matching the plan's valid/invalid breakdown: TextInput, SelectInput, PasswordInput, ToggleSwitch, CheckboxField, ErrorMessage (2 each), ChoiceSectionCard (2), ArrayField (2), RepeaterCard (1), FormWizard (1, valid-only per edge case), Stepper (1, valid-only per edge case), PasswordStrengthBar (1, valid-only, no invalid state exists). `ChoiceCard.test.ts` itself has no new assertion; this is the QA plan's explicit, adversarial-review-undisputed decision (bare `ChoiceCard` mounts intentionally omit accessible content, so coverage comes via `ChoiceSectionCard`'s group-level test) |
| 4. Whole-template assertion | Pass | `StarterFormTemplate.axe.test.ts` + new `fixtures/axeMetadata.ts`; one `it` for pristine render, one after `validate()` forces every field's error state; fixture combines text/select/password/checkbox(toggle)/choice/array. Confirmed `checkbox` metadata type renders `CheckboxField` (chrome) wrapping `ToggleSwitch` (input) in the same node, so one fixture field exercises both "checkbox" and "toggle" from the criterion's wording; wizard invalid-state axe coverage lives in `StarterFormTemplate.wizard.test.ts`'s new step-errors-banner case, consistent with the story's own edge-case routing |
| 5. A violation fails `pnpm ci` | Pass | `axeHelper.logic.test.ts`'s deliberate-violation case persists this automatically; the one-time manual proof is recorded in Implementation notes (a different, axe-detectable break than the QA plan's suggested one, with a documented reason the suggested break does not register as a violation, and a pointer to `StarterFormTemplate.ariaWiring.logic.test.ts` as the real regression guard for that specific wiring) |
| 6. `color-contrast` explicitly disabled and documented | Pass | `helpers/axe.ts` passes `{ rules: { 'color-contrast': { enabled: false } } }`; comment above the function explains jsdom's missing layout engine and points to the manual/screenshot checklist |

### Prototype comparison
Not applicable. Design reference explicitly states this story has no visual surface; no markup or attribute changed (confirmed: `git diff` shows no `.vue` files touched by this story, only `__tests__/`, `helpers/axe.ts`, `package.json`, and the root catalog).

### Process compliance
- `specs/components.md`: no update needed or made; no public surface changed.
- Changeset: none added; the feature's single changeset (already present, carried by ST-06) covers the user-facing behavior this harness tests. Correct per architecture.
- Library API rules: no new export from `packages/starter`'s public surface (`helpers/axe.ts` is test-only, not re-exported from `index.ts`); camelCase used throughout.
- Test naming: follows repo convention (`*.test.ts`, `*.logic.test.ts`), `describe('component X - ...')` / `it(...)` style matches sibling files.
- Deviations recorded in Implementation notes, reviewed for reasonableness:
  - `attachTo: document.body` on bare per-component mounts: necessary (axe-core requires an attached container), narrowly scoped to the new accessibility assertions. Reasonable.
  - Canvas `getContext` stub in `src/tests/test-setup.ts`: scoped to suppressing jsdom's known noisy no-op warning without masking real failures; placed at one of the two locations the architecture named. Reasonable.
  - Substituted AC5 manual break (`FormField`'s `:for` binding instead of the QA plan's `aria-describedby` token): transparently documented with the reason the originally suggested break does not register as an axe violation, and correctly identifies the actual regression guard for that case. Reasonable and more honest than forcing the originally suggested break to "work."
  - Dedicated small fixture instead of reusing `explicitChoiceMetadata`: avoids unrelated console noise in a fixture meant to be clean. Reasonable.
  - `axe-core` pinned via the `pnpm-workspace.yaml` `test` catalog rather than a bare version string: matches the existing convention for every other test devDependency in the manifest, explicitly noted as going beyond what the architecture said. Reasonable, no functional risk.
- No silent overrides of feature-level decisions found.

### Overall verdict
**Pass.** All six acceptance criteria are met with direct evidence; pipeline, lint, typecheck, and coverage all green; recorded deviations are reasonable and transparently documented, none silently contradicts the feature or architecture.

This was the feature's last story (ST-01 through ST-07 all now implemented); FEAT-011 can move to `done` once Jeroen confirms.
