---
"@bach.software/vue-dynamic-form": patch
---

The presenceValue demo no longer undermines its own point: selecting the Express branch in the example TestFormTemplate used to render a bare text input exposing the raw presence marker (true), even though the branch is meant to have nothing to fill in. A childless heading now renders only its label and description, so the selected branch reads as a confirmation instead of an editable field.
