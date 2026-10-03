import { flushPromises } from '@vue/test-utils';
import { ElCard, ElInput, ElInputNumber } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { addButton, inputValues, itemCards, removeButtons, section, tagsMetadata } from './fixtures/arrayHelpers';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { expectNoWarnings } from './fixtures/expectNoWarnings';
import { mountInForm } from './fixtures/mountInForm';
import WrapperOverrideItemOnly from './fixtures/WrapperOverrideItemOnly.vue';
import WrapperOverrideSectionOnly from './fixtures/WrapperOverrideSectionOnly.vue';
import WrapperOverrideTextArrayItem from './fixtures/WrapperOverrideTextArrayItem.vue';

const initialValues = { tags: ['a', 'b'] };

describe('component ElementPlusFormTemplate - overriding array slots', () => {
  expectNoWarnings();

  it('keeps the built-in section when only the item slot is overridden', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues, template: WrapperOverrideItemOnly });

    expect(section(wrapper, 'tags').exists()).toBe(true);
    expect(addButton(wrapper, 'tags').exists()).toBe(true);
    expect(itemCards(wrapper, 'tags')).toHaveLength(0);
    expect(wrapper.findAll('[data-testid^="custom-item-"]')).toHaveLength(2);
    expect(section(wrapper, 'tags').findAll('[data-testid^="custom-item-"]')).toHaveLength(2);
    expect(inputValues(wrapper)).toEqual(['a', 'b']);
  });

  it('hands the item scope to the consumer, whose removeItem removes that item', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues: { tags: ['a', 'b', 'c'] }, template: WrapperOverrideItemOnly });

    expect(wrapper.find('[data-testid="custom-item-1"]').attributes('data-can-remove')).toBe('true');

    await wrapper.find('[data-testid="custom-remove-1"]').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('[data-testid^="custom-item-"]')).toHaveLength(2);
    expect(inputValues(wrapper)).toEqual(['a', 'c']);
  });

  it('keeps the built-in item cards when only the section slot is overridden', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues, template: WrapperOverrideSectionOnly });

    const custom = wrapper.find('[data-testid="custom-section"]');
    expect(custom.exists()).toBe(true);
    expect(section(wrapper, 'tags').exists()).toBe(false);
    expect(custom.attributes('data-can-add')).toBe('true');
    expect(custom.findAll('[data-testid^="tags-array-item-"]')).toHaveLength(2);
    expect(custom.findAllComponents(ElCard)).toHaveLength(2);
    expect(removeButtons(wrapper, 'tags')).toHaveLength(2);
  });

  it('hands the section scope to the consumer, whose addItem adds an item', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues, template: WrapperOverrideSectionOnly });

    await wrapper.find('[data-testid="custom-add"]').trigger('click');
    await flushPromises();

    expect(itemCards(wrapper, 'tags')).toHaveLength(3);
  });
});

describe('component ElementPlusFormTemplate - per-type array slots', () => {
  it('uses a per-type item slot for that type only', async () => {
    const { wrapper } = await mountInForm({
      metadata: [tagsMetadata, { name: 'counts', type: 'number', label: 'Counts', maxOccurs: 3 }],
      initialValues: { tags: ['a', 'b'], counts: [1, 2] },
      template: WrapperOverrideTextArrayItem,
    });

    expect(wrapper.findAll('[data-testid="custom-text-item"]')).toHaveLength(2);
    expect(itemCards(wrapper, 'tags')).toHaveLength(0);
    expect(itemCards(wrapper, 'counts')).toHaveLength(2);
    expect(itemCards(wrapper, 'counts')[0].findComponent(ElInputNumber).exists()).toBe(true);
    expect(section(wrapper, 'tags').exists()).toBe(true);
  });

  it('prefers the per-type item slot over the default item slot', async () => {
    const { wrapper } = await mountInForm({
      metadata: tagsMetadata,
      initialValues,
      template: createConsumerWrapper({
        overrides: {
          'default-array-item': (scope, slots) => h('div', { 'data-testid': 'default-item' }, slots.default?.(scope)),
          'text-array-item': (scope, slots) => h('div', { 'data-testid': 'type-item' }, slots.default?.(scope)),
        },
      }),
    });

    expect(wrapper.findAll('[data-testid="type-item"]')).toHaveLength(2);
    expect(wrapper.findAll('[data-testid="default-item"]')).toHaveLength(0);
  });
});

describe('component ElementPlusFormTemplate - repeatable choice occurrences', () => {
  const choiceMetadata = {
    name: 'pick',
    label: 'Pick several',
    explicitChoiceSelection: true,
    maxOccurs: 3,
    choice: [
      { name: 'apiEndpoint', maxOccurs: 2, label: 'Api endpoint' },
      { name: 'crmExport', maxOccurs: 2, label: 'Crm export' },
    ],
  };

  it('renders each occurrence in a choice occurrence card instead of an array item card and removes one', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: choiceMetadata,
      initialValues: { pick: { apiEndpoint: ['x', 'y'] } },
    });

    expect(wrapper.findAll('.epft-array-item')).toHaveLength(0);
    const cards = wrapper.findAll('.epft-choice-occurrence');
    expect(cards).toHaveLength(2);
    for (const card of cards)
      expect(card.findAllComponents(ElInput)).toHaveLength(1);
    expect(inputValues(wrapper)).toEqual(['x', 'y']);

    await cards[0].find('[data-testid$="-remove-choice-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.findAll('.epft-choice-occurrence')).toHaveLength(1);
    expect(inputValues(wrapper)).toEqual(['y']);
    expect(values().pick.apiEndpoint).toEqual(['y']);
  });
});
