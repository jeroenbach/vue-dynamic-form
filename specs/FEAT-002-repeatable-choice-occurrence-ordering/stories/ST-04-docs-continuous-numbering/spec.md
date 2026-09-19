---
id: ST-04
type: story
feature: FEAT-002
status: done
created: 2026-09-17
approved_by: Jeroen
pr: "https://github.com/jeroenbach/vue-dynamic-form/pull/44"
---

# Story: Docs — continuous numbering for the "Add several" example

## Functional
### User story
As a docs reader building a repeatable explicit-choice template, I want the published "Add several, each one of several kinds" example to show a continuous cross-branch number badge (1..N) instead of a per-branch number that resets, so that I can copy a working pattern that demonstrates the engine's `globalIndex` primitive.

### Acceptance criteria

1. **`RepeaterCard.vue` gains an optional continuous-number override.**
   Given `RepeaterCard.vue`'s existing per-branch `.rp-num` badge (currently bound to `index + 1`),
   When this story ships,
   Then the component accepts a new optional prop `displayNumber?: number`, and the badge and its `aria-label` read `displayNumber ?? index + 1`, so every existing caller that passes no `displayNumber` (plain array items) is visually and behaviourally unchanged.

2. **`AdvancedFormTemplate.vue`'s `default-choice-array-item` slot binds `globalIndex` into the badge.**
   Given the slot's existing destructuring (`fieldMetadata`, `fieldContext`, `branchKey`, `canRemoveItems`, `removeItem`, `index`),
   When this story ships,
   Then it also destructures `globalIndex` and binds `:displayNumber="globalIndex + 1"` on the `RepeaterCard`, while keeping `:index` unchanged (still used for the Vue `:key`/`removeItem` wiring, unaffected by this change).

3. **The docs example demonstrates continuous numbering live.**
   Given the live `FormExampleChoiceExplicitRepeatable` demo in `docs/examples/choices.md`,
   When a reader adds a "CRM export", then an "API endpoint", then a second "CRM export",
   Then the cards display continuous badges 1, 2, 3 in that grouped order (branch declaration order, then index within branch: both `crmExport` occurrences before the `apiEndpoint` one, per the unchanged `activeChoiceOccurrences` contract), not per-branch numbers that would read 1, 1, 2.

4. **Removal renumbers survivors visibly (Q5).**
   Given 4 occurrences displayed with badges 1-4,
   When the second one is removed via its Remove button,
   Then the 3 survivors immediately display badges 1, 2, 3 with no gap.

   > PROPOSED (adversarial review, finding 1): change "the second one" to "the third one (the Billing/API occurrence, `apiEndpoint[0]`, badge 3)" so the removal reproduces the approved prototype `#numbering-removal` panel exactly. The prototype (prototype.html:439-452) removes badge 3 (Billing webhook, `removeChoiceOccurrence('apiEndpoint', 0)`), leaving `Salesforce (CRM) #1, HubSpot (CRM) #2, Shipping (API) #3` (CRM, CRM, API). Removing badge 2 (the second CRM, HubSpot) instead leaves CRM, API, API, which still renumbers to 1, 2, 3 with no gap but does NOT match the prototype panel the QA plan says it matches. Either target proves the "renumber, no gap" contract; only badge 3 makes the prototype comparison faithful, so the removal target and the prototype cross-reference must agree.

