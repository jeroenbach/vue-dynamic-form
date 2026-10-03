import type { VueWrapper } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';

type Wrapper = VueWrapper<any>;

const textBranches = [
  { name: 'a', type: 'text', label: 'Alpha' },
  { name: 'b', type: 'text', label: 'Beta' },
  { name: 'c', type: 'text' },
];

export const explicitSingle = {
  name: 'pick',
  label: 'Pick one',
  explicitChoiceSelection: true,
  choice: textBranches,
};

export const explicitRepeatable = {
  name: 'pick',
  label: 'Pick several',
  explicitChoiceSelection: true,
  maxOccurs: 3,
  choice: textBranches,
};

export const explicitRepeatableBatched = {
  name: 'pick',
  label: 'Pick several',
  explicitChoiceSelection: true,
  maxOccurs: 2,
  choice: [
    { name: 'a', type: 'text', label: 'Alpha', maxOccurs: 2 },
    { name: 'b', type: 'text', label: 'Beta' },
  ],
};

export const autoSingle = {
  name: 'pick',
  label: 'Pick one',
  choice: textBranches,
};

export const autoRepeatable = {
  name: 'pick',
  label: 'Pick several',
  maxOccurs: 3,
  choice: textBranches,
};

export const singleBranchExplicit = {
  name: 'pick',
  label: 'Pick one',
  explicitChoiceSelection: true,
  choice: [{ name: 'a', type: 'text', label: 'Alpha' }],
};

const groupBranchChildren = [
  { name: 'first', type: 'text', label: 'First' },
  { name: 'last', type: 'text', label: 'Last' },
];

export const groupBranch = {
  name: 'pick',
  label: 'Pick one',
  explicitChoiceSelection: true,
  choice: [
    { name: 'person', label: 'Person', children: groupBranchChildren },
    { name: 'note', type: 'text', label: 'Note' },
  ],
};

export const groupBranchRepeatable = { ...groupBranch, maxOccurs: 3 };

export const arrayBranch = {
  name: 'pick',
  label: 'Pick one',
  explicitChoiceSelection: true,
  choice: [
    { name: 'tags', type: 'text', label: 'Tags', maxOccurs: 2 },
    { name: 'note', type: 'text', label: 'Note' },
  ],
};

export const disabledChoice = { ...explicitSingle, maxOccurs: 0 };

export const requiredExplicit = { ...explicitSingle, minOccurs: 1 };

export const requiredRepeatable = { ...explicitRepeatable, minOccurs: 1, maxOccurs: 2 };

/** Patches `displayOrder` onto a fixture so occurrences render in the order they were added. */
export function withAddedOrder<T extends object>(metadata: T): T & { displayOrder: 'added' } {
  return { ...metadata, displayOrder: 'added' };
}

export function sectionOf(wrapper: Wrapper, path: string) {
  return wrapper.find(`[data-testid="${path}-choice-section"]`);
}

export function addButton(wrapper: Wrapper, choicePath: string, branch: string) {
  return wrapper.find(`[data-testid="${choicePath}.${branch}-add-choice-button"]`);
}

export function addButtons(wrapper: Wrapper, choicePath: string) {
  return wrapper.findAll(`[data-testid^="${choicePath}."][data-testid$="-add-choice-button"]`);
}

export function removeButton(wrapper: Wrapper, choicePath: string, branch: string) {
  return wrapper.find(`[data-testid="${choicePath}.${branch}-remove-choice-button"]`);
}

export function removeButtons(wrapper: Wrapper, choicePath: string) {
  return wrapper.findAll(`[data-testid^="${choicePath}."][data-testid$="-remove-choice-button"]`);
}

export function isBranchAddEnabled(wrapper: Wrapper, choicePath: string, branch: string) {
  const button = addButton(wrapper, choicePath, branch);
  return button.exists() && button.attributes('disabled') === undefined;
}

/** Reads the used and maximum numbers from the counter text. */
export function counterNumbers(wrapper: Wrapper, choicePath: string) {
  const text = wrapper.find(`[data-testid="${choicePath}-choice-counter"]`).text();
  const [used, max] = (text.match(/\d+/g) ?? []).map(Number);
  return { used, max };
}

export function occurrenceCards(wrapper: Wrapper, choicePath: string) {
  return wrapper.findAll(`[data-testid^="${choicePath}"][data-testid$="-choice-occurrence"]`);
}

export function kindBadge(wrapper: Wrapper, occurrencePath: string) {
  return wrapper.find(`[data-testid="${occurrencePath}-kind-badge"]`);
}

export function occurrenceNumber(wrapper: Wrapper, occurrencePath: string) {
  const element = wrapper.find(`[data-testid="${occurrencePath}-global-index"]`);
  return element.exists() ? Number(element.text()) : undefined;
}

export function insertionOrderIndicator(wrapper: Wrapper, occurrencePath: string) {
  return wrapper.find(`[data-testid="${occurrencePath}-insertion-order"]`);
}

export function errorMessage(wrapper: Wrapper, choicePath: string) {
  return wrapper.find(`[data-testid="${choicePath}-error-message"]`);
}

export function inputValues(wrapper: Wrapper) {
  return wrapper.findAll('input').map(input => (input.element as HTMLInputElement).value);
}

export async function click(wrapper: { trigger: (event: string) => Promise<unknown> }) {
  await wrapper.trigger('click');
  await flushPromises();
}

/** The testid paths of every rendered occurrence card, in DOM order. */
export function occurrencePaths(wrapper: Wrapper, choicePath: string) {
  return occurrenceCards(wrapper, choicePath).map(card => card.attributes('data-testid')!.replace(/-choice-occurrence$/, ''));
}
