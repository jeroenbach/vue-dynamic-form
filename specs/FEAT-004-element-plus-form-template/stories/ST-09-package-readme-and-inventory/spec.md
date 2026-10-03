---
id: ST-09
type: story
feature: FEAT-004
status: done
approved_by: Jeroen
pr: ""
---

# Story: Package README and inventory final pass

## Assumed without Jeroen (no clear winner)

Ties broken by policy during story prep, not decided on the merits. Each names its alternative inline.

- Scope → README and `components.md` only, verified by review and a one-off script, no committed test or fixture files (reversible: additive later)

## Functional
### User story
As a library consumer discovering `@bach.software/vue-dynamic-form-element-plus`, I want a README that shows the two stylesheet imports, bare and wrapped usage, how to override one control, how to add a field type, and the caveats, so that I can use the template without reading the source.

As a maintainer, I want `specs/components.md` to describe the final public surface accurately, so that the inventory stays the source of truth.

### Acceptance criteria

Verification is by review (manual) plus a one-off check of the documented import paths; no test or fixture files are committed by this story.

1. **README exists and is shipped.**
   Given `packages/element-plus/README.md`,
   When the package is packed (`pnpm pack` dry run),
   Then the README is included in the tarball (npm includes it automatically alongside `files: ["dist"]`; the developer confirms by listing the tarball contents).

2. **The two stylesheet imports are documented and real.**
   Given the README,
   When read,
   Then it shows `import 'element-plus/dist/index.css'` and `import '@bach.software/vue-dynamic-form-element-plus/style.css'` (the exported path, not `dist/style.css`), and a check (manual or script) confirms the second path resolves.

3. **Bare usage is documented.**
   Given the README,
   When read,
   Then it shows `<DynamicForm :metadata="metadata" :template="ElementPlusFormTemplate" />` with no wrapper and states this gives the full Element Plus rendering.

4. **Override usage is documented with the exact wrapper boilerplate.**
   Given the README,
   When read,
   Then it shows the two forward lines (`#input`, `#attributes`) plus one override using the dispatcher's real slot spelling (`#date-input`), explains the `default` override must render `<slot v-bind="s" />`, and lists the slot families the template supports (structural including `default-input`, per-type input, array, choice, wizard) with the priority-fallback rule.

5. **Extension is documented, including the caveats.**
   Given the README,
   When read,
   Then it shows `extendMetadata<...>()` adding a field type and a property, states that a consumer declaration replaces a built-in on collision (consumer wins) and the expected pairing (also supply the matching slot, because built-in fallback markup still assumes the built-in property shape), and states that field types named `input` or `attributes` are reserved and unsupported.

6. **Peer dependencies and the floor are documented.**
   Given the README,
   When read,
   Then it lists the required peers (`element-plus`, `vee-validate`, `vue`, `@bach.software/vue-dynamic-form`) and the supported Element Plus range as it stands after the control audit.

7. **The README examples compile.**
   Given each TypeScript/Vue snippet in the README,
   When the developer type-checks them (a scratch file outside the repo, or the Storybook example that mirrors them, which the playground build already compiles),
   Then they compile against the package's public types; the snippets match the playground example, not invented APIs.

8. **`specs/components.md` is final and consistent.**
   Given `specs/components.md`,
   When reviewed against `packages/element-plus/src/index.ts`,
   Then every export in the package entry is listed with accurate description (component, `elementPlusMetadata`, `extendMetadata`, types, the `./style.css` export, re-exported types), still under "Non-published surfaces" until the publish story moves it.

9. **No docs-site work.**
   Given the change set,
   When reviewed,
   Then nothing under `docs/` changed (docs-site guidance is a follow-up decided by Jeroen).

10. **Code hygiene.**
    Given all changed files,
    When reviewed,
    Then the README has no em dashes, no spec or process references (FEAT, ST, AC, ADR, findings), and any code in it uses camelCase props and the dispatcher's slot spellings.

### Edge cases
- The README is written for a package that is not yet published; install instructions use the final package name and are marked to be confirmed at publish time if the version or tag is unknown.

### Out of scope
- Committed test or fixture files for the README or the inventory (see the ASSUMED entry below).
- Docs-site (VitePress) pages for the package.
- Flipping `private`, changesets, and moving the inventory entry: next story.
- `packages/core` is untouched; no changeset.


## Design reference
No prototype. Documentation only: the change set is the README and `specs/components.md`. No test, fixture, or source file is added.


