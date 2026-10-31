import type { Component } from 'vue';

/**
 * Any component usable as the `template` prop of `DynamicForm`.
 *
 * Deliberately wider than Vue's `Component`: an SFC with a `generic="..."` attribute compiles to
 * a generic call signature that neither `Component` nor `DefineComponent` accepts, so the bare
 * call signature lets generic template components be passed without casts. The `object` member
 * keeps the compiler-generated runtime prop check accepting object-based components (the compiler
 * cannot resolve `Component` and would otherwise only allow `Function`). The engine only renders
 * the component; the slot types it needs are widened internally.
 */
export type DynamicFormTemplateComponent = Component | ((...args: any[]) => any) | object;
