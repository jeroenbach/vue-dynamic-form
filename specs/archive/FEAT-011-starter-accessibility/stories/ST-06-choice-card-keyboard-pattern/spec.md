---
id: ST-06
type: story
feature: FEAT-011
status: done
approved_by: Jeroen
pr: ""
---

# Story: Choice cards implement the full APG radio keyboard pattern

## Functional
### User story
As a keyboard user choosing between options rendered as choice cards, I want to tab into the group once and move between options with the arrow keys, matching the `radiogroup`/`radio` roles the cards already expose, so that the keyboard behavior matches what a screen reader tells me the control is.

### Acceptance criteria
1. **The group is a single Tab stop.**
   Given a `ChoiceSectionCard` rendering 3+ `ChoiceCard`s, none selected,
   When tabbing through the page,
   Then exactly one card in the group is reachable by `Tab` (the selected one, or the first enabled one when none is selected); the rest have `tabindex="-1"`.

2. **Arrow keys move selection among enabled cards.**
   Given focus on one card in the group,
   When `ArrowRight`/`ArrowDown` or `ArrowLeft`/`ArrowUp` is pressed,
   Then focus (and the roving `tabindex`) moves to the next/previous enabled card, selecting it, wrapping from the last enabled card to the first (and vice versa).

3. **Disabled cards are skipped by roving and never become the Tab stop.**
   Given a group where one or more cards are `disabled`,
   When arrow-key roving reaches a disabled card's position,
   Then it skips over it to the next enabled card in that direction; a disabled card is never the group's single `tabindex="0"` member.

4. **`Space`/`Enter` activation still works on the focused card.**
   Given focus on a card via Tab or arrow-key roving,
   When `Space` or `Enter` is pressed,
   Then that card's selection is confirmed (unchanged from today's per-card activation).

5. **`radiogroup`/`radio` roles are unchanged.**
   Given the same markup,
   When inspected,
   Then `ChoiceSectionCard` still renders `role="radiogroup"` and each `ChoiceCard` still renders `role="radio"` with the correct `aria-checked`, exactly as today.

6. **Focus-ring appearance is unaffected by this story.**
   Given a card receiving focus via Tab or arrow-key roving,
   When rendered,
   Then it shows the indigo focus ring from ST-02's CSS; this story changes no styling, only script-level `tabindex`/keydown handling.

