# Raw notes: library fit (from repo knowledge, no web)

Every candidate below maps onto mechanisms that already ship (FEAT-001 explicit choice selection, FEAT-002 occurrence ordering) and onto template-level patterns the checkout example already proved. No candidate needs a packages/core change.

## Shared machinery (identical across candidates)

- Repeatable ordered choice: `maxOccurs > 1` + `choice` + `explicitChoiceSelection: true` + `displayOrder: 'added'` + `preserveOrder: true`, rendered through the `*-choice-array` / `*-choice-array-item` slot family (prior art: `SplitPaymentLedger.vue` / `SplitPaymentLedgerRow.vue`).
- Reorder via up/down buttons writing the two affected occurrences' order values through `useFormContext().setFieldValue` (prior art: `SplitPaymentLedgerRow.vue`).
- Cross-row validation via a hidden vehicle leaf whose `validation` closure reads the whole repeating section and whose `computedProps` re-triggers `validateField` on relevant changes, using `createTransitionTracker()` to avoid pristine-load false errors (prior art: checkout's `splitPaymentCoverage`).
- Pure synchronous math module consumed by both rows and the summary panel (prior art: `splitPaymentLedgerMath.ts`).
- Live summary side panel reading `values` (prior art: `OrderSummary.vue`).
- Engine rough edges already documented in the cancelled FEAT-007 spec's Constraints section carry over verbatim (stuck `meta.valid` on explicit choices, `resolve.dedupe: ['vee-validate']` already in docs config, flat branches avoid the stale nested-choice registration issue).

## Event run-of-show: the strongest mapping

- The per-row computed clock time (start time plus sum of preceding durations) is structurally the SAME cascade as the checkout ledger's running remainder: a running fold over ordered rows, displayed per row. The one pattern this page centers is therefore already proven in production docs code.
- The cancelled FEAT-007 prototype's vertical timeline design (rail, per-kind icon nodes, per-row position) transfers almost unchanged: rows become program items, and the computed clock time replaces the user-entered date as the row's time label. Part of the cancelled design investment is recoverable.
- Branch sketch (6 kinds, genuinely different fields): Speech/toast (speaker, duration select, mic yes/no), Dinner course (course select, duration), Band/DJ set (act name, duration; amplified by definition), Open dance floor (duration, music style), Cake cutting (near-childless: fixed short duration, optional note), Break/room turn (duration).
- Validation sketch: amplified items must end before the curfew time (clock-anchored, order-sensitive); cake cutting after all dinner courses (relative position); first item not a break (boundary); venue-close overflow as a summary indicator rather than a blocking rule (it is duration-, not order-, sensitive, and the page copy says so honestly).
- Top-level scalar leaves alongside the list: event start time, venue close time, music curfew time. Editable, so a reader can move the curfew and watch rows flip valid/invalid, a second interaction axis the checkout does not have.

## Workout plan builder

- Same machinery; adjacency and position-class rules (no compound after any isolation, no same muscle group consecutively, warm-up first, cool-down last) are simple list folds in the math module.
- No cascade visual; summary shows duration total, intensity profile, muscle coverage. Slightly weaker live payoff than computed clock times.

## Recipe builder

- Same machinery for kind-position rules. The memorable dependency rule (use-before-make) needs rows referencing other rows' outputs, i.e. ids or name-matching across occurrences, a complexity step the other candidates avoid. Risk of overdesign in a docs example.

## Drip campaign

- Day-N cascade identical in shape to the run-of-show clock cascade. Mechanically excellent, demoted on persona only.

## FEAT-006 inbox rules (benchmark)

- Already specced through chain 1 with prototype; routing simulation panel is its own pure-math module. Nothing wasted if it stays shelved for later use as a second, more technical example.
