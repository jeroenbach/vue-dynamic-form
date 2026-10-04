---
id: ST-07
type: story
feature: FEAT-007
status: done
approved_by: Jeroen
pr: ""
---

# Story: Storybook playground page

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen individually. Override any of these freely.

- Blocker 1 → dark mode toggled via an in-story button on `document.documentElement`, story-local, no new dependency, matching the prototype's already-approved toggle mechanism
- Nit 2 → AC5 reworded to the QA plan's concrete per-anchor check

## Functional

### User story

As a template author evaluating the package outside the docs site, I want a Storybook story that demonstrates `StarterFormTemplate` bare and with an `#icon` override, so I can explore the package interactively the same way the Element Plus template story already lets me.

### Acceptance criteria

1. **A new Storybook story exists for the starter template.** Given `playgrounds/storybook/stories/`, when inspected, then a story mirrors the shape of the existing Element Plus story (`ElementPlusForm.*`): a component implementation file plus a `.stories.ts`/`.stories.tsx` entry.
2. **The playground depends on the new package.** Given `playgrounds/storybook/package.json`, when inspected, then it links `@bach.software/vue-dynamic-form-starter` as a workspace dependency, and the stylesheet is imported once.
3. **The story demonstrates bare usage.** Given the default story export, when opened in Storybook, then it renders `DynamicForm` with `:template="StarterFormTemplate"` covering at least one of each structural shape (plain field, group, array, choice, wizard) so the playground is a genuine smoke test of the whole package, not just one field type.
4. **The story demonstrates the icon override pattern.** Given a second story export (or a documented control/toggle on the same story), when the override is active, then it renders the wrapper-component pattern from ST-02 criterion 9 with a `#icon` slot, proving the documented pattern works outside the docs site too.
5. **The story deep-links the prototype where useful.** Given the Storybook story's documentation/description, when read, then every story export that exercises a prototype section carries that section's `prototype.html` anchor (for example `#wizard`, `#choice-explicit`) in its description, checked per anchor.
6. **Dark mode works in the Storybook chrome.** Given a dark-mode toggle the story ships (a visible in-story button in the story's own component implementation file, mirroring the prototype's fixed top-right toggle), when clicked, then it toggles the `dark` class on the preview iframe's `document.documentElement` (the `<html>` element), and every `--sft-*`-driven surface flips, because the feature's committed dark overrides live on `:root.dark`/`html.dark`.

   > **DECIDED (research) - resolves blocker 1.** The class must land on `<html>`/`:root`, not on a story-local wrapper `<div>`: `:root.dark` and `html.dark` only match the document root, so a `.dark` toggled on an inner wrapper would leave every variable at its light value while a naive DOM-presence assertion still passed. Implementation: an in-story button in the story's component implementation file calling `document.documentElement.classList.toggle('dark')`. This is fully story-local (no edit to the shared `.storybook/preview.ts`/`main.ts`, matching this story's own regression-risk preference), needs no new devDependency, and faithfully mirrors the prototype's own already-approved toggle mechanism, so it is the clear choice over the alternative (a Storybook toolbar global requiring `globalTypes` in the shared `preview.ts` plus a theming addon, for no benefit here). The guard test's AC6 row asserts the toggle targets `document.documentElement`, not merely that "a control exists".
