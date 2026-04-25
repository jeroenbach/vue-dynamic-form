import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { toRaw } from 'vue';
import TestForm from '@/examples/TestForm.vue';
import { formValues, setupState } from './DynamicFormItem.test-helpers';

/** Reads a value at a dot-notation path from a plain object. */
function getAtPath(obj: Record<string, any>, path: string): unknown {
  return path.split('.').reduce((acc, key) => acc?.[key], obj as any);
}

function findDynamicFormItemByPath(wrapper: ReturnType<typeof mount>, path: string) {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItem' })
    .find(component => (component.vm as any).$.setupState.path === path);

  expect(item).toBeDefined();
  return item!;
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

  describe('index', () => {
    it('sets the index for child fields based on their position in the parent children collection', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'heading',
            children: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          }],
        },
      });
      await flushPromises();

      expect(findDynamicFormItemByPath(wrapper, 'person.firstName').props('index')).toBe(0);
      expect(findDynamicFormItemByPath(wrapper, 'person.lastName').props('index')).toBe(1);
    });

    it('sets the index for attribute fields based on their position in the parent attributes collection', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'text',
            type: 'text',
            attributes: [
              { name: 'lang', type: 'text', minOccurs: 0 },
              { name: 'source', type: 'text', minOccurs: 0 },
            ],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('#text').setValue('hello');
      await flushPromises();

      expect(findDynamicFormItemByPath(wrapper, 'text.lang').props('index')).toBe(0);
      expect(findDynamicFormItemByPath(wrapper, 'text.source').props('index')).toBe(1);
    });
  });

  describe('computedProps', () => {
    describe('childFields', () => {
      it('provides direct children computed fields as the third argument', async () => {
        let capturedPaths: string[] = [];
        mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'parent',
              type: 'text',
              computedProps: [(_f, _v, childFields) => {
                capturedPaths = childFields.value.map(c => c.path as string).filter(Boolean);
              }],
              children: [
                { name: 'firstName', type: 'text' },
                { name: 'lastName', type: 'text' },
              ],
            }],
          },
        });
        await flushPromises();

        expect(capturedPaths).toContain('parent.firstName');
        expect(capturedPaths).toContain('parent.lastName');
      });

      it('re-computes when a child computed field hash changes', async () => {
        let updateCount = 0;
        let disabledChildCount = 0;
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'parent',
              type: 'text',
              computedProps: [(_f, _v, childFields) => {
                updateCount++;
                disabledChildCount = childFields.value.filter(c => c.disabled).length;
              }],
              children: [{
                name: 'child',
                type: 'text',
                computedProps: [(f, v) => {
                  if (v.value)
                    f.disabled = true;
                }],
              }],
            }],
          },
        });
        await flushPromises();

        expect(disabledChildCount).toBe(0);
        const countBeforeChange = updateCount;

        await wrapper.find('#parent\\.child').setValue('hello');
        await flushPromises();

        expect(updateCount).toBeGreaterThan(countBeforeChange);
        expect(disabledChildCount).toBe(1);
      });

      it('does not re-compute when the child computed field hash is unchanged', async () => {
        let updateCount = 0;
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'parent',
              type: 'text',
              computedProps: [(_f, _v, childFields) => {
                updateCount++;
                childFields.value.forEach(() => {}); // subscribe to childFields reactivity
              }],
              children: [{
                name: 'child',
                type: 'text',
                computedProps: [(f, v) => {
                  if (v.value)
                    f.disabled = true;
                }],
              }],
            }],
          },
        });
        await flushPromises();

        // Set 'hello' — child becomes disabled, hash changes, parent re-computes
        await wrapper.find('#parent\\.child').setValue('hello');
        await flushPromises();
        const countAfterFirstChange = updateCount;

        // Set 'world' — child stays disabled (same hash), parent should NOT re-compute
        await wrapper.find('#parent\\.child').setValue('world');
        await flushPromises();

        expect(updateCount).toBe(countAfterFirstChange);
      });

      it('hides the parent when all children report as hidden via childFields', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            metadata: [{
              name: 'parent',
              type: 'text',
              computedProps: [(thisField, _v, childFields) => {
                if (childFields.value.length > 0 && childFields.value.every(c => c.hidden))
                  thisField.hidden = true;
              }],
              children: [
                {
                  name: 'child1',
                  type: 'text',
                  minOccurs: 0,
                  computedProps: [(f) => { f.hidden = true; }],
                },
                {
                  name: 'child2',
                  type: 'text',
                  minOccurs: 0,
                  computedProps: [(f) => { f.hidden = true; }],
                },
              ],
            }],
          },
        });
        await flushPromises();

        expect(setupState(wrapper, 'parent')?.computedField.hidden).toBe(true);
      });
      it('hides a parent group in view mode when all direct child fields have no value', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            initialEdit: false,
            hideFieldsWithoutValue: true,
            metadata: [{
              name: 'person',
              type: 'heading',
              fieldOptions: { label: 'Personal Info' },
              children: [
                { name: 'firstName', type: 'text', minOccurs: 0, fieldOptions: { label: 'First Name' } },
                { name: 'lastName', type: 'text', minOccurs: 0, fieldOptions: { label: 'Last Name' } },
              ],
            }],
          },
        });
        await flushPromises();

        expect(wrapper.text()).not.toContain('Personal Info');
        expect(wrapper.text()).not.toContain('First Name');
        expect(wrapper.text()).not.toContain('Last Name');
      });

      it('keeps a parent group visible in view mode when a direct child field has a value', async () => {
        const wrapper = mount(TestForm, {
          attachTo: document.body,
          props: {
            initialEdit: false,
            hideFieldsWithoutValue: true,
            initialValues: {
              person: {
                firstName: 'Jack',
              },
            },
            metadata: [{
              name: 'person',
              type: 'heading',
              fieldOptions: { label: 'Personal Info' },
              children: [
                { name: 'firstName', type: 'text', minOccurs: 0, fieldOptions: { label: 'First Name' } },
                { name: 'lastName', type: 'text', minOccurs: 0, fieldOptions: { label: 'Last Name' } },
              ],
            }],
          },
        });
        await flushPromises();

        expect(wrapper.text()).toContain('Personal Info');
        expect(wrapper.text()).toContain('First Name');
        expect(wrapper.text()).not.toContain('Last Name');
        expect((wrapper.find('input[id="person.firstName"]').element as HTMLInputElement).value).toBe('Jack');
      });
    });

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
            computedProps: [(_f, v) => {
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
            computedProps: [(_f, v) => {
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

  describe('slotProps', () => {
    it('forwards slot attributes added by parent templates to nested child items', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'person',
            type: 'heading',
            fieldOptions: { label: 'Person' },
            children: [{
              name: 'address',
              type: 'heading',
              fieldOptions: { label: 'Address' },
              children: [{ name: 'street', type: 'text' }],
            }],
          }],
        },
      });
      await flushPromises();

      expect(findDynamicFormItemByPath(wrapper, 'person.address').props('slotProps')).toEqual({ level: 1 });
      expect(findDynamicFormItemByPath(wrapper, 'person.address.street').props('slotProps')).toEqual({ level: 2 });
    });
  });
});
