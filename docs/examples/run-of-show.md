---
aside: false
---

# Run of Show Builder

One typed metadata tree, one template. The planner builds the evening's program as an ordered list of items (speeches, dinner courses, a band set, open dancing, cake cutting, breaks), and never types a clock time. Each row carries only a duration, and the page computes every row's start and end live from the event's start plus the sum of every duration above it: durations in, clock times out.

The payoff is the amplified-music curfew. Whether a band set or the open dance floor ends before the curfew depends only on what sits above it, so moving it earlier can fix a violation and moving a long dinner course above it can create one. Order changes the clock, and the clock decides what is valid.

::: tip What you are looking at
Every section below is rendered from one metadata tree through one neutrally styled template. Clock times are computed, never entered.
:::

::: warning Reordering is UI-level, not XSD
The display order and the per-row `order` value it writes are library behavior layered on the repeatable choice; they have no equivalent in `<xs:choice>` occurrence semantics. See [Choices](/examples/choices) for the generic mechanics this page specializes. The Inbox Rules Builder example (shipping separately) shows the same repeatable-ordered-choice shape from a different angle: there, order decides which rule fires; here, order decides the clock and whether the program is valid. Neither page is the primary one, they are equals with distinct angles on the same underlying mechanism.
:::

## The run of show, live {#live-form}

Three editable anchors (event start, amplified-music curfew, venue close) sit above the program. Add items with the buttons below the program card, then reorder them with the up/down arrows on each row: watch the clock chips and the curfew status move with them.

<RunOfShowExample />

One number in the summary panel never moves no matter how you reorder: the program's total length against venue close. Venue-close overflow is a duration total, not an order effect, so reordering alone can never fix it and can never break it either; only adding, removing, or shortening an item changes it.

## One metadata tree, one template {#one-metadata-tree}

Everything above is declarative. The engine walks the tree, classifies each node by its shape (a group, a repeatable choice, a leaf), and renders it through the neutral template below. The rest of this page walks through the metadata behind it, the same way the other advanced examples do.

## Metadata walkthrough {#metadata-walkthrough}

Since this page sets `aside: false`, there is no "On this page" outline. Use this short list instead:

