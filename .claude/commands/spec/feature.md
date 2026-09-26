---
description: Create a new feature spec from an idea
argument-hint: describe the feature idea
---

Read `CLAUDE.md` and the referenced spec before acting.

Invoke the **product-owner** agent (model: sonnet, pass this explicitly on the Agent tool call, see `.claude/agents/product-owner.md`) with the feature idea below. The product-owner creates `specs/FEAT-XXX-<kebab-name>/spec.md` from `specs/TEMPLATE-feature.md` (numbered sequentially based on existing specs), elaborates the idea into problem, scope, and functional overview, checks `specs/components.md` and nearby code so the spec builds on reality, and collects open questions for Jeroen instead of assuming.

If the idea references a parent epic (an `EPIC-XXX` id appears in the arguments), set `epic: EPIC-XXX` in the new feature's frontmatter and add a link to this feature under that epic's Features section. That epic must already be `approved`; if it is not, note it and continue creating the feature. Features are never nested under the epic folder (flat model).

Feature idea (optionally ending with a parent `EPIC-XXX`):

$ARGUMENTS
