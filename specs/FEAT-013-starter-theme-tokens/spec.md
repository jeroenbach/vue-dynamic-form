---
id: FEAT-013
type: feature
status: awaiting-discussion
approved_by: ""
epic: ""
---

<!-- epic: optional. Set to the parent EPIC-XXX id when this feature belongs to an
     epic; leave "" for a standalone feature. Features are never nested under the
     epic folder, they only reference it here (flat model). -->


# Feature: Starter theme tokens (radius and typography as a documented contract)

## Decided without Jeroen (research)

Settled from research during the pre-approval chain, not reviewed by Jeroen. Override any of these freely.

- Q5 → add a minor changeset; the "package is private" premise is false in the tree and CLAUDE.md step 7 already requires one for `packages/starter/src/` changes
- AR-1 → stale facts in Problem & goal and Constraints corrected against the live tree (style.scss, 1462 lines, 39 font-size declarations, version 0.0.0, no `private` field)

## Problem & goal
The starter package's stylesheet (`packages/starter/src/style.scss`, compiled to `dist/style.css`) already lets a consumer retheme every colour by overriding a `--sft-*` custom property on `:root`/`:root.dark`, and the README documents this as the supported way to retheme the template. Shape and type are not part of that promise today: border-radius and typography (font family, size, weight) are hardcoded literals at the call site. A consumer who wants sharper corners, a pill-free look, or a different brand font cannot do it with a variable; the only path is overriding individual `sft-` rules by cascade, which is exactly the selector-by-selector fight the colour tokens were built to avoid.

A direct read of `packages/starter/src/style.scss` (1462 lines) confirms the gap is real and larger than a quick guess suggests: 25 hardcoded `border-radius` declarations (5 distinct values), 39 hardcoded `font-size` declarations (7 distinct values), 19 hardcoded `font-weight` declarations (2 distinct values), and 3 `font-family` declarations (the same monospace stack twice, plus one `inherit`). That is roughly 85 call sites across radius and typography alone, well past the "15+" figure used to scope this feature initially.

Separately, the colour tokens that already exist are an informal convention, not a documented contract: the README states they exist and names the pattern, but there is no single list a consumer can check before upgrading, and nothing stops a future change from silently renaming or dropping one. Since `packages/starter` is unpublished (no release has run yet; it is at version `0.0.0` and already configured to publish via `publishConfig.access: "public"`), this is the cheapest point to turn the whole `--sft-*` surface, old and new, into a contract with a stated semver rule and a test that enforces it, before any real consumer can be broken by drift.

Goal: extend the `--sft-*` custom-property set so radius and typography are themeable the same way colour already is, with the current rendered output preserved exactly as the default (no visual regression), and publish the complete variable list, old and new, as a documented, versioned public contract that `pnpm ci` actively guards.

## Scope
### In scope
- New `--sft-*` custom properties covering the hardcoded `border-radius` values in `packages/starter/src/style.css` (confirmed: 9999px, 12px, 10px, 8px, 6px).
- New `--sft-*` custom properties covering the hardcoded typography values: `font-family` (the monospace stack), `font-size` (confirmed: 11px, 12px, 14px, 18px, 20px, 24px; the one `inherit` usage is left as `inherit`, not tokenized), `font-weight` (confirmed: 500, 600).
- Every new token's default value reproduces today's rendered CSS exactly. This ships as zero default visual change, not a redesign.
- A new token is re-declared under `:root.dark` only where the dark skin's value is genuinely different from the light one. Based on the audit, most radius and typography call sites use one value regardless of theme, so this likely adds few or no new entries to the `:root.dark` block (the same precedent already set by `--sft-input-border`, which has no dark override today).
- The complete `--sft-*` variable list, the colour tokens already shipped plus whatever radius/typography tokens this feature adds, documented as a public theming contract in `packages/starter/README.md`'s "Customization guidance" section: every variable, its purpose, and its default value.
- An explicit semver rule for the contract: adding a variable is a minor change; renaming or removing one is a major change.
- A guard test, in the style of `packages/starter/src/__tests__/themeScope.test.ts`, that pins the complete public variable list (names, not values) so a future rename or removal fails `pnpm ci` instead of shipping as an undetected breaking change.

