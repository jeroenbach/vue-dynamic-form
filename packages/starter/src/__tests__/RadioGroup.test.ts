import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import RadioGroup from '@/RadioGroup.vue';

const options = [{ key: 'email', value: 'Email' }, { key: 'phone', value: 'Phone' }];

describe('component RadioGroup', () => {
  it('renders role=radiogroup with one label.sft-radio-option per option, matching the prototype markup', () => {
    const wrapper = mount(RadioGroup, { props: { options } });

    const group = wrapper.find('.sft-radio-group');
    expect(group.attributes('role')).toBe('radiogroup');

    const rows = wrapper.findAll('label.sft-radio-option');
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.find('input.sft-radio-input[type="radio"]').exists()).toBe(true);
      expect(row.find('span.sft-radio-control > span.sft-radio-dot').exists()).toBe(true);
      expect(row.find('span.sft-radio-label').exists()).toBe(true);
    }
    expect(rows[0].find('.sft-radio-label').text()).toBe('Email');
    expect(rows[1].find('.sft-radio-label').text()).toBe('Phone');
  });

  it('renders an empty group with no option rows and no error, given zero options', () => {
    const wrapper = mount(RadioGroup, { props: { options: [] } });

    expect(wrapper.find('.sft-radio-group').exists()).toBe(true);
    expect(wrapper.findAll('.sft-radio-option')).toHaveLength(0);
  });

  it('shares one name across every option and gives only the first option a native id', () => {
    const wrapper = mount(RadioGroup, { props: { id: 'contactMethod', options } });

    const inputs = wrapper.findAll('input[type="radio"]');
    for (const input of inputs)
      expect(input.attributes('name')).toBe('contactMethod');

    expect(inputs[0].attributes('id')).toBe('contactMethod');
    expect(inputs[1].attributes('id')).toBeUndefined();
  });

  it('derives the checked option from the value prop, never from local state', async () => {
    const wrapper = mount(RadioGroup, { props: { options, value: 'phone' } });

    const rows = wrapper.findAll('label.sft-radio-option');
    expect((rows[1].find('input').element as HTMLInputElement).checked).toBe(true);
    expect(rows[1].classes()).toContain('is-selected');
    expect((rows[0].find('input').element as HTMLInputElement).checked).toBe(false);
    expect(rows[0].classes()).not.toContain('is-selected');

    await wrapper.setProps({ value: 'email' });

    expect((wrapper.findAll('label.sft-radio-option')[0].find('input').element as HTMLInputElement).checked).toBe(true);
    expect((wrapper.findAll('label.sft-radio-option')[1].find('input').element as HTMLInputElement).checked).toBe(false);
  });

  it('emits change with the chosen option key, and blur on the native input', async () => {
    const wrapper = mount(RadioGroup, { props: { options } });

    await wrapper.findAll('input')[1].setValue();
    expect(wrapper.emitted('change')?.[0]).toEqual(['phone']);

    await wrapper.findAll('input')[0].trigger('blur');
    expect(wrapper.emitted('blur')).toHaveLength(1);
  });

  it('carries is-invalid and aria-invalid when an error message is set', () => {
    const wrapper = mount(RadioGroup, { props: { options, errorMessage: 'Choose one' } });

    expect(wrapper.find('.sft-radio-group').classes()).toContain('is-invalid');
    expect(wrapper.find('.sft-radio-group').attributes('aria-invalid')).toBe('true');
  });

  it('disables every native input and dims every option when disabled', () => {
    const wrapper = mount(RadioGroup, { props: { options, disabled: true } });

    for (const input of wrapper.findAll('input[type="radio"]'))
      expect(input.attributes('disabled')).toBeDefined();
    for (const row of wrapper.findAll('.sft-radio-option'))
      expect(row.classes()).toContain('is-disabled');
  });

  it('carries the given data-testid', () => {
    const wrapper = mount(RadioGroup, { props: { options, dataTestid: 'contactMethod-input' } });

    expect(wrapper.find('.sft-radio-group').attributes('data-testid')).toBe('contactMethod-input');
  });
});
