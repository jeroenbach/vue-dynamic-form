---
id: ST-03
type: story
feature: FEAT-003
status: approved
approved_by: Jeroen
pr: ""
---

# Story: `useFormWizard` reference page and doc updates

## Functional
### User story
As a docs reader who wants to build my own wizard form on `DynamicForm`, I want a dedicated `docs/reference/use-form-wizard.md` page plus an updated onboarding walkthrough and an updated `useValidatePartialForm` reference page, so that I learn the composable-based pattern instead of the retired hand-rolled `wizardPagePaths`/`registerWizardPagePath`/`loadingResolve` approach.

### Acceptance criteria

1. **A new reference page exists and is linked from navigation (Q5, decided).**
   Given `docs/.vitepress/config.ts`'s `/reference/` sidebar array and `docs/reference/index.md`'s "In this section" table,
   When this story ships,
   Then both list a "useFormWizard" entry linking to `/reference/use-form-wizard`, placed alongside `useValidatePartialForm`'s existing entry, matching the project's one-composable-per-page pattern.

2. **The page documents the full shipped public API, matching the real exports.**
   Given the composable shipped by ST-01 (`useFormWizard(pages, options)` returning `currentStepIndex`, `pages`, `isFirst`, `isLast`, `isValidating`, `next()`, `prev()`, `gotoStep()`, `submit()`, plus `useFormWizardContext()`),
   When the page is read,
   Then every one of those members is documented with its exact type and a one-line description, verified against `packages/core/src/core/useFormWizard.ts` and `packages/core/src/index.ts` directly (not against this story's paraphrase of it), following the format of the existing `use-validate-partial-form.md` page (signature, description, table for structured return values).

3. **A minimal, copy-pasteable wiring example covers both the app-component and template-component sides.**
   Given a reader with no prior context,
   When they read the page,
   Then it includes: (a) an app-component snippet calling `useDynamicForm()` and then `useFormWizard(wizardNode.children, { validateSection, onSubmit })`; (b) a template-component snippet calling `useFormWizardContext()` and reading `currentStepIndex`/calling `next()`/`prev()`; and a cross-link to `docs/examples/advanced.md` as the full worked demonstration.

4. **The navigation default and opt-in are documented (Q2, decided).**
   Given `gotoStep`'s backward-only default,
   When the page is read,
   Then it states that default plainly and names `allowForwardJump`/`validateOnJump` as the opt-in for forward jumping.

5. **The page-path derivation rule and its nested-wizard caveat are documented (ADR-1, ST-01 AC1-4).**
   Given `useFormWizard` only ever receives the wizard node's `children` array, never its ancestors,
   When the page is read,
   Then it states plainly that a page's `path` must match what `DynamicForm` actually registers for that field, and that a wizard nested under a non-empty ancestor path needs each page's `path` set explicitly, since the composable has no way to look up an ancestor prefix it was never given.

6. **The one-wizard-per-provider-subtree constraint is documented (ADR-4, finding 5).**
   Given the single internal injection Symbol `useFormWizard` provides under,
   When the page is read,
   Then it states explicitly that only one `useFormWizard()` call may be active per provider subtree, and that a second call, or a nested `DynamicForm`-with-wizard inside a wizard page, silently injects the wrong (outer) wizard with no runtime error.

7. **`docs/examples/advanced.md` reflects the refactored example, not the retired pattern.**
   Given the current "What It Demonstrates" bullet ("Multi-step `wizard` type with `validatePage` called before advancing") and any other prose referencing the old mechanism,
   When this story ships,
   Then that bullet and any related prose describe `useFormWizard`-driven navigation instead, and no reference to `validatePage`, `wizardPagePaths`, `registerWizardPagePath`, or `createLoadingResolve` remains anywhere on the page.

8. **`docs/reference/use-validate-partial-form.md`'s wizard example no longer teaches the retired pattern.**
   Given the current "Wizard example" section built around `wizardPagePaths`/`registerWizardPagePath`/`LoadingResolve`/`validatePage`,
   When this story ships,
   Then that section is rewritten to either show `validateSection` composed with `useFormWizard`, or trimmed to a short pointer to the new `use-form-wizard.md` page (plus a one-line note that `validateSection` is what `useFormWizard`'s `next()` calls under the hood), and `grep -n "LoadingResolve\|wizardPagePaths\|registerWizardPagePath" docs/reference/use-validate-partial-form.md` returns no matches.

9. **`validateSection` stays documented as usable on its own, not folded into a `useFormWizard`-only story.**
   Given readers who want section-scoped validation without wizard step state,
   When the rewritten page is read,
   Then the page's existing standalone content (the API section, the path-matching table, "How it works") remains intact and is not made to depend on `useFormWizard` for its core explanation; only the "Wizard example" section changes.

10. **No dead links; the docs site builds clean.**
    Given the new page and the cross-links added between it, `advanced.md`, and `use-validate-partial-form.md`,
    When `pnpm docs:build` runs,
    Then it completes with no dead-link error.

### Edge cases
- A reader who lands on `use-validate-partial-form.md` first should be pointed to `use-form-wizard.md` for the recommended wizard-building approach without being told `validateSection` alone is insufficient or deprecated; it remains a real, independently useful building block (AC9).
- The `use-form-wizard.md` page's example must use the same identifier names/casing as the real shipped API (no leftover working names like `FormWizardContext` if ST-01 finalized a different name); verified by grepping the page against `packages/core/src/index.ts`'s actual export list.

### Out of scope
- Any `.vue` or `.ts` source file change (ST-01, ST-02 own those).
- `docs/examples/advanced.md`'s "Full Metadata" / "Conditional Required / Hidden Field" `<<<` includes and other unrelated sections; only the "What It Demonstrates" bullet and any prose naming the retired mechanism are touched.
- `specs/components.md` (ST-01 already owns that update; this story adds no new library export).

## Design reference
None (docs prose/reference pages, no prototype exists for this feature).

## Architecture reference
This story is the second half of Slice B: the documentation pages. Depends on ST-01 (documents its shipped API surface directly) and ST-02 (the onboarding walkthrough must describe the actually-refactored example, and the `LoadingResolve` deletion has already landed there). Docs-only, no changeset, no `specs/components.md` change.

- **New file:** `docs/reference/use-form-wizard.md` (AC1-6).
- **Modified:** `docs/.vitepress/config.ts` (sidebar entry, AC1), `docs/reference/index.md` (table row, AC1), `docs/examples/advanced.md` (AC7), `docs/reference/use-validate-partial-form.md` (AC8-9).
- **Public API surface touched:** none new (documents ST-01's already-shipped surface).
- **Dependencies:** ST-01 (hard), ST-02 (hard: describes and links its shipped result). Following the FEAT-001 ST-04 precedent, if ST-02 has not merged by the time this story is implemented, hold the cross-link/description claims until it has, and re-verify them once it does.

## QA plan

### Test strategy overview

This is a docs-only slice: one new file (`docs/reference/use-form-wizard.md`), two small navigation edits (`docs/.vitepress/config.ts`, `docs/reference/index.md`), and two content rewrites (`docs/examples/advanced.md`, `docs/reference/use-validate-partial-form.md`). No `packages/core/src/` change, no changeset, no vitest convention applies: `docs/` is excluded from `pnpm-workspace.yaml` and has no `*.test.ts`/`vitest.config.*` anywhere (confirmed by the ST-02 precedent, re-confirmed here), so none of `*.test.ts` / `*.logic.test.ts` / `*.validation.test.ts` / `*.analytics.test.ts` apply.

Every acceptance criterion is verified by one of three deterministic methods:
- **Grep-based identifier-absence checks** (AC7, AC8): a retired identifier must return zero matches.
- **Grep-based presence + manual content read** (AC1, AC3, AC4, AC5, AC6, AC9, and the edge cases): grep confirms a required term/link exists, a manual read confirms the surrounding prose actually states the required fact, since a keyword match alone cannot prove a sentence is accurate or a snippet is copy-pasteable.
- **Direct cross-check against the real shipped source** (AC2, and the edge case about identifier casing): the page's documented API surface is read side by side with `packages/core/src/core/useFormWizard.ts` and `packages/core/src/index.ts`, member by member, not against this story's or ST-01's paraphrase of them.
- **`pnpm docs:build`** (AC10): the VitePress site must compile with no dead-link error (VitePress's default dead-link check is active; no `ignoreDeadLinks` override exists in `docs/.vitepress/config.ts`, confirmed).

No new automated test file is added by this story, matching the ST-02 precedent for a `docs/`-only slice.

### Verification-timing note (important, read before running the checks below)

As of this QA plan being written, `packages/core/src/core/useFormWizard.ts` does not exist and `packages/core/src/index.ts` does not yet export `useFormWizard` (confirmed: no such file, no such export). This is expected: ST-01 and ST-02 are both still `awaiting-approval`, and this story has a hard dependency on both, so per the hard-rule that a story only implements once `approved`, ST-03 cannot itself reach implementation before ST-01 and ST-02 have shipped. By the time a developer actually writes `docs/reference/use-form-wizard.md`, the real file and export should exist, and AC2 plus the identifier-casing edge case become directly executable against them, not deferred. This QA plan is written now (before that code exists) per the standard test-planning process, but AC2's verification step is a mandatory implementation-time gate, not a nice-to-have: if `useFormWizard.ts`'s actual shipped shape (member names, types, `gotoStep`'s `void | Promise<void>` return, optionality of `onSubmit`, etc.) differs at all from what ST-01's spec currently states, the page must document the real shipped shape, and this QA plan's AC2 mapping must be re-run against it, not against ST-01's spec text.

### Fixtures / environment

- No `packages/core/src/examples/` fixture or test utility is needed; this story adds no unit test.
- **Doc source of truth for the retired pattern** (AC7/AC8's "before" baseline): the current `docs/examples/advanced.md` "What It Demonstrates" bullet ("Multi-step `wizard` type with `validatePage` called before advancing") and the current `docs/reference/use-validate-partial-form.md` "Wizard example" section (lines 53-108 as read today: `wizardPagePaths`, `registerWizardPagePath`, `validatePage`/`LoadingResolve`, the `computedProps: [registerWizardPagePath]` snippet) are the exact content this story must remove. Both were read in full while preparing this plan; grep patterns below are chosen against these confirmed baselines.
- **Doc source of truth for the "keep intact" content** (AC9): `docs/reference/use-validate-partial-form.md`'s current `## API`, `## Path matching`, and `## How it works` sections (lines 1-51 as read today) are the content that must survive this story's edit unchanged in substance; only the `## Wizard example` section (lines 53-108) is in scope for rewriting.
- **Navigation baseline**: `docs/.vitepress/config.ts`'s `/reference/` sidebar array currently ends its composable-reference entries with `{ text: 'useValidatePartialForm', link: '/reference/use-validate-partial-form' }` (line 57); `docs/reference/index.md`'s table currently ends with the matching `useValidatePartialForm` row (line 13). The new `useFormWizard` entry must sit alongside these, matching their exact naming style (composable name in camelCase, not a kebab-case slug, as the entry text).
- **Run location**: `pnpm docs:dev` (from repo root) for a manual read/render pass; `pnpm docs:build` (from repo root, runs `pnpm --prefix docs build`) for the automated dead-link gate.

### Acceptance criteria → verification mapping

1. **New reference page linked from navigation.**
   - `grep -n "use-form-wizard" docs/.vitepress/config.ts` shows a new sidebar item `{ text: 'useFormWizard', link: '/reference/use-form-wizard' }`, placed adjacent to the `useValidatePartialForm` entry.
   - `grep -n "use-form-wizard" docs/reference/index.md` shows a new table row `| [useFormWizard](/reference/use-form-wizard) | ... |`, placed adjacent to the `useValidatePartialForm` row, same table format (two columns: Page, What it covers).
   - Manual check: entry text is exactly `useFormWizard` (matches the composable's real casing), not `use-form-wizard`, `UseFormWizard`, or any other variant, mirroring how the existing `useValidatePartialForm` entry names itself after the composable, not its file slug.

2. **Full shipped public API documented, matching the real exports (mandatory implementation-time cross-check, see Verification-timing note above).**
   - `grep -n "export function useFormWizard\|export function useFormWizardContext\|export interface FormWizard\|export type FormWizard" packages/core/src/core/useFormWizard.ts` to pull the real signatures.
   - `grep -n "useFormWizard" packages/core/src/index.ts` to confirm the file's exports are actually re-exported (e.g. `export * from '@/core/useFormWizard';`), the same pattern `useDynamicForm`/`useValidatePartialForm` already use (`packages/core/src/index.ts:10-11`).
   - Build a member-by-member table (real source column vs. doc-page column) for every one of: `currentStepIndex`, `pages`, `isFirst`, `isLast`, `isValidating`, `next()`, `prev()`, `gotoStep()`, `submit()`, `useFormWizardContext()`, and the exported supporting types (`FormWizardPage`, `FormWizardOptions`, `FormWizardContext`, or whatever final names ST-01 shipped). Every row must match exactly: type signature, optionality, and a one-line description consistent with the real behavior (not ST-01's spec paraphrase — e.g. if `gotoStep`'s real return type is `void | Promise<void>` per ST-01's Architecture reference, the page must say so, not just `void`).
   - Format check: the page follows `use-validate-partial-form.md`'s established pattern (signature heading, prose description, a table for structured return values), confirmed by a side-by-side structural comparison against that file's `## API` section.

3. **Minimal wiring example, both sides, plus cross-link.**
   - Manual read confirms the page contains: (a) an app-component snippet calling `useDynamicForm()` then `useFormWizard(wizardNode.children, { validateSection, onSubmit })`; (b) a template-component snippet calling `useFormWizardContext()` and reading `currentStepIndex` / calling `next()`/`prev()`.
   - `grep -n "examples/advanced" docs/reference/use-form-wizard.md` confirms a markdown link to the worked example exists.
   - Manual check that both snippets are syntactically valid, self-contained Vue/TS (balanced fenced code blocks, no leftover working names like `FormWizard` where the real export is `FormWizardContext`, matching the real ST-01 export names cross-checked in AC2). `pnpm docs:build` does not execute snippet code, so this step is not covered by the automated build; it is a required manual read.

4. **Navigation default and opt-in documented.**
   - `grep -n "backward" docs/reference/use-form-wizard.md` and `grep -n "allowForwardJump\|validateOnJump" docs/reference/use-form-wizard.md` each return at least one match.
   - Manual read confirms the prose states the backward-only default plainly (not just implied by an example) and names both `allowForwardJump` and `validateOnJump` as the opt-in.

5. **Page-path derivation rule and nested-wizard caveat documented.**
   - `grep -n "path" docs/reference/use-form-wizard.md` as a starting point; manual read confirms the page states plainly that a page's `path` must match what `DynamicForm` actually registers, and that a wizard nested under a non-empty ancestor path needs each page's `path` set explicitly (no implicit ancestor-prefix join, per ST-01 AC4).
   - Cross-check the stated caveat against ST-01's actual shipped derivation logic (once merged) rather than only this story's or the feature spec's prose, since ST-01 is the ground truth for exact behavior.

6. **One-wizard-per-provider-subtree constraint documented.**
   - `grep -in "one wizard\|provider subtree\|per subtree" docs/reference/use-form-wizard.md` returns at least one match.
   - Manual read confirms the stated constraint names the actual failure mode (a second call, or a nested `DynamicForm`-with-wizard inside a wizard page, silently injects the wrong outer wizard with no runtime error), not a vaguer "avoid multiple wizards" caveat.

7. **`docs/examples/advanced.md` reflects the refactored example.**
   - `grep -n "validatePage\|wizardPagePaths\|registerWizardPagePath\|createLoadingResolve" docs/examples/advanced.md` returns zero matches (baseline today: one match, the "What It Demonstrates" bullet's `validatePage` mention).
   - `grep -n "useFormWizard" docs/examples/advanced.md` returns at least one match, confirming the bullet was rewritten to name the new mechanism, not merely stripped of the old one.
   - Manual read of the full page (all sections, since the AC says "any other prose referencing the old mechanism") to catch a stale reference the grep patterns above might miss (e.g. a differently-worded description elsewhere on the page).

8. **`use-validate-partial-form.md`'s wizard example no longer teaches the retired pattern.**
   - Exactly the AC's own named check: `grep -n "LoadingResolve\|wizardPagePaths\|registerWizardPagePath" docs/reference/use-validate-partial-form.md` returns no matches.
   - Manual read confirms the `## Wizard example` section was either (a) rewritten to show `validateSection` composed with `useFormWizard`, or (b) trimmed to a short pointer to `/reference/use-form-wizard` plus a one-line note that `validateSection` is what `useFormWizard`'s `next()` calls under the hood. Either form is acceptable per the AC text; confirm whichever form was chosen actually includes that one-line note, since it is required regardless of which option is picked.

9. **`validateSection` stays documented as standalone (diff-based).**
   - Once implemented, `git diff -- docs/reference/use-validate-partial-form.md` (or an equivalent before/after read against the content captured in Fixtures above) confirms the `## API`, `## Path matching`, and `## How it works` sections are unchanged in substance. A short added pointer sentence near the top or in the intro paragraph (addressing the edge case below) is allowed and is not a violation of "remains intact," since it does not alter the core explanation; a rewrite of any table row, the `validateSection(sectionPath)` signature block, or the "How it works" prose is a violation.
   - Manual read confirms the core explanation is not made to depend on `useFormWizard` (e.g. no "you must use `useFormWizard` for this to work" language attached to the standalone sections).

10. **No dead links; docs build clean.**
    - Run `pnpm docs:build` from the repo root after all five files are in place. Must complete with exit code 0 and no dead-link error in the output. This is VitePress's own default dead-link check (no `ignoreDeadLinks` override exists in `docs/.vitepress/config.ts`, confirmed), so a broken `/reference/use-form-wizard` link, a broken `/examples/advanced` cross-link, or a broken sidebar entry all fail the build directly, no extra tooling needed.
    - Also run `pnpm docs:build` as a smoke check on `main` before the change, to have a known-good baseline exit code to compare against (guards against a pre-existing unrelated dead link being mistaken for one this story introduced).

### Edge cases → verification mapping

- **Reader landing on `use-validate-partial-form.md` first should be pointed to `use-form-wizard.md` without being told `validateSection` is insufficient or deprecated (AC9's edge case).** Not automatable by grep (a keyword match cannot distinguish "see also X" from "you must use X instead"). Manual read of any new pointer sentence added near the top of the page or in the rewritten Wizard example section, specifically checking for words like "insufficient," "deprecated," "not enough," "only," or similar hedging language attached to `validateSection`, and confirming their absence.
- **Identifier names/casing match the real shipped API (mandatory implementation-time cross-check, same timing caveat as AC2).** `grep -n "FormWizardPage\|FormWizardOptions\|FormWizardContext\|useFormWizard\|useFormWizardContext" docs/reference/use-form-wizard.md`, cross-checked term-for-term against `grep -n "FormWizardPage\|FormWizardOptions\|FormWizardContext\|useFormWizard\|useFormWizardContext" packages/core/src/index.ts` (once ST-01 has shipped). Every identifier the page uses in a code snippet or prose must appear verbatim (exact casing, exact spelling) in the real export list; a leftover working name (e.g. `FormWizard` where the shipped type is `FormWizardContext`) is a finding.

### States policy (this slice)

Not applicable. No component, no visual states policy: this story adds prose and code snippets to Markdown pages, not a rendered form component.

### Reactivity / `*.analytics.test.ts` plan

Not applicable. This story touches no `DynamicFormItem`, `computedProps`, or validation wiring, and adds no test file of any kind.

### Coverage

Not applicable to `pnpm -r ci:test:coverage`: this story touches no file under `packages/core/src/` (confirmed: all five touched/new files are under `docs/`). Verify with `git diff --stat -- packages/core/src` returning empty once implemented, and confirm `pnpm -r ci:test:coverage`'s numbers exactly match the ST-01/ST-02-shipped baseline (no drop, no unexpected change), since this story's diff should not move either number.

### Time sensitivity

Not applicable. No date/time-dependent content anywhere in this story's scope.

### Regression risk

- **`docs/.vitepress/config.ts`'s `/reference/` sidebar array and `docs/reference/index.md`'s table** are shared navigation surfaces read by every reference page. Adding one entry to each must not disturb the existing five entries' text or links; verify by confirming a full diff of both files shows only an added line/row, no reordering or edit of an existing entry.
- **`docs/examples/advanced.md`'s other sections** (the `<<<` includes for "Conditional Required / Hidden Field" and "Full Metadata", the "Related Source" links) are explicitly out of scope per this story's own Out of scope section; verify with a diff confirming only the "What It Demonstrates" bullet(s) changed, nothing else on the page.
- **`docs/reference/use-validate-partial-form.md`'s non-Wizard-example sections** are the standalone `validateSection` story other readers rely on (AC9); the diff-based check above is the direct regression guard.
- **Other docs pages linking into either rewritten page**: `docs/reference/dynamic-form.md:52` links to `/reference/use-validate-partial-form` ("See useValidatePartialForm for the full API and a wizard example"); confirm that link still resolves and its surrounding sentence is still accurate after the Wizard example section is rewritten (it should be, since the link target page still exists and still has a wizard-relevant section, just reshaped). `pnpm docs:build`'s dead-link check covers link resolution; the sentence's continued accuracy is a manual read item.
- **This story's own dependency chain**: ST-01 and ST-02 are both `awaiting-approval` as of this plan. If either ships with a detail different from what its own spec currently states (an export name, a default value, a behavior nuance), this story's page must describe the actual shipped reality, not the spec text; the Verification-timing note above and AC2's mandatory cross-check exist specifically to catch that drift before this story reaches `adversarial-review` for real (i.e. after ST-01/ST-02 have merged and this page is actually written against them).

### Manual verification checklist

1. Run `pnpm docs:dev`, navigate to `/reference/use-form-wizard`, confirm the page renders with correct syntax highlighting on every code block, working internal links, and correctly formatted tables, in both light and dark mode (a quick visual check given CLAUDE.md's screenshot guidance for any doc-facing change; a full Playwright before/after pair is not needed since this is a new page with no "before" state to compare against, unlike ST-02's refactor).
2. Confirm the sidebar shows "useFormWizard" in the correct position (alongside "useValidatePartialForm") when navigating the `/reference/` section.
3. Read `/examples/advanced` end to end, confirm the "What It Demonstrates" section and any other prose no longer mentions the retired mechanism and instead accurately describes `useFormWizard`-driven navigation.
4. Read `/reference/use-validate-partial-form` end to end, confirm the standalone sections read naturally on their own and the rewritten Wizard example section (or pointer) reads clearly and includes the required one-line note about `next()` calling `validateSection` under the hood.
5. Run the full set of grep checks (AC1, AC7, AC8, and the identifier-casing edge case) and paste the zero-match / expected-match confirmations into Implementation notes.
6. Run `pnpm docs:build` and confirm a clean exit with no dead-link error; attach the output to Implementation notes.
7. Once a PR exists, check the Cloudflare Pages preview URL and repeat a short pass of checklist items 1-4 there as a final sanity check in a production-like build, per CLAUDE.md step 5.
8. Confirm `git diff --stat -- packages/core/src` returns empty (no accidental scope creep into ST-01's/ST-02's territory).

### Flags for reviewer

- **AC2 and the identifier-casing edge case are not executable today** because `useFormWizard.ts` does not exist yet and is not exported from `packages/core/src/index.ts` (confirmed absent at the time this plan was written). This is expected given the dependency chain (ST-01, ST-02 both `awaiting-approval`) and is not a gap in this plan; flagging so the reviewer does not mistake "not run yet" for "not planned." The plan pins exactly what must be cross-checked once those files exist.
- **AC9's "allowed addition" carve-out** (a short pointer sentence near the top of `use-validate-partial-form.md` is fine, a rewrite of the core sections is not) is this plan's own reading of "remains intact ... is not made to depend on `useFormWizard`"; recommend the reviewer confirm this reading matches intent, since the AC text does not explicitly address whether any addition at all is permitted outside the Wizard example section.
- **AC3's snippet correctness** (valid, copy-pasteable Vue/TS) has no automated gate: `pnpm docs:build` does not execute or type-check fenced code blocks in Markdown. This is a known limitation of the existing reference pages generally (`dynamic-form.md`, `use-validate-partial-form.md` have the same gap), not something introduced by this story; noting it so the manual-read requirement in the AC mapping above is not skipped as "probably covered by the build."

## Adversarial review

STORY mode (blockers only). No blockers found. The story's acceptance criteria are all testable and mapped, it is consistent with the approved feature architecture and with ST-01/ST-02, and its dependencies are explicit. The findings below are nits.

Verified against the actual sources (not findings):

- **Consumer-facing constraints match ST-01/ST-02, no silent override.** AC4 (backward-only `gotoStep` default, `allowForwardJump`/`validateOnJump` opt-in) matches ST-01 AC12/AC13 and feature Q2. AC5 (a page's `path` must match what `DynamicForm` registers; a nested wizard needs each page's `path` set explicitly because the composable never receives the ancestor chain) matches ST-01 AC4 verbatim in substance. AC6 (one-wizard-per-provider-subtree; a second call or a nested `DynamicForm`-with-wizard silently injects the wrong outer wizard with no runtime error) matches ST-01 AC21 and feature ADR-4/finding 5. AC2's documented return surface (`currentStepIndex`, `pages`, `isFirst`, `isLast`, `isValidating`, `next`, `prev`, `gotoStep`, `submit`, plus `useFormWizardContext`) and supporting types (`FormWizardPage`, `FormWizardOptions`, `FormWizardContext`) match ST-01's Architecture reference return type exactly, including the `gotoStep: () => void | Promise<void>` return the QA mapping calls out.
- **The ST-02 `WizardStepGate.vue` resolution is correctly treated as not docs-relevant.** `WizardStepGate.vue` is a docs-internal workaround for `AdvancedFormTemplate.vue` being a shared template (its top-level `<script setup>` cannot call the throwing `useFormWizardContext()` without crashing every non-wizard example). It is not part of the public surface a library consumer building their own wizard needs, so ST-03 rightly omits it. AC3's template-component example (a component that calls `useFormWizardContext()` and reads step state) mirrors `FormWizard.vue`'s pattern (a component mounted only inside a wizard subtree), which is consistent with ST-02, not a contradiction of it.
- **Doc baselines are accurate.** `docs/.vitepress/config.ts:57` and `docs/reference/index.md:13` carry the `useValidatePartialForm` entries the new `useFormWizard` entry sits beside; `docs/reference/use-validate-partial-form.md` currently teaches the full `wizardPagePaths`/`registerWizardPagePath`/`LoadingResolve`/`validatePage` pattern (lines 55-108) that AC8 removes; `docs/examples/advanced.md:7` has the single `validatePage` mention that is AC7's baseline; `docs/reference/dynamic-form.md:52` links the partial-form page as the regression-risk section states.
- **Dependencies are explicit and correct.** ST-03 depends on ST-01 (hard: documents its shipped surface) and ST-02 (hard: describes/links its shipped refactor), both stated in the Architecture reference and the feature Stories table. The Verification-timing note correctly defers AC2's source cross-check and the identifier-casing edge case to implementation time, since `useFormWizard.ts` does not exist until ST-01 ships; this is inherent to the dependency chain, not a plan gap.
- **AC-to-QA mapping is complete.** All ten ACs plus both edge cases map to a grep, a manual read, a source cross-check, or `pnpm docs:build`; the non-automatable parts (snippet copy-pasteability, "not deprecated/insufficient" phrasing) are correctly routed to manual-read items rather than claimed as automated gates.

Findings:

1. **[NIT] AC8 option (b) can leave `dynamic-form.md:52`'s "and a wizard example" phrasing mildly stale, and that file is out of scope.** `docs/reference/dynamic-form.md:52` reads "See useValidatePartialForm for the full API and a wizard example." If the implementer picks AC8's option (b) (trim the Wizard example section down to a pointer to `use-form-wizard.md`), `use-validate-partial-form.md` no longer contains a wizard *example*, only a pointer to one, so that sentence becomes slightly inaccurate, and `dynamic-form.md` is not in ST-03's Modified list. The regression-risk section already flags the link's continued accuracy as a manual item and concludes it "should be" fine. Suggested resolution: prefer AC8 option (a) (keep a short `validateSection`-composed-with-`useFormWizard` example on the page) so the cross-linking sentence stays accurate, or note that option (b) additionally requires touching `dynamic-form.md:52`'s wording. Not blocking: the link still resolves and still leads a reader to a wizard example, and the implementer can avoid the issue entirely by choosing option (a).

2. **[NIT] The `useFormWizardContext()` throws-outside-a-wizard-ancestor usage caveat is only implicitly required.** ST-01 AC19 makes `useFormWizardContext()` throw when no wizard-providing ancestor exists, and that throw is exactly what forced ST-02's `WizardStepGate.vue` workaround. A reader building their own wizard could trip on it (calling the reader in a component that is not guaranteed to render inside a wizard subtree). ST-03 does not name this caveat explicitly, but AC2 ("every member documented ... with a one-line description consistent with the real behavior") already obliges the page to describe `useFormWizardContext()`'s throw behavior, so it is covered. Suggested resolution: when writing the member's one-line description under AC2, state plainly that it throws (and where it is safe to call), rather than only naming its return type. Not blocking.

**Status: awaiting-approval.** No unresolved Open questions (the story has none), no blockers, and the only findings are nits (which never force discussion). Per the mechanical rule this lands in `awaiting-approval`, not `awaiting-discussion`.
