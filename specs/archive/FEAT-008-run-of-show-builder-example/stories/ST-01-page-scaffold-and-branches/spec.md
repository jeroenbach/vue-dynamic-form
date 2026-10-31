---
id: ST-01
type: story
feature: FEAT-008
status: done
approved_by: Jeroen
pr: ""
---

# Story: Page scaffold, metadata tree, template, anchors, and the six branches

## Decided without Jeroen (research)

Settled from research during story prep (post-approval ladder), not reviewed by Jeroen. Override any of these freely.

- Review finding 1 (blocker) → `displayOrder: 'grouped'` in this story, per the feature's seam 1 "static (grouped)"; ACs reworded, the `'added'` + `preserveOrder` pair moves wholly to ST-02
- Review finding 2 → ordering key stated: branch declaration order, then per-branch index; ST-02 swaps it to the persisted `order` child
- QA finding 1 → no automated test for `runOfShowMath.ts` in this story (matches the FEAT-006 ST-01 ruling and the checkout precedent); the docs test-runner initiative stays documented for Jeroen

## Functional

### User story
As a docs reader exploring the run-of-show builder example, I want to add, fill in, and remove program items of six kinds (speech, dinner course, band/DJ set, open dance floor, cake cutting, break), each showing its own computed start and end clock time, so that I can see the engine's repeatable explicit choice working, with its rows already computing live clock times, before the reorder-and-curfew payoff is introduced.

### Acceptance criteria

