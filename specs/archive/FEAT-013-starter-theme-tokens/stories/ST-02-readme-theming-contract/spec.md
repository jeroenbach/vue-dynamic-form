---
id: ST-02
type: story
feature: FEAT-013
status: done
approved_by: Jeroen
pr: ""
---

# Story: README theming contract table and semver rule

## Functional
### User story
As a consumer or contributor of `@bach.software/vue-dynamic-form-starter`, I want the README to list every `--sft-*` variable the package exposes, old and new, with its purpose, default value, and a stated semver rule, so that I can see the whole theming surface in one place and know what to expect from a future release before I depend on any of it.

### Acceptance criteria

1. **Complete contract table in the README.**
   Given `packages/starter/README.md`'s "Customization guidance" section,
   When updated,
   Then it contains a table listing every `--sft-*` variable the package declares on `:root` (the 41 pre-existing colour tokens plus the 14 radius/typography tokens ST-01 added, 55 total), each row stating the variable's name, its purpose, and its default value.

2. **Table names match the pinned guard list exactly.**
   Given the table's variable-name column,
   When compared against the `CONTRACT_VARIABLES` array pinned in `packages/starter/src/__tests__/themeScope.test.ts` (ST-01),
   Then the two name sets are identical: no table row without a matching pinned name, and no pinned name missing from the table.

3. **Stated semver rule.**
   Given the same section,
   When read,
   Then it states explicitly, in prose a consumer can act on: adding a `--sft-*` variable is a minor change; renaming or removing one is a major change.

4. **README install/usage sections stay intact.**
   Given the rest of `packages/starter/README.md` (Install, Stylesheet, Bare usage, Overriding a control, Supported slots, Icons, Adding a field type, Exports),
   When this story's diff is reviewed,
   Then none of those sections is altered beyond the "Customization guidance" section itself; the change is additive to that one section.

### Edge cases
- A variable whose purpose spans several unrelated call sites (e.g. `--sft-radius-md`, shared by inputs, the dashed choice group, the wizard alert, and the JSON panel) states its purpose generically enough to cover all of them, rather than naming only one.
- The table does not need to repeat every single call site per variable; "purpose" is a short, accurate description (matching the inline comments ST-01 adds in `style.scss`), not an exhaustive selector list.

