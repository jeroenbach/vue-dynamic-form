import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FileInput from '@/FileInput.vue';
import { selectFile } from './fixtures/fileHelpers';

describe('component FileInput - change, clear and reset wiring', () => {
  it('emits change with files[0] on a native pick', async () => {
    const wrapper = mount(FileInput);
    const native = wrapper.find<HTMLInputElement>('.sft-file-native');

    const file = await selectFile(native, 'resume.pdf');

    expect(wrapper.emitted('change')?.[0]).toEqual([file]);
  });

  it('picking a second file with no clear step updates to the new file, with no error', async () => {
    const wrapper = mount(FileInput, { props: { value: new File(['a'], 'a.pdf') } });
    const native = wrapper.find<HTMLInputElement>('.sft-file-native');

    const fileB = await selectFile(native, 'b.pdf');

    expect(wrapper.emitted('change')?.at(-1)).toEqual([fileB]);
  });

  it('clicking the clear button emits change with undefined', async () => {
    const wrapper = mount(FileInput, { props: { value: new File(['a'], 'resume.pdf') } });

    await wrapper.find('.sft-file-clear').trigger('click');

    expect(wrapper.emitted('change')?.at(-1)).toEqual([undefined]);
  });

  it('resets the native input\'s own value when the value prop drops to undefined, so the same file is re-selectable', async () => {
    const file = new File(['a'], 'resume.pdf');
    const wrapper = mount(FileInput, { props: { value: file } });
    const native = wrapper.find<HTMLInputElement>('.sft-file-native');

    // jsdom refuses to let a test assign a real FileList-backed value, but the
    // native element still exposes an assignable `.value`; simulate the browser
    // having one set, so the reset-to-empty-string effect is actually observable.
    Object.defineProperty(native.element, 'value', { value: 'C:\\fakepath\\resume.pdf', configurable: true, writable: true });
    expect(native.element.value).not.toBe('');

    await wrapper.setProps({ value: undefined });

    expect(native.element.value).toBe('');
  });

  it('does not touch the native input\'s value while a file is still held', async () => {
    const fileA = new File(['a'], 'a.pdf');
    const fileB = new File(['b'], 'b.pdf');
    const wrapper = mount(FileInput, { props: { value: fileA } });
    const native = wrapper.find<HTMLInputElement>('.sft-file-native');

    Object.defineProperty(native.element, 'value', { value: 'C:\\fakepath\\a.pdf', configurable: true, writable: true });

    await wrapper.setProps({ value: fileB });

    expect(native.element.value).not.toBe('');
  });

  it('forwards the native blur event', async () => {
    const wrapper = mount(FileInput);

    await wrapper.find('.sft-file-native').trigger('blur');

    expect(wrapper.emitted('blur')).toHaveLength(1);
  });
});
