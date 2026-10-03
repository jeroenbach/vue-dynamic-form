import { flushPromises } from '@vue/test-utils';
import { ElInput } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { addButton, addButtons, arrayBranch, autoSingle, click, counterNumbers, disabledChoice, explicitRepeatable, explicitRepeatableBatched, explicitSingle, groupBranch, groupBranchRepeatable, inputValues, isBranchAddEnabled, occurrenceCards, occurrenceNumber, occurrencePaths, removeButton, removeButtons, sectionOf, singleBranchExplicit, withAddedOrder } from './choice.test-helpers';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';

describe('component ElementPlusFormTemplate - single choice interaction', () => {
  expectNoWarnings();

  it('enables an add control for every branch that can still be added', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle });

    for (const branch of ['a', 'b', 'c'])
      expect(isBranchAddEnabled(wrapper, 'pick', branch)).toBe(true);
  });

  it('renders the selected branch field and stores its value under the branch', async () => {
    const { wrapper, values } = await mountInForm({ metadata: explicitSingle });

    await click(addButton(wrapper, 'pick', 'b'));

    expect(wrapper.findAll('input')).toHaveLength(1);
    expect(removeButtons(wrapper, 'pick')).toHaveLength(1);
    expect(removeButton(wrapper, 'pick', 'b').exists()).toBe(true);
    await wrapper.find('input').setValue('typed');
    await flushPromises();
    expect(values().pick.b).toBe('typed');
  });

  it('returns to the unselected state when the active branch is removed and lets another branch be selected', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle });
    await click(addButton(wrapper, 'pick', 'b'));
    await wrapper.find('input').setValue('typed');

    await click(removeButton(wrapper, 'pick', 'b'));

    expect(wrapper.findAll('input')).toHaveLength(0);
    expect(removeButtons(wrapper, 'pick')).toHaveLength(0);
    expect(addButtons(wrapper, 'pick')).toHaveLength(3);

    await click(addButton(wrapper, 'pick', 'a'));
    expect(inputValues(wrapper)).toEqual(['']);
    expect(removeButton(wrapper, 'pick', 'a').exists()).toBe(true);
  });

  it('shows only the new branch when switching directly from one branch to another', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle });
    await click(addButton(wrapper, 'pick', 'b'));

    await click(addButton(wrapper, 'pick', 'a'));

    expect(wrapper.findAll('input')).toHaveLength(1);
    expect(removeButtons(wrapper, 'pick').map(button => button.attributes('data-testid'))).toEqual(['pick.a-remove-choice-button']);
  });

  it('activates the branch that holds a loaded value without a click', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitSingle, initialValues: { pick: { b: 'loaded' } } });

    expect(inputValues(wrapper)).toEqual(['loaded']);
    expect(removeButton(wrapper, 'pick', 'b').exists()).toBe(true);
  });

  it('disables every add control for a disabled choice and ignores clicks', async () => {
    const { wrapper } = await mountInForm({ metadata: disabledChoice });

    for (const button of addButtons(wrapper, 'pick'))
      expect(button.attributes('disabled')).toBeDefined();

    await click(addButton(wrapper, 'pick', 'a'));

    expect(wrapper.findAll('input')).toHaveLength(0);
    expect(removeButtons(wrapper, 'pick')).toHaveLength(0);
  });

  it('still shows add then the branch for a choice with a single branch', async () => {
    const { wrapper } = await mountInForm({ metadata: singleBranchExplicit });

    expect(addButtons(wrapper, 'pick')).toHaveLength(1);
    await click(addButton(wrapper, 'pick', 'a'));
    expect(wrapper.findAll('input')).toHaveLength(1);
  });

  it('renders the children of a group branch inside the section', async () => {
    const { wrapper } = await mountInForm({ metadata: groupBranch });

    await click(addButton(wrapper, 'pick', 'person'));

    expect(sectionOf(wrapper, 'pick').findAllComponents(ElInput)).toHaveLength(2);
    expect(wrapper.findAll('.el-form-item__label').map(label => label.text())).toEqual(['Person', 'First', 'Last']);
  });

  it('renders an array branch through the array section and not a choice card', async () => {
    const { wrapper } = await mountInForm({ metadata: arrayBranch });

    await click(addButton(wrapper, 'pick', 'tags'));

    expect(wrapper.find('[data-testid="pick.tags-array-section"]').exists()).toBe(true);
    expect(occurrenceCards(wrapper, 'pick')).toHaveLength(0);
  });
});

