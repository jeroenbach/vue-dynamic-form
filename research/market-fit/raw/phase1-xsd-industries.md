# Phase 1 — Which industries/standards still run on XSD/XML, and what tooling exists to turn XSD into forms

Research date: 2026-09-30. Angle: industries/standards still on XSD/XML requiring human-facing forms, and the state of XSD-to-form tooling.

## Summary of the strongest lead: Digitaal Stelsel Omgevingswet (DSO) / STOP-TPOD

This is the single sharpest finding for the Dutch market. The Omgevingswet (Environmental/Planning Act) went live 1 Jan 2024 and is mandatory for **all** Dutch municipalities, provinces, and water boards (waterschappen) to publish environmental plans, ordinances (omgevingsverordeningen), and visions (omgevingsvisies) through a shared national system.

- The publication format is **STOP** (Standaard Officiële Publicaties) with **TPOD** (Toepassingsprofielen voor Omgevingsdocumenten) as the domain application profile, and **IMOW** (Informatiemodel Omgevingswet) as the underlying information model. These are XML-schema (XSD) based. Source: https://iplo.nl/digitaal-stelsel/aansluiten/standaarden/stop-tpod-imop/ , https://www.geonovum.nl/geo-standaarden/omgevingswet/STOPTPOD , https://docs.geostandaarden.nl/tpod/def-st-TPOD-OP/
- Documents are published via the LVBB (Landelijke Voorziening Bekendmaken en Beschikbaarstellen) and shown in the DSO's Omgevingsloket. https://koop.gitlab.io/lvbb/voorinzage/bronhouderkoppelvlak-preview-b/
- **Direct evidence of software-vendor pain, from Computable.nl** (https://computable.nl/artikel/achtergrond/overheid/7243955/1444691/ontwerpfouten-verlammen-digitaal-stelsel-omgevingswet.html):
  - Lieuwe Koopmans (advisor at vendor Tercera, described as market leader): "The information architects failed to look at daily reality. The premises were never tested against practice."
  - "The STOP standard part and Kadaster part don't work well together. The programming languages used in the standard are incompatible."
  - New standard versions are **not backwards compatible** despite earlier promises — when the data model shrinks between versions (example given: 50 data items down to 15), remaining/orphaned data becomes a real migration problem.
  - Koopmans: "Patching won't stabilize this system. Going back to the drawing board is essential."
  - Several experts declined to go on record for fear of future accountability blowback — a sign of how politically sensitive this program is.
- **Evidence of a vendor revolt, from AG Connect** (https://www.agconnect.nl/artikel/rijk-zette-it-leveranciers-omgevingswet-onder-druk-brandbrief-ingetrokken):
  - Seven software vendors drafted a "brandbrief" (warning letter) demanding an independent body assess DSO stability before go-live, a minimum 9-month municipal testing window, and a stable test environment.
  - Ministry pressured vendors (threat of exclusion) into withdrawing the letter before it reached the Eerste Kamer (Senate).
  - Koopmans quote: "It is unthinkable that this body could reach such a judgment before April 1st."
  - No cost figures found in this article, but it confirms multiple established vendors (Tercera named explicitly, 6 others unnamed) actively frustrated with the complexity of the XML standard itself, not just the software.
- Other corroborating headlines found (not deep-fetched, titles alone are informative — worth a follow-up read if this angle gets picked up):
  - "'Ongecensureerde' cijfers DSO: veel mislukkingen en nog steeds instabiel" — PONT Omgeving (omgevingsweb.nl)
  - "Vertraagde software tart digitalisering Omgevingswet" — Gemeente.nu
  - "Gemeentelijke ICT vreest instabiliteit digitaal stelsel Omgevingswet" — Gemeente.nu
  - "Minister: software Omgevingswet is probleem van gemeenten" — Gemeente.nu
  - "Doorontwikkeling plansoftware Omgevingswet staat stil" — Gemeente.nu
  - "Digitaal Stelsel Omgevingswet dreigt in te storten" — Gemeente.nu
  - "Risico's en maatregelen bij implementatie Omgevingswet software" — VNG: https://vng.nl/artikelen/risicos-en-maatregelen-bij-implementatie-omgevingswet-software
  - "Omgevingswet: parallel planwijzigen nog lastig" — municipalities can't work on multiple simultaneous plan changes in DSO; not all vendors support it; local software doesn't integrate well with the central national system; the publication system can't handle heavy files with map/GIS data.

**Read on this**: this is not literally "fill in a form to produce XML" in the classic sense — TPOD/STOP output is structured legal/planning documents (environmental plans, ordinances) with embedded geo-data, authored by specialist "juridisch-planologisch" staff at every municipality/province/waterschap using vendor plan-authoring software (Tercera, and others). The pain point is real and large (every one of ~342 municipalities + 21 waterschappen + 12 provinces is a forced buyer of this tooling), but the product surface is closer to "structured document editor with GIS" than "generate a web form from an XSD." Still relevant as a case study of institutional appetite to pay for XSD-standard-compliant authoring tools, and as a potential customer conversation starter (small vendors/municipalities frustrated with incumbent Tercera-like tooling could be a resale angle: "form-driven front end over the STOP/TPOD schema, reskinnable per municipality").
Could not confirm the exact municipality/waterschap/province counts via search in the time available (a quick web search did not surface a clean current total; commonly cited round numbers are ~342 municipalities, 21 waterschappen, 12 provinces, but VERIFY before quoting externally — not confirmed to high confidence).

## SBR / XBRL (Standard Business Reporting) — Dutch annual accounts & tax filings

- SBR is the Logius/government program requiring Dutch companies to file annual accounts, tax returns, and credit reports as XBRL (a XML dialect) with KvK (Chamber of Commerce) and the Belastingdienst (Tax Authority), via Digipoort.
- From FY2025, "Large" category NL companies must file annual accounts in inline XBRL (iXBRL) to KvK under the SBR mandate. Source: search snippet citing cfour.tech summary of the mandate (worth verifying against sbr-nl.nl directly if used as a load-bearing claim).
- The **taxonomy** ("Dutch Taxonomy" / NT) is the XSD-equivalent structure: it's updated annually by SBR-NL, and software vendors must re-absorb the new taxonomy every year. https://www.sbr-nl.nl/over-sbr/wat-is-sbr/xbrl
- This is a mature, heavily intermediated market already: dozens of accounting packages (Exact Online, Twinfield, SnelStart, AFAS, Yuki, e-Boekhouden — Speedbooks alone claims 180+ integrations via the RGS standard) already generate SBR/XBRL output as a byproduct of bookkeeping, not as a standalone "fill an XSD-driven form" product. https://www.speedbooks.nl/rapportage/sbr-software
- There's also an explicit open-source angle: **OpenSBR** (https://opensbr.org/) — worth a follow-up fetch, not yet read in depth.
- Connectivity requires a PKIoverheid server certificate (paid, vendor-mediated) — a real but modest cost/complexity barrier for a new entrant. Exact certificate costs not found in this pass.
- **Assessment**: SBR/XBRL is a crowded, mature market with entrenched incumbents doing full bookkeeping-to-filing integration; a generic "XSD → dynamic form" library is a weak wedge here because the real value-add in this space is the accounting integration, not the form UI. Lower priority as a productizable opportunity versus DSO or customs/insurance niches, but worth knowing as "this is the big one everyone already knows about, we're not first."

## StUF / Digikoppeling / municipal integration standards

- **StUF** (Standaard Uitwisseling Formaat) — XML-based municipal data-exchange standard (StUF-BG, StUF-ZKN, StUF-ZTC). Officially in "discontinued further development" status — only legal/registry-driven or bugfix changes still happen. https://www.gemmaonline.nl/wiki/StUF-standaarden , https://vng-realisatie.github.io/StUF-onderlaag/
- Municipalities are actively migrating away from StUF/SOAP toward **Common Ground** (REST/JSON APIs, "ZGW APIs"), explicitly because StUF is seen as "outdated" (a WeAreFrank blog literally frames the migration this way). https://blog.wearefrank.nl/hoe-migreer-je-als-gemeente-van-stuf-naar-common-ground
- **Digikoppeling** (Logius) is the still-current government-wide standard for structured data exchange (WUS = WSDL/UDDI/SOAP; ebMS2 = ebXML messaging), XML-based, still actively maintained (recent architecture doc v2.1.1). https://gitdocumentatie.logius.nl/publicatie/dk/architectuur/2.1.1/
- **Open Formulieren** (Maykin Media / VNG Common Ground project) is the dominant modern Dutch municipal forms product — open source, built for Common Ground, but explicitly supports *both* the old StUF-ZKN interface and the new ZGW APIs as a bridge during migration. https://commonground.nl/groups/view/0c79b387-4567-4522-bc35-7d3583978c9f/open-formulieren , vendor Delta10 sells implementation services around it (e.g. Gemeente Ede case study: https://www.delta10.nl/blog/gemeente-ede-eerste-gebruiker-van-open-formulieren-via-delta10).
- **Important competitive note**: Open Formulieren is a free, open-source, VNG-backed forms product already serving Dutch municipalities and increasingly the default choice. It is NOT XSD/metadata-tree driven in the same sense as vue-dynamic-form (it's closer to a visual form builder targeting ZGW/StUF backends), but it is a real incumbent in the "government forms" niche and any go-to-market into Dutch municipalities needs to reckon with it — either as a competitor or as a system vue-dynamic-form-based tools would need to interoperate with/feed data into.
- **Assessment**: StUF itself is a dying/frozen standard, weak target. Digikoppeling is alive but is a *transport/service* standard, not really a "citizen fills in a form" standard — low relevance for form UIs specifically. Common Ground / Open Formulieren is the real center of gravity for Dutch municipal forms today and is JSON/REST-based, not XSD — so vue-dynamic-form's specific XSD-fidelity differentiator does not obviously map onto this segment; better fit would be as a backend-agnostic rendering layer that happens to also support XSD-derived metadata for the legacy StUF-era systems still running underneath many municipalities.

## EU Customs — AES / NCTS / DMS

- Dutch customs (Douane Nederland) is mid-migration: AES (export) is now directly linked to NCTS (transit) with automatic MRN-based document referencing (code N830). https://www.douane.nl/koppeling-aes-en-ncts/
- Confirmed: the underlying systems are moving from **EDIFACT to XML messages**, based on the **EU Customs Data Model (EUCDM)**, itself derived from **Annex B of the Union Customs Code (UCC)** legislation — i.e., a legally-mandated, EU-wide, versioned XML data model. https://www.douane.nl/onderwerpen/goederenvervoer/goederen-gaan-nederland-uit/aes-veranderingen-in-uitgaan-in-de-eu/aes-vragen-en-antwoorden/
- NCTS is being further replaced/extended by **DVA** in the Netherlands (per Gaston Schul freight-forwarder blog: https://www.gaston-schul.com/en/resources/article/declaration-system-ncts-will-be-replaced-by-dva-in-the-netherlands/) — another migration wave, meaning declarants/software vendors are repeatedly re-adapting to new schema versions, a recurring pattern favorable to a metadata-driven (schema-swap-friendly) library.
- This space is heavily intermediated by customs brokers/forwarders (Customs Support, Gaston Schul, Organi) who already build/maintain their own declaration software — a plausible reseller/integration-partner channel rather than a direct-to-declarant SaaS play. https://customssupport.com/nl/nederlandse-downloads , https://www.organi.be/software/logistiek-douane/ucc/
- **Assessment**: strong structural fit (legally mandated, versioned, EU-wide XML schema; frequent schema churn is exactly what a schema-driven form engine is built to absorb cheaply) but B2B2B — the direct customer is customs-software vendors/brokers, not end declarants. Good target for a "we build/maintain your declaration UI module" service offering.

## E-invoicing — UBL / Peppol

- UBL 2.1 + Peppol BIS Billing 3.0 (implementing EN 16931) is the standard EU e-invoicing XML format. Several commercial "fill a guided form, get compliant UBL XML" products already exist and are proof the market pays for exactly this pattern:
  - e-invoice.be Peppol Invoice Generator — free sample/testing tool. https://e-invoice.be/peppol-invoice-generator
  - aiDoks — "fill in a guided form, or upload existing XML to edit and re-export," AI-OCR-from-PDF option too. https://aidoks.eu/en/invoice-to-xml
  - InvoiceXML — API-first, validates against EN16931 Schematron + Peppol BIS rules before delivery. https://www.invoicexml.com/docs/api/create/ubl
  - Frappe/ERPNext "EDocument" app — PEPPOL BIS Billing 3.0 generation as an app inside an existing ERP. https://cloud.frappe.io/marketplace/apps/edocument
- **Assessment**: this is the segment with the *most direct existing proof of business model* — multiple small companies already sell "form in, compliant XML out" for exactly one schema family (UBL/Peppol). It validates the wedge but is also the most commoditized/competitive of the segments researched (invoicing is a much shallower domain than customs or insurance, easier for a generic SaaS to commoditize). Differentiator for vue-dynamic-form here would be less about invoicing itself and more about being an embeddable, reskinnable, self-hosted component other software vendors bundle into their own products, vs. the constellation of narrow point-SaaS tools found here.

## Insurance — ACORD (global) and SIVI/AFD (Netherlands)

- **ACORD**: global insurance data standard body, XML (and JSON) schemas covering >1200 standardized transaction types across Life & Annuity, Property & Casualty, Claims, Placing, Accounting & Settlement. Access is membership-gated (acord.org account required). https://www.acord.org/standards-architecture/acord-data-standards
- **SIVI / AFD** (NL-specific): "AFD" (All Finance Datamodel) is described as *the* data and message standard for the Dutch insurance/intermediary industry, in active transition from AFD 1.0 to AFD 2.0 (both versions must coexist during migration — again, schema-version churn). SIVI ships an XML schema plus a PDF message spec plus explanatory docs for every message. https://www.sivi.org/sivi-afs/sivi-afs-standaarden/afd/ , https://www.sivi.org/standaarden/gegevensstandaard/
- Also found: SIVI/Pensioenfederatie's **UPA** (Uniforme Pensioenaangifte) — XML standard for monthly pension-data submission from employers/payroll administrators to pension funds, actively maintained (2026 product description already published: https://www.sivi.org/wp-content/uploads/2025/09/Productbeschrijving-UPA-2026-v1.0.pdf). This is a strong, concrete NL-specific lead: payroll/HR software vendors and the ~220 pension funds under the Pensioenfederatie umbrella are the addressable buyers for UPA-compliant data-entry/correction tooling.
- **Assessment**: SIVI/AFD and UPA are excellent NL-specific fits for vue-dynamic-form's pitch (XSD-driven, versioned, intermediary-heavy, B2B software vendors as the buyer, not consumers). Worth a deeper follow-up pass specifically on SIVI AFD tooling vendors and whether any of them offer/lack a modern reskinnable form front end — this smells like a good first-customer hypothesis (a software house serving insurance intermediaries or pension administrators, needing a correction/data-entry UI over AFD- or UPA-shaped XML).

## Aviation — IATA NDC

- IATA NDC (New Distribution Capability), adopted 2012, XML-schema-based (moving toward JSON but the core is still an XSD-defined Offer/Order data model), replacing legacy EDIFACT-era distribution. https://www.altexsoft.com/blog/ndc-technology-for-airlines/
- IATA provides an official XSD Viewer/schema tooling portal (https://retailing.iata.org/tools/xsd_viewer/) and airlines publish their own NDC XSD sets (e.g. British Airways: https://ndc.ba.com/api/docs/FileAssets-IATA%2017.2%20NDC%20Schema%20XSD).
- **Assessment**: NDC is real and schema-driven, but the "form" surface here is overwhelmingly B2B API integration between airlines/GDSs/OTAs — not really a human-facing data-entry form problem. Weak fit for this library's differentiator (which is about human-facing forms) versus API-to-API transformation. Deprioritize unless a specific human-facing NDC back-office use case (e.g., airline reservations agent override screens) surfaces later.

## Energy — EDSN (Netherlands)

- EDSN (Energie Data Services Nederland) runs central market facilitation for Dutch electricity/gas: connection register (C-AR), allocation/reconciliation/measurement data (C-ARM), acting on behalf of TenneT/GTS-affiliated grid operators.
- Confirmed XML basis: data synchronization under the "Stroomopwaarts" program uses an open XML format called **Edine**; the newer market model uses **EDSN XML** for customer-related processes. https://www.edsn.nl/marktfacilitering/
- **Assessment**: this is heavily automated B2B message traffic between grid operators and suppliers (EAN-code keyed), not really a human-facing form problem — closer to the aviation NDC pattern. Weak fit unless a specific back-office correction/exception-handling UI use case is identified (e.g., a switching-process exception queue where an ops person manually edits an EDSN XML message — plausible but unconfirmed).

## Legal/Notary — no strong XML lead found

- Investigated KNB (Koninklijke Notariële Beroepsorganisatie) digital-deed standards. The **primary document standard for electronic notarial deeds is PDF/A-2** (with conformance level a or u), not XML. https://www.knb.nl/ons-beroep/regelgeving-notariaat/reglement-elektronische-notariele-akte/
- **ECH** (Stichting Elektronische Communicatie Hypotheken) is a real digital exchange platform connecting nearly all notaries and most mortgage lenders for deed passages and full mortgage repayments, and there's an ambition (stated by a KNB spokesperson, John Buhrs) toward "automatic deed verification based on comparison with source systems" and reducing the current 200-300 different circulating mortgage deed templates to something standardized — but the fetched source article did **not confirm XML/XSD as ECH's underlying format**. This needs a dedicated follow-up (fetch stichting ECH's own site / technical docs) before treating notary/mortgage as an XSD-shaped opportunity. Source read: https://www.knb.nl/actueel/notariaat-magazine/2022/notariaat-magazine-nr-8-december-2022/digitale-akte-kans-notariaat-relevant/
- **Assessment**: not confirmed as an XSD-driven vertical based on this pass — do not cite as load-bearing. The "200-300 different mortgage deed types" pain point is interesting on its own (standardization appetite exists) but needs more digging to connect to XML/forms tooling specifically.

## Pensions — UPA (see Insurance/SIVI section above)

Covered above under SIVI. UPA is the concrete, current, XML-based pension data-exchange standard — a good NL-specific lead.

## Tooling landscape: how bad/dated is "generate a form from an XSD" tooling today?

This is the differentiator question, and the findings support "it's genuinely dated / niche / commercial-and-clunky":

- **xsd-forms** (davidmoten, GitHub OSS): generates HTML/JS forms + posts back XML matching the schema. README quote: *"Probably not! xsd-forms only supports a subset of xsd features. It was enough work for me to get this far, believe me!"* Status line reads "Released to Maven Central" — feels like a personal/hobby-scale project, not a maintained product. Development-plan items (e.g. "use jquery to insert clones of div blocks to model maxOccurs > 1") read as dated (jQuery-era) and aspirational rather than shipped. https://github.com/davidmoten/xsd-forms
- **xsd2html2xml** (MichielCM, GitHub, MIT): generates plain HTML5 forms from XSDs and extracts valid XML back out. Not deep-fetched for maintenance status but worth a follow-up.
- **XSD2GUI** (SourceForge): AJAX-based, add/delete nodes per XSD. SourceForge hosting alone signals age.
- **JAXFront** (xcentric, commercial, since 2001): still being sold (jaxfront.com / jaxfront.org), renders Java Swing / HTML / PDF GUIs from an XSD. Free community edition + paid Standard/Professional/Enterprise tiers. Described by a third party (IBM webMethods community thread) as "rather expensive." Being sold continuously since 2001 without an obvious modern (Vue/React/component-slot) rendering story is itself a signal of how stale the UX layer of this category is. https://www.jaxfront.com/
- **FormSix** — mentioned as an open-source alternative to JAXFront, described in the same forum thread as "a bit limited."
- **Orbeon Forms**: the most credible modern-ish incumbent — implements W3C XForms, open-source Community Edition + commercial Professional Edition, explicit government/regulated-industry positioning, validates input against XML Schema. Actively marketed for 2026 ("Enterprise Form Editor for 2026"). https://www.orbeon.com/ , https://www.orbeon.com/solution/government . This is the closest thing to a real competitor / prior-art benchmark and deserves a deeper pricing/feature comparison in a later research pass — no pricing figures were found in this pass (site likely gates pricing behind contact-sales).
- **InfoPath** (Microsoft): repeatedly surfaces in older threads as *the* mainstream way non-developers built forms from an XSD ("Infopath has the ability to create a validated form from an XSD schema") — and is now **discontinued**, which a Microsoft Q&A respondent flags as a real gap: https://learn.microsoft.com/en-us/answers/questions/759427/how-to-generate-an-xml-form-file-from-xsd-schema . This is a strong "the old solution died and nothing modern replaced it" data point.
- **Altova** (XMLSpy, MapForce, StyleVision, etc.) and **Stylus Studio**: legitimate, long-running commercial XML tooling vendors, but search turned up mostly 2005-2007-era competitive-upgrade promotions and no clear evidence of a modern component-based/reskinnable web-forms product in their current lineup (StyleVision is positioned as a report builder, not an interactive form engine). Not conclusively ruled out — worth a direct altova.com product-page check in a follow-up pass rather than trusting search snippets.
- HN/Reddit search for direct complaints about XSD-to-form tooling came up mostly empty — general XSD complexity complaints exist (HN threads calling XSD "pretty much incomprehensible," citing it as the reason RelaxNG was created) but no threads specifically about form-generation tool pain were found. This is a genuine gap in the public discourse — it suggests the pain is real but expressed inside enterprise procurement/consulting conversations (like the DSO vendor brandbrief) rather than on public developer forums. Don't overclaim "developers are complaining on Reddit" — they aren't, visibly.
- **W3C www-forms mailing list archives** (2001-2006) show this exact problem — "generate a form from an XML schema" — being actively discussed **20+ years ago** (XForms era: Chiba's XSD-to-XForms XSLT tool, IBM's XML Forms Generator Eclipse plugin, "xsdtrans" XSLT tool) and apparently never fully solved in a way that stuck; the tools named there (Chiba, XFG) appear to be dead/abandoned projects today. This is good supporting evidence for the "this problem is old, recurring, and no one has nailed the modern (component-based, reskinnable) version of the solution" pitch.

### Overall tooling verdict
The category is real but stuck in two eras: (1) enterprise-commercial, XML-native, non-web-component tooling (JAXFront, Altova-era, Orbeon/XForms) that is expensive, admin-console-configured, and visually dated/hard to restyle per customer; or (2) abandoned hobby-scale OSS (xsd-forms, xsd2html2xml, XSD2GUI) that only covers a subset of XSD and hasn't been touched in years. Nothing found combines XSD-fidelity with a modern component framework (Vue/React), named-slot-based reskinning per customer, and wizard/multi-step support — which lines up with vue-dynamic-form's stated differentiators. No direct one-to-one competitor was found in this pass.

## Dead ends / things not confirmed (don't cite without follow-up)

- Exact current counts of NL municipalities/waterschappen/provinces bound by Omgevingswet — not confirmed to high confidence in this pass.
- ECH (notary/mortgage) underlying data format — not confirmed to be XML/XSD; needs a direct fetch of stichting ECH's own technical docs.
- SBR PKIoverheid certificate cost — not found.
- Altova's current (2026) product lineup for interactive web forms — search results were dominated by 2005-2007-era promotional pages; needs a direct altova.com visit.
- Orbeon Forms pricing — not found (likely gated behind sales contact).
- IATA NDC and EDSN: confirmed schema-driven but *not* confirmed as human-facing-form problems (more likely API-to-API); flagged as weak fits pending a more targeted follow-up if these industries are pursued further.
- OpenSBR (opensbr.org) — surfaced but not fetched/read; potentially relevant open-source prior art in the SBR space, worth a follow-up.

## Full list of URLs touched this session

- https://www.sbr-nl.nl/over-sbr/wat-is-sbr/xbrl
- https://en.wikipedia.org/wiki/Standard_Business_Reporting
- https://www.nba.nl/tools-en-ondersteuning/achtergrond/digitalisering/standard-business-reporting-sbr/
- https://www.sbr-nl.nl/english/sbr-international
- https://tangelo-software.com/solution/sbr-reporting/
- https://opensbr.org/
- https://cfour.tech/blog/what-is-standard-business-reporting-sbr/
- https://standaarden.vng.nl/StUF-koppelvlakken-en-sectormodellen
- https://www.gemmaonline.nl/wiki/StUF-standaarden
- https://www.gemeenteoplossingen.nl/producten/content_management/gemma_eformulieren/
- https://vng-realisatie.github.io/StUF-onderlaag/
- https://github.com/davidmoten/xsd-forms
- https://github.com/MichielCM/xsd2html2xml
- https://sourceforge.net/projects/xsd2gui/
- https://discuss.orbeon.com/Generate-a-form-from-an-XSD-Schema-td4658077.html
- https://community.ibm.com/community/user/discussion/generate-html-forms-from-xsd
- https://e-invoice.be/peppol-invoice-generator
- https://e-invoice.be/blog/xml-invoicing
- https://e-invoice.be/blog/ubl-format-guide
- https://www.storecove.com/blog/en/creating-your-own-ubl-invoice/
- https://aidoks.eu/en/invoice-to-xml
- https://www.invoicexml.com/docs/api/create/ubl
- https://cloud.frappe.io/marketplace/apps/edocument
- https://www.acord.org/standards-architecture/acord-data-standards
- https://www.acord.org/standards-architecture/acord-data-standards/Life_Annuity_Data_Standards
- https://www.acord.org/standards-architecture/acord-data-standards/Property_Casualty_Data_Standards
- https://schemas.liquid-technologies.com/Category/Insurance
- https://www.douane.nl/onderwerpen/goederenvervoer/goederen-gaan-nederland-uit/aes-veranderingen-in-uitgaan-in-de-eu/aes-vragen-en-antwoorden/
- https://www.douane.nl/koppeling-aes-en-ncts/
- https://www.gaston-schul.com/en/resources/article/declaration-system-ncts-will-be-replaced-by-dva-in-the-netherlands/
- https://customssupport.com/nl/nederlandse-downloads
- https://www.organi.be/software/logistiek-douane/ucc/
- https://www.edsn.nl/marktfacilitering/
- https://www.edsn.nl/
- https://gitdocumentatie.logius.nl/publicatie/dk/architectuur/2.1.1/
- https://logius-standaarden.github.io/Digikoppeling-Koppelvlakstandaard-WUS/
- https://www.sivi.org/pensioen/uniforme-pensioenaangifte/
- https://www.sivi.org/wp-content/uploads/2025/09/Productbeschrijving-UPA-2026-v1.0.pdf
- https://www.sivi.org/sivi-afs/sivi-afs-standaarden/afd/
- https://www.sivi.org/standaarden/gegevensstandaard/
- https://www.altexsoft.com/blog/ndc-technology-for-airlines/
- https://ndc.ba.com/api/docs/FileAssets-IATA%2017.2%20NDC%20Schema%20XSD
- https://airtechzone.iata.org/labs/tools/
- https://www.jaxfront.com/pages/pricing/license-terms.html
- https://www.jaxfront.org/pages/pricing.html
- https://www.knb.nl/actueel/notariaat-magazine/2022/notariaat-magazine-nr-8-december-2022/digitale-akte-kans-notariaat-relevant/
- https://iplo.nl/digitaal-stelsel/aansluiten/standaarden/stop-tpod-imop/
- https://docs.geostandaarden.nl/tpod/def-st-TPOD-OP/
- https://www.geonovum.nl/geo-standaarden/omgevingswet/STOPTPOD
- https://www.geonovum.nl/toepassingsprofiel-omgevingsdocumenten-versie-20
- https://standaarden.overheid.nl/stop
- https://koop.gitlab.io/lvbb/voorinzage/bronhouderkoppelvlak-preview-b/
- https://computable.nl/artikel/achtergrond/overheid/7243955/1444691/ontwerpfouten-verlammen-digitaal-stelsel-omgevingswet.html
- https://www.agconnect.nl/artikel/rijk-zette-it-leveranciers-omgevingswet-onder-druk-brandbrief-ingetrokken
- https://vng.nl/artikelen/risicos-en-maatregelen-bij-implementatie-omgevingswet-software
- https://blog.atabix.nl/open-source-of-partner-formulieren-kiezen-binnen-common-ground
- https://www.delta10.nl/solutions/open-formulieren
- https://blog.wearefrank.nl/hoe-migreer-je-als-gemeente-van-stuf-naar-common-ground
- https://commonground.nl/groups/view/0c79b387-4567-4522-bc35-7d3583978c9f/open-formulieren
- https://www.delta10.nl/blog/gemeente-ede-eerste-gebruiker-van-open-formulieren-via-delta10
- https://www.speedbooks.nl/rapportage/sbr-software
- https://www.orbeon.com/ , https://www.orbeon.com/solution/government
- https://learn.microsoft.com/en-us/answers/questions/759427/how-to-generate-an-xml-form-file-from-xsd-schema
- https://www.logius.nl/domeinen/gegevensuitwisseling/digipoort/documentatie/handleiding-aansluiten-voor-bedrijven
- https://www.sbr-nl.nl/over-sbr/wat-is-sbr/digipoort-biv

## Suggested productizable opportunities (see also structured output)

1. A reskinnable, form-driven data-entry/correction front end for SIVI AFD 2.0 / UPA pension-data XML, sold to payroll/HR software vendors and insurance intermediary software houses (NL-specific, concrete buyer, active schema-version churn = recurring maintenance revenue).
2. A "declaration-assist" module (embeddable component, not full SaaS) for EU customs brokers/forwarders adapting to the EUCDM/AES/NCTS/DVA XML migrations — sold to the customs-software vendors and forwarders (Customs Support, Gaston Schul-style firms) as an OEM/white-label component, capitalizing on the frequent schema churn that a metadata-driven engine absorbs cheaply.
3. A modern, self-hosted, reskinnable alternative/companion to JAXFront/Orbeon for organizations still stuck on InfoPath (discontinued) or hand-rolled XSD forms — position directly against "the last real update to this tooling category was Microsoft killing InfoPath."
4. (Lower confidence, needs follow-up) A structured-document/form front end positioned as a lighter, cheaper, more customizable layer over STOP/TPOD (Omgevingswet) for smaller municipalities/waterschappen currently frustrated with incumbent plan-authoring vendors (Tercera etc.) — high risk given the political/legal complexity and vendor-consolidation dynamics already visible in the DSO story, but the pain is real and well-documented.
