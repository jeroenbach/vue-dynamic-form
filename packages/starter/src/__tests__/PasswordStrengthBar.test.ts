import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PasswordStrengthBar from '@/PasswordStrengthBar.vue';
import { expectNoAxeViolations } from './helpers/axe';

describe('component PasswordStrengthBar', () => {
  describe('decorative bar', () => {
    it('marks the visual bar aria-hidden', () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: 'Abcdefg1!' } });

      expect(wrapper.find('.sft-strength').attributes('aria-hidden')).toBe('true');
    });

    it.each([
      ['abc', 'weak'],
      ['abcdefgh', 'weak'],
      ['Abcdefgh', 'fair'],
      ['Abcdefg1', 'good'],
      ['Abcdefg1!', 'strong'],
    ] as const)('keeps the %s tier classes and segments for %j unchanged', (password, tier) => {
      const wrapper = mount(PasswordStrengthBar, { props: { password } });

      const strength = wrapper.find('.sft-strength');
      expect(strength.exists()).toBe(true);
      expect(strength.findAll(`.sft-strength-seg.is-on-${tier}`).length).toBeGreaterThan(0);
      expect(strength.find(`.sft-strength-label.is-${tier}`).exists()).toBe(true);
    });

    it('does not render the visual bar for an empty password', () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: '' } });

      expect(wrapper.find('.sft-strength').exists()).toBe(false);
    });
  });

  describe('live region', () => {
    it('renders unconditionally, even for an empty password', () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: '' } });

      expect(wrapper.find('.sft-sr-only').exists()).toBe(true);
    });

    it('is a sibling of the visual bar, not nested inside it', () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: 'Abcdefg1!' } });

      const strength = wrapper.find('.sft-strength');
      expect(strength.find('.sft-sr-only').exists()).toBe(false);
      expect(wrapper.find('.sft-sr-only').exists()).toBe(true);
    });

    it('carries aria-live="polite"', () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: 'Abcdefg1!' } });

      expect(wrapper.find('.sft-sr-only').attributes('aria-live')).toBe('polite');
    });

    it.each([
      ['abc', 'Weak'],
      ['abcdefgh', 'Weak'],
      ['Abcdefgh', 'Fair'],
      ['Abcdefg1', 'Good'],
      ['Abcdefg1!', 'Strong'],
    ] as const)('mirrors the %s tier label into the live region text at mount', (password, label) => {
      const wrapper = mount(PasswordStrengthBar, { props: { password } });

      expect(wrapper.find('.sft-sr-only').text()).toBe(`Password strength: ${label}`);
    });

    it('is empty at mount for an empty password, not "Password strength: "', () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: '' } });

      expect(wrapper.find('.sft-sr-only').text()).toBe('');
    });

    it('does not update while the password prop changes, only once announce() is called', async () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: 'abc' } });

      expect(wrapper.find('.sft-sr-only').text()).toBe('Password strength: Weak');

      await wrapper.setProps({ password: 'Abcdefg1!' });
      expect(wrapper.find('.sft-sr-only').text()).toBe('Password strength: Weak');

      (wrapper.vm as unknown as { announce: () => void }).announce();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.sft-sr-only').text()).toBe('Password strength: Strong');
    });

    it('announces an empty string once announce() runs against a cleared password', async () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: 'Abcdefg1!' } });

      expect(wrapper.find('.sft-sr-only').text()).toBe('Password strength: Strong');

      await wrapper.setProps({ password: '' });
      (wrapper.vm as unknown as { announce: () => void }).announce();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.sft-sr-only').text()).toBe('');
    });
  });

  describe('accessibility', () => {
    it('has no violations for the decorative bar plus live region', async () => {
      const wrapper = mount(PasswordStrengthBar, { props: { password: 'Abcdefg1!' }, attachTo: document.body });

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
