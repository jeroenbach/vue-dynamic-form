---
id: ST-04
type: story
feature: FEAT-012
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Locale-aware date display (existing `date` field: min/max bound, read-only Intl display)

**Corrected during story prep.** This story originally set out to add a new `date` field type, a dedicated `DateInput.vue` component, and a new `date-input` slot, on the premise that the starter had no date support at all. That premise was wrong: `StarterValueTypes` already ships `date: string` (plus `time`/`datetime-local`/`number`/`email`/`tel`/`url`), added in the same commit that created the starter template (`00e6ba6`), already rendered through the existing `TextInput`/`default-input` path with no dedicated component or slot (confirmed in `specs/components.md`'s starter row and in the live test suite, `StarterFormTemplate.textModes.test.ts`). The error was carried from the feature's own Problem section through the architect, the original feature-level adversarial review, and this story's first QA plan and review, until a later story-level review (ST-05's) grepped the live source. The feature spec's Architecture section ("Locale-aware date display") and this story are both corrected to the much smaller, accurate scope below.

## Functional
### User story
As a library consumer displaying or bounding an existing `date` field for a non-English-speaking audience, I want an optional native min/max bound and locale-aware read-only date display, so that date entry stays reliable and the parts of date display the library controls follow the active pack's locale.

### Acceptance criteria
- AC1: Given `StarterFieldProperties` gains an additive `date?: { min?, max? }` group property, when a `date`-typed field sets it, then the values are forwarded as native `min`/`max` HTML attributes onto the field's existing native `<input type="date">` (rendered via `TextInput`/`default-input`, unchanged), mirroring exactly how `number?.min`/`max`/`step` is already forwarded (`StarterFormTemplate.textModes.test.ts`'s "forwards number.min/max/step" cases). No new component, slot, or `StarterValueTypes` member is introduced.
- AC2: Given a native `min`/`max` bound (AC1) is violated, when the browser validates the input, then its own native validity message surfaces, not a pack-translated `settings.messages` string — the same documented behavior `number?.min`/`max` already has.
- AC3: Given `xsd_required`, `xsd_pattern`, or `xsd_enumeration` is applied to an existing `date` field, when the rule fails, then it validates and translates through `settings.messages` exactly like any other HTML5 text-mode type (no date-specific exception) — this is pre-existing behavior (`StarterFormTemplate.textModes.validation.test.ts` already proves the pattern for `number`/`email`/`url`), confirmed unaffected by this story's additions, with one new case covering `date` specifically since no existing test does.
- AC4: Given `xsd_minInclusive`/`xsd_maxInclusive` is applied to a `date` field, when any non-empty date value is entered, then the rule always fails (the `Number('YYYY-MM-DD')` coercion is `NaN`, and `NaN >= NaN`/`NaN <= NaN` is `false`), making an `xsd_minInclusive`/`xsd_maxInclusive`-restricted date field permanently un-submittable the moment it has a value, for any date; a test asserts the error **is** present regardless of the date entered, not that the rule "passes" or "doesn't constrain". The empty case still passes via `isEmpty` (only `xsd_required` governs emptiness). The docs (ST-05) must steer consumers to the native `min`/`max` property (AC1/AC2) instead.
- AC5: Given a stored `YYYY-MM-DD` value is rendered read-only (e.g. on a review screen), when the active pack's locale tag is applied, then `Intl.DateTimeFormat(locale, { timeZone: 'UTC' })` formats it for display from a UTC-constructed `Date` (or equivalent explicit part parsing), independent of both the user's browser/OS locale and the process's local timezone — the same calendar date renders identically regardless of process `TZ`.
- AC6: Given the display util is exported from `packages/starter/src/index.ts` (not internal), when a consumer imports it directly to build their own `ReviewGroup`/`SubmissionSuccess` usage (neither of which `StarterFormTemplate` renders), then calling it produces the same locale-correct, timezone-independent string AC5 requires, so a consumer can format a stored date for their own review/success screen with no second mechanism to learn.
- AC7: Given the existing native `<input type="date">`'s own editing display already follows the browser/OS locale rather than the pack's locale tag, when a non-English pack is active, then the editing control's displayed format stays unaffected by the pack (pre-existing, documented behavior, not a change this story makes), while the stored value and the read-only display (AC5) correctly follow the pack.

