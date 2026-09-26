# Wizard

Split a long form into ordered steps. Each step validates before the user can advance, a stepper tracks progress and jumps back to earlier steps, and a final review page recaps every answer with edit links before submit.

## What It Demonstrates

- The [`wizard`](/reference/field-metadata#wizard) metadata property: the marked node's `children` become the steps, in declaration order
- Per-step validation: `next()` validates the current step before advancing, so users cannot skip past errors
- A stepper that reflects the current step and jumps back to a completed one
- A [`wizardSummaryPage`](/reference/field-metadata#wizard) step that reviews the collected values with per-section edit links
- `submitButtonText` for the label on the final step's submit button

## Example

<FormExampleWizard />

## How It Works

Mark a node with `wizard: true`. Its `children` become the steps, each one a heading group with its own fields. The last step is a `wizardSummaryPage` that shows a read-only recap:

<<< @/.vitepress/theme/components/FormExampleWizard.vue#metadata{ts} [FormExampleWizard.vue]

The engine hands the template all step state and navigation (`currentStepIndex`, `pages`, `isFirst`, `isLast`, `next()`, `prev()`, `gotoStep()`) as slot props on the `-wizard` / `-wizard-page` slot family. The docs template forwards these to its `FormWizard` and `Stepper` components, so the wizard chrome lives entirely in template code, not in the library. See [Wizard container and page slots](/reference/dynamic-form-template#wizard-container-and-page-slots) for the full slot contract.

::: warning Pages must stay mounted
Wizard page slots gate visibility with `v-show`, never `v-if`. Every page stays mounted at all times so its fields keep their values and validation when the user navigates away. A `v-if` would clear that page's data and deregister its fields, so a later submit could send it unvalidated.
:::

By default the stepper only jumps backward to already-visited steps. To let users jump forward too, pass a config object instead of `true`:

```ts
{
  name: 'registration',
  wizard: { allowForwardJump: true, validateOnJump: true },
  children: [/* ... */],
}
```

`allowForwardJump` enables forward jumps from the stepper; `validateOnJump` additionally validates the current step before any jump is allowed.

## The Review Page

The final step is a `wizardSummaryPage`. A `computedProps` function feeds it a `wizardSummary` array, and the template renders one review group per section with an edit link that calls `gotoStep()`:

<<< @/.vitepress/theme/components/FormExampleWizard.vue#summary-information{ts} [FormExampleWizard.vue]

## Handling Submit

The final step's button is a native `type="submit"` control, so the wrapping form forwards its submit event to your own `handleSubmit` from [`useDynamicForm`](/reference/use-validate-partial-form):

<<< @/.vitepress/theme/components/FormExampleWizard.vue#submit{ts} [FormExampleWizard.vue]

For a production-scale wizard that layers conditional fields, dynamic options, repeatable steps, and a choice-based branch on top of these basics, see the [Client Onboarding Wizard](/examples/advanced).

## Related Source

- [FormExampleWizard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleWizard.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
- [FormWizard.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormWizard.vue)
- [Stepper.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/Stepper.vue)