### Out of scope (explicit)
- Any default visual redesign. This feature only extracts existing literals into variables with identical default values; it does not change what the default template looks like.
- Spacing values (margin, padding, gap). Not confirmed as part of this pass; see Open questions.
- Retheming anything outside `packages/starter`'s own stylesheet: `packages/element-plus`, the docs site's own chrome, Storybook's own chrome.
- A general design-token build pipeline (a JSON/TS token source generating CSS, Style Dictionary, or similar). This feature stays plain CSS custom properties, matching how the colour tokens already work.
- Deciding, inside this spec, whether the docs site gains a new dedicated theming reference page; see Open questions.
- Line-height. Not named in the original idea; see Open questions.

## Functional overview
- A consumer who already imports `@bach.software/vue-dynamic-form-starter/style.css` sees pixel-identical output before and after this feature ships.
- A consumer can now retheme shape and type the same way they already retheme colour: set a variable on `:root` (and `:root.dark` where it genuinely differs), with no `sft-` rule overridden by cascade. For example, a consumer wanting sharp corners instead of the default rounded look sets the new radius variables once, instead of hunting down every `border-radius` rule across the stylesheet.
- `packages/starter/README.md` lists every `--sft-*` variable, old and new, with its purpose and default value, so a consumer or contributor can see the whole theming surface in one place instead of reading the stylesheet end to end.
- A future change that accidentally renames or drops a documented variable is caught by the new guard test as part of `pnpm ci`, before it can reach a published release.

