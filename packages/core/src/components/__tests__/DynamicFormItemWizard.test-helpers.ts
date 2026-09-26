import type { mount } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';

/**
 * Accesses the internal `<script setup>` state of the DynamicFormItemWizard registered at `path`
 * (matched via its `normalizedPath` setup variable). Mirrors `DynamicFormItemChoice.test-helpers.ts`'s
 * `setupState`.
 */
export function setupState(wrapper: ReturnType<typeof mount>, path: string): Record<string, any> | undefined {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItemWizard' })
    .find(c => (c.vm as any).$.setupState.normalizedPath === path);
  return (item?.vm as any)?.$.setupState;
}

/** Finds the DynamicFormItemWizard instance registered at `path` (its `normalizedPath`). */
export function findDynamicFormItemWizardByPath(wrapper: ReturnType<typeof mount>, path: string) {
  return wrapper.findAllComponents({ name: 'DynamicFormItemWizard' })
    .find(component => (component.vm as any).$.setupState.normalizedPath === path);
}

function testid(path: string, suffix: string): string {
  return `[data-testid="${path}-${suffix}"]`;
}

export function currentStepIndex(wrapper: ReturnType<typeof mount>, path: string): number {
  return Number(wrapper.find(testid(path, 'currentStepIndex')).text());
}

export function pageCount(wrapper: ReturnType<typeof mount>, path: string): number {
  return Number(wrapper.find(testid(path, 'pageCount')).text());
}

export function isFirst(wrapper: ReturnType<typeof mount>, path: string): boolean {
  return wrapper.find(testid(path, 'isFirst')).text() === 'true';
}

export function isLast(wrapper: ReturnType<typeof mount>, path: string): boolean {
  return wrapper.find(testid(path, 'isLast')).text() === 'true';
}

export function isValidating(wrapper: ReturnType<typeof mount>, path: string): boolean {
  return wrapper.find(testid(path, 'isValidating')).text() === 'true';
}

export async function clickNext(wrapper: ReturnType<typeof mount>, path: string): Promise<void> {
  await wrapper.find(testid(path, 'next-button')).trigger('click');
  await flushPromises();
}

export async function clickPrev(wrapper: ReturnType<typeof mount>, path: string): Promise<void> {
  await wrapper.find(testid(path, 'prev-button')).trigger('click');
  await flushPromises();
}

export async function clickGotoStep(wrapper: ReturnType<typeof mount>, path: string, index: number): Promise<void> {
  await wrapper.find(testid(path, `goto-${index}-button`)).trigger('click');
  await flushPromises();
}

/** Reads the `v-show`-driven visibility of the page rendered at `pagePath`, through the fixture's `-page` wrapper. */
export function isPageVisible(wrapper: ReturnType<typeof mount>, pagePath: string): boolean {
  const page = wrapper.find(testid(pagePath, 'page'));
  if (!page.exists())
    return false;
  return page.attributes('style')?.includes('display: none') !== true;
}
