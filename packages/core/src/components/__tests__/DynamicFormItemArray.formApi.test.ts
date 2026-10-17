import { flushPromises, mount } from '@vue/test-utils';
import { configure } from 'vee-validate';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import DynamicForm from '@/components/DynamicForm.vue';
import { useDynamicForm } from '@/core/useDynamicForm';
import TestForm from '@/examples/TestForm.vue';
import TestFormTemplate from '@/examples/TestFormTemplate.vue';
import { formValues } from './DynamicFormItem.test-helpers';
import { setupState as arraySetupState } from './DynamicFormItemArray.test-helpers';

// These tests drive vee-validate's own form API surface (resetForm, resetField, setFieldValue,
// setValues, validate, validateField, setFieldError, useFieldValue, submit) against the array
// shape (DynamicFormItemArray), to prove the library's custom validation-timing suppression layer
// does not change any of vee-validate's own documented behaviour.

/**
 * Mounts a minimal host that exposes the full `useDynamicForm()` return value directly (TestForm
 * only destructures a subset of it), plus a `hide()` escape hatch to unmount the rendered
 * DynamicForm subtree without destroying the host, for `keepValuesOnUnmount` assertions.
 */
function mountFormApi(metadata: any, settings: any = {}, formOptions: any = {}, extra?: (form: ReturnType<typeof useDynamicForm>) => any) {
  const api = {} as { form: ReturnType<typeof useDynamicForm>, hide: () => void, extra?: any };
  const Harness = defineComponent({
    name: 'ArrayFormApiHarness',
    setup() {
      const shown = ref(true);
      api.form = useDynamicForm(formOptions);
      if (extra)
        api.extra = extra(api.form);
      api.hide = () => {
        shown.value = false;
      };
      return () => shown.value
        ? h(DynamicForm as any, { metadata, template: TestFormTemplate as any, settings })
        : h('div');
    },
  });
  const wrapper = mount(Harness, { attachTo: document.body });
  return { wrapper, form: api.form, hide: api.hide, extra: api.extra };
}

