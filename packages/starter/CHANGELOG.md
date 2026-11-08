# @bach.software/vue-dynamic-form-starter

## 0.3.0

### Minor Changes

- b91ac9d: Shape and type are now rethemeable the same way colour already is. The starter template's stylesheet exposes 15 new document-root CSS custom properties covering every `border-radius`, `font-size`, `font-weight`, and monospace `font-family` value it uses, including the textarea, radio, and file upload fields: a t-shirt-size radius scale (`--sft-radius-xs/sm/md/lg/xl/pill`), a font-size scale (`--sft-font-size-xs/sm/md/lg/xl/2xl`), two font-weight rungs (`--sft-font-weight-medium/semibold`), and a monospace stack (`--sft-font-mono`). Set one of these on `:root` to retheme sharper or softer corners and a different brand font across the whole template, with no selector-by-selector cascade fight.

  Every default value reproduces today's rendered output exactly, so this ships with zero visual change until a consumer actually overrides a variable.

## 0.2.0

### Minor Changes

- 9351d55: Forms built with the starter template are now usable by keyboard-only and screen-reader users out of the box, so a consumer who drops in the template no longer unknowingly ships an inaccessible form to their own end users.

  - Every field type gets a correct `aria-describedby` chain (description and error) and `aria-invalid` reflecting its real validation state: text in all its HTML5 modes, textarea, select, radio group, file upload, checkbox, toggle switch, and password. `ErrorMessage` now announces its text via `role="alert"`, and the password strength label announces changes without spamming every keystroke.
  - Grouped controls are named correctly: the radio group is exposed as a `radiogroup` named by the field label (each radio keeps exactly one label, its own option text), and the file upload's hidden native input is named by the field label rather than its visible "Choose file" trigger text.
  - Full keyboard operability: choice cards implement the standard radio-group arrow-key pattern (one Tab stop per group, arrow keys move selection, disabled cards are skipped), the password reveal toggle is a normal tab stop, the file upload's clear button hands focus back to the file input instead of dropping it, and a removed array item hands focus to a sensible neighbor instead of dropping it to the page body.
  - Focus moves automatically to the new wizard step on navigation and to the first invalid field after a failed validation or submit, including radio and file fields.
  - Visible, sufficiently contrasted focus indicators in both light and dark mode, including two new `--sft-focus-visible`/`--sft-focus-visible-choice` theming tokens for consumers who re-theme the package.

- 3911a6e: The starter now ships textarea, radio, file upload, and the common HTML5 input modes out of the box, so a contact form, registration flow, checkout, or survey no longer needs a hand-built `extendMetadata` wrapper for these everyday field types.

  - `textarea`: multi-line text input, auto-height with a vertical resize handle.
  - `radio`: radio button group driven by the same `options` property `select` already reads.
  - `number`, `email`, `tel`, `url`, `date`, `time`, `datetime-local`: native HTML5 input modes for the right mobile keyboard and browser affordance, with `number.min`/`number.max`/`number.step` forwarding native spinner/stepping hints.
  - `file`: single-file upload with a styled trigger, filename display, and a clear button; `file.accept`/`file.clearAriaLabel` configure the native filter and the clear button's accessible name.

- 3911a6e: A choice branch's picker card can now pitch itself in different words than the fuller explanation shown once it's selected. Set `choicePicker: { description }` on a branch to show that text on its explicit-choice picker card instead of `description`; `description` keeps describing the branch inside its own body, and `choicePicker.description` falls back to `description` when left unset.
- 3911a6e: Typing a form against the built-in starter catalogue no longer requires the awkward `GetMetadataType<typeof starterMetadata>` dance with a type-only import of a runtime value. The new `StarterMetadata` and `StarterDynamicFormSettings` types are ready to use directly: `const metadata: StarterMetadata[] = [...]`. The `GetMetadataType` pattern is still the way to type an `extendMetadata` result.

## 0.1.0

### Minor Changes

- 00e6ba6: Initial release of the starter form template package. It gives you a complete, good-looking form out of the box: hand `StarterFormTemplate` to `DynamicForm` and every field, group, array, choice, wizard, and review step in your metadata renders with a finished look, with no CSS framework to install and no template to write yourself. Every slot stays overridable, so you can start with the full default rendering and replace exactly the parts your project needs.

  - Lay fields out side by side instead of one per row, with control over how that layout adapts across phone, tablet, and desktop widths: a new `grid` field type for a bare container, and `columns`, `colSpan`, and `colStart` properties to size and place fields within it.
