# Phase 2 raw notes: live freelance/job-board postings for vue-dynamic-form fit

Research date: 2026-09-30. Angle: publicly indexed freelance/contract postings (freelance.nl, hoofdkraan.nl,
freelancer.nl, LinkedIn jobs, Indeed NL, werkzoeken.nl, Upwork/Toptal mirrors) where the vue-dynamic-form
library (repeatable sections w/ per-item conditional logic, choice branches, XSD-style restriction validation,
multi-step wizards, template-swappable rendering) would be a decisive advantage.

## Headline finding

Dutch government "digital forms developer" freelance roles almost never say "Vue.js" — they say **iProx**,
**TripleForms**, or **Open Formulieren**, because the municipality/province has already committed to one of
those platforms and is hiring platform operators, not framework generalists. So a literal keyword search for
"Vue.js" + "dynamic form"/"wizard"/"formulieren" on job boards returns either (a) generic Vue.js frontend roles
with no forms specificity, or (b) forms roles with no Vue specificity. The decisive-advantage angle therefore
works better as **outbound to intermediaries and product companies** (recruiters who source these roles
repeatedly, and vendors building form products for government) than as **inbound reply to a job ad**. Logged
below both the live postings found and the intermediary/partner targets they point to.

Almost all Dutch freelance-board results for plain "Vue.js" queries are archived/closed (2020-2024 postings
still indexed and ranking). Search engines heavily favor freelance.nl's SEO-optimized archived pages, so dates
must always be verified by fetching the page, not trusted from the snippet.

## Live / recent postings found

### 1. Ontwikkelaar Digitale Formulieren — Provincie Noord-Brabant (via GreenPepper)
- https://greenpepper.nl/vacatures/ontwikkelaar-digitale-formulieren-rc146104/
- Also listed at https://www.freelance.nl/opdracht/1180677-ontwikkelaar-digitale-formulieren and
  https://www.einvigi.com/en/opdrachten/freelance-ontwikkelaar-digitale-formulieren (einvigi copy 404s)
- Posted ~20-08-2026, deadline stated as 28-08-2026, page still shows "Status: Open" as of fetch (2026-09-30) —
  deadline may be stale on the recruiter mirror; treat with caution, contact recruiter directly rather than
  relying on the deadline field.
