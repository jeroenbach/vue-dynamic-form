import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ChoiceSectionCard from '@/ChoiceSectionCard.vue';

describe('component ChoiceSectionCard', () => {
  it('renders no choice grid when options are omitted', () => {
    const wrapper = mount(ChoiceSectionCard, { props: { label: 'Launch approach' } });

    expect(wrapper.find('.sft-choice-grid').exists()).toBe(false);
  });

  it('does not add cols-2 for a single option', () => {
    const wrapper = mount(ChoiceSectionCard, { props: { options: [{ value: 'a', title: 'Alpha' }] } });

    expect(wrapper.find('.sft-choice-grid').classes()).not.toContain('cols-2');
  });

  it('falls back to the default aria-label when no label is given', () => {
    const wrapper = mount(ChoiceSectionCard, { props: { options: [{ value: 'a', title: 'Alpha' }] } });

    expect(wrapper.find('.sft-choice-grid').attributes('aria-label')).toBe('Choose an option');
  });

  it('omits the per-card data-testid when no dataTestid prop is given', () => {
    const wrapper = mount(ChoiceSectionCard, { props: { options: [{ value: 'a', title: 'Alpha' }] } });

    expect(wrapper.find('.sft-choice-card').attributes('data-testid')).toBeUndefined();
  });

  it('falls back to a no-op when addChoiceOccurrence is omitted', async () => {
    const wrapper = mount(ChoiceSectionCard, { props: { options: [{ value: 'a', title: 'Alpha' }] } });

    await expect(wrapper.find('.sft-choice-card').trigger('click')).resolves.toBeUndefined();
  });
});
