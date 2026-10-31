---
id: ST-03
type: story
feature: FEAT-005
status: done
approved_by: Jeroen
pr: ""
---

# Story: Docs for `xsd_maxOccurs`, `xsd_choiceMaxOccurs`, and the `maxOccursTotal` backstop

## Functional
### User story
As a docs reader configuring occurrence limits on an array or a choice, I want the validation guide, the field-metadata reference, and the choices example to describe the new maximum-occurrence errors (including the non-XSD `maxOccursTotal` backstop) with the same clarity as the existing minimum-occurrence rules, so that I understand which rule fires, what it counts, and what its message can and cannot tell me, without reading the source.

### Acceptance criteria

1. **`docs/guide/validation.md`'s Built-in Rules table gains both new XSD rules and the non-XSD extension, clearly distinguished.**
   Given the current Built-in Rules table (which lists `xsd_minOccurs` and `xsd_choiceMinOccurs` as `*(array minOccurs)*` / `*(choice minOccurs)*`),
   When the section is updated,
   Then it adds `*(array maxOccurs)*` -> `xsd_maxOccurs` and `*(choice maxOccurs)*` -> `xsd_choiceMaxOccurs` rows, and adds `maxOccursTotal` called out explicitly as a non-XSD extension (not derived from any `<xs:choice>` construct), so a reader does not expect it to have an XSD equivalent.

2. **Example config for the two new messages keys.**
   Given the guide's existing `settings.messages` example pattern,
   When the section is updated,
   Then it shows `maxOccurs`, `choiceMaxOccurs`, and `maxOccursTotal` each with a one-line example using their documented placeholders (`{field}`, `{0}`/`{max}`), consistent with how `minOccurs`/`choiceMinOccurs` are already shown.

3. **`maxOccursTotal`'s aggregate/no-branch-naming limitation is documented (finding 7, DECIDED Jeroen option (a)).**
   Given a reader configuring `messages.maxOccursTotal`,
   When they read the guide,
   Then it states plainly that the message is a single choice-level aggregate that does not name the offending branch, and that when several branches breach their own `maxOccursTotal` at once, it reports only the first offending branch's cap in declaration order, not every breached cap and not the specific branch.

4. **The auto-mode double-error overlap is documented (finding 8), not presented as a bug.**
   Given a reader whose auto-mode (or `maxOccurs: 1` explicit) choice branch exceeds its own `maxOccursTotal`,
   When they read the relevant section,
   Then it explains that both the branch's own `xsd_maxOccurs` (inline at the branch) and the choice-level `maxOccursTotal` (at the choice anchor) can fire together, that this is expected and not a duplicate/conflicting signal, and where each renders.

5. **`docs/reference/field-metadata.md`'s occurrence section cross-references the new validation backstop.**
   Given the existing `### maxOccurs` entry (documents the structural effect: disables the "Add" affordance at the cap),
   When the section is updated,
   Then `### maxOccurs` gains a one-line note that loading/programmatic data already over the cap now also fails `xsd_maxOccurs` validation, not only the "Add" affordance, and `docs/reference/field-metadata.md` carries a short pointer to the `maxOccursTotal` validation backstop.

   **PROPOSED (adversarial review):** the AC's original second half assumed "the existing `maxOccursTotal` mentions" inside `docs/reference/field-metadata.md`. Verified against the file: that premise is false (`grep -n "maxOccursTotal" docs/reference/field-metadata.md` returns zero hits; `maxOccursTotal` is documented today only in `docs/examples/choices.md` and the `FieldMetadata.ts` JSDoc, the same convention the already-shipped `preserveOnSwitch` flag follows). Operative reading, accepted as consistent with the feature's docs-slice intent (that a reader of this page is not left unaware the backstop exists): satisfy the `maxOccursTotal` half of AC5 with a short pointer placed near `### maxOccurs` to `docs/examples/choices.md`'s "Capping a branch's total count" section (which AC6 separately updates with the actual validation-rule explanation), rather than inventing a new full `### maxOccursTotal` property entry that no part of this story or the feature scope asks for. If Jeroen prefers a dedicated `### maxOccursTotal` entry instead, that is a small, reasonable scope addition to make in its place.

6. **`docs/examples/choices.md` mentions the new rules where relevant.**
   Given the existing "Capping a branch's total count (`maxOccursTotal`)" section (which today documents only the structural per-branch cap),
   When the section is updated,
   Then it notes that an over-limit branch now also fails the `maxOccursTotal` validation rule, with a link to the validation guide for the message-customization details, consistent with how the existing choices content references `xsd_choiceMinOccurs` elsewhere on the page.

7. **`specs/components.md`'s validation-rules list and messages surface reflect the shipped rules.**
   Given `specs/components.md`'s "Validation rules" line (currently ending at `xsd_totalDigits`),
   When ST-01/ST-02 ship,
   Then this line lists `xsd_maxOccurs`, `xsd_choiceMaxOccurs`, and `maxOccursTotal` alongside the existing rules. (Owned by ST-01/ST-02 per the standing update rule; this story only verifies it is accurate by the time it publishes and does not duplicate the edit.)

### Edge cases
- A reader who only cares about arrays (not choices) should be able to read the `xsd_maxOccurs` mentions without needing the choice-specific `maxOccursTotal` caveats; keep the two concerns under clearly separate headings/subsections.
- The docs must not imply `maxOccursTotal` is XSD-derived anywhere (no `xsd_` prefix used for it in prose, tables, or code samples).

