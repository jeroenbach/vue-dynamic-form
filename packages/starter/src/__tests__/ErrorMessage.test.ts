import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ErrorMessage from '@/ErrorMessage.vue';

describe('component ErrorMessage', () => {
  it('renders nothing when there is no error message', () => {
    const wrapper = mount(ErrorMessage);

    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });

  it('renders the message with a data-testid when one is given', () => {
    const wrapper = mount(ErrorMessage, { props: { errorMessage: 'Required', dataTestid: 'field' } });

    expect(wrapper.text()).toBe('Required');
    expect(wrapper.attributes('data-testid')).toBe('field-error');
  });

  it('renders the message without a data-testid when none is given', () => {
    const wrapper = mount(ErrorMessage, { props: { errorMessage: 'Required' } });

    expect(wrapper.attributes('data-testid')).toBeUndefined();
  });
});
