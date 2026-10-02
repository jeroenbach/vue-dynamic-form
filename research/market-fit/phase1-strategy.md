# Phase 1 — Market-gap strategy report

Synthesized 2026-09-30 from 8 Sonnet search agents + 8 adversarial verifiers (raw notes in
`raw/phase1-*.md`). Claims below survived verification unless marked otherwise; corrections
from refuted claims are incorporated.

## The one-sentence conclusion

vue-dynamic-form sits on a genuinely unclaimed intersection — **Vue-native + XSD-semantics
form engine** — and the most monetizable route is not selling the library but selling
*schema-to-form capability* into Dutch standards-heavy sectors (government, insurance,
customs/tax) plus a FormKit-Pro-style paid layer, with the Dutch municipal
Open Formulieren ecosystem as the most concrete, reachable first market.

## What is verified about the gap

**1. Nobody else occupies the XSD × modern-web-component intersection.**
- None of the surveyed engines (SurveyJS, Form.io, FormKit, Formily, JSONForms, RJSF,
  Uniforms, Vueform) drive forms from XSD; JSON Schema cannot natively express `xs:choice`
  or the attribute/element distinction (confirmed via json-schema.org docs — it's a
  data-model gap, not a vendor gap).
- Direct XSD-to-form tooling is two eras old: dead hobby projects (xsd-forms,
  xsd2html2xml), dated/expensive enterprise tools (JAXFront since 2001, Orbeon/XForms),
  and Microsoft InfoPath — the mainstream answer — discontinued with users falling back to
  VBA macros (confirmed Microsoft Q&A thread).
- Commercial proof the niche pays: **XML Authority** (Authority Software, UK) sells
  XSD-driven form rendering for 250+ regulatory schemas (FATCA, CRS, AIFMD, CESOP…) to
  banks/insurers — but as desktop/enterprise reporting software, not an embeddable web
  library.
- Searches for "Vue XSD form library" surface jeroenbach/vue-dynamic-form itself as the
  only maintained match.

**2. The Vue ecosystem has a confirmed schema-driven-forms hole.**
- vee-validate: 1,331,453 weekly downloads (verified via npm API) but is a validation
  primitive; its own official docs admit form generation is a repetitive unsolved task and
  refer readers to formvuelate (976 weekly downloads, 443 stars).
- Formily's fame doesn't reach Vue: @formily/vue has 1,386 weekly downloads vs 12.6k stars
  on the parent repo. At least three prior "vue-dynamic-form(s)" attempts by other teams
  are dead; two new tiny entrants appeared in 2025/26 — recurring itch, no winner.

