# Phase 1 — Vue 3 ecosystem demand for complex/dynamic/schema-driven forms

Research date: 2026-09-30. Angle: what Vue 3 teams use today for complex/dynamic forms, download/star trends, recurring "how do I build a dynamic form" demand, agencies betting on Vue in NL/EU, and evidence the Vue ecosystem lacks a strong schema-driven form story vs React.

## Hard numbers (verified via GitHub API + npm registry API, not just search snippets — search-engine summaries of npmtrends were unreliable/garbled, see Dead Ends)

### GitHub stars / last-push activity (api.github.com, checked directly)

| Repo | Stars | Last push | Notes |
|---|---|---|---|
| logaretm/vee-validate | 11,263 | 2026-03-04 | The de facto Vue validation library. Pure validation, not a form-generation/schema framework by itself. |
| formkit/formkit | 4,768 | 2026-07-24 | Batteries-included form authoring framework incl. schema-based generation; actively maintained. |
| eclipsesource/jsonforms | 2,742 | 2026-09-29 (pushed literally the day of this research) | JSON-Schema-driven forms with **out-of-the-box React, Angular AND Vue bindings**. Backed by EclipseSource (German/Austrian enterprise consultancy), offers "Professional Support" link (no pricing shown publicly). Has a dedicated Vuetify renderer set (`vue-vuetify`). This is the closest thing to a schema-driven, cross-framework, enterprise-oriented product touching Vue. |
| vue-generators/vue-form-generator | 2,986 | 2023-01-11 | Popular Vue **2**-era schema-based generator, effectively dead/unmaintained for 3+ years — a real gap left by its abandonment. |
| vueform/vueform | 1,511 | 2026-06-22 | Commercial-adjacent open-core Vue form framework, see pricing below. |
| alibaba/formily | 12,594 | 2025-06-21 | Huge star count but this is the **cross-framework umbrella repo** (React/React Native/Vue2/Vue3). Its fame is overwhelmingly React-driven (see download split below). |
| formvuelate/formvuelate | 443 | 2026-09-10 | Small but still actively pushed. Dynamic schema-based form rendering for Vue, explicitly recommended by vee-validate's own official tutorial as the "production-ready" escalation path. |
| Flo0806/vorm | 22 | 2025-12-30 | Brand-new (2026) zero-dep schema-driven Vue 3 form engine, launched via "Show HN" (news.ycombinator.com/item?id=44246212). Evidence of continued fresh attempts at solving this problem — nobody has "won" yet. |
| encolajs/encolajs-enforma | 17 | 2025-11-28 | Another brand-new (2026) UI-agnostic, schema-ready Vue 3 form library (PrimeVue/Vuetify/Quasar presets, Zod/Yup/Valibot validation). Also very fresh. |
| asigloo/vue-dynamic-forms | 389 | 2022-02-10 | "Easy way to dynamically create reactive forms in Vue based on a varying business object model" — independently-built metadata-driven dynamic form concept, same idea as this project, abandoned since 2022. |
| reside-ic/vue-dynamic-form | 0 | 2023-04-18 | Another independent "generate a form dynamically from metadata" attempt, essentially unnoticed. |
| codetheorist/vue-dynamic-form | 7 | 2017-08-30 | Yet another independent same-named/same-concept attempt, from 2017, long dead. |

Takeaway on the last three: **at least four different teams (including this project) have independently built "generate a Vue form from a metadata/schema description" under almost the same name/concept**, and all but this project abandoned it within a year or two. That's a decent signal of recurring need paired with nobody sustaining a winning solution — a genuine gap, not an already-crowded space.

### npm weekly downloads (api.npmjs.org/downloads/point/last-week, checked 2026-09-30, week of 2026-09-22 to 2026-09-28)

| Package | Weekly downloads |
|---|---|
| vee-validate | 1,331,453 |
| @formkit/vue | 144,312 |
| vuelidate | 138,826 |
| @jsonforms/vue | 49,170 |
| formvuelate | 976 |
| @formily/vue | 1,386 |
| vueform | 140 |

Key read: vee-validate's install base (1.3M/week) dwarfs every schema/dynamic-form-generation layer built on top of it by 1-2 orders of magnitude. That gap is exactly the space this project's metadata-tree engine sits in: teams overwhelmingly reach for vee-validate as the validation primitive, but very few reach for a mature layer on top of it that gives them schema-driven structure (repeatable sections, choice branches, wizards). @jsonforms/vue at ~49k/week is the strongest schema-driven contender that touches Vue, but per its own repo framing it's a multi-framework tool (React/Angular/Vue), not Vue-native, and it targets plain JSON Schema (not XSD-style structure with attributes/choice/occurs semantics).

@formily/vue downloads (1,386/week) vs alibaba/formily's huge 12,594 GitHub stars is a strong data point for the "Formily Vue bindings" part of the brief: **Formily's popularity is a React-ecosystem phenomenon; its Vue binding is a rounding error by comparison.** This directly supports "Vue lacks a strong schema-driven form story compared to React" — even the one cross-framework tool that claims Vue support barely gets used there.

