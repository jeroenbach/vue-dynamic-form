---
id: ST-10
type: story
feature: FEAT-004
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Publish flip once Jeroen has seen it work

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- First published version → `0.2.0` from the minor changeset already decided for the feature
- Core peer floor → raised to the core version that first ships the wizard and explicit-choice slot props (currently `0.6.0`), derived at story time, via the shared catalog entry
- Rollup externals → every declared peer is external, including deep imports, following core's own config
- Repository URL → element-plus's is correct and stays; core's stale URL is an observation only


## Functional
### User story
As a library consumer, I want `@bach.software/vue-dynamic-form-element-plus` to be available on npm with a changelog entry, so that I can install the Element Plus template instead of hand-building every slot.

### Gate (read first)
This story is the last step and is **held until Jeroen has seen the finished template working** (the feature's Open question 1: publish only once proven working, at the end or as an immediate follow-up). The developer does not start it on the strength of its own `approved` status alone: it needs Jeroen's explicit go-ahead after the playground review of ST-08, recorded in the PR or the story's Implementation notes.

### Acceptance criteria

Each criterion is verifiable by inspection, a build/pack check, or a manual step where marked.

1. **The package is publishable.**
   Given `packages/element-plus/package.json`,
   When the story lands,
   Then `"private": true` is removed (or set to `false`), `publishConfig.access` is `public`, `version` stays `0.1.0` (the bump to `0.2.0` happens in the release PR from the changeset, never by hand), the `@bach.software/vue-dynamic-form` peer range is raised to the floor in the Open points below, and `name`, `exports` (including `"./style.css"`), `files`, `main`, `module`, and `types` are correct.

2. **The packed tarball is correct.**
   Given `pnpm --filter ./packages/element-plus build` and a `pnpm pack` dry run,
   When the tarball contents are listed,
   Then it contains the ES and UMD bundles, `dist/style.css`, the type declarations referenced by `types`, and the README, and nothing else of note (no coverage, no sources required).

3. **The tarball works in a clean consumer.**
   Given a scratch Vue app (outside the repo, in the scratchpad) that installs the packed tarball plus `element-plus`, `vee-validate`, `vue`, and `@bach.software/vue-dynamic-form` packed from the same commit (the registry version predates the wizard and explicit-choice slot props), and imports both stylesheets,
   When it renders `<DynamicForm :template="ElementPlusFormTemplate" />` with a few fields,
   Then the form renders fully styled with no Tailwind present, types resolve (`vue-tsc` passes on the snippet), and `import '@bach.software/vue-dynamic-form-element-plus/style.css'` resolves. This is a manual step; results are recorded in Implementation notes.

4. **A minor changeset is added.**
   Given `.changeset/`,
   When the story lands,
   Then one changeset exists for `@bach.software/vue-dynamic-form-element-plus` with bump `minor`, written for a consumer skimming release notes, leading with the business purpose from the feature's Problem & goal (a genuine drop-in Element Plus template that works out of the box, is overridable per slot and extendable with your own field types, and needs no Tailwind), with technical detail kept brief. It is one cohesive entry, not several fragments. This story adds no changeset that names `@bach.software/vue-dynamic-form` (core's own pending changesets are unrelated and stay untouched).

5. **Release tooling accepts the package.**
   Given the repository's changesets configuration,
   When `pnpm changeset status` runs,
   Then it lists the package with a minor bump and reports no config error (for example a package that is ignored or private).

6. **Inventory entry is moved.**
   Given `specs/components.md`,
   When the story lands,
   Then the Element Plus package entry is moved out of "Non-published surfaces" into the published-surface section with its final export list.

7. **Nothing else changes.**
   Given the change set,
   When reviewed,
   Then, measured against the commit recorded when the story starts, only `packages/element-plus/package.json`, `packages/element-plus/vite.config.ts` (externals), `pnpm-workspace.yaml` (the core peer floor in the `framework` catalog), `pnpm-lock.yaml` (the matching catalog specifier), the changeset, `specs/components.md`, this story's own spec file, and any CI/publish workflow wiring strictly required for the new package changed; `packages/core` and `docs/` are untouched. The actual `npm publish` and the release PR merge are done by Jeroen, never by an agent (the release PR must be merged, not squash-merged).

8. **Code hygiene.**
    Given all changed files,
    When reviewed,
    Then there are no em dashes and no spec or process references (FEAT, ST, AC, ADR, finding numbers) in the changeset or package metadata.

