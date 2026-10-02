# Phase 2 raw notes: Dutch government inhuur (contractor) postings for forms/frontend work

Angle: publicly indexed Dutch government hiring/inhuur broker postings (Flextender, InhuurdeskNL,
gemeente-specific inhuurdesks, TenderNed, opdrachtoverheid.nl, freep.nl, LibLab, Harvey Nash) for
frontend or forms-related work. Search date: 2026-09-30. Method: WebSearch (Dutch + English queries)
+ WebFetch to confirm snippets against source pages. All rates exclude VAT and include the broker's
service fee unless noted.

## Method notes / access limits

- Flextender's own PDF export (`app.flextender.nl/nologin/jobtopdf/<id>`) is a binary PDF; WebFetch
  cannot parse it directly, only search-engine snippets/summaries of it are available. Where a
  posting only exists as a Flextender PDF, I relied on the Google-indexed snippet text, which is
  thinner than a full fetch would give.
- TenderNed detail pages (`tenderned.nl/aankondigingen/overzicht/<id>`) render client-side; WebFetch
  only got the page chrome ("Aankondigingen" header), no listing content. Could not confirm
  https://www.tenderned.nl/aankondigingen/overzicht/394526 ("Inhuur Front-end Developer") beyond the
  search snippet title. Flagged as unconfirmed/dry well.
- Flextender's live opdrachten search page (`flextender.nl/opdrachten/?zoeken=formulieren`) also
  renders client-side; WebFetch only got the empty shell, not results. Could not get a live current
  list this way — relied on search-indexed individual postings instead, which are dominated by
  already-closed ones (that's fine as recurring-demand evidence, just not "apply today" material).
- matchd.nl "Developer E-Formulieren" vacancy: 404 on fetch, dead link from search index. Dry well.
- sentior.com/opportunity/1037481 "Ontwikkelaar Digitale Formulieren": fetch returned only the word
  "Sentior", no content (JS-rendered page, blocked). Dry well.
- einvigi.com "Freelance Ontwikkelaar Digitale Formulieren": 404. Dry well.
- raakvlakadvies.nl/cases/doorontwikkeling-open-formulieren: 404 on direct fetch (page may have moved
  or requires JS); had to reconstruct via search snippet only.

## Confirmed postings (chronological, most useful first)

### 1. Provincie Noord-Brabant — Ontwikkelaar digitale formulieren
- Source: LibLab job page https://liblab.nl/opdrachten/ontwikkelaar-digitale-formulieren/ (fetched,
  full content), corroborated by WebSearch snippet mentioning the same iProx migration.
- Status: **Closed** (interviews targeted 2026-09-03), but posting itself dated for a
  2026-09-14 → 2027-02-27 contract, so this is very recent (posted ~Aug/early Sept 2026).
- Rate: max €115/hour excl. VAT.
- Hours: 32/week.
- Scope: rebuild 300+ digital forms migrating from Formdesk to a new iProx.forms + iProx.web
  platform. Explicit requirement: "Aantoonbare ervaring met het ontwikkelen en beheren van complexe
  digitale formulieren" including **skiplogica** (skip/conditional logic), XML/JSON, DigiD/eHerkenning,
  ESB integrations, subsidy forms, WCAG 2.2, GDPR. 5+ years experience, HBO level.
- Not Open Formulieren / not Vue, but a textbook match for "XSD-to-form import" and "complex forms
  subcontracting" positioning — a province openly admitting 300 forms need complex-logic rebuilds is
  strong proof of budget and appetite for exactly this kind of work, regardless of stack.
