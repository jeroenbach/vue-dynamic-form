---
id: ST-05
type: story
feature: FEAT-001
status: done
approved_by: Jeroen
pr: ""
---

# Story: Nav entry, cross-link, and examples index update

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- QA label flag → relabeling the "Advanced Wizard" bullet in docs/examples/index.md was first decided in-story, then withdrawn after adversarial review finding 1: it exceeds the approved feature architecture ("add a bullet" only) and Q8's sidebar-only scope. This story adds the checkout bullet only. The label inconsistency (index.md says "Advanced Wizard", sidebar and prose say "Client Onboarding Wizard") stays documented under finding 1 for Jeroen: one word at the approval gate ("also relabel it") reinstates it, otherwise it is follow-up material.

## Functional
### User story
As a docs reader browsing the site navigation, I want the new checkout example to be discoverable from the sidebar and the existing onboarding wizard to be clearly labeled and cross-linked to it, so that I can find both examples without confusing one checkout-sounding page for the other.

### Acceptance criteria

1. Given `docs/.vitepress/config.ts`, When the `/examples/` sidebar is rendered, Then a "Checkout" entry pointing at `/examples/checkout` appears directly after the existing Wizard entry and ahead of the relabeled Client Onboarding Wizard entry (the sidebar is one flat items array; see Adversarial review finding 2).
2. Given the existing sidebar entry currently labeled for `/examples/advanced`, When the sidebar renders, Then its label reads "Client Onboarding Wizard" and its slug and target page are unchanged.
3. Given `docs/examples/advanced.md`, When the page renders, Then it contains a cross-link to `/examples/checkout`, and no other content on the page changes.
4. Given `docs/examples/index.md`'s "Available Demos" list, When the page renders, Then it includes a bullet for the new checkout example linking to `/examples/checkout`, the existing bullets are unchanged, and the existing "Quick Overview" embeds are unchanged (the checkout is linked, not embedded a second time). (The existing "Advanced Wizard" bullet's label is deliberately not touched; see Adversarial review finding 1.)
5. Given `pnpm docs:build`, When run after this story lands, Then the site builds without errors and both `/examples/checkout` and `/examples/advanced` resolve to their intended pages with the labels above.

### Edge cases
- No other sidebar entries shift position as a side effect of inserting the new one.
- The rename of the existing entry's label must not alter its route, so any existing external links to `/examples/advanced` keep working.

