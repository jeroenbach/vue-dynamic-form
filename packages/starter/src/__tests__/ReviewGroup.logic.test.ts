import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import ReviewGroup from '@/ReviewGroup.vue';
import StarterIcon from '@/StarterIcon.vue';

describe('reviewGroup icon rendering, mounted standalone', () => {
  it('renders the Lucide default edit glyph with no form ancestor to provide an override', () => {
    const wrapper = mount(ReviewGroup, { props: { title: 'Company', rows: [] } });

    expect(wrapper.findComponent(StarterIcon).props('name')).toBe('pencil');
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('still renders the Lucide default when an unrelated ancestor provides something under a different key', () => {
    const UnrelatedAncestor = defineComponent({
      setup(_, { slots }) {
        return () => h('div', slots.default?.());
      },
    });

    const wrapper = mount(UnrelatedAncestor, {
      slots: {
        default: () => h(ReviewGroup, { title: 'Company', rows: [] }),
      },
    });

    expect(wrapper.find('svg').exists()).toBe(true);
  });
});
