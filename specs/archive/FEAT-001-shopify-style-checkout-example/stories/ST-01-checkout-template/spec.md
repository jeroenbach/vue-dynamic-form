---
id: ST-01
type: story
feature: FEAT-001
status: done
approved_by: Jeroen
pr: ""
---

# Story: Checkout template and reused-field wiring

## Decided without Jeroen (research)

Settled from research during story prep, not reviewed by Jeroen. Override any of these freely.

- Conditional-visibility channel → `CheckoutFormTemplate` implements `hide` as `v-show` (docs theme convention, values preserved); pinned here because ST-02's business/VAT and billing checks depend on it

## Functional
### User story
As a template author reading the docs, I want a dedicated checkout docs template that renders every non-split-payment field shape (text, email, tel, select, checkbox/toggle, a textarea with a character counter, and choice branches), built entirely on the library's existing engine slots and the docs theme's existing field components, so that the rest of the checkout example has a working rendering surface to build its metadata tree on.

### Acceptance criteria

1. Given a metadata leaf of type text, email, or tel, When it is rendered through `CheckoutFormTemplate`, Then it renders via the existing `FormField` + `TextInput` wiring, including the pristine, focus, invalid (rose border and message), valid (emerald border), and disabled states.
2. Given a metadata leaf of type select with an enumeration restriction, When rendered, Then it renders via `SelectInput` with the enumeration's options as the `<select>` options.
3. Given a metadata leaf of type checkbox, When rendered, Then it renders via `ToggleSwitch`/`CheckboxField` consistent with the docs theme's toggle-row styling.
4. Given a metadata leaf intended for a long-form message, When it is configured for the textarea input, Then it renders as a `<textarea>` with a live character count readout showing `<length> / <max>` of its configured `xsd_maxLength`, and the readout switches to the over-limit visual state once the typed length exceeds that maximum.
5. Given a `choice` node with two or more branches, When one branch is selected, Then only that branch's children render underneath the `ChoiceSectionCard` picker, and selecting a different branch unmounts the previous branch's fields.
6. Given the payment `choice`'s card or iDEAL branch is selected, When that branch renders, Then an inert-demo-field disclaimer note is shown near the fields stating they collect no real payment data.
7. Given any of the above states, When `html.dark` is toggled, Then every color-carrying state (error, success, disabled, focus) resolves correctly without any dark-mode-specific markup in `CheckoutFormTemplate.vue` itself (the existing CSS custom properties cover it).
8. Given no metadata tree is supplied beyond a minimal fixture exercising each shape above, When mounted standalone with `DynamicForm` + `CheckoutFormTemplate`, Then the template renders and validates correctly without requiring the full checkout example host from ST-02.

### Edge cases
- A choice branch with no children (mirroring the PayPal branch) renders its picker only, with no dangling empty card body.
- A disabled field (e.g. phone marked optional and disabled in a given state) shows the muted surface and `not-allowed` cursor per the feature's states policy.
- An input that becomes invalid after being valid (e.g. a pattern change via `computedProps` in a later story) must still resolve to the invalid visual state through the same slot, since this story only proves the rendering contract, not any specific computedProps wiring.

### Out of scope
- The full checkout metadata tree, the `useDynamicForm` host, and the order summary/submit flow (ST-02).
- The split-payment ledger rendering (`splitPayment-choice-array` / `splitPayment-choice-array-item` slots) and its dedicated `splitPayment` type member (ST-03 extends this file to add them).
- Docs page narrative, nav, and registration in `enhanceApp` (ST-04, ST-05).

## Design reference
Implements the rendering contract behind these prototype sections (`../../prototype.html`): `#contact` (text/email states), `#delivery-address` (select + text states, country/postal pairing rendered generically here, country-driven swapping itself is ST-02), `#business-toggle` (checkbox/toggle states), `#shipping-method` (choice + nested child), `#payment` (four-branch choice switching and the inert-field disclaimer), `#gift-message` (textarea + character counter states, including the over-limit state).

No new design language: this story only wires existing docs-theme components and the one new piece of template chrome the feature design called out, the character counter. The specific metadata values shown in the prototype's cards (names, placeholder copy) belong to ST-02; this story proves the shapes render correctly with any data.

## Architecture reference
Builds, from the feature architecture's component plan:
- `docs/.vitepress/theme/components/CheckoutFormTemplate.vue` (new): the `DynamicFormTemplate` wrapper, declaring its `FieldValueTypes` union for text/email/tel/select/checkbox/textarea-with-counter. The union member for `splitPayment` and its ledger slots are added later by ST-03, which extends this same file; this story does not need to anticipate their shape beyond leaving the union open to extension.
- Reuses as-is, unchanged: `SectionCard`, `FormField`, `TextInput`, `SelectInput`, `ToggleSwitch`, `CheckboxField`, `ChoiceSectionCard`, `ChoiceField`, `AppButton`, `AppIcon`, `ErrorMessage` from the docs theme, and `DynamicForm`, `DynamicFormTemplate`, `defineMetadata` from the library (no core change).

No `packages/core/src/` change and no changeset in this story: everything is docs-only template wiring on the existing public surface.

Dependencies: none. This is the first story in implementation order; ST-02 depends on it.

## QA plan

### Test strategy overview

