---
id: ST-01
type: story
feature: FEAT-007
status: done
approved_by: Jeroen
pr: ""
---

# Story: Package scaffold, stylesheet, and icon primitive

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen individually. Override any of these freely.

- Should-fix 1 → `devDependencies` corrected to the feature Architecture's explicit list, excludes `element-plus`
- Should-fix 2 → added QA row 4b proving the stylesheet build output and `./style.css` resolution
- Nit 3 → AC4 extended to cover `output.globals` alongside `rollupOptions.external`

## Functional

### User story

As a template author who wants to start theming or building custom icon handling against the final `@bach.software/vue-dynamic-form-starter` class names and icon contract before the full chrome ships, I want the package to exist with its exported stylesheet and a Lucide-backed icon primitive, so I can import `./style.css`, retheme the documented CSS variables, and render or override icons through the documented `StarterIcon` contract.

As a maintainer, I want `packages/starter` scaffolded exactly like `packages/element-plus` (build, test, lint, typecheck, CI wiring), so every later story lands on working tooling instead of re-deriving it.

### Acceptance criteria

Each criterion is verifiable by a test or a manual step.

1. **Package scaffold mirrors `packages/element-plus`.** Given `packages/starter/package.json`, when compared to `packages/element-plus/package.json`, then it has `name: "@bach.software/vue-dynamic-form-starter"`, `private: true`, the same `exports` map shape (`.` with `types`/`import`/`require`, plus `./style.css`), the same `main`/`module`/`types`/`files`/`publishConfig.access`, and the same script set (`build`, `build:watch`, `typecheck`, `lint`/`lint:fix`, `test`, `ci`/`ci:test`/`ci:test:coverage`/`ci:lint`/`ci:typecheck`).
2. **Peer and runtime dependencies match the architecture.** Given `package.json`, when inspected, then `peerDependencies` lists only `@bach.software/vue-dynamic-form`, `vee-validate`, `vue` (all `catalog:framework`, no `element-plus`), `dependencies` lists `@lucide/vue`, and `devDependencies` is exactly the feature Architecture's explicit list (`@antfu/eslint-config`, `@bach.software/vue-dynamic-form` as `workspace:*`, `@types/node`, `@vitejs/plugin-vue`, `@vitest/coverage-v8`, `@vue/test-utils`, `eslint`, `eslint-plugin-format`, `jsdom`, `tsc-alias`, `typescript`, `vee-validate`, `vite`, `vitest`, `vue`, `vue-tsc`) plus `@lucide/vue`, with no `element-plus` in either dependency group. **DECIDED (research):** corrected from "mirrors element-plus's list" because element-plus's own `devDependencies` carries `element-plus: catalog:framework-pinned`, which has no place in a package unrelated to Element Plus; the feature Architecture already states the correct explicit list, so this is a direct read, not a new call.
3. **`@lucide/vue` is pinned safely.** Given `pnpm-workspace.yaml`, when inspected, then a catalog entry for `@lucide/vue` exists with range `>=1 <2`, and `package.json` references it via that catalog entry (not an open-ended or literal version).
4. **Build config bundles Lucide and externalizes the rest.** Given `packages/starter/vite.config.ts`, when compared to element-plus's, then `lib.name` is `VueDynamicFormStarter`, `fileName` is `vue-dynamic-form-starter.${format}.js`, `cssCodeSplit: false` and `cssFileName: 'style'` are set, `rollupOptions.external` is exactly `['vue', 'vee-validate', '@bach.software/vue-dynamic-form']` (no `@lucide/vue`, no `element-plus`), and `output.globals` matches the externals exactly (a `vee-validate` global entry present, no stale `element-plus` entry copied over from element-plus's config). **DECIDED (research):** added the `output.globals` clause; element-plus's config pairs a `globals` map to its `external` list for the UMD build, and copying `external` without updating `globals` would leave a stale `element-plus` global and a missing `vee-validate` one.
5. **Test and typecheck tooling run from a clean checkout.** Given a fresh `pnpm install` and `pnpm --filter ./packages/starter run build` of the workspace, when `pnpm --filter ./packages/starter run ci:test`, `ci:lint`, `ci:typecheck` run, then all three pass with real tests (no placeholder).
6. **Root ESLint hyphenation override includes the new package.** Given `eslint.config.js`, when inspected, then the existing hyphenation-off override block (already listing `docs`, `packages/element-plus`, `playgrounds/storybook`) also lists `packages/starter/**/*.vue`, added on top of FEAT-004's current state in that file, not reverting it.
7. **The shipped stylesheet has no Tailwind utility classes.** Given the built `dist/style.css` (or the source `src/style.css` before build), when scanned, then it contains only `sft-` prefixed classes, `is-*` state modifiers, and plain element/selector rules; a test asserts no Tailwind utility class name patterns survive.
8. **Theme variables live at document-root scope, not on a per-form wrapper.** Given the stylesheet, when inspected, then CSS custom properties are declared once on `:root`/`html` and re-declared under `:root.dark`/`html.dark`, with every `sft-*` rule reading them; there is no `.sft-root` selector anywhere (that wording is superseded by the document-root decision).
9. **The stylesheet covers the full prototype class inventory up front.** Given `prototype.html`'s `<style>` block, when diffed against the shipped stylesheet, then every `sft-` class and `is-*` modifier referenced anywhere in the prototype (buttons, fields, select, switch, password, strength bar, group, array/section/repeater, choice, wizard/stepper, review, success/timeline, icon) exists in the stylesheet with equivalent rules, even though the components that reference some of these classes are ported in later stories.
10. **Decision A's variable-driven color spots preserve today's rendering.** Given the stylesheet, when the `.dark`/`:root.dark` block is inspected, then `--sft-confirm-bg`/`--sft-confirm-border`/`--sft-confirm-text`, `--sft-success-badge-bg`/`--sft-success-badge-text`, and the already-variable `--sft-pill-bg`/`--sft-pill-text` all resolve to the same value in light and dark (no new dark variant added), and `--sft-input-border` has no dark override, matching Decision A exactly.
11. **No `<style scoped>` is used anywhere in the package.** Given all `.vue` files in this story, when scanned, then none contains a `<style scoped>` block (ADR 5); all styling lives in the one shipped stylesheet.
12. **`StarterIcon` renders the default registry.** Given `StarterIcon` mounted with `name="chevronLeft"`, when rendered, then it renders the Lucide `ChevronLeft` component with `size=16` (default), `strokeWidth=2` (default), `stroke="currentColor"`, and `aria-hidden="true"`.
13. **The registry matches Decision B's exact name set and canonical Lucide imports.** Given the registry module, when inspected, then it statically imports exactly `ChevronLeft, ChevronRight, Check, Trash2, Plus, Zap, Users, LayoutGrid, Pencil, CircleCheck, LoaderCircle, RefreshCw, Eye, EyeOff, Building2, Rocket, Calendar, Briefcase, Shield, Sparkles` from `@lucide/vue` (canonical v1 names, not the deprecated `CheckCircle2`/`Loader2` aliases), keyed by the stable `sft` names (`chevronLeft`, `chevronRight`, `check`, `trash`, `plus`, `zap`, `users`, `grid`, `pencil`, `checkCircle`, `loader`, `refreshCw`, `eye`, `eyeOff`, `building2`, `rocket`, `calendar`, `briefcase`, `shield`, `sparkles`), and `StarterIconName` is `keyof typeof registry`.
14. **`size` and `strokeWidth` props override the defaults.** Given `StarterIcon` mounted with `size={24}` and `strokeWidth={1}`, when rendered, then the rendered Lucide component receives those exact values instead of the defaults.
15. **A name outside the registry fails soft.** Given `StarterIcon` mounted with an unregistered `name`, when rendered, then it renders nothing (no thrown error) and calls `console.warn` exactly once in dev mode.
16. **An injected icon override, when present, replaces the default rendering.** Given a test harness that provides the internal icon-override key with a render function before mounting `StarterIcon`, when `StarterIcon` renders with any `name`, then it calls the provided function with exactly `{ name, size, strokeWidth }` and renders its return value instead of the registry lookup. (The real producer of this override, `StarterFormTemplate`'s captured `#icon` slot, is wired in the next story; this criterion proves the injection contract in isolation.)
17. **`starterIconNames` is exported and ordered.** Given the package entry, when a consumer imports `starterIconNames`, then it is an array equal to `Object.keys(registry)` in the order Decision B lists them.
18. **`specs/components.md` gets a starting entry.** Given `specs/components.md`, when this story lands, then a new row/section under "Non-published surfaces" lists the package `@bach.software/vue-dynamic-form-starter` with `StarterIcon`, `StarterIconName`, `starterIconNames` as its exports so far (later stories append to this entry, never replace it wholesale).
19. **Code hygiene.** Given all new source and test files, when reviewed, then no comment or test name references specs or process artifacts, there are no em dashes, Vue identifiers use camelCase, and `pnpm run ci:lint`, `ci:typecheck`, `ci:test` pass for `packages/starter`.

### Edge cases

- `StarterIcon` mounted with no override present and a registry name: renders the default, no warning.
- The override function itself returns `null`/nothing: `StarterIcon` renders nothing, no error.
- Rebuilding the package twice is idempotent (`rm -rf dist` in the `build` script already guarantees this, verified once).

### Out of scope

- `StarterFormTemplate` itself and any chrome component (`FormField`, `ArraySectionCard`, `ChoiceCard`, `FormWizard`, etc.): next stories.
- Providing the real `#icon` slot from a mounted template: next story wires the producer side.
- Dogfooding, Storybook, package README, publish flip.

## Design reference

Whole-prototype reference for the stylesheet (every section's CSS, since the stylesheet ships complete in this slice): [`../../prototype.html`](../../prototype.html). Icon-specific reference: [`../../prototype.html#icons`](../../prototype.html#icons) for the registry's starting icon set and the dark-mode toggle button at top-right (confirms the `:root.dark`/`html.dark` mechanism this story implements). No new design: the prototype is the source of truth for class names and variable values; nothing here is left as a delta.

## Architecture reference

Implements feature architecture slicing seam 1 ("Package scaffold + stylesheet + icon primitive") in full: the "Package scaffold and build" section, the "Styling and theming architecture" section (document-root scope, the `DECIDED (Jeroen): option (a)` resolution, not the superseded `.sft-root` wording), Decision A (variable-driven color-gap preservation), Decision B (icon registry strategy, canonical Lucide names), ADR 1 (`@lucide/vue` bundled as a dependency, not externalized), ADR 2 (`@lucide/vue` not `lucide-vue-next`), ADR 5 (no `<style scoped>`), and the `StarterIcon`/`StarterIconName`/`starterIconNames` rows of the Public API table.

Files: `packages/starter/package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.build.json`, `src/tests/test-setup.ts`, `vite-env.d.ts`, `src/style.css` (built to `dist/style.css`), `src/StarterIcon.vue`, `src/icons.ts` (registry + `StarterIconName` + `starterIconNames`), `src/index.ts`, root `eslint.config.js`, `pnpm-workspace.yaml`, `specs/components.md`.

The internal provide/inject `Symbol` key for the icon override (ADR 3) is defined here (for example in `src/icons.ts` or a small `src/iconOverride.ts`, developer's choice) since `StarterIcon` injects it; the next story's `StarterFormTemplate` imports the same key to provide it. Not exported from `src/index.ts` (the public contract is the slot, not the key).

Depends on nothing. Every other story in this feature depends on this one, since it ships the stylesheet every chrome component references and the icon primitive every chrome component renders through. No changeset: `packages/core/src/` is untouched and `packages/starter` stays `private: true` for this whole feature.

## QA plan

Mirrors `packages/element-plus/src/__tests__` conventions and its `sourceScan` helper (reused via a copied `helpers/sourceScan.ts` in `packages/starter`, same `collectSourceFiles`/`extractClassTokens`/`packageDirectory` shape). All new tests live in `packages/starter/src/__tests__/`. No `TZ`-sensitive behaviour in this slice (no dates/times), so the `Europe/Amsterdam` requirement only matters because `ci:test:coverage` sets it globally.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Package scaffold mirrors element-plus | Diff assertions on `package.json` fields (`name`, `private`, `exports`, `main`/`module`/`types`/`files`, `publishConfig.access`, `scripts` keys) against the element-plus manifest read at test time | `packageManifest.test.ts` |
| 2 Peer/runtime deps match architecture | Assert `peerDependencies` keys are exactly `@bach.software/vue-dynamic-form`, `vee-validate`, `vue`, no `element-plus`; `dependencies` has `@lucide/vue`; `devDependencies` equals the Architecture's explicit key list plus `@lucide/vue` and contains no `element-plus` key in either group. **DECIDED (research):** asserts the exact starter key set from the feature Architecture rather than a superset-match against element-plus's `devDependencies`, since that set carries `element-plus: catalog:framework-pinned`. | `packageManifest.test.ts` |
| 3 `@lucide/vue` pinned via catalog | Read `pnpm-workspace.yaml`, assert a catalog entry for `@lucide/vue` with range `>=1 <2`, and `package.json`'s dependency value is the catalog reference string, not a literal/open range | `packageManifest.test.ts` |
| 4 Build config bundles Lucide, externalizes rest | Assert `lib.name`, `fileName`, `cssCodeSplit: false`, `cssFileName: 'style'` via `resolveConfig` (reuse only the config-assertion block of element-plus `stylesheetBuild.test.ts`, not its `declarationsOf`/`scopes the component styles` content assertions, which require the `[data-v-]` scope attribute that ADR 5 forbids here); assert `rollupOptions.external` is exactly `['vue', 'vee-validate', '@bach.software/vue-dynamic-form']`; assert `output.globals` has a `vee-validate` entry and no `element-plus` entry | `stylesheetBuild.test.ts` |
| 4b Stylesheet actually ships to `dist/style.css` and resolves via the `./style.css` export | **DECIDED (research):** ported element-plus `stylesheetBuild.test.ts`'s build-output and package-resolution blocks: run a real `build()` and assert `dist/style.css` is emitted and non-empty (`src/style.css` must be imported by the entry for Vite to emit it), and that a consumer `require.resolve('@bach.software/vue-dynamic-form-starter/style.css')` resolves to the built `dist/style.css`. Without this, ST-01's core deliverable (the exported stylesheet consumers import) is unverified, and a missing entry import would ship a dangling `./style.css` export not caught until the ST-06 dogfood. | `stylesheetBuild.test.ts` |
| 5 Tooling runs from a clean checkout | Manual verification step (see checklist); not unit-testable, the CI pipeline itself is the test | Manual |
| 6 Root ESLint hyphenation override includes starter | Read `eslint.config.js`, assert the hyphenation-off block's `files` glob array contains `packages/starter/**/*.vue` alongside the pre-existing three entries (assert those three are still present, so the test fails if FEAT-007 reverts FEAT-004) | `rootConfig.test.ts` (or folded into `packageManifest.test.ts`) |
| 7 No Tailwind utility classes in stylesheet | Scan `src/style.css` for Tailwind utility-pattern class names (reuse element-plus's `utilityPatterns` regex set) and assert zero matches; assert no `@apply`/`@tailwind`/`@import 'tailwindcss'` directives | `noTailwind.test.ts` |
| 8 Theme variables at document-root scope, no `.sft-root` | Assert `:root` and `:root.dark` (or `html`/`html.dark`) blocks declare the `--sft-*` custom properties; assert the literal string `.sft-root` does not appear anywhere in `src/style.css` | `themeScope.test.ts` |
| 9 Stylesheet covers full prototype class inventory | Parse every `sft-`/`is-*` class token out of `prototype.html`'s `<style>` block and assert each exists as a selector in the shipped stylesheet | `prototypeParity.test.ts` |
| 10 Decision A's variable-driven color spots preserve rendering | Assert `--sft-confirm-bg`/`-border`/`-text`, `--sft-success-badge-bg`/`-text`, `--sft-pill-bg`/`-text` resolve to equal values in the `:root` block and the `:root.dark` block (string-equal extraction); assert `--sft-input-border` has no entry inside the dark block | `themeScope.test.ts` |
| 11 No `<style scoped>` anywhere | Scan all `.vue` files for `<style scoped` and assert zero hits | `noScopedStyle.test.ts` |
| 12 `StarterIcon` renders default registry | Mount with `name="chevronLeft"`, assert the rendered Lucide `ChevronLeft` receives `size=16`, `strokeWidth=2`, `stroke="currentColor"`, `aria-hidden="true"` | `StarterIcon.test.ts` |
| 13 Registry matches Decision B's name set and canonical imports | Static-source assertion: `src/icons.ts` imports exactly the listed 20 Lucide named exports (no `CheckCircle2`/`Loader2`); registry keys match the exact `sft` name list in order; `StarterIconName` is `keyof typeof registry` (typecheck-level, exercised via a type-only test) | `icons.test.ts` |
| 14 `size`/`strokeWidth` overrides | Mount with `size={24}` `strokeWidth={1}`, assert those exact values reach the rendered Lucide component, defaults not used | `StarterIcon.test.ts` |
| 15 Unregistered name fails soft | Mount with an unknown `name`, assert nothing renders (empty wrapper HTML) and `console.warn` called exactly once in dev mode | `StarterIcon.logic.test.ts` |
| 16 Injected icon override replaces default | Provide the internal override key with a spy render function before mount, assert it is called with exactly `{ name, size, strokeWidth }` and its return value is what renders (not the registry lookup) | `StarterIcon.logic.test.ts` |
| 17 `starterIconNames` exported and ordered | Import `starterIconNames` from the package entry, assert deep-equal to `Object.keys(registry)` in Decision B's listed order | `icons.test.ts` |
| 18 `specs/components.md` gets a starting entry | Manual verification: reviewer confirms the new row exists under "Non-published surfaces" listing `StarterIcon`, `StarterIconName`, `starterIconNames` | Manual |
| 19 Code hygiene | No spec/process references, no em dashes, camelCase identifiers; reuse element-plus's `sourceHygiene.test.ts` pattern verbatim against `packages/starter/src` | `sourceHygiene.test.ts` |

### Edge cases to tests

- No override present, registry name given: covered by AC12's base assertion (no `console.warn` call) in `StarterIcon.test.ts`.
- Override function returns `null`/undefined: assert `StarterIcon` renders nothing and does not throw, in `StarterIcon.logic.test.ts`.
- Idempotent rebuild (`rm -rf dist` twice): manual, one-time verification only (per the story's own framing), not a repeated CI assertion.

### States from the feature's states policy applicable to this slice

`StarterIcon` is this story's only interactive-ish component (CSS states like `is-invalid`/`is-disabled` apply to later chrome stories, not this one, since no chrome component exists yet). States to assert here:
- **Default / resolved**: registry name renders the mapped Lucide component with default props (AC12).
- **Override present**: injected render function takes priority (AC16).
- **Missing name (error/empty equivalent)**: fails soft, warns once, renders nothing (AC15 and edge case).
Component tests use `@vue/test-utils` `mount`, asserting on the rendered Lucide component's props via `findComponent`, not on SVG path internals.

### Reactivity / analytics

This slice does not touch `DynamicFormItem`, `computedProps`, or validation wiring (`StarterIcon` is a standalone presentational leaf, not registered with vee-validate), so no `*.analytics.test.ts` render-count assertions are required for this story. `StarterIcon.vue` has no internal reactive state beyond its props and the injected override, so there is no re-render-regression surface to guard yet. Flagging this explicitly as the deliberate absence, not an oversight: later stories (ST-02 onward) that wire `StarterIcon` into chrome rendered by `DynamicFormItem` are where analytics coverage becomes necessary.

### Fixtures and test utilities

- New: `helpers/sourceScan.ts` (copy of element-plus's, pointed at `packages/starter/src`), used by `noTailwind.test.ts`, `noScopedStyle.test.ts`, `sourceHygiene.test.ts`, `prototypeParity.test.ts`.
- New: a small test harness for providing the internal icon-override `Symbol` before mounting `StarterIcon` (e.g. `mountWithIconOverride(name, overrideFn)` in `StarterIcon.logic.test.ts` or a shared `test-helpers.ts`), since the key is internal (not exported from `src/index.ts`) and the test must import it from the module that defines it.
- No `packages/core/src/examples/` fixture needed: this story has no `DynamicForm`/metadata integration yet.

### Coverage

Baseline is `packages/element-plus`'s current coverage floor; `packages/starter` is a new package so it establishes its own baseline rather than lowering an existing one, but `pnpm -r ci:test:coverage` must still pass across the whole workspace. Every new source file (`StarterIcon.vue`, `icons.ts`, `index.ts`, `style.css` has no executable coverage) gets direct unit coverage per the table above. No code is knowingly left uncovered: the fail-soft branch (AC15), the override branch (AC16), and both default-prop and overridden-prop paths (AC12/14) are each hit by a distinct test, covering every branch in `StarterIcon.vue`.

### Regression risk

- `eslint.config.js` edit (AC6) risks reverting FEAT-004's in-flight hyphenation block; `rootConfig.test.ts` explicitly asserts the three existing entries survive alongside the new one, guarding against a silent revert.
- `pnpm-workspace.yaml` catalog edit (AC3) is additive (new `@lucide/vue` entry); no existing catalog entry should change. No automated guard beyond the manifest test reading the new entry; a manual diff review catches an accidental edit to an unrelated catalog line.
- `packages/element-plus` is untouched by this story; its own test suite (`pnpm --filter ./packages/element-plus run ci:test`) is the regression guard confirming this story did not disturb it.
- Later stories (ST-02 through ST-05) depend entirely on this story's stylesheet and `StarterIcon`; a class-name or variable-name typo here surfaces downstream as a missing visual rule, not a local test failure, since no chrome component exists yet to catch it structurally. `prototypeParity.test.ts` (AC9) is the main guard against that: it fails now, at the source, rather than silently later.

### Untestable criteria and rewrite proposals

- **AC5** ("tooling runs from a clean checkout... all three pass with real tests") is not something a test-in-the-suite can assert about itself without circularity (the suite running proves the suite runs). Treat as a manual CI-pipeline verification step, not a unit test; propose narrowing the acceptance wording to "the CI pipeline run for this story's PR shows `ci:test`, `ci:lint`, `ci:typecheck` green for `packages/starter`" so it maps to a reviewable artifact (the CI run) rather than an unwritten test.
- **AC18** (`specs/components.md` entry) is a documentation-content check; no code-level test should assert prose content. Kept as a manual checklist item.
- All other criteria are testable as written; no rewrite needed.

### Manual verification checklist

1. Fresh clone, `pnpm install`, `pnpm --filter ./packages/starter run build`, then `pnpm --filter ./packages/starter run ci:test`, `ci:lint`, `ci:typecheck`: confirm all green with no placeholder tests (AC5).
2. Open `specs/components.md`, confirm the new "Non-published surfaces" row/section lists `@bach.software/vue-dynamic-form-starter` with `StarterIcon`, `StarterIconName`, `starterIconNames` (AC18).
3. Run the build script twice in a row (`pnpm --filter ./packages/starter run build` x2), confirm the second run succeeds identically (idempotent `rm -rf dist`).
4. Visually diff `prototype.html#icons` against the registry's rendered icons in isolation (e.g. a throwaway local mount or Storybook-less manual render) to sanity-check the Lucide glyph choices match the prototype's visual intent, since the automated test only checks name/import correctness, not pixel appearance.

## Adversarial review

Story-mode (lite) review: blockers only, plus two should-fixes routed as PROPOSED edits. Claims checked against `packages/element-plus/package.json`, `vite.config.ts`, `pnpm-workspace.yaml`, the element-plus `__tests__` helpers and `stylesheetBuild.test.ts`, the feature spec's DECIDED entries (document-root theme scope, Decision A, Decision B), and Lucide v1 upstream (`@lucide/vue` rename and `lucide-vue-next` deprecation confirmed; registry uses the canonical `CircleCheck`/`LoaderCircle`, not the deprecated `CheckCircle2`/`Loader2`). No blockers found; the story is consistent with the approved feature design, and its dependency (nothing; everything else depends on it) is stated correctly.

1. **[should-fix] Resolved (research): AC2 and QA row 2 corrected to the feature Architecture's explicit `devDependencies` list.** The `devDependencies` "mirror element-plus's list" instruction wrongly pulls in `element-plus`. `packages/element-plus/package.json` carries `element-plus: catalog:framework-pinned` in its own `devDependencies` (not just as a peer), so AC2's "mirrors element-plus's list plus `@lucide/vue`" and QA row 2's "superset-matches element-plus's list" both, read literally, require `element-plus` in the starter manifest, a package starter has nothing to do with. A manifest-diff test written to QA row 2 would fail a correctly-built starter or force the wrong dependency in. The feature Architecture already gives the correct explicit list (no `element-plus`); AC2 and QA row 2 just need to say so. **Routed as PROPOSED edits in AC2 and QA row 2.**

2. **[should-fix] Resolved (research): QA row 4b added.** No automated test proves the stylesheet actually builds to `dist/style.css` or resolves via the `./style.css` export. ST-01's reason to exist is shipping the stylesheet consumers import, yet QA row 4 reuses only the config-assertion block of element-plus `stylesheetBuild.test.ts` and the content tests (AC7/8/9/10) read `src/style.css`. Nothing asserts `pnpm build` emits `dist/style.css` or that `@bach.software/vue-dynamic-form-starter/style.css` resolves to it. If the entry omits `import './style.css'`, every content test and the build still pass while the `./style.css` export dangles, surfacing only at the ST-06 dogfood. element-plus's own `stylesheetBuild.test.ts` has exactly these build-output and package-resolution assertions. **Routed as PROPOSED QA row 4b.**

3. **[nit] Resolved (research): AC4 now covers `output.globals` too.** AC4 originally fixed `rollupOptions.external` but said nothing about `output.globals`. element-plus's config carries a `globals` map for its externals (`vue`, `element-plus`, core); a developer copying it and only editing `external` leaves an `element-plus` global and no `vee-validate` global, producing a Rollup warning and a broken UMD global for the newly-externalized `vee-validate`. The developer should add a `vee-validate` global and drop the `element-plus` one. No spec change required; flagged so it is not missed.

## Implementation notes

Implemented as specified: `packages/starter` scaffolded as an exact mirror of `packages/element-plus`'s build tooling (`package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.build.json`, `src/tests/test-setup.ts`, `src/vite-env.d.ts`), the corrected `devDependencies`/`peerDependencies` lists from the feature Architecture (no `element-plus` anywhere), the `@lucide/vue` catalog entry (`>=1 <2`) under `catalog:framework`, the document-root-scoped `sft-` stylesheet with Decision A's variable-driven color spots, the `StarterIcon` primitive with its 20-name Lucide registry (canonical `CircleCheck`/`LoaderCircle`), the internal `iconOverrideKey` provide/inject contract, and `src/index.ts` exporting `StarterIcon`, `StarterIconName`, `starterIconNames`. The root `eslint.config.js` hyphenation-off block and `tsconfig.json` project references were extended additively; `specs/components.md` got its starting "Non-published surfaces" entry.

Deviations, recorded here per CLAUDE.md (none affect the public API contract or the approved feature design):

1. **`src/index.ts` explicitly imports `./style.css` as a side effect.** Not spelled out by name in the story's file list, but required for Vite's `cssFileName`/`cssCodeSplit: false` build to actually emit `dist/style.css`: `StarterIcon.vue` carries no `<style>` block of its own (it is a pure render-function component with no SFC style block), so without an explicit stylesheet import from the entry, the single-file build has no CSS to extract and the `./style.css` export would dangle. QA row 4b's added build-output assertions would have caught this at the next story; adding the import now closes the gap immediately instead of carrying it forward.
2. **`iconOverride.ts` is a separate file from `icons.ts`.** The story left this as a developer's choice ("for example in `src/icons.ts` or a small `src/iconOverride.ts`"). Chose the separate file so the next story's `StarterFormTemplate` imports only the provide/inject key, not the full icon registry, keeping the two concerns (name resolution vs. override plumbing) independently testable and reviewable.
3. **`noTailwind.test.ts`'s stylesheet-class-prefix check allows `dark`, `grow`, and `cols-2` as known non-`sft-`/`is-*` tokens.** These are not Tailwind utility leakage: `dark` is the ancestor class VitePress toggles on `<html>` (part of the `:root.dark` compound selector itself, not a separate utility), and `grow`/`cols-2` are structural qualifier classes already present in the prototype's own markup (`li.grow`, `.sft-choice-grid.cols-2`). This check is an addition beyond the QA plan's table (which only requires the `utilityPatterns`/`removedUtilities` scan and the no-`@apply`/`@tailwind` check); it stays as extra insurance with the three legitimate exceptions documented inline.
4. **`StarterIcon.test.ts` asserts on the rendered `<svg>`'s attributes rather than `wrapper.findComponent(LucideComponent).props()`.** Lucide's components are plain functional components with no options object `vue-test-utils` can resolve props from via `.props()`; attribute-level assertions (`width`, `height`, `stroke-width`, `stroke`, `aria-hidden`) verify the same contract (AC12/AC14) without relying on an unsupported API.

`pnpm -r ci:test:coverage` for `packages/starter`: 100% statements / 100% branch / 100% functions / 100% lines across every new source file (`StarterIcon.vue`, `iconOverride.ts`, `icons.ts`, `index.ts`); no workspace package's coverage dropped.

## Verification report

### Pipeline checks

- `pnpm run ci:test` (`pnpm -r ci:test`, fresh `pnpm install` performed first since `pnpm ci` reinstalls): all 3 workspace packages pass. `packages/core` 686 tests, `packages/element-plus` 480 tests, `packages/starter` 167 tests across 11 files (`noTailwind`, `prototypeParity`, `packageManifest`, `icons`, `StarterIcon`, `StarterIcon.logic`, `rootConfig`, `themeScope`, `noScopedStyle`, `sourceHygiene`, `stylesheetBuild`). All pass.
- `pnpm run ci:lint`: clean for all 3 packages.
- `pnpm run ci:typecheck`: clean for all 3 packages.
- `pnpm run ci:test:coverage` (`TZ=Europe/Amsterdam`): `packages/starter` reports 100% statements/branch/functions/lines on all four source files (`StarterIcon.vue`, `iconOverride.ts`, `icons.ts`, `index.ts`), matching the developer's claim. `packages/core` (97.57% stmts) and `packages/element-plus` (100%/98.52% branch) coverage is unchanged from this story's perspective (neither package's source was touched by ST-01), so no drop.
- `pnpm --filter ./packages/starter run build` run twice in a row: both succeed identically, emitting `dist/style.css`, `dist/vue-dynamic-form-starter.es.js`, `dist/vue-dynamic-form-starter.umd.js`, confirming the idempotent `rm -rf dist` (manual checklist item 3).
- `docs/` content untouched by this story; `pnpm docs:build` not required.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1 Package scaffold mirrors element-plus | Pass | `packageManifest.test.ts`; manual diff of `package.json` against `packages/element-plus/package.json` confirms identical `exports`/`main`/`module`/`types`/`files`/`publishConfig`/script-key shape. |
| 2 Peer/runtime deps match architecture | Pass | `packageManifest.test.ts`; manifest inspected directly, matches the Architecture's explicit `devDependencies` list plus `@lucide/vue`, no `element-plus` in any group. |
| 3 `@lucide/vue` pinned via catalog | Pass | `pnpm-workspace.yaml` has `'@lucide/vue': '>=1 <2'` under `catalog:framework`; manifest references `catalog:framework`, not a literal version. |
| 4 Build config bundles Lucide, externalizes rest | Pass | `vite.config.ts` inspected directly and via `stylesheetBuild.test.ts`: `lib.name`/`fileName`/`cssCodeSplit`/`cssFileName` correct, `external` is exactly the three framework peers, `output.globals` has `vee-validate` and no stale `element-plus` entry. |
| 4b Stylesheet ships and resolves | Pass | `stylesheetBuild.test.ts` "build output"/"package resolution" blocks; also independently confirmed by running `pnpm --filter ./packages/starter run build` directly and inspecting `dist/style.css`. |
| 5 Tooling runs from a clean checkout | Pass | Fresh `pnpm install` (triggered by `pnpm ci`'s native clean-install step) followed by `pnpm run ci:test`/`ci:lint`/`ci:typecheck` for `packages/starter`: all green, no placeholder tests. |
| 6 Root ESLint hyphenation override includes starter | Pass | `eslint.config.js` line 12 lists `docs/**/*.vue`, `packages/element-plus/**/*.vue`, `packages/starter/**/*.vue`, `playgrounds/storybook/**/*.vue` together; `rootConfig.test.ts` guards it. |
| 7 No Tailwind utility classes | Pass | `noTailwind.test.ts` (6 tests); manual read of `src/style.css` confirms only `sft-`/`is-*` selectors plus the three documented exceptions. |
| 8 Theme variables at document-root scope | Pass | `style.css` declares the full variable set on `:root`/`:root.dark`; `.sft-root` does not appear anywhere; `themeScope.test.ts` guards it. |
| 9 Full prototype class inventory covered | Pass | `prototypeParity.test.ts`, 111 generated assertions against `prototype.html`'s class tokens, all pass. |
| 10 Decision A variable-driven color spots | Pass | `themeScope.test.ts` "decision A" block; manual read of `style.css` confirms `--sft-confirm-*`/`--sft-success-badge-*`/`--sft-pill-*` are identical in both blocks and `--sft-input-border` has no dark override. |
| 11 No `<style scoped>` | Pass | `noScopedStyle.test.ts`; `StarterIcon.vue` has no `<style>` block at all. |
| 12 `StarterIcon` renders default registry | Pass | `StarterIcon.test.ts` first test. |
| 13 Registry matches Decision B's name set/imports | Pass | `icons.test.ts`; `icons.ts` inspected directly, imports the 20 canonical names, no `CheckCircle2`/`Loader2`. |
| 14 `size`/`strokeWidth` overrides | Pass | `StarterIcon.test.ts` third test. |
| 15 Unregistered name fails soft | Pass | `StarterIcon.logic.test.ts` first test. |
| 16 Injected override replaces default | Pass | `StarterIcon.logic.test.ts` "injected icon override" block, including the exact-payload assertion and the priority-over-registry case. |
| 17 `starterIconNames` exported and ordered | Pass | `icons.test.ts` third describe block. |
| 18 `specs/components.md` starting entry | Pass | New row added under "Non-published surfaces" listing `StarterIcon`, `StarterIconName`, `starterIconNames` for `packages/starter/`; does not replace any existing row. |
| 19 Code hygiene | Pass | `sourceHygiene.test.ts`; `pnpm run ci:lint`/`ci:typecheck`/`ci:test` all green for `packages/starter`; manual scan found no spec/process references and no em dashes in source. |

Edge cases (no override + registered name, override returns null/undefined, idempotent rebuild) all pass per `StarterIcon.test.ts`, `StarterIcon.logic.test.ts`, and the manual double-build above.

### Prototype comparison

`prototype.html`'s full `<style>` block (491 `sft-`/`is-*` occurrences) was diffed programmatically against `src/style.css` via `prototypeParity.test.ts`; every class has an equivalent rule. Dark mode: `:root.dark` carries the full dark skin, including the three faithful-port exceptions (confirm banner, success badge, pill, input border) called out in Decision A, matching the prototype's documented gaps exactly (no new dark variant added). Responsive grid (`sft-grid`/`sft-col-span`, `sft-choice-grid.cols-2`) breakpoints match the prototype's `768px`. No chrome component exists yet in this story, so no sibling-story visual drift is possible; this is the baseline the later stories (ST-02 through ST-05) will be compared against.

### Process compliance

- `specs/components.md`: new "Non-published surfaces" row added for `packages/starter/`, additive, does not replace or reword the element-plus row above it. Matches AC18.
- No changeset: confirmed `packages/core/src/` has zero diff (`git diff --stat packages/core/src` empty); `packages/starter` stays `private: true`. Correct, no changeset required or added.
- Library API rules: only `StarterIcon`, `StarterIconName`, `starterIconNames` are exported from `src/index.ts`; the internal `iconOverrideKey` stays unexported as the story requires. All identifiers are camelCase. No kebab-case anywhere in the `.vue` file.
- Test naming follows repo convention (`.test.ts`, `.logic.test.ts`).
- The four developer-recorded deviations were checked against the story and architecture text and are reasonable: (1) the `./style.css` side-effect import in `index.ts` is necessary for Vite to emit the stylesheet at all and was not in conflict with anything specified; (2) splitting `iconOverride.ts` from `icons.ts` was explicitly left to the developer's discretion in the story's Architecture reference; (3) the three `noTailwind.test.ts` exceptions (`dark`, `grow`, `cols-2`) are genuine structural/ancestor classes present in the prototype's own markup, not Tailwind leakage, and are documented inline in the test; (4) asserting on rendered `<svg>` attributes instead of `.props()` in `StarterIcon.test.ts` is a reasonable technical substitution since Lucide's functional components are not resolvable via `vue-test-utils`'s `.props()`, and the attributes checked (`width`, `height`, `stroke-width`, `stroke`, `aria-hidden`) are the same contract AC12/AC14 require. None of the four narrow scope or silently override any feature-level decision.

### Overall verdict: pass

All 19 acceptance criteria pass with direct evidence, the full pipeline is green, coverage is 100% on every new file with no regression elsewhere, and the prototype class inventory is fully covered. No findings block this story.
