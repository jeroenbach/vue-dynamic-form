import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { selectFile } from './fixtures/fileHelpers';
import { fileMetadata } from './fixtures/metadata';
import { mountInForm } from './fixtures/mountInForm';

describe('component StarterFormTemplate - file field, model updates and external resets', () => {
  it('updates the model with the picked file and shows its name', async () => {
    const { wrapper, values } = await mountInForm({ metadata: fileMetadata });

    await selectFile(wrapper.find('.sft-file-native'), 'jeroen-bach-resume.pdf');
    await flushPromises();

    expect((values().resume as File).name).toBe('jeroen-bach-resume.pdf');
    expect(wrapper.find('.sft-file-name').text()).toBe('jeroen-bach-resume.pdf');
  });

  it('defaults the clear button\'s aria-label to the filename-interpolated form when file.clearAriaLabel is unset', async () => {
    const { wrapper } = await mountInForm({ metadata: fileMetadata });

    await selectFile(wrapper.find('.sft-file-native'), 'jeroen-bach-resume.pdf');
    await flushPromises();

    expect(wrapper.find('.sft-file-clear').attributes('aria-label')).toBe('Remove jeroen-bach-resume.pdf');
  });

  it('lets an explicit file.clearAriaLabel win over the filename-interpolated default', async () => {
    const { wrapper } = await mountInForm({
      metadata: { ...fileMetadata, file: { ...fileMetadata.file, clearAriaLabel: 'Remove attachment' } },
    });

    await selectFile(wrapper.find('.sft-file-native'), 'jeroen-bach-resume.pdf');
    await flushPromises();

    expect(wrapper.find('.sft-file-clear').attributes('aria-label')).toBe('Remove attachment');
  });

  it('clicking the clear button resets the model and the native input\'s own value together', async () => {
    const { wrapper, values } = await mountInForm({ metadata: fileMetadata });

    const native = wrapper.find<HTMLInputElement>('.sft-file-native');
    await selectFile(native, 'resume.pdf');
    await flushPromises();
    Object.defineProperty(native.element, 'value', { value: 'C:\\fakepath\\resume.pdf', configurable: true, writable: true });

    await wrapper.find('.sft-file-clear').trigger('click');
    await flushPromises();

    expect(values().resume).toBeUndefined();
    expect(native.element.value).toBe('');
    expect(wrapper.find('.sft-file-name').text()).toBe('No file chosen');
  });

  it('follows an externally driven setFieldValue(undefined), keeping the display and the native input in sync', async () => {
    const { wrapper, setFieldValue } = await mountInForm({ metadata: fileMetadata });

    const native = wrapper.find<HTMLInputElement>('.sft-file-native');
    await selectFile(native, 'resume.pdf');
    await flushPromises();
    Object.defineProperty(native.element, 'value', { value: 'C:\\fakepath\\resume.pdf', configurable: true, writable: true });

    setFieldValue('resume', undefined);
    await flushPromises();

    expect(wrapper.find('.sft-file-name').text()).toBe('No file chosen');
    expect(native.element.value).toBe('');
  });

  it('follows an externally driven resetField, keeping the display and the native input in sync', async () => {
    const { wrapper, resetField } = await mountInForm({ metadata: fileMetadata, initialValues: { resume: new File(['a'], 'a.pdf') } });
    await flushPromises();

    const native = wrapper.find<HTMLInputElement>('.sft-file-native');
    Object.defineProperty(native.element, 'value', { value: 'C:\\fakepath\\a.pdf', configurable: true, writable: true });

    resetField('resume', { value: undefined });
    await flushPromises();

    expect(wrapper.find('.sft-file-name').text()).toBe('No file chosen');
    expect(native.element.value).toBe('');
  });

  it('follows an externally driven resetForm, keeping the display and the native input in sync', async () => {
    const { wrapper, resetForm } = await mountInForm({ metadata: fileMetadata, initialValues: { resume: new File(['a'], 'a.pdf') } });
    await flushPromises();

    const native = wrapper.find<HTMLInputElement>('.sft-file-native');
    Object.defineProperty(native.element, 'value', { value: 'C:\\fakepath\\a.pdf', configurable: true, writable: true });

    resetForm({ values: { resume: undefined } });
    await flushPromises();

    expect(wrapper.find('.sft-file-name').text()).toBe('No file chosen');
    expect(native.element.value).toBe('');
  });
});
