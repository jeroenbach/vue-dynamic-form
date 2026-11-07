---
id: ST-03
type: story
feature: FEAT-011
status: qa
approved_by: ""
pr: ""
---

# Story: Password strength announced to screen readers on blur

## Functional
### User story
As a screen-reader user typing a password, I want to be told how strong it is once I finish typing, without the announcement interrupting me on every keystroke, so that I get useful feedback without being talked over while I type.

### Acceptance criteria
1. **Visual strength bar is decorative.**
   Given `PasswordStrengthBar.vue`,
   When rendered,
   Then the visual bar carries `aria-hidden="true"` and its appearance is unchanged from today.

2. **A sibling live region mirrors the tier text.**
   Given the same component,
   When rendered,
   Then a `.sft-sr-only` element with `aria-live="polite"` exists as a sibling of the visual bar, containing `"Password strength: {label}"` where `{label}` matches the tier label already computed today (e.g. "Good").

3. **Announcement fires on blur, not per keystroke.**
   Given the `announce` prop defaulting to `'blur'`,
   When the user types in the password field and then blurs it,
   Then the live region's text updates only once, on blur, reflecting the tier at that moment; typing alone (without blur) does not update the live region's text.

4. **`StarterFormTemplate` wires the input's blur to the bar.**
   Given `PasswordInput.vue` is rendered through `StarterFormTemplate`,
   When the underlying `<input>` fires `@blur`,
   Then the signal reaches `PasswordStrengthBar` so it updates its live region (the bar itself cannot observe the input's blur).

5. **No change to the visible strength bar's appearance or thresholds.**
   Given the same password input sequence as before this story,
   When the bar is inspected visually,
   Then its colors, segments, and tier boundaries are pixel-identical to today's shipped behavior.

### Edge cases
- Clearing the password field entirely and blurring: the live region announces whatever tier an empty password computes to today (no special-cased text).
- Blurring without having typed anything (field untouched): no new announcement beyond what the existing component already computes for that state.

### Out of scope
- Any debounce-while-typing behavior: explicitly decided against (Open question 5).
- The reveal-button tab-stop fix: ST-01.
- Focus-ring styling on the password field: ST-02.

## Design reference
Implements the feature's [Per-section design notes for `#password-field`](../../spec.md#per-section-design-notes-maps-to-the-spec-s-required-coverage) exactly: "The strength bar becomes decorative (`aria-hidden`) and the tier is mirrored into an `aria-live="polite"` region ... announced on blur per Open question 5's decision." Prototype anchor: [`#password-field`](../../prototype.html#password-field) (the live-region blue bar marking what a screen reader announces). No delta left open.

## Architecture reference
Implements the feature architecture's Slicing seam 3 and Data flow 3:

- **`PasswordStrengthBar.vue`** — adds `aria-hidden="true"` to the visual bar and renders a sibling `.sft-sr-only` live region mirroring the tier, `aria-live="polite"`. Gains an `announce` prop defaulting to `'blur'` (`DECIDED (Jeroen, Open question 5)`).
- **`StarterFormTemplate.vue`** — passes the `announce="blur"` signal and wires the password input's `@blur` to trigger the bar's announcement, since the bar cannot see the input's blur itself.
- **Public API surface touched:** one new optional prop (`announce`) on `PasswordStrengthBar`, default preserves today's absence of any announcement side effect beyond what this story adds. No `packages/core/src/` change.
- **Dependencies on other stories:** depends on **ST-02** for the `.sft-sr-only` utility class; implement after ST-02 lands.
- **Documentation:** none assigned to this story directly. Covered by ST-08's summary of what the template announces, as part of the overall Accessibility section.
