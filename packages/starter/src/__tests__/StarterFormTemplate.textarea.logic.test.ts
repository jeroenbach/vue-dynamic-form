import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { textareaMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - textarea field', () => {
  it('renders through a native textarea.sft-textarea wrapped in the usual field chrome', async () => {
    const { wrapper } = await mountInForm({ metadata: textareaMetadata });

    const field = wrapper.find('.sft-field');
    expect(field.exists()).toBe(true);
    expect(field.find('label').text()).toContain('Bio');
    expect(field.find('textarea.sft-textarea').exists()).toBe(true);
  });

  it('displays the model value with no local copy to go stale, and types update the model', async () => {
    const { wrapper, values } = await mountInForm({ metadata: textareaMetadata, initialValues: { bio: 'hello' } });

    const textarea = wrapper.find('textarea.sft-textarea').element as HTMLTextAreaElement;
    expect(textarea.value).toBe('hello');

    await wrapper.find('textarea.sft-textarea').setValue('updated bio');
    expect(values().bio).toBe('updated bio');
    expect(textarea.value).toBe('updated bio');
  });

  it('forwards the placeholder attribute exactly like the text input does', async () => {
    const { wrapper } = await mountInForm({ metadata: { ...textareaMetadata, placeholder: 'Share a few sentences' } });

    expect(wrapper.find('textarea.sft-textarea').attributes('placeholder')).toBe('Share a few sentences');
  });

  it('blurring an empty required field triggers validation and shows the error', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...textareaMetadata, minOccurs: 1 },
      settings: { validateOnValueUpdate: false, validateOnBlur: true },
    });

    expect(wrapper.find('.sft-error').exists()).toBe(false);

    await wrapper.find('textarea.sft-textarea').trigger('blur');
    await flushPromises();

    expect(wrapper.find('.sft-error').exists()).toBe(true);
    expect(wrapper.find('textarea.sft-textarea').classes()).toContain('is-invalid');
  });

  it('replaces only the textarea control when #textarea-input is overridden, keeping the chrome around it', async () => {
    const customInput = vi.fn((scope: any) => h('div', { 'data-testid': 'custom-textarea' }, scope.fieldMetadata.name));
    const { wrapper } = await mountInForm({
      metadata: textareaMetadata,
      template: createConsumerWrapper({ overrides: { 'textarea-input': customInput } }),
    });

    expect(wrapper.find('[data-testid="custom-textarea"]').exists()).toBe(true);
    expect(wrapper.find('textarea.sft-textarea').exists()).toBe(false);
    expect(wrapper.find('.sft-field').exists()).toBe(true);
  });
});
