---
"@bach.software/vue-dynamic-form": patch
---

Fixed a bug where a form containing a choice-hosting field (a choice branch that itself declares a nested choice, or a plain choice field with no other field in the form) could get stuck invalid for no visible reason. Two symptoms are fixed:

- Filling in a branch that has its own nested choice, switching away from it to a different branch, then submitting could be silently refused even though every rendered field was valid and no error was shown anywhere.
- Selecting a childless, `presenceValue`-marked branch in a form with nothing else in it could leave the form's aggregate `meta.valid` stuck `false` forever, even though the selection was complete.

The cause was an internal double vee-validate registration at the same field path for any choice-hosting field (its own and the nested choice's), which only let the second registration unregister cleanly; the first became a permanent, un-revalidated ghost that could drag the whole form invalid. A choice-hosting field's own `restriction`/`validation` rules (if it declares any directly on itself, independent of the nested choice) keep running exactly as before.
