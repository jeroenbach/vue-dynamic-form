import type { useDynamicForm } from '@/core/useDynamicForm';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import DynamicForm from '@/components/DynamicForm.vue';
import { useDynamicForm as createDynamicForm } from '@/core/useDynamicForm';
import TestForm from '@/examples/TestForm.vue';
import TestFormTemplate from '@/examples/TestFormTemplate.vue';

// Regression coverage for the vee-validate form API surface (setFieldValue, setValues,
// resetForm, resetField, validate, handleSubmit, meta, errors, touched helpers) across the
// leaf-item shapes: a plain input, a nested group, and a complex type with attributes.
// The validation-timing suppression work (see useIsValidationSuppressed.ts) only touches the
// library's own value watchers, so none of these vee-validate behaviours should have moved.

const messages = {
  required: '{field} is required',
  minLength: 'The minimum length of {field} is {length}',
  maxLength: 'Max length of {field} is {length}',
};

type HostForm = ReturnType<typeof useDynamicForm<any>>;

interface HostApi {
  form: HostForm
  submit: () => Promise<unknown>
  submittedCount: number
  invalidCount: number
  /** Field-value accessors requested via `fieldValuePaths`, keyed by path. */
  fieldValues: Record<string, { value: unknown }>
}

/**
 * A minimal host component for form-API surface that TestForm does not destructure/expose
 * (submitCount, validate, validateField, setFieldError, setErrors, setFieldTouched, setTouched,
 * isFieldTouched/isFieldDirty/isFieldValid, useFieldValue, handleReset). Mirrors the
 * DynamicForm + TestFormTemplate wiring TestForm uses, so field rendering and ids behave
 * identically; only the exposed API surface differs.
 *
 * `fieldValuePaths` lets a test grab `useFieldValue(path)` accessors; they must be created
 * inside setup() since the composable injects the ambient form context.
 */
function mountHostForm(metadata: any[], formOptions: Record<string, any> = {}, fieldValuePaths: string[] = []) {
  const api = { submittedCount: 0, invalidCount: 0, fieldValues: {} } as HostApi;

  const Host = defineComponent({
    name: 'HostForm',
    setup() {
      api.form = createDynamicForm(formOptions) as HostForm;
      api.submit = api.form.handleSubmit(
        () => { api.submittedCount += 1; },
        () => { api.invalidCount += 1; },
      );
      fieldValuePaths.forEach((path) => {
        api.fieldValues[path] = api.form.useFieldValue(path as any);
      });

      return () => h('div', [
        h('button', { 'type': 'button', 'data-testid': 'submit', 'onClick': () => api.submit() }),
        h('button', { 'type': 'button', 'data-testid': 'reset', 'onClick': () => api.form.handleReset() }),
        h(DynamicForm as any, { template: TestFormTemplate, metadata, settings: { messages } }),
      ]);
    },
  });

  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, api };
}

