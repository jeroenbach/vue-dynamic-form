# Phase 1 XSD Industries - Adversarial Verification Notes

## Claim 1: Tercera advisor Lieuwe Koopmans on STOP/Kadaster incompatibility (Computable.nl)

Fetched https://computable.nl/artikel/achtergrond/overheid/7243955/1444691/ontwerpfouten-verlammen-digitaal-stelsel-omgevingswet.html directly.

The article does attribute to Koopmans (Tercera):
- "Het deel van de standaard waar Koop voor verantwoordelijk was, werkt niet goed met het Kadaster-deel. Zo passen de talen waarin de standaard is geschreven, niet bij elkaar." (STOP/Kadaster parts don't work well together; languages used in the standard don't match/are incompatible)
- "Probleem is dat de nieuwe versies van de standaard steeds 'niet backwards compatible' zijn, hoewel de organisatie achter het DSO eerder had toegezegd daar wel voor te zullen zorgen." (new versions not backwards compatible despite earlier promise)

Verdict: CONFIRMED (source is the article itself; treated as sufficiently independent primary confirmation of what was published — this is a direct read of the cited article, not a third-party corroboration, but the claim is specifically "the article states X" which is satisfied verbatim).

## Claim 2: Seven-vendor brandbrief, 9-month testing, withdrawn under ministry pressure (AG Connect)

Fetched https://www.agconnect.nl/artikel/rijk-zette-it-leveranciers-omgevingswet-onder-druk-brandbrief-ingetrokken directly.

Confirmed text:
- "Zeven softwareleveranciers die tezamen vrijwel alle gemeenten bijstaan bij hun aansluiting op het DSO bepleitten deze week langer uitstel van de Omgevingswet. Onder druk van het ministerie werd hun brief aan de Eerste Kamer ingetrokken."
- Requested "een stabiele testomgeving en... minimale negen maanden oefentijd voor gemeenten nadat het digitale stelsel door een onafhankelijke instantie als voldoende stabiel is beoordeeld."
- Letter to the Senate (Eerste Kamer) was withdrawn ("nooit verstuurd") under ministry pressure.

Verdict: CONFIRMED.

## Claim 3: STOP/TPOD mandatory for all municipalities/provinces/water boards since 1 Jan 2024 (IPLO)

Fetched https://iplo.nl/digitaal-stelsel/aansluiten/standaarden/stop-tpod-imop/ - confirms STOP/TPOD/IMOP are XML-schema-based standards for publishing environmental decisions/regulations via LVBB and the DSO Omgevingsportaal, but the page itself did not state a mandatory-since-date.

Cross-checked with additional search (gemeente.nu, IPLO "Einde TAM-IMRO", VNG, VBK legal update):
- The Omgevingswet did take effect 1 Jan 2024, and STOP/TPOD is *the* prescribed standard.
- BUT: a transitional route, TAM-IMRO (Tijdelijke Alternatieve Maatregel, using the old IMRO/Wro standards), was explicitly permitted for municipalities/provinces instead of STOP/TPOD. TAM-IMRO could be used until 1 Jan 2026 (with a further tail allowing designs already in progress by 31 Dec 2025 to be finished under the old standard, and full conversion to STOP/TPOD only required by 31 Dec 2031 in some cases).
- So STOP/TPOD was NOT in practice mandatory for "all" authorities from day one; many municipalities continued to use TAM-IMRO specifically because STOP/TPOD adoption was low ("Omgevingswet-standaard nog maar weinig populair" - Gemeente.nu headline literally says the standard is still not very popular / little used).

Verdict: REFUTED (partial). Correction: STOP/TPOD is the legally designated schema-based standard under the Omgevingswet, but it was not mandatory for all municipalities/provinces/water boards from 1 Jan 2024 in practice — a transitional alternative (TAM-IMRO, based on the old IMRO standard) was and is permitted through 1 Jan 2026 (with conversion deadlines extending to 2031 for some instruments). Actual uptake of STOP/TPOD at go-live was low. The "mandatory ... since 1 Jan 2024" framing overstates the real rollout.

## Claim 4: InfoPath discontinued, was mainstream XSD-to-form tool, gap noted on MS Q&A

Fetched https://learn.microsoft.com/en-us/answers/questions/759427/how-to-generate-an-xml-form-file-from-xsd-schema directly.