### Edge cases
- A `date` field with both a native `min`/`max` (AC1) and an `xsd_minInclusive`/`xsd_maxInclusive` restriction configured: the two constraints behave independently (the native bound actually constrains per AC2; the `xsd_*` bound always fails on any non-empty value per AC4), and this divergence is covered by a test so it is not mistaken for a bug later.
- A `date` field with no `date?` property set at all: no stray `min`/`max="undefined"` attribute is rendered, mirroring the existing `number?`-absent case already tested.

### Out of scope
- Any change to the existing native `<input type="date">` editing control, the existing `TextInput`/`default-input` dispatch, or `StarterValueTypes` itself. `date` already exists and already renders correctly; this story only adds the `date?: { min?, max? }` property and the read-only display util.
- A custom calendar/date-picker widget (ADR 6 explicitly rejects replacing the existing native control).
- Locale-aware number formatting (ST-03), though sharing the locale-tag source.
- Temporal date-range validation (fixing `xsd_minInclusive`/`xsd_maxInclusive` for dates is a core rule-logic change, out of scope at feature level).
- Chrome strings (ST-01) and validation messages (ST-02).
- Documentation of date display and its limitations (ST-05).

## Design reference
None in `prototype.html`. The prototype predates the recognition that this story's scope is this small (it was built against the original, incorrect "add a new field type" framing's design needs, which never materialized); there was never a dedicated date visual to design since no new input, chrome, or layout is introduced — `date` already renders as a plain `sft-input`, unchanged. This story implements only the read-only `Intl.DateTimeFormat` display util per the Architecture section's "Locale-aware date display" and ADR 6, with no new visual design language.

## Architecture reference
- Builds: `StarterFieldProperties` gains an additive `date?: { min?, max? }` group property (`metadata.ts`), forwarded as native `min`/`max` attributes in the existing `#default-input` block exactly like `number?.min`/`max`/`step`; a new, exported, locale-aware read-only `Intl.DateTimeFormat` display util. No new `StarterValueTypes` member, no new component, no new slot.
- Dependency: a type-shape dependency on ST-01 only (`StarterLanguagePack.locale` must exist; the pure display-util test passes a locale tag explicitly, not a constructed pack), plus sharing that same locale-tag source with ST-03. Otherwise independent of ST-01/ST-02/ST-03's own logic; can be implemented in parallel with the others once the type shape from ST-01 is agreed.
- Public API surface (additive): the `date?` group property on `StarterFieldProperties` is observable (a consumer can set `date: { min, max }` on a field). The display util is **exported** from `packages/starter/src/index.ts`, not internal, so a consumer can call it directly when building their own `ReviewGroup`/`SubmissionSuccess` usage (AC6). No change to `StarterValueTypes`, `TextInput`, or any slot. No change to `packages/core/src/`.
- Changeset: appends a "locale-aware date display" sub-bullet to the shared changeset file ST-01 creates; do not create a second changeset file.
- `specs/components.md`: update the starter row for the new `date?` group property and the exported display util. The full consolidated pass is ST-05's Documentation assignment.

## QA plan

Verified against the live tree: `packages/starter/src/metadata.ts` already has `date: string` in `StarterValueTypes` (no change needed there, confirmed by reading the file directly rather than trusting the earlier spec text); `StarterFormTemplate.vue` already dispatches `date` through `default-input`/`TextInput`, proven by the existing `StarterFormTemplate.textModes.test.ts` (`it.each(['number', 'email', 'tel', 'url', 'date', 'time', 'datetime-local'])`); that same file already proves the `number?.min`/`max`/`step` forwarding pattern this story's `date?.min`/`max` extends verbatim. No `DateInput.vue` is created; no `dateMetadata` fixture gap exists for rendering (a `date`-typed field already mounts cleanly) but a `restriction`-carrying variant is needed for AC4. `StarterFormTemplate.textModes.validation.test.ts` already proves `xsd_minInclusive`/`xsd_maxInclusive`, `xsd_pattern`, `xsd_totalDigits`/`xsd_fractionDigits` compose correctly for other text-mode types (`number`/`email`/`url`); this story adds the equivalent `date` case plus the AC4 always-fails case, which no existing test covers.

No design reference exists for this story (no prototype anchor, and none is needed: there is no new visual surface). This plan is built from the acceptance criteria and architecture reference alone.

