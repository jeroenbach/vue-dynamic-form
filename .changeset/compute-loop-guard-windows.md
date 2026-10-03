---
"@bach.software/vue-dynamic-form": patch
---

Fix a false "Possible infinite loop detected in computedProps" error that could permanently freeze a field's rendering. Value updates arriving faster than a macrotask (paste, browser autofill, IME composition, automated typing) could starve the guard's timer-based reset, so legitimate once-per-update recomputes were miscounted as a loop and the thrown error killed the field's render effect, leaving stale metadata on screen while the form values kept updating. The guard's limit is now aligned with Vue's own recursive-update limit (100), far above any realistic input burst, while genuinely non-idempotent computedProps writes that recompute without ever letting the event loop turn are still caught.
