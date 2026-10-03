---
id: ST-08
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Storybook playground showcases the template, an override, and an extension

## Functional
### User story
As a docs or Storybook reader evaluating whether this library fits an Element Plus app, I want to see the Element Plus template working for plain fields, arrays, choices, and a wizard, with one overridden slot and one extended field type, so that I can judge the template and copy the wrapper pattern.

As the maintainer, I want the playground to use the final public API with no Tailwind, so that Jeroen can review the working result before the package is published.

### Acceptance criteria

Verification is mostly manual (Storybook is not part of the test workspace); the automated parts are the build and typecheck.

1. **The playground uses the new name everywhere.**
   Given `playgrounds/storybook/components/ElementPlusDynamicFormImplementation.vue` and `playgrounds/storybook/stories/ElementPlusForm.*`,
   When searched,
   Then there is no reference to `ElementPlusDynamicForm` (component or story title); the implementation wrapper is renamed to match the new component (for example `ElementPlusFormTemplateImplementation.vue`) and all importers are updated.

2. **The wrapper uses the documented forwarding pattern.**
   Given the implementation wrapper,
   When read,
   Then it forwards `#input="s"` (`<slot v-bind="s" />`) and `#attributes="s"` (`<slot name="attributes" v-bind="s" />`) to `ElementPlusFormTemplate`, and it no longer uses the blanket `v-for="(_, name) in $slots"` forward that erased the Element Plus chrome.

3. **The broken slot-prop destructuring is fixed.**
   Given the `#default` override in the wrapper,
   When read,
   Then it destructures `fieldMetadata` (not the non-existent `field`) and `required`, renders the field through the wrapper's own `<slot v-bind="s" />` (not `<slot name="input" />`), and shows the field's label.

4. **No Tailwind in the playground example.**
   Given `ElementPlusForm.vue` and the implementation wrapper,
   When scanned for Tailwind utility classes (flex, gap-, my-, mb-, text-lg, font-, etc.),
   Then none remain in the Element Plus example; any spacing uses scoped CSS or Element Plus components. Other playground stories are not touched.

5. **The playground imports the package stylesheet.**
   Given the Storybook setup (`.storybook/preview.ts` or the Element Plus story),
   When read,
   Then it imports the package stylesheet via the exported path `@bach.software/vue-dynamic-form-element-plus/style.css`, as a real consumer would, alongside the Element Plus stylesheet, and the story renders styled.

6. **One overridden slot is demonstrated.**
   Given the Element Plus story,
   When opened,
   Then at least one built-in slot (for example `date-input` or the `default` wrapper) is visibly overridden by the wrapper while every other field keeps its built-in Element Plus rendering, with a short on-page note describing what is overridden.

   > PROPOSED (adversarial review): drop "or the `default` wrapper" from the example and require a narrow per-type slot such as `#date-input`. The core dispatcher renders every leaf type without a dedicated `<type>` slot (13 of 17) through the shared `default` wrapper, so overriding `#default` strips Element Plus chrome from all of them at once, which contradicts this criterion's own "every other field keeps its built-in Element Plus rendering." See adversarial finding 1.

7. **One extended field type is demonstrated.**
   Given the wrapper and story,
   When opened,
   Then a field type that is not in the built-in catalogue (for example `richText` or `tags`) is added with `extendMetadata`, typed in slot scope, rendered through a consumer slot (`<type>-input`), and used in the example metadata; the wrapper passes the extended configuration as `metadataConfiguration`. `vue-tsc` accepts the extension with typed slot scope. The extension does not use the reserved names `input` or `attributes`.

8. **Structural shapes are shown.**
   Given the stories,
   When opened,
   Then there is an example (one story or one section each) for a plain form, a repeatable field, a choice in automatic and explicit selection modes (including a repeatable choice), and a wizard, each rendering through the built-in fallbacks and usable end to end (add/remove, select branch, step through and submit).

   > PROPOSED (adversarial review): "submit" is a story deliverable, not only a verification step, because the engine supplies no submit path (`DynamicForm` renders no `<form>` and no submit handler). Each form example must wrap `DynamicForm` in a `<form @submit.prevent>` wired to `handleSubmit` from its own `useDynamicForm()` and show a visible outcome (a "Submitted" state plus the JSON, and the errors on a failed submit), exactly as QA-plan F5 specifies. See adversarial finding 2.

