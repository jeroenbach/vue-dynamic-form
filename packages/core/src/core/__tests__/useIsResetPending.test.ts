import { flushPromises, mount } from '@vue/test-utils';
import { useField, useForm } from 'vee-validate';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useIsResetPending } from '@/core/useIsResetPending';

// These tests deliberately run against the real vee-validate (no mocks): they exist to fail
// loudly when an upgrade changes the private getPathState/__flags.pendingReset internals the
// composable reads, before any component-level symptom shows up.

interface Harness {
  resetForm: (state?: any) => void
  resetField: (path: any, state?: any) => void
  isTextResetPending: () => boolean
  isOtherResetPending: () => boolean
}

function mountWithForm(): Harness {
  const api = {} as Harness;

  // The composable must live in a child of the form owner: useFormContext() only
  // injects from a parent, matching how DynamicFormItem sits below DynamicForm.
  const FieldChild = defineComponent({
    setup() {
      useField('text');
      useField('other');
      api.isTextResetPending = useIsResetPending('text');
      api.isOtherResetPending = useIsResetPending('other');
      return () => h('div');
    },
  });

  const FormParent = defineComponent({
    setup() {
      const { resetForm, resetField } = useForm({ initialValues: { text: 'initial', other: 'initial' } });
      api.resetForm = resetForm;
      api.resetField = resetField;
      return () => h(FieldChild);
    },
  });

  mount(FormParent);
  return api;
}

describe('useIsResetPending', () => {
  it('is false before any reset', () => {
    const api = mountWithForm();

    expect(api.isTextResetPending()).toBe(false);
  });

  it('is true while a resetForm flush is pending and false once it settles', async () => {
    const api = mountWithForm();

    api.resetForm();

    expect(api.isTextResetPending()).toBe(true);
    expect(api.isOtherResetPending()).toBe(true);

    await flushPromises();

    expect(api.isTextResetPending()).toBe(false);
    expect(api.isOtherResetPending()).toBe(false);
  });

  it('is true while a resetField flush of the same path is pending', async () => {
    const api = mountWithForm();

    api.resetField('text');

    expect(api.isTextResetPending()).toBe(true);

    await flushPromises();

    expect(api.isTextResetPending()).toBe(false);
  });

  it('stays false when a different field is reset', () => {
    const api = mountWithForm();

    api.resetField('other');

    expect(api.isTextResetPending()).toBe(false);
    expect(api.isOtherResetPending()).toBe(true);
  });

  it('is false when no form context is present', () => {
    // Mounting a field without a form logs an expected "injection not found" warning
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    let isResetPending!: () => boolean;
    const Standalone = defineComponent({
      setup() {
        useField('text');
        isResetPending = useIsResetPending('text');
        return () => h('div');
      },
    });
    mount(Standalone);

    expect(isResetPending()).toBe(false);
    warn.mockRestore();
  });
});
