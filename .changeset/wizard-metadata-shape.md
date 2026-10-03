---
"@bach.software/vue-dynamic-form": minor
---

Build multi-step ("wizard") forms by adding one metadata property. Wizards are a common pattern, but until now the engine had no concept of one: you had to hand-roll step state, per-page validation, and path bookkeeping in your own template. Now you mark a node with `wizard: true` and the engine drives the steps for you.

- The wizard node's `children` become its ordered steps.
- Step state and navigation arrive as slot props on a new `-wizard` / `-wizard-page` slot family (`currentStepIndex`, `pages`, `isFirst`, `isLast`, `isValidating`, `wizardConfig`, `next()`, `prev()`, `gotoStep()`), the same channel choice and array shapes already use. No composable, no provide/inject, no callbacks stored in metadata. `wizardConfig` is the resolved navigation config (defaults applied) so a stepper can reflect the mode, e.g. enabling forward jumps when `allowForwardJump` is set.
- Attributes bound on the wizard slots' own `<slot />` elements flow into the page content's `slotProps`, exactly like at every other template level. Binding `:gotoStep="gotoStep"` on the page wrapper's slot is how a summary page renders per-section "edit" links that jump back to an earlier step. Stable bindings are free: page fields only re-render on navigation when a bound value actually changed.
- By default a wizard is linear: `next()` validates the current step and blocks so users cannot skip past errors, and the stepper only jumps backward to visited steps. Pass a `WizardConfig` object (`{ allowForwardJump, validateOnJump }`) instead of `true` to make it non-linear, letting the user move ahead even with an invalid step. In that mode both `next()` and forward `gotoStep()` still surface the step's errors but no longer block; set `validateOnJump: false` for a silent jump that moves without validating.
- Submit stays yours: the engine exposes `isLast` so your template knows when to show a submit button, which you wire to `handleSubmit` from `useDynamicForm` as usual.

Important for template authors: wizard page slots must gate visibility with `v-show`, never `v-if`. Every page stays mounted at once, so a `v-if` would unmount a page's fields and clear their values (and deregister their validation) the moment the user navigates away.

Fully additive: `wizard` is a new optional `FieldMetadata` property, and every existing form and template keeps working unchanged.