9. **Screenshots are captured.**
   Given the working stories,
   When the story is verified,
   Then Playwright screenshots (per the repository's "Before Every Push" workflow; launch with `args: ['--no-proxy-server']` for localhost) of the plain form, array, choice, and wizard stories are taken and referenced in the verification report. This is a manual step.

10. **Build and typecheck stay green.**
    Given the Storybook project,
    When its typecheck/build runs (and `pnpm run ci:test`, `ci:lint`, `ci:typecheck` for `packages/element-plus`),
    Then all pass, and the playground consumes the built or source package the same way it did before.

11. **Code hygiene.**
    Given all changed files,
    When reviewed,
    Then no comment or story/test name references specs or process artifacts (FEAT, ST, AC, ADR, finding numbers), there are no em dashes, and Vue identifiers and props are camelCase (slot names follow the core dispatcher spellings such as `date-input`).

### Edge cases
- The existing `ElementPlusForm.stories.ts` story title and file name are changed together with the component (Storybook ids change); nothing else links to the old id.
- If a consumer mounts the wrapper with no overrides, the result is identical to using the bare template.

### Out of scope
- Any docs-site (VitePress) page; the feature explicitly excludes docs-site work.
- `docs/.vitepress/theme/components/AdvancedFormTemplate.vue` and other templates.
- New built-in field types; changes to package logic (defects found here become new stories or follow-up amendments, not silent fixes in this story).
- The package stays `private: true`; the playground is not published; no changeset.

## Design reference
No prototype. The Storybook stories are themselves the visual proof; the Element Plus documentation is the visual reference.

## Architecture reference
Implements seam 4: playground update. Exercises the public surfaces from ST-01 to ST-07 (`ElementPlusFormTemplate`, `elementPlusMetadata`, `extendMetadata`, the `style.css` export, the forwarding contract, array, choice, and wizard fallbacks). Uses the two-line wrapper boilerplate documented in the feature's slot-forwarding section.

Depends on ST-01 to ST-07. The only playground edit allowed earlier is ST-01's minimal rename fix.

## QA plan

### Strategy

The playground sits outside the pnpm workspace (`pnpm-workspace.yaml` excludes `playgrounds`), has no vitest config or tests, and CI skips it. So this story is verified in three layers:

1. **Automated source guard** (new, runs in the existing `packages/element-plus` `ci:test`): one Vitest file that reads the playground sources from disk and asserts the structural criteria (names, forwarding pattern, slot-prop destructuring, no Tailwind, stylesheet import, hygiene). Cheap, deterministic, and it stops the playground drifting back (the bug this story fixes went unnoticed precisely because nothing guarded it).
2. **Compile and build checks**: `ci:test`, `ci:lint`, `ci:typecheck` and `build` for `packages/element-plus`, a `vue-tsc` pass over the playground, and a Storybook static build.
3. **Scripted Playwright walkthrough plus screenshots** (manual, run by the verifier, not committed): loads each story in the built or dev Storybook, drives the interactions end to end, asserts DOM facts, collects console output, and takes the screenshots.

No `*.logic`, `*.validation`, or `*.analytics` tests are planned: the story adds no package logic, does not touch `DynamicFormItem`, `computedProps`, or validation wiring, and the playground is not instrumented for render counts (the `analytics` setting stays off in the examples).

### Findings on the acceptance criteria (proposed rewrites, not silently accepted)

- **F1, AC10 names a playground typecheck that does not exist.** `playgrounds/storybook/package.json` has no `typecheck` script and no `vue-tsc`; `tsconfig.json` exists, and `pnpm -r ci:typecheck` does not include the playground. AC7's "`vue-tsc` accepts the extension with typed slot scope" is therefore unverifiable as written. Proposed rewrite of AC10 and the AC7 sentence: "`vue-tsc --noEmit -p playgrounds/storybook/tsconfig.json`, run with the `vue-tsc` from `packages/element-plus`, reports no errors in `components/ElementPlusFormTemplateImplementation.vue`, `stories/ElementPlusForm.vue` and `stories/ElementPlusForm.stories.ts`; errors that already exist in other playground files are recorded as a baseline and not attributed to this story." See Question Q1 for a permanent script.
- **F2, AC7 "typed slot scope" can pass vacuously.** If the built `.d.ts` loses the slot types (for example they degrade to `any`), `vue-tsc` accepts anything. Proposed addition to AC7: a one-off negative canary during verification. Temporarily assign the `richText` value to a wrongly typed variable and read a non-existent `fieldMetadata` property in the `richText-input` slot; `vue-tsc` must report both errors; then revert. Record the result in the verification report.
- **F3, AC3 and AC6 may land on nothing visible.** The dispatcher resolves leaf inputs to `<type>-input` (then `default-input`), and `ElementPlusFormTemplate` supplies fallbacks for all of those, so a consumer `#default` override only renders for nodes that resolve to plain `default` (non-input parents such as `type: 'group'`; `heading`, `checkbox`, `switch`, `divider` have their own slots). The current story metadata uses only `heading` parents and leaf inputs, so a corrected `#default` override would be dead code nobody sees. Proposed addition to AC3/AC6: the example metadata contains at least one node that actually reaches `#default` (a `group`-typed parent with children), and the verification asserts the override markup appears at least once. The developer confirms the exact routing against `DynamicFormTemplate.typeWithFallback` and notes it in Implementation notes. The unambiguous visible override for AC6 is `#date-input`.

  > PROPOSED (adversarial review): this finding's dispatch premise is wrong and its group-node requirement should be dropped. The engine renders each leaf twice: an OUTER template call with `:type="computedField.type"` (e.g. `text`), whose `#default` content makes an INNER call with `:type="<type>-input"` (`DynamicFormItem.vue` lines 527-578). For the 13 leaf types without a dedicated `<type>` wrapper slot, the OUTER call resolves to `default` (`DynamicFormTemplate.vue` lines 292-345; confirmed against `ElementPlusDynamicForm.vue` lines 91-101 where `#default` is the shared `ElFormItem` chrome). So a corrected `#default` override already renders for the existing `firstName`/`email`/`age` leaf fields; no `group`-typed node is needed to exercise it. The correct reason to use `#date-input` for AC6 is that `#default` is too broad (it overrides the shared chrome for all 13 leaf types, breaking AC6's "every other field keeps its built-in Element Plus rendering"). Verification should assert the `#default` fix on an existing leaf field, and use `#date-input` as the narrow AC6 override. See adversarial finding 1.
