---
id: ST-03
type: story
feature: FEAT-013
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Starter template docs reference/guide split

## Functional
### User story
As a docs reader of `vue-dynamic-form.bach.software` who wants to look up the starter template's exact API surface (props, slots, field-type catalogue, `extendMetadata` generics, and the full `--sft-*` theming contract), I want that detail on a dedicated reference page separate from the how-to guide, so that I can look things up the same way I already do for the core library, without reading narrative walkthrough prose to find a table.

### Acceptance criteria

1. **New reference page exists and is linked from the reference index.**
   Given `docs/reference/index.md`'s "In this section" table,
   When this story ships,
   Then it gains a row for a new `docs/reference/starter-template.md` page, in the same table format as the existing rows (link + one-line "what it covers" description).

   **PROPOSED (adversarial review):** the new page must also be added to `docs/.vitepress/config.ts`'s `/reference/` sidebar `items` array, alongside the existing reference pages (Overview, defineMetadata(), DynamicFormTemplate, DynamicForm, FieldMetadata, useValidatePartialForm), so it appears in the persistent reference sidebar like every other `/reference/*` page. Without this, the page is reachable only from the index table and a direct URL, which breaks the user story's "same way I already do for the core library" navigation promise, and AC7's dead-link check would not catch the omission (a missing nav entry is not a broken link). This fills a boundary the feature architecture left to story prep (its Documentation impact names only `docs/reference/index.md`); it does not contradict the approved architecture, so no feature amendment is required.

2. **The reference page documents the starter's existing public surface.**
   Given `docs/reference/starter-template.md`,
   When read,
   Then it documents, as a lookup reference (tables/short sections, not a walkthrough): `StarterFormTemplate`'s `metadataConfiguration` prop; the full slot family the template exposes and the priority-fallback rule (dedicated per-type slot -> matching `default-*` -> `default`), mirroring the structure already used on `docs/reference/dynamic-form-template.md`; the built-in field-type catalogue table (`text`, `select`, `checkbox`, `password`, `heading`, `grid`, `wizardSummaryPage`); and the `extendMetadata<ValueTypes, FieldProperties, SlotProperties, SettingsProperties>()` generics, including the "your declaration wins on a collision" and "`input` is reserved" caveats.

3. **The reference page carries the complete `--sft-*` contract table.**
   Given ST-02's README contract table (all 55 variables, purpose, default value, semver rule),
   When `docs/reference/starter-template.md` is written,
   Then it carries the same table content, mirrored rather than re-derived from scratch, plus the same stated semver rule (add = minor, rename/remove = major).

4. **The guide is trimmed to narrative/how-to content and points to the reference page.**
   Given `docs/guide/starter-template.md`,
   When this story ships,
   Then its "Theming with CSS variables" section no longer contains the full variable list; it is replaced by a short how-to (the existing CSS override example is fine to keep) plus an explicit link to `docs/reference/starter-template.md` for the complete `--sft-*` table and semver rule.

5. **No API-reference content is silently dropped.**
   Given every fact currently stated in the guide's "Theming with CSS variables" and "What you get" sections,
   When the split is complete,
   Then each fact appears somewhere in `docs/reference/starter-template.md` (nothing lost in the move; the guide may keep a short summary alongside its link, but the authoritative detail lives on the reference page, not duplicated in full on both).

6. **The guide keeps its walkthrough sections, pointing to the reference page for full detail.**
   Given the guide's "Install", "Stylesheet", "Basic usage", "Grid layout", "Overriding parts of the template", "Icons", and "Adding your own field types" sections,
   When this story ships,
   Then each keeps its narrative/how-to content and examples, and each section that now has a fuller counterpart on the reference page (slots, field types, `extendMetadata`) links to it instead of re-stating the full table inline.

7. **The docs site builds clean.**
   Given `pnpm docs:build`,
   When run after this story's changes,
   Then it completes with no errors and no dead-link warnings, including the new cross-links between the guide, the reference page, and `docs/reference/index.md`.

