# Phase 1 raw notes: schema/metadata-driven form engine landscape

Research date: 2026-09-30. Angle: map SurveyJS, Form.io, FormKit, Formily, JSONForms,
react-jsonschema-form (RJSF), Uniforms, Vueform + adjacent XSD-form tooling; licensing,
pricing, paywalled features, Vue support, whitespace for a Vue-native XSD-semantics engine.

## Method notes
Ran ~14 WebSearch queries + 6 WebFetch pulls (pricing pages, product pages). Search API
returns AI-summarized snippets with source links, not raw page text in most cases — where a
WebFetch was done on the primary page, numbers are more trustworthy than search-snippet-only
claims. Flagged below.

---

## SurveyJS
- Site: https://surveyjs.io — Vue3, React, Angular, Knockout support (framework-agnostic core + bindings). JS/TS.
- Schema: proprietary JSON survey/form model (not JSON Schema, not XSD). Has its own metadata
  format for questions, panels, pages, logic (`visibleIf`, `expression`), matrix/panel-dynamic
  repeatable structures.
- License/pricing (from https://surveyjs.io/pricing, WebFetch verified 2026-09-30):
  - **Essential** — Free. Core Form Library only (no Survey Creator, no Dashboard/PDF).
  - **Basic** — $589 one-time / developer (€499), renewal $239/yr (€199). Adds Survey Creator
    (drag-drop visual builder).
  - **PRO** — $1,059 one-time / developer (€899), renewal $419/yr (€359). Adds Dashboard +
    PDF Generator.
  - **Enterprise** — custom, starts ~$2,359 license / $939 renewal. Priority support, TAM,
    code review sessions, custom feature dev, roadmap influence.
  - Per-developer perpetual license model (buy once, pay again only for updates/support after
    year 1 — classic "maintenance subscription" SaaS-adjacent-but-not-SaaS pricing).
  - Volume discounts up to 35% for multiple licenses.
  - Paywall boundary: **the visual form-builder UI, PDF export, and analytics dashboard are
    commercial; the core rendering/validation engine is free (MIT-ish, check exact license)**.
- Positioning: closest philosophical analog to what's being built — Vue support is real, not
  an afterthought. But schema is proprietary/survey-shaped (heavy on questions/panels/logic
  expressions), not standards-derived. No XSD/XML-schema story at all. Sells to product teams
  wanting a builder UI more than to devs wanting programmatic schema-from-standards.
- Source: https://surveyjs.io/pricing, https://surveyjs.io/faq/licensing

## Form.io
- Site: https://form.io — full platform: form builder + generated REST API + submission
  storage + workflow, not just a rendering library. Self-hosted or SaaS.
- Schema: proprietary JSON form schema (their own component tree format), not JSON Schema
  standard, not XSD.
- Framework support: renderer works with any JS framework via web components / vanilla JS
  bindings; Angular and React SDKs exist. Vue support is community/secondary, not a first-class
  advertised integration on their marketing pages (worth re-checking directly if Vue matters
  for competitive citation, but it did not surface as headline support in FormEngine/Form.io
  comparison pages).
- License: open-source **server/core is OSL-3.0** (Open Software License — a copyleft-ish
  license, NOT permissive MIT — worth noting since some devs specifically avoid OSL for
  commercial embedding).
- Pricing (from https://form.io/configuration-based-pricing/, WebFetch verified 2026-09-30):
  configuration/module-based, not per-seat:
  - API Server env: $330/mo; API Plus (audit logging, field-level encryption, SSL between
    containers): $660/mo
  - PDF Server: $330/mo; PDF Plus: $660/mo
  - Reporting UI module: $660/mo
  - Multi-tenant platform (10 tenants): $330/mo
  - Accessibility compliance module: $495/mo
  - Enterprise Form Builder module: $660/mo
  - Developer licenses: $2,640–$5,280/yr for 5–20 seats
  - Other search snippet (unverified, secondary source) cites SaaS starting ~$300/mo and
    self-hosted enterprise ~$330/mo/environment, 30-day trial, no free tier above OSS core.
  - G2 listing cites Form.io entry pricing "$100/mo" — conflicts with the $300-330/mo figure
    from Form.io's own configuration pricing page; treat the vendor's own page as authoritative,
    G2 number as possibly stale/promotional-tier.
- Paywall boundary: **the open-source core covers basic rendering + a bare API server; almost
  everything an enterprise actually wants (PDF, reporting, multi-tenancy, accessibility
  compliance, encryption-at-rest, audited logging) is a paid add-on module stacked
  independently** — this is a fairly aggressive unbundled pricing structure, frequently the
  subject of "this got expensive fast" sentiment in comparison articles (see form.io's own
  comparison content and third-party comparison blogs — did not find raw Reddit complaint
  threads, comparisons instead live on vendor-adjacent blogs like fomr.io, Form.io's own
  competitor-comparison pages, and G2).
- Source: https://form.io/configuration-based-pricing/, https://form.io/enterprise-self-hosting/,
  https://form.io/form-io-open-source-core-vs-enterprise/

## FormKit (+ FormKit Pro)
- Site: https://formkit.com — **Vue-first framework** (originated Vue 3 only); has since added
  a React runtime (`@formkit/react`) and Nuxt module, core is framework-agnostic with bindings.
  Confirmed via search: "@formkit/vue" and "@formkit/react" both exist as of 2026.
- Schema: FormKit's own JSON-serializable "FormKit schema" (Vue/HTML-template-shaped, not
  JSON Schema standard, not XSD). Not a standards-derived format — it's a component/prop tree.
- License: core FormKit is open source (MIT). **FormKit Pro is the commercial layer**: premium
  input components only (autocomplete, colorpicker, currency, datepicker, dropdown, mask,
  rating, slider, transfer list, unit — 10 paid inputs). Free inputs: repeater, toggle,
  toggle-buttons, taglist.
- Pricing (from https://formkit.com/pro, WebFetch verified 2026-09-30):
  - **Production**: $149 one-time payment, single domain.
  - **Enterprise**: starting $1,250 one-time, advanced features (volume/multi-domain, presumably).
  - Free during local development; pay only when shipped to a live domain — dev-friendly gating.
- Paywall boundary: **not schema/logic features — just a bundle of nicer input widgets**. The
  actual form engine (validation, schema execution, conditional logic, repeaters) is fully free
  and open source. This is meaningfully different from SurveyJS/Form.io, where paid tiers gate
  builder UI and platform infrastructure — FormKit gates UI components only.
- No XSD/XML-schema angle at all; no multi-step wizard-as-first-class-metadata story found in
  search (FormKit has step-based UI patterns but not XSD-derived occurrence/choice semantics).
- Source: https://formkit.com/pro, https://formkit.com/terms

## Formily (Alibaba)
- GitHub: https://github.com/alibaba/formily — 12.6k stars (star-history.com, 2026).
- Framework support: **React, React Native, Vue 2, Vue 3** — genuinely cross-framework at the
  core-engine level, one of very few libraries with real dual Vue+React parity.
- Schema: their own "JSON Schema applied for backend" / "JSchema for frontend" duality —
  describes itself as JSON-Schema-adjacent but is really a reactive-state-driven schema with
  Alibaba-specific extensions (effects, reactions, field linkage via a reactive core built on
  a MobX-like observable model). Not XSD, not literal JSON Schema Draft spec compliance.
- License: **MIT, fully open source, no paid tier found**. No commercial edition, no Pro/
  Enterprise SKU discovered in search. Backed by Alibaba's internal use (China-centric
  ecosystem — docs, community, and issue discussion skew Chinese-language, which is a real
  adoption friction for EU/Dutch buyers).
- Whitespace signal: Formily is powerful and free but has weak Western/EU mindshare, weaker
  English documentation and community support, and does not do XSD/XML-standards derivation —
  no enterprise pricing exists to reference/undercut. It competes on capability and cost (zero)
  but not on standards-fidelity or Western enterprise support/services, which is exactly the
  gap a services-based Vue+XSD offering could sit in.
- Source: https://github.com/alibaba/formily, https://github.com/alibaba/formily/blob/master/LICENSE.md

## JSONForms (EclipseSource)
- Site: https://jsonforms.io — maintained by EclipseSource (a German/Austrian software
  consultancy, not a pure product company).
