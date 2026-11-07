---
id: ST-02
type: story
feature: FEAT-011
status: done
approved_by: Jeroen
pr: ""
---

# Story: Focus-visible rings, contrast corrections, and the screen-reader-only utility

## Functional
### User story
As a keyboard-only user operating any control the starter template renders, I want a visible, sufficiently contrasted focus indicator on whatever I tab to, in both light and dark mode, so that I always know where keyboard focus is.

### Acceptance criteria
1. **Every interactive control shows a visible, correctly-scoped focus indicator, matching the approved prototype's three distinct treatments.**
   `DECIDED (Jeroen)`: accepted as proposed by the adversarial review (finding 1); the blanket "one outline treatment for everything" framing is replaced by the split below.
   - **Outline-on-`:focus-visible` controls** (password toggle, every `.sft-btn` variant, `.sft-step` dot, `.sft-switch` track): `outline: 2px solid var(--sft-focus-visible)` with a 2px offset (3px on the step dot). These use `:focus-visible`, never `:focus`, so a mouse click never paints the ring.
   - **`.sft-input` / `.sft-select`:** plain `:focus` (not `:focus-visible`) sets `border-color: var(--sft-focus-visible)` and `box-shadow: 0 0 0 2px var(--sft-focus-ring)` (no `outline`). A text input conventionally shows its focus ring on click too; this is intended, matching the feature's Contrast corrections section ("the pale `--sft-focus-ring` companion ring is kept").
   - **`.sft-choice-card`:** `box-shadow: 0 0 0 2px var(--sft-focus-visible-choice)` on `:focus-visible` (a ring, not an `outline`, indigo choice token per AC2).

2. **Two focus tokens, correctly scoped.**
   Given `style.scss`'s `FEAT-011 ADDITIONS` block,
   When `:root` and `:root.dark` are inspected,
   Then `--sft-focus-visible` (sky, `#0084d1` light / `#38bdf8` dark) is used by inputs, selects, buttons, toggle, stepper, and the password toggle; `--sft-focus-visible-choice` (indigo, `#4f39f6` light / `#a3b3ff` dark) is used only by choice cards.

