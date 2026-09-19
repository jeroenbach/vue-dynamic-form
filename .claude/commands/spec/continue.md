---
description: "Run a spec through every phase up to the next approval gate: design and arch, story prep, or implement and verify"
argument-hint: "FEAT-XXX (or ST-YY for one story) [--autonomous]"
model: opus
---

Read `CLAUDE.md`, `specs/RESEARCH-AND-DECIDE.md`, and the referenced spec before acting.

This command runs the phases between two approval gates unattended, so Jeroen types one command instead of several and comes back to a spec that has moved as far as it can without him. **It never crosses a gate.** It stops the moment the next thing needed is Jeroen's approval, and it never sets `status: approved`.

There are three chains, one for each stretch between gates. The same command runs all three; it works out which from the spec's status.

| # | Chain | From | Runs | Ends at |
| --- | --- | --- | --- | --- |
| 1 | Pre-approval | feature in `design` | design, arch, review | feature `awaiting-discussion` (or `awaiting-approval` if nothing is open) |
| 2 | Story prep | feature in `approved` | split, then per story qa and review | every story `awaiting-approval`, bar any it had to park |
| 3 | Implementation | feature in `in-progress` with an approved story | per story implement, verify, fix findings | story `done`, bar any it had to park |

**Chains 2 and 3 run to the end.** Once the feature is approved Jeroen has stepped back, so these chains never halt the whole run over one item. Anything they cannot settle parks that **one** story at `awaiting-discussion` and the run continues with its siblings. See "Research and decide" below.

Locate the single `specs/**/spec.md` whose `id:` matches the argument. If the argument is ambiguous, list the candidates and stop instead of guessing.

## Which chain to run

Dispatch on the spec's current `status:`, and for a feature in `in-progress`, on the statuses of its stories.

**Feature in `draft` or `design`** (chain 1, the pre-approval chain, "get it ready for me to review"):

1. `/spec:design FEAT-XXX` if the status is `design` and the Design section is not yet filled. Skip for a feature with no UI surface, noting the skip.
2. `/spec:arch FEAT-XXX`
3. `/spec:review FEAT-XXX`

Ends at `awaiting-discussion`, or at `awaiting-approval` in the unusual case that the reviewer left nothing open. **Do not research or settle open points in this chain.** Leave every open question and adversarial finding open, because this chain feeds `/spec:discuss`, which is where Jeroen is consulted and where the research happens with him present. Adding decisions here would rob him of the one review point he asked to keep. Close by telling him to run `/spec:discuss FEAT-XXX`.

**Feature in `approved`** (chain 2, story prep, "take it from here"):

1. `/spec:split FEAT-XXX`
2. For each story produced, in dependency order: `/spec:qa ST-YY`, then `/spec:review ST-YY`.

Ends with every story at `awaiting-approval` and the feature at `in-progress`. **This chain researches and decides**, per the section below, and it prepares every story even if an earlier one parked. Close by listing the stories with their paths, in dependency order, so Jeroen can approve them and start implementation, and name any parked story separately with the reason it parked.

**Feature in `in-progress`** (mixed, so look at the stories). Walk the stories in dependency order and act on the **first one that is not `done`**:

- story in `qa` or `adversarial-review` → finish chain 2 for it (`/spec:qa`, `/spec:review`), then continue to the next story.
- story in `approved` → run chain 3 on it (see below).
- story in `implementing` or `verifying` → resume chain 3 mid-flight for it, picking up at the phase it is in.
- story in `awaiting-approval` → **skip it and keep going.** That is Jeroen's gate, so this run cannot advance that story, but it can still prep or implement the others. Note it and move to the next story.
- story in `awaiting-discussion` → **skip it and keep going**, exactly the same way. It is parked pending a decision from Jeroen. Also skip any story that depends on it, naming the dependency; stories that do not depend on it carry on normally.
- all stories `done` → the feature is finished. Say so, and check whether the feature status should now be `done`.

Only when every remaining story is blocked on Jeroen (waiting at a gate, parked, or depending on one that is) does the run end. Report the whole set at once rather than stopping at the first one.

**Feature in `architecture` or `adversarial-review`:** resume chain 1 from that phase.

**Feature in `awaiting-approval` or `awaiting-discussion`:** stop. This is Jeroen's gate. Report what is waiting and point at `/spec:discuss <id>` to work through the open items (the right call from `awaiting-discussion`) or `/spec:approve <id>` to open the gate.

**A single `ST-YY` given directly:** run whatever chain that one story needs, by the same rules, and stop when it is `done` rather than moving on to its siblings.

**Anything in `deferred`:** stop. Reviving it is Jeroen's call.

**Epics and quick specs:** there is nothing to chain, so say so and stop. Neither has intermediate phases: `/spec:epic` takes an epic straight to `awaiting-approval`, and `/spec:quick` already runs its own lite adversarial review before landing there. If either is sitting in `draft`, its creating command did not finish; report that rather than inventing a phase for it.

## Chain 3: implementing approved stories

