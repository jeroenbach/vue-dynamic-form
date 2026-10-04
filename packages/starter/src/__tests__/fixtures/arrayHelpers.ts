import type { VueWrapper } from '@vue/test-utils';

type Wrapper = VueWrapper<any>;

/** The array/group field's own chrome root, keyed by its `fieldMetadata.path`. */
export function section(wrapper: Wrapper, path: string) {
  return wrapper.find(`[data-testid="${path}"]`);
}

export function addButton(wrapper: Wrapper, path: string) {
  return wrapper.find(`[data-testid="${path}-add-button"]`);
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function removeButtons(wrapper: Wrapper, path: string) {
  const pattern = new RegExp(`^${escapeForRegExp(path)}\\[\\d+\\]-remove-button$`);
  return wrapper.findAll('[data-testid]').filter(element => pattern.test(element.attributes('data-testid') ?? ''));
}

/** Each item's own chrome root (e.g. a `RepeaterCard`), keyed by its indexed path like `contacts[0]`. */
export function itemCards(wrapper: Wrapper, path: string) {
  const pattern = new RegExp(`^${escapeForRegExp(path)}\\[\\d+\\]$`);
  return wrapper.findAll('[data-testid]').filter(element => pattern.test(element.attributes('data-testid') ?? ''));
}

export function inputValues(wrapper: Wrapper) {
  return wrapper.findAll('input').map(input => (input.element as HTMLInputElement).value);
}

export function isDisabled(button: { attributes: (name: string) => string | undefined }) {
  return button.attributes('disabled') !== undefined;
}
