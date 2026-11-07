---
id: ST-08
type: story
feature: FEAT-011
status: done
approved_by: Jeroen
pr: ""
---

# Story: Document the starter template's accessibility guarantees

## Functional
### User story
As a consumer evaluating or adopting `@bach.software/vue-dynamic-form-starter`, I want the docs and the README to state plainly what accessibility the template guarantees out of the box, the two new retheme tokens, and how to wire up focus-first-invalid for my own non-wizard form, so that I can trust the claim without reading the source.

### Acceptance criteria
1. **`docs/guide/starter-template.md` gains an Accessibility section.**
   Given the guide page,
   When read,
   Then it states, in consumer-facing language, that every control gets label/description/error association, errors and password-strength changes are announced, every control is keyboard-operable (including the password reveal toggle and the choice-card APG pattern), focus moves on wizard navigation and validation failure, and this is unconditional with no opt-out (Open question 4's decision).

2. **The two new retheme tokens are documented in the theming subsection.**
   Given the guide's existing theming subsection,
   When read,
   Then `--sft-focus-visible` and `--sft-focus-visible-choice` are listed alongside the existing `--sft-*` tokens, with their purpose (input/button/stepper focus ring vs. choice-card focus ring). The guide copy itself states `--sft-focus-visible`'s full scope per the feature Design: inputs, selects, buttons, the toggle switch, the stepper, and the password reveal toggle (only choice cards use `--sft-focus-visible-choice`).

3. **`focusFirstInvalid` is documented with a working example.**
   Given the guide,
   When read,
   Then it shows the exported `focusFirstInvalid(containerEl)` helper with a concrete `onInvalidSubmit` wiring example for a non-wizard form (e.g. `handleSubmit(onValid, ({ errors }) => focusFirstInvalid(formRef.value))`), matching Open question 7's decision.

4. **`packages/starter/README.md` mirrors a short Accessibility subsection.**
   Given the README (which ships in the published tarball and has no accessibility mention today),
   When read,
   Then it carries a condensed version of point 1 above, sized appropriately for a README rather than the full guide treatment.

5. **No change to `docs/reference/*`.**
   Given the reference pages document the core (`packages/core`) public surface,
   When reviewed,
   Then none of them is touched by this story, consistent with the feature's Documentation impact ("no core public API changes").

### Edge cases
- The guide's new section must not duplicate `docs/examples/wizard.md`'s wizard-specific focus content (shipped by **ST-04**); it should summarize and link to that example rather than re-explain the wizard sequence diagram.

### Out of scope
- `docs/examples/wizard.md`: shipped by ST-04, since that page describes wizard-specific behavior that story implements.
- `docs/reference/*`: explicitly no change (AC5).
- Any further code change: this story is documentation-only.

## Design reference
Not applicable. This story has no visual surface of its own; it documents behavior already shipped and designed by ST-01 through ST-06.

## Architecture reference
Implements the feature architecture's Slicing seam 7 and the [Documentation impact](../../spec.md#documentation-impact) section's `docs/guide/starter-template.md` and `packages/starter/README.md` entries:

- **`docs/guide/starter-template.md`** — new Accessibility section (guarantees, no opt-out note, theming subsection addition, `focusFirstInvalid` wiring example).
- **`packages/starter/README.md`** — mirrored short Accessibility subsection.
- **`specs/components.md`** — one-line note (per the feature's Public API impact section) on the new `.sft-sr-only` utility, the two focus tokens, `focusFirstInvalid`, and that the starter now manages focus and emits an accessible label/description/error chain; carried in whichever story's implementation notes update it first is fine, but if not already done by an earlier story, this story closes it out since it is the last to land.
- **Public API surface touched:** none (documentation only).
- **Dependencies on other stories:** depends on **ST-01 through ST-07** for accurate, final behavior to describe (the feature's own seam ordering: "Depends on the behavior being final; slices after 1-6"). Practically, ST-07's axe coverage is not itself something this page describes, but implementing last avoids documenting behavior that could still shift.
- **Documentation:** this story's entire scope is the Documentation impact's remaining two pages. `docs/examples/wizard.md` is deliberately not here; see ST-04.

## QA plan

Verified against the live tree: `docs/guide/starter-template.md` has no Accessibility section and no mention of the two new tokens or `focusFirstInvalid` today; `packages/starter/README.md` has no Accessibility subsection either. `packages/starter/src/__tests__/readme.test.ts` already asserts, by plain string containment, that the README carries a fixed list of `##` headings and two specific sentences; it is the only automated test that reaches README prose, and the project has no equivalent automated test for `docs/guide/*` prose (CLAUDE.md scopes `docs/`'s own vitest setup to pure, framework-free `.ts` modules under `docs/.vitepress/theme/components/`, not markdown content). So the guide-page criteria below are manual by project convention, not because they are hard to test; the README criterion is automatable because `readme.test.ts` already exists and follows this exact pattern.

This story changes no `.ts`/`.vue` source in either `packages/starter` or `packages/core`; the only reviewable diffs are two markdown-ish files (one real markdown, one `.md`) and possibly one line in `specs/components.md`.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Guide gains an Accessibility section stating the five guarantees + no opt-out | Manual: read the rendered page (`pnpm docs:dev`) and confirm it states, in consumer-facing language: label/description/error association, error + password-strength announcements, full keyboard operability (naming the password reveal toggle and the choice-card APG pattern explicitly), focus management on wizard navigation and validation failure, and that this is unconditional with no opt-out. Cross-check each claim against the shipped behavior from ST-01 through ST-06 (not just against the feature spec's intent) before sign-off, since this story lands last specifically so the copy can describe final behavior | Manual verification checklist item 1; `pnpm docs:build` (dead-link/anchor check) |
| 2 Theming subsection lists `--sft-focus-visible` and `--sft-focus-visible-choice` with their purpose | Manual: read the existing "Theming with CSS variables" subsection and confirm both tokens appear in the override example or the surrounding prose, each with a one-line purpose (input/button/stepper ring vs. choice-card ring), matching the names from the feature's Design (Contrast corrections) and Architecture (Public API impact) sections exactly (no renamed token) | Manual verification checklist item 2 |
| 3 `focusFirstInvalid(containerEl)` documented with a working `onInvalidSubmit` example | Manual: confirm the guide shows the helper's exact signature and an example matching ST-04's shipped export, e.g. `handleSubmit(onValid, ({ errors }) => focusFirstInvalid(formRef.value))`, for a non-wizard form. Copy the exact snippet into the Storybook playground or a scratch `.vue` file and run it against the real built `@bach.software/vue-dynamic-form-starter` (not just eyeball it) to confirm it type-checks and focuses correctly on a failed submit, the same verification discipline ST-04's own manual checklist used for its wizard example | Manual verification checklist item 3 |
| 4 README mirrors a condensed Accessibility subsection | Extend `readme.test.ts`'s `headings` array with `'## Accessibility'`, and add a new `it` asserting the subsection's key sentence(s) by containment (mirroring the file's existing pattern for "installable dependency" and "#icon"), e.g. asserting the README states keyboard operability and the "no opt-out" guarantee in condensed form. This is a real regression guard: once added, a later edit that drops the heading or rewords the core claim fails `pnpm ci` | `packages/starter/src/__tests__/readme.test.ts` (extend) |
| 5 No change to `docs/reference/*` | Process check, not a runtime test: before marking this story done, run `git status`/`git diff --stat` and confirm no path under `docs/reference/` appears in the story's diff. Record this explicitly in the PR description since there is no automated guard for "a directory was not touched" and none is worth adding for a one-story constraint | Manual verification checklist item 4 |

### Edge cases to tests
- **No duplication of `docs/examples/wizard.md`'s content.** Manual: once ST-04's wizard example page is in place, read both pages side by side and confirm the guide's Accessibility section only summarizes and links to the wizard example (e.g. "see the wizard example for the full step-change sequence") rather than re-describing the sequence diagram or the per-step focus mechanics. This check cannot run until ST-04 is merged; note it in the manual checklist as a final-pass item, not something checkable earlier.
- **Token names and helper signature drift.** If ST-02 or ST-04 rename `--sft-focus-visible-choice` or change `focusFirstInvalid`'s parameter before this story lands, the guide must use the shipped name, not the name in this spec. Verify against the actual shipped source (`style.scss`, `index.ts`) at write time, not against this spec's wording.

### States from the feature's states policy applicable to this slice
Not applicable. This story has no visual surface and renders no component (per its own Design reference); the states policy (focus/error/valid/loading/empty/disabled) describes runtime UI already covered by ST-01 through ST-06's own QA plans. Nothing here needs a states-coverage check.

### Reactivity / analytics
Not applicable. No `DynamicFormItem`, `computedProps`, or validation wiring is touched; no `*.analytics.test.ts` is needed.

### Coverage
No `packages/core/src/` or `packages/starter/src/*.vue`/`*.ts` production file changes. The one extended test (`readme.test.ts`) adds assertions over static file content, not over instrumented source lines, so it has no effect on `pnpm -r ci:test:coverage`'s statement/branch/function percentages either way. Nothing is knowingly left uncovered by this story.

No changeset is added by this story: the only `packages/starter/src/` change is a test-only assertion with zero published-surface impact, and the feature's single changeset (`.changeset/starter-accessibility.md`, minor) already ships with ST-06 and covers the whole feature's user-facing capability, including the docs this story writes.

### Time sensitivity
None. No date/time-dependent content; nothing to run under `TZ=Europe/Amsterdam`.

### Regression risk
- `readme.test.ts`'s `headings` array is an exhaustive, order-independent containment list; appending `'## Accessibility'` is additive and cannot break the existing assertions, but read the full current README before editing so the new subsection's heading level and placement match the file's existing structure (the test only checks containment, not position or order).
- `docs/guide/starter-template.md`'s existing sections ("Theming with CSS variables", "Related") may be the target of inbound anchor links from other guide/example pages (e.g. a future `docs/examples/wizard.md` link to the theming subsection for the two new tokens). Run `pnpm docs:build` after editing to catch any dead anchor VitePress's build-time link checker would flag, and grep the rest of `docs/` for existing links into this page before restructuring headings.
- This story depends on ST-01 through ST-07 for accurate content (per its own Architecture reference), but per the task instruction that is an implementation-order dependency, not a QA-plan blocker: the test map and manual checklist above are written now and apply once those stories have landed. The actual manual sign-off (checklist items 1-4) cannot be performed for real until ST-01 through ST-06 are implemented and ST-04's wizard example exists; this QA plan should be re-walked at that point rather than rubber-stamped from the spec alone.
- The `specs/components.md` one-line note (per the feature's Public API impact / this story's Architecture reference) may already be closed out by an earlier story. Before marking this story done, check `specs/components.md` for the `.sft-sr-only` / focus-token / `focusFirstInvalid` / accessible-chain note; if it is still missing, adding it is in scope for this story as the last to land, and should be verified the same way as any other documentation change (read the rendered file, not just grep for the words).

### Manual verification checklist
1. `pnpm docs:dev`, open `/guide/starter-template`, read the new Accessibility section, and confirm every claim in AC1 is both present and true against the shipped behavior (not just present in prose).
2. On the same page, confirm the theming subsection lists both new tokens with a correct one-line purpose each, matching the Design section's token names exactly.
3. Copy the `focusFirstInvalid`/`onInvalidSubmit` example verbatim into a scratch Vue file or the Storybook playground, run it against a form with a deliberately invalid field, and confirm focus actually lands on the first invalid field on a failed submit.
4. Read `packages/starter/README.md`'s new Accessibility subsection and confirm it is a condensed, accurate version of point 1, sized for a README (a few sentences/bullets, not the full guide treatment), and run `git diff --stat` to confirm no file under `docs/reference/` changed.
5. Read `docs/examples/wizard.md` (once ST-04 has shipped it) side by side with this story's guide section and confirm no duplication, only a summary and a link.
6. `pnpm docs:build` succeeds with no dead-link/anchor warnings touching the edited pages.

### Untestable criteria and rewrite proposals
None. All five acceptance criteria map to a concrete verification: AC4 is a genuine automated unit test (extending `readme.test.ts`'s existing pattern); AC1-3 are manual by project convention (no markdown-content test harness exists for `docs/guide/*`, and adding one for a single docs story would be disproportionate); AC5 is a process check recorded in the PR rather than a runtime test. No acceptance criterion is vague or unverifiable as written.

## Adversarial review

STORY mode (blockers only). Verified against the live tree: `docs/guide/starter-template.md` has no Accessibility section and its theming block (`## Theming with CSS variables`) shows only `--sft-accent`/`--sft-accent-hover`/`--sft-focus-border`/`--sft-focus-ring`, not the two new focus-visible tokens; `packages/starter/README.md` has no Accessibility subsection and its heading set matches the `headings` array asserted by `packages/starter/src/__tests__/readme.test.ts` (confirmed: `## Install`, `## Stylesheet`, `## Bare usage`, `## Overriding a control`, `## Icons`, `## Customization guidance`, plus the two containment sentences). AC-to-test map covers all five ACs and both edge cases; the ST-01..ST-07 dependency and the ST-04 carve-out (`docs/examples/wizard.md`, token/signature drift) are explicit and consistent with the feature's Stories section and Documentation impact. The `focusFirstInvalid(containerEl)` signature and the `handleSubmit(onValid, ({ errors }) => focusFirstInvalid(formRef.value))` example match the feature's Open question 7 decision and Public API impact exactly. No blockers found.

1. **(nit) Changeset applicability is unstated and could be flagged as missing.** This story edits `packages/starter/src/__tests__/readme.test.ts`, which sits under `packages/starter/src/`; a literal reading of CLAUDE.md step 7 ("changeset required when `packages/starter/src/` has changed") could prompt the developer or qa-verifier to add a second changeset, which would fragment the one feature CHANGELOG entry the feature assigns to ST-06. Suggested resolution: state in the story (Coverage or a one-line note) that no changeset is added here because the change is docs-only plus a test-only assertion with zero published-surface impact, and the feature's single changeset rides with ST-06. Does not affect status.

   DECIDED (Jeroen): no changeset in this story; a note to that effect is added to the Coverage section. The feature's single changeset (`.changeset/starter-accessibility.md`, minor) already shipped with ST-06 and covers the docs too; a second one would fragment one CHANGELOG entry.

2. **(nit) AC2's one-line token purpose understates `--sft-focus-visible`'s scope.** AC2 and the QA map describe `--sft-focus-visible` as the "input/button/stepper focus ring", but the feature Design routes it through inputs, selects, buttons, the toggle switch, the stepper, and the password-reveal toggle (only choice cards use `--sft-focus-visible-choice`). This is fine as a terse AC label, but when writing the guide prose the author should state the token's full scope so the docs do not understate it. Suggested resolution: note in AC2 that the guide copy covers the token's full set of controls, not just inputs/buttons/stepper. Does not affect status.

   DECIDED (Jeroen): AC2 now states the token's full control scope (inputs, selects, buttons, toggle switch, stepper, password reveal toggle, per the feature Design's States policy and the shipped `style.scss`) so the guide copy cannot understate it.

## Implementation notes

- Added an "Accessibility" section to `docs/guide/starter-template.md` (after "What you get") covering the four guarantees, the no-opt-out statement, and a `focusFirstInvalid` wiring example for a non-wizard form. Added the two new tokens to the existing "Theming with CSS variables" subsection with `--sft-focus-visible`'s full control scope. Added a "Wizard" entry to the "Related" list linking to the wizard example's new `#focus-management` anchor, per the edge case about not duplicating that page's content.
- Added a condensed "Accessibility" subsection to `packages/starter/README.md` (before "Customization guidance"), linking to the full guide section.
- Extended `packages/starter/src/__tests__/readme.test.ts`: added `'## Accessibility'` to the headings list and a new test asserting the keyboard-operability and no-opt-out phrasing by containment.
- Deviation: the guide/README `focusFirstInvalid` example uses `() => focusFirstInvalid(formRoot.value)` (no `{ errors }` destructuring) rather than AC3's literal `({ errors }) => focusFirstInvalid(formRef.value)` wording, to match the real shipped usage in `docs/.vitepress/theme/components/FormExampleWizard.vue`, per this story's own edge case ("verify against the actual shipped source at write time, not against this spec's wording"). Behavior and signature are identical; only the unused destructured parameter is dropped.
- `specs/components.md` already carries the `.sft-sr-only` / focus-token / `focusFirstInvalid` / accessible-chain note (added by an earlier story in this feature); verified present and accurate, no change needed.
- No changeset added, per the decided finding 1 above.
- `docs/reference/*` untouched, confirmed via `git diff --stat -- docs/reference/` (no output).
- Verification: `pnpm run ci` (per package: `packages/starter`, `packages/core`) and `docs` vitest all green; `pnpm run ci:test:coverage` in `packages/starter` shows no change (99.64% statements, unaffected since no production source changed); `pnpm docs:build` succeeds with no dead-link/anchor warnings.

## Verification report

### Pipeline
- `pnpm run ci:test`: core 37 files / 973 tests pass; starter 81 files / 672 tests pass (including `readme.test.ts`'s 4 tests, the new accessibility ones among them); docs vitest 4 files / 78 tests pass. (Note: the bare `pnpm ci` command is shadowed by pnpm's built-in `ci` installer and silently skips the per-package scripts; used `pnpm run ci:test` / `ci:lint` / `ci:typecheck` instead, per existing project knowledge.)
- `pnpm run ci:lint`: clean, no errors, both packages.
- `pnpm run ci:typecheck`: clean, both packages plus the Storybook playground.
- `pnpm -r ci:test:coverage` (TZ=Europe/Amsterdam): core 98.47%/92.93%/98.37%/98.47% (stmt/branch/func/line), starter 99.64%/94.52%/94.11%/99.64%. Matches the developer's reported starter baseline; no production source in either package changed in this story, so no drop is possible.
- `pnpm docs:build`: succeeds, no dead-link or anchor warnings.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. Guide gains an Accessibility section stating the five guarantees + no opt-out | Pass | `docs/guide/starter-template.md` new "## Accessibility" section states label/description/error association, error + password-strength announcements (announced once on blur, not per keystroke), full keyboard operability naming the password reveal toggle and the choice-card APG pattern explicitly, focus management on wizard navigation and validation failure, and "out of the box... with no setting to turn it off." Cross-checked against shipped source (`focus.ts`, `PasswordStrengthBar.vue`, `ChoiceSectionCard.vue`): claims match actual behavior. |
| 2. Theming subsection lists both new tokens with full `--sft-focus-visible` scope | Pass | New lines in the "Theming with CSS variables" subsection list `--sft-focus-visible` (inputs, selects, every button including the password reveal toggle, the toggle switch, the stepper) and `--sft-focus-visible-choice` (choice cards only), matching the names and scope in `style.scss` and the feature Design exactly. |
| 3. `focusFirstInvalid(containerEl)` documented with a working example | Pass | Guide shows the exact exported signature and a `handleSubmit(onValid, () => focusFirstInvalid(formRoot.value))` example for a non-wizard form. Verified the signature against `packages/starter/src/focus.ts` and the example's shape against the real shipped usage in `docs/.vitepress/theme/components/FormExampleWizard.vue` line 187: identical pattern. |
| 4. README mirrors a condensed Accessibility subsection | Pass | `packages/starter/README.md` gains a one-paragraph "## Accessibility" section before "Customization guidance", linking to the full guide section. `readme.test.ts` extended with `'## Accessibility'` in the headings list and a new test asserting "full keyboard operability" and "with no setting to turn it off" by containment; both strings present and both new/extended tests pass. |
| 5. No change to `docs/reference/*` | Pass | `git diff --stat -- docs/reference/` returns no output. |

Edge case (no duplication of `docs/examples/wizard.md`): the guide's Accessibility section only summarizes ("focus moves ... See [Focus Management](/examples/wizard#focus-management) ... for the full step-change sequence") and links to the existing `#focus-management` anchor in `docs/examples/wizard.md`; it does not re-describe the sequence diagram. Pass.

### Deviation judgment
The developer's recorded deviation (using `() => focusFirstInvalid(formRoot.value)` instead of AC3's literal `({ errors }) => focusFirstInvalid(formRef.value)` wording) is reasonable and correctly resolved: the story's own edge case instructs verifying against the actual shipped source at write time rather than the spec's literal wording, and the chosen example matches the real, working usage already shipped in `FormExampleWizard.vue`. The signature and behavior are identical; only an unused destructured parameter and a variable name differ. Not a deviation that needs Jeroen's attention.

### Process compliance
- `specs/components.md`: accurate, already carries the `.sft-sr-only` / focus-token / `focusFirstInvalid` / accessible-chain note from an earlier story in this feature; confirmed present and correctly describes shipped behavior.
- Changeset: none added by this story, correctly so per the story's own decided finding 1; `.changeset/starter-accessibility.md` (minor) already covers the whole feature including this story's docs.
- Library API: no new exports, no signature changes; documentation-only story as scoped.
- Tests: `readme.test.ts`'s extension follows the file's existing naming and assertion pattern.
- No undocumented spec deviations beyond the judged one above; no silent overrides of feature-level decisions.

### Overall verdict: Pass

No issues found. Status set to `done`.

Feature note: ST-01 through ST-08 are all now `done`. This was FEAT-011's last open story; the feature itself can move to `done` (Jeroen or the final-reviewer sets that).
