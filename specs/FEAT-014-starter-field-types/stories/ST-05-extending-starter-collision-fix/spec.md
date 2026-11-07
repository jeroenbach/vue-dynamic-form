---
id: ST-05
type: story
feature: FEAT-014
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Fix the extending-starter.md custom-type collision

## Functional
### User story
As a reader of the "Extending The Starter Template" docs example, I want its custom-type demo to use a type the starter genuinely does not ship, instead of `textarea` (now built in), so that the lesson about adding your own field type stays honest and does not teach re-adding something the catalogue already has.

### Acceptance criteria

1. **The custom `textarea` type is replaced with a custom `range` type.**
   Given `docs/.vitepress/theme/components/ProjectFormTemplate.ts`'s `extendMetadata` configuration,
   When inspected,
   Then its `textarea: string` value-type entry and `rows?: number` field property are replaced with a `range: string` value-type entry and a property relevant to a range control (e.g. a `step?: number`), and the existing `rating: number`/`maxRating?: number` pair is unchanged.

2. **The custom slot renders a native range control with a visible value readout.**
   Given `docs/.vitepress/theme/components/ProjectFormTemplate.vue`,
   When inspected,
   Then its `#textarea-input` block is replaced with a `#range-input` block rendering a native `<input type="range">` plus a visible element showing the control's current value, demonstrating exactly why the feature cut built-in `range` support (a slider needs a value readout to be usable, which the feature's Functional overview gives as the reason it stayed a cut candidate).

3. **The example metadata uses the new type.**
   Given `docs/.vitepress/theme/components/FormExampleProjectFields.vue`,
   When inspected,
   Then the field previously declared `type: 'textarea'` is replaced with a field declared `type: 'range'` (e.g. a 0-10 "how likely are you to recommend us" slider), and the `rating`-typed field is unchanged.

4. **Prose no longer mentions the removed custom `textarea`.**
   Given `docs/examples/extending-starter.md`,
   When inspected,
   Then its intro, "What It Demonstrates" bullets, and numbered walkthrough steps reference `range`/`rating` wherever they previously referenced `textarea`/`rating`, and no sentence anywhere in the file still describes `textarea` as a custom type added by this example.

5. **The example still demonstrates every item in "What It Demonstrates".**
   Given the swapped example,
   When read end to end,
   Then it still shows: declaring extra field types and properties with `extendMetadata`, supplying the `<type>-input` slot per new type, the new controls rendering inside the starter's built-in chrome (label, description, error message), and full type safety on the new properties (now `step`/`maxRating` instead of `rows`/`maxRating`).

6. **The docs site builds clean with no stray references.**
   Given the repository after this story's changes,
   When `pnpm docs:build` runs,
   Then it succeeds, and a search for the string `textarea` across `docs/examples/extending-starter.md` and the three example component files returns no result describing it as a custom/extended type (the string may still appear incidentally, e.g. in an unrelated code comment, but not as part of this example's narrative).

### Edge cases
- None beyond the residual-reference check in AC6; this is a scoped docs-prose-and-example-code swap with no new runtime behavior to branch on.

### Out of scope
- Any change to the built-in `textarea`/`radio`/`file`/HTML5-batch catalogue itself: ST-01-04.
- Redesigning or renaming the `rating` demo: it stays exactly as it is today.
- Any `packages/starter/src/` or `packages/core/src/` change: this story is docs-only.

## Design reference
Not applicable. This is a docs-prose and example-code fix, not part of the feature's `prototype.html` (the hand-rolled `extendMetadata` example lives outside the feature's own visual surface). The new custom `range` control's exact visual treatment is the developer's call, matching the project's existing docs-example style (plain, unstyled-ish native controls shown for teaching purposes, as the current `rating`/`textarea` demo already is), not specified by the feature design.

## Architecture reference
Implements the feature's Documentation impact section, "`docs/examples/extending-starter.md` collision (OQ5)" resolution, `DECIDED (Jeroen)`: swap the custom `textarea` for a custom `range`/slider type with a visible value readout, keeping `rating` and the "two custom types" lesson.

