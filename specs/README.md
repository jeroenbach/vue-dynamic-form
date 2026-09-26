# Spec-driven development workflow

All epic, feature, and story specs live in this folder. It sits at the repository root (not under `docs/`) on purpose: `docs/` is the published VitePress site, and specs are internal working documents that must not end up on vue-dynamic-form.bach.software.

The workflow is built around one core principle:

> **Design and architecture happen at FEATURE level.** The ui-designer prototypes the entire feature in one cohesive `prototype.html` (for features with a visual surface: docs pages, examples, Storybook stories, template components), and the architect designs the complete technical solution for the whole feature. Stories are delivery slices carved out of that already-designed feature AFTER architecture: they reference the feature-level design and architecture (deep-linking into prototype anchors) instead of producing their own, so slicing reflects real dependencies and component boundaries, and the shipped result stays cohesive.

The hierarchy is: an **epic** (optional) groups several **features**; a feature is split into **stories**; the **quick lane** is a standalone fast path. Only features carry design and architecture; epics are lightweight containers and stories are slices.

> **Never stamp dates or timestamps into specs.** No `created:` frontmatter, no `DECIDED (…, 2026-…)`, no "checked <date>" on a source. Git already records when every line was written, and a second hand-typed date only diverges from it over time. Record *that* something happened and by whom (research, story prep, or Jeroen), never *when*. This applies to every agent and command that writes a spec.

Because this repository publishes a library (`@bach.software/vue-dynamic-form`), many features have no UI at all: they change the engine, the type-level API, or validation. Those skip the design phase (the product-owner notes the skip and sets status straight to `architecture`), and the architecture phase carries the extra weight: public API impact, backwards compatibility, and the changeset bump type.

## Lifecycles

**Epic** (optional container grouping several features; no design or architecture of its own):

```
draft → [awaiting-discussion] → awaiting-approval → approved → in-progress → done
```

**Feature** (design and architecture live here):

```
draft → design → architecture → adversarial-review → [awaiting-discussion] → awaiting-approval → approved → in-progress → done
```

**Story** (created only after the feature is approved):

```
draft → qa → adversarial-review → [awaiting-discussion] → awaiting-approval → approved → implementing → verifying → done
```

**Quick lane** (bug fixes and trivial changes):

```
draft → adversarial-review → [awaiting-discussion] → awaiting-approval → approved → implementing → done
```

### The two Jeroen queues: `awaiting-discussion` and `awaiting-approval`

Both statuses mean "this is in Jeroen's court". They differ in what they ask of him, and that difference is the whole point of having two:

| Status | Means | What Jeroen does | Where he can do it |
| --- | --- | --- | --- |
| `awaiting-discussion` | Something is genuinely open: an unresolved question, an unresolved blocker, or a call only he can make | Runs `/spec:discuss <id>` and rules on the items | At a desk. It needs his judgement |
| `awaiting-approval` | Nothing is open. Every item is answered, by him or from research | Reads it and stamps it | Anywhere, phone included |

`[awaiting-discussion]` is bracketed in the lifecycles above because it is **conditional**, and how often it fires differs sharply by spec type. A **feature or epic** normally lands there: it is the point where Jeroen is supposed to be consulted, and a feature review that raised nothing is the exception. A **story or quick spec** normally does not, and should not: by then the feature is approved and he has stepped back, so a story in this queue means the chain hit something it could not settle. The phase that hands a spec to Jeroen (the adversarial-reviewer, or `/spec:quick` and `/spec:epic` for the lanes that have no reviewer) decides between the two mechanically, not by feel:

> Set `awaiting-discussion` if **any** of these holds, otherwise set `awaiting-approval`:
>
> 1. an **Open question** is unresolved;
> 2. a **blocker** finding is unresolved;
> 3. a **should-fix** finding is unresolved **and** has no `PROPOSED (adversarial review)` resolution written into the spec.

