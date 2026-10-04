import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ChoiceCard from '@/ChoiceCard.vue';

describe('component ChoiceCard', () => {
  it('renders no title or description when both are omitted', () => {
    const wrapper = mount(ChoiceCard);

    expect(wrapper.find('.sft-choice-title').exists()).toBe(false);
    expect(wrapper.find('.sft-choice-desc').exists()).toBe(false);
  });

  it('emits select when clicked', async () => {
    const wrapper = mount(ChoiceCard, { props: { title: 'Alpha' } });

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toHaveLength(1);
  });
});
