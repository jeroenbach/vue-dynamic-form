# Phase 2 raw notes: Named Vue/Nuxt agencies (NL/BE/DACH) as partners/customers

Angle: agencies/dev shops that could be white-label template pack customers or complex-forms subcontracting partners, prioritizing those serving government, insurance, or logistics clients.

Date of research: 2026-09-30.

## Source: github.com/vuejs-nl/who-use-vuejs-in-netherlands
URL: https://github.com/vuejs-nl/who-use-vuejs-in-netherlands
- Nearly empty / nascent directory. Only NU.nl (news/media) listed. Modeled after vuejs-jp/who-use-vuejs-in-japan.
- DRY WELL — do not re-check this repo, it has essentially no data.

## Source: nuxt.com/enterprise/agencies (official Nuxt partner directory)
URL: https://nuxt.com/enterprise/agencies?region=europe
Netherlands:
- **Passionate People** (Amsterdam) — "We provide you with additional technical capacity to power-up your digital transformation." Also listed individually at https://nuxt.com/enterprise/agencies/passionate-people
Germany:
- Magic as a Service, Wimadev (Berlin, enterprise Nuxt + Node.js backends, "big international tech corporations and well-known German brands" — no named gov/insurance/logistics clients found), SIDESTREAM (Cologne, official Nuxt Agency Partner, creator of "sidebase" fullstack Nuxt framework, 25+ Nuxt3 experts, 50+ shipped projects — no named gov/insurance/logistics clients found), Geist (Frankfurt, Shopify Composable Commerce)
Austria: drunomics (Drupal+Nuxt combo)
Switzerland: Liip AG (websites, mobile, e-commerce, org change)
Other Nuxt official partners spotted incidentally: **Epicmax** (https://epicmax.co) — official Nuxt/Vuetify/PrimeVue/VueJobs partner, 8+ yrs Vue/Nuxt, 60+ projects across E-commerce/SaaS/EdTech/FinTech, creator of Vuestic UI/Admin (16.5k+ GitHub stars), offers dedicated-team/project/expert-guidance engagement models with a 2-week trial. No confirmed gov/insurance/logistics clients but strong general Vue/Nuxt agency credibility — worth as a peer/partner contact for template-pack distribution, not evidenced as government-adjacent.
- No Belgium-based Nuxt agency found except UPDIVISION (Romania/Belgium/USA/Australia, generic product dev, no NL/gov evidence).

## Source: Vue.js Amsterdam conference sponsors
URL: https://vuejs.amsterdam/ (conference March 12-13 2026)
Sponsors found on current page (appears to show 2027 event details per fetch, so some sponsor list may already be next-year): VueJobs, Auth0 by Okta, Made with Vue.js, BitterBrains, Bryntum, Cloudflare, VueJS Berlin, MadVue, Vue Dose, VueSchool, Alokai, Storyblok, TheyDo. Twilio/Uber had booths.
- BitterBrains turned out to be the org running Vue School / Nuxt Nation / Vue.js Nation / Vue Forge / official Vue.js Certification — a fully virtual/international ed-tech company, NOT a Dutch dev agency (despite sponsoring the Amsterdam conference). Netherlands is one of their top paying-customer countries. Not a fit for this angle — it's a training/certification vendor, not an agency. DRY WELL for "agency" purposes but could be relevant as a channel to reach Vue devs (courses/newsletter) for a different angle.
- Passionate People itself runs vuejs.amsterdam, frontenddeveloperlove.com, reactlive.nl, angularnl.com (plus events in Barcelona/Paris/Berlin) — so they are both organizer and a listed Nuxt agency partner. See dedicated entry below.

## Passionate People — STRONG LEAD (partner-type)
- Official Vue.js partner (listed at vuejs.org/partners/passionatepeople.html per search snippet — page itself now 404s, likely stale partner listing but corroborated elsewhere) and official Nuxt agency (nuxt.com/enterprise/agencies/passionate-people).
- Amsterdam-based (Condensatorweg 54), founded October 2017. "Leading JavaScript Consultancy in the Netherlands." International team of full-stack consultants who "provide additional technical capacity to power-up your digital transformation" (i.e., they explicitly do staff-augmentation / capacity-extension work, not just fixed-scope projects — good sign for subcontracting fit).
- Named clients: **Ahold** (retail/logistics-adjacent), **ING** (banking/insurance-adjacent — regulated financial sector, same validation-heavy forms world), **Talpa** (media), **Port of Rotterdam** (major logistics/port authority — direct match to "logistics" angle), **GrandVision** (retail/optical).
- Services: eCommerce, Software & SaaS development, mobile apps, UI/UX, technical consulting & code audits.
- Contact: website passionatepeople.io (DNS resolution failed repeatedly in this sandbox — try again outside sandbox, or use LinkedIn/Twitter), Twitter/X @passionpeopleNL, GitHub org "passionatepeople". LinkedIn company page URL redirects oddly to nl.linkedin.com/company/devworld-conferences (possible rebrand/merger with DevWorld conference brand — needs manual verification).
- Next action: reach out via their contact form / LinkedIn referencing their Port of Rotterdam and ING work, pitch the NL Design System / WCAG form template pack or complex-forms subcontracting since they already do capacity-extension engagements with regulated-sector and logistics clients.

## Appfront — STRONG LEAD (agency serving insurance + waterschap/government)
URL: https://appfront.nl
- Amsterdam-based (Westerdoksdijk 599). Software development agency explicitly specializing in **custom insurance software** (customer portals, claims apps, integrations with policy/claims back-office systems) for insurers, volmachten (underwriting agents), and assurantietussenpersonen (insurance intermediaries). Wrote an insurance-software vendor comparison (appfront.nl/beste-verzekeringssoftware-leveranciers) positioning themselves as the custom-build alternative — this is exactly the audience for an XSD-to-form import / AFD-UPA style product.
- ALSO explicitly serves the 21 Dutch **waterschappen** (water boards — regional government bodies) with a dedicated service page: appfront.nl/diensten/web-ontwikkeling/waterschap-software-op-maat. Services: vergunning-flows (permit application workflows), dijkbeheer (dike management), calamiteiten-apps (incident apps), geo-platforms on PostGIS, Common Ground components (the same Dutch gemeente/overheid reference architecture Open Formulieren sits in). Named form-like workflows: lozings-vergunningen (discharge permits), kering-inspectie (barrier inspections), asset-register with photo/GPS capture — all classic repeatable-section-with-conditional-logic form territory.
- Frontend framework not confirmed (site content fetched doesn't specify Vue/React/Angular; job pages generic "Full-stack Software Developer," no stack named). Client logos shown on homepage: GVB (Amsterdam public transport), Erfgoed Delft (heritage org), Pharmatech — transportation/public-sector adjacent but not confirmed insurance/waterschap names.
- Contact: martijn.oele@appfront.nl, mies.brons@appfront.nl, +31 6 4080 2293. Careers page exists (appfront.nl/werken-bij) but had no stack details when fetched.
- Next action: even without confirmed Vue usage, their exact service description (permit-flow forms for government water boards + claims/policy forms for insurers) is a near-perfect articulation of what this library does. Worth a direct outreach/demo email regardless of their current stack — pitch as either a build-with-us partner or a competitive/complementary reference point. Confirm their stack by asking directly or checking a live job posting when one is open.

## Yameo — STRONG LEAD (regulated-industry software vendor/consultancy)
URL: https://yameo.eu (also .com had a TLS cert issue in this sandbox — use .eu)
- Utrecht-based (Parijsboulevard 209), Dutch-Polish, founded 2005 (21 years), "Enterprise software, built AI-native."
- Explicitly serves 6 regulated industries: **Insurance** (claims processing, policy management systems), **Banking & Financial Services** (core banking modernization, digital onboarding, fraud detection), **Healthcare** (EHR integrations, clinical workflows), **Government & Public Sector** (document management, citizen portals, workflow automation), **NGO & Humanitarian Aid** (offline-first mobile, supply-chain logistics), **Automotive** (inspection platforms, fleet management).
- Named clients with tenure: **DEKRA** (automotive inspection, 14+ yrs), **Aon** (risk management platform, 13+ yrs), **ERGO Hestia** (policy management system, 7+ yrs — this is literally an insurance policy admin system, prime AFD/UPA-adjacent territory), **Raiffeisen Bank** (core banking, 7+ yrs), **ABN AMRO** (KYC/digital onboarding, 3+ yrs), **World Vision** (item tracking/logistics, 10+ yrs), **NHIA Ghana** (national health insurance e-claims, 10+ yrs).
- Was listed as a "Vue.js agency" on Sortlist's Netherlands ranking (team 51-200, €50-99/hr, 5.0/5 from 1 review), specifically flagged there as specializing in banking/insurance/healthcare — but Yameo's own site content fetched made no explicit mention of Vue.js, forms, XSD, or XML. Stack not independently confirmed beyond the Sortlist classification.
- No careers/Vue-specific job posting found in this session (searched "Yameo careers Vue.js developer" — DRY WELL, only generic Vue job boards returned).
- Next action: given policy-management + claims + government-workflow specialization across 20 years, worth reaching out directly (Clutch profile exists: clutch.co/profile/yameo, 21 reviews) to confirm stack and pitch either partnership or the insurance/government form tooling angle. High thematic fit even with unconfirmed Vue usage.

## Digital Natives — weaker lead
URL: https://www.digitalnatives.nl/diensten/vue-js
- Amsterdam (Barentszplein 7). Explicitly a Vue.js + Nuxt specialist (headless architecture, PWA, SSR via Nuxt, reusable component toolkit). ISO 27001 certified.
- Case studies shown: Vriend van de Show (podcast platform), GreenHome (energy savings) — no government/insurance/logistics evidence.
- Contact: hello@digitalnatives.nl, +31 20 333 0880.
- Lower priority: confirmed Vue/Nuxt focus but no evidence of the target verticals.

## Sortlist Netherlands Vue.js agency ranking (20 agencies)
URL: https://www.sortlist.com/i/s/vuejs-development/netherlands-nl (fetched successfully via WebFetch despite feedbax.nl 403ing)
Full list with notes: Klein Media (Amsterdam), ONY Agency (Amsterdam), Venius B.V. (Bergen op Zoom, AI CRM/automation), Tallium Inc. (Amsterdam), Apadmi (Amsterdam, mobile specialists), **Yameo (Utrecht, banking/insurance/healthcare — see above)**, Your Digital Media (Amsterdam), Modern Day Strategy (Amsterdam), Tabs & Spaces (Rotterdam), Nevron (Amsterdam), Studio Vi (Amsterdam), MMC IT Solutions (Lelystad, SME-focused), aardig (Amsterdam, branding), Raynmakers (Eindhoven — see below), Bugloos (Utrecht, business process automation), Yojji LTD (Amsterdam, microservices), Volare Software (Hilversum, .NET/Azure enterprise), Boldheart (Amsterdam), SoftUp Agency (Amsterdam), **Capte (Amsterdam, transport-sector telemetry — see below, actually a product company not agency)**.
- feedbax.nl/vuejs/nederland returned HTTP 403 — could not fetch directly (login/bot-wall). Not re-tried; use Sortlist as the working substitute directory.

## Raynmakers (Eindhoven) — checked, not a fit
- E-commerce dev + BI/big-data consulting + custom software, small team, founded 2016, targets companies with 25M+ turnover for data-pipeline automation. No Vue-specific evidence beyond Sortlist listing category, no gov/insurance/logistics evidence. Low priority, not included as a lead.

## Capte (Amsterdam) — checked, reclassified as product company not agency
- IoT telematics platform for transit agencies/commercial fleets (diesel/electric/hydrogen/hybrid), CAN-bus data, predictive maintenance, EV charging, yard management. 110+ clients incl. **Keolis, Transdev, RATP Dev, MAN, Eaton**. Founded 2017, offices Versailles/Amsterdam/Los Angeles.
- Sortlist listed them as a "Vue.js agency" but they're actually a SaaS/hardware product company (their own frontend may use Vue internally, not confirmed) — they don't take on client dev work. Reclassified: potential **product-company prospect** for complex-forms subcontracting (driver logs, inspection/incident forms, fleet compliance forms fit the repeatable-conditional-section pattern) rather than an agency partner. Not pursued further in this session (out of strict scope for the "agency" angle) but flagged for the logistics-vertical angle if another research thread wants direct enterprise prospects.

## StarApple — checked, NOT a fit (IT staffing agency, not a dev shop)
- Multiple LinkedIn job posts over time for "Vue.js Frontend Developer" roles in Zeist/Nuenen/Eindhoven initially looked like an insurance-sector dev shop with sustained Vue investment.
- Actual starapple.nl homepage reveals they are an **HR-tech recruitment/staffing agency** ("dé HR-tech agency in interim & perm IT," 120+ active roles/month, "powered by Vertage"), placing candidates into client companies across government/corporate/tech sectors — they don't build software themselves. The Vue.js job posts are client vacancies they're recruiting for, not their own engineering roles.
- DRY WELL for "agency partner" purposes, but confirms there IS ongoing client demand for Vue.js devs in the NL insurance-adjacent space that flows through staffing intermediaries — useful signal, not a direct lead.

## Belastingdienst (Dutch Tax Authority) — BONUS FIND: direct prospect + marketplace access, not an agency but too good not to log
- Confirmed via search snippets: Belastingdienst built an in-house **Vue.js + JSON-schema forms service** that generates HTML forms from a JSON description (labels, fields, dependencies) via a JS engine, injected into third-party accounting-software vendors' web environments. Built/tested in FY2018 with 2 accounting-software vendors as part of the "AWA" (Automatische Winstaangifte / automatic pre-filled profit return) project, aiming for a standalone "AWA tax return plugin." Planned functionality: form workflows, date checks, conditional error messages, field validation, comparison conditions, expanded POST values — i.e., almost exactly the restriction/validation/conditional-field feature set of vue-dynamic-form.
- Source PDF: https://odb.belastingdienst.nl/wp-content/uploads/2021/03/AA-975-1Z-11FD_TG.pdf ("Diensten aan softwareontwikkelaars" — services to software developers) — not fetched in full this session, worth a follow-up read.
- Confirmed hiring history: a freelance assignment "Webdeveloper VUE.js" (ref 2020-MKB-0012) was posted via Need Staffing / esd.next, now redirects to https://needstaffing.nl/opdrachten/1998 (could not confirm current open/closed status — likely historical/closed, posted ~2020). Also cross-listed at freelance.nl (https://www.freelance.nl/opdracht/882123-webdeveloper-vuejs).
- Belastingdienst also has an internal "frontend developer" employee-story career page (werken.belastingdienst.nl) referencing an employee "Eric" as a frontend developer — page URL guessed/404'd in this session (tried .../persoonlijke-pagina-eric-frontend-ontwikkelaar and .../verhaal-persoonlijke-pagina-eric-frontend-ontwikkelaar-122, both failed to resolve cleanly) — needs a corrected URL via werken.belastingdienst.nl site search to confirm current stack.
- **This is not an "agency" lead** (out of strict scope for this research angle) but is strong corroborating evidence for the whole thesis: the largest Dutch government body has already built (and presumably still maintains/extends) almost exactly what vue-dynamic-form offers, using Vue.js specifically. Flagging for the municipal-forms/government angle research thread, and noting the freelance-marketplace route below as an actionable channel.

## ZiPconomy — meta-resource: directory of 200+ NL public-sector + private staffing marketplaces
URL: https://www.zipconomy.nl/organisaties/marktplaatsen/
- Catalogs the "inhuurdesks"/marktplaatsen used by Dutch public and private organizations to source freelancers/interim professionals, filterable by sector/role.
- Examples surfaced: Rijksoverheid central desk (job.ubrijk.nl), Gemeente Utrecht (werkenbijutrecht.nl/inhuur/), NS/Nederlandse Spoorwegen (inhuur-ns-com.force.com), plus Amsterdam's own procurement portal.
- **Actionable next step**: register on the relevant national/municipal inhuurdesks (starting with job.ubrijk.nl for Rijksoverheid, which would cover Belastingdienst assignments) to get visibility into live Vue.js freelance tenders at government bodies — this is the concrete "how do I actually get in front of Belastingdienst" mechanism the Open Formulieren/municipal research thread needs. Not fetched individually this session (time-boxed); worth a dedicated follow-up pass per marketplace.

## Dry wells / searches that yielded nothing useful
- "vuejs-nl/who-use-vuejs-in-netherlands" repo — essentially empty (1 company).
- "Vue.js" gemeente OR provincie OR waterschap leverancier maatwerk — generic government-water results, no Vue-specific leverancier found (Appfront's waterschap page was found via a different, more targeted query).
- "Yameo careers Vue.js developer vacature contact" — only generic Vue job-board results, no Yameo-specific posting.
- passionatepeople.io and production.passionatepeople.io — DNS resolution failures in this sandbox (getaddrinfo ENOTFOUND) on repeated attempts; site likely fine, just not resolvable from this environment. Use WebSearch snippets / cached nuxt.com profile instead, or retry fetch from a different environment.
- feedbax.nl/vuejs/nederland and techbehemoths.com/companies/vuejs/netherlands — both returned HTTP 403 (bot-walled). Sortlist worked as a substitute directory.
- appfront.nl/technologie — 404, no dedicated tech-stack page.
- Clutch.co search for "Vue.js developers Netherlands government" — no direct government-filtered results; Clutch's own site would need manual region+service filtering (not done this session).
