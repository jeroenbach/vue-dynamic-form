import { describe, expect, it } from 'vitest';
import { itemCards, section } from './fixtures/arrayHelpers';
import { headingArrayMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

const initialValues = { contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }] };

describe('component StarterFormTemplate - heading-declared array chrome (heading-array)', () => {
  it('renders the richer section chrome: count pill, grid, section classes', async () => {
    const { wrapper } = await mountInForm({ metadata: headingArrayMetadata, initialValues });

    const root = section(wrapper, 'contacts');
    expect(root.classes()).toContain('sft-section');
    expect(root.find('.sft-pill').text()).toBe('2 contacts');
    expect(root.find('.sft-grid').exists()).toBe(true);
  });

  it('renders each item through RepeaterCard chrome', async () => {
    const { wrapper } = await mountInForm({ metadata: headingArrayMetadata, initialValues });

    const cards = itemCards(wrapper, 'contacts');
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.classes()).toContain('sft-repeater');
      expect(card.find('.sft-repeater-header').exists()).toBe(true);
      expect(card.find('.sft-repeater-title-group').exists()).toBe(true);
      expect(card.find('.sft-repeater-badge').exists()).toBe(true);
      expect(card.find('.sft-repeater-title').exists()).toBe(true);
    }
  });

  it('titles each item using arrayItemFieldForTitle', async () => {
    const { wrapper } = await mountInForm({ metadata: headingArrayMetadata, initialValues });

    const cards = itemCards(wrapper, 'contacts');
    expect(cards[0].find('.sft-repeater-title').text()).toBe('Ann');
    expect(cards[1].find('.sft-repeater-title').text()).toBe('Bob');
  });

  it('numbers items in badges in display order', async () => {
    const { wrapper } = await mountInForm({ metadata: headingArrayMetadata, initialValues });

    const cards = itemCards(wrapper, 'contacts');
    expect(cards[0].find('.sft-repeater-badge').text()).toBe('1');
    expect(cards[1].find('.sft-repeater-badge').text()).toBe('2');
  });

  it('renders the section description when given', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...headingArrayMetadata, description: 'People to contact' }, initialValues });

    expect(section(wrapper, 'contacts').find('.sft-section-desc').text()).toBe('People to contact');
  });

  it('falls back to default singular/plural item wording when arrayItemName and arrayItemNamePlural are both omitted', async () => {
    const { wrapper } = await mountInForm({
      metadata: {
        name: 'contacts',
        type: 'heading',
        fieldOptions: { label: 'Contacts' },
        maxOccurs: 3,
        children: [{ name: 'first', type: 'text', fieldOptions: { label: 'First' } }],
      },
      initialValues: { contacts: [{ first: 'Ann' }] },
    });

    const root = section(wrapper, 'contacts');
    expect(root.find('.sft-pill').text()).toBe('1 item');
    expect(root.find('.sft-array-footer button').text()).toContain('Add item');
  });

  it('falls back to default plural item wording for a zero-item empty state when arrayItemNamePlural is omitted', async () => {
    const { wrapper } = await mountInForm({
      metadata: {
        name: 'contacts',
        type: 'heading',
        fieldOptions: { label: 'Contacts' },
        maxOccurs: 3,
        minOccurs: 0,
        autoAddMinOccurs: false,
        children: [{ name: 'first', type: 'text', fieldOptions: { label: 'First' } }],
      },
    });

    const empty = section(wrapper, 'contacts').find('.sft-empty');
    expect(empty.find('.sft-empty-title').text()).toBe('No items added yet');
    expect(empty.find('button').text()).toContain('Add a item');
    expect(empty.find('.sft-empty-hint').exists()).toBe(false);
  });
});