## Architecture reference
Implements the documentation obligations the feature architecture defers to "the package README/usage": the stylesheet imports (CSS strategy), the wrapper boilerplate (slot-forwarding contract, ADR-1), the reserved-name caveat, the consumer-wins merge and its documented pairing (ADR-2), and the `specs/components.md` update from scope. Depends on ST-01 to ST-08 (documents and verifies the finished surface).

## QA plan

ASSUMED (story prep): this story adds no committed tests or fixtures; verification is manual plus one-off scripted checks whose results go in Implementation notes.
Why: no clear winner. The repo has no precedent for tests that read a README or `specs/components.md` (no test under `packages/` or `docs/` does), CLAUDE.md requires tests for functional changes and this is not one, and committed fixtures under `src/` are picked up by `vue-tsc --emitDeclarationOnly` and can leak declarations into `dist`, which the publish story must keep clean. A test in the package that reads repo-root process files also couples the published package's suite to `specs/`.
Tie broken on: smallest scope (rung 5): no new files in a source package, no new helper.
Alternative: committed drift-guard tests (README stylesheet path against `package.json#exports`, peer list against `peerDependencies`, inventory names against `src/index.ts`) plus fixtures compiled by `vue-tsc`. Reversing is additive and local: the guards can be added later without touching the README or any shipped output.
To keep README snippet correctness (the main risk for a public package), criterion 7 is met by making every README snippet a verbatim copy of the ST-08 playground example, which the playground build and the typed slot scope already exercise.

### Checks (developer runs, records output in Implementation notes)

1. **Pack contents (criterion 1).** From `packages/element-plus`: `npm pack --dry-run --json` (or pack to the scratchpad and `tar -tzf`, then delete the tarball). Confirm `README.md` is listed and note any unexpected files (for example `__tests__` declarations) for the publish story.
2. **Stylesheet imports (criterion 2).** After `pnpm --filter ./packages/element-plus build`: `node -e "console.log(require.resolve('@bach.software/vue-dynamic-form-element-plus/style.css'))"` prints `.../dist/style.css`; the deep `.../dist/style.css` subpath throws `ERR_PACKAGE_PATH_NOT_EXPORTED`; `dist/style.css` exists and is non-empty. Confirm the README shows exactly the two import lines and never the deep path.
3. **README content (criteria 3 to 6, 10).** One read as a first-time consumer: bare usage with no wrapper; the two forward lines plus a `#date-input` override (never `#dateInput`); a `#default` override renders `<slot v-bind="s" />`; slot families listed including `default-input`, and the priority-fallback rule; `extendMetadata<...>()` with consumer-wins, the slot pairing, and reserved names `input` and `attributes`; peers equal `package.json#peerDependencies`; the Element Plus range equals the `framework` catalog and the ST-03 audit outcome. Grep the README for em dashes, `FEAT|ST|AC|ADR` ids, `finding`, `QA plan`, `specs/`, and kebab-case component props.
4. **Snippets match the playground (criterion 7).** Diff each README snippet against the ST-08 playground wrapper and story; intentional differences are noted. `pnpm run ci:typecheck` for `packages/element-plus` and the playground build stay green.
5. **Inventory (criterion 8).** Compare every export in `packages/element-plus/src/index.ts` (runtime and type) with the element-plus block in `specs/components.md`, including the `./style.css` export; confirm the block is still under "Non-published surfaces" and `ElementPlusDynamicForm` no longer appears. Do not touch the unrelated pre-existing em dashes and the `ST-05` mention elsewhere in the file.
6. **Scope (criterion 9).** The diff touches only the README and `specs/components.md`: nothing under `docs/` or `packages/core/`, no changeset, `private` and `version` unchanged.
7. **Unpublished package (edge case).** The install line uses the final package name and all peers, is marked to be confirmed at publish time, and there is no npm or version badge.
8. **Regression.** `pnpm run ci:test`, `ci:lint`, and `ci:typecheck` for `packages/element-plus` stay green; coverage is unchanged because no source changes.

Criteria 3 to 6 and 8 contain prose judgments ("states", "explains", "accurate"); these are reviewed by reading, not proven by script.

## Adversarial review
Lite, story level. Reviewer running as opus (claude-opus-4-8). Blockers-only mode; no blocker found. Checks against the approved feature spec, `packages/element-plus/package.json`, `pnpm-workspace.yaml`, `specs/components.md`, and `src/index.ts`.

