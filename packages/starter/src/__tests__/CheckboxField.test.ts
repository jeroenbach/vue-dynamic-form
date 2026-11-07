import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import CheckboxField from '@/CheckboxField.vue';
import ToggleSwitch from '@/ToggleSwitch.vue';
import { expectNoAxeViolations } from './helpers/axe';

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

  it('renders no description or error node when neither is given', () => {
    const wrapper = mount(CheckboxField, { props: { label: 'Subscribe' } });

    expect(wrapper.find('.sft-switch-field-desc').exists()).toBe(false);
    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });

  it('renders the description and error as siblings of the clickable label, not inside it', () => {
    const wrapper = mount(CheckboxField, {
      props: { label: 'Accept terms', inputId: 'terms', description: 'Required to continue', errorMessage: 'Accept the terms' },
    });

    const label = wrapper.find('label');
    expect(label.find('.sft-switch-field-desc').exists()).toBe(false);
    expect(label.find('.sft-error').exists()).toBe(false);

    const field = wrapper.find('.sft-switch-field');
    expect(field.find('.sft-switch-field-desc').exists()).toBe(true);
    expect(field.find('.sft-error').exists()).toBe(true);
  });

  it('stamps ids on the moved description and error so they are valid aria-describedby targets', () => {
    const wrapper = mount(CheckboxField, {
      props: { label: 'Accept terms', inputId: 'terms', description: 'Required to continue', errorMessage: 'Accept the terms' },
    });

    expect(wrapper.find('.sft-switch-field-desc').attributes('id')).toBe('terms-desc');
    expect(wrapper.find('.sft-error').attributes('id')).toBe('terms-error');
  });

  it('clicking the error text does not toggle the control', async () => {
    const wrapper = mount(CheckboxField, {
      props: { label: 'Accept terms', inputId: 'terms', errorMessage: 'Accept the terms' },
    });

    await wrapper.find('.sft-error').trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  describe('accessibility', () => {
    it('has no violations when labelled, with a description, and no error', async () => {
      const wrapper = mount(CheckboxField, {
        props: { label: 'Subscribe', inputId: 'subscribe', description: 'Opt in to updates' },
        slots: {
          default: () => h(ToggleSwitch, {
            label: 'Subscribe',
            ariaDescribedby: 'subscribe-desc',
          }),
        },
        attachTo: document.body,
      });

      await expectNoAxeViolations(wrapper.element);
    });

    it('has no violations when labelled, with a description and error as siblings of the label', async () => {
      const wrapper = mount(CheckboxField, {
        props: { label: 'Accept terms', inputId: 'terms', description: 'Required to continue', errorMessage: 'Accept the terms' },
        slots: {
          default: () => h(ToggleSwitch, {
            label: 'Accept terms',
            ariaInvalid: true,
            ariaDescribedby: 'terms-desc terms-error',
          }),
        },
        attachTo: document.body,
      });

      await expectNoAxeViolations(wrapper.element);
    });
  });
});
