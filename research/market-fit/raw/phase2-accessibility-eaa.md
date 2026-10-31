# Phase 2 raw notes — Accessibility / EAA / WCAG remediation demand signals

Research date: 2026-09-30. Angle: demand signals for accessible-forms remediation under EAA/WCAG (tenders, postings, threads, named organizations with evidenced failing forms, and accessibility consultancies that could subcontract technical form rebuilds).

Method note: WebSearch results are often summarized/paraphrased by an intermediate model rather than verbatim snippets — treat exact figures as indicative, verify via WebFetch before quoting externally. Where I WebFetched the source directly, that is noted.

---

## 1. Gemeente Groningen — failing form on Mendix (dashboard.digitoegankelijk.nl)

- URL: https://dashboard.digitoegankelijk.nl/organisaties/445/websites-apps/22348
- WebFetched directly (not just search snippet).
- "Nieuwe huisvuilpas aanvragen gemeente Groningen" — hosted on Mendix Cloud (`21burgerportaal.mendixcloud.com/p/groningen/landing/`), a citizen self-service form.
- Status: **D — does not comply**. "No measures have been taken", no accessibility audit conducted or planned.
- Target date for full compliance: **31 December 2026** (i.e. 3 months from today).
- Page last updated 2026-09-30 (today), so this is current.
- Caveat: it's on Mendix, a low-code platform — not a natural drop-in target for a Vue library. Useful primarily as (a) evidence of a live, named, dated failing form to cite in outreach/case-study copy, and (b) a conversation starter with Gemeente Groningen's digital-accessibility team about the broader form portfolio (municipalities run many forms outside Mendix too).
- Tried WebFetch on a second dashboard record (Waterschap Zuiderzeeland "Wateraanvraag formulier", https://dashboard.digitoegankelijk.nl/organisaties/945/sites-apps/791) — **404**, URL from search snippet was stale/wrong ID. Not pursued further (dry well).

## 2. New "Modeltoegankelijkheidsverklaring" — mandatory Oct 1, 2026 (imminent, government-wide)

- Legal basis: Staatscourant 2026, 515 (published, established by State Secretary of Interior 8 Dec 2025). https://zoek.officielebekendmakingen.nl/stcrt-2026-515.html
- News coverage: https://www.digitoegankelijk.nl/nieuws/modeltoegankelijkheidsverklaring-vastgesteld , https://www.digitaleoverheid.nl/nieuws/model-toegankelijkheidsverklaring-vastgesteld/ , https://www.audithouse.nl/nieuws/model-toegankelijkheidsverklaring-2026/ (WebFetched), https://www.cardan.com/blog/nieuw-model-toegankelijkheidsverklaring (found, not fetched)
- WebFetch of Audit House article confirms: as of **1 October 2026** (i.e., THIS WEEK relative to today 2026-09-30), every Dutch government org's accessibility statement must explicitly name (a) which legal exceptions apply, (b) what accessible alternative exists for each non-compliant piece of content/functionality, (c) concrete improvement measures with a visible annual progress trail.
- Required prep actions for orgs: inventory all websites/apps in scope, re-assess current accessibility status per site, rewrite the statement to the new model.
- This is a hard, dated, government-wide compliance trigger landing in days, not a single lead but a strong "why now" angle for cold outreach to any municipality/agency this week — they are all scrambling to produce a real inventory + remediation roadmap, which is exactly the moment to pitch a forms-specific technical assessment.

## 3. AFM compliance investigation of financial institutions (active Q2 2026)

- Source: https://www.cardan.com/blog/afm-start-nalevingsonderzoek-digitale-toegankelijkheid-wat-betekent-dit-voor-jouw-organisatie (WebFetched)
- AFM (Dutch financial regulator) launched a "nalevingsonderzoek" (compliance investigation) in Q2 2026 checking WCAG conformity at banks, insurers, credit providers, investment firms, pension administrators, advisors/intermediaries with 10+ employees or €2M+ revenue.
- Four criteria checked: 1.4.2 Audio Control, **2.1.2 No Keyboard Trap** (directly relevant — custom form widgets/date-pickers/comboboxes are the classic source of keyboard traps), 2.2.2 Pause/Stop/Hide, 2.3.1 Three Flashes.
- AFM also stated firms' self-filed non-conformity reports are "often too vague" — i.e., AFM is pushing back on box-ticking statements and wants concrete remediation detail.
- Verbond van Verzekeraars (insurer trade body) task force is coordinating an industry-wide model accessibility statement; named contacts: Patricia Swienink, Luuk van der Scheer. Page: https://www.verzekeraars.nl/publicaties/actueel/vragen-over-digitale-toegankelijkheid (WebFetched)
- Verbond also has a dedicated theme page: https://www.verzekeraars.nl/verzekeringsthemas/bedrijfsvoering/klantbelang-en-reputatie/digitale-toegankelijkheid (found, not fetched)

## 4. Digitaal Toegankelijk sector study — financial services, Jan 2026

- Source article: https://digitaaltoegankelijk.nl/nieuws/hoe-toegankelijk-is-de-financiele-sector-we-onderzochten-62-toonaangevende-bedrijven/ (WebFetched)
- Secondary coverage: https://www.banken.nl/nieuws/26739/websites-verzekeraars-en-banken-behoren-tot-meest-toegankelijke-in-financiele-sector (WebFetched)
- Published 14 Jan 2026. 62 organizations across 5 subsectors: consumer banks, insurers, crypto platforms, lease companies, pension investors. 580 webpages, 2,587 total errors, avg 45/site, 17 homepages with critical errors, 16 sites with no accessibility statement at all.
- Best performers named: ASN Bank (6 errors, 0 critical), Triodos (6, 0 critical), Menzis (8), Anderzorg (10), VinkVink (10).
- **Worst subsector: lease companies — 70% have no accessibility statement at all.** Crypto platforms also flagged as weak. Individual lease/crypto company names were **not** surfaced by either the primary article or secondary coverage in this pass — the full whitepaper is presumably needed. Treated as a **dry well** for company-level specificity; flagged as a follow-up (request whitepaper from Digitaal Toegankelijk, or search for it directly) rather than a lead with a name attached.
- Conclusion line quoted in coverage: "no single company fully complied with EAA requirements."

## 5. Freelance/interim market scan (freelance.nl, freep.nl, freelapp.nl, overheidzzp.nl)

All WebFetched individually where a specific posting URL existed. **Nearly every posting found is already closed** — Dutch freelance-broker sites keep old listings indexed and searchable long after the deadline passes, so search engines keep surfacing 2023–2025 dated posts under 2026 queries. Listing them for pattern evidence, not as live applyable leads:

- Frontend Developer (Vue.js), Leiden, published Apr 2023, closed. Vue2→Vue3 migration, Sitecore CMS, required WCAG 2.1. €70-80/h. https://www.freelance.nl/opdracht/1029636-frontend-developer-vuejs
- Frontend Developer, Logius (Ministry of Interior), Den Haag, applied by 3 Sept 2025, 11-month contract, React/Next.js, explicit WCAG 2.1 A&AA + NL Design System requirement, via intermediary **De Publieke Partner B.V.** (035-2063100, info@depubliekepartner.nl). Closed but De Publieke Partner is a recurring government-ICT staffing intermediary worth registering with directly. https://depubliekepartner.nl/frontend-developer-7/
- Projectleider Digitale Toegankelijkheid, Zuid-Holland municipality, via intermediary Tergos, published ~6 Aug 2026, start by 14 Sept 2026, 12-16h/week, closed by time of fetch. https://www.freelance.nl/opdracht/1179175-projectleider-digitale-toegankelijkheid
- Projectleider Wet Digitale Toegankelijkheid, **Gemeente Pijnacker-Nootdorp**, Sept 2026 – March 2027, 16h/week, via freep.nl, closed. Explicit deliverable: "initiating, directing and realizing projects to improve digital accessibility of websites, applications and digital services" to meet WCAG + EAA/EU directive. https://www.freep.nl/opdracht/projectleider-wet-digitale-toegankelijkheid
- Adviseur Digitale Toegankelijkheid, **Gemeente Hengelo**, Nov 2024–Apr 2025, closed (old). https://www.freep.nl/opdracht/adviseur-digitale-toegankelijkheid
- Adviseur Online / Specialist Toegankelijkheid, **Het Kadaster**, Jul 2024–Mar 2025 (+6mo option), max €105/h, closed. Role explicitly "guiding WCAG audit trajectories organization-wide" and "primary contact for... external audit partners" — i.e. Kadaster runs an ongoing WCAG program with external partners already in the loop. https://www.freep.nl/opdracht/adviseur-online-specialist-toegankelijkheid
- Expert Digitale Toegankelijkheid, **Provincie Overijssel**, Nov 2024–May 2025, max €120/h, closed. https://www.freep.nl/opdracht/expert-digitale-toegankelijkheid
- Adviseur Digitale Toegankelijkheid, **Provincie Overijssel** (older posting, code 060926 in URL is a listing ID not a date), Jul–Oct 2023, max €110/h, closed. https://www.freep.nl/opdracht/adviseur-digitale-toegankelijkheid-060926

**Pattern conclusion**: these are advisory/PM roles, not developer roles, and they're consistently intermediated (Freep.nl, De Publieke Partner, Tergos, OverheidZZP.nl, Freelapp.nl). Each hire signals a named org with an active, budgeted accessibility programme; the PM hired into that role becomes, weeks/months later, the buyer for the *technical* remediation work once the audit phase finishes. Registering as a specialist with these intermediaries (De Publieke Partner in particular, given the Logius/WCAG/forms fit) is a better lever than chasing any single expired posting.

Dry wells: general searches for **currently-open** Vue+WCAG+forms freelance postings in Sept 2026 kept resurfacing the same closed listings above; no live one found in this pass. TenderNed and Negometrix/aanbestedingskalender searches returned only generic procurement-platform pages, no specific open tender for form accessibility remediation — TenderNed's own search UI is not indexable via plain web search (would need direct site search with the right filters, or an account) — flagged as a source needing direct portal access rather than search-engine discovery.

## 6. Gebruiker Centraal — "Community Online Formulieren" (cross-government practitioner network)

- Event page (WebFetched): https://www.gebruikercentraal.nl/agenda/online-bijeenkomst-online-formulieren-alles-wat-je-moet-weten-over-toegankelijkheid/
- Also listed via Werk aan Uitvoering: https://www.werkaanuitvoering.nl/actueel/agenda/2026/07/07/online-bijeenkomst-online-formulieren-alles-wat-je-moet-weten-over-toegankelijkheid (WebFetched)
- Recurring online session (7 Jul 2026 instance) run by Gebruiker Centraal's "Community Online Formulieren" specifically about making online forms WCAG-accessible, open to non-members.
- Named speakers/practitioners: **Karin Tempelaar** (communication advisor, VDP) and **Edith Franconi** (accessibility advisor, **DUO** — the Dutch student finance executive agency, a huge forms-heavy organization). This event coincided with rollout of a new civil-service e-learning "Basisvaardigheid Digitale Toegankelijkheid".
- Community hub: https://www.gebruikercentraal.nl/meedoen/community-online-formulieren/ (found, not fetched in full)
- This is a high-leverage access point: a standing community of the exact people across Dutch government who own "make our forms accessible" as a job function. Worth joining and pitching a demo/case study (e.g. how per-item conditional logic in a repeating group is handled with real XSD-style validation, contrasted with the known Form.io/Open Formulieren gap).

## 7. Daadkracht / Maykin / Open Formulieren ecosystem — fresh confirmation (builds on Phase 1)

- Daadkracht positions its "(Open) Formulieren" service explicitly around WCAG + UX + user research for functional (not technical) form design: https://daadkracht.nl/webformulieren/ (WebFetched) — no mention of technical subcontracting or of Open Formulieren's specific technical limits (expected, this is their marketing page, not a technical doc).
- Confirmed active partnership: Daadkracht × Maykin, https://www.daadkracht.nl/nieuws/samenwerking_maykin/ and https://daadkracht.nl/partnerschap-daadkracht-en-maykin/
- Confirmed Maykin's Open Formulieren product owner **Bregje van der Horst(-Eijsbouts)** ran a lunch webinar 2 April 2026 specifically on designing/setting up accessible e-forms in Open Formulieren — she is the single best-placed named contact for the "engine gap" pitch (per-item conditional logic in repeating groups) identified in Phase 1 (open-forms#2441).
- Raakvlak Advies is helping **Rotterdam** replace e-Suite forms with Open Formulieren (Common Ground programme): https://www.raakvlakadvies.nl/cases/knallen-met-open-formulieren — reinforces Phase 1's Raakvlak partner lead with a concrete, named, current project (Rotterdam).
- Open Formulieren changelog (https://open-forms.readthedocs.io/en/stable/changelog-nl.html, WebFetched) shows accessibility bugs specifically at the intersection of **repeating groups + form widgets**: read-only fields previously marked in a way invisible to screen readers (now fixed), validation errors in repeating groups now surfaced "at the item" rather than only the first field. This is direct, current, technical evidence that Open Formulieren's repeating-group handling and accessibility are actively colliding — useful ammunition for outreach to Maykin/Daadkracht/Raakvlak, not a new named org.

## 8. Level Level — accessibility consultant hiring (subcontract-partner angle, builds on Phase 1)

- https://level-level.com/nl/vacatures/accessibility-consultant/ — applications accepted until 30 July 2025 (closed by now), but confirms Level Level runs an in-house "Accessibility Team" blending dev + audit work for client digital products, i.e. they are a plausible subcontracting channel for technical remediation overflow, same as Cardan/Swink/200 OK identified in Phase 1. No new project-level evidence found (dry well beyond the vacancy itself).

## Other dry wells

- `site:dashboard.digitoegankelijk.nl formulier` and related dashboard searches surface many individual site records, but the dashboard's own search/browse UI isn't crawlable in bulk via web search — finding more D-status *non-Mendix, non-government-platform* custom forms would need direct use of the dashboard's own search/filter UI (not attempted further in this pass).
- No direct evidence found of a live, open tender (TenderNed/Negometrix/Aanbestedingskalender) specifically for "form accessibility remediation" as of 2026-09-30 — these portals need direct authenticated/filtered search, not general web search.
- Could not name individual worst-performing lease or crypto companies from the Digitaal Toegankelijk Jan 2026 study (see #4) — would need to pull the full whitepaper.
- "Raakvlak Advies Open Formulieren toegankelijkheid herhalende vraag conditionele logica" search did not turn up a Raakvlak-authored technical piece specifically on this; the Open Formulieren changelog (see #7) was the more useful source instead.
