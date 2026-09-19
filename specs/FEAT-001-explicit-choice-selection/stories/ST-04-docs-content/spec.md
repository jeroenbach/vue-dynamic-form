---
id: ST-04
type: story
feature: FEAT-001
status: done
created: 2026-09-10
approved_by: Jeroen
pr: "https://github.com/jeroenbach/vue-dynamic-form/pull/43"
---

# Story: Docs content for explicit choice selection

## Functional
### User story
As a docs reader building my own `DynamicFormTemplate`-based template, I want a dedicated, easy-to-follow "select first, then fill in" section in the choices documentation, covering both the pick-one and add-several cases, so that I can adopt the pattern without reverse-engineering it from an example alone.

### Acceptance criteria

1. **`docs/examples/choices.md` gains a "select first, then fill in" section.**
   Given the current `docs/examples/choices.md`,
   When the section is added,
   Then it explains `explicitChoiceSelection`, the four slot props (`addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences`), and links to the migrated `FormExampleClientOnboardingPlanner.vue` example (ST-03) as the worked demonstration.

2. **Both cardinalities are covered with runnable code.**
   Given the new section,
   When a reader follows it,
   Then it includes a minimal, copy-pasteable `maxOccurs: 1` snippet (pick exactly one branch) and a minimal `maxOccurs > 1` snippet (add several occurrences, one of several kinds), each showing the metadata flag and the slot usage, not just prose description.

3. **The clear-on-switch contract is documented honestly (ADR-3).**
   Given a reader who switches branches in the `maxOccurs: 1` example,
   When they read the section,
   Then it states the accepted residue contract in plain terms: the deselected branch's data is cleared to `undefined`, the key may remain present in raw `values`, occurrence counting and validation are unaffected by it, and `removeNullValues(values)` is the documented submit-time cleanup, consistent with the migrated example's `handleSubmit` (ST-03). (ADR-3 option (a), reconfirmed by Jeroen during story prep.)

4. **`xsd_choiceMinOccurs` parity is documented for both cardinalities (DECIDED finding 2).**
   Given a reader building a required explicit choice,
   When they read the section,
   Then it states plainly that selecting a branch (`maxOccurs: 1`) or adding an occurrence (`maxOccurs > 1`) satisfies `xsd_choiceMinOccurs` immediately, before any field inside is filled in, and that the branch/occurrence's own required fields enforce their own content separately.

5. **Reference doc mentions the new flag.**
   Given `docs/reference/field-metadata.md` (or the section documenting `FieldMetadata` properties),
   When the migration ships,
   Then `explicitChoiceSelection` is documented there with its default (`false`/absent) and a one-line pointer to the choices example for the full pattern.

### Edge cases
- A reader who only needs the `maxOccurs: 1` case should not need to read past the first snippet; the two cardinalities are clearly separated so partial adoption is easy.
- The section calls out that the engine ships no widget (per decision 2): cards, dropdowns, and add buttons are all template-author code built on the four primitives, so the doc does not imply a prescribed component.

### Out of scope
- Rewriting the example component itself (ST-03); this story only writes narrative documentation and reference entries.
- Any Storybook content; the feature scope does not require Storybook changes.

