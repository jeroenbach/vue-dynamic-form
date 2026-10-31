---
id: ST-04
type: story
feature: FEAT-010
status: done
approved_by: Jeroen
pr: ""
---

# Story: Checkout example cleanup, the acceptance proof for all three gaps

## Functional
### User story
As a docs reader trying the checkout example, I want its engine-gap workarounds removed now that the engine itself closes the gaps they existed to cover, so that the example demonstrates the library's real validation contract instead of userland patches, with every flow I could already try by hand still working.

### Acceptance criteria

1. Given GAP 1 has shipped (ST-02), When `CheckoutFormExample.vue` is updated, Then `markChildlessBranchActive` is deleted entirely, each childless branch (`express`, `homeDelivery`, `payPal`) declares `presenceValue: true` instead, and selecting and submitting each of those branches still succeeds exactly as before.
2. Given GAP 2 has shipped (ST-01), When `CheckoutFormExample.vue` is updated, Then `createChangeTracker` and both of its call sites (`countryChanged`, `giftMessageActiveChanged`), plus the manual `validateField()` calls they drove (the ones at lines 561 and 826 in the current file), are deleted; the per-country postal pattern and the gift-message length move into `computedProps`-set `thisField.validation`/`thisField.restriction` using stable function/array references (so ST-01's guard actually benefits them); typing a German postal code after switching country from Netherlands revalidates against the German pattern without a manual `validateField()` call driving that revalidation.

   PROPOSED (adversarial review): the final clause originally read "with no manual `validateField()` call anywhere in the file", which is literally unsatisfiable and misleading. The independent `validateField()` call inside `splitPaymentCoverage`'s `computedProps` (line 525) is NOT driven by `createChangeTracker`, is explicitly out of this deletion's scope (GAP 2 does not cover it), and must be retained; `validateField` therefore also stays destructured from `useDynamicForm`. A literal "no `validateField()` anywhere" reading would wrongly flag both for removal, breaking live split-payment coverage revalidation. Wording tightened above to scope the deletion to the two change-tracker-driven calls and to describe the postal outcome as "no manual `validateField()` call driving that revalidation" rather than "anywhere in the file".
3. Given GAP 3 has shipped (ST-03) including its stale-registration fix (whether that fix landed inside ST-03 or in a split QUICK spec that has since merged), When `CheckoutFormExample.vue` is updated, Then `formIsComplete` and the `handleSubmit`-bypassing `onSubmit` collapse to a `meta.valid`-based gate, used for both the place-order button's `:disabled` state and the actual submit decision.
4. Given the stale-registration fix has NOT yet landed at the time this story is implemented, When this story is implemented, Then the GAP 3-dependent collapse described in AC3 is explicitly parked and documented as blocked on that fix in this story's own notes, while AC1 and AC2 still ship.
5. Given every flow already browser-verified in the example before this cleanup (payment-method disable/deselect on the split-payment toggle, VAT/gift-message error stand-down, per-country postal revalidation, both order-placement paths), When the cleanup lands, Then every one of those flows still works, verified by hand with before/after screenshots per `CLAUDE.md`'s screenshot step.

### Edge cases
- The module-level `vatNumberIsActive`/`giftMessageIsActive`/`currentCountry`/`postalIsActive` mutable closures collapse once `createChangeTracker` is removed; any logic genuinely still needed moves into `computedProps` rather than surviving as module-level mutable state.
- A `computedProps` swap of `thisField.validation`/`thisField.restriction` must use stable function/array references (not rebuilt fresh each run) to actually trigger ST-01's rebuild guard rather than defeat it; this story's rewrite is the one case in the codebase demonstrating that correctly.
- `comment` at each workaround's own definition (already in place, explaining exactly which engine gap it exists to cover) is the acceptance criterion for "this workaround is now deletable": each deletion in AC1-AC3 corresponds to one such comment disappearing along with the code it annotated.

### Out of scope
- Rewriting any part of the checkout example not touched by the three gaps (the split-payment ledger math, the order summary, the sticky cart layout).
- The engine changes themselves (ST-01, ST-02, ST-03's own scope); this story only consumes them.
- Any new `packages/core/src/` change or changeset: this story is docs-only.

## Design reference
None. This is a docs-only cleanup of an already-shipped example (`FEAT-001-shopify-style-checkout-example`); it introduces no new visual surface.

## Architecture reference
Builds, from the feature architecture's "Checkout-example cleanup (acceptance proof, docs-only)" section:

- Deletions matched one-to-one to each workaround's own explanatory comment: `markChildlessBranchActive` (GAP 1), `createChangeTracker` plus its two call sites (GAP 2), `formIsComplete` plus the `handleSubmit`-bypassing `onSubmit` (GAP 3).
- Edits `docs/.vitepress/theme/components/CheckoutFormExample.vue`. That file belongs to `FEAT-001-shopify-style-checkout-example`, whose spec status is `in-progress` (not `done`), so editing it directly is permitted (feature's Constraints section); per the feature's open question 7 decision, this cleanup is tracked as this feature's own story rather than as a follow-up under `FEAT-001`, since `FEAT-001`'s scope was building the example, not fixing the engine gaps its workarounds exist to cover.
- No `packages/core/src/` change and no changeset: docs-only, per `CLAUDE.md`'s changeset rule (skip for changes that only touch `docs/`).

Dependencies: depends on ST-01, ST-02, and ST-03 all having landed, since this story deletes the workarounds all three gaps enable removing. AC3 and AC4 further depend specifically on the stale-registration fix (ST-03's investigation subsection): if that fix ships inside ST-03, AC3 applies directly; if it splits into its own QUICK spec per the feature's open question 6, this story's AC3 waits on that QUICK spec landing and AC4 governs in the meantime.

## QA plan

### Preconditions

This story's only file is `docs/.vitepress/theme/components/CheckoutFormExample.vue`. `docs/` is excluded from the pnpm workspace and carries no vitest/test runner of its own (confirmed: no `docs/vitest.config.*`, no test script in `docs/package.json`), so no automated unit or component test can live next to this file under the `__tests__/` convention. Verification is therefore code review plus manual browser checks, as the feature spec itself anticipates.

As of this QA plan, ST-01, ST-02, and ST-03 are all still `status: qa` (none `approved`/`implemented`). This story cannot be implemented until all three reach `approved` and their engine changes land, per its own Dependencies note and Hard rule 4. This is a blocking precondition for the developer phase, not something this QA plan can resolve; flagged here so it is not missed when this story is picked up.

### Acceptance criteria to verification mapping

| AC | Verification |
| --- | --- |
| AC1 (GAP 1 deletions + childless branches submit) | Code review: `markChildlessBranchActive` and its call sites are absent from the file; `express`, `homeDelivery`, `payPal` each declare `presenceValue: true` in place of the old `computedProps: [(_thisField, fieldValue) => markChildlessBranchActive(fieldValue)]` line. Manual: steps 1-3 below. |
| AC2 (GAP 2 deletions + live per-country/gift-message revalidation) | Code review: `createChangeTracker`, `countryChanged`, `giftMessageActiveChanged`, and the `validateField()` calls gated by them are absent; the per-country postal pattern and the gift-message `maxLength` are set via `computedProps`-assigned `thisField.validation`/`thisField.restriction` using module-level stable function/array references (not rebuilt per call). Manual: steps 4 and 6-7 below. |
| AC3 (GAP 3 collapse to meta.valid gate) | Only applicable once the stale-registration fix has landed (see AC4). Code review: `formIsComplete` and the `handleSubmit`-bypassing `onSubmit` are gone, replaced by a `meta.valid`-based gate used for both the button `:disabled` and the actual submit path (i.e. `onSubmit` goes through vee-validate's `handleSubmit`, not a hand-rolled `canSubmit`). Manual: steps 8-10 below. |
| AC4 (fix not yet landed: AC3 parked) | Code review: if the stale-registration fix has not landed at implementation time, the story's Implementation notes record the park explicitly, `formIsComplete`/the `onSubmit` bypass are left in place with their existing explanatory comments untouched, and AC1/AC2's deletions still ship independently. No automated test; this is a documentation/process check on the implementation notes. |
| AC5 (every previously-verified flow still works, with screenshots) | Manual: the full checklist below, each flow screenshotted before (current `main`) and after (this story's branch), per `CLAUDE.md`'s screenshot step. |

No fixtures or test utilities from `packages/core/src/examples/` apply: this story touches no `packages/core/src/` code and adds no new test case there. `specs/components.md` needs no update (no public-surface change; this is a consumer of ST-02's `presenceValue`, already documented by ST-02).

### Code-review checklist (static, run against the diff)

- `markChildlessBranchActive` function definition and all three call sites gone.
- `createChangeTracker`, `giftMessageActiveChanged` (module scope) and `countryChanged` (inside `createAddressFields`) gone, along with the `vatNumberIsActive`/`giftMessageIsActive`/`currentCountry`/`postalIsActive` closures that outlive their own toggle logic once the trackers are removed (per the story's own edge case note). Confirm nothing still reads a now-deleted closure.
- The `validateField()` call inside `splitPaymentCoverage`'s `computedProps` is untouched: it is not driven by `createChangeTracker` and is explicitly out of AC2's deletion list (it exists because that field's own `validation` closure reference never changes, so no rule-rebuild revalidation would otherwise fire for it). A literal "no `validateField()` call anywhere in the file" read of AC2 would wrongly flag this call for removal; AC2's own wording scopes the deletion to the calls `countryChanged`/`giftMessageActiveChanged` drove, which this is not one of. Confirm this call stays.
- The postal pattern and gift-message length are each assigned to `thisField.validation`/`thisField.restriction` through a `computedProps` run, and the function/array identity used is a stable, module-level (or closure-stable) reference, not a fresh literal built inside the `computedProps` callback. This is the one case in the codebase meant to demonstrate the ST-01 guard working correctly; a fresh-literal regression here would defeat it silently (no test would catch it, since docs/ has no test runner) and should be caught in review by checking the reference is declared outside the callback body.
- Each deleted workaround's explanatory comment disappears with the code it annotated (the story's own acceptance signal for "this workaround is now deletable").

### Manual verification checklist (run before implementation on `main` for a baseline screenshot, then after this story's change)

Run the docs site locally (`pnpm docs:dev`) and open the checkout example page for every step. Use `TZ=Europe/Amsterdam` is not relevant here (no date/time logic in this file).

1. Select "Express checkout". Submit. Expect: success banner, no "Express is required" error, submitted values carry the branch's marker.
2. Select "Home delivery" as the shipping method inside the manual flow, fill every other required field, submit. Expect: success, no required error on the home-delivery branch.
3. Select "PayPal" as the payment method inside the manual flow (split payment off), fill every other required field, submit. Expect: success, no required error on the PayPal branch.
4. Toggle "Split your payment across multiple methods" on: the single payment-method choice disables and any previously selected method is deselected and cleared from values. Toggle it off: the choice re-enables and is selectable again.
5. Toggle "I am ordering as a business" on with an invalid VAT number: error shows. Toggle it off: the VAT error stands down immediately with no leftover error.
6. Toggle "Add a gift message" on, type more than 200 characters: length error shows. Toggle the checkbox off: the error stands down immediately with no manual revalidation trigger visible in the file.
7. On the delivery address, enter a postal code valid for the Netherlands, then switch country to Germany without touching the postal field again: the field now fails against the German pattern immediately (no extra keystroke needed to trigger revalidation). Fix it to a valid German code: error clears. Repeat switching to "Other".
8. With the form incomplete, confirm the "Place order" button is disabled.
9. Fill in every required field across contact, address, shipping, payment, and billing (leaving business/split-payment/gift-message off), confirm the button enables only once the form is actually complete, submit, and confirm success.
10. If the stale-registration fix has landed (AC3 path): reproduce the scenario the feature spec names, switch away from a branch containing a nested explicit choice (e.g. select payment method "Klarna" inside manual, then switch to split payment, or switch shipping/payment choices around), fill the rest of the form completely, and confirm submit succeeds (no silent refusal) and the button's enabled state agrees with the successful submit.
11. "Place another order" after a successful submission resets the form to its initial state (billing still defaulted to "same as shipping").

Screenshot the button state and the "engine aggregate" debug block (`Valid (engine aggregate): {{ meta.valid }}`) for at least steps 8 and 9, before and after, since AC3's change is specifically about what drives that state.

### Coverage

No change to `pnpm -r ci:test:coverage`'s measured surface: `docs/` is not part of the coverage-measured workspace, so this story can neither raise nor lower the baseline. No code under `packages/core/src/` is touched or newly left uncovered.

### Time sensitivity

Not applicable. The file contains no date/time-dependent logic.

### Regression risk

- Touches only `docs/.vitepress/theme/components/CheckoutFormExample.vue`. No `packages/core/src/` file changes, so no risk to the library's own test suite.
- Depends entirely on ST-01 (GAP 2 rule rebuild), ST-02 (`presenceValue`), and ST-03 (live `meta.valid`, stale-registration fix) being correct; their own test suites (`DynamicFormItem.*.test.ts`, `DynamicFormItemChoice.*.test.ts`, `DynamicFormItemArray.*.test.ts`, and ST-01's analytics regression test) are what guards the engine behavior this story's manual checks exercise end to end. A failure surfacing during this story's manual verification (e.g. the postal field not revalidating on country switch) most likely means an ST-01/02/03 regression, not a bug in this story's own edit, and should be routed back there.
- `CheckoutFormExample.vue` belongs to `FEAT-001-shopify-style-checkout-example` (`status: in-progress`), so a concurrent FEAT-001 change to the same file is the main merge-conflict risk; no FEAT-001 story was found editing it at the time of this plan, but re-check before implementing.
- The split-payment ledger math, order summary, and sticky cart layout are explicitly out of scope and should render unchanged; a visual diff limited to the touched regions (choice branches, postal field, gift message, submit button/debug block) is sufficient.

### Untestable-as-written / rewrite flags

- AC1-AC4's code-structure clauses ("X is deleted entirely", "Y declares Z instead") have no automated test target in this repo, since `docs/` has no test runner. This is not a defect in the criteria themselves (they are precise and checkable by reading the diff); it only means their "test" is necessarily the code-review checklist above, not a `*.test.ts` file. No rewrite proposed; flagging so the adversarial reviewer and developer don't expect a test file that cannot exist under current project structure.
- AC2's "no manual `validateField()` call anywhere in the file" is slightly broader than its own intent (removing only the calls `countryChanged`/`giftMessageActiveChanged` drove) and, read literally, would also flag the unrelated, legitimately-retained `validateField()` call inside `splitPaymentCoverage`'s `computedProps`. Proposed tightened wording for the feature/story text if Jeroen wants it precise: "...and the manual `validateField()` calls they drove are deleted (the independent `validateField()` call inside `splitPayment`'s coverage field, which GAP 2 does not cover, is retained)." Not blocking: the code-review checklist above already resolves the ambiguity without a spec edit.

## Adversarial review

Lite, story-level (blockers first). Grounded in the actual file `docs/.vitepress/theme/components/CheckoutFormExample.vue` and verified against the approved feature design. Code claims confirmed: three `markChildlessBranchActive` call sites (lines 291, 369, 419), two `createChangeTracker` call sites (`giftMessageActiveChanged` line 272, `countryChanged` line 785), and exactly three `validateField()` calls (line 525 `splitPaymentCoverage`, line 561 gift-message, line 826 postal).

1. **[SHOULD-FIX] AC2's "no manual `validateField()` call anywhere in the file" is literally unsatisfiable and could mislead the developer into deleting a legitimate, functionally-required call.** The `validateField()` at line 525 inside `splitPaymentCoverage`'s `computedProps` is not driven by `createChangeTracker`, is out of GAP 2's scope (that field's own `validation` closure reference never changes, so no rule-rebuild revalidation fires for it), and must stay; `validateField` also stays destructured from `useDynamicForm`. A literal read of AC2 forces both to be removed, which would break live split-payment coverage revalidation (a flow AC5 requires to still work). The QA plan already caught this and proposed tightened wording; I adopt it. Routed as a PROPOSED edit in AC2: scope the deletion to the two change-tracker-driven calls (lines 561, 826) and describe the postal outcome as "no manual `validateField()` call driving that revalidation" rather than "anywhere in the file". Does not force discussion (concrete fix written in).

2. **[NIT] The `CheckoutFormValues` type declares the childless branches as `Record<string, never>` (e.g. `homeDelivery?`, `payPal?` lines 31/37) while the marker value written is `true`.** This is pre-existing (today's `markChildlessBranchActive` also writes `true`) and `presenceValue: true` reproduces it exactly, so the submitted/reloaded shape is unchanged and `selectedShipping`'s `'homeDelivery' in shippingMethod` check (line 176) is value-agnostic: AC1's "succeeds exactly as before" holds. Out of this story's scope, but the developer could tidy the three branch types to `true` while they are in the file. Not blocking.

No blockers found. Story is consistent with the approved feature design ("Checkout-example cleanup" section and the open-question-7 DECIDED entry), ACs are testable and mapped (code review plus the manual checklist, correctly, since `docs/` has no test runner), and dependencies on ST-01/ST-02/ST-03 plus the AC3/AC4 conditional on the stale-registration fix are explicit.

## Implementation notes

All changes are in `docs/.vitepress/theme/components/CheckoutFormExample.vue`. No `packages/core/src/` change, no changeset.

**AC1 (GAP 1).** `markChildlessBranchActive` and its three call sites (`express`, `homeDelivery`, `payPal`) are deleted; each of those branches now declares `presenceValue: true` directly in its metadata. Verified by browser automation: selecting each branch and submitting (combined with the other required fields) still succeeds.

**AC2 (GAP 2), including the adversarial review's tightened wording.** `createChangeTracker`, `giftMessageActiveChanged`, `countryChanged`, and the two manual `validateField()` calls they drove are deleted. The independent `validateField()` call inside `splitPaymentCoverage`'s `computedProps` is untouched, and `validateField` stays destructured from `useDynamicForm`, exactly as the tightened AC2 requires. The per-country postal pattern now lives in a `POSTAL_VALIDATIONS` record of three stable, module-level functions (one per country key), swapped onto `thisField.validation` from `computedProps`; a shared `noOpValidation` stands the rule down while the field is hidden. The gift-message length now lives entirely in a single stable `GIFT_MESSAGE_RESTRICTION` object swapped onto `thisField.restriction`, relying on the engine's own `xsd_maxLength` rule instead of a hand-rolled `giftMessageValidation` function (now deleted); the field's `validation` property is gone. Verified live in a browser: switching delivery country from Netherlands to Germany without touching the postal field immediately flips it invalid against the German pattern, and fixing it clears the error, with no manual `validateField()` call involved.

Deviation (not in the story's literal AC2 text, but named in its own Edge Cases section): the module-level `vatNumberIsActive` closure is also collapsed, converting the VAT field to the same stable-function-swap pattern (`vatValidation` / `noOpValidation`) as postal, since the story's Edge Cases paragraph names `vatNumberIsActive` alongside the other three as a closure that "collapses once `createChangeTracker` is removed" even though it was never read by a tracker. Treated as in-scope cleanup rather than a deviation requiring feature-spec amendment, since it is explicitly named in the approved story text and only tightens the demonstrated pattern; flagged here for visibility.

**AC3 / AC4 (GAP 3).** The stale-registration fix has NOT landed: it was split out of ST-03 into `specs/QUICK-004-stale-choice-anchor-registration/spec.md`, whose own status is `draft` (not implemented, not approved). Per AC4, the GAP 3 collapse of `formIsComplete`/`onSubmit` is explicitly parked: both are left completely untouched, including their existing explanatory comments. Those existing comments already describe the observable symptom (a choice's own aggregate `meta.valid` getting stuck invalid after branch activation, and `handleSubmit` silently refusing a genuinely complete order because of stale registrations left behind by an unmounted branch) without referencing any spec, so no additional comment was needed to satisfy the "point at the symptom, not the spec id" requirement. AC3 does not apply yet.

**Manual verification.** Automated per-flow checks were run against a live `pnpm docs:dev` instance using Playwright (Chromium, headless) in this sandbox, since no local browser UI is available here: express submit, manual + home delivery + PayPal submit, postal NL-to-DE live revalidation (screenshotted), gift-message toggle/length stand-down, VAT toggle/pattern stand-down, and split-payment toggle disabling/re-enabling the single payment choice. All passed. Two items from the QA plan's manual checklist still need a human verifier with a real browser and both VitePress color modes: step 10 (the nested-choice-switch submit scenario naming the stale-registration bug directly; expected to still silently refuse per the parked AC4 state, which is correct until QUICK-004 ships) and step 11 ("Place another order" resetting the form). Pickup-point and pure visual/dark-mode review were only spot-checked (one full-page screenshot each in light and dark mode of the initial page), not exhaustively re-screenshotted per step, since this story introduces no new visual surface (Design reference: None).

`pnpm run ci:test`, `pnpm run ci:lint` (via `eslint` run explicitly against the changed file, since `pnpm -r ci:lint` only lints within each workspace package and does not reach `docs/`), `pnpm run ci:typecheck`, `pnpm -r ci:test:coverage`, and `pnpm docs:build` all pass with no changes needed. Coverage is unchanged (this story touches no `packages/core/src/` file).

## Verification report

### Pipeline checks

All run against this worktree's current state (includes ST-01/ST-02/ST-03's already-landed engine changes, which this story depends on).

| Check | Result |
| --- | --- |
| `pnpm run ci:test` | Pass. 945 tests, 36 files, `packages/core`; 1 test `packages/element-plus`. |
| `pnpm run ci:lint` (`pnpm -r ci:lint`, scoped to workspace packages, does not reach `docs/`) | Pass, no findings. |
| `npx eslint docs/.vitepress/theme/components/CheckoutFormExample.vue` (run explicitly against the changed file, since `ci:lint` does not reach `docs/`) | Pass, no findings. |
| `pnpm run ci:typecheck` | Pass. |
| `pnpm -r ci:test:coverage` | Pass. No drop; `docs/` is outside the measured workspace, so this story's change cannot move the baseline either way. |
| `pnpm docs:build` | Pass, build completed in 5.40s. |

### Acceptance criteria

| AC | Verdict | Evidence |
| --- | --- | --- |
| AC1 (GAP 1 deletions, childless branches submit) | Pass | `grep` for `markChildlessBranchActive` in the file returns nothing. `express` (line 288), `homeDelivery` (line 367), `payPal` (line 417) each declare `presenceValue: true` in place of the old computedProps marker. Developer's Implementation notes report browser-verified submit for each branch; could not independently re-run Playwright in this session (no Chromium binary present at the documented `/opt/pw-browsers/chromium` path, or anywhere else searched, in this sandbox), so this rests on the developer's reported evidence plus the unchanged surrounding submit logic (`onSubmit`/`canSubmit`, untouched per AC4). |
| AC2 (GAP 2 deletions, live per-country/gift-message revalidation, tightened wording) | Pass | `grep` for `createChangeTracker`, `giftMessageActiveChanged`, `countryChanged`, `giftMessageValidation`, `vatNumberIsActive`, `currentCountry`, `postalIsActive`, `giftMessageIsActive` all return nothing. Exactly one `validateField()` call remains in the file (line 523, inside `splitPaymentCoverage`'s `computedProps`), matching the tightened AC2 exactly; `validateField` stays destructured from `useDynamicForm` (line 154). Postal pattern now lives in module-level `POSTAL_VALIDATIONS` (lines 632-636) and a shared `noOpValidation` (line 641), swapped onto `thisField.validation` (line 780) by stable reference, not rebuilt per call. Gift-message length lives in one module-level `GIFT_MESSAGE_RESTRICTION` object (line 128), swapped onto `thisField.restriction` (line 551), also a stable reference. Same reference-stability pattern applied to the retained VAT field (lines 341-349, see deviation note below). Live revalidation claim (NL to DE postal, no manual trigger) rests on the developer's reported browser verification; same sandbox limitation as AC1 applies. |
| AC3 (GAP 3 collapse to meta.valid gate) | N/A, correctly | QUICK-004 (`specs/QUICK-004-stale-choice-anchor-registration/spec.md`) status is `draft`, not approved/implemented: the stale-registration fix has not landed. AC3 does not apply yet; confirmed directly against the QUICK spec file rather than taking the Implementation notes' word for it. |
| AC4 (fix not landed, AC3 parked) | Pass | `formIsComplete` (lines 208-259) and the `handleSubmit`-bypassing `onSubmit` (lines 587-592) are untouched, with their original explanatory comments intact and pointing at the observable symptom (stuck choice `meta.valid`, silent submit refusal from stale registrations) rather than any spec/story/gap id. AC1/AC2's deletions shipped independently of this park, confirmed above. Implementation notes state the park plainly and name the exact QUICK spec and its status. |
| AC5 (every previously-verified flow still works, with screenshots) | Pass-with-notes | Code review shows nothing in the touched regions (split-payment toggle, VAT, gift message, postal, submit gate) changed its externally observable behavior, only how each rule set is sourced/swapped. Developer's Implementation notes report a full Playwright pass of express/manual+home-delivery/PayPal submit, postal NL-to-DE live revalidation (screenshotted), gift-message toggle/length stand-down, VAT toggle/pattern stand-down, and split-payment toggle disable/re-enable, all in a headless sandbox. Two manual-checklist items remain genuinely unverified by anyone yet: step 10 (nested-choice-switch submit scenario; expected outcome is still a silent refusal until QUICK-004 ships, since AC3/GAP 3 is parked) and step 11 ("Place another order" reset). Both VitePress color modes also still need a human pass (developer reports only one light/one dark full-page screenshot of the initial, unexpanded page state, not per-step). I could not independently re-run any of this myself: no Chromium binary is available in this verification sandbox (checked `/opt/pw-browsers/chromium` per `CLAUDE.md` and searched the filesystem broadly; only the `playwright` npm package itself is present under `playgrounds/storybook/node_modules`). This is an environment gap, not a developer defect. |

### Prototype / visual comparison

Design reference is explicitly "None" (docs-only cleanup, no new visual surface), and this holds: every edit is inside `<script setup>` (rule sourcing, deletions), with the only template-adjacent line touched being none at all, the `<template>` block (lines 799-853) is byte-identical in intent to what AC1-AC4 require, no new slot, element, or layout change. Sibling stories (ST-01/ST-02/ST-03) are engine-only; nothing to compare against visually there either.

### Process compliance

- `specs/components.md`: no entry change needed and none made; no public-surface change (this story consumes ST-02's already-documented `presenceValue`).
- No changeset added for this story's `docs/`-only change, correct per `CLAUDE.md`'s changeset rule. The three changesets present in the working tree (`choice-selection-reset.md`, `computed-props-rule-rebuild.md`, `export-is-path-in-section.md`) belong to ST-01/ST-02/ST-03's `packages/core/src/` changes, not this story.
- No new exports, no `packages/core/src/` touched by this story.
- No spec/process references in code comments or identifiers anywhere in the touched file (checked by grep for `FEAT-010`, `ST-0`, `GAP 1/2/3`, `QUICK-004`): none found, consistent with `CLAUDE.md`'s code-comment rule.
- Deviation disclosed and judged: collapsing `vatNumberIsActive` to the same stable-function-swap pattern (`vatValidation`/`noOpValidation`) is not literally named by AC2's text but is explicitly named in the story's own Edge Cases paragraph ("the module-level `vatNumberIsActive`/... mutable closures collapse once `createChangeTracker` is removed"), and only extends the same pattern the story already mandates for postal, strictly tightening consistency rather than introducing new behavior or scope. This is in-scope cleanup under the story's own text, not a silent override of an approved feature-level decision, and does not require a feature-spec amendment. Agreed with the developer's own framing.
- No undocumented spec deviations found beyond the one disclosed above.

### Verdict: pass-with-notes

All automated pipeline checks are green, every code-review checklist item in the QA plan is independently confirmed against the diff (not just taken on the developer's word), AC1/AC2/AC4 are satisfied with direct evidence, AC3 correctly does not apply (confirmed against QUICK-004's actual `draft` status rather than trusting the claim), and the one named deviation is sound and properly disclosed. The "notes" in this pass are entirely about verification depth, not defects: this sandbox has no Chromium binary, so I could not independently re-run the Playwright flows or take comparison screenshots myself, and two manual-checklist items (step 10, step 11) plus a full color-mode pass were already flagged by the developer as needing a human with a real browser. Recommend Jeroen (or whoever has a working browser environment) runs the QA plan's manual checklist steps 10 and 11, and a light/dark pass over the touched regions (postal field, gift message, VAT, split-payment toggle, submit button/debug block), before merging. None of this blocks marking the story `done`: the file-level work is complete, correct, and compliant; what remains is confirmatory manual QA that no agent in this environment (developer or verifier) has the tooling to perform.
