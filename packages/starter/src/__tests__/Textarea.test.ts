import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Textarea from '@/Textarea.vue';

describe('component Textarea', () => {
  it('renders with no data-testid, no error class and no aria-invalid when none is given', () => {
    const wrapper = mount(Textarea);

    const textarea = wrapper.find('textarea');
    expect(textarea.attributes('data-testid')).toBeUndefined();
    expect(textarea.classes()).toEqual(['sft-textarea']);
    expect(textarea.attributes('aria-invalid')).toBe('false');
  });

  it('carries the given data-testid, class and aria-invalid flag when an error message is set', () => {
    const wrapper = mount(Textarea, { props: { dataTestid: 'bio', errorMessage: 'Too short' } });

    const textarea = wrapper.find('textarea');
    expect(textarea.attributes('data-testid')).toBe('bio');
    expect(textarea.classes()).toContain('is-invalid');
    expect(textarea.attributes('aria-invalid')).toBe('true');
  });

  it('forwards disabled and placeholder straight through to the native element', () => {
    const wrapper = mount(Textarea, { props: { disabled: true, placeholder: 'Tell us about yourself' } });

    const textarea = wrapper.find('textarea');
    expect(textarea.attributes('disabled')).toBeDefined();
    expect(textarea.attributes('placeholder')).toBe('Tell us about yourself');
  });

  it('displays the value prop and has no local state to go stale: changing the prop alone updates the DOM with no event fired', async () => {
    const wrapper = mount(Textarea, { props: { value: 'first draft' } });

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('first draft');

    await wrapper.setProps({ value: 'second draft' });

    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('second draft');
  });

  it('forwards the native input and blur events straight to the attrs listeners, carrying the raw string', async () => {
    const onInput = vi.fn();
    const onBlur = vi.fn();
    const wrapper = mount(Textarea, { attrs: { value: '', onInput, onBlur } });
    const textarea = wrapper.find('textarea');

    await textarea.setValue('hello there');
    expect(onInput).toHaveBeenCalledTimes(1);
    expect((onInput.mock.calls[0][0].target as HTMLTextAreaElement).value).toBe('hello there');

    await textarea.trigger('blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
