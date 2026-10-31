---
id: ST-01
type: story
feature: FEAT-003
status: done
approved_by: Jeroen
pr: ""
---

# Story: Wizard as a first-class metadata shape

## Decided without Jeroen (research)

Settled from research during discussion, not reviewed by Jeroen. Override any of these freely.

- Open question 1 / Finding 2 → empty-`children` wizard: no-op navigation, `isFirst`/`isLast` both `true`, no dev warning
- Finding 3 → AC2 warning-count ambiguity confirmed non-contradictory, QA plan already correct
- Finding 4 → AC19 contrast test reworded to assert deregistration as primary evidence

## Note on scope

This story covers the entire feature in one slice, by Jeroen's explicit direction (see the feature spec's Constraints & assumptions, "Single-story delivery"). The feature's Architecture section records two natural seams (engine, then docs rebuild) for the record only; they are not split into separate stories, so the whole feature lands as one implementation and one verification pass, with no intermediate commits.

## Functional

### User story

As a library consumer building a multi-step form, I want to mark a metadata node as a wizard and receive step state and validation-gated navigation entirely through slot props, so that I can build wizard UIs without hand-rolling step state, per-page validation wiring, or path reconstruction.

As a template author (including the maintainer of `AdvancedFormTemplate.vue`), I want a `-wizard`/`-wizard-page` slot family with the same typed, priority-fallback dispatch contract every other shape already has, so wizard chrome and page visibility are built the same way arrays and choices are.

As a docs reader of the client onboarding example, I want the same finished wizard, built without the hand-rolled plumbing (`registerWizardPagePath`, `validatePage`/`submitForm` callbacks on metadata, the loading-resolve bridge).

### Acceptance criteria

Given/When/Then, each independently verifiable by an automated test unless marked manual.

**Shape detection and precedence**

1. **A node with `wizard` set renders through `DynamicFormItemWizard`.**
   Given a metadata node with `wizard: true` (or a `WizardConfig` object) and `children`,
   When `DynamicFormItem` renders it,
   Then `isWizard` is `true`, the node delegates to `DynamicFormItemWizard` (checked before `isChoice`/`isArray`/parent/leaf), and every node without `wizard` set renders exactly as before (regression: existing `DynamicFormItemArray`/`DynamicFormItemChoice`/parent/leaf test suites stay green, unmodified).

2. **Pages come from `children` only; a co-declared `choice` or `maxOccurs > 1` is inert with one dev warning.**
   Given a wizard node that also declares a non-empty `choice` and/or `maxOccurs > 1`,
   When the wizard mounts,
   Then `pages` equals `field.children ?? []` (the `choice`/`maxOccurs` values are never read for page derivation), exactly one `console.warn` fires per ignored property naming the node's path and the property, and navigation/rendering behave identically to the same node with `choice`/`maxOccurs` absent.

3. **A choice of wizards falls out of the existing choice mechanism, with no bespoke code.**
   Given a plain `choice` node (not itself a wizard) whose branches each carry `wizard: true`,
   When a branch is selected,
   Then `DynamicFormItemChoice` renders that branch as a normal `DynamicFormItem`, which detects `isWizard` and routes to `DynamicFormItemWizard`; the resulting wizard navigates independently per branch instance.

4. **A repeated wizard falls out of the existing array mechanism, with no bespoke code.**
   Given an array node (`maxOccurs > 1`) whose item children include a node with `wizard: true`,
   When two occurrences are rendered,
   Then each occurrence's wizard has its own independent `currentStepIndex`, and navigating one occurrence's wizard does not affect the other's.

**Navigation and validation gating**

5. **`next()` validates only the current page and advances only on success.**
   Given a wizard on page 0 with an invalid required field on that page,
   When `next()` is called,
   Then `isValidating` is `true` while `validateSection(currentPagePath)` is in flight and `false` after, the field's error becomes visible, and `currentStepIndex` does not advance.

6. **`next()` advances when the current page validates.**
   Given the same wizard with the required field now filled in,
   When `next()` is called,
   Then validation passes, `currentStepIndex` increments by exactly one, and calling `next()` again on the last page does not increment past `pages.length - 1`.

7. **`prev()` moves back unconditionally.**
   Given a wizard on page 1 with an invalid field on page 1,
   When `prev()` is called,
   Then `currentStepIndex` decrements with no validation call, and `prev()` on page 0 is a no-op (stays at 0).

8. **`gotoStep()` is backward-only by default.**
   Given a wizard on page 2 with default `WizardConfig` (`allowForwardJump: false`),
   When `gotoStep(0)` is called,
   Then it navigates to page 0; when `gotoStep(3)` (forward) is called from page 2 with `allowForwardJump` still `false`, it is a no-op (`currentStepIndex` unchanged).

9. **`gotoStep()` honors `allowForwardJump`, at config and call-time-option level.**
   Given a wizard with `wizard: { allowForwardJump: true }`,
   When `gotoStep()` is called forward,
   Then the jump succeeds; given a wizard with `allowForwardJump: false` at config level, calling `gotoStep(index, { allowForwardJump: true })` also succeeds (call-time option overrides config), and the reverse (config `true`, call-time `{ allowForwardJump: false }`) blocks the forward jump.

10. **`gotoStep()` honors `validateOnJump`, at config and call-time-option level, same override rule as AC9.**
    Given `validateOnJump: true` (config or call-time option) and an invalid current page,
    When `gotoStep()` is called,
    Then the current page is validated first and the jump is blocked on failure; with `validateOnJump: false` (default), the jump proceeds without validating the current page.

11. **`gotoStep()` clamps out-of-range indices.**
    Given a wizard with 3 pages,
    When `gotoStep(-1)` or `gotoStep(99)` is called,
    Then `currentStepIndex` clamps to `0` or `2` respectively rather than going out of bounds or throwing.

**Slot delivery**

12. **The container slot (`<type>-wizard` / `default-wizard`) receives `WizardAttributes` with the full navigation bundle plus the resolved page list.**
    Given a template defining `#default-wizard`,
    When the wizard renders,
    Then the slot receives `currentStepIndex`, `pages` (the engine's resolved page metadata nodes, the same objects driving navigation), `pageCount`, `isFirst`, `isLast`, `isValidating`, `next`, `prev`, `gotoStep`, and a `fieldContext` for the wizard's own label/errors; a template building a stepper from `pages` never re-derives `fieldMetadata.children` itself.

13. **The page slot (`<type>-wizard-page` / `default-wizard-page`) receives `WizardPageAttributes` with visibility and nav data.**
    Given a template defining `#default-wizard-page`,
    When each page renders,
    Then the slot receives `isCurrent`, `pageIndex`, `currentStepIndex`, `isFirst`, `isLast`, `next`, `prev`, `gotoStep` for every page (not only the current one), and the inner page content renders through the page's own shape (`DynamicFormItem`, routing to `-array`/`-choice`/parent/leaf as that page's own metadata dictates) — no `-wizard-page-array`/`-wizard-page-choice` combinatorial family exists.

14. **Type-scoped dispatch follows the existing priority-fallback ladder for both new families.**
    Given a wizard node with `type: 'horizontal'` and a template defining both `#horizontal-wizard` and `#default-wizard`,
    When it renders,
    Then `#horizontal-wizard` is used; with only `#default-wizard` defined, that is used instead; same ladder (`<type>-wizard-page` → `default-wizard-page` → `default`) for the page family, verified with and without a per-page `type`.

15. **A typeless wizard dispatches through its engine-default type and falls back correctly.**
    Given a wizard node with no `type` and a template defining only `#default-wizard`,
    When it renders,
    Then it resolves through the engine-default type (which no template defines) and falls back to `#default-wizard`, with no runtime error.

