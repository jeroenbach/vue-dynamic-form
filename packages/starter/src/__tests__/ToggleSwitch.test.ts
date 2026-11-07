import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import ToggleSwitch from '@/ToggleSwitch.vue';
import { expectNoAxeViolations } from './helpers/axe';

describe('component ToggleSwitch', () => {
  it('renders neither aria-invalid nor aria-describedby by default', () => {
    const wrapper = mount(ToggleSwitch);

    expect(wrapper.find('.sft-switch').attributes('aria-invalid')).toBeUndefined();
    expect(wrapper.find('.sft-switch').attributes('aria-describedby')).toBeUndefined();
  });

  it('renders aria-invalid="true" when ariaInvalid is set', () => {
    const wrapper = mount(ToggleSwitch, { props: { ariaInvalid: true } });

    expect(wrapper.find('.sft-switch').attributes('aria-invalid')).toBe('true');
  });

  it('renders the given aria-describedby verbatim', () => {
    const wrapper = mount(ToggleSwitch, { props: { ariaDescribedby: 'subscribe-desc subscribe-error' } });

    expect(wrapper.find('.sft-switch').attributes('aria-describedby')).toBe('subscribe-desc subscribe-error');
  });

  describe('accessibility', () => {
    it('has no violations when labelled, with no error', async () => {
      const wrapper = mount(ToggleSwitch, { props: { label: 'Subscribe' }, attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });

    it('has no violations when invalid and described by a rendered error', async () => {
      const Host = defineComponent({
        render: () => h('div', [
          h(ToggleSwitch, { label: 'Subscribe', ariaInvalid: true, ariaDescribedby: 'subscribe-error' }),
          h('span', { id: 'subscribe-error', role: 'alert' }, 'Required'),
        ]),
      });
      const wrapper = mount(Host, { attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
