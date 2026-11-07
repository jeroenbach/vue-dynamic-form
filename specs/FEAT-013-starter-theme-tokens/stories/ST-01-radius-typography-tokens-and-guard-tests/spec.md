---
id: ST-01
type: story
feature: FEAT-013
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Radius and typography tokens, full retrofit, and the contract guard tests

## Functional
### User story
As a consumer of `@bach.software/vue-dynamic-form-starter` who wants to retheme shape and type, I want every hardcoded `border-radius`, `font-size`, `font-weight`, and `font-family` value in the shipped stylesheet replaced by a themeable `--sft-*` custom property with today's exact rendered output as its default, so that I can override shape and type the same way I already override colour, with no cascade fight and no visual change until I actually set a variable.

### Acceptance criteria

1. **The 14 new tokens are declared on `:root` with today's exact values.**
   Given `packages/starter/src/style.scss`,
   When built,
   Then `:root` declares all 14 new tokens, grouped under `/* radius */` and `/* typography */` banner comments placed after the existing colour groups:
   `--sft-radius-sm: 6px`, `--sft-radius-md: 8px`, `--sft-radius-lg: 10px`, `--sft-radius-xl: 12px`, `--sft-radius-pill: 9999px`, `--sft-font-mono: ui-monospace, SFMono-Regular, Menlo, monospace`, `--sft-font-size-xs: 11px`, `--sft-font-size-sm: 12px`, `--sft-font-size-md: 14px`, `--sft-font-size-lg: 18px`, `--sft-font-size-xl: 20px`, `--sft-font-size-2xl: 24px`, `--sft-font-weight-medium: 500`, `--sft-font-weight-semibold: 600`.

2. **Full retrofit: every in-scope call site is swapped to `var()`, nothing deferred.**
   Given the stylesheet before this story,
   When the retrofit is applied,
   Then all ~85 confirmed call sites (25 `border-radius`, 39 `font-size`, 19 `font-weight`, 2 monospace `font-family`) read their value through a bare `var(--sft-*)` reference (no fallback value, per ADR-5), and none is left as a raw literal.

   **PROPOSED (adversarial review):** the "39 `font-size`" figure double-counts the one `font-size: inherit` site that AC4 explicitly leaves untokenized, so "all ... 39 `font-size` ... read their value through a bare `var()` ... and none is left as a raw literal" is off by one and reads as a contradiction of AC4. Only 38 of the 39 `font-size` declarations are tokenizable; the 39th is `inherit` and stays. (The `font-family` count already excludes its own `inherit`, counting 2 of 3, so the two properties are counted inconsistently.) Suggested reword: "all ~84 tokenizable call sites (25 `border-radius`, 38 `font-size`, 19 `font-weight`, 2 monospace `font-family`; the one `font-size: inherit` and one `font-family: inherit` are excluded per AC4) read their value through a bare `var(--sft-*)` reference (no fallback, per ADR-5), and no tokenizable literal is left raw." This is a precision fix to the criterion text only; the implementation, AC4, and the AC8 leftover-literal scan (which never matches `inherit`) are already correct.

3. **Zero default visual change.**
   Given `packages/starter/dist/style.css` compiled from the pre-story `style.scss` and from the post-story `style.scss`,
   When the two are diffed after normalizing the custom-property declarations (i.e. comparing rendered values, not textual form),
   Then every selector resolves to the identical rendered `border-radius`, `font-size`, `font-weight`, and `font-family` value it had before. No visual regression.

4. **`inherit` usages are left untouched.**
   Given the one `font-size: inherit` call site (the `.sft-input`/`.sft-select` mobile size rule) and the one `font-family: inherit` call site (the control-font-reset rule),
   When the retrofit is applied,
   Then both remain exactly `inherit`, not tokenized, and are not matched by the leftover-literal guard test (AC7).

5. **No new `:root.dark` entries.**
   Given the 14 new tokens,
   When `:root.dark` is inspected,
   Then none of the 14 is re-declared there (every in-scope value is identical in light and dark), so each falls through to its `:root` value under `.dark` on the same node.

