import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { addButton, isDisabled, itemCards, removeButtons, section } from './fixtures/arrayHelpers';
import { headingArrayMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

async function click(button: { trigger: (event: string) => Promise<void> }) {
  await button.trigger('click');
  await flushPromises();
}

describe('component StarterFormTemplate - heading-array empty state', () => {
  it('shows the empty-state card with icon, title, hint, and a primary Add button', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...headingArrayMetadata, minOccurs: 0, autoAddMinOccurs: false, arrayNoItemsMessage: 'No contacts yet, add one to get started.' },
    });

    const empty = section(wrapper, 'contacts').find('.sft-empty');
    expect(empty.exists()).toBe(true);
    expect(empty.find('.sft-empty-icon').exists()).toBe(true);
    expect(empty.find('.sft-empty-title').text()).toContain('No contacts added yet');
    expect(empty.find('.sft-empty-hint').text()).toBe('No contacts yet, add one to get started.');

    const addFromEmptyState = empty.find('button');
    expect(addFromEmptyState.exists()).toBe(true);
    expect(addFromEmptyState.classes()).toContain('sft-btn-primary');

    await click(addFromEmptyState);

    expect(itemCards(wrapper, 'contacts')).toHaveLength(1);
  });
});

describe('component StarterFormTemplate - heading-array add/remove', () => {
  it('appends a new item at the end, keeping existing items in order', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: { ...headingArrayMetadata, maxOccurs: 5 },
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }, { first: 'Cho', last: 'Kim' }] },
    });

    await click(addButton(wrapper, 'contacts'));

    const cards = itemCards(wrapper, 'contacts');
    expect(cards).toHaveLength(4);
    expect(cards.map(card => card.find('.sft-repeater-title').text())).toEqual(['Ann', 'Bob', 'Cho', 'New contact']);
    expect(values().contacts.slice(0, 3)).toEqual([{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }, { first: 'Cho', last: 'Kim' }]);
  });

  it('removes the middle item and preserves the relative order of the rest', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: headingArrayMetadata,
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }, { first: 'Cho', last: 'Kim' }] },
    });

    await click(removeButtons(wrapper, 'contacts')[1]);

    const cards = itemCards(wrapper, 'contacts');
    expect(cards).toHaveLength(2);
    expect(cards.map(card => card.find('.sft-repeater-title').text())).toEqual(['Ann', 'Cho']);
    expect(values().contacts).toEqual([{ first: 'Ann', last: 'Lee' }, { first: 'Cho', last: 'Kim' }]);
  });

  it('disables remove at minOccurs for an empty item, reflecting canRemoveItems on the chrome', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...headingArrayMetadata, minOccurs: 1 },
      initialValues: { contacts: [{}] },
    });

    expect(isDisabled(removeButtons(wrapper, 'contacts')[0])).toBe(true);
  });

  it('still allows removing an item at minOccurs once it carries a value, so it can be cleared', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...headingArrayMetadata, minOccurs: 1 },
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }] },
    });

    expect(isDisabled(removeButtons(wrapper, 'contacts')[0])).toBe(false);
  });
});