`docs/` has no test runner at all: `docs/package.json` declares no `vitest`/`@vue/test-utils`/`jsdom` dependency and no `test` script, there is no `docs/vitest.config.*`, and no `docs/**/*.test.ts` file exists anywhere in the repo today. The root `pnpm test` / `pnpm ci` / `pnpm -r ci:test:coverage` all run `pnpm -r <script>`, which is scoped by `pnpm-workspace.yaml` to `packages/*` only (`docs/` is explicitly excluded). This is not new to this story: the two prior docs stories in this repo (`FEAT-001-explicit-choice-selection` ST-03 and ST-04) hit the identical gap and deliberately did not introduce a docs-level vitest harness for a single story, verifying instead by source-level review and Playwright screenshots. This plan follows that same precedent rather than introducing new test tooling unilaterally: adding a vitest harness to `docs/` is a tooling decision bigger than one story (new devDependency, config, and a `package.json` script that would need to be wired into some CI step), and nothing in the feature architecture calls for it.

Consequence for the naming convention in `CLAUDE.md` (`*.test.ts`, `*.logic.test.ts`, `*.validation.test.ts`, `*.analytics.test.ts`): those conventions govern `packages/core/src/` only. No file following them is added by this story. If a future story or a later decision does introduce a docs test runner, the natural home for `CheckoutFormTemplate.vue`'s tests would be `docs/.vitepress/theme/components/__tests__/CheckoutFormTemplate.test.ts` (shape/slot-wiring assertions) and `CheckoutFormTemplate.validation.test.ts` (the invalid/valid/over-limit assertions), mirroring `packages/core/src/components/__tests__/`; this is noted so the convention is ready to apply the day the tooling exists, not invented ad hoc then.

Every check below is therefore one of:
- **Source-level (deterministic):** read the diff/component against the feature architecture's "reuse as-is" list and the slot-wiring pattern already shipped in `AdvancedFormTemplate.vue`.
- **Manual/visual (Playwright-driven):** screenshots and DOM queries (`getAttribute`, `textContent`, `locator.evaluate`) against a temporary, uncommitted harness, in both light and dark mode, per `CLAUDE.md`'s "Take screenshots" step.

No committed automated test file is added by this story.

### Fixture: the standalone harness AC8 requires