16. **The literal field-type name `wizard` needs no new type-level handling; it is treated exactly the way `default` is treated today.**
    Given a `defineMetadata<...>()` call that declares `'wizard'` as one of its own `FieldValueTypes` keys, or a wizard node authored with `type: 'wizard'`,
    When the project is typechecked,
    Then it typechecks without error. No new exclusion mechanism is added to `defineMetadata`. The docs rebuild avoids the awkward `wizard-wizard` container slot name by simply not authoring `type: 'wizard'` on the example's wizard node, a docs-authoring choice, not an engine-enforced rule.

    > DECIDED (Jeroen, discussion): supersedes the original AC and the feature's ADR 5 "reserved at the type level" note, both of which rested on a false premise, verified during research: `defineMetadata.ts` only *auto-injects* `default` (`ValueTypeMap = FieldValueTypes & { default: string }`), it never excludes a consumer's own `default` key. `wizard` gets the exact same treatment `default` already gets: no new exclusion, no `@ts-expect-error` test, no scope added to `defineMetadata`. The `wizard-wizard` slot-name collision is avoided at the docs-authoring level (the rebuild doesn't use `type: 'wizard'`), not by a type-level guard. No semver question remains, since nothing about `defineMetadata`'s public type surface changes. See the feature's ADR 5 for the corresponding correction.

**Static metadata and backward compatibility**

17. **`wizard` is static metadata, not computed.**
    Given a wizard node with a `computedProps` function that attempts to set `thisField.wizard`,
    When typechecked,
    Then it does not typecheck (excluded from `ComputedPropsFieldType`, same treatment as `explicitChoiceSelection`/`preserveOnSwitch`/`maxOccursTotal`); at runtime, a raw mutation attempt (via a cast) has no effect on rendering.

18. **Existing (non-wizard) forms are unaffected.**
    Given the full pre-existing `DynamicFormItem`/`DynamicFormItemArray`/`DynamicFormItemChoice` test suites with no fixture touching `wizard`,
    When the suites run after this story's changes,
    Then they pass unmodified.

**Value preservation and paths**

19. **Non-current pages stay mounted and registered when the template gates visibility with `v-show`; their values and validation state survive navigation away and back.**
    Given data entered on page 0 of a wizard whose template uses `v-show="isCurrent"` in its `#default-wizard-page` slot,
    When the user navigates to page 1 and back to page 0,
    Then page 0's field values are unchanged, its fields remain registered with vee-validate (touched/error state intact), and a final `handleSubmit` includes page 0's values.

20. **Page paths are read from the corrected metadata tree, never re-derived, and resolve correctly when the wizard is nested inside an array occurrence.**
    Given a wizard whose node sits inside an array item (e.g. `teams[2].wiz`), with pages `company`, `plan`,
    When `next()`/`gotoStep()` compute the current page's path for `validateSection`,
    Then the path is `overridePath(pages[i].path, pathOverride)` (e.g. `teams[2].wiz.company`), matching exactly the path each page's own `DynamicFormItem` registers under, with no independent path reconstruction.

**Docs rebuild**

21. **The rebuilt onboarding example produces an unchanged visual result.**
    Given the docs onboarding example rebuilt on `wizard: true`/`WizardConfig`, the new `-wizard`/`-wizard-page` slots in `AdvancedFormTemplate.vue`, and `FormWizard.vue` driven purely by the container slot's `pages` prop,
    When a docs reader loads the example before and after this story,
    Then the rendered result is visually unchanged (manual verification: before/after Playwright screenshots of each wizard step, including the repeatable page (`projectContacts`) and the choice page (`launchApproach`)).

22. **The hand-rolled plumbing is fully retired with no leftover references.**
    Given the rebuild,
    When the codebase is searched,
    Then `registerWizardPagePath`, `wizardPagePaths`, the `validatePage`/`submitForm` callback properties on metadata, and `docs/.vitepress/theme/utils/loadingResolve.ts` no longer exist anywhere, and the `currentStepIndex`/`gotoStepIndex` entries are gone from `AdvancedFormTemplate.vue`'s `defineMetadata` fourth generic.

23. **Doc pages describe the new shape, with the `v-show`-not-`v-if` contract stated prominently.**
    Given `docs/examples/advanced.md`, `docs/reference/field-metadata.md`, `docs/reference/dynamic-form-template.md`, and `docs/reference/use-validate-partial-form.md`,
    When read after this story,
    Then: `advanced.md` describes the `wizard` metadata property instead of the retired `validatePage` callback; `field-metadata.md` documents `wizard`/`WizardConfig` and calls out the `v-show` requirement; `dynamic-form-template.md` documents the `-wizard`/`-wizard-page` slot families with the `v-show`-not-`v-if` contract stated prominently (not buried), including that `v-if` is acceptable only for field-less pages; `use-validate-partial-form.md`'s "Wizard example" section no longer teaches hand-built `wizardPagePaths`/`registerWizardPagePath` (replaced per the feature's DECIDED question 5, either with a non-wizard section-validation example or a short pointer to the wizard shape — this story records which was chosen).

24. **`pnpm docs:build` succeeds.**
    Given the doc content and component changes,
    When `pnpm docs:build` is run,
    Then it compiles with no errors.

### Edge cases

- Calling `gotoStep(currentStepIndex)` (jump to the already-current page): no-op, no validation call, no state change.
- A wizard with exactly one page: `isFirst` and `isLast` are both `true`; `next()` never advances past it, `prev()` is always a no-op.
- A field-less summary page using `v-if` instead of `v-show` in the page slot: acceptable per the documented exception (no field to lose); still renders/hides correctly when navigated to.
- A wizard node with no `wizard.allowForwardJump`/`validateOnJump` set at all (`wizard: true`): resolves to the documented defaults (`false`/`false`).
- Two independent wizards on the same form (e.g. nested per AC4, or a choice-of-wizards per AC3): navigating one never changes the other's `currentStepIndex`.
- A wizard node with empty or absent `children` (`pages.length === 0`): see Open question 1 (resolved by research). As specified, `next()`/`gotoStep()` would dereference `pages.value[currentStepIndex].path` (`undefined.path`) and throw, while `isFirst` reads `true` and `isLast` reads `false` (`0 === -1`), which invites a template to offer a "next" control. DECIDED (research): guard all three navigation methods to no-op when `pages.length === 0` (never index into `pages`), and treat a zero-page wizard as both first and last (`isFirst: true`, `isLast: true`) so no "next" affordance is offered; no `console.warn` is emitted. Add a `DynamicFormItemWizard.logic.test.ts` smoke test asserting no crash on mount and on a `next()`/`gotoStep()` call.

### Out of scope

