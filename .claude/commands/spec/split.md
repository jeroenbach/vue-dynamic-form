---
description: Split an APPROVED feature spec into user stories
argument-hint: FEAT-XXX
---

Read `CLAUDE.md` and the referenced spec before acting.

**Approval gate (repeat of the workflow hard rule):** the feature spec's frontmatter must have `status: approved`, set by Jeroen. If it does not, do NOT split; report the current status and stop. Only Jeroen may approve, and a feature is only split after its design and architecture are approved.

If (and only if) the gate passes, invoke the **scrum-master** agent (model: sonnet, pass this explicitly on the Agent tool call, see `.claude/agents/scrum-master.md`) on the feature identified below. It splits the feature along the architecture's slicing seams into small, vertically sliced, dependency-ordered stories under `stories/ST-YY-<name>/spec.md`, updates the feature's Stories section, sets the feature status to `in-progress`, and each story to `qa`.

Arguments:

$ARGUMENTS
