---
id: FEAT-009
type: feature
status: design
approved_by: ""
epic: ""
---

<!-- epic: optional. Set to the parent EPIC-XXX id when this feature belongs to an
     epic; leave "" for a standalone feature. Features are never nested under the
     epic folder, they only reference it here (flat model). -->


# Feature: Docs example: a workout plan builder (repeatable ordered choice)

## Problem & goal

Docs readers evaluating `@bach.software/vue-dynamic-form` (developers comparing schema-driven form libraries, and template authors learning the library's own advanced patterns) need a dedicated example where the repeatable ordered choice shape (`maxOccurs > 1` combined with `choice`, plus the `displayOrder`/`preserveOrder`/`explicitChoiceSelection` metadata FEAT-002 shipped) is the whole point of the page, not a generic mechanics demo (`/examples/choices`) or an opt-in footnote behind a checkbox (`/examples/checkout`'s split-payment section).

This feature is one of two candidate pages researched for that slot (`research/ordered-choice-example/final-report.md`), the runner-up to a wedding/party run-of-show builder (FEAT-008, being specced concurrently). Both replace the cancelled trip-itinerary example (FEAT-007), which failed the acid test every candidate was scored against: can a reorder alone, with no field edit, fix or break a validation? FEAT-007's rows carried absolute dates, so order was derivable from the data and reordering degenerated into sorting.

This candidate, a workout plan builder, passes that test differently from FEAT-008: instead of a computed-schedule cascade (durations in, clock times out), its rules are position-class and adjacency constraints over an ordered list of exercise blocks, drawn from published coaching orthodoxy (warm-up first, compound movements before isolation movements, no two high-intensity blocks adjacent) rather than invented for the demo. Reordering the list is literally how a reader fixes or breaks those rules; no field edit does the same thing.

Success looks like: a published, linked docs page whose premise, structure, and payoff are "order matters, and here is exactly what reordering does" for a domain (building a workout) that an ordinary gym-goer, not just a developer, recognizes on sight, built as much as possible on the engine's existing primitives rather than bespoke Vue code, mirroring the checkout's proven reorder-and-recompute pattern end to end.

Jeroen picks between this feature and FEAT-008, or keeps both; this spec stands on its own regardless of that choice.

## Scope

### In scope