- [The repeatable ordered choice](#the-repeatable-ordered-choice)
- [Template-driven reordering: slot routing](#slot-routing)
- [Reusing the add toolbar and rail chrome](#timeline-container)
- [Writing the two affected order values](#writing-order-values)
- [The clock cascade: a running fold](#clock-cascade)
- [The venue-close candor box](#venue-close-candor)
- [What It Demonstrates](#what-it-demonstrates)
- [How It Works](#how-it-works)
- [Related Source](#related-source)

### The repeatable ordered choice {#the-repeatable-ordered-choice}

The program is a `choice` with `maxOccurs > 1`: one occurrence per program item, six branches with genuinely different fields. `explicitChoiceSelection` means nothing renders until a branch is picked from the add toolbar. `displayOrder: 'added'` and `preserveOrder: true` are both required together: the first is what makes the engine's rendered occurrence order sort at all, the second is what gives the reorder buttons a persisted `order` child to write to. Cake cutting carries an optional `note` child purely so every branch is an object, which `preserveOrder` requires:

<<< @/.vitepress/theme/components/RunOfShowExample.vue#program-choice{ts} [RunOfShowExample.vue]

### Template-driven reordering: slot routing {#slot-routing}

Every branch declares `type: 'program'`, so all six route to the same pair of slots: `program-choice-array` for the container and `program-choice-array-item` for each row. The hidden curfew-check field, covered below, renders nothing of its own; its message reaches the reader entirely through the summary panel and the submit button:

<<< @/.vitepress/theme/components/RunOfShowTemplate.vue#program-slots{ts} [RunOfShowTemplate.vue]

### Reusing the add toolbar and rail chrome {#timeline-container}

The container reuses `ChoiceArraySectionCard` for the add-per-branch toolbar and the `used of maxOccurs` count tag, and owns the dashed empty state plus the vertical rail line that connects consecutive rows. Every active occurrence renders through the single passthrough slot at the bottom:

<<< @/.vitepress/theme/components/RunOfShowTimeline.vue#timeline-container{vue} [RunOfShowTimeline.vue]

### Writing the two affected order values {#writing-order-values}

Moving a row up or down swaps its own `order` with its immediate neighbor's, writing both through `setFieldValue(path, value, false)` so the write never re-triggers validation on its own. The engine re-sorts the rendered occurrences by the new values with no remount, so the row and the curfew check update from the same write:

<<< @/.vitepress/theme/components/RunOfShowRow.vue#reorder-functions{ts} [RunOfShowRow.vue]

### The clock cascade: a running fold {#clock-cascade}

Each row's start is the event start plus the sum of every duration above it in the rendered order; the end is the start plus its own duration. This is read live off the form's own values through `useFormContext`, never written back with `computedProps`, and it is structurally the same running fold the checkout's [split-payment ledger](/examples/checkout#split-payment) uses for a remaining amount instead of a clock. A breach is any amplified item (a mic'd speech, a band set, the dance floor) whose end falls after the curfew, lifted into the same frame so a curfew set past midnight is handled correctly:

<<< @/.vitepress/theme/components/runOfShowMath.ts#clock-cascade{ts} [runOfShowMath.ts]

### The venue-close candor box {#venue-close-candor}

The summary panel shows the program's total length against venue close as a plain indicator, never as a rule that blocks submit, because the total is a duration sum independent of order:

<<< @/.vitepress/theme/components/RunOfShowSummary.vue#venue-overflow{vue} [RunOfShowSummary.vue]

The default program ships with exactly one item past the curfew: the band set, which ends at 23:55 against a 23:00 curfew. Moving it up once, past the dinner course directly above it, brings its end back to 23:00 or earlier with no field edited, flipping the form from invalid to valid. That is the one documented move this page's default data is tuned around.

## What It Demonstrates

- A repeatable ordered `choice` (`maxOccurs > 1` combined with `choice`) as the page's entire subject, with six branch flavours sharing one row component via a common `type`
- Template-driven reordering: up/down buttons writing two `order` values through `useFormContext().setFieldValue`, with no remount
- A computed clock cascade read live off the form's values: durations in, clock times out, the same running-fold shape as the checkout's split-payment ledger
- A hard-blocking, order-sensitive curfew rule built on a hidden vehicle leaf plus a `validateField` re-trigger, the same pattern the checkout's split-payment coverage check uses
- Two non-blocking convention warnings (cake after dinner, no leading break) as derived display flags that never affect `meta.valid`
- A live summary panel: the timeline at a glance, the program's end versus venue close, curfew status naming offenders by position, and counts per item kind

## How It Works

The program choice declares `displayOrder: 'added'` and `preserveOrder: true` together, so the engine's rendered occurrence order is driven by a persisted `order` child rather than an in-memory-only insertion order. Each row's up/down control finds its order-neighbor and swaps the two `order` values with `setFieldValue(path, value, false)`, the same two-write pattern the checkout's split-payment rows use. The clock cascade and the curfew check both read the form's own `values` through `useFormContext` inside a `computed`, never through `computedProps`, so nothing derived is ever written back into submitted data.

The curfew itself is a single hidden leaf with no value of its own (`minOccurs: 0`, so it never fails on its own absence). Its `computedProps` touches every occurrence and every schedule anchor, then calls `validateField` to re-run its own validation closure, which reports a pass or a list of breaching positions. The submit button gates on the form's live aggregate `meta.valid` directly, with no manual bypass. The two convention checks (cake after dinner, no leading break) are plain functions over the same computed timeline, consulted only by each row for its own amber styling; they never touch a validation rule or `meta.valid`, so a reader can submit with a convention warning still showing.

## Related Source

- [RunOfShowExample.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/RunOfShowExample.vue) (the metadata tree)
- [RunOfShowTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/RunOfShowTemplate.vue) (the neutral template)
- [RunOfShowTimeline.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/RunOfShowTimeline.vue) (the program container)
- [RunOfShowRow.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/RunOfShowRow.vue) (one occurrence, reorder, curfew styling)
- [runOfShowMath.ts](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/runOfShowMath.ts) (the pure clock cascade and curfew/convention checks)
- [RunOfShowSummary.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/RunOfShowSummary.vue) (the live summary panel)
- [Choices](/examples/choices) for the repeatable ordered choice mechanics this page specializes
- [Checkout → Split payment](/examples/checkout#split-payment) for the other demonstration of the running-cascade pattern
- Inbox Rules Builder (shipping separately) for the sibling order-as-subject showcase: order decides which rule fires there, order decides the clock and its validity here
