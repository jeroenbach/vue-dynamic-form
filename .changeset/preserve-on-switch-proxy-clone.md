---
"@bach.software/vue-dynamic-form": patch
---

Fix `preserveOnSwitch` aborting the branch switch for choice branches with children: stashing the deselected branch used `structuredClone` on the branch value, which is a Vue reactive Proxy for object-valued branches and made the clone throw a `DataCloneError`, so a filled branch could never be deselected again. The stash now uses a Proxy-safe deep clone.
