import type { VueWrapper } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';

type Wrapper = VueWrapper<any>;

/** The choice's own chrome root (ChoiceField's section, or ChoiceSectionCard/ChoiceArraySectionCard via SectionCard), keyed by its `fieldMetadata.path`. */
export function section(wrapper: Wrapper, path: string) {
  return wrapper.find(`[data-testid="${path}"]`);
}

export function choiceCards(wrapper: Wrapper, path: string) {
  return wrapper.findAll(`[data-testid^="${path}-"].sft-choice-card`);
}

export function choiceCard(wrapper: Wrapper, path: string, branch: string) {
  return wrapper.find(`[data-testid="${path}-${branch}"]`);
}

export function addButton(wrapper: Wrapper, path: string, branch: string) {
  return wrapper.find(`[data-testid="${path}-add-${branch}"]`);
}

export function addReason(wrapper: Wrapper, path: string, branch: string) {
  return wrapper.find(`#${path}-add-${branch}-reason`);
}

export function isDisabled(element: { attributes: (name: string) => string | undefined }) {
  return element.attributes('disabled') !== undefined;
}

export async function click(wrapper: { trigger: (event: string) => Promise<unknown> }) {
  await wrapper.trigger('click');
  await flushPromises();
}
