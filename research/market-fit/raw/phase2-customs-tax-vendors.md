# Phase 2 raw notes: customs/tax/compliance software vendors (NL/EU) — lead-source angle

Date run: 2026-09-30. Searches run via WebSearch (Dutch + English), pages confirmed via WebFetch where possible.
Goal: named customs declaration / tax / accounting software vendors serving NL/EU, evidence of frontend/Vue hiring
or DMS/DVA/EUCDM migration work, evidence of web-form/portal work specifically (not just backend integration).

## Headline finding: AGS → DMS migration is real, current, and painful (2023-2026)

- AGS (old Dutch customs declaration system) has been replaced by DMS (Douane aangifte Management Systeem).
  Deadline was originally "eind 2023", pushed to July 1 2024 for AGS/GPA shutdown, and migration was still
  ongoing into 2025 with documented delays.
  - evofenedex: "Afronding implementatie DMS: uitvoer op 1 december 2023 en invoer op 1 januari 2024"
    https://www.evofenedex.nl/kennis/internationaal-ondernemen/douane/douanesystemen/afronding-implementatie-dms
  - evofenedex: "Douane hervat implementatie nieuw aangiftesysteem DMS" (migration was paused/resumed —
    signals real technical trouble) https://www.evofenedex.nl/actualiteiten/douane-hervat-implementatie-nieuw-aangiftesysteem-dms
  - evofenedex: "Douane geeft update rond aangiftesystemen DMS en DVA" — DVA (Douane Vervoer Aangifte /
    transit) is a SEPARATE ongoing migration alongside DMS. https://www.evofenedex.nl/actualiteiten/douane-geeft-update-rond-aangiftesystemen-dms-en-dva
  - evofenedex: "De overgang van AGS naar DMS 4.0" — DMS 4.0 is a further phase past the initial DMS
    cutover, meaning vendors face repeated waves of schema/data-format change, not a one-off migration.
    https://www.evofenedex.nl/kennis/internationaal-ondernemen/douane/douanesystemen/bereid-je-voor-op-overgang-naar-douaneaangiftesysteem-dms-4-0
    Confirmed content: new mandatory fields (exporter at import, importer ID, CUS codes for chemicals),
    modified declaration types/representatives/valuation methods/payment terms, new security provisions and
    goods status categories. Vendors must "comprehensively redesign their declaration software."
  - Belastingdienst PDF, Sept 2024, FAQ on the AGS→DMS change: https://download.belastingdienst.nl/douane/docs/veel-gest-vragen-dms-do7321z9fd.pdf
  - Belastingdienst PDF, Oct 2025 (!), "aandachtspunten overgang DMS proeftuin" — still actively managing
    transition guidance for IIAA holders and software vendors as of Oct 2025:
    https://www.douane.nl/wp-content/uploads/2025/10/aand-punten-overgang-dms-proeftuin-do7791z1fd.pdf
  - AGF.nl coverage: "Douane hervat implementatie nieuw aangiftesysteem DMS" https://www.agf.nl/article/9484817/douane-hervat-implementatie-nieuw-aangiftesysteem-dms/
  - Stratech Logistic own update page: https://www.stratechlogistic.nl/nieuws-kennis/nieuws/laatste-nieuws-over-douaneaangiften-management-systeem-dms-mrt
  - Rotterdam Customs Services explainer: https://rtmcustoms.nl/nl/van-AGS-naar-DMS/

This is exactly the "DMS/DVA/EUCDM migration churn" driver named in the brief — confirmed independently,
current through late 2025, multiple waves (DMS → DMS 4.0, plus separate DVA transit migration).

## Goldmine: Alliantie Douane Software member directory

https://www.alliantiedouanesoftware.nl/ — an alliance representing MOST Dutch customs-declaration software
vendors, supporting ~4,200 declarants, formed specifically to improve automation-project communication with
Dutch Customs. Member logos on the page (confirmed via fetch):

