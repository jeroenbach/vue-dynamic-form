import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ArrayField from '@/ArrayField.vue';

describe('component ArrayField', () => {
  it('omits the add button data-testid when no dataTestid prop is given, and still emits add on click', async () => {
    const wrapper = mount(ArrayField, { props: { label: 'Tags', canAddItems: true } });

    const button = wrapper.find('button');
    expect(button.attributes('data-testid')).toBeUndefined();

    await button.trigger('click');

    expect(wrapper.emitted('add')).toHaveLength(1);
  });

  it('renders no add button when canAddItems is false', () => {
    const wrapper = mount(ArrayField, { props: { label: 'Tags', canAddItems: false } });

    expect(wrapper.find('button').exists()).toBe(false);
  });
});