## Design reference
Feature prototype (`../../prototype.html`): `#overview` (the provisional slot-prop legend, now finalized per the feature architecture's Public API impact section) grounds the terminology used in the doc; `#multi-add-buttons` and `#multi-dropdown` illustrate the two widget shapes the `maxOccurs > 1` snippet can mention as alternatives (per-branch buttons vs. a single dropdown), both built on the same primitives.

> **ACCEPTED (research, 2026-09-10; rung 1, enforces DECIDED Q8 grouped ordering). PROPOSED (adversarial review) - carry the Q8 grouped-order caveat into this story (finding 1).** `#multi-add-buttons` and `#multi-dropdown` draw occurrences in interleaved insertion order, but that rendering is illustrative only. DECIDED (Jeroen, 2026-09-10, Q8): `activeChoiceOccurrences` is grouped by branch declaration order, then index within branch, derived purely from the value tree; the docs example renders grouped, not interleaved. ST-02's own Design reference already records this caveat; ST-04 must not reproduce the prototype's interleaved ordering in its `maxOccurs > 1` snippet or prose. When the snippet iterates `activeChoiceOccurrences`, it either stays order-agnostic or explicitly reflects the grouped order, and any prose about occurrence ordering must state the grouped-by-branch contract, so the published page does not teach a shape the engine does not produce.

## Architecture reference
Docs-only slice; touches no `packages/core/src/` file, so no changeset.

- **`docs/examples/choices.md` (modified).** New section per the acceptance criteria above.
- **`docs/reference/field-metadata.md` (modified, if this is where `FieldMetadata` properties are documented; confirm the exact file during implementation against the current docs structure).** New entry for `explicitChoiceSelection`.
- **Public API surface touched:** none (documents ST-01/ST-02's already-shipped surface; adds no new library export).
- **Dependencies:** ST-01 and ST-02 (the section documents both cardinalities, so both engine slices must exist first). Logically follows ST-03 (the worked example it links to), though it does not modify any file ST-03 touches, so it can be prepared in parallel and only needs ST-03 merged before publishing the cross-link.
- **`specs/components.md`:** no change (docs-only, no library public surface added; ST-01/ST-02 already own that update).

## QA plan

This is a docs-content-only slice: no `packages/core/src/` file changes, no new unit/component tests, no changeset. Verification is editorial (does the prose say the right thing) and build/mechanical (does it compile, does every name match the shipped API, does no forbidden character slip in). The plan below says explicitly, per check, which kind it is.

### Files touched

| File | Change |
| --- | --- |
| `docs/examples/choices.md` | New H2 section (working title "Select first, then fill in") added after the existing "Choice Structure" section and before "Full Metadata"/"Related Source", covering AC1-4. |
| `docs/reference/field-metadata.md` | New `### explicitChoiceSelection` subsection under "## Structure", placed immediately after the existing `### choice` subsection (the property it modifies) and before `### attributes`, matching the doc's existing convention of documenting a modifier flag right after the structural property it applies to (see `autoAddMinOccurs` placed right after `maxOccurs` for precedent). Covers AC5. |

No `.vue`, `.ts`, or test file is touched. `FormExampleClientOnboardingPlanner.vue` (the linked worked example) is ST-03's file; this story only links to it, never edits it. If ST-03 has not yet renamed/relocated it by the time this story implements, the cross-link check below will fail the build and that is the correct signal to hold this story rather than merge a dead link.

### Acceptance criteria → check mapping

1. **`docs/examples/choices.md` gains the section (explains `explicitChoiceSelection`, the four slot props, links to the migrated example).**
   - Mechanical: `pnpm docs:build` must complete with no error. VitePress's dead-link checker is on by default in this project (no `ignoreDeadLinks` override in `docs/.vitepress/config.ts`), so a broken relative link to the advanced/onboarding example page fails the build; this is a real guard, not just a smoke test.
   - Mechanical: `grep -n "explicitChoiceSelection\|addChoiceOccurrence\|removeChoiceOccurrence\|canAddChoiceOccurrence\|activeChoiceOccurrences" docs/examples/choices.md` — all five identifiers must appear at least once, verbatim, matching the exact casing from the feature architecture's Public API impact section (`FEAT-001/spec.md` items 1-2). This catches a stale provisional name (`changeChoice`, `selectedOption`) or a typo'd identifier surviving into the published page.
   - Editorial (manual read): confirm the section actually *explains* each of the five names in prose, not just name-drops them in a code block; confirm the link target is the docs page for the migrated example (`docs/examples/advanced.md`, which embeds `FormExampleClientOnboardingPlannerContext.vue` → `FormExampleClientOnboardingPlanner.vue`) or the `Related Source` GitHub link pattern already used elsewhere in `choices.md`, consistent with the existing cross-link convention in `arrays-and-groups.md` / `advanced.md`.

2. **Both cardinalities covered with copy-pasteable code.**
   - Editorial (manual read): the section contains two distinct fenced `ts` (or `vue`) code blocks, one showing a `maxOccurs: 1` choice with `explicitChoiceSelection: true` plus a slot snippet calling `addChoiceOccurrence`, one showing `maxOccurs > 1` with the same flag plus a slot snippet iterating `activeChoiceOccurrences` and calling `addChoiceOccurrence`/`removeChoiceOccurrence`/`canAddChoiceOccurrence`. Each snippet must be minimal (not the full onboarding metadata) and self-contained enough to paste into a scratch file.
   - Mechanical, partial: `pnpm docs:build` catches a malformed code fence (unterminated backticks, broken `<<<` include syntax) but does **not** type-check inline fenced snippets. Flagged below (Untestable-as-written) since "runnable" cannot be mechanically verified for hand-written fenced blocks the way it can for `<<<`-included regions from a real source file.
   - Manual verification step (see checklist below): paste each of the two snippets into a scratch `.ts`/`.vue` file inside `packages/core/src/` (or a throwaway file under the repo's `scratchpad`) alongside the shipped `explicitChoiceSelection`/`ChoiceAttributes` types from ST-01/ST-02 and run `npx vue-tsc --noEmit` on it once before merge, to catch a typo'd prop name or wrong signature that grep alone would miss. This is not part of `pnpm ci` and must be done by hand.

3. **Clear-on-switch / residue contract documented per ADR-3 option (a).**
   - Editorial (manual read): the section states, in plain language, all four parts of AC3 in the story: (a) the deselected branch's data is cleared to `undefined`, (b) the key may remain present in the raw `values` object, (c) occurrence counting and `xsd_choiceMinOccurs` are unaffected by that residue, (d) `removeNullValues(values)` is the documented submit-time cleanup. Cross-check each of the four clauses against `FEAT-001/spec.md`'s ADR-3 text and against ST-01's AC10 so the docs page does not restate a claim the feature spec's finding 1 discussion rejected (the "clean removal" wording that was corrected to option (a)).
   - Mechanical: `grep -n "removeNullValues" docs/examples/choices.md` — must appear, confirming the submit-time cleanup is actually named, not just alluded to.
   - Regression check (editorial): re-read the *existing* `choices.md` prose ("Selecting one branch disables the others and relaxes their child field validation until that branch becomes active") to confirm the new section does not contradict it; the new section documents the *explicit* opt-in mode, the existing prose documents the *auto* (default) mode, and the page must make that distinction unambiguous to a reader skimming both.

4. **`xsd_choiceMinOccurs` parity for both cardinalities documented (DECIDED finding 2).**
   - Editorial (manual read): the section states plainly, for both the `maxOccurs: 1` snippet and the `maxOccurs > 1` snippet, that selecting/adding satisfies `xsd_choiceMinOccurs` immediately (before any field inside is filled in), and that the branch/occurrence's own required fields enforce their own content separately. Cross-check the wording against ST-01 AC6 and ST-02 AC5 (the DECIDED parity resolution) so the docs claim matches what the engine actually guarantees, not the earlier asymmetric draft the feature's adversarial review flagged as finding 2.
   - Mechanical: `grep -n "xsd_choiceMinOccurs" docs/examples/choices.md` — must appear at least once in the new section.

> **ACCEPTED (research, 2026-09-10; rung 1, enforces DECIDED Q8 grouped ordering). PROPOSED (adversarial review) - add a Q8 grouped-order editorial check (finding 1).** Under AC2's mapping (the `maxOccurs > 1` snippet iterating `activeChoiceOccurrences`): Editorial (manual read): confirm the snippet and any prose about occurrence ordering do not reproduce the prototype's interleaved insertion order. Cross-check against the DECIDED Q8 verdict and ST-02 AC4 (grouped by branch declaration order, then index within branch, derived purely from the value tree). The snippet stays order-agnostic or reflects grouped order; the page must not teach interleaved ordering the engine does not produce.

5. **Reference doc documents `explicitChoiceSelection`.**
   - Editorial (manual read): `docs/reference/field-metadata.md` gains a `### explicitChoiceSelection` entry stating type (`boolean`), default (`false`/absent), and a one-line pointer to the `choices.md` example section. Compare format against the immediately adjacent `### choice` and `### autoAddMinOccurs` entries (type line, one-sentence description, short code example) so the new entry reads as native to the page, not bolted on.
   - Mechanical: `grep -n "explicitChoiceSelection" docs/reference/field-metadata.md` — must appear.
   - Mechanical: `pnpm docs:build` — the one-line pointer is a relative link to `choices.md`'s new section anchor; VitePress's dead-link check fails the build if the anchor is wrong (e.g. the auto-generated heading slug does not match what was linked).

### Edge cases (from Functional > Edge cases)

- "A reader who only needs `maxOccurs: 1` should not need to read past the first snippet." Editorial: confirm the two cardinalities are under distinct subheadings or otherwise visually separated (not interleaved prose), so a reader can stop after the first without missing something load-bearing for the single case.
- "The section calls out the engine ships no widget." Mechanical: `grep -n -i "no widget\|template-author\|no prescribed" docs/examples/choices.md` (illustrative pattern, not a strict string match) as a heuristic; editorial read is the real check: confirm the section explicitly says cards/dropdowns/buttons are all consumer-built on the four primitives, not implied only by omission.

### States policy

Not applicable in the component-test sense (no `DynamicFormItemChoice` mount in this story). The doc's job is to describe the states the feature's states policy already defines (empty/unselected, selected/active, disabled, error) in prose and in the two snippets, not to render them. Editorial check: the "select first, then fill in" section's prose at minimum names the empty/unselected state (nothing shown until `addChoiceOccurrence`) and the error state (`xsd_choiceMinOccurs` before selection) for both cardinalities, since those are the two states a reader most needs to reason about before writing their own template. Loading and per-field validation states are inherited/unchanged per the feature's states policy and need no new prose here.

### Reactivity / `*.analytics.test.ts`

Not applicable. This story touches no `DynamicFormItem`, `computedProps`, or validation wiring source code, only prose. No `.analytics.test.ts` file is added or extended.

### Coverage

Not applicable. `pnpm -r ci:test:coverage` measures `packages/core` (and `packages/element-plus`); this story changes zero files under either package, so coverage is mathematically unaffected. No baseline check is required, though running `pnpm ci` once before push is still correct practice (see checklist) since it is cheap and confirms nothing else in the working tree regressed.

### Time sensitivity

Not applicable. No date/time-dependent content.

### Regression risk

- **`docs/examples/choices.md`'s existing content** (the "What It Demonstrates" list, the `FormExampleChoiceFields.vue` embed, the "Choice Structure" and "Full Metadata" `<<<` includes) must stay accurate and unmodified except for the new section's insertion point. The existing page documents *auto* mode only; the new section must not blur that boundary (see AC3 mapping above). Guarded by an editorial diff read (confirm the diff is additive-only to this file, no existing line changed) plus `pnpm docs:build` (catches a broken `<<<` include if one was accidentally touched).
- **`docs/reference/field-metadata.md`'s existing entries** must stay unmodified except for the new `explicitChoiceSelection` subsection. Same additive-diff check.
- **Cross-link to `FormExampleClientOnboardingPlanner.vue` / `docs/examples/advanced.md`.** This is the one real coupling to another story: ST-03 (docs template migration) is what actually makes that example demonstrate the new mechanism. If ST-03 has not shipped (or ships with a different component/section name) when this story is implemented, the link target may not say what this story's prose claims it shows. Guarded mechanically by `pnpm docs:build`'s dead-link check (a renamed/removed file fails the build) but **not** guarded against "the link resolves but the linked page still shows the old `changeChoice` workaround" — that mismatch is only caught by the editorial checklist item below. Since the feature's own dependency table lists ST-04 as depending on ST-01 and ST-02 only (logically following ST-03 but not file-dependent on it), implementation order matters here: if ST-04 implements before ST-03 merges, the manual checklist's "click through the live link" step must be re-run once ST-03 lands, before this story is truly done, or the cross-link claim goes unverified.
- **Other stories of this feature**: ST-01/ST-02 own the actual API surface being documented; a later rename of any of the five identifiers (unlikely post-approval, but the grep checks above exist specifically to catch it if the developer implements ST-04 against a doc draft written before ST-01/ST-02 finished, or against the provisional prototype names instead of the finalized architecture names). ST-05 (preserve-on-switch) is out of scope for this story per its own Out-of-scope list and needs no mention here.
- **No existing automated test guards markdown prose content anywhere in this repo** (confirmed: no snippet-extraction/type-check harness exists under `docs/` or `scripts/`). This is a pre-existing gap in the project's tooling, not something this story is expected to fix; flagged here so the absence is a documented, deliberate boundary rather than a silent one.

### Manual verification checklist

1. `pnpm docs:build` completes clean (build-level check for AC1, AC2's fence syntax, AC5's anchor link; required by `CLAUDE.md`'s "Before Every Push" step 5 for any `docs/` change).
2. `pnpm docs:dev`, open both new sections in a browser, and read them end to end in light and dark mode (VitePress's built-in toggle) to confirm code blocks render with correct syntax highlighting and no broken Markdown (stray backtick, unclosed fence) slipped past the build step.
3. Click through the new cross-link from `choices.md` to the onboarding/advanced example page and confirm it lands on content that actually demonstrates `explicitChoiceSelection` (not just that the link resolves). If ST-03 has not merged yet at the time this story is verified, re-run this specific step once it has, per the Regression risk note above.
4. Paste each of the two AC2 code snippets into a scratch file and run `npx vue-tsc --noEmit` against it using the shipped ST-01/ST-02 types, to catch a typo or wrong signature grep cannot (see AC2 mapping). Not part of `pnpm ci`; a one-time pre-merge sanity check.
5. `grep -rn '—' docs/examples/choices.md docs/reference/field-metadata.md` (em dash, U+2014) — must return no matches, both in the new prose and anywhere the diff touches, per `CLAUDE.md`'s "never use em dashes" rule. Mechanical, exact-string check, zero judgement required.
6. `grep -n -- '-choice=\|-choice-occurrence=\|:add-choice\|:remove-choice\|:can-add-choice\|:active-choice' docs/examples/choices.md` (and the same over any `.vue` fenced block) — must return no matches; a kebab-case prop/attribute binding in a Vue snippet (e.g. `:add-choice-occurrence=` instead of `:addChoiceOccurrence=`) would violate `CLAUDE.md`'s "Vue: always use camelCase, never kebab-case" rule silently, since markdown code fences are not linted. Mechanical, exact-string check.
7. After opening the PR: verify the Cloudflare Pages preview build (the `cloudflare-workers-and-pages` bot comment) renders both changed pages correctly, per `CLAUDE.md`'s "Before Every Push" step 5. This is the closest thing to an end-to-end check this story gets, since it renders the actual production build pipeline, not just the local `vitepress build`.

Checks 1, 3 (link-target correctness), 4, and 2 (visual read) are manual. Checks 5 and 6 are mechanical grep, exact-string, no judgement. Check 1 (`docs:build` succeeding) and the dead-link portions of checks under AC1/AC5 are mechanical/build-level. Check 7 is a hybrid: mechanical trigger (CI/Cloudflare), manual review of the result.

### Untestable-as-written / rewrite proposals

- **AC2's "runnable" is not literally verifiable by any tool in this repo.** No harness exists (in `docs/`, `packages/core`, or `scripts/`) that extracts a fenced Markdown code block and type-checks or executes it; `pnpm docs:build` compiles the VitePress site itself (real `.vue` files under `.vitepress/theme/`) but does not touch prose-embedded fenced blocks at all. As written, "runnable" can only be satisfied by the one-time manual `vue-tsc` scratch-file check in the verification checklist (item 4), which is a best-effort human step, not a repeatable gate. **Proposed rewrite** (for the developer/qa-verifier to treat as the operative bar unless Jeroen says otherwise): read AC2's "runnable" as "syntactically valid and consistent with the real, shipped API surface (exact prop/flag names, correct signature shapes)", verified by the grep checks in the AC1/AC2 mapping above plus the one-time manual scratch-file compile, rather than as "executed by an automated test in this PR." Flagging rather than silently softening the criterion, since only Jeroen or the adversarial-reviewer should confirm this reading is acceptable.
- No other acceptance criterion is untestable as written; AC1, AC3, AC4, and AC5 all reduce to editorial-read-plus-grep checks with a concrete pass/fail.

### Open questions

- None raised by this plan beyond the AC2 "runnable" flag above, which is routed as a proposed reading rather than an open question, since research (reading the repo's existing docs tooling) produced a clear "no such harness exists" answer rather than a genuine unknown.

## Adversarial review

Ran in STORY (lite) mode on 2026-09-10, blockers-first, against the installed docs tree (`docs/examples/choices.md`, `docs/examples/advanced.md`, `docs/reference/field-metadata.md`, `docs/.vitepress/config.ts`, `docs/package.json`), the exported `removeNullValues` (`packages/core/src/utils/removeNullValues.ts` + `index.ts`), and the parent feature's binding DECIDED entries (option (a) residue, finding 2 parity, Q8 grouped order, the real API names) plus dependencies ST-01/ST-02. Checked every acceptance criterion for a testable check mapping, checked for silent contradictions of the approved feature design/architecture, and checked the dependency declarations. No blocker found; one should-fix, routed as a PROPOSED edit.

**Verified correct (recorded so discussion does not re-litigate):**

- **The five API identifiers the docs must teach match the shipped surface exactly.** `explicitChoiceSelection`, `addChoiceOccurrence`, `removeChoiceOccurrence`, `canAddChoiceOccurrence`, `activeChoiceOccurrences` are the finalized names in the feature architecture's Public API impact items 1-2. AC1 and the grep checks pin them verbatim; a stale provisional name (`changeChoice`, `selectedOption`) is caught.
- **`removeNullValues` is real, exported, and does what AC3 claims.** `packages/core/src/utils/removeNullValues.ts` strips `null`/`undefined` leaves and prunes now-empty containers across the whole tree, and is re-exported at `index.ts:26`. AC3's "documented submit-time cleanup" is accurate against the runtime.
- **AC3 teaches option (a), not the superseded option (c).** AC3 states residue-plus-`removeNullValues` verbatim per the reconfirmed DECIDED finding 1; no leftover "clean removal" / prune-helper wording contaminates the story. Consistent with ST-01 AC10.
- **AC4 teaches finding 2 parity for both cardinalities** (selecting a `maxOccurs: 1` branch or adding a `maxOccurs > 1` occurrence satisfies `xsd_choiceMinOccurs` immediately). Matches ST-01 AC6 / ST-02 AC5.
- **The QA plan's structural claims hold.** `docs/reference/field-metadata.md` has `## Structure` with `### choice` (line 204) before `### attributes` (line 225), and the `### autoAddMinOccurs`-after-`### maxOccurs` precedent exists (lines 79, 96), so AC5's placement instruction is sound. `docs/.vitepress/config.ts` sets no `ignoreDeadLinks`, so VitePress's dead-link check genuinely guards the cross-links (AC1, AC5).
- **No snippet type-check harness exists.** No twoslash, no snippet-extraction/type-check tooling under `docs/` or `scripts/`; the `<<<` includes embed real source without type-checking fenced blocks. The QA planner's "no harness" premise is accurate.
- **Dependencies are explicit and honest.** ST-01 and ST-02 named as hard deps (both cardinalities); the ST-03 cross-link coupling and its "hold rather than merge a dead link" handling are spelled out.

**Ruling on the flagged item (AC2 "runnable"): ACCEPTED.** Verified the "no harness exists" premise directly (no twoslash, no snippet extractor, no type-check-on-build for fenced markdown). Given that, reading "runnable" as "syntactically valid and consistent with the shipped API surface (exact prop/flag names, correct signature shapes), verified by the grep checks plus a one-time manual `vue-tsc --noEmit` compile of scratch files against the ST-01/ST-02 types" is the correct operative bar. Introducing a snippet-type-check harness for one docs story would be disproportionate. The reading is sound as written; it is a pragmatic scoping of an otherwise-unverifiable adjective, not a softening of the criterion.

**Findings:**

1. **[should-fix] The story does not carry the DECIDED Q8 grouped-order caveat, and its Design reference points the doc author at the interleaved prototype panels.** `#multi-add-buttons` and `#multi-dropdown` draw occurrences in interleaved insertion order, but DECIDED (Jeroen, 2026-09-10, Q8) is grouped-by-branch order derived purely from the value tree; ST-02's Design reference records this explicitly, ST-04's does not. No AC or QA check guards the `maxOccurs > 1` snippet against reproducing the interleaved order, so the page could silently teach a shape the engine does not produce, exactly the kind of contradiction of an approved contract lite review exists to catch. Routed as PROPOSED edits in the Design reference and in AC2's QA mapping (a grouped-order editorial check).

2. **[nit] AC3's "the key may remain present in raw `values`" is ambiguous about which key.** The feature spec's concrete residue is `launchApproach: { selfServe: undefined }` (the choice parent key `launchApproach` remains, holding the branch key with an `undefined` value). At prose granularity this is acceptable, but the doc author should mirror ST-01 AC10's concrete example shape so a reader is not left guessing whether it is the branch key or the choice key that lingers.

3. **[nit] The linked worked example (AC1) demonstrates only the `maxOccurs: 1` case.** `FormExampleClientOnboardingPlanner.vue`'s launch-approach step is `maxOccurs: 1`, so the cross-linked "worked demonstration" covers one of the two cardinalities; the `maxOccurs > 1` case rests entirely on AC2's minimal inline snippet. Acceptable given AC2 covers it, but worth a one-line acknowledgement in the section so a reader seeking a full repeatable worked example is not sent to a page that does not contain one.

## Implementation notes

Implemented as specified, docs-only, no `packages/core/src/` file touched, no changeset (confirmed via `git status` after the full pipeline run: only `docs/examples/choices.md`, `docs/reference/field-metadata.md`, and this spec file changed).

- Added the "Select first, then fill in" H2 section to `docs/examples/choices.md`, inserted after "Choice Structure" and before "Full Metadata" per the QA plan's placement instruction. Covers AC1 (explains all five identifiers plus the shared-primitives table, links to the migrated `FormExampleClientOnboardingPlanner.vue` example via `docs/examples/advanced.md`), AC2 (two minimal, self-contained `ts`/`vue` snippets, one per cardinality, each with metadata + a slot snippet using the real primitives), AC3 (residue contract stated as ADR-3 option (a): cleared to `undefined`, key may remain present with an example shape mirroring ST-01 AC10's `contactMethod: { email: undefined }`, occurrence counting/`xsd_choiceMinOccurs` unaffected, `removeNullValues(values)` named as the submit-time cleanup and cross-referenced to the real `handleSubmit`), AC4 (parity of `xsd_choiceMinOccurs` satisfaction stated for both cardinalities), and both edge cases (distinct `###` subheadings per cardinality so a `maxOccurs: 1`-only reader can stop after the first snippet; "no widget" stated explicitly, not just implied).
- Added a `### explicitChoiceSelection` entry to `docs/reference/field-metadata.md`, placed immediately after `### choice` and before `### attributes`, matching the `autoAddMinOccurs`-after-`maxOccurs` precedent (type/default line, one-sentence description, short code example, one-line pointer link to the new anchor). Covers AC5.
- Deviation from the story's illustrative snippet shape (recorded, not silent): the `maxOccurs > 1` snippet's `-choice` slot only renders per-branch add buttons plus a single `<slot />` for the occurrence fields; per-occurrence wrapping (kind badge, remove button) is a *separate* `default-choice-item` slot template, not manual iteration of `activeChoiceOccurrences` inside the `-choice` slot. This follows the real architecture (`*-choice-item`/`default-choice-item` slot, `ChoiceItemAttributes` with `branchKey` + `removeItem`) verified against `packages/core/src/components/DynamicFormItemChoice.vue` and `DynamicFormTemplate.vue`, not the earlier prototype-era assumption that the choice-level slot alone renders everything. `activeChoiceOccurrences` is used in the `-choice` slot only for the count and `canAddChoiceOccurrence` gating, consistent with how the real `ChoiceSectionCard.vue` / `AdvancedFormTemplate.vue` do it today.
- Q8 grouped-order caveat (finding 1) honored: the `maxOccurs > 1` prose states the grouped-by-branch-declaration-order-then-index contract explicitly, with a worked example (`crmExport`, `apiEndpoint`, `crmExport` added in that click order still yields both `crmExport` occurrences before `apiEndpoint`), and warns against assuming click/insertion order. No interleaved-order prose or snippet ordering was introduced.
- Nit 2 (ambiguous residue key) addressed: the residue example is spelled out concretely (`contactMethod: { email: undefined }`), naming the branch key as the one that lingers under the still-present choice-parent key.
- Nit 3 (linked worked example covers only `maxOccurs: 1`) addressed: the section states outright that the linked example covers the `maxOccurs: 1` case only and that the `maxOccurs > 1` snippet is illustrative rather than backed by a published worked example, so a reader is not misled into expecting a full `maxOccurs > 1` demo behind the link.
- Cross-link re-verification (per the story's own noted coupling): ST-03 has already shipped on this branch (commit `b161183`). Verified directly: `pnpm docs:build`'s dead-link check passed (validates both the `/examples/advanced` link and the `/examples/choices#select-first-then-fill-in` anchor from the reference page), and the built `docs/examples/advanced.md` page's embedded metadata include shows `explicitChoiceSelection: true` with no `changeChoice`/`selectedLaunchApproach` remnant, confirming the link lands on the real migrated example, not the old workaround.
- AC2 "runnable" reading: followed the story's own accepted reading (syntactically valid and consistent with the shipped API surface). Verified via the identifier greps (all five names present, exact casing) plus a one-time manual `vue-tsc --noEmit` compile: both snippets' metadata shapes and both slot-prop destructurings (`ChoiceAttributes<Cfg>`, `ChoiceItemAttributes<Cfg>`) were pasted into a temporary file inside `packages/core/src/` (deleted immediately after, confirmed via `git status` showing no leftover file) and compiled clean against the real, shipped ST-01/ST-02 types.
- No `specs/components.md` change: this story documents already-shipped public surface (ST-01/ST-02 own that update), adds no new library export, per the story's own architecture reference.

Pipeline: `pnpm -r run ci` (test + lint + typecheck) passed for both `packages/core` (488 tests, matching the stated baseline exactly) and `packages/element-plus` (1 test). `pnpm -r ci:test:coverage` reported `packages/core` at 96.82%/92.52%/96.2%/96.82%, identical to the stated baseline, confirming this story left `packages/core/src` untouched. `pnpm docs:build` completed clean (dead-link + anchor checks passed). Screenshots taken via Playwright against a local `vitepress dev` server, both light and dark VitePress color modes, for the new choices.md section (overview/table, both cardinality subsections) and the new field-metadata.md entry: all render correctly with proper syntax highlighting, no broken markdown, and the two cardinalities visually separated under distinct `###` headings.

One QA-plan mechanical check is a known false positive, not a real violation: the checklist's kebab-case grep (`-choice=` etc.) also matches the framework's own slot names (`#default-choice`, `#default-choice-item`), which are hyphenated by design (`DynamicFormTemplate.vue`'s `SlotsFromMetadata` type uses hyphenated slot-name string literals like `'default-choice'`, mirroring the already-shipped `AdvancedFormTemplate.vue`, which trips the identical grep pattern on its own `#heading-choice`/`#default-choice`/`#wizardPage-choice` slot usages). No actual kebab-case prop/attribute binding (e.g. `:add-choice-occurrence=`) appears anywhere in the new content; verified by inspection alongside the grep.

## Verification report

**Verdict: PASS.**

### Pipeline results

- `pnpm -r run ci` (test + lint + typecheck): green. `packages/core` 22 test files, **488 tests passed** (exact match to the ST-03 baseline). `packages/element-plus` 1 test passed. Lint and typecheck clean for both packages.
- `pnpm -r ci:test:coverage`: `packages/core` **96.82% / 92.53% / 96.2% / 96.82%** (stmts/branch/funcs/lines), matching the stated baseline (96.82%/92.52%/96.2%/96.82%) to within floating rounding on branch coverage (92.53 vs 92.52, not a drop). No coverage impact, as expected for a docs-only story.
- `pnpm docs:build`: completed clean, VitePress dead-link checker passed (no `ignoreDeadLinks` override exists, so this is a real guard), confirming both the `/examples/advanced` cross-link and the `/examples/choices#select-first-then-fill-in` anchor link from `field-metadata.md` resolve.
- `git diff --stat b161183 -- packages/core/src/` (the ST-03 commit): empty. `git status --porcelain` shows only `docs/examples/choices.md`, `docs/reference/field-metadata.md`, and this spec file changed. No `packages/core/src/` touched, confirming the developer's report.
- `.changeset/` contains only the two pre-existing entries from ST-01/ST-02; no new changeset added, correct since this story touches no `packages/core/src/` file.
- `git diff b161183 -- specs/components.md`: empty, confirming no change, as the architecture reference requires (already-shipped surface, no new export).

### Acceptance criteria

| AC | Check | Result |
| --- | --- | --- |
| 1. `choices.md` gains the section, explains `explicitChoiceSelection` + 4 slot props, links to migrated example | Read the new "Select first, then fill in" section end to end; all 5 identifiers present and explained in prose (not just name-dropped), legend table accurate; link to `/examples/advanced` present and resolves (`docs:build` dead-link check). | Pass |
| 2. Both cardinalities with runnable, minimal code | Two distinct `ts` + `vue` snippet pairs, one per cardinality, self-contained. Independently pasted both snippets' type usage (`ChoiceAttributes<Cfg>`, `ChoiceItemAttributes<Cfg>`, both metadata shapes) into a scratch file under `packages/core/src/` and ran `npx vue-tsc --noEmit`: compiled with zero errors against the real shipped types. Scratch file deleted after, `git status` confirms no leftover. | Pass |
| 3. Clear-on-switch / ADR-3 option (a) documented honestly | Section states all four clauses: cleared to `undefined`, key may remain (`contactMethod: { email: undefined }`, mirrors ST-01 AC10's concrete shape), occurrence counting/`xsd_choiceMinOccurs` unaffected, `removeNullValues(values)` named as submit-time cleanup with a link to the real `handleSubmit`. `grep -n "removeNullValues" docs/examples/choices.md` finds 2 hits. Cross-checked residue wording against ADR-3 and ST-01 AC10/AC4 verbatim: consistent, no reintroduction of the rejected "clean removal" framing. | Pass |
| 4. `xsd_choiceMinOccurs` parity for both cardinalities | Both subsections state selection/adding satisfies the rule immediately, branch's own required fields enforce separately. Verified this is not just asserted but true: read `DynamicFormItemChoice.vue`'s `effectiveValuesCount` computed (lines 294-303) and `DynamicFormItemChoice.validation.test.ts`'s AC6 parity block (lines 552-641) plus the ST-02 repeatable parity test — both confirm exactly the behavior the docs describe, for both cardinalities. `grep -n "xsd_choiceMinOccurs"` finds 4 hits in the new section. | Pass |
| 5. `field-metadata.md` documents `explicitChoiceSelection` | New `### explicitChoiceSelection` entry present, immediately after `### choice` and before `### attributes` (matches the `autoAddMinOccurs`-after-`maxOccurs` precedent). States type `boolean`, default `false` (absent), one-line pointer link to the choices anchor. Anchor confirmed correct in the built HTML (`href="/examples/choices#select-first-then-fill-in"` matches the actual generated heading id `select-first-then-fill-in`). | Pass |

Edge cases: the two cardinalities sit under distinct `###` subheadings, so a `maxOccurs: 1`-only reader can stop after the first. "No widget" is stated explicitly in prose ("The engine ships no widget for this: cards, a `<select>`, per-branch 'Add' buttons, are all template-author code built on these four primitives"), not just implied.

### Independent API cross-check (read the real source, not the story's description of it)

Read `packages/core/src/components/DynamicFormItemChoice.vue`, `DynamicFormTemplate.vue`, and `packages/core/src/types/FieldMetadata.ts` directly and compared every name/signature the docs use against the shipped code:

- `explicitChoiceSelection?: boolean` — matches `FieldMetadata.ts:135`, excluded from `ComputedPropsFieldType` at line 232, exactly as the reference doc states.
- `ChoiceAttributes<TMetadataConfiguration>` (`DynamicFormTemplate.vue:113-124`) — `addChoiceOccurrence: (branchKey: string) => void`, `removeChoiceOccurrence: (branchKey: string, index?: number) => void`, `canAddChoiceOccurrence: (branchKey: string) => boolean`, `activeChoiceOccurrences: ChoiceOccurrence[]` all match the docs' legend table signatures verbatim.
- `ChoiceOccurrence` (`DynamicFormTemplate.vue:106-111`): `{ branchKey: string; index: number }` — matches the docs' inline type exactly.
- `ChoiceItemAttributes<TMetadataConfiguration, FieldType>` (`DynamicFormTemplate.vue:132-138`) extends `ItemAttributes` and adds `branchKey: string` — matches the `maxOccurs > 1` snippet's `default-choice-item` slot usage (`branchKey`, `removeItem` from the base `ItemAttributes`).
- The `-choice-item` / `default-choice-item` slot fallback and template dispatch (`DynamicFormTemplate.vue:163,181,221-222`) matches the docs' description of the fallback chain.

No stale provisional name (`changeChoice`, `selectedOption`) survived anywhere in the new content.

### Q8 grouped-order contract (binding DECIDED entry, finding 1)

Verified both the prose and the runtime match. The `maxOccurs > 1` section states: "`activeChoiceOccurrences` is grouped by branch declaration order, then by index within the branch, derived purely from the value tree; it is never global insertion order," with a worked example matching the docs' own metadata declaration order (`crmExport` before `apiEndpoint`). Cross-checked against `DynamicFormItemChoice.vue`'s `activeChoiceOccurrences` computed (lines 259-288, outer `forEach` over `field.value.choice` = declaration order, inner `forEach` over each branch's own field array = index within branch) and against the actual ST-02 test `(AC4) activeChoiceOccurrences is grouped by branch declaration order, then index within branch` (`DynamicFormItemChoice.logic.test.ts:1335-1358`), which clicks crmExport → apiEndpoint → crmExport against a metadata declaring `apiEndpoint` before `crmExport` and asserts the grouped (not click-order) result `[apiEndpoint, crmExport, crmExport]`. The docs neither reproduce nor imply the prototype's interleaved insertion order anywhere in this section.

### Cross-link to the migrated example

`docs/examples/advanced.md` → `FormExampleClientOnboardingPlannerContext.vue` → `FormExampleClientOnboardingPlanner.vue`. Confirmed the linked component's `launchApproach` step sets `explicitChoiceSelection: true` (line 342) and its `handleSubmit` calls `removeNullValues(values)` (lines 212-220), with no `changeChoice`/`selectedLaunchApproach` remnant anywhere in the file (grep confirms zero hits). The link target's actual demo is accurate and matches what ST-04's prose claims.

**One finding outside this story's own scope, noted for Jeroen rather than blocking this story:** `docs/examples/advanced.md`'s own "What It Demonstrates" bullet list (line 9, pre-existing prose untouched by ST-03 or ST-04: `git show b161183 -- docs/examples/advanced.md` is empty) still reads "`choice` branches with a custom change handler and icon labels," which describes the pre-migration `changeChoice` workaround, not the new `explicitChoiceSelection`/`addChoiceOccurrence` mechanism ST-03 actually shipped in that same file's embedded component. This is stale summary prose left over from before this feature, in a file neither ST-03 nor ST-04's architecture reference lists as touched, so it is not a defect introduced by this story and not something ST-04 was ever scoped to fix. Flagging it as a should-fix for a follow-up (either amending ST-03 or a `/spec:quick` docs fix), since a careful reader could be told by `advanced.md`'s own bullet list that the choice mechanism is still a hand-rolled callback right above a demo that in fact uses the framework-native primitives.

### Regression check

Diff of both files against the ST-03 commit is purely additive: `docs/examples/choices.md`'s existing "What It Demonstrates", the `FormExampleChoiceFields.vue` embed, "Choice Structure", and "Full Metadata" sections are byte-identical; `docs/reference/field-metadata.md`'s existing entries (including `### choice` and `### attributes` immediately around the new insertion point) are byte-identical. No existing line was touched.

### Prose/mechanical compliance

- Em dash check: `grep -rn '—' docs/examples/choices.md docs/reference/field-metadata.md` finds hits, but every one falls in pre-existing, untouched lines (confirmed against the diff); zero em dashes appear in the new content added by this story.
- Kebab-case check: the only matches for the story's grep pattern are the framework's own hyphenated slot names (`#default-choice`, `#default-choice-item`), which are correct by design (`SlotsFromMetadata`'s slot-name string literals are hyphenated; `#default-choice-item` is a real, shipped slot name, not a kebab-case prop/attribute binding). No actual kebab-case prop binding (e.g. `:add-choice-occurrence=`) appears anywhere in the new content. Confirmed by inspection of both fenced Vue blocks: all bindings (`:disabled`, `:key`, `@click`) and destructured slot props are camelCase.
- Manually opened both changed pages via `pnpm --prefix docs dev` and screenshotted the new "Select first, then fill in" section (both cardinality subsections) and the new `explicitChoiceSelection` reference entry in both light and dark VitePress color modes via Playwright: both render correctly, proper syntax highlighting on all `ts` and `vue` fences, no broken Markdown, the two cardinalities visually separated under distinct `###` headings.
- Process compliance: no `packages/core/src/` file touched, no changeset added (correctly, per architecture reference), `specs/components.md` unchanged (correctly, no public surface added), no undocumented exports, all API names verified against real shipped code rather than trusting the story's own description of it, no silent deviation from the feature's approved architecture/design.

### Summary

ST-04 does exactly what its spec requires: it documents the already-shipped `explicitChoiceSelection` mechanism accurately, teaches the DECIDED Q8 grouped-order contract correctly (not the prototype's interleaved illustration), documents the ADR-3 option (a) residue contract in the exact accepted wording, states `xsd_choiceMinOccurs` parity correctly for both cardinalities as verified against the real tests, and links to a genuinely migrated worked example. All five API identifiers match the real, shipped code exactly, verified independently against `DynamicFormItemChoice.vue`, `DynamicFormTemplate.vue`, and `FieldMetadata.ts` rather than trusting the story's own account. Full pipeline green, coverage unchanged, `docs:build` clean, diffs purely additive. One pre-existing, out-of-scope stale-prose issue in `docs/examples/advanced.md` (not owned by this story) is flagged above for a follow-up.

ST-01 through ST-04 are now all `done`. ST-05 ("Preserve-on-switch") is currently `approved` but not yet implemented, so the feature itself should stay `in-progress` until ST-05 also completes; it is not this story's last open item.

**Reminder for Jeroen:** please fill in the `pr` field in this story's frontmatter once the PR is opened.
