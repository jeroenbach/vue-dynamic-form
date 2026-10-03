import type { Metadata } from '@/examples/TestFormTemplate.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { toRaw } from 'vue';
import TestForm from '@/examples/TestForm.vue';
import { formValues } from './DynamicFormItem.test-helpers';

describe('component DynamicFormItem - unmount', () => {
  describe('pinned guarantees (must hold before and after any unmount-cleanup change)', () => {
    it('clears an attribute field value from form.values when the parent no longer has a value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();
      await wrapper.find('#text\\.lang').setValue('en');
      await flushPromises();

      expect(formValues(wrapper).text?.lang).toBe('en');

      await wrapper.find('#text').setValue('');
      await flushPromises();

      expect(formValues(wrapper).text?.lang).toBeUndefined();
    });

    it('clears a plain field value from form.values once it is removed and its item unmounts', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'firstName', type: 'text' },
            { name: 'lastName', type: 'text' },
          ],
        },
      });
      await flushPromises();

      await wrapper.find('#lastName').setValue('Smith');
      await flushPromises();
      expect(formValues(wrapper).lastName).toBe('Smith');

      await wrapper.setProps({
        metadata: [
          { name: 'firstName', type: 'text' },
        ],
      });
      await flushPromises();

      expect(formValues(wrapper).lastName).toBeUndefined();
    });

    it('lets a computeOnChildValueChange parent observe a child unmounting, not just a stale snapshot', async () => {
      let updatedValue: any = {};
      const buildMetadata = (withLastName: boolean): Metadata[] => [{
        name: 'person',
        type: 'text',
        computeOnChildValueChange: true,
        computedProps: [(_f, v) => {
          updatedValue = structuredClone(toRaw(v.value));
        }],
        children: withLastName
          ? [{ name: 'firstName', type: 'text' }, { name: 'lastName', type: 'text' }]
          : [{ name: 'firstName', type: 'text' }],
      }];

      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: buildMetadata(true) },
      });
      await flushPromises();

      await wrapper.find('#person\\.lastName').setValue('Smit');
      await flushPromises();

      expect(updatedValue).toMatchObject({ lastName: 'Smit' });

      await wrapper.setProps({ metadata: buildMetadata(false) });
      await flushPromises();

      expect(updatedValue.lastName).toBeUndefined();
    });
  });

  describe('the missing promise: keepValuesOnUnmount and keepValueOnUnmount', () => {
    it('keeps a field value in form.values across unmount when the form-level keepValuesOnUnmount flag is true', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          keepValuesOnUnmount: true,
          metadata: [
            { name: 'firstName', type: 'text' },
            { name: 'lastName', type: 'text' },
          ],
        },
      });
      await flushPromises();

      await wrapper.find('#lastName').setValue('Smith');
      await flushPromises();
      expect(formValues(wrapper).lastName).toBe('Smith');

      await wrapper.setProps({
        metadata: [
          { name: 'firstName', type: 'text' },
        ],
      });
      await flushPromises();

      expect(formValues(wrapper).lastName).toBe('Smith');
    });

    it('keeps a single field value in form.values across unmount when fieldOptions.keepValueOnUnmount is true', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            { name: 'firstName', type: 'text' },
            { name: 'lastName', type: 'text', fieldOptions: { keepValueOnUnmount: true } },
          ],
        },
      });
      await flushPromises();

      await wrapper.find('#firstName').setValue('John');
      await flushPromises();
      await wrapper.find('#lastName').setValue('Smith');
      await flushPromises();

      await wrapper.setProps({ metadata: [] });
      await flushPromises();

      expect(formValues(wrapper).firstName).toBeUndefined();
      expect(formValues(wrapper).lastName).toBe('Smith');
    });

    it('still clears an attribute field value on unmount even when the form-level keepValuesOnUnmount flag is true', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          keepValuesOnUnmount: true,
          metadata: [{
            name: 'text',
            type: 'text',
            attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();
      await wrapper.find('#text\\.lang').setValue('en');
      await flushPromises();

      expect(formValues(wrapper).text?.lang).toBe('en');

      await wrapper.find('#text').setValue('');
      await flushPromises();

      expect(formValues(wrapper).text?.lang).toBeUndefined();
    });

    it('keeps both the owner value and its attribute values across a subtree unmount when keepValuesOnUnmount is true', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          keepValuesOnUnmount: true,
          metadata: [
            {
              name: 'text',
              type: 'text',
              attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
            },
            { name: 'other', type: 'text' },
          ],
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();
      await wrapper.find('#text\\.lang').setValue('en');
      await flushPromises();

      expect(formValues(wrapper).text?.value).toBe('hello');
      expect(formValues(wrapper).text?.lang).toBe('en');

      await wrapper.setProps({
        metadata: [
          { name: 'other', type: 'text' },
        ],
      });
      await flushPromises();

      expect(formValues(wrapper).text?.value).toBe('hello');
      expect(formValues(wrapper).text?.lang).toBe('en');
    });

    it('clears both the owner value and its attribute values across a subtree unmount when keepValuesOnUnmount is not set', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [
            {
              name: 'text',
              type: 'text',
              attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
            },
            { name: 'other', type: 'text' },
          ],
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();
      await wrapper.find('#text\\.lang').setValue('en');
      await flushPromises();

      expect(formValues(wrapper).text?.lang).toBe('en');

      await wrapper.setProps({
        metadata: [
          { name: 'other', type: 'text' },
        ],
      });
      await flushPromises();

      expect(formValues(wrapper).text?.value).toBeUndefined();
      expect(formValues(wrapper).text?.lang).toBeUndefined();
    });

    it('preserves both the owner value and its attribute values when the whole form unmounts under keepValuesOnUnmount', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          keepValuesOnUnmount: true,
          metadata: [{
            name: 'text',
            type: 'text',
            attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();
      await wrapper.find('#text\\.lang').setValue('en');
      await flushPromises();

      const values = (wrapper.vm as any).$.setupState.values;
      expect(values.text?.value).toBe('hello');
      expect(values.text?.lang).toBe('en');

      wrapper.unmount();
      await flushPromises();

      expect(values.text?.value).toBe('hello');
      expect(values.text?.lang).toBe('en');
    });
  });
});
