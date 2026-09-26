---
description: Create a new epic spec (a container for multiple features) from an idea
argument-hint: describe the epic / large initiative
---

Read `CLAUDE.md` and the referenced spec before acting.

Invoke the **product-owner** agent (model: sonnet, pass this explicitly on the Agent tool call, see `.claude/agents/product-owner.md`) in EPIC mode with the initiative below. The product-owner creates `specs/EPIC-XXX-<kebab-name>/spec.md` from `specs/TEMPLATE-epic.md` (numbered sequentially based on existing specs), elaborates the initiative into vision, scope, and a **feature breakdown** (candidate features with a one-line scope each, rough delivery order, and dependencies), checks existing specs and `specs/components.md` so it builds on reality, and collects open questions for Jeroen instead of assuming.

An epic is a lightweight container only: it holds vision and the feature breakdown, and has **no** design or architecture of its own (those live at feature level). The epic lifecycle is `draft → [awaiting-discussion] → awaiting-approval → approved → in-progress → done`. The product-owner stops at `awaiting-discussion` if it listed any open question (the usual outcome for an epic proposing real scope) or `awaiting-approval` if it listed none. Only Jeroen sets `status: approved`.

After approval, elaborate each candidate feature with `/spec:feature <idea> EPIC-XXX`, which stamps `epic: EPIC-XXX` on the new feature (flat model: features live at the top level of `specs/`, never nested under the epic folder) and adds it to the epic's Features section. The epic moves to `in-progress` when its first feature starts, and to `done` when every child feature is `done`.

Epic idea:

$ARGUMENTS
