---
id: ST-01
type: story
feature: FEAT-006
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Page scaffold, rule metadata tree, and the four condition branches

## Sequencing gate (blocks implementation)

Per the feature's ADR-5 and the Constraints & assumptions section: FEAT-006 implements **after FEAT-010 (Engine validation gaps) reaches `status: done`**, because this story's submit gate is built directly on `meta.valid` and must never carry the checkout's `formIsComplete`/`handleSubmit`-bypass workarounds. As of this split, `specs/FEAT-010-engine-validation-gaps/spec.md` was `status: in-progress`. UPDATE (2026-10-28): FEAT-010 is now `done` (archived at `specs/archive/FEAT-010-engine-validation-gaps/`), so this gate is satisfied and the story may be implemented. `/spec:implement` must still refuse (parking the story rather than inventing a workaround) in the unlikely event that status has been rolled back. This gate applies to this story directly; ST-02, ST-03, and ST-04 all build on this story's host and inherit the same gate transitively, so they do not need to re-check it independently.

## Functional

### User story
As a docs reader exploring the inbox rules builder example, I want to add, fill in, and remove rules of four condition types (From sender, Subject contains, Larger than, Has attachment), each carrying a required action with its own conditionally revealed companion field, so that I can see the engine's repeatable explicit choice primitives working as a genuine multi-branch form before the reorder-and-reroute payoff is introduced.

### Acceptance criteria