Verified consistent (no finding): the documented stylesheet subpath (`@bach.software/vue-dynamic-form-element-plus/style.css`) matches the feature's DECIDED `"./style.css"` export, not the stale `dist/style.css` prose; the peer set in criterion 6 exactly equals `package.json#peerDependencies`; the `>=2.0.0` floor matches the `framework` catalog; the runtime/type exports in criterion 8 match the feature's public-API section; the reserved-name caveat covers both `input` and `attributes` per ADR-1; the `components.md` block-scoped hygiene test is justified by real pre-existing em dashes (lines 14 to 15) and an `ST-05` mention (line 32). Dependencies on ST-01 to ST-08 (plus ST-03 for the floor, ST-04 for the build M2 needs, ST-02 for the mount helper, and ST-10 downstream) are all explicit.

1. **SHOULD-FIX — the story bills itself "documentation only" but the QA plan commits six test/fixture files into a source package.** The User story, Design reference ("Documentation only"), and Architecture reference all frame this as prose + inventory, and Out of scope only rules out docs-site, the publish flip, and `packages/core`. But the QA plan adds `readme.test.ts`, `readmeExamples.test.ts`, `inventory.test.ts`, three fixtures, and a `readmeBlocks.ts` helper under `packages/element-plus/src/__tests__/`. This is not a contradiction of the feature architecture (the feature is silent on tests, no changeset is needed while the package is private, and published output is unaffected), so it is not a blocker, but the self-description is misleading and interacts with ST-10's tarball-cleanliness check (the QA plan's own Regression risk section notes the `vue-tsc --emitDeclarationOnly` leak of `__tests__` declarations into `dist`). Criterion 7 itself only requires "a scratch file or the Storybook example," so committing fixtures is a QA choice heavier than the contract demands. The QA plan's scope note (line 226) already surfaces the either/or for Jeroen, which is precisely why this needs his decision rather than an agent's. Suggested resolution: the PROPOSED edits in Design reference and Out of scope make the scope honest; Jeroen still decides commit-fixtures vs manual-only. 
   Resolved: ASSUMED (story prep), see the QA plan. No committed tests or fixtures; Design reference and Out of scope now state the real scope.

2. **NIT — criterion 4 and its QA mapping omit `default-input` from the structural slot list.** The feature's structural family (feature spec Scope and slot contract) includes `default-input` as the fallback target for every `<type>-input` slot, but criterion 4 and the QA plan test at "lists the supported slot families" enumerate `default`, `default-array`, `default-array-item`, `default-choice`, `default-choice-array`, `default-choice-array-item`, `default-wizard`, `default-wizard-page` without it. A consumer reading only the README would not learn they can override all inputs at once via `default-input`. Suggested resolution: add `default-input` to the documented family list (and the test's checked set). No status impact.
   Resolved: `default-input` added to criterion 4's documented family list.

## Implementation notes
### What was built
- `packages/element-plus/README.md` (new): install (final name, all four peers, marked unpublished), peer table with the exact ranges from `package.json#peerDependencies` (`>=0.1.0`, `>=2.0.0`, `>=4.12`, `>=3.5.18`), the Element Plus floor outcome of the control audit, the two stylesheet imports, bare usage, the built-in field type table, wrapper boilerplate with a `#date-input` override and a `#default` override that renders `<slot v-bind="s" />`, supported slot families with the priority fallback rule (including `default-input`), `extendMetadata` with the consumer-wins and pairing caveat and the reserved `input`/`attributes` names, and an exports table.
- `specs/components.md`: appended to the existing element-plus row (still under "Non-published surfaces"): generic prop and cast note, the two exported types, the four re-exported core types, the peer set, and the README. `ElementPlusDynamicForm` does not appear.
- Nothing under `docs/`, `packages/core/`, or `.changeset/` changed; `private` and `version` in `package.json` unchanged.

