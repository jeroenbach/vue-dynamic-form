import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SectionCard from '@/SectionCard.vue';

describe('component SectionCard', () => {
  it('renders no heading or tag when label and tag are omitted', () => {
    const wrapper = mount(SectionCard);

    expect(wrapper.find('h2').exists()).toBe(false);
    expect(wrapper.find('.sft-pill').exists()).toBe(false);
  });

  it('renders the footer slot', () => {
    const wrapper = mount(SectionCard, { slots: { footer: '<p class="custom-footer">footer</p>' } });

    expect(wrapper.find('.custom-footer').exists()).toBe(true);
  });
});