- Next action: this exact instance is closed, but iProx migrations of this size run in waves;
  register with LibLab (https://liblab.nl/zzp-ict/) and watch for the next Noord-Brabant/iProx
  posting, or reach out to Noord-Brabant's inhuurdesk directly referencing this project.

### 2. Gemeente Rotterdam — Platform dienstverlening specialist (Open Formulieren)
- Source: opdrachtoverheid.nl, fetched in full.
  https://www.opdrachtoverheid.nl/inhuuropdracht/gemeente-rotterdam/platform-dienstverlening-specialist/446B8C33-97F1-41C4-9E6E-9600D3BD8A17
- Status: **Closed**, deadline was 2025-11-10, but contract period 2026-01-05 → 2027-01-04 (with
  2×6-month extensions) means people from this round are working right now through Sept 2026 and
  likely into 2027.
- **5 professionals** requested simultaneously — unusually large cohort, implies an active,
  well-funded Open Formulieren rollout, not a one-off.
- Rate: €90–€100/hour incl. 10% broker fee. Hours: 24–32/week.
- Required: 1+ year hands-on Open Formulieren (building/modeling/configuring), 1+ year GZAC
  configuration, 1+ year OTAP + handover to functional management, 2+ years zaakgericht werken.
  Desired: Open Zaak/OpenKlant APIs, Atos eSuite-editor cert, municipality 250k+ residents.
- Confirms Rotterdam is mid-rollout of Open Formulieren replacing e-Suite (see item 7 below for the
  Raakvlak/Maykin background) and is scaling with external hires, not just the original vendor team.
- Next action: register on opdrachtoverheid.nl / watch Rotterdam's inhuurdesk for the next batch;
  the 12-month contract from Jan 2026 means a renewal/extension decision point lands around
  Nov–Dec 2026 — worth checking back then for a fresh posting.

### 3. Gemeente Zwolle (via Flextender) — Ontwikkelaar Open Formulieren
- Source: Flextender PDF (binary, only search-snippet accessible), aanvraagnummer 26242.
  https://app.flextender.nl/nologin/jobtopdf/26242
- Status: **Closed**. Deadline was 2026-01-06 09:00, interviews 2026-01-12.
- Duur: 16 weeks + 2×2 month extension options, 16 hours/week, region Overijssel, HBO level, DAS
  assignment (Flextender's Dynamic Procurement System).
- Thin confirmation (snippet only, not full fetch) — treat as directional evidence, not a hard fact
  sheet.
- Next action: register on Flextender's DAS for Overijssel-region ICT/forms categories; Zwolle runs
  Open Formulieren work in short (16-week) increments, so a new round is plausible on a ~6 month
  cadence — worth a calendar check-in around Nov 2026 / spring 2027.

### 4. Gemeente Ede — Medewerker Digitale Diensten (Open Formulieren conversion)
- Source: opdrachtoverheid.nl, fetched in full.
  https://www.opdrachtoverheid.nl/inhuuropdracht/ede/medewerker-digitale-diensten/2545d31e-1057-4c6d-938c-f4e4b4e60cd9
- Status: **Closed**, deadline 2025-05-16 (old — over a year ago), contract ran to 2025-11-01.
- Scope: convert **~250 municipal forms** into Open Formulieren. Rate max €80/hour incl. Flextender
  fee €1.90/hour. 36 hours/week.
- Corroborating detail: Delta10 blog post confirms Gemeente Ede was Delta10's first Open Formulieren
  customer (https://www.delta10.nl/blog/gemeente-ede-eerste-gebruiker-van-open-formulieren-via-delta10),
  so Ede's conversion project has an established vendor relationship — a subcontracting angle through
  Delta10 is plausible.
- Next action: old posting, evidentiary only. Worth reaching out to Delta10 directly (see item 8).

### 5. Nationale Politie — DevOps Engineer OpenFormulieren (2 FTE) via Harvey Nash
- Source: freelance.nl, fetched in full.
  https://www.freelance.nl/opdracht/1176000-devops-engineer-openformulieren
- Status: **Closed**, deadline was 2026-07-16.
- Scope: stand up the technical environment for an Open Formulieren-based citizen portal for police
  services, deliver 5 prioritized digital services, knowledge transfer. 24-month duration (long!),
  36 hours/week, Utrecht (hybrid). Rate €95/hour all-in.
- **Important constraint: "ZZP contractors not eligible"** — requires BO+ security screening and
  apparently a detachment/payroll construction via Harvey Nash, not straight freelance. Still useful
  as evidence that Open Formulieren adoption is spreading to national-level organizations (not just
  municipalities) at meaningful scale (2 FTE × 24 months).
- Next action: not directly actionable solo-freelance (ZZP excluded), but confirms Politie is a live
  Open Formulieren adopter — worth watching Harvey Nash's national police postings for
  frontend/forms roles that don't carry the ZZP exclusion.

### 6. Nationale Politie — Front-end Developer (BVID-2→BVID-3), historical
- Source: opdrachtoverheid.nl, fetched in full.
  https://www.opdrachtoverheid.nl/inhuuropdracht/inhuurdesk-politie-nationale-politie/front-end-developer/inhuurpolitie_004534/
- Status: **Closed/old**, deadline 2023-01-09, rate €80/hour max incl. 10% fee, 36 hours/week.
  Migrating an identification-verification application frontend. Not forms-specific, general
  evidence Politie's inhuurdesk runs recurring frontend contractor postings (a second, newer Politie
  front-end posting was also indexed, deadline 2025-02-26, same inhuurdesk/URL pattern
  `inhuurdesk-politie-nationale-politie`) — worth bookmarking that inhuurdesk URL pattern to check
  periodically for open reqs.

### 7. Gemeente Amsterdam — Front-end developer NISE (GZAC), historical
- Source: freep.nl, fetched in full. https://www.freep.nl/opdracht/front-end-developer-nise
- Status: **Closed/old**, contract was 2023-01-01 → 2023-12-31, rate max €100/hour, 32 hours/week.
- Scope: front-ends on GZAC (case-management) for the Erfpacht & Uitgifte department, Common Ground
  5-layer architecture. Stack: TypeScript, Angular, React, Formio libraries, ZGW APIs, Camunda/BPMN.
  Old signal (2023) but Amsterdam runs recurring front-end/GZAC postings via freep.nl — other 2026
  search hits on freep.nl for Amsterdam include "Interim opdracht front-end ontwikkelaar" and
  "Senior Front-end Developer" (titles only, not fetched in full — dry well beyond the title/URL).

### 8. Raakvlak Advies — Rotterdam Open Formulieren/GZAC doorontwikkeling (partner prospect, not a posting)
- Source: WebSearch snippets of raakvlakadvies.nl case pages (direct fetch 404'd, JS-rendered site).
  Key pages found: /cases/doorontwikkeling-open-formulieren, /cases/knallen-met-open-formulieren,
  /cases/gzac-nieuwe-fase-in-rotterdam, /cases/van-de-e-suite-naar-het-gzac-de-beproeving-van-gemeente-rotterdam
- Raakvlak Advies (a known Maykin-adjacent partner per Phase 1) did the **fitgap analysis** between
  e-Suite and Open Formulieren for Rotterdam starting 2022, leading to a Dimpact development
  assignment to Maykin Media + Eviden, financed by Rotterdam, live by April 2024. Raakvlak is
  explicitly named as still doing "doorontwikkeling" (continued development) work for Rotterdam.
- This is not a job posting but confirms Raakvlak is an active intermediary/consultancy between
  municipalities and Maykin on exactly this technology — a subcontracting-partner prospect rather
  than a direct-apply lead. Not re-fetchable today (404), so treat details as directional.
- Next action: reach out to Raakvlak Advies directly (not urgent/time-boxed, no deadline) proposing
  the vue-dynamic-form engine as a complement/alternative for the repeating-group logic gap they
  themselves scoped in the original fitgap analysis.

### 9. Delta10 — Open Formulieren implementation partner (partner prospect, not a posting)
- Source: WebSearch + delta10.nl pages (not deep-fetched).
  https://www.delta10.nl/solutions/open-formulieren,
  https://www.delta10.nl/blog/gemeente-ede-eerste-gebruiker-van-open-formulieren-via-delta10,
  https://www.delta10.nl/work-at/backend-developer-met-ops
- Delta10 self-describes as "the partner for municipalities" for open source software (hosting,
  implementation, management, support), serving 5M+ residents across 50+ implementations. They have
  an open Backend Developer vacancy (permanent role, not freelance/ZZP — dry well for inhuur angle)
  but confirm they're actively growing their Open Formulieren practice.
- Next action: partner-prospect outreach, not a time-boxed apply-now lead.

### 10. GitHub issue #2441 — "Repeating groups: No possibility to use logic for each item in a group"
- Source: https://github.com/open-formulieren/open-forms/issues/2441 (fetched).
- **Status: still OPEN**, filed 2022-12-07, no maintainer resolution in ~4 years. This is the exact
  engine gap cited in the Phase 1 research brief, now independently re-confirmed by direct fetch.
- Internal cross-references in the issue body: "Utr 8, DH 366, rotterdam 37" — meaning Utrecht, Den
  Haag, and Rotterdam each separately logged this as an internal ticket against their own Open
  Formulieren usage. Three separate G4/large municipalities independently hit the same wall.
- Corroborating changelog evidence (open-forms.readthedocs.io/en/stable/changelog-nl.html): multiple
  *crash* bugfixes (not feature additions) for logic/field-groups inside repeating groups across
  versions 3.4.0, 3.5.0, and 4.0.0 — e.g. "Crash opgelost wanneer frontend-logica wordt gebruikt
  binnen een veldengroep in een herhalende groep" (3.5.0), "Oneindige lus in logicacontrole opgelost
  ... wanneer een herhalende groep met clearOnHide:false verborgen wordt" (4.0.0). Reading between
  the lines: the maintainers are patching crashes around the edges of this limitation rather than
  shipping per-item logic itself — the structural gap the issue describes appears to still stand as
  of the 4.0.0 changelog.
- This is a thread/prospect lead, not a job posting: the actionable step is a low-key, technically
  substantive comment on the issue (or a linked write-up/demo) showing how per-item conditional logic
  in repeating groups works in vue-dynamic-form, tagged for the Utrecht/Den Haag/Rotterdam people who
  filed internal refs. No deadline pressure, but very direct technical fit.

## Dry wells (searched, nothing usable found)

- TenderNed detail page for "Inhuur Front-end Developer" (id 394526) — JS-rendered, could not confirm
  contents beyond the title snippet.
- flextender.nl live search/listing pages — JS-rendered, WebFetch only gets the shell.
- matchd.nl "Developer E-Formulieren" — 404, dead link.
- sentior.com/opportunity/1037481 — JS-rendered, no content extracted.
- einvigi.com freelance Ontwikkelaar Digitale Formulieren — 404.
- raakvlakadvies.nl case page — 404 on direct fetch (works via search snippet only).
- "Vue developer gemeente" direct-match searches consistently return generic Vue-hiring-agency SEO
  pages (Malt, Kojac, Lajos, 3Bird, Cloud++, Nucleus), never actual government postings — Dutch gov
  postings in this space essentially never name "Vue" explicitly; they name Open Formulieren, GZAC,
  Common Ground, or the specific forms platform (iProx, Formdesk) instead. Useful negative signal:
  don't bother searching "Vue" + "gemeente" again, search by platform/methodology name instead.
- "functioneel beheerder Open Formulieren" — returned only unrelated Logius/Defensie/generic postings,
  no direct match.
- Flextender aanvraagnr 21559 and 32111, sampled from search hits, turned out to be unrelated postings
  (a Kadaster DSO Java/Angular role and a Pijnacker-Nootdorp financial advisor role respectively) —
  Flextender's aanvraagnr sequence is shared across all categories, not forms-specific, so guessing
  adjacent numbers isn't a useful technique.

## Cross-cutting observations for the summary

- No posting in this angle names Vue or vue-dynamic-form directly — demand is expressed via the
  *platform* (Open Formulieren, iProx, GZAC) or the *methodology* (zaakgericht werken, Common Ground),
  never the frontend framework. A freelancer positioning against this channel should lead with
  Open Formulieren / XSD-form-migration keywords, not "Vue developer."
- Municipal Open Formulieren rollouts consistently request "1+ year hands-on Open Formulieren
  experience" as a hard filter — a genuine barrier to a Vue specialist without direct Open Formulieren
  résumé lines, reinforcing that the higher-leverage play is the ecosystem/subcontracting angle
  (Raakvlak, Delta10, Daadkracht, Maykin) or the GitHub issue engagement, not applying to these
  inhuur postings cold.
- Multiple independent organizations (Noord-Brabant/iProx, Rotterdam/Ede/Zwolle/Open Formulieren,
  Politie/Open Formulieren) are mid-migration on forms platforms *right now* (2025–2026), each citing
  "complex logic," "skip logic," or repeating-group pain explicitly in their req text — this is a
  live, funded, recurring category of work, just gated behind platform-specific experience or
  detachment-construction requirements rather than open to a cold ZZP applicant.