### Out of scope
- The content of `docs/examples/checkout.md` itself (ST-04).
- Any content change to `docs/examples/advanced.md` beyond the one cross-link and the sidebar label (per the feature's explicit out-of-scope note).

## Design reference
No dedicated prototype anchor: this is site chrome outside the prototype's stacked page. Reflects the feature's Design decisions and DECIDED answers to Open questions 1 and 8 (new page leads the advanced examples at its own slug; existing page keeps its slug and content, relabeled "Client Onboarding Wizard," plus a cross-link), and the prototype's "Related Source" list in `#metadata-walkthrough`, which already shows the intended cross-links.

## Architecture reference
Builds, from the feature architecture's docs page and nav structure section:
- `docs/.vitepress/config.ts`: sidebar insertion and label rename described above.
- `docs/examples/advanced.md`: adds the one cross-link.
- `docs/examples/index.md`: adds the one bullet.

No `packages/core/src/` change and no changeset in this story.

Dependencies: none functionally required on other stories to implement (the target route `/examples/checkout` is a known literal), though the link is only meaningful once ST-04 has created that page. Can be implemented at any point; placed last in implementation order only because it is the smallest, lowest-risk slice and reads most naturally once the destination page exists.

## QA plan

### Why no `*.test.ts` / `*.logic.test.ts` / `*.validation.test.ts` / `*.analytics.test.ts` file is added

This slice touches only `docs/.vitepress/config.ts` (a declarative array of nav/sidebar objects) and two markdown files (a prose link and a prose bullet). Per the Architecture reference, no file under `packages/core/src/` changes and no changeset is expected. `docs/` is excluded from the pnpm workspace, has its own `node_modules`, and has no test runner installed (confirmed: no `vitest` devDependency, no `__tests__` directory, no test script in `docs/package.json`). There is no runtime logic here for vee-validate, `DynamicFormItem`, `computedProps`, or any validation rule to exercise, so none of the four naming conventions apply, and adding a test harness to the `docs/` workspace for one static array and two markdown edits would be infrastructure scope beyond this story's architecture reference. Verification is manual plus `pnpm docs:build`, which is the closest thing this surface has to an automated check (it fails the build on build errors and on internal dead links, since this config does not set `ignoreDeadLinks`).

### Test mapping (acceptance criterion to verification)

| AC | Verification | Method |
| --- | --- | --- |
| 1 (sidebar order: Checkout after fundamentals, before the existing advanced entry) | Manual | Code diff review of the `/examples/` sidebar array, plus visual check in `pnpm docs:dev` |
| 2 (existing entry relabeled "Client Onboarding Wizard", route unchanged) | Manual | Code diff review (only `text` changes, `link` untouched), plus click-through in `pnpm docs:dev` |
| 3 (cross-link on `advanced.md`, no other content change) | Manual | Rendered page check in `pnpm docs:dev`, plus diff of `docs/examples/advanced.md` |
| 4 (index bullet for checkout, Quick Overview embeds unchanged) | Manual | Rendered page check in `pnpm docs:dev`, plus diff of `docs/examples/index.md` |
| 5 (`pnpm docs:build` succeeds, both routes resolve with correct labels) | Manual build run | `pnpm docs:build` then `pnpm docs:preview`, run once this story and ST-04 are both present (see Regression risk) |

### Fixtures / utilities
None needed. No `packages/core/src/examples/` fixture or test utility applies: this story adds no metadata tree, no template, and no component.

### States policy
Not applicable. No new interactive UI is added, only a sidebar entry, a label string, a prose link, and a prose bullet. No `DynamicFormItem` instance, loading/empty/error/validation state, or focus/disabled state is introduced or changed by this story.

### Reactivity (render-count)
Not applicable. No `DynamicFormItem`, `computedProps`, or validation wiring is touched.

### Coverage impact
None expected. `docs/` is excluded from the pnpm workspace and from `pnpm -r ci:test:coverage`; no file under `packages/core/src/` changes. Running `pnpm -r ci:test:coverage` after this story should report the exact same statement/branch/function numbers as the pre-story baseline. Any delta would indicate a regression unrelated to this story, not an effect of it.

### Time sensitivity
Not applicable. Nothing touched here is date or time dependent.

### Regression risk
- `docs/.vitepress/config.ts`'s `/examples/` sidebar array is read on every docs page. An insertion mistake could shift or duplicate neighboring entries (edge case 1), so the checklist below requires confirming every existing entry, not only the two touched ones, and confirming the `/guide/` and `/reference/` sidebar arrays in the same file are untouched.
- The relabel touches shared nav chrome; confirming the `link` property is untouched (still `/examples/advanced`) is the only thing standing between this change and a broken route for anyone with an existing bookmark or external link (edge case 2).
- `docs/examples/index.md` already has a bullet reading "Advanced Wizard" for the same page the sidebar will now call "Client Onboarding Wizard" (`docs/examples/wizard.md` and `docs/examples/choices.md` already link to that page in prose using the text "Client Onboarding Wizard", confirming that label is already established elsewhere in the docs, which lowers risk on AC2's wording choice). AC4 only requires adding the new checkout bullet and does not ask for the existing bullet's wording to be reconciled, so leaving it as "Advanced Wizard" is correct per scope as written. Flagging for review: the page now has two different labels in play in `index.md` alone (the sidebar's new "Client Onboarding Wizard" versus the existing "Advanced Wizard" bullet). This is not a defect of this story as scoped; it is a human call on whether a follow-up should reconcile it.

DECIDED (research, withdrawn after adversarial review finding 1): The relabel was first decided here, then withdrawn: it exceeds the approved feature architecture ("add a bullet" only) and Q8's sidebar-only scope, and a story may not extend its approved feature. AC4 is reverted to add-bullet-only. The inconsistency itself remains real and verified (sidebar and prose say "Client Onboarding Wizard", `index.md` still says "Advanced Wizard") and is left for Jeroen under finding 1.
- AC3's cross-link and AC4's new bullet both target `/examples/checkout`, which only exists once ST-04 lands. This config has no `ignoreDeadLinks` override, so VitePress's default build-time dead-link check will fail `pnpm docs:build` if this story is built without ST-04 on the branch. That failure is expected, not a defect: AC5 must be re-verified with both stories present, matching this story's own Architecture reference dependency note.
- No existing automated test guards this surface: a repo-wide search for `"Advanced example"`, `"examples/advanced"`, and `"Client Onboarding Wizard"` outside specs and docs prose turns up nothing in `packages/core`, so there is no snapshot or unit test that could catch a regression here. The manual checklist below is written to be the sole guard, which is why it checks every entry, not only the diff lines.

### Manual verification checklist
1. **AC1 (order):** diff `docs/.vitepress/config.ts` and confirm the `/examples/` sidebar array reads, in order: Overview, Basic Form, Arrays And Groups, Choices, Dynamic Fields, Validation, Wizard, Checkout, Client Onboarding Wizard, and that the `/guide/` and `/reference/` arrays are untouched. Then run `pnpm docs:dev`, open `/examples/`, and visually confirm "Checkout" sits immediately after "Wizard" and before "Client Onboarding Wizard" with every other entry in its original position.
2. **AC2 (relabel, route unchanged):** in the same diff, confirm only the `text` property changed (`'Advanced example'` to `'Client Onboarding Wizard'`) and `link` still reads `/examples/advanced`. In the dev server, click the renamed sidebar entry and confirm it lands on the existing Client Onboarding Wizard page content, unchanged.
3. **AC3 (cross-link):** with `/examples/checkout` present (see the ST-04 dependency note above), open `/examples/advanced` in the dev server, confirm a visible link to `/examples/checkout` appears and resolves, then diff `docs/examples/advanced.md` and confirm the only change is the added link.
4. **AC4 (index bullet):** open `/examples/` in the dev server, confirm a new "Available Demos" bullet linking to `/examples/checkout` appears and resolves, then diff `docs/examples/index.md` and confirm exactly one new bullet line was added (the existing bullets, including the "Advanced Wizard" one, untouched) and the "Quick Overview" embeds are unchanged.
5. **AC5 (build):** verify `node_modules` is installed in `docs/` (per `CLAUDE.md`), then run `pnpm docs:build` once this story and ST-04 are both on the branch; confirm it exits 0 with no errors and no dead-link warnings. Run `pnpm docs:preview` and open both `/examples/checkout` and `/examples/advanced`, confirming each resolves to its intended page and the sidebar shows the labels from AC1/AC2.
6. **Dark mode spot-check:** since the sidebar entry, the cross-link, and the bullet are plain VitePress theme chrome with no page-specific CSS, toggle dark mode on `/examples/` and `/examples/advanced` and confirm the new text inherits the theme's existing sidebar/link styling, consistent with the feature's "Light and dark" policy that no section needs dark-specific structural styling.

## Adversarial review

STORY mode (lite): blockers only, plus one nit noted for cleanliness. Findings and routing below.

What I verified as true against the repo (so these are not findings):
- The current `/examples/` sidebar entry is `{ text: 'Advanced example', link: '/examples/advanced' }` (`docs/.vitepress/config.ts:72`), so AC2's "Advanced example" to "Client Onboarding Wizard" relabel and the unchanged `/examples/advanced` link are factually correct.
- The current sidebar order (Overview, Basic Form, Arrays And Groups, Choices, Dynamic Fields, Validation, Wizard, Advanced example) matches the checklist's claimed order exactly (`config.ts:61-74`), so AC1's "after Wizard, before the existing advanced entry" placement is accurate.
- `docs/examples/index.md:13` reads `- [Advanced Wizard](/examples/advanced): full-featured client onboarding wizard`, matching the story's "Advanced Wizard" claim, and the Quick Overview embeds (`FormExampleBasic`, `FormExampleArrayFields`, `FormExampleChoiceFields`) are unrelated to the advanced/checkout pages, so AC4's "embeds unchanged" is sound.
- The DECIDED (research) rationale is verified: `docs/examples/wizard.md:55` and `docs/examples/choices.md:75` both link to `/examples/advanced` with the prose text "Client Onboarding Wizard", and `advanced.md:1` titles the page "Advanced: Client Onboarding Wizard".
- No file under `packages/core` references these labels or routes, confirming the QA plan's "no automated guard" claim and the manual-only verification approach.
- The config sets no `ignoreDeadLinks`, so AC5/AC3/AC4's dependency on ST-04 (dead links until `/examples/checkout` exists) is real and correctly recorded.
- All five acceptance criteria are testable and mapped 1:1 in the Test mapping table; the ST-04 dependency is explicit in both the AC5 mapping row and the Regression risk section.

1. **(should-fix, routed to Jeroen) The AC4 index.md relabel is a story-level scope extension beyond the approved feature architecture.** The feature's "Docs page and nav structure" section authorizes exactly one index.md change ("add a bullet for the checkout example to 'Available Demos'. Leave the 'Quick Overview' embeds as-is") and Q8's DECIDED text is scoped to the *sidebar label* only ("The existing page's sidebar label becomes 'Client Onboarding Wizard'"). Neither authorizes editing the existing index.md prose bullet. This story's "Decided without Jeroen (research)" entry and the QA plan's DECIDED (research) note extend AC4 to also relabel the "Advanced Wizard" bullet. The edit itself is correct, trivial, and aligned with Q8's "one clear label" intent (and factually grounded, verified above), so this is not a contradiction. But per the project's hard rule that story-level changes going beyond the approved feature design/architecture require amending the feature spec first rather than being decided in-story, this AC expansion should be blessed by Jeroen, not settled by a research decision inside the story. Suggested resolution (Jeroen's call): either amend the feature's "Docs page and nav structure" bullet to include the index.md relabel so the architecture of record matches what ships, or drop the relabel from AC4 and leave the index.md bullet reconciliation to a follow-up. I cannot route a PROPOSED edit for this, because the fix lives in the approved feature spec (a different spec, outside my phase), so this stays open for discussion rather than being pre-resolved here.

   RESOLVED (story prep): Resolution option two taken: the relabel is dropped from AC4 and this story ships exactly the index.md change the approved feature authorizes (one new bullet). The research decision that introduced the extension is withdrawn (see the rollup above). What remains for Jeroen is optional, not blocking: if he wants the index.md bullet reconciled to "Client Onboarding Wizard", saying so at the approval gate reinstates it as an explicit scope addition, or it becomes a trivial follow-up. No unresolved should-fix remains in this story.

2. **(nit) AC1's "fundamentals group" implies a sidebar sub-grouping that does not exist.** The `/examples/` sidebar is a single flat `items` array under one "Examples" group (`config.ts:61-74`), with no "fundamentals" sub-group to insert after. The manual checklist's concrete order ("...Validation, Wizard, Checkout, Client Onboarding Wizard") disambiguates the actual insertion point, so there is no functional risk, but AC1's wording could be tightened to "directly after the existing Wizard entry and ahead of the relabeled Client Onboarding Wizard entry" to match the flat structure. Mirrors the same loose phrasing inherited from the feature architecture; not blocking.

## Implementation notes

### Files touched

- `docs/.vitepress/config.ts`: in the `/examples/` sidebar array, inserted `{ text: 'Checkout', link: '/examples/checkout' }` directly after the `Wizard` entry, and renamed the existing entry's `text` from `'Advanced example'` to `'Client Onboarding Wizard'`, leaving its `link` (`/examples/advanced`) untouched. No other sidebar array in the file was touched.
- `docs/examples/advanced.md`: added one sentence under the intro paragraph cross-linking to `/examples/checkout`. No other content changed.
- `docs/examples/index.md`: added one new bullet under "Available Demos" for the checkout example, linking to `/examples/checkout`, placed between the existing Wizard and Advanced Wizard bullets to mirror the sidebar order. The existing bullets (including "Advanced Wizard") and the "Quick Overview" embeds were left untouched, per the resolved adversarial review finding 1.

No `packages/core/src/` change and no changeset, consistent with the architecture's conclusion that this story is docs-only. `specs/components.md` was not touched: this story adds no public library surface.

### Verification

`pnpm docs:build` passed clean (no dead links, both `/examples/checkout` and `/examples/advanced` resolve), confirming ST-04's checkout page satisfies this story's link dependency. `pnpm run ci:lint` (via `packages/core`'s eslint binary against the three changed files directly, since `docs/` has no lint script of its own), `pnpm run ci:test`, and `pnpm run ci:typecheck` all passed with no new findings. Manual check via `pnpm docs:dev` plus a scripted Playwright pass confirmed the `/examples/` sidebar reads, in order: Overview, Basic Form, Arrays And Groups, Choices, Dynamic Fields, Validation, Wizard, Checkout, Client Onboarding Wizard; the new "Checkout" bullet appears between "Wizard" and "Advanced Wizard" on the index page; `/examples/advanced` contains a working link to `/examples/checkout`; and both routes resolve to their intended pages. No deviation from the architecture's docs-only, nav-and-links-only scope for this seam.

## Verification report

### Pipeline

- `pnpm run ci:test` (`pnpm -r ci:test`): pass, 34 test files / 886 tests in `packages/core`, 1 test in `packages/element-plus`, no failures.
- `pnpm run ci:lint` (`pnpm -r ci:lint`): pass, no findings in either workspace package. Since `docs/` is excluded from the pnpm workspace and has no lint script, also ran `./packages/core/node_modules/.bin/eslint` directly against the three changed files (`docs/.vitepress/config.ts`, `docs/examples/advanced.md`, `docs/examples/index.md`): no output, clean.
- `pnpm run ci:typecheck` (`pnpm -r ci:typecheck`): pass, no errors in either workspace package.
- `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`): pass, `packages/core` all-files 97.8% stmts / 93.14% branch / 98.26% funcs / 97.8% lines; `packages/element-plus` unchanged (0% stmts, trivial stub file, same as before). No `packages/core/src/` file changed in this story, so these numbers are the pre-existing baseline carried forward unmodified, not a regression.
- `pnpm docs:build`: pass, built client + server bundles and rendered pages with no errors and no dead-link warnings (the VitePress default dead-link check is strict here, confirming both `/examples/checkout` and `/examples/advanced` resolve now that ST-04's `checkout.md` is present on the branch).

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. Checkout entry directly after Wizard, ahead of the relabeled Client Onboarding Wizard entry, flat items array | Pass | `docs/.vitepress/config.ts` diff: `{ text: 'Checkout', link: '/examples/checkout' }` inserted immediately after the `Wizard` entry and before the renamed entry, inside the single flat `/examples/` `items` array. Confirmed visually in `pnpm docs:dev` screenshot: sidebar order reads Overview, Basic Form, Arrays And Groups, Choices, Dynamic Fields, Validation, Wizard, Checkout, Client Onboarding Wizard. |
| 2. Existing entry relabeled "Client Onboarding Wizard", slug/link unchanged | Pass | Diff shows only `text` changed (`'Advanced example'` -> `'Client Onboarding Wizard'`); `link: '/examples/advanced'` untouched. Click-through in Playwright confirmed the renamed sidebar entry still lands on `docs/examples/advanced.md` content, title "Advanced: Client Onboarding Wizard" unchanged. |
| 3. `advanced.md` cross-link to `/examples/checkout`, no other content change | Pass | Diff adds exactly one new sentence ("Looking for a one-page checkout instead of a multi-step wizard? See the Checkout example.") plus its separating blank line; no other line changed. Screenshot (light and dark) shows the link rendered and styled as a normal inline link; a scripted click on it navigated to `http://localhost:5173/examples/checkout`. |
| 4. `index.md` new bullet for checkout, existing bullets and Quick Overview embeds unchanged | Pass | Diff adds exactly one new bullet line (`- [Checkout](/examples/checkout): a complete one-page webshop checkout with a split-payment finale`) between the Wizard and "Advanced Wizard" bullets; every other bullet, including "Advanced Wizard", is untouched; the three `Quick Overview` embeds (`FormExampleBasic`, `FormExampleArrayFields`, `FormExampleChoiceFields`) are untouched. Confirmed in diff and in the rendered screenshot. |
| 5. `pnpm docs:build` succeeds, both routes resolve with correct labels | Pass | `pnpm docs:build` exited 0 with no dead-link errors. `pnpm docs:dev` + Playwright: `/examples/checkout` returns HTTP 200 with title "A complete webshop checkout, Shopify-style \| Vue Dynamic Form"; `/examples/advanced` renders "Advanced: Client Onboarding Wizard" with the sidebar showing both labels from AC1/AC2. |

### Edge cases

- No other sidebar entries shift position: confirmed, the diff only touches the `Wizard`-to-`Advanced example` boundary of the `/examples/` array; every other entry (`Overview` through `Wizard`) is unchanged in the diff and in the rendered sidebar screenshot. The `/guide/` and `/reference/` sidebar arrays are untouched (not present in the diff; full file read confirms both arrays are byte-identical to before).
- Rename does not alter the route: confirmed, `link: '/examples/advanced'` is unchanged in the diff, and the route still resolves to the same page content, so any existing bookmark or external link to `/examples/advanced` keeps working.

### Prototype / visual comparison

No dedicated prototype anchor for this story (site chrome outside the prototype's stacked page, per Design reference). Took Playwright screenshots of `/examples/` and `/examples/advanced` in both light and dark mode (`pnpm docs:dev`, Chromium, `--no-proxy-server`): sidebar, bullet list, and cross-link all inherit the existing VitePress theme's default link/sidebar styling in both modes with no custom CSS introduced, consistent with the feature's "Light and dark" policy that no section needs dark-specific structural styling. No visual drift from sibling stories observed; this story adds no new components, only nav/text entries.

### Process compliance

- No `packages/core/src/` change (confirmed via `git status`); no changeset present or required.
- `specs/components.md` not touched; correct, since this story adds no public library surface.
- No em dashes and no spec/story/finding identifiers (FEAT/ST/AC/ADR/QA) found in any of the three changed files (`grep` check).
- No test file added; the story's own QA plan documents why (`docs/` has no test runner, this is a declarative config array plus two prose edits), and this verifier agrees no automated-test convention from `CLAUDE.md` applies here.
- Implementation notes' "Files touched" and "Verification" sections match the actual diff exactly: one sidebar insertion plus one label rename in `config.ts`, one added sentence in `advanced.md`, one added bullet in `index.md`.
- No silent override of feature-level decisions: the shipped AC4 matches the feature architecture's "add a bullet... leave Quick Overview embeds as-is" instruction exactly, consistent with the adversarial-review finding 1 resolution (the "Advanced Wizard" bullet wording stays untouched, left open for Jeroen as noted in Open questions / Decided without Jeroen section, not silently resolved here).

### Overall verdict: pass

No fixes required. All 5 acceptance criteria pass with evidence, both edge cases hold, the pipeline is fully green, coverage is unaffected (no `packages/core/src/` change), `pnpm docs:build` is clean, and process compliance checks (no changeset needed, no components.md change needed, no em dashes, no spec ids, no undocumented scope creep) all hold.

This was the last open story for FEAT-001 (ST-01 through ST-05 all implemented in this working tree); the feature can move to `done` once Jeroen confirms all five story verifications and stamps the feature's own approval/status transition.

Reminder for Jeroen: please link the PR in this story's `pr` frontmatter field once opened.