react-jsonschema-form (RJSF), the React benchmark named in the brief, has ~38,948 weekly downloads and 14,533 GitHub stars per a search-engine summary (not independently re-verified via API in this pass — flag as medium confidence, but directionally consistent: RJSF alone beats every Vue-specific schema-form tool combined).

## FormKit vs vee-validate positioning (from birdeatsbug.com blog and formkit.com, medium confidence — not primary financial data, but consistent framing across multiple sources)

- vee-validate's stated mission is validation; FormKit bundles validation as one part of a broader field-authoring framework (inputs, labels, theming, i18n, accessibility, **schema-based form generation**) — i.e., FormKit is the one Vue-native tool that explicitly tries to own the "generate form from schema" story, but it is opinionated/batteries-included (comes with its own input components), which is the opposite of this project's "engine + user-owns-the-template" separation.
- FormKit weekly downloads (144k) are ~10x @jsonforms/vue and >100x vueform/formvuelate, suggesting FormKit is the nearest Vue-native incumbent to watch/differentiate against, not JSON Forms or Vueform.

## Vueform — commercial precedent for monetizing Vue form tooling (vueform.com, builder.vueform.com/pricing — primary sources)

- Vueform runs an **open-source SDK + paid visual Builder** split: SDK access from $16/month, Builder from $82/month, White-Label tier starts at $299/month, Enterprise by contact.
- This is directly relevant as a **precedent business model** for monetizing a Vue form library: open-core engine + paid tooling/builder/white-label layer on top. Worth studying their pricing page structure in a later phase for the productization/pricing angle.
- Low GitHub star count relative to pricing ambition (1,511 stars) and very low npm downloads for the raw `vueform` package (140/week) suggest most of its real usage/revenue is through the hosted Builder product, not the open npm package — i.e., people pay for the tool, not the library. Supports a "sell the tool/service, not just the npm package" strategy.

## SurveyJS's own market narrative (surveyjs.io/stay-updated/blog/vue-form-libraries — a competitor's blog, so read as informed-but-biased)

Fetched and read in full. Useful framing quotes:
- "[Teams] settle on a form approach once per app and do not revisit it until a wizard, conditional section, or per-tenant field set exposes the limits of that first choice." — matches exactly what this project's wizard/choice/repeatable metadata shapes solve.
- "Once forms move past account settings into onboarding, eligibility, or ops workflows, the question shifts from 'which API feels nice?' to 'who can change this logic without a deploy?'" — points at a real productizable angle: non-engineers editing form logic (schema/metadata as the editable artifact) without redeploying code. Could map to an "XSD/metadata editor" or "form-as-config" service offering.
- "The ecosystem's split between headless and opinionated Vue form tools makes mismatches sticky." — validates this project's architectural bet (engine/template separation) as solving a named pain point, not an arbitrary design choice.
- Names SurveyJS itself as the "platform-level" alternative (creation, rendering, analytics, PDF export, lifecycle, collaboration) — i.e., SurveyJS's pitch is that framework-level libraries (vee-validate, FormKit, Vueform) all stop short of being a full platform. This project is a framework-level library, not a platform — worth noting as a strategic choice (compete on developer/customization depth, not on SurveyJS's all-in-one turf) rather than a weakness.

## Official vee-validate escalation path (vee-validate.logaretm.com/v4/tutorials/dynamic-form-generator/ — primary source, fetched)

- vee-validate itself ships an official tutorial titled "Build a Form Generator" whose own framing is: "Building forms is often a repetitive task and requires a lot of back and forth to maintain," especially when clients request field additions/removals. This is effectively the vee-validate maintainers acknowledging the exact problem this project targets, badly enough that they wrote an official tutorial for a bare-bones DIY version.
- The tutorial explicitly punts on production-readiness and **points readers to Formvuelate** ("references more robust alternatives... for production use cases requiring additional complexity") rather than to FormKit, Vueform, or JSON Forms — i.e., the most-downloaded Vue validation library's own docs don't have a confident recommendation for a mature schema-driven layer on top of themselves. That's a soft but telling gap signal.

## XSD-specific angle (search only, medium/low confidence — old, mostly dead prior art)

- `ruoso/xsdform-js` ("Javascript library to generate HTML Forms from XML Schema Definition files") and `davidmoten/xsd-forms` ("Generates web forms from xml schema documents") are both old, framework-agnostic, effectively dead projects — confirms the *idea* of "generate a form directly from an XSD" has been attempted multiple times outside Vue too, but never sustained. No Vue-specific XSD-to-form generator was found anywhere in search results other than this project itself.
- No direct hits connecting any Vue form library to Dutch standards (SBR/Digipoort/StUF/e-Herkenning). The only Digipoort/SBR hits were unrelated Microsoft Dynamics AX integration docs. This is an absence-of-evidence data point, not proof of a gap, but it does mean: nobody has already built and publicized a Vue-based XSD-to-form tool for the Dutch government/finance stack — the niche (if it exists) is unclaimed in public search results as of this research.
- Adjacent evidence the niche exists in principle: XSD is exactly the format underlying customs (e.g. AES/ATLAS declarations per xflowly.com), insurance (ACORD forms — insurgrid.com), and Dutch tax/finance (SBR/XBRL). These sectors run heavy document-automation/compliance-software businesses (InsurGrid, EDocGen, Xflowly, Descartes, iCustoms, Affinda) but none of those tools were found to be Vue-based or forms-first in the "user fills out a dynamic web form" sense — they're mostly document *generation*/*extraction* automation, a different problem (going from data to a document, not from a human to structured data via a form). Worth a dedicated follow-up angle: is "XSD-schema-driven data-entry forms for compliance filings" an underserved wedge distinct from the document-automation vendors above?