AEB, Beurtvaartadres, Blujay, Boltrics, C4T (= Customs4Trade), Custo, DESC, Eaze Customs, eOrigin,
Expeditors, Fiton, Gateway, Intris, LSP Solutions, MIC, SAP, Stratech, STSO, Synerga, Van Boxtel.

This is the single richest named-prospect list found in this pass — every one of these companies is
confirmed to build/sell customs declaration software and is (by definition of being in this alliance)
currently navigating the DMS/DMS 4.0/DVA migration wave described above. Worth a systematic outreach pass
citing the migration as the "why now."

## Per-vendor findings

### Stratech (Enschede) — customs + logistics + social/HR software, alliance member
- Live vacancy: Frontend Developer, https://www.stratech.nl/vacatures/frontend-developer
  Stack confirmed: OutSystems (low-code) + Playwright test automation. NOT Vue.
- Site self-description: "number one software provider in the customs field."
- Stratech Logistic's own DMS update page (above) shows they're actively communicating DMS status to
  customers — a live pain point to reference in outreach.
- Fit: real customs vendor, live frontend hiring, but committed to OutSystems low-code, so a direct "swap
  in vue-dynamic-form" pitch is a harder sell; better framed as a subcontracting/consulting conversation
  with their tech lead about the DMS-driven forms rework, not a job application.
- Contact: Sophie Koudijs (HR), 053-480 4080, info@stratech.nl / hr@stratech.nl.

### AEB (Stuttgart HQ, Amsterdam office) — major EU customs/trade-compliance software vendor, alliance member
- General "develop software" page had "0 Job/s" listed at fetch time: https://www.aeb.com/en/work-at-aeb/develop-software.php
- 10 vacatures listed for "Aeb Amsterdam" on LinkedIn (not individually inspected):
  https://nl.linkedin.com/jobs/aeb-amsterdam-jobs
- No confirmed frontend stack. Weak/dry for now — revisit LinkedIn listing directly later.

### Boltrics (3PL Dynamics, Microsoft-stack ERP/WMS/TMS/Customs) — not confirmed alliance member but customs vendor
- Live vacancy: "Developer" https://www.boltrics.com/nl/vacatures/developer/ and
  https://www.boltrics.nl/vacature-software-developer
  Stack confirmed: Microsoft Dynamics 365 Business Central, Azure, Power Platform. NOT Vue.
- Explicit confirmation they build customs functionality: "the new standard for Dutch customs is DMS...
  Boltrics' developers have already built this system... from EMCS to PD/GDB and DMS."
- Also has a live "Douane Consultant" vacancy: https://www.boltrics.com/nl/vacatures/douane-consultant/
- Fit: confirmed DMS-building vendor with live hiring, but fully Microsoft-stack — a Vue library pitch
  would need to be about a specific customer-facing portal module, not their core ERP UI.

