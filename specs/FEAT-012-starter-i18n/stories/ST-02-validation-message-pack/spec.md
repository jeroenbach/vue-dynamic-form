---
id: ST-02
type: story
feature: FEAT-012
status: approved
approved_by: Jeroen
pr: ""
---

# Story: Translated validation-message dictionary and settings.messages composition helper

## Functional
### User story
As a library consumer building a form for a non-English-speaking audience, I want the engine's built-in validation error text (required, length, pattern, numeric range, digit-restriction, and the rest of the rules) to also be available in a translated set that I opt into through the same `settings.messages` channel I already use to override one message, so that my users see consistent-language error text instead of mixed English chrome with English validation, or me hand-writing all eighteen messages myself.

### Acceptance criteria
- AC1: Given a consumer does not call `starterMessages()` and does not set `settings.messages`, when a validation rule fails, then the error text is exactly today's vee-validate generic fallback (`result.errors[0]`), with no observable change. This verifies the opt-in rule from adversarial-review finding 2.
- AC2: Given a consumer spreads `messages: { ...starterMessages() }` into their `DynamicFormSettings`, when each of the 18 rules (`required`, `minOccurs`, `maxOccurs`, `choiceMinOccurs`, `choiceMaxOccurs`, `maxOccursTotal`, `minLength`, `maxLength`, `length`, `pattern`, `minInclusive`, `maxInclusive`, `minExclusive`, `maxExclusive`, `enumeration`, `whiteSpace`, `fractionDigits`, `totalDigits`) fails, then the shipped English translated message renders for that rule.
- AC3: Given a consumer spreads `messages: { ...starterMessages(), required: 'my own text' }`, when the `required` rule fails, then `'my own text'` renders (the consumer's own per-rule override keeps winning over the pack's entry for that rule).
- AC4: Given a message contains a positional (`{0}`/`{1}`) or named (`{min}`/`{max}`/`{field}`) placeholder, when the rule fails, then the placeholder resolves exactly as it does today through vee-validate's existing substitution, with no change to substitution behavior.
- AC5: Given `starterMessages(pack?)` is called with no argument, when its return value is inspected, then it equals `enStarterPack.messages`; given it is called with an explicit `StarterLanguagePack`-shaped messages object, then it uses that pack's messages instead.
  - PROPOSED (adversarial review, finding 1): the parameter is a **messages dictionary**, not a full `StarterLanguagePack`. Make the signature and wording unambiguous: `starterMessages(messages?: StarterLanguagePack['messages']): StarterLanguagePack['messages']`, defaulting to `enStarterPack.messages`; it returns its argument unchanged (or the English default when absent) and never backfills missing keys. Restate AC5 as: called with no argument it equals `enStarterPack.messages`; called with a `messages`-sub-shape object it returns exactly that object (e.g. a consumer spreading the Dutch worked example writes `starterMessages(nlStarterPack.messages)`, not `starterMessages(nlStarterPack)`). This matches QA AC5(b)'s `starterMessages({ required: 'x' })` deep-equalling `{ required: 'x' }`.
- AC6: Given the dictionary must be keyed by the unprefixed `DynamicFormSettings.messages` keys and not the `xsd_*`/`vdf_*` rule names (finding 1), when `starterMessages()`'s return value's keys are inspected, then every key matches one of the 18 unprefixed names exactly, and none matches an `xsd_*`/`vdf_*` rule name.

### Edge cases
- A custom pack that only defines a subset of the 18 message keys: the rules it does not define fall through to vee-validate's generic fallback for those rules only (the helper does not synthesize missing keys).
- Message dictionary values may be a plain string or a `(ctx) => string` function, matching the existing `ValidationMessage` type; no new `ValidationMessage` shape is introduced.

### Out of scope
- Chrome strings and the active-pack setting (ST-01).
- Locale-aware number/date formatting (ST-03/ST-04).
- The Dutch worked example's message set, and its documentation (ST-05).
- Any change to `xsd_*`/`vdf_*` rule logic itself (feature-level out of scope; only message text changes).

