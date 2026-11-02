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

  it('spans the full grid row by default; an explicit colSpan adds its own class on top', () => {
    const wrapper = mount(SectionCard);
    expect(wrapper.classes()).toContain('sft-span-full');

    const narrowed = mount(SectionCard, { props: { colSpan: 2 } });
    expect(narrowed.classes()).toContain('sft-span-full');
    expect(narrowed.classes()).toContain('sft-span-2');
  });
});