### Edge cases
- The changesets config may list workspace packages explicitly or ignore private ones; if the new package needs config changes or publishing CI changes that are not obviously mechanical, record them as an open point instead of guessing.
- Version starts at the package's current `0.1.0`; the minor changeset bumps it to `0.2.0` on release. The first published version is settled below.

### Open points
- DECIDED (research): the first release is `0.2.0`, the mechanical result of the minor changeset on `0.1.0`.
  Why: the feature's decision 6 (Jeroen) already fixes the bump type as minor; the resulting version follows from Changesets arithmetic. This story is also held for Jeroen's explicit go-ahead, where the version is visible before anything publishes.
  Sources: the feature's Open questions decision 6, `.changeset/config.json`
- DECIDED (research): the `@bach.software/vue-dynamic-form` peer floor is the lowest core version that contains the wizard and explicit-choice slot props the template relies on, not `>=0.1.0`. It is derived when the story runs, never guessed: if those changesets are still pending, it is the `newVersion` that `pnpm changeset status` reports for core (at planning time core is `0.5.0` with five pending minor changesets and one patch, so `0.6.0`); if core has already released them, it is the first released version whose CHANGELOG lists them. It is written as `>=` that version in the `framework` catalog entry, which only this package consumes as a peer, and `pnpm-lock.yaml` is regenerated and committed with it.
  Why: a peer range is a compatibility claim, and `>=0.1.0` claims a pairing that installs cleanly and breaks at runtime (the choice and wizard shapes need slot props older cores do not pass). The version is a fact of the release state, not a preference. Keeping the catalog as the single source matches how every other peer range in this repo is declared.
  Guard: the release simulation (R3) must show the package still resolving to a `minor` bump, `0.1.0` to `0.2.0`, with no higher bump from peer propagation, and `pnpm install --frozen-lockfile` must pass with the regenerated lockfile. If either fails, stop and record `OPEN (needs Jeroen)` rather than changing the bump type or the floor strategy, because that would contradict the minor bump already decided for the feature.
  Sources: `pnpm-workspace.yaml` (`framework` catalog), `.changeset/*.md` (pending core changesets), `packages/core/package.json` version, npm documentation on `peerDependencies`
  Feature amendment suggested (non-blocking): the feature's "Backwards compatibility and changeset" paragraph and its Constraints peer-range bullet are silent on the core peer floor; a one-line addition stating the rule above would close the gap at the level where it was missing.
- DECIDED (research): every declared peer is a Rollup external, including deep imports: `vue`, `vee-validate`, `@bach.software/vue-dynamic-form`, and `element-plus` with its subpaths (matched by pattern, for example `/^element-plus(\/.*)?$/`). The developer makes this edit in `vite.config.ts` rather than deferring it.
  Why: Vite library mode bundles anything not externalized, and a second bundled copy of `vee-validate` or `element-plus` breaks injection and styling in a consumer. Core's own config already externalizes its peers (`vue`, `vee-validate`), so this matches the codebase pattern. It is invisible to consumers other than a smaller, correct bundle, and is a one-line local edit. The risk is latent today (the current sources import only bare `element-plus`), so T1 step 7 stays as the verification, not the trigger.
  Sources: `packages/core/vite.config.ts`, `packages/element-plus/vite.config.ts`, vite.dev/guide/build (library mode)
- DECIDED (research): the element-plus `repository.url`, `homepage`, and `bugs.url` stay as they are. The git origin is `https://github.com/jeroenbach/vue-dynamic-form.git`, so element-plus's values are correct and core's `jeroenbach/dynamic-form` is the stale one. The developer must not change element-plus toward core. Core's stale URL is out of scope here and is noted for Jeroen as a candidate quick fix.
  Sources: `git remote get-url origin`, both `package.json` files
- DECIDED (research): the `require` export pointing at a `.js` bundle inside a `"type": "module"` package is a pre-existing hazard shared with core (core's target is a `.cjs.js` bundle, element-plus's a `.umd.js` bundle, different formats, same hazard). Record the C1 result, do not fix it in this story.
- For the developer, not a decision: `.github/workflows/release.yml` runs `changesets/action` with `pnpm changeset publish` over the `packages/*` workspace, so a second public package is covered on the repo side. Anything npm-side (first publish of a new package name, trusted-publisher or provenance setup) needs access only Jeroen has; the developer reports what is missing at go-ahead time rather than changing it.

### Out of scope
- Docs-site pages, announcement, and any marketing material.
- Any code change to the template, metadata, or core (defects found become new stories).

## Design reference
No prototype. Metadata and release work only.

