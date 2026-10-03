---
id: FEAT-006
type: feature
status: design
approved_by: ""
epic: ""
---

<!-- epic: optional. Set to the parent EPIC-XXX id when this feature belongs to an
     epic; leave "" for a standalone feature. Features are never nested under the
     epic folder, they only reference it here (flat model). -->


# Feature: Translatable chrome labels for the Element Plus form template

## Problem & goal

**Problem.** The Element Plus template (`ElementPlusFormTemplate`, delivered by FEAT-004) renders three categories of text, and only two of them are translatable today:

1. **Element Plus's own internal strings** (date picker weekday names, "no data" placeholders, and the like) are already translatable: `ElConfigProvider :locale` accepts one of the 60+ locale packs element-plus 2.14.2 ships, and this is entirely Element Plus's own mechanism. Nothing to do here.
2. **Validation messages** are already translatable: core's `settings.messages` on `DynamicFormSettings` lets a consumer override every `xsd_*` rule's text, including with a `(ctx) => string` function that can call an i18n library. Nothing to do here either.
3. **The template's own chrome text** (the "Add" / "Remove" buttons on array and choice sections, the occurrence counter, "Previous" / "Next" / "Submit" on the wizard, and "Click to upload") is hard-coded English with no override path other than replacing the entire slot that contains it. This is the gap.

FEAT-004's stories ST-05, ST-06, and ST-07 each recorded this gap explicitly as an `ASSUMED (story prep)` open point: built-in button text ships as plain English strings in the first version, overridable only by overriding the whole slot, naming "a settings-driven labels mechanism" as the additive follow-up. This feature is that follow-up.

**Goal.** A consumer of `ElementPlusFormTemplate` can override every piece of built-in chrome text through a `labels` bag on `DynamicFormSettings`, the same way `settings.messages` already lets them override validation text, without having to override any slot just to change a word. The mechanism is reactive (a runtime locale switch re-renders the chrome in the new language), per-form (two `DynamicForm` instances on the same page can run in two languages), and i18n-framework-agnostic (a consumer supplies `t('form.add')` from whatever i18n library they already use; this feature does not ship or depend on one).

**Who this is for.**
- **Library consumers** who use `ElementPlusFormTemplate` in a non-English or multi-language app and currently cannot translate "Add", "Remove", "Previous", "Next", "Submit", or the upload prompt without overriding the slot that renders them.
- **Template authors** who want to change this wording for house style (e.g. "Add another" instead of "Add") without taking on a whole slot override.

## Scope

### In scope

- Extend `ElementPlusFormTemplate`'s settings with a `labels` bag, carried through the `ExtendedSettingsProperties` generic that `defineMetadata`/`extendMetadata` already expose (currently `{}` on `elementPlusMetadata` per FEAT-004's architecture). Exact key set is an open question below; the working shape from the discussion is:

  ```ts
  labels?: {
    add?: string
    remove?: string
    previous?: string
    next?: string
    submit?: string
    upload?: string
  }
  ```

- English defaults for every key, used whenever a consumer does not set `settings.labels` at all or omits an individual key.
- Wiring every built-in chrome string identified above (array/choice add and remove buttons, the occurrence counter, wizard previous/next/submit, the upload prompt) to read from `settings.labels` instead of being a literal string in the template markup.
- Confirming (and if needed, documenting) that `settings` already reaches every slot that needs a label, since `DynamicFormTemplate` already passes `settings: DynamicFormSettings<TMetadataConfiguration['extendedSettingsProperties']>` into slot scope; this feature is additive on top of that existing channel, not a new provide/inject path.
- Updating `packages/element-plus`'s README and the Storybook playground to demonstrate `settings.labels` with at least one non-English example.
- Updating `specs/components.md`'s entry for `packages/element-plus` once the package is published (see Scope notes below).

### Out of scope (explicit)