## Awesome-vue / ecosystem breadth signal

- `vuejs/awesome-vue` itself: 73,543 stars, pushed 2026-09-24 (very actively maintained curated list) — confirms it's a live, trustworthy index.
- Its form-libraries section and related blog posts (madewithvuejs.com, vuescript.com, creative-tim.com "Top form generator components") list a long tail of small/abandoned schema-form attempts (vue-json-schema-form, formschema/native, vue-form-json-schema, vue3-schema-forms, json-formvue, etc.) — breadth without depth. Nothing in that long tail has meaningfully more traction than @jsonforms/vue or FormKit. This supports "fragmented, no dominant winner" rather than "solved problem, stay away."

## Dutch/EU agency landscape (light coverage, not deeply verified — flag for a later phase focused specifically on NL agencies/customers)

- `theirstack.com/en/technology/vue-js/nl` claims 761 companies in NL using Vue.js (unverified methodology, treat as directional only).
- `github.com/vuejs-nl/who-use-vuejs-in-netherlands` — a community-maintained list of NL companies using Vue; worth a manual read in a later phase to spot insurance/government/finance names specifically (did not fetch/read the actual list content in this pass — time-boxed to this angle's core question).
- No search hit surfaced a named NL agency or enterprise explicitly betting on Vue *for* complex/XSD-driven forms specifically (government, insurance, customs). This is again an absence-of-evidence gap to close in a customer-discovery-focused phase, not a finding in itself.

## Dead ends / things not worth re-searching

- Searching npmtrends.com comparison pages via WebFetch returns garbled/unreliable numbers (it once reported vee-validate's GitHub star count as its "monthly downloads" and vice versa) — always cross-check via `api.github.com/repos/<owner>/<repo>` and `api.npmjs.org/downloads/point/last-week/<package>` directly instead of trusting a WebFetch summary of npmtrends.
- Reddit-specific `site:reddit.com` queries returned no actual Reddit threads in this search tool (results were dominated by GitHub/dev.to/Medium regardless of the site: filter) — the search tool appears not to reliably honor `site:` restriction to reddit.com in this environment. If Reddit-thread-level qualitative color is needed, a different retrieval path (e.g. Reddit's own search or Pushshift-style tooling) would be needed; not pursued further here given time-box.
- Hacker News search for "dynamic form Vue complaint" surfaced nothing except the Vorm Show HN post itself (see above) — no broader HN complaint thread found.
- jsonforms.io homepage fetch did not surface any named customer logos, case studies, or pricing for "Professional Support" — would need to check a dedicated support/consulting subpage (not done in this pass).

## Sources referenced (primary where possible)

- https://api.github.com/repos/logaretm/vee-validate (and sibling repos — GitHub API, primary)
- https://api.npmjs.org/downloads/point/last-week/vee-validate (and sibling packages — npm registry API, primary)
- https://vee-validate.logaretm.com/v4/tutorials/dynamic-form-generator/ (primary, fetched in full)
- https://surveyjs.io/stay-updated/blog/vue-form-libraries (competitor blog, fetched in full)
- https://jsonforms.io (primary, fetched)
- https://github.com/eclipsesource/jsonforms
- https://vueform.com/news/20230920-new-pricing and https://builder.vueform.com/pricing
- https://formkit.com/getting-started/what-is-formkit
- https://birdeatsbug.com/blog/comparing-vue-3-form-validation-libraries-vuelidate-vs-formkit
- https://news.ycombinator.com/item?id=44246212 (Show HN: Vorm)
- https://github.com/Flo0806/vorm
- https://github.com/encolajs/encolajs-enforma
- https://github.com/formvuelate/formvuelate
- https://github.com/asigloo/vue-dynamic-forms, https://github.com/reside-ic/vue-dynamic-form, https://github.com/codetheorist/vue-dynamic-form
- https://github.com/vue-generators/vue-form-generator
- https://github.com/alibaba/formily
- https://theirstack.com/en/technology/vue-js/nl
- https://github.com/vuejs-nl/who-use-vuejs-in-netherlands
- https://github.com/vuejs/awesome-vue
- https://insurgrid.com/features/acord-form-generator, https://xflowly.com/solutions/customs (XSD-adjacent compliance-document-automation market, not Vue-specific)
