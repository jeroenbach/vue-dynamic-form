---
id: ST-04
type: story
feature: FEAT-006
status: done
approved_by: Jeroen
pr: ""
---

# Story: Narrative, metadata walkthrough, and discoverability

## Sequencing gate
Inherited from ST-01 (see its Sequencing gate section). This story is prose and navigation only; it adds no form logic and does not interact with the submit gate.

## Functional

### User story
As a docs reader, I want the inbox rules builder page to explain itself below the live form (the "first match wins" framing, a metadata-tree walkthrough, and links to the related examples) and to be discoverable from the examples index and sidebar, so that I can learn the technique the page demonstrates and find the page in the first place.

### Acceptance criteria

1. Given the page's top, When it loads, Then `#page-intro` shows the title, a "first match wins" lede drawing on a mental model the audience already has (Gmail filters, firewall ACLs, routing tables), the one-metadata-tree-plus-one-template reveal, and a VitePress `tip` callout stating the test inbox is fixed demo data and nothing is ever sent anywhere.
2. Given the `#metadata-walkthrough` section, When rendered, Then it shows `<<<` region-excerpt code blocks against the ST-01/ST-02/ST-03 source files, a "What It Demonstrates" list, a "How It Works" narrative, and a "Related Source" list, matching the structure of `/examples/checkout` and `/examples/advanced`.
3. Given the page's body, When read, Then it contains a one-directional cross-link to `/examples/choices` (the generic mechanics this page specializes) and to `/examples/checkout`'s split-payment section (the other existing demonstration of the shape), each with a sentence explaining why this page exists as the dedicated showcase.
4. Given `docs/examples/index.md`'s "Available Demos" list and `docs/.vitepress/config.ts`'s `/examples/` sidebar, When updated, Then the new page appears at slug `/examples/inbox-rules`, titled "Inbox Rules Builder", positioned between "Checkout" and "Client Onboarding Wizard" (per the feature's Q4 decision and the verified live sidebar order).
5. Given the page's disclaimers, When read, Then the body copy near the live form restates plainly that the test inbox is fixed demo data, not a real mailbox, and that no rule or message is ever sent anywhere.

### Edge cases
- The cross-links added to this page make no change whatsoever to `/examples/choices` or `/examples/checkout` or their components; verify by diff.
- The sidebar edit inserts exactly one new entry and does not reorder, rename, or remove any existing entry.

### Out of scope
- Any functional or behavioral change to the live form built in ST-01, ST-02, or ST-03.
- Coordination with FEAT-007 (explicitly out of scope per the feature's Q5 decision; no such spec exists yet).

## Design reference
Implements `../../prototype.html#page-intro` and `../../prototype.html#metadata-walkthrough` in full, plus the cross-link callouts noted inline in those sections. No new design language: matches `/examples/checkout`'s and `/examples/advanced`'s existing below-the-fold structure exactly.

## Architecture reference
Builds:
- `docs/examples/inbox-rules.md` (new page): the narrative prose, `#page-intro`, `#metadata-walkthrough` with `<<<` region excerpts targeting `InboxRulesExample.vue`, `InboxRulesTemplate.vue`, `InboxRuleRow.vue` (ST-01), `inboxRoutingMath.ts`, `TestInboxPanel.vue` (ST-02), and the `findUnreachableRules` region (ST-03); the one-directional cross-links to `/examples/choices` and `/examples/checkout#split-payment`; and the disclaimer copy.
- `docs/examples/index.md` (extended): one new "Available Demos" entry for the page.
- `docs/.vitepress/config.ts` (extended): one new `/examples/` sidebar entry, slug `/examples/inbox-rules`, title "Inbox Rules Builder", placed between the existing "Checkout" and "Client Onboarding Wizard" entries; no other entry's order, label, or slug changes.

No `packages/core/src/` change and no changeset: this story is prose and navigation only.

Dependencies: depends on ST-01 for the anchors the walkthrough excerpts against. Should land after ST-02 and ST-03 so the walkthrough accurately describes the finished reorder, routing, and unreachable behavior; the nav/index entries themselves have no structural dependency on ST-02/ST-03 and could technically land earlier, but are kept in this same story to avoid shipping a sidebar link to a page whose walkthrough is incomplete. Last story in implementation order.

## QA plan

### Why this story has no `*.test.ts` files

This story touches only `docs/examples/inbox-rules.md`, `docs/examples/index.md`, and `docs/.vitepress/config.ts`. None of `packages/core/src/` changes, `docs/` is excluded from the `pnpm-workspace.yaml` workspace and has no vitest harness, and no acceptance criterion here maps to runtime component or engine behavior (that is ST-01/ST-02/ST-03's QA plans). `*.test.ts` / `*.logic.test.ts` / `*.validation.test.ts` / `*.analytics.test.ts` coverage does not apply. The automated gate for this story is `pnpm docs:build` (VitePress compiling the page, resolving `<<<` region imports, and checking internal links, since `docs/.vitepress/config.ts` does not set `ignoreDeadLinks`, so the default strict dead-link check is active); everything else is manual verification, listed below per acceptance criterion.

### Acceptance criterion to test mapping

1. **AC1 (`#page-intro`: title, lede, one-tree reveal, tip callout).** No automatable content assertion exists for docs prose in this repo. ~~Automated: `pnpm docs:build` fails on malformed VitePress container syntax (an unclosed `::: tip` block breaks the build, so a dropped closing fence is still caught).~~ **PROPOSED (adversarial review), correcting finding 2:** a dropped closing `:::` fence does **not** break the build. `markdown-it-container` auto-closes an unterminated container at end of document with no error or warning (verified: markdown-it-container `tokenize` sets `auto_closed` at EOF; VitePress 1.6.4 bundles this unchanged), so a missing `::: tip` close silently swallows the rest of the page into the callout rather than failing `pnpm docs:build`. There is therefore no automated guard for the tip callout's integrity; the light/dark manual load below is the sole check and must confirm the callout closes where intended (content after it renders outside the box). Manual: load the built/dev page and confirm, under `#page-intro`: the title, a "first match wins" lede using one of the named mental models (Gmail filters, firewall ACLs, routing tables), the one-metadata-tree-plus-one-template reveal sentence, and a `tip` callout stating the inbox is fixed demo data and nothing is sent. Check both light and dark mode (toggle `.dark` on `<html>`), per the project's screenshot requirement for visual changes.

2. **AC2 (`#metadata-walkthrough` structure and region excerpts).** Automated: `pnpm docs:build` fails loudly (not silently) if any `<<<` region excerpt names a file or a `#region` marker that does not exist, so a missing or renamed region in `InboxRulesExample.vue` / `InboxRulesTemplate.vue` / `InboxRuleRow.vue` / `inboxRoutingMath.ts` / `TestInboxPanel.vue` is a hard build failure, not a QA gap. **Cross-story dependency, flagged here rather than invented as a workaround:** ST-01/ST-02/ST-03's architecture references name the concepts to excerpt (for example "the `findUnreachableRules` region") but not frozen `// #region <name>` identifiers, the same way the checkout's region names (`#express-manual-choice`, `#split-payment-choice`, etc.) were chosen during that feature's own implementation. This story's developer must confirm each named region actually exists with a matching name in the ST-01/ST-02/ST-03 source before writing the corresponding `<<<` line; if a region is missing, that is a gap in the earlier story's implementation notes to fix there, not something to patch around in this page's markdown. Manual: side-by-side comparison against `/examples/checkout` and `/examples/advanced` confirming the section order (region excerpts, "What It Demonstrates", "How It Works", "Related Source") and heading style match.

3. **AC3 (one-directional cross-links to `/examples/choices` and `/examples/checkout#split-payment`).** Automated: `pnpm docs:build`'s default dead-link check fails on a broken `/examples/choices` link (the page path). ~~or a broken `#split-payment` anchor (confirmed present today at `docs/examples/checkout.md`'s `### Split payment, the finale {#split-payment}`).~~ **PROPOSED (adversarial review), correcting finding 1:** VitePress 1.6.4's dead-link check validates the page path only, **not** the hash fragment, so a broken `#split-payment` anchor builds cleanly and lands at the top of the page (vuejs/vitepress#354, closed "not planned"; the limitation still holds). The anchor is confirmed present today at `docs/examples/checkout.md`'s `### Split payment, the finale {#split-payment}`, but its continued existence is not build-guarded against future drift in the checkout page; the manual click-through in checklist step 4 ("land on the right page/anchor") is the only check that the `#split-payment` target resolves, and the AC remains testable through it. Automated process check (not a vitest file, but a concrete, repeatable command): `git diff --stat docs/examples/choices.md docs/examples/checkout.md docs/.vitepress/theme/components/` must report no changes, directly verifying the edge case ("make no change whatsoever... verify by diff"). Manual: confirm each cross-link sentence explains why this page exists as the dedicated showcase (prose judgment, not automatable).

4. **AC4 (`docs/examples/index.md` and sidebar: slug, title, position).** Partially automated: `pnpm docs:build` exercises `config.ts` as TypeScript, so a syntax or type error in the sidebar array fails the build, but a working link that points to the wrong slug or sits in the wrong position still builds cleanly, VitePress does not verify sidebar entry order or route existence at build time. Automated process check: `git diff --unified=0 docs/.vitepress/config.ts` must show exactly one added line (the new entry) and zero removed lines, directly verifying the edge case ("inserts exactly one new entry and does not reorder, rename, or remove any existing entry"). Manual: run `pnpm docs:dev`, open `/examples/`, confirm "Inbox Rules Builder" is the entry between "Checkout" and "Client Onboarding Wizard", click it, confirm it resolves to `/examples/inbox-rules` with no 404, and confirm `docs/examples/index.md`'s "Available Demos" list carries a new bullet in matching style to the existing ones.

5. **AC5 (plain-language disclaimer near the live form).** Manual only: confirm the restated disclaimer sits in the body copy near `#live-form` (distinct from the `#page-intro` tip), using the required content: fixed demo data, not a real mailbox, nothing ever sent anywhere.

None of the five criteria are untestable as written; all five have a concrete manual or automated check above. No rewrite proposals are needed.

### States policy

Not applicable. This story adds no field, control, or component with pristine/focus/invalid/valid/disabled/loading/empty states; those states belong to ST-01/ST-02/ST-03's forms and are already covered by their own QA plans. The only visual surface this story adds is static prose and a `tip` callout, covered by the light/dark manual check in AC1 above.

### Reactivity / analytics

Not applicable. This story touches no `DynamicFormItem`, `computedProps`, or validation wiring; no `*.analytics.test.ts` is needed.

### Coverage impact

None. `pnpm -r ci:test:coverage` runs across the `pnpm-workspace.yaml` packages (`packages/*` only); `docs/` is excluded from that workspace entirely, so this story cannot move the coverage baseline in either direction. No code is knowingly left uncovered because no `packages/core/src/` code is touched.

### Time sensitivity

None. No date- or time-dependent content is added.

### Regression risk

- `docs/examples/index.md` and `docs/.vitepress/config.ts` are shared files every other example page's discoverability depends on. The two `git diff` checks in AC3/AC4 above are the concrete guard against an accidental reorder, rename, or removal of an existing entry.
- `docs/examples/choices.md` and `docs/examples/checkout.md` are referenced but must stay byte-for-byte unchanged (per the feature's explicit out-of-scope item); guarded by the `git diff --stat` check in AC3.
- `InboxRulesExample.vue`, `InboxRulesTemplate.vue`, `InboxRuleRow.vue`, `inboxRoutingMath.ts`, `TestInboxPanel.vue` (ST-01/ST-02/ST-03) are read-only dependencies for this story's region excerpts; this story must not edit them. `pnpm docs:build` guards against a missing region; it does not guard against this story silently editing one of those files, so that stays a manual diff check: `git diff --stat docs/.vitepress/theme/components/` should show no changes from this story (the same command already listed under AC3/AC4 covers this).
- Existing automated tests for ST-01/ST-02/ST-03 (their own `*.test.ts` / `*.logic.test.ts` / `*.analytics.test.ts` files, once those stories land) are unaffected since this story makes no code change under `packages/core/src/` or `docs/.vitepress/theme/components/`.

### Manual verification checklist

1. `pnpm docs:build` succeeds with no warnings about dead links or missing region imports.
2. `pnpm docs:dev`: load `/examples/inbox-rules` directly; confirm `#page-intro`, `#metadata-walkthrough` (with working in-page nav if `aside: false` is set, matching the checkout's short-list pattern), and the disclaimer near `#live-form` all render as specified in AC1, AC2, AC5.
3. Toggle `.dark` on `<html>` and recheck the `tip` callout and the walkthrough's code blocks render correctly in both modes; take a screenshot per the project's "Before Every Push" step 4.
4. Click through both cross-links (`/examples/choices`, `/examples/checkout#split-payment`) and confirm they land on the right page/anchor.
5. From `/examples/`, confirm sidebar position and `docs/examples/index.md` bullet position and wording (AC4).
6. Run the two `git diff` checks from AC3/AC4 (scoped to `choices.md`, `checkout.md`, `docs/.vitepress/theme/components/`, and `config.ts`) and confirm each shows only the expected, minimal change.
7. Check the Cloudflare Pages preview the PR generates, per the project's "Before Every Push" step 5, as the final cross-check of rendered layout and nav placement in a real deployed build.

## Adversarial review
Lite (story level): blockers only, with two verified factual corrections to the QA plan. No blocker found; both findings keep manual coverage and are routed as PROPOSED edits in the QA plan above. All five acceptance criteria remain testable and mapped. Consistency with the approved feature design/architecture holds: slug `/examples/inbox-rules`, title "Inbox Rules Builder", placement between Checkout and Client Onboarding Wizard, the one-directional cross-links, and the no-engine-change/no-changeset posture all match the feature's Q4/Q5 decisions and the verified live `config.ts`. Dependencies (ST-01 anchors, sequenced after ST-02/ST-03, region names confirmed against landed source) are explicit.

Verification done: `docs/package.json` pins `vitepress@1.6.4`; `ignoreDeadLinks` is unset anywhere under `docs/` (default strict page-path check active); `#split-payment` exists today at `docs/examples/checkout.md:85`; `/examples/choices.md` exists; `config.ts` sidebar order and the Checkout / Client Onboarding Wizard neighbours are as the feature claims.

1. **should-fix (routed as PROPOSED in AC3) — the QA plan claims `pnpm docs:build` catches a broken `#split-payment` anchor; it does not.** VitePress 1.6.4's dead-link check validates the page path (`/examples/checkout`) but not the hash fragment, so a link to a non-existent `#split-payment` builds cleanly and silently lands at the top of the page. Verified against vuejs/vitepress#354 (closed "not planned", 2022; limitation still current) and corroborated by the community workaround projects that exist precisely because VitePress omits anchor validation. Impact is bounded: the anchor is correct today and the manual click-through (checklist step 4) covers AC3, so the AC stays testable; the defect is the overstated automated coverage, which could let a future checkout-page edit break this link undetected by the build. Resolution written into AC3: attribute the automated guard to the page path only and name checklist step 4 as the sole check on the fragment.

2. **should-fix (routed as PROPOSED in AC1) — the QA plan claims an unclosed `::: tip` container "breaks the build"; it does not.** `markdown-it-container` auto-closes an unterminated container at end of document (`auto_closed` on reaching EOF) with no error or warning, and VitePress 1.6.4 bundles it unchanged. A dropped closing `:::` therefore does not fail `pnpm docs:build`; it silently swallows the rest of the page into the callout, which is the exact regression the author believed the build guarded. The manual light/dark load (AC1) catches it visually, so AC1 stays testable; the correction removes the false automated guarantee and names the manual load as the only check on callout integrity.

3. **nit — the Dependencies paragraph frames ST-02/ST-03 as "should land after ... so the walkthrough accurately describes finished behavior", understating a hard build dependency.** The `<<<` region excerpts target `inboxRoutingMath.ts`, `TestInboxPanel.vue` (ST-02) and the `findUnreachableRules` region (ST-03); VitePress 1.6.4 throws a build error (default `snippet.silent: false`) when an excerpted file or named region does not exist, so `pnpm docs:build` cannot pass until ST-02 and ST-03 source has landed. The net sequencing conclusion ("Last story in implementation order") and AC2's "hard build failure" note are already correct, so this is wording precision only, no change required: ST-02/ST-03 are a build prerequisite for the walkthrough excerpts, not merely an accuracy preference.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

Built: replaced the ST-01 stub `docs/examples/inbox-rules.md` with the full page (intro, `#live-form` heading plus disclaimer, `#metadata-walkthrough` with six `###` subsections mirroring the prototype's own in-page nav, What It Demonstrates, How It Works, Related Source). Added one entry each to `docs/examples/index.md`'s Available Demos list and `docs/.vitepress/config.ts`'s `/examples/` sidebar, both between Checkout and Client Onboarding Wizard, per the feature's decided Q4.

Added named `// #region` / `<!-- #region -->` anchors to the ST-01/ST-02/ST-03 source so the page's `<<<` excerpts have something stable to target: `InboxRulesExample.vue` (`action-reveal`, `live-routing`, and a `hasattachment-branch` region nested inside the existing `metadata` region), `InboxRulesTemplate.vue` (`rule-list-slots`), `InboxRuleRow.vue` (`reorder-plan`, `unreachable-badge`), `inboxRoutingMath.ts` (`matches`, `route-inbox`, `plan-reorder-swap`, `find-unreachable-rules`), `TestInboxPanel.vue` (`routed-badge`). Every addition is a comment-only insertion; no logic, markup, or behavior in any of those five files changed, confirmed by using Edit's exact-match replacement (which fails if the surrounding code does not match verbatim) and by `pnpm run ci:test` passing unchanged.

Deviation, disclosed: the QA plan's Regression risk section describes these five files as "read-only dependencies" this story "must not edit", and proposes `git diff --stat docs/.vitepress/theme/components/` reporting no changes as the guard. Taken fully literally that check cannot pass, since the task explicitly directs this story to add named region anchors to the example source (the only way `<<<` excerpts work), and all five files are new/untracked from ST-01-03 (no commits exist yet in this interactive session), so `git diff` cannot see them either way. Read sensibly, the intent of that check is that the two other example pages (`choices.md`, `checkout.md`) and their own components stay untouched, which I verified directly: `git status --porcelain -- docs/examples/choices.md docs/examples/checkout.md` reports nothing, and `git diff --stat docs/.vitepress/theme/components/` (tracked files only) reports nothing, confirming no file belonging to another example was touched. The five Inbox files themselves only grew comment-only region markers, verified by inspection, not by a diff check that cannot apply to untracked files.

Cross-links: a sentence in the intro references both `/examples/choices` and `/examples/checkout#split-payment`/Related Source; `Related Source` carries the full explanatory sentences the acceptance criterion asks for. Verified via Playwright that both links resolve to the correct page and the checkout link lands on the real `#split-payment` anchor (not just the page top).

No `packages/core/src/` change, no changeset, no `specs/components.md` update: nothing on the published public surface changed, this story is prose, region comments, and navigation only.

Verified manually in the browser (Playwright, light and dark mode) against the built `/examples/inbox-rules` page (`packages/core`'s dist rebuilt first, same prerequisite the prior three stories recorded): the intro's tip callout, the sidebar position between Checkout and Client Onboarding Wizard, the Available Demos entry, all eleven `<<<` excerpts (balanced, syntax-highlighted, correct in both color modes), and both cross-links (including the checkout anchor landing mid-page, not at the top) all render and resolve as specified. No console errors on load.

## Verification report
Filled by qa-verifier after implementation.

### Pipeline results

- `pnpm run ci:test` (`pnpm -r ci:test`): pass, 37 test files / 971 tests in `packages/core`, 1 test in `packages/element-plus`.
- `pnpm run ci:lint` (`pnpm -r ci:lint`): pass, no errors in either workspace package.
- `pnpm run ci:typecheck` (`pnpm -r ci:typecheck`): pass, `vue-tsc --noEmit` clean in both packages.
- `TZ=Europe/Amsterdam pnpm -r ci:test:coverage`: pass. `packages/core` 98.51% stmts / 92.91% branch / 98.36% funcs / 98.51% lines, matching the pre-story baseline (no file under `packages/core/src/` changed by this story, confirmed by `git status --porcelain -- packages/core/src/` returning nothing).
- `pnpm docs:test`: pass, 2 test files / 48 tests (`inboxRoutingMath.test.ts`, `inboxRoutingMath.logic.test.ts`). These belong to ST-02/ST-03, not this story, but they still gate the working tree.
- `pnpm build` (core rebuilt first, since docs consumes `packages/core` via `link:*` dist) then `pnpm docs:build`: pass, no dead-link warnings, no build errors. Confirms all 11 `<<<` region excerpts resolve and `/examples/choices` resolves as a page path.

### Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `#page-intro`: title, "first match wins" lede with a named mental model, one-tree-plus-one-template reveal, `tip` callout (fixed demo data, nothing sent) | Pass | Rendered page inspected via Playwright (light and dark, screenshots below). Lede opens with "Gmail filters, firewall ACLs, routing tables: they all do the same thing... first match wins." Reveal sentence: "The form below is one repeatable ordered `choice`: a single metadata tree, rendered through one template, with no bespoke engine code behind the reorder-and-reroute effect." `::: tip What you are looking at` callout states the inbox is "six fixed, fictional messages, routed entirely in your browser... no rule or message is ever sent anywhere." Confirmed the callout closes correctly: the next paragraph ("This page specializes a shape...") renders as normal body text outside the tip box, not swallowed into it. |
| 2 | `#metadata-walkthrough`: `<<<` region excerpts, What It Demonstrates, How It Works, Related Source, matching `/examples/checkout` / `/examples/advanced` structure | Pass | All 11 named regions exist with matching names in the 5 source files (verified by grep) and all 11 render as syntax-highlighted code block divs on the page (Playwright DOM count: 11). Section order (`#metadata-walkthrough` in-page nav list -> 6 subsections -> `## What It Demonstrates` -> `## How It Works` -> `## Related Source`) matches `docs/examples/checkout.md`'s heading structure exactly (`## Metadata walkthrough` -> subsections -> `## What It Demonstrates` -> `## How It Works` -> `## Related Source`). |
| 3 | One-directional cross-links to `/examples/choices` and `/examples/checkout#split-payment`, each with an explanatory sentence | Pass | Playwright click-through: the `/examples/choices` link navigates to `http://localhost:5173/examples/choices` (200, correct page); the `/examples/checkout#split-payment` link lands with `window.scrollY = 8577` and the `#split-payment` heading ("Split payment, the finale") visible in viewport, not at page top, confirming the real anchor resolves. Explanatory sentences present both in the intro paragraph and in the Related Source bullets ("the repeatable ordered choice mechanics this page specializes...", "the other existing demonstration... there as an opt-in finale rather than the whole page"). Edge case verified: `git status --porcelain -- docs/examples/choices.md docs/examples/checkout.md` is empty and `git diff --stat -- docs/.vitepress/theme/components/` shows no tracked-file changes, so neither page nor any existing component was touched. |
| 4 | `docs/examples/index.md` and sidebar: slug `/examples/inbox-rules`, title "Inbox Rules Builder", between Checkout and Client Onboarding Wizard | Pass | `git diff -- docs/.vitepress/config.ts` shows exactly one added line, `{ text: 'Inbox Rules Builder', link: '/examples/inbox-rules' }`, positioned directly after `Checkout` and before `Client Onboarding Wizard`, zero lines removed or reordered. `git diff -- docs/examples/index.md` shows exactly one added bullet in matching style, same position. Rendered sidebar screenshot confirms the visual position; clicking it in Playwright resolves to `/examples/inbox-rules` with HTTP 200, no 404. |
| 5 | Plain-language disclaimer near `#live-form`, distinct from the `#page-intro` tip | Pass | Body copy under "The rule list, live" reads: "no rule set is ever saved anywhere outside your browser tab, and the 'mailbox' on the right stays fixed demo data, never a real inbox, no matter what you add." Distinct wording from the intro tip, same required content (fixed demo data, not real, nothing sent). |

### Prototype / sibling comparison

Compared `#page-intro` and `#metadata-walkthrough` against `prototype.html` and against the live `/examples/checkout` and `/examples/advanced` pages. Section order, heading levels, in-page nav substitute (since `aside: false`), and the three closing subsections (What It Demonstrates / How It Works / Related Source) all match the sibling pages' established pattern. No new design language introduced, consistent with the story's Design reference. Light and dark mode both verified via Playwright screenshots (intro, callout, code-block syntax highlighting, metadata-walkthrough section); no light-only or dark-only rendering issues found. No responsive annotation applies to this story (prose only, no new layout).

### Process compliance

- No `packages/core/src/` change (`git status --porcelain -- packages/core/src/` empty). No changeset required or added, consistent with the story's architecture reference.
- No `specs/components.md` update: correct, nothing on the published public surface changed.
- Writing style: no em dashes found in any new or touched prose, comments, or region names (grepped `docs/examples/inbox-rules.md`, `docs/examples/index.md`, `docs/.vitepress/config.ts`, and all five touched source files). No `FEAT-`, `ST-`, `ADR-`, `AC[0-9]`, or "QA plan" references found in any code comment, region name, or page copy (the only grep hits were false positives on the English words "specializes"/"specific").
- Region markers are comment-only insertions. Spot-checked `InboxRulesExample.vue`'s surrounding code (constants, `live-routing` computed) for evidence of no logic change; combined with `pnpm run ci:test` passing unchanged and `vue-tsc`/eslint both clean, this is sufficient corroboration without re-diffing files that were never tracked before this session.
- Disclosed deviation (QA plan's `git diff --stat docs/.vitepress/theme/components/` check): judged reasonable. The literal check cannot apply to untracked files in this uncommitted working tree, and the developer's substitute (`git status --porcelain` on `choices.md`/`checkout.md`, `git diff --stat` on the tracked component directory) verifies the actual intent of the guard (siblings untouched) just as directly. Independently re-ran both commands myself with the same empty result. No concern.
- Test naming: `docs/.vitepress/theme/components/__tests__/inboxRoutingMath.test.ts` and `inboxRoutingMath.logic.test.ts` follow repo convention, but both belong to ST-02/ST-03's scope, not this story; this story adds no test files of its own, matching its QA plan's documented rationale ("Why this story has no `*.test.ts` files").

### Overall verdict: pass

All five acceptance criteria pass with evidence. Pipeline is fully green (test, lint, typecheck, coverage unchanged, docs:test, docs:build with strict dead-link check). Edge cases (choices.md/checkout.md untouched, exactly one sidebar/index line added) verified directly. No deviations beyond the one already disclosed and judged reasonable above.

This is the last story of FEAT-006 (ST-01 through ST-03 are `done`). With ST-04 now `done`, the feature has no open stories and can move to `done`.

Reminder for Jeroen: link the PR in this story's `pr:` frontmatter field once opened.
