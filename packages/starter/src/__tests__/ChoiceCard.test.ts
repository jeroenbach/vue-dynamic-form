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

  it('blocks select and dims the card when disabled', async () => {
    const wrapper = mount(ChoiceCard, { props: { title: 'Alpha', disabled: true } });

    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.classes()).toContain('is-disabled');

    await wrapper.trigger('click');

    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('defaults tabindex to 0 and accepts an override', () => {
    const defaultWrapper = mount(ChoiceCard, { props: { title: 'Alpha' } });
    expect(defaultWrapper.attributes('tabindex')).toBe('0');

    const rovedOut = mount(ChoiceCard, { props: { title: 'Alpha', tabindex: -1 } });
    expect(rovedOut.attributes('tabindex')).toBe('-1');
  });

  it('activates on Space and on Enter while focused', async () => {
    const wrapper = mount(ChoiceCard, { props: { title: 'Alpha' }, attachTo: document.body });
    wrapper.element.focus();

    await wrapper.trigger('keydown.space');
    expect(wrapper.emitted('select')).toHaveLength(1);

    await wrapper.trigger('keydown.enter');
    expect(wrapper.emitted('select')).toHaveLength(2);

    wrapper.unmount();
  });
});
