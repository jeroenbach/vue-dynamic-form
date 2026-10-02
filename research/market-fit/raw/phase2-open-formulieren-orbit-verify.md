# Phase 2 Open Formulieren orbit — lead verification (2026-09-30)

## 1. Issue #6055 — DMN logic actions in repeating groups
URL: https://github.com/open-formulieren/open-forms/issues/6055
**Verdict: live**

Confirmed open. Filed by sergei-maertens (Maykin core maintainer/architect) on 2026-03-06, still open as of 2026-09-30, status "Ready" in the Refinement project, no PR/branch attached yet. Content matches the lead: DMN can't evaluate policies per-item within repeating groups (e.g. benefits eligibility per child), current index-targeted workaround called "completely unsustainable for form builders," proposal includes array-valued multi-hit results and nested variable mapping for repeating-group items, estimated at 8-10 days. Description is accurate as given.

## 2. Issue #2441 — Repeating groups: no logic for each item in a group
URL: https://github.com/open-formulieren/open-forms/issues/2441
**Verdict: live**

Confirmed open, filed 2022-12-07 by LaurensBurger, assigned to sergei-maertens, labels include "discuss", "owner: Utrecht", "topic: form renderer", "topic: repeating group". Title and substance match the lead (can't target conditional-logic fields within repeating-group items, only reference values by index). Could not independently re-verify LaurensBurger's employer via this fetch (page didn't surface org affiliation), and could not confirm the "nine comments" count — the fetch did not render comment content or count. Core claim (long-open foundational gap, restated by #6055) holds up.

## 3. Issue #4925 — Enhancements to the family members (personen) component
URL: https://github.com/open-formulieren/open-forms/issues/4925
**Verdict: misdescribed**

Confirmed opened 2024-12-16 by joeridiederen, closed as "not planned" (GitHub's standard closed-without-fix state — this is fairly described as effectively "declined," though "partial wontfix" overstates precision since GitHub shows no "wontfix" label here). Content matches: proposes retrieve-children/partner/housemates/person scenarios keyed on BSN via StUF-BG/HaalCentraal, labeled "approved" and "owner: dimpact" confirming Dimpact involvement. However, I could **not** confirm the specific claim that Maykin explicitly declined the housemates/arbitrary-BSN-lookup scenarios citing GDPR — GitHub's activity/comments were not rendered by the fetch (reactions/comments required sign-in), so that causal detail in the lead is unverified, not confirmed. Treat the "GDPR decline" framing as an inference until a comment thread confirms it directly (would need an authenticated GitHub session or `gh issue view --comments`).

## 4. Raakvlak Advies case study — Rotterdam migration
URL: https://www.raakvlakadvies.nl/cases/knallen-met-open-formulieren
**Verdict: misdescribed**

Page exists and is a real case study: Rotterdam migrating forms from e-Suite to Open Formulieren, Raakvlak consultants (Geert Donkers, Daniël Stroes) working with Gemeente Rotterdam (project lead Bregje van der Horst), first form ("vermissing reisdocument") live in December, broader rollout from March, side-by-side legacy/new form comparison plus UAT. However, the page contains **no mention of repeating groups, a GitHub RFC, or joeridiederen** — the lead's central claim ("staff member authored RFC hitting the repeating-group ceiling," "described as two totally different tech to transfer 1:1") is not substantiated by this page's content. The "two totally different tech" quote was not found either. The link between issue #4925's author (joeridiederen) and Raakvlak Advies as an employer is also unconfirmed by direct evidence — a GitHub search surfaced joeridiederen's other Common-Ground-ecosystem issues but no explicit employer/org tag tying the account to Raakvlak. Use the case study as legitimate, separate evidence of Raakvlak's Rotterdam work, but do not present the repeating-group/RFC connection as confirmed fact without further sourcing (e.g. LinkedIn or the Raakvlak team page).

## 5. Issue #4925 as evidence for Rotterdam/Dimpact independently filing similar issues
**Verdict: misdescribed** (rolled into #4925 assessment above)

The issue itself carries an "owner: dimpact" label, which does support Dimpact involvement/ownership, but I found no independent confirmation that "Rotterdam" specifically (as opposed to Dimpact generally, which serves many municipalities) filed a matching servicedesk ticket. Treat the Rotterdam-specific tie as unconfirmed.

## 6. Common Ground Fieldlab, 9-10 November 2026, WTC Utrecht
URL: https://commonground.nl/events/view/ab0f5d68-bb58-4cd7-9dc5-498442d7f3b7/common-ground-fieldlab-9-en-10-november-2026
**Verdict: live**

Page exists (confirmed via search-engine indexing under that exact title/URL) and is one of a recurring series (other instances found: 14-15 Sep 2026, 11-12 May 2026, 10-11 Nov 2025), consistent with "recurring biannual/quarterly community day." Search results confirm description: developers from municipalities and suppliers connected to G4, Dimpact, Open WebConcept, and Omnichannel gather at WTC Utrecht. Direct WebFetch of the page returned only a fragment ("Common Ground / Pleio start op...") and did not render full registration details — likely a JS-rendered SPA that the fetch tool can't fully execute. Could not independently confirm registration process or vendor eligibility from the page content itself; the lead's own next-action already flags this same limitation, which is accurate. Event date and existence are corroborated by independent search hits, so this is live/actionable, but registration mechanics still need a live look (e.g. via browser tool) before committing to it.

## Summary of corrections needed
- #4925: "closed with partial wontfix" → more accurately "closed as not planned"; the GDPR-based decline reasoning for housemates/BSN-lookup scenarios could not be verified from available content.
- Raakvlak Advies case study: does not itself mention repeating groups, a GitHub RFC, or joeridiederen — that linkage is inferred/unconfirmed, not stated on the page. The employer tie between joeridiederen and Raakvlak Advies is likewise unconfirmed by direct evidence found so far.
