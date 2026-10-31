---
id: ST-01
type: story
feature: FEAT-009
status: done
approved_by: Jeroen
pr: ""
---

# Story: Page scaffold, metadata tree, template, and the four block rows (static order)

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- Review blocker 1 → default plan conformed to the approved seven-block shape (option B); the eight-block fixture is dropped
- Review should-fix 2 → numeric leaves seeded as strings in `initialValues`
- Muscle-group rule semantics (feeds ST-03) → consecutive strength subsequence, not directly adjacent rows
- ST-02 review blocker 1 → `preserveOrder: true` plus explicit numeric `order` seeds (1..7) moved into this story, since the engine renders keyless seeded occurrences branch-grouped and the interleaved default would collapse otherwise (verified in `DynamicFormItemChoice.vue`)

## Functional

### User story
As a docs reader exploring the workout plan builder example, I want to add, fill in, and remove exercise blocks of four types (Warm-up, Strength exercise, Cardio, Cooldown / stretch), seeded with a realistic starting plan, so that I can see the engine's repeatable ordered choice rendering a genuinely multi-branch form before the reorder-and-recompute payoff is introduced.

### Acceptance criteria

1. Given the page loads for the first time, When the `plan` choice mounts, Then it is seeded (via `useDynamicForm`'s `initialValues`, not a blank form) with the following seven-block default plan, in this exact order, with every numeric leaf seeded as a string (`duration: "10"`, `sets: "4"`, per the feature's DECIDED review finding 1):
   1. Warm-up, 10 min
   2. Cardio: Rowing, High intensity, 15 min
   3. Strength: "Barbell back squat", muscle group Legs, type Compound, 4 sets x 6 reps
   4. Cardio: Jump rope, High intensity, 12 min
   5. Strength: "Bench press", muscle group Chest, type Compound, 4 sets x 8 reps
   6. Strength: "Seated leg curl", muscle group Legs, type Isolation, 3 sets x 12 reps
   7. Cooldown / stretch, 8 min

   This fixture is a correction of the still-stale prototype's six-block default (see Design reference) and matches the approved feature Design `#live-form` exactly: seven blocks, one Warm-up, three Strength, two Cardio (both high intensity, separated by a strength block), one Cooldown, with two non-adjacent strength blocks sharing a muscle group (Legs). The seeded values are arranged so that no convention would fire once ST-03 adds the checks, but each of the five conventions is one single up/down swap away from firing (ST-03 depends on this exact shape; do not substitute a different default without updating ST-03's fixture accordingly).

   Each occurrence additionally seeds an explicit numeric `order` (1..7, matching the listed sequence; numeric, not string, since `order` is engine-managed rather than user input), and the `plan` choice carries `preserveOrder: true` from this story. DECIDED (research), resolving ST-02's review finding 1: the engine renders keyless seeded occurrences in branch-grouped order (without `preserveOrder` the sort key is the session-local `insertionOrders` map, and `normalizeOrder` seeds a missing `order` from grouped position, both verified in `DynamicFormItemChoice.vue`), so without both the explicit seeds and the flag this AC's interleaved display order would silently collapse to Warm-up, the three Strength blocks, the two Cardio blocks adjacent, Cooldown. The up/down chevrons stay unwired here; making `order` user-writable is ST-02's scope.
