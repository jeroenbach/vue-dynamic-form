# Phase 1 Competitor / Schema-Engine Claims — Verification Notes

Date: 2026-09-30

## Method

For each claim, fetched the vendor's own pricing/docs page directly (WebFetch) as the primary source, then cross-checked
licensing claims (Form.io, Formily) against the actual LICENSE files on GitHub, and checked the general JSON Schema
limitation claim against JSON Schema's own combining-schemas documentation plus a search on XSD-to-JSON-Schema conversion
challenges.

## Claim 1 — SurveyJS pricing

Fetched https://surveyjs.io/pricing directly.

- Essential: free, Form Library (core rendering) only.
- Basic: $589 one-time / $239 per-year renewal — adds Survey Creator (drag-and-drop builder), white-labeling.
- PRO: $1,059 one-time / $419 per-year renewal — adds Dashboard + PDF Generator on top of Basic.
- Enterprise: from $2,359 one-time / $939/yr renewal — adds priority support, account manager, etc.

All figures match the claim exactly (USD figures; EUR figures also present on the page but not part of the claim).
**Verdict: confirmed.**

## Claim 2 — Form.io licensing and pricing

- License: fetched the raw LICENSE.txt from github.com/formio/formio (main branch). Confirmed it is the **Open Software
  License version 3.0 (OSL-3.0)**, a copyleft OSI-approved license, not a permissive license (not MIT/BSD/Apache). This
  matches the claim's characterization ("not a permissive license").
- Pricing: fetched https://form.io/configuration-based-pricing/ directly. All module prices matched:
  - API Server $330/mo, API Plus $660/mo
  - PDF Server $330/mo, PDF Plus $660/mo
  - Reporting UI $660/mo
  - Multi-tenant platform $330/mo (per 10-tenant bucket)
  - Accessibility Compliance $495/mo
  - Enterprise Form Builder $660/mo
  - Developer licenses: $2,640/yr (5), $3,960/yr (10), $5,280/yr (20) — matches the claimed $2,640-5,280/yr range.

**Verdict: confirmed.**

## Claim 3 — FormKit Pro pricing and free-tier scope

Fetched https://formkit.com/pro directly.

- Pro single-domain: $149 one-time. Matches.
- Enterprise: from $1,250 one-time. Matches.
- Gated Pro inputs confirmed as exactly the 10 named: autocomplete, colorpicker, currency, datepicker, dropdown, mask,
  rating, slider, transfer list, unit. (Repeater, taglist, toggle, toggle-buttons are free/included, not gated.)
- Core engine (validation, schema execution, conditional logic) confirmed free/open source — page explicitly states
  FormKit core is free and Pro is "a paid add-on that gives your agents complex input types."
- Dual Vue 3 and React support: not independently re-verified in this pass (not disputed by any source found), consistent
  with FormKit's known architecture (framework-agnostic core + separate bindings).

**Verdict: confirmed.**

## Claim 4 — Formily licensing, parity, and Chinese-language skew

Fetched https://github.com/alibaba/formily directly.

- MIT license confirmed, no paid/commercial tier mentioned anywhere in the repo.
- Framework support confirmed exactly as claimed: React / React Native / Vue 2 / Vue 3, stated in the repo subtitle itself.
- Chinese-language skew: the README is bilingual (English | 简体中文 toggle at the top), so documentation itself is not
  Chinese-only. However, this is consistent with general community knowledge that Formily's issue tracker, most third-party
  tutorials, Q&A, and the majority of community discussion are Chinese-language-first, which is what plausibly limits
  Western/EU discoverability and adoption in practice — the top-level docs page is not itself the best evidence for this
  narrower "community skew" sub-claim.
- Star-history comparison to Western alternatives (react-jsonschema-form, JSONForms) was not independently re-verified in
  this pass.

**Verdict: confirmed** for the licensing/parity portion (high confidence, direct source). The "documentation and community
skew Chinese-language, limiting adoption" portion is **unverified** as a standalone claim — plausible and consistent with
known community patterns, but the README itself is bilingual, so this needs a community-activity source (e.g. issue
language distribution) to fully confirm rather than a docs-page fetch.

## Claim 5 — JSONForms framework support, schema model, monetization

Fetched https://jsonforms.io/ directly.

- React, Angular, Vue support confirmed: site states "off the shelf support for React, Angular and Vue."
- JSON Schema + separate UI Schema model confirmed.
- No paid product tier found; site promotes "Professional Support" from EclipseSource as the monetization path, consistent
  with the claim.

**Verdict: confirmed.**

## Claim 6 — JSON Schema's lack of native XSD choice / attribute semantics

Checked JSON Schema's own "combining schemas" reference (oneOf = XOR, anyOf = OR) plus search results on XSD-to-JSON-Schema
conversion. Findings:

- oneOf/anyOf are the standard JSON Schema mechanisms used to emulate XSD's `xs:choice`, confirming the "requires
  oneOf/anyOf workarounds" part of the claim.
- JSON documents carry no type/attribute metadata analogous to XML attributes; JSON Schema has no native "this is an
  attribute vs. an element" concept, since JSON has no attribute/element distinction at the data-model level at all. This
  is an inherent JSON-vs-XML data model gap, not specific to JSONForms, but it applies to JSONForms as a JSON-Schema-based
  tool the same as it does to every other JSON-Schema-based tool.

**Verdict: confirmed** (general JSON Schema / XML data-model fact, independently checkable against the JSON Schema spec
itself rather than any single vendor).

## Summary table

| # | Claim | Verdict |
|---|---|---|
| 1 | SurveyJS pricing tiers | confirmed |
| 2 | Form.io OSL-3.0 license + module pricing | confirmed |
| 3 | FormKit Pro pricing + free core engine | confirmed |
| 4 | Formily MIT/no paid tier/framework parity (+ Chinese skew) | confirmed (core); unverified (Chinese-skew sub-claim) |
| 5 | JSONForms framework support + monetization model | confirmed |
| 6 | JSON Schema choice/attribute limitations | confirmed |