### Out of scope
- Any change to `packages/starter/src/` (no stylesheet, no test file, no changeset for this story: `packages/starter/README.md` is not under `src/`, so `CLAUDE.md` step 7's changeset obligation does not apply here).
- The VitePress docs site reference/guide restructure: ST-03.
- Any change to the token names or default values themselves: those are frozen by ST-01.

## Design reference
Not applicable. No prototype exists for this feature; this story is a documentation table, not a visual surface.

## Architecture reference
Implements the feature architecture's **Slice B** (Slicing seams) and the Documentation impact's README bullet, in full:

- **`packages/starter/README.md` (modified), "Customization guidance" section.** Add the complete `--sft-*` contract table (every variable, its purpose, its default value) and the stated semver rule, per the feature's Documentation impact section: "This is the single authoritative list; the README already ships in the tarball, so it is the right home for the contract."
- **Public API surface touched:** none beyond what ST-01 already shipped. This story documents already-shipped surface; it adds no new variable, export, or behavior.
- **No changeset:** `README.md` is outside `packages/starter/src/`, so `CLAUDE.md`'s changeset rule does not trigger for this story's own diff. (ST-01 already carries the feature's one changeset.)
- **Dependencies on other stories:** depends on ST-01 for the frozen set of 14 new token names, their default values, and their grouping/purpose comments (the source this story's table prose draws from). Cannot be written accurately before ST-01 lands with its final names.
- **Downstream:** ST-03's new `docs/reference/starter-template.md` page mirrors this table (not duplicating its prose from scratch), so this story's table content is the source ST-03 reuses.

## QA plan

### Test type summary
This story edits one Markdown file (`packages/starter/README.md`) and nothing under `packages/starter/src/`. The story's own Out of scope section is explicit: "no stylesheet, no test file ... for this story." That is a deliberate constraint, not an oversight, so this plan does not propose a new `*.test.ts`/`*.logic.test.ts`/`*.validation.test.ts`/`*.analytics.test.ts` file, and does not propose adding one anywhere else (e.g. exporting `CONTRACT_VARIABLES` from `themeScope.test.ts` for reuse would itself be a change to `packages/starter/src/`, which is out of scope here). All four acceptance criteria are document-content claims about prose and a table; each is checked manually against the frozen source values, per criterion below.

### Acceptance criterion to test map
| AC | Check | Type |
| --- | --- | --- |
| 1. Complete contract table (55 rows, name/purpose/default) | Manual: enumerate the 55 reference names from two frozen sources (the 41 existing tokens read directly from `packages/starter/src/style.scss`'s `:root` block, and the 14 new tokens from ST-01's AC1 list/the feature's Token naming scheme table, once ST-01 lands with final values). Walk every README table row and confirm: the row exists, the default-value cell matches the source literal exactly (`9999px`, `#0084d1`, etc.), and the purpose cell is non-empty and accurate. Confirm the row count is exactly 55, no more, no fewer. | Manual |
| 2. Table names match `CONTRACT_VARIABLES` exactly | Manual: once ST-01 lands, open `packages/starter/src/__tests__/themeScope.test.ts` and read the pinned `CONTRACT_VARIABLES` array literally. Extract the README table's name column as a sorted list. Diff the two sorted lists by eye (55 entries is small enough to do directly; a throwaway, uncommitted Node one-liner, e.g. `node -e "..."` comparing two pasted arrays, is a fine scratch aid but is not a committed test file). Confirm zero entries in either list that are missing from the other. | Manual |
| 3. Stated semver rule | Manual: read the "Customization guidance" section's new prose and confirm it states, in words a consumer can act on and without hedging, that adding a `--sft-*` variable is a minor change and that renaming or removing one is a major change. Both directions must be present; a rule stating only one direction does not satisfy this AC. | Manual |
| 4. Install/usage sections stay intact | Manual: run `git diff packages/starter/README.md` (or the PR diff) and confirm every changed line falls inside the "Customization guidance" section (its heading through the start of "## Adding a field type or a property"). Confirm the Install, Stylesheet, Bare usage, Overriding a control, Supported slots, Icons, and Exports sections are byte-identical to `main`. | Manual |

None of the four is reachable by an automated assertion without either adding a test file (explicitly out of scope for this story) or depending on an artifact that does not exist yet at review time (`CONTRACT_VARIABLES` is only pinned once ST-01 merges). See "Untestable criteria" below for the full reasoning; this is not a gap left by oversight.

### Edge cases to checks
- A token whose purpose spans several unrelated call sites (e.g. `--sft-radius-md` shared by inputs, the dashed choice group, the wizard alert, and the JSON panel) states its purpose generically: manual check, read each such row's purpose text and confirm it does not name only one of its several call sites. Cross-check against ST-01's inline `style.scss` comment for that token once ST-01 lands (the comment is the source the prose should stay consistent with, not a copy requirement).
- The table need not repeat every call site per variable: manual check that each purpose cell is a short accurate description, not an exhaustive selector list, matching the level of detail in ST-01's inline comments.

### States from the feature's states policy applicable to this slice
Not applicable. No component render surface; this story has no `.vue` file and no new or modified UI state.

### Reactivity / analytics
Not applicable. No `DynamicFormItem`, `computedProps`, or validation wiring is touched; nothing in this story runs in the browser or reactively re-renders.

### Coverage
No impact. `README.md` is not instrumented by `pnpm -r ci:test:coverage` (it is not JS/TS source), and this story adds no test file, so the statement/branch/function coverage baseline for `packages/starter` is expected to stay exactly where it is. Nothing is knowingly left uncovered, because there is no executable code in this story's diff to cover.

### Time sensitivity
None. No date/time-dependent content anywhere in this story.

### Regression risk
- `packages/starter/README.md` is the only file touched; it ships in the npm tarball but is not imported by any code path, so there is no runtime regression surface. The regression risk is entirely editorial: an inaccurate default value or a dropped/duplicated row in the table would mislead a consumer without failing any automated check, since this story deliberately adds none. AC1/AC2's manual checks above are the only guard against that; treat them as load-bearing, not optional, during review.
- `packages/starter/src/__tests__/themeScope.test.ts`'s pinned `CONTRACT_VARIABLES` check (ST-01) remains the sole automated backstop that the *token names themselves* do not drift after this story merges; it does not and cannot check that the README table stays in sync with that array, since the README is prose this story deliberately leaves untested. A future rename that updates `CONTRACT_VARIABLES` but not the README table would pass `pnpm ci` silently. This is an accepted gap given the story's explicit no-test-file scope; flagging it rather than leaving it implicit.

  **PROPOSED (adversarial review):** the feature architecture's Guard test design (feature spec, "The pinned array is the machine-checked half ... and the test's 'addition trips it' behaviour keeps the two from drifting") overstates the protection: the guard test reads only the `:root` declared names, never the README, so it does not keep the README table from drifting from `CONTRACT_VARIABLES`. The cross-check is cheap and automatable: `themeScope.test.ts` already parses an in-repo file, and could parse the README table's name column and assert set equality with `CONTRACT_VARIABLES`. That assertion belongs in ST-01's guard block, which is still unapproved, so the window to close the gap automatically is open now and shuts once ST-01 ships. Recommended resolution for Jeroen (a feature-spec amendment either way): (a) extend ST-01's guard block to assert the README table name column equals `CONTRACT_VARIABLES`, making the two halves of the contract machine-tied, or (b) explicitly accept the manual gap on the two-table precedent (`specs/components.md` and ST-03's mirrored table are both manually maintained) and correct the feature's drift-protection claim so it no longer promises a guard it does not provide. ST-02 itself cannot add the test (its Out of scope forbids `packages/starter/src/` edits), so this is routed for a decision, not actioned here.

  `DECIDED (research)`: option (b). Resolved by the post-approval ladder without needing Jeroen: rung 1 (the feature architecture's own framing already splits the contract into a "machine-checked half" and a "human-readable half," so full automation was never the intended design) and rung 3 (the codebase already carries manually-maintained parallel docs with no automated cross-check, e.g. `specs/components.md`) both favour accepting the manual gap over adding README-parsing to ST-01's guard test. The feature spec's Guard test design paragraph is corrected accordingly; no test added.
- ST-03 (`docs/reference/starter-template.md`) mirrors this story's table content rather than re-deriving it, so an inaccuracy introduced here propagates downstream. ST-03's own QA plan should re-verify its mirrored table against the then-current README rather than trusting it blindly.
- This story depends on ST-01's token names and values as currently frozen in ST-01's AC1 (14 names, exact default values). If ST-01's names or values change during ST-01's own remaining review before approval, this story's table must be re-derived from the updated ST-01 spec before the README edit is written; this plan assumes the names in ST-01's current spec text are the ones that ship.

### Untestable criteria and rewrite proposals
All four acceptance criteria are untestable by an automated test as written, for two compounding reasons specific to this story, not a vague-criteria problem:
1. **The story's own Out of scope section forbids adding a test file** ("no stylesheet, no test file ... for this story"). Any automated check for AC1/AC2 would need either a new test file or an export added to `themeScope.test.ts`, both of which are changes to `packages/starter/src/` that this story explicitly excludes.
2. **The reference data AC2 checks against does not exist yet.** `CONTRACT_VARIABLES` is pinned by ST-01, which is not yet approved; this story cannot write a test against an array that may still change before it lands.

No rewrite of the criteria themselves is proposed: all four are clear, well-scoped, and already state a precise, checkable claim ("55 rows", "identical name sets", "both directions stated", "no other section altered"). The gap is in verification mechanism, not criterion wording, so this plan routes all four to the manual checklist below instead of inventing an automated test that would not actually prove the claim.

### Manual verification checklist
1. After ST-01 merges with its final token names/values, list the 41 existing `--sft-*` colour names (from `style.scss`'s `:root` block) and the 14 new names (from ST-01's merged `style.scss` or its spec's AC1) and confirm the README table has exactly one row per name, 55 total, with a correct default value in each row (AC1).
2. Copy `CONTRACT_VARIABLES` from `themeScope.test.ts` and the README table's name column into two sorted lists and confirm they are identical sets (AC2).
3. Read the "Customization guidance" section's semver prose and confirm both the "add = minor" and "rename or remove = major" statements are present and unambiguous (AC3).
4. Diff `packages/starter/README.md` against `main` and confirm every changed line sits inside "Customization guidance"; no other section's text moved or changed (AC4).
5. Spot-check two or three purpose cells for tokens shared by multiple unrelated call sites (e.g. `--sft-radius-md`, `--sft-input-border`) and confirm the wording is generic rather than naming a single site (edge case).

## Adversarial review
Lite (story level): blockers only. Facts re-verified against the live tree: the `:root` block of `packages/starter/src/style.scss` declares exactly 41 `--sft-*` names (counted directly), so the "41 pre-existing + 14 new = 55" figure holds; `:root.dark` redeclares only a colour subset of those 41 and introduces no dark-only name, so the `:root` set is the full contract surface; the README's current sections (Install, Stylesheet, Bare usage, Overriding a control, Supported slots, Icons, Customization guidance, Adding a field type or a property, Exports) match AC4's intact-sections list and the QA map's "Customization guidance ... through the start of '## Adding a field type or a property'" boundary. Dependency on ST-01 is explicit and correct; ST-01's one unresolved `PROPOSED` edit touches only call-site counts, not token names or default values, so ST-02's table content is unaffected by it.

1. **README table has no automated drift guard, and the feature architecture overstates that it does (should-fix).** ST-02 (correctly) leaves the README untested, and the feature's Guard test design claims "the test's 'addition trips it' behaviour keeps the two from drifting." It does not: the guard test compares the `:root` declared names to `CONTRACT_VARIABLES` and never reads the README, so a future rename that updates both `style.scss` and `CONTRACT_VARIABLES` but not the README table passes `pnpm ci` green while the published contract silently lies. Sharper angle than the QA plan's note: the cross-check is cheaply automatable (the test already parses an in-repo file; it could parse the README name column and assert set equality with `CONTRACT_VARIABLES`), and it belongs in ST-01's guard block, which is still `awaiting-approval`, so the window to close the gap automatically is open now and shuts when ST-01 ships. ST-02 cannot add it (its Out of scope forbids `packages/starter/src/` edits), so this needs a feature-spec amendment, which is Jeroen's call. **Routed** as a `PROPOSED (adversarial review)` edit under Regression risk with two resolution options (automate the README cross-check in ST-01 now, or accept the manual gap on the two-table precedent and correct the feature's drift-protection claim). Kept at should-fix rather than blocker: the drift is editorial, normally caught in PR review, and the codebase already maintains parallel docs by hand (`specs/components.md`, ST-03's mirrored table). It forces discussion only because the fix lives outside ST-02's scope and the feature spec currently asserts a protection it does not deliver.

   `DECIDED (research)`: resolved without Jeroen via the post-approval ladder (see the `PROPOSED` edit above under Regression risk): option (b), accept the manual gap, feature wording corrected. No ST-01 scope change.

2. **AC1 labels all 41 pre-existing tokens "colour tokens" (nit).** `--sft-card-shadow` is a box-shadow compound value, not a colour, so the blanket "41 pre-existing colour tokens" phrasing is slightly inaccurate. The table's per-row purpose and default cells handle it fine (that row simply describes a shadow with a comma-containing default); this is wording only, no behavioural impact. No action required.

3. **Dependency stability check (no action).** ST-02 depends on ST-01's frozen names and values. ST-01's pending `PROPOSED` reword changes only the "39 font-size" call-site count, not any of the 14 token names or their defaults, so ST-02's 55-row table can be written from ST-01's current AC1 without risk of re-derivation. Recorded for visibility.

Status rationale: no unresolved Open questions (the feature's six are all `DECIDED`; this story has none) and no blockers. Finding 1 was a should-fix requiring a feature-spec amendment; resolved during story prep via the post-approval ladder (`DECIDED (research)`, see above) without needing Jeroen, and the feature spec's Guard test design wording is corrected accordingly. Nothing remains unresolved, so this lands at `awaiting-approval`.

## Implementation notes
Added the full 55-row `--sft-*` contract table and the semver rule to `packages/starter/README.md`'s "Customization guidance" section, immediately after the existing bullets. Row names, order, and default values were generated and checked against `packages/starter/src/__tests__/themeScope.test.ts`'s `CONTRACT_VARIABLES` array and `packages/starter/src/style.scss`'s `:root` block with a throwaway script (not committed): exact name-set match (55/55) and exact default-value match (55/55) confirmed. Purpose text was derived from grepping each variable's actual `var()` call sites in `style.scss`, generically worded where a token serves several unrelated roles (`--sft-radius-md`/`-xl`/`-pill`), per the story's edge case, plus a one-line callout naming the three most heavily shared tokens.

No deviations from the plan. One observation outside this story's scope, flagged for visibility rather than fixed: `--sft-danger-soft-hover-bg` is declared on `:root`/`:root.dark` but its two call sites (`.sft-btn-danger-light:hover`) use the matching literal colors directly instead of `var(--sft-danger-soft-hover-bg)`, so the token is currently documented as themeable but not wired. This predates ST-01/ST-02 (it is one of the 41 pre-existing colour tokens, not a new one) and fixing it means editing `packages/starter/src/style.scss`, which this story's Out of scope forbids; the README purpose cell still states the token's intended effect, which is accurate as a purpose statement even though the wiring gap means overriding it today has no visible effect.

Separately, `pnpm -r ci:test:coverage` and `pnpm run ci:test` both fail in `packages/starter/src/__tests__/prototypeParity.test.ts` with `ENOENT` on `specs/FEAT-007-starter-form-template/prototype.html`. That spec folder was deleted by the "Cleanup + new Specs" commit (`b5271aa`, the branch's current HEAD) before this story started; the failure is unrelated to this story's diff (confirmed: it fails identically with only the pre-existing ST-01 working-tree changes present, before this story's README edit). All 414 other starter tests pass. Flagging for Jeroen; out of scope for a README-only story to fix.

Lint required one `npx eslint --fix packages/starter/README.md` pass to re-pad the new table's column widths to Prettier's column-aligned markdown table style; content was unaffected (verified again afterward: 55/55 name and default-value match still holds).

## Verification report

### Pipeline results
- `pnpm run ci:test` (note: bare `pnpm ci` is shadowed by pnpm's own install-ci builtin in this repo; the scoped `ci:test`/`ci:lint`/`ci:typecheck` scripts are the correct invocation): `packages/core` 973/973 tests pass (37 files). `packages/starter` 414/414 tests pass (66 files); one suite, `src/__tests__/prototypeParity.test.ts`, fails with `ENOENT` on the deleted `specs/FEAT-007-starter-form-template/prototype.html`. Reproduced independently on the unmodified tree (confirmed by checking out the working tree with only ST-01's changes present); pre-existing, caused by the "Cleanup + new Specs" commit (`b5271aa`) removing that spec folder, unrelated to this story's README-only diff. `docs/` suite: 4 files, 78 tests pass.
- `pnpm run ci:lint`: clean, no errors in either package.
- `pnpm run ci:typecheck`: clean, `packages/core`, `packages/starter`, and `playgrounds/storybook` all pass.
- `pnpm -r ci:test:coverage`: `packages/core` 98.47% stmts / 92.93% branch / 98.37% funcs / 98.47% lines, consistent with the existing baseline (no source file in `packages/core` changed by this story). `packages/starter` coverage report did not print because the same pre-existing `prototypeParity.test.ts` ENOENT aborts the suite before the v8 summary is generated; this is a reporting artifact of the pre-existing gap, not a regression caused by this story (`README.md` is not instrumented, no source file under `packages/starter/src/` changed). `docs/build` not run: no `docs/` content changed by this story.

### Acceptance criteria
| AC | Check | Result |
| --- | --- | --- |
| 1. Complete 55-row contract table (name, purpose, default) | Parsed the README table programmatically: exactly 55 rows. Cross-checked every default value against `packages/starter/src/style.scss`'s `:root` block literal-by-literal: 55/55 exact matches, including compound values (`--sft-card-shadow`, `--sft-font-mono`). Every purpose cell is non-empty and specific. | Pass |
| 2. Table names match `CONTRACT_VARIABLES` exactly | Extracted `CONTRACT_VARIABLES` from `packages/starter/src/__tests__/themeScope.test.ts` (55 entries) and the README table's name column (55 entries), both sorted. Diffed programmatically: zero missing, zero extra, identical sets. | Pass |
| 3. Stated semver rule | README "Customization guidance" section states: "adding a new `--sft-*` variable is a minor change. Renaming or removing one is a major change." Both directions present, unambiguous prose. | Pass |
| 4. Install/usage sections stay intact | `git diff main -- packages/starter/README.md`: all changed lines fall inside "Customization guidance" (one wording tweak to the existing first bullet, plus the new table/callout/semver-rule block, immediately before "## Adding a field type or a property"). Install, Stylesheet, Bare usage, Overriding a control, Supported slots, Icons, Adding a field type, and Exports sections are untouched in the diff. | Pass |

Edge case: spot-checked `--sft-radius-md` ("input, dependent placeholder, choice group, wizard alert, JSON panel") and `--sft-radius-xl`/`--sft-radius-pill` rows, plus the added callout sentence naming the three as shared; wording is generic, names no single call site exclusively. Confirmed.

### Prototype comparison
Not applicable, per the story's Design reference: no prototype exists for this feature, and this story is a documentation table with no render surface.

### Process compliance
- `specs/components.md`: no edit required or made by this story; ST-02 adds no new export or public API, only documents already-shipped (ST-01) surface. The `components.md` diff present in the working tree belongs to ST-01's scope, not this story's.
- VitePress docs: out of scope for this story (ST-03 owns the `docs/reference/starter-template.md` mirror); no `docs/` content was touched, consistent with the story's Out of scope section.
- Changeset: none added, correctly, since only `packages/starter/README.md` changed and it sits outside `packages/starter/src/`.
- No new exports, no library API rule violations: this story touches no `.ts`/`.vue` source.
- No undocumented spec deviations: the Implementation notes' one flagged item (`--sft-danger-soft-hover-bg` declared but not wired at its call site) is a pre-existing gap in one of the 41 original colour tokens, outside this story's scope (fixing it would require editing `style.scss`, forbidden by Out of scope), and is noted here for Jeroen's awareness only; it does not affect AC1's default-value check (the documented default and purpose are accurate regardless of the wiring gap) and does not block this story's verdict.
- Lint required one `eslint --fix` pass for markdown table column alignment; confirmed re-verified by the developer and independently reproduced via this session's own `pnpm run ci:lint` pass (clean).

### Overall verdict: pass

All four acceptance criteria verified with direct evidence (programmatic name-set and default-value diffs, not just a visual read). Pipeline green except for the pre-existing, unrelated `prototypeParity.test.ts` ENOENT, independently reproduced as pre-existing and out of scope for this story. No process-compliance gaps for a README-only change of this shape.
