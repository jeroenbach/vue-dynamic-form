# Phase 2 raw notes: Dutch insurance / SIVI AFD lead sourcing

Date of research: 2026-09-30. Angle: named prospects and live signals in Dutch insurance (SIVI AFD vendors, volmachten/serviceproviders, insurtech, vacancies, AFD 2.0 migration announcements).

## Method

10 WebSearch queries (Dutch + English) + targeted WebFetch on promising pages. No login-walled sources hit directly (LinkedIn job view returned HTTP 429 on one fetch, worked around with search snippets instead).

## Key structural finding: NVGA Protocol 2.0 / SUIV rollout is the timing driver

- suiv.nl/update-nvga-protocol-2-0/ (fetched): names four organizations directly implementing AFD-conformant NVGA Protocol 2.0 delivery:
  - **DIAS** (system house) — Q1 2024 release planned
  - **CCS** (system house) — Release 18.1 expected September 2024
  - **ANVA** (system house) — Q4 2024 implementation targeted
  - **Solera** (service provider, handles VRA/Volmacht Resultaat Analyse) — adjustments expected complete Q2 2024
  - Does NOT name specific insurers or gevolmachtigden (intermediaries) participating in testing.
- schade-magazine.nl article (2026-07, fetched): NVGA Protocol 2.0 broad rollout expected in 2026 (currently in testing phase per this later article, so the 2024 dates above appear to have slipped — the 2026 broad-rollout framing is the current, more reliable one). Requires: policy/claims data per AFD-definitions, VRA-expanded data, eliminates old "stance" reporting system, minimal AFD-definitions as fallback per sector. No companies named in this specific article.
- Implication: DIAS/Blinqx, CCS, ANVA, and Solera Nederland are all under active, named pressure to ship AFD 2.0/NVGA Protocol 2.0-conformant data handling in the 2025-2026 window. This is a concrete, dated reason to approach these four vendors now.

## Named live vacancies (strongest signals)

### 1. Keylane — Senior Front End Engineer, Plexus Digital Engagement (Rotterdam, hybrid) — BEST FIT
- Source: https://www.dreamworkhq.com/job/a40c324c-b6c1-4bc7-8d2b-fd3aa755eeea (fetched, posted "2 weeks ago" relative to search date)
- Original posting: https://apply.workable.com/keylane/j/23CC323985/
- Role: modernize digital pension portals (Plexus Digital Engagement / PDE cluster) used by pension providers to interact with employers, advisors, participants. Explicitly: "migration from Vue 2 to Vue 3", WCAG accessibility alignment, "design reusable, configurable components supporting multiple customer needs" (multi-tenant SaaS).
- Stack required: Vue 3, Composition API, Pinia/Vuex, TypeScript, Nuxt, Vite, Storybook, Vitest, Cypress, Playwright, 8+ years experience, SaaS/platform/multi-customer background.
- Salary: EUR 4500-6000/month gross + 8% holiday allowance.
- Team: multidisciplinary Agile team (Back-end Engineers, Test Engineer, Designer, Business Analyst, Product Owner, Development Manager).
- This is almost a direct description of what vue-dynamic-form solves: multi-tenant configurable forms/components + Vue2->3 migration + WCAG. Strong candidate for either (a) Jeroen applying directly, or (b) pitching the library/consulting to the hiring manager as a faster path to the "reusable, configurable components" goal.

### 2. Keylane — other openings (same employer, same macro-fit)
- Full Stack Engineer: https://careers.keylane.com/jobs/full-stack-engineer/
- General careers/current openings hub: https://apply.workable.com/keylane/ and https://careers.keylane.com/jobs/
- Axon Product Development — Software Engineer role also seeks "modern JavaScript frameworks (preferably Vue.js)" per search snippet (not independently fetched/confirmed — treat as secondary confirmation only).
- Keylane overview: SaaS platform vendor for insurance and pensions, teams across six countries, Utrecht-based per Appfront vendor list.