3. **Light-mode contrast corrections meet 3:1.**
   Given the corrected light-mode values `#0084d1` (input/select/toggle/password-toggle ring) and `#4f39f6` (choice-card ring) against a white card background,
   When measured for non-text contrast (WCAG 2.2 SC 1.4.11),
   Then both clear 3:1 (verified ~4.0:1 and higher respectively; manual contrast-checker verification during implementation, not a jsdom test per the feature's axe `color-contrast` limitation).

4. **Dark mode renders identically to the prototype with no new overrides needed beyond the two tokens.**
   Given `:root.dark`,
   When every modified selector is inspected,
   Then no rule hardcodes a dark-specific color outside the two new token declarations; everything else resolves through existing `--sft-*` tokens unchanged.

5. **`.sft-sr-only` utility exists and is visually hidden but accessible.**
   Given the new `.sft-sr-only` class,
   When applied to an element,
   Then the element is removed from visual layout (offscreen, zero-size clip technique) but remains in the accessibility tree (not `display: none`, not `visibility: hidden`).

6. **`prototypeParity.test.ts` stays green with the new block present.**
   Given the existing prototype-parity test,
   When run against the updated `style.scss`,
   Then it passes, confirming the `FEAT-011 ADDITIONS` block matches the prototype's CSS delta.

### Edge cases
- The password reveal button previously had no `focus-visible` rule at all; confirm the new rule applies to it specifically, not only inherited from a shared `.sft-btn` selector it might not match.
- A choice card's ring and an input's ring must never look identical when both are visible in the same viewport (different accent family), confirmed by a side-by-side screenshot.

### Out of scope
- `aria-*` attribute wiring: ST-01.
- Choice-card keyboard roving-tabindex behavior (only the ring color is this story's concern): ST-06.
- Password strength live region (uses `.sft-sr-only` but is its own story): ST-03.

## Design reference
Implements the feature's [States policy](../../spec.md#states-policy-one-policy-applied-everywhere) and [Contrast corrections](../../spec.md#contrast-corrections-the-only-colour-changes) sections in full, with no delta left open. Prototype anchors covering every ring this story must reproduce: [`#text-field`](../../prototype.html#text-field), [`#select-field`](../../prototype.html#select-field), [`#password-field`](../../prototype.html#password-field), [`#choice-cards`](../../prototype.html#choice-cards), [`#array-remove`](../../prototype.html#array-remove), [`#wizard-step`](../../prototype.html#wizard-step) (stepper ring), [`#toggle-field`](../../prototype.html#toggle-field). The `.demo-focus` helper in the prototype is a static stand-in for the real `:focus-visible` rule this story writes.

## Architecture reference
Implements the feature architecture's Slicing seam 2 in full: a pure `style.scss` delta.

- **`style.scss`** — the `FEAT-011 ADDITIONS` block exactly as prototyped: `.sft-sr-only`, `--sft-focus-visible` / `--sft-focus-visible-choice` declared on `:root` and `:root.dark`, and `:focus-visible` rules for the password toggle, every `.sft-btn` variant, `.sft-step`, and the corrected input/toggle/choice-card rings.

  `DECIDED (Jeroen)`: accepted as proposed by the adversarial review (findings 2 and 3). This is **not** a purely additive block:
  - **(finding 2)** Three pre-existing shipped focus rules must be edited, not left to survive alongside a naive append: (a) `.sft-input:focus`/`.sft-select:focus` (`style.scss:355`, `border-color: var(--sft-focus-border)` → `var(--sft-focus-visible)`); (b) `.sft-switch:focus-visible .sft-switch-track` (`style.scss:537`, hardcoded `#00a6f4` → `var(--sft-focus-visible)`); (c) `.sft-btn-primary:focus-visible` (`style.scss:633-638`, `outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #74d4ff` → removed, so the primary button uses only the shared `.sft-btn:focus-visible` outline, matching the prototype). Leaving (a)/(b) is harmless-but-dead CSS; leaving (c) is a visible double-ring regression.
  - **(finding 3)** The `[data-page]` wrapper (`StarterFormTemplate.vue:574-577`) carries no class and no focus ring today, and the prototype's `.sft-wizard-title`/`.sft-section-title` heading rings target a focus destination Open question 2 superseded. This story ships the container's own ring instead: `[data-page]:focus-visible` reusing the 4px heading-ring styling, so ST-04's container focus (which adds the `tabindex="-1"` and accessible name) is actually visible. The heading rules are dropped rather than left as dead CSS.
- **Public API surface touched:** two new consumer-observable `--sft-*` tokens (additive, retheme-able) and one new `.sft-sr-only` utility class in `dist/style.css`. Three existing focus colors are corrected for contrast (a visual fix, not a new contract). No `packages/core/src/` change.
- **Dependencies on other stories:** none. This slice depends on nothing and nothing in slices 1/4/5 structurally depends on it, but ST-03 (needs `.sft-sr-only`) and ST-06 (needs the indigo ring token) should implement after this one lands so they can reuse the real class/token instead of duplicating it.
- **Documentation:** none assigned to this story directly. The two new tokens are documented in ST-08's theming subsection update to `docs/guide/starter-template.md`.

### Manual verification checklist
1. Screenshot every modified control's focus state in both light and dark mode (Playwright, per CLAUDE.md), comparing against the prototype's painted rings.
2. Run a contrast checker against the three corrected colors on a white card and the existing dark card, confirming the 3:1 figures in AC3 and the feature's Contrast corrections section.

## QA plan

This slice is a pure `style.scss` delta: no `.vue` component, no `DynamicFormItem`/`computedProps`/validation wiring, no reactivity. All automatable assertions are static text checks over the compiled stylesheet, landing as plain `*.test.ts` in `packages/starter/src/__tests__/`. No `*.logic.test.ts`, `*.validation.test.ts`, or `*.analytics.test.ts` file is needed anywhere in this story: there is no component render, no `computedProps`, and no vee-validate wiring. Flagging this explicitly as a deliberate absence, matching ST-01 of FEAT-013's precedent for a CSS-only slice.

Reused fixtures/helpers: `compiledStylesheet` (`packages/starter/src/__tests__/helpers/compiledStylesheet.ts`, compiles `style.scss` via `sass-embedded`), `prototypeParity.test.ts`'s existing `classTokensIn`/`existsInStylesheet` pattern, and `themeScope.test.ts`'s `blockOf`/`variableIn`/`effectiveDarkValue` helpers. One new fixture is needed: `prototypeParity.test.ts` currently reads only `specs/FEAT-007-starter-form-template/prototype.html`'s `STARTER FORM TEMPLATE PACKAGE STYLES` block; AC6 requires it (or a sibling test in the same file) to also read `specs/FEAT-011-starter-accessibility/prototype.html`'s `FEAT-011 ADDITIONS` block (the comment banner at prototype.html:345) and assert every class/token it introduces (`.sft-sr-only`, `--sft-focus-visible`, `--sft-focus-visible-choice`) exists in the shipped stylesheet, the same `classTokensIn`/`existsInStylesheet` shape already proven out for the FEAT-007 prototype.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Every listed control shows the correctly-scoped focus treatment per the split in AC1 | New `describe('focus-visible rings')` in a new `focusVisible.test.ts`, split by group per `DECIDED (Jeroen)` AC1: **outline group** (`.sft-btn*`, `.sft-password-toggle`, `.sft-step` dot, `.sft-switch` track) — assert `outline: 2px solid var(--sft-focus-visible)` on the `:focus-visible` rule with the `2px`/`3px` offset, and no bare `:focus` ring; **`.sft-input`/`.sft-select`** — assert the `:focus` rule (kept as `:focus`, not `:focus-visible`) sets `border-color: var(--sft-focus-visible)` and `box-shadow: 0 0 0 2px var(--sft-focus-ring)`, and assert no `outline` is set and the `:focus` rule is not removed; **`.sft-choice-card`** — assert `:focus-visible` sets `box-shadow: 0 0 0 2px var(--sft-focus-visible-choice)` (no outline) | `focusVisible.test.ts` (new) |
| 1b (finding 2) Pre-existing shipped focus rules are actually replaced, not shadowed | Assert `.sft-btn-primary:focus-visible` no longer carries its shipped `box-shadow: 0 0 0 2px #fff, 0 0 0 4px #74d4ff`; assert `.sft-input`/`.sft-select`'s `:focus` border references `var(--sft-focus-visible)`, not the shipped `var(--sft-focus-border)`; assert `.sft-switch` track's `:focus-visible` outline references `var(--sft-focus-visible)`, not the shipped hardcoded `#00a6f4` | `focusVisible.test.ts` (new) |
| 1c (finding 3) `[data-page]` container ships its own focus ring | Assert a `[data-page]:focus-visible` rule exists with the 4px-offset heading styling, and that `.sft-wizard-title`/`.sft-section-title`'s superseded heading-focus rules are removed, not left as dead CSS | `focusVisible.test.ts` (new) |
| 2 Two tokens, correctly scoped (`--sft-focus-visible` sky, `--sft-focus-visible-choice` indigo, on both `:root` and `:root.dark`) | `it.each` over `[token, lightValue, darkValue]` using `variableIn(blockOf(':root'), name)` / `variableIn(blockOf(':root.dark'), name)`, asserting `#0084d1`/`#38bdf8` and `#4f39f6`/`#a3b3ff`; separate assertions that every sky-scoped selector's `:focus-visible` rule references `var(--sft-focus-visible)` and that only `.sft-choice-card` references `var(--sft-focus-visible-choice)` | `focusVisible.test.ts` (new) |
| 3 Light-mode contrast corrections meet 3:1 | Not testable in jsdom/sass (no layout or color-math engine; same `color-contrast` limitation the feature's axe plan already documents). Covered by the manual contrast-checker step below and by AC2's token-value assertion pinning the exact corrected hex values | Manual (checklist step 2) |
| 4 Dark mode needs no overrides beyond the two tokens | Reuse `themeScope.test.ts`'s `effectiveDarkValue` pattern: for every selector touched by this story, assert no new `:root.dark`-only color declaration exists beyond the two tokens' own redeclaration (i.e. no hardcoded dark-specific value inside the selector blocks themselves, only `var(--sft-*)` references) | `focusVisible.test.ts` (new), reusing `themeScope.test.ts`'s helper shape |
| 5 `.sft-sr-only` exists, visually hidden but accessible (not `display:none`/`visibility:hidden`) | `blockOf('.sft-sr-only')` asserts the offscreen-clip declarations (`position: absolute`, zero `width`/`height` or `clip`/`clip-path`, `overflow: hidden`) are present and asserts the block contains neither `display: none` nor `visibility: hidden` | `focusVisible.test.ts` (new) |
| 6 `prototypeParity.test.ts` stays green with the new block present | Extend `prototypeParity.test.ts` with a second `describe` reading the FEAT-011 prototype's `FEAT-011 ADDITIONS` block (see fixture note above) through the same `classTokensIn`/`existsInStylesheet` helpers, plus an `it.each` asserting the two new tokens are declared on both `:root` and `:root.dark` | `prototypeParity.test.ts` (extended) |

`DECIDED (Jeroen)`: accepted as proposed (findings 1, 2, 3); folded directly into the AC1/AC-test-map rows above, superseding this blockquote.

### Edge cases to tests
- Password reveal button's own `:focus-visible` rule (not only inherited from `.sft-btn`): assert `blockOf('.sft-password-toggle')` or whichever selector actually carries the rule includes its own `:focus-visible` block, not merely that `.sft-password-toggle` matches `.sft-btn` structurally (confirm in the component source which class the button carries at render time, since `PasswordInput.vue` renders `class="sft-password-toggle"`, not `.sft-btn`, so a `.sft-btn:focus-visible` rule alone would not cover it, this is exactly the gap AC1's edge case calls out).
- Choice-card ring vs. input ring visually distinct: not unit-testable (color-math), covered by the Playwright side-by-side screenshot in the manual checklist.

### States from the feature's states policy applicable to this slice
Only the feature's "Focus indicator (new, unified)" state applies here: every listed control's focus state, in both the sky and indigo accent families, in both light and dark mode. The "Error", "Valid/pristine/disabled", and "Loading/empty" states listed in the feature's states policy are out of this slice (no markup, attribute, or error-path change here); they are exercised by ST-01 and ST-03's test plans instead. This story's component states are, per AC1's `DECIDED (Jeroen)` split: default (no ring) and `:focus-visible` (ring visible) for the outline group and choice cards, where mouse click never paints a ring; and default vs. plain `:focus` (ring visible on both keyboard and mouse) for inputs/selects, where that is the intended, conventional behavior, not a gap. The outline group's "no ring on mouse click" distinction is only verifiable by a real browser's focus-visible heuristic, not jsdom, so it is covered by the manual checklist, not a unit test.

### Reactivity / analytics
Not applicable. Nothing in this story touches `DynamicFormItem`, `computedProps`, or validation wiring; the change is a compile-time CSS swap. No `*.analytics.test.ts` file is needed.

### Coverage
No statement/branch/function coverage impact: `style.scss` is not JS/TS source and is not instrumented by `pnpm -r ci:test:coverage`. The only source-code change is the new `focusVisible.test.ts` file and the extension to `prototypeParity.test.ts`, both test code, not covered code. The `pnpm -r ci:test:coverage` baseline is expected to stay exactly where it is; nothing is knowingly left uncovered.

### Time sensitivity
None. No date/time-dependent behaviour anywhere in this story.

### Regression risk
- `packages/starter/src/style.scss` is the only source file touched. Removing/changing the existing `.sft-input`/`.sft-select` `:focus` rule (AC1) risks silently dropping the ring for a browser or test that only checks `:focus`; `focusVisible.test.ts`'s "no bare `:focus` ring remains" assertion is the structural guard.
- `classUsage.test.ts` is affected if `.sft-sr-only` is referenced from a `.vue` file before this story lands (it should not be yet, since no consumer of the class exists until ST-03/ST-06); confirm no premature reference trips that test.
- `themeScope.test.ts`'s pinned contract-name assertions (if FEAT-013's `CONTRACT_VARIABLES` guard has already landed by the time this story merges) will need the two new token names added to that pinned list, or that guard test fails; cross-check against FEAT-013's status at implementation time.
- ST-03 (needs `.sft-sr-only`) and ST-06 (needs `--sft-focus-visible-choice`) both build on this story's output; their own test suites are the regression guard that this story's class/token names are usable as-is, not this story's job to pre-verify.
- `prototypeParity.test.ts`'s existing FEAT-007 assertions are untouched by this story (only a new `describe` block is added); `packages/core` and `packages/element-plus` are untouched entirely.

### Untestable criteria and rewrite proposals
- **AC3** ("measured for non-text contrast... both clear 3:1") cannot be a standing CI assertion: jsdom/sass has no color-math or layout engine, which is the same limitation the feature's own axe-core test plan already documents for `color-contrast`. Rewrite proposal: narrow AC3's machine-checkable half to "the `:root`/`:root.dark` token values match the specified hex codes exactly" (already covered by AC2's test) and treat the 3:1 verification itself as the one-time manual contrast-checker step in the Manual verification checklist, exactly as the story's own checklist already states. No change needed to the story text beyond noting this split explicitly; the AC is already written with the manual caveat inline ("manual contrast-checker verification during implementation, not a jsdom test"), so this is confirmation, not a new proposal.
- All other criteria (1, 2, 4, 5, 6) are testable as written with the mapping above.

### Manual verification checklist (QA additions to the existing list above)
3. Confirm via keyboard-only tabbing in a real browser (not jsdom) that clicking an **outline-group control or choice card** with a mouse never paints a ring, only `Tab` does (`:focus-visible` heuristics are browser-implemented and not reproducible in jsdom); separately confirm an input/select **does** show its ring on a plain mouse click, per AC1's `DECIDED (Jeroen)` split (that is intended, not a regression).
4. Cross-check the password-toggle ring specifically (edge case above): tab to it in both light and dark mode and confirm a ring actually renders, since it had no focus style at all before this story.

## Adversarial review

STORY mode (lite): blockers first, with should-fixes routed as `PROPOSED (adversarial review)` edits above. Verified against the shipped `packages/starter/src/style.scss`, the feature prototype's `FEAT-011 ADDITIONS` block, `StarterFormTemplate.vue`, `PasswordInput.vue`, and the test helpers the QA plan reuses (`prototypeParity.test.ts`, `themeScope.test.ts`, `classUsage.test.ts`, `compiledStylesheet.ts`). Confirmed true: `PasswordInput.vue:51` carries `class="sft-password-toggle"` (so the password-toggle edge case is real); `classUsage.test.ts` only checks `.vue → stylesheet`, never the reverse, so a consumer-less `.sft-sr-only` does not fail CI (the story's regression note is accurate); the AC2 token values match the prototype's `:root`/`:root.dark` (`#0084d1`/`#38bdf8`, `#4f39f6`/`#a3b3ff`).

1. **(blocker) AC1 and its QA test contradict the approved prototype for `.sft-input`/`.sft-select` and `.sft-choice-card`.** AC1 asserts every listed control, including inputs/selects and choice cards, shows "a 2px solid outline with a 2px offset" on `:focus-visible` and never on `:focus`. The approved prototype gives inputs/selects `border-color: var(--sft-focus-visible)` + `box-shadow: 0 0 0 2px var(--sft-focus-ring)` on **plain `:focus`** (no outline, deliberately not `:focus-visible`, matching the feature's Contrast corrections section), and gives choice cards a `box-shadow` ring in the indigo choice token (no outline). The AC1 QA test row mandates an `outline: 2px solid var(--sft-focus-visible)` for all three and that the input/select `:focus` rule be removed or become `:focus-visible`. Implemented literally, that test fails against a faithful prototype implementation, or forces a silent deviation from approved design. This is settleable from ladder rung 1 (the approved prototype wins). Resolution routed as `PROPOSED` edits into AC1 and the QA test map.

   `DECIDED (Jeroen)`: accepted as proposed. AC1 and the QA test map now reflect the prototype's three distinct treatments directly.

2. **(should-fix) The change is framed as additive but must edit pre-existing shipped focus rules.** The prototype's flattened CSS replaced `.sft-input:focus` (`--sft-focus-border`), `.sft-switch:focus-visible .sft-switch-track` (hardcoded `#00a6f4`), and `.sft-btn-primary:focus-visible` (bespoke `#fff`/`#74d4ff` double box-shadow). A naive append leaves all three in the shipped sheet. The primary-button one is the worst: its surviving `box-shadow` combines with the new `.sft-btn:focus-visible` outline into a double ring the prototype never draws, and AC1's "outline present" assertion passes anyway. Resolution routed as `PROPOSED` edits into the Architecture reference and the QA test map.

   `DECIDED (Jeroen)`: accepted as proposed. The Architecture reference and QA test map now require the three pre-existing rules to be edited, not shadowed.

3. **(should-fix) Superseded heading-focus CSS shipped; the `[data-page]` container ring is omitted.** The story reproduces the prototype's `.sft-wizard-title`/`.sft-section-title:focus-visible` rings, but the feature's Open-question-2 decision superseded the heading target: focus moves to the `[data-page]` container, and the feature states "the heading-focus ring styling carries over to the container instead." That container (`StarterFormTemplate.vue:574`) has no `.sft-*` class and gets no ring from this story, so ST-04's container focus would be invisible while the heading rules sit dead. The story's claim "no delta left open" is therefore not met. Resolution routed as a `PROPOSED` edit into the Architecture reference.

   `DECIDED (Jeroen)`: accepted as proposed. The Architecture reference now ships the `[data-page]:focus-visible` ring and drops the superseded heading rules.

## Implementation notes

Pure `style.scss` delta, exactly as scoped. Summary of the edit:

- Two new tokens, `--sft-focus-visible` and `--sft-focus-visible-choice`, added next to the existing sky/indigo accent tokens on `:root`, with dark-mode values re-declared under `:root.dark` (the file's established convention for every other theme token; no reopened `:root` block was needed).
- `.sft-sr-only` and the genuinely new `:focus-visible` rules (password toggle, shared `.sft-btn`, stepper dot, `[data-page]` container) live under one `FEAT-011 ADDITIONS` comment banner near the end of the file, right before the grid-utility loops.
- The three pre-existing focus rules findings 2/3 required (input/select border-color, switch-track outline, the primary-button double ring) were edited in place next to where they already lived, not shadowed by a new rule. The choice-card ring (`.sft-choice-card:focus-visible`) was also edited in place, since AC1 requires the indigo token there even though finding 2 only named three rules explicitly.
- No `.sft-wizard-title:focus-visible` / `.sft-section-title:focus-visible` rules exist in the shipped stylesheet (they never did); the architecture's "drop the superseded heading rules" direction is satisfied by never adding them, in favor of `[data-page]:focus-visible`.

Deviations:
- **No changeset added.** CLAUDE.md's general rule asks for one whenever `packages/starter/src` changes, but the feature spec explicitly assigns the feature's single changeset to ST-06 ("carries the feature's single changeset as the last story to change shipped runtime behavior"), and this story's own text does not call for one. Following the feature's explicit batching decision over the general rule.
- **Test helpers duplicated, not imported.** `focusVisible.test.ts` reimplements small `blocksOf`/`variableIn`-shaped helpers rather than importing the non-exported consts of the same name from `themeScope.test.ts`, since those aren't exported and extracting them to a shared module was out of this story's scope. `blocksOf` is more robust than the existing pattern (it tolerates sass-embedded's line breaks after a selector comma, and it concatenates every matching block instead of only the first, which the two-token check needed since `--sft-focus-visible*` keeps being redeclared under later `:root.dark` content as the file grows).
- **`prototypeParity.test.ts`'s new fixture slice.** The prototype's own explanatory header comment also contains the literal string "FEAT-011 ADDITIONS", so the extension slices from `lastIndexOf`, not `indexOf`, to land on the actual banner at the bottom of the file (line 345), not the top-of-file mention (line 12).

Verification performed:
- `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck` (root `pnpm ci` is shadowed by pnpm's built-in command) all pass across `packages/core`, `packages/starter`, and `docs`.
- `TZ=Europe/Amsterdam pnpm -r ci:test:coverage` passes with no coverage drop (`style.scss` is not instrumented; the new/extended test files are test code, not covered code).
- Playwright screenshots (docs dev server, built against the freshly-built `packages/core`/`packages/starter` `dist/`) confirm the password-reveal button, a stepper dot, a primary button, an `.sft-input`, and a choice card all paint a visible keyboard-focus ring in both light and dark mode, and that the choice-card ring (indigo) and the input/button ring (sky) are visibly distinct accent families side by side, matching the edge case in the Functional section.

Verification command for Jeroen: `cd packages/starter && npx vitest run src/__tests__/focusVisible.test.ts src/__tests__/prototypeParity.test.ts`, plus `pnpm run ci:test` / `ci:lint` / `ci:typecheck` and `TZ=Europe/Amsterdam pnpm -r ci:test:coverage` from the repo root.

## Verification report

### Pipeline checks
- `pnpm run ci:test` (all three packages): 73 test files / 568 tests pass in `packages/starter` (includes `focusVisible.test.ts`, 28 tests, and the extended `prototypeParity.test.ts`, 122 tests); `packages/core` and `docs` suites unaffected and green.
- `pnpm run ci:lint`: clean across `packages/core` and `packages/starter`.
- `pnpm run ci:typecheck`: clean across `packages/core`, `packages/starter`, and `playgrounds/storybook`.
- `TZ=Europe/Amsterdam pnpm -r ci:test:coverage`: 568 tests pass; `packages/starter` overall 99.68% statements / 94.17% branch / 95% functions. `style.scss` is not instrumented (confirmed, no `.ts`/`.vue` source changed besides the two test files), so there is no coverage-impacting source change in this story and no drop versus baseline.
- `docs/` content did not change in this story, so `pnpm docs:build` was not required; skipped per the gate-check instructions.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. Every control shows the correct, scoped focus treatment (outline group / input-select / choice-card split) | Pass | `style.scss` diff: `.sft-password-toggle:focus-visible`, `.sft-btn:focus-visible`, `.sft-step:focus-visible .sft-step-dot`, `.sft-switch:focus-visible .sft-switch-track` all use `outline: 2px solid var(--sft-focus-visible)` (2px offset, 3px on the step dot). `.sft-input:focus`/`.sft-select:focus` kept as plain `:focus`, sets `border-color`+`box-shadow`, no outline. `.sft-choice-card:focus-visible` sets `box-shadow: 0 0 0 2px var(--sft-focus-visible-choice)`, no outline. Confirmed by `focusVisible.test.ts`'s full suite and by my own Playwright screenshots (input, password toggle, choice card, stepper dot, `[data-page]`, primary button) in both light and dark mode against the rebuilt `dist/style.css` served through the docs site. |
| 2. Two tokens, correctly scoped | Pass | `:root` declares `--sft-focus-visible: #0084d1` / `--sft-focus-visible-choice: #4f39f6`; `:root.dark` redeclares `#38bdf8` / `#a3b3ff`. `focusVisible.test.ts`'s `it.each` pins the exact values; a second test confirms only `.sft-choice-card` references the choice token and every other site references the sky token. |
| 3. Light-mode contrast corrections meet 3:1 | Pass (manual, as scoped) | Not CI-testable per the story's own untestable-criteria note (jsdom has no color-math engine). Token values match the prototype's stated corrected hex codes exactly (pinned by AC2's test); visually confirmed both rings read as a solid, clearly visible outline against the white card in my screenshots. |
| 4. Dark mode needs no overrides beyond the two tokens | Pass | `focusVisible.test.ts`'s "dark mode needs no overrides" suite asserts no `:root.dark <selector>` block exists for any of the seven touched selectors; manual diff of `style.scss` confirms every corrected/new rule references `var(--sft-*)` only. Dark-mode screenshots (input, password toggle, choice card, stepper, `[data-page]`, primary button) all render the same ring, just the dark-mode token color. |
| 5. `.sft-sr-only` exists, visually hidden but accessible | Pass | `position: absolute`, zero-size clip (`width/height: 1px`, `clip: rect(0 0 0 0)`, `overflow: hidden`), no `display:none`/`visibility:hidden`. Confirmed by `focusVisible.test.ts`'s `.sft-sr-only` suite and by direct inspection of the compiled CSS. |
| 6. `prototypeParity.test.ts` stays green with the new block present | Pass | Extended `describe('stylesheet covers the FEAT-011 focus-visible CSS delta')` passes; it slices the prototype's `FEAT-011 ADDITIONS` banner via `lastIndexOf` (correctly skipping the unrelated top-of-file mention) and asserts every class/token exists in the shipped stylesheet. |

### Prototype comparison
Rebuilt `packages/core` and `packages/starter` (`dist/` was briefly stale from an earlier build; rebuilding and restarting the VitePress dev server, consistent with the known linked-dist-staleness pitfall, was required before screenshots reflected the real change). Took Playwright screenshots against the docs site (`examples/validation.html`, `examples/choices.html`, `examples/wizard.html`) in both light and dark mode for: text input focus, the password reveal toggle (previously had no focus style at all — now shows a clear ring), a choice card (indigo ring, visibly distinct accent family from the sky input/button ring, satisfying the edge case), the stepper dot (sky ring outside the pre-existing pale "is-current" halo), the `[data-page]` wizard container (new 4px-offset ring, confirming finding 3's resolution renders), and the primary "Continue" button (single ring, confirming the double-ring regression from finding 2 is gone). All matched the prototype's painted rings and the feature's states policy; no visual drift found.

One investigation note for the record, not a defect: an early automated screenshot of the stepper dot, taken via a synchronous `element.focus()` immediately followed by a screenshot with no settle delay, appeared to show no ring. Root-caused to `.sft-step-dot`'s own pre-existing `transition: all .2s ease` animating the newly-applied `outline-color`/`outline-width` from their pre-focus (no-outline) state; the style's `outline-style` flips to `solid` instantly (a discrete property) while width/color are still interpolating at t≈0, producing a transient, misleading computed style. A settle delay (or a real keyboard `Tab`, confirmed in isolation) resolves to exactly the authored `2px solid var(--sft-focus-visible)`, offset 3px. The shipped CSS is correct; this was purely an artifact of my verification method.

### Process compliance
- `specs/components.md`: updated with an accurate paragraph describing `.sft-sr-only`, the two new tokens (values, scope, which selectors consume which token), and the three corrected/replaced focus colors (input/select border, switch track outline, primary button double-ring removal).
- Changeset: none added, correctly. The feature spec explicitly assigns the feature's single changeset to ST-06; `.changeset/` contains no new `.md` file, matching the story's stated deviation and rationale.
- No undocumented spec deviations found. The two documented deviations (no changeset; test helpers duplicated rather than imported from `themeScope.test.ts`) are both reasoned and scoped correctly.
- No new exports, no `packages/core` change, no library-API-rule violations; this is a pure `style.scss` delta as scoped.
- Test naming: `focusVisible.test.ts` is a plain `*.test.ts` (no `.vue` render, no `computedProps`, no vee-validate wiring), matching the story's own QA-plan rationale for skipping `.logic`/`.validation`/`.analytics` suffixes.

### Verdict: pass

No issues found. Status set to `done`. This is not the feature's last open story (ST-03 through ST-08 remain), so FEAT-011 stays `in-progress`.

Reminder for Jeroen: link the PR in this story's `pr:` frontmatter field once opened.