## Architecture reference
Implements seam 5 (publish half) and the "Backwards compatibility and changeset" paragraph of the feature architecture: changeset `minor`, and only once the package flips to published (Open questions, decision 1). Depends on ST-01 to ST-09 and on Jeroen's explicit go-ahead after the ST-08 review.

## QA plan

### Approach

This story changes release metadata only: `packages/element-plus/package.json`, one changeset file, and `specs/components.md`. No source under `packages/*/src` changes, so there is **no new automated test file**, and adding one would itself violate criterion 7 (nothing else changes). Verification is a mix of (a) the existing suites as a regression net, (b) scripted consistency checks whose commands are run by the developer and pasted into Implementation notes (nothing is added to the repo or to any `package.json` script; they run from the scratchpad), and (c) one manual clean-consumer check.

Everything below assumes the gate is passed first.

### Gate check (precondition, not a criterion)

G1. Implementation notes or the PR record Jeroen's explicit go-ahead after the playground review. Without it the developer stops, regardless of `approved` status.
G2. Stories 1 to 9 are `done` and the working tree is clean (`git status`). `node_modules` is installed (`ls node_modules | head`).
G3. Before touching anything, record the commit the story starts from (`git rev-parse HEAD`). Criterion 7 is measured against it, because this branch also carries the rest of the feature's changes.

### Criterion to check mapping

| AC | Check | Kind | Pass condition |
| --- | --- | --- | --- |
| 1 | M1 manifest review | scripted + inspection | see M1 |
| 2 | T1 tarball contents | scripted | see T1 |
| 3 | C1 clean consumer | manual (scratchpad) | see C1 |
| 4 | R1 changeset review | inspection + grep | see R1 |
| 5 | R2 changeset status, R3 release simulation | scripted | see R2, R3 |
| 6 | I1 inventory review | inspection + scripted diff of export names | see I1 |
| 7 | S1 change-set scope | scripted (git) | see S1 |
| 8 | H1 hygiene greps | scripted | see H1 |

### M1. Manifest (AC1)

Run `node -e` or read `packages/element-plus/package.json` and assert:

- `private` is absent or `false`. `publishConfig.access` is `public`. `name` is `@bach.software/vue-dynamic-form-element-plus`.
- `version` is still `0.1.0`. The bump to `0.2.0` happens in the release PR from the changeset, never by hand; a hand-edited `0.2.0` would double bump (R3 catches it).
- `exports` has exactly the entries `"."` (with `types`, `import`, `require`) and `"./style.css": "./dist/style.css"`. `main`, `module`, `types` point at files that exist after a clean build (T1 verifies existence, not just spelling). `files` is `["dist"]`.
- `repository.url`, `homepage`, and `bugs.url` are consistent with the git remote (`git remote get-url origin`) and with `packages/core/package.json`. At planning time core says `jeroenbach/dynamic-form` and element-plus says `jeroenbach/vue-dynamic-form`; one of them is wrong and the wrong one ships to npm. The developer fixes the element-plus values if they are the odd ones out (in scope: package metadata), otherwise records it.
  - PROPOSED (adversarial review): the direction is now verified. The actual origin remote is `https://github.com/jeroenbach/vue-dynamic-form.git`, so element-plus's `jeroenbach/vue-dynamic-form` is the correct value and core's `jeroenbach/dynamic-form` is the wrong one. element-plus therefore needs no change here; the developer must NOT "fix" it toward core. Core is out of scope for this story (AC7), so record core's stale URL as a pre-existing observation for Jeroen (a candidate quick fix in core) and leave element-plus as is.
- `description` and `keywords` still describe what ships (a template, not just "components"). Cosmetic, but it is the npm page headline.
- There is no `license` field in either package and no LICENSE file under `packages/`; this matches core, so it is recorded as an observation for Jeroen, not a failure of this story.
- `peerDependencies` are the four required peers, none marked optional in `peerDependenciesMeta`.

### T1. Packed tarball (AC2)

Steps (developer runs from the repo root; outputs go to the scratchpad):