AC8 explicitly requires proving the template renders and validates "without requiring the full checkout example host from ST-02." Build one temporary, **uncommitted** harness for manual verification (delete it before the PR, matching the throwaway-harness pattern already used in `FEAT-001-explicit-choice-selection`'s ST-03 QA plan): a small `.vue` file that calls `useDynamicForm()` and renders `<DynamicForm :template="CheckoutFormTemplate" :metadata="fixture" />` inside a plain `<form>`, no `CheckoutFormExample.vue`, no order summary, no submit/success flow.

`fixture` needs one node per shape this story owns, illustrative values only (ST-02 owns the real metadata):
- `fullName` (text), `email` (email, `restriction.pattern`), `phone` (tel, `minOccurs: 0`, and a second disabled copy for the disabled-state check)
- `country` (select, `restriction: { enumeration: [...] }` **and** a matching `options: [...]`, see testability note below) and a plain text field for comparison
- `businessOrder` (checkbox) gating a sibling `vatNumber` (text); note this pairing itself is `computedProps`-driven per the feature architecture, which is explicitly ST-02's territory; for this story's fixture, gate it with a plain `v-if`-free static `minOccurs`/`hide` pair set directly on the metadata (no `computedProps`), or simply render both fields unconditionally. The point of this fixture is to prove the checkbox slot renders, not to reproduce the conditional wiring.
- `giftMessage` (the textarea-with-counter type, `restriction.maxLength: 20` so "over limit" is reachable by typing a short sentence)
- `shippingMethod` (a 2-branch `choice`: `homeDelivery` with no children, `pickup` with one nested `pickupPoint` select), covering AC5 and edge case 1 (branch with no children)
- `paymentMethod` (a `choice` with at least a `card` branch, to exercise AC6's disclaimer) and a `disabled: true` leaf somewhere in scope for the generic disabled-state check

### Testability notes (read before the AC mapping; these shape how "pass" is checked)

1. **AC1's "valid (emerald border)" has no existing DOM signal to key off.** `TextInput.vue` and `SelectInput.vue` (reused "as-is, unchanged" per the architecture) only toggle between a neutral border and an error border keyed off the `errorMessage` prop; neither has an emerald/valid treatment today, and nothing else in the reused component list adds one. Recommended resolution, which does **not** touch either reused file: `CheckoutFormTemplate.vue` (the one new file this story owns) adds its own conditional class on the `TextInput`/`SelectInput` component invocation, driven by the slot's `fieldContext.meta.value.valid && fieldContext.meta.value.touched` (available because `fieldContext` extends vee-validate's `FieldContext`, per `DynamicFormTemplate.vue`'s `FieldContext` interface). Both components already support this without modification: `TextInput.vue`'s own comment notes "Vue merges class/style automatically, so callers can add classes without overriding base styles." Also recommend a plain `data-field-state="pristine|invalid|valid"` attribute on the same element, so this plan's manual checks (and any future automated ones) can assert state deterministically via `getAttribute` instead of string-matching Tailwind class names, which are a styling detail, not a contract. This is a testability recommendation for the developer, not a change to the "reuse as-is" component list, and not an API change.
2. **AC2's "the enumeration's options" is not an automatic mapping anywhere in this engine.** `restriction.enumeration` is a validation rule only. `fieldMetadata.options` is a separate, independently-authored extended property, and it is what `SelectInput` actually renders (`AdvancedFormTemplate.vue`'s `#select-input` slot: `:options="fieldMetadata.options"`). Confirmed against the existing convention in `FormExampleClientOnboardingPlanner.vue`'s `industry`/`teamSize` selects: `options` is always set by hand or via `computedProps`, never derived from `restriction.enumeration`. The fixture (and the real ST-02 metadata later) must declare both `restriction: { enumeration: [...] }` and a matching `options: [...]` on the same leaf. This story's check asserts the rendered `<option>` elements match `fieldMetadata.options`, not that the engine derived them from the restriction, because it does not and this story does not change that.
3. **The over-limit visual state (AC4) and the inert-field disclaimer (AC6) need a stable text/DOM anchor, not an invented attribute name.** Rather than prescribing a specific extended-property name for either (an implementation choice left to the developer), the checks below key off the *visible output* the AC actually describes: the character-count text itself (`<length> / <max>`, readable regardless of which class signals "over limit") and the disclaimer's required copy (a sentence stating the fields are inert/collect no real payment data, per the prototype's `#payment` branch note). This keeps the check robust to implementation details while still being a concrete, falsifiable assertion.

### Acceptance criteria -> verification mapping

1. **Text/email/tel via `FormField` + `TextInput`, states pristine/focus/invalid/valid/disabled.**
   - Source-level: confirm `CheckoutFormTemplate.vue`'s default-input wiring imports and invokes `FormField` + `TextInput` with the same prop shape as `AdvancedFormTemplate.vue`'s `#default`/`#default-input` pair (`:disabled="fieldMetadata.disabled || disabled"`, `:errorMessage="errorMessage.value"`), so no new design language was introduced beyond the valid-state class/attribute from testability note 1.
   - Manual/visual, harness: screenshot `fullName` (pristine), `phone` (focus it, screenshot ring, both color modes), `email` (type an invalid value, blur, screenshot rose border + confirm `[data-testid="email-error"]` has text, per `ErrorMessage.vue`'s existing testid pattern), `email` again (type a valid value, blur, screenshot the emerald state and confirm `data-field-state="valid"` from testability note 1), the disabled `phone` copy (screenshot muted surface, confirm `cursor-not-allowed` class already present in `TextInput.vue`'s base classes, confirm the input cannot receive focus/input).
   - Edge case 3 (valid -> invalid transition through the same slot): in the same harness, type a valid email, blur (confirm valid), then edit it to an invalid value, blur again (confirm it flips to invalid, same DOM node, no remount). Screenshot both states back to back.

2. **Select with enumeration via `SelectInput`.**
   - Source-level + manual: per testability note 2, confirm the fixture's `country` leaf has both `restriction.enumeration` and `options`, and that the rendered `<select>`'s `<option>` list (`wrapper/page.locator('select#country option')` text contents) matches `fieldMetadata.options` exactly (key/value pairs, correct order).

3. **Checkbox via `ToggleSwitch`/`CheckboxField`.**
   - Source-level: confirm the `#checkbox`/`#checkbox-input` wiring matches `AdvancedFormTemplate.vue`'s pair (`CheckboxField` wrapper, `ToggleSwitch` input) with no new classes beyond what `CheckboxField.vue`/`ToggleSwitch.vue` already ship (both reused as-is).
   - Manual/visual: screenshot the toggle off and on, confirm the toggle-row layout matches the existing docs-theme toggle styling (same track/knob classes), both color modes.

4. **Textarea with character counter, over-limit state.**
   - Manual/visual, harness: confirm the rendered element for `giftMessage` is a real `<textarea>` (`locator('textarea')`, not `input`). Type a string under the configured `maxLength` and read the counter text, asserting it equals `` `${typed.length} / ${maxLength}` `` exactly. Continue typing past `maxLength` and re-read the counter text (still `<length> / <max>`, now over), and confirm a visibly different state per testability note 3 (screenshot the color change; if the developer added the recommended `data-field-state`/`data-exceeds-limit` hook, assert it directly instead of relying on a screenshot alone).
   - Source-level: confirm the counter and the `<textarea>` are new markup inside `CheckoutFormTemplate.vue` itself (template chrome), not a change to any reused component, consistent with the architecture's "one new piece of template chrome" framing.

5. **Choice branch switching, nested field mount/unmount.**
   - Source-level: confirm `CheckoutFormTemplate.vue`'s `-choice`/`default-choice-item` (or equivalent) wiring reuses `ChoiceSectionCard`/`ChoiceField` unchanged, matching `AdvancedFormTemplate.vue`'s existing pattern.
   - Manual/visual, harness: select `pickup` on `shippingMethod`, confirm the nested `pickupPoint` select is present; switch to `homeDelivery`, confirm `pickupPoint` is gone from the DOM (`locator('[id="shippingMethod.pickup"]').count()` is 0, or the harness's equivalent). Note: the underlying unmount guarantee itself (that switching branches deregisters the previous branch's fields) is an **engine** behaviour already covered by `packages/core/src/components/__tests__/DynamicFormItemChoice.analytics.test.ts` ("switching branches renders the newly selected branch exactly once" / previous branch's DOM node gone); this story's check only needs to confirm its own slot wiring exposes that engine behaviour correctly, not re-prove the engine guarantee itself.
   - Edge case 1 (branch with no children, mirrors PayPal): select `homeDelivery` (no children in the fixture) and confirm no empty card body/box renders beyond the branch picker itself (no dangling `SectionCard`/`RepeaterCard`-style empty container).

6. **Inert-demo-field disclaimer on card/iDEAL branches.**
   - Manual/visual, harness: select the `card` branch on `paymentMethod`, confirm a visible disclaimer element is present near the fields containing wording consistent with "inert demo" / "collect no real payment data" (per prototype `#payment`'s note copy; exact wording is the developer's/content's call, this check only requires the substance to be present and visible). Confirm it does **not** render for a branch without the flag, if the fixture includes one.

7. **Dark mode, no dark-specific markup in `CheckoutFormTemplate.vue`.**
   - Source-level: grep the new file for `dark:` Tailwind variants; none should appear outside of classes copied verbatim from a reused component's own template (there should be none at all, since the only new markup is the textarea/counter and, per testability note 1, the valid-state class/attribute, both of which should use the existing CSS custom-property-backed utility classes rather than hand-rolled `dark:` variants).
   - Manual/visual: every screenshot pair above (AC1, AC3, AC4, AC5, AC6) is taken once in light mode and once with `html.dark` toggled, confirming every color-carrying state (error, success/valid, disabled, focus) resolves correctly in both.

8. **Standalone rendering without the ST-02 host.**
   - This AC *is* the harness itself: building and successfully mounting the harness described above, with validation actually firing (type an invalid email, confirm the error renders; nothing throws, no console error from a missing slot), is the verification. No separate check beyond confirming the harness never imports or requires `CheckoutFormExample.vue`, `OrderSummary.vue`, or any ST-02/ST-03 file.

### Edge cases (from Functional > Edge cases)

- Choice branch with no children renders picker-only: covered under AC5 above.
- Disabled field shows muted surface + `not-allowed` cursor: covered under AC1; note `TextInput.vue`/`SelectInput.vue` already carry `disabled:cursor-not-allowed disabled:bg-slate-50 ... disabled:text-slate-500` in their base classes today, so this edge case is mostly a propagation check (`fieldMetadata.disabled || disabled` reaches the right prop), not new styling.
- Valid-to-invalid transition through the same slot: covered under AC1.

### Out-of-scope confirmation

- No split-payment markup (`splitPayment-choice-array`/`splitPayment-choice-array-item` slots) appears in the diff: source-level grep for `splitPayment` in `CheckoutFormTemplate.vue` returns nothing.
- No metadata tree beyond the throwaway harness fixture is added: confirm no `CheckoutFormExample.vue` or `docs/examples/checkout.md` file is created or modified by this story's diff (ST-02/ST-04's files).
- No `enhanceApp` registration added (ST-04's responsibility per the feature's stories table).

### States policy coverage (this slice)

Per the feature's states policy, this slice must demonstrate: **pristine** (AC1), **focus** (AC1), **invalid** (AC1, email), **valid** (AC1, email), **disabled** (AC1, phone), and the choice **empty/no-children** shape (AC5 edge case). **Loading** and **form-level error/success** states are out of scope for this story (no submit flow exists until ST-02's host); **empty** in the "dashed sunken slot" sense (collapsed entry points, split-payment-empty) is also out of scope here, since those all belong to sections ST-01 does not render (gift-message-behind-a-link, split payment). This narrowing is consistent with the story's own scope, not a gap.

### Reactivity

This story adds no `computedProps` (explicitly deferred to ST-02/ST-03 per the Edge cases and Design reference) and touches no `packages/core/src/` file, so no engine-level render-count regression is possible from this slice; the existing `*.analytics.test.ts` suite in `packages/core` already guards the choice-unmount and validation-recompute behaviour this template merely consumes (cited under AC5 above). No `*.analytics.test.ts` file is added, consistent with the no-docs-vitest constraint in the Test strategy section. As a manual substitute, the harness's `giftMessage` field should be exercised by typing a sentence through several keystrokes while watching the counter update once per keystroke with no visible flicker or value loss, which would be the user-visible symptom of a render-loop regression; this is weaker than an automated render-count assertion but is the best check available given the environment, and it is the only genuinely new reactive wiring this story introduces (the counter is a plain template computed, not an engine primitive).

### Coverage

Not applicable to `pnpm -r ci:test:coverage`: that script is scoped to `packages/*` (`pnpm-workspace.yaml` explicitly excludes `docs/`), and this story touches no file under `packages/core/src/` or `packages/element-plus/src/`. The coverage baseline is mathematically unaffected; nothing in this story's diff is "knowingly left uncovered" by that gate, because the gate does not measure `docs/` at all, a pre-existing condition this story did not create.

### Time sensitivity

Not applicable. No date/time logic exists anywhere in this story's scope (the character counter is a plain string-length comparison); nothing depends on `TZ=Europe/Amsterdam` or on when a test runs.

### Regression risk

- **`CheckoutFormTemplate.vue` is net new** with zero existing consumers, so by construction it cannot regress `AdvancedFormTemplate.vue`, `BasicFormTemplate.vue`, or any existing docs example, **provided no shared component is modified**. The real risk is scope creep into a reused file: if the developer needs to touch `TextInput.vue`, `SelectInput.vue`, `ToggleSwitch.vue`, `CheckboxField.vue`, `ChoiceSectionCard.vue`, `ChoiceField.vue`, `SectionCard.vue`, `AppButton.vue`, `AppIcon.vue`, or `ErrorMessage.vue` for anything beyond what testability note 1 already shows is unnecessary, that change ripples into every existing consumer of those files (`FormExampleClientOnboardingPlanner.vue`, `FormExampleChoiceFields.vue`, `BasicFormExample.vue`, and others). Guard: a plain `git diff --stat` before the PR must show zero changes to any file in that list; if one is genuinely needed, re-screenshot the existing `/examples/advanced` and `/examples/choices` pages (mirroring the regression check already performed in `FEAT-001-explicit-choice-selection`'s ST-03) to confirm no visual drift.
- **Engine guarantees this story leans on but does not re-test**: branch-switch unmount (`DynamicFormItemChoice.analytics.test.ts`), `aria-invalid`/error-message wiring (`DynamicFormItem.validation.test.ts`), and `disabled`/`maxOccurs` propagation (`DynamicFormItemChoice.logic.test.ts` / `DynamicFormItem.logic.test.ts`). A regression in any of these would surface here as a visual break in the harness, but the root-cause fix belongs in `packages/core`'s own suite, not a new docs check.
- **Downstream stories (ST-02 through ST-05) depend on this story's slot/type-name contract staying stable.** In particular, whatever `FieldValueTypes` member name the developer picks for the textarea-with-counter shape (the architecture calls it "textarea-with-counter" conceptually but does not fix an exact name) becomes load-bearing the moment ST-02 writes `giftMessage`'s metadata against it. Recommend the developer record the chosen type name plainly in Implementation notes so ST-02 does not have to guess or re-derive it from the component source.
- **PROPOSED (adversarial review): record the full ST-01 -> ST-02 metadata contract, not only the textarea type name.** The textarea type member is not the only name ST-01 invents that ST-02's metadata must target verbatim. AC6's inert-payment disclaimer is template chrome owned by this file (per the feature's component plan), but whether it renders is driven by a metadata flag ST-02 sets on the card/iDEAL branches, and testability note 3 deliberately leaves that flag's property name to the developer. The same applies to any other extended property this story introduces on `FieldMetadata` (for example the one that selects the textarea rendering, if it is an extended prop rather than a `type` member). Recommend the developer record, in Implementation notes, every new type member and every new extended-property name ST-01 adds, together with its meaning, so ST-02 writes its metadata against a stated contract rather than re-deriving it from the component source. This completes the dependency contract the bullet above only half-states.

  DECIDED (research): One piece of that contract is pinned now rather than left to the developer, because ST-02's AC4 and its edge cases already depend on it: `CheckoutFormTemplate` implements conditional visibility (`hide`) as `v-show`, matching the docs theme's existing convention (`AdvancedFormTemplate.vue` lines 142/218/268/286/304). Hidden fields stay mounted at `display:none` with their values preserved, which is the semantics the business/VAT and billing toggles require. `v-if` + `keepValueOnUnmount` is not used.
  Sources: AdvancedFormTemplate.vue (the existing hide convention), ST-02 adversarial review finding 1

### Manual verification checklist

1. Build the throwaway harness described above; confirm it mounts cleanly with no console errors/warnings and never imports an ST-02+ file.
2. Walk through every state in the AC mapping above (pristine, focus, invalid, valid, disabled, checkbox on/off, textarea under/at/over limit, choice branch switch with nested field mount/unmount, no-children branch, payment disclaimer), screenshotting each in both light and dark mode (`html.dark` toggle, matching how VitePress itself toggles).
3. Confirm the valid-to-invalid edge case (AC1 edge case 3) by flipping the same email field between states twice in one session without remounting the harness.
4. `grep -n "dark:" <new file>`: confirm no hand-rolled dark-mode-specific class exists outside what a reused component already ships (AC7 source check).
5. `git diff --stat` against the branch base: confirm zero changes to any file in the "Reuses as-is, unchanged" list (regression risk above).
6. Delete the throwaway harness file before opening the PR (it is a manual verification aid only, not a shipped artifact).
7. `pnpm docs:build` once, to confirm the new `.vue` file at least compiles/typechecks as part of the VitePress build, even though no page embeds it yet (if the developer adds a temporary route for the harness, remove it before this check; if the harness lives entirely outside `docs/.vitepress/theme/components/` or is never imported anywhere in the build, this check instead reduces to `vue-tsc`/the project's normal `pnpm typecheck` picking up the new `CheckoutFormTemplate.vue` file itself).

### Untestable criteria / rewrite proposals

- No acceptance criterion is untestable as written once the two testability notes above are applied. AC1's "valid (emerald border)" and AC4's "over-limit visual state" are visual-only as literally worded (no accessible DOM signal exists today for either), which is why testability notes 1 and 3 propose a concrete, additive hook (`data-field-state`, a stable char-count text format) rather than leaving "pass" to depend on reading Tailwind class names off a screenshot. These are proposed as implementation guidance, not as rewrites of the AC text itself, since the AC's intent (a visually distinct valid/over-limit state) is already sound; only the verification mechanism needed clarifying.
- AC2's phrasing ("renders ... with the enumeration's options as the `<select>` options") reads as if the engine derives `options` from `restriction.enumeration` automatically. It does not, anywhere in this codebase (testability note 2). Proposed rewrite for clarity, routed here rather than silently reinterpreted: "Given a metadata leaf of type select with both an `options` array and a matching `restriction.enumeration`, when rendered, then it renders via `SelectInput` with `fieldMetadata.options` as the `<select>` options, and the `enumeration` restriction independently validates the selected value." This changes only the explanation of the mechanism, not the observable behaviour the original AC describes.

### Open questions

None. Both clarifications above have a clear, low-risk resolution from the existing codebase pattern (rung 3 of the post-approval tie-breaker ladder: TextInput/SelectInput's own documented class-merging support, and the `options`-is-independent-of-`enumeration` convention already used by `FormExampleClientOnboardingPlanner.vue`), so neither needs Jeroen's judgement.

## Adversarial review

STORY mode (lite): blockers only, with a few lower-severity notes recorded. No blocker found. The eight acceptance criteria are all testable and all mapped in the QA plan; the story is consistent with the approved feature design/architecture and its DECIDED entries (gift-message counter as new template chrome per finding 4, inert-field disclaimer owned by `CheckoutFormTemplate.vue` per the component plan, choice-branch unmount deferred to the engine's own suite); and the dependency statement (none; ST-02 depends on it) matches the feature's Stories table.

Verified true against the repo and installed versions (so these are not findings): `docs/package.json` declares no vitest / `@vue/test-utils` / jsdom and no `test` script, so the "no committed tests, source-level + Playwright" strategy is forced by the environment and matches precedent; `TextInput.vue` carries the `inheritAttrs: false` + class-merge comment and has only neutral/error borders with no valid/emerald treatment, so testability note 1's additive-class approach is both necessary and non-invasive; `DynamicFormTemplate.vue`'s input-level slot `fieldContext` extends vee-validate's `FieldContext`, so `meta.valid` / `meta.touched` is genuinely available to drive the valid-state hook; every component in the "reuse as-is" list exists under `docs/.vitepress/theme/components/`, and `AdvancedFormTemplate.vue` really does expose the `#default` / `#default-input` / `#select-input` / `#checkbox` / `#checkbox-input` / `#default-choice` slots the AC mapping mirrors.

1. **(should-fix, routed) The ST-01 -> ST-02 metadata contract is only half-stated.** The regression-risk note asks the developer to record the textarea type name for ST-02, but that is not the only name ST-01 invents that ST-02 must target verbatim: the AC6 inert-payment disclaimer renders off a metadata flag whose property name testability note 3 leaves to the developer, and any extended property introduced to select the textarea rendering is in the same position. Making the dependency contract explicit is a STORY-mode concern, so recording only one of its names is an incomplete handoff. Resolution: see the PROPOSED (adversarial review) bullet added under Regression risk, extending the recording recommendation to every new type member and extended-property name this story adds. Routed as a PROPOSED edit, so it does not force discussion.

2. **(nit) AC6's wording couples the test to payment semantics ST-01 does not build.** "Given the payment choice's card or iDEAL branch is selected" reads against a payment choice that only exists from ST-02 on. The QA plan already reconciles this correctly (the disclaimer is flag-driven and the fixture sets the flag on a `card` branch), so no change is required; if the AC text is ever revisited, phrasing it as "a choice branch carrying the inert-payment flag" would make the slice boundary cleaner. No action needed for approval.

3. **(nit) AC4 says the counter shows "of its configured `xsd_maxLength`".** The counter chrome actually reads the `restriction.maxLength` facet value (the fixture sets `restriction.maxLength: 20`), not the generated `xsd_maxLength` rule. Harmless shorthand; the verification mapping keys off the visible `<length> / <max>` text, which is unaffected. No action needed.

## Implementation notes

### File created

`docs/.vitepress/theme/components/CheckoutFormTemplate.vue` only. No file in the "Reuses as-is, unchanged" list was touched; verified with `git status --porcelain docs/` showing only this new file.

### ST-01 to ST-02 metadata contract (per the should-fix finding above)

Every new `FieldValueTypes` member and extended-property name this story introduces, for ST-02 to target verbatim:

- `FieldValueTypes`: `heading` (never, display-only group/choice-container marker), `text` (string), `email` (string), `tel` (string), `select` (string), `checkbox` (boolean | undefined), `textareaWithCounter` (string, the textarea-with-counter shape).
- Extended `FieldMetadata` properties: `description?: string`, `placeholder?: string`, `options?: { key: string, value: string }[]`, `fullWidth?: boolean`, `disabled?: boolean`, `hide?: boolean`, `inertPaymentDisclaimer?: boolean` (the AC6 flag; set it on a choice branch's own node to show the inert-demo-field disclaimer near that branch's fields).
- Extended `DynamicFormSettings` property: `showRequiredOrOptional?: 'optional' | 'required'`.
- `hide` is rendered as `v-show` everywhere (never `v-if`), matching the pinned DECIDED entry.

Node-typing rule every future story writing metadata against this template must follow:

- A top-level section or a choice container (anything meant to render inside a `SectionCard`/`ChoiceSectionCard`) is typed `heading` and must declare `children` (for a section) or `choice` (for a choice).
- A choice branch that renders its own multiple fields is left untyped (defaults to `text`) so it renders through GroupField, not `heading`; giving such a branch `type: 'heading'` would nest a second full `SectionCard` inside the choice's own card.
- A choice branch that is itself exactly one field (for example a bank-select branch) simply carries that field's own type directly (no wrapper node).
- A choice branch that renders nothing of its own (an inert/redirect-only branch) must be typed `heading` with no `children`. `CheckoutFormTemplate`'s `#heading` slot only renders its `SectionCard` when `fieldMetadata.children?.length` is truthy, so this is the one supported way to get a picker-only branch; leaving such a branch untyped (or any other leaf type) renders a dangling empty input, which was caught and fixed during this story's own manual verification.

### Deviations

- Reused `GroupField` (`docs/.vitepress/theme/components/GroupField.vue`, existing, unchanged) for choice-branch sub-groups, even though the feature architecture's "reuses as-is" list for this story did not name it. It is the exact component `AdvancedFormTemplate.vue` already uses for the identical shape (a choice branch with its own multiple fields, e.g. `FormExampleClientOnboardingPlanner.vue`'s `launchApproach` branches), discovered as the correct existing fit while building the fixture and confirmed against that file. Using it avoids nesting a second `SectionCard` inside the choice's own card.
- Did not reuse `choiceShowChoiceSelect` (the flag `AdvancedFormTemplate` uses to gate whether a choice's branch-picker cards render). Every choice in this checkout always needs its picker visible, so `#heading-choice` shows it unconditionally, keeping the extended-property surface smaller for ST-02 to target.
- The valid-state indicator (testability note 1) uses `!border-[color:var(--vp-c-success-3)]`, an arbitrary-value Tailwind class backed by VitePress's own theme CSS custom property, instead of `border-emerald-500 dark:border-emerald-600`. The plain Tailwind pair needs a hand-rolled `dark:` variant in this file, which AC7's own source check (grep for `dark:`) forbids; `--vp-c-success-3` already resolves to a different value under `.dark` with no `dark:` prefix needed here. The `!` is required because the base `TextInput`/`SelectInput` classes set a neutral or error border at the same CSS specificity.
- Added `data-field-state="pristine|invalid|valid"` on every text/select input (testability note 1) and `data-testid="<path>-char-count"` plus `data-exceeds-limit` on the character counter (testability note 3), as deterministic hooks for manual and future automated checks.

### Manual verification

Built a throwaway, uncommitted harness (`CheckoutHarnessTemp.vue` + a temporary `docs/examples/checkout-harness-temp.md` page + a temporary `enhanceApp` registration), covering one fixture node per shape per the QA plan, mounted standalone with `useDynamicForm` + `DynamicForm` + `CheckoutFormTemplate` (no ST-02+ file imported). Verified with Playwright against the local `docs:dev` server, in both light and dark mode:

- Text/email/tel pristine, focus ring, invalid (rose border + message), valid (green border via the hook above, confirmed by computed `borderColor`), disabled (muted, `cursor-not-allowed`, cannot be focused) — same DOM node across the invalid-to-valid transition.
- Select renders `fieldMetadata.options` as its `<option>` list.
- Checkbox toggles via `ToggleSwitch`, value reaches `values`.
- Textarea-with-counter: real `<textarea>`, counter reads `<length> / <max>` exactly, flips to the over-limit visual/attribute state past `restriction.maxLength`.
- Shipping choice: selecting `pickup` mounts the nested `pickupPoint` select; switching to `homeDelivery` unmounts it and renders nothing beyond the picker (no dangling card).
- Payment choice: selecting `card` renders its three fields plus the inert-payment disclaimer; `payPal` (no children) renders nothing beyond the picker.
- Dark mode: every state above re-verified with `html.dark` toggled; `grep -n "dark:" CheckoutFormTemplate.vue` shows only classes copied from reused components' own templates (the textarea/counter chrome and the disclaimer paragraph), none introduced for the valid-state hook.

The harness file, its temporary markdown page, and its temporary `enhanceApp` registration were deleted before finishing; `git diff docs/.vitepress/theme/index.ts` is empty.

### Checks run

- `pnpm docs:build` — passes.
- `vue-tsc --noEmit -p docs` — no errors from either new file; two pre-existing errors (`BasicFormExample.vue`, `ChoiceSectionCard.vue`) are present identically with the new file removed, confirmed as baseline and unrelated to this story.
- `eslint` on the new file — clean.
- `pnpm run ci:test`, `pnpm run ci:lint`, `pnpm run ci:typecheck` (the combined `pnpm run ci` re-triggers pnpm's own built-in `ci` install step even when invoked as `pnpm -r ci` from a script, so the three were run separately) — all green, 886 tests passing in `packages/core`.
- `pnpm -r ci:test:coverage` — unchanged from baseline; this story touches no file under `packages/core/src/`.

No changeset: this story is docs-only, no `packages/core/src/` change, no public-surface change, matching the feature architecture's conclusion. `specs/components.md` left unchanged for the same reason.

## Verification report

### Pipeline checks

- `pnpm run ci:test` (root, scoped to `packages/*`): 34 files, 886 tests passed (`packages/core`), 1 test passed (`packages/element-plus`).
- `pnpm run ci:lint` (root, scoped to `packages/*`): clean on both packages.
- `pnpm run ci:typecheck` (root, scoped to `packages/*`): clean on both packages.
- `docs/` is a separate workspace not covered by the root scripts, so it was checked directly:
  - `eslint docs/.vitepress/theme/components/CheckoutFormTemplate.vue` (using `packages/core`'s installed eslint binary against the root config, which includes a `docs/**/*.vue` override): clean, no output.
  - `vue-tsc --noEmit -p docs`: two pre-existing errors in `BasicFormExample.vue` and `ChoiceSectionCard.vue`, unrelated to and not touching `CheckoutFormTemplate.vue`; confirmed these match the Implementation notes' claim of a pre-existing baseline unrelated to this story's file. No error from the new file itself.
  - `pnpm docs:build`: passes (client + server bundle build, page render), both before and after the throwaway harness was built and removed.
- `pnpm -r ci:test:coverage`: unchanged from baseline (`packages/core` all-files 97.8% stmt / 93.12% branch / 98.26% funcs / 97.8% lines), matching the story's claim that it touches no file under `packages/core/src/`.

### Acceptance criteria

| AC | Outcome | Evidence |
| --- | --- | --- |
| 1 (text/email/tel states) | Pass | Harness screenshots: pristine, focus ring, invalid (rose border + `[data-testid="email-error"]` text "Email is not valid."), valid (emerald border via `data-field-state="valid"`, confirmed on both `email` and the touched-but-empty `phone`), disabled (`phoneDisabled` muted, `cursor: not-allowed` computed style, `cursor-not-allowed` class present, not focusable). Edge case 3 (invalid to valid and back to invalid on the same DOM node) confirmed via `data-field-state` reading `invalid` to `valid` to `invalid` with no remount. |
| 2 (select + enumeration) | Pass | `#country option` text contents equal exactly `["Select an option", "Netherlands", "Germany"]`, matching the fixture's `options`, independent of `restriction.enumeration` per testability note 2. |
| 3 (checkbox) | Pass | Screenshot of the toggle off/on via `ToggleSwitch`/`CheckboxField`, consistent toggle-row styling in both color modes. |
| 4 (textarea + counter) | Pass | `#giftMessage` is a real `<textarea>`. Counter text read exactly `"5 / 20"` under limit and `"50 / 20"` over limit; `data-exceeds-limit` flips `false` to `true`; over-limit state also visibly turns rose/red in both light and dark screenshots. |
| 5 (choice branch switching) | Pass | Selecting `pickup` mounts `#shippingMethod.pickup.pickupPoint` (count 1); switching to `homeDelivery` removes it (count 0) with no dangling card body, confirmed by screenshot. |
| 6 (inert-payment disclaimer) | Pass | Selecting `card` (flagged `inertPaymentDisclaimer: true`) renders visible text "These fields are inert demo inputs. They collect no real payment data and are not a payment integration." Selecting `payPal` (unflagged) shows zero matches for "inert demo". |
| 7 (dark mode) | Pass, with a note | Every state above re-verified with `html.dark` toggled; all color-carrying states resolve correctly. Source grep for `dark:` finds hits only in the textarea/counter chrome and the disclaimer paragraph. The textarea's class string is a verbatim copy of `TextInput.vue`'s own base/error classes (confirmed by direct comparison), satisfying the AC7 testability note's "copied verbatim from a reused component's own template" exception. The disclaimer paragraph's `text-slate-500 dark:text-slate-400` / `border-slate-300 dark:border-slate-600` pair is not a byte-for-byte single-component copy, but is the same muted-text/border convention already used verbatim in `CheckboxField.vue`, `FormField.vue`, `ArraySectionCard.vue`, and `ChoiceArraySectionCard.vue`, not a new color invented for this file. No hand-rolled dark-mode design language was introduced. The valid-state hook correctly uses the CSS-custom-property class with no `dark:` variant, as the Implementation notes describe. |
| 8 (standalone rendering) | Pass | Built the throwaway harness (`CheckoutHarnessTemp.vue` + `docs/examples/checkout-harness-temp.md` + a temporary `enhanceApp` registration), imported only `CheckoutFormTemplate.vue` and library exports, no ST-02+ file. Mounted cleanly, validation fired live (email pattern), no console errors. Harness, markdown page, and `enhanceApp` registration were all deleted before finishing; `git diff docs/.vitepress/theme/index.ts` is empty and `git status --porcelain docs/` shows only the new `CheckoutFormTemplate.vue`. |

One fixture-construction note, not an implementation defect: an initial harness fixture omitted `explicitChoiceSelection: true` on the `shippingMethod`/`paymentMethod` choices and left the empty `homeDelivery` branch untyped, which reproduced exactly the dangling-empty-input failure mode the Implementation notes describe catching and fixing during the story's own manual verification. Correcting the fixture to follow the documented node-typing rule and to set `explicitChoiceSelection: true` (consistent with the feature's metadata-tree mapping for `#shipping-method`/`#payment`) resolved it; this confirms the node-typing rule recorded in Implementation notes is accurate and necessary, not that the template has a defect.

### Edge cases

- Choice branch with no children renders picker-only (`payPal`): pass, see AC6 evidence.
- Disabled field shows muted surface + `not-allowed` cursor: pass, see AC1 evidence.
- Valid-to-invalid transition through the same slot: pass, see AC1 evidence.

### Prototype comparison

Checked against prototype anchors `#contact`, `#delivery-address`, `#business-toggle`, `#shipping-method`, `#payment`, `#gift-message`: field shapes, states (pristine/focus/invalid/valid/disabled), the choice picker card style, and the inert-payment disclaimer placement are consistent with the prototype's visual language (slate neutrals, indigo choice selection, sky focus rings, rose errors, emerald valid state). No Shopify-specific styling was introduced. No sibling story exists yet to compare against for visual drift (ST-01 is first in implementation order).

### Process compliance

- No `packages/core/src/` change; no changeset present or required, matching the architecture's conclusion.
- `specs/components.md` correctly left unchanged: it documents only `packages/core/src/index.ts`'s public surface, not docs-theme components.
- No spec/story/finding identifiers found in code comments (`grep -nE "FEAT-|ST-0|\bAC[0-9]|ADR-[0-9]"` returns nothing in the new file).
- No em dashes found in the new file.
- Vue camelCase conventions followed throughout (props, events, field names).
- `git diff --stat` against every file in the "Reuses as-is, unchanged" list (`SectionCard`, `FormField`, `TextInput`, `SelectInput`, `ToggleSwitch`, `CheckboxField`, `ChoiceSectionCard`, `ChoiceField`, `AppButton`, `AppIcon`, `ErrorMessage`, plus `GroupField` per the documented deviation) shows zero changes: confirmed empty.
- `grep -n "splitPayment"` in the new file returns nothing, confirming no out-of-scope split-payment markup leaked into this story.
- No `CheckoutFormExample.vue`, `docs/examples/checkout.md`, or `enhanceApp` registration added by this story's diff.

### Overall verdict: pass

All eight acceptance criteria and all three edge cases verified with direct evidence (deterministic DOM assertions plus screenshots in both light and dark mode). Pipeline checks are green and coverage is unchanged from baseline. No process violations found. AC7's dark-mode source check is satisfied under the testability note's documented exception, noted above for transparency rather than as a blocking finding.
