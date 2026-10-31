import type { mount } from '@vue/test-utils';

/**
 * Accesses the internal `<script setup>` state of the DynamicFormItemArray registered at `path`.
 * Mirrors `DynamicFormItem.test-helpers.ts`'s `setupState`, reaching into `vm.$.setupState` for
 * private state not exposed via `defineExpose`.
 */
export function setupState(wrapper: ReturnType<typeof mount>, path: string): Record<string, any> | undefined {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItemArray' })
    .find(c => (c.vm as any).$.setupState.path === path);
  return (item?.vm as any)?.$.setupState;
}

/** Reads how many times the array's `combinedValidation` computed has run. Returns -1 if the array is not found. */
export function arrayConstructValidationCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return setupState(wrapper, path)?._analytics_constructValidationCount ?? -1;
}

/** Reads the array's own `meta.valid`, kept live by the silent validate in the values watcher. Returns undefined if the array is not found. */
export function arrayMetaValid(wrapper: ReturnType<typeof mount>, path: string): boolean | undefined {
  return setupState(wrapper, path)?.arrayField?.meta?.valid;
}
