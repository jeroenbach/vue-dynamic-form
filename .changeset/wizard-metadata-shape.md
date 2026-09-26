---
"@bach.software/vue-dynamic-form": minor
---

Build multi-step ("wizard") forms by adding one metadata property. Wizards are a common pattern, but until now the engine had no concept of one: you had to hand-roll step state, per-page validation, and path bookkeeping in your own template. Now you mark a node with `wizard: true` and the engine drives the steps for you.

- The wizard node's `children` become its ordered steps.
- Step state and navigation arrive as slot props on a new `-wizard` / `-wizard-page` slot family (`currentStepIndex`, `pages`, `isFirst`, `isLast`, `isValidating`, `next()`, `prev()`, `gotoStep()`), the same channel choice and array shapes already use. No composable, no provide/inject, no callbacks stored in metadata.
- `next()` (and `gotoStep()`) validate the current step before advancing, so users cannot skip past errors. `gotoStep()` is backward-only by default; pass a `WizardConfig` object (`{ allowForwardJump, validateOnJump }`) instead of `true` to opt into forward jumps.
- Submit stays yours: the engine exposes `isLast` so your template knows when to show a submit button, which you wire to `handleSubmit` from `useDynamicForm` as usual.

Important for template authors: wizard page slots must gate visibility with `v-show`, never `v-if`. Every page stays mounted at once, so a `v-if` would unmount a page's fields and clear their values (and deregister their validation) the moment the user navigates away.

Fully additive: `wizard` is a new optional `FieldMetadata` property, and every existing form and template keeps working unchanged.
