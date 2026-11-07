import { describe, expect, it } from 'vitest';
import { checkboxMetadata, fileMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - optional/required tag and error message states', () => {
  it('shows no tag for a required field in the default optional-only mode', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 1 } });

    expect(wrapper.find('.sft-tag-required').exists()).toBe(false);
    expect(wrapper.find('.sft-tag-optional').exists()).toBe(false);
  });

  it('shows the optional tag and no required tag for an optional field', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 0 } });

    expect(wrapper.find('.sft-tag-optional').exists()).toBe(true);
    expect(wrapper.find('.sft-tag-required').exists()).toBe(false);
  });

  it('shows the required tag only in required mode, never the optional one', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textMetadata, minOccurs: 1 },
      settings: { showRequiredOrOptional: 'required' },
    });

    expect(wrapper.find('.sft-tag-required').exists()).toBe(true);
    expect(wrapper.find('.sft-tag-optional').exists()).toBe(false);
  });

  it('shows no error message before validation runs', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 1 } });

    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });

  it('shows sft-error only after validation produces a message', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 1 } });

    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
  });

  it('never shows a success/valid class on a filled, error-free field', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { ...textMetadata, minOccurs: 1 },
      initialValues: { text: 'Jeroen' },
    });

    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(false);
    expect(wrapper.html()).not.toMatch(/is-valid|is-success/);
  });

  it('applies the same states policy to the checkbox chrome', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: { ...checkboxMetadata, minOccurs: 1 } });

    await validate();

    expect(wrapper.find('.sft-switch-field').classes()).toContain('is-invalid');
    expect(wrapper.find('.sft-switch-field .sft-error').exists()).toBe(true);
  });

  it('puts the danger border on the file trigger, not the hidden native input, with exactly one error line below the control', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: { ...fileMetadata, minOccurs: 1 } });

    await validate();

    expect(wrapper.find('.sft-file').classes()).toContain('is-invalid');
    expect(wrapper.find('.sft-file-native').classes()).not.toContain('is-invalid');
    const errors = wrapper.findAll('.sft-error');
    expect(errors).toHaveLength(1);
    expect(errors[0].element.closest('.sft-file')).toBeNull();
  });

  it('never shows a success/valid class on a filled, error-free file field', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { ...fileMetadata, minOccurs: 1 },
      settings: { showValidState: true },
    });

    const native = wrapper.find('input[type="file"]');
    const file = new File(['x'], 'resume.pdf');
    Object.defineProperty(native.element, 'files', { value: [file], configurable: true });
    await native.trigger('change');
    await validate();

    expect(wrapper.find('.sft-error').exists()).toBe(false);
    expect(wrapper.html()).not.toMatch(/is-valid|is-success/);
  });
});
