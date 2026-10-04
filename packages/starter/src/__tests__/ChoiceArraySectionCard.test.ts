import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ChoiceArraySectionCard from '@/ChoiceArraySectionCard.vue';

describe('component ChoiceArraySectionCard', () => {
  it('renders no add bar when options are omitted', () => {
    const wrapper = mount(ChoiceArraySectionCard, { props: { label: 'Notification channels' } });

    expect(wrapper.find('.sft-choice-addbar').exists()).toBe(false);
  });

  it('renders no count pill when maxOccurs is omitted', () => {
    const wrapper = mount(ChoiceArraySectionCard, { props: { options: [{ value: 'email', title: 'Email' }] } });

    expect(wrapper.find('.sft-pill').exists()).toBe(false);
  });

  it('treats every branch as addable when canAddChoiceOccurrence is omitted', () => {
    const wrapper = mount(ChoiceArraySectionCard, { props: { options: [{ value: 'email', title: 'Email' }] } });

    expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('.sft-choice-addbar-reason').exists()).toBe(false);
  });

  it('falls back to the branch value in the button and reason text when a branch has no title', () => {
    const wrapper = mount(ChoiceArraySectionCard, {
      props: { options: [{ value: 'email' }], canAddChoiceOccurrence: () => false },
    });

    expect(wrapper.find('button').text()).toContain('Add email');
    expect(wrapper.find('.sft-choice-addbar-reason').text()).toBe('The limit for email has been reached.');
  });

  it('omits the reason id and the button data-testid when no dataTestid prop is given', () => {
    const wrapper = mount(ChoiceArraySectionCard, {
      props: { options: [{ value: 'email', title: 'Email' }], canAddChoiceOccurrence: () => false },
    });

    const button = wrapper.find('button');
    expect(button.attributes('data-testid')).toBeUndefined();
    expect(button.attributes('aria-describedby')).toBeUndefined();
    expect(wrapper.find('.sft-choice-addbar-reason').attributes('id')).toBeUndefined();
  });

  it('falls back to a no-op when addChoiceOccurrence is omitted', async () => {
    const wrapper = mount(ChoiceArraySectionCard, { props: { options: [{ value: 'email', title: 'Email' }] } });

    await expect(wrapper.find('button').trigger('click')).resolves.toBeUndefined();
  });
});
