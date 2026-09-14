---
id: ST-03
type: story
feature: FEAT-001
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Docs template migration to the framework-native choice mechanism

## Functional
### User story
As a docs reader learning the "pick first, then fill in" pattern from the published Client onboarding planner example, I want the example to use a documented, supported mechanism instead of a hand-rolled workaround, so that what I copy into my own template is the real, framework-native API rather than a hidden-field trick.

### Acceptance criteria

1. **`changeChoice` and the local ref are gone.**
   Given `docs/.vitepress/theme/components/AdvancedFormTemplate.vue`'s `Metadata` generic and `#heading-choice` slot,
   When the migration is complete,
   Then the userland `changeChoice` extended property is removed from the `Metadata` generic, and `ChoiceSectionCard` cards call the new `addChoiceOccurrence` slot prop directly instead of emitting a userland `select` event.

2. **The phantom hidden fields and per-branch clearing `computedProps` are gone.**
   Given `docs/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue`'s `launchApproach` choice metadata,
   When the migration is complete,
   Then `selectedLaunchApproach` (the local ref), the per-branch `computedProps` that force-clears the non-selected branch (`thisField.hide = true; thisValue.value = {}`), and the hidden phantom child field that faked a truthy value are all removed, replaced by `explicitChoiceSelection: true` on the `launchApproach` metadata node.

