# Phase 1 research — How comparable OSS form/survey tools monetize

Angle: SurveyJS, Form.io, Formbricks, Typebot, Tally, HeyForm, OhMyForm and similar. Business
model, pricing, public signals of what works, community friction over licensing. Conclusion for
a solo Dutch freelancer with an MIT Vue library + services.

Date of research: 2026-09-30.

---

## SurveyJS (DevSoft Baltic OÜ, Estonia)

**Model: proprietary commercial license, one-time perpetual developer license + optional annual
maintenance subscription.** NOT dual-licensed, NOT open-core in the classic sense — the paid
components are simply not open source; only a "core" evaluation copy is visible on GitHub for
non-commercial/eval use.

- Pricing page: https://surveyjs.io/pricing
  - Essential (free): Form Library only, open-source access, unlimited forms/submissions, no
    watermark, multi-framework (React/Angular/Vue3/Knockout).
  - Basic: $589 one-time per developer ($239/yr renewal) — adds Survey Creator (drag-drop
    designer, white-label).
  - PRO: $1,059 one-time ($419/yr renewal) — adds Dashboard + PDF Generator.
  - Enterprise: from $2,359 one-time ($939/yr renewal) — technical account manager, priority bug
    fixes, code review sessions, custom feature development.
  - Volume discount up to 35% for 2+ licenses. 90-day money-back guarantee. Renewal-lapse penalty
    softened: even years later you still get "at least 10%" off, not full price.
- Licensing FAQ: https://surveyjs.io/faq/licensing
  - Per-developer pricing (not per app/deployment/end-user). Free for prototypes/POCs/eval, no
    time limit on eval use, but production use requires a license.
  - Explicit anti-competitive clause: cannot redistribute components as a standalone dev tool or
    let customers build competing software; cannot use in apps that compete with SurveyJS.
  - Non-commercial/open-source (as in: not-for-profit) projects are exempt from the license
    requirement — commercial end-developers are not.
  - Data stays in the customer's own DB; no usage-based limits (forms/submissions/users) — pure
    per-seat, not metered.
- Company: bootstrapped, no VC. Revenue (getlatka.com, self-reported financials):
  $220K (mid-2025) → $440K (Dec 2025) with a 4-person team. Founded 2015, so ~10 years to reach
  this scale, but lean and profitable-looking.
  https://getlatka.com/companies/surveyjs.io
- No direct evidence found of Reddit/HN backlash specifically about SurveyJS pricing being
  "expensive" — searches came up empty on that specific friction. Worth noting as a **dead end**:
  did not find community complaints, which may itself be a signal that the per-developer
  perpetual model is perceived as fair/predictable rather than exploitative.

**Relevance:** SurveyJS is the closest analogue to this project in scale and positioning (small
bootstrapped team, form/survey infra, JS/TS ecosystem, several UI framework bindings). The
per-developer one-time-license model funds ~4 people at moderate revenue without VC. It is *not*
MIT — the commercial tiers are fully proprietary source, unlike vue-dynamic-form's MIT posture.

---

## Form.io

**Model: open-core, but skewed hard toward paid — "open source" core server (OSL-3.0) + a much
richer enterprise product priced as infrastructure-based subscription (not per-seat, not
usage-metered).**

- https://form.io/configuration-based-pricing/
  - Explicitly rejects per-form/per-submission/per-user/per-API-call pricing — markets this as a
    differentiator vs. usage-based SaaS competitors (this is a positioning statement worth
    reusing/contrasting against).
  - Enterprise Project: $330/mo (minimum 1). API Server $330/mo or API Plus $660/mo (per
    environment — dev/test/prod each need one, so real cost multiplies quickly, e.g. 3
    environments × $330 = ~$1,000/mo before add-ons).
  - Optional modules, all recurring monthly: PDF Server $330 or Plus $660, Reporting UI $660,
    Accessibility Compliance $495, Enterprise Form Builder $660, Multi-tenant (10 tenants) $330.
  - Developer licenses (separate from the above) $2,640–$5,280/YEAR for 5–20 seats.
  - SaaS (portal.form.io): $300/mo flat, 1M submissions/mo, "limited compliance features" (i.e.
    upsell path from SaaS to self-hosted enterprise for compliance-heavy customers — relevant
    parallel for government/insurance customers).
  - 30-day trial, no card required for SaaS.
- Deployment: enterprise self-hosted ships as Docker containers into the customer's own
  infrastructure/DB — i.e., they sell the *product*, not the hosting. This is structurally close
  to a "sell a customized template + support contract, customer hosts it themselves" model.
