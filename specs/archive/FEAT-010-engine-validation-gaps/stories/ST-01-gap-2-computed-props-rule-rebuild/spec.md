---
id: ST-01
type: story
feature: FEAT-010
status: done
approved_by: Jeroen
pr: ""
---

# Story: GAP 2, computedProps-swapped restriction/validation actually take effect

## Functional
### User story
As a consumer whose `computedProps` function swaps a field's `restriction` (a per-country postal pattern, a toggled character limit) or `validation` in response to another field's value, I want the field to actually be validated against the swapped rules, so that I no longer need a closure-plus-manual-`validateField()` workaround to make my own stated contract work.

### Acceptance criteria

1. Given a field whose `computedProps` swaps `thisField.restriction` (e.g. toggling `maxLength`) in response to a sibling field's value, When the sibling's value changes such that the swapped restriction differs from the previous run, Then the field's `combinedValidation` rebuilds and the field is validated against the new restriction (a value that was valid under the old restriction can now fail, or vice versa).
2. Given a field whose `computedProps` swaps `thisField.validation` (a `RuleExpression`) in response to another field's value, When the swap occurs, Then the field validates against the new `validation`.
3. Given a field whose `computedProps` output does not change in a rule-relevant way between two runs (`restriction`, `validation`, and `required` all equal to the previous run), When an unrelated keystroke elsewhere causes `computedField` to recompute, Then `combinedValidation` is not reassigned (the rules ref keeps the same array reference) and `_analytics_constructValidationCount` does not increase.
4. Given `field.restriction` is recreated as a new object with identical key/value contents (no actual facet changed), When `computedProps` recomputes, Then the shallow value-compare guard treats it as unchanged and does not rebuild.
5. Given `field.validation` is swapped to a different function or object reference, even one that is logically equivalent to the previous one, When `computedProps` recomputes, Then the reference-compare guard treats it as changed and rebuilds.
6. Given `settings.messages` changes reference, When the effect re-runs, Then `combinedValidation` rebuilds (existing behavior preserved).
7. Given `required` flips (via `minOccurs`/`maxOccurs` read through `computedField`), When the effect re-runs, Then `combinedValidation` rebuilds (boolean value compare).
8. Given the existing `DynamicFormItem.analytics.test.ts` baseline (mount = 1, value change = 1, sibling change = 1, restriction-change = 2, messages-change = 2), When this story's change lands, Then every one of those counts is unchanged.

### Edge cases
- A `computedProps` function that rebuilds `restriction.enumeration` (an array) each run with identical contents defeats the shallow guard and forces a rebuild every keystroke; documented as a residual risk in the feature spec, not something this story needs to fix.
- A `computedProps` function that rebuilds a `validation` closure each run, even with equivalent logic, defeats the reference guard the same way; also a documented residual risk, not a defect this story resolves.
- At mount, `combinedValidation` builds once; the guard's "previous run" state has nothing to compare against yet, so the first run always rebuilds and increments the counter once.

### Out of scope
- GAP 1 (`presenceValue`, ST-02) and GAP 3 (live `meta.valid`, ST-03).
- The checkout example cleanup (ST-04).
- Any change to `xsd_*`/`vdf_*` rule semantics, to `createValidation`'s memoization, or to `splitValidationFunctions`.
- Fixing the two residual-risk guard-defeat cases named above; they are documented consumer guidance, not engine bugs.

## Design reference
None. Per the feature's Design section, GAP 2 has no new rendered shape and no template-facing change; this is a pure validation-timing fix inside `DynamicFormItem.vue`.

## Architecture reference
Builds, from the feature architecture's "GAP 2 data flow (computedProps rule rebuild)" section and the matching ADR note ("GAP 2 equality guard with the counter behind it"):

