import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import ErrorMessage from '@/ErrorMessage.vue';
import { expectNoAxeViolations } from './helpers/axe';

describe('component ErrorMessage', () => {
  it('renders nothing when there is no error message', () => {
    const wrapper = mount(ErrorMessage);

    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });

  it('renders the message with a data-testid when one is given', () => {
    const wrapper = mount(ErrorMessage, { props: { errorMessage: 'Required', dataTestid: 'field' } });

    expect(wrapper.text()).toBe('Required');
    expect(wrapper.attributes('data-testid')).toBe('field-error');
  });

  it('renders the message without a data-testid when none is given', () => {
    const wrapper = mount(ErrorMessage, { props: { errorMessage: 'Required' } });

    expect(wrapper.attributes('data-testid')).toBeUndefined();
  });

  it('announces itself as an alert', () => {
    const wrapper = mount(ErrorMessage, { props: { errorMessage: 'Required' } });

    expect(wrapper.find('.sft-error').attributes('role')).toBe('alert');
  });

  it.each([
    [{ id: 'x-error' }, 'x-error'],
    [{}, undefined],
  ] as const)('renders the given id prop %j as %j', (props, expected) => {
    const wrapper = mount(ErrorMessage, { props: { errorMessage: 'Required', ...props } });

    expect(wrapper.find('.sft-error').attributes('id')).toBe(expected);
  });

  describe('accessibility', () => {
    it('has no violations when nothing is rendered', async () => {
      const Host = defineComponent({
        render: () => h('div', [h(ErrorMessage)]),
      });
      const wrapper = mount(Host, { attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });

    it('has no violations when rendered with a message and id', async () => {
      const wrapper = mount(ErrorMessage, { props: { errorMessage: 'Required', id: 'name-error' }, attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
