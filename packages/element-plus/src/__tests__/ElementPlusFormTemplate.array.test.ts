import { ElButton, ElCard, ElFormItem, ElInput } from 'element-plus';
import { describe, expect, it } from 'vitest';
import { addButton, inputValues, isDisabled, itemCards, removeButtons, section, tagsMetadata } from './fixtures/arrayHelpers';
import { mountInForm } from './fixtures/mountInForm';

const initialValues = { tags: ['a', 'b'] };

describe('component ElementPlusFormTemplate - array section', () => {
  it('renders a section titled with the field label', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues });

    const cards = wrapper.findAllComponents(ElCard);
    const sectionCard = cards.find(card => card.attributes('data-testid') === 'tags-array-section');
    expect(sectionCard).toBeDefined();
    expect(sectionCard!.find('.epft-array-title').text()).toBe('Tags');
  });

  it('renders every item inside the section', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues });

    expect(wrapper.findAllComponents(ElInput)).toHaveLength(2);
    expect(section(wrapper, 'tags').findAllComponents(ElInput)).toHaveLength(2);
    expect(wrapper.findAllComponents(ElCard)).toHaveLength(3);
  });

  it('does not render the text undefined in the title when the field has no label', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...tagsMetadata, label: undefined }, initialValues });

    expect(section(wrapper, 'tags').text()).not.toContain('undefined');
    expect(section(wrapper, 'tags').find('.epft-array-title').text()).toBe('');
  });

  it('renders each item in its own card with an input and a remove button', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues });

    const cards = itemCards(wrapper, 'tags');
    expect(cards).toHaveLength(2);
    cards.forEach((card, index) => {
      expect(card.classes()).toContain('el-card');
      expect(card.findAllComponents(ElInput)).toHaveLength(1);
      expect(card.findAllComponents(ElButton)).toHaveLength(1);
      expect(card.find(`[data-testid="tags-remove-button-${index}"]`).exists()).toBe(true);
    });
    expect(inputValues(wrapper)).toEqual(['a', 'b']);
  });

  it('renders the add button in the section, after the items', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues });

    const add = addButton(wrapper, 'tags');
    expect(section(wrapper, 'tags').element.contains(add.element)).toBe(true);
    const lastCard = itemCards(wrapper, 'tags')[1];
    expect(lastCard.element.compareDocumentPosition(add.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('labels the buttons Add and Remove', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues });

    const texts = wrapper.findAllComponents(ElButton).map(button => button.text());
    expect(texts.filter(text => text === 'Add')).toHaveLength(1);
    expect(texts.filter(text => text === 'Remove')).toHaveLength(2);
  });

  it('does not wrap array items in a form item', async () => {
    const { wrapper } = await mountInForm({ metadata: tagsMetadata, initialValues });

    expect(wrapper.findAllComponents(ElFormItem)).toHaveLength(0);
  });

  it('shows only the title and the add button for an empty array', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...tagsMetadata, minOccurs: 0, autoAddMinOccurs: false },
    });

    expect(section(wrapper, 'tags').exists()).toBe(true);
    expect(itemCards(wrapper, 'tags')).toHaveLength(0);
    expect(removeButtons(wrapper, 'tags')).toHaveLength(0);
    expect(addButton(wrapper, 'tags').exists()).toBe(true);
    expect(isDisabled(addButton(wrapper, 'tags'))).toBe(false);
  });

  it('renders one card per group occurrence containing the group children', async () => {
    const { wrapper } = await mountInForm({
      metadata: {
        name: 'contacts',
        label: 'Contacts',
        maxOccurs: 3,
        children: [
          { name: 'first', type: 'text', label: 'First' },
          { name: 'last', type: 'text', label: 'Last' },
        ],
      },
      initialValues: { contacts: [{ first: 'Ann', last: 'Lee' }, { first: 'Bob', last: 'Ray' }] },
    });

    const cards = itemCards(wrapper, 'contacts');
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.findAllComponents(ElInput)).toHaveLength(2);
      expect(card.findAllComponents(ElFormItem)).toHaveLength(2);
      expect(card.findAll('.el-form-item__label').map(label => label.text())).toEqual(['First', 'Last']);
    }
    expect(inputValues(wrapper)).toEqual(['Ann', 'Lee', 'Bob', 'Ray']);
  });
});