### Deviations and findings
- Bare usage needs a cast under strict type checking. `<DynamicForm :template="ElementPlusFormTemplate" />` is rejected by `vue-tsc` (TS2322: the generic component is not assignable to `DefineComponent<object, object, any>`, the type of `DynamicForm`'s `template` prop). A non-generic wrapper compiles without a cast. The README shows the literal one-line usage and then a complete example that declares `const template = ElementPlusFormTemplate as unknown as DefineComponent<object, object, any>`, so every complete snippet compiles. The playground widens the same way (`computed<any>`). Source was not changed (documentation-only story). Follow-up for Jeroen: type `ElementPlusFormTemplate` (or core's `DynamicFormProps.template`) so the cast is not needed.
- README snippets are not byte-identical copies of the playground wrapper. The playground combines the `#default`, `#date-input`, and `#richText-input` overrides in one component; the README splits them into the wrapper (`#input`, `#attributes`, `#date-input`), a `#default` fragment, and the `extendMetadata` wrapper (`#richText-input`, textarea only, no counter or scoped CSS). Bodies are the same code minus test ids and CSS classes.
- The `ElInputNumber readonly` open point from the control audit is stated in the README as a floor note (older than 2.2.16 the number field stays editable) rather than raising the floor; Jeroen has not decided it yet.
- `eslint` formats Markdown here, so `ci:lint` checks the new README: tables were re-aligned by `eslint --fix`, and the `#default` fragment was wrapped in a `<template>` and wrapper element because a bare `<template #default>` is flagged by `vue/valid-attribute-name`.
- Two untracked 11-byte files, `packages/element-plus/button` and `packages/element-plus/v-if`, pre-exist from earlier work (contents `M2 submit-` and `M1 v-show-`, look like stray redirect output). Not touched here; Jeroen may want to delete them before committing.