describe('vee-validate form API surface', () => {
  describe('setFieldValue', () => {
    it('validates a nested group field by default, and a shouldValidate: false write does not leave validation stuck off', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            children: [
              { name: 'firstName', type: 'text', minOccurs: 0, restriction: { maxLength: 3 }, fieldOptions: { label: 'First Name' } },
              { name: 'lastName', type: 'text', minOccurs: 0, fieldOptions: { label: 'Last Name' } },
            ],
          }] as any,
          settings: { messages },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('person.firstName', 'toolong');
      await flushPromises();
      expect(wrapper.find('[data-testid="person.firstName-error-message"]').text()).toContain('Max length of First Name is 3');

      (wrapper.vm as any).$.setupState.setFieldValue('person.firstName', 'ok');
      await flushPromises();
      expect(wrapper.find('[data-testid="person.firstName-error-message"]').exists()).toBe(false);

      // A shouldValidate: false write never runs validation, so no error appears for it either.
      (wrapper.vm as any).$.setupState.setFieldValue('person.firstName', 'toolong', false);
      await flushPromises();
      expect(wrapper.find('[data-testid="person.firstName-error-message"]').exists()).toBe(false);

      // The suppression window from that write must not stick around for the next real input.
      await wrapper.find('#person\\.firstName').setValue('also too long');
      await flushPromises();
      expect(wrapper.find('[data-testid="person.firstName-error-message"]').text()).toContain('Max length of First Name is 3');
    });

    it('deep-clones an object value written to a nested group path', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            children: [
              { name: 'firstName', type: 'text', minOccurs: 0, fieldOptions: { label: 'First Name' } },
              { name: 'lastName', type: 'text', minOccurs: 0, fieldOptions: { label: 'Last Name' } },
            ],
          }] as any,
          settings: { messages },
        },
      });
      await flushPromises();

      const source = { firstName: 'Ada', lastName: 'Lovelace' };
      (wrapper.vm as any).$.setupState.setFieldValue('person', source, false);
      await flushPromises();

      source.firstName = 'MUTATED';

      const values = (wrapper.vm as any).$.setupState.values;
      expect(values.person.firstName).toBe('Ada');
      expect(values.person.lastName).toBe('Lovelace');
    });
  });

  describe('setValues', () => {
    it('merges into existing values, preserving an untouched sibling field', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
            { name: 'b', type: 'text', minOccurs: 0, fieldOptions: { label: 'B' } },
          ] as any,
          initialValues: { a: 'initial-a', b: 'initial-b' },
          settings: { messages },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setValues({ a: 'changed-a' }, false);
      await flushPromises();

      const values = (wrapper.vm as any).$.setupState.values;
      expect(values.a).toBe('changed-a');
      expect(values.b).toBe('initial-b');
    });

    it('merges nested group values, preserving an untouched sibling key', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            children: [
              { name: 'firstName', type: 'text', minOccurs: 0, fieldOptions: { label: 'First Name' } },
              { name: 'lastName', type: 'text', minOccurs: 0, fieldOptions: { label: 'Last Name' } },
            ],
          }] as any,
          initialValues: { person: { firstName: 'Ada', lastName: 'Lovelace' } },
          settings: { messages },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setValues({ person: { firstName: 'Grace' } }, false);
      await flushPromises();

      const values = (wrapper.vm as any).$.setupState.values;
      expect(values.person.firstName).toBe('Grace');
      expect(values.person.lastName).toBe('Lovelace');
    });

    it('force-validates by default, surfacing an error on a field that was never touched', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'a', type: 'text', minOccurs: 1, fieldOptions: { label: 'A' } },
            { name: 'b', type: 'text', minOccurs: 1, fieldOptions: { label: 'B' } },
          ] as any,
          settings: { messages },
        },
      });
      await flushPromises();

      expect(wrapper.find('[data-testid="b-error-message"]').exists()).toBe(false);

      (wrapper.vm as any).$.setupState.setValues({ a: 'filled' });
      await flushPromises();

      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="b-error-message"]').text()).toContain('B is required');
    });
  });

  describe('resetForm', () => {
    it('merges a partial values override on top of the original initial values', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
            { name: 'b', type: 'text', minOccurs: 0, fieldOptions: { label: 'B' } },
          ] as any,
          initialValues: { a: 'initial-a', b: 'initial-b' },
          settings: { messages },
        },
      });
      await flushPromises();

      await wrapper.find('#a').setValue('dirty-a');
      await wrapper.find('#b').setValue('dirty-b');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm({ values: { a: 'override-a' } });
      await flushPromises();

      const values = (wrapper.vm as any).$.setupState.values;
      expect(values.a).toBe('override-a');
      // b was not mentioned in the override, so it falls back to its ORIGINAL initial value,
      // not the dirty value the user typed.
      expect(values.b).toBe('initial-b');
    });

    it('fully replaces values when force is true, dropping keys absent from the new values', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
            { name: 'b', type: 'text', minOccurs: 0, fieldOptions: { label: 'B' } },
          ] as any,
          initialValues: { a: 'initial-a', b: 'initial-b' },
          settings: { messages },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm({ values: { a: 'only-a' } }, { force: true });
      await flushPromises();

      const values = (wrapper.vm as any).$.setupState.values;
      expect(values.a).toBe('only-a');
      expect('b' in values).toBe(false);
    });

    it('clears touched on every field except those explicitly listed', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
        { name: 'b', type: 'text', minOccurs: 0, fieldOptions: { label: 'B' } },
      ]);
      await flushPromises();

      await wrapper.find('#a').trigger('blur');
      await wrapper.find('#b').trigger('blur');
      await flushPromises();
      expect(api.form.isFieldTouched('a')).toBe(true);
      expect(api.form.isFieldTouched('b')).toBe(true);

      api.form.resetForm({ touched: { a: true } });
      await flushPromises();

      expect(api.form.isFieldTouched('a')).toBe(true);
      expect(api.form.isFieldTouched('b')).toBe(false);
    });

    it('resets submitCount to 0 by default, and to an explicit value when given', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
      ]);
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(api.form.submitCount.value).toBe(2);

      api.form.resetForm();
      await flushPromises();
      expect(api.form.submitCount.value).toBe(0);

      api.form.resetForm({ submitCount: 3 });
      await flushPromises();
      expect(api.form.submitCount.value).toBe(3);
    });
  });

  describe('resetField', () => {
    it('resets only the targeted field, leaving a sibling error and value untouched', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'a', type: 'text', minOccurs: 0, restriction: { maxLength: 3 }, fieldOptions: { label: 'A' } },
            { name: 'b', type: 'text', minOccurs: 0, restriction: { maxLength: 3 }, fieldOptions: { label: 'B' } },
          ] as any,
          settings: { messages },
        },
      });
      await flushPromises();

      await wrapper.find('#a').setValue('too long');
      await wrapper.find('#b').setValue('too long');
      await flushPromises();
      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="b-error-message"]').exists()).toBe(true);

      (wrapper.vm as any).$.setupState.resetField('a');
      await flushPromises();

      expect((wrapper.find('#a').element as HTMLInputElement).value).toBe('');
      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(false);
      // Sibling field was never touched by resetField, so its value and error survive.
      expect((wrapper.find('#b').element as HTMLInputElement).value).toBe('too long');
      expect(wrapper.find('[data-testid="b-error-message"]').exists()).toBe(true);
    });

    it('applies explicit value, errors and touched state to the targeted field only', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', type: 'text', minOccurs: 0, fieldOptions: { label: 'Text Input' } }] as any,
          settings: { messages },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetField('text', { value: 'explicit', errors: 'custom error', touched: true });
      await flushPromises();

      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('explicit');
      expect(wrapper.find('[data-testid="text-error-message"]').text()).toContain('custom error');
      expect((wrapper.vm as any).$.setupState.meta.touched).toBe(true);
    });
  });

  describe('validate', () => {
    it('force mode surfaces errors on fields that were never touched', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 1, fieldOptions: { label: 'A' } },
        { name: 'b', type: 'text', minOccurs: 1, fieldOptions: { label: 'B' } },
      ]);
      await flushPromises();

      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="b-error-message"]').exists()).toBe(false);

      await api.form.validate();
      await flushPromises();

      expect(wrapper.find('[data-testid="a-error-message"]').text()).toContain('A is required');
      expect(wrapper.find('[data-testid="b-error-message"]').text()).toContain('B is required');
    });

    it('silent mode updates meta.valid without writing any error text', async () => {
      // maxLength (rather than required) avoids the empty-string-to-undefined normalisation
      // DynamicFormItem applies to blank values, which would otherwise reassign the field's
      // own value proxy and trigger vee-validate's own silent self-check independently of this.
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 0, restriction: { maxLength: 3 }, fieldOptions: { label: 'A' } },
      ], { initialValues: { a: 'ok' } });
      await flushPromises();
      expect(api.form.meta.value.valid).toBe(true);

      // A shouldValidate: false write makes the underlying value invalid without revalidating,
      // so meta.valid stays stale (true) until something actually re-checks it.
      api.form.setFieldValue('a', 'too long', false);
      await flushPromises();
      expect(api.form.meta.value.valid).toBe(true);

      await api.form.validate({ mode: 'silent' });
      await flushPromises();

      expect(api.form.meta.value.valid).toBe(false);
      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(false);
    });

    it('validateField validates only the targeted field', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 1, fieldOptions: { label: 'A' } },
        { name: 'b', type: 'text', minOccurs: 1, fieldOptions: { label: 'B' } },
      ]);
      await flushPromises();

      await api.form.validateField('a');
      await flushPromises();

      expect(wrapper.find('[data-testid="a-error-message"]').text()).toContain('A is required');
      expect(wrapper.find('[data-testid="b-error-message"]').exists()).toBe(false);
    });
  });

  describe('handleSubmit', () => {
    it('touches every field and increments submitCount on an invalid submit', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 1, fieldOptions: { label: 'A' } },
        { name: 'b', type: 'text', minOccurs: 1, fieldOptions: { label: 'B' } },
      ]);
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(api.submittedCount).toBe(0);
      expect(api.invalidCount).toBe(1);
      expect(api.form.submitCount.value).toBe(1);
      expect(api.form.isFieldTouched('a')).toBe(true);
      expect(api.form.isFieldTouched('b')).toBe(true);
      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="b-error-message"]').exists()).toBe(true);
    });

    it('calls through to the success callback on a valid submit', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 1, fieldOptions: { label: 'A' } },
      ]);
      await flushPromises();

      await wrapper.find('#a').setValue('filled');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();

      expect(api.submittedCount).toBe(1);
      expect(api.invalidCount).toBe(0);
      expect(api.form.submitCount.value).toBe(1);
    });
  });

  describe('handleReset', () => {
    it('behaves the same as calling resetForm() with no arguments', async () => {
      const { wrapper } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 1, fieldOptions: { label: 'A' } },
      ], { initialValues: { a: 'seeded' } });
      await flushPromises();

      await wrapper.find('#a').setValue('');
      await flushPromises();
      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(true);

      await wrapper.find('[data-testid="reset"]').trigger('click');
      await flushPromises();

      expect((wrapper.find('#a').element as HTMLInputElement).value).toBe('seeded');
      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(false);
    });
  });

  describe('meta', () => {
    const metadata = [{ name: 'text', type: 'text', minOccurs: 0, fieldOptions: { label: 'Text Input' } }] as any;

    it('dirty flips true on edit and false again after resetForm', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings: { messages } },
      });
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(false);

      await wrapper.find('input').setValue('edited');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(true);

      await wrapper.find('[data-testid="reset"]').trigger('click');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(false);
    });

    it('touched flips true on blur and false again after resetForm', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings: { messages } },
      });
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.touched).toBe(false);

      await wrapper.find('input').trigger('blur');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.touched).toBe(true);

      await wrapper.find('[data-testid="reset"]').trigger('click');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.touched).toBe(false);
    });

    it('valid reflects the current validity of the form', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', type: 'text', minOccurs: 1, fieldOptions: { label: 'Text Input' } }] as any,
          settings: { messages },
        },
      });
      await flushPromises();

      await wrapper.find('input').setValue('a');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.valid).toBe(true);

      await wrapper.find('input').setValue('');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.valid).toBe(false);
    });
  });

  describe('errors and errorBag', () => {
    it('setFieldError accepts a string, an array, and clears with undefined', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
      ]);
      await flushPromises();

      api.form.setFieldError('a', 'single error');
      await flushPromises();
      expect(wrapper.find('[data-testid="a-error-message"]').text()).toContain('single error');

      api.form.setFieldError('a', ['first error', 'second error']);
      await flushPromises();
      expect(api.form.errorBag.value.a).toEqual(['first error', 'second error']);
      expect(wrapper.find('[data-testid="a-error-message"]').text()).toContain('first error');

      api.form.setFieldError('a', undefined);
      await flushPromises();
      expect(wrapper.find('[data-testid="a-error-message"]').exists()).toBe(false);
    });

    it('setErrors sets multiple fields at once, leaving other fields alone', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
        { name: 'b', type: 'text', minOccurs: 0, fieldOptions: { label: 'B' } },
      ]);
      await flushPromises();

      api.form.setFieldError('b', 'pre-existing error');
      await flushPromises();

      api.form.setErrors({ a: 'error on a' } as any);
      await flushPromises();

      expect(wrapper.find('[data-testid="a-error-message"]').text()).toContain('error on a');
      // b was not a key in the setErrors call, so its error from before is left untouched.
      expect(wrapper.find('[data-testid="b-error-message"]').text()).toContain('pre-existing error');
    });

    it('setFieldError on a path with no mounted field surfaces as an orphan error and breaks meta.valid', async () => {
      const { api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
      ]);
      await flushPromises();
      expect(api.form.meta.value.valid).toBe(true);

      api.form.setFieldError('ghost' as any, 'ghost error');
      await flushPromises();

      expect(api.form.errors.value.ghost).toBe('ghost error');
      expect(api.form.meta.value.valid).toBe(false);
    });
  });

  describe('touched helpers', () => {
    it('setFieldTouched, setTouched(true) and setTouched({...}) control per-field touched state', async () => {
      const { api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
        { name: 'b', type: 'text', minOccurs: 0, fieldOptions: { label: 'B' } },
      ]);
      await flushPromises();

      api.form.setFieldTouched('a', true);
      await flushPromises();
      expect(api.form.isFieldTouched('a')).toBe(true);
      expect(api.form.isFieldTouched('b')).toBe(false);

      api.form.setTouched(true);
      await flushPromises();
      expect(api.form.isFieldTouched('a')).toBe(true);
      expect(api.form.isFieldTouched('b')).toBe(true);

      api.form.setTouched({ a: false } as any);
      await flushPromises();
      expect(api.form.isFieldTouched('a')).toBe(false);
      // b is omitted from the object form, so it is left as-is rather than being cleared.
      expect(api.form.isFieldTouched('b')).toBe(true);
    });
  });

  describe('useFieldValue and field-level accessors', () => {
    it('useFieldValue reflects live writes to the path', async () => {
      const { api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 0, fieldOptions: { label: 'A' } },
      ], {}, ['a']);
      await flushPromises();
      expect(api.fieldValues.a.value).toBeUndefined();

      api.form.setFieldValue('a', 'live value');
      await flushPromises();
      expect(api.fieldValues.a.value).toBe('live value');
    });

    it('isFieldDirty, isFieldTouched and isFieldValid report per-field state', async () => {
      const { wrapper, api } = mountHostForm([
        { name: 'a', type: 'text', minOccurs: 1, fieldOptions: { label: 'A' } },
      ]);
      await flushPromises();

      expect(api.form.isFieldDirty('a')).toBe(false);
      expect(api.form.isFieldTouched('a')).toBe(false);

      await wrapper.find('#a').setValue('x');
      await wrapper.find('#a').trigger('blur');
      await flushPromises();

      expect(api.form.isFieldDirty('a')).toBe(true);
      expect(api.form.isFieldTouched('a')).toBe(true);
      expect(api.form.isFieldValid('a')).toBe(true);

      await wrapper.find('#a').setValue('');
      await flushPromises();
      expect(api.form.isFieldValid('a')).toBe(false);
    });
  });

  describe('initialValues', () => {
    it('seeds the form values and is the resetForm target', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', type: 'text', minOccurs: 0, fieldOptions: { label: 'Text Input' } }] as any,
          initialValues: { text: 'seeded' },
          settings: { messages },
        },
      });
      await flushPromises();

      expect((wrapper.vm as any).$.setupState.values.text).toBe('seeded');
      expect((wrapper.find('input').element as HTMLInputElement).value).toBe('seeded');

      await wrapper.find('input').setValue('changed');
      await flushPromises();

      await wrapper.find('[data-testid="reset"]').trigger('click');
      await flushPromises();

      expect((wrapper.vm as any).$.setupState.values.text).toBe('seeded');
    });
  });

  describe('complex type with attributes', () => {
    const metadata = [{
      name: 'text',
      type: 'text',
      minOccurs: 0,
      attributes: [{ name: 'lang', type: 'text', minOccurs: 1, fieldOptions: { label: 'Language' } }],
    }] as any;

    it('setFieldValue writes to the bracketed value path', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings: { messages } },
      });
      await flushPromises();

      // Complex type fields (fields with attributes) are registered at `<path>.value` in
      // vee-validate's own path tree (bracket notation `<path>['value']` normalized to dots).
      (wrapper.vm as any).$.setupState.setFieldValue('text.value', 'hello');
      await flushPromises();

      expect((wrapper.find('#text').element as HTMLInputElement).value).toBe('hello');
    });

    it('resetForm clears both the main field error and the attribute error', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings: { messages } },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('text.value', 'hello');
      await flushPromises();

      await wrapper.find('[data-testid="submit"]').trigger('click');
      await flushPromises();
      expect(wrapper.find('[data-testid="text.lang-error-message"]').text()).toContain('Language is required');

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();

      expect(wrapper.find('[data-testid="text.lang-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="text-error-message"]').exists()).toBe(false);
    });
  });
});
