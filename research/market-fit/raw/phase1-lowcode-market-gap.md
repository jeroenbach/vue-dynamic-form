# Phase 1 — Form-builder / low-code market gap research

Angle: business-side market size, pricing benchmarks, where low-code hits walls, evidence
of demand for developer-first self-hosted white-label form engines.

Date of research: 2026-09-30. Method: WebSearch (8-12+ queries) + WebFetch on primary pages.

## Market size / growth (low confidence on exact numbers — wildly divergent across firms, treat as
directional only, useful for narrative not for precise citation)

**Online form builder software market:**
- Estimates for 2026 range from $696M (Global Market Statistics) to $3.8B (DataIntelo, 2025 valuation)
  to $2.53B (Verified Market Reports, 2025 valuation) to $0.76B (Business Research Insights).
- CAGR estimates: 12% (2025-2033, HTF), 9.8% (through 2035), 10.1% (through 2034), 6.0% (2026-2032, QYResearch),
  14.2% CAGR 2026-2033 per one Apiary-hosted report.
- Sources are mostly paid market-research shops of dubious rigor (openpr, businessresearchinsights,
  marketresearchintellect, dataintelo) — treat any single number as noise, but the *convergence* on
  "high single digit to low double digit CAGR, several hundred million to low billions USD" is a fair
  directional claim.
- https://www.htfmarketintelligence.com/report/global-online-form-builder-software-market
- https://www.globalmarketstatistics.com/market-reports/online-form-builder-software-market-15717
- https://www.businessresearchinsights.com/market-reports/online-form-builder-software-market-120101
- https://dataintelo.com/report/global-online-form-builder-software-market

**Low-code platform market (much bigger, much faster-growing, and a better-covered category):**
- 2026 size estimates: $31.6B (Mordor Intelligence) / $65B (attributed to Gartner) / $48.91B (Fortune
  Business Insights) / $49.8B (Persistence Market Research) / $44.6B (Grand View Research) / $66.2B
  (The Business Research Company).
- CAGR: 20.6% (2025-2030, Mordor), 26.1% (2022-2028, attributed to Gartner), 29.1% (through 2034, Fortune
  Business Insights), 25.1% (2026-2033, Persistence), 32.7% (through 2030, TBRC).
- Consistent theme across every source: double-digit to high-20s% CAGR, no source disagrees on
  direction. Good for "the category is large and growing fast" framing; bad for citing a specific
  number with confidence.
- https://blog.tooljet.com/low-code-statistics-2026/
- https://straitsresearch.com/press-release/global-low-code-development-platform-market-analysis
- https://www.fortunebusinessinsights.com/low-code-development-platform-market-102972
- https://www.grandviewresearch.com/industry-analysis/low-code-application-development-platform-market

## Pricing benchmarks (primary/aggregator sources, higher confidence — these are closer to real pricing pages)

**Typeform** (source: aggregator summaries of Typeform's own pricing page, cross-checked across
multiple 2026 pricing-roundup sites so directionally reliable):
- Basic $28/mo, Plus $56/mo, Business $91/mo (annual billing); month-to-month costs more.
- Response caps: Basic 100/mo, Plus 1,000/mo, Business 10,000/mo. Caps reset monthly, don't roll over,
  apply account-wide across all forms. Hitting the cap makes forms **private** until reset/upgrade —
  i.e. the form silently stops collecting data on a live campaign.
- Free plan: cut from unlimited to **10 responses/month** in Feb 2026 — a real, recent degradation of
  the free tier that pushes small users/agencies toward paid or alternatives.
- Growth/Talent bundles $119-$266/mo; Enterprise quote-only.
- Branding removal only from Plus tier up — free/lowest tier is watermarked.
- https://www.jetadmin.io/blog/typeform-pricing/
- https://formnx.com/typeform-pricing

**Jotform:**
- Standard plans Bronze $39/mo up to Gold $129/mo.
- White-labeling (custom domain, no Jotform branding) is **Enterprise-only**, custom quote via sales.
- Enterprise also gates: multi-user access, SSO, dedicated server environment.
- i.e. the moment an agency/ISV wants true white-label + a dedicated environment, they're forced off
  self-serve pricing into an enterprise sales process — a friction point a self-hosted competitor can
  undercut on.
