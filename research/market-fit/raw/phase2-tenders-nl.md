# Phase 2 raw notes: TenderNed / TED / marktconsultatie angle (run 2026-09-30)

Angle assigned: open and recent public tenders on TenderNed/TED for e-formulieren, digitale
dienstverlening, zaaksysteem front-ends, WCAG/toegankelijkheid remediation, Open Formulieren
implementation, plus marktconsultaties. Method: 10+ WebSearch queries, WebFetch to confirm.

## Headline finding

Direct, currently-open TenderNed/TED tenders that name "e-formulieren" / "Open Formulieren" /
"formulierenserver" as the procurement subject are scarce and mostly indexed as either already
closed, already awarded, or bundled inside much bigger zaaksysteem/sociaal-domein procurements
where forms are one line item among many. The far richer, more *actionable* vein this run turned
out to be the open-formulieren/open-forms GitHub issue tracker: it is a live, public backlog
where municipalities and implementation partners tag their own unmet needs with `owner: <gemeente>`
labels, and the single biggest unmet need cluster is exactly the gap the deep-research brief
identified (open-forms#2441: no per-item conditional logic in repeating groups). This is arguably
more actionable than a tender: it's a thread Jeroen can comment on today, naming real municipal
sponsors, with a four-year-old unresolved core limitation.

## TenderNed / TED searches (dry-ish)

- `site:tenderned.nl e-formulieren gemeente aanbesteding 2026` — mostly noise (zaaksysteem
  procurements, Utrecht inschrijvingsleidraad). One relevant hit: "Aanbestedingsdocument:
  Front-end applicatie sociaal domein" (Gemeente Vijfheerenlanden), see below.
- `aanbesteding "Open Formulieren" gemeente 2026` — no direct tender naming Open Formulieren as
  procurement subject; returned generic gemeente aanbestedingskalenders (Groningen, Lansingerland).
- `marktconsultatie digitale dienstverlening formulieren gemeente 2026` — mostly subsidy-system
  marktconsultaties (Utrecht subsidiebureau, Limburg subsidiebeheersysteem), not forms-specific.
  Noted: CARE.nl sells "Toegankelijke e-formulieren voor gemeenten en overheid" as a commercial
  product — a competitor/possible partner worth a separate look, not chased further this run.
- `tenderned.nl "formulierenserver" OR "e-formulieren" aanbesteding` — dry well, generic
  e-procurement (eForms EU notice format) noise only.
- `aanbestedingskalender.nl formulieren gemeente WCAG toegankelijkheid` — surfaced PIANOo/VNG
  "Factsheet inkoop Digitale Toegankelijkheid" (GIBIT / EN 301 549 reference) — useful context,
  not a lead. wcag.nl has a forms-accessibility knowledge article, not a lead either.
- `tenderned aankondiging "formulieren" gemeente augustus september 2026 -gegund` — dry well.
- `negometrix aanbesteding formulieren gemeente 2026` — dry well beyond generic Negometrix/Mercell
  platform explainers.
- `ted.europa.eu 2026 municipality "digital forms" accessibility Netherlands tender` — dry well,
  only generic TED platform/eForms explainer pages.

### Gemeente Vijfheerenlanden — Front-end applicatie sociaal domein (tender, deadline passed)

- Tender doc: https://www.tenderned.nl/papi/tenderned-rs-tns/v2/publicaties/428738/documenten/14388359/content
  (PDF, could not text-extract via WebFetch — binary saved locally by the tool, not re-parsed here)
- Reference IBMN-2026-VIJ-AH-001. Published 2026-06-11, deadline 2026-08-27 (already closed as of
  today 2026-09-30 — not biddable now).
- Scope per search snippet: four-year contract (+6x1yr optional extension) for a front-end
  application covering Wmo, Jeugdwet, "eigen inzet" (social team), leerlingenvervoer, gehandicapten-
  parkeerkaart (GPK), beschermd wonen, en kindregeling (KOT) — i.e. exactly the kind of multi-step,
  conditional, per-case-type intake forms the library targets. Good evidence of demand, not
  biddable now. Worth checking back in ~Q4 2026 for the award (Negometrix/TenderNed "gegund"
  notice) to identify the winning contractor as a subcontracting-partner prospect.

### Gemeente Amersfoort — zaaksysteem vervanging (tender/marktconsultatie, status unclear)

- Marktconsultatie held/published 2026-01-19 (ref. 565747); four market parties responded, three
  gave a product demo. Selection phase ("selectieleidraad") document exists on TenderNed
  (publicatie 418380) but WebFetch could not extract readable text (PDF binary, page shell only).
  Could not confirm current deadline/status — flagged as uncertain, not confirmed open.
- General zaaksysteem replacement, forms are one component among many; lower fit than a forms-
  specific procurement.

### Other TenderNed noise checked and discarded
- Gemeente Molenlanden zaaksysteem — already awarded to Visma Circle B.V. (contract date
  2026-01-22, €750k) — too late, dead end.
- Gemeente Gulpen-Wittem / Wijksteunpunt PvE documents — indexed but not forms-relevant on
  inspection of snippets, not pursued further (time-boxed).
- Utrecht inschrijvingsleidraad (Feb 2026) — mentions e-formulieren only as background context
  ("forms offered on municipality's own website, citizen portal as alternative"), not itself a
  forms procurement.

## Pivot: open-formulieren/open-forms GitHub issue tracker (rich vein)

Searched `open-forms github issue "conditional logic" repeating group 2025 2026`, then fetched
individual issues and the label-filtered issue list.

### open-forms#2441 — "Repeating groups: No possibility to use logic for each item in a group"
https://github.com/open-formulieren/open-forms/issues/2441
- Opened 2022-12-07, still **open**, no PR, no fix timeline stated.
- Labels: `discuss`, `owner: utrecht`, `topic: form renderer`, `topic: repeating group`.
- Exactly the gap named in the phase-1 brief. Confirmed still unresolved after ~4 years, with
  Gemeente Utrecht tagged as the requesting/funding municipality.

### open-forms#4942 — Epic "Herhalende groep" (repeating group)
https://github.com/open-formulieren/open-forms/issues/4942
- Opened 2024-12-17. Labels: `owner: den-haag`, `owner: dimpact`, `owner: utrecht`,
  `repeating group`. Status "waiting for approval" (estimate made, stakeholder sign-off pending).
  Progress shown as "4/12 sub-issues done" per fetch (rendering was garbled: "4/124 of 12").
- Groups together #4943, #4925, #4800, #4689, #3756, #3661, #3547, #2441, #2743, #1883 — i.e. the
  per-item-logic gap (#2441) is explicitly one line item inside a jointly-sponsored epic backed by
  **three** of the biggest players in the ecosystem: Gemeente Den Haag, Gemeente Utrecht, and
  Dimpact (the ~40-municipality shared-services cooperative that co-commissions Open Formulieren
  development). This is the strongest single signal found this run: multiple funders, one epic,
  core unmet capability = the library's core value proposition.

### Other `topic: repeating group` open issues (from label-filtered list, for context)
- #6063 "children synced to a group should load in edit mode" — opened 2026-03-11 by LaurensBurger,
  status "Ready" in Refinement, no owner label, no assignee.
- #4943 "Automatically add first item in repeating group" — owner: dimpact — 2024-12-17.
- #4800 "Disable new group when previous group is unsaved" — owner: dimpact, hoorn, utrecht —
  2024-10-29.
- #3756, #3274 (owner: dimpact), #2345 (owner: haarlemmermeer, blocked), #2305 (owner: dimpact,
  blocked), #1883 (owner: dimpact, haarlemmermeer), #1442 — older/lower priority, listed for
  completeness, not chased individually.

### open-forms#6619 — missing `showWhenEmpty` support in new renderer
https://github.com/open-formulieren/open-forms/issues/6619
- Opened 2026-09-03 by **justiandevs** (Justian Spijkerbosch, works at **Delta10** per his GitHub
  profile). Customer reference in the issue: **"Moerdijk acceptation"** — i.e. Delta10 hit this
  while delivering Open Formulieren for Gemeente Moerdijk. Reporter explicitly offers to help
  develop a fix himself. Status: Triage/open, product version 3.5.5.
- Confirms Delta10 (already known from phase-1 as a Maykin implementation partner) is actively
  doing hands-on Open Formulieren delivery work for at least Gemeente Ede (first customer, per
  Delta10's own blog: https://www.delta10.nl/blog/gemeente-ede-eerste-gebruiker-van-open-formulieren-via-delta10)
  and Gemeente Moerdijk, and that their developer is hitting real feature gaps and is willing to
  build fixes — a warm, technically-literate contact.

### open-forms#6723 — logic rules not removed on empty-array PUT
https://github.com/open-formulieren/open-forms/issues/6723
- Opened 2026-09-29 (literally yesterday relative to today) by LaurensBurger. Bug, High priority,
  milestone "Release 4.1", assignee sergei-maertens (Maykin core maintainer). Shows the logic
  engine is under active, ongoing development churn right now — useful timing signal, not a
  standalone lead (no named municipal customer in this one).

## Partner/prospect checks

### Delta10
- https://www.delta10.nl/solutions/open-formulieren — sells Open Formulieren as a managed
  Common Ground offering to municipalities. Gemeente Ede = first customer (blog post). Also
  active with Gemeente Moerdijk per the #6619 issue above. Small specialist agency, plausible
  subcontracting partner or a firm Jeroen could pitch the library/template pack to directly.

### xxllnc + Maykin partnership
- https://xxllnc.nl/nieuws/xxllnc-start-samenwerking-met-maykin — xxllnc (commercial zaaksysteem/
  forms vendor for municipalities) partnered with Maykin to integrate Open Formulieren into their
  product suite ("next step... develop the solution faster", quote from Ramon Tromp). No
  publication date visible on the page. No explicit mention of subcontractor needs or logic gaps
  in the article itself, but as a *commercial* vendor (not a public body) reselling Open
  Formulieren to many municipalities, they have a direct commercial incentive to close feature
  gaps like per-item conditional logic — plausible partner-pitch target, needs a direct
  conversation to confirm appetite.

### Maykin "Product Owner Open Formulieren" vacancy
- https://nl.indeed.com/viewjob?jk=47c6ab239b15fda7 (401 on WebFetch, confirmed via WebSearch
  snippet only). This is Maykin hiring their *own* internal product owner, not a subcontracting
  signal — noted for context only (shows Maykin is investing in growing the Open Formulieren
  community/roadmap right now, which is a reasonable moment to pitch a technical collaboration),
  not listed as a standalone actionable lead.