Point 3 is the one that keeps this useful rather than noisy. A should-fix already routed as a `PROPOSED` edit does **not** force a discussion: the reviewer has written the fix into the relevant section, so Jeroen is accepting a concrete proposal, not being handed a hole. A should-fix with no proposed resolution is a hole, and counts. Nits never count.

Severity must not be bent to reach the tidier status. `awaiting-approval` is a promise that the spec can be stamped without close reading, and a blocker quietly downgraded to a should-fix turns that promise into a trap.

`/spec:discuss` owns the transition out: when the last open item is resolved it moves the spec from `awaiting-discussion` to `awaiting-approval`. That is not an approval and does not weaken the gate rule below; it only says the spec is now a yes/no question. If Jeroen stops a discussion partway, the spec stays in `awaiting-discussion` with whatever is still open.

`/spec:approve` works from **either** status, because the gate is his and he may always decide he has seen enough. From `awaiting-discussion` it lists the unresolved items first and asks him to confirm, so skipping a discussion is deliberate rather than accidental.

**Terminal state: `deferred`.** Any spec (epic, feature, story, or quick) can be moved to `status: deferred` from any point in its lifecycle when Jeroen decides not to build it (for now or for good). It is a **parking state, not an approval**: it does not pass the approval gate and no work follows from it. Record the rationale in the spec itself (a short `DECISION — DEFERRED (Jeroen)` note near the top) so the reasoning survives with the spec, and leave any adversarial-review findings unresolved (there is no point polishing a parked spec). `/spec:status` lists `deferred` specs out of both Jeroen queues. To revive one, set its status back to the phase it should re-enter (usually `awaiting-approval` or the phase whose work still needs doing) and refresh the note. Unlike `done`, a `deferred` spec shipped nothing.

**`done` is closed: never reopen a `done` epic or feature to bolt on new stories.** `done` means shipped, reviewed, and approved for a specific scope; a story added later would either skip the design/architecture gate that scope already passed, or force the whole feature back through it, and it makes the spec an unreliable record of what actually shipped. When new work touches a `done` spec's territory, link forward instead of reopening backward, in prose (e.g. "extends FEAT-001", "owned by FEAT-001, split to FEAT-004"):

- **Small, mechanical, low-risk delta** on a done feature's artifact: a new **quick lane** spec (`/spec:quick`), referencing the origin feature by name.
- **Substantial new scope** in the same area: a new **feature** spec, optionally under the same epic if that epic is still open.