- Element Plus's own internal strings (date picker, empty-state text, etc.). Covered by `ElConfigProvider :locale`, which this feature does not touch or wrap.
- Validation message text. Already covered by core's `settings.messages`; this feature does not change `packages/core` at all.
- Any change to `packages/core`: no new export, no new slot, no change to `DynamicFormSettings`'s base shape, no change to `defineMetadata`, `DynamicFormTemplate`, or any engine file. The `ExtendedSettingsProperties` generic this feature uses already exists precisely to let a template package do this without touching core.
- Shipping or depending on an i18n library (vue-i18n or otherwise). A consumer wires `settings.labels` to whatever i18n mechanism they already use; this feature supplies the slot for that value, not the value.
- Translating chrome text for any template other than `ElementPlusFormTemplate` (the docs-site `AdvancedFormTemplate.vue` and the plain example template in `packages/core/src/examples/` are untouched). Whether the `labels` bag should become a documented convention for future templates is an open question, not scope.
- A docs-site guide or example page. FEAT-004 already decided the docs site gets no Element Plus content until Jeroen asks; this feature follows the same precedent unless Jeroen says otherwise (open question below).
- Interpolation/placeholder support inside label strings (e.g. an occurrence counter that embeds a count or index via `{count}`). Whether any label needs this is an open question below; nothing in scope assumes it.
- Any change to FEAT-004 or its stories (ST-05, ST-06, ST-07, or any other). Those specs are not reopened or modified by this feature; it builds on top of what they deliver once FEAT-004 ships.

## Functional overview

