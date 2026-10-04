import { describe, expect, it } from 'vitest';
import { checkboxMetadata, textMetadata } from './fixtures/metadata';
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
});
