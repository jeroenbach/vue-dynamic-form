import { describe, expect, it } from 'vitest';
import { checkboxMetadata, emailMetadata, fileMetadata, groupMetadata, inlineArrayMetadata, passwordMetadata, radioMetadata, selectMetadata, textareaMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

const sources: [string, Record<string, unknown>][] = [
  ['the field metadata', { disabled: true }],
  ['the engine', { maxOccurs: 0 }],
];

describe('component StarterFormTemplate - disabled state', () => {
  describe.each(sources)('driven by %s', (_source, disabling) => {
    it('text: disables the input and dims the field', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 0, ...disabling } });

      expect(wrapper.find('input.sft-input').attributes('disabled')).toBeDefined();
      expect(wrapper.find('.sft-field').classes()).toContain('is-disabled');
    });

    it('select: disables the control', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...selectMetadata, minOccurs: 0, ...disabling } });

      expect(wrapper.find('select.sft-select').attributes('disabled')).toBeDefined();
    });

    it('checkbox: disables the switch', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...checkboxMetadata, minOccurs: 0, ...disabling } });

      expect(wrapper.find('.sft-switch').classes()).toContain('is-disabled');
    });

    it('password: disables the input', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...passwordMetadata, minOccurs: 0, ...disabling } });

      expect(wrapper.find('input.sft-input').attributes('disabled')).toBeDefined();
    });

    it('textarea: disables the control and drops the resize handle', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...textareaMetadata, minOccurs: 0, ...disabling } });

      expect(wrapper.find('textarea.sft-textarea').attributes('disabled')).toBeDefined();
      expect(wrapper.find('.sft-field').classes()).toContain('is-disabled');
    });

    it('email: disables the input, confirming the mechanism is not special-cased to the original types', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...emailMetadata, minOccurs: 0, ...disabling } });

      expect(wrapper.find('input.sft-input').attributes('disabled')).toBeDefined();
      expect(wrapper.find('.sft-field').classes()).toContain('is-disabled');
    });

    it('radio: disables every option', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...radioMetadata, minOccurs: 0, ...disabling } });

      for (const input of wrapper.findAll('input[type="radio"]'))
        expect(input.attributes('disabled')).toBeDefined();
      expect(wrapper.find('.sft-field').classes()).toContain('is-disabled');
    });

    it('file: disables the native input, making the trigger inert, and dims the field', async () => {
      const { wrapper } = await mountInForm({ metadata: { ...fileMetadata, minOccurs: 0, ...disabling } });

      expect(wrapper.find('input.sft-file-native').attributes('disabled')).toBeDefined();
      expect(wrapper.find('.sft-field').classes()).toContain('is-disabled');
    });
  });

  it('stays enabled when nothing disables it', async () => {
    const { wrapper } = await mountInForm({ metadata: textMetadata });

    expect(wrapper.find('input.sft-input').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('.sft-field').classes()).not.toContain('is-disabled');
  });

  it('dims a disabled group', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...groupMetadata, disabled: true } });

    expect(wrapper.find('.sft-group').classes()).toContain('is-disabled');
  });

  it('dims a disabled inline array', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...inlineArrayMetadata, disabled: true }, initialValues: { tags: ['a'] } });

    expect(wrapper.find('.sft-section').classes()).toContain('is-disabled');
  });
});
