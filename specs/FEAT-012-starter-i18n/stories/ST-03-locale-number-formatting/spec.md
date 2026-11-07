---
id: ST-03
type: story
feature: FEAT-012
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Locale-aware number formatting over the text input

## Functional
### User story
As a library consumer displaying a decimal- or digit-restricted numeric field to a non-English-speaking user, I want the field's displayed number to use my locale's grouping and decimal-separator convention while the field still validates and stores the canonical value, so that my users read and type numbers the way they expect, with no spurious validation failures.

### Acceptance criteria
- AC1: Given a `fractionDigits`/`totalDigits`-restricted `text` field holding a stored canonical value, when the field is not focused (initial render or after blur), then the displayed value is formatted with `Intl.NumberFormat(locale)` using the active locale tag (defaulting from `StarterLanguagePack.locale`, overridable by a separate setting per OQ7).
  - PROPOSED (adversarial review, finding 2): the formatter must NOT use `Intl.NumberFormat`'s default fraction-digit options. The default `maximumFractionDigits` for the decimal style is 3, and the default `minimumFractionDigits` is 0, so a bare `Intl.NumberFormat(locale).format(Number(value))` silently rounds a stored `1.23456` (valid under `fractionDigits: 5`) to `1.235` and drops trailing zeros (`1234.50` displays as `1,234.5`). Both misrepresent the stored value to the user. AC1 must require the formatter to derive `maximumFractionDigits` from the field's `fractionDigits` restriction (falling back to a value high enough not to truncate, e.g. 20) and set `minimumFractionDigits` so trailing significant zeros survive. Add a test case with `fractionDigits: 5` and a value `1.23456`, and one with a trailing zero (`1234.50`), asserting the displayed string preserves every stored digit.
- AC2: Given the same field, when the user focuses it to edit, then the displayed value switches to the locale's plain (ungrouped) form — the locale's own decimal separator, no grouping separators (e.g. `1234,56` under `nl-NL`, `1234.56` under `en-US`) — per the amended format-on-blur design (finding 5 / OQ8).
- AC3: Given the user types a locale-formatted value and then blurs the field, when the value is parsed, then the parser derives the locale's group and decimal separators via `Intl.NumberFormat(locale).formatToParts(11111.1)` and produces the exact canonical string that `xsd_fractionDigits`/`xsd_totalDigits` validate, with no spurious validation failure.
- AC3a: Given a field is focused and then blurred with no edit at all, when the round trip completes, then the stored value is unchanged, under both `en-US` and `nl-NL` (and any other locale), proving the focused-display and blur-parse steps are self-consistent.
  - `DECIDED (Jeroen)` (adversarial review, finding 1, was a BLOCKER): AC2's original "plain canonical value" (period-decimal, ungrouped) contradicted AC3's locale-aware blur-parser and, read literally, created a silent value-corruption path: focusing then blurring an `nl-NL` field with no edit would parse the period-decimal canonical string `1234.56` under `nl-NL`'s separators (group `.`, decimal `,`), strip the `.` as a group separator, and produce `123456` — which then passes `xsd_fractionDigits` since it no longer contains a decimal point (verified against `validation.ts:117-119`). Resolved at the feature level: OQ8 is amended to mean **locale-decimal, ungrouped** while focused, not literal period-decimal. AC2 is reworded above and AC3a (new) makes the round-trip invariant an explicit, tested requirement. See the feature spec's amended Open question 8.
- AC4: Given `handleChange` fires on every `@input` keystroke exactly as it does today, when the number formatter is added, then the per-keystroke model-write timing and live validation are unchanged; only the displayed string (never the write timing) changes.
- AC5: Given a locale whose group separator is a non-ASCII character (e.g. U+202F or U+00A0), when the parser derives separators via `formatToParts`, then parsing still succeeds (not hardcoded to `,`/`.`).
- AC6: Given two locales with swapped conventions (`en-US`: `1,234.56`; `nl-NL`: `1.234,56`), when the same underlying canonical value is displayed under each, then the displayed strings differ exactly as the locale dictates while the stored/validated value is identical under both.
- AC7: Given a `text` field with no `fractionDigits`/`totalDigits` restriction, when it renders, then this story's formatting does not apply to it (unchanged from today).

