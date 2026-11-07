---
id: ST-08
type: story
feature: FEAT-011
status: qa
approved_by: ""
pr: ""
---

# Story: Document the starter template's accessibility guarantees

## Functional
### User story
As a consumer evaluating or adopting `@bach.software/vue-dynamic-form-starter`, I want the docs and the README to state plainly what accessibility the template guarantees out of the box, the two new retheme tokens, and how to wire up focus-first-invalid for my own non-wizard form, so that I can trust the claim without reading the source.

### Acceptance criteria
1. **`docs/guide/starter-template.md` gains an Accessibility section.**
   Given the guide page,
   When read,
   Then it states, in consumer-facing language, that every control gets label/description/error association, errors and password-strength changes are announced, every control is keyboard-operable (including the password reveal toggle and the choice-card APG pattern), focus moves on wizard navigation and validation failure, and this is unconditional with no opt-out (Open question 4's decision).

2. **The two new retheme tokens are documented in the theming subsection.**
   Given the guide's existing theming subsection,
   When read,
   Then `--sft-focus-visible` and `--sft-focus-visible-choice` are listed alongside the existing `--sft-*` tokens, with their purpose (input/button/stepper focus ring vs. choice-card focus ring).

3. **`focusFirstInvalid` is documented with a working example.**
   Given the guide,
   When read,
   Then it shows the exported `focusFirstInvalid(containerEl)` helper with a concrete `onInvalidSubmit` wiring example for a non-wizard form (e.g. `handleSubmit(onValid, ({ errors }) => focusFirstInvalid(formRef.value))`), matching Open question 7's decision.

4. **`packages/starter/README.md` mirrors a short Accessibility subsection.**
   Given the README (which ships in the published tarball and has no accessibility mention today),
   When read,
   Then it carries a condensed version of point 1 above, sized appropriately for a README rather than the full guide treatment.

5. **No change to `docs/reference/*`.**
   Given the reference pages document the core (`packages/core`) public surface,
   When reviewed,
   Then none of them is touched by this story, consistent with the feature's Documentation impact ("no core public API changes").

### Edge cases
- The guide's new section must not duplicate `docs/examples/wizard.md`'s wizard-specific focus content (shipped by **ST-04**); it should summarize and link to that example rather than re-explain the wizard sequence diagram.

### Out of scope
- `docs/examples/wizard.md`: shipped by ST-04, since that page describes wizard-specific behavior that story implements.
- `docs/reference/*`: explicitly no change (AC5).
- Any further code change: this story is documentation-only.

## Design reference
Not applicable. This story has no visual surface of its own; it documents behavior already shipped and designed by ST-01 through ST-06.

## Architecture reference
Implements the feature architecture's Slicing seam 7 and the [Documentation impact](../../spec.md#documentation-impact) section's `docs/guide/starter-template.md` and `packages/starter/README.md` entries:

- **`docs/guide/starter-template.md`** — new Accessibility section (guarantees, no opt-out note, theming subsection addition, `focusFirstInvalid` wiring example).
- **`packages/starter/README.md`** — mirrored short Accessibility subsection.
- **`specs/components.md`** — one-line note (per the feature's Public API impact section) on the new `.sft-sr-only` utility, the two focus tokens, `focusFirstInvalid`, and that the starter now manages focus and emits an accessible label/description/error chain; carried in whichever story's implementation notes update it first is fine, but if not already done by an earlier story, this story closes it out since it is the last to land.
- **Public API surface touched:** none (documentation only).
- **Dependencies on other stories:** depends on **ST-01 through ST-07** for accurate, final behavior to describe (the feature's own seam ordering: "Depends on the behavior being final; slices after 1-6"). Practically, ST-07's axe coverage is not itself something this page describes, but implementing last avoids documenting behavior that could still shift.
- **Documentation:** this story's entire scope is the Documentation impact's remaining two pages. `docs/examples/wizard.md` is deliberately not here; see ST-04.
