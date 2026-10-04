import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PasswordInput from '@/PasswordInput.vue';

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
});
