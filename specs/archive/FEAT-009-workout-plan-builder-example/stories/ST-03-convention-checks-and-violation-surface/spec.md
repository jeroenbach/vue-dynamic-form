---
id: ST-03
type: story
feature: FEAT-009
status: done
approved_by: Jeroen
pr: ""
---

# Story: The five convention checks and the violation surface

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- `noBackToBackMuscle` semantics → consecutive among the plan's strength blocks (the strength subsequence), not directly-adjacent rows; see AC4
- Default fixture and AC6/AC7 swap positions → conformed to the approved seven-block shape (decided in ST-01)
- Review blocker 1 → QA negative-control swap corrected from 2/3 to 4/5 (2/3 fires `noAdjacentHighCardio`; 4/5 is the only inert adjacent swap, verified by enumeration)

## Functional

### User story
As a docs reader exploring the workout plan builder example, I want the five published coaching conventions (warm-up first, cooldown last, compound before isolation, no back-to-back same muscle group, no adjacent high-intensity cardio) checked live against my plan's current order, with each violation named on the offending row and in the summary rail, so that I can see that reordering alone, with no field edit, is what satisfies or breaks each one.

### Acceptance criteria

1. Given a plan with a Warm-up occurrence present, When it is not the first block, Then `checkConventions` reports a `warmUpFirst` violation naming the current first block's displayed position; given a plan with no Warm-up occurrence at all, Then no `warmUpFirst` violation is reported (absence is never a violation, per the feature's DECIDED resolution of its own review finding 2: "order among present blocks only").
2. Given a plan with a Cooldown / stretch occurrence present, When it is not the last block, Then `checkConventions` reports a `cooldownLast` violation naming the current last block's displayed position; given a plan with no Cooldown / stretch occurrence at all, Then no `cooldownLast` violation is reported.
3. Given any compound-type strength block, When any isolation-type strength block appears earlier in the displayed list, Then `checkConventions` reports a `compoundBeforeIsolation` violation naming the compound block's position (a position-class scan over the whole list, not just adjacent rows).
4. Given two strength blocks that are consecutive among the plan's strength blocks (no other strength block between them, regardless of any non-strength blocks in between), When they share the same muscle group, Then `checkConventions` reports a `noBackToBackMuscle` violation naming both positions.

   DECIDED (research): the rule reads over the strength subsequence, not directly-adjacent rows. Why: the feature scope's wording is "No two **consecutive strength exercises** share the same muscle group" (contrast the cardio rule, which says "adjacent"), and under a directly-adjacent-rows reading the approved seven-block default (Design `#live-form`, DECIDED nit 6) provably cannot make all five rules one-reorder-reachable, so that reading would contradict the approved spec's own requirements. Source: the approved FEAT-009 spec (Scope rule list and DECIDED nit 6).