**3. Dutch government forms: real product, real gap, real legal drivers.**
- Open Formulieren (Maykin Media → Dimpact, EUPL, React+formio.js frontend) is the
  dominant open-source municipal forms platform. Confirmed verbatim open issue
  [open-forms#2441](https://github.com/open-formulieren/open-forms/issues/2441): *"It is
  impossible for a repeating group to have items that contain hidden fields that are
  triggered by logic within each item"* — exactly the repeatable+choice+conditional
  combination this library models natively. The renderer team's own scoping issue
  ([formio-renderer#36](https://github.com/open-formulieren/formio-renderer/issues/36))
  marks per-item conditional visibility and per-row validation as "tricky", unresolved.
- Upstream formio.js has confirmed multi-year wizard/nested-form bugs (#2703, #965).
- A paid ecosystem already exists around the free product: Maykin's 4 official
  implementation partners (Raakvlak, Daadkracht, Macoin, Taxonic) plus Delta10
  (managed hosting, first customer Gemeente Ede) — proof that "services around a free
  engine" is a working business at exactly this market scale.
- Market far from saturated: GEMMA Softwarecatalogus shows 6 gemeenten in production for
  the checked version (Maykin claims 50+ organisations overall) out of 342 municipalities.
- Legal drivers: Wmebv (mandatory electronic channels), WCAG 2.1 AA under the Wet
  digitale overheid (forms explicitly included), and audits still finding form-related
  accessibility failures in 2025. NL Design System exists as the pattern library to align
  a compliant template with.

**4. Dutch/EU standards-heavy verticals literally run on XSD today.**
- **Insurance (NL):** SIVI AFD is XSD-based (afdSchema.xsd + afdFormats.xsd +
  afdCodelists.xsd, confirmed), mid-migration AFD 1.0 → 2.0 with both coexisting —
  version churn is a recurring-revenue driver. ACORD (global insurance) publishes P&C and
  Life standards as XSD (confirmed).
- **Pensions (NL):** SIVI's UPA standard (XML, ~220 pension funds, 2026 version already
  published).
- **Customs (EU):** EDIFACT→XML migration onto the EU Customs Data Model is real
  (DMS completed 2023/24, DVA rolling out from Dec 2024) — cite
  taxation-customs.ec.europa.eu, not the douane.nl FAQ.
- **Tax/B2G (NL):** Digipoort exchanges SOAP messages specified in XSD; Logius publishes
  the specs and a validation test service.
- **Omgevingswet (NL):** STOP/TPOD is XML-schema-based with well-documented vendor pain
  (confirmed Computable quotes, withdrawn brandbrief of 7 vendors). Correction: it was
  *not* mandatory-for-all from 1 Jan 2024 — TAM-IMRO transition ran until 1 Jan 2026;
  adoption at go-live was low. Higher-risk, politically messy niche.
- **e-invoicing (UBL/Peppol):** commoditized; multiple cheap form-to-XML tools already
  exist. Weakest wedge.

**5. Compliance pressure is a sales lever, with one correction.**
- European Accessibility Act applies since 28 June 2025, ACM enforces in NL, fines up to
  €900,000 — **or 1% of turnover, not 4%** (refuted; 4% was GDPR confusion). It extends
  accessibility duties to private-sector forms (banking, e-commerce).
- EU data-sovereignty angle vs US-parented form SaaS (CLOUD Act) is directionally real
  but rests on vendor-authored analysis — usable as positioning, not as a hard legal claim.

**6. Incumbent pricing and structural limits leave openings.**
- SurveyJS $589–$2,359/dev perpetual (builder paywalled); Form.io modules $330–660/mo
  each, realistic minimum self-hosted deployment ~$660–990/mo (correction to the
  "$300/mo self-hosted" claim), OSL-3.0 core, "90% of customers self-host" (their claim);
  Formstack has no self-hosted option at all; Jotform gates SSO/dedicated environments
  behind Enterprise (though basic de-branding starts at ~$39/mo — refuted the stronger
  claim); Microsoft Forms: Choice-only, forward-only branching, no loops (confirmed);
  Zoho Creator: no native multi-step forms (user thread).

## What the monetization evidence says

- **The validated solo/small-team models** are (a) MIT core + paid component/template
  add-on with one-time per-domain pricing — FormKit Pro, $149–$1,250 (confirmed); and
  (b) services/support around a free engine — JSONForms/EclipseSource, and the entire
  Open Formulieren partner ecosystem. SurveyJS shows a 4-person EU team sustaining
  ~$440k/yr on per-developer licenses. Sidekiq is the strongest solo open-core precedent.
- **Anti-patterns to avoid:** AGPL/dual-licensing (Typebot abandoned it — confirmed from
  their own blog: confused users, didn't stop free-riders); open-core with proprietary
  code bundled into the "open source" image (Formbricks criticism). MIT cleanliness is
  itself a procurement selling point for EU public sector.
- **Do not build a hosted platform speculatively** — no solo player makes open-core-with-
  hosted-platform work without a team/VC. Let a flagship customer engagement generate
  that demand first.

## Ranked niches (demand evidence × library fit × solo-freelancer reachability)

1. **Dutch municipal forms ecosystem (Open Formulieren orbit).** Named buyers, named
   partners to subcontract for, a confirmed engine-level gap your library already solves,
   legal deadlines, and a proven services business model. Entry: demo solving
   open-forms#2441-class problems + WCAG/NL Design System template; approach the 5
   service shops and Dimpact before approaching gemeenten directly.
2. **Dutch insurance data-standard forms (SIVI AFD/UPA).** Sharpest XSD wedge with a
   demoable proof ("AFD XSD in, branded validated claim/intake form out"); volmachten,
   brokers, and the software vendors serving them; AFD 1.0→2.0 churn creates recurring
   work. Less publicly visible demand than niche 1 — needs direct outreach.
3. **Customs/tax software vendors (EUCDM, Digipoort).** Real budgets, active XML
   migrations, OEM/white-label positioning (sell the form layer to Descartes-class
   vendors and forwarders' software suppliers, not to declarants).
4. **Vue agencies / ISVs needing white-label embeddable forms (horizontal).** The
   template/slot separation is the differentiator ("reskin per client without rebuilding
   logic"); combine with EU-sovereignty positioning. Broadest but least focused.
5. **WWFT/KYC intake for notaries & mid-market law firms.** Apparent whitespace (no
   dedicated product found) but absence-of-evidence; healthcare intake explicitly
   crowded — deprioritize both until a signal appears.

## Productizable offerings to validate in Phase 2

- **P1 — "XSD in, form out" import tool + productized service.** Generator from
  XSD (SIVI AFD, StUF-EF, EUCDM, Digipoort) to vue-dynamic-form metadata, sold as a
  fixed-price onboarding service with a licensable importer. This is the resellable core IP.
- **P2 — Paid NL/EU component & template pack** (FormKit-Pro model, one-time per-project
  license): BSN/IBAN/KVK/postcode-lookup inputs, WCAG 2.1 AA + NL Design System template,
  Element Plus template. MIT engine untouched.
- **P3 — White-label embedding package for agencies/ISVs**: fixed-price "same form logic,
  new brand" template development + support subscription.
- **P4 — Complex-forms specialist services** in the Open Formulieren orbit: subcontracting
  to existing partners for the hard cases (repeatables with per-item logic, wizards,
  XSD-driven intake), plus migration offers for teams stuck on vue-form-generator
  (unmaintained since 2023) or Microsoft Forms' structural walls.

## Corrections log (claims refuted in verification — do not reuse)

- EAA alternate fine threshold is 1% of turnover, not 4%.
- STOP/TPOD was not mandatory for all authorities from 1 Jan 2024 (TAM-IMRO until 2026).
- Rotterdam was not an original Open Formulieren build partner; org count is 50+, not ~40.
- Delta10 does not currently offer the "whole Common Ground stack" as managed services.
- GEMMA eFormulieren delivers StUF-EF XML *or* email; "built entirely on StUF-EF" overstates.
- Form.io $300/mo is SaaS entry, not self-hosted enterprise (~$660–990/mo minimum).
- Jotform basic de-branding starts at ~Bronze ($39/mo); only SSO/dedicated env are Enterprise.
- Digipoort docs are public; there is no "free ODB developer account" product.
- "Abandoned within 1–2 years" pattern across the three prior vue-dynamic-form attempts
  doesn't hold uniformly (individual dates correct, generalization not).
