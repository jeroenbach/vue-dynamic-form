# Phase 1 verification notes: Dutch gov-forms claims

Adversarial fact-check pass, 2026-09-30.

## Claim 1: Open Formulieren is EUPL-licensed, free of license fees; gov orgs pay only support/hosting

- Maykin project page (`maykin.nl/en/portfolio/project/open-formulieren/`, redirected from `maykinmedia.nl`) does not itself say "EUPL" or spell out "pay only for support and hosting." It does say "Geen licentiekosten" (no license fees) and calls it open source.
- Independent confirmation of the license came from the actual repo: `github.com/open-formulieren/open-forms/blob/master/LICENSE.md` — full EUPL v1.2 text, both English and Dutch.
- The "pay only for support/hosting" framing is Maykin's standard SaaS pitch (matches Delta10's business model too: hosting + support, no license fee) but wasn't found as an explicit single sentence anywhere.
- Verdict: confirmed (EUPL confirmed independently via GitHub LICENSE; no-license-fee confirmed via Maykin's own page; the support/hosting-only payment model is the plausible, commonly-stated business model but not a verbatim quote found).

## Claim 2: SDK built on formio.js with published React components; no Vue-based renderer anywhere in the Dutch open-source gov-forms ecosystem

- `open-forms-sdk` README confirms: "leverages the Open Forms API, and is built on top of the formio.js SDK."
- The ecosystem does contain React-specific packages: `open-formulieren/formio-builder` (described as "a custom pure React designer/builder for formio.js form definitions") and `open-formulieren/formio-renderer` ("An alternative formio renderer," exposes React components like `FormioForm`).
- The "no Vue-based renderer anywhere in the Dutch open-source gov-forms ecosystem" clause is a universal negative. Searches (developer.overheid.nl register, GitHub org, general web search) turned up no Vue-based renderer in this space, but absence of evidence for a sweeping negative like this can't be fully proven by search alone.
- Verdict: unverified as a whole (the formio.js/React parts are independently confirmed; the "there is no Vue-based renderer anywhere" universal-negative clause cannot be conclusively confirmed or refuted from available sources).

## Claim 3: Maykin lists exactly 4 official implementation partners: Raakvlak, Daadkracht, Macoin, Taxonic

- `maykin.nl/nl/partners/` lists a category "implementatiepartners" containing exactly these four: Raakvlak, Daadkracht, Macoin, Taxonic. (Other categories exist on the same page — development partners like Dimpact/Gemeente Den Haag/Gemeente Utrecht, and code-maintenance participants like xxllnc — but those are separate categories, not implementation partners.)
- Independent corroboration: Daadkracht's own site (`daadkracht.nl/partnerschap-daadkracht-en-maykin/`) confirms the Maykin partnership from their side.
- Verdict: confirmed.

## Claim 4: Delta10 runs managed hosting/support across the whole Common Ground stack, Ede first Open Formulieren customer

- Delta10's blog (`delta10.nl/blog/gemeente-ede-eerste-gebruiker-van-open-formulieren-via-delta10`) and a corroborating LinkedIn post confirm Ede as Delta10's first Open Formulieren customer.
- However, Delta10's current solutions page (`delta10.nl/`) lists their actual product lineup as: Signalen, Atlas, Open Formulieren, Zo Gemeld/Zo Hersteld (apps built on Signalen), and a general "Common Ground Platform." Open Zaak and Open Notificaties are not listed as current Delta10 offerings; NLX and Haven are mentioned only as past/historical involvement via VNG, not as active managed services.
- Verdict: refuted (partial). The "first Open Formulieren customer = Ede" part is confirmed, but the claim that Delta10 runs hosting/support "across the whole open Common Ground stack (Open Formulieren, Open Zaak, Open Notificaties, NLX, etc.)" overstates their current lineup — Open Zaak, Open Notificaties, and NLX are not confirmed as active Delta10-hosted products.

## Claim 5: GEMMA eFormulieren built entirely on StUF-EF, each form ships an XSD, delivered as StUF-EF XML ingested automatically

- GemeenteOplossingen's own page (`gemeenteoplossingen.nl/producten/content_management/gemma_eformulieren/`) says only: "Ingevulde GEMMA eFormulieren ontvangt u per e-mail of als XML-bericht conform StUF EF" (completed forms are received by email OR as an XML message conforming to StUF EF) and that most-used case-management systems recognize the standard and can read completed forms automatically.
- This does not support "built entirely on the StUF-EF standard" (delivery is XML-conform-StUF-EF, email delivery is a separate, non-StUF-EF option) nor "each form ships with an XML message schema (XSD)" — no XSD-per-form claim appears on the page.
- Verdict: refuted. Correction: forms are optionally delivered as StUF-EF-conformant XML (or plain email), not "built entirely" on the standard; no per-form XSD claim is substantiated by the source.

## Claim 6: GEMMA Softwarecatalogus lists only 6 gemeenten in production for Open Formulieren, out of 342 municipalities

- `softwarecatalogus.nl/pakket/open-formulieren` states the count of gemeenten with the package "in productie" is 6, and explicitly marks the underlying municipality list as confidential ("Is vertrouwelijk").
- The Netherlands has 342 municipalities as of 1 January 2026 (confirmed via CBS, "Gemeentelijke indeling op 1 januari 2026," and corroborated by independent sources noting no municipal boundary changes in 2026).
- Verdict: confirmed.