- Open source core: https://form.io/open-source/ — form builder, renderer and data-management
  libraries genuinely public on GitHub (github.com/formio), actively tagged as of July 2026.
- No specific Reddit/HN pricing-complaint thread found (searches for "Form.io reddit pricing
  complaint" returned generic form-builder alternative lists, not friction threads) — **dead
  end**, don't re-search this without a different phrasing.
- Found via search but not deeply explored (belongs to a different angle — competitor landscape):
  Orbeon Forms — a commercial XForms/schema-driven forms product explicitly marketed at
  government/insurance/public-sector, i.e. a direct conceptual competitor to what
  vue-dynamic-form could become for XSD-driven government forms. Worth another agent picking this
  up. https://doc.orbeon.com

**Relevance:** Form.io proves the "configuration/environment-based enterprise pricing, self-host
in the customer's infra, no usage metering" model works commercially in the exact
government/insurance-adjacent compliance space this project's XSD angle targets. But it needs a
real product (builder UI, hosting/API server, PDF, reporting, accessibility modules) behind it —
not just a rendering library — to justify that pricing. Too heavy a lift for a solo freelancer
today; more a north star for years 2-3 if a product (not just services) emerges.

---

## Formbricks

**Model: open-core, AGPLv3 core + proprietary Enterprise License for advanced features, plus a
hosted Cloud SaaS. VC-backed (unusual among this set) despite an "indie/bootstrapped" image.**

- Pricing: https://formbricks.com/pricing
  - Cloud: free Hobby tier capped at 250 responses/mo (as of July 2026, tightened over time —
    a **pricing-tightening signal**, i.e. free tier got stingier, common pattern once VC pressure
    for revenue kicks in). Paid Cloud tiers: Startup $49/mo, then $74/mo, then $325/mo.
  - Self-hosted (AGPLv3): unlimited responses, no per-response fee, run-it-yourself Docker,
    roughly $5-15/mo in raw infra cost on something like Railway.
  - Cloud data processed in EU infra, GDPR-compliant — relevant messaging for EU/NL customers.
- Funding: Pre-seed led by OSS Capital (a VC specializing in open-source companies), announced
  Nov 2023. Revenue: ~$550K ARR (self-reported/estimated via getlatka.com) with a 9-person team,
  Kiel, Germany. https://www.crunchbase.com/organization/formbricks
  https://getlatka.com/companies/formbricks.com
- **Community friction — the most useful signal for this angle.** A dedicated "is it really
  FOSS" critique exists: https://isitreallyfoss.com/projects/formbricks/ and
  https://github.com/ssddanbrown/Open-Source-Confusion-Cases/issues/54
  - Complaint: the official self-hosted Docker image bundles proprietary Enterprise-licensed code
    alongside the AGPL core, so what's *marketed* as "open source, self-host it" is not what you
    actually get by default — you're running non-AGPL code even when self-hosting the "open
    source" image.
  - Complaint: the CLA's plain-English summary ("your code stays AGPL forever") allegedly doesn't
    match the actual legal terms, which permit Formbricks to do more with contributed code than
    the summary implies.
  - Complaint: marketing pages lean heavily on "open source" as a trust signal while the
    underlying structure is open-core-with-asterisks, which reads to some community members as
    open-washing once you hit VC funding + Enterprise License.
  - Takeaway for this project: **"MIT-licensed and mean it" is a differentiator, not just a
    legal choice.** Explicitly avoiding AGPL/CLA/bundled-proprietary-code tricks is a trust
    argument to make to prospective customers who have been burned by or are wary of this pattern
    (public sector / enterprise procurement teams in particular tend to have OSS-compliance
    checklists that flag exactly this kind of thing).

**Relevance:** Formbricks shows the VC-backed open-core-survey-tool path is fundable and can
reach ~$550K ARR in ~2 years with 9 people, but it also shows the reputational cost of open-core
ambiguity. Not a good template for a solo freelancer (wrong scale, wrong capital structure), but
a useful cautionary example: don't blur "open" and "proprietary" in the same repo/Docker image if
trust with EU public-sector customers matters.

---

## Typebot

**Model: switched from AGPLv3+commercial dual license to "Fair Source" (FSL-1.1-Apache-2.0,
source-available, NOT OSI-approved) in 2024.** Self-hostable for free with unlimited chats;
premium features (WhatsApp integration, SSO) require a paid license even self-hosted.

- Blog explaining the switch: https://www.typebot.com/blog/typebot-is-now-fair-source
  - Reasons given for abandoning AGPL+commercial dual license:
    1. Confusion: users didn't understand if Typebot was "really free," constant inbound
       questions about needing to buy a commercial license.
    2. AGPL itself is poorly understood even by the maintainer ("didn't read it entirely"), and
       its copyleft/network-clause scares off companies worried about exposing proprietary code.
    3. AGPL didn't actually stop free-riding: competitors could fork, reskin, add their own
       billing, and ship a competing hosted product while technically complying with AGPL.
  - Rejected BSL-style licenses too because they're not OSI-approved and risk killing community
    forks if the maintainer disappears (no incentive to fork something restrictive). FSL
    auto-converts to Apache 2.0 after 2 years, explicitly framed as protecting long-term community
    trust even though it's not "free" on day one.
  - No revenue/business-model numbers disclosed in the post.
- Cloud pricing (comparison point): from $39/mo for 2,000 chats, up to $89/mo.
  Self-hosted infra cost only, ~$5-15/mo (Railway estimate).

**Relevance:** Direct evidence that a **time-delayed source-available license (FSL/Fair Source)**
is a live, increasingly normalized alternative to AGPL dual-licensing for solo/small teams who
want to block hyperscaler/competitor free-riding without the legal complexity and trust problems
of AGPL. Relevant if this project ever wants a "delayed open source" premium tier instead of
pure-MIT-everything; less relevant if the goal stays "MIT core + paid services," which sidesteps
this problem entirely (services can't be forked).

---

## HeyForm

**Model: open-source (AGPL-3.0, after an initial GPLv3→AGPL correction) self-hostable core +
hosted Cloud SaaS, run by a small (2-person) team part-time.**

- https://heyform.net/
- Origin story via a Hacker News "Show HN" thread (originally searched as "profitable online form
  builder open-sourced" — this is HeyForm's launch/open-sourcing announcement):
  https://news.ycombinator.com/item?id=39895960
  - Founder quote on revenue: "Both of us work part-time on HeyForm and are satisfied with the
    revenue it generates." No hard numbers disclosed.
  - Licensing debate in the comments: community pushed back that GPLv3 was the wrong choice for a
    SaaS-deployable tool (GPL's copyleft doesn't trigger on network use, so a competitor could
    host a modified version without releasing source) and specifically recommended AGPL. Founder
    adopted AGPL as a direct result of this community feedback.
  - Mixed reception: some users praised the privacy/self-host angle ("resolves concerns about
    private data sent to big private companies"), others were skeptical of whether
    open-sourcing an already-modestly-profitable product was genuine altruism or a growth/marketing
    tactic.

**Relevance:** Good precedent for "small team, part-time, open-source core + hosted convenience
tier, modest but real revenue" — closer in scale to a solo freelancer than Formbricks or Form.io.
Also a concrete example of the GPL-vs-AGPL distinction mattering to a technically literate
audience: **for anything network-deployed, AGPL is what community reviewers expect if you want
copyleft to mean anything; plain GPL is seen as a loophole.** Since this project is MIT, this
particular tension doesn't apply, but it's useful context for anyone advising customers who ask
"why not just use HeyForm/Formbricks."

---

## OhMyForm

Confirmed via search only as "a lightweight open source alternative, but development has slowed
significantly" — no pricing/business-model info surfaced, and it reads as effectively inactive at
this point. **Dead end** — not worth further research time; if it's needed later, would need to
check its GitHub directly for last-commit date, but the signal (multiple sources casually noting
it stalled) is already enough to exclude it as a monetization model worth emulating.

---

## Tally

**Model: freemium self-serve SaaS (not really "open source" as a licensing story — Tally is
closed-source; included here per the task's requested comparison set even though it's not OSS).**
Included for the pure business-model comparison since it's one of the most successful
form-builder bootstrapped businesses in this space.

- https://tally.so/pricing — unlimited forms/submissions/payments/logic/file uploads/signatures
  free; Pro tier $29/mo removes the "Made with Tally" badge and the 5% commission Tally takes on
  payments processed through free-tier forms.
- Conversion: **~2% of users upgrade to Pro** (self-reported stat found via search summary of
  Tally's own blog) — useful benchmark for freemium conversion expectations in this exact
  product category.
- Growth: bootstrapped, self-funded, 5-person team, crossed $2M ARR early 2025 and reportedly
  $3M ARR more recently.
  https://blog.tally.so/from-2-to-3m-arr-how-we-bootstrapped-tally-with-a-tiny-team/
  https://www.indiehackers.com/post/this-form-builder-made-70k-in-mrr-last-month-364fe271a0

**Relevance:** Proof that pure hosted-SaaS-freemium (no open source at all) scales extremely well
in this category with a tiny team — but this is a different animal from a developer *library*.
Tally competes on end-user (non-technical form builder) UX; vue-dynamic-form competes on
developer/integrator infrastructure. Not a directly transferable model, but the ~2% freemium
conversion number and the "tiny bootstrapped team, several million ARR" existence proof are
useful data points for any future hosted-companion-product thinking (e.g., a hosted form-designer
UI built on top of the library).

---

## FormKit (Vue-specific form library — closest direct analogue)

**Model: MIT-licensed core framework + paid "Pro" component library (proprietary,
metered/domain-licensed), i.e. genuine open-core split by *component*, not by feature-flag on the
same codebase.**

- https://formkit.com/pro
  - Free: core FormKit framework (MIT), all Pro inputs work unrestricted on localhost/dev domains
    — no license needed to build and test.
  - Production Single Domain: $149 one-time — 1 project/domain, all 14 Pro inputs (autocomplete,
    tag lists, dropdowns, address fields, repeaters, etc. — the "synthetic inputs" HTML doesn't
    provide natively).
  - Enterprise: from $1,250 one-time — unlimited domains for 1 project, future Pro inputs
    included, enterprise support, telemetry opt-out.
  - Pricing is one-time/perpetual per tier (not subscription), locked in at purchase price even
    if list price rises later.
  - Also runs "KickStart," an AI form-generation product where the top tier bundles a FormKit Pro
    Unlimited license — a secondary product upselling into the same Pro license.

**Relevance: this is the single most structurally relevant precedent found.** Same ecosystem
(Vue), same "form" domain, same shape (MIT engine + paid component add-ons), similar solo/small
team origin (Justin Schroeder / FormKit). The pattern maps directly onto vue-dynamic-form: keep
the engine (metadata tree, validation, wizard logic) MIT as now, and monetize a **paid
template/slot-component package** (e.g. a polished Element Plus template pack, or
government-standard field types: BSN/IBAN/postcode validators, address lookup, eIDAS/DigiD-style
inputs) sold as a one-time per-domain license exactly like FormKit Pro's synthetic inputs. This is
a nearly turnkey monetization shape that doesn't require relicensing the core or building a
hosted platform.

---

## Cross-cutting precedent: solo-maintainer dual/open-core models outside forms

- **Sidekiq (Mike Perham)** — not a form tool, but the canonical solo-developer open-core
  precedent, worth citing as a north star: gave away the core job-processing engine, sold paid
  "expansion pack" tiers (Pro/Enterprise) with more features, grew to ~$80K/mo (2017 figure) and
  later reports of ~$10M/yr across two projects (Sidekiq + Faktory), run essentially solo.
  Motivation quote: "I don't want to dedicate thousands of hours to build something that meets my
  vision only to make zero dollars off it." Sources:
  https://www.indiehackers.com/podcast/016-mike-perham-of-sidekiq
  https://saas.group/podcasts/saas-unbound-interview-mike-perham-sidekiq/
  Relevance: validates that a solo maintainer *can* run open-core (free engine + paid expansion
  packs/support) as a full-time sustainable business, without VC, over a long multi-year horizon.
  It took years to reach that scale, so it's a horizon-setting example, not a fast-money one.

- **Polly (.NET resilience library) "Open Source Maintenance Fee"** — 2025-era model:
  MIT/free to use, but organizations earning ≥$20,000/yr from a product using Polly are asked to
  pay $20/month/org for continued maintained releases. Interesting as a *lighter-weight*,
  non-legally-binding "maintenance fee" norm distinct from a hard commercial license — more of a
  social/ethical ask than an enforced license gate. https://dev.to/gramli/polly-introduces-an-open-source-maintenance-fee-f3e
  Relevance: low-friction way to monetize an MIT library without touching the license at all —
  could be layered on top of vue-dynamic-form as a "sponsor tier with SLA" without any relicensing
  risk, though it's unlikely to be a primary revenue source for a services-led freelancer.

- General open-source business model taxonomy confirmed via multiple sources (Wikipedia
  open-core-model page, oss-watch.ac.uk dual-licensing article, opencoreventures.com "standard
  pricing model for open core," termsfeed dual-licensing-vs-open-core): the four recognized
  models are **open core** (free base + proprietary paid features), **dual licensing** (same code,
  two licenses — copyleft free / commercial paid), **hosted/managed SaaS**, and **support
  contracts / consulting**. HashiCorp's BUSL move (Terraform/Vault/Consul, MPL→BUSL, converts back
  to MPL after 4 years) cited as the highest-profile recent example of a company tightening a
  permissive-ish license specifically to block cloud-provider free-riding — a cautionary tale of
  what happens at the *other* end of the spectrum from MIT-and-services (community backlash, forks
  like OpenTofu). Not deeply explored here since it's off-angle (that's a big-company move, not a
  solo-freelancer one), but worth another agent flagging if relicensing risk is ever discussed.

---

## Dead ends / not found

- No Dutch-language findings specifically tying XSD/government forms to a commercial forms-library
  business — the "Nederland overheid digitale formulieren XSD" search surfaced only generic
  Rijksoverheid/PIANOo/TenderNed procurement-process pages and Forum Standaardisatie's XSD
  standard page, not any company selling XSD-to-form tooling to Dutch government bodies. This
  gap is itself a finding: no obvious incumbent occupies "XSD-driven forms for Dutch government
  procurement" as a productized niche yet, based on this search pass (not conclusive — a
  dedicated competitor-landscape angle should verify with Dutch-specific vendor names, e.g.
  search TenderNed archives directly rather than general web search).
- Orbeon Forms noted as a commercial XForms/schema-driven forms vendor targeting government and
  insurance (found via a tangential search) but not investigated in depth — flagged for whichever
  angle covers direct competitors.
- No Reddit/HN thread found with explicit, quotable public complaints about SurveyJS or Form.io
  pricing specifically (searched multiple phrasings). Either the friction doesn't publicly exist
  at volume, or it's not indexed/discoverable via general web search — don't keep re-searching
  this same angle without a materially different query strategy (e.g., searching GitHub issues
  directly rather than web search).

---

## Synthesis: which model fits a solo Dutch freelancer with an MIT Vue library + services?

Ranked by fit (not just theoretical appeal):

1. **Services-first, MIT-forever core (current default) — the load-bearing recommendation.**
   Every solo/small-team success story that stayed solo (Sidekiq, HeyForm, FormKit, SurveyJS's
   4-person team) either kept the code fully open/permissive and sold expertise/support, or kept
   a narrow paid layer *separate* from the core engine. None of the VC-backed open-core plays
   (Formbricks, Form.io-scale) are solo-freelancer-shaped — they require raising money or a
   multi-person team to build and sell the enterprise surface (hosting, compliance modules,
   dashboards) that justifies the price. A solo freelancer's actual scarce asset is *expertise
   applied to a specific customer's XSD/government-forms problem*, which is a services product,
   not a license product.

2. **FormKit-style paid add-on package as a secondary, low-effort revenue stream.** Keep the
   engine MIT (as now), and productize a specific, narrow paid layer: a polished template pack
   (Element Plus is already the reference template — that's the natural first candidate), or a
   set of Dutch/EU-standard field components (BSN, IBAN, postcode/huisnummer lookup,
   KVK-nummer validation, eIDAS-style identity inputs) sold as a one-time per-project license.
   This doesn't require relicensing anything, doesn't create the trust problems Formbricks hit,
   and matches exactly what FormKit Pro already proved works in the same Vue/forms space.

3. **Formbricks/Form.io-style open-core-with-hosting is not a good near-term fit** — it demands
   building and operating a hosted platform (multi-tenant, billing, uptime, support SLAs), which
   is a different business (and likely a different legal entity/team) than "one developer doing
   contract work + a library." Worth revisiting only if a first flagship customer's needs
   naturally produce a reusable hosted product (e.g., a government-forms SaaS spun out of a
   customer engagement) — i.e., product-led growth *after* a services relationship proves the
   demand, not before.

4. **AGPL/FSL relicensing is not recommended.** The Typebot and Formbricks cases show this
   mainly solves a problem (blocking hyperscaler/competitor free-riding at massive scale) that a
   pre-revenue solo Vue library does not yet have, while importing exactly the trust/confusion
   costs (Formbricks' CLA backlash, Typebot's "is this really free" support burden) that a small
   freelancer can't afford to manage. MIT is also a stronger sales point specifically for
   EU/government procurement, where OSS-license compliance checklists flag AGPL/CLA-encumbered
   projects as higher-friction than permissively licensed ones.

**Bottom line:** the evidence favors staying MIT and monetizing via (a) direct consulting/
customization services tied to a flagship customer, replicable as licensed implementations for
similar customers (the model the user already described wanting), and (b) opportunistically
layering a FormKit-style paid component/template package once there's a second or third customer
validating which add-ons are actually worth productizing. Do not chase the Form.io/Formbricks
hosted-platform model until a customer engagement organically produces the demand for one.