- A public `useFormWizard` composable or any provide/inject channel for wizard state (explicitly rejected direction; state travels only as slot props).
- Callback properties stored on `FieldMetadata` (`validatePage`/`submitForm`-style); these are retired, not replicated under a new name.
- Engine-owned submit; the engine exposes only `isLast`.
- Any change to the `xsd_*` validation rule set or to `validateSection`'s own semantics.
- New global wizard settings on `DynamicFormSettings` beyond the `wizard` metadata property itself.
- A new Storybook story (none exists today for wizard content; not required by this feature).
- Visual redesign of the onboarding example; any visual change from today is a defect, not a goal.
- An `onBeforeUnmount` exemption analogous to `partOfArrayField` for wizard pages (rejected per ADR 6's DECIDED note; the guarantee is template-owned via `v-show`, not engine-owned).

## Design reference

The feature spec's Design section was skipped, with justification: the feature's only visual surface is the docs onboarding example, and the explicit requirement is that its rebuild produce an *unchanged* visual result, so there is no new visual design to prototype (no `prototype.html` exists for this feature).

This story is therefore verified against the feature's Functional overview and Architecture sections directly, not a prototype anchor. The concrete evidence for "unchanged visual result" (AC21) is before/after Playwright screenshots of the rebuilt `docs/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue` example, one per wizard step (including the repeatable `projectContacts` page and the choice `launchApproach` page), taken against the pre-story render and compared manually since no prototype anchor exists to diff against.

## Architecture reference

Builds the entire feature architecture in one slice; see `../../spec.md`'s Architecture section for full detail (component plan, wizard state/ownership, slot-prop types, rendering flow, ADRs 1-6). Summary of what this story builds:

**Genuinely new:**
- `packages/core/src/components/DynamicFormItemWizard.vue` — owns `currentStepIndex`, `pages` (from `children` only, per ADR 3), `isFirst`/`isLast`/`isValidating`, `next()`/`prev()`/`gotoStep()`, the dev-mode inert-property warning, and renders the container + per-page `-wizard-page` wrapper structure (ADR 2).
- `WizardConfig` and `WizardGotoStepOptions` types in `packages/core/src/types/FieldMetadata.ts` (re-exported via the existing `export *` in `index.ts`).
- `WizardAttributes` and `WizardPageAttributes` slot-prop interfaces in `DynamicFormTemplate.vue`, declared in-file (not re-exported from `index.ts`), matching the `ChoiceAttributes` convention.

**Modified (backward compatible, additive):**
- `packages/core/src/components/DynamicFormItem.vue` — new `isWizard` flag checked first in the render chain (ADR 1); restore the static `wizard` property inside `computedField` (alongside the existing `explicitChoiceSelection`/`preserveOnSwitch` restorations); add `&& !isWizard.value` to the `isInput` predicate. No new props on `DynamicFormItemProps`.
- `packages/core/src/components/DynamicFormTemplate.vue` — `-wizard`/`-wizard-page` entries in `SlotsFromMetadata`, two new branches in `typeWithFallback` (checked in the order ADR 5 specifies), matching `v-if` branches at the bottom-of-template `<slot>` dispatch.
- `packages/core/src/types/FieldMetadata.ts` — `wizard?: boolean | WizardConfig`, added to the `ComputedPropsFieldType` `Omit` list. `defineMetadata.ts` itself is not touched: per AC16's DECIDED (Jeroen) note, `wizard` gets no type-level exclusion, treated exactly like `default` is treated today.

**Reused as-is (no change):** `DynamicFormItemArray`, `DynamicFormItemChoice`, `useValidatePartialForm`/`validateSection`, `useDynamicForm`/`handleSubmit`, `correctMetadataAndSetDefaults`, `overridePath`.

**Docs rebuild (same story, per Jeroen's single-story direction):**
- `docs/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue`, `FormWizard.vue`, `AdvancedFormTemplate.vue` — rebuilt on the new shape; retirements listed in AC22.
- `docs/.vitepress/theme/utils/loadingResolve.ts` — deleted.
- `docs/examples/advanced.md`, `docs/reference/field-metadata.md`, `docs/reference/dynamic-form-template.md`, `docs/reference/use-validate-partial-form.md` — updated per AC23.

**Public API surface touched:** `FieldMetadata.wizard` (new, additive), `WizardConfig`/`WizardGotoStepOptions` (new exported types), `DynamicFormItemWizard` (new exported component), `WizardAttributes`/`WizardPageAttributes` (new, declared in-file), `-wizard`/`-wizard-page` slot families (new, additive). `defineMetadata.ts` is untouched (AC16, DECIDED (Jeroen)). Nothing removed, renamed, or re-signed. **Changeset: `minor`**, carried by this story since it is the only story and it touches `packages/core/src/`.

**Dependencies on other stories:** none; this is the only story for this feature.

**`specs/components.md`:** updated by the developer at implementation time to add `DynamicFormItemWizard`, `WizardConfig`/`WizardGotoStepOptions`, `WizardAttributes`/`WizardPageAttributes`, the `-wizard`/`-wizard-page` slot family, and the `wizard` property on `FieldMetadata` (including its `ComputedPropsFieldType` exclusion), following the existing entry style used for `explicitChoiceSelection`/`ChoiceAttributes`.

## QA plan

### Test conventions and fixtures

Engine-level tests (AC1-AC20) follow the existing `DynamicFormItem*`/`DynamicFormItemArray*`/`DynamicFormItemChoice*` pattern: mount `TestForm` (`packages/core/src/examples/TestForm.vue`) with inline metadata, drive the DOM through `@vue/test-utils`, and read internal state via `setupState()` reach-ins where the public slot-prop surface alone cannot pin a claim (mirroring `DynamicFormItemChoice.test-helpers.ts`'s `setupState`). A minority of tests (the `-wizard`/`-wizard-page` slot-dispatch ladder, and the `v-show`-vs-`v-if` contrast for AC19) mount `DynamicFormTemplate`/`DynamicFormItemWizard` directly with bespoke inline slots, mirroring `DynamicFormTemplate.test.ts`'s existing `mountTemplate()` helper, because those assertions need per-test control over slot markup that the shared fixture template intentionally does not vary.

**Fixture changes needed:**
- `packages/core/src/examples/TestFormTemplate.vue` — add `#default-wizard` and `#default-wizard-page` slot templates, additive only (existing slots untouched, so the full existing `DynamicFormItem*`/`DynamicFormItemArray*`/`DynamicFormItemChoice*` suites stay green per AC18). The `#default-wizard` slot renders: a stepper built from the `pages` slot prop (not `fieldMetadata.children`, to make AC12's "never re-derives" claim testable through the DOM), `next`/`prev` buttons (`data-testid="${fieldMetadata.path}-next-button"` / `-prev-button`), a `gotoStep` control (`data-testid="${fieldMetadata.path}-goto-{index}-button"` per stepper entry, calling `gotoStep(index)`), and text spans exposing `currentStepIndex`/`isFirst`/`isLast`/`isValidating`/`pageCount` (`data-testid="${fieldMetadata.path}-<propName>"`), mirroring the `-used-choice-occurrences` span pattern already in the file. The `#default-wizard-page` slot wraps its default slot in a `v-show="isCurrent"` `div` with `data-testid="${fieldMetadata.path}-page"` and a `data-current` attribute reflecting `isCurrent`, per ADR 6's documented contract (this is the reference-correct implementation; the intentionally-wrong `v-if` variant used to prove the data-loss contrast in AC19 is a bespoke inline slot in its own isolated-mount test, not added to the shared fixture).
- `packages/core/src/components/__tests__/DynamicFormItemWizard.test-helpers.ts` (new) — `setupState(wrapper, path)` / `findDynamicFormItemWizardByPath(wrapper, path)` (mirroring `DynamicFormItemChoice.test-helpers.ts`), plus DOM readers for the new fixture spans/buttons above (`currentStepIndex`, `isFirst`, `isLast`, `isValidating`, `pages` length, `clickNext`/`clickPrev`/`clickGotoStep`, `isPageVisible(wrapper, pagePath)` reading the `v-show`-driven style).
- `defineMetadata.test.ts` is no longer needed for this story: DECIDED (Jeroen) on AC16 dropped the type-level reserved-key check entirely (`wizard` gets no new exclusion, same as `default` today), so there is no new type-level assertion requiring this file. Not created by this story.

No change anticipated to `DynamicFormItem.vue`'s other existing test files beyond the regression re-run (AC18), or to `DynamicFormItemArray.test-helpers.ts`-equivalent (none exists; `DynamicFormItemArray` tests reach in via ad hoc local finders, reused as-is for AC4).

### Test files touched

| File | Status | Purpose |
| --- | --- | --- |
| `DynamicFormItemWizard.logic.test.ts` | new | Shape detection/precedence (AC1-4), navigation logic (AC5-11), static-metadata runtime check (AC17), edge cases. |
| `DynamicFormItemWizard.validation.test.ts` | new | `next()`/`gotoStep()` validation gating detail (AC5, AC6, AC10), error visibility after a failed `next()`, `validateSection` path targeting (AC20). |
| `DynamicFormItemWizard.analytics.test.ts` | new | Navigation does not remount pages (AC19's render-count half), no sibling/other-wizard re-render on navigation (independent-instance edge case), `isValidating` transition render counts. |
| `DynamicFormItemWizard.test-helpers.ts` | new | Fixture readers/actions described above. |
| `DynamicFormTemplate.test.ts` | extend | New `describe` blocks for the `-wizard` and `-wizard-page` fallback ladders (AC14, AC15), mirroring the existing `-choice-array` ladder blocks. |
| `TestFormTemplate.vue` | extend | `#default-wizard` / `#default-wizard-page` slots, additive only (see above). |
| `packages/core/src/types/FieldMetadata.ts` (via `DynamicFormItemWizard.logic.test.ts`) | n/a (source) | `wizard` added to `ComputedPropsFieldType`'s `Omit` list; typechecked via a `ComputedPropsFieldOf<Metadata>` assertion, same pattern as `explicitChoiceSelection`. |

### Acceptance criteria → test mapping

1. **Shape detection and precedence.** Mount a wizard node with two `children` pages; assert `isWizard` is `true` via `setupState(wrapper, path).isWizard` on the owning `DynamicFormItem`, and that a `DynamicFormItemWizard` (not `DynamicFormItemChoice`/`DynamicFormItemArray`/plain parent) is present at that path (`wrapper.findAllComponents({ name: 'DynamicFormItemWizard' })`). Regression half: full existing `DynamicFormItem.logic.test.ts`, `DynamicFormItem.validation.test.ts`, `DynamicFormItem.analytics.test.ts`, `DynamicFormItemArray.logic.test.ts`, `DynamicFormItemArray.validation.test.ts`, `DynamicFormItemChoice.logic.test.ts`, `DynamicFormItemChoice.validation.test.ts`, `DynamicFormItemChoice.analytics.test.ts` re-run unmodified and green (CI already does this; called out explicitly as evidence for this AC). `DynamicFormItemWizard.logic.test.ts`.

2. **`children`-only pages; co-declared `choice`/`maxOccurs > 1` inert with one warning each.** Mount a wizard node carrying both a non-empty `choice` and `maxOccurs: 3` alongside `children`. Spy on `console.warn` (`vi.spyOn(console, 'warn').mockImplementation(() => {})`); assert it is called exactly once naming the node's path and `'choice'`, and exactly once naming the path and `'maxOccurs'` (two separate calls, one per ignored property, per the architecture's "one warning per ignored property" wording — flagged below since the AC text says "exactly one `console.warn` fires per ignored property," which this plan reads as one-per-property, not one-total; see "Untestable as written"). Assert `pages` (read via `setupState` or the fixture's stepper count) equals `children.length`, not `choice.length`. Re-mount the identical node with `choice`/`maxOccurs` stripped; assert navigation output (rendered pages, `pageCount`) is byte-identical. `DynamicFormItemWizard.logic.test.ts`.

3. **Choice of wizards falls out of existing choice mechanism.** Mount a plain `choice` node (no `wizard` on the choice itself) whose two branches each carry `wizard: true` with distinct `children`. Select branch A via the existing `#default-choice` harness (`addChoiceOccurrence`/value-driven select, whichever the fixture's default choice mode is); assert branch A's `DynamicFormItem` delegates to `DynamicFormItemWizard` and navigates (`next()` advances its `currentStepIndex`) independently of branch B (which is unmounted/inert per normal choice semantics). No new choice-side code path exercised, only the existing `DynamicFormItemChoice` suite plus this composition. `DynamicFormItemWizard.logic.test.ts`.

4. **Repeated wizard falls out of existing array mechanism.** Mount an array node (`maxOccurs: 2`) whose item `children` include a `wizard: true` node. With two occurrences present, call `next()` on occurrence 0's wizard; assert occurrence 0's `currentStepIndex` is `1` and occurrence 1's `currentStepIndex` remains `0` (read via `setupState` on each `DynamicFormItemWizard` instance, distinguished by `normalizedPath`, e.g. `teams[0].wiz` vs `teams[1].wiz`). `DynamicFormItemWizard.logic.test.ts`.

5. **`next()` validates only the current page, advances only on success.** Wizard with page 0 containing a required empty field. Call `next()`; assert (a) `isValidating` reads `true` synchronously after the call starts and before the returned promise resolves (read via the fixture's `isValidating` span mid-flight, or `setupState` if the DOM update lags a tick), (b) `false` after `await flushPromises()`, (c) the field's error message renders (existing `-error-message` testid), (d) `currentStepIndex` is still `0`. `DynamicFormItemWizard.validation.test.ts`.

6. **`next()` advances on success; clamps at the last page.** Fill the required field, call `next()`; assert `currentStepIndex` increments by exactly `1` and no validation error renders for that field. On the last page, call `next()` again; assert `currentStepIndex` is unchanged (`pages.length - 1`). `DynamicFormItemWizard.validation.test.ts` (advance) and `.logic.test.ts` (clamp-at-last, non-validation-focused).

7. **`prev()` moves back unconditionally.** On page 1 with an invalid field on page 1, call `prev()`; assert `currentStepIndex` decrements to `0` with no `console.warn`/error render triggered by the call itself, and no `validateSection` call (asserted indirectly: the still-invalid field's error state is unchanged, since `prev()` never touches it). `prev()` on page 0: assert `currentStepIndex` stays `0`. `DynamicFormItemWizard.logic.test.ts`.

8. **`gotoStep()` backward-only by default.** From page 2, `gotoStep(0)`: assert `currentStepIndex` becomes `0`. From page 2, `gotoStep(3)` (forward, `allowForwardJump` unset/default): assert `currentStepIndex` is unchanged. `DynamicFormItemWizard.logic.test.ts`.

9. **`gotoStep()` honors `allowForwardJump`, config vs call-time.** Three sub-cases, one wizard fixture each: (a) `wizard: { allowForwardJump: true }`, forward `gotoStep()` succeeds; (b) `wizard: { allowForwardJump: false }` (or `wizard: true`), `gotoStep(index, { allowForwardJump: true })` succeeds (call-time override); (c) `wizard: { allowForwardJump: true }`, `gotoStep(index, { allowForwardJump: false })` is blocked (call-time override the other direction). `DynamicFormItemWizard.logic.test.ts`.

10. **`gotoStep()` honors `validateOnJump`, config vs call-time, same override rule.** Mirrors AC9's three sub-cases but with an invalid current page and asserting `validateSection` fires (error renders, jump blocked) when the effective flag is `true`, and the jump proceeds without an error render when `false`. `DynamicFormItemWizard.validation.test.ts`.

11. **`gotoStep()` clamps out-of-range indices.** 3-page wizard: `gotoStep(-1)` → `currentStepIndex === 0`; `gotoStep(99)` → `currentStepIndex === 2`. No throw. `DynamicFormItemWizard.logic.test.ts`.

12. **Container slot receives the full `WizardAttributes` bundle including `pages`.** Isolated mount (`DynamicFormTemplate`/`DynamicFormItemWizard` directly, bespoke `#default-wizard` slot) asserting every named prop (`currentStepIndex`, `pages`, `pageCount`, `isFirst`, `isLast`, `isValidating`, `next`, `prev`, `gotoStep`, `fieldContext`) arrives with the right shape/type, and that `pages` is reference-equal (or deep-equal, same object identity where feasible) to the metadata nodes driving navigation, not a re-derivation. `DynamicFormTemplate.test.ts` (prop shape/typing) plus a `DynamicFormItemWizard.logic.test.ts` case asserting the shared-fixture stepper (built only from `pages`) always matches the actually-rendered page set, so a stepper/navigation desync would fail this test.

13. **Page slot receives `WizardPageAttributes` for every page, not only the current one.** Assert the `-wizard-page` slot renders (and its `isCurrent`/`pageIndex`/nav props are readable) for every page index, including non-current ones (consistent with AC19's "stays mounted" requirement); assert the inner content dispatches through that page's own shape (a parent page renders its children directly, an array page mounts `DynamicFormItemArray`, a choice page mounts `DynamicFormItemChoice`) with no bespoke `-wizard-page-array`/`-wizard-page-choice` slot ever queried. `DynamicFormItemWizard.logic.test.ts` (using the docs-example-like `projectContacts`/`launchApproach`-shaped array/choice pages as fixtures, per the story's own Design reference).

14. **Type-scoped dispatch ladder, both families.** `DynamicFormTemplate.test.ts`, new `describe` blocks mirroring the existing `*-choice-array` ladder tests exactly: `<type>-wizard` wins over `default-wizard`, `default-wizard` used when no per-type slot is defined; same two tiers for `<type>-wizard-page` → `default-wizard-page`, tested both with and without a per-page `type` set.

15. **Typeless wizard resolves through its engine-default type and falls back.** `DynamicFormTemplate.test.ts`: mount with `type` omitted on the field (engine assigns its default, e.g. `'text'`), only `default-wizard` defined; assert it renders with no runtime error and no `<default-wizard-for-a-type-nobody-defined>` slot exists to accidentally match.

16. **The literal type name `wizard` needs no new type-level handling.** No test required: DECIDED (Jeroen) confirms `wizard` typechecks as an ordinary `FieldValueTypes` key or `type` value, exactly as `default` does today; `defineMetadata.ts` is not touched by this story. The docs rebuild simply avoids authoring `type: 'wizard'` on the example's wizard node (a content choice, verified by AC22's plumbing-retirement grep, not a new automated test).

17. **`wizard` is static, not computed.** Two assertions, `DynamicFormItemWizard.logic.test.ts`: (a) runtime, mirroring `DynamicFormItemChoice.logic.test.ts`'s `explicitChoiceSelection` pattern exactly: `computedProps: [(thisField: any) => { thisField.wizard = false; }]` on a wizard node, assert it still renders through `DynamicFormItemWizard` (mutation has no effect); (b) type-level, `ComputedPropsFieldOf<Metadata>` with `// @ts-expect-error thisField.wizard = true`, checked by `vue-tsc` during `pnpm ci`/`pnpm typecheck`.

18. **Existing forms unaffected.** Not a new test; the full pre-existing suites listed under AC1 re-run unmodified. Explicitly tracked here as a checklist item for the verifier: zero diffs to any existing `*.test.ts` file outside the new wizard-specific files and the additive `TestFormTemplate.vue`/`DynamicFormTemplate.test.ts` changes.

19. **Non-current pages stay mounted (`v-show`); values/validation survive navigation.** Using the shared fixture's `v-show`-correct `#default-wizard-page`: fill a field on page 0, `next()` to page 1, `prev()` back to page 0; assert the field's DOM value is unchanged, `setupState` on that field's `DynamicFormItem` shows the same field `id`/instance (not remounted — no render-count increment, see Reactivity plan below), `meta.touched`/error state survives, and a final `handleSubmit` capture (reusing `TestForm`'s existing submit-capture pattern) includes page 0's value. `DynamicFormItemWizard.logic.test.ts` (value/touched persistence) + `.analytics.test.ts` (no-remount proof). **QA-plan addition (contrast test, not itself an AC):** a second, isolated-mount test using an intentionally wrong `v-if="isCurrent"` `#default-wizard-page` slot, proving the documented failure mode actually occurs absent `v-show` — this is what makes ADR 6's "provided the template uses `v-show`" contract a tested claim rather than an assumed one. RESOLVED (research, finding 4): the primary assertion is field/validation **deregistration** (the field's `useField` registration disappears from the form's `getAllPathStates()`, so `handleSubmit` would submit it unvalidated), since that holds unconditionally regardless of `keepValuesOnUnmount`. Value-clearing is asserted only as a secondary check on the default fixture (no keep-flag set), since `DynamicFormItem.onBeforeUnmount` skips the value clear when `field.value?.fieldOptions?.keepValueOnUnmount` or the form-level `keepValuesOnUnmount` is truthy. `DynamicFormItemWizard.logic.test.ts`.

20. **Page paths read from the corrected tree; correct when nested in an array occurrence.** Wizard nested inside `teams[2].wiz` with pages `company`/`plan`. Spy or intercept `validateSection` (via the existing `useValidatePartialForm` module, or assert indirectly through which field's error becomes visible after a failed `next()`) to confirm the path passed is `teams[2].wiz.company`, matching the page's own `DynamicFormItem`'s registered path exactly (read via that page's `setupState().path`/`normalizedPath`). `DynamicFormItemWizard.validation.test.ts`.

21. **Rebuilt onboarding example, unchanged visual result.** Manual: before/after Playwright screenshots of `docs/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue`, one per wizard step including the `projectContacts` (repeatable) and `launchApproach` (choice) pages, in light and dark mode. See Manual verification checklist.

22. **Hand-rolled plumbing fully retired.** Manual/CI-adjacent: `grep -rn "registerWizardPagePath\|wizardPagePaths\|validatePage\|submitForm" docs/ packages/` returns no hits, and `docs/.vitepress/theme/utils/loadingResolve.ts` no longer exists. See Manual verification checklist for exact commands; not practical as a `vitest` assertion since it spans `docs/`, which is outside `packages/core`'s test runner and has no existing test harness (confirmed: no `docs/**/__tests__/**` exists in this repo).

23. **Doc pages describe the new shape.** Manual read-through of the four listed doc pages against the AC's four bullet requirements (see Manual verification checklist). Not automatable: prose-content correctness has no existing doc-content test harness in this repo.

24. **`pnpm docs:build` succeeds.** Manual/CI step, not a `vitest` test: run `pnpm docs:build` locally per CLAUDE.md's "Before Every Push" step 5, confirm zero compile errors.

**Edge cases:**

- `gotoStep(currentStepIndex)` (jump to current page): no-op, no `validateSection` call (assert via the invalid-current-page-with-`validateOnJump:true` setup: if it validated, the error would render; it must not), no `currentStepIndex` change. `DynamicFormItemWizard.logic.test.ts`.
- Single-page wizard: `isFirst && isLast` both `true`; `next()` never advances (stays on the only page, no validation-then-advance loop); `prev()` always a no-op. `DynamicFormItemWizard.logic.test.ts`.
- Field-less summary page using `v-if`: isolated-mount test (bespoke slot, no `DynamicFormItem` inside that one page's slot content, just static markup) — assert it renders/hides correctly across navigation with no error, since there is no field to lose. `DynamicFormItemWizard.logic.test.ts`.
- `wizard: true` (no explicit `allowForwardJump`/`validateOnJump`) resolves to `false`/`false`: covered as the baseline case inside AC8/AC9's blocked-forward-jump assertions; no separate test needed beyond confirming the fixture's `wizard: true` (not the object form) is used for at least one AC8/AC9 sub-case.
- Two independent wizards (nested-array AC4, or choice-of-wizards AC3) never cross-affect each other's `currentStepIndex`: already the core assertion of AC3/AC4 above; **QA-plan addition:** one more combined test with a nested wizard AND a sibling top-level wizard both present in the same form, navigating one and asserting the render count (not just the value) of the other's container is unchanged, extending the analytics plan below.

### States to assert (component tests)

The feature's Design section was explicitly skipped (justified: no new visual surface beyond the unchanged-result docs rebuild; see the story's own "Design reference" section), so there is no feature-level states policy to draw from for this slice. In its place, this plan asserts the concrete render/interaction states the architecture and acceptance criteria actually name:

- **Navigation state:** first page (`isFirst: true, isLast: false`, unless single-page), middle page (`isFirst: false, isLast: false`), last page (`isFirst: false, isLast: true`), single-page (`isFirst && isLast`).
- **Validating state:** `isValidating: true` mid-flight during `next()`/gated `gotoStep()`, `false` at rest and after settling, both on success and on failure.
- **Validation/error state:** current page with a failing field shows its error after a blocked `next()`/`gotoStep()`; the same field shows no error before the attempt (pristine) and after a passing attempt.
- **Visibility state (page slot):** current page `isCurrent: true` and visible (`v-show`, not hidden); non-current pages `isCurrent: false`, hidden via style but present in the DOM/component tree (not unmounted) — this is the "empty"-adjacent state for this slice (a hidden page holds no visible content but is not gone).
- **Composition states:** plain wizard; wizard as a choice branch; wizard as an array item; wizard containing an array page; wizard containing a choice page — each exercised by AC3/AC4/AC13.
- **Inert-property state:** wizard node with `choice`/`maxOccurs` co-declared (AC2) versus without, output identical.
- **Empty-`children` wizard (`pages.length === 0`), resolved by research (see Open question 1):** guard `next()`/`prev()`/`gotoStep()` to no-op, `isFirst`/`isLast` both `true`, no `console.warn`. Covered by a `DynamicFormItemWizard.logic.test.ts` smoke test asserting no crash on mount and on a `next()`/`gotoStep()` call.

### Reactivity / `*.analytics.test.ts` plan

`DynamicFormItemWizard.analytics.test.ts`, new `describe('component DynamicFormItemWizard - analytics')`:

1. **No remount across navigation (core AC19 reactivity claim).** Read `renderCount(wrapper, 'wizard.company.companyName')` (or equivalent leaf inside page 0) before navigating away and after navigating back; assert it is unchanged beyond whatever legitimate re-renders the value-entry itself already caused (i.e., no *additional* render attributable to the round trip), proving `v-show` toggling does not remount the subtree, consistent with ADR 6.
2. **`isCurrent` toggling is scoped.** Navigating from page 0 to page 1 does not increment the render count of a field on page 2 (untouched page), and does not increment a sibling field outside the wizard entirely (reusing the existing sibling-isolation pattern from `DynamicFormItemChoice.analytics.test.ts`).
3. **Two independent wizards.** Navigating wizard A does not change wizard B's render count or `currentStepIndex` (nested-array and choice-of-wizards variants both covered, per the edge-case QA-plan addition above).
4. **`next()` failure path causes exactly the expected re-renders.** A blocked `next()` (invalid current page) increments the failing field's render count by the error-display update only, not by a page remount; assert no page-level `DynamicFormItemWizard` container remount (`currentStepIndex` unchanged, no new `DynamicFormItem` instance for the page).

This story does not touch `computedProps` timing or `combinedValidation`'s `watchEffect` directly (validation is delegated whole to the existing `validateSection`), so no new `_analytics_constructValidationCount`/`_analytics_fieldComputeCount` assertions are needed beyond confirming they are unaffected by wizard navigation (a light regression check, same describe block).

### Coverage

New code surface: `DynamicFormItemWizard.vue` (state, navigation methods, dev-warning, rendering), the two new `typeWithFallback` branches and two new slot-prop interfaces in `DynamicFormTemplate.vue`, the `isWizard` flag and `!isWizard.value` guard in `DynamicFormItem.vue`, and the `FieldMetadata.wizard`/`ComputedPropsFieldType` exclusion. `defineMetadata.ts` is not touched by this story (AC16, DECIDED (Jeroen)). Every branch named above has a direct AC-mapped test: both inert-property warnings (AC2), both `gotoStep` gate combinations (AC9/AC10 × config/call-time × true/false = the full 2×2×2 truth table is not fully enumerated by the ACs as written — see "Untestable as written" for the one combination the plan adds beyond the named ACs), the empty-`pages` edge case (smoke test, per the DECIDED research resolution above), and the `v-if` contrast test for AC19 (exercises the *documented risk*, not new engine code, so it does not add coverage on its own but guards the `v-show` fixture default from silently drifting). Run `pnpm -r ci:test:coverage` after implementation and confirm no drop against baseline; flag to the developer that the dev-warning `console.warn` calls must be exercised by at least one test each (AC2) or they show as uncovered branches.

Known gap left knowingly uncovered by this plan: the exact wording match of AC2's warning message (path + property name) is asserted via the spy call arguments' *content* (`expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(path))` style), not a hardcoded exact string, since the message's precise phrasing is left open — same posture the codebase already takes with `messages`/`resolveMessage` phrasing tests elsewhere.

### Time sensitivity

Not applicable. No date/time-dependent logic is introduced by this story; `next()`/`prev()`/`gotoStep()` are synchronous-state/async-validation only, with nothing derived from `Date`/timezones. `TZ=Europe/Amsterdam` is still the CI default per `ci:test:coverage`, so no test in this plan needs to opt out of it, but none of them depend on it either.

### Regression risk

- **`DynamicFormItem.vue`** — the most complex file in the codebase gains a new first-checked branch (`isWizard`) and a new `&& !isWizard.value` term in `isInput`. Guarded by AC1/AC18's full-suite regression re-run (`DynamicFormItem.logic.test.ts`, `.validation.test.ts`, `.analytics.test.ts`, `.unmount.logic.test.ts`) staying green unmodified, since `isWizard` defaults `false` for every node without a `wizard` property.
- **`DynamicFormTemplate.vue`'s `typeWithFallback` ladder** — already has a documented ordering trap (`-choice-array` before `-array`); the two new `-wizard`/`-wizard-page` branches must not shadow or be shadowed by any existing suffix. Guarded by the existing `DynamicFormTemplate.test.ts` suite (all current `-choice-array`/`-choice-array-item`/`-array`/`-array-item` ladder tests) staying green, plus the new AC14/AC15 blocks exercising the new suffixes' own priority.
- **`DynamicFormItemArray`/`DynamicFormItemChoice`** — reused as-is per the architecture; AC3/AC4 exercise them composed with a wizard child but change no code in either component. Guarded by their own full existing suites (unmodified) plus the new composition tests.
- **`useValidatePartialForm`/`validateSection`** — reused verbatim; `DynamicFormItemWizard` becomes a new *caller* of it, in a descendant-of-`useForm()` position, the same resolution shape `DynamicFormItemChoice` already relies on. Guarded by the existing `useValidatePartialForm.test.ts` suite (unmodified) plus AC5/AC10/AC20's new call-site tests.
- **`onBeforeUnmount`'s clear-on-unmount behavior** — not modified by this story (ADR 6 explicitly rejects an exemption), but AC19's `v-if` contrast test exists specifically because this exact mechanism is what would silently corrupt wizard data if a template author (including future maintainers of `AdvancedFormTemplate.vue`) got the `v-show` contract wrong. Treat that test as a regression guard for the *fixture's own correctness*, not just the AC.
- **Docs rebuild (`FormExampleClientOnboardingPlanner.vue`/`FormWizard.vue`/`AdvancedFormTemplate.vue`)** — no automated test coverage exists or is added for `docs/` (confirmed: no `docs/**/__tests__/**` in this repo). All risk here is carried by AC21-24's manual checklist. Flagging this as the single largest gap between "automated confidence" and "shipped correctness" in this plan, consistent with how every prior docs-touching story in this repo has handled it.
- **Other stories in this feature:** none; ST-01 is the only story (single-story delivery per Jeroen's direction), so there is no cross-story sequencing risk to track.

### Manual verification checklist

1. **AC21 — visual parity.** Before/after Playwright screenshots of `FormExampleClientOnboardingPlanner.vue`, one per wizard step, including `projectContacts` (repeatable page) and `launchApproach` (choice page), in both light and dark color modes (docs site supports both). Compare side by side; any pixel-visible difference is a defect per the story's own "Out of scope" note ("visual redesign ... any visual change from today is a defect, not a goal").
2. **AC22 — plumbing retirement.** Run and confirm zero hits:
   ```
   grep -rn "registerWizardPagePath\|wizardPagePaths" docs/ packages/
   grep -rn "validatePage\|submitForm" docs/ packages/core/src/types/FieldMetadata.ts
   ls docs/.vitepress/theme/utils/loadingResolve.ts   # expect: No such file
   grep -n "currentStepIndex\|gotoStepIndex" docs/.vitepress/theme/components/AdvancedFormTemplate.vue   # expect: no hits inside the slotProperties generic
   ```
3. **AC23 — doc content read-through.** Confirm, reading each page: `docs/examples/advanced.md` no longer mentions `validatePage`; `docs/reference/field-metadata.md` documents `wizard`/`WizardConfig` and states the `v-show` requirement; `docs/reference/dynamic-form-template.md` documents `-wizard`/`-wizard-page` with the `v-show`-not-`v-if` contract stated prominently (not buried in a footnote) and the field-less-page `v-if` exception noted; `docs/reference/use-validate-partial-form.md`'s "Wizard example" section no longer teaches `wizardPagePaths`/`registerWizardPagePath` (replaced per the feature's DECIDED question 5; confirm the story's Implementation notes record which replacement was chosen).
4. **AC24 — docs build.** `pnpm docs:build` locally, zero errors, per CLAUDE.md's "Before Every Push" step 5. Also check the Cloudflare Pages preview once the PR is opened.
5. **Interactive spot-check (not covered by any AC directly, recommended):** click through the live rebuilt example in a browser (Storybook is out of scope per the feature, so this is the docs dev server, `pnpm docs:dev`) exercising `next`/`prev`/a backward `gotoStep` via the stepper, confirming keyboard/focus behavior is not broken by the `v-show` visibility change (a `v-show`-hidden page's inputs remain in the tab order unless the template also sets `inert`/`tabindex`; not asserted by any AC, worth eyeballing since it is a common real-world `v-show` pitfall).

### Untestable as written / rewrite proposals

- **AC2's "exactly one `console.warn` fires per ignored property" is ambiguous between "one call total" and "one call per property."** The architecture's own prose ("gets ONE dev-mode `console.warn` at setup at setup naming the node's path and the ignored property," singular) reads as one call total possibly covering both properties, while the AC's own phrasing ("per ignored property") reads as one call per property (so two calls when both `choice` and `maxOccurs` are co-declared). RESOLVED (research, finding 3): no contradiction. ADR 3 also requires "the warning fires for both inert props" (plural), which agrees with the per-property reading; the singular "ONE ... console.warn" in the ADR's summary sentence describes the single-property case, not a cap. This plan tests the "one call per property" reading, confirmed correct.
- **AC16's "the same way the auto-injected `default` key is already excluded" described a mechanism that does not exist in the codebase.** RESOLVED, see AC16's DECIDED (Jeroen) entry: no exclusion mechanism is added at all. `wizard` gets exactly the treatment `default` already gets (auto-injection only, no rejection), so the original AC's `@ts-expect-error` requirement and this plan's proposed `default`-exclusion test are both dropped.
- **AC13's "for every page (not only the current one)" combined with "no `-wizard-page-array`/`-wizard-page-choice` combinatorial family exists" is two separate claims bundled into one AC.** Tested as two assertions in the same test rather than splitting the AC, since both are cheap to check in one mount and splitting would only fragment the mapping table without adding coverage value.

No acceptance criterion requires a rewrite of its actual requirement; the three items above are phrasing ambiguities/gaps in supporting prose, not requirement changes, and are resolved by this plan choosing the stricter/more literal reading in each case rather than inventing new behavior.

## Open questions

1. **What should a wizard with empty or absent `children` (`pages.length === 0`) do?** No AC specifies it, and the feature spec never addresses it. The three candidate behaviours are: render nothing (empty container, all nav a no-op), emit a dev warning and render nothing, or throw. The architecture's `currentPagePath = overridePath(pages.value[currentStepIndex].path, ...)` currently throws (dereferences `undefined.path`) the moment `next()`/`gotoStep()` is called, and `isLast` degenerates to `false` (`0 === -1`), so this is an unhandled state, not just an aesthetic one.
   > DECIDED (research): guard `next()`/`prev()`/`gotoStep()` to no-op when `pages.length === 0` (never index into `pages`); `isFirst` and `isLast` both read `true`; no `console.warn`.
   > Why: `DynamicFormItemArray` and `DynamicFormItemChoice` already establish this codebase's pattern for empty collections. `DynamicFormItemArray.vue` computes `fields.value?.length` defensively throughout with no special-case crash or warning for zero items, and `DynamicFormItemChoice.vue` reads `field.value?.choice ?? []` and `field.value?.choice?.forEach(...)` everywhere, again with no dev warning for an empty branch list. Neither component treats an empty collection as exceptional; both just have nothing to render. A wizard with zero pages follows the same precedent: no crash, no warning, nothing to navigate.
   > Sources: `packages/core/src/components/DynamicFormItemArray.vue` (`fields.value?.length` guards throughout, no warn path), `packages/core/src/components/DynamicFormItemChoice.vue` (`field.value?.choice ?? []`, `?.forEach`, no warn path).

## Adversarial review

Lite mode (story level). Reviewed against the approved feature architecture and the actual source: `packages/core/src/core/defineMetadata.ts`, `packages/core/src/types/FieldMetadata.ts` (`ComputedPropsFieldType`), `packages/core/src/components/DynamicFormItem.vue` (`isInput`/`onBeforeUnmount`), `packages/core/src/components/DynamicFormItemChoice.vue`, `packages/core/src/core/useValidatePartialForm.ts`, and the docs targets (`FormWizard.vue`, `AdvancedFormTemplate.vue`, `FormExampleClientOnboardingPlanner.vue`, `loadingResolve.ts`, and the four reference/example `.md` pages), all confirmed to exist so AC22/AC23 retirement targets are real.

### Findings

1. **[should-fix] AC16 rests on a false premise: no `default`-key exclusion exists in `defineMetadata` today, so "the same way the auto-injected `default` key is already excluded" cannot be verified against prior art, and the claim is inherited verbatim from the approved feature architecture (a factual error there too).** Verified in `packages/core/src/core/defineMetadata.ts`: the generic is `FieldValueTypes extends Record<string, any>` with no key exclusion. `default` is merely *auto-injected* (`type IncludeFields = 'default'`; `ValueTypeMap = FieldValueTypes & { default: string }`); nothing *prevents* a consumer from declaring `default` as one of their own `FieldValueTypes` keys, and no `defineMetadata.test.ts` exercises any rejection. So the mechanism AC16 (and the feature's ADR 5 DECIDED note, "excluded from valid `FieldValueTypes` keys, alongside the auto-injected `default`") says already exists, does not.
   > DECIDED (Jeroen, discussion): neither `wizard` nor `default` gets a new exclusion mechanism. `wizard` is treated exactly like `default` is treated today, no `@ts-expect-error` test, no change to `defineMetadata.ts`. The `wizard-wizard` slot-name collision (the original motivation) is avoided by the docs rebuild simply not authoring `type: 'wizard'`, not by a type-level guard. This supersedes AC16 as written (see its updated text) and the feature's ADR 5's "reserved at the type level" claim (corrected there too). No semver question remains, since `defineMetadata`'s public type surface is untouched by this story.

2. **[should-fix / open question] A wizard with empty or absent `children` (`pages.length === 0`) is an unhandled crash path, not merely an odd `isLast`.** The architecture specifies `currentPagePath = overridePath(pages.value[currentStepIndex].path, props.pathOverride)`. With `pages.value === []`, `pages.value[0]` is `undefined` and `.path` throws. This is reachable: `isFirst = currentStepIndex === 0` is `true` and `isLast = currentStepIndex === pages.length - 1` is `0 === -1` = `false`, so a container template that renders a "next" control while `!isLast` will offer one, and calling `next()` (or a `gotoStep`) then dereferences `pages.value[0].path` and throws. The QA plan (line 308) flagged this as "no AC covers it" and explicitly deferred the intended behaviour to an Open question rather than inventing one.
   > RESOLVED (research): see Open question 1. `DynamicFormItemArray`/`DynamicFormItemChoice` precedent settled this without needing Jeroen: no-op navigation, `isFirst`/`isLast` both `true`, no dev warning.

3. **[nit] AC2's warning-count ambiguity is real but the QA plan already resolves it correctly; direct the developer to the per-property reading.** AC2's own body is self-consistent ("exactly one `console.warn` fires per ignored property naming the node's path and the property"), so the co-declared `choice` + `maxOccurs > 1` case must emit two calls. The only tension is with the feature's ADR 3 prose ("ONE dev-mode `console.warn` ... naming the ignored property"), which reads as singular only because it describes the general one-property case; ADR 3 also requires "the warning fires for both inert props", which agrees with per-property. No contradiction that needs Jeroen: the QA plan (line 244, line 357) tests one call per property, which is the correct reading. Recorded so the developer implements per-property and does not collapse to one-call-total.
   > RESOLVED (research): confirmed no contradiction; QA plan's per-property reading is correct as written, no change needed.

4. **[nit] AC19's `v-if` contrast test asserts "value cleared, field deregistered", but the "value cleared" half is contingent on `keepValuesOnUnmount` being unset (now honoured in `DynamicFormItem.onBeforeUnmount`, lines 433-438), whereas deregistration holds unconditionally.** Verified: `onBeforeUnmount` returns early (skips the value clear) when `field.value?.fieldOptions?.keepValueOnUnmount` or the form-level `keepValuesOnUnmount` is truthy. The durable, keep-flag-independent failure that actually motivates the `v-show`-not-`v-if` contract (per ADR 6's DECIDED note) is that unmounting *deregisters* the fields, so their validation rules, error, and touched state disappear and `handleSubmit` would submit them unvalidated. Recommendation: write the contrast test to assert **field/validation deregistration** as the primary evidence (holds regardless of keep-flags), and treat value-clearing as a secondary assertion valid only on the default fixture (no keep-flag). This keeps the test from silently passing-for-the-wrong-reason or breaking if a future fixture sets a keep-flag.
   > RESOLVED (research): applied to the QA plan's AC19 test-mapping entry directly.

### Checked and confirmed correct (no finding)

- **`isWizard` first, then `isChoice`, then `isArray` (AC1).** `DynamicFormItem.vue`'s current render order is `isChoice` (template line 488) before `isArray` (line 497); inserting `isWizard` ahead of both, plus `&& !isWizard.value` on `isInput` (line 169), is a clean strictly-additive change. `isWizard` defaults `false` for every existing node.
- **`ComputedPropsFieldType` exclusion pattern (AC17).** `FieldMetadata.ts` already `Omit`s `maxOccursTotal`/`explicitChoiceSelection`/`preserveOnSwitch`; adding `wizard` follows the exact precedent, and `ComputedPropsFieldOf<Metadata>` gives the type-level assertion the QA plan uses.
- **`validateSection` return shape and path matching (AC5/AC6/AC10/AC20).** Returns `{ valid, results, errors, source }` and matches `path === sectionPath || startsWith(sectionPath + '.') || startsWith(sectionPath + '[')`, so a nested page path like `teams[2].wiz.company` correctly scopes to that page's descendant fields. AC5's mid-flight `isValidating` assertion is inherently timing-sensitive; the QA plan's `setupState` fallback is an acceptable mitigation.
- **Independent per-instance step state (AC3/AC4).** `currentStepIndex` is component-local `ref` state, so nested/array-item/choice-branch wizards are independent for free, mirroring how `DynamicFormItemChoice` isolates per-instance state.
- **`overridePath` path handling (AC20)** matches `DynamicFormItemChoice`'s branch-path resolution; the same `pathOverride` renders each page and computes the validated path, so registration and validation targets cannot drift.

## Implementation notes

Implemented as specified. Notable points and deviations:

- **`use-validate-partial-form.md`'s "Wizard example" (DECIDED question 5).** Replaced with a short pointer to the new `wizard` shape plus a non-wizard section-validation example (`validateSection` for a "save draft" action), since the wizard use case no longer needs a hand-built example once the engine covers it. `validateSection` stays documented as public API.
- **Coverage: branch coverage dipped 0.28 percentage points overall (93.00% → 92.72%), while statements/functions/lines all improved.** `DynamicFormItemWizard.vue` sits at 88.33% branch coverage; every remaining uncovered branch is a defensive `?? fallback` or null-guard made structurally unreachable by an upstream invariant already enforced elsewhere in the engine (`correctMetadataAndSetDefaults` always defaults `path`/`minOccurs`/`maxOccurs`/`children` before a node reaches this component, and `next()`/`gotoStep()` never call into `currentPagePath()` when `pageCount === 0`). This mirrors the same kind of already-accepted gaps in `DynamicFormItemArray.vue` (85.71% branch) and `DynamicFormItemChoice.vue` (90.29% branch) baseline. Deliberately did not strip these guards purely to inflate the percentage, since they are the same defensive style the rest of the codebase already relies on.
- **Docs rebuild fixed a latent native-submit gap.** The pre-existing `FormWizard.vue`/`AdvancedForm.vue` pairing never wired `<form>`'s native `submit` event to anything (submit went entirely through the retired `submitForm` metadata callback), even though the wizard's "Submit" button was already `type="submit"`. The rebuild gives `AdvancedForm.vue` a new, additive `submit` event (forwarded from the form's native submit) so `FormExampleClientOnboardingPlanner.vue` can wire it to `handleSubmit` from `useDynamicForm`, per the architecture's "submit stays consumer-owned" rule. This is a incidental correctness fix surfaced by the rebuild, not a new requirement.
- **`AdvancedFormTemplate.vue`'s `slotProperties` fourth generic** dropped `currentStepIndex`/`gotoStepIndex` and gained a single `gotoStep` entry (typed with the library's exported `WizardGotoStepOptions`), forwarded from the `#default-wizard-page` slot via `<slot :goto-step="gotoStep" />` to the summary page's own "edit" links — the same `slotProps` channel every other cross-slot data passing in this template already uses, replacing the old bespoke `gotoStepIndex` entry with the engine's own `gotoStep`.
- **Manual verification not run in this environment.** No browser/Chromium is available here (no `/opt/pw-browsers`, no cached Playwright browser), so AC21's before/after screenshots and the manual interactive spot-check (checklist items 1 and 5) are left pending for the verifier. `pnpm docs:build` was run directly and succeeds (AC24). The AC22 plumbing-retirement greps and the AC23 doc-content read-through were both performed directly during implementation.
- **Encountered and worked around a pre-existing environment quirk, not a code defect:** `packages/element-plus`'s `ci:typecheck` depends on `packages/core`'s built `dist/` output; running `pnpm run ci:test`/`ci:lint` alone does not rebuild it, so a stale `dist/` (from before this story's source changes) initially made `ci:typecheck` fail with `TS7016` on `@bach.software/vue-dynamic-form`. Running `pnpm --filter @bach.software/vue-dynamic-form build` before `pnpm run ci:typecheck` resolves it; this is unrelated to any code in this story.

## Verification report

### Pipeline

- `pnpm run ci:test`: 597 tests passed across 27 files in `packages/core` (plus 1 in `packages/element-plus`). No failures.
- `pnpm run ci:lint`: clean, no findings, in both packages.
- `pnpm run ci:typecheck`: clean, in both packages (note: `packages/element-plus`'s typecheck needs `packages/core`'s `dist/` rebuilt first if stale; confirmed the same pre-existing environment quirk the developer flagged, not a code defect).
- `TZ=Europe/Amsterdam pnpm -r ci:test:coverage`: `packages/core` overall 97.20% statements, 92.73% branch, 96.87% functions, 97.20% lines.
- `pnpm docs:build`: succeeds with zero errors on the story's changes.

**Coverage vs baseline, verified directly (not just taken on the developer's word):** stashed the story's full diff, ran coverage against the pre-story commit (`7d6a383`), and got exactly the baseline the developer cited: 97.11% statements/lines, 96.59% functions, **93.00% branch** (745/801). Restoring the story's changes gives 92.73% branch (817/881), a genuine -0.27pp dip, statements/functions/lines all improved. Inspected the actual uncovered branches in `DynamicFormItemWizard.vue` via the lcov HTML report: every one is a `field.value?.x ?? default` / `page?.path ? … : undefined` style fallback (lines 41, 58, 62, 87-90, 101, 107) that is structurally unreachable because `correctMetadataAndSetDefaults` always populates `path`/`minOccurs`/`maxOccurs`/`children` before a node reaches this component, and `next()`/`gotoStep()`/`currentPagePath()` are guarded against `pageCount === 0` before ever indexing into `pages`. Cross-checked `DynamicFormItemArray.vue` (85.71% branch) and `DynamicFormItemChoice.vue` (90.24% branch) and found the identical pattern already present and already accepted in those files (`minOccurs ?? 1`, `maxOccurs ?? 1`, `path ?? ''`, `choice ?? []`, etc., all uncovered for the same reason). The developer's explanation holds: this is a pre-existing, accepted defensive-code style in this codebase, not a new untested behavioural gap. No fix required.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. Wizard shape detected, checked before choice/array/parent; regressions green | Pass | `DynamicFormItemWizard.logic.test.ts` "a node with wizard set delegates…"; `DynamicFormItem.vue` diff shows `isWizard` as the first `v-if` branch; full pre-existing `DynamicFormItem*`/`DynamicFormItemArray*`/`DynamicFormItemChoice*` suites unmodified (`git diff --stat` shows zero changes to those files) and green. |
| 2. `children`-only pages; co-declared `choice`/`maxOccurs` inert, one warning each | Pass | `DynamicFormItemWizard.logic.test.ts` "warns once per ignored property…" and "renders identically to the same node with choice/maxOccurs stripped". |
| 3. Choice of wizards falls out of existing choice mechanism | Pass | `DynamicFormItemWizard.logic.test.ts` "each branch is an independent wizard once selected" (via `explicitChoiceSelection`/`addChoiceOccurrence`). |
| 4. Repeated wizard falls out of existing array mechanism | Pass | `DynamicFormItemWizard.logic.test.ts` "each occurrence has an independent currentStepIndex". |
| 5. `next()` validates only current page, advances only on success | Pass | `DynamicFormItemWizard.validation.test.ts` "does not advance and shows the error when the current page is invalid" (asserts `isValidating` true mid-flight, false after, error visible, no advance). |
| 6. `next()` advances on success; clamps at last page | Pass | `DynamicFormItemWizard.validation.test.ts` "advances when the current page validates, and does not advance again past the last page". |
| 7. `prev()` moves back unconditionally, no-ops at page 0 | Pass | `DynamicFormItemWizard.logic.test.ts` "decrements with no validation gate and no-ops on the first page". |
| 8. `gotoStep()` backward-only by default | Pass | `DynamicFormItemWizard.logic.test.ts` "allows a backward jump and blocks a forward jump". |
| 9. `gotoStep()` honors `allowForwardJump`, config vs call-time, both override directions | Pass | `DynamicFormItemWizard.logic.test.ts`, three sub-cases under "gotoStep() honors allowForwardJump…". |
| 10. `gotoStep()` honors `validateOnJump`, config vs call-time, both override directions | Pass | `DynamicFormItemWizard.validation.test.ts`, four sub-cases under "gotoStep() honors validateOnJump…". |
| 11. `gotoStep()` clamps out-of-range indices | Pass | `DynamicFormItemWizard.logic.test.ts` "clamps below zero to 0 and above range to the last page". |
| 12. Container slot receives full `WizardAttributes` incl. resolved `pages` | Pass | `WizardAttributes` interface in `DynamicFormTemplate.vue` matches spec exactly; shared `TestFormTemplate.vue` fixture's `#default-wizard` destructures and uses every named prop (`fieldContext`, `currentStepIndex`, `pages`, `pageCount`, `isFirst`, `isLast`, `isValidating`, `next`, `prev`, `gotoStep`); `DynamicFormItemWizard.logic.test.ts` "the number of goto buttons equals the number of rendered page wrappers" proves the stepper (built purely from `pages`) never desyncs from actual navigation. |
| 13. Page slot receives `WizardPageAttributes` for every page, dispatched through own shape, no combinatorial family | Pass | `DynamicFormItemWizard.logic.test.ts` "renders array and choice pages through their own DynamicFormItemArray/DynamicFormItemChoice, all pages present in the DOM"; grep confirms no `-wizard-page-array`/`-wizard-page-choice` slot exists anywhere. |
| 14. Type-scoped dispatch ladder for both families | Pass | `DynamicFormTemplate.test.ts`, `*-wizard / default-wizard fallback chain` and `*-wizard-page / default-wizard-page fallback chain` describe blocks, plus the shadowing regression block. |
| 15. Typeless wizard resolves through engine-default type and falls back | Pass | `DynamicFormTemplate.test.ts` "a typeless wizard resolves through its engine-default type and falls back to default-wizard". |
| 16. Literal type `wizard` needs no new type-level handling | Pass | No diff to `defineMetadata.ts` (`git diff` empty); no `@ts-expect-error`/exclusion test added; matches the DECIDED (Jeroen) correction exactly. |
| 17. `wizard` is static, not computed | Pass | `DynamicFormItemWizard.logic.test.ts` runtime mutation-has-no-effect test, plus `ComputedPropsFieldOf<Metadata>` `@ts-expect-error` type-level test; `ComputedPropsFieldType`'s `Omit` list gained `'wizard'`. |
| 18. Existing forms unaffected | Pass | Confirmed via `git diff --stat`: zero changes to any pre-existing `*.test.ts` file; only `DynamicFormTemplate.test.ts` (additive `describe` blocks) and `TestFormTemplate.vue` (additive slots) touched. |
| 19. Non-current pages stay mounted (`v-show`); values/validation survive navigation | Pass | `DynamicFormItemWizard.logic.test.ts` "preserves a filled field's value and visibility state across a round trip" (value survives, field still registered) and "contrast: a v-if-gated page slot deregisters its fields on navigation away" (proves the documented failure mode is real); `.analytics.test.ts` "a field on page 0 keeps the same render identity across a round trip" (no remount). |
| 20. Page paths from corrected tree, correct when nested in array occurrence | Pass | `DynamicFormItemWizard.validation.test.ts` "validates against the exact runtime path of the nested page, not a re-derived one" (`teams[2].wiz.company`, sibling occurrences unaffected). |
| 21. Rebuilt onboarding example, unchanged visual result (manual) | Pass — verified by this verifier, not by the developer | See "Manual verification performed" below. Chromium was available in this environment (unlike the developer's); ran real before/after screenshots. |
| 22. Hand-rolled plumbing fully retired | Pass | `grep -rn "registerWizardPagePath\|wizardPagePaths" docs/ packages/` → no hits; `grep -rn "validatePage\|submitForm" docs/ packages/core/src/types/FieldMetadata.ts` → no hits (only unrelated vee-validate internals in `.vitepress/cache`, excluded); `docs/.vitepress/theme/utils/loadingResolve.ts` does not exist; `AdvancedFormTemplate.vue`'s `defineMetadata` fourth generic has only a new `gotoStep` entry, no `currentStepIndex`/`gotoStepIndex`. |
| 23. Doc pages describe the new shape, `v-show` contract prominent | Pass | Read all four pages directly: `advanced.md` has no `validatePage` mentions and describes the `wizard` property; `field-metadata.md` documents `wizard`/`WizardConfig` with an explicit `v-show`-not-`v-if` paragraph; `dynamic-form-template.md` documents both slot families with a `::: warning` callout stating the `v-show`-not-`v-if` contract prominently, including the field-less-page exception; `use-validate-partial-form.md`'s wizard example is replaced with a pointer to the `wizard` shape plus a non-wizard "save draft" `validateSection` example, matching the Implementation notes' recorded choice. |
| 24. `pnpm docs:build` succeeds (manual) | Pass | Ran it directly: builds clean with zero errors, both on the story's changes and (for comparison) on the pre-story baseline. |

Edge cases (`gotoStep(currentStepIndex)` no-op, single-page wizard, empty-`children` wizard, field-less `v-if` summary page, two independent wizards never cross-affecting each other): all covered by dedicated tests in `DynamicFormItemWizard.logic.test.ts`/`.analytics.test.ts`, all pass.

### Manual verification performed

The developer's Implementation notes correctly stated no browser was available in the implementation environment, so AC21's screenshots and the manual interactive spot-check were left pending. This verifier's environment does have a working Chromium (cached Playwright install, launched via an explicit `executablePath` since the bundled `playwright` package's expected revision was not the one cached), so both were run for real rather than left as an open gap:

- **AC21 (before/after screenshots).** Built and served the docs site twice: once against the story's full working tree ("after"), once against the pre-story commit `7d6a383` via `git stash` ("before"), both through `pnpm docs:build` + `vitepress preview`. Drove the onboarding wizard through all 5 steps (company → project contacts (repeatable) → launch approach (choice) → systems → summary) with Playwright, in both light and dark color mode, 10 screenshots per side. Pixel-diffed each before/after pair: differences were under 0.2% of pixels per screenshot (338-783 pixels out of 297k-730k), consistent with incidental button-focus rings and randomized fill text from the automation script, not layout/style drift. Manual visual inspection of every pair confirmed the rendered result is unchanged: same stepper, same card layout, same repeatable-contact UI, same choice cards, same summary/edit-links layout, same colors in both color modes.
- **Interactive spot-check (checklist item 5).** Verified the `v-show`-not-`v-if` visibility mechanism does not break keyboard/focus behavior: navigated from page 0 to page 1, then queried page 0's now-hidden input directly. Confirmed an ancestor has `display: none` and a direct `.focus()` call on the hidden input fails (`document.activeElement` does not become that element) — the browser's native `display:none` handling already excludes it from the tab order, with no extra `tabindex`/`inert` needed. No focus-trap or stray-tab-stop issue found.

Both artifacts (screenshots, diff results) were produced and inspected in this session; not attached to the spec file per the "don't stamp process artifacts into specs" convention, but the methodology and results are recorded here for the record.

### Process compliance

- `specs/components.md`: updated with `DynamicFormItemWizard`, the `-wizard`/`-wizard-page` slot family, `WizardConfig`/`WizardGotoStepOptions`/`WizardAttributes`/`WizardPageAttributes`, and the `FieldMetadata.wizard` property including its `ComputedPropsFieldType` exclusion. Matches the existing entry style.
- Changeset: `.changeset/wizard-metadata-shape.md` present, bump type `minor`, matching the architecture's semver analysis (additive only).
- Library API rules: no new undocumented exports (`DynamicFormItemWizard` exported from `index.ts`; `WizardConfig`/`WizardGotoStepOptions` re-exported via the existing `FieldMetadata.ts` `export *`; `WizardAttributes`/`WizardPageAttributes` declared in-file only, matching the `ChoiceAttributes` convention, not re-exported); camelCase throughout (`currentStepIndex`, `gotoStep`, etc.); slot dispatch uses the established `typeWithFallback` channel, no new channel invented.
- Test naming: `DynamicFormItemWizard.logic.test.ts` / `.validation.test.ts` / `.analytics.test.ts` follow the repo's established suffix conventions.
- No spec/process references found in the new source or test files (spot-checked `DynamicFormItemWizard.vue` and the four new test files).
- `defineMetadata.ts` untouched, matching AC16's DECIDED (Jeroen) correction — verified via `git diff` (empty).
- No silent overrides of feature-level decisions found; every deviation recorded in Implementation notes (the `use-validate-partial-form.md` replacement choice, the incidental native-submit wiring fix, the `AdvancedFormTemplate.vue` `slotProperties` generic change) is a documented, in-scope consequence of the rebuild, not an undocumented departure from the approved architecture.

### Overall verdict: **pass**

All 24 acceptance criteria and all listed edge cases pass, with concrete evidence for each, including AC21 and the manual interactive spot-check (performed by this verifier since a working browser was available in this environment). The one flagged risk (branch coverage dip) was independently verified against the actual baseline and the actual uncovered branches, and confirmed to be the same accepted defensive-code pattern already present in sibling components, not a real gap.

Status set to `done`. This is the only story for FEAT-003 (single-story delivery); the feature itself can now move to `done` once Jeroen reviews.

Reminder for Jeroen: please link the PR in this story's `pr` frontmatter field.
