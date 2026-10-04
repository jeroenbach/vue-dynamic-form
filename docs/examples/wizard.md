# Wizard

Split a long form into ordered steps. Steps validate as the user moves through them, a stepper tracks progress and lets you jump to any step, and a final review page recaps every answer with edit links before submit.

## What It Demonstrates

- The [`wizard`](/reference/field-metadata#wizard) metadata property: the marked node's `children` become the steps, in declaration order
- A non-linear wizard (`allowForwardJump`): `next()` and stepper jumps surface each step's errors but never block, so the user can move freely and fix things in any order
- A stepper that reflects the current step and jumps to any step, forward or back
- A [`wizardSummaryPage`](/reference/field-metadata#wizard) step that reviews the collected values with per-section edit links
- `submitButtonText` for the label on the final step's submit button

## Example

<FormExampleWizard />

## How It Works

Mark a node with `wizard`. Its `children` become the steps, each one a heading group with its own fields. This example passes `wizard: { allowForwardJump: true }` so the user can move through the steps freely; the last step is a `wizardSummaryPage` that shows a read-only recap:

<<< @/.vitepress/theme/components/FormExampleWizard.vue#metadata{ts} [FormExampleWizard.vue]

The engine hands the template all step state and navigation (`currentStepIndex`, `pages`, `isFirst`, `isLast`, `next()`, `prev()`, `gotoStep()`) as slot props on the `-wizard` / `-wizard-page` slot family. The docs template forwards these to its `FormWizard` and `Stepper` components, so the wizard chrome lives entirely in template code, not in the library. See [Wizard container and page slots](/reference/dynamic-form-template#wizard-container-and-page-slots) for the full slot contract.

::: warning Pages must stay mounted
Wizard page slots gate visibility with `v-show`, never `v-if`. Every page stays mounted at all times so its fields keep their values and validation when the user navigates away. A `v-if` would clear that page's data (unless `keepValuesOnUnmount` is set) and, regardless of that setting, deregister its fields from vee-validate, so a later submit could send the page's data unvalidated even when its values survived. Because `keepValuesOnUnmount` preserves only the values and not the field registration, `v-show` is still required for any page that has fields.
:::

### Linear vs non-linear

The example above is non-linear because it sets `allowForwardJump`. Without it, `wizard: true` gives a linear wizard: `next()` blocks on an invalid step, and the stepper only jumps backward to already-visited steps, so the user must complete each step in order before moving on.

```ts
const registration = {
  name: 'registration',
  wizard: true, // linear: next() blocks, stepper is backward-only
  children: [/* ... */],
};
```

`allowForwardJump` makes forward movement non-blocking: both `next()` and forward jumps from the stepper surface the current step's errors but let the user continue anyway. Validation still fires so errors stay visible; to move without validating at all, add `validateOnJump: false` for a silent jump.

## The Review Page

The final step is a `wizardSummaryPage`. A `computedProps` function feeds it a `wizardSummary` array, and the template renders one review group per section with an edit link that calls `gotoStep()`:

<<< @/.vitepress/theme/components/FormExampleWizard.vue#summary-information{ts} [FormExampleWizard.vue]

## Handling Submit

The final step's button is a native `type="submit"` control, so the wrapping form forwards its submit event to your own `handleSubmit` from [`useDynamicForm`](/reference/use-validate-partial-form):

<<< @/.vitepress/theme/components/FormExampleWizard.vue#submit{ts} [FormExampleWizard.vue]

For a production-scale wizard that layers conditional fields, dynamic options, repeatable steps, and a choice-based branch on top of these basics, see the [Client Onboarding Wizard](/examples/advanced).

## Related Source

- [FormExampleWizard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleWizard.vue)
- [StarterFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/StarterFormTemplate.vue)
- [FormWizard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/FormWizard.vue)
- [Stepper.vue](https://github.com/jeroenbach/dynamic-form/blob/main/packages/starter/src/Stepper.vue)
