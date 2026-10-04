import type { VueWrapper } from '@vue/test-utils';

export function renderCount(wrapper: VueWrapper, path: string): number {
  return Number(wrapper.find(`[data-testid="${path}-analytics-render-count"]`).text());
}
