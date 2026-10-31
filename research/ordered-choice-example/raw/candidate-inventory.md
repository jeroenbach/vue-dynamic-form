# Raw notes: candidate inventory

## The lens from the FEAT-007 failure

The trip itinerary failed because each row carried an absolute timestamp, so the row order was derivable from the rows themselves: reordering was sorting. Two structural antidotes surfaced while brainstorming:

1. **Computed-schedule domains**: rows carry only durations; the clock schedule is computed from order plus a single start time. Order is then the authored decision and every row's computed time is its visible consequence. Any clock-anchored rule (curfew, closing time, "X must happen before Y o'clock") becomes order-sensitive cross-row validation that reordering alone can fix or break.
2. **First-match / adjacency domains**: the outcome of a row depends on which rows sit above it (first-match-wins rules, FEAT-006's inbox rules) or next to it (adjacency rules: no two high-intensity blocks back to back). Order is again the whole semantics.

## Inventory (ordinary-user first, per Jeroen's steer)

Day-to-day, ordinary-user domains:

- **Event run-of-show / wedding or party program builder**: items of kinds (speech, dinner course, band set, dance set, break, cake cutting, games), each with a duration, one start-time field; computed clock times per item; venue close and amplified-music curfew as clock-anchored rules; "cake after all dinner courses" as a relative-position rule. Computed-schedule antidote in pure form.
- **Recipe builder**: steps of kinds (prep, cook, combine, rest/chill, serve); kind-position rules (cook needs a prior prep, rest follows cook, serve last); summary computes total vs active time. The charming "frost before bake" dependency needs component tracking between rows, which risks overdesign; without it the rules are kind-position only.
- **Workout plan builder**: blocks of kinds (warm-up, strength set, cardio, cooldown/stretch); adjacency rules (no same muscle group consecutively, no two high-intensity adjacent), boundary rules (warm-up first, cooldown last); summary shows duration and intensity profile.
- **Morning/daily routine planner**: duration rows against a hard "leave by" deadline; thin branch diversity (most rows are just name+duration), so weak on criterion 1.
- **Moving-day loading plan** (heavy first, fragile last, mattress protects the stack): real physical ordering rules, but niche recognizability and thin fields.
- **Pub-quiz / game-night round builder**: rounds of kinds; ordering rules feel arbitrary (quizmaster taste), weak hard validation.
- **Photo slideshow / ceremony program**: soft ordering rules only.
- **Weekly meal planner**: slots are fixed weekdays, i.e. chronology again, the FEAT-007 flaw. Rejected on arrival.

Semi-ordinary (professional but widely understood):

- **Email drip-campaign builder**: steps (send email, wait N days, add tag); computed "Day N" per step cascades from waits, the computed-schedule antidote; references ("if opened email above") add first-match flavor. Persona is a marketer, so demoted per Jeroen's ordinary-user steer, but kept in ranking for comparison.
- **Approval/signing order** (DocuSign-style routing): recognizable, but branch fields are thin and consequences are mostly "who gets it first".

Developer-tool domains (demoted per Jeroen's steer, kept for honesty of ranking):

- **FEAT-006 inbox rules builder**: the technical benchmark, already specced through chain 1. First-match-wins, shadowing detection, live test-inbox routing.
- **CI/CD pipeline builder**: strongest developer-recognition (GitHub Actions), hard order rules (deploy needs prior passing test, checkout first), live summary could render generated YAML. Demoted on persona only.
- **API middleware chain**: famous ordering bugs (CORS before routes, error handler last), thin per-branch fields.
- **Feature-flag targeting rules / firewall rules**: first-match-wins purity, demoted on persona.
- **Survey builder with skip logic**: meta-risk (form library building a form builder) plus cross-row references by id add complexity; parked.

## Dead ends

- Garden planting sequence, school timetable, packing lists, furniture assembly: order is either dictated by season/dates (derivable), a grid rather than a list, or prescribed by instructions rather than authored by the user.
