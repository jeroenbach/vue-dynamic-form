import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { toRaw } from 'vue';
import TestForm from '@/examples/TestForm.vue';
import { formValues, setupState } from './DynamicFormItem.test-helpers';

/** Reads a value at a dot-notation path from a plain object. */
function getAtPath(obj: Record<string, any>, path: string): unknown {
  return path.split('.').reduce((acc, key) => acc?.[key], obj as any);
}

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

  describe('path', () => {
    it('children of a field with path "" have their values at the root of the form', async () => {
      // When a parent's path is explicitly set to "", the parent segment is omitted from children's paths.
      // This allows flattening a group of fields to the form root instead of nesting them under a key.
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'group',
            path: '',
            type: 'text',
            children: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('#firstName').setValue('John');
      await wrapper.find('#lastName').setValue('Doe');
      await flushPromises();

      const values = formValues(wrapper);
      expect(values.firstName).toBe('John');
      expect(values.lastName).toBe('Doe');
      expect(values.group).toBeUndefined();
    });

    it('stores a value at the correct location for a deep explicit path', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', path: 'this.is.a.deep.path', type: 'text' }],
        },
      });
      await flushPromises();

      await wrapper.find('#this\\.is\\.a\\.deep\\.path').setValue('hello');
      await flushPromises();

      expect(getAtPath(formValues(wrapper), 'this.is.a.deep.path')).toBe('hello');
    });

    it('stores a complexType value nested under the correct property for a deep explicit path', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{ name: 'text', path: 'this.is.a.deep.path', type: 'text', isComplexType: true }],
        },
      });
      await flushPromises();

      await wrapper.find('#this\\.is\\.a\\.deep\\.path').setValue('hello');
      await flushPromises();

      expect(getAtPath(formValues(wrapper), 'this.is.a.deep.path.value')).toBe('hello');
      expect(setupState(wrapper, 'this.is.a.deep.path')?.normalizedPath).toBe('this.is.a.deep.path.value');
    });
  });

  describe('computedProps', () => {
    it('re-computes when a child value changes and computeOnChildValueChange is true', async () => {
      let updatedValue: unknown = {};
      let updateCount = 0;
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'text',
            fieldOptions: { label: 'Person' },
            computeOnChildValueChange: true,
            computedProps: [(f, v) => {
              updateCount++;
              updatedValue = v.value;
            }],
            children: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('#person\\.firstName').setValue('John');
      await flushPromises();

      // updateCount is already 3 here: computedField runs once on initial render (+1), then again
      // each time a child field registers via useField — vee-validate replaces the parent's object
      // reference in the reactive form store when initializing person.firstName and person.lastName,
      // which invalidates computedField because computedProps accessed v.value (+2).
      // computeOnChildValueChange only controls tracking of childValueReactivity for subsequent
      // value updates; it does not suppress these initial registration-triggered re-runs.
      expect(updateCount).toBe(3);
      expect(updatedValue).toEqual({
        firstName: 'John',
      });

      await wrapper.find('#person\\.firstName').setValue('John update');
      await flushPromises();

      expect(updateCount).toBe(4);
      expect(updatedValue).toEqual({
        firstName: 'John update',
      });

      await wrapper.find('#person\\.lastName').setValue('Smit');
      await flushPromises();

      expect(updateCount).toBe(5);
      expect(updatedValue).toEqual({
        firstName: 'John update',
        lastName: 'Smit',
      });
    });
    it('does not re-computes when a child value changes and computeOnChildValueChange is false', async () => {
      let updatedValue: unknown = {};
      let updateCount = 0;
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'text',
            fieldOptions: { label: 'Person' },
            computedProps: [(f, v) => {
              updateCount++;
              // for testing we clone, to make sure we don't have a reference to the object that gets updated
              updatedValue = structuredClone(toRaw(v.value));
            }],
            children: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('#person\\.firstName').setValue('John');
      await flushPromises();

      expect(updatedValue).toEqual({});
      expect(updateCount).toBe(2);

      await wrapper.find('#person\\.lastName').setValue('Smit');
      await flushPromises();

      expect(updatedValue).toEqual({});
      expect(updateCount).toBe(2);
    });
  });

  describe('attributes', () => {
    it('clears the attribute value when the main field value is cleared', async () => {
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

      await wrapper.find('#text\\.lang').setValue('nl');
      await flushPromises();

      expect(formValues(wrapper).text).toEqual({ value: 'hello', lang: 'nl' });

      // Clearing the main value unmounts the attribute DynamicFormItem, whose
      // onBeforeUnmount hook sets the attribute value back to undefined.
      await wrapper.find('#text').setValue('');
      await flushPromises();

      expect(formValues(wrapper).text?.lang).toBeUndefined();
    });

    it('clears all nested attribute values when the root field value is cleared', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            attributes: [{
              name: 'lang',
              type: 'text',
              minOccurs: 0,
              attributes: [{
                name: 'region',
                type: 'text',
                minOccurs: 0,
                attributes: [{
                  name: 'dialect',
                  type: 'text',
                  minOccurs: 0,
                }],
              }],
            }],
          }],
        },
      });
      await flushPromises();

      // Fill in each level in order — each attribute only appears once its parent has a value
      await wrapper.find('#text').setValue('hello');
      await flushPromises();
      await wrapper.find('#text\\.lang').setValue('nl');
      await flushPromises();
      await wrapper.find('#text\\.lang\\.region').setValue('BE');
      await flushPromises();
      await wrapper.find('#text\\.lang\\.region\\.dialect').setValue('brussels');
      await flushPromises();

      expect(formValues(wrapper).text).toEqual({
        value: 'hello',
        lang: { value: 'nl', region: { value: 'BE', dialect: 'brussels' } },
      });

      // Clearing the root value unmounts the whole attribute tree; each level's
      // onBeforeUnmount hook clears its own value bottom-up (dialect → region → lang).
      await wrapper.find('#text').setValue('');
      await flushPromises();

      expect(formValues(wrapper).text?.lang?.value).toBeUndefined();
      expect(formValues(wrapper).text?.lang?.region?.value).toBeUndefined();
      expect(formValues(wrapper).text?.lang?.region?.dialect).toBeUndefined();
    });

    it('does not render the attribute input before the main field has a value', async () => {
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

      expect(wrapper.find('#text\\.lang').exists()).toBe(false);

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(wrapper.find('#text\\.lang').exists()).toBe(true);
    });
  });
});
