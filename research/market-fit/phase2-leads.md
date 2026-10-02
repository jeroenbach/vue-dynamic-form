# Phase 2 — Verified lead list

Synthesized 2026-09-30 from 9 Sonnet lead-hunters + 9 verifiers (64 raw leads; raw notes
in `raw/phase2-*.md`). Every Tier 1/2 lead below was link-checked; verification
corrections are incorporated. Ranked by (evidence × library fit × actionability now).

## Tier 1 — act this week

### 1. The Open Formulieren repeating-group gap: a maintainer publicly asking for outside help ⭐
- **open-forms#2441** — "Repeating groups: no possibility to use logic for each item"
  ([link](https://github.com/open-formulieren/open-forms/issues/2441)) — VERIFIED LIVE.
  Open since Dec 2022. Maintainer sergei-maertens (Maykin), 2026-09-09, verbatim:
  *"There is currently no budget for anything related to repeating groups… not planned"*,
  after repeated outreach to stakeholders (incl. Den Haag) with "zero positive response";
  "reported often by clients". Issue body cross-references internal tickets of **Utrecht,
  Den Haag and Rotterdam** ("Utr 8, DH 366, rotterdam 37") — three G4-scale
  municipalities logged the same gap independently.
- **open-forms#6055** — DMN logic in repeating groups
  ([link](https://github.com/open-formulieren/open-forms/issues/6055)) — VERIFIED LIVE.
  Filed by the maintainer himself, March 2026: current per-item workaround is
  *"completely unsustainable for form builders"*; scoped at 8–10 days, unscheduled 6+ months.
- **Epic #4942** "Herhalende groep"
  ([link](https://github.com/open-formulieren/open-forms/issues/4942)) — VERIFIED LIVE,
  labels `owner:den-haag`, `owner:utrecht`, `owner:dimpact`, status "waiting for approval",
  11+ sub-issues.
- **Action:** build a small runnable demo (per-item conditional logic inside a repeatable
  section, the exact #2441 scenario) with vue-dynamic-form; post one factual, non-salesy
  comment on #2441 referencing #6055/#4942; in parallel email Maykin and Dimpact's Open
  Formulieren programme proposing a paid scoping engagement. This is the highest-leverage
  single move from the entire research.

### 2. Named humans to contact in that orbit
- **Bregje van der Horst** — Product Owner/Community Manager Open Formulieren at Maykin,
  and confirmed lead of the Rotterdam e-Suite→Open Formulieren migration team (verified
  via Raakvlak case page; a claimed April-2026 accessibility webinar could NOT be
  verified — don't cite it). Best single contact for the engine-gap conversation.
- **Raakvlak Advies** — verified: running Rotterdam's forms migration
  ([case](https://www.raakvlakadvies.nl/cases/knallen-met-open-formulieren), live;
  team Bregje van der Horst, Daniël Stroes, Geert Donkers). They wrote the original
  fitgap analysis, i.e. they know exactly what Open Formulieren can't do. Pitch:
  subcontracted specialist for the hard-forms cases.
- **Delta10** — verified implementation partner ([page](https://www.delta10.nl/solutions/open-formulieren)).
  Fresh issue [#6619](https://github.com/open-formulieren/open-forms/issues/6619)
  (2026-09-03, verified live) shows reporter `justiandevs` hitting a repeating-group
  renderer gap on a "Moerdijk acceptation" environment and offering to help build a fix
  (Delta10 attribution is plausible inference, not stated — verify before naming it in outreach).

### 3. Keylane — Senior Front End Engineer, Plexus (pension portals) — VERIFIED LIVE
[Posting](https://apply.workable.com/keylane/j/23CC323985/). Near-verbatim match:
Vue 2→3 migration, WCAG alignment, "reusable, configurable components supporting multiple
customer needs" on a multi-tenant insurance/pension SaaS. **Action:** apply or pitch the
hiring manager a short technical note this month — as contract work or consulting, not
necessarily employment.

### 4. Timed hook: modeltoegankelijkheidsverklaring deadline 1 Oct 2026 — VERIFIED
Every Dutch government org must republish its accessibility statement (with named
exceptions and concrete improvement measures) by **tomorrow**, 1 Oct 2026
([source](https://www.audithouse.nl/nieuws/model-toegankelijkheidsverklaring-2026/)).
**Action:** timed outreach to gemeente webmasters/accessibility officers offering a
forms-specific technical gap assessment. Concrete verified example to cite:
**Gemeente Groningen's** huisvuilpas form is status D, no audit planned, self-set deadline
31-12-2026 ([dashboard](https://dashboard.digitoegankelijk.nl/organisaties/445/websites-apps/22348),
verified — note: runs on Mendix, so pitch assessment/consulting, not a library swap).

### 5. Robbe Assuradeuren (volmacht) — VERIFIED LIVE
[Vacancy](https://www.robbe.nl/over-robbe/vacatures/vacature-applicatiebeheerder-ccs-level-7)
first-party admits AFD-label uniformization (SUIV) work + a customer "Mijn-omgeving"
portal. Contact verified on page: Paul Robbe, p.robbe@robbe.nl, 0162-452200.
**Action:** cold email proposing a paid scoping call on the portal + AFD work.

## Tier 2 — outreach this month

- **Dimpact** (budget holder behind `owner:dimpact` labels). Use epic #4942 as the
  evidence, not the stale 2021 launch article. Find the Open Formulieren programme
  manager via dimpact.nl.
- **xxllnc × Maykin partnership** — verified live
  ([announcement](https://xxllnc.nl/nieuws/xxllnc-start-samenwerking-met-maykin)):
  commercial zaaksysteem vendor embedding Open Formulieren; commercial incentive to close
  feature gaps faster than public funding allows. White-label/OEM pitch.
- **vee-validate discussion #5056** — verified unanswered for 15 months
  ([link](https://github.com/logaretm/vee-validate/discussions/5056)): cross-section
  conditional validation, exactly what `useFieldValue`/computedProps solves. Reply with a
  code sketch — zero competing answers, the library builds on vee-validate. Cheap,
  high-credibility seed.
- **NVGA Protocol 2.0 vendor quartet: ANVA, CCS, DIAS/Blinqx, Solera NL** — sector-mandated
  AFD 2.0 rollout through 2026 (cite https://suiv.nl/nvga-protocol-2/ and the July-2026
  schade-magazine piece; the "update" URL only covers 2024 dates — verifier correction).
  ANVA frontend role is real (contact b.yildirim@anva.nl) but find the direct posting URL;
  no NVGA tie-in is stated in postings — it's your opening line, not theirs.
- **AFM accessibility investigation of financial firms** (Q2 2026, keyboard-trap criterion
  hits custom form widgets). Named Verbond van Verzekeraars task-force contacts
  Patricia Swienink and Luuk van der Scheer — cite
  https://www.verzekeraars.nl/publicaties/actueel/voldoet-jouw-bedrijf-al-aan-de-accessibility-act
  (verifier-corrected source).
- **Alliantie Douane Software** — verified live member directory
  ([site](https://www.alliantiedouanesoftware.nl/)): ~20 named Dutch customs-software
  vendors (AEB, Boltrics, C4T, Eaze, Fiton, Gateway, Intris, Stratech, …) all mid-DMS/DVA
  migration. Outreach pass to 4–5 tech leads; the DMS 4.0 "why now" needs its own citation
  (not on the alliance page). Note: their stacks are Dynamics/OutSystems/Progress/Angular,
  so pitch a Vue-based customer-facing forms module as partnership, not a job application.
- **Vue agencies (verified live, stack partly unconfirmed — ask on first contact):**
  - **Appfront** (Amsterdam) — insurers + all 21 waterschappen, permit flows and claims
    apps; martijn.oele@appfront.nl (verified on site).
  - **Yameo** (Utrecht) — insurance/banking/gov, clients ERGO Hestia, Aon, ABN AMRO (verified).
  - **Passionate People** (Amsterdam) — official Nuxt agency partner, ING and Port of
    Rotterdam, staff-augmentation model (verified via nuxt.com).
- **Gebruiker Centraal "Community Online Formulieren"** — join it; practitioners
  Edith Franconi (DUO) and Karin Tempelaar (VDP) are real, but use the agenda URL
  https://www.gebruikercentraal.nl/agenda/online-bijeenkomst-online-formulieren-alles-wat-je-moet-weten-over-toegankelijkheid/
  (verifier correction).
- **Common Ground Fieldlab, 9–10 Nov 2026, WTC Utrecht** — verified event
  ([page](https://commonground.nl/events/view/ab0f5d68-bb58-4cd7-9dc5-498442d7f3b7/common-ground-fieldlab-9-en-10-november-2026)).
  Confirm registration/vendor eligibility in a browser, then demo the #2441 scenario live
  to the exact audience (municipalities, Maykin, Dimpact, partners).
- **Shift2 B.V.** — young commercial forms vendor selling to gemeenten/waterschappen
  (verified live; confirmed client Pijnacker-Nootdorp with 75+ forms — the other four
  named clients could not be verified). Subcontracting/partnership pitch: 030-2271282.

## Tier 3 — pipeline registrations & watch list

- **Register now** (so the next opening finds you): opdrachtoverheid.nl (Rotterdam runs
  5 external Open Formulieren specialists at €90–100/h through Jan 2027 — renewal round
  likely Nov–Dec 2026), Flextender DAS Overijssel (Zwolle posts short Open Formulieren
  stints in waves), de Publieke Partner (placed Amsterdam's €103/h TriplEforms role and a
  WCAG+NL Design System Logius role), LibLab ZZP-ICT (Noord-Brabant's 300-form iProx
  migration at €115/h just started — follow-on roles plausible), GreenPepper (recruiter
  Zoë Gidding, zoe.gidding@greenpepper.nl, owns the province forms-developer niche).
- **Watch:** TenderNed award notice for the closed Vijfheerenlanden sociaal-domein
  front-end tender (approach the winner as subcontractor); Harvey Nash follow-ons to the
  Politie 24-month Open Formulieren portal (2 FTE, ZZP-excluded, proves national scale);
  Gemeente Amersfoort zaaksysteem selection phase; Gemeente Den Haag developer-facing
  forms roles (BA phase ran early 2026).
- **Content ammunition:** FormKit issue #1774 (2026-09-29, verified) — repeater +
  conditional siblings corrupt DOM identity, three workarounds failed. Corrections: it was
  NOT resolved via paid support and there's no medical-form context — drop those details.
  Use with the four older FormKit issues as a "why repeaters+conditionals break in
  schema-array libraries" comparison piece, plus a render-performance benchmark against
  JSONForms' documented array lag.

## Killed / downgraded leads (don't chase)

- **Belastingdienst AWA "Vue.js forms engine" precedent** — the cited PDF resolves to an
  unrelated 2017 branding asset; the Informer URL doesn't mention AWA/Vue at all. The
  story may be true but is currently UNVERIFIED — do not cite in outreach until a real
  source is found.
- Achmea Vue vacancies (expired/unconfirmed), Kadaster accessibility role (closed, programme
  continuation speculative), Stratech frontend vacancy (gone — only OutSystems/test roles
  remain), Boltrics "Douane Consultant" (doesn't exist; only a Dynamics developer role),
  Gateway software-developer vacancy (gone; only a product-consultant role — keep as
  domain-fit prospect for BD outreach only).

## Structural insight from the hunt

Dutch buyers never ask for "a Vue forms developer" — demand is expressed through the
platform (Open Formulieren, iProx, TripleForms, GZAC) or the compliance driver (WCAG,
Wmebv, AFD 2.0, DMS). Cold-applying as a framework specialist is the wrong pitch;
leading with the platform's named, evidenced gap (and the library as the proof you can
close it) is the right one. Upwork/LinkedIn are effectively invisible to indexed search —
if you want those channels, they need logged-in browsing, not agents.