- **F4, AC5 "renders styled" and AC6 "visibly overridden" are subjective.** Rewritten as DOM facts: AC5 = the `style.css` request succeeds (HTTP 200 from the dev server or the file is present in the static build) and a package-owned class on the rendered form has a non-default computed style (for example a package class on the heading or switch row has non-zero margin or `display: flex`, read via `getComputedStyle`). AC6 = the overriding markup carries a `data-testid` (name chosen by the developer) present exactly once per date field, the other field types still contain Element Plus's own elements (`.el-input__wrapper`, `.el-select`, ...), and the on-page note names the overridden slot.
- **F5, AC8 "submit" has no submit path in the engine.** `DynamicForm` renders no `<form>` and no submit handler (only the core `TestForm.vue` wires `<form @submit.prevent>` plus `handleSubmit`). The wizard's Submit button (`type="submit"`) therefore does nothing unless the story wraps `DynamicForm` in a `<form>` and shows an outcome. Proposed addition to AC8: each story that has a form provides a `<form @submit.prevent>` using `handleSubmit` from `useDynamicForm`, and shows a visible result (for example "Submitted" plus the JSON) and the validation errors on a failed submit, so "usable end to end" is observable. The existing "Form Data (JSON)" panel reads `values` from a `useDynamicForm()` called in the story component; the verifier confirms it really updates while typing (it only works if `DynamicForm` picks up that form context).
- **F6, AC8 "one story or one section each" makes screenshots brittle.** Recommendation (not an AC change): separate named stories (plain, array, automatic choice, explicit choice, repeatable choice, wizard, override and extension) so each has a stable Storybook id for Playwright. If sections are kept, each section needs a stable `data-testid` wrapper. Either way every example is addressable by `data-testid`.
- **F7, AC4 also has a global side effect to account for.** `.storybook/preview.ts` imports `./input.css` (Tailwind) for every story, so Tailwind's preflight resets apply to the Element Plus example even after its own classes are removed. A story can look right only because of that leak. Verification adds a "Tailwind stripped" pass (remove the Tailwind style tag in the iframe, re-screenshot, compare). `input.css` and other stories stay untouched, per the out-of-scope list.
- **F8, AC9 does not say where screenshots live.** Proposed: they are not committed to the repo; they are attached to the PR (per "Before Every Push") and the verification report lists each file name with one line on what it proves.
- **F9, AC11 "camelCase" is partly mechanical.** The guard test scans for bound props and events in kebab-case (`:metadata-configuration`, `@update:model-value`); slot names (`#date-input`) and `data-*`/`aria-*` attributes are allowed. The rest is review.

### Acceptance criteria to test mapping