- Client: Provincie Noord-Brabant ('s-Hertogenbosch), hybrid, 32 hrs/week, €115/hour, contract 14-09-2026 to
  27-02-2027 (extendable 2×6 months).
- Platform: **iProx.forms + iProx.web** (not Vue). 300 forms to rebuild/newly develop.
- Requirements verbatim-relevant: "complex formulierlogica, validaties en workflows" (complex form logic,
  validations, and workflows), WCAG 2.2, DigiD/eHerkenning, ESB integrations, GDPR, 5+ yrs forms experience.
  This phrase is almost a direct description of what vue-dynamic-form solves architecturally — just on a
  different, closed platform.
- Contact: Zoë Gidding, zoe.gidding@greenpepper.nl, +316 34 940 271 / info@greenpepper.nl, 030-249 66 96.
- Read as: not a direct fit (no Vue), but GreenPepper/Zoë Gidding is a recruiter who repeatedly sources exactly
  this profile ("digitale formulieren ontwikkelaar" for provinces/municipalities). Worth a direct email
  introducing the library as evidence of forms-logic expertise, asking whether she has Vue-based mandates too.

### 2. Digitale Voorzieningen – TriplEforms ontwikkelaar — Gemeente Amsterdam (via de Publieke Partner)
- https://depubliekepartner.nl/digitale-voorzieningen-tripleforms-ontwikkelaar/
- Deadline 09-03-2026 08:00 — **closed** (well before today). Detachering/ZZP, 24-36 hrs/week, €103/hour,
  7-month contract from 01-04-2026 (extendable). Requires 3+ yrs TripleForms + G4-municipality experience.
- Platform: TripleForms (not Vue).
- Read as: dry well for direct application (closed, wrong platform), but confirms Amsterdam pays ~€103/hr for
  forms-with-complex-logic roles and recycles this role regularly via de Publieke Partner. Worth registering
  with the broker for the next opening.
- de Publieke Partner's live ZZP-overheid listing page (https://depubliekepartner.nl/category/zzp-opdrachten-overheid/)
  had 10 open roles as of fetch, none forms/Vue-related right now (Power BI, grondzaken, sociotherapeut, etc.) —
  confirms this broker cycles government ZZP roles broadly, forms roles included, so it's a channel to sit on,
  not a single-shot lead.

### 3. Business Analist Online Formulieren — Gemeente Den Haag
- https://www.freelance.nl/opdracht/1155414-business-analist-online-formulieren
- Posted 16-02-2026, archived by fetch time. 32-40 hrs/week, 3-month initial contract, on-site min 1 day/week
  (Thursdays). Explicit WCAG + "logisch, toegankelijk, gebruiksvriendelijk en technisch correct" (logical,
  accessible, user-friendly, technically correct) form design language, focus on FO's (functional designs) not
  hands-on dev. ZZP/DGA explicitly prohibited (wants integration into the team) — so not freelance-eligible in
  its exact form even when live.
- Read as: dry well for a developer angle (this was a business-analyst role, not dev, and zzp was excluded) but
  confirms Den Haag is actively iterating on forms UX/logic in 2026 — worth watching for a follow-on dev role
  from the same municipality.

## Partner / prospect targets (not job postings, but decisive-advantage subcontracting targets)

### 4. Shift2 B.V.
- https://www.shift2.nl/ , https://www.shift2.nl/formulieren , https://www.freelance.nl/profiel/470106-shift2-bv
- Registered on freelance.nl since 10-06-2025 (young company). Builds a form product ("Formulieren") plus
  subsite, "Mijn Portaal", election systems, civil-affairs modules etc. explicitly for municipalities,
  waterschappen, and provinces — direct product-market overlap with Open Formulieren. Named municipal clients:
  Ooststellingwerf, Weststellingwerf, Opsterland, Heemskerk.
- Having an active freelance.nl profile suggests they're open to bringing in freelance specialists.
- Contact: 030-2271282, https://www.shift2.nl/contact
- Read as: a genuine partner/subcontracting prospect — a young vendor building exactly the kind of forms product
  the library targets, for the same buyer (Dutch local government), small enough that a specialist Vue/forms
  freelancer could plausibly get engaged for the harder logic pieces.

### 5. Maykin Media — Open Formulieren Product Owner hire
- Source: https://nl.indeed.com/viewjob?jk=47c6ab239b15fda7 (401'd on direct fetch, content via search snippet),
  https://maykinmedia.nl/nl/portfolio/project/open-formulieren/
- Maykin is hiring a (permanent, not freelance) Product Owner for Open Formulieren — a growth signal: they are
  investing in scaling the product's community/adoption right now (2026), which is the moment to re-raise the
  known per-item-conditional-logic-in-repeating-groups gap (open-forms#2441) as a partnership/consulting
  conversation, not a job application.
- Not a freelance lead itself; logged as timing evidence for outreach to Maykin.

### 6. NL Design System — Developer Relations Engineer / Specialist Webtoegankelijkheid (ICTU)
- https://www.freelance.nl/opdracht/1163386-developer-relations-engineer (posted 13-04-2026, deadline
  16-04-2026, archived, **explicitly not open to freelancers/zzp'ers**)
- https://www.freelance.nl/opdracht/1111357-specialist-webtoegankelijkheid-nl-design-system (posted 22-01-2025,
  16 hrs/week, archived)
- Both roles reference component development across Angular/React/**Vue.js**, WCAG/WAI-ARIA, and open-source
  community contribution for the Dutch government-wide design system.
- Read as: dry well for direct freelance application (roles are either closed or staff-only) but strong
  confirmation that WCAG-compliant, framework-spanning component work is an active, funded government line
  item — relevant to the "WCAG + NL Design System template" productized offer even without a matching job ad
  right now.

## Recurring-employer pattern (ICTU)

ICTU shows up repeatedly as an employer/broker for Vue.js citizen-facing government portals: Persoonsgebonden
Budget 2.0 (PGB) portal migration to Vue (Jan 2022, closed), Leeroverzicht.nl medior Vue.js role (Jul 2023,
closed), NL Design System Developer Relations Engineer (Apr 2026, closed/staff-only). None open today, but the
cadence (roughly one new Vue.js posting every 12-18 months) suggests periodically re-checking
https://www.freelance.nl for new ICTU Vue postings is worth doing rather than a one-off search.

## Dry wells (searched, nothing usable)

- site:linkedin.com/jobs queries for Vue + "form builder"/"dynamic form" — WebSearch does not appear to index
  LinkedIn's own job listings; only returns unrelated blog content. Would need direct LinkedIn Jobs search
  (not available via WebSearch) or the claude-in-chrome tool logged into LinkedIn to check this channel
  properly — not attempted this session.
- Upwork / Toptal / Freelancer.com / Braintrust / Contra / Gun.io — all login-walled or dynamically rendered;
  WebSearch only surfaces marketing/landing pages ("hire Vue.js developers"), never individual live project
  postings. No mirrored/indexed individual postings found for "Vue.js" + "dynamic form"/"conditional logic
  form"/"wizard". This channel needs either an Upwork account+search or a paid job-alert scraper; not doable
  with WebSearch alone.
- RemoteOK — general Vue.js remote roles exist but none specific to forms/wizards at time of search.
- Reddit/forum threads recommending a Vue form library for repeatable/conditional-logic forms in 2025-2026 —
  search surfaced only blog/marketing comparison articles (SurveyJS, Laraform, Vue Formulate), not actual forum
  threads Jeroen could reply to. No live Reddit/Vue Discord/Vueland thread identified this session.
- SIVI AFD/UPA insurance-sector Vue.js freelance postings — no results; general Vue.js frontend roles only, no
  insurance-forms specificity surfaced.
- Digipoort/customs (EUCDM) XSD freelance developer postings — no live matches beyond generic douane/customs
  roles with no XSD-forms specificity; the Digipoort XSD material found was GitHub reference schemas, not job
  postings.
- hoofdkraan.nl — results were either generic Vue.js maintenance gigs (WordPress filter, configurator) or very
  old/generic; nothing forms-specific and live.
- werkzoeken.nl — general Vue.js vacancy listings only, no forms specificity, mostly permanent roles not
  freelance.
- "Open Formulieren" + "freelance ontwikkelaar" — no freelance developer postings found for Open Formulieren
  itself (Maykin's own hiring for it right now is a permanent PO role, not freelance/contract dev work).

## Sources referenced (full list)

- https://greenpepper.nl/vacatures/ontwikkelaar-digitale-formulieren-rc146104/
- https://www.freelance.nl/opdracht/1180677-ontwikkelaar-digitale-formulieren
- https://www.einvigi.com/en/opdrachten/freelance-ontwikkelaar-digitale-formulieren (404)
- https://depubliekepartner.nl/digitale-voorzieningen-tripleforms-ontwikkelaar/
- https://depubliekepartner.nl/category/zzp-opdrachten-overheid/
- https://www.freelance.nl/opdracht/1155414-business-analist-online-formulieren
- https://www.shift2.nl/ , /formulieren , /voor-gemeenten , /voor-waterschappen , /subsite , /wat-we-doen
- https://www.freelance.nl/profiel/470106-shift2-bv
- https://nl.indeed.com/viewjob?jk=47c6ab239b15fda7 (Maykin PO Open Formulieren, via search snippet — direct
  fetch 401'd)
- https://maykinmedia.nl/nl/portfolio/project/open-formulieren/
- https://www.freelance.nl/opdracht/1163386-developer-relations-engineer (NL Design System, ICTU)
- https://www.freelance.nl/opdracht/1111357-specialist-webtoegankelijkheid-nl-design-system
- https://www.freelance.nl/opdracht/959288-vue-front-end-ontwikkelaar (ICTU PGB 2.0, closed 2022)
- https://www.freelance.nl/opdracht/1043058-medior-vue-js-front-end-ontwikkelaar (ICTU Leeroverzicht, closed
  2023)
- https://www.freelance.nl/opdracht/1012391-net-ontwikkelaar-met-kennis-van-vue-js (closed 2022)
- https://www.freelance.nl/opdracht/1097658-vue-developer (hotel industry, closed 2024)
- https://www.freep.nl/opdracht/frontend-design-system-developer (Kadaster, Angular not Vue, closed)
- https://opennl.recruitee.com/ (OPEN.nl / NLX software group — permanent roles, no forms/Vue specificity)