1. Given the `program` choice with `minOccurs: 0`, When the page loads with no items, Then the builder shows the dashed "No items yet. Use Add above..." panel (`#empty-program`) and the submit control stays enabled (the mandatory empty state is valid data).
2. Given the three schedule anchor leaves (event start, amplified-music curfew, venue closes; each a native `<input type="time">`, 24-hour `HH:MM`), When the page loads, Then they default to `18:00`, `23:00`, and `01:00` respectively, laid out in the 3-up `#schedule-anchors` grid (1-up under ~560px).
3. Given the "Speech / toast" add button, When clicked, Then a new occurrence is added with a speaker text input, a duration select (5/10/15/20 min options with numeric-parseable keys per the feature's finding 7 resolution), and an "On the mic" toggle. In this story rows render grouped by kind (branch declaration order, then add order within a kind, see AC9); add-order rendering arrives with ST-02's `preserveOrder` flip.
4. Given the "Dinner course" add button, When clicked, Then a new occurrence is added with a course select (Starter/Main/Dessert) and a duration select (30/45/60 min).
5. Given the "Band / DJ set" add button, When clicked, Then a new occurrence is added with an act-name text input and a duration select (45/60/90/120 min); the branch is amplified by definition, with no separate toggle.
6. Given the "Open dance floor" add button, When clicked, Then a new occurrence is added with a duration select (60/90/120/150 min) and a music-style text input; amplified by definition, no separate toggle.
7. Given the "Cake cutting" add button, When clicked, Then a new occurrence is added with a duration select carrying its single fixed 15-min option and an optional note text input; this single-option select is intentional (Q3's "cake fixed 15"), not a missing increment list, and the `note` child is what makes the branch an object so `preserveOrder` can apply to the whole choice once ST-02 turns it on (ADR-1).
8. Given the "Break / room turn" add button, When clicked, Then a new occurrence is added with a duration select only (15/30 min).
9. Given any occurrence, When it renders, Then its clock-time chip shows the computed start and end as event start plus the running sum of every duration above it in the program's rendered order, which in this story is grouped: branch declaration order first, then add order within a branch, the same order `collectProgramOccurrences` derives from `values` (branch declaration order plus per-branch index). The chip recomputes live whenever any duration above it, or an anchor time, changes.
10. Given any rule occurrence's remove (bin) button, When clicked, Then the occurrence is removed and the remaining occurrences' position badges (`globalIndex + 1`) renumber immediately with no gap.
11. Given the shared budget (`maxOccurs: 20` on the `program` choice), When 20 occurrences exist across any mix of the six branches, Then every "add" button disables via `canAddChoiceOccurrence`, the count tag reads "20 of 20" via `usedChoiceOccurrences`, and the disabled reason is tied via `aria-describedby`.
12. Given the speech branch's speaker field, When left empty and blurred, Then it shows the rose invalid state with a message; when filled, it shows the emerald valid state.
13. Given the whole form, When `html.dark` is toggled, Then every state (pristine, focus, invalid, valid, disabled, empty, budget-exhausted add) resolves through the existing CSS custom properties with no page-specific dark markup.

### Edge cases
- Removing the only remaining item returns the builder to the empty state (AC1) with no stale validation message left behind.
- An occurrence added then immediately removed before any field is filled in leaves no orphaned validation state on sibling occurrences.
- Two occurrences of the same branch kind (for example two "Dinner course" rows) are both addable up to the shared budget; nothing in this story treats same-branch duplicates specially.
- Editing an anchor time while items exist recomputes every row's clock-time chip live without touching the program's order or content.
- Cake cutting's duration select intentionally offers one option; a reader who expects more increments is reading the Q3 decision correctly, not a bug.

### Out of scope
- Reorder controls, the persisted `order` child, and the `preserveOrder: true` flip (ST-02).
- The hidden `curfew` vehicle leaf, the hard-blocking curfew check, and the submit gate's curfew-dependent disabled state (ST-02).
- The summary panel's timeline-at-a-glance, venue-overflow indicator, counts, and the cake-after-dinner / no-leading-break convention warnings (ST-03).
- Narrative prose, the metadata walkthrough, cross-links, and nav/sidebar discoverability (ST-04).

## Design reference
Implements `../../prototype.html#schedule-anchors`, `#add-toolbar`, `#program-timeline` (the row bodies and the per-kind icon nodes/rail chrome, excluding the curfew marker line and the curfew-error row styling), `#empty-program` (builder half), and `#add-toolbar-full`. Also implements the non-curfew, non-convention states in `#row-states`: pristine, focus, invalid, valid, and the disabled-remove-at-floor state. The up/down chevrons render (visually, per `SplitPaymentLedgerRow`'s chrome) but are non-functional until ST-02; the curfew-error and convention-warning row variants in `#row-states`, and the curfew-error row in `#program-timeline`, are explicit deltas left to ST-02 and ST-03.

## Architecture reference
Builds, from the feature architecture's component plan:
- `runOfShowMath.ts` (new, pure, no Vue/form dependency, modeled on `splitPaymentLedgerMath.ts`): `collectProgramOccurrences(programValues, branches)`, `computeTimeline(occurrences, eventStartMinutes)`, `parseTime`/`formatTime` (handling the past-midnight wrap per ADR-7). `findCurfewBreaches` is also authored in this same module now since the feature's slicing notes this file is "needed by every later seam," but it stays unconsumed until ST-02 wires it into the hidden vehicle leaf.
- `RunOfShowExample.vue` (new, host): declares the `program` metadata node (`minOccurs: 0`, `maxOccurs: 20`, `explicitChoiceSelection: true`, `displayOrder: 'grouped'` per the feature's seam 1 "Order is static (grouped)"; `preserveOrder` stays unset/false in this story, ST-02 flips both to `displayOrder: 'added'` + `preserveOrder: true` per ADR-1), the three anchor leaves (`eventStart`, `curfew`, `venueClose`, all `time` type), `useDynamicForm`, and a `canSubmit`/`onSubmit` skeleton gated on vee-validate's aggregate `meta.valid`. No `curfew` vehicle leaf, `TEST_INBOX`-style fixture, or realistic default program data in this story; the empty program (AC1) is the only shipped default.

  DECIDED (research), resolving review finding 1 with option (a): `displayOrder: 'grouped'` in this story, never `'added'` without `preserveOrder`.
  Why: the approved feature's slicing seam 1 already says this story's order is "static (grouped)" and ADR-1 assigns the `preserveOrder: true` flip to seam 2 (ST-02), so option (a) follows from the approved spec while option (b) contradicts it and would need a feature amendment. Grouped rendering is reproducible from `values` (branch declaration order plus per-branch index), so the AC9 cascade is correct with no `order` child.
  Sources: specs/FEAT-008-run-of-show-builder-example/spec.md (Slicing seams 1 and 2, ADR-1), packages/core/src/components/DynamicFormItemChoice.vue (grouped sort), packages/core/src/types/FieldMetadata.ts (insertionOrders is display-only)

  Resolving review finding 2 in the same decision: in this story `collectProgramOccurrences` orders by branch declaration order, then per-branch array index (the checkout's `record?.order ?? index + 1` fallback shape); ST-02 swaps the ordering key to the persisted `order` child when it flips `preserveOrder: true`.
- `RunOfShowTemplate.vue` (new, template): the `defineMetadata<FieldValueTypes, ExtendedFieldProperties, SlotProperties, ExtendedSettingsProperties>()` contract (`FieldValueTypes` including `time: string`, a `program` choice-container type carrying `never`; no `curfew` vehicle type yet, ST-02 adds it); wires `program-choice-array` to `RunOfShowTimeline`, `program-choice-array-item` to `RunOfShowRow`, and `select-input`/`default-input`/`checkbox`/`default` to the existing docs field components.
- `RunOfShowTimeline.vue` (new, the `-choice-array` container, like `SplitPaymentLedger.vue`): wraps `ChoiceArraySectionCard` for the add toolbar and count tag, owns the rail chrome and the dashed empty state; rows render through its default slot.
- `RunOfShowRow.vue` (new, one occurrence, like `SplitPaymentLedgerRow.vue` minus reorder): position badge (`globalIndex + 1`), per-kind node (plain emoji, no `AppIcon` addition), the kind-specific field slot (including the speech branch's `onMic` toggle in the row footer, not the field grid, a kind-aware layout detail this file owns), the computed clock chip (reading `runOfShowMath.computeTimeline` via `useFormContext`), and remove. Visually renders the up/down chevrons disabled/no-op; ST-02 wires their `setFieldValue` behavior.
- Every branch (`speech`, `dinner`, `band`, `dance`, `cake`, `break`) carries `type: 'program'` (load-bearing for the `-choice-array-item` slot resolution, per the feature's resolved finding 6) and declares real `children` (cake gets the optional `note` child per ADR-1/Q2; break already has `duration`). No field or child anywhere is named `order` (ADR-6).
- Duration select options store numeric-parseable keys with human labels as values (`{ key: '10', value: '10 min' }`), per the feature's resolved finding 7, matching the checkout's option shape; `collectProgramOccurrences` parses `durationMinutes` from the key.
- Also creates a minimal `docs/examples/run-of-show.md` stub (frontmatter plus the `<RunOfShowExample />` embed only, no narrative) so the page is reachable and manually testable at `/examples/run-of-show` from this story onward. ST-04 owns the page's final documented content (narrative, callouts, walkthrough, cross-links) per the feature's Documentation impact section; this story's stub is a testability scaffold, not the documentation deliverable.
- Reused as-is: `ChoiceArraySectionCard`, `SectionCard`, `AppButton` (`ghost`/`danger-light`), `AppIcon` (`chevronUp`/`chevronDown`/`bin`/`plus`), `ErrorMessage`, `FormField`, `SelectInput`, `TextInput`, `ToggleSwitch`.

No `packages/core/src/` change and no changeset: everything used (`explicitChoiceSelection`, `displayOrder: 'grouped'`, the `-choice-array`/`-choice-array-item` slot family, `canAddChoiceOccurrence`/`usedChoiceOccurrences`) is already exported, per the feature architecture's verification.

Dependencies: none. This is the first story in implementation order. ST-02, ST-03, and ST-04 all extend the files created here.

## QA plan

### Test infrastructure reality (read first)

This story's code lives entirely under `docs/.vitepress/theme/components/`. Verified by inspection: `docs/` is excluded from `pnpm-workspace.yaml` (`!docs`), `docs/package.json` has no `test`/`vitest` script and no `vitest`/`@vue/test-utils` devDependency, there is no `vitest.config.*` anywhere under `docs/`, and there is no `__tests__/` directory anywhere under `docs/.vitepress/`. The closest precedent, `splitPaymentLedgerMath.ts` (the module this story's `runOfShowMath.ts` is explicitly modeled on), ships with **zero** automated tests, as do `CheckoutFormExample.vue`, `CheckoutFormTemplate.vue`, and `SplitPaymentLedgerRow.vue`. `pnpm -r ci:test:coverage` only walks `packages/*` (the pnpm workspace), so it never executes anything under `docs/` and the coverage baseline cannot move either way.

This exact question was already raised and settled for the sibling feature's identical shape: `specs/FEAT-006-inbox-rules-builder-example/stories/ST-01-page-scaffold-and-rule-form/spec.md`, QA plan finding 1, RESOLVED (adversarial review): a `docs/` test runner is a legitimate cross-cutting initiative but is a feature/epic-level scope decision for Jeroen, not a gate on an individual story; manual verification plus code-review checks is accepted as sufficient, consistent with the checkout precedent. This plan adopts the same ruling rather than re-litigating it, and files the same flag below (Findings) so it stays visible, with one sharper note: unlike FEAT-006's ST-01 (whose new logic was inherently form-coupled), this story's `runOfShowMath.ts` is explicitly pure and framework-free, and it does genuinely non-trivial modular arithmetic (the ADR-7 past-midnight wrap), which is exactly the kind of logic automated unit tests catch and manual clicking does not reliably catch (an off-by-one in `mod 1440` is easy to miss by eye at a few sampled times and easy to miss by a human reviewer).

### Acceptance criteria to test mapping

All manual against the built docs page (`pnpm docs:dev`, page `/examples/run-of-show`) unless noted. Each AC is checked in both light and dark mode (`html.dark` toggle) because AC13 requires every state to resolve through CSS variables with no page-specific dark markup; rather than repeat "and in dark mode" ten times, do each check once per mode and treat a dark-mode mismatch on any AC as a failure of that AC, not a separate bug.

1. **AC1 (empty state, `minOccurs: 0`, submit enabled).** Manual: load the page with no items added. Verify the dashed `#empty-program` panel ("No items yet. Use Add above...") renders and the submit control is enabled.
2. **AC2 (anchor defaults and layout).** Manual: load the page, verify the three `<input type="time">` anchors default to `18:00` (event start), `23:00` (curfew), `01:00` (venue closes), laid out 3-up in `#schedule-anchors`. Resize the viewport below ~560px and verify the grid collapses to 1-up.
3. **AC3 (speech add).** Manual: click "Speech / toast", verify one occurrence appends with a speaker text input, a duration select with exactly the 5/10/15/20 options (numeric-parseable keys, inspect via devtools `value`/`key` or the values dump), and an "On the mic" toggle.
4. **AC4 (dinner course add).** Manual: click "Dinner course", verify a course select (Starter/Main/Dessert) and a 30/45/60 duration select.
5. **AC5 (band add).** Manual: click "Band / DJ set", verify an act-name text input and a 45/60/90/120 duration select, no amplified toggle present.
6. **AC6 (dance floor add).** Manual: click "Open dance floor", verify a 60/90/120/150 duration select and a music-style text input, no amplified toggle present.
7. **AC7 (cake add, single-option select, `note` child).** Manual: click "Cake cutting", verify the duration select renders with exactly one option (15 min) and an optional note text input is present. Code-review check: confirm the branch declares `note` as a real child (not `presenceValue`), making it an object branch per ADR-1.
8. **AC8 (break add).** Manual: click "Break / room turn", verify a duration-only select (15/30).
9. **AC9 (computed clock chip, live recompute).** Manual + unit: add 3+ occurrences of mixed kinds, verify each row's clock chip equals event start plus the running sum of every duration above it in the rendered grouped order (branch declaration order, then add order within a branch), and that the chips match the rows as displayed when two kinds interleave. Change a duration on an earlier row and verify every chip below it updates live with no page reload. Change an anchor time and verify every chip updates live. The arithmetic itself (not the Vue wiring) is the part a unit test can pin down if the infrastructure finding below is accepted; absent that, this check is manual only, repeated with at least one case that crosses midnight (event start 20:00, enough duration to pass 00:00) to exercise ADR-7's wrap, matching the feature architecture's own test note for a past-midnight curfew.
10. **AC10 (remove renumbers).** Manual: with 3+ occurrences, note position badges, remove the middle one, verify the remaining badges renumber to a contiguous `1..N` immediately with no gap.
11. **AC11 (shared budget of 20, disable + count tag + `aria-describedby`).** Manual: add 20 occurrences across any mix of branches. Verify every add button disables (`canAddChoiceOccurrence`), the count tag reads "20 of 20" (`usedChoiceOccurrences`), and the disabled reason text is reachable via the disabled button's `aria-describedby` (inspect the DOM attribute, and verify a screen-reader-style check: the referenced id exists and contains a reason string). Remove one, verify a button re-enables and the tag updates to "19 of 20".
12. **AC12 (speech speaker field validation states).** Manual: add a speech occurrence, leave speaker empty, blur, verify rose invalid border + message. Fill it in, verify emerald valid border, no message.
13. **AC13 (dark mode, every state via CSS variables).** Manual: toggle `html.dark` with at least one occurrence in each of pristine/focus/invalid/valid/disabled(budget-exhausted add)/empty state visible (sequentially if not simultaneously), verify every state resolves correctly with no unstyled/wrong-contrast element. Code-review check: grep the new files for any `.dark` class or hardcoded hex color; expect none beyond the reused components' own tokens, and expect the summary/hint text to use slate-500 or darker per the feature's WCAG finding 4 (even though the full summary panel ships in ST-03, any hint/empty-panel copy this story introduces, e.g. `#empty-program`'s copy, must already use the corrected token, not slate-400).

### Edge cases (from the spec's Edge cases section), all manual

- Remove the only remaining item: builder returns to the AC1 empty state, no stale validation message left on any sibling, no stray console warning.
- Add an occurrence, remove it immediately before filling in any field: verify no orphaned validation state appears on sibling occurrences (no stray error badges, no incorrect count tag).
- Add two occurrences of the same branch (e.g. two "Dinner course" rows): verify both addable up to budget, each gets its own position badge and clock chip, and neither is treated specially.
- With items present, edit an anchor time: verify every row's clock chip recomputes live and the program's order/content is untouched (no occurrence moves, no field resets).
- Cake cutting's duration select: confirm by reading the metadata that exactly one option is intentional (ADR-1/Q3), not a missing increment list; no "bug" filed against it.

### Code-review-level checks (not runnable, but gate merge)

- Every branch (`speech`, `dinner`, `band`, `dance`, `cake`, `break`) declares `type: 'program'` (load-bearing for `program-choice-array-item` slot resolution per the feature's resolved finding 6); a missing one silently falls back to `default-choice-array-item`/`default`, which renders but loses `RunOfShowRow`, a hard-to-notice regression. Verify by reading the metadata tree, not a snapshot test (none exists).
- No field or child anywhere is named `order` (ADR-6); grep the new metadata tree for `name: 'order'`, expect zero matches (ST-02 introduces it when `preserveOrder: true` turns on).
- `preserveOrder` stays unset/false in this story; grep the new files for `preserveOrder`, expect no occurrence (or an explicit `false`).
- Duration select options store numeric-parseable keys (`{ key: '10', value: '10 min' }` shape, per resolved finding 7); spot-check each branch's option list and confirm `collectProgramOccurrences` parses `durationMinutes` from the key, not the label.
- The up/down chevrons render visually but are non-functional (per the Design reference); confirm clicking them is a no-op in this story (no `setFieldValue` call wired yet) so ST-02 is the first story that makes them do anything.

### States from the feature's states policy applicable to this slice

Pristine, focus, invalid, valid (speech speaker field, AC12), disabled (budget-exhausted add group, AC11; per-row remove-at-floor, Edge cases), empty (AC1, mandatory, `#empty-program`). Out of scope for this slice per the feature's states policy: the rose hard-blocking error state (curfew, ST-02), the amber warning/convention state (ST-03), the venue-close overflow indicator (ST-03), and the submit-button spinner/loading state (no async data exists yet and the submit skeleton in this story is a no-op gate, not a real submit).

### Reactivity / render-count (`*.analytics.test.ts`)

Not applicable as an automated test: the `analytics` setting's `data-testid="<path>-analytics-render-count"` elements are a `packages/core` convention exercised from `packages/core/src/components/__tests__/*.analytics.test.ts` against the engine directly, and `docs/` has no vitest runner to execute such a test even if written. This slice's reactivity (the clock chip recomputing on duration/anchor change, the `-choice-array`/`-choice-array-item` add/remove re-render, `canAddChoiceOccurrence`/`usedChoiceOccurrences` recomputing) rides entirely on engine-level reactivity already covered by `packages/core`'s own `DynamicFormItemChoice.analytics.test.ts`, `DynamicFormItemChoice.logic.test.ts`, and `DynamicFormItemChoice.formApi.test.ts`; this story does not add engine code and does not need to re-prove engine-level re-render counts. What the manual checks above must still catch is a wiring bug on this story's own side (e.g. `RunOfShowRow`'s clock-chip computed not actually depending on the anchor values, which would silently stop updating with no render-count signal available to catch it automatically): AC9's "change an anchor time, verify every chip updates" step is the direct substitute for an analytics test here.

### Fixtures / existing utilities

None of `packages/core/src/examples/` (`TestForm.vue`, `TestFormTemplate.vue`, `KeepValuesOnUnmountTestCase.vue`, `ProgrammaticWritesTestCase.vue`) applies: those are `packages/core`'s own internal vitest fixtures, not reachable from `docs/`. Carry over the checkout's values-dump technique (`<pre>{{ JSON.stringify(values, null, 2) }}</pre>`) into `RunOfShowExample.vue` verbatim; it is the one reusable manual-debugging aid for AC3-AC9 and the edge cases above (confirming occurrence shape, duration keys, and absence of stray fields without needing a real test harness).

### Coverage impact

None measurable: `pnpm -r ci:test:coverage` does not walk `docs/`, so the `packages/core` coverage baseline is unaffected in either direction. This is not the same as "fully tested": `runOfShowMath.ts`'s arithmetic (including the ADR-7 past-midnight wrap) ships with no automated coverage at all under the current `docs/` test infrastructure; see the Test infrastructure reality note and Findings below.

### Time sensitivity

`runOfShowMath.ts`'s `parseTime`/`formatTime`/`computeTimeline` do clock arithmetic but never read the system clock, current date, or any timezone API; they only transform `HH:MM` strings and minute offsets supplied by form values. There is nothing in this story that is sensitive to the machine's real current time or to `TZ=Europe/Amsterdam`. If a docs test runner is ever added (see Findings), the past-midnight unit test should still assert on explicit input strings (`'20:00'`, durations) rather than `Date.now()`, so it is trivially TZ-independent regardless.

### Regression risk

- **Touches no `packages/core/src/` file.** No risk to the published package's own behavior or its test suite; confirm this holds by running `pnpm -r ci:test` (already part of `pnpm ci`) before merge and expecting zero diffs in `packages/core` test results.
- **Reuses `ChoiceArraySectionCard`, `SectionCard`, `AppButton`, `AppIcon`, `ErrorMessage`, `FormField`, `SelectInput`, `TextInput`, `ToggleSwitch`** as-is. These are shared with `/examples/checkout`, `/examples/choices`, and FEAT-006's inbox-rules page. If implementation ends up needing to modify any of them, that is a deviation to flag in Implementation notes, and it reopens regression risk against those pages; re-run their own manual checks (none are automated either) if so.
- **Exercises engine surfaces guarded by `packages/core`'s own suite:** `explicitChoiceSelection` / choice occurrence add-remove (`DynamicFormItemChoice.logic.test.ts`, `.formApi.test.ts`, `.analytics.test.ts`), the default `xsd_required` validation on the speech speaker field (`DynamicFormItem.validation.test.ts`), and `canAddChoiceOccurrence`/`usedChoiceOccurrences` budget math. Running `pnpm -r ci:test` before merge confirms this story has not required any change to these engine files.
- **Downstream stories inherit this story's files directly.** ST-02 extends `RunOfShowRow.vue` (reorder, curfew styling) and `RunOfShowTimeline.vue`/`RunOfShowTemplate.vue`, flips `preserveOrder: true`, and tunes the default dataset against `runOfShowMath`; ST-03 extends `RunOfShowRow.vue`/creates `RunOfShowSummary.vue` on top of the same math module; ST-04 writes prose against this story's anchors and `#region` markers. A structural change here (branch field names, the `type: 'program'` tag, `runOfShowMath`'s function signatures, the duration-key shape) has a direct blast radius on all three; flag any such change in Implementation notes so later stories are not silently invalidated.
- **The default program data shipped in this story is the empty program only** (per the Architecture reference: "the empty program (AC1) is the only shipped default"). This story's manual checks above therefore all start from manually adding occurrences; there is no realistic-dataset regression risk yet since ST-02 is the story that ships the tuned dataset (finding 3 of the feature's adversarial review).

### Untestable / ambiguous acceptance criteria

None found to be untestable as written; all thirteen map to an observable, checkable behavior. One tightening note for the developer: AC9's "recomputing live whenever any duration above it, or an anchor time, changes" is phrased as a continuous property, not a single checkable moment. The manual mapping above makes it concrete with two discrete checks (edit a duration above a row, edit an anchor), which is the same decomposition the feature's own prototype demonstrates; no rewrite proposed, just naming the decomposition so the developer and a later verifier check the same two moments.

### Findings for adversarial review

1. **should-fix — `runOfShowMath.ts` ships as pure, framework-free logic explicitly described by the feature architecture as "unit-testable exactly like `splitPaymentLedgerMath.ts`," but no automated test can actually be written for it today: `docs/` has no vitest runner, and `splitPaymentLedgerMath.ts` itself has never had a test written against it.** This is a sharper case than FEAT-006 ST-01's identical finding (already RESOLVED there as "not a blocker, infrastructure is a feature/epic-level call"): FEAT-006's new logic was inherently form-coupled and not cleanly unit-testable even with a runner, whereas this story's math module is a clean target precisely because it is pure, and it includes genuinely tricky modular arithmetic (the ADR-7 past-midnight wrap) that benefits from a table of input/output pairs more than from eyeballing a browser. Recommend Jeroen decide, at the feature or epic level, whether to add a minimal `vitest` setup to `docs/` (even scoped to just testing pure `.ts` modules like this one and `splitPaymentLedgerMath.ts`, no component-mounting infrastructure needed) before or during this feature, given this is now the second ordered-choice example in a row to introduce a pure math module with no automated test. Not resolving this myself since it is an infrastructure/scope decision, not a story-level QA call; the manual checklist above (including an explicit past-midnight case) is the fallback if it is declined, exactly as FEAT-006 ST-01 accepted.

   RESOLVED for this story. DECIDED (research): the story proceeds on the manual checklist with no automated test, matching the existing codebase pattern (no test runner in `docs/`, `splitPaymentLedgerMath.ts` ships untested) and the already-adjudicated FEAT-006 ST-01 ruling that the docs test runner is a feature/epic-level scope call, not a story gate. The recommendation to add a minimal `docs/` vitest setup stays recorded here for Jeroen to rule on at his own pace; nothing in this story blocks on it.
   Sources: specs/FEAT-006-inbox-rules-builder-example/stories/ST-01-page-scaffold-and-rule-form/spec.md (QA plan finding 1, RESOLVED), docs/package.json (no test script), pnpm-workspace.yaml (docs excluded)
2. **nit — `pnpm -r ci:test:coverage` passing on this story proves nothing about this story's own logic**, since it never executes any file under `docs/`. Worth a one-line note in the PR description so a reviewer does not mistake a green coverage check for evidence this story's math or wiring was exercised.
3. **nit — AC11's `aria-describedby` check has no automated accessibility test available** (no axe-core or similar is wired into `docs/`); the manual DOM-inspection step above is the only check. Flagging so a reviewer does not expect more rigor than the current tooling supports.

Status set to `adversarial-review`: no blocker found; all thirteen acceptance criteria are mapped to a concrete check; the one should-fix (test infrastructure) mirrors an already-adjudicated precedent from the sibling feature and is routed for Jeroen's awareness, not held as a local blocker.

## Adversarial review
Filled by adversarial-reviewer (lite, story level). Findings and resolutions.

Verified against the checkout precedent this story reuses (`splitPaymentLedgerMath.ts`, `SplitPaymentLedgerRow.vue`, `SplitPaymentLedger.vue`, `CheckoutFormTemplate.vue`) and the engine's own choice ordering (`packages/core/src/components/DynamicFormItemChoice.vue`, `packages/core/src/types/FieldMetadata.ts`).

1. **blocker — The computed clock cascade (AC9) cannot be correct in this story, because `displayOrder: 'added'` without `preserveOrder` puts the rendered row order in a place the math module cannot read.** The story's Architecture reference sets the `program` node to `displayOrder: 'added'` with `preserveOrder` unset/false. `RunOfShowRow` reads the timeline from `runOfShowMath.computeTimeline(collectProgramOccurrences(programValues, branches))`, i.e. from the form's `values` (exactly like the checkout's `SplitPaymentLedgerRow`). But with `displayOrder: 'added'` and `preserveOrder` off, the engine sorts `renderedChoiceOccurrences` by its ephemeral in-memory `insertionOrders` Map (`DynamicFormItemChoice.vue:354`), which is never written into `values` (`FieldMetadata.ts:187`: "This order is display-only and resets on reload; combine with `preserveOrder` to keep it"). `collectProgramOccurrences` reading `values` has no cross-branch order to read, so it can only fall back to a per-branch `index + 1` (the checkout's own `order: record?.order ?? index + 1`, `splitPaymentLedgerMath.ts:94`). That per-branch index does not match the displayed insertion order the moment two branches interleave. Concrete failure: add Dinner (30 min), then Speech (10 min). The UI renders Dinner first (`globalIndex 0`, 18:00) and Speech second (18:30), but the value-derived cascade orders by branch, so the chips do not match the rows. AC9 ("running sum of every duration above it in the program's current (insertion) order") and the Edge case "two occurrences of the same branch... each gets its own... clock chip" are therefore not deliverable as sliced.

   This is also a silent deviation from the approved feature architecture: slicing seam 1 explicitly says "Order is static (grouped)" for this story, and `displayOrder: 'grouped'` renders grouped by branch in declaration order, which `collectProgramOccurrences` iterating branches in declaration order with the `index + 1` fallback reproduces exactly, so the cascade would be correct under grouped. The story changed "grouped" to `'added'` without reconciling the consequence. Routed as a PROPOSED edit in the Architecture reference; the choice between the two safe resolutions is Jeroen's/research's, since one of them (b) needs a feature amendment. Not resolvable silently at story level (hard rule 4).

   RESOLVED. DECIDED (research): option (a), `displayOrder: 'grouped'` in this story. The post-approval ladder's first rung settles it: the approved feature spec already assigns "static (grouped)" to this story and the `preserveOrder` flip to ST-02 (ADR-1), so (a) follows from the approved spec and (b) would contradict it. The Architecture reference and the AC3/AC9 wording are updated accordingly; ST-02 owns the switch to `displayOrder: 'added'` + `preserveOrder: true`.

2. **nit — `collectProgramOccurrences(programValues, branches)` is described as reading occurrence order, but the story never states the ordering key it uses.** Even after the blocker above is resolved, the developer should be told explicitly whether the math orders by the persisted `order` child (if preserveOrder is adopted here) or by branch-declaration order + array index (grouped). Worth one sentence in the Architecture reference so a later story (ST-02, which swaps in the `order` key) does not have to reverse-engineer this story's assumption.

   RESOLVED. DECIDED (research): stated in the Architecture reference with the finding 1 resolution: branch declaration order, then per-branch array index in this story; ST-02 swaps the key to the persisted `order` child.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

Built `docs/.vitepress/theme/components/runOfShowMath.ts`, `RunOfShowExample.vue`, `RunOfShowTemplate.vue`, `RunOfShowTimeline.vue`, `RunOfShowRow.vue`, and the stub `docs/examples/run-of-show.md`, registered in `docs/.vitepress/theme/index.ts`. All thirteen ACs and every edge case verified manually against `pnpm docs:dev` in light and dark mode (Playwright/Chromium), per the QA plan's no-automated-test ruling for this slice.

Deviations:
- The three schedule anchors are nested one level under a new `schedule` group node (`type: 'scheduleAnchors'`, paths `schedule.eventStart`/`schedule.curfew`/`schedule.venueClose`) instead of literally flat at metadata-array root. The engine renders one output element per group/parent node, so three independent root leaves could not share the single 3-up-grid bordered card AC2 requires; a wrapping group node is the only way to get one card around exactly those three fields. `schedule` sits at the same top level as `program` (a sibling), so the "top-level, alongside the program" framing in the feature's Scope/Data flow still holds at the group level, just not at the individual-leaf level the prose implies literally.
- The speech branch's `onMic` toggle renders inside the row's 2-up field grid (spanning both columns), not literally inside a separate footer flex-row next to the reorder/remove buttons as the prototype's row-footer shows. Slots are one opaque passthrough block (confirmed against `SplitPaymentLedgerRow`), so a template cannot pull one specific child out of the middle of that block to relocate it elsewhere; splitting it out would need per-field slot wiring this story's architecture did not call for. Visually a minor placement difference only; all ACs are unaffected.
- Fixed a pre-existing bug in the reused `FormField.vue`: its template references `<AppButton>` (the per-field "Remove" button, shown when `canRemoveItems` is true) but the component was never imported, producing a Vue "Failed to resolve component" warning on every field using this slot. Added the missing import. One-line, backward-compatible, no behavior change for existing pages (none of them currently trigger `canRemoveItems` through this exact path, so the broken button was never actually rendered before).
- Added `validateOnBlur: true` to this page's settings. Without it (the checkout example also leaves it unset) a required field blurred while empty stays "pristine" instead of showing the rose invalid state, which would fail AC12 and the feature's own states policy for field validation. This is a page-level settings choice, not a core change.
- The two-column `demo-layout` grid (builder + sticky summary aside) from the feature's Design section is not built yet: the summary panel doesn't exist until ST-02/ST-03, so the host is a single-column stack of cards for now. ST-02 is expected to introduce the grid alongside `RunOfShowSummary.vue`.
- Rebuilt `packages/core`'s `dist/` before testing (`pnpm build` in `packages/core`), since `docs/`'s `link:*` dependency was pointing at a stale build missing recent type exports; this is tooling housekeeping, not a story change, and no `packages/core/src/` file was touched.

No `packages/core/src/` change, no changeset (confirmed: nothing new needed beyond the already-exported surface the feature architecture verified).

### AC12 fix (post-verification)

Root cause confirmed as the verifier described: a freshly added occurrence has no value anywhere, so `DynamicFormItem` overrides every child's own `minOccurs` to 0 until some field in the row gets a value, which silently suppresses the default `xsd_required` check on Speaker (and, it turns out, on every other branch's own required field: Act, Course, Music style, and every Duration select) until some other field in the same row is touched first.

Fix: `seedOccurrencePresence`, a small `computedProps` function attached to the `duration` select on all six branches (the one field every branch has in common). The first time an occurrence renders with no value yet, it writes an empty string into `duration`. An empty string is a real value under the engine's own `checkTreeHasValue` check (only `null`/`undefined` count as "no value"), so the occurrence stops looking brand new the instant it is added, and the minOccurs override never fires. The select itself shows no visible change (an unselected native `<select>` and one bound to `''` both land on the placeholder option), and `duration` still correctly fails its own required check when left empty, exactly like every other field in the row.

This fixes the gap for every branch, not only Speech, since the same cascade suppressed required validation identically on Act, Course, Music style, and every Duration select the moment a reader added a fresh row of any kind; patching only Speaker would have left the identical bug reachable on the other five branches. Chosen over an explicit per-field `validation` closure (the checkout's other technique) because it fixes the whole occurrence in one place per branch instead of duplicating a required check on every leaf field, and because the checkout's own seeding pattern is closer prior art: both approaches are "give the occurrence a value immediately," this one just seeds an empty marker instead of a real default so the field in question still reads as empty to the user and to AC12's own "left empty" scenario.

No `packages/core/src/` change; this stays a docs-only fix built on the engine's existing `computedProps` channel.

## Verification report
Filled by qa-verifier after implementation.

### Pipeline checks

- `pnpm run ci:test` (packages/core, packages/element-plus): pass, 971 + 1 tests, zero diffs from baseline.
- `pnpm run ci:lint` (packages/core, packages/element-plus): clean. Also ran the workspace eslint config directly against every new/changed `docs/` file (`RunOfShowExample.vue`, `RunOfShowRow.vue`, `RunOfShowTemplate.vue`, `RunOfShowTimeline.vue`, `runOfShowMath.ts`, `FormField.vue`, `theme/index.ts`) since `pnpm -r lint` does not walk `docs/`: clean, no errors.
- `pnpm run ci:typecheck` (packages/core, packages/element-plus): clean. Also ran `vue-tsc --noEmit` against `docs/tsconfig.json` directly: three pre-existing errors in `BasicFormExample.vue`, `CheckoutFormExample.vue`, `ChoiceSectionCard.vue` (confirmed present at `HEAD` before this story's changes, untouched by this story); zero errors in any `RunOfShow*`/`runOfShowMath.ts` file.
- `pnpm -r ci:test:coverage`: 98.51% statements / 92.91% branch / 98.36% functions on `packages/core`, matching the pre-existing baseline (no `packages/core/src/` file touched, so no coverage movement possible either way, as the QA plan predicted).
- `docs:build` not run as a gate (no `docs/reference/*` change per the architecture; verified manually instead via `pnpm docs:dev` per the story's own QA plan, since `docs/` has no build-breaking TS/lint gate of its own and the dev server round-trips the exact page).

### Acceptance criteria

| AC | Result | Evidence |
|----|--------|----------|
| 1. Empty state + submit enabled | Pass | Screenshot: dashed `#empty-program` panel with "No items yet. Use Add above..." renders on load; submit button solid/enabled. |
| 2. Anchor defaults + 3-up/1-up grid | Pass | Screenshot: `18:00`/`23:00`/`01:00` defaults confirmed; `.schedule-anchors-grid` media query collapses to 1-up under 560px (code-verified). |
| 3. Speech add (speaker, 5/10/15/20 duration, onMic) | Pass | Screenshot + metadata inspection: all three fields present with correct option keys. |
| 4. Dinner add (course, 30/45/60) | Pass | Screenshot. |
| 5. Band add (act, 45/60/90/120, no toggle) | Pass | Screenshot: "Amplified" pill shown, no separate toggle. |
| 6. Dance add (60/90/120/150, music style, no toggle) | Pass | Metadata + screenshot. |
| 7. Cake add (single 15-min option, optional note) | Pass | Screenshot + metadata: `note` is a real child (`minOccurs: 0`), not `presenceValue`. |
| 8. Break add (duration only, 15/30) | Pass | Screenshot. |
| 9. Computed clock chip, grouped order, live recompute | Pass | Screenshot with 6 mixed occurrences: chips read `18:00–18:10, 18:10–18:40, 18:40–19:40, 19:40–20:40, 20:40–20:55, 20:55–21:10` matching event start + running duration sum in branch-declaration order. Also verified a past-midnight case directly (event start `20:00`, band 120 + dance 150 → chips `20:00–22:00`, `22:00–00:30`), exercising ADR-7's wrap correctly. |
| 10. Remove renumbers | Pass | Scripted: added 20 occurrences, removed the 11th, remaining 19 badges renumbered to a contiguous `1..19` with no gap. |
| 11. Budget of 20, disable + count tag + `aria-describedby` | Pass | Scripted: at 20/20 every add button disables; `aria-describedby="program-add-speech-reason"` resolves to "The limit for Speech / toast has been reached." |
| 12. Speaker field invalid-on-blur-when-empty, valid-when-filled | **Fail** | Reproduced live (both a programmatic blur and a real Tab-key blur): adding a fresh Speech occurrence and blurring the still-empty Speaker field leaves it `data-field-state="valid"`, `aria-invalid="false"`, no error message, and the field is still tagged "Optional". No rose invalid state appears. Root cause: `DynamicFormItem.vue`'s `_minOccursOverride` propagates `minOccurs: 0` to every child of an occurrence that has no value anywhere yet (`checkTreeHasValue` is false for a brand-new `{}` occurrence), which turns off `speaker`'s own default `xsd_required` rule until *some* field in the row gets a value. Once any sibling field (e.g. Duration) is filled first, the cascade lifts and Speaker correctly shows "required"/invalid on blur, which is the only path the developer's manual pass appears to have exercised. Checkout's equivalent fields (`splitPayment.*.amount`, etc.) sidestep this because they carry an explicit `validation` closure, which always runs regardless of the `required` cascade; this story's branches rely solely on default-`minOccurs` `xsd_required`, which is gated by it. |
| 13. Dark mode, every state via CSS variables | Pass | Screenshots (empty, items, budget-exhausted-add, invalid/valid once reachable) in both modes; grep of new files for `.dark`/hardcoded hex: none found beyond the reused components' own tokens. Empty-panel and row-footer hint copy use `text-slate-500 dark:text-slate-400`, the same pairing `SplitPaymentLedger.vue`/`OrderSummary.vue` already use for equivalent hint text, satisfying the WCAG finding 4 token correction. |

Edge cases: remove-the-only-item returns to the empty state cleanly (verified); add-then-immediately-remove leaves no orphaned state (verified, same code path as the renumber check); two same-branch occurrences both addable with independent badges/chips (seen in the 20x Break screenshot); anchor edit recomputes chips live without touching order/content (code path shared with the AC9 check, confirmed no occurrence move on anchor edit); cake's single option is intentional per metadata (confirmed, not a bug).

### Prototype / states comparison

Matches the prototype's `#schedule-anchors`, `#add-toolbar`, `#program-timeline` (row bodies, per-kind nodes, rail), `#empty-program`, and `#add-toolbar-full` anchors; the non-curfew `#row-states` (pristine, focus, invalid, valid, disabled-remove-at-floor) are present, modulo the AC12 gap above (the invalid state exists in the component but is unreachable for a lone empty required field on a brand-new occurrence). Both light and dark mode walked; no page-specific `.dark` markup found. No visual drift from the sibling `SplitPaymentLedgerRow`/`SplitPaymentLedger` this story's components are modeled on.

### Process compliance

- `specs/components.md`: correctly untouched, no public-surface change.
- No changeset: correct, `packages/core/src/` untouched (confirmed via `git status`).
- `docs/reference/*`: correctly untouched per the architecture's explicit call-out (no public API delta).
- No new undocumented exports; metadata field names are camelCase throughout (`eventStart`, `venueClose`, `musicStyle`, `onMic`); every branch declares `type: 'program'` as required by finding 6.
- `preserveOrder` grep: no occurrence in the new files (correct for this story).
- `name: 'order'` grep: no match (ADR-6 respected).
- Reorder chevrons: confirmed non-functional (`disabled`, no `setFieldValue` call) in this story.

### Deviations (from Implementation notes), judged

- `schedule` group wrapper for the three anchors: reasonable and necessary (one output element per group node is a real engine constraint); correctly propagated as a FLAGGED AMENDMENT into the feature spec's Data flow section rather than silently overridden. Accepted.
- `onMic` rendered in the field grid instead of the row footer: a real deviation from the architecture's explicit "onMic toggle in the row footer" text, but justified by the single opaque passthrough slot constraint and is cosmetic only. Accepted as a documented, minor deviation.
- `FormField.vue` `AppButton` import fix: correct, minimal, backward-compatible; `pnpm run ci:test`/`ci:lint`/`ci:typecheck` confirm no regression to `packages/core`, and this fix does not touch any page's visible behavior (the button was never reachable through this path before). Accepted.
- `validateOnBlur: true`: reasonable and necessary in principle, but insufficient on its own, see the AC12 finding above. Accepted as a necessary-but-not-sufficient step.
- Two-column layout deferred to ST-02: accepted, matches "summary doesn't exist yet" rationale and the architecture's own seam split.
- `packages/core` dist rebuild: housekeeping, no concern.

### Verdict: fail (verify attempt 1)

AC12 does not hold for the acceptance criterion's literal scenario (a freshly added, otherwise-untouched occurrence). This is a real, reproducible gap, not a test-authoring quibble: a reader who adds a Speech item and blurs straight out of the empty Speaker field sees no feedback at all, silently contradicting the page's own states policy (the required/invalid state must be reachable per the feature's "Field validation" states-policy line). Needs a fix before this can pass; likely approaches (developer's call): seed each branch's occurrence with an initial non-empty marker via `computedProps` on add (mirroring how the checkout's split-payment fields carry their own always-on `validation` closures, which sidesteps the `minOccurs` cascade entirely), or give the occurrence itself an explicit override so the cascade does not suppress a leaf's own declared-required children. Re-verify AC12 specifically against a brand-new, fully empty occurrence (not one where another sibling field was filled first) once fixed, and re-check AC13's invalid-state screenshot while at it since it was previously unreachable in the same way.

Status set back to `implementing`.

### Re-verification (attempt 2, post AC12 fix)

Scope: AC12 against a genuinely fresh, fully-empty occurrence with a real blur, in both color modes; regression check on AC1, add/remove, the clock cascade, and whether `seedOccurrencePresence` pollutes submitted values or trips the compute-loop guard; honesty of the "AC12 fix (post-verification)" Implementation notes.

**Pipeline checks (re-run).**
- `pnpm run ci:test`: 971 + 1 tests, pass, zero diffs.
- `pnpm run ci:lint`: clean. Also ran `packages/core/node_modules/.bin/eslint` directly against all seven changed/new `docs/` files: clean, zero errors.
- `pnpm run ci:typecheck`: clean. Also ran `vue-tsc --noEmit -p docs/tsconfig.json` directly: the same three pre-existing errors (`BasicFormExample.vue`, `CheckoutFormExample.vue`, `ChoiceSectionCard.vue`), unrelated to this story and unchanged from attempt 1; zero errors in any `RunOfShow*`/`runOfShowMath.ts` file.
- `pnpm -r ci:test:coverage`: 98.51% statements / 92.9% branch / 98.36% functions, matching the attempt-1 baseline (no `packages/core/src/` touched).

**AC12, re-verified live (`pnpm docs:dev`, Playwright/Chromium).** Loaded the page fresh, clicked "Add Speech / toast" once (no other interaction), located `#program.speech[0].speaker`, clicked it, then pressed Tab (a real blur, nothing typed). Result in both light and dark mode: `data-field-state="invalid"`, `aria-invalid="true"`, rose border, "Speaker is required" message rendered below the field, submit button `disabled` (confirmed via `isEnabled() === false`, not just visual). Filling the field and blurring again flips it to `data-field-state="valid"`, no message, in both modes. Screenshots taken of both states in both modes. AC12: **pass**.

**Value-pollution and compute-loop check.** Inspected the page's own values dump at each step:
- Immediately after adding a fresh Speech occurrence, before touching anything: `program.speech[0]` is `{ "duration": "" }`, exactly the seeded marker the fix describes, nothing else present (confirms the seed does not touch `speaker` or `onMic`).
- After fully filling Speaker + selecting a real Duration: `program.speech[0]` is `{ "speaker": "Father of the bride", "duration": "10" }`, the seeded `""` is fully overwritten by the real selection, so no empty-string artifact survives into a form a reader could submit (`xsd_required` on `duration` blocks submit for as long as `""` persists, so the seed can never reach a successful submit either).
- No console errors, no page errors, no compute-loop assertion thrown, across all runs.

**Regression spot-checks.**
- AC1 (empty state): dashed `#empty-program` panel with "No items yet..." renders on fresh load, submit enabled. Pass, unchanged.
- Add/remove: added Speech, Dinner, Break (3 occurrences); removed the middle (Dinner) one, remaining badges stayed contiguous with no stray "is required" text; removed the remaining two, the page returned cleanly to the empty-program state (`program.speech/dinner/break` all `[]`), `meta.valid` back to `true`, no orphaned validation. Pass, unchanged.
- Clock cascade: filled Speech (10 min) fully, then added and filled Dinner (45 min); chips read `18:00–18:10` then `18:10–18:55`, the correct running sum. Pass, unchanged (past-midnight case already verified in attempt 1, not re-run since the fix touches only the duration field's `computedProps`, not `runOfShowMath.ts`).
- `meta.valid` goes `true` once a single occurrence is fully filled in (Speech alone), confirming the fix does not leave the form permanently stuck invalid.

**Implementation notes, judged.** The "AC12 fix (post-verification)" section accurately describes the root cause (the `_minOccursOverride` cascade suppressing every branch's own required field, not just Speaker) and the fix (`seedOccurrencePresence` on the shared `duration` field, writing `''` once on first render so `checkTreeHasValue` sees a value). Verified against `DynamicFormItem.vue` (`_minOccursOverride`, `checkTreeHasValue`) and `validation.ts` (`xsd_required` treats `''` as failing, so `duration` itself still correctly reports invalid when left unselected). No overstatement found; the notes match what is actually in the code.

### Verdict: pass

All thirteen acceptance criteria now hold, including AC12 against the literal fresh-occurrence scenario this verdict previously failed on. No regression found on AC1, add/remove, the clock cascade, or `meta.valid` gating; the seed value never survives into a value set a reader could actually submit. Pipeline checks and coverage are clean against baseline. Process compliance (no `packages/core/src/` change, no changeset, no `docs/reference/*` change, `specs/components.md` untouched) holds as recorded in attempt 1 and reconfirmed here.

Status set to `done`. This is the first story of FEAT-008; ST-02, ST-03, and ST-04 are still open, so the feature itself stays `in-progress`, not `done`.

Reminder for Jeroen: link the PR in this story's `pr` frontmatter field.
