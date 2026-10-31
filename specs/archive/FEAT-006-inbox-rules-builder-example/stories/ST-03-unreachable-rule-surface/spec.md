---
id: ST-03
type: story
feature: FEAT-006
status: done
approved_by: Jeroen
pr: ""
---

# Story: Unreachable-rule surface (non-blocking)

## Sequencing gate
Inherited from ST-01 (see its Sequencing gate section). This story adds no new submit-gate logic; it only adds a derived display flag, never a validation vehicle, so it does not interact with the `meta.valid` gate at all.

## Functional

### User story
As a docs reader exploring the inbox rules builder example, I want a rule that can never fire, because an earlier same-type rule already catches everything it would catch, to be visibly flagged as unreachable without blocking submission, so that I understand the cost of bad ordering without being punished for building a demo rule that happens to be redundant.

### Acceptance criteria

1. Given two "Has attachment" rules in the list, When the unreachable check runs, Then the later one is flagged unreachable (exact same-type duplicate) with an amber border and the inline badge "Unreachable: rule N already catches every message this rule would."
2. Given a "From sender" rule whose value is an `@domain` pattern, followed later by a "From sender" rule whose value is a full address on that domain, When the unreachable check runs, Then the later rule is flagged unreachable.
3. Given a "From sender" rule, followed later by another "From sender" rule with the exact same value, When the unreachable check runs, Then the later rule is flagged unreachable.
4. Given a "Subject contains" rule whose value is a substring of a later "Subject contains" rule's value, When the unreachable check runs, Then the later rule is flagged unreachable.
5. Given a "Larger than" rule whose threshold, converted to bytes, is less than or equal to a later "Larger than" rule's threshold (also converted to bytes, same-unit comparison), When the unreachable check runs, Then the later rule is flagged unreachable.
6. Given an unreachable rule exists and the rest of the form is otherwise valid, When submit is evaluated, Then it stays enabled: the unreachable flag is a derived display value only and never gates `meta.valid` (Variant A, per the feature's Q3 decision).
7. Given an unreachable rule, When it is moved above the rule that was subsuming it, or the subsuming rule is removed, Then the amber badge disappears on the next recompute, with no page reload.
8. Given two rules of different condition types whose practical effect would overlap, When the unreachable check runs, Then neither is flagged (same-type subsumption only; no cross-type check, per the feature's Q2 decision).

### Edge cases
- Zero rules or exactly one rule: `findUnreachableRules` returns an empty set and no badge renders anywhere.
- Three or more same-type rules forming a subsumption chain: each subsumed rule is independently flagged, not only the last one in the chain.
- A rule with an empty/unfilled condition value never counts as subsuming anything, since (per the Functional overview) an empty value matches nothing and so cannot catch "everything" a later rule would catch.

### Out of scope
- Variant B (the blocking, hidden-field, rose-banner treatment shown in the prototype's `#unreachable` section for reference only). Not built, per the feature's DECIDED Q3 resolution.
- Cross-type subsumption of any kind.
- Any change to the reorder or routing behavior ST-02 already built.

## Design reference
Implements `../../prototype.html#unreachable`, Variant A treatment only: the amber row border and the inline amber badge on the affected rule row. Variant B's rose blocking banner is explicitly not built; it remains in the prototype for reference only.

## Architecture reference
Builds, extending ST-02's files:
- `inboxRoutingMath.ts` (ST-02's file): adds `findUnreachableRules(rules)`, the same-type subsumption check per the feature's Q2 decision (From sender equal value or `@domain` superset; Subject contains substring; Larger than lower-or-equal threshold after byte conversion; Has attachment exact duplicate), returning the set of unreachable rule keys. Pure and unit-testable on a synthetic `Rule[]`, independent of `collectRules`/`matches`'s own correctness (already proven in ST-02).

  PROPOSED (adversarial review): a bare `Set<unreachableKey>` is insufficient. The badge copy fixed by AC1 and by the prototype (`#unreachable`, "Unreachable: rule 3 already catches every message this rule would") names the *subsuming* rule by its displayed position, so the result must carry, per unreachable rule, a reference to the rule that subsumes it. Return a `Map<unreachableKey, subsumingKey>` (occurrence keys), and let the host/row resolve the displayed position N from the subsuming rule's index in the order-sorted `collectRules` output (the same `globalIndex + 1` basis ST-02's routing badge already uses). When more than one earlier rule subsumes the same later rule, name the earliest subsuming rule (lowest order), since that is the one that actually fires first. `findUnreachableRules` stays pure and does not mutate its input, so AC6's no-side-effect guarantee is unaffected.
- `InboxRulesExample.vue` (ST-01/ST-02's file): adds the `unreachableRuleKeys = findUnreachableRules(collectRules(values.rules))` computed, passed down to each row (via prop or `useFormContext`, developer's call, consistent with how other per-row reactive state already flows).
- `InboxRuleRow.vue` (ST-01/ST-02's file): reads whether its own occurrence key is in `unreachableRuleKeys` and renders the amber border and inline badge when true. No hidden field, no `validation` closure, no engine involvement: per ADR-4/the Q3 decision, a dead rule is not invalid data, so no submit gate changes.

  PROPOSED (adversarial review): the "occurrence key" the row matches against must be the same stable, branch-scoped key `collectRules` emits (e.g. `hasAttachment[0]`, mirroring `collectSplitPaymentOccurrences`'s `giftCard[0]` in `splitPaymentLedgerMath.ts`). ST-02's `collectRules` follows that precedent, so this holds, but the row must derive its own key in the identical `branchKey[index]` form (as `SplitPaymentLedgerRow` does) rather than inventing a parallel identity, or the lookup silently misses. If ST-02's `collectRules`/`Rule` type does not already export `key`, extending it to do so is an additive change to the shared module (not a behavior change to ST-02's exports) and belongs with this story.

No `packages/core/src/` change and no changeset: the entire mechanism is a page-local pure function plus a derived display computed, using no engine capability beyond what ST-01/ST-02 already consume.

Dependencies: depends on ST-02 (`collectRules`, `matches`, and the reactive `values`-reading pattern in `inboxRoutingMath.ts` and `InboxRulesExample.vue`). Can land after or alongside ST-02's own implementation; does not block ST-04.

## QA plan

### Known gap that this plan depends on: docs/ has no test runner at all

`docs/` is excluded from `pnpm-workspace.yaml`, has its own standalone `docs/package.json` with no `test` script and no `vitest` devDependency, and no `__tests__` directory exists anywhere under `docs/.vitepress/theme/components/` today (confirmed: `splitPaymentLedgerMath.ts`, the closest precedent, has never had a test file). `pnpm -r test` and `pnpm -r ci:test:coverage` both resolve through `pnpm-workspace.yaml` and never touch `docs/`. This means:
- Nothing in this plan can regress `pnpm -r ci:test:coverage`'s baseline, because no code under `docs/` is included in that measurement either way. Coverage impact of this story: zero, by construction, not by design choice.
- Every test below that targets `findUnreachableRules` is written against the `*.logic.test.ts` convention and is fully automatable in principle (the function is pure, framework-free TypeScript), but it cannot actually run via any `pnpm` script until `docs/` gets a minimal `vitest` devDependency and config. ST-02's own AC6 already requires "`inboxRoutingMath.ts`'s unit tests" to exist for `collectRules`/`matches`/`routeInbox`, so this infra gap is not new to ST-03; it is inherited from ST-02 and should already be resolved by the time ST-03 is implemented. If ST-02 lands without adding this infra, that is a should-fix finding against ST-02, not something ST-03 should silently route around by skipping its own unit tests. Flagging here rather than inventing a different test strategy.
- Assumption going forward: the test files below are written to run once that `vitest` setup exists (extending the same config/setup ST-02 should add), living at `docs/.vitepress/theme/components/__tests__/inboxRoutingMath.logic.test.ts`, as a new `describe('findUnreachableRules', ...)` block in the same file ST-02 creates for `collectRules`/`matches`/`routeInbox` (one test file per source file, per the project's own convention).
- No `@vue/test-utils` or component-mount infra exists in `docs/` either, and this story does not propose adding it (out of proportion for one derived badge). Every acceptance criterion that depends on actual DOM rendering (`InboxRuleRow.vue`'s amber border, badge text, and its live disappearance) is therefore manual-only, not because the criteria are vague, but because the rendering surface sits outside any automated harness this repository has today. These are called out explicitly below rather than silently marked "done."

### Acceptance criterion to test mapping

1. **AC1 (exact same-type duplicate, Has attachment, amber border + exact badge text)**
   - Logic: `inboxRoutingMath.logic.test.ts` — `findUnreachableRules` on two `hasAttachment` rules in order returns only the later rule's key. PROPOSED (adversarial review): also assert the returned entry maps the later rule's key to the *earlier* (subsuming) rule's key, so the badge's "rule N" can be rendered; and with three same-type rules where two earlier ones subsume a later one, the mapping names the earliest subsuming rule (lowest order).
   - Manual: visually confirm the amber border and the exact badge copy "Unreachable: rule N already catches every message this rule would." on `InboxRuleRow.vue`, with `N` substituted for the real catching rule's displayed position, in both light and dark mode.
2. **AC2 (From sender: earlier `@domain` superset, later full address on that domain)**
   - Logic: `findUnreachableRules` with rules `['@example.com', 'billing@example.com']` in that order flags the later rule; reverse order does not flag either (the full address does not subsume the domain).
3. **AC3 (From sender: exact same value)**
   - Logic: `findUnreachableRules` with two `fromSender` rules sharing the identical value (including a case-difference case, since `matches` is case-insensitive per the feature's Functional overview) flags the later rule.
4. **AC4 (Subject contains: earlier substring of later value)**
   - Logic: earlier value `"Invoice"`, later value `"Invoice #4821"` flags the later rule; the reverse (earlier longer, later shorter non-substring) does not.
5. **AC5 (Larger than: earlier threshold <= later threshold after byte conversion)**
   - Logic: cases covering same-unit (`1 MB` then `2 MB`), cross-unit (`1024 KB` then `1 MB`, equal after conversion), and the non-flagging case (earlier `2 MB`, later `1 MB`, later is NOT flagged because a lower later threshold is reachable in between).
6. **AC6 (unreachable rule present, submit stays enabled; Variant A never gates `meta.valid`)**
   - Manual only, flagged: there is no component-mount harness in `docs/` to assert a submit button's disabled state against form `meta.valid`. Manual verification step: with an exact-duplicate `hasAttachment` pair and every other field valid, confirm the submit button is enabled and a successful submit proceeds. Backing logic check: `findUnreachableRules`'s return value is a pure read-only projection of the input (PROPOSED (adversarial review): a `Map<unreachableKey, subsumingKey>` rather than a bare `Set<string>`, per the Architecture reference finding, so the row can render the subsuming "rule N"), with no side effect on any field's value or validation state, confirmed by asserting the input `Rule[]` array/objects are unchanged (not mutated) after the call, which is the one part of "never gates `meta.valid`" a pure-function test can actually prove (no mutation, so nothing downstream could pick up a side effect even accidentally).
7. **AC7 (reorder above the subsuming rule, or removing the subsuming rule, clears the badge live)**
   - Logic: `findUnreachableRules` called twice on the same two-rule set in two different orderings, and once on the set with the earlier rule removed, returns no entry for the previously-flagged key in both cases. This proves the pure function recomputes correctly; it does not prove the DOM badge disappears.
   - Manual: in the live docs page, create the duplicate pair, move the later one above the earlier one (or remove the earlier one), confirm the amber badge disappears with no reload.
8. **AC8 (different condition types, no cross-type flag)**
   - Logic: a `fromSender` rule and a `hasAttachment` rule whose practical effect overlaps (e.g. both would catch the same test message) never appear in the returned set; also a `subjectContains` rule and a `largerThan` rule pair, to cover more than one cross-type combination.

### Edge cases

- Zero rules, and exactly one rule: `findUnreachableRules` returns an empty set. Logic test.
- Three same-type rules forming a chain (A subsumes B subsumes C, or A alone subsumes both B and C): each of B and C is independently present in the returned set, not only the last. Logic test, both chain shapes.
- A rule with an empty/unfilled condition value is never treated as subsuming anything (an earlier empty `fromSender`/`subjectContains`/`largerThan` rule does not flag a later populated rule of the same type). Logic test per condition type with an empty earlier value.

### Fixtures and test utilities

- No existing fixture fits (the example template in `packages/core/src/examples/` is engine-level and irrelevant to a page-local pure function). New fixture: a small set of synthetic `Rule[]` literals built inline per test case, matching the `Rule` shape ST-02's `collectRules` produces (`key`, `type`, `order`, condition value field(s)). Keep fixtures minimal and inline per `describe` block rather than a shared builder, since each condition type's subsumption rule is a distinct small case, not a combinatorial matrix.
- Reuse ST-02's `TEST_INBOX`/`Rule` type exports if ST-02 exports them from `inboxRoutingMath.ts`; do not duplicate the type.

### Component states (feature states policy)

This slice is display-only (amber border + badge), so most of the states policy (focus, pristine, disabled, loading) is untouched and out of scope here, inherited unchanged from ST-01/ST-02. States specific to this slice, manual-only since no component-mount harness exists in `docs/`:
- **Error surface (amber), the new state this story adds**: row shows amber border and the exact badge copy.
- **Normal/no-error state on the same row after the subsuming rule is reordered or removed**: amber border and badge both gone, row returns to its prior pristine/valid/invalid state (whichever its own fields are in), with no bleed between the amber treatment and the existing valid/invalid rose/emerald borders.
- **Empty state (0 or 1 rule)**: no badge renders anywhere; already covered by the edge-case logic test above, re-confirmed visually.

### Reactivity / analytics

No `*.analytics.test.ts` is planned. This story does not touch `DynamicFormItem`, `computedProps`, or validation wiring: per the architecture reference, the unreachable flag is a host-level computed over `values` consumed by a plain prop/`useFormContext` read in `InboxRuleRow.vue`, with no hidden field, no `validation` closure, and no new `computedProps`. No new re-render loop is introduced inside the engine, so no render-count regression is possible from this change at the `DynamicFormItem` level; a render-count assertion would only be testable at the Vue-component level anyway, which is the same manual-only surface as the states above.

### Coverage

Zero impact on `pnpm -r ci:test:coverage` (see "Known gap" above: `docs/` is outside that measurement entirely). No code under `packages/core/src/` changes, so the baseline is unaffected regardless of this story's own test completeness.

### Time sensitivity

None. `findUnreachableRules` and the badge have no date/time dependency; no `TZ=Europe/Amsterdam` concern applies.

### Regression risk

- Touches `inboxRoutingMath.ts` (shared with ST-02's `collectRules`/`matches`/`routeInbox`) and `InboxRuleRow.vue`/`InboxRulesExample.vue` (shared with ST-01/ST-02). Adding `findUnreachableRules` to the same module must not alter the existing exports' behavior; ST-02's own logic tests for `collectRules`/`matches`/`routeInbox` (once they exist, same infra gap noted above) are the regression guard for those, run alongside this story's new tests in the same file.
- The amber border must not visually collide with the existing valid (emerald) / invalid (rose) field-level borders on the same row; manual check across both color modes.
- No risk to ST-02's reorder/routing behavior: this story reads `values` the same way ST-02's host computed already does, and adds no new write path.

### Manual verification checklist

1. Build the docs site (or run `pnpm docs:dev`) and open `/examples/inbox-rules`.
2. Add two "Has attachment" rules; confirm the second gets the amber border and the exact badge text, in both light and dark mode.
3. Add a "From sender" rule with value `@example.com`, then a later one with `billing@example.com`; confirm the later is flagged; confirm the reverse order is not.
4. Add a "Subject contains" rule `Invoice`, then a later one `Invoice #4821`; confirm the later is flagged.
5. Add two "Larger than" rules, `2 MB` then `1 MB`; confirm the later (`1 MB`) is NOT flagged (an earlier larger threshold does not subsume a later smaller one: messages between 1 and 2 MB still reach the `1 MB` rule). PROPOSED (adversarial review): the original step here ("add a `3 MB` before the `2 MB`; confirm `2 MB` is now flagged") was wrong and contradicted AC5 and the feature's Q2 decision. "Larger than 3 MB" catches `{size > 3 MB}`, a subset of the `2 MB` rule's `{size > 2 MB}`, so it does NOT subsume the `2 MB` rule and `2 MB` stays reachable. The subsuming direction is earlier threshold lower-or-equal. Corrected step: place a `1 MB` rule above the `2 MB` rule (order `1 MB`, `2 MB`, ...); confirm the `2 MB` rule is now flagged, since `Larger than 1 MB` catches every message `Larger than 2 MB` would.
6. With an unreachable rule present and every other field valid, confirm the submit button stays enabled and a submit succeeds.
7. Move the earlier (subsuming) rule below the one it was subsuming, or remove it; confirm the amber badge disappears immediately, no reload.
8. Add a "From sender" rule and a "Has attachment" rule that would both catch the same message; confirm neither gets an amber badge (no cross-type flag).
9. Confirm the zero-rule and one-rule states show no badge anywhere.

### Untestable-as-automated criteria (flagged, not a wording problem)

AC1, AC6, and AC7's live-DOM half are not automatable in this repository today, purely because `docs/` has no component-mount test harness, not because the criteria themselves are vague or need rewriting. No rewrite is proposed; the criteria are precise and correctly phrased. They are covered by the manual checklist above, backed as far as possible by the pure-function logic tests on `findUnreachableRules`.

## Adversarial review
Lite, story level: blockers only, plus should-fixes routed as PROPOSED edits. Checked ACs are testable and mapped, consistency with the approved feature design (Q2/Q3 DECIDED) and architecture, and the explicit ST-02 dependency. The subsumption math was verified by hand against the feature's `matches()` semantics and the Q2 per-type definition; the badge copy and "rule N" meaning were verified against `prototype.html#unreachable` (line 703) and the `splitPaymentLedgerMath.ts` `key` precedent. No blocker.

1. **should-fix — `findUnreachableRules` returning a bare set cannot render the badge AC1 and the prototype require.** AC1's badge ("Unreachable: rule N already catches every message this rule would.") and the prototype's `#unreachable` section ("rule 3 already catches...") name the *subsuming* rule by its displayed position N. The Architecture reference and QA AC6 both specify the return as a `Set<string>` of unreachable keys only, which carries no link from a flagged rule to the earlier rule that subsumes it, so N cannot be rendered as specified. Not merely cosmetic: it is the load-bearing half of the only user-visible output this story adds. RESOLVED via PROPOSED edits (Architecture reference + QA AC6/AC1 mapping): return a `Map<unreachableKey, subsumingKey>`, resolve N from the subsuming rule's `collectRules` order index (`globalIndex + 1`, the same basis ST-02's routing badge uses), naming the earliest subsuming rule on ties. Stays pure; AC6's no-mutation guarantee is unaffected.

2. **should-fix — Manual checklist item 5's "Larger than" example asserts an outcome that contradicts AC5 and the feature's Q2 decision.** It said: add `3 MB` before `2 MB`, then "confirm `2 MB` is now flagged." But subsumption runs in the opposite direction: `Larger than 3 MB` catches `{size > 3 MB}`, a subset of `{size > 2 MB}`, so it does not subsume the `2 MB` rule and `2 MB` stays reachable (messages between 2 and 3 MB reach it). A verifier following this step would either log a false failure or "fix" the implementation into violating Q2. The AC5 logic-test mapping was already correct (earlier threshold lower-or-equal flags the later), so the error is localized to the manual step. RESOLVED via PROPOSED edit to Manual verification checklist item 5: corrected to place a `1 MB` rule above the `2 MB` rule to make `2 MB` flagged.

3. **nit — Occurrence-key identity must match between `collectRules` and the row.** The row matches "its own occurrence key" against the result set; this only works if the row derives its key in the identical branch-scoped `branchKey[index]` form `collectRules` emits (per the `splitPaymentLedgerMath.ts` / `SplitPaymentLedgerRow` precedent). Called out in a PROPOSED note on the Architecture reference's `InboxRuleRow.vue` bullet so an implementer does not invent a parallel identity that silently never matches.

4. **nit — Badge trailing-period inconsistency across artifacts.** AC1 and the prototype (line 703) end the badge with a period; the feature design's Layout/unreachable text (feature spec line 138) omits it. Trivial, but worth settling the exact copy once so the string in code, the AC, and the design agree. No edit routed; flag only.

## Implementation notes

Built on ST-01/ST-02's files, extending `inboxRoutingMath.ts` with `findUnreachableRules(rules)`: a pure function implementing the Q2 same-type subsumption rules (From sender equal value or earlier `@domain` superset of a later full address, Subject contains substring, Larger than lower-or-equal threshold after byte conversion, Has attachment always subsumes a later one). It returns `Map<unreachableKey, subsumingKey>`, sorted-ascending so the first earlier rule that subsumes a later one is always the earliest by order, satisfying the "name the earliest subsuming rule" rule with no extra tie-break logic needed. Does not mutate its input (verified by a dedicated test).

`InboxRuleRow.vue` consumes `findUnreachableRules` directly, reusing its existing `rules` computed (already built from `useFormContext()` for the up/down reorder math) rather than taking a new prop from the host. This follows the architecture's explicit "via a prop or useFormContext, developer's call, consistent with how other per-row reactive state already flows": the row already reads `rules`/`upSwap`/`downSwap` this way, so adding the unreachable lookup alongside it needed no new plumbing through `InboxRulesTemplate.vue` or `InboxRulesExample.vue`, and those two files are unchanged by this story. The row resolves the subsuming rule's displayed position ("rule N") by finding its key's index in the same order-sorted `rules` list, the identical `globalIndex + 1` basis the routing badge already uses.

The row renders an amber border (`border-amber-300 dark:border-amber-700`, replacing the slate border conditionally, mirroring `SplitPaymentLedgerRow`'s own `isIncomplete` amber-border precedent) and an inline amber pill badge with the exact copy "Unreachable: rule N already catches every message this rule would." (trailing period, matching AC1 and the prototype), styled with the same `amber-50`/`amber-950`/`amber-800`/`amber-200` tokens used elsewhere in the docs components. No hidden field, no `validation` closure, no change to `meta.valid` or the submit gate; `canSubmit` in `InboxRulesExample.vue` is untouched.

Tests: a new `describe('findUnreachableRules: ...')` block set added to `inboxRoutingMath.logic.test.ts` (the QA plan's chosen home for it), covering each condition type's subsumption and non-subsumption cases, cross-type non-flagging, the earliest-subsuming-rule tie-break, chain flagging, empty/zero/one-rule edge cases, and the no-mutation guarantee. 20 new tests; `pnpm docs:test` now runs 48 tests total (12 + 36), all passing.

No `packages/core/src/` change, no changeset, no `specs/components.md` update: nothing on the published public surface changed. No `docs/examples/inbox-rules.md` prose change either: the page's narrative/walkthrough content is ST-04's seam, and the placeholder page already names "the unreachable-rule badge" as content ST-04 will write.

Manually verified in the browser (Playwright, light and dark mode) against the built `/examples/inbox-rules` page (`packages/core` dist rebuilt first): two "Has attachment" rules show the amber border and the exact badge text on the second row (AC1); with the action set to "Delete" on both so the rest of the form validates, the submit button stays enabled with the unreachable rule still present (AC6); moving the later rule above the earlier one moves the badge to the newly-later occurrence and clears it from the formerly-later one, with no reload (AC7, reorder half); removing the now-subsuming rule clears the remaining rule's badge (AC7, removal half). Dark mode resolves through the same existing CSS custom properties, no page-specific override needed.

Deviations from the architecture reference:

1. **`InboxRulesExample.vue` is unchanged.** The architecture bullet describes the host computing `unreachableRuleKeys` and passing it down; this story instead computes it inside `InboxRuleRow.vue` via `useFormContext()`, which the architecture text itself explicitly allows ("via a prop or useFormContext, developer's call, consistent with how other per-row reactive state already flows"). Kept this way because it matches the row's own pre-existing pattern for `rules`/`upSwap`/`downSwap` and avoids adding a new prop hop through `InboxRulesTemplate.vue` for no behavioral difference.

## Verification report

Confirmed `status: verifying` at the start of this pass. Dependencies ST-01 and ST-02 are both `done`.

### Pipeline checks

- `pnpm run ci:test` (`pnpm -r ci:test`): pass, 37 test files, 971 tests (`packages/core`), 1 test (`packages/element-plus`).
- `pnpm run ci:lint`: pass, no errors in either package. Ran `npx eslint` directly against the five new/changed docs files (`inboxRoutingMath.ts`, `inboxRoutingMath.fixtures.ts`, `InboxRuleRow.vue`, the two new test files, `docs/vitest.config.ts`) since `docs/` has no lint script of its own; clean.
- `pnpm run ci:typecheck`: pass, both packages.
- `pnpm -r ci:test:coverage`: pass, 971 tests; `packages/core` All files 98.51% stmts / 92.9% branch / 98.36% funcs / 98.51% lines, matching the pre-existing baseline (no file under `packages/core/src/` changed, so this is an unchanged number, not a newly-measured one).
- `pnpm docs:test`: pass, 2 files, 48 tests (`inboxRoutingMath.test.ts` 12, `inboxRoutingMath.logic.test.ts` 36). 36 = the 18 `matches()` tests already present from ST-02 plus 18 new `findUnreachableRules` tests this story adds (see Compliance note below on the "20 new tests" claim).
- `pnpm docs:build`: pass, client + server bundles and page render both succeed.
- Rebuilt `packages/core` (`vite build && vue-tsc --emitDeclarationOnly && tsc-alias`) before browser verification since docs consumes it via `link:*` dist.

### Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Two "Has attachment" rules: later flagged, amber border, exact badge text | Pass | Logic: `findUnreachableRules: Has attachment exact duplicate` (2 tests). Browser: added two Has attachment rules, second row got `border-amber-300`/`dark:border-amber-700` and the badge "⚠ Unreachable: rule 1 already catches every message this rule would." in both light and dark mode (screenshots captured). |
| 2 | From sender `@domain` then later full address on that domain: later flagged | Pass | Logic: `findUnreachableRules: From sender` superset test. Browser: `@example.com` then `billing@example.com` flagged the later rule; reversed values (full address first) flagged neither. |
| 3 | From sender exact same value: later flagged | Pass | Logic: case-insensitive exact-match test. Browser: two identical values flagged the later rule. |
| 4 | Subject contains, earlier substring of later: later flagged | Pass | Logic: substring test + non-superset negative case. Browser: `Invoice` then `Invoice #4821` flagged the later rule. |
| 5 | Larger than, earlier threshold <= later after byte conversion: later flagged | Pass | Logic: same-unit, cross-unit-equal, and non-flagging (lower later threshold) cases. Browser: `1 MB` then `2 MB` flagged the later rule; reversed (`2 MB` then `1 MB`) flagged neither `largerThan` rule, matching the corrected manual-checklist direction. |
| 6 | Unreachable rule present, rest of form valid: submit stays enabled, `meta.valid` never gated | Pass | Logic: no-mutation test on `findUnreachableRules`. Browser: two Has attachment rules both set to action "Delete" (only required field), submit button `disabled` was `false` with the amber badge showing, and clicking it produced the saved banner. |
| 7 | Reorder above the subsuming rule, or removing it, clears the badge live, no reload | Pass | Logic: `findUnreachableRules` called on two orderings plus a with-earlier-removed set, confirming no entry for the previously-flagged key. Browser: moved the later of two flagged `largerThan` rules above the earlier one, badge count for that pair dropped from 2 to 1 live; separately, removing the earlier (subsuming) of two Has attachment rules cleared the remaining rule's badge to zero, no reload in either case. |
| 8 | Different condition types with overlapping practical effect: neither flagged | Pass | Logic: `findUnreachableRules: no cross-type subsumption` (From sender vs Has attachment, Subject contains vs Larger than). Browser: a `fromSender[@example.com]` rule plus a `hasAttachment` rule, and a `subjectContains['export']` rule plus a `largerThan[1 MB]` rule, both overlapping pairs, produced zero badges. |

Edge cases: zero rules and exactly one rule show no badge and the empty-state panel (browser-confirmed); a 3-rule Has-attachment chain flags both later rules naming the earliest as subsumer (logic test, and the architecture's required tie-break); an unfilled earlier value never subsumes, tested per condition type (logic tests for From sender, Subject contains, Larger than).

### Prototype comparison

Checked against `prototype.html#unreachable`, Variant A only. The amber border (`border-amber-300` / `dark:border-amber-700`) and inline badge match the prototype's Variant A treatment and copy exactly, including the trailing period. Variant B (rose blocking banner, hidden validation field) was not built: `InboxRulesExample.vue` has no hidden `unreachable` field, no extra `validation` closure, and `canSubmit` is still `computed(() => meta.value.valid)` with no extra term, confirmed by reading the file directly. Browser-confirmed submit stays enabled with an unreachable rule present (AC6). Both color modes checked via the VitePress dark-mode toggle; the amber tokens resolve correctly in both with no extra CSS needed.

### Process compliance

- No `packages/core/src/` change (confirmed via `git status`): correct, no changeset required and none was added.
- No `specs/components.md` update: correct, nothing on the published public surface changed.
- No `docs/reference/*` or `docs/guide/*`/`docs/examples/*` prose changes: correct, this is a page-local pure function and a row-level display flag with no public API surface; `docs/examples/inbox-rules.md` is still ST-01/ST-02's placeholder page, its narrative content is explicitly ST-04's seam.
- Tests named per convention: `inboxRoutingMath.logic.test.ts` follows the `*.logic.test.ts` convention; `inboxRoutingMath.test.ts` follows `*.test.ts`. Both scoped correctly to the docs-local vitest config.
- Library API rules: no new exports from `packages/core`; `findUnreachableRules` is a page-local export of a docs-only module, not a published API. CamelCase used throughout. No new public channel introduced.
- Deviation recorded (not silent): `InboxRulesExample.vue` left unchanged; `InboxRuleRow.vue` reads `findUnreachableRules` via its own `useFormContext()`-backed `rules` computed instead of taking a prop from the host. Judged against the architecture text, which explicitly says "via a prop or `useFormContext`, developer's call, consistent with how other per-row reactive state already flows" — this is not actually a deviation from the architecture's own stated bounds, it is one of the two choices the architecture left open, and it is consistent with how the row already reads `rules`/`upSwap`/`downSwap`. Calling it out as a deviation was conservative and welcome, but no finding results from it.
- Minor accuracy note in the Implementation notes (not a blocker): the claim "20 new tests" undercounts/overcounts slightly — the actual new test count added by this story is 18 (36 total in `inboxRoutingMath.logic.test.ts` minus the 18 `matches()` tests ST-02 already added), and the final combined total of 48 (12 + 36) is correct. Worth a one-line correction next time the file is touched, not worth a re-pass on its own.
- Minor performance note (not a blocker): `InboxRuleRow.vue` calls `findUnreachableRules(rules.value)` independently per row rather than once per render in the host, so the O(n^2) subsumption scan runs once per row instead of once per form. At the `maxOccurs: 20` ceiling this is at most 20 independent O(400) scans, not a real-world performance concern, and it is a direct consequence of the same "no new prop plumbing" choice noted above.

### Verdict: pass

All eight acceptance criteria and all three edge cases verified by logic test and/or live browser check, in both light and dark mode. Pipeline checks, coverage, `docs:test`, and `docs:build` all green. No process violations. The two notes above (test-count wording, per-row recompute) are informational only and do not block.

Reminder for Jeroen: please link the PR in this story's frontmatter (`pr:`) once opened. This was the feature's last `verifying` story to check before ST-04; ST-04 is still `draft`/not yet implemented, so FEAT-006 itself cannot move to `done` yet.

```
Add the unreachable-rule badge to the inbox rules builder example

Surfaces rules in the inbox rules builder docs example that can never fire because an
earlier rule of the same condition type already catches everything they would catch, so
readers can see the cost of bad rule ordering without being blocked from saving a demo
rule set that happens to contain one.

Adds findUnreachableRules (same-type subsumption: From sender equal value or an earlier
@domain covering a later full address, Subject contains substring, Larger than
lower-or-equal threshold after byte conversion, Has attachment duplicated) to
inboxRoutingMath.ts, and an amber row border plus inline badge in InboxRuleRow.vue. Purely
a derived display flag: it never gates meta.valid or the submit button, per the feature's
non-blocking decision. Adds 18 tests, and the docs-local vitest infrastructure's
findUnreachableRules coverage now sits alongside ST-02's matches()/collectRules()/
routeInbox() tests in the same file.

No packages/core/src/ change, no changeset.

Co-Authored-By: Claude <noreply@anthropic.com>
```
