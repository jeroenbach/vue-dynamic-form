---
id: ST-02
type: story
feature: FEAT-001
status: done
approved_by: Jeroen
pr: ""
---

# Story: Baseline checkout metadata tree and example host

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- QA open values → home-delivery fee 4.95 (total 253.45), NL/DE/Other postal regexes and the EU-shape VAT regex pinned in the QA plan
- Review blocker 1 → AC4's mapping reworded per the routed PROPOSED edit; `hide` is pinned as `v-show` (the docs theme convention), recorded in ST-01 as part of the template contract
- Review nits 3 and 4 → binding developer guidance recorded: selects declare both `options` and `restriction.enumeration`; the VAT-included cart line stays static and labeled as part of the subtotal

## Assumed without Jeroen (no clear winner)

Ties broken by policy during story prep, not decided on the merits. Each names its alternative inline.

- Review should-fix 2 → pristine cart shows a "select a shipping method" placeholder, no pickup preselect (reversible: local edit to the shipping node and AC9)

## Functional
### User story
As a docs reader evaluating the library, I want to interact with the full one-page baseline checkout (express or manual entry, contact details, a delivery address with per-country postal validation, an optional business/VAT section, a shipping method with a nested pickup field, a single payment method choice, an optional gift message, a billing "same as shipping" toggle, a sticky order summary, and a submit flow with a success state), so that I can see the metadata-driven checkout working end to end before the split-payment finale is layered on.

### Acceptance criteria

1. Given the checkout loads, When the express/manual choice is shown, Then neither branch is pre-selected, and selecting "manual" then switching back to "express" and back to "manual" again restores whatever was typed into the manual branch (`preserveOnSwitch: true`).
2. Given the manual branch is active, When an invalid email is entered and the field loses focus, Then the rose invalid state and message appear, and correcting it to a valid pattern resolves to the valid state.
3. Given the delivery address country is changed between Netherlands, Germany, and Other, When a postal code is entered, Then the pattern, placeholder, and error message update to match the selected country (NL 4-digit + 2-letter format, DE 5-digit format, Other a relaxed generic pattern) and previously valid values in the wrong format are flagged invalid after the switch.
4. Given the business toggle is off, When the form renders, Then the company and VAT fields are hidden and not required; When the toggle is turned on, Then both fields appear and become required, and an invalid VAT value shows its error only while the toggle is on.
5. Given the shipping method choice, When "pickup point" is selected, Then a pickup-point select field mounts; When "home delivery" is selected, Then no pickup-point field is rendered.
6. Given the payment method choice, When each of card, iDEAL, PayPal, and Klarna is selected in turn, Then each branch shows its own fields (card inputs, a bank select, no extra fields, an installment-plan enumeration of 3/6/12 months respectively) and no other branch's fields remain mounted.
7. Given the gift message is revealed via its "+ Add a gift message" link, When text is typed past its configured `xsd_maxLength`, Then the field shows the invalid state and message from ST-01's counter wiring, now driven by real validation.
8. Given the billing "same as shipping" toggle is on (default), When it is turned off, Then the same address field set and per-country postal `computedProps` used for delivery render again at the billing path, independently valid/invalid from the delivery address.
9. Given the order summary, When no shipping method is selected yet, Then the shipping line shows a muted "select a shipping method" placeholder and the total reads 248.50 (equal to the subtotal); When pickup is selected, Then the shipping line reads 0.00 and the total reads 248.50; When switched to home delivery, Then the shipping line updates live to reflect the home-delivery fee and the total updates to match.
10. Given the form is invalid (e.g. a required field empty), When the place-order button is shown, Then it is disabled; Given the form is valid, When submit is clicked, Then the button shows a spinner and disables during submission, then the success banner appears with the "demo only, nothing was charged" note.

### Edge cases
- Switching country after an invalid postal value was entered re-validates against the new pattern rather than silently clearing the field.
- Turning the business toggle off after entering company/VAT data hides but does not forcibly wipe those fields' values (consistent with `hide`-driven conditional visibility, not removal).
- Billing toggled off then back on returns to the "same as shipping" state without leaving orphaned billing data visible.
- Klarna's installment select has no default selection; it is required before submit succeeds.

### Out of scope
- The split-payment section entirely: its metadata node, ledger rendering, reordering, and coverage gate (ST-03).
- Docs page narrative, citations, and the inline TOC (ST-04).
- Nav/sidebar entries and the `advanced.md` cross-link (ST-05).
- Registering the host component in `enhanceApp` and embedding it in a `.md` page (ST-04 owns the page that first embeds it).

## Design reference
Implements, with real checkout data and wiring, the prototype sections (`../../prototype.html`): `#express-choice`, `#contact`, `#delivery-address` (all three country states), `#business-toggle`, `#shipping-method`, `#payment` (all four branches), `#gift-message`, `#billing-toggle`, `#order-summary`, `#submit` (ready/blocked/submitting/success states).

Delta left open for this slice: the exact two-column grid breakpoint behavior (`.checkout-layout` stacking below 960px) is implemented here as the layout owned by the host component, since the feature architecture assigns that grid to `CheckoutFormExample.vue`; the VitePress `aside: false` frontmatter and page-scoped width override that make room for it are ST-04's delta on the `.md` page, not this component.

## Architecture reference
Builds, from the feature architecture's component plan:
- `docs/.vitepress/theme/components/CheckoutFormExample.vue` (new): calls `useDynamicForm`, declares the full baseline metadata tree described above (excluding `splitPayment`, added by ST-03), owns the order-total constant, `handleSubmit`, the success/reset flow, and the two-column layout grid pairing the form column with the sticky cart. Renders `DynamicForm` with `CheckoutFormTemplate` inside a `<form>`.
- `docs/.vitepress/theme/components/OrderSummary.vue` (new): the sticky cart, static line items, and the shipping line reacting live to `values`.
- The per-country postal `computedProps` reads `thisField.parent.path` (not an absolute path) so the same address fragment can later be mounted at both the delivery and billing paths (ADR-4); this story defines and proves that fragment at the delivery path and reuses it unchanged at the billing path.
- Extends `CheckoutFormTemplate.vue` from ST-01 only by using its existing slots with real metadata; no new slot shapes are added in this story.

No `packages/core/src/` change and no changeset in this story.

Dependencies: depends on ST-01 (the template's rendering contract must exist first). ST-03 and ST-04 depend on this story.

## QA plan

### Testing landscape for this slice

This story adds two new files, both under `docs/.vitepress/theme/components/`: `CheckoutFormExample.vue` and `OrderSummary.vue`. No `packages/core/src/` file changes (confirmed by the Architecture reference), so none of this story's behavior is new engine code; it is a specific metadata tree plus a thin host wired entirely onto already-tested primitives (`choice`, `computedProps`, `xsd_pattern`/`xsd_enumeration`/`xsd_maxLength`, `useDynamicForm`'s `handleSubmit`/`values`).

