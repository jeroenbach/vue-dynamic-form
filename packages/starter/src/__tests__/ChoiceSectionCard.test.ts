import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
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

  it('disables every option card when disabled is set', () => {
    const wrapper = mount(ChoiceSectionCard, {
      props: { options: [{ value: 'a', title: 'Alpha' }, { value: 'b', title: 'Beta' }], disabled: true },
    });

    expect(wrapper.findAll('.sft-choice-card').every(card => card.attributes('disabled') !== undefined)).toBe(true);
  });

  it('deselects every active occurrence when disabled flips from false to true', async () => {
    const removeChoiceOccurrence = vi.fn();
    const wrapper = mount(ChoiceSectionCard, {
      props: {
        options: [{ value: 'a', title: 'Alpha' }],
        activeChoiceOccurrences: [{ branchKey: 'a', index: 0 }],
        removeChoiceOccurrence,
        disabled: false,
      },
    });

    expect(removeChoiceOccurrence).not.toHaveBeenCalled();

    await wrapper.setProps({ disabled: true });

    expect(removeChoiceOccurrence).toHaveBeenCalledExactlyOnceWith('a', 0);
  });

  it('does nothing when disabled flips to false', async () => {
    const removeChoiceOccurrence = vi.fn();
    const wrapper = mount(ChoiceSectionCard, {
      props: {
        options: [{ value: 'a', title: 'Alpha' }],
        activeChoiceOccurrences: [{ branchKey: 'a', index: 0 }],
        removeChoiceOccurrence,
        disabled: true,
      },
    });

    await wrapper.setProps({ disabled: false });

    expect(removeChoiceOccurrence).not.toHaveBeenCalled();
  });
});