For each story, in dependency order:

1. **`/spec:implement ST-YY`** (developer, sonnet). Its own approval gate stands: it refuses a story that is not `approved`, and that refusal is final here too. Status goes to `verifying`.
2. **`/spec:verify ST-YY`** (qa-verifier, sonnet). Status goes to `done` on a pass, or back to `implementing` on a fail.
3. **On a fail, fix the findings.** Re-invoke the developer with the verifier's findings, then re-run `/spec:verify`. Repeat until it passes, up to **three** verify attempts total. A story that cannot pass verification after three tries has a problem worth a human look, not a fourth try. When that happens:
   - **Park that story** at `status: awaiting-discussion`, recording the outstanding findings and the three attempts in its spec.
   - **Do not commit its work**, in either mode. Leave the working tree as it is if this is the last story you touch, or revert just that story's changes if you are continuing to another one and its half-finished state would confuse the next story's verification. Say which you did.
   - **Move on to the next story that does not depend on it.** One story failing verification is not a reason to abandon the four that would have passed.
   - Report it prominently at the end: parked stories are the first thing in the summary, not a footnote.
4. **Then branch on the mode** (see below): commit and continue, or stop and hand back.

Never edit a verification report to make it pass, and never mark a story `done` yourself. `done` is the qa-verifier's call on a genuine pass.

## Interactive or autonomous: the commit rule

`CLAUDE.md` already draws this line (see its "Interactive vs Autonomous Sessions" section), and chain 3 follows it exactly. The two modes differ only in what happens after a story verifies.

**Interactive (running on Jeroen's machine): do one story, commit nothing.** Implement, verify, fix findings, then **stop**. Leave every change uncommitted and unstaged so Jeroen reviews and commits it himself. Close by naming the story that is now `done`, the files touched, and telling him to run `/spec:continue FEAT-XXX` again once he has committed, to pick up the next story.

**Autonomous (your own environment, your own branch): do every story, committing each one.** After a story verifies clean, commit just that story's work, then continue straight to the next story, and repeat until all are `done`. The result is one branch with one commit per story.

In autonomous mode:

- **Confirm you are not on `main` before the first commit.** If you are, create a feature branch first (named for the feature, e.g. `feat/FEAT-001-readonly-mode`). Never commit story work directly to the default branch.
- **One commit per story, not one per fix.** The fix-the-findings loop is part of producing the story; it does not get its own commits. A story's changeset (`.changeset/*.md`, when `packages/core/src/` changed) belongs in that story's commit.
- **Never squash these commits, and never rewrite the branch history.** The per-story commits are the point: they are how Jeroen reviews the PR, one story at a time. Note this repo's rule from `CLAUDE.md`: PRs are **merged with a merge commit, never squash-merged**, because Changesets depends on the preserved commit history. Your per-story commits therefore survive into `main`, which is one more reason each must pass `pnpm ci` on its own.
- **Follow the commit conventions in `CLAUDE.md`**, in particular: no hard line breaks mid-sentence (one continuous line per paragraph or bullet, let the editor wrap), and no em dashes. Reference the story in the subject (e.g. `FEAT-001 ST-01: readonly setting on DynamicFormSettings`).
- **Review what you are staging.** Run `git status` after staging and check the diff for anything unexpected, especially anything that could carry a secret, before committing.
- **Do not push and do not open a PR** unless explicitly asked. Committing is as far as this goes.

### Deciding which mode you are in

**Default to interactive.** Committing on Jeroen's machine unasked is the worse failure, and it is the one that is easy to trigger by mistake.

Treat the run as autonomous only when one of these clearly holds:

- `CI` or `GITHUB_ACTIONS` is set in the environment.
- The command was invoked with an explicit `--autonomous` argument.
- The instructions that started this session explicitly said to work unattended or finish the feature end to end.

A git worktree (where `git rev-parse --git-dir` differs from `--git-common-dir`), especially on a detached HEAD, is a **supporting** signal that you are in an agent's isolated copy. It is not sufficient on its own, because Jeroen may be working in a worktree by hand. If a worktree is the only signal you have and a human can be reached, ask rather than assume.

**Announce the detected mode and the reason for it in your first message, before running anything.** That way a wrong detection is visible immediately, while nothing irreversible has happened yet.

## Research and decide (chains 2 and 3, never chain 1)

Follow `specs/RESEARCH-AND-DECIDE.md` in full. After each phase completes, take the open points that phase produced and work them before moving to the next phase, so a decision that affects later stories lands before those stories are written.

These chains run **after** Jeroen has approved the feature, which means he has explicitly stepped back and does not want to be pulled in again before the PR. So the bar here is not the pre-approval clear-winner bar: it is the **post-approval tie-breaker ladder** in step 2b of that file. Research the point; if research produces a winner, record `DECIDED (research, <date>)`. If it does not, walk the ladder (approved feature spec → upstream standards and dependency docs → the existing codebase pattern → reversibility → smallest scope) and take the first rung that discriminates, recording a rung 4 or 5 outcome as `ASSUMED (story prep, <date>)` with its alternative and reversal cost.

Lean hard on rungs 2 and 3. This library's validation model is XSD-inspired and built on vee-validate, so most questions about rule semantics or edge-case behaviour have a factual answer in the XSD specification or the vee-validate docs (at this project's installed versions), and most style or structure questions are answered by the existing codebase. "No clear winner" almost never means "only Jeroen can answer this".