- **`docs/.vitepress/theme/components/ProjectFormTemplate.ts` (modified).** Swap the `textarea`/`rows` entries for `range`/a range-relevant property, per AC1.
- **`docs/.vitepress/theme/components/ProjectFormTemplate.vue` (modified).** Swap the `#textarea-input` block for a `#range-input` block with a value readout, per AC2.
- **`docs/.vitepress/theme/components/FormExampleProjectFields.vue` (modified).** Swap the example metadata's `textarea`-typed field for a `range`-typed field, per AC3.
- **`docs/examples/extending-starter.md` (modified).** Prose updates per AC4-5.
- **Public API surface touched:** none. No `packages/starter/src/` or `packages/core/src/` change, so no changeset.
- **Dependencies on other stories:** depends on ST-02 (Textarea). This story's premise, that `textarea` is now a built-in type and the custom demo therefore collides with the catalogue, only holds once ST-02 has shipped; implementing this story before ST-02 would describe a collision that does not yet exist.
- **Changeset:** none (docs-only change, per `CLAUDE.md`'s "Before Every Push" changeset rule: required only when `packages/core/src/` or `packages/starter/src/` changed).
- **Documentation:** this story is itself the full Documentation impact item for the `docs/examples/extending-starter.md` collision; no further doc page is assigned to it or from it.

## QA plan

### Scope and test environment
This story touches only `docs/.vitepress/theme/components/{ProjectFormTemplate.ts,ProjectFormTemplate.vue,FormExampleProjectFields.vue}` and `docs/examples/extending-starter.md`. No `packages/core/src/` or `packages/starter/src/` file changes, so there is no new `DynamicFormItem`/`computedProps`/validation wiring, no `*.analytics.test.ts` render-count concern, and nothing for `pnpm -r ci:test:coverage` (which only instruments `packages/*`) to measure.

`docs/` has its own `vitest` setup (`pnpm docs:test` / `pnpm --prefix docs ci:test`), configured `environment: 'node'`, scoped to `.vitepress/theme/**/__tests__/**/*.test.ts`, with no `jsdom` and no `@vue/test-utils` (`docs/vitest.config.ts`). It is reached by `pnpm -r ci:test` only via the root `ci`/`ci:test`/`ci:test:coverage` scripts explicitly chaining `pnpm --prefix docs ci:test` (see `package.json`), but its own coverage is not tracked by codecov and does not move the `packages/*` baseline. Because none of the four touched files are Vue components mountable under this setup (no DOM, no Vue Test Utils), the only automated tool available here is static source-text assertion against the raw file contents, the same technique already used in `docs/.vitepress/theme/__tests__/dogfood.test.ts` (`readFileSync` + regex over `.vue`/`.ts` source). This story's new test file follows that precedent.

**Typecheck gap, flagged for visibility.** `docs/` has its own `vue-tsc --noEmit` script (`pnpm --prefix docs typecheck`), but it is not called by the root `typecheck`/`ci:typecheck` scripts (`package.json`: both only chain `pnpm -r typecheck`/`pnpm -r ci:typecheck` plus the storybook playground, never `--prefix docs`), and the CI `typecheck` job (`.github/workflows/quality-assurance.yml`) runs exactly `pnpm run ci:typecheck`. So AC5's "full type safety on the new properties" claim for `ProjectFormTemplate.ts`/`FormExampleProjectFields.vue` is not verified by `pnpm ci` or by CI at all; `vitepress build` (used for AC6) does not run a full type check either (Vue/TS compilation there is transform-only). This is a pre-existing gap in the project's pipeline, not something this story can fix in scope; it is covered instead by a manual step below (`pnpm --prefix docs typecheck`).

### New test file
`docs/.vitepress/theme/components/__tests__/extendingStarterExample.test.ts` (general `*.test.ts`, static/structural, no behaviour under test). Reads the four touched files with `readFileSync` and asserts on their raw text, mirroring `dogfood.test.ts`'s style:

- **`ProjectFormTemplate.ts` declares `range`, not `textarea`.** Assert the source contains `range: string` and does not contain `textarea: string`; assert it no longer contains `rows?: number` and does contain a new optional, range-relevant property (the exact key is the developer's call per the Design reference's "e.g. a `step?: number`" wording; the test asserts against whichever key is actually implemented, not a hardcoded guess); assert `rating: number` and `maxRating?: number` are both still present, unchanged (AC1).
- **`ProjectFormTemplate.vue` swaps the slot block.** Extract the `#range-input` template block by regex (same block-extraction approach as `extractClassTokens` in `dogfood.test.ts`) and assert it contains a native `<input type="range">` (or an equivalent `:type` binding resolving to `'range'`) plus a separate element whose text/binding reflects the current value (a value readout). Assert no `#textarea-input` block remains. Assert the `#rating-input` block is still present and its markup (`role="radiogroup"`, `ratingStar` classes, `fieldMetadata.maxRating`) is unchanged (AC2).
- **`FormExampleProjectFields.vue` uses the new type.** Assert the metadata array no longer contains `type: 'textarea'`, does contain `type: 'range'`, and that the `rating`-typed field entry is unchanged (AC3).
- **No file narrates `textarea` as a custom type.** Assert none of the four files (the three components plus `docs/examples/extending-starter.md`) contains the substring `textarea` (case-insensitive) at all. This is deliberately scoped to just these four files, not a repo-wide search: `textarea` legitimately appears elsewhere in `docs/` (`TextareaWithCounter.vue`, `CheckoutFormTemplate.vue`, `CheckoutFormExample.vue`, `custom.css`), all unrelated to this example and out of scope. A strict "zero occurrences in these four files" check is a safe, simpler implementation of AC4/AC6's weaker "not as part of this example's narrative" wording, since nothing in this swapped example has a legitimate reason to mention `textarea` (AC4, AC6's search half).
- **Prose still mentions what the example demonstrates.** Assert `extending-starter.md` contains `range` (case-insensitive) in the intro paragraph and in the "What It Demonstrates" bullets, and that the walkthrough section no longer mentions `rows` (replaced by whichever property name `ProjectFormTemplate.ts` actually uses) (AC4, partial AC5).

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1. Custom `textarea` type replaced with `range` in `ProjectFormTemplate.ts` | Static source assertion (see above) | `extendingStarterExample.test.ts` |
| 2. `#range-input` slot renders native range control plus visible value readout | Static structural assertion (slot block contains `type="range"` and a readout element); full visual/behavioural confirmation (dragging the slider updates the readout) is manual, since docs' vitest has no DOM/Vue mounting | `extendingStarterExample.test.ts` (structural); manual checklist item 2 (behavioural/visual) |
| 3. `FormExampleProjectFields.vue` metadata uses `type: 'range'` | Static source assertion | `extendingStarterExample.test.ts` |
| 4. Prose no longer narrates custom `textarea` | Static source assertion (zero-occurrence check, four files) plus the "still mentions range" positive check | `extendingStarterExample.test.ts` |
| 5. Example still demonstrates every "What It Demonstrates" item | Partly automated: `extendMetadata` call still present (AC1's test), a per-type slot still exists for both custom types (AC2/AC3's tests). Not automated: the new controls actually rendering inside the starter's chrome (label/description/error) is a live-render concern with no mounting tool available here; full type safety on `step`/`maxRating` is a typecheck concern not reached by `pnpm ci` (see Scope section above). Both are manual | `extendingStarterExample.test.ts` (partial); manual checklist items 2 and 4 |
| 6. `pnpm docs:build` succeeds; no stray `textarea` reference | Build success is a manual/CI build step, not a vitest assertion (see manual checklist item 1); the "no stray reference" half is the zero-occurrence test above | manual checklist item 1; `extendingStarterExample.test.ts` (search half) |

### States from the feature's states policy
Not applicable. Per this story's Design reference, the swapped example is outside the feature's own visual surface (`prototype.html` does not cover it), and the range control's exact visual treatment is explicitly the developer's call, not governed by the feature's states policy. No pristine/invalid/valid/focus/disabled matrix is required by this story. Recommended anyway for teaching-example quality (not a formal AC): confirm the slider has a visible focus ring when tabbed to, in both color modes (manual checklist item 2).

### Reactivity / analytics
Not applicable: no `DynamicFormItem`, `computedProps`, or validation wiring is touched. The swapped field is a plain leaf value exactly like the `textarea`/`rating` fields it replaces/keeps; no render-count regression risk is introduced.

### Coverage
No impact on `pnpm -r ci:test:coverage`'s tracked baseline: no `packages/core/src/` or `packages/starter/src/` file changes, confirmed by the story's Architecture reference ("Public API surface touched: none"). `docs/`'s own coverage is not tracked by codecov per `CLAUDE.md`. Nothing is knowingly left uncovered against any tracked baseline.

### Time sensitivity
None. No date/time-dependent behavior in this slice.

### Regression risk
- **VitePress `<<<` code-snippet imports.** `extending-starter.md` imports slices of `ProjectFormTemplate.ts` via the `#region metadata-configuration`/`#endregion` markers and a slice of `FormExampleProjectFields.vue` via `#region metadata`/`#endregion`; `ProjectFormTemplate.vue` is imported whole (no region marker). Confirm both region markers are preserved around the swapped code; a missing or misplaced marker would not necessarily fail `pnpm docs:build` but would silently show stale or truncated snippet content on the rendered page (manual checklist item 5).
- **`docs/.vitepress/theme/__tests__/dogfood.test.ts`.** Scans every `.vue` file under `components/` for `iconName` usage and Tailwind-utility-class usage (scoped to `AdvancedForm.vue` only for the latter). Neither `ProjectFormTemplate.vue` nor `FormExampleProjectFields.vue` uses `iconName`, so this suite should stay green untouched; rerun it to confirm.
- **Other, unrelated `textarea` usages in `docs/`.** `TextareaWithCounter.vue`, `CheckoutFormTemplate.vue`, `CheckoutFormExample.vue`, and `custom.css` all reference `textarea` for unrelated reasons; confirm this story's edits do not touch them and that the new test's file scope (the four files only) does not accidentally flag them.
- **ST-02 dependency.** This story's premise only holds once `textarea` is a built-in starter type; confirm ST-02 has actually shipped (its `Textarea.vue`/`textarea-input` wiring merged into `packages/starter/src/`) before treating this story's docs narrative as accurate. If ST-02 is approved but not yet implemented when this story is implemented, the prose claim "now built in" would be premature; sequence accordingly.
- No other page or component imports `ProjectFormTemplate`/`FormExampleProjectFields`/`projectMetadata` (confirmed by a repo search), so this is an isolated, non-shared surface with no fan-out risk.

### Untestable criteria and rewrite proposals
No acceptance criterion needs a rewrite. Each is testable as written, but AC2's full behavioral/visual confirmation and parts of AC5 (chrome-wrapping, live type safety) have no automated path in this repo today: `docs/`'s vitest setup is explicitly node-only with no DOM or Vue mounting (`docs/vitest.config.ts`), there is no Storybook story or component test harness for this hand-rolled example, and the one Playwright-driven render check in the repo (`docs/scripts/verifyDogfoodRender.mjs`, run via `pnpm docs:test:render`... actually `node scripts/verifyDogfoodRender.mjs`, not wired into `pnpm ci`) only covers the `/examples/wizard` and `/examples/advanced` routes, not `/examples/extending-starter`. These gaps are flagged as manual-only rather than papered over with an invented automated check; see the checklist below. Extending `verifyDogfoodRender.mjs` with a new `/examples/extending-starter` check is a reasonable future enhancement but is not required by this story's scope and is not proposed as a blocking addition here.

### Manual verification checklist
1. Run `pnpm docs:build` and confirm it completes with no errors (AC6, build-success half).
2. Visit `/examples/extending-starter` on a running `pnpm docs:dev`/`pnpm docs:preview` server, in both light and dark mode. Confirm: the range control renders inside the same `FormField` chrome as every other control (label, description, error message placeholder); moving the slider updates the visible value readout immediately; the slider has a visible focus ring when tabbed to in both color modes; the `rating` control still renders and behaves exactly as before (AC2, AC5, states-policy recommendation above).
3. Read `docs/examples/extending-starter.md` top to bottom and confirm every "What It Demonstrates" bullet still holds for the swapped example, and that no sentence anywhere still describes `textarea` as a custom type this example adds (AC4, AC5).
4. Run `pnpm --prefix docs typecheck` and confirm it passes, to verify the new property's type safety (e.g. `step`/`maxRating` checked against the metadata type). This step is not covered by `pnpm ci`/CI today (see Scope section above), so it must be run explicitly rather than assumed.
5. Confirm the rendered page's `<<<`-included code snippets show the current, swapped file contents (not stale output from a misplaced `#region`/`#endregion` marker).
6. Take a light-mode and dark-mode screenshot of the rendered example per the project's "Before Every Push" visual-change step, and attach them to the PR.

## Adversarial review

Lite, story level (blockers only). Checked against the real docs files (`ProjectFormTemplate.ts`, `ProjectFormTemplate.vue`, `FormExampleProjectFields.vue`, `extending-starter.md`), the docs vitest setup (`docs/vitest.config.ts`), the cited test precedent (`docs/.vitepress/theme/__tests__/dogfood.test.ts`), and the approved parent feature (`FEAT-014`).

Verified and holding (stated so they are not re-litigated):
- All four touched files match the story's descriptions exactly: `textarea: string`/`rows?: number`/`rating: number`/`maxRating?: number` in the `.ts`; `#textarea-input` + an unchanged `#rating-input` (`role="radiogroup"`, `ratingStar` classes, `fieldMetadata.maxRating`) in the `.vue`; `type: 'textarea'` in the example metadata; and the `#region metadata-configuration` / `#region metadata` markers plus the whole-file `.vue` include in the markdown. The regression-risk notes about these are accurate.
- The test strategy is feasible: `dogfood.test.ts` genuinely uses `readFileSync` + `extractClassTokens`, and the docs vitest glob (`.vitepress/theme/**/__tests__/**/*.test.ts`) matches the proposed new file at `theme/components/__tests__/extendingStarterExample.test.ts`.
- Consistent with the parent feature's OQ5 `DECIDED (Jeroen)`: swap the custom `textarea` for a custom `range`/slider with a visible value readout, keep `rating` and the "two custom types" lesson. `range` is a genuine feature cut (feature Scope + Functional overview), so the premise is honest.
- Dependency on ST-02 is correctly stated and well-guarded (Architecture reference + regression-risk note: the "now built in" premise only holds once ST-02 ships).
- All six ACs are testable and each is mapped in the AC-to-test table, with the no-DOM gaps (AC2 behavioural, AC5 chrome/type-safety, AC6 build) honestly routed to the manual checklist rather than papered over. The acknowledged typecheck gap (`pnpm --prefix docs typecheck` not reached by `pnpm ci`/CI) is a real, pre-existing pipeline hole and is correctly flagged plus routed to manual item 4.

Findings:

1. **The "0-10 slider" bound is not necessarily metadata-driven, which weakens AC5's type-safety lesson. (nit)** AC3 specifies a "0-10 ... slider", but AC1 mandates only one new range-relevant property (e.g. `step?: number`). A native `<input type="range">` defaults to `min=0`/`max=100`, so a 0-10 range must come from somewhere: either hardcoded in the `#range-input` slot markup or expressed as metadata properties. If the developer hardcodes `min`/`max` in the slot, then AC5's "full type safety on the new properties (now `step`/`maxRating`)" rests on `step` alone, a peripheral prop, while the slider's defining bounds stay invisible to TypeScript. Suggested resolution (developer's call per the Design reference, which already leaves the property key open): expose `min?`/`max?`/`step?` as the range field's extended properties and drive the 0-10 slider from metadata, so the type-safety point the example exists to teach is carried by the properties that actually define the control. Not a blocker: AC1/AC3/AC5 are all satisfiable either way, this only improves example quality.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
