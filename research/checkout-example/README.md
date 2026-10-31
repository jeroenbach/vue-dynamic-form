# Research: checkout form for the docs' advanced example

Find a complex, famous webshop checkout form to rebuild with the dynamic form library as the advanced example on the docs site, with enough public engineering reputation that the docs can reference it by name.

## Structure

- `brief.md`: refined question, scoping decisions, mode decision, angle table, ranking formula
- `raw/`: per-angle notes written as research happens (URLs, quotes, numbers, dead ends)
- `final-report.md`: ranked candidates, verified claims, the recommendation

## Method

Solo research (see mode decision in brief.md): web search and page fetches per angle, raw notes to disk after each angle, self-verification of load-bearing claims against independent sources, then synthesis.

## Status: COMPLETE

- [x] Folder and brief created
- [x] Angle: famous-checkouts (engineering-reputation folded in; see raw/famous-checkouts.md)
- [x] Angle: checkout-complexity (raw/checkout-complexity.md)
- [x] Angle: library-fit (raw/library-fit.md)
- [x] Verification of load-bearing claims (raw/verification.md, no refutations, two attribution rules)
- [x] final-report.md (recommendation: Shopify-style one-page checkout)
- [x] TLDR to Jeroen (chat, 2026-10-23)

## Resume instructions

Fresh session: read this file, then `brief.md`, then skim `raw/` for completed angles. Re-run only angles whose raw files are missing or empty, then continue from the first unchecked status item above.

## Log

- 2026-10-23: Folder created, brief written, solo mode chosen. Research starting.
- 2026-10-23: All angles done solo (web search + direct fetches of baymard.com and shopify.com), claims verified, final report written. Recommendation: rebuild a Shopify-style one-page checkout as the leading advanced example. Follow-up for a future session: run the docs page through /spec:feature and build it.
- 2026-10-24: Added live browseable Shopify checkout references (shopify.supply, allbirds.com, gymshark.com) to raw/famous-checkouts.md, recovered from the FEAT-001 design discussion.
