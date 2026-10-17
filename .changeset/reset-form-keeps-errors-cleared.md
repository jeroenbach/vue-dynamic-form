---
"@bach.software/vue-dynamic-form": minor
---

Programmatic value changes that ask to skip validation now actually skip it, so updating a form from code no longer surprises the person filling it in with premature error messages:

- Resetting a form now actually leaves it clean: previously, calling `resetForm()` after filling in a required field (or any field whose rule fails on the reset value) made the just-cleared validation errors reappear immediately, so a reset looked broken. The form's value watchers now honour vee-validate's pending-reset window, matching its built-in behaviour: a reset leaves the form pristine, errors passed explicitly via `resetForm({ errors })` are kept, and value changes after the reset validate exactly as before.
- `setFieldValue(path, value, false)` and `setValues(values, false)` now respect the explicit `shouldValidate: false` argument: previously the value watchers validated the written value anyway, showing errors the caller deliberately asked to defer. Writes with the default `shouldValidate: true`, and any user input afterwards, validate exactly as before.
