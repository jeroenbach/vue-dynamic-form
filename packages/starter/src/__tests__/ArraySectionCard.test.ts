import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ArraySectionCard from '@/ArraySectionCard.vue';

describe('component ArraySectionCard', () => {
  it('omits data-testid attributes on its buttons when no dataTestid prop is given', async () => {
    const empty = mount(ArraySectionCard, { props: { label: 'Contacts', itemsCount: 0, canAddItems: true } });
    expect(empty.find('.sft-empty button').attributes('data-testid')).toBeUndefined();

    const filled = mount(ArraySectionCard, { props: { label: 'Contacts', itemsCount: 1, canAddItems: true } });
    expect(filled.find('.sft-array-footer button').attributes('data-testid')).toBeUndefined();

    await filled.find('.sft-array-footer button').trigger('click');
    expect(filled.emitted('addItem')).toHaveLength(1);
  });
});