`docs/` is excluded from the pnpm workspace (`pnpm-workspace.yaml` lists only `packages/*`), has no `vitest` devDependency, no `vitest.config`, and no `__tests__/` anywhere under `docs/.vitepress/theme/components/`. This is not an omission specific to this story: every existing docs example component, including ones with comparable or greater logic (`FormExampleClientOnboardingPlanner.vue`'s conditional `computedProps` chains, `FormExampleChoiceExplicitRepeatable.vue`'s repeatable choice, `FormExampleValidation.vue`'s cross-field rules), has zero automated test coverage today. Introducing a component-test harness for `docs/` is a tooling decision bigger than one story (new devDependency, a vitest config, a jsdom/happy-dom setup) and is disproportionate here, consistent with the precedent set by FEAT-001 ST-04's adversarial review ("introducing a snippet-type-check harness for one docs story would be disproportionate"). This plan therefore treats every acceptance criterion as a **manual** verification against a running `docs:dev` instance, backed by the mechanical checks that *do* exist for `docs/` today: `pnpm docs:build` (VitePress build, dead-link check), `npx vue-tsc --noEmit -p docs/tsconfig.json` (type-checks every file under `.vitepress/**/*` whether or not it is imported anywhere, per `docs/tsconfig.json`'s `include`), and `npx eslint docs/.vitepress/theme/components/CheckoutFormExample.vue docs/.vitepress/theme/components/OrderSummary.vue` (root `eslint.config.js` has a dedicated `docs/**/*.vue` block, so linting these files does not require the pnpm-workspace-scoped `pnpm lint`).

If a future story or quick spec wants automated coverage for docs examples, that is a tooling decision to raise separately; it is out of scope to introduce here silently.

**Manual-verification access gap, specific to this story.** Per Out of scope, this story does not register `CheckoutFormExample` in `enhanceApp` and does not embed it in any `.md` page (ST-04 owns both). That means there is, by design, no committed page anywhere that renders this component when this story alone is implemented. To execute the manual checklist below, the developer/qa-verifier must temporarily register the component (e.g. a throwaway line in `docs/.vitepress/theme/index.ts`) and embed it on a scratch page (e.g. a temporary `docs/examples/__scratch-ST-02.md`, not committed), exactly the same throwaway-and-delete pattern already used in this project for manual docs verification (FEAT-001 ST-04's scratch `vue-tsc` file, deleted and confirmed via `git status` before merge). **Both the scratch registration and the scratch page must be removed before this story's diff is finalized**; `git status` must show only `CheckoutFormExample.vue`, `OrderSummary.vue`, and this spec file (plus any shared fixture docs components this story legitimately touches) once verification is done. This is called out again under Regression risk and the Manual verification checklist so it is not missed.

### Fixtures and fields whose exact values are an implementation choice

The story and feature spec describe several validation rules by shape, not by exact regex or number, and no existing docs component defines them either (the closest precedent, `FormExampleClientOnboardingPlanner.vue`'s `email` field, uses a `^.+@.+\..+$` style pattern for a *different* field). This plan's test values are illustrative and must be read against whatever exact pattern the developer documents in Implementation notes, not pinned numbers:
- Contact email `xsd_pattern`: reuse the same style of pattern already used for `email` elsewhere in the docs theme (`FormExampleClientOnboardingPlanner.vue`'s `projectContacts[].email`), unless the developer has a reason to diverge; record the exact pattern used.
- NL postal (4 digits + 2 letters, e.g. `1015 CJ`), DE postal (5 digits, e.g. `10115`), Other (relaxed, 2-10 letters/digits/spaces/dashes): exact regex is an implementation choice; record it.
- VAT number pattern: the prototype shows an invalid example (`NL00123`) and a generic message ("Enter a valid VAT number") but no concrete pattern is pinned anywhere in the feature spec. Record the exact pattern used; AC4's test below treats "some value that is invalid under the chosen pattern" and "some value that is valid under it" generically for this reason.
- Home-delivery shipping fee: the prototype states 4.95 for home delivery (`#shipping-method`'s branch description) and the Design decisions pin only the pickup-state summary (Subtotal 248.50, Shipping 0.00, VAT included 43.13, Total 248.50). AC9's home-delivery total is therefore checked as "updates live to total + the configured home-delivery fee" (248.50 + 4.95 = 253.45 using the prototype's stated fee), not as a second DECIDED total figure; if the developer uses a different fee, update the illustrative number accordingly and keep the arithmetic identity (Subtotal + Shipping = Total) intact.

These are flagged here, not invented, per the instruction to raise missing information rather than guess at it; see "Open questions for the architect/developer" at the end of this section.

### Acceptance criteria -> verification mapping

All verification below is manual against the scratch-embedded component in `pnpm docs:dev`, in both light and dark VitePress color modes (toggle in the nav), unless noted as mechanical.

1. **Express/manual choice, `preserveOnSwitch: true`.**
   Manual: load the scratch page, confirm neither "Express checkout" nor "Enter details manually" card shows selected (matches prototype `#express-choice`'s "default, nothing selected" state). Select manual, type distinguishing values into at least two manual-branch fields (e.g. full name and email), switch to express (confirm the express branch's inert note renders and the manual form unmounts), switch back to manual, and confirm both typed values are restored exactly as typed. Cross-check against the shipped `preserveOnSwitch` behavior already proven generically in `packages/core/src/components/__tests__/DynamicFormItemChoice.*.test.ts` and demonstrated live in `FormExampleChoicePreserveOnSwitch.vue`; this story is responsible only for setting the flag on the right node, not for re-proving the engine mechanism.

2. **Manual branch: invalid email -> rose state -> corrected -> valid state.**
   Manual: type an email missing the `@`/domain shape (e.g. `anna.devries@`), blur the field, confirm the rose border and an error message render (matches prototype `#contact`'s invalid state). Correct it to a valid address (e.g. `anna.devries@example.nl`), confirm it resolves to the subtle emerald border with no message. Confirm the pristine state (before any blur) shows no color beyond the Required tag.

3. **Delivery address: per-country postal `computedProps`.**
   Manual, three sub-checks:
   - NL selected, type a valid NL-shaped postal code: emerald valid state, correct placeholder/hint shown (matches `#delivery-address`'s NL state).
   - Switch country to Germany without changing the postal value: the same value, now evaluated against the DE pattern, must immediately show invalid (rose + DE-specific message), proving the switch re-validates rather than silently clearing (edge case 1). Then enter a valid DE-shaped value and confirm it resolves to valid.
   - Switch country to "Other": pattern/placeholder relax to the generic fallback; a value that would fail both NL and DE patterns but satisfies the relaxed one validates.

4. **Business toggle: conditional visibility + conditional validation.**
   Manual: with the toggle off, confirm company/VAT are hidden via the `hide`/`v-show` convention (present in the DOM but `display:none`, per the DECIDED pin below), are not required (their `minOccurs` is 0 so they never block submit), and that a previously typed value survives a toggle-off/toggle-on round trip. Turn the toggle on: both fields appear and show the Required tag. Type an invalid VAT value (per the chosen pattern) and confirm the rose state and message appear only while the toggle is on.

   DECIDED (research): The PROPOSED reword below is adopted (applied above), and the open half of it is pinned: `CheckoutFormTemplate` implements `hide` as `v-show`, matching the docs theme's existing convention (`AdvancedFormTemplate.vue` lines 142/218/268/286/304) and the value-preservation semantics edge case 2 and billing edge case 3 depend on. Recorded in ST-01 as well, since the template owns the channel.
   Sources: AdvancedFormTemplate.vue (the existing hide convention), feature metadata mapping (business toggle drives `hide` + `minOccurs`)

   PROPOSED (adversarial review): rewrite this mapping so it does not demand "not rendered at all (not just visually hidden)". The feature architecture drives this section through `computedProps` setting `hide` + `minOccurs`, and the docs theme implements `hide` as `v-show` (`AdvancedFormTemplate.vue` lines 142/218/268/286/304), which keeps the field mounted in the DOM at `display:none` and preserves its value. That is exactly what edge case 2 ("hides but does not forcibly wipe those fields' values, not removal") requires, and it is the pattern this story reuses unchanged. "Not rendered at all" is only true for a choice-branch unmount (AC5's pickup field), not for a `hide`-driven field, so the two halves of this AC4 check cannot both hold. Proposed wording: "with the toggle off, confirm company/VAT are hidden (via the `hide`/`v-show` convention: present but `display:none`, or `v-if`-removed only if ST-01's template chose `v-if` + `keepValueOnUnmount`), are not required (their `minOccurs` is 0 so they never block submit), and that the previously typed value survives a toggle-off/toggle-on round trip." Confirm with ST-01 which conditional-visibility channel (`v-show` vs `v-if`) `CheckoutFormTemplate` actually implements, since ST-01 leaves that unpinned and AC4 + edge case 2 + billing edge case 3 all depend on it.

5. **Shipping method choice: pickup mounts a nested field, home delivery does not.**
   Manual: select "Pickup point", confirm the pickup-point `<select>` mounts with its options. Switch to "Home delivery", confirm the pickup-point field fully unmounts (not just hidden: check it is absent from the rendered DOM via browser devtools, not merely `display:none`).

6. **Payment choice: four branches, mutually exclusive mounting.**
   Manual: select each of card, iDEAL, PayPal, Klarna in turn. For each, confirm only that branch's fields are present in the DOM (devtools inspection, not CSS) and the previous branch's fields are gone: card shows card number/expiry/CVC inputs plus the inert-field disclaimer; iDEAL shows a bank `<select>`; PayPal shows no extra fields (only its info banner); Klarna shows the 3/6/12-month installment `<select>` with no default selection (edge case 4), and confirm submit stays blocked while no plan is chosen.

7. **Gift message: reveal + `xsd_maxLength` wired to the counter from ST-01.**
   Manual: click "+ Add a gift message", confirm the textarea and counter mount (reusing ST-01's counter chrome). Type past the configured `xsd_maxLength`, confirm the counter and field both flip to the invalid state and message. This is the one AC that directly depends on ST-01's shipped chrome actually being driven by real validation now, rather than a cosmetic character count; confirm the invalid state is the same one `useField`'s real validation state produces (i.e. check `meta.valid` for that field via the devtools Vue inspector, or temporarily render `meta`/`values` debug output on the scratch page as the other docs examples already do), not just that the counter's own local arithmetic happens to agree.

8. **Billing "same as shipping" toggle: reused address subtree, independently valid/invalid.**
   Manual: confirm billing is hidden by default (toggle on). Turn it off: confirm the same field set and per-country postal behavior from AC3 is available again at the billing path (repeat at least the NL-valid and DE-after-switch-invalid checks from AC3, against billing this time). Make delivery's postal invalid and billing's postal valid (or vice versa) and confirm each path's validity is independent (one invalid does not affect the other's state). Toggle billing back on, then off again: confirm it returns to blank/"same as shipping" with no stray previously-entered billing data visible (edge case 3).

9. **Order summary reacts live to shipping method.**
   Manual: before any shipping method is selected, confirm the cart's shipping line shows the muted "select a shipping method" placeholder and the Total reads 248.50 (equal to Subtotal). Select pickup, confirm the line reads Shipping (pickup) 0.00 and Total 248.50. Switch to home delivery, confirm the shipping line updates to the configured fee and the total updates to Subtotal + the new shipping line (see the fixtures note above for the exact figure), without a page reload or any visible flash, live as the choice changes.

   PROPOSED (adversarial review): resolve the pristine/default contradiction before this is verified. This mapping calls pickup the "default" and asserts the cart reads Shipping 0.00 / Total 248.50 at rest, but the States policy section (below) lists shipping under "Default/pristine ... nothing pre-selected until chosen", and AC1 establishes that the whole manual branch (which contains the shipping choice) is not even mounted until "manual" is picked. Since `OrderSummary` reads `values` live, the shipping line and total are undefined whenever no shipping method is selected. Pick one and make both sections agree: either (a) pre-select `pickup` as the shipping choice's default so the cart has a defined Shipping 0.00 / Total 248.50 at the moment the manual form appears (then drop shipping from the States policy "nothing pre-selected" list), or (b) keep shipping genuinely unselected and define what `OrderSummary` shows for the shipping line and total in that state (e.g. a dash / "select a shipping method" placeholder and Total shown as Subtotal 248.50), then reword AC9 to stop calling pickup the "default". Option (a) matches the prototype, which only ever draws the pickup-selected state of `#shipping-method` and an order summary that already reads "Shipping (pickup) 0.00".

   ASSUMED (story prep): Option (b) taken, applied above: shipping stays genuinely unselected and `OrderSummary` shows a muted "select a shipping method" placeholder with Total equal to Subtotal (248.50) until a method is chosen; AC9's mapping no longer calls pickup a default.
   Why: the feature's States policy ("Default / pristine: ... nothing pre-selected until chosen") is approved text and the existing choice examples all start unselected, while the prototype's pickup-selected snapshot is a labeled state, not a declared default, so the evidence leans (b) but does not strictly rule out (a).
   Tie broken on: smallest scope (option (b) only defines a display for an already-existing state; option (a) adds default-selection behaviour and requires amending the States policy).
   Alternative: pre-select pickup when the manual branch mounts (matches real checkouts and the prototype's drawn cart). Reversing is a local edit to the shipping node plus this AC's wording.

10. **Submit: disabled-when-invalid, spinner-during-submit, success state.**
    Manual, three sub-checks:
    - Make the form invalid (e.g. clear a required field) and confirm the place-order button is disabled.
    - Make the form fully valid (fill every required field in the manual branch, a payment branch, and, if Klarna is chosen, an installment plan) and click submit: confirm the button shows a spinner and becomes disabled for the duration of the (simulated) submit, then the success banner appears with the "demo only, nothing was charged" note (matches `#submit`'s four states exactly).

**Edge cases** (from Functional > Edge cases, each already folded into the AC mappings above where it naturally belongs, restated here for traceability):
- Country switch re-validates rather than clears: AC3.
- Business toggle off does not wipe company/VAT values: AC4.
- Billing toggled off then on returns to "same as shipping" with no orphaned data: AC8.
- Klarna installment has no default and is required before submit: AC6 and AC10.

### States policy (this slice)

Per the feature's states policy, every section this story renders must show, where applicable:
- **Default/pristine**: AC1 (express/manual, nothing pre-selected), AC5 (shipping, nothing pre-selected until chosen).
- **Focus**: not independently re-verified per field in this story (it is ST-01's rendering-contract concern); spot-checked once on the email field while doing AC2, since focus is hard to screenshot and easy to silently lose when a new metadata tree is wired onto existing field components.
- **Invalid**: AC2 (email), AC3 (postal, both directions), AC4 (VAT), AC7 (gift message over limit).
- **Valid**: AC2 (email), AC3 (NL postal).
- **Disabled**: AC10 (submit button while invalid and while submitting); the phone field's disabled state is ST-01's concern and not re-tested here since this story supplies data, not the rendering contract.
- **Empty**: AC5/AC6 before a branch is chosen (no nested/branch fields rendered); the collapsed gift-message and apartment-line entry points (AC7, edge case in Design reference) before their links are clicked.
- **Loading**: AC10's submitting state (spinner, disabled button) is the only async state in this story's scope, per the feature's states policy ("the only genuinely async state is submit").
- **Error (form-level)**: AC10's blocked-submit state (disabled button while invalid).
- **Success**: AC10's success banner with the demo disclaimer.

Split-payment's own amber/rose ledger states are explicitly out of scope (ST-03).

### Reactivity

This story adds no `packages/core/src/` code, so no `*.analytics.test.ts` file is added or extended; the render-count discipline in `CLAUDE.md`/the qa-planner's own instructions applies to engine source changes, and this story makes none. The underlying reactive correctness of `computedProps` (per-country postal, business/VAT, billing reuse) and `choice` branch mount/unmount is already proven generically by the existing `packages/core/src/components/__tests__/DynamicFormItem*.analytics.test.ts`/`.logic.test.ts` suites; this story's own job is only to wire real data onto those already-reactive primitives correctly, which the manual AC checks above verify directly (watching the DOM mount/unmount and update live, with no reload). AC9's "live" requirement (order summary reacting to `values` without reload) is the one place a reactivity regression would be visible in this story's own scope, and it is explicitly checked in AC9's mapping above.

### Coverage

`pnpm -r ci:test:coverage` measures `packages/core` (and `packages/element-plus`); `docs/` is outside the pnpm workspace and is not measured by that command at all. This story changes zero files under either measured package, so coverage is mathematically unaffected; confirm with `git diff --stat -- packages/` showing no change, same pattern as FEAT-001 ST-04. Running `pnpm -r ci:test:coverage` once before push is still correct practice (cheap, confirms nothing else regressed), but no baseline comparison is meaningful for this story's own diff.

### Time sensitivity

Not applicable. No date/time-dependent logic (the Klarna plan dates, migration deadlines, etc. from other examples do not appear in this story's scope).

### Regression risk

- **`CheckoutFormTemplate.vue` (ST-01)**: this story is the first to feed it a real, full-sized metadata tree instead of a minimal fixture. A regression here would most likely show up as a shape ST-01's own minimal fixture never exercised (e.g. a `choice` nested inside another `choice`'s branch, which ST-01's AC5 only tests one level deep). Guarded by re-running ST-01's own manual verification against this story's richer tree where practical, and by the AC5/AC6 mount/unmount checks above, which exercise the template under real nesting depth for the first time.
- **No other docs example or page is touched by this story** (no `.md` file, no `enhanceApp` registration survives past verification, per the manual-verification-access-gap note above). The regression surface is therefore narrow: confirm via `git status` that only `CheckoutFormExample.vue`, `OrderSummary.vue`, and this spec file changed, with no leftover scratch registration/page.
- **Downstream stories**: ST-03 extends this story's metadata tree (adds `splitPayment` as a sibling node) and ST-04 is the first to actually embed and register this component. A wrong field path or a metadata shape ST-03 cannot cleanly append to (for example, if the payment `choice` node's structure does not leave room for a sibling split-payment section) would block ST-03; the AC6 mapping's DOM-level branch-isolation check is the most relevant guard, since ST-03's ledger sits beside, not inside, the single-payment-choice node per the architecture's metadata-tree mapping table.
- **`xsd_pattern`/`xsd_enumeration`/`xsd_maxLength` rule engine itself**: unmodified; guarded by the full existing `packages/core` suite remaining green (`pnpm -r ci`), confirming this story's new metadata does not somehow trip a regression in the rules themselves (it should not, since it adds no engine code, but the full suite is cheap insurance).

### Manual verification checklist

1. Set up the temporary scratch registration + scratch page described above (not committed); run `pnpm docs:dev`.
2. Work through acceptance criteria 1-10 and the four edge cases in order, in **light mode**, following the mappings above.
3. Toggle to **dark mode** (VitePress nav toggle) and re-check at least: AC2's invalid/valid states, AC3's invalid state, AC4's invalid state, AC7's over-limit state, AC10's disabled/success states, since color-carrying states are the ones most likely to break under the dark theme's CSS custom-property swap.
4. `pnpm docs:build` completes clean (dead-link check is not exercised by this story since it adds no page link yet, but this still confirms the new files compile under the real VitePress build pipeline).
5. `npx vue-tsc --noEmit -p docs/tsconfig.json` completes clean (type-checks `CheckoutFormExample.vue`/`OrderSummary.vue` whether or not anything imports them yet).
6. `npx eslint docs/.vitepress/theme/components/CheckoutFormExample.vue docs/.vitepress/theme/components/OrderSummary.vue` completes clean (camelCase props/events, no kebab-case, per `CLAUDE.md`).
7. `grep -rn '—' docs/.vitepress/theme/components/CheckoutFormExample.vue docs/.vitepress/theme/components/OrderSummary.vue` returns no matches (em dash check).
8. Remove the scratch registration and scratch page; `git status` shows only the two new component files and this spec file changed.
9. `pnpm -r ci` and `pnpm -r ci:test:coverage` both green, confirming no regression in `packages/core`/`packages/element-plus` (expected to be a no-op diff for these packages; see Coverage above).

### Untestable-as-written / rewrite proposals

No acceptance criterion is untestable in principle; all ten reduce to a concrete manual check above. The genuine gap is tooling (no automated harness exists for `docs/`), not the criteria themselves, and that gap is flagged, not silently absorbed, in the Testing landscape note above.

### Open questions for the architect/developer (not Jeroen-level; recorded so the exact values are not invented here)

- Exact `xsd_pattern` regex for NL postal, DE postal, the "Other" relaxed fallback, and the VAT number field are not pinned anywhere in the feature spec beyond illustrative examples. Record the chosen patterns in Implementation notes so this plan's illustrative test values can be matched against the real ones during verification.
- The home-delivery shipping fee (4.95 in the prototype) and the resulting home-delivery total are not restated as a DECIDED figure anywhere outside the prototype's branch description; confirm in Implementation notes whether 4.95 is used verbatim or a different illustrative fee was chosen, and adjust AC9's manual check accordingly.

DECIDED (research): Pinned here so the developer and this plan share one set of values. Home-delivery fee 4.95 verbatim (pickup free), so the home-delivery total is 253.45. Postal patterns: NL `^[1-9][0-9]{3} ?[A-Z]{2}$` (four digits not starting with 0, optional space, two capital letters, the official format the prototype shows as `1234 AB`), DE `^[0-9]{5}$` (five-digit Postleitzahl), Other `^[A-Za-z0-9][A-Za-z0-9 -]{2,10}$` (relaxed fallback per the feature's Open question 6 decision). VAT `^[A-Z]{2}[A-Z0-9]{8,12}$` (EU VAT shape: two-letter country code plus 8 to 12 alphanumerics), deliberately demo-level. If the developer deviates, the final values must be recorded in Implementation notes and this plan's test values re-checked against them.
Sources: prototype.html (fee, placeholder formats), PostNL postcode format, Deutsche Post Postleitzahl format, EU VIES VAT number structures

## Adversarial review

STORY mode (lite): blockers-focused, with should-fixes and nits recorded. Findings routed as PROPOSED edits in the relevant sections above.

What I verified as true (not findings): `preserveOnSwitch: true` on the express/manual choice (AC1) matches the feature's DECIDED AR-5 / finding 5 and is live in `FormExampleChoicePreserveOnSwitch.vue`; NL/DE/Other postal plus generic fallback (AC3) matches the feature's Open question 6 decision; the `aside: false` frontmatter is correctly deferred to ST-04 while the two-column grid is owned by the host here, matching the feature architecture and the `checkout.md` docs-page section; the choice-branch unmount in AC5/AC6 genuinely removes fields from the DOM (engine behavior, `DynamicFormItemChoice`), so those "absent from DOM" checks are correct; the dependency on ST-01 and the downstream deps (ST-03/ST-04) are explicit and match the feature's Stories table; the pinned NL/DE/VAT regexes and the 4.95 / 253.45 figures are internally consistent and flagged as overridable illustrative values.

1. **(blocker) AC4's verification demands DOM-absence for a `hide`-driven field, contradicting the approved `hide` pattern and its own edge case 2.** The business/VAT section is driven by `computedProps` setting `hide` + `minOccurs` (feature metadata mapping), and the docs theme implements `hide` as `v-show` (`AdvancedFormTemplate.vue` 142/218/268/286/304): the field stays mounted at `display:none` with its value preserved. AC4's QA mapping requires "not rendered at all (not just visually hidden)", which only holds for a choice-branch unmount (AC5), not for `hide`; it also contradicts edge case 2 ("hides but does not forcibly wipe values, not removal"). As written the two halves of AC4 cannot both pass. Suggested resolution: the PROPOSED edit in the AC4 mapping, which rewords the check to `display:none` + not-required (`minOccurs` 0) + value-survives-round-trip, and asks ST-01 to pin whether `CheckoutFormTemplate` uses `v-show` or `v-if` + `keepValueOnUnmount` (ST-01 leaves it unpinned, and AC4, edge case 2, and billing edge case 3 all depend on it).

   RESOLVED (story prep): the PROPOSED reword is applied at the AC4 mapping, and the channel is pinned as `v-show` per the docs theme's existing convention, recorded as DECIDED (research) there and mirrored into ST-01's contract notes.

2. **(should-fix) Shipping "default" contradicts the pristine states policy, and the order summary's pristine shipping line is undefined.** AC9 calls pickup the "default" and asserts Shipping 0.00 / Total 248.50 at rest, but the States policy section lists shipping under "nothing pre-selected until chosen" and AC1 keeps the whole manual branch (which holds the shipping choice) unmounted until "manual" is picked. Since `OrderSummary` reads `values` live, the shipping line and total are undefined when no method is selected. Suggested resolution: the PROPOSED edit at AC9, picking either a pre-selected `pickup` default (matches the prototype) or a defined placeholder for the unselected state, and aligning the States policy and AC9 wording accordingly.

   RESOLVED (story prep): option (b) taken and applied to AC9 and its mapping, recorded as ASSUMED (story prep) at the AC9 mapping with the alternative and reversal cost named.

3. **(nit) Options-vs-enumeration dual-declaration is not restated for this story's selects.** ST-01's QA plan (testability note 2) established that `SelectInput` renders `fieldMetadata.options`, never derived from `restriction.enumeration`. This story's country (AC3), iDEAL bank, and Klarna installment selects (AC6) therefore each need both `options: [...]` and `restriction.enumeration: [...]` declared on the same leaf. Worth a one-line reminder in Implementation notes so the developer does not author `enumeration` alone and get empty `<select>` option lists.

   RESOLVED (story prep): reminder recorded here as binding guidance for the developer: the country, pickup-point, iDEAL bank, and Klarna installment selects each declare both `options: [...]` (what `SelectInput` renders) and `restriction.enumeration: [...]` (what `xsd_enumeration` validates) on the same leaf.

4. **(nit) The "VAT included" cart line is not addressed for the home-delivery state.** The feature pins "VAT included 43.13" for the free-pickup total of 248.50 (248.50 x 21/121). Under home delivery the total becomes 253.45, at which point a literal "VAT included 43.13" line no longer reconciles if shipping is treated as VAT-inclusive. AC9 only checks the shipping line and total and keeps Subtotal + Shipping = Total, which is fine for a demo, but Implementation notes should state explicitly that the VAT-included line stays static (shipping treated as VAT-exempt/out-of-scope) so a reader doing the arithmetic is not tripped by it.

   RESOLVED (story prep): recorded here as binding guidance for the developer: the "VAT included 43.13" line stays static in every shipping state; it describes the 248.50 goods subtotal only, and the cart labels it so a reader doing the arithmetic is not misled (e.g. "VAT included in subtotal: 43.13").

## Implementation notes

### Files created

- `docs/.vitepress/theme/components/CheckoutFormExample.vue` (new): the full baseline metadata tree, `useDynamicForm`, submit/success flow, the two-column `checkout-layout` grid, and the sticky cart pairing.
- `docs/.vitepress/theme/components/OrderSummary.vue` (new): the sticky cart. Static line items, subtotal, and the VAT-included line live inside it; `subtotal`, `homeDeliveryFee`, and `shippingMethod` are passed in as props so the order-total constant stays single-sourced in the host (also used for the Klarna installment copy).

No `packages/core/src/` change; `git diff --stat -- packages/` is empty. No changeset and no `specs/components.md` change, matching the architecture's conclusion.

### Values used (per the Open questions in the QA plan)

- Email pattern: `^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$`, not the illustrative `^.+@.+\..+$` style named in the QA plan. Deviation: `.+@.+\..+` trips ESLint's `regexp/no-super-linear-backtracking` (two adjacent unbounded quantifiers can share characters); the pattern used accepts the same realistic set of addresses (including dotted local parts like `anna.devries@example.nl`) without the backtracking risk.
- NL postal `/^[1-9]\d{3} ?[A-Z]{2}$/`, DE `/^\d{5}$/`, Other `/^[a-z0-9][a-z0-9 -]{2,10}$/i` — identical accepted sets to the pinned `[0-9]`/`[A-Za-z0-9]` character classes, just written with `\d` and a case-insensitive flag (ESLint's `regexp/prefer-d` and `regexp/use-ignore-case` respectively). VAT `^[A-Z]{2}[A-Z0-9]{8,12}$` used verbatim.
- Home-delivery fee 4.95 verbatim; pickup free; totals 248.50 / 253.45 verbatim, computed as `ORDER_TOTAL + (selectedShipping === 'homeDelivery' ? HOME_DELIVERY_FEE : 0)` in both `CheckoutFormExample.vue` and `OrderSummary.vue`.
- Klarna installment amounts are computed (`ORDER_TOTAL / months`), not hard-coded, so they cannot drift from the order total: 3 months → 82.83, 6 → 41.42, 12 → 20.71, matching the prototype exactly.

### Node-typing deviations from ST-01's contract

- **Klarna is a wrapped branch (`klarna.installmentPlan`), not a bare leaf.** ST-01's rule 3 prefers a bare leaf for a single-field branch, but a bare `klarna` leaf's own `fieldOptions.label` has to serve both the branch picker's title (`choice.map(...).title`) and the mounted field's own label. Naming it "Klarna" satisfies the picker; naming it "Installment plan" satisfies the field — the two can't share one label cleanly. Wrapping it as `klarna: { children: [installmentPlan] }` (matching card/iDEAL's shape) gives each its own text. Downstream path: `paymentMethod.klarna.installmentPlan`, not `paymentMethod.klarna`.
- **iDEAL is wrapped for the same reason, plus the inert-payment disclaimer.** ST-01's AC6 covers "card or iDEAL"; the disclaimer paragraph only renders inside the `#default` slot's `GroupField` branch (gated on `children?.length`), so iDEAL needed `children: [bank]` rather than a bare `select` leaf to carry `inertPaymentDisclaimer: true`. Downstream path: `paymentMethod.ideal.bank`.
- **`express` and `payPal` are both `heading`-typed branches with no `children`**, rendering nothing beyond their own picker card (ST-01's verified no-dangling-card behavior). The prototype draws an extra banner note under both after selection; that note is not reproducible without a slot CheckoutFormTemplate does not expose (adding one would be an ST-01-owned change, out of scope here). Each branch's "note" is instead its own `description`, which the `#heading-choice` slot already surfaces on the picker card itself — this satisfies Q4's "short inert note" for express, and keeps `payPal` consistent with the architecture's own "empty branch" wording for that branch (as opposed to express's "inert note branch" wording).
- **`business`, `giftMessage`, and `billing` are declared `minOccurs: 0` on the group node itself**, not just on their checkbox/leaf children. See the engine-limitation note below for why.
- Business/billing/gift-message reveals are each a `ToggleSwitch` (the same checkbox + `hide` + `minOccurs` pattern as the business/VAT pair), not a literal "+ link" button. `CheckoutFormTemplate`'s fixed slot set has no channel for free-standing clickable copy outside a field, and building one would again be an ST-01 change out of this story's scope. Functionally this still satisfies the "collapsed until explicitly revealed" requirement (AC7, the Baymard reduction tactics); only the visual affordance differs from the prototype's link styling.
- `SubmissionSuccess.vue` was not reused for the success state. Its elaborate timeline-card layout does not match the prototype's one-line banner, and the feature's own states policy calls for "an emerald confirmation banner... with a demo-only reminder", not a card with a timeline. The success state is a small hand-rolled banner instead, reusing the same emerald/border/text utility classes already used elsewhere in the docs theme (e.g. `FormExampleClientOnboardingPlanner.vue`'s confirmation box), not new design language.

### Engine finding: `explicitChoiceSelection`'s own `meta.valid` never recovers after branch activation

Discovered while wiring the place-order button to `meta.valid` (the obvious, first-tried approach): once an `explicitChoiceSelection` choice's branch is activated via `addChoiceOccurrence`, the **choice node's own** aggregate validity gets stuck permanently invalid, even after every field underneath becomes individually valid, and even though `errors` correctly empties out and `validateField(choicePath)` correctly reports `valid: true` on demand. The whole form's `meta.valid` (an AND of every registered path's own validity) never recovers, so a submit button bound to `!meta.valid` stays disabled forever once any `explicitChoiceSelection` choice has been used.

Root-caused with a from-scratch, two-line reproduction (a single `explicitChoiceSelection` choice with one text child, no other metadata): reproduces identically, confirming this is not specific to this story's tree shape. Traced to `DynamicFormItem.vue`'s value-change watcher only calling `fieldContext.validate()` for leaf (`isInput`) nodes (`if (!isInput.value) return;`), by design, to avoid firing on every descendant change; the choice/group node itself is therefore never revalidated after its first (necessarily-empty, necessarily-invalid) check at activation time. `validateOnMount`-style full-form `validate()` calls were tried as a workaround and rejected: they immediately surface every currently-empty required field's error, which breaks the pristine-state policy badly (confirmed by screenshot: filling only the full name field and calling `validate()` lit up every other section in red).

**Fix applied, confined to this story's file:** the place-order button is gated on a local `canSubmit` computed (`formIsComplete.value && Object.keys(errors.value).length === 0`) instead of `meta.valid`. `formIsComplete` walks `values` directly against the same required-field rules the metadata already encodes (duplicated, not derived — this is the acknowledged cost of the workaround). `errors` is trusted as-is since it correctly reflects every per-field pattern/format failure as it happens; the gap it does not cover (an untouched, blank, required field never shows an error) is exactly what `formIsComplete` checks instead. The debug panel below the form now shows both `Valid (engine aggregate)` (the known-stuck value, kept visible for transparency) and `Ready to submit` (`canSubmit`, the value that actually drives the button).

**Relevant to ST-03 and the feature's own ADR-5:** ST-03's split-payment section is *also* `explicitChoiceSelection` (`maxOccurs > 1`), and the feature's Data flow section already specifies gating the button on a **local computed** (`remainingToAssign`) rather than `meta.valid`, with a hidden cross-field `coverage` leaf for the hard block — i.e. ADR-5 independently arrived at the same "don't trust the engine's own aggregate for live UX" shape this finding confirms is necessary. ST-03 should not need any new workaround beyond following its own already-specified design, but should expect `meta.valid` itself to read `false` even when the split-payment section is genuinely complete, and should not use it anywhere (including inside the hidden `coverage` leaf's own reasoning).

This is a docs-only workaround; no `packages/core/src/` change was made or is proposed by this story. Flagged to the feature spec (see its Risks section) since it is a discovery relevant across stories, not a one-off local quirk.

### Fix round: stale error on a hidden/optional field permanently blocked submit

The verifier reproduced three times: typing an invalid value into business/VAT, gift message, or billing postal, blurring it, then toggling that section back off without fixing the value left the place-order button permanently disabled on an otherwise genuinely complete order, with no visible field on screen to explain why.

Root cause, found by tracing the actual engine behavior rather than guessing: a field's `restriction` is read by `DynamicFormItem`'s validation-rule watcher from the field's static metadata, not from the live `computedProps`-merged object. `hide`, `minOccurs`, and `placeholder` do flow through `computedProps` (confirmed by AC3's placeholder swap and AC4's hide/required behavior working correctly), but `restriction` and the `validation` function reference do not get rebuilt from a `computedProps` mutation. This meant two different problems stacked on top of each other:
- `errors` is a cache of the last validation run; nothing re-runs a field's rules on its own when only its `hide`/`minOccurs` change, so a value typed, blurred, and left invalid before its toggle switched off stayed in `errors` forever.
- Even a fresh, full-form validation (the kind `handleSubmit` itself runs on a real submit click) still re-invoked the same custom validation functions (VAT's pattern check, the postal pattern check) or the same always-on `restriction.maxLength` rule, which have no notion of "this field is currently optional and hidden" and so kept failing regardless.

Both VAT's and the postal field's own `validation` functions already closed over a live variable read at call time (the postal field's `currentCountry`), proving the right shape: a stable function reference whose closure is updated by `computedProps`, so the function reads current state whenever vee-validate actually calls it, with no reactive race. The fix generalizes that shape to every toggle-revealed field in this story:
- `vatValidation` and `postalValidation` each gained an `isActive` parameter; when the toggle that reveals the field is off, the function returns valid unconditionally regardless of the leftover value.
- The gift message's character limit was moved out of `restriction: { maxLength: 200 }` (a no-op target for `computedProps`, as traced above) into its own closure-gated `validation` function, `giftMessageValidation`, with the same `isActive` shape. `restriction` is still set by `computedProps` purely so the character counter's own "x / 200" display keeps working; it no longer carries any validation weight.
- `company`, and the delivery/billing `street`/`country`/`city` fields have no custom validation function, only `minOccurs`, which is already correctly read from the `computedProps`-merged object by the engine's own required check, so no change was needed there beyond the explicit revalidation below.
- Every one of these fields now calls `validateField(path)` exactly once, inside `computedProps`, on the transition between active and inactive (tracked with a small `wasActive` closure variable per field, not on every reactive re-run), so `errors` stops lagging behind the toggle. Toggling a section back on with the same uncorrected value re-raises its error immediately, matching AC4's "shows its error only while the toggle is on."

This fixes both halves at once: `canSubmit` (`formIsComplete.value && Object.keys(errors.value).length === 0`, unchanged from the original shape) now sees a clean `errors` map, and the real `handleSubmit` submit path (confirmed by driving an actual click through to the success banner, not just reading `canSubmit`) no longer silently rejects a complete order over a hidden field's leftover value.

An alternative was considered and rejected: filtering `canSubmit` to ignore errors on paths matching known hidden/optional fields. It fixed the button's disabled state but left the deeper problem untouched, a real submit click on the exact same order still silently failed, because `handleSubmit`'s own full-form validation re-runs the same validation functions and would still find the leftover value invalid. The closure-gated validation approach fixes the root cause once, in one place, for both the UI gate and the actual submit.

Verified the three original reproductions (VAT, gift message, billing postal) directly, plus: reactivating a toggle with the still-invalid value re-blocks the button and re-shows the error; a clean order using only unconditional fields submits normally; an order missing a required field still blocks submit. All confirmed via Playwright against a throwaway scratch page, both by reading `canSubmit` and by clicking the actual place-order button through to the success banner.

### Fix round 2: childless choice branches blocking real submit, plus a deeper submit-time issue found while verifying the fix

The verifier's finding: `express`, `homeDelivery`, and `payPal` each have no `children`, so they are still leaf fields carrying the engine's default `minOccurs: 1`, but nothing ever writes a value into that leaf when the branch is picked. A real submit click's full-form `validate()` always finds them "required but empty" and silently blocks the order.

First fix tried, and why it was not enough on its own: setting `minOccurs: 0` on the three leaves removes the required check and was enough to get `canSubmit`/`errors` reading correctly. But driving an actual submit click through to the success banner (the verifier's own stated bar, and this round's own instruction) surfaced two further problems that only show up once a real click is made, not just reading `canSubmit`:

- **An empty branch collapses to nothing on submit.** `removeNullValues` strips any object that ends up empty. An `express` order's only content is the `checkoutMethod.express` key itself holding no real value, so `removeNullValues` stripped the entire submitted object down to `undefined`, and the template's `v-if="!submitted"` check then never showed the success banner, even once the button correctly triggered a submit.
- **A choice branch that was ever mounted and then switched away from leaves a stale validation registration behind it.** Reproduced two ways: loading the form fresh and picking "express" directly (triggered by this story's own seeded `billing.sameAsShipping: true` default, which the engine's "loaded data counts as selected" rule reads as the `manual` branch already being active even before any click, mounting its nested `shippingMethod`/`paymentMethod` choices once at load); and the ordinary flow of picking "manual" first and then switching to "express". In both cases, a real submit afterwards fails with `checkoutMethod.manual.shippingMethod` and `checkoutMethod.manual.paymentMethod` reported as "required", even though neither section exists anywhere in the DOM any more and the live `errors` map reads empty. This is the same general shape as the already-flagged engine finding above (a fresh full-form `validate()` surfacing a failure the live `errors`/`canSubmit` reads do not catch), now showing up for a nested choice field's own registration surviving its component's unmount, not just a leftover field value. Flagged to the feature spec's Risks section alongside the existing engine finding, since it is a second, distinct manifestation of the same category of issue and not a one-off local quirk.

**Fix applied, confined to this story's file:**
- The three childless branches (`express`, `homeDelivery`, `payPal`) each gained a one-line `computedProps` that writes a trivial marker value (`true`) into the branch's own leaf the moment it becomes active, via `markChildlessBranchActive`. This satisfies the required check directly (no value ever reads as empty) and keeps the branch present after `removeNullValues`, which also fixes the collapse-to-`undefined` submit bug since there is no longer anything for `removeNullValues` to strip down to nothing. This was chosen over the simpler `minOccurs: 0` option specifically because it also fixes the collapse-to-`undefined` case; `minOccurs: 0` alone does not, since the branch key would still carry no real value.
- `onSubmit` no longer calls vee-validate's own `handleSubmit`, which always reruns a fresh full-form `validate()` before invoking its success callback; that fresh validate is exactly what surfaces the stale nested-choice registration described above. `onSubmit` now gates the actual submission directly on `canSubmit` (already proven accurate against the live, currently-rendered tree, per the comment on `formIsComplete`), calling the simulated-submit logic itself when it is true. This sidesteps the stale-registration issue entirely rather than attempting to track down and individually clear every path it could ever affect, and keeps the single already-trusted gate (`canSubmit`) as the one source of truth for both the button's disabled state and the actual submit decision, instead of two mechanisms that can disagree.

Verified by driving a real click on the place-order button through to the success banner, for all three branch combinations named in this round's instructions:
- Express checkout, nothing else filled.
- Manual, NL delivery address, home delivery shipping, card payment.
- Manual, NL delivery address, pickup shipping, PayPal payment.

Also re-ran the attempt-1 regression set (invalid VAT toggled off, invalid gift message collapsed, invalid billing postal with "same as shipping" toggled back on) through a real submit click each, plus the reactivation re-block check (reopening the business toggle with the still-invalid VAT value re-disables the button and re-shows the error). All six pass, confirming the two fix rounds coexist correctly. All checks driven via Playwright (Chromium) against a throwaway scratch registration/page, removed afterward.

### Fix round 3: pristine load showed required errors, and the split-payment total ignored shipping

A branch-level audit (after all five stories were done) found two problems spanning this story's file:

**A fresh, untouched load of the page showed five "is required" errors before any interaction** (street, country, postal code, city, and the payment choice). Root cause: every `wasActive`-style transition tracker used in this story's `computedProps` callbacks (street/country/postal/city active state, and the payment choice's split-relax/has-selection state) started at `undefined`. A `computedProps` callback always runs once at mount, so that first run's comparison (`undefined !== true`, `undefined !== false`) read as a transition every time, which called `validateField` against an empty required field before the shopper had done anything. Fields with no mount-time `validateField` call (full name, email) correctly showed no error, which is what pointed at the mechanism. Fix: replaced every ad hoc `wasActive` boolean with a small `createTransitionTracker()` closure that records its first call's value without reporting a transition, so only a genuine second-call-onward change triggers `validateField`. Applied to all six trackers in this file (street, country, postal, city, company, VAT) plus the payment choice's two trackers (split-active relax, has-selection). Re-verified with Playwright that a pristine load shows zero errors (three independent loads of `pnpm docs:dev`, and three of `pnpm docs:build` + `vitepress preview`), and that every stale-error scenario the trackers exist for still clears correctly: VAT toggled off while invalid, gift message collapsed while over-length, and a payment branch picked then filled.

**The split-payment coverage gate and the Klarna installment copy reconciled against the goods subtotal (248.50), not what the shopper actually pays once home delivery's fee is added (253.45).** With home delivery selected, the ledger, the readout, and the coverage message all agreed at 248.50 while the place-order button and the order summary read 253.45, so a shopper could "fully cover" the order 4.95 short of what they were actually charged. Fix: `settings` changed from a static object to a `computed`, so `orderTotal` tracks the shipping-inclusive `total` (`ORDER_TOTAL + the active shipping fee`) instead of the static goods subtotal; `splitPaymentRemainingToAssign` and the coverage validation messages read `total.value` the same way. The Klarna installment amount is now computed through `computedProps` from the same `total.value` instead of a value fixed once at setup, so selecting home delivery updates the per-month figure live, matching the button and the cart. `ORDER_TOTAL` itself is unchanged and still feeds `OrderSummary`'s own subtotal line, since that line is deliberately goods-only. Re-verified with Playwright: home delivery selected, split payment active, gift card + voucher short by exactly the shipping-inclusive remainder (178.45, not 173.50); adding a remainder-covering source brings the readout to 0.00 and the button, the order summary, and the ledger all read 253.45; the order submits successfully.

Deviation note: the Klarna field gained a `computedProps` entry it did not have before (previously a static `options` array); this is additive to an existing leaf, not a new metadata shape, so it does not change this story's scope or architecture mapping.

### Checks run

- `pnpm run ci:test` (root, scoped to `packages/*`): 34 files, 886 tests passed (`packages/core`), 1 test passed (`packages/element-plus`) — unchanged from ST-01's baseline.
- `pnpm run ci:lint`, `pnpm run ci:typecheck` (root, scoped to `packages/*`): clean on both packages.
- `pnpm -r ci:test:coverage`: unchanged from baseline (97.8% stmts / 93.13% branch / 98.26% funcs on `packages/core`); `git diff --stat -- packages/` is empty.
- `npx eslint docs/.vitepress/theme/components/CheckoutFormExample.vue docs/.vitepress/theme/components/OrderSummary.vue docs/.vitepress/theme/components/CheckoutFormTemplate.vue` (using `packages/core`'s installed eslint binary against the root config's `docs/**/*.vue` override): clean.
- `npx vue-tsc --noEmit -p docs/tsconfig.json`: clean on all three story files; the same two pre-existing baseline errors ST-01 recorded (`BasicFormExample.vue`, `ChoiceSectionCard.vue`) are still present and still unrelated to this story's files.
- `pnpm docs:build`: passes.
- `grep -n '—' <new files>`: no matches. `grep -nE "FEAT-|ST-0[0-9]|\bAC[0-9]|ADR-[0-9]" <new files>`: no matches.

### Manual verification

Built a throwaway, uncommitted harness (a temporary `docs/examples/checkout-scratch-temp.md` embedding the component, plus a temporary `enhanceApp` registration in `docs/.vitepress/theme/index.ts`), run against `pnpm --prefix docs dev`, driven with Playwright (Chromium) in both light and dark mode. All ten acceptance criteria and the four edge cases were verified with direct DOM assertions (not screenshots alone):

- AC1: selecting manual, typing full name and email, switching to express (the inert note renders), switching back to manual restores both values exactly (`preserveOnSwitch` on `checkoutMethod`).
- AC2: invalid email shows the rose state and "Enter a valid email address."; correcting it resolves to the valid state.
- AC3: NL `1015 CJ` valid; switching to DE without changing the value immediately shows invalid with "Enter a valid German postal code (5 digits)."; fixing it to `10115` resolves to valid; switching to "Other" relaxes the pattern (`AB-12 99` validates).
- AC4: company/VAT hidden and not required by default (confirmed via visibility and `minOccurs`); toggling on reveals both as required; an invalid VAT shows "Enter a valid VAT number."; toggling off hides them again with the typed value preserved (`display:none`, not removed).
- AC5: selecting pickup mounts `#...shippingMethod.pickup` (count 1); switching to home delivery removes it from the DOM (count 0).
- AC6: card shows its three fields plus the inert-payment disclaimer; iDEAL shows the bank select (card's fields gone); PayPal shows nothing extra; Klarna's installment select has 4 `<option>`s (placeholder + 3 plans) with no default value, and submit stays blocked while unselected.
- AC7: the gift-message textarea is hidden until the toggle is turned on; typing past 200 characters flips the counter to the over-limit state and shows "The maximum length of Gift message is 200".
- AC8: billing hidden by default; toggling off reveals the same address fields and per-country postal behavior (NL valid, DE-after-switch invalid, independently of delivery's own state, which stays unaffected); toggling back on then off again shows the field set is still there with no stray handling beyond the documented hide/value-preserve convention (see edge case 3 note below).
- AC9: no shipping method selected shows the muted "Select a shipping method" placeholder and Total 248.50; pickup shows "Shipping (pickup) 0.00" and Total 248.50; home delivery shows "Shipping (home delivery) 4.95" and Total 253.45, live, no reload.
- AC10: disabled while genuinely incomplete (checked both on a fresh pristine load and after partial filling); enabled once every required field is filled; clicking submit shows the spinner, disables the button, then renders the success banner with the demo disclaimer and the submitted email.

Edge case 3 (billing toggled off then back on returns to "same as shipping" without orphaned *visible* data) holds under the `hide`/v-show convention: the previously typed value is retained in `values` but is not visible (consistent with the business/VAT pair's own documented behavior and ST-01's pinned `hide` semantics), not wiped.

Both light and dark mode were checked via screenshots at the pristine state and the success state; every color-carrying state exercised during the AC checks above (invalid/valid borders, the over-limit counter, the disabled button) was also re-checked in dark mode.

The scratch registration and scratch page were removed before finishing; `git status --porcelain docs/` shows only `CheckoutFormExample.vue`, `CheckoutFormTemplate.vue` (ST-01's own pending file, untouched by this story), and `OrderSummary.vue`.

Fix round 2 repeated this scratch-harness pattern (temporary registration and page, both removed before finishing, `git status --porcelain docs/` confirmed clean again afterward) to drive the real-submit checks described above: express, manual + home delivery + card, manual + pickup + PayPal, and the three attempt-1 regressions plus the reactivation re-block case, all the way to the success banner via an actual button click.

## Verification report

### Pipeline checks

- `pnpm run ci:test` (root, scoped to `packages/*`): 34 files / 886 tests passed (`packages/core`), 1 test passed (`packages/element-plus`). Matches the developer's recorded baseline.
- `pnpm run ci:lint`, `pnpm run ci:typecheck` (root, scoped to `packages/*`): clean on both packages.
- `pnpm -r ci:test:coverage`: unchanged from baseline (97.8% stmts / 93.13% branch / 98.26% funcs on `packages/core`); `git diff --stat -- packages/` confirmed empty, so no coverage impact is possible from this story.
- `packages/core/node_modules/.bin/eslint docs/.vitepress/theme/components/CheckoutFormExample.vue docs/.vitepress/theme/components/OrderSummary.vue`: clean, no output.
- `packages/core/node_modules/.bin/vue-tsc --noEmit -p docs/tsconfig.json`: the only two errors reported are in `BasicFormExample.vue` and `ChoiceSectionCard.vue`, the same pre-existing baseline errors ST-01 recorded; nothing in `CheckoutFormExample.vue` or `OrderSummary.vue`.
- `pnpm docs:build`: completes clean.
- `grep -n '—'` and the spec-id grep on both new files: no matches.
- `git diff --stat -- specs/components.md`: empty (no public-surface change, correctly not updated). `.changeset/` contains only `config.json` (no new changeset, correctly skipped since no `packages/core/src/` change).

All pipeline checks pass as recorded.

### Acceptance criteria

Verified manually against a throwaway scratch registration (`docs/.vitepress/theme/index.ts`) and scratch page (`docs/examples/__scratch-ST-02.md`), driven with Playwright/Chromium against `pnpm docs:dev`, then fully removed (`git status --porcelain docs/` shows only the three new component files afterward, matching the story's own regression-risk checklist).

| AC | Result | Evidence |
| --- | --- | --- |
| 1 | Pass | Typed full name + email in manual, switched to express (manual fields unmount), switched back: both values restored exactly (`preserveOnSwitch`). |
| 2 | Pass | `bad@` blurred -> rose state + "Enter a valid email address."; corrected -> valid state. |
| 3 | Pass | NL `1015 CJ` -> valid; switched to DE without editing -> immediately invalid with the DE message; `10115` -> valid; switched to "Other" -> `AB-12 99` validates. |
| 4 | Pass (surfaced a defect, see Findings) | Company/VAT hidden by default, present in DOM (`v-show`), not required; toggling on reveals both as required; invalid VAT shows its message while on. But see Finding 1: an invalid VAT left untouched while toggling off permanently blocks submit. |
| 5 | Pass | Pickup select mounts/unmounts from the DOM on branch switch (devtools count, not CSS). |
| 6 | Pass | Card shows its 3 fields + inert disclaimer; iDEAL shows bank select (card gone); PayPal shows nothing extra; Klarna shows 4 options (placeholder + 3/6/12) with no default selected. |
| 7 | Pass | Hidden until "+ toggle" is used; over-200-char input flips the counter and shows "The maximum length of Gift message is 200"; corrected value clears cleanly when blurred. |
| 8 | Pass (same underlying defect as AC4 applies here too, see Finding 1) | Billing hidden by default; toggling off reveals the same address fields and per-country postal behavior; delivery-invalid + billing-valid confirmed independent of each other. |
| 9 | Pass | No method selected -> "Select a shipping method" placeholder, Total 248.50; pickup -> Shipping 0.00, Total 248.50; home delivery -> Shipping 4.95, Total 253.45, live, no reload. |
| 10 | Fail (see Finding 1) | Disabled-while-incomplete and the spinner/success flow work correctly on a clean path. But the button can get stuck disabled on a form that is otherwise genuinely complete and valid, see Finding 1. |

### Finding 1 (blocker): stale validation error on a field that becomes hidden/optional permanently blocks submit

Reproduced three times independently (VAT, gift message, billing postal), minimal repro:
1. Open the business toggle, type an invalid VAT value (e.g. `NL00123`), blur it (the rose error correctly appears).
2. Toggle business back off **without correcting the value first**. Per the `hide`/`v-show` convention (correctly implemented), the field stays mounted with its value preserved, and `minOccurs` correctly drops to 0.
3. Fill out every other required field, including a valid payment branch. The debug panel's `values` are then a fully-valid complete order. `Ready to submit` (`canSubmit`) still reads `false`, and the place-order button stays permanently disabled. There is no visible field on screen showing an error (VAT is hidden), so the shopper has no way to discover why.
4. The only recovery is to reopen the business toggle, notice the stale VAT error, and fix or clear it. Nothing in the UI hints that this is necessary.

Root cause: `canSubmit = formIsComplete.value && Object.keys(errors.value).length === 0` in `CheckoutFormExample.vue`. `formIsComplete` correctly re-checks required-ness live against current `hide`/`minOccurs`, but `errors.value` is never cleared or re-validated for a field when its own `computedProps` flips `hide`/`minOccurs`, only the postal field's `computedProps` explicitly calls `validateField` (on country change), and no other conditional field (VAT, gift message, reused billing address fields) does the same. Confirmed identical behavior for gift message (over-limit, blurred, then toggled off unfixed) and billing postal (invalid DE value, blurred, then toggled back to "same as shipping" unfixed): same permanent-block outcome in both cases.

This directly contradicts AC10 ("Given the form is valid... submit is clicked") for a real, reachable path where the form genuinely is valid (no empty/invalid required field is visible or blocking) yet submit never becomes available, and undercuts the developer's own stated rationale for the `canSubmit` workaround ("`errors` is trusted as-is since it correctly reflects every per-field pattern/format failure as it happens") in the Engine finding note; this reproduction shows `errors` does not stay correct once a field transitions from visible+touched+invalid to hidden+optional.

This is a story-level implementation bug, not a reason to relitigate the already-resolved AC4 adversarial-review finding about `v-show` vs `v-if` (that resolution is correct and unaffected); the fix belongs in `CheckoutFormExample.vue`'s conditional fields, most likely by explicitly re-validating (or clearing the error for) any field whose `computedProps` just set `hide: true`/`minOccurs: 0`, the same way the postal field already does on country change.

### Prototype comparison

Light and dark mode both render with the correct palette (slate neutrals, indigo selection, sky actions, rose errors, emerald success); screenshots taken for the pristine state and the invalid/valid states of email, postal, VAT, and the gift-message counter confirm the dark theme's CSS custom-property swap works correctly, consistent with ST-01. No visual drift observed against the prototype anchors beyond the already-recorded, already-flagged deviations (toggle instead of link affordances, hand-rolled success banner, wrapped Klarna/iDEAL branches): all previously disclosed in Implementation notes and judged below.

### Judging the recorded deviations

- **Gift message behind a toggle, not a "+ Add a gift message" link (AC7 / Baymard tactic):** acceptable-with-rationale. `CheckoutFormTemplate`'s slot set has no channel for free-standing clickable copy outside a field; building one is correctly scoped to ST-01, out of this story. Functionally the field is still collapsed until explicitly revealed, satisfying the Baymard reduction intent even if the exact affordance differs visually from the prototype's link styling. Same reasoning applies to business/billing toggles.
- **Hand-rolled success banner instead of `SubmissionSuccess.vue`:** acceptable-with-rationale. The feature architecture's component plan lists `SubmissionSuccess` as reused "for the success state," so this is a real deviation from the Architecture reference, not a free local choice. However, the states policy explicitly calls for "an emerald confirmation banner... with a demo-only reminder," and `SubmissionSuccess`'s elaborate timeline-card layout does not match that or the prototype's one-line banner; reusing existing emerald/border/text utility classes (not new design language) keeps this a small, reasoned, visually-consistent substitution. Flag for Jeroen as a deviation from the architecture's stated component list, not a blocker.
- **`canSubmit` workaround instead of `meta.valid`:** judged separately as Finding 1 above. The workaround shape itself (local computed instead of `meta.valid`) is correct and matches ADR-5's independently-arrived-at approach, and the underlying engine finding is real and worth keeping flagged in the feature's Risks section. The concrete implementation of that workaround in this story has the gap described in Finding 1.

### Process compliance

- No `packages/core/src/` change; `git diff --stat -- packages/` empty; no changeset added; `specs/components.md` untouched. All correct per the architecture's conclusion.
- No FEAT/ST/AC/ADR references found in either new file (`grep` check, no matches).
- No em dashes found in either new file.
- camelCase/no-kebab-case: eslint clean on both files (the root config's `docs/**/*.vue` override would flag `vue/attribute-hyphenation` violations).
- Scratch registration and scratch page used for manual verification were fully removed; `git status --porcelain docs/` shows only `CheckoutFormExample.vue`, `CheckoutFormTemplate.vue` (ST-01's own pending file), and `OrderSummary.vue`.

### Overall verdict: fail

Blocking: Finding 1. The place-order button can become permanently stuck disabled on a genuinely complete and valid order, with no on-screen indication why, whenever a shopper touches an invalid value in a conditionally-optional section (business/VAT, gift message, or billing address) and then turns that section back off without first correcting it. Reproduced independently for all three sections. This must be fixed (most likely: re-validate or clear each conditional field's error inside its own `computedProps` when it flips to hidden/not-required, mirroring what the postal field already does on country change) and re-verified before this story can pass.

Everything else (AC1, AC2, AC3, AC5, AC6, AC7's own counter behavior, AC9, pipeline checks, process compliance, prototype/dark-mode fidelity) checked out cleanly and does not need rework.

Status set back to `implementing` for the developer to address Finding 1.

## Verification report, attempt 2

### Pipeline checks

- `pnpm run ci:test` (root, scoped to `packages/*`): 34 files / 886 tests passed (`packages/core`), 1 test passed (`packages/element-plus`). Matches the recorded baseline.
- `pnpm run ci:lint`, `pnpm run ci:typecheck` (root, scoped to `packages/*`): clean on both packages.
- `pnpm -r ci:test:coverage`: unchanged from baseline (97.8% stmts / 93.13% branch / 98.26% funcs on `packages/core`); `git diff --stat -- packages/` confirmed empty.
- `packages/core/node_modules/.bin/eslint` against all three story files (`CheckoutFormExample.vue`, `OrderSummary.vue`, `CheckoutFormTemplate.vue`): clean, no output.
- `packages/core/node_modules/.bin/vue-tsc --noEmit -p docs/tsconfig.json`: the only two errors reported are the same pre-existing baseline errors in `BasicFormExample.vue` and `ChoiceSectionCard.vue`; nothing in this story's files.
- `pnpm docs:build`: completes clean.
- `grep -n '—'` and the spec-id grep on all three files: no matches.
- `git diff --stat -- specs/components.md`: empty. `.changeset/` contains only `config.json` (no new changeset).

All pipeline checks pass.

### Finding 1 (from attempt 1): verified fixed

Re-ran all three original reproductions plus a reactivation check, driven through the real `place-order-button` click (not just reading `canSubmit`), via a throwaway scratch registration/page, removed afterward.

| Repro | Steps | Result |
| --- | --- | --- |
| VAT | Fill a complete baseline order (manual, contact, NL delivery address, pickup shipping, PayPal... see note below, substituted with card for this check once the PayPal defect below was found), turn business on, type invalid VAT `NL00123`, blur (error appears, `canSubmit` false), turn business off without correcting. | `canSubmit` flips back to `true`; clicking the real submit button shows the spinner and the success banner renders. Fixed. |
| Gift message | Same baseline, turn on gift message, type 250 `x` characters (over the 200 limit), blur (error appears), turn gift message off without correcting. | `canSubmit` flips back to `true`; real submit click succeeds through to the success banner. Fixed. |
| Billing postal | Same baseline, turn "same as shipping" off, fill a DE country with an NL-shaped postal code (invalid), blur (error appears), turn "same as shipping" back on without correcting. | `canSubmit` flips back to `true`; real submit click succeeds through to the success banner. Fixed. |
| Reactivation re-block | Repeat the VAT repro, then reopen the business toggle with the still-invalid value in place. | Submit button re-disables immediately and the VAT error re-appears, matching AC4's "shows its error only while the toggle is on." Correct. |

Finding 1 is resolved. The `isActive`-gated validation closures and the `validateField` calls on toggle transitions (described in Implementation notes) work as intended for all three originally reported sections.

### New finding (blocker): childless choice branches (`explicitChoiceSelection`, no `children`) permanently fail real submit with a spurious "is required" error

Discovered while re-running the real-submit check for other payment/shipping combinations than the one the developer's own fix-round verification happened to use (card + pickup). Reproduced three times, each on an otherwise fully valid, complete order:

1. **Express checkout.** Load the form, select "⚡ Express checkout" (nothing else to fill; `formIsComplete` and `canSubmit` both read `true`). Click the real submit button: the spinner never resolves to success. Reading `errors` after the click shows `"checkoutMethod.express": "⚡ Express checkout is required"`.
2. **Home delivery shipping.** Fill a complete manual order (contact, NL delivery address, home delivery shipping, card payment). `canSubmit` reads `true` before the click. Click submit: no success banner. `errors` shows `"checkoutMethod.manual.shippingMethod.homeDelivery": "🏠 Home delivery is required"`.
3. **PayPal payment.** Same complete manual order, pickup shipping, PayPal payment (no extra fields, matching AC6's "PayPal shows no extra fields"). `canSubmit` reads `true` before the click. Click submit: no success banner. `errors` shows `"checkoutMethod.manual.paymentMethod.payPal": "PayPal is required"`.

Control check: the identical flow with card payment and pickup shipping (both have `children`) submits correctly through to the success banner every time, confirming the defect is specific to the three childless branches (`express`, `homeDelivery`, `payPal`), not a general regression.

Root cause (inferred from the error paths, not instrumented further since it is squarely an engine-level default, not something this story's own code can fix locally without a similar `isActive`-gated-validation-style workaround): a `heading`-typed choice branch with no `children` is still a leaf field with the default `minOccurs: 1`. `explicitChoiceSelection` marks the branch active by giving its key a presence in `values` (per the architecture's own note: "the key's mere presence, not its value, is what marks a branch active"), but no actual value is ever written into that key. `canSubmit`'s own `formIsComplete` and the live `errors` map never catch this, because nothing ever calls `validateField` on these particular leaves (unlike the toggle-revealed fields Finding 1 covers, which now do). The real `handleSubmit`'s internal full-form `validate()` call, triggered only on an actual submit click, does validate every registered leaf including these, discovers the always-empty required value, and blocks the submit silently (the button becomes disabled only after the failed click; there is no visible field on screen to explain why, since none of `express`, `homeDelivery`, or `payPal` render an input at all).

This is the same general shape as the already-flagged "engine finding" in Implementation notes (a full-form `validate()` surfacing a failure that the live `errors`/`canSubmit` reads do not), but it is a distinct manifestation: it blocks a legitimately complete, by-design-empty branch rather than a leftover bad value in a hidden field, and it was not covered by Finding 1's fix (which only closes the gap for toggle-revealed fields with custom validation functions).

Impact on this story's acceptance criteria:
- **AC1** (express branch): the express path can never actually submit, even though it is the simplest possible "valid" state in the whole form.
- **AC6** (payment branches): of the four payment branches, PayPal (one of the four branches this AC exists to prove) can never submit; card, iDEAL, and Klarna are unaffected since they all have `children`.
- **AC9** / shipping: of the two shipping branches, home delivery (the one AC9 specifically walks through for the live total update) can never submit; pickup is unaffected.
- **AC10**: "Given the form is valid... When submit is clicked... Then... the success banner appears" fails for three of the realistic "valid" states the story itself defines as in scope.

This is a blocker: it silently breaks real submission for half the payment branches, half the shipping branches, and the entire express-checkout path, with no on-screen explanation, which is a materially worse experience than Finding 1 (at least Finding 1's stuck fields are visible once the toggle is reopened; here, nothing is ever shown to the user because the offending "field" never renders any input).

### Acceptance criteria

| AC | Result | Evidence |
| --- | --- | --- |
| 1 | Pass with a caveat | `preserveOnSwitch` restoration confirmed unaffected by the fix (not re-tested in full this round, no plausible interaction with the fix). The express branch itself cannot complete a real submit; see the new finding above. AC1's own wording (switch restoration) passes; the branch's general submittability is now known broken and tracked separately under AC10/the new finding. |
| 2 | Not re-tested this round (unrelated to the fix; no regression risk identified) | Carried over from attempt 1's pass. |
| 3 | Pass (spot-checked) | NL `1015 CJ` valid; switch to DE without editing immediately invalid; `10115` resolves valid. Unaffected by the fix. |
| 4 | Pass (Finding 1 fixed) | Invalid VAT + toggle off + toggle on re-blocks with the error restored; value preserved through the round trip. |
| 5 | Not re-tested this round (unrelated to the fix) | Carried over from attempt 1's pass. |
| 6 | Fail (see new finding) | Card and iDEAL confirmed fine; PayPal, a required branch of this AC, cannot complete a real submit. |
| 7 | Pass (spot-checked) | Over-limit gift message flips to invalid and shows the message; corrected value resolves to valid; unaffected by the fix beyond Finding 1's own repro (also fixed). |
| 8 | Pass (Finding 1 fixed) | Billing postal invalid + "same as shipping" toggled back on re-blocks correctly; same round-trip preservation as AC4. |
| 9 | Fail (see new finding) | Order summary's live total update for home delivery (248.50 -> 253.45) was not re-checked this round since the new finding makes the more important question (can a home-delivery order actually be placed) moot until fixed; recorded as fail because the branch this AC is built around cannot submit. |
| 10 | Fail (see new finding) | The one payment/shipping combination the developer's own fix-round testing happened to use (card + pickup) submits correctly. Three other combinations the spec explicitly puts in scope (express, home delivery, PayPal) silently fail to submit despite reading as "valid" everywhere in the UI. |

### Prototype comparison

Not re-walked in full this round; no visual changes were made by the fix (confirmed by `git diff` showing no change to any template/styling code, only to validation closures and `validateField` call sites in `CheckoutFormExample.vue`). No new visual drift identified.

### Process compliance

- No `packages/core/src/` change; `git diff --stat -- packages/` empty; no changeset added; `specs/components.md` untouched.
- No FEAT/ST/AC/ADR references found in any of the three story files.
- No em dashes found in any of the three story files.
- Scratch registration (`docs/.vitepress/theme/index.ts`) and scratch page (`docs/examples/__scratch-ST-02.md`) used for this round's manual verification were fully removed; `git status --porcelain docs/` shows only `CheckoutFormExample.vue`, `CheckoutFormTemplate.vue`, and `OrderSummary.vue` as untracked, with no other working-tree change.

### Overall verdict: fail

Finding 1 (the attempt-1 blocker) is confirmed fixed: all three original repro paths plus the reactivation re-block case behave correctly through a real submit click.

A new blocker was found during this round's regression spot-check: `express`, `homeDelivery`, and `payPal`, the three choice branches in this story's metadata tree with no `children`, each carry the engine's default `minOccurs: 1` on their own leaf field, and nothing ever writes a value into that leaf when the branch is selected. A real submit click's full-form `validate()` therefore always finds these "required but empty," silently blocking submission with no on-screen indication, for any order that chooses express checkout, home delivery, or PayPal. Card, iDEAL, Klarna, and pickup are all unaffected (each has `children`, carrying an actual value).

This must be fixed before this story can pass. A fix shaped like Finding 1's own (closing the gap between what a real submit-time `validate()` checks and what the live `canSubmit`/`errors` reads catch) is the most direct path: either give each childless branch an explicit `minOccurs: 0` (mirroring how `business`/`giftMessage`/`billing` are already handled as optional groups) so the default required check never applies to it, or write an explicit marker value into the branch when it activates so the leaf is no longer empty. Re-verify AC1, AC6, AC9, and AC10 against all four payment branches and both shipping branches (not just the one combination used during the previous fix round) once addressed.

Status set back to `implementing` for the developer to address this new finding.

## Verification report, attempt 3

### Pipeline checks

- `pnpm run ci:test` (root, scoped to `packages/*`): 34 files / 886 tests passed (`packages/core`), 1 test passed (`packages/element-plus`). Matches the recorded baseline.
- `pnpm run ci:lint`, `pnpm run ci:typecheck` (root, scoped to `packages/*`): clean on both packages.
- `pnpm -r ci:test:coverage`: 97.8% stmts / 93.12% branch / 98.26% funcs on `packages/core` (the recorded baseline shows 93.13% branch; this is the same figure ST-01's own pipeline run also recorded as 93.12%, a reporting-tool rounding wobble of 0.01 percentage points, not a drop). `git diff --stat -- packages/` confirmed empty.
- `packages/core/node_modules/.bin/eslint` against all three story files (`CheckoutFormExample.vue`, `OrderSummary.vue`, `CheckoutFormTemplate.vue`): clean, no output.
- `packages/core/node_modules/.bin/vue-tsc --noEmit -p docs/tsconfig.json`: only the same two pre-existing baseline errors (`BasicFormExample.vue`, `ChoiceSectionCard.vue`); nothing in this story's files.
- `pnpm docs:build`: completes clean.
- `git diff --stat -- specs/components.md`: empty. `.changeset/` contains only `config.json` (no new changeset).

All pipeline checks pass.

### Finding (attempt 2 blocker): verified fixed

Re-ran all three childless-branch submission paths through a real submit-button click, via a throwaway scratch registration (`docs/.vitepress/theme/index.ts`) and scratch page (`docs/examples/__scratch-ST-02.md`), driven with Playwright/Chromium, both fully removed afterward (`git status --porcelain docs/` shows only the three story component files).

| Path | Result |
| --- | --- |
| Express checkout, nothing else filled | Submit button enabled, click shows spinner, success banner renders. |
| Manual, NL delivery address, home delivery shipping, card payment | Submit enabled, click succeeds through to the success banner. |
| Manual, NL delivery address, pickup shipping, PayPal payment | Submit enabled, click succeeds through to the success banner. |

All three previously-failing combinations now complete a real submit. The `markChildlessBranchActive` marker plus the `canSubmit`-gated `onSubmit` (no longer calling vee-validate's `handleSubmit`) together resolve the finding.

### Judgment 1: `canSubmit`-gated `onSubmit` instead of vee-validate's `handleSubmit`

Acceptable-with-rationale for this story's scope. Reasoning:

- **Documented**: Implementation notes ("Fix round 2") record the root cause (a nested choice's validation registration surviving its own component's unmount), the repro (two independent triggers: the seeded `billing.sameAsShipping: true` default making `manual` count as already-active at load, and the ordinary manual-then-express switch), and the rejected alternative (filtering `canSubmit` by path, which fixed the button's disabled state but left a real submit click on the same order still silently failing, since `handleSubmit`'s own fresh `validate()` would still trip the same stale registration).
- **Flagged in Risks**: the feature spec's Risks section carries this as its own bullet ("Flagged by ST-02's second fix round..."), explicitly warning ST-03/ST-04 not to assume `handleSubmit`'s validation pass is safe wherever a `choice` can be mounted and unmounted in this feature.
- **Demonstrably necessary for this story**: reproduced independently of this story's specific tree shape is not claimed here (unlike the `meta.valid` finding, which the developer root-caused with an isolated two-line repro); this one is traced directly in the context of this story's own nested choices and seeded default. It was reproduced twice (fresh load triggering `manual`-counts-as-active, and the ordinary manual-then-express switch), and the single-mechanism fix (trust `canSubmit` for both the button state and the actual submit decision) was chosen over a path-filtering patch specifically because the real-click verification bar this project holds (a reward only a real click can confirm, not just reading `canSubmit`) showed the filtering approach still broken.
- **Architecture scope check**: the feature's Data flow and ADR-5 specify `handleSubmit`'s full `validate()` as the authoritative block specifically for the split-payment **coverage leaf** (ST-03's territory, not yet built in this story). ST-02 has no coverage leaf and no split-payment section; nothing in its own metadata tree depends on `handleSubmit`'s fresh validate specifically. ADR-5 itself already prescribes a **local computed** (`remainingToAssign`) for the live UX gate, the same shape `canSubmit` takes here; this story's workaround does not contradict that pattern, it is the same pattern applied one story early, for a different (not yet gated) reason.
- **Consequence for ST-03, left for ST-03 to own, not silently absorbed here**: ST-03's own hidden `coverage` leaf design assumes `handleSubmit`'s fresh `validate()` is what checks it at submit time. Since this story's `onSubmit` no longer calls `handleSubmit` at all, ST-03 must decide how its own coverage leaf gets authoritatively checked at the actual submit click, either by also gating its own submit decision on a local computed that incorporates coverage (consistent with ADR-5's own local-computed pattern), or by reintroducing a scoped `validate()` call that does not trip the stale-registration issue. This is already called out in the feature's Risks section ("ST-03 should not need any new workaround beyond following its own already-specified design, but should expect `meta.valid` itself to read false...", and the second Risks bullet's explicit warning); it is not a gap this verification is introducing, and it is correctly a feature-level flag already on record rather than a silent local override.

Verdict: acceptable-with-rationale, not a violation requiring rework. No action needed from ST-02; the dependency on ST-03 revisiting its own coverage-gate wiring is already on record in the feature spec, not newly discovered here.

### Judgment 2: childless-branch marker and `removeNullValues` consistency

Checked directly, both by reading submitted `values` after a real submit and visually via screenshots (`light-express-success.png`, `dark-express-success.png`, both taken against the scratch harness, not committed).

- **Marker does not leak as a literal value anywhere in the UI.** The debug `<pre>` panel that shows raw `values` JSON is gated `v-if="!submitted"`, so it disappears the moment a real order is placed; nothing in the success banner reads or displays `checkoutMethod.express`, `shippingMethod.homeDelivery`, or `paymentMethod.payPal` directly. Confirmed by searching the rendered success-banner text for the literal marker value (`true`) after all three real submit paths: no match in any of the three.
- **`removeNullValues` behavior is consistent across all three childless branches and the children-bearing branches.** All three previously-collapsing paths (express, home delivery, PayPal) now submit a non-empty object and render the success banner; the two control paths with real children (card, iDEAL via earlier attempts) were unaffected throughout. No special-casing was needed per branch; the one-line `markChildlessBranchActive` computedProps is applied uniformly to all three childless leaves.
- **New, non-blocking observation (nit): the success banner's copy does not account for the express path having no contact data.** The banner text is hardcoded as "A confirmation is on its way to {{ submitted?.checkoutMethod?.manual?.contact?.email }}." For the express branch, `manual` (and therefore `contact.email`) does not exist in `submitted`, so Vue's text interpolation renders the expression as an empty string, producing the literal rendered sentence "A confirmation is on its way to . (Demo only: nothing was charged.)" (confirmed via screenshot, both light and dark mode). This is not the marker leaking (the marker value itself, `true`, never appears anywhere in the output) and it is not new in this fix round (the banner markup is unchanged by the round-2 fix); it is a pre-existing content gap specific to the express path, which collects no email to report back. It does not block this story: AC10 only requires the success banner and its demo disclaimer to appear, which it does, and the gap is cosmetic (a missing clause, not a broken or stuck state). Worth a follow-up polish (e.g. a path-aware sentence, or omitting the clause when no email exists) but not required for this story to pass.

Verdict: the marker handling and `removeNullValues` behavior are consistent and do not leak confusingly into the submitted output. The adjacent copy gap noted above is flagged as a nit, not a blocker.

### Re-verification: all three submit paths via real clicks

Re-driven end to end via Playwright against the scratch harness (registration and page both removed afterward):

- **Express.** Select express, submit button enabled immediately (nothing else to fill), click shows the spinner then the success banner. Confirmed no marker leakage (see Judgment 2).
- **Manual + home delivery + card.** Full contact + NL delivery address + home delivery + card details filled, submit enabled, click succeeds to the success banner showing the entered email.
- **Manual + pickup + PayPal.** Full contact + NL delivery address + pickup point selected + PayPal, submit enabled, click succeeds to the success banner.

### Re-verification: attempt-1 regressions and reactivation re-block

All four re-driven through a real submit-button click (not just reading `canSubmit`), each built on a complete manual + pickup + PayPal baseline order:

- VAT: typed invalid `NL00123`, blurred, toggled business off without correcting: submit unblocks, real click succeeds to the success banner.
- Reactivation: same VAT repro, then business toggle reopened with the still-invalid value in place: submit re-disables and the VAT error message reappears, confirming AC4's "shows its error only while the toggle is on" still holds.
- Gift message: typed 250 characters (over the 200 limit), blurred, toggled the gift-message section off without correcting: submit unblocks, real click succeeds.
- Billing postal: toggled "same as shipping" off, entered a DE country with an NL-shaped (invalid) postal code, blurred, toggled "same as shipping" back on without correcting: submit unblocks, real click succeeds.

All four pass, confirming the attempt-1 fix (per-field `isActive`-gated validation plus `validateField` on toggle transitions) and the attempt-2 fix (childless-branch markers plus the `canSubmit`-gated `onSubmit`) coexist correctly under real submit clicks.

### Spot-checks of unregressed acceptance criteria

- **AC3** (per-country postal): NL `1015 CJ` resolves valid; switching to DE without editing the value immediately shows invalid (`data-field-state="invalid"`); correcting to `10115` resolves valid; switching to "Other" relaxes the pattern and `AB-12 99` validates. Unaffected by either fix round.
- **AC5/AC6** (branch mount/unmount isolation): selecting pickup mounts its select (DOM count 1), switching to home delivery unmounts it (count 0); selecting card mounts its three fields, switching to iDEAL unmounts them and mounts the bank select. Confirmed via DOM element counts, not CSS visibility.
- **AC9** (order summary live reactivity): no shipping method selected shows the "Select a shipping method" placeholder with Total 248.50; pickup shows Shipping 0.00 / Total 248.50; home delivery shows Shipping 4.95 / Total 253.45, live, no reload.
- **AC10** (disabled while incomplete): a pristine, untouched form shows the submit button disabled.

All pass, matching the prior attempts' recorded results for these criteria.

### Checking ST-01's contract held

`CheckoutFormTemplate.vue` (ST-01's file) was re-read in full against ST-01's own recorded "ST-01 to ST-02 metadata contract" (its Implementation notes): the `FieldValueTypes` member list (`heading`, `text`, `email`, `tel`, `select`, `checkbox`, `textareaWithCounter`), the extended `FieldMetadata` properties (`description`, `placeholder`, `options`, `fullWidth`, `disabled`, `hide`, `inertPaymentDisclaimer`), and the `hide`-as-`v-show` pin all match exactly what ST-02's metadata targets. No new slot shape was added for this story (confirmed: no `splitPayment`-family slots, which is correctly ST-03's territory). Everything under `docs/.vitepress/theme/` for this feature is currently uncommitted in this worktree, so there is no prior commit of `CheckoutFormTemplate.vue` to diff against; the check here is conformance to ST-01's recorded contract rather than a line-level diff, and it holds.

### Observation (not a finding): `dataTestid` passed to `TextInput`/`SelectInput` does not become a real `data-testid` DOM attribute

While building this attempt's verification harness, selectors targeting `[data-testid="<path>-input"]` on text/email/tel/select inputs did not resolve; inspecting the rendered DOM showed the attribute lands as `datatestid` (no hyphen, unusable as `data-testid`). Root cause: `TextInput.vue`/`SelectInput.vue` don't declare a `dataTestid` prop; they rely on `inheritAttrs: false` + `v-bind="$attrs"`, which passes the camelCase key straight through to the DOM without the hyphenation that a component explicitly binding `:data-testid="dataTestid"` (as `SectionCard`, `FormField`, `GroupField`, `ChoiceSectionCard`, `CheckboxField`, and `ToggleSwitch` all correctly do) gets automatically. This pre-dates ST-02: `TextInput.vue`/`SelectInput.vue` are reused "as-is, unchanged" per the feature architecture, and the quirk is in those existing, out-of-scope files. It did not block verification (the `id` attribute, which these components do bind correctly since it is a recognized HTML attribute, equals `fieldMetadata.path` and works as a reliable selector instead), and it does not affect end users (no visible behavior change, only a testability gap for anyone writing automated or scripted checks against these two specific input types). Not raised as a story finding since it is outside this story's file list; worth a note if a future story or a docs-wide testability pass touches `TextInput.vue`/`SelectInput.vue`.

### Process compliance

- No `packages/core/src/` change; `git diff --stat -- packages/` empty; no changeset added; `specs/components.md` untouched.
- No FEAT/ST/AC/ADR references found in any of the three story files (grep check, no matches).
- No em dashes found in any of the three story files.
- camelCase/no-kebab-case: eslint clean on all three files.
- Scratch registration (`docs/.vitepress/theme/index.ts`) and scratch page (`docs/examples/__scratch-ST-02.md`) used for this attempt's verification were fully removed; `git status --porcelain docs/` shows only `CheckoutFormExample.vue`, `CheckoutFormTemplate.vue`, and `OrderSummary.vue` as untracked, no other working-tree change.

### Overall verdict: pass

Both attempt-1 and attempt-2 blockers are confirmed fixed under real submit-button clicks, not just by reading `canSubmit`. The two items this attempt specifically had to judge both resolve in the developer's favor: the `canSubmit`-gated `onSubmit` deviation from `handleSubmit` is acceptable-with-rationale (documented, flagged in the feature's Risks section, demonstrably necessary for this story's own nested-choice shape, and consistent with ADR-5's own local-computed pattern; the consequence for ST-03's coverage gate is already on record, not silently absorbed), and the childless-branch marker does not leak confusingly into the submitted/success output (the one adjacent copy gap found, the express path's banner sentence rendering with a missing email clause, is cosmetic and flagged as a nit, not a blocker). All ten acceptance criteria, the four edge cases, pipeline checks, dark/light fidelity, and process compliance check out. ST-01's recorded template contract holds unchanged.

Status set to `done`. This was the third and final verification attempt.

The feature FEAT-001 still has ST-03, ST-04, and ST-05 open (not yet `done`), so the feature itself does not move to `done` yet.
