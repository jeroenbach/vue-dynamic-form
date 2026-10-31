---
description: "Summarize a spec and walk through its open questions and unresolved findings with Jeroen, live"
argument-hint: EPIC-XXX | FEAT-XXX | ST-YY | QUICK-XXX
model: opus
---

Read `CLAUDE.md`, `specs/RESEARCH-AND-DECIDE.md`, and the referenced spec before acting.

This is a **live conversation with Jeroen**, not a one-shot report: run it yourself, directly, in this conversation. Do not delegate it to an agent, since an agent returns a single final message and can't go back and forth on each question, which is the entire point of this command.

This is the main consultation point in the whole workflow. By the time a feature reaches here, the product-owner, ui-designer, architect, and adversarial-reviewer are all done, and the pre-approval chain (`/spec:continue` chain 1) has already researched the open items and settled the ones with a clear winner, recorded in the "Decided without Jeroen (research)" rollup. What's left open should be only the decisions that genuinely need Jeroen. Your job is to make sure that's actually true (filling any research gap you find), then to present what was decided on his behalf so he can override it, and to discuss the real calls with him.

Locate the single `specs/**/spec.md` whose id matches the argument below (match on the `id:` frontmatter field; for a bare `ST-YY`, resolve it within its feature, and if ambiguous across features, list the candidates and stop instead of guessing). Also read what it depends on for context: a story's parent feature (design + architecture sections it references), a feature's parent epic if `epic:` is set, and any story's own feature-level prototype anchors it links to.

**1. Summarize.** In a few sentences: what this spec is, its current status and where that sits in the lifecycle (see `specs/README.md`), and what's already been decided (scope, key design/architecture calls). Keep it tight, Jeroen has read the spec before, this is a refresher, not a retelling.

**2. Gather the decided and the open items.** Collect, in spec order:

- Every entry in the **"Decided without Jeroen (research)"** and **"Assumed without Jeroen (no clear winner)"** rollups: these are the decisions made on his behalf that he has not seen yet, and they open the conversation.
- Every unresolved entry under **Open questions** (epics and features only, stories have no formal section for this).
- Every unresolved finding under **Adversarial review**, for any spec type, that hasn't already been addressed or marked resolved. Findings that are already `PROPOSED (adversarial review)` edits Jeroen hasn't ruled on yet count as open.
- For a story with neither of the above, check the QA plan and Implementation notes for anything flagged as unresolved or a gap. If truly nothing is open and nothing was decided without him, say so plainly and skip the walkthrough entirely instead of manufacturing questions.

**3. Fill any research gap, then triage.** The research pass normally already happened before this command: `/spec:continue` chain 1 researches a feature's open items right after the adversarial review (and the post-approval chains do it for stories), so what is still open should already be the real calls. Verify that instead of assuming it: if an open item has no research recorded (this command was run without a prior chain run, or a finding was added since), research it now per `specs/RESEARCH-AND-DECIDE.md`, apply the clear-winner bar, settle what it allows, and record the outcome inline with its sources, keeping the rollups up to date. Research independent items in parallel; there's no reason to serialize lookups.

Do this for the whole list before you start talking, so you can tell Jeroen up front what was decided for him and exactly what is left.

Two failure modes to avoid, in both directions. Do not hand him a question whose answer is sitting in the official docs. Do not quietly settle something that is really an API-design call, a scope change, or a matter of taste, and remember that "equal weighing pros and cons" is his call by definition, not a tie for you to break. Apply that second check to the chain's earlier decisions too: if a rollup entry oversteps the clear-winner bar, present it as a question for him, not as a settled fact.

**4. Present what was decided, then walk through what's left, together.** Open with a summary of everything decided without him: the rollup entries, each as one line linking the item to the outcome and the reason in a few words. Then ask explicitly whether he wants to revisit any of them before moving on (`AskUserQuestion` with the decisions as options works well when the list is short; otherwise ask directly). If he overrules one, rewrite it inline as `DECIDED (Jeroen)` per the recording rules and drop it from the rollup.

Then take the remaining items one at a time (or in small related groups). Don't dump the list and wait. For each: state the question or finding, why it matters (the real tradeoff, not a hedge), what your research turned up, and **your concrete recommendation**. You have the codebase, the rest of the spec, and now the research; use all of it. Recommend even when it's his call, since "both are defensible, and here's the one I'd pick and why" is more useful than a neutral menu. Use `AskUserQuestion` when the choice is a discrete pick between options; otherwise just ask directly and read his reply.

**5. Record decisions as they land.** The moment Jeroen answers an item, write it back into the spec immediately, in place, right under the question or finding it resolves:

```
DECIDED (Jeroen): <the decision, in one or two sentences>
```

Never add a date to the entry; git already records when it was written. (Same convention as the `DECISION — DEFERRED (Jeroen)` note used for deferred specs.) If the answer actually changes scope, behavior, or a design or architecture call rather than just clarifying it, edit that section directly too, not only the question.

**6. Move the spec out of the discussion queue, if it is empty.** This command owns exactly one status transition and no others:

- If the spec was in `awaiting-discussion` and **every** open item is now resolved, set `status: awaiting-approval`. That is not an approval and never sets `approved_by`; it only records that the spec has become a yes/no question. Say that you did it.
- If anything is still open, including items Jeroen deferred to later in the session, **leave the status alone**. A spec with open items belongs in `awaiting-discussion`.
- From any other status, change nothing. This command runs against a spec in any status and advances nothing else on its own.

**7. Close with the next step.** Name the exact next command to run given the spec's status and type, per the command reference in `specs/README.md`. For a feature you just moved to `awaiting-approval`, that is `/spec:approve FEAT-XXX`, and after he approves, `/spec:continue FEAT-XXX` carries the feature through splitting and story prep unattended. If items are still open, say what they are and that the spec is staying in `awaiting-discussion` until they are settled.

**A parked story is a special case worth naming.** If the spec is a story that `/spec:continue` parked, read the `OPEN (needs Jeroen)` note it left: it says which of the three post-approval cases it hit (see `specs/RESEARCH-AND-DECIDE.md` step 2b). If it is case 3, a gap in the approved feature, fix the **feature** spec first and then the story, rather than patching the answer into one slice where the next story will hit the same wall. If several stories of one feature are parked, treat them as one conversation about the feature.

Spec id to discuss:

$ARGUMENTS
