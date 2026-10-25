---
"@bach.software/vue-dynamic-form": patch
---

Resetting a form now also resets which branch of an explicit choice is selected, so a reset-and-start-over flow (for example "place another order" after a checkout) can no longer end up with two branches of a `maxOccurs: 1` choice shown as selected at the same time. Previously the explicitly selected branch was kept across `resetForm()`, and when the reset restored initial values into a different branch, both that branch (value-driven) and the stale explicit selection rendered as active. After a reset the selection is now derived purely from the freshly reset values, exactly like a fresh mount: a branch holding restored initial data reads as selected, an empty one deselects. The `preserveOnSwitch` stash is dropped on reset as well, so values the reset discarded can no longer resurface when the shopper switches back to that branch afterwards.
