---
id: ST-04
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Portable CSS with a shipped, importable stylesheet

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- CSS build → `cssCodeSplit: false` plus `cssFileName: 'style'` (the existing `true` bypasses `cssFileName`); feature CSS strategy corrected to match
- `sideEffects` guard → accepted glob must match `dist/style.css` at its real path
- Import example → `/style.css` subpath, not `/dist/style.css`


## Functional
### User story
As a library consumer whose app does not run Tailwind, I want the Element Plus template to render correctly after I import `element-plus/dist/index.css` and this package's stylesheet, so that I do not need to add a CSS framework just to get sensible spacing and layout.

### Acceptance criteria

Each criterion is verifiable by a Vitest test, a build/pack check, or a manual step where marked.

**No Tailwind**

1. **No Tailwind utility classes remain in the package.**
   Given `packages/element-plus/src/`,
   When a test or script scans all `.vue` and `.ts` files for the previously used utilities (`flex`, `items-center`, `gap-2`, `my-4`, `text-lg`, `font-semibold`, `mb-2`, `flex-col`) in `class` attributes,
   Then there are no matches, and no Tailwind dependency or config exists in the package. The scan is an automated test (a Vitest test that reads the source files is acceptable) so a regression is caught.

2. **`switch` and `heading` render equivalent layout with plain CSS.**
   Given a `switch` field with a label and a `heading` field with a label and children,
   When each renders,
   Then the `switch` label and control are laid out inline and vertically centered via scoped CSS classes owned by the package, and the `heading` has block spacing and a semibold, larger title, verified by the presence of the package's own class names in the test and by a manual screenshot of both in Storybook (manual step).

3. **Element Plus primitives are preferred.**
   Given any chrome added in this story,
   When reviewed,
   Then it uses Element Plus components where one exists (`ElFormItem`, `ElDivider`) and only adds scoped CSS for what Element Plus has no primitive for (inline label+control row, field spacing, heading typography). `ElSpace`, `ElRow`, and `ElCol` are not used (peer-floor safety).

**Build and export**

4. **The build emits `dist/style.css`.**
   Given `pnpm --filter ./packages/element-plus run build`,
   When it finishes,
   Then `packages/element-plus/dist/style.css` exists and contains the package's scoped component styles (the package ships real CSS now, so this is verified, not assumed), and no file named `vue-dynamic-form-element-plus.css` or `index.css` is emitted, exactly one `.css` file is emitted, and neither the es nor the umd bundle injects styles into JS.

   DECIDED (research): the "no `index.css`, exactly one `.css`, no JS style injection" clause is added because at Vite 7.3.6 the current `cssCodeSplit: true` would emit `index.css` on the es build and inject styles into the umd JS (verified in the Vite source); without this clause the criterion could be met in name only. See Adversarial-review finding 1.

5. **The file name is pinned and CSS is not code-split.**
   Given `packages/element-plus/vite.config.ts`,
   When read,
   Then `build.lib.cssFileName` is `'style'` so the output name does not depend on `fileName` or the package name, AND `build.cssCodeSplit` is not `true` (removed so it reverts to the lib default of `false`, or set to `false`).

   DECIDED (research): the `cssCodeSplit` requirement is added because `cssFileName` is only consulted on the `cssCodeSplit: false` path at Vite 7.3.6; with `cssCodeSplit: true`, `cssFileName: 'style'` is ignored and no `dist/style.css` is produced. See Adversarial-review finding 1.

6. **The stylesheet subpath is exported.**
   Given `packages/element-plus/package.json`,
   When read,
   Then `exports` contains `"./style.css": "./dist/style.css"` next to the existing `"."` entry, and `dist` remains in `files`.

