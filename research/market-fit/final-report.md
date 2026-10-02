# Final report — Where vue-dynamic-form can make money

2026-09-30. Combined deliverable of a 34-agent research run (Fable orchestrating,
Sonnet searching, adversarial verification throughout). Full evidence:
`phase1-strategy.md` (market gap), `phase2-leads.md` (verified leads), `raw/` (agent notes).

## The thesis, in three sentences

The intersection **Vue-native × XSD-semantics form engine** is unclaimed: JSON-Schema
tools structurally cannot express choice groups or attributes, the old XSD-to-form tools
are dead or dated, and searches for the category surface your own repo as the only
maintained match. Demand is real and *named*: the Dutch government's own forms platform
(Open Formulieren) has a four-year-old, thrice-municipally-sponsored, maintainer-
acknowledged gap ("no budget… not planned") that your library solves as a first-class
metadata shape, and Dutch insurance (SIVI AFD), pensions (UPA), customs (EUCDM/DMS) and
tax (Digipoort) all still run on literal XSD with dated migration pressure through 2026.
The proven business model at your scale is not SaaS: it is services + a FormKit-Pro-style
paid add-on layer (components/templates/importer) on top of the MIT engine.

## The recommended play (in order)

1. **Build the killer demo (days, not weeks).** A public, runnable page: a repeatable
   section where each item has its own conditional logic + choice branches + XSD
   validation — the literal open-forms#2441/#6055 scenario — plus an "XSD in, form out"
   mini-demo using a real SIVI AFD or StUF-EF schema. This one asset powers every channel
   below.
2. **Enter the Open Formulieren orbit** (best evidence, best reachability): one factual
   comment on #2441; direct outreach to Maykin (Bregje van der Horst), Dimpact, Raakvlak
   Advies, Delta10, xxllnc proposing paid scoping/subcontracting for the repeating-group
   epic; demo at Common Ground Fieldlab (9–10 Nov 2026, Utrecht). Goal: become "the
   complex-forms specialist" this ecosystem subcontracts, then generalize.
3. **Register in the government inhuur pipelines now** (opdrachtoverheid.nl, Flextender
   DAS, de Publieke Partner, LibLab, GreenPepper/Zoë Gidding) — Rotterdam's 5-specialist
   Open Formulieren contract hits its renewal decision ~Nov–Dec 2026; rates in this niche
   run €90–115/h.
4. **Run two vertical outreach sprints with dated hooks:** insurance (Keylane vacancy —
   apply/pitch now; Robbe Assuradeuren; ANVA/CCS/DIAS/Solera on the NVGA Protocol 2.0
   2026 rollout; Verbond van Verzekeraars contacts on the AFM WCAG investigation) and
   customs (Alliantie Douane Software members on the DMS migration).
5. **Seed inbound cheaply:** answer vee-validate discussion #5056 (unanswered 15 months,
   your library sits on vee-validate); publish the "why repeaters + conditionals break in
   schema-array libraries" comparison (FormKit #1774 pattern + JSONForms array-perf
   complaints, corrected details in phase2-leads.md); position docs/SEO against
   vee-validate's own "build a form generator" tutorial gap.
6. **Productize as revenue appears, in this order:** (a) fixed-price "XSD in, form out"
   onboarding service with a licensable importer; (b) paid NL component/template pack
   (BSN/IBAN/KVK inputs, WCAG 2.1 AA + NL Design System template) at FormKit-Pro-style
   one-time per-project pricing; (c) white-label template packages for agencies
   (Appfront, Yameo, Passionate People as first conversations). Keep the engine MIT —
   it's a procurement advantage. Do NOT build a hosted platform speculatively.

## What to keep in mind

- Demand here is expressed through platforms and compliance drivers, never through
  "Vue developer" postings — lead with the named gap, not the framework.
- The verification passes killed several attractive-but-wrong claims (Belastingdienst
  AWA precedent unverified, EAA fine is 1% not 4% of turnover, several vacancy URLs
  stale). The corrections logs in both phase reports list everything not to cite.
- Healthcare intake is crowded; UBL/e-invoicing is commoditized; Omgevingswet/STOP-TPOD
  pain is real but politically messy — all deprioritized deliberately.

## Suggested first week

| Day | Action |
|---|---|
| 1–2 | Build the #2441 demo + AFD XSD mini-demo |
| 3 | Comment on #2441; reply to vee-validate #5056 |
| 3 | Email Maykin (Bregje van der Horst) + Dimpact programme |
| 4 | Email Raakvlak, Delta10, xxllnc; register on opdrachtoverheid.nl + Flextender |
| 5 | Apply/pitch Keylane; email Robbe Assuradeuren; check Fieldlab registration |
