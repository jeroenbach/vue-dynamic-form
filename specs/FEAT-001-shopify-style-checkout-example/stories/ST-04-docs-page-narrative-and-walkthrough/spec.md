---
id: ST-04
type: story
feature: FEAT-001
status: done
approved_by: Jeroen
pr: ""
---

# Story: Docs page narrative, live embed, and metadata walkthrough

## Functional
### User story
As a docs reader evaluating `@bach.software/vue-dynamic-form`, I want one docs page that opens with the correctly attributed checkout-conversion narrative, embeds the live checkout, and closes with a metadata-tree walkthrough in the same style as the other advanced examples, so that I understand both why checkout UX matters and how the library builds this one from a single metadata tree and template.

### Acceptance criteria

1. Given the page is built, When visited at `/examples/checkout`, Then it renders the narrative in the fixed order: the $300M-button anecdote (retailer never named, "a major retailer," +45% / +$300M), Baymard's verified numbers (11.3 fields, 5.1 steps, ideal of 8, 17% abandonment, with a live link to Baymard), the attributed Shopify benchmark ("a study Shopify commissioned from one of the Big Three consulting firms," 15% average / up to 36%, Shop Pay up to +50%), the live form, then the "one metadata tree, one template" reveal.
2. Given the page's frontmatter, When the page loads, Then `aside: false` is set and page-scoped CSS widens the content column so the two-column form-plus-cart layout from `CheckoutFormExample` fits without overflow.
3. Given the walkthrough section, When rendered, Then it opens with a short inline table of contents (replacing the missing "On this page" outline caused by `aside: false`), followed by VitePress `<<<` region excerpts from `CheckoutFormExample.vue`, a "What It Demonstrates" list, a "How It Works" section describing the split-payment shape, and a "Related Source" list linking `CheckoutFormTemplate.vue`, `/examples/choices`, `/examples/wizard`, and `/examples/advanced`.
4. Given the payment section, When the page renders near the card/iDEAL inputs, Then a visible disclaimer states they are inert demo fields collecting no real payment data.
5. Given the intro callout, When rendered, Then it states plainly that the page rebuilds the checkout's structure, not Shopify's visual design or logo.
6. Given `pnpm docs:build`, When run after this story lands, Then the VitePress site builds without errors or warnings attributable to this page.

### Edge cases
- Region excerpts reference real, stable line ranges in `CheckoutFormExample.vue` and `CheckoutFormTemplate.vue`; a later change to those files that shifts line numbers is expected to require updating the excerpt markers, not a defect of this story.
- Dark mode rendering of the custom containers (tip/warning callouts) relies entirely on VitePress's own default-theme container styling; no page-specific dark-mode CSS is needed.

### Out of scope
- Any change to the checkout's metadata tree, template, or ledger behavior (ST-01, ST-02, ST-03); this story only writes prose and embeds what they built.
- Sidebar/nav entries and the cross-link from `advanced.md` back to this page (ST-05).
- Content changes to `docs/examples/advanced.md` beyond what ST-05 does.

## Design reference
Implements the prototype's `#page-intro` and `#metadata-walkthrough` sections (`../../prototype.html`), and is the page shell around every other anchor (`#live-form` through `#submit`) built by ST-02 and ST-03. No new design language; copy and citation wording follow the feature spec's Constraints section verbatim in substance (exact sentences may be lightly edited for flow, never the attribution).

## Architecture reference
Builds, from the feature architecture's docs page and nav structure section:
- `docs/examples/checkout.md` (new): embeds `<CheckoutFormExample />`, frontmatter `aside: false`, page-scoped CSS for the widened column, prose in the fixed narrative order, and the metadata walkthrough below.
- Registers `CheckoutFormExample` in `docs/.vitepress/theme/index.ts`'s `enhanceApp` (same pattern as the other examples); this registration step was not pinned to a specific seam in the feature's component plan, and is placed here since this is the first story that actually embeds the component in a page.

No `packages/core/src/` change and no changeset in this story.

