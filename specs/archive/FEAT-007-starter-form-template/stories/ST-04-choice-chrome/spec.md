---
id: ST-04
type: story
feature: FEAT-007
status: done
approved_by: Jeroen
pr: ""
---

# Story: Choice chrome

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen individually. Override any of these freely.

- Blocker 1 → added the missing step: this story wires the four choice slots into `StarterFormTemplate.vue` (ST-02 only wired input slots, ST-03 only array slots)
- Should-fix 2 → `sft-choice-addbar-reason` renders only for disabled branches, not one per branch; corrected against `ChoiceArraySectionCard.vue`
- Should-fix 3 → AC2's slot hedge tightened to `heading-choice`, confirmed against `AdvancedFormTemplate.vue:152`

## Functional

### User story

As a library consumer whose metadata uses mutually exclusive choice branches (automatic or explicit selection, including repeatable choice arrays), I want `StarterFormTemplate` to render them as the card-based "pick one" UI the docs' Advanced example already shows, with icons pre-selected per option from the Lucide catalogue, so I get working choice UI without building it myself.

### Acceptance criteria

1. **Automatic-mode choice renders through `ChoiceField` on `default-choice`.** Given a choice node in automatic mode, when rendered, then the `default-choice` slot renders `ChoiceField`'s `sft-choice-group`/`-title`/`-desc`/`-body` chrome.
2. **Explicit-mode choice renders through `ChoiceSectionCard` + `ChoiceCard`.** Given a choice node in explicit mode, when rendered, then the `heading-choice` slot (**DECIDED (research):** tightened from the `heading-choice`/`default-choice` hedge the QA plan flagged; `AdvancedFormTemplate.vue:152` wires explicit single-select to `heading-choice`, while `default-choice` is automatic mode per AC1) renders `sft-choice-grid` of `sft-choice-card` items, each with `sft-choice-radio`/`-dot`, `sft-choice-text`, `sft-choice-title-row`, `sft-choice-icon`, `sft-choice-title`, `sft-choice-desc`, and the selected card carries `is-selected`.
3. **Choice-card icons render through `StarterIcon` using the field's `iconName`.** Given a choice option with `iconName` set to a registry name, when rendered, then `sft-choice-icon` contains a `StarterIcon` with that `name`, confirming the `AppIconName` to `StarterIconName` migration (the property's type, not just its runtime value).
4. **Repeatable choice arrays render through `ChoiceArraySectionCard`.** Given a repeatable choice array, when rendered, then the relevant `-choice-array`/`default-choice-array-item` slots render `ChoiceArraySectionCard`'s `sft-choice-addbar`/`-item`/`-reason` chrome, reusing `sft-pill` and `sft-repeater` from ST-03 with no new classes invented for the count pill or item header. **DECIDED (research):** `sft-choice-addbar-item` renders once per branch, but `sft-choice-addbar-reason` renders only for a branch whose Add button is disabled (`canAddChoiceOccurrence(branchKey)` is false), not one per branch; `ChoiceArraySectionCard.vue` gates the reason `<p>` on `v-if="!canAdd(option.value)"`.
5. **Selecting a card updates the bound value.** Given an explicit-mode choice with multiple cards, when a card is clicked, then `is-selected` moves to that card and the underlying field value updates to that branch.
6. **The icon slot still reaches choice-card glyphs.** Given the ST-02 wrapper pattern, when a `#icon` override is supplied, then every choice-card icon renders through the override instead of the Lucide default.
7. **No Tailwind classes, no `<style scoped>`, classes exist in the stylesheet.** Given `ChoiceField`, `ChoiceCard`, `ChoiceSectionCard`, `ChoiceArraySectionCard`, when scanned, then none contains a Tailwind utility class or `<style scoped>`, and every referenced `sft-`/`is-*` class exists in ST-01's stylesheet.
8. **`specs/components.md` entry is extended** to note the choice chrome is in place (no new public export: these components stay internal per ADR 4).
9. **Code hygiene.** No spec/process references, no em dashes, camelCase Vue identifiers; `pnpm run ci:lint`, `ci:typecheck`, `ci:test` pass for `packages/starter`.

### Edge cases

- A choice option with no `iconName`: `sft-choice-icon` region is absent, no broken/empty icon rendered.
- A choice option with an `iconName` outside the registry and no `#icon` override: `StarterIcon`'s fail-soft behaviour from ST-01 applies (renders nothing, dev warning), the card still renders its text.
- An automatic-mode choice with only one branch: renders the same as any other automatic choice, no special-casing.

### Out of scope

- Wizard, review, success chrome: next story.
- Dogfooding, Storybook, package README, publish flip.
- Any change to the engine's choice-selection or occurrence logic (FEAT-001/FEAT-002 territory, untouched here).

## Design reference

