import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import GroupField from '@/GroupField.vue';

describe('component GroupField', () => {
  it('renders no add or remove button when neither is allowed', () => {
    const wrapper = mount(GroupField, { props: { label: 'Address' } });

    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('emits add when the add button is clicked', async () => {
    const wrapper = mount(GroupField, { props: { label: 'Address', canAddItems: true, dataTestid: 'address' } });

    await wrapper.find('[data-testid="address-add-button"]').trigger('click');

    expect(wrapper.emitted('add')).toHaveLength(1);
  });

  it('emits remove when the remove button is clicked', async () => {
    const wrapper = mount(GroupField, { props: { label: 'Address', canRemoveItems: true, dataTestid: 'address' } });

    await wrapper.find('[data-testid="address-remove-button"]').trigger('click');

    expect(wrapper.emitted('remove')).toHaveLength(1);
  });

  it('omits data-testid attributes on its buttons when no dataTestid prop is given', () => {
    const wrapper = mount(GroupField, { props: { label: 'Address', canAddItems: true, canRemoveItems: true } });

    expect(wrapper.findAll('button').every(button => button.attributes('data-testid') === undefined)).toBe(true);
  });
});