Confirmed quotes:
- "I intend to create a form and a structured XML file from an XSD schema, for regulatory reporting."
- "Infopath has the ability to create a validated form from an XSD schema, but has been discontinued."
- Asker is explicitly looking for a replacement and mentions resorting to time-consuming VBA macros as a workaround, i.e., treating the InfoPath gap as real.

Verdict: CONFIRMED. (Independent general knowledge also corroborates InfoPath's discontinuation: Microsoft ended InfoPath Forms Services support in mainstream products years ago and stopped active development; this Q&A page is a legitimate independent artifact showing a user hitting the gap in practice, not vendor marketing.)

## Claim 5: EU migrating customs declarations (AES/NCTS, soon DVA in NL) from EDIFACT to XML per EUCDM (Annex B of UCC)

The originally cited source (douane.nl AES FAQ page) does NOT mention EUCDM, EDIFACT, or DVA at all — fetched directly and confirmed absent. The cited source does not support the claim as given.

However, independent search confirms the underlying facts are true, just not at that URL:
- EUCDM (EU Customs Data Model) is the official EU data model used across NCTS, AES, ICS, CDS, EOS and national customs systems (taxation-customs.ec.europa.eu, EUCDM 7.0.1 released Aug 2026).
- EUCDM datasets/cardinalities/codes are explicitly derived from Annex B of the Union Customs Code (Delegated + Implementing Regulations).
- EDIFACT-to-XML migration is real and ongoing/completed in phases: NCTS Phase 5 and DMS (the Dutch import/export declaration system that replaced AGS, completed export Dec 2023 / import Jan 2024) explicitly moved messaging to XML based on EUCDM (evofenedex, gaston-schul.com, gateway.nl).
- DVA (Douane Vervoer Applicatie) is confirmed as the Dutch system replacing NCTS for transit declarations, rolled out from Dec 2024, per UCC/EUCDM-aligned data requirements (gaston-schul.com, gateway.nl).

Verdict: REFUTED as sourced (the cited douane.nl AES Q&A page does not discuss EUCDM/EDIFACT/DVA at all), but the underlying substantive claim is independently CONFIRMED true via other sources (European Commission taxation-customs.ec.europa.eu for EUCDM/Annex B; evofenedex.nl and gaston-schul.com for the EDIFACT→XML/DMS/DVA rollout in the Netherlands). Recommend citing taxation-customs.ec.europa.eu/online-services/online-services-and-databases-customs/eu-customs-data-model-eucdm_en instead, plus a DVA-specific source (e.g. gaston-schul.com/nl/bronnen/artikelen/aangiftesysteem-ncts-wordt-in-nederland-vervangen-door-dva/) for the Dutch DVA rollout detail.

## Claim 6: SIVI manages AFD as Dutch insurance/intermediary XML standard, mid-transition AFD 1.0 -> 2.0, both required to coexist

Fetched https://www.sivi.org/sivi-afs/sivi-afs-standaarden/afd/ directly plus a supporting search.

Confirmed:
- SIVI (Standaardisatie Instituut voor Verzekeringen in de Intermediairbranche) maintains AFD (All Finance Datamodel/Datacatalogus) as the Dutch insurance/intermediary data and message standard.
- AFD is implemented via XML Schema (confirmed via secondary SIVI documentation: "de XML schema aanpak... wordt op dit moment in de branche veel gebruikt" and SIVI's "AFD Message Validation" combines W3C XML Schema + XPath).
- AFD 2.0 was introduced in 2020 while AFD 1.0 continues to be supported; SIVI explicitly frames this as a gradual, non-big-bang migration, with both versions coexisting and SIVI providing 1.0<->2.0 mappings and an AFDshort intermediate format.

Verdict: CONFIRMED.

## Summary Table

| # | Claim | Verdict |
|---|-------|---------|
| 1 | Koopmans/Tercera on STOP/Kadaster + backwards compatibility | confirmed |
| 2 | Seven-vendor brandbrief, 9-month test period, withdrawn | confirmed |
| 3 | STOP/TPOD mandatory for all since 1 Jan 2024 | refuted (TAM-IMRO transitional alternative permitted through 2026/2031; adoption was low at go-live) |
| 4 | InfoPath discontinued / gap noted | confirmed |
| 5 | EDIFACT->XML/EUCDM/DVA migration | refuted as sourced (cited URL doesn't mention it) but substantively confirmed via better sources |
| 6 | SIVI AFD XML standard, 1.0/2.0 coexistence | confirmed |
