import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createConsumerWrapper } from './fixtures/createConsumerWrapper';
import { fileMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - file field', () => {
  it('compiles and renders with no extendMetadata step, into the file-input slot', async () => {
    const { wrapper } = await mountInForm({ metadata: fileMetadata });

    const field = wrapper.find('.sft-field');
    expect(field.exists()).toBe(true);
    expect(field.find('label.sft-field-label').text()).toContain('Resume');
    expect(field.find('.sft-file').exists()).toBe(true);
    expect(field.find('.sft-file-native[type="file"]').exists()).toBe(true);
  });

  it('forwards file.accept verbatim to the native input', async () => {
    const { wrapper } = await mountInForm({ metadata: fileMetadata });

    expect(wrapper.find('.sft-file-native').attributes('accept')).toBe('.pdf,.doc,.docx');
  });

  it('leaves the accept attribute absent when file.accept is unset', async () => {
    const { wrapper } = await mountInForm({ metadata: { name: 'resume', type: 'file', fieldOptions: { label: 'Resume' } } });

    expect(wrapper.find('.sft-file-native').attributes('accept')).toBeUndefined();
  });

  it('renders FileInput inside the normal field chrome when no override is supplied', async () => {
    const { wrapper } = await mountInForm({
      metadata: fileMetadata,
      template: createConsumerWrapper(),
    });

    expect(wrapper.find('.sft-field .sft-file').exists()).toBe(true);
  });

  it('replaces only the file control when #file-input is overridden, keeping the chrome around it', async () => {
    const customInput = vi.fn((scope: any) => h('div', { 'data-testid': 'custom-file' }, scope.fieldMetadata.name));
    const { wrapper } = await mountInForm({
      metadata: fileMetadata,
      template: createConsumerWrapper({ overrides: { 'file-input': customInput } }),
    });

    expect(wrapper.find('[data-testid="custom-file"]').exists()).toBe(true);
    expect(wrapper.find('.sft-file').exists()).toBe(false);
    expect(wrapper.find('.sft-field').exists()).toBe(true);
  });
});