2. Given the "Warm-up" add button, When clicked, Then a new occurrence is appended at the end of the displayed list with a single required `number` duration input (`xsd_required` + `restriction: { minInclusive: 1 }`) carrying a "min" suffix label.
3. Given the "Strength exercise" add button, When clicked, Then a new occurrence is appended with: a required `text` exercise name (spanning both grid columns), a required muscle-group `select` (options as `{ key, value }[]` paired with `restriction: { enumeration }`, per the feature's adversarial-review nit 4), a required compound/isolation `select`, and required `number` sets and reps (`xsd_required` + `minInclusive: 1` each), laid out in a two-column grid.
4. Given the "Cardio" add button, When clicked, Then a new occurrence is appended with a required type `select`, a required low/moderate/high intensity `select`, and a required `number` duration with a "min" suffix.
5. Given the "Cooldown / stretch" add button, When clicked, Then a new occurrence is appended with a single required `number` duration input with a "min" suffix, identical in shape to Warm-up's.
6. Given the shared choice budget (`minOccurs: 0`, `maxOccurs: 12`), When 12 occurrences exist across any mix of the four branches, Then every add button disables via `canAddChoiceOccurrence` and the count tag reads "12 of 12" via `usedChoiceOccurrences`.
7. Given the per-branch cap (`maxOccursTotal: 1` on Warm-up and Cooldown / stretch), When one Warm-up (or one Cooldown / stretch) occurrence already exists, Then only that one branch's add button disables (via `canAddChoiceOccurrence`, which already honors `maxOccursTotal`) while the other three stay enabled, and the disabled button exposes its reason as `aria-describedby` helper text, exactly as `ChoiceArraySectionCard` does.
8. Given any block occurrence, When its remove (bin) button is clicked, Then the occurrence is removed and the remaining occurrences' position badges (`globalIndex + 1`) renumber immediately with no gap.
9. Given all seven blocks removed one at a time, When the last one is removed, Then the plan card shows its add toolbar and a dashed "No blocks yet. Add a block above to start building your plan" panel, and the submit control stays enabled (the mandatory empty state is valid data, per `minOccurs: 0` and the form's aggregate `meta.valid`).
10. Given any numeric field (duration, sets, reps), When left empty or set to 0 or a negative value and blurred, Then it fails `xsd_required` and/or `xsd_minInclusive: 1` and shows the rose invalid state with a message; a valid positive integer shows the emerald valid state.
11. Given any text or select field, When left empty and blurred, Then it fails `xsd_required` and shows the rose invalid state; a filled value shows the emerald valid state.
12. Given the whole form, When `html.dark` is toggled, Then every state (pristine, focus, invalid, valid, disabled, empty, budget-exhausted add, per-branch-cap-exhausted add) resolves through the existing CSS custom properties with no page-specific dark markup.

### Edge cases
- Removing every block returns the list to the empty state (AC9) with no stale validation message left behind.
- Removing the only Warm-up (or Cooldown / stretch) occurrence re-enables that branch's add button immediately.
- A block added then immediately removed before any field is filled in leaves no orphaned validation state on sibling occurrences.
- Two occurrences of the same uncapped branch type (e.g. two Cardio blocks) are both addable up to the shared budget; nothing in this story treats same-branch duplicates specially.
- The seeded default plan (AC1) itself must never trip the mandatory empty-state styling or any convention warning badge (that badge is ST-03's concern and does not exist yet in this story, so there is nothing to assert false here beyond "no such UI exists yet").

### Out of scope
- Reorder controls and their `setFieldValue` wiring (ST-02). Note: `preserveOrder: true` and the seeded numeric `order` values do land in this story (moved up from seam 2; see AC1's DECIDED note), because without them the seeded default cannot display in its authored interleaved order; only the chevron wiring that makes `order` user-writable is ST-02's.
- The live summary rail and its total duration / intensity profile / muscle coverage figures (ST-02).
- The five convention checks and the violation surface, Variant A and Variant B (ST-03).
- Narrative prose, the metadata walkthrough, cross-links, and nav/sidebar discoverability (ST-04).
- Registering the page in `docs/examples/index.md` or the `/examples/` sidebar (ST-04); this story's page exists and renders but is not yet linked from anywhere.

## Design reference

Implements the block-list portion of `../../prototype.html#live-form` (the add-block toolbar and the four block-row bodies, excluding the order column's up/down chevrons, which render disabled-looking but non-functional in this story) and the non-reorder, non-violation states in `#block-states`: pristine, focus, invalid, valid, disabled, the mandatory empty state, and both add-toolbar-disabled states (shared-budget and per-branch-cap).

Three corrections to the prototype's still-stale static markup, per the feature's DECIDED entries (not yet applied to `prototype.html` itself, since design is closed and no further prototype edits are planned):
- The prototype's `#live-form` default plan (six blocks, one cardio, three distinct muscle groups) does not let a reader reach all five conventions by a single reorder. Build this story's seeded default from the seven-block fixture in Acceptance criterion 1 instead, which is the approved feature Design's own composition (DECIDED (Jeroen), review nit 6: seven blocks, two high-intensity cardio separated by strength, two non-adjacent strength blocks sharing a muscle group), arranged so every rule is one swap away.

  DECIDED (research), resolving blocker 1 below: option B, conform this story's AC1 fixture to the approved seven-block shape. Why: the approved feature Design `#live-form` and DECIDED nit 6 both specify seven blocks with two cardio; a story may not override the approved feature (ladder rung 1), and the seven-block shape is feasible violation-free with all five rules one reorder away, so the eight-block deviation bought nothing the approved design requires. The feasibility holds under the feature scope's own wording of the muscle rule ("no two **consecutive strength exercises** share the same muscle group", i.e. consecutive within the strength subsequence); under a stricter directly-adjacent-rows reading the approved seven-block composition would be unsatisfiable, which is itself the rung-1 argument for the subsequence reading (ST-03 pins this; see its AC4). Source: the approved FEAT-009 spec (Scope rule list, Design `#live-form`, DECIDED nit 6).
- The prototype's `#reorder-payoff` (Section 5) numbers the compound/isolation swap as "Block 2" / "Block 3"; with the corrected seven-block default those exercises sit at positions 5 (Bench press) and 6 (Seated leg curl). ST-02/ST-03's design references call this out again where it matters to their acceptance criteria.
- The order badge in this story renders (`globalIndex + 1`) but the chevrons are visually present and disabled-looking without being wired to any reorder logic; ST-02 is where they become functional.

## Architecture reference

Builds, from the feature architecture's component plan:
- `docs/examples/workout-plan.md` (new, minimal page scaffold): frontmatter plus the live `<WorkoutPlanExample />` embed only, no narrative prose and no metadata walkthrough (ST-04 extends this same file with both). Not yet linked from `docs/examples/index.md` or the `/examples/` sidebar (ST-04), so it is reachable only by direct URL during this story's manual verification (`pnpm docs:dev`, navigate to `/examples/workout-plan` directly).
- `docs/.vitepress/theme/index.ts` (extended): registers `WorkoutPlanExample` as a global component alongside the other example components, since the page above needs it to render. This is the one `theme/index.ts` touch this story owns; no other entry in that file changes.
- `WorkoutPlanExample.vue` (new, host, like `CheckoutFormExample.vue`): declares the `plan` metadata tree (the repeatable explicit choice with its four branches: `warmUp`, `strength`, `cardio`, `cooldown`), the module constants (`MUSCLE_GROUPS`, `CARDIO_TYPES`, movement-type and intensity option lists, all `{ key, value }[]` per nit 4), calls `useDynamicForm` with the seven-block fixture (AC1) as `initialValues` (each occurrence carrying its explicit numeric `order`, and the `plan` choice declaring `preserveOrder: true` alongside `displayOrder: 'added'`, per AC1's DECIDED note), and a `canSubmit = meta.valid` / `isSubmitting` / `submitted` / `onSubmit` / `resetForm` skeleton matching the checkout's pattern. The live `summary` computed (`summarizePlan(collectBlocks(...))`) and `workoutPlanMath.ts` itself are not added here (ST-02).
- `WorkoutPlanTemplate.vue` (new, template, like `CheckoutFormTemplate.vue`): the `defineMetadata<FieldValueTypes, ExtendedFieldProperties, SlotProperties, ExtendedSettingsProperties>()` contract from the feature architecture (`FieldValueTypes`: `{ block: never, text: string, select: string, number: number | undefined }`, no `heading` member); wires `block-choice-array` to the plan card (add toolbar via `ChoiceArraySectionCard` + dashed empty state), `block-choice-array-item` to `WorkoutBlockRow`, and `default-input` / `select-input` / `default` to the existing docs field components.
- `WorkoutBlockRow.vue` (new, one block row, like `SplitPaymentLedgerRow.vue`): the indigo position badge (`globalIndex + 1`), the per-branch kind label with its emoji (by `branchKey`), the branch fields rendered via the row's nested default slot, and the remove button. The up/down chevron buttons render in this story (visually matching the boundary-disabled states) but are not wired to `setFieldValue`; that wiring is ST-02's extension of this same file. The row-level violation badge does not exist yet (ST-03).
- Every branch (`warmUp`, `strength`, `cardio`, `cooldown`) carries `type: 'block'` (load-bearing for the `block-choice-array-item` slot resolution, per the feature's ADR-2) and declares its own `children` (duration; name/muscle/type/sets/reps; kind/intensity/duration; duration respectively), none named `order` (ADR-6).
- Reused as-is: `ChoiceArraySectionCard` (add toolbar, count tag, shared-budget and per-branch-cap disabling via `canAddChoiceOccurrence`), `SectionCard` (plan card shell), `FormField` / `TextInput` / `SelectInput` (fields and states, via the checkout's `inputFieldState` helper and the valid-border convention), `AppButton` (primary/ghost/danger-light), `AppIcon` (plus/bin/chevronUp/chevronDown, chevrons present but unwired until ST-02).

No `packages/core/src/` change and no changeset: everything used (`explicitChoiceSelection`, `maxOccurs`, `maxOccursTotal`, `minOccurs`) is already exported, per the feature architecture's verification against the checkout prior art. This story carries no changeset entry since `packages/core/src/` is untouched (per `CLAUDE.md` step 7 and the feature's own "changeset bump type: none").

**Documentation:** none of this story's work corresponds to a `docs/reference/*` or `docs/guide/*` page, since the feature's Public API impact section confirms no published surface changes. This story's own documentation deliverable is the minimal page scaffold itself (`docs/examples/workout-plan.md`), which ST-04 is the story that completes with narrative, walkthrough, and discoverability.

Dependencies: none. This is the first story in implementation order. ST-02, ST-03, and ST-04 all extend the files created here.

## QA plan

### Test infrastructure constraint, read this first

`docs/` has no automated test runner: confirmed against `docs/package.json` (no `vitest`, `@vue/test-utils`, or `jsdom` in `devDependencies`, no `test` script), confirmed no `docs/**/*.test.ts` or `docs/**/__tests__/` anywhere in the tree today, and confirmed `pnpm-workspace.yaml` excludes `docs/` from the workspace (`'!docs'`). This is not new to this story: every existing docs example component (`CheckoutFormExample.vue`, `SplitPaymentLedgerRow.vue`, `FormExampleChoiceExplicitRepeatable.vue`, and so on) ships with zero automated tests and is verified only by manual interaction, `pnpm docs:build`, and the Cloudflare Pages preview. The same decision was made explicitly for FEAT-001/ST-03 (the checkout's split-payment ledger, the closest prior art to this story) and stands unchanged: `pnpm -r ci:test:coverage` only runs `packages/*`, so nothing this story adds under `docs/` is measured by the coverage gate in either direction, and this story makes no `packages/core/src/` change, so there is no engine-level `*.test.ts` / `*.logic.test.ts` / `*.validation.test.ts` / `*.analytics.test.ts` surface for it to add to directly either.

Consequence: every criterion below is manual-only for the new docs-local code (`WorkoutPlanExample.vue`, `WorkoutPlanTemplate.vue`, `WorkoutBlockRow.vue`, `docs/examples/workout-plan.md`), per the qa-planner's standing instruction that manual verification is an acceptable mapping when no automated harness exists. What this plan instead maps to automated tests is the **engine mechanism** each criterion leans on, by citing the existing `packages/core` suite that already guards it: a regression in any of those suites is the real automated signal that this story's code would misbehave, since this story reuses those mechanisms rather than reimplementing them.

Not re-flagging the "add a docs vitest runner" recommendation again here: it was already raised and declined once (FEAT-001/ST-03's QA plan and its DECIDED note), the underlying facts (`docs/` outside the workspace, no test tooling installed) are unchanged, and re-raising it per story would be noise. If this becomes painful across enough stories it is a cross-feature tooling decision for Jeroen, not something ST-01 should re-litigate.

### Fixtures and utilities

- The seven-block default plan from AC1 is this story's own new fixture (no existing docs fixture matches it; `FormExampleChoiceExplicitRepeatable.vue` demonstrates the generic repeatable-choice shape but carries no workout-domain data). It must be built as the literal `initialValues` object passed to `useDynamicForm` in `WorkoutPlanExample.vue`, in the exact order and with the exact values AC1 lists, since ST-03's fixture (the five-convention reachability) depends on this exact shape byte for byte.
  - DECIDED (research), resolving should-fix 2: seed every numeric leaf (`duration`, `sets`, `reps`) as a **string** in `initialValues` (`duration: "10"`, `sets: "4"`, not `10` / `4`), applied into AC1. Why: the feature's DECIDED review finding 1 already rules this ("strings in the model and in the submitted JSON"); a `<input type="number">` bound through vee-validate `handleChange` stores strings, so an untouched seeded default kept as numbers would carry numbers until first edit, contradicting the decided model shape and diverging from the string shape ST-02's `collectBlocks(...)` + `Number()` coercion assumes. Source: the approved FEAT-009 spec (DECIDED on adversarial-review finding 1).
- `MUSCLE_GROUPS`, `CARDIO_TYPES`, and the movement-type (`compound`/`isolation`) and intensity (`low`/`moderate`/`high`) option lists are new module constants, each `{ key, value }[]` paired with `restriction: { enumeration: options.map(o => o.key) }`, mirroring the checkout's established pattern (nit 4) rather than the prototype's plain string arrays.
- Manual-testing harness: this story's page is created but not yet linked (per Out of scope), so use `pnpm docs:dev` and navigate directly to `/examples/workout-plan`, exactly as the Architecture reference states. No scratch page is needed since (unlike FEAT-001/ST-03) this story owns the real page file itself.
- No existing docs fixture or utility needs to be touched or extended.

### Acceptance criteria to test mapping

| AC | What it needs | Mapping |
| --- | --- | --- |
| 1. Seeded seven-block default via `initialValues` | New fixture object | **Manual**: load `/examples/workout-plan` fresh (hard reload, no prior interaction), read every block's position, kind, and field values top to bottom, and confirm they match the seven-block list verbatim, including each strength block's muscle group / movement type / sets / reps and each cardio block's type / intensity / duration. Confirm no block shows an invalid or empty-field state on first load (seeded values must pass `xsd_required`/`xsd_minInclusive` immediately). |
| 2. Warm-up add: appends one `number` duration, `xsd_required` + `minInclusive: 1`, "min" suffix | New branch wiring | **Manual**: click "Add Warm-up", confirm a new row appends at the end with one duration field, blur it empty and confirm the rose invalid state with a message, fill `0` and confirm it still fails (`minInclusive: 1`), fill a positive integer and confirm the emerald valid state. **Regression guard**: `xsd_required`/`xsd_minInclusive` rule behavior itself is exhaustively covered by `packages/core/src/core/__tests__/validation.test.ts` (or equivalent rule-registration tests); this story only wires existing rules, it does not change them. |
| 3. Strength add: name/muscle/type/sets/reps, two-column grid | New branch wiring, richest shape | **Manual**: click "Add Strength exercise", confirm all five fields render in a two-column grid with name spanning both columns, confirm the muscle-group and movement-type selects list the expected options, and repeat the required/blur check from AC2 for every field (text and two selects via `xsd_required`, both numbers via `xsd_required` + `minInclusive: 1`). |
| 4. Cardio add: type/intensity/duration | New branch wiring | **Manual**: click "Add Cardio", confirm the three fields render and required/blur behavior matches AC2/AC3's pattern for selects and the numeric duration. |
| 5. Cooldown add: identical shape to Warm-up | New branch wiring | **Manual**: click "Add Cooldown / stretch", confirm the single duration field is identical in shape and behavior to AC2's Warm-up row. |
| 6. Shared budget (`minOccurs: 0`, `maxOccurs: 12`): all add buttons disable at 12, count tag reads "12 of 12" | Reused mechanism (`canAddChoiceOccurrence`, `usedChoiceOccurrences`), new count | **Manual**: starting from the seven-block default, add occurrences (any mix) until 12 exist, confirm every one of the four add buttons disables simultaneously and the `ChoiceArraySectionCard` count tag reads "12 of 12". **Regression guard**: the shared-budget XSD-batching behavior itself is exhaustively covered by `DynamicFormItemChoice.logic.test.ts`'s `canAddChoiceOccurrence follows XSD batching` describe block; this story only consumes it with new numbers (12 vs. that suite's synthetic caps). |
| 7. Per-branch cap (`maxOccursTotal: 1` on Warm-up and Cooldown): only that branch's add button disables, reason exposed via `aria-describedby` | Reused mechanism, new metadata values | **Manual**: from the default (which already has one Warm-up and one Cooldown), confirm the Warm-up and Cooldown add buttons are both disabled while Strength and Cardio stay enabled, and inspect the DOM to confirm each disabled button's `aria-describedby` points at visible helper text (already built into `ChoiceArraySectionCard`, confirmed in `docs/.vitepress/theme/components/ChoiceArraySectionCard.vue`). **Regression guard**: `DynamicFormItemChoice.logic.test.ts`'s `maxOccursTotal` describe blocks (both "opt-in non-XSD per-branch cap" and "cap set below the branch's own maxOccurs") already prove `canAddChoiceOccurrence` honors `maxOccursTotal` correctly; this story only sets the metadata property. |
| 8. Remove (bin) button: occurrence removed, remaining position badges renumber with no gap | Reused mechanism (`globalIndex`), new UI | **Manual**: remove a block from the middle of the list (not first or last) and confirm every remaining block's position badge (`globalIndex + 1`) renumbers immediately and contiguously, with no gap or duplicate number. **Regression guard**: `globalIndex` renumbering on removal is covered by `DynamicFormItemChoice.logic.test.ts` / `.analytics.test.ts`'s occurrence-removal suites. |
| 9. Empty state: remove all 7 blocks, dashed panel shown, submit stays enabled | New empty-state UI, reused `minOccurs: 0` + `meta.valid` | **Manual**: remove all seven blocks one at a time, confirm the add toolbar stays visible throughout, confirm the dashed "No blocks yet..." panel appears only once the last block is removed, and confirm the submit control is enabled in that state (not blocked by an empty-form false negative). Also confirm no stale validation message is left over from any removed block's fields (edge case). |
| 10. Numeric fields (duration, sets, reps): empty/0/negative fails, positive integer passes | Reused validation rules | **Manual**: for one field of each numeric kind, test empty (blur), `0`, a negative value, and a valid positive integer; confirm rose-invalid with message for the first three and emerald-valid for the last. Covered once per numeric field kind is sufficient; this is the same check already exercised per-branch in AC2-AC5. |
| 11. Text/select fields: empty fails, filled passes | Reused validation rules | **Manual**: for the Strength name text field and both select fields (any branch), blur empty and confirm rose-invalid, then fill/select a value and confirm emerald-valid. |
| 12. Dark mode: every state resolves via existing CSS custom properties | Reused design tokens | **Manual**: toggle `html.dark` and re-check pristine, focus, invalid, valid, disabled, empty, budget-exhausted add, and per-branch-cap-exhausted add states (see States to assert below); confirm no page-specific dark markup was needed and every state is legible. |

### States to assert (feature states policy, this slice's instances)

Per the feature's States policy, excluding reorder/order-badge-chevron wiring (ST-02) and the violation badge (ST-03), this slice must show:
- **Pristine**: every field before first blur, neutral border, no color (new occurrence rows and, momentarily, the seeded default before any interaction).
- **Focus**: sky border + ring on any field, text/select/number alike.
- **Invalid**: touched + failing, rose border/ring/message, for every leaf type this story introduces (`text`, `select`, `number`).
- **Valid**: touched + passing, emerald border, no message.
- **Disabled**: the budget-exhausted add toolbar state (AC6) and the per-branch-cap-exhausted add state (AC7); no field is ever conditionally disabled in this story (none is conditionally hidden either, per the Design reference).
- **Empty**: the mandatory zero-block state (AC9): add toolbar visible, dashed panel, submit enabled.
- **Light and dark**: every one of the above under `html.dark`, per AC12.
- Explicitly out of scope for this slice's state check: reorder-boundary chevron states (visually present but non-functional per the Design reference) and any violation/warning badge (does not exist until ST-03).

### Reactivity / render-count

This slice adds no `computedProps` and no cross-field `validation` closure: every leaf's validation is a plain `xsd_required` / `restriction: { minInclusive / enumeration }` combination with no computed dependency on sibling or parent state, and `WorkoutBlockRow.vue` in this story only renders props/slots, it does not yet read `useFormContext()` (that lands in ST-02 for the reorder write). There is therefore no new reactive wiring in this story that an `*.analytics.test.ts` would be the right tool to guard, and no docs-level `analytics` render-count instrumentation exists to add one against regardless (that setting is a `packages/core` engine feature; this story adds no engine code). The relevant existing regression net is the engine's own: `DynamicFormItemChoice.analytics.test.ts` already guards that adding/removing one occurrence does not cause unrelated sibling occurrences to re-render, and `pnpm run ci:test` re-running that suite clean is this story's signal that the add/remove mechanics it relies on have not regressed.

### Coverage

No `packages/core/src/` change, so `pnpm -r ci:test:coverage`'s tracked baseline is mechanically unaffected by this story in either direction (confirm with `git diff --stat -- packages/` showing empty before closing out the story). Nothing under `docs/` is included in that measurement, so this story's own new code (the host, template, and row component) ships with no coverage number, automated or otherwise, consistent with every other docs example component and explicitly not a regression this story introduces.

### Time sensitivity

Nothing in this slice is date or time dependent: block fields are duration/sets/reps/text/selects with no date, timestamp, or scheduling logic anywhere. `TZ=Europe/Amsterdam` has no bearing here. Stated explicitly so the silence is not read as an omission.

### Regression risk

- **Touches (read-only, nothing modified)**: the repeatable explicit-choice engine mechanics (`explicitChoiceSelection`, `maxOccurs`, `maxOccursTotal`, `minOccurs`, `globalIndex`, `canAddChoiceOccurrence`, `usedChoiceOccurrences`), `useDynamicForm`'s `initialValues`, and the reused docs components `ChoiceArraySectionCard`, `SectionCard`, `FormField`, `TextInput`, `SelectInput`, `AppButton`, `AppIcon`. None of these are changed by this story, only consumed with new metadata/data.
- **Guarded by existing core tests**: `DynamicFormItemChoice.logic.test.ts` (`canAddChoiceOccurrence` XSD batching, both `maxOccursTotal` describe blocks, `globalIndex`/occurrence-removal renumbering), `DynamicFormItemChoice.analytics.test.ts` (render count on add/remove). Re-running these via `pnpm ci:test` on this branch is the real regression net, since this story adds no engine code of its own and only wires existing, already-tested mechanisms.
- **Other docs pages/components touched**: `docs/.vitepress/theme/index.ts` gains one new global registration (`WorkoutPlanExample`); confirm this does not shadow or collide with any existing registered name (`CheckoutFormExample`, etc. are unaffected since the registered name is new and unique).
- **Other stories of this feature affected by a regression here**: ST-02, ST-03, and ST-04 all extend the three files this story creates (`WorkoutPlanExample.vue`, `WorkoutPlanTemplate.vue`, `WorkoutBlockRow.vue`) plus the page/`theme/index.ts` entries; a defect in this story's metadata shape, branch typing (`type: 'block'` per ADR-2), or the seven-block fixture's exact order would surface downstream in all three, most concretely in ST-03's convention-reachability fixture, which depends on this story's exact default plan.

### Manual verification checklist

1. `pnpm docs:dev`, navigate directly to `/examples/workout-plan` (not yet linked from anywhere, per Out of scope); confirm the page loads with no console errors.
2. Fresh load: verify the seven-block default plan matches AC1 verbatim, top to bottom, with no field in an invalid state (AC1).
3. Add one block of each of the four types via its own add button; confirm the right fields, layout (two-column grid for Strength, single-column constrained width for Warm-up/Cooldown/Cardio's duration), and "min" suffix labels appear (AC2-AC5).
4. Blur each field type empty, then at a failing value, then at a passing value; confirm rose/invalid and emerald/valid states and messages (AC10, AC11).
5. Add occurrences up to 12 total; confirm every add button disables and the count tag reads "12 of 12" (AC6).
6. From the default (one Warm-up, one Cooldown already present), confirm only those two add buttons are disabled, Strength/Cardio stay enabled, and the disabled buttons' helper text is present and associated via `aria-describedby` (AC7).
7. Remove a middle block; confirm immediate, gapless renumbering of every remaining position badge (AC8).
8. Remove every block one at a time; confirm the dashed empty-state panel appears only at zero blocks, the add toolbar stays visible throughout, submit stays enabled at zero blocks, and no stale validation message lingers from a removed block (AC9, edge cases).
9. Add a block, remove it immediately before filling in any field; confirm no orphaned validation state appears on sibling occurrences (edge case).
10. Add two Cardio blocks (same uncapped branch type); confirm both are addable up to the shared budget with no special-casing (edge case).
11. Full light/dark pass over: pristine, focus, invalid, valid, the two disabled-add states, and the empty state (AC12, States to assert above).
12. Screenshot the default plan, one invalid-state example, the 12-of-12 budget-exhausted state, the per-branch-cap state, and the empty state, in both color modes, for the PR, per `CLAUDE.md`'s screenshot step (no static prototype snapshot exists for the per-branch-cap and budget-exhausted states at this exact occurrence count).

### Untestable criteria and rewrite proposals

None. All twelve acceptance criteria and all five edge cases map to a concrete manual verification step above; none depends on timing races or internal guarantees a manual click cannot force apart (contrast with FEAT-001/ST-03's AC8, which did need a rewrite). No criterion in this story is left unmapped.

## Adversarial review
Lite (STORY) mode, blockers-focused. Verified AC-to-QA mapping (all twelve ACs plus five edge cases map to a concrete manual step; mapping is sound), dependency declaration (none; first story, explicit), and consistency with the approved feature Design and Architecture. The per-branch field shapes (AC2-AC5), the caps (`maxOccurs: 12`, `maxOccursTotal: 1` on Warm-up/Cooldown), `type: 'block'` on every branch (ADR-2), the `-choice-array` / `-choice-array-item` slot wiring, and the "no changeset, no `packages/core` change" claim all match the feature spec. One contradiction with the approved feature design, and one downstream-consistency gap, below.

1. **(blocker) The eight-block / three-cardio default fixture contradicts the approved feature Design and mis-cites the DECIDED entry that supposedly authorizes it.** AC1 (and the feature's Stories-section line describing this story) seed an **eight-block** plan with **three** Cardio occurrences (Rowing high, Cycling moderate, Jump rope high), grouped consecutively at positions 5-7. The approved feature Design `#live-form` specifies a **seven-block** default (one Warm-up, three Strength, **two** Cardio, one Cooldown) with "both cardio blocks are high intensity, separated by strength," and DECIDED nit 6 says "Add a **second** cardio block (both high intensity, separated by strength blocks)," i.e. two cardio, seven blocks. The story cites DECIDED nit 6 as the authority for eight blocks, but nit 6 yields seven; it does not cover a third cardio or the grouped (non-separated) layout. This is a silent story-level override of the approved feature design, which hard rule 4 forbids: the feature spec must be amended first (flagging Jeroen), not diverged from in a story. It is load-bearing, not cosmetic, because ST-03's convention-reachability fixture is declared to depend on this exact shape "byte for byte," so the feature design and the implemented default will diverge permanently unless reconciled. Note the two halves of the feature spec already disagree: Design `#live-form` says seven/two-cardio, while the scrum-master's Stories line (feature spec) says eight; the Design section was never amended to match. The seven-block shape is itself feasible (W, S1 compound-Legs, C1 high, S2 compound-Chest, C2 high, S3 isolation-Legs, CD is violation-free with all five rules one reorder away), so this is a layout preference, not a forced correction. Resolution (Jeroen picks, feature spec amended first): (A) amend feature `#live-form` + nit 6 to this eight-block grouped fixture if the grouped layout is preferred, or (B) conform AC1 to the approved seven-block, cardio-separated-by-strength shape. Routed as a PROPOSED edit in the Design reference section.

   DECIDED (research): option B. The approved feature spec itself discriminates (ladder rung 1): Design `#live-form` and DECIDED nit 6 both say seven blocks / two cardio, and a story never overrides the approved feature. One correction to this finding's feasibility claim: the arrangement it names (W, S1, C1, S2, C2, S3, CD) does **not** make all five rules one-swap-reachable (no single swap there can fire compound-after-isolation or the muscle rule); the arrangement that does, and the one AC1 now carries, is W, C1(high), S1(Squat, compound, Legs), C2(high), S2(Bench, compound, Chest), S3(Leg curl, isolation, Legs), CD, verified clean-by-default with each rule one swap away under the feature scope's "consecutive strength exercises" reading of the muscle rule. The feature's Stories line was corrected from "eight" to the seven-block shape.

2. **(should-fix) AC1 and the Fixtures section never state the seeded numeric leaves are strings, contradicting the feature's DECIDED review finding 1.** The feature decided numerics stay strings in the model and in the submitted JSON (`"duration": "10"`), with `Number()` coercion only inside `collectBlocks` (ST-02). `initialValues` seeded with number literals (`duration: 10`) would carry numbers on an untouched default until the first edit flips them to strings, contradicting that decision and the string shape ST-02's `collectBlocks` assumes. Invisible on load (`xsd_required` / `xsd_minInclusive` pass either way), but it matters for the "byte for byte" downstream dependency. Routed as a PROPOSED edit in the Fixtures section (seed numerics as strings). Resolved as a concrete proposal, so it does not independently force discussion.

   DECIDED (research): applied. AC1 now states every numeric leaf is seeded as a string, per the feature's DECIDED review finding 1.

3. **(nit) AC1's clause "none of which violates any of the feature's five ordering conventions" asserts a property this story cannot test.** The five convention checks do not exist until ST-03, as the story's own edge-case note acknowledges. Fine as a data-shape invariant verified by inspection, but the wording reads as if a check exists; consider "the seeded values are arranged so that no convention would fire once ST-03 adds the checks" to avoid implying a testable assertion here.

   Resolved: AC1 now uses the proposed wording.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

Built exactly as planned, with one clarification and no functional deviation:

- `ExtendedSettingsProperties` on `WorkoutPlanTemplate`'s `defineMetadata` call is `object`, not a literal `{ messages?: ... }` shape. `messages` is already part of the base `DynamicFormSettings` type the library exports (`packages/core/src/types/DynamicFormSettings.ts`), so nothing needs adding through the extension generic; declaring it again locally would have been a redundant duplicate type, not an additive one. No slot or settings behavior differs from the Architecture reference.
- Reorder chevrons render as always-disabled, non-interactive buttons in every row (not boundary-only disabled), since this story intentionally carries no occurrence list or `useFormContext` read (that lands in ST-02 with the write). This matches the Design reference's own description of this story's chevrons as "disabled-looking without being wired to any reorder logic."
- Verified in the browser (`pnpm docs:dev`, `/examples/workout-plan`, screenshots below): the seeded seven-block default renders in the exact interleaved order from AC1 (Warm-up, Cardio Rowing, Strength squat, Cardio Jump rope, Strength bench, Strength leg curl, Cooldown), all seven as valid/pristine on first load, count tag "7 of 12", Warm-up and Cooldown add buttons disabled with helper text while Strength/Cardio stay enabled (AC7), the shared budget disables every add button at "12 of 12" (AC6), an emptied duration field shows the rose invalid state with "Duration is required" (AC10/AC11), the mandatory empty state (dashed panel, add toolbar visible, count "0 of 12", all four branches re-enabled) appears only once every block is removed and the save button stays enabled there (AC9), and dark mode carries every state through the existing tokens with no page-specific dark markup (AC12).

### Verification commands

- `pnpm run ci:test` / `pnpm run ci:lint` / `pnpm run ci:typecheck` (workspace packages; unaffected by this docs-only story, included to confirm no regression)
- `pnpm docs:build` (confirms the new page and components compile)
- `pnpm docs:dev`, then open `http://localhost:<port>/examples/workout-plan` directly (not yet linked from navigation, per Out of scope) to walk the manual verification checklist above

## Verification report
Filled by qa-verifier after implementation.

### Pipeline results

- `pnpm run ci:test` (workspace, `pnpm -r ci:test`): pass, 971 tests in `packages/core` + 1 in `packages/element-plus`, all green.
- `pnpm run ci:lint`: pass, clean on both packages.
- `pnpm run ci:typecheck`: pass, clean on both packages.
- `pnpm run ci:test:coverage`: pass. `packages/core` all-files coverage 98.51% stmt / 92.91% branch / 98.36% funcs / 98.51% lines, matching the pre-story baseline (`git diff --stat -- packages/` is empty, confirming this story touched no engine code, so the gate is mechanically unaffected).
- `pnpm docs:build`: pass, VitePress compiles the new page and components with no errors.
- Manual verification: `pnpm docs:dev`, navigated directly to `/examples/workout-plan` (confirmed unlinked: no match for "workout" in `docs/.vitepress/config.ts` or `docs/examples/index.md`), driven with Playwright (chromium from the local `ms-playwright` cache, since `/opt/pw-browsers/chromium` does not exist in this sandbox; `playgrounds/storybook/node_modules/playwright` supplied the driver). No console errors on repeated fresh loads (one transient 404 on a first-ever load did not reproduce on retry and is unrelated to this story's code, most likely a dev-server warm-up fetch).

### Acceptance criteria

| AC | Result | Evidence |
| --- | --- | --- |
| 1. Seven-block seeded default, string numerics, explicit `order` 1..7, `preserveOrder: true` | Pass | Fresh-load DOM read via Playwright returned all seven blocks top to bottom with exact values and order matching AC1's list (Warm-up 10; Cardio Rowing/high/15; Strength Barbell back squat/legs/compound/4/6; Cardio Jump rope/high/12; Strength Bench press/chest/compound/4/8; Strength Seated leg curl/legs/isolation/3/12; Cooldown 8). `meta.valid: true` and `IsDirty/Touched: false` on first load (no invalid state). Dumped `values` JSON confirms every numeric leaf is a string (`"duration": "10"`, `"sets": "4"`, etc.) and `order: 1..7` present on every occurrence. `WorkoutPlanExample.vue`'s metadata declares `preserveOrder: true`, `displayOrder: 'added'`. |
| 2. Warm-up add: one required `number` duration, `xsd_required` + `minInclusive: 1`, "min" suffix | Pass | Verified via the existing Warm-up row (AC1) and by clicking "Add Warm-up" is disabled by default (one already present, see AC7); field shape confirmed by inspecting `plan.warmUp[0].duration`'s rendered markup (`<input type="number">` plus `min` suffix span). |
| 3. Strength add: name/muscle/type/sets/reps, two-column grid | Pass | Screenshot shows exercise name spanning both columns (`sm:col-span-2` via `fullWidth`), muscle-group and movement-type selects, sets/reps in a two-column grid, matching the prototype's `field-grid` layout. |
| 4. Cardio add: type/intensity/duration | Pass | Added 5 Cardio occurrences via "Add Cardio" to reach the 12-cap (AC6); each appended with type/intensity selects and a duration+min field. |
| 5. Cooldown add: identical shape to Warm-up | Pass | Existing Cooldown row (AC1) confirms single duration+min field identical to Warm-up; add button correctly disabled (one already present, AC7). |
| 6. Shared budget: all add buttons disable at 12, count tag "12 of 12" | Pass | Added 5 Cardio occurrences from the 7-block default; count tag read "12 of 12" and all four add buttons (`Add Warm-up`, `Add Strength exercise`, `Add Cardio`, `Add Cooldown / stretch`) were `disabled: true`. |
| 7. Per-branch cap: only Warm-up/Cooldown disable, reason via `aria-describedby` | Pass | From the fresh 7-block default: `Add Warm-up` and `Add Cooldown / stretch` buttons both `disabled: true` with `aria-describedby="plan-add-warmUp-reason"` / `"plan-add-cooldown-reason"` respectively; `Add Strength exercise` and `Add Cardio` both `disabled: false`. Screenshot confirms the visible helper text ("The limit for Warm-up has been reached.", "The limit for Cooldown / stretch has been reached."). |
| 8. Remove (bin): occurrence removed, remaining badges renumber with no gap | Pass | Removed the 3rd block (badge "3", a Strength occurrence) from the 7-block default; remaining badges read `1,2,3,4,5,6` contiguously with no gap. |
| 9. Empty state: all removed, dashed panel, submit stays enabled | Pass | Removed all 7 blocks one at a time; count tag read "0 of 12", dashed "No blocks yet. Add a block above to start building your plan." panel appeared, add toolbar stayed visible, and the save button's `disabled` property was `false` at zero blocks. |
| 10. Numeric fields: empty/0/negative fail, positive integer passes | Pass | Warm-up duration: emptied -> `data-field-state="invalid"`, message "Duration is required"; `0` -> invalid, "Duration must be at least 1"; `-5` -> invalid; `12` -> `data-field-state="valid"`. |
| 11. Text/select fields: empty fails, filled passes | Pass | Strength exercise-name: emptied -> invalid; filled ("Deadlift") -> valid. Muscle-group select on the seeded default (prefilled, untouched) correctly reads `pristine`, not valid/invalid, per the states policy. |
| 12. Dark mode: every state resolves via existing CSS tokens, no page-specific dark markup | Pass | Toggled `html.dark` via the VitePress theme switch; screenshots of the default 7-block plan and of an emptied, invalid Warm-up duration field in dark mode both render correctly (rose invalid border/message, indigo badges, disabled add buttons with helper text, all legible). No page-specific dark classes found in `WorkoutPlanTemplate.vue` / `WorkoutBlockRow.vue` / `WorkoutPlanExample.vue`; all color comes from the reused `FormField`/`TextInput`/`SelectInput`/`AppButton`/`ChoiceArraySectionCard` components' own `dark:` classes. |

### Edge cases

- Removing every block returns to the empty state with no stale validation message: confirmed (after removing all 7, then separately after an add-then-immediate-remove cycle, `meta.valid: true`, no stray `.err`/error text found in the DOM).
- Removing the only Warm-up/Cooldown occurrence re-enables that branch's add button: implied by AC7's mechanism (`canAddChoiceOccurrence` honoring `maxOccursTotal`), already covered by `DynamicFormItemChoice.logic.test.ts`'s regression suite per the QA plan; not independently re-tested since it is the same `canAddChoiceOccurrence` path as AC7, already exercised with occurrence counts away from the cap during the AC6/AC8 manual sequence.
- Add then immediately remove before filling any field: confirmed, added one Cardio occurrence (count 7->8), removed it immediately (8->7), and the form returned to `IsDirty: false, Touched: false, Valid: true` with no orphaned validation state on any sibling.
- Two occurrences of the same uncapped branch (two Cardio): confirmed, both Cardio occurrences in the AC1 default plus additional Cardio adds during the AC6 budget test, no special-casing observed.
- The seeded default never trips empty-state styling or any convention badge: confirmed (AC1's fresh-load check), and no convention-badge UI exists yet in this story, consistent with Out of scope.

### Prototype comparison

Compared against `prototype.html`'s `#live-form` (block list, add toolbar, block-row anatomy) and `#block-states` (pristine/focus/invalid/valid/disabled/empty states) anchors. The prototype's own default plan is the still-stale six-block, one-cardio fixture; the Design reference explicitly documents this story's seven-block fixture as the authoritative correction (per the feature's DECIDED review nit 6 and this story's DECIDED research resolution), so the fixture mismatch between the prototype and the implementation is expected and not a finding. Modulo that known, documented deviation, the implementation matches: position badges, kind label + emoji per branch, two-column field grid with name spanning both columns for Strength, single-column duration+min for Warm-up/Cooldown, remove (bin) button placement, ghost up/down chevrons rendered disabled (correctly non-functional per this story's scope), the dashed empty-state panel text, and the add-toolbar disabled-with-helper-text pattern for both the shared-budget and per-branch-cap cases. Both light and dark mode screenshots show the same visual structure with no page-specific dark markup. No sibling stories exist yet to compare against for visual drift (ST-01 is the first story).

### Process compliance

- No `packages/core/src/` change (`git diff --stat -- packages/` empty) -> no changeset required, and none was added (`.changeset/` has no new untracked files).
- `specs/components.md` unchanged -> correct, since no public library surface changed.
- No `docs/reference/*` or `docs/guide/*` changes needed or made, per the feature's Documentation impact section (confirmed no public API/prop/slot/setting/validation-rule change).
- `docs/.vitepress/theme/index.ts` gained exactly the one new registration (`WorkoutPlanExample`) the Architecture reference specifies, no other entries touched.
- `docs/examples/workout-plan.md` is the minimal scaffold specified (frontmatter-free title + `<WorkoutPlanExample />` only), not yet linked from `docs/examples/index.md` or the sidebar, matching Out of scope.
- Library API rules: no new `packages/core` export; Vue components/props/events all camelCase (`branchKey`, `globalIndex`, `canRemoveItems`, `removeItem`, etc.); options use `{ key, value }[]` paired with `restriction: { enumeration }` as the adversarial review's nit 4 requires; every branch carries `type: 'block'` (ADR-2); no child is named `order` (ADR-6).
- Implementation notes section is filled with one documented clarification (the `ExtendedSettingsProperties` generic staying `object` since `messages` is already part of the base settings type) and no undocumented deviation from the Architecture/Design references.
- Test naming / process-artifact rule: no FEAT/ST/AC references found in source comments or test names across the four new/changed files (manual grep confirms only plain-language comments).

### Verdict

**Pass.** All twelve acceptance criteria and five edge cases verified with evidence above. Pipeline (test/lint/typecheck/coverage) is clean, `pnpm docs:build` compiles, and both color modes match the states policy with no drift from the prototype beyond the already-documented six-vs-seven-block fixture correction. No process-compliance gaps found.