### Edge cases
- A value that is incomplete or unparseable while the user is mid-edit (e.g. a trailing separator) is left as the user's raw input until blur; no live reformatting or caret-position math is attempted (the debounced live-reformat alternative was considered and rejected at feature level, OQ8).
- A canonical value that cannot be parsed as a finite number (e.g. empty string) is passed through unformatted rather than producing `NaN`/`Invalid Date`-style text.

### Out of scope
- The new `date` field type (ST-04), though it shares the locale-tag source.
- Chrome strings (ST-01) and validation messages (ST-02).
- Documentation and the Dutch-locale (`nl-NL`) worked example content (ST-05); this story's tests exercise `nl-NL` as a locale tag for correctness, not as the authored Dutch pack object.

## Design reference
`../../prototype.html#number-formatting` — a decimal field (`fractionDigits: 2`) and an integer field rendered under `en-US` (`1,234.56` / `1,500`) and `nl-NL` (`1.234,56` / `1.500`); same underlying value, swapped grouping and decimal separators.

## Architecture reference
- Builds: the locale-aware number formatter/parser util (internal, native `Intl.NumberFormat`, no bundled library per ADR 3) and its wiring into `StarterFormTemplate.vue`'s `#default-input` block for `text` fields governed by `fractionDigits`/`totalDigits`, applying format-on-blur / plain-while-focused per finding 5 / OQ8.
- Reads the locale tag from `StarterLanguagePack.locale` (ST-01's type) by default, overridable by a separate setting (OQ7); no new required setting for the common case.
- No change to `TextInput`'s markup; `sft-input`/`sft-input-suffix` classes are untouched (per the component plan). No change to `packages/core/src/`.
- Dependency: shares the locale-tag source (`StarterLanguagePack.locale`) with ST-04 but is otherwise independent of ST-01/ST-02/ST-04 ("slices 1-3 are all additive and non-overlapping... can proceed in parallel"); can be implemented in parallel with the others once the type shape from ST-01 is agreed.
- Public API surface: none (internal util, no new export). `StarterFormTemplate`'s existing `#default-input` wiring changes internally only.
- Changeset: appends a "locale-aware number formatting" sub-bullet to the shared changeset file ST-01 creates; do not create a second changeset file.
- `specs/components.md`: this story adds no new exported surface; no row update required beyond noting the internal addition if the inventory tracks internals. Documentation and the worked-example demonstration are ST-05's assignment.

## QA plan

### Scope note on cross-story dependency
This story is implemented independently of ST-01 (per the feature architecture's parallel slicing), so `StarterLanguagePack` may not exist yet when this story is tested. The formatter/parser util and its wiring only need a BCP 47 locale tag string, not the pack object. Tests drive the locale tag directly through whatever minimal surface the developer exposes for OQ7 (a locale-tag setting or a prop on the formatter util itself), not through a constructed `StarterLanguagePack`. If the developer lands this after ST-01, the same assertions still hold through `StarterLanguagePack.locale`; no test needs to change shape either way, only the setup line that supplies the tag.

### New fixtures needed
- `packages/starter/src/__tests__/fixtures/metadata.ts`: add `decimalMetadata` (`type: 'text'`, `restriction: { fractionDigits: 2 }`) and `integerMetadata` (`type: 'text'`, `restriction: { totalDigits: 4 }` or similar) alongside the existing `textMetadata`. Reuse `mountInForm` (`fixtures/mountInForm.ts`) exactly as other `StarterFormTemplate.*.test.ts` files do; no new mount helper needed.
- A small locale-tag test fixture (e.g. an array of `[locale, value, expectedDisplay]` tuples for `en-US` and `nl-NL`) local to the new test file(s), not shared, since no other story needs it yet.
- A non-ASCII-group-separator locale fixture for AC5 (e.g. `fr-FR`, which uses U+202F narrow no-break space) confirmed against the actual `Intl.NumberFormat('fr-FR').formatToParts(11111.1)` output in the runtime running the tests (Node's ICU data), not assumed from memory, since the exact code point can vary by ICU version.

### Acceptance criteria to test mapping
- AC1 (format on blur/initial render) → `packages/starter/src/__tests__/numberFormat.logic.test.ts`: mount with `decimalMetadata`, set an initial canonical value (e.g. `'1234.56'`), assert the rendered `value` attribute of the `*-input` element is the locale-formatted string (`'1,234.56'` for `en-US`, `'1.234,56'` for `nl-NL`) before any focus/interaction, and again after blur following an edit.
- AC2 (locale-decimal, ungrouped value while focused) → same file: trigger `focus` on the input, assert the displayed value switches to the locale's decimal-separator form with no grouping separators (`'1234,56'` under `nl-NL`, `'1234.56'` under `en-US`), for both locales.
- AC3 (parse on blur, exact canonical output) → `packages/starter/src/__tests__/numberFormatParser.validation.test.ts`: type a locale-formatted string (e.g. `'1.234,56'` under `nl-NL`), blur, assert the model value (via `mountInForm`'s exposed `values()`) is the exact canonical string (`'1234.56'`) and that `xsd_fractionDigits`/`xsd_totalDigits` validation passes with no error, for both `en-US` and `nl-NL`, both `decimalMetadata` and `integerMetadata`.
- AC3a (focus-then-blur with no edit round-trips unchanged) → same file: mount with a canonical value, trigger `focus` then `blur` with no input event in between, assert the model value is byte-for-byte unchanged, for both `en-US` and `nl-NL`. This is the direct regression test for finding 1's corruption path (a no-edit round trip must never change the stored value).
- AC4 (handleChange timing unchanged) → `packages/starter/src/__tests__/numberFormat.logic.test.ts`: assert `@input` on every keystroke still writes the canonical model value immediately (no debounce) and that live validation (e.g. an invalid partial value mid-typing) still surfaces before blur, matching today's `StarterFormTemplate.validation.test.ts` timing assertions for plain text fields.
- AC5 (non-ASCII separator) → `packages/starter/src/__tests__/numberFormatParser.validation.test.ts`: parse a `fr-FR`-formatted string containing the narrow-no-break-space group separator and assert correct canonical output; a second case feeds `U+00A0` directly to prove the parser is not hardcoded to `,`/`.`/` `.
- AC6 (swapped locale conventions, same canonical value) → `packages/starter/src/__tests__/numberFormat.logic.test.ts`: same model value mounted twice (once per locale setting), assert the two rendered blurred strings differ exactly as `Intl.NumberFormat` dictates, and that `values()` under both is identical.
- AC7 (no restriction, no formatting) → add a case to the same logic test file using the existing `textMetadata` (no `restriction`): assert the displayed value is the raw canonical string unchanged, both focused and blurred, in both locales. This is the regression guard that formatting does not leak onto unrestricted `text` fields.

### Untestable-as-written criteria
None of AC1-AC7 need a rewrite; all are concrete Given/When/Then with an observable DOM/model assertion. The two Edge cases are testable too:
- Incomplete/unparseable mid-edit value (e.g. trailing separator) left as raw input until blur → add a case: type `'1.234,'` under `nl-NL`, blur with input still incomplete per `formatToParts` parsing, assert the util does not throw and either passes the raw string through or produces a sensible canonical attempt (developer must document which; QA plan flags this as needing the developer's implementation notes to state the exact contract, since the story's "left as the user's raw input until blur" line describes the mid-typing display, not the blur-time parse outcome for a still-malformed string). This is a flag for the developer to make explicit in Implementation notes, not a blocking finding.
- Unparseable-to-finite-number canonical value (e.g. `''`) passed through unformatted → add a case: canonical value `''`, assert displayed string is `''`, not `'NaN'`/`'Invalid Date'`, in both focused and blurred states.

### States to assert (feature states policy, this slice)
- Pristine (initial render, blurred, formatted) — AC1.
- Focus (editing, plain canonical) — AC2.
- Invalid (a value that fails `xsd_fractionDigits`/`xsd_totalDigits` after a bad parse, or an unrelated required/pattern failure on the same field) — reuse `sft-input.is-invalid`/`aria-invalid` assertions already present in `StarterFormTemplate.validation.test.ts`'s pattern for `TextInput`; this story adds no new error-state markup (per Architecture reference: "no change to `TextInput`'s markup"), so the test only needs to confirm formatting coexists with an existing invalid state without breaking it (format the value even when invalid, since the restriction rule's own failure is independent of the display layer).
- Valid (opt-in `showValidState`) — reuse the existing `inputFieldState` assertion pattern from `StarterFormTemplate.validState.logic.test.ts` with a `decimalMetadata` field, confirming the `is-valid` class still applies when the formatted value is shown.
- Empty state: not applicable to this slice (no list/array UI here); the "empty canonical value" edge case above covers the field-level empty case instead.
- Loading state: not applicable, this slice has no async affordance.
- Disabled: add one assertion that a disabled restricted field still displays the formatted value (disabled fields are not focusable, so only the blurred/formatted display state is reachable); reuses the existing `disabled` prop pattern from `StarterFormTemplate.disabled.logic.test.ts`.

### Reactivity / render-count
This slice touches `TextInput`'s wiring inside `StarterFormTemplate.vue`'s `#default-input` block, which already has computed-field/render-count coverage in `StarterFormTemplate.analytics.test.ts`. Add one case to that file (or a new `StarterFormTemplate.numberFormat.analytics.test.ts` if the existing file's `it.each` table does not fit): mount a `decimalMetadata` field plus an unrelated sibling text field with `settings: { analytics: true }`, type into the restricted field across several keystrokes, and assert the sibling's render count stays at `1` (no cross-field re-render regression from the new formatting logic) while the restricted field's own render count does not grow unboundedly per keystroke beyond what today's plain-text field already does. This does not touch `DynamicFormItem`/`computedProps` directly (formatting is template-layer only, per Architecture reference), so no `assertNoComputeLoop` concern, but the render-count guard still belongs here because a naively-written `computed()` wrapping the formatter inside the template could reintroduce extra renders.

### Time sensitivity
None. `Intl.NumberFormat`/`formatToParts` on numeric input is locale- and number-dependent only, not clock-dependent; `TZ=Europe/Amsterdam` has no bearing on these tests and no test should assume otherwise.

### Coverage
New code is the formatter/parser util (new file, name per developer, e.g. `numberFormat.ts`) and the modified `#default-input` block. Plan: the util gets full branch coverage through `numberFormatParser.validation.test.ts` (both locales, non-ASCII separator, empty/unparseable edge cases) and the template wiring gets full coverage through `numberFormat.logic.test.ts` plus the analytics addition. No code in this slice is knowingly left uncovered. Run `pnpm -r ci:test:coverage` after adding these files and confirm statement/branch/function coverage is at or above baseline; if the formatter util introduces a defensive branch that is unreachable in practice (e.g. a `formatToParts` shape guard for a locale with no `group`/`decimal` part type), flag it explicitly in Implementation notes rather than leaving silent uncovered lines.

### Regression risk
- Touches `StarterFormTemplate.vue`'s `#default-input` block only (per Architecture reference, the same block already covered by `StarterFormTemplate.validation.test.ts`, `StarterFormTemplate.test.ts`, `StarterFormTemplate.disabled.logic.test.ts`, `StarterFormTemplate.validState.logic.test.ts`, and `StarterFormTemplate.analytics.test.ts`). Re-run all of these after the change; they are the existing regression guard for plain `text`/suffix inputs and must show no change in behavior for fields without `fractionDigits`/`totalDigits` (AC7 is exactly this guarantee, tested explicitly, not just inferred from existing tests passing).
- The suffix-input variant (`sft-input-suffix-row`, lines ~443-459) shares the same `handleChange`/`handleBlur` wiring; add the decimal/integer formatting case to the suffix branch too if a restricted field can carry a `suffix` (check `StarterFieldProperties` for whether `suffix` and `restriction` can coexist; if so, one test case must cover the combination so the suffix label and the formatted value both render correctly).
- Parallel stories ST-01/ST-02/ST-04 touch different blocks of the same file; no file-level conflict expected, but re-run the full `StarterFormTemplate.*.test.ts` suite (not just the new files) before merging, since all stories land in the same file.
- Does not touch `DynamicFormItem`, `computedProps`, or `packages/core/src/` at all (confirmed in Architecture reference), so no core regression surface and no core test suite needs re-running beyond the standard `pnpm ci`.

### Manual verification checklist
- Open the Storybook/docs worked example once ST-05 lands it (not required to block this story's own `adversarial-review`, but flagged here for the verifier): confirm visually, in both light and dark mode, that a decimal field shows grouped/comma-decimal formatting under `nl-NL` and comma-grouped/period-decimal under `en-US` when blurred, and the locale's own ungrouped decimal form (no grouping separator, locale decimal separator) while focused, with the caret staying where expected when clicking mid-value and typing (manual caret-feel check; not automatable with `@vue/test-utils` in a meaningful way since jsdom's caret/selection behavior does not reliably mirror real browser caret math).
- Manually confirm in a real browser (not jsdom) that clicking into a formatted value, editing a middle digit, and blurring produces the expected canonical value with no caret jump artifacts left over from the format-on-blur switch (this is the one interaction jsdom cannot fully substitute for, per CLAUDE.md's general caution about `:style`/visual nuance applying analogously to caret behavior).

## Adversarial review
Reviewed lite (story level); blockers-first. Claims checked against the installed source (`TextInput.vue`, `StarterFormTemplate.vue:441-473`, `packages/core/src/core/validation.ts`), not only reasoned about.

1. **(blocker, RESOLVED by Jeroen) AC2 and AC3 contradicted each other and, read literally, corrupted the stored value silently under a non-ASCII-decimal locale.** AC2 showed the "plain canonical value" (period-decimal, e.g. `1234.56`) while focused; AC3 has the user type a "locale-formatted value" (comma-decimal, e.g. `1.234,56`) and the blur-parser strip locale separators. Combine them under `nl-NL` and a no-edit focus/blur parses the canonical `1234.56` with `group='.'`/`decimal=','`, strips the `.` as grouping, and stores `123456`. Confirmed against `validation.ts:117`: `xsd_fractionDigits` locates the decimal point as a literal `.`, so the canonical form is period-decimal AND a value with no `.` passes `xsd_fractionDigits` (`return true` at line 118-119). The corruption therefore passed validation silently, which is a worse outcome than the spurious-failure risk the feature exists to prevent. `DECIDED (Jeroen)`: adopted the "locale-decimal, ungrouped while focused" design; OQ8 is amended at the feature level (not a silent local override), AC2 is reworded, and AC3a (new) adds the focus/blur round-trip-unchanged requirement as an explicit, tested AC.

2. **(should-fix) AC1 relies on `Intl.NumberFormat`'s default fraction-digit options, which misrepresent the stored value.** The decimal-style default is `maximumFractionDigits: 3`, `minimumFractionDigits: 0`, so `Intl.NumberFormat('en-US').format(1.23456)` is `'1.235'` (a value valid under `fractionDigits: 5` is shown rounded) and `format(1234.5)` drops the trailing zero of a stored `1234.50`. The displayed, blurred value then differs from the stored, validated value, which is exactly the confusion this story is meant to remove. Routed as a PROPOSED edit on AC1 (derive `maximumFractionDigits` from the field's `fractionDigits` restriction, set `minimumFractionDigits` to keep trailing zeros, add `fractionDigits: 5` and trailing-zero test cases). Routed, so does not independently force discussion.

3. **(nit) `integerMetadata` is modelled as `restriction: { totalDigits: 4 }` but `totalDigits` does not mean "integer".** `totalDigits` (`validation.ts:124`, "maximum total significant digits") permits a fractional part (e.g. `12.34` has 4 total digits), so a `totalDigits`-only field can hold decimals, and finding 2's default-rounding concern applies to it too. The "or similar" latitude in the fixture note is fine; just do not assume a `totalDigits` field renders without decimals, and let finding 2's option-deriving cover it. No routing needed.

4. **(nit) The empty-value edge case must guard `Number('') === 0`.** The edge case correctly requires `''` to display as `''`, but `Number('')` is `0`, not `NaN`, so a naive `format(Number(value))` would render `'0'` for an empty field. The edge-case test already pins the `''` -> `''` contract, so this is just a flag for the developer's finite-number guard to test `value === '' || !Number.isFinite(...)`, not `Number.isNaN`. No routing needed.

**Otherwise sound.** AC1-AC7 are concrete and mapped in the QA plan; the `formatToParts(11111.1)` separator-derivation, the non-ASCII separator handling (AC5, with the correct caution to confirm against the runtime's ICU output), the AC7 no-leak regression guard, the analytics/render-count addition, the suffix-branch coverage note, and the ST-01 parallel-slicing dependency note are all present and consistent with the feature architecture. Dependencies are explicit (independent of ST-01/ST-02/ST-04; shares only the locale-tag source with ST-04).

Status: `awaiting-approval` — blocker finding 1 resolved by Jeroen (OQ8 amended at the feature level, AC2/AC3a corrected above); should-fix finding 2 already carried a `PROPOSED` edit; findings 3-4 are nits. No blocker, Open question, or unrouted should-fix remains.

## Implementation notes
Filled by developer during implementation.

## Verification report
Filled by qa-verifier after implementation.
