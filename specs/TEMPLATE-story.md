---
id: ST-00
type: story
feature: FEAT-000
status: draft
approved_by: ""
pr: ""
---

# Story: <name>

## Functional
### User story
As a ..., I want ..., so that ...
### Acceptance criteria
Given/When/Then format. Each criterion independently verifiable.
### Edge cases
### Out of scope

## Design reference
Link to the feature prototype anchor(s) this story implements (e.g. `../../prototype.html#readonly-array`), if the feature has a prototype. Only DELTAS go here: refinements or details the feature-level design left open for this slice. No new design language.

## Architecture reference
Which parts of the feature architecture this story implements: components/composables to build or modify in this slice, public API surface touched, dependencies on other stories. Only DELTAS beyond the feature architecture are worked out here. A story that needs to overturn a feature-level decision does not do so silently: it flags the conflict, and the feature spec gets amended first.

## QA plan
Filled by qa-planner. Test plan mapped to the project's testing strategy: which behavior gets `*.test.ts`, `*.logic.test.ts`, `*.validation.test.ts`, or `*.analytics.test.ts` coverage, fixtures to use, regression risks, manual verification steps.

## Adversarial review
Filled by adversarial-reviewer (lite, story level). Findings and resolutions.

## Implementation notes
Filled by developer during implementation: deviations from plan and why. Deviations that affect the feature design/architecture are also propagated to the feature spec.

## Verification report
Filled by qa-verifier after implementation.