- `DynamicFormItem.vue`'s rules `watchEffect` (around line 322) now reads `restriction`/`validation`/`required` from `computedField` (around line 201) instead of the raw `field` prop. `required` already read `computedField` transitively via `minOccurs`/`maxOccurs`, so this adds no new dependency and no new init-order hazard against the `combinedValidation → computedField → value → fieldContext → combinedValidation` cycle (already broken by `combinedValidation`'s ref indirection at setup time, per the feature's Constraints section).
- Equality guard, as specced: `restriction` via shallow value compare across its keys, `validation` via reference compare, `required` via boolean value compare, `settings.messages` via reference compare. The effect keeps the previous run's inputs and only rebuilds-and-reassigns `combinedValidation.value` when a rule-relevant input changed, and only then increments `_analytics_constructValidationCount` (moving the counter's meaning from "effect ran" to "rule set actually rebuilt," per the feature's DECIDED research note on finding 2).
- No new public API surface: no export shape change, no changeset of its own beyond contributing one sub-bullet ("computedProps can now swap a field's restriction/validation and have it validated against") to the feature's single cohesive minor changeset. Per the feature's note, that changeset can be authored in whichever of ST-01/ST-02/ST-03 lands first and extended by the others, or split per story and merged at release.
- Test obligation: the regression test pinning the guard (an unrelated keystroke on a field whose `computedProps` output is rule-irrelevant leaves `_analytics_constructValidationCount` flat) lives under `packages/core/src/components/__tests__/DynamicFormItem.analytics.test.ts`, alongside the existing counter assertions which must still pass unchanged.

No `specs/components.md` entry needed: no public export's shape changes.

Dependencies: none. Independent engine-only slice. Note for sequencing: ST-01 and ST-03 both edit `DynamicFormItem.vue`, but in different regions (this story's rules `watchEffect` vs. ST-03's new subtree watcher), so conflict risk is low; sequence them if implemented on the same branch.

## QA plan

Harness: `packages/core/src/examples/TestForm.vue` (mounts `DynamicForm` with `settings.analytics: true` already on by default in the harness). Counters read through `packages/core/src/components/__tests__/DynamicFormItem.test-helpers.ts`: `constructValidationCount` (`_analytics_constructValidationCount`) is the primary signal for this story. `setupState(wrapper, path)` already exposes every top-level `<script setup>` binding, including `combinedValidation`, so reference-identity assertions (`setupState(wrapper, path).combinedValidation`, captured before/after and compared with `toBe`) need no new counter, only a direct read. PROPOSED (adversarial review): read `combinedValidation` WITHOUT a trailing `.value`. `vm.$.setupState` is `proxyRefs(...)` and unwraps the ref on access, so `setupState(...).combinedValidation` is already the array; the existing readers confirm this (`DynamicFormItemChoice.test-helpers.ts:134` uses `...combinedValidation?.length`, `DynamicFormItemArray.validation.test.ts:437` uses `...combinedValidation` then `.toHaveLength`). One new helper is proposed: `combinedValidationRules(wrapper, path)` returning `setupState(wrapper, path)?.combinedValidation` (no `.value`) for a one-line reference-stability assertion, used by AC3/AC4 instead of repeating the `setupState` call inline.

### AC-to-test mapping

