import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TestForm from '@/examples/TestForm.vue';
import { formValues, setupState } from './DynamicFormItem.test-helpers';

describe('component DynamicFormItem - logic', () => {
  describe('isComplexType', () => {
    it('stores a normal field value directly at the field path', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text' }] },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(formValues(wrapper).text).toBe('hello');
    });

    it('stores a complexType field value nested under a "value" property by default', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text', isComplexType: true }] },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(formValues(wrapper).text?.value).toBe('hello');
    });

    it('uses a normalized vee-validate path of "fieldname.value" for complexType fields', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text', isComplexType: true }] },
      });
      await flushPromises();

      expect(setupState(wrapper, 'text')?.normalizedPath).toBe('text.value');
    });

    it('is implicitly set when a field has attributes', async () => {
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

      // A field with attributes is treated as a complex type: value is nested under "value"
      expect(formValues(wrapper).text?.value).toBe('hello');
    });

    it('uses a normalized vee-validate path of "fieldname.value" when a field has attributes', async () => {
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

      expect(setupState(wrapper, 'text')?.normalizedPath).toBe('text.value');
    });
  });

  describe('complexTypeValueProperty', () => {
    it('defaults to "value" when complexTypeValueProperty is not configured', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: { metadata: [{ name: 'text', type: 'text', isComplexType: true }] },
      });
      await flushPromises();

      expect(setupState(wrapper, 'text')?.normalizedPath).toBe('text.value');
    });

    it('stores the value under the custom property when settings.complexTypeValueProperty is configured', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', type: 'text', isComplexType: true }],
          settings: { complexTypeValueProperty: 'content' },
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(formValues(wrapper).text?.content).toBe('hello');
    });

    it('uses a normalized vee-validate path of "fieldname.<property>" when complexTypeValueProperty is configured', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', type: 'text', isComplexType: true }],
          settings: { complexTypeValueProperty: 'content' },
        },
      });
      await flushPromises();

      expect(setupState(wrapper, 'text')?.normalizedPath).toBe('text.content');
    });
  });
});
