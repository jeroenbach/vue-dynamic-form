---
"@bach.software/vue-dynamic-form-starter": minor
---

A choice branch's picker card can now pitch itself in different words than the fuller explanation shown once it's selected. Set `choicePicker: { description }` on a branch to show that text on its explicit-choice picker card instead of `description`; `description` keeps describing the branch inside its own body, and `choicePicker.description` falls back to `description` when left unset.