3. **The example starts unselected.**
   Given a fresh render of the Client onboarding planner's Launch approach step,
   When the page loads,
   Then no branch is pre-selected (unlike today's hard default to `selfServe`), matching the design baseline recorded in the feature spec's "Behavioral note carried into architecture" subsection.

4. **Visual output is pixel-identical to today's Launch approach step, once a branch is selected.**
   Given the migrated example with a branch selected and filled in,
   When compared against a screenshot of the pre-migration example in the same state,
   Then the rendered output is pixel-identical (selected card styling, revealed fields, error states). Verified by before/after Playwright screenshots attached to the story's implementation.

   > **ACCEPTED (research). PROPOSED (adversarial review) - reword to what is actually verifiable.** No pixel-diff tooling exists in the repo, so "pixel-identical" is untestable as an automated check. Rewrite AC 4 to: "Visual output is visually equivalent to today's Launch approach step once a branch is selected, verified by a close manual side-by-side comparison of before/after Playwright screenshots (same viewport, same data, both light and dark mode) attached to the story's implementation notes." This changes only the verification method, not the engineering goal (the output must still look the same); it does not relax the feature Design / seam-3 visual-fidelity intent.

5. **`removeNullValues` is demonstrated at submit time (ADR-3's documented cleanup).**
   Given the example's `handleSubmit` handler,
   When a user has switched `launchApproach` branches at least once before submitting,
   Then `handleSubmit` calls the already-exported `removeNullValues(values)` before using the submitted payload, demonstrating the documented cleanup for the accepted `undefined`-residue contract (ADR-3, option (a), reconfirmed by Jeroen during story prep).

6. **Nested `radiogroup` labelling and an accessible disabled reason (DECIDED nit 7).**
   Given the nested choice grid inside a repeatable choice occurrence (mirroring the prototype's `#choice-in-array` nested card) and any disabled add button in the migrated demo components,
   When inspected with an accessibility tree / screen reader,
   Then the nested choice grid carries `role="radiogroup"` and an `aria-label`, matching the top-level choice grids, and a disabled add button exposes its disabled reason via visible helper text or `aria-describedby` rather than only a `title` tooltip, per the DECIDED resolution routed to this slice.

   > **ACCEPTED (research). PROPOSED (adversarial review) - source-level primary, plus fix the top-level grid.** (a) The two states AC 6 inspects never render on this story's `maxOccurs: 1`, non-repeatable page (Out of scope forbids a repeatable demo; `launchApproach` never reaches a disabled add button), so verify the repeatable-ready `ChoiceSectionCard.vue` markup by source review; a live accessibility-tree check is optional and needs throwaway scaffolding, not part of this story's shipped surface. (b) The "matching the top-level choice grids" clause is not achievable against the current code: `ChoiceSectionCard.vue:41` carries `role="radiogroup"` but NO `aria-label` (verified across the whole components tree), so DECIDED nit 7's consistency goal requires this story to ALSO add an `aria-label` to the top-level grid at line 41, not only to the nested grid. Add that top-level `aria-label` to the a11y scope so nested and top-level are genuinely consistent.

### Edge cases
- A user who has entered data in one branch, switches to another, then back to the first: per ST-01's clear-on-switch baseline (preserve-on-switch is not wired into this example; that is ST-05's own opt-in demonstration if added), the first branch's data does not reappear, matching the current documented contract.
- The `#heading-choice` slot must still render correctly for a `launchApproach` choice with a `maxOccurs: 1` cardinality; this story does not need to add a repeatable demo to this particular example (the onboarding planner's `launchApproach` step stays `maxOccurs: 1`), but the shared `ChoiceSectionCard.vue` component gains the primitives so it is ready for a repeatable consumer.

### Out of scope
- Any repeatable (`maxOccurs > 1`) demo instance in this example; `launchApproach` stays a `maxOccurs: 1` choice (see feature scope). A repeatable demo, if any, belongs to the docs content story (ST-04) or a future example, not a rewrite of this one.
- Writing new narrative documentation content (`docs/examples/choices.md`); that is ST-04.
- Visual redesign of `ChoiceSectionCard`/`ChoiceCard` beyond what is needed to wire the new primitives (feature scope explicitly excludes this).

## Design reference
Feature prototype (`../../prototype.html`): `#onboarding-before-after` (the Launch approach step, today's workaround vs. the framework-native version, annotated pixel-identical output with the docs-impact callout). This story's a11y additions (AC 6) are a delta the design section flagged as accepted-but-deferred-to-this-slice (DECIDED nit 7): the prototype itself is reference material only and is not reworked.

## Architecture reference
Docs-only slice; touches no `packages/core/src/` file, so no changeset.

- **`docs/.vitepress/theme/components/ChoiceSectionCard.vue` (modified).** Stops reading a local `selectedOption` ref and stops emitting a userland `select`; drives selection through the new slot props received from `DynamicFormTemplate`'s `-choice` slot (`addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`, per ST-01/ST-02's `ChoiceAttributes`). Adds the nested-grid `radiogroup`/`aria-label` and the accessible disabled-reason (AC 6).
- **`docs/.vitepress/theme/components/AdvancedFormTemplate.vue` (modified).** `#heading-choice` slot wired to the new primitives; `Metadata` generic drops `changeChoice`.
- **`docs/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue` (modified).** Drops `selectedLaunchApproach`, the per-branch clear `computedProps`, and both phantom hidden children; sets `explicitChoiceSelection: true` on the `launchApproach` node; `handleSubmit` calls `removeNullValues`.

  > **ACCEPTED (research; rung 1, the story must demonstrate the behavior it ships; ST-05 may revise the copy again if it wires preserve-on-switch into this example). PROPOSED (adversarial review, finding 1) - update the step description to match clear-on-switch.** `FormExampleClientOnboardingPlanner.vue:319` currently reads `description: "Pick one. You can switch later if plans change - we'll keep the fields you've filled in."`, which promises preserve-on-switch. This story migrates to ST-01's clear-on-switch baseline (AC 3 / the first Edge case: switched-away data does not reappear; preserve-on-switch is ST-05, not wired here), so the copy would ship contradicting the demonstrated behavior. Rewrite the description to describe the actual behavior, e.g. `"Pick one. Switching later clears the fields you filled in for the previous option."`, and drop the em dash per CLAUDE.md. Add this string edit to this bullet's edit list.
- **Public API surface touched:** none (consumes ST-01's public surface; adds no new library export).
- **Dependencies:** ST-01 (the `explicitChoiceSelection` flag and the `maxOccurs: 1` primitives this example exercises). Also depends on ST-02 in the sense that `ChoiceSectionCard.vue` is a shared component: wiring it against the full `ChoiceAttributes`/`ChoiceItemAttributes` contract (rather than a `maxOccurs: 1`-only subset) means the component is ready for a repeatable consumer without a second rewrite, even though this story's own example instance stays `maxOccurs: 1`.
- **`specs/components.md`:** no change (docs-only, no library public surface added).

## QA plan

### Test strategy overview

This is a docs-only slice: no `packages/core/src/` file changes, no changeset, and no `packages/core` test file touched. `docs/.vitepress/theme/components` has no vitest setup at all (confirmed: no `docs/**/*.test.ts` file exists anywhere in the repo, and no `docs/vitest.config.*`), so none of `*.test.ts` / `*.logic.test.ts` / `*.validation.test.ts` / `*.analytics.test.ts` apply here; those conventions govern `packages/core/src/` only. Every acceptance criterion below is verified either by a deterministic source-code check (grep/read the diff) or by driving a running `pnpm docs:dev` instance with Playwright for screenshots and accessibility-tree snapshots, per CLAUDE.md's "Take screenshots" step. No new automated test file is added by this story. This story instead adds two artifacts to the PR: a before/after screenshot pair (AC 4) and, if feasible, an accessibility-tree snapshot (AC 6); both are pasted into the PR description / implementation notes, not committed as test fixtures.

### Fixtures / environment

- **Page under test:** `docs/examples/advanced.md` renders `FormExampleClientOnboardingPlannerContext.vue` -> `FormExampleClientOnboardingPlanner.vue`. Run `pnpm docs:dev` from the repo root, note the dev server's printed local URL (Vite default is `http://localhost:5173`, but the terminal output is authoritative since the port shifts if already in use), and navigate to `<base>/examples/advanced`. The "Launch approach" step is the 3rd wizard page (Company details -> Project contacts -> Launch approach, confirmed from the `metadata` children order in `FormExampleClientOnboardingPlanner.vue`).
- **Playwright:** Chromium at `/opt/pw-browsers/chromium`; the `playwright` package under `playgrounds/storybook/node_modules/playwright`. Launch with `args: ['--no-proxy-server']` for localhost, per CLAUDE.md. No Playwright config exists for `docs/`; use a one-off ad hoc script (not committed to the repo) requiring `playwright` from that path, matching the existing ad hoc screenshot pattern CLAUDE.md's "Before Every Push" step 4 already prescribes elsewhere.
- **Before-state source:** the pre-migration code (the commit/branch prior to this story's diff, e.g. `main` or the parent commit) for AC 4's "before" screenshot. Since this repo has no visual-regression tool (`pixelmatch`/`odiff`/`looks-same`/`resemblejs` -- confirmed absent from `pnpm-lock.yaml`), do not add one for a single comparison; see the AC 4 mapping below for the proposed rewrite of "pixel-identical".
- **Engine primitives consumed for real:** this story exercises ST-01/ST-02's shipped `addChoiceOccurrence` / `removeChoiceOccurrence` / `canAddChoiceOccurrence` / `activeChoiceOccurrences` through the actual `ChoiceSectionCard.vue` and `AdvancedFormTemplate.vue`, not `packages/core`'s `TestFormTemplate.vue` fixture. This story's own QA plan does not re-verify ST-01/ST-02's engine behaviour (occurrence math, clearing, budgets); that is guarded by ST-01/ST-02's own test suites. This story only verifies the docs consumption is wired correctly.
- **`removeNullValues`:** already exported from `packages/core/src/index.ts` (`packages/core/src/utils/removeNullValues.ts`), reused as-is, no change needed to it or its existing unit test.

### Acceptance criteria -> verification mapping

1. **`changeChoice` and the local ref are gone.**
   Manual, source-level (deterministic, not browser-based). `Grep` (or the shell equivalent) for `changeChoice` across `docs/.vitepress/theme/components/AdvancedFormTemplate.vue` and `docs/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue`: zero matches (currently at `AdvancedFormTemplate.vue:63,177` and `FormExampleClientOnboardingPlanner.vue:324`). Confirm `ChoiceSectionCard.vue`'s cards call `addChoiceOccurrence` directly (no `@select` emit reaching userland). Confirm `Metadata` generic (`AdvancedFormTemplate.vue`'s exported type) no longer declares `changeChoice?: (key: string) => void`.

2. **The phantom hidden fields and per-branch clearing `computedProps` are gone.**
   Manual, source-level. `Grep` `FormExampleClientOnboardingPlanner.vue` for `selectedLaunchApproach`: zero matches (currently declared at line 103 and read at lines 136, 143, 334, 346, 370, 382). Confirm the two per-branch `computedProps` blocks that do `thisField.hide = true; thisValue.value = {}` (currently lines 332-337 and 368-373) are removed. Confirm the two hidden phantom child fields (`hide: true` with a `computedProps` faking a truthy value, currently lines 340-349 and 377-386) are removed. Confirm `launchApproach`'s metadata node carries `explicitChoiceSelection: true`.

3. **The example starts unselected.**
   Browser + screenshot. On `pnpm docs:dev`, navigate to the Launch approach step on a fresh page load (no prior interaction, no restored form state -- clear any persisted storage first if the wizard persists step state). Assert visually: neither "Self-serve launch" nor "Guided rollout" card shows the selected-card styling (indigo border/ring/gradient, filled radio dot), and no branch's fields are rendered below the cards (dashed "Nothing selected yet" prompt or equivalent empty state per the feature's states policy). Screenshot attached as the "before selection" reference, doubling as the base frame for AC 4's before/after pair.

4. **Visual output is pixel-identical to today's Launch approach step, once a branch is selected.**
   **Flagged as written -- proposed rewrite, see "Untestable criteria" below.** As currently worded this requires a literal pixel-diff, but no pixel-diff tool exists in the repo and introducing one for a single comparison is disproportionate. Verification as planned: capture two Playwright screenshots at a fixed viewport (both light and dark mode, per the feature's dark-mode statement in the Design section), same data entered in the same fields ("Self-serve launch" selected, "Go-live date" and "Client-side owner" filled with the same values in both captures) -- one from the pre-migration code (checkout the base commit, run `docs:dev`, screenshot, `git checkout` back), one from the migrated code. Do a close manual side-by-side visual comparison (card styling, spacing, colors, revealed-field layout, any error states triggered the same way in both). Attach both screenshots plus a short written confirmation of equivalence to the story's implementation notes. This is "visually equivalent by manual inspection", not an automated pixel-exact guarantee.

5. **`removeNullValues` is demonstrated at submit time.**
   Two parts, because the obvious live-page signal is unreliable:
   - **Primary (source-level, deterministic):** confirm `FormExampleClientOnboardingPlanner.vue`'s `handleSubmit` callback (currently `handleSubmit((values) => { submitted.value = values; ... })`, lines 200-204) calls `removeNullValues(values)` and uses its return value (not the raw `values` parameter) before assigning to `submitted.value`, and that `removeNullValues` is imported from `@bach.software/vue-dynamic-form`.
   - **Live-page check, with a documented pitfall:** the page's own "View submitted JSON" panel (`SubmissionSuccess.vue`'s `submittedJson` prop, bound as `JSON.stringify(submitted, null, 2)`) is **not** a reliable check on its own: `JSON.stringify` silently drops `undefined`-valued object keys regardless of whether `removeNullValues` ran, so a deselected branch's residue key (per ADR-3's accepted contract, `launchApproach: { selfServe: undefined }`) would already render as absent from that JSON view even without the fix. Do not treat "the View JSON panel looks clean" as proof of AC 5. Instead: switch `launchApproach` from Self-serve to Guided rollout at least once (filling in Self-serve's fields first, per the AC's "switched branches at least once" precondition), submit, then inspect the **live JS object**, not its JSON-stringified rendering -- either via the Vue DevTools browser extension (inspect the `submitted` ref's actual value) or a temporary `console.log(submitted.value)` added during manual verification (not committed) -- and confirm the `selfServe` key is fully absent from `values.launchApproach`, not merely `undefined`-valued. This is the only way to distinguish "the residue was pruned" from "the residue is merely invisible in this particular JSON view".

6. **Nested `radiogroup` labelling and an accessible disabled reason (DECIDED nit 7).**
   **Flagged as written -- see "Untestable criteria" below.** Two sub-parts, both currently unreachable on the live page this story ships:
   - **Nested choice grid inside a repeatable choice occurrence:** this story's own scope explicitly excludes adding any `maxOccurs > 1` demo instance to `FormExampleClientOnboardingPlanner.vue` (Out of scope, "Any repeatable... demo instance in this example"), so no nested-choice-in-array-occurrence state ever renders on the shipped `/examples/advanced` page for this story. AC 6 asks to verify markup that has no live surface in this story's own deliverable.
   - **Disabled add button:** similarly, `launchApproach` stays `maxOccurs: 1` with two branches and no per-branch budget to exhaust (per ST-01 AC 7, `canAddChoiceOccurrence` for `maxOccurs: 1` is only ever `false` when the whole choice is disabled, which this example never does), so a disabled add-button state also never renders live in this story.
   - **Verification as planned (source-level, primary and required):** read the diff to `ChoiceSectionCard.vue` and confirm the nested choice grid markup carries `role="radiogroup"` and a non-empty `aria-label` (matching the top-level grid's existing pattern at line 41 of the current file), and confirm the disabled add-button markup exposes its reason via visible helper text or `aria-describedby` rather than only `title`. These are static template attributes; their presence is verifiable by reading the rendered template without needing the state to actually trigger live.

     > **ACCEPTED (research; factual correction verified against ChoiceSectionCard.vue:41, serves DECIDED nit 7). PROPOSED (adversarial review, finding 2) - correct the factual premise.** The parenthetical "matching the top-level grid's existing pattern at line 41" is inaccurate: `ChoiceSectionCard.vue:41` carries `role="radiogroup"` but NO `aria-label` (verified across the whole `docs/.vitepress/theme/components` tree). There is no existing top-level `aria-label` to match, so DECIDED nit 7's "nested matches top-level" consistency goal requires this story to also add an `aria-label` to the top-level grid at line 41. Update this mapping to: confirm the nested grid carries `role="radiogroup"` and a non-empty `aria-label`, AND confirm an `aria-label` was added to the top-level grid at line 41 (it has only `role` today), so nested and top-level are genuinely consistent.
   - **Optional supplementary check, not gating:** if the developer or verifier wants a live accessibility-tree confirmation (`locator.ariaSnapshot()`, stable in the installed Playwright `1.54.2`) rather than only a source read, build a small throwaway local harness (e.g. a scratch `.vue` file mounted via Vite's dev server, or a temporary local-only docs page, deleted before commit) that renders `ChoiceSectionCard` with a mocked `activeChoiceOccurrences` list (>1 entry, to force the nested-grid layout) and a mocked `canAddChoiceOccurrence` returning `false` (to force the disabled button). This is optional because it requires throwaway scaffolding with no reuse value; flagged to the reviewer rather than mandated.

### Edge cases (from the story spec)

- **Switch away and back, data does not reappear:** manual, browser. Select Self-serve, fill in a value, switch to Guided rollout, switch back to Self-serve; assert the previously entered value is gone (empty field), matching ST-01's clear-on-switch baseline this story inherits unchanged (preserve-on-switch is ST-05, not wired here).
- **`#heading-choice` slot still renders correctly at `maxOccurs: 1`:** covered implicitly by AC 3/4/5 above; no separate check needed since every other verification step exercises this slot at `maxOccurs: 1`.

### Out-of-scope confirmation

- No repeatable (`maxOccurs > 1`) instance added to this example: confirmed by reading the final `launchApproach` metadata node's `maxOccurs` (absent/1) alongside AC 1/2's source check.
- `docs/examples/choices.md` untouched: confirmed by `git diff` showing no change to that file (ST-04's responsibility).
- No visual redesign of `ChoiceSectionCard`/`ChoiceCard` beyond primitive wiring and the AC 6 a11y attributes: confirmed by reading the diff for unrelated styling/class changes; flag any found as scope creep.

### States policy (this slice)

Per the feature's states policy, applied to what this slice's live page actually renders:

- **Empty / unselected:** AC 3 (dashed prompt / no branch fields on fresh load). The only state this story can newly demonstrate live, since the workaround always hard-defaulted to `selfServe` (Behavioral note carried into architecture).
- **Selected / active:** AC 4 (Self-serve selected, fields revealed and filled) and AC 5's Guided-rollout switch.
- **Disabled:** not reachable live in this story (see AC 6's flag); source-reviewed only.
- **Loading:** N/A, unchanged from the feature's states policy (selection is synchronous; this story adds no async behaviour).
- **Error:** not explicitly re-verified by this story. `xsd_choiceMinOccurs`'s error-on-header behaviour for `launchApproach` (required-but-unselected) is ST-01's own validation-test territory (`DynamicFormItemChoice.validation.test.ts`), not re-tested here; if the QA verifier wants a live confirmation, attempt to advance the wizard past "Launch approach" with nothing selected and confirm the section header shows an error, but this is a nice-to-have, not a gating check for this story's acceptance criteria (none of AC 1-6 mention the error state).
- **Field validation inside a branch (pristine / invalid / valid):** inherited unchanged from existing per-field templates (`FormField.vue`/`ChoiceField.vue`), not re-tested here.

### Reactivity

N/A. This story adds no new `computedProps`, no new `DynamicFormItemChoice`/`DynamicFormItem` wiring, and no engine code; it only removes userland `computedProps` (the two clearing blocks and the phantom-field fakers) and consumes ST-01/ST-02's already-tested primitives through markup. Render-count/reactivity coverage for the underlying primitives (`addChoiceOccurrence`'s single-recompute guarantee, etc.) is ST-01/ST-02's `*.analytics.test.ts` responsibility and stays valid; this story does not touch `DynamicFormItemChoice.vue` at all.

### Coverage

N/A for `pnpm -r ci:test:coverage`: this story touches no file under `packages/core/src/`, so the coverage baseline is structurally unaffected. `docs/.vitepress/theme/components/*.vue` files are not instrumented by that coverage run (confirmed: no `docs/vitest.config.*` exists, and the root `ci:test:coverage` script is `pnpm -r ci:test:coverage`, scoped to workspace packages under `packages/*` per `pnpm-workspace.yaml`; `docs/` is excluded from the workspace). No code in this story's diff is "knowingly left uncovered" by an automated suite because no automated suite covers `docs/` at all today; that gap is pre-existing and out of scope to fix here.

### Time sensitivity

N/A. No date-defaulting or `new Date()`/`Date.now()` logic exists in `FormExampleClientOnboardingPlanner.vue` (confirmed by search); the date fields (`goLiveDate`, `migrationDeadline`, `kickoffDate`) are plain user-entered inputs with no "today" default, so screenshots are stable regardless of when they are taken and regardless of `TZ`.

### Regression risk

- **`ChoiceSectionCard.vue`** is a shared component (per the feature architecture, "wiring it against the full `ChoiceAttributes`/`ChoiceItemAttributes` contract... means the component is ready for a repeatable consumer without a second rewrite"). It is currently consumed only by `AdvancedFormTemplate.vue`'s `#heading-choice` slot; a `Grep` for other consumers confirms no other docs example uses it, so this story's rewrite has a single call site to regression-check (AC 1-5 above cover it).
- **`AdvancedFormTemplate.vue`'s `Metadata` generic** loses `changeChoice`. `Grep` the whole `docs/` tree for `changeChoice` after the change (not just the two files named in AC 1) to catch any other consumer of that generic that might still reference it; none is expected (`FormExampleClientOnboardingPlanner.vue` is documented as the only example using `AdvancedFormTemplate`'s choice slot with `changeChoice`), but this is a one-command check worth doing rather than assuming.
- **`FormExampleChoiceFields.vue` (`docs/examples/basic.md` or equivalent) is a confirmed second consumer of `#heading-choice` / `ChoiceSectionCard.vue`, in **auto mode**.** Verified by reading the file: its `payment` field is `type: 'heading'` with a non-empty `choice`, no `choiceShowChoiceSelect`, and no `explicitChoiceSelection`, so it resolves to the same `#heading-choice` slot this story rewrites, but exercises the path where `ChoiceSectionCard`'s `options` prop is `undefined` (`options?.length` false -> no card grid renders, only `<slot :selectedOption />`, today's plain value-driven auto behaviour). The `ChoiceSectionCard.vue` rewrite must keep this no-options / auto-mode path working unchanged, since this story's own onboarding-planner rewrite only exercises the *with-options, explicit-mode* path. This is a real, confirmed regression risk, not a hypothetical one: screenshot `FormExampleChoiceFields.vue`'s rendered choice before and after this story's `ChoiceSectionCard.vue` change and confirm it is visually unchanged (no card grid appears, the two branches -- Card, Bank transfer -- still render inline as today).
- **Other stories of this feature:** ST-01/ST-02 own the engine behaviour this story only consumes; a regression in `addChoiceOccurrence`/`removeChoiceOccurrence`/`canAddChoiceOccurrence`/`activeChoiceOccurrences` would surface here as a visual/behavioural break on the live page, but the root-cause fix belongs in ST-01/ST-02's own suites, not a new docs test. ST-04 (docs content) depends on this story's `ChoiceSectionCard.vue` shape for any narrative screenshots or code snippets it embeds later; if this story changes prop names again after ST-04 starts, that is a cross-story coordination risk, not something this QA plan can guard automatically.

### Manual verification checklist

1. `pnpm docs:dev`, navigate to `/examples/advanced`, reach the "Launch approach" wizard step on a fresh page load. Confirm AC 3 (nothing pre-selected).
2. Select "Self-serve launch", fill "Go-live date" and "Client-side owner", screenshot (light and dark mode, using the site's existing dark-mode toggle). This is the "after" half of AC 4; pair it with a "before" screenshot captured the same way from the pre-migration commit.
3. Switch to "Guided rollout", confirm Self-serve's fields are gone and not pre-filled if switched back to (edge case above).
4. Fill Guided rollout's fields, submit the wizard through to the end, open the confirmation screen, click "View submitted JSON" -- note per AC 5's mapping that this view alone is not proof; follow up with the Vue DevTools / temporary `console.log` check described there.
5. Read the diff for AC 1, 2, 6's source-level checks (grep-based, listed above); no browser needed for these.
6. Run `pnpm docs:build` locally (required by CLAUDE.md whenever `docs/` content changes) and confirm the VitePress site compiles with no errors before relying on the Cloudflare Pages preview.
7. Once a PR exists, check the Cloudflare Pages preview URL (posted by the `cloudflare-workers-and-pages` bot) and repeat step 1-3 there as a final sanity check in a production-like build, per CLAUDE.md step 5.
8. Screenshot `FormExampleChoiceFields.vue`'s rendered "Payment method" choice before and after this story's `ChoiceSectionCard.vue` change; confirm it still renders in plain auto-mode (no card grid, both branches inline) with no visual drift (regression risk above -- this is a confirmed second consumer, not a hypothetical one).

### Untestable criteria -- flagged, with rewrite proposals

- **AC 4, "pixel-identical":** as literally worded this demands an automated pixel-exact diff; no such tooling exists in the repo (`pixelmatch`/`odiff`/`looks-same`/`resemblejs` all absent) and adding one for a single before/after comparison is disproportionate for a docs-only slice. **Proposed rewording:** "Visual output is visually equivalent to today's Launch approach step once a branch is selected, confirmed by manual side-by-side comparison of before/after Playwright screenshots (same viewport, same data, light and dark mode) attached to the story's implementation notes." Verification plan above already follows the proposed wording; flagging so the story text can be updated to match rather than silently diverging from what "pixel-identical" implies.
- **AC 6, both sub-clauses:** as written this asks to inspect live-rendered states (a nested choice grid inside a repeatable occurrence, and a disabled add button) that this story's own scope guarantees never render on the page it ships (no repeatable demo instance is added, per Out of scope, and `launchApproach` never reaches a disabled-add-button state at `maxOccurs: 1` with no per-branch budget). **Proposed rewording:** "The `ChoiceSectionCard.vue` markup for the nested choice grid carries `role="radiogroup"` and an `aria-label`, and its disabled add-button markup exposes the disabled reason via visible helper text or `aria-describedby` rather than only `title`, verified by source review of the component (these states are not reachable on this story's own `maxOccurs: 1`, non-repeatable example page; a live accessibility-tree confirmation is optional and requires a throwaway local harness, not part of this story's shipped surface)." This keeps the requirement (the markup must be correct) while being honest that this story cannot demonstrate it live on its own page. If a live accessibility-tree check is wanted as a hard gate rather than optional, that needs either ST-03 to add a minimal repeatable/disabled demo instance (which Out of scope currently forbids) or routing the live check to ST-02/ST-04 where a repeatable instance actually exists; flagged to the reviewer as a scope tension between AC 6 and the Out of scope section, not resolved unilaterally here.

### Flags for reviewer

- The two proposed rewrites above (AC 4, AC 6) change what "done" means for this story from a literal reading of the current text to what is actually verifiable given this story's own scope boundaries. Neither changes the underlying engineering work (no new code is implied by either rewrite); both only correct the verification method described in the acceptance criteria. Recommend Jeroen or the adversarial reviewer confirm these rewrites before implementation, since AC 6 in particular has a real tension with the Out of scope section as currently written (it asks to verify a state that scope says this story must not render).
- AC 5's live-page pitfall (the "View submitted JSON" panel using `JSON.stringify`, which hides `undefined`-valued keys regardless of whether `removeNullValues` ran) is worth a note in the implementation notes or a code comment near `handleSubmit`, so a future contributor does not mistake "the JSON view looks clean" for proof that the fix works, and does not accidentally revert the `removeNullValues` call while the JSON view keeps looking correct.
- No automated regression suite exists for `docs/`; every check in this plan is either a one-time grep/read or a one-time manual browser pass. If this class of docs-migration story becomes more frequent, a lightweight Playwright test harness for `docs/` (even without a full visual-regression tool) would remove the current total reliance on manual verification, but introducing that is out of scope for a single story and not proposed here.

## Adversarial review

Ran in STORY (lite) mode, blockers-first, against the installed docs code (`FormExampleClientOnboardingPlanner.vue`, `AdvancedFormTemplate.vue`, `ChoiceSectionCard.vue`, `FormExampleChoiceFields.vue`), `packages/core/src/index.ts`, and every binding DECIDED entry the task named (finding 1 option (a) residue + `removeNullValues`, ADR-3, DECIDED nit 7, the feature Design/Architecture). Verified line numbers and factual claims against the code rather than reasoning about them. Dependencies on ST-01 and ST-02 are explicit and consistent with the feature stories table.

**Verified correct (so discussion does not re-litigate):**

- Every source-level line reference in AC 1, 2, 5 is accurate against the current files: `changeChoice` at `AdvancedFormTemplate.vue:63,177` and `FormExampleClientOnboardingPlanner.vue:324`; `selectedLaunchApproach` declared at `:103` and read at `:136,143,334,346,370,382`; the per-branch clearing `computedProps` at `:332-337` / `:368-373`; the phantom hidden children at `:340-349` / `:377-386`; `handleSubmit` at `:200-206`.
- `removeNullValues` is genuinely exported (`packages/core/src/index.ts:26`, `export * from '@/utils/removeNullValues'`), so AC 5's "already-exported" premise holds.
- `FormExampleChoiceFields.vue` is a real second consumer of the `#heading-choice` slot / `ChoiceSectionCard.vue` in auto mode (`payment`, `type: 'heading'`, non-empty `choice`, no `choiceShowChoiceSelect`, no `explicitChoiceSelection`), so the QA plan's regression-risk callout is accurate, not hypothetical.
- No pixel-diff tool (`pixelmatch`/`odiff`/`looks-same`/`resemblejs`) exists in the repo, so AC 4's literal "pixel-identical" is genuinely untestable as an automated check.

**Rulings on the three flagged items:**

1. **AC 4 "pixel-identical" -> "visually equivalent via manual side-by-side": ACCEPTED.** No pixel-diff tooling exists and adding one for a single before/after comparison is disproportionate for a docs-only slice. The reword changes only the verification method, not the engineering goal (the rendered output must still look the same once a branch is selected), so it does not contradict the feature Design/seam-3 "pixel-identical" intent. Routed as a `PROPOSED` edit on the AC 4 text so the shipped criterion matches what is actually verified.
2. **AC 6 live-state tension -> source-level verification primary, live ariaSnapshot optional: ACCEPTED, with a correction (see finding 2).** The story's Out-of-scope forbids a repeatable demo and `launchApproach` at `maxOccurs: 1` never disables an add button, so the two states AC 6 asks to inspect never render on the page this story ships; source review of the repeatable-ready `ChoiceSectionCard.vue` markup (added to make it repeatable-consumer-ready, per the architecture) is the correct primary check. Routed as a `PROPOSED` edit on the AC 6 text.
3. **AC 5 live-verification limit (JSON.stringify hides `undefined` either way), source-level primary: ACCEPTED.** `JSON.stringify` drops `undefined`-valued keys regardless of whether `removeNullValues` ran, so the "View submitted JSON" panel cannot distinguish pruned from residue; confirming `handleSubmit` calls `removeNullValues(values)` and uses its return value is the reliable, deterministic check. Sound as the QA plan describes it.

**Findings:**

1. **[should-fix] The migrated example ships copy that contradicts its own shipped clear-on-switch behavior.** `FormExampleClientOnboardingPlanner.vue:319` sets the Launch approach step's `description` to `"Pick one. You can switch later if plans change - we'll keep the fields you've filled in."` (em dash in the original). This story migrates the example to ST-01's clear-on-switch baseline (AC 3 / the first Edge case both state the switched-away branch's data does NOT reappear; preserve-on-switch is ST-05, explicitly not wired here). So after migration the copy promises preserve-on-switch while the shipped example clears. The story's edit list (Architecture reference, `FormExampleClientOnboardingPlanner.vue` bullet) does not mention updating this string. For a docs story whose entire stated purpose is that "what I copy is the real, framework-native API", shipping a description that lies about the behavior undermines the deliverable. Suggested resolution: rewrite the `description` to describe clear-on-switch (and drop the em dash, per CLAUDE.md). Routed as a `PROPOSED` edit on the Architecture reference bullet. RESOLVED: accepted, DECIDED (research).

2. **[should-fix] The QA plan's AC 6 mapping misstates the current top-level grid markup, and the "match the top-level grids" a11y goal is not actually achievable against the real code.** AC 6's mapping (QA plan, "matching the top-level grid's existing pattern at line 41 of the current file") and AC 6 itself ("matching the top-level choice grids") assume the top-level choice grid already carries `role="radiogroup"` and an `aria-label`. Verified against the code: `ChoiceSectionCard.vue:41` carries `role="radiogroup"` but NO `aria-label` (confirmed by grepping the whole `docs/.vitepress/theme/components` tree: the only `aria-label`s live in `PasswordInput.vue`, `Stepper.vue`, `RepeaterCard.vue`, `ToggleSwitch.vue`, never on the choice grid). So there is no existing top-level `aria-label` pattern for the nested grid to "match"; DECIDED nit 7's consistency goal ("nested matches top-level") requires the story to ALSO add an `aria-label` to the top-level grid at line 41, not only the nested one. As written, an implementer following the mapping would look for a pattern that is not there. Suggested resolution: correct the mapping's factual claim and add the top-level `aria-label` to the story's a11y scope. Routed as a `PROPOSED` edit on QA mapping item 6. RESOLVED: accepted, DECIDED (research).

3. **[nit] The `launchApproach` description em dash will re-enter the diff if the copy is touched.** Independent of finding 1, `FormExampleClientOnboardingPlanner.vue:319` contains an em dash, which CLAUDE.md forbids in any text the agent writes. Whoever edits that line for finding 1 must replace it with a comma/colon/parentheses rather than preserving it.

No blocker. Both should-fixes are routed as `PROPOSED (adversarial review)` edits; nits do not gate. Status set to `awaiting-approval`.

## Implementation notes
Filled by developer during implementation.

## Verification report
Filled by qa-verifier after implementation.
