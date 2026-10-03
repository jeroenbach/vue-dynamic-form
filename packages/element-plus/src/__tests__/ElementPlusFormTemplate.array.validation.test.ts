import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { addButton, itemCards, section, tagsMetadata } from './fixtures/arrayHelpers';
import { mountInForm } from './fixtures/mountInForm';

const messages = { minOccurs: 'Add at least two tags', minLength: 'Too short' };

describe('component ElementPlusFormTemplate - array validation', () => {
  it('shows the array error on the section when there are too few items', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { ...tagsMetadata, minOccurs: 2, autoAddMinOccurs: false },
      initialValues: { tags: ['a'] },
      settings: { messages },
    });
    await validate();
    await flushPromises();

    const error = section(wrapper, 'tags').find('.epft-array-error');
    expect(error.text()).toBe('Add at least two tags');
    expect(itemCards(wrapper, 'tags').every(card => !card.text().includes('Add at least two tags'))).toBe(true);
  });

  it('hides the array error once the array has enough items', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { ...tagsMetadata, minOccurs: 2, autoAddMinOccurs: false },
      initialValues: { tags: ['a'] },
      settings: { messages, validateOnValueUpdate: true },
    });
    await validate();
    await flushPromises();
    expect(section(wrapper, 'tags').find('.epft-array-error').exists()).toBe(true);

    await addButton(wrapper, 'tags').trigger('click');
    await flushPromises();
    await wrapper.findAll('input')[1].setValue('b');
    await flushPromises();
    await validate();
    await flushPromises();

    expect(section(wrapper, 'tags').find('.epft-array-error').exists()).toBe(false);
  });

  it('shows an item error inside its own card and not in its siblings', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { ...tagsMetadata, restriction: { minLength: 3 } },
      initialValues: { tags: ['a', 'abcd'] },
      settings: { messages },
    });

    await validate();
    await flushPromises();

    const [first, second] = itemCards(wrapper, 'tags');
    expect(first.find('.epft-array-error').text()).toBe('Too short');
    expect(second.find('.epft-array-error').exists()).toBe(false);
    expect(section(wrapper, 'tags').findAll('.epft-array-error')).toHaveLength(1);
  });

  it('marks the section title as required when minOccurs is at least 1', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, minOccurs: 1 }, initialValues: { tags: ['a'] } });

    expect(section(wrapper, 'tags').find('.epft-array-title').classes()).toContain('is-required');
  });

  it('does not mark the section title as required when minOccurs is 0', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, minOccurs: 0 }, initialValues: { tags: ['a'] } });

    expect(section(wrapper, 'tags').find('.epft-array-title').classes()).not.toContain('is-required');
  });
});
