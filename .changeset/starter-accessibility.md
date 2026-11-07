---
"@bach.software/vue-dynamic-form-starter": minor
---

Forms built with the starter template are now usable by keyboard-only and screen-reader users out of the box, so a consumer who drops in the template no longer unknowingly ships an inaccessible form to their own end users.

- Every field type gets a correct `aria-describedby` chain (description and error) and `aria-invalid` reflecting its real validation state: text in all its HTML5 modes, textarea, select, radio group, file upload, checkbox, toggle switch, and password. `ErrorMessage` now announces its text via `role="alert"`, and the password strength label announces changes without spamming every keystroke.
- Grouped controls are named correctly: the radio group is exposed as a `radiogroup` named by the field label (each radio keeps exactly one label, its own option text), and the file upload's hidden native input is named by the field label rather than its visible "Choose file" trigger text.
- Full keyboard operability: choice cards implement the standard radio-group arrow-key pattern (one Tab stop per group, arrow keys move selection, disabled cards are skipped), the password reveal toggle is a normal tab stop, the file upload's clear button hands focus back to the file input instead of dropping it, and a removed array item hands focus to a sensible neighbor instead of dropping it to the page body.
- Focus moves automatically to the new wizard step on navigation and to the first invalid field after a failed validation or submit, including radio and file fields.
- Visible, sufficiently contrasted focus indicators in both light and dark mode, including two new `--sft-focus-visible`/`--sft-focus-visible-choice` theming tokens for consumers who re-theme the package.
