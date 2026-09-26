---
"@bach.software/vue-dynamic-form": minor
---

Let a template control how the occurrences of a repeatable explicit choice ("add several, each one of several kinds") are numbered and ordered on screen, so the user sees one continuous list in the order they built it, rather than items that restart their numbering per kind and always sit grouped by kind.

Everything here is opt-in and layers on top of FEAT-001's `explicitChoiceSelection`: the default numbering, order, and storage of a repeatable choice are unchanged, so existing consumers are unaffected. What you can now build:

- **Continuous "item N of M" numbering across kinds**: the new `globalIndex` slot prop on `*-choice-array-item` / `default-choice-array-item` reports each occurrence's position across every branch (not just within its own kind), renumbering live on add and remove, so a badge can read 1, 2, 3, 4 regardless of which kinds were added.
- **Show occurrences in the order they were added, this session** (opt-in `displayOrder: 'added'`): render occurrences interleaved by add-press order instead of grouped by kind. Backed by an ephemeral `insertionOrder` slot prop that lives only in memory, never in form values, and falls back to grouped order after a reload. Flipping the flag re-sorts in place without a remount.
- **Persist that add-order into the saved data** (opt-in `preserveOrder`): write a 1-based `order` field into each occurrence's own values, kept contiguous 1..N as occurrences are added and removed, and normalized from loaded data at mount. Unlike `insertionOrder`, this survives a reload and saved data, at the cost of appearing in `values`. Requires every branch to have `children` (an object to hold the field); a scalar-leaf branch disables it for the whole choice with a development warning.

Neither ordering flag changes `xsd_choiceMinOccurs` or occurrence-budget outcomes, and the storage model stays per-branch. Additive throughout: a choice that opts into none of these renders exactly as before.
