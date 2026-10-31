---
"@bach.software/vue-dynamic-form": minor
---

Pass any template straight to `DynamicForm`'s `template` prop, no cast needed. Generic template components (an SFC using `generic="..."`, such as a ready-made template shipped by a template package) previously failed `vue-tsc`'s check on the prop, forcing every consumer to write `as unknown as DefineComponent<object, object, any>`. The prop is now typed with the new exported `DynamicFormTemplateComponent`, which accepts regular and generic components alike, so `<DynamicForm :template="MyTemplate" />` just works.
