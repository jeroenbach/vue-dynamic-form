# Advanced: Client Onboarding Wizard

A production-style wizard demonstrating the full feature set: multi-step navigation with per-page validation, conditional required/hidden fields, dynamic option loading, repeatable contacts, a choice-based launch path, and a read-only summary page before submit.

## What It Demonstrates

- Multi-step `wizard` type with `validatePage` called before advancing
- `computedProps` making fields conditionally required or hidden at runtime
- `choice` branches with a custom change handler and icon labels
- Repeatable array pages (`minOccurs`, `maxOccurs`, `arrayItemName`)
- Dynamic options loaded from an external source, cascaded between fields
- `wizardSummaryPage` for a pre-submit review with edit links
- Animated submission timeline after a successful submit

## Example

<FormExampleClientOnboardingPlannerContext />

## Conditional Required / Hidden Field

`computedProps` can flip `minOccurs` and `hide` at runtime based on the value of another field. Here the migration deadline becomes mandatory only when the user enables the migration checkbox:

<<< @/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue#conditional-field{ts} [FormExampleClientOnboardingPlanner.vue]

## Full Metadata

<<< @/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue#metadata{ts} [FormExampleClientOnboardingPlanner.vue]

## Related Source

- [FormExampleClientOnboardingPlanner.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/FormExampleClientOnboardingPlanner.vue)
- [FormExampleClientOnboardingPlannerContext.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/context/FormExampleClientOnboardingPlannerContext.vue)
- [AdvancedFormTemplate.vue](https://github.com/jeroenbach/dynamic-form/blob/main/docs/.vitepress/theme/components/AdvancedFormTemplate.vue)
