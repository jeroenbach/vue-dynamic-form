---
"@bach.software/vue-dynamic-form": minor
---

Added a static `preserveOrder` metadata flag that persists a repeatable explicit choice's add-order into the submitted values themselves.

`preserveOrder?: boolean` on `FieldMetadata` (default off, static, excluded from `computedProps`) is meaningful on a `maxOccurs > 1` explicit choice branch whose occurrences are objects (declare `children`). When true, `addChoiceOccurrence` writes a numeric `order` field into the new occurrence's own values (1-based, counted across every branch of the choice), and removing an occurrence compacts the survivors' `order` values back to a contiguous 1..N sequence. Occurrences already present when the form mounts (loaded or previously saved data) that lack `order` are backfilled once, from their current grouped position, before any add-press can occur.

Unlike the ephemeral `insertionOrder` (from the `displayOrder` flag), `order` is real submitted data: it survives a page reload and loaded saved data, at the price of appearing in `values` next to the occurrence's own declared fields. `removeNullValues` keeps it, since it is never null or undefined, and it changes no `xsd_choiceMinOccurs` or occurrence-budget outcome. When `displayOrder` is `'added'`, the render sort key becomes `order` instead of the ephemeral `insertionOrder`.

A branch whose occurrences are scalars (no `children`) has nowhere to attach `order`: enabling `preserveOrder` on such a branch is a no-op for that branch and logs a `console.warn` in development, rather than silently corrupting the value.

Additive and opt-in: existing choices are unaffected.