- Framework support: **React, Angular, and Vue "out of the box"** — genuinely tri-framework.
- Schema: literal **JSON Schema** (the actual json-schema.org spec) + a separate UI Schema for
  layout — this is the most "standards faithful" of the JSON-based tools, closest in spirit
  (schema-drives-structure-and-validation, UI is separate) to what this library does for XSD.
- License: open source (Apache-2.0 typically for EclipseSource projects; page didn't state
  explicitly in fetch, worth re-verifying against the repo LICENSE file directly if this
  matters for citation).
- Commercial model: **no separate paid product/SKU** — EclipseSource monetizes via
  "Professional Support," training, consulting, and custom implementation services layered on
  top of the free OSS library. This is a **services-first monetization model**, structurally
  the closest precedent to what the target freelancer/consultant is trying to build: give away
  the engine, charge for integration/customization/support work.
- No XML/XSD angle; no wizard-as-metadata; JSON Schema doesn't natively express XSD concepts
  like `choice`, `attributes`, or occurrence-based repeatability the way XSD does — JSON
  Schema needs `oneOf`/`anyOf` workarounds for choice semantics and has no attribute concept
  (XML attributes vs elements) since JSON has no attribute/element distinction.
- Source: https://jsonforms.io/, https://github.com/eclipsesource/jsonforms,
  https://eclipsesource.com/blogs/2019/04/01/single-sourcing-web-mobile-forms-with-json-forms/

