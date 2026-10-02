# Research brief

## The product

`@bach.software/vue-dynamic-form` — open-source Vue 3 library for metadata-driven dynamic
forms. Docs: https://vue-dynamic-form.bach.software. Distinguishing capabilities:

- Metadata tree (XSD-inspired) drives structure, validation, and dynamic behaviour:
  `minOccurs`/`maxOccurs` repeatables, mutually-exclusive `choice` branches, attributes,
  the full XSD restriction set (`pattern`, `enumeration`, `totalDigits`, ...).
- Strict separation of engine and rendering: user-written template components own all
  layout/styling via named slots; swap the template, keep the form logic.
- Multi-step wizard forms are first-class metadata shapes with per-section validation.
- Built on vee-validate; computed props for reactive field behaviour.

Because the metadata model mirrors XSD semantics, forms can in principle be generated
from XSD/XML schemas — relevant for government, insurance, customs, and other
standards-heavy domains.

## The business goal

Jeroen is a Dutch freelance developer. The library is and stays open source. He wants to
find work where the library is a decisive accelerator but the customer still needs more
than the library itself: a product built together that is easy to resell to other
customers as licenses or plain customizations. Not looking for: one-off "here's the
library" consulting, or competing head-on with hosted form SaaS on their own turf.

## Scoping decisions (Jeroen, 2026-09-30)

- **Market**: Netherlands / EU first (TenderNed, Dutch agencies, Dutch platforms),
  global English-language sources as a second ring.
- **Deliverable**: both a market-gap strategy report and a concrete linked lead list.
- **Scale**: large (~25–40 Sonnet search agents across both phases, with adversarial
  verification and synthesis).

## Phase 1 search angles (strategy)

| key | focus |
|---|---|
| competitors-schema-engines | Landscape + licensing/pricing of schema/metadata-driven form engines (SurveyJS, Form.io, FormKit, Formily, JSONForms, RJSF, Uniforms, ...) |
| pain-points | Documented complaints and unmet needs in those ecosystems, especially Vue |
| xsd-industries | Industries running on XSD/XML standards that need form UIs; existing XSD-to-form tooling |
| dutch-gov-forms | NL government forms landscape: Open Formulieren, Common Ground, formulierenserver vendors, gemeente procurement |
| regulated-verticals-eu | Insurance / healthcare intake / legal intake in EU; compliance drivers (GDPR, WCAG/EN 301 549) |
| lowcode-market-gap | Form-builder & low-code market size, pricing benchmarks, gap for developer-first embeddable engines |
| oss-monetization | How comparable OSS form tools monetize (SurveyJS, Form.io, Formbricks, Typebot, Tally); what works |
| vue-ecosystem-demand | What Vue teams use today for complex forms; demand signals; gap vs the React ecosystem |

## Phase 2 (leads) — to be aimed by Phase 1 output

Candidate source classes: TenderNed / TED (EU tenders), Dutch agency & detachering
postings, publicly indexed freelance postings, Reddit / HN / Stack Overflow / GitHub
discussions where someone asks for exactly this, named organizations in winning niches.