- One new VitePress docs page under `docs/examples/` (working slug `/examples/workout-plan`, final slug/title/placement per Open question 1), reachable from the `/examples/` sidebar and from `docs/examples/index.md`'s "Available Demos" list.
- Narrative copy establishing that the ordering rules below are published coaching conventions (warm-up before working sets, compound movements before isolation movements, most demanding work while freshest), not house rules invented for the demo, with sources cited the way the checkout cites Baymard/Shopify.
- One live, interactive metadata tree: a top-level repeatable ordered choice representing the ordered list of exercise blocks (`maxOccurs > 1`, `choice`, `explicitChoiceSelection: true`, `displayOrder: 'added'`, `preserveOrder: true` so the up/down reorder control has a writable persisted `order` field to move, mirroring the checkout's split-payment ledger exactly). Four branches with genuinely different fields:
  - **Warm-up**: duration.
  - **Strength exercise**: name, muscle group select, sets, reps, compound/isolation select.
  - **Cardio**: type, duration, intensity select.
  - **Cooldown / stretch**: duration.
- A reorder control per block (up/down buttons writing the two affected occurrences' `order` values through `useFormContext().setFieldValue`, mirroring `SplitPaymentLedgerRow.vue`'s technique exactly). Drag-and-drop is explicitly out of scope, so this is the only reordering affordance.
- Cross-row validation, order-only and reorder-fixable, surfaced through the checkout's hidden-vehicle-leaf-plus-`validateField` pattern (or a non-blocking derived flag; hard-block vs. warn per rule is Open question 2):
  - Warm-up must be the first block (boundary rule).
  - Cooldown/stretch must be the last block (boundary rule).
  - No compound-type strength exercise may appear after any isolation-type strength exercise, anywhere in the list (a position-class rule over the whole list, not just adjacent rows).
  - No two consecutive strength exercises share the same muscle group.
  - No two cardio blocks with the same high intensity are adjacent.
- One honest line of page copy next to the compound-before-isolation rule naming the pre-exhaustion technique as a deliberate, published exception to that rule (source: `research/ordered-choice-example/raw/library-fit.md` and `raw/recognizability.md`), the same candour the checkout uses for its own "ordering is UI-level, not XSD" caveat.
- A live summary side panel (model: `OrderSummary.vue`) showing, computed from the current list: total duration, an intensity profile (count or breakdown by block type and cardio intensity; exact presentation is Open question 5), muscle group coverage across strength exercises, and the current rule violations (naming which rule and which block).
- A pure, synchronous TypeScript math module (model: `splitPaymentLedgerMath.ts`) that computes the summary figures and the rule violations from the form's values, consumed by a template-level computed, not by `computedProps` or any new engine capability.
- A metadata-tree walkthrough below the live form, in the same style as the other advanced docs pages (VitePress `<<<` region excerpts, "What It Demonstrates", "How It Works", "Related Source").
- A short cross-link to `/examples/choices` (the generic mechanics this page specializes). Relationship and cross-linking to FEAT-008 (if built) and FEAT-006 (the shelved inbox-rules sibling) is Open question 6.
- Updates to `docs/examples/index.md` and `docs/.vitepress/config.ts`'s `/examples/` sidebar so the new page is discoverable.
- No Storybook story, matching the precedent already decided for this kind of example (FEAT-002's Q7: the docs example is the demonstration surface).

### Out of scope (explicit)

- Any change to `packages/core/src/`. The feature is expected to be buildable entirely on the engine's existing public surface, all of it shipped by FEAT-001/FEAT-002 (`explicitChoiceSelection`, `maxOccurs > 1`, `displayOrder`, `preserveOrder`, `globalIndex`, `insertionOrder`, and reordering via `useFormContext().setFieldValue`, exactly as the checkout's split-payment ledger already does). If architecture work surfaces a genuine engine gap, that is a feature-level finding to raise back into this spec, not something a story works around silently. No `packages/core/src/` change means no changeset (per `CLAUDE.md` step 6).
- Drag-and-drop libraries or interactions. Reordering is up/down buttons only.
- Persisting a workout plan anywhere outside the form's own in-memory/submitted values: no backend, no `localStorage`, no save/load of plans, no actual workout tracking or history.
- Real fitness coaching, personalized programming, or any claim of medical/training advice. The page states plainly that the ordering rules reflect common published convention, not a guarantee of a correct or safe program for any individual.
- A computed-clock cascade or any cascading per-row derived value. This candidate's live payoff is a duration/intensity/coverage summary and a violations list, not a running total that redistributes, which is FEAT-008's (or the checkout's) territory, not this one's.
- Exercise libraries, instructional content (form cues, videos, images), or any attempt to be a real workout-builder app.
- Internationalization of any field, and unit systems beyond one default (exact units, e.g. minutes for duration, is Open question 4).
- Any change to the existing `/examples/choices`, `/examples/checkout`, or FEAT-006/FEAT-008 pages or their components, beyond the one-directional cross-link described above.
- Building both this feature and FEAT-008 as the flagship ordered-choice showcase; Jeroen chooses which (or both) ships, per Open question 6.

## Functional overview

**Page structure.** One docs page: narrative intro establishing that the ordering rules are published coaching convention and that reordering alone can satisfy or violate them, the live form with its side panel, then the metadata walkthrough below, matching the structure of `/examples/checkout` and `/examples/advanced`.

**The exercise list.** The live form is a single repeatable ordered choice. An "Add block" control per block type (Warm-up / Strength exercise / Cardio / Cooldown) adds a new block at the end of the list. Each block row shows its own fields, a position badge (`globalIndex + 1`), and up/down/remove controls. Moving a block up or down writes the two affected occurrences' `order` values directly, which the engine's `renderedChoiceOccurrences` picks up and re-sorts with no remount.

**The live summary panel.** Next to the list, a sticky side panel shows the plan's total duration, an intensity profile, muscle group coverage, and the current rule violations by name and offending block. It recomputes on every add, remove, edit, or reorder.

**The payoff.** Because every validation rule above is order-only, a reader can trigger and clear a violation purely by pressing an up/down button: for example, moving a Cooldown block off the end, or reordering two strength exercises to create (or remove) a compound-after-isolation sequence, flips the summary's violations list and, depending on Open question 2, the field-level error state.

**Disclaimers.** The page states that the ordering rules are common published convention (with the pre-exhaustion exception called out honestly), not personalized or medical advice, and that no data is saved anywhere.

## Design (feature level)

Not filled at this stage. This is a docs-example feature with a visual surface (a VitePress page and its embedded Vue components), so it does not skip design; the ui-designer fills this section in the next phase, producing a cohesive `prototype.html` covering the live form, the reorder interaction, the violations/summary states, and light/dark, reusing the checkout's existing design system (`SectionCard`, `ChoiceArraySectionCard`, `SplitPaymentLedgerRow`'s badge/reorder/remove anatomy, `OrderSummary`'s sticky rail shell) the same way FEAT-006 did.

## Architecture (feature level)

Not filled at this stage. The architect fills this after design, following the same shape FEAT-001/FEAT-002/FEAT-006 used: component/composable plan against `specs/components.md` (expected: a page-local `WorkoutPlanExample.vue` / `WorkoutPlanTemplate.vue` / `WorkoutBlockRow.vue` / `workoutPlanMath.ts` quartet, mirroring the checkout's and FEAT-006's trios), public API impact (expected: none), backwards compatibility and changeset bump type (expected: none needed), data flow, ADR notes, and slicing seams.

## Adversarial review

Not filled at this stage. Filled by the adversarial-reviewer after architecture.

## Constraints & assumptions

- **Build on FEAT-002 (done), directly.** FEAT-002 already shipped every primitive this feature needs: `explicitChoiceSelection`, `maxOccurs > 1`, `displayOrder: 'added'`, `preserveOrder`, `globalIndex`, `insertionOrder`, and reordering through `useFormContext().setFieldValue` from a template-level component, exactly as `SplitPaymentLedgerRow.vue` and `splitPaymentLedgerMath.ts` already demonstrate end to end on the checkout page. No new engine capability is anticipated.
- **`preserveOrder` needs every branch to declare `children`.** All four branches here (Warm-up, Strength exercise, Cardio, Cooldown/stretch) carry at least a duration field, so none is childless; unlike FEAT-006's "Has attachment" branch, no Open question is needed on this point here, but the architect should confirm it explicitly when filling the Architecture section.
- **Engine improvements landed since this spec was drafted (UPDATE 2026-10-28: FEAT-010 "Engine validation gaps" and QUICK-004, both `done`). The architect must build on the fixed engine; none of the checkout's old workarounds may be carried forward. Historical write-ups in `specs/archive/FEAT-001-shopify-style-checkout-example/spec.md`'s Risks section and `specs/components.md`:**
  - The aggregate `meta.valid` is now live and trustworthy for group, choice, and array fields (FEAT-010 GAP 3): gate submit on `meta.valid` directly, as the rebuilt checkout now does. The old stuck-invalid quirk and the local-`computed`/`formIsComplete`/`handleSubmit`-bypass workarounds are history (the stale nested-choice registration behind the bypass was fixed separately by QUICK-004).
  - `computedProps` can now swap a field's `restriction`/`validation` and the engine rebuilds the ruleset and revalidates automatically (FEAT-010 GAP 2), so prefer rule swaps over manual `validateField` re-triggers where possible. If a hidden vehicle leaf with a `validateField` re-trigger is still the right shape for a cross-row rule, the checkout's `splitPaymentCoverage` remains valid prior art, but note its `createTransitionTracker()` helper was deleted in FEAT-010's rebuild and no longer exists; avoid pristine-load false errors by never validating an empty required field at mount, and `resetForm()` now resets explicit-choice selection state itself.
  - `resolve.dedupe: ['vee-validate']` is already set in the docs Vite config, so no new dedupe concern is expected.
- **No field or child may be named `order`.** `preserveOrder` writes an `order` child per occurrence and warns (dev mode) if a branch declares its own child named `order`; none of the four branches' field names listed in scope collide with this.
- **No Storybook story.** Matches the precedent FEAT-002 settled (Q7): the docs example itself is the demonstration surface for this kind of capability.
- **No public API or changeset impact expected.** Everything needed is already exported. If architecture finds otherwise, that is a feature-level amendment, not a silent story-level workaround.
- **Mutually exclusive with FEAT-008 as "the" flagship example, not necessarily with its existence.** This spec intentionally does not assume which (or both) of FEAT-008/FEAT-009 ships; see Open question 6.

## Open questions

Questions for Jeroen. Must be resolved before approval.

1. **Final slug, title, and nav placement.** Working slug `/examples/workout-plan`, working title "Workout Plan Builder". Where should it sit in the `/examples/` sidebar relative to Choices (the generic mechanics it specializes), Checkout, and FEAT-006/FEAT-008 if either or both also ship?

2. **Hard-block vs. warn, per rule.** The checkout's analogous hidden-field pattern (`splitPaymentCoverage`) hard-blocks submit. Here, five rules are listed (warm-up first, cooldown last, no compound-after-isolation, no consecutive same muscle group, no adjacent high-intensity cardio). Should all five block submission the same way, should some (e.g. the two boundary rules) block while others only warn, or should none block since a workout plan is not "invalid data" the way a checkout total is? This decides how many real `validation` rules versus derived display-only flags the architecture needs.

3. **Occurrence cap.** What should `minOccurs`/`maxOccurs` be on the top-level choice (e.g. `minOccurs: 0` so an empty plan is a valid, mandatory empty state; `maxOccurs` as a reasonable ceiling like the checkout's split-payment list)? Any per-branch cap (e.g. at most one Warm-up, at most one Cooldown) worth adding as its own rule, separate from the five order-only rules above?

4. **Units and locale.** Minutes assumed for every duration field (Warm-up, Strength exercise has none, Cardio, Cooldown), no imperial/metric toggle, no internationalization. Confirm, or specify otherwise.

5. **Does the intensity profile need a visual (e.g. a small bar or dot sequence), or does text/numeric suffice?** The research's live-summary sketch leaves this open; a text-only summary (counts and labels) is the simpler default and the working assumption carried into Design, but a small visual would raise the live-summary payoff criterion the research scored this candidate on.

6. **Relationship to FEAT-008 (wedding run-of-show) and FEAT-006 (inbox rules) in nav and copy.** FEAT-008 is the research's top-ranked candidate for the same page slot; FEAT-006 is a shelved sibling at `awaiting-discussion`. Should this feature proceed only if FEAT-008 is not chosen, should both ship as two instances of the same pattern (the way checkout and advanced coexist), and if both ship, should they cross-link each other? This is the central scope decision between the two sibling candidates and is not blocking FEAT-009's own review in isolation, but it determines whether this feature is built at all.

## Stories

Filled by scrum-master AFTER approval. Links to story folders with implementation order and dependency notes.
