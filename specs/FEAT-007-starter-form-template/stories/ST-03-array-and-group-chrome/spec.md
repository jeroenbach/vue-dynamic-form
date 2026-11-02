---
id: ST-03
type: story
feature: FEAT-007
status: done
approved_by: Jeroen
pr: ""
---

# Story: Array and group chrome

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen individually. Override any of these freely.

- Blocker 1 → groups render through `GroupField` alone (`sft-choice-group-title`/`-body`), not `SectionCard`/`sft-section*`; the approved Design mapping table already says so
- Should-fix 2 → `ArrayField` keeps its count pill (`sft-pill`), lacking only the empty-state card; corrected against the ported component's own source, feature Decision C updated to match
- Nit 3 → group description class collapsed to `sft-field-desc` only

## Functional

### User story

As a library consumer whose metadata has repeatable sections or grouped fields, I want `StarterFormTemplate` to render them with the same chrome the docs' Advanced example already shows (count pill, dashed empty-state card, add/remove, section grouping), so arrays and groups look complete without me building any of it.

### Acceptance criteria

1. **Groups render through `GroupField`.** Given a parent/group node (non-array, non-choice, `children` non-empty), when rendered, then it renders through the recursive `default`/`heading` dispatch already wired in ST-02, styled by `GroupField` with `sft-choice-group-title` (label), `sft-field-desc` (description), and `sft-choice-group-body` (the shared grid) classes, and `sft-hide-tag` on that grid suppresses the per-field optional/required marker on items inside array/group containers that set it. `GroupField` does not render through `SectionCard`; `SectionCard` is built in this story only as `ArraySectionCard`'s wrapper.

   > **DECIDED (research) - resolves finding 1.** Corrected from an earlier draft that routed groups through `SectionCard` with `sft-section*` classes. The prototype's `#group` section (a standalone `<section>`, not a card) and the feature's Component/pattern mapping table both style the group this way; this is a direct read of the already-approved Design mapping table, not a new call. The Coverage section's "groups never pass `tag`" premise already assumed no `SectionCard` for groups, so it needs no change.
2. **Inline arrays render through `ArrayField` on `default-array`.** Given a non-heading array node (`maxOccurs > 1`, no `heading` type), when rendered, then the `default-array` slot renders `ArrayField`'s lighter chrome: label, description, an item-count pill (`sft-pill`), add button, `sft-grid`/`sft-col-span`, `sft-array-footer`, with no empty-state card (Decision C, corrected).

   > **DECIDED (research) - resolves finding 2.** The behavioural source `docs/.vitepress/theme/components/ArrayField.vue` renders an item-count pill (the indigo `{{ itemsLength }} items` span, identical styling to `sft-pill`); it lacks only the empty-state card. Corrected in the feature's Decision C (see that section's own `DECIDED (research, story prep)` note): this is a factual correction verified against the ported component's source, following the Design section's own rule that the existing docs components win on behaviour where this spec's prose disagrees with them, not a design change needing Jeroen's sign-off.
3. **Heading-declared arrays render through `ArraySectionCard` + `RepeaterCard` on `heading-array`/`heading-array-item`.** Given an array node declared as a `heading` section, when rendered, then the `heading-array` slot renders `ArraySectionCard`'s richer chrome (`sft-pill` count, `sft-empty` card when zero items, `sft-section`/`sft-grid`), and each item renders through `heading-array-item` via `RepeaterCard` with `sft-repeater`/`-header`/`-title-group`/`-badge`/`-title`.
4. **Decision C is honored: both components ported, not consolidated.** Given the two slot targets from criteria 2 and 3, when compared, then `default-array` and `heading-array` each render their own distinct component (no shared/merged component), matching today's `AdvancedFormTemplate` slot usage with no change.
5. **Empty state.** Given a `heading-array` with zero items (or below `minOccurs`), when rendered, then `sft-empty` shows its icon (via `StarterIcon`), title, hint, and a primary "Add" `AppButton`, and clicking it adds one item.
6. **Section-level error state.** Given a `heading-array` below its `minOccurs`, when the section is validated, then the section header shows `sft-error`, distinct from any per-field `sft-error`.
7. **Add/remove update the array correctly.** Given a `heading-array` with items, when the add button is clicked, then an item is appended at the end; when an item's remove control is clicked, then that item is removed and remaining items keep their relative order (no renumbering surprises beyond what the engine already guarantees).
8. **The icon slot still reaches this slice's glyphs.** Given the wrapper pattern from ST-02, criterion 9, when a `#icon` override is supplied, then the empty-state icon and any `RepeaterCard`/`ArraySectionCard` icon (for example the remove/trash glyph) use the override instead of the Lucide default.
9. **No Tailwind classes, no `<style scoped>`, classes exist in the stylesheet.** Given `GroupField`, `SectionCard`, `ArrayField`, `ArraySectionCard`, `RepeaterCard`, when scanned, then none contains a Tailwind utility class or `<style scoped>`, and every referenced `sft-`/`is-*` class exists in ST-01's stylesheet.
10. **`specs/components.md` entry is extended** to note the array/group chrome is in place (no new public export: these components stay internal per ADR 4).
11. **Code hygiene.** No spec/process references, no em dashes, camelCase Vue identifiers; `pnpm run ci:lint`, `ci:typecheck`, `ci:test` pass for `packages/starter`.

### Edge cases

