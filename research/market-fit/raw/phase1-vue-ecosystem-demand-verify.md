# Phase 1 Vue Ecosystem Demand Claims — Verification Notes

Date checked: 2026-09-30. Data as-of npm week 2026-09-22 to 2026-09-28.

## Claim 1: vee-validate stars/downloads vs FormKit/@jsonforms
- GitHub API `repos/logaretm/vee-validate`: stargazers_count = 11,263. Exact match.
- npm API downloads/point/last-week/vee-validate: 1,331,453 for week 2026-09-22..28. Exact match.
- npm API downloads/point/last-week/@formkit/vue: 144,312. Ratio 1,331,453/144,312 = 9.23x ("roughly 9x") — holds.
- npm API downloads/point/last-week/@jsonforms/vue: 49,170. Ratio = 27.08x ("roughly 27x") — holds.
- Verdict: CONFIRMED.

## Claim 2: vee-validate tutorial "Build a Form Generator" recommending formvuelate
- WebFetch of https://vee-validate.logaretm.com/v4/tutorials/dynamic-form-generator/ confirms: page titled "Build a Form Generator", contains the quoted line about forms being "a repetitive task and requires a lot of back and forth to maintain", and recommends Formvuelate as "a more robust solution for form generation" with "first-party vee-validate support" (appears twice).
- GitHub API repos/formvuelate/formvuelate: stargazers_count = 443. Exact match.
- npm downloads/point/last-week/formvuelate: 976. Exact match.
- Verdict: CONFIRMED.

## Claim 3: @formily/vue downloads vs alibaba/formily stars
- npm downloads/point/last-week/@formily/vue: 1,386. Exact match.
- GitHub API repos/alibaba/formily: stargazers_count = 12,594. Exact match.
- Verdict: CONFIRMED (numbers exact; the "React-ecosystem phenomenon" interpretation is a reasonable inference from the numbers, not independently fact-checked but not contradicted).

## Claim 4: Three abandoned vue-dynamic-form(s) clones
- asigloo/vue-dynamic-forms: stars = 389 (exact match). pushed_at = 2022-02-10. created_at = 2020-01-08. Time to last push ≈ 2.1 years — claim says "abandoned within 1-2 years"; actual gap is ~2 years, borderline/slightly over what "1-2 years" implies but roughly in range.
- reside-ic/vue-dynamic-form: stars = 0 (exact match). pushed_at = 2023-04-18. created_at = 2020-02-24. Time to last push ≈ 3.1 years — this CONTRADICTS "abandoned within 1-2 years." The repo was actively pushed to for over 3 years, not 1-2.
- codetheorist/vue-dynamic-form: stars = 7 (exact match). pushed_at = 2017-08-30T20:11:41Z. created_at = 2017-08-30T14:54:24Z — pushed same day as creation (a few hours later), so "last pushed 2017" is correct but the repo's active lifespan was under a day, not "1-2 years."
- Verdict: PARTIALLY REFUTED. Star counts and "last pushed" years (2022/2023/2017) are all individually correct, but the framing "all were abandoned within 1-2 years" does not hold for reside-ic (~3.1 years of activity) or for codetheorist (abandoned same day, not 1-2 years). Only asigloo is roughly consistent with a ~2-year abandonment window. Recommend rephrasing to drop the "abandoned within 1-2 years" generalization or qualify it per-repo.

## Claim 5: @jsonforms/vue downloads and positioning
- npm downloads/point/last-week/@jsonforms/vue: 49,170 (exact match, same figure reused from Claim 1 check).
- EclipseSource backing, cross-framework (React/Angular/Vue) nature, and JSON-Schema (not XSD) targeting are consistent with jsonforms.io's own documentation and general public knowledge of the project; not independently re-verified beyond the download figure and known project positioning, no contradicting evidence found.
- Verdict: CONFIRMED (download figure exact; positioning claims well-established and uncontradicted).

## Claim 6: Vueform commercial pricing vs npm/GitHub metrics
- builder.vueform.com/pricing (WebFetch): White-Label = $299/month (or $3,590/year), Enterprise = contact/custom pricing. Page as fetched did not surface separate "SDK" and "Builder" tier prices in the WebFetch summary (possibly due to JS-rendered content or page layout not captured by the fetch tool).
- WebSearch cross-check (G2 pricing page for Vueform Builder) independently corroborates: SDK from $16/month, Builder from $82/month, White-Label from $299/month, Enterprise contact-based — matching the claim exactly.
- npm downloads/point/last-week/vueform: 140. Exact match.
- GitHub API repos/vueform/vueform: stargazers_count = 1,511. Exact match.
- Verdict: CONFIRMED (pricing figures corroborated via independent G2 source since direct page fetch didn't render the SDK/Builder tiers explicitly; download/star counts exact).

## Tools used
- WebFetch against GitHub REST API (api.github.com/repos/...) for stars and created_at/pushed_at.
- WebFetch against npm downloads API (api.npmjs.org/downloads/point/last-week/...) for weekly download counts.
- WebFetch against vee-validate docs and builder.vueform.com/pricing for content verification.
- WebSearch for independent corroboration of Vueform pricing tiers (G2).
