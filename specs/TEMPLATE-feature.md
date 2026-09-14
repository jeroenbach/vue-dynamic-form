---
id: FEAT-000
type: feature
status: draft
created: YYYY-MM-DD
approved_by: ""
epic: ""
---

<!-- epic: optional. Set to the parent EPIC-XXX id when this feature belongs to an
     epic; leave "" for a standalone feature. Features are never nested under the
     epic folder, they only reference it here (flat model). -->


# Feature: <name>

## Problem & goal
What problem this solves and for whom (library consumers, docs readers, template authors). What success looks like.

## Scope
### In scope
### Out of scope (explicit)

## Functional overview
Consumer-facing behavior, main flows. For engine features: the observable behavior a library consumer gets. For docs/playground features: what the reader or template author sees.

## Design (feature level)
Filled by ui-designer, only for features with a visual surface (docs pages, examples, Storybook stories, template components). Link to `prototype.html` (the cohesive prototype of the ENTIRE feature) and `assets/`. Design decisions, layout, states policy (loading, empty, error handled consistently across the feature). Each screen/section in the prototype has an HTML anchor id so stories can deep-link to their slice. For features with no UI, note the skip here.

## Architecture (feature level)
Filled by architect. The complete technical design: component/composable plan for the whole feature (reuse / modify / new, referencing specs/components.md), public API impact (exports, props, slots, `defineMetadata` generics, validation rules), backwards-compatibility analysis and the changeset bump type (patch/minor/major per CLAUDE.md), data flow (provide/inject, vee-validate integration, path handling), Mermaid diagrams for non-trivial flows, ADR-style notes for every real decision, and the natural slicing seams for the scrum-master.

## Adversarial review
Filled by adversarial-reviewer at feature level. Findings and resolutions.

## Constraints & assumptions

## Open questions
Questions for Jeroen. Must be resolved before approval.

## Stories
Filled by scrum-master AFTER approval. Links to story folders with implementation order and dependency notes.
