# Phase 1 Regulated Verticals (EU) — Adversarial Verification Notes

## 1. SIVI AFD-definitie Standaard built on XSD

Searched and fetched the Manula documentation page directly (via WebSearch snippet, direct WebFetch was 403'd).

Confirmed: afdSchema.xsd, afdFormats.xsd and afdCodelists.xsd are described as the three mandatory schema files in an AFD-definitie Standaard set.
- afdSchema.xsd: foundation, defines AFD message structure, datatypes, nesting, max occurrences of elements.
- afdFormats.xsd: supporting schema, format definitions, aligns formats between afdSchema.xsd and AFD.
- afdCodelists.xsd: supporting schema, codelists and their values used in afdSchema.xsd.

This matches the claim closely (structure, nesting, code lists — "entities and attributes" is a close paraphrase of "message structure with AFD datatypes, nesting and maximum occurrences of elements").

Verdict: confirmed. Source: https://www.manula.com/manuals/sivi/afd-definitie-standaard/1/nl/topic/4-2-1-afdschema-xsd-en-sivi-hulpmiddelen (corroborated via search snippet since direct fetch 403'd; also see https://www.sivi.org/sivi-afs/sivi-afs-standaarden/afd-definitie-standaard/).

## 2. ACORD publishes P&C and Life/Annuity/Health standards as XML/XSD; used in Europe for Large Commercial/Reinsurance

Confirmed on both counts:
- ACORD Property & Casualty/Surety Standards Program has published XSD schemas (e.g. version 1.16.0, XML for P&C and Surety approved 2001/2002).
- ACORD Life, Annuity & Health Standards Program has published XSD schemas (TXLife, XLifeBase, XTbML, version 2.20.01 etc.), documented at schemas.liquid-technologies.com and acord.org.
- European Large Commercial/Reinsurance adoption confirmed: ACORD's Global Reinsurance & Large Commercial (GRLC) standards program is explicitly used across European markets — e.g. Helvetia Baloise (Switzerland/Spain/Germany/Italy/Austria/UK/France) joined the GRLC Carrier program in 2026; the Ruschlikon Initiative connects European (re)insurance back-office processes using GRLC standards.

Verdict: confirmed. Sources: https://www.acord.org/standards-architecture/acord-data-standards, https://www.acord.org/standards-architecture/acord-data-standards/Global_Reinsurance_Data_Standards, https://www.prnewswire.co.uk/news-releases/helvetia-baloises-adoption-of-acord-standards-advances-data-exchange-across-european-insurance-markets-302835432.html

## 3. Form.io self-hosted enterprise pricing starts at $300/month; verticals marketing

Partially refuted on the price point, confirmed on verticals.

Pricing: search results describe Form.io's commercial offering as "$300 a month for SaaS or $330 a month per environment for the self-hosted enterprise API server." Direct WebFetch of the pricing page found a minimum self-hosted configuration of one Enterprise Project ($330/month) plus one API Server Environment ($330–$660/month), i.e. an actual minimum self-hosted spend around $660–$990/month, not "starting at $300/month." $300/month appears to be the SaaS (not self-hosted) entry price. The claim conflates SaaS starting price with self-hosted enterprise starting price.

Correction: self-hosted enterprise pricing effectively starts around $330/month per single component (project or environment), but a functioning minimum self-hosted deployment is closer to $660/month+, not $300/month. $300/month is the cloud/SaaS tier, not self-hosted.

Verticals: confirmed independently — Form.io explicitly markets to government (e.g. HUD case study), healthcare (HIPAA-compliant healthcare forms), banking/finance (KYC onboarding for banks/fintechs), insurance (claims management), legal/compliance, matching the claim.

Verdict: refuted (pricing detail — "$300/month" is the SaaS price, not self-hosted enterprise, which starts higher, ~$330-660+/month). Verticals sub-claim: confirmed.
Sources: https://form.io/configuration-based-pricing/, https://form.io/industries/, https://form.io/compliance-forms-self-hosted-form-platforms-regulated-industries/, https://form.io/industries/healthcare-forms/, https://form.io/industries/pdf-forms-for-insurance/

## 4. EAA applicable since 28 June 2025, ACM as NL authority, fines up to €900,000 or 4% of turnover, plus daily penalties

Partially refuted — the percentage figure does not check out.

Confirmed: EAA in force across the EU since 28 June 2025; ACM (Autoriteit Consument & Markt) is the designated Dutch supervisory authority for webshops/digital services (Implementatiewet toegankelijkheidsvoorschriften producten en diensten, Stb. 2024, 87); maximum administrative fine of €900,000 is widely and consistently cited (tied to the fifth category under art. 23(4) Wetboek van Strafrecht per one source, though the exact statutory linkage is stated inconsistently across sources — one legal-code search suggests the 5th category cap is actually far lower, ~€103,000, and €900,000-1,030,000 aligns more with the 6th category, so the precise statutory citation in secondary sources is shaky, but the €900,000 figure itself is consistently and independently repeated across multiple compliance-vendor sources).

Refuted: the "4%" of annual turnover figure. Multiple independent sources (trustyourwebsite.com's own text as fetched, and other search results) state "1% van de jaaromzet," not 4%. One properaccess.nl source doesn't mention any turnover percentage at all for the Netherlands. The 4% figure could not be corroborated anywhere and appears to be either a vendor error or confusion with GDPR's well-known "4% of global turnover" framing.

Unverified: "daily penalties for continued non-compliance." The original source page did mention daily penalty payments ("dwangsom") in the WebFetch summary, but this wasn't independently corroborated by a second source (properaccess.nl made no mention of daily penalties for NL specifically), and no primary legal source was checked to confirm a daily-penalty mechanism.

Verdict: refuted (on the 4% figure specifically; correct widely-cited figure is 1% of annual turnover, not 4%). The €900k figure, June 28 2025 date, and ACM authority are corroborated.
Sources: https://www.properaccess.nl/blog/eaa-boetes/, https://digitaaltoegankelijk.nl/nieuws/europese-toegankelijkheidswet-van-kracht-hoe-zit-het-met-handhaving/, https://zoek.officielebekendmakingen.nl/stb-2024-87.html

## 5. NEN 7510 applies to software vendors, not just care providers

Confirmed. Multiple independent sources state NEN 7510 obligations extend beyond direct healthcare institutions (hospitals, GPs, pharmacies, etc.) to any party that processes, stores or manages patient data on their behalf, explicitly including SaaS/software vendors and suppliers in the healthcare ecosystem.

Verdict: confirmed. Source: https://medium.com/cyver-blog/what-is-the-nen-7510-is-nen7510-mandatory-b7c5c7fd5c6a (corroborated by multiple other vendor-compliance pages in the same search, e.g. getinteractive.nl, perium.eu).

## 6. Lexolution (Septeo/STP.ONE) New Matter Intake vs. Kleos (Wolters Kluwer) comparative structure claim

Unable to independently verify the comparative claim.

Lexolution: confirmed it has a dedicated intake/New Matter Intake capability covering client data/documents from initial contact through intake forms, with automated conflict/compliance checks as part of client acceptance (per stp.one's own marketing pages — a vendor-authored source, not independent).

Kleos: could not find independent documentation describing Kleos's intake feature as "mainly workload visibility" rather than a structured intake-and-conflict-check process. Wolters Kluwer's own Kleos pages and general search results did not surface feature-level detail on this specific point.

Verdict: unverified. The Lexolution half is sourced only to the vendor itself (STP.ONE), and no independent or Kleos-side source could confirm or refute the comparative characterization of Kleos's intake feature. This is a vendor-vs-vendor competitive claim that needs a comparison site, analyst review, or Kleos product documentation to properly verify — none was found.
Sources checked (inconclusive): https://www.stp.one/en/products/lexolution, https://www.wolterskluwer.com/en/solutions/kleos, https://www.stp.one/en/resources/new-matter-intake-white-paper
