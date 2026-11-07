---
"@bach.software/vue-dynamic-form-starter": minor
---

The starter now ships textarea, radio, file upload, and the common HTML5 input modes out of the box, so a contact form, registration flow, checkout, or survey no longer needs a hand-built `extendMetadata` wrapper for these everyday field types.

- `textarea`: multi-line text input, auto-height with a vertical resize handle.
- `radio`: radio button group driven by the same `options` property `select` already reads.
- `number`, `email`, `tel`, `url`, `date`, `time`, `datetime-local`: native HTML5 input modes for the right mobile keyboard and browser affordance, with `number.min`/`number.max`/`number.step` forwarding native spinner/stepping hints.
- `file`: single-file upload with a styled trigger, filename display, and a clear button; `file.accept`/`file.clearAriaLabel` configure the native filter and the clear button's accessible name.