- https://www.jotform.com/answers/12988791-what-is-the-pricing-for-white-labeling
- https://www.jotform.com/enterprise/pricing/

**Formstack:**
- Forms $83/mo (1 user), Suite $250/mo, Enterprise custom (uncaps forms/submissions/seats, adds
  HIPAA/GDPR compliance + BAA + SSO).
- Offers white-label/embedded solutions for forms + doc gen + e-signature.
- **Formstack has no self-hosted option at any tier, including Enterprise.** This is stated explicitly
  by a competitor review site (formbricks) — worth independent verification, but if true it's a clean
  gap: any org with an on-prem/data-sovereignty requirement cannot use Formstack regardless of budget.
- https://formbricks.com/blog/formstack-pricing
- https://www.formstack.com/pricing

**Microsoft Forms — concrete "hits a wall" evidence (this is the strongest, most citable material
found this session):**
- Branching logic can *only* be driven off a Choice-type field — you cannot branch on a Text field
  condition at all.
- Branching is **forward-only**: branching "backward" to an earlier question breaks the flow and can
  skip straight to the end/submit button instead of behaving like a real loop or revisit.
- **No loop functionality** — a question can only be filled once, ruling out repeatable-section patterns
  (e.g. "add another dependent," "add another line item") entirely.
- Reviewers describe conditional logic as "basic compared to other survey platforms."
- This maps almost one-to-one onto the exact capabilities vue-dynamic-form already has (choice branches,
  repeatable minOccurs/maxOccurs sections, arbitrary field-type conditions via computedProps) — good
  concrete talking point for "here's what mainstream low-code tools structurally cannot do."
- https://plumsail.com/blog/microsoft-forms-branching-guide/
- https://support.microsoft.com/en-us/forms/use-branching-logic-in-microsoft-forms
- https://www.positioniseverything.net/use-branching-logic-in-microsoft-forms-complete-guide/

## Direct competitors / adjacent products (important — these validate the niche exists commercially)

