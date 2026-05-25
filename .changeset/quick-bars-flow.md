---
"@bach.software/vue-dynamic-form": minor
---

Extendable settings, now available in template slots

- **`settings` in slots** — all template slots (`#default`, `#default-array`, `#default-choice`, `#group`, `#group-array`, etc.) now receive a `settings` prop, giving templates access to the active form settings without prop-drilling or `inject`.
- **Extendable settings** — `defineMetadata()` accepts a new 4th generic `ExtendedSettingsProperties`, which is merged into the `DynamicFormSettings` type. This lets you add your own settings keys (e.g. `showOptionalInsteadOfRequired`) and have them fully typed end-to-end.
- **`GetDynamicFormSettingsType` helper** — derives the correctly-typed `DynamicFormSettings` alias from a metadata configuration, analogous to `GetMetadataType`.

**Breaking changes:**

- The `#attributes` slot is now always rendered (visibility is controlled inside the slot). If your template relied on the slot being absent when the field had no attributes, move that guard inside your slot content.
- `DynamicFormItemProps` no longer exposes `input`, `children`, `choice`, and `array` slot stubs — only `default` and `attributes` remain.
- `ValidationRule` and related validation helpers are no longer re-exported from the package root.