## Design reference
`../../prototype.html#validation` — the same four fields in both packs, pristine → invalid-with-message → valid progression for `required`, `minLength`, `fractionDigits`, and a valid (opt-in `showValidState`) field; the `{field}` placeholder resolves from the consumer's label, the message template from the pack. Reproducing the Dutch half of this anchor needs ST-05's Dutch message set; the English half and the precedence/placeholder mechanics under test in this story are verifiable with the shipped English dictionary alone.

## Architecture reference
- Builds: the English translated message dictionary (18 keys, per finding 1's corrected keying) populated into `enStarterPack.messages`, extending the `StarterLanguagePack` type ST-01 defines; the `starterMessages(pack?)` helper exported from `packages/starter/src/index.ts`, defaulting to `enStarterPack`'s messages (OQ5 Shape A).
- No engine change: `packages/core/src/types/DynamicFormSettings.ts` / `ValidationMessage.ts` already expose the `messages` surface this story targets; the engine's resolution order (`settings.messages → vee-validate generateMessage → rule default`, `DynamicFormItem.vue`/`createValidation.ts`) is unchanged. `packages/core/src/` is untouched by this story.
- Dependency: depends on ST-01 for the `StarterLanguagePack` type's `messages` sub-shape (see ST-01's architecture reference for the ASSUMED boundary). Otherwise independent of ST-01's chrome-string wiring and of ST-03/ST-04; the dictionary content and the helper can be implemented in parallel with ST-01's resolver/template work once the type shape is agreed.
  - PROPOSED (adversarial review, finding 2): this is an **object-level** dependency, not merely a type-level one. ST-01 creates the `enStarterPack` object; this story writes its `messages` property, so the `enStarterPack` object must exist before this story runs (ST-01 lands first in dependency order), and AC5(a)/AC6 assume a fully-keyed `enStarterPack.messages` that only exists after this story. Correct the "in parallel" wording accordingly and decide ownership of the stub: either `StarterLanguagePack.messages` is optional (so ST-01's `enStarterPack` type-checks without it), or ST-01 ships `enStarterPack.messages` as an empty/stub object that this story fills. The feature's slicing note only claimed non-overlapping files for slices 1 and 3; slices 1 and 2 share the `enStarterPack` module, so treat them as sequential, not file-disjoint.
- Public API surface (additive): `starterMessages` export and the English message dictionary (as part of `enStarterPack.messages`). No change to `StarterFieldProperties` or any chrome component.
- Changeset: appends a "translated validation messages (opt-in)" sub-bullet to the shared changeset file ST-01 creates; do not create a second changeset file.
- `specs/components.md`: update the starter row for the `starterMessages` export and the message-dictionary addition per the standing CLAUDE.md rule. The full consolidated pass is ST-05's Documentation assignment.

## QA plan

### Scope note
The engine's own `settings.messages` resolution (positional/named placeholder substitution, `settings.messages → generateMessage → rule default` precedence, per-rule wiring for all 18 keys including the array- and choice-level ones) is already guarded by existing core tests (`packages/core/src/components/__tests__/DynamicFormItem.validation.test.ts`, `DynamicFormItemArray.validation.test.ts`, `DynamicFormItemChoice.validation.test.ts`). This story adds no engine code (`packages/core/src/` untouched per architecture), so these tests are not re-derived here; they are listed under Regression risk as the guard that the channel itself keeps working. This story's own tests live in `packages/starter/src/__tests__/` and target three new things: the English message dictionary's content/keying, the `starterMessages(pack?)` helper's merge behaviour, and the integration that proves the dictionary actually renders through the real pipeline via `StarterFormTemplate`.

### Fixtures and utilities
- Reuse `packages/starter/src/__tests__/fixtures/mountInForm.ts` (mounts a `DynamicForm` + `StarterFormTemplate` host, exposes `values`/`validate`) for every integration test; it already accepts a `settings` object so `settings: { messages: starterMessages() }` plugs in directly.
- Reuse `packages/starter/src/__tests__/fixtures/metadata.ts` (`textMetadata`) for the single-field rules (`required`, `minLength`, `maxLength`, `length`, `pattern`, `minInclusive`, `maxInclusive`, `minExclusive`, `maxExclusive`, `enumeration`, `whiteSpace`, `fractionDigits`, `totalDigits`) by adding a `restriction: {...}` entry per rule, mirroring the pattern in `DynamicFormItem.validation.test.ts`.
- Reuse `packages/starter/src/__tests__/fixtures/arrayHelpers.ts`/`headingArrayMetadata` (`metadata.ts`) for `minOccurs`/`maxOccurs`.
- Reuse `packages/starter/src/__tests__/fixtures/choiceMetadata.ts` (`explicitChoiceArrayMetadata`, which already sets a per-branch `maxOccursTotal: 1`) for `choiceMinOccurs`, `choiceMaxOccurs`, `maxOccursTotal`.
- New fixture needed: none of the above require a new metadata fixture file; add the per-rule `restriction`/occurrence variants as local `it.each` rows in the new test file instead of new fixture exports, matching the existing core convention.
- The dictionary itself (`enStarterPack.messages`) and the `starterMessages` helper are read directly from `@/index` (or `@/i18n` depending on where ST-01 lands the module); do not hardcode the shipped English prose into assertions (see "Avoiding content-text brittleness" below).

### Avoiding content-text brittleness
`resolveMessage` is an internal core util, not exported from `@bach.software/vue-dynamic-form`'s public surface, so starter tests cannot import it to compute an expected string. Hardcoding the exact shipped English sentence in a test would also couple QA to wording the developer/product may still tune. Instead, each per-rule test:
1. Mounts the field with `settings.messages: starterMessages()` and triggers the failure.
2. Independently substitutes the dictionary's own template (`enStarterPack.messages[key]`) using a small local helper that replaces `{field}` with the fixture's own label and `{0}`/named placeholders with the fixture's own restriction param (the same substitution rule `resolveMessage` documents: positional, named, `{field}`).
3. Asserts the rendered text equals that independently-substituted value, and additionally that it differs from the plain vee-validate fallback captured in the no-pack control test (AC1), so a dictionary entry that silently fails to apply is caught even if its substituted text happens to look plausible.
This keeps the test sensitive to wiring and keying bugs (wrong key, substitution broken) without pinning the prose.

### Acceptance criteria to tests
- AC1 → `packages/starter/src/__tests__/starterMessages.validation.test.ts`: mount `textMetadata` with `minOccurs: 1`, no `settings.messages`, trigger validation, assert the `.sft-error` text equals vee-validate's unconfigured generic fallback (captured once as a literal in the test, e.g. via a baseline assertion against the same mount with no pack, matching the existing "no settings.messages" control already used in `DynamicFormItem.validation.test.ts`). Repeat for one array rule (`minOccurs`) and one choice rule (`maxOccursTotal`) as a lighter-weight assurance that opting out leaves every family of rule untouched, not just field-level ones.
- AC2 → same file: `it.each` over all 18 keys (`required`, `minOccurs`, `maxOccurs`, `choiceMinOccurs`, `choiceMaxOccurs`, `maxOccursTotal`, `minLength`, `maxLength`, `length`, `pattern`, `minInclusive`, `maxInclusive`, `minExclusive`, `maxExclusive`, `enumeration`, `whiteSpace`, `fractionDigits`, `totalDigits`), each mounted with `settings: { messages: starterMessages() } }` and the matching fixture/restriction, asserting the rendered text per "Avoiding content-text brittleness" above. A failing row here means the shipped dictionary is missing that key or the key is misspelled/mis-prefixed (would silently fall through to the generic fallback, which the assertion catches because it differs from `enStarterPack.messages[key]`'s substitution).
- AC3 → same file: one test per a representative couple of rules (`required` plus one parameterized rule, e.g. `minLength`) with `messages: { ...starterMessages(), required: 'my own text' }`; assert the overridden rule renders the override and a sibling untouched rule still renders the pack's translated text (proves the spread order, not just the override itself).
- AC4 → folded into the AC2 `it.each` rows: every row whose rule carries a positional/named param (`minLength`, `pattern`, `fractionDigits`, etc.) already exercises substitution as part of asserting the rendered text; no separate test needed, but call out explicitly in the test file's top-of-describe comment that this is what the parametrized rows are jointly proving, so a reviewer doesn't miss it.
- AC5 → `packages/starter/src/__tests__/starterMessages.logic.test.ts`: (a) `starterMessages()` with no argument deep-equals `enStarterPack.messages` (reference equality not required, but no missing/extra keys and no value drift); (b) `starterMessages({ required: 'x' })` deep-equals exactly `{ required: 'x' }` — proves the helper does not backfill the other 17 keys from the English pack when a partial custom pack is passed (this is the sharpest edge case in the story: a backfilling implementation would pass AC2 but silently defeat the "subset pack falls through to generic fallback for the rest" edge case, so this test must assert the *absence* of the other keys, not just the presence of `required`).
- AC6 → same file: `Object.keys(starterMessages())` has length 18, every key is one of the unprefixed names listed above (exact set equality, not just "every key is in the list," to also catch an accidentally-added 19th key), and none starts with `xsd_` or `vdf_`.

### Edge cases to tests
- Partial custom pack (subset of 18 keys) → covered by AC5(b) above, plus one integration-level test: mount with `messages: { ...starterMessages({ required: 'x' }) }`, trigger a rule the partial pack does not cover (e.g. `minLength`), assert it renders the plain vee-validate fallback (not the English dictionary's text, proving no silent backfill at the integration layer too, not just the unit layer).
- String vs. function `ValidationMessage` values → the shipped dictionary only needs to ship as whichever shape the developer picks; add one test asserting every value in `enStarterPack.messages` is either a `string` or a `function` (guards against an accidental third shape slipping in) and, if any shipped entry is a function, one integration test exercising that specific entry to prove function-valued pack entries resolve through the existing `(ctx) => string` path with no change.

### States policy (slice-relevant subset)
This story's only user-visible state is the field-level **invalid-with-message** state (`sft-error` rendering translated text) already covered by every AC2/AC3 row above, plus the **pristine/no-message** state (AC1's no-pack control, and an explicit "pack active but field still untouched, no `.sft-error` rendered" assertion). No empty, loading, disabled, or valid state is specific to this story: the dictionary only changes *what text* an already-existing error state shows, not when it shows or any other chrome state. This is a deliberate narrowing of the feature-level states policy (which covers empty/loading/error states that belong to ST-01/ST-04's chrome and ST-03's number formatting), stated explicitly so its absence here isn't mistaken for a gap.

### Reactivity / render-count
No `*.analytics.test.ts` is added for this story. `starterMessages()` returns a plain object computed once and spread into `settings.messages` at form-setup time; it introduces no new reactive source into `DynamicFormItem`, `computedProps`, or `combinedValidation`, and `packages/core/src/` is untouched. The engine's existing `combinedValidation` `watchEffect`-over-`settings.messages` reactivity (relevant to OQ3's live-switch requirement) is pre-existing behaviour already exercised by core's own tests; this story does not add a new reactive wiring path for the analytics convention to guard.

### Coverage
All new code is in two small, pure/near-pure units: the `enStarterPack.messages` dictionary object (data, covered by AC2/AC6) and the `starterMessages(pack?)` helper (covered by AC5, including its no-backfill branch). Both are fully exercised by the tests above, so `pnpm -r ci:test:coverage` should stay at or above baseline with no knowingly-uncovered branch. If ST-01 lands `starterMessages`/`enStarterPack` in a new module (location depends on ST-01's implementation), update the `publicApiSurface.test.ts` and `index.test.ts` exact-export-list assertions to include the new exports (`enStarterPack`, `starterMessages`, and any `messages`-only sub-type) — flagged here as required developer work, not a QA test, since those two files assert an exact, closed export list and will fail otherwise.

### Time sensitivity
None of this story's behaviour is date/time-dependent; no `TZ=Europe/Amsterdam` consideration applies.

### Regression risk
- `packages/starter/src/StarterFormTemplate.vue` and `ErrorMessage.vue`: untouched by this story (messages resolve above the template, per architecture), but every test above renders through them, so a regression in `.sft-error` rendering would surface here too. Guarded pre-existing by `StarterFormTemplate.validation.test.ts`.
- `packages/core`'s message-resolution pipeline (`DynamicFormItem.vue`, `createValidation.ts`, `resolveMessage.ts`): untouched; guarded by `DynamicFormItem.validation.test.ts`, `DynamicFormItemArray.validation.test.ts`, `DynamicFormItemChoice.validation.test.ts`.
- `publicApiSurface.test.ts` / `index.test.ts`: will fail the moment ST-01 or this story adds a new export, by design (exact-list assertion). Must be updated as part of implementation; called out so it isn't mistaken for a flaky or unrelated failure.
- ST-01 (parallel/dependency): this story only depends on ST-01's `StarterLanguagePack` type shape (the `messages` sub-shape), not its chrome resolver or template wiring. No shared runtime code path, so ST-01's chrome tests and this story's message tests cannot regress one another; only a type-shape mismatch could break the build, which `pnpm typecheck` already catches.
- ST-03/ST-04: share no code path with this story (locale-aware number/date formatting is unrelated to `settings.messages`); no regression risk in either direction.

### Untestable / underspecified acceptance criteria
None of the six ACs are untestable as written; AC2 and AC4 are tested jointly (see above) rather than with fully separate test files, which is a test-organization choice, not a rewrite of the criteria. No rewrite proposal is needed for this story.

### Open questions
- None added by this QA plan. The story's architecture and acceptance criteria are concrete enough to test without further decisions from Jeroen.

## Adversarial review

Lite (story-level) review. Blockers only are decisive; should-fixes routed as PROPOSED edits. Factual claims checked against the installed source, not only reasoned about.

Verified clean (so these are not findings):
- All 18 rules named in AC2 exist as registered `defineRule` names in `packages/core/src/core/validation.ts` (`xsd_required`, `xsd_minOccurs`, `xsd_maxOccurs`, `xsd_choiceMinOccurs`, `xsd_choiceMaxOccurs`, `vdf_maxOccursTotal`, `xsd_minLength`, `xsd_maxLength`, `xsd_length`, `xsd_pattern`, `xsd_minInclusive`, `xsd_maxInclusive`, `xsd_minExclusive`, `xsd_maxExclusive`, `xsd_enumeration`, `xsd_whiteSpace`, `xsd_fractionDigits`, `xsd_totalDigits`), and each maps 1:1 to an unprefixed key on `DynamicFormSettings.messages` (verified in `DynamicFormSettings.ts`, exactly the 18 keys AC2/AC6 list). So no AC2 row is untriggerable for lack of a rule. (Note aside: `CLAUDE.md`'s rule list is stale, it omits `maxOccurs`/`choiceMaxOccurs`/`maxOccursTotal`; not this story's concern.)
- `resolveMessage` is genuinely not exported from core's public surface (no match in `packages/core/src/index.ts`), so the QA plan's "cannot import it, substitute independently" anti-brittleness premise holds.
- Every reused fixture the QA plan names exists: `fixtures/mountInForm.ts`, `fixtures/metadata.ts` (`textMetadata`, `headingArrayMetadata`), `fixtures/arrayHelpers.ts`, `fixtures/choiceMetadata.ts`. `explicitChoiceArrayMetadata` does set a per-branch `maxOccursTotal: 1` (webhook branch), as claimed. The core guard tests `DynamicFormItem(.Array/.Choice).validation.test.ts` exist.
- AC1 directly verifies the feature's AR-2 opt-in rule, and Shape A (`starterMessages()` spread) is opt-in by construction, consistent with OQ5. No contradiction with the approved feature design/architecture.
- No Open questions are added by this story.

Findings:

1. **(should-fix) `starterMessages`'s parameter shape is self-contradictory across AC5 and the QA plan, and this ships as a public helper signature.** AC5 says the helper is called "with an explicit `StarterLanguagePack`-shaped messages object" and the signature is written `starterMessages(pack?)`, both of which read as "pass a full `StarterLanguagePack`" (which has `.messages`, `.locale`, and chrome keys). But QA plan AC5(b) tests `starterMessages({ required: 'x' })` deep-equalling `{ required: 'x' }`, and `{ required: 'x' }` is not a `StarterLanguagePack` (no `.locale`, no chrome keys), it is a bare `messages` sub-dictionary. The two readings are mutually exclusive: under the full-pack reading AC5(b)'s input is malformed and its expected output is undefined; under the messages-dict reading the parameter name `pack?` is a misnomer a consumer (and the ST-05 Dutch worked example) will trip on (`starterMessages(nlPack)` vs `starterMessages(nlPack.messages)`). Because this is an exported, published helper, an ambiguous or misnamed parameter type is a later breaking change to fix. The QA plan effectively commits to the messages-dict reading (AC5(b) only makes sense that way); the AC and architecture wording must be made to match it. Routed as a PROPOSED edit to AC5 and the Architecture reference. This does not contradict the approved feature: the feature's OQ5 wording ("a `StarterLanguagePack`-shaped messages object, defaulting to `enStarterPack`'s messages") already means the `messages` sub-shape; this only disambiguates it in the story.

2. **(should-fix) The "implement in parallel with ST-01" claim understates a hard object-level dependency: both stories write the single `enStarterPack` object.** ST-01 creates `enStarterPack` (chrome-string portion; `StarterLanguagePack` type incl. a `messages` sub-shape). This story "populates the English translated message dictionary into `enStarterPack.messages`". That is the same exported object in the same module, not merely ST-01's type: ST-02 cannot populate `enStarterPack.messages` until the `enStarterPack` object exists, and AC5(a) (`starterMessages()` deep-equals `enStarterPack.messages`) assumes a fully-keyed `enStarterPack.messages` that only exists after this story runs on top of ST-01's object. The story's line 40 ("can be implemented in parallel with ST-01's resolver/template work once the type shape is agreed") is therefore inaccurate, and if `StarterLanguagePack.messages` is a required (non-optional) field, ST-01's `enStarterPack` will not type-check until it ships at least a stub `messages`. In dependency-ordered (ST-01-first) implementation this is harmless, but the "parallel / non-overlapping files" framing (inherited from the feature's slicing note, which only discussed the slice 1/3 overlap) is wrong for slices 1 and 2 and should be corrected so the developer sequences ST-01's object before this story and knows who owns the `messages` stub. Routed as a PROPOSED edit to the Dependency line.

3. **(nit) The AC2 anti-brittleness substitution helper assumes string-valued dictionary entries and will break on a `(ctx) => string` entry.** The "Avoiding content-text brittleness" step 2 does `.replace()` on `enStarterPack.messages[key]`. The story's own edge case allows a dictionary value to be a `(ctx) => string` function, and the edge-cases-to-tests section handles function values only in a separate test, not in the AC2 `it.each`. If any shipped English entry is a function, the AC2 row for it throws in the helper rather than asserting. Low risk (the shipped English set is very likely all strings), but the substitution helper should branch on `typeof entry` (call if function, substitute if string) so a future function-valued entry does not silently break AC2. No routing needed (nit).

## Implementation notes
Filled by developer during implementation.

## Verification report
Filled by qa-verifier after implementation.
