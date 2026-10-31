# Phase 2 raw notes: Open Formulieren / Common Ground orbit

Date of research: 2026-09-30. Angle: actionable signals inside the Open Formulieren / Common Ground ecosystem (vacancies, freelance requests, GitHub issues, gemeente rollout struggles, community events).

## GitHub issues on open-formulieren/open-forms (confirmed via `gh api` and WebFetch, not just search snippets)

### #2441 — "Repeating groups: No possibility to use logic for each item in a group"
- URL: https://github.com/open-formulieren/open-forms/issues/2441
- Reporter: LaurensBurger — confirmed via `gh api users/LaurensBurger` / WebFetch of profile: company `@maykinmedia`, location Amsterdam. So the reporter is a **Maykin employee**, not an external municipality — meaning Maykin itself has flagged this as unresolved since Dec 7, 2022. Still **open** as of 2026-09-30 (checked via `gh api search/issues?q=repo:open-formulieren/open-forms+is:open...`).
- Internal note in the issue body references "Utr 8, DH 366, rotterdam 37" — suggesting Utrecht/Den Haag/Rotterdam-specific counts of forms affected (interpretation from WebFetch summary, not independently verified against raw issue body — worth re-checking directly if used in outreach).
- Core problem: cannot target Field C's visibility to a specific repeating-group item (RepeatingGroup.0.FieldA can be referenced, but there's no way to say "show FieldC only within this same item"). This is EXACTLY the capability vue-dynamic-form has natively (per-item conditional logic in repeatable sections).
- Workaround documented: move the conditional field outside the repeating group — not usable for real per-item logic.
- 9 comments, still active/open.

### #6055 — "Support DMN logic actions in repeating groups and multi-hit policies"
- URL: https://github.com/open-formulieren/open-forms/issues/6055
- Reporter: sergei-maertens — Maykin's lead/core maintainer (recognizable from many merge/triage comments across the repo).
- Created: 2026-03-06. Still **open** as of 2026-09-30 (6+ months, no PR yet per search results).
- Direct quote from the issue body: "it currently cannot be used with repeating groups, e.g. for children of the logged in user. Workarounds are possible by defining `index`-targeted triggers and rules, but this is **completely unsustainable** for form builders."
- Sergei's own effort estimate: hit-policy fix 2 days, UI support 4+2 days, backend 2 days — total 8-10 days of work. This is a scoped, budgeted, still-unfunded/unscheduled piece of work on the exact repeating-group-with-per-item-logic problem.
- This is the single strongest piece of evidence for the whole niche: Maykin's own architect describing the current state as unsustainable, with a concrete estimate, sitting open for 6+ months.

### #6142 — "Groups with visibility logic nested in repeating groups (visually) missing from overview/pdf"
- URL: https://github.com/open-formulieren/open-forms/issues/6142
- Reporter: LaurensBurger (Maykin). Created 2026-03-31. **Closed** via PR #6533 — so this specific rendering bug is fixed, but shows the repeating-group/conditional-logic interaction remains a recurring bug source into 2026.

### #6140 — "FE logic in a group, within a hhg crashes form."
- Reporter: LaurensBurger (Maykin). Created 2026-03-31. Closed. "hhg" = "herhalende groep" (repeating group in Dutch). Another crash caused by conditional logic + repeating groups.

### #4004 — fieldset visibility logic inside editgrid missing from summary
- Reporter: LaurensBurger (Maykin). Created 2024-03-14, closed via PR #6533 (same fix batch as #6142, i.e. this took over 2 years to actually land).

### #4925 — "Enhancements to the family members (personen) component" — RFC
- URL: https://github.com/open-formulieren/open-forms/issues/4925
- Reporter: **joeridiederen**, company confirmed via `gh api users/joeridiederen`: **Raakvlak Advies**, location Nijmegen. Raakvlak Advies is one of the named Maykin partners from phase 1 research.
- Created 2024-12-16, closed 2025-ish via decision from sergei-maertens.
- RFC proposes retrieving children/partner/housemates/arbitrary-person data via BSN lookup (StUF-BG/HaalCentraal) and using it to seed repeating-group components with per-child data entry. Explicitly frames the two long-term design options as "static model with predefined max number of options + repeating groups set up in advance" vs. "truly dynamic model that treats arrays and loops as first-class citizens" — i.e. exactly the architectural question vue-dynamic-form already answers on the Vue side.
- Comment from **knechtj** (no company/bio on GitHub profile, but self-describes as being from **Rotterdam**, filing the same issue in "Dimpact servicedesk tool" / Dimpact JIRA): confirms Rotterdam is independently hitting the same repeating-group + person-data gap and cross-filing it through Dimpact's own ticketing.
- joeridiederen's reply confirms the workflow: "from Rotterdam, we've agreed with Dimpact to post issues both here and on the Dimpact JIRA... the community is larger and somewhat more advanced" — i.e. Raakvlak Advies is actively acting as a bridge between Rotterdam/Dimpact demand and the Maykin backlog.
- Maykin's sergei-maertens explicitly declined ("wontfix/not planned") the housemates and arbitrary-BSN-lookup scenarios for GDPR/AVG reasons, but confirmed children/partner components would get seed-data support for repeating groups. Net: the *product* (Open Formulieren) is deliberately staying conservative on this axis; a *template/component layer* (vue-dynamic-form) sitting on top or adjacent could plausibly fill gaps Maykin won't take on for privacy-scope reasons — worth further scoping, not just assumed.

