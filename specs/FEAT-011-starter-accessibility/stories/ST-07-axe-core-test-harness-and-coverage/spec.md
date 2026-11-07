---
id: ST-07
type: story
feature: FEAT-011
status: qa
approved_by: ""
pr: ""
---

# Story: axe-core test harness, blocking in `pnpm ci`

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

6. **`color-contrast` is documented as out of scope for this harness.**
   Given jsdom's lack of a layout engine,
   When the axe configuration is reviewed,
   Then a comment or test-plan note records that `color-contrast` cannot run under jsdom and is auto-disabled, with contrast verified instead by the manual/screenshot checklist from ST-02.

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
