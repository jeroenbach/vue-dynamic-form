import type { VueWrapper } from '@vue/test-utils';

type Wrapper = VueWrapper<any>;

export function section(wrapper: Wrapper, path: string) {
  return wrapper.find(`[data-testid="${path}-array-section"]`);
}

export function addButton(wrapper: Wrapper, path: string) {
  return wrapper.find(`[data-testid="${path}-add-button"]`);
}

export function removeButtons(wrapper: Wrapper, path: string) {
  return wrapper.findAll(`[data-testid^="${path}-remove-button-"]`);
}

export function itemCards(wrapper: Wrapper, path: string) {
  return wrapper.findAll(`[data-testid^="${path}-array-item-"]`);
}

export function inputValues(wrapper: Wrapper) {
  return wrapper.findAll('input').map(input => (input.element as HTMLInputElement).value);
}

export function isDisabled(button: { attributes: (name: string) => string | undefined }) {
  return button.attributes('disabled') !== undefined;
}

export const tagsMetadata = { name: 'tags', type: 'text', label: 'Tags', maxOccurs: 3 };