### Other open issues (lower priority, browsed via `gh api search/issues`)
- #3274 "Enable the amount of repeating groups shown to be set by dropdown/radiobutton" — reporter hlmr-erik, GitHub profile has no company/bio, open since 2023-07-20, still open, low comment count (2). Minor signal only.
- #6655, #6729 — sergei-maertens, unrelated to repeating-group logic (Open Product integration, price/variant component). Not relevant to this angle.
- #6619 "missing support for showWhenEmpty in new renderer" — minor rendering regression in repeating groups, not a strategic gap.
- #3993 "Location in repeating groups is functional but requires editing the json" — repeating-group + prefix bug in the location/postcode component. Minor.

## Raakvlak Advies — direct case study
- Case page: https://www.raakvlakadvies.nl/cases/knallen-met-open-formulieren
- Confirms Raakvlak Advies is running the actual migration for **Rotterdam** from the legacy e-Suite forms product to Open Formulieren, form by form, plus UAT and training of application managers, and that "other Dimpact-affiliated municipalities are beginning Open Formulieren work, with Rotterdam serving as a model."
- Direct quote captured by WebFetch: "We try to transfer it one-to-one. But these are two totally different tech..." — a team member describing the pain of matching old form logic to the new platform's capabilities. This is a good icebreaker quote for outreach (verify original Dutch wording on the page before quoting externally).
- No public subcontracting/developer-wanted language on the page itself, but combined with joeridiederen's (Raakvlak employee) GitHub activity pushing for more dynamic repeating-group support, this reads as an organization that is both (a) doing hands-on Open Formulieren build work for municipalities and (b) hitting the platform's repeating-group ceiling in practice.

## Freelance/job postings

### Politie (Dutch National Police) — DevOps Engineer OpenFormulieren
- Source: https://www.freelance.nl/opdracht/1176000-devops-engineer-openformulieren (confirmed via WebFetch, not just snippet)
- Client: Politie, via Harvey Nash recruitment.
- Scope: deploy/configure OpenFormulieren for a citizen portal (24/7 digital service requests, appointments, feedback), 5 prioritized products, knowledge transfer to internal staff.
- Duration 24 months, 36h/week, €95/h all-in, Utrecht (flexible remote), BO+ screening required.
- Requirements: 3+ years Common Ground/OpenFormulieren experience, GitOps (GitLab/ArgoCD), Kubernetes, Python, HAVEN architecture training.
- **Application deadline: 2026-07-16 09:00 — already passed as of today (2026-09-30).** This specific req is stale/likely filled, but it is strong evidence of (a) large-scale government OpenFormulieren rollouts happening now at national scale (not just municipal), (b) demand explicitly naming Common Ground/OpenFormulieren skills at a day rate around €95-ish, all-in. Worth watching Harvey Nash / freelance.nl for a follow-on or extension req, since 24-month contracts commonly get renewed/extended and generate satellite work.
- Fit note: this specific role is DevOps/infra, not forms-engine/frontend work, so even when open it's a weak direct fit for vue-dynamic-form — but it is a strong signal that Politie is actively building citizen-facing OpenFormulieren products right now, which is where per-product/per-form custom logic work (Jeroen's actual wheelhouse) tends to get carved out as follow-on freelance work.