## Design (feature level)
Skipped, status goes straight to `architecture`. Reasoning: this feature has no new visual surface to prototype. The defining constraint is zero default visual change (every new token's default reproduces the current rendered CSS exactly), so there is nothing new for a reader to look at that doesn't already exist on `vue-dynamic-form.bach.software` or in the starter's own Storybook stories today. The actual design decisions this feature makes, which values become tokens, how they are named and grouped, and the shape of the semver contract, are public-contract decisions about a CSS API surface, not layout or visual design, so they belong in the Architecture section below rather than a `prototype.html`.

The one item that could reopen this: if the Open questions below land on "yes, add a dedicated docs theming reference page," that page is a documentation/reference page (a table and prose, matching the existing `docs/reference/*` pages), not a new UI pattern, so it still would not need a visual prototype. Flagging this explicitly rather than assuming, per the Open questions.

## Architecture (feature level)

### Audit reconciliation (facts corrected against the current tree)
The stylesheet is `packages/starter/src/style.scss` (SCSS authored, compiled to `dist/style.css` by `sass-embedded`), not `style.css`, and is 1462 lines, not 1270. A fresh grep confirms the audit with two corrections that the token set and the pinned guard list must reflect:
- `border-radius`: 25 declarations, 5 distinct values (`9999px` x10, `12px` x8, `8px` x5, `6px` x1, `10px` x1). Matches the audit exactly.
- `font-weight`: 19 declarations, 2 distinct (`600` x13, `500` x6). Matches.
- `font-family`: 3 declarations: the monospace stack `ui-monospace, SFMono-Regular, Menlo, monospace` twice (`.sft-success-ref code`, `.sft-icon-cell code`) plus one `font-family: inherit` (the control-font-reset rule). The two monospace stacks tokenize; the `inherit` stays `inherit`.
- `font-size`: **39** declarations, not 40. The spec's own itemization (`14px` x20, `12px` x14, `24px` x1, `20px` x1, `18px` x1, `11px` x1, `inherit` x1) sums to 39; the headline "40" is off by one. Six tokenizable distinct values (`11, 12, 14, 18, 20, 24`), plus the one `inherit` (the `.sft-input/.sft-select` mobile size that defers to the page font below 768px) left as `inherit`.

So: radius and typography together are **~85** call sites across **13** tokenizable distinct values (5 radius + 6 font-size + 2 font-weight) plus 1 font-family stack = **14 new tokens** under the recommended scheme below.

**Changeset/publish correction (bears directly on Open question 5):** `packages/starter/package.json` is `version: "0.0.0"`, has **no** `"private": true` field, and carries `publishConfig.access: "public"`; `.changeset/config.json` has `ignore: []`, so Changesets already treats the starter as a publishable package. The spec's Constraints premise ("`"private": true` at version `0.1.0`") does not match the tree. The README's "not published yet" is true only in the sense that no release has run; nothing marks the package private. This is a fact Jeroen needs when resolving Q5; I record it here rather than editing the Constraints section.

### Component / composable plan (against `specs/components.md`)
No new component, composable, export, prop, slot, setting, type, or validation rule. This feature is entirely a CSS-custom-property refactor plus a test and docs. Against the inventory:
- **Modified, backward compatible:** `packages/starter/src/style.scss`. Each in-scope literal is replaced by `var(--sft-token, <original-literal-as-fallback-omitted>)`; the token is declared on `:root` with the original literal as its value, so the compiled `dist/style.css` renders pixel-identical output (the zero-visual-change constraint). The `var()` fallback is deliberately omitted (tokens are always declared, and a fallback would mask an accidental drop that the guard test should instead catch).
- **Modified, test:** `packages/starter/src/__tests__/themeScope.test.ts` gains one describe block (details below). It already owns the `:root`/`:root.dark` scope invariants and the `blockOf`/`variableIn`/`effectiveDarkValue` helpers, so the contract test belongs beside them rather than in a new file duplicating those helpers. `classUsage.test.ts` is untouched (it scans class tokens, not custom properties).
- **New:** nothing in the published or private code surface. No entry in `specs/components.md` needs a new row; the existing "Non-published surfaces" row for the starter should gain a one-line note that radius and typography are now tokenised alongside colour (an inventory-text update the developer makes, not a new surface).

Justification for "no new component": the themeing channel already exists (`--sft-*` custom properties on `:root`/`:root.dark`); this feature widens that existing channel, which is exactly the established library-API rule (new capability reaches consumers through the documented theming surface, not a side channel).

### Token naming / grouping scheme
Recommended scheme: a small reusable **t-shirt-size scale keyed to the distinct values**, one token per distinct value, reused at every call site that shares that value (Open question 4, option 1). Grouped with banner comments matching the existing `/* surfaces */`, `/* text */` convention, placed in the `:root` block after the colour groups:

```
/* radius */
--sft-radius-sm: 6px;      /* buttons */
--sft-radius-md: 8px;      /* inputs, selects, dashed placeholders, alert, json panel, choice group */
--sft-radius-lg: 10px;     /* icon-catalogue demo tile */
--sft-radius-xl: 12px;     /* section/switch/repeater/empty/choice cards, review, confirm, timeline */
--sft-radius-pill: 9999px; /* pills, badges, radio dots, switch track/thumb, step dots */

/* typography */
--sft-font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
--sft-font-size-xs: 11px;
--sft-font-size-sm: 12px;
--sft-font-size-md: 14px;   /* body / default control text */
--sft-font-size-lg: 18px;
--sft-font-size-xl: 20px;
--sft-font-size-2xl: 24px;
--sft-font-weight-medium: 500;
--sft-font-weight-semibold: 600;
```

The scale rungs are numerically honest (`sm < md < lg < xl`), decoupled from component role. This is deliberate: role-based names (`--sft-card-radius`, `--sft-input-radius`) break down because one value serves several unrelated roles (8px is shared by inputs, the dashed choice group, the wizard alert, and the JSON panel; "input-radius" would be a lie at three of those sites) and would force either arbitrary role names or value-collapsing that violates zero-visual-change. The `10px` value is an awkward singleton used only by the icon-catalogue demo tile; the scale absorbs it cleanly as `--sft-radius-lg` without minting a call-site-specific token.

**Designed-for alternative (Open question 4, option 2 — call-site-specific tokens):** if Jeroen prefers role-named, narrower tokens, the same refactor mechanics apply but the token count grows roughly one-per-role (e.g. `--sft-btn-radius`, `--sft-card-radius`, `--sft-input-radius`, `--sft-pill-radius`, `--sft-icon-tile-radius`, `--sft-section-title-size`, `--sft-eyebrow-size`, ...), trading a larger, more self-documenting contract surface for more variables to maintain and a heavier semver obligation (every one is now a promised name). The guard test and README table absorb either shape unchanged; only the pinned name list differs. Nothing else in this architecture depends on which option wins, so this stays a single deliberate call for Q4, not a blocker.

**Designed-for alternative (Open question 1 — full vs partial retrofit):** the recommended scale is retrofit-scope-invariant. A partial first pass tokenizes fewer call sites but uses these same token names; a later pass adds no new tokens, only swaps more literals to the already-declared `var()`s. The pinned guard list is identical either way, so Q1 changes only how many lines of `style.scss` this feature touches, not the contract.

**PROPOSED (adversarial review) — correction to the partial-retrofit alternative:** declaring, documenting, and pinning all 14 tokens while wiring only some call sites ships semver-protected, README-advertised tokens that are partially inert (a consumer sets `--sft-radius-md` and some 8px corners do not move; fixing that later reads as a breaking change). If Q1 chooses a partial retrofit, only declare, document in the README table, and pin the tokens whose call sites are **fully** wired in that pass; defer the remaining tokens entirely (declare them in the later pass when their literals are actually swapped). Under this rule the contract is true the moment it ships, and it is consistent with the leftover-literal guard test proposed above (which would otherwise fail a declare-now-wire-later partial pass). This narrows but does not void line 102: a partial pass is fine; a partial pass that pre-declares unwired tokens is not.

### `:root.dark` delta
**Zero new entries.** Every in-scope `border-radius`, `font-size`, `font-weight`, and `font-family` value in the stylesheet is identical in light and dark: dark mode overrides colour only, and there is no theme-conditional radius or type value anywhere in the file (verified by grepping all four properties, including inside `:root.dark &` nested blocks and the one `@media` size rule). So all 14 new tokens are declared once on `:root` and inherit that value under `.dark` on the same node, exactly the precedent `--sft-input-border` already sets. The guard test pins this (each new token absent from the `:root.dark` block).

### Data flow
Pure CSS custom-property cascade; no JavaScript, no reactivity, no provide/inject, no engine involvement. Tokens are declared on `:root`, consumed via `var()` at each call site. Dark mode re-declares colour tokens on `:root.dark` (same document node), and the radius/type tokens fall through to their `:root` value. A consumer rethemes by overriding a token on `:root` (and `:root.dark` only if they want a dark-specific shape/type, which the defaults never need). `DynamicFormItem` and the core engine are not touched.

```mermaid
flowchart LR
  subgraph root[":root"]
    C["colour tokens (41 existing)"]
    N["radius + type tokens (14 new)"]
  end
  subgraph dark[":root.dark"]
    CD["colour overrides only"]
  end
  C --> call["sft- call sites via var()"]
  N --> call
  CD -. overrides .-> call
  N -. no dark entry: inherits :root .-> call
```

### Guard test design
Extend `themeScope.test.ts` with a `describe('public theme contract')` block that:
1. Extracts the full set of `--sft-*` names declared in the `:root` block (regex over `blockOf(':root')`), and asserts it equals a pinned, sorted `CONTRACT_VARIABLES` array (the union of the 41 existing colour tokens and the 14 new ones = 55 names). Pinning names, not values, means a rename or removal fails `pnpm ci`, and an addition also trips the test, which is intended: adding a token is the deliberate gate where the author must update the list, the README table, and add a minor changeset in one go. The failure message should name the diff (missing vs unexpected) so the required follow-up is obvious.
2. Asserts each of the 14 new tokens is present on `:root` and has no differing `:root.dark` override, reusing the existing `effectiveDarkValue` helper (same pattern as the existing "keeps %s identical between light and dark" block).
3. **PROPOSED (adversarial review):** asserts that none of the in-scope literal values survives as a raw property value outside the `:root`/`:root.dark` declaration blocks. Strip those two blocks from the stylesheet, then assert the remainder contains no `border-radius: <one of 6px/8px/10px/12px/9999px>`, no `font-size: <one of 11/12/14/18/20/24 px>`, no `font-weight: <500/600>`, and no `font-family: ui-monospace, ...` (the `inherit` usages are expected to remain). Without this, points 1-2 only prove the tokens are *declared*: a token left unwired at its call site would pass CI and render pixel-identical, yet silently fail to retheme the surfaces the README table promises it controls. This test is what turns "declared" into "themeable" and is the machine-checked enforcement of the zero-visual-change-plus-full-wiring contract.

This sits alongside, and reuses the helpers of, the existing root-scope invariants; no change to `classUsage.test.ts` or the `helpers/` modules. The pinned array is the machine-checked half of the contract; the README table (below) is the human-readable half, and the test's "addition trips it" behaviour keeps the two from drifting.

### Public API impact
None in the type/export sense. The consumer-observable surface that changes is the stylesheet's custom-property contract: 14 new `--sft-*` names a consumer may now override, and a newly-stated semver rule for the whole set (add = minor, rename/remove = major). Existing consumers are unaffected: every default value is preserved, no token is renamed or removed, and no `sft-` class or selector changes. Per CLAUDE.md's definitions this is **minor** (new, backwards-compatible capability).

### Changeset analysis (Open question 5)
Per CLAUDE.md step 7, a change to `packages/starter/src/` requires a changeset, and `.changeset/config.json` does not ignore the starter, so the tooling expects one. Recommended: **add a minor changeset** describing the user-facing capability (shape and type are now rethemeable through documented `--sft-*` variables, zero default visual change), leading with the consumer benefit per the Git conventions. The bump type is minor under the feature's own semver rule (additive tokens). The only reason to defer (Q5's alternative) was the belief the package is private; the tree shows it is not marked private, which removes that reason. This stays Jeroen's call via Q5, but the recommendation and the corrected facts are on record here.