6. **Guard test: pinned public contract name set.**
   Given `packages/starter/src/__tests__/themeScope.test.ts`'s new `describe('public theme contract')` block,
   When the full set of `--sft-*` names declared in the `:root` block is extracted and compared against a pinned, sorted `CONTRACT_VARIABLES` array,
   Then the test passes only when the two sets are exactly equal (55 names: the 41 existing colour tokens plus the 14 new ones), and fails with a message naming the diff (missing vs unexpected) if a name is added, renamed, or removed without updating the pinned array.

7. **Guard test: new tokens have no `:root.dark` override.**
   Given the same `describe` block,
   When each of the 14 new tokens is checked with the existing `effectiveDarkValue` helper,
   Then the test asserts each is present on `:root` and has no differing `:root.dark` entry.

8. **Guard test: leftover-literal check proves wiring, not just declaration.**
   Given the compiled stylesheet with the `:root` and `:root.dark` blocks stripped out,
   When the remainder is scanned,
   Then the test asserts it contains no `border-radius: <one of 6px/8px/9999px/10px/12px>`, no `font-size: <one of 11px/12px/14px/18px/20px/24px>`, no `font-weight: <500/600>`, and no `font-family: ui-monospace, SFMono-Regular, Menlo, monospace`, and that the test fails (red) if run against the pre-retrofit stylesheet, proving it actually detects an unwired token.

### Edge cases
- The `10px` radius value (used only by the icon-catalogue demo tile) is absorbed into `--sft-radius-lg` per the t-shirt scale, not given its own token.
- A value shared by unrelated roles (e.g. `8px` radius shared by inputs, the dashed choice group, the wizard alert, and the JSON panel) resolves to the same single token at every one of those call sites, confirmed by the leftover-literal test having nothing left to find for that value anywhere outside `:root`/`:root.dark`.

### Out of scope
- The README contract table and semver-rule prose: ST-02.
- The docs site reference/guide restructure: ST-03.
- Spacing and line-height tokens: out of scope for the whole feature (`DECIDED (Jeroen)`, see feature Open questions 2 and 6).
- Any visual redesign: every default value reproduces today's rendered output exactly.

## Design reference
Not applicable. The feature skipped the design phase (no new visual surface; zero default visual change is a hard constraint). See the feature's "Design (feature level)" section.

## Architecture reference
Implements the feature architecture's **Slice A** (Slicing seams), the full Token naming/grouping scheme, the `:root.dark` delta decision, and the Guard test design, in full:

