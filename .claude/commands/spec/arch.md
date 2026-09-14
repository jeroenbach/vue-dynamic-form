---
description: Work out the technical design for a FEATURE (or a delta for a story)
argument-hint: FEAT-XXX or ST-YY
---

Read `CLAUDE.md` and the referenced spec before acting.

Invoke the **architect** agent (model: opus, pass this explicitly on the Agent tool call, see `.claude/agents/architect.md`) on the spec identified in the arguments below.

- A feature id (FEAT-XXX) runs FULL mode: fill the feature spec's Architecture section (component/composable plan against `specs/components.md`, public API impact including exports, props, slots, `defineMetadata` generics and validation rules, backwards-compatibility analysis and changeset bump type, data flow, ADR notes, slicing seams) and advance the feature status to `adversarial-review`.
- A story id (ST-YY) runs DELTA mode: only work out details the feature architecture left open for that slice. Conflicts with feature-level decisions are flagged and resolved in the feature spec first, never overridden locally.

Arguments:

$ARGUMENTS
