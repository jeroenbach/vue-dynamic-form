---
"@bach.software/vue-dynamic-form": minor
---

Template authors who need to derive per-section state (for example marking a wizard step red when any of its fields has a validation error) no longer have to hand-roll path-prefix matching: the new `isPathInSection(path, sectionPath)` export tells whether a field path falls at or under a section path. It is the same matching `validateSection` uses internally, so it matches the section itself, `section.child`, and `section[0]`, but not unrelated paths that merely share a prefix string (like `addressLine` vs `address`).