7. **The documented import resolves.**
   Given the built and packed package installed in a scratch consumer (or resolved with Node's `import.meta.resolve`/`require.resolve` against the package),
   When `@bach.software/vue-dynamic-form-element-plus/style.css` is resolved,
   Then it resolves to `dist/style.css`, and the deep path `.../dist/style.css` is (correctly) not resolvable. The check is a manual step or a small script; the developer records the result in Implementation notes.

**Regression**

8. **Existing behaviour is unchanged.**
   Given the component tests from earlier stories,
   When run,
   Then they all still pass unchanged (only class names assertions affected by this story change).

9. **Code hygiene.**
   Given all changed source and test files,
   When reviewed,
   Then no comment or test name references specs or process artifacts (FEAT, ST, AC, ADR, finding numbers), there are no em dashes, class names are the package's own (kebab-case CSS class names in `<style scoped>` are fine; Vue identifiers stay camelCase), and `ci:test`, `ci:lint`, `ci:typecheck`, and `build` pass for `packages/element-plus`.

### Edge cases
- Scoped styles apply to slot fallback content owned by `ElementPlusFormTemplate`; a consumer's overriding slot content is not styled by the package's scoped CSS (expected).
- A consumer that only imports the Element Plus stylesheet (and not `style.css`) still gets a functional, if tighter, layout because Element Plus primitives carry most of the chrome.
- Two-column responsive field grid: the feature architecture lists it as a possible residue. It is only added if an existing or later-story rendering needs it; it is not added speculatively here.

### Out of scope
- Dark mode, CSS custom-property theming, and any theming API.
- The README text documenting the two imports: a later story (the import path is made real here).
- Array, choice, and wizard chrome CSS: those stories add their own scoped styles to the same stylesheet.
- The Storybook playground's own Tailwind classes: playground polish story.
- `packages/core` is untouched; the package stays `private: true`, so no changeset.

## Design reference
No prototype. Visual reference is the Element Plus documentation; layout residue (inline label+control, spacing, heading typography) mirrors the previous Tailwind appearance: `flex items-center gap-2`, `my-4`, `text-lg font-semibold mb-2`.

## Architecture reference
Implements the feature architecture's "CSS strategy" section and ADR-5, including "Make `dist/style.css` real and importable": `build.lib.cssFileName: 'style'` in `vite.config.ts` and the `"./style.css"` entry in `package.json` `exports`.

Depends on ST-02 (the `switch`/`heading` wrappers in their final slot shape). Independent of ST-03, but the two touch the same SFC; land ST-03 first to avoid merge churn. The array, choice, and wizard stories (ST-05 to ST-07) depend on this story because they add scoped CSS into the stylesheet whose build and export are established here.

## QA plan

Scope of the slice: no engine logic, no validation wiring, no `computedProps`. It changes markup classes of the `switch` and `heading` fallbacks, adds scoped styles, and changes build/packaging config. So the plan is mostly static (source scan, config read), one build-output test, a small mount test, and a manual visual check. All files live in `packages/element-plus/src/__tests__/` and follow the suffix conventions; test names state behaviour only (no process references).

### Findings the developer must act on (raised by QA, not reopening any DECIDED point)

1. **`cssFileName: 'style'` alone will not produce `dist/style.css` with the current `vite.config.ts`.** The config sets `build.cssCodeSplit: true` explicitly. Verified in the installed Vite 7.3.6 (`vite:css-post` plugin in `chunks/config.js`): with `cssCodeSplit` true, the es/cjs outputs emit the CSS as an asset named after the entry chunk (`index.css`, `cssFileName` is never consulted), and the umd output injects the CSS into the JS at runtime via a `<style>` element. `cssFileName` is only used when `cssCodeSplit` is false (the lib default). So criteria 4 and 5 are only satisfiable together if `cssCodeSplit` is removed or set to `false`. The feature architecture sentence "with the lib build's `cssCodeSplit`, this compiles to a single stylesheet" rests on the opposite assumption. The build test below is the gate that catches this; the developer records the `cssCodeSplit` change in Implementation notes and flags it for the feature spec (it refines how ADR-5 is realised, it does not change the decision).
2. **`sideEffects` guard.** A bare `import '.../style.css'` is silently dropped by bundlers if `package.json` ever declares `"sideEffects": false`. Today the field is absent. Planned as a cheap assertion (absent, or lists `*.css`), so the later publish story cannot break the stylesheet import unnoticed.
3. **The feature spec's CSS strategy snippet still shows `.../dist/style.css`**, which criterion 7 says must not resolve. Not this story's edit (the README story already uses the exported `/style.css` path), but the feature text should be corrected when it is next amended.
4. **Public-surface inventory.** `./style.css` is a new public entry point of the package. `specs/components.md` (updated in the README/inventory story) should list it; nothing in this story touches that file, so it is called out here so it is not lost.
5. **Storybook cannot prove Tailwind independence.** The playground runs Tailwind v4 (`@tailwindcss/vite`) and only imports `element-plus/dist/index.css` (in `.storybook/preview.ts` and `stories/ElementPlusForm.vue`), never the package stylesheet. The playground is out of scope here, so the manual check in criterion 2 needs a Tailwind-free scratch consumer as the primary evidence (see manual checklist). The playground also consumes the package through `link:` to `dist`, so the package must be rebuilt first or the screenshot shows stale output.

### Acceptance criteria to test mapping

| AC | Test or step | File / location | Type |
| --- | --- | --- | --- |
| 1 | Class-attribute scan for the eight named utilities plus broader utility patterns; no Tailwind dependency or config | `noTailwind.test.ts` | Vitest, static (node `fs`) |
| 2 | Mount `switch` and `heading` fields, assert package class names, DOM structure, scoped attribute; assert the built CSS rules for those classes | `layoutClasses.test.ts`, `stylesheetBuild.test.ts` | Vitest component + build output |
| 2 (visual) | Screenshot of both in a Tailwind-free scratch consumer, then Storybook | manual checklist | Manual |
| 3 | Scan for banned Element Plus layout components; `ElDivider` present for `divider`; `ElFormItem` still wraps inputs; remainder is reviewer judgement | `noTailwind.test.ts` (banned components), `layoutClasses.test.ts` (presence), review | Vitest static + component + review |
| 4 | Programmatic production build into a temp dir; assert `style.css` exists with scoped rules, no package-named css, no `index.css`, no style injection in js | `stylesheetBuild.test.ts`; plus the real `build` script run by the verifier | Vitest (node env) + manual command |
| 5 | Resolved Vite config has `build.lib.cssFileName === 'style'` (and `cssCodeSplit` not true, see finding 1) | `stylesheetBuild.test.ts` | Vitest |
| 6 | Read `package.json`: `exports['./style.css']`, `.` entry unchanged, `files` has `dist`, no deep `./dist/*` export, `sideEffects` guard | `stylesheetExport.test.ts` | Vitest, static |
| 7 | Real Node `exports` resolution inside a simulated `node_modules` tree built from the temp build; deep path throws `ERR_PACKAGE_PATH_NOT_EXPORTED` | `stylesheetBuild.test.ts`; plus tarball and scratch-consumer check in manual checklist | Vitest + manual |
| 8 | Whole package suite unchanged; old-class assertions updated only where needed | full `ci:test` run | Regression |
| 9 | Scan for em dashes and process references in `src`; lint, typecheck, test, build | `sourceHygiene.test.ts` plus the four commands | Vitest static + commands |

No criterion is untestable. Criterion 2's "matches the previous Tailwind appearance" is inherently visual and stays manual; everything else is automated. Criterion 3's "when reviewed" part cannot be fully automated (only the banned components and the presence of the preferred ones can), so it stays a reviewer checklist item.

### Test files and cases

Naming: general suffix `*.test.ts` (nothing here is validation, reactivity, or render-count). Test names below are proposals.

**`noTailwind.test.ts`** (static; `// @vitest-environment node` is not required but reading files via `node:fs` and `import.meta.url` is)
- Walks `packages/element-plus/src` recursively for `.vue` and `.ts` files, excluding its own file. Extracts class tokens from: static `class="..."`, `:class` string and array literals, and `class: '...'` in `.ts` render code. Matching is per token (split on whitespace), never substring, so `flex-col` is not confused with `flex` and package classes such as `field-row` never match.
  - `it('does not use the removed utility classes')` for exactly `flex`, `items-center`, `gap-2`, `my-4`, `text-lg`, `font-semibold`, `mb-2`, `flex-col`.
  - `it('does not use any utility-style class from a known pattern set')`: hardening beyond the listed eight, tokens matching `^(m|p)[xytblr]?-\d`, `^gap(-[xy])?-`, `^text-(xs|sm|base|lg|xl|\dxl)$`, `^font-(medium|semibold|bold)$`, `^(flex|grid|hidden|block|inline-flex|inline-block)$`, `^(items|justify)-`. If the developer names a package class that collides, rename the class, not the pattern.
  - `it('has no apply or tailwind directives in style blocks')`: no `@apply`, `@tailwind`, `@import 'tailwindcss'`.
- Package level:
  - `it('declares no tailwind dependency')`: no key containing `tailwind` in `dependencies`, `devDependencies`, `peerDependencies`.
  - `it('has no tailwind or postcss config file')`: no `tailwind.config.*`, `postcss.config.*` in the package root, and `vite.config.ts` does not reference tailwind.
- Element Plus peer floor:
  - `it('does not use layout components missing from the supported peer range')`: no `ElSpace`, `ElRow`, `ElCol`, `el-space`, `el-row`, `el-col` in `.vue`/`.ts` source (tag or import).
- Self-check: a tiny fixture-string test feeds the extractor a known-bad snippet (`class="flex items-center"`, `:class="['my-4']"`) and expects hits, so the scan cannot rot into a no-op that always passes.

**`layoutClasses.test.ts`** (component; mounts `ElementPlusFormTemplate` through `DynamicForm` with `mount` from `@vue/test-utils`; Element Plus registered via `global.plugins` or per-test component imports, as established by the foundation story's test helper)
- Fixtures: reuse the foundation story's mount helper and its `ElementPlusFormTemplate` bare-usage setup. A new fixture metadata is needed only here: a `switch` with `label`, a `switch` without `label`, a `heading` with `label` and two `text` children, a `divider` with `label`. Keep it local to this file, no shared util needed.
- States asserted for this slice:
  - Filled: `switch` with label renders the package row class on one element that contains both the label text and `.el-switch` (inline relationship), label before control.
  - Empty: `switch` without label renders the row with the control only and no empty label element; `heading` without label keeps current behaviour (no crash; assert whatever the implementation does once, so a later change is deliberate).
  - Heading with children: title element with the package title class inside the package heading block class, children rendered after the title and inside the block.
  - Divider: renders `.el-divider` with the label (Element Plus primitive kept).
  - Disabled: a disabled `switch` still renders in the same row class (layout independent of state).
  - Loading and error states do not exist for these two wrappers; the validation error display belongs to the input wrapper and is covered by the foundation/slot stories. Not retested here.
- Scope attribute checks:
  - `it('marks fallback markup with the package scope id')`: the row, block, and title elements carry a `data-v-*` attribute (proof the scoped styles can apply).
  - `it('does not scope consumer-supplied slot content')`: a wrapper overriding `#switch` with its own element renders it without the package scope id (read the id from the fallback render first). Covers the documented edge case.
- Class hygiene on real DOM:
  - `it('renders only Element Plus and package prefixed classes for the switch and heading')`: every class token in the rendered subtree starts with `el-` or the package prefix. This is the positive twin of the scan and also catches a Tailwind class built dynamically. Requires the developer to give package classes one prefix (proposal: `epft-`; the prefix is the developer's choice, the test reads it from one constant in the test).
- jsdom does not apply SFC style blocks, so computed-style assertions are not possible here. Layout semantics are asserted in `stylesheetBuild.test.ts` against the emitted CSS instead.

**`stylesheetBuild.test.ts`** (first line `// @vitest-environment node`; runs once in `beforeAll` with a 60 s timeout)
- `beforeAll`: Vite `build()` with `configFile` = the package `vite.config.ts`, `mode: 'production'`, `build.outDir` = a fresh `mkdtempSync` dir, `emptyOutDir: true`, `logLevel: 'silent'`. The temp dir keeps the real `dist` untouched and gives a clean slate every run (so a stale `dist/vue-dynamic-form-element-plus.css` cannot hide a regression). Remove it in `afterAll`. Type declarations are not needed, so `vue-tsc` is not part of this build.
- Resolved config (`resolveConfig`):
  - `it('pins the stylesheet file name')`: `build.lib.cssFileName === 'style'`.
  - `it('does not split css per chunk')`: `build.cssCodeSplit` is not `true` (finding 1).
- Output files:
  - `it('emits style.css')`: exists, non-empty.
  - `it('emits no other stylesheet')`: output dir contains exactly one `.css` file, and `vue-dynamic-form-element-plus.css` and `index.css` are absent.
  - `it('keeps styles out of the javascript bundles')`: neither the es nor umd file contains `createElement("style")`/`createElement('style')` nor an `import` of a `.css` file (consumers import the stylesheet explicitly).
- Stylesheet content (regex tolerant of minification and whitespace):
  - `it('scopes the component styles')`: rules carry `[data-v-...]` selectors.
  - `it('lays out the switch row inline and vertically centered')`: the switch row class has `display` of `flex` or `inline-flex` and `align-items: center`, plus a `gap` (or margin) between label and control.
  - `it('gives the heading block spacing and a semibold larger title')`: heading block has vertical `margin`; title class has `font-weight: 600` and a `font-size` declaration larger than the body default (assert the declaration exists and is not `inherit`/`1em`).
  - `it('does not bundle element plus styles')`: no `--el-color-primary:` definition, no `.el-button` rule, and size under a generous ceiling (proposal 20 KB) as a guard against an accidental style import from `element-plus`.
  - `it('has no orphan class selectors')`: every class selector in `style.css` appears in a `.vue` template under `src` (guards against speculative rules such as an unused two-column grid, per the edge case).
- Resolution (criterion 7): copy the temp build output and the package `package.json` into `<tmp>/consumer/node_modules/@bach.software/vue-dynamic-form-element-plus/` and use `createRequire(<tmp>/consumer/index.js)`:
  - `it('resolves the documented stylesheet path to the built file')`: `require.resolve('@bach.software/vue-dynamic-form-element-plus/style.css')` ends with `dist/style.css`.
  - `it('does not resolve the deep dist path')`: `require.resolve('@bach.software/vue-dynamic-form-element-plus/dist/style.css')` throws with `code === 'ERR_PACKAGE_PATH_NOT_EXPORTED'`.
  - `it('still resolves the main entry')`: the `.` entry resolves for both `require` (umd) and `import` conditions, so adding the subpath did not break the existing export.
  This uses Node's real `exports` algorithm, so it is authoritative without `pnpm install`/pack, and it can run in CI.

**`stylesheetExport.test.ts`** (static read of `package.json`)
- `it('exports the stylesheet subpath')`: `exports['./style.css'] === './dist/style.css'`.
- `it('keeps the main export unchanged')`: `exports['.']` still has `types`, `import`, `require` pointing at the same files as before.
- `it('keeps dist in the published files')`: `files` includes `dist` (and nothing is added that would exclude `dist/style.css`).
- `it('does not export the deep dist path')`: no export key of the form `./dist/*` or `./dist/style.css`.
- `it('does not mark the package side-effect free')`: `sideEffects` is absent, or is a glob that actually matches `dist/style.css` (finding 2).

  DECIDED (research): the accepted glob must match the stylesheet at its real path `dist/style.css` (e.g. `**/*.css`, `dist/*.css`, or the explicit `./dist/style.css`), not merely any token containing `.css`. `sideEffects` globs are matched relative to the package root, so a bare `*.css` matches only top-level files and would leave `dist/style.css` tree-shakeable. See Adversarial-review finding 2.
- `it('stays private')`: `private === true` (out-of-scope guard; flipping it is a later story).
Could be merged into `stylesheetBuild.test.ts`; kept separate because it needs no build and stays fast if the build test is ever skipped locally.

**`sourceHygiene.test.ts`** (static)
- Scans all `.vue`, `.ts` under `src` (including `__tests__`, excluding its own file): `it('contains no em dashes')`; `it('contains no references to process artifacts')` for patterns like `FEAT-\d`, `ST-\d`, `AC\d`, `ADR-\d`, `finding \d`, `QA plan`, `decision \d` (built from string pieces so the test file does not match itself).
- Covers criterion 9's text rules for the whole package, which also guards the earlier stories' files. Kebab-case class names in `<style scoped>` are explicitly allowed; Vue identifier casing stays with ESLint.

### Fixtures and utilities
- Existing: the mount helper and metadata fixtures introduced by the foundation and slot stories in this package; `@vue/test-utils` with auto-unmount from the package test setup (`enableAutoUnmount(afterEach)`); Element Plus registration as those stories do it. The core example template in `packages/core/src/examples/` is not needed (it is not an Element Plus template).
- New: none shared. A local `collectSourceFiles()` and `extractClassTokens()` pair inside `noTailwind.test.ts` (exported from a tiny `__tests__/helpers/sourceScan.ts` if `sourceHygiene.test.ts` reuses the walker); a temp-dir build helper local to `stylesheetBuild.test.ts`.
- Dependencies: `vite` is already a devDependency (needed for `build`/`resolveConfig`), `@types/node` is present for `fs`/`os`/`path`/`module`. No new packages.

### Reactivity and analytics
No `*.analytics.test.ts` is planned. The slice does not touch `DynamicFormItem`, `computedProps`, or validation wiring, only static class names and CSS on two presentational wrappers. The root cause of any render-count change would sit in core, which is untouched. If the developer changes the `switch` or `heading` wrappers beyond class names and structure (for example adding reactive state), this decision must be revisited.

### Coverage
- Stays at or above baseline: the change adds no executable statements (class attributes, `<style scoped>`, config). Test files are excluded from coverage by `coverageConfigDefaults`. If the developer extracts a helper in `src`, it needs its own test.
- Knowingly uncovered: nothing in `src`. The CSS itself cannot be covered by v8 statement coverage; it is verified by the emitted-stylesheet assertions and the manual visual check.
- The build test runs Vite in-process; it does not instrument anything and is not meant to add coverage. Expect it to add a few seconds to `ci:test`; it runs in the `node` environment so it is unaffected by jsdom.

### Time sensitivity
None. No date/time logic, all assertions are deterministic under `TZ=Europe/Amsterdam`.

### Regression risk
- Touched: the `switch` and `heading` fallbacks in `ElementPlusFormTemplate.vue` (markup wrapper and class names only), `vite.config.ts` (`cssCodeSplit`, `cssFileName`), `package.json` (`exports`).
- Existing guards: the tests from the foundation, slot-forwarding, and binding-audit stories (mount, slot override, value round-trips). They must pass unchanged; any that select `.flex`, `.items-center`, `.my-4`, or the `h3` by Tailwind class must be updated to the package classes (criterion 8 allows exactly that). Expect none, but the class scan over `__tests__` will surface any.
- Cross-story: the array, choice, and wizard stories append their own scoped rules to the same stylesheet; the orphan-selector test and the single-css-file assertion are written so they keep holding as those stories add classes (each new class must appear in a template). Same-SFC merge churn with the binding-audit story is a process risk, not a test risk; rerun the full suite after rebasing.
- Changing `cssCodeSplit` alters the umd output (no more runtime style injection). The only in-repo consumer is the Storybook playground via the es build; the build test confirms the es/umd files still load the main export.
- Playground: untouched here, but its element-plus story must still compile after the build output changes (manual Storybook load).

### Manual verification checklist
1. Run the real scripts in `packages/element-plus`: `pnpm run build`, `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck`; confirm `dist/style.css` exists, there is no `dist/vue-dynamic-form-element-plus.css`, and the es/umd files are unchanged in export shape.
2. `npm pack --dry-run --json` (or `pnpm pack` into a scratch dir and list the tarball): `dist/style.css` and `package.json` are included.
3. Tailwind-free scratch consumer (a minimal Vite + Vue app outside the repo, installing the packed tarball plus `element-plus`): `import 'element-plus/dist/index.css'; import '@bach.software/vue-dynamic-form-element-plus/style.css'`. Confirm the import resolves in both `vite dev` and `vite build`, that `.../dist/style.css` fails to resolve, then render a form with a `switch` (with and without label) and a `heading` with children. Screenshot: switch label and control on one line, vertically centered, with a gap; heading with visible block spacing above and below and a bold, larger title. Record the result in Implementation notes.
4. Same scratch page without the `style.css` import: form is still functional and readable (tighter layout is expected), no console errors.
5. Storybook (secondary evidence, playground code untouched): rebuild the package first (`pnpm build`), temporarily add `import '@bach.software/vue-dynamic-form-element-plus/style.css'` locally (do not commit it; the playground story owns that change), load the Element Plus story, and compare the switch and heading against a build of the previous commit's Tailwind rendering. Because the playground runs Tailwind, in DevTools confirm the spacing comes from the package's `data-v-*` rules and not from a Tailwind utility on a playground wrapper. Checking the Storybook docs page is not needed; it has no light/dark variants for this package (dark mode is out of scope).
6. Reviewer pass for criterion 3: new chrome uses `ElFormItem`/`ElDivider` where a primitive exists, scoped CSS only for the inline label+control row, field spacing, and heading typography, and no `ElSpace`/`ElRow`/`ElCol`.

### Proposals for criteria wording (for the reviewer, not applied)
- Criterion 4/5: add "and `build.cssCodeSplit` is not `true`, the es and umd bundles contain no injected styles, and exactly one css file is emitted". Without it the criterion can be met in name only (finding 1).
- Criterion 1: state that the scan is token-based and also covers test files, so a test using a Tailwind class for a selector is a failure.
- Criterion 2: name the required evidence for the manual step as a Tailwind-free consumer, since the Storybook playground itself runs Tailwind (finding 5).
- Criterion 7: state that the automated check uses Node's real `exports` resolution against the built output, with the tarball/scratch consumer as the manual confirmation.

## Adversarial review
Lite, story level. Reviewer running as opus. Findings and resolutions.

1. **BLOCKER (verified) — the correct CSS build mechanism contradicts the approved feature's CSS strategy, which is a silent local override of approved feature architecture.** The QA plan's finding 1 is factually correct: I verified it against the installed Vite `7.3.6` source (`node_modules/.pnpm/vite@7.3.6_.../dist/node/chunks/config.js`). With `build.cssCodeSplit: true` (set explicitly in `packages/element-plus/vite.config.ts`):
   - the es/cjs outputs emit the CSS as an asset named after the entry chunk, i.e. `index.css` (`ensureFileExt(chunk.name, ".css")` at the `cssCodeSplit` true branch, lines ~29876-29893); `cssFileName`/`getCssBundleName()` is **never consulted** on this path;
   - the umd output injects the CSS into the JS at runtime via `document.createElement('style')` (lines ~29894-29911);
   - `cssFileName` is only read through `resolveLibCssFilename` (line ~31202), which is only called on the `cssCodeSplit: false` path (lines ~29913-29915 and the `!cssCodeSplit` emit at ~29932-29955). Lib builds default to `cssCodeSplit: false` (`cssCodeSplit: !raw.lib`, line ~33464); this config overrides that default to `true`.

   So `cssFileName: 'style'` alone with the current `cssCodeSplit: true` will NOT produce `dist/style.css`; `cssCodeSplit` must be removed (reverting to the lib default of `false`) or set to `false`. With `cssCodeSplit: false` + `cssFileName: 'style'`, a single `dist/style.css` is emitted once across the es+umd outputs (guarded by `hasEmitted`), no JS injection, no per-chunk `index.css`. The corrected mechanism is sound.

   The problem for this story: the approved feature spec's CSS strategy section states "With the lib build's `cssCodeSplit`, this compiles to a single stylesheet shipped in `dist`", and its Adversarial-review finding 2 `DECIDED (research)` entry resolved the stylesheet-emission issue by pinning `cssFileName: 'style'` **only**, never mentioning the `cssCodeSplit` change. That DECIDED entry (and the CSS-strategy sentence it rests on) is factually wrong at Vite 7.3.6. This story's realization therefore contradicts the approved feature architecture. Per hard rule 4, that contradiction must be corrected by amending the feature spec (Jeroen), not silently overridden in the story. The DECIDED entry was made by research (not Jeroen), so the mechanism is overridable, but the approved feature text still needs to be corrected so the two specs agree. Suggested resolution: adopt the corrected mechanism (drop or set `cssCodeSplit: false`, keep `cssFileName: 'style'`), amend the feature CSS-strategy section and finding-2 entry (see the `DECIDED (research)` note routed into the feature spec), and update this story's criteria 4/5 to require `cssCodeSplit` not be `true` (routed below).

2. **SHOULD-FIX (routed) — the `sideEffects` guard as specified can pass while still failing to protect `dist/style.css`.** The QA plan's finding 2 and the `stylesheetExport.test.ts` case `it('does not mark the package side-effect free')` accept "`sideEffects` absent or includes a `*.css` glob". But `sideEffects` globs are matched against module paths relative to the package root, and the stylesheet ships at `dist/style.css`, not the package root. A bare `["*.css"]` matches only top-level `.css` files and would NOT preserve `dist/style.css` from tree-shaking if a later publish story sets it. The guard must require a glob that actually matches `dist/style.css` (e.g. `**/*.css`, `dist/*.css`, or the explicit `./dist/style.css`), not merely any token containing `.css`. Routed as a `DECIDED (research)` refinement on the `stylesheetExport.test.ts` case below.

3. **NIT — the feature's own import example is broken and should be corrected in the same feature amendment.** The QA plan's finding 3 is correct: the feature CSS-strategy snippet imports `@bach.software/vue-dynamic-form-element-plus/dist/style.css`, which criterion 7 (verified against Node's `exports` algorithm) says must throw `ERR_PACKAGE_PATH_NOT_EXPORTED` once the `exports` map exposes only `"./style.css"`. Not this story's edit, but folded into the feature `DECIDED (research)` note so it is fixed when the feature is amended for finding 1. No status impact.

Resolution (story prep): finding 1 concerned a `DECIDED (research)` entry made without Jeroen, not one of his decisions, so the feature's CSS strategy and its finding-2 entry were corrected to include `cssCodeSplit: false` (verified again against the Vite 7.3.6 source), and this story adopts the corrected mechanism. Findings 2 and 3 are adopted as routed. The should-fix (finding 2) and nit (finding 3) are routed as PROPOSED edits and do not independently force discussion.

## Implementation notes
What was built:
- `ElementPlusFormTemplate.vue`: the `switch` row and `heading` block/title fallbacks use the package classes `epft-switch-row`, `epft-heading`, `epft-heading-title` with a `<style scoped>` block (flex row with centered items and `0.5rem` gap; `1rem` block margin; title `1.125rem`, weight 600, `0 0 0.5rem` margin). No other rules were added (no field-spacing or grid rule, since no current rendering needs one and the orphan-selector test forbids speculative rules).
- `vite.config.ts`: `build.cssCodeSplit: false` and `build.lib.cssFileName: 'style'`. `package.json`: `exports["./style.css"] = "./dist/style.css"`; `sideEffects` stays absent.
- Tests in `src/__tests__/`: `noTailwind.test.ts`, `layoutClasses.test.ts`, `stylesheetBuild.test.ts`, `stylesheetExport.test.ts`, `sourceHygiene.test.ts`, plus the shared walker/extractor in `helpers/sourceScan.ts`. No existing test needed a class-name update.
- `specs/components.md`: the package row now lists the `./style.css` subpath.

Deviations (none affect the feature design; the feature spec already carries the `cssCodeSplit: false` correction, so it was not edited):
- `layoutClasses.test.ts` class-hygiene test also allows Element Plus state classes (`is-*`, `asterisk-*`) next to `el-*` and `epft-*`, because `ElFormItem` and `ElSwitch` emit them.
- The package prefix is `epft-`, held in one constant in `layoutClasses.test.ts`.
- `sourceHygiene.test.ts` builds its patterns from string pieces and `stylesheetExport.test.ts` also unit-tests its own `sideEffects` glob matcher (accepts `**/*.css`, `dist/*.css`, `./dist/style.css`; rejects `*.css`).

Observations outside this story:
- `npm pack --dry-run` lists `dist/style.css` and `package.json` (checklist step 2), but also the test `.d.ts` files under `dist/src/__tests__/`, emitted by `vue-tsc --emitDeclarationOnly` since the earlier stories added tests. Worth excluding in the publish story.
- The real `pnpm run build` produces only `dist/style.css` (0.23 kB) as CSS, with no `vue-dynamic-form-element-plus.css` or `index.css`.

Manual checks done:
- Criterion 7 resolution: `.../style.css` resolves to `dist/style.css`, `.../dist/style.css` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`, and the main entry still resolves for both `require` and `import` (automated against a simulated `node_modules` tree in `stylesheetBuild.test.ts`).
- Tailwind-free scratch consumer (plain Vite plus Vue, aliases to the built `dist`, imports only `element-plus/dist/index.css` and the package `style.css`): computed styles `display: flex`, `align-items: center`, `gap: 8px` on the switch row and `font-weight: 600`, `font-size: 18px` on the heading title. The screenshot (switch with label inline and centered, switch without label, heading with spaced title and two children) is at `/private/tmp/claude-502/-Users-jeroenbach-Source-dynamic-form-worktrees-dynamic-form-worktree-1/866df2bf-630d-4efb-acc6-b8084526b495/scratchpad/with-style.png`.
- Not done (left for the verifier): the tarball install into a scratch consumer, the variant without the `style.css` import, and the Storybook comparison. The playground was left untouched as specified.

Verify-attempt-1 fix: deleted the stray `src/__tests__/stylesheetBuild.test.ts-E` backup (leftover of a macOS `sed -i`); no other stray backup files exist in the tree. `ci:test` (19 files, 310 tests), `ci:lint`, and `ci:typecheck` re-run clean in `packages/element-plus`.

Checks (all in `packages/element-plus` unless noted): `ci:test` 19 files, 310 tests pass; `ci:lint` (also run at the root, core included) and `ci:typecheck` clean; `build` succeeds; `pnpm -r ci:test:coverage` passes with element-plus at 100% statements, 97.95% branches (the one uncovered branch, template line 81, predates this story), 100% functions. `docs/` untouched, so no docs build. No changeset (private package, `packages/core` untouched).

## Verification report

### Attempt 2 (current)
Verdict: **pass**. Status set to `done`.

The single attempt-1 finding (stray `stylesheetBuild.test.ts-E` backup) is fixed: `find` for `*-E` files in the package returns nothing. Everything else was re-run independently.

- `packages/element-plus`: `ci:test` 19 files, 310 tests pass; `ci:lint` and `ci:typecheck` clean; `build` succeeds and emits only `dist/style.css` (0.23 kB, scoped `epft-switch-row`, `epft-heading`, `epft-heading-title` rules), es 16.31 kB, umd 13.09 kB; no `createElement("style")` in either bundle.
- Root `ci:lint` and `ci:typecheck` clean for core and element-plus. `pnpm -r ci:test:coverage`: core 686 tests, 97.57 / 92.61 / 97.14 (unchanged, `git diff -- packages/core` empty); element-plus 310 tests, 100 / 97.95 / 100 (same as the attempt-1 baseline).
- No changeset needed (private package, core untouched). `docs/` untouched, no docs build.
- Mutation check: adding `my-4` to the heading class fails `noTailwind` (2) and `layoutClasses` class hygiene (1); the file was restored byte-identical (md5 verified).
- Hygiene: no em dashes, no process references in `src` (only the self-excluded patterns in `sourceHygiene.test.ts`), no tailwind or postcss config in the package, `npm pack --dry-run` lists `dist/style.css` and `package.json`.
- Criteria 1 to 9: all pass on the same evidence as the attempt-1 table below, criterion 9 now passes. `specs/components.md` lists the `./style.css` subpath and `epft-` classes. Implementation matches the feature's corrected CSS strategy (`cssCodeSplit: false`, `cssFileName: 'style'`, `/style.css` import); no silent deviation.
- Not re-done by me (manual, non-blocking): tarball install into a scratch consumer, the no-`style.css` variant, the Storybook comparison. The developer's Tailwind-free screenshot is recorded in Implementation notes; resolution is covered by the automated Node `exports` test.
- Notes for the publish story: the tarball also includes `dist/tsconfig.tsbuildinfo`, `dist/vite.config.d.ts`, and test `.d.ts` files under `dist/src/__tests__/`.
- This is the last open story only if ST-05 to ST-10 are done; they are not, so the feature stays `in-progress`.

### Attempt 1
Verdict: **fail** (one hygiene defect, everything else verified). Status set back to `implementing`.

### Pipeline results (re-run independently)
- `packages/element-plus`: `ci:test` 19 files, 310 tests pass; `ci:lint` clean; `ci:typecheck` clean; `build` succeeds (emits `dist/style.css` 0.23 kB, es 16.31 kB, umd 13.09 kB).
- Root `pnpm run ci:lint` and `ci:typecheck` clean for both packages. `pnpm -r ci:test:coverage`: core 686 tests, 97.57 / 92.61 / 97.14 (unchanged, `packages/core` untouched); element-plus 100 / 97.95 / 100 (one uncovered branch, template line 81, predates this story).
- `docs/` untouched, so no docs build. No changeset needed (private package, core untouched, confirmed by `git diff -- packages/core` being empty).
- Mutation checks (each restored byte-identical, verified by checksum): `cssCodeSplit: true` fails 9 build tests; adding `flex` to the switch row class fails `noTailwind` (2) and `layoutClasses` class hygiene (1); renaming the `./style.css` export fails 2 export tests and 2 resolution tests. The tests are not no-ops.

### Criteria
| AC | Result | Evidence |
| --- | --- | --- |
| 1 No Tailwind | pass | `noTailwind.test.ts`: token-based scan (self-checked extractor), pattern set, no directives, no tailwind dependency or config; mutation caught |
| 2 switch and heading layout | pass | `layoutClasses.test.ts` (row/label/control order, no-label, disabled, heading block/title/children, scope attribute, consumer override unscoped); built CSS rules asserted in `stylesheetBuild.test.ts`; emitted rules are `display:flex; align-items:center; gap:.5rem`, heading `margin:1rem 0`, title `font-size:1.125rem; font-weight:600`. Visual: developer's Tailwind-free screenshot recorded; not re-done by me |
| 3 Element Plus primitives preferred | pass | `ElFormItem` and `ElDivider` kept; no `ElSpace`/`ElRow`/`ElCol` (banned-component test); scoped CSS limited to switch row and heading |
| 4 build emits `dist/style.css` | pass | real build: only `dist/style.css`, no `index.css` or package-named css; no style injection in es/umd (grep 0, `keeps styles out of the javascript bundles`) |
| 5 file name pinned, no code split | pass | `vite.config.ts`: `cssFileName: 'style'`, `cssCodeSplit: false`; resolved-config tests |
| 6 export | pass | `package.json` `exports["./style.css"] = "./dist/style.css"`, `.` entry unchanged, `files: ["dist"]`, no deep export, `sideEffects` absent; `stylesheetExport.test.ts` |
| 7 import resolves | pass | `stylesheetBuild.test.ts` real Node `exports` resolution: `/style.css` resolves to `dist/style.css`, `/dist/style.css` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`, main entry resolves for require and import. `npm pack --dry-run` lists `dist/style.css` and `package.json` |
| 8 regression | pass | all earlier-story tests pass unchanged (310 total, no existing test edited for class names) |
| 9 hygiene | **fail** | see finding below; `sourceHygiene.test.ts` (no em dashes, no process references) passes, lint, typecheck, test, build pass |

### Finding (must fix)
1. **Stray editor backup file in the tree:** `packages/element-plus/src/__tests__/stylesheetBuild.test.ts-E` (untracked, 6790 bytes) is a leftover from an in-place `sed -i` on macOS. It is an older copy of `stylesheetBuild.test.ts` (differs in two regexes, `gap:\s*[^;]*\d` and `margin:\s*[^;]*[1-9]`). It is not run or linted (extension does not match), so every gate stays green, but it would be committed with the story. Delete it.

### Compliance
- `specs/components.md` updated (package row lists the `./style.css` subpath and `epft-` classes). The feature spec already carries the `cssCodeSplit: false` correction and the `/style.css` import example; the implementation matches it, no silent deviation. The class-hygiene allowance for `is-*`/`asterisk-*` classes and the `epft-` prefix are documented deviations in Implementation notes and acceptable.
- Prototype: the feature has none; no sibling drift found (the only new markup is on `switch` and `heading`).
- Not re-done by me (manual, and not blocking): tarball install into a scratch consumer, the variant without the `style.css` import, and the Storybook comparison. The automated resolution test and `npm pack` listing cover the packaging risk.
- Note: while running the `cssCodeSplit: true` mutation, the real `packages/element-plus/dist` (gitignored) was emptied and rewritten with `index.css`. It does not happen in a normal run (verified: the build test leaves `dist` untouched), so I rebuilt `dist` and left it correct. Worth a look only if the build test is ever changed.
- Also noted for the publish story: the packed tarball includes `dist/tsconfig.tsbuildinfo`, `dist/vite.config.d.ts`, and test `.d.ts` files under `dist/src/__tests__/`.
