import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import StarterIcon from '@/StarterIcon.vue';

describe('starterIcon default rendering', () => {
  it('renders the registered lucide glyph with the documented defaults', () => {
    const wrapper = mount(StarterIcon, { props: { name: 'chevronLeft' } });

    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('width')).toBe('16');
    expect(svg.attributes('height')).toBe('16');
    expect(svg.attributes('stroke-width')).toBe('2');
    expect(svg.attributes('stroke')).toBe('currentColor');
    expect(svg.attributes('aria-hidden')).toBe('true');
  });

  it('does not warn when no override is present and the name is registered', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount(StarterIcon, { props: { name: 'check' } });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('passes overridden size and strokeWidth through instead of the defaults', () => {
    const wrapper = mount(StarterIcon, { props: { name: 'chevronLeft', size: 24, strokeWidth: 1 } });

    const svg = wrapper.find('svg');
    expect(svg.attributes('width')).toBe('24');
    expect(svg.attributes('height')).toBe('24');
    expect(svg.attributes('stroke-width')).toBe('1');
  });
});
