---
id: FEAT-008
type: feature
status: design
approved_by: ""
epic: ""
---

<!-- epic: optional. Set to the parent EPIC-XXX id when this feature belongs to an
     epic; leave "" for a standalone feature. Features are never nested under the
     epic folder, they only reference it here (flat model). -->


# Feature: Docs example: a wedding/party run-of-show builder (repeatable ordered choice, center stage)

## Problem & goal

Docs readers evaluating `@bach.software/vue-dynamic-form` (developers comparing schema-driven form libraries, and template authors learning the library's own advanced patterns) can see the repeatable ordered choice shape (`maxOccurs > 1` combined with `choice`, plus the `displayOrder`/`preserveOrder`/`explicitChoiceSelection` metadata from FEAT-002) demonstrated generically on `/examples/choices`, and used as an opt-in finale on `/examples/checkout`'s split-payment ledger. Neither page makes order itself the visible product of the form.

This feature replaces the cancelled trip-itinerary example (FEAT-007, deleted). That example's rows carried absolute dates, so a row's position was derivable from its own data and reordering degenerated into sorting: nothing about the form's validity ever depended on the order a reader chose, only on the dates they typed. The replacement idea, researched in `research/ordered-choice-example/` and ranked the strongest candidate there, is a wedding/party run-of-show builder: a planner builds the evening's program as an ordered list of items (speeches, dinner courses, a band set, open dancing, cake cutting, breaks). Rows carry only durations, never absolute times. Each row's clock time is computed by the engine's template layer from the event's start time plus the sum of every duration above it, structurally the same running-fold cascade the checkout's split-payment ledger already proves in production docs code. An amplified-music curfew then makes reordering causally decisive: dragging a band set earlier can fix a violation, and pushing a long dinner course above it can create one. That is the acid test the trip itinerary failed and this example is built to pass.

Who this is for: docs readers scanning the examples list for "does this library handle order-sensitive, computed-schedule forms," and template authors who want a worked reference for the running-cascade-plus-cross-row-validation pattern before building their own.

Success looks like: a published, linked docs page whose premise, structure, and payoff are "order changes the clock, and the clock decides what is valid," built entirely on the engine's shipped primitives (the same inventory FEAT-006 already leans on: `explicitChoiceSelection`, `maxOccurs > 1` choice, `displayOrder: 'added'`, `preserveOrder`, `computedProps`, reordering via `useFormContext().setFieldValue`), with a working reorder-recomputes-the-timeline interaction and a cross-row curfew check that reuses the checkout's hidden-vehicle-leaf-plus-`validateField` technique. No `packages/core/src/` change and no changeset are expected; if architecture finds a genuine engine gap, that is a feature-level finding to raise back into this spec rather than a silent story-level workaround.

## Scope

### In scope

- One new VitePress docs page under `docs/examples/` (working slug `/examples/run-of-show`, final slug/title/placement per Open question 1), reachable from the `/examples/` sidebar and `docs/examples/index.md`'s "Available Demos" list.
- Narrative copy establishing "order changes the clock" before the live form: the planner edits a schedule of durations, not times, and the page computes every row's start/end live. A short reveal that the whole thing is one metadata tree plus one template, matching the other advanced examples' structure.
- Three top-level, editable scalar leaves alongside the repeatable list: event start time, venue close time, amplified-music curfew time. Editable so a reader can move the curfew and watch rows flip between valid and invalid, an interaction axis the checkout's split-payment ledger does not have.
- One live, interactive metadata tree: a repeatable ordered choice representing the evening's program (`maxOccurs > 1`, `choice`, `explicitChoiceSelection: true`, `displayOrder: 'added'`; whether `preserveOrder: true` is also used depends on Open question 2, mirroring FEAT-006's Q1/ADR-1 finding that a working reorder control needs `preserveOrder: true` because the ephemeral `insertionOrders` tier has no write channel a template can use). Each occurrence is one program item. Six branches with genuinely different fields (exact field names are architecture's to finalize; shape fixed here per Open question 3):
  - **Speech / toast**: speaker name, duration (select), on the mic (yes/no).
  - **Dinner course**: course (select: starter/main/dessert), duration.
  - **Band / DJ set**: act name, duration. Amplified by definition (no separate "amplified" toggle; the branch itself implies it).
  - **Open dance floor**: duration, music style. Amplified by definition.
  - **Cake cutting**: near-childless branch (a fixed short duration, an optional note), the same shape the checkout exercises for its childless express/home-delivery/PayPal branches, with the same `preserveOrder`-needs-`children` tension FEAT-006 flagged for its own childless branch; see Open question 2.
  - **Break / room turn**: duration only.
- Each row displays its own computed start and end clock time: event start plus the running sum of every duration above it. This is the same running-fold cascade as the checkout's split-payment remainder, read live off the form's own reactive values, not `computedProps`.
- A reorder control per item (up/down buttons writing the two affected occurrences' order values through `useFormContext().setFieldValue`, mirroring `SplitPaymentLedgerRow.vue` exactly). Drag-and-drop is out of scope (see below).
- Cross-row validation, via the checkout's hidden-vehicle-leaf-plus-`validateField`-retrigger pattern (prior art: checkout's `splitPaymentCoverage`):
  1. **Curfew rule (the star, hard-blocking)**: every amplified item (band/DJ set, open dance floor, a mic'd speech) must end before the curfew. Whether it does depends only on the summed duration of everything above it, so this is genuinely order-sensitive and reorder-fixable, not merely order-flavored.
  2. **Cake after dinner**: cake cutting must come after every dinner course. Whether this is a hard block or a warning is Open question 4.
  3. **Boundary**: the program's first item is not a break. Whether this is a hard block or a warning is Open question 4.
  4. **Venue-close overflow**: shown only in the summary panel as an indicator, never as a blocking rule, because total program length is order-independent (reordering alone can never fix or break it). The page states this plainly, mirroring the checkout's "Ordering is UI-level, not XSD" candor box.
- A live summary side panel (model: `OrderSummary.vue`): the computed evening timeline (every item's clock time at a glance), the program's end time versus venue close, curfew status naming the offending item(s) by position, and counts per item kind.
- A metadata-tree walkthrough below the live form, matching the other advanced docs pages' structure (VitePress `<<<` region excerpts, "What It Demonstrates", "How It Works", "Related Source").
- A short cross-link to `/examples/choices` (the generic mechanics this page specializes) and to `/examples/checkout`'s split-payment section (the other existing demonstration of the running-cascade pattern). Per Open question 5, the page copy should also state its relationship to FEAT-006's inbox-rules-builder example (the other ordered-choice showcase, still at `awaiting-discussion`) so a reader who finds both understands why two exist and does not read them as redundant. This is one-directional: it does not reopen or modify FEAT-002, FEAT-001, or FEAT-006.
- Updates to `docs/examples/index.md` and `docs/.vitepress/config.ts`'s `/examples/` sidebar so the page is discoverable.
- No Storybook story, matching the precedent FEAT-002 and FEAT-006 both settled: the docs example is the demonstration surface for this shape.

### Out of scope (explicit)

- Any change to `packages/core/src/`. The example is expected to be buildable entirely on the engine's existing public surface. If architecture surfaces a genuine engine gap, that is a feature-level finding to raise back into this spec, not something a story works around silently.
- Drag-and-drop libraries or interactions. Reordering is up/down buttons only.
- Persisting the program anywhere outside the form's own in-memory/submitted values: no backend, no `localStorage`, no save/load.
- Multi-day events, time zones, or any locale beyond what Open question 6 settles for time display.
- A second, independently clock-anchored hard rule (e.g. "the kitchen serves the main course no later than X") beyond the curfew rule. The research's final report flags this as the natural follow-up if Jeroen wants two hard clock rules instead of one; left for a future amendment, not built here.
- Guest list, seating, catering logistics, budget, or any wedding-planning concern beyond the ordered program itself.
- Internationalization of any field.
- Visually mimicking any specific event-planning product. The example's own neutral docs template styling is used, the same posture the checkout and inbox-rules examples take.
- Any change to the existing `/examples/choices`, `/examples/checkout`, or FEAT-006 inbox-rules pages/specs, beyond the one-directional cross-links described above.

## Functional overview

**Page structure.** One docs page: narrative intro establishing "durations in, clock times out, and the curfew makes order decisive," the live form with its summary panel, then the metadata walkthrough below, matching `/examples/checkout` and `/examples/advanced`.

**The top-level schedule leaves.** Three editable scalar fields above the program list: event start time, venue close time, amplified-music curfew time. Changing any of them live-recomputes every row's clock time and the curfew check, without touching the program's order or content.

**The program list.** The live form is a single repeatable ordered choice. An "Add item" control per item kind adds a new item at the end of the list. Each row shows its kind, its own fields, its computed start/end clock time, a position badge, and up/down/remove controls. Moving an item up or down writes the two affected occurrences' order values directly (the `SplitPaymentLedgerRow` technique), which the engine's `renderedChoiceOccurrences` re-sorts with no remount.

**The live summary panel.** Next to the program list (stacking below it on narrow screens), the panel shows the computed timeline end time versus venue close, curfew status naming any offending item(s) by position, and a per-kind item count. It re-renders live on every add, remove, edit, or reorder.

**The curfew payoff.** This is the page's whole point: moving an amplified item earlier in the list, or moving a long item above it, visibly flips that item's end time across the curfew line and its validation state with it, with no field edited.

**Disclaimers.** The page states plainly that venue-close overflow is a duration total, not an order effect, and that reordering alone can never fix or break it, so readers do not mistake it for another order-sensitive rule.

## Design (feature level)
Filled by ui-designer.

## Architecture (feature level)
Filled by architect.

## Adversarial review
Filled by adversarial-reviewer at feature level.

## Constraints & assumptions

- **Build on FEAT-002 (done) and the checkout's (FEAT-001, done) proven patterns directly.** FEAT-002 shipped `explicitChoiceSelection`, `maxOccurs > 1` choice, `displayOrder: 'added'`, `preserveOrder`, `globalIndex`, `insertionOrder`, and reordering through `useFormContext().setFieldValue`. The checkout's `SplitPaymentLedgerRow.vue` and `splitPaymentLedgerMath.ts` already demonstrate the running-cascade-plus-reorder pattern end to end; this feature's clock cascade is the same fold shape with a different unit (time instead of money).
- **Carry over the cancelled FEAT-007 prototype's design investment where it still fits.** Its vertical timeline design (rail, per-kind icon nodes, per-row position) was built for rows with absolute dates; here the computed clock time replaces the user-entered date as the row's time label, so the visual design is expected to transfer largely unchanged even though the underlying data model is the opposite of FEAT-007's.
- **Engine improvements landed since this spec was drafted (UPDATE 2026-10-28: FEAT-010 "Engine validation gaps" and QUICK-004, both `done`). The architect must build on the fixed engine; none of the checkout's old workarounds may be carried forward:**
  - The aggregate `meta.valid` is now live and trustworthy for group, choice, and array fields (FEAT-010 GAP 3), so submit gates on `meta.valid` directly, as the rebuilt checkout now does. The old stuck-invalid quirk and its local-`computed`/`formIsComplete`/`handleSubmit`-bypass workarounds are history.
  - For a childless branch, the engine now has a first-class `presenceValue` marker (FEAT-010 GAP 1), replacing the checkout's old hand-written `computedProps` marker. But it is a no-op on `maxOccurs > 1` branches, so it does not apply to this feature's repeatable choice: cake cutting must get a real child field (which `preserveOrder` requires anyway), see Open question 2 and FEAT-006's ADR-2 for the same conclusion.
  - The stale nested-choice registration that could outlive a branch's unmount is fixed (QUICK-004); flat branches are still the simpler shape, but this is no longer a correctness constraint.
  - `computedProps` can now swap a field's `restriction`/`validation` and the engine rebuilds the ruleset and revalidates automatically (FEAT-010 GAP 2). Prefer that over manual `validateField` re-triggers where it fits; the checkout's `splitPaymentCoverage` hidden vehicle leaf (which still re-triggers `validateField` from `computedProps` for its cross-row check) remains valid prior art for the curfew rule. The checkout's `createTransitionTracker()` helper was deleted in FEAT-010's rebuild and no longer exists; `resetForm()` now also resets explicit-choice selection state itself, so no reset bookkeeping is needed.
  - `docs/` already has `resolve.dedupe: ['vee-validate']` configured, needed for any page using vee-validate composables directly (as the hidden curfew vehicle leaf and the reorder controls do).
- **`preserveOrder` needs every branch to declare `children`.** Per `specs/components.md` and `docs/examples/choices.md`, a single scalar/childless branch in a repeatable explicit choice disables `preserveOrder` for the whole choice. This is directly relevant because cake cutting and break/room-turn are the thinnest branches here; see Open question 2.
- **The curfew rule is the one rule that must be hard-blocking for the acid test to hold.** The research's ranking depends on at least one rule being genuinely order-sensitive and reorder-fixable with real validation consequence, not just a summary indicator. Rules 2 and 3 (cake after dinner, no leading break) are domain conventions, not safety or legal constraints like the curfew; whether they also hard-block is Open question 4, but the curfew itself should not be softened to a warning without reopening this spec.
- **No Storybook story.** Matches the precedent FEAT-002 and FEAT-006 both settled.
- **No public API or changeset impact expected.** Everything needed is already exported. If architecture finds otherwise, that is a feature-level amendment, not a silent story-level workaround.
- **Does not depend on FEAT-006.** FEAT-006 (inbox rules builder) is a sibling example of the same underlying shape (repeatable ordered choice as the page's subject) built independently; this feature should not block on its approval or its open questions, only cross-reference it in page copy per Open question 5.

## Open questions

Questions for Jeroen. Must be resolved before approval.

1. **Final slug, title, and nav placement.** Working slug `/examples/run-of-show`, working title "Run of Show Builder" (alternatives: "Plan the Reception", "Event Timeline Builder"). Where should it sit in the `/examples/` sidebar relative to Choices (the generic mechanics it specializes), Checkout (the other running-cascade demonstration), and FEAT-006's inbox-rules page once that lands? The live sidebar order today is: Overview, Basic Form, Arrays And Groups, Choices, Dynamic Fields, Validation, Wizard, Checkout, Advanced Wizard.

2. **Does cake cutting (and/or break/room-turn) need a trivial child field so `preserveOrder` can apply to the whole choice?** A working reorder control needs `preserveOrder: true` (the ephemeral `displayOrder: 'added'` tier alone has no write channel a template can use, per FEAT-006's ADR-1 finding on the identical mechanism). `preserveOrder` requires every branch to declare `children`; a single childless branch disables it for the whole choice. Cake cutting is described as "near-childless" (an optional note could satisfy this) and break/room-turn currently has only a duration, which is already one child field, so it likely already qualifies. Confirm: does cake cutting get a real child field (e.g. an optional note, as sketched) purely so the branch is an object, or is session-only ordering (no `preserveOrder`) acceptable here?

3. **Exact field composition per branch.** The six branches and their fields are sketched in Scope above, drawn directly from the research. Confirm the field list per branch (names, types, option lists for selects) before design/architecture proceeds, in particular: the duration select's exact increments (5/10/15/20 minutes was the research's sketch for speeches; should the same fixed increments apply to every duration field, or should some branches use a free-entry number of minutes instead) and whether "on the mic yes/no" on the speech branch is itself what makes a speech "amplified" for the curfew rule, or whether every speech counts regardless.

4. **Which cross-row rules hard-block submission versus only warn?** The curfew rule (rule 1) is the star and is assumed hard-blocking per Constraints & assumptions above. Cake-after-dinner (rule 2) and no-leading-break (rule 3) are domain conventions rather than safety constraints: should they hard-block submit (mirroring the checkout's blocking coverage gate) or only show a non-blocking warning badge on the affected row (the research's own framing calls them "conventions rather than laws")? This determines whether they need a real `validation` rule plus hidden vehicle leaf, or only a derived display flag.

5. **How should the page copy frame its relationship to FEAT-006 (inbox rules builder) and to `/examples/choices`?** Both this feature and FEAT-006 showcase the same repeatable-ordered-choice-as-the-subject shape with a live side panel of consequences, researched and built independently (this feature's research explicitly treats FEAT-006 as the technical/benchmark sibling, not a predecessor). Should the two pages cross-link each other once both are published, should one be positioned as the primary/flagship ordered-choice showcase (linked from `/examples/choices`) with the other secondary, or are they independent enough that no coordination is needed? FEAT-006 is itself still at `awaiting-discussion`; this question does not block this feature, only its final page copy.

6. **Time format and locale for the clock displays.** Event start, venue close, curfew, and every computed row clock time need a display format (24-hour vs 12-hour with AM/PM, which locale's conventions). The example has no stated audience locale; confirm a default (e.g. 24-hour, no locale-specific formatting, consistent with "No internationalization" in Out of scope) before design proceeds.

7. **Occurrence cap for the program list.** What should `minOccurs`/`maxOccurs` be on the repeatable choice (e.g. `minOccurs: 0` so an empty program is a valid state, matching FEAT-006's mandatory-empty-state precedent, and some reasonable `maxOccurs` such as 20)? Needed before architecture sizes the add-toolbar budget UI.

## Stories
Filled by scrum-master AFTER approval. Links to story folders with implementation order and dependency notes.