1. Given the `rules` choice with `minOccurs: 0`, When the page loads with no rules added, Then the rules card shows its add toolbar and a dashed "No rules yet. Until then, every message stays in the Inbox" panel, and the submit control stays enabled (the mandatory empty state is valid data).
2. Given the "From sender" add button, When clicked, Then a new rule occurrence is appended with a single email input; an invalid value (failing `xsd_pattern`) shows the rose invalid state with a message, and a valid email address shows the emerald valid state.
3. Given the "Subject contains" add button, When clicked, Then a new rule occurrence is appended with a single text input for the subject substring.
4. Given the "Larger than" add button, When clicked, Then a new rule occurrence is appended with a number input and a KB/MB unit select laid out in the `1fr 90px` sub-grid.
5. Given the "Has attachment" add button, When clicked, Then a new rule occurrence is appended with no filter field of its own, shown as a dashed muted "No filter to configure" note, and the occurrence still satisfies the engine's default required check because the shared action block gives the branch non-empty `children` (ADR-2: no `markChildlessBranchActive` marker is written or needed).
6. Given any rule occurrence, When its action select is set to "Move to folder" / "Apply label" / "Forward to", Then the matching companion field (`folder` / `label` / `forwardTo` respectively) appears and becomes required; switching to a different action or to "Delete" hides the previous companion field again and de-requires it (`hide` + `minOccurs: 0`, driven by `computedProps`).
7. Given the `forwardTo` companion field is visible, When an invalid email address is typed, Then it fails email-format validation, showing the rose invalid state with a message; a valid address passes. PROPOSED (adversarial review): `forwardTo` is validated by a ctx-based `validation` closure (the checkout's `emailValidation`, returning a custom message), NOT an `xsd_pattern` restriction. The feature's Data flow ("Conditional action field") specifies `forwardTo` "additionally carries the checkout's email `validation` closure", and in `packages/core` `xsd_pattern` is generated only from `restriction.pattern` (`DynamicFormItem.vue`), a rule that cannot stand down when the field is hidden/de-required on an action switch (computedProps cannot toggle a restriction off, per the checkout's gift-message note), which would reintroduce exactly the stale-error flash the Edge cases section guards against. `xsd_pattern` is correct only for the always-visible `fromSender` leaf (AC2), per the feature scope ("From sender: an email leaf (`xsd_pattern`)").
8. Given the shared budget (`maxOccurs: 20` on the `rules` choice), When 20 rule occurrences exist across any mix of the four branches, Then every "add rule" button disables via `canAddChoiceOccurrence` and the count tag reads "20 of 20" via `usedChoiceOccurrences`.
9. Given any rule occurrence, When its remove (bin) button is clicked, Then the occurrence is removed and the remaining occurrences' position badges (`globalIndex + 1`) renumber immediately with no gap.
10. Given the whole form, When `html.dark` is toggled, Then every state (pristine, focus, invalid, valid, disabled, empty, budget-exhausted add) resolves through the existing CSS custom properties with no page-specific dark markup.

### Edge cases
- Removing the only remaining rule returns the list to the empty state (AC1) with no stale validation message left behind.
- Switching a rule's action rapidly (for example folder to label to delete to folder again) leaves no stale required error on a companion field that is no longer visible, per the per-occurrence-path transition tracker specified in the feature's Data flow ("Conditional action field").
- A rule occurrence added then immediately removed before any field is filled in leaves no orphaned validation state on sibling occurrences.
- Two occurrences of the same branch type (for example two "Has attachment" rules) are both addable up to the shared budget; nothing in this story treats same-branch duplicates specially (that is ST-03's concern).

### Out of scope
- Reorder controls, the persisted `order` field, and `preserveOrder: true` (ST-02).
- The live test inbox panel and routing computation (ST-02).
- The unreachable-rule badge (ST-03).
- Narrative prose, the metadata walkthrough, cross-links, and nav/sidebar discoverability (ST-04).

## Design reference
Implements the rule-list portion of `../../prototype.html#live-form` (the add-rule toolbar and the four rule-row bodies, excluding the order column's up/down chevrons) and the non-reorder, non-unreachable states in `#rule-states`: pristine, focus, invalid, valid, disabled, the mandatory empty state, and the budget-exhausted add state. The order badge (`globalIndex + 1`) renders without functioning chevrons; the chevrons' boundary-disable visuals and the amber unreachable badge are explicit deltas left to ST-02 and ST-03.

## Architecture reference
Builds, from the feature architecture's component plan:
- `InboxRulesExample.vue` (new, host): declares the `rules` metadata node (`minOccurs: 0`, `maxOccurs: 20`, `explicitChoiceSelection: true`, `displayOrder: 'added'`; `preserveOrder` stays unset/false in this story, it is ST-02's flip per ADR-1 once reorder needs it), owns `useDynamicForm`, and a `canSubmit`/`onSubmit` skeleton gated on vee-validate's aggregate `meta.valid` per the sequencing gate above. The `TEST_INBOX` constant and the routing/unreachable computeds are not added here (ST-02/ST-03).
- `InboxRulesTemplate.vue` (new, template): the `defineMetadata<FieldValueTypes, ExtendedFieldProperties, SlotProperties, ExtendedSettingsProperties>()` contract from the feature architecture (`FieldValueTypes`: `{ rule: never, text: string, email: string, number: number | undefined, select: string }`, no `heading` member); wires `rule-choice-array` to the list container, `rule-choice-array-item` to `InboxRuleRow`, and `default-input` / `select-input` / `default` to the existing docs field components.
- `InboxRuleRow.vue` (new, one rule row): the branch-kind label, the condition fields per branch, the action block (`action` select plus `folder`/`label`/`forwardTo` companion leaves revealed by `computedProps`), and the remove button. Implements the per-occurrence conditional-action specification from the feature's Data flow verbatim: ctx-based `validation` closures on each companion leaf that read their own occurrence's `action` via `ctx.form`/`ctx.field`, and a per-occurrence-path transition tracker (keyed by occurrence path) driving the `validateField` re-trigger on each occurrence's own action change. PROPOSED (adversarial review): the transition tracker is conditional on the landed FEAT-010 behavior, not an unconditional requirement. The feature's ADR-5 states "FEAT-010's GAP 2 (computedProps-driven rule rebuild/revalidation) may also make the per-occurrence transition tracker unnecessary; re-check at story time against the landed FEAT-010 behavior, keeping the ctx-based validation closures either way." Because this story is gated behind FEAT-010 reaching `done` and the implementer works against FEAT-010's landed behavior, state this caveat here so the tracker is built only if GAP 2 does not already cover the companion-field revalidation on action change; the ctx-based `validation` closures are required regardless. UPDATE (2026-10-28): FEAT-010 is `done`; the landed GAP 2 rebuilds and revalidates a field's ruleset when `computedProps` swaps its `restriction`/`validation`, so the expectation is that no tracker is needed (swap each companion leaf's rules via `computedProps` and let the engine revalidate). Note the checkout's `createTransitionTracker` was deleted in FEAT-010's rebuild, so there is no longer a helper to copy; confirm the GAP 2 coverage once during implementation as specified. The order badge (`globalIndex + 1`) renders; the up/down chevrons and the `order`-writing logic are ST-02's extension of this same file.
- Every branch (`fromSender`, `subjectContains`, `largerThan`, `hasAttachment`) carries `type: 'rule'` (load-bearing for the `-choice-array-item` slot resolution, per the feature's component mapping) and the shared action block as `children` (ADR-2, ADR-3). No field or child anywhere is named `order` (ADR-6).
- Reused as-is: `ChoiceArraySectionCard` (add toolbar, count tag, budget disabling), `SectionCard`, `FormField` / `TextInput` / `SelectInput`, `AppButton`, `AppIcon` (plus/bin/chevron icon set, chevrons unused until ST-02).

No `packages/core/src/` change and no changeset: everything used (`explicitChoiceSelection`, `displayOrder`, `computedProps`, the `ctx`-based `validation` closure channel) is already exported, per the feature architecture's verification.

Dependencies: none. This is the first story in implementation order. ST-02, ST-03, and ST-04 all extend the files created here.

## QA plan

### Test infrastructure reality (read first)

This story's code lives entirely under `docs/.vitepress/theme/components/`. `docs/` is excluded from `pnpm-workspace.yaml`, has no `vitest.config.*`, no `vitest`/`@vue/test-utils` devDependency, and no `__tests__/` directory anywhere today. Confirmed by inspection: `CheckoutFormExample.vue`, `CheckoutFormTemplate.vue`, `SplitPaymentLedgerRow.vue`, and `splitPaymentLedgerMath.ts` (the closest precedents, including a pure, framework-free math module) ship with **zero** automated tests. `pnpm -r ci:test:coverage` only walks `packages/*`, so it never touches this story's files; the coverage baseline is unaffected either way (no regression possible, but also no safety net).

Given that precedent, every test below is manual unless stated otherwise. This is consistent with how the checkout example shipped, but it is worth flagging explicitly (see Findings) because this story's conditional-action mechanism (ctx-based validation closures + per-occurrence transition tracker) was called out by the feature's own adversarial review (finding 1) as genuinely new logic, not a carryover display pattern, which makes "manual only" a sharper gap here than it was for the checkout's direct carryovers.

### Acceptance criteria to test mapping

All manual, run against the built docs page (`pnpm docs:dev`, page `/examples/inbox-rules`) in both light and dark mode (`html.dark` toggle) unless noted.

1. **AC1 (mandatory empty state, submit enabled).** Manual: load the page with no rules. Verify the add toolbar is present, the dashed "No rules yet. Until then, every message stays in the Inbox" panel shows, and the submit control is enabled (not disabled by `canSubmit`/`meta.valid`).
2. **AC2 (From sender add + email validation states).** Manual: click "From sender", verify one email input appears. Type an invalid value (e.g. `not-an-email`), tab out, verify rose invalid border + message (`xsd_pattern`). Replace with a valid address, verify emerald valid border, no message.
3. **AC3 (Subject contains add).** Manual: click "Subject contains", verify one text input appears, no validation beyond default required-on-submit.
4. **AC4 (Larger than add, `1fr 90px` sub-grid).** Manual: click "Larger than", verify a number input and a KB/MB select laid out side by side in the documented sub-grid ratio (inspect computed grid-template-columns in devtools, or visually compare against the prototype).
5. **AC5 (Has attachment add, childless note, no marker).** Manual: click "Has attachment", verify the dashed muted "No filter to configure" note renders and no filter input exists. Verify via devtools/values dump (the pre-formatted JSON block mirrors the checkout's) that the occurrence is still present with only `action`-block children, i.e. the occurrence survives submission without a `markChildlessBranchActive`-style marker key. This is also where a code-review check belongs: confirm no file in this story writes such a marker (ADR-2).
6. **AC6 (action select reveals/hides/re-requires companion field).** Manual, per branch type (repeat at least once, e.g. on a "Subject contains" row): set action to "Move to folder", verify `folder` appears and shows a required error on blur-empty. Switch to "Apply label", verify `folder` disappears with no stale error, `label` appears and is required. Switch to "Forward to", verify `label` gone, `forwardTo` appears and required. Switch to "Delete", verify `forwardTo` gone, no companion field visible. Repeat the rapid-switch edge case (folder to label to delete to folder) and confirm no stale required error ever flashes on a hidden field.
7. **AC7 (`forwardTo` email validation).** Manual: with action set to "Forward to", type an invalid email, verify rose invalid state with message; correct it, verify emerald valid state.
8. **AC8 (shared budget of 20, disable + count tag).** Manual: add 20 rules across any mix of the four branches (fastest via repeated clicks on one button, e.g. 20x "Has attachment"). Verify every "add" button disables and the count tag reads "20 of 20". Remove one, verify a button re-enables and the tag updates to "19 of 20".
9. **AC9 (remove renumbers, no gap).** Manual: with 3+ rules, note position badges, remove the middle one, verify the remaining badges renumber to a contiguous 1..N immediately (no gap, no stale badge).
10. **AC10 (dark mode, every state via CSS variables).** Manual: toggle `html.dark` with at least one rule in each of pristine/focus/invalid/valid/disabled(budget-exhausted add) state visible at once (or toggled through sequentially), verify every state resolves through the existing CSS custom properties with no unstyled/wrong-contrast element and no docs-page-specific dark-mode CSS override needed (code-review check: grep the new files for any `.dark` class usage; there should be none beyond what the reused components already carry).

### Edge cases (from the spec's Edge cases section), all manual

- Remove the only remaining rule: list returns to the AC1 empty state, no stale validation message anywhere (check the browser console for vee-validate warnings too).
- Rapid action switching (folder → label → delete → folder) on the same occurrence: already covered under AC6 above; repeat once with the browser's event throttling unaffected (no debounce exists, so this is a plain click sequence) to confirm no error flash.
- Add a rule, remove it immediately before filling anything in: verify sibling occurrences show no orphaned validation state (no stray error badges, no incorrect count tag).
- Add two occurrences of the same branch (e.g. two "Has attachment" rows): verify both addable up to budget and each renumbers independently; this story does not special-case duplicates (that is ST-03), so no unreachable badge is expected here.

### Code-review-level checks (not runnable, but gate merge)

- `type: 'rule'` is present on the choice container and all four branches (load-bearing for `-choice-array-item` slot resolution); a missing one would silently fall back to `default-choice`/`default` slots, which is a hard-to-notice regression since the page would render but lose the row component. Verify by reading the metadata tree, not by a snapshot test (none exists).
- No field or child anywhere is named `order` (ADR-6). Grep the new metadata tree for `name: 'order'` and expect zero matches; `order` arrives in ST-02 when `preserveOrder: true` is turned on.
- `preserveOrder` stays unset/false in this story (explicit per the architecture reference); grep for `preserveOrder` in the new files and expect no occurrence (or an explicit `false`).
- The per-occurrence-path transition tracker is keyed by occurrence path, not a single shared boolean; read the implementation and confirm two different occurrences' action changes do not share tracker state (the failure mode finding 1 called out: a module-level boolean cannot represent N occurrences). PROPOSED (adversarial review): this check applies only *if* a transition tracker is retained after the ADR-5 re-check against landed FEAT-010 behavior (see the Architecture reference note). If FEAT-010's GAP 2 already revalidates the companion fields on the action change, no tracker exists and this check does not apply; the ctx-based `validation` closures (read their own occurrence's `action`) are the part that must be present either way, so verify those instead.

### States from the feature's states policy applicable to this slice

Pristine, focus, invalid, valid, disabled (budget-exhausted add only, per AC8; a de-requiring companion field is removed via `hide`, never shown disabled, per the states policy), empty (AC1, mandatory), and the add-toolbar budget state (AC8). Loading and the network/fetch error state are out of scope for this story (the submit gate here is a skeleton per the architecture reference; ST-02/ST-04 do not change that, and no fetch ever happens on this page).

### Reactivity / render-count (`*.analytics.test.ts`)

Not applicable. The `analytics` setting and its `data-testid="<path>-analytics-render-count"` elements are a `packages/core` test convention exercised from `packages/core/src/components/__tests__/*.analytics.test.ts` against the engine directly (e.g. `DynamicFormItemChoice.analytics.test.ts`). This story writes no engine code and docs has no vitest runner to execute an analytics test even if one were written. The underlying engine behavior this slice leans on (`computedProps` re-evaluation on sibling change, choice occurrence add/remove re-render) is already covered by `packages/core`'s own `DynamicFormItemChoice.analytics.test.ts` and `DynamicFormItemChoice.logic.test.ts`; this story does not need to re-prove engine-level reactivity, only that its own metadata/closures wire into it correctly, which the manual checks above cover.

### Fixtures / existing utilities

None of `packages/core/src/examples/` (`TestForm.vue`, `TestFormTemplate.vue`) applies: those are engine-internal test fixtures for `packages/core`'s own vitest suite, not reachable from docs. This story's own "fixture" is the page itself (`/examples/inbox-rules`) built via `pnpm docs:dev`; no new fixture file is needed since there is no test runner to consume one. The checkout page's values dump (`<pre>{{ JSON.stringify(values, null, 2) }}</pre>` block) is the one reusable manual-debugging technique and should be carried over verbatim into `InboxRulesExample.vue` for the AC5/AC9/edge-case checks above.

### Coverage impact

None measurable: `pnpm -r ci:test:coverage` does not walk `docs/`, so the published-package coverage baseline (`packages/core`) is unaffected by this story in either direction. This is not the same as "fully tested": the new conditional-action-reveal logic ships with no automated coverage at all, matching precedent but worth naming plainly rather than letting "coverage unaffected" read as "covered."

### Time sensitivity

None. Nothing in this story reads the clock, a date, or a timezone-sensitive value.

### Regression risk

- **Touches no `packages/core/src/` file.** No risk to the published package's own behavior or its test suite.
- **Reuses `ChoiceArraySectionCard`, `SectionCard`, `FormField`/`TextInput`/`SelectInput`, `AppButton`, `AppIcon`** as-is (no modification planned). If the developer ends up needing to touch any of them, that is a deviation to flag in Implementation notes, and it reopens regression risk against `/examples/checkout` and `/examples/choices`, which use the same components; re-run those pages' own manual checks (no automated tests exist for them either) if so.
- **Exercises engine surfaces guarded by `packages/core`'s own suite:** `explicitChoiceSelection` / choice occurrence add-remove (`DynamicFormItemChoice.logic.test.ts`, `DynamicFormItemChoice.formApi.test.ts`, `DynamicFormItemChoice.analytics.test.ts`), ctx-based `validation` closures (`DynamicFormItem.validation.test.ts`, `DynamicFormItemChoice.validation.test.ts`), and `computedProps` (exercised across `DynamicFormItem.vue`'s own test files). These guard the engine side; running `pnpm -r ci:test` (already part of `pnpm ci`) before merge confirms this story has not somehow required an engine change (it should not touch any of these files at all).
- **Downstream stories inherit this story's files directly:** ST-02 extends `InboxRuleRow.vue` with reorder controls and flips `preserveOrder: true`; ST-03 adds the unreachable badge to the same row; ST-04 writes prose against this story's anchors. A structural change here (field names, the `type: 'rule'` tag, the transition-tracker shape) has a direct, immediate blast radius on all three; any such change found necessary during implementation should be called out in Implementation notes so ST-02/ST-03/ST-04 are not silently invalidated.

### Untestable / ambiguous acceptance criteria

None found to be untestable as written; all ten map to an observable, checkable behavior. One phrasing worth tightening for the developer and for ST-02's QA plan: AC5's "the occurrence still satisfies the engine's default required check" is only verifiable indirectly (the occurrence does not get silently stripped on submit, and no console warning appears); there is no direct UI signal for "the required check passed." The manual step above (inspect the values dump) is the closest available check; a more direct signal would require either an automated test (not available here) or a debug affordance this story does not plan to add. Not proposing a rewrite, flagging it so the developer knows this check is indirect.

### Findings for adversarial review

1. **should-fix — This story's new, genuinely novel logic (ctx-based per-occurrence validation closures, the per-occurrence-path transition tracker) ships with zero automated test coverage, and no automated test infrastructure exists anywhere in `docs/` to add one.** The checkout precedent this story is modeled on also ships untested, but every checkout mechanism this story explicitly declines to copy (per the feature's own data-flow note) was a direct, already-proven carryover; this story's mechanism is new. Recommend Jeroen decide, at the feature or epic level (not silently in this story), whether `docs/` should gain a minimal `vitest` setup (even scoped to just this one module's logic, extracted into a pure/testable function where possible) before this ships, or whether the manual checklist above plus code review is accepted as sufficient, consistent with how `splitPaymentLedgerMath.ts` and `CheckoutFormExample.vue` already ship. Not resolving this myself since it is an infrastructure/scope decision, not a story-level QA call.

   RESOLVED (adversarial review) — not a blocker for this story. Post-approval ladder rung 1 (approved feature spec) and rung 3 (codebase pattern) both discriminate: the feature architecture scopes this work as docs-only with "No file under `packages/core/src/` changes" and no test infrastructure, and the checkout precedent (`CheckoutFormExample.vue`, `CheckoutFormTemplate.vue`, `SplitPaymentLedgerRow.vue`, `splitPaymentLedgerMath.ts`) ships with zero automated tests against a `docs/` tree that has no vitest runner (confirmed by inspection). Two points sharpen the ruling for ST-01 specifically: (1) ST-01's new logic (the conditional-action reveal via `computedProps` + ctx-based `validation` closures) is inherently form-coupled and not extractable into a pure function the way ST-02/ST-03's `inboxRoutingMath.ts` is, so even a hypothetical docs vitest runner would not cleanly unit-test it without a full form harness; (2) per ADR-5, the engine behavior this slice leans on is covered by `packages/core`'s own suite (and FEAT-010 adds coverage for the GAP 2 revalidation path this story depends on), so the genuinely uncovered part is the metadata/closure wiring, which is manual-only exactly as every prior docs example is. Adding a `docs/` test runner remains a legitimate cross-cutting initiative, but it is a feature/epic-level scope decision for Jeroen, not a gate on this story; this story matches the approved architecture and the established precedent. Nit 2 (PR note that the coverage check proves nothing about this story) stands as written.
2. **nit — `pnpm -r ci:test:coverage` passing on this story proves nothing about this story.** Worth a one-line note in the PR description so a reviewer does not mistake a green coverage check for evidence this story's logic was exercised.

## Adversarial review
Filled by adversarial-reviewer (lite, story level). Blockers-only pass; verified against the checkout precedent (`CheckoutFormExample.vue`, `CheckoutFormTemplate.vue`), the engine's validation wiring (`DynamicFormItem.vue` lines 383-384: `xsd_pattern` is generated only from `restriction.pattern`), `packages/core/src/core/validation.ts`, the approved feature spec (Design, Data flow, ADR-2/ADR-3/ADR-5/ADR-6), and FEAT-010's current status (`in-progress`). No blocker. All ten acceptance criteria are testable and mapped in the QA plan; dependencies are explicit (none upstream; the FEAT-010 sequencing gate is carried and correctly delegated to `/spec:implement`).

1. **should-fix (routed) — AC7 specifies `xsd_pattern` for the `forwardTo` companion email, which contradicts the approved feature Data flow and would reintroduce a stale-error bug.** In `packages/core`, `xsd_pattern` is only ever produced from a `restriction.pattern` facet (`DynamicFormItem.vue`); the checkout's email check that AC7 says it mirrors is a `validation` *closure* (`emailValidation`), a different mechanism with a different message. The feature Data flow ("Conditional action field") states `forwardTo` "additionally carries the checkout's email `validation` closure". Crucially, `forwardTo` is conditionally hidden/de-required by `computedProps`, and a `restriction`-based `xsd_pattern` rule cannot stand down when the field is toggled off (the checkout's gift-message note documents that computedProps cannot untoggle a restriction), so using `xsd_pattern` here would leave a stale invalid-email error on a hidden field after an action switch, the exact flash the story's own Edge cases section guards against. A story silently choosing a mechanism the feature did not is the silent-local-override failure STORY review exists to catch. Routed as a PROPOSED edit on AC7; `xsd_pattern` remains correct for the always-visible `fromSender` leaf (AC2) per the feature scope.

2. **should-fix (routed) — The Architecture reference and QA code-review check #4 mandate the per-occurrence transition tracker unconditionally, contradicting feature ADR-5.** ADR-5 explicitly notes that FEAT-010's GAP 2 (computedProps-driven rule rebuild/revalidation) "may also make the per-occurrence transition tracker unnecessary; re-check at story time against the landed FEAT-010 behavior, keeping the ctx-based validation closures either way." This story is gated behind FEAT-010 `done`, so the implementer builds against FEAT-010's landed behavior, yet the story's "verbatim" wording and the QA plan's merge-gating check #4 would fail a correct implementation that omits a tracker GAP 2 made redundant. Routed as PROPOSED edits to the Architecture reference bullet and QA check #4: the tracker is conditional on the ADR-5 re-check; the ctx-based `validation` closures are the invariant requirement.

3. **resolved — QA plan finding 1 (new conditional-action logic ships with zero automated coverage) is not a blocker for this story.** Ruled per the post-approval ladder; see the RESOLVED note appended under that finding. Accepted as a documented property of docs-only stories, consistent with the FEAT-001 checkout precedent and the approved docs-only architecture; whether `docs/` should gain a test runner is a separate feature/epic-level scope call for Jeroen, not a gate here. QA nit 2 (coverage-check caveat in the PR description) stands.

Status set to `awaiting-approval`: no blocker, no unresolved Open question (the feature's are all DECIDED), and both should-fixes are routed as PROPOSED edits for Jeroen to accept.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