### Documentation impact (derived from the public API impact)
- **`packages/starter/README.md`, "Customization guidance" section (mandatory, in scope):** add the complete `--sft-*` contract table (every variable, old and new, its purpose, and its default value) and the stated semver rule. This is the single authoritative list; the README already ships in the tarball, so it is the right home for the contract.
- **`docs/guide/starter-template.md`, "Theming with CSS variables" section (mandatory, behaviour change):** today it says "every colour ... is a `--sft-*` custom property" and shows only a colour example. Update the prose to state that shape (radius) and type (font family, size, weight) are now themeable the same way, add a short radius/font example, and point to the README as the full variable list (avoid duplicating the 55-row table in two places; the guide gets a pointer and a worked example, the README owns the table).
- **`docs/reference/*` (conditional on Open question 3):** the starter has no reference page today (only the core library does; the starter lives under `docs/guide/`). If Q3 lands on "yes, a dedicated theming reference page," it is a plain table-and-prose page (e.g. `docs/reference/starter-theming.md`) added to `docs/reference/index.md`, mirroring the README table, not a new UI pattern (so the skipped design phase stands). If Q3 lands on "no," the README plus the guide section are sufficient and no reference page is created. The architecture does not require the page; it only needs the README contract.

### ADR notes
- **ADR-1 — token scheme is a value-keyed t-shirt scale, not role/call-site names.** Context: 5 radius and 6 font-size distinct values, several shared across unrelated roles. Decision: one token per distinct value, numeric-rung names. Alternative: role/call-site-specific names (Q4 option 2). Rejected as the default because shared values make role names misleading and multiply the contract surface; kept as a designed-for alternative pending Q4.
- **ADR-2 — no `:root.dark` entries for the new tokens.** Context: dark mode overrides colour only. Decision: declare all new tokens once on `:root`. Alternative: mirror every token under `:root.dark` for symmetry. Rejected: it would add 14 redundant lines that can silently drift from `:root`, against the existing `--sft-input-border` precedent. Pinned by the guard test.
- **ADR-3 — `inherit` values stay untokenised.** Context: `font-size: inherit` (mobile input size) and `font-family: inherit` (control font reset) are not brand values; they defer to the host page on purpose. Decision: leave both as `inherit`, matching the in-scope exclusion. Alternative: tokenize them. Rejected: a token would invert their meaning (a fixed value where the intent is "whatever the host uses").
- **ADR-4 — guard test pins names and trips on additions too.** Context: the contract must resist silent rename/removal. Decision: assert the `:root` `--sft-*` name set equals a pinned array, so additions also fail until the author updates the list. Alternative: assert only "no fewer than" the pinned set (additions pass silently). Rejected: the whole point is that every change to the promised surface is a deliberate, reviewed act tied to a changeset.
- **ADR-5 — `var()` fallbacks omitted.** Context: `var(--sft-x, <literal>)` would keep rendering if a token were dropped. Decision: use bare `var(--sft-x)`. Alternative: inline-fallback every call. Rejected: a fallback would mask exactly the accidental drop the guard test exists to catch, and the token is always declared.