### Dimpact (the cooperative itself)
- https://www.dimpact.nl/nieuws/mijlpaal-voor-open-formulieren-bouw-open-source-oplossing-gestart/
  — Dimpact (cooperative of ~40 Dutch municipalities) co-commissioned Open Formulieren alongside
  Den Haag and Utrecht. They are the `owner: dimpact` label seen repeatedly across the repeating-
  group issues above — i.e. the actual budget holder behind several of these unmet-need tickets.
  Direct organizational prospect: a conversation with Dimpact's Open Formulieren programme contacts
  about the repeating-group epic is plausibly the single highest-leverage next action from this
  research batch.

## Dead ends / dry wells (do not repeat)
- SIVI AFD 2.0 migration — no freelance/tender postings found this run (only SIVI's own technical
  standards pages and a GitHub tooling repo unrelated to hiring).
- Digipoort/Logius XSD migration (customs/tax angle) — the Digipoort rebuild tender itself was
  already awarded to Capgemini Nederland B.V. (contract signed 2026-09-14); this is about message
  transport infrastructure, not forms/XSD-to-form tooling, so it's a dead end for this angle
  specifically (still fine as general phase-1 context, not a phase-2 tender lead).
- Negometrix/Mercell direct search — platform-level content only, no indexed forms-specific
  tenders surfaced (Negometrix/Mercell listings are largely behind buyer portals, not well
  indexed by web search).
- commonground.nl forum search for repeating-group-logic discussion threads — only surfaced
  official Open Formulieren documentation/changelog pages confirming the same limitation
  ("not possible to apply backend logic to elements within a repeating group"), no separate
  community forum thread found worth engaging beyond the GitHub issues already captured.
- Amersfoort selectieleidraad PDF — WebFetch could not extract text (binary PDF), status/deadline
  unconfirmed; flagged, not chased further given time budget.
- Vijfheerenlanden tender PDF — same WebFetch PDF-extraction limitation; relied on search snippet
  data only (deadline, scope) rather than full document text.