### Out of scope
- Any change to `packages/core/src/`: this is a docs-only slice, no changeset.
- Storybook content: not required by this feature's scope.
- Rewriting existing minimum-occurrence documentation beyond what is needed to sit naturally alongside the new maximum-occurrence content.

## Design reference
Not applicable. No prototype exists for this feature (pure engine/validation feature, no design phase). This story documents behavior, not a visual surface: no new slot, component, or docs example component is introduced anywhere in this feature.

## Architecture reference

Implements the feature architecture's "Docs slice" (Natural slicing seams, item 3). Docs-only; touches no `packages/core/src/` file, so no changeset.

- **`docs/guide/validation.md` (modified).** Built-in Rules table: add the `xsd_maxOccurs` / `xsd_choiceMaxOccurs` rows next to the existing minOccurs rows, and add `maxOccursTotal` as a clearly non-XSD addition (per ADR-5's rationale: it carries no `xsd_` prefix precisely because it names no XSD construct). Message Sources / example config: extend with the three new `messages` keys and their placeholders. Covers AC1-4.
- **`docs/reference/field-metadata.md` (modified).** `### maxOccurs` entry: add the one-line validation cross-reference (AC5). The `maxOccursTotal` mentions already present in this file (added by FEAT-001/QUICK-001) gain the validation-backstop cross-reference (AC5).
- **`docs/examples/choices.md` (modified).** "Capping a branch's total count (`maxOccursTotal`)" section gains the validation-rule mention and a link to the guide (AC6).
- **`packages/core/src/types/DynamicFormSettings.ts`'s JSDoc**: already fully specified and shipped by ST-01 (`maxOccurs`) and ST-02 (`choiceMaxOccurs`, `maxOccursTotal`); this story does not re-edit that file, it only ensures the published docs are consistent with the JSDoc ST-01/ST-02 already wrote.
- **`specs/components.md`:** verified (not re-edited) for AC7; the actual list edit is owned by ST-01 (adds `xsd_maxOccurs`) and ST-02 (adds `xsd_choiceMaxOccurs`, `maxOccursTotal`) per the standing "developer updates on every public-surface change" rule and the feature's own Natural-slicing-seams note.
- **Public API surface touched:** none. This story documents already-shipped surface; it adds no new library export.
- **Dependencies on other stories:** depends on both ST-01 and ST-02 (documents both rule sets and the backstop; cannot accurately describe the shipped message keys, placeholders, or the finding-7/finding-8 nuances before both engine slices exist). Lands last, after both engine slices, since it documents their behavior.

## QA plan

This is a docs-content-only slice: no `packages/core/src/` file changes, no new unit/component/analytics test, no changeset. Verification is editorial (does the prose say the right, accurate thing) and mechanical (does it build, does every name match the shipped API, does no forbidden character or casing slip in). Written before ST-01/ST-02 are implemented (both still `status: qa`), so the exact rule names (`xsd_maxOccurs`, `xsd_choiceMaxOccurs`, `maxOccursTotal`) and message keys (`messages.maxOccurs`, `messages.choiceMaxOccurs`, `messages.maxOccursTotal`) are taken from their approved architecture/story specs; every check below that compares docs prose against shipped code must be re-run once ST-01 and ST-02 actually land, per this story's own dependency note.

### Files touched

| File | Change |
| --- | --- |
| `docs/guide/validation.md` | Built-in Rules table gains two rows (`xsd_maxOccurs`, `xsd_choiceMaxOccurs`) plus a clearly non-XSD `maxOccursTotal` row/callout. Example Configuration block gains three new `messages` lines. Covers AC1-4. |
| `docs/reference/field-metadata.md` | `### maxOccurs` entry gains a one-line validation cross-reference. Covers (part of) AC5; see the Untestable-as-written note below for the `maxOccursTotal` half of AC5, whose stated premise does not hold against the current file. |
| `docs/examples/choices.md` | "Capping a branch's total count (`maxOccursTotal`)" section (lines 177-190 today) gains one sentence noting the new validation rule plus a link to the validation guide. Covers AC6. |
| `specs/components.md` | Not edited by this story. Verified only, for AC7. |
| `packages/core/src/types/DynamicFormSettings.ts` | Not edited by this story (ST-01/ST-02 own the JSDoc). Read only, as the source of truth the new docs prose must stay consistent with. |

No `.vue`, `.ts` source, or test file is touched.

### Acceptance criteria → check mapping

1. **Built-in Rules table gains the two XSD rows plus the non-XSD `maxOccursTotal` row, clearly distinguished.**
   - Mechanical: `grep -n "xsd_maxOccurs\b" docs/guide/validation.md` and `grep -n "xsd_choiceMaxOccurs" docs/guide/validation.md` each find a hit inside the Built-in Rules table (table row, not prose elsewhere), mirroring the existing `*(array minOccurs)*` / `*(choice minOccurs)*` row format exactly (`*(array maxOccurs)*` -> `` `xsd_maxOccurs` ``, `*(choice maxOccurs)*` -> `` `xsd_choiceMaxOccurs` ``).
   - Mechanical: `grep -n "maxOccursTotal" docs/guide/validation.md` finds a hit in or immediately next to the same table, visibly not sharing the `xsd_` naming column value with the two rows above it.
   - Editorial (manual read): confirm the `maxOccursTotal` row/callout is unambiguous that it is a non-XSD library extension (no `<xs:choice>` equivalent), so a reader does not scan the table and assume XSD provenance by proximity alone; compare the wording against `FieldMetadata.maxOccursTotal`'s own JSDoc ("Plain `<xs:choice>` has no equivalent...") and ADR-5's rationale for tone consistency.
   - Mechanical (edge case 2): `grep -rn "xsd_maxOccursTotal" docs/guide/validation.md docs/reference/field-metadata.md docs/examples/choices.md` returns zero hits, before and after the change.

2. **Example config gains `maxOccurs`, `choiceMaxOccurs`, and `maxOccursTotal` each with a one-line example.**
   - Mechanical: `grep -n "maxOccurs:\|choiceMaxOccurs:\|maxOccursTotal:" docs/guide/validation.md` finds all three inside the `Example Configuration` fenced block (the same block that already shows `minOccurs`/`choiceMinOccurs`).
   - Editorial: each of the three new lines uses `{field}` and (`{0}` or `{max}`) consistently with the documented placeholder set, matching the existing lines' one-line string style (no multi-line templates, same quoting).
   - Cross-check (deferred until ST-01/ST-02 ship, see intro note): the three key names used here are exactly `maxOccurs`, `choiceMaxOccurs`, `maxOccursTotal`, matching `DynamicFormSettings.messages`'s real property names once ST-01/ST-02 add them (not a provisional or renamed key).

3. **`maxOccursTotal`'s aggregate/no-branch-naming limitation is documented (finding 7, DECIDED option (a)).**
   - Editorial: the guide states plainly, near the `maxOccursTotal` table row/callout or in its own short paragraph, that the message is a single choice-level aggregate that (a) does not name the offending branch and (b) when several branches breach their own `maxOccursTotal` at once, reports only the first offending branch's cap in declaration order, not every breached cap and not the specific branch.
   - Cross-check: wording matches the accepted resolution in the feature spec's Open question 7 / ADR-6 and ST-02's AC9 (`{max}` = the first offender's cap in declaration order; `{field}` resolves to the choice anchor, never a branch name), not the earlier, more optimistic framing findings 7 rejected.
   - Mechanical, heuristic only: `grep -n -i "first offending\|does not name\|no branch" docs/guide/validation.md` as a hint the wording exists; the editorial read above is the real check, since the exact phrasing is a content decision, not a fixed string.

4. **The auto-mode double-error overlap is documented as expected behavior, not a bug (finding 8).**
   - Editorial: the guide explains that in automatic mode (or an explicit `maxOccurs: 1` branch), an over-limit branch can raise both its own inline `xsd_maxOccurs` (rendered at the branch's own `-array` slot) and the choice-level `maxOccursTotal` aggregate (rendered at the choice's `-choice`/`-choice-array` slot anchor) at the same time, that this is expected (not a duplicate or conflicting signal), and states where each one renders.
   - Cross-check: matches the feature architecture's data-flow addendum and ADR review finding 8's retraction language ("acceptable as designed... not a defect"), and ST-02's AC11.
   - Regression check: confirm this note sits under a clearly separate heading/subsection from the plain `xsd_maxOccurs` array-only content (edge case 1), so a reader who only uses top-level arrays is not forced to read the choice-specific caveat to understand the array rule.

5. **`field-metadata.md`'s occurrence section cross-references the new validation backstop.**
   - **Flagged as partially untestable as written; see the Untestable-as-written section below for the concrete finding and the operative reading this plan uses.** In short: the AC's premise that `maxOccursTotal` already has "mentions" inside `docs/reference/field-metadata.md` is false as of this writing (confirmed by `grep -n "maxOccursTotal" docs/reference/field-metadata.md`, zero hits; `maxOccursTotal` is documented today only in `docs/examples/choices.md` and in the `FieldMetadata.ts` JSDoc, following the same pattern as the already-shipped `preserveOnSwitch`, which likewise has no `field-metadata.md` entry). The checks below split the AC into its two genuinely separable halves.
   - Mechanical + editorial (the `### maxOccurs` half, fully testable as written): the existing `### maxOccurs` entry (`docs/reference/field-metadata.md`, currently lines 79-94) gains one added line stating that loading or programmatic data already over the cap now also fails `xsd_maxOccurs` validation, not only disabling the "Add" affordance. `grep -n "xsd_maxOccurs" docs/reference/field-metadata.md` finds the new line inside that section.
   - Mechanical + editorial (the `maxOccursTotal` half, read per the proposed operative interpretation below): confirm `docs/reference/field-metadata.md` carries at least a short pointer, placed near `### maxOccurs` (mirroring the existing `### autoAddMinOccurs`-after-`### maxOccurs` adjacency convention), noting that a choice branch's own `maxOccursTotal` cap also gained a validation backstop, with a link to the full explanation in `docs/examples/choices.md`'s "Capping a branch's total count" section (which AC6 is independently updating). This keeps `field-metadata.md` consistent with its own existing pattern of not duplicating full choice-branch-only property docs (same as `preserveOnSwitch`), while still satisfying the AC's intent that a reader of this page is not left unaware the backstop exists. `pnpm docs:build`'s dead-link check guards the new cross-link.

6. **`docs/examples/choices.md` mentions the new rules where relevant.**
   - Mechanical: `grep -n "maxOccursTotal" docs/examples/choices.md` shows an added hit inside the existing "Capping a branch's total count" section (today's last paragraph, line 190), not a new, disconnected section.
   - Editorial: the added sentence states that an over-limit branch now also fails the `maxOccursTotal` validation rule (using the exact, non-`xsd_`-prefixed rule name), with a link to the validation guide for message-customization details.
   - Mechanical: `pnpm docs:build` dead-link check on the new `docs/guide/validation.md` link/anchor.
   - Consistency check (editorial): compare phrasing/placement against how this same page already references `xsd_choiceMinOccurs` in prose (e.g. the existing "Adding an occurrence satisfies `xsd_choiceMinOccurs` immediately..." sentence), so the new mention reads native to the page's existing voice rather than bolted on.

7. **`specs/components.md`'s validation-rules list and messages surface reflect the shipped rules (verify only).**
   - Mechanical (deferred until ST-01/ST-02 ship): `grep -n "xsd_maxOccurs\|xsd_choiceMaxOccurs\|maxOccursTotal" specs/components.md` finds all three inside the "Validation rules" line by the time this story is verified.
   - Process check: `git diff <base>..HEAD -- specs/components.md` for this story's own commit is empty. This story verifies, it does not edit; if ST-01 or ST-02 forgot the update, that is a finding against those stories, not something ST-03 patches silently.

### Edge cases (from Functional > Edge cases)

- "A reader who only cares about arrays should not need the choice-specific `maxOccursTotal` caveats." Editorial: confirm the Built-in Rules table addition and any array-only prose sit under a heading/subsection distinct from the `maxOccursTotal` explanatory content (see AC1/AC4 checks above), so a reader can stop after the array rows.
- "The docs must never use `xsd_` for `maxOccursTotal`." Mechanical, exact-string, zero judgement: `grep -rn "xsd_maxOccursTotal" docs/guide/validation.md docs/reference/field-metadata.md docs/examples/choices.md` returns no matches, checked on the final diff of all three files.

### States policy

Not applicable in the component-test sense: this story mounts no `DynamicFormItem`/`DynamicFormItemChoice`/`DynamicFormItemArray`, since it is prose-only. The relevant "state" this story documents is the **error** state for the two new XSD rules and the `maxOccursTotal` backstop, which is inherited unchanged from the existing `xsd_minOccurs`/`xsd_choiceMinOccurs` error-display mechanics (`fieldContext.errorMessage`, the `-array`/`-choice`/`-choice-array` slots already shown in every relevant docs example). Editorial check: the guide's prose for all three new entries names which slot(s) the error renders through (already covered by AC4's mapping for the double-error case), so a reader is not left to guess. No empty/loading/disabled-state prose is newly required, since these rules add no new field-level states beyond "valid" and "invalid," per the feature's own "Design (feature level): skipped, no new slot/prop/component" statement.

### Reactivity / `*.analytics.test.ts`

Not applicable. This story touches no `DynamicFormItem`, `computedProps`, or validation wiring source code, only prose in `docs/`. No `.analytics.test.ts` file is added, extended, or needs to be.

### Coverage

Not applicable to this story directly: `pnpm -r ci:test:coverage` measures `packages/core` (and `packages/element-plus`), and this story changes zero files under either package, so its own diff cannot move the baseline. Confirmed by intent (files-touched table above) and to be reconfirmed at verification time via `git diff --stat <base> -- packages/core/` being empty for this story's commit. The actual rule coverage (the executable tests proving `xsd_maxOccurs`, `xsd_choiceMaxOccurs`, and `maxOccursTotal` behave as documented) is ST-01's and ST-02's obligation in their own QA plans, not duplicated here; this story only needs the prose to be an accurate description of already-tested behavior.

### Time sensitivity

Not applicable. No date/time-dependent content anywhere in the three touched files.

### Regression risk

- **Existing `docs/guide/validation.md` content** (the `restriction` table, the `xsd_minOccurs`/`xsd_choiceMinOccurs` rows, the Message Sources section, the existing `minOccurs`/`choiceMinOccurs` example lines, the Custom Validation section, the interactive example embed) must stay accurate and unmodified except for the additive rows/lines this story inserts. Guarded by an additive-diff read (confirm no existing line is altered, only new lines added) plus `pnpm docs:build` (catches a broken embed if one is accidentally touched).
- **Existing `docs/reference/field-metadata.md` content**, in particular the `### maxOccurs` entry's existing table (`0`/`1`/`N > 1` effects) and code sample, must stay unmodified except for the new appended validation-cross-reference line. Same additive-diff check.
- **Existing `docs/examples/choices.md` content**, in particular the "Capping a branch's total count" section's existing three paragraphs (structural cap explanation, code sample, batching-interaction explanation), must stay unmodified except for the new appended sentence/link. Same additive-diff check.
- **Hard dependency on ST-01 and ST-02 shipping the exact names this plan assumes.** Every mechanical check above that names `xsd_maxOccurs`, `xsd_choiceMaxOccurs`, `maxOccursTotal`, `messages.maxOccurs`, `messages.choiceMaxOccurs`, or `messages.maxOccursTotal` is only a real guard once those two stories have actually landed with those exact names; if either ships with a renamed rule or key (unlikely post-architecture, but the point of this note), the greps above catch the mismatch immediately, the same way ST-04's identifier greps existed to catch a stale provisional name.
- **`docs/examples/choices.md`'s pre-existing structural framing of `maxOccursTotal`** ("It is an opt-in, non-XSD property... a hard cap...") must not be contradicted by the new validation-rule sentence; the new sentence adds a validation-layer fact on top, it does not restate or override the structural framing already there.
- **No other story of this feature touches these three files**, so there is no cross-story file-ownership conflict to track (unlike ST-04/FEAT-001's cross-link coupling to a sibling docs story). The only coupling is content-accuracy against ST-01/ST-02's shipped code, covered above.
- **No existing automated test guards markdown prose content anywhere in this repo** (confirmed: no snippet-extraction/type-check harness exists under `docs/` or `scripts/`, same finding ST-04/FEAT-001 already recorded). Pre-existing tooling gap, not something this story is expected to fix.

### Manual verification checklist

1. `pnpm docs:build` completes clean (build-level check for AC1's table/callout, AC2's fence syntax, AC5's and AC6's new cross-links; required by `CLAUDE.md`'s "Before Every Push" step 5 for any `docs/` change).
2. `pnpm docs:dev`, open all three changed pages (`/guide/validation`, `/reference/field-metadata`, `/examples/choices`) and read the new content end to end in both light and dark mode (VitePress's built-in toggle), confirming no broken Markdown (stray backtick, unclosed table row, unclosed fence) slipped past the build step and that the new table rows render aligned with the existing ones.
3. Click through the new cross-links (`field-metadata.md` -> `choices.md`'s "Capping a branch's total count" section, `choices.md` -> `guide/validation.md`) and confirm each lands on content that actually explains the claim being pointed at, not just that the link resolves.
4. Once ST-01 and ST-02 have landed on this branch: re-run the AC2/AC3/AC7 cross-checks against the real, shipped `packages/core/src/types/DynamicFormSettings.ts` JSDoc and `specs/components.md`, the same way ST-04 re-verified its cross-link once its sibling story landed. Confirm the docs' plain-English description of the `maxOccursTotal` aggregate/first-offender behavior says the same thing the JSDoc says, in different but not contradictory words.
5. `grep -rn '—' docs/guide/validation.md docs/reference/field-metadata.md docs/examples/choices.md` (em dash, U+2014); confirm every hit (if any) falls on a pre-existing, untouched line (this repo's `validation.md` already has one pre-existing em dash outside this story's diff), and that zero em dashes appear in the newly added content, per `CLAUDE.md`'s "never use em dashes" rule.
6. `grep -n -- '-max-occurs=\|-choice-max-occurs=\|:max-occurs\|:choice-max-occurs' docs/guide/validation.md docs/reference/field-metadata.md docs/examples/choices.md` and inspect any fenced code block added or touched by this story for kebab-case bindings; expect no matches, per `CLAUDE.md`'s "Vue: always use camelCase, never kebab-case" rule (low risk here since this story adds no new Vue template snippet, only prose and `ts` metadata fences, but the check costs nothing).
7. After opening the PR: verify the Cloudflare Pages preview build (the `cloudflare-workers-and-pages` bot comment) renders all three changed pages correctly, per `CLAUDE.md`'s "Before Every Push" step 5.

Checks 1 and the dead-link portions of checks under AC1/AC5/AC6 are mechanical/build-level. Checks 2, 3, and 4 are manual/editorial. Checks 5 and 6 are mechanical grep, exact-string, no judgement. Check 7 is a hybrid: mechanical trigger (CI/Cloudflare), manual review of the result.

### Untestable-as-written / rewrite proposals

- **AC5's `maxOccursTotal` half rests on a false premise.** AC5 (and the Architecture reference's own line 70) both assert "the existing `maxOccursTotal` mentions" inside `docs/reference/field-metadata.md`. Verified directly: `grep -n "maxOccursTotal" docs/reference/field-metadata.md` returns zero hits today (confirmed against the file as it stands on this branch); `maxOccursTotal` is documented today only in `docs/examples/choices.md`'s "Capping a branch's total count" section and in `packages/core/src/types/FieldMetadata.ts`'s JSDoc, not in this reference page at all. This mirrors the already-shipped `preserveOnSwitch` flag, which is likewise absent from `field-metadata.md` and lives only in `choices.md`, so the omission looks like an established (if implicit) convention for choice-branch-only opt-in flags, not an oversight unique to `maxOccursTotal`. **Proposed reading** (for the developer/qa-verifier to treat as the operative bar unless Jeroen says otherwise): satisfy AC5 with (a) the `### maxOccurs` one-line validation cross-reference, which is fully real and testable as written, and (b) a short pointer near it to `choices.md`'s section (which AC6 is separately updating with the actual validation-rule explanation), rather than inventing a new, full `### maxOccursTotal` property entry that no other part of this story or the feature scope asks for. Flagging rather than silently softening the criterion, since only Jeroen or the adversarial-reviewer should confirm this reading is acceptable, or alternatively decide a dedicated `### maxOccursTotal` entry should be added now (which would be a small, reasonable scope addition, but is a content-completeness call beyond what this story's architecture reference asked for).
- No other acceptance criterion is untestable as written; AC1-4, AC6, and AC7 all reduce to editorial-read-plus-grep checks with a concrete pass/fail, once ST-01/ST-02's exact shipped names are available to check against.

### Open questions

- None raised by this plan beyond the AC5 premise flagged above, which is routed as a proposed reading (with the false-premise fact verified directly against the current file, not assumed) rather than a genuine unknown requiring Jeroen. If the adversarial reviewer or Jeroen prefers the alternative (a dedicated `### maxOccursTotal` entry), that is a small, low-risk scope addition to note explicitly rather than silently add.

## Adversarial review

Lite (story) mode: blockers only, with any should-fixes routed as `PROPOSED (adversarial review)` edits. Every factual claim was checked against the actual docs files, not just the prose. Verified independently:

- `docs/reference/field-metadata.md` contains **zero** `maxOccursTotal` mentions (`grep` confirmed) and its `### maxOccurs` entry sits at lines 79-94, exactly as the QA plan states. The QA planner's false-premise finding on AC5 is correct.
- `docs/guide/validation.md`'s Built-in Rules table (lines 38-54) carries the `*(array minOccurs)*` → `xsd_minOccurs` and `*(choice minOccurs)*` → `xsd_choiceMinOccurs` rows, and the Example Configuration block (lines 88-97) shows the `minOccurs`/`choiceMinOccurs` message lines, so AC1/AC2's "mirror the existing rows/lines" instruction has a real anchor.
- `docs/examples/choices.md`'s "Capping a branch's total count (`maxOccursTotal`)" section is at lines 177-190 and today documents only the structural cap, matching AC6's premise.
- The story's dependency on ST-01 and ST-02 landing first is explicit (Architecture reference, "Dependencies on other stories"; QA plan intro; feature Stories list item 3). No missing-dependency blocker.
- AC3/AC4 match the approved feature: AC3's "reports only the first offending branch's cap in declaration order, names no branch" is ADR-6 / Open question 7 option (a) verbatim in intent; AC4's double-error-overlap-is-expected framing matches finding 8's retraction and the data-flow addendum. No silent local override of the feature design.

**Findings:**

1. **(should-fix, routed)** AC5 rested on a false premise ("the existing `maxOccursTotal` mentions" inside `docs/reference/field-metadata.md`), which does not hold: that file has no `maxOccursTotal` content today. Ruling on the QA planner's proposed operative reading (a `### maxOccurs` one-line cross-reference plus a short pointer to `docs/examples/choices.md`, not a new full property entry): it is **consistent** with the approved feature's docs-slice intent (the feature asks only that a reader of this page not be left unaware the backstop exists; it does not ask for a dedicated `### maxOccursTotal` entry), and it matches the established `preserveOnSwitch` convention of not duplicating choice-branch-only flags on this page. Accepted and routed as a `PROPOSED (adversarial review)` edit to AC5. Note for Jeroen: the same false premise also lives in the **approved feature spec** (Docs slice bullet: "cross-reference `maxOccursTotal`'s existing entry"). The operative reading resolves it without contradicting feature intent, so no feature amendment is strictly required, but if you want a dedicated `### maxOccursTotal` entry the call belongs at feature level.

2. **(nit)** The Built-in Rules table in `docs/guide/validation.md` is introduced by "Each `restriction` key maps to an XSD-inspired vee-validate rule registered by the library." Adding the non-XSD `maxOccursTotal` as a row inside that table would sit under an "XSD-inspired" heading and undercut edge case 2 ("docs must not imply `maxOccursTotal` is XSD-derived"). AC1 already permits placing it "in or immediately next to the same table"; recommend the non-XSD callout live visibly outside the XSD table (or the intro sentence be softened), so provenance is unmistakable rather than inferred by proximity.

3. **(nit)** AC2 requires each new example-config line to use `{field}`, but the existing `minOccurs` example line ("At least {min} items required") uses no `{field}` (only `choiceMinOccurs` does). "Consistent with how `minOccurs`/`choiceMinOccurs` are already shown" and "must use `{field}`" are not jointly binding for the array `maxOccurs` line; the developer should follow the documented placeholder set, not force `{field}` into the array line if it reads unnaturally.

## Implementation notes

- AC5's `maxOccursTotal` half was implemented per the accepted PROPOSED reading in the adversarial review: a short pointer near `### maxOccurs` to `docs/examples/choices.md`'s "Capping a branch's total count" section, not a new `### maxOccursTotal` property entry. No dedicated entry was added; flagged here in case Jeroen prefers one.
- Per adversarial-review nit 2, `maxOccursTotal` was kept out of the Built-in Rules table entirely (not even as an adjacent row) since the table's intro sentence ("Each `restriction` key maps to an XSD-inspired vee-validate rule") would have implied XSD provenance by proximity. It is documented instead in its own subsection, "The `maxOccursTotal` backstop (non-XSD)", directly below the table and the two new XSD subsections.
- `docs/guide/validation.md`'s Built-in Rules section was split into three subsections after the table (`Array occurrence maximum`, `Choice occurrence maximum`, `The maxOccursTotal backstop`) so a reader who only cares about arrays can stop after the first, per the story's own edge case.
- The array `maxOccurs` example-config line ("At most {max} items allowed") does not use `{field}`, mirroring the existing `minOccurs` line's style rather than forcing the placeholder in, per adversarial-review nit 3.
- Verified `specs/components.md`'s validation-rules list and messages surface are already accurate for the shipped ST-01/ST-02 names (`xsd_maxOccurs`, `xsd_choiceMaxOccurs`, `maxOccursTotal`); no edit made, per AC7 (verify only).
- Cross-link anchors (`/guide/validation#built-in-rules`, `/examples/choices#capping-a-branch-s-total-count-maxoccurstotal`) were confirmed against the built VitePress output (`pnpm docs:build`), not guessed from heading text alone.
- No `packages/core/src/` file touched, no changeset added, per the story's own scope.

## Verification report

Written by the QA verifier, independently of the (removed) developer-authored draft that previously occupied this section. See the process compliance note below.

### Pipeline

- `pnpm run ci:test` (`pnpm -r ci:test`): 601 tests pass across `packages/core` (24 files) and 1 test in `packages/element-plus`. No new tests were expected or added, per this story's own QA plan (docs-only).
- `pnpm run ci:lint`: clean, no errors, both packages.
- `pnpm run ci:typecheck`: `packages/core` clean. `packages/element-plus` initially failed with `TS7016: Could not find a declaration file for module '@bach.software/vue-dynamic-form'`. Confirmed this is a pre-existing, unrelated stale-`dist` artifact issue, not a regression from this story: the same failure reproduces with this story's changes stashed out (clean HEAD), and rebuilding `packages/core` (`pnpm --filter @bach.software/vue-dynamic-form build`) resolves it for both packages. Not caused by any file this story touches (docs-only diff).
- Coverage: not applicable, per the QA plan. `git diff HEAD --stat -- packages/core/` is empty; no baseline comparison needed.
- `pnpm docs:build`: succeeds, no errors, no dead-link warnings. Both new cross-link anchors verified present in the built HTML: `id="built-in-rules"` in `docs/.vitepress/dist/guide/validation.html`, `id="capping-a-branch-s-total-count-maxoccurstotal"` in `docs/.vitepress/dist/examples/choices.html`.
- `git diff HEAD --numstat` for the three touched docs files: `docs/examples/choices.md` +2/-0, `docs/guide/validation.md` +24/-0, `docs/reference/field-metadata.md` +2/-0. Purely additive, no existing line altered or removed.
- `git diff HEAD --stat -- packages/core/`: empty. `.changeset/`: no new file added by this story (only pre-existing ST-01/ST-02 changesets present). Confirms the docs-only, no-changeset scope.

### Acceptance criteria

| AC | Description | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Built-in Rules table gains the two XSD rows plus a clearly non-XSD `maxOccursTotal` mention | pass | `*(array maxOccurs)*` -> `` `xsd_maxOccurs` `` and `*(choice maxOccurs)*` -> `` `xsd_choiceMaxOccurs` `` rows added to the table, mirroring the existing minOccurs row format exactly. `maxOccursTotal` deliberately kept out of the table (per nit 2) and documented in its own "The `maxOccursTotal` backstop (non-XSD)" subsection directly below the table. `grep -rn "xsd_maxOccursTotal"` across all three files returns zero hits. Screenshot-verified in both light and dark VitePress modes: rows align, subsections render cleanly |
| 2 | Example config gains `maxOccurs`, `choiceMaxOccurs`, `maxOccursTotal` | pass | All three keys added to the `Example Configuration` fenced block: `maxOccurs: 'At most {max} items allowed'`, `choiceMaxOccurs: 'Select at most {max} value(s) in {field}'`, `maxOccursTotal: 'At most {max} of this kind allowed'`. Placeholders match the documented set; per nit 3, `{field}` is not forced onto the array `maxOccurs` line, mirroring the existing `minOccurs` line's style |
| 3 | `maxOccursTotal` aggregate/no-branch-naming limitation documented | pass | The new subsection states plainly: "`{field}` resolves to the choice's own anchor label, never the branch's, so the message cannot tell you which branch is over its cap. When several branches breach their own `maxOccursTotal` at once, `{max}`/`{0}` carry only the first offending branch's cap in declaration order, not every breached cap." Matches ADR-6 / Open question 7 option (a) verbatim in intent |
| 4 | Auto-mode double-error overlap documented as expected | pass | Same subsection's second bullet: explains the branch's own inline `xsd_maxOccurs` (at the branch's own array slot) and the choice-level `maxOccursTotal` (at the choice's anchor) "can appear ... at the same time" and states "This is expected, not a duplicate or conflicting signal," naming where each renders. Matches finding 8's retraction language |
| 5 | `field-metadata.md` cross-references the validation backstop | pass, per the accepted operative reading (adversarial review finding 1 / PROPOSED edit) | One line appended to the existing `### maxOccurs` entry: "Loading or programmatically setting data that already holds more items than `maxOccurs` now also fails `xsd_maxOccurs` validation, not only the 'Add' affordance," with a link to Built-in Rules, plus a pointer to `docs/examples/choices.md`'s "Capping a branch's total count" section for `maxOccursTotal`. Placed immediately before `### autoAddMinOccurs`, matching the QA plan's stated adjacency convention. No new dedicated `### maxOccursTotal` entry was added, consistent with the accepted reading; not a silent scope cut since the story spec records this explicitly |
| 6 | `docs/examples/choices.md` mentions the new rules | pass | One sentence appended to the existing "Capping a branch's total count" section: "This cap is no longer structural-only: a branch loaded or set programmatically with more raw items than its own `maxOccursTotal` now also fails the `maxOccursTotal` validation rule," with a link to Built-in Rules and the same first-offender/no-branch-naming caveat repeated in miniature. Reads native to the page's existing voice (compared directly against the page's existing `xsd_choiceMinOccurs` prose) |
| 7 | `specs/components.md` reflects the shipped rules (verify only) | pass | `grep -n "xsd_maxOccurs\|xsd_choiceMaxOccurs\|maxOccursTotal" specs/components.md` finds all three in the "Validation rules (globally registered, ...)" line and in the paragraphs beneath it. `git diff HEAD --stat -- specs/components.md`: empty for this story, confirming verify-only as scoped |

### Prototype / visual comparison

Not applicable in the design-prototype sense (feature has no design phase, no prototype). Instead, verified per the story's own "states policy": screenshots taken via Playwright (local Chromium, `chromium-1228`) against `pnpm docs:build` + `vitepress preview` on `localhost:4173`, both light and dark VitePress color modes, for all three changed pages (`/guide/validation`, `/reference/field-metadata`, `/examples/choices`). New table rows align with existing rows, the three new subsections render with correct heading hierarchy and code-span styling, no broken Markdown (no stray backtick, no unclosed table row or fence) in either color mode. Both new cross-links were clicked through programmatically and confirmed to resolve to the anchors they claim (`field-metadata.md` -> `/examples/choices#capping-a-branch-s-total-count-maxoccurstotal`, `choices.md` -> `/guide/validation#built-in-rules`), and manually confirmed each lands on content that actually explains the claim being pointed at.

### Edge cases

- Array-only reader does not need the `maxOccursTotal` caveats: confirmed by the three separate subsections (`Array occurrence maximum`, `Choice occurrence maximum`, `The maxOccursTotal backstop`), each independently readable.
- No `xsd_` prefix used for `maxOccursTotal` anywhere: `grep -rn "xsd_maxOccursTotal" docs/guide/validation.md docs/reference/field-metadata.md docs/examples/choices.md` returns zero hits.

### Mechanical checks

- Em dash: `grep -n '—' docs/guide/validation.md docs/reference/field-metadata.md docs/examples/choices.md` finds only pre-existing hits (confirmed all fall on lines untouched by `git diff HEAD` on these files); zero em dashes in the newly added content.
- Kebab-case: `grep -n -- '-max-occurs=\|-choice-max-occurs=\|:max-occurs\|:choice-max-occurs'` across the three files: no matches (no Vue template snippet was added by this story).

### Compliance findings

- **(process, non-blocking)** This section previously contained a fully pre-filled "Verification report" (build results, an AC table marked all-pass, screenshots claimed) written by the developer before handoff. Writing the Verification report is the QA verifier's role, not the developer's; a developer self-grading their own acceptance criteria and pre-empting the review gate is a boundary the lifecycle rules reserve for QA. The content has been independently re-verified from scratch in this pass (pipeline re-run, docs rebuilt, anchors re-checked, screenshots retaken) and found factually accurate, so it does not change the verdict, but it should not recur: the developer's own section is "Implementation notes," and the Verification report should be left absent (not pre-answered) at handoff.
- **(nit, non-blocking)** The new `messages.maxOccursTotal` example line ("At most {max} of this kind allowed") omits `{field}`, similar to how nit 3 sanctioned omitting it from the array `maxOccurs` line. This specific omission was not itself discussed by any adversarial-review nit, but it is a reasonable and arguably better choice here: since the docs explicitly warn that `{field}` on this message resolves only to the choice's anchor label and never identifies the offending branch, omitting it from the illustrative example avoids implying the message could name a branch. Flagged for awareness, not a defect.
- No public-surface change in this story (docs-only); `specs/components.md` correctly left unedited. No changeset added, correctly. No `packages/core/src/` file touched. No test file added or needed. No undocumented spec deviations found beyond the three explicitly recorded in "Implementation notes," all three verified faithful to their accepted adversarial-review resolutions (AC5 operative reading; `maxOccursTotal` kept out of the Built-in Rules table per nit 2; array example message omitting `{field}` per nit 3).

### Overall verdict: pass-with-notes

All seven acceptance criteria pass with direct evidence. The pipeline is green (tests, lint; typecheck confirmed clean once the pre-existing, unrelated stale-`dist` issue is worked around by rebuilding, which is not this story's regression to fix). `pnpm docs:build` compiles cleanly with both new cross-link anchors resolving. Both VitePress color modes render the new content correctly. The two "notes" above (developer prematurely writing the Verification report; a minor, defensible placeholder omission) do not require any docs or code change and are recorded for awareness only.

This is the feature's third and last open story (ST-01 and ST-02 are already committed on this branch, both closed). With ST-03 now `done`, all three stories of FEAT-005 are complete; the feature itself can move to `done` once Jeroen confirms and stamps it.

Reminder for Jeroen: link the PR in this story's `pr:` frontmatter field once opened.

Command for Jeroen to re-verify: `pnpm docs:build` (from repo root), then `pnpm --prefix docs preview` and open `/guide/validation`, `/reference/field-metadata`, `/examples/choices`.