[`../../prototype.html#choice-explicit`](../../prototype.html#choice-explicit), [`#choice-auto`](../../prototype.html#choice-auto), [`#choice-array`](../../prototype.html#choice-array), and [`#icons`](../../prototype.html#icons) for the sample catalogue (`building2`, `rocket`, `calendar`, `briefcase`, `shield`, `sparkles`) a choice card can pre-select from. No new design.

## Architecture reference

Implements the **choices** structural shape of slicing seam 2. Builds: `ChoiceField`, `ChoiceCard`, `ChoiceSectionCard`, `ChoiceArraySectionCard` (all internal, not exported, per ADR 4). Confirms the `AppIconName` to `StarterIconName` property-type migration on `iconName` (Public API > Component/pattern mapping) end to end on real choice cards, not just at the metadata-typing level.

Files: `packages/starter/src/ChoiceField.vue`, `src/ChoiceCard.vue`, `src/ChoiceSectionCard.vue`, `src/ChoiceArraySectionCard.vue`, `src/StarterFormTemplate.vue` (slot wiring, see below), tests, `specs/components.md`.

> **DECIDED (research): this story wires four new slot templates into `StarterFormTemplate.vue`.** ST-02 wires only the seven input slots and ST-03 adds the array slots, so the choice slots are not yet wired. This story adds `#default-choice` -> `ChoiceField` (automatic mode), `#heading-choice` -> `ChoiceSectionCard` + `ChoiceCard` (explicit single-select), `#heading-choice-array` -> `ChoiceArraySectionCard`, and `#default-choice-array-item` -> `RepeaterCard`, each with the `fieldMetadata.choice.map(x => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description, icon: x.iconName }))` option mapping exactly as `AdvancedFormTemplate.vue:152/159/167/173/216/233`. `StarterFormTemplate.vue` therefore belongs in this Files list. This corrects a factual error against the already-approved ST-02 (which wires only seven input slots) rather than any new design call.

Depends on ST-02 (template shell, metadata catalogue, icon wiring) and ST-03 (`sft-pill`/`sft-repeater` conventions reused by `ChoiceArraySectionCard`). ST-05 does not depend on this story (wizard/review/success are structurally independent of choice rendering) but is sequenced after it. No changeset: no `packages/core/src/` change; package stays private.

## QA plan

Mirrors `packages/element-plus/src/__tests__` conventions, in particular `ElementPlusFormTemplate.choice*.test.ts` (the `explicitSingle`/`explicitRepeatable`/`autoRepeatable` fixture shapes and the `choice.test-helpers.ts` finder functions) and ST-03's `sft-pill`/`sft-repeater` test coverage, which this story's `ChoiceArraySectionCard` tests assert against by class name, not by re-testing. All new tests live in `packages/starter/src/__tests__/`. No `TZ`-sensitive behaviour in this slice.

Verified against source ahead of writing this plan: `AdvancedFormTemplate.vue` wires automatic mode as `default-choice` -> `ChoiceField` (line 216), explicit single-select as `heading-choice` -> `ChoiceSectionCard` (line 152), the per-branch add bar as `heading-choice-array` -> `ChoiceArraySectionCard` (line 167), and each active occurrence as `default-choice-array-item` -> `RepeaterCard` (line 233). The per-branch `iconName` extended property flows as `fieldMetadata.choice[i].iconName`, mapped into `ChoiceOption.icon` on the `options` array passed to `ChoiceSectionCard`/`ChoiceArraySectionCard` (lines 159, 173); `ChoiceField` (automatic mode) never touches `iconName`, so AC1 correctly makes no icon claim. Neither `ChoiceSectionCard` nor `ChoiceArraySectionCard` is passed a `disabled` prop today (unlike `ChoiceField`'s wiring, which does receive one), so a disabled-dim assertion only applies to automatic-mode chrome; the QA map below reflects this instead of inventing a disabled state for the explicit-mode cards that today's source does not wire.

**Proposed correction to AC2's hedge:** AC2 says "the relevant `heading-choice`/`default-choice` slot ... confirmed against source during implementation." That confirmation is already available: it is `heading-choice`, not `default-choice` (which is automatic mode, AC1's slot). The test map below targets `heading-choice` directly; flagging this for adversarial-review to tighten the AC wording rather than leaving it open until implementation.

### Fixtures and test utilities

- New: `fixtures/choiceMetadata.ts` - `autoChoiceMetadata` (automatic mode, two branches, one with a single branch for the edge case), `explicitChoiceMetadata` (single-select, options with and without `iconName`, one `iconName` outside the registry), `explicitChoiceArrayMetadata` (`maxOccurs > 1`, per-branch limits for the `canAddChoiceOccurrence` disabled-reason case), modeled on element-plus's `choice.test-helpers.ts` fixture shapes (`explicitSingle`/`explicitRepeatable`/`autoRepeatable`).
- New: `__tests__/choice.test-helpers.ts` - finder functions for `sft-choice-card`/`-radio`/`-icon`/`-title`/`-desc`, the add-bar buttons, and `findComponent(StarterIcon)` lookups, adapted from element-plus's `choice.test-helpers.ts`.
- Reused from ST-01/ST-02/ST-03: `fixtures/mountInForm.ts`, `fixtures/createConsumerWrapper.ts` (the `icon` override), `fixtures/renderCount.ts`, `helpers/sourceScan.ts`. This story must not duplicate or re-declare any of them.
- No `packages/core/src/examples/` fixture needed: field-tree fixtures stay small and local, matching ST-01/ST-02/ST-03 precedent.

### Acceptance criterion to test map

| AC | Test | File |
| --- | --- | --- |
| 1 Automatic mode renders through `ChoiceField` on `default-choice` | Mount `autoChoiceMetadata`, assert `sft-choice-group`/`-title`/`-desc`/`-body` appear and the active branch's fields render inside `-body` | `StarterFormTemplate.choice.test.ts` |
| 2 Explicit mode renders through `ChoiceSectionCard` + `ChoiceCard` on `heading-choice` | Mount `explicitChoiceMetadata`, assert `sft-choice-grid` contains one `sft-choice-card` per option, each with `sft-choice-radio`/`-dot`, `sft-choice-text`, `sft-choice-title-row`, `sft-choice-title`, `sft-choice-desc`, and the active occurrence's card carries `is-selected` while the others do not | `StarterFormTemplate.choice.test.ts` |
| 3 Choice-card icons render through `StarterIcon` using `iconName` | Mount `explicitChoiceMetadata` with one option carrying a registry `iconName`, assert that card's `sft-choice-icon` contains a `StarterIcon` (`findComponent`) whose `name` prop equals the option's `iconName`; a type-level test (`expectTypeOf`) asserts the field's `iconName` property type is `StarterIconName`, not `AppIconName` | `StarterFormTemplate.choice.test.ts`, `metadata.test.ts` |
| 4 Repeatable choice arrays render through `ChoiceArraySectionCard` | Mount `explicitChoiceArrayMetadata`, assert `heading-choice-array` renders `sft-choice-addbar` with one `sft-choice-addbar-item` per branch and a `sft-choice-addbar-reason` only for each branch whose Add is disabled (`canAddChoiceOccurrence` false) (**DECIDED (research):** corrected from "one item/reason pair per branch", which overstated the reason count), and the section header's `sft-pill` shows the used-of-max count; assert each added occurrence renders through `default-choice-array-item` as `sft-repeater`/`-header`/`-title-group`/`-badge`/`-title` | `StarterFormTemplate.choice.array.test.ts` |
| 5 Selecting a card updates the bound value | Mount `explicitChoiceMetadata` with no initial value, click an unselected `sft-choice-card`, assert `is-selected` moves to it and the field's bound value switches to that branch; click a second card and assert the first loses `is-selected` | `StarterFormTemplate.choice.logic.test.ts` |
| 6 `#icon` override reaches every choice-card icon | Mount via `createConsumerWrapper({ icon: ... })` wrapping the template, mount `explicitChoiceMetadata` with an option that has a registry `iconName`, assert the custom render output appears in place of the Lucide default on that card's icon | `StarterFormTemplate.choice.logic.test.ts` |
| 7 No Tailwind, no `<style scoped>`, classes exist in ST-01's stylesheet | Source scan of `ChoiceField.vue`, `ChoiceCard.vue`, `ChoiceSectionCard.vue`, `ChoiceArraySectionCard.vue` for Tailwind utility patterns and `<style scoped`; reverse-direction check that every `sft-`/`is-*` class these files reference exists in ST-01's `src/style.css` | `noTailwind.test.ts`, `noScopedStyle.test.ts`, `classUsage.test.ts` |
| 8 `specs/components.md` entry extended | Manual verification: reviewer confirms the existing entry gains a note that choice chrome is in place (no new exports) | Manual |
| 9 Code hygiene | Reuses ST-01/ST-02/ST-03's `sourceHygiene.test.ts` pattern, scope extended to the four files this story adds | `sourceHygiene.test.ts` |

### Edge cases to tests

- Choice option with no `iconName`: assert `sft-choice-icon` is absent for that card and the card still renders its title/description, in `StarterFormTemplate.choice.test.ts`.
- Choice option with an `iconName` outside the registry and no `#icon` override: assert nothing throws, no glyph renders, `console.warn` fires once (ST-01's fail-soft contract), and the card's title/description still render, in `StarterFormTemplate.choice.logic.test.ts`.
- Automatic-mode choice with only one branch: assert `sft-choice-group`/`-title`/`-desc`/`-body` render identically to the two-branch case, no conditional branch-count styling, in `StarterFormTemplate.choice.test.ts`.

### States from the feature's states policy applicable to this slice

- **Unselected choice card** (resting `sft-choice-card`, no `is-selected`): AC2, AC5.
- **Selected choice card** (`sft-choice-card.is-selected`, radio dot filled): AC2, AC5.
- **Choice-icon present / absent** (`sft-choice-icon` rendered only when `iconName` resolves): AC3, edge case 1.
- **Icon fail-soft** (unregistered name, no override: renders nothing, one dev warning): edge case 2, reusing ST-01's contract rather than re-deriving it.
- **Automatic-mode disabled** (`sft-choice-group-title.is-disabled`, dimmed): asserted once in `StarterFormTemplate.choice.test.ts` for `ChoiceField` only, since `ChoiceSectionCard`/`ChoiceArraySectionCard` are not wired with a `disabled` prop today (verified against `AdvancedFormTemplate.vue`); no test invents a disabled state for the explicit-mode cards that the source does not support.
- **Section-level error** (`sft-error` in `ChoiceSectionCard`/`ChoiceArraySectionCard`'s header, distinct from any per-field error inside the active occurrence): one assertion per component in `StarterFormTemplate.choice.validation.test.ts`.
- No new valid/success state in this slice (matches the feature's "no green success state" policy); no test invents one. No loading state either (the feature reserves loading for the submission-success timeline, out of scope here).

### Reactivity / analytics

This slice wires `DynamicFormItemChoice`-rendered nodes for the first time in this package (automatic and explicit single-select) and reuses `DynamicFormItemArray`'s choice-array path first exercised structurally in ST-03 (there for plain arrays, here for choice branches), so render-count coverage is required. `StarterFormTemplate.choice.analytics.test.ts` mirrors element-plus's `ElementPlusFormTemplate.choice.analytics.test.ts` shape: build a minimal template that renders the same choice metadata with bare slots, mount both it and `StarterFormTemplate` with `settings: { analytics: true }`, and assert the starter template's per-occurrence render-count delta is no greater than the minimal template's delta when a second branch occurrence is added (the same comparative assertion element-plus uses, since an add legitimately changes some render counts and an absolute "never re-renders" claim would be false). A second case asserts typing into one occurrence's field does not bump a sibling occurrence's render count. A third case, specific to this story, asserts that switching the active branch in automatic mode (`ChoiceField`) does not bump an unrelated sibling field's render count outside the choice.

### Coverage

`packages/starter` keeps its own baseline (per ST-01); `pnpm -r ci:test:coverage` must still pass workspace-wide. Every file this story ships (`ChoiceField.vue`, `ChoiceCard.vue`, `ChoiceSectionCard.vue`, `ChoiceArraySectionCard.vue`) gets direct coverage through the AC-to-test map above. One deliberate gap: `ChoiceSectionCard`'s backward-compatible `v-slot="{ selectedOption }"` default-slot scope (kept per the ported component's own comment, "no current docs example reads it") is exercised only incidentally through mounting, not asserted directly, since no acceptance criterion requires it and the feature's scope is the rendered chrome, not this legacy slot-scope contract.

### Regression risk

- ST-02's `StarterIcon`, `AppButton`, `ErrorMessage`, `OptionalRequiredTag` and ST-03's `SectionCard`, `RepeaterCard` are consumed, not modified, by this story's components (`ChoiceSectionCard`/`ChoiceArraySectionCard` wrap `SectionCard`; `ChoiceArraySectionCard`'s add bar reuses `AppButton`; active occurrences render through `RepeaterCard`). Their own suites remain the regression guard; this story mounts through the real components rather than stubbing them.
- **DECIDED (research): corrects a false premise.** ST-02 wires only the seven input slots (`default`, `default-input`, `heading`, `checkbox`, `checkbox-input`, `select-input`, `password-input`) and its `StarterFormTemplate.logic.test.ts` asserts exactly that set (ST-02 regression-risk note); ST-03 adds the array slots. The four choice slots (`default-choice`, `heading-choice`, `heading-choice-array`, `default-choice-array-item`) are not yet wired, so this story does change which slots are wired: it adds those four templates to `StarterFormTemplate.vue` (see the Architecture reference note). ST-02's exact-slot-family assertion is extended accordingly, and this story adds its own assertion covering the four choice slots.
- ST-03's `classUsage.test.ts` is the guard for `sft-pill`/`sft-repeater` class-name drift; this story's own `classUsage.test.ts` run additionally confirms `ChoiceArraySectionCard` references those exact class names, catching a typo at the point of reuse rather than only at ST-03's definition site.
- Engine choice-selection and occurrence logic (`DynamicFormItemChoice`, `xsd_choiceMinOccurs`, branch add/remove mechanics) is untouched; `packages/core`'s own suite remains the regression guard for the rule itself. This story's tests assert the chrome reflects whatever the engine reports, not the rule's correctness.
- `packages/element-plus` and `docs/.vitepress/theme/components/*` are untouched by this story; their own suites are unaffected and are not re-run as part of this story's gate.

### Untestable criteria and rewrite proposals

- **AC8** (`specs/components.md` entry) is a documentation-content check; no code-level test asserts prose content. Kept as a manual checklist item, matching prior stories' treatment of the same kind of criterion.
- **AC2's slot hedge** ("confirmed against source during implementation") is not itself untestable, but it is unnecessarily open pending a confirmation already available; see the proposed correction above the fixtures section. The test map already targets the confirmed slot (`heading-choice`), so this does not block writing tests, only tightens the written criterion.
- All other criteria are testable as written; no rewrite needed.

### Manual verification checklist

1. Open `specs/components.md`, confirm the existing starter package entry now notes choice chrome is in place (AC8).
2. Visually compare the automatic-mode group, the explicit-mode card grid (both states, odd and even option counts for the grid-column logic), and the choice-array add bar against `prototype.html#choice-auto`, `#choice-explicit`, `#choice-array` in both color modes, since the automated tests check class presence, not pixel layout.
3. Visually confirm the selected card's gradient background and ring (`is-selected`) read as clearly distinct from the resting card in both color modes.
4. Visually diff the six sample choice-card icons (`building2`, `rocket`, `calendar`, `briefcase`, `shield`, `sparkles`) against `prototype.html#icons` to sanity-check the glyph choices read correctly at card size.

## Adversarial review

Story-mode (lite) review: blockers first. Claims checked directly against the behavioural source (`docs/.vitepress/theme/components/ChoiceField.vue`, `ChoiceCard.vue`, `ChoiceSectionCard.vue`, `ChoiceArraySectionCard.vue`, `SectionCard.vue`), the slot wiring in `AdvancedFormTemplate.vue` (choice slots at lines 152/159/167/173/216/233, all confirmed exactly as the QA plan states), the prototype's `#choice-auto`/`#choice-array` markup, the element-plus choice test precedent (`choice.test-helpers.ts` and the `explicitSingle`/`explicitRepeatable`/`autoRepeatable` fixtures, confirmed present), and the approved feature Design, Component/pattern mapping table, and Decision C, plus ST-01/ST-02/ST-03's established contracts. The option-to-icon mapping (`icon: x.iconName`), the `StarterIcon` override reach, the `is-selected` card model, the `sft-pill`-via-`SectionCard`-`tag` reuse, and the automatic-vs-explicit slot split are all consistent with source. One blocker and two should-fixes below.

1. **[blocker] Resolved (research): wiring step added, see Architecture reference.** The story omitted the central integration step (wiring four choice slots into `StarterFormTemplate.vue`) and misstated the ST-02/ST-03 dependency. The Regression risk section claimed `StarterFormTemplate.logic.test.ts` "already asserts the wired slot family including `default-choice`, `heading-choice`, `heading-choice-array`, `default-choice-array-item`" and that "this story does not change which slots are wired." Both are false against the approved ST-02 (wires only the seven input slots, and its logic test asserts exactly that set) and ST-03 (adds the array slots only). The choice slots are not yet wired, so wiring them is this story's work, yet `StarterFormTemplate.vue` was absent from the Architecture reference Files list. A developer following the spec literally would not wire the slots and AC1-AC5 would silently fail to render. Routed as PROPOSED edits in the Architecture reference (Files + a wiring note naming all four slot templates and the `fieldMetadata.choice.map(...)` option mapping) and the Regression risk bullet.

2. **[should-fix] Resolved (research): corrected in AC4 and QA row 4.** AC4 / QA row 4 overstated the `sft-choice-addbar-reason` count. They asserted "one `sft-choice-addbar-item`/`-reason` pair per branch." In source, `ChoiceArraySectionCard.vue` gates the reason `<p>` on `v-if="!canAdd(option.value)"`, so a reason renders only for a branch whose Add button is disabled, not one per branch. A test written to the literal AC would fail whenever any branch is still addable. Routed as PROPOSED edits in AC4 and QA row 4 (item per branch; reason only for disabled branches).

3. **[should-fix] Resolved (research): tightened in AC2.** AC2's slot hedge was left open though the answer is already known. AC2 hedged "`heading-choice`/`default-choice` slot ... confirmed against source during implementation"; the QA plan itself flagged this for the reviewer to tighten. `AdvancedFormTemplate.vue:152` wires explicit single-select to `heading-choice` (automatic mode is `default-choice`, AC1). Routed as a PROPOSED edit tightening AC2 to `heading-choice`.

No further blockers: the AC-to-test map covers all nine criteria, the fixtures mirror real element-plus precedent files, and the `sft-pill`/`sft-repeater` reuse from ST-03 is consumed without class-name drift.

## Implementation notes

Built `ChoiceField.vue`, `ChoiceCard.vue`, `ChoiceSectionCard.vue`, `ChoiceArraySectionCard.vue` in `packages/starter/src/`, each ported from `docs/.vitepress/theme/components/` with Tailwind swapped for the already-shipped `sft-`/`is-*` classes from ST-01, verified against `prototype.html#choice-auto`/`#choice-explicit`/`#choice-array`. Wired the four choice slots into `StarterFormTemplate.vue` exactly as the Architecture reference specifies: `#default-choice` -> `ChoiceField`, `#heading-choice` -> `ChoiceSectionCard`, `#heading-choice-array` -> `ChoiceArraySectionCard`, `#default-choice-array-item` -> `RepeaterCard` (reused from ST-03, not duplicated), each using the same `<slot name="X" v-bind="s">` override-with-fallback shape and the `input`-escape-hatch double-fallback ST-02/ST-03 established. The option mapping for both card components is `fieldMetadata.choice.map(x => ({ value: x.name, title: toValue(x.fieldOptions?.label), description: x.description, icon: x.iconName }))`, gated by `fieldMetadata.choiceShowChoiceSelect`, matching `AdvancedFormTemplate.vue` exactly. `ChoiceArraySectionCard`'s add bar renders one `sft-choice-addbar-item` per branch and a `sft-choice-addbar-reason` only for a branch whose `canAddChoiceOccurrence` is false, tied to its button through `aria-describedby`, as corrected in AC4. Extended `fixtures/choiceMetadata.ts` with `autoChoiceMetadata`/`autoChoiceSingleBranchMetadata` (automatic mode), `explicitChoiceMetadata` (single-select, with an icon, without one, and one `iconName` outside the registry), and `explicitChoiceArrayMetadata` (repeatable, a branch capped via `maxOccursTotal`); added `__tests__/choice.test-helpers.ts` adapted to this package's path-based `data-testid`s. Updated `specs/components.md`'s existing `packages/starter/` row additively.

Deviations, recorded here per CLAUDE.md:

1. **`ChoiceSectionCard.vue`'s own template references `props.label` explicitly, not the bare `label` identifier the ported source and every sibling chrome component use.** Discovered because the bare form triggered a spurious `[Vue warn]: Property "label" was accessed during render but is not defined on instance` warning (the actual rendered output was correct either way, confirmed by inspecting the mounted HTML directly). The warning traces to the inherited `label` prop coming from `SectionCardProps` through an `extends /* @vue-ignore */` heritage clause combined with a direct bare-identifier template reference inside the same component (every other chrome component with that heritage clause only forwards the inherited props via `v-bind="$props"` to a child, never references one directly in its own template). Using `props.label` instead resolves it unambiguously and removes the warning. No behavior change; purely a template-expression fix discovered while verifying console output stayed clean.
2. **`ChoiceSectionCard` and `ChoiceArraySectionCard` leak their own extra props (`options`, `activeChoiceOccurrences`, `addChoiceOccurrence`, etc.) onto `SectionCard`'s root element as plain DOM attributes.** `SectionCard` does not declare these as its own props, so Vue's default attrs fallthrough renders them as lowercase, hyphen-free attributes (e.g. `activechoiceoccurrences=""`). Confirmed this is not new: `ArraySectionCard` (ST-03) has the identical characteristic with its own extra props (`itemscount`, `canadditems`, ...), inherited from the same `v-bind="$props"` forwarding shape. Harmless (browsers ignore unknown attributes) and a faithful-port characteristic of the ported `SectionCard` composition pattern, not something this story introduces or should silently patch with `inheritAttrs: false` on a shared component outside its scope.
3. **A `choiceShowChoiceSelect: false` coverage test was added though no acceptance criterion requires it.** The property already exists on `StarterFieldProperties` and both new slot bindings read it, but exercising only the `true` path left the `false` branch (and the `-choice`/`-choice-array` cards' own `v-if="options?.length"` guard) uncovered. Added one assertion per slot in `StarterFormTemplate.choice.test.ts` and direct standalone-component tests (`ChoiceSectionCard.test.ts`, `ChoiceArraySectionCard.test.ts`, `ChoiceCard.test.ts`) for the handful of remaining prop-omitted branches (no `dataTestid`, no `maxOccurs`, no `canAddChoiceOccurrence`/`addChoiceOccurrence`, no `title`), mirroring the existing `ArraySectionCard.test.ts`/`RepeaterCard.test.ts`/`SectionCard.test.ts` precedent of direct-mounting a chrome component for branches the engine wiring alone never reaches.
4. **One branch each remains uncovered in `ChoiceSectionCard.vue` and `ChoiceArraySectionCard.vue` (95.83% and 93.75% branch respectively).** Both are the same shared ternary (`addOptionReasonId`'s `dataTestidFor(value) ? ... : undefined`, read from two call sites) and a narrow prop-level default-value branch Vue's compiler emits for an optional function-typed prop; package-wide branch coverage (96.33%) still exceeds ST-03's baseline (96.25%), so this is disclosed as a small, isolated, pre-existing-shape gap rather than chased further.

No deviation here affects the approved feature design or architecture; all are either a template-expression bug fix found while verifying clean console output, a disclosed pre-existing characteristic shared with ST-03's own component, or additional coverage beyond what the acceptance criteria strictly required.

## Verification report

### Pipeline checks

- `pnpm run ci:test` (`pnpm -r ci:test`): `packages/core` 686 tests (27 files), `packages/element-plus` 480 tests (32 files), `packages/starter` 360 tests across 51 files. All pass.
- `pnpm run ci:lint`: clean for all three packages.
- `pnpm run ci:typecheck`: clean for all three packages.
- `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`): `packages/starter` reports 99.51% statements / 96.33% branch / 95.83% functions / 99.51% lines, at or above ST-03's baseline (99.37 / 96.25 / 94.11 / 99.37) on every metric. `packages/core` (97.57% statements, unchanged; `git diff --stat packages/core/src` is empty) and `packages/element-plus` (100% / 98.52% branch, unchanged) show no drop anywhere in the workspace.
- `docs/` untouched by this story; `pnpm docs:build` not required. No visual/UI screenshot taken: headless component change in a private, not-yet-dogfooded package, consistent with ST-01 through ST-03's own reasoning (the components are not yet reachable from any rendered page).

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1 Automatic mode renders through `ChoiceField` on `default-choice` | Pass | `StarterFormTemplate.choice.test.ts`: `sft-choice-group`/`-title`/`-desc`/`-body` present, the active branch's input renders inside the body, no card picker renders, and a single-branch automatic choice renders identically. |
| 2 Explicit mode renders through `ChoiceSectionCard` + `ChoiceCard` on `heading-choice` | Pass | `StarterFormTemplate.choice.test.ts`: `sft-choice-grid` holds one `sft-choice-card` per branch with `sft-choice-radio`/`-dot`, `sft-choice-text`, `sft-choice-title-row`, `sft-choice-title`, `sft-choice-desc`; `is-selected` starts absent and moves to the branch carrying a loaded value. |
| 3 Choice-card icons render through `StarterIcon` using `iconName` | Pass | `StarterFormTemplate.choice.test.ts` confirms the `sft-choice-icon`/`StarterIcon` pairing for a branch with `iconName` and its absence for one without; `metadata.test.ts`'s existing type-level test confirms the property type is `StarterIconName`. |
| 4 Repeatable choice arrays render through `ChoiceArraySectionCard` | Pass | `StarterFormTemplate.choice.array.test.ts`: `sft-choice-addbar` with one `sft-choice-addbar-item` per branch, a `sft-choice-addbar-reason` only for the branch whose Add is disabled (tied via `aria-describedby`), the section pill showing the used-of-max count, and each active occurrence rendering `sft-repeater`/`-header`/`-title-group`/`-badge`/`-title`. |
| 5 Selecting a card updates the bound value | Pass | `StarterFormTemplate.choice.logic.test.ts`: clicking an unselected card moves `is-selected` to it and the typed value lands under that branch; clicking a second card moves it again. |
| 6 `#icon` override reaches every choice-card icon | Pass | `StarterFormTemplate.choice.logic.test.ts`: the custom render output replaces the Lucide default on a choice card's icon. |
| 7 No Tailwind, no `<style scoped>`, classes exist in the stylesheet | Pass | `noTailwind.test.ts`, `noScopedStyle.test.ts`, `classUsage.test.ts` (whole-tree auto-scans, no changes needed to the test files themselves). |
| 8 `specs/components.md` entry extended | Pass | The existing `packages/starter/` row gained an additive paragraph describing the choice chrome; no existing row text was replaced. |
| 9 Code hygiene | Pass | `sourceHygiene.test.ts` (auto-scans the new files); manual read found no spec/process references or em dashes in any new source or test file; `ci:lint`/`ci:typecheck`/`ci:test` all green. |

Edge cases: a choice option with no `iconName` (no `sft-choice-icon` region, text still renders) and an `iconName` outside the registry (nothing throws, no glyph, one `console.warn`, text still renders) are both covered in `StarterFormTemplate.choice.test.ts`/`.choice.logic.test.ts`; an automatic-mode choice with a single branch renders identically to the two-branch case, covered in `StarterFormTemplate.choice.test.ts`.

### Reactivity / analytics

`StarterFormTemplate.choice.analytics.test.ts` added, mirroring `ElementPlusFormTemplate.choice.analytics.test.ts`'s shape: a minimal bare-slot template renders the same repeatable-choice metadata, and the starter template's per-occurrence render-count delta when a second branch occurrence is added is asserted no greater than the minimal template's delta (a relative comparison, since an add legitimately bumps the engine's own array-mutation cost). A second case confirms typing into one occurrence does not bump a sibling occurrence's render count. A third case, specific to this story, confirms that typing into one automatic-mode branch field does not bump an unrelated sibling field's render count outside the choice.

### Process compliance

- `specs/components.md`: updated additively, confirmed the existing element-plus and starter rows above/below are untouched.
- No changeset: confirmed `git diff --stat packages/core/src` is empty; `packages/starter` stays `private: true`.
- Library API rules: `src/index.ts` is unchanged by this story (no new export); all four new components stay internal per ADR 4, confirmed by reading `index.ts` directly. All identifiers camelCase; no kebab-case in any new `.vue` file.
- No spec/process references or em dashes found in any new source or test file (manual read, consistent with `sourceHygiene.test.ts`'s automated scan).

### Manual verification outstanding (Jeroen)

1. Open `specs/components.md`, confirm the extended `packages/starter/` row reads well in context (AC8).
2. Visually compare the automatic-mode group, the explicit-mode card grid (both selection states, odd and even option counts), and the choice-array add bar against `prototype.html#choice-auto`/`#choice-explicit`/`#choice-array` in both color modes.
3. Visually confirm the selected card's gradient background and ring read as clearly distinct from the resting card in both color modes.
4. Visually diff the six sample choice-card icons (`building2`, `rocket`, `calendar`, `briefcase`, `shield`, `sparkles`) against `prototype.html#icons`.

### Overall status: verifying

All nine acceptance criteria pass with direct test evidence. `pnpm run ci:test`/`ci:lint`/`ci:typecheck` are green across all three workspace packages, and `packages/starter`'s own coverage (99.51/96.33/95.83/99.51) meets or improves on every metric over ST-03's baseline with no drop anywhere else in the workspace. ST-05 depends on ST-02 (not this story) but is sequenced after it; FEAT-007 stays `in-progress`.

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field once it exists.

## QA verification report

### Independent pipeline run

- `pnpm run ci:test` (`pnpm -r ci:test`): `packages/core` 686 tests (27 files) pass, `packages/element-plus` 480 tests (32 files) pass, `packages/starter` 360 tests (51 files) pass. No failures, no unexpected console warnings (the one `[Vue warn]` printed during `packages/starter`'s run is a pre-existing extraneous-class-on-fragment-root warning, confirmed also printed by `packages/core`'s own tests, unrelated to `ChoiceSectionCard`).
- `pnpm run ci:lint`: clean for `core`, `starter`, `element-plus`.
- `pnpm run ci:typecheck`: clean for all three.
- `pnpm -r ci:test:coverage` (`TZ=Europe/Amsterdam`): `packages/starter` 99.51% statements / 96.33% branch / 95.83% functions / 99.51% lines, matching the developer's reported numbers exactly. `ChoiceSectionCard.vue` 100/95.83/100/100 (line 31, the `activeChoiceOccurrences?.[0]?.branchKey` optional-chain branch), `ChoiceArraySectionCard.vue` 100/93.75/100/100 (line 42, `addOptionReasonId`'s ternary), matching the disclosed gap exactly. `packages/core` 97.57% statements (unchanged; `git diff --stat packages/core/src` confirmed empty), `packages/element-plus` 100%/98.52% branch (unchanged). No drop anywhere.
- No `docs/` change in this story; `pnpm docs:build` not required.

### Acceptance criteria (all 9 re-walked directly against source and tests)

| AC | Verdict | Evidence |
| --- | --- | --- |
| 1 | Pass | `StarterFormTemplate.vue` wires `#default-choice` to `ChoiceField`; `StarterFormTemplate.choice.test.ts` asserts `sft-choice-group`/`-title`/`-desc`/`-body`. |
| 2 | Pass | `#heading-choice` wires `ChoiceSectionCard`, which renders `sft-choice-grid` of `ChoiceCard`s with `sft-choice-radio`/`-dot`, `-text`, `-title-row`, `-title`, `-desc`; `is-selected` driven by `isActive()` reading `activeChoiceOccurrences`. |
| 3 | Pass | Icon mapped via `icon: x.iconName` into `ChoiceOption.icon: StarterIconName`, rendered through `<StarterIcon :name="option.icon">`. `metadata.test.ts` line 35 type-asserts `StarterFieldProperties['iconName']` equals `StarterIconName | undefined`, confirming the `AppIconName` migration at the type level, and `StarterFormTemplate.choice.test.ts` confirms it at runtime. |
| 4 | Pass | `ChoiceArraySectionCard.vue` gates `sft-choice-addbar-reason` on `v-if="!canAdd(option.value)"` (line 65); `StarterFormTemplate.choice.array.test.ts` directly asserts the reason text exists only for the disabled `webhook` branch and `.exists() === false` for the addable `email`/`sms` branches. Count pill reuses `SectionCard`'s `sft-pill` via the `:tag="countTag"` prop (no local reimplementation); active occurrences reuse `RepeaterCard`'s `sft-repeater`/`-header`/`-title-group`/`-badge`/`-title` unchanged. `classUsage.test.ts` confirms every `sft-`/`is-*` class referenced in these files exists in `style.css`, and none of the four files introduce a class outside the existing ST-01 stylesheet. |
| 5 | Pass | `StarterFormTemplate.choice.logic.test.ts` confirms `is-selected` moves on click and the bound value switches branch. |
| 6 | Pass | `#icon` override verified to reach the choice-card glyph through `StarterIcon`'s inject chain. |
| 7 | Pass | `noTailwind.test.ts`/`noScopedStyle.test.ts`/`classUsage.test.ts` scan the whole tree including the four new files; none of `ChoiceField.vue`/`ChoiceCard.vue`/`ChoiceSectionCard.vue`/`ChoiceArraySectionCard.vue` uses `<style scoped>` or a Tailwind class, confirmed by direct read. |
| 8 | Pass | `specs/components.md`'s `packages/starter/` row carries an additive paragraph describing the choice chrome; the element-plus and prior starter text above it is untouched. |
| 9 | Pass | No spec/process references or em dashes found on direct read of the four new `.vue` files and their tests; camelCase throughout; `ci:lint`/`ci:typecheck`/`ci:test` all green. |

### Prototype / sibling comparison

Class-level comparison against `AdvancedFormTemplate.vue`'s wiring (lines 152/159/167/173/216/233) and the prototype's `#choice-explicit`/`#choice-auto`/`#choice-array` sections confirms the same structural shapes (grid, radio dot, add-bar) carried over with `sft-` classes only; no visual drift found against ST-03's array/group chrome (same `SectionCard`/`RepeaterCard` reuse pattern). Pixel-level comparison in both color modes is unautomatable and stays on Jeroen's manual checklist as the story states.

### Deviation review (checked directly against source, not taken on trust)

1. **`props.label` fix.** Confirmed: `ChoiceSectionCard.vue` line 63 reads `toValue(props.label)`, the only chrome component that dereferences an inherited (`extends /* @vue-ignore */`) prop directly in its own template rather than only forwarding it via `v-bind="$props"`. The full `pnpm run ci:test` output was grepped for `Vue warn` and `was accessed during render`: no such warning appears anywhere in the `packages/starter` run. Accepted as described, no behavior change, console stays clean.
2. **Attrs-leak claim.** Verified directly: `ArraySectionCard.vue` (ST-03) does `<SectionCard v-bind="$props" :tag="...">` with its own extra props (`canAddItems`, `itemsCount`, `itemsName`, `itemsNamePlural`, `noItemsMessage`) exactly as `ChoiceSectionCard.vue`/`ChoiceArraySectionCard.vue` do with theirs (`options`, `activeChoiceOccurrences`, etc.), and `SectionCard.vue`'s own `Props` interface declares none of them. The "pre-existing in ST-03" claim holds on direct inspection; this is not a new problem this story introduces.
3. **Extra coverage tests.** Confirmed present (`ChoiceSectionCard.test.ts`, `ChoiceArraySectionCard.test.ts`, `ChoiceCard.test.ts`, plus the `choiceShowChoiceSelect: false` assertions in `StarterFormTemplate.choice.test.ts`) and harmless; they close branches no AC requires but don't contradict any AC.
4. **Uncovered branches.** Confirmed by direct coverage run: `ChoiceSectionCard.vue` line 31 and `ChoiceArraySectionCard.vue` line 42 are the only gaps, both the disclosed shared ternary shape. Package-wide branch coverage (96.33%) exceeds ST-03's stated baseline (96.25%), so the gap does not regress the workspace gate.

### Process compliance

`specs/components.md` updated additively (AC8). No changeset needed: `packages/core/src/` untouched, `packages/starter` stays private. No new public export: all four files stay internal per ADR 4, confirmed against `index.ts`. camelCase throughout, no kebab-case in new `.vue` files. Test naming follows convention (`.test.ts`/`.logic.test.ts`/`.validation.test.ts`/`.analytics.test.ts`/`.array.test.ts`).

### Verdict: pass

All nine acceptance criteria verified with direct evidence against source, not just the developer's claims. Pipeline (`ci:test`, `ci:lint`, `ci:typecheck`) and coverage independently re-run and green, matching the developer's reported numbers exactly. All four disclosed deviations checked directly against source and confirmed as described, including the attrs-leak claim's "pre-existing in ST-03" assertion.

Status set to `done`.

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field. This was the last open story before ST-05/06/07; FEAT-007 itself stays `in-progress` since those remaining stories are still open.