- An array at exactly `minOccurs` with `minOccurs > 0`: no empty state, no section error.
- A group with no `description`: `sft-field-desc` region is simply absent, no empty element rendered.
- Removing the only item below `minOccurs`: the engine's own occurrence rules govern whether removal is even allowed; this story only asserts the chrome reflects whatever state the engine reports, it does not add new occurrence logic.

### Out of scope

- Choice chrome (including `ChoiceArraySectionCard`'s reuse of `sft-pill`/`sft-repeater`): next story.
- Wizard, review, success chrome.
- Dogfooding, Storybook, package README, publish flip.

## Design reference

[`../../prototype.html#group`](../../prototype.html#group), [`#array-empty`](../../prototype.html#array-empty), [`#array-filled`](../../prototype.html#array-filled). No new design; the prototype's richer `ArraySectionCard`/`RepeaterCard` path is the one visualised there (per the feature design note), `ArrayField`'s lighter chrome has no dedicated prototype section and is ported from the existing docs component and the Component/pattern mapping table's class list alone.

## Architecture reference

Implements the **arrays+groups** structural shape of slicing seam 2, per the architecture's invitation to sub-split. Builds: `GroupField`, `SectionCard`, `ArrayField`, `ArraySectionCard`, `RepeaterCard` (all internal, not exported, per ADR 4). Implements Decision C exactly (port both, keep the two-slot wiring, no consolidation) and the empty/error states from the feature's States policy section.

Files: `packages/starter/src/GroupField.vue`, `src/SectionCard.vue`, `src/ArrayField.vue`, `src/ArraySectionCard.vue`, `src/RepeaterCard.vue`, tests, `specs/components.md`.

Depends on ST-02 (`StarterFormTemplate` shell, metadata catalogue, icon provide/inject wiring). ST-04 depends on this story (`ChoiceArraySectionCard` reuses `sft-pill`/`sft-repeater` conventions this story establishes). No changeset: no `packages/core/src/` change; package stays private.

## QA plan

Mirrors `packages/element-plus/src/__tests__` conventions, in particular `ElementPlusFormTemplate.array*.test.ts` and `.arraySlots.logic.test.ts` (the override-slot and per-type-slot describe blocks), adapted to Decision C's two distinct components. All new tests live in `packages/starter/src/__tests__/`. No `TZ`-sensitive behaviour in this slice; `Europe/Amsterdam` only matters because `ci:test:coverage` sets it globally.

### Fixtures and test utilities

- New: `fixtures/arrayHelpers.ts`, adapted from element-plus's (`section`, `addButton`, `removeButtons`, `itemCards`, `inputValues`, `isDisabled`), plus a `groupMetadata`/`inlineArrayMetadata`/`headingArrayMetadata` set of field trees sized for this slice (a non-heading `maxOccurs > 1` text array for `default-array`, a `heading`-typed array with `minOccurs` for `heading-array`, and a parent/group node with `children`).
- Reused from ST-02: `fixtures/mountInForm.ts`, `fixtures/createConsumerWrapper.ts` (extended there with the `icon` override, reused unchanged here), `fixtures/renderCount.ts`, `helpers/sourceScan.ts`. This story must not duplicate or re-declare any of them.
- No `packages/core/src/examples/` fixture needed: field-tree fixtures stay small and local, matching ST-01/ST-02 precedent.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Groups render through `GroupField`, `sft-hide-tag` suppresses the tag | Mount a group/parent field, assert `sft-choice-group-title` (label) and `sft-choice-group-body` (grid) appear, `sft-hide-tag` is present on that grid when the group sets it; assert a group with no `description` renders no `sft-field-desc` element at all. **DECIDED (research), resolves finding 1:** no `sft-section*` or `SectionCard` assertion for the group path; see AC1. | `StarterFormTemplate.group.test.ts` |
| 2 Inline arrays render `ArrayField` on `default-array`, lighter chrome with a pill, no empty card | Mount a non-heading `maxOccurs > 1` field, assert `sft-field-label`, description, `sft-pill` showing the item count, add button, `sft-grid`/`sft-col-span` (on a `fullWidth` item), `sft-array-footer`; assert absence of any `sft-empty` element even with zero items. **DECIDED (research), resolves finding 2:** asserts `sft-pill` presence (not absence), matching the corrected Decision C and AC2. | `StarterFormTemplate.array.test.ts` |
| 3 Heading-declared arrays render `ArraySectionCard`+`RepeaterCard` on `heading-array`/`heading-array-item` | Mount a `heading`-typed array with items, assert `sft-pill` shows the count, `sft-section`/`sft-grid`; assert each item renders `sft-repeater`/`-header`/`-title-group`/`-badge`/`-title` | `StarterFormTemplate.headingArray.test.ts` |
| 4 Decision C: both components distinct, no consolidation | Mount both an inline and a heading array side by side, assert `default-array`'s root never carries `sft-empty` and `heading-array`'s root never renders through `ArrayField`-only markup (assert via `findComponent` that the two slots resolve to the two distinct components, not a shared one). **DECIDED (research), resolves finding 2:** dropped `sft-pill` from the never-carries list, since `ArrayField` legitimately carries it too; the distinguishing class is `sft-empty`, not `sft-pill`. | `StarterFormTemplate.array.test.ts` |
| 5 Empty state: icon, title, hint, Add button, click adds an item | Mount a `heading-array` with zero items, assert `sft-empty`/`-icon` (via `StarterIcon`)/`-title`/`-hint` and a primary `AppButton`; click it, assert one item is appended | `StarterFormTemplate.headingArray.logic.test.ts` |
| 6 Section-level error distinct from per-field error | Mount a `heading-array` below `minOccurs` and validate the section, assert `sft-error` on the section header is present, and independently assert a per-field `sft-error` inside an item is a separate element (not the same node) | `StarterFormTemplate.headingArray.validation.test.ts` |
| 7 Add/remove update the array correctly, order preserved | Mount a `heading-array` with 3 items, click add, assert the new item is appended last; remove the middle item, assert the remaining two keep their original relative order | `StarterFormTemplate.headingArray.logic.test.ts` |
| 8 `#icon` slot reaches the empty-state icon and `RepeaterCard`'s remove glyph | Mount via `createConsumerWrapper({ icon: ... })`, assert the custom render output appears in place of the empty-state icon and the remove-button glyph | `StarterFormTemplate.array.logic.test.ts` |
| 9 No Tailwind, no `<style scoped>`, classes exist in ST-01's stylesheet | Source scan of `GroupField.vue`, `SectionCard.vue`, `ArrayField.vue`, `ArraySectionCard.vue`, `RepeaterCard.vue` for Tailwind utility patterns and `<style scoped`; reverse-direction class-usage check that every `sft-`/`is-*` class these files reference exists in ST-01's `src/style.css` | `noTailwind.test.ts`, `noScopedStyle.test.ts`, `classUsage.test.ts` |
| 10 `specs/components.md` entry extended | Manual verification: reviewer confirms the existing ST-01/ST-02 entry gains a note that array/group chrome is in place (no new exports) | Manual |
| 11 Code hygiene | Reuses ST-01/ST-02's `sourceHygiene.test.ts` pattern, scope extended to the five files this story adds | `sourceHygiene.test.ts` |

### Edge cases to tests

- Array exactly at `minOccurs > 0`: assert no `sft-empty` and no section `sft-error`, in `StarterFormTemplate.headingArray.validation.test.ts`.
- Group with no `description`: covered under AC1 above (no empty `sft-section-desc` element).
- Removing the only item below `minOccurs`: assert only that the chrome renders whatever disabled/enabled state `canRemoveItems` reports; no new occurrence-logic assertion (engine's own test suite already covers the rule), in `StarterFormTemplate.headingArray.logic.test.ts`.

### States from the feature's states policy applicable to this slice

- **Array empty-state card** (`sft-empty` with icon/title/hint/Add button): AC5.
- **Array section-level error below minimum** (`sft-error` in the section header, distinct from field-level `sft-error`): AC6.
- **hide-optional-required on array/group items** (`sft-hide-tag` suppressing the per-field tag inside array/group containers): AC1, and re-asserted on `heading-array-item`/`default-array` item containers in `StarterFormTemplate.array.test.ts` and `StarterFormTemplate.headingArray.test.ts`.
- **disabled**: a disabled group/array dims via the opacity modifier class; asserted alongside AC1/AC2 in the same test files (ported pattern from ST-02's `StarterFormTemplate.disabled.logic.test.ts`).
- No new valid/success state in this slice (matches the feature's "no green success state" policy); no test invents one.

### Reactivity / analytics

This slice wires `DynamicFormItem`-rendered array and group/parent nodes for the first time in this package, so render-count coverage is required. `StarterFormTemplate.array.analytics.test.ts` mounts a form with an inline array and a sibling field (`settings: { analytics: true }`), asserts the array's items render exactly once after mount, then types into the sibling field and asserts the array's render count does not change. A second case adds an item and asserts only the new item's render-count element appears (no re-render of existing items). `StarterFormTemplate.headingArray.analytics.test.ts` repeats the same shape for the `heading-array`/`heading-array-item` pair, plus one assertion that toggling the empty-state Add click does not re-render an unrelated sibling field. Group nodes get one analytics case in `StarterFormTemplate.group.analytics.test.ts`: a group with two children, typing into one child does not bump the sibling child's render count.

### Coverage

`packages/starter` keeps its own baseline (per ST-01); `pnpm -r ci:test:coverage` must still pass workspace-wide. Every file this story ships (`GroupField.vue`, `SectionCard.vue`, `ArrayField.vue`, `ArraySectionCard.vue`, `RepeaterCard.vue`) gets direct coverage through the AC-to-test map above. One deliberate gap: `SectionCard`'s `tag` slot path when `tag` is omitted (groups never pass `tag`) is covered by `ArraySectionCard`'s own test instead, since `ArraySectionCard` is the only consumer that sets `tag`; no separate `SectionCard.test.ts` is added beyond what `StarterFormTemplate.group.test.ts` and `StarterFormTemplate.headingArray.test.ts` already exercise, because `SectionCard` has no standalone export and no behaviour beyond what its two consumers show.

### Regression risk

- ST-02's `FormField`, `AppButton`, `ErrorMessage`, `OptionalRequiredTag`, `StarterIcon` are consumed, not modified; their own suites remain the regression guard. This story's tests mount through the real components rather than stubbing them, so a future ST-02 change to, for example, `ErrorMessage`'s rendering surfaces here as a real failure.
- `StarterFormTemplate.logic.test.ts` (from ST-02) already asserts the wired slot family; this story does not change which slots are wired, only what renders inside `default-array`/`heading-array`/`heading-array-item`/`default` (group branch), so that test should need no edit, and a passing re-run of it after this story lands is a regression guard worth re-confirming in CI.
- ST-04 depends on this story's `sft-pill`/`sft-repeater` conventions (`ChoiceArraySectionCard` reuses them); a class-name drift here would surface downstream in ST-04 rather than locally. `classUsage.test.ts` (AC9) is the guard that catches a typo at the source.
- `packages/element-plus` and `docs/.vitepress/theme/components/*` are untouched by this story; their own suites are unaffected and are not re-run as part of this story's gate.
- Engine occurrence rules (`xsd_minOccurs`, array add/remove mechanics in `DynamicFormItemArray`) are untouched; `packages/core`'s own suite remains the regression guard for the rule itself. This story's tests assert the chrome reflects whatever the engine reports, not the rule's correctness, matching the edge-case note in Functional.

### Untestable criteria and rewrite proposals

- **AC10** (`specs/components.md` entry) is a documentation-content check; no code-level test asserts prose content. Kept as a manual checklist item, matching ST-01/ST-02's treatment of the same kind of criterion.
- All other criteria are testable as written; no rewrite needed.

### Manual verification checklist

1. Open `specs/components.md`, confirm the existing starter package entry now notes array/group chrome is in place (AC10).
2. Visually compare the empty-state card, the filled `heading-array`, and the group layout against `prototype.html#group`, `#array-empty`, `#array-filled` in both color modes, since the automated tests check class presence, not pixel layout.
3. Visually confirm the section-level error state (`sft-error` in the section header) reads as visually distinct from a per-field error in both color modes.

## Adversarial review

Story-mode (lite) review: blockers first. Claims checked against the behavioural source components (`docs/.vitepress/theme/components/GroupField.vue`, `SectionCard.vue`, `ArrayField.vue`, `ArraySectionCard.vue`, `RepeaterCard.vue`), the slot wiring in `AdvancedFormTemplate.vue` (`#default`->`GroupField`, `#default-array`->`ArrayField`, `#heading-array`->`ArraySectionCard` + `#heading-array-item`->`RepeaterCard`), the prototype's `#group`/`#array-empty`/`#array-filled` markup, and the approved feature's Design, Component/pattern mapping table, and Decision C. The two-slot wiring (AC4) and the heading-array chrome (AC3, AC5-AC7) match the prototype and Decision C correctly; the dependency on ST-02 (template + icon provide/inject) and transitively ST-01 (stylesheet, `StarterIcon`, override key) is stated and consumed without drift.

1. **[blocker] Resolved (research): AC1 and QA row 1 corrected to `GroupField`'s actual chrome, see AC1.** AC1 / QA row 1 prescribed the wrong chrome for groups. They assert `sft-section`/`sft-section-header`/`sft-section-title`/`sft-section-desc` and route groups through `SectionCard`. The prototype's `#group` section and the feature mapping table both style the group as a standalone `<section>` with `sft-choice-group-title`, `sft-field-desc`, and `sft-choice-group-body sft-hide-tag`, with no `SectionCard`. A test written to QA row 1 would fail a faithful port and would drive `GroupField` into a card redesign the feature forbids ("no structural redesign"). The Coverage section's "groups never pass `tag`" premise is also void since groups do not use `SectionCard`. Routed as PROPOSED edits in AC1 and QA row 1.

2. **[should-fix] Resolved (research): corrected in the feature's Decision C and in AC2/QA row 2 here, see those sections.** AC2 / QA row 2 / Decision C claimed `ArrayField` has no count pill, but the source renders one. `ArrayField.vue` renders an indigo item-count pill (identical to `sft-pill`); it lacks only the empty-state card. This is a factual correction verified against the ported component's source, applying the Design section's own already-approved rule that the docs components win on behaviour, not a new design call, so it did not need to wait for Jeroen.

3. **[nit] Resolved (research): collapsed to `sft-field-desc` only, see AC1.** AC1 and the edge-case note hedged the group description class between `sft-field-desc` and `sft-section-desc`; the prototype uses `sft-field-desc`, and finding 1's correction removes the `SectionCard` path entirely, so there is nothing left to hedge against.

## Implementation notes

Built `GroupField.vue`, `SectionCard.vue`, `ArrayField.vue`, `ArraySectionCard.vue`, `RepeaterCard.vue` in `packages/starter/src/`, each ported from `docs/.vitepress/theme/components/` with Tailwind swapped for the already-shipped `sft-`/`is-*` classes, verified against `prototype.html#group`/`#array-empty`/`#array-filled`. Wired `GroupField` into `StarterFormTemplate`'s existing `#default` and `#heading` blocks (a children-bearing node renders `GroupField`, everything else keeps the ST-02 `FormField` fallback) and added three new blocks: `#default-array` (`ArrayField`), `#heading-array` (`ArraySectionCard`), `#heading-array-item` (`RepeaterCard`), each with the same override-forwarding shape ST-02 established (named slot, built-in fallback). `GroupField`'s own add/remove capability is ported faithfully from the source even though nothing in this package's current wiring makes a plain group removable; a standalone `GroupField.test.ts` exercises it directly, mirroring ST-02's `AppButton.test.ts` precedent for chrome that is unreachable through the wiring alone. Extended `fixtures/metadata.ts` with `groupMetadata`, `inlineArrayMetadata`, `headingArrayMetadata`; added `fixtures/arrayHelpers.ts` adapted to this package's path-based `data-testid`s (`<path>`, `<path>-add-button`, `<path>[n]`, `<path>[n]-remove-button`) rather than element-plus's suffix convention. Added one new stylesheet rule, `.sft-section.is-disabled { opacity: 0.6; }`, extending ST-01's already-established disabled-dimming pattern to the `sft-section` root class `ArrayField` introduces in this story (the prototype's demo has no disabled array/group example to have shipped this up front, but the feature's one states policy requires it uniformly). Updated `specs/components.md`'s existing `packages/starter/` row additively.

Deviations, recorded here per CLAUDE.md:

1. **`StarterFormTemplate.logic.test.ts`'s wired-slot-family assertion (from ST-02) is updated, not left alone.** This story's own Regression risk section claimed "this story does not change which slots are wired", but AC2/AC3/AC4 require wiring three slots (`default-array`, `heading-array`, `heading-array-item`) that ST-02 explicitly did not wire (its own test asserted they were absent). That claim was imprecise; the test is corrected to add the three new slots to the wired list and remove them from the not-yet-wired list, which is what AC2/AC3/AC4 actually require.
2. **Children-forwarding inside `GroupField`/`ArrayField`/`ArraySectionCard`/`RepeaterCard` is wrapped in the same `<slot name="input"><slot /></slot>` double-fallback ST-02 used for leaf controls, not a bare `<slot />` as the ported source has it.** Discovered via two existing ST-02 tests that broke once `#heading`/`#default` started conditionally rendering `GroupField`: `StarterFormTemplate.forwarding.logic.test.ts`'s "keeps the children of a heading when wrapped with default forwards" relies on `createConsumerWrapper()`'s `input`-forwarding convention to make wrapped and bare usage render identically, and that convention only reaches a bare `<slot />`'s content if the fallback also checks `input` first. Both this test's assumption and the mechanism it exercises predate this story (ST-02 built it for leaf fields); extending it to the four new chrome components keeps that parity working for structural slots too, rather than silently breaking it. No consumer-facing contract changes: a wrapper that overrides `default-array`/`heading-array`/`heading-array-item`/`default`/`heading` by name still fully replaces the built-in chrome exactly as before; this only affects the pass-through case where a wrapper exists but does not override that particular node's chrome.
3. **Two existing ST-02 tests are updated because `#default`/`#heading` now route a children-bearing node to `GroupField` instead of `FormField`.** `StarterFormTemplate.test.ts`'s and `StarterFormTemplate.bare.logic.test.ts`'s heading-chrome assertions looked for `.sft-field-label`/`.sft-field-desc` on the group container; updated to `.sft-choice-group-title` (`.sft-field-desc` is unchanged, already shared by both components). This is the intended, AC1-required behaviour change for this story, not a regression.
4. **`ArrayField`'s label class is `sft-section-title` (via the shared `sft-section`/`sft-section-header` family), not `sft-field-label`.** The QA plan's AC2 test-map row mentions `sft-field-label`, but the feature's own Decision C migration note and the Component/pattern mapping table both fix `ArrayField`'s reused class set as `sft-section`/`-header`/`-title`/`-desc` minus `sft-empty`; treated the QA row's wording as a drafting slip against the already-approved architecture text, not a new requirement, and implemented and tested against the architecture.
5. **`heading-array-item`'s `sft-hide-tag` is applied as a static class (unconditional), while `GroupField`'s is conditional on `showRequiredOrOptional === 'optional'`.** Faithful to the ported source: `AdvancedFormTemplate.vue` always sets `class="hide-optional-required"` on `RepeaterCard`/array-item usages regardless of the setting, but `GroupField.vue`'s own template only adds it when `showRequiredOrOptional === 'optional'`. Kept both behaviours exactly as ported, matching "no structural redesign".
6. **`StarterIcon`'s attrs-fallthrough drops a static `class` on the rendered root specifically when a consumer's `#icon` override is active**, a pre-existing characteristic of ST-01's `StarterIcon.vue` (its `setup()` returns a dynamic render function whose root shape Vue cannot statically analyse for attrs inheritance), first surfaced by this story because `ArraySectionCard`'s empty-state icon is the first place in the package to bind a static `class` onto `<StarterIcon>`. Does not affect functional correctness (`StarterFormTemplate.array.logic.test.ts` asserts the override itself renders and replaces the default, which it does) and only means the override's own markup does not inherit the `sft-empty-icon` positioning class, which a consumer supplying their own icon component controls anyway. Out of this story's scope to fix (`StarterIcon.vue` is ST-01's file); flagged here rather than silently worked around.
7. **Two coverage gaps remain, both pre-existing or structurally defensive, not new:** `FormField.vue`'s `canRemoveItems`/remove-button branch (lines 44-47) stays unreachable, exactly as ST-02 disclosed and this story's own QA plan Coverage section anticipated, because `ArrayField` (the only consumer of the non-group `FormField` branch) has no per-item remove capability by design (Decision C, "lighter chrome"); `PasswordStrengthBar.vue`'s empty-tier branch (unchanged from ST-02, structurally unreachable behind its own `v-if="password"` guard). One new, narrow defensive branch: `StarterFormTemplate.vue`'s `itemsLength`/`itemsCount` bindings use `value.value?.length ?? 0`, matching the ported source's own defensive style; the `?? 0` fallback is never reachable through the engine, which always resolves an array field's value to at least `[]`, never `undefined`. All three are isolated, single-purpose defensive branches with no behavioural risk, not pattern gaps.

No deviation here affects the approved feature design or architecture; all are either the mechanism needed to satisfy an already-written criterion, a correction of imprecise QA-plan wording against the already-approved architecture text, or a disclosed, narrow, structurally-justified coverage gap.

## Verification report

### Pipeline checks

- `pnpm run ci:test` (`pnpm -r ci:test`, via the non-shadowed per-script names since bare `pnpm ci` is pnpm's own reserved clean-install command, not this repo's script): `packages/core` 686 tests (27 files), `packages/element-plus` 480 tests (32 files), `packages/starter` 320 tests across 43 files. All pass.
- `pnpm run ci:lint`: clean for all three packages.
- `pnpm run ci:typecheck`: clean for all three packages.
- `pnpm run ci:test:coverage` (`TZ=Europe/Amsterdam`): `packages/starter` reports 99.37% statements / 96.25% branch / 94.11% functions / 99.37% lines, all four metrics above ST-02's prior baseline (98.99 / 95.95 / 90.9 / 98.99). `packages/core` (97.57% stmts, unchanged, confirmed `git diff --stat packages/core/src` is empty) and `packages/element-plus` (100%/98.52% branch, unchanged) show no drop.
- `docs/` untouched by this story; `pnpm docs:build` not required. No visual/UI screenshot taken: headless component change in a private, not-yet-dogfooded package, consistent with ST-01/ST-02's own reasoning (the components are not yet reachable from any rendered page).

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1 Groups render through `GroupField`, `sft-hide-tag` suppresses the tag, no `SectionCard` | Pass | `StarterFormTemplate.group.test.ts` (9 tests): `sft-choice-group-title`/`sft-choice-group-body` present, `sft-section` absent, `sft-hide-tag` present only in optional mode, no-description case renders no `sft-field-desc`. |
| 2 Inline arrays render `ArrayField` on `default-array`, pill present, no empty card | Pass | `StarterFormTemplate.array.test.ts`: `sft-section`, `sft-section-title`, `sft-pill` (singular and plural), `sft-grid`, `sft-array-footer`, `sft-col-span` on full width, no `sft-empty` even at zero items. |
| 3 Heading-declared arrays render `ArraySectionCard`+`RepeaterCard` | Pass | `StarterFormTemplate.headingArray.test.ts`: `sft-pill` count, `sft-section`/`sft-grid`, each item's `sft-repeater`/`-header`/`-title-group`/`-badge`/`-title`, item titles via `arrayItemFieldForTitle`, badge numbering. |
| 4 Decision C: both components distinct | Pass | `StarterFormTemplate.array.test.ts`'s "Decision C" describe block: the inline array never shows `sft-empty`, the heading array does at zero items, `findComponent(ArraySectionCard)` resolves. |
| 5 Empty state: icon/title/hint/Add, click adds | Pass | `StarterFormTemplate.headingArray.logic.test.ts`: `sft-empty`/-icon/-title/-hint present, the button carries `sft-btn-primary`, clicking it appends one item. |
| 6 Section-level error distinct from field error | Pass | `StarterFormTemplate.headingArray.validation.test.ts`: a section-level `sft-error` in the header and an independent per-field `sft-error` inside an item are asserted as different DOM nodes; at exactly `minOccurs` neither the empty state nor the section error appears. |
| 7 Add/remove correct, order preserved | Pass | `StarterFormTemplate.headingArray.logic.test.ts`: add appends last, removing the middle item leaves the other two in original order, `values()` confirms the underlying array. |
| 8 `#icon` slot reaches this slice's glyphs | Pass | `StarterFormTemplate.array.logic.test.ts`: the empty-state icon and the `RepeaterCard` remove-button glyph both render the custom override output instead of the Lucide default. |
| 9 No Tailwind, no `<style scoped>`, classes exist in the stylesheet | Pass | `noTailwind.test.ts`, `noScopedStyle.test.ts`, `classUsage.test.ts` (all auto-scan the whole `src` tree, including the five new files, with no changes needed to the test files themselves). |
| 10 `specs/components.md` entry extended | Pass | The existing `packages/starter/` row gained an additive paragraph on the array/group chrome; no existing row text was replaced. |
| 11 Code hygiene | Pass | `sourceHygiene.test.ts` (auto-scans the new files); manual read found no spec/process references or em dashes in any new source or test file; `ci:lint`/`ci:typecheck`/`ci:test` all green. |

Edge cases: array exactly at `minOccurs > 0` (no empty state, no section error) covered in `StarterFormTemplate.headingArray.validation.test.ts`; group with no description covered in `StarterFormTemplate.group.test.ts`; removing the only item below `minOccurs` covered as the `canRemoveItems`-reflects-engine-state case in `StarterFormTemplate.headingArray.logic.test.ts` (including the engine's own "an item with a value can still be removed to clear it" rule, asserted directly rather than assumed).

### Reactivity / analytics

`StarterFormTemplate.array.analytics.test.ts`, `.headingArray.analytics.test.ts`, `.group.analytics.test.ts` added. Each proves no cross-field re-render when typing in a sibling, and the heading-array file additionally proves the empty-state Add click does not re-render an unrelated sibling. The "add an item" cases use a relative, delta-based assertion (existing items' render count rises by at most one, matching the engine's own array-mutation cost, confirmed against `DynamicFormItemArray`'s and `DynamicFormItem`'s source directly) rather than an absolute "stays the same" claim, because the engine's `useFieldArrayExtended`-backed array mutation does bump existing items' render count by one on add/remove; this mirrors `packages/element-plus`'s own `ElementPlusFormTemplate.array.analytics.test.ts`, which independently discovered and documented the same engine characteristic via a delta comparison against a minimal template. The QA plan's "no re-render of existing items" wording is imprecise against this engine behaviour; the test proves the achievable, honest guarantee instead.

### Process compliance

- `specs/components.md`: updated additively, confirmed the existing element-plus and starter rows above/below are untouched.
- No changeset: confirmed `git diff --stat packages/core/src` is empty; `packages/starter` stays `private: true`.
- Library API rules: `src/index.ts` is unchanged by this story (no new export); all five new components stay internal per ADR 4, confirmed by reading `index.ts` directly. All identifiers camelCase; no kebab-case in any new `.vue` file.
- No spec/process references or em dashes found in any new source or test file (manual read, consistent with `sourceHygiene.test.ts`'s automated scan).

### Manual verification outstanding (Jeroen)

1. Open `specs/components.md`, confirm the extended `packages/starter/` row reads well in context (AC10).
2. Visually compare the empty-state card, the filled `heading-array`, and the group layout against `prototype.html#group`/`#array-empty`/`#array-filled` in both color modes.
3. Visually confirm the section-level error state reads as visually distinct from a per-field error in both color modes.

### Overall status: verifying

All 11 acceptance criteria pass with direct test evidence. `pnpm run ci:test`/`ci:lint`/`ci:typecheck` are green across all three workspace packages, and `packages/starter`'s own coverage (99.37/96.25/94.11/99.37) improved on every metric over ST-02's baseline with no drop anywhere else in the workspace. This story was depended on by ST-04 and ST-05; FEAT-007 stays `in-progress`.

## Verification report (QA, independent re-check)

### Pipeline checks (re-run independently, not trusting the developer's numbers)

- `pnpm install`: `node_modules` was present but nearly empty at `.bin` level before this check (pnpm's own symlink layout); confirmed already up to date, no install needed.
- `pnpm run ci:lint` (`pnpm -r ci:lint`): clean for `packages/core`, `packages/starter`, `packages/element-plus`.
- `pnpm run ci:typecheck` (`pnpm -r ci:typecheck`): clean for all three packages.
- `pnpm run ci:test` (`pnpm -r ci:test`): `packages/starter` 320 tests across 43 files, all pass; `packages/element-plus` 480 tests across 32 files, all pass; `packages/core` passes (confirmed via the coverage run below, which re-runs the full suite). Counts match the developer's report exactly.
- `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`): `packages/starter` reports 99.37% statements / 96.25% branch / 94.11% functions / 99.37% lines, matching the developer's numbers exactly. Per-file breakdown confirmed directly from the coverage table: all five new files this story ships (`GroupField.vue`, `SectionCard.vue`, `ArrayField.vue`, `ArraySectionCard.vue`, `RepeaterCard.vue`) are 100/100/100/100. The two disclosed gaps are the only ones present: `FormField.vue` (87.09/75/0/87.09, lines 44-47, the `canRemoveItems` remove-button branch, still unreachable because `ArrayField` has no per-item remove capability by design, matching Deviation 7) and `PasswordStrengthBar.vue` (branch 85.71, lines 12-14/50, the structurally-unreachable empty-tier branch, inherited from ST-02). `StarterFormTemplate.vue` itself shows 92.59% branch (lines 156-177, the `?? 0` defensive fallbacks Deviation 7 discloses), consistent with the claim. Ran `packages/core`'s own coverage separately: 97.57% statements, matching the prior ST-02 baseline exactly, confirming no regression; `git diff --stat packages/core/src` and `git status --porcelain packages/core/src` are both empty. `packages/element-plus` coverage (100%/98.52% branch) is also unchanged. No coverage drop anywhere in the workspace.
- `docs/` untouched by this story; `pnpm docs:build` not required, confirmed no `docs/` content changed by this story (only `docs/package.json`/`docs/pnpm-lock.yaml` carry pre-existing FEAT-004 changes, untouched by this story).

### Acceptance criteria (independent spot-check against the developer's table)

All 11 criteria re-checked by reading the actual test files and source, not just trusting the developer's table. Confirmed directly: `StarterFormTemplate.group.test.ts` asserts `sft-choice-group-title`/`sft-choice-group-body` present and `sft-section` absent (AC1); `GroupField.vue` has no `SectionCard` import, confirming groups never route through it. `StarterFormTemplate.array.test.ts` confirms `ArrayField` carries `sft-pill`, `sft-section`/`sft-section-title`, and never `sft-empty` (AC2), and the Decision C describe block confirms `ArraySectionCard` is resolved via `findComponent` and is the only one carrying `sft-empty` (AC4). `StarterFormTemplate.headingArray.test.ts`/`.logic.test.ts`/`.validation.test.ts` confirm AC3, AC5, AC6, AC7 with the exact classes and behaviors claimed. `noTailwind.test.ts`/`noScopedStyle.test.ts`/`classUsage.test.ts` scan the whole `src` tree including the five new files (AC9). `specs/components.md`'s `packages/starter/` row is extended additively with accurate prose on the GroupField/ArrayField/ArraySectionCard/RepeaterCard split (AC10). No spec/process references or em dashes found in any new source or test file (AC11); `ci:lint`/`ci:typecheck`/`ci:test` all green as re-run above. All 11: pass.

### The ST-02 test modification (the specific finding requested)

Since `packages/starter` has no git history yet (the whole package is uncommitted work spanning ST-01 through ST-03 in one continuous session; `git status` shows it as a single untracked directory, so a `git diff` against a prior commit is not possible), the two files the developer flagged were checked by reading their current content directly and comparing it against the ST-02 spec's own written acceptance criteria and QA plan (AC5: "`FormField` chrome" producing `sft-field-label`/`sft-field-desc` on the heading/group container).

- `StarterFormTemplate.test.ts`'s heading test now asserts `.sft-choice-group-title` (was `.sft-field-label` per ST-02's AC5 wording) and still asserts `.sft-field-desc` for the description, unchanged.
- `StarterFormTemplate.bare.logic.test.ts`'s heading test likewise asserts `.sft-choice-group-title` instead of `.sft-field-label`.

This is legitimate, not a weakening. ST-02 itself only ever used `FormField` as an explicitly-flagged interim choice for the `heading`/group shape (ST-02 Deviation 5: "`#heading`'s fallback chrome is `FormField`, not a dedicated card component... a deliberate interim choice, not a new component"), and ST-03's own AC1 (approved, research-corrected) requires a children-bearing node to route through `GroupField`'s `sft-choice-group-title`/`sft-choice-group-body` chrome instead. Reading the current `StarterFormTemplate.vue` confirms the routing actually changed as described: a `children?.length` node now renders `GroupField`, not `FormField`, on both `#default` and `#heading`. The old assertion (`sft-field-label`) would fail against this correct, required behavior change; updating it to `sft-choice-group-title` is the test following the code's intended new contract, not the developer loosening or removing a check. No assertion was deleted or weakened in strength, only retargeted to the correct class for the now-correct component, and the shared `sft-field-desc` assertion for the description was left untouched in both files, which is further evidence this was a precise, minimal correction rather than a broad weakening. Verdict: legitimate.

### The input-escape-hatch double-fallback pattern

Checked directly against `StarterFormTemplate.vue`. ST-02 established the pattern at the per-node slot level: e.g. `<FormField>...<slot name="input"><slot /></slot></FormField>` and `<CheckboxField>...<slot name="input"><slot /></slot></CheckboxField>`, letting a wrapper override just the inner control while keeping the chrome. ST-03 extends the identical shape to the four new chrome components at the same call sites in the same file: `<GroupField><slot name="input"><slot /></slot></GroupField>` (both `#default` and `#heading`), `<ArrayField><slot name="input"><slot /></slot></ArrayField>`, `<ArraySectionCard><slot name="input"><slot /></slot></ArraySectionCard>`, `<RepeaterCard><slot name="input"><slot /></slot></RepeaterCard>`. This matches ST-02's actual pattern exactly, not an invented one; it is a mechanical, faithful extension of an existing, already-approved mechanism to the new structural slots, consistent with Deviation 2's description. Note the chrome components' own internal templates (`GroupField.vue`, `ArrayField.vue`, `ArraySectionCard.vue`, `RepeaterCard.vue`) use a plain bare `<slot />` for their content; the double-fallback lives in `StarterFormTemplate.vue` at the call site, exactly where ST-02's equivalent pattern also lives (not inside `FormField.vue`/`CheckboxField.vue` either). Verdict: legitimate, consistent with ST-02's actual mechanism.

### Process compliance

- `specs/components.md`: updated additively, confirmed by direct read; no existing prose removed or altered, only extended.
- No changeset: confirmed `git diff --stat packages/core/src` is empty and `packages/starter`'s `package.json` still declares `private: true`. No stray changeset file added under `.changeset/` for this story (only the six pre-existing FEAT-002/003/QUICK ones are present).
- Library API rules: `src/index.ts` exports exactly `starterIconNames`, `StarterIconName`, `extendMetadata`, `starterMetadata`, `StarterFieldProperties`, `StarterValueTypes`, `StarterFormTemplate`, `StarterIcon`, plus the four re-exported core types, unchanged from ST-02 and matching ADR 4; none of this story's five new components (`GroupField`, `SectionCard`, `ArrayField`, `ArraySectionCard`, `RepeaterCard`) are exported, confirmed by direct read of `index.ts`. All identifiers camelCase. No kebab-case found in the new `.vue` files.
- Recorded deviations (1-7 in Implementation notes) were each checked against the current source: Deviation 1 (wired-slot-family test extended) confirmed in `StarterFormTemplate.logic.test.ts`. Deviation 3 (ST-02 test retargeting) confirmed legitimate above. Deviation 4 (`ArrayField`'s `sft-section-title` class, not `sft-field-label`) confirmed in `ArrayField.vue`. Deviation 5 (`sft-hide-tag` static on `RepeaterCard` usage, conditional on `GroupField`) confirmed: `StarterFormTemplate.vue` sets `class="sft-hide-tag"` unconditionally on the `#heading-array-item` `RepeaterCard`, while `GroupField.vue` applies it only `:class="{ 'sft-hide-tag': showRequiredOrOptional === 'optional' }"`. None narrow scope or silently override a feature-level decision.
- One small, undisclosed discrepancy, not a blocker: the QA plan's Coverage section states "no separate `SectionCard.test.ts` is added," but a minimal `SectionCard.test.ts` (2 tests, covering the no-label/no-tag and footer-slot branches) exists in `src/__tests__/`. This is a harmless, additive test, not a removed or weakened one, and it does not affect any acceptance criterion or coverage claim; noting it so the record is accurate, not as a fail condition.

### Overall verdict: pass

Every acceptance criterion passes with direct evidence, independently re-verified by reading the actual test and source files, not just the developer's table. `pnpm run ci:lint`/`ci:typecheck`/`ci:test` are green across all three workspace packages, confirmed by an independent run, and `pnpm -r ci:test:coverage` shows no drop anywhere, with `packages/starter` matching the developer's reported numbers exactly. The two ST-02 test retargets are a legitimate, minimal, correctly-scoped update required by ST-03's own approved AC1, not a weakening. The input-escape-hatch double-fallback extension matches ST-02's real mechanism exactly. Status set to `done`.

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field once it exists. FEAT-007 stays `in-progress`: ST-04, ST-05, ST-06, and ST-07 are not yet done.
