---
id: ST-05
type: story
feature: FEAT-007
status: done
approved_by: Jeroen
pr: ""
---

# Story: Wizard, review, and success chrome, public API finalization, and package README

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen individually. Override any of these freely.

- Should-fix 2 → ST-05 does depend on ST-03's `SectionCard` (`SubmissionSuccess` and `wizardSummaryPage` both wrap it); dependency text corrected
- Should-fix 3 → AC8's runtime export count corrected from ten to seven (the rest are type-only)

## Decided (Jeroen)

- Finding 1 → keep the faithful-port `—` placeholder for `ReviewGroup`'s empty-value fallback; CLAUDE.md's em-dash rule only bans using the character to connect clauses/sentences, a table placeholder glyph was never covered

## Functional

### User story

As a library consumer building a multi-step form, I want `StarterFormTemplate` to render a styled stepper, per-page navigation, a review summary, and a post-submit success screen, so a wizard form looks complete out of the box.

As a library consumer evaluating the package, I want a README that tells me how to install it, import its stylesheet, use it bare or with overrides, and use the icon slot correctly (including that `#icon` only works on a wrapper, not on `DynamicForm` directly), so I can adopt it without reading the source.

### Acceptance criteria

1. **Wizard pages render through `FormWizard` + `Stepper` on `default-wizard`/`default-wizard-page`.** Given a wizard-shaped metadata tree (FEAT-003's multi-step shape), when rendered, then `sft-wizard-head`/`-eyebrow`/`-title`, `sft-stepper`, `sft-step` (with `is-done`/`is-current` and `-dot`/`-label`/`-connector`), and `sft-wizard-footer`/`-helper` render, and only the current page's content is visible via `v-show` (never `v-if`), matching the wizard page-visibility contract FEAT-003 established.
2. **`gotoStep` is forwarded through `StarterSlotProperties`.** Given a wizard rendered with a custom `#default-wizard-page` or `#heading` override, when the slot scope is inspected, then `gotoStep(index, options?)` is present and calling it navigates the wizard, matching the feature's `StarterSlotProperties` type.
3. **The review step renders through `ReviewGroup` on `wizardSummaryPage`.** Given a wizard's summary page, when rendered, then `sft-review-group`/`-header`/`-title`/`-list`/`-row`/`-key`/`-val` render one row per summarized field, and a `sft-confirm`/`-strong` banner renders using the Decision A variable set (same light/dark value, no new gap closed).
4. **`ReviewGroup` is exported and typed.** Given the package entry, when a consumer imports `ReviewGroup` and its `Props` type directly, then both resolve, matching the dogfooding demo pages' direct usage (`FormExampleWizard`, `FormExampleClientOnboardingPlanner`).
5. **`SubmissionSuccess` renders the post-submit screen and is exported.** Given `SubmissionSuccess` mounted with a list of `TimelineItem`s, when rendered, then `sft-success-hero`/`-badge`/`-title`/`-ref`, `sft-timeline`/`-title`/`-dot`, and `sft-success-actions` render, the in-progress timeline item shows a spinning loader glyph (`StarterIcon` `name="loader"` plus `sft-spin`), and the component plus its `TimelineItem`/`Props` types are exported from the package entry.
6. **`ReviewGroup` and `SubmissionSuccess` are themed when used standalone.** Given either component mounted with no `StarterFormTemplate` ancestor and no manual wrapper class, when rendered under a document with `:root`/`:root.dark` variables defined (as ST-01 declares them), then colors resolve correctly in both modes, confirming the document-root scope decision closes finding 6 for these two standalone exports.
7. **The icon slot still reaches wizard/review/success glyphs.** Given the ST-02 wrapper pattern, when a `#icon` override is supplied to a mounted `StarterFormTemplate` that renders a wizard, then every stepper/review glyph inside the form renders through the override; given `SubmissionSuccess`/`ReviewGroup` mounted standalone with no form ancestor, then they always render the Lucide default (no template above them to provide an override), matching the Icon architecture section exactly.
8. **The full public API surface matches ADR 4 exactly.** Given `packages/starter/src/index.ts`, when its exports are enumerated, then they are exactly: `StarterFormTemplate`, `starterMetadata`, `extendMetadata`, `StarterValueTypes`, `StarterFieldProperties`, `StarterIcon`, `StarterIconName`, `starterIconNames`, `SubmissionSuccess`, `ReviewGroup` (plus `TimelineItem` and `ReviewGroup`'s props type), and the four re-exported core types (`FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, `MetadataConfiguration`); no other chrome component (`FormField`, `ArraySectionCard`, `ChoiceCard`, etc.) is exported.
9. **The package README mirrors `packages/element-plus/README.md`'s shape.** Given `packages/starter/README.md`, when compared, then it covers install, stylesheet import, bare usage, the slot-override pattern, icon usage, and customization guidance, states explicitly that this is an installable dependency and not a cloneable scaffold (resolved decision 1), and states explicitly that `#icon` is only reachable via the wrapper-component pattern, not passed directly to `DynamicForm` (research-decided clarification), with a short code example of each.
10. **`specs/components.md` entry is finalized.** Given the entry built up across ST-01 through ST-04, when this story lands, then it lists the complete export set from criterion 8, still under "Non-published surfaces" (package stays private).
11. **No Tailwind classes, no `<style scoped>`, classes exist in the stylesheet.** Given `FormWizard`, `Stepper`, `ReviewGroup`, `SubmissionSuccess`, when scanned, then none contains a Tailwind utility class or `<style scoped>`, and every referenced `sft-`/`is-*` class exists in ST-01's stylesheet.
12. **Code hygiene.** No spec/process references, no em dashes, camelCase Vue identifiers; `pnpm run ci:lint`, `ci:typecheck`, `ci:test` pass for `packages/starter`.

### Edge cases

- A wizard with only one page: stepper still renders with a single `is-current` step, no `is-done` step, footer navigation disabled appropriately.
- `SubmissionSuccess` with an empty timeline: hero renders, timeline region is simply absent.
- A review row whose value is empty/undefined: `sft-review-group-val` renders a `—` placeholder, not an error.

### Out of scope

- Dogfooding the docs site, Storybook playground: next two stories.
- Publish flip and its changeset: explicitly deferred to a later, separate action per the feature's Backwards-compatibility section, not part of this feature's stories.

## Design reference

[`../../prototype.html#wizard`](../../prototype.html#wizard), [`#review`](../../prototype.html#review), [`#success`](../../prototype.html#success). No new design.

## Architecture reference

Implements the **wizard+review+success** structural shape of slicing seam 2, and closes out the feature's Public API table and README scope item (not tied to one specific seam in the architecture's 4-slice list, assigned here because the full export set and an accurate README both require every chrome piece to exist first). Builds: `FormWizard`, `Stepper` (internal), `ReviewGroup`, `SubmissionSuccess` (both exported per ADR 4, with `TimelineItem` and the `ReviewGroup` props type). Implements the Icon architecture section's standalone-export case and the Styling and theming architecture section's resolution of finding 6.

Files: `packages/starter/src/FormWizard.vue`, `src/Stepper.vue`, `src/ReviewGroup.vue`, `src/SubmissionSuccess.vue`, `src/index.ts` (final export list), `packages/starter/README.md`, tests, `specs/components.md`.

Depends on ST-02 for the template shell, metadata catalogue, and icon wiring. Is independent of ST-03/ST-04's array and choice *rendering*, but composes ST-03's `SectionCard` (`SubmissionSuccess`'s root and the `wizardSummaryPage` slot both wrap it), so `SectionCard` must exist first, as the regression-risk section already notes; it is sequenced after both ST-03 and ST-04 regardless because this story also finalizes the package's full public API and README, which should describe the completed surface rather than a partial one. No changeset: no `packages/core/src/` change; package stays private.

> **DECIDED (research): corrected dependency accuracy, resolves finding 2.** Verified directly against `docs/.vitepress/theme/components/SubmissionSuccess.vue` (its root element is `<SectionCard :dataTestid="dataTestid">`, line 29) and `AdvancedFormTemplate.vue`'s `wizardSummaryPage` slot template (wraps its `ReviewGroup` list and confirm banner in `<SectionCard>` too, lines 116-137). Both pieces this story ports genuinely compose `SectionCard`, which ST-03 builds. Sequencing is unaffected (ST-05 was already sequenced after ST-03); this is a pure accuracy fix so a developer does not assume `SectionCard` is unavailable or re-implement it.

## QA plan

Mirrors `packages/element-plus/src/__tests__` conventions, in particular `ElementPlusFormTemplate.wizard.*.test.ts` and `wizard.test-helpers.ts` (the `wizardMetadata`/`mountWizardForm`/`stepButton`/`isRegistered` shapes), adapted to `sft-` classes and this package's `mountInForm`/`createConsumerWrapper`/`renderCount` fixtures. `ReviewGroup` and `SubmissionSuccess` have no element-plus precedent (unique to this package); their tests are modeled on the ST-01-04 component-test shape instead. All new tests live in `packages/starter/src/__tests__/`. No `TZ`-sensitive behaviour in this slice.

Verified against source ahead of writing this plan: `FormWizard.vue`'s page-visibility comment and `AdvancedFormTemplate.vue`'s `#default-wizard-page` template confirm `v-show="isCurrent"` (never `v-if`), matching AC1. `Stepper.vue` currently expresses done/current with Tailwind conditionals (`i < currentStep` / `i === currentStep`) rather than named modifier classes; porting to `is-done`/`is-current` is a rename of the same two states, not a new one. `ReviewGroup.vue`'s row template is `<dt>`/`<dd>` inside a `<dl>`, mapping 1:1 onto `sft-review-group-list`/`-row`/`-key`/`-val`. `SubmissionSuccess.vue`'s timeline item status type is `'done' | 'pending'` (not "in-progress"); AC5's "in-progress" is descriptive prose, tests use the real `'pending'` value. The confirm banner markup lives inline in `AdvancedFormTemplate.vue`'s `wizardSummaryPage` slot, not inside `ReviewGroup` itself, so `sft-confirm`/`-strong` assertions belong in the wizard test file, not `ReviewGroup.test.ts`. `FormWizard`'s `Props` interface has no `errorMessage` field even though `AdvancedFormTemplate.vue` passes `:error-message="..."` to it; today nothing renders from that attribute (it falls through as an unused DOM attribute). No AC in this story claims a visible wizard-level error element, so no test asserts one; flagged here only so a test is not written against a claim the source does not support.

### Fixtures and test utilities

- New: `fixtures/wizardMetadata.ts` - `wizardMetadata({ pages, requiredPages, summaryGroups, confirmation })` building a FEAT-003 multi-step wizard tree with a final page whose content is a `wizardSummaryPage`-typed field carrying `wizardSummary` (an array of `{ title, rows, dataTestid }`) and `wizardSummaryConfirmation`, modeled on element-plus's `wizardMetadata` but extended for the summary page.
- New: `fixtures/timelineItems.ts` - a small `TimelineItem[]` builder with one `done` and one `pending` item, and an empty-array variant for the edge case.
- New: `fixtures/reviewRows.ts` - a `rows` fixture including one row with an empty/undefined value for the edge case.
- New: `__tests__/wizard.test-helpers.ts` - adapted from element-plus's `wizard.test-helpers.ts` (`stepButton`, `prevButton`, `nextButton`, `submitButton`, `visiblePages`/`isHidden`, `isRegistered`, `click`), retargeted at `sft-step`/`sft-wizard-footer` class and data-testid names instead of Element Plus's.
- Reused from ST-01/ST-02/ST-03/ST-04: `fixtures/mountInForm.ts`, `fixtures/createConsumerWrapper.ts` (the `icon` override), `fixtures/renderCount.ts`, `helpers/sourceScan.ts`. This story must not duplicate or re-declare any of them.
- No `packages/core/src/examples/` fixture needed: field-tree fixtures stay small and local, matching prior-story precedent.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Wizard pages render through `FormWizard`+`Stepper`; only current page visible via `v-show` | Mount `wizardMetadata()`, assert `sft-wizard-head`/`-eyebrow`/`-title`, `sft-stepper`, `sft-step` with `is-done`/`is-current` and `-dot`/`-label`/`-connector`, `sft-wizard-footer`/`-helper`; click `nextButton`, assert the previous page's field is still registered with vee-validate (`isRegistered`, mirroring element-plus's round-trip proof) and its DOM node is hidden via an inline `display:none` style, never absent; single-page wizard variant asserts one `is-current` step, no `is-done` step, prev hidden (`isFirst`), submit shown instead of next (`isLast`) | `StarterFormTemplate.wizard.test.ts`, `StarterFormTemplate.wizard.logic.test.ts` |
| 2 `gotoStep` forwarded through `StarterSlotProperties` | Mount via a wrapper overriding `#default-wizard-page`, capture the destructured `gotoStep`, call it, assert `currentStepIndex` changes; separately override `#heading` for a field placed inside a wizard page, destructure `slotProps.gotoStep`, assert it is a function and calling it navigates | `StarterFormTemplate.wizard.overrides.logic.test.ts` |
| 3 Review step renders through `ReviewGroup` on `wizardSummaryPage` | Mount `wizardMetadata({ summaryGroups, confirmation })`, navigate to the last page, assert `sft-review-group`/`-header`/`-title`/`-list`/`-row`/`-key`/`-val` render one row per `wizardSummary` row, and `sft-confirm`/`-strong` renders the confirmation text; a variant with `confirmation` omitted asserts no `sft-confirm` block renders | `StarterFormTemplate.wizard.test.ts` |
| 4 `ReviewGroup` exported and typed | `index.test.ts` snapshot includes `ReviewGroup`; a type-only test imports its props type and asserts the `title`/`rows`/`dataTestid` shape; `ReviewGroup.test.ts` mounts it directly with `title`/`rows`, asserts the chrome classes and the `edit` emit fires with no arguments on click | `index.test.ts`, `ReviewGroup.test.ts` |
| 5 `SubmissionSuccess` renders post-submit screen and is exported | Mount `SubmissionSuccess` with `fixtures/timelineItems.ts`, assert `sft-success-hero`/`-badge`/`-title`/`-ref`, `sft-timeline`/`-title`/`-dot`; assert the `pending` item's icon is `findComponent(StarterIcon)` with `name="loader"` and its wrapper carries `sft-spin`, the `done` item's icon has `name="checkCircle"` with no `sft-spin`; assert `sft-success-actions` renders the toggle-JSON and reset buttons, toggling shows/hides the submitted JSON (`showJson` ref) and the reset button emits `reset`; `index.test.ts` confirms the export plus `TimelineItem` and its props type | `SubmissionSuccess.test.ts`, `SubmissionSuccess.logic.test.ts`, `index.test.ts` |
| 6 `ReviewGroup`/`SubmissionSuccess` themed standalone (document-root scope) | Structural assertion that neither component's template applies or requires an `sft-root` (or any other wrapper) class, mounted with no `StarterFormTemplate` ancestor and no manual class; `classUsage.test.ts` extended to confirm every class each references exists in ST-01's document-root-scoped `src/style.css`. Full rendered-colour verification in both modes is a manual check (jsdom does not apply the shipped stylesheet's cascade; see Untestable criteria) | `ReviewGroup.test.ts`, `SubmissionSuccess.test.ts`, `classUsage.test.ts` |
| 7 `#icon` reaches wizard/review/success glyphs; standalone components never see an override | Mount a wizard via `createConsumerWrapper({ icon: ... })`, navigate through all pages including the summary page, assert the stepper done-dot check glyph, footer chevrons, submit-button check glyph, and the review edit/confirm glyphs all render the override; separately mount `ReviewGroup`/`SubmissionSuccess` directly, including a negative case where the icon-override key is provided by an unrelated ancestor that is not `StarterFormTemplate`, and assert the Lucide default always renders | `StarterFormTemplate.wizard.logic.test.ts`, `ReviewGroup.logic.test.ts`, `SubmissionSuccess.logic.test.ts` |
| 8 Full export surface matches ADR 4 exactly | `index.test.ts`: runtime `Object.keys` snapshot of the seven value exports (**DECIDED (research), resolves finding 3:** corrected from "ten"; `StarterFormTemplate`, `starterMetadata`, `extendMetadata`, `StarterIcon`, `starterIconNames`, `SubmissionSuccess`, `ReviewGroup`); a type-only test resolves every type-only export (`StarterValueTypes`, `StarterFieldProperties`, `StarterIconName`, `TimelineItem`, `ReviewGroup`'s props type, the four re-exported core types); `publicApiSurface.test.ts` source-scans `src/index.ts`'s literal `export` statements for an exact match, so an accidental extra export of an internal chrome component (`FormField`, `ArraySectionCard`, `ChoiceCard`, etc.) fails even if nothing else in the suite imports it | `index.test.ts`, `publicApiSurface.test.ts` |
| 9 README mirrors element-plus's shape | Documentation-content check; no unit test asserts prose correctness. A lightweight `readme.test.ts` asserts the required section headings and the two mandated statements (installable dependency, `#icon` wrapper-only) are present by string match, as a cheap automatable floor; full README quality is a manual read (see Untestable criteria) | `readme.test.ts` (proposed), Manual |
| 10 `specs/components.md` entry finalized | Manual verification: reviewer confirms the entry under "Non-published surfaces" lists the complete export set from criterion 8 | Manual |
| 11 No Tailwind, no `<style scoped>`, classes exist in the stylesheet | Source scan of `FormWizard.vue`, `Stepper.vue`, `ReviewGroup.vue`, `SubmissionSuccess.vue` for Tailwind utility patterns and `<style scoped`; reverse-direction check that every `sft-`/`is-*` class these files reference exists in ST-01's `src/style.css` | `noTailwind.test.ts`, `noScopedStyle.test.ts`, `classUsage.test.ts` |
| 12 Code hygiene | Reuses ST-01 through ST-04's `sourceHygiene.test.ts` pattern, scope extended to the four files this story adds; `ci:lint`/`ci:typecheck`/`ci:test` green for `packages/starter` is a CI-artifact check, not a unit test | `sourceHygiene.test.ts`, CI run |

### Edge cases to tests

- Single-page wizard: stepper renders one `is-current` step, no `is-done` step, prev hidden, submit shown instead of next, in `StarterFormTemplate.wizard.test.ts`.
- `SubmissionSuccess` with an empty timeline: hero renders, `sft-timeline` region is absent, in `SubmissionSuccess.test.ts`.
- A review row with an empty/undefined value: the source (`ReviewGroup.vue`) renders a `—` fallback character for a falsy value (**DECIDED (Jeroen)**: keep this faithful-port rendering, see below), not a blank cell.

### States from the feature's states policy applicable to this slice

- **Stepper `is-done`** (completed step, dot shows a checkmark): AC1.
- **Stepper `is-current`** (active step, highlighted dot and label): AC1.
- **Wizard page visible / hidden** (`v-show`, never `v-if`, fields stay registered): AC1.
- **Confirm banner** (fixed Decision A colour pair, same light/dark value): AC3.
- **Review row empty value** (no error state, renders a `—` placeholder): edge case above.
- **Timeline item `done` vs `pending`** (checkmark vs spinning loader, `sft-spin`): AC5.
- **Icon present via override vs Lucide default vs fail-soft** (reusing ST-01's contract, not re-derived): AC7.
- No new valid/success state and no per-field loading state in this slice, matching the feature's "no green success state, loading lives only in the submission timeline" policy; no test invents either.

### Reactivity / analytics

This is the first story in the package to mount a wizard through `StarterFormTemplate`, so `DynamicFormItemWizard`'s page-switch render-count contract needs direct coverage, mirroring element-plus's `ElementPlusFormTemplate.wizard.analytics.test.ts` shape exactly: with `settings: { analytics: true }`, assert (a) switching the current step does not bump the render count of an untouched page's fields or an out-of-wizard sibling field, (b) a forward-then-back round trip does not bump the first page's render count, (c) a page blocked by validation shows its error without bumping a different page's render count. A fourth case specific to this story: navigating via the review page's `gotoStep` edit link does not bump an unrelated page's render count. `ReviewGroup` and `SubmissionSuccess` are plain props-in presentational components, never registered with vee-validate, so they get no `.analytics.test.ts` of their own; their only local reactive state (`SubmissionSuccess`'s `showJson` ref) is covered by `.logic.test.ts` instead.

### Coverage

`packages/starter` keeps its own baseline (per ST-01); `pnpm -r ci:test:coverage` must still pass workspace-wide. Every file this story ships (`FormWizard.vue`, `Stepper.vue`, `ReviewGroup.vue`, `SubmissionSuccess.vue`) gets direct coverage through the AC-to-test map above, including both branches of `wizardSummaryPage`'s confirmation `v-if` (present and omitted) and both the `done` and `pending` timeline branches. One deliberate non-gap: `FormWizard`'s unused `errorMessage` attribute fall-through (see the sourced note above) renders nothing today, so no branch exists to cover; this is noted, not left uncovered.

### Regression risk

- ST-01's `StarterIcon`/stylesheet, ST-02's `AppButton`/icon-provide wiring, and ST-03's `SectionCard` are consumed, not modified, by this story's components (`SubmissionSuccess` and the `wizardSummaryPage` slot both wrap `SectionCard`, see the dependency-accuracy finding above). Their own suites remain the regression guard.
- `StarterFormTemplate.logic.test.ts`'s exact-wired-slot-family assertion (established in ST-02, extended by ST-03 and ST-04) must be extended again here to include `default-wizard`, `default-wizard-page`, and `wizardSummaryPage`, not duplicated in a new assertion.
- Engine wizard mechanics (`DynamicFormItemWizard`, `validateSection`, page navigation/forward-jump rules) are untouched; `packages/core`'s own suite remains the regression guard for the rule itself. This story's tests assert the chrome reflects whatever the engine reports, not the rule's correctness.
- `packages/element-plus` and `docs/.vitepress/theme/components/*` are untouched by this story; their own suites are unaffected and are not re-run as part of this story's gate.

### Untestable criteria and rewrite proposals

- **AC9** (README content) and **AC10** (`specs/components.md` entry) are documentation-content checks; kept as manual checklist items, matching every prior story's treatment. AC9 additionally gets the cheap `readme.test.ts` string-presence floor proposed above.
- **AC6**'s "renders correctly in both modes" standalone claim is only partially automatable: the structural half (no `sft-root` dependency, every referenced class exists in the document-root stylesheet) is testable and mapped above; the rendered-colour half needs a real stylesheet cascade, which this project's jsdom test environment does not apply. Propose narrowing AC6's test-suite scope to the structural half, with the rendered-colour half moved to the manual checklist, mirroring how ST-02 narrowed its "focus" state claim.
- **The edge case 3 wording** now matches `ReviewGroup.vue`'s actual fallback (`v || '—'`). **DECIDED (Jeroen)**: keep the faithful-port `—` placeholder; `CLAUDE.md`'s em-dash rule only bans using the character to connect clauses/sentences, not other uses like this placeholder glyph, so no conflict exists.
- All other criteria are testable as written; no rewrite needed.

### Manual verification checklist

1. Visually compare the wizard stepper/footer, review page, and success screen against `prototype.html#wizard`, `#review`, `#success` in both colour modes, since automated tests check class presence, not pixel layout.
2. In a throwaway mount, toggle `.dark` on `<html>` with `ReviewGroup`/`SubmissionSuccess` mounted standalone (no wrapper), confirm colours flip correctly, closing the half of AC6 jsdom cannot prove.
3. Read `packages/starter/README.md` end to end against `packages/element-plus/README.md`'s section list, confirming the installable-dependency statement and the `#icon` wrapper-only statement both appear with a short code example (AC9).
4. Open `specs/components.md`, confirm the entry lists the complete export set from criterion 8, still under "Non-published surfaces" (AC10).
5. Confirm `ReviewGroup`'s empty-value rendering keeps the `—` placeholder (decided), not an empty cell.

## Adversarial review

STORY mode (lite): blockers and should-fixes only, verified against source (`FormWizard.vue`, `Stepper.vue`, `ReviewGroup.vue`, `SubmissionSuccess.vue`, `AdvancedFormTemplate.vue`) and the `packages/element-plus` export precedent.

1. **[should-fix, product call] Resolved (Jeroen): keep the faithful-port em dash, see the edge case and states-policy entries above.** The empty-value fallback renders a literal em dash, which at first looked like it collided with CLAUDE.md and with this story's own edge-case wording. Verified: `ReviewGroup.vue`'s row template is `{{ v || '—' }}` (line 27), a literal U+2014 em dash. Jeroen clarified CLAUDE.md's rule only bans using the em dash to connect clauses/sentences; a table placeholder glyph is a different use and was never covered. Option (b) from the original two options is the outcome: the faithful-port `—` stays, and edge case 3, the AC-edge-case row, and the states-policy "Review row empty value" line are rewritten to say "renders a `—` placeholder, not an error" (done above).
2. **[should-fix] Resolved (research): corrected in the Architecture reference, see above.** The Architecture reference denied a structural dependency the story's own regression section and the source both assert. Verified: `SubmissionSuccess.vue`'s root element is `<SectionCard :dataTestid="dataTestid">` (line 29) and `AdvancedFormTemplate.vue`'s `wizardSummaryPage` slot wraps its `ReviewGroup` list and the confirm banner in `<SectionCard>` (lines 116-137). `SectionCard` is built by ST-03. Line 56 ("Does not structurally depend on ST-03 or ST-04") contradicts line 119 (regression risk: "ST-03's `SectionCard` are consumed ... both wrap `SectionCard`"). The QA planner already drafted this; I formalize it and route a PROPOSED refinement. Sequencing is unaffected (ST-05 already follows ST-03); the risk is a developer reading line 56 and re-implementing `SectionCard`. The feature's story-list wording ("structurally independent of ST-03/ST-04", line 362 of the feature spec) is the same loose phrasing and should ideally be tightened when the feature is next touched, but the feature architecture already lists `SectionCard` among reused components (line 144), so this is a refinement, not a contradiction of approved intent.
3. **[should-fix] Resolved (research): corrected in the AC8 test-map row, see QA row 8.** The AC8 test-map row miscounted the runtime export surface as "ten value exports" then listed seven. Verified against the element-plus export precedent (`export {}`/`export { default as }` are the runtime bindings; `export type {}` are erased): the runtime value exports are exactly seven (`StarterFormTemplate`, `starterMetadata`, `extendMetadata`, `StarterIcon`, `starterIconNames`, `SubmissionSuccess`, `ReviewGroup`). The other names in AC8 (`StarterValueTypes`, `StarterFieldProperties`, `StarterIconName`, `TimelineItem`, `ReviewGroup`'s props type, and the four re-exported core types) are type-only and never appear in a runtime `Object.keys` snapshot. A developer writing that snapshot to "ten" keys would write a test that can never pass. PROPOSED fix: change "the ten value exports" to "the seven value exports" in the AC8 row (line 86). Routed as a concrete fix.

Nothing else blocks: all twelve ACs are mapped in the AC-to-test table, the `v-show`/page-registration contract, the `done`/`pending` timeline mapping (`spinner` to `loader` per Decision B), the inline confirm-banner location, and the unused-`errorMessage` fall-through are all verified accurate against source.

### Resolution status

- **Finding 1: resolved (Jeroen).** Keep the faithful-port `—` placeholder; CLAUDE.md's em-dash rule only covers connecting clauses/sentences, not this use. Applied above.
- **Finding 2: resolved (research).** Applied in the Architecture reference above.
- **Finding 3: resolved (research).** Applied in QA row 8 above.

## Implementation notes

Built `FormWizard.vue` and `Stepper.vue` (internal) and `ReviewGroup.vue`/`SubmissionSuccess.vue` (exported) in `packages/starter/src/`, each ported from `docs/.vitepress/theme/components/` with Tailwind swapped for the already-shipped `sft-`/`is-*` classes from ST-01, verified against `prototype.html#wizard`/`#review`/`#success`. Wired `#default-wizard` -> `FormWizard`, `#default-wizard-page` -> a `v-show="isCurrent"` wrapper, `#wizardSummaryPage` -> `SectionCard` + one `ReviewGroup` per summary group + an `sft-confirm` banner, exactly as the Architecture reference specifies. `Stepper` marks a done step with a `StarterIcon` `check` glyph and the current step with `is-current`; `FormWizard`'s Back button is always rendered (never `v-if`) and just carries `is-hidden` on the first page, matching the ported source's "no footer layout jump" behavior, while Continue swaps for Submit on the last page. `ReviewGroup`'s empty-value fallback keeps the faithful-port `v || '—'` per the Decided (Jeroen) entry. `SubmissionSuccess` wraps `SectionCard` (confirming the dependency the adversarial review corrected) and routes its glyphs through `StarterIcon` (`checkCircle`/`loader`, the loader carrying `sft-spin`, the one loading state in the package). `metadata.ts`'s `wizardSummary` field property was retyped from an inline `{ title, rows }[]` shape to `ReviewGroupProps[]` (imported from `@/ReviewGroup.vue`), matching the docs source exactly and picking up the optional `dataTestid` the inline shape was missing; `metadata.golden.ts`'s independently written mirror was updated identically. Finalized `index.ts` to the exact seven runtime exports plus the type-only names ADR 4 lists (no `SubmissionSuccess` props type exported, since AC8 only names `ReviewGroup`'s). Wrote `packages/starter/README.md` mirroring `packages/element-plus/README.md`'s section order, with the two mandated statements (installable dependency, `#icon` wrapper-only) as literal sentences a test can string-match. Extended `specs/components.md`'s existing `packages/starter/` row additively with the wizard/review/success paragraph and the finalized export list; this is now the complete surface, so the "no other chrome component is exported" line replaces the earlier "later stories append" placeholder.

New test files: `FormWizard.test.ts`, `Stepper.test.ts`, `ReviewGroup.test.ts`/`.logic.test.ts`, `SubmissionSuccess.test.ts`/`.logic.test.ts`, `StarterFormTemplate.wizard.test.ts`/`.logic.test.ts`/`.overrides.logic.test.ts`/`.analytics.test.ts`, `index.test.ts` (rewritten for the final surface), `publicApiSurface.test.ts`, `readme.test.ts`; new fixtures `fixtures/wizardMetadata.ts`, `fixtures/timelineItems.ts`, `fixtures/reviewRows.ts`, and `__tests__/wizard.test-helpers.ts` adapted from element-plus's own. `StarterFormTemplate.logic.test.ts`'s wired-slot-family assertion was extended to include the three wizard slot names, replacing (not duplicating) its earlier "does not wire the wizard family yet" negative assertion. `sourceHygiene.test.ts` now excludes `ReviewGroup.vue` specifically from the em-dash scan, with a comment explaining the table-placeholder-glyph exception, so the rest of the source tree still fails on a real em dash.

Deviations, recorded here per CLAUDE.md:

1. **Fixed a latent `slotProps`-forwarding bug across every chrome slot's `input`-escape-hatch in `StarterFormTemplate.vue`, pre-existing since ST-02.** Discovered while making AC2 pass: a wizard page's `gotoStep` (bound via `:gotoStep="s.gotoStep"` on `#default-wizard-page`'s own escape hatch) never reached a field nested inside an overridden `#heading`, because every other slot's `<slot name="input"><slot /></slot>` pair forwarded no scope at all, so `s.slotProps` silently collapsed to `{}` one hop down. The engine's own `DynamicFormItem` propagates "slotProps" by whatever scope object the template's own default-slot invocation hands it (confirmed by reading `DynamicFormItemWizard.vue` and `DynamicFormItem.vue` directly), so dropping the scope at any `#default`/`#heading`/array/choice escape hatch breaks every slot property below that point, not just this story's `gotoStep`. Fixed by binding `v-bind="s.slotProps ?? {}"` on every `input`-named slot call and its bare-default fallback (the `?? {}` guard is required: a bare `v-bind="undefined"` on a `<slot>` element throws in this Vue version, confirmed by a minimal reproduction). This is a bug fix to ST-02's own escape-hatch shape, not a new mechanism; it has no effect on any existing ST-02/03/04 test (none of them read `slotProps`) and is covered directly by `StarterFormTemplate.wizard.overrides.logic.test.ts`'s `#heading`-override case. No feature design or architecture text needs amending: the fix makes the existing, already-specified `StarterSlotProperties` contract actually reach every depth, which is what AC2 already required.
2. **`FormWizard.vue` forwards its own `dataTestid` prop into `Stepper`, which the ported `AdvancedFormTemplate.vue`/`FormWizard.vue` source never wires at all.** Without it, the stepper's step buttons would carry no `data-testid`, make them unselectable by any test or consumer automation, and the ported source itself never gives them one (an oversight in the source, not a deliberate omission). Minimal, additive, behavior-preserving: it only adds a `data-testid` attribute, changes no rendering or logic, and the `wizard.test-helpers.ts` `stepButton` helper relies on it.
3. **`#default-wizard-page`'s wrapper carries `data-page="<pageIndex>"` and `data-testid="<pagePath>-page"`, neither present in the ported `AdvancedFormTemplate.vue` source.** Needed for the same reason as the Stepper fix: AC1's "DOM node is hidden via an inline `display:none` style, never absent" claim and the analytics tests both need a stable way to select one specific page's wrapper element. Mirrors the equivalent attributes `ElementPlusFormTemplate.vue`'s own `default-wizard-page` block already carries (`epft-wizard-page`/`data-page`/`data-testid="<path>-page"`), so this keeps the two sibling packages' testability shape consistent rather than inventing a one-off scheme.
4. **Added `FormWizard.test.ts` and `Stepper.test.ts`, direct component tests not named in the QA plan's AC-to-test map.** The map only names `StarterFormTemplate.wizard.*` as the coverage vehicle, but a few branches (no title/no subTitle, no `dataTestid`, the submit-button variant, the page-label fallback to `page.name`) are awkward or impossible to reach through a full wizard mount without contorting the fixture, and ST-03's own precedent already ships standalone tests (`ArraySectionCard.test.ts`, `RepeaterCard.test.ts`) for internal chrome reachable only through a slot. Added for coverage completeness, not because any AC required them.

No deviation here affects the approved feature design or architecture; all are either a bug fix to an existing mechanism (1), two small testability-only DOM attribute additions mirroring the sibling package's own precedent (2, 3), or additional test coverage beyond what the acceptance criteria strictly required (4).

## Verification report

### Pipeline checks

- `pnpm run ci:test` (`pnpm -r ci:test`): `packages/core` 686 tests (27 files), `packages/element-plus` 480 tests (32 files), `packages/starter` 402 tests (63 files). All pass.
- `pnpm run ci:lint`: clean for all three packages.
- `pnpm run ci:typecheck`: clean for all three packages.
- `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`): `packages/starter` reports 99.61% statements / 96.75% branch / 96.55% functions / 99.61% lines, at or above ST-04's baseline (99.51 / 96.33 / 95.83 / 99.51) on every metric. `packages/core` (97.57% statements, unchanged; `git diff --stat packages/core/src` is empty) and `packages/element-plus` (100% / 98.52% branch, unchanged) show no drop anywhere in the workspace.
- `docs/` untouched by this story; `pnpm docs:build` not required. No visual/UI screenshot taken: headless component change in a private, not-yet-dogfooded package, consistent with ST-01 through ST-04's own reasoning (the components are not yet reachable from any rendered page; dogfooding is ST-06).

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1 Wizard pages render through `FormWizard`+`Stepper`; only current page visible via `v-show` | Pass | `StarterFormTemplate.wizard.test.ts`: head/eyebrow/title, stepper with `is-done`/`is-current` and dot/label/connector, footer/helper all present; `isHidden`/`data-page` assertions confirm the previous page's node stays in the DOM with `display:none`; single-page variant asserts one `is-current` step, no `is-done`, Back carries `is-hidden`, Submit shown instead of Next. |
| 2 `gotoStep` forwarded through `StarterSlotProperties` | Pass | `StarterFormTemplate.wizard.overrides.logic.test.ts`: an overridden `#default-wizard-page` captures `scope.gotoStep` and navigates with it (allowed forward jump); a separate case captures `scope.slotProps.gotoStep` through an overridden `#heading` nested inside a page and confirms it is a function that navigates. |
| 3 Review step renders through `ReviewGroup` on `wizardSummaryPage` | Pass | `StarterFormTemplate.wizard.test.ts`: one `sft-review-group` per summary group with header/title/list/row/key/val, an `sft-confirm`/`-strong` banner when `wizardSummaryConfirmation` is set, and its absence when omitted. |
| 4 `ReviewGroup` exported and typed | Pass | `index.test.ts` confirms the runtime export and types `ReviewGroupProps`; `ReviewGroup.test.ts` mounts it directly, asserts the chrome classes, and confirms `edit` fires with no arguments. |
| 5 `SubmissionSuccess` renders post-submit screen and is exported | Pass | `SubmissionSuccess.test.ts`/`.logic.test.ts`: hero/badge/title/ref, timeline/title/dot, the pending item's `loader` icon carrying `sft-spin` versus the done item's static `checkCircle`, the JSON toggle and reset button; `index.test.ts` confirms the export plus `TimelineItem`. |
| 6 `ReviewGroup`/`SubmissionSuccess` themed standalone (structural half) | Pass | `ReviewGroup.test.ts`/`SubmissionSuccess.test.ts` confirm no `sft-root` dependency when mounted with no ancestor; `classUsage.test.ts` (whole-tree scan) confirms every referenced class exists in the document-root-scoped stylesheet. Rendered-colour half stays a manual check per the Untestable criteria note. |
| 7 `#icon` reaches wizard/review/success glyphs; standalone components never see an override | Pass | `StarterFormTemplate.wizard.logic.test.ts`: a wrapper-supplied icon override replaces the stepper/footer/review glyphs; `ReviewGroup.logic.test.ts`/`SubmissionSuccess.logic.test.ts` confirm the Lucide default renders standalone and still renders when an unrelated ancestor provides an unrelated key. |
| 8 Full export surface matches ADR 4 exactly | Pass | `index.test.ts`: `Object.keys(api)` snapshot is exactly the seven runtime values; `publicApiSurface.test.ts` source-scans `index.ts`'s literal export statements for an exact match and confirms no internal chrome component is exported. |
| 9 README mirrors element-plus's shape | Pass | `readme.test.ts` confirms the required section headings and both mandated statements are present; full prose quality is a manual read (Jeroen's checklist below). |
| 10 `specs/components.md` entry finalized | Pass (manual) | The existing `packages/starter/` row gained the wizard/review/success paragraph and the finalized export list in its first column; no existing row text was replaced. |
| 11 No Tailwind, no `<style scoped>`, classes exist in the stylesheet | Pass | `noTailwind.test.ts`, `noScopedStyle.test.ts`, `classUsage.test.ts` (whole-tree auto-scans, no test-file changes needed). |
| 12 Code hygiene | Pass | `sourceHygiene.test.ts` (auto-scans the new files, with `ReviewGroup.vue` excluded from the em-dash check per the Decided entry); `ci:lint`/`ci:typecheck`/`ci:test` all green. |

Edge cases: a single-page wizard (no `is-done` step, Back `is-hidden`, Submit instead of Next) is in `StarterFormTemplate.wizard.test.ts`; an empty `SubmissionSuccess` timeline (hero renders, `sft-timeline` absent) is in `SubmissionSuccess.test.ts`; a `ReviewGroup` row with an empty value renders the `—` placeholder, covered in both `ReviewGroup.test.ts` and the `StarterFormTemplate.wizard.test.ts` review-page test.

### Reactivity / analytics

`StarterFormTemplate.wizard.analytics.test.ts` covers the four cases the QA plan specified: switching the current step does not bump an untouched page's fields or an out-of-wizard sibling; a forward-then-back round trip does not bump the first page; a page blocked by validation surfaces its error without bumping a different page; navigating via the review page's `gotoStep` edit link does not bump an unrelated page. `ReviewGroup`/`SubmissionSuccess` get no `.analytics.test.ts` of their own (plain props-in, never registered with vee-validate), matching the QA plan.

### Process compliance

- `specs/components.md`: updated additively; confirmed the existing element-plus and starter rows above/below this entry are untouched.
- No changeset: confirmed `git diff --stat packages/core/src` is empty; `packages/starter` stays `private: true`.
- Library API rules: `src/index.ts` now exports exactly the ADR-4 surface, confirmed by `publicApiSurface.test.ts`; all identifiers camelCase; no kebab-case in any new `.vue` file.
- No spec/process references found in any new source or test file (`sourceHygiene.test.ts`'s automated scan plus a manual read); the one literal em dash in the tree (`ReviewGroup.vue`'s placeholder glyph) is the documented, decided exception, not prose.

### Manual verification outstanding (Jeroen)

1. Visually compare the wizard stepper/footer, review page, and success screen against `prototype.html#wizard`/`#review`/`#success` in both colour modes.
2. In a throwaway mount, toggle `.dark` on `<html>` with `ReviewGroup`/`SubmissionSuccess` mounted standalone, confirm colours flip correctly (the rendered-colour half of AC6 jsdom cannot prove).
3. Read `packages/starter/README.md` end to end against `packages/element-plus/README.md`'s section list (AC9).
4. Open `specs/components.md`, confirm the finalized `packages/starter/` row reads well in context (AC10).

### Independent QA verification

Re-ran the full pipeline independently rather than trusting the developer's report: `pnpm run ci:test` (`pnpm -r ci:test`) reproduced the exact same counts (`packages/core` 686/27 files, `packages/element-plus` 480/32 files, `packages/starter` 402/63 files, all passing). `pnpm run ci:lint` and `pnpm run ci:typecheck` are clean on all three packages. `pnpm -r ci:test:coverage` reproduced the exact same `packages/starter` numbers (99.61% statements / 96.75% branch / 96.55% functions / 99.61% lines), `packages/element-plus` unchanged (100% / 98.52% branch), and confirmed `packages/core/src` has no diff, so its coverage is unaffected and no changeset is required.

Special scrutiny on deviation 1 (the `slotProps` forwarding bug): temporarily reverted the `v-bind="s.slotProps ?? {}"` fix on every `input`-escape-hatch in `StarterFormTemplate.vue` (reducing it back to a bare `<slot name="input"><slot /></slot>` pattern) and re-ran `StarterFormTemplate.wizard.overrides.logic.test.ts`. The `#heading`-override case failed exactly as predicted (`expected 'undefined' to be 'function'`), while the page-wrapper-override case still passed, confirming the bug is real, is specific to nested overrides below the first escape hatch, and is caught by the story's own test. Restored the fix and reran: both tests pass. Traced the mechanism directly in `packages/core/src/components/DynamicFormItem.vue` (the `<template #default="slotProps">` capture that feeds each child's `:slot-props` prop) and `DynamicFormItemWizard.vue` (`:slot-props="stableSlotProps(...)"` passed to the page's own `DynamicFormItem`), confirming the engine really does derive a node's `slotProps` from whatever the template's own nested `<slot v-bind="...">` forwards, exactly as the deviation describes; this is not test-fixture coincidence. Confirmed the fix is applied at every one of the twelve `input`-escape-hatch call sites in `StarterFormTemplate.vue`, including the two-argument `heading-choice` variant. Confirmed no ST-02/ST-03/ST-04 test reads `slotProps`, so none needed to change to accommodate the fix, and the full `ci:test` run above shows all of their suites still green.

Deviation 2 (`FormWizard` forwarding `dataTestid` into `Stepper`): confirmed in `docs/.vitepress/theme/components/Stepper.vue` that `dataTestid` is already a supported prop used internally for each step button's `data-testid`, but `docs/.vitepress/theme/components/FormWizard.vue`'s own `<Stepper :steps=... :currentStep=... :allowForwardJump @goto=...>` call never passes it. The ported source genuinely never wires it; the starter package's `:dataTestid` addition on that same call is a real, minimal bug fix, not scope creep.

Deviation 3 (wizard-page wrapper's `data-page`/`data-testid`): confirmed `docs/.vitepress/theme/components/AdvancedFormTemplate.vue`'s `#default-wizard-page` block is a bare `<div v-show="isCurrent">` with neither attribute, and confirmed `packages/element-plus/src/ElementPlusFormTemplate.vue`'s own `#default-wizard-page` block already carries the equivalent `data-page`/`data-testid` pair. The addition is a real testability gap closed consistently with the sibling package's precedent, not an invented scheme.

AC8 export surface verified directly against `packages/starter/src/index.ts`: exactly seven runtime value exports (`starterIconNames`, `extendMetadata`, `starterMetadata`, `ReviewGroup`, `StarterFormTemplate`, `StarterIcon`, `SubmissionSuccess`) and the nine type-only names AC8 lists, matching `publicApiSurface.test.ts` exactly. `ReviewGroup.vue` line 32 still renders the faithful-port `v || '—'` fallback, unchanged, per the Decided (Jeroen) entry, and `sourceHygiene.test.ts` excludes exactly that file from its em-dash scan with a documented rationale. `packages/starter/README.md` covers install, stylesheet import, bare usage, the slot-override pattern, icon usage (including the wrapper-only `#icon` caveat with its own code example), and customization guidance, and states the installable-dependency and wrapper-only-icon statements explicitly. `specs/components.md`'s `packages/starter/` row lists the complete finalized export set and the wizard/review/success paragraph, with no process-artifact references.

### Overall status: done

All twelve acceptance criteria pass with direct test evidence, independently reproduced. `pnpm run ci:test`/`ci:lint`/`ci:typecheck` are green across all three workspace packages, and `packages/starter`'s own coverage (99.61/96.75/96.55/99.61) meets or improves on every metric over ST-04's baseline with no drop anywhere else in the workspace. The three deviations (the `slotProps`-forwarding fix, the `Stepper` `dataTestid` wiring fix, and the wizard-page wrapper's test-selector attributes) were each verified directly against the ported source and, for deviation 1, against a live revert-and-rerun, and are genuine, narrowly-scoped bug fixes and testability additions, not scope creep or silent overrides of feature-level decisions. This story completes the package's full public API, README, and chrome; `FEAT-007` stays `in-progress` pending ST-06 and ST-07 (both currently `approved`, not yet implemented).

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field once it exists.
