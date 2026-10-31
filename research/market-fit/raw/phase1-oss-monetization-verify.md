# Phase 1 OSS Monetization Claims — Verification Notes

Date: 2026-09-30

## 1. SurveyJS pricing / bootstrapped revenue

Searches: "SurveyJS pricing 2026 Basic Pro Enterprise perpetual license"; WebFetch on
https://surveyjs.io/pricing; https://surveyjs.io/renewals-and-upgrades; "SurveyJS getlatka
revenue team size bootstrapped no VC".

- Fetched surveyjs.io/pricing directly: Basic $589 one-time/developer ($239 renewal), PRO $1059
  one-time/developer ($419 renewal), Enterprise starts at $2359 ($939 renewal). These numbers
  match the claim's $589 / $1,059 / $2,359 exactly.
- Renewal discount structure (surveyjs.io/renewals-and-upgrades): sliding discount off the
  *current* license fee ranging from 60% (renew within 12 months) down to a 10% floor (27+
  months since purchase/last renewal). This matches the claim's "~10-60% annual renewal fees for
  maintenance" framing (it's a discount range, not a flat renewal-fee range, but the 10-60% figure
  itself is accurate to the source).
- Not open source for paid tiers: confirmed by surveyjs.io/licensing and FAQ pages — Basic/PRO/
  Enterprise are proprietary perpetual per-developer licenses; only the free Form Library core is
  MIT.
