---
"@bach.software/vue-dynamic-form-starter": minor
---

Shape and type are now rethemeable the same way colour already is. The starter template's stylesheet exposes 15 new document-root CSS custom properties covering every `border-radius`, `font-size`, `font-weight`, and monospace `font-family` value it uses, including the textarea, radio, and file upload fields: a t-shirt-size radius scale (`--sft-radius-xs/sm/md/lg/xl/pill`), a font-size scale (`--sft-font-size-xs/sm/md/lg/xl/2xl`), two font-weight rungs (`--sft-font-weight-medium/semibold`), and a monospace stack (`--sft-font-mono`). Set one of these on `:root` to retheme sharper or softer corners and a different brand font across the whole template, with no selector-by-selector cascade fight.

Every default value reproduces today's rendered output exactly, so this ships with zero visual change until a consumer actually overrides a variable.
