---
description: Fast lane for bug fixes and trivial changes
argument-hint: short description of the change
---

Read `CLAUDE.md` and the referenced spec before acting.

Quick lane lifecycle: `draft → adversarial-review → [awaiting-discussion] → awaiting-approval → approved → implementing → done`.

1. Create `specs/QUICK-XXX-<kebab-name>/spec.md` (numbered sequentially based on existing QUICK specs) with this mini-template:

   ```markdown
   ---
   id: QUICK-XXX
   type: quick
   status: draft
   approved_by: ""
   pr: ""
   ---

   # Quick: <name>

   ## Problem

   ## Proposed change

   ## Affected files

   ## Test impact

   ## Adversarial review
   ```

   Fill Problem, Proposed change, Affected files (inspect the code, do not guess), and Test impact from the description below. Note in Proposed change whether `packages/core/src/` is touched, because that decides the changeset obligation at implementation time.

2. Invoke the **adversarial-reviewer** agent (model: opus, pass this explicitly on the Agent tool call, see `.claude/agents/adversarial-reviewer.md`) in STORY (lite) mode on the new spec.

3. STOP for Jeroen's review at whichever status the reviewer set: `awaiting-approval` if it left nothing open, `awaiting-discussion` if it left an unresolved blocker or should-fix. For a genuinely quick fix, expect the former; landing in `awaiting-discussion` is a hint the change is not actually quick-lane material. Only Jeroen may set `status: approved`.

After approval, `/spec:implement QUICK-XXX` implements it, including the `specs/components.md` update obligation, the test obligation, and the changeset rule for `packages/core/src/` changes.

Change description:

$ARGUMENTS