### Gateway (NL) — dedicated douane/customs SaaS, e-commerce shipments focus, alliance member
- Live vacancy "Software Developer" existed per search snippet (role: "develop and support the Gateway web
  application," "programming connections to import/export files into Gateway") but the direct URL
  (gateway.nl/nl/vacatures/software-developer/) 404'd on fetch — page likely moved/closed since indexing.
  Vacancies index: https://www.gateway.nl/nl/vacatures/ (English: /en/vacancies/)
- No confirmed frontend stack. Small dedicated customs-SaaS company — worth a direct look at gateway.nl for
  current openings; good fit profile (small, web-application-centric, customs-only) even though this
  specific listing is stale.

### Softpak (45+ yr Dutch logistics/customs software vendor)
- Only live listed vacancy: "Progress Developer" (Progress OpenEdge 12), explicitly NOT web-framework work
  in the way vue-dynamic-form would plug in — role touches "Web Portals and Mobile Apps" as part of a
  broader Progress-centric job. https://www.softpak.nl/jobs/progress-developer-2-2
- Generic careers blurb says they seek "front-end developer, back-end developer" among other roles, but no
  such listing was live at fetch time. Contact: jobs@softpak.nl.
- Fit: dry well for now, but the "Web Portals" mention plus stated interest in front-end hiring makes them
  worth a cold email, not a live job to apply to.

### Fiton B.V. (Rotterdam-area, TMS/WMS/Customs, "Fit on Customs" product) — alliance member
- Vacatures page (https://www.fiton.nl/en/vacatures) lists: Software Consultant, Technisch Software
  Consultant, Consulent HRM, DevOps Engineer, Support Engineer — no dedicated frontend/Vue role found.
- Product page (Fit on Customs) had no job/tech detail; navigated to vacatures index instead.
- Contact per search snippet: Gert Florusse, 078-6141461.

### Customs4trade (C4T, Mechelen BE) — CAS customs-clearance SaaS, alliance member
- Careers page: https://www.customs4trade.com/careers, Workable listing:
  https://apply.workable.com/customs4trade/. At fetch time only 1 open role showing (US, unspecified).
- No confirmed frontend stack found. Belgian company, EU-wide customs SaaS — worth periodic re-check since
  it's a fast-growing company per its own listings.

### Pincvision (Doetinchem, NL) — VAT/tax tech/customs/EPR/export compliance
- Careers hub: https://www.pincvision.com/about-us/careers, vacancies index:
  https://www.pincvision.com/vacancies, open-application page:
  https://www.pincvision.com/about-us/careers/open-application
- Direct fetch of a guessed careers URL 404'd; no specific role/stack confirmed this pass. ~60 employees per
  their own copy — worth checking /vacancies directly in a follow-up.

### Descartes Systems Group (Canadian HQ, global logistics software, has EMEA presence)
- No NL-specific frontend/Vue vacancy found. General EMEA careers funnel only
  (https://www.descartes.com/node/1145, https://careers.descartes.com/join-our-team/). Dry well this pass.

### Stream Software (Antwerp BE, douane/industrie/logistiek software) — not confirmed alliance member
- Jobs page exists: https://www.streamsoftware.eu/en/jobs — no specific frontend/Vue role surfaced via
  search. HR contact: Katrien van Put, katrien.vanput@streamsoftware.be, +32(0)3.825.77.74.

### Riege Software (Scope platform, freight forwarding + customs)
- riege.com — no NL-specific frontend/Vue vacancy surfaced. Dry well this pass.

## Port/cargo community systems (adjacent to customs, handle complex regulatory data exchange)

### Portbase (Rotterdam) — Port Community System, EMSWe integration
- LIVE vacancy: Front-End Developer, "Bezoek Schip" (ship-visit) team.
  https://werkenbij.portbase.com/o/front-end-developer-2?lang=nl
  Confirmed stack: Angular + TypeScript frontend, Java backend, event-driven architecture, AWS preferred.
  NOT Vue. Explicitly integrates with European Maritime Single Window (EMSWe) — i.e. EU-regulatory
  structured-data forms, same problem class as customs XSD forms, just a different framework.
  Location: Rotterdam, hybrid. 5+ yrs experience, Dutch fluency required.
- Fit: strong domain match (regulatory/complex-data forms at national-infrastructure scale) but wrong
  framework commitment — best treated as a consulting-pitch prospect (e.g. "would you consider a Vue
  micro-frontend for a new module") rather than a job to chase, or as evidence for outreach messaging about
  who else is investing in this problem space.

### Cargonaut (Schiphol Group) — air cargo community system (Port Community System equivalent for air freight)
- LIVE "Frontend Developer Cargonaut" listing surfaced on LinkedIn/Monsterboard/werkopschiphol/Adzuna, e.g.
  https://nl.linkedin.com/jobs/view/frontend-developer-cargonaut-at-royal-schiphol-group-3968334549 and
  https://www.werkopschiphol.nl/vacatures/overig/frontend-developer-cargonaut (this specific URL 404'd on
  fetch — likely stale/relisted).
  A companion "Java Backend Developer -Cargonaut" listing (closing date 29 July 2026) confirmed a
  Java/Spring Boot/Docker/OpenShift/Kafka/Splunk backend stack, with NO frontend framework mentioned in that
  posting: https://www.impactvandaag.nl/vacature/java-backend-developer-cargonaut/f2e2972f-90d6-4b6c-b648-2cc2149d01c9
  Company description: "central cargo information hub... quality, storage and exchange of cargo information
  across export, import, logistics, and customs processes in air freight."
- Frontend stack for the Frontend Developer role itself is NOT confirmed (could not fetch the live posting
  directly). Needs a follow-up direct check of werkenbij Schiphol Group or LinkedIn for current stack before
  treating as high-fit.

## Tax/accounting software (SBR/Digipoort side, adjacent angle)

### Belastingdienst's own AWA (Automatische Winstaangifte) project — historical proof-of-concept, now DISCONTINUED
This is the standout finding of this pass, even though it is not a current, actionable lead:
- The Belastingdienst itself commissioned and ran a "Vue.js + JSON forms service" service in 2018-2020:
  "generates HTML content based on a JSON description of a form (labels, fields, dependencies) and a
  JavaScript engine," injected into the web environment of third-party accounting software packages.
- Freelance postings for it, via staffing agency Need Staffing (agent Willem van Ruijven), end client
  Ministerie van Financiën / Belastingdienst:
  - v1: https://www.freelance.nl/opdracht/1012391-net-ontwikkelaar-met-kennis-van-vue-js (title suggests
    .NET but search snippet described Vue.js+JSON forms work; consistent with v2 posting)
  - v2 (fetched in full): https://needstaffing.nl/opdrachten/1211 — "Javascript Developer – Vue.js Form
    Service Development (Version 2)," explicitly "je bouwt verder op de software die een andere VUE
    developer heeft ontwikkeld" (build on an existing Vue codebase), adding workflow features: date
    validation, conditional messaging, field validation, plus new/updated forms for fiscal year 2019.
    Stack: Vue.js, JavaScript, JSON, VS Code, Node, Git. Posted for start 18-03-2020, 1 month, 40h/week,
    Utrecht. Status: CLOSED, not active.
  - Original web search snippet (https://wp.freelance.nl/opdracht/882220-webdeveloper-vue-js) could not be
    fetched directly (DNS failure on wp.freelance.nl subdomain) but corroborates the same project via
    search-result summary: piloted FY2018 with 2 accounting-software vendors under the AWA name.
- Belastingdienst news article (March 15, 2022), fetched in full:
  https://over-ons.belastingdienst.nl/automatische-winstaangifte-is-gemak-en-tijdwinst-voor-zzpers/
  Names the collaborating vendor: **Informer** (CEO Peter Potters quoted: "we add fiscal control to
  accounting software for the first time, that's what makes this module unique"), and **Tellow** (CEO Thomas
  Vles) as a second named accounting-software participant. Says the module was open to all accounting
  software providers.
- IMPORTANT CAVEAT found via WebSearch synthesis (not independently verified via a dedicated fetch — treat
  as PLAUSIBLE not CONFIRMED): "the Belastingdienst later discontinued this initiative for automatic profit
  declaration from bookkeeping software." If true, the AWA program itself is dead — meaning this is a
  precedent/proof-point to cite in outreach ("the Belastingdienst already proved this pattern works"), not a
  live tender or job.
- Toegankelijkheidsverklaring (accessibility statement) registry entry for the "Invulassistent" module was
  found via search (https://www.toegankelijkheidsverklaring.nl/register/17776) but 404'd on direct fetch —
  would be worth retrying to confirm whether the module still has a maintained WCAG statement (i.e. still
  live) vs. archived.

### Informer B.V. — named accounting-software vendor, already built "fiscal control" logic with Belastingdienst
- https://www.informer.nl/blog/sneller-winstaangifte-doen-koppeling-nextens-informer — Informer also has an
  integration with Nextens (Dutch tax-return software for professionals), i.e. two live Belastingdienst/tax
  software integration points.
- No current developer vacancy found for Informer in this pass (search returned only generic Vue-job noise,
  no Informer-specific posting). Worth a direct site visit to informer.nl/vacatures in a follow-up, and a
  strong candidate for a cold-outreach "prospect" pitch citing the AWA precedent directly (a named CEO quote
  exists to reference).

### Nextens — Dutch professional tax-return software
- No developer vacancy found via search. Dry well this pass; worth checking directly given the Informer tie-in.

### e-Boekhouden.nl (Geldrop) — Dutch bookkeeping SaaS, live hiring
- Careers page fetched: https://werkenbij.e-boekhouden.nl/vacatures/software-developer — 10 open roles
  listed at company level, including "Senior AI Software Developer." One listing description (from search
  snippet, not the fetched overview page) said the Software Developer role is "80% backend - 20% frontend"
  and explicitly involves connections to "other systems and partners like the Belastingdienst via
  web-services" — i.e. confirmed Digipoort/Belastingdienst integration work, but frontend-light and no
  framework confirmed. Salary band €2,700-€7,500/mo depending on role. Contact: werkenbij@e-boekhouden.nl.

### Moneybird, Tellow — Dutch bookkeeping SaaS, mentioned as Belastingdienst integration partners
- Moneybird has a careers page (https://www.moneybird.nl/werken-bij/) but no specific role/stack surfaced.
- Tellow confirmed as an AWA-era Belastingdienst integration partner (see above) but no current vacancy
  surfaced. Both are dry wells for a live job lead this pass, but named integration partners worth outreach.

### Visma (owns Visma eAccounting, Visionplanner, etc.)
- Visma eAccounting community forum has a live thread specifically about AWA:
  https://community.visma.com/t5/Forum-in-Visma-eAccounting/Automatische-Winstaangifte-AWA/m-p/706107
  (found via search, not fetched in full this pass — worth reading for current customer sentiment/status of
  AWA from the software-vendor side).
- Visionplanner (Visma brand) has an open Front-End Developer role:
  https://www.visionplanner.com/werken-bij/front-end-developer — role serves "online platform for accounting
  firms in NL/BE." Stack not confirmed this pass — worth a direct fetch follow-up; Visma group is large and
  polyglot so this is not guaranteed Vue.

### AFAS — major Dutch business-software vendor (accounting/HR/ERP), SBR-adjacent
- Live Front-End Developer vacancy: https://dev.afas.nl/vacatures-2/front-end-developer — snippet describes
  "creating attractive interfaces... front-end of websites and mobile applications." Stack not confirmed
  this pass (AFAS is known in the wild to use a proprietary/other-JS stack historically — needs a direct
  check, do not assume Vue).

## Government-side software developer channel (context, not a company lead)

- Douane Nederland runs a formal developer-support channel for third-party customs-declaration software
  vendors: "Ondersteuning aan ontwikkelaars douaneaangiftesoftware" — free registration via Nationale
  Helpdesk Douane (NHD) gives access to a "Producten- en Dienstencatalogus" for developers.
  Entry points (direct belastingdienst.nl URL 404'd, use these instead):
  - https://www.douane.nl/onderwerpen/aangiftesystemen/informatie-voor-softwareontwikkelaars/
  - https://nh.douane.nl/softwareontwikkelaars/ (registration: https://nh.douane.nl/softwareontwikkelaars/aanmelden/)
- This confirms an active, government-run ecosystem of external software vendors building customs
  declaration software against Douane's schemas — i.e. exactly the pool the Alliantie Douane Software
  member list represents. Not a lead itself, but useful as a talking point / credibility anchor when
  approaching alliance members ("your peers on the NHD developer program are all mid-migration to DMS 4.0").
- evofenedex also maintains its own directory of Dutch customs-software vendors:
  https://www.evofenedexbedrijvengids.nl/site/douane-software (not crawled in full this pass — likely
  overlaps with/extends the Alliantie Douane Software member list; worth cross-referencing in a follow-up).

## Dry wells (tried, nothing usable)

- "Pincvision vacature frontend developer Vue.js" — no Pincvision-specific hit, only generic Vue job-board noise.
- "Descartes Systems Netherlands vacature frontend developer" — no NL-specific role found.
- "AEB customs software vacature developer Nederland" — AEB Amsterdam LinkedIn jobs page exists (10 roles)
  but not individually inspected; AEB's own "develop software" page showed 0 open jobs at fetch time.
- "EUCDM migratie ontwikkelaar vacature douane" (Dutch) — no results specific to EUCDM hiring.
- "SBR OR Digipoort salarissoftware vacature frontend developer Vue" — no vendor-specific hit.
- "douane webportal ontwikkelaar vacature Vue.js OR React Nederland" — generic job-board noise only.
- "Nextens vacature frontend developer Vue.js" — no Nextens-specific hit.
- "Informer.nl vacature developer Vue formulieren software" — no Informer-specific hit.
- "freight forwarder Nederland klantportaal ontwikkelaar Vue vacature douane" — no specific hit, only DSV
  generic freight-forwarder (non-tech) roles.
- "complex forms OR XSD to form customs declaration Vue upwork freelance project" — only generic Upwork
  category pages (Vue.js developers, form-development freelancers, XSLT specialists), no live specific gig
  found; Upwork listings are not reliably indexed/mirrored outside login, consistent with the brief's note
  that Upwork is login-walled.
- "AEB SE Vue.js Angular React frontend developer job LinkedIn customs software" — no AEB-specific hit.
- "Riege Software Scope Nederland vacature developer Vue frontend DMS" — no Riege-specific hit.
- "Stream Software douane vacature developer frontend Vue Enschede" — no Stream-specific hit (note: Stream
  is Antwerp-based, not Enschede — query had wrong city, worth redoing without city constraint).
- Direct fetch attempts that 404'd (page moved/stale since indexing): AEB developer page tools list,
  softpak progress-developer PHP-professionals listing, Fiton douane-management vacature page (was a product
  page not a job page), toegankelijkheidsverklaring.nl/register/17776, Pincvision careers guessed URL,
  Gateway software-developer vacancy guessed URL, Belastingdienst software-engineer-douane vacancy guessed
  URL, werkopschiphol Cargonaut frontend listing, belastingdienst.nl douaneaangiftesoftware page (moved to
  douane.nl).

## Follow-ups worth doing in a future pass (not completed this session)

1. Fetch https://community.visma.com/t5/Forum-in-Visma-eAccounting/Automatische-Winstaangifte-AWA/m-p/706107
   in full — likely reveals current (post-2022) status of AWA from the vendor-integration side, and possibly
   names more accounting-software vendors who integrated it.
2. Direct-visit (not search) the following vacancy indexes, since guessed deep-links repeatedly 404'd:
   gateway.nl/nl/vacatures/, pincvision.com/vacancies, informer.nl (careers section unknown URL),
   nextens.nl (careers section unknown URL), aeb.com Amsterdam LinkedIn jobs (10 roles unreviewed).
3. Cross-reference https://www.evofenedexbedrijvengids.nl/site/douane-software against the Alliantie Douane
   Software member list to find any additional named vendors not already captured.
4. Confirm current frontend stack for Cargonaut's Frontend Developer role and AFAS's Front-End Developer
   role directly (both were found but stack unconfirmed this pass).
5. Verify the claim that Belastingdienst "discontinued" AWA — this materially changes how the AWA precedent
   should be pitched (dead program to reference historically, vs. a program that might be revived/adjacent
   work still happening under a different name).
