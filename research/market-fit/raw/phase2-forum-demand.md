# Phase 2 — Forum/thread demand signals (raw notes)

Date of research: 2026-09-30. Angle: recent (2025-2026 preferred) threads/issues where someone
asks for exactly what vue-dynamic-form does, or where a competing library visibly fails at the
same problem (repeatable groups + per-item conditional logic, XSD-style validation, cross-section
conditional validation). Method: WebSearch (Reddit indexing is weak/blocked), GitHub REST API via
curl (no auth needed for public issues/comments — far more reliable than WebFetch/WebSearch for
GitHub content), HN Algolia API.

Tooling note: direct `curl` to reddit.com (JSON API and old.reddit.com) returns HTTP 403 from this
sandbox — Reddit blocks the request outright (no login, no rotating UA workaround attempted beyond
one UA string). WebFetch also refuses old.reddit.com. WebSearch's own web index for reddit.com
returns almost nothing relevant (mostly Wikipedia/GitHub noise even with `site:reddit.com`
operator) — Reddit is effectively a dry well with the tools available in this environment. If
Jeroen wants Reddit specifically, he needs to browse it manually or use an authenticated tool.

HN Algolia API (https://hn.algolia.com/api/v1/...) IS reachable via curl and returned real results,
but queries for "dynamic form schema", "form builder", "XSD form", "municipal forms software" all
returned zero relevant hits (unrelated Show HNs). HN is a dry well for this specific niche — the
topic (metadata-driven forms, XSD semantics) just doesn't come up there.

## HEADLINE FINDING: open-formulieren/open-forms#2441 has fresh 2026 activity confirming the gap AND a funding gap

This is the same issue phase 1 already found ("Repeating groups: No possibility to use logic for
each item in a group"), but I re-fetched it live via the GitHub REST API and it has moved a lot
since whenever phase 1 looked at it. Full comment thread (state: OPEN, updated_at
2026-09-09T14:05:05Z, labels: discuss / topic: repeating group / owner: utrecht / topic: form renderer):

- 2022-12-07 sergei-maertens (Maykin, core maintainer): confirms it's technically possible client-side, references form.io sandbox.
- 2023-02-24 joeribekker: "Initial assessment: Giving it prio high because it's reported often by clients."
- 2023-03-09 SilviaAmAm: "Den haag would like to have advanced frontend logic re-enabled on the components to work around this (DH Taiga 47 / 400)." — names a specific municipality with an internal ticket reference.
- 2023-05-08 joeribekker: edge case found with duplicate keys in/out of repeating group; "We need to wait for the new form builder/renderer."
- 2023-06-28 joeribekker: "Will be picked up under utrecht." (owner: utrecht label)
- 2026-06-03 bregje-hub: "@sergei-maertens is this already fixed?"
- 2026-06-03 sergei-maertens: "Probably not"
- 2026-09-09 magdalena-source: "Because of issue #902 from Den Haag, I wanted to ask whether we're planning to fix this at some point. If so, do we have a rough idea of when?" (note: GitHub issue #902 in this repo is unrelated — a 2021 date/time validation issue — so "#902" here is almost certainly an internal Den Haag/Taiga reference number reused in conversation, not a GitHub link. Don't cite #902 itself as evidence.)
- 2026-09-09 sergei-maertens: **"There is currently no budget for anything related to repeating groups, so no, it's not planned. We've reached out repeatedly in the past months to various stakeholders, including DH, to say that we can now pick up long-standing issues in repeating groups, but that we require budget, and we had zero positive response to that."**

This is about as clean a signal as exists: the core maintainer of the Form.io-based NL municipal
forms platform has publicly stated (three weeks before this research) that (a) the per-item
conditional logic gap in repeating groups is confirmed unfixed after 4 years, (b) it is reported
often by clients, (c) named municipalities (Den Haag, Utrecht — Utrecht literally owns the ticket)
want it, and (d) Maykin has asked stakeholders for budget and gotten zero response. That's a
maintainer publicly inviting outside funding/vendors for exactly the capability vue-dynamic-form
already has (per-item conditional logic + choice branches inside repeatable groups is a first-class
metadata shape, not a workaround).

Related, weaker signals in the same repo (checked via API, not close reads):
- open-forms#6142 "Groups with visibility logic nested in repeating groups (visually) missing from overview/pdf" — closed 2026-03-31, so a *different, narrower* rendering bug got fixed, but the core "no per-item logic" issue (#2441) is explicitly still open and unfunded as of Sept 2026. Worth knowing so Jeroen doesn't overclaim "nothing has moved."
- No open TenderNed listing found for "Open Formulieren" + repeating groups specifically (searched; only generic TenderNed platform pages came back, nothing procurement-specific indexed).

## Actionable reply-lead: vee-validate discussion #5056 (still unanswered)

https://github.com/logaretm/vee-validate/discussions/5056 — "Conditional validation with yup and
useField" — posted 2025-06-20, confirmed via API `comments: 0` (still genuinely unanswered as of
this research). User wants to conditionally require fields in one form section based on a status
field in a different section, using yup `.when()` with cross-section refs like `"$section1.status"`
— breaks once the schema is split per-component via `useField`. They considered `useFieldValue` +
computed schemas but called it unwieldy across many sections.

This is directly in vue-dynamic-form's wheelhouse: it's built on vee-validate and the
`computedProps` + `useFieldValue(path)` mechanism in `useDynamicForm` is designed exactly for
cross-field/cross-section reactive conditions without hand-rolling per-section yup schemas. Good,
low-cost reply target — zero competing answers to date, so a reply doesn't get buried.

## FormKit: recurring "repeater + conditional" bug pattern (evidence, not a live reply lead)

Searched FormKit's issue tracker via API for repeater+conditional bugs across its history:
- #583 (2023-02-14) "Repeaters with conditionals don't work" — closed
- #1044 (2023-11-24) "Radio buttons in repeaters 'stealing' selected status from each other" — closed
- #1144 (2024-01-24) "Placing a Group inside a Repeater and adding an 'if' condition may lead to data confusion" — closed
- #1650 (2025-06-04) "Repeater with condition and localstorage is not working" — closed same day, redirected to Discord ("Feel free to ask how-to questions in the discord")
- **#1774 (2026-09-29 — literally the day before this research)** "Schema field renders with wrong family/DOM (select→checkbox) after unmount+remount when array has multiple conditional (`if`) siblings" — reporter mbertolani, found while debugging **a production medical "critical finding report" form** with ~8-9 sibling fields, several gated by a sibling radio button's `if`. Read all 4 comments via API: reporter tried three workarounds (group wrapping, avoiding unmount via `node.input()`), each made it worse (corruption became "sticky," bled into unrelated fields). Maintainer justin-schroeder's fix: add an explicit unique `key` to every schema-array node. Reporter confirmed it resolved the issue and it was closed same day (~6 hours), explicitly credited to "Enterprise support."

Read: this is now a *closed, resolved* issue, so it is NOT a live reply opportunity — but it's
strong pattern evidence for content marketing: five separate "repeater + conditional" bugs across
3+ years in FormKit's own issue tracker, the most recent one in a *production medical form*, root
cause being positional/structural node identity breaking down once repeaters mix conditional and
non-conditional siblings. This is a real, recurring structural weakness in the
array-of-schema-nodes approach that vue-dynamic-form's `DynamicFormItemArray` design (each item
gets its own `useField` registration keyed by normalized path, not positional schema-compile
identity) avoids by construction. Good blog-post/comparison material, not a thread to jump into.

Also checked Formwerk (the newer, more modern headless Vue form library from vee-validate's own
author, Abdelrahman Awad) for the same pattern: only one relevant issue, #230 "Wrong behavior for
conditional fields" (opened, closed 2025-10-27) — conditional field values not cleared from
form.values state when the field unmounts (including inside a FormRepeater). Single report, quickly
closed, not evidence of a systemic issue in Formwerk — but confirms the same *category* of bug
(conditional + repeater interaction) shows up even in a from-scratch, well-funded 2025 rewrite.
Formwerk has zero GitHub Discussions currently (`is:discussion` search returned total: 0), so no
open threads to reply to there.

## Other things found, weaker signal

- **GreenPepper freelance posting**: "Ontwikkelaar Digitale Formulieren" for **Provincie
  Noord-Brabant** — ZZP/freelance, €115/hour, 32 hrs/week, 's-Hertogenbosch, start 2026-09-14, end
  2027-02-27, application deadline 2026-08-28 (already passed by the time of this research — not
  actionable as-is). Platform is iProx (iProx.forms + iProx.web), not Open Formulieren/form.io/XSD,
  so it's a different tech stack, but it confirms Dutch provincial government pays serious day
  rates for "complex form logic" + WCAG 2.2 + DigiD/eHerkenning integration work, and GreenPepper is
  a staffing agency actively placing freelancers into exactly this kind of Dutch-government forms
  work. Contact on the posting: Zoë Gidding, zoe.gidding@greenpepper.nl, +31 6 34 940 271. Worth
  registering interest with GreenPepper as a recruiter channel for future similar assignments (not
  a specific lead to chase, but a recurring-opportunity channel).
- **dynamic-field-kit** (github.com/vannt-dev/dynamic-field-kit) — a small, early-stage (2 stars, 1
  fork) schema-driven form engine for React/Vue/Angular with repeatable groups + conditional
  visibility (`appearCondition`) + Zod/Yup/Valibot adapters. No XSD angle. Not a lead, but notable
  prior art / point of comparison — someone else independently hit the same "schema-driven +
  repeatable + conditional, framework-agnostic" itch recently. Low adoption so far.
- vee-validate's own official issue/discussion history has plenty of "array validation" and
  "conditional validation" questions going back years (#3098, #3810, #3834, #4624, #3338, #4574,
  #4519) but all older (2022-2024) and already answered/resolved — not fresh reply targets. Only
  #5056 (above) is both recent and genuinely unanswered.
- JSONForms (eclipsesource/jsonforms) — no specific open discussion found matching "repeating +
  conditional Vue" despite Vue integration existing; general issues page has volume but nothing
  singled out as a clean reply target in the time available.
- SurveyJS/Vueform blog content (2026) confirms "schema-driven forms" is a live category people are
  writing about/comparing in 2026 (Vueform 2.0 announced Jan 2026 touting typed schema access
  paths), i.e. the category is getting more attention, not less — useful market-temperature context
  even though these aren't leads.

## Dry wells (tried, nothing usable)

- Reddit r/vuejs, r/webdev, r/Nuxt — blocked at the network level (403 on reddit.com JSON API and
  old.reddit.com via WebFetch); WebSearch's indexed-reddit results were all irrelevant noise. Did
  not find a single usable reddit thread this session despite ~6 different query variants.
- Stack Overflow — WebSearch could not surface any specific recent (2025-2026) unanswered Q&A
  matching "vue dynamic form" + repeatable/conditional/XSD; results were dominated by tutorial
  blog posts (djamware, Medium, dev.to) rather than actual SO questions. Did not find a working way
  to query SO directly (no API key set up for Stack Exchange API in this session).
- Ask HN / HN Algolia — zero relevant hits across "dynamic form schema", "form builder", "XSD
  form", "municipal forms software". This audience doesn't discuss this niche.
- TenderNed — generic searches surfaced only the TenderNed platform's own marketing/help pages, not
  actual tender listings (TenderNed's tender detail search isn't crawlable/indexed the way GitHub
  is; would need to search TenderNed's own site search directly, which wasn't attempted this
  session beyond one WebSearch pass).
- JSONForms GitHub discussions specifically for repeating+conditional — nothing distinct found.
