import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import StarterIcon from '@/StarterIcon.vue';
import { passwordMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - password field with the strength bar and eye toggle', () => {
  it('renders the password control masked by default, with the show/hide toggle routed through StarterIcon', async () => {
    const { wrapper } = await mountInForm({ metadata: passwordMetadata });

    const input = wrapper.find('input.sft-input');
    expect(input.attributes('type')).toBe('password');

    const icon = wrapper.findComponent(StarterIcon);
    expect(icon.props('name')).toBe('eye');

    await wrapper.find('.sft-password-toggle').trigger('click');

    expect(wrapper.find('input.sft-input').attributes('type')).toBe('text');
    expect(wrapper.findComponent(StarterIcon).props('name')).toBe('eyeOff');
  });

  it.each([
    ['', 'empty'],
    ['abc', 'weak'],
    ['abcdefgh', 'weak'],
    ['Abcdefgh', 'fair'],
    ['Abcdefg1', 'good'],
    ['Abcdefg1!', 'strong'],
  ] as const)('shows the %s tier for %j', async (password, tier) => {
    const { wrapper } = await mountInForm({ metadata: passwordMetadata, initialValues: { password } });

    if (tier === 'empty') {
      expect(wrapper.find('.sft-strength').exists()).toBe(false);
      return;
    }

    const strength = wrapper.find('.sft-strength');
    expect(strength.exists()).toBe(true);
    expect(strength.findAll(`.sft-strength-seg.is-on-${tier}`).length).toBeGreaterThan(0);
    expect(strength.find(`.sft-strength-label.is-${tier}`).exists()).toBe(true);
  });

  it('shows no strength bar when showStrengthBar is omitted', async () => {
    const { wrapper } = await mountInForm({
      metadata: { name: 'password', type: 'password', fieldOptions: { label: 'Password' } },
      initialValues: { password: 'Abcdefg1!' },
    });

    expect(wrapper.find('.sft-strength').exists()).toBe(false);
  });

  it('shows no strength bar when showStrengthBar is false', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...passwordMetadata, showStrengthBar: false },
      initialValues: { password: 'Abcdefg1!' },
    });

    expect(wrapper.find('.sft-strength').exists()).toBe(false);
  });

  it('typing into the field updates the bound value and the strength tier reacts live', async () => {
    const { wrapper, values } = await mountInForm({ metadata: passwordMetadata });

    const input = wrapper.find('input.sft-input');

    await input.setValue('abc');
    expect(values().password).toBe('abc');
    expect(wrapper.find('.sft-strength-label.is-weak').exists()).toBe(true);

    await input.setValue('Abcdefg1!');
    expect(values().password).toBe('Abcdefg1!');
    expect(wrapper.find('.sft-strength-label.is-strong').exists()).toBe(true);
    expect(wrapper.find('.sft-strength-label.is-weak').exists()).toBe(false);
  });

  it('blurring an empty required field triggers validation and shows the error', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...passwordMetadata, minOccurs: 1 },
      settings: { validateOnValueUpdate: false, validateOnBlur: true },
    });

    expect(wrapper.find('.sft-error').exists()).toBe(false);

    await wrapper.find('input.sft-input').trigger('blur');
    await flushPromises();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
  });
});
