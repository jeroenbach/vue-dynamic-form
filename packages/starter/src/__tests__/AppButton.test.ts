import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppButton from '@/AppButton.vue';

const variants = ['default', 'primary', 'danger', 'danger-light', 'ghost'] as const;

describe('component AppButton', () => {
  it.each(variants)('renders the %s variant class', (variant) => {
    const wrapper = mount(AppButton, { props: { variant } });

    expect(wrapper.classes()).toContain('sft-btn');
    expect(wrapper.classes()).toContain(`sft-btn-${variant}`);
  });

  it('defaults to the default variant', () => {
    const wrapper = mount(AppButton);

    expect(wrapper.classes()).toContain('sft-btn-default');
  });

  it('renders the label prop when no slot content is given', () => {
    const wrapper = mount(AppButton, { props: { label: 'Add item' } });

    expect(wrapper.text()).toBe('Add item');
  });

  it('prefers slot content over the label prop', () => {
    const wrapper = mount(AppButton, { props: { label: 'Add item' }, slots: { default: 'Custom content' } });

    expect(wrapper.text()).toBe('Custom content');
  });

  it('forwards the dataTestid prop as a data-testid attribute', () => {
    const wrapper = mount(AppButton, { props: { dataTestid: 'my-button' } });

    expect(wrapper.attributes('data-testid')).toBe('my-button');
  });

  it('forwards the disabled attribute', () => {
    const wrapper = mount(AppButton, { attrs: { disabled: true } });

    expect(wrapper.attributes('disabled')).toBeDefined();
  });

  it('forwards a click listener passed through attrs', async () => {
    let clicked = false;
    const onClick = () => {
      clicked = true;
    };
    const wrapper = mount(AppButton, { attrs: { onClick } });

    await wrapper.trigger('click');

    expect(clicked).toBe(true);
  });
});