5. Given two cardio blocks directly adjacent to each other in the displayed list, When both are High intensity, Then `checkConventions` reports a `noAdjacentHighCardio` violation naming both positions.
6. Given the ST-01 seeded seven-block default plan (Warm-up, Rowing, Barbell back squat, Jump rope, Bench press, Seated leg curl, Cooldown / stretch), When the page loads, Then `checkConventions` returns an empty violations array, the rail's "Convention checks" section shows a single emerald row reading "All five ordering conventions satisfied", and no block row shows an amber badge or border.
7. Given the same default plan, When exactly one of the following single up/down swaps is performed (each independently, from the default), Then the named violation appears within one recompute, with no page reload:
   - swap positions 1 and 2 (Warm-up ↔ Rowing) -> `warmUpFirst` fires.
   - swap positions 6 and 7 (Seated leg curl ↔ Cooldown / stretch) -> `cooldownLast` fires.
   - swap positions 5 and 6 (Bench press ↔ Seated leg curl) -> `compoundBeforeIsolation` fires (this is also `#reorder-payoff`'s before/after demo). The same swap also fires `noBackToBackMuscle` (Barbell back squat and Seated leg curl become consecutive strength blocks, both Legs); both violations show, per the simultaneous-violations edge case below. This one swap is the single reorder that reaches `noBackToBackMuscle` from the default, which satisfies the feature's "every rule one reorder away" requirement even though it has no rule-isolated demo swap.
   - swap positions 3 and 4 (Barbell back squat ↔ Jump rope) -> `noAdjacentHighCardio` fires (Rowing and Jump rope, both High, become adjacent) and no other rule fires.
8. Given any active violation, When the summary rail's "Convention checks" section renders, Then each violation shows as an amber row naming the rule in bold, a plain-language reason, and the offending block(s) by displayed position (the indigo `ref` pill, "block N"), and the corresponding block row(s) show an amber badge/border via the same `checkConventions` result read from the row's own `useFormContext`.
9. Given any number of active violations, When the submit control is evaluated, Then it stays enabled: all five conventions are non-blocking warnings (Variant A, per the feature's DECIDED Open question 2), gated only on the form's aggregate `meta.valid`; no hidden vehicle leaf and no new `validation` rule exists anywhere in this story's files.
10. Given the whole form, When `html.dark` is toggled, Then the amber violation state (row background/border, rail list, badge) resolves through the existing CSS custom properties with no page-specific dark markup.

### Edge cases
- A plan with neither a Warm-up nor a Cooldown / stretch occurrence reports zero boundary violations regardless of block order (AC1, AC2).
- A plan with only one strength block or only one cardio block can never report `noBackToBackMuscle` or `noAdjacentHighCardio` respectively; this is expected, not a bug.
- Removing a block that was the sole cause of a violation clears that violation on the next recompute, with no stale badge left on a sibling row.
- Two simultaneous violations from the same swap (AC7's position 5/6 swap fires both `compoundBeforeIsolation` and `noBackToBackMuscle`) are both shown; this story does not suppress a rule because another rule also fired from the same action.

### Out of scope
- Variant B (the blocking alternative, a hidden vehicle leaf per rule with a `validation` closure and a rose banner/disabled submit) is not built. The feature's Open question 2 was DECIDED as non-blocking (Variant A) for all five rules; Variant B exists only as a reference illustration in the prototype's `#violations` section and in the feature's Architecture section, costed for Jeroen, never implemented.
- The pre-exhaustion exception callout, the not-training-advice disclaimer, and all other narrative copy (ST-04; per the feature's own slicing seams, the callout is assigned to seam 4, not seam 3).
- Narrative prose, the metadata walkthrough, cross-links, and nav/sidebar discoverability (ST-04).
- Any change to the reorder mechanism, the total duration, intensity profile, or muscle coverage figures ST-02 already built.

## Design reference

Implements `../../prototype.html#violations`'s Variant A treatment only (the five-rule list's checking logic and both display surfaces: the rail's "Convention checks" section and the row's amber badge/border) and `../../prototype.html#reorder-payoff` (the before/after proof), excluding Variant B and excluding all narrative copy (the rule-list prose, the pre-exhaustion callout, and the "Not training advice" framing are ST-04's).

Three corrections to the prototype's still-stale Variant A illustration and Section 5 numbering, per the feature's own DECIDED entries:
- The prototype's Variant A example (`#violations`) shows a two-block illustration with no Warm-up at all, firing "No Warm-up at the top of the plan," which is exactly the bug the feature's review finding 2 flagged and DECIDED against ("order among present blocks only"). Do not build that example as shown; a plan with no Warm-up must never report a `warmUpFirst` violation (AC1).
- `#reorder-payoff`'s before/after labels "Block 2" / "Block 3" for the Bench press / Seated leg curl swap. With ST-01's approved seven-block default, those two blocks sit at positions 5 and 6 (AC7's third bullet); this story's implementation of `#reorder-payoff` uses the corrected numbers, resolving the feature's review nit 8.
- The prototype's `checkConventions` pseudocode in `#metadata-walkthrough` (`blocks[0].kind !== 'warmUp'` with no presence guard) is the exact pre-fix logic review finding 2 was raised against. Implement the "order among present blocks only" reading from AC1/AC2, not the pseudocode as literally shown; ST-04's `<<<` region excerpt will pull from this story's corrected real source, not from the stale prototype snippet, so no further prototype correction is needed for that section to read accurately once this story ships.

## Architecture reference

Builds, extending ST-02's files:
- `workoutPlanMath.ts` (extends ST-02's file): adds `checkConventions(blocks: Block[]): Violation[]`, implementing the five rules exactly as specified in Acceptance criteria 1-5 (boundary rules checked only among present blocks; `compoundBeforeIsolation` as a whole-list position-class scan; `noBackToBackMuscle` over consecutive blocks of the strength subsequence per AC4's DECIDED note; `noAdjacentHighCardio` only between directly-adjacent rows). Extends `summarizePlan`'s return shape to add `violations: checkConventions(blocks)`, so `WorkoutPlanExample.vue`'s existing `summary` computed picks it up with no call-site change.
- `WorkoutPlanSummary.vue` (extends ST-02's file): adds the fourth "Convention checks" section (AC6, AC8): an emerald all-satisfied row when `violations` is empty, otherwise one amber row per violation, each naming the rule in bold, a plain-language reason, and the offending block(s) via the indigo `ref` pill, matching the checkout's existing badge styling conventions.
- `WorkoutBlockRow.vue` (extends ST-02's file): runs the same `checkConventions(collectBlocks(...))` from its own `useFormContext` (mirroring how `SplitPaymentLedgerRow` derives its own `isIncomplete` from the shared ledger result) and shows the amber warning badge plus amber border when its own occurrence's displayed position is named in a violation. No prop drilling: both read sites (the rail and the row) call the same pure module independently.
- `WorkoutPlanExample.vue`: no change beyond what ST-02 already wired (`summary` already flows `checkConventions`'s output through once `summarizePlan`'s shape above lands); `canSubmit` stays `meta.valid` with no new gate, confirming AC9.

No `packages/core/src/` change and no changeset: this story adds no `validation` rule, no hidden vehicle leaf, and no new engine capability; the five checks are pure derived display flags over the form's existing reactive `values`, per ADR-3 and ADR-5 and the feature's DECIDED Open question 2.

**Documentation:** none assigned to this story; no `docs/reference/*` or `docs/guide/*` page changes (no public API change, confirmed again here since this story is the one most likely to be mistaken for adding a validation rule, and it does not). The pre-exhaustion exception callout and all surrounding prose are ST-04's, not this story's, even though they describe behavior this story implements.

Dependencies: depends on ST-02 (extends `workoutPlanMath.ts`'s `collectBlocks` / `summarizePlan`, `WorkoutPlanSummary.vue`, and `WorkoutBlockRow.vue`). ST-04's region excerpts and "What It Demonstrates" copy depend on this story's finished `checkConventions` and violation surface to describe accurately.

## QA plan

### Test infrastructure constraint

Same constraint as ST-01 and ST-02 (see ST-01's "Test infrastructure constraint, read this first" and ST-02's restatement with the `splitPaymentLedgerMath.ts` precedent check). Not re-litigating it here: `docs/` has no vitest/`@vue/test-utils`/jsdom, no `test` script, is excluded from `pnpm-workspace.yaml`, and `splitPaymentLedgerMath.ts` ships with zero automated tests despite being pure and trivially testable. `checkConventions` is an extension of the same `workoutPlanMath.ts` module ST-02 already decided to leave uncovered, so the same reasoning applies without re-opening it: every criterion below for the new docs-local code (`checkConventions`, the extensions to `WorkoutPlanSummary.vue` and `WorkoutBlockRow.vue`) is manual-only. The plan cites the existing `packages/core` suites that guard the reactive pipeline this story's recompute rides on.

### Fixtures and utilities

- Reuses ST-01/ST-02's seeded seven-block default plan verbatim: Warm-up 10 / Cardio Rowing high 15 / Strength Barbell back squat compound-Legs / Cardio Jump rope high 12 / Strength Bench press compound-Chest / Strength Seated leg curl isolation-Legs / Cooldown 8, positions 1-7, explicit numeric `order` seeds 1..7, `preserveOrder: true`. AC6 and every AC7 swap are read directly off this exact fixture; do not vary it for the core mapping below, only for the presence/absence edge cases (AC1/AC2's "no Warm-up at all" / "no Cooldown at all" cases), which are reached by removing a block from a fresh load, not by a new persisted fixture.
- No new fixture object is added by this story. The four AC7 swaps and the absence/single-block edge cases are all reached by interacting with the existing default plan during manual testing (add/remove/reorder), never by authoring a second `initialValues` object.
- Manual-testing harness: `pnpm docs:dev`, navigate directly to `/examples/workout-plan` (still unlinked; ST-04 adds discoverability).
- `MUSCLE_GROUPS`, `CARDIO_TYPES`, and the movement-type/intensity option lists are ST-01's existing constants; nothing new is added by this story.

### Acceptance criteria to test mapping

| AC | What it needs | Mapping |
| --- | --- | --- |
| 1. `warmUpFirst`: fires only when a Warm-up exists and is not first; absence is never a violation | `checkConventions` (new) | **Manual**: (a) from the default, swap positions 1/2 (AC7's first bullet) and confirm the rail/row report `warmUpFirst` naming the current first block's position ("block 1"). (b) remove the Warm-up block entirely from a fresh default and confirm no `warmUpFirst` violation appears regardless of the remaining order (edge case, also exercises AC1's absence clause directly). |
| 2. `cooldownLast`: fires only when a Cooldown exists and is not last; absence is never a violation | `checkConventions` (new) | **Manual**: (a) swap positions 6/7 (AC7's second bullet), confirm `cooldownLast` names the current last block's position. (b) remove the Cooldown block entirely and confirm no `cooldownLast` violation appears regardless of order (edge case). |
| 3. `compoundBeforeIsolation`: whole-list position-class scan, not adjacent-only | `checkConventions` (new) | **Manual**: swap positions 5/6 (AC7's third bullet: Bench press compound ↔ Seated leg curl isolation) and confirm `compoundBeforeIsolation` fires naming the compound block's new position. Separately confirm it is a whole-list scan, not adjacent-only: from the default, swap positions 3/4 (Barbell back squat ↔ Jump rope) which does **not** change compound/isolation ordering, and confirm `compoundBeforeIsolation` does **not** fire (only `noAdjacentHighCardio` should, per AC7's fourth bullet), ruling out a false positive from a non-adjacency-relevant swap. |
| 4. `noBackToBackMuscle`: reads the strength subsequence, not directly-adjacent rows | `checkConventions` (new) | **Manual**: swap positions 5/6 (same swap as AC3). After the swap, Barbell back squat (Legs, position 3) and Seated leg curl (Legs, now position 5) become consecutive **within the strength subsequence** despite Jump rope (cardio, position 4) sitting physically between them. Confirm `noBackToBackMuscle` fires naming positions 3 and 5, not positions 4 and 5, which directly proves the subsequence reading (AC4's DECIDED note) rather than a directly-adjacent-rows reading. This is the one AC that most needs the paired code-review check noted under Untestable criteria below, since a directly-adjacent implementation would silently fail to fire here rather than visibly erroring. |
| 5. `noAdjacentHighCardio`: directly-adjacent rows only | `checkConventions` (new) | **Manual**: swap positions 3/4 (Barbell back squat ↔ Jump rope, AC7's fourth bullet). Confirm `noAdjacentHighCardio` fires naming the two now-adjacent cardio blocks (Rowing, Jump rope; positions 2 and 3) and confirm no other rule fires from this swap (`compoundBeforeIsolation` and `noBackToBackMuscle` must both stay silent, since this swap does not touch compound/isolation order and does not change strength-subsequence adjacency). |
| 6. Default plan: zero violations, single emerald "all satisfied" row, no amber anywhere | `checkConventions`, `WorkoutPlanSummary.vue`, `WorkoutBlockRow.vue` | **Manual**: fresh load of `/examples/workout-plan`, confirm `checkConventions` reports nothing visible: the rail's "Convention checks" section shows exactly one emerald row reading "All five ordering conventions satisfied", and none of the seven block rows shows an amber badge or border. |
| 7. Each of the four independent single swaps fires the named violation(s) within one recompute, no reload | `checkConventions`, reactive recompute | **Manual**: from a fresh default reload each time, perform each of the four swaps independently (1/2, 6/7, 5/6, 3/4) and confirm the named violation(s) appear immediately after the click with no page reload and no manual refresh. For the 5/6 swap specifically, confirm **both** `compoundBeforeIsolation` and `noBackToBackMuscle` show simultaneously (the documented co-firing), with neither suppressing the other. As a negative control, perform the one single adjacent swap that trips nothing, positions 4/5 (Jump rope ↔ Bench press), and confirm it fires none of the five, i.e. not every reorder trips a rule, only the documented ones from the default. (DECIDED (research), resolving adversarial-review finding 1: the originally named 2/3 swap, Rowing ↔ Barbell back squat, is **not** a valid negative control, since it moves Rowing directly adjacent to Jump rope and fires `noAdjacentHighCardio`; 4/5 is the only inert adjacent swap on this fixture, verified by enumerating all six.) |
| 8. Violation display: rail shows bold rule name + plain-language reason + position `ref` pill(s); row shows amber badge/border from the same `checkConventions` result via its own `useFormContext` | `WorkoutPlanSummary.vue`, `WorkoutBlockRow.vue` | **Manual**: trigger any one violation (e.g. the 1/2 swap), confirm the rail's amber row shows the rule name in bold, a plain-language reason, and the offending block's position as the indigo `ref` pill ("block N"), and confirm the corresponding block row independently shows an amber badge/border. Code-review check (not a click): confirm `WorkoutBlockRow.vue` calls `checkConventions(collectBlocks(...))` from its own `useFormContext` rather than receiving the violations as a prop, per the "no prop drilling, two independent read sites" architecture claim. |
| 9. Submit stays enabled regardless of violation count; no hidden vehicle leaf, no new `validation` rule | `WorkoutPlanExample.vue` (unchanged `canSubmit`), `checkConventions` | **Manual**: with one, two (the 5/6 swap), and zero violations active, confirm the submit control stays enabled throughout and a submit succeeds. Code-review check (structural, not click-testable): diff `workoutPlanMath.ts`, `WorkoutPlanExample.vue`, `WorkoutBlockRow.vue`, and the metadata tree for any new `validation` closure or any new hidden/zero-width leaf field; confirm `canSubmit` is still the plain `meta.valid` expression ST-02 left in place, with no new gate added. |
| 10. Dark mode: amber violation state (row background/border, rail list, badge) resolves via existing CSS variables | Reused design tokens | **Manual**: toggle `html.dark` with at least one violation active, confirm the amber row background/border, the rail's violation list, and the row badge all stay legible with no page-specific dark markup. |

### States to assert (feature states policy, this slice's instances)

Building on ST-01 (pristine/focus/invalid/valid/disabled/empty) and ST-02 (reorder-boundary disabled, rail-empty, muscle-coverage-empty), this slice adds:
- **Warning (new state family for this slice)**: the amber row border/badge on a block row and the amber row in the rail's "Convention checks" list. Distinct from the existing **Error** state (rose, per-field validation): this is the first slice to combine a non-blocking visual warning with a form that is otherwise fully `meta.valid`, so confirm the amber styling never appears alongside, or is mistaken for, the rose invalid-field styling.
- **Satisfied (all-clear)**: the single emerald "All five ordering conventions satisfied" row (AC6), distinct from an "empty" state (there is no such thing as a planless conventions check: zero blocks trivially satisfies all five since none has anything to violate; worth a quick manual check that the zero-block state, inherited from ST-01/ST-02, also shows the emerald all-satisfied row rather than a stray empty-chip-style message).
- **Multiple simultaneous warnings**: two amber rail rows and two amber row badges/borders shown together from one action (the 5/6 swap), with neither suppressing the other.
- **Light and dark**: every one of the above under `html.dark` (AC10).
- Still out of scope for this slice: Variant B's blocking rose banner/disabled submit (not built at all, per Out of scope).

### Reactivity / render-count

This slice extends `summarizePlan`'s return shape (adding `violations`) and adds a second independent read site (`WorkoutBlockRow.vue`'s own `useFormContext` call, alongside the rail's host-level read), both over the same reactive `values`/`collectBlocks` pipeline ST-02 already wired. No `packages/core/src/` change and no new `computedProps` closure, so there is no new engine-level reactive wiring for a `*.analytics.test.ts` to guard, and no docs-level `analytics` render-count instrumentation exists to add one against regardless (same constraint ST-01/ST-02 already stated).
- **Regression guard (cited, not new)**: `DynamicFormItemChoice.analytics.test.ts`'s sibling-occurrence render isolation on a field write remains the right regression net for the underlying reorder-write mechanics this story's recompute rides on; re-running it via `pnpm run ci:test` is the automated signal that nothing at the engine level regressed.
- **Manual reactivity check specific to this slice**: because two independent components (`WorkoutPlanSummary.vue` via the host's `summary` prop, and `WorkoutBlockRow.vue` via its own `useFormContext`) now call the same `checkConventions(collectBlocks(...))` logic independently rather than one passing data to the other, confirm during manual testing that both surfaces update in the same tick after a reorder (no visible lag between the rail flipping and the row badge appearing) and that no console warning or error appears on any add/edit/remove/reorder action.
- **Why this matters here specifically**: this is the first story where a child row component (`WorkoutBlockRow.vue`) independently derives display state from the same form-wide computation the parent also derives, rather than receiving it as a prop. A sloppy implementation that re-reads `useFormContext()` inside a `watch` without considering flush timing could show the row's badge one tick behind the rail; the "both surfaces update in the same tick" manual check is this story's closest substitute for a render-count assertion given the infra constraint.

### Coverage

No `packages/core/src/` change, so `pnpm -r ci:test:coverage`'s tracked baseline is unaffected in either direction; confirm with `git diff --stat -- packages/` showing empty before closing out the story. `checkConventions` and the extensions to `WorkoutPlanSummary.vue`/`WorkoutBlockRow.vue` ship with no automated coverage number, consistent with every other docs component and consistent with ST-02's own precedent for `workoutPlanMath.ts`, not a regression this story introduces.

### Time sensitivity

Nothing in this slice is date or time dependent: the five conventions are pure order/position/type/muscle-group comparisons with no date, timestamp, or scheduling logic anywhere. `TZ=Europe/Amsterdam` has no bearing here.

### Regression risk

- **Touches (extended in place, not replaced)**: `workoutPlanMath.ts` (`summarizePlan`'s return shape gains `violations`; `collectBlocks` itself is unchanged), `WorkoutPlanSummary.vue` (gains a fourth section), `WorkoutBlockRow.vue` (gains the amber badge/border and its own `useFormContext` call). `WorkoutPlanExample.vue` is not touched beyond what ST-02 already wired (per the Architecture reference).
- **ST-02 regression check**: because `summarizePlan`'s return shape changes, re-verify ST-02's AC3-AC6 (Total duration, Intensity profile incl. dots, Muscle coverage) still render their exact figures unchanged on the default plan and after the standard add/edit/remove/reorder actions; a careless edit to the shared function could regress an existing field while adding `violations`.
- **ST-01/ST-02 state check**: re-verify no existing per-field validation state (rose/emerald, ST-01) or reorder-boundary disabled state (ST-02) changed appearance now that an amber warning state exists alongside them, since this is the first slice where more than one non-neutral visual state can be active on the same row at once (e.g. a touched-valid field inside a row that also shows the amber violation border).
- **Other stories affected**: ST-04's region excerpts and "What It Demonstrates" copy depend on this story's finished `checkConventions` and violation surface to describe accurately; a late rename of a violation's rule key or wording here would require ST-04 to re-verify its excerpts and copy.
- **Guarded by existing core tests**: no engine mechanism changes in this story; `DynamicFormItemChoice.logic.test.ts`'s `preserveOrder`/re-sort suites and `.analytics.test.ts`'s sibling-isolation suite (both already cited by ST-02) remain the regression net for the reorder pipeline this story's recompute depends on, but add nothing new of their own to guard here since the new logic is entirely docs-local.

### Manual verification checklist

1. `pnpm docs:dev`, navigate to `/examples/workout-plan`, fresh load. Confirm no console errors or warnings.
2. Confirm the default plan shows the single emerald "All five ordering conventions satisfied" row and no block row shows an amber badge or border (AC6).
3. From a fresh reload, swap positions 1/2 (Warm-up ↔ Rowing). Confirm `warmUpFirst` fires, naming the current first block's position, in the rail and on that row, with no reload (AC1, AC7 bullet 1).
4. Reload. Swap positions 6/7 (Seated leg curl ↔ Cooldown). Confirm `cooldownLast` fires (AC2, AC7 bullet 2).
5. Reload. Swap positions 5/6 (Bench press ↔ Seated leg curl). Confirm **both** `compoundBeforeIsolation` and `noBackToBackMuscle` fire simultaneously, the latter naming positions 3 and 5 (squat and leg curl), not 4 and 5, proving the strength-subsequence reading (AC3, AC4, AC7 bullet 3).
6. Reload. Swap positions 3/4 (Barbell back squat ↔ Jump rope). Confirm only `noAdjacentHighCardio` fires, naming the two now-adjacent cardio blocks, and confirm neither `compoundBeforeIsolation` nor `noBackToBackMuscle` fires from this swap (AC5, AC7 bullet 4).
7. Reload. Swap positions 4/5 (Jump rope ↔ Bench press, the one adjacent swap that trips nothing on this fixture) and confirm none of the five rules fires (negative control, AC7). Do **not** use the 2/3 swap for this: it fires `noAdjacentHighCardio` (see adversarial-review finding 1, resolved).
8. Reload. Remove the Warm-up block entirely; confirm no `warmUpFirst` violation appears regardless of the remaining order. Repeat for the Cooldown block and `cooldownLast` (edge cases, AC1/AC2's absence clauses).
9. Reload. Reduce to one strength block; confirm `noBackToBackMuscle` can never fire. Reduce to one cardio block; confirm `noAdjacentHighCardio` can never fire (edge cases).
10. From any active violation, remove the block that was its sole cause; confirm the violation clears on the next recompute with no stale badge left on a sibling row (edge case).
11. With one or more violations active, confirm the submit control stays enabled and a submit succeeds (AC9).
12. Full light/dark pass with at least one violation active and with the all-satisfied state (AC10).
13. Screenshot: the all-satisfied default state, the 1/2 swap (`warmUpFirst`), the 5/6 swap (both violations simultaneously, the `#reorder-payoff` proof), and the 3/4 swap (`noAdjacentHighCardio`), each in both color modes, for the PR.

### Untestable criteria and rewrite proposals

No acceptance criterion is fully untestable, but two carry a structural half a manual click cannot verify on its own and need a paired code-review check during adversarial review:
- **AC4** ("the rule reads over the plan's strength subsequence, not directly-adjacent rows") - the observable firing/non-firing from the 5/6 swap is manually testable and mapped above (step 5), and that test is specifically chosen because it is the one case where a directly-adjacent-rows implementation and a subsequence implementation disagree (the former would stay silent, the latter fires). A code-review pass confirming `checkConventions`'s muscle-rule loop iterates a filtered strength-only array, not the raw block list, is still worth doing since a bug here would silently under-fire rather than visibly error on every other manual check.
- **AC9** ("no hidden vehicle leaf and no new `validation` rule exists anywhere in this story's files") - the observable "submit stays enabled" half is manually testable (mapped above); the absence of a new `validation` rule or hidden leaf is a source-diff check across `workoutPlanMath.ts`, `WorkoutPlanExample.vue`, and `WorkoutBlockRow.vue`, not something a click can prove.

Both are flagged here so the developer and adversarial-reviewer verify them by reading the implementation, not by inventing a DOM-based proxy test for a code-shape constraint.

## Adversarial review
Lite (STORY) mode, blockers-focused. Verified the AC-to-QA mapping (all ten ACs plus edge cases map to a concrete manual step), the dependency declarations (ST-02 upstream, ST-04 downstream, both explicit), and consistency with the approved feature Design/Architecture and its DECIDED entries (the "order among present blocks only" boundary semantics, the `noBackToBackMuscle` strength-subsequence reading recorded in ST-01's and this story's DECIDED notes, Variant A only, no changeset). The one thing a story-level review must do here is recompute the AC7 swap table against the exact seven-block fixture, since every claim rests on that arithmetic. I did, block by block, and all of the firing/co-firing claims hold except one: the QA negative control is wrong.

1. **(blocker) The QA negative control (swap positions 2/3) actually fires `noAdjacentHighCardio`, so a correct implementation fails the step.** QA mapping row 7 and manual-checklist step 7 pick "positions 2/3, Rowing ↔ Barbell back squat" as a swap that should trip none of the five rules, to prove "not every reorder trips a rule." Recomputed against the fixture (Warm-up, Rowing-high, squat, Jump rope-high, bench, leg curl, cooldown): swapping positions 2 and 3 moves Rowing from position 2 to position 3, directly adjacent to Jump rope at position 4, both High intensity, which fires `noAdjacentHighCardio` (the very rule AC5/AC7-bullet-4 demonstrate). A developer or verifier running this step sees the rule fire, contradicting the stated expectation, and either chases a non-bug or "fixes" `checkConventions` into a real defect. Enumerating all six adjacent swaps from the default, the **only** single swap that trips nothing is positions **4/5 (Jump rope ↔ Bench press)**: cardio ends at positions 2 and 5 (not adjacent), the strength subsequence order is unchanged (no compound/isolation or muscle flip), and both boundaries hold. Routed as PROPOSED edits in QA mapping row 7 and checklist step 7 replacing 2/3 with 4/5. (A blocker forces `awaiting-discussion` regardless of the routed proposal; flagged so Jeroen confirms the replacement rather than inherits a false test.)

   DECIDED (research): the 4/5 replacement is applied. This is pure arithmetic over the fixture, independently recomputed twice (once by this review, once by the orchestrating run) with the same result: 2/3 fires `noAdjacentHighCardio`, and 4/5 is the only inert adjacent swap of the six. Nothing about it is a design call; the negative-control step now names 4/5 in both places.

Verified clean (no finding), recomputed per swap against the fixture:
- 1/2 (Warm-up ↔ Rowing): fires `warmUpFirst` only (Rowing becomes first; cardio at 1 and 4, not adjacent). ✓
- 6/7 (leg curl ↔ Cooldown): fires `cooldownLast` only (cooldown drops to position 6). ✓
- 5/6 (Bench press ↔ Seated leg curl): co-fires `compoundBeforeIsolation` (bench, compound, lands after leg curl, isolation) **and** `noBackToBackMuscle` naming positions 3 and 5 (squat-Legs at 3 and leg curl-Legs at 5 become consecutive in the strength subsequence, Jump rope between them physically only); nothing else. This is also the sole single swap that reaches `noBackToBackMuscle` from the default (the two Legs strength blocks are separated in the subsequence by bench, and only swapping bench past leg curl makes them adjacent). ✓ — AC4's "positions 3 and 5" and AC7-bullet-3's "single reorder that reaches `noBackToBackMuscle`" both confirmed.
- 3/4 (Barbell back squat ↔ Jump rope): fires `noAdjacentHighCardio` only, naming Rowing (position 2) and Jump rope (position 3); the strength subsequence order is unchanged so neither `compoundBeforeIsolation` nor `noBackToBackMuscle` fires. ✓ — AC7-bullet-4's exclusivity claim confirmed.
- AC6 default: all five rules clean (warm-up first, cooldown last, compounds before the lone isolation, no same-muscle strength pair consecutive, cardio at 2 and 4 non-adjacent). ✓

Status set to `awaiting-discussion`: finding 1 is a blocker (a provably false negative-control step on the exact fixture), routed as PROPOSED edits for Jeroen's decision.

Resolution: finding 1 decided from research (verified arithmetic, see the DECIDED entries inline); no unresolved blocker, should-fix, or open question remains, so the status moves to `awaiting-approval` per the mechanical rule.

## Implementation notes

Built exactly as architected, no deviations from the approved design or architecture.

- `workoutPlanMath.ts`: added `ViolationRule`, `Violation`, extended `PlanSummary` with `violations`, and added `checkConventions(blocks)` implementing the five rules. `summarizePlan` now returns `violations: checkConventions(blocks)`, so `WorkoutPlanExample.vue`'s existing `summary` computed needed no call-site change, as architected.
- Violation naming granularity: each violation names the specific displayed position(s) at fault using the block's own `order` (boundary rules name one position, `compoundBeforeIsolation` names the offending compound block, `noBackToBackMuscle`/`noAdjacentHighCardio` name both positions in the pair). Multiple instances of the same rule (e.g. two separate same-muscle strength pairs) produce multiple `Violation` entries, one row each in the rail, consistent with the "each violation shows as an amber row" wording in AC8.
- `WorkoutPlanSummary.vue`: added the fourth "Convention checks" section using the same emerald/amber tokens `SplitPaymentLedger.vue` already uses for its readout, and the same indigo badge tokens `WorkoutBlockRow.vue`/`SplitPaymentLedgerRow.vue` already use for the position circle, reused here as a pill per the prototype's `ref` styling.
- `WorkoutBlockRow.vue`: added its own `checkConventions(collectBlocks(...))` call off its own `useFormContext()`, filtered to violations naming its own displayed position, mirroring `SplitPaymentLedgerRow`'s `isIncomplete` pattern exactly (own computed off the shared form context, no prop from the parent).
- Verified the full AC7 swap table (1/2, 6/7, 5/6, 3/4, and the 4/5 negative control) both by tracing `checkConventions` against the fixture by hand and by driving the live page with Playwright; every swap fired exactly the documented violation(s) and nothing else, including the AC4 "positions 3 and 5, not 4 and 5" proof of the strength-subsequence reading.
- No `packages/core/src/` change; confirmed with `git diff --stat -- packages/` showing empty. No changeset. No `specs/components.md` update (docs-local code, no public library surface changed). No `docs/reference/*` or `docs/guide/*` update (none assigned to this story).

### Verification commands
- `pnpm run ci:test` (packages/core + element-plus, 972 tests, all green, unrelated to this story's docs-local code)
- `pnpm run ci:lint` (workspace packages) plus a direct `eslint` pass scoped to the three changed docs files (clean)
- `pnpm run ci:typecheck` (workspace packages)
- `pnpm run ci:test:coverage` (coverage unaffected, no `packages/core/src/` change)
- `pnpm docs:build` (VitePress site compiles)
- Manual pass of all 13 checklist steps via `pnpm docs:dev` at `/examples/workout-plan`, plus Playwright screenshots of the default all-satisfied state and the 1/2, 5/6, and 3/4 swaps, each in light and dark mode

## Verification report

### Pipeline
- `pnpm run ci:test`: 972 tests passed (971 core + 1 element-plus).
- `pnpm run ci:lint` (workspace packages) plus a direct `eslint` pass (root config) against the five new/changed docs files: clean, 0 errors/warnings.
- `pnpm run ci:typecheck`: clean.
- `pnpm run ci:test:coverage`: all files 98.51% stmts / 92.91% branch / 98.36% funcs, unchanged from baseline (no `packages/core/src/` file touched; `git diff --stat -- packages/` is empty).
- `pnpm docs:build`: compiles clean.
- Manual pass: `pnpm docs:dev` (port 5174) plus a `pnpm docs:preview` production-build pass (port 4173), both driven with Playwright (cached chromium at `~/Library/Caches/ms-playwright/chromium-1228`, `--no-proxy-server`), covering every AC7 swap, the two absence edge cases, the stale-badge-clears-on-removal edge case, AC9's submit-stays-enabled, and light/dark screenshots.

### Acceptance criteria

| AC | Result | Evidence |
| --- | --- | --- |
| 1 (`warmUpFirst`, absence-safe) | Pass | 1/2 swap fires `warmUpFirst` naming "block 1"; removing the Warm-up block entirely from a fresh load leaves `violations: []` (0 boundary violations) regardless of order. |
| 2 (`cooldownLast`, absence-safe) | Pass | 6/7 swap fires `cooldownLast` naming "block 7"; removing Cooldown entirely leaves `violations: []`. |
| 3 (`compoundBeforeIsolation`, whole-list scan) | Pass | 5/6 swap fires it naming "block 6"; 3/4 swap (which does not touch compound/isolation order) does **not** fire it, ruling out an adjacent-only false positive. Code read confirms a single forward scan with a `seenIsolation` flag over the whole sorted list, not adjacent pairs. |
| 4 (`noBackToBackMuscle`, strength subsequence) | Pass | 5/6 swap fires it naming **"block 3" and "block 5"**, not 4 and 5, proving the strength-subsequence reading (Jump rope at position 4 sits between them physically but is filtered out). Code read confirms the loop iterates `sorted.filter(b => b.branchKey === 'strength')`, not the raw list. |
| 5 (`noAdjacentHighCardio`, directly-adjacent only) | Pass | 3/4 swap fires it naming "block 2" and "block 3", and no other rule fires from that swap. |
| 6 (default plan: zero violations) | Pass | Fresh load: `violations: []`, single emerald "All five ordering conventions satisfied" row, no row shows an amber badge or border (screenshot `01-default-light.png`). |
| 7 (all four swaps + negative control, no reload) | Pass | All four swaps fired exactly the documented violation(s) via in-page recompute (no `page.reload()` used, only client-side state changes); the DECIDED 4/5 negative control fired nothing. The 5/6 swap co-fired both `compoundBeforeIsolation` and `noBackToBackMuscle` simultaneously, neither suppressing the other. |
| 8 (violation display: rail + row, own `useFormContext`) | Pass | Rail rows show bold rule name, plain-language reason, and indigo "block N" pills; row-level amber badge/border matched exactly to the positions each violation named (verified for the 5/6 swap: rows 3, 5, and 6 each independently amber, each with its own correct badge text). Code read: `WorkoutBlockRow.vue` calls `checkConventions(collectBlocks(readPath(values, props.planPath), props.branches))` off its own `useFormContext()`, filtered to its own `myOrder`; no `violations` prop passed down. |
| 9 (submit stays enabled, no hidden leaf/validation rule) | Pass | With 2 simultaneous violations active, `save-plan-button`'s `disabled` attribute was `null` and a click produced the saved banner. Source diff of `workoutPlanMath.ts`, `WorkoutPlanExample.vue`, and `WorkoutBlockRow.vue`: no `validation` closure, no new hidden/zero-width leaf field anywhere; `canSubmit`/the submit button gate is still the plain `meta.value.valid` expression. |
| 10 (dark mode via existing CSS variables) | Pass | `html.dark` toggle screenshots (`05-swap56-both-dark.png`, `06-default-dark.png`) show the amber row border/background, rail violation rows, and row badges all resolving through the existing `dark:` Tailwind classes already used elsewhere in the page; no page-specific dark markup found in the new files. |

Edge cases: absence-is-never-a-violation confirmed for both Warm-up and Cooldown (AC1/AC2). Single-strength/single-cardio-can-never-fire is confirmed by code inspection (both loops require at least two elements in the filtered/adjacent set to produce a violation; not separately click-tested, low risk since this follows directly from the loop bounds). Stale-badge-clears-on-removal confirmed directly: after the 5/6 swap (3 amber rows, 2 rail violations), removing "Seated leg curl" (the sole cause of the `noBackToBackMuscle` pairing) cleared `violations: []` and left zero amber rows, including on the sibling squat row that had shared the badge. Multiple-simultaneous-violations shown together without suppression: confirmed (5/6 swap, both rail entries and all three affected rows render at once).

### Prototype comparison
Matches `#violations` Variant A treatment (amber row border/badge, bold rule name + reason + indigo `ref` pill in the rail, emerald all-clear row) and `#reorder-payoff`'s before/after proof, with the story's three documented corrections to the prototype all verified as implemented, not the stale prototype behavior:
- The prototype's Variant A illustration (no-Warm-up-at-all firing a boundary violation) was **not** built; live-tested absence case confirms the "order among present blocks only" reading instead.
- `#reorder-payoff`'s stale "Block 2 / Block 3" labels were **not** carried over; the implementation correctly names the corrected positions (block 6 for the compound-after-isolation flip on the seven-block default, matching AC7 bullet 3, not the prototype's two-block illustration numbers).
- The `#metadata-walkthrough` pseudocode's bare `blocks[0].kind !== 'warmUp'` (no presence guard) was not implemented; the real `checkConventions` guards with `sorted.some(b => b.branchKey === 'warmUp')` first.

Both color modes checked at the relevant anchors; no visual drift from ST-01/ST-02's sibling states (pristine/invalid/valid field borders, reorder-boundary disabled buttons) observed alongside the new amber warning state.

### Process compliance
- No `packages/core/src/` change (`git diff --stat -- packages/` empty); no changeset added, correctly (none required).
- `specs/components.md` unchanged, correctly (no public library surface changed).
- No `docs/reference/*` or `docs/guide/*` change, correctly (none assigned to this story, no public API change).
- No new library export; all new identifiers (`branchKey`, `globalIndex`, `canRemove`, `planPath`, etc.) are camelCase, consistent with CLAUDE.md's Vue casing rule.
- No automated tests added for `checkConventions`/the two extended components, consistent with the QA plan's stated and already-accepted infra constraint (same as ST-01/ST-02's precedent for `workoutPlanMath.ts`/`splitPaymentLedgerMath.ts`).
- No undocumented spec deviations found; the Implementation notes' "no deviations" claim checked out against a source read of all five touched/new files.
- No silent override of feature-level decisions: Variant A only (no Variant B code path anywhere), "order among present blocks only" boundary semantics match the feature's DECIDED resolution verbatim.

### Minor non-blocking observations (not held against the verdict)
- During the `pnpm docs:dev` manual pass, rapid repeated `page.goto()` reloads under active Vite HMR triggered a transient "Failed to resolve component: AppButton" Vue warning. This did not reproduce at all against the production `pnpm docs:preview` build (8 repeated navigate+swap cycles, zero warnings), so it is a dev-server module-boundary artifact of the test harness's rapid reload pattern, not a defect in `WorkoutBlockRow.vue`'s component resolution.
- One isolated `404 Failed to load resource` was observed once during the full production-preview checklist run; it did not reproduce across 8 repeated navigate+swap cycles in isolation, and no failing request URL could be captured. Not blocking; worth a glance if it recurs in the Cloudflare Pages preview.

### Verdict: pass

ST-03 is done. This was not the feature's last open story: ST-04 (narrative, metadata walkthrough, discoverability) remains, so FEAT-009 stays `in-progress`.

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field once opened.
