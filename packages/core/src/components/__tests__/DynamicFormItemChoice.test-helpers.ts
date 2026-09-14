import type { mount } from '@vue/test-utils';

/**
 * Accesses the internal `<script setup>` state of the DynamicFormItemChoice registered at `path`
 * (matched via its `normalizedPath` setup variable). Mirrors `DynamicFormItem.test-helpers.ts`'s
 * `setupState`, reaching into `vm.$.setupState` for private state not exposed via `defineExpose`.
 */
export function setupState(wrapper: ReturnType<typeof mount>, path: string): Record<string, any> | undefined {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItemChoice' })
    .find(c => (c.vm as any).$.setupState.normalizedPath === path);
  return (item?.vm as any)?.$.setupState;
}

/** Finds the DynamicFormItemChoice instance registered at `path` (its `normalizedPath`). */
export function findDynamicFormItemChoiceByPath(wrapper: ReturnType<typeof mount>, path: string) {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItemChoice' })
    .find(component => (component.vm as any).$.setupState.normalizedPath === path);

  return item;
}

/** Reads `activeChoiceOccurrences` for the choice at `path`. Returns undefined if the choice is not found. */
export function activeChoiceOccurrences(wrapper: ReturnType<typeof mount>, path: string): { branchKey: string, index: number }[] | undefined {
  return setupState(wrapper, path)?.activeChoiceOccurrences;
}

/** Reads `explicitlySelectedBranch` for the choice at `path`. Returns undefined if the choice is not found. */
export function explicitlySelectedBranch(wrapper: ReturnType<typeof mount>, path: string): string | null | undefined {
  return setupState(wrapper, path)?.explicitlySelectedBranch;
}

/**
 * Reads the `childValues` entry for `branchKey` at the choice registered at `path`, resolving the
 * branch name to its internal numeric index via the choice's own metadata.
 */
export function childValuesEntry(wrapper: ReturnType<typeof mount>, path: string, branchKey: string): { occurrences: number, valuesCount: number } | undefined {
  const state = setupState(wrapper, path);
  if (!state)
    return undefined;

  const index = state.field?.choice?.findIndex((child: any) => child.name === branchKey);
  if (index === undefined || index < 0)
    return undefined;

  const entry = state.childValues?.[index];
  if (!entry)
    return undefined;

  return { occurrences: entry.occurrences, valuesCount: entry.valuesCount };
}