describe('component ElementPlusFormTemplate - repeatable choice interaction', () => {
  expectNoWarnings();

  async function mountWithOccurrences(metadata = explicitRepeatable) {
    const mounted = await mountInForm({ metadata });
    await click(addButton(mounted.wrapper, 'pick', 'a'));
    await click(addButton(mounted.wrapper, 'pick', 'b'));
    await click(addButton(mounted.wrapper, 'pick', 'c'));
    return mounted;
  }

  it('disables every add control once the shared budget is used up and re-enables them after a removal', async () => {
    const { wrapper } = await mountWithOccurrences();

    expect(counterNumbers(wrapper, 'pick')).toEqual({ used: 3, max: 3 });
    for (const branch of ['a', 'b', 'c'])
      expect(isBranchAddEnabled(wrapper, 'pick', branch)).toBe(false);

    await click(addButton(wrapper, 'pick', 'a'));
    expect(occurrenceCards(wrapper, 'pick')).toHaveLength(3);

    await click(wrapper.find('[data-testid="pick.b[0]-remove-choice-button"]'));

    expect(counterNumbers(wrapper, 'pick').used).toBe(2);
    for (const branch of ['a', 'b', 'c'])
      expect(isBranchAddEnabled(wrapper, 'pick', branch)).toBe(true);
  });

  it('disables every add control for a disabled choice', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...explicitRepeatable, maxOccurs: 0 } });

    for (const button of addButtons(wrapper, 'pick'))
      expect(button.attributes('disabled')).toBeDefined();
  });

  it('removes exactly the occurrence whose card was used and keeps the others', async () => {
    const { wrapper, values } = await mountWithOccurrences();
    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('first');
    await inputs[1].setValue('second');
    await inputs[2].setValue('third');

    await click(wrapper.find('[data-testid="pick.b[0]-remove-choice-button"]'));

    expect(occurrencePaths(wrapper, 'pick')).toEqual(['pick.a[0]', 'pick.c[0]']);
    expect(inputValues(wrapper)).toEqual(['first', 'third']);
    expect(values().pick.a).toEqual(['first']);
    expect(values().pick.c).toEqual(['third']);
  });

  it('renumbers the remaining occurrences after a removal', async () => {
    const { wrapper } = await mountWithOccurrences();
    expect(wrapper.findAll('[data-testid$="-global-index"]').map(element => element.text())).toEqual(['1', '2', '3']);

    await click(wrapper.find('[data-testid="pick.b[0]-remove-choice-button"]'));

    expect(occurrenceNumber(wrapper, 'pick.a[0]')).toBe(1);
    expect(occurrenceNumber(wrapper, 'pick.b[0]')).toBeUndefined();
    expect(occurrenceNumber(wrapper, 'pick.c[0]')).toBe(2);
    expect(wrapper.findAll('[data-testid$="-global-index"]').map(element => element.text())).toEqual(['1', '2']);
  });

  it('numbers occurrences in the order they were added when the choice shows them that way', async () => {
    const { wrapper } = await mountInForm({ metadata: withAddedOrder(explicitRepeatable) });
    await click(addButton(wrapper, 'pick', 'b'));
    await click(addButton(wrapper, 'pick', 'a'));

    expect(occurrencePaths(wrapper, 'pick')).toEqual(['pick.b[0]', 'pick.a[0]']);
    expect(occurrenceNumber(wrapper, 'pick.b[0]')).toBe(1);
    expect(occurrenceNumber(wrapper, 'pick.a[0]')).toBe(2);
  });

  it('counts choice slots and not raw items', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatableBatched });

    await click(addButton(wrapper, 'pick', 'a'));
    await click(addButton(wrapper, 'pick', 'a'));

    expect(occurrenceCards(wrapper, 'pick')).toHaveLength(2);
    expect(counterNumbers(wrapper, 'pick')).toEqual({ used: 1, max: 2 });
  });

  it('keeps a batched branch addable after the counter reaches its maximum until its own batch is full', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatableBatched });

    await click(addButton(wrapper, 'pick', 'a'));
    await click(addButton(wrapper, 'pick', 'b'));

    expect(counterNumbers(wrapper, 'pick')).toEqual({ used: 2, max: 2 });
    expect(isBranchAddEnabled(wrapper, 'pick', 'a')).toBe(true);
    expect(isBranchAddEnabled(wrapper, 'pick', 'b')).toBe(false);

    await click(addButton(wrapper, 'pick', 'a'));

    expect(occurrenceCards(wrapper, 'pick')).toHaveLength(3);
    expect(isBranchAddEnabled(wrapper, 'pick', 'a')).toBe(false);
  });

  it('keeps the section and its add controls after the last occurrence is removed', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable, initialValues: { pick: { a: ['x'] } } });

    await click(wrapper.find('[data-testid="pick.a[0]-remove-choice-button"]'));

    expect(occurrenceCards(wrapper, 'pick')).toHaveLength(0);
    expect(addButtons(wrapper, 'pick')).toHaveLength(3);
    expect(counterNumbers(wrapper, 'pick').used).toBe(0);
  });

  it('shows one card per loaded occurrence and counts them', async () => {
    const { wrapper } = await mountInForm({ metadata: explicitRepeatable, initialValues: { pick: { a: ['x'], c: ['z'] } } });

    expect(occurrencePaths(wrapper, 'pick')).toEqual(['pick.a[0]', 'pick.c[0]']);
    expect(counterNumbers(wrapper, 'pick').used).toBe(2);
  });

  it('adds a group branch twice with its children in each card', async () => {
    const { wrapper } = await mountInForm({ metadata: groupBranchRepeatable });

    await click(addButton(wrapper, 'pick', 'person'));
    await click(addButton(wrapper, 'pick', 'person'));

    const cards = occurrenceCards(wrapper, 'pick');
    expect(cards).toHaveLength(2);
    for (const card of cards)
      expect(card.findAllComponents(ElInput)).toHaveLength(2);
  });
});

