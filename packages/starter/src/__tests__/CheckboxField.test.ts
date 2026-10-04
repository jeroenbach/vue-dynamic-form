import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CheckboxField from '@/CheckboxField.vue';

describe('component CheckboxField', () => {
  it('emits click when its label is clicked', async () => {
    const wrapper = mount(CheckboxField, { props: { label: 'Subscribe' } });

    await wrapper.find('label').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('renders the description when given', () => {
    const wrapper = mount(CheckboxField, { props: { label: 'Subscribe', description: 'Opt in to updates' } });

    expect(wrapper.find('.sft-switch-field-desc').text()).toBe('Opt in to updates');
  });
});