## react-jsonschema-form (RJSF)
- GitHub: rjsf-team/react-jsonschema-form — React-only, JSON Schema standard + uiSchema,
  uses ajv validator. Long-running, widely used community project (Mozilla-originated
  historically). Free/open source, no commercial tier of its own.
- **React-only** — structurally cannot serve the Vue niche; only relevant here as the
  "gravity well" that most JSON-Schema-form comparison content centers on, which several
  Vue-relevant searches got pulled into. Good comparison-content source (form.io's own
  RJSF-vs-others page, npm-compare.com) but not a Vue competitor.
- Commercial alternatives orbiting RJSF: **FormEngine (Optimajet)** — React-only drag-drop
  builder; core MIT/free (`@react-form-builder/core`), paid "Designer" builder UI on top,
  enterprise/custom licensing available on request (no listed self-serve price found).
  Confirms the general pattern: JSON-Schema-form-for-React space monetizes the *builder UI*,
  not the engine.
- Source: https://github.com/rjsf-team/react-jsonschema-form, https://formengine.io/,
  https://form.io/json-schema-forms-formio-rjsf-jsonforms-surveyjs-compared/

## Uniforms (Vazco)
- GitHub: vazco/uniforms — **React only**, MIT licensed, ~2k GitHub stars (smaller mindshare
  than RJSF/JSONForms).
- Schema bridges: JSON Schema, GraphQL schema, SimpleSchema (Meteor-ecosystem-origin) — the
  "bridge" abstraction (pluggable schema adapters) is architecturally interesting and is the
  closest precedent among these tools to "one engine, multiple schema formats," which is
  conceptually adjacent to an XSD-driven engine, but Uniforms itself has no XSD bridge and no
  Vue support. Free, no commercial tier found.
- Source: https://github.com/vazco/uniforms, https://uniforms.tools/

## Vueform
- Site: https://vueform.com, builder: https://builder.vueform.com — **Vue-native**
  (Vue 3-specific), closest direct Vue competitor found alongside SurveyJS/FormKit.
- Schema: proprietary Vueform JSON schema (own component/prop tree, not JSON Schema standard,
  not XSD).