1. Start clean: delete `packages/element-plus/dist` (it also holds a stale `tsconfig.tsbuildinfo` from the composite build, which would otherwise mask a declaration-emit problem), then `pnpm --filter ./packages/element-plus build` (core is built first by topological order, or run `pnpm build`, which is what the release workflow runs).
2. `pnpm --filter ./packages/element-plus pack --pack-destination <scratchpad>/tarballs`, then `tar -tzf` the result. Cross-check with `npm pack --dry-run --json` inside the package directory; both must list the same files.
3. Assert the listing contains: `package.json`, `README.md`, `dist/vue-dynamic-form-element-plus.es.js`, `dist/vue-dynamic-form-element-plus.umd.js`, `dist/style.css`, and `dist/src/index.d.ts` (the `types` target) with its referenced declarations.
4. Assert the listing contains none of: `coverage/`, `*.test.*`, `__tests__/`, `.vue` or `.ts` sources outside `*.d.ts`, `vite.config.*`, `tsconfig.json`, `node_modules/`. Because `tsconfig.json` includes `src/**/*`, look specifically for emitted `*.test.d.ts` files and declarations of story/fixture files under `dist/src`. `dist/tsconfig.tsbuildinfo` is a known composite-build artifact; tolerated only if recorded (core ships the same).
5. Extract `package/package.json` from the tarball (not the workspace copy). It must contain no `catalog:` and no `workspace:` strings (those are workspace-only protocols; a leftover makes the package uninstallable), concrete peer ranges, no `private`, and the `./style.css` export.
6. Declarations are self-contained: `grep -R "from '@/" dist/src` returns nothing (an unresolved `@/` alias means `tsc-alias` missed a file and consumers get `any`).
7. Bundle externals: list the bare specifiers imported by the ES bundle (`grep -oE "from ?[\"'][^\"']+[\"']"`). Every one must be a declared peer or a deep import of one. The bundle must not inline vue, element-plus, or vee-validate code (for example no `function createVNode` definition, and the file is small). Note that `vite.config.ts` lists only `vue`, `element-plus`, and `@bach.software/vue-dynamic-form` as `rollupOptions.external`: `vee-validate` and deep `element-plus/...` imports are not external. If the source imports either at runtime, a second bundled copy of vee-validate silently breaks form context injection in a consumer. The externals edit is decided (see Open points), so a failure here means that edit was missed or incomplete: fix it in `vite.config.ts`, which is on this story's file list.
8. `require` condition: `package.json` has `"type": "module"` while `exports.require` points at a `.umd.js` file, which Node treats as ESM. In the C1 scratch app run `node -e "console.log(Object.keys(require('@bach.software/vue-dynamic-form-element-plus')))"` and expect `ElementPlusFormTemplate`, `elementPlusMetadata`, `extendMetadata`. Core has the same `.js`-under-`type: module` hazard (a `.cjs.js` bundle rather than `.umd.js`), so a failure here is pre-existing and shared: record it, do not fix it in this story.

### C1. Clean consumer (AC3, manual)

Everything lives under `<scratchpad>/consumer`, outside the repo, with its own `package.json` and a plain npm or pnpm install (no workspace linking, no `link:`).

