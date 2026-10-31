# Final report: the ordered-choice example domain

## Conclusion in one sentence

Build a **wedding/party run-of-show builder**: rows carry only durations, every row's clock time is computed from the rows above it, and an amplified-music curfew turns reordering into the thing that fixes or breaks validation, which is exactly the property the trip itinerary lacked.

## Why the trip itinerary failed, as a reusable test

FEAT-007's rows carried absolute dates, so order was derivable from the data and reordering degenerated into sorting. The acid test every candidate was scored against: **can a reorder alone, with no field edit, fix or break a validation?** Domains pass by one of two structures: computed schedules (durations in, clock times out) or first-match/adjacency semantics (a row's meaning depends on its neighbours or predecessors).

## Ranking formula

score = order-is-the-point (criteria 2 and 3, double weight) x branch-type diversity (1) x live-summary payoff (4) x ordinary-user recognition (6, per Jeroen's steer), gated by static buildability (5) and checkout non-overlap (7). All shortlisted candidates pass both gates and need zero packages/core changes (see raw/library-fit.md).

## Ranked candidates

| # | Candidate | Order is the point (x2) | Branch diversity | Summary payoff | Ordinary-user recognition | Verdict |
|---|---|---|---|---|---|---|
| 1 | **Event run-of-show (wedding/party program)** | 5: durations only, clock times computed; curfew rule is order-sensitive and reorder-fixable | 4 | 5: live timeline with cascading clock times | 5: everyone has attended a wedding | **Winner** |
| 2 | Workout plan builder | 5: compound-before-isolation, adjacency and boundary rules, all order-only and published coaching orthodoxy | 4 | 4: duration and intensity profile, no cascade | 4: gym-goers | Strong runner-up |
| 3 | FEAT-006 inbox rules (benchmark) | 5: first-match-wins, shadowing detection | 4 | 5: live test-inbox routing | 3: technical per Jeroen | Shelve, do not delete: strong second example later |
| 4 | Recipe builder | 3: kind-position rules only, unless component tracking is added (overdesign risk) | 4 | 3: total and active time | 5 | Charming but weakest validation story |
| 5 | Email drip campaign | 5: Day-N cascade, reference-above rules | 4 | 5 | 3: marketer persona | Mechanically excellent, demoted on persona |
| 6 | CI/CD pipeline, middleware chain, flag/firewall rules | 5 | 3 to 4 | 4 to 5 | 2: developer tools | Demoted on persona |
| 7 | Approval/signing order | 3 | 2 | 3 | 4 | Thin fields, thin consequences |

Rejected on the acid test (order derivable or dictated): weekly meal planner, garden planting, furniture assembly, school timetable, the cancelled trip itinerary itself.

## The winner, sketched

**Working title: "Plan the reception" (wedding or big-party run-of-show).** A planner builds the evening's program; the form computes the clock.

Top-level scalar leaves: event start time, venue close, amplified-music curfew (editable, so the reader can move the curfew and watch rows flip between valid and invalid).

The repeatable ordered choice, one occurrence per program item, six branches with genuinely different fields:

- **Speech / toast**: speaker name, duration select (5/10/15/20 min), on the mic yes/no.
- **Dinner course**: course select (starter/main/dessert), duration.
- **Band / DJ set**: act name, duration. Amplified by definition.
- **Open dance floor**: duration, music style. Amplified.
- **Cake cutting**: near-childless branch (fixed short duration, optional note), the same shape the checkout's express/PayPal branches exercise.
- **Break / room turn**: duration.

Each row displays its computed start and end clock time: event start plus the sum of all durations above it. This is structurally the checkout ledger's running remainder (a fold over ordered rows, displayed per row), so the page's central pattern is already proven in production docs code. The cancelled FEAT-007 prototype's vertical timeline design (rail, per-kind icon nodes) transfers almost unchanged, recovering part of that design investment.

Cross-row validation (hidden vehicle leaf + validateField re-trigger, the checkout's proven pattern):

1. **Curfew rule (the star)**: every amplified item (band, dance floor, mic'd speech) must END before the curfew. Whether it does depends only on what sits above it, so dragging the band set up fixes a violation and pushing a long course above it breaks one. Verified as a real, common venue constraint (noise ordinances, license conditions; sources in raw/recognizability.md).
2. **Cake after dinner**: cake cutting must come after all dinner courses (verified convention).
3. **Boundary**: the program does not start with a break.
4. Venue-close overflow shown in the summary as an indicator, not a blocking rule, because total duration is order-independent; the page copy says so honestly, mirroring the checkout's "Ordering is UI-level, not XSD" candour.

Live summary panel (OrderSummary pattern): the computed evening timeline, end time vs venue close, curfew status with the offending items named, counts per kind.

## Corrections log

No load-bearing claim was refuted during verification. The pre-exhaustion exception to "compound before isolation" (workout candidate) is noted as an honest-copy footnote if that candidate is ever built.

## Caveats

- The run-of-show's rules 2 and 3 are conventions rather than laws; the curfew rule carries the hard-validation weight. If Jeroen wants two hard rules, a second clock-anchored rule ("kitchen serves the main course no later than 20:00") is the natural addition and uses the same machinery.
- FEAT-006 (inbox rules) loses nothing by waiting; it is fully specced at awaiting-discussion and would serve later as the technical sibling example, the same way checkout and advanced coexist.

## Recommended next step

Create the feature spec with `/spec:feature` for the run-of-show builder (branch set and validation rules above as the idea input), or `/spec:discuss FEAT-006` first if the inbox-rules spec should be formally parked rather than left open.