A spec still short of `done` (including `in-progress` features whose stories haven't shipped yet) is fair game to edit directly: it hasn't closed anything yet. This distinction is why, for instance, amending an `awaiting-approval` story is normal but amending a `done` one is not.

Epics follow the same rule: a `done` epic doesn't gain new features. A genuinely new initiative in that space gets its own epic, optionally noting the relation to the earlier one in its vision text.

## Epics (optional grouping above features)

Most work starts at feature level. When an initiative is too big for one feature and naturally spans several, wrap it in an **epic**. An epic is a lightweight container only:

- It holds a vision and a **feature breakdown** (candidate features with a one-line scope each and rough order). It has **no** design, prototype, or architecture of its own; those always live at feature level.
- The link is **flat**: a feature belonging to an epic sets `epic: EPIC-XXX` in its frontmatter. Feature folders are **never** nested inside the epic folder; epic folders and feature folders both sit at the top of `specs/`. This keeps every feature independently designed, approved, and shipped.
- Create one with `/spec:epic <idea>` (product-owner in EPIC mode). After Jeroen approves the epic, elaborate each candidate feature with `/spec:feature <idea> EPIC-XXX`, which stamps `epic: EPIC-XXX` on the new feature and links it under the epic's Features section. The epic moves to `in-progress` when its first feature starts and to `done` when all its features are `done`.

Epics are optional. A standalone feature just leaves `epic: ""` and behaves exactly as before.

## Approval gates: only Jeroen approves

There are three approval gates, and all belong to Jeroen alone. Each opens from `awaiting-approval` or, with the unresolved items listed first, from `awaiting-discussion`:

1. **Epic direction (optional):** an epic in `awaiting-approval` waits for Jeroen to review the vision, scope, and feature breakdown before any child feature is elaborated. Only Jeroen sets `status: approved`.
2. **Feature direction:** a feature in `awaiting-approval` waits for Jeroen to review the functional scope, the prototype (if any), the architecture, and the adversarial findings. Only Jeroen sets `status: approved` and fills `approved_by`. The scrum-master refuses to split an unapproved feature.
3. **Story implementation:** each story (and quick spec) in `awaiting-approval` waits for Jeroen the same way. The developer refuses to implement an unapproved story.

No agent ever sets `status: approved`, suggests setting it, or works past the gate. When a spec is in `awaiting-approval` or `awaiting-discussion`, agents do nothing but report.

Jeroen opens a gate in one of two equivalent ways: edit the spec's frontmatter by hand (`status: approved`, `approved_by: Jeroen`), or run **`/spec:approve <id>`**. The command is the sanctioned human channel (handy from the phone, where hand-editing nested YAML is awkward): a slash command is always typed by Jeroen himself, so it counts as him exercising the gate. It refuses unless the spec is in `awaiting-approval` or `awaiting-discussion` (from the latter it first lists what is still unresolved and asks him to confirm), and it only sets those two frontmatter fields, nothing else. This does not weaken the rule above: no agent may invoke `/spec:approve` inside its own flow or set `status: approved` any other way.

Related hard rules: each agent only advances the status for its own phase, after completing its own section. A story that needs to overturn a feature-level decision never does so silently; it flags the conflict and the feature spec is amended first.

## Command reference (in workflow order)

| Command | Does | Model |
| --- | --- | --- |
| `/spec:epic <idea>` | product-owner (EPIC mode) creates an epic that decomposes into candidate features | sonnet |
| **APPROVE** (`/spec:approve EPIC-XXX`) | Jeroen sets `status: approved` on the epic (optional; only when grouping features) | (no agent) |
| `/spec:feature <idea> [EPIC-XXX]` | product-owner creates the feature spec from an idea (optionally under an epic) | sonnet |
| ↓ `/spec:continue FEAT-XXX` runs the next three in one go | | opus |
| `/spec:design FEAT-XXX` | ui-designer builds the cohesive prototype for the ENTIRE feature (skipped for features with no UI) | opus |
| `/spec:arch FEAT-XXX` | architect works out the complete technical design | opus |
| `/spec:review FEAT-XXX` | adversarial-reviewer attacks the spec (full mode) | opus |
| `/spec:discuss FEAT-XXX` | researches the open items, settles what has a clear winner, walks Jeroen live through the rest, then moves the spec to `awaiting-approval` | opus |
| **APPROVE** (`/spec:approve FEAT-XXX`) | Jeroen reviews and sets `status: approved` on the feature | (no agent) |
| ↓ `/spec:continue FEAT-XXX` runs the next three in one go | | opus |
| `/spec:split FEAT-XXX` | scrum-master slices the approved feature into stories | sonnet |
| per story: `/spec:qa ST-YY` | qa-planner writes the test plan | sonnet |
| per story: `/spec:review ST-YY` | adversarial-reviewer, lite mode | opus |
| **APPROVE** (`/spec:approve ST-YY`) | Jeroen sets `status: approved` on the story | (no agent) |
| ↓ `/spec:continue FEAT-XXX` runs the next two, plus the fix loop | | opus |
| `/spec:implement ST-YY` | developer implements the approved slice | sonnet |
| `/spec:verify ST-YY` | qa-verifier checks the result against spec and prototype | sonnet |

This table is the **single source of truth for which model runs which phase**. `/spec:continue` reads it (and each command file) to decide what to pass, so keep it accurate: see the known-limitation note below for why the model has to be passed explicitly rather than read from the agent's own frontmatter.

Any time: `/spec:status` shows the whole pipeline and what is waiting on Jeroen, split into the two queues (needs a decision, needs a stamp). `/spec:approve <id>` opens the gate from either (see above). `/spec:quick <description>` runs the fast lane for small fixes (mini spec, lite review, Jeroen approval, then `/spec:implement`).

### Running a whole chain: `/spec:continue`

The table above is the full set of phases, but Jeroen rarely wants to type them one at a time. **`/spec:continue <id>`** (opus) runs every phase from where a spec currently sits up to the **next approval gate**, then stops. It dispatches on status, so one command covers all three stretches:

| # | From | Runs | Ends at |
| --- | --- | --- | --- |
| 1 | feature in `design` | design → arch → review | feature at `awaiting-discussion` or `awaiting-approval` (Jeroen's gate) |
| 2 | feature in `approved` | split → per story qa → review | every story at `awaiting-approval`, bar any it had to park |
| 3 | feature `in-progress` with an approved story | per story: implement → verify → fix findings | story `done`, bar any it had to park |

It never crosses a gate and never sets `status: approved`. Chains 1 and 2 deliberately behave differently about open questions, which is the heart of the design below; chain 3 behaves differently depending on whether it is running on Jeroen's machine.

**Chains 2 and 3 run to the end.** They never halt the whole run over one undecidable item. If a story hits something that genuinely cannot be settled without Jeroen, that **single story** is parked at `awaiting-discussion` with a note saying what is missing, and the chain moves on to its siblings. Jeroen comes back to a feature where everything that could progress has progressed, plus a short list of what stalled. See the tie-breaker ladder below for why parking should almost never happen.

**Chain 3 and the commit rule.** Chain 3 implements a story, verifies it, and fixes whatever the qa-verifier finds, re-verifying until it passes (three attempts, then it stops and reports rather than trying a fourth time). What happens next follows the interactive-versus-autonomous line drawn in `CLAUDE.md`:

- **On Jeroen's machine (interactive):** it does **one** story and commits **nothing**. He reviews the working tree, commits it himself, and runs `/spec:continue FEAT-XXX` again to pick up the next story.
- **In its own environment on its own branch (autonomous):** it commits each story as it verifies clean and moves straight on to the next, until every story is `done`. The result is one branch with one commit per story.

It defaults to interactive, since committing unasked on Jeroen's machine is the worse failure, and it announces which mode it detected before doing anything irreversible. Autonomous requires a clear signal: `CI`/`GITHUB_ACTIONS` set, an explicit `--autonomous`, or session instructions saying to work unattended. It never pushes and never opens a PR unless asked.

**The per-story commits are deliberate and must survive into the PR, and into `main`.** They are how Jeroen reviews: one story at a time, rather than one wall of diff. Never squash them, and never otherwise rewrite the branch history to tidy it up. Note the difference with other projects: **this repository merges PRs with a merge commit and never squash-merges**, because the Changesets release process depends on the preserved commit history (see CLAUDE.md's Release Process section). The per-story commits therefore survive all the way into `main`, which is one more reason each of them must pass `pnpm ci` on its own.

### Where Jeroen is consulted: the two attention points

The workflow is built so Jeroen is needed at exactly two moments per feature, and can ignore everything in between.

**1. Feature review, the real one.** After `/spec:continue` has run design, architecture, and the adversarial review, the feature sits at `awaiting-discussion` with its open questions and findings deliberately **left open**. Nothing has been decided on his behalf. `/spec:discuss FEAT-XXX` then walks him through it live: it researches every open item first (primary sources, checked against this project's installed versions), settles the ones with a clear winner, and brings him only the calls that genuinely need a human. He rules on those, approves, and is done with the feature.

**2. Story approval, a rubber stamp.** After approval, `/spec:continue FEAT-XXX` splits the feature and prepares every story unattended, researching and deciding open points as it goes. Jeroen is not expected to read these; he sets each story to `approved` and starts implementation on the branch he wants. Stories should arrive at `awaiting-approval`, never at `awaiting-discussion`: by this point the feature is approved and he has explicitly stepped back, so a story that still needs him is an exception the chain works hard to avoid (see the ladder below), not a normal outcome.

Implementation itself needs no decisions from him, only his git hand: locally, `/spec:continue FEAT-XXX` implements and verifies **one** story and leaves it uncommitted, he commits, and he runs the command again for the next one. Running autonomously it does the whole feature in one go, a commit per story. Either way the specs are the same; only who presses commit changes.

The rule separating the two chains: the **pre**-approval chain decides nothing, because its whole output feeds his review. The **post**-approval chain decides everything it can, because he has stepped back and asked not to be involved again until the PR.

That asymmetry is deliberate. Before approval, a question left open costs nothing, since Jeroen is about to read the spec anyway. After approval, the same question costs him a context switch back into a feature he has mentally closed. So the two chains apply different bars, both defined in `specs/RESEARCH-AND-DECIDE.md`:

- **Pre-approval:** leave every open point open.
- **Post-approval:** settle it. Research it first; if research produces a clear winner, record `DECIDED (research)` with sources. If it does not, walk the **post-approval tie-breaker ladder** (approved feature spec, then upstream standards and dependency docs, then the existing codebase pattern, then reversibility, then smallest scope) and take the first rung that discriminates. A tie broken on the last two rungs is recorded honestly as `ASSUMED (story prep)`, naming the alternative and what reversing it would cost.

The ladder exists because "no clear winner" almost never means "only Jeroen can answer this". This library's validation model is **XSD-inspired and built on vee-validate**, so most questions about rule semantics, edge-case behaviour, or naming have a factual answer in the XSD specification, the vee-validate docs, or the Vue docs, checked against the versions this project actually installs. Most style questions are answered by the existing codebase. Most of what used to stop a chain is answerable by looking.

What is left over, and genuinely parks a story at `awaiting-discussion`, is narrow and worth stating exactly:

1. It needs a fact only Jeroen has: credentials, account access (npm, Cloudflare, codecov), budget, a business call, or a semver judgement he wants to make himself.
2. Answering it means contradicting something already approved (the feature's design or architecture, or an existing `DECIDED (Jeroen, ...)` entry). Overturning his call silently is the one thing that must never happen.
3. The approved feature has a real gap that neither upstream docs nor the codebase fills, and every option changes what ships in a way he would notice (in particular: any option that changes the public API differently).

Case 3 is usually a defect in the **feature**, not in the story. When a story parks for that reason it names the feature section that is missing, so `/spec:discuss` fixes the cause rather than patching the symptom into one slice. Repeated parking across several stories of the same feature means the feature was approved with an unresolved design question, and the report says so in those words.

### Agents have web access

The ui-designer, architect, adversarial-reviewer, and product-owner have `WebFetch` and `WebSearch`. The architect verifies API and library assumptions against official docs (Vue, vee-validate, VitePress, Storybook, Vitest) and the project's installed versions; the adversarial-reviewer checks factual claims instead of only reasoning about them (including XSD semantics for the `xsd_*` rules); the product-owner scopes against what the published docs site and existing examples actually contain; the ui-designer checks UI patterns and accessibility conventions.

Agents use the web to do their own phase better. They still do **not** settle Jeroen's open questions: those go to the Open questions section and are resolved by `/spec:discuss` or the post-approval chain. The scrum-master, qa-planner, developer, and qa-verifier have no web access, since their work is defined by internal artifacts (the approved spec, test conventions, the codebase) rather than by anything external.

### Known limitation: agent frontmatter `model:` is not honored by Claude Code

Each agent in `.claude/agents/*.md` declares a `model:` in its frontmatter (see the Model column above), but Claude Code currently ignores that field when spawning a subagent: the subagent silently inherits whatever model the calling session is running, not its own declared model (tracked upstream as [anthropics/claude-code#43869](https://github.com/anthropics/claude-code/issues/43869)). Until that's fixed, every `/spec:*` command file above states the model inline (e.g. "model: opus") specifically so whoever is invoking the agent passes it explicitly as the `model` parameter on the Agent tool call, since that is the one mechanism that is actually honored. If you add a new `/spec:*` command or agent, carry this pattern forward rather than relying on the agent file's frontmatter alone.

Because the model is now recorded in three places (the agent frontmatter, each command file, and the Model column above), those three can drift apart silently. `/spec:continue` chains several agents across two models, so it runs a **pre-flight** before its first agent call: it reads the command file and the agent frontmatter for every phase it is about to run and refuses to start if they disagree, reporting the conflicting values instead of guessing which was intended. It also asks each agent to open its report with the model it believes it is running as, which is the only available signal that the inheritance bug has fired, since the Agent tool result does not report the model used. Note the limit of that check: a self-reported **mismatch** is real evidence, but a self-reported match is weak confirmation and does not prove the right model ran.

## Worked walkthrough: building a feature end to end

A concrete run-through of the full lifecycle, using an example feature: **a read-only display mode for `DynamicForm`** (render the whole form as static text instead of inputs). Follow the same shape for any real feature. Commands are typed to Claude Code; the **APPROVE** steps are Jeroen opening the gate, either by editing the frontmatter by hand or by running `/spec:approve <id>`.

### 1. Describe the idea → `/spec:feature`

```
/spec:feature A read-only mode for DynamicForm: a setting that renders every
field as static text instead of an input, reusing the same metadata and
template, for review/summary screens.
```

The **product-owner** agent creates `specs/FEAT-001-readonly-mode/spec.md` from `TEMPLATE-feature.md` (the number is the next free `FEAT-XXX`), fills in the problem, scope, and functional overview, checks `specs/components.md` and nearby code so the spec builds on what already exists, and lists open questions for you instead of guessing. It sets `status: design` (or `architecture` when the feature has no UI surface) and stops.

> Read the spec, answer the open questions inline, adjust scope. The spec is the conversation: edit it directly.

> **Shortcut:** steps 2, 3 and 4 below are exactly what `/spec:continue FEAT-001` runs in one go, stopping at the step 5 gate. In daily use you type the one command.

### 2. Design the feature's visual surface → `/spec:design`

For this feature the visual surface is the docs example and Storybook story that demonstrate the mode. The **ui-designer** produces one cohesive `FEAT-001-readonly-mode/prototype.html` covering the relevant states (empty values, arrays, choices, validation display), fills the spec's Design section, gives each section an anchor id, and advances `status: architecture`. A pure engine feature would have skipped this step.

### 3. Work out the technical design → `/spec:arch`

The **architect** fills the Architecture section covering the whole feature: the component/composable plan against `specs/components.md`, the public API impact (new setting on `DynamicFormSettings`? a new slot? what `defineMetadata` sees), backwards compatibility and the changeset bump type, data flow, ADR notes for real decisions, and the seams the feature can be sliced along. Non-trivial flows get a Mermaid diagram. It advances `status: adversarial-review`.

### 4. Attack the spec → `/spec:review`

The **adversarial-reviewer** runs in FEATURE (full) mode: it tries to break the functional scope, the prototype, and the architecture (API holes, semver mistakes, vee-validate behaviour the spec assumes wrongly), writes findings with severities into the spec's Adversarial review section, and routes blockers/should-fixes as `PROPOSED (adversarial review)` edits. Then it stops, at `awaiting-discussion` if it left anything open (the usual outcome for a feature) or at `awaiting-approval` if it did not.

### 5. Talk it through, then APPROVE (Jeroen only)

This is the one point in the feature where you're genuinely needed. Start with `/spec:discuss FEAT-001`: it researches every open item first, settles the ones with a clear winner, and walks you live through only what actually needs you, one item at a time with a recommendation for each. Once nothing is left open it moves the feature to `awaiting-approval`. Then review and open the gate (`/spec:approve FEAT-001`, or set `status: approved`, `approved_by: Jeroen` by hand). Until it's set, `/spec:split` refuses to run.

### 6–7. Slice into stories, prep each story → `/spec:continue`

```
/spec:continue FEAT-001
```

Runs `/spec:split` (scrum-master slices along the architecture's seams, e.g. `ST-01-core-readonly-setting`, `ST-02-docs-example-and-story`), then `/spec:qa` and `/spec:review` for each story in dependency order, researching and deciding open points as it goes. Every story lands at `awaiting-approval`; anything unresolvable parks that one story at `awaiting-discussion` and the rest carry on. **APPROVE** each story (`/spec:approve ST-01`); the feature was the review point, the stories are a stamp.

### 8. Implement and verify → `/spec:continue` again

Check out the branch you want the work on, then run the same command a third time. It picks up the first approved story, runs `/spec:implement` (developer: reuse first, tests from the QA plan alongside the code, `specs/components.md` updated, changeset added when `packages/core/src/` changed) and `/spec:verify` (qa-verifier: full `pnpm ci` plus coverage, every acceptance criterion with evidence, prototype comparison, process compliance). On a fail it fixes the findings and re-verifies, up to three attempts, then parks rather than thrashing.

**On your machine it stops there, with everything uncommitted.** Review, commit the story yourself, and run `/spec:continue FEAT-001` again for the next one. **Running autonomously on its own branch** it commits each story and rolls on, ending with one branch carrying one commit per story. When every story is `done`, the feature is `done`.

### At any point

```
/spec:status         # pipeline overview: what's waiting on you, what's stuck,
                     # what an agent can pick up next
/spec:continue <id>  # run every phase up to the next approval gate, then stop
/spec:discuss <id>   # research the open items, settle what's clear, walk you
                     # live through the rest
```

### The fast lane (no feature needed)

For a bug fix or a trivial change, skip the whole feature machinery:

```
/spec:quick xsd_pattern anchors the regex twice when the pattern already starts with ^
```

This creates a `QUICK-XXX-<name>/spec.md` (problem, proposed change, affected files, test impact), runs a **lite** adversarial review, and stops at `awaiting-approval` (or `awaiting-discussion` if the review left a blocker open, which for a genuinely quick fix should be unusual). After you approve (`/spec:approve QUICK-XXX`), `/spec:implement QUICK-XXX` ships it, still honouring the `specs/components.md` update rule, the test obligation, and the changeset rule.

### Grouping several features under an epic (optional)

For a bigger initiative, start one level up with `/spec:epic <idea>`. The **product-owner** (EPIC mode) creates `specs/EPIC-XXX-<name>/spec.md` with the vision, scope, and a feature breakdown, then stops at Jeroen's gate. After approval, elaborate each feature with `/spec:feature <idea> EPIC-XXX`; each runs the exact flow above. `/spec:status` shows the features grouped under the epic, and the epic is `done` once all of them are.

## Folder structure

```
specs/
  TEMPLATE-epic.md
  TEMPLATE-feature.md
  TEMPLATE-story.md
  components.md          # living inventory of the library's public surface
  EPIC-001-example-initiative/
    spec.md              # vision + scope + feature breakdown + live Features index (NO design/architecture)
  FEAT-001-example-feature/
    spec.md              # the feature spec; frontmatter `epic: EPIC-001` links it to the epic above (or "" if standalone)
    prototype.html       # cohesive prototype of the feature's visual surface, with anchor ids per section (UI features only)
    assets/              # screenshots, mockups, exports the design was based on
    stories/
      ST-01-first-slice/
        spec.md          # thin story: references feature design/architecture, holds only deltas
      ST-02-second-slice/
        spec.md
  QUICK-001-small-fix/
    spec.md
```

Note the flat model: `FEAT-001` is **not** inside `EPIC-001`'s folder. Both live at the top level and the only link between them is the feature's `epic:` frontmatter field, so a feature stays independently designed, approved, and shipped.

Supporting registries the agents rely on:

- `specs/components.md`: living inventory of the library's public components, composables, types, and validation rules; consulted before proposing anything new, updated by the developer on every change to the public surface.
- `CLAUDE.md`: the architecture guide (three-layer contract, metadata tree shapes, validation model), the quality gates (`pnpm ci`, coverage, changesets), and the code style rules.
- `specs/RESEARCH-AND-DECIDE.md`: the rules for researching an open point and deciding it without Jeroen; referenced by `/spec:discuss` and `/spec:continue`.
