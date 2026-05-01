import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { toRaw } from 'vue';
import TestForm from '@/examples/TestForm.vue';
import { formValues, setupState } from './DynamicFormItem.test-helpers';

function addButton(wrapper: ReturnType<typeof mount>, path: string) {
  return wrapper.find(`[data-testid="${path}-add-button"]`);
}

function findDynamicFormItemByPath(wrapper: ReturnType<typeof mount>, path: string) {
  const item = wrapper.findAllComponents({ name: 'DynamicFormItem' })
    .find(component => (component.vm as any).$.setupState.path === path);

  expect(item).toBeDefined();
  return item!;
}

describe('component DynamicFormItemArray - logic', () => {
  describe('isComplexType', () => {
    it('stores each array occurrence under the complexType value property when the field has attributes', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            fieldOptions: { label: 'Items' },
            maxOccurs: 3,
            attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('input[id="items[0]"]').setValue('hello world');
      await flushPromises();

      await wrapper.find('input[id="items[0].lang"]').setValue('en');
      await flushPromises();

      const values = formValues(wrapper);
      expect(values.items?.[0]?.value).toBe('hello world');
      expect(values.items?.[0]?.lang).toBe('en');
    });
  });

  describe('path', () => {
    it('stores array values at the correct deep explicit path', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'contacts',
            path: 'person.details.contacts',
            type: 'text',
            maxOccurs: 3,
          }],
        },
      });
      await flushPromises();

      await wrapper.find('input[id="person.details.contacts[0]"]').setValue('john@example.com');
      await flushPromises();

      expect(formValues(wrapper).person?.details?.contacts?.[0]).toBe('john@example.com');
    });

    it('uses a normalized path of "field[index].value" for complex array items by default', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'contacts',
            type: 'text',
            maxOccurs: 3,
            attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
          }],
        },
      });
      await flushPromises();

      expect(setupState(wrapper, 'contacts[0]')?.normalizedPath).toBe('contacts[0].value');
    });

    it('respects settings.complexTypeValueProperty for array items', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'contacts',
            type: 'text',
            maxOccurs: 3,
            attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
          }],
          settings: { complexTypeValueProperty: 'content' },
        },
      });
      await flushPromises();

      expect(setupState(wrapper, 'contacts[0]')?.normalizedPath).toBe('contacts[0].content');
    });
  });

  describe('index', () => {
    it('sets the index for each rendered array occurrence', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            fieldOptions: { label: 'Items' },
            maxOccurs: 3,
          }],
        },
      });
      await flushPromises();

      await addButton(wrapper, 'items').trigger('click');
      await flushPromises();

      expect(findDynamicFormItemByPath(wrapper, 'items[0]').props('index')).toBe(0);
      expect(findDynamicFormItemByPath(wrapper, 'items[1]').props('index')).toBe(1);
    });
  });

  describe('computedProps', () => {
    it('re-computes when a child value changes inside an array occurrence and computeOnChildValueChange is true', async () => {
      let updateCount = 0;
      let updatedValue: unknown = {};
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'people',
            type: 'heading',
            fieldOptions: { label: 'People' },
            maxOccurs: 3,
            computeOnChildValueChange: true,
            computedProps: [(field, value) => {
              if (field.path !== 'people[0]')
                return;
              updateCount++;
              updatedValue = structuredClone(toRaw(value.value));
            }],
            children: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('input[id="people[0].firstName"]').setValue('John');
      await flushPromises();

      expect(updateCount).toBe(3);
      expect(updatedValue).toEqual({
        firstName: 'John',
      });

      await wrapper.find('input[id="people[0].firstName"]').setValue('John update');
      await flushPromises();

      expect(updateCount).toBe(4);
      expect(updatedValue).toEqual({
        firstName: 'John update',
      });

      await wrapper.find('input[id="people[0].lastName"]').setValue('Smit');
      await flushPromises();

      expect(updateCount).toBe(5);
      expect(updatedValue).toEqual({
        firstName: 'John update',
        lastName: 'Smit',
      });
    });

    it('does not re-compute when computeOnChildValueChange is false', async () => {
      let updateCount = 0;
      let updatedValue: unknown = {};
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'people',
            type: 'heading',
            fieldOptions: { label: 'People' },
            maxOccurs: 3,
            computedProps: [(field, value) => {
              if (field.path !== 'people[0]')
                return;
              updateCount++;
              updatedValue = structuredClone(toRaw(value.value));
            }],
            children: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
            ],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('input[id="people[0].firstName"]').setValue('John');
      await flushPromises();

      expect(updatedValue).toEqual({});
      expect(updateCount).toBe(2);

      await wrapper.find('input[id="people[0].lastName"]').setValue('Smit');
      await flushPromises();

      expect(updatedValue).toEqual({});
      expect(updateCount).toBe(2);
    });
  });

  describe('attributes', () => {
    it('clears all nested attribute values for an array occurrence when the main value is cleared', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            maxOccurs: 3,
            attributes: [{
              name: 'lang',
              type: 'text',
              minOccurs: 0,
              attributes: [{
                name: 'region',
                type: 'text',
                minOccurs: 0,
                maxOccurs: 3,
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

      await wrapper.find('input[id="items[0]"]').setValue('hello');
      await flushPromises();
      await wrapper.find('input[id="items[0].lang"]').setValue('nl');
      await flushPromises();
      await wrapper.find('input[id="items[0].lang.region[0]"]').setValue('BE');
      await flushPromises();
      await wrapper.find('input[id="items[0].lang.region[0].dialect"]').setValue('brussels');
      await flushPromises();

      const beforeClear = formValues(wrapper).items?.[0];
      expect(beforeClear).toEqual({
        value: 'hello',
        lang: { value: 'nl', region: [{ value: 'BE', dialect: 'brussels' }] },
      });

      await wrapper.find('input[id="items[0]"]').setValue('');
      await flushPromises();

      const afterClear = formValues(wrapper).items?.[0];
      expect(afterClear?.lang?.value).toBeUndefined();
      expect(afterClear?.lang?.region?.value).toBeUndefined();
      expect(afterClear?.lang?.region?.dialect).toBeUndefined();
    });

    it('only renders attribute inputs for an array occurrence once the main value is present', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            maxOccurs: 3,
            attributes: [{ name: 'lang', type: 'text', minOccurs: 0 }],
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('input[id="items[0].lang"]').exists()).toBe(false);

      await wrapper.find('input[id="items[0]"]').setValue('hello');
      await flushPromises();

      expect(wrapper.find('input[id="items[0].lang"]').exists()).toBe(true);
    });
  });

  describe('computedProps / childFields', () => {
    it('array occurrences are accessible in the array field childFields', async () => {
      let capturedOccurrencePaths: string[] = [];
      mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            maxOccurs: 3,
            computedProps: [(f, _v, childFields) => {
              // Only aggregate for the parent-level array field, not for occurrences
              if (f.path === 'items')
                capturedOccurrencePaths = childFields.value.map(c => c.path as string).filter(Boolean);
            }],
          }],
        },
      });
      await flushPromises();

      expect(capturedOccurrencePaths).toContain('items[0]');
    });

    it('propagates a child-field change through an occurrence up to the outer array field', async () => {
      // Structure: people (array, maxOccurs=3, children: firstName, lastName)
      // people[0].firstName becomes disabled → people[0] detects this via childFields and
      // disables itself → DynamicFormItemArray forwards the event → people detects the change
      // via its own childFields and increments disabledOccurrenceCount.
      let disabledOccurrenceCount = 0;
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'people',
            type: 'heading',
            maxOccurs: 3,
            computedProps: [
              // Occurrence level: disable the occurrence when any of its children are disabled
              (f, _v, childFields) => {
                if (f.path !== 'people' && childFields.value.some(c => c.disabled))
                  f.disabled = true;
              },
              // Array level: track how many occurrences are disabled
              (f, _v, childFields) => {
                if (f.path === 'people') {
                  disabledOccurrenceCount = childFields.value.filter(c => c.disabled).length;
                  childFields.value.forEach(() => {}); // subscribe to childFields reactivity
                }
              },
            ],
            children: [
              {
                name: 'firstName',
                type: 'text',
                computedProps: [(f, v) => {
                  if (v.value === 'disable')
                    f.disabled = true;
                }],
              },
              { name: 'lastName', type: 'text' },
            ],
          }],
        },
      });
      await flushPromises();

      expect(disabledOccurrenceCount).toBe(0);

      await wrapper.find('input[id="people[0].firstName"]').setValue('disable');
      await flushPromises();

      expect(disabledOccurrenceCount).toBe(1);
    });

    it('hides a parent group in view mode when its direct array child has no value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          initialEdit: false,
          hideFieldsWithoutValue: true,
          metadata: [{
            name: 'contact',
            type: 'heading',
            fieldOptions: { label: 'Contact' },
            children: [{
              name: 'emails',
              type: 'text',
              maxOccurs: 3,
              minOccurs: 0,
              fieldOptions: { label: 'Emails' },
            }],
          }],
        },
      });
      await flushPromises();

      expect(wrapper.text()).not.toContain('Contact');
      expect(wrapper.text()).not.toContain('Emails');
    });

    it('keeps a parent group visible in view mode when its direct array child has a value', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          initialEdit: false,
          hideFieldsWithoutValue: true,
          initialValues: {
            contact: {
              emails: ['john@example.com'],
            },
          },
          metadata: [{
            name: 'contact',
            type: 'heading',
            fieldOptions: { label: 'Contact' },
            children: [{
              name: 'emails',
              type: 'text',
              maxOccurs: 3,
              minOccurs: 0,
              fieldOptions: { label: 'Emails' },
            }],
          }],
        },
      });
      await flushPromises();

      expect(wrapper.text()).toContain('Contact');
      expect(wrapper.text()).toContain('Emails');
      expect((wrapper.find('input[id="contact.emails[0]"]').element as HTMLInputElement).value).toBe('john@example.com');
    });
  });

  describe('nested metadata', () => {
    it('supports array occurrences that mix child arrays with normal fields', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'people',
            type: 'heading',
            fieldOptions: { label: 'People' },
            maxOccurs: 3,
            children: [
              { name: 'firstName', type: 'text' },
              { name: 'lastName', type: 'text' },
              { name: 'phones', type: 'text', maxOccurs: 2 },
              { name: 'address', type: 'text' },
            ],
          }],
        },
      });
      await flushPromises();

      await wrapper.find('input[id="people[0].firstName"]').setValue('John');
      await flushPromises();
      await wrapper.find('input[id="people[0].lastName"]').setValue('Doe');
      await flushPromises();
      await wrapper.find('input[id="people[0].phones[0]"]').setValue('+31 123 456 789');
      await flushPromises();
      await wrapper.find('input[id="people[0].address"]').setValue('Main Street 1');
      await flushPromises();

      const person = formValues(wrapper).people?.[0];
      expect(person?.firstName).toBe('John');
      expect(person?.lastName).toBe('Doe');
      expect(person?.phones).toEqual(['+31 123 456 789']);
      expect(person?.address).toBe('Main Street 1');
    });
  });

  describe('slotProps', () => {
    it('forwards slot attributes added by the array template to each rendered occurrence', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            fieldOptions: { label: 'Items' },
            maxOccurs: 3,
          }],
        },
      });
      await flushPromises();

      expect(findDynamicFormItemByPath(wrapper, 'items[0]').props('slotProps')).toEqual({ hideLabel: true });
    });
  });

  describe('autoAddMinOccurs', () => {
    it('auto-adds an initial item by default (autoAddMinOccurs omitted)', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            maxOccurs: 3,
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('input[id="items[0]"]').exists()).toBe(true);
    });

    it('auto-adds an initial item when autoAddMinOccurs is true', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            maxOccurs: 3,
            autoAddMinOccurs: true,
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('input[id="items[0]"]').exists()).toBe(true);
    });

    it('does not auto-add an initial item when autoAddMinOccurs is false', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            maxOccurs: 3,
            autoAddMinOccurs: false,
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('input[id="items[0]"]').exists()).toBe(false);
    });

    it('does not auto-add items to satisfy minOccurs when autoAddMinOccurs is false', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            maxOccurs: 3,
            minOccurs: 2,
            autoAddMinOccurs: false,
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('input[id="items[0]"]').exists()).toBe(false);
      expect(wrapper.find('input[id="items[1]"]').exists()).toBe(false);
    });

    it('still allows manually adding items when autoAddMinOccurs is false', async () => {
      const wrapper = mount(TestForm, {
        attachTo: document.body,
        props: {
          metadata: [{
            name: 'items',
            type: 'text',
            maxOccurs: 3,
            autoAddMinOccurs: false,
          }],
        },
      });
      await flushPromises();

      expect(wrapper.find('input[id="items[0]"]').exists()).toBe(false);

      await addButton(wrapper, 'items').trigger('click');
      await flushPromises();

      expect(wrapper.find('input[id="items[0]"]').exists()).toBe(true);
    });
  });
});
