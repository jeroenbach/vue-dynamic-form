---
description: Create the cohesive HTML prototype for a FEATURE's visual surface (or a delta for a story)
argument-hint: FEAT-XXX (or ST-YY for deltas), optional notes/screenshot paths
---

Read `CLAUDE.md` and the referenced spec before acting.

Invoke the **ui-designer** agent (model: opus, pass this explicitly on the Agent tool call, see `.claude/agents/ui-designer.md`) on the spec identified in the arguments below.

- A feature id (FEAT-XXX) runs FULL mode: produce the cohesive `prototype.html` covering the entire feature's visual surface (docs pages, examples, Storybook stories, template components), fill the spec's Design section, and advance the feature status to `architecture`. A pure engine feature has no design phase; the ui-designer says so and stops.
- A story id (ST-YY) runs DELTA mode: no redesign; only refine what the story's Design reference marks as open, staying fully consistent with the feature prototype. Conflicts with the feature design are flagged as feature spec amendments, never resolved locally.

Pass along any notes or screenshot/asset paths given in the arguments (assets belong in the feature's `assets/` folder).

Arguments:

$ARGUMENTS