- By default, a consumer using `ElementPlusFormTemplate` with no `labels` setting sees the same English chrome text FEAT-004 ships ("Add", "Remove", "Previous", "Next", "Submit", "Click to upload"). No behavior changes for a consumer who does nothing.
- A consumer sets `settings: { labels: { add: 'Hinzufügen', remove: 'Entfernen', previous: 'Zurück', next: 'Weiter', submit: 'Absenden', upload: 'Zum Hochladen klicken' } }` (passed the same way `settings.messages` is passed today, to `useDynamicForm`/`DynamicForm`) and every chrome string in the template renders in German, with no slot overrides needed.
- A consumer sets only some keys (e.g. `labels: { add: 'Hinzufügen' }`); every other key falls back to its English default, the same partial-override behavior `settings.messages` already has.
- A consumer whose app switches locale at runtime (e.g. via vue-i18n's reactive `t()`) sees the chrome text update immediately, because `settings` is read reactively in the template the same way `settings.messages` already is for validation text.
- Two `DynamicForm` instances on the same page, each with its own `settings.labels`, render in two different languages independently, because `labels` lives in per-instance settings, not in a global config.
- A consumer who wants ElementPlus's own strings (date picker, etc.) translated too still configures `ElConfigProvider :locale` themselves; this feature does not touch that.

## Design (feature level)

Not filled yet; this is where the product-owner phase ends. Note for whoever runs `/spec:design` (or for Jeroen deciding whether to run it at all): this feature touches a template component (`ElementPlusFormTemplate`'s chrome), which is why it is routed through the design phase rather than straight to architecture. But the change itself only swaps the source of existing literal strings for a settings-driven lookup; it adds no new element, layout, or interaction, and the visual reference stays exactly what FEAT-004 already used (`element-plus.org`'s own component documentation). This looks like the same shape of "no new prototype needed" call FEAT-004 made for its own design phase ("Skipped per Jeroen"). Whether to skip design here the same way, or run it briefly to confirm nothing visual is actually affected, is Jeroen's call, not assumed here.

## Architecture (feature level)

Filled by architect. The complete technical design: component/composable plan for the whole feature (reuse / modify / new, referencing specs/components.md), public API impact (exports, props, slots, `defineMetadata` generics, validation rules), backwards-compatibility analysis and the changeset bump type (patch/minor/major per CLAUDE.md), data flow (provide/inject, vee-validate integration, path handling), Mermaid diagrams for non-trivial flows, ADR-style notes for every real decision, and the natural slicing seams for the scrum-master.

## Adversarial review
Filled by adversarial-reviewer at feature level. Findings and resolutions.

## Constraints & assumptions

- This feature depends on FEAT-004 shipping first: it extends `ElementPlusFormTemplate`, `elementPlusMetadata`, and the chrome markup ST-05/ST-06/ST-07 deliver, none of which exist yet under those names in the repository at the time this spec is written (`packages/element-plus/src` still has the pre-FEAT-004 `ElementPlusDynamicForm.vue`). Sequence this feature's implementation after FEAT-004 is `done`.
- `packages/element-plus` is `private: true` until FEAT-004's ST-10 flips it to published. This feature's own changeset (minor, on the element-plus package, mirroring the additive nature of a new optional settings key) is only a real CHANGELOG entry once that package is actually published; until then the changeset rule in `CLAUDE.md` for unpublished packages applies, same as FEAT-004's own stories noted.
- No changes to `packages/core/src/`, so by `CLAUDE.md`'s changeset rule this feature needs no core changeset.
- The `labels` bag rides the same `ExtendedSettingsProperties` generic `defineMetadata`/`extendMetadata` already carry (currently `{}` on `elementPlusMetadata`), so adding it is additive to `elementPlusMetadata`'s type and does not require a new mechanism in `packages/core`.

## Open questions

Questions for Jeroen. Must be resolved before approval.

1. **Exact label key set.** The working set from the discussion is `add`, `remove`, `previous`, `next`, `submit`, `upload`. Does this cover every piece of hard-coded chrome text FEAT-004 ships, or are there others (e.g. a wizard step's default "Step N" fallback title, noted in FEAT-004's ST-07 as falling back to `Step N` when a page has neither `label` nor `name`)? Should "Step N" also become a label (with an interpolation need, see question 2), or is it out of scope because it is a fallback for missing metadata rather than fixed chrome?
2. **Interpolation/placeholders.** Does any label need to embed a dynamic value, most plausibly the occurrence counter FEAT-004's ST-05/ST-06 mention ("the counter" is currently plain text alongside Add/Remove)? If so, the `labels` bag needs a placeholder convention (e.g. a function `(count: number) => string` instead of a plain `string`, mirroring how `settings.messages` already supports `(ctx) => string`) rather than a flat string map. This changes the type shape materially, so it needs a decision before the architect designs it.
3. **Docs-site page.** FEAT-004 decided no docs-site content for the Element Plus template until Jeroen asks. Does this follow-up feature also get no docs page, or is a small addition to whatever FEAT-004's eventual docs page looks like justified once both exist?
4. **Should `labels` become a documented convention for future templates**, not just this one? If a future template package (or the docs-site `AdvancedFormTemplate.vue`) wants the same translatable-chrome pattern, should this feature also write up the `labels`-bag pattern as a recommended convention (in `CLAUDE.md` or a docs page), or is that premature with only one template consuming it?
5. **A possible nicety, not scope: defaulting `labels.upload` from Element Plus's own active locale.** Element Plus's locale packs likely carry an equivalent "click to upload" string already (unconfirmed without checking a specific locale pack's shape). Should the template attempt to read that as a fallback default before falling back to the English literal, so a consumer who has already set `ElConfigProvider :locale` gets a translated upload prompt for free even without setting `settings.labels.upload`? This is explicitly not in scope for this feature; recorded here so the architect (or a later feature) can pick it up if Jeroen wants it.
6. **Public API shape and semver impact.** Confirm the `labels` bag lives on `elementPlusMetadata`'s `extendedSettingsProperties` (fourth `defineMetadata` generic), which needs no core change and reaches every slot through the existing `settings` slot prop (`DynamicFormTemplate` already types `settings: DynamicFormSettings<TMetadataConfiguration['extendedSettingsProperties']>`). If this is correct, is a minor changeset on `packages/element-plus` (additive optional setting) the right bump once that package is published, matching the proposal in Constraints & assumptions?

## Stories
Filled by scrum-master AFTER approval. Links to story folders with implementation order and dependency notes.
