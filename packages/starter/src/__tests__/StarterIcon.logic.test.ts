import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import StarterIcon from '@/StarterIcon.vue';
import { mountWithIconOverride } from './test-helpers';

describe('an unregistered icon name fails soft', () => {
  it('renders nothing and warns exactly once in dev mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mount(StarterIcon, { props: { name: 'doesNotExist' as any } });

    expect(wrapper.html()).toBe('');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('an injected icon override replaces the default rendering', () => {
  it('calls the override with exactly { name, size, strokeWidth } and renders its return value', () => {
    const override = vi.fn(({ name }: { name: string, size: number, strokeWidth: number }) =>
      h('svg', { 'data-testid': `custom-${name}` }));

    const wrapper = mountWithIconOverride(override, { name: 'chevronLeft', size: 20, strokeWidth: 3 });

    expect(override).toHaveBeenCalledTimes(1);
    expect(override).toHaveBeenCalledWith({ name: 'chevronLeft', size: 20, strokeWidth: 3 });
    expect(wrapper.find('[data-testid="custom-chevronLeft"]').exists()).toBe(true);
  });

  it('takes priority over the registry even for a registered name', () => {
    const override = vi.fn(() => h('span', { 'data-testid': 'override-rendered' }));

    const wrapper = mountWithIconOverride(override, { name: 'check' });

    expect(wrapper.find('[data-testid="override-rendered"]').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'Check' }).exists()).toBe(false);
  });

  it('renders nothing and does not throw when the override returns null', () => {
    const override = vi.fn(() => null);

    const wrapper = mountWithIconOverride(override, { name: 'chevronLeft' });

    expect(wrapper.html()).toBe('');
  });

  it('renders nothing and does not throw when the override returns undefined', () => {
    const override = vi.fn(() => undefined);

    const wrapper = mountWithIconOverride(override, { name: 'chevronLeft' });

    expect(wrapper.html()).toBe('');
  });

  it('still carries a class passed on StarterIcon, such as the spin animation class', () => {
    const override = vi.fn(() => h('svg', { 'data-testid': 'custom-loader' }));

    const wrapper = mountWithIconOverride(override, { name: 'loader', class: 'sft-spin' } as any);

    expect(wrapper.classes()).toContain('sft-spin');
    expect(wrapper.find('[data-testid="custom-loader"]').exists()).toBe(true);
  });
});