describe('component ElementPlusFormTemplate - choice selection modes', () => {
  expectNoWarnings();

  it('renders explicit and automatic choices through the same fallbacks', async () => {
    const { wrapper } = await mountInForm({ metadata: [explicitSingle, { ...autoSingle, name: 'auto' }] });

    expect(sectionOf(wrapper, 'pick').exists()).toBe(true);
    expect(sectionOf(wrapper, 'auto').exists()).toBe(true);
  });

  it('offers selection controls only in explicit mode', async () => {
    const { wrapper } = await mountInForm({ metadata: [explicitSingle, { ...autoSingle, name: 'auto' }] });

    expect(addButtons(wrapper, 'pick')).toHaveLength(3);
    expect(addButtons(wrapper, 'auto')).toHaveLength(0);
    expect(removeButtons(wrapper, 'auto')).toHaveLength(0);
    expect(sectionOf(wrapper, 'auto').findAll('input')).toHaveLength(3);
  });

  it('keeps entered values in automatic mode because the section offers nothing that clears a branch', async () => {
    const { wrapper, values } = await mountInForm({ metadata: autoSingle });

    await wrapper.findAll('input')[0].setValue('alpha');
    await flushPromises();
    expect(sectionOf(wrapper, 'pick').findAll('button')).toHaveLength(0);

    expect(values().pick.a).toBe('alpha');
    expect(inputValues(wrapper)[0]).toBe('alpha');
  });
});
