# Phase 1 raw research notes: documented pain points with existing form solutions

Angle: find GitHub issues, forum threads, blog complaints about SurveyJS / Form.io / FormKit /
Formily / JSONForms / general dynamic-form building. Focus: theming/white-label limits, wizard
support, repeatable sections, conditional logic, validation flexibility, licensing cost, Vue
lagging React.

Research date: 2026-09-30. 14 web searches + 3 fetches run.

---

## HEADLINE FINDING: Open Formulieren (Dutch government forms platform) — direct market validation

This is the single best finding for this angle and ties directly to the product's target geography
(NL/EU, government/standards-heavy domains).

**What it is**: "Open Formulieren" (a.k.a. Open Forms) is an open-source dynamic forms platform
built for Dutch municipalities, developed by **Maykin Media** in collaboration with **Dimpact**,
the municipalities of **Utrecht, The Hague (Den Haag), Rotterdam**, and the SED organisation.
Procured via a public tender that Maykin won; first released ~early 2022; as of the research
window it's used by "approximately forty public organisations." It follows the Dutch government's
**Common Ground** principles and integrates with ZGW APIs, Haal Centraal, StUF-ZDS, StUF-BG.
Partners/resellers around it include **xxllnc, Delta10, Daadkracht, GemeenteOplossingen (GEMMA
eFormulieren), opengem.nl**. It sits on top of **Form.io's formio.js renderer** (they maintain
their own fork/renderer: `open-formulieren/formio-renderer`).
Sources:
- https://www.maykinmedia.nl/blog/2023/feb/14/maykin-open-formulieren/
- https://www.maykinmedia.nl/en/portfolio/project/open-formulieren/
- https://xxllnc.nl/nieuws/xxllnc-start-samenwerking-met-maykin
- https://www.dimpact.nl/nieuws/mijlpaal-voor-open-formulieren-bouw-open-source-oplossing-gestart/
- https://www.raakvlakadvies.nl/cases/doorontwikkeling-open-formulieren
- https://maykin.nl/nl/producten/open-formulieren/
- https://opengem.nl/producten/open-formulieren/
- https://open-forms.readthedocs.io/en/3.5.1/manual/forms/logic.html (dynamic forms / JSON-logic docs)
- GitHub org: https://github.com/open-formulieren

**Why this matters**: this is proof that (a) Dutch municipalities/government actively fund and
build custom dynamic-forms infrastructure rather than buying an off-the-shelf SaaS, (b) there's an
established ecosystem of small Dutch dev shops (Maykin, Delta10, Daadkracht, xxllnc,
GemeenteOplossingen) who win contracts building/customizing/extending this kind of tooling for
municipalities — exactly the "resellable customization" business model the client wants, and (c)
their chosen foundation (Form.io) has concrete, documented limitations in exactly the areas this
library is built to handle well (repeatable sections + per-item conditional logic, wizard
step validation).

### Exact documented pain point: repeating groups + per-item conditional logic

**GitHub issue**: https://github.com/open-formulieren/open-forms/issues/2441 — "Repeating groups:
No possibility to use logic for each item in a group"
- Opened 2022-12-07 by user **LaurensBurger**.
- Quote/paraphrase: "It is impossible for a repeating group to have items that contain hidden
  fields that are triggered by logic within each item." You can address `RepeatingGroup.0.FieldA`,
  `RepeatingGroup.1.FieldA`, etc. in a lookup, but the logic *action* has no way to say "this
  applies within item N" — so per-item conditional show/hide inside a repeatable group doesn't
  work.
- Use case cited: "within each item Field C should be shown if Field A is between 5 and 10" (a
  conditional field nested inside a repeatable group item).
- Internal references indicate this affected **multiple municipalities** (Utrecht, Den Haag,
  Rotterdam are named in the issue thread per the fetch).
- No working workaround mentioned other than moving the field outside the repeating group
  entirely — which defeats the purpose.