- License/pricing (from https://vueform.com/news/20230920-new-pricing, WebFetch verified
  2026-09-30, note: this is a 2023 pricing-announcement post, current pricing page is
  https://builder.vueform.com/pricing and should be re-checked for 2026 numbers before quoting
  externally):
  - SDK: from $16/month, project-based (not per-developer-perpetual like SurveyJS).
  - Builder: $82/month.
  - Additional domains: $100/mo, $1,000/yr, or $3,000 one-time.
  - Free to use on localhost/trial domains; production requires a paid commercial license.
  - Source code access tier-gated: some tiers get readable/modifiable source, others get
    minified/obfuscated browser-executable-only code — notable because it means even paying
    customers don't always get to read/modify the builder source, a friction point a
    "you get real source + can extend it yourself" consulting offer could contrast against.
- No XSD/standards angle; subscription-based recurring SaaS-style pricing (unusual among
  these — most competitors here are either fully OSS+services or one-time-perpetual-license,
  Vueform is the one running an actual monthly-recurring meter on the SDK itself).
- Source: https://vueform.com/license-agreement, https://vueform.com/news/20230920-new-pricing,
  https://builder.vueform.com/pricing

---

## XSD/XML-schema-to-form tooling (the direct precedent space)
Searched explicitly for XSD-to-form generators since this is the core differentiator claim.

- **davidmoten/xsd-forms** (GitHub) — generates web forms from XSD, requires the XSD to be
  annotated with presentation info, outputs static HTML/JS, no server needed. **Appears
  dormant/legacy** (Scala-based generator, no evidence of recent activity in search results,
  reads as a mid-2010s project). Not Vue, not a maintained product.
- **MichielCM/xsd2html2xml** (GitHub) — generates plain HTML5 forms from XSD, round-trips
  filled forms back to XML. Same profile: old, small, not framework-integrated, not a
  commercial product, no pricing/support model.
- **XML Authority (Authority Software, UK)** — the one *commercial, actively-marketed* product
  found that is explicitly "any XSD in, annotated form/table out." Not a web-forms rendering
  library though — it's a **desktop/enterprise regulatory-reporting tool** covering 250+
  specific regulatory XML schemas (AIFMD, FATCA, CRS, Pillar 2, CESOP, SAF-T, AnaCredit, etc.)
  for banks/insurers/funds, generating compliant XML reports from Excel/SQL/XML import,
  real-time validation against the regulator's schema. No pricing found in search (would
  need direct outreach/quote). This is the clearest evidence that **XSD-driven tooling has
  a proven, funded market — but only in desktop-era regulatory-reporting form, not as a
  modern web component library**. Nobody found is doing "Vue components rendered live from an
  XSD, XSD-faithful choice/occurs/attribute semantics, in-browser."
- No hits at all for a modern, actively maintained, web-framework-integrated (React or Vue)
  XSD-to-form renderer. The concept is old (2000s W3C mailing list threads on "generating forms
  from XML schemas" turned up in search, i.e. this idea is 20+ years old and has never been
  solved well in a modern JS framework).
- Confirms strongest whitespace finding of this angle: a Google search for `"vue" "XSD" form
  library github npm` returns **the user's own project (jeroenbach/vue-dynamic-form) as the
  top and effectively only current, maintained, Vue+XSD match** — no direct competitor
  surfaced in that search at all.
- Sources: https://github.com/davidmoten/xsd-forms, https://github.com/MichielCM/xsd2html2xml,
  https://authoritysoftware.co.uk/authority-suite/xml-authority/

## Insurance/customs XML standards context (for "standards-heavy domains" framing)
- **ACORD** — the dominant XML standard for P&C and Life insurance transactions in the US/
  global insurance industry (per Wikipedia summary). Confirms insurance really does run on
  XML-schema-defined data exchange, supporting the pitch that XSD-driven forms map naturally
  onto real insurance data-entry/back-office workflows. Did not find a Vue/React ACORD-schema
  form renderer product — another concrete vertical whitespace pocket, not just an abstract one.
- **IRS Modernized e-File (MeF)** — US tax-exempt-org e-filing runs on published XSD schemas.
  Same pattern: real regulatory XML schemas exist and need forms, and no modern web-component
  renderer targets them directly; filing happens via dedicated (often expensive, clunky)
  e-file software, not a generic schema-driven form UI layer.
