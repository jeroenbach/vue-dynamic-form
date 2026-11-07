import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import FileInput from '@/FileInput.vue';

describe('component FileInput', () => {
  it('renders a visually-hidden native input inside a styled label trigger, reading "Choose file" when empty', () => {
    const wrapper = mount(FileInput);

    const trigger = wrapper.find('label.sft-file-trigger');
    expect(trigger.classes()).toEqual(['sft-btn', 'sft-btn-default', 'sft-file-trigger']);
    expect(trigger.text()).toBe('Choose file');

    const native = trigger.find('input.sft-file-native');
    expect(native.exists()).toBe(true);
    expect(native.attributes('type')).toBe('file');
  });

  it('reads "Change file" once a file is held', () => {
    const file = new File(['x'], 'resume.pdf');
    const wrapper = mount(FileInput, { props: { value: file } });

    expect(wrapper.find('label.sft-file-trigger').text()).toContain('Change file');
  });

  it('shows the muted "No file chosen" placeholder when the model is undefined', () => {
    const wrapper = mount(FileInput);

    const name = wrapper.find('.sft-file-name');
    expect(name.classes()).toContain('is-empty');
    expect(name.text()).toBe('No file chosen');
  });

  it('shows the real filename, read straight from the model value, when a file is held', () => {
    const file = new File(['x'], 'jeroen-bach-resume.pdf');
    const wrapper = mount(FileInput, { props: { value: file } });

    const name = wrapper.find('.sft-file-name');
    expect(name.classes()).not.toContain('is-empty');
    expect(name.text()).toBe('jeroen-bach-resume.pdf');
  });

  it('shows no clear button when no file is held, and a clear button with the filename-interpolated aria-label once one is', () => {
    const empty = mount(FileInput);
    expect(empty.find('.sft-file-clear').exists()).toBe(false);

    const file = new File(['x'], 'jeroen-bach-resume.pdf');
    const filled = mount(FileInput, { props: { value: file } });
    const clear = filled.find('.sft-file-clear');
    expect(clear.exists()).toBe(true);
    expect(clear.attributes('aria-label')).toBe('Remove jeroen-bach-resume.pdf');
  });

  it('lets an explicit clearAriaLabel win over the filename-interpolated default', () => {
    const file = new File(['x'], 'resume.pdf');
    const wrapper = mount(FileInput, { props: { value: file, clearAriaLabel: 'Remove attachment' } });

    expect(wrapper.find('.sft-file-clear').attributes('aria-label')).toBe('Remove attachment');
  });

  it('interpolates {name} inside a consumer-supplied clearAriaLabel with the real filename', () => {
    const file = new File(['x'], 'resume.pdf');
    const wrapper = mount(FileInput, { props: { value: file, clearAriaLabel: 'Verwijder {name}' } });

    expect(wrapper.find('.sft-file-clear').attributes('aria-label')).toBe('Verwijder resume.pdf');
  });

  it('forwards the accept property verbatim to the native input, and omits the attribute when unset', () => {
    const withAccept = mount(FileInput, { props: { accept: '.pdf,.doc,.docx' } });
    expect(withAccept.find('.sft-file-native').attributes('accept')).toBe('.pdf,.doc,.docx');

    const withoutAccept = mount(FileInput);
    expect(withoutAccept.find('.sft-file-native').attributes('accept')).toBeUndefined();
  });

  it('carries the given id and data-testid', () => {
    const wrapper = mount(FileInput, { props: { id: 'resume', dataTestid: 'resume-input' } });

    expect(wrapper.find('.sft-file-native').attributes('id')).toBe('resume');
    expect(wrapper.find('.sft-file').attributes('data-testid')).toBe('resume-input');
  });

  it('disables the native input when disabled is set', () => {
    const wrapper = mount(FileInput, { props: { disabled: true } });

    expect(wrapper.find('.sft-file-native').attributes('disabled')).toBeDefined();
  });

  it('carries is-disabled on the wrapper when disabled is set, so the trigger stops looking interactive', () => {
    const wrapper = mount(FileInput, { props: { disabled: true } });

    expect(wrapper.find('.sft-file').classes()).toContain('is-disabled');
  });

  it('carries is-invalid and aria-invalid when an error message is set', () => {
    const wrapper = mount(FileInput, { props: { errorMessage: 'Attach your resume before submitting.' } });

    expect(wrapper.find('.sft-file').classes()).toContain('is-invalid');
    expect(wrapper.find('.sft-file-native').attributes('aria-invalid')).toBe('true');
  });

  it('puts ariaLabelledby and ariaDescribedby on the native input, where a screen reader reads them on focus', () => {
    const wrapper = mount(FileInput, {
      props: { ariaLabelledby: 'resume-label', ariaDescribedby: 'resume-desc resume-error' },
    });

    const native = wrapper.find('.sft-file-native');
    expect(native.attributes('aria-labelledby')).toBe('resume-label');
    expect(native.attributes('aria-describedby')).toBe('resume-desc resume-error');
  });

  it('omits both aria association attributes when the props are unset', () => {
    const wrapper = mount(FileInput);

    const native = wrapper.find('.sft-file-native');
    expect(native.attributes('aria-labelledby')).toBeUndefined();
    expect(native.attributes('aria-describedby')).toBeUndefined();
  });

  it('hands focus to the native input when the clear button is clicked, instead of dropping it to the body', async () => {
    const file = new File(['x'], 'resume.pdf');
    const wrapper = mount(FileInput, { props: { value: file }, attachTo: document.body });

    const clear = wrapper.find('.sft-file-clear');
    (clear.element as HTMLButtonElement).focus();
    await clear.trigger('click');

    expect(wrapper.emitted('change')?.[0]).toEqual([undefined]);
    expect(document.activeElement).toBe(wrapper.find('.sft-file-native').element);

    wrapper.unmount();
  });

  it('reaches document.activeElement when the native input is focused directly, with the trigger label reachable via :focus-within', async () => {
    const wrapper = mount(FileInput, { attachTo: document.body });

    const native = wrapper.find('.sft-file-native').element as HTMLInputElement;
    native.focus();

    expect(document.activeElement).toBe(native);
    expect(native.closest('.sft-file-trigger')).not.toBeNull();

    wrapper.unmount();
  });
});
