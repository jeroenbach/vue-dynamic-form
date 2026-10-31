---
aside: false
pageClass: workout-plan-page
---

# Workout Plan Builder {#page-intro}

A good training session is not just a list of exercises, it is an order. You warm up before you load the bar. You work the big compound lifts while you are fresh, then move to the smaller isolation work. You finish with a cooldown. Shuffle those blocks and the session changes, even though every field in it stayed exactly the same. The order is the plan.

The builder below is a single repeatable ordered `choice`: one metadata tree, one template component, no bespoke engine code behind it. Each row is a block (warm-up, strength exercise, cardio, or cooldown) with its own fields. Move a block up or down and the live summary on the right recomputes immediately, and the convention checks further down flag or clear a violation from the reorder alone, with no field ever edited.

::: info Where these rules come from
The ordering conventions this page checks (warm up first, compound movements before isolation movements, no two high-intensity cardio blocks back to back, cool down last) follow common, published exercise-order guidance. A [systematic review and meta-analysis on resistance exercise order](https://pubmed.ncbi.nlm.nih.gov/32077380/) backs the general compound-before-isolation convention. One deliberate, published exception to that rule, pre-exhaustion training, is named and cited further down.
:::

::: warning Not training advice
This is a library demo, not a coach. The ordering conventions reflect common published convention, not a guarantee of a correct or safe program for any individual. Nothing you build here is saved anywhere: no account, no server, no history. It lives only in this tab's in-memory form state.
:::

## The plan, live {#live-form}

Add a block of each type with the buttons above the list, then use the up and down arrows to rearrange the plan. Every block is a live occurrence of the choice, not a static row: add a second Cardio block and it gets its own fields with its own validation (`plan.cardio[0].duration` and `plan.cardio[1].duration` are separate fields with separate errors). The seeded plan below already satisfies all five ordering conventions described in the next section, and every one of them is exactly one reorder away from breaking, so there is always something worth trying.

<WorkoutPlanExample />

Nothing typed here leaves this page. There is no backend, no `localStorage`, and no saved plan history: reload the page and the seeded plan comes back exactly as it started. As above, the ordering rules below are common published convention, not personalized or medical advice for any one person's training.

## The five ordering conventions {#violations}

The plan's summary rail checks five rules, every one of them about order rather than content:

- **Warm-up first.** If the plan includes a Warm-up block, it must be the first block. A plan with no Warm-up at all is never flagged for it: the rule only fires when a Warm-up exists and sits somewhere other than first.
- **Cooldown last.** If the plan includes a Cooldown / stretch block, it must be the last block, with the same logic as above: a plan with no Cooldown is never flagged for it either.
- **Compound before isolation.** No compound strength exercise may come after an isolation strength exercise anywhere in the plan, not only in the row directly above or below it.
- **No back-to-back same muscle group.** Looking only at the strength exercises in the plan (skipping over any warm-up, cardio, or cooldown block that happens to sit between them), two in a row must not target the same muscle group.
- **No adjacent high-intensity cardio.** Two cardio blocks that are both high intensity must not sit directly next to each other.

Every rule above only ever looks at order, never at whether a block exists in the first place, so every one of them is fixable by reordering alone. None of them block saving the plan: a violation shows as an amber warning on the affected row and in the summary rail's convention-checks list, and the plan stays saveable regardless.

::: warning One honest exception
The compound-before-isolation rule has a well-known, deliberate exception: **pre-exhaustion** training, where an isolation exercise is performed first to fatigue a target muscle, immediately followed by a compound movement that recruits it alongside other muscle groups. It is a real, published technique, not an oversight this page is pretending not to notice; see this [narrative review of pre-exhaustion training](https://pubmed.ncbi.nlm.nih.gov/35516415/) for the evidence behind it. If you are deliberately pre-exhausting a muscle, read the warning this page shows as informational, not as something that needs fixing.
:::

## One metadata tree, one template {#one-metadata-tree}

Everything above is declarative. The engine walks the `plan` metadata tree, classifies it as a repeatable ordered choice, and renders every occurrence through the one neutral template below it. Reordering, adding, removing, and every field's validation all come from that one tree; none of it is wired up by hand per block type.

## Metadata walkthrough {#metadata-walkthrough}

Since this page sets `aside: false`, there is no "On this page" outline. Use this short list instead:

- [The plan, a repeatable ordered choice](#the-plan-choice)
- [Four block types, four shapes](#block-branches)
- [Wiring a block into its row](#block-row-wiring)
- [The reorder control](#reorder-control)
- [The live summary module](#summary-module)
- [The convention checks](#convention-checks)
- [What It Demonstrates](#what-it-demonstrates)
- [How It Works](#how-it-works)
- [Related Source](#related-source)

### The plan, a repeatable ordered choice {#the-plan-choice}

The whole form is one node: `maxOccurs > 1` combined with a `choice`, in explicit selection mode, rendered in add order with a persisted `order` the reorder control can write:

<<< @/.vitepress/theme/components/WorkoutPlanExample.vue#plan-choice{ts} [WorkoutPlanExample.vue]

### Four block types, four shapes {#block-branches}

Each branch is a genuinely different block: two single-duration branches, a five-field strength branch, and a three-field cardio branch. All four declare `children`, which is what keeps `preserveOrder` active for the whole choice:

<<< @/.vitepress/theme/components/WorkoutPlanExample.vue#block-branches{ts} [WorkoutPlanExample.vue]

### Wiring a block into its row {#block-row-wiring}

The template routes every block, whatever its branch, through the same `block-choice-array-item` slot. The row component reads its own path and its parent choice's path straight off `fieldMetadata`, which is what lets one row component serve four differently shaped blocks:

<<< @/.vitepress/theme/components/WorkoutPlanTemplate.vue#block-row-slot{vue-html} [WorkoutPlanTemplate.vue]

### The reorder control {#reorder-control}

Moving a block up or down writes the two affected occurrences' `order` values directly through `useFormContext().setFieldValue`, the same technique the checkout's split-payment ledger uses. The engine's own rendering picks up the new order and re-sorts with no remount:

<<< @/.vitepress/theme/components/WorkoutBlockRow.vue#reorder-control{ts} [WorkoutBlockRow.vue]

### The live summary module {#summary-module}

A small, pure, synchronous module flattens every branch's occurrences into one ordered list and computes the total duration, the intensity profile, and the distinct muscle groups in play. It is read through vee-validate's own form context, not `computedProps`, so both the rail and each row can call it independently:

<<< @/.vitepress/theme/components/workoutPlanMath.ts#summary-module{ts} [workoutPlanMath.ts]

### The convention checks {#convention-checks}

The five rules described [above](#violations) live in one function, run against the same ordered block list the summary module builds:

<<< @/.vitepress/theme/components/workoutPlanMath.ts#convention-checks{ts} [workoutPlanMath.ts]

## What It Demonstrates

- A repeatable ordered `choice` (`maxOccurs > 1` with `explicitChoiceSelection`, `displayOrder: 'added'`, and `preserveOrder`) as the entire form, not a footnote behind a toggle
- Four block types with genuinely different field shapes, all routed through one shared row component
- Per-type occurrence caps via `maxOccursTotal` (at most one Warm-up, one Cooldown) alongside a shared choice budget
- Position badges from `globalIndex + 1`, and up/down reordering that writes the affected `order` values directly
- A live summary rail (duration, intensity profile, muscle coverage, convention checks) that recomputes on every add, edit, remove, or reorder
- Five cross-row, order-only convention checks, each one satisfiable or violable by a reorder alone, with no field ever edited

## How It Works

The plan is a `choice` with `maxOccurs > 1` and `explicitChoiceSelection`. Each Add button pushes a new occurrence into its own branch's field array; a number input passes its raw string value to `handleChange` instead of the native event, so the leaf stays a string in the form model, matching what a real `<input type="number">` holds before anything parses it. Reordering rewrites two occurrences' `order` values and the engine re-sorts with no remount. The summary and the convention checks both come from one pure module, `workoutPlanMath.ts`, read through vee-validate's `useFormContext` rather than `computedProps`, so the rail and every row can call the same functions without duplicating logic. Submit is gated only on the form's aggregate `meta.valid`; the five conventions are non-blocking warnings and never affect it. No new engine primitive is involved anywhere on this page.

## Related Source

- [WorkoutPlanExample.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/WorkoutPlanExample.vue) (the metadata tree and host component)
- [WorkoutPlanTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/WorkoutPlanTemplate.vue) (this page's own neutral template)
- [WorkoutBlockRow.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/WorkoutBlockRow.vue) (the order badge, up/down reorder, and remove row)
- [WorkoutPlanSummary.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/WorkoutPlanSummary.vue) (the sticky summary rail)
- [workoutPlanMath.ts](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/workoutPlanMath.ts) (the pure summary and convention module)
- [Choices](/examples/choices) demonstrates the repeatable ordered choice mechanics this page turns into one dedicated, whole-page showcase
- [Checkout](/examples/checkout#split-payment)'s split-payment section is the other place this shape already appears, as an opt-in finale behind a toggle rather than the point of the page