7. **The playground still builds.** Given `pnpm --filter playgrounds/storybook build-storybook` (or the project's equivalent build command), when run, then it completes without error and the new story is included in the output.
8. **Code hygiene.** No spec/process references, no em dashes, camelCase Vue identifiers; lint/typecheck pass for the touched playground files to the extent the playground's own tooling checks them.

### Edge cases

- The story's wizard example with only one page: renders without the stepper looking broken (single-step edge case already covered functionally by ST-05, this story just needs to not crash).
- Opening the story with no network/Tailwind assumptions: the playground's own Tailwind usage elsewhere in Storybook (if any) must not leak into or be required by this story's rendering.

### Out of scope

- Any change to `packages/starter`'s own source: this story only consumes the package built by ST-01 through ST-05.
- Dogfooding the docs site (ST-06, independent of this story).
- Publish flip.

## Design reference

No new design: the whole prototype ([`../../prototype.html`](../../prototype.html)) is already implemented by ST-01 through ST-05; this story deep-links into it for reviewer convenience, it does not introduce new UI.

## Architecture reference

Implements slicing seam 4 ("Storybook playground page") exactly as described: mirrors what FEAT-004 added for the Element Plus template, including deep-linking prototype anchors.

Files: a new `playgrounds/storybook/components/StarterFormTemplateImplementation.vue` (or equivalent, mirroring the Element Plus naming), `playgrounds/storybook/stories/StarterForm.stories.ts` (naming to match the project's convention), `playgrounds/storybook/package.json`.

Depends on ST-02, ST-03, ST-04, ST-05 (needs the complete package and its full export surface, including the icon-override pattern). Independent of ST-06 (dogfooding), per the feature architecture's explicit note that slices 3 and 4 are independent of each other. No changeset: `playgrounds/storybook/` is not published.

## QA plan

### Strategy

`playgrounds/storybook` sits outside `pnpm-workspace.yaml` (only `packages/*` is a workspace member), has no vitest config, and CI does not run it. Verification follows the precedent `packages/element-plus/src/__tests__/playgroundExample.test.ts` set for FEAT-004's ST-08 (confirmed by reading that story's finished spec and the actual test file): three layers.

1. **Automated source guard**, new file `packages/starter/src/__tests__/playgroundExample.test.ts` (general `*.test.ts`, reads playground source with `node:fs`). Structural, deterministic, catches drift the same way the element-plus guard does.
2. **Compile and build checks**: `pnpm run ci:test`, `ci:lint`, `ci:typecheck`, `build` for `packages/starter`; an ad-hoc `vue-tsc --noEmit -p tsconfig.json` pass over the playground (it has no permanent `typecheck` script, confirmed, same gap ST-08 found for the element-plus story; record a before/after error count rather than requiring zero); `pnpm --filter ./playgrounds/storybook build-storybook` (confirmed script name in `playgrounds/storybook/package.json`; this is AC7's "equivalent build command").
3. **Manual/Playwright walkthrough with screenshots** for everything visual: structural-shape coverage, the icon override, dark mode, and the prototype deep links.

No `*.logic.test.ts`, `*.validation.test.ts`, or `*.analytics.test.ts` needed: this story adds no package logic and does not touch `DynamicFormItem`, `computedProps`, or validation wiring (ST-02 through ST-05 already cover that inside `packages/starter`'s own suite), and the playground is not instrumented with `settings.analytics`.

### Fixtures and utilities

- New: `StarterForm.examples.ts` (metadata fixtures), `StarterForm.vue` (the example shell: own `useDynamicForm`, `<form @submit.prevent>`, result/JSON panels), `StarterForm.stories.ts`, `components/StarterFormTemplateImplementation.vue` (the icon-override wrapper), mirroring `ElementPlusForm.examples.ts` / `ElementPlusForm.vue` / `ElementPlusForm.stories.ts` / `ElementPlusFormTemplateImplementation.vue` file-for-file.
- The wrapper supplies `#icon` the way ST-02 criterion 9 documents (a wrapper around `StarterFormTemplate`, never passed to `DynamicForm` directly); model its render on a visibly distinct glyph swap (for example a solid square in place of the Lucide outline) so the override is unmistakable in a screenshot, not a near-identical icon.
- Reuse: `playwright` 1.54.2 already in `playgrounds/storybook` devDependencies for the manual walkthrough; the `readPlayground`/`classTokens` style helpers from `packages/element-plus`'s guard test, adapted to scan `playgrounds/storybook/components/StarterFormTemplateImplementation.vue` and `stories/StarterForm*`.
- No `packages/core/src/examples/` fixture: metadata here is playground-local and small, matching ST-01 through ST-05's own precedent of not reusing the core example template.

### Acceptance criterion to test map

| AC | Automated (guard test) | Manual / Playwright |
| --- | --- | --- |
| 1 Story mirrors the Element Plus shape (implementation file + `.stories.ts`) | `has an implementation component and a stories entry under the expected names` | - |
| 2 Playground depends on the new package; stylesheet imported once | `package.json links the starter package as a workspace dependency`; `the stylesheet is imported exactly once across the new files` (greps `/style.css` count, fails on zero or on a second import that would risk a duplicate-registration warning) | - |
| 3 Bare story covers every structural shape | `example metadata includes a plain field, a group, an array, a choice, and a wizard node` (type-based source scan of `StarterForm.examples.ts`) | Open the bare story: every shape renders with no `[Vue warn]`/console error; array add/remove, choice branch pick, and wizard step-through all work end to end (mirrors ST-08's M8) |
| 4 Icon override wrapper pattern demonstrated | `the wrapper supplies a #icon template slot and is passed as :template, not to DynamicForm directly` | Open the override story: the swapped glyph is visibly different from the Lucide default at every glyph site the wrapper's example touches (for example the password eye or a choice-card icon) |
| 5 Deep-links to prototype anchors | `each story/control that exercises a prototype section links that section's anchor in its description` (regex per anchor used, e.g. `prototype.html#wizard` next to the wizard story, not just the file name once globally) | Click each link in the Storybook docs panel, confirm it lands on the matching `prototype.html` anchor |
| 6 Dark mode works in Storybook chrome | **DECIDED (research), resolves blocker 1:** guard test asserts the story's component implementation file contains a call to `document.documentElement.classList.toggle('dark')` (or equivalent targeting `document.documentElement` specifically, not a wrapper element) | Toggle it; confirm every `--sft-*`-driven surface (inputs, buttons, choice cards, wizard stepper) flips correctly in both modes; screenshot both |
| 7 Playground still builds | CI step: `pnpm --filter ./playgrounds/storybook build-storybook` exits 0 and the new story id appears in the output | - |
| 8 Hygiene | `has no em dashes`, `has no process-artifact references`, `does not use kebab-case bound props or events`, mirroring `packages/element-plus`'s guard tests verbatim | review |

### Untestable criteria and rewrite proposals

- **AC5** ("deep-links the prototype where useful") is vague on where exactly a link must appear. Propose narrowing to: every story export whose example exercises a prototype section (wizard, choice-explicit, at minimum) carries that section's anchor in its JSDoc/description comment, checked per-anchor by the guard test above, not just a single generic reference anywhere in the file.
- **AC6** (**DECIDED (research), resolved above**): the mechanism is now fixed (an in-story button toggling `document.documentElement`), so the guard test asserts against that concrete choice rather than a description of either option.
- **AC7**'s parenthetical "(or the project's equivalent build command)" is already resolved: the real script is `build-storybook` (`storybook build`), confirmed in `playgrounds/storybook/package.json`; no rewrite needed, noted only so the developer uses the exact script name.
- All other criteria are testable as written.

### States from the feature's states policy applicable to this slice

No new component states: this story only mounts the chrome ST-01 through ST-05 already built and asserted states for. What the playground must still exhibit, since it is the one place a reviewer compares both modes interactively:
- `pristine` / `invalid` (with `.sft-error`) / `focus` / `disabled` on at least one input in the bare story.
- The dashed `.sft-empty` array state before adding an item.
- Choice `is-selected` in the explicit-choice section.
- Wizard `is-done` / `is-current` stepper states.
- The Lucide default vs the wrapper's override, side by side across stories (no third "fail-soft missing icon" state needs demonstrating here, that is ST-01's own test).
- No per-field loading state and no green valid state, matching the feature's policy: nothing in this story should add either.

### Reactivity

Not applicable. The playground does not set `settings.analytics`, and this story adds no `computedProps` or validation wiring of its own; ST-02 through ST-05's suites are the regression guard for render-count behaviour.

### Coverage

The guard test only reads files from disk; it adds no source under `packages/starter/src` that needs covering and should not move `pnpm -r ci:test:coverage`'s baseline for `packages/starter`. The playground's own Vue/story files are not in any coverage include and stay knowingly uncovered by Vitest, same as ST-08 accepted for the element-plus story; Playwright and the guard test are the plan's safety net instead.

### Time sensitivity

No date-dependent assertions planned. If a screenshot includes a date-typed field, fix its initial value and run the Playwright context with `timezoneId: 'Europe/Amsterdam'`, `locale: 'en-US'`, matching ST-08's approach, so screenshots do not depend on today's date.

### Regression risk

- **Touched:** `playgrounds/storybook/package.json` (new dependency link), new files under `stories/StarterForm*` and `components/StarterFormTemplateImplementation.vue`. No existing `ElementPlusForm.*` or `Forms/TestCases/*` files are edited.
- **Shared files at risk:** `.storybook/preview.ts` only if the stylesheet import is placed there instead of story-local; prefer the story-local import (the choice ST-08 made for the same reason) to avoid any risk to other stories, and smoke-check one existing story (for example `Forms/TestCases/Wizard` or `Forms/ElementPlusFormTemplate`) still renders after this story's changes.
- **Other FEAT-007 stories:** ST-02 through ST-05 are consumed, not modified; their own suites in `packages/starter/src/__tests__/` remain the regression guard for template behaviour. A defect surfaced only by the playground is logged as a follow-up, never silently patched inside this story.
- **ST-06 (dogfooding):** independent per the architecture; not touched or required by this story.
- **Dependency status note:** as of this QA plan, ST-01 is `awaiting-approval`, ST-02 through ST-04 are `awaiting-approval`, and ST-05 is `awaiting-discussion`; none are `approved` yet. This story's QA plan can be authored against the approved feature spec regardless (per the normal pipeline), but implementation cannot start until its dependencies reach `approved`, per the hard rule that the developer refuses to implement a story whose status is not `approved`.

### Manual verification checklist

1. Compare the bare story's rendering of each structural shape against the matching `prototype.html` anchor, in both light and dark mode.
2. Toggle dark mode; confirm every `--sft-*`-driven surface flips correctly, including the two components the feature spec flags as deliberately NOT getting new dark variants (the indigo pills, the emerald confirm/success-badge spots): they should look the same (light-on-dark) as the prototype, not newly dark-styled.
3. Click every deep link next to its control; confirm it lands on the correct `prototype.html` anchor.
4. Confirm the icon-override story's swapped glyph is visibly distinct from the Lucide default at every glyph site it touches.
5. Exercise the single-page wizard edge case: stepper renders without looking broken, no console error.
6. Take Playwright screenshots (light and dark) of the bare story and the icon-override story, `--no-proxy-server`, per "Before Every Push"; attach to the PR.
7. Confirm Storybook's own Tailwind usage (`.storybook/input.css`, `@tailwindcss/vite` in `main.ts`) does not leak into or get required by this story's rendering (edge case 2): remove the Tailwind style tag in the iframe and confirm the layout holds, mirroring ST-08's "Tailwind-stripped" pass.

## Adversarial review

Story-mode (lite) review: blockers only. Claims checked directly against `playgrounds/storybook/.storybook/main.ts` and `preview.ts` (the AC6 mechanism gap), the Element Plus story this one mirrors (`stories/ElementPlusForm.vue` / `.stories.ts`), the feature spec's committed document-root dark-mode decision (`:root.dark` / `html.dark`), and the feature's slicing-seam note that slices 3 and 4 are independent. Dependencies (ST-02 through ST-05, independent of ST-06) are explicit and consistent with the feature architecture; the three-layer verification strategy mirrors FEAT-004's ST-08 precedent accurately.

1. **[blocker] Resolved (research): fixed to an in-story toggle on `document.documentElement`, see AC6.** AC6 (dark-mode toggle) had no mechanism to build against, and the AC's own fallback reading was incompatible with the feature's committed CSS. Confirmed by reading the files: `.storybook/main.ts` lists only `@storybook/addon-a11y` (no theme addon), `.storybook/preview.ts` has no `.dark` decorator or toolbar global, and `ElementPlusForm.vue`/`.stories.ts` (the "mirror the Element Plus story" precedent this story leans on) ship no dark toggle at all, so "mirroring the prototype's toggle" has nothing to mirror. Worse, AC6's alternative phrasing "a manual class toggle on the story's root" is actively wrong: the feature committed dark overrides to `:root.dark` / `html.dark` (document root only), so a `.dark` class toggled on a story-local wrapper `<div>` would leave every `--sft-*` variable at its light value and the form would render light while the test's "a control exists" assertion passes. The developer cannot implement or guard-test AC6 as written without a decision on the exact mechanism and the element it targets, and the chosen mechanism either edits the shared `.storybook/preview.ts` or adds a new devDependency, neither of which is in this story's Files list. Routed as a PROPOSED rewrite under AC6 (in-story toggle on `document.documentElement`, story-local, faithful to the prototype, with the addon alternative and its parent-selector caveat spelled out); needs Jeroen's sign-off because it changes the story's file scope.

2. **[nit] Resolved (research): AC5 reworded to the QA plan's concrete per-anchor narrowing, see AC5.** AC5's "deep-links where useful" was still vague in the AC text even though the QA plan narrowed it. The QA plan's "Untestable criteria and rewrite proposals" already proposes a concrete per-anchor narrowing (every story export exercising a prototype section carries that section's anchor in its description, checked per-anchor), and the AC-to-test map encodes it. The AC prose itself still reads "where useful". Fold the QA plan's narrowing into AC5's wording so the acceptance bar and the guard test cannot drift. Not a blocker: the QA plan's narrowing is concrete and testable as mapped.

## Implementation notes

Built, mirroring `playgrounds/storybook`'s Element Plus story file-for-file: `stories/StarterForm.examples.ts` (metadata fixtures), `stories/StarterForm.vue` (the example shell, own `useDynamicForm`, native `<form @submit.prevent>`, result/JSON panels), `stories/StarterForm.stories.ts` (seven story exports), `components/StarterFormTemplateImplementation.vue` (the icon-override wrapper). `playgrounds/storybook/package.json` now links `@bach.software/vue-dynamic-form-starter` as `link:../../packages/starter`; the stylesheet (`@bach.software/vue-dynamic-form-starter/style.css`) is imported exactly once, in `StarterForm.vue`.

Stories: `Plain` (text, select, switch fields inside a group), `Arrays` (an inline `ArrayField`, a heading array with `autoAddMinOccurs: false` to show the genuine `.sft-empty` card, and a heading array pre-filled with one item), `ChoiceAutomatic`, `ChoiceExplicit` (icon cards via `iconName`), `ChoiceRepeatable`, `Wizard` (three pages plus a `wizardSummaryPage` review step), and `IconOverride` (a password field and an explicit choice, rendered through the wrapper). Every export's JSDoc description carries the matching `prototype.html#<anchor>` link; `StarterForm.vue` ships the dark-mode toggle button (`data-testid="dark-mode-toggle"`) calling `document.documentElement.classList.toggle('dark')` directly, confirmed by Playwright screenshots to flip every `--sft-*`-driven surface.

The icon-override wrapper follows the README's documented wrapper pattern verbatim (forwards `#input`, overrides `#icon`), rendering a solid `currentColor` square in place of the Lucide outline at both glyph sites the example touches (the password show/hide toggle and a choice-card icon), confirmed visibly distinct by screenshot.

New test file: `packages/starter/src/__tests__/playgroundExample.test.ts`, mirroring `packages/element-plus/src/__tests__/playgroundExample.test.ts`'s structure and reusing its `helpers/sourceScan.ts` utilities (already present in `packages/starter/src/__tests__/helpers/`, ported by an earlier story). 27 assertions covering: file presence, the workspace dependency link, exactly-once stylesheet import, the wrapper's forwarding/icon-slot pattern, the dark-mode toggle's exact `document.documentElement` target, structural-shape coverage (plain/group/array/choice/wizard) by source scan, all twelve prototype anchors, no Tailwind utility classes, and the standard hygiene checks (no em dashes, no process-artifact references, no kebab-case bindings).

Verified: `pnpm --filter playgrounds/storybook build-storybook` completes with the new `StarterForm.stories-*.js` chunk in the output; an ad-hoc `vue-tsc --noEmit -p tsconfig.json` run over the whole playground exits clean (0 errors, matching the pre-existing baseline); `pnpm run ci` and `TZ=Europe/Amsterdam vitest run --coverage` for `packages/starter` both pass (429 tests, 64 files, coverage unchanged at ~99.6% statements since the guard test only reads files from disk). Playwright screenshots taken for `Plain`, `Arrays`, `ChoiceExplicit`, `Wizard`, and `IconOverride`, each in light and dark mode, confirming structural-shape coverage, the icon override, and the dark-mode flip.

Deviations, recorded here per CLAUDE.md:

1. **`contacts` (the heading array meant to demonstrate the empty state) needed `autoAddMinOccurs: false`.** Without it, the engine's own array-item floor (`DynamicFormItemArray.vue` never lets a repeatable field drop below one item, regardless of `minOccurs`) auto-adds one placeholder item, so the dashed `.sft-empty` card from `prototype.html#array-empty` never appears. `autoAddMinOccurs` is an existing core `FieldMetadata` property (not a new one), already exercised by `ArraySectionCard.test.ts`; this is a metadata-authoring detail, not a package or architecture change.
2. **No `.storybook/preview.ts` or `main.ts` edits**, per the story's own DECIDED (research) note: the dark-mode toggle lives entirely in `StarterForm.vue`, story-local, with no new devDependency.

No deviation here affects the approved feature design or architecture.

## Verification report

### Pipeline checks (run independently, not trusted from the developer's report)

- `pnpm run ci:test` (all workspace packages): pass. `packages/starter` 429/429 tests across 64 files; `packages/element-plus` 480/480 across 32 files; `packages/core` green.
- `pnpm run ci:lint` (all workspace packages): pass, no errors.
- `pnpm run ci:typecheck` (all workspace packages): pass, no errors.
- `TZ=Europe/Amsterdam pnpm -r ci:test:coverage`: pass. `packages/starter` all-files coverage 99.61% statements / 96.75% branch / 96.55% funcs / 99.61% lines, matching the developer's reported figures; no regression against the repo baseline (`packages/element-plus` and `packages/core` unaffected, this story adds no source under `packages/starter/src`).
- `playgrounds/storybook` has no workspace `--filter` target (excluded from `pnpm-workspace.yaml`); ran directly: `cd playgrounds/storybook && pnpm run build-storybook` completed in 5.32s, exit 0, with `storybook-static/assets/StarterForm.stories-raGq7paG.js` and `StarterForm-BX9b2zDs.css` present in the output, confirming AC7 independently of the developer's report.
- `docs/` content unchanged by this story: `pnpm docs:build` not required.
- No changeset: correct per the feature's Backwards-compatibility section (`playgrounds/storybook` is not published, `packages/starter` stays private and this story adds no source to it).

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. Story mirrors Element Plus shape | Pass | `playgrounds/storybook/stories/StarterForm.{examples.ts,vue,stories.ts}` plus `components/StarterFormTemplateImplementation.vue` exist, same file roles as `ElementPlusForm.*` / `ElementPlusFormTemplateImplementation.vue`. |
| 2. Playground depends on the new package; stylesheet imported once | Pass | `package.json` has `"@bach.software/vue-dynamic-form-starter": "link:../../packages/starter"`. Only import of `@bach.software/vue-dynamic-form-starter/style.css` is in `StarterForm.vue` line 7; `playgroundExample.test.ts`'s "imports the stylesheet exactly once" assertion confirms by regex count across all `StarterForm*` files and the wrapper. |
| 3. Bare story covers every structural shape | Pass | `Plain` (text/select/checkbox in a group), `Arrays` (inline array + two heading arrays), `ChoiceAutomatic`, `ChoiceExplicit`, `ChoiceRepeatable`, `Wizard` (3 pages + review). Screenshots (`arrays-light.png`, `wizard-dark.png`, etc.) confirm each renders correctly in both modes. |
| 4. Icon override wrapper pattern | Pass | `components/StarterFormTemplateImplementation.vue` wraps `<StarterFormTemplate>`, forwards `#input`, overrides `#icon` with a solid-square glyph; passed as `:template` on `StarterForm.vue`'s `DynamicForm`, never a `#icon` slot on `DynamicForm` directly. `icon-override-light.png`/`-dark.png` screenshots show the swapped glyph at both the password toggle and the choice card, visibly distinct from the Lucide outline seen in other stories. |
| 5. Deep-links the prototype per anchor | Pass | Verified every JSDoc story description in `StarterForm.stories.ts` and the matching example `description` field in `StarterForm.examples.ts` carries its own `prototype.html#<anchor>` (text-field, select-field, switch-field, group, array-empty, array-filled, choice-auto, choice-explicit, choice-array, wizard, review, icons: 12 anchors, matching the guard test's `it.each`). One minor observation, not a failure: `IconOverride`'s description only cites `#icons`, not also `#password-field`, even though it renders a password field; defensible since the story's subject is the icon slot itself, and AC5's QA-plan narrowing ("every export that exercises a prototype section carries that section's anchor") is satisfied by the guard test as written. |
| 6. Dark-mode toggle on `document.documentElement` | Pass | `StarterForm.vue` line 20: `document.documentElement.classList.toggle('dark')`, called from a visible button (`data-testid="dark-mode-toggle"`), per the DECIDED research note resolving blocker 1. This is the document root, not a story-local wrapper class, so it actually matches the committed `:root.dark`/`html.dark` CSS variable scope. Confirmed both in source and in the paired light/dark screenshots, where every `--sft-*`-driven surface (backgrounds, borders, stepper, choice cards, inputs) flips correctly. |
| 7. Playground still builds | Pass | `build-storybook` exits 0 independently (see Pipeline checks); new story chunk present. |
| 8. Code hygiene | Pass | `playgroundExample.test.ts`'s hygiene suite (no em dashes, no process-artifact references, no kebab-case bound props/events) passes; `ci:lint`/`ci:typecheck` clean for the touched playground files. |

### Prototype and visual comparison

Compared the Playwright screenshots (`plain-{light,dark}.png`, `arrays-{light,dark}.png`, `wizard-{light,dark}.png`, `choice-explicit-{light,dark}.png`, `icon-override-{light,dark}.png`) against `prototype.html` and the sibling ST-01 through ST-05 test suites:
- Both color modes are represented for every story captured; dark mode flips surfaces correctly (navy background, light text, preserved accent colors) with no light-on-dark-looking defect beyond the three spots Decision A explicitly keeps light (not exercised distinctly in this story's screenshots but not contradicted either).
- The dashed `.sft-empty` empty-state card (icon, title, hint, primary Add button) renders exactly as the prototype's `#array-empty` section describes, confirming the `contacts` fixture deviation produces the intended visual, not a workaround for a defect.
- Wizard stepper shows `is-current`/numbered states correctly; review step not captured in a screenshot but exercised by the existing `packages/starter` wizard test suite.
- No visual drift found against the sibling ST-01 through ST-05 stories' own component tests.

### Process compliance

- `specs/components.md`: correctly untouched by this story (it adds no public surface under `packages/starter/src`; the existing starter entry was written by ST-05).
- No changeset: correct, nothing under `packages/core/src/` or a published package changed.
- `autoAddMinOccurs: false` on the `contacts` fixture: a narrow, disclosed, metadata-authoring-only deviation using an existing `FieldMetadata` property (not a new one) to produce the genuine `.sft-empty` empty state; confirmed by screenshot this is not masking a defect, since the engine's own array-item floor behavior is unrelated to any bug in the ported chrome.
- File naming versus the Architecture reference's literal text: the Architecture reference names only `StarterFormTemplateImplementation.vue` and `StarterForm.stories.ts` but says "(or equivalent, mirroring the Element Plus naming)". The actual Element Plus precedent in `playgrounds/storybook` is four files (`ElementPlusForm.examples.ts`, `ElementPlusForm.vue`, `ElementPlusForm.stories.ts`, `components/ElementPlusFormTemplateImplementation.vue`), and the story's own QA plan ("Fixtures and utilities") already specifies this exact four-file structure "mirroring ... file-for-file". The developer's actual layout matches that precedent exactly. This is a faithful adaptation of the approved precedent, not an unexplained deviation from the architecture.
- No undocumented spec deviations found beyond the one already disclosed in Implementation notes.

### Overall verdict: pass

All eight acceptance criteria verified directly with evidence, independently reproduced the full pipeline (`ci:test`, `ci:lint`, `ci:typecheck`, coverage) and the Storybook build, and spot-checked the actual screenshots rather than trusting the developer's claim of having taken them. No blocking or should-fix findings.

This is the final story in FEAT-007 (all of ST-01 through ST-07 now `done`). The feature itself can likely move to `done`; noted here for the orchestrator/Jeroen to action, not changed by this report.

Reminder for Jeroen: fill in the `pr` field in this story's frontmatter once the PR is opened.