### 3. ANVA — Frontend Engineer, ANVA 6 platform (Amersfoort, hybrid 32-40h)
- Search-derived (not independently fetched beyond snippets): role is "very technical," "mainly develop the backend of the frontend," ANVA 6 described as "multi-tenant, cloud-native SaaS platform" to "transform the back-office of the insurance landscape."
- Contact named in a different ANVA vacancy (Product Owner Finance/Jet Engine postings): Cees Hupkes, c.hupkes@anva.nl, +31 6 28886415. Frontend Engineer role separately had contact Burak Yildirim (HR), b.yildirim@anva.nl, 06-41823167 (per earlier snippet — confirm current contact before emailing, HR contacts rotate).
- Careers hub: https://anva.nl/vacatures
- ANVA is one of the four system houses named in the NVGA Protocol 2.0 rollout (see above) — concrete AFD 2.0 delivery pressure.
- Appfront vendor list confirms ANVA = "Modular cloud platform with modules for claims and business insights," Amersfoort.

### 4. Robbe Assuradeuren (volmacht/serviceprovider) — Applicatiebeheerder CCS Level/7
- Source: https://www.robbe.nl/over-robbe/vacatures/vacature-applicatiebeheerder-ccs-level-7 (fetched)
- Robbe: financial services firm, "60 years" history, "40+ experienced financial specialists," won VVP Advies Award 2019.
- Role explicitly wants knowledge of "uniforming of AFD-labels (SUIV), Aplaza, FinConnect and/or GRS-protocol" — i.e., they are mid-modernization on AFD-label uniformization right now.
- Also manages: "Mijn-omgeving" (My environment) customer portal, its connection to frontoffice software "Bugs Business," volmacht website www.robbeassuradeuren.nl, and "creating and maintaining connections with various external data sources and software providers."
- This is a smaller/mid-size volmacht company, not a software vendor — a potential direct client for consulting/component work on their customer-facing portal forms, rather than a job to apply to. Worth a direct cold outreach.

### 5. CCS (Woerden) — SureCore next-gen platform + Software Engineer (.NET) vacancy
- Source: https://www.ccs.nl/vacatures/software-engineer/ (fetched)
- CCS: 30+ years insurance software (Level platform, legacy), now building "SureCore" next-gen solution "that works in tandem with Level" to modernize insurance back-office "domain by domain." Salary EUR 4500-5750/month, Woerden, 32-40h.
- Tech stack in THIS posting is backend-only (.NET, Docker, GitHub, SQL/NoSQL, CI/CD, Azure/.NET Aspire/Pulumi nice-to-have) — no frontend framework named, so this specific req is not a Vue match. But CCS is a named NVGA Protocol 2.0 system house (AFD 2.0 delivery pressure) and actively rebuilding a platform domain-by-domain, which typically includes front-end/forms work not yet posted publicly.
- Contact: recruitment@ccs.nl, 0348-486848.
- Other CCS vacancy noted but not pursued: Technical Systems Engineer Windows (irrelevant), CCS connects "Software Implementatie Consultant" (non-technical, not fetched in depth).
- Robbe's own job posting (#4 above) separately confirms CCS Level/7 is deployed at volmacht end-clients (Robbe uses it) — so CCS's platform choices ripple down to intermediaries needing portal/forms work too.

## Named vendor landscape (from Appfront "9 beste verzekeringssoftware" article, fetched)

All nine, for reference/future outreach — technology stack not disclosed by the article for any of them:
1. Appfront (Amsterdam) — custom insurance software/apps/integrations
2. Keylane (Utrecht) — SaaS, polisadministratie/schadebehandeling/underwriting/facturatie — SEE LEAD #1/#2 above
3. ANVA (Amersfoort) — modular cloud platform — SEE LEAD #3 above
4. CCS (Woerden) — Digital Insurance Platform — SEE LEAD #5 above
5. Blinqx, formerly DIAS Software (Gouda) — SaaS for advisors; DIAS separately named as NVGA Protocol 2.0 system house
6. Netaspect/Certigo (Breda) — full policy lifecycle platform; active vacancies for .NET/Angular/React developers (NOT Vue) at vacatures@netaspect.nl — https://netaspect.nl/vacature/software-engineer/ — lower fit since off-stack, but a possible white-label/partner conversation if their platform supports embeddable widgets
7. SiliconCode (Den Haag) — low-code platform, "unique customized applications for Allianz and VNAB for years," Co-polis platform live at 96 insurance organizations for VNAB co-insurance cancellations — https://www.siliconcode.ai/en/applications/industries/insurance — this is effectively a low-code competitor in the business-insurance/co-insurance niche, own generated-code approach (not Vue) — informational, watch rather than approach
8. Online Pro (Nijmegen) — cloud policy/claims/correspondence software
9. A.i. Automatisering (Breda) — CRM + polisadministratie