- Logiforms/EDOCGEN/iCustoms are **document-automation/PDF-generation tools for insurance and
  customs**, not schema-driven form-rendering engines — different product category (output
  generation, not structured data capture), so not direct competitors but worth knowing they
  exist in adjacent search results.

## Dutch/NL government e-forms market (for Dutch-relevance angle)
- The Netherlands has a **specific legal driver**: Wet modernisering elektronisch bestuurlijk
  verkeer (**Wmebv**) — requires municipalities/government bodies to offer electronic
  submission channels, with specific "e-formulieren en notificeren" (e-forms and notification)
  guidance published by VNG (association of Dutch municipalities):
  https://vng.nl/sites/default/files/2024-07/wmebv_hulpgids_e-formulieren_en_notificeren_juli_2024.pdf
- Incumbent Dutch vendors in this exact space: **Seneca** (Formulierenserver, DigiD+BRP
  prefill, API to back-office/zaaksysteem — https://seneca.nl/oplossingen/formulierenserver,
  https://seneca.nl/wmebv/formulierenserver) and **CARE Internet Services**
  (https://www.care.nl/gemeenten-en-overheid/e-formulieren) — both market Wmebv-compliance,
  DigiD/eHerkenning integration, and case-management-system (zaaksysteem) linkage as their
  core value prop. No pricing surfaced for either (typical for Dutch govtech B2G sales — quote-
  based, procurement-driven).
  - Note: no evidence either Seneca or CARE's forms engine is literally XSD-schema-driven
    under the hood (their marketing describes citizen-facing form UX and back-office API
    linkage, not a metadata/schema architecture) — could not confirm or rule out from search
    alone; would need a deeper technical dig (e.g. their API docs) to know if they're XML/XSD
    native internally. Flagging as an open question, not a settled fact.
  - "Diamond Forms" (diamondforms.net) appeared in initial search as a government-forms vendor
    but was not independently verified beyond the title snippet — treat as a lead, not
    confirmed fact.
- This confirms Dutch government/municipal e-forms is a real, law-driven (not just nice-to-
  have) market with named incumbent vendors, but the competitive dimension found is DigiD/
  back-office integration and Wmebv compliance, not schema-architecture sophistication —
  suggesting an XSD-native engine's edge there would be less about the citizen-facing web form
  (commodity) and more about the back-office XML data-exchange fidelity, which none of the
  found vendors explicitly advertise as a differentiator.

## Dead ends / notes for future agents
- Could not find raw Reddit or HN threads with explicit "form.io/SurveyJS pricing sucks"
  sentiment — searches surfaced vendor-adjacent comparison blogs (which have their own bias,
  e.g. form.io's own RJSF-comparison page, or SEO-farm comparison sites like fomr.io) rather
  than organic user complaints. If complaint-mining matters for another angle, try
  site:reddit.com r/vuejs, r/webdev, r/sysadmin explicitly with the search tool restricted via
  allowed_domains, or search Twitter/X and dev.to comment sections directly rather than
  generic web search.
- G2's Form.io "$100/mo" figure conflicts with Form.io's own pricing page ($300-330/mo
  environment-based); did not reconcile — G2 tier labels often reflect an old/lowest historical
  SKU. Use Form.io's own page as authoritative for any external-facing claim.
- Did not get current (2026) Vueform pricing page content directly — WebFetch pulled a 2023
  news post that had the pricing numbers embedded, not the live pricing page render (likely
  JS-rendered SPA that WebFetch's HTML-to-markdown conversion couldn't fully extract). If exact
  current Vueform numbers matter, retry https://builder.vueform.com/pricing directly, possibly
  needs a JS-rendering fetch method.
- Did not verify Form.io's Vue framework support directly on their own site (only inferred
  "not headline-advertised" from comparison-page context) — if Form.io's Vue support becomes
  a load-bearing claim, fetch form.io's own SDK/framework docs page directly rather than relying
  on inference.
- JSONForms exact license (Apache-2.0 assumed from EclipseSource's typical pattern) not
  directly confirmed from a fetched LICENSE file — low-stakes but flag before citing externally.
