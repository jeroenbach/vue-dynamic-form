---
"@bach.software/vue-dynamic-form": patch
---

A "start over" reset now behaves predictably around `presenceValue` choice branches, and two smaller rough edges around the marker are polished away:

- `resetForm()` now clears a presence marker the user selected this session and deselects the branch, returning the form to how it was loaded. Previously the marker could survive a reset (it was silently staged as the field's reset baseline), leaving the branch selected on a form the user expected to be blank. A marker that was part of the loaded values still restores and keeps its branch selected, like any other loaded data.
- `presenceValue` is now fully inert on a choice without `explicitChoiceSelection`, as documented: a loaded empty-object value on a presence-marked branch no longer reads back as a selected occurrence in auto mode.
- The docs now call out that `null` and the empty string do not work as markers (they read as selected but fail the branch's own required check), and arrays no longer run a redundant second validation pass per value change when `validateOnValueUpdate` is on.