**When an open point genuinely is Jeroen's** (it needs a fact only he has, or answering it means contradicting something already approved, or the approved feature has a real gap), **park that one story and keep going. Do not stop the chain, and do not ask him mid-run.**

1. Set that story to `status: awaiting-discussion`.
2. Record the item in its spec as `OPEN (needs Jeroen)` with the real options and the tradeoff, and one line naming which of the three cases it is. For a feature gap, name the feature section that is missing.
3. Continue with the next story. Skip only those that genuinely depend on the parked one, and say which.
4. List every parked story at the top of your closing summary, each with its one-line reason and the command to resolve it (`/spec:discuss ST-YY`).

Parking should be rare. At story level, most open points are implementation details with a defensible right answer. **If several stories of one feature park, do not report them as separate incidents:** that means the feature was approved with an unresolved design question, and the fix is one conversation about the feature. Say that in those words.

## Rules for the whole run

- **Never set `status: approved`,** never suggest it, never run `/spec:approve`. The three gates in `specs/README.md` belong to Jeroen alone. This command exists to reach a gate cleanly, not to pass one.
- **Invoke the real agents, don't reimplement their phases.** Each step means invoking that phase's agent exactly as its own `/spec:*` command does. See the model rules below.
- **Respect each phase's own gate.** `/spec:split` refuses an unapproved feature and `/spec:implement` refuses an unapproved story; both refusals stand here too, and being mid-chain is never a reason to work around either. A gate refusal is not a run failure: skip that spec, note it, and carry on with the others. A phase that genuinely **fails** (a crashed tool, a missing file, a broken repo state) is different: stop the run and report which step failed and why, because continuing past a broken environment produces garbage.
- **Report progress as you go,** naming each phase as it starts, so a long run is followable rather than silent.
- **Close with a summary**, leading with anything that needs Jeroen: parked stories first, each with its reason and `/spec:discuss ST-YY`, then stories waiting at his approval gate. After that: the mode you ran in, the phases that ran and the model each was given, the `DECIDED (research)` and `ASSUMED (story prep)` rollups, any commits made, and the exact next command.
- **Report test and check results faithfully.** If the verifier fails, say so with its findings. Never describe a story as done when its checks did not pass.

## Model discipline

Claude Code does **not** honor the `model:` field in an agent's own frontmatter: a subagent silently inherits the calling session's model instead (see the known-limitation note in `specs/README.md`). Passing `model` explicitly on the Agent tool call is the only mechanism that actually works. This command chains seven agents across two different models, so getting it wrong here is both easy and invisible, and a sonnet-driven run would quietly downgrade every opus phase.

**Before the first agent call, run a config pre-flight.** For every phase this run will execute, read two files and compare:

- the phase's command file (`.claude/commands/spec/<phase>.md`), which states the model inline
- the agent's own frontmatter (`.claude/agents/<agent>.md`), whose `model:` field is inert but is still the declared intent

They should agree, and both should match the Model column of the command reference table in `specs/README.md`. **If any two disagree, stop before running anything** and report the mismatch with the file paths and the conflicting values. A disagreement means the config has drifted and nobody can say which model was intended; resolving that is a decision for Jeroen, not a guess for you. Do not fall back to a default.

The expected mapping, to be confirmed rather than assumed: ui-designer opus, architect opus, adversarial-reviewer opus, scrum-master sonnet, qa-planner sonnet, developer sonnet, qa-verifier sonnet.

**On every Agent tool call, pass `model` explicitly**, taken from the pre-flight, never from memory and never omitted.

**Ask each agent to confirm what it ran as.** Instruct every agent you invoke to begin its final report with a single line: `model: <the model I am running as>`. Compare that to what you passed. This is the only feedback available, because the Agent tool result does not report the model the subagent actually used, so there is otherwise no way to detect the inheritance bug firing.

Treat the result honestly, and be clear about which of these you are claiming:

- **A reported mismatch is a real signal.** Stop the chain, report it, and note that the phase's output may have been produced by the wrong model and is worth rerunning. This is exactly the bug reproducing.
- **A reported match is weak confirmation only.** An agent's self-knowledge of its model is not authoritative and can be wrong. It does not prove the right model ran.
- **No line reported** means the agent ignored the instruction. Note it and continue; it is not grounds for stopping.

So: you can verify that the config is internally consistent and that you passed the model explicitly, and you can catch a self-reported mismatch. You cannot independently verify the model a subagent actually ran on. Say it that way in the summary rather than claiming the models were verified.

Spec id to continue:

$ARGUMENTS