### Check results (one-off, nothing committed)
1. Pack (`npm pack --dry-run --json` in `packages/element-plus` after `pnpm build`): `README.md` is listed, 62 files. Unexpected for the publish story: 50 `dist/src/__tests__/*.d.ts` declaration files, plus `dist/tsconfig.tsbuildinfo` and `dist/vite.config.d.ts`.
2. Stylesheet: `require.resolve('@bach.software/vue-dynamic-form-element-plus/style.css')` prints `.../packages/element-plus/dist/style.css`; the deep `.../dist/style.css` subpath throws `ERR_PACKAGE_PATH_NOT_EXPORTED`; `dist/style.css` is 1454 bytes. The README shows only the two documented import lines and never the deep path.
3. Content: read as a first-time consumer against criteria 3 to 6 and 10. Peers equal `package.json#peerDependencies`; the Element Plus range equals the `framework` catalog (`>=2.0.0`) plus the audit outcome. Grep of the README for em dashes, `FEAT|ST|AC|ADR`, `finding`, `QA plan`, `specs/`, and `dist/style` found nothing; no kebab-case props (only `v-bind`, `data-*`, and the dispatcher's `#date-input`/`#richText-input` slot spellings).
4. Snippets: each of the five `vue` blocks was extracted into a scratch directory inside the package (imports pointed at `@/index`, the self stylesheet import dropped, the `#default` fragment wrapped with the two forward lines), type-checked with `vue-tsc --noEmit` (clean after the cast above), then the scratch directory was deleted. The slot scopes are typed: the wrapper's `#date-input` scope infers `string` (covered by the existing documented-wrapper fixture) and `#richText-input` reads `fieldMetadata.rows`.
5. Inventory: every export in `src/index.ts` (`ElementPlusFormTemplate`, `elementPlusMetadata`, `extendMetadata`, `ElementPlusFieldProperties`, `ElementPlusValueTypes`, and the four re-exported types) plus the `./style.css` export is described in the element-plus block; pre-existing em dashes and the `ST-05` mention elsewhere in `components.md` untouched.
6. Scope: `git status` for `docs/`, `packages/core/`, and `.changeset/` is empty; `private` and `version` unchanged.
7. Unpublished package: install line uses the final name and all peers, is marked as unpublished with the version to confirm at publish time; no badges.
8. Regression: `pnpm run ci:test` (element-plus 477 tests, core unchanged), `pnpm run ci:lint`, `pnpm run ci:typecheck` all green. Coverage not re-run: no source changed.

Verification command: `cd packages/element-plus && pnpm build && npm pack --dry-run`, then read `packages/element-plus/README.md`.

## Verification report
Verdict: **pass-with-notes**. Verified independently (checks re-run, not taken from Implementation notes). Running as Sonnet 5 (claude-sonnet-5-5).

### Pipeline
- `pnpm run ci:test`: exit 0, element-plus 32 files / 477 tests passed, core green.
- `pnpm run ci:lint`: exit 0 (core and element-plus; eslint covers the README).
- `pnpm run ci:typecheck`: exit 0 (core and element-plus).
- Coverage not re-run: no source file is changed by this story (README and `specs/components.md` only), so the baseline cannot move.
- `pnpm docs:build` not needed: nothing under `docs/` changed.

### Criteria
| # | Result | Evidence |
|---|---|---|
| 1 | pass | `pnpm build` then `npm pack --dry-run --json` in `packages/element-plus`: 62 files, `README.md` listed. |
| 2 | pass | README shows exactly `import 'element-plus/dist/index.css'` and `import '@bach.software/vue-dynamic-form-element-plus/style.css'` (twice for the second, in the stylesheet section and the full example); grep for `dist/style` finds nothing. `require.resolve('.../style.css')` prints `packages/element-plus/dist/style.css`; `.../dist/style.css` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`; `dist/style.css` is 1454 bytes. `package.json#exports` has `"./style.css": "./dist/style.css"`. |
| 3 | pass | README "Bare usage" shows `<DynamicForm :metadata="metadata" :template="ElementPlusFormTemplate" />`, states it gives the full Element Plus rendering with no wrapper, and gives a complete example. See note 1 on the cast. |
| 4 | pass | Wrapper shows `#input`/`#attributes` forwards plus `#date-input` (never `#dateInput`, and the README says so). `#default` example renders `<slot v-bind="s" />` with the explanation. Slot table lists structural (including `default-input`), per-type input, array, choice, wizard families; the priority fallback rule is stated with two worked examples. The listed slot names match the `#...` slots in `ElementPlusFormTemplate.vue`. |
| 5 | pass | `extendMetadata<{ richText: string }, { rows?: number }>()` adds a type and a property. Caveats state consumer-wins on collision, the matching-slot pairing, and the reserved `input`/`attributes` names. |
| 6 | pass | Peer table equals `package.json#peerDependencies` via `catalog:framework` (`>=0.1.0`, `>=2.0.0`, `>=4.12`, `>=3.5.18`); the Element Plus floor note matches the ST-03 audit (only `ElInputNumber readonly`, 2.2.16, is above the floor; radio `:label` kept because `value` is 2.6+). |
| 7 | pass | Extracted all five `vue` blocks into a scratch folder inside the package (imports pointed at `@/index`, stylesheet imports dropped, `#default` fragment wrapped with the forwards) and ran `vue-tsc --noEmit`: clean. Sanity check: a deliberately wrong scratch file in the same folder did fail with TS2322, so the folder is type-checked. Scratch folders deleted; `git status --short` identical before and after. Bodies match the playground `ElementPlusFormTemplateImplementation.vue` (`#default` with `...s`, `#date-input`, `#richText-input`). |
| 8 | pass | All nine exports of `src/index.ts` (component, `elementPlusMetadata`, `extendMetadata`, the two types, the four re-exported core types) plus `./style.css` are described in the element-plus row of `specs/components.md` (line 70), still under "Non-published surfaces". `ElementPlusDynamicForm` absent. Diff against HEAD for the file is one row only; line 70 has no em dashes and no spec ids. |
| 9 | pass | `git status --short docs packages/core .changeset` is empty. |
| 10 | pass | README grep for em dash, `FEAT`, `ST-`, `AC<n>`, `ADR`, `finding`, `QA plan`, `specs/` is empty. Props and slot spellings are camelCase / the dispatcher's (`nativeType`, `metadataConfiguration`, `#date-input`, `#richText-input`). |

Edge case (unpublished package): the install section says the package is not published yet, uses the final name and all four peers, tells the reader to confirm the version or tag at publish time, and there are no badges. Pass.

### Process compliance
- `specs/components.md` updated for the public surface (criterion 8). No `packages/core/src` change, so no changeset is required and none exists.
- `private: true` and `version: 0.1.0` unchanged. No committed test or fixture added by this story, as the ASSUMED entry in the QA plan states; no deviation from the DECIDED or ASSUMED entries found.
- Hygiene in code: no source touched by this story.

### Notes (non-blocking)
1. The one-line bare usage does not compile under strict `vue-tsc` without a cast (generic component vs `DynamicForm`'s `template` prop); the README discloses this and the complete example carries the cast. Follow-up for Jeroen: type the template or core's `template` prop so the cast can go.
2. The tarball (62 files) contains 50 `dist/src/__tests__/*.d.ts` plus `dist/tsconfig.tsbuildinfo` and `dist/vite.config.d.ts`; for the publish story (ST-10) to clean.
3. Untracked stray files `packages/element-plus/button` and `packages/element-plus/v-if` (11 bytes each, redirect leftovers) should be deleted before committing.
4. The `ElInputNumber readonly` floor decision (accept, raise, or drop) is still open for Jeroen; the README states the current behaviour.
5. README snippets are not byte-identical to the playground (split into several fragments, no test ids or CSS), as disclosed in Implementation notes; behaviour and slot spellings agree.
6. The last open story of FEAT-004 is ST-10 (publish flip), so the feature cannot move to `done` yet. Jeroen: link the PR in the story frontmatter `pr:` field.