1. **AC1 (swapped `restriction` actually validates), AC2 (swapped `validation` actually validates)** → `packages/core/src/components/__tests__/DynamicFormItem.validation.test.ts` (new `describe('computedProps-driven rule rebuild')` block). Two sibling fields: field `b`'s `computedProps` reads field `a`'s value and sets `thisField.restriction = { maxLength: n }` (AC1) or `thisField.validation = fn` (AC2) accordingly. Assert, before the sibling change, a value that violates the new-but-not-yet-active rule passes submit; after the sibling change, submitting the same value now shows the new rule's error message (reusing the `[data-testid="<path>-error-message"]` pattern already used in this file). Covers the "actually takes effect" behavior the story exists for, as an outcome-level test, not just a counter check.
2. **AC3 (rule-irrelevant recompute leaves the guard flat)** → `DynamicFormItem.analytics.test.ts`, new case in `describe('construct validation count')`: field `b`'s `computedProps` reads sibling `a`'s value but only writes a rule-irrelevant property (e.g. `thisField.description`). Type into `a`, assert `constructValidationCount(wrapper, 'b')` stays `1` and `combinedValidationRules(wrapper, 'b')` is the same reference as before the keystroke. This is the story's named "regression test pinning the guard" from the architecture reference.
3. **AC4 (shallow-equal `restriction`, new object same contents, no rebuild)** → same `describe` block, same mechanism as AC3 but `computedProps` rebuilds `thisField.restriction = { minLength: 5 }` as a fresh object literal every run with unchanged values. Assert `constructValidationCount` flat and the rules-ref reference unchanged.
4. **AC5 (reference-changed `validation`, logically equivalent, does rebuild)** → same block: `computedProps` assigns a new closure each run that behaves identically. Assert `constructValidationCount` increments and the rules-ref reference changes.
5. **AC6 (settings.messages reference change still rebuilds)** → already covered, unmodified, by the existing `'reconstructs validation when the settings messages change'` test. No new test; re-run as regression (see below).
6. **AC7 (`required` flip via computedField-driven minOccurs/maxOccurs rebuilds)** → new case in the same `describe` block: `computedProps` toggles `thisField.minOccurs` between `0` and `1` in response to a sibling value. Assert `constructValidationCount` increments exactly once per actual flip and stays flat across a sibling keystroke that does not cross the flip boundary.
7. **AC8 (existing baseline counts unchanged: mount=1, value change=1, sibling change=1, restriction-change=2, messages-change=2)** → no new test; the existing five assertions in `DynamicFormItem.analytics.test.ts`'s `describe('construct validation count')` block must keep passing byte-for-byte after the change. Treated as a regression gate, run as part of `pnpm ci` before marking this story done, not rewritten.

### States policy / reactivity

No new rendered shape (per Design reference), so no component-state matrix (empty/error/loading) applies here; this is validation-timing only. All new cases above already live in `*.analytics.test.ts` per CLAUDE.md's render-count/reactivity convention, since the core risk is a reactivity regression (extra rebuild, extra revalidation, or a dropped rebuild), not a new rendered state.

### Fixtures / utilities

- Existing: `TestForm`, `DynamicFormItem.test-helpers.ts` (`constructValidationCount`, `setupState`).
- New: `combinedValidationRules(wrapper, path)` helper (thin wrapper over `setupState(...).combinedValidation`, PROPOSED (adversarial review): no `.value`, since `proxyRefs` already unwraps the ref), added to `DynamicFormItem.test-helpers.ts`, for reference-identity assertions in AC3-AC5. No new fixture under `packages/core/src/examples/` is needed: two plain `text` fields with `computedProps` inline in each test, matching the existing style in `DynamicFormItem.analytics.test.ts`, are sufficient.

### Coverage

The guard branches (shallow-compare `restriction`, reference-compare `validation`, value-compare `required`, reference-compare `messages`, the "all equal, early return" path, and the "something changed, rebuild and increment" path) are each exercised by AC3-AC7 above, so no new branch in the modified `watchEffect` is left uncovered. Expected to hold `pnpm -r ci:test:coverage` at or above baseline; no code path in this story's diff is knowingly left uncovered.

### Time sensitivity

No date/time-dependent logic touched by this story; `TZ=Europe/Amsterdam` has no bearing on these tests.

### Regression risk