Setup:
- Install the tarball from T1, plus `element-plus`, `vee-validate`, `@vee-validate/rules` (core's peer), `vue`, `typescript`, `vue-tsc`, `vite`, `@vitejs/plugin-vue`.
- Install `@bach.software/vue-dynamic-form` from a tarball packed from the current `packages/core` (`pnpm --filter ./packages/core pack`), **not** the registry version. The registry `0.5.0` predates the wizard and explicit-choice slot props this template depends on, so installing it would fail for a reason unrelated to the tarball under test. See the open question about the core peer floor below.
- Confirm no Tailwind: `npm ls tailwindcss` (or `pnpm why tailwindcss`) reports nothing, and no `tailwind.config.*` or `@tailwind` directive exists in the app.

Snippet (adapt from the package README snippets and the playground example; do not invent APIs). Metadata uses a handful of fields covering: a required text, a select with options, a date, a checkbox, plus one repeatable group, one choice, and one two-page wizard, so packaging problems in the structural families (which live in separate code paths from the leaf controls) show up too. Entry file:

```ts
import '@bach.software/vue-dynamic-form-element-plus/style.css';
import 'element-plus/dist/index.css';
```

`<DynamicForm :metadata="metadata" :template="ElementPlusFormTemplate" />`, bare, no wrapper.

Checks:
- C1a. `npx vue-tsc --noEmit` passes with `strict: true` and `skipLibCheck: false` first. If errors appear, they must all originate in third-party packages (then rerun with `skipLibCheck: true` and record); any error whose file is under `@bach.software/vue-dynamic-form-element-plus/dist` is a failure.
- C1b. Type resolution is real, not `any`: add one line with `// @ts-expect-error` on a deliberately wrong usage (for example a wrong value type for a known field property from `elementPlusMetadata`) and confirm `vue-tsc` still passes (an unused `@ts-expect-error` is an error, so it proves types flow). Also one `extendMetadata<...>()` call with a consumer type and property, typed in a wrapper slot.
- C1c. `vite build` of the consumer succeeds, which proves the `style.css` subpath and the `exports` map resolve in a real bundler. Also resolve it with Node: `node -e "console.log(require.resolve('@bach.software/vue-dynamic-form-element-plus/style.css'))"` returns the tarball's `dist/style.css`.
- C1d. Serve the built app and screenshot with Playwright (Chromium at `/opt/pw-browsers/chromium`, package from `playgrounds/storybook/node_modules/playwright`, launch with `args: ['--no-proxy-server']`). Visually confirm: Element Plus styled inputs with labels, no unstyled stacked elements, array card with add/remove buttons, choice section, wizard steps indicator with next/previous. Compare side by side with the Storybook playground rendering of the same shapes.
- C1e. Behavioural smoke: type in the text field, submit with the required field empty and see the validation message on the field (proves vee-validate resolves to one instance), go next in the wizard, and add an occurrence to the array and to the choice.
- C1f. Tailwind absence in the output: the page has no element carrying utility classes that were used before (`flex`, `items-center`, `gap-2`, `my-4`, `text-lg`, `font-semibold`, `mb-2`, `flex-col`) and the layout still looks right, since there is nothing to provide them.
- C1g. Console clean: no Vue warnings (unresolved component, missing injection, extraneous attrs) and no 404s for CSS or JS in the browser console during C1e.
- C1h. Order-independence of the two stylesheet imports: swap the import order once and confirm the page still looks correct (the template stylesheet must not depend on loading before or after Element Plus).

Record in Implementation notes: package versions installed, commands run, pass or fail per check, and the screenshot path.

### R1. Changeset content (AC4)

- Exactly one new file under `.changeset/` compared with the start commit (`git diff --name-status <start> -- .changeset`). Its frontmatter names only `"@bach.software/vue-dynamic-form-element-plus": minor`; `@bach.software/vue-dynamic-form` must not appear in this new file. Note: other core changesets already pending in `.changeset/` are unrelated and stay untouched; "core has no changeset" in criterion 4 means this story adds none.
- The body opens with the business purpose (a genuine drop-in Element Plus template that works out of the box, is overridable per slot, extendable with your own field types, and needs no Tailwind), not with the mechanism. It reads as one cohesive entry.
- Technical detail is short and limited to what a consumer needs to use it: the package name, the two stylesheet imports (Element Plus's and this package's `style.css`), and that `element-plus`, `vee-validate`, `vue`, and the core package are required peers. Proposed addition to the criterion: the stylesheet import is load-bearing for a release-notes reader, since without it the template renders partly unstyled.
- Every capability claimed in the text is actually demonstrated by C1 or the playground (structural shapes claimed must have been seen working). No claim of a capability that was not built.
- Changeset filename is descriptive and follows the existing style (for example `explicit-choice-selection.md`).

### R2. Release tooling accepts the package (AC5)

`pnpm changeset status --output <scratchpad>/status.json` exits 0 and the JSON shows, for `@bach.software/vue-dynamic-form-element-plus`: release type `minor`, `oldVersion` `0.1.0`, `newVersion` `0.2.0`, and no higher bump caused by dependency propagation from the pending core changesets. `.changeset/config.json` is unchanged (`ignore` stays empty). Note that `changeset status` also accepts private packages, so on its own it does not prove publishability; R3 and R4 cover that.

### R3. Release simulation (AC5, AC1 version arithmetic)

`changeset version` mutates files and, because `.changeset/config.json` has `"commit": true`, also creates commits. It must therefore **never** be run in the real worktree. Procedure:

1. `git archive HEAD | tar -x -C <scratchpad>/release-sim`, then `git init`, `git add -A`, `git commit` inside `release-sim` (an independent throwaway repo, so the `commit: true` behaviour cannot touch the real one).
2. `pnpm install --frozen-lockfile` and `pnpm changeset version` there.
3. Expect: `packages/element-plus/package.json` version `0.2.0`; a new `packages/element-plus/CHANGELOG.md` whose first entry is the changeset text verbatim under `Minor Changes`; the consumed changeset file removed; core's own pending changesets produce their own separate bump and CHANGELOG; the element-plus changeset causes no change to `packages/core`.
4. `pnpm build` in `release-sim` succeeds (this mirrors the release workflow's install then build steps).
5. Discard `release-sim`. Afterwards in the real repo: `packages/element-plus/package.json` still says `0.1.0`, there is no `CHANGELOG.md` in `packages/element-plus`, and the changeset file still exists.

### R4. Publishability and npm-side readiness (AC1, AC7, report only)

- In the `release-sim` copy (after R3), `npm publish --dry-run` (or `pnpm publish --dry-run --no-git-checks`) from `packages/element-plus` succeeds, lists the same files as T1, and reports access `public`. No auth is needed for a dry run.
- `npm view @bach.software/vue-dynamic-form-element-plus version` is expected to return E404 (name unclaimed). Record the result. If it is already taken, stop and report.
- Read `.github/workflows/release.yml` and confirm by inspection it needs no edit: `pnpm build` is `pnpm -r build` (covers the new package), `changeset publish` walks all non-private workspace packages, and `NPM_TOKEN` is reused. `quality-assurance.yml` already reports element-plus coverage, so no workflow change is expected; any workflow diff must be justified as strictly required.
- Not testable by an agent and therefore reported to Jeroen at go-ahead time, never changed: whether `NPM_TOKEN` is allowed to create a new package under the `@bach.software` scope (granular tokens can be limited to existing packages), and any trusted-publisher or provenance setup for the new package name.

### I1. Inventory (AC6)

- `specs/components.md` has a published-surface section for `@bach.software/vue-dynamic-form-element-plus`, and the `Non-published surfaces` table no longer lists the Element Plus package. `grep -n "ElementPlusDynamicForm" specs/components.md` returns nothing (the old name is gone entirely).
- Completeness, scripted: list the exports in `packages/element-plus/src/index.ts` (value and type exports) and confirm each name appears in the new section. Expected per the architecture: `ElementPlusFormTemplate`, `elementPlusMetadata`, `extendMetadata`, `ElementPlusValueTypes`, `ElementPlusFieldProperties`, and the re-exported `FieldMetadata`, `GetMetadataType`, `GetDynamicFormSettingsType`, `MetadataConfiguration`, plus the `./style.css` export. The reverse direction too: nothing is documented that `index.ts` does not export.
- The page preamble currently states that everything exported comes from `packages/core/src/index.ts` and ships in `@bach.software/vue-dynamic-form`. With a second published package that sentence becomes false; it must be reworded so the element-plus section is not attributed to core.
- The entry keeps the file's convention of one or two lines per item and mentions the reserved `input` and `attributes` names and the consumer-wins merge only if the final README (already written) does; wording must stay consistent with the README.

### S1. Change-set scope (AC7)

- `git diff --name-only <start>..HEAD` (plus the uncommitted working tree via `git status --short`) equals this allow-list: `packages/element-plus/package.json`, the one new `.changeset/*.md`, `specs/components.md`, and this story's own spec file (Implementation notes). Anything else, including `pnpm-lock.yaml`, `.changeset/config.json`, or any `.github/workflows/*`, needs a written justification; an unexplained entry is a fail.
- `git diff <start>..HEAD --stat -- packages/core docs` is empty.
- `pnpm install --frozen-lockfile` still succeeds, which proves the flip did not require a lockfile change.
- Agent boundary evidence: no `npm publish`, no `changeset version`, no git tag, no release PR was produced by the agent (real repo version still `0.1.0`, see R3.5; `npm view` still E404, see R4). The merge style of the release PR (merge, never squash) is Jeroen's action and is not tested; it is restated in the PR description for him.

### H1. Hygiene (AC8)

On the lines added by this story in the three changed files (`git diff <start>..HEAD -U0 -- <files>`):
- No em dash: `grep -n "—"` returns nothing.
- No process references: `grep -nEi "\b(FEAT|ST|AC|ADR)-?[0-9]+\b|finding [0-9]+|decision [0-9]+|QA plan"` returns nothing in the changeset or `package.json`. `specs/components.md` is a process artifact and may name stories only where it already does; the new element-plus section still must not.
- The changeset uses the final product names only (`ElementPlusFormTemplate`, `elementPlusMetadata`, `extendMetadata`), not `ElementPlusDynamicForm`.
- Vue snippets, if any, use camelCase props and the dispatcher's real slot spellings.

### Regression net (existing automated tests)

No source changes, so nothing new to cover and coverage cannot drop. Still run, to prove the flip did not disturb the workspace:
- `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck` (use these, not `pnpm ci`, which a pnpm builtin shadows).
- `pnpm -r ci:test:coverage` under `TZ=Europe/Amsterdam` (set by the scripts); statement, branch, and function coverage for core and element-plus equal the values before the story. Nothing is knowingly left uncovered.
- `pnpm build` from a clean `dist` succeeds for both packages.
- Existing guards for the flows the flip touches: the element-plus component and metadata tests (mount, slot forwarding, extension, control bindings, array, choice, wizard) cover the code that ships; none is modified here.
- Other stories are not affected: this is the last in order, and its only coupling is that every earlier story's output is what gets packed.

### Fixtures and test utilities

- None from `packages/core/src/examples/` (no test runs there). The scratch consumer replaces a fixture; its metadata should be lifted from the playground example so the check reflects what Jeroen already reviewed, not a parallel invention.
- The packed core tarball (C1) and element-plus tarball (T1) are the only generated artifacts; both stay in the scratchpad.
- No new fixtures, utilities, or scripts in the repo, and no `package.json` script entries (nothing here is a user-runnable script to keep).

### States, reactivity, time sensitivity

- Component-state assertions (empty, error, loading, validation) belong to the stories that built the components; this story only spot-checks a validation error state and the array, choice, and wizard shapes in C1e after packaging.
- No `DynamicFormItem`, `computedProps`, or validation wiring is touched, so no `*.analytics.test.ts` is planned.
- No date or time logic is under test in this story; the existing `TZ=Europe/Amsterdam` scripts are used for the regression run.

### Manual verification checklist (developer, before reporting ready)

- [ ] G1 to G3 recorded.
- [ ] M1 manifest values verified, repository URL consistency resolved or recorded.
- [ ] T1 listing pasted; allow-list and deny-list results stated; tarball `package.json` has no `catalog:` or `workspace:`; externals check result stated.
- [ ] C1a to C1h run against the tarball with results and screenshot path recorded.
- [ ] R1 changeset reviewed against the claims actually demonstrated.
- [ ] R2 JSON shows minor, `0.1.0` to `0.2.0`; R3 simulation shows the CHANGELOG entry and leaves the real repo untouched.
- [ ] R4 dry publish output and `npm view` result recorded; npm-side items handed to Jeroen as a list.
- [ ] I1 export list matches `index.ts` both ways; preamble reworded.
- [ ] S1 file list equals the allow-list; H1 greps empty.
- [ ] Regression net green, coverage unchanged.

### Findings and proposed rewrites

1. **Untestable as written (AC7, scope wording).** "Nothing else changes" cannot be evaluated against `main` because this branch carries the whole feature. Proposed rewrite: measure against the commit recorded at the start of the story (G3), with the allow-list in S1 (which adds this story's own spec file).
2. **Ambiguous (AC4).** "`packages/core` has no changeset" is false on its face: six core changesets already sit in `.changeset/`. Proposed rewrite: "this story adds no changeset that names `@bach.software/vue-dynamic-form`".
3. **Weak as a proof (AC5).** `changeset status` passes for private packages too, so it does not prove the flip worked. Proposed rewrite: keep it, and add the release simulation (R3) and dry publish (R4) as the actual proof of publishability.
4. **Underspecified (AC3).** It does not say which core build the consumer installs. The registry `0.5.0` lacks the wizard and explicit-choice slot props, so the consumer must use a core tarball from the same commit (C1 setup). Proposed rewrite: add "with `@bach.software/vue-dynamic-form` packed from the same commit".
5. **Missing criterion coverage.** AC1 lists `version` as "correct", which could be read as bumping it by hand. Proposed clarification: `version` stays `0.1.0` until the release PR (M1, R3).

### Open questions for Jeroen (not resolved by this plan)

- (Settled, see Open points.) **Core peer floor.** The shared catalog gave `@bach.software/vue-dynamic-form` the peer range `>=0.1.0` for the new package, but the template relies on wizard and explicit-choice slot props that only exist from the pending core changesets (registry latest is `0.5.0` without them). A consumer on an older core would install cleanly and break at runtime. Whether to raise the floor to the core version that the same release produces is a packaging decision outside this story's file list (it touches `pnpm-workspace.yaml` or an override in the package), so the developer records what the simulation in R3 shows and asks rather than guessing.
- (Settled, see Open points.) **Rollup externals.** If T1 step 7 showed `vee-validate` or deep `element-plus/...` imports are bundled, the fix is in `vite.config.ts`, outside this story's file list. Same handling: report, do not patch here.

## Adversarial review
Filled by adversarial-reviewer (lite, story level). Findings and resolutions. (Reviewer running as opus.)

Scope note: lite/story review, blockers first. The QA plan already routed rewrites for the AC3/AC4/AC5/AC7 defects it flagged (its Findings section), and I verified each of those against the repo (six pending core changesets all `minor`; `changeset status` does accept private packages; registry core `0.5.0` lacks the wizard/choice slot props). Those are correctly handled and I do not re-raise them. The story also carries two unresolved Open questions (core peer floor, rollup externals), so it lands in `awaiting-discussion` mechanically regardless of the findings below.

1. **BLOCKER (feature-level gap, surfaced here) — the published core peer floor admits an installable-but-broken pairing.** `packages/element-plus/package.json` declares `"@bach.software/vue-dynamic-form": "catalog:framework"`, which resolves to `>=0.1.0` (verified in `pnpm-workspace.yaml`). `ElementPlusFormTemplate` relies on the wizard (FEAT-003) and explicit-choice (FEAT-001/002) slot props, which exist in core only from the version this release produces (the six pending `minor` changesets bump `0.5.0` upward; registry latest `0.5.0` does not have them). A consumer can install `@bach.software/vue-dynamic-form-element-plus@0.2.0` together with `@bach.software/vue-dynamic-form@0.1.0`, satisfy `>=0.1.0`, install cleanly, and break at runtime (choice/wizard shapes fall through to bare rendering or throw on missing slot props). For a published library this is a semver-correctness defect, not a nit. The approved feature never sets a core peer floor: the "Backwards compatibility and changeset" paragraph is silent on it, and the Constraints bullet (`the peer dependency range stays ... does not revisit it`) discusses only the `element-plus` peer, not the core peer. This is a gap in the approved feature, not something ST-10 may patch on its own (raising the floor touches the shared catalog or adds a per-package override, and contradicts the feature's "assume the split is correct" constraint). Suggested resolution: amend the feature spec (the "Backwards compatibility and changeset" paragraph, plus the Constraints peer-range bullet) to specify raising the element-plus -> core peer floor to the core version this same release ships, then let ST-10 realise it. The story already surfaces this as its "Core peer floor" open question; keep it open for Jeroen. Do not resolve it inside this story.
   DECIDED (research): resolved by rule during story prep, see the core peer floor entry under Open points (floor derived from the release state, guarded by the release simulation; a feature amendment is suggested but not blocking). Falls back to `OPEN (needs Jeroen)` only if the guard fails.

2. **SHOULD-FIX (routed) — M1's repository-URL guidance points the developer the wrong way.** Verified: origin is `https://github.com/jeroenbach/vue-dynamic-form.git`, so element-plus's URL is the correct one and core's is wrong. M1 as written ("fix the element-plus values if they are the odd ones out") risks a developer rewriting the correct element-plus URL to match the wrong core URL. Routed as a PROPOSED edit in M1: element-plus needs no change; core is out of scope and its stale URL is recorded as a pre-existing observation for Jeroen.

3. **SHOULD-FIX (kept as the story's open question) — rollup externals omit a declared peer.** `vite.config.ts` `rollupOptions.external` lists `vue`, `element-plus`, `@bach.software/vue-dynamic-form` but not `vee-validate`, a declared peer, nor deep `element-plus/...` subpaths. Today this is latent, not active: the current `packages/element-plus/src` imports only bare `element-plus` and no `vee-validate` at runtime (verified by grep), so nothing duplicate bundles yet. But as a rule every declared peer should be external; if any ported/new control (or a transitive template import) pulls `vee-validate` at runtime, a second copy bundles and silently breaks form-context injection in a consumer. The fix is in `vite.config.ts`, outside ST-10's file allow-list, so the story correctly defers it to T1 step 7 (build-time check) plus its "Rollup externals" open question rather than patching here. No change needed to the story; flagged so Jeroen sees it is a real (feature/build-config) gap, not just a hypothetical.
   DECIDED (research): the externals edit is made in this story, see Open points.

4. **NIT — the "core ships the same pattern" claim in T1 step 8 is imprecise, though its conclusion holds.** element-plus's `exports.require` points at `.umd.js` (a UMD bundle); core's points at `.cjs.js` (a CJS bundle). They are not the same output format. Both are `.js` under `"type": "module"`, so Node parses either as ESM and `require()` returns the wrong thing (empty/erroring), so the shared-hazard conclusion ("pre-existing, record, do not fix in this story") stands. Reword the parenthetical to "core has the same `.js`-under-type:module require hazard (different bundle format)" so a reader does not expect byte-identical config. No status impact.

5. **NIT — the AC list still carries the pre-rewrite wording the QA plan already corrected.** AC4 ("`packages/core` has no changeset because it is untouched") and AC7 ("Nothing else changes") read literally false / unmeasurable; the QA plan's Findings section fixes both (adds-no-core-named-changeset; measured against the G3 start commit). A developer reads the AC block first. Consider folding the corrected phrasing into the ACs themselves, or add a one-line pointer from each AC to its rewrite, so the measured criterion and the stated criterion cannot drift. No status impact.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
