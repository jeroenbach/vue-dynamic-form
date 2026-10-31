# Research: ordered-choice docs example domain

## Purpose

Find the domain for a new docs example where the repeatable ordered choice shape (`maxOccurs > 1` + `choice` + `explicitChoiceSelection` + ordering) genuinely shines, replacing the cancelled trip-itinerary builder (FEAT-007), whose order dimension turned out to be derivable chronology (reordering = sorting). Deliverable: a ranked candidate list with a clear winner, each scored on seven fixed criteria, and the winner's branch set plus cross-row validation rules sketched.

## Structure

- `brief.md`: refined question, scoping decisions, mode decision (SOLO), angle table, ranking formula.
- `raw/`: per-angle working notes written as the work happens (URLs, quotes, dead ends).
- `final-report.md`: the ranked list and winner recommendation (written last).

## Method

Solo research (see brief.md "Mode decision"): four angles worked in order (candidate-inventory, order-semantics, recognizability, library-fit), raw notes per angle written to `raw/` before moving on, targeted web verification of load-bearing claims, then synthesis.

## Status: COMPLETE

- [x] Folder + brief created
- [x] Angle: candidate-inventory (`raw/candidate-inventory.md`)
- [x] Angle: order-semantics (`raw/order-semantics.md`)
- [x] Angle: recognizability (`raw/recognizability.md`)
- [x] Angle: library-fit (`raw/library-fit.md`)
- [x] Verification of load-bearing claims (run-of-show conventions, curfew reality, workout ordering rules; no refutations)
- [x] final-report.md (winner: wedding/party run-of-show builder; runner-up: workout plan builder; FEAT-006 inbox rules shelved as the technical benchmark)

## Resume instructions

For a fresh session: read this file, then `brief.md`, then skim `raw/` for completed angles. Continue from the first unchecked item above. The FEAT-007 spec (`specs/FEAT-007-trip-itinerary-builder-example/spec.md`) holds the cancelled example's full context, including the Constraints & assumptions section listing the engine mechanisms and checkout-era rough edges any successor example inherits; its adversarial review was stopped mid-write, so that section is partial. `research/checkout-example/` is the sibling research this one mirrors in method.

## Log

- 2026-10-25: FEAT-007 (trip itinerary) cancelled by Jeroen mid-adversarial-review; direction given to find a domain where order really matters. Folder created, SOLO mode chosen, angles defined.
- 2026-10-25: Mid-research discovery: FEAT-006 (inbox rules builder) already fully through chain 1 at awaiting-discussion. Jeroen's steer: good but too technical; prefer day-to-day, ordinary-user domains with a few candidates. Criterion 6 reinterpreted accordingly.
- 2026-10-25: All angles done, claims verified (no refutations), final report written. Winner: wedding/party run-of-show builder (durations in, clock times computed, curfew validation). Runner-up: workout plan builder. FEAT-006 shelved as the future technical sibling example. Follow-up for a future session: run /spec:feature with the winner's sketch from final-report.md, and decide FEAT-006's fate via /spec:discuss FEAT-006.
