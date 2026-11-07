---
id: ST-06
type: story
feature: FEAT-011
status: qa
approved_by: ""
pr: ""
---

# Story: Choice cards implement the full APG radio keyboard pattern

## Functional
### User story
As a keyboard user choosing between options rendered as choice cards, I want to tab into the group once and move between options with the arrow keys, matching the `radiogroup`/`radio` roles the cards already expose, so that the keyboard behavior matches what a screen reader tells me the control is.

### Acceptance criteria
1. **The group is a single Tab stop.**
   Given a `ChoiceSectionCard` rendering 3+ `ChoiceCard`s, none selected,
   When tabbing through the page,
   Then exactly one card in the group is reachable by `Tab` (the selected one, or the first enabled one when none is selected); the rest have `tabindex="-1"`.

2. **Arrow keys move selection among enabled cards.**
   Given focus on one card in the group,
   When `ArrowRight`/`ArrowDown` or `ArrowLeft`/`ArrowUp` is pressed,
   Then focus (and the roving `tabindex`) moves to the next/previous enabled card, selecting it, wrapping from the last enabled card to the first (and vice versa).

3. **Disabled cards are skipped by roving and never become the Tab stop.**
   Given a group where one or more cards are `disabled`,
   When arrow-key roving reaches a disabled card's position,
   Then it skips over it to the next enabled card in that direction; a disabled card is never the group's single `tabindex="0"` member.

4. **`Space`/`Enter` activation still works on the focused card.**
   Given focus on a card via Tab or arrow-key roving,
   When `Space` or `Enter` is pressed,
   Then that card's selection is confirmed (unchanged from today's per-card activation).

5. **`radiogroup`/`radio` roles are unchanged.**
   Given the same markup,
   When inspected,
   Then `ChoiceSectionCard` still renders `role="radiogroup"` and each `ChoiceCard` still renders `role="radio"` with the correct `aria-checked`, exactly as today.

6. **Focus-ring appearance is unaffected by this story.**
   Given a card receiving focus via Tab or arrow-key roving,
   When rendered,
   Then it shows the indigo focus ring from ST-02's CSS; this story changes no styling, only script-level `tabindex`/keydown handling.

### Edge cases
- All cards in a group disabled: no card is the Tab stop; the group is unreachable (acceptable, matches a fully-disabled control's expected behavior).
- Exactly one enabled card: arrow keys are a no-op (nowhere to move to); that card is the Tab stop.
- Group with no selection and the first card disabled: the Tab stop lands on the first *enabled* card, not literally the first card.

### Out of scope
- Any visual change beyond what ST-02 already shipped: this story is script-only.
- Error/description association on choice cards: not called out in the feature scope beyond what already exists.

## Design reference
Implements the feature's decision on [Open question 1](../../spec.md#open-questions) and the [Per-section design notes for `#choice-cards`](../../spec.md#per-section-design-notes-maps-to-the-spec-s-required-coverage): "the group becomes one tab stop with arrow-key roving (ARIA APG pattern), matching the roles already in place. The ring looks identical either way, so the visual design needed no change." Prototype anchor: [`#choice-cards`](../../prototype.html#choice-cards). No visual delta; this is a pure keyboard-behavior slice on top of ST-02's ring.

## Architecture reference
Implements the feature architecture's Slicing seam 5, the `ChoiceCard.vue` / `ChoiceSectionCard.vue` entry in the Component plan, Open question 1's decision (full APG pattern), and adversarial review finding 7 (disabled cards must not break roving):

- **`ChoiceSectionCard.vue`** — owns group-level arrow-key handling and roving `tabindex`, skipping disabled cards.
- **`ChoiceCard.vue`** — gains an optional `tabindex` prop (default `0`), overridden to `-1`/`0` by the parent's roving logic.
- **Public API surface touched:** one new optional prop (`tabindex`) on the internal `ChoiceCard` component. Both components are non-exported internal chrome (per `specs/components.md`'s "Non-published surfaces" listing), so this is not a published public-API change, but it is the kind of behavior change the feature's changeset describes.
- **Dependencies on other stories:** depends on **ST-02** for the indigo focus-ring token already being in place (so the ring this story's focus moves land on is the corrected one, not the old low-contrast one). Independent of ST-01/03/04/05.
- **Changeset:** this story carries the feature's single changeset (`pnpm changeset`, minor bump), since it is the last story to change shipped runtime behavior (ST-07 only adds dev-only test tooling, ST-08 is docs-only). The changeset describes the whole feature's user-facing capability per CLAUDE.md's changeset-writing rules (label/description/error association, error and password-strength announcements, full keyboard operability including the choice-card APG pattern, focus management on wizard navigation and array removal, visible focus indicators, and the two new `--sft-*` retheme tokens), not just this story's slice in isolation.
- **Documentation:** none assigned to this story directly. Covered by ST-08's "keyboard operability" summary in `docs/guide/starter-template.md`.