Dependencies: can start in parallel with ST-01 as a prose scaffold (per the feature architecture's note that seams 1 and 4 are the natural parallel starters), but the final region excerpts and the live embed depend on ST-02 and ST-03 having landed, since the excerpts quote their files and the embed renders their components.

## QA plan

This story adds no application logic: one new markdown page (prose, frontmatter, page-scoped CSS) and two additive lines in `docs/.vitepress/theme/index.ts` (an import and an `app.component` registration, the same pattern already used for every other example). No `.vue` component is created or changed by this story itself, `packages/core/src/` is untouched, and no changeset is needed.

Just as important for how this plan reads: `docs/` is excluded from the pnpm workspace (`pnpm-workspace.yaml` lists `packages/*` and explicitly excludes `docs`) and carries no test runner at all: no `vitest` dependency, no `__tests__` directories, no test script in `docs/package.json`. There is no mechanism anywhere in this repo that unit-tests markdown prose or a page-scoped `<style>` block. That is a pre-existing, deliberate boundary of the project, not a gap this story introduces or is expected to close. Every check below is therefore either a mechanical, repeatable command (`pnpm docs:build`, `grep`) or a manual human verification step; none is a `*.test.ts` / `*.logic.test.ts` / `*.validation.test.ts` / `*.analytics.test.ts` file, because there is no file for any such test to exercise.

### Files touched

| File | Change |
| --- | --- |
| `docs/examples/checkout.md` | New page. Frontmatter `aside: false`; page-scoped CSS widening the content column; prose in the fixed narrative order; the metadata walkthrough below. |
| `docs/.vitepress/theme/index.ts` | Additive: one new `import CheckoutFormExample from './components/CheckoutFormExample.vue'` and one new `app.component('CheckoutFormExample', CheckoutFormExample)` line, inserted alongside the existing registrations. |

No `.vue`, `.ts` logic file, or test file is touched beyond that. `CheckoutFormExample.vue`, `CheckoutFormTemplate.vue`, and `SplitPaymentLedger*.vue` are ST-01/ST-02/ST-03's files; this story only embeds and excerpts them.

### Acceptance criteria -> check mapping

1. **Fixed narrative order with correct, binding attribution.**
   - Mechanical (safety-critical, exact-string): `grep -n "Best Buy" docs/examples/checkout.md` must return **zero** matches. The retailer must never be named; this is the one check in this plan with real reputational/legal weight, so it gets its own line rather than being folded into the general em-dash/kebab-case sweep.
   - Mechanical: `grep -n "a major retailer" docs/examples/checkout.md` finds at least one match (Jared Spool's own wording, per the feature's Constraints).
   - Mechanical, presence-only (does not prove order or sentence-level nuance): `grep -nE "45%|\\$300|300 million" docs/examples/checkout.md`, `grep -nE "11\\.3|5\\.1|17%" docs/examples/checkout.md` (Baymard figures), `grep -nE "15%|36%|50%|Big Three" docs/examples/checkout.md` (Shopify figures) each return at least one match.
   - Mechanical, order-assisted: run the greps above with line numbers and confirm the line-number ordering is retailer anecdote < Baymard figures < Shopify figures < "the checkout, live" / `#live-form` heading < the "one metadata tree, one template" reveal heading. This is a cheap sanity check, not a substitute for the editorial read below.
   - Manual (editorial read, the real check): read the opening section end to end and confirm, against the feature spec's Constraints section verbatim: (a) the retailer is never named anywhere in the copy, not just absent from the one grep target; (b) Baymard's four figures are stated as fact, with a working link to `baymard.com`; (c) the Shopify figures are explicitly attributed to "a study Shopify commissioned from one of the Big Three consulting firms" and never presented as independent fact; (d) the four sections appear in exactly the order AC1 lists. Lightly edited wording is allowed, the attribution itself is not (per this story's Design reference).
   - Manual (external link, VitePress cannot check this): click the Baymard link in a browser and confirm it resolves to `https://baymard.com/research-articles/checkout-flow-average-form-fields` (or the current equivalent). VitePress's dead-link checker only validates internal routes, never external URLs, so this is a genuine gap only a human click closes.

2. **Frontmatter `aside: false` and a widened content column that fits the two-column layout.**
   - Mechanical: `grep -n "^aside: false" docs/examples/checkout.md` (or `aside:\s*false` inside the frontmatter block) finds exactly one match.
   - Manual: with `pnpm docs:dev` running, open `/examples/checkout` and confirm the "On this page" aside outline is absent (contrast with any existing page, e.g. `/examples/choices`, which still shows it) and that the page-scoped CSS actually widens the content column, not just that the frontmatter flag is set.
   - Manual, responsive: resize the viewport (or use devtools responsive mode) at representative widths, at minimum 1440px, 1280px, 1024px, 960px (the design's stated stacking breakpoint for the cart), 768px, and 375px, and confirm no horizontal overflow or scrollbar on the two-column form-plus-cart area at any width. This is this story's own delta on the layout (the grid itself is ST-02's), so the check here is specifically "does the widened column accommodate ST-02's layout without clipping or overflow," not a re-test of the grid's own stacking logic.

3. **Walkthrough: inline TOC, `<<<` region excerpts, "What It Demonstrates," "How It Works," "Related Source" (4 links).**
   - Mechanical (strong, build-time): `pnpm docs:build` fails the build if any `<<<` region tag in the new page references a region that does not exist in `CheckoutFormExample.vue` (or whichever file the excerpt names), and fails on any broken internal link. Since there is no `ignoreDeadLinks` override in `docs/.vitepress/config.ts` (confirmed), this is a real, load-bearing guard, not a smoke test, and it is the single mechanical check that most directly protects the Edge case about region markers drifting with line numbers.
   - Mechanical: `grep -n "What It Demonstrates\|How It Works\|Related Source" docs/examples/checkout.md` finds all three headings.
   - Mechanical: `grep -c "examples/choices\|examples/wizard\|examples/advanced" docs/examples/checkout.md` and a separate check that `CheckoutFormTemplate.vue` is named in the Related Source list (by filename, per the existing convention of listing component filenames with a GitHub link) confirm all four required links/mentions are present.
   - Manual: confirm the literal order inside the walkthrough section matches AC3 exactly: inline TOC first, then the `<<<` excerpts, then "What It Demonstrates," then "How It Works," then "Related Source." Note this ordering is *not* identical to `choices.md`'s or `advanced.md`'s own convention (those lead with "What It Demonstrates" right after the H1, before any excerpt), so do not assume the sibling pages' habit carries over; follow AC3's literal order for this page.
   - Manual: click every link in the inline TOC and confirm each one scroll-anchors to the right subsection; click the Related Source entries for `/examples/choices`, `/examples/wizard`, and `/examples/advanced` and confirm each lands on the expected existing page (the GitHub link for `CheckoutFormTemplate.vue` only resolves once that file is actually pushed/merged, so re-check this specific link if ST-01 and this story's branches diverge in merge order).

4. **Visible inert-payment-data disclaimer near card/iDEAL.**
   - Manual only (no test harness reaches into a rendered docs component): with `pnpm docs:dev` running, select the card branch and separately the iDEAL branch of the payment choice on the live embedded form and confirm the disclaimer renders near the fields in both cases. This duplicates, at page-integration level, what ST-01's own test plan should already prove for `CheckoutFormTemplate.vue` in isolation; the point of checking it again here is specifically that the embedding inside the real `.md` page has not dropped or relocated it.
   - Editorial: confirm the disclaimer wording used here is the same single disclaimer ST-01 built, not a second, slightly different copy invented for this page.

5. **Intro callout states the page rebuilds structure, not Shopify's visual design or logo.**
   - Mechanical, heuristic only: `grep -niE "not.*(shopify|its).*(design|logo)|structure.*not.*(visual|brand|logo)" docs/examples/checkout.md` as a cheap smoke check; grep cannot verify meaning, so this is advisory, not a pass/fail gate.
   - Manual (the real check): read the intro callout and confirm it plainly states, in substance, that the page rebuilds the checkout's structure, not Shopify's visual design or logo, consistent with the Design decisions' "Neutral, explicitly not Shopify" note and the Out-of-scope line in the feature spec.

6. **`pnpm docs:build` runs without errors or warnings attributable to this page.**
   - Mechanical: run `pnpm docs:build` from the repo root and confirm exit code 0.
   - Mechanical/manual hybrid: read the full build output and confirm no error or warning line references `checkout.md`, `CheckoutFormExample`, `CheckoutFormTemplate`, `OrderSummary`, or `SplitPaymentLedger*`. See the Untestable-as-written note below for how to read "no warnings attributable to this page" when the build already has pre-existing, unrelated warnings.

### Edge cases (from Functional > Edge cases)

- "Region excerpts reference real, stable line ranges... a later shift is a defect of the referenced file changing, not of this story." Mechanical: `pnpm docs:build`'s region-resolution failure is the actual enforcement mechanism (see AC3); this story's own job is only to add correct `<<<` tags at implementation time, verified by the same build check, not by a separate line-number audit.
- "Dark mode relies entirely on VitePress's own default-theme container styling; no page-specific dark-mode CSS needed." Manual: toggle VitePress's light/dark switch and read the intro callout and the walkthrough's custom containers in both modes, confirming legible text and borders in both, and confirming `checkout.md`'s own `<style>` block does not define anything that only works in one mode (a quick read of the page-scoped CSS diff is enough; it should only touch layout width/grid, not colors).

### States policy

Not applicable in the component-test sense. This story mounts no new `DynamicFormItem`/`DynamicFormItemChoice` and writes no new field-level logic; every pristine/focus/invalid/valid/disabled/empty/loading/error/success state in the states policy belongs to the embedded `CheckoutFormExample.vue` (ST-02) and `SplitPaymentLedger` (ST-03), and is this story's responsibility only to observe, not to newly assert, once embedded in the real page. The one state genuinely specific to this story is the page-shell layout at narrow vs. wide viewports (covered under AC2 above) and the light/dark rendering of the prose callouts (covered under Edge cases above); neither is a states-policy item, both are layout/theme checks.

### Reactivity / `*.analytics.test.ts`

Not applicable. This story touches no `DynamicFormItem`, `computedProps`, or validation wiring source file; it adds a markdown page and a two-line component registration. No `.analytics.test.ts` file is added or extended by this story.

### Coverage

Not applicable. `pnpm-workspace.yaml` lists only `packages/*` and explicitly excludes `docs`, so `pnpm -r ci:test:coverage` never touches any file this story changes. Coverage is mathematically unaffected; no baseline comparison is needed. Running `pnpm ci` once before push is still good practice (cheap, confirms nothing else in the working tree regressed) but is not a coverage check for this story's own changes.

### Time sensitivity

Not applicable. No date/time-dependent content or logic.

### Regression risk

- **`docs/.vitepress/theme/index.ts`'s existing registrations.** The diff here must be purely additive: one new import line and one new `app.component(...)` line, matching the existing style exactly (see the current file's pattern: import then register, one line each, no reordering of the existing entries). Guarded by an additive-diff read; a reordering or reformatting of the existing lines is an unnecessary, unreviewable diff and should be flagged even though it would not fail any build.
- **The page is reachable at `/examples/checkout` before any nav/sidebar entry exists.** Nav, sidebar, and the `advanced.md` cross-link are explicitly ST-05's scope, not this story's. AC1 only requires the page to render correctly "when visited at `/examples/checkout`" by direct URL; confirm this is true even with no nav link pointing at it yet, and do not treat the absence of a sidebar entry as a defect of this story.
- **Hard dependency on ST-02 and ST-03 having landed.** Per this story's own Dependencies note, the final region excerpts and the live embed need `CheckoutFormExample.vue` (and the regions/components it defines) to exist. If ST-04 is implemented before those land, `pnpm docs:build` fails outright (missing `<<<` source file, unresolved component for the embed), which is the correct, loud signal to hold this story rather than ship placeholder excerpts.
- **`docs/examples/index.md` is out of scope here** (ST-05 owns the "Available Demos" bullet). Confirm this story's diff does not touch that file.
- **Other existing docs pages** (`choices.md`, `wizard.md`, `advanced.md`, their own embedded examples) are unaffected: this story adds a new page and two additive registration lines, touching no existing page's content. Guarded by an additive-diff read of the full change set.
- **Consistency with ST-01's disclaimer copy** (see AC4 above): the page must reuse ST-01's disclaimer wording, not introduce a second version of it.

### Manual verification checklist

1. `pnpm docs:build` completes clean, exit code 0, with no error or warning line referencing this page or its new components (AC3, AC6; also the real enforcement for the Edge case about region-marker drift).
2. `pnpm docs:dev`, open `/examples/checkout` directly by URL (no nav entry exists yet), and read the full narrative top to bottom in reading order, checking it against the feature spec's Constraints section verbatim (AC1).
3. Click the live Baymard link and confirm it resolves externally (AC1; VitePress's dead-link checker does not cover external URLs).
4. Confirm the "On this page" aside is absent, and resize the viewport through 1440/1280/1024/960/768/375px confirming no overflow in the two-column area at any width (AC2).
5. Click every inline TOC entry and confirm it anchors to the right subsection; click all four Related Source links/mentions (`CheckoutFormTemplate.vue`, `/examples/choices`, `/examples/wizard`, `/examples/advanced`) and confirm each resolves to the expected target (AC3).
6. On the live embedded form, select the card branch, then the iDEAL branch, of the payment choice, confirming the inert-demo disclaimer renders near the fields both times, with wording matching ST-01's (AC4).
7. Read the intro callout and confirm it plainly states the page rebuilds structure, not Shopify's visual design or logo (AC5).
8. Toggle VitePress's light/dark switch and re-read the intro callout and the walkthrough's custom containers in both modes (Edge cases, dark mode).
9. `grep -rn '—' docs/examples/checkout.md` (em dash, U+2014) returns no matches, per `CLAUDE.md`'s no-em-dash rule.
10. `grep -n -- '-choice=\|:add-choice\|:remove-choice\|:can-add-choice\|:active-choice\|[a-z]-[a-z][a-zA-Z]*=' docs/.vitepress/theme/index.ts docs/examples/checkout.md` reviewed by eye for any genuine kebab-case prop/attribute binding (ignoring the framework's own hyphenated slot names such as `#default-choice`, which are correct by design), per `CLAUDE.md`'s camelCase rule.
11. `grep -n "Best Buy" docs/examples/checkout.md` returns zero matches (AC1, repeated here deliberately since it is the one safety-critical check in this plan).
12. After opening the PR: verify the Cloudflare Pages preview renders `/examples/checkout` correctly in both color modes, per `CLAUDE.md`'s "Before Every Push" step 5.
13. A fresh, untouched load of `/examples/checkout` shows zero validation errors (no red "is required" text anywhere on the page before any interaction); check this on `pnpm docs:dev` and again on `pnpm docs:build` followed by `pnpm docs:preview`, since this story is the first to embed the live form on a real, reachable page (added after a branch-level audit found the pristine page showing five required errors, caused by the embedded component's own mount-time revalidation logic; the fix lives in `CheckoutFormExample.vue`, ST-02's file, but this is the first checklist with an actual page to load the regression against).

Checks 2, 3, 5, 6, 7, 8 are editorial/manual reads with no mechanical substitute. Checks 1, 9, 10, 11 are mechanical, exact-string or build-exit-code checks with no judgement required. Check 4 is manual but mechanically assisted (devtools responsive mode). Check 12 is a hybrid: mechanical trigger (CI/Cloudflare), manual review of the result. Check 13 is manual but mechanically assisted (Playwright/DOM inspection for the absence of error text).

### Untestable-as-written / rewrite proposals

- **AC6's "without errors or warnings attributable to this page" assumes a clean baseline.** If `pnpm docs:build` on `main` (before this story) already emits warnings unrelated to this page, "zero warnings" read literally is not this story's to fix, and a strict literal reading would wrongly block the story on pre-existing noise. **Proposed operative reading:** run `pnpm docs:build` once on `main` before implementing, record whatever warning set already exists, then after implementing confirm the post-change warning set is a strict superset check in reverse, no *new* warning appears, and in particular none references `checkout.md` or any of its new components. If the baseline is already clean (confirm this first; if it is, the literal reading holds and no rewrite is needed), this proposal is moot and AC6 stands as written.
- **AC1's "accurately" for the Shopify-vendor-claim nuance cannot be grepped.** Whether the copy correctly frames the Shopify figures as a vendor claim rather than independent fact is a matter of sentence-level meaning, not a string to match. The mechanical greps in the AC1 mapping above catch the presence of the right numbers and the absence of the forbidden name; the editorial read is the only check that can confirm the framing itself, and is treated as authoritative here, not as a weaker fallback.
- No other acceptance criterion is untestable as written; AC2 through AC5 all reduce to a concrete mechanical check plus a manual read with a clear pass/fail.

### Open questions

None raised by this plan. The citation rules, narrative order, and link targets are all fully specified in the feature spec's Constraints and Design decisions sections; nothing here needed a guess.

## Adversarial review

STORY mode (lite): blockers only. No blockers found. The story maps cleanly onto the approved feature design and architecture, every acceptance criterion is testable and has a check in the QA plan, and the dependency chain (ST-02 + ST-03 hard, ST-01 parallel for the prose scaffold, `enhanceApp` registration assigned here) is explicit and matches the feature's Stories table and slicing seams.

What I verified as true against external sources and the repo, so these are not findings:

- **Baymard link and figures.** The URL the QA plan pins, `https://baymard.com/research-articles/checkout-flow-average-form-fields`, resolves to the live Baymard article "Checkout Optimization: Minimize Form Fields", which states the 11.3 average form fields, 5.1 average steps, and an ideal of 8 fields, and enumerates exactly the five reduction tactics the feature relies on. The AC1 figures and the external-link check target are correct.
- **VitePress missing-region build error (QA plan AC3, the "strong, build-time" guard).** VitePress's documented behavior is that importing a file or region that does not exist throws a build error; the `markdown.snippet.silent` escape hatch defaults off and is not set in `docs/.vitepress/config.ts`. The build-time guard the QA plan leans on for the region-drift edge case is real.
- **No `ignoreDeadLinks` or snippet-silent override** in `docs/.vitepress/config.ts` (read directly). Internal-link dead-link checking at build time is therefore load-bearing as claimed, and the QA plan correctly notes VitePress does not validate external URLs, so the human click on the Baymard link is a genuine, non-redundant check.
- **Sibling-page convention.** `docs/examples/advanced.md` does lead with "What It Demonstrates" right after the H1, before any `<<<` excerpt. The QA plan's warning not to copy that order, and to follow AC3's literal walkthrough order instead, is accurate.
- **Cross-page link targets exist.** `/examples/choices`, `/examples/wizard`, and `/examples/advanced` are all present under `docs/examples/`, and the `advanced` slug is preserved by the feature's DECIDED Q1, so the Related Source links will resolve.

Findings:

1. **(nit) Related Source links the template but not the file that is actually excerpted.** AC3 fixes the Related Source list at `CheckoutFormTemplate.vue` plus the three cross-page example links, while AC3's own `<<<` excerpts come from `CheckoutFormExample.vue`. The sibling `advanced.md` lists its host component (`FormExampleClientOnboardingPlanner.vue`) alongside its template in Related Source, so a reader who wants the full source of the excerpted metadata tree currently gets a link to a different file than the one quoted. This is downstream of the feature's AR-6 decision (prototype "Related source" corrected to `CheckoutFormTemplate.vue`) and is editorial, not a blocker. Suggested resolution: when implementing, also list `CheckoutFormExample.vue` (and optionally the `SplitPaymentLedger*` files) in Related Source so the excerpted host is linkable, matching the sibling convention. Left as a nit; no status impact.

   RESOLVED (implementation): `CheckoutFormExample.vue` is listed first in Related Source, ahead of `CheckoutFormTemplate.vue`, so the excerpted host is linkable alongside the template.

## Implementation notes

### Files touched

- `docs/examples/checkout.md` (new): the page. Frontmatter `aside: false` and `pageClass: checkout-page`; narrative in the fixed order (retailer anecdote, Baymard figures with a live link, attributed Shopify benchmark, live embed, the "one metadata tree, one template" reveal); the live `<CheckoutFormExample />` embed; a warning callout for the UI-level/non-XSD ordering note; the metadata walkthrough (inline TOC, eight `<<<` region excerpts, "What It Demonstrates", "How It Works", "Related Source").
- `docs/.vitepress/theme/index.ts`: additive only, one new import and one new `app.component('CheckoutFormExample', CheckoutFormExample)` line, inserted after the existing registrations with no reordering.
- `docs/.vitepress/theme/custom.css`: additive only, one new rule block widening `.content-container` to `1100px` for pages carrying the new `checkout-page` class (set via the page's `pageClass` frontmatter), since `aside: false` alone removes the aside's own `688px` cap but does not itself guarantee a generous width at every breakpoint.
- `docs/.vitepress/theme/components/CheckoutFormExample.vue` (ST-02/ST-03's file): added eight named `#region`/`#endregion` comment pairs only (`express-manual-choice`, `per-country-postal`, `business-vat-toggle`, `shipping-choice`, `payment-choice`, `split-payment-choice`, `gift-message-field`, `billing-reuse`), plus one short clarifying comment noting that the `manual` branch (not shown in the first excerpt) holds the rest of the form. No metadata, logic, or behavior change; verified with `eslint`/`vue-tsc` showing no new diagnostics and the existing `pnpm run ci:test` suite unaffected (the file carries no test of its own, per ST-02/ST-03's own QA plans, since `docs/` has no test runner).

No `packages/core/src/` change, no changeset, and no change to `specs/components.md`, consistent with the architecture's conclusion that this story is docs-only. `docs/examples/index.md` and `docs/.vitepress/config.ts` were not touched (ST-05's scope).

### Region excerpt choices

Eight excerpts, one small, self-contained slice per metadata shape named in the prototype's "What it demonstrates" list, rather than one giant excerpt of the whole tree. Several branches are cut off mid-array on purpose (for example the express branch excerpt stops before the `manual` branch starts), matching the precedent already set by `FormExampleChoiceFields.vue`'s `choice-structure` region, which also shows a `choice: [...]` property in isolation rather than a complete, standalone object.

### Known pre-existing condition, not introduced by this story

Manually verifying the live embed on a fresh page load shows the "Enter details manually" branch already selected, with nothing yet clicked. This traces to `CheckoutFormExample.vue`'s own seeded `initialValues` (`billing.sameAsShipping: true`, nested under the `manual` branch), which the engine's "loaded data counts as selected" rule reads as the `manual` branch already being active at mount. This is documented in ST-02's own Implementation notes (Fix round 2) as a known, accepted shape of that story's seeded default; this story makes no metadata or behavior change and does not alter it, since doing so would mean editing ST-02's metadata tree, which is explicitly out of this story's scope. Noted here for transparency since it is visible on first load of the embedded form.

Update (fix round, after this story's own verification): the pristine load used to also show several of those pre-selected branch's required fields in their error state. That was a separate, genuine bug (mount-time `computedProps` re-triggers in `CheckoutFormExample.vue` firing on their first run), not a consequence of the branch being pre-selected; a pre-selected but untouched branch is not supposed to show errors. It is fixed in ST-02's file (see ST-02's Implementation notes, Fix round 3) and re-verified against this story's own live page on both `pnpm docs:dev` and `pnpm docs:build` + `pnpm docs:preview`: the branch still shows pre-selected, but the page now shows zero validation errors on a fresh load, consistent with the feature's pristine-state policy. The checklist gained item 13 above to keep this checked going forward.

### Implementation choices (not deviations; the architecture left the exact mechanism open)

- Used `pageClass: checkout-page` plus a `.checkout-page .VPDoc .content-container { max-width: 1100px; }` rule in `custom.css`, rather than overriding VitePress's `--vp-layout-max-width` custom property. The CSS variable also governs the nav bar's own centering width and would have widened it site-wide while browsing this one page (since `pageClass` is applied to the shared `Layout` root, which wraps the nav too), producing a visible width jump when navigating to and from this page. Scoping the override to `.content-container` only widens the doc column itself, matching the architecture's "widens the doc column" wording precisely, with no effect elsewhere on the page shell. Verified via Playwright across 1440/1280/1024/960/768/375px: no horizontal overflow at any width, and the nav bar's width is unaffected.
- Related Source lists `CheckoutFormExample.vue` ahead of `CheckoutFormTemplate.vue` (see the resolved nit above), a small addition beyond AC3's literal four-link minimum, matching the sibling pages' own convention of listing the excerpted host file.

No deviation from the approved feature design or architecture.

### Fix round: "How It Works" misattributed the per-row remaining computation

A branch-level audit found that the "How It Works" section (and the adjacent sentence comparing it to the Choices page) stated the per-row remaining amount is "a `computedProps` read over the sibling occurrences above it in display order", and that reordering is "the same mechanism the Choices page uses for its own repeatable choice." Neither claim matches the code: the remaining amount is a plain Vue `computed` inside `SplitPaymentLedgerRow.vue`, reading the form's `values` through vee-validate's own `useFormContext()`, not through `computedProps` (the split-payment nodes' own `computedProps` only hides the section and seeds each source's demo value). The Choices page demonstrates the underlying repeatable ordered choice and its persisted `order` value, but never writes `order` from the template itself; the reorder control is this page's own addition on top of that mechanism, not something the Choices page already does. On a page whose currency is these exact terms, a reader who opens the linked source to follow along would not find what the prose described. Reworded both sentences to state the actual mechanism (see the current "How It Works" section); no code change, prose only.

### Checks run

- `pnpm run ci:test` (scoped to `packages/*`): 34 files, 886 tests passed (`packages/core`), 1 test passed (`packages/element-plus`). Unchanged from the recorded baseline; this story touches no file under `packages/core/src/`.
- `pnpm run ci:lint`, `pnpm run ci:typecheck` (scoped to `packages/*`): clean on both packages.
- `pnpm -r ci:test:coverage`: unchanged from baseline (97.8% stmts / 93.12% branch / 98.26% funcs / 97.8% lines on `packages/core`); `git diff --stat -- packages/` is empty.
- `packages/core/node_modules/.bin/eslint` against every touched/new `docs/` file (`checkout.md`, `CheckoutFormExample.vue`, `index.ts`, `custom.css`): clean, no output (one `format/prettier` error on an italic-emphasis marker in `checkout.md` was caught and fixed during implementation).
- `packages/core/node_modules/.bin/vue-tsc --noEmit -p docs/tsconfig.json`: only the same two pre-existing baseline errors ST-01/ST-02/ST-03 already recorded (`BasicFormExample.vue`, `ChoiceSectionCard.vue`), unrelated to and not touching any file this story changed.
- `pnpm docs:build`: passes, confirming every `<<<` region tag resolves and no internal link is dead.
- Citation greps: `grep -n "Best Buy" docs/examples/checkout.md` returns zero matches. `grep -n "a major retailer" docs/examples/checkout.md` returns one match. The 45%/$300 million, Baymard (11.3/5.1/17%), and Shopify (15%/36%/50%/Big Three) figure greps each return at least one match, in that line-number order. `grep -n '^aside: false' docs/examples/checkout.md` matches exactly once. `grep -nE "FEAT-|ST-0[0-9]|\bAC[0-9]|ADR-[0-9]"` across every touched file returns nothing. `grep -n '—'` (em dash) across every touched file returns nothing. The kebab-case sweep (`grep -n -- '-choice=\|:add-choice\|...'`) found no genuine kebab-case prop/attribute binding.

### Manual verification

Ran `pnpm --prefix docs dev` and drove the page with Playwright (Chromium, `playgrounds/storybook/node_modules/playwright`, a locally cached `chromium-1228` build, `args: ['--no-proxy-server']`):

- AC1: read the narrative top to bottom; retailer never named, Baymard figures stated as fact with a working `https://baymard.com/research-articles/checkout-flow-average-form-fields` link, Shopify figures explicitly attributed to "a study Shopify commissioned from one of the Big Three consulting firms", and the four sections appear in the required order (confirmed both by reading and by the line-number-ordered greps above).
- AC2: `.VPDoc .aside` and `.VPDoc.has-aside` both resolve to zero elements (the desktop "On this page" box is absent); `.content-container`'s computed `max-width` reads `1100px`; no horizontal overflow (`document.documentElement.scrollWidth > clientWidth`) at 1440, 1280, 1024, 960, 768, or 375px viewport widths.
- AC3: all ten inline TOC links were clicked and each scrolled its target heading into view; eight code blocks render on the page (one per region excerpt); Related Source lists all five expected links (`CheckoutFormExample.vue`, `CheckoutFormTemplate.vue`, `/examples/choices`, `/examples/wizard`, `/examples/advanced`); heading order in the walkthrough matches AC3 exactly (TOC, then excerpts, then "What It Demonstrates", then "How It Works", then "Related Source").
- AC4: selecting the card payment branch shows the inert-demo-data disclaimer once; switching to iDEAL still shows it once (same wording ST-01 shipped, not a second copy).
- AC5: read the intro tip callout; it states plainly that the page rebuilds structure, not Shopify's visual design or logo.
- Dark mode: toggled `html.dark` and re-read the intro callout and the warning callout; both resolve with legible text and borders, confirmed by screenshot; the page's own `<style>`/CSS additions touch only layout width, no colors.
- `grep -n '—' docs/examples/checkout.md` and the kebab-case sweep: both clean, as reported above.

### Overall result

All six acceptance criteria verified. No `packages/core/src/` change. No changeset needed. `docs/examples/index.md` and `docs/.vitepress/config.ts` untouched, left for ST-05.

## Verification report

### Pipeline checks

- `pnpm run ci:test` (root, scoped to `packages/*`): 34 files, 886 tests passed (`packages/core`), 1 test passed (`packages/element-plus`). Unchanged from the recorded baseline, consistent with this story touching nothing under `packages/core/src/`.
- `pnpm run ci:lint`: clean on both packages.
- `pnpm run ci:typecheck`: clean on both packages.
- `pnpm -r ci:test:coverage`: unchanged from baseline (97.8% stmts / 93.12% branch / 98.26% funcs / 97.8% lines on `packages/core`). `git diff --stat -- packages/` is empty.
- `pnpm docs:build`: exit code 0. Output is two lines ("building client + server bundles", "rendering pages") plus "build complete", no warning or error of any kind, let alone one referencing `checkout.md` or any of its components.

### Acceptance criteria

| AC | Outcome | Evidence |
| --- | --- | --- |
| 1 (fixed narrative order, correct attribution) | Pass | Read the opening section end to end. Order matches exactly: retailer anecdote (line 10, "a major retailer", never named; 45% / 300 million dollars) then Baymard figures (line 12, 11.3 fields / 5.1 steps / 8 fields / 17%, with a live link) then the Shopify benchmark (line 14, explicitly "a study Shopify commissioned from one of the Big Three consulting firms", 15% / 36% / 50%, explicitly called "vendor-published... not independent fact") then `## The checkout, live` (line 20) then `## One metadata tree, one template` (line 32). `grep -n "Best Buy"` returns zero matches. `grep -n "a major retailer"` returns one match. All figure greps (45%/$300/300 million, 11.3/5.1/17%, 15%/36%/50%/Big Three) return matches in that line-number order. Clicked the Baymard link live in Chromium and independently confirmed with `curl -L` that `https://baymard.com/research-articles/checkout-flow-average-form-fields` returns HTTP 200. The Shopify link also resolves (HTTP 200), checked as an extra sanity step though not required by the QA plan. |
| 2 (`aside: false`, widened column, no overflow) | Pass | `grep -n "^aside: false"` matches exactly once. Loaded `/examples/checkout` in Chromium: `.VPDoc .aside` and `.VPDoc.has-aside` both resolve to 0 elements. `.content-container`'s computed `max-width` reads `1100px`. Tested `document.documentElement.scrollWidth > clientWidth` at 1440, 1280, 1024, 960, 768, and 375px: false (no overflow) at every width. |
| 3 (inline TOC, `<<<` excerpts, What It Demonstrates, How It Works, Related Source) | Pass | Heading order in the file matches AC3 literally: TOC list (lines 40-49) inside `## Metadata walkthrough`, then the seven excerpted subsections (8 `<<<` region tags total, confirmed by `grep -c '^<<<'`), then `## What It Demonstrates`, `## How It Works`, `## Related Source`, in that order. `pnpm docs:build` succeeding is the load-bearing proof every region tag resolves and no internal link is dead. In-browser: all 10 TOC anchors (`#express-vs-manual` through `#related-source`) resolve to a real element on the page (scripted check, all `true`). Related Source lists 5 links: `CheckoutFormExample.vue` and `CheckoutFormTemplate.vue` (GitHub, pointed at `main`, not yet resolvable until merge, as the QA plan anticipates), `/examples/choices`, `/examples/wizard`, `/examples/advanced` (labelled "Client Onboarding Wizard"), covering the required minimum of 4 plus the resolved nit's fifth link. |
| 4 (inert-payment disclaimer near card/iDEAL) | Pass | With the dev server running, selected the `card` payment branch: disclaimer "These fields are inert demo inputs. They collect no real payment data and are not a payment integration." renders once, directly above the card fields (screenshot). Switched to `iDEAL`: same single disclaimer renders again, byte-identical wording (screenshot), sourced from the one `inertPaymentDisclaimer` flag/paragraph in `CheckoutFormTemplate.vue`, not a second copy. |
| 5 (intro callout: structure, not Shopify's design or logo) | Pass | The `::: tip What you are looking at` callout (lines 16-18) reads in substance: "We rebuild the checkout's structure, not Shopify's visual design or logo." Confirmed both by direct read of the markdown and by screenshot of the rendered callout. |
| 6 (`pnpm docs:build` clean) | Pass | Exit code 0. No error or warning line of any kind in the output, let alone one naming `checkout.md`, `CheckoutFormExample`, `CheckoutFormTemplate`, `OrderSummary`, or `SplitPaymentLedger*`. The pre-existing baseline (two `vue-tsc` diagnostics in unrelated files, noted in Implementation notes) is a typecheck matter, not a `docs:build` warning, and is unaffected either way. |

### Prototype comparison

Checked against the prototype's `#page-intro` and `#metadata-walkthrough` anchors: narrative order, citation wording, and the walkthrough's section sequence (TOC, excerpts, What It Demonstrates, How It Works, Related Source) match. The live embed inherits ST-01/ST-02/ST-03's established visual language (slate neutrals, sky focus, rose/emerald states); nothing in this story's own diff (prose, frontmatter, page-scoped CSS) introduces new colors or layout outside the documented `.content-container` width rule. Dark mode re-check (toggled `html.dark`): the intro callout and the warning callout both render with legible text and correctly swapped VitePress container colors (indigo tip container, amber warning container) in both modes, confirmed by screenshot; no custom dark-mode CSS exists in this story's changes, matching the Edge case note.

### Compliance checks

- `grep -n '—'` (em dash, U+2014) across `docs/examples/checkout.md`, `docs/.vitepress/theme/index.ts`, `docs/.vitepress/theme/custom.css`: zero matches.
- `grep -nE "FEAT-|ST-0[0-9]|\bAC[0-9]|ADR-[0-9]"` across the same files: zero matches. The region marker names in `CheckoutFormExample.vue` (`express-manual-choice`, `per-country-postal`, `business-vat-toggle`, `shipping-choice`, `payment-choice`, `split-payment-choice`, `gift-message-field`, `billing-reuse`) are descriptive, not spec/story identifiers.
- Kebab-case sweep (`grep -n -- '-choice=\|:add-choice\|:remove-choice\|:can-add-choice\|:active-choice\|[a-z]-[a-z][a-zA-Z]*='` against `index.ts` and `checkout.md`): no genuine kebab-case prop/attribute binding found.
- `docs/.vitepress/theme/index.ts` diff is purely additive: one new import line, one new `app.component('CheckoutFormExample', CheckoutFormExample)` line, inserted after the existing registrations with no reordering (confirmed by reading the full diff).
- `docs/.vitepress/theme/custom.css` diff is purely additive: one new rule block (`.checkout-page .VPDoc .content-container { max-width: 1100px; }`), no existing rule touched.
- No `packages/core/src/` change (`git diff --stat -- packages/core/` is empty); no changeset present or needed for a docs-only story.
- `specs/components.md` untouched (confirmed by `git diff --stat`).
- `docs/examples/index.md` and `docs/.vitepress/config.ts` untouched (confirmed by `git diff --stat`), correctly left for ST-05.
- `CheckoutFormExample.vue`'s own diff could not be checked with `git diff` against a prior committed revision, since the file is new and uncommitted on this branch (ST-02/ST-03's own work is also uncommitted). Read the file directly instead: every `#region`/`#endregion` marker and the one clarifying comment about the `manual` branch appear as standalone comment lines, interleaved with no changed logic around them, which is as much confirmation as is possible without a git baseline. Treated as satisfying the "region markers only, no logic change" claim.
- `docs/.vitepress/theme/components/AppIcon.vue` is also modified in the working tree (adds `chevronUp`/`chevronDown` icons), but this is ST-03's file for the ledger's reorder controls, not something this story's own diff touches; noted for completeness, not a finding against ST-04.

### Overall verdict: pass

All six acceptance criteria verified with direct evidence (greps, `pnpm docs:build`, and a live Chromium session in both light and dark mode at six viewport widths). Pipeline checks are green and coverage is unchanged from baseline. No process violations found: no `packages/core/src/` change, no changeset, `specs/components.md`, `docs/examples/index.md`, and `docs/.vitepress/config.ts` all correctly left untouched for ST-05. The one non-mechanical check (confirming "region markers only" in `CheckoutFormExample.vue` without a git baseline) was satisfied by direct inspection rather than diff, noted above for transparency.

ST-01 through ST-03 are already `done`; with ST-04 now also `done`, only ST-05 (nav/cross-link/index, currently `approved`) remains before FEAT-001 can move to `done`.