### Acceptance criterion to test mapping

| AC | Test | File |
| --- | --- | --- |
| AC1 `date?.min`/`max` forwarded as native attributes, both plain and suffix-row branches, no stray `undefined` attribute when unset | New `it.each` cases mirroring the existing `number?.min`/`max`/`step` cases verbatim: set `date: { min: '2026-01-01', max: '2026-12-31' }` on `dateMetadata`, assert `input.attributes('min')`/`max` match; a second case with no `date?` set asserts both attributes are absent, no stray `="undefined"` in the rendered HTML (same pattern as the existing "never renders a stray min/max/step" case, extended to include `date`) | `StarterFormTemplate.textModes.test.ts` (extend) |
| AC2 native bound violation surfaces via the browser's own validity, not `settings.messages` | Assert that an out-of-native-range date value produces **no** `.sft-error`/pack-translated message when only `date.min`/`max` is set (no matching `restriction`), mirroring the existing "enforces nothing on submit from number.min/max alone" case | `StarterFormTemplate.textModes.validation.test.ts` (extend) |
| AC3 `xsd_required`/`xsd_pattern`/`xsd_enumeration` validate and translate through `settings.messages` for `date`, matching the already-proven pattern for other text-mode types | One new case: `restriction: { pattern: '^202[0-9]-.*' }` on a `date` field, a `2019-...` value fails with the pack's `pattern` message, mirroring the existing `email`/`url` pattern cases exactly | `StarterFormTemplate.textModes.validation.test.ts` (extend) |
| AC4 `xsd_minInclusive`/`xsd_maxInclusive` always fail on a non-empty date; documented as a limitation, not a success | `restriction: { minInclusive: '2030-01-01' }` on a `date` field, enter `'2020-01-01'` (which a real range check would reject, but so would any other date) and assert the `.sft-error`/invalid state **is** present regardless of the date entered, with a comment explaining this proves the documented `NaN` coercion gap (no existing test covers `date` here, only `number`'s matching-type case) | `StarterFormTemplate.textModes.validation.test.ts` (extend) |
| AC5 `Intl.DateTimeFormat(locale, { timeZone: 'UTC' })` formats a stored `YYYY-MM-DD` for read-only display, independent of browser/OS locale and process timezone | Pure unit test of the display util: same input `'2026-01-15'` formatted under `'en-US'` and `'nl-NL'` produces the two locale-correct, differing strings; locale is passed as an explicit argument in every call so the result cannot depend on `navigator.language`/any ambient default; a separate case asserts the same calendar date renders identically regardless of the process's local timezone (constructed via the same UTC-anchored approach, not by changing `TZ` mid-test) | New file, named after whatever the developer calls the util, e.g. `dateDisplay.logic.test.ts` |
| AC6 (display util exported, usable standalone for `ReviewGroup`/`SubmissionSuccess`) | Import the display util from the package's public entry point (not a relative internal path) and assert it produces the same locale-correct, timezone-independent output AC5's pure-function test already proves; assert `publicApiSurface.test.ts`'s export list includes it | `dateDisplay.logic.test.ts` (extend); `publicApiSurface.test.ts` (extend) |
| AC7 native control's own editing display follows browser/OS locale, unaffected by the pack; stored value and AC5's read-only display still follow the pack | Not unit-testable: jsdom has no real rendering engine for a date picker's locale-formatted display text (the DOM `.value` is always `YYYY-MM-DD` regardless of locale). This is pre-existing behavior, not introduced by this story, so no regression test is owed beyond confirming the stored value stays canonical (already covered by the existing `textModes` suite) | Manual checklist item 1 |

### Edge cases to tests
- Both a native `min`/`max` and an `xsd_minInclusive`/`xsd_maxInclusive` configured together: one combined case asserting the native bound's attribute is present (AC1) while the `xsd_minInclusive` check is independently in its failing state (AC4, always fails on any non-empty date) — the two are asserted as independent in the same test, with a comment stating this divergence is intentional and documented, not a bug to "fix" later.
- No `date?` property set: covered in the AC1 test row above, mirroring the existing `number?`-absent case.

### States from the feature's states policy applicable to this slice
- **Pristine / invalid / valid / disabled.** Unaffected by this story: the existing `date`-typed input already participates in these states through the shared `TextInput`/`default-input` path, already covered by the existing `StarterFormTemplate.textModes.*` and `.validState.logic.test.ts`/`.disabled.logic.test.ts` suites (not `date`-specific today, but the mechanism is type-agnostic). No new test needed; this story adds no new markup or state.
- **Error.** Covered by AC3/AC4's rows (`.sft-error`).
- **Empty / Loading.** Not applicable: no array/empty-list surface or async-loading affordance is introduced.

### Reactivity / analytics
This slice adds no new input, no new slot, and no new reactive source: `date?.min`/`max` forwarding is a prop-passthrough identical in shape to the existing `number?.min`/`max`/`step` forwarding, and the display util is a pure function called outside the reactive template tree (by a consumer, not by `StarterFormTemplate`). No `StarterFormTemplate.analytics.test.ts` addition is needed; `date` is not a new row in any render-count table because it is not a new field type.

### Coverage
New code is the `date?.min`/`max` forwarding (a few lines in the existing `#default-input` block, exercised by the extended `textModes.test.ts`/`textModes.validation.test.ts` cases above) and the display util (its own file, full branch coverage via `dateDisplay.logic.test.ts`: valid date string, each locale path, the timezone-independence case). No code in this slice is knowingly left uncovered. Run `pnpm -r ci:test:coverage` after implementation and confirm statement/branch/function coverage does not regress against the pre-story baseline.

### Time sensitivity
AC5's test must run under `TZ=Europe/Amsterdam` and will, by the CI script's own setting, but this surfaces a real correctness risk worth flagging to the developer ahead of implementation: if the display util is implemented as `new Date('2026-01-15')` (parsed as UTC midnight) and then formatted via `Intl.DateTimeFormat(locale).format(...)` in the *local* timezone, a negative-UTC-offset timezone would roll the displayed date back one calendar day. Amsterdam is UTC+1/+2 (never negative), so this specific bug class would **not** be caught by a test running only under `TZ=Europe/Amsterdam` — it would pass in CI and still ship broken for, e.g., a US-timezone server-side render. Implement with no timezone-dependent `Date` construction (e.g. `Intl.DateTimeFormat(locale, { timeZone: 'UTC' })` paired with a UTC-constructed `Date`, or explicit part parsing), and add the explicit timezone-independence test named in the AC5 row above.

### Regression risk
- `StarterFormTemplate.vue`'s existing `#default-input` block gains a few lines forwarding `date?.min`/`max`, in the same block (but a different property check) as the existing `number?.min`/`max`/`step` forwarding; ST-01 and ST-03 touch different blocks of the same file in parallel, so a merge, not a logic conflict, is the only risk.
- `metadata.ts`: `StarterFieldProperties` gains a new optional group property; no change to `StarterValueTypes`, so `metadata.golden.ts`'s `GoldenValueTypes` drift guard is unaffected, but `GoldenFieldProperties` (if it separately mirrors `StarterFieldProperties`) must gain `date?` the same way it already has `number?`.
- `publicApiSurface.test.ts`'s exhaustive export list must gain the new display util's name, the same mechanism used for every other new export in this feature (`enStarterPack`, `resolvePackText`, etc.); it fails red until updated, which is the guard that the export actually ships.
- Every existing `StarterFormTemplate.textModes.*`/`.*.test.ts` suite must stay green unmodified in substance; this story only adds new `it.each` cases/rows, it does not change any existing field type's markup, class, or behavior.
- No `packages/core/src/` file is touched, so the engine's own test suite is unaffected by construction.

### Untestable criteria and rewrite proposals
- **AC7, as worded, is not unit-testable.** It describes a real-browser rendering behavior (the native date picker's displayed format following the OS/browser locale) that jsdom does not simulate; the DOM-visible `.value` is always `YYYY-MM-DD` regardless of locale, which is the opposite of what the criterion describes. This is not a defect in the criterion's wording, just an inherent limitation of the native control (ADR 6), and it is pre-existing behavior this story does not change — no rewrite is proposed, but the manual verification checklist below is the only coverage for it.
- **AC2's native-validity half has the same limitation**, with jsdom's `type="date"` constraint-validation reliability unproven in this codebase (no existing test exercises it, including the existing `number?.min`/`max` tests, which only assert the absence of a pack-translated message, not the native tooltip itself). No rewrite proposed; flagging so the developer does not assume a jsdom assertion for the native popup is possible without first spiking it.

### Manual verification checklist
1. In a real browser (not jsdom), set `date: { min, max }` on a `date` field, enter an out-of-range value, and confirm the browser's own native validity tooltip appears (not a pack-translated `settings.messages` string) and that the form does not silently accept the value as valid on submit.
2. In a real browser, switch the OS/browser locale between English and Dutch (or use two different browser profiles) with the active pack set to Dutch, and confirm: (a) the native date input's own editing display format follows the OS/browser locale, not the pack, exactly as documented (pre-existing behavior); (b) a read-only rendering of the same stored value via the exported `Intl.DateTimeFormat` display util follows the pack's locale correctly regardless of the OS/browser locale.
3. Spot-check both light and dark mode for the existing `date`-typed input (no new markup is introduced by this story, so this is a quick confirmation, not a new design surface).

## Adversarial review

Story-level (lite) review: blockers first, checked against the installed source and the approved feature architecture, not only reasoned about.

**History (preserved for the record).** The first version of this story (and the feature's original "date-in-scope" decision it was built from) rested on a false premise: that `StarterValueTypes` had no `date` member. Four findings were raised against that first version and are preserved below with their resolutions, since the underlying technical content of three of them (the `xsd_minInclusive`/`xsd_maxInclusive` always-fails behavior, the timezone bug, a wording nit) remains true and carries forward into this corrected story unchanged; only the "new field type" framing around them was wrong.

1. **(blocker, RESOLVED via research) The original AC5 (now AC4) and its mapped tests asserted the opposite of the real validation behavior.** Verified in source: `packages/core/src/core/validation.ts:82-83` wires `xsd_minInclusive` → `min_value` and `xsd_maxInclusive` → `max_value`; the installed `@vee-validate/rules@4.15.1` validators return `Number(value) >= Number(min)` / `<= Number(max)`. For a filled date, this is `NaN >= NaN` = `false`, so the rule **fails** and the field is permanently invalid for every date value. `DECIDED (research)`: a rung-1 resolution (the approved feature architecture already stated this correctly), not a live design question. This content is unchanged in the corrected AC4 above.

2. **(should-fix, RESOLVED — same gap as ST-01, one feature-level decision) The read-only `Intl.DateTimeFormat` display util had no call site in the shipped package and was specified as unexported.** `ReviewGroup`/`SubmissionSuccess` take pre-stringified props from the consumer, so an unexported util would be dead code — the same category of gap as ST-01's `resolvePackText`. `DECIDED (Jeroen)`: the util is exported (AC6), the same resolution as ST-01's identical gap.

3. **(should-fix, RESOLVED via research) The original AC7 (now AC5) omitted timezone-independence.** `new Date('2026-01-15')` parses as UTC midnight; formatting in a negative-UTC-offset local timezone rolls the displayed calendar date back a day, uncatchable under `TZ=Europe/Amsterdam`. `DECIDED (research)`: a rung-2 resolution (a well-documented upstream `Date`/`Intl` behavior). This content is unchanged in the corrected AC5 above.

4. **(nit, RESOLVED via research) A wording inconsistency about this story's dependency on ST-01's type.** `DECIDED (research)`: corrected in the Architecture reference above.

5. **(blocker, RESOLVED by Jeroen — this correction) `StarterValueTypes` already had a `date` member; the "new field type" framing throughout this story (and the feature's "date-in-scope" Architecture section) was factually wrong.** Verified: `packages/starter/src/metadata.ts` already declares `date: string` (plus `time`/`datetime-local`/`number`/`email`/`tel`/`url`), added in commit `00e6ba6` (the starter-template feature itself, which predates FEAT-012); `specs/components.md`'s starter row and the live `StarterFormTemplate.textModes.test.ts` both confirm `date` already dispatches through the existing `TextInput`/`default-input` path with no dedicated component or slot. This story (and the feature's Architecture section) is rewritten to the much smaller, accurate scope: a `date?: { min?, max? }` group property and the exported read-only display util, no new value type, component, or slot.

Status: `awaiting-approval` — all five findings are resolved: findings 1-4 as before, and finding 5 (this correction) by Jeroen, rewriting the story to the accurate scope. No blocker, Open question, or unrouted should-fix remains.

## Implementation notes
Filled by developer during implementation.

## Verification report
Filled by qa-verifier after implementation.
