# Brief: a docs example domain where the repeatable ordered choice truly shines

## Refined question

Which domain should replace the cancelled trip-itinerary builder (FEAT-007) as the dedicated docs example for the repeatable ordered choice shape (`maxOccurs > 1` + `choice` + `explicitChoiceSelection` + `displayOrder: 'added'` + `preserveOrder: true`)? The trip itinerary failed on one axis: its order dimension was chronology, derivable from each segment's own dates, so reordering degenerated into sorting and the form read as registration of decisions already made elsewhere.

The winner must satisfy all seven criteria at once:

1. Each occurrence is a choice between genuinely different branch types with different fields.
2. The order of occurrences is a free-standing user decision, NOT derivable from any field value.
3. Order has hard semantic consequences, ideally cross-row validation that reordering alone can fix or break.
4. A live summary panel has something meaningful to show that reacts to order.
5. Buildable as a static VitePress docs example, no backend.
6. Instantly recognizable to the docs audience (Vue/web developers evaluating a form library).
7. No overlap with the existing Shopify-style checkout example's money/payment story.

## Scoping decisions

- Jeroen cancelled FEAT-007 mid-review (2026-10-25) with the direction "find another good example where this can really shine"; the criteria above encode that direction plus the originating FEAT-007 constraints that still hold (static demo, docs audience, no checkout overlap).
- Jeroen's scoping answer (2026-10-25, mid-research): FEAT-006 (inbox rules builder, already at awaiting-discussion with full design/arch/review) is a good candidate but very technical. He wants a few candidates, preferring a day-to-day domain whose fictional form user is an ordinary person, not a developer. This reinterprets criterion 6: the domain must be recognizable to everyday people, while the page still teaches the developer reading the docs. Developer-tool domains (CI/CD pipelines, middleware chains, feature-flag rules) are therefore demoted, not banned; inbox rules stays in the ranking as the technical benchmark.
- Candidate list is open: the suggested candidates are a starting set, and the inventory angle deliberately hunts beyond them.
- Scale: small. Solo research with targeted web verification of load-bearing claims.

## Mode decision

**SOLO.** Reasoning: roughly 4 interdependent angles, small source volume (well under 30 pages), and the decisive step is judgment (mapping each domain onto this library's metadata shapes and the checkout's proven template patterns), which lives in this repo, not on the web. Jeroen is present and steering, so iteration speed matters. Load-bearing claims (whether a domain's ordering rules are real and well known, whether the anchor products are actually household names among web developers) get verified against primary sources before being stated as fact in the report.

## Angles

| Key | Focus |
|---|---|
| candidate-inventory | Enumerate domains where row order is a genuine, free-standing decision: the seven suggested candidates plus anything the "first-match-wins" and "sequence-is-the-product" lenses surface (inbox rules, firewall/redirect rules, feature-flag targeting, CI pipelines, drip campaigns, signing order) |
| order-semantics | For each shortlisted candidate: what are the real, citable ordering rules in that domain (rule shadowing, deploy-needs-prior-test, error-handler-last, skip-targets-forward-only), and can a reorder alone fix or break them |
| recognizability | Which real products anchor each domain for a web-dev audience (GitHub Actions, Gmail filters, Cloudflare rules, Mailchimp journeys, Express middleware, DocuSign signing order), verified not assumed |
| library-fit | Map each shortlisted candidate onto the metadata shapes and the checkout's proven patterns (hidden vehicle leaf, setFieldValue reorder, live summary panel); done from repo knowledge, no web needed |

## Ranking formula

score = order-is-the-point (criteria 2+3, weighted double) x branch-type diversity (1) x live-summary payoff (4) x audience recognition (6), gated by hard pass/fail on static buildability (5) and checkout non-overlap (7).
