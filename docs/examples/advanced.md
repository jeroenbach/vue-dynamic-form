# Advanced: Client Onboarding Wizard

A production-style wizard demonstrating the full feature set: multi-step navigation with per-page validation, conditional required/hidden fields, dynamic option loading, repeatable contacts, a choice-based launch path, and a read-only summary page before submit.

## What It Demonstrates

- Multi-step `wizard` type with `validatePage` called before advancing
- `computedProps` making fields conditionally required or hidden at runtime
- `choice` branches explicitly activated through `activeChoices`, with values kept on switch via `keepValuesOnDeactivate`
- Repeatable array pages (`minOccurs`, `maxOccurs`, `arrayItemName`)
- Dynamic options loaded from an external source, cascaded between fields
- `wizardSummaryPage` for a pre-submit review with edit links
- Animated submission timeline after a successful submit

## Example

<FormExampleClientOnboardingPlannerContext />

## Conditional Required / Hidden Field

`computedProps` can flip `minOccurs` and `hide` at runtime based on the value of another field. Here the migration deadline becomes mandatory only when the user enables the migration checkbox:

<<< @/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue#conditional-field{ts} [FormExampleClientOnboardingPlanner.vue]

## Explicitly Activated Choice Branches

The launch approach is a `choice` in explicit-selection mode: a `Ref` passed as `activeChoices` two-way binds the selection, and `keepValuesOnDeactivate` caches the values of a deactivated branch so nothing is lost when the user switches back. The template's choice slot receives `activeChoices` and `changeChoice` and simply wires them to the selection cards — no hidden helper fields or `computedProps` needed:

<<< @/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue#explicit-activation{ts} [FormExampleClientOnboardingPlanner.vue]

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue#metadata{ts} [FormExampleClientOnboardingPlanner.vue]

## Related Source

- [FormExampleClientOnboardingPlanner.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue)
- [FormExampleClientOnboardingPlannerContext.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/context/FormExampleClientOnboardingPlannerContext.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
