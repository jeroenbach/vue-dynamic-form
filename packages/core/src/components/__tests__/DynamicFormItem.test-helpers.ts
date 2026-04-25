import type { mount } from '@vue/test-utils';

/** Reads the render count for a field from the analytics DOM span. */
export function renderCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return Number(wrapper.find(`[data-testid="${path}-analytics-render-count"]`).text());
}

/**
 * Accesses the internal `<script setup>` state of the DynamicFormItem for a given field path.
 * Uses `vm.$.setupState` — an internal Vue API that exposes all setup variables, including
 * private `let` declarations that are not exposed via `defineExpose`.
 */
export function setupState(wrapper: ReturnType<typeof mount>, path: string): Record<string, any> | undefined {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItem' })
    .find(c => (c.vm as any).$.setupState.path === path);
  return (item?.vm as any)?.$.setupState;
}

/** Reads the number of times `combinedValidation` was recomputed for a given field. Returns -1 if the field is not found. */
export function constructValidationCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_constructValidationCount ?? -1;
}

/** Reads the number of times `computedField` was recomputed for a given field. Returns -1 if the field is not found. */
export function fieldComputeCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_fieldComputeCount ?? -1;
}

/** Reads the number of times the `field` computed (bound to `props.fieldMetadata`) was recomputed. Returns -1 if the field is not found. */
export function fieldChangedCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_fieldChangedCount ?? -1;
}

/** Reads the number of times the value watcher fired for a given field. Returns -1 if the field is not found. */
export function valueChangedCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_valueChangedCount ?? -1;
}

/** Reads the number of times the notify value change fired for a given field. Returns -1 if the field is not found. */
export function notifyValueUpdateCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_notifyValueUpdateCount ?? -1;
}

/** Returns the current vee-validate form values from the TestForm wrapper. */
export function formValues(wrapper: ReturnType<typeof mount>): Record<string, any> {
  return (wrapper.vm as any).$.setupState.values;
}
