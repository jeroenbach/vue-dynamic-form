# Phase 2 lead verification: gov inhuur / Open Formulieren leads (verified 2026-09-30)

## 1. Repeating groups logic gap (GitHub #2441)
- URL: https://github.com/open-formulieren/open-forms/issues/2441
- Verdict: live
- Status: Open. Title "Repeating groups: No possibility to use logic for each item in a group." Body references internal tracking IDs "Utr 8, DH 366, rotterdam 37," confirming Utrecht/Den Haag/Rotterdam all logged the same limitation. Description in the lead is accurate: conditional/action logic cannot target a field nested inside a repeating-group item (e.g. Field C inside RepeatingGroup.0 cannot be an action target based on Field A in the same item). Still unresolved as of 2026-09-30.

## 2. Raakvlak Advies — Rotterdam Open Formulieren doorontwikkeling case
- URL: https://www.raakvlakadvies.nl/cases/doorontwikkeling-open-formulieren
- Verdict: broken (direct fetch), but corrected via search — treat as misdescribed on the URL only, content is live
- Direct WebFetch of the given URL returned HTTP 404. A web search found the same page indexed under an identical title/URL ("Doorontwikkeling Open Formulieren voor gemeente Rotterdam — Raakvlak Advies"), so the URL is likely correct but currently not resolving for WebFetch (possibly JS-rendered page, redirect, or transient issue) — could not confirm live content directly. Search snippets and related case pages (e.g. "GZAC nieuwe fase in Rotterdam," "Van de e-Suite naar het GZAC: de beproeving van gemeente Rotterdam") corroborate the underlying claim: Raakvlak Advies has been Rotterdam's case-working/Common Ground partner since 2018, ran the e-Suite-to-Open-Formulieren fitgap analysis, and continues GZAC/Open Formulieren doorontwikkeling work with Dimpact and Maykin Media. Recommend re-checking the URL with a browser rather than WebFetch before outreach, since the underlying business fact (active partner, did the fitgap analysis) is corroborated even though the specific URL could not be confirmed as currently live.

## 3. Rotterdam "Platform dienstverlening specialist" (5 posities)
- URL: https://www.opdrachtoverheid.nl/inhuuropdracht/gemeente-rotterdam/platform-dienstverlening-specialist/446B8C33-97F1-41C4-9E6E-9600D3BD8A17
- Verdict: stale (as an actionable application), details otherwise accurate
- Page exists and confirms all details in the lead: deadline 2025-11-10 (expired, page explicitly says "verlopen"), contract 2026-01-05 to 2027-01-04, 5 positions, €90-100/hour, requires 1+ year Open Formulieren + GZAC + zaakgericht werken experience. One correction: hours are stated as 24-32/week on the page, not a flat "5 positions" figure without hours as implied. The lead's characterization (closed application, active contract through the research date) is accurate — mark stale for applying now, but the underlying signal (Rotterdam actively resourcing 5 external OF specialists through Jan 2027) is confirmed live.

## 4. Provincie Noord-Brabant iProx forms developer (LibLab)
- URL: https://liblab.nl/opdrachten/ontwikkelaar-digitale-formulieren/
- Verdict: stale
- Page exists, explicitly states "Deze opdracht is reeds gesloten" (already closed). Details otherwise match the lead: contract 2026-09-14 to 2027-02-27, max €115/hour, 32 hours/week, 300-form Formdesk-to-iProx migration, skip logic / complex form logic requirement. Confirmed as closed, not open for application as of 2026-09-30 (contract has already started).

## 5. Zwolle Open Formulieren developer (Flextender #26242)
- URL: https://app.flextender.nl/nologin/jobtopdf/26242
- Verdict: stale
- Direct WebFetch could not extract the PDF text (binary/compressed), but a web search corroborates: Ontwikkelaar Open Formulieren, 16 weeks + 2x2 month extension options, 16 hrs/week, HBO level, Overijssel region, application deadline 2026-01-06 09:00, interviews 2026-01-12. Deadline has passed as of 2026-09-30, so this specific posting is closed/stale. Underlying signal (Zwolle runs recurring short Open Formulieren DAS assignments) is plausible but not independently confirmed beyond this one posting.

## 6. Delta10 — Open Formulieren implementation & hosting partner
- URL: https://www.delta10.nl/solutions/open-formulieren
- Verdict: live
- Page exists and is current. Confirms Delta10 offers Open Formulieren hosting/implementation/management/support for Dutch municipalities, Common Ground-aligned, ISO 27001/9001 certified, multi-datacenter hosting, form migration assistance. The lead's description (systems integrator, active partner, natural subcontracting target) is accurate. Could not independently verify the specific "5M+ residents / 50+ implementations / Gemeente Ede named customer" figures or the backend-developer vacancy URL from this fetch, but the core page and offering are confirmed live and accurately described.