## Solera Nederland / ABZ

- https://solera.nl/backoffice, company overview via search: ~190 employees in NL across ABZ, Commerce Delta, Market Scan, Autodata brands. ABZ = "leading provider of web-based solutions... efficiency in financial services and automotive... fraud/risk management, sales/distribution, claim management."
- Named in NVGA Protocol 2.0 rollout as the VRA (Volmacht Resultaat Analyse) data-service adjustment party.
- No specific current vacancy fetched/confirmed; Indeed/Glassdoor listing pages found but not drilled into individual postings (time-boxed).

## Achmea / large insurer angle (weaker, lower priority)

- Achmea (largest NL insurer, 10M+ customers, 10 brands) runs a recurring "Hart voor code" tech-careers channel: https://www.werkenbijachmea.nl/hart-voor-code
- Two specific frontend postings surfaced in search snippets (not independently fetched — one LinkedIn fetch hit HTTP 429):
  - "Front-end developer Zilveren Kruis" — mentioned Vue.js among other tech, but noted as EXPIRED/no-longer-open by the search snippet.
  - "Frontend ontwikkelaar bij Interpolis Data & Online" — https://nl.linkedin.com/jobs/view/frontend-ontwikkelaar-bij-interpolis-data-online-at-achmea-4249409292 — could not fetch (429 rate-limited), tech stack unconfirmed.
- Large enterprise, likely uses internal teams / big SI partners (Achmea has large in-house dev orgs) — harder for a solo freelancer to land directly without a staffing agency intermediary. Treat as a "monitor werkenbijachmea.nl periodically" lead, not an immediate action.

## SIVI itself — API/tooling signal (informational, not a lead)

- https://www.sivi.org/actueel/persbericht-sivi-biedt-tool-voor-eenduidige-api-afspraken-in-de-verzekeringsketen/ (fetched) — published 2025-12-22. SIVI expanded its AOS (AFD Online Samenstellen) tool to standardize API documentation (OpenAPI) across the insurance chain for premium calc, policy admin, claims. No named pilot participants (only SIVI's own Robin Oostrum and director Peter Mols quoted). Signals sector-wide momentum toward API/data standardization but not a specific actionable lead by itself.

## Dry wells (tried, yielded nothing usable)

- No public, complete SIVI-recognized software-supplier directory found (SIVI's site references "100 software providers" active in the ecosystem across categories but doesn't publish a name-by-name public list accessible via search).
- TenderNed-style public tenders: not applicable — this is a private-sector B2B ecosystem (insurers/volmachten/vendors), not public procurement, so no tender leads expected or found here.
- Freelance.nl / Upwork searches combining "verzekeraar"/"volmacht" + "Vue.js" returned only generic Vue.js freelance listings unrelated to insurance (healthcare sector, unrelated sectors) — no insurance-specific freelance/zzp opdracht found on freelance.nl for this niche as of search date.
- NVGA Protocol 2.0 articles (both suiv.nl and schade-magazine.nl) explicitly do NOT name any specific insurers or gevolmachtigden/intermediaries as testing participants — only the four vendor/service names (DIAS, CCS, ANVA, Solera) surfaced.
- "SIVI vacature freelance opdracht polisadministratie schade-intake formulier bouwen" search surfaced one freelance.nl OpenForms formulierenbouwer posting, but that's the municipal Open Formulieren ecosystem (already covered by the Phase 1 municipal angle), not insurance-specific — noted but not counted as an insurance lead.
- CCS connects "Software Implementatie Consultant" LinkedIn posting found but not pursued (non-technical implementation/consulting role, weaker fit than the Software Engineer posting already captured).
- Roadmap PDF (sivi.org/.../Roadmap-Intermediaire-Distributie-2024-2025-v1.1-def.pdf) could not be parsed by WebFetch (binary PDF content returned instead of extracted text) — downloaded locally to `/Users/jeroenbach/.claude/projects/-Users-jeroenbach-Source-dynamic-form-worktrees-dynamic-form-worktree-1/4b086a81-e206-4796-9d93-fda4a248781b/tool-results/webfetch-1790761967325-cpaeaa.pdf` if someone wants to open it directly and re-extract text manually.

