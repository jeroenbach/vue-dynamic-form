# Raw notes: order semantics per shortlisted candidate

For each candidate: the real, citable ordering rules, and whether a reorder alone can fix or break them (the FEAT-007 acid test).

## Event run-of-show (wedding/party program)

- Rows carry durations only; clock times are computed from a single start time plus the sum of preceding durations. Order is the authored product; nothing in a row implies its position. This is the structural inverse of FEAT-007's flaw.
- Verified domain conventions (see recognizability notes for sources): a standard reception order exists (grand entrance, first dance, welcome toast, dinner, speeches, parent dances, cake cutting, open dancing, send-off); speech blocks are slotted around courses; cake cutting comes after dinner.
- Verified hard rule: amplified-music curfews are real and common (local noise ordinance, license/planning conditions, or venue agreements; 21:00 to 23:00 typical). Whether a band/DJ set or mic'd speech ends before curfew depends on the total duration of everything ABOVE it, so moving it earlier fixes a violation and moving anything long above it breaks one. Order-only, reorder-fixable: the acid test passes.
- Relative-position rule: cake cutting after all dinner courses. Order-only, reorder-fixable.
- Boundary rules: first item should not be a break; send-off last.
- Honest limitation: venue-close overflow ("the program ends after midnight") is duration-dependent, not order-dependent; keep it in the summary as a budget indicator, not as the star validation.

## Workout plan builder

- Verified rules (aworkoutroutine.com, hypertrophy/coaching sources): warm-up first, cool-down last; compound exercises before isolation exercises; larger muscle groups before smaller ones; most demanding work while freshest. Pre-exhaustion exists as a deliberate advanced exception, worth one honest line of page copy.
- "No compound after any isolation" is a position-class rule over the whole list: order-only, reorder-fixable.
- "No same muscle group in consecutive strength rows" and "no two high-intensity cardio blocks adjacent" are adjacency rules: order-only, reorder-fixable.
- No computed-clock cascade; the live consequence is an intensity/sequence profile rather than times.

## Recipe builder

- Kind-position rules (a cook step needs a prior prep step, rest follows cook, serve last) are order-only and reorder-fixable, but generic.
- The memorable rule ("you frosted the cake before baking it") needs component tracking between rows (step X produces what step Y consumes), which means cross-row references by id, a real complexity step up for a docs example. Without it, validation is noticeably weaker than the other two.

## Email drip campaign

- Computed "Day N" per step cascades from preceding wait steps: same computed-schedule antidote as run-of-show, and vee-validate-friendly.
- "A condition referencing an email must sit below that email" is order-only.
- Demoted on persona (marketer, not ordinary user), not on mechanics.

## FEAT-006 inbox rules (benchmark)

- First-match-wins is the purest order semantics available: a row's entire effect depends on the rows above it; shadowing ("this rule can never match") is detectable and only reordering or editing fixes it. Already specced through chain 1. Fails only Jeroen's ordinariness refinement.

## Rejected on the acid test

- Trip itinerary (FEAT-007): absolute dates per row make order derivable. The documented failure this research exists to avoid.
- Weekly meal planner: fixed weekday slots, same flaw.
- Approval/signing order: order matters but consequences are thin (who is asked first); little cross-row validation.