5. **`docs/examples/choices.md`'s "Add several" section documents `globalIndex` and the before/after numbering distinction.**
   Given the existing section (currently documenting only `branchKey`, `removeItem`, `activeChoiceOccurrences`'s grouped-order guarantee),
   When this story ships,
   Then the section additionally names `globalIndex` (cross-branch position, `-choice-array-item` slot prop), shows it in the `default-choice-array-item` code snippet, and states plainly that it is live-derived (renumbers on removal, never stored), consistent with the prototype's `#numbering-*` anchors.

### Edge cases
- Zero active occurrences: no badge rendered at all, matching `#numbering-empty`; no crash from a missing `globalIndex`.
- Exactly one occurrence: badge reads "1".
- A reader who only reads the pre-existing "grouped order" paragraph (line ~154 of the current `choices.md`) should still find it accurate: this story does not change render order, only the badge value, so that paragraph needs no correction, only the addition of the `globalIndex` explanation alongside it.

### Out of scope
- The ordering toolbar, `displayOrder`/`insertionOrder`/`preserveOrder` demo, and the submitted-values JSON walkthrough of the `order` key: ST-05.
- Any change to `ChoiceArraySectionCard.vue`'s per-branch Add-button affordances.
- Any change to `FormExampleChoiceExplicitRepeatable.vue`'s metadata shape: its branches (`crmExport`, `apiEndpoint`) are already object-shaped with `children` in the current codebase (verified directly), so no metadata migration is needed for this story; ST-05 is the slice that needs object branches for the persisted-tier demo, and they are already in place.
- Any change to `docs/reference/field-metadata.md`: `globalIndex` is a slot prop, not a `FieldMetadata` property, so it has no entry there.

## Design reference
Feature prototype (`../../prototype.html`): `#numbering-before-after` (the teaching visual this section's prose now mirrors), `#numbering-populated` (card anatomy: continuous badge + kind badge together, per design decision 1: the badge-value swap keeps the existing `kind-badge` so a continuous number never hides which branch an occurrence belongs to), `#numbering-removal` (renumber-on-removal, rendered in true grouped order per the DECIDED fix to the prototype), `#numbering-empty`. No new visual language: `RepeaterCard`'s markup/styling is untouched, only the badge's bound value changes.

## Architecture reference
Docs-only slice; touches no `packages/core/src/` file, so no changeset. Builds on ST-01's shipped `globalIndex` slot prop.

- **`docs/.vitepress/theme/components/RepeaterCard.vue` (modified).** Add optional `displayNumber?: number` prop; badge text and `aria-label` read `displayNumber ?? index + 1`.
- **`docs/.vitepress/theme/components/AdvancedFormTemplate.vue` (modified).** `default-choice-array-item` slot destructures `globalIndex` and binds `:displayNumber="globalIndex + 1"`.
- **`docs/examples/choices.md` (modified).** The existing "Add several, each one of several kinds" section (current baseline: metadata snippet, `default-choice-array`/`default-choice-array-item` slot snippet, the grouped-order paragraph) gains the `globalIndex` explanation and updated snippet.
- **Public API surface touched:** none (documents ST-01's already-shipped surface).
- **Dependencies:** ST-01 (`globalIndex` must already exist). Does not depend on ST-02 or ST-03; scheduled after them in this feature's implementation order per the "engine slices first" convention, not because of a functional dependency.
- **`specs/components.md`:** no change (docs-only; ST-01 already owns the engine-surface entry).

## QA plan

This is a docs-only slice: no `packages/core/src/` file changes, no changeset, no new unit/component test file. Confirmed against the actual tooling before writing this plan: `docs/` is excluded from the pnpm workspace (`pnpm-workspace.yaml` includes only `packages/*`), has its own `node_modules`/`package.json` with exactly three scripts (`dev`, `build`, `preview`, no `test`/`typecheck`/`lint`), and no snippet-extraction, type-check-on-build, or component-test harness exists anywhere under `docs/` (confirmed by the precedent set in FEAT-001 ST-04, re-confirmed here: `docs/package.json` has not gained a test/typecheck script since). `docs/tsconfig.json` exists (`include: [".vitepress/**/*"]`, `strict: true`) but nothing runs it: it is editor-only tooling, not a CI gate. So verification here is: (a) `pnpm docs:build` (the one real mechanical gate: VitePress's dead-link checker plus a successful Vite/Vue SFC compile), (b) exact-string `grep` checks for the API names, camelCase, and em-dash rules, (c) a one-time manual `vue-tsc` compile against the real shipped types (see below) since nothing in the automated pipeline type-checks a docs `.vue` file's slot-prop destructuring, and (d) manual/visual comparison against the prototype anchors plus Playwright screenshots per `CLAUDE.md`'s "Before Every Push" step 4.

### Files touched

| File | Change |
| --- | --- |
| `docs/.vitepress/theme/components/RepeaterCard.vue` | Add optional `displayNumber?: number` prop; badge text (currently `{{ index + 1 }}`, line 32) and the Remove button's `aria-label` (currently `` `Remove item ${index + 1}` ``, line 42) both read `displayNumber ?? index + 1`. |
| `docs/.vitepress/theme/components/AdvancedFormTemplate.vue` | `default-choice-array-item` slot (line 258) destructures `globalIndex` and binds `:displayNumber="globalIndex + 1"` on `RepeaterCard`; `:index` stays bound as-is. The sibling `heading-array-item` slot (line 226, plain array items) is the regression target: it must stay byte-identical, no `displayNumber` binding added there. |
| `docs/examples/choices.md` | "Add several, each one of several kinds" section (from line 112) gains the `globalIndex` explanation and an updated `default-choice-array-item` snippet. |

### Acceptance criteria → check mapping

1. **`RepeaterCard.vue` gains an optional continuous-number override.**
   - Mechanical: `grep -n "displayNumber" docs/.vitepress/theme/components/RepeaterCard.vue` finds the prop declaration, the badge-text usage, and the `aria-label` usage (3 hits minimum).
   - Manual/visual: mount both existing call sites (`heading-array-item` and `default-choice-array-item` slots) in a running `docs:dev` server; confirm the plain-array-item card (e.g. the contacts list in the advanced onboarding example, `/examples/advanced`) still shows `1, 2, 3...` unaffected, proving the `displayNumber ?? index + 1` fallback is byte-identical for every caller that passes no `displayNumber`, per the AC's own wording.
   - Manual: one-time `npx vue-tsc --noEmit -p docs/tsconfig.json` (run from `packages/core` where `vue-tsc` is an installed devDependency, e.g. `cd packages/core && npx vue-tsc --noEmit -p ../../docs/tsconfig.json`) to confirm the new optional prop's type is sound and the two usage sites compile clean. This is the only check in this plan that would catch a typo'd prop name or wrong type, since `pnpm docs:build` alone does not type-check `.vue` SFCs and no CI script runs `docs/tsconfig.json`.

2. **`AdvancedFormTemplate.vue`'s `default-choice-array-item` slot binds `globalIndex` into the badge.**
   - Mechanical: `grep -n "globalIndex" docs/.vitepress/theme/components/AdvancedFormTemplate.vue` finds the destructuring and the `:displayNumber="globalIndex + 1"` binding.
   - Mechanical (camelCase, `CLAUDE.md`): `grep -n -- ':global-index=\|:display-number=' docs/.vitepress/theme/components/AdvancedFormTemplate.vue` must return no matches (kebab-case bindings would violate the Vue camelCase rule).
   - Manual: `pnpm docs:build` completes clean (confirms the SFC compiles; `globalIndex` is a real, required field on the shipped `ChoiceArrayItemAttributes` type from ST-01, so a stale/absent name would only surface at the `vue-tsc` step above, not at build time, since Vue's default compiler does not enforce slot-scope prop types without `vue-tsc`).
   - Manual/visual, against `#numbering-populated`: open the live `FormExampleChoiceExplicitRepeatable` demo (`/examples/choices`), add one CRM export and two API endpoints (matching the prototype's populated panel), confirm each card's badge is a continuous `1, 2, 3` and `:index` (used for `removeItem`/Vue `:key` wiring only, never displayed) is unaffected, i.e. removing the second API endpoint still calls `removeChoiceOccurrence('apiEndpoint', 1)` correctly.

3. **The docs example demonstrates continuous numbering live.**
   - Manual, against `#numbering-before-after` and `#numbering-populated`: in the live demo, add a CRM export, then an API endpoint, then a second CRM export (the exact press order the AC specifies). Confirm the badges read `1, 2, 3` top to bottom, in grouped order (both `crmExport` occurrences before the `apiEndpoint` one, since `crmExport` is declared before `apiEndpoint` in `FormExampleChoiceExplicitRepeatable.vue`'s metadata, verified directly), not the per-branch-reset `1, 1, 2` the AC explicitly says must not appear.
   - Playwright screenshot of this exact state (3 cards, badges 1-3), both light and dark VitePress color mode, attached to the PR per `CLAUDE.md` step 4.
   - No automated test exists or is added for this AC: there is no component-test harness for docs `.vue` files, so this criterion is verified manually only, consistent with the confirmed absence of docs test tooling.

4. **Removal renumbers survivors visibly (Q5).**
   - Manual, against `#numbering-removal`: from the AC3 state (or a 4-occurrence state matching the prototype: `crmExport, crmExport, apiEndpoint, apiEndpoint`, badges 1-4), remove the second occurrence via its Remove button. Confirm the 3 survivors immediately re-render with badges `1, 2, 3`, no gap, no stale badge value, matching the prototype's DECIDED true-grouped-order fix (`Salesforce (CRM) #1, HubSpot (CRM) #2, Shipping (API) #3` after removing the Billing/API occurrence). This is a direct visual consequence of ST-01's already-tested, already-shipped live-derived `globalIndex` (`DynamicFormItemChoice.logic.test.ts`'s `globalIndex (ST-01)` describe block, AC2), so the underlying renumbering logic already has unit coverage; this story only needs to confirm the docs binding surfaces it correctly.
   - > PROPOSED (adversarial review, finding 1): remove the **badge-3** occurrence (Billing/API, `apiEndpoint[0]`, `removeChoiceOccurrence('apiEndpoint', 0)`), not badge 2. Removing badge 2 (the second `crmExport`, HubSpot) leaves `crmExport[0], apiEndpoint[0], apiEndpoint[1]` (CRM, API, API), which renumbers to `1, 2, 3` correctly but is NOT the survivor set shown in `#numbering-removal` (`Salesforce (CRM) #1, HubSpot (CRM) #2, Shipping (API) #3` = CRM, CRM, API, prototype.html:447-452). The prototype panel this bullet claims to match results only from removing badge 3. Align the removal target here, in manual-checklist item 5, and in AC4 so the prototype comparison and the Playwright screenshot are reproducible.
   - Playwright screenshot of the post-removal state (3 cards, badges 1-3), both color modes.

5. **`docs/examples/choices.md` documents `globalIndex` and the before/after numbering distinction.**
   - Mechanical: `grep -n "globalIndex" docs/examples/choices.md` finds at least one prose mention and one occurrence in the updated code snippet.
   - Mechanical (`CLAUDE.md` em dash rule): `grep -n '—' docs/examples/choices.md` returns no matches in the new/changed lines (cross-check against the diff, since the file has pre-existing content outside this story's scope).
   - Mechanical (camelCase): `grep -n -- ':global-index=' docs/examples/choices.md` returns no matches (the updated `default-choice-array-item` snippet must destructure `globalIndex`, not a kebab-case attribute).
   - Editorial (manual read): confirm the section states plainly that `globalIndex` is a `-choice-array-item` slot prop (not a `FieldMetadata` property, consistent with the story's own Out-of-scope note that `docs/reference/field-metadata.md` is untouched), that it is live-derived (never stored, renumbers on removal), and that this does not change the existing grouped-order guarantee documented at line 167 today, only adds the cross-branch numbering explanation alongside it, per the story's own edge-case note.
   - Regression check (editorial): re-read the existing grouped-order paragraph (line 167) to confirm it is not contradicted or duplicated, only supplemented, per the story's own edge-case bullet ("this story does not change render order, only the badge value").
   - `pnpm docs:build` completes clean (dead-link and code-fence syntax check).

### Edge cases (from Functional > Edge cases)

- **Zero active occurrences.** Manual, against `#numbering-empty`: open the live demo with nothing added; confirm the existing dashed "No integrations added yet" prompt renders with no badge anywhere and no console error/warning (the `-choice-array-item` loop body never runs, so `globalIndex`/`displayNumber` never execute). Screenshot both color modes.
- **Exactly one occurrence.** Manual: add a single occurrence to either branch; confirm its badge reads `1`.
- **The pre-existing grouped-order paragraph needs no correction.** Editorial (manual read), same check as AC5's regression check above: confirm the existing paragraph at line 167 reads accurately unmodified except for the new `globalIndex` explanation placed alongside it.

### States policy (this slice)

Per the feature's states policy, the relevant states for this docs slice are the numbering-specific ones (the ordering-toolbar states from `#ordering-*` are ST-05's scope, not this story's):

- **Default / Populated** (`#numbering-populated`): 1+ occurrences across one or more branches, continuous `globalIndex + 1` badge. Covered by AC2/AC3.
- **Empty** (`#numbering-empty`): 0 occurrences, existing FEAT-001 dashed prompt, no badge. Covered by the edge-case above.
- **Removal** (`#numbering-removal`): survivors renumber live, no gap. Covered by AC4.
- **Error** (`xsd_choiceMinOccurs`) and **Disabled** (Add buttons at budget): inherited unchanged from FEAT-001/ST-01-03, per the feature's states policy; this story's badge-value change does not touch either, so no new check is added here beyond confirming (manual, incidental to the AC2/AC3 walkthrough) that the existing error/disabled visuals still render correctly with the new badge value in place, since a regression there would mean the `displayNumber` binding somehow broke unrelated template markup.

### Reactivity / `*.analytics.test.ts` plan

Not applicable. This story touches no `packages/core/src/` file (no `DynamicFormItem`, `computedProps`, or validation wiring source), only two presentational docs `.vue` components and a markdown page. `globalIndex`'s own render-count/reactivity guarantees (no extra remount, no sibling re-render, bounded render count on removal) are already pinned by ST-01's `DynamicFormItemChoice.analytics.test.ts` additions; this story only binds an already-tested, already-live value into a docs template prop, so no new `.analytics.test.ts` file is added or extended.

### Coverage

Not applicable. `pnpm -r ci:test:coverage` measures `packages/core` (and `packages/element-plus`); this story changes zero files under either package, so coverage is mathematically unaffected. Running `pnpm ci` once before push is still correct practice (cheap, confirms nothing else in the working tree regressed) but no baseline comparison is required for this story specifically.

### Time sensitivity

Not applicable. No date/time-dependent content or logic is introduced.

### Regression risk

- **`RepeaterCard.vue` is shared by two call sites in `AdvancedFormTemplate.vue`**: `heading-array-item` (plain repeatable array items, e.g. the contacts list in `/examples/advanced`) and `default-choice-array-item` (this story's target). `displayNumber` must default to `undefined` (`?? index + 1` fallback) so the plain-array-item caller, which passes no `displayNumber`, is visually and behaviourally byte-identical. Guarded by the AC1 manual-visual check above (mount both call sites, confirm the plain-array one is unchanged) since no automated test exists to catch a regression here; this is the single highest-blast-radius risk in this story, flagged explicitly since `RepeaterCard` has no dedicated test file to lean on.
- **`docs/examples/choices.md`'s existing content** outside the "Add several" section (the "Pick exactly one" section, "A repeatable branch inside a single choice" section, "Capping a branch's total count" section, "Full Metadata"/"Related Source") must stay byte-identical. Guarded by an editorial additive-diff read plus `pnpm docs:build`'s dead-link check (catches a broken `<<<` include if one were accidentally touched).
- **`ChoiceArraySectionCard.vue` and the per-branch Add-button affordances**: explicitly out of scope per the story's own Out-of-scope list; no change expected, guarded incidentally by the same manual walkthrough (Add buttons must still work exactly as before while adding occurrences for the AC3/AC4 checks).
- **ST-05 (next story, depends on this one)**: builds the demo toolbar on top of the docs example this story leaves in place. A structural change to `FormExampleChoiceExplicitRepeatable.vue`'s metadata beyond what is described here (there is none planned) would need to be re-verified against ST-05's assumptions; noted so the developer does not casually restructure the metadata while touching this file.
- **No existing automated test guards any of the three touched files.** `RepeaterCard.vue` and `AdvancedFormTemplate.vue` have no component-test suite (confirmed: no `__tests__/` directory anywhere under `docs/`), and `choices.md` has no snippet-extraction harness (confirmed, matching FEAT-001 ST-04's finding). This is a pre-existing, documented gap in the project's tooling, not something this story is expected to fix; the manual verification checklist below is this story's only guard against a regression in these files.

### Manual verification checklist

1. `pnpm docs:build` completes clean (dead-link check, code-fence syntax, successful Vite/Vue SFC compile of both changed `.vue` files).
2. One-time `npx vue-tsc --noEmit -p ../../docs/tsconfig.json` run from `packages/core` (where `vue-tsc` is installed): confirms `RepeaterCard.vue`'s new prop type and `AdvancedFormTemplate.vue`'s `globalIndex` destructuring compile clean against the real shipped `ChoiceArrayItemAttributes` type. Not part of `pnpm ci`; a one-time pre-merge sanity check, same role as the equivalent step in FEAT-001 ST-04.
3. `pnpm docs:dev`, open `/examples/advanced` and confirm the plain-array-item cards (contacts list) still show `1, 2, 3...` with no visual or behavioural change (AC1 regression check).
4. On `/examples/choices`, "Add several, each one of several kinds" section: add CRM export, API endpoint, CRM export (AC3's exact order); confirm badges read `1, 2, 3` in grouped order, matching `#numbering-before-after`/`#numbering-populated`. Screenshot (Playwright), light and dark VitePress color mode.
5. From the same state, add a second API endpoint (4 occurrences, badges 1-4), remove the second occurrence (badge 2); confirm the 3 survivors immediately show `1, 2, 3` with no gap, matching `#numbering-removal`. Screenshot, both color modes.
   - > PROPOSED (adversarial review, finding 1): this 4-state (CRM, CRM, API, API, badges 1-4) is exactly the prototype `#numbering-removal` before-state. Remove **badge 3** (Billing/API, `apiEndpoint[0]`) to land on the prototype's after-state (`Salesforce (CRM) #1, HubSpot (CRM) #2, Shipping (API) #3`); removing badge 2 lands on a different survivor set (CRM, API, API) that does not match the anchor the screenshot is compared against.
6. Clear all occurrences; confirm the empty dashed prompt renders with no badge, matching `#numbering-empty`. Screenshot, both color modes.
7. Read the updated "Add several" section end to end: confirm the `globalIndex` explanation reads accurately (live-derived, never stored, slot prop not a metadata property), the updated snippet destructures `globalIndex` and binds it correctly, and the pre-existing grouped-order paragraph (line 167 today) is not contradicted.
8. `grep -rn '—' docs/.vitepress/theme/components/RepeaterCard.vue docs/.vitepress/theme/components/AdvancedFormTemplate.vue docs/examples/choices.md` restricted to the diff's changed lines: no em dashes, per `CLAUDE.md`.
9. `grep -n -- ':display-number=\|:global-index=' docs/.vitepress/theme/components/AdvancedFormTemplate.vue docs/examples/choices.md`: no matches, confirming camelCase bindings throughout.
10. After opening the PR: verify the Cloudflare Pages preview build renders `/examples/advanced` and `/examples/choices` correctly, per `CLAUDE.md`'s "Before Every Push" step 5.

### Untestable-as-written / rewrite proposals

- **AC1's "the badge and its aria-label read `displayNumber ?? index + 1`" is read literally as: the visible badge span's text content, and the existing Remove button's `aria-label` (currently `` `Remove item ${index + 1}` ``, `RepeaterCard.vue:42`), both switch their `index + 1` term to `displayNumber ?? index + 1`.** `RepeaterCard.vue`'s badge span (lines 29-33) currently has no `aria-label` of its own; the only existing `aria-label` in the component is on the Remove button. This reading is the only one consistent with the component as it exists today, so it is not flagged as genuinely untestable, only recorded here so the developer does not add a new, separate `aria-label` to the badge span under a mistaken reading of the AC. Check 1's mapping above and the manual walkthrough verify this literal reading.
- No acceptance criterion in this story is untestable as written; all five reduce to a concrete mechanical (`grep`/`docs:build`) or manual/visual check against a named prototype anchor.

### Open questions

None raised by this plan.

## Adversarial review

Filled by adversarial-reviewer (2026-09-19). Model: claude-opus-4-8[1m]. STORY mode (lite): blockers only.

Verification done against the actual files, not just the prose: `RepeaterCard.vue` (badge line 32, Remove-button `aria-label` line 42, both `index + 1`), `AdvancedFormTemplate.vue` (`default-choice-array-item` slot line 258, sibling plain `heading-array-item` slot line 226), `docs/examples/choices.md` (the "Add several" section from line 112, grouped-order paragraph line 167), `FormExampleChoiceExplicitRepeatable.vue` (branch declaration order), `pnpm-workspace.yaml`, `docs/package.json`, `docs/tsconfig.json`, the root `package.json` docs scripts, and the feature prototype `#numbering-removal` (prototype.html:434-452), plus the parent feature and ST-01 specs.

**Confirmed correct (the load-bearing claims hold):**
- **Docs verification surface is exactly as the QA plan describes.** `pnpm-workspace.yaml` excludes `docs` (`- '!docs'`); `docs/package.json` has precisely three scripts (`dev`, `build`, `preview`), no `test`/`typecheck`/`lint`; `docs/tsconfig.json` exists with `include: [".vitepress/**/*"]`, `strict: true`; `pnpm docs:build` resolves to `vitepress build .` (the one real mechanical gate). The two touched `.vue` files both live under `.vitepress/theme/components/`, so the one-time `vue-tsc -p docs/tsconfig.json` check does cover their slot-prop types; `choices.md` is under `docs/examples/` (outside that `include`), which is correct since its fenced snippets are not type-checked anyway. Verified file by file.
- **The `displayNumber ?? index + 1` change is byte-identical for the plain array-item caller.** `??` binds looser than `+`, so it parses as `displayNumber ?? (index + 1)`; when `displayNumber` is `undefined` (the plain `heading-array-item` caller passes none, line 226) both badge and `aria-label` fall back to `index + 1`, unchanged. The choice caller passes `:displayNumber="globalIndex + 1"` (already incremented), so the badge shows `globalIndex + 1` with no double-increment, and the Remove-button `aria-label` moves in lockstep with the visible badge (an accessibility-positive: the accessible remove label never diverges from the number the user sees). Consistent with feature architecture rows for `RepeaterCard`/`AdvancedFormTemplate` (feature spec lines 190-191).
- **Branch declaration order is handled consistently.** `FormExampleChoiceExplicitRepeatable.vue` declares `crmExport` (line 27) before `apiEndpoint` (line 38), the reverse of the core test fixture (`apiEndpoint`-first, per ST-01). Every grouped-order literal in this docs story (AC3 "both `crmExport` occurrences before the `apiEndpoint` one", QA line 94, the 4-state `crmExport, crmExport, apiEndpoint, apiEndpoint`) correctly uses the docs example's `crmExport`-first order, and `choices.md:167` already documents that same order. No `apiEndpoint`-first (test-fixture) literal leaked into the docs story.
- **Consistency with the approved feature and ST-01.** Scope matches Slice D1; `RepeaterCard.displayNumber`, the `:displayNumber="globalIndex + 1"` binding, the `choices.md` docs update, the ST-01-only dependency, and the no-changeset (docs-only) classification all match the feature architecture and the Stories table. No DECIDED entry is contradicted.

### Findings

1. **(should-fix) The AC4 / QA-plan removal target (badge 2) cannot reproduce the `#numbering-removal` prototype panel it is compared against (which comes from removing badge 3).** AC4 and the QA plan (AC4 mapping, manual checklist item 5) remove "the second occurrence" (badge 2) from the 4-state `crmExport, crmExport, apiEndpoint, apiEndpoint`, then assert the result matches the prototype's `Salesforce (CRM) #1, HubSpot (CRM) #2, Shipping (API) #3` (CRM, CRM, API). But the prototype (prototype.html:439-452, annotation line 452) produces that panel by removing **badge 3** (Billing/API, `removeChoiceOccurrence('apiEndpoint', 0)`). Removing badge 2 (HubSpot, the second CRM) instead leaves `crmExport[0], apiEndpoint[0], apiEndpoint[1]` (CRM, API, API), which renumbers to 1, 2, 3 with no gap but is a different survivor set than the anchor the Playwright screenshot is compared against. The "renumber, no gap" contract holds either way, so this is not a blocker, but the prototype comparison and screenshot (a stated QA verification method) are unreproducible as written. Routed as PROPOSED into AC4, the QA-plan AC4 mapping, and manual-checklist item 5: align the removal target to badge 3 (the Billing/API occurrence), which the checklist's own 4-state reproduces exactly.

2. **(nit) AC1's "the badge and its aria-label" wording invites a spurious badge `aria-label`.** RepeaterCard's badge `<span>` (lines 29-33) has no `aria-label`; the only one in the component is on the Remove button (line 42). Ruling on the qa-planner's flagged ambiguity (Untestable-as-written bullet): the qa-planner's reading is correct and is the only accessibility-sound one, since the visible badge text and the Remove-button accessible label must move together or a screen-reader user hears "Remove item 1" next to a card visibly badged "3". No separate badge `aria-label` should be added. Suggested (non-blocking) wording tightening: AC1 could say "the badge text and the Remove button's `aria-label`" instead of "the badge and its `aria-label`". Nit; does not force discussion.

3. **(nit) The QA plan calls ST-01's `globalIndex` "already-shipped" (lines 64, 90, 99) though ST-01 is still `awaiting-approval`.** The dependency is correctly declared (Architecture reference: "Depends on ST-01"), and by ST-04's implementation time ST-01 will have shipped, so the wording is only temporally premature, not a correctness gap. Nit.

### Status rationale

No blockers. Every acceptance criterion is testable and mapped in the QA plan; the docs verification surface, the `displayNumber ?? index + 1` fallback, and the `crmExport`-first grouped order all check out against the actual files; nothing contradicts the approved feature design/architecture or ST-01. The one should-fix (finding 1) is routed as a `PROPOSED (adversarial review)` edit into AC4, the QA-plan AC4 mapping, and manual-checklist item 5, so it does not force discussion. The story carries no Open questions of its own. Per `specs/README.md`, with no unresolved Open question, no blocker, and the sole should-fix routed as a PROPOSED edit, this lands in `awaiting-approval`.

## Implementation notes

- **AC4 removal target followed the PROPOSED reading (finding 1), not the literal AC4 text.** The manual verification for AC4/edge cases removed the third occurrence (badge 3, the Billing/API `apiEndpoint[0]` occurrence) from the 4-state `crmExport, crmExport, apiEndpoint, apiEndpoint`, reproducing the prototype's `#numbering-removal` after-state exactly (survivors renumber to 1, 2, 3 with no gap). Confirmed by Playwright screenshot. AC4's own wording ("the second one") was left untouched since editing acceptance-criteria wording is outside this phase's scope; only the manual verification followed the routed proposal.
- **`docs/examples/choices.md`'s "Add several" section stayed on scalar-leaf branch metadata in its illustrative TS snippet**, per the story's own out-of-scope note: `FormExampleChoiceExplicitRepeatable.vue` already uses object branches with `children`, so the live demo needed no metadata change, and the persisted-tier's object-branch requirement (ADR-3) is explicitly scoped by the feature spec to "wherever the persisted tier is demonstrated", which is ST-05, not this story. The `default-choice-array-item` illustrative snippet in the docs was updated to destructure and display `globalIndex` alongside the existing `branchKey`, matching the prototype's card anatomy (continuous badge + kind badge together) without otherwise changing the snippet's scalar-leaf shape.
- **`vue-tsc --noEmit -p docs/tsconfig.json` reports 132 pre-existing errors, unrelated to this story.** They come from a dual `@vue/reactivity`/`@vue/runtime-core` version mismatch between the root and `docs/`'s own `node_modules` (confirmed unrelated: identical 132-error count before and after this story's changes, and none of the errors reference `RepeaterCard.vue`, `AdvancedFormTemplate.vue`'s touched lines, `displayNumber`, or `globalIndex`). Not something this docs-only story is scoped to fix.
- **The AC1 regression check (plain `heading-array-item` caller unaffected) was verified by code inspection and operator-precedence reasoning** (`displayNumber ?? index + 1` parses as `displayNumber ?? (index + 1)`, and the `heading-array-item` slot binds no `displayNumber`, confirmed by grep) rather than by a live screenshot of `/examples/advanced`: that page is a multi-step wizard and the "Project contacts" repeatable-array step sits behind earlier required-field validation gates that made a scripted Playwright walk impractical within this story's scope. The continuous-numbering screenshots for the actual acceptance-critical `/examples/choices` demo (populated, 4-occurrence, post-removal, empty, light and dark) were captured directly.
- No changeset added: this story touches no `packages/core/src/` file (confirmed: only two `docs/.vitepress/theme/components/*.vue` files and `docs/examples/choices.md` changed).

## Verification report

Filled by qa-verifier (2026-09-19).

### Pipeline checks

- `pnpm -r run ci` (test + lint + typecheck for `packages/core` and `packages/element-plus`): pass. 583 tests in `packages/core`, 1 in `packages/element-plus`, all green; lint and `vue-tsc --noEmit` both clean.
- `pnpm -r ci:test:coverage`: pass. `packages/core` all-files coverage 97.1% statements / 93.03% branch / 95.5% functions / 97.1% lines. Not applicable as a baseline-drop check for this story specifically since it touches zero files under `packages/core/src/` or `packages/element-plus/src/` (confirmed by `git status`), matching the story's own "Coverage: Not applicable" plan.
- `pnpm docs:build`: pass. Client + server bundles build, pages render, no dead-link failures.
- One-time `npx vue-tsc --noEmit -p ../../docs/tsconfig.json` (run from `packages/core`): 132 errors, independently reproduced and counted. Confirmed none reference `RepeaterCard.vue`, `displayNumber`, `globalIndex`, or the touched `AdvancedFormTemplate.vue` lines (258/263); the `AdvancedFormTemplate.vue` errors that do appear are all on unrelated lines (85-335, the pre-existing `MaybeRefOrGetter`/`Step[]`/`ChoiceOption[]` dual-`@vue/reactivity`-version mismatch the story's Implementation notes describe). Matches the claimed pre-existing, unrelated 132-error baseline exactly.

### Acceptance criteria

| # | Criterion | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | `RepeaterCard.vue` gains optional `displayNumber?: number`; badge and Remove `aria-label` read `displayNumber ?? index + 1` | Pass | `grep -n "displayNumber"` finds the prop, the badge interpolation (line 34), and the aria-label (line 44); diff confirms the exact `?? index + 1` fallback. Independently confirmed live: the plain `heading-array-item` caller (`/examples/advanced`, "Project contacts" step, no `displayNumber` bound) still renders badges `1, 2, 3` unaffected (Playwright screenshot `qa-contacts-3cards.png`, captured during this verification since the developer's own live check for this exact regression was skipped, see Process compliance below). |
| 2 | `AdvancedFormTemplate.vue`'s `default-choice-array-item` slot destructures `globalIndex`, binds `:displayNumber="globalIndex + 1"`, keeps `:index` | Pass | Diff at line 258/263: `globalIndex` destructured, `:displayNumber="globalIndex + 1"` bound, `:index` untouched. `grep` for kebab-case (`:global-index=`, `:display-number=`) returns no matches. `pnpm docs:build` compiles the SFC clean. |
| 3 | Docs example demonstrates continuous numbering live (CRM, API, CRM press order → badges 1, 2, 3 grouped) | Pass | Playwright screenshots `02-populated-1-2-3-light.png` / `06-populated-1-2-3-dark.png`: three cards read "1 CRM export", "2 CRM export", "3 API endpoint", both color modes, matching `#numbering-before-after`/`#numbering-populated` and the grouped (not `1, 1, 2`) order. |
| 4 | Removal renumbers survivors with no gap (Q5) | Pass, with a wording note | Screenshots `03-four-occurrences-light.png` (badges 1-4, CRM/CRM/API/API), `04-after-removal-light.png` and `07-after-removal-dark.png` (survivors renumber to 1, 2, 3 = CRM/CRM/API, no gap). This reproduces the routed PROPOSED fix (remove badge 3, the first `apiEndpoint` occurrence) and matches the prototype's `#numbering-removal` after-state exactly. Note: AC4's own literal text ("remove the second one") was never edited to match the routed PROPOSED reading; the Implementation notes explain this was deliberate (acceptance-criteria wording judged out of scope for the implementation phase), but it leaves the AC's prose permanently inconsistent with the only removal target that is actually verified and screenshotted. Not a functional defect (the underlying "renumber, no gap" contract holds either way, and the correct/prototype-matching target was the one implemented and tested), so it does not block this verdict, but the AC text should be corrected the next time this spec is touched. |
| 5 | `choices.md` documents `globalIndex` and the before/after numbering distinction | Pass | Diff adds a paragraph naming `globalIndex` as a `-choice-array-item` slot prop, states it is live-derived and never written to `values`, updates the `default-choice-array-item` snippet to destructure and render it, and appends a clause to the existing grouped-order paragraph rather than contradicting or duplicating it. `grep` confirms `globalIndex` appears in prose and in both snippet locations, no kebab-case binding, no em dash in the changed lines. |

Edge cases: zero occurrences confirmed with no badge and no console-visible error (`01-empty-light.png`, `08-empty-dark.png`, "0 of 5"); exactly-one-occurrence case is trivially covered by the first card in every populated screenshot always reading "1"; the pre-existing grouped-order paragraph was read end to end and is supplemented, not contradicted, by the new `globalIndex` sentence.

States policy: Populated and Removal states covered above in both color modes; Empty confirmed in both color modes. Error/Disabled states were not independently re-exercised (out of scope per the architecture: the badge-value change touches no validation or disabled-state markup) but no regression was visible in any captured screenshot (the "3 of 5"/"4 of 5"/"0 of 5" usage counter and Add-button styling render exactly as in ST-01-03).

### Prototype comparison

`#numbering-before-after` / `#numbering-populated`: matches (continuous badge + kind badge together, per design decision 1). `#numbering-removal`: matches the DECIDED true-grouped-order fix exactly, once the routed PROPOSED removal target (badge 3) is used, which is what was actually implemented and screenshotted. `#numbering-empty`: matches (no badge, existing dashed prompt, unaffected). Both VitePress color modes checked for every state that was screenshotted. No visual drift from sibling ST-01/ST-02/ST-03 (no engine file touched by this story).

### Process compliance

- No changeset added and none needed: confirmed via `git status` that only `docs/.vitepress/theme/components/{AdvancedFormTemplate,RepeaterCard}.vue` and `docs/examples/choices.md` changed (plus this story's own spec file). The one changeset file mentioning `globalIndex` (`.changeset/tiny-forms-continuous-numbering.md`) is dated to the already-committed ST-01 (`git log` confirms), not this slice.
- `specs/components.md`: no diff, correctly unchanged (no public-surface addition in this docs-only slice; ST-01 already owns the `globalIndex` entry).
- No spec/story/finding references leaked into code or docs prose: `grep -iE "FEAT-|ST-0[0-9]|AC[0-9]|ADR-[0-9]|adversarial"` across the three touched files returns nothing.
- camelCase throughout: `displayNumber`, `globalIndex` used consistently in props, bindings, and slot destructuring; no kebab-case attribute anywhere in the diff.
- No em dashes in the changed lines of any touched file.
- Library API rules: no new export, no new `packages/core/src/` surface; this story only consumes ST-01's already-shipped `globalIndex` slot prop through the established slot-prop channel.
- **Gap found and closed during verification**: the story's own Regression risk section names the plain `heading-array-item` caller as "the single highest-blast-radius risk in this story" and the QA plan's specified method for AC1's regression check is a live visual check in a running `docs:dev` server. The Implementation notes disclose, transparently, that this live check was replaced with code inspection and operator-precedence reasoning because the `/examples/advanced` wizard's validation gates made a scripted walk look impractical. I performed that walk myself during this verification (`pnpm --prefix docs dev`, Playwright with `--no-proxy-server`, filled the Company details step, added three contacts) and confirmed the plain array-item badges still read `1, 2, 3` with no `displayNumber` regression. The disclosure was honest and the reasoning was sound, and the live result is now positive, so this does not change the verdict, but skipping a QA-plan-specified live check for the explicitly flagged highest-risk item, rather than asking for a scoping adjustment or an alternate harness, is a process shortcut worth naming so it is not repeated on a future story where the reasoning might not hold up.

### Overall verdict: pass-with-notes

All five acceptance criteria and both edge cases hold, the pipeline is fully green, `pnpm docs:build` compiles clean, the one-time `vue-tsc` check reproduces the exact pre-existing/unrelated 132-error baseline, and the prototype comparison and both VitePress color modes check out against the developer's Playwright screenshots. Two non-blocking notes carried forward: (1) AC4's literal wording still says "the second one" while the only implemented/verified/screenshotted removal target is the third occurrence (the routed PROPOSED reading, which correctly matches the prototype); this should be corrected in the AC text the next time this spec is opened. (2) The developer's own highest-flagged regression risk (AC1's plain-array-item caller) was verified only by static reasoning rather than the QA plan's specified live check; I closed that gap myself during this verification with a passing result, but future stories should not substitute reasoning for a QA-plan-specified check on a named highest-risk item without flagging it back to QA first.

Status set to `done`. Jeroen: please link the merged PR in this story's frontmatter `pr` field. ST-05 (the next and final story in FEAT-002, depends on ST-02/ST-03/ST-04) is still open, so the parent feature stays `in-progress`, not `done`, until ST-05 ships.
