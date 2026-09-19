---
"@bach.software/vue-dynamic-form": minor
---

Added an ephemeral `insertionOrder` and a static `displayOrder` metadata flag for a repeatable explicit choice (`maxOccurs > 1`).

`displayOrder?: 'grouped' | 'added'` on `FieldMetadata` (default `'grouped'`, static, excluded from `computedProps`) selects how occurrences render: `'grouped'` is byte-identical to today's behaviour, `'added'` renders occurrences in the order they were added this session (across every branch), with any occurrence that already existed when the form mounted keeping its grouped position ahead of the session-added ones. `globalIndex` (the `*-choice-array-item` / `default-choice-array-item` slot prop) reflects this displayed sequence, renumbering live on add or remove.

`insertionOrder?: number` on `ChoiceArrayItemAttributes` reports the occurrence's own add-order position (1-based, in add-press order), `undefined` for an occurrence never added this session. It lives only in an instance-local counter, never in form values, and is lost on reload (falling back to grouped order).

Additive and opt-in: existing choices are unaffected.