describe('component DynamicFormItemArray - form API', () => {
  afterEach(() => {
    configure({ generateMessage: undefined as any });
  });

  describe('setFieldValue on an item path', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 2,
      maxOccurs: 3,
    }] as any;
    const settings = { messages: { minOccurs: 'At least {min} items required' } };

    it('validates by default and surfaces the array minOccurs error', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata, settings } });
      await flushPromises(); // allow watchEffect to auto-add the 2 placeholder items

      (wrapper.vm as any).$.setupState.setFieldValue('items[0]', 'a');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 2 items required');
    });

    it('suppresses validation when shouldValidate is false, and the next normal change validates again', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata, settings } });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('items[0]', 'a', false);
      await flushPromises();

      expect((wrapper.find('input[id="items[0]"]').element as HTMLInputElement).value).toBe('a');
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="errors"]').exists()).toBe(false);

      // Suppression is form-wide for exactly one tick; a normal edit right after re-enables it.
      await wrapper.find('input[id="items[0]"]').setValue('a2');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 2 items required');
    });
  });

  describe('setFieldValue on the whole array path', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 1,
      maxOccurs: 5,
    }] as any;

    it('re-renders the array to match the new length and values', async () => {
      const wrapper = mount(TestForm, { attachTo: document.body, props: { metadata } });
      await flushPromises(); // auto-adds 1 placeholder item

      (wrapper.vm as any).$.setupState.setFieldValue('items', ['a', 'b', 'c']);
      await flushPromises();

      const inputs = wrapper.findAll('input');
      expect(inputs).toHaveLength(3);
      expect((inputs[2].element as HTMLInputElement).value).toBe('c');
      expect(formValues(wrapper).items).toEqual(['a', 'b', 'c']);
    });

    it('validates the written array by default', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ ...metadata[0], minOccurs: 2 }],
          settings: { messages: { minOccurs: 'At least {min} items required' } },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('items', ['solo']);
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 2 items required');
    });

    it('does not validate when called with shouldValidate: false, even though the value still updates', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ ...metadata[0], minOccurs: 2 }],
          settings: { messages: { minOccurs: 'At least {min} items required' } },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('items', ['solo'], false);
      await flushPromises();

      // minOccurs=2 means the auto-fill watchEffect tops the array back up to 2 raw entries;
      // the write itself still lands untouched as items[0].
      expect(formValues(wrapper).items[0]).toBe('solo');
      expect(formValues(wrapper).items).toHaveLength(2);
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
    });
  });

  describe('setValues with an array value', () => {
    const metadata = [
      { name: 'items', fieldOptions: { label: 'Items' }, minOccurs: 0, maxOccurs: 5 },
      { name: 'label', type: 'text' },
    ] as any;

    it('replaces the array wholesale instead of merging element-wise, and leaves sibling fields untouched', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, initialValues: { items: ['a', 'b', 'c'], label: 'keep' } },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setValues({ items: ['x', 'y'] });
      await flushPromises();

      expect(formValues(wrapper).items).toEqual(['x', 'y']);
      expect(formValues(wrapper).label).toBe('keep');
      expect(wrapper.findAll('input[id^="items"]')).toHaveLength(2);
    });

    it('suppresses validation when called with shouldValidate: false', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ ...metadata[0], minOccurs: 3 }, metadata[1]],
          initialValues: { items: ['a', 'b', 'c'] },
          settings: { messages: { minOccurs: 'At least {min} items required' } },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setValues({ items: ['only one'] }, false);
      await flushPromises();

      // minOccurs=3 means the auto-fill watchEffect tops the array back up to 3 raw entries;
      // the write itself still lands untouched as items[0].
      expect(formValues(wrapper).items[0]).toBe('only one');
      expect(formValues(wrapper).items).toHaveLength(3);
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
    });
  });

  describe('resetForm', () => {
    const metadata = [
      { name: 'items', fieldOptions: { label: 'Items' }, minOccurs: 1, maxOccurs: 5 },
      { name: 'label', type: 'text' },
    ] as any;

    it('resetForm({ values }) without force only overrides the given path, siblings fall back to their original initial value, not their current dirty value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, initialValues: { items: ['a'], label: 'original' } },
      });
      await flushPromises();

      await wrapper.find('input[id="label"]').setValue('dirty');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm({ values: { items: ['x', 'y', 'z'] } });
      await flushPromises();

      expect(formValues(wrapper).items).toEqual(['x', 'y', 'z']);
      expect(formValues(wrapper).label).toBe('original');
    });

    it('resetForm({ values }, { force: true }) replaces the entire value set, dropping keys absent from the override', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, initialValues: { items: ['a'], label: 'original' } },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm({ values: { items: ['x'] } }, { force: true });
      await flushPromises();

      expect(formValues(wrapper).items).toEqual(['x']);
      expect(Object.keys(formValues(wrapper))).not.toContain('label');
    });

    it('drops an item the user pushed beyond the original initial length, because push only stages the live initialValues, not originalInitialValues', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, initialValues: { items: ['a', 'b'], label: 'original' } },
      });
      await flushPromises();

      await wrapper.find('[data-testid="items-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('input[id="items[2]"]').setValue('c');
      await flushPromises();
      expect(formValues(wrapper).items).toEqual(['a', 'b', 'c']);

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();

      // Correct per vee-validate's own contract (see useForm's originalInitialValues comment):
      // a fieldArray push() only calls stageInitialValue with updateOriginal left at its default
      // (false), so the pushed 3rd entry never reaches originalInitialValues. resetForm() with no
      // explicit values falls back to originalInitialValues, so the pushed entry is dropped.
      expect(formValues(wrapper).items).toEqual(['a', 'b']);
      expect(wrapper.find('input[id="items[2]"]').exists()).toBe(false);
    });

    it('keeps errors passed explicitly to resetForm', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings: { messages: { minOccurs: 'At least {min} items required' } } },
      });
      await flushPromises();

      await wrapper.find('input').setValue('value');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm({ errors: { items: 'Explicit error' } });
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('Explicit error');
    });
  });

  describe('resetField', () => {
    const metadata = [
      { name: 'items', fieldOptions: { label: 'Items' }, minOccurs: 1, maxOccurs: 5 },
      { name: 'other', type: 'text' },
    ] as any;

    it('resets only the array, leaving sibling field values and errors untouched', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, initialValues: { items: ['a'], other: 'orig' } },
      });
      await flushPromises();

      await wrapper.find('input[id="items[0]"]').setValue('changed');
      await wrapper.find('input[id="other"]').setValue('changed-other');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetField('items');
      await flushPromises();

      expect(formValues(wrapper).items).toEqual(['a']);
      expect(formValues(wrapper).other).toBe('changed-other');
    });

    it('keeps the pushed item\'s slot but reverts it to null, because resetField falls back to the live initialValues that push staged at push time (an empty placeholder, not whatever the user typed afterwards)', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, initialValues: { items: ['a', 'b'], other: 'orig' } },
      });
      await flushPromises();

      await wrapper.find('[data-testid="items-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('input[id="items[2]"]').setValue('c');
      await flushPromises();
      await wrapper.find('input[id="items[0]"]').setValue('a-changed');
      await flushPromises();
      expect(formValues(wrapper).items).toEqual(['a-changed', 'b', 'c']);

      (wrapper.vm as any).$.setupState.resetField('items');
      await flushPromises();

      // Contrast with the resetForm() test above (which drops the pushed slot entirely, because
      // originalInitialValues never learns about it). resetField's fallback source is the live
      // `initialValues`, which push() does stage for the new slot, but only with the placeholder
      // value passed to push() at the time (null), not with whatever the user typed afterwards.
      // So the slot survives, but its value reverts to null rather than to the typed 'c'.
      expect(formValues(wrapper).items).toEqual(['a', 'b', null]);
      expect(wrapper.find('input[id="items[2]"]').exists()).toBe(true);
    });
  });

  describe('validate and validateField', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 2,
      maxOccurs: 5,
    }] as any;
    const settings = { messages: { minOccurs: 'At least {min} items required' } };

    it('force validate() surfaces the minOccurs error even on an array nobody has touched yet', async () => {
      const { wrapper, form } = mountFormApi(metadata, settings);
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);

      await form.validate();
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 2 items required');
      expect(form.meta.value.valid).toBe(false);
    });

    it('validate({ mode: "silent" }) updates meta.valid but writes no error text', async () => {
      const { wrapper, form } = mountFormApi(metadata, settings);
      await flushPromises();

      await form.validate({ mode: 'silent' });
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
      expect(form.meta.value.valid).toBe(false);
    });

    it('validateField("items") surfaces the error immediately, independent of the component\'s own interaction gating', async () => {
      const { wrapper, form } = mountFormApi(metadata, settings);
      await flushPromises();

      await form.validateField('items');
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 2 items required');
    });

    it('validateField("items", { mode: "silent" }) does not write error text', async () => {
      const { wrapper, form } = mountFormApi(metadata, settings);
      await flushPromises();

      await form.validateField('items', { mode: 'silent' });
      await flushPromises();

      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
    });
  });

  describe('submit pipeline', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 2,
      maxOccurs: 5,
    }] as any;
    const settings = { messages: { minOccurs: 'At least {min} items required' } };

    it('an invalid submit shows the array error and increments submitCount without calling the success handler', async () => {
      const { wrapper, form } = mountFormApi(metadata, settings);
      await flushPromises();

      const onValid = vi.fn();
      const onInvalid = vi.fn();
      const submit = form.handleSubmit(onValid, onInvalid);

      await submit();
      await flushPromises();

      expect(form.submitCount.value).toBe(1);
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(true);
      expect(onValid).not.toHaveBeenCalled();
      expect(onInvalid).toHaveBeenCalledTimes(1);
    });

    it('filling the array to satisfy minOccurs then submitting passes and clears the error', async () => {
      const { wrapper, form } = mountFormApi(metadata, settings);
      await flushPromises();

      const onValid = vi.fn();
      const onInvalid = vi.fn();
      const submit = form.handleSubmit(onValid, onInvalid);

      await submit();
      await flushPromises();
      expect(form.submitCount.value).toBe(1);

      form.setFieldValue('items', ['a', 'b']);
      await flushPromises();
      await submit();
      await flushPromises();

      expect(form.submitCount.value).toBe(2);
      expect(onValid).toHaveBeenCalledTimes(1);
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
    });
  });

  describe('meta.dirty', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 0,
      maxOccurs: 5,
    }] as any;

    it('tracks add, edit, remove and returns to false after resetForm', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, initialValues: { items: ['a'] } },
      });
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(false);

      await wrapper.find('[data-testid="items-add-button"]').trigger('click');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(true);

      await wrapper.find('input[id="items[1]"]').element;
      await wrapper.findAll('[data-testid="items[1]-remove-button"]')[0].trigger('click');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(false);

      await wrapper.find('input[id="items[0]"]').setValue('changed');
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(true);

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();
      expect((wrapper.vm as any).$.setupState.meta.dirty).toBe(false);
    });
  });

  describe('setFieldError', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 1,
      maxOccurs: 5,
    }] as any;

    it('sets and clears an error on the mounted array path directly', async () => {
      const { wrapper, form } = mountFormApi(metadata);
      await flushPromises();

      form.setFieldError('items', 'explicit error');
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('explicit error');

      form.setFieldError('items', undefined);
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);
    });

    it('stashes an orphan error for an array index with no mounted field, and clears it the same way', async () => {
      const { form } = mountFormApi(metadata);
      await flushPromises();

      form.setFieldError('items[4]', 'orphan error');
      expect(form.errors.value['items[4]' as never]).toBe('orphan error');

      form.setFieldError('items[4]', undefined);
      expect(form.errors.value['items[4]' as never]).toBeUndefined();
    });
  });

  describe('add/remove buttons interleaved with resetForm', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 1,
      maxOccurs: 5,
    }] as any;
    const settings = { messages: { minOccurs: 'At least {min} items required' } };

    it('add/remove keep working and validating correctly after a reset', async () => {
      // An explicit initialValues baseline is needed here: if the form never had one, the
      // auto-fill watchEffect's own push() only stages the *live* initialValues (not
      // originalInitialValues), so resetForm() would have nothing to fall back to and leave an
      // untouched array value entirely unchanged (see the dedicated resetForm/resetField tests).
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, settings, initialValues: { items: [null] } },
      });
      await flushPromises();

      await wrapper.find('[data-testid="items-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('input[id="items[0]"]').setValue('a');
      await wrapper.find('input[id="items[1]"]').setValue('b');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();

      // Back to a single pristine placeholder after reset.
      expect(wrapper.findAll('input[id^="items"]')).toHaveLength(1);

      await wrapper.find('[data-testid="items-add-button"]').trigger('click');
      await flushPromises();
      await wrapper.find('input[id="items[1]"]').setValue('fresh');
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').exists()).toBe(false);

      await wrapper.find('input[id="items[1]"]').setValue('');
      await flushPromises();
      expect(wrapper.find('[data-testid="items-error-message"]').text()).toContain('At least 1 items required');
    });
  });

  describe('useFieldValue', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 1,
      maxOccurs: 5,
    }] as any;

    it('reflects live array updates from programmatic writes and DOM input', async () => {
      // useFieldValue relies on inject(), which only resolves inside a component's own setup();
      // calling it from the test body (after setup has already run) would silently fail, so it
      // is captured via the harness's `extra` hook instead.
      const { wrapper, form, extra: itemsValue } = mountFormApi(metadata, {}, {}, f => f.useFieldValue('items' as never));
      await flushPromises();

      expect(itemsValue.value).toEqual([null]);

      form.setFieldValue('items', ['a', 'b']);
      await flushPromises();
      expect(itemsValue.value).toEqual(['a', 'b']);

      await wrapper.find('input[id="items[0]"]').setValue('changed');
      await flushPromises();
      expect((itemsValue.value as any[])[0]).toBe('changed');
    });
  });

  describe('keepValuesOnUnmount', () => {
    const metadata = [{
      name: 'items',
      fieldOptions: { label: 'Items' },
      minOccurs: 1,
      maxOccurs: 5,
    }] as any;

    it('keeps the array values in form.values after the form subtree unmounts when keepValuesOnUnmount is true', async () => {
      const { form, hide } = mountFormApi(metadata, {}, { initialValues: { items: ['a', 'b'] }, keepValuesOnUnmount: true });
      await flushPromises();

      hide();
      await flushPromises();

      expect(form.values.items).toEqual(['a', 'b']);
    });

    it('clears the array values after the form subtree unmounts when keepValuesOnUnmount is not set', async () => {
      const { form, hide } = mountFormApi(metadata, {}, { initialValues: { items: ['a', 'b'] } });
      await flushPromises();

      hide();
      await flushPromises();

      expect(form.values.items).toBeUndefined();
    });
  });

  describe('nested object array', () => {
    const metadata = [{
      name: 'contacts',
      type: 'heading',
      fieldOptions: { label: 'Contacts' },
      minOccurs: 1,
      maxOccurs: 3,
      children: [
        { name: 'email', type: 'text' },
      ],
    }] as any;

    it('setFieldValue on a deep item path validates by default', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ ...metadata[0], minOccurs: 2 }],
          settings: { messages: { minOccurs: 'At least {min} items required' } },
        },
      });
      await flushPromises();

      (wrapper.vm as any).$.setupState.setFieldValue('contacts[0].email', 'a@test.com');
      await flushPromises();

      // The #heading-array template slot renders no error-message span (unlike #default-array),
      // so the array's own fieldContext is read directly instead of a DOM testid.
      const { fieldContext } = arraySetupState(wrapper, 'contacts') ?? {};
      expect(fieldContext.errorMessage.value).toContain('At least 2 items required');
    });

    it('resetForm restores the nested array values', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata, initialValues: { contacts: [{ email: 'a@test.com' }] } },
      });
      await flushPromises();

      await wrapper.find('input[id="contacts\\[0\\]\\.email"]').setValue('changed@test.com');
      await flushPromises();

      (wrapper.vm as any).$.setupState.resetForm();
      await flushPromises();

      expect(formValues(wrapper).contacts).toEqual([{ email: 'a@test.com' }]);
    });
  });
});
