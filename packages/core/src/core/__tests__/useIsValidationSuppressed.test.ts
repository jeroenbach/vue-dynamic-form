import { flushPromises, mount } from '@vue/test-utils';
import { useField, useForm } from 'vee-validate';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { trackNonValidatingWrites, useIsValidationSuppressed } from '@/core/useIsValidationSuppressed';

// Runs against the real vee-validate (no mocks), like the useIsResetPending tests: the wrapper
// relies on useForm providing the very object it returns, so these fail loudly if that changes.

interface Harness {
  form: ReturnType<typeof useForm>
  isTextSuppressed: () => boolean
  isOtherSuppressed: () => boolean
}

function mountWithForm(): Harness {
  const api = {} as Harness;

  // The composable must live in a child of the form owner: useFormContext() only
  // injects from a parent, matching how DynamicFormItem sits below DynamicForm.
  const FieldChild = defineComponent({
    setup() {
      useField('text');
      useField('other');
      api.isTextSuppressed = useIsValidationSuppressed('text');
      api.isOtherSuppressed = useIsValidationSuppressed('other');
      return () => h('div');
    },
  });

  const FormParent = defineComponent({
    setup() {
      api.form = useForm({ initialValues: { text: 'initial', other: 'initial' } });
      trackNonValidatingWrites(api.form);
      return () => h(FieldChild);
    },
  });

  mount(FormParent);
  return api;
}

describe('useIsValidationSuppressed', () => {
  it('is false before any write', () => {
    const api = mountWithForm();

    expect(api.isTextSuppressed()).toBe(false);
  });

  it('suppresses the whole form while a setFieldValue write with shouldValidate: false is pending and clears once it settles', async () => {
    const api = mountWithForm();

    api.form.setFieldValue('text', 'changed', false);

    // Suppression is form-wide for the single tick in which the write flushes.
    expect(api.isTextSuppressed()).toBe(true);
    expect(api.isOtherSuppressed()).toBe(true);

    await flushPromises();

    expect(api.isTextSuppressed()).toBe(false);
    expect(api.isOtherSuppressed()).toBe(false);
  });

  it('stays false for a setFieldValue write that validates (default shouldValidate)', () => {
    const api = mountWithForm();

    api.form.setFieldValue('text', 'changed');

    expect(api.isTextSuppressed()).toBe(false);
  });

  it('suppresses every path while a setValues write with shouldValidate: false is pending', async () => {
    const api = mountWithForm();

    api.form.setValues({ text: 'changed' }, false);

    expect(api.isTextSuppressed()).toBe(true);
    expect(api.isOtherSuppressed()).toBe(true);

    await flushPromises();

    expect(api.isTextSuppressed()).toBe(false);
    expect(api.isOtherSuppressed()).toBe(false);
  });

  it('is true during a reset flush (composes the pending-reset window)', async () => {
    const api = mountWithForm();

    api.form.resetForm();

    expect(api.isTextSuppressed()).toBe(true);

    await flushPromises();

    expect(api.isTextSuppressed()).toBe(false);
  });

  it('wraps a form only once', () => {
    const api = mountWithForm();

    const wrapped = api.form.setFieldValue;
    trackNonValidatingWrites(api.form);

    expect(api.form.setFieldValue).toBe(wrapped);
  });

  it('is false when no form context is present', () => {
    // Mounting a field without a form logs an expected "injection not found" warning
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let isSuppressed!: () => boolean;
    const Standalone = defineComponent({
      setup() {
        useField('text');
        isSuppressed = useIsValidationSuppressed('text');
        return () => h('div');
      },
    });
    mount(Standalone);

    expect(isSuppressed()).toBe(false);
    warn.mockRestore();
  });
});
