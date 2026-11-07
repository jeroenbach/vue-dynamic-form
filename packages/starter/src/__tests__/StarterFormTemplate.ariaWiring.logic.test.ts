import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { checkboxMetadata, fileMetadata, numberMetadata, passwordMetadata, radioMetadata, selectMetadata, textareaMetadata, textMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

const matrix = [
  { hasDescription: false, hasError: false, expected: undefined },
  { hasDescription: true, hasError: false, expected: '<path>-desc' },
  { hasDescription: false, hasError: true, expected: '<path>-error' },
  { hasDescription: true, hasError: true, expected: '<path>-desc <path>-error' },
] as const;

describe('component StarterFormTemplate - aria-describedby composition for text/select/password/textarea/radio/file', () => {
  it.each(matrix)('text field: %j', async ({ hasDescription, hasError, expected }) => {
    const metadata = {
      ...textMetadata,
      ...(hasDescription ? { description: 'Help text' } : {}),
      ...(hasError ? { minOccurs: 1 } : {}),
    };
    const { wrapper, validate } = await mountInForm({ metadata });
    if (hasError) {
      await validate();
      await flushPromises();
    }

    const input = wrapper.find('input.sft-input');
    expect(input.attributes('aria-describedby')).toBe(expected?.replace(/<path>/g, 'text'));
    if (hasError)
      expect(input.attributes('aria-invalid')).toBe('true');
  });

  it.each(matrix)('select field: %j', async ({ hasDescription, hasError, expected }) => {
    const metadata = {
      ...selectMetadata,
      ...(hasDescription ? { description: 'Help text' } : {}),
      ...(hasError ? { minOccurs: 1 } : {}),
    };
    const { wrapper, validate } = await mountInForm({ metadata });
    if (hasError) {
      await validate();
      await flushPromises();
    }

    const select = wrapper.find('select');
    expect(select.attributes('aria-describedby')).toBe(expected?.replace(/<path>/g, 'select'));
    if (hasError)
      expect(select.attributes('aria-invalid')).toBe('true');
  });

  it.each(matrix)('password field: %j', async ({ hasDescription, hasError, expected }) => {
    const metadata = {
      ...passwordMetadata,
      ...(hasDescription ? { description: 'Help text' } : {}),
      ...(hasError ? { minOccurs: 1 } : {}),
    };
    const { wrapper, validate } = await mountInForm({ metadata });
    if (hasError) {
      await validate();
      await flushPromises();
    }

    const input = wrapper.find('input.sft-input');
    expect(input.attributes('aria-describedby')).toBe(expected?.replace(/<path>/g, 'password'));
    if (hasError)
      expect(input.attributes('aria-invalid')).toBe('true');
  });

  it.each(matrix)('textarea field: %j', async ({ hasDescription, hasError, expected }) => {
    const metadata = {
      ...textareaMetadata,
      ...(hasDescription ? { description: 'Help text' } : {}),
      ...(hasError ? { minOccurs: 1 } : {}),
    };
    const { wrapper, validate } = await mountInForm({ metadata });
    if (hasError) {
      await validate();
      await flushPromises();
    }

    const textarea = wrapper.find('textarea.sft-textarea');
    expect(textarea.attributes('aria-describedby')).toBe(expected?.replace(/<path>/g, 'bio'));
    if (hasError)
      expect(textarea.attributes('aria-invalid')).toBe('true');
  });

  it.each(matrix)('radio field (attributes land on the radiogroup): %j', async ({ hasDescription, hasError, expected }) => {
    const metadata = {
      ...radioMetadata,
      ...(hasDescription ? { description: 'Help text' } : {}),
      ...(hasError ? { minOccurs: 1 } : {}),
    };
    const { wrapper, validate } = await mountInForm({ metadata });
    if (hasError) {
      await validate();
      await flushPromises();
    }

    const group = wrapper.find('.sft-radio-group');
    expect(group.attributes('aria-describedby')).toBe(expected?.replace(/<path>/g, 'contactMethod'));
    if (hasError)
      expect(group.attributes('aria-invalid')).toBe('true');
  });

  it.each(matrix)('file field (attributes land on the native input): %j', async ({ hasDescription, hasError, expected }) => {
    const metadata = {
      ...fileMetadata,
      ...(hasDescription ? { description: 'Help text' } : {}),
      ...(hasError ? { minOccurs: 1 } : {}),
    };
    const { wrapper, validate } = await mountInForm({ metadata });
    if (hasError) {
      await validate();
      await flushPromises();
    }

    const native = wrapper.find('.sft-file-native');
    expect(native.attributes('aria-describedby')).toBe(expected?.replace(/<path>/g, 'resume'));
    if (hasError)
      expect(native.attributes('aria-invalid')).toBe('true');
  });

  it('wires an HTML5 text mode (number) through the same composed chain as a plain text field', async () => {
    const metadata = { ...numberMetadata, description: 'Help text', minOccurs: 1 };
    const { wrapper, validate } = await mountInForm({ metadata });

    await validate();
    await flushPromises();

    const input = wrapper.find('input.sft-input');
    expect(input.attributes('type')).toBe('number');
    expect(input.attributes('aria-describedby')).toBe('age-desc age-error');
  });

  it('names the file field through aria-labelledby on the native input, so its accessible name is the field label, not the trigger text', async () => {
    const { wrapper } = await mountInForm({ metadata: fileMetadata });

    const native = wrapper.find('.sft-file-native');
    expect(native.attributes('aria-labelledby')).toBe('resume-label');

    const label = wrapper.find('#resume-label');
    expect(label.text()).toContain('Resume');
    // The field label must not also be a `label for` of the native input: the input already
    // has the trigger label wrapping it, and two label elements on one control is a WCAG failure.
    expect(label.element.tagName).not.toBe('LABEL');
  });

  it('wires the composed aria-describedby on the suffixed TextInput branch too', async () => {
    const metadata = { ...textMetadata, suffix: 'min', description: 'Help text', minOccurs: 1 };
    const { wrapper, validate } = await mountInForm({ metadata });

    await validate();
    await flushPromises();

    const row = wrapper.find('.sft-input-suffix-row');
    expect(row.exists()).toBe(true);
    expect(row.find('input.sft-input').attributes('aria-describedby')).toBe('text-desc text-error');
  });

  it('drops the -error token and id once the field becomes valid again', async () => {
    const { wrapper, validate } = await mountInForm({ metadata: { ...textMetadata, minOccurs: 1 } });

    await validate();
    await flushPromises();
    expect(wrapper.find('input.sft-input').attributes('aria-describedby')).toBe('text-error');
    expect(wrapper.find('.sft-error').attributes('id')).toBe('text-error');

    await wrapper.find('input.sft-input').setValue('Jordan');
    await validate();
    await flushPromises();

    expect(wrapper.find('input.sft-input').attributes('aria-describedby')).toBeUndefined();
    expect(wrapper.find('.sft-error').exists()).toBe(false);
  });
});

describe('component StarterFormTemplate - aria-invalid/aria-describedby on the checkbox switch', () => {
  it('renders neither attribute on a valid checkbox field', async () => {
    const { wrapper } = await mountInForm({ metadata: checkboxMetadata });

    const switchEl = wrapper.find('.sft-switch');
    expect(switchEl.attributes('aria-invalid')).toBeUndefined();
    expect(switchEl.attributes('aria-describedby')).toBeUndefined();
  });

  it('composes the same aria-describedby convention as the text inputs when errored', async () => {
    const { wrapper, validate } = await mountInForm({
      metadata: { ...checkboxMetadata, minOccurs: 1, description: 'Help text' },
    });

    await validate();
    await flushPromises();

    const switchEl = wrapper.find('.sft-switch');
    expect(switchEl.attributes('aria-invalid')).toBe('true');
    expect(switchEl.attributes('aria-describedby')).toBe('subscribe-desc subscribe-error');
  });
});
