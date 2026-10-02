# Phase 2 Freelance/Prospect Leads: Verification Notes (checked 2026-09-30)

## 1. Ontwikkelaar Digitale Formulieren (Provincie Noord-Brabant via GreenPepper)

URL: https://greenpepper.nl/vacatures/ontwikkelaar-digitale-formulieren-rc146104/

- Page loads and the posting is live.
- Status: Open. Stated deadline in the lead (2026-08-28) is confirmed by the fetch; the posting was still showing as open at fetch time (2026-09-30), consistent with the lead's note that the deadline field may lag actual closure or the role may have been extended. Assignment window: 2026-09-14 to 2027-02-27, 32 hrs/week, rate EUR 115/hour, location 's-Hertogenbosch.
- Description matches the lead accurately: iProx-based forms development, complex form logic, WCAG 2.2, DigiD/eHerkenning, GDPR, 5+ years experience required. No mention of Vue or any JS framework, confirming the lead's caveat that the library itself isn't directly deployable (iProx is a proprietary CMS platform, not Vue).
- Verdict: live. Description accurate, no corrections needed.

## 2. Shift2 B.V. - forms product for Dutch local government

URL: https://www.shift2.nl/formulieren

- Direct WebFetch returned HTTP 403 (site likely blocks the fetch bot / has bot protection). Confirmed via web search instead: shift2.nl is live and indexed, with a dedicated `/formulieren` product page plus related pages (`/onze-formulierenoplossing-maakt-het-een-stuk-makkelijker`, `/voor-gemeenten`, `/pdc`, `/mijnportaal`).
- Search results confirm: Shift2 (formerly SIMgroep/Procura) sells a no-code forms builder to municipalities, water boards and provinces, accessibility-compliant, usable on any device. Named client example found: Gemeente Pijnacker-Nootdorp (75+ forms) — this differs from the client list in the lead (Ooststellingwerf, Weststellingwerf, Opsterland, Heemskerk), which could not be independently confirmed from the search snippet but is plausible given Shift2's "voor gemeenten" / "voor andere lokale overheden" positioning.
- Company is real, active, and selling into the same buyer segment (Dutch municipalities/waterschappen/provinces) as described.
- Verdict: live. Core claim (forms product sold to Dutch local government) confirmed; the specific named-client list in the lead could not be directly verified (page itself was unreachable via fetch) but is consistent with the company's stated market. Treat the specific client names as unconfirmed rather than misdescribed.

## 3. de Publieke Partner - government ZZP forms-role broker

URL: https://depubliekepartner.nl/category/zzp-opdrachten-overheid/

- Site is live and is indeed a ZZP/detachering broker for Dutch public-sector roles, confirmed via direct fetch of the homepage (depubliekepartner.nl) and the category page.
- However, checking the actual current listings on the category page: approximately 10 open roles as of 2026-09-30, none related to digital forms or Vue.js/frontend development. Roles found: Power BI Ontwikkelaar, Medewerker Interne Controle, Medewerker Grondzaken, Sociotherapeut, Frontoffice Medewerker Sociaal Domein, Teammanager Economie/Kunst/Cultuur, Functional Application Manager, Contractbeheerder IT, Inhuur piek lijstwerk, Strategisch Beleidsadviseur.
- This matches the lead's own caveat ("10 open roles, none forms-specific right now") — the lead is accurately described as a pipeline-registration play, not a direct current opportunity.
- Verdict: live. Accurately described as a broker to register with for future matching, not a current forms-specific opening today.

## 4. Open Formulieren Product Owner hire - Maykin Media

URL: https://maykinmedia.nl/nl/portfolio/project/open-formulieren/ (redirects to https://www.maykin.nl/nl/portfolio/project/open-formulieren/)

- The maykin.nl portfolio page itself is live and describes the Open Formulieren project accurately (open-source Dutch government forms platform, built with Utrecht/Den Haag, 50+ adopting organizations including Dimpact, Den Haag, Utrecht, Westerkwartier, Zevenaar). This page does NOT itself mention any Product Owner vacancy — it's a portfolio/product page, not a jobs page.
- The actual Product Owner vacancy was located via search: it is hosted on Indeed (https://nl.indeed.com/viewjob?jk=47c6ab239b15fda7), titled "Product Owner Open Formulieren - Gemeente Amsterdam." Direct fetch of the Indeed URL returned HTTP 401 (Indeed blocks automated fetches), so live/open status as of 2026-09-30 could not be directly confirmed; search-engine cache confirms the listing existed and matches the lead's description (Product Owner responsible for Open Formulieren's community and roadmap, based in Amsterdam).
- Correction: the vacancy is posted by Gemeente Amsterdam (the client running/hosting the Open Formulieren initiative), not directly by Maykin Media as implied by the lead's framing ("Maykin Media Product Owner hire"). Maykin is the vendor/maintainer; Amsterdam appears to be the hiring municipality for this PO role. The nextAction (reach out to Maykin referencing the PO hire) is still reasonable since Maykin is the product's technical steward, but the org line should read "Gemeente Amsterdam (Open Formulieren product, maintained by Maykin Media)" rather than "Maykin Media" as the direct employer.
- Verdict: misdescribed. Core opportunity (active PO hire signaling investment in Open Formulieren) is real, but the hiring organization is Gemeente Amsterdam, not Maykin Media directly; could not confirm current open/closed status of the Indeed posting due to fetch block.
