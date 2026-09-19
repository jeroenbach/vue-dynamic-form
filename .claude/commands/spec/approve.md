---
description: "Approve a spec (epic, feature, story, or quick) that is awaiting Jeroen"
argument-hint: EPIC-XXX | FEAT-XXX | ST-YY | QUICK-XXX
---

Read `CLAUDE.md` and the referenced spec before acting.

This is the **only** command that sets `status: approved`, and it is the sanctioned human approval channel: a slash command is always typed by Jeroen himself, so running it IS Jeroen exercising the approval gate (equivalent to hand-editing the frontmatter, just convenient from the phone). No agent may ever invoke this command as part of its own flow, suggest running it, or set `status: approved` any other way. The "no agent approves" rule in `specs/README.md` is unchanged.

Locate the single `specs/**/spec.md` whose id matches the argument below (match on the `id:` frontmatter field; for a bare `ST-YY`, resolve it within its feature, and if the id is ambiguous across features, list the candidates and stop instead of guessing).

**Precondition:** the spec's frontmatter `status` must be exactly `awaiting-approval` or `awaiting-discussion`. If it is anything else (`draft`, `design`, `architecture`, `adversarial-review`, already `approved`, `in-progress`, `implementing`, `verifying`, `done`, `deferred`), do NOT change it: report the current status and stop. Approval only ever happens from one of Jeroen's two queues.

**If the status is `awaiting-discussion`, confirm before approving.** That status means the spec still has unresolved open questions or unresolved blocker/should-fix findings, so approving it means shipping those unresolved. Jeroen is allowed to do exactly that, since the gate is his, but not by accident. So: list the unresolved items first, in a few words each, then ask him to confirm (use `AskUserQuestion`, offering approve-anyway against running `/spec:discuss <id>` first). Approve only on an explicit yes. From `awaiting-approval` there is nothing to confirm, so approve directly.

If (and only if) the precondition passes and any required confirmation was given, edit **only** the frontmatter of that one spec:

- set `status: approved`
- set `approved_by: Jeroen`

Change nothing else in the spec, and touch no other file. This command does not advance any downstream phase, does not split, does not implement: it only opens the gate. After editing, confirm what was approved and name the next command in the workflow (`/spec:split FEAT-XXX` for a feature, `/spec:implement ST-YY` for a story or `QUICK-XXX`, or `/spec:feature <idea> EPIC-XXX` to start elaborating features under an approved epic).

Spec id to approve:

$ARGUMENTS