- **Direct:** `DynamicFormItem.vue`'s rules `watchEffect` is the only touched region. Every existing test in `DynamicFormItem.validation.test.ts` (the XSD-restriction message matrix) and every existing case in `DynamicFormItem.analytics.test.ts`'s `'construct validation count'` block must keep passing unmodified, since they pin exactly the behavior this story must not disturb (AC8).
- **Adjacent:** `DynamicFormItemArray.validation.test.ts`, `DynamicFormItemChoice.validation.test.ts`, and `DynamicFormItemWizard.validation.test.ts` exercise the same `watchEffect` through their respective wrapping components; run them unmodified as a regression check, since none of their fields are expected to change behavior (they do not swap `restriction`/`validation` via `computedProps`).
- **Cross-story:** ST-03 (GAP 3) edits the same file in a different region (a new subtree watcher vs. this story's rules `watchEffect`). No shared state between the two changes, but if both land on the same branch, re-run the full `DynamicFormItem.analytics.test.ts` and `DynamicFormItem.validation.test.ts` files after merging both, not just after each story individually.
- **Out of scope confirmed not to need a test:** the two residual-risk guard-defeat cases (rebuilt `enumeration` array, rebuilt `validation` closure each run) are explicitly not this story's defect to fix; no test asserts the guard catches them, only that it catches the cases listed in AC3-AC5.

### Manual verification checklist

None required. No new rendered shape, no template-facing change, no Storybook story for this story (per Design reference and the feature's architecture, which only requires a Storybook story for GAP 1/ST-02). All acceptance criteria are automatable through the existing analytics/validation harness.

### Untestable criteria

None. All eight acceptance criteria map to a concrete automated test above; none required a rewrite proposal.

## Adversarial review

Lite (story-level), blockers-first. Grounded in `DynamicFormItem.vue` (rules `watchEffect` ~L322, `computedField` ~L201, `combinedValidation` ref L136), `DynamicFormItem.test-helpers.ts`, `DynamicFormItem.analytics.test.ts`, and the existing `combinedValidation` setupState readers in the choice/array helpers.

1. **[SHOULD-FIX] The proposed `combinedValidationRules(wrapper, path)` helper reads `.combinedValidation.value`, which is `undefined`, making the AC3/AC4 reference-stability assertions vacuous and the AC5 one a false failure.** `vm.$.setupState` is `proxyRefs(setupResult)`, so it unwraps refs on access: `setupState(...).combinedValidation` already returns the array itself, not the ref. This is proven by the existing readers that access it with no `.value`: `DynamicFormItemChoice.test-helpers.ts:134` (`setupState(...)?.combinedValidation?.length`) and `DynamicFormItemArray.validation.test.ts:437` (`...combinedValidation` then `.toHaveLength(0)`), and by the fact that the `setupState` finder itself matches on `$.setupState.path === path` (a string compare against the unwrapped `path` computed, which only works because proxyRefs unwraps). With `.value` appended, `combinedValidationRules` returns `undefined` for every field: AC3/AC4 (`expect(after).toBe(before)`) become `undefined === undefined` and pass regardless of whether the guard works, and AC5 (`expect(after).not.toBe(before)`) becomes `undefined !== undefined` and fails spuriously. The primary counter assertion (`constructValidationCount`) still pins the guard for AC3/AC4, so this is a test-quality defect rather than a hole in coverage, but a vacuously-passing regression guard is a trap worth removing. Resolution routed as a PROPOSED edit in the QA plan: drop the `.value` in the helper and in the two inline `setupState(...).combinedValidation.value` references (QA plan harness line and fixtures line), reading `setupState(...)?.combinedValidation` directly.

2. **[NIT] The architecture-reference claim "this adds no new dependency" is only true for the init-order/cycle concern it scopes itself to, not for re-run frequency.** Today the `watchEffect` depends on `computedField` only transitively through `required` (a derived computed that propagates only when its boolean value changes), plus the raw `field.value.restriction`/`validation`. Reading `restriction`/`validation` off `computedField` makes the effect depend on `computedField`'s object identity directly, so it now re-runs on every `computedField` recompute (every subscribed keystroke). That extra re-run frequency is the entire reason the equality guard exists, and the feature spec states it plainly; the story's phrasing is defensible read in context (it is about the `combinedValidation → computedField → value → fieldContext` cycle and init order) but could mislead an implementer into expecting no change in re-run count. Consider tightening the wording to "no new init-order hazard against the cycle (the effect already reached `computedField` via `required`); it does make the effect re-run per `computedField` recompute, which the guard absorbs."

3. **[NIT] AC1/AC2/AC3 describe field `b`'s `computedProps` "reading sibling `a`'s value", but `computedProps` has no direct sibling channel.** Its signature is `(field, value, childFieldsArray)`: `value` is `b`'s own value, `childFieldsArray` is children, not siblings. The existing analytics tests drive cross-field reactivity through an external `ref` captured in the closure (e.g. the `externalRef` pattern), which is also the shape the checkout GAP 2 cleanup relies on. The ACs remain testable via that mechanism; this is only a wording caution so the implementer writes the external-ref wiring rather than hunting for a nonexistent sibling accessor.

Status set to `awaiting-approval`: no open questions, no blockers, and the single should-fix is routed as a concrete PROPOSED edit.

## Implementation notes

Implemented exactly as specced: the rules `watchEffect` in `DynamicFormItem.vue` now reads `restriction`/`validation`/`required` off `computedField` instead of the raw `field` prop, behind an equality guard (shallow value compare on `restriction`, reference compare on `validation`, boolean compare on `required`, reference compare on `settings.messages`). `_analytics_constructValidationCount` only increments when the guard decides to rebuild. The guard state (`_hasBuiltCombinedValidation`, `_previousRestriction`, `_previousValidation`, `_previousRequired`, `_previousMessages`) is kept as plain module-scoped `let`s, matching the existing analytics-counter convention, so comparing against the previous run is not itself a reactive dependency.

Deviations from the spec text (none affect behavior):
- `_previousRestriction` is initialized to `{}` instead of left `undefined`, and `restrictionUnchanged`'s second parameter is typed as always-defined rather than optional. The guard's own `_hasBuiltCombinedValidation` short-circuit means `restrictionUnchanged` is only ever called once a previous run has already stored a restriction object, so a null-check branch for "no previous value yet" was unreachable dead code that showed up as a missed branch in coverage. Removing it has no behavioral effect; it only makes the guard's own invariant explicit in the types.
- The two new outcome-level tests in `DynamicFormItem.validation.test.ts` (AC1/AC2) construct their metadata without the `as any` cast used elsewhere in that file, so the `computedProps` callback parameter is inferred from `Metadata[]` instead of being implicitly `any` (required for `vue-tsc` to pass).

Tests added:
- `DynamicFormItem.validation.test.ts`: `describe('computedProps-driven rule rebuild')` with the two outcome-level AC1/AC2 tests (swapped restriction, swapped validation, both using an external ref to drive the swap since `computedProps` has no direct sibling-value channel, per the adversarial review's nit 3).
- `DynamicFormItem.analytics.test.ts`: four new cases in the existing `describe('construct validation count')` block covering AC3 (rule-irrelevant property change leaves the guard flat), AC4 (shallow-equal fresh `restriction` object leaves the guard flat), AC5 (reference-changed but logically equivalent `validation` closure rebuilds), and AC7 (a `required` flip via `computedProps`-driven `minOccurs` rebuilds once, and a same-field keystroke that does not flip it again stays flat). AC6/AC8 are the existing unmodified tests, re-run as regression gates.
- `DynamicFormItem.test-helpers.ts`: added `combinedValidationRules(wrapper, path)`, reading `setupState(...).combinedValidation` with no trailing `.value` (per the adversarial review's routed should-fix fix), used by the AC3-AC5 reference-identity assertions.

Verification run: `pnpm run ci:test` (900/900 passing across `packages/core` and `packages/element-plus`), `pnpm run ci:lint` (clean), `pnpm run ci:typecheck` (clean), `pnpm -r ci:test:coverage` (`DynamicFormItem.vue`: 100% statements/functions/lines, 96.6% branches, up slightly from the pre-change 96.08% baseline because the dead branch above was removed; overall `packages/core` coverage unchanged at 97.8%/98.3%/93.36% branches, up from 93.27%). No visual/UI surface touched (per Design reference), so no screenshots and no `pnpm docs:build` were needed.

`specs/components.md`: no entry added, as specced (no public export's shape changes).

Changeset: `.changeset/computed-props-rule-rebuild.md`, minor, carrying only the GAP 2 sub-bullet (this is the first of ST-01/ST-02/ST-03 to land); ST-02 and ST-03 extend it with their own sub-bullets per the feature's "Changeset / bump" section.

Verification command for Jeroen: `cd packages/core && TZ=Europe/Amsterdam npx vitest run src/components/__tests__/DynamicFormItem.analytics.test.ts src/components/__tests__/DynamicFormItem.validation.test.ts`, or `pnpm run ci:test` / `pnpm run ci:lint` / `pnpm run ci:typecheck` from the repo root for the full gate.

Final-audit fixes:
- Fixed the should-fix finding that `_previousRestriction` stored the restriction object by reference, so an in-place facet mutation (`thisField.restriction.maxLength = n` instead of assigning a new object) was invisible to the guard and froze the rule set. `_previousRestriction` is now stored as a shallow clone (`{ ..._restriction }`).
- Added a regression test in `DynamicFormItem.validation.test.ts` (`computedProps-driven rule rebuild` block) mirroring the swapped-restriction test but mutating `field.restriction.maxLength` in place.
- Corrected `.changeset/computed-props-rule-rebuild.md`'s opening line from "two gaps" to "three gaps", matching the three listed bullets.
- Removed the remaining em dashes introduced on this branch in `DynamicFormItem.vue` and `DynamicFormItemArray.vue`'s new comments.

## Verification report

### Pipeline

- `pnpm run ci:test`: 900/900 passing (`packages/core`), 1/1 passing (`packages/element-plus`).
- `pnpm run ci:lint`: clean, both packages.
- `pnpm run ci:typecheck`: clean, both packages (`vue-tsc --noEmit`).
- `pnpm -r ci:test:coverage`: `packages/core` overall 97.8% stmts / 93.36% branch / 98.3% funcs / 97.8% lines. `DynamicFormItem.vue`: 100% stmts/funcs/lines, 96.62% branch. No drop against the pre-change baseline cited in the Implementation notes (96.08% branch for the file, 93.27% overall branch); both improved slightly, consistent with the claimed removal of a dead branch. No `docs/` content changed by this story, so `pnpm docs:build` was not required.

### Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Swapped `restriction` actually validates | Pass | `DynamicFormItem.validation.test.ts`, `'validates against a computedProps-swapped restriction once it actually changes'`: 6 chars valid at `maxLength: 10`, then `maxLength` ref flips to 5, submit shows the new error. |
| 2 | Swapped `validation` actually validates | Pass | Same file, `'validates against a computedProps-swapped validation once it actually changes'`: no error while `requireHelloPrefix` is false, error appears once flipped true. |
| 3 | Rule-irrelevant recompute leaves guard flat | Pass | `DynamicFormItem.analytics.test.ts`, `'does not reconstruct validation when computedProps recomputes but changes only a rule-irrelevant property'`: count stays `1`, `combinedValidationRules` reference unchanged. |
| 4 | Shallow-equal fresh `restriction` object, no rebuild | Pass | Same file, `'...rebuilds restriction as a new object with the same values'`: count stays `1`, reference unchanged, confirming the shallow value-compare guard in `restrictionUnchanged()`. |
| 5 | Reference-changed but logically-equivalent `validation`, does rebuild | Pass | Same file, `'...swaps validation to a new but logically equivalent closure'`: count goes `1`→`2`, reference changes, confirming the reference-compare guard. |
| 6 | `settings.messages` reference change still rebuilds | Pass | Pre-existing, unmodified test `'reconstructs validation when the settings messages change'` still passes (count `1`→`2`). |
| 7 | `required` flip via computedField-driven minOccurs rebuilds | Pass | New case `'reconstructs validation exactly once when computedProps flips required, and stays flat on an unrelated keystroke'`: count `1`→`2` on the flip, stays `2` after an unrelated keystroke into the same field. |
| 8 | Existing baseline counts unchanged (mount=1, value change=1, sibling change=1, restriction-change=2, messages-change=2) | Pass | All five pre-existing assertions in `'construct validation count'` verified present, byte-identical, and passing (confirmed via diff: no lines in that block besides the new additions were touched). |

All eight criteria pass with direct evidence; none required a workaround or partial credit.

### Code inspection

`packages/core/src/components/DynamicFormItem.vue`'s rules `watchEffect` now reads `restriction`/`validation`/`required` off `computedField.value` instead of the raw `field` prop, guarded by module-scoped `let` state (`_hasBuiltCombinedValidation`, `_previousRestriction`, `_previousValidation`, `_previousRequired`, `_previousMessages`) compared via `restrictionUnchanged()` (shallow key/value compare), `===` (validation, messages), and `===` (required, boolean). `_analytics_constructValidationCount` only increments past the guard, matching the architecture's "counter means rule set actually rebuilt" intent. `field` remains used elsewhere in the component (17 other `field.value` reads), so no dead code was introduced.

### Prototype / visual comparison

Not applicable. The story's Design reference states no new rendered shape and no template-facing change; confirmed by the diff, which touches only `DynamicFormItem.vue`'s internal watcher and test files. No screenshot requirement, correctly skipped.

### Process compliance

- Changeset: `.changeset/computed-props-rule-rebuild.md` present, `minor`, carrying exactly the GAP 2 sub-bullet, written for a release-notes reader (business purpose first, mechanism after). Correctly scoped as the first of ST-01/ST-02/ST-03 to land, per the feature's "one cohesive changeset, extended by the others" plan; no overlap with the two other pre-existing changesets in `.changeset/` (`choice-selection-reset.md`, `export-is-path-in-section.md`), which belong to unrelated prior work.
- `specs/components.md`: correctly not touched. No public export's shape changed.
- Test naming: `*.validation.test.ts` and `*.analytics.test.ts` used correctly for the respective concerns, matching `CLAUDE.md`'s convention.
- No undocumented exports, no new API surface, no kebab-case anywhere in the diff.
- Deviation 1 (`_previousRestriction` initialized to `{}` instead of `undefined`, dropping an unreachable null-check branch): reviewed and judged acceptable. The guard's own `_hasBuiltCombinedValidation` short-circuit does make the "no previous value yet" branch dead code; removing it is a type-level simplification with no behavioral effect, and it is the kind of thing that would otherwise show up as an uncovered branch. No objection.
- Deviation 2 (new AC1/AC2 tests avoid the file's existing `as any` cast on `computedProps`): reviewed and judged acceptable, a minor type-safety improvement local to the new tests, no behavioral effect, does not touch the existing cast's other call sites.
- No silent override of any feature-level decision: the implementation matches the feature architecture's "GAP 2 data flow" and ADR note exactly (guard composition, counter placement, no new public surface).
- Git diff also shows unrelated working-tree changes to `specs/FEAT-006-inbox-rules-builder-example/spec.md` (not touched by this story's implementation; out of scope for this verification, flagged only for Jeroen's awareness since it is uncommitted alongside this work).

### Verdict: pass

All acceptance criteria verified with concrete evidence, full pipeline green, coverage at or above baseline, process compliance clean, the one recorded deviation is sound and well-justified. Status set to `done`.

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field once opened. This is not the feature's last open story (ST-02, ST-03, ST-04 remain), so FEAT-010 stays `in-progress`.
