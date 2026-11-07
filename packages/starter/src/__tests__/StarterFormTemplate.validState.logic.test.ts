import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { textareaMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - opt-in valid-state border', () => {
  it('sets no data-field-state when showValidState is off', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 1 } });

    const input = wrapper.find('input.sft-input');
    await input.trigger('blur');
    await flushPromises();

    expect(input.attributes('data-field-state')).toBeUndefined();
    expect(input.classes()).not.toContain('is-valid');
  });

  it('marks an untouched field pristine when showValidState is on', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textMetadata, minOccurs: 1 },
      settings: { showValidState: true },
    });

    expect(wrapper.find('input.sft-input').attributes('data-field-state')).toBe('pristine');
  });

  it('marks a touched, empty required field invalid, with no is-valid class', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textMetadata, minOccurs: 1 },
      settings: { showValidState: true, validateOnValueUpdate: false, validateOnBlur: true },
    });

    await wrapper.find('input.sft-input').trigger('blur');
    await flushPromises();

    const input = wrapper.find('input.sft-input');
    expect(input.attributes('data-field-state')).toBe('invalid');
    expect(input.classes()).not.toContain('is-valid');
  });

  it('marks a touched, valid field valid, with the is-valid class', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textMetadata, minOccurs: 1 },
      settings: { showValidState: true, validateOnValueUpdate: false, validateOnBlur: true },
    });

    const input = wrapper.find('input.sft-input');
    await input.setValue('Jordan');
    await input.trigger('blur');
    await flushPromises();

    expect(wrapper.find('input.sft-input').attributes('data-field-state')).toBe('valid');
    expect(wrapper.find('input.sft-input').classes()).toContain('is-valid');
  });

  it('textarea: sets no data-field-state when showValidState is off', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textareaMetadata, minOccurs: 1 } });

    const textarea = wrapper.find('textarea.sft-textarea');
    await textarea.trigger('blur');
    await flushPromises();

    expect(textarea.attributes('data-field-state')).toBeUndefined();
    expect(textarea.classes()).not.toContain('is-valid');
  });

  it('textarea: marks an untouched field pristine when showValidState is on', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textareaMetadata, minOccurs: 1 },
      settings: { showValidState: true },
    });

    expect(wrapper.find('textarea.sft-textarea').attributes('data-field-state')).toBe('pristine');
  });

  it('textarea: marks a touched, empty required field invalid, with no is-valid class', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textareaMetadata, minOccurs: 1 },
      settings: { showValidState: true, validateOnValueUpdate: false, validateOnBlur: true },
    });

    await wrapper.find('textarea.sft-textarea').trigger('blur');
    await flushPromises();

    const textarea = wrapper.find('textarea.sft-textarea');
    expect(textarea.attributes('data-field-state')).toBe('invalid');
    expect(textarea.classes()).not.toContain('is-valid');
  });

  it('textarea: marks a touched, valid field valid, with the is-valid class', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textareaMetadata, minOccurs: 1 },
      settings: { showValidState: true, validateOnValueUpdate: false, validateOnBlur: true },
    });

    const textarea = wrapper.find('textarea.sft-textarea');
    await textarea.setValue('A few sentences about why this role is a fit.');
    await textarea.trigger('blur');
    await flushPromises();

    expect(wrapper.find('textarea.sft-textarea').attributes('data-field-state')).toBe('valid');
    expect(wrapper.find('textarea.sft-textarea').classes()).toContain('is-valid');
  });
});

describe('component StarterFormTemplate - native input type passthrough', () => {
  it('falls back to a text input for the built-in text type', async () => {
    const { wrapper } = await mountInForm({ metadata: textMetadata });

    expect(wrapper.find('input.sft-input').attributes('type')).toBe('text');
  });

  it('passes a custom leaf type through to the native input type attribute', async () => {
    const { wrapper } = await mountInForm({
      metadata: { name: 'email', type: 'email', fieldOptions: { label: 'Email' } },
    });

    expect(wrapper.find('input.sft-input').attributes('type')).toBe('email');
  });

  it('keeps a native number input\'s model a string, never the coerced JS number', async () => {
    const { wrapper, values } = await mountInForm({
      metadata: { name: 'age', type: 'number', fieldOptions: { label: 'Age' } },
    });

    await wrapper.find('input.sft-input').setValue('42');

    expect(values().age).toBe('42');
    expect(typeof values().age).toBe('string');
  });
});

describe('component StarterFormTemplate - input suffix', () => {
  it('renders no suffix row when fieldMetadata.suffix is unset', async () => {
    const { wrapper } = await mountInForm({ metadata: textMetadata });

    expect(wrapper.find('.sft-input-suffix-row').exists()).toBe(false);
  });

  it('wraps the input with the suffix label when fieldMetadata.suffix is set', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textMetadata, suffix: 'min' } });

    const row = wrapper.find('.sft-input-suffix-row');
    expect(row.exists()).toBe(true);
    expect(row.find('.sft-input-suffix').text()).toBe('min');
    expect(row.find('input.sft-input').exists()).toBe(true);
  });
});
