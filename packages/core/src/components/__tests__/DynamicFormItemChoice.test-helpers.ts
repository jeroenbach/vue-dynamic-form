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
 * Reads the ephemeral preserve-on-switch stash for the choice at `path`. Returns
 * undefined if the choice is not found. Best-effort internal-state reader: it names the stash
 * ref directly for tests that want a stronger assertion than the observable restore
 * behaviour alone.
 */
export function stashedBranchValues(wrapper: ReturnType<typeof mount>, path: string): Record<string, unknown> | undefined {
  return setupState(wrapper, path)?.stashedBranchValues;
}

/**
 * Patches fixture metadata to enable preserve-on-switch on the choice at `branchKey`
 * (the choice's own `name`, e.g. `'pick'`). Centralises the flag surface (the `FieldMetadata`
 * boolean `preserveOnSwitch`) so tests do not hardcode a property name directly.
 */
export function enablePreserveOnSwitch<T>(metadata: T[], choicePath: string, enabled: boolean = true): T[] {
  const segments = choicePath.split('.');

  function visit(nodes: any[] | undefined, remaining: string[]): void {
    if (!nodes)
      return;

    const [head, ...rest] = remaining;
    const node = nodes.find(n => n.name === head);
    if (!node)
      return;

    if (rest.length === 0) {
      node.preserveOnSwitch = enabled;
      return;
    }

    visit(node.children, rest);
  }

  visit(metadata as any[], segments);
  return metadata;
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

/**
 * Reads the `-kind-badge` testid text at `occurrencePath` (e.g. `pick.apiEndpoint[0]`), asserting
 * the `*-choice-array-item`/`default-choice-array-item` slot actually received `branchKey` as a real slot
 * prop, rather than the test inferring it from the path itself.
 */
export function occurrenceBranchKey(wrapper: ReturnType<typeof mount>, occurrencePath: string): string | undefined {
  const badge = wrapper.find(`[data-testid="${occurrencePath}-kind-badge"]`);
  return badge.exists() ? badge.text() : undefined;
}

/**
 * Reads the fixture's per-branch add-choice button `disabled` attribute for `branchKey` at the
 * choice rendered at `choicePath`, exercising `canAddChoiceOccurrence` through the real public
 * slot-prop contract (the same indirection used elsewhere in this suite), not a `setupState()` reach-in.
 */
export function canAddChoiceOccurrence(wrapper: ReturnType<typeof mount>, choicePath: string, branchKey: string): boolean {
  const button = wrapper.find(`[data-testid="${choicePath}.${branchKey}-add-choice-button"]`);
  return button.exists() && button.attributes('disabled') === undefined;
}

/**
 * Reads the `usedChoiceOccurrences` slot prop for the choice rendered at `choicePath`, through
 * the fixture's real public slot-prop contract (the same indirection `canAddChoiceOccurrence`
 * above uses), not a `setupState()` reach-in.
 */
export function usedChoiceOccurrences(wrapper: ReturnType<typeof mount>, choicePath: string): number | undefined {
  const span = wrapper.find(`[data-testid="${choicePath}-used-choice-occurrences"]`);
  return span.exists() ? Number(span.text()) : undefined;
}