### Slicing seams (input for the scrum-master)
- **Slice A — stylesheet + guard test (engine-side, no dependencies).** Declare the 14 tokens, swap the in-scope literals to `var()`, add the contract describe block to `themeScope.test.ts`. Self-contained and independently verifiable (`pnpm --filter ...starter ci` renders identical compiled CSS and the new test passes). If Q1 chooses a partial retrofit, this slice narrows to the chosen components but still declares the full token set and pins the full list.
- **Slice B — documentation (depends on Slice A's final token names).** README contract table + semver rule, and the guide's theming-section update. Docs slice separately from the stylesheet work, per the standard; it only needs the token names frozen, which Slice A settles.
- **Slice C — conditional, depends on Q3.** A dedicated docs reference page, only if Q3 says yes. Depends on Slice B (shares the table content).

Blocking relationship for the scrum-master: Slices B and C cannot start until the Q4 naming decision is made (it fixes the names the docs promise), and the whole feature is gated on the approval these open questions feed into.

## Adversarial review

Audit numbers independently re-verified against the live tree and all confirmed: 25 `border-radius` declarations (9999px x10, 12px x8, 8px x5, 6px x1, 10px x1), 39 `font-size` (14px x20, 12px x14, plus 18/20/24/11 x1 each and 1 `inherit`), 19 `font-weight` (600 x13, 500 x6), 3 `font-family` (2 monospace + 1 `inherit`), 41 existing `--sft-*` colour tokens on `:root`. The `:root.dark` claim also holds: every nested `:root.dark &` block overrides only colour/background/border-color, never radius/size/weight/family. The architect's corrections to the original audit are accurate.

1. **Spec-vs-reality drift in the top-of-spec sections (should-fix).** The architecture's "Audit reconciliation" block is correct, but Problem & goal and Constraints & assumptions still assert the superseded facts: `"private": true` at version `0.1.0`, `packages/starter/src/style.css` (1270 lines), and "40 `font-size` declarations". The tree shows `version: "0.0.0"`, **no** `private` field, `publishConfig.access: "public"`; the file is `style.scss` (1462 lines) with 39 `font-size` declarations. This matters because Q5's entire reasoning ("since the package is private and unpublished, defer the changeset") rests on the false private premise, and a reader working top-down hits the wrong facts before reaching the correction. Resolution: route a `PROPOSED (adversarial review)` correction into Constraints so the premise is fixed at source, not only rebutted lower down.

   `DECIDED (research)`: correction applied. Problem & goal and Constraints now state the verified facts (style.scss, 1462 lines, 39 font-size declarations, version 0.0.0, no `private` field, `publishConfig.access: "public"`). Purely factual, verified against the tree independently by the architect and this review, so it clears the pre-approval bar.

2. **The guard test proves tokens are *declared*, never that they are *wired* (should-fix).** The contract test pins the `:root` name set and the zero-visual-change test proves the compiled CSS is pixel-identical, but nothing asserts the in-scope literals were actually swapped to `var()`. A token that is declared on `:root` but whose call-site literal was left hardcoded passes both tests and ships identical pixels, yet silently fails to retheme the surfaces the README promises it controls. "Declared" is not "themeable", and the feature's whole premise is themeability. `classUsage.test.ts` scans class names, not property values, so it does not cover this either. Resolution: route a `PROPOSED (adversarial review)` test into the Guard test design asserting that no in-scope literal value (the 13 radius/size/weight values and the mono stack) survives as a raw `border-radius`/`font-size`/`font-weight`/`font-family` value outside the `:root`/`:root.dark` declaration blocks.

3. **The partial-retrofit option ships semver-protected, partially-inert tokens (should-fix).** Architecture line 102 states a partial first pass "uses these same token names... a later pass adds no new tokens, only swaps more literals", and "the pinned guard list is identical either way." Combined with the mandatory README contract table (every token with its purpose and the surfaces it controls) and ADR-4 pinning all 14 names now, this means a partial pass can publish a documented, semver-stable token whose advertised surfaces are not yet wired to it. A consumer sets `--sft-radius-md` and finds some 8px corners unchanged; fixing that later is indistinguishable from a breaking change to anyone reading the contract. The finding-2 leftover-literal test, if adopted, would *fail* under this partial mode, which is the correct outcome and directly contradicts line 102's "partial is fine, same pinned list." Resolution: route a `PROPOSED (adversarial review)` constraint: if Q1 chooses a partial retrofit, only declare, document, and pin the tokens whose call sites are fully wired in that pass; defer the remaining tokens entirely (declare them when they are wired), so the shipped contract is always true.

4. **Design-phase skip is justified (no action).** Zero default visual change by hard constraint, no new visual surface, a CSS custom-property API whose decisions (which literals, names, grouping, semver shape) are architecture, not layout. Even a Q3 "yes" docs page is table-and-prose. The skip stands.

Status rationale: six Open questions remain unresolved (Q1 and Q4 in particular fix the token names the contract promises and the guard test pins), so this lands at `awaiting-discussion` by rule 3.1 regardless of findings. No blockers. Findings 1-3 are should-fixes, each routed as a `PROPOSED (adversarial review)` edit below.

## Constraints & assumptions
- Zero default visual change is a hard constraint: every new token's default value must reproduce today's rendered CSS exactly. This is a refactor and a contract addition, not a redesign.
- New tokens should follow the grouping and naming convention the colour tokens already established in `packages/starter/src/style.css` (banner comments grouping related tokens, e.g. `/* surfaces */`, `/* text */`, `/* inputs */`) and the existing "dark override only where it's genuinely different" precedent (`--sft-input-border` has no `:root.dark` entry today, with a comment explaining why).
- `packages/starter/package.json` is `version: "0.0.0"`, has **no** `"private"` field, and sets `publishConfig.access: "public"`; `.changeset/config.json` has `ignore: []`, so Changesets already treats the starter as publishable. The package is unpublished only in that no release has run; nothing marks it private. The semver rule this feature establishes is being locked in now because it is cheaper to do before anyone depends on the surface, and because the package is already configured to publish. (`DECIDED (research)`: this replaces the earlier `"private": true` at `0.1.0` premise, which does not match the tree. Sources: `packages/starter/package.json`, `.changeset/config.json`, verified independently by the architect and the adversarial reviewer.)
- Audited counts: the authored file is `packages/starter/src/style.scss` (1462 lines), compiled to `dist/style.css`. Re-verified counts: 25 `border-radius` declarations across 5 distinct values (`9999px` x10, `12px` x8, `8px` x5, `6px` x1, `10px` x1); **39** `font-size` declarations across 7 distinct values (`14px` x20, `12px` x14, `24px` x1, `20px` x1, `18px` x1, `11px` x1, `inherit` x1), not 40; 19 `font-weight` declarations across 2 distinct values (`600` x13, `500` x6); 3 `font-family` declarations (the `ui-monospace, SFMono-Regular, Menlo, monospace` stack x2 plus one `inherit`). These replace the "15+" estimate; the real count for radius and typography is roughly 85 call sites.
- `packages/starter/src/__tests__/themeScope.test.ts` (asserts the `:root`/`:root.dark` variable blocks and specific decision-level invariants, e.g. which variables stay identical between light and dark) and `packages/starter/src/__tests__/classUsage.test.ts` (scans every `.vue` file's class usage against the stylesheet's selectors) are the existing guard-test precedent this feature's new test extends or sits alongside.

## Open questions
1. **Scope of the retrofit**: a full pass over every hardcoded radius and typography call site found in the audit (~86 sites), or a first pass scoped to specific components (e.g. cards, buttons, inputs) with the remainder left for a later feature? This changes the size of the change materially.
2. **Spacing values**: the original idea text says "radius, typography, and other brand-defining values." Does "other brand-defining values" pull in spacing (padding, margin, gap), or does spacing stay out of this feature entirely and wait for its own pass?
3. **Docs site reference page**: does the VitePress docs site gain a new dedicated theming reference page (e.g. under `docs/reference/`), or does the README's "Customization guidance" section plus the existing short mention in `docs/guide/starter-template.md` stay sufficient for this release?
4. **Token naming scheme**: a small reusable scale (e.g. one `--sft-radius-pill`, one `--sft-radius-md`, reused everywhere that visual role appears today) versus a wider set of narrower, call-site-specific tokens? This is ordinarily an architecture call, but since it fixes the shape of a contract this feature is about to promise semver stability on, flagging it here so it is a deliberate choice rather than something that lands unnoticed in the architecture phase.
5. **Changeset timing**: since `packages/starter` is still private and unpublished, should this feature add a changeset anyway (to build release-note history ahead of publish), or should changesets wait until the package actually publishes?

   `DECIDED (research)`: add a minor changeset.
   Why: the question's premise is false. `packages/starter/package.json` has no `private` field (version `0.0.0`, `publishConfig.access: "public"`) and `.changeset/config.json` does not ignore the starter, so the tooling already treats it as publishable. Independently of that, `CLAUDE.md`'s "Before Every Push" step 7 requires a changeset whenever `packages/starter/src/` changes. The bump is minor under the feature's own semver rule (additive tokens).
   Sources: `packages/starter/package.json`, `.changeset/config.json`, `CLAUDE.md` step 7, Architecture "Changeset analysis" above.
6. **Line-height**: not named in the original idea, but font-size and font-weight changes often need a matching line-height adjustment to avoid clipped or cramped text. Should line-height become a token in this pass, or stay a hardcoded (or browser-default) value for now?

## Stories
Filled by scrum-master after approval.
