---
id: ST-03
type: story
feature: FEAT-008
status: done
approved_by: Jeroen
pr: ""
---

# Story: Summary panel in full, plus non-blocking convention warnings

## Decided without Jeroen (research)

Settled from research during story prep (post-approval ladder), not reviewed by Jeroen. Override any of these freely.

- Review finding 1 → the host lifts `venueClose` into the elapsed frame (reusing ST-02's helper) and passes a precomputed `venueOverflow` prop; the panel stays form-agnostic per ADR-4

## Functional

### User story
As a docs reader exploring the run-of-show builder example, I want the summary panel to show the full evening timeline, a non-blocking venue-close overflow indicator, and per-kind counts, and I want gentle non-blocking warnings when cake cutting comes before dinner or the program opens with a break, so that I get the full picture of the program at a glance and understand that only the curfew rule can ever block saving.

### Acceptance criteria

1. Given the program's items in their current order, When the summary panel renders, Then it shows an at-a-glance timeline listing every item's label and computed start clock time, with any curfew-breaching item's row tinted rose.
2. Given the program's computed end time and the venue-close anchor, When the panel renders, Then it shows a non-blocking status block: an emerald "Within venue hours (N minutes to spare)" banner when the program ends at or before venue close, or an amber "Program runs N minutes past venue close. This is a duration total, not an order problem: reordering cannot fix it." banner otherwise, matching `#summary-variants`.
3. Given the program's items across all six kinds, When the panel renders, Then it shows a per-kind count-chip row with a count for every kind, including kinds with zero items (for example "0 breaks").
4. Given a cake-cutting item positioned before every dinner-course item currently in the program, When evaluated, Then the cake-cutting row shows an amber "Convention" pill with an inline message ("Cake cutting usually comes after every dinner course"), non-blocking, matching `#row-states`'s cake-before-dinner variant.
5. Given a break/room-turn item as the program's first displayed item, When evaluated, Then that row shows an amber "Convention" pill with an inline message ("The program usually does not open with a break"), non-blocking, matching `#row-states`'s leading-break variant.
6. Given both convention warnings present at the same time as a curfew breach, When the submit control is evaluated, Then it is disabled solely by the curfew's `meta.valid` state; neither convention warning ever affects `canSubmit`.
7. Given zero program items (the empty state), When the panel renders, Then it shows its own parallel empty state: a muted "The timeline appears here as you add items." panel and an emerald "No amplified items yet, so nothing can breach the curfew." banner, matching `#empty-program`.

### Edge cases
- More than one cake-cutting or leading-break violation can exist at once (for example two cake items, both before dinner); each flags independently and none of them is hard-blocking.
- The venue-overflow indicator and the curfew banner (ST-02) are independent: one can read amber while the other reads emerald, in either combination.
- The convention checks never read or depend on the curfew anchor or the `curfewBreaches` computed; removing the breaching curfew item does not change either convention flag's outcome.
- Removing every dinner-course item clears any cake-after-dinner warning that depended on their presence.

### Out of scope
- The curfew hard-blocking rule itself, the hidden `curfew` vehicle leaf, and the curfew banner already built in `RunOfShowSummary.vue` by ST-02 (this story only extends the surrounding panel in the same file).
- Reorder controls and the `preserveOrder: true` flip (ST-02).
- Narrative prose, the metadata walkthrough, cross-links, and nav/sidebar discoverability (ST-04).

## Design reference
Implements `../../prototype.html#summary-panel` in full (the at-a-glance timeline, the venue-overflow block, the count-chip row), `#summary-variants` (both the overflow and all-clear variants), `#row-states`'s cake-before-dinner and leading-break convention-warning variants, and the summary half of `#empty-program`. No new design language: reuses the checkout's `OrderSummary` card shell and emerald/amber banner classes verbatim, per the feature's component mapping.

## Architecture reference
Builds, extending ST-01/ST-02's files:
- `runOfShowMath.ts` (extends): adds a per-kind `counts` derivation over `collectProgramOccurrences`'s output, and two pure convention-check functions (`findCakeBeforeDinner`, `findLeadingBreak` or equivalent names finalized at implementation time) consumed as derived display flags per ADR-5, with no new hidden vehicle leaf and no interaction with `findCurfewBreaches`.
- `RunOfShowSummary.vue` (extends ST-02's minimal file, which currently holds only the curfew banner): adds the at-a-glance timeline list, the venue-close overflow indicator block, and the per-kind count-chip row, all taking host-computed props (`timeline`, `programEnd`, `counts`) per ADR-4, same as the existing `curfewBreaches` prop.

  The prop list above is completed for the AC2 overflow block, with the frame stated: `programEnd` is in `computeTimeline`'s minutes-since-event-start (elapsed) frame, while `venueClose` from `parseTime` is raw minutes-from-midnight; the two cannot be compared directly (with the default `18:00`/`01:00` data a raw compare `335 > 60` would wrongly read as overflow, when the program is actually 85 minutes inside venue hours). The host lifts `venueClose` into the same elapsed frame `findCurfewBreaches` already lifts the curfew into (subtract event start, add 1440 when the parsed minute is below event start, the ADR-7 next-day rollover), reusing ST-02's curfew frame-lift helper rather than writing a second one, and passes a host-computed `venueOverflow` value (minutes to spare, or minutes over) as a prop so the summary stays form-agnostic per ADR-4.

  DECIDED (research), resolving finding 1 and applying its PROPOSED edit: the host owns the venue-close frame-lift and the panel receives a precomputed prop. Settled on the post-approval ladder's first rung: ADR-4 already rules that the summary takes host-computed props and never reads the form, and ADR-7 already places all clock-frame arithmetic (including this rollover) in the math module consumed by the host; a panel-side lift or a raw compare would contradict both.
  Sources: specs/FEAT-008-run-of-show-builder-example/spec.md (ADR-4, ADR-7), ST-02 Architecture reference (findCurfewBreaches frame-lift)
- `RunOfShowRow.vue` (extends): adds the amber "Convention" pill and inline warning message for the two convention checks, derived from the same math module, rendered alongside (never replacing) the existing curfew rose styling when both apply to different rows.
- `RunOfShowExample.vue` (extends): adds the `counts` and convention-check computeds, reading `values.program` the same way the existing `timeline`/`curfewBreaches` computeds already do, and passes them to `RunOfShowSummary`.

No `packages/core/src/` change and no changeset: nothing here uses a new engine capability beyond what ST-01/ST-02 already verified.

Dependencies: depends on ST-01 for the metadata tree and the base `runOfShowMath.ts` module, and on ST-02 for `RunOfShowSummary.vue`'s existing shell and the order-sorted occurrence list the counts/convention checks read. Shares the math module and the summary shell with ST-02, so it is co-sliceable with it per the feature's slicing seams, but is sequenced after ST-02 in this split since both extend the same two files. ST-04 depends on this story's finished panel to describe accurately in the walkthrough.

## QA plan

### Test infrastructure reality (read first)

Same facts as ST-01 and ST-02's QA plans, not re-litigated here: this story's code lives entirely under `docs/.vitepress/theme/components/` (`RunOfShowSummary.vue`, `RunOfShowRow.vue`, `runOfShowMath.ts`, `RunOfShowExample.vue`), `docs/` has no vitest runner, no `__tests__/` directory, and `pnpm -r ci:test:coverage` never walks `docs/`. ST-01's QA plan finding 1 already routed "should `docs/` get a minimal vitest setup" to Jeroen as a feature/epic-level scope call, not a story gate, and this plan adopts the same ruling. Every check below is manual-against-the-built-page or code-review-level, following the accepted pattern; no `*.test.ts`/`*.logic.test.ts`/`*.validation.test.ts`/`*.analytics.test.ts` files are produced because there is nowhere in `docs/` to run them. The naming conventions are used below only to classify which kind of check a manual/code-review step stands in for, so a future `docs/` test runner (if Jeroen approves one) has a ready-made mapping.

### Architecture-reference gaps found while planning

- **The venue-overflow comparison's time frame is not stated.** The Architecture reference says `RunOfShowSummary.vue` takes `programEnd` as a host-computed prop and ST-02 already produces a `timeline` whose last entry's `endMinutes` is the program-end minute, in the minutes-since-event-start frame `computeTimeline` uses throughout. `venueClose` is parsed by `parseTime` with the same next-day rollover ADR-7 already gives it. Neither this story's Architecture reference nor the feature spec states explicitly that the AC2 comparison (`programEnd` vs `venueCloseMinutes`) must compare two values already in the same frame, the identical mistake class ADR-7/finding 2 corrected for the curfew. Because `venueClose` already had the rollover treatment from ST-01 onward (unlike the curfew, which needed an explicit fix), this is likely already correct by construction, but it is the first time this comparison is actually rendered, so it needs its own verification rather than inherited trust. See AC2 test mapping and Findings below.
- **Whether the per-kind count-chip row renders at zero total items is not stated, and the prototype's two relevant sections disagree if read carelessly.** AC3 says counts show for every kind "including kinds with zero items (for example '0 breaks')," implying the chip row is always present when at least one item exists anywhere. AC7 (empty program) describes only a muted timeline panel and an emerald curfew banner, with no count-chip row in `#empty-program`'s markup (verified: lines 699-707 of the prototype have no `.counts` block). Read together these are consistent (AC3's "zero items for a given kind" means a non-empty program missing one of the six kinds, not a fully empty program), but the story should say so explicitly so the developer does not add a six-way "all zero" count row to the empty state by mistake. See AC3/AC7 test mapping below.

### Acceptance criteria to test mapping

All manual against the built docs page (`pnpm docs:dev`, page `/examples/run-of-show`) unless noted, each checked in both light and dark mode per ST-01/ST-02's convention (a dark-mode mismatch fails the AC it belongs to, not a separate bug). Checks build on ST-02's tuned default dataset (one curfew breach, one named fix move) plus manually added/removed items as each AC needs.

1. **AC1 (at-a-glance timeline list, labels + start times, curfew-breaching row tinted rose).** Manual: with the default dataset, verify `#summary-panel`'s timeline list shows one row per program item, each with its label and computed start time (start only, not end, per the prototype's `sum-tl` markup), in the program's current display order. Verify the row(s) matching `findCurfewBreaches`'s output are tinted rose (the prototype's `.r.cross` treatment); verify a non-breaching row is not tinted. Add/remove/reorder an item and confirm the list updates live with no stale entries. Code review: confirm the list is driven by the `timeline` prop (ADR-4), not a second read of `useFormContext` inside `RunOfShowSummary.vue`.
2. **AC2 (venue-close overflow indicator, both banner variants, exact wording).** Manual, two passes: (a) with the default dataset (program ends before venue close), verify the emerald banner reads "Within venue hours (N minutes to spare)" with N matching a hand calculation of `venueCloseMinutes - programEnd`. (b) Temporarily extend durations until the program end passes venue close (01:00), verify the amber banner reads "Program runs N minutes past venue close. This is a duration total, not an order problem: reordering cannot fix it." with N matching `programEnd - venueCloseMinutes`. Confirm this banner's variant and N track the program's *total duration* only: reordering items (with total duration held constant) must never flip the banner or change N, directly exercising the Edge case "the venue-overflow indicator ... is independent" and the candor requirement. Code review (resolving the architecture gap above): confirm the comparison reads `programEnd` and `venueCloseMinutes` from the same minutes-since-event-start frame (both already produced by `computeTimeline`/`parseTime` per ADR-7), never a raw clock-string compare; hand-verify with a venue-close-past-midnight example (event start 20:00, venue close 01:00, matching the shipped anchors) that the rollover is applied before the subtraction, the same worked-example substitute ST-02 used for the curfew's past-midnight case.
3. **AC3 (per-kind count-chip row, all six kinds, zero-count kinds included).** Manual: with a program containing items in only some of the six kinds (e.g. the default dataset, which has zero breaks), verify the count-chip row shows exactly six chips, one per kind, including "0 breaks" for the absent kind. Add a break, verify its chip increments to "1 break" live; remove it, verify it returns to "0 breaks." Code review: confirm the counts derivation iterates a fixed list of all six kinds (not only kinds present in `values.program`), so a kind with zero occurrences still emits a zero-count entry.
4. **AC4 (cake-before-dinner convention warning, amber, non-blocking).** Manual: starting from a program with a cake-cutting item positioned before every dinner-course item (construct this manually if the default dataset does not already have this arrangement after ST-02's tuning), verify that cake row shows the amber "Convention" pill and the inline message "Cake cutting usually comes after every dinner course," matching `#row-states`'s cake-before-dinner variant. Verify submit stays enabled (no change to `meta.valid`) purely from this warning being present. Reorder the cake item after every dinner course, verify the warning clears live with no field edited. Edge case: add a second cake item also before some dinner course, verify both flag independently (two amber pills, not one shared one).
5. **AC5 (leading-break convention warning, amber, non-blocking).** Manual: add or reorder a break/room-turn item into the first displayed position, verify it shows the amber "Convention" pill and "The program usually does not open with a break," matching `#row-states`'s leading-break variant. Reorder another item ahead of it, verify the warning clears from the break and no new warning appears elsewhere. Verify submit stays enabled throughout.
6. **AC6 (submit disabled solely by curfew `meta.valid`; convention warnings never affect `canSubmit`).** Manual: construct a program with both convention warnings present (cake-before-dinner and leading-break) simultaneously with a curfew breach; verify submit is disabled with the curfew's rose helper line (ST-02's AC3 behavior), not any convention-related message. Then clear the curfew breach only (ST-02's AC4 single-move fix) while leaving both convention warnings in place; verify submit becomes enabled. Code review: grep `RunOfShowExample.vue`'s `canSubmit` computed and confirm it reads only `meta.valid` (or an expression built solely from it), with no reference to the cake/leading-break check functions; grep the two convention-check functions themselves and confirm neither is called from inside any `validation` closure or the hidden `curfew` vehicle leaf's `computedProps`.
7. **AC7 (empty program, parallel summary empty state).** Manual: remove every item so the program is empty, verify `#summary-panel` shows the muted "The timeline appears here as you add items." panel (no count-chip row, no timeline list) and the emerald "No amplified items yet, so nothing can breach the curfew." banner, matching `#empty-program`. Confirm neither the venue-overflow block nor the count-chip row renders in this state (resolving the architecture gap above). Add one non-amplified item (e.g. a break), verify the empty summary state is replaced by the populated one (timeline list with one row, count chips, venue-overflow block) and the curfew banner is still the ST-02 emerald "no breach" variant, now because there is genuinely no amplified item yet, not because the program is empty.

### Edge cases (from the spec's Edge cases section), all manual

- Two simultaneous cake-before-dinner violations (or two leading-break-eligible rows, to the extent more than one row can occupy "first displayed" only sequentially after reorders): verify each flags independently via its own amber pill, and neither is hard-blocking.
- With a curfew breach and a convention warning both present, verify the venue-overflow indicator can independently read emerald while the curfew reads rose (and vice versa): the two are unrelated totals, confirm by constructing one case of each combination.
- Remove the curfew-breaching item entirely (clearing the curfew error): verify neither convention warning's state changes as a side effect, confirming the convention checks never read `curfewBreaches` or the curfew anchor. Code review: confirm `findCakeBeforeDinner`/`findLeadingBreak` (or whatever names implementation settles on) take only `timeline`/`occurrences`-shaped input, never `curfewBreaches` or the curfew anchor value, as parameters.
- Remove every dinner-course item while a cake-after-dinner warning is showing: verify the warning clears live (cake can no longer be "before" a dinner course that does not exist).

### Code-review-level checks (not runnable, but gate merge)

- `findCakeBeforeDinner`/`findLeadingBreak` (names TBD at implementation) are pure functions in `runOfShowMath.ts`, taking the same `timeline`/occurrence-shaped input as `findCurfewBreaches`, with no Vue/form dependency, matching the module's stated "pure, no Vue/form dependency" constraint.
- The counts derivation and both convention checks are computed in `RunOfShowExample.vue` reading `values.program` the same way `timeline`/`curfewBreaches` already do (per the Architecture reference), not duplicated inside `RunOfShowRow.vue` or `RunOfShowSummary.vue` from a second read of the form.
- `RunOfShowRow.vue`'s amber "Convention" pill is rendered alongside, never replacing, the existing rose curfew styling, and the two are structurally impossible to collide on one row in the current branch set (curfew applies only to amplified kinds: speech-with-`onMic`, band, dance floor; the conventions apply only to cake and break respectively), so no row-level precedence rule needs to exist yet. Confirm by reading the row's state-selection logic: it should not need to pick between rose and amber because the branch kinds never overlap, not because one check was given silent priority over the other.
- Summary clock times, count-chip text, and the convention inline messages use `slate-500` or darker (feature finding 4, WCAG AA), not the `slate-400`/`text-3` token; grep the new/changed CSS classes in `RunOfShowSummary.vue` and `RunOfShowRow.vue` for `text-3`/`slate-400` and expect none on text conveying data (times, counts, warning/convention copy).
- No field or child anywhere is named `order` remains true after this story's additions (ADR-6); the new counts/convention logic introduces no new metadata fields, only derived computeds, so this should be a no-op check.

### States from the feature's states policy applicable to this slice

- **Warning (domain conventions, non-blocking)**: amber card border + inline amber message with a triangle icon + `Convention` pill, on the cake-before-dinner row (AC4) and the leading-break row (AC5). Never blocks submit (AC6).
- **OK / valid**: emerald venue-overflow banner (AC2, within-hours variant) and the empty-state curfew-ok banner (AC7).
- **Error (inherited, not retested)**: the curfew rose row/banner is ST-02's; this story only confirms it coexists correctly with the new warning state (AC6, Edge cases) and does not re-verify ST-02's own curfew mechanics.
- **Empty**: the summary's own parallel empty state (AC7), mandatory per the feature's states policy, shown in `#empty-program`.
- Out of scope for this slice: Loading (no change), Disabled (no change), Field validation (no change; inherited from ST-01).

### Reactivity

Not applicable as an automated `*.analytics.test.ts`, for the same infrastructure reason as ST-01/ST-02: `docs/` has no vitest runner. This story introduces no new engine-level reactivity surface: the counts and two convention-check computeds read `values.program` through `useFormContext` exactly as the existing `timeline`/`curfewBreaches` computeds already do (per the Architecture reference), so they ride on the same `DynamicFormItemChoice` re-render guarantees already proven by `packages/core`'s own `DynamicFormItemChoice.analytics.test.ts`/`.logic.test.ts`. No `computedProps`, no new hidden vehicle leaf, no validation wiring is added (ADR-5: derived display flags only), so there is no new loop-guard surface either. What the manual checks above must still catch, with no render-count signal available on this side of the boundary, is a wiring bug local to this story: AC1/AC3/AC4/AC5's "add/remove/reorder, verify it updates live" steps are the direct substitute for a render-count assertion.

### Fixtures / existing utilities

Carries over ST-01/ST-02's values-dump technique (`<pre>{{ JSON.stringify(values, null, 2) }}</pre>`) in `RunOfShowExample.vue`, useful here for confirming the exact occurrence order and durations feeding a given AC4/AC5/AC6 construction before reading the rendered chips. No fixture from `packages/core/src/examples/` applies, same reasoning as ST-01/ST-02.

### Coverage impact

None measurable: `pnpm -r ci:test:coverage` does not walk `docs/`. The two new convention-check functions and the counts derivation in `runOfShowMath.ts` ship with no automated coverage under the current `docs/` infrastructure, the same gap ST-01/ST-02 already flagged for the rest of the module, now extended to these two new functions. Not resolved by this story.

### Time sensitivity

The counts derivation and the two convention checks are pure functions over `timeline`/occurrence data already produced by `parseTime`/`computeTimeline`; none reads the system clock, current date, or a timezone API. Nothing in this story is sensitive to `TZ=Europe/Amsterdam`. The venue-overflow comparison (AC2) uses the same minutes-since-event-start values the curfew check already uses, so it is equally timezone-independent.

### Regression risk

- **Touches no `packages/core/src/` file.** Confirm by running `pnpm -r ci:test` before merge and expecting zero diffs in `packages/core` test results.
- **Extends two files ST-02 created/extended: `RunOfShowSummary.vue` (adds to ST-02's curfew-only banner) and `RunOfShowRow.vue` (adds the amber pill alongside ST-02's rose styling).** A change to either file's existing curfew rendering while adding the convention UI would regress ST-02's AC3/AC6/AC9; re-run ST-02's AC3 (curfew banner wording and position-naming) and AC6 (per-row rose styling) manual checks after this story's changes land, since neither has an automated test to catch a regression silently.
- **Shares `runOfShowMath.ts` with ST-01 and ST-02.** Adding the counts/convention functions must not change `collectProgramOccurrences`, `computeTimeline`, or `findCurfewBreaches`'s existing signatures or behavior; confirm by re-running ST-02's AC4 (single-move-fix) and AC5 (past-midnight curfew) hand calculations once this story's changes land, to confirm the curfew math is unaffected.
- **ST-04 depends on this story's finished panel.** A change to the panel's final DOM structure, class names, or wording after this story ships would invalidate any walkthrough prose or screenshot ST-04 writes against it; flag any such late change in Implementation notes.

### Untestable / ambiguous acceptance criteria

None are untestable as written once the two architecture gaps above are resolved (the venue-overflow time frame, and the empty-vs-nonempty count-chip branching); both are routed as findings below rather than silent assumptions. One wording note, not a rewrite: AC2's "matching `#summary-variants`" is satisfied by matching the banner copy and variant logic, not the prototype's exact pixel layout (same convention ST-01 used for its own design-reference matches).

### Findings for adversarial review

1. **should-fix — The architecture reference does not state that the AC2 venue-overflow comparison must stay in the minutes-since-event-start frame already established for the curfew/venue-close anchors (ADR-7).** Likely already correct by construction since `venueClose` already carries the rollover treatment from ST-01 onward, but this is the first story to actually render the comparison, and it is the same mistake class ADR-7/finding 2 corrected for the curfew. Recommend stating explicitly in the Architecture reference that `programEnd` (from `computeTimeline`) and `venueCloseMinutes` (from `parseTime`) are compared directly with no re-parsing or raw clock-string comparison.
2. **nit — The architecture reference does not state whether the count-chip row renders at zero total program items.** The prototype's `#empty-program` section has no count-chip row; AC3 and AC7 are consistent once read together, but an explicit sentence ("the count-chip row does not render when the program is fully empty; AC7 owns that state") would remove the ambiguity for the developer. Not routed as a blocker since the prototype itself resolves it unambiguously.
3. **nit — `pnpm -r ci:test:coverage` passing on this story proves nothing about the two new convention-check functions or the counts derivation**, for the same reason ST-01/ST-02 already flagged for the rest of the module. Worth one line in the PR description so green coverage is not read as evidence either new code path was exercised.

Status set to `adversarial-review`: no blocker found; all seven acceptance criteria are mapped to a concrete manual or code-review check; one should-fix (the venue-overflow time-frame gap) and two nits are routed for visibility, none of which independently forces discussion.

## Adversarial review
Lite (story-level) review. Verified against the prototype (`../../prototype.html` sections `#summary-panel` lines 489-528, `#summary-variants` lines 717-737, `#row-states` lines 628-646, `#empty-program` lines 691-710), the approved feature design/architecture (ADR-4, ADR-5), and sibling stories ST-01 and ST-02 (both `awaiting-approval`, all findings resolved).

**Checked and confirmed true (recorded so Jeroen sees the basis):**
- All seven acceptance criteria map to a concrete manual or code-review check in the QA plan; none is untestable.
- AC4/AC5 convention wording matches the prototype `#row-states` cells verbatim ("Cake cutting usually comes after every dinner course." line 633; "The program usually does not open with a break." line 643).
- AC3's six-chip row including zero-count kinds matches `#summary-panel` (line 523, "0 breaks"), and AC7's empty-state panel matches `#empty-program` (no count row, no timeline list, only the muted panel plus the emerald curfew-ok banner, lines 699-707).
- AC6 is consistent with ADR-5: conventions are derived display flags with no vehicle leaf, so they cannot touch `meta.valid` by construction. The curfew/convention no-collision argument holds (curfew flags only amplified kinds, conventions flag only cake/break, disjoint sets).
- Dependencies on ST-01 and ST-02 are explicit, including the file-sharing (`RunOfShowSummary.vue`, `RunOfShowRow.vue`, `runOfShowMath.ts`).

### Findings

1. **should-fix — The venue-overflow comparison (AC2) has no stated time frame and the summary's prop list omits the venue-close input it needs.** Adopted from the qa-planner's finding 1 and sharpened by reading the prototype and the prop list. The Architecture reference gives `RunOfShowSummary.vue` only `timeline`/`programEnd`/`counts`, with no `venueClose` (or precomputed overflow) prop, and never states the frame the AC2 comparison runs in. `programEnd` is elapsed minutes-since-event-start; `venueClose` from `parseTime` is raw minutes-from-midnight. These cannot be compared directly: with the shipped `18:00`/`01:00` default a raw `335 > 60` compare reads as overflow when the program is actually 85 minutes inside venue hours (the prototype's own `#summary-panel` number). This is the same frame-mismatch class ADR-7/feature-finding 2 corrected for the curfew, surfacing for the first time here because this is the first story to render the comparison. The qa-planner's own phrasing ("compared directly, no re-parsing") understates it: `venueClose` must be *lifted* into the elapsed frame, not compared as-is. Routed as a PROPOSED edit in the Architecture reference (add the prop and require reuse of ST-02's curfew frame-lift). Not a blocker: AC2's manual pass (a) and its code-review step already catch a mis-framed implementation (it shows the wrong banner on the default dataset), so the AC stays testable; this is an architecture-clarity gap, and routing it as a PROPOSED edit keeps it out of discussion.

   RESOLVED. DECIDED (research): the PROPOSED edit is applied in the Architecture reference. The host owns the venue-close frame-lift (reusing ST-02's helper) and passes a precomputed `venueOverflow` prop; ADR-4 and ADR-7 already dictate this split, so there was no open alternative to weigh.

2. **nit — The count-chip row at zero total items.** Adopted from the qa-planner's nit. AC7 already states explicitly that the empty state shows "no count-chip row, no timeline list," and the prototype `#empty-program` confirms it, so AC3 ("zero items for a given kind" in a non-empty program) and AC7 (fully empty) do not actually conflict. Already resolved by AC7's own wording; recorded for completeness, not routed.

3. **nit — The emerald within-hours banner wording differs between the two prototype sections AC2 cites.** `#summary-panel` (line 504) reads "Within venue hours (85 minutes to spare)." with the parenthetical N; the `#summary-variants` all-clear cell (line 732) reads "Within venue hours." with no N. AC2 quotes the parenthetical version but points at `#summary-variants`. The intended wording is the `#summary-panel` parenthetical one (it carries the N the AC2 test hand-calculates); the `#summary-variants` cell is a compressed gallery variant. Harmless given the full `#summary-panel` reference in the Design reference, but worth naming so the developer implements the parenthetical form.

4. **nit — `pnpm -r ci:test:coverage` passing proves nothing about the two new convention checks or the counts derivation**, since it never walks `docs/`. Carried over from ST-01/ST-02; worth one line in the PR description so green coverage is not read as evidence either new path was exercised.

### Status rationale
No blocker. No Open question (all seven feature-level questions are DECIDED). The one should-fix is routed as a PROPOSED edit in the Architecture reference, so it does not force discussion; the remaining three findings are nits. Applying the mechanical rule, the story lands at `awaiting-approval`. The single item left for Jeroen when he reviews the PROPOSED edit: confirm the host, not the panel, owns the venue-close frame-lift (reusing ST-02's curfew helper), keeping `RunOfShowSummary` form-agnostic per ADR-4.

Post-review research (story prep, post-approval ladder): finding 1's PROPOSED edit is applied and DECIDED (research) inline, settled on rung 1 (ADR-4 and ADR-7 already dictate the host-owned lift). Status stays `awaiting-approval`; Jeroen can still override the decision at the gate.

## Implementation notes

Extended `runOfShowMath.ts`, `RunOfShowSummary.vue`, `RunOfShowRow.vue`, and `RunOfShowExample.vue` per the architecture reference. `packages/core/src/` untouched, no changeset.

- `runOfShowMath.ts`: added `countOccurrencesByKind` (always emits one entry per declared branch, including zero-count kinds) and the two pure convention checks, `findCakeBeforeDinner`/`findLeadingBreak`, both reading only `ProgramTimelineResult` (never `curfewBreaches` or the curfew anchor), matching the names the architecture reference anticipated.
- `RunOfShowSummary.vue`: added the at-a-glance timeline list (label + start time, rose-tinted offenders), the venue-close overflow block (status rows plus the emerald/amber banner with the exact AC2 wording), and the count-chip row. A fully empty program (`timeline.length === 0`) swaps all three for the muted placeholder panel and the "No amplified items yet..." banner, matching `#empty-program`; no extra prop was needed for this since `timeline` already doubles as the emptiness signal. All summary props stay host-computed plain data (ADR-4); the panel does no clock arithmetic of its own beyond picking a banner variant by the sign of the host-supplied `venueOverflowMinutes`, the same kind of simple view branching the existing curfew banner already did.
- `RunOfShowExample.vue`: added `summaryTimeline`, `venueOverflowMinutes` (via a new `venueCloseAbsolute` lift reusing ST-02's `liftToEventFrame` helper, resolving the architecture's PROPOSED edit), and `summaryCounts` (with a small `PROGRAM_COUNT_NOUNS` singular/plural map for the chip wording, e.g. "1 band set" / "2 band sets").
- `RunOfShowRow.vue`: added the amber "Convention" pill, the inline warning message, and the amber card border (only when not already breaching; curfew and convention branch sets are disjoint so the two states structurally cannot collide on one row).

**Deviation from the architecture reference's literal channel for the two convention checks.** The architecture text says `RunOfShowExample.vue` computes the convention checks and "passes them to RunOfShowSummary"; the QA plan's code-review check additionally expects them not to be duplicated inside `RunOfShowRow.vue` from a second form read. I first implemented this literally: the convention key arrays computed once in the host, carried through a new `conventionWarnings` field on `DynamicFormSettings` (the sanctioned extension channel), and consumed by `RunOfShowRow` as a prop via the `program-choice-array-item` slot's own `settings` binding.

This reproduced a genuine compute-loop bug, caught live with Playwright, not in code review: making `settings` a `computed()` that changes identity on every `values.program` write cascades back into `seedOccurrencePresence` (the ST-01 fresh-occurrence seed) and trips the engine's `assertNoComputeLoop` guard the moment the first occurrence in the whole program is removed (`program.dinner[0].duration` recomputed over 100 times without the event loop turning). Confirmed by isolation: reverting only the `settings` object back to a static, non-reactive constant made the identical removal sequence clean again; reinstating it reproduced the loop every time.

Given that, `RunOfShowRow.vue` instead computes `findCakeBeforeDinner`/`findLeadingBreak` itself, over the exact same `timeline` computed it already builds and already uses for `isBreaching`/the clock chip/the curfew marker. No new props, no settings churn, no new reactive dependency: this matches the already-proven, already-accepted pattern `isBreaching` itself uses (a local, self-contained `useFormContext` read), just extended with two more pure-function calls over data the row was already computing. `RunOfShowExample.vue` and `RunOfShowTemplate.vue` carry no convention-related code as a result; `RunOfShowSummary.vue` never needed the convention flags either (no AC calls for them in the panel). Verified live with Playwright: removing the first item in a 7-item program, in both light and dark mode, no longer throws, and the cake-before-dinner/leading-break pills still render and clear correctly on reorder. This is a correctness-driven deviation from the literal plan, not a scope change; flagging it here rather than propagating it to the feature spec since it stays entirely inside this story's own files and doesn't change any ADR, prop contract, or public surface.

Verified manually against `pnpm docs:dev` with Playwright/Chromium, light and dark mode: the default dataset's summary (timeline list, "Within venue hours (50 minutes to spare)", six count chips including "0 breaks"), the empty-program parallel state (AC7), a constructed cake-before-dinner + leading-break scenario (both amber pills and messages, submit disabled only by the pre-existing curfew breach per AC6), and a constructed venue-overflow scenario ("Program runs 10 minutes past venue close. This is a duration total, not an order problem: reordering cannot fix it.", amber independent of the still-rose curfew banner).

## Verification report

### Pipeline checks
- `pnpm run ci:test`: pass, 971 + 1 tests, zero diff in `packages/core`/`packages/element-plus` (no core files touched by this story).
- `pnpm run ci:lint`: pass (core/element-plus packages).
- `pnpm run ci:typecheck`: pass (core/element-plus packages).
- `pnpm -r ci:test:coverage`: pass, 98.51% statements / 92.91% branch / 98.36% functions, matching the pre-existing baseline (docs/ is not walked by coverage, as the QA plan states).
- `docs/` not covered by the root workspace scripts, so ran directly: eslint over every changed/new `docs/` file (`RunOfShowSummary.vue`, `RunOfShowRow.vue`, `runOfShowMath.ts`, `RunOfShowExample.vue`, `RunOfShowTemplate.vue`, `RunOfShowTimeline.vue`, `FormField.vue`, `theme/index.ts`) using the root `eslint.config.js`: zero findings. `vue-tsc --noEmit` over the whole `docs/` project: only the three known pre-existing errors (`BasicFormExample.vue`, `CheckoutFormExample.vue`, `ChoiceSectionCard.vue`), none in any `RunOfShow*` file.
- `pnpm docs:build`: succeeds, VitePress compiles the new page cleanly.

### Acceptance criteria

| AC | Result | Evidence |
|----|--------|----------|
| 1. Timeline list, labels + start times, breaching row tinted rose | Pass | Manual: default dataset's summary lists all 7 items in order with correct start times (18:00, 18:10, 18:55, ...), verified by hand calculation matching `computeTimeline`'s fold exactly. Code review: `RunOfShowSummary.vue` has no `useFormContext` import, driven purely by the `timeline` prop. Live add/remove/reorder (Playwright) updated the list with no stale entries and no console/page errors. |
| 2. Venue-overflow indicator, both variants, exact wording | Pass | (a) Default dataset: "Within venue hours (50 minutes to spare)." confirmed against hand calc (`venueCloseAbsolute 1500 - programEnd 1450 = 50`). (b) Reordering the band set (keeping total duration constant) left the banner and N unchanged ("50 minutes to spare" before and after), confirming the candor requirement that reordering cannot affect this indicator. Code review: `venueCloseAbsolute` is lifted via `liftToEventFrame` (the same helper `findCurfewBreaches` uses) before the subtraction; no raw clock-string compare. |
| 3. Per-kind count row, all six kinds, zero included | Pass | Manual: after removing the one speech item, the chip row correctly showed "0 speeches" alongside the other five populated chips. `countOccurrencesByKind` iterates the fixed six-branch list unconditionally (code review). |
| 4. Cake-before-dinner warning, amber, non-blocking | Pass | Reordered cake above the remaining dinner course: amber "Convention" pill plus "Cake cutting usually comes after every dinner course." rendered verbatim; submit stayed enabled (`meta.valid: true` in the values dump) throughout. |
| 5. Leading-break warning, amber, non-blocking | Pass | Moved a break to position 1: amber "Convention" pill plus "The program usually does not open with a break." rendered verbatim; independently of the cake warning present on the same screen (two separate pills, not shared). |
| 6. Submit disabled solely by curfew; conventions never affect `canSubmit` | Pass | With both a curfew breach and a cake-before-dinner warning present simultaneously, the submit helper line read only "Resolve the curfew violation on position 7 before saving." (no convention text), and the button was disabled. Earlier, after the single-move curfew fix, submit became enabled while the convention warning (still present) had no effect. Code review: `canSubmit = computed(() => meta.value.valid)` in `RunOfShowExample.vue` has no reference to `findCakeBeforeDinner`/`findLeadingBreak`; those two functions are called only from `RunOfShowRow.vue`, never from inside `curfewValidation()` or the hidden `curfewCheck` vehicle leaf's `computedProps`. |
| 7. Empty program, parallel summary empty state | Pass | Removing every item: builder shows the muted "No items yet..." panel, summary shows "The timeline appears here as you add items." plus the emerald "No amplified items yet, so nothing can breach the curfew." banner; no count-chip row, no timeline list present. Matches `#empty-program` exactly (screenshot taken). |

### Prototype comparison
Checked against `#summary-panel`, `#summary-variants`, `#row-states` (cake-before-dinner and leading-break cells), and `#empty-program`, in both light and dark mode (screenshots taken at each step). Banner wording, pill text, chip text, and layout all match. Clock times and count-chip text render at `text-slate-500`/`dark:text-slate-400`, resolving feature finding 4 (WCAG AA); light-mode value passes the 4.5:1 threshold, confirmed by reading the applied class, not just the architecture's stated intent.

### Deviation review: convention checks computed locally in `RunOfShowRow.vue`
Judged on the merits, not just as documented. The architecture's literal text routed the two convention checks through a host computed plus a new `conventionWarnings` setting; the developer's own account of why that was abandoned (a live `assertNoComputeLoop` trip via `seedOccurrencePresence` when removing the first program item, with an isolation test reverting only the `settings` identity to confirm causation) is a legitimate, reproducible correctness problem, not a preference call. Verified independently with Playwright, console attached: removing the first item in the full 7-item program, in both light and dark mode, produced zero page errors and zero console errors beyond an unrelated favicon 404. Also exercised: removing every item one by one down to empty, multiple reorders (single-move curfew fix, repeated cake/break moves), all clean. The resulting design keeps `RunOfShowSummary.vue` prop-only (ADR-4 intact, confirmed by its lack of any `useFormContext` import) and keeps `RunOfShowExample.vue`/`RunOfShowTemplate.vue` free of any convention-specific code, exactly as claimed. No ADR, prop contract, or public surface changed; the deviation stays inside this story's own files, is honestly flagged in Implementation notes with its own reasoning and verification method, and does not need to propagate to the feature spec.

### Process compliance
- `packages/core/src/` untouched (confirmed by `git status` and the zero-diff pipeline run); no changeset added, correctly.
- `specs/components.md`: no entry needed or added; docs-only page-local components (mirroring the checkout's own `SplitPaymentLedgerRow`/`OrderSummary` precedent) are out of that inventory's scope.
- No `docs/reference/*` change; correct, no public API delta exists.
- Library API rules: no new `packages/core` export; Vue camelCase used throughout new props (`programEndTime`, `venueOverflowMinutes`, `curfewBreaches`, etc.); reorder/validation channels are the already-sanctioned ones.
- No field or child named `order` introduced by this story's additions (ADR-6 holds; the counts/convention logic adds only derived computeds).
- No undocumented spec deviation: the one deviation found (convention checks local to `RunOfShowRow.vue` rather than host-computed/settings-propagated) is fully disclosed and justified in Implementation notes, reviewed above, and judged sound.

### Regression checks (ST-01/ST-02)
- Fresh-occurrence required validation: unaffected, no change to `seedOccurrencePresence` or the branches' `computedProps`.
- Curfew gate and single-move fix (ST-02 AC4): re-verified live. Moving the band set up once past the main course cleared the curfew breach, flipping the banner to "All amplified items end before the 23:00 curfew." and enabling submit, matching ST-02's claim.
- No regression in `RunOfShowSummary.vue`'s or `RunOfShowRow.vue`'s existing curfew rendering: the rose border/pill/marker all rendered correctly alongside the new amber convention styling with no visual or functional collision (disjoint branch sets, as the QA plan predicted).

### Verdict: pass

No blocking findings. All seven acceptance criteria verified with direct evidence, the compute-loop deviation is genuine and honestly documented, ADR-5/ADR-4 compliance holds, and ST-01/ST-02 behavior is intact.

This is the feature's third of four stories; ST-04 (narrative, walkthrough, cross-links, discoverability) remains open, so FEAT-008 itself should stay `in-progress`, not move to `done`, until ST-04 completes.

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field.
