import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RepeaterCard from '@/RepeaterCard.vue';

describe('component RepeaterCard', () => {
  it('omits the remove button data-testid when no dataTestid prop is given, and still emits remove on click', async () => {
    const wrapper = mount(RepeaterCard, { props: { index: 0 } });

    const button = wrapper.find('button');
    expect(button.attributes('data-testid')).toBeUndefined();

    await button.trigger('click');

    expect(wrapper.emitted('remove')).toHaveLength(1);
  });

  it('falls back to the placeholder title when no title is given', () => {
    const wrapper = mount(RepeaterCard, { props: { index: 0, placeholderTitle: 'New contact' } });

    expect(wrapper.find('.sft-repeater-title').text()).toBe('New contact');
  });
});
