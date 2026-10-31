---
id: ST-04
type: story
feature: FEAT-006
status: approved
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

## Verification report
Filled by qa-verifier after implementation.