Test file for the automated guard (new): `/Users/jeroenbach/Source/dynamic-form.worktrees/dynamic-form-worktree-1/packages/element-plus/src/__tests__/playgroundExample.test.ts` (general `*.test.ts`, in `__tests__/` next to the source per convention; the developer aligns the folder with wherever the package's component tests landed). It reads files with `node:fs` and `fileURLToPath(new URL('../../../../playgrounds/storybook/...', import.meta.url))`. Scanned set: `playgrounds/storybook/components/**`, `stories/ElementPlusForm*`, `.storybook/preview.ts`; never `node_modules` or `storybook-static`.

| AC | Automated (guard test name) | Manual / Playwright |
| --- | --- | --- |
| 1 | `does not reference the removed component name in any playground source`; `has no implementation wrapper under the old file name` | M1: `/index.json` of the running Storybook has no id containing `elementplusdynamicform`, and the renamed story ids exist; repo-wide grep for the old name outside `node_modules`, `storybook-static`, specs |
| 2 | `forwards the input and attributes slots to the template`; `does not blanket-forward every slot` (asserts `#input="s"` with `<slot v-bind="s" />`, `#attributes="s"` with `<slot name="attributes" v-bind="s" />`, and no `v-for` over `$slots`) | M2: built-in chrome is present in the rendered page (`.el-form-item`, `.el-input__wrapper` for text fields): the observable proof the forward no longer erases it |
| 3 | `destructures fieldMetadata and required in the default override`; `renders the forwarded slot instead of the named input slot` (asserts `fieldMetadata` and `required` in the `#default` destructuring, no bare `field` identifier, `<slot v-bind="s" />` present, `<slot name="input"` absent) | M3: per F3, the override markup renders at least once, shows the field label, shows the required marker only for required fields, and still contains the field's input (the input is not lost) |
| 4 | `uses no Tailwind utility classes in the Element Plus example` (extracts every `class="..."` and `:class` string from the two files and fails on the blocklist: `flex`, `grid`, `gap-*`, `space-x-*`, `space-y-*`, `p-*`, `px-*`, `py-*`, `m-*`, `mx-*`, `my-*`, `mb-*`, `mt-*`, `text-(xs|sm|lg|xl|Nxl)`, `font-(bold|semibold|medium)`, `border-*`, `rounded*`, `bg-*`, `overflow-*`, `w-*`, `h-*`); a separate assertion that other stories were not modified is a review step (`git diff --stat` shows only ElementPlus files, the wrapper, and possibly `preview.ts`) | M4: Tailwind-stripped pass (F7) shows a sane layout |
| 5 | `imports the package stylesheet through the exported subpath` (regex on `preview.ts` or the story for `@bach.software/vue-dynamic-form-element-plus/style.css` and `element-plus/dist/index.css`; fails on any `.../dist/style.css` deep path) | M5: requires a built package (`dist/style.css` exists); the request succeeds; computed-style check from F4; no 404 or "failed to resolve import" in the console |
| 6 | none (visual) | M6: override marker count equals the number of date fields, other types keep Element Plus elements, on-page note names the overridden slot, screenshot |
| 7 | `extends the built-in metadata and passes it as metadataConfiguration` (asserts `extendMetadata<` and a `:metadataConfiguration=` binding on the template element, and a `richText-input` style slot on the wrapper); `does not use kebab-case bound props or events` | M7: compile check (F1, F2 canary); reserved names `input` and `attributes` are not used as extended type keys (review); extended field renders the consumer markup, contains no `.el-input` from the default fallback, and its typed value is reflected in the JSON panel |
| 8 | none (behavioural) | M8: scripted walkthrough per shape (see checklist), including add/remove, branch selection in automatic and explicit modes, repeatable choice caps, wizard stepping and submit |
| 9 | none | M9: screenshots of plain, array, choice, wizard taken with `--no-proxy-server`, file names listed in the verification report |
| 10 | (runs in CI as part of the package suite) | M10: commands below |
| 11 | `has no em dashes`, `has no process-artifact references` (regex for `FEAT-`, `ST-\d`, `AC\d`, `ADR`, `finding \d`; the em dash is matched through its unicode escape inside the test so the test source itself stays clean), `does not use kebab-case bound props or events` | M11: review of the diff for short comments that state rationale only |
| Edge: title and file rename | covered by rows 1 and M1 | check nothing else links to the old Storybook id (grep `elementplusform--`; note that any Chromatic baseline keyed to the old id is reset, if Chromatic is used) |
| Edge: wrapper with no overrides equals bare template | none | M12 (recommended): add a bare `:template="ElementPlusFormTemplate"` example of the same metadata next to the wrapper one (it also documents the zero-config path); compare structure (count of `.el-form-item`, `.el-input__wrapper`, label texts), not raw HTML, because Element Plus generates unique ids |

### Fixtures and utilities

- Reuse: the metadata shapes in `packages/core/src/examples/__tests__/TestFormTemplate.testcases.ts` as the reference for what each shape needs (`explicitChoiceTestCase`, `explicitRepeatableChoiceTestCase`, `choiceTestCase`, `arrayTestCase`, `wizardTestCase`). They use `fieldOptions: { label }` and the core template; the Element Plus example uses top-level `label` per `elementPlusMetadata`, so copy the structure, not the property names. The core `TestForm.vue` is the pattern for `<form @submit.prevent>` plus `handleSubmit`.
- Reuse: `playwright` 1.54.2 already in `playgrounds/storybook` devDependencies; Chromium at `/opt/pw-browsers/chromium` in the sandbox (`npx playwright install chromium` locally if missing).
- New (test): the guard test above, with small local helpers (`readPlayground(path)`, `classTokens(source)`).
- New (not committed): a throwaway Playwright script in the scratchpad that performs M1 to M12 and writes screenshots. If Jeroen wants it kept, it needs a `package.json` script per the repository convention (see Q2).
- New (playground): stable `data-testid` hooks on each example wrapper, the override marker, the extension marker, the submit result, and the JSON panel.

### States to assert (feature design skipped; derived from the shapes this story shows)

| Shape | States |
| --- | --- |
| Plain form | pristine; required field empty after blur or failed submit (error text visible); valid; disabled control if the example includes one; JSON panel reflects edits |
| Array | empty at `minOccurs`; add to `maxOccurs` (add control disabled at the cap); remove (not below `minOccurs`); per-item values in JSON |
| Choice, automatic | no branch filled; one branch filled (per the engine's automatic semantics, same observable behaviour as the core Choices story); validation error when the choice is required and empty |
| Choice, explicit | nothing rendered before a branch is chosen; branch chosen; switch branch (previous branch cleared); deselect; branch control disabled when not addable |
| Choice, repeatable | zero occurrences; several occurrences in mixed branches with stable numbering; per-branch cap disables that branch's add; total cap disables all; remove |
| Wizard | first page (Previous hidden or disabled); middle page; last page (Submit instead of Next); Next blocked by an invalid page with errors shown; values survive back and forth; inactive pages mounted but hidden; successful submit shows the result; busy or loading state is not reproducible by hand and is covered by the package's own wizard tests |
| Override / extension | overridden field once per date field; other fields built-in; extended field renders consumer markup and updates the JSON value |

Empty and loading states beyond the above are not part of this slice (no async data in the examples).

### Coverage

The guard test only reads files, so `pnpm -r ci:test:coverage` moves by nothing: it adds no source under `packages/element-plus/src` and the playground is not in any coverage include. The plan knowingly leaves the playground Vue and story code uncovered by Vitest; Playwright and the compile checks are its guard. The developer confirms the coverage run is not lowered by the new test file itself being counted (test files are normally excluded; if the package config includes them, exclude the guard).

### Time sensitivity

No date assertions in the guard test, so `TZ=Europe/Amsterdam` is irrelevant there (the CI script sets it anyway). For the Playwright run, create the browser context with `timezoneId: 'Europe/Amsterdam'` and `locale: 'en-US'`, and give the example a fixed initial date value, so the screenshots and the date-picker checks do not depend on today's date.

### Regression risk

- **Touched:** `playgrounds/storybook/components/` (renamed wrapper), `stories/ElementPlusForm.vue` and `.stories.ts`, and possibly `.storybook/preview.ts` (stylesheet import). No package source changes.
- **Other stories of this feature:** ST-01 to ST-07 are consumed, not changed. A defect found here (for example the `#default` routing in F3, a choice or wizard fallback rendering wrongly) is recorded as a follow-up or amendment, never fixed silently in this story. The package guards that already exist are the component tests from ST-01 to ST-07 and the ST-04 source scan; if the playground reveals a gap they did not catch, add a package test in a follow-up story.
- **Other playground stories:** all `Forms/TestCases/*` stories use Tailwind and the core example template. If the stylesheet import goes into `preview.ts`, it applies to them; the package CSS is scoped, so the risk is low, but smoke-check one (for example `Forms/TestCases/Wizard`) renders unchanged. Prefer the story-local import when equally acceptable, to avoid the question.
- **Build coupling:** the playground links `@bach.software/vue-dynamic-form-element-plus` with `link:`, whose `exports` point at `dist`. Nothing resolves (not the component, not `style.css`, not the types) until core and the element-plus package are built. Every verification run starts with `pnpm build`. `pnpm dev` runs `build:watch`, which also re-emits `dist/style.css`.
- **Storybook ids change** with the rename: bookmarks and any external link to the old id break (no known links, per the edge case).

### Verification procedure

Prerequisites: `ls node_modules | head` and `ls playgrounds/storybook/node_modules | head` are non-empty (else `pnpm install`); `pnpm build` succeeds; Chromium available.

Automated and compile checks (M10):
1. `cd packages/element-plus && pnpm run ci:test && pnpm run ci:lint && pnpm run ci:typecheck` all pass (TZ is set by the script).
2. `pnpm -r ci:test:coverage`: statement, branch, function coverage not below baseline.
3. `pnpm --filter ./packages/element-plus run build` emits `dist/style.css` and the declaration files.
4. Playground `vue-tsc` (F1): `cd playgrounds/storybook && ../../packages/element-plus/node_modules/.bin/vue-tsc --noEmit -p tsconfig.json`. First run it on the tree before this story's changes to record the baseline, then after; new errors in this story's files fail the story.
5. Canary (F2): introduce the two deliberate type errors in the `richText-input` slot, confirm `vue-tsc` reports both, revert, confirm clean.
6. `pnpm --prefix playgrounds/storybook build-storybook` succeeds (Vite bundling proves the `style.css` subpath and all imports resolve; it does not type-check, hence step 4). Use `build-storybook`, not the `build` script (its `-c ./.output/` points the config dir at the output folder). Do not commit `storybook-static`.
7. ESLint on the changed playground files from the repo config (`npx eslint <files>` from `packages/element-plus`, or the root config if it covers them); note in the report if the config does not apply to `playgrounds`. Unused destructured `required` must not be left behind (use it for the marker).

Playwright walkthrough (M1 to M9, M12), launched with `args: ['--no-proxy-server']`, viewport 1280x900, `animations: 'disabled'` for screenshots. Register `page.on('console')` and `page.on('pageerror')` for every story and fail on any `[Vue warn]` (duplicate or missing slot warnings are the likely regressions), `Failed to resolve import`, or uncaught error.

1. **Index**: fetch `/index.json`; old ids absent, new ids present (M1).
2. **Plain form**: labels and required markers present; type an invalid value or leave a required field and blur: error text shows; correct it: error clears; JSON panel shows the values; submit shows the result.
3. **Array**: add until the cap (add disabled), remove until the minimum, edit values in items, JSON reflects indices.
4. **Choice, automatic**: behaves per the engine's automatic mode; required and empty shows the choice error on submit.
5. **Choice, explicit**: nothing before a pick; pick A, fill, switch to B (A cleared), deselect, re-pick.
6. **Choice, repeatable (explicit)**: add mixed occurrences up to the total cap, check the counter numbers, per-branch cap disables that add button, remove an occurrence, numbering stays consistent.
7. **Wizard**: step indicator shows all pages with page 1 active; Next on an invalid page stays on page 1 and shows errors; fill and Next moves to page 2; Previous returns and keeps page 1 values; non-current pages are in the DOM with `display: none` (`toBeHidden` plus `count > 0`); backward jump works; forward jump is blocked unless the example's `wizardConfig` allows it; on the last page Submit replaces Next; submit with all pages valid shows the result and JSON.
8. **Override and extension**: M6 and M7 DOM assertions, including that the extended field does not contain the default `ElInput`.
9. **Styling (M5)**: the `style.css` request is 200 (dev server) or the asset is linked (static build); computed-style check from F4.
10. **Tailwind stripped (M4)**: in the iframe, remove the `<style>` tags produced by `input.css`, take a screenshot of the plain and wizard stories, and confirm the layout is still readable (no overlapping or collapsed spacing introduced by missing utilities).
11. **Bare versus wrapper (M12)** if the bare example is added.
12. **Regression smoke**: open `Forms/TestCases/Wizard` and one other core story, confirm they render and have no new console errors.
13. **Screenshots (M9)**: `plain`, `array`, `choice` (explicit, with a branch selected, plus the repeatable one if space allows), `wizard` (page 2 of 3 with the indicator visible), and optionally `override-and-extension`; attach to the PR and list names in the verification report.

### Manual-only items (no automation possible or worthwhile)

- Visual judgement that the screenshots look like Element Plus and not like unstyled HTML (Jeroen's review; the verifier supplies the evidence).
- The on-page note's wording is accurate and short.
- Reading the wrapper as a copyable pattern: two forward lines, one override, one extension, nothing else.

### Questions for Jeroen

- **Q1.** Add a permanent `typecheck` script plus a `vue-tsc` devDependency to `playgrounds/storybook/package.json` so F1 is repeatable (`pnpm --prefix playgrounds/storybook typecheck`)? Recommended, small, playground-only. Default in this plan if unanswered: the ad-hoc command from verification step 4, no new script, no `package.json` change.
  > PROPOSED (adversarial review): adopt the default (ad-hoc command, no permanent script). Smallest-scope and matches the current codebase (the playground has no typecheck today and is outside `pnpm -r`); a permanent script is a trivial optional follow-up. Not a call that needs Jeroen.
- **Q2.** Keep the Playwright walkthrough in the repo (for example under `playgrounds/storybook/scripts/` with a `pnpm` script) or leave it throwaway? Default: throwaway, only the screenshots and findings are recorded.
  > PROPOSED (adversarial review): adopt the default (throwaway). No committed walkthrough exists elsewhere in the repo and screenshots are a manual "Before Every Push" step. Not a call that needs Jeroen.
- **Q3.** Is the automated guard test (`playgroundExample.test.ts` in `packages/element-plus`) wanted even though the story says verification is mostly manual? Default: yes, because it makes AC1 to AC5 and AC11 regression-proof for free inside the existing `ci:test`. If declined, the same assertions become grep checks in the verification report.
  > PROPOSED (adversarial review): adopt the default (keep it). The feature already established a source-scan guard (ST-04) and the AC-to-test mapping relies on it. Not a call that needs Jeroen.

## Adversarial review
Reviewed lite (story level) against the approved FEAT-004 design/architecture and the core dispatcher (`packages/core/src/components/DynamicFormTemplate.vue`, `DynamicFormItem.vue`). (Reviewer running as opus.)

1. **SHOULD-FIX — QA-plan finding F3 misreads the core dispatcher; its premise is false and its consequence is inverted.** F3 states the dispatcher "resolves leaf inputs to `<type>-input` (then `default-input`)" so a consumer `#default` override "only renders for nodes that resolve to plain `default` (non-input parents such as `type: 'group'`)". That is not how the engine renders a leaf. `DynamicFormItem.vue` invokes the template **twice** for every leaf: an OUTER call with `:type="computedField.type"` (e.g. `text`, line 529) whose `#default` content then makes an INNER call with `:type="\`${computedField.type}-input\`"` (line 565). For any leaf type with no dedicated `<type>` wrapper slot (text, select, radio, number, date, time, datetime, rate, slider, color, cascader, transfer, upload: 13 of the 17), the OUTER call resolves through `typeWithFallback` to `default` (confirmed in `DynamicFormTemplate.vue` lines 292-345, and in the current `ElementPlusDynamicForm.vue` lines 91-101 where `#default` is the per-field `ElFormItem` chrome wrapping `<slot name="input" />`). So a corrected `#default` override is **not** dead code: it renders for, and replaces the `ElFormItem` chrome of, every one of those 13 leaf types, including the `firstName`/`email`/`age` fields already in the example metadata, so AC3's fix is verifiable on the existing fields. The real hazard is the **opposite** of F3's: because `#default` is the shared field wrapper, using it as AC6's "one overridden slot" strips Element Plus chrome from all 13 leaf types at once, which violates AC6's own clause "every other field keeps its built-in Element Plus rendering." F3's `group`-typed-node requirement is therefore unnecessary, and AC6's example "(for example `date-input` or the `default` wrapper)" is a trap: `#default` is not a safe narrow override. Routed as PROPOSED: corrected F3 note in the QA plan, and a PROPOSED note on AC6 dropping "or the `default` wrapper" and keeping `#date-input` (now for the correct reason: it is narrow).

2. **SHOULD-FIX — AC8 "submit ... end to end" has no engine support and the story must build the submit wiring, which AC8 does not state (QA-plan F5 has the concrete fix).** Confirmed: `DynamicForm.vue` renders neither a `<form>` nor a submit handler (lines 105-112); `useDynamicForm` spreads vee-validate's `useForm`, so `handleSubmit`/`values`/`errors` are available, and `TestForm.vue` (lines 83-134) is the working `<form @submit.prevent>` + `handleSubmit` pattern. F5 already specifies the fix (each form story supplies `<form @submit.prevent>` with `handleSubmit`, shows a visible result plus the failed-submit errors). This is a story deliverable, not only a verification detail, and it lives in F5 rather than in AC8. Routed as PROPOSED: a note on AC8 pointing to F5's wiring requirement. F5's JSON-panel concern is also valid: `DynamicForm` creates no form context of its own, so the panel updates only because the story's own `useDynamicForm()` owns the context the child `DynamicForm` injects.

3. **NIT — QA-plan questions Q1-Q3 are all answerable by the post-approval tie-breaker ladder; none is genuinely Jeroen's.** Q1 (permanent playground `typecheck` script): smallest-scope plus current codebase pattern (the playground has no typecheck today and sits outside `pnpm -r`) points to the plan's default (ad-hoc `vue-tsc` command for this story; a permanent script is a trivial optional follow-up). Q2 (keep the Playwright walkthrough): no committed walkthrough exists elsewhere in the repo and screenshots are a manual "Before Every Push" step, so the default (throwaway) holds. Q3 (keep the guard test): the feature already established a source-scan guard (ST-04) and the AC-to-test mapping relies on it, so the default (keep it) holds. Routed as PROPOSED answers on each question; none blocks approval.

No blocker found. The story is consistent with the approved feature (extendMetadata + generic forward, reserved names, no Tailwind, `style.css` subpath), its dependencies on ST-01 to ST-07 are explicit, and its acceptance criteria are mapped in the QA plan.

## Implementation notes
### What was built
- `playgrounds/storybook/components/ElementPlusFormTemplateImplementation.vue` (renamed from the old wrapper): forwards `#input="s"` and `#attributes="s"`, overrides `#default` (destructures `fieldMetadata`, `required`, `fieldContext`; renders an `ElFormItem` with label, required marker and error around `<slot v-bind="s" />`), overrides `#date-input` (native date input, `data-testid="customDateInput"`), and adds `richText` via `extendMetadata<{ richText: string }, { rows?: number }>()` with a `#richText-input` slot, passed as `:metadataConfiguration`.
- `playgrounds/storybook/stories/ElementPlusForm.vue`: one example component (props: `exampleId`, `title`, `description`, `metadata`, `initialValues`, `bare`, `hideSubmit`) with its own `useDynamicForm()`, a `<form @submit.prevent>` wired to `handleSubmit`, a visible "Submitted" panel plus JSON, a failed-submit error list, a live "Form data (JSON)" panel, scoped CSS only, and the story-local imports of `@bach.software/vue-dynamic-form-element-plus/style.css` and `element-plus/dist/index.css`.
- `playgrounds/storybook/stories/ElementPlusForm.examples.ts` (new): the example metadata. `ElementPlusForm.stories.ts`: title `Forms/ElementPlusFormTemplate` with eight named stories (`Plain`, `Arrays`, `ChoiceAutomatic`, `ChoiceExplicit`, `ChoiceRepeatable`, `Wizard`, `OverrideAndExtension`, `BareComparison`), each with a stable Storybook id.
- `packages/element-plus/src/__tests__/playgroundExample.test.ts` (new): the source guard (16 tests) for the structural criteria and hygiene.
- `eslint.config.js`: `playgrounds/storybook/**/*.vue` added to the existing override that turns off `vue/attribute-hyphenation` and `vue/v-on-event-hyphenation`, so camelCase bound props are not flagged in the playground.

### Deviations and decisions
- AC6 uses `#date-input` as the narrow override (the PROPOSED adversarial note), and the story note names it. AC3 still requires a corrected `#default` override, so it is kept but stays an Element Plus `ElFormItem` (label, required marker, error), which keeps `.el-form-item` and the built-in controls on every leaf field. Routing confirmed against the dispatcher: the corrected `#default` renders for the existing leaf fields (13 types), so no `group` node was added.
- AC8 submit wiring is a story deliverable (PROPOSED adversarial note): each example wraps `DynamicForm` in `<form @submit.prevent>` with `handleSubmit`. The wizard sets `hideSubmit` because its own last-page button is the submit.
- Stylesheet import is story-local (`ElementPlusForm.vue`), not in `.storybook/preview.ts`, so other stories are unaffected (the QA plan's preferred option). `.storybook/input.css` and other stories are untouched.
- Q1 to Q3 took the PROPOSED defaults: no permanent playground `typecheck` script, throwaway Playwright walkthrough, guard test kept.
- The bare comparison (M12) renders the override example's metadata without the wrapper rather than a wrapper with zero overrides, because the wrapper always carries the overrides; the structural comparison is therefore plain-vs-override, not wrapper-vs-bare of identical markup.
- `defineProps<ElementPlusExample>()` imports its type from `ElementPlusForm.examples.ts`; the `template` computed is typed `any` because the playground resolves Vue 3.5.18 types while the linked packages resolve 3.5.35, which makes `DefineComponent` incompatible across the two.
- `specs/components.md` needs no change: no public surface changed (playground only), and no changeset is needed.

### Observations for follow-up (not fixed here)
- Element Plus logs `[el-radio] label act as value is about to be deprecated in version 3.0.0` for the radio field. The package keeps `ElRadio :label` on purpose for the `>=2.0.0` peer floor; no `[Vue warn]` was seen anywhere.
- The slider field in the plain form renders with a collapsed track inside the form item flex layout (the thumb shows, the rail is hairline). This is package CSS, so it is a candidate follow-up story, not a playground fix.
- The only console error is the Storybook static server's missing `favicon.ico` (404).

### Checks run
- `pnpm run ci:test` (core 686 tests, element-plus 477 tests, including the new guard), `pnpm run ci:lint`, `pnpm run ci:typecheck`: all pass. `pnpm -r ci:test:coverage`: core 97.57 / 92.6 / 97.14 and element-plus 100 / 99.17 / 100 (statements / branches / functions), unchanged by this story (the guard only reads files).
- `pnpm build` succeeds and emits `dist/style.css`.
- Playground `vue-tsc --noEmit -p tsconfig.json` (with the package's `vue-tsc`): baseline 21 errors, none in files this story owns beyond the old wrapper and the old story (2 in `ElementPlusForm.vue`, 1 in the old wrapper); after: 18 errors, 0 in `ElementPlusFormTemplateImplementation.vue`, `ElementPlusForm.vue`, `ElementPlusForm.stories.ts`, `ElementPlusForm.examples.ts`. The remaining 18 pre-exist in other playground files.
- Type canary: reading a non-existent `fieldMetadata` property and casting the `richText` value to `number` inside the `#richText-input` slot produced both errors (TS2339, TS2352); reverted, clean again.
- `storybook build` (`build-storybook` into a scratchpad folder, not `storybook-static`) succeeds.
- ESLint on the changed playground files: clean with the root config after the override above.
- Playwright walkthrough against the static build (Chromium, `--no-proxy-server`, 1280x900, `Europe/Amsterdam`, `en-US`), 48 assertions, all green after correcting two wrong assertions in the throwaway script (the per-branch cap is on the total per kind, 3, not on one occurrence): index has no old ids and all 8 new ids; plain (chrome and required markers, live JSON, failed submit errors, valid submit result, `epft-heading` margin 16px so `style.css` applies); arrays (cap 4 with add disabled, remove, min 1 with remove disabled, JSON indices); automatic choice (no add buttons); explicit choice (empty before pick, fill, switching clears); repeatable choice (counter, per-kind cap disables CRM at 3 while API stays enabled, total cap 5 disables both, remove frees); wizard (3 steps, 3 mounted pages with the others hidden, invalid Next blocked with errors, Previous keeps values, Submit replaces Next on the last page, unaccepted terms blocked, valid submit shows the result); override (2 `customDateInput`, 0 `.el-date-editor`, select and title keep Element Plus, 5 `chromeOverride`, `richTextInput` has no `.el-input`, note names `date-input`, extended value and preset date in JSON); bare (no overrides, 2 `.el-date-editor`); core `Forms/TestCases/Wizard` story still renders; no `[Vue warn]` or import errors.
- Screenshots (not committed, in the session scratchpad `shots/`): `plain.png`, `plain-failed.png`, `plain-no-tailwind.png`, `array.png`, `choice-automatic.png`, `choice-explicit.png`, `choice-repeatable.png`, `wizard.png` (page 2 of 3), `wizard-no-tailwind.png`, `override-and-extension.png`. The no-Tailwind pass removed the Tailwind style tags and the layout is unchanged, since the example uses no utility classes.
- Verification command: `pnpm build && pnpm --prefix playgrounds/storybook storybook`, then open `Forms/ElementPlusFormTemplate`.

## Verification report
Verdict: **pass-with-notes**. Independently re-run by qa-verifier; the developer's report was not trusted.

### Test and coverage results
- `pnpm run ci:test`: core 686 passed, element-plus 477 passed (32 files, includes `playgroundExample.test.ts`, 16 tests). `pnpm run ci:lint` and `pnpm run ci:typecheck`: clean.
- `pnpm -r ci:test:coverage`: core 97.57 / 92.61 / 97.14, element-plus 100 / 99.17 / 100 (statements / branches / functions). Unchanged by this story (the guard only reads files).
- `pnpm build` succeeds and emits `packages/element-plus/dist/style.css`.
- Playground `vue-tsc --noEmit -p tsconfig.json` (package's `vue-tsc`): 18 errors, all in pre-existing files (`SimpleForm.vue`, `testCases/*.stories.ts`, `.storybook/vite.config.ts`); 0 in `ElementPlusFormTemplateImplementation.vue`, `ElementPlusForm.vue`, `ElementPlusForm.stories.ts`, `ElementPlusForm.examples.ts`.
- Type canary: reading a non-existent `fieldMetadata.nonExistentProp` and casting the `richText` value to `number` inside `#richText-input` gave TS2339 and TS2352. Wrapper restored byte-identical (same sha1 before and after), clean again.
- ESLint on `playgrounds/storybook/components` and `stories/ElementPlusForm*`: clean.
- `storybook build` (output to scratchpad, not `storybook-static`) succeeds. `docs/` untouched, so `docs:build` not needed.
- Independent Playwright run against the static build (Chromium, `--no-proxy-server`, 1280x900, `Europe/Amsterdam`, `en-US`): 19 scripted assertions plus a second wizard walkthrough, all green after I corrected one wrong selector of my own (`.el-form-item__error`; the wizard error text renders as a plain error line). No `[Vue warn]`, no import errors, no uncaught errors. Only console noise: `favicon.ico` 404 and the Element Plus `el-radio label` deprecation warning (package keeps `:label` for the `>=2.0.0` peer floor).

### Acceptance criteria
| AC | Result | Evidence |
| --- | --- | --- |
| 1 Renamed everywhere | Pass | Wrapper is `ElementPlusFormTemplateImplementation.vue`; grep for `ElementPlusDynamicForm` outside specs/research/node_modules/dist hits only `packages/element-plus/src/__tests__/index.test.ts` (package test, not playground); `/index.json` has 8 `forms-elementplusformtemplate--*` ids and no old id; guard tests `does not reference the removed component name...`, `has no implementation wrapper under the old file name`. |
| 2 Forwarding pattern | Pass | Wrapper has `#input="s"` with `<slot v-bind="s" />` and `#attributes="s"` with `<slot name="attributes" v-bind="s" />`, no `$slots` forward; rendered pages show `.el-form-item`, `.el-input__wrapper`. |
| 3 Slot-prop destructuring | Pass | `#default="{ fieldMetadata, required, fieldContext, ...s }"`, renders `<slot v-bind="s" />`, shows `fieldMetadata.label`; override example renders 5 `chromeOverride` items with labels and `*` required markers on Title and Theme. |
| 4 No Tailwind | Pass | Guard `uses no Tailwind utility classes...`; manual read of wrapper and `ElementPlusForm.vue`: scoped CSS only. `git status` shows no change to `input.css`, `preview.ts` or other stories. |
| 5 Stylesheet import | Pass | `ElementPlusForm.vue` imports `@bach.software/vue-dynamic-form-element-plus/style.css` and `element-plus/dist/index.css`; build resolves it; `.epft-heading` computed margin 16px/16px. |
| 6 One overridden slot | Pass | `#date-input` override: 2 `customDateInput`, 0 `.el-date-editor`; select and other fields keep Element Plus controls; on-page note names `date-input`. `#default` is also overridden, but with an `ElFormItem` so chrome stays Element Plus (AC3 requires it; deviation documented). |
| 7 Extended field type | Pass | `extendMetadata<{ richText: string }, { rows?: number }>()`, `:metadataConfiguration`, `#richText-input`; rendered `richTextInput` has no `.el-input`; typing "hello rich" appears in the JSON panel; preset date `2024-05-17` in JSON; canary above; reserved names not used. |
| 8 Structural shapes | Pass | Eight named stories. Plain: failed submit shows "Submit failed" with errors, valid submit shows "Submitted" plus JSON, live JSON updates. Arrays: Add/Remove present. Automatic choice, explicit choice (Email/Phone buttons, nothing rendered before pick), repeatable choice (Add CRM export / Add API endpoint, Remove) render. Wizard: 3 steps, empty Next blocked with error text, valid Next advances, Previous keeps value, last page shows Previous + Submit, unaccepted terms blocks submit, accepted terms shows the result, 4 page nodes in the DOM. Each example has its own `<form @submit.prevent>` with `handleSubmit`. |
| 9 Screenshots | Pass | My own run, scratchpad `shots/` (not committed): `plain.png`, `plain-failed.png`, `array.png`, `choice-automatic.png`, `choice-explicit.png`, `choice-repeatable.png`, `wizard.png` (page 2), `wizard-invalid.png`, `override.png`. Viewed `wizard-invalid.png` and `override.png`: styled Element Plus, step indicator and error line visible. |
| 10 Build and typecheck | Pass | See results above. |
| 11 Hygiene | Pass | Guard tests for em dashes, process references, kebab-case bound props; I read all changed playground files: short rationale-only comments, camelCase props, slot names `date-input` / `richText-input`. `eslint.config.js` change is limited to turning off hyphenation rules for playground and package `.vue` files. |

Edge cases: story title and file renamed together (no remaining link to the old id). Wrapper-with-no-overrides equivalence is replaced by a plain-vs-override comparison (`bare` renders `ElementPlusFormTemplate` directly); documented deviation, accepted since the wrapper always carries overrides.

### Process compliance
- `specs/components.md` needs no entry for this story (playground only); no `packages/core/src` change, so no changeset required (`git diff HEAD --stat -- packages/core/src` is empty).
- Tests named per convention (`playgroundExample.test.ts`); no spec references in code or test names; no undocumented deviations from the PROPOSED adversarial notes (AC6 narrow `#date-input`, AC8 submit wiring, Q1 to Q3 defaults).
- Story-local stylesheet import keeps other stories untouched; core `Forms/TestCases/Wizard` still renders.

### Notes
- Stray files `packages/element-plus/button` and `packages/element-plus/v-if` (11 bytes each, contents like `M2 submit-`, created today 10:33) are untracked leftovers from a shell redirect. They are not part of this story and do not affect checks, but must be deleted before committing.
- The wizard and plain error text reads `onboarding.company.companyName is required` (the `{field}` placeholder resolves to the path, not the label). This is package/core message behaviour, candidate follow-up, not a playground defect.
- The slider rail renders collapsed in the plain form (package CSS), as the developer observed; candidate follow-up story.
- Label widths in the override example are ragged because the `#default` override's `ElFormItem` has no label width; cosmetic.
- This was the last open story among ST-01 to ST-08; ST-09 and ST-10 remain, so the feature is not yet ready for `done`. Reminder for Jeroen: link the PR in the frontmatter `pr` field.
