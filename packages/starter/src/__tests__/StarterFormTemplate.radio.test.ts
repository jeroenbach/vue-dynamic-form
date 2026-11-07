import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { radioMetadata, selectMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - radio field', () => {
  it('compiles and renders with no extendMetadata step, reusing the root options property', async () => {
    const { wrapper } = await mountInForm({ metadata: radioMetadata });

    const field = wrapper.find('.sft-field');
    expect(field.exists()).toBe(true);
    expect(field.find('label').text()).toContain('How should we contact you?');

    const group = field.find('.sft-radio-group');
    expect(group.exists()).toBe(true);
    expect(group.findAll('.sft-radio-option')).toHaveLength(2);
  });

  it('renders an empty group with no option rows, given zero options, rather than throwing', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...radioMetadata, options: [] } });

    expect(wrapper.find('.sft-radio-group').exists()).toBe(true);
    expect(wrapper.findAll('.sft-radio-option')).toHaveLength(0);
  });

  it('reuses the identical options array unreshaped between a select and a radio field', async () => {
    const sharedOptions = [{ key: 'software', value: 'Software' }, { key: 'healthcare', value: 'Healthcare' }];
    const { wrapper } = await mountInForm({
      metadata: {
        name: 'root',
        children: [
          { ...selectMetadata, options: sharedOptions },
          { ...radioMetadata, name: 'industryRadio', options: sharedOptions },
        ],
      },
    });

    const selectOptions = wrapper.find('select.sft-select').findAll('option').slice(1).map(o => [o.element.value, o.text()]);
    const radioLabels = wrapper.findAll('.sft-radio-option').map(row => row.find('.sft-radio-label').text());
    expect(selectOptions).toEqual([['software', 'Software'], ['healthcare', 'Healthcare']]);
    expect(radioLabels).toEqual(['Software', 'Healthcare']);
  });

  it('shows exactly one error line below the whole group, never per option', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...radioMetadata, minOccurs: 1 },
      settings: { validateOnValueUpdate: false, validateOnBlur: true },
    });

    await wrapper.find('input[type="radio"]').trigger('blur');
    await flushPromises();

    const errors = wrapper.findAll('.sft-error');
    expect(errors).toHaveLength(1);
    expect(errors[0].element.closest('.sft-radio-option')).toBeNull();
  });

  it('never carries data-field-state or is-valid, even when showValidState is on and the field is touched and valid', async () => {
    const { wrapper } = await mountInForm({
      metadata: radioMetadata,
      initialValues: { contactMethod: 'email' },
      settings: { showValidState: true },
    });
    await flushPromises();

    const group = wrapper.find('.sft-radio-group');
    expect(group.attributes('data-field-state')).toBeUndefined();
    expect(group.classes()).not.toContain('is-valid');
  });
});
