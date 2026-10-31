# Phase 1 pain-points fact-check notes

Verification pass on 6 claims about Open Formulieren, SurveyJS, and formio.js. All fetches done via WebFetch/WebSearch on 2026-09-30.

## 1. Open Formulieren GitHub issue #2441 (repeating groups, no per-item conditional logic)

Fetched https://github.com/open-formulieren/open-forms/issues/2441 directly.

- Title: "Repeating groups: No possibility to use logic for each item in a group"
- Body contains the exact quoted sentence: "It is impossible for a repeating group to have items that contain hidden fields that are triggered by logic within each item."
- Example given: Field C inside a repeating-group item can't be conditionally shown based on Field A in the same item; logic only works if Field C sits outside the group.

Verdict: CONFIRMED. Quote matches verbatim.

## 2. Open Formulieren origin (Maykin, public tender, Dimpact, Utrecht/Den Haag/Rotterdam, ~40 orgs)

Checked https://www.maykin.nl/en/portfolio/project/open-formulieren/ (redirected from maykinmedia.nl), https://opengem.nl/producten/open-formulieren/, https://www.dimpact.nl/nieuws/mijlpaal-voor-open-formulieren-bouw-open-source-oplossing-gestart/ (dated 25 June 2021), and https://www.raakvlakadvies.nl/cases/doorontwikkeling-open-formulieren (via search).

Findings:
- Maykin did win a public tender ("Maykin won de aanbesteding om de nieuwe e-formulieren-oplossing te ontwikkelen") per the Dimpact June 2021 article.
- Original development partners named in that 2021 article: Dimpact (10 member municipalities), Utrecht, Den Haag, SED organisatie, RID De Liemers, plus municipalities Bodegraven-Reeuwijk, Haarlemmermeer, Horst aan de Maas, Leidschendam-Voorburg, Noordoostpolder, Venray, Vught. Rotterdam is NOT in this original 2021 partner list.
- Rotterdam's involvement is real but came later: Raakvlak Advies describes Rotterdam financing/commissioning a "doorontwikkeling" (further development) project via Dimpact with Maykin and Eviden, and Rotterdam was an early adopter of Open Formulieren integrated with e-Suite. So "built... with municipalities of Utrecht, Den Haag, Rotterdam" slightly overstates Rotterdam's role as a founding builder; it's more accurate to say Rotterdam joined as a later development/funding partner and adopter.
- Organisation count: the current maykin.nl project page states "meer dan 50 organisaties" (more than 50 organisations) use it, not ~40. A separate search snippet (likely an older/cached meta description) said "approximately forty". Since the live page currently says 50+, the ~40 figure appears outdated.

Verdict: UNVERIFIED (mixed) - the tender/Maykin/Dimpact/Utrecht/Den Haag portion confirms; Rotterdam's role as a founding builder is imprecise (later-phase partner, not original); and "~40 organisations" conflicts with the current site's "more than 50 organisations."

## 3. Ecosystem of Dutch shops selling Open Formulieren services (Maykin, Delta10, Daadkracht, xxllnc, opengem.nl)

Checked https://www.delta10.nl/solutions/open-formulieren directly, plus web search on Daadkracht/xxllnc/opengem.nl.

- Delta10 page confirms implementation services: functional/technical implementation (3-6 month timeline), multi-step form/logic configuration, integrations (STUF-ZKN, ZGW APIs, payment platforms, BRP/trade registers), training, support, hosting.
- Daadkracht: "supports government organizations with the implementation, configuration and further development of Open Formulieren," with named municipality clients (Venlo, Roermond).
- xxllnc: collaborating with Maykin on further development of Open Formulieren; has its own forms product (xxllnc Cloud) tied into it.
- opengem.nl: lists Open Formulieren as a product, describes integration/feature set, functions as a product/community directory rather than a paid-implementation vendor in the same sense as Delta10/Daadkracht.

Verdict: CONFIRMED for Maykin, Delta10, Daadkracht, xxllnc as vendors offering implementation/customization/extension services around Open Formulieren. opengem.nl reads more like a product listing/community site than a services vendor, so the "ecosystem of small dev/consultancy shops" framing is accurate for the other four but slightly loose for opengem.nl specifically.

## 4. SurveyJS custom CSS issue #2122 + later Theme Editor

Fetched https://github.com/surveyjs/survey-library/issues/2122 directly.

- Title: "Some custom CSS not working since v1.7.1"
- Body: custom CSS for question titles disappears after upgrading to v1.7.1+; reporter suspects other classes affected too; milestone v1.7.5.

This confirms one instance of the CSS-breaking-on-upgrade pattern. Did not independently re-verify "recurring, multi-year sequence" (would need to pull multiple additional issues across years) or the causal claim that this pattern is what led SurveyJS to build a dedicated CSS-variables Theme Editor - SurveyJS does have a documented Theme Editor with CSS variables in its current docs, which is consistent with, but not proof of, that causal motivation.

Verdict: CONFIRMED for the #2122 issue's existence and content; UNVERIFIED for the broader "recurring multi-year sequence" and the causal link to the Theme Editor's creation (plausible but not independently substantiated here).

## 5. Open Formulieren renderer scoping issue #36 (editgrid: per-item visibility, per-row validation, unsaved rows)

Fetched https://github.com/open-formulieren/formio-renderer/issues/36 directly.

- Title: "Implement repeating group (editgrid) #36"
- Body includes a "Tougher challenges" section with: evaluating conditional visibility per nested component per item, handling item-level validation errors, and validating there are no pending unsaved items before submission.
- Labeled "tricky," part of Renderer 1.0 milestone.

Verdict: CONFIRMED. Matches claim closely (per-item conditional visibility, per-row validation, unsaved-row submission guard, all flagged as tricky/unresolved architectural challenges).

## 6. formio.js nested-forms-in-wizard bugs (#2703, #965)

Fetched both issues directly.

- #2703: "[BUG] FormIO Nested Forms within Wizard failing to load data properly" - confirms data populates fine for a nested/conditional form on the wizard's first page but fails for the second conditional nested form on subsequent pages.
- #965: "Many nested forms a lot of request" - confirms ~20 conditionally-shown nested forms all fire requests simultaneously on render, causing a reported 2-4 second UI freeze; reporter requests lazy loading.

Verdict: CONFIRMED for both issues, content matches the claim closely.

## Summary of corrections needed

- Claim 2: soften "built by ... municipalities of Utrecht, Den Haag, Rotterdam" - Rotterdam was a later-phase development/funding partner and early adopter, not one of the original 2021 tender-era build partners (Utrecht, Den Haag, SED organisatie, Dimpact, RID De Liemers were). Also update "~40 public organisations" to "more than 50 organisations" per the current Maykin project page.