**Form.io — closest direct analog to "self-hosted, white-label, embeddable form engine for ISVs"
(strongest single piece of evidence found this session):**
- Delivered as Docker containers, self-hosted in the customer's own environment against their own DB.
- Configuration-based pricing, explicitly **not** usage-based ("we don't price per form, submission,
  end-user, form builder, developer, API call... so you never have to worry about ballooning costs as
  you scale") — a direct jab at Typeform/Jotform/Formstack-style metered pricing.
- Self-hosted Enterprise API server starts around **$330/mo per environment**; typically need 3
  environments (dev/test/prod); optional PDF server add-on; optional "Enterprise Form Building Module"
  if you want in-app form building.
- **Claims 90% of their customers opt for enterprise self-hosting** — if accurate, this is the single
  best piece of quantitative evidence in this research that the self-hosted/data-sovereignty need is
  not a niche edge case but the *majority* preference among paying form-engine customers.
- Case study cited (Form.io's own marketing, so treat as promotional, not independently verified): a
  regulatory-industry platform ("Bursting Silver") white-labeled Form.io, signed "dozens of new
  clients," "increased revenue by 25%" — exactly the ISV embed use case this research angle targets.
- Named use cases: business process workflow apps, multi-tenanted SaaS platforms, orgs needing
  standardized forms across departments.
- https://form.io/enterprise-self-hosting/
- https://form.io/configuration-based-pricing/
- https://form.io/features/self-hosted-forms-for-enterprise/
- (their B2B SaaS white-label comparison page 404'd on fetch: https://form.io/embedded-forms-b2b-saas-white-label-comparison/
  — could not verify content beyond the search snippet, worth retrying later or via Google cache)

**SurveyJS — good pricing-model analog for a Vue-native competitor to consider copying:**
- Developer-license model: **one-time purchase** per developer, grants perpetual use of the libraries
  in your app, first 12 months of updates/support included, then presumably a renewal for continued
  updates.
- Tiers seen: Essential (free), Basic (€499 one-time). Volume discount up to 35% for 2+ licenses of the
  same product.
- Explicitly markets "white-label drag-and-drop form builder," full UI/branding customization, and a
  **free MIT-licensed renderer** (separate from the paid builder/creator/dashboard tools) — i.e. they
  give away the runtime and charge for the authoring tool, which is a pricing pattern worth considering
  for vue-dynamic-form (core engine MIT, paid template/builder).
- Royalty-free distribution, no per-response fees — same anti-metering positioning as Form.io.
- https://surveyjs.io/pricing
- https://surveyjs.io/licensing

**Open-source self-hosted form builder landscape (competitive/positioning context):**
- OpnForm — open-source, no-code builder, embeddable, self-hostable.
- HeyForm — open-source conversational form builder, self-hostable.
- Tripetto — open-source flowchart-style builder; **form runners are open source and can be self-hosted
  or embedded into any web application** — closest open-source analog to "embed a form runtime in your
  own app."
- Form.io open-source server — Node.js + MongoDB, OSL-3.0 licensed, forms as JSON schema (the commercial
  self-hosted enterprise tier above is the paid version of this).
- None of these are XSD-semantics-driven or Vue-native with vee-validate-grade validation depth — this
  remains a plausible differentiation gap, though not verified against every competitor's validation
  engine in depth this session.
- https://fomr.io/blog/best-open-source-form-builders
- https://extendedforms.io/blog/7-best-open-source-form-builders-in-2026-self-hosted

**Schema-driven form libraries (closer technical peers, React-centric):**
- react-jsonschema-form (RJSF): 41,402 weekly downloads, 14,400 GitHub stars — the dominant player,
  React-only.
- JSON Forms: supports React/Angular/Vue, much smaller (310 weekly downloads, 2,243 stars per npmtrends
  figure cited in search results — plausible but unverified directly).
- Vue-specific schema-form libraries exist but are smaller/less maintained: vue-jsonschema-form (Vue2
  port of RJSF), vue-form-generator (5,881 weekly downloads, 3,000 stars), vue-json-schema-form.
- None of these claim XSD-fidelity restriction semantics (pattern/enumeration/totalDigits/min-max
  inclusive/exclusive) as a first-class concept — vue-dynamic-form's XSD-inspired validation set is a
  genuine differentiator versus generic JSON-Schema-driven tools, which usually only get ajv-level
  JSON Schema keywords, not XSD's fuller restriction vocabulary.
- https://form.io/json-schema-forms-formio-rjsf-jsonforms-surveyjs-compared/
- https://npmtrends.com/jsonforms-vs-react-jsonschema-form-vs-vue-form-generator-vs-vue-form-json-schema-vs-vue-json-schema

**XSD-to-form generation — proves the underlying idea (schema drives the form) has developer pedigree,
mostly old/dormant projects, which is itself informative (nobody has taken this current/production-grade
into the JS ecosystem recently):**
- GitHub: davidmoten/xsd-forms ("Generates web forms from xml schema documents (xsd)") — appears old/dormant.
- GitHub: ruoso/xsdform-js ("Javascript library to generate HTML Forms from XML Schema Definition files") — old/dormant.
- Academic paper: "Model-Based User Interface Design for Generating E-Forms in the Context of an
  E-Government Project" (arxiv 2003.08172) — confirms e-government e-forms-from-schema is an established
  research area, not a novel idea, but also confirms nobody has shipped a maintained modern (Vue3,
  vee-validate-based) open-source implementation of it — a gap.
- https://github.com/davidmoten/xsd-forms
- https://github.com/ruoso/xsdform-js
- https://arxiv.org/pdf/2003.08172

## Where low-code hits walls generally (softer, narrative evidence — vendor content, but consistent
across many unrelated vendors so probably reflects real pain, not just marketing)

- Vendor-lock-in is a widely repeated theme across independent-sounding blog posts (bettyblocks,
  appbuilder.dev, appian, outsystems, refine.dev, planetcrust): proprietary APIs, no code ownership,
  hard-to-predict pricing at scale, migrating means "rebuilding from scratch." Multiple *low-code
  vendors themselves* publish "how to avoid lock-in" content, which is a tell that it's a live sales
  objection they have to pre-empt.
- Zoho community: explicit, named developer complaint that **Zoho Creator has no native multi-page/
  wizard form support** — cited as blocking real use cases (employee onboarding, loan applications,
  patient intake, vendor registration) — a good concrete quote-able pain point, low-code platform
  users have to build workarounds for something vue-dynamic-form does natively (multi-step wizard as
  first-class metadata).
- https://help.zoho.com/portal/de/community/topic/stop-the-workarounds-we-need-native-multi-step-forms
- General reviewer complaint on Jotform: "forms get more glitchy the more complex they are made."
- Could not find strong first-person Reddit/HN threads specifically complaining about
  validation-depth/branching-depth limits in Typeform/Jotform in the time available — several targeted
  reddit/HN site: searches came back empty or off-topic (see Dead ends below). The Microsoft Forms and
  Zoho Creator material above is the strongest concrete "hits a wall" evidence found.

## Data sovereignty / EU hosting (directly relevant to NL/EU positioning)

- A vendor-comparison/scan site (meetergo "Sovereignty Scan") makes a sharp, useful distinction:
  Typeform is Spanish/Barcelona-founded (an "inherent" GDPR-friendly signal to buyers) **but** Typeform
  Inc. (US entity) appears as a subprocessor, hosting runs on AWS Ireland, and third-country transfer
  status is "ambiguous" — a TIA (transfer impact assessment) is recommended for GDPR-strict setups
  despite EU hosting.
- Jotform: EU data residency (Frankfurt, on Google infrastructure) is available but **only on Enterprise
  plans**, and Jotform is US-headquartered, so CLOUD Act exposure applies "regardless of where the data
  physically sits" per this source.
- Key framing worth reusing: "a company hosting on AWS Frankfurt and answering to a Californian parent
  is not the same as a [EU] company on EU-only infrastructure under EU ownership, as the CLOUD Act
  applies to the parent corporate entity, not the data centre." This is exactly the wedge a Dutch/EU
  freelancer offering a self-hosted, EU-owned engine could use against every major US-parented
  incumbent (Typeform, Jotform, Formstack, Microsoft Forms all have this exposure to some degree).
- Caveat: meetergo is itself a vendor selling into this exact positioning, so their "scan" is not neutral
  — treat the CLOUD Act argument as legally-plausible narrative, not a verified legal opinion.
- https://scan.meetergo.com/en/vendors/typeform
- https://tally.so/help/best-gdpr-form-builders
- https://www.jotform.com/help/871-how-to-store-your-data-on-eu-servers/

## Dutch/EU-specific findings (relevant for "why NL/EU standards-heavy domains" framing)

- **Logius** (Dutch government digital-services agency) maintains open standards for government data
  exchange, including **Digikoppeling** (message-exchange standards between government orgs) and
  **XBRL** (used for Dutch tax filings, annual reports, credit reporting).
- **Digipoort** (the Dutch government's B2G digital channel) is used for BTW (VAT) filings, ICP
  declarations, income/corporate tax, and wage tax declarations by software vendors. Digipoort web
  services exchange SOAP messages whose structure is **specified in XSD** — i.e. real, current,
  production Dutch government infrastructure is XSD-schema-driven today. Software vendors either
  integrate directly or go through intermediary service providers; a free ODB (Ondersteuning Digitaal
  Berichtenverkeer) developer account gives access to XML structure specs and a validation test service.
  This is concrete evidence that XSD fluency has real, current commercial value in the Dutch B2G
  software market (accounting/payroll/tax software vendors integrating with the Belastingdienst).
- Mendix (Dutch-founded low-code platform, now Siemens-owned) is cited as the dominant Dutch low-code
  brand for government — "4-8x faster than traditional development," a maatwerk (custom) app that takes
  3-6 months traditionally takes 2-8 weeks in low-code per a Dutch low-code agency's marketing claim
  (unverified, promotional).
- Dutch government IT commentary (from a Dutch low-code agency's own content, so promotional bias
  likely): "60-80% of budgets spent on maintenance of legacy IT," infrastructure "unoverzichtelijk"
  (unwieldy) — narrative color, not hard data.
- code.overheid.nl exists as a Dutch-government-hosted open-source code-sharing platform for government
  bodies, free to use, hosted on Dutch government infrastructure — indicates institutional appetite for
  self-hosted/sovereign tooling at the Dutch government level generally.
- https://www.logius.nl/domeinen/gegevensuitwisseling/digipoort/documentatie/handleiding-aansluiten-voor-bedrijven
- https://odb.belastingdienst.nl/dienstverlening-aan-softwareontwikkelaars-en-gegevensleveranciers/
- https://www.houseoflowcode.com/nl/low-code/low-code-overheid-digitalisering-in-de-praktijk
- https://code.overheid.nl/

## Customs/insurance vertical color (weaker signal, mostly named vendors not pain points)

- Dutch customs declaration software is a real, active vendor market: Descartes, MIC (MIC-CUST),
  Pincvision, AEB, Softpak, Fiton all sell customs-declaration software integrating with the Dutch
  DMS (Declarations Management System), NCTS, ECS/ICS/EMCS European customs procedures. These are
  established enterprise vendors, not evidence of an underserved gap by themselves — but confirms
  "customs" as a real, schema-heavy, compliance-heavy Dutch vertical with existing paying software
  budgets, consistent with the CONTEXT's framing of customs as a target domain.
- Did not find a specific complaint/gap about *form-building* specifically within customs software
  (these vendors sell full declaration platforms, not a form engine ISVs embed) — this is a dead end
  for "customs company complains about their form tool," but confirms the vertical exists and has
  XSD/XML-heavy data interchange (Digipoort SOAP/XSD as above) as its lingua franca.

## Business-model pattern evidence (freelancer → productized/resellable service)

- Generic "SaaS reseller" content confirms a known playbook: white-label a platform, agencies retail
  at ~$97-297/mo per client account, agency does tier-1 support, vendor does infra/tier-2. This is
  useful as a template for how vue-dynamic-form (or a hosted/wrapped version of it) could be positioned
  for resale through agencies, though none of this is specific evidence of demand — it's generic
  playbook content, not market validation.
- Nothing found specifically validating "developer sells a form-engine license to agencies who resell
  to their own clients" as an existing proven niche distinct from the Form.io/SurveyJS examples already
  covered above.

## Dead ends / low-yield searches (recorded so they aren't repeated)

- `site:news.ycombinator.com form builder embed white label agency` — returned generic form-builder
  Show-HNs, nothing specifically about white-label/embed pain points from an agency/ISV perspective.
  The most relevant hit: HN thread "Show HN: Typeform was too expensive so I built my own forms" (a
  solo web-design agency owner) — good anecdote but didn't fetch the full thread for verbatim quotes;
  worth a follow-up fetch of https://news.ycombinator.com/item?id=44518898 if deeper agency-pain quotes
  are needed later.
- `site:reddit.com "form builder" self-hosted white label developers embed our app` — zero relevant
  Reddit results; Google's site: indexing of Reddit is generally poor for long multi-term queries, an
  agent with live Reddit search/API access would do much better here.
- `reddit "low code" complex validation "hits a wall" custom code escape hatch` — no matching Reddit
  threads; general low-code/escape-hatch web content only.
- `reddit jotform typeform "conditional logic" limitations complex forms complaint` — no Reddit threads
  surfaced; got generic feature-comparison content instead.
- Form.io's dedicated "Embedded Forms for B2B SaaS: White-Label Builder Comparison" page
  (https://form.io/embedded-forms-b2b-saas-white-label-comparison/) 404'd on WebFetch despite appearing
  in search results — may have been retired/moved; retry via Google cache or Wayback Machine if this
  page's content becomes important later.
- Could not find a credible, non-promotional, hard number for "how many agencies/ISVs currently embed
  a third-party form engine white-label" — this remains an assumption, not a verified market-sizing
  fact, across all sources checked this session.

## Overall read for the strategy

The strongest, most defensible claims from this session are: (1) Form.io's self-hosted enterprise tier
exists, is priced in the hundreds of dollars per month per environment, and per their own claim 90% of
paying customers choose it — real market validation that self-hosted/white-label form engines have
commercial demand today, not just theoretical demand; (2) Formstack (a major incumbent) has **no**
self-hosted option at all, and Jotform/Typeform gate white-labeling and EU-residency behind
expensive Enterprise tiers with US-parent CLOUD-Act exposure regardless — a real, named gap between
"mid-market SaaS form tools" and "true self-hosted EU-sovereign white-label"; (3) Microsoft Forms and
Zoho Creator have well-documented, structural (not just UX) limitations in branching/looping/multi-step
support that vue-dynamic-form's metadata model already solves natively; (4) Digipoort/Logius confirm
XSD/XML-schema-driven government-business data exchange is live, current Dutch infrastructure, giving
the "generate forms from XSD" pitch concrete domestic relevance beyond a generic technical curiosity.