- **`packages/starter/src/style.scss` (modified).** Declare the 14 tokens on `:root` per the scheme table in the feature's Architecture section, then swap every one of the ~85 confirmed call sites to a bare `var(--sft-*)` reference (ADR-5: no `var()` fallback, since the token is always declared and a fallback would mask an accidental drop). No selector, class name, or structural rule changes; this is a value-level swap only.
- **`packages/starter/src/__tests__/themeScope.test.ts` (modified).** Add one `describe('public theme contract')` block reusing the existing `blockOf`/`variableIn`/`effectiveDarkValue` helpers already in this file (see the file's current content for their exact signatures). Three checks, matching the feature's Guard test design points 1-3 exactly: the pinned `CONTRACT_VARIABLES` name-set equality check, the per-new-token dark-identity check, and the leftover-literal check (stripping the `:root`/`:root.dark` blocks before scanning for the 13 radius/size/weight literals and the mono stack). `classUsage.test.ts` is untouched.
- **`specs/components.md` (modified).** The existing "Non-published surfaces" row for the starter package gains a short note that radius and typography are now tokenized through `--sft-*` custom properties alongside colour (an inventory-text addition, not a new surface entry).
- **Public API surface touched:** 14 new `--sft-*` custom-property names a consumer may override; no export, prop, slot, setting, or type changes. Bump type: **minor** (feature architecture's DECIDED verdict).
- **Changeset:** this story touches `packages/starter/src/`, so it carries the feature's changeset (minor), describing the user-facing capability (shape and type are now rethemeable, zero default visual change) per `CLAUDE.md`'s changeset-writing rules.
- **Dependencies on other stories:** none. This is the foundation slice; ST-02 depends on this story's final token names, and ST-03 depends on ST-02's table content.

## QA plan

This slice is a pure CSS custom-property refactor plus one test file change: no `.vue` component, no `DynamicFormItem`/`computedProps`/validation wiring, no reactivity. All new assertions are static text checks over the compiled stylesheet, so everything lands as plain `*.test.ts` in `packages/starter/src/__tests__/themeScope.test.ts` (extending the existing `describe` blocks, no new file; `classUsage.test.ts` stays untouched, matching the Architecture). No `*.logic.test.ts`, `*.validation.test.ts`, or `*.analytics.test.ts` file is needed: there is no component render, no `computedProps`, and no vee-validate wiring anywhere in this story's surface. Flagging this explicitly as a deliberate absence, not an oversight.

Reused fixtures/helpers: `compiledStylesheet` (compiles `style.scss` via `sass-embedded`, already used by every test in this file) and the file's own `blockOf`/`variableIn` helpers, plus the existing `effectiveDarkValue` closure pattern from the "decision A" describe block. No new helper file is needed; everything is a regex scan over the one compiled string.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 14 tokens declared on `:root` with exact values, grouped under `/* radius */`/`/* typography */` banners after the colour groups | New `it.each` over the 14 `[name, value]` pairs asserting `variableIn(blockOf(':root'), name)` equals the literal exactly (`6px`, `8px`, `10px`, `12px`, `9999px`, the mono stack, `11px`...`24px`, `500`, `600`); one assertion that `/\* radius \*\//` and `/\* typography \*\//` banner comments exist in the raw `style.scss` source (read via `stylesheetSourcePath`, not the compiled CSS which strips SCSS comments... actually Sass keeps `/* ... */` comments in compiled CSS, so this can read `compiledStylesheet` directly) and that `/* radius */` appears after the last colour banner and before `/* typography */` | `themeScope.test.ts`, new `describe('public theme contract')` |
| 2 Full retrofit: every in-scope call site reads through a bare `var(--sft-*)`, no fallback | Covered structurally by AC8's leftover-literal test (if a literal survives outside `:root`/`:root.dark`, retrofit is incomplete) plus a new assertion scanning the whole stylesheet for `var(--sft-radius-`, `var(--sft-font-` followed by a comma (a fallback) and asserting zero matches, proving ADR-5's "bare `var()`, no fallback" rule | `themeScope.test.ts`, same `describe` block |
| 3 Zero default visual change | Not directly testable as a repeatable CI assertion: there is no persisted "pre-story" artifact to diff against once the story merges. Structurally guaranteed by AC1 (the `:root` value equals today's literal exactly) combined with AC8 (no literal call site survives, so every call site resolves through that same `:root` value): together these prove the rendered output is unchanged without needing a textual diff tool. Rewrite proposal below; one-time manual verification during implementation covers the literal textual-diff intent of the AC as written | Manual (see checklist) |
| 4 `inherit` usages untouched, not matched by AC7's guard | Assert `blockOf('.sft-input')`-equivalent control-font-reset selector block still contains `font-family: inherit` (selector group `.sft-input, .sft-select, .sft-btn, .sft-step, .sft-choice-card, .sft-switch`) and the `.sft-input`/`.sft-select` sizing block contains `font-size: inherit`; assert the leftover-literal test's literal set (AC8) does not include the string `inherit`, so these two lines can never trip it | `themeScope.test.ts`, same `describe` block |
| 5 No new `:root.dark` entries for the 14 tokens | `it.each` over the 14 names asserting `variableIn(darkBlock, name)` is `undefined` while `variableIn(rootBlock, name)` is defined, reusing the existing `effectiveDarkValue` closure (same shape as the current "gives `--sft-input-border` no dark override" test) | `themeScope.test.ts`, same `describe` block |
| 6 Guard test: pinned public contract name set (55 names) | Extract all `--sft-*` names declared in `blockOf(':root')` via regex, sort, assert deep-equal against a pinned, sorted `CONTRACT_VARIABLES` array (41 existing + 14 new); assert the failure path by constructing the diff message (missing vs. unexpected) so a future add/rename/remove gets a readable assertion failure, not just a boolean mismatch | `themeScope.test.ts`, same `describe` block |
| 7 Guard test: new tokens have no `:root.dark` override | Same test as AC5 (the behavioral requirement and its guard are the same assertion; AC5 states the fact, AC7 states the guard that enforces it) | `themeScope.test.ts`, same `describe` block |
| 8 Guard test: leftover-literal proves wiring | Strip the `:root { ... }` and `:root.dark { ... }` blocks from `compiledStylesheet` (reuse `blockOf`'s regex to locate and remove them, not just read them), then assert the remainder matches none of: `border-radius: (6px\|8px\|9999px\|10px\|12px)`, `font-size: (11px\|12px\|14px\|18px\|20px\|24px)`, `font-weight: (500\|600)`, `font-family: ui-monospace, SFMono-Regular, Menlo, monospace`. The "fails red against the pre-retrofit stylesheet" requirement is a test-design proof, not a standing CI assertion (the pre-retrofit literals no longer exist in the tree once the retrofit lands): verified once during implementation by temporarily reverting one call site's `var()` swap, confirming this test goes red, then re-applying the swap. Documented as a manual implementation-time check, not a repeated automated one | `themeScope.test.ts`, same `describe` block; manual proof step in checklist |

### Edge cases to tests
- The `10px` radius value (icon-catalogue demo tile) absorbed into `--sft-radius-lg`: covered by AC1 (the value `10px` is never pinned to its own token name) and AC8 (no raw `10px` `border-radius:` literal survives outside `:root`/`:root.dark`); no separate test needed since the leftover-literal scan already includes `10px` in its radius set.
- The shared `8px` radius (inputs, dashed choice group, wizard alert, JSON panel) resolving to one token everywhere: covered by the same AC8 scan: if any one of those four call sites still reads a raw `8px`, the leftover-literal test catches it regardless of which selector it is, so no per-selector enumeration is needed.

### States from the feature's states policy applicable to this slice
Not applicable. There is no new or modified component render surface in this story (no `DynamicFormItem`, no form control markup changes, no new CSS state class). The existing `is-invalid`/`is-disabled`/etc. state classes already exist and are untouched; this story only changes which custom property their `border-radius`/`font-size`/`font-weight`/`font-family` declarations read from, not the selectors or state logic themselves.

### Reactivity / analytics
Not applicable. Nothing in this story touches `DynamicFormItem`, `computedProps`, or validation wiring; the change is a compile-time CSS custom-property swap with zero JavaScript or Vue reactivity involved. No `*.analytics.test.ts` file is needed.

### Coverage
No statement/branch/function coverage impact: `style.scss` is not JS/TS source and is not instrumented by `pnpm -r ci:test:coverage`. The only source-code change in this story is the one new `describe` block in `themeScope.test.ts` itself, which is test code, not covered code. `pnpm -r ci:test:coverage` baseline for `packages/core`/`packages/element-plus`/`packages/starter` is expected to stay exactly where it is; nothing is knowingly left uncovered.

### Time sensitivity
None. No date/time-dependent behaviour anywhere in this story; `TZ=Europe/Amsterdam` only matters because `ci:test:coverage` sets it globally, not because of anything this story adds.

### Regression risk
- `packages/starter/src/style.scss` is the only source file touched; every selector in the file is a candidate for an accidental value change during the ~85-site swap. The leftover-literal test (AC8) is the main structural guard: it fails if any in-scope call site is missed or mistyped during the swap. `classUsage.test.ts` and `prototypeParity.test.ts`-style coverage are unaffected since no class name or selector changes.
- ST-02 and ST-03 both depend on this story's final token names (the pinned `CONTRACT_VARIABLES` list); a rename after this story merges would be caught by their own guard test failing against the new name set, but that is out of this story's scope to re-verify.
- `packages/element-plus` and `packages/core` are untouched by this story; their own suites (`pnpm --filter ./packages/element-plus run ci:test`, `pnpm --filter ./packages/core run ci:test`) are the regression guard confirming this story did not disturb them, which it structurally cannot since no shared code is touched.

### Untestable criteria and rewrite proposals
- **AC3** ("diffed after normalizing the custom-property declarations... every selector resolves to the identical rendered value it had before") cannot be a standing CI assertion: it requires a persisted pre-story compiled artifact that will not exist in the tree after this story merges. Rewrite proposal: narrow AC3 to what is actually machine-checked going forward, "every `:root` token value in AC1 matches today's literal exactly, and no in-scope literal survives outside `:root`/`:root.dark` per AC8," and treat the literal before/after `dist/style.css` diff as a one-time manual verification performed during implementation (see checklist), not a repeated test.
- **AC8**'s "fails red against the pre-retrofit stylesheet" clause is a test-design proof exercise, not a repeatable assertion (there is no pre-retrofit source to run it against once the retrofit lands). Rewrite proposal: read this clause as a one-time implementation-time verification step (temporarily revert one swap, confirm red, reapply), documented in the manual checklist, rather than something the finished test suite re-demonstrates on every run.
- All other criteria (1, 2, 4, 5, 6, 7) are testable as written with the mapping above; no rewrite needed.

### Manual verification checklist
1. Before starting the retrofit, run `pnpm --filter ./packages/starter exec sass-embedded src/style.scss` (or an equivalent one-off build) to capture the pre-story compiled CSS; after the retrofit, build again and diff the two outputs ignoring the `:root`/`:root.dark` declaration blocks themselves, confirming every selector's rendered `border-radius`/`font-size`/`font-weight`/`font-family` value is unchanged (AC3's literal intent).
2. During implementation, temporarily revert the `var()` swap at one call site (re-insert the raw literal), run the leftover-literal test, confirm it fails red, then reapply the swap and confirm it passes (AC8's self-proving design, done once, not kept as a standing step).
3. Visually spot-check the Storybook starter playground (or the docs dogfood page) before and after the retrofit at a couple of radius/typography-heavy surfaces (buttons, pills, the choice grid, the review/confirm cards) to sanity-check the zero-visual-change claim beyond what the pixel-value tests can show, in both light and dark mode.

## Adversarial review
Lite (story level): blockers only. Facts re-verified against the live tree: 41 `--sft-*` colour tokens on `:root` (matching the 41 the contract builds on), the `blockOf`/`variableIn`/`effectiveDarkValue` helpers exist in `themeScope.test.ts` exactly as the plan reuses them, `compiledStylesheet` compiles via `sass-embedded` in the default expanded mode (so the `/* radius */` / `/* typography */` banner comments survive into the compiled CSS AC1 reads), both `inherit` sites and the control-font-reset selector group (`.sft-input, .sft-select, .sft-btn, .sft-step, .sft-choice-card, .sft-switch`) match AC4, and all 25 `border-radius` declarations are single-value (no `8px 8px 0 0` shorthand that could slip past the AC8 scan). Token names/values, the 55-name pin, and the zero-`:root.dark` claim are all consistent with the approved feature architecture. Dependencies are correct (none; ST-02/ST-03 depend on this).

1. **AC2 `font-size` count is off by one against AC4 (should-fix).** AC2 asserts all "39 `font-size`" call sites are swapped to `var()` with "none left as a raw literal", but AC4 explicitly leaves the one `font-size: inherit` site untokenized. Only 38 of the 39 are tokenizable. The `font-family` count already excludes its own `inherit` (2 of 3), so the two properties are counted inconsistently and AC2 reads as contradicting AC4. Not a blocker: AC4 and the AC8 leftover-literal scan (which never matches `inherit`) already make the implementation unambiguous, so this is a criterion-text precision issue, not a behavioural one. **Routed** as a `PROPOSED (adversarial review)` reword under AC2.

2. **AC3 and AC8's "fails red" clause untestable-as-written (noted, already handled by QA, no new action).** The QA plan flagged both in its "Untestable criteria and rewrite proposals" subsection with concrete rewrites (AC3 narrowed to the machine-checkable AC1+AC8 combination plus a one-time manual diff; AC8's red-proof treated as a one-time implementation-time step). Both are routed and sound; re-recording here only so the resolution is visible from this section. No further action.

3. **QA plan adds a fourth guard assertion beyond the feature's three-point Guard test design (nit).** The AC2 mapping introduces a "no `var()` fallback" scan that is not among the feature architecture's enumerated three guard checks. It does not contradict the architecture: it mechanically enforces ADR-5 ("bare `var()`, no fallback"), which the feature already decided, so it is a consistent addition rather than a silent override. No action required; flagging for visibility.

Status rationale: no unresolved Open questions (the feature's six are all `DECIDED`; the story has none), no blockers, and the single should-fix (finding 1) is routed as a `PROPOSED (adversarial review)` edit. By rule 3 this lands at `awaiting-approval`.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