### Edge cases
- A reader who lands on the trimmed guide page first and never visits the reference page can still complete a basic retheme using the guide's kept CSS-override example; they only miss the *complete* list, which the guide's link makes easy to find.
- The reference page's theming table must not drift from the README's (ST-02): write it as a mirror of that table's content, not an independent re-derivation, so a future token addition only has two places to update (README, this page), not three different prose descriptions.

### Out of scope
- `packages/starter/README.md` itself: owned by ST-02; this story only mirrors its final table content, does not edit the README.
- Any change to `packages/starter/src/`: this story is docs-only, no changeset.
- Any new UI pattern, example, or Storybook story: this is a table-and-prose restructure of existing content, matching the feature's "Design (feature level)" skip rationale.

## Design reference
Not applicable. No prototype exists for this feature. The feature's "Design (feature level)" section states explicitly that even a "yes" to the docs-reference-page question is table-and-prose, not a new UI pattern, so this story needs no visual design.

## Architecture reference
Implements the feature architecture's **Slice C** (Slicing seams) and the Documentation impact's two `docs/` bullets, in full:

- **`docs/reference/starter-template.md` (new).** Mirrors the core library's existing `docs/guide/*` vs `docs/reference/*` split (see `docs/reference/dynamic-form-template.md` for the structural pattern this page follows: Props, Slots Overview with the priority-fallback chain, then per-area detail sections). Becomes the API-reference home for the starter's existing public surface that today is documented only inline in the guide (`StarterFormTemplate` props/slots, `extendMetadata`'s generics), plus the new `--sft-*` contract table (mirroring ST-02's README table, not duplicating its prose independently). Added to `docs/reference/index.md`.
- **`docs/guide/starter-template.md` (modified), trimmed to a pure guide.** The existing "Theming with CSS variables" section's full content and the "What you get" section's API-detail tables move to the new reference page; the guide keeps narrative/how-to content (install, stylesheet import, basic usage, grid-layout walkthrough, overriding-parts walkthrough, icon walkthrough, adding-field-types walkthrough) and points to `docs/reference/starter-template.md` for the full variable list and API surface, matching how the core library's `docs/guide/*` pages already point to `docs/reference/*` (e.g. `docs/guide/building-templates.md` -> `docs/reference/dynamic-form-template.md`).
- **Exact content-boundary note (story-level operationalization, not a feature-level decision):** the feature architecture names "Theming with CSS variables" and "the existing public surface... currently only documented inline in the guide" as the content that moves; it does not enumerate guide-section-by-guide-section which prose stays. This story's own reading, recorded here rather than left implicit: "Grid layout," "Overriding parts of the template," and "Icons" keep their walkthrough prose and examples in the guide (they are how-to content, not pure catalogues), while their underlying catalogue facts (the slot family, the field-type table, the grid-property definitions already summarized in "What you get") move to or are mirrored on the reference page. This does not overturn any feature-level decision; it only fills in a boundary the architecture left to story prep, per `specs/README.md`'s rule that only deltas beyond the feature architecture are worked out at story level.
- **Public API surface touched:** none. This story documents already-shipped surface (ST-01's tokens, the pre-existing `StarterFormTemplate`/`extendMetadata` surface); it adds no new library export.
- **Dependencies on other stories:** depends on ST-02 for the frozen `--sft-*` table content this page mirrors. Per the feature's own slicing-seams note, the restructuring work itself (creating the new page's non-theming sections, trimming the guide's narrative) can start in parallel with ST-01, but the theming table section cannot be finalized, and this story cannot be verified complete, until ST-02 has shipped its table.

## QA plan

### Test type summary
This story only adds and edits VitePress `.md` prose and tables (`docs/guide/starter-template.md`, new `docs/reference/starter-template.md`, `docs/reference/index.md`). It touches no `.vue` file, no composable, and nothing under `packages/*/src`, so there is no `DynamicFormItem`/`computedProps`/validation wiring, no component render surface, and nothing for a `*.logic.test.ts`, `*.validation.test.ts`, or `*.analytics.test.ts` file to exercise; those conventions describe component and composable behaviour, not prose.

`docs/` has its own `vitest` setup (`pnpm docs:test`, CLAUDE.md), which today covers two things: pure framework-free `.ts` helper modules under `docs/.vitepress/theme/components/__tests__/`, and one structural guard, `docs/.vitepress/theme/__tests__/dogfood.test.ts`, which reads theme `.vue`/`.ts` files as plain text and asserts substrings and class usage with `node:fs`, no `jsdom`, no `@vue/test-utils`. It has never parsed `.md` prose before, but the same "read the file as text, assert a structural fact" technique is exactly what `packages/starter/src/__tests__/readme.test.ts` already does on a Markdown file (`packages/starter/README.md`): plain substring checks, no Markdown parser. This plan reuses that same pattern for a new file, `docs/.vitepress/theme/__tests__/starterTemplateDocs.test.ts`, a plain `*.test.ts`, framework-free, fitting squarely inside the existing `pnpm docs:test` scope.

That new test only asserts facts a plain-text/regex check can actually prove: a heading exists, a string is present or absent, two tables' name columns are the same set. It deliberately does not try to assert facts that need a human judgment or the build tool itself ("nothing was lost in the move," "the prose is accurate," "the site builds without errors"); those are routed to "Untestable criteria" and the manual checklist below instead of being faked by a brittle regex that would pass without proving the claim.

### Acceptance criterion to test map
| AC | Check | Type |
| --- | --- | --- |
| 1. New reference page linked from the reference index, same table format | Automated: `starterTemplateDocs.test.ts` reads `docs/reference/index.md` and asserts the "In this section" table contains a row linking to `/reference/starter-template` with a non-empty "what it covers" cell. | `*.test.ts` |
| 2. Reference page documents the existing public surface (props, slots + priority fallback, field-type catalogue, `extendMetadata` generics + caveats) | Automated (presence only): `starterTemplateDocs.test.ts` reads `docs/reference/starter-template.md` and asserts it contains: a `## Props` section mentioning `metadataConfiguration`; a slots section listing the per-type slot family and the fallback chain (dedicated slot, then a `default-*` slot, then `default`); a field-type table with all seven rows (`text`, `select`, `checkbox`, `password`, `heading`, `grid`, `wizardSummaryPage`); an `extendMetadata<` generics signature; and both caveat substrings (the "wins on a collision" rule and `input` being reserved). Manual: the prose is *accurate*, not just present (see Untestable criteria). | `*.test.ts` + manual |
| 3. Reference page carries the complete `--sft-*` contract table, mirrored from ST-02's README table, same semver rule | Automated: `starterTemplateDocs.test.ts` extracts the name column (`--sft-[\w-]+` tokens) from both `packages/starter/README.md`'s contract table and `docs/reference/starter-template.md`'s table and asserts the two sorted sets are identical and have exactly 55 entries; separately asserts the reference page states both the "adding a variable is a minor change" and "renaming or removing one is a major change" directions. **Blocked on ST-02**: the README table does not exist yet (ST-02 is `awaiting-approval`), so this test can be written now but only turns green once ST-02 ships its table; see Regression risk. | `*.test.ts` |
| 4. Guide trimmed: "Theming with CSS variables" no longer carries the full list, keeps a short how-to + link | Automated: `starterTemplateDocs.test.ts` reads `docs/guide/starter-template.md` and asserts its theming section does not contain any `--sft-radius-` or `--sft-font-size-` token (the signal that the full list moved out), still contains the kept CSS-override example (an `--sft-accent:` line), and links to `/reference/starter-template`. | `*.test.ts` |
| 5. No API-reference fact silently dropped (guide's old "Theming" + "What you get" content all lands somewhere on the reference page) | Manual: diff the pre-change guide text (current `docs/guide/starter-template.md`, read above) against the new reference page and confirm every fact (field-type table rows, structural-shapes list, field-properties list, settings line, full variable list) has a home on the reference page, directly or as a mirrored table. Partially corroborated by AC2/AC3's automated presence checks, which cover the field-type table and the variable table specifically, but the exhaustive "nothing lost" claim needs a human reading both versions side by side, not a regex. | Manual |
| 6. Guide keeps its walkthrough sections (Install, Stylesheet, Basic usage, Grid layout, Overriding parts of the template, Icons, Adding your own field types), linking to the reference page where a fuller counterpart now exists | Automated: `starterTemplateDocs.test.ts` asserts all seven headings are still present in `docs/guide/starter-template.md`, and that the "Overriding parts of the template," "What you get" (or wherever the field-type table lived), and "Adding your own field types" sections each contain a link to `/reference/starter-template`. | `*.test.ts` |
| 7. `pnpm docs:build` completes with no errors and no dead-link warnings, including the new cross-links | Manual/CI, not a unit test: run `pnpm docs:build` after the story's changes and confirm a clean exit with no dead-link warnings in the output. VitePress's default `ignoreDeadLinks` setting is unset in `docs/.vitepress/config.ts`, so the build itself already fails on a broken internal link; that is the actual verification mechanism for this AC, not something a `vitest` file can usefully duplicate. | Manual |

### Edge cases to checks
- A reader who only reads the trimmed guide can still complete a basic retheme from the kept CSS-override example alone: manual, read the guide in isolation (ignore the reference-page link) and confirm the kept example is self-contained and correct on its own.
- The theming table must mirror ST-02's README table, not re-derive it independently, so a token addition only needs two edits (README, reference page): this is exactly what AC3's automated name-set-equality test guards. Treat that test as the primary machine-checked protection for this edge case, the same drift risk ST-02's own spec flagged for the README-vs-`CONTRACT_VARIABLES` relationship.

### States from the feature's states policy applicable to this slice
Not applicable. No `.vue` file, no component render surface, no new or modified UI state in this story.

### Reactivity / analytics
Not applicable. No `DynamicFormItem`, `computedProps`, or validation wiring touched; nothing in this story renders or re-renders in the browser.

### Coverage
No impact on `pnpm -r ci:test:coverage`. That script only covers `packages/*` under the pnpm workspace (`pnpm-workspace.yaml` lists only `packages/*`); `docs/` is excluded from the workspace entirely and this story touches zero files under `packages/*/src`, so the statement/branch/function coverage baseline is mechanically untouched regardless of what this story does. The new `docs/.vitepress/theme/__tests__/starterTemplateDocs.test.ts` itself is not coverage-tracked either (`docs/`'s own `pnpm docs:test` coverage is not tracked by codecov, per CLAUDE.md). Nothing is knowingly left uncovered, because there is no executable library code in this story's diff to cover.

### Time sensitivity
None. No date- or time-dependent content anywhere in this story's diff.

### Regression risk
- `docs/guide/starter-template.md` is linked from the main nav sidebar (`docs/.vitepress/config.ts`, `/guide/` sidebar) and from `docs/examples/extending-starter.md`. Both links point at the page itself, not an anchor, and the page is not being renamed or moved, so neither link breaks from this story. A grep for inbound links to the old `#theming-with-css-variables` anchor found none today, so trimming/retitling that section carries no known dead-anchor risk, but re-check after editing in case a link was added elsewhere during ST-01/ST-02.
- **Sidebar nav gap, flagged for awareness, not an AC in this story**: `docs/.vitepress/config.ts`'s `/reference/` sidebar lists every existing reference page individually (`Overview`, `defineMetadata()`, `DynamicFormTemplate`, `DynamicForm`, `FieldMetadata`, `useValidatePartialForm`). AC1 only requires a row in `docs/reference/index.md`'s table, not a `config.ts` sidebar entry; without one, the new page is reachable from the index table and direct URL but absent from the persistent sidebar every other reference page gets, which is inconsistent with the existing convention and not caught by AC7's build/dead-link check (a missing nav entry is not a dead link). Recommend the developer add the `config.ts` sidebar entry anyway, and flag this gap to adversarial review as a possible should-fix on the acceptance criteria themselves, since it is a scope question (what "linked from the reference index" should cover), not a test-design question.
- `docs/reference/index.md`'s table currently has four rows; adding a fifth risks a malformed Markdown table (misaligned pipes) if hand-edited. Guarded by AC1's automated row-presence check plus a manual look at the rendered page (malformed tables usually still "build" in VitePress, just render wrong, so the build step alone would not catch this).
- This story depends on ST-02's frozen table content (AC3) and does not modify `packages/starter/README.md`, `packages/starter/src/__tests__/themeScope.test.ts`, or any other story's files, so no existing test in those stories is at risk from this story's diff.
- `docs/.vitepress/theme/__tests__/dogfood.test.ts` and the `docs/.vitepress/theme/components/__tests__/*.logic.test.ts`/`*.test.ts` files are untouched by this story and guard the docs theme's own component/render behaviour; none of them reads the two `.md` files this story changes, so they neither catch nor are put at risk by this story's edits.

### Untestable criteria and rewrite proposals
No acceptance criterion needs a wording rewrite; all seven state a precise, checkable claim. Three are only partially automatable, for reasons specific to what a plain-text/regex check can prove, not vague wording:
1. **AC2 and AC5's "documents accurately" / "nothing lost" claims** are claims about correctness and completeness of prose, not about a string's presence. A regex can prove a heading or a field-type name appears; it cannot prove the surrounding sentence is accurate or that every fact from the old guide text was preserved somewhere. Routed to manual review (AC2's manual half, AC5's manual diff) rather than inventing a brittle "the whole page content equals some expected string" assertion that would be both fragile and not actually prove accuracy.
2. **AC3's table-parity check is blocked on ST-02.** `packages/starter/README.md` does not carry the `--sft-*` contract table yet (ST-02 is `awaiting-approval`), so the automated name-set-equality test can be written now but cannot pass, or be verified as correct, until ST-02 ships its table. Same dependency-timing situation ST-02's own QA plan recorded for its dependency on ST-01.
3. **AC7 is a build-tool outcome, not a unit-testable behaviour.** `pnpm docs:build`'s dead-link check already is the enforcement mechanism; writing a `vitest` file that re-implements Markdown link resolution would duplicate VitePress's own logic worse than VitePress does it. Routed to the manual/CI checklist.

### Manual verification checklist
1. Run `pnpm docs:build` after the story's changes; confirm a clean exit with no errors and no dead-link warnings, including the new guide-to-reference, reference-to-index, and index-to-reference links (AC7).
2. Read `docs/reference/starter-template.md` end to end and confirm the Props/Slots/field-type/`extendMetadata` prose is accurate, not just present, cross-checking against `StarterFormTemplate.vue`'s actual slot names and `metadata.ts`'s actual field-type catalogue (AC2).
3. Diff the pre-change `docs/guide/starter-template.md` (current "Theming with CSS variables" and "What you get" sections) against the new reference page and confirm every fact has a home somewhere, with nothing duplicated in full on both pages (AC5).
4. Confirm the kept CSS-override example in the guide's trimmed theming section still works standalone for a reader who never clicks through to the reference page (edge case 1).
5. Once ST-02 ships, re-run the AC3 automated test and also eyeball a handful of rows (`--sft-radius-md`, `--sft-input-border`) to confirm the mirrored table's purpose/default text, not just the name set, matches the README (the automated test only proves the name sets match, not that every cell's prose is byte-identical).
6. Visually check the rendered `docs/reference/index.md` page (both color modes) to confirm the new table row renders correctly, not just that the source Markdown contains the expected substring.
7. Confirm whether a `docs/.vitepress/config.ts` sidebar entry for the new reference page is wanted (see Regression risk); if Jeroen or the adversarial reviewer confirms it should be in scope, verify the developer added it.

## Adversarial review
Lite (story level): blockers only. Facts re-verified against the live tree: `StarterFormTemplate.vue` does expose a `metadataConfiguration` prop (AC2 names it correctly); `extendMetadata` is declared with four generics (`ExtraValueTypes`, `ExtraFieldProperties`, `ExtraSlotProperties`, `ExtraSettingsProperties`), so AC2's `extendMetadata<...>()` signature check is valid; the guide's current "What you get" table lists exactly the seven field types AC2 pins (`text`, `select`, `checkbox`, `password`, `heading`, `grid`, `wizardSummaryPage`); the `extendMetadata` source comment states "On a key collision your declaration replaces the built-in one" and the guide states `input`/`attributes` are reserved, so both AC2 caveats are real; `pnpm docs:test` resolves to `vitest run` inside `docs/` and `docs/.vitepress/theme/__tests__/dogfood.test.ts` already lives in the target directory, so the proposed `starterTemplateDocs.test.ts` placement is valid and framework-free; all seven AC6 headings exist in `docs/guide/starter-template.md` today and match the feature architecture's kept-sections list. All seven ACs are mapped in the QA plan and the ST-02 dependency (AC3) is explicit and correct. No blockers.

1. **Sidebar nav gap: AC1 verifies the index-table row but not the persistent `/reference/` sidebar entry (should-fix, routed).** The user story's whole point is to look things up "the same way I already do for the core library", and in the core library every `/reference/*` page is listed in `docs/.vitepress/config.ts`'s `/reference/` sidebar (Overview, defineMetadata(), DynamicFormTemplate, DynamicForm, FieldMetadata, useValidatePartialForm). AC1 as written is satisfied by the `docs/reference/index.md` table row alone, so a page absent from the persistent sidebar (reachable only from the index table and a direct URL) would still pass, which breaks the "same as the core library" promise for navigation. AC7's build/dead-link check does not catch this (a missing nav entry is not a dead link). This is story-level operationalization, not a feature contradiction: the feature's Documentation impact only names "Added to `docs/reference/index.md`" and does not forbid a sidebar entry, and the story already claims the right to fill boundaries the architecture left to story prep, so no feature amendment is needed. **Routed** as a `PROPOSED (adversarial review)` edit to AC1 below, making the sidebar entry a verified criterion rather than an unenforced QA-plan recommendation. Kept at should-fix, not blocker: the page is still reachable, the gap is an incremental navigation inconsistency, and the fix is additive.

2. **`docs/reference/index.md` row count is miscounted (nit).** Regression risk says the index table "currently has four rows; adding a fifth risks a malformed Markdown table." The table actually carries five data rows (`defineMetadata()`, `DynamicFormTemplate`, `DynamicForm`, `FieldMetadata`, `useValidatePartialForm`), so this story adds the sixth. Harmless to AC1's row-presence test, but correct the count so the malformed-table caution points at the right edit.

3. **AC4's "no longer contains the full variable list" implies a move that is not a move (nit).** The current guide "Theming with CSS variables" section is already a short how-to with a four-colour-variable override example (`--sft-accent`, `--sft-accent-hover`, `--sft-focus-border`, `--sft-focus-ring`) plus two prose paragraphs; it never carried a full `--sft-*` list. The authoritative 55-row table is new content authored on the reference page, mirrored from ST-02's README per AC3, not content lifted out of the guide. The end state AC4 and AC4's automated test describe (short how-to + kept example + link) is correct and checkable as written, so no rewrite is needed, but the "full content moves out of the guide" framing (shared with the feature's Documentation impact bullet) overstates what the guide contains today. Flagged for accuracy; no action required.

Status rationale: no unresolved Open questions (the feature's six are all `DECIDED`; this story has none) and no blockers. The single should-fix (finding 1) is routed as a `PROPOSED (adversarial review)` edit to AC1, which per the status rule does not force discussion. Findings 2 and 3 are nits. This lands at `awaiting-approval`.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
