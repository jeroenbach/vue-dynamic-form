import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { addButton, inputValues, isDisabled, itemCards, removeButtons, section, tagsMetadata } from './fixtures/arrayHelpers';
import { mountInForm } from './fixtures/mountInForm';

async function click(button: { trigger: (event: string) => Promise<void> }) {
  await button.trigger('click');
  await flushPromises();
}

function forceClick(button: { element: Element }) {
  button.element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return flushPromises();
}

describe('component ElementPlusFormTemplate - adding items', () => {
  it('enables the add button below maxOccurs and adds an empty item', async () => {
    const { wrapper, values } = await mountInForm({ metadata: tagsMetadata, initialValues: { tags: ['a', 'b'] } });

    expect(isDisabled(addButton(wrapper, 'tags'))).toBe(false);
    await click(addButton(wrapper, 'tags'));

    expect(itemCards(wrapper, 'tags')).toHaveLength(3);
    expect(inputValues(wrapper)).toEqual(['a', 'b', '']);
    expect(values().tags.slice(0, 2)).toEqual(['a', 'b']);
  });

  it('disables the add button at maxOccurs', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, maxOccurs: 2 }, initialValues: { tags: ['a', 'b'] } });

    expect(isDisabled(addButton(wrapper, 'tags'))).toBe(true);
  });

  it('adds nothing when the disabled add button is clicked, also when the click is forced', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, maxOccurs: 2 }, initialValues: { tags: ['a', 'b'] } });

    await click(addButton(wrapper, 'tags'));
    await forceClick(addButton(wrapper, 'tags'));

    expect(itemCards(wrapper, 'tags')).toHaveLength(2);
  });

  it('follows the item count when filling up to the limit and removing again', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, maxOccurs: 3 }, initialValues: { tags: ['a', 'b'] } });

    await click(addButton(wrapper, 'tags'));
    expect(isDisabled(addButton(wrapper, 'tags'))).toBe(true);

    await click(removeButtons(wrapper, 'tags')[2]);
    expect(itemCards(wrapper, 'tags')).toHaveLength(2);
    expect(isDisabled(addButton(wrapper, 'tags'))).toBe(false);
  });

  it('never disables add through the limit with a very large maxOccurs', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, maxOccurs: 1000 }, initialValues: { tags: ['a', 'b'] } });

    for (let i = 0; i < 5; i++)
      await click(addButton(wrapper, 'tags'));

    expect(itemCards(wrapper, 'tags')).toHaveLength(7);
    expect(isDisabled(addButton(wrapper, 'tags'))).toBe(false);
  });
});

describe('component ElementPlusFormTemplate - removing items', () => {
  it('removes exactly the clicked item and keeps the other values', async () => {
    const { wrapper, values } = await mountInForm({ metadata: tagsMetadata, initialValues: { tags: ['a', 'b', 'c'] } });

    await click(removeButtons(wrapper, 'tags')[1]);

    expect(itemCards(wrapper, 'tags')).toHaveLength(2);
    expect(inputValues(wrapper)).toEqual(['a', 'c']);
    expect(values().tags).toEqual(['a', 'c']);
  });

  it('removes the first and the last item', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues: { tags: ['a', 'b', 'c'] } });

    await click(removeButtons(wrapper, 'tags')[0]);
    expect(inputValues(wrapper)).toEqual(['b', 'c']);

    await click(removeButtons(wrapper, 'tags')[1]);
    expect(inputValues(wrapper)).toEqual(['b']);
  });

  it('disables the remove button of an empty item at minOccurs', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, minOccurs: 2 } });

    const buttons = removeButtons(wrapper, 'tags');
    expect(buttons).toHaveLength(2);
    for (const button of buttons)
      expect(isDisabled(button)).toBe(true);
  });

  it('clears an item with a value at minOccurs instead of removing its card', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, minOccurs: 2 }, initialValues: { tags: ['a', 'b'] } });

    expect(isDisabled(removeButtons(wrapper, 'tags')[0])).toBe(false);
    await click(removeButtons(wrapper, 'tags')[0]);

    expect(itemCards(wrapper, 'tags')).toHaveLength(2);
    expect(inputValues(wrapper)).toEqual(['', 'b']);
  });

  it('leaves an empty section when the last item is removed and allows adding again', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...tagsMetadata, minOccurs: 0, autoAddMinOccurs: false },
      initialValues: { tags: ['a'] },
    });

    await click(removeButtons(wrapper, 'tags')[0]);

    expect(itemCards(wrapper, 'tags')).toHaveLength(0);
    expect(section(wrapper, 'tags').exists()).toBe(true);
    expect(addButton(wrapper, 'tags').exists()).toBe(true);

    await click(addButton(wrapper, 'tags'));
    expect(itemCards(wrapper, 'tags')).toHaveLength(1);
  });

  it('keeps remove inert when the disabled button is clicked with force', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, minOccurs: 2 } });

    await forceClick(removeButtons(wrapper, 'tags')[0]);

    expect(itemCards(wrapper, 'tags')).toHaveLength(2);
  });
});

describe('component ElementPlusFormTemplate - array of groups', () => {
  const contactsMetadata = {
    name: 'contacts',
    label: 'Contacts',
    maxOccurs: 3,
    children: [
      { name: 'first', type: 'text', label: 'First' },
      { name: 'last', type: 'text', label: 'Last' },
    ],
  };

  it('adds and removes group occurrences and keeps the child values', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: contactsMetadata,
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }] },
    });

    await click(addButton(wrapper, 'contacts'));
    expect(itemCards(wrapper, 'contacts')).toHaveLength(3);
    expect(isDisabled(addButton(wrapper, 'contacts'))).toBe(true);

    await wrapper.findAll('input')[4].setValue('Cy');
    await flushPromises();
    expect(values().contacts[2].first).toBe('Cy');

    await click(removeButtons(wrapper, 'contacts')[0]);
    expect(itemCards(wrapper, 'contacts')).toHaveLength(2);
    expect(values().contacts.map((contact: any) => contact.first)).toEqual(['Bob', 'Cy']);
    expect(values().contacts[0].last).toBe('Ray');
  });
});

describe('component ElementPlusFormTemplate - disabled arrays', () => {
  it('disables add and every remove button when the array sits in a group that is switched off', async () => {
    const { wrapper } = await mountInForm({
      metadata: { name: 'box', label: 'Box', maxOccurs: 0, children: [tagsMetadata] },
      initialValues: { box: { tags: ['a', 'b'] } },
    });

    expect(isDisabled(addButton(wrapper, 'box.tags'))).toBe(true);
    const buttons = removeButtons(wrapper, 'box.tags');
    expect(buttons).toHaveLength(2);
    for (const button of buttons)
      expect(isDisabled(button)).toBe(true);
  });

  it('disables add and every remove button when disabled is true, including an item that holds a value', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, disabled: true }, initialValues: { tags: ['a', 'b'] } });

    expect(isDisabled(addButton(wrapper, 'tags'))).toBe(true);
    const buttons = removeButtons(wrapper, 'tags');
    expect(buttons).toHaveLength(2);
    for (const button of buttons)
      expect(isDisabled(button)).toBe(true);

    await click(removeButtons(wrapper, 'tags')[0]);
    await forceClick(removeButtons(wrapper, 'tags')[0]);
    await forceClick(addButton(wrapper, 'tags'));

    expect(itemCards(wrapper, 'tags')).toHaveLength(2);
    expect(inputValues(wrapper)).toEqual(['a', 'b']);
  });
});