### Edge cases
- All cards in a group disabled: no card is the Tab stop; the group is unreachable (acceptable, matches a fully-disabled control's expected behavior).
- Exactly one enabled card: arrow keys are a no-op (nowhere to move to); that card is the Tab stop.
- Group with no selection and the first card disabled: the Tab stop lands on the first *enabled* card, not literally the first card.

### Out of scope
- Any visual change beyond what ST-02 already shipped: this story is script-only.
- Error/description association on choice cards: not called out in the feature scope beyond what already exists.

## Design reference
Implements the feature's decision on [Open question 1](../../spec.md#open-questions) and the [Per-section design notes for `#choice-cards`](../../spec.md#per-section-design-notes-maps-to-the-spec-s-required-coverage): "the group becomes one tab stop with arrow-key roving (ARIA APG pattern), matching the roles already in place. The ring looks identical either way, so the visual design needed no change." Prototype anchor: [`#choice-cards`](../../prototype.html#choice-cards). No visual delta; this is a pure keyboard-behavior slice on top of ST-02's ring.

## Architecture reference
Implements the feature architecture's Slicing seam 5, the `ChoiceCard.vue` / `ChoiceSectionCard.vue` entry in the Component plan, Open question 1's decision (full APG pattern), and adversarial review finding 7 (disabled cards must not break roving):

- **`ChoiceSectionCard.vue`** — owns group-level arrow-key handling and roving `tabindex`, skipping disabled cards.
- **`ChoiceCard.vue`** — gains an optional `tabindex` prop (default `0`), overridden to `-1`/`0` by the parent's roving logic.
- **Public API surface touched:** one new optional prop (`tabindex`) on the internal `ChoiceCard` component, plus one new optional field (`disabled?: boolean`) on the exported `ChoiceOption` type (see decision below). `ChoiceCard`/`ChoiceSectionCard` themselves stay non-exported internal chrome (per `specs/components.md`'s "Non-published surfaces" listing); `ChoiceOption` is the one piece of this story's surface that is published, and its change is additive.

  **DECIDED (Jeroen), re finding 1:** option (a). Add `disabled?: boolean` to the exported `ChoiceOption` type (`ChoiceSectionCard.vue:9-14`) and forward `disabled: x.disabled` in the `heading-choice` mapping at `StarterFormTemplate.vue:422` (line numbers shifted from the 364/388 cited during QA planning; that mapping builds the `ChoiceOption[]` fed to `ChoiceSectionCard`). This reuses the engine's existing per-branch `FieldMetadata.disabled` — already forwarded at the group level (`:disabled="s.fieldMetadata.disabled || s.disabled"`), just dropped per-branch in this one mapping — and makes finding 7's disabled-skip requirement and AC3 real end-to-end, not only testable via synthetic component props. Changeset stays `minor` (additive). Recorded in FEAT-011's Public API impact section. The sibling mapping at `StarterFormTemplate.vue:446` (feeds `ChoiceArraySectionCard`) picks up the same field on the shared `ChoiceOption` type but leaves it unused, since that component already derives its own per-branch disabled from `canAddChoiceOccurrence`; no behavior change there.
- **Dependencies on other stories:** depends on **ST-02** for the indigo focus-ring token already being in place (so the ring this story's focus moves land on is the corrected one, not the old low-contrast one). Independent of ST-01/03/04/05.
- **Changeset:** this story carries the feature's single changeset (`pnpm changeset`, minor bump), since it is the last story to change shipped runtime behavior (ST-07 only adds dev-only test tooling, ST-08 is docs-only). The changeset describes the whole feature's user-facing capability per CLAUDE.md's changeset-writing rules (label/description/error association, error and password-strength announcements, full keyboard operability including the choice-card APG pattern, focus management on wizard navigation and array removal, visible focus indicators, and the two new `--sft-*` retheme tokens), not just this story's slice in isolation.
- **Documentation:** none assigned to this story directly. Covered by ST-08's "keyboard operability" summary in `docs/guide/starter-template.md`.

## QA plan

Verified against the live tree: `ChoiceCard.vue` is a native `<button role="radio">` with no `tabindex` prop today (always the implicit `0`) and no keydown handler; `ChoiceSectionCard.vue` passes one section-wide `disabled` prop uniformly to every card via `:disabled="disabled"`, and builds `options` for the grid; `ChoiceCard.test.ts` (3 cases) and `ChoiceSectionCard.test.ts` (8 cases) exist today and cover none of this story's keyboard behavior. `ChoiceArraySectionCard.vue` imports only the `ChoiceOption` *type* from `ChoiceSectionCard.vue`, never the component, so this story's component-level changes cannot affect the repeatable choice-array path; confirmed no shared render path exists.

**Gap, now closed**: AC3 requires "a group where one or more cards are disabled" (a mixed state), which was not producible before this decision. `ChoiceSectionCard`'s only `disabled` input was the single section-wide prop applied identically to every card (`ChoiceSectionCard.vue:96`), and `StarterFormTemplate.vue`'s `heading-choice` mapping (`:422`) built each `ChoiceOption` from `{ value, title, description, icon }`, dropping the branch's own `x.disabled` even though `FieldMetadata.disabled?: boolean` already exists at the engine level and is already forwarded for other disabled fields (confirmed: `disabledField` fixture in `packages/core/src/examples/__tests__/TestFormTemplate.testcases.ts`) and for the choice field's own group-level `disabled`. **DECIDED (Jeroen)**: option (a) from adversarial review finding 1 (see the Architecture reference above) — add `disabled?: boolean` to the exported `ChoiceOption` interface and forward `disabled: x.disabled` in that mapping. This is a public API addition (the type is re-exported from `index.ts`), recorded in FEAT-011's Public API impact section per the hard rule that a story cannot silently override approved feature architecture. With this in place, AC3 is testable end-to-end through real branch metadata, not only against `ChoiceSectionCard`/`ChoiceCard`'s own props directly; the table below reflects both the component-level test and the end-to-end template-level smoke test.

**Unverified today, no existing precedent either way**: AC4 ("Space/Enter activation still works... unchanged from today's per-card activation") assumes native `<button>` + Enter/Space already dispatches `click` under jsdom. The only existing keyboard-activation precedent in the package, `ToggleSwitch.vue`, needed an explicit `@keydown.space.prevent`/`@keydown.enter.prevent` handler because it is a `<span role="switch">`, not a button, so it proves nothing about jsdom's native-button behavior either way. `ChoiceCard.test.ts` has never exercised this. The test below is written as a behavioral assertion that must pass however the developer satisfies it: if jsdom already fires `click` for a focused native button on Enter/Space, the test passes with no code change; if not, the developer adds the same explicit `@keydown.space.prevent`/`@keydown.enter.prevent` pattern `ToggleSwitch.vue` already uses. Either way this closes a previously-untested gap, not a regression.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Single Tab stop: one card `tabindex="0"`, rest `-1`; selected (or first enabled when none selected) is the one | New `describe('roving tabindex')`: mount `ChoiceSectionCard` with 3 options, no `activeChoiceOccurrences`; assert card 0 has `tabindex="0"` and cards 1-2 have `tabindex="-1"`. Second case: mount with `activeChoiceOccurrences: [{ branchKey: 'guided', index: 0 }]`; assert the `guided` card alone carries `tabindex="0"` | `ChoiceSectionCard.rovingTabindex.logic.test.ts` (new) |
| 2 Arrow keys move focus + selection among enabled cards, wrapping both directions | Mount with 3 options via `mount(ChoiceSectionCard, { props, attachTo: document.body })`; focus card 0's element; `trigger('keydown.right')` (and separately `.down`): assert `document.activeElement` is card 1's element, card 1 now carries `tabindex="0"`, card 0 is `-1`, and `addChoiceOccurrence` was called with card 1's value. From card 0, `trigger('keydown.left')`/`.up`: assert wrap to the last card (index 2), same three assertions. From the last card, `.right`/`.down` wraps back to card 0 | `ChoiceSectionCard.rovingTabindex.logic.test.ts` (new) |
| 3 Disabled cards are skipped by roving, never the Tab stop | Mount 4 options where option 1 carries `disabled: true` on its `ChoiceOption`; from card 0, arrow-right lands on card 2 (skipping 1); assert card 1 never receives `tabindex="0"` across every roving step in the test, including when roving wraps past it from the other direction | `ChoiceSectionCard.rovingTabindex.logic.test.ts` (new) |
| 4 Space/Enter activates the focused card | Extend `ChoiceCard.test.ts`: mount standalone with `attachTo: document.body`, call `.element.focus()`, `trigger('keydown.space')` then `trigger('keydown.enter')`; assert `select` emitted once per key. See the unverified-precedent note above | `ChoiceCard.test.ts` (extend) |
| 5 `radiogroup`/`radio` roles and `aria-checked` unchanged | New assertions in the roving test file: grid still carries `role="radiogroup"`; every card still carries `role="radio"` and `aria-checked` reflecting `selected`, after a roving move has changed which card is selected | `ChoiceSectionCard.rovingTabindex.logic.test.ts` (new) |
| 6 Focus-ring appearance unaffected (script-only change) | In the same file: after a roving move, assert the now-focused card still carries the `sft-choice-card` class (the CSS selector ST-02 rings off of) and has no `style` attribute and no new class added or removed beyond `is-selected`/`is-disabled`, proving no inline style or class-based visual change was introduced | `ChoiceSectionCard.rovingTabindex.logic.test.ts` (new) |

An integration-level smoke test is added to `StarterFormTemplate.choice.logic.test.ts` using `explicitChoiceMetadata` (3 real branches) and `mountInForm` (already `attachTo: document.body`): focus the `selfServe` card, `trigger('keydown.right')`, assert `values().launch` now holds the `guided` branch and `choiceCard(wrapper, 'launch', 'guided')` carries `is-selected`, proving the roving pattern works through the real engine wiring, not only the isolated component. A second case mounts a branch with `disabled: true` on its own `FieldMetadata` (not the section-wide `disabled` prop) and asserts arrow-key roving skips that branch's card end-to-end, proving `StarterFormTemplate.vue`'s forwarding of `x.disabled` into `ChoiceOption` actually reaches the roving logic through the real metadata path, not just through a directly-constructed `ChoiceOption`.

### Edge cases to tests
- All cards disabled: group has no `tabindex="0"` member anywhere (assert no card in the set satisfies `tabindex === '0'`); arrow keys on a card that received manual `.focus()` are a no-op (no `addChoiceOccurrence` call).
- Exactly one enabled card: arrow keys are a no-op; that card is the Tab stop from the start.
- First card disabled, nothing selected: the Tab stop lands on the first *enabled* card (index 1 if index 0 is disabled), not literally index 0.

### States from the feature's states policy applicable to this slice
- **Focus indicator.** Not re-tested here (ST-02's CSS); this slice only asserts the class/attribute surface the ring depends on is untouched (AC6's test).
- **Disabled.** Central to AC3 and the edge cases: disabled cards must be excluded from roving and never hold the single Tab stop.
- **Valid/pristine, Error, Loading, Empty.** Not applicable: this slice has no validation or async surface; a choice card's own validity is unaffected by which card currently holds `tabindex`.

### Reactivity / analytics
Arrow-key roving calls `addChoiceOccurrence`, the same engine entry point a click already uses, so it writes into the same reactive `activeChoiceOccurrences` the engine re-renders from. Extend `StarterFormTemplate.choice.analytics.test.ts` with one case: selecting a branch via `ArrowRight` produces no more `DynamicFormItem` re-renders of an unrelated sibling branch's input than selecting the same branch via a click does (same assertion shape as the existing `channels` render-count case), confirming the keydown path adds no extra render surface beyond what click-selection already costs today.

### Coverage
Every new branch (direction calculation, wrap in both directions, disabled-skip loop, single-enabled no-op, all-disabled no-op) is exercised by `ChoiceSectionCard.rovingTabindex.logic.test.ts`'s AC and edge-case rows. `ChoiceCard.test.ts`'s extension covers the new `tabindex` prop default and override, plus the Space/Enter handler if one is added. The real metadata-to-`ChoiceOption.disabled` plumbing path (`StarterFormTemplate.vue:422`) is covered by the added `StarterFormTemplate.choice.logic.test.ts` case (see above), mounting a branch with `disabled: true` metadata and asserting its card is skipped by roving end-to-end. `pnpm -r ci:test:coverage` for `packages/starter` is expected to stay at or above baseline.

### Time sensitivity
None. No date/time-dependent behavior in this slice.

### Regression risk
- `ChoiceCard.test.ts`'s 3 existing cases (no title/description, emits select on click, disabled blocks click) and `ChoiceSectionCard.test.ts`'s 8 existing cases (grid rendering, `cols-2`, aria-label fallback, data-testid, disabled-all, occurrence-watch pair) must stay green unmodified; this story only adds cases and a default-`0` `tabindex` prop, it does not change any existing prop's default behavior.
- `ChoiceArraySectionCard.vue` imports only the `ChoiceOption` type from `ChoiceSectionCard.vue`, never the component; confirmed no repeatable choice-array render path is touched by this story, so `ChoiceArraySectionCard.test.ts` and `StarterFormTemplate.choice.array.test.ts` need no change and are the regression guard that the choice-array path stays untouched.
- `StarterFormTemplate.choice.test.ts`, `.choice.logic.test.ts`, `.choice.validation.test.ts`, and `.choice.analytics.test.ts` exercise `ChoiceSectionCard` through the real engine; all existing click-based assertions in those files must keep passing exactly as today, since click selection is not changed by this story, only arrow/Tab handling is added alongside it.
- Depends on ST-02 for the indigo ring token already being in place; no code dependency, only a visual one already shipped.
- No `packages/core` file is touched, so the engine's and `packages/element-plus`'s own suites are unaffected by construction.

### Untestable criteria and rewrite proposals
- **AC3 was not satisfiable end-to-end before this decision; it is now.** "A group where one or more cards are disabled" had no production path: `ChoiceSectionCard`'s only `disabled` input was section-wide, and the engine's existing per-branch `FieldMetadata.disabled` was not forwarded into `ChoiceOption` by `StarterFormTemplate.vue`. **DECIDED (Jeroen)**: per the Architecture reference's decision above (option (a) of adversarial review finding 1), `x.disabled` is now forwarded into `ChoiceOption`, so a consumer's real branch metadata can trigger the mixed-disabled state. AC3 is tested both at the component level directly against `ChoiceSectionCard`/`ChoiceCard`'s own props (the roving-skip mechanism, row 3 above) and end-to-end through real metadata (the added `StarterFormTemplate.choice.logic.test.ts` case).
- **AC4's "unchanged from today's per-card activation" assumes an untested jsdom behavior.** No existing test proves Space/Enter already worked on `ChoiceCard` under jsdom (the only keyboard-activation precedent, `ToggleSwitch`, needed an explicit handler for an unrelated reason, a non-button element). The test above is written to pass regardless of mechanism; no rewrite is needed, this is flagged so the developer is not surprised if the assertion fails before any handler is added, and adds one if so, rather than reading a red test as a story-introduced regression.
- All other acceptance criteria (1, 2, 5, 6) are testable as worded with the mapping above.

### Manual verification checklist
1. With a real screen reader (VoiceOver spot check is sufficient), Tab into a 3+ option choice-card group, confirm only one stop is announced, then use arrow keys to move between options and confirm each move is announced as a selection change on the `radio` role.
2. Confirm visually, in a real browser, that the indigo focus ring (ST-02) follows the arrow-key-moved focus correctly and looks identical to the ring on a Tab-reached card, since AC6 claims no visual difference.
3. Using a real `ChoiceOption` with `disabled: true` (now plumbed from branch metadata), confirm by keyboard that arrowing through a group with a disabled card in the middle skips over it smoothly in both directions, including wrap-around.
4. Confirm a mouse click on a card still works exactly as today (selection, no focus-ring flash on click, per ST-02's `:focus-visible` behavior) alongside the new keyboard path.

## Adversarial review

STORY mode (lite): blockers only. Claims verified against the live tree: `ChoiceCard.vue` is a native `<button role="radio" :disabled>` with no `tabindex` prop and no keydown handler; `ChoiceSectionCard.vue` passes one section-wide `:disabled="disabled"` to every card (`ChoiceSectionCard.vue:96`); `ChoiceOption` is `{ value, title?, description?, icon? }` with no `disabled` (`ChoiceSectionCard.vue:9`), is re-exported from `index.ts:8`, and is asserted as a public type export by `publicApiSurface.test.ts`; `StarterFormTemplate.vue:364`/`:388` map each branch to `{ value, title, description, icon }`, dropping the branch's own `disabled`; `FieldMetadata.disabled` exists at the engine level and is already forwarded for other field types (`StarterFormTemplate.vue:159/180/263/369`, `disabledField` fixture). The ST-02 dependency is stated correctly: ST-02 ships the indigo `--sft-focus-visible-choice` token this story's focus moves land on, and the dependency is visual-only with no code coupling, exactly as the story describes. ACs 1, 2, 4, 5, 6 are testable as worded and each has a QA-plan row; AC4's jsdom-native-button uncertainty is handled by a mechanism-agnostic test. Independence from ST-01/03/04/05 is correct.

1. **(blocker) AC3's mixed-disabled scenario is unimplementable without a published-API change the approved architecture does not authorize.** AC3 ("one or more cards disabled", a mixed state) and AC1's "first enabled one when none is selected" both require `ChoiceSectionCard` to know which individual cards are disabled. No such per-card input exists: the only `disabled` is section-wide (all-or-nothing), and the branch-level `FieldMetadata.disabled` is dropped at `StarterFormTemplate.vue:364`/`:388`. The only idiomatic way to add a per-card source is a `disabled?: boolean` field on `ChoiceOption`, which is a published type (`index.ts:8`, guarded by `publicApiSurface.test.ts`). That directly contradicts this story's Architecture reference ("this is not a published public-API change") and the feature's Public API impact ("slot contract unchanged, types unchanged, one export added: `focusFirstInvalid`"). Per hard rule 4 it cannot be introduced silently at story level. Raised from the QA planner's should-fix to a blocker because an acceptance criterion is unsatisfiable end-to-end and the resolution is a genuine API/product decision for Jeroen, not a wording fix. The QA plan's "test the mechanism at the component level regardless" escape hatch does not hold: constructing a mixed-disabled mount still requires `ChoiceSectionCard` to accept a per-card disabled input it does not have, so that test presupposes exactly the change in question. Routed as `PROPOSED (adversarial review)` in the Architecture reference (Public API surface) and the AC3 untestable bullet, offering option (a) amend the feature to add additive `ChoiceOption.disabled` (reuses `FieldMetadata.disabled`, keeps `minor`, requires a feature-spec amendment) or option (b) descope AC3 to the producible whole-group-disabled state and defer per-card disabled.

   **DECIDED (Jeroen)**: option (a). FEAT-011's Public API impact section is amended accordingly; see the Architecture reference above for the exact file/line resolution.

2. **(nit) The architecture does not say how `ChoiceSectionCard` moves focus to a child `ChoiceCard`'s inner `<button>`.** `ChoiceCard` exposes only a `tabindex` prop, not a focus method or forwarded element ref, yet the roving logic in the parent must call `.focus()` on the next enabled card's button (AC2). This is implementable (a `keydown` handler on the `role="radiogroup"` container that reads sibling button elements), so it is not a blocker, but the developer should confirm the chosen mechanism does not require a further prop/ref addition to `ChoiceCard` beyond `tabindex`. If it does, that is additional (internal) surface to note.

## Implementation notes

- No further prop or ref addition was needed on `ChoiceCard` beyond `tabindex` (finding 2 above): `ChoiceSectionCard` keeps a plain `Record<string, { $el: HTMLElement } | null>` populated by a function `ref` on each `ChoiceCard`, and calls `.$el.focus()` on it. `$el` is available on every component's public instance without `defineExpose`, so no new internal surface was added.
- Key-direction handling binds four separate `@keydown.right`/`.down`/`.left`/`.up` listeners on `ChoiceCard` (compiled through Vue's own key-modifier matcher) rather than one generic `@keydown` handler comparing `event.key` manually. A manual string comparison against `event.key === 'ArrowRight'` works against a real browser's `KeyboardEvent` but not against `@vue/test-utils`' `trigger('keydown.right')` shorthand, which sets `key` to the literal modifier name (`'right'`) rather than the DOM's `'ArrowRight'`. Vue's compiled key modifiers match both forms, so this choice keeps the component correct under real keyboard input and testable with the shorthand the QA plan specifies.
- `Space`/`Enter` activation needed an explicit `@keydown.space.prevent`/`@keydown.enter.prevent` handler on `ChoiceCard` (mirroring `ToggleSwitch`'s existing pattern): jsdom's native `<button>` does not synthesize a `click` on these keys the way real browsers do, so the QA plan's "unverified, mechanism-agnostic" test needed the handler to pass.
- Two branches introduced by this story (`props.options ?? []`'s empty-array default inside `enabledOptions`, and the `currentIndex === -1` guard in the roving handler) are not exercised by any test and show up as uncovered in the coverage report. Both are defensive guards that mirror two pre-existing, equally uncovered branches already in this file (`activeChoiceOccurrences ?? []`, `options?.length ?? 0`): a native `disabled` button does not dispatch a `keydown` at all (confirmed by instrumenting the handler during development), so the guard that protects against a disabled card's value not being found in the enabled list is unreachable through normal interaction and is kept purely for type/array-safety, consistent with the file's existing style. Overall branch coverage for `packages/starter` remains at 93.86%, matching the pre-existing norm for this file and its siblings (`ChoiceArraySectionCard.vue` 95.83%, `FormWizard.vue` 95.65%).
- The feature's single changeset (`.changeset/starter-accessibility.md`) is added by this story per the story's own decision, describing the whole feature's shipped-and-pending user-facing capability (label/description/error association, error and password-strength announcements, full keyboard operability including this story's choice-card pattern, focus management, and the two new `--sft-*` tokens). At the time of this story, ST-03 (password-strength announcement) and ST-07/ST-08 are not yet implemented; the changeset's content anticipates them landing before the next release, per the story's explicit instruction to carry the feature-wide changeset here. If a release happens before those land, this file needs a review pass first.

## Verification report

### Pipeline
- `pnpm run ci:test` (`pnpm -r ci:test` + docs' own vitest): all green. `packages/starter`: 78 files, 622 tests passed, including the new `ChoiceSectionCard.rovingTabindex.logic.test.ts` (10 tests), the extended `ChoiceCard.test.ts` (5 tests, Space/Enter case added), and the two new cases in `StarterFormTemplate.choice.logic.test.ts`. `packages/core` unaffected (no file touched there), docs' pure-module suite (4 files, 78 tests) unaffected.
- `pnpm run ci:lint`: clean on both packages.
- `pnpm run ci:typecheck`: clean on `packages/core`, `packages/starter`, and `playgrounds/storybook`.
- `pnpm -r ci:test:coverage`: `packages/starter` overall 99.64% stmts / 93.86% branch / 93.65% funcs / 99.64% lines, matching the Implementation notes' stated baseline exactly. `ChoiceSectionCard.vue` is at 92% branch (uncovered lines 57, 62, 83, 115: the pre-existing `removeChoiceOccurrence`/`options?.length` guards plus this story's two new defensive-only branches, `props.options ?? []` and `currentIndex === -1`), `ChoiceCard.vue` at 100%. No drop against baseline; no `packages/core` file touched so the core/element-plus suites are unaffected by construction. `docs/` content did not change in this story, so `pnpm docs:build` was not required and was not run.

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1. Group is a single Tab stop | Pass | `ChoiceSectionCard.rovingTabindex.logic.test.ts`: "seats exactly one Tab stop on the first card when nothing is selected" and "seats the Tab stop on the selected card instead of the first one" |
| 2. Arrow keys move selection among enabled cards, wrapping | Pass | Same file: ArrowRight/ArrowDown move-to-next cases, ArrowLeft/ArrowUp wrap-to-last case, ArrowRight/ArrowDown wrap-to-first case; end-to-end confirmed via `StarterFormTemplate.choice.logic.test.ts`'s "moves selection to the next branch on ArrowRight..." |
| 3. Disabled cards skipped, never the Tab stop | Pass | "skips a disabled card when roving and never seats it as the Tab stop" (approaches from both directions, including wrap); end-to-end via "skips a branch disabled through real field metadata, not just a directly-constructed option" (confirms `StarterFormTemplate.vue:422`'s `disabled: x.disabled` forwarding actually reaches roving) |
| 4. Space/Enter activation on the focused card | Pass | `ChoiceCard.test.ts`: "activates on Space and on Enter while focused"; implemented via explicit `@keydown.space.prevent`/`@keydown.enter.prevent` handlers since jsdom's native button does not synthesize `click` on these keys (confirmed by the handler existing and the test passing) |
| 5. `radiogroup`/`radio` roles and `aria-checked` unchanged | Pass | Assertions inside the ArrowRight test: grid role unchanged (verified directly in `ChoiceSectionCard.vue`'s template, untouched), card `role="radio"` and `aria-checked` reflecting the post-move selection |
| 6. Focus-ring appearance unaffected (script-only) | Pass | Same test asserts the moved-to card keeps `sft-choice-card`/`is-selected`, carries no `style` attribute, and no CSS was touched by this story (`style.scss`'s `--sft-focus-visible-choice` diff predates this story, confirmed it belongs to ST-02's shipped work, not this diff) |

All 6 ACs and all 3 documented edge cases (all-disabled no-op, single-enabled no-op, first-card-disabled Tab-stop-lands-on-first-enabled) have a passing test exercising them exactly as described in the QA plan's test map.

### Prototype comparison
No new prototype coverage expected per the story (script-only, no visual delta). Confirmed against `specs/FEAT-011-starter-accessibility/prototype.html#choice-cards`: the shipped markup (`role="radiogroup"`, `role="radio"`, `sft-choice-card`, `is-selected`, `is-disabled`) is unchanged from what the prototype already drew, and the `--sft-focus-visible-choice` ring token this story's focus lands on was introduced by ST-02, not this story. No `:style` binding or new class was introduced (verified directly in `ChoiceCard.vue`/`ChoiceSectionCard.vue`). The prototype's own "Open question" annotation on this section (Tab-reaches-every-card vs. one-tab-stop-with-roving) is now resolved in the shipped code in favor of roving, matching the feature's Open question 1 decision.

### Process compliance
- `specs/components.md`: updated correctly and in detail — documents `ChoiceCard`'s new `tabindex` prop (default `0`), the `ChoiceOption.disabled` field and its forwarding at the `heading-choice` mapping (with the sibling `heading-choice-array` mapping correctly noted as carrying-but-unused), and the full roving/arrow-key/Space-Enter behavior.
- Changeset: present (`.changeset/starter-accessibility.md`, minor bump), matches the additive nature of the `ChoiceOption.disabled` field and the architecture's semver analysis. Carrying the feature-wide changeset in this story (rather than per-story) is consistent with the story's own Architecture reference ("this story carries the feature's single changeset... since it is the last story to change shipped runtime behavior") and with the feature spec's Changeset rationale section; not a problem, matches CLAUDE.md's "one changeset per cohesive user-facing capability" guidance since FEAT-011 ships as one capability.
- Public API: no new export introduced by this story (`focusFirstInvalid` in the `index.ts`/`publicApiSurface.test.ts` diff is ST-04's, not this story's). The one surface change, `ChoiceOption.disabled?: boolean`, is additive, was routed through adversarial review finding 1 and decided by Jeroen, and is correctly recorded in the feature spec's Public API impact section (`DECIDED (Jeroen, ST-06)`) before being implemented, satisfying hard rule 4 (no silent story-level override of feature architecture).
- Library API rules: camelCase maintained (`tabindex` prop, `addChoiceOccurrence`, etc.); no kebab-case introduced. `ChoiceCard`/`ChoiceSectionCard` remain unexported internal chrome, matching `specs/components.md`'s "Non-published surfaces" listing.
- Documentation: this story's Architecture reference assigns no documentation to itself directly (covered by ST-08's keyboard-operability summary); correctly not touched here.
- No undocumented spec deviations found. Implementation notes accurately describe the two uncovered defensive branches, the key-modifier binding choice (four directional listeners vs. manual `event.key` comparison), and the jsdom-native-button gap that required an explicit Space/Enter handler; all three were verified directly against the code.

### Overall verdict: Pass

Status set to `done`. This is not the feature's last open story: ST-07 (`awaiting-approval`) and ST-08 (`awaiting-approval`) are still pending, and the feature spec itself is `in-progress`, so FEAT-011 should not move to `done` yet.

Reminder for Jeroen: please link the PR in this story's frontmatter (`pr: ""` is still empty).