### Einvigi — "Ontwikkelaar Digitale Formulieren" (freelance)
- Source: https://www.freelance.nl/opdracht/1180677-ontwikkelaar-digitale-formulieren and https://www.einvigi.com/en/opdrachten/freelance-ontwikkelaar-digitale-formulieren (the einvigi.com URL 404'd on direct fetch; details came from the freelance.nl listing via search summary — not independently re-verified by WebFetch, treat with a bit of caution).
- Client: unnamed government organization in **North Brabant** (province-level).
- Scope: independently build/rebuild 300+ forms in a new **iProx.forms + iProx.web** environment (this is NOT Open Formulieren — iProx is a different Dutch forms/CMS product, unrelated to Common Ground/Maykin). Start ~2026-09-14, duration ~6 months x2 extension option, 32h/week.
- **Off-angle for this specific research task** (not Open Formulieren ecosystem) — logging as a dry well for this angle, but flagging it shows there is separate, sizeable NL government demand for forms-rebuild freelance work outside the Open Formulieren orbit too, which could matter for a broader niche-4 (Vue agencies/ISVs) or generic "NL gov forms developer" search later.

## Common Ground Fieldlab events (community/demo angle)
- Series run at WTC Utrecht: confirmed dates for 2026 — Jan 19-20, May 11-12, Sep 14-15 (already past as of today), **Nov 9-10 2026** (next upcoming).
- Source: https://commonground.nl/events/view/ab0f5d68-bb58-4cd7-9dc5-498442d7f3b7/common-ground-fieldlab-9-en-10-november-2026 — WebFetch on this page failed to return full content (page likely JS-rendered; only got a header fragment "Common Ground" / "Pleio start op..."). Could not confirm registration process or whether vendors/suppliers (not just municipality staff) can attend — **needs a follow-up fetch or manual browse** before treating as fully actionable.
- Background source: https://openwebconcept.nl/nieuws/195-common-ground-fieldlab-op-14-en-15-september-ontmoet-de-community-in-utrecht confirms these are open community days where "municipalities, suppliers, and other partners come together to share knowledge, exchange experiences, and collaborate" — so supplier attendance does appear to be normal/expected, just needs registration-link confirmation.

## Dry wells (searched, nothing useful found)
- TenderNed search for "Open Formulieren aanbesteding 2025 2026" — no municipal tender specifically procuring Open Formulieren custom dev work surfaced; results were generic TenderNed platform news (Open House model rollout) and unrelated notices.
- Pleio.nl / Common Ground community forum search for threads about per-item logic — no specific forum thread surfaced (found only the general commonground.nl group page and componentencatalogus listing, no actual discussion thread content).
- LinkedIn search for "Open Formulieren" + "op zoek naar" + developer/freelance — returned only generic LinkedIn-usage guidance pages, no actual job/thread hits.
- werkenvoornederland.nl combined "Open Formulieren" + Vue search — no combined hits; only generic Vue.js frontend vacancies unrelated to Open Formulieren specifically (e.g. Zorginstituut Nederland senior front-end role, not forms-related).
- GitHub "help wanted"/"good first issue" label search on open-formulieren/open-forms — search snippets didn't resolve actual labeled issues; would need a direct `gh api repos/open-formulieren/open-forms/issues?labels=...` call to confirm (not yet done — worth a follow-up if pursuing the "contribute code, get hired" angle).
- Raadsinformatie/council-document search for "Open Formulieren implementatie problemen 2025" — surfaced only unrelated "Open Raadsinformatie" (council transparency/Woo) results, no actual gemeente council document discussing Open Formulieren rollout problems.
- Maykin careers page search for freelance/zzp openings — no specific current listing surfaced beyond a general "Jobs" page reference; would need a direct fetch of https://www.maykinmedia.nl/nl/jobs/ to confirm current openings (not done).
- xxllnc / Atabix / Delta10 vacature search — surfaced only generic "vacatures" landing pages (jobs.atabix.nl, jobs.xxllnc.nl), no specific Open Formulieren-related freelance/developer posting identified.
- Raakvlak (Belgium archaeology service) is a false-positive homonym distinct from "Raakvlak Advies" (NL, Maykin partner) — watch for this when searching just "Raakvlak".

## Notable people/orgs map for future outreach
- **Maykin Media** — maintainer, Amsterdam. Staff seen filing/triaging: sergei-maertens (lead), LaurensBurger, SilviaAmAm. Multiple long-open internal issues on exactly the per-item-repeating-group-logic gap.
- **Raakvlak Advies** — Nijmegen-based partner, doing hands-on Open Formulieren migration for Rotterdam + other Dimpact municipalities. Staff: joeridiederen (active GitHub RFC author).
- **Dimpact** — municipality cooperative; Rotterdam's issues get cross-filed through "Dimpact servicedesk"/JIRA per knechtj's comment.
- **Politie (national police)** — large-scale OpenFormulieren citizen-portal buildout via Harvey Nash contracting, 24-month contract from ~July/Aug 2026.