- Bootstrapped, no VC, ~$440K revenue Dec 2025, 4-person team: getlatka.com lists the company
  under its legal name "DevSoft Baltic OÜ" — page title "How DevSoft Baltic OÜ hit $440K revenue
  with a 4 person team in..." confirms the figure as cited.
  Caveat: a second, differently-titled getlatka page for the same product ("How SurveyJS hit
  $220K revenue with a 2 person team in 2025") surfaced in the same search — likely a stale/
  different snapshot or a getlatka data inconsistency across their own listings for the same
  company. Doesn't contradict the cited $440K/4-person page, but worth flagging as noisy
  secondary-source data (getlatka figures are self-reported/estimated, not audited).

Verdict: confirmed (pricing numbers match exactly; revenue figure matches the specific cited
source, with a noted data-quality caveat on getlatka's own consistency).

## 2. Formbricks — bundled enterprise code + CLA criticism

Searches: "Formbricks open source enterprise license Docker image criticism isitreallyfoss";
WebFetch on https://isitreallyfoss.com/projects/formbricks/.

- Confirmed: Formbricks core is AGPLv3, with additional Enterprise-licensed code living in
  /apps/web/modules/ee. The official self-hosted Docker image ships with this enterprise code
  present (gated behind a license key), i.e., proprietary code is bundled into the "open source"
  self-hosted image.
- Confirmed: isitreallyfoss.com criticizes Formbricks' CLA — the plain-English "In simple terms"
  summary says contributed code "gets published under the open source AGPL license and will
  always be available to the community," but critics argue the actual legal CLA text grants
  Formbricks broader rights than that summary implies, i.e., a mismatch between the friendly
  summary and the binding terms.
- The GitHub Open-Source-Confusion-Cases issue #54 (referenced in the claim) exists and tracks
  this same case; not independently re-fetched but corroborated by the isitreallyfoss.com page
  content and description.

Verdict: confirmed.

## 3. Typebot — AGPLv3 to Fair Source (FSL) migration

Searches: "Typebot Fair Source license AGPLv3 blog 'now fair source'"; WebFetch on
https://www.typebot.com/blog/typebot-is-now-fair-source.

- Confirmed via direct fetch of the blog post: Typebot moved from AGPLv3 + commercial dual
  license to FSL-1.1-Apache-2.0 (Fair Source).
- Confirmed reasons stated in the post: (a) user confusion about whether the project was
  "really free" under the dual license; (b) AGPLv3 did not stop bad actors from forking,
  reskinning/rebranding, plugging in their own payment processor, and rebilling the product
  while still pulling upstream code updates without contributing back; (c) the maintainer
  (Baptiste) explicitly admitted the license was hard to fully digest, saying "I did not myself
  read it entirely."
- FSL converts to Apache 2.0 after two years, matching the claim.

Verdict: confirmed.

## 4. FormKit Pro pricing

Searches: "FormKit Pro pricing single domain enterprise unlimited domains"; WebFetch on
https://formkit.com/pro.

- Confirmed: FormKit core is MIT; Pro is a separate proprietary component library.
- Pricing per direct fetch: Single Domain $149 one-time (1 project, 1 domain); Multi-Domain $149
  one-time (1 project, unlimited domains) — note both single- and multi-domain individual plans
  are currently listed at the same $149 price point per the fetched page (multi-domain marked
  "Most Popular"); Enterprise starts at $1,250 one-time.
- Confirmed: Pro inputs work free and unrestricted on localhost and dev/staging subdomains
  without a license key; payment only required for production deployment.

Verdict: confirmed (numbers match the claim's $149 single-domain and $1,250+ enterprise
figures; the claim doesn't mischaracterize anything, though note current site pricing shows
single- and multi-domain both at $149, which aligns with rather than contradicts the claim).

## 5. Sidekiq / Mike Perham revenue trajectory

Searches: "Mike Perham Sidekiq revenue solo business $80k/month 2017"; "Mike Perham Sidekiq
Inspec '$10 million' two projects revenue".

- Confirmed: IndieHackers podcast #016 (May 2017) reports Perham grew Sidekiq revenue to
  $80,000/month without hiring anyone, consistent with the claim's "$80K/month (2017)" figure.
- Confirmed (directionally): later sources (YouTube "The solo project making $10M a year -
  Sidekiq Case Study," startingandsustaining.com interview, saas.group podcast) describe Perham
  eventually reaching roughly $10M/year in aggregate across Sidekiq and his second project
  (Inspeqtor), run essentially solo. One source (saas.group) headlines "Bootstrapping a SaaS to
  $7M solo," and another (2020, COSS Community) cites "approaching $10 million all-time for the
  project over the last 8 years" (cumulative, not annual) — so the exact $10M figure is
  reported inconsistently across sources: some describe it as annual run-rate, at least one
  describes it as cumulative lifetime revenue. The claim's "~$10M/year across two projects" is
  the version repeated by the most recent case-study sources (YouTube/daily.dev), but it is not
  uniformly corroborated; treat the annualized $10M figure as directionally right but softer
  than the $80K/month 2017 figure.

Verdict: confirmed for the $80K/month 2017 figure (solid primary-ish source); unverified/soft
for the precise "~$10M/year" framing (multiple sources disagree on whether $10M is annual or
cumulative, and one credible source states $7M). Overall claim treated as confirmed with a
noted precision caveat on the $10M figure.

## 6. Tally — freemium conversion and ARR/team size

Searches: "Tally blog 'from 2 to 3m arr' bootstrapped tiny team conversion rate".

- Confirmed: blog.tally.so post "From 2 to $3M ARR: How We Bootstrapped Tally With a Tiny Team"
  exists and matches the claim's $2-3M ARR figure.
- Team size discrepancy: the claim states a "5-person bootstrapped team," but the primary
  source itself (per search synthesis) describes the team as 8 people (4 full-time, 4
  part-time) at the time of the $3M milestone; a separate Tally blog post ("We crossed $2M ARR
  with a Bootstrapped Team of 5") does use the "team of 5" framing at the earlier $2M ARR
  milestone. So "5-person team" is accurate for the $2M milestone post but the $2-to-3M
  milestone post itself cites 8 people. The claim conflates the two posts' team-size figures.
- Did not find explicit confirmation of the "~2% free-to-paid conversion" figure in the search
  snippets returned; this sub-claim remains unverified pending a direct read of the full blog
  post (search only returned summaries/other Tally posts, not this specific stat).

Verdict: unverified. ARR figure ($2-3M) and bootstrapped/no-VC status are corroborated, but the
"~2% conversion" figure was not found in available sources, and "5-person team" appears to
describe an earlier ($2M ARR) milestone rather than the $2-3M ARR milestone the claim cites
(where the team was reportedly 8 people). Flagged as loadBearing: false in the source list, so
lower priority, but the note should be corrected in downstream use.