- **This is precisely the "array of choice/conditional children" shape this library's
  metadata tree already models** (maxOccurs>1 arrays containing choice/conditional nodes,
  independently evaluated per item via each item's own DynamicFormItem instance). Directly
  productizable talking point: "we solved the exact repeating-group-with-per-item-logic problem
  that Dutch municipalities' own forms platform still has open."

### Related: repeating groups (editgrid) implementation issue on the renderer itself

https://github.com/open-formulieren/formio-renderer/issues/36 — "Implement repeating group
(editgrid)"
- Renderer team's own scoping issue, marked "tricky", targeted at "Renderer 1.0" milestone.
- Named challenges: nested components inside repeating rows (label/key/conditional visibility per
  row), conditional visibility evaluation both for saved data display and for editable rows,
  validation at both the per-field and per-row level, preventing submission while a row is
  "pending"/unsaved, and — again — conditional logic being global vs. needing to be scoped per
  list item.

### Formio.js upstream: nested/repeatable forms are a recurring source of bugs

Several concrete GitHub issues on `formio/formio.js` (the engine underneath Open Formulieren and
many enterprise forms products):
- #811 — "Multi-level Nested forms resource / submission assignment unpredictable behavior"
- #1686 — "[BUG] Nothing happens when submitting with nested form"
- #2703 — "[BUG] FormIO Nested Forms within Wizard failing to load data properly" — nested forms
  *inside a wizard* fail to load data correctly, and when there are two nested forms where the
  second is conditionally shown, data only populates correctly if it's on the first wizard page.
- #5987 — "Better error handling of subform/nested forms when they fail to load" — when a nested
  form fails to load, Formio just renders "loading..." forever, no error surfaced.
- #965 — "Many nested forms a lot of request" — a root form with ~20 nested forms shown by
  condition fires all 20 network requests simultaneously, causing a 2-4 second UI freeze.
- #1492 — "[BUG] Conditional logic on wizard causes weird behaviour" — selecting a radio option
  inside a conditionally-shown wizard page (when using Choices.js as the dropdown widget)
  unexpectedly triggers form submission. Reporter quote: "If you select any of the radio option
  the page then tries to submit. This seems to be an issue when you use choicesjs as the drop
  down list." Version 4.0.0-rc.12. Low visible engagement (recent/isolated) but illustrates
  wizard+conditional-logic fragility.

Source list for formio.js issues:
- https://github.com/formio/formio.js/issues/811
- https://github.com/formio/formio.js/issues/1686
- https://github.com/formio/formio.js/issues/2703
- https://github.com/formio/formio.js/issues/5987
- https://github.com/formio/formio.js/issues/965
- https://github.com/formio/formio.js/issues/1492

### Form.io's own positioning confirms it's infra-heavy, not for small teams

From Form.io's own blog post "Why You Shouldn't Use Form.io If You Don't Have a Dev Team":
https://form.io/why-you-shouldnt-use-formio-if-you-dont-have-a-dev-team/
- "Form.io's architecture assumes that developers are involved in initial setup, ongoing
  integration, and production deployment." Self-hosted deployments require you to manage your own
  upgrades ("Form.io releases new versions regularly and applying those updates is your
  responsibility").
- Confirms Form.io positions itself against Google Forms/Typeform/Jotform for exactly the
  regulated/enterprise segment (government, healthcare SaaS, insurers, banks) that this library's
  context targets — i.e., the same buyers, but Form.io demands a bigger integration/dev
  commitment than a template-driven Vue library would.

---

## SurveyJS: licensing cost & theming/CSS friction

**Pricing** (https://surveyjs.io/pricing, https://surveyjs.io/licensing,
https://surveyjs.io/faq/licensing):
- Free "Essential" tier; **Basic €499/developer** (one-time, perpetual); **PRO €899/developer**
  (one-time, perpetual). First 12 months of updates/support included; renewal for continued
  updates costs up to ~60% of current list price, optional.
- License is **per developer who works with the SurveyJS APIs** — not per seat of end users, but
  every dev touching the integration needs a license. For a small dev shop reselling
  customizations to multiple clients, that's a real per-project cost that a fully open/permissive
  library (MIT) undercuts directly.
- Did not find loud "too expensive" complaints in forums (mostly positive "good value" reviews
  turned up), so treat the *cost itself* as a moderate, not a slam-dunk, pain point — but the
  **per-developer licensing model** is a real structural friction for an agency reselling
  the same components across many client engagements (re-licensing per project/dev).

**Theming / custom CSS** — recurring, multi-year complaint thread on GitHub:
- https://github.com/surveyjs/survey-library/issues/2821 — "It does not seem to work to assign
  custom css classes" — users report custom classes don't apply even following docs.
- https://github.com/surveyjs/survey-library/issues/1102 — "Apply custom style to the Survey using
  JS instead of CSS class"
- https://github.com/surveyjs/survey-library/issues/2122 — "Some custom CSS not working since
  v1.7.1" — regression: custom CSS silently stopped being applied after an upgrade.
- https://github.com/surveyjs/surveyjs/issues/382 — request for specific CSS classes on generated
  elements so consumers can target/customize them (implies default markup wasn't classed enough
  to theme).
- https://github.com/surveyjs/survey-library/issues/2022 — "Impossible to customize modern theme"
- https://github.com/surveyjs/survey-library/issues/1864 — "Overriding css classes in React"
- SurveyJS has since invested in a CSS-variables-based Theme Editor
  (https://surveyjs.io/documentation/design-tokens-css-customization), suggesting they recognized
  this as a persistent pain point worth a dedicated product response — i.e., theming/white-label
  flexibility is a feature buyers actively shop for.
- **Relevance to this library**: the slot-based template architecture (user-written components own
  100% of markup/CSS, zero framework-imposed classes to fight) is a structural answer to this
  entire complaint category — "reskin per customer" is literally the stated differentiator and
  directly rebuts the SurveyJS theming pain.

---

## JSONForms (eclipsesource) — performance complaints with arrays/large schemas

- https://github.com/eclipsesource/jsonforms/issues/1290 — "Improve performance" — large uischemas
  with many components: "a simple enum change takes 5 seconds."
- https://github.com/eclipsesource/jsonforms/issues/1754 — "Performance Issues With Arrays" —
  forms containing arrays of objects: typing into one input causes a long lag, "all cells in the
  arrays re-render" on every keystroke, described as "almost unusable."
- https://github.com/eclipsesource/jsonforms/issues/1946 — Angular-specific perf issue, many
  function/iteration calls.
- Community forum threads (jsonforms.discourse.group) confirm: long render times as data grows,
  many dropdowns causing 10-second tab-switch delays.
- **Relevance**: repeatable/array sections re-rendering everything on every keystroke is exactly
  the failure mode a fine-grained per-field vee-validate `useField` registration (as this library
  does) is architected to avoid. Good evidence point for a "why we're faster on large repeatable
  forms" pitch, though I did not independently benchmark — treat as a claim to verify, not a fact
  about this library's actual performance.

---

## react-jsonschema-form (RJSF) / Winterfell / general JSON-schema-form React ecosystem

- https://github.com/rjsf-team/react-jsonschema-form/issues/464 — long-standing ask: "Implementing
  Multi Step form or Wizard form?" — no first-class wizard support in RJSF itself; users have to
  roll their own.
- https://github.com/rjsf-team/react-jsonschema-form/issues/147 — "Slow performance" issue (older,
  didn't fetch full detail — noted for completeness, not verified further).
- Winterfell (https://github.com/marcelometal/winterfell) exists specifically to add multi-page +
  conditional questions on top of JSON Schema for React, again implying vanilla JSON-schema-form
  tooling doesn't cover wizards/conditionals out of the box and people build bespoke layers.
- Form.io itself published a comparison "JSON Schema Forms Compared: RJSF vs JSON Forms vs SurveyJS
  vs Form.io" (https://form.io/json-schema-forms-formio-rjsf-jsonforms-surveyjs-compared/) — worth
  reading directly if doing a competitive-matrix piece later (only skimmed via snippet, not
  fetched in full).

---

## FormKit / Vue Formulate — Vue ecosystem note (not really a "lagging" story)

- Vue Formulate (Vue 2 forms library by wearebraid) was **not maintained as a complaint-driven
  deprecation** — it was superseded by its own successor project, **FormKit**, built by the same
  team specifically for Vue 3. Vue Formulate's own docs now say "Looking for Vue 3 support? Check
  out FormKit." (https://vueformulate.com/, https://github.com/wearebraid/vue-formulate)
  This reads as a natural rewrite-for-Vue-3, not evidence of Vue lagging React — **dead end**,
  don't cite this as an ecosystem-lag pain point without more digging.
- FormKit's own positioning claims it handles "the most demanding forms — wizards, multi-step,
  deeply nested repeating groups" (https://formkit.com marketing copy) — i.e. FormKit identifies
  the same problem space (wizards + deep repeating groups) as its own headline sales pitch,
  independently confirming that's the perceived hard part of the Vue forms space.
- Could not find a strong, citable "Vue is behind React specifically for form libraries" complaint
  thread in the time available. General "Vue ecosystem lags React by 6-18 months" commentary
  exists for meta-frameworks/tooling (RSC, shadcn/ui, Radix, TanStack) but nothing form-library
  specific and well-sourced turned up. **Treat "Vue lags React on forms" as unverified/weak for
  this research pass** — don't lean on it as load-bearing.

---

## General "form libraries are painful" sentiment (React-side, not Vue-specific)

Hacker News thread (2020): https://news.ycombinator.com/item?id=22291069 — "What's the deal with
the recommendation to use some library for managing forms?"
- **com2kh** (username as rendered: com2kid): performance complaints, "I've seen input delays on
  sites approach 500ms per character!" — poorly-built form state management (e.g. naive Redux) can
  tank performance.
- **ljm**: on maintaining a forms library dependency: "had to patch use-cases I'd never even
  thought of (good old feature creep)"; argues most form needs are "quite trivial
  implementations" and "complexity comes from working around the dependency's limited API" — a
  generic anti-library sentiment, useful context but not proving demand for *this* library.
- **couchand**: "I've spent a lot more time fighting with formik than I've ever spent just working
  with inputs directly in React."
- **zelly**: argues native HTML5 forms are enough and questions megabyte dependencies.
- **gorpomon** (counterpoint): libraries earn their keep for pristine/touched state, dynamic input
  generation, multi-step forms — "can get messy" without a library, but "libraries aren't strictly
  necessary."
- Read this thread as evidence that **generic form libraries get pushback for being
  heavyweight/opinionated for simple cases** — reinforces a positioning point: this library should
  be pitched at genuinely complex/regulated forms (its stated niche), not as a general-purpose
  input-binding library, where the complexity is actually justified.

---

## Mutually-exclusive / choice field limitation (general form-builder-market feature gap)

- Consumer form builders (Jotform threads:
  https://www.jotform.com/answers/1483386-..., .../1830970-..., .../1394448-...) confirm that
  **true mutually-exclusive choice options within a single field are not natively supported** in
  most mainstream form builders — people resort to two separate fields + conditional logic to
  clear one when the other is picked, with UX caveats (can't "unselect" cleanly).
- This validates that a first-class `choice` metadata shape (mutually exclusive branches, as this
  library already has per FEAT-001 in the repo's own history) is a genuine differentiator against
  mainstream form-builder tooling, which treats this as an afterthought/workaround rather than a
  primitive.

---

## Insurance / customs domain checks — thin results, not disqualifying

- Insurance: ACORD/AFD XML standards exist (https://schemas.liquid-technologies.com/Category/Insurance,
  https://www.manula.com/manuals/sivi/afd-definition-standard/1/en/topic/xml-files — note: AFD is
  the **Dutch insurance industry's own XML data standard**, maintained by SIVI, worth deeper
  research in a dedicated domain-angle pass). No direct "our forms tool couldn't handle ACORD"
  complaint surfaced in this pass — didn't find a smoking-gun complaint thread, just standards
  documentation. Flag for a different research angle (industry-specific) rather than pursuing
  further here.
- Customs: EU/HMRC customs declarations use WCO XSD schemas
  (https://github.com/hmrc/customs-declarations-information/.../WCO_DEC_2_DMS.xsd) confirming
  XSD-driven customs data exists and is government-maintained, but no specific "existing tooling
  is painful" complaint thread found in this pass. Same flag as insurance — worth a dedicated
  domain-research pass, not resolved here.
- Dead end: searches for "generate form from XSD" mostly surface old/abandoned niche tools
  (davidmoten/xsd-forms — Java/Scala, looks unmaintained; MichielCM/xsd2html2xml — small personal
  project) and a mention that Microsoft InfoPath (which could generate validated forms from XSD)
  was discontinued, with people reportedly falling back to "very time consuming" VBA macros. Worth
  one more targeted search in a follow-up pass ("InfoPath alternative XSD form 2024 2025") but not
  done here — flagging as a promising unexplored thread given this library's explicit "generate
  forms from XSD/XML schema" capability and InfoPath's discontinuation leaving a real gap.

---

## Searches run (for de-duplication in later passes)

1. SurveyJS pricing complaint expensive license
2. Form.io self-hosted complaint limitations reddit
3. "dynamic form" Vue "multi-step" wizard library reddit complaint
4. FormKit vs Formily vs JSONForms comparison complaints
5. "conditional logic" forms library white label theming limitations complaint
6. site:news.ycombinator.com dynamic forms library
7. HN thread fetch: item?id=22291069
8. reddit r/vuejs "form builder" OR "dynamic form" frustrating OR painful OR nightmare
9. github issues formio "repeatable" OR "nested" complaint upvotes
10. "JSON schema form" React "wizard" "multi-step" difficult reddit
11. SurveyJS github issues theming "white label" custom css difficult
12. "vee-validate" vs "FormKit" reddit complex forms complaint
13. GitHub fetch: open-formulieren/formio-renderer issue #36
14. "Open Formulieren" overheid dynamische formulieren XSD gemeente
15. SurveyJS reddit "per developer" license cost complaint webdev
16. "generate form" "from XSD" OR "from XML schema" library pain complaint
17. Formily alibaba complaint documentation english difficult reddit (dead end — no signal)
18. "choice" "mutually exclusive" fields form builder complaint OR limitation conditional
19. open-formulieren/open-forms github issues most commented conditional logic OR wizard OR repeating
20. Maykin Media Open Formulieren gemeenten aanbesteding formulieren
21. "StUF" OR "ZGW API" formulieren generator gemeente maatwerk kosten
22. insurance forms XML schema dynamic generation vendor complaint slow (thin)
23. customs declaration form software XSD generate EU complaint (thin)
24. GitHub fetch: open-formulieren/open-forms issue #2441 (key finding)
25. GitHub fetch: formio/formio.js issue #1492
26. reddit webdev "form.io" too expensive alternative open source (weak signal)
27. "vue-formulate" archived discontinued reason maintenance (dead end)
28. KYC loan application form Vue "conditional" "repeatable" fintech developer complaint (thin)
29. "JSONForms" github issues performance large forms slow OR scale complaint
30. Vue ecosystem "behind React" form libraries complaint 2024 2025 (weak/unverified)

## Dead ends / weak signal — don't repeat without a new angle

- Formily (Alibaba) English-documentation complaints: no signal found, searches returned unrelated
  legal/government complaint-form results.
- "Vue lags React for forms" as a specific, sourced complaint: not found; general ecosystem-lag
  commentary exists but isn't form-library-specific or well evidenced.
- Reddit-specific threads (site:reddit.com) largely didn't surface in WebSearch results for form
  library complaints — Reddit's search indexing via this tool is weak; if pursuing this angle
  further, use Reddit's own search UI directly (via browser) rather than site: queries through
  WebSearch.
- SurveyJS pricing: no loud "too expensive" complaint thread found; treat cost as a moderate,
  structural (per-developer licensing) friction point rather than a documented rage-inducing pain
  point.
- Insurance (ACORD/AFD) and customs (WCO) domain-specific complaints: standards exist and are
  confirmed real, but no specific "tooling pain" thread surfaced — needs a dedicated
  domain-focused research pass, not resolved in this angle.
