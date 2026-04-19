# Client Onboarding

This example shows the library in a more realistic application flow instead of an isolated field demo.

## What It Demonstrates

- a reusable typed template
- grouped fields for company details
- repeatable grouped sections for project contacts
- a mutually exclusive launch path built with `choice`
- computed select options
- computed `disabled`, `description`, and `minOccurs` behavior

## Example

<ClientOnboardingPlannerExampleContext />

## Why This Example Matters

This is a good reference once the basic tutorial is clear because it shows the intended authoring model:

1. define a template contract once
2. mount one reusable form shell
3. keep expressing business logic mostly in metadata

## Notes

The demo uses `computedProps` to keep fields reactive without forcing a full top-level metadata rebuild:

- `teamSize` depends on the selected industry
- `migrationDeadline` becomes required only when migration is enabled
- `trainingFormat` becomes required only when guided rollout includes training
