import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FormField from '@/FormField.vue';

describe('component FormField', () => {
  it('renders neither a description nor an error id when neither part is present', () => {
    const wrapper = mount(FormField, { props: { inputId: 'name', label: 'Name' } });

    expect(wrapper.find('.sft-field-desc').exists()).toBe(false);
    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });

  it('stamps a description id without an error id when only a description is present', () => {
    const wrapper = mount(FormField, { props: { inputId: 'name', label: 'Name', description: 'Your full name' } });

    expect(wrapper.find('.sft-field-desc').attributes('id')).toBe('name-desc');
    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });

  it('stamps an error id without a description id when only an error is present', () => {
    const wrapper = mount(FormField, { props: { inputId: 'name', label: 'Name', errorMessage: 'Required' } });

    expect(wrapper.find('.sft-field-desc').exists()).toBe(false);
    expect(wrapper.find('.sft-error').attributes('id')).toBe('name-error');
  });

  it('stamps both ids, correctly suffixed, when both parts are present', () => {
    const wrapper = mount(FormField, {
      props: { inputId: 'name', label: 'Name', description: 'Your full name', errorMessage: 'Required' },
    });

    expect(wrapper.find('.sft-field-desc').attributes('id')).toBe('name-desc');
    expect(wrapper.find('.sft-error').attributes('id')).toBe('name-error');
  });

  it('renders the label as a <label for> with a -label id by default', () => {
    const wrapper = mount(FormField, { props: { inputId: 'name', label: 'Name' } });

    const label = wrapper.find('.sft-field-label');
    expect(label.element.tagName).toBe('LABEL');
    expect(label.attributes('for')).toBe('name');
    expect(label.attributes('id')).toBe('name-label');
  });

  it('renders the label as a span without `for` in groupLabel mode, keeping the -label id for aria-labelledby', () => {
    const wrapper = mount(FormField, { props: { inputId: 'contactMethod', label: 'Contact', groupLabel: true } });

    const label = wrapper.find('.sft-field-label');
    expect(label.element.tagName).toBe('SPAN');
    expect(label.attributes('for')).toBeUndefined();
    expect(label.attributes('id')).toBe('contactMethod-label');
  });
});
