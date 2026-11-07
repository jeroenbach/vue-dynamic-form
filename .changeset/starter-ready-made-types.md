---
"@bach.software/vue-dynamic-form-starter": minor
---

Typing a form against the built-in starter catalogue no longer requires the awkward `GetMetadataType<typeof starterMetadata>` dance with a type-only import of a runtime value. The new `StarterMetadata` and `StarterDynamicFormSettings` types are ready to use directly: `const metadata: StarterMetadata[] = [...]`. The `GetMetadataType` pattern is still the way to type an `extendMetadata` result.
