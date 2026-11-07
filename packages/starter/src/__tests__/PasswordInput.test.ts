import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import PasswordInput from '@/PasswordInput.vue';
import { expectNoAxeViolations } from './helpers/axe';

describe('component PasswordInput', () => {
  it('renders without a data-testid on the input and toggle when none is given', () => {
    const wrapper = mount(PasswordInput);

    expect(wrapper.find('input').attributes('data-testid')).toBeUndefined();
    expect(wrapper.find('button').attributes('data-testid')).toBeUndefined();
  });

  it('renders the input and toggle data-testid derived from the given one', () => {
    const wrapper = mount(PasswordInput, { props: { dataTestid: 'password' } });

    expect(wrapper.attributes('data-testid')).toBe('password');
    expect(wrapper.find('input').attributes('data-testid')).toBe('password-input');
    expect(wrapper.find('button').attributes('data-testid')).toBe('password-toggle');
  });

  it('keeps the reveal button a normal tab stop', () => {
    const wrapper = mount(PasswordInput);

    expect(wrapper.find('button').attributes('tabindex')).toBeUndefined();
  });

  it('toggles the aria-label between show and hide when clicked', async () => {
    const wrapper = mount(PasswordInput);

    expect(wrapper.find('button').attributes('aria-label')).toBe('Show password');

    await wrapper.find('button').trigger('click');

    expect(wrapper.find('button').attributes('aria-label')).toBe('Hide password');
  });

  it('passes an arbitrary aria-describedby attribute through to the input unchanged', () => {
    const wrapper = mount(PasswordInput, { attrs: { 'aria-describedby': 'password-desc password-error' } });

    expect(wrapper.find('input').attributes('aria-describedby')).toBe('password-desc password-error');
  });

  describe('accessibility', () => {
    it('has no violations when labelled, with no error', async () => {
      const Host = defineComponent({
        render: () => h('div', [
          h('label', { for: 'password' }, 'Password'),
          h(PasswordInput, { id: 'password' }),
        ]),
      });
      const wrapper = mount(Host, { attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });

    it('has no violations when labelled, invalid, described by a rendered error, and the reveal button has been toggled', async () => {
      const Host = defineComponent({
        render: () => h('div', [
          h('label', { for: 'password' }, 'Password'),
          h(PasswordInput, { 'id': 'password', 'errorMessage': 'Too short', 'aria-describedby': 'password-error' }),
          h('span', { id: 'password-error', role: 'alert' }, 'Too short'),
        ]),
      });
      const wrapper = mount(Host, { attachTo: document.body });

      await wrapper.find('button').trigger('click');
      expect(wrapper.find('button').attributes('aria-label')).toBe('Hide password');

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