## Full search query log

1. `SIVI AFD 2.0 leverancier verzekeraar 2025`
2. `SIVI leden lijst software leveranciers AFD standaard`
3. `"AFD 2.0" migratie verzekeraar polisadministratie`
4. `volmacht serviceprovider portaal vernieuwing schadeafhandeling Vue.js vacature`
5. `insurtech Nederland Vue developer vacature polis intake formulier`
6. `SIVI erkende softwareleveranciers overzicht polissoftware`
7. `freelance opdracht "AFD 2.0" OR "SIVI" ontwikkelaar verzekering`
8. `"polisadministratie" frontend developer vacature Vue OR React verzekeraar 2025 2026`
9. `NVGA volmachtgever software vernieuwing digitalisering schadeportaal 2026`
10. `ANVA Vue.js polisadministratie modernisering`
11. `DIAS verzekeringssoftware polisadministratie systeem AFD`
12. `CCS verzekeringssoftware Nederland polisadministratie vacature`
13. `ANVA vacature developer frontend`
14. `Solera Netherlands VRA schade software vacature developer`
15. `itselector.nl verzekeringssoftware leveranciers overzicht`
16. `ANVA Frontend Engineer vacature Amersfoort ANVA 6 platform`
17. `Keylane Nederland verzekeringen vacature developer AFD SIVI`
18. `SiliconCode low-code verzekeringen platform Vue`
19. `Netaspect Certigo verzekeringssoftware vacature developer`
20. `"volmacht" OR "verzekeraar" freelance frontend developer Vue.js opdracht 2026`
21. `ANVA vacatures site:anva.nl OR "anva.nl/vacatures"`
22. `Keylane Axon vacature Vue.js OR JavaScript frontend developer`
23. `SIVI vacature freelance opdracht polisadministratie schade-intake formulier bouwen`
24. `a.s.r. OR Achmea OR Univé OR DAS vacature frontend developer Vue.js formulier`
25. `acceptatie vragenlijst verzekering underwriting formulier developer bouwen opdracht`
26. `CCS Woerden vacatures Software Engineer Level Digital Insurance Platform`

## Fetched pages (full list)

- https://www.sivi.org/wp-content/uploads/2024/11/Roadmap-Intermediaire-Distributie-2024-2025-v1.1-def.pdf (failed — binary PDF, not parseable)
- https://schade-magazine.nl/nieuws/archief/2026/07/nvga-protocol-20-wat-is-er-nieuw-en-wat-betekent-het-voor-verzekeraars/12970 (success)
- https://suiv.nl/update-nvga-protocol-2-0/ (success — key vendor names)
- https://www.robbe.nl/over-robbe/vacatures/vacature-applicatiebeheerder-ccs-level-7 (success)
- https://appfront.nl/beste-verzekeringssoftware-leveranciers (success — 9-vendor list)
- https://www.dreamworkhq.com/job/a40c324c-b6c1-4bc7-8d2b-fd3aa755eeea (success — Keylane job posting, best lead)
- https://apply.workable.com/keylane/ (partial — meta description only, no listing detail)
- https://www.sivi.org/actueel/persbericht-sivi-biedt-tool-voor-eenduidige-api-afspraken-in-de-verzekeringsketen/ (success)
- https://nl.linkedin.com/jobs/view/frontend-ontwikkelaar-bij-interpolis-data-online-at-achmea-4249409292 (failed — HTTP 429)
- https://www.ccs.nl/vacatures/software-engineer/ (success)
