---
id: ST-02
type: story
feature: FEAT-006
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Reorder controls and the live test-inbox routing payoff

## Decided without Jeroen (research)

Settled from research during adversarial review, not reviewed by Jeroen. Override freely.

- Open question (docs vitest) → add a minimal pure-module vitest setup to `docs/` so AC6's unit tests run (see the DECIDED (research) entry under the QA plan's Open questions)

## Sequencing gate
Inherited from ST-01: this story must not implement until FEAT-010 is `status: done` (see ST-01's Sequencing gate section for the full rationale and the status check). This story adds no new submit-gate logic of its own; it only extends ST-01's host and row files.

## Functional

### User story
As a docs reader exploring the inbox rules builder example, I want to reorder rules with up/down buttons and watch a live side panel of six fixed test-inbox messages re-route in real time as the order changes, so that I can see that rule order is causally decisive, not cosmetic.

### Acceptance criteria

1. Given `preserveOrder: true` is enabled on the `rules` choice and at least two occurrences exist, When the down arrow on a rule (or the up arrow on its display-neighbor) is clicked, Then the clicked rule and its display-neighbor swap their persisted `order` values via two `setFieldValue` calls, and the engine's `renderedChoiceOccurrences` re-sorts with no remount.
2. Given the up control on the first displayed rule and the down control on the last displayed rule, When rendered, Then both are disabled (30% opacity, never hidden) regardless of rule count, including the boundary case of exactly one rule, where both controls on that single row are disabled simultaneously.
3. Given the fixed six-message test inbox and the rules in their current displayed order, When the panel renders, Then each message shows either an emerald "matched" badge naming the destination and the catching rule's displayed position ("rule N"), or a dashed muted "No rule matched, stays in Inbox" badge, computed by `routeInbox(collectRules(values.rules), TEST_INBOX)`.
4. Given the six-message test inbox's authored content (newsletter digest, billing invoice with attachment, personal reply, social notification, large export with attachment, unknown sender), When routed against the rules in their initial authored order, Then exactly three messages match a rule and three do not, and the invoice message is caught by an earlier rule that a later rule would also have caught (the reorder teaching case).

   PROPOSED (adversarial review): "the rules in their initial authored order" is a representative `Rule[]` fixture (the prototype's four rules, each with an `order` field), not live host state. ST-01 AC1 and the checkout precedent (`CheckoutFormExample.vue` seeds no split-payment occurrences) establish that this page loads with no rules; neither ST-01 nor ST-02 seeds a demo rule set. So AC4 is a unit test over that fixture, and the on-page 3/3 split (plus the AC5 payoff) is reproduced by the reader/tester adding those rules, per manual verification item 4. If the flagship payoff should instead be visible on load, seeding a demo rule set is a feature/ST-01 amendment (it changes what the docs reader sees on arrival), outside ST-02's scope; flagged here, not blocking this story.
5. Given a "Subject contains Invoice" rule positioned below a "Has attachment" rule, When the "Subject contains Invoice" rule is moved above it via its up arrow, Then the invoice message's routing badge changes destination and catching-rule reference live, with no page reload, matching `#reorder-payoff`'s before/after.
6. Given the `matches(rule, mail)` semantics stated in the feature's Functional overview (From sender: case-insensitive equality, or `@domain` suffix match; Subject contains: case-insensitive substring; Larger than: strictly greater than the threshold after KB/MB-to-byte conversion, 1 KB = 1024 bytes, 1 MB = 1024 KB; Has attachment: the message's own attachment flag; an empty/unfilled rule value matches nothing), When `inboxRoutingMath.ts`'s unit tests exercise each predicate, Then every stated case passes exactly.
7. Given adding, removing, or editing any rule, When the change commits to the form's `values`, Then the routing panel recomputes live with no manual refresh, since the host computed reads `values` directly (ADR-4) and never `computedProps`.
8. Given zero rules (the empty state inherited from ST-01), When the panel renders, Then all six messages show "No rule matched, stays in Inbox."

### Edge cases
- Removing a rule that was the sole match for a message re-renders that message as unmatched on the next recompute.
- With exactly two rules, both boundary disables (first rule's up, second rule's down) are exercised from each row's own perspective, not only from one row.
- "Has attachment" always evaluates the message's own attachment flag; it is not sensitive to an empty rule-side value the way the other three condition types are, since it has no condition value of its own.
- Reordering while the add toolbar's budget is exhausted (20 occurrences) still works: reorder and the budget cap are independent gates.

### Out of scope
- Unreachable-rule detection and its badge (ST-03).
- Narrative prose, metadata walkthrough, and nav/sidebar discoverability (ST-04).
- Any change to the condition/action field shapes or validation ST-01 already built.

## Design reference
Implements `../../prototype.html#test-inbox` (the inbox rail, all six messages, both badge treatments), `../../prototype.html#reorder-payoff` (the before/after proof), and the reorder-boundary chevron-disabled states in `#rule-states` that ST-01 deferred. No new design language: reuses the `SplitPaymentLedgerRow` up/down chevron treatment and the `OrderSummary` card shell as the inbox rail's model, per the feature's component mapping.

## Architecture reference
Builds, extending ST-01's files:
- `inboxRoutingMath.ts` (new, pure, framework-free, mirroring `splitPaymentLedgerMath.ts`): `collectRules(values)` flattens the four branch arrays under `rules` into one `Rule[]` ordered by each occurrence's persisted `order`; `matches(rule, mail)` implements the Functional overview's semantics verbatim; `routeInbox(rules, inbox)` applies first-match-wins per message. `findUnreachableRules` is declared in this same file by ST-03, not this story, but this story's `collectRules`/`matches` are the ground truth ST-03's function builds on.
- `TestInboxPanel.vue` (new, sticky rail): renders the `routedInbox` prop (the six fixed `TEST_INBOX` messages plus each one's routing badge). Takes routed data as a prop computed in the host, mirroring how `OrderSummary` takes host-computed props rather than reading the form itself.
- `InboxRulesExample.vue` (extends ST-01's file): adds the `TEST_INBOX` constant (the six fixed, fictional messages per the feature's Q6 decision), flips the `rules` choice's `preserveOrder` to `true` (ADR-1; every branch already has `children` via the action block, so no metadata reshape is needed), and adds the `routedInbox = routeInbox(collectRules(values.rules), TEST_INBOX)` computed, rendering `<TestInboxPanel>` beside `<DynamicForm>`.
- `InboxRuleRow.vue` (extends ST-01's file): adds the ghost up/down chevrons, each writing the two affected occurrences' `order` values via `useFormContext().setFieldValue(path.order, n, false)`, byte-for-byte the `SplitPaymentLedgerRow` technique, and the boundary-disable logic (first/last displayed occurrence).

  PROPOSED (adversarial review): because a pure vitest setup is now being added (see the Open-questions decision), extract the reorder decision itself into a pure helper in `inboxRoutingMath.ts`, e.g. `planReorderSwap(rules, targetKey, direction) => [{ key, order }, { key, order }] | null` (null at a boundary), operating on the order-sorted `collectRules` output so it correctly finds the cross-branch neighbor even when `order` values are non-contiguous after removals. `InboxRuleRow.vue` stays a thin caller that maps the returned pair to two `setFieldValue(path.order, n, false)` calls and derives the boundary-disable state from a null result. This matches ADR-4's purity posture (the component holds no reorder arithmetic) and lets the story's core new interaction be unit-tested without jsdom, satisfying CLAUDE.md's "functional changes carry tests".

No `packages/core/src/` change and no changeset: `preserveOrder`, `renderedChoiceOccurrences`, `globalIndex`, and `useFormContext().setFieldValue` are all already exported and already proven end to end by the checkout's split-payment ledger.

Dependencies: depends on ST-01 (extends `InboxRulesExample.vue`, `InboxRulesTemplate.vue`'s slots, and `InboxRuleRow.vue`). ST-03's `findUnreachableRules` depends on this story's `collectRules`/`matches`; ST-04's region excerpts depend on this story's finished reorder/routing behavior to describe accurately.

## QA plan

### Infrastructure finding (blocks automated coverage of AC6 as written)

`docs/` is excluded from the pnpm workspace (`pnpm-workspace.yaml`: `!docs`), has no `vitest`, `@vue/test-utils`, or `jsdom` devDependency, no vitest config, and no test script. `pnpm test` / `pnpm ci` / `pnpm -r ci:test:coverage` all run `pnpm -r ...`, which only reaches workspace packages (`packages/core`, `packages/element-plus`), never `docs/`. Checked directly: there is no existing test file for `splitPaymentLedgerMath.ts` anywhere in the repo, so "mirror how `splitPaymentLedgerMath.ts` is tested" has no precedent to mirror; that module is pure and testable in principle but is not actually unit-tested today. This means AC6, as written, cannot be satisfied by an automated test with the repo's current tooling.

**Rewrite proposal (infrastructure addition, not a scope change):** add a minimal `vitest` devDependency and a `docs/vitest.config.ts` (or a `test` block in a shared docs Vite config) plus a `"test": "vitest run"` script in `docs/package.json`, scoped to pure `.ts` modules only (no `jsdom`/`@vue/test-utils` needed since `inboxRoutingMath.ts` and `splitPaymentLedgerMath.ts` are framework-free). Add a root convenience script (e.g. `"docs:test": "pnpm --prefix docs test"`) so it is runnable, and note in `CLAUDE.md`'s "Before Every Push" list that this new script exists and is not covered by `pnpm -r ci:test:coverage`'s workspace scope, so it must be run and checked separately until/unless `docs/` joins the workspace. This is a developer-phase decision (adding tooling, not library code), flagged here because without it AC6 has no automated test and the acceptance criterion should be rewritten to "verified manually against the stated semantics table" if the developer declines to add the infrastructure. The QA plan below assumes the infrastructure is added, since the module is pure, cheap to test, and the whole point of keeping it framework-free (ADR-4) is that it should be testable without a form; if the developer instead declines, every row below marked (automated) becomes a manual check against the same semantics table in `#manual-verification`.

RESOLVED — DECIDED (research), adversarial review: the infrastructure is added (minimal pure-module vitest in `docs/`), not declined; the "manual fallback" branch no longer applies. See the full decision, rationale, and sources under "Open questions for Jeroen" below.

### Acceptance criterion to test mapping

| AC | Behavior | Test | Notes |
|---|---|---|---|
| 1 | Up/down swap writes two `order` values via `setFieldValue`; engine re-sorts with no remount | **Engine mechanism**: already regression-guarded by `packages/core/src/components/__tests__/DynamicFormItemChoice.logic.test.ts` and `DynamicFormItemChoice.analytics.test.ts` (`preserveOrder — render counts` describe block proves no-remount re-sort). **This story's own neighbor-selection + order arithmetic**: unit-tested via the proposed pure `planReorderSwap` helper in `inboxRoutingMath.test.ts` (see the architecture reference's PROPOSED note), including non-contiguous `order` values and boundary (null) cases. The remaining Vue glue (two `setFieldValue` calls fire, no remount) is covered by the engine tests above plus `#manual-verification` item 1 | Moving the reorder decision into the pure module removes the need for a jsdom component test to cover the correctness-bearing logic; the pure-module infra from the decision above suffices |
| 2 | Boundary disables: first row's up, last row's down, both disabled on a single row, 30% opacity, never hidden | Manual, `#manual-verification` item 2 (no component test harness in docs) | Visual assertion (opacity, not hidden) is inherently a rendered-DOM/visual check; Playwright screenshot in both counts (1 rule, 2 rules, 5+ rules) |
| 3 | Panel shows emerald "matched (destination, rule N)" or dashed muted "no match", computed by `routeInbox(collectRules(values.rules), TEST_INBOX)` | **Routing correctness (automated)**: `inboxRoutingMath.test.ts` — `routeInbox` returns the right destination and catching rule index for each of the 6 fixed messages against a known rule list. **Badge rendering**: manual, `#manual-verification` item 3 | Split the pure computation (automatable) from the badge template (not automatable here) |
| 4 | Fixed six-message inbox: exactly 3 match / 3 do not, invoice caught by an earlier rule a later rule would also catch | `inboxRoutingMath.test.ts` — one test asserting the full `routeInbox(initialRules, TEST_INBOX)` result against the authored expectation (3 matched, 3 unmatched, invoice's catching rule is the earlier one) | `initialRules` is a representative fixture built with explicit `order` fields (the prototype's four rules), **not** live host state (the page loads empty per ST-01 AC1; see AC4's PROPOSED note). Exercise `collectRules` here so the asserted sequence comes from each rule's `order` field, not array/file declaration order |
| 5 | Moving "Subject contains Invoice" above "Has attachment" flips the invoice's badge live, no reload | Manual, `#manual-verification` item 4 (the reorder-payoff proof is a live interaction in the browser); the underlying math transition (`routeInbox` before/after the swap) is covered as a pure case in `inboxRoutingMath.test.ts` (`#reorder-payoff` scenario: same two rules, two `Rule[]` orderings, assert the invoice's catching rule and destination change between the two calls) |
| 6 | `matches(rule, mail)` semantics: From sender (equality or `@domain` suffix, case-insensitive), Subject contains (case-insensitive substring), Larger than (strict `>`, KB/MB to bytes, 1 KB = 1024 B, 1 MB = 1024 KB), Has attachment (own flag), empty rule value matches nothing | `inboxRoutingMath.logic.test.ts` — one `describe` per condition type, covering: exact match, case-insensitivity, `@domain` suffix match and non-match (From sender); substring match, case-insensitivity, no-match (Subject contains); boundary at exactly the threshold (must NOT match, strict `>`), 1 byte over (must match), KB-to-bytes and MB-to-bytes conversion each tested once (Larger than); attachment true/false, and that it ignores the rule's own value entirely (Has attachment); and a final `describe('empty rule value')` covering each condition type's empty/unfilled rule value matching nothing | This is the ground-truth table from the feature's Functional overview; every stated case must have its own test, not just one happy-path per type |
| 7 | Host computed reads `values` directly (ADR-4), not `computedProps`; routing recomputes live on add/remove/edit | Manual, `#manual-verification` item 5 (architecture constraint; a static code read confirms no `computedProps` is used for `routedInbox`, but the live-recompute behavior itself is a running-app observation) | Add a lint-free, test-free static check as part of code review: `InboxRulesExample.vue`'s `routedInbox` computed must read `useDynamicForm().values` and call `collectRules`/`routeInbox`, never register a `computedProps` closure |
| 8 | Zero rules: all six messages show "No rule matched, stays in Inbox" | `inboxRoutingMath.test.ts` — `routeInbox([], TEST_INBOX)` returns all six messages unmatched | The badge rendering of that state is also covered manually alongside ST-01's empty-state manual check, since the two empty states (no rules in the list, all-unmatched inbox) are visually simultaneous |

### Edge cases to test

- Removing a rule that was the sole match for a message: `inboxRoutingMath.test.ts` — call `routeInbox` with and without that rule in the array, assert the message flips from matched to unmatched. (Automated; the "re-renders on next recompute" half is the same live-values wiring as AC7, manual.)
- Exactly two rules, both boundary disables exercised from each row's own perspective: manual, `#manual-verification` item 2 includes the 2-rule case explicitly (not just 1 and 5+).
- "Has attachment" ignores any rule-side value: `inboxRoutingMath.logic.test.ts`'s Has attachment `describe` block includes a case with attachment true and the rule's (nonexistent) value irrelevant, confirming no empty-value-matches-nothing exception applies to it since it never reads a value.
- Reorder works independently of the add-toolbar budget being exhausted: manual, `#manual-verification` item 6 (fill to 20 occurrences, then reorder near the boundary).

### Fixtures and test utilities

- New: a small fixture module (inline in `inboxRoutingMath.test.ts` or a sibling `inboxRoutingMath.fixtures.ts`) with a handful of named `Rule[]` builders (`fromSenderRule`, `subjectContainsRule`, `largerThanRule`, `hasAttachmentRule`) and the six `TEST_INBOX` messages re-declared or imported from `InboxRulesExample.vue` if exported for test reuse. Prefer importing `TEST_INBOX` from its single source in `InboxRulesExample.vue` rather than duplicating the six messages, so the test and the live page can never drift.
- No existing fixture fits (`packages/core/src/examples/` fixtures are engine-level test templates, not relevant to a docs-only pure module).
- Precedent checked: `splitPaymentLedgerMath.ts` has no existing test file to reuse patterns from; this story's `inboxRoutingMath.test.ts` is the first test for this class of module and should itself become the pattern for any future `splitPaymentLedgerMath.test.ts` the developer may choose to backfill (optional, out of scope here).

### States from the feature's states policy relevant to this slice

Per the feature design's states policy, this slice (seam 2) touches: reorder-boundary disabled (30% opacity, never hidden; AC2), the mandatory empty state (zero rules → all six messages unmatched; AC8), and the live-recompute behavior that threads through every other state (pristine/focus/invalid/valid are ST-01's concern and unchanged here). None of these are automatable as component tests given the current docs test infra; all are manual, see `#manual-verification`.

### Reactivity / render-count assertions

This story touches the engine's `renderedChoiceOccurrences` re-sort path (reorder) but adds no new `DynamicFormItem`, `computedProps`, or validation wiring of its own (the per-occurrence action reveal is ST-01's; this story only extends `InboxRuleRow.vue` with reorder buttons that call `setFieldValue`, the same calls `SplitPaymentLedgerRow` already makes). The no-remount guarantee this story depends on is already asserted by `packages/core/src/components/__tests__/DynamicFormItemChoice.analytics.test.ts`'s `preserveOrder — render counts` describe block; no new `*.analytics.test.ts` is needed in `packages/core/src/` for this story. If the docs test infra proposed above is extended to component tests (not just pure modules) in a future story, an `InboxRuleRow.analytics.test.ts`-style check that two `setFieldValue` calls each trigger exactly one re-render of the affected rows would be the natural next addition, but that is beyond this story's scope.

### Coverage impact

`inboxRoutingMath.ts` lives in `docs/`, outside `pnpm -r ci:test:coverage`'s scope (workspace packages only), so it cannot move the tracked coverage baseline up or down regardless of how thoroughly it is tested. No file under `packages/core/src/` changes in this story (confirmed against the architecture section), so the baseline is unaffected either way. If the proposed docs test infra is added, its own coverage is not tracked by codecov unless a separate job is wired for it; call this out to Jeroen as a gap rather than silently leaving `inboxRoutingMath.ts` coverage invisible forever.

### Time sensitivity

None of this story's logic is date/time-dependent. The six `TEST_INBOX` messages carry no timestamps in the architecture's data shape; if the developer adds a received-at field for flavor, it must not affect `matches()` or `routeInbox()`, and any such display-only formatting would need a `TZ=Europe/Amsterdam` check, but nothing in the current spec requires it.

### Regression risk

- **`DynamicFormItemChoice` / `renderedChoiceOccurrences`**: already exercised by ST-01's rule list (static order) and by this story (reorder). Guarded by the existing engine-level `DynamicFormItemChoice.logic.test.ts` / `.analytics.test.ts` / `.validation.test.ts`; this story does not change engine code, so those tests are the regression backstop, not a new risk surface.
- **`SplitPaymentLedgerRow.vue` / `splitPaymentLedgerMath.ts` (checkout, FEAT-001)**: this story copies the reorder technique byte-for-byte but writes to a new, separate module (`inboxRoutingMath.ts`) and a new component (`InboxRuleRow.vue`); no shared file is edited, so the checkout page has zero exposure to this story's changes. Confirmed no existing checkout test exists either (consistent with the infrastructure finding above), so there is nothing to re-run there, only a "did not touch it" code-review check.
- **ST-01's `InboxRuleRow.vue` / `InboxRulesExample.vue`**: this story extends both files in place. Regression risk is losing ST-01's add/remove/validation/conditional-action behavior while adding reorder. No automated regression test exists for ST-01 either (same infra gap), so the manual checklist below re-walks ST-01's acceptance criteria 1-9 briefly alongside this story's new ones, rather than assuming they still hold.
- **ST-03 / ST-04 (forward risk)**: ST-03's `findUnreachableRules` builds directly on this story's `collectRules`/`matches`; if this story's `inboxRoutingMath.test.ts` pins down `matches()`'s exact semantics (AC6), ST-03 inherits a tested ground truth rather than having to re-derive it. ST-04's region excerpts quote this story's finished source, so no behavior change is expected to ripple there, only prose.

### Manual verification checklist

1. Click a rule's down arrow (or its neighbor's up arrow): confirm the two rows swap display position immediately, with no flash/remount (no loss of focus, no field value reset), in both light and dark mode.
2. With exactly 1 rule: both of its arrows are disabled (30% opacity, visible not hidden). With exactly 2 rules: first rule's up and second rule's down are disabled; first rule's down and second rule's up are enabled and swap the pair when clicked, confirmed from both rows. With 5+ rules: only the true first/last are disabled; swap near each boundary.
3. For each of the six fixed test-inbox messages, confirm the badge (emerald matched with destination + "rule N", or dashed muted "No rule matched, stays in Inbox") matches hand-computed `matches()`/`routeInbox()` results for the rules currently in the form, in both light and dark mode.
4. Reproduce `#reorder-payoff`: with "Subject contains Invoice" below "Has attachment", note the invoice message's badge; click the "Subject contains Invoice" rule's up arrow once; confirm the badge changes destination and catching-rule reference with no page reload, matching the before/after in `prototype.html#reorder-payoff`.
5. Add a rule, edit a condition value, remove a rule: confirm the inbox panel recomputes immediately after each action with no manual refresh.
6. Add rules up to the 20-occurrence budget (every add button disabled, "20 of 20"), then reorder two rules near the list boundary: confirm reorder still works while the add budget is exhausted.
7. Zero rules: confirm all six messages show "No rule matched, stays in Inbox" and the rules card still shows its empty-state panel and enabled add toolbar (re-confirming ST-01 AC1 still holds alongside this story's change).
8. Toggle `html.dark`: re-check items 1-4 above for any state that resolves only through page-specific markup rather than the existing CSS custom properties.

### Open questions for Jeroen

- Should `docs/` get its own minimal `vitest` setup (pure-module scope only) so `inboxRoutingMath.ts`'s unit tests in AC6 actually run as part of some CI step, given `docs/` is excluded from the pnpm workspace and `pnpm -r ci:test:coverage` never reaches it today? Without this, AC6 is only verifiable by manual/code-review inspection against the semantics table, which is a weaker guarantee than the acceptance criterion implies.

  DECIDED (research): Add a minimal `vitest` devDependency and a `docs/vitest.config.ts` to `docs/`, scoped to pure `.ts` modules only (no `jsdom` / `@vue/test-utils`), so `inboxRoutingMath.test.ts` actually runs. Add `"test": "vitest run"` to `docs/package.json` and a root `"docs:test": "pnpm --prefix docs test"` convenience script, plus a one-line note in CLAUDE.md's "Before Every Push" list that this step is separate from `pnpm -r ci:test:coverage` (which never reaches `docs/`). The QA plan's "assumes the infrastructure is added" branch is now the plan, not a conditional; the manual fallback for AC6 is dropped.
  Why: ladder rung 1 (the approved feature) discriminates. FEAT-006's Architecture ("Component & composable plan") and ADR-4 keep `inboxRoutingMath.ts` pure expressly so routing and the unreachable check are "unit-tested without a form"; ST-03's QA plan already extends `inboxRoutingMath.test.ts`; AC6 requires every predicate to be exercised by a unit test; and CLAUDE.md's "Before Every Push" step 3 requires functional changes to carry tests. The counter-precedent (`splitPaymentLedgerMath.ts` ships untested) is the only thing rung 3 offers the other way, and it is outweighed by the approved architecture's explicit intent. This is a docs-only devDependency: zero published-package, peer-dependency, or semver impact, and fully reversible (delete the config, dep, and scripts).
  Sources: FEAT-006 Architecture "Component & composable plan" + ADR-4; FEAT-006 ST-03 QA plan (extends `inboxRoutingMath.test.ts`); `docs/package.json` and `pnpm-workspace.yaml` (docs excluded from the workspace, no vitest/config/test script); CLAUDE.md "Before Every Push" step 3 and the "every user-runnable script gets a package.json script" rule.
  Known accepted gap: `inboxRoutingMath.ts` coverage stays invisible to codecov unless a separate docs coverage job is wired; acceptable because `docs/` is not the published package.

## Adversarial review

Lite (story-level), blockers first. Reviewed against the approved FEAT-006 (Functional overview `matches()` semantics, ADR-1/ADR-4/ADR-5, Architecture's `inboxRoutingMath.ts` plan), ST-01, the checkout precedent (`CheckoutFormExample.vue`, `SplitPaymentLedgerRow.vue`, `splitPaymentLedgerMath.ts`), `docs/package.json`, and `pnpm-workspace.yaml`. The `matches()` semantics (AC6), the `preserveOrder: true` flip (ADR-1), routing read from `values` not `computedProps` (ADR-4, AC7), and the explicit ST-01 dependency plus the inherited FEAT-010/ADR-5 sequencing gate are all consistent with the feature; no silent local override of the approved design/architecture found. All eight acceptance criteria map to an entry in the QA plan. Findings:

1. **should-fix (RESOLVED — DECIDED (research)).** AC6 ("`inboxRoutingMath.ts`'s unit tests exercise each predicate") is not satisfiable as an automated test with the repo's current tooling: `docs/` is excluded from the pnpm workspace, ships no `vitest`, config, or test script (verified in `docs/package.json` and `pnpm-workspace.yaml`), and `splitPaymentLedgerMath.ts` has no test file anywhere, so the "mirror how it is tested" precedent does not exist. Left unresolved this is a blocker on AC6's testability. Resolution: walking the post-approval ladder, rung 1 (the approved feature) discriminates decisively: Architecture + ADR-4 keep the module pure expressly to be "unit-tested without a form", ST-03's QA plan already extends `inboxRoutingMath.test.ts`, and CLAUDE.md requires functional changes to carry tests. Add a minimal pure-module vitest setup to `docs/`. Full decision, sources, and the package.json/CLAUDE.md/codecov consequences are recorded under the QA plan's Open questions.

2. **should-fix (PROPOSED).** AC4 and QA row 4 reference "the rules in their initial authored order" and "the host's initial `values`", but ST-01 AC1 and the checkout precedent (the split-payment repeatable choice seeds no occurrences, confirmed in `CheckoutFormExample.vue`) establish that this page loads with no rules, and neither ST-01 nor ST-02 seeds a demo set. AC4 is well-defined only as a unit test over a representative `Rule[]` fixture. Routed: PROPOSED note on AC4 and in QA row 4 clarifying the fixture, with the on-page 3/3 and the AC5 payoff reproduced by the reader (manual item 4). If instead the flagship payoff should be visible on load, that is a docs-visible feature/ST-01 amendment, outside ST-02; flagged, not blocking.

3. **should-fix (PROPOSED).** The reorder neighbor-selection and two-`order`-write arithmetic is this story's core new interaction, yet the AC-to-test mapping originally left it manual (a jsdom component test the pure-module infra does not cover). Routed: with the vitest setup now being added, extract the decision into a pure `planReorderSwap(rules, targetKey, direction)` helper in `inboxRoutingMath.ts` (handling non-contiguous `order` and boundary/null cases), unit-tested, keeping `InboxRuleRow.vue` a thin caller. See the PROPOSED notes in the architecture reference and QA row 1.

4. **nit.** The new docs tests run outside `pnpm -r ci:test:coverage`'s workspace scope, so codecov will not track `inboxRoutingMath.ts` coverage. The decision in finding 1 therefore ships a runnable `docs` `"test"` script plus a root `"docs:test"` convenience script (per CLAUDE.md's "every user-runnable script gets a package.json script") and a one-line CLAUDE.md "Before Every Push" note that this step is separate. The coverage-invisibility is a known, accepted gap (docs is not the published package).

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
